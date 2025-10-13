function injectScript(filePath) {
    const script = document.createElement('script');
    script.setAttribute('src', chrome.runtime.getURL(filePath));
    (document.head || document.documentElement).appendChild(script);
}

async function loadAndApplySettings() {
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
        HotkeyManager.updateSettings({
            hotkeys: hotkeysObject,
            autoConfirm: !!allStorage.autoConfirmEnabled,
            carryLineSnap: !!allStorage.carryLineSnapEnabled
        });
    } catch (err) {
        console.error("[Loader] Error loading settings:", err);
    }
}

function main() {
    console.log("[Loader] Waiting for page elements...");

    const observer = new MutationObserver((mutations, obs) => {
        const svgElement = document.getElementById('Layer_1');
        const markerElement = document.getElementById('current-xy-marker');
        const rosterElement = document.getElementById('roster');

        if (svgElement && markerElement && rosterElement) {
            console.log("[Loader] All elements found. Initializing modules.");
            obs.disconnect();

            SvgVerticalSnap.init(svgElement, markerElement);
            HotkeyManager.init(SvgVerticalSnap);

            loadAndApplySettings();

            window.addEventListener('reloadSettings', loadAndApplySettings);
        }
    });

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        }, { once: true });
    }
}

injectScript('content/injected.js');
main();