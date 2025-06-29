// Volume Manager - Handles volume state transitions between regular content and ads
class VolumeManager {
  constructor() {
    this.adVolume = CONFIG.DEFAULT_AD_VOLUME;
    this.videoVolume = CONFIG.DEFAULT_VIDEO_VOLUME;
    this.isUpdatingVolume = false; // Prevent feedback loops
    
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
          // Skip if we're programmatically updating volume to prevent feedback loops
          if (this.isUpdatingVolume) {
            return;
          }
          
          // User changed volume - update their preference
          const isAdPlaying = window.adDetector?.isAdPlaying();
          
          if (isAdPlaying) {
            // During ad: user changed volume, update their video volume preference
            // This will be applied when the ad ends
            this.videoVolume = videoPlayer.volume;
            chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.VIDEO_VOLUME]: this.videoVolume });
          } else {
            // Normal video: update video volume preference
            this.videoVolume = videoPlayer.volume;
            chrome.storage.sync.set({ [CONFIG.STORAGE_KEYS.VIDEO_VOLUME]: this.videoVolume });
          }
          
          // Always notify popup of preference changes for sync
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
      this.isUpdatingVolume = true;
      utils.setVolume(videoPlayer, volume);
      setTimeout(() => { this.isUpdatingVolume = false; }, 100);
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
      this.isUpdatingVolume = true;
      utils.setVolume(videoPlayer, volume);
      setTimeout(() => { this.isUpdatingVolume = false; }, 100);
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
   * Apply ad volume when ad starts
   * @param {HTMLVideoElement} videoPlayer 
   */
  applyAdVolume(videoPlayer) {
    if (videoPlayer) {
      this.isUpdatingVolume = true;
      utils.setVolume(videoPlayer, this.adVolume);
      setTimeout(() => { this.isUpdatingVolume = false; }, 100);
    }
  }

  /**
   * Apply video volume when ad ends
   * @param {HTMLVideoElement} videoPlayer 
   */
  applyVideoVolume(videoPlayer) {
    if (videoPlayer) {
      this.isUpdatingVolume = true;
      utils.setVolume(videoPlayer, this.videoVolume);
      setTimeout(() => { this.isUpdatingVolume = false; }, 100);
    }
  }

  /**
   * Cleanup function
   */
  cleanup() {
    // No cleanup needed in simplified version
  }
}

if (typeof window !== 'undefined') {
  window.VolumeManager = VolumeManager;
}
