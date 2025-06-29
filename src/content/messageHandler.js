// Message Handler - Manages communication between popup and content script
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
          adVolume: this.volumeManager.getAdVolume(),
          videoVolume: this.volumeManager.getVideoVolume()
        });
        break;

      case MessageAction.SET_AD_VOLUME:
        this.volumeManager.setAdVolume(request.volume);
        this.devPanel.update();
        break;

      case MessageAction.GET_VIDEO_TITLE:
        // Try multiple selectors to find video title
        const titleSelectors = [
          'h1.ytd-watch-metadata yt-formatted-string',
          'h1.ytd-video-primary-info-renderer yt-formatted-string', 
          'ytd-watch-metadata h1 yt-formatted-string',
          'ytd-video-primary-info-renderer h1',
          'h1.style-scope.ytd-video-primary-info-renderer',
          '.ytd-watch-metadata h1',
          'h1.ytd-watch-metadata'
        ];
        
        let titleElement = null;
        for (const selector of titleSelectors) {
          titleElement = document.querySelector(selector);
          if (titleElement) break;
        }
        
        const title = titleElement ? titleElement.textContent.trim() : 'YouTube Video';
        sendResponse({ title: title });
        break;

      case MessageAction.SET_VIDEO_VOLUME:
        this.volumeManager.setVideoVolume(request.volume);
        this.devPanel.update();
        break;

      default:
        utils.log('Unknown message action:', request.action);
        break;
    }

    return true;
  }
}

// Make MessageHandler available globally
if (typeof window !== 'undefined') {
  window.MessageHandler = MessageHandler;
}
