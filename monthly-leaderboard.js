// ==================== WEEKLY LEADERBOARD SYSTEM ====================
// Tracks total points for the week and awards coins to top 10

// Prize structure for weekly leaderboard
const WEEKLY_PRIZES = {
    1: 200,   // 1st place: 200 coins
    2: 100,   // 2nd place: 100 coins
    3: 50,    // 3rd place: 50 coins
    4: 25,    // 4th: 25 coins
    5: 15,    // 5th: 15 coins
    6: 10,    // 6th: 10 coins
    7: 8,     // 7th: 8 coins
    8: 6,     // 8th: 6 coins
    9: 4,     // 9th: 4 coins
    10: 2     // 10th: 2 coins
};

// Mock offline users for weekly leaderboard (simulated top players)
const WEEKLY_OFFLINE_USERS = [
    { userId: 'bot_week1', username: 'WeekendWarrior', score: 25000, gamesPlayed: 15, avgScore: 1666 },
    { userId: 'bot_week2', username: 'AimNinja', score: 22000, gamesPlayed: 12, avgScore: 1833 },
    { userId: 'bot_week3', username: 'QuickShot', score: 19000, gamesPlayed: 14, avgScore: 1357 },
    { userId: 'bot_week4', username: 'FlickFast', score: 16000, gamesPlayed: 10, avgScore: 1600 },
    { userId: 'bot_week5', username: 'PrecisionKing', score: 14000, gamesPlayed: 11, avgScore: 1272 },
    { userId: 'bot_week6', username: 'TargetMaster', score: 12000, gamesPlayed: 8, avgScore: 1500 },
    { userId: 'bot_week7', username: 'ClickPro', score: 10000, gamesPlayed: 9, avgScore: 1111 },
    { userId: 'bot_week8', username: 'ReflexHero', score: 8000, gamesPlayed: 7, avgScore: 1142 },
    { userId: 'bot_week9', username: 'TrackerPro', score: 6000, gamesPlayed: 6, avgScore: 1000 },
    { userId: 'bot_week10', username: 'Aimbot', score: 4500, gamesPlayed: 5, avgScore: 900 }
];

// Weekly bot names
const WEEKLY_BOT_NAMES = [
    'WeekendWarrior', 'AimNinja', 'QuickShot', 'FlickFast', 'PrecisionKing',
    'TargetMaster', 'ClickPro', 'ReflexHero', 'TrackerPro', 'Aimbot'
];

// Generate random weekly bot scores
function generateWeeklyBotUsers() {
    const bots = [];
    for (let i = 0; i < 10; i++) {
        // Weekly scores: higher players can get 20000-30000, lower get 4000-8000
        const positionFactor = (10 - i) / 10; // 1.0 for 1st place, 0.1 for 10th
        const baseScore = 25000 * positionFactor;
        const variance = Math.random() * 10000 * positionFactor;
        const score = Math.floor(baseScore + variance);
        
        const gamesPlayed = Math.floor(Math.random() * 15) + 3;
        
        bots.push({
            userId: 'bot_week' + (i + 1),
            username: WEEKLY_BOT_NAMES[i],
            score: score,
            gamesPlayed: gamesPlayed,
            avgScore: Math.round(score / gamesPlayed)
        });
    }
    // Sort by score descending
    bots.sort((a, b) => b.score - a.score);
    return bots;
}

// Get weekly offline users (cached until page refresh)
let cachedWeeklyBots = null;
function getWeeklyOfflineUsers() {
    if (!cachedWeeklyBots) {
        cachedWeeklyBots = generateWeeklyBotUsers();
    }
    return cachedWeeklyBots;
}

// Get current week start (Monday 00:00)
function getWeekStartKey() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return `${weekStart.getFullYear()}-W${getWeekNumber(weekStart)}`;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Initialize weekly score for current user
function initWeeklyScore() {
    const weekKey = getWeekStartKey();
    const userId = localStorage.getItem('aimtrainer_userid') || 'guest';
    const storageKey = `weekly_score_${weekKey}_${userId}`;
    
    if (!localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, '0');
    }
    
    return parseInt(localStorage.getItem(storageKey) || '0');
}

