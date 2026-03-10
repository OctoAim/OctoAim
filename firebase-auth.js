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
// Daily quests now change every day and use dailyGamesPlayed variable
const QUESTS = {
    daily: [
        { id: 'play_3', name: 'Play 3 Games', desc: 'Complete 3 hard mode games today', target: 3, reward: 25, type: 'games' },
        { id: 'score_1000', name: 'Score Master', desc: 'Score over 1000 in any game', target: 1000, reward: 50, type: 'score' },
        { id: 'play_specific', name: 'Variety Pack', desc: 'Play 2 different trainers today', target: 2, reward: 35, type: 'variety' }
    ],
    weekly: [
        { id: 'play_20', name: 'Dedicated', desc: 'Complete 20 hard mode games', target: 20, reward: 150 },
        { id: 'score_5000', name: 'High Scorer', desc: 'Score over 5000 in any game', target: 5000, reward: 300 },
        { id: 'all_games', name: 'Full Practice', desc: 'Play all 8 trainers at least once', target: 8, reward: 200 }
    ]
};

// Generate daily quests based on the day (changes every 24 hours)
function generateDailyQuests() {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('aimtrainer_daily_quests_date');
    
    // Check if we need to generate new quests for today
    if (storedDate !== today) {
        // Generate new random quests for today
        const allPossibleQuests = [
            { id: 'play_3', name: 'Play 3 Games', desc: 'Complete 3 hard mode games today', target: 3, reward: 25, type: 'games' },
            { id: 'play_5', name: 'Getting Warmed Up', desc: 'Complete 5 hard mode games today', target: 5, reward: 40, type: 'games' },
            { id: 'score_500', name: 'Quick Score', desc: 'Score over 500 in any game', target: 500, reward: 20, type: 'score' },
            { id: 'score_1000', name: 'Score Master', desc: 'Score over 1000 in any game', target: 1000, reward: 50, type: 'score' },
            { id: 'score_2000', name: 'High Scorer', desc: 'Score over 2000 in any game', target: 2000, reward: 75, type: 'score' },
            { id: 'play_2', name: 'Quick Practice', desc: 'Play 2 hard mode games today', target: 2, reward: 15, type: 'games' },
            { id: 'variety_2', name: 'Variety Pack', desc: 'Play 2 different trainers today', target: 2, reward: 35, type: 'variety' },
            { id: 'variety_3', name: 'Explorer', desc: 'Play 3 different trainers today', target: 3, reward: 50, type: 'variety' }
        ];
        
        // Shuffle and pick 3 random quests
        const shuffled = allPossibleQuests.sort(() => 0.5 - Math.random());
        const dailyQuests = shuffled.slice(0, 3);
        
        // Save to localStorage
        localStorage.setItem('aimtrainer_daily_quests', JSON.stringify(dailyQuests));
        localStorage.setItem('aimtrainer_daily_quests_date', today);
        
        // Reset daily progress
        localStorage.setItem('aimtrainer_dailyGamesPlayed', '0');
        localStorage.setItem('aimtrainer_dailyGamesPlayedSet', JSON.stringify([]));
        
        console.log('New daily quests generated for', today);
        return dailyQuests;
    }
    
    // Return stored quests
    return JSON.parse(localStorage.getItem('aimtrainer_daily_quests') || '[]');
}

// Get daily games played today
function getDailyGamesPlayed() {
    return parseInt(localStorage.getItem('aimtrainer_dailyGamesPlayed') || '0');
}

// Get the set of unique games played today
function getDailyGamesPlayedSet() {
    return JSON.parse(localStorage.getItem('aimtrainer_dailyGamesPlayedSet') || '[]');
}

// Track a game played today
function trackDailyGame(gameId) {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('aimtrainer_daily_games_date');
    
    // Reset if it's a new day
    if (storedDate !== today) {
        localStorage.setItem('aimtrainer_dailyGamesPlayed', '0');
        localStorage.setItem('aimtrainer_dailyGamesPlayedSet', '[]');
        localStorage.setItem('aimtrainer_daily_games_date', today);
    }
    
    // Increment games played
    const current = getDailyGamesPlayed();
    localStorage.setItem('aimtrainer_dailyGamesPlayed', (current + 1).toString());
    
    // Add to set of unique games
    const gameSet = getDailyGamesPlayedSet();
    if (!gameSet.includes(gameId)) {
        gameSet.push(gameId);
        localStorage.setItem('aimtrainer_dailyGamesPlayedSet', JSON.stringify(gameSet));
    }
}

