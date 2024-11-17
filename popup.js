document.addEventListener('DOMContentLoaded', function () {
  var videoVolumeSlider = document.getElementById('videoVolumeSlider');
  var videoVolumeLabel = document.getElementById('videoVolumeLabel');
  var adVolumeSlider = document.getElementById('adVolumeSlider');
  var adVolumeLabel = document.getElementById('adVolumeLabel');
  var controls = document.getElementById('controls');
  var notYouTubeMessage = document.getElementById('notYouTubeMessage');

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

  // Get the current tab
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var activeTab = tabs[0];

    // Check if current tab is YouTube
    if (!activeTab.url.includes('youtube.com')) {
      controls.classList.add('disabled');
      notYouTubeMessage.style.display = 'block';
      return;
    }

    // Send a message to the content script to get the current volumes
    chrome.tabs.sendMessage(activeTab.id, { action: MessageAction.GET_VOLUMES }, function (response) {
      if (response) {
        if (response.videoVolume !== undefined) {
          videoVolumeSlider.value = response.videoVolume;
          updateVolumeLabel(videoVolumeSlider, videoVolumeLabel);
        }
        if (response.adVolume !== undefined) {
          adVolumeSlider.value = response.adVolume;
          updateVolumeLabel(adVolumeSlider, adVolumeLabel);
        }
      }
    });

    // Add event listeners if elements are found
    if (videoVolumeSlider) {
      videoVolumeSlider.addEventListener('input', function () {
        updateVolumeLabel(videoVolumeSlider, videoVolumeLabel);
        chrome.tabs.sendMessage(activeTab.id, { 
          action: MessageAction.SET_VIDEO_VOLUME, 
          volume: videoVolumeSlider.value 
        });
      });
    }

    if (adVolumeSlider) {
      adVolumeSlider.addEventListener('input', function () {
        updateVolumeLabel(adVolumeSlider, adVolumeLabel);
        chrome.tabs.sendMessage(activeTab.id, { 
          action: MessageAction.SET_AD_VOLUME, 
          volume: adVolumeSlider.value 
        });
      });
    }
  });
});