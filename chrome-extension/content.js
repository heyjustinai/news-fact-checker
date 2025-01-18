let overlay = null;
let timestamps = {};
let videoTimeCheckInterval = null;
let tickMarks = [];
let observer = null;

function createOverlay() {
    if (!overlay && document.body) {
        overlay = document.createElement('div');
        overlay.id = 'youtube-timestamp-overlay';
        overlay.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 9999;
            pointer-events: none;
            transition: opacity 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        document.body.appendChild(overlay);
    }
    return overlay;
}

function updateOverlay(text) {
    const overlay = createOverlay();
    if (!overlay) return;
    
    overlay.textContent = text;
    overlay.style.opacity = '1';
    
    // Hide overlay after 5 seconds
    setTimeout(() => {
        if (overlay) {
            overlay.style.opacity = '0';
        }
    }, 5000);
}

function createTickMark(percent) {
    const tick = document.createElement('div');
    tick.className = 'timestamp-tick';
    tick.style.cssText = `
        position: absolute;
        bottom: 0;
        width: 4px;
        height: 100%;
        background-color: #ffeb3b;
        opacity: 0.7;
        pointer-events: none;
        z-index: 9999;
        left: ${percent}%;
    `;
    return tick;
}

function updateTickMarks() {
    // Remove existing tick marks
    tickMarks.forEach(tick => {
        if (tick && tick.parentNode) {
            tick.remove();
        }
    });
    tickMarks = [];

    const progressBar = document.querySelector('.ytp-progress-bar');
    if (!progressBar) return;

    const video = document.querySelector('video');
    if (!video) return;

    const duration = video.duration;
    if (!duration) return;

    // Create new tick marks
    Object.keys(timestamps).forEach(time => {
        const timeInSeconds = parseInt(time);
        const percent = (timeInSeconds / duration) * 100;
        
        const tick = createTickMark(percent);
        progressBar.appendChild(tick);
        tickMarks.push(tick);
    });
}

function checkVideoTime() {
    const video = document.querySelector('video');
    if (!video) return;

    const currentTime = Math.floor(video.currentTime);
    const currentTimeStr = currentTime.toString();

    if (timestamps[currentTimeStr]) {
        updateOverlay(timestamps[currentTimeStr]);
    }
}

function startVideoTimeCheck() {
    if (videoTimeCheckInterval) {
        clearInterval(videoTimeCheckInterval);
    }
    videoTimeCheckInterval = setInterval(checkVideoTime, 1000);
}

function initializeObserver() {
    if (observer) {
        observer.disconnect();
    }

    observer = new MutationObserver(() => {
        if (!document.body) return;
        
        const player = document.querySelector('.html5-video-player');
        if (player && overlay) {
            overlay.style.bottom = `${80}px`;
            overlay.style.right = `${20}px`;
        }
        updateTickMarks();
    });

    // Make sure document.body exists before observing
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });
    }
}

function addStyles() {
    if (!document.head) return;
    
    const style = document.createElement('style');
    style.textContent = `
        .timestamp-tick {
            transition: opacity 0.2s ease;
        }
        .timestamp-tick:hover {
            opacity: 1;
            background-color: #ffd700;
        }
        .ytp-progress-bar:hover .timestamp-tick {
            height: 100% !important;
        }
    `;
    document.head.appendChild(style);
}

function waitForElement(selector, callback, maxAttempts = 10) {
    let attempts = 0;
    
    function check() {
        const element = document.querySelector(selector);
        if (element) {
            callback(element);
            return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
            setTimeout(check, 500);
        }
    }
    
    check();
}

function initialize() {
    // Wait for document.body
    if (!document.body) {
        setTimeout(initialize, 100);
        return;
    }

    // Initialize components
    createOverlay();
    addStyles();
    initializeObserver();
    
    // Wait for video player
    waitForElement('video', () => {
        startVideoTimeCheck();
        updateTickMarks();
    });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in content script:", request);
    
    if (request.action === "test") {
        sendResponse({ status: "content_script_ready" });
        return false;
    }
    
    if (request.action === "updateTimestamps") {
        timestamps = request.timestamps;
        startVideoTimeCheck();
        updateTickMarks();
        sendResponse({ status: "Timestamps updated successfully" });
        return false;
    }
    
    if (request.action === "updateOverlay") {
        updateOverlay(request.text);
        sendResponse({ status: "Overlay updated successfully" });
        return false;
    }
    
    return false;
});

// Start initialization
initialize();

// Listen for YouTube navigation events
document.addEventListener('yt-navigate-finish', () => {
    setTimeout(() => {
        initialize();
        updateTickMarks();
    }, 1000);
});

// Update tick marks when the window is resized
window.addEventListener('resize', () => {
    if (document.body) {
        updateTickMarks();
    }
});

// Periodic check for video player and tick marks
setInterval(() => {
    if (document.body) {
        updateTickMarks();
    }
}, 5000);
