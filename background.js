chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('https://app.sportlogiq.com/EventorApp.php')) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content_main.js']
        });
    }
});