// Add score to weekly total
function addToWeeklyScore(score) {
    const weekKey = getWeekStartKey();
    const userId = localStorage.getItem('aimtrainer_userid') || 'guest';
    const storageKey = `weekly_score_${weekKey}_${userId}`;
    
    const currentScore = parseInt(localStorage.getItem(storageKey) || '0');
    const newScore = currentScore + score;
    localStorage.setItem(storageKey, newScore.toString());
    
    // Track games played
    const gamesKey = `weekly_games_${weekKey}_${userId}`;
    const gamesPlayed = parseInt(localStorage.getItem(gamesKey) || '0') + 1;
    localStorage.setItem(gamesKey, gamesPlayed.toString());
    
    // Update global weekly leaderboard
    updateWeeklyLeaderboard(userId, newScore);
    
    return newScore;
}

// Update user's score in the weekly leaderboard
function updateWeeklyLeaderboard(userId, score) {
    const weekKey = getWeekStartKey();
    const lbKey = `weekly_lb_${weekKey}`;
    
    // Get existing leaderboard
    let leaderboard = JSON.parse(localStorage.getItem(lbKey) || '[]');
    
    // Find user in leaderboard
    const userIndex = leaderboard.findIndex(u => u.userId === userId);
    
    if (userIndex >= 0) {
        leaderboard[userIndex].score = score;
    } else {
        // Add new user
        const username = localStorage.getItem('aimtrainer_username') || 'Player';
        leaderboard.push({
            userId: userId,
            username: username,
            score: score
        });
    }
    
    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Keep top 100
    leaderboard = leaderboard.slice(0, 100);
    
    localStorage.setItem(lbKey, JSON.stringify(leaderboard));
}

// Get weekly leaderboard (combines online users + offline bots)
function getWeeklyLeaderboard() {
    const weekKey = getWeekStartKey();
    const lbKey = `weekly_lb_${weekKey}`;
    const onlineUsers = JSON.parse(localStorage.getItem(lbKey) || '[]');
    
    // Get userId
    const userId = localStorage.getItem('aimtrainer_userid') || 'guest';
    
    // Create a map of online users by userId
    const onlineMap = new Map();
    onlineUsers.forEach(u => {
        onlineMap.set(u.userId, u);
    });
    
    let combined = [];

    // Add offline bots first (they have predefined stats - now random!)
    const weeklyOfflineBots = getWeeklyOfflineUsers();
    weeklyOfflineBots.forEach(bot => {
        if (!onlineMap.has(bot.userId)) {
            combined.push({
                ...bot,
                isOffline: true
            });
        }
    });

    // Add online users (their actual scores from localStorage)
    onlineUsers.forEach(user => {
        const existingBot = weeklyOfflineBots.find(b => b.userId === user.userId);
        if (!existingBot) {
            const gamesKey = `weekly_games_${weekKey}_${user.userId}`;
            const gamesPlayed = parseInt(localStorage.getItem(gamesKey)) || Math.floor(Math.random() * 15) + 3;
            const avgScore = user.score > 0 ? Math.round(user.score / gamesPlayed) : 0;
            combined.push({
                ...user,
                gamesPlayed: gamesPlayed,
                avgScore: avgScore,
                isOffline: false
            });
        }
    });
    
    // Sort by score descending
    combined.sort((a, b) => b.score - a.score);
    
    return combined.slice(0, 20);
}

// Get user's rank in weekly leaderboard
function getUserWeeklyRank() {
    const weekKey = getWeekStartKey();
    const userId = localStorage.getItem('aimtrainer_userid') || 'guest';
    const lbKey = `weekly_lb_${weekKey}`;
    const leaderboard = JSON.parse(localStorage.getItem(lbKey) || '[]');
    
    const userIndex = leaderboard.findIndex(u => u.userId === userId);
    return userIndex >= 0 ? userIndex + 1 : null;
}

