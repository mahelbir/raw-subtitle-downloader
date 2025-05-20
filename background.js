// Subtitle file extensions
const subtitleExtensions = [
    '.ass',
    '.cap',
    '.dfxp',
    '.dks',
    '.idx',
    '.itt',
    '.jss',
    '.lrc',
    '.mks',
    '.mpl',
    '.pjs',
    '.psb',
    '.qt.txt',
    '.qttext',
    '.rt',
    '.sbv',
    '.scc',
    '.smi',
    '.srt',
    '.ssa',
    '.stl',
    '.sub',
    '.sup',
    '.ttml',
    '.ttml2',
    '.usf',
    '.vtt'
];

// Keep track of detected subtitle URLs in memory
let detectedSubtitles = [];

// Listen for web requests that might be subtitle files
chrome.webRequest.onCompleted.addListener(
    (details) => {
        // Check if the URL contains a subtitle extension
        if (details.url && details.statusCode === 200 && details.tabId) {
            const url = details.url.toLowerCase();

            for (const ext of subtitleExtensions) {
                if (url.endsWith(ext)) {
                    // Store unique subtitle URLs
                    if (!detectedSubtitles.some(sub => sub.url === details.url)) {
                        const fileName = getFileNameFromUrl(details.url);
                        const extension = getExtensionFromUrl(details.url);

                        detectedSubtitles.push({
                            tabId: details.tabId,
                            url: details.url,
                            fileName: fileName,
                            extension: extension,
                            timestamp: Date.now()
                        });

                        // Update the badge to show number of available subtitles
                        updateBadge();
                        break;
                    }
                }
            }
        }
    },
    {urls: ["http://*/*", "https://*/*"]}
);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "clearSubtitles") {
        detectedSubtitles = [];
        updateBadge();
        sendResponse({success: true});
    } else if (request.action === "getSubtitles") {
        sendResponse({subtitles: detectedSubtitles});
    }
    return true; // Keep message channel open for async response
});

// Clear detected subtitles when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    clearDetectedSubtitlesByTab(tabId);
    updateBadge();
});

// Clear detected subtitles when a tab is refreshed
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') {
        clearDetectedSubtitlesByTab(tabId);
        updateBadge();
    }
});

// Extract filename from URL
function getFileNameFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const segments = pathname.split('/');
        const lastSegment = segments[segments.length - 1];

        // Return the filename or a default if empty
        return lastSegment || "subtitle";
    } catch (e) {
        return "subtitle";
    }
}

// Extract extension from URL
function getExtensionFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname.toLowerCase();

        for (const ext of subtitleExtensions) {
            if (pathname.endsWith(ext)) {
                return ext;
            }
        }
        return "";
    } catch (e) {
        return "";
    }
}

// Update badge with count of available subtitles
function updateBadge() {
    const count = detectedSubtitles.length;
    chrome.action.setBadgeText({text: count > 0 ? count.toString() : ""});
    chrome.action.setBadgeBackgroundColor({color: "#0A7DCC"});
}

function clearDetectedSubtitlesByTab(tabId) {
    detectedSubtitles = detectedSubtitles.filter(sub => sub.tabId !== tabId);
    updateBadge();
}