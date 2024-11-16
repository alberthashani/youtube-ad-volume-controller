var adVolumeController = false; // Default state
var originalVolume = null; // Store the original volume
let devModeEnabled = true; // Show panel through keyboard shortcut (Ctrl+Shift+D)
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
      if (videoPlayer && adVolumeController) {
        console.log('Setting volume:', request.volume);
        videoPlayer.volume = request.volume;
      }
      break;
      
    case MessageAction.ENABLE_AD_VOLUME_CONTROLLER:
      console.log('Ad Volume Controller enabled');
      if (videoPlayer) {
        originalVolume = videoPlayer.volume;
        chrome.runtime.sendMessage({ action: MessageAction.GET_SLIDER_VOLUME }, function(response) {
          if (response && response.sliderVolume !== undefined) {
            videoPlayer.volume = response.sliderVolume;
          }
        });
      }
      adVolumeController = true;
      console.log('Ad Volume Controller enabled, original volume:', originalVolume);
      sendResponse({ originalVolume: originalVolume });
      break;
      
    case MessageAction.DISABLE_AD_VOLUME_CONTROLLER:
      console.log('Ad Volume Controller disabled');
      if (videoPlayer && originalVolume !== null) {
        videoPlayer.volume = originalVolume;
        originalVolume = null;
      }
      adVolumeController = false;
      console.log('Ad Volume Controller disabled, restored volume');
      break;
      
    case MessageAction.GET_AVC_STATE:
      console.log('Sending Ad Volume Controller state:', adVolumeController);
      sendResponse({ isEnabled: adVolumeController });
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
  
  // Get slider volume from popup
  chrome.runtime.sendMessage({ action: MessageAction.GET_SLIDER_VOLUME }, function(response) {
    const sliderVolume = response && response.sliderVolume !== undefined ? 
      Math.round(response.sliderVolume * 100) : 'N/A';
    
    devPanel.innerHTML = `
      <div>Dev Mode Active</div>
      <div>Current Volume: ${videoPlayer ? Math.round(videoPlayer.volume * 100) : 0}%</div>
      <div>Original Volume: ${originalVolume ? Math.round(originalVolume * 100) : 'N/A'}%</div>
      <div>Slider Volume: ${sliderVolume}%</div>
      <div>Ad Volume Controller Enabled: ${adVolumeController}</div>
    `;
  });
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