// Check if weekly prizes have been claimed
function haveWeeklyPrizesBeenClaimed() {
    const weekKey = getWeekStartKey();
    return localStorage.getItem(`weekly_prizes_claimed_${weekKey}`) === 'true';
}

// Claim weekly prizes
function claimWeeklyPrizes() {
    const weekKey = getWeekStartKey();
    const userId = localStorage.getItem('aimtrainer_userid') || 'guest';
    const leaderboard = getWeeklyLeaderboard();
    
    const userRank = leaderboard.findIndex(u => u.userId === userId) + 1;
    
    if (userRank === 0) {
        alert('You are not on the weekly leaderboard yet! Play more games to earn points.');
        return;
    }
    
    if (userRank > 10) {
        alert(`You are ranked #${userRank}. Top 10 players win coins! Keep playing to climb the ranks.`);
        return;
    }
    
    if (localStorage.getItem(`weekly_prize_claimed_${weekKey}_${userId}`) === 'true') {
        alert('You have already claimed your prize for this week!');
        return;
    }
    
    const prize = WEEKLY_PRIZES[userRank] || 0;
    if (prize > 0) {
        const currentCoins = parseInt(localStorage.getItem('aimtrainer_coins') || '0');
        localStorage.setItem('aimtrainer_coins', currentCoins + prize);
        localStorage.setItem(`weekly_prize_claimed_${weekKey}_${userId}`, 'true');
        
        alert(`🎉 Congratulations! You finished #${userRank} on the weekly leaderboard!\n\nYou won ${prize} coins!`);
        
        if (typeof updateCoinsDisplay === 'function') {
            updateCoinsDisplay(currentCoins + prize);
        }
    }
}

// Render weekly leaderboard UI
function renderWeeklyLeaderboard() {
    const container = document.getElementById('weekly-leaderboard-content');
    if (!container) return;
    
    const leaderboard = getWeeklyLeaderboard();
    const userId = localStorage.getItem('aimtrainer_userid') || 'guest';
    const weekKey = getWeekStartKey();
    
    // Get week date range
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekName = `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${weekEnd.getDate()}`;
    
    const userWeeklyScore = parseInt(localStorage.getItem(`weekly_score_${weekKey}_${userId}`) || '0');
    const userRank = leaderboard.findIndex(u => u.userId === userId) + 1;
    const canClaimPrize = userRank > 0 && userRank <= 10 && localStorage.getItem(`weekly_prize_claimed_${weekKey}_${userId}`) !== 'true';
    
    let html = `
        <div class="monthly-lb-header">
            <h2>🏅 ${weekName} Leaderboard</h2>
            <p class="monthly-subtitle">Total Points This Week</p>
        </div>
        
        <div class="monthly-prizes-info">
            <h3>🎁 Weekly Prizes</h3>
            <div class="prizes-grid">
                <div class="prize-item gold"><span class="prize-rank">🥇 1st</span><span class="prize-amount">200 coins</span></div>
                <div class="prize-item silver"><span class="prize-rank">🥈 2nd</span><span class="prize-amount">100 coins</span></div>
                <div class="prize-item bronze"><span class="prize-rank">🥉 3rd</span><span class="prize-amount">50 coins</span></div>
                <div class="prize-item"><span class="prize-rank">4th-10th</span><span class="prize-amount">2-25 coins</span></div>
        </div>
        
        <div class="your-monthly-stats">
            
        </div>
        <div class="monthly-stat">
                <div class="monthly-stat-label">Your Total Points</div>
                <div class="monthly-stat-value">${userWeeklyScore.toLocaleString()}</div>
            </div>
            <div class="monthly-stat">
                <div class="monthly-stat-label">Your Rank</div>
                <div class="monthly-stat-value ${userRank > 0 && userRank <= 10 ? 'top-10' : ''}">#${userRank || '-'}</div>
            </div>
        
        ${canClaimPrize ? `
            <button class="claim-prize-btn" onclick="claimWeeklyPrizes()">
                🎁 Claim Your #${userRank} Prize (${WEEKLY_PRIZES[userRank]} coins)
            </button>
        ` : ''}
        
        <div class="monthly-lb-list">
            <h3>Top Players</h3>
    `;
    
    if (leaderboard.length === 0) {
        html += '<div class="no-scores" style="color: #888; font-size: 16px; padding: 30px; text-align: center;">Be the first to play this week! Start playing to climb the ranks.</div>';
    } else {
        leaderboard.slice(0, 20).forEach((entry, index) => {
            const rank = index + 1;
            const isUser = entry.userId === userId;
            const prize = WEEKLY_PRIZES[rank] || 0;
            const gamesPlayed = entry.gamesPlayed || 0;
            const avgScore = entry.avgScore || 0;
            
            html += `
                <div class="monthly-lb-row ${isUser ? 'current-user' : ''} ${rank <= 3 ? 'top-3' : ''}" 
                     onclick="showPlayerStats('${escapeHtml(entry.username)}', ${entry.score}, ${gamesPlayed}, ${avgScore})"
                     style="cursor: pointer;">
                    <div class="monthly-rank ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : ''}">
                        ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank}
                    </div>
                    <div class="monthly-username">
                        ${escapeHtml(entry.username)}${isUser ? ' (You)' : ''}
                        ${entry.isOffline ? '<span class="offline-badge" title="Offline Player">💤</span>' : ''}
                    </div>
                    <div class="monthly-score">${entry.score.toLocaleString()} pts</div>
                    ${prize > 0 ? `<div class="monthly-prize">🎁 ${prize}</div>` : ''}
                </div>
            `;
        });
    }
    
    html += '</div>';
    
    container.innerHTML = html;
}

