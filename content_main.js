
if (typeof window.__myHotkeyContentJsLoaded === 'undefined') {
    window.__myHotkeyContentJsLoaded = true;

    const IGNORE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
    const hotkeyMap = new Map();

    window.addEventListener('message', (event) => {
        if (event.source !== window || event.data.type !== "FROM_EXT_HOTKEYS_UPDATE") {
            return;
        }
        hotkeyMap.clear();
        const hotkeysObject = event.data.payload;
        for (const shortcut in hotkeysObject) {
            hotkeyMap.set(shortcut, hotkeysObject[shortcut]);
        }
        console.log('[Game Hotkeys MAIN] Hotkeys updated:', hotkeyMap);
    });

    function triggerGameAction(actionId) {
        if (actionId === 'toggle-edit-mode') {
            if (typeof playerEventEditor !== 'undefined') {
                if (playerEventEditor.editMode) playerEventEditor.startExitEditMode();
                else if (playerEventEditor.getSelectedEvent()) playerEventEditor.checkIfUserCanEnterEditMode();
                else console.warn("[Game Hotkeys] Cannot enter Edit Mode: no event is selected.");
            }
            return;
        }

        const el = document.getElementById(actionId);
        if (!el) {
            console.warn(`[Game Hotkeys MAIN] Element not found: ${actionId}`);
            return;
        }

        if (el.classList.contains('toggle')) {
            const classList = el.className.baseVal.split(' ');
            const toggleClass = classList.find(c => c !== 'toggle' && c !== 'active');
            if (toggleClass && typeof currentEvent !== 'undefined' && typeof currentEvent.toggleType === 'function') {
                console.log(`[Game Hotkeys MAIN] Using internal function for toggle: '${toggleClass}'`);
                currentEvent.toggleType(toggleClass);
            } else {
                console.error(`[Game Hotkeys MAIN] Could not handle toggle: ${actionId}.`);
            }
            return;
        }

        if (el.classList.contains('flag')) {
            const classList = el.className.baseVal.split(' ');
            const toggleClass = classList.find(c => c !== 'flag' && c !== 'active');
            if (toggleClass && typeof currentEvent !== 'undefined' && typeof currentEvent.toggleType === 'function') {
                console.log(`[Game Hotkeys MAIN] Syncing state and UI for flag: '${toggleClass}'`);
                currentEvent.toggleType(toggleClass);
                const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
                el.dispatchEvent(clickEvent);
            } else {
                console.error(`[Game Hotkeys MAIN] Could not handle flag: ${actionId}.`);
            }
            return;
        }

        if (typeof playerEventModel !== 'undefined' && typeof playerEventModel.addPlayerEvent === 'function') {
            console.log(`[Game Hotkeys MAIN] Processing event with active flags: '${actionId}'`);

            const activeFlags = [];
            document.querySelectorAll('.flag.active, .toggle.active').forEach(activeEl => {
                const propsString = activeEl.getAttribute('data-event-props');
                if (propsString) {
                    const props = JSON.parse(propsString);
                    const flagName = props.flag || (activeEl.className.baseVal.split(' ').find(c => c !== 'toggle' && c !== 'flag' && c !== 'active'));
                    if (flagName) {
                        activeFlags.push(flagName);
                    }
                }
            });

            const eventPropsString = el.getAttribute('data-event-props');
            if (eventPropsString) {
                const eventProps = JSON.parse(eventPropsString);
                const eventDetails = {
                    ...eventProps,
                    flags: activeFlags
                };

                playerEventModel.addPlayerEvent(eventDetails, true);

                setTimeout(() => {
                    console.log('[Game Hotkeys MAIN] Resetting active modifiers.');
                    document.querySelectorAll('.toggle.active, .flag.active').forEach(activeEl => {
                        const classList = activeEl.className.baseVal.split(' ');
                        const toggleClass = classList.find(c => c !== 'toggle' && c !== 'flag' && c !== 'active');
                        if (toggleClass) {
                            currentEvent.toggleType(toggleClass);
                        }
                    });
                }, 100);
            } else {
                console.error(`[Game Hotkeys MAIN] Element ${actionId} does not have data-event-props.`);
            }

        } else {
            console.error(`[Game Hotkeys MAIN] 'playerEventModel.addPlayerEvent' not found!`);
        }
    }

    function formatShortcutFromEvent(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('Control');
        if (e.shiftKey) parts.push('Shift');
        if (e.altKey) parts.push('Alt');
        if (e.metaKey) parts.push('Meta');
        let primary = (e.code && e.code.startsWith('Key')) ? e.code.slice(3) : (e.code && e.code.startsWith('Digit')) ? e.code.slice(5) : e.key.length === 1 ? e.key.toUpperCase() : e.key;
        if (primary) parts.push(primary);
        return parts.join(' + ');
    }

    window.addEventListener('keydown', (event) => {
        if (event.repeat) return;
        const targetTag = event.target?.tagName || '';
        if (IGNORE_TAGS.has(targetTag) || event.target?.isContentEditable) return;

        const shortcut = formatShortcutFromEvent(event);
        if (!hotkeyMap.has(shortcut)) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        const actionId = hotkeyMap.get(shortcut);
        triggerGameAction(actionId);
    }, true);
}