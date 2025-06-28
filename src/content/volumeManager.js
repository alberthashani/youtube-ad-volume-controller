// Volume Manager - Handles volume state and transitions
class VolumeManager {
  constructor() {
    this.adVolume = CONFIG.DEFAULT_AD_VOLUME;
    this.savedVolume = null;
    this.savedMuted = null;
    this.lastKnownUserVolume = null;
    this.volumeSaveTimeout = null;
    
    this.loadAdVolumeFromStorage();
  }

  /**
   * Load saved ad volume from Chrome storage
   */
  loadAdVolumeFromStorage() {
    chrome.storage.sync.get([CONFIG.STORAGE_KEYS.AD_VOLUME], (result) => {
      if (result.adVolume !== undefined) {
        this.adVolume = result.adVolume;
      }
    });
  }

  /**
   * Set ad volume and save to storage
   * @param {number} volume 
   */
  setAdVolume(volume) {
    this.adVolume = volume;
    chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.AD_VOLUME]: volume });
    
    // Apply to current video if ad is playing
    const videoPlayer = utils.getCurrentVideoElement();
    if (videoPlayer && window.adDetector?.isAdPlaying()) {
      utils.setVolume(videoPlayer, volume);
    }
  }

  /**
   * Get current ad volume
   * @returns {number}
   */
  getAdVolume() {
    return this.adVolume;
  }

  /**
   * Save current volume state before ad starts
   * @param {HTMLVideoElement} videoPlayer 
   */
  saveCurrentVolumeState(videoPlayer) {
    // Clear any existing timeout
    if (this.volumeSaveTimeout) {
      clearTimeout(this.volumeSaveTimeout);
    }
    
    // Only save if we don't already have a saved volume
    if (videoPlayer && this.savedVolume === null) {
      this.savedVolume = this.lastKnownUserVolume !== null ? 
        this.lastKnownUserVolume : videoPlayer.volume;
      this.savedMuted = videoPlayer.muted;
      utils.log('Saved volume:', this.savedVolume, 'muted:', this.savedMuted);
    }
  }

  /**
   * Restore saved volume state after ad ends
   * @param {HTMLVideoElement} videoPlayer 
   */
  restoreSavedVolumeState(videoPlayer) {
    if (videoPlayer && this.savedVolume !== null) {
      utils.log('Restoring volume:', this.savedVolume, 'muted:', this.savedMuted);
      utils.setVolume(videoPlayer, this.savedVolume);
      if (this.savedMuted !== null) {
        videoPlayer.muted = this.savedMuted;
      }
      this.clearSavedState();
    }
  }

  /**
   * Clear saved volume state
   */
  clearSavedState() {
    this.savedVolume = null;
    this.savedMuted = null;
  }

  /**
   * Update last known user volume
   * @param {number} volume 
   */
  updateLastKnownUserVolume(volume) {
    this.lastKnownUserVolume = volume;
  }

  /**
   * Get saved volume for display purposes
   * @returns {number|null}
   */
  getSavedVolume() {
    return this.savedVolume;
  }

  /**
   * Check if volume state is saved
   * @returns {boolean}
   */
  hasVolumeStateSaved() {
    return this.savedVolume !== null;
  }

  /**
   * Cleanup function
   */
  cleanup() {
    if (this.volumeSaveTimeout) {
      clearTimeout(this.volumeSaveTimeout);
      this.volumeSaveTimeout = null;
    }
  }
}

// Make VolumeManager available globally
if (typeof window !== 'undefined') {
  window.VolumeManager = VolumeManager;
}
