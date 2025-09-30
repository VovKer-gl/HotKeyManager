
async function loadAndSendHotkeys() {
    try {
        const allStorage = await chrome.storage.sync.get(null);
        const hotkeysObject = {};
        for (const key in allStorage) {
            if (Array.isArray(allStorage[key])) {
                allStorage[key].forEach(hotkey => {
                    if (hotkey && hotkey.shortcut && hotkey.actionId) {
                        hotkeysObject[hotkey.shortcut] = hotkey.actionId;
                    }
                });
            }
        }

        // Відправляємо повідомлення в MAIN світ
        window.postMessage({
            type: "FROM_EXT_HOTKEYS_UPDATE",
            payload: hotkeysObject
        }, window.location.origin);

    } catch (err) {
        console.error('[Game Hotkeys ISOLATED] Error loading hotkeys:', err);
    }
}

chrome.storage.onChanged.addListener(loadAndSendHotkeys);

loadAndSendHotkeys();