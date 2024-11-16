var extensionEnabled = false; // Default state
var originalVolume = null; // Store the original volume

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  var videoPlayer = document.querySelector('video');

  if (request.action === 'getVolume') {
    // Send the current volume back to the popup
    console.log('Sending current volume:', videoPlayer ? videoPlayer.volume : 0);
    sendResponse({ volume: videoPlayer ? videoPlayer.volume : 0 });
  } else if (request.action === 'setVolume' && videoPlayer && extensionEnabled) {
    console.log('Setting volume:', request.volume);
    // Set the new volume
    videoPlayer.volume = request.volume;
  } else if (request.action === 'enableExtension') {
    console.log('Extension enabled');
    if (videoPlayer) {
      // Store the current video volume before enabling
      originalVolume = videoPlayer.volume;
      // Apply the slider volume
      chrome.runtime.sendMessage({ action: 'getSliderVolume' }, function(response) {
        if (response && response.sliderVolume !== undefined) {
          videoPlayer.volume = response.sliderVolume;
        }
      });
    }
    // Enable the extension
    extensionEnabled = true;
    console.log('Extension enabled, original volume:', originalVolume);
  } else if (request.action === 'disableExtension') {
    console.log('Extension disabled');
    if (videoPlayer && originalVolume !== null) {
      // Restore the original volume
      videoPlayer.volume = originalVolume;
      originalVolume = null;
    }
    // Disable the extension
    extensionEnabled = false;
    console.log('Extension disabled, restored volume');
  } else if (request.action === 'getExtensionState') {
    console.log('Sending extension state:', extensionEnabled);
    // Send the current extension state back to the popup
    sendResponse({ isEnabled: extensionEnabled });
  }
});