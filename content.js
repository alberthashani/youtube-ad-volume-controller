let devModeEnabled = true; // Show panel through keyboard shortcut (Ctrl+Shift+D)
let devPanel = null;
let playerElement = null;
let adPlaying = false;
let videoVolume = 0.5; // Default video volume
let adVolume = 0.1; // Default ad volume

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  var videoPlayer = document.querySelector('video');

  switch (request.action) {
    case MessageAction.GET_VOLUMES:
      sendResponse({ videoVolume: videoVolume, adVolume: adVolume });
      break;

    case MessageAction.SET_VIDEO_VOLUME:
      videoVolume = request.volume;
      if (videoPlayer && !adPlaying) {
        setVolume(videoPlayer, videoVolume);
      }
      break;

    case MessageAction.SET_AD_VOLUME:
      adVolume = request.volume;
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
  console.log('Checking for ads...');

  // Get the player element if not already obtained
  if (!playerElement) {
    playerElement = document.getElementById('movie_player');
    if (!playerElement) {
      console.log('Player element not found');
      return;
    } else {
      console.log('Player element found');
    }
  }

  // Get the video player element
  var videoPlayer = document.querySelector('video');

  // Check if the 'ad-showing' class is present on the player
  let isAdShowing =
    playerElement.classList.contains('ad-showing') ||
    playerElement.classList.contains('ad-interrupting');

  console.log('Ad showing:', isAdShowing);

  if (isAdShowing && !adPlaying) {
    // Ad has started
    adPlaying = true;
    console.log('Ad started. Setting volume to ad volume');
    if (videoPlayer) {
      setVolume(videoPlayer, adVolume);
    }
  } else if (!isAdShowing && adPlaying) {
    // Ad has ended
    adPlaying = false;
    console.log('Ad ended. Restoring video volume');
    if (videoPlayer) {
      setVolume(videoPlayer, videoVolume);
    }
  }
}

// Observe changes to the 'class' attribute of the player element
function init() {
  playerElement = document.getElementById('movie_player');

  if (playerElement) {
    console.log('Player element found');

    const observer = new MutationObserver(function (mutations) {
      for (let mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          console.log('Player class attribute changed');
          checkAd();
        }
      }
    });

    observer.observe(playerElement, { attributes: true });
    console.log('Observer attached to player element');

    // Initial check in case the ad is already playing
    checkAd();
  } else {
    console.log('Player element not found during initialization. Retrying...');
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
    <div>Video Volume: ${Math.round(videoVolume * 100)}%</div>
    <div>Ad Volume: ${Math.round(adVolume * 100)}%</div>
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