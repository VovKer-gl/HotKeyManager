// content/modules/HotkeyManager.js (Версія 3.1 - Спрощена логіка)

const HotkeyManager = {
    snapManager: null,
    rosterManager: null,
    hotkeyMap: new Map(),
    activeHotkeyActionId: null,
    settings: {},
    _isSnapEnabled: false,

    // ID нашого "особливого" хоткею
    CARRY_LINE_ACTION_ID: 'carry/nz/none/successful',

    init: function(snapManager, rosterManager) {
        this.snapManager = snapManager;
        this.rosterManager = rosterManager;

        chrome.storage.onChanged.addListener(() => {
            window.dispatchEvent(new CustomEvent('reloadSettings'));
        });

        window.addEventListener('keydown', this.onKeyDown.bind(this), true);
        window.addEventListener('keyup', this.onKeyUp.bind(this), true);
    },

    updateSettings: function(payload) {
        this.settings = payload;
        this.hotkeyMap.clear();
        if (payload.hotkeys) {
            for (const shortcut in payload.hotkeys) {
                this.hotkeyMap.set(shortcut, payload.hotkeys[shortcut]);
            }
        }

        window.postMessage({
            type: "FROM_EXT_ACTION_AUTOCONFIRM",
            payload: { enabled: !!this.settings.autoConfirm }
        }, window.location.origin);

        if (this.settings.carryLineSnap && !this._isSnapEnabled) {
            this.snapManager.enable();
            this._isSnapEnabled = true;
        } else if (!this.settings.carryLineSnap && this._isSnapEnabled) {
            this.snapManager.disable();
            this._isSnapEnabled = false;
        }
    },

    formatShortcutFromEvent: function(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('Control');
        if (e.shiftKey) parts.push('Shift');
        if (e.altKey) parts.push('Alt');
        if (e.metaKey) parts.push('Meta');
        let primary = (e.code && e.code.startsWith('Key')) ? e.code.slice(3) : (e.code && e.code.startsWith('Digit')) ? e.code.slice(5) : e.key.length === 1 ? e.key.toUpperCase() : e.key;
        if (primary && !parts.includes(primary)) parts.push(primary);
        return parts.join(' + ');
    },

    onKeyDown: function(event) {
        if (event.repeat || this.activeHotkeyActionId) return;
        const target = event.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        const shortcut = this.formatShortcutFromEvent(event);
        if (!this.hotkeyMap.has(shortcut)) return;

        const actionId = this.hotkeyMap.get(shortcut);

        // --- НОВА СПРОЩЕНА ЛОГІКА ---
        // Перевіряємо, чи це хоткей "Line Carry" І чи увімкнений тумблер
        if (actionId === this.CARRY_LINE_ACTION_ID && this.settings.carryLineSnap) {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.activeHotkeyActionId = actionId; // Запам'ятовуємо для keyup
            this.snapManager.activate(); // Активуємо режим прив'язки
            return; // Виходимо, щоб не спрацювала інша логіка
        }

        // Якщо це будь-який інший хоткей (або тумблер вимкнений)
        event.preventDefault();
        event.stopImmediatePropagation();

        // Якщо це меню, воно теж вимагає утримання
        if (actionId === 'toggle-roster-menu') {
            this.activeHotkeyActionId = actionId;
            this.rosterManager.show(event.clientX, event.clientY);
        } else {
            // Всі інші - миттєві
            window.postMessage({ type: "FROM_EXT_ACTION_EXECUTE", payload: { actionId } }, window.location.origin);
        }
    },

    onKeyUp: function(event) {
        if (!this.activeHotkeyActionId) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        // Виконуємо дію, що відповідає збереженому activeHotkeyActionId
        switch (this.activeHotkeyActionId) {
            case this.CARRY_LINE_ACTION_ID:
                if (this.settings.carryLineSnap) {
                    this.snapManager.deactivateAndSimulateClick();
                }
                break;
            case 'toggle-roster-menu':
                this.rosterManager.selectHighlightedAndHide();
                break;
        }

        this.activeHotkeyActionId = null;
    }
};