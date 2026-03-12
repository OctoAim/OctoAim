#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# Add hamburger menu and light mode JS functions
js_functions = '''

      // ==================== HAMBURGER MENU FUNCTIONS ====================
      function toggleMenu() {
          const menu = document.getElementById('slide-menu');
          const overlay = document.getElementById('menu-overlay');
          const btn = document.getElementById('hamburger-btn');
          
          menu.classList.toggle('active');
          overlay.classList.toggle('active');
          btn.classList.toggle('active');
      }

      function switchTabFromMenu(tabId, btn) {
          switchTab(tabId);
          document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          toggleMenu();
      }

      function openAnalyticsFromMenu(btn) {
          window.open('analytics.html', '_blank');
          toggleMenu();
      }

      function openSettingsFromMenu(btn) {
          showSettingsModal();
          toggleMenu();
      }

      // ==================== LIGHT MODE THEME ====================
      function renderThemeOptions() {
          const container = document.getElementById('theme-options');
          if (!container) return;
          
          const themes = [
              { id: 'default', name: 'Default Dark', colors: ['#0a0a0f', '#1a1a2e', '#00ff88'] },
              { id: 'light', name: 'Light', colors: ['#f0f2f5', '#ffffff', '#00aa55'] },
              { id: 'ocean', name: 'Ocean Blue', colors: ['#0a192f', '#112240', '#64ffda'] },
              { id: 'sunset', name: 'Sunset', colors: ['#1a0a0f', '#2d1124', '#ff6b6b'] },
              { id: 'forest', name: 'Forest', colors: ['#0a1f0a', '#1a2d1a', '#4ade80'] }
          ];
          
          const currentTheme = localStorage.getItem('aimtrainer_theme') || 'default';
          
          container.innerHTML = themes.map(theme => '''
              <div class="theme-option ''' + theme['id'] + ''' === currentTheme ? 'active' : ''" data-theme="''' + theme['id'] + '''" onclick="selectTheme('''' + theme['id'] + '''')">
                  <div style="display: flex; gap: 5px; justify-content: center; margin-bottom: 8px;">
                      ''' + ''.join('''<div style="width: 20px; height: 20px; background: ''' + c + '''; border-radius: 4px;"></div>''' for c in theme['colors']) + '''
                  </div>
                  <span class="theme-name">''' + theme['name'] + '''</span>
              </div>
          ''').join('');
      }

      function selectTheme(themeId) {
          localStorage.setItem('aimtrainer_theme', themeId);
          renderThemeOptions();
          applyTheme(themeId);
      }

      function applyTheme(themeId) {
          const themes = {
              default: { bg: '#0a0a0f', card: '#1a1a2e', accent: '#00ff88' },
              light: { bg: '#f0f2f5', card: '#ffffff', accent: '#00aa55' },
              ocean: { bg: '#0a192f', card: '#112240', accent: '#64ffda' },
              sunset: { bg: '#1a0a0f', card: '#2d1124', accent: '#ff6b6b' },
              forest: { bg: '#0a1f0a', card: '#1a2d1a', accent: '#4ade80' }
          };
          
          const theme = themes[themeId] || themes.default;
          document.body.classList.remove('light-mode');
          
          if (themeId === 'light') {
              document.body.classList.add('light-mode');
          }
          
          document.body.style.background = theme.bg;
          document.documentElement.style.setProperty('--theme-bg', theme.bg);
          document.documentElement.style.setProperty('--theme-card', theme.card);
          document.documentElement.style.setProperty('--theme-accent', theme.accent);
      }

      function initTheme() {
          const savedTheme = localStorage.getItem('aimtrainer_theme') || 'default';
          applyTheme(savedTheme);
      }

      initTheme();
'''

# Find the location and add the functions
content = content.replace(
    '      createParticles();\n      initPersonalBests();\n      initStats();',
    '      createParticles();\n      initPersonalBests();\n      initStats();\n' + js_functions
)

with open('index.html', 'w') as f:
    f.write(content)

print('JavaScript functions added successfully')
