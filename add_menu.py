#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# Add hamburger menu HTML after <body>
hamburger_html = '''    <!-- Hamburger Menu -->
    <button class="hamburger-btn" id="hamburger-btn" onclick="toggleMenu()">
        <span></span>
        <span></span>
        <span></span>
    </button>
    
    <div class="menu-overlay" id="menu-overlay" onclick="toggleMenu()"></div>
    
    <div class="slide-menu" id="slide-menu">
        <div class="menu-category">
            <div class="menu-category-title">Play</div>
            <button class="menu-btn active" onclick="switchTabFromMenu('scenarios', this)">
                <span class="menu-btn-icon">🎯</span> Scenarios
            </button>
        </div>
        
        <div class="menu-category">
            <div class="menu-category-title">Progress</div>
            <button class="menu-btn" onclick="switchTabFromMenu('bests', this)">
                <span class="menu-btn-icon">🏆</span> Personal Bests
            </button>
            <button class="menu-btn" onclick="switchTabFromMenu('stats', this)">
                <span class="menu-btn-icon">📊</span> Stats
            </button>
        </div>
        
        <div class="menu-category">
            <div class="menu-category-title">Compete</div>
            <button class="menu-btn" onclick="switchTabFromMenu('leaderboard', this)">
                <span class="menu-btn-icon">🌍</span> Leaderboard
            </button>
            <button class="menu-btn" onclick="switchTabFromMenu('weekly', this)">
                <span class="menu-btn-icon">🏅</span> Weekly
            </button>
            <button class="menu-btn" onclick="switchTabFromMenu('monthly', this)">
                <span class="menu-btn-icon">🏆</span> Monthly
            </button>
        </div>
        
        <div class="menu-category">
            <div class="menu-category-title">More</div>
            <button class="menu-btn" onclick="switchTabFromMenu('minigames', this)">
                <span class="menu-btn-icon">🎮</span> Mini Games
            </button>
            <button class="menu-btn" onclick="switchTabFromMenu('skins', this)">
                <span class="menu-btn-icon">🎨</span> Skins
            </button>
            <button class="menu-btn" onclick="switchTabFromMenu('challenges', this)">
                <span class="menu-btn-icon">🎁</span> Challenges
            </button>
        </div>
        
        <div class="menu-category">
            <div class="menu-category-title">Tools</div>
            <button class="menu-btn" onclick="openAnalyticsFromMenu(this)">
                <span class="menu-btn-icon">📈</span> Analytics
            </button>
            <button class="menu-btn" onclick="openSettingsFromMenu(this)">
                <span class="menu-btn-icon">⚙️</span> Settings
            </button>
        </div>
'''

# Insert after <body>
content = content.replace('<body>', '<body>\n' + hamburger_html)

with open('index.html', 'w') as f:
    f.write(content)

print('Hamburger menu added successfully')
