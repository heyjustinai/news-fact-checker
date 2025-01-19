document.addEventListener('DOMContentLoaded', function() {
    // Function to check if current tab is a YouTube page
    async function isYouTubePage() {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        const tab = tabs[0];
        return tab.url.includes('youtube.com');
    }

    // Function to send message to content script
    function sendMessageToContentScript(tabId, message) {
        return new Promise((resolve, reject) => {
            try {
                chrome.tabs.sendMessage(tabId, message, response => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Function to ensure content script is injected
    async function ensureContentScriptInjected() {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (!tabs[0]) return false;
        
        try {
            // Try to send a test message
            await sendMessageToContentScript(tabs[0].id, { action: "test" });
            return true; // Content script is already there
        } catch (error) {
            // If we get here, the content script isn't injected
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    files: ['content.js']
                });
                // Wait a moment for the script to initialize
                await new Promise(resolve => setTimeout(resolve, 100));
                return true;
            } catch (error) {
                console.error('Failed to inject content script:', error);
                return false;
            }
        }
    }

    // Function to get current tab's YouTube URL
    async function getCurrentVideoUrl() {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        const tab = tabs[0];
        if (!tab.url.includes('youtube.com/watch?v=')) {
            throw new Error('Not a YouTube video page');
        }
        return tab.url;
    }

    // Function to fetch timestamps
    async function fetchTimestamps() {
        try {
            const videoUrl = await getCurrentVideoUrl();
            const response = await fetch('http://127.0.0.1:5000/api/timestamps', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    video_url: videoUrl
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch timestamps');
            }

            const timestamps = await response.json();
            return timestamps;
        } catch (error) {
            console.error('Error fetching timestamps:', error);
            throw error;
        }
    }

    // Function to call the API and get data
    async function fetchData() {
        const messageDisplay = document.getElementById('messageDisplay');
        messageDisplay.textContent = '🔄 Analyzing video...';
        
        try {
            if (!await isYouTubePage()) {
                messageDisplay.textContent = '⚠️ Please open this extension on a YouTube video page';
                return;
            }

            if (!await ensureContentScriptInjected()) {
                messageDisplay.textContent = '❌ Error: Could not inject content script';
                return;
            }

            const timestamps = await fetchTimestamps();
            if (!timestamps) {
                messageDisplay.textContent = '❌ Error: Could not fetch timestamps';
                return;
            }

            messageDisplay.textContent = '✅ Analysis complete!';
            // displayTimestamps(timestamps); // This function is not defined in the provided code

            const tabs = await chrome.tabs.query({active: true, currentWindow: true});
            if (tabs[0]) {
                try {
                    await sendMessageToContentScript(tabs[0].id, {
                        action: "updateTimestamps",
                        timestamps: timestamps
                    });
                    console.log('Timestamps update sent to content script');
                } catch (error) {
                    console.error('Error updating timestamps:', error);
                    messageDisplay.textContent = '❌ Error: Could not update video overlay';
                }
            }
        } catch (error) {
            console.error('There was a problem:', error);
            messageDisplay.textContent = '❌ Error: ' + error.message;
        }
    }

    // Call the function when needed, e.g., on button click or popup open
    fetchData();

    // Add click event listener to the button
    const checkFactsButton = document.getElementById('checkFactsButton');
    checkFactsButton.addEventListener('click', fetchData);

    // Initial check to update UI state
    isYouTubePage().then(isYoutube => {
        const messageDisplay = document.getElementById('messageDisplay');
        if (!isYoutube) {
            messageDisplay.textContent = '⚠️ Please open this extension on a YouTube video page';
            checkFactsButton.disabled = true;
            checkFactsButton.style.opacity = '0.5';
        } else {
            messageDisplay.textContent = 'Ready to check video facts';
            checkFactsButton.disabled = false;
            checkFactsButton.style.opacity = '1';
        }
    });

});