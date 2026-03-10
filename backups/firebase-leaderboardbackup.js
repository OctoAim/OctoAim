// Firebase Leaderboard System for Aim Trainer
// ===============================================
// Firebase config from OctoAim project
const firebaseConfig = {
    apiKey: "AIzaSyBLnHaXUJsxsimqH1o6KJ8TEEGqRQ0Wcak",
    authDomain: "octoaim.firebaseapp.com",
    projectId: "octoaim",
    storageBucket: "octoaim.firebasestorage.app",
    messagingSenderId: "629745818659",
    appId: "1:629745818659:web:eb0f7be2f095dd0284a596"
};

// Game IDs mapping
const gameNames = {
    '360Aim': '360° Aim Tracker',
    'flick': '360° Flick Trainer',
    'bounceTracker': 'Bounce Tracker',
    'reactionTrainer': 'Reaction Trainer',
    'microflick': 'Micro Flick Trainer',
    'glider': 'Glider Trainer',
    'staticPrecision': 'Static Precision',
    'jumppeek': 'Jump Peek Trainer'
};

const gameIcons = {
    '360Aim': '🎯', 'flick': '⚡', 'bounceTracker': '🏀', 'reactionTrainer': '⚡',
    'microflick': '🔴', 'glider': '⬇️', 'staticPrecision': '🎯', 'jumppeek': '⬆️'
};

const games = ['360Aim', 'flick', 'bounceTracker', 'reactionTrainer', 'microflick', 'glider', 'staticPrecision', 'jumppeek'];

let db = null;
let currentUserId = null;
let currentUsername = null;
let firebaseReady = false;
let leaderboardData = {};
let userStats = {};

// Initialize Firebase - Call this on page load
async function initFirebaseLeaderboard() {
    try {
        // Import Firebase SDKs
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js");
        const { getFirestore, collection, addDoc, query, orderBy, limit, where, getDocs, getCountFromServer } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
        
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        
        // Generate or get user ID
        currentUserId = localStorage.getItem('aimtrainer_userid');
        if (!currentUserId) {
            currentUserId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('aimtrainer_userid', currentUserId);
        }
        
        currentUsername = localStorage.getItem('aimtrainer_username') || 'Player';
        
        firebaseReady = true;
        console.log('🔥 Firebase Leaderboard connected!');
        
        // Load initial data
        await loadAllLeaderboards();
        
        return true;
    } catch (e) {
        console.error('Firebase init error:', e);
        return false;
    }
}

// Submit score to leaderboard
async function submitScore(gameId, score, difficulty) {
    if (!firebaseReady || difficulty !== 'hard') return false;
    
    try {
        const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
        
        await addDoc(collection(db, 'leaderboard'), {
            gameId: gameId,
            score: parseInt(score),
            userId: currentUserId,
            username: currentUsername,
            timestamp: Date.now()
        });
        
        console.log('✅ Score submitted to leaderboard!');
        
        // Refresh leaderboard
        await loadLeaderboard(gameId);
        await updateUserStats(gameId);
        
        return true;
    } catch (e) {
        console.error('Error submitting score: ', e);
        return false;
    }
}

// Get top scores for a game
async function getTopScores(gameId, count = 10) {
    if (!firebaseReady) return [];
    
    try {
        const { collection, query, orderBy, limit, where, getDocs } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
        
        const q = query(
            collection(db, 'leaderboard'),
            where('gameId', '==', gameId),
            orderBy('score', 'desc'),
            limit(count)
        );
        const snapshot = await getDocs(q);
        
        const results = [];
        let rank = 1;
        snapshot.forEach(doc => {
            const data = doc.data();
            results.push({
                rank: rank++,
                username: data.username || 'Anonymous',
                score: data.score,
                isMe: data.userId === currentUserId
            });
        });
        return results;
    } catch (e) {
        console.error('Error getting scores: ', e);
        return [];
    }
}

// Get user's percentile for a game
async function getUserPercentile(gameId, userScore) {
    if (!firebaseReady || !userScore) return null;
    
    try {
        const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
        
        // Get total count
        const totalQuery = query(collection(db, 'leaderboard'), where('gameId', '==', gameId));
        const totalSnapshot = await getDocs(totalQuery);
        const totalCount = totalSnapshot.size;
        
        if (totalCount === 0) return null;
        
        // Count scores higher than user's
        let higherCount = 0;
        totalSnapshot.forEach(doc => {
            if (doc.data().score > parseInt(userScore)) {
                higherCount++;
            }
        });
        
        const percentile = Math.round((1 - (higherCount / totalCount)) * 100);
        return Math.max(1, percentile);
    } catch (e) {
        console.error('Error calculating percentile: ', e);
        return null;
    }
}

