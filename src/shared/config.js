// Configuration constants for the YouTube Ad Volume Controller
const CONFIG = {
  // Volume settings
  DEFAULT_AD_VOLUME: 0.05,
  VOLUME_CHANGE_THRESHOLD: 0.01,
  
  // Timing constants
  AD_VOLUME_APPLY_DELAY: 10, // ms
  INIT_RETRY_DELAY: 1000, // ms
  DEV_PANEL_UPDATE_INTERVAL: 1000, // ms
  PERIODIC_CHECK_INTERVAL: 1000, // ms
  
  // Storage keys
  STORAGE_KEYS: {
    AD_VOLUME: 'adVolume'
  },
  
  // DOM selectors
  SELECTORS: {
    VIDEO_PLAYER: 'video',
    MOVIE_PLAYER: '#movie_player',
    AD_PREVIEW_CONTAINER: '.ytp-ad-preview-container'
  },
  
  // CSS classes for ad detection
  AD_CLASSES: {
    AD_SHOWING: 'ad-showing',
    AD_INTERRUPTING: 'ad-interrupting'
  },
  
  // Dev panel settings
  DEV_PANEL: {
    ID: 'yt-volume-control-dev-panel',
    TOGGLE_SHORTCUT: { ctrl: true, shift: true, key: 'D' },
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

// Make config available globally
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
