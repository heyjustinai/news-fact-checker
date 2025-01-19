# Ground Truth AI Fact Checker

A Chrome extension that provides real-time fact-checking for YouTube videos. This tool helps viewers verify information by displaying fact-check notifications at specific timestamps throughout the video.

## Authors

- Adam Czyzewski ([Twitter](https://x.com/AdamCzyzewski1), [LinkedIn](https://www.linkedin.com/in/czyzewski-a/))
- Ayush Khandelwal ([Twitter](https://x.com/ayushkhd), [LinkedIn](https://www.linkedin.com/in/ayushkhd/))
- Justin Lee ([Twitter](https://x.com/heyjustinai), [LinkedIn](https://www.linkedin.com/in/heyjustinai/))
- Marissa Li ([Twitter](https://x.com/marissali_), [LinkedIn](https://www.linkedin.com/in/marissa-li314/))

## Features

- 🎯 Real-time fact checking as you watch
- 📍 Visual indicators (yellow ticks) on the video progress bar showing fact-check points
- 💬 Overlay notifications with fact-check information
- 🔄 Automatic updates when navigating between videos
- 🎨 Clean, non-intrusive UI that integrates with YouTube's interface

## Architecture

### Chrome Extension
- **Popup Interface**: Simple UI for controlling the fact-checker
- **Content Script**: Integrates with YouTube's video player
- **Background Script**: Handles communication between components

### Backend Server
- Flask-based API server
- Provides fact-checking data for videos
- Easily extensible for additional fact-checking sources

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/youtube-fact-checker.git
cd youtube-fact-checker
```

2. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Load the Chrome extension:
- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `chrome-extension` directory

4. Start the backend server:
```bash
cd backend
python app.py
```

## Usage

1. Navigate to any YouTube video
2. Click the Fact Checker extension icon
3. Yellow tick marks will appear on the video progress bar indicating fact-check points
4. As you watch the video, fact-check notifications will appear when the video reaches these points
5. Hover over tick marks to see the timestamp position

## Development

### Extension Structure
```
chrome-extension/
├── manifest.json      # Extension configuration
├── popup.html        # Extension popup interface
├── popup.js         # Popup functionality
├── content.js       # YouTube integration
└── background.js    # Background processes
```

### Backend Structure
```
backend/
├── app.py           # Main Flask application
├── requirements.txt # Python dependencies
└── init.py         # Initialization code
```

### Adding Fact Checks

Fact checks are served through the `/api/timestamps` endpoint in the following format:
```json
{
    "30": "Fact check: This statistic is from 2019, not 2023",
    "65": "Context: Additional research shows different results",
    "120": "Correction: The actual figure is 25%, not 45%"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Integration with fact-checking APIs
- [ ] Machine learning for automated fact detection
- [ ] User-submitted fact checks with verification
- [ ] Support for more video platforms
- [ ] Customizable notification settings
- [ ] Fact check source citations
- [ ] Export fact check reports

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- YouTube API documentation
- Chrome Extension documentation
- Flask documentation
- All contributors and testers
