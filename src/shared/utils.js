// Utility functions for the YouTube Ad Volume Controller

const utils = {
  /**
   * Get the current video element
   * @returns {HTMLVideoElement|null}
   */
  getCurrentVideoElement() {
    return document.querySelector(CONFIG.SELECTORS.VIDEO_PLAYER);
  },

  /**
   * Get the YouTube player element
   * @returns {HTMLElement|null}
   */
  getPlayerElement() {
    return document.querySelector(CONFIG.SELECTORS.MOVIE_PLAYER);
  },

  /**
   * Check if current page is YouTube
   * @returns {boolean}
   */
  isYouTubePage() {
    return window.location.hostname.includes('youtube.com');
  },

  /**
   * Set video volume and dispatch synthetic events to ensure YouTube recognizes the change
   * @param {HTMLVideoElement} videoPlayer 
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(videoPlayer, volume) {
    if (!videoPlayer) return;
    
    videoPlayer.volume = volume;
    
    // Dispatch synthetic events to simulate user interaction and bypass YouTube's volume control
    const event = new Event('input', { bubbles: true });
    videoPlayer.dispatchEvent(event);
  },

  /**
   * Debounce function to limit frequent calls
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  /**
   * Check if dev panel is currently visible (used for conditional logging)
   * @returns {boolean}
   */
  isDevModeActive() {
    return document.getElementById(CONFIG.DEV_PANEL.ID) !== null;
  },

  /**
   * Conditional logging - only shows messages when dev panel is active
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (this.isDevModeActive()) {
      console.log('YouTube Ad Volume Controller:', ...args);
    }
  }
};

if (typeof window !== 'undefined') {
  window.utils = utils;
}
