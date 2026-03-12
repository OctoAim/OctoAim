// ==================== CUSTOM CROSSHAIR SYSTEM ====================

// Crosshair presets
const CROSSHAIR_PRESETS = {
    dot: { name: 'Dot', type: 'dot' },
    cross: { name: 'Cross', type: 'cross' },
    circle: { name: 'Circle', type: 'circle' },
    gap: { name: 'Gap', type: 'gap' },
    tstyle: { name: 'T-Style', type: 'tstyle' }
};

// Default crosshair settings
const DEFAULT_CROSSHAIR = {
    preset: 'dot',
    size: 4,
    thickness: 2,
    color: '#00ff88',
    outline: true,
    outlineColor: '#000000',
    gap: 4,
    opacity: 100,
    dynamic: true,
    followCursor: true
};

// Current crosshair settings
let currentCrosshair = { ...DEFAULT_CROSSHAIR };

// Initialize crosshair system
function initCrosshair() {
    // Load saved crosshair settings
    const savedCrosshair = localStorage.getItem('aimtrainer_crosshair');
    if (savedCrosshair) {
        try {
            currentCrosshair = { ...DEFAULT_CROSSHAIR, ...JSON.parse(savedCrosshair) };
        } catch (e) {
            console.error('Error loading crosshair settings:', e);
        }
    }
    
    // Apply crosshair to game canvases
    applyCrosshairToGames();
    
    // Render crosshair options in settings
    renderCrosshairOptions();
    
    // Update preview
    updateCrosshairPreview();
}

// Save crosshair settings
function saveCrosshairSettings() {
    localStorage.setItem('aimtrainer_crosshair', JSON.stringify(currentCrosshair));
    applyCrosshairToGames();
}

// Apply crosshair to game pages
function applyCrosshairToGames() {
    // Create or update custom crosshair element
    let crosshairEl = document.getElementById('custom-crosshair');
    if (!crosshairEl) {
        crosshairEl = document.createElement('div');
        crosshairEl.id = 'custom-crosshair';
        crosshairEl.className = 'custom-crosshair';
        document.body.appendChild(crosshairEl);
    }
    
    // Apply crosshair styles based on preset
    applyCrosshairStyle(crosshairEl, currentCrosshair);
    
    // Update crosshair visibility
    crosshairEl.style.display = currentCrosshair.followCursor ? 'block' : 'none';
}

// Apply crosshair style based on settings
function applyCrosshairStyle(el, settings) {
    const { preset, size, thickness, color, outline, outlineColor, gap, opacity } = settings;
    const opacityVal = opacity / 100;
    
    let styles = `
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        opacity: ${opacityVal};
        transition: opacity 0.2s;
    `;
    
    switch (preset) {
        case 'dot':
            styles += `
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                transform: translate(-50%, -50%);
                ${outline ? `box-shadow: 0 0 1px ${outlineColor}, 0 0 2px ${outlineColor};` : ''}
            `;
            break;
            
        case 'cross':
            styles += `
                width: ${size * 4 + gap}px;
                height: ${thickness}px;
                background: ${color};
                transform: translate(-50%, -50%);
                ${outline ? `box-shadow: 0 0 1px ${outlineColor};` : ''}
            `;
            // Horizontal line
            el.innerHTML = `
                <div class="crosshair-h" style="
                    position: absolute;
                    width: ${size * 4 + gap}px;
                    height: ${thickness}px;
                    background: ${color};
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    ${outline ? `box-shadow: 0 0 1px ${outlineColor};` : ''}
                "></div>
                <div class="crosshair-v" style="
                    position: absolute;
                    width: ${thickness}px;
                    height: ${size * 4 + gap}px;
                    background: ${color};
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    ${outline ? `box-shadow: 0 0 1px ${outlineColor};` : ''}
                "></div>
            `;
            el.style.cssText = styles;
            return;
            
        case 'circle':
            styles += `
                width: ${size * 3}px;
                height: ${size * 3}px;
                border: ${thickness}px solid ${color};
                border-radius: 50%;
                transform: translate(-50%, -50%);
                ${outline ? `box-shadow: 0 0 1px ${outlineColor};` : ''}
            `;
            break;
            
        case 'gap':
            styles += `
                width: ${size * 3}px;
                height: ${size * 3}px;
            `;
            el.innerHTML = `
                <div class="gap-h" style="
                    position: absolute;
                    width: ${size * 3}px;
                    height: ${thickness}px;
                    background: ${color};
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    ${outline ? `box-shadow: 0 0 1px ${outlineColor};` : ''}
                "></div>
                <div class="gap-v" style="
                    position: absolute;
                    width: ${thickness}px;
                    height: ${size * 3}px;
                    background: ${color};
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    ${outline ? `box-shadow: 0 0 1px ${outlineColor};` : ''}
                "></div>
                <div class="gap-center" style="
                    position: absolute;
                    width: ${thickness}px;
                    height: ${thickness}px;
                    background: ${color};
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    border-radius: 50%;
                "></div>
            `;
            el.style.cssText = styles;
            return;
            
        case 'tstyle':
            const gapSize = gap + size;
            styles += `
                width: ${size * 3}px;
                height: ${size * 3}px;
            `;
            el.innerHTML = `
                <div class="t-h" style="
                    position: absolute;
                    width: ${size * 3}px;
                    height: ${thickness}px;
                    background: ${color};
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    ${outline ? `box-shadow: 0 0 1px ${outlineColor};` : ''}
                "></div>
                <div class="t-v" style="
                    position: absolute;
                    width: ${thickness}px;
                    height: ${gapSize}px;
                    background: ${color};
                    left: 50%;
                    top: calc(50% + ${thickness/2}px);
                    transform: translate(-50%, 0);
                    ${outline ? `box-shadow: 0 0 1px ${outlineColor};` : ''}
                "></div>
            `;
            el.style.cssText = styles;
            return;
    }
    
    el.style.cssText = styles;
}

