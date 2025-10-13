const VideoScrubber = {
    _isEnabled: false,
    _isScrubberInverted: false,
    _isMouseOverGameEvents: false,
    _boundOnWheel: null,
    _boundOnMouseDown: null,
    _boundMouseEnter: null,
    _boundMouseLeave: null,

    init: function () {
        this._boundOnWheel = this._onWheel.bind(this);
        this._boundOnMouseDown = this._onMouseDown.bind(this);
        this._boundMouseEnter = () => {
            this._isMouseOverGameEvents = true;
        };
        this._boundMouseLeave = () => {
            this._isMouseOverGameEvents = false;
        };
    },

    enable: function (isInverted) {
        if (this._isEnabled) return;
        console.log(`[Module] VideoScrubber enabling (Inverted: ${isInverted})`);
        this._isEnabled = true;
        this._isScrubberInverted = !!isInverted;

        document.addEventListener("wheel", this._boundOnWheel, {passive: false});
        document.addEventListener("mousedown", this._boundOnMouseDown);
        document.body.style.overflow = 'hidden';

        const gameEventsContainer = document.querySelector(".game-events-container");
        if (gameEventsContainer) {
            gameEventsContainer.addEventListener("mouseenter", this._boundMouseEnter);
            gameEventsContainer.addEventListener("mouseleave", this._boundMouseLeave);
        }
    },

    disable: function () {
        if (!this._isEnabled) return;
        console.log("[Module] VideoScrubber disabling");
        this._isEnabled = false;

        document.removeEventListener("wheel", this._boundOnWheel);
        document.removeEventListener("mousedown", this._boundOnMouseDown);
        document.body.style.overflow = '';

        const gameEventsContainer = document.querySelector(".game-events-container");
        if (gameEventsContainer) {
            gameEventsContainer.removeEventListener("mouseenter", this._boundMouseEnter);
            gameEventsContainer.removeEventListener("mouseleave", this._boundMouseLeave);
        }
    },

    _onWheel: function (event) {
        if (this._isMouseOverGameEvents) return;

        event.preventDefault();

        const delta = this._isScrubberInverted ? -event.deltaY : event.deltaY;
        const frameEditActive = document.querySelector("#frame-edit-controls.edit-current");

        if (frameEditActive) {
            const btnId = delta < 0 ? "f-previous-frame" : "f-next-frame";
            document.getElementById(btnId)?.click();
        } else {
            let btnId;
            if (event.shiftKey) {
                btnId = delta < 0 ? "m-1s" : "p-1s";
            } else {
                btnId = delta < 0 ? "m-1f" : "p-1f";
            }
            document.getElementById(btnId)?.click();
        }
    },

    _onMouseDown: function (event) {
        const frameEditActive = document.querySelector("#frame-edit-controls.edit-current");
        let btnId;

        if (frameEditActive) {
            if (event.button === 3) btnId = "f-previous-frame";
            else if (event.button === 4) btnId = "f-next-frame";
        } else {
            if (event.shiftKey) {
                if (event.button === 3) btnId = "m-1s";
                else if (event.button === 4) btnId = "p-1s";
            } else {
                if (event.button === 3) btnId = "m-1f";
                else if (event.button === 4) btnId = "p-1f";
            }
        }

        if (btnId) {
            event.preventDefault();
            document.getElementById(btnId)?.click();
        }
    }
};