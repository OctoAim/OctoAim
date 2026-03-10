// ==================== MONTHLY LEADERBOARD SYSTEM ====================
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

// Get current month key (YYYY-MM format)
function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Initialize monthly score for current user
function initMonthlyScore() {
    const monthKey = getCurrentMonthKey();
    const userId = localStorage.getItem('aimtrainer_user_id') || 'guest';
    const storageKey = `monthly_score_${monthKey}_${userId}`;
    
    if (!localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, '0');
    }
    
    return parseInt(localStorage.getItem(storageKey) || '0');
}

// Add score to monthly total
function addToMonthlyScore(score) {
    const monthKey = getCurrentMonthKey();
    const userId = localStorage.getItem('aimtrainer_user_id') || 'guest';
    const storageKey = `monthly_score_${monthKey}_${userId}`;
    
    const currentScore = parseInt(localStorage.getItem(storageKey) || '0');
    const newScore = currentScore + score;
    localStorage.setItem(storageKey, newScore.toString());
    
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

// Get monthly leaderboard
function getMonthlyLeaderboard() {
    const monthKey = getCurrentMonthKey();
    const lbKey = `monthly_lb_${monthKey}`;
    return JSON.parse(localStorage.getItem(lbKey) || '[]');
}

// Get user's rank in monthly leaderboard
function getUserMonthlyRank() {
    const monthKey = getCurrentMonthKey();
    const userId = localStorage.getItem('aimtrainer_user_id') || 'guest';
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

// Claim monthly prizes (called at end of month - for demo, we allow claiming anytime)
function claimMonthlyPrizes() {
    const monthKey = getCurrentMonthKey();
    const userId = localStorage.getItem('aimtrainer_user_id') || 'guest';
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
    
    // Check if already claimed
    if (localStorage.getItem(`prize_claimed_${monthKey}_${userId}`) === 'true') {
        alert('You have already claimed your prize for this month!');
        return;
    }
    
    const prize = MONTHLY_PRIZES[userRank] || 0;
    if (prize > 0) {
        // Add coins
        const currentCoins = parseInt(localStorage.getItem('aimtrainer_coins') || '0');
        localStorage.setItem('aimtrainer_coins', currentCoins + prize);
        
        // Mark as claimed
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
    const userId = localStorage.getItem('aimtrainer_user_id') || 'guest';
    const monthKey = getCurrentMonthKey();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const [year, month] = monthKey.split('-');
    const monthName = monthNames[parseInt(month) - 1];
    
    // Get user's monthly score
    const userMonthlyScore = parseInt(localStorage.getItem(`monthly_score_${monthKey}_${userId}`) || '0');
    const userRank = leaderboard.findIndex(u => u.userId === userId) + 1;
    
    // Check if prizes can be claimed (user is in top 10)
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
        </div>
        
        <div class="your-monthly-stats">
            <div class="monthly-stat">
                <div class="monthly-stat-label">Your Total Points</div>
                <div class="monthly-stat-value">${userMonthlyScore.toLocaleString()}</div>
            </div>
            <div class="monthly-stat">
                <div class="monthly-stat-label">Your Rank</div>
                <div class="monthly-stat-value ${userRank > 0 && userRank <= 10 ? 'top-10' : ''}">#${userRank || '-'}</div>
            </div>
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
html += '<div class="no-scores" style="color: #888; font-size: 16px; padding: 30px; text-align: center;">No scores yet. Be the first to play this month!</div>';
    } else {
        leaderboard.slice(0, 20).forEach((entry, index) => {
            const rank = index + 1;
            const isUser = entry.userId === userId;
            const prize = MONTHLY_PRIZES[rank] || 0;
            
            html += `
                <div class="monthly-lb-row ${isUser ? 'current-user' : ''} ${rank <= 3 ? 'top-3' : ''}">
                    <div class="monthly-rank ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : ''}">
                        ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank}
                    </div>
                    <div class="monthly-username">${escapeHtml(entry.username)}${isUser ? ' (You)' : ''}</div>
                    <div class="monthly-score">${entry.score.toLocaleString()}</div>
                    ${prize > 0 ? `<div class="monthly-prize">🎁 ${prize}</div>` : ''}
                </div>
            `;
        });
    }
    
    html += '</div>';
    
    container.innerHTML = html;
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
window.escapeHtml = escapeHtml;

console.log('✅ Monthly Leaderboard System loaded!');

