// ===============================================
// SOUND SYSTEM - Audio Effects for Aim Trainer
// ===============================================

// Sound configuration
const SoundConfig = {
    masterVolume: 1.0,
    musicVolume: 0.3,
    sfxVolume: 0.7,
    hitSound: true,
    missSound: true,
    uiSounds: true,
    musicEnabled: false,
    newRecordSound: true
};

// Audio context
let audioContext = null;
let musicGain = null;
let sfxGain = null;

// Sound buffers
const soundBuffers = {};

// Initialize audio context
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create gain nodes
        musicGain = audioContext.createGain();
        musicGain.gain.value = SoundConfig.musicVolume;
        musicGain.connect(audioContext.destination);
        
        sfxGain = audioContext.createGain();
        sfxGain.gain.value = SoundConfig.sfxVolume * SoundConfig.masterVolume;
        sfxGain.connect(audioContext.destination);
        
        console.log('🎵 Audio system initialized');
        loadSoundSettings();
        return true;
    } catch (e) {
        console.warn('Audio not supported:', e);
        return false;
    }
}

// Generate synthesized sounds (no external files needed)
function generateSound(type) {
    if (!audioContext || audioContext.state === 'suspended') {
        if (audioContext) audioContext.resume();
        return;
    }
    
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(sfxGain);
    
    switch(type) {
        case 'hit':
            // High pitched "ding" for hits
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, now);
            oscillator.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            break;
            
        case 'miss':
            // Low pitched "thud" for misses
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150, now);
            oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.1);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
            break;
            
        case 'click':
            // Quick UI click
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(600, now);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            oscillator.start(now);
            oscillator.stop(now + 0.05);
            break;
            
        case 'success':
            // Success chime
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523, now);
            oscillator.frequency.setValueAtTime(659, now + 0.1);
            oscillator.frequency.setValueAtTime(784, now + 0.2);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
            break;
            
        case 'error':
            // Error buzz
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.setValueAtTime(150, now + 0.1);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            break;
            
        case 'newRecord':
            // Triumphant fanfare for new record
            const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gn = audioContext.createGain();
                osc.connect(gn);
                gn.connect(sfxGain);
                osc.type = 'sine';
                osc.frequency.value = freq;
                gn.gain.setValueAtTime(0.2, now + i * 0.1);
                gn.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.2);
            });
            return;
            
        case 'countdown':
            // Countdown beep
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, now);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
            break;
            
        case 'gameStart':
            // Game start whoosh
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.3);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
            break;
            
        case 'gameEnd':
            // Game end melody
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.setValueAtTime(300, now + 0.2);
            oscillator.frequency.setValueAtTime(200, now + 0.4);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            oscillator.start(now);
            oscillator.stop(now + 0.6);
            break;
            
        case 'coin':
            // Coin collect sound
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1200, now);
            oscillator.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            break;
            
        case 'questComplete':
            // Quest complete fanfare
            const questNotes = [523, 659, 784, 880, 1047];
            questNotes.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gn = audioContext.createGain();
                osc.connect(gn);
                gn.connect(sfxGain);
                osc.type = 'sine';
                osc.frequency.value = freq;
                gn.gain.setValueAtTime(0.15, now + i * 0.08);
                gn.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
                osc.start(now + i * 0.08);
                osc.stop(now + i * 0.08 + 0.15);
            });
            return;
    }
}

// Play sound function
function playSound(type) {
    if (!SoundConfig[type + 'Sound'] && type !== 'newRecord') return;
    if (type === 'newRecord' && !SoundConfig.newRecordSound) return;
    
    generateSound(type);
}

// UI Click handler
function playUIClick() {
    if (SoundConfig.uiSounds) {
        playSound('click');
    }
}

// Hit sound
function playHitSound() {
    if (SoundConfig.hitSound) {
        playSound('hit');
    }
}

// Miss sound
function playMissSound() {
    if (SoundConfig.missSound) {
        playSound('miss');
    }
}

// New record sound
function playNewRecordSound() {
    if (SoundConfig.newRecordSound) {
        playSound('newRecord');
    }
}

// Load sound settings from localStorage
function loadSoundSettings() {
    const saved = localStorage.getItem('aimtrainer_sound_settings');
    if (saved) {
        const settings = JSON.parse(saved);
        Object.assign(SoundConfig, settings);
    }
    
    // Apply volume settings
    if (sfxGain) {
        sfxGain.gain.value = SoundConfig.sfxVolume * SoundConfig.masterVolume;
    }
    if (musicGain) {
        musicGain.gain.value = SoundConfig.musicEnabled ? SoundConfig.musicVolume : 0;
    }
}

// Save sound settings to localStorage
function saveSoundSettings() {
    localStorage.setItem('aimtrainer_sound_settings', JSON.stringify(SoundConfig));
}

// Update master volume
function setMasterVolume(volume) {
    SoundConfig.masterVolume = Math.max(0, Math.min(1, volume));
    if (sfxGain) {
        sfxGain.gain.value = SoundConfig.sfxVolume * SoundConfig.masterVolume;
    }
    saveSoundSettings();
}

// Update SFX volume
function setSFXVolume(volume) {
    SoundConfig.sfxVolume = Math.max(0, Math.min(1, volume));
    if (sfxGain) {
        sfxGain.gain.value = SoundConfig.sfxVolume * SoundConfig.masterVolume;
    }
    saveSoundSettings();
}

// Toggle sound type
function toggleSound(type) {
    SoundConfig[type + 'Sound'] = !SoundConfig[type + 'Sound'];
    saveSoundSettings();
    return SoundConfig[type + 'Sound'];
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initAudio();
});

// Resume audio context on user interaction
document.addEventListener('click', () => {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}, { once: true });

// Make functions globally available
window.playSound = playSound;
window.playUIClick = playUIClick;
window.playHitSound = playHitSound;
window.playMissSound = playMissSound;
window.playNewRecordSound = playNewRecordSound;
window.setMasterVolume = setMasterVolume;
window.setSFXVolume = setSFXVolume;
window.toggleSound = toggleSound;
window.loadSoundSettings = loadSoundSettings;
window.SoundConfig = SoundConfig;

console.log('✅ Sound System loaded!');

