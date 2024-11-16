var extensionEnabled = false; // Default state
var originalVolume = null; // Store the original volume

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
});