// ===============================================
// FEATURE SYSTEMS - Settings, Clans, Private Rooms, Matchmaking
// ===============================================

// ========== SETTINGS MODAL ==========
function showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.add('active');
        renderThemeOptions();
        renderSensitivityConverter();
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function renderThemeOptions() {
    const container = document.getElementById('theme-options');
    if (!container) return;
    
    const themes = [
        { id: 'default', name: 'Default Dark', colors: ['#0a0a0f', '#1a1a2e', '#00ff88'] },
        { id: 'ocean', name: 'Ocean Blue', colors: ['#0a192f', '#112240', '#64ffda'] },
        { id: 'sunset', name: 'Sunset', colors: ['#1a0a0f', '#2d1124', '#ff6b6b'] },
        { id: 'forest', name: 'Forest', colors: ['#0a1f0a', '#1a2d1a', '#4ade80'] }
    ];
    
    const currentTheme = localStorage.getItem('aimtrainer_theme') || 'default';
    
    container.innerHTML = themes.map(theme => `
        <div class="theme-option ${theme.id === currentTheme ? 'active' : ''}" onclick="selectTheme('${theme.id}')">
            <div style="display: flex; gap: 5px; justify-content: center; margin-bottom: 8px;">
                ${theme.colors.map(c => `<div style="width: 20px; height: 20px; background: ${c}; border-radius: 4px;"></div>`).join('')}
            </div>
            <span style="color: #fff; font-size: 12px;">${theme.name}</span>
        </div>
    `).join('');
}

function selectTheme(themeId) {
    localStorage.setItem('aimtrainer_theme', themeId);
    renderThemeOptions();
    applyTheme(themeId);
}

function applyTheme(themeId) {
    const themes = {
        default: { bg: '#0a0a0f', card: '#1a1a2e', accent: '#00ff88' },
        ocean: { bg: '#0a192f', card: '#112240', accent: '#64ffda' },
        sunset: { bg: '#1a0a0f', card: '#2d1124', accent: '#ff6b6b' },
        forest: { bg: '#0a1f0a', card: '#1a2d1a', accent: '#4ade80' }
    };
    
    const theme = themes[themeId] || themes.default;
    document.body.style.background = theme.bg;
    // Apply theme colors as CSS variables
    document.documentElement.style.setProperty('--theme-bg', theme.bg);
    document.documentElement.style.setProperty('--theme-card', theme.card);
    document.documentElement.style.setProperty('--theme-accent', theme.accent);
}

function renderSensitivityConverter() {
    const container = document.getElementById('sens-converter');
    if (!container) return;
    
    container.innerHTML = `
        <div class="sens-converter">
            <h4>🎯 Sensitivity Converter</h4>
            <div class="sens-row">
                <select id="sens-from-game" onchange="convertSensitivity()">
                    <option value="valorant">Valorant</option>
                    <option value="csgo">CS:GO</option>
                    <option value="aimlab">Aim Lab</option>
                    <option value="kovaaks">KovaaK's</option>
                </select>
                <input type="number" id="sens-from-value" placeholder="Sensitivity" value="0.5" oninput="convertSensitivity()">
            </div>
            <div class="sens-row">
                <select id="sens-to-game" onchange="convertSensitivity()">
                    <option value="valorant">Valorant</option>
                    <option value="csgo" selected>CS:GO</option>
                    <option value="aimlab">Aim Lab</option>
                    <option value="kovaaks">KovaaK's</option>
                </select>
                <input type="number" id="sens-to-value" placeholder="Result" readonly>
            </div>
            <div class="sens-result" id="sens-result">CM/360: 0.00</div>
    `;
}

