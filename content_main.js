if (typeof window.__myHotkeyContentJsLoaded === 'undefined') {
    window.__myHotkeyContentJsLoaded = true;

    // ===== ЧАСТИНА 1: ІСНУЮЧА ЛОГІКА =====
    const originalWindowConfirm = window.confirm;

    function applyAutoConfirm(enabled) {
        if (enabled) {
            if (window.confirm !== originalWindowConfirm) return;
            window.confirm = (message) => true;
        } else {
            if (window.confirm === originalWindowConfirm) return;
            window.confirm = originalWindowConfirm;
        }
    }

    const IGNORE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
    const hotkeyMap = new Map();
    let isRosterMenuKeyPressed = false; // Змінна для відстеження стану "хоткей меню затиснутий"

    window.addEventListener('message', (event) => {
        if (event.source !== window || !event.data.type || !event.data.type.startsWith("FROM_EXT_")) return;
        if (event.data.type === "FROM_EXT_SETTINGS_UPDATE") {
            const settings = event.data.payload;
            hotkeyMap.clear();
            if (settings.hotkeys) {
                for (const shortcut in settings.hotkeys) hotkeyMap.set(shortcut, settings.hotkeys[shortcut]);
            }
            if (typeof settings.autoConfirm !== 'undefined') applyAutoConfirm(settings.autoConfirm);
        }
    });

    let lastMousePosition = { x: 0, y: 0 };
    window.addEventListener('mousemove', e => {
        lastMousePosition = { x: e.clientX, y: e.clientY };
    }, true);

    // ===== ЧАСТИНА 2: ОНОВЛЕНА ЛОГІКА ДЛЯ КРУГОВОГО МЕНЮ =====
    function injectAdvancedMenuCSS() {
        if (document.getElementById('radial-roster-styles-advanced')) return;
        const style = document.createElement('style');
        style.id = 'radial-roster-styles-advanced';
        style.textContent = `
            #radial-roster-container { position: fixed; display: none; z-index: 99999; width: 320px; height: 320px; transform: translate(-50%, -50%); filter: drop-shadow(0px 5px 15px rgba(0,0,0,0.5)); }
            .roster-slice { fill: rgba(0, 0, 0, 0.7); stroke: #fff; stroke-width: 1.5; transition: fill 0.2s ease; cursor: pointer; }
            .roster-slice:hover, .roster-slice.highlighted { fill: #667eea; } /* Додано .highlighted */
            .roster-label { fill: #fff; font-size: 16px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: bold; text-anchor: middle; pointer-events: none; }
            #roster-close-btn { cursor: pointer; fill: rgba(0, 0, 0, 0.7); }
            #roster-close-btn:hover { fill: #dc3545; }
            #roster-close-icon { fill: #fff; font-size: 24px; pointer-events: none; font-family: Arial, sans-serif; font-weight: bold; }
            .roster-slice.goalie { fill: rgba(218, 165, 32, 0.8); } .roster-slice.goalie:hover, .roster-slice.goalie.highlighted { fill: #DAA520; }
            .roster-slice.defense { fill: rgba(30, 144, 255, 0.8); } .roster-slice.defense:hover, .roster-slice.defense.highlighted { fill: #1E90FF; }
            .roster-slice.forward { fill: rgba(220, 20, 60, 0.8); } .roster-slice.forward:hover, .roster-slice.forward.highlighted { fill: #DC143C; }
        `;
        document.head.appendChild(style);
    }

    const AdvancedRosterMenu = {
        container: null,

        init: function() {
            if (this.container) return;
            injectAdvancedMenuCSS();
            this.container = document.createElement('div');
            this.container.id = 'radial-roster-container';
            document.body.appendChild(this.container);
            document.addEventListener('keydown', (e) => { if (this.isVisible() && e.key === 'Escape') this.hide(); }, true);
        },

        isVisible: () => document.getElementById('radial-roster-container')?.style.display === 'block',

        populate: function() {
            const rosterListItems = document.querySelectorAll('#roster ul li');
            const players = [];
            let currentPosition = '';
            rosterListItems.forEach(li => {
                if (li.classList.contains('posDivider')) currentPosition = li.textContent.trim();
                else {
                    const link = li.querySelector('a');
                    if (link) players.push({ id: link.id, number: link.textContent, position: currentPosition });
                }
            });

            if (players.length === 0) return;
            const size = 320, center = size / 2, radius = size / 2, innerRadius = 40;
            const angleStep = 360 / players.length;
            let svgHtml = `<svg width="${size}" height="${size}" viewbox="0 0 ${size} ${size}">`;

            const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
                const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
                return { x: centerX + (radius * Math.cos(angleInRadians)), y: centerY + (radius * Math.sin(angleInRadians)) };
            };
            const describeArc = (x, y, radius, innerRadius, startAngle, endAngle) => {
                const start = polarToCartesian(x, y, radius, endAngle), end = polarToCartesian(x, y, radius, startAngle);
                const innerStart = polarToCartesian(x, y, innerRadius, endAngle), innerEnd = polarToCartesian(x, y, innerRadius, startAngle);
                const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
                return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y} L ${start.x} ${start.y} Z`;
            };
            const getPositionClass = (pos) => ({ 'G': 'goalie', 'D': 'defense', 'F': 'forward' })[pos.toUpperCase()] || '';

            players.forEach((player, i) => {
                const startAngle = i * angleStep, endAngle = startAngle + angleStep;
                const posClass = getPositionClass(player.position);
                svgHtml += `<path class="roster-slice ${posClass}" d="${describeArc(center, center, radius, innerRadius, startAngle, endAngle)}" data-target-id="${player.id}" />`;
                const textAngle = startAngle + angleStep / 2;
                const textPos = polarToCartesian(center, center, innerRadius + (radius - innerRadius) / 2, textAngle);
                svgHtml += `<text class="roster-label" x="${textPos.x}" y="${textPos.y}" dy=".3em">${player.number}</text>`;
            });
            svgHtml += `<circle id="roster-close-btn" cx="${center}" cy="${center}" r="${innerRadius - 5}" />`;
            svgHtml += `<text id="roster-close-icon" x="${center}" y="${center}" text-anchor="middle" dy=".3em">×</text>`;
            svgHtml += `</svg>`;
            this.container.innerHTML = svgHtml;
            this.attachEventListeners();
        },

        attachEventListeners: function() {
            this.container.querySelectorAll('.roster-slice').forEach(slice => {
                slice.addEventListener('mouseover', (e) => e.currentTarget.classList.add('highlighted'));
                slice.addEventListener('mouseout', (e) => e.currentTarget.classList.remove('highlighted'));
            });
            this.container.querySelector('#roster-close-btn').addEventListener('click', () => this.hide());
        },

        show: function(x, y) { this.init(); this.populate(); this.container.style.left = `${x}px`; this.container.style.top = `${y}px`; this.container.style.display = 'block'; },
        hide: function() { if (this.container) this.container.style.display = 'none'; },

        selectHighlightedAndHide: function() {
            const highlighted = this.container.querySelector('.roster-slice.highlighted');
            if (highlighted) {
                document.getElementById(highlighted.dataset.targetId)?.click();
            }
            this.hide();
        }
    };


    function triggerGameAction(actionId) {
        if (actionId === 'toggle-edit-mode') {
            if (typeof playerEventEditor !== 'undefined') {
                if (playerEventEditor.editMode) playerEventEditor.startExitEditMode();
                else if (playerEventEditor.getSelectedEvent()) playerEventEditor.checkIfUserCanEnterEditMode();
            } return;
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
        if (e.ctrlKey) parts.push('Control'); if (e.shiftKey) parts.push('Shift');
        if (e.altKey) parts.push('Alt'); if (e.metaKey) parts.push('Meta');
        let primary = (e.code && e.code.startsWith('Key')) ? e.code.slice(3) : (e.code && e.code.startsWith('Digit')) ? e.code.slice(5) : e.key.length === 1 ? e.key.toUpperCase() : e.key;
        if (primary) parts.push(primary);
        return parts.join(' + ');
    }

    // ===== ЧАСТИНА 4: ОНОВЛЕНІ ОБРОБНИКИ НАТИСКАННЯ КЛАВІШ =====
    window.addEventListener('keydown', (event) => {
        if (event.repeat) return;
        const targetTag = event.target?.tagName || '';
        if (IGNORE_TAGS.has(targetTag) || event.target?.isContentEditable) return;
        const shortcut = formatShortcutFromEvent(event);
        if (!hotkeyMap.has(shortcut)) return;

        event.preventDefault(); event.stopImmediatePropagation();
        const actionId = hotkeyMap.get(shortcut);

        // **НОВА ЛОГІКА ДЛЯ KEYDOWN**
        if (actionId === 'toggle-roster-menu') {
            if (!AdvancedRosterMenu.isVisible()) {
                isRosterMenuKeyPressed = true;
                AdvancedRosterMenu.show(lastMousePosition.x, lastMousePosition.y);
            }
        } else {
            // Стара логіка для всіх інших хоткеїв
            triggerGameAction(actionId);
        }
    }, true);

    window.addEventListener('keyup', (event) => {
        // **НОВА ЛОГІКА ДЛЯ KEYUP**
        if (!isRosterMenuKeyPressed) return;

        const shortcut = formatShortcutFromEvent(event);
        const actionId = hotkeyMap.get(shortcut);

        if (actionId === 'toggle-roster-menu') {
            event.preventDefault(); event.stopImmediatePropagation();
            AdvancedRosterMenu.selectHighlightedAndHide();
            isRosterMenuKeyPressed = false;
        }
    }, true);
}