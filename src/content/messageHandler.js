// Message Handler - Manages communication between popup and content script
class MessageHandler {
  constructor(volumeManager, debugPanel) {
    this.volumeManager = volumeManager;
    this.debugPanel = debugPanel;
    
    this.setupMessageListener();
  }

  /**
   * Setup Chrome runtime message listener
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      return this.handleMessage(request, sendResponse);
    });
  }

  /**
   * Process incoming messages from popup or other extension components
   * @param {Object} request - Message object with action and data
   * @param {Function} sendResponse - Callback to send response
   * @returns {boolean} - Whether to keep message channel open
   */
  handleMessage(request, sendResponse) {
    if (request.action === 'ping') {
      sendResponse({ status: 'ready' });
      return true;
    }

    switch (request.action) {
      case MessageAction.GET_VOLUMES:
        sendResponse({ 
          adVolume: this.volumeManager.getAdVolume() 
        });
        break;

      case MessageAction.SET_AD_VOLUME:
        const oldAdVolume = this.volumeManager.getAdVolume();
        const newAdVolume = parseFloat(request.volume); // Ensure numeric value
        this.debugPanel.logDetailedVolumeState('POPUP_AD_VOLUME_CHANGE', {
          oldValue: oldAdVolume,
          newValue: newAdVolume
        });
        this.volumeManager.setAdVolume(newAdVolume);
        this.debugPanel.update();
        break;

      default:
        this.debugPanel.log('Unknown message action:', request.action);
        break;
    }

    return true;
  }
}

// Make MessageHandler available globally
if (typeof window !== 'undefined') {
  window.MessageHandler = MessageHandler;
}
