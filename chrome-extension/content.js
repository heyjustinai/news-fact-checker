let timestamps = {};
let videoTimeCheckInterval = null;
let tickMarks = [];
let overlays = [];

function createOverlayContainer() {
    const player = document.querySelector('.html5-video-player');
    if (!player) return null;

    let container = document.querySelector('.youtube-overlay-container');
    if (container) return container.querySelector('.youtube-overlay-inner-container');
    
    container = document.createElement('div');
    container.className = 'youtube-overlay-container';
    
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
    player.appendChild(container);
    
    return innerContainer;
}

function getScoreEmoji(score) {
    score = parseFloat(score);
    if (score >= 0.7) return '✅';
    if (score >= 0.3) return '⚠️';
    return '❌';
}

function formatTimeString(timeStr) {
    return timeStr.padStart(8, '0');  // Ensure format like "00:00:01"
}

function createOverlayContent(time, claim) {
    const scoreEmoji = getScoreEmoji(claim.score);
    
    let html = `
        <div style="margin-bottom: 8px;">
            <span style="font-weight: bold;">${scoreEmoji} ${formatTimeString(time)}</span>
        </div>
        <div style="margin-bottom: 8px;">
            <span style="color: #fff;">🗣️ ${claim.statement}</span>
        </div>
    `;

    if (claim.sources && claim.sources.length > 0) {
        html += `
            <div style="margin-bottom: 8px; font-size: 12px;">
                📚 Sources:<br>
                ${claim.sources.map(source => 
                    `<a href="${source}" target="_blank" style="color: #3ea6ff; text-decoration: none; display: block; margin: 2px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${source}</a>`
                ).join('')}
            </div>
        `;
    }

    if (claim.accuracy || claim.reason) {
        html += `
            <div style="margin-bottom: 8px; font-style: italic; color: #ccc; font-size: 12px;">
                💭 ${claim.accuracy || claim.reason}
            </div>
        `;
    }

    const scoreClass = parseFloat(claim.score) >= 0.7 ? '#4ade80' : 
                      parseFloat(claim.score) >= 0.3 ? '#fbbf24' : '#ef4444';
    
    html += `
        <div style="display: inline-block; padding: 4px 8px; border-radius: 12px; background-color: ${scoreClass}33; color: ${scoreClass}; font-size: 12px; font-weight: bold;">
            Score: ${claim.score}
        </div>
    `;

    return html;
}

function updateOverlay(time, claims) {
    const container = createOverlayContainer();
    if (!container) return;

    claims.forEach(claim => {
        const overlay = document.createElement('div');
        overlay.className = 'youtube-text-overlay';
        
        Object.assign(overlay.style, {
            color: 'white',
            fontSize: '14px',
            fontFamily: 'YouTube Noto, Roboto, Arial, sans-serif',
            fontWeight: '400',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '12px',
            borderRadius: '8px',
            width: 'calc(100% - 24px)',
            transition: 'all 0.2s ease',
            cursor: 'default',
            opacity: '1',
            marginBottom: '8px'
        });

        overlay.innerHTML = createOverlayContent(time, claim);

        overlay.addEventListener('mouseenter', () => {
            overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        });
        
        overlay.addEventListener('mouseleave', () => {
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        });
        
        container.appendChild(overlay);
        overlays.push(overlay);
    });
    
    const outerContainer = container.parentElement;
    outerContainer.scrollTop = outerContainer.scrollHeight;
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
    tickMarks.forEach(tick => tick.remove());
    tickMarks = [];

    const progressBar = document.querySelector('.ytp-progress-bar');
    if (!progressBar) return;

    const video = document.querySelector('video');
    if (!video || !video.duration) return;

    Object.keys(timestamps).forEach(time => {
        const timeInSeconds = new Date(time).getTime() / 1000;
        const percent = (timeInSeconds / video.duration) * 100;
        const tick = createTickMark(percent);
        progressBar.appendChild(tick);
        tickMarks.push(tick);
    });
}

function checkVideoTime() {
    const video = document.querySelector('video');
    if (!video) return;

    const currentTime = Math.floor(video.currentTime);
    
    // Convert current time to "HH:MM:SS" format
    const timeStr = new Date(currentTime * 1000).toISOString().substr(11, 8);
    
    // Check if we have any claims for this timestamp
    if (timestamps[timeStr]) {
        updateOverlay(timeStr, timestamps[timeStr]);
    }
}

function startVideoTimeCheck() {
    if (videoTimeCheckInterval) {
        clearInterval(videoTimeCheckInterval);
    }
    videoTimeCheckInterval = setInterval(checkVideoTime, 1000);
}

function addStyles() {
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
        .youtube-text-overlay {
            transform: translateX(0);
            transition: opacity 0.5s ease, transform 0.3s ease;
        }
        .youtube-text-overlay.fade-out {
            opacity: 0;
            transform: translateX(-10px);
        }
    `;
    document.head.appendChild(style);
}

function cleanup() {
    if (videoTimeCheckInterval) {
        clearInterval(videoTimeCheckInterval);
    }
    tickMarks.forEach(tick => tick.remove());
    tickMarks = [];
    
    const container = document.querySelector('.youtube-overlay-container');
    if (container) {
        container.remove();
    }
    overlays = [];
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "test") {
        sendResponse({ status: "content_script_ready" });
    } else if (request.action === "updateTimestamps") {
        timestamps = request.timestamps;
        startVideoTimeCheck();
        updateTickMarks();
        sendResponse({ status: "timestamps_updated" });
    }
    return true;
});

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    addStyles();
    startVideoTimeCheck();
});

// Watch for video player changes
const observer = new MutationObserver(() => {
    updateTickMarks();
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true
});

// Handle YouTube navigation
document.addEventListener('yt-navigate-finish', () => {
    cleanup();
    setTimeout(() => {
        addStyles();
        startVideoTimeCheck();
    }, 1000);
});

// Update on resize
window.addEventListener('resize', updateTickMarks);

// Periodic updates
setInterval(updateTickMarks, 5000);