// Get user's rank
async function getUserRank(gameId, userScore) {
    if (!firebaseReady || !userScore) return null;
    
    try {
        const { collection, query, orderBy, where, getDocs } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
        
        const q = query(
            collection(db, 'leaderboard'),
            where('gameId', '==', gameId),
            orderBy('score', 'desc')
        );
        const snapshot = await getDocs(q);
        
        let rank = null;
        let i = 1;
        snapshot.forEach(doc => {
            if (doc.data().userId === currentUserId && rank === null) {
                rank = i;
            }
            i++;
        });
        return rank;
    } catch (e) {
        console.error('Error getting rank: ', e);
        return null;
    }
}

// Get total players count
async function getTotalPlayers(gameId) {
    if (!firebaseReady) return 0;
    
    try {
        const { collection, query, where, getCountFromServer } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
        
        const q = query(collection(db, 'leaderboard'), where('gameId', '==', gameId));
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    } catch (e) {
        return 0;
    }
}

// Load leaderboard for a specific game
async function loadLeaderboard(gameId) {
    const scores = await getTopScores(gameId, 10);
    leaderboardData[gameId] = scores;
    return scores;
}

// Load all leaderboards
async function loadAllLeaderboards() {
    for (const gameId of games) {
        await loadLeaderboard(gameId);
    }
}

// Update user stats for a game
async function updateUserStats(gameId) {
    const pb = localStorage.getItem('aimtrainer_hard_' + gameId);
    if (!pb) return;
    
    const percentile = await getUserPercentile(gameId, pb);
    const rank = await getUserRank(gameId, pb);
    const total = await getTotalPlayers(gameId);
    
    userStats[gameId] = {
        pb: pb,
        percentile: percentile,
        rank: rank,
        totalPlayers: total
    };
}

// Update all user stats
async function updateAllUserStats() {
    for (const gameId of games) {
        await updateUserStats(gameId);
    }
}

// Render leaderboard for all games
function renderAllLeaderboards() {
    let html = '';
    
    games.forEach(gameId => {
        const scores = leaderboardData[gameId] || [];
        const gameName = gameNames[gameId] || gameId;
        const icon = gameIcons[gameId] || '🎮';
        const stats = userStats[gameId];
        
        html += `
            <div class="leaderboard-game-section">
                <div class="leaderboard-game-header">
                    <span class="leaderboard-game-icon">${icon}</span>
                    <h3>${gameName}</h3>
                </div>
                ${stats && stats.percentile ? `
                <div class="how-you-compare">
                    <div class="compare-box">
                        <div class="compare-stat">
                            <span class="compare-value">Top ${stats.percentile}%</span>
                            <span class="compare-label">Worldwide</span>
                        </div>
                        ${stats.rank ? `
                        <div class="compare-stat">
                            <span class="compare-value">#${stats.rank}</span>
                            <span class="compare-label">Rank</span>
                        </div>
                        ` : ''}
                        ${stats.totalPlayers ? `
                        <div class="compare-stat">
                            <span class="compare-value">${stats.totalPlayers}</span>
                            <span class="compare-label">Players</span>
                        </div>
                        ` : ''}
                    </div>
                ` : ''}
                <div class="leaderboard-list">
        `;
        
        if (scores.length === 0) {
            html += '<p class="no-scores">No scores yet. Be the first!</p>';
        } else {
            scores.forEach((entry, index) => {
                const rowClass = entry.isMe ? 'leaderboard-row me' : 'leaderboard-row';
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                html += `
                    <div class="${rowClass}">
                        <span class="rank">${medal || '#' + entry.rank}</span>
                        <span class="username">${escapeHtml(entry.username)}</span>
                        <span class="score">${entry.score}</span>
                    </div>
                `;
            });
        }
        
        html += '</div>';
    });
    
    return html;
}

// Helper to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check if Firebase is ready
function isFirebaseReady() {
    return firebaseReady;
}

console.log('🎯 Aim Trainer Leaderboard System loaded!');
