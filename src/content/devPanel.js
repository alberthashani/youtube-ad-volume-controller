// Dev Panel - Development debugging overlay for volume and ad state monitoring
class DevPanel {
  constructor(volumeManager, adDetector) {
    this.volumeManager = volumeManager;
    this.adDetector = adDetector;
    this.panel = null;
    this.updateInterval = null;
    this.isEnabled = true;
    
    this.setupKeyboardShortcut();
  }

  /**
   * Setup keyboard shortcut for toggling dev panel
   */
  setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      const shortcut = CONFIG.DEV_PANEL.TOGGLE_SHORTCUT;
      if (e.ctrlKey === shortcut.ctrl && 
          e.shiftKey === shortcut.shift && 
          e.key === shortcut.key) {
        this.toggle();
      }
    });
  }

  /**
   * Toggle dev panel visibility
   */
  toggle() {
    if (!this.isEnabled) return;
    
    if (this.panel) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Show dev panel
   */
  show() {
    if (this.panel) return;
    
    this.createPanel();
    this.update();
    this.startAutoUpdate();
  }

  /**
   * Hide dev panel
   */
  hide() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    this.stopAutoUpdate();
  }

  /**
   * Create the dev panel element
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = CONFIG.DEV_PANEL.ID;
    this.panel.style.cssText = CONFIG.DEV_PANEL.STYLES;
    
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
      <div>Dev Mode Active</div>
      <div>Volume: ${userIntendedVolume}</div>
      <div>Realtime VideoPlayer volume: ${currentVolume}%</div>
      <div>Ad volume: ${Math.round(this.volumeManager.getAdVolume() * 100)}%</div>
      <div>Ad Playing: ${this.adDetector.isAdPlaying()}</div>
    `;
  }

  /**
   * Start auto-updating the panel
   */
  startAutoUpdate() {
    this.updateInterval = setInterval(() => {
      this.update();
    }, CONFIG.DEV_PANEL_UPDATE_INTERVAL);
  }

  /**
   * Stop auto-updating the panel
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

// Make DevPanel available globally
if (typeof window !== 'undefined') {
  window.DevPanel = DevPanel;
}
