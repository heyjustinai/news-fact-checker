document.addEventListener('DOMContentLoaded', function() {
    // Update the current time
    const timeElement = document.getElementById('currentTime');
    timeElement.textContent = new Date().toLocaleTimeString();

    // Function to check if current tab is a YouTube page
    async function isYouTubePage() {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        const tab = tabs[0];
        return tab.url.includes('youtube.com');
    }

    // Function to ensure content script is injected
    async function ensureContentScriptInjected() {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (!tabs[0]) return false;
        
        try {
            // Try to send a test message
            await chrome.tabs.sendMessage(tabs[0].id, { action: "test" });
            return true; // Content script is already there
        } catch (error) {
            // If we get here, the content script isn't injected
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    files: ['content.js']
                });
                return true;
            } catch (error) {
                console.error('Failed to inject content script:', error);
                return false;
            }
        }
    }

    // Function to fetch timestamps
    async function fetchTimestamps() {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/timestamps');
            if (!response.ok) {
                throw new Error('Failed to fetch timestamps');
            }
            const timestamps = await response.json();
            return timestamps;
        } catch (error) {
            console.error('Error fetching timestamps:', error);
            return null;
        }
    }

    // Function to call the API and get data
    async function fetchData() {
        const messageDisplay = document.getElementById('messageDisplay');
        messageDisplay.textContent = 'Fetching data...';
        
        try {
            // First check if we're on YouTube
            if (!await isYouTubePage()) {
                messageDisplay.textContent = 'Please open this extension on a YouTube page';
                return;
            }

            // Ensure content script is injected
            if (!await ensureContentScriptInjected()) {
                messageDisplay.textContent = 'Error: Could not inject content script';
                return;
            }

            // Fetch timestamps
            const timestamps = await fetchTimestamps();
            if (!timestamps) {
                messageDisplay.textContent = 'Error: Could not fetch timestamps';
                return;
            }

            // Send timestamps to content script
            const tabs = await chrome.tabs.query({active: true, currentWindow: true});
            if (tabs[0]) {
                try {
                    const response = await chrome.tabs.sendMessage(tabs[0].id, {
                        action: "updateTimestamps",
                        timestamps: timestamps
                    });
                    console.log('Timestamps update response:', response);
                    messageDisplay.textContent = 'Timestamps loaded successfully';
                } catch (error) {
                    console.error('Error updating timestamps:', error);
                    messageDisplay.textContent = 'Error: Could not update timestamps';
                }
            }
        } catch (error) {
            console.error('There was a problem:', error);
            messageDisplay.textContent = 'Error: ' + error.message;
        }
    }

    // Call the function when needed, e.g., on button click or popup open
    fetchData();

    // Add click event listener to the button
    const greetButton = document.getElementById('greetButton');
    greetButton.addEventListener('click', fetchData);
});
