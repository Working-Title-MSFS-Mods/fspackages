class WT_MapViewLabeledRingLayer extends WT_MapViewCanvasLayer {
    constructor(id, configName) {
        super(id, configName);

        this._rings = [];
        this._bounds = {left: 0, top: 0, width: 0, height: 0};
    }

    get rings() {
        return this._rings;
    }

    get ringContainer() {
        return this._ringContainer;
    }

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

    _updateBounds(data) {
        this._bounds = {left: 0, top: 0, width: data.projection.viewWidth, height: data.projection.viewHeight};
    }

    onViewSizeChanged(data) {
        super.onViewSizeChanged(data);
        this._updateBounds(data);
    }

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
        this.addCanvas(entry.canvas, this.ringContainer);
    }

    removeRing(labeledRing) {
        let index = this._rings.findIndex(entry => entry.ring === labeledRing);
        if (index >= 0) {
            let removed = this._rings[index];
            this._rings.splice(index, 1);
            this.removeCanvas(removed.canvas);
            let label = labeledRing.label;
            if (label && label.htmlElement.parentNode === this.labelContainer) {
                this.labelContainer.removeChild(label.htmlElement);
            }
        }
    }

    onUpdate(data) {
        for (let i = 0; i < this.rings.length; i++) {
            let entry = this.rings[i];
            entry.ring.onUpdate(data);
            let toDraw = entry.ring.drawRing(data, this._bounds);
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
            entry.ring.drawLabel(data);
        }
    }
}

class WT_MapViewLabeledRing {
    constructor(ring = new WT_MapViewRing(), label = null) {
        this._optsManager = new WT_OptionsManager(this, WT_MapViewLabeledRing.OPTIONS_DEF);

        this._ring = ring;
        this._label = label;
    }

    get ring() {
        return this._ring;
    }

    get label() {
        return this._label;
    }

    get center() {
        return this.ring.center;
    }

    set center(center) {
        this.ring.center = center;
        if (this.label) {
            this.label.center = center;
        }
    }

    get radius() {
        return this.ring.radius;
    }

    set radius(radius) {
        this.ring.radius = radius;
        if (this.label) {
            this.label.radius = radius;
        }
    }

    drawRing(data, bounds) {
        return this.ring.show ? this.ring.draw(bounds) : null;
    }

    drawLabel(data) {
        if (!this.label) {
            return;
        }

        if (this.label.show) {
            Avionics.Utils.diffAndSetAttribute(this.label.htmlElement, "display", "block");
            this.label.onUpdate(data);
        } else {
            Avionics.Utils.diffAndSetAttribute(this.label.htmlElement, "display", "none");
        }
    }

    onUpdate(data) {
    }
}

class WT_MapViewRing {
    constructor() {
        this._buffer = document.createElement("canvas");
        this._bufferContext = this._buffer.getContext("2d");
        this._lastDrawnBounds = {left: 0, right: 0, top: 0, bottom: 0};

        this._needRedraw = true;

        this._center = new WT_GVector2(0, 0);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewRing.OPTIONS_DEF);
    }

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

    _drawRingComponentToBuffer(lineWidth, strokeWidth, lineDash, centerX, centerY, radius) {
        this._bufferContext.lineWidth = lineWidth;
        this._bufferContext.strokeStyle = strokeWidth;
        this._bufferContext.setLineDash(lineDash);
        this._bufferContext.beginPath();
        this._bufferContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this._bufferContext.stroke();
    }

    _drawRingComponents(centerX, centerY) {
        if (this.outlineWidth > 0) {
            this._drawRingComponentToBuffer(this.strokeWidth + this.outlineWidth * 2, this.outlineColor, this.outlineDash, centerX, centerY, this.radius);
        }
        this._drawRingComponentToBuffer(this.strokeWidth, this.strokeColor, this.strokeDash, centerX, centerY, this.radius);
    }

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

        this._drawRingComponents(centerX, centerY);

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

    get htmlElement() {
        return this._htmlElement;
    }

    get center() {
        return this._center.copy();
    }

    set center(newValue) {
        let oldValue = this.center;
        this._center.set(newValue);
        this.onOptionChanged("center", oldValue, newValue);
    }

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

    onUpdate(data) {
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