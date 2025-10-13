
if (typeof window.__SLQ_INJECTED_SCRIPT === 'undefined') {
    window.__SLQ_INJECTED_SCRIPT = true;

    const originalWindowConfirm = window.confirm;

    window.addEventListener('message', (event) => {
        if (event.source !== window || !event.data.type || !event.data.type.startsWith("FROM_EXT_")) return;

        const { type, payload } = event.data;

        switch (type) {
            case "FROM_EXT_ACTION_EXECUTE":
                if (payload && payload.actionId && typeof triggerGameAction === 'function') {
                    triggerGameAction(payload.actionId);
                }
                break;
            case "FROM_EXT_ACTION_AUTOCONFIRM":
                if (payload.enabled) {
                    if (window.confirm === originalWindowConfirm) {
                        window.confirm = () => true;
                    }
                } else {
                    if (window.confirm !== originalWindowConfirm) {
                        window.confirm = originalWindowConfirm;
                    }
                }
                break;
            case "FROM_EXT_FRAME_FIX":
                if (payload && payload.eventId && payload.direction) {
                    performFrameFix(payload.eventId, payload.direction);
                }
                break;
        }
    });

    // Існуюча функція triggerGameAction
    const triggerGameAction = function(actionId) {
        if (actionId === 'toggle-edit-mode') {
            if (typeof playerEventEditor !== 'undefined') {
                if (playerEventEditor.editMode) playerEventEditor.startExitEditMode();
                else if (playerEventEditor.getSelectedEvent()) playerEventEditor.checkIfUserCanEnterEditMode();
            } return;
        }
        const el = document.getElementById(actionId);
        if (!el) return;
        if (el.classList.contains('toggle')) {
            const classList = el.className.baseVal.split(' ');
            const toggleClass = classList.find(c => c !== 'toggle' && c !== 'active');
            if (toggleClass && typeof currentEvent !== 'undefined' && typeof currentEvent.toggleType === 'function') {
                currentEvent.toggleType(toggleClass);
            }
            return;
        }
        if (el.classList.contains('flag')) {
            const classList = el.className.baseVal.split(' ');
            const toggleClass = classList.find(c => c !== 'flag' && c !== 'active');
            if (toggleClass && typeof currentEvent !== 'undefined' && typeof currentEvent.toggleType === 'function') {
                currentEvent.toggleType(toggleClass);
                el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            }
            return;
        }
        if (typeof playerEventModel !== 'undefined' && typeof playerEventModel.addPlayerEvent === 'function') {
            const activeFlags = [];
            document.querySelectorAll('.flag.active, .toggle.active').forEach(activeEl => {
                const propsString = activeEl.getAttribute('data-event-props');
                if (propsString) {
                    const props = JSON.parse(propsString);
                    const flagName = props.flag || (activeEl.className.baseVal.split(' ').find(c => c !== 'toggle' && c !== 'flag' && c !== 'active'));
                    if (flagName) activeFlags.push(flagName);
                }
            });
            const eventPropsString = el.getAttribute('data-event-props');
            if (eventPropsString) {
                const eventProps = JSON.parse(eventPropsString);
                playerEventModel.addPlayerEvent({ ...eventProps, flags: activeFlags }, true);
                setTimeout(() => {
                    document.querySelectorAll('.toggle.active, .flag.active').forEach(activeEl => {
                        const classList = activeEl.className.baseVal.split(' ');
                        const toggleClass = classList.find(c => c !== 'toggle' && c !== 'flag' && c !== 'active');
                        if (toggleClass) currentEvent.toggleType(toggleClass);
                    });
                }, 100);
            }
        }
    };

    function waitFor(conditionFn, callbackFn, timeout = 3000) {
        const startTime = Date.now();
        const intervalId = setInterval(() => {
            if (conditionFn()) {
                clearInterval(intervalId);
                callbackFn();
            } else if (Date.now() - startTime > timeout) {
                clearInterval(intervalId);
            }
        }, 100);
    }

    function simulateRealClick(element) {
        if (!element) return;
        const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
        element.dispatchEvent(clickEvent);
    }


    function performFrameFix(eventId, direction) {
        const row = document.getElementById(eventId);
        if (!row) {
            console.error(`[Injected] FrameFix: Row with id "${eventId}" not found.`);
            return;
        }

        row.click();

        setTimeout(() => {
            if (typeof playerEventEditor === 'undefined' || !playerEventEditor.checkIfUserCanEnterEditMode) {
                return;
            }

            playerEventEditor.checkIfUserCanEnterEditMode();

            waitFor(() => document.querySelector('div#frame-edit-controls.edit-current'), () => {
                const timecodeSpan = document.getElementById('current-frame');
                const originalTimecode = timecodeSpan ? timecodeSpan.textContent : '';

                setTimeout(() => {
                    const buttonId = direction === 'next' ? 'f-next-frame' : 'f-previous-frame';
                    const frameButton = document.getElementById(buttonId);
                    if (!frameButton) return;

                    simulateRealClick(frameButton);

                    waitFor(() => {
                        const currentTimecode = timecodeSpan ? timecodeSpan.textContent : '';
                        return currentTimecode && currentTimecode !== originalTimecode;
                    }, () => {
                        if (playerEventEditor.editData) {
                            playerEventEditor.editData.frame = videoFrameTracker.get();
                        } else {
                            return;
                        }

                        setTimeout(() => {
                            if (typeof playerEventEditor.startExitEditMode === 'function') {
                                playerEventEditor.startExitEditMode();
                                waitFor(() => playerEventEditor && playerEventEditor.editMode === false, () => {}, 3000);
                            }
                        }, 150);
                    }, 3000);
                }, 200);
            }, 3000);
        }, 50);
    }
}