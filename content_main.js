
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
            console.log(`[Game Hotkeys MAIN] Dispatching native MouseEvent for toggle: ${actionId}`);
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
            el.querySelector('path')?.dispatchEvent(clickEvent);
            return;
        }

        if (el.classList.contains('flag')) {
            console.log(`[Game Hotkeys MAIN] Manually toggling UI for flag: ${actionId}`);
            const isAlreadyActive = el.classList.contains('active');
            document.querySelectorAll('.flag.active').forEach(activeEl => {
                activeEl.classList.remove('active');
            });
            if (!isAlreadyActive) {
                el.classList.add('active');
            }
            return;
        }

        if (typeof playerEventModel !== 'undefined' && typeof playerEventModel.addPlayerEvent === 'function') {
            console.log(`[Game Hotkeys MAIN] Processing event with active flags: '${actionId}'`);

            const activeFlags = [];
            document.querySelectorAll('.flag.active').forEach(activeEl => {
                const props = JSON.parse(activeEl.getAttribute('data-event-props'));
                if (props && props.flag) {
                    activeFlags.push(props.flag);
                }
            });

            const eventProps = JSON.parse(el.getAttribute('data-event-props'));
            const eventDetails = {
                ...eventProps,
                flags: activeFlags
            };

            playerEventModel.addPlayerEvent(eventDetails, true);


            setTimeout(() => {
                console.log('[Game Hotkeys MAIN] Resetting active modifiers.');
                document.querySelectorAll('.flag.active, .toggle.active').forEach(activeEl => {
                    if (activeEl.classList.contains('toggle') && typeof currentEvent !== 'undefined') {
                        const classList = activeEl.className.baseVal.split(' ');
                        const toggleClass = classList.find(c => c !== 'toggle' && c !== 'active');
                        if (toggleClass) {
                            currentEvent.toggleType(toggleClass);
                        }
                    }
                    activeEl.classList.remove('active');
                });
            }, 100);

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