// Ad Detector - Handles ad detection logic
class AdDetector {
  constructor(volumeManager) {
    this.volumeManager = volumeManager;
    this.playerElement = null;
    this.adPlaying = false;
    this.observer = null;
  }

  /**
   * Initialize ad detection
   */
  init() {
    this.playerElement = utils.getPlayerElement();

    if (this.playerElement) {
      this.setupObserver();
      this.setupVideoVolumeListener();
      this.checkAd(); // Initial check
    } else {
      // Retry after delay
      setTimeout(() => this.init(), CONFIG.INIT_RETRY_DELAY);
    }
  }

  /**
   * Setup mutation observer for player class changes
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
  }

  /**
   * Setup video volume change listener
   */
  setupVideoVolumeListener() {
    const videoPlayer = utils.getCurrentVideoElement();
    if (videoPlayer) {
      videoPlayer.addEventListener('volumechange', () => {
        // Track user volume changes when not in ad
        if (!this.adPlaying && !this.volumeManager.hasVolumeStateSaved()) {
          this.volumeManager.updateLastKnownUserVolume(videoPlayer.volume);
          utils.log('User volume changed to:', videoPlayer.volume);
        }
      });
    }
  }

  /**
   * Check if ad is currently playing
   */
  checkAd() {
    if (!this.playerElement) {
      this.playerElement = utils.getPlayerElement();
      if (!this.playerElement) return;
    }

    const videoPlayer = utils.getCurrentVideoElement();
    
    // Check if any type of ad is showing
    const isAdShowing = this.playerElement.classList.contains(CONFIG.AD_CLASSES.AD_SHOWING) ||
                       this.playerElement.classList.contains(CONFIG.AD_CLASSES.AD_INTERRUPTING);

    // Check if we're in an ad sequence (multiple ads)
    const isAdSequence = this.playerElement.querySelector(CONFIG.SELECTORS.AD_PREVIEW_CONTAINER);

    this.handleAdStateChange(isAdShowing, isAdSequence, videoPlayer);
  }

  /**
   * Handle ad state changes
   * @param {boolean} isAdShowing 
   * @param {boolean} isAdSequence 
   * @param {HTMLVideoElement} videoPlayer 
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
    this.adPlaying = true;
    if (videoPlayer) {
      this.volumeManager.saveCurrentVolumeState(videoPlayer);
      // Apply ad volume after short delay
      setTimeout(() => {
        utils.setVolume(videoPlayer, this.volumeManager.getAdVolume());
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
