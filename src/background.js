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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "clearSubtitles") {
        detectedSubtitles = [];
        updateBadge();
        sendResponse({success: true});
    } else if (request.action === "removeSubtitle") {
        detectedSubtitles = detectedSubtitles.filter(sub => sub.url !== request.url);
        updateBadge();
        sendResponse({success: true});
    } else if (request.action === "getSubtitles") {
        sendResponse({subtitles: detectedSubtitles});
    }
    return true; // Keep message channel open for async response
});

// Listen for web requests that might be subtitle files
chrome.webRequest.onCompleted.addListener(
    (details) => {
        // Check if the URL path contains a subtitle extension
        if (details.tabId && details.url && (details.statusCode >= 200 && details.statusCode <= 299)) {
            const pathname = getPathname(details.url);
            const extension = getExtension(pathname);

            // Store unique subtitle URLs
            if (extension && !detectedSubtitles.some(sub => sub.url === details.url)) {
                detectedSubtitles.push({
                    tabId: details.tabId,
                    url: details.url,
                    fileName: getFileName(pathname),
                    extension: extension,
                    timestamp: Date.now()
                });

                // Update the badge to show number of available subtitles
                updateBadge();
            }
        }
    },
    {urls: ["http://*/*", "https://*/*"]}
);

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

// Optimized pathname extraction without URL object
function getPathname(url) {
    let end = url.length;

    const hash = url.indexOf('#');
    if (hash !== -1) {
        end = hash;
    }

    const query = url.indexOf('?');
    if (query !== -1 && query < end) {
        end = query;
    }

    const schemeEnd = url.indexOf('://');
    const authorityStart = schemeEnd === -1 ? 0 : schemeEnd + 3;

    const pathStart = url.indexOf('/', authorityStart);
    if (pathStart === -1 || pathStart >= end) {
        return "/";
    }

    return url.slice(pathStart, end);
}

function getFileName(pathname) {
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];

    try {
        return decodeURIComponent(lastSegment) || "subtitle";
    } catch (e) {
        return lastSegment || "subtitle";
    }
}

function getExtension(pathname) {
    const lowerPath = pathname.toLowerCase();

    for (const ext of subtitleExtensions) {
        if (lowerPath.endsWith(ext)) {
            return ext;
        }
    }

    return "";
}

// Update badge with count of available subtitles
function updateBadge() {
    const count = detectedSubtitles.length;
    chrome.action.setBadgeText({text: count > 0 ? count.toString() : ""});
    chrome.action.setBadgeBackgroundColor({color: "#2a1a00"});
}

function clearDetectedSubtitlesByTab(tabId) {
    detectedSubtitles = detectedSubtitles.filter(sub => sub.tabId !== tabId);
    updateBadge();
}