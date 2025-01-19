# YouTube Fact Checker Chrome Extension

The frontend component of the YouTube Fact Checker project. This Chrome extension integrates with YouTube's video player to provide real-time fact-checking notifications.

## Components

### 1. Popup (popup.html, popup.js)
- User interface for controlling the fact checker
- Displays current status and fact-check information
- Handles communication with the backend server

### 2. Content Script (content.js)
- Integrates with YouTube's video player
- Adds visual indicators (yellow ticks) to the progress bar
- Manages overlay notifications
- Tracks video playback time
- Updates UI elements based on fact-check data

### 3. Background Script (background.js)
- Handles communication between popup and content script
- Manages extension state
- Processes messages between components

## Features

### Visual Indicators
- Yellow tick marks on the video progress bar
- Indicates timestamps where fact checks are available
- Hover effects for better visibility

### Fact Check Overlay
- Non-intrusive notifications
- Appears when video reaches fact-check points
- Auto-hides after displaying information
- Positioned to avoid interfering with video controls

### YouTube Integration
- Works with YouTube's native video player
- Responsive to video navigation
- Updates when switching between videos
- Maintains position during video resizing

## Installation for Development

1. Clone the repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select this directory

## Configuration

The extension requires a running backend server. By default, it connects to:
```
http://127.0.0.1:5000
```

To modify the backend URL, update the fetch calls in `popup.js`.

## API Integration

The extension expects fact-check data in this format:
```json
{
    "timestamp_in_seconds": "Fact check message",
    "30": "This claim needs context...",
    "65": "This statement is incorrect...",
    "120": "Additional information..."
}
```

## Development Notes

### Adding New Features
1. Update manifest.json for new permissions
2. Add functionality to content.js for YouTube integration
3. Update popup.js for user interface changes
4. Modify background.js for new message handling

### Best Practices
- Test on various YouTube layouts
- Check for mobile compatibility
- Ensure non-interference with YouTube's functionality
- Follow Chrome extension security guidelines

### Debug Tips
- Use Chrome DevTools for popup debugging
- Check console for content script messages
- Monitor background script in extension details
- Test with various video lengths and types

## Testing

1. Load the extension
2. Open a YouTube video
3. Click the extension icon
4. Verify:
   - Tick marks appear
   - Notifications show at correct times
   - UI updates when changing videos
   - Overlay positioning is correct

## Security

- No sensitive data is stored
- All communication is local or with specified backend
- Content script runs only on YouTube domains
- Follows Chrome's security best practices
