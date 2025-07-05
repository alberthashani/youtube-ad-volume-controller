# YouTube Ad Volume Controller

A browser extension that automatically adjusts YouTube ad volume to your preferred level. No more sudden loud interruptions while watching videos. The extension detects when ads play, lowers the volume to your chosen setting, then restores the original volume when the ad ends.

## Features

- Automatically detects YouTube ads
- Set custom volume levels for ads (0-100%)
- Restores original volume when ads end
- Supports creators by not blocking ads
- Developer debug panel for monitoring (Ctrl+Shift+D)

## Browser Compatibility

This extension is compatible with all Chromium-based browsers including:
- Google Chrome
- Microsoft Edge
- Brave Browser
- Opera
- Vivaldi
- And other Chromium-based browsers

The extension uses Chrome Extension Manifest V3 and standard web APIs that work across the Chromium ecosystem.

> **Cross-Browser Alternative**: Looking for a solution that works in any browser? Check out our [userscript version](./userscript/) that works with Safari, Firefox, Edge, and any browser with userscript support!

## Popup User Interface

![Popup Interface](images/popup.png)

## Installation

1. Clone or download this repository
2. Open Chrome (or Edge) and go to `chrome://extensions`
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your Chrome toolbar

> **Alternative**: For other browsers, see the [userscript version](./userscript/) with installation instructions for Safari, Firefox, Edge, and more.

## Usage

1. Navigate to YouTube and click the extension icon
2. Set your preferred ad volume using the slider (0-100%)
3. The extension will automatically handle the rest:
   - Detects when ads start
   - Adjusts volume to your setting
   - Restores original volume when ads end

## Debug Mode

Press `Ctrl+Shift+D` on YouTube to toggle debug mode. This will show/hide the debug panel and enable/disable console logging. The debug panel displays:

- **Volume**: User's intended volume level
- **Realtime VideoPlayer volume**: Current actual video volume
- **Ad volume**: Configured volume level for ads
- **Ad Playing**: Whether an ad is currently detected

Debug mode is off by default. When enabled, you'll see detailed console logs and the real-time debug panel.

## Privacy Policy

You can view our privacy policy [here](https://alberthashani.github.io/youtube-ad-volume-controller/privacy_policy.html).

## License

MIT License