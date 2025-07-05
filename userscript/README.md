# YouTube Ad Volume Controller - Userscript

A lightweight userscript that automatically mutes YouTube ads and restores the original volume when they end. This version works with any browser that supports userscript extensions.

## Features

- **Automatic ad detection** - Detects YouTube ads using the same method as the Chrome extension
- **Volume management** - Saves your current volume when an ad starts and restores it when the ad ends
- **Configurable ad volume** - Set ads to be completely muted (default) or at a low volume
- **Cross-browser compatibility** - Works with any browser that supports userscripts

## Installation

### Step 1: Install a Userscript Manager

Choose and install a userscript manager extension for your browser:

#### Chrome / Edge / Chromium-based browsers
- [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) (Recommended)
- [Violentmonkey](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag)

#### Firefox
- [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)

#### Safari
- [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887)
- [Tampermonkey](https://apps.apple.com/us/app/tampermonkey/id1482490089)

#### Opera
- [Tampermonkey](https://addons.opera.com/en/extensions/details/tampermonkey-beta/)
- [Violentmonkey](https://addons.opera.com/en/extensions/details/violent-monkey/)

### Step 2: Install the Script

1. **Download the script**: Save `youtube-ad-volume-controller.user.js` from this folder
2. **Open your userscript manager** (click the extension icon in your browser)
3. **Create a new script** or click "Install script"
4. **Copy and paste** the entire contents of `youtube-ad-volume-controller.user.js`
5. **Save the script** and make sure it's enabled
6. **Navigate to YouTube** - the script will start working automatically

## Usage

Once installed, the script works automatically:

1. **Open YouTube** in your browser
2. **Play any video** with ads
3. **The script will automatically**:
   - Detect when an ad starts playing
   - Save your current volume level
   - Mute the ad (or set it to your configured volume)
   - Restore your original volume when the ad ends

## Configuration

You can customize the ad volume by editing the script:

1. Open your userscript manager
2. Find the "YouTube Ad Volume Controller" script
3. Click "Edit"
4. Look for this line at the top:
   ```javascript
   const AD_VOLUME = 0.0; // Volume during ads (0.0 = muted, 0.05 = very low)
   ```
5. Change the value:
   - `0.0` = Completely muted (default)
   - `0.05` = Very low volume (5%)
   - `0.1` = Low volume (10%)
   - `0.2` = Quiet volume (20%)
6. Save the script


## License

MIT License - Same as the main project
