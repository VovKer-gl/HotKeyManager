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

        const currentSettings = {
            hotkeys: hotkeysObject,
            autoConfirm: !!allStorage.autoConfirmEnabled,
            carryLineSnap: !!allStorage.carryLineSnapEnabled,
            frameFixerEnabled: !!allStorage.frameFixerEnabled,
            videoScrubberEnabled: !!allStorage.videoScrubberEnabled,
            invertScrubberEnabled: !!allStorage.invertScrubberEnabled,
            qaHelperEnabled: allStorage.qaHelperEnabled !== false
        };

        HotkeyManager.updateSettings(currentSettings);
        QaHelper.updateSettings(currentSettings);

    } catch (err) {
        console.error("[Loader] Error loading settings:", err);
    }
}

function main() {
    console.log("[Loader] Waiting for page elements...");
    let modulesInitialized = false;

    const observer = new MutationObserver(() => {
        if (modulesInitialized) {
            QaHelper.addQaButtons();
            return;
        }

        const allElementsReady =
            document.getElementById('Layer_1') &&
            document.getElementById('current-xy-marker') &&
            document.querySelector('#game-events tbody');

        if (allElementsReady) {
            modulesInitialized = true;
            console.log("%c[Loader] All core modules ready. Initializing...", 'color: green; font-weight: bold;');

            SvgVerticalSnap.init(document.getElementById('Layer_1'), document.getElementById('current-xy-marker'));
            VideoScrubber.init();
            QaHelper.init();
            HotkeyManager.init(SvgVerticalSnap);
            FrameConflictDetector.init();

            loadAndApplySettings();

            chrome.storage.onChanged.addListener(loadAndApplySettings);

            console.log('[Loader] Initialization complete.');
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