// ==================== MONTHLY LEADERBOARD SYSTEM
// Tracks total points for the month and awards coins to top 10

// Prize structure for monthly leaderboard
const MONTHLY_PRIZES = {
    1: 1000,  // 1st place: 1000 coins
    2: 500,   // 2nd place: 500 coins
    3: 250,   // 3rd place: 250 coins
    4: 100,   // 4th: 100 coins
    5: 75,    // 5th: 75 coins
    6: 50,    // 6th: 50 coins
    7: 40,    // 7th: 40 coins
    8: 30,    // 8th: 30 coins
    9: 20,    // 9th: 20 coins
    10: 10    // 10th: 10 coins
};

// Mock offline users to populate leaderboard (simulated top players)
const OFFLINE_USERS = [
    { userId: 'bot_pro1', username: 'ProGamer99', score: 125000, gamesPlayed: 45, avgScore: 2777 },
    { userId: 'bot_pro2', username: 'AimMaster', score: 98000, gamesPlayed: 38, avgScore: 2578 },
    { userId: 'bot_pro3', username: 'NightOwl', score: 87000, gamesPlayed: 52, avgScore: 1673 },
    { userId: 'bot_pro4', username: 'SpeedShot', score: 76000, gamesPlayed: 29, avgScore: 2620 },
    { userId: 'bot_pro5', username: 'TrackerKing', score: 65000, gamesPlayed: 33, avgScore: 1969 },
    { userId: 'bot_pro6', username: 'FlickLord', score: 54000, gamesPlayed: 41, avgScore: 1317 },
    { userId: 'bot_pro7', username: 'PrecisionPro', score: 48000, gamesPlayed: 27, avgScore: 1777 },
    { userId: 'bot_pro8', username: 'ReflexKing', score: 42000, gamesPlayed: 35, avgScore: 1200 },
    { userId: 'bot_pro9', username: 'ClickFast', score: 35000, gamesPlayed: 22, avgScore: 1590 },
    { userId: 'bot_pro10', username: 'AimTrainer', score: 28000, gamesPlayed: 18, avgScore: 1555 },
    { userId: 'bot_pro11', username: 'ShadowHunter', score: 22000, gamesPlayed: 15, avgScore: 1466 },
    { userId: 'bot_pro12', username: 'Velocity', score: 18000, gamesPlayed: 12, avgScore: 1500 },
    { userId: 'bot_pro13', username: 'PixelPerfect', score: 14000, gamesPlayed: 10, avgScore: 1400 },
    { userId: 'bot_pro14', username: 'TwitchAim', score: 10000, gamesPlayed: 8, avgScore: 1250 },
    { userId: 'bot_pro15', username: 'HeadshotHero', score: 7500, gamesPlayed: 6, avgScore: 1250 }
];