// Get quests with proper claim status from localStorage
function getQuests() {
    const claimedQuests = JSON.parse(localStorage.getItem('aimtrainer_claimed_quests') || '{}');
    const today = new Date().toDateString();
    const lastClaimDate = localStorage.getItem('aimtrainer_quest_date');
    
    // Reset daily quests if it's a new day
    if (lastClaimDate !== today) {
        localStorage.setItem('aimtrainer_quest_date', today);
        localStorage.setItem('aimtrainer_claimed_quests', '{}');
    }
    
    // Generate or get today's daily quests
    const dailyQuests = generateDailyQuests();
    
    // Get daily progress
    const dailyGamesPlayed = getDailyGamesPlayed();
    const dailyGamesSet = getDailyGamesPlayedSet();
    const dailyHighScore = parseInt(localStorage.getItem('aimtrainer_daily_high_score') || '0');
    
    // Build quests object with progress
    const allQuests = {
        daily: [],
        weekly: []
    };
    
    // Add daily quests with progress
    dailyQuests.forEach(q => {
        let progress = 0;
        if (q.type === 'games') {
            progress = dailyGamesPlayed;
        } else if (q.type === 'score') {
            progress = dailyHighScore;
        } else if (q.type === 'variety') {
            progress = dailyGamesSet.length;
        }
        
        allQuests.daily.push({
            ...q,
            progress: progress,
            claimed: claimedQuests['daily_' + q.id] || false
        });
    });
    
    // Weekly quests remain the same
    const weeklyGamesPlayed = parseInt(localStorage.getItem('aimtrainer_total_runs') || '0');
    const weeklyHighScore = parseInt(localStorage.getItem('aimtrainer_weekly_high_score') || '0');
    const weeklyGamesSet = JSON.parse(localStorage.getItem('aimtrainer_weekly_games_played') || '[]');
    
    QUESTS.weekly.forEach(q => {
        let progress = 0;
        if (q.id === 'play_20') {
            progress = weeklyGamesPlayed;
        } else if (q.id === 'score_5000') {
            progress = weeklyHighScore;
        } else if (q.id === 'all_games') {
            progress = weeklyGamesSet.length;
        }
        
        allQuests.weekly.push({
            ...q,
            progress: progress,
            claimed: claimedQuests['weekly_' + q.id] || false
        });
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
                
                // Start high score sync to Firebase (new feature)
                startHighScoreSync();
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
            // Get photoURL from Firebase Auth if available (for Google sign-in)
            const photoURL = currentUser?.photoURL || 
                            currentUser?.providerData?.[0]?.photoURL || 
                            currentUser?.providerData?.[0]?.providerId === 'google.com' 
                                ? `https://www.gravatar.com/avatar/${currentUser.uid}?d=mp` 
                                : null;
            
            // Get display name from Google or email
            const displayName = currentUser?.displayName || 
                              currentUser?.email?.split('@')[0] || 
                              'Player';
            
            userProfile = {
                uid: uid,
                username: displayName,
                email: currentUser.email,
                photoURL: photoURL,
                coins: 50,
                skins: ['default'],
                equippedSkin: 'default'
            };
            await db.collection('users').doc(uid).set(userProfile);
        }
        
        // Save to localStorage for persistence
        localStorage.setItem('aimtrainer_coins', userProfile.coins);
        localStorage.setItem('aimtrainer_skins', JSON.stringify(userProfile.skins));
        localStorage.setItem('aimtrainer_equipped_skin', userProfile.equippedSkin);
        localStorage.setItem('aimtrainer_username', userProfile.username);
        
        // Save photoURL if available
        if (userProfile.photoURL) {
            localStorage.setItem('aimtrainer_photoURL', userProfile.photoURL);
        } else {
            // Try to get from current Firebase user
            const authPhotoURL = currentUser?.photoURL || 
                               currentUser?.providerData?.[0]?.photoURL;
            if (authPhotoURL) {
                localStorage.setItem('aimtrainer_photoURL', authPhotoURL);
            }
        }
        
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
        // FIRST: Check if username is available (before creating account)
        const usernameCheck = await db.collection('users')
            .where('usernameLower', '==', username.toLowerCase())
            .limit(1).get();
        
        if (!usernameCheck.empty) {
            return { success: false, error: 'username-already-taken' };
        }
        
        // SECOND: Check if email is already registered
        // We do this by trying to create the account and catching the error
        // But first, let's check if there's a user with this email in our users collection
        const emailCheck = await db.collection('users')
            .where('emailLower', '==', email.toLowerCase())
            .limit(1).get();
        
        if (!emailCheck.empty) {
            return { success: false, error: 'email-already-in-use' };
        }
        
        // NOW create the account
        const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        const userReferralCode = 'OCTO' + Math.random().toString(36).substr(2, 6).toUpperCase();
        
        // Get Google photo if signed in with Google
        const photoURL = cred.additionalUserInfo?.profile?.picture || null;
        
        await db.collection('users').doc(cred.user.uid).set({
            uid: cred.user.uid,
            username: username,
            usernameLower: username.toLowerCase(),
            email: email,
            emailLower: email.toLowerCase(),
            photoURL: photoURL,
            coins: 50,
            skins: ['default'],
            equippedSkin: 'default',
            referralCode: userReferralCode,
            referrals: 0
        });
        
        // Save to localStorage
        localStorage.setItem('aimtrainer_username', username);
        localStorage.setItem('aimtrainer_referral_code', userReferralCode);
        if (photoURL) {
            localStorage.setItem('aimtrainer_photoURL', photoURL);
        }
        
        // Clear the explicit logout flag so user stays logged in on reload
        localStorage.removeItem('aimtrainer_logged_out');
        
        return { success: true, user: cred.user };
    } catch (e) {
        console.error('Sign up error:', e);
        // Handle specific Firebase auth errors
        if (e.code === 'auth/email-already-in-use') {
            return { success: false, error: 'email-already-in-use' };
        }
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
        
        // Get the Google profile photo
        const googlePhotoURL = cred.additionalUserInfo?.profile?.picture || null;
        
        // Clear the explicit logout flag so user stays logged in on reload
        localStorage.removeItem('aimtrainer_logged_out');
        
        // If this is a new user (no profile yet), the onAuthStateChanged will handle it
        // But let's save the photo URL immediately if we have it
        if (googlePhotoURL) {
            localStorage.setItem('aimtrainer_photoURL', googlePhotoURL);
        }
        
        return { success: true, user: cred.user };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function logOut() {
    // Mark as explicitly logged out so we don't try to auto-restore
    localStorage.setItem('aimtrainer_logged_out', 'true');
    
    // First, sign out from Firebase to clear the cached session
    if (firebaseReady && auth) {
        try {
            await firebase.auth().signOut();
            console.log('Firebase session cleared');
        } catch (e) {
            console.log('Firebase logout error:', e);
        }
    }
    
    // Clear all user-specific localStorage data when logging out
    // This prevents old account data from showing on new accounts
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('aimtrainer_')) {
            keysToRemove.push(key);
        }
    }
    
    // Remove all aimtrainer keys
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });
    
    // Re-set the logged_out flag after clearing
    localStorage.setItem('aimtrainer_logged_out', 'true');
    
    // Reset all global variables
    currentUser = null;
    userProfile = null;
    
    // Update UI to show logged out state
    updateAuthUI(false);
    
    // Reload the page to ensure clean state
    window.location.reload();
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
    const photoURL = localStorage.getItem('aimtrainer_photoURL');
    const displayName = userProfile?.username || username;
    
    // Calculate rank
    let rank = 'Bronze';
    if (totalRuns >= 100) rank = 'Diamond';
    else if (totalRuns >= 50) rank = 'Platinum';
    else if (totalRuns >= 25) rank = 'Gold';
    else if (totalRuns >= 10) rank = 'Silver';
    
    // Get modal elements by ID
    const avatarDisplay = document.getElementById('profile-avatar-display');
    const usernameEl = document.getElementById('profile-username');
    const rankEl = document.getElementById('profile-rank');
    const coinsEl = document.getElementById('profile-coins');
    const gamesEl = document.getElementById('profile-games');
    
    // Set avatar - show photo if available, otherwise show letter
    if (photoURL || userProfile?.photoURL) {
        const url = photoURL || userProfile.photoURL;
        if (avatarDisplay) {
            avatarDisplay.innerHTML = '<img src="' + url + '" alt="' + displayName + '" id="profile-avatar-img" onerror="this.style.display=\'none\'; document.getElementById(\'profile-avatar-letter\').style.display=\'block\';">' +
                '<span class="avatar-letter" id="profile-avatar-letter" style="display:none;">' + displayName.charAt(0).toUpperCase() + '</span>';
        }
    } else {
        if (avatarDisplay) {
            avatarDisplay.innerHTML = '<span class="avatar-letter" id="profile-avatar-letter">' + displayName.charAt(0).toUpperCase() + '</span>';
        }
    }
    
    if (usernameEl) usernameEl.textContent = displayName;
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
    const photoURL = localStorage.getItem('aimtrainer_photoURL');
    
    if (isLoggedIn && userProfile) {
        // Build avatar HTML - show photo if available, otherwise show first letter
        let avatarHTML = '';
        const displayName = userProfile.username || username;
        
        // Check for photoURL from multiple sources
        const userPhotoURL = userProfile?.photoURL || photoURL || currentUser?.photoURL || currentUser?.providerData?.[0]?.photoURL;
        
        if (userPhotoURL) {
            avatarHTML = `<img src="${userPhotoURL}" alt="${displayName}" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'avatar-letter\\'>${displayName.charAt(0).toUpperCase()}</span>'">`;
        } else {
            avatarHTML = `<span class="avatar-letter">${displayName.charAt(0).toUpperCase()}</span>`;
        }
        
        authSection.innerHTML = `
            <div class="user-avatar" onclick="showProfileCard()" title="Click to view profile: ${displayName}">
                ${avatarHTML}
            </div>
            <div class="user-info">
                <span class="username">${displayName}</span>
                <span class="coins">🪙 ${coins}</span>
            </div>
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

// ==================== NEW LEADERBOARD SYSTEM ====================
// Weekly/Monthly leaderboards with auto-sync every 5 minutes
// Only stores 1 score per person (their best)

// Sync interval in milliseconds (5 minutes)
const LEADERBOARD_SYNC_INTERVAL = 300000;

// Get current period start times
function getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart.getTime();
}

function getMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

// Sync user's high scores to Firebase
async function syncHighScoresToFirebase() {
    if (!firebaseReady || !currentUser) return;
    
    try {
        const userId = currentUser.uid;
        const username = userProfile?.username || localStorage.getItem('aimtrainer_username') || 'Player';
        const now = Date.now();
        
        // Get all game high scores from localStorage
        const games = ['360Aim', 'flick', 'bounceTracker', 'reactionTrainer', 'microflick', 'glider', 'staticPrecision', 'jumppeek'];
        
        for (const gameId of games) {
            const hardScore = localStorage.getItem('aimtrainer_hard_' + gameId);
            if (!hardScore) continue;
            
            const score = parseInt(hardScore);
            
            // Update all-time leaderboard (single document per user per game)
            await db.collection('leaderboard_alltime').doc(userId + '_' + gameId).set({
                userId: userId,
                username: username,
                gameId: gameId,
                score: score,
                updatedAt: now
            }, { merge: true });
            
            // Update weekly leaderboard
            const weekStart = getWeekStart();
            await db.collection('leaderboard_weekly').doc(userId + '_' + gameId + '_' + weekStart).set({
                userId: userId,
                username: username,
                gameId: gameId,
                score: score,
                weekStart: weekStart,
                updatedAt: now
            }, { merge: true });
            
            // Update monthly leaderboard
            const monthStart = getMonthStart();
            await db.collection('leaderboard_monthly').doc(userId + '_' + gameId + '_' + monthStart).set({
                userId: userId,
                username: username,
                gameId: gameId,
                score: score,
                monthStart: monthStart,
                updatedAt: now
            }, { merge: true });
        }
        
        console.log('✅ High scores synced to Firebase!');
    } catch (e) {
        console.error('Error syncing high scores:', e);
    }
}

// Get leaderboard by period (alltime, weekly, monthly)
async function getLeaderboardByPeriod(gameId, period = 'alltime', count = 5) {
    if (!firebaseReady) return [];
    
    try {
        let collectionName = 'leaderboard_alltime';
        if (period === 'weekly') {
            collectionName = 'leaderboard_weekly';
        } else if (period === 'monthly') {
            collectionName = 'leaderboard_monthly';
        }
        
        // For weekly/monthly, we need to filter by current period
        let query = db.collection(collectionName)
            .where('gameId', '==', gameId)
            .orderBy('score', 'desc')
            .limit(count);
        
        const snapshot = await query.get();
        
        const results = [];
        let rank = 1;
        const userId = currentUser?.uid || 'local_user';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            results.push({
                rank: rank++,
                username: data.username || 'Anonymous',
                score: data.score,
                isMe: data.userId === userId
            });
        });
        
        return results;
    } catch (e) {
        console.error('Error getting ' + period + ' leaderboard:', e);
        return [];
    }
}

// Get weekly leaderboard (convenience function)
async function getWeeklyLeaderboard(gameId, count = 5) {
    return getLeaderboardByPeriod(gameId, 'weekly', count);
}

// Get monthly leaderboard (convenience function)
async function getMonthlyLeaderboard(gameId, count = 5) {
    return getLeaderboardByPeriod(gameId, 'monthly', count);
}

// Get all-time leaderboard (convenience function)
async function getAllTimeLeaderboard(gameId, count = 5) {
    return getLeaderboardByPeriod(gameId, 'alltime', count);
}

// Legacy function - now uses all-time
async function getGlobalLeaderboard(gameId, count = 5) {
    return getAllTimeLeaderboard(gameId, count);
}

// Submit score - now also syncs immediately
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
        const now = Date.now();
        
        console.log('Submitting score to leaderboard:', { gameId, score, username, userId });
        
        // Also add to the legacy leaderboard for backward compatibility
        await db.collection('leaderboard').add({
            gameId: gameId,
            score: parseInt(score),
            userId: userId,
            username: username,
            timestamp: now
        });
        
        // Update user's best score documents (new system)
        if (currentUser) {
            await syncHighScoresToFirebase();
        }
        
        console.log('Score submitted successfully!');
        return true;
    } catch (e) {
        console.error('Error submitting score to leaderboard:', e);
        return false;
    }
}

// Start periodic high score sync (every 5 minutes)
let highScoreSyncInterval = null;
function startHighScoreSync() {
    if (highScoreSyncInterval) clearInterval(highScoreSyncInterval);
    
    // Sync immediately on start
    if (currentUser && firebaseReady) {
        syncHighScoresToFirebase();
    }
    
    // Then sync every 5 minutes
    highScoreSyncInterval = setInterval(() => {
        if (currentUser && firebaseReady) {
            console.log('🔄 Syncing high scores to Firebase...');
            syncHighScoresToFirebase();
        }
    }, LEADERBOARD_SYNC_INTERVAL);
}

// Make global
window.initFirebaseAuth = initFirebaseAuth;
window.signUp = signUp;
window.signIn = signIn;
window.signInWithGoogle = signInWithGoogle;
window.logOut = logOut;
window.submitGlobalScore = submitGlobalScore;
window.getGlobalLeaderboard = getGlobalLeaderboard;
window.getAllTimeLeaderboard = getAllTimeLeaderboard;
window.getWeeklyLeaderboard = getWeeklyLeaderboard;
window.getMonthlyLeaderboard = getMonthlyLeaderboard;
window.getLeaderboardByPeriod = getLeaderboardByPeriod;
window.syncHighScoresToFirebase = syncHighScoresToFirebase;
window.startHighScoreSync = startHighScoreSync;
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
window.getDailyGamesPlayed = getDailyGamesPlayed;
window.getDailyGamesPlayedSet = getDailyGamesPlayedSet;
window.trackDailyGame = trackDailyGame;
window.generateDailyQuests = generateDailyQuests;

console.log('Firebase Auth System loaded - FIXED VERSION');

