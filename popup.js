document.addEventListener('DOMContentLoaded', function () {
  const adVolumeSlider = document.getElementById('adVolumeSlider');
  const adVolumeLabel = document.getElementById('adVolumeLabel');
  const videoVolumeSlider = document.getElementById('videoVolumeSlider');
  const videoVolumeLabel = document.getElementById('videoVolumeLabel');
  const videoVolumeTitle = document.getElementById('videoVolumeTitle');
  const controls = document.getElementById('controls');
  const notYouTubeMessage = document.getElementById('notYouTubeMessage');
  const container = document.querySelector('.container');
  
  let youtubeTab = null; // Store the active YouTube tab

  // Listen for volume change messages from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === MessageAction.VOLUME_CHANGED && sender.tab && sender.tab.id === youtubeTab?.id) {
      // Update sliders without triggering their event listeners
      if (request.videoVolume !== undefined) {
        videoVolumeSlider.value = request.videoVolume;
        updateVolumeLabel(videoVolumeSlider, videoVolumeLabel);
      }
      if (request.adVolume !== undefined) {
        adVolumeSlider.value = request.adVolume;
        updateVolumeLabel(adVolumeSlider, adVolumeLabel);
      }
    }
  });

  function updateVolumeLabel(slider, label) {
    label.textContent = Math.round(slider.value * 100) + '%';
  }

  // Load saved volumes first with defaults
  chrome.storage.sync.get(['adVolume', 'videoVolume'], function(result) {
    const defaultAdVolume = 0.05; // 5%
    const defaultVideoVolume = 1.0; // 100%
    
    const adVol = result.adVolume !== undefined ? result.adVolume : defaultAdVolume;
    const videoVol = result.videoVolume !== undefined ? result.videoVolume : defaultVideoVolume;
    
    adVolumeSlider.value = adVol;
    updateVolumeLabel(adVolumeSlider, adVolumeLabel);
    
    videoVolumeSlider.value = videoVol;
    updateVolumeLabel(videoVolumeSlider, videoVolumeLabel);
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
          // Ping attempt failed, retry if not the last attempt
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
          // Content script not ready after retries, may need page refresh
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
        // Failed to send message
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
          if (response.videoVolume !== undefined) {
            videoVolumeSlider.value = response.videoVolume;
            updateVolumeLabel(videoVolumeSlider, videoVolumeLabel);
          }
        }
        
        // Fetch video title
        try {
          const titleResponse = await sendMessageToContentScript(youtubeTab.id, { action: MessageAction.GET_VIDEO_TITLE });
          if (titleResponse && titleResponse.title) {
            videoVolumeTitle.textContent = titleResponse.title;
            videoVolumeTitle.title = titleResponse.title; // Show full title on hover
          }
        } catch (error) {
          // If title fetch fails, keep default "Video Volume" text
        }
      } catch (error) {
        // Failed to initialize popup - still allow the popup to work with stored values
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
          // Failed to set ad volume
        });
      });
    }

    if (videoVolumeSlider) {
      videoVolumeSlider.addEventListener('input', function () {
        updateVolumeLabel(videoVolumeSlider, videoVolumeLabel);
        sendMessageToContentScript(youtubeTab.id, { 
          action: MessageAction.SET_VIDEO_VOLUME, 
          volume: videoVolumeSlider.value 
        }).catch(error => {
          // Failed to set video volume
        });
      });
    }
  });
});