// Mouse movement for crosshair
document.addEventListener('mousemove', (e) => {
    const crosshairEl = document.getElementById('custom-crosshair');
    if (crosshairEl && currentCrosshair.followCursor) {
        crosshairEl.style.left = e.clientX + 'px';
        crosshairEl.style.top = e.clientY + 'px';
    }
});

// Update crosshair preview in settings
function updateCrosshairPreview() {
    const preview = document.getElementById('crosshair-preview');
    if (!preview) return;
    
    applyCrosshairStyle(preview, currentCrosshair);
    preview.style.position = 'relative';
    preview.style.left = 'auto';
    preview.style.top = 'auto';
    preview.style.display = 'flex';
    preview.style.justifyContent = 'center';
    preview.style.alignItems = 'center';
    preview.style.height = '80px';
    preview.style.margin = '15px 0';
    preview.style.transform = 'scale(1.5)';
}

// Render crosshair options in settings
function renderCrosshairOptions() {
    const container = document.getElementById('crosshair-options');
    if (!container) return;
    
    const presets = [
        { id: 'dot', name: 'Dot', icon: '•' },
        { id: 'cross', name: 'Cross', icon: '+' },
        { id: 'circle', name: 'Circle', icon: '○' },
        { id: 'gap', name: 'Gap', icon: '⌖' },
        { id: 'tstyle', name: 'T-Style', icon: '⊥' }
    ];
    
    container.innerHTML = `
        <!-- Preset Selection -->
        <div style="margin-bottom: 20px;">
            <label style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 10px;">Crosshair Style</label>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${presets.map(p => `
                    <button class="crosshair-preset-btn ${currentCrosshair.preset === p.id ? 'active' : ''}" 
                        onclick="selectCrosshairPreset('${p.id}')"
                        style="
                            flex: 1;
                            min-width: 70px;
                            padding: 12px;
                            background: rgba(0,0,0,0.4);
                            border: 2px solid ${currentCrosshair.preset === p.id ? '#00ff88' : '#333'};
                            border-radius: 10px;
                            color: #fff;
                            font-size: 24px;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">
                        ${p.icon}
                    </button>
                `).join('')}
            </div>
        </div>
        
        <!-- Preview -->
        <div id="crosshair-preview" style="
            background: rgba(0,0,0,0.5);
            border: 1px solid #333;
            border-radius: 10px;
            margin-bottom: 20px;
        "></div>
        
        <!-- Size Slider -->
        <div style="margin-bottom: 15px;">
            <label style="color: #888; font-size: 12px; display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Size</span>
                <span id="crosshair-size-val" style="color: #00ff88;">${currentCrosshair.size}px</span>
            </label>
            <input type="range" id="crosshair-size" min="1" max="20" value="${currentCrosshair.size}" 
                oninput="updateCrosshairSetting('size', this.value)"
                style="width: 100%; height: 6px; border-radius: 3px; background: #333; outline: none; -webkit-appearance: none;">
        </div>
        
        <!-- Thickness Slider -->
        <div style="margin-bottom: 15px;">
            <label style="color: #888; font-size: 12px; display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Thickness</span>
                <span id="crosshair-thickness-val" style="color: #00ff88;">${currentCrosshair.thickness}px</span>
            </label>
            <input type="range" id="crosshair-thickness" min="1" max="10" value="${currentCrosshair.thickness}" 
                oninput="updateCrosshairSetting('thickness', this.value)"
                style="width: 100%; height: 6px; border-radius: 3px; background: #333; outline: none; -webkit-appearance: none;">
        </div>
        
        <!-- Gap Slider -->
        <div style="margin-bottom: 15px;">
            <label style="color: #888; font-size: 12px; display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Gap</span>
                <span id="crosshair-gap-val" style="color: #00ff88;">${currentCrosshair.gap}px</span>
            </label>
            <input type="range" id="crosshair-gap" min="0" max="15" value="${currentCrosshair.gap}" 
                oninput="updateCrosshairSetting('gap', this.value)"
                style="width: 100%; height: 6px; border-radius: 3px; background: #333; outline: none; -webkit-appearance: none;">
        </div>
        
        <!-- Opacity Slider -->
        <div style="margin-bottom: 15px;">
            <label style="color: #888; font-size: 12px; display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Opacity</span>
                <span id="crosshair-opacity-val" style="color: #00ff88;">${currentCrosshair.opacity}%</span>
            </label>
            <input type="range" id="crosshair-opacity" min="10" max="100" value="${currentCrosshair.opacity}" 
                oninput="updateCrosshairSetting('opacity', this.value)"
                style="width: 100%; height: 6px; border-radius: 3px; background: #333; outline: none; -webkit-appearance: none;">
        </div>
        
        <!-- Color Picker -->
        <div style="margin-bottom: 15px;">
            <label style="color: #888; font-size: 12px; display: block; margin-bottom: 8px;">Crosshair Color</label>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${['#00ff88', '#ff4444', '#4488ff', '#ffaa00', '#ffffff', '#000000'].map(color => `
                    <button onclick="updateCrosshairSetting('color', '${color}')" 
                        style="
                            width: 36px;
                            height: 36px;
                            background: ${color};
                            border: 3px solid ${currentCrosshair.color === color ? '#fff' : 'transparent'};
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">
                    </button>
                `).join('')}
                <input type="color" id="crosshair-color-picker" value="${currentCrosshair.color}"
                    onchange="updateCrosshairSetting('color', this.value)"
                    style="width: 36px; height: 36px; border: none; border-radius: 8px; cursor: pointer;">
            </div>
        </div>
        
        <!-- Outline Toggle -->
        <div style="margin-bottom: 15px;">
            <label style="color: #fff; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="crosshair-outline" ${currentCrosshair.outline ? 'checked' : ''} 
                    onchange="updateCrosshairSetting('outline', this.checked)"
                    style="width: 20px; height: 20px; accent-color: #00ff88;">
                <span>Outline</span>
            </label>
        </div>
        
        <!-- Follow Cursor Toggle -->
        <div style="margin-bottom: 20px;">
            <label style="color: #fff; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="crosshair-follow" ${currentCrosshair.followCursor ? 'checked' : ''} 
                    onchange="updateCrosshairSetting('followCursor', this.checked)"
                    style="width: 20px; height: 20px; accent-color: #00ff88;">
                <span>Show Crosshair</span>
            </label>
        </div>
        
        <!-- Reset Button -->
        <button onclick="resetCrosshairToDefault()" 
            style="
                width: 100%;
                padding: 12px;
                background: transparent;
                border: 2px solid #ff4444;
                border-radius: 10px;
                color: #ff4444;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            ">
            Reset to Default
        </button>
    `;
    
    // Initialize preview
    setTimeout(updateCrosshairPreview, 100);
}

