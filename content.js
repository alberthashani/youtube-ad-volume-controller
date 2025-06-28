let devModeEnabled = true; // Show panel through keyboard shortcut (Ctrl+Shift+D)
let devPanel = null;
let playerElement = null;
let adPlaying = false;
let savedVolume = null; // Store original volume when ad starts
let savedMuted = null; // Store original muted state when ad starts
let adVolume = 0.05; // Default ad volume
let volumeSaveTimeout = null; // Timeout for delayed volume saving
let lastKnownUserVolume = null; // Track user volume continuously

// Load saved ad volume when script initializes
chrome.storage.sync.get(['adVolume'], function(result) {
  if (result.adVolume !== undefined) {
    adVolume = result.adVolume;
    updateDevPanel();
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'ping') {
    sendResponse({ status: 'ready' });
    return true;
  }

  var videoPlayer = document.querySelector('video');

  switch (request.action) {
    case MessageAction.GET_VOLUMES:
      sendResponse({ adVolume: adVolume });
      break;

    case MessageAction.SET_AD_VOLUME:
      adVolume = request.volume;
      // Save the new ad volume
      chrome.storage.sync.set({ adVolume: adVolume });
      if (videoPlayer && adPlaying) {
        setVolume(videoPlayer, adVolume);
      }
      break;
  }
  updateDevPanel(); // Add this at the end of each case
});

// Function to set volume with synthetic event dispatching
function setVolume(videoPlayer, volume) {
  videoPlayer.volume = volume;
  
  // Dispatch synthetic events to simulate user interaction
  const event = new Event('input', { bubbles: true });
  videoPlayer.dispatchEvent(event);
}

// Function to save current volume and muted state
function saveCurrentVolumeState(videoPlayer) {
  // Clear any existing timeout
  if (volumeSaveTimeout) {
    clearTimeout(volumeSaveTimeout);
  }
  
  // Only save if we don't already have a saved volume (prevent overwriting)
  if (videoPlayer && savedVolume === null) {
    // Use lastKnownUserVolume if available and recent, otherwise current volume
    savedVolume = lastKnownUserVolume !== null ? lastKnownUserVolume : videoPlayer.volume;
    savedMuted = videoPlayer.muted;
    console.log('YouTube Ad Volume Controller: Saved volume:', savedVolume, 'muted:', savedMuted);
    updateDevPanel(); // Update panel immediately after saving
  }
}

// Function to restore saved volume and muted state
function restoreSavedVolumeState(videoPlayer) {
  if (videoPlayer && savedVolume !== null) {
    console.log('YouTube Ad Volume Controller: Restoring volume:', savedVolume, 'muted:', savedMuted);
    setVolume(videoPlayer, savedVolume);
    if (savedMuted !== null) {
      videoPlayer.muted = savedMuted;
    }
    savedVolume = null;
    savedMuted = null;
  }
}

// Function to check if an ad is playing
function checkAd() {
  // Get the player element if not already obtained
  if (!playerElement) {
    playerElement = document.getElementById('movie_player');
    if (!playerElement) {
      return;
    }
  }

  var videoPlayer = document.querySelector('video');
  
  // Check if any type of ad is showing
  let isAdShowing =
    playerElement.classList.contains('ad-showing') ||
    playerElement.classList.contains('ad-interrupting');

  // Check if we're in an ad sequence (multiple ads)
  let isAdSequence = playerElement.querySelector('.ytp-ad-preview-container');

  if (isAdShowing && !adPlaying) {
    // Ad has started - save volume BEFORE changing it
    adPlaying = true;
    if (videoPlayer) {
      // Save current volume state immediately (this is the user's actual volume)
      saveCurrentVolumeState(videoPlayer);
      // Set ad volume after a very short delay
      setTimeout(() => {
        setVolume(videoPlayer, adVolume);
        updateDevPanel();
      }, 10); // Reduced delay from 50ms to 10ms
    }
  } else if (!isAdShowing && !isAdSequence && adPlaying) {
    // All ads have ended (no ad showing and no upcoming ad in sequence)
    adPlaying = false;
    // Restore saved volume state
    restoreSavedVolumeState(videoPlayer);
    updateDevPanel();
  } else if (isAdShowing && adPlaying) {
    // Ensure volume stays at adVolume during ad sequence
    // But don't save volume during ads - we already have the correct saved volume
    if (videoPlayer && Math.abs(videoPlayer.volume - adVolume) > 0.01) {
      setVolume(videoPlayer, adVolume);
    }
  }

  updateDevPanel();
}

