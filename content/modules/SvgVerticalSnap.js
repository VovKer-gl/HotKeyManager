const SvgVerticalSnap = {
    svgElement: null,
    markerElement: null,
    isInitialized: false,
    isSnapActive: false,
    hasMouseEnteredSvg: false,
    snapLinesX: [150, 252, 201],
    lockedX: 0,
    lastMousePos: {x: 0, y: 0},
    _boundOnMouseMove: null,

    init: function (svgEl, markerEl) {
        if (this.isInitialized) return;
        this.svgElement = svgEl;
        this.markerElement = markerEl;
        this._boundOnMouseMove = this.onMouseMove.bind(this);
        this.isInitialized = true;
    },

    enable: function () {
        if (!this.isInitialized) return;
        this.svgElement.addEventListener('mousemove', this._boundOnMouseMove);
    },

    disable: function () {
        if (!this.isInitialized) return;
        this.svgElement.removeEventListener('mousemove', this._boundOnMouseMove);
        if (this.isSnapActive) {
            this.svgElement.style.cursor = 'default';
            this.isSnapActive = false;
        }
    },

    getMousePosition: function (evt) {
        const CTM = this.svgElement.getScreenCTM();
        if (!CTM) return {x: 0, y: 0};
        return {x: (evt.clientX - CTM.e) / CTM.a, y: (evt.clientY - CTM.f) / CTM.d};
    },

    findClosestLineX: function (currentX) {
        return this.snapLinesX.reduce((prev, curr) => (Math.abs(curr - currentX) < Math.abs(prev - currentX) ? curr : prev));
    },

    onMouseMove: function (event) {
        if (!this.hasMouseEnteredSvg) this.hasMouseEnteredSvg = true;
        this.lastMousePos = this.getMousePosition(event);

        if (this.isSnapActive) {
            this.markerElement.setAttribute('transform', `translate(${this.lockedX}, ${this.lastMousePos.y})`);
        }
    },

    activate: function () {
        if (!this.isInitialized || this.isSnapActive || !this.hasMouseEnteredSvg) return;

        this.isSnapActive = true;
        this.lockedX = this.findClosestLineX(this.lastMousePos.x);

        this.markerElement.style.display = '';
        this.markerElement.setAttribute('transform', `translate(${this.lockedX}, ${this.lastMousePos.y})`);
        this.svgElement.style.cursor = 'ns-resize';
    },

    deactivateAndSimulateClick: function () {
        if (!this.isInitialized || !this.isSnapActive) return;

        const svgPoint = {x: this.lockedX, y: this.lastMousePos.y};
        const CTM = this.svgElement.getScreenCTM();
        if (CTM) {
            const clientX = svgPoint.x * CTM.a + CTM.e;
            const clientY = svgPoint.y * CTM.d + CTM.f;
            this.svgElement.dispatchEvent(new MouseEvent('click', {
                bubbles: true, cancelable: true, clientX, clientY
            }));
            console.log(`[SVG Snap] Click simulated to set the point.`);
        }


        window.postMessage({
            type: "FROM_EXT_ACTION_EXECUTE",
            payload: {actionId: 'carry/nz/none/successful'}
        }, window.location.origin);
        console.log(`[SVG Snap] "Carry Line" event triggered.`);

        this.isSnapActive = false;
        this.svgElement.style.cursor = 'default';

    }
};