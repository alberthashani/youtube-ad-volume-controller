const MessageAction = {
  GET_VOLUME: 'getVolume',
  SET_VOLUME: 'setVolume',
  ENABLE_EXTENSION: 'enableExtension',
  DISABLE_EXTENSION: 'disableExtension',
  GET_EXTENSION_STATE: 'getExtensionState',
  GET_SLIDER_VOLUME: 'getSliderVolume'
};

// Make it available to other scripts
if (typeof module !== 'undefined') {
  module.exports = { MessageAction };
} else {
  window.MessageAction = MessageAction;
}