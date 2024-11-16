document.addEventListener('DOMContentLoaded', function () {
  var volumeSlider = document.getElementById('volumeSlider');
  var volumeLabel = document.getElementById('volumeLabel');
  var enableAdVolumeControllerCheckbox = document.getElementById('enableAdVolumeController');
  var controls = document.getElementById('controls');
  var notYouTubeMessage = document.getElementById('notYouTubeMessage');
  var originalVolumeLabel = document.getElementById('originalVolumeLabel');
  var originalVolumeValue = document.getElementById('originalVolumeValue');

  function updateVolumeLabel(volume) {
    volumeLabel.textContent = Math.round(volume * 100) + '%';
  }

  // Listen for getSliderVolume requests from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === MessageAction.GET_SLIDER_VOLUME) {
      sendResponse({ sliderVolume: volumeSlider.value });
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

    // Send a message to the content script to get the current volume
    chrome.tabs.sendMessage(activeTab.id, { action: MessageAction.GET_VOLUME }, function (response) {
      if (response && response.volume !== undefined) {
        volumeSlider.value = response.volume;
        updateVolumeLabel(response.volume);
      }
    });

    // Add an event listener to the slider to update the volume label and send the new volume if enabled
    volumeSlider.addEventListener('input', function () {
      var desiredVolume = volumeSlider.value;
      updateVolumeLabel(desiredVolume);
      if (enableAdVolumeControllerCheckbox.checked) {
        chrome.tabs.sendMessage(activeTab.id, { 
          action: MessageAction.SET_VOLUME, 
          volume: desiredVolume 
        });
      }
    });

    // Add an event listener to the checkbox to enable/disable the Ad Volume Controller
    enableAdVolumeControllerCheckbox.addEventListener('change', function () {
      var isEnabled = enableAdVolumeControllerCheckbox.checked;
      chrome.tabs.sendMessage(activeTab.id, { 
        action: isEnabled ? MessageAction.ENABLE_AD_VOLUME_CONTROLLER : MessageAction.DISABLE_AD_VOLUME_CONTROLLER 
      }, function(response) {
        if (isEnabled && response && response.originalVolume !== undefined) {
          originalVolumeValue.textContent = Math.round(response.originalVolume * 100) + '%';
          originalVolumeLabel.style.display = 'block';
        } else {
          originalVolumeLabel.style.display = 'none';
        }
      });
      
      if (isEnabled) {
        console.log('Ad Volume Controller enabled, slider volume:', volumeSlider.value);
      }
    });

    // Initialize the checkbox state
    chrome.tabs.sendMessage(activeTab.id, { action: MessageAction.GET_AVC_STATE }, function (response) {
      if (response && response.isEnabled !== undefined) {
        enableAdVolumeControllerCheckbox.checked = response.isEnabled;
      }
    });
  });
});