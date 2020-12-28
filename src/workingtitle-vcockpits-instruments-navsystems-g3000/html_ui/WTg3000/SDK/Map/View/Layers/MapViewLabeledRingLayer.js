/**
 * A layer with one or more circular rings with attached labels. Labels are always drawn on top of any rings they overlap.
 */
class WT_MapViewLabeledRingLayer extends WT_MapViewMultiLayer {
    constructor(className, configName) {
        super(className, configName);

        this._rings = [];
    }

    /**
     * @typedef {Object} WT_MapViewLabeledRingEntry
     * @property {WT_MapViewCanvas} canvas - the canvas element to which the ring is drawn.
     * @property {WT_MapViewLabeledRing} ring - the labeled ring object.
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
     * Adds a labeled ring to this layer. Once added, rings form a stack, with each ring always drawn on top of rings added before it.
     * @param {WT_MapViewLabeledRing} labeledRing - the labeled ring to add.
     */
    addRing(labeledRing) {
        let entry = {
            canvas: new WT_MapViewCanvas(false, true),
            ring: labeledRing,
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
        super.onUpdate(state);

        for (let i = 0; i < this.rings.length; i++) {
            let entry = this.rings[i];
            entry.ring.onUpdate(state);
            entry.ring.updateRing(state, entry.canvas.display.context, entry.canvas.width, entry.canvas.height);
            entry.ring.updateLabel(state);
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
     * Draws the ring to a canvas.
     * @param {WT_MapViewState} state - the current state of the map view.
     * @param {CanvasRenderingContext2D} context - the rendering context of the canvas to which to draw the ring.
     * @param {Number} width - the width of the canvas to which to draw.
     * @param {Number} height - the height of the canvas to which to draw.
     */
    updateRing(state, context, width, height) {
        return this.ring.update(context, width, height);
    }

    /**
     * Draws the label.
     * @param {WT_MapViewState} state - the current state of the map view.
     */
    updateLabel(state) {
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
        this._lastDrawnBounds = {left: 0, right: 0, top: 0, bottom: 0};
        this._needRedraw = true;

        this._center = new WT_GVector2(0, 0);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewRing.OPTIONS_DEF);

        this._tempVector = new WT_GVector2(0, 0);
    }

    /**
     * @property {WT_GVector2} center - the center point of the ring, in pixel coordinates.
     * @type {WT_GVector2}
     */
    get center() {
        return this._center.readonly();
    }

    set center(newValue) {
        if (!this.center.equals(newValue)) {
            let oldValue = this._tempVector.set(this.center);
            this._center.set(newValue);
            this.onOptionChanged("center", oldValue, newValue);
        }
    }

    _isInView(width, height, margin = 0) {
        let innerHalfLength = this.radius / Math.sqrt(2);
        let innerLeft = this.center.x - innerHalfLength;
        let innerRight = this.center.x + innerHalfLength;
        let innerTop = this.center.y - innerHalfLength;
        let innerBottom = this.center.y + innerHalfLength;

        let outerLeft = this.center.x - this.radius;
        let outerRight = this.center.x + this.radius;
        let outerTop = this.center.y - this.radius;
        let outerBottom = this.center.y + this.radius;

        let left = -margin * width;
        let right = (1 + margin) * width;
        let top = -margin * height;
        let bottom = (1 + margin) * height;

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
        this._needRedraw = true;
    }

    /**
     * Determines the minimum bounds of the area required to draw the ring.
     * @param {{x: Number, y: Number}} center - the center of the ring, in pixel coordinates.
     * @param {Number} radius - the radius of the ring, in pixels.
     * @param {Number} width - the width of the canvas to which to draw.
     * @param {Number} height - the height of the canvas to which to draw.
     * @returns {{left:Number, top:Number, width:Number, height:Number}} the minimum bounds of the area required to draw the ring.
     */
    _calculateToDrawBounds(center, radius, width, height) {
        let thick = this.strokeWidth / 2 + this.outlineWidth;
        let drawLeft = Math.max(0, center.x - radius - thick - 5);
        let drawTop = Math.max(0, center.y - radius - thick - 5);
        let drawWidth = Math.min(width, center.x + radius + thick + 5) - drawLeft;
        let drawHeight = Math.min(height, center.y + radius + thick + 5) - drawTop;
        return {left: drawLeft, top: drawTop, width: drawWidth, height: drawHeight};
    }

    /**
     * Applies a stroke to the buffer rendering context using the specified styles.
     * @param {CanvasRenderingContext2D} context - the rendering context of the canvas to which to draw.
     * @param {Number} lineWidth - the width of the stroke, in pixels.
     * @param {String|CanvasGradient|CanvasPattern} strokeStyle - the style of the stroke.
     * @param {Number[]} lineDash - the dash of the stroke.
     */
    _applyStrokeToContext(context, lineWidth, strokeWidth, lineDash) {
        context.lineWidth = lineWidth;
        context.strokeStyle = strokeWidth;
        context.setLineDash(lineDash);
        context.stroke();
    }

    /**
     * Draws the ring to a canvas.
     * @param {CanvasRenderingContext2D} context - the rendering context of the canvas to which to draw.
     * @param {{x: Number, y: Number}} center - the center of the ring, in pixel coordinates.
     * @param {Number} radius - the radius of the ring, in pixels.
     */
    _drawRingToCanvas(context, center, radius) {
        context.beginPath();
        context.arc(center.x, center.y, radius, 0, Math.PI * 2);
        if (this.outlineWidth > 0) {
            this._applyStrokeToContext(context, this.strokeWidth + this.outlineWidth * 2, this.outlineColor, this.outlineDash);
        }
        this._applyStrokeToContext(context, this.strokeWidth, this.strokeColor, this.strokeDash);
    }

    /**
     * Updates the ring.
     * @param {CanvasRenderingContext2D} context - the rendering context of the canvas to which to draw the ring.
     * @param {Number} width - the width of the canvas to which to draw.
     * @param {Number} height - the height of the canvas to which to draw.
     */
    update(context, width, height) {
        if (!this._needRedraw) {
            return;
        }

        context.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);

        if (!this.show || !this._isInView(width, height) || width <= 0 || height <= 0) {
            return;
        }

        let center = this.center;
        this._drawRingToCanvas(context, center, this.radius);
        this._lastDrawnBounds = this._calculateToDrawBounds(center, this.radius, width, height);
        this._needRedraw = false;
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

        this._tempVector = new WT_GVector2(0, 0);
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
        return this._center.readonly();
    }

    set center(newValue) {
        if (!this.center.equals(newValue)) {
            let oldValue = this._tempVector.set(this.center);
            this._center.set(newValue);
            this.onOptionChanged("center", oldValue, newValue);
        }
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
        this._needRedraw = true;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        if (!this.show || !this._needRedraw) {
            return;
        }

        let position = this.center.plus(WT_GVector2.fromPolar(this.radius + this.radialOffset, this.radialAngle * Avionics.Utils.DEG2RAD), true);
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