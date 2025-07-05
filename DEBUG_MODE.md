# Debug Mode Instructions

## Using Debug Mode

Debug mode is now controlled by a simple keyboard shortcut - no code changes needed!

### For Chrome Extension:

1. **Navigate to YouTube** in your browser
2. **Press `Ctrl+Shift+D`** to toggle debug mode on/off
3. **Debug panel and console logging** will be enabled/disabled together

### For Userscript:

The userscript has basic logging only. To enable verbose logging:
1. Open `userscript/youtube-ad-volume-controller.user.js`
2. Find the line `let isDebugMode = false;`
3. Change it to `let isDebugMode = true;`
4. Save the file and reload the userscript

## Debug Features

When debug mode is enabled in the Chrome extension:

When debug mode is enabled in the Chrome extension:

- **Console Logging**: Detailed logs appear in browser console
- **Debug Panel**: Real-time visual panel shows current state
- **Volume State Tracking**: Comprehensive logging of all volume changes and transitions

## Debug Panel Information

The debug panel displays:
- **Debug Panel Active**: Confirms debug mode is running
- **Volume**: User's intended volume level
- **Realtime VideoPlayer volume**: Current actual video volume
- **Ad volume**: Configured volume level for ads
- **Ad Playing**: Whether an ad is currently detected

## Console Log Types

You'll see detailed logs for:
- **POPUP_AD_VOLUME_CHANGE**: When user changes ad volume in popup
- **USER_VOLUME_CHANGE**: When user manually adjusts video volume
- **PRE_AD_START**: Volume state before ad begins
- **POST_AD_START**: Volume state after ad volume is applied
- **POST_AD_END**: Volume state after original volume is restored
- **VOLUME_SYNC_DISCREPANCY**: When extension's volume tracking gets out of sync

## Disabling Debug Mode

To disable debug features:

1. **Press `Ctrl+Shift+D` again** on YouTube
2. Debug panel will disappear and console logging will stop
