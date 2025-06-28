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

    // Add this helper function to check if content script is ready
    async function isContentScriptReady(tabId) {
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
          if (chrome.runtime.lastError) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    }

    // Update your existing message sending code
    async function sendMessageToContentScript(tabId, message) {
      const isReady = await isContentScriptReady(tabId);
      if (!isReady) {
        console.log('Content script not ready, injecting...');
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
        // Wait a bit for injection
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    }

    // Send a message to the content script to get the current volumes
    sendMessageToContentScript(activeTab.id, { action: MessageAction.GET_VOLUMES })
      .then(response => {
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
      })
      .catch(error => {
        console.log('Failed to communicate with content script:', error);
      });

    // Add event listeners if elements are found
    if (videoVolumeSlider) {
      videoVolumeSlider.addEventListener('input', function () {
        updateVolumeLabel(videoVolumeSlider, videoVolumeLabel);
        chrome.tabs.sendMessage(activeTab.id, { 
          action: MessageAction.SET_VIDEO_VOLUME, 
          volume: videoVolumeSlider.value 
        });
      });
    }

    if (adVolumeSlider) {
      adVolumeSlider.addEventListener('input', function () {
        updateVolumeLabel(adVolumeSlider, adVolumeLabel);
        chrome.tabs.sendMessage(activeTab.id, { 
          action: MessageAction.SET_AD_VOLUME, 
          volume: adVolumeSlider.value 
        });
      });
    }
  });
});