document.addEventListener('DOMContentLoaded', function () {
  var volumeSlider = document.getElementById('volumeSlider');
  var volumeLabel = document.getElementById('volumeLabel');
  var enableExtensionCheckbox = document.getElementById('enableExtension');

  function updateVolumeLabel(volume) {
    volumeLabel.textContent = Math.round(volume * 100) + '%';
  }

  // Get the current tab
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var activeTab = tabs[0];

    // Send a message to the content script to get the current volume
    chrome.tabs.sendMessage(activeTab.id, { action: 'getVolume' }, function (response) {
      if (response && response.volume !== undefined) {
        volumeSlider.value = response.volume;
        updateVolumeLabel(response.volume);
      }
    });

    // Add an event listener to the slider to update the volume label and send the new volume if enabled
    volumeSlider.addEventListener('input', function () {
      var desiredVolume = volumeSlider.value;
      updateVolumeLabel(desiredVolume);
      if (enableExtensionCheckbox.checked) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'setVolume', volume: desiredVolume });
      }
    });

    // Add an event listener to the checkbox to enable/disable the extension
    enableExtensionCheckbox.addEventListener('change', function () {
      var isEnabled = enableExtensionCheckbox.checked;
      chrome.tabs.sendMessage(activeTab.id, { action: isEnabled ? 'enableExtension' : 'disableExtension' });
    });

    // Initialize the checkbox state
    chrome.tabs.sendMessage(activeTab.id, { action: 'getExtensionState' }, function (response) {
      if (response && response.isEnabled !== undefined) {
        enableExtensionCheckbox.checked = response.isEnabled;
      }
    });
  });
});