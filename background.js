chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

    if (message.action === 'openQaReport') {
        const { qaHelperEnabled } = await chrome.storage.sync.get({ qaHelperEnabled: true });
        const { matchId, period, searchTerm } = message.data;
        const targetUrl = `https://oneapp.sportlogiq.com/games-and-eventing/games/hockey/${matchId}/qa-reports`;

        if (!qaHelperEnabled) {
            console.log("QA Helper is disabled. Opening tab without automation.");
            chrome.tabs.create({ url: targetUrl });
            return;
        }

        console.log("QA Helper is enabled. Automating actions on the new tab.");
        chrome.tabs.create({ url: targetUrl }, (tab) => {
            const listener = (tabId, changeInfo, updatedTab) => {
                if (tabId === tab.id && changeInfo.status === 'complete' && updatedTab.url.includes(targetUrl)) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'performQaActions',
                        data: { period, searchTerm }
                    });
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
        });
    }
});