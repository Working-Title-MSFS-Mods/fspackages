/**
 * A layer with one or more circular rings with attached labels. Labels are always drawn on top of any rings they overlap.
 */
class WT_MapViewLabeledRingLayer extends WT_MapViewMultiLayer {
    constructor(className, configName) {
        super(className, configName);

        this._rings = [];
        this._bounds = {left: 0, top: 0, width: 0, height: 0};
    }

    /**
     * @typedef {Object} WT_MapViewLabeledRingEntry
     * @property {HTMLCanvasElement} canvas - the canvas element to which the ring is drawn.
     * @property {WT_MapViewLabeledRing} ring - the labeled ring object.
     * @property {{top:Number, left:Number, width:Number, height:Number}} lastDrawn - the bounds for the last drawn area on the canvas.
     */

    /**
     * @readonly
     * @property {WT_MapViewLabeledRingEntry[]} rings - an array of labeled ring entries added to this layer. Eacn entry contains the
     *                                                  following properties:
     *                                                  * canvas - the canvas element to which the ring is drawn.
     *                                                  * ring - the labeled ring object.
     *                                                  * lastDrawn - the bounds for the last drawn area on the canvas.
     * @type {WT_MapViewLabeledRingEntry[]}
     */
    get rings() {
        return this._rings;
    }

    /**
     * @readonly
     * @property {HTMLDivElement} ringContainer - the parent HTML element of all rings.
     * @type {HTMLDivElement}
     */
    get ringContainer() {
        return this._ringContainer;
    }

    /**
     * @readonly
     * @property {HTMLDivElement} labelContainer - the parent HTML element of all labels.
     * @type {HTMLDivElement}
     */
    get labelContainer() {
        return this._labelContainer;
    }

