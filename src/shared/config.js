// Configuration constants for the YouTube Ad Volume Controller
const CONFIG = {
  // Volume settings
  DEFAULT_AD_VOLUME: 0.05, // 5% volume for ads
  VOLUME_CHANGE_THRESHOLD: 0.01, // Minimum volume change to register
  
  // Timing constants (in milliseconds)
  AD_VOLUME_APPLY_DELAY: 10,
  INIT_RETRY_DELAY: 1000,
  DEV_PANEL_UPDATE_INTERVAL: 1000,
  PERIODIC_CHECK_INTERVAL: 1000,
  
  // Chrome storage keys
  STORAGE_KEYS: {
    AD_VOLUME: 'adVolume'
  },
  
  // YouTube DOM selectors
  SELECTORS: {
    VIDEO_PLAYER: 'video',
    MOVIE_PLAYER: '#movie_player', // Main YouTube player container
    AD_PREVIEW_CONTAINER: '.ytp-ad-preview-container' // Ad sequence indicator
  },
  
  // YouTube CSS classes for ad detection
  AD_CLASSES: {
    AD_SHOWING: 'ad-showing', // Single ad playing
    AD_INTERRUPTING: 'ad-interrupting' // Interruptive ad (skippable/non-skippable)
  },
  
  // Developer panel configuration
  DEV_PANEL: {
    ID: 'yt-volume-control-dev-panel',
    TOGGLE_SHORTCUT: { ctrl: true, shift: true, key: 'D' }, // Ctrl+Shift+D
    STYLES: `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      font-family: monospace;
      font-size: 14px;
    `
  }
};

if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
