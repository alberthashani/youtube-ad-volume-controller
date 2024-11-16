var extensionEnabled = false; // Default state
var originalVolume = null; // Store the original volume
let devModeEnabled = true;
let devPanel = null;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  var videoPlayer = document.querySelector('video');

  switch (request.action) {
    case MessageAction.GET_VOLUME:
      console.log('Sending current volume:', videoPlayer ? videoPlayer.volume : 0);
      sendResponse({ volume: videoPlayer ? videoPlayer.volume : 0 });
      break;
      
    case MessageAction.SET_VOLUME:
      if (videoPlayer && extensionEnabled) {
        console.log('Setting volume:', request.volume);
        videoPlayer.volume = request.volume;
      }
      break;
      
    case MessageAction.ENABLE_EXTENSION:
      console.log('Extension enabled');
      if (videoPlayer) {
        originalVolume = videoPlayer.volume;
        chrome.runtime.sendMessage({ action: MessageAction.GET_SLIDER_VOLUME }, function(response) {
          if (response && response.sliderVolume !== undefined) {
            videoPlayer.volume = response.sliderVolume;
          }
        });
      }
      extensionEnabled = true;
      console.log('Extension enabled, original volume:', originalVolume);
      sendResponse({ originalVolume: originalVolume });
      break;
      
    case MessageAction.DISABLE_EXTENSION:
      console.log('Extension disabled');
      if (videoPlayer && originalVolume !== null) {
        videoPlayer.volume = originalVolume;
        originalVolume = null;
      }
      extensionEnabled = false;
      console.log('Extension disabled, restored volume');
      break;
      
    case MessageAction.GET_EXTENSION_STATE:
      console.log('Sending extension state:', extensionEnabled);
      sendResponse({ isEnabled: extensionEnabled });
      break;
  }
  updateDevPanel(); // Add this at the end of each case
});

function createDevPanel() {
  if (devPanel) return;
  
  devPanel = document.createElement('div');
  devPanel.id = 'yt-volume-control-dev-panel';
  devPanel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 10px;
    border-radius: 5px;
    z-index: 9999;
    font-family: monospace;
  `;
  
  updateDevPanel();
  document.body.appendChild(devPanel);
}

function updateDevPanel() {
  if (!devPanel) return;
  const videoPlayer = document.querySelector('video');
  devPanel.innerHTML = `
    <div>Dev Mode Active</div>
    <div>Current Volume: ${videoPlayer ? videoPlayer.volume * 100 : 0}%</div>
    <div>Original Volume: ${originalVolume ? originalVolume * 100 : 'N/A'}%</div>
    <div>Extension Enabled: ${extensionEnabled}</div>
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