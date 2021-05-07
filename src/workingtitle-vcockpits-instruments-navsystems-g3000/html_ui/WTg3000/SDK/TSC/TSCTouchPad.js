class WT_TSCTouchPad extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isMouseDown = false;
        this._tempVector = new WT_GVector2(0, 0);
        this._initialMousePos = new WT_GVector2(0, 0);
        this._lastMousePos = new WT_GVector2(0, 0);
        this._currentMousePos = new WT_GVector2(0, 0);
        this._lastDragTime = 0;

        /**
         * @type {((event:WT_TSCTouchPadEvent) => void)[]}
         */
        this._listeners = [];
    }

    _getTemplate() {
        return WT_TSCTouchPad.TEMPLATE;
    }

    _initListeners() {
        this.addEventListener("mousemove", this._onMouseMove.bind(this));
        this.addEventListener("mousedown", this._onDragBegin.bind(this));
        this.addEventListener("mouseup", this._onDragEnd.bind(this));
        this.addEventListener("mouseleave", this._onDragEnd.bind(this));
    }

    connectedCallback() {
        this._initListeners();
    }

    /**
     *
     * @param {WT_TSCTouchPadEvent} event
     */
    _notifyTouchListeners(event) {
        this._listeners.forEach(listener => listener(event));
    }

    /**
     *
     * @param {MouseEvent} event
     */
    _onMouseMove(event) {
        if (this._isMouseDown) {
            let dt = event.timeStamp - this._lastDragTime;
            let delta = this._tempVector.set(event.clientX, event.clientY).subtract(this._lastMousePos);
            this._currentMousePos.set(event.clientX, event.clientY);
            this._notifyTouchListeners({
                touchPad: this,
                initialPos: this._initialMousePos.readonly(),
                currentPos: this._currentMousePos.readonly(),
                deltaPos: delta.readonly(),
                dt: dt
            });
            this._lastMousePos.set(event.clientX, event.clientY);
            this._lastDragTime = event.timeStamp;
        }
    }

    /**
     *
     * @param {MouseEvent} event
     */
    _onDragBegin(event) {
        this._isMouseDown = true;
        this._initialMousePos.set(event.clientX, event.clientY);
        this._lastMousePos.set(event.clientX, event.clientY);
        this._lastDragTime = event.timeStamp;
    }

    _onDragEnd() {
        this._isMouseDown = false;
    }

    /**
     * Adds a listener that responds to touch events. Currently only drag events are supported.
     * @param {(event:WT_TSCTouchPadEvent) => void} listener - the listener to add.
     */
    addTouchListener(listener) {
        this._listeners.push(listener);
    }

    /**
     * Removes a previously added touch listener.
     * @param {(event:WT_TSCTouchPadEvent) => void} listener - the listener to remove.
     */
    removeTouchListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    /**
     * Resets this touchpad.
     */
    reset() {
        this._isMouseDown = false;
    }
}
WT_TSCTouchPad.NAME = "wt-tsc-touchpad";
WT_TSCTouchPad.TEMPLATE = document.createElement("template");
WT_TSCTouchPad.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
        }
    </style>
`;

customElements.define(WT_TSCTouchPad.NAME, WT_TSCTouchPad);

/**
 * @typedef WT_TSCTouchPadEvent
 * @property {WT_TSCTouchPad} touchPad - the touchpad that fired the event.
 * @property {WT_GVector2ReadOnly} initialPos - the initial point of contact; only defined for drag events.
 * @property {WT_GVector2ReadOnly} currentPos - the current point of contact.
 * @property {WT_GVector2ReadOnly} deltaPos - the change in position of the contact point since the last update; only
 *                                         defined for drag events.
 * @property {Number} dt - the change in time since the last update; only defined for drag events.
 */