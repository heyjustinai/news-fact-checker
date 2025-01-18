document.addEventListener('DOMContentLoaded', function() {
    // Get reference to form elements
    const overlayForm = document.getElementById('overlayForm');
    const textInput = document.getElementById('overlayText');
    const positionSelect = document.getElementById('position');
    const statusMessage = document.createElement('div');
    statusMessage.style.marginTop = '10px';
    document.body.appendChild(statusMessage);
    
    // Check if we're on YouTube
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        if (!currentTab.url.includes('youtube.com/watch')) {
            overlayForm.style.display = 'none';
            statusMessage.textContent = 'Please navigate to a YouTube video page';
            statusMessage.style.color = 'red';
            return;
        }
    });
    
    overlayForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const overlayData = {
            action: "addOverlay",
            text: textInput.value,
            position: positionSelect.value
        };
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs[0].url.includes('youtube.com/watch')) {
                statusMessage.textContent = 'Please navigate to a YouTube video page';
                statusMessage.style.color = 'red';
                return;
            }
            
            chrome.tabs.sendMessage(tabs[0].id, overlayData, function(response) {
                if (chrome.runtime.lastError) {
                    statusMessage.textContent = 'Please refresh the YouTube page and try again';
                    statusMessage.style.color = 'red';
                    return;
                }
                
                if (response && response.success) {
                    textInput.value = ''; // Clear the input after successful addition
                    statusMessage.textContent = 'Overlay added successfully!';
                    statusMessage.style.color = 'green';
                } else {
                    statusMessage.textContent = 'Failed to add overlay. Please refresh the page and try again.';
                    statusMessage.style.color = 'red';
                }
            });
        });
    });
});