// Monthly bot names
const MONTHLY_BOT_NAMES = [
    'ProGamer99', 'AimMaster', 'NightOwl', 'SpeedShot', 'TrackerKing',
    'FlickLord', 'PrecisionPro', 'ReflexKing', 'ClickFast', 'AimTrainer',
    'ShadowHunter', 'Velocity', 'PixelPerfect', 'TwitchAim', 'HeadshotHero'
];

// Generate random monthly bot scores
function generateMonthlyBotUsers() {
    const bots = [];
    for (let i = 0; i < 15; i++) {
        // Monthly scores: higher players can get 100000-150000, lower get 5000-15000
        const positionFactor = (15 - i) / 15;
        const baseScore = 130000 * positionFactor;
        const variance = Math.random() * 40000 * positionFactor;
        const score = Math.floor(baseScore + variance);
        
        const gamesPlayed = Math.floor(Math.random() * 50) + 5;
        
        bots.push({
            userId: 'bot_pro' + (i + 1),
            username: MONTHLY_BOT_NAMES[i],
            score: score,
            gamesPlayed: gamesPlayed,
            avgScore: Math.round(score / gamesPlayed)
        });
    }
    bots.sort((a, b) => b.score - a.score);
    return bots;
}

// Get monthly offline users (cached until page refresh)
let cachedMonthlyBots = null;
function getMonthlyOfflineUsers() {
    if (!cachedMonthlyBots) {
        cachedMonthlyBots = generateMonthlyBotUsers();
    }
    return cachedMonthlyBots;
}

// Get current month key (YYYY-MM format)
function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Initialize monthly score for current user
function initMonthlyScore() {
    const monthKey = getCurrentMonthKey();
    const userId = localStorage.getItem('aimtrainer_userid') || 'guest';
    const storageKey = `monthly_score_${monthKey}_${userId}`;
    
    if (!localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, '0');
    }
    
    return parseInt(localStorage.getItem(storageKey) || '0');
}

// Add score to monthly total
function addToMonthlyScore(score) {
    const monthKey = getCurrentMonthKey();
    const userId = localStorage.getItem('aimtrainer_userid') || 'guest';
    const storageKey = `monthly_score_${monthKey}_${userId}`;
    
    const currentScore = parseInt(localStorage.getItem(storageKey) || '0');
    const newScore = currentScore + score;
    localStorage.setItem(storageKey, newScore.toString());
    
    // Track games played
    const gamesKey = `monthly_games_${monthKey}_${userId}`;
    const gamesPlayed = parseInt(localStorage.getItem(gamesKey) || '0') + 1;
    localStorage.setItem(gamesKey, gamesPlayed.toString());
    
    // Update global monthly leaderboard
    updateMonthlyLeaderboard(userId, newScore);
    
    return newScore;
}

