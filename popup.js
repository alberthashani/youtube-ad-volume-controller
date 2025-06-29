document.addEventListener('DOMContentLoaded', function () {
  const adVolumeSlider = document.getElementById('adVolumeSlider');
  const adVolumeLabel = document.getElementById('adVolumeLabel');
  const videoVolumeLabel = document.getElementById('videoVolumeLabel');
  const videoVolumeTitle = document.getElementById('videoVolumeTitle');
  const controls = document.getElementById('controls');
  const notYouTubeMessage = document.getElementById('notYouTubeMessage');
  const container = document.querySelector('.container');
  
  let youtubeTab = null; // Store the active YouTube tab
  let isUpdatingFromSync = false; // Flag to prevent feedback loops

  /**
   * Returns a debounced version of the provided function that delays its execution until after a specified wait time has elapsed since the last invocation.
   * @param {Function} func - The function to debounce.
   * @param {number} wait - The delay in milliseconds.
   * @return {Function} The debounced function.
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Listen for volume change messages from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === MessageAction.VOLUME_CHANGED && sender.tab) {
      // Only update if the message is from the tab we're controlling
      if (!youtubeTab || sender.tab.id === youtubeTab.id) {
        isUpdatingFromSync = true;
        
        // Update sliders with the new values
        if (request.videoVolume !== undefined) {
          updateVolumeLabel(request.videoVolume, videoVolumeLabel);
        }
        if (request.adVolume !== undefined) {
          adVolumeSlider.value = request.adVolume;
          updateVolumeLabel(adVolumeSlider, adVolumeLabel);
        }
        
        // Reset flag after a brief delay
        setTimeout(() => {
          isUpdatingFromSync = false;
        }, 150);
      }
    }
  });

  /**
   * Updates a label element to display the volume percentage based on a slider element or numeric value.
   * @param {HTMLInputElement|number} sliderOrValue - The slider element or a direct numeric value representing the volume (0.0–1.0).
   * @param {HTMLElement} label - The label element to update with the formatted percentage.
   */
  function updateVolumeLabel(sliderOrValue, label) {
    // Handle both slider objects and direct values
    const value = typeof sliderOrValue === 'number' ? sliderOrValue : sliderOrValue.value;
    label.textContent = Math.round(value * 100) + '%';
  }

  // Load saved volumes first with defaults
  chrome.storage.sync.get(['adVolume', 'videoVolume'], function(result) {
    const defaultAdVolume = 0.05; // 5%
    const defaultVideoVolume = 1.0; // 100%
    
    const adVol = result.adVolume !== undefined ? result.adVolume : defaultAdVolume;
    const videoVol = result.videoVolume !== undefined ? result.videoVolume : defaultVideoVolume;
    
    adVolumeSlider.value = adVol;
    updateVolumeLabel(adVolumeSlider, adVolumeLabel);
    
    // Update video volume display (no slider, just display)
    updateVolumeLabel(videoVol, videoVolumeLabel);
  });

  /**
   * Finds all open browser tabs with URLs containing "youtube.com".
   * @returns {Promise<chrome.tabs.Tab[]>} Promise resolving to an array of YouTube tab objects.
   */
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

    /**
     * Initializes the popup UI by synchronizing ad and video volume controls and fetching the current video title from the YouTube content script.
     *
     * Attempts to retrieve and display the latest ad and video volume levels, updating the UI accordingly. Also fetches the current video title, retrying once if the initial attempt fails or returns a default value. Handles errors gracefully to ensure the popup remains functional even if some data cannot be retrieved.
     */
    async function initializePopup() {
      try {
        const response = await sendMessageToContentScript(youtubeTab.id, { action: MessageAction.GET_VOLUMES });
        if (response) {
          if (response.adVolume !== undefined) {
            adVolumeSlider.value = response.adVolume;
            updateVolumeLabel(adVolumeSlider, adVolumeLabel);
          }
          if (response.videoVolume !== undefined) {
            updateVolumeLabel(response.videoVolume, videoVolumeLabel);
          }
        }
        
        // Fetch video title with retry logic
        try {
          const titleResponse = await sendMessageToContentScript(youtubeTab.id, { action: MessageAction.GET_VIDEO_TITLE });
          if (titleResponse && titleResponse.title && titleResponse.title !== 'YouTube Video') {
            videoVolumeTitle.textContent = titleResponse.title;
            videoVolumeTitle.title = titleResponse.title; // Show full title on hover
          } else {
            // If title fetch fails or returns default, retry after a delay
            setTimeout(async () => {
              try {
                const retryResponse = await sendMessageToContentScript(youtubeTab.id, { action: MessageAction.GET_VIDEO_TITLE });
                if (retryResponse && retryResponse.title && retryResponse.title !== 'YouTube Video') {
                  videoVolumeTitle.textContent = retryResponse.title;
                  videoVolumeTitle.title = retryResponse.title;
                }
              } catch (error) {
                // Keep default "Video Volume" text if retry also fails
              }
            }, 1000);
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

    // Add event listeners with error handling and debouncing
    if (adVolumeSlider) {
      const handleAdVolumeChange = debounce(function() {
        if (isUpdatingFromSync) return; // Don't send updates during sync
        
        updateVolumeLabel(adVolumeSlider, adVolumeLabel);
        sendMessageToContentScript(youtubeTab.id, { 
          action: MessageAction.SET_AD_VOLUME, 
          volume: parseFloat(adVolumeSlider.value)
        }).catch(error => {
          // Failed to set ad volume
        });
      }, 100);
      
      adVolumeSlider.addEventListener('input', handleAdVolumeChange);
    }
  });
});