// Select crosshair preset
function selectCrosshairPreset(preset) {
    currentCrosshair.preset = preset;
    saveCrosshairSettings();
    renderCrosshairOptions();
}

// Update crosshair setting
function updateCrosshairSetting(key, value) {
    // Convert string booleans to actual booleans
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    
    // Parse numeric values
    if (['size', 'thickness', 'gap', 'opacity'].includes(key)) {
        value = parseInt(value);
    }
    
    currentCrosshair[key] = value;
    
    // Update display value
    const displayEl = document.getElementById(`crosshair-${key}-val`);
    if (displayEl) {
        if (key === 'opacity') {
            displayEl.textContent = value + '%';
        } else {
            displayEl.textContent = value + 'px';
        }
    }
    
    saveCrosshairSettings();
    updateCrosshairPreview();
}

// Reset crosshair to default
function resetCrosshairToDefault() {
    currentCrosshair = { ...DEFAULT_CROSSHAIR };
    saveCrosshairSettings();
    renderCrosshairOptions();
    updateCrosshairPreview();
}

// Get current crosshair settings (for game pages to use)
function getCrosshairSettings() {
    return { ...currentCrosshair };
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.initCrosshair = initCrosshair;
    window.getCrosshairSettings = getCrosshairSettings;
    window.selectCrosshairPreset = selectCrosshairPreset;
    window.updateCrosshairSetting = updateCrosshairSetting;
    window.resetCrosshairToDefault = resetCrosshairToDefault;
}

