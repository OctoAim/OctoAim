// ===============================================
// SECURE ADMIN SYSTEM FOR AIM TRAINER
// ===============================================
// Username: Admin
// Password: AdminPass2024!

const ADMIN_CONFIG = {
    username: 'Admin',
    sessionDuration: 24 * 60 * 60 * 1000,
    capabilities: {
        banPlayers: true,
        giveCoins: true,
        giveSkins: true,
        viewAllPlayers: true,
        viewAnyProfile: true,
        viewLeaderboard: true,
        deleteScores: true
    }
};

let adminSession = {
    isAuthenticated: false,
    loginTime: null,
    username: null
};

function isAdminLoggedIn() {
    if (!adminSession.isAuthenticated) return false;
    const now = Date.now();
    const sessionAge = now - adminSession.loginTime;
    if (sessionAge > ADMIN_CONFIG.sessionDuration) {
        adminLogout();
        return false;
    }
    return true;
}

async function adminLogin(inputUsername, password) {
    if (inputUsername !== ADMIN_CONFIG.username) {
        return { success: false, error: 'Invalid credentials' };
    }
    
    const isValid = await verifyAdminPassword(password);
    
    if (!isValid) {
        return { success: false, error: 'Invalid credentials' };
    }
    
    adminSession = {
        isAuthenticated: true,
        loginTime: Date.now(),
        username: ADMIN_CONFIG.username
    };
    
    sessionStorage.setItem('aimtrainer_admin_session', JSON.stringify(adminSession));
    return { success: true };
}

async function verifyAdminPassword(password) {
    // For development/testing without Firebase setup
    // In production, this should verify against Firebase
    // Simple check - change this password for production!
    const validPassword = 'AdminPass2024!';
    
    if (password === validPassword) {
        console.log('Admin password verified (local mode)');
        return true;
    }
    
    // Try Firebase verification if available
    if (!window.firebaseReady) {
        console.log('Firebase not ready, using local verification');
        return false;
    }
    
    try {
        const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
        const docRef = doc(window.db, 'admin_config', 'credentials');
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) return false;
        
        const data = docSnap.data();
        const storedHash = data.passwordHash;
        const salt = data.salt || 'default_salt';
        
        const hashedInput = await simpleHash(password + salt);
        return hashedInput === storedHash;
    } catch (e) {
        console.error('Error verifying admin password:', e);
        return false;
    }
}

