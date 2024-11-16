const MessageAction = {
  GET_VOLUME: 'getVolume',
  SET_VOLUME: 'setVolume',
  ENABLE_AD_VOLUME_CONTROLLER: 'enableAdVolumeController',
  DISABLE_AD_VOLUME_CONTROLLER: 'disableAdVolumeController',
  GET_AVC_STATE: 'getAVCState',
  GET_SLIDER_VOLUME: 'getSliderVolume'
};

// Make it available to other scripts
if (typeof module !== 'undefined') {
  module.exports = { MessageAction };
} else {
  window.MessageAction = MessageAction;
}