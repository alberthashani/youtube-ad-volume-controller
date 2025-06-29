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
