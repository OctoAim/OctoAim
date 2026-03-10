// Firebase Authentication System - FIXED VERSION
// Uses localStorage for offline support, Firebase when available

const firebaseAuthConfig = {
    apiKey: "AIzaSyBLnHaXUJsxsimqH1o6KJ8TEEGqRQ0Wcak",
    authDomain: "octoaim.firebaseapp.com",
    projectId: "octoaim",
    storageBucket: "octoaim.firebasestorage.app",
    messagingSenderId: "629745818659",
    appId: "1:629745818659:web:eb0f7be2f095dd0284a596"
};

// Game names
const gameNamesMap = {
    '360Aim': '360° Aim Tracker', 'flick': '360° Flick Trainer',
    'bounceTracker': 'Bounce Tracker', 'reactionTrainer': 'Reaction Trainer',
    'microflick': 'Micro Flick Trainer', 'glider': 'Glider Trainer',
    'staticPrecision': 'Static Precision', 'jumppeek': 'Jump Peek Trainer'
};

// Auth state
let auth = null;
let db = null;
let currentUser = null;
let userProfile = null;
let firebaseReady = false;

// Skins
const SKINS = {
    default: { id: 'default', name: 'Default Red', price: 0, color: 0xff2244, emissive: 0xff1122 },
    neonBlue: { id: 'neonBlue', name: 'Neon Blue', price: 100, color: 0x00ccff, emissive: 0x0088ff },
    fireRed: { id: 'fireRed', name: 'Fire Red', price: 150, color: 0xff4400, emissive: 0xff2200 },
    golden: { id: 'golden', name: 'Golden', price: 300, color: 0xffd700, emissive: 0xffaa00 },
    rainbow: { id: 'rainbow', name: 'Rainbow', price: 500, color: 0xff00ff, emissive: 0xaa00ff },
    toxic: { id: 'toxic', name: 'Toxic Green', price: 200, color: 0x00ff44, emissive: 0x00ff22 },
    purple: { id: 'purple', name: 'Purple Rain', price: 250, color: 0x8800ff, emissive: 0x6600ff },
    white: { id: 'white', name: 'Pure White', price: 175, color: 0xffffff, emissive: 0xaaaaaa },
    black: { id: 'black', name: 'Midnight', price: 125, color: 0x222222, emissive: 0x111111 },
    orange: { id: 'orange', name: 'Sunset Orange', price: 180, color: 0xff6600, emissive: 0xff4400 }
};

// Quests - with proper claim tracking
const QUESTS = {
    daily: [
        { id: 'play_3', name: 'Play 3 Games', desc: 'Complete 3 hard mode games', target: 3, reward: 25 },
        { id: 'score_1000', name: 'Score Master', desc: 'Score over 1000 in any game', target: 1000, reward: 50 },
        { id: 'play_specific', name: 'Variety Pack', desc: 'Play 2 different trainers', target: 2, reward: 35 }
    ],
    weekly: [
        { id: 'play_20', name: 'Dedicated', desc: 'Complete 20 hard mode games', target: 20, reward: 150 },
        { id: 'score_5000', name: 'High Scorer', desc: 'Score over 5000 in any game', target: 5000, reward: 300 },
        { id: 'all_games', name: 'Full Practice', desc: 'Play all 8 trainers at least once', target: 8, reward: 200 }
    ]
};

// Get quests with proper claim status from localStorage
function getQuests() {
    const claimedQuests = JSON.parse(localStorage.getItem('aimtrainer_claimed_quests') || '{}');
    const today = new Date().toDateString();
    const lastClaimDate = localStorage.getItem('aimtrainer_quest_date');
    
    // Reset daily quests if it's a new day
    if (lastClaimDate !== today) {
        localStorage.setItem('aimtrainer_quest_date', today);
        localStorage.setItem('aimtrainer_claimed_quests', '{}');
        localStorage.removeItem('quest_progress_daily_play_3');
        localStorage.removeItem('quest_progress_daily_score_1000');
        localStorage.removeItem('quest_progress_daily_play_specific');
    }
    
    const allQuests = JSON.parse(JSON.stringify(QUESTS));
    
    // Mark claimed quests
    allQuests.daily.forEach(q => {
        q.claimed = claimedQuests['daily_' + q.id] || false;
    });
    allQuests.weekly.forEach(q => {
        q.claimed = claimedQuests['weekly_' + q.id] || false;
    });
    
    return allQuests;
}

