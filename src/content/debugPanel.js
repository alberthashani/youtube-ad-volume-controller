// Debug Panel - Development debugging overlay for volume and ad state monitoring
class DebugPanel {
  constructor(volumeManager, adDetector) {
    this.volumeManager = volumeManager;
    this.adDetector = adDetector;
    this.panel = null;
    this.updateInterval = null;
    this.isEnabled = true; // Always enabled - keyboard shortcut controls visibility
    this.isDebugModeActive = false; // Controls both panel visibility and logging
    
    this.setupKeyboardShortcut();
  }

  /**
   * Check if debug panel is currently visible (used for conditional logging)
   * @returns {boolean}
   */
  isDebugPanelVisible() {
    return document.getElementById(CONFIG.DEBUG_PANEL.ID) !== null;
  }

  /**
   * Conditional logging - only shows messages when debug mode is active
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (this.isDebugModeActive) {
      console.log('YouTube Ad Volume Controller:', ...args);
    }
  }

  /**
   * Enhanced logging with context
   * @param {string} context - Context identifier for the log
   * @param {...any} args - Arguments to log
   */
  logWithContext(context, ...args) {
    if (this.isDebugModeActive) {
      console.log(`[${context}] YouTube Ad Volume Controller:`, ...args);
    }
  }

  /**
   * Comprehensive volume state logger
   * @param {string} event - Event that triggered the logging
   * @param {Object} additionalData - Additional data to include
   */
  logDetailedVolumeState(event, additionalData = {}) {
    if (!this.isDebugModeActive) return;
    
    const videoPlayer = utils.getCurrentVideoElement();
    const volumeState = {
      event: event,
      timestamp: new Date().toISOString(),
      videoElement: {
        volume: videoPlayer?.volume || 0,
        muted: videoPlayer?.muted || false,
        exists: !!videoPlayer
      },
      extension: {
        savedVolume: this.volumeManager.getSavedVolume(),
        savedMuted: this.volumeManager.getSavedMuted(),
        adVolume: this.volumeManager.getAdVolume(),
        lastKnownUserVolume: this.volumeManager.getLastKnownUserVolume(),
        isAdPlaying: this.adDetector.isAdPlaying(),
        hasVolumeStateSaved: this.volumeManager.hasVolumeStateSaved()
      },
      ...additionalData
    };
    
    console.log(`[VOLUME_STATE_${event}]`, volumeState);
  }

  /**
   * Setup keyboard shortcut for toggling debug panel
   */
  setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      const shortcut = CONFIG.DEBUG_PANEL.TOGGLE_SHORTCUT;
      if (e.ctrlKey === shortcut.ctrl && 
          e.shiftKey === shortcut.shift && 
          e.key === shortcut.key) {
        this.toggle();
      }
    });
  }

  /**
   * Toggle debug panel visibility and logging
   */
  toggle() {
    if (!this.isEnabled) return;
    
    this.isDebugModeActive = !this.isDebugModeActive;
    
    if (this.isDebugModeActive) {
      this.show();
      this.log('Debug mode activated - panel and logging enabled');
    } else {
      this.hide();
      console.log('YouTube Ad Volume Controller: Debug mode deactivated');
    }
  }

  /**
   * Show debug panel
   */
  show() {
    if (this.panel) return;
    
    this.createPanel();
    this.update();
    this.startAutoUpdate();
  }

  /**
   * Hide debug panel
   */
  hide() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    this.stopAutoUpdate();
  }

  /**
   * Create the debug panel element
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = CONFIG.DEBUG_PANEL.ID;
    this.panel.style.cssText = CONFIG.DEBUG_PANEL.STYLES;
    
    document.body.appendChild(this.panel);
  }

  /**
   * Update panel content
   */
  update() {
    if (!this.panel) return;
    
    const videoPlayer = utils.getCurrentVideoElement();
    const currentVolume = videoPlayer ? Math.round(videoPlayer.volume * 100) : 0;
    
    // Show user's intended volume
    let userIntendedVolume;
    if (this.adDetector.isAdPlaying() && this.volumeManager.hasVolumeStateSaved()) {
      userIntendedVolume = Math.round(this.volumeManager.getSavedVolume() * 100) + '%';
    } else {
      userIntendedVolume = currentVolume + '%';
    }
    
    this.panel.innerHTML = `
      <div>Debug Panel Active</div>
      <div>Volume: ${userIntendedVolume}</div>
      <div>Realtime VideoPlayer volume: ${currentVolume}%</div>
      <div>Ad volume: ${Math.round(this.volumeManager.getAdVolume() * 100)}%</div>
      <div>Ad Playing: ${this.adDetector.isAdPlaying()}</div>
    `;
  }

  /**
   * Start auto-updating the debug panel
   */
  startAutoUpdate() {
    this.updateInterval = setInterval(() => {
      this.update();
    }, CONFIG.DEV_PANEL_UPDATE_INTERVAL);
  }

  /**
   * Stop auto-updating the debug panel
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Cleanup function
   */
  cleanup() {
    this.hide();
  }
}

// Make DebugPanel available globally
if (typeof window !== 'undefined') {
  window.DebugPanel = DebugPanel;
}
