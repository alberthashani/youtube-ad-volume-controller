// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  var videoPlayer = document.querySelector('video');

  if (request.action === 'getVolume') {
    // Send the current volume back to the popup
    sendResponse({ volume: videoPlayer ? videoPlayer.volume : 0 });
  } else if (request.action === 'setVolume' && videoPlayer) {
    // Set the new volume
    videoPlayer.volume = request.volume;
  }
});