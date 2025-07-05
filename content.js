let devModeEnabled = false; // Master switch for debug features (logging and debug panel)
let debugPanel = null;
let playerElement = null;
let adPlaying = false;
let savedVolume = null;
let savedMuted = null;
let adVolume = 0.05;
let volumeSaveTimeout = null;
let lastKnownUserVolume = null;

chrome.storage.sync.get(['adVolume'], function(result) {
  if (result.adVolume !== undefined) {
    adVolume = result.adVolume;
    updateDevPanel();
  }
});

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
      chrome.storage.sync.set({ adVolume: adVolume });
      if (videoPlayer && adPlaying) {
        setVolume(videoPlayer, adVolume);
      }
      break;
  }
  updateDebugPanel();
});

function setVolume(videoPlayer, volume) {
  videoPlayer.volume = volume;
  
  const event = new Event('input', { bubbles: true });
  videoPlayer.dispatchEvent(event);
}

function saveCurrentVolumeState(videoPlayer) {
  if (volumeSaveTimeout) {
    clearTimeout(volumeSaveTimeout);
  }
  
  // Only save if we don't already have a saved volume (prevent overwriting)
  if (videoPlayer && savedVolume === null) {
    // Use lastKnownUserVolume if available and recent, otherwise current volume
    savedVolume = lastKnownUserVolume !== null ? lastKnownUserVolume : videoPlayer.volume;
    savedMuted = videoPlayer.muted;
    updateDebugPanel(); // Update panel immediately after saving
  }
}

function restoreSavedVolumeState(videoPlayer) {
  if (videoPlayer && savedVolume !== null) {
    setVolume(videoPlayer, savedVolume);
    if (savedMuted !== null) {
      videoPlayer.muted = savedMuted;
    }
    savedVolume = null;
    savedMuted = null;
  }
}

function checkAd() {
  if (!playerElement) {
    playerElement = document.getElementById('movie_player');
    if (!playerElement) {
      return;
    }
  }

  var videoPlayer = document.querySelector('video');
  
  let isAdShowing =
    playerElement.classList.contains('ad-showing') ||
    playerElement.classList.contains('ad-interrupting');

  let isAdSequence = playerElement.querySelector('.ytp-ad-preview-container');

  if (isAdShowing && !adPlaying) {
    adPlaying = true;
    if (videoPlayer) {
      saveCurrentVolumeState(videoPlayer);
      // Set ad volume after a very short delay
      setTimeout(() => {
        setVolume(videoPlayer, adVolume);
        updateDebugPanel();
      }, 10); // Reduced delay from 50ms to 10ms
    }
  } else if (!isAdShowing && !isAdSequence && adPlaying) {
    adPlaying = false;
    restoreSavedVolumeState(videoPlayer);
    updateDebugPanel();
  } else if (isAdShowing && adPlaying) {
    if (videoPlayer && Math.abs(videoPlayer.volume - adVolume) > 0.01) {
      setVolume(videoPlayer, adVolume);
    }
  }

  updateDebugPanel();
}

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

    const videoPlayer = document.querySelector('video');
    if (videoPlayer) {
      videoPlayer.addEventListener('volumechange', function() {
        if (!adPlaying && savedVolume === null) {
          lastKnownUserVolume = videoPlayer.volume;
        }
        // Update dev panel on any volume change
        updateDebugPanel();
      });
    }

    // Initial check in case the ad is already playing
    checkAd();
  } else {
    setTimeout(init, 1000);
  }
}

init();

function cleanup() {
  if (volumeSaveTimeout) {
    clearTimeout(volumeSaveTimeout);
    volumeSaveTimeout = null;
  }
}

window.addEventListener('beforeunload', cleanup);

setInterval(function() {
  const videoPlayer = document.querySelector('video');
  
  if (savedVolume !== null && !adPlaying) {
    console.log('YouTube Ad Volume Controller: Warning - savedVolume exists but no ad playing. Cleaning up.');
    savedVolume = null;
    savedMuted = null;
    updateDebugPanel();
  }
  
  if (videoPlayer && !adPlaying && savedVolume === null) {
    lastKnownUserVolume = videoPlayer.volume;
  }
}, 1000);

function createDebugPanel() {
  if (debugPanel || !devModeEnabled) return;
  
  debugPanel = document.createElement('div');
  debugPanel.id = 'yt-volume-control-debug-panel';
  debugPanel.style.cssText = `
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
  
  updateDebugPanel();
  document.body.appendChild(debugPanel);
}

// Update the updateDebugPanel function in content.js
function updateDebugPanel() {
  if (!debugPanel) return;
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
  
  debugPanel.innerHTML = `
    <div>Debug Mode Active</div>
    <div>Volume: ${userIntendedVolume}</div>
    <div>Realtime VideoPlayer volume: ${currentVolume}%</div>
    <div>Ad volume: ${Math.round(adVolume * 100)}%</div>
    <div>Ad Playing: ${adPlaying}</div>
  `;
}

// Add keyboard shortcut listener
document.addEventListener('keydown', function(e) {
  // Ctrl+Shift+D to toggle debug panel
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    if (!devModeEnabled) return; // Master switch must be enabled
    
    if (debugPanel) {
      debugPanel.remove();
      debugPanel = null;
    } else {
      createDebugPanel();
      // Update panel every second
      setInterval(updateDebugPanel, 1000);
    }
  }
});