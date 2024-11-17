const MessageAction = {
  GET_VOLUMES: 'getVolumes',
  SET_VIDEO_VOLUME: 'setVideoVolume',
  SET_AD_VOLUME: 'setAdVolume'
};

// Make it available to other scripts
if (typeof module !== 'undefined') {
  module.exports = { MessageAction };
} else {
  window.MessageAction = MessageAction;
}