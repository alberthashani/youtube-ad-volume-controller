// Main content script - Orchestrates all modules
class YouTubeAdVolumeController {
  constructor() {
    this.volumeManager = new VolumeManager();
    this.adDetector = new AdDetector(this.volumeManager);
    this.devPanel = new DevPanel(this.volumeManager, this.adDetector);
    this.messageHandler = new MessageHandler(this.volumeManager, this.devPanel);
    
    this.periodicCheckInterval = null;
    
    this.init();
  }

  /**
   * Initialize the extension
   */
  init() {
    // Only run on YouTube pages
    if (!utils.isYouTubePage()) {
      return;
    }

    this.adDetector.init();
    this.setupPeriodicCheck();
    this.setupCleanupListeners();
    
    // Make global references available for cross-module communication
    window.adDetector = this.adDetector;
    window.volumeManager = this.volumeManager;
    
    utils.log('Extension initialized');
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
   * Perform periodic consistency checks
   */
  performConsistencyCheck() {
    const videoPlayer = utils.getCurrentVideoElement();
    
    // Clean up orphaned saved volume state
    if (this.volumeManager.hasVolumeStateSaved() && !this.adDetector.isAdPlaying()) {
      utils.log('Warning - savedVolume exists but no ad playing. Cleaning up.');
      this.volumeManager.clearSavedState();
      this.devPanel.update();
    }
    
    // Update last known user volume when not in ad
    if (videoPlayer && 
        !this.adDetector.isAdPlaying() && 
        !this.volumeManager.hasVolumeStateSaved()) {
      this.volumeManager.updateLastKnownUserVolume(videoPlayer.volume);
    }
  }

  /**
   * Setup cleanup event listeners
   */
  setupCleanupListeners() {
    window.addEventListener('beforeunload', () => this.cleanup());
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    this.volumeManager.cleanup();
    this.adDetector.cleanup();
    this.devPanel.cleanup();
    
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