// Initialize Firebase
async function initFirebaseAuth() {
    try {
        // Load Firebase compat version (provides global firebase object)
        const script1 = document.createElement('script');
        script1.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
        document.head.appendChild(script1);
        await new Promise(resolve => script1.onload = resolve);
        
        const script2 = document.createElement('script');
        script2.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js';
        document.head.appendChild(script2);
        await new Promise(resolve => script2.onload = resolve);
        
        const script3 = document.createElement('script');
        script3.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js';
        document.head.appendChild(script3);
        await new Promise(resolve => script3.onload = resolve);
        
        // Initialize Firebase
        const app = firebase.initializeApp(firebaseAuthConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Enable offline persistence for data syncing
        db.enablePersistence({ synchronizeTabs: true }).catch(err => {
            console.log('Persistence error:', err.code);
        });
        
        // Test Firestore connection
        try {
            await db.collection('leaderboard').limit(1).get();
            firebaseReady = true;
            console.log('✅ Firebase connected successfully!');
        } catch (connErr) {
            if (connErr.message && connErr.message.includes('not-found')) {
                console.log('⚠️ Firestore database not found. Using offline mode.');
                firebaseReady = false;
            } else {
                firebaseReady = true;
                console.log('✅ Firebase connected!');
            }
        }
        
        // Listen for auth changes - handles auto-login
        firebase.auth().onAuthStateChanged(async (user) => {
            console.log('Auth state changed:', user ? user.email : 'logged out');
            if (user) {
                currentUser = user;
                await loadUserProfile(user.uid);
                updateAuthUI(true);
                
                // Sync local data with Firebase
                await syncUserData();
                
                // Start leaderboard refresh interval
                startLeaderboardRefresh();
            } else {
                // Check if user explicitly logged out
                const explicitlyLoggedOut = localStorage.getItem('aimtrainer_logged_out') === 'true';
                if (!explicitlyLoggedOut) {
                    console.log('No user, but not explicitly logged out');
                }
                currentUser = null;
                userProfile = null;
                updateAuthUI(false);
            }
        });
        
        return true;
    } catch (e) {
        console.log('Firebase error:', e.message);
        firebaseReady = false;
        console.log('Using offline mode');
        return false;
    }
}

// Sync local data with Firebase after login
async function syncUserData() {
    if (!currentUser || !firebaseReady) return;
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            const fbData = userDoc.data();
            
            // Merge local coins with Firebase (use higher)
            const localCoins = parseInt(localStorage.getItem('aimtrainer_coins') || '0');
            const fbCoins = fbData.coins || 0;
            const mergedCoins = Math.max(localCoins, fbCoins);
            
            // Merge skins
            const localSkins = JSON.parse(localStorage.getItem('aimtrainer_skins') || '["default"]');
            const fbSkins = fbData.skins || ['default'];
            const mergedSkins = [...new Set([...localSkins, ...fbSkins])];
            
            // Update Firebase with merged data
            await db.collection('users').doc(currentUser.uid).update({
                coins: mergedCoins,
                skins: mergedSkins,
                equippedSkin: fbData.equippedSkin || 'default'
            });
            
            // Update local storage
            localStorage.setItem('aimtrainer_coins', mergedCoins);
            localStorage.setItem('aimtrainer_skins', JSON.stringify(mergedSkins));
            localStorage.setItem('aimtrainer_equipped_skin', fbData.equippedSkin || 'default');
            localStorage.setItem('aimtrainer_username', fbData.username);
            
            console.log('Data synced:', { coins: mergedCoins, skins: mergedSkins.length });
        }
    } catch (e) {
        console.log('Sync error:', e);
    }
}

// Start periodic leaderboard refresh (every 5 minutes)
let leaderboardInterval = null;
function startLeaderboardRefresh() {
    if (leaderboardInterval) clearInterval(leaderboardInterval);
    
    // Refresh every 5 minutes (300000 ms)
    leaderboardInterval = setInterval(() => {
        if (typeof loadLeaderboardForGame === 'function') {
            console.log('🔄 Refreshing leaderboard...');
            loadLeaderboardForGame();
        }
    }, 300000);
}