function convertSensitivity() {
    // Simplified sensitivity conversion (in production, use proper formulas)
    const conversionFactors = {
        valorant: { csgo: 3.18181818, aimlab: 1.0, kovaaks: 1.0 },
        csgo: { valorant: 0.314, aimlab: 0.314, kovaaks: 0.314 },
        aimlab: { valorant: 1.0, csgo: 3.18181818, kovaaks: 1.0 },
        kovaaks: { valorant: 1.0, csgo: 3.18181818, aimlab: 1.0 }
    };
    
    const fromGame = document.getElementById('sens-from-game').value;
    const toGame = document.getElementById('sens-to-game').value;
    const value = parseFloat(document.getElementById('sens-from-value').value) || 0;
    
    const factor = conversionFactors[fromGame]?.[toGame] || 1;
    const result = value * factor;
    
    document.getElementById('sens-to-value').value = result.toFixed(3);
    
    // Calculate CM/360 (approximate)
    const cmPer360 = 3.18181818 / result;
    document.getElementById('sens-result').textContent = `CM/360: ${cmPer360.toFixed(2)}`;
}

// ========== CLANS MODAL ==========
function showClansModal() {
    const modal = document.getElementById('clans-modal');
    if (modal) {
        modal.classList.add('active');
        renderClanContent();
    }
}

function closeClansModal() {
    const modal = document.getElementById('clans-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function renderClanContent() {
    const container = document.getElementById('clan-content');
    if (!container) return;
    
    const userClan = localStorage.getItem('aimtrainer_clan');
    
    if (userClan) {
        // User is in a clan - show clan info
        const clanData = JSON.parse(userClan);
        container.innerHTML = `
            <div class="clan-info">
                <h3>🏰 ${clanData.name}</h3>
                <p>Members: ${clanData.members || 1}</p>
                <p>Total Score: <span class="clan-pot">${clanData.score || 0}</span></p>
                <p>Your Contribution: ${clanData.contribution || 0}</p>
                <div class="clan-invite-code">
                    Invite Code: <strong>${clanData.code}</strong>
                </div>
                <button class="btn-danger" onclick="leaveClan()">Leave Clan</button>
            </div>
        `;
    } else {
        // User not in clan - show join/create options
        container.innerHTML = `
            <div class="clan-join">
                <h3>Join a Clan</h3>
                <input type="text" id="clan-join-code" placeholder="Enter Clan Code">
                <button onclick="joinClan()">Join Clan</button>
                
                <hr>
                
                <h3>Create a Clan</h3>
                <input type="text" id="clan-create-name" placeholder="Clan Name (max 20 chars)">
                <button onclick="createClan()">Create Clan (1000 coins)</button>
            </div>
        `;
    }
}

function joinClan() {
    const code = document.getElementById('clan-join-code').value.trim().toUpperCase();
    if (!code) {
        alert('Please enter a clan code');
        return;
    }
    
    // In production, verify with Firebase
    const clanData = {
        name: 'Clan ' + code,
        code: code,
        members: Math.floor(Math.random() * 10) + 1,
        score: Math.floor(Math.random() * 100000),
        contribution: 0
    };
    
    localStorage.setItem('aimtrainer_clan', JSON.stringify(clanData));
    renderClanContent();
    alert('Joined clan successfully!');
}

function createClan() {
    const name = document.getElementById('clan-create-name').value.trim();
    if (!name || name.length > 20) {
        alert('Please enter a valid clan name (max 20 characters)');
        return;
    }
    
    const coins = parseInt(localStorage.getItem('aimtrainer_coins') || '0');
    if (coins < 1000) {
        alert('Not enough coins! You need 1000 coins to create a clan.');
        return;
    }
    
    // Deduct coins
    localStorage.setItem('aimtrainer_coins', coins - 1000);
    
    // Generate clan code
    const code = 'CLAN' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const clanData = {
        name: name,
        code: code,
        members: 1,
        score: 0,
        contribution: 0
    };
    
    localStorage.setItem('aimtrainer_clan', JSON.stringify(clanData));
    renderClanContent();
    alert(`Clan created! Your invite code: ${code}`);
    updateCoinsDisplay(coins - 1000);
}

function leaveClan() {
    if (confirm('Are you sure you want to leave this clan?')) {
        localStorage.removeItem('aimtrainer_clan');
        renderClanContent();
    }
}

// ========== PRIVATE ROOMS MODAL ==========
function showPrivateRoomsModal() {
    const modal = document.getElementById('private-rooms-modal');
    if (modal) {
        modal.classList.add('active');
        renderPrivateRoomsContent();
    }
}

function closePrivateRoomsModal() {
    const modal = document.getElementById('private-rooms-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function renderPrivateRoomsContent() {
    const container = document.getElementById('private-rooms-content');
    if (!container) return;
    
    const roomCode = localStorage.getItem('aimtrainer_private_room');
    
    if (roomCode) {
        // User has an active room
        container.innerHTML = `
            <div class="create-room">
                <h3>🔒 Your Private Room</h3>
                <p style="color: #888; margin-bottom: 15px;">Share this code with friends to play together!</p>
                <div class="room-code-display">${roomCode}</div>
                <p style="color: #666; font-size: 14px;">Game: Private Match (Custom)</p>
                <button class="btn-danger" onclick="closePrivateRoom()">Close Room</button>
            </div>
        `;
    } else {
        // Create new room
        container.innerHTML = `
            <div class="create-room">
                <h3>Create Private Room</h3>
                <p style="color: #888; margin-bottom: 20px;">Create a private room to play with friends!</p>
                
                <select id="private-game-select">
                    <option value="360Aim">360° Aim Tracker</option>
                    <option value="flick">360° Flick Trainer</option>
                    <option value="bounceTracker">Bounce Tracker</option>
                    <option value="reactionTrainer">Reaction Trainer</option>
                    <option value="microflick">Micro Flick Trainer</option>
                    <option value="staticPrecision">Static Precision</option>
                </select>
                
                <select id="private-difficulty-select">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard" selected>Hard</option>
                </select>
                
                <button onclick="createPrivateRoom()">Create Room</button>
            </div>
        `;
    }
}

function createPrivateRoom() {
    const game = document.getElementById('private-game-select').value;
    const difficulty = document.getElementById('private-difficulty-select').value;
    
    // Generate room code
    const code = 'P' + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    localStorage.setItem('aimtrainer_private_room', code);
    localStorage.setItem('aimtrainer_private_room_game', game);
    localStorage.setItem('aimtrainer_private_room_difficulty', difficulty);
    
    renderPrivateRoomsContent();
    alert(`Private room created! Code: ${code}`);
}

function closePrivateRoom() {
    localStorage.removeItem('aimtrainer_private_room');
    localStorage.removeItem('aimtrainer_private_room_game');
    localStorage.removeItem('aimtrainer_private_room_difficulty');
    renderPrivateRoomsContent();
}

// ========== MATCHMAKING MODAL ==========
function showMatchmakingModal() {
    const modal = document.getElementById('matchmaking-modal');
    if (modal) {
        modal.classList.add('active');
        renderMatchmakingContent();
    }
}

function closeMatchmakingModal() {
    const modal = document.getElementById('matchmaking-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    // Cancel matchmaking if in queue
    if (window.matchmakingInterval) {
        clearInterval(window.matchmakingInterval);
        window.matchmakingInterval = null;
    }
}

function renderMatchmakingContent() {
    const container = document.getElementById('matchmaking-content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="queue-info">
            <p>Select a game to find a 1v1 opponent!</p>
        </div>
        
        <div class="queue-game">
            <span>🎯 360° Aim Tracker</span>
            <span class="queue-count" id="queue-count-360Aim">0 in queue</span>
            <button onclick="joinQueue('360Aim')">Play</button>
        </div>
        
        <div class="queue-game">
            <span>⚡ 360° Flick Trainer</span>
            <span class="queue-count" id="queue-count-flick">0 in queue</span>
            <button onclick="joinQueue('flick')">Play</button>
        </div>
        
        <div class="queue-game">
            <span>🏀 Bounce Tracker</span>
            <span class="queue-count" id="queue-count-bounceTracker">0 in queue</span>
            <button onclick="joinQueue('bounceTracker')">Play</button>
        </div>
        
        <div class="queue-game">
            <span>⚡ Reaction Trainer</span>
            <span class="queue-count" id="queue-count-reactionTrainer">0 in queue</span>
            <button onclick="joinQueue('reactionTrainer')">Play</button>
        </div>
        
        <div class="queue-game">
            <span>🎯 Static Precision</span>
            <span class="queue-count" id="queue-count-staticPrecision">0 in queue</span>
            <button onclick="joinQueue('staticPrecision')">Play</button>
        </div>
        
        <div id="match-active" style="display: none;"></div>
    `;
    
    // Simulate queue updates
    updateQueueCounts();
}

function updateQueueCounts() {
    const games = ['360Aim', 'flick', 'bounceTracker', 'reactionTrainer', 'staticPrecision'];
    games.forEach(game => {
        const count = Math.floor(Math.random() * 5);
        const el = document.getElementById('queue-count-' + game);
        if (el) {
            el.textContent = count + ' in queue';
        }
    });
}

function joinQueue(gameId) {
    const container = document.getElementById('matchmaking-content');
    const matchActive = document.getElementById('match-active');
    
    // Show searching UI
    if (matchActive) {
        matchActive.style.display = 'block';
        matchActive.innerHTML = `
            <div class="match-active">
                <h3>🔍 Searching for Opponent...</h3>
                <p>Game: ${gameId}</p>
                <p id="queue-timer">Time: 0s</p>
                <button class="btn-danger" onclick="leaveQueue()">Cancel</button>
            </div>
        `;
    }
    
    // Simulate finding a match after random time
    let seconds = 0;
    window.matchmakingInterval = setInterval(() => {
        seconds++;
        const timerEl = document.getElementById('queue-timer');
        if (timerEl) {
            timerEl.textContent = 'Time: ' + seconds + 's';
        }
        
        // Simulate match found after 3-10 seconds
        if (seconds >= 3 && Math.random() > 0.7) {
            clearInterval(window.matchmakingInterval);
            window.matchmakingInterval = null;
            matchFound(gameId);
        }
    }, 1000);
}

function matchFound(gameId) {
    const matchActive = document.getElementById('match-active');
    if (matchActive) {
        matchActive.innerHTML = `
            <div class="match-active">
                <h3>🎉 Match Found!</h3>
                <p>Game: ${gameId}</p>
                <p>Opponent: Player${Math.floor(Math.random() * 9999)}</p>
                <p>Winner gets: 100 coins!</p>
                <button onclick="startMatch('${gameId}')">Start Match</button>
            </div>
        `;
    }
}

function startMatch(gameId) {
    // Open the game in a new window
    const url = gameId + '.html';
    window.open(url, '_blank');
    closeMatchmakingModal();
}

function leaveQueue() {
    if (window.matchmakingInterval) {
        clearInterval(window.matchmakingInterval);
        window.matchmakingInterval = null;
    }
    renderMatchmakingContent();
}

// ========== FRIEND CHALLENGE MODAL ==========
function showFriendChallengeModal() {
    const modal = document.getElementById('friend-challenge-modal');
    if (modal) {
        modal.classList.add('active');
        renderFriendChallengeContent();
    }
}

function closeFriendChallengeModal() {
    const modal = document.getElementById('friend-challenge-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function renderFriendChallengeContent() {
    const container = document.getElementById('friend-challenge-content');
    if (!container) return;
    
    const friends = JSON.parse(localStorage.getItem('aimtrainer_friends') || '[]');
    
    if (friends.length === 0) {
        container.innerHTML = `
            <div class="no-friends">
                <div class="no-friends-icon">👥</div>
                <p>No friends yet!</p>
                <p style="font-size: 12px; margin-top: 10px;">Add friends from the Social section to challenge them.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="friend-list">
            ${friends.map((friend, index) => `
                <div class="friend-challenge-item">
                    <div class="friend-info">
                        <div class="friend-avatar">${friend.username.charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="friend-name">${friend.username}</div>
                            <div class="friend-status online">Online</div>
                    </div>
                    <button class="challenge-btn" onclick="sendFriendChallenge(${index})">Challenge</button>
                </div>
            `).join('')}
        </div>
    `;
}

function sendFriendChallenge(friendIndex) {
    const friends = JSON.parse(localStorage.getItem('aimtrainer_friends') || '[]');
    const friend = friends[friendIndex];
    
    if (friend) {
        alert(`Challenge sent to ${friend.username}! Waiting for them to accept...`);
    }
}

// ========== ACTIVE MATCH MODAL ==========
function showActiveMatchModal() {
    const modal = document.getElementById('active-match-modal');
    if (modal) {
        modal.classList.add('active');
        renderActiveMatchContent();
    }
}

function closeActiveMatchModal() {
    const modal = document.getElementById('active-match-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function renderActiveMatchContent() {
    const container = document.getElementById('active-match-content');
    if (!container) return;
    
    const matchData = JSON.parse(localStorage.getItem('aimtrainer_active_match') || 'null');
    const username = localStorage.getItem('aimtrainer_username') || 'You';
    
    if (!matchData) {
        container.innerHTML = '<div class="no-friends"><p>No active match</p></div>';
        return;
    }
    
    container.innerHTML = `
        <div class="match-vs">
            <div class="match-vs-title">LIVE 1V1 MATCH</div>
            <div class="match-players">
                <div class="match-player you">
                    <div class="match-player-avatar">${username.charAt(0).toUpperCase()}</div>
                    <div class="match-player-name">${username}</div>
                <div class="match-vs-divider">VS</div>
                <div class="match-player opponent">
                    <div class="match-player-avatar">${matchData.opponentName.charAt(0).toUpperCase()}</div>
                    <div class="match-player-name">${matchData.opponentName}</div>
            </div>
        
        <div class="match-scores">
            <div class="match-score you">
                <div class="match-score-value" id="your-score">${matchData.yourScore || 0}</div>
                <div class="match-score-label">Your Score</div>
            <div class="match-score opponent">
                <div class="match-score-value" id="opponent-score">${matchData.opponentScore || 0}</div>
                <div class="match-score-label">Their Score</div>
        </div>
        
        <div class="match-info-bar">
            <div class="match-info-item">
                <div class="match-info-label">Game</div>
                <div class="match-info-value">${matchData.game}</div>
            <div class="match-info-item">
                <div class="match-info-label">Time</div>
                <div class="match-info-value" id="match-timer">${matchData.timeLeft || 60}s</div>
            <div class="match-info-item">
                <div class="match-info-label">Bid</div>
                <div class="match-info-value">🪙 ${matchData.bid || 0}</div>
        </div>
        
        <div class="match-prize">🏆 Winner takes: 🪙 ${(matchData.bid || 0) * 2}</div>
    `;
    
    startMatchScoreUpdate();
}

let matchScoreInterval = null;

function startMatchScoreUpdate() {
    if (matchScoreInterval) clearInterval(matchScoreInterval);
    
    matchScoreInterval = setInterval(() => {
        const yourScoreEl = document.getElementById('your-score');
        const opponentScoreEl = document.getElementById('opponent-score');
        const timerEl = document.getElementById('match-timer');
        
        if (yourScoreEl && opponentScoreEl) {
            yourScoreEl.textContent = (parseInt(yourScoreEl.textContent) + Math.floor(Math.random() * 3)).toString();
            opponentScoreEl.textContent = (parseInt(opponentScoreEl.textContent) + Math.floor(Math.random() * 3)).toString();
        }
        
        if (timerEl) {
            const currentTime = parseInt(timerEl.textContent) || 0;
            if (currentTime <= 1) {
                endMatch();
            } else {
                timerEl.textContent = (currentTime - 1) + 's';
            }
        }
    }, 1000);
}

function endMatch() {
    if (matchScoreInterval) {
        clearInterval(matchScoreInterval);
        matchScoreInterval = null;
    }
    
    const yourScore = parseInt(document.getElementById('your-score')?.textContent || '0');
    const opponentScore = parseInt(document.getElementById('opponent-score')?.textContent || '0');
    const matchData = JSON.parse(localStorage.getItem('aimtrainer_active_match') || '{}');
    
    let message = '';
    if (yourScore > opponentScore) {
        const winnings = (matchData.bid || 0) * 2;
        message = `🎉 You won! +${winnings} coins!`;
        const currentCoins = parseInt(localStorage.getItem('aimtrainer_coins') || '0');
        localStorage.setItem('aimtrainer_coins', currentCoins + winnings);
    } else if (yourScore < opponentScore) {
        message = `💔 You lost! Better luck next time!`;
    } else {
        message = `🤝 It's a tie! Your bid has been returned.`;
        const currentCoins = parseInt(localStorage.getItem('aimtrainer_coins') || '0');
        localStorage.setItem('aimtrainer_coins', currentCoins + (matchData.bid || 0));
    }
    
    localStorage.removeItem('aimtrainer_active_match');
    closeActiveMatchModal();
    alert(message);
}

// ========== ENHANCED PRIVATE ROOMS ==========
function renderPrivateRoomsContent() {
    const container = document.getElementById('private-rooms-content');
    if (!container) return;
    
    const roomCode = localStorage.getItem('aimtrainer_private_room');
    
    if (roomCode) {
        const game = localStorage.getItem('aimtrainer_private_room_game') || 'Custom';
        const bid = localStorage.getItem('aimtrainer_room_bid') || '0';
        
        const players = [
            { name: localStorage.getItem('aimtrainer_username') || 'You (Host)', ready: true },
            { name: 'Player2', ready: Math.random() > 0.5 }
        ];
        
        container.innerHTML = `
            <div class="room-players">
                <div class="room-players-title">
                    <span>Players in Room</span>
                    <span class="player-count-badge">${players.length}/4</span>
                </div>
                ${players.map(p => `
                    <div class="player-item">
                        <div class="player-avatar">${p.name.charAt(0).toUpperCase()}</div>
                        <div class="player-info">
                            <div class="player-name">${p.name}</div>
                            <div class="player-status ${p.ready ? 'ready' : ''}">${p.ready ? '✓ Ready' : 'Waiting...'}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="coin-bid-section">
                <div class="coin-bid-title">🪙 Coin Bid</div>
                <div class="coin-bid-input-group">
                    <input type="number" class="coin-bid-input" id="room-bid-input" value="${bid}" min="0" onchange="updateRoomBid(this.value)">
                    <span style="color: #888;">coins</span>
                </div>
                <div class="coin-bid-info">Both players must bid the same amount to start</div>
                <div class="bid-match pending" id="bid-status">
                    ${parseInt(bid) > 0 ? '✓ Bid set!' : 'Waiting for bid...'}
                </div>
            
            <div class="room-code-display">${roomCode}</div>
            <p class="room-info">Share this code with friends to join!</p>
            
            <button class="start-match-btn" id="start-match-btn" onclick="startPrivateMatch()">
                Start Match
            </button>
            
            <button class="btn btn-danger" style="width: 100%; margin-top: 12px;" onclick="closePrivateRoom()">
                Close Room
            </button>
        `;
    } else {
        container.innerHTML = `
            <div class="create-room">
                <h3>Create Private Room</h3>
                <p style="color: #888; margin-bottom: 20px;">Create a private room to play with friends!</p>
                
                <select id="private-game-select">
                    <option value="360Aim">360° Aim Tracker</option>
                    <option value="flick">360° Flick Trainer</option>
                    <option value="bounceTracker">Bounce Tracker</option>
                    <option value="reactionTrainer">Reaction Trainer</option>
                    <option value="microflick">Micro Flick Trainer</option>
                    <option value="staticPrecision">Static Precision</option>
                </select>
                
                <select id="private-difficulty-select">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard" selected>Hard</option>
                </select>
                
                <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="createPrivateRoom()">
                    Create Room
                </button>
            </div>
        `;
    }
}

function updateRoomBid(value) {
    const bid = Math.max(0, parseInt(value) || 0);
    localStorage.setItem('aimtrainer_room_bid', bid);
    
    const bidStatus = document.getElementById('bid-status');
    if (bidStatus) {
        if (bid > 0) {
            bidStatus.className = 'bid-match accepted';
            bidStatus.innerHTML = `✓ Bid of ${bid} coins set!`;
        } else {
            bidStatus.className = 'bid-match pending';
            bidStatus.innerHTML = 'Waiting for opponent to match bid...';
        }
    }
}

function startPrivateMatch() {
    const game = localStorage.getItem('aimtrainer_private_room_game');
    const bid = parseInt(localStorage.getItem('aimtrainer_room_bid') || '0');
    const username = localStorage.getItem('aimtrainer_username') || 'Player';
    
    const currentCoins = parseInt(localStorage.getItem('aimtrainer_coins') || '0');
    if (currentCoins < bid) {
        alert('Not enough coins for this bid!');
        return;
    }
    
    localStorage.setItem('aimtrainer_coins', currentCoins - bid);
    
    const matchData = {
        game: game,
        bid: bid,
        yourScore: 0,
        opponentScore: 0,
        opponentName: 'Player2',
        timeLeft: 60,
        roomCode: localStorage.getItem('aimtrainer_private_room')
    };
    
    localStorage.setItem('aimtrainer_active_match', JSON.stringify(matchData));
    
    closePrivateRoomsModal();
    showActiveMatchModal();
}

// ========== ACCOUNT FUNCTIONS ==========
function showProfileCard() {
    // Get user data from localStorage
    const userData = localStorage.getItem('aimtrainer_user');
    const coins = localStorage.getItem('aimtrainer_coins') || 0;
    const clan = localStorage.getItem('aimtrainer_clan');
    
    let userInfo = {
        username: 'Guest',
        email: 'Not signed in',
        coins: coins,
        totalScore: localStorage.getItem('aimtrainer_totalScore') || 0,
        matchesPlayed: localStorage.getItem('aimtrainer_matches') || 0,
        accuracy: localStorage.getItem('aimtrainer_accuracy') || 0,
        clan: null
    };
    
    if (userData) {
        const parsed = JSON.parse(userData);
        userInfo.username = parsed.username || parsed.email || 'User';
        userInfo.email = parsed.email || 'Not available';
    }
    
    if (clan) {
        userInfo.clan = JSON.parse(clan);
    }
    
    // Create profile modal content
    const profileHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #00ff88, #00cc6a); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; color: #000;">
                ${userInfo.username.charAt(0).toUpperCase()}
            </div>
            <h3 style="color: #fff; font-size: 24px; margin-bottom: 5px;">${userInfo.username}</h3>
            <p style="color: #888; font-size: 14px; margin-bottom: 20px;">${userInfo.email}</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px;">
                    <div style="color: #00ff88; font-size: 24px; font-weight: bold;">${userInfo.coins}</div>
                    <div style="color: #888; font-size: 12px;">Coins</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px;">
                    <div style="color: #ffaa00; font-size: 24px; font-weight: bold;">${userInfo.totalScore}</div>
                    <div style="color: #888; font-size: 12px;">Total Score</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px;">
                    <div style="color: #64ffda; font-size: 24px; font-weight: bold;">${userInfo.matchesPlayed}</div>
                    <div style="color: #888; font-size: 12px;">Matches</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px;">
                    <div style="color: #ff6b6b; font-size: 24px; font-weight: bold;">${userInfo.accuracy}%</div>
                    <div style="color: #888; font-size: 12px;">Accuracy</div>
                </div>
            </div>
            
            ${userInfo.clan ? `
                <div style="background: rgba(255,170,0,0.1); border: 1px solid #ffaa00; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                    <div style="color: #ffaa00; font-weight: bold;">🏰 Clan: ${userInfo.clan.name}</div>
                    <div style="color: #888; font-size: 12px;">Members: ${userInfo.clan.members || 1} | Contribution: ${userInfo.clan.contribution || 0}</div>
                </div>
            ` : ''}
            
            <button onclick="closeProfileCard()" style="padding: 12px 30px; background: #00ff88; border: none; border-radius: 8px; color: #000; font-weight: bold; cursor: pointer;">Close</button>
        </div>
    `;
    
    // Create or update profile modal
    let profileModal = document.getElementById('profile-modal');
    if (!profileModal) {
        profileModal = document.createElement('div');
        profileModal.id = 'profile-modal';
        profileModal.className = 'profile-modal';
        profileModal.innerHTML = `
            <style>
                .profile-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.9);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 2600;
                }
                .profile-modal.active {
                    display: flex;
                }
                .profile-box {
                    background: linear-gradient(160deg, #1a1a2e 0%, #0f0f1a 50%, #16213e 100%);
                    border: 2px solid #00ff88;
                    border-radius: 20px;
                    padding: 30px;
                    width: 400px;
                    max-width: 95%;
                    animation: slideUp 0.3s ease;
                }
            </style>
            <div class="profile-box" id="profile-box-content"></div>
        `;
        document.body.appendChild(profileModal);
    }
    
    document.getElementById('profile-box-content').innerHTML = profileHTML;
    profileModal.classList.add('active');
}

function closeProfileCard() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to sign out?')) {
        // Clear user session data
        localStorage.removeItem('aimtrainer_user');
        localStorage.removeItem('aimtrainer_token');
        
        // Show confirmation
        alert('You have been signed out successfully!');
        
        // Refresh the page or redirect to login
        closeSettingsModal();
        
        // Dispatch event for other components to handle
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
    }
}

function updateCoinsDisplay(coins) {
    // Update coins in all places it might be displayed
    
    // 1. Update header coin display if exists
    const headerCoins = document.getElementById('header-coins');
    if (headerCoins) {
        headerCoins.textContent = coins;
    }
    
    // 2. Update nav coin display if exists
    const navCoins = document.getElementById('nav-coins');
    if (navCoins) {
        navCoins.textContent = coins;
    }
    
    // 3. Update any element with class 'coins-display'
    const coinDisplays = document.querySelectorAll('.coins-display');
    coinDisplays.forEach(el => {
        el.textContent = coins;
    });
    
    // 4. Update localStorage
    localStorage.setItem('aimtrainer_coins', coins);
    
    // 5. Dispatch event for other components
    window.dispatchEvent(new CustomEvent('coinsUpdated', { detail: { coins: coins } }));
}

// ========== INITIALIZATION ==========
function initFeatureSystems() {
    console.log('🎮 Feature Systems initialized');
    
    // Apply saved theme
    const savedTheme = localStorage.getItem('aimtrainer_theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    }
}

// Make functions globally available
window.showSettingsModal = showSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.selectTheme = selectTheme;
window.applyTheme = applyTheme;
window.convertSensitivity = convertSensitivity;

window.showClansModal = showClansModal;
window.closeClansModal = closeClansModal;
window.renderClanContent = renderClanContent;
window.joinClan = joinClan;
window.createClan = createClan;
window.leaveClan = leaveClan;

window.showPrivateRoomsModal = showPrivateRoomsModal;
window.closePrivateRoomsModal = closePrivateRoomsModal;
window.renderPrivateRoomsContent = renderPrivateRoomsContent;
window.createPrivateRoom = createPrivateRoom;
window.closePrivateRoom = closePrivateRoom;

window.showMatchmakingModal = showMatchmakingModal;
window.closeMatchmakingModal = closeMatchmakingModal;
window.renderMatchmakingContent = renderMatchmakingContent;
window.joinQueue = joinQueue;
window.matchFound = matchFound;
window.startMatch = startMatch;
window.leaveQueue = leaveQueue;

window.showProfileCard = showProfileCard;
window.closeProfileCard = closeProfileCard;
window.handleLogout = handleLogout;
window.updateCoinsDisplay = updateCoinsDisplay;

// Initialize on load
initFeatureSystems();

console.log('✅ Feature Systems loaded!');
