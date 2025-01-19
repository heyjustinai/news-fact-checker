let overlays = [];
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "addOverlay") {
        const success = createOverlay(request.text);
        sendResponse({success: success});
    }
    return true;
});

function removeAllOverlays() {
    const container = document.querySelector('.youtube-overlay-container');
    if (container) {
        container.remove();
    }
    overlays = [];
}

function createOverlayContainer(player) {
    let container = document.querySelector('.youtube-overlay-container');
    
    if (!container) {
        container = document.createElement('div');
        container.className = 'youtube-overlay-container';
        
        // Create an inner container for the overlays
        const innerContainer = document.createElement('div');
        innerContainer.className = 'youtube-overlay-inner-container';
        
        Object.assign(container.style, {
            position: 'absolute',
            left: '20px',
            top: '60px',
            bottom: '60px',
            width: '300px',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '8px',
            zIndex: '1000000',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column-reverse'
        });

        Object.assign(innerContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginTop: 'auto'
        });

        container.appendChild(innerContainer);

        // Add custom scrollbar styles for webkit browsers
        const style = document.createElement('style');
        style.textContent = `
            .youtube-overlay-container::-webkit-scrollbar {
                width: 6px;
            }
            .youtube-overlay-container::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0);
            }
            .youtube-overlay-container::-webkit-scrollbar-thumb {
                background-color: rgba(255, 255, 255, 0.5);
                border-radius: 3px;
            }
        `;
        document.head.appendChild(style);
        
        player.appendChild(container);
    }
    
    return container.querySelector('.youtube-overlay-inner-container');
}

function createOverlay(text) {
    const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
    if (!player) {
        console.log('Could not find YouTube player');
        return false;
    }

    const container = createOverlayContainer(player);
    
    const overlay = document.createElement('div');
    overlay.className = 'youtube-text-overlay';
    overlay.textContent = text;
    
    // Style similar to X-Ray entries
    Object.assign(overlay.style, {
        color: 'white',
        fontSize: '14px',
        fontFamily: 'YouTube Noto, Roboto, Arial, sans-serif',
        fontWeight: '400',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '12px',
        borderRadius: '4px',
        width: 'calc(100% - 24px)',
        transition: 'background-color 0.2s',
        cursor: 'default'
    });

    // Add hover effect with slightly higher opacity
    overlay.addEventListener('mouseenter', () => {
        overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    });
    
    overlay.addEventListener('mouseleave', () => {
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    });
    
    // Add new overlay at the bottom
    container.appendChild(overlay);
    overlays.push(overlay);
    
    // Get the outer container for scrolling
    const outerContainer = container.parentElement;
    outerContainer.scrollTop = outerContainer.scrollHeight;
    
    return true;
}

// Handle YouTube's dynamic page loading
function initializeOverlaySystem() {
    removeAllOverlays();
}

// Watch for URL changes
let lastUrl = location.href;
new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        initializeOverlaySystem();
    }
}).observe(document, {subtree: true, childList: true});

// Additional observer to ensure overlay container stays visible
new MutationObserver(() => {
    if (overlays.length > 0) {
        const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
        const container = document.querySelector('.youtube-overlay-container');
        if (!container && player) {
            const innerContainer = createOverlayContainer(player);
            overlays.forEach(overlay => {
                if (!overlay.parentElement) {
                    innerContainer.appendChild(overlay);
                }
            });
        }
    }
}).observe(document.body, {childList: true, subtree: true}); 