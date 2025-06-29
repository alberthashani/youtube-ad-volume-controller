// Volume Manager - Handles volume state transitions between regular content and ads
class VolumeManager {
  constructor() {
    this.adVolume = CONFIG.DEFAULT_AD_VOLUME;
    this.videoVolume = CONFIG.DEFAULT_VIDEO_VOLUME;
    this.savedVolume = null; // User's volume before ad started
    this.savedMuted = null; // User's muted state before ad started
    this.lastKnownUserVolume = null;
    this.volumeSaveTimeout = null;
    
    this.loadAdVolumeFromStorage();
    this.loadVideoVolumeFromStorage();
    this.setupVolumeChangeListener();
  }

  /**
   * Setup volume change listener for bidirectional sync
   */
  setupVolumeChangeListener() {
    // Wait for video element to be available, then attach listener
    const attachListener = () => {
      const videoPlayer = utils.getCurrentVideoElement();
      if (videoPlayer && !videoPlayer.hasVolumeListener) {
        videoPlayer.hasVolumeListener = true; // Prevent duplicate listeners
        
        videoPlayer.addEventListener('volumechange', () => {
          // During ads, save the volume change as user's intent for after the ad
          if (window.adDetector?.isAdPlaying()) {
            // User changed volume during ad - update our saved volume for restoration
            if (this.savedVolume !== null) {
              this.savedVolume = videoPlayer.volume;
            }
            // Also update videoVolume preference if volume was changed by user
            this.videoVolume = videoPlayer.volume;
            chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.VIDEO_VOLUME]: this.videoVolume });
          } else {
            // Not during ad - this is a normal video volume change
            this.lastKnownUserVolume = videoPlayer.volume;
            this.videoVolume = videoPlayer.volume;
            chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.VIDEO_VOLUME]: this.videoVolume });
          }
          
          // Always notify popup of volume changes for sync
          chrome.runtime.sendMessage({
            action: MessageAction.VOLUME_CHANGED,
            videoVolume: this.videoVolume,
            adVolume: this.adVolume
          }).catch(() => {
            // Popup might not be open, ignore error
          });
        });
      }
    };
    
    // Try to attach immediately, and retry if video not ready
    attachListener();
    setTimeout(attachListener, 1000);
    setTimeout(attachListener, 3000);
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
   * Load saved video volume from Chrome storage
   */
  loadVideoVolumeFromStorage() {
    chrome.storage.sync.get([CONFIG.STORAGE_KEYS.VIDEO_VOLUME], (result) => {
      if (result.videoVolume !== undefined) {
        this.videoVolume = result.videoVolume;
      }
    });
  }

  /**
   * Set ad volume preference and immediately apply if ad is playing
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setAdVolume(volume) {
    this.adVolume = volume;
    chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.AD_VOLUME]: volume });
    
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
   * Set video volume preference and immediately apply if no ad is playing
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVideoVolume(volume) {
    this.videoVolume = volume;
    chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.VIDEO_VOLUME]: volume });
    
    const videoPlayer = utils.getCurrentVideoElement();
    if (videoPlayer && !window.adDetector?.isAdPlaying()) {
      utils.setVolume(videoPlayer, volume);
    }
  }

  /**
   * Get current video volume
   * @returns {number}
   */
  getVideoVolume() {
    return this.videoVolume;
  }

  /**
   * Save current volume state before ad starts (prevents overwriting existing saved state)
   * @param {HTMLVideoElement} videoPlayer 
   */
  saveCurrentVolumeState(videoPlayer) {
    if (this.volumeSaveTimeout) {
      clearTimeout(this.volumeSaveTimeout);
    }
    
    if (videoPlayer && this.savedVolume === null) {
      this.savedVolume = this.lastKnownUserVolume !== null ? 
        this.lastKnownUserVolume : videoPlayer.volume;
      this.savedMuted = videoPlayer.muted;
    }
  }

  /**
   * Restore saved volume state after ad ends
   * @param {HTMLVideoElement} videoPlayer 
   */
  restoreSavedVolumeState(videoPlayer) {
    if (videoPlayer && this.savedVolume !== null) {
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
   * Update last known user volume (used when ads start to restore proper volume)
   * @param {number} volume - Volume level (0.0 to 1.0)
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

if (typeof window !== 'undefined') {
  window.VolumeManager = VolumeManager;
}
