# YouTube Ad Volume Controller Extension

A Chrome extension that automatically controls the volume of YouTube ads while maintaining your preferred volume for regular videos.

## Features

- 🔊 Set volume levels for ads
- 🔄 Automatically restores original volume when ads end
- 🎯 Works only on YouTube domains
- 🖥️ Simple, clean popup interface
- 📊 Development panel for real-time volume monitoring (Ctrl+Shift+D)

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar when on YouTube
2. Use the slider to set your preferred ad volume level (0-100%)
3. The extension will automatically:
   - Detect when ads start playing
   - Lower the volume to your specified ad volume
   - Restore the original volume when the ad ends

### Developer Mode

Press `Ctrl+Shift+D` while on YouTube to toggle the developer panel, which shows:
- Current video volume
- Current ad volume settings
- Development mode status

## Technical Details

- Built with vanilla JavaScript
- Uses Chrome Extension Manifest V3
- Implements `MutationObserver` to detect ad state changes
- Uses Chrome messaging API for popup-content script communication

## Files

- `popup.html` - Extension popup interface
- `content.js` - Main content script for volume control
- `popup.js` - Popup interface logic
- `constants.js` - Shared constants
- `manifest.json` - Extension configuration

## License

MIT License