document.addEventListener('DOMContentLoaded', function () {
  var volumeSlider = document.getElementById('volumeSlider');
  var volumeLabel = document.getElementById('volumeLabel');

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

    // Add an event listener to the slider to send the new volume to the content script
    volumeSlider.addEventListener('input', function () {
      var desiredVolume = volumeSlider.value;
      updateVolumeLabel(desiredVolume);
      chrome.tabs.sendMessage(activeTab.id, { action: 'setVolume', volume: desiredVolume });
    });
  });
});