async function loadUserProfile(uid) {
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
            userProfile = doc.data();
        } else {
            userProfile = {
                uid: uid,
                username: currentUser.displayName || currentUser.email.split('@')[0],
                email: currentUser.email,
                coins: 50,
                skins: ['default'],
                equippedSkin: 'default'
            };
            await db.collection('users').doc(uid).set(userProfile);
        }
        localStorage.setItem('aimtrainer_coins', userProfile.coins);
        localStorage.setItem('aimtrainer_skins', JSON.stringify(userProfile.skins));
        localStorage.setItem('aimtrainer_equipped_skin', userProfile.equippedSkin);
        localStorage.setItem('aimtrainer_username', userProfile.username);
        return userProfile;
    } catch (e) {
        console.log('Error loading profile:', e);
        return null;
    }
}

async function signUp(email, password, username) {
    if (!firebaseReady) {
        return { success: false, error: 'Firebase not loaded. Try refreshing.' };
    }
    try {
        const usernameCheck = await db.collection('users')
            .where('usernameLower', '==', username.toLowerCase())
            .limit(1).get();
        
        if (!usernameCheck.empty) {
            return { success: false, error: 'Username already taken. Choose a different one.' };
        }
        
        const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        const userReferralCode = 'OCTO' + Math.random().toString(36).substr(2, 6).toUpperCase();
        
        await db.collection('users').doc(cred.user.uid).set({
            uid: cred.user.uid,
            username: username,
            usernameLower: username.toLowerCase(),
            email: email,
            coins: 50,
            skins: ['default'],
            equippedSkin: 'default',
            referralCode: userReferralCode,
            referrals: 0
        });
        
        localStorage.setItem('aimtrainer_username', username);
        localStorage.setItem('aimtrainer_referral_code', userReferralCode);
        
        // Clear the explicit logout flag so user stays logged in on reload
        localStorage.removeItem('aimtrainer_logged_out');
        
        return { success: true, user: cred.user };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function signIn(email, password) {
    if (!firebaseReady) {
        return { success: false, error: 'Firebase not loaded. Try refreshing.' };
    }
    try {
        const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
        // Clear the explicit logout flag so user stays logged in on reload
        localStorage.removeItem('aimtrainer_logged_out');
        return { success: true, user: cred.user };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function signInWithGoogle() {
    if (!firebaseReady) {
        return { success: false, error: 'Firebase not loaded. Try refreshing.' };
    }
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const cred = await firebase.auth().signInWithPopup(provider);
        // Clear the explicit logout flag so user stays logged in on reload
        localStorage.removeItem('aimtrainer_logged_out');
        return { success: true, user: cred.user };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function logOut() {
    // Mark as explicitly logged out so we don't try to auto-restore
    localStorage.setItem('aimtrainer_logged_out', 'true');
    
    if (firebaseReady && auth) {
        try {
            await firebase.auth().signOut();
        } catch (e) {
            console.log('Logout error:', e);
        }
    }
    currentUser = null;
    userProfile = null;
    updateAuthUI(false);
}

// Show profile modal
function showProfileCard() {
    const profileModal = document.getElementById('profile-modal');
    if (!profileModal) {
        // Fallback to alert if modal doesn't exist
        const coins = parseInt(localStorage.getItem('aimtrainer_coins') || '0');
        const username = localStorage.getItem('aimtrainer_username') || 'Player';
        const totalRuns = parseInt(localStorage.getItem('aimtrainer_total_runs') || '0');
        const skins = JSON.parse(localStorage.getItem('aimtrainer_skins') || '["default"]');
        
        let rank = 'Bronze';
        if (totalRuns >= 100) rank = 'Diamond';
        else if (totalRuns >= 50) rank = 'Platinum';
        else if (totalRuns >= 25) rank = 'Gold';
        else if (totalRuns >= 10) rank = 'Silver';
        
        alert(`👤 Profile\n\nUsername: ${username}\n🪙 Coins: ${coins}\n🎮 Total Games: ${totalRuns}\n👑 Rank: ${rank}\n🎨 Skins Owned: ${skins.length}\n\nClick OK to sign out`);
        return;
    }
    
    const coins = parseInt(localStorage.getItem('aimtrainer_coins') || '0');
    const username = localStorage.getItem('aimtrainer_username') || 'Player';
    const totalRuns = parseInt(localStorage.getItem('aimtrainer_total_runs') || '0');
    
    // Calculate rank
    let rank = 'Bronze';
    if (totalRuns >= 100) rank = 'Diamond';
    else if (totalRuns >= 50) rank = 'Platinum';
    else if (totalRuns >= 25) rank = 'Gold';
    else if (totalRuns >= 10) rank = 'Silver';
    
    // Update modal content
    const avatarEl = profileModal.querySelector('.profile-avatar');
    const usernameEl = profileModal.querySelector('.profile-username');
    const rankEl = profileModal.querySelector('.profile-rank');
    const coinsEl = profileModal.querySelectorAll('.profile-stat-value')[0];
    const gamesEl = profileModal.querySelectorAll('.profile-stat-value')[1];
    
    if (avatarEl) avatarEl.textContent = (userProfile?.username || username).charAt(0).toUpperCase();
    if (usernameEl) usernameEl.textContent = userProfile?.username || username;
    if (rankEl) rankEl.textContent = rank;
    if (coinsEl) coinsEl.textContent = coins;
    if (gamesEl) gamesEl.textContent = totalRuns;
    
    // Show modal
    profileModal.classList.add('active');
}

function closeProfileCard() {
    const profileModal = document.getElementById('profile-modal');
    if (profileModal) {
        profileModal.classList.remove('active');
    }
}

function updateAuthUI(isLoggedIn) {
    const authSection = document.getElementById('auth-section');
    if (!authSection) return;
    
    const coins = parseInt(localStorage.getItem('aimtrainer_coins') || '0');
    const username = localStorage.getItem('aimtrainer_username') || 'Player';
    
    if (isLoggedIn && userProfile) {
        authSection.innerHTML = `
            <div class="user-avatar" onclick="showProfileCard()" style="cursor:pointer;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#00ff88,#00cc66);display:flex;align-items:center;justify-content:center;font-weight:bold;color:#000;font-size:18px;">
                ${(userProfile.username || username).charAt(0).toUpperCase()}
            </div>
            <div class="user-info">
                <span class="username">${userProfile.username || username}</span>
                <span class="coins">🪙 ${coins}</span>
            </div>
            <button class="auth-btn logout" onclick="handleLogout()">Sign Out</button>
        `;
    } else {
        authSection.innerHTML = `<button class="auth-btn" onclick="showAuthModal()">Sign In</button>`;
    }
}

function getCurrentSkin() {
    const skinId = localStorage.getItem('aimtrainer_equipped_skin') || 'default';
    return SKINS[skinId] || SKINS.default;
}

// Submit score to global leaderboard - FIXED VERSION
async function submitGlobalScore(gameId, score, difficulty) {
    console.log('submitGlobalScore called:', gameId, score, difficulty, 'firebaseReady:', firebaseReady, 'currentUser:', currentUser);
    
    // Only submit hard mode scores
    if (difficulty !== 'hard') {
        console.log('Not hard mode, skipping leaderboard');
        return false;
    }
    
    // Even if not logged in, try to submit with local username
    if (!firebaseReady) {
        console.log('Firebase not ready, skipping leaderboard');
        return false;
    }
    
    try {
        const username = userProfile?.username || localStorage.getItem('aimtrainer_username') || 'Player';
        const userId = currentUser?.uid || 'local_' + (localStorage.getItem('aimtrainer_userid') || Math.random().toString(36).substr(2, 9));
        
        console.log('Submitting score to leaderboard:', { gameId, score, username, userId });
        
        await db.collection('leaderboard').add({
            gameId: gameId,
            score: parseInt(score),
            userId: userId,
            username: username,
            timestamp: Date.now()
        });
        
        console.log('Score submitted successfully!');
        return true;
    } catch (e) {
        console.error('Error submitting score to leaderboard:', e);
        return false;
    }
}

async function getGlobalLeaderboard(gameId, count = 5) {
    if (!firebaseReady) return [];
    try {
        const snapshot = await db.collection('leaderboard')
            .where('gameId', '==', gameId)
            .orderBy('score', 'desc')
            .limit(count).get();
        const results = [];
        let rank = 1;
        const userId = currentUser?.uid || 'local_user';
        snapshot.forEach(doc => {
            const d = doc.data();
            results.push({ 
                rank: rank++, 
                username: d.username || 'Anonymous', 
                score: d.score, 
                isMe: d.userId === userId 
            });
        });
        return results;
    } catch (e) { 
        console.error('Error getting leaderboard:', e);
        return []; 
    }
}

async function getUserPercentile(gameId, score) {
    if (!firebaseReady || !score) return null;
    try {
        const snapshot = await db.collection('leaderboard').where('gameId', '==', gameId).get();
        const total = snapshot.size;
        if (total === 0) return null;
        let higher = 0;
        snapshot.forEach(d => { if (d.data().score > score) higher++; });
        return Math.max(1, Math.round((1 - higher/total) * 100));
    } catch (e) { return null; }
}

async function buySkin(skinId) {
    const skin = SKINS[skinId];
    if (!skin || skin.price === 0) return { success: false, error: 'Invalid skin' };
    
    const coins = parseInt(localStorage.getItem('aimtrainer_coins') || '0');
    const skins = JSON.parse(localStorage.getItem('aimtrainer_skins') || '["default"]');
    
    if (coins < skin.price) return { success: false, error: 'Not enough coins' };
    if (skins.includes(skinId)) return { success: false, error: 'Already owned' };
    
    skins.push(skinId);
    localStorage.setItem('aimtrainer_skins', JSON.stringify(skins));
    localStorage.setItem('aimtrainer_coins', coins - skin.price);
    return { success: true };
}

async function equipSkin(skinId) {
    localStorage.setItem('aimtrainer_equipped_skin', skinId);
    return { success: true };
}

async function addCoins(amount) {
    const coins = parseInt(localStorage.getItem('aimtrainer_coins') || '0');
    localStorage.setItem('aimtrainer_coins', coins + amount);
    
    // Update UI if exists
    const displayCoins = document.getElementById('display-coins');
    const skinsCoins = document.getElementById('skins-coins');
    if (displayCoins) displayCoins.textContent = coins + amount;
    if (skinsCoins) skinsCoins.textContent = coins + amount;
    
    return true;
}

function addPlayToHistory(gameId, score) {
    const data = { gameId, score, date: Date.now() };
    let history = JSON.parse(localStorage.getItem('aimtrainer_play_history') || '[]');
    history.push(data);
    if (history.length > 50) history = history.slice(-50);
    localStorage.setItem('aimtrainer_play_history', JSON.stringify(history));
    return history;
}

function getPlayHistory(gameId = null) {
    let history = JSON.parse(localStorage.getItem('aimtrainer_play_history') || '[]');
    if (gameId) history = history.filter(h => h.gameId === gameId);
    return history.slice(-20);
}

function generateReferralCode() {
    const code = 'OCTO' + Math.random().toString(36).substr(2, 6).toUpperCase();
    localStorage.setItem('aimtrainer_referral_code', code);
    return code;
}

function getReferralCode() {
    let code = localStorage.getItem('aimtrainer_referral_code');
    if (!code) {
        code = generateReferralCode();
    }
    return code;
}

function reportBug() {
    const subject = encodeURIComponent('OctoAim Bug Report');
    const body = encodeURIComponent(
        'Describe the bug:\n\n\nSteps to reproduce:\n1. \n2. \n3. \n\nExpected behavior:\n\n\nActual behavior:\n\n\nBrowser/Device:\n'
    );
    window.location.href = 'mailto:goldenmacaroni12@gmail.com?subject=' + subject + '&body=' + body;
}

function shareReferral() {
    const code = getReferralCode();
    const link = window.location.origin + window.location.pathname + '?ref=' + code;
    
    navigator.clipboard.writeText(link).then(function() {
        alert('Referral link copied to clipboard!\n\n' + link + '\n\nShare it with friends to earn coins!');
    }).catch(function() {
        prompt('Copy this referral link:', link);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make global
window.initFirebaseAuth = initFirebaseAuth;
window.signUp = signUp;
window.signIn = signIn;
window.signInWithGoogle = signInWithGoogle;
window.logOut = logOut;
window.submitGlobalScore = submitGlobalScore;
window.getGlobalLeaderboard = getGlobalLeaderboard;
window.getUserPercentile = getUserPercentile;
window.buySkin = buySkin;
window.equipSkin = equipSkin;
window.addCoins = addCoins;
window.addPlayToHistory = addPlayToHistory;
window.getPlayHistory = getPlayHistory;
window.getCurrentSkin = getCurrentSkin;
window.getQuests = getQuests;
window.getReferralCode = getReferralCode;
window.reportBug = reportBug;
window.shareReferral = shareReferral;
window.showProfileCard = showProfileCard;
window.closeProfileCard = closeProfileCard;
window.syncUserData = syncUserData;
window.startLeaderboardRefresh = startLeaderboardRefresh;
window.SKINS = SKINS;
window.escapeHtml = escapeHtml;

console.log('Firebase Auth System loaded - FIXED VERSION');

