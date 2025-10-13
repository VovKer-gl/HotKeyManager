const HotkeyManager = {
    snapManager: null,
    hotkeyMap: new Map(),
    activeHotkeyActionId: null,
    settings: {},
    _isSnapEnabled: false,
    _isFrameFixerEnabled: false,
    _isVideoScrubberEnabled: false,

    CARRY_LINE_ACTION_ID: 'carry/nz/none/successful',

    init: function (snapManager) {
        console.log("[Module] HotkeyManager initializing...");
        this.snapManager = snapManager;

        chrome.storage.onChanged.addListener(() => {
            console.log("[HotkeyManager] Storage changed. Reloading settings...");
            window.dispatchEvent(new CustomEvent('reloadSettings'));
        });

        window.addEventListener('keydown', this.onKeyDown.bind(this), true);
        window.addEventListener('keyup', this.onKeyUp.bind(this), true);
    },

    updateSettings: function (payload) {
        console.log("[HotkeyManager] Applying settings:", payload);
        this.settings = payload;
        this.hotkeyMap.clear();
        if (payload.hotkeys) {
            for (const shortcut in payload.hotkeys) {
                this.hotkeyMap.set(shortcut, payload.hotkeys[shortcut]);
            }
        }

        window.postMessage({
            type: "FROM_EXT_ACTION_AUTOCONFIRM",
            payload: {enabled: !!this.settings.autoConfirm}
        }, window.location.origin);

        if (this.settings.carryLineSnap && !this._isSnapEnabled) {
            this.snapManager.enable();
            this._isSnapEnabled = true;
        } else if (!this.settings.carryLineSnap && this._isSnapEnabled) {
            this.snapManager.disable();
            this._isSnapEnabled = false;
        }

        if (this.settings.frameFixerEnabled && !this._isFrameFixerEnabled) {
            FrameFixer.enable();
            this._isFrameFixerEnabled = true;
        } else if (!this.settings.frameFixerEnabled && this._isFrameFixerEnabled) {
            FrameFixer.disable();
            this._isFrameFixerEnabled = false;
        }

        if (this.settings.videoScrubberEnabled && !this._isVideoScrubberEnabled) {
            VideoScrubber.enable(this.settings.invertScrubberEnabled);
            this._isVideoScrubberEnabled = true;
        } else if (!this.settings.videoScrubberEnabled && this._isVideoScrubberEnabled) {
            VideoScrubber.disable();
            this._isVideoScrubberEnabled = false;
        } else if (this.settings.videoScrubberEnabled && this._isVideoScrubberEnabled) {
            VideoScrubber.disable();
            VideoScrubber.enable(this.settings.invertScrubberEnabled);
        }
    },

    formatShortcutFromEvent: function (e) {
        const parts = [];
        if (e.ctrlKey) parts.push('Control');
        if (e.shiftKey) parts.push('Shift');
        if (e.altKey) parts.push('Alt');
        if (e.metaKey) parts.push('Meta');
        let primary = (e.code && e.code.startsWith('Key')) ? e.code.slice(3) : (e.code && e.code.startsWith('Digit')) ? e.code.slice(5) : e.key.length === 1 ? e.key.toUpperCase() : e.key;
        if (primary && !parts.includes(primary)) parts.push(primary);
        return parts.join(' + ');
    },

    onKeyDown: function (event) {
        if (event.repeat || this.activeHotkeyActionId) return;
        const target = event.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        const shortcut = this.formatShortcutFromEvent(event);
        if (!this.hotkeyMap.has(shortcut)) return;

        const actionId = this.hotkeyMap.get(shortcut);

        if (actionId === this.CARRY_LINE_ACTION_ID && this.settings.carryLineSnap) {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.activeHotkeyActionId = actionId;
            this.snapManager.activate();
        } else {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.postMessage({type: "FROM_EXT_ACTION_EXECUTE", payload: {actionId}}, window.location.origin);
        }
    },

    onKeyUp: function (event) {
        if (!this.activeHotkeyActionId) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        if (this.activeHotkeyActionId === this.CARRY_LINE_ACTION_ID) {
            if (this.settings.carryLineSnap) {
                this.snapManager.deactivateAndSimulateClick();
            }
        }

        this.activeHotkeyActionId = null;
    }
};