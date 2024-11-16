var extensionEnabled = true; // Default state

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  var videoPlayer = document.querySelector('video');

  if (request.action === 'getVolume') {
    // Send the current volume back to the popup
    sendResponse({ volume: videoPlayer ? videoPlayer.volume : 0 });
  } else if (request.action === 'setVolume' && videoPlayer && extensionEnabled) {
    // Set the new volume
    videoPlayer.volume = request.volume;
  } else if (request.action === 'enableExtension') {
    // Enable the extension
    extensionEnabled = true;
    console.log('Extension enabled');
  } else if (request.action === 'disableExtension') {
    // Disable the extension
    extensionEnabled = false;
    console.log('Extension disabled');
  } else if (request.action === 'getExtensionState') {
    // Send the current extension state back to the popup
    sendResponse({ isEnabled: extensionEnabled });
  }
});