// Update user's score in the monthly leaderboard
function updateMonthlyLeaderboard(userId, score) {
    const monthKey = getCurrentMonthKey();
    const lbKey = `monthly_lb_${monthKey}`;
    
    // Get existing leaderboard
    let leaderboard = JSON.parse(localStorage.getItem(lbKey) || '[]');
    
    // Find user in leaderboard
    const userIndex = leaderboard.findIndex(u => u.userId === userId);
    
    if (userIndex >= 0) {
        leaderboard[userIndex].score = score;
    } else {
        // Add new user
        const username = localStorage.getItem('aimtrainer_username') || 'Player';
        leaderboard.push({
            userId: userId,
            username: username,
            score: score
        });
    }
    
    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Keep top 100
    leaderboard = leaderboard.slice(0, 100);
    
    localStorage.setItem(lbKey, JSON.stringify(leaderboard));
}

// Get monthly leaderboard (combines online users + offline bots)
function getMonthlyLeaderboard() {
    const monthKey = getCurrentMonthKey();
    const lbKey = `monthly_lb_${monthKey}`;
    const onlineUsers = JSON.parse(localStorage.getItem(lbKey) || '[]');
    
    // Get userId
    const userId = localStorage.getItem('aimtrainer_userid') || 'guest';
    
    // Create a map of online users by userId
    const onlineMap = new Map();
    onlineUsers.forEach(u => {
        onlineMap.set(u.userId, u);
    });
    
    let combined = [];
    
    // Add offline bots first (they have predefined stats)
    OFFLINE_USERS.forEach(bot => {
        if (!onlineMap.has(bot.userId)) {
            combined.push({
                ...bot,
                isOffline: true
            });
        }
    });
    
    // Add online users (their actual scores from localStorage)
    onlineUsers.forEach(user => {
        const existingBot = OFFLINE_USERS.find(b => b.userId === user.userId);
        if (!existingBot) {
            const gamesKey = `monthly_games_${monthKey}_${user.userId}`;
            const gamesPlayed = parseInt(localStorage.getItem(gamesKey)) || Math.floor(Math.random() * 30) + 5;
            const avgScore = user.score > 0 ? Math.round(user.score / gamesPlayed) : 0;
            combined.push({
                ...user,
                gamesPlayed: gamesPlayed,
                avgScore: avgScore,
                isOffline: false
            });
        }
    });
    
    // Sort by score descending
    combined.sort((a, b) => b.score - a.score);
    
    return combined.slice(0, 20);
}

// Get user's rank in monthly leaderboard
function getUserMonthlyRank() {
    const monthKey = getCurrentMonthKey();
    const userId = localStorage.getItem('aimtrainer_userid') || 'guest';
    const lbKey = `monthly_lb_${monthKey}`;
    const leaderboard = JSON.parse(localStorage.getItem(lbKey) || '[]');
    
    const userIndex = leaderboard.findIndex(u => u.userId === userId);
    return userIndex >= 0 ? userIndex + 1 : null;
}

// Check if prizes have been claimed for this month
function havePrizesBeenClaimed() {
    const monthKey = getCurrentMonthKey();
    return localStorage.getItem(`prizes_claimed_${monthKey}`) === 'true';
}

// Claim monthly prizes
function claimMonthlyPrizes() {
    const monthKey = getCurrentMonthKey();
    const userId = localStorage.getItem('aimtrainer_userid') || 'guest';
    const leaderboard = getMonthlyLeaderboard();
    
    const userRank = leaderboard.findIndex(u => u.userId === userId) + 1;
    
    if (userRank === 0) {
        alert('You are not on the leaderboard yet! Play more games to earn points.');
        return;
    }
    
    if (userRank > 10) {
        alert(`You are ranked #${userRank}. Top 10 players win coins! Keep playing to climb the ranks.`);
        return;
    }
    
    if (localStorage.getItem(`prize_claimed_${monthKey}_${userId}`) === 'true') {
        alert('You have already claimed your prize for this month!');
        return;
    }
    
    const prize = MONTHLY_PRIZES[userRank] || 0;
    if (prize > 0) {
        const currentCoins = parseInt(localStorage.getItem('aimtrainer_coins') || '0');
        localStorage.setItem('aimtrainer_coins', currentCoins + prize);
        localStorage.setItem(`prize_claimed_${monthKey}_${userId}`, 'true');
        
        alert(`🎉 Congratulations! You finished #${userRank} on the monthly leaderboard!\n\nYou won ${prize} coins!`);
        
        if (typeof updateCoinsDisplay === 'function') {
            updateCoinsDisplay(currentCoins + prize);
        }
    }
}