    _createHTMLElement() {
        let topLevel = super._createHTMLElement();

        this._ringContainer = document.createElement("div");
        this._ringContainer.style.position = "absolute";
        this._ringContainer.style.width = "100%";
        this._ringContainer.style.height = "100%";
        this._ringContainer.style.zIndex = 1;
        this._labelContainer = document.createElement("div");
        this._labelContainer.style.position = "absolute";
        this._labelContainer.style.width = "100%";
        this._labelContainer.style.height = "100%";
        this._labelContainer.style.zIndex = 2;

        topLevel.appendChild(this._ringContainer);
        topLevel.appendChild(this._labelContainer);

        return topLevel;
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateBounds(state) {
        this._bounds = {left: 0, top: 0, width: state.projection.viewWidth, height: state.projection.viewHeight};
    }

    /**
     * @param {WT_MapViewState} state
     */
    onViewSizeChanged(state) {
        super.onViewSizeChanged(state);
        this._updateBounds(state);
    }

    /**
     * Adds a labeled ring to this layer. Once added, rings form a stack, with each ring always drawn on top of rings added before it.
     * @param {WT_MapViewLabeledRing} labeledRing - the labeled ring to add.
     */
    addRing(labeledRing) {
        let entry = {
            canvas: new WT_MapViewCanvas(false, true),
            ring: labeledRing,
            lastDrawn: {left: 0, top: 0, width: 0, height: 0}
        }
        this._rings.push(entry);
        let label = labeledRing.label;
        if (label) {
            this.labelContainer.appendChild(label.htmlElement);
        }
        this.addSubLayer(entry.canvas, this.ringContainer);
    }

    /**
     * Removes a labeled ring from this layer.
     * @param {WT_MapViewLabeledRing} labeledRing - the labeled ring to remove.
     */
    removeRing(labeledRing) {
        let index = this._rings.findIndex(entry => entry.ring === labeledRing);
        if (index >= 0) {
            let removed = this._rings[index];
            this._rings.splice(index, 1);
            this.removeSubLayer(removed.canvas);
            let label = labeledRing.label;
            if (label && label.htmlElement.parentNode === this.labelContainer) {
                this.labelContainer.removeChild(label.htmlElement);
            }
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        for (let i = 0; i < this.rings.length; i++) {
            let entry = this.rings[i];
            entry.ring.onUpdate(state);
            let toDraw = entry.ring.drawRing(state, this._bounds);
            if (toDraw.refresh) {
                entry.canvas.context.clearRect(entry.lastDrawn.left, entry.lastDrawn.top, entry.lastDrawn.width, entry.lastDrawn.height);
                if (toDraw.copy) {
                    let drawn = {
                        left: this._bounds.left + toDraw.bounds.left,
                        top: this._bounds.top + toDraw.bounds.top,
                        width: toDraw.bounds.width,
                        height: toDraw.bounds.height
                    };
                    entry.canvas.context.drawImage(toDraw.image, toDraw.bounds.left, toDraw.bounds.top, toDraw.bounds.width, toDraw.bounds.height, drawn.left, drawn.top, drawn.width, drawn.height);
                    entry.lastDrawn = drawn;
                }
            }
            entry.ring.drawLabel(state);
        }
    }
}

/**
 * A circular ring with an optional attached label.
 */
class WT_MapViewLabeledRing {
    /**
     * @param {WT_MapViewRing} [ring] - the ring object for the new labeled ring. If no ring is specified, the ring will be created with a default
     *                                  WT_MapViewRing object.
     * @param {WT_MapViewRingLabel} [label] - the label object for the new labeled ring. If no label is specified, the ring will be created without a label.
     */
    constructor(ring = new WT_MapViewRing(), label = null) {
        this._optsManager = new WT_OptionsManager(this, WT_MapViewLabeledRing.OPTIONS_DEF);

        this._ring = ring;
        this._label = label;
    }

    /**
     * @readonly
     * @property {WT_MapViewRing} ring - this labeled ring's ring object
     * @type {WT_MapViewRing}
     */
    get ring() {
        return this._ring;
    }

    /**
     * @readonly
     * @property {WT_MapViewRingLabel} label - this labeled ring's label object
     * @type {WT_MapViewRingLabel}
     */
    get label() {
        return this._label;
    }

    /**
     * @property {WT_GVector2} center - the center point of the ring, in pixel coordinates.
     * @type {WT_GVector2}
     */
    get center() {
        return this.ring.center;
    }

    set center(center) {
        this.ring.center = center;
        if (this.label) {
            this.label.center = center;
        }
    }

    /**
     * @property {Number} radius - the radius of the ring, in pixels.
     * @type {Number}
     */
    get radius() {
        return this.ring.radius;
    }

    set radius(radius) {
        this.ring.radius = radius;
        if (this.label) {
            this.label.radius = radius;
        }
    }

    /**
     * @typedef {Object} WT_MapViewRingDrawResult
     * @property {Boolean} refresh - whether the ring canvas should be refreshed (i.e. cleared).
     * @property {Boolean} [copy] - whether the internal buffer should be copied to the ring canvas. Only defined if refresh is true.
     * @property {HTMLCanvasElement} [image] - the internal buffer image to copy to the ring canvas. Only defined if copy is true.
     * @property {{top:Number, left:Number, width:Number, height:Number}} [bounds] - the bounds of the area to copy from the internal buffer. Only defined if copy is true.
     */

    /**
     * Draws the ring to an internal buffer.
     * @param {WT_MapViewState} state - the current state of the map view.
     * @param {{top:Number, left:Number, width:Number, height:Number}} bounds - the draw-able bounds, in pixel coordinates.
     * @returns {WT_MapViewRingDrawResult} an object containing information on the draw operation. Contains the following properties:
     *                                     * refresh - whether the ring canvas should be refreshed (i.e. cleared).
     *                                     * copy - whether the internal buffer should be copied to the ring canvas. Only defined if refresh is true.
     *                                     * image - the internal buffer image to copy to the ring canvas. Only defined if copy is true.
     *                                     * bounds - the bounds of the area to copy from the internal buffer. Only defined if copy is true.
     */
    drawRing(state, bounds) {
        return this.ring.draw(bounds);
    }

    /**
     * Draws the label.
     * @param {WT_MapViewState} state - the current state of the map view.
     */
    drawLabel(state) {
        if (!this.label) {
            return;
        }

        if (this.label.show) {
            this.label.htmlElement.style.display = "block";
            this.label.onUpdate(state);
        } else {
            this.label.htmlElement.style.display = "none";
        }
    }

    onUpdate(state) {
    }
}

/**
 * A circular ring that is drawn to canvas.
 */
class WT_MapViewRing {
    constructor() {
        this._buffer = document.createElement("canvas");
        this._bufferContext = this._buffer.getContext("2d");
        this._lastDrawnBounds = {left: 0, right: 0, top: 0, bottom: 0};

        this._needRedraw = true;

        this._center = new WT_GVector2(0, 0);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewRing.OPTIONS_DEF);
    }

    /**
     * @property {WT_GVector2} center - the center point of the ring, in pixel coordinates.
     * @type {WT_GVector2}
     */
    get center() {
        return this._center.copy();
    }

    set center(newValue) {
        let oldValue = this.center;
        this._center.set(newValue);
        this.onOptionChanged("center", oldValue, newValue);
    }

    _isInView(bounds, margin = 0) {
        let innerHalfLength = this.radius / Math.sqrt(2);
        let innerLeft = this.center.x - innerHalfLength;
        let innerRight = this.center.x + innerHalfLength;
        let innerTop = this.center.y - innerHalfLength;
        let innerBottom = this.center.y + innerHalfLength;

        let outerLeft = this.center.x - this.radius;
        let outerRight = this.center.x + this.radius;
        let outerTop = this.center.y - this.radius;
        let outerBottom = this.center.y + this.radius;

        let left = bounds.left - margin;
        let right = bounds.left + bounds.width + margin;
        let top = bounds.top - margin;
        let bottom = bounds.top + bounds.height + margin;

        if (innerLeft < left && innerRight > right && innerTop < top && innerBottom > bottom) {
            return false;
        }
        if (outerLeft > right || outerRight < left || outerTop > bottom || outerBottom < top) {
            return false;
        }
        return true;
    }

    setOptions(opts) {
        this._optsManager.setOptions(opts);
    }

    onOptionChanged(name, oldValue, newValue) {
        if (this._needRedraw) {
            return;
        }

        let needRedraw = true;
        if (name === "center" && oldValue && newValue) {
            needRedraw = !newValue.equals(oldValue);
        }
        this._needRedraw = needRedraw;
    }

    _calculateToDrawBounds(centerX, centerY, radius, bounds) {
        let thick = this.strokeWidth / 2 + this.outlineWidth;
        let toDrawLeft = Math.max(centerX - radius - thick - 5, bounds.left);
        let toDrawTop = Math.max(centerY - radius - thick - 5, bounds.top);
        let toDrawWidth = Math.min(centerX + radius + thick + 5, bounds.left + bounds.width) - toDrawLeft;
        let toDrawHeight = Math.min(centerY + radius + thick + 5, bounds.top + bounds.height) - toDrawTop;
        return {left: toDrawLeft, top: toDrawTop, width: toDrawWidth, height: toDrawHeight};
    }

    _applyStrokeToBuffer(lineWidth, strokeWidth, lineDash) {
        this._bufferContext.lineWidth = lineWidth;
        this._bufferContext.strokeStyle = strokeWidth;
        this._bufferContext.setLineDash(lineDash);
        this._bufferContext.stroke();
    }

    _drawRingToBuffer(centerX, centerY) {
        this._bufferContext.beginPath();
        this._bufferContext.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
        if (this.outlineWidth > 0) {
            this._applyStrokeToBuffer(this.strokeWidth + this.outlineWidth * 2, this.outlineColor, this.outlineDash);
        }
        this._applyStrokeToBuffer(this.strokeWidth, this.strokeColor, this.strokeDash);
    }

    /**
     * Draws the ring to an internal buffer.
     * @param {{top:Number, left:Number, width:Number, height:Number}} bounds - the draw-able bounds, in pixel coordinates.
     * @returns {WT_MapViewRingDrawResult} an object containing information on the draw operation. Contains the following properties:
     *                                     * refresh - whether the ring canvas should be refreshed (i.e. cleared).
     *                                     * copy - whether the internal buffer should be copied to the ring canvas. Only defined if refresh is true.
     *                                     * image - the internal buffer image to copy to the ring canvas. Only defined if copy is true.
     *                                     * bounds - the bounds of the area to copy from the internal buffer. Only defined if copy is true.
     */
    draw(bounds) {
        if (!this._needRedraw) {
            return {refresh: false};
        }

        if (!this.show || !this._isInView(bounds) || bounds.width <= 0 || bounds.height <= 0) {
            return {refresh: true, copy: false};
        }

        this._bufferContext.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);

        this._buffer.width = bounds.width;
        this._buffer.height = bounds.height;

        let center = this.center;
        let centerX = center.x - bounds.left;
        let centerY = center.y - bounds.top;

        this._drawRingToBuffer(centerX, centerY);

        this._lastDrawnBounds = this._calculateToDrawBounds(centerX, centerY, this.radius, bounds);

        this._needRedraw = false;

        return {refresh: true, copy: true, image: this._buffer, bounds: this._lastDrawnBounds};
    }
}
WT_MapViewRing.OPTIONS_DEF = {
    show: {default: true, auto: true},
    center: {},
    radius: {default: 0, auto: true, observed: true},
    strokeWidth: {default: 1, auto: true, observed: true},
    strokeColor: {default: "#ffffff", auto: true, observed: true},
    strokeDash: {default: [], auto: true, observed: true},
    outlineWidth: {default: 0, auto: true, observed: true},
    outlineColor: {default: "#000000", auto: true, observed: true},
    outlineDash: {default: [], auto: true, observed: true}
};