// Observe changes to the 'class' attribute of the player element
function init() {
  playerElement = document.getElementById('movie_player');

  if (playerElement) {
    const observer = new MutationObserver(function (mutations) {
      for (let mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkAd();
        }
      }
    });

    observer.observe(playerElement, { attributes: true });

    // Also observe the video element for volume changes
    const videoPlayer = document.querySelector('video');
    if (videoPlayer) {
      // Listen for volume changes
      videoPlayer.addEventListener('volumechange', function() {
        // Track user volume changes when not in ad
        if (!adPlaying && savedVolume === null) {
          lastKnownUserVolume = videoPlayer.volume;
          console.log('YouTube Ad Volume Controller: User volume changed to:', videoPlayer.volume);
        }
        // Update dev panel on any volume change
        updateDevPanel();
      });
    }

    // Initial check in case the ad is already playing
    checkAd();
  } else {
    // Retry after a short delay
    setTimeout(init, 1000);
  }
}

init();

// Cleanup function for edge cases
function cleanup() {
  if (volumeSaveTimeout) {
    clearTimeout(volumeSaveTimeout);
    volumeSaveTimeout = null;
  }
}

// Listen for page navigation to cleanup
window.addEventListener('beforeunload', cleanup);

// Enhanced periodic check to ensure consistency and track user volume
setInterval(function() {
  const videoPlayer = document.querySelector('video');
  
  if (savedVolume !== null && !adPlaying) {
    console.log('YouTube Ad Volume Controller: Warning - savedVolume exists but no ad playing. Cleaning up.');
    savedVolume = null;
    savedMuted = null;
    updateDevPanel();
  }
  
  // Update lastKnownUserVolume when not in ad and no volume is saved
  if (videoPlayer && !adPlaying && savedVolume === null) {
    lastKnownUserVolume = videoPlayer.volume;
  }
}, 1000); // Check more frequently (every 1 second instead of 5)

function createDevPanel() {
  if (devPanel) return;
  
  devPanel = document.createElement('div');
  devPanel.id = 'yt-volume-control-dev-panel';
  devPanel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 10px;
    border-radius: 5px;
    z-index: 9999;
    font-family: monospace;
    font-size: 14px;
  `;
  
  updateDevPanel();
  document.body.appendChild(devPanel);
}

// Update the updateDevPanel function in content.js
function updateDevPanel() {
  if (!devPanel) return;
  const videoPlayer = document.querySelector('video');
  
  const currentVolume = videoPlayer ? Math.round(videoPlayer.volume * 100) : 0;
  
  // Show user's intended volume: saved volume when ad is playing, current volume when not
  let userIntendedVolume;
  if (adPlaying && savedVolume !== null) {
    // During ad: show the saved user volume
    userIntendedVolume = Math.round(savedVolume * 100) + '%';
  } else {
    // Not during ad: show current video player volume
    userIntendedVolume = currentVolume + '%';
  }
  
  devPanel.innerHTML = `
    <div>Dev Mode Active</div>
    <div>Volume: ${userIntendedVolume}</div>
    <div>Realtime VideoPlayer volume: ${currentVolume}%</div>
    <div>Ad volume: ${Math.round(adVolume * 100)}%</div>
    <div>Ad Playing: ${adPlaying}</div>
  `;
}

// Add keyboard shortcut listener
document.addEventListener('keydown', function(e) {
  // Ctrl+Shift+D to toggle dev panel
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    if (devPanel) {
      devPanel.remove();
      devPanel = null;
    } else {
      createDevPanel();
      // Update panel every second
      setInterval(updateDevPanel, 1000);
    }
  }
});