// Render monthly leaderboard UI
function renderMonthlyLeaderboard() {
    const container = document.getElementById('monthly-leaderboard-content');
    if (!container) return;
    
    const leaderboard = getMonthlyLeaderboard();
    const userId = localStorage.getItem('aimtrainer_userid') || 'guest';
    const monthKey = getCurrentMonthKey();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const [year, month] = monthKey.split('-');
    const monthName = monthNames[parseInt(month) - 1];
    
    const userMonthlyScore = parseInt(localStorage.getItem(`monthly_score_${monthKey}_${userId}`) || '0');
    const userRank = leaderboard.findIndex(u => u.userId === userId) + 1;
    const canClaimPrize = userRank > 0 && userRank <= 10 && localStorage.getItem(`prize_claimed_${monthKey}_${userId}`) !== 'true';
    
    let html = `
        <div class="monthly-lb-header">
            <h2>🏆 ${monthName} ${year} Leaderboard</h2>
            <p class="monthly-subtitle">Total Points This Month</p>
        </div>
        
        <div class="monthly-prizes-info">
            <h3>🎁 Monthly Prizes</h3>
            <div class="prizes-grid">
                <div class="prize-item gold"><span class="prize-rank">🥇 1st</span><span class="prize-amount">1000 coins</span></div>
                <div class="prize-item silver"><span class="prize-rank">🥈 2nd</span><span class="prize-amount">500 coins</span></div>
                <div class="prize-item bronze"><span class="prize-rank">🥉 3rd</span><span class="prize-amount">250 coins</span></div>
                <div class="prize-item"><span class="prize-rank">4th-10th</span><span class="prize-amount">10-100 coins</span></div>
        </div>
        
        <div class="your-monthly-stats">
            
        </div>
        <div class="monthly-stat">
                <div class="monthly-stat-label">Your Total Points</div>
                <div class="monthly-stat-value">${userMonthlyScore.toLocaleString()}</div>
        </div>
            <div class="monthly-stat">
                <div class="monthly-stat-label">Your Rank</div>
                <div class="monthly-stat-value ${userRank > 0 && userRank <= 10 ? 'top-10' : ''}">#${userRank || '-'}</div>
            </div>
        ${canClaimPrize ? `
            <button class="claim-prize-btn" onclick="claimMonthlyPrizes()">
                🎁 Claim Your #${userRank} Prize (${MONTHLY_PRIZES[userRank]} coins)
            </button>
        ` : ''}
        
        <div class="monthly-lb-list">
            <h3>Top Players</h3>
    `;
    
    if (leaderboard.length === 0) {
        html += '<div class="no-scores" style="color: #888; font-size: 16px; padding: 30px; text-align: center;">Be the first to play this month! Start playing to climb the ranks.</div>';
    } else {
        leaderboard.slice(0, 20).forEach((entry, index) => {
            const rank = index + 1;
            const isUser = entry.userId === userId;
            const prize = MONTHLY_PRIZES[rank] || 0;
            const gamesPlayed = entry.gamesPlayed || 0;
            const avgScore = entry.avgScore || 0;
            
            html += `
                <div class="monthly-lb-row ${isUser ? 'current-user' : ''} ${rank <= 3 ? 'top-3' : ''}" 
                     onclick="showPlayerStats('${escapeHtml(entry.username)}', ${entry.score}, ${gamesPlayed}, ${avgScore})"
                     style="cursor: pointer;">
                    <div class="monthly-rank ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : ''}">
                        ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank}
                    </div>
                    <div class="monthly-username">
                        ${escapeHtml(entry.username)}${isUser ? ' (You)' : ''}
                        ${entry.isOffline ? '<span class="offline-badge" title="Offline Player">💤</span>' : ''}
                    </div>
                    <div class="monthly-score">${entry.score.toLocaleString()} pts</div>
                    ${prize > 0 ? `<div class="monthly-prize">🎁 ${prize}</div>` : ''}
                </div>
            `;
        });
    }
    
    html += '</div>';
    
    container.innerHTML = html;
}

