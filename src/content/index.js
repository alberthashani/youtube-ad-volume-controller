// Main content script - Orchestrates all extension modules
class YouTubeAdVolumeController {
  constructor() {
    this.volumeManager = new VolumeManager();
    this.adDetector = new AdDetector(this.volumeManager);
    this.debugPanel = new DebugPanel(this.volumeManager, this.adDetector);
    this.messageHandler = new MessageHandler(this.volumeManager, this.debugPanel);
    
    this.periodicCheckInterval = null;
    
    this.init();
  }

  /**
   * Initialize the extension on YouTube pages
   */
  init() {
    if (!utils.isYouTubePage()) {
      return;
    }

    this.adDetector.init();
    this.setupPeriodicCheck();
    this.setupCleanupListeners();
    
    window.adDetector = this.adDetector;
    window.volumeManager = this.volumeManager;
    window.debugPanel = this.debugPanel;
  }

  /**
   * Setup periodic consistency check
   */
  setupPeriodicCheck() {
    this.periodicCheckInterval = setInterval(() => {
      this.performConsistencyCheck();
    }, CONFIG.PERIODIC_CHECK_INTERVAL);
  }

  /**
   * Perform periodic consistency checks to prevent state issues
   */
  performConsistencyCheck() {
    const videoPlayer = utils.getCurrentVideoElement();
    
    if (this.volumeManager.hasVolumeStateSaved() && !this.adDetector.isAdPlaying()) {
      this.debugPanel.log('Warning - savedVolume exists but no ad playing. Cleaning up.');
      this.volumeManager.clearSavedState();
      this.debugPanel.update();
    }
    
    if (videoPlayer && 
        !this.adDetector.isAdPlaying() && 
        !this.volumeManager.hasVolumeStateSaved()) {
      this.volumeManager.updateLastKnownUserVolume(videoPlayer.volume);
    }
  }

  /**
   * Setup cleanup event listeners for page navigation
   */
  setupCleanupListeners() {
    window.addEventListener('beforeunload', () => this.cleanup());
  }

  /**
   * Cleanup all resources and intervals
   */
  cleanup() {
    this.volumeManager.cleanup();
    this.adDetector.cleanup();
    this.debugPanel.cleanup();
    
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
    }
  }
}

// Initialize the extension when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new YouTubeAdVolumeController();
  });
} else {
  new YouTubeAdVolumeController();
}
