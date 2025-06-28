document.addEventListener('DOMContentLoaded', function () {
  var videoVolumeSlider = document.getElementById('videoVolumeSlider');
  var videoVolumeLabel = document.getElementById('videoVolumeLabel');
  var adVolumeSlider = document.getElementById('adVolumeSlider');
  var adVolumeLabel = document.getElementById('adVolumeLabel');
  var controls = document.getElementById('controls');
  var notYouTubeMessage = document.getElementById('notYouTubeMessage');

  function updateVolumeLabel(slider, label) {
    label.textContent = Math.round(slider.value * 100) + '%';
  }

  // Load saved ad volume first
  chrome.storage.sync.get(['adVolume'], function(result) {
    if (result.adVolume !== undefined) {
      adVolumeSlider.value = result.adVolume;
      updateVolumeLabel(adVolumeSlider, adVolumeLabel);
    }
  });

  // Get the current tab
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var activeTab = tabs[0];

    // Check if current tab is YouTube
    if (!activeTab.url.includes('youtube.com')) {
      controls.classList.add('disabled');
      notYouTubeMessage.style.display = 'block';
      return;
    }

    // Improved helper function to check if content script is ready with retries
    async function isContentScriptReady(tabId, maxRetries = 3) {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            });
          });
          if (response && response.status === 'ready') {
            return true;
          }
        } catch (error) {
          console.log(`Ping attempt ${i + 1} failed:`, error.message);
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
          }
        }
      }
      return false;
    }

    // Enhanced message sending with better error handling
    async function sendMessageToContentScript(tabId, message) {
      try {
        const isReady = await isContentScriptReady(tabId);
        if (!isReady) {
          console.log('Content script not ready after retries, may need page refresh');
          return null;
        }
        
        return new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      } catch (error) {
        console.log('Failed to send message:', error.message);
        return null;
      }
    }

    // Initialize popup with better error handling
    async function initializePopup() {
      try {
        const response = await sendMessageToContentScript(activeTab.id, { action: MessageAction.GET_VOLUMES });
        if (response) {
          if (response.videoVolume !== undefined) {
            videoVolumeSlider.value = response.videoVolume;
            updateVolumeLabel(videoVolumeSlider, videoVolumeLabel);
          }
          if (response.adVolume !== undefined) {
            adVolumeSlider.value = response.adVolume;
            updateVolumeLabel(adVolumeSlider, adVolumeLabel);
          }
        }
      } catch (error) {
        console.log('Failed to initialize popup:', error.message);
        // Still allow the popup to work with stored values
      }
    }

    // Initialize the popup
    initializePopup();

    // Add event listeners with error handling
    if (videoVolumeSlider) {
      videoVolumeSlider.addEventListener('input', function () {
        updateVolumeLabel(videoVolumeSlider, videoVolumeLabel);
        sendMessageToContentScript(activeTab.id, { 
          action: MessageAction.SET_VIDEO_VOLUME, 
          volume: videoVolumeSlider.value 
        }).catch(error => {
          console.log('Failed to set video volume:', error.message);
        });
      });
    }

    if (adVolumeSlider) {
      adVolumeSlider.addEventListener('input', function () {
        updateVolumeLabel(adVolumeSlider, adVolumeLabel);
        sendMessageToContentScript(activeTab.id, { 
          action: MessageAction.SET_AD_VOLUME, 
          volume: adVolumeSlider.value 
        }).catch(error => {
          console.log('Failed to set ad volume:', error.message);
        });
      });
    }
  });
});