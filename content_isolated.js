async function loadAndSendAllSettings() {
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

        const autoConfirmEnabled = !!allStorage.autoConfirmEnabled;

        window.postMessage({
            type: "FROM_EXT_SETTINGS_UPDATE",
            payload: {
                hotkeys: hotkeysObject,
                autoConfirm: autoConfirmEnabled
            }
        }, window.location.origin);

    } catch (err) {
        console.error('[Game Hotkeys ISOLATED] Error loading settings:', err);
    }
}

chrome.storage.onChanged.addListener(loadAndSendAllSettings);

loadAndSendAllSettings();