/**
 * A label for a circular ring.
 */
class WT_MapViewRingLabel {
    constructor() {
        this._htmlElement = this._createLabel();
        this._htmlElement.style.position = "absolute";

        this._center = new WT_GVector2(0, 0);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewRingLabel.OPTIONS_DEF);

        this._needRedraw = true;
    }

    _createLabel() {
        let element = document.createElement("div");
        return element;
    }

    /**
     * @readonly
     * @property {HTMLElement} htmlElement - the top-level HTML element of the label.
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @property {WT_GVector2} center - the center point of the ring, in pixel coordinates.
     * @type {WT_GVector2}
     */
    get center() {
        return this._center.copy();
    }

    set center(newValue) {
        let oldValue = this.center;
        this._center.set(newValue);
        this.onOptionChanged("center", oldValue, newValue);
    }

    /**
     * @property {{x:Number, y:Number}} anchor - the anchor point of the label, expressed in relative x and y units.
     * @type {{x:Number, y:Number}}
     */
    get anchor() {
        return this._anchor;
    }

    set anchor(anchor) {
        this._anchor = anchor;
        this.htmlElement.style.transform = `translate(${-anchor.x * 100}%, ${-anchor.y * 100}%)`;
    }

    setOptions(opts) {
        this._optsManager.setOptions(opts);
    }

    onOptionChanged(name, oldValue, newValue) {
        if (this._needRedraw) {
            return;
        }

        let needRedraw = true;
        if (name === "center" && oldValue && newValue) {
            needRedraw = !newValue.equals(oldValue);
        }
        this._needRedraw = needRedraw;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        if (!this.show || !this._needRedraw) {
            return;
        }

        let position = this.center.add(WT_GVector2.fromPolar(this.radius + this.radialOffset, this.radialAngle * Avionics.Utils.DEG2RAD), true);
        this.htmlElement.style.left = `${position.x}px`;
        this.htmlElement.style.top = `${position.y}px`;

        this._needRedraw = false;
    }
}
WT_MapViewRingLabel.OPTIONS_DEF = {
    show: {default: true, auto: true},
    center: {},
    radius: {default: 0, auto: true, observed: true},
    radialAngle: {default: 0, auto: true, observed: true},
    radialOffset: {default: 0, auto: true, observed: true},
    anchor: {default: {x: 0, y: 0}, auto: false}
};