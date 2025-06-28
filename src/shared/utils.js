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
   * Set volume with synthetic event dispatching
   * @param {HTMLVideoElement} videoPlayer 
   * @param {number} volume 
   */
  setVolume(videoPlayer, volume) {
    if (!videoPlayer) return;
    
    videoPlayer.volume = volume;
    
    // Dispatch synthetic events to simulate user interaction
    const event = new Event('input', { bubbles: true });
    videoPlayer.dispatchEvent(event);
  },

  /**
   * Debounce function to limit frequent calls
   * @param {Function} func 
   * @param {number} delay 
   * @returns {Function}
   */
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  /**
   * Log messages with extension prefix
   * @param {...any} args 
   */
  log(...args) {
    console.log('YouTube Ad Volume Controller:', ...args);
  }
};

// Make utils available globally
if (typeof window !== 'undefined') {
  window.utils = utils;
}
