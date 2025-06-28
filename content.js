let devModeEnabled = true; // Show panel through keyboard shortcut (Ctrl+Shift+D)
let devPanel = null;
let playerElement = null;
let adPlaying = false;
let savedVolume = null; // Store original volume when ad starts
let adVolume = 0.05; // Default ad volume

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
    // Ad has started
    adPlaying = true;
    if (videoPlayer) {
      if (savedVolume === null) { // Only save volume if not already saved
        savedVolume = videoPlayer.volume;
      }
      setVolume(videoPlayer, adVolume);
    }
  } else if (!isAdShowing && !isAdSequence && adPlaying) {
    // All ads have ended (no ad showing and no upcoming ad in sequence)
    adPlaying = false;
    if (videoPlayer && savedVolume !== null) {
      setVolume(videoPlayer, savedVolume);
      savedVolume = null;
    }
  } else if (isAdShowing && adPlaying) {
    // Ensure volume stays at adVolume during ad sequence
    if (videoPlayer && videoPlayer.volume !== adVolume) {
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

    // Initial check in case the ad is already playing
    checkAd();
  } else {
    // Retry after a short delay
    setTimeout(init, 1000);
  }
}

init();

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
  
  devPanel.innerHTML = `
    <div>Dev Mode Active</div>
    <div>Current Volume: ${videoPlayer ? Math.round(videoPlayer.volume * 100) : 0}%</div>
    <div>Ad Volume: ${Math.round(adVolume * 100)}%</div>
    <div>Saved Volume: ${Math.round(savedVolume * 100)}%</div>
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