// Show player stats modal
function showPlayerStats(username, totalScore, gamesPlayed, avgScore) {
    const modal = document.createElement('div');
    modal.id = 'player-stats-modal';
    modal.className = 'player-stats-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:3000;';
    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };
    
    modal.innerHTML = `
        <div style="background:linear-gradient(160deg,#1a1a2e,#0f0f1a,#16213e);border:2px solid #00ff88;border-radius:20px;padding:30px;width:350px;max-width:90%;text-align:center;position:relative;">
            <span onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:15px;right:20px;font-size:28px;color:#666;cursor:pointer;">×</span>
            <h3 style="color:#fff;margin-bottom:25px;font-size:22px;">${escapeHtml(username)} Stats</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;"></div>
                <div style="background:rgba(0,0,0,0.5);border:1px solid #333;border-radius:12px;padding:15px;">
                    <div style="font-size:24px;font-weight:bold;color:#00ff88;">${totalScore.toLocaleString()}</div>
                    <div style="font-size:12px;color:#888;margin-top:5px;">Total Score</div>
                <div style="background:rgba(0,0,0,0.5);border:1px solid #333;border-radius:12px;padding:15px;">
                    <div style="font-size:24px;font-weight:bold;color:#00ff88;">${gamesPlayed}</div>
                    <div style="font-size:12px;color:#888;margin-top:5px;">Games Played</div>
                <div style="background:rgba(0,0,0,0.5);border:1px solid #333;border-radius:12px;padding:15px;">
                    <div style="font-size:24px;font-weight:bold;color:#00ff88;">${avgScore.toLocaleString()}</div>
                    <div style="font-size:12px;color:#888;margin-top:5px;">Avg Score</div>
                <div style="background:rgba(0,0,0,0.5);border:1px solid #333;border-radius:12px;padding:15px;">
                    <div style="font-size:24px;font-weight:bold;color:#ffaa00;">${Math.round(totalScore * 0.4).toLocaleString()}</div>
                    <div style="font-size:12px;color:#888;margin-top:5px;">Best Score</div>
            
    `;
    
    document.body.appendChild(modal);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize monthly leaderboard on load
document.addEventListener('DOMContentLoaded', () => {
    initMonthlyScore();
});

// Make functions globally available
window.getCurrentMonthKey = getCurrentMonthKey;
window.initMonthlyScore = initMonthlyScore;
window.addToMonthlyScore = addToMonthlyScore;
window.updateMonthlyLeaderboard = updateMonthlyLeaderboard;
window.getMonthlyLeaderboard = getMonthlyLeaderboard;
window.getUserMonthlyRank = getUserMonthlyRank;
window.claimMonthlyPrizes = claimMonthlyPrizes;
window.renderMonthlyLeaderboard = renderMonthlyLeaderboard;
window.showPlayerStats = showPlayerStats;
window.escapeHtml = escapeHtml;

// Weekly leaderboard functions
window.getWeekStartKey = getWeekStartKey;
window.initWeeklyScore = initWeeklyScore;
window.addToWeeklyScore = addToWeeklyScore;
window.updateWeeklyLeaderboard = updateWeeklyLeaderboard;
window.getWeeklyLeaderboard = getWeeklyLeaderboard;
window.getUserWeeklyRank = getUserWeeklyRank;
window.claimWeeklyPrizes = claimWeeklyPrizes;
window.renderWeeklyLeaderboard = renderWeeklyLeaderboard;

console.log('✅ Monthly & Weekly Leaderboard System loaded!');
