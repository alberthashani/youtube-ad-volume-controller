document.addEventListener('DOMContentLoaded', function () {
  const adVolumeSlider = document.getElementById('adVolumeSlider');
  const adVolumeLabel = document.getElementById('adVolumeLabel');
  const controls = document.getElementById('controls');
  const notYouTubeMessage = document.getElementById('notYouTubeMessage');
  const container = document.querySelector('.container');
  
  let youtubeTab = null; // Store the active YouTube tab

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

  // Find YouTube tabs across all windows
  function findYouTubeTabs() {
    return new Promise((resolve) => {
      chrome.tabs.query({}, function(tabs) {
        const youtubeTabs = tabs.filter(tab => tab.url && tab.url.includes('youtube.com'));
        resolve(youtubeTabs);
      });
    });
  }

  // Get the current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
    const activeTab = tabs[0];
    const youtubeTabs = await findYouTubeTabs();
    
    // Check if current tab is YouTube
    if (activeTab.url.includes('youtube.com')) {
      youtubeTab = activeTab;
    } else if (youtubeTabs.length > 0) {
      // Use the first YouTube tab found (or most recently active one)
      youtubeTab = youtubeTabs.find(tab => tab.active) || youtubeTabs[0];
    }

    // If no YouTube tabs found, show the message
    if (!youtubeTab) {
      controls.classList.add('disabled');
      container.classList.add('disabled');
      notYouTubeMessage.classList.add('show');
      return;
    }

    // Update the UI to show which tab we're controlling
    updateTabIndicator(youtubeTab, activeTab);

    // Update the UI to show which tab we're controlling
    updateTabIndicator(youtubeTab, activeTab);

    // Function to update the header with tab info
    function updateTabIndicator(ytTab, currentTab) {
      const subtitle = document.querySelector('.subtitle');
      if (ytTab.id !== currentTab.id) {
        subtitle.textContent = `Tab: ${ytTab.title.substring(0, 30)}...`;
        subtitle.style.fontSize = '11px';
      } else {
        subtitle.textContent = '';
      }
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
        const response = await sendMessageToContentScript(youtubeTab.id, { action: MessageAction.GET_VOLUMES });
        if (response) {
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
    if (adVolumeSlider) {
      adVolumeSlider.addEventListener('input', function () {
        updateVolumeLabel(adVolumeSlider, adVolumeLabel);
        sendMessageToContentScript(youtubeTab.id, { 
          action: MessageAction.SET_AD_VOLUME, 
          volume: adVolumeSlider.value 
        }).catch(error => {
          console.log('Failed to set ad volume:', error.message);
        });
      });
    }
  });
});