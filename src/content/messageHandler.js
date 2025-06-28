// Message Handler - Handles Chrome runtime message communication
class MessageHandler {
  constructor(volumeManager, devPanel) {
    this.volumeManager = volumeManager;
    this.devPanel = devPanel;
    
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
   * Handle incoming messages
   * @param {Object} request 
   * @param {Function} sendResponse 
   * @returns {boolean}
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
        this.volumeManager.setAdVolume(request.volume);
        this.devPanel.update(); // Update dev panel if visible
        break;

      default:
        utils.log('Unknown message action:', request.action);
        break;
    }

    return true; // Keep message channel open for async responses
  }
}

// Make MessageHandler available globally
if (typeof window !== 'undefined') {
  window.MessageHandler = MessageHandler;
}
