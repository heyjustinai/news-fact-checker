let overlays = [];

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "addOverlay") {
        const success = createOverlay(request.text, request.position);
        sendResponse({success: success});
    }
    return true;
});

function createOverlay(text, position) {
    // Try multiple selectors for the video container
    const video = document.querySelector('.html5-main-video, video');
    const videoContainer = document.querySelector('.html5-video-container, .ytp-player-content');
    
    if (!video || !videoContainer) {
        console.log('Could not find video or container elements');
        return false;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'youtube-text-overlay';
    overlay.textContent = text;
    
    // Enhanced styling for better visibility
    overlay.style.position = 'absolute';
    overlay.style.color = 'white';
    overlay.style.padding = '10px';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.borderRadius = '5px';
    overlay.style.zIndex = '9999';
    overlay.style.fontSize = '20px';
    overlay.style.fontWeight = 'bold';
    overlay.style.pointerEvents = 'none'; // Make sure overlay doesn't interfere with video controls
    
    // Position the overlay based on selection
    switch(position) {
        case 'top':
            overlay.style.top = '10%';
            overlay.style.left = '50%';
            overlay.style.transform = 'translateX(-50%)';
            break;
        case 'bottom':
            overlay.style.bottom = '20%'; // Increased to avoid controls
            overlay.style.left = '50%';
            overlay.style.transform = 'translateX(-50%)';
            break;
        case 'center':
            overlay.style.top = '50%';
            overlay.style.left = '50%';
            overlay.style.transform = 'translate(-50%, -50%)';
            break;
    }
    
    // Add overlay to video container
    videoContainer.appendChild(overlay);
    overlays.push(overlay);
    
    // Log success message
    console.log('Overlay created:', {
        text: text,
        position: position,
        containerFound: !!videoContainer
    });
    
    return true;
}

// Add this to handle YouTube's dynamic page loading
function initializeOverlaySystem() {
    // Clear existing overlays when navigating to a new video
    overlays.forEach(overlay => overlay.remove());
    overlays = [];
}

// Watch for URL changes (YouTube is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        initializeOverlaySystem();
    }
}).observe(document, {subtree: true, childList: true}); 