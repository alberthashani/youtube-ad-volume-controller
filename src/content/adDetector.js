// Ad Detector - Monitors YouTube player for ad state changes
class AdDetector {
  constructor(volumeManager) {
    this.volumeManager = volumeManager;
    this.playerElement = null; // YouTube's main player container
    this.adPlaying = false;
    this.observer = null; // MutationObserver for class changes
  }

  /**
   * Initialize ad detection with retry mechanism
   */
  init() {
    this.playerElement = utils.getPlayerElement();

    if (this.playerElement) {
      this.setupObserver();
      this.setupVideoVolumeListener();
      this.checkAd();
    } else {
      setTimeout(() => this.init(), CONFIG.INIT_RETRY_DELAY);
    }
  }

  /**
   * Setup mutation observer to watch for YouTube player class changes (ad indicators)
   */
  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          this.checkAd();
        }
      }
    });

    this.observer.observe(this.playerElement, { attributes: true });
    
    // Initial volume sync check
    this.checkInitialVolumeSync();
  }

  /**
   * Check for volume sync issues during initialization
   */
  checkInitialVolumeSync() {
    const videoPlayer = utils.getCurrentVideoElement();
    if (videoPlayer && this.volumeManager.getLastKnownUserVolume() !== null) {
      const currentVolume = videoPlayer.volume;
      const lastKnownVolume = this.volumeManager.getLastKnownUserVolume();
      const volumeDifference = Math.abs(currentVolume - lastKnownVolume);
      
      if (volumeDifference > CONFIG.VOLUME_CHANGE_THRESHOLD) {
        window.debugPanel?.logDetailedVolumeState('INIT_VOLUME_SYNC_DISCREPANCY', {
          currentVideoVolume: currentVolume,
          lastKnownUserVolume: lastKnownVolume,
          difference: volumeDifference,
          note: 'Initial volume sync discrepancy detected'
        });
        
        // Update lastKnownUserVolume to current video volume
        this.volumeManager.updateLastKnownUserVolume(currentVolume);
      }
    }
  }

  /**
   * Track user volume changes during regular content (not ads)
   */
  setupVideoVolumeListener() {
    const videoPlayer = utils.getCurrentVideoElement();
    if (videoPlayer) {
      let lastLoggedVolume = videoPlayer.volume;
      
      videoPlayer.addEventListener('volumechange', () => {
        if (!this.adPlaying && !this.volumeManager.hasVolumeStateSaved()) {
          const newVolume = videoPlayer.volume;
          
          // Log user volume changes (avoid logging tiny changes from our own volume setting)
          if (Math.abs(newVolume - lastLoggedVolume) > CONFIG.VOLUME_CHANGE_THRESHOLD) {
            window.debugPanel?.logDetailedVolumeState('USER_VOLUME_CHANGE', {
              oldValue: lastLoggedVolume,
              newValue: newVolume
            });
            lastLoggedVolume = newVolume;
          }
          
          this.volumeManager.updateLastKnownUserVolume(newVolume);
        }
      });
    }
  }

  /**
   * Detect ad state by checking YouTube's CSS classes and DOM elements
   */
  checkAd() {
    if (!this.playerElement) {
      this.playerElement = utils.getPlayerElement();
      if (!this.playerElement) return;
    }

    const videoPlayer = utils.getCurrentVideoElement();
    
    const isAdShowing = this.playerElement.classList.contains(CONFIG.AD_CLASSES.AD_SHOWING) ||
                       this.playerElement.classList.contains(CONFIG.AD_CLASSES.AD_INTERRUPTING);

    const isAdSequence = this.playerElement.querySelector(CONFIG.SELECTORS.AD_PREVIEW_CONTAINER);

    this.handleAdStateChange(isAdShowing, isAdSequence, videoPlayer);
  }

  /**
   * Process ad state transitions and trigger appropriate actions
   * @param {boolean} isAdShowing - Whether ad CSS classes are present
   * @param {boolean} isAdSequence - Whether ad sequence indicator is present
   * @param {HTMLVideoElement} videoPlayer - Current video element
   */
  handleAdStateChange(isAdShowing, isAdSequence, videoPlayer) {
    if (isAdShowing && !this.adPlaying) {
      this.onAdStart(videoPlayer);
    } else if (!isAdShowing && !isAdSequence && this.adPlaying) {
      this.onAdEnd(videoPlayer);
    } else if (isAdShowing && this.adPlaying) {
      this.enforceAdVolume(videoPlayer);
    }
  }

  /**
   * Handle ad start
   * @param {HTMLVideoElement} videoPlayer 
   */
  onAdStart(videoPlayer) {
    // Check for volume sync discrepancy and log if found
    if (videoPlayer && this.volumeManager.getLastKnownUserVolume() !== null) {
      const currentVolume = videoPlayer.volume;
      const lastKnownVolume = this.volumeManager.getLastKnownUserVolume();
      const volumeDifference = Math.abs(currentVolume - lastKnownVolume);
      
      if (volumeDifference > CONFIG.VOLUME_CHANGE_THRESHOLD) {
        window.debugPanel?.logDetailedVolumeState('VOLUME_SYNC_DISCREPANCY', {
          currentVideoVolume: currentVolume,
          lastKnownUserVolume: lastKnownVolume,
          difference: volumeDifference,
          note: 'Video volume differs from last known user volume'
        });
      }
    }
    
    // Log BEFORE ad transition
    window.debugPanel?.logDetailedVolumeState('PRE_AD_START');
    
    this.adPlaying = true;
    if (videoPlayer) {
      this.volumeManager.saveCurrentVolumeState(videoPlayer);
      // Apply ad volume after short delay
      setTimeout(() => {
        utils.setVolume(videoPlayer, this.volumeManager.getAdVolume());
        
        // Log AFTER ad transition
        window.debugPanel?.logDetailedVolumeState('POST_AD_START');
      }, CONFIG.AD_VOLUME_APPLY_DELAY);
    }
  }

  /**
   * Handle ad end
   * @param {HTMLVideoElement} videoPlayer 
   */
  onAdEnd(videoPlayer) {
    this.adPlaying = false;
    this.volumeManager.restoreSavedVolumeState(videoPlayer);
    
    // Log AFTER ad ends and volume is restored
    window.debugPanel?.logDetailedVolumeState('POST_AD_END');
  }

  /**
   * Ensure volume stays at ad level during ad playback
   * @param {HTMLVideoElement} videoPlayer 
   */
  enforceAdVolume(videoPlayer) {
    if (videoPlayer && 
        Math.abs(videoPlayer.volume - this.volumeManager.getAdVolume()) > CONFIG.VOLUME_CHANGE_THRESHOLD) {
      utils.setVolume(videoPlayer, this.volumeManager.getAdVolume());
    }
  }

  /**
   * Check if ad is currently playing
   * @returns {boolean}
   */
  isAdPlaying() {
    return this.adPlaying;
  }

  /**
   * Cleanup function
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Make AdDetector available globally
if (typeof window !== 'undefined') {
  window.AdDetector = AdDetector;
}
