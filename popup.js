document.addEventListener('DOMContentLoaded', function () {
  var videoVolumeSlider = document.getElementById('videoVolumeSlider');
  var videoVolumeLabel = document.getElementById('videoVolumeLabel');
  var adVolumeSlider = document.getElementById('adVolumeSlider');
  var adVolumeLabel = document.getElementById('adVolumeLabel');

  function updateVolumeLabel(slider, label) {
    label.textContent = Math.round(slider.value * 100) + '%';
  }

  // Load saved ad volume first
  chrome.storage.sync.get(['adVolume'], function(result) {
    if (result.adVolume !== undefined) {
      adVolumeSlider.value = result.adVolume;
      updateVolumeLabel(adVolumeSlider, adVolumeLabel);
    }
  });

  // Add event listeners if elements are found
  if (videoVolumeSlider) {
    videoVolumeSlider.addEventListener('input', function () {
      updateVolumeLabel(videoVolumeSlider, videoVolumeLabel);
      chrome.runtime.sendMessage({ 
        action: MessageAction.SET_VIDEO_VOLUME, 
        volume: videoVolumeSlider.value 
      });
    });
  }

  if (adVolumeSlider) {
    adVolumeSlider.addEventListener('input', function () {
      updateVolumeLabel(adVolumeSlider, adVolumeLabel);
      chrome.runtime.sendMessage({ 
        action: MessageAction.SET_AD_VOLUME, 
        volume: adVolumeSlider.value 
      });
    });
  }
});