async function simpleHash(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function adminLogout() {
    adminSession = { isAuthenticated: false, loginTime: null, username: null };
    sessionStorage.removeItem('aimtrainer_admin_session');
}

function restoreAdminSession() {
    try {
        const stored = sessionStorage.getItem('aimtrainer_admin_session');
        if (stored) {
            adminSession = JSON.parse(stored);
            if (isAdminLoggedIn()) return true;
        }
    } catch (e) { console.error('Error restoring admin session:', e); }
    return false;
}

async function adminGetAllPlayers() {
    if (!isAdminLoggedIn()) return { success: false, error: 'Admin not authenticated' };
    if (!window.firebaseReady) return { success: false, error: 'Firebase not ready' };
    
    try {
        const { getDocs, collection } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
        const snapshot = await getDocs(collection(window.db, 'users'));
        const players = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            players.push({
                uid: doc.id,
                username: data.username || 'Unknown',
                email: data.email || 'No email',
                coins: data.coins || 0,
                skins: data.skins || ['default'],
                totalGames: data.totalGames || 0,
                banned: data.banned || false,
                banReason: data.banReason || ''
            });
        });
        
        return { success: true, players: players };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function adminGetPlayerProfile(uid) {
    if (!isAdminLoggedIn()) return { success: false, error: 'Admin not authenticated' };
    if (!window.firebaseReady) return { success: false, error: 'Firebase not ready' };
    
    try {
        const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
        const docRef = doc(window.db, 'users', uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) return { success: false, error: 'Player not found' };
        
        const data = docSnap.data();
        
        const { getDocs, collection, query, where, orderBy, limit } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
        const scoresQuery = query(
            collection(window.db, 'leaderboard'),
            where('userId', '==', uid),
            orderBy('timestamp', 'desc'),
            limit(20)
        );
        
        const scoresSnapshot = await getDocs(scoresQuery);
        const recentScores = [];
        
        scoresSnapshot.forEach(scoreDoc => {
            const scoreData = scoreDoc.data();
            recentScores.push({
                gameId: scoreData.gameId,
                score: scoreData.score,
                timestamp: scoreData.timestamp
            });
        });
        
        return {
            success: true,
            profile: {
                uid: docSnap.id,
                username: data.username || 'Unknown',
                email: data.email || 'No email',
                coins: data.coins || 0,
                skins: data.skins || ['default'],
                equippedSkin: data.equippedSkin || 'default',
                totalGames: data.totalGames || 0,
                referralCode: data.referralCode || '',
                banned: data.banned || false,
                banReason: data.banReason || '',
                recentScores: recentScores
            }
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function adminBanPlayer(uid, reason) {
    if (!isAdminLoggedIn()) return { success: false, error: 'Admin not authenticated' };
    if (!window.firebaseReady) return { success: false, error: 'Firebase not ready' };
    
    try {
        const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
        await updateDoc(doc(window.db, 'users', uid), {
            banned: true,
            banReason: reason || 'No reason provided',
            bannedAt: Date.now(),
            bannedBy: 'Admin'
        });
        return { success: true, message: 'Player banned successfully' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function adminUnbanPlayer(uid) {
    if (!isAdminLoggedIn()) return { success: false, error: 'Admin not authenticated' };
    if (!window.firebaseReady) return { success: false, error: 'Firebase not ready' };
    
    try {
        const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
        await updateDoc(doc(window.db, 'users', uid), {
            banned: false,
            banReason: '',
            unbannedAt: Date.now(),
            unbannedBy: 'Admin'
        });
        return { success: true, message: 'Player unbanned successfully' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function adminGiveCoins(uid, amount) {
    if (!isAdminLoggedIn()) return { success: false, error: 'Admin not authenticated' };
    if (!window.firebaseReady) return { success: false, error: 'Firebase not ready' };
    if (amount <= 0 || amount > 100000) return { success: false, error: 'Invalid amount (1-100000)' };
    
    try {
        const { getDoc, updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
        const docRef = doc(window.db, 'users', uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) return { success: false, error: 'Player not found' };
        
        const currentCoins = docSnap.data().coins || 0;
        const newCoins = currentCoins + amount;
        
        await updateDoc(docRef, {
            coins: newCoins,
            lastCoinGrant: Date.now(),
            coinGrantAmount: amount,
            coinGrantBy: 'Admin'
        });
        
        return { success: true, message: 'Gave ' + amount + ' coins. New balance: ' + newCoins };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function adminGiveSkin(uid, skinId) {
    if (!isAdminLoggedIn()) return { success: false, error: 'Admin not authenticated' };
    if (!window.firebaseReady) return { success: false, error: 'Firebase not ready' };
    
    const validSkins = ['default', 'neonBlue', 'fireRed', 'golden', 'rainbow', 'toxic', 'purple', 'white', 'black', 'orange'];
    if (!validSkins.includes(skinId)) return { success: false, error: 'Invalid skin ID' };
    
    try {
        const { getDoc, updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
        const docRef = doc(window.db, 'users', uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) return { success: false, error: 'Player not found' };
        
        const currentSkins = docSnap.data().skins || ['default'];
        if (currentSkins.includes(skinId)) return { success: false, error: 'Player already owns this skin' };
        
        const newSkins = [...currentSkins, skinId];
        
        await updateDoc(docRef, {
            skins: newSkins,
            lastSkinGrant: Date.now(),
            skinGrantId: skinId,
            skinGrantBy: 'Admin'
        });
        
        return { success: true, message: 'Gave ' + skinId + ' skin to player' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function adminDeleteScore(scoreId) {
    if (!isAdminLoggedIn()) return { success: false, error: 'Admin not authenticated' };
    if (!window.firebaseReady) return { success: false, error: 'Firebase not ready' };
    
    try {
        const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
        await deleteDoc(doc(window.db, 'leaderboard', scoreId));
        return { success: true, message: 'Score deleted successfully' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function showAdminLogin() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.add('active');
}

function closeAdminLogin() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.remove('active');
}

async function handleAdminLogin() {
    const username = document.getElementById('admin-username')?.value?.trim();
    const password = document.getElementById('admin-password')?.value;
    
    if (!username || !password) {
        alert('Please enter username and password');
        return;
    }
    
    const result = await adminLogin(username, password);
    
    if (result.success) {
        closeAdminLogin();
        showAdminPanel();
        alert('Welcome, Admin!');
    } else {
        alert('Invalid credentials');
    }
}

function showAdminPanel() {
    if (!isAdminLoggedIn()) {
        showAdminLogin();
        return;
    }
    
    const panel = document.getElementById('admin-panel-modal');
    if (panel) {
        panel.classList.add('active');
        loadAdminDashboard();
    }
}

function closeAdminPanel() {
    const panel = document.getElementById('admin-panel-modal');
    if (panel) panel.classList.remove('active');
}

async function loadAdminDashboard() {
    const container = document.getElementById('admin-dashboard-content');
    if (!container) return;
    
    container.innerHTML = '<p>Loading admin dashboard...</p>';
    
    const playersResult = await adminGetAllPlayers();
    
    if (!playersResult.success) {
        container.innerHTML = '<p>Error loading data: ' + playersResult.error + '</p>';
        return;
    }
    
    const players = playersResult.players;
    const totalPlayers = players.length;
    const bannedPlayers = players.filter(p => p.banned).length;
    const activePlayers = players.filter(p => !p.banned).length;
    
    let html = '<div class="admin-stats">' +
        '<div class="admin-stat-box"><div class="stat-value">' + totalPlayers + '</div><div class="stat-label">Total Players</div>' +
        '<div class="admin-stat-box"><div class="stat-value">' + activePlayers + '</div><div class="stat-label">Active Players</div>' +
        '<div class="admin-stat-box"><div class="stat-value">' + bannedPlayers + '</div><div class="stat-label">Banned Players</div>' +
        '</div>' +
        '<h3>All Players</h3>' +
        '<div class="admin-players-list"><table class="admin-table"><thead><tr>' +
        '<th>Username</th><th>Email</th><th>Coins</th><th>Games</th><th>Status</th><th>Actions</th>' +
        '</tr></thead><tbody>';
    
    players.forEach(player => {
        const status = player.banned ? '<span class="status-banned">Banned</span>' : '<span class="status-active">Active</span>';
        const banButton = player.banned ? 
            '<button class="admin-btn admin-btn-green" onclick="adminUnbanPlayerByUid(\'' + player.uid + '\')">Unban</button>' :
            '<button class="admin-btn admin-btn-red" onclick="adminBanPlayerByUid(\'' + player.uid + '\')">Ban</button>';
        
        html += '<tr>' +
            '<td>' + escapeHtml(player.username) + '</td>' +
            '<td>' + escapeHtml(player.email) + '</td>' +
            '<td>' + player.coins + '</td>' +
            '<td>' + (player.totalGames || 0) + '</td>' +
            '<td>' + status + '</td>' +
            '<td>' +
            '<button class="admin-btn" onclick="adminViewPlayer(\'' + player.uid + '\')">View</button>' +
            banButton +
            '<button class="admin-btn admin-btn-gold" onclick="adminGiveCoinsToPlayer(\'' + player.uid + '\')">+Coins</button>' +
            '</td></tr>';
    });
    
    html += '</tbody></table></div>';
    
    container.innerHTML = html;
}

async function adminViewPlayer(uid) {
    const result = await adminGetPlayerProfile(uid);
    
    if (!result.success) {
        alert('Error: ' + result.error);
        return;
    }
    
    const profile = result.profile;
    
    let html = '<div class="admin-player-profile">' +
        '<h3>Player Profile: ' + escapeHtml(profile.username) + '</h3>' +
        '<div class="profile-details">' +
        '<p><strong>UID:</strong> ' + profile.uid + '</p>' +
        '<p><strong>Email:</strong> ' + escapeHtml(profile.email) + '</p>' +
        '<p><strong>Coins:</strong> ' + profile.coins + '</p>' +
        '<p><strong>Skins:</strong> ' + profile.skins.join(', ') + '</p>' +
        '<p><strong>Total Games:</strong> ' + profile.totalGames + '</p>' +
        '<p><strong>Status:</strong> ' + (profile.banned ? 'BANNED - ' + profile.banReason : 'Active') + '</p>' +
        '</div>' +
        '<h4>Recent Scores</h4><div class="admin-scores-list">';
    
    if (profile.recentScores && profile.recentScores.length > 0) {
        profile.recentScores.forEach(score => {
            html += '<div class="admin-score-item">' +
                '<span>' + score.gameId + '</span>' +
                '<span>' + score.score + '</span>' +
                '<span>' + new Date(score.timestamp).toLocaleDateString() + '</span>' +
                '</div>';
        });
    } else {
        html += '<p>No recent scores</p>';
    }
    
    html += '</div>';
    
    const container = document.getElementById('admin-dashboard-content');
    if (container) {
        container.innerHTML = html + '<button class="admin-btn" onclick="loadAdminDashboard()">Back to Dashboard</button>';
    }
}

async function adminBanPlayerByUid(uid) {
    const reason = prompt('Enter ban reason:');
    if (reason === null) return;
    
    const result = await adminBanPlayer(uid, reason);
    
    if (result.success) {
        alert('Player banned successfully');
        loadAdminDashboard();
    } else {
        alert('Error: ' + result.error);
    }
}

async function adminUnbanPlayerByUid(uid) {
    const result = await adminUnbanPlayer(uid);
    
    if (result.success) {
        alert('Player unbanned successfully');
        loadAdminDashboard();
    } else {
        alert('Error: ' + result.error);
    }
}

async function adminGiveCoinsToPlayer(uid) {
    const amount = prompt('Enter amount of coins to give (1-100000):');
    if (amount === null) return;
    
    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum < 1 || amountNum > 100000) {
        alert('Invalid amount. Please enter a number between 1 and 100000.');
        return;
    }
    
    const result = await adminGiveCoins(uid, amountNum);
    
    if (result.success) {
        alert(result.message);
        loadAdminDashboard();
    } else {
        alert('Error: ' + result.error);
    }
}

function handleAdminLogout() {
    adminLogout();
    closeAdminPanel();
    alert('Admin logged out');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function initAdminSystem() {
    restoreAdminSession();
    console.log('Admin System initialized');
}

window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.isAdminLoggedIn = isAdminLoggedIn;
window.showAdminLogin = showAdminLogin;
window.closeAdminLogin = closeAdminLogin;
window.handleAdminLogin = handleAdminLogin;
window.showAdminPanel = showAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.loadAdminDashboard = loadAdminDashboard;
window.adminViewPlayer = adminViewPlayer;
window.adminBanPlayerByUid = adminBanPlayerByUid;
window.adminUnbanPlayerByUid = adminUnbanPlayerByUid;
window.adminGiveCoinsToPlayer = adminGiveCoinsToPlayer;
window.handleAdminLogout = handleAdminLogout;
window.adminGetAllPlayers = adminGetAllPlayers;
window.adminGetPlayerProfile = adminGetPlayerProfile;
window.adminBanPlayer = adminBanPlayer;
window.adminUnbanPlayer = adminUnbanPlayer;
window.adminGiveCoins = adminGiveCoins;
window.adminGiveSkin = adminGiveSkin;
window.adminDeleteScore = adminDeleteScore;

initAdminSystem();

console.log('Admin System loaded - Username: Admin, Password: AdminPass2024!');
