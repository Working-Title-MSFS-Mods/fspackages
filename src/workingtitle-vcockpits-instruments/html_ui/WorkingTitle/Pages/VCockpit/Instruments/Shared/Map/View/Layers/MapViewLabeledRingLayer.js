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

    addCanvas() {
        let entry = this._createCanvas();
        this._canvases.push(entry);
        entry.container.style.zIndex = this._canvases.length;
        this.ringContainer.appendChild(entry.container);
    }

    removeCanvas() {
        let entry = this._canvases.pop();
        if (entry && entry.container.parentNode === this.ringContainer) {
            this.ringContainer.removeChild(entry.container);
        }
    }

    onViewSizeChanged(data) {
        super.onViewSizeChanged(data);
        this._updateBounds(data);
    }

    addRing(labeledRing) {
        this._rings.push({
            ring: labeledRing,
            lastDrawn: {left: 0, top: 0, width: 0, height: 0}
        });
        let label = labeledRing.label;
        if (label) {
            this.labelContainer.appendChild(label.htmlElement);
        }
        if (this.rings.length > this.canvases.length) {
            this.addCanvas();
        }
    }

    removeRing(labeledRing) {
        let index = this._rings.findIndex(entry => entry.ring === labeledRing);
        if (index >= 0) {
            this.removeCanvas();
            this._rings.splice(index, 1);
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
            this.canvases[i].context.clearRect(entry.lastDrawn.left, entry.lastDrawn.top, entry.lastDrawn.width, entry.lastDrawn.height);
            entry.lastDrawn = {left: 0, right: 0, top: 0, bottom: 0};
            let toDraw = entry.ring.drawRing(data, this._bounds);
            if (toDraw) {
                let drawn = {
                    left: this._bounds.left + toDraw.bounds.left,
                    top: this._bounds.top + toDraw.bounds.top,
                    width: toDraw.bounds.width,
                    height: toDraw.bounds.height
                };
                this.canvases[i].context.drawImage(toDraw.image, toDraw.bounds.left, toDraw.bounds.top, toDraw.bounds.width, toDraw.bounds.height, drawn.left, drawn.top, drawn.width, drawn.height);
                entry.lastDrawn = drawn;
            }
            entry.ring.drawLabel(data);
        }
    }
}

class WT_MapViewLabeledRing {
    constructor(ring, label) {
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

    drawRing(data, bounds) {
        return this.ring.show ? this.ring.draw(bounds) : null;
    }

    drawLabel(data) {
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
        this._canvas = document.createElement("canvas");
        this._canvasContext = this._canvas.getContext("2d");
        this._lastDrawnBounds = {left: 0, right: 0, top: 0, bottom: 0};

        this._optsManager = new WT_OptionsManager(this, WT_MapViewRing.OPTIONS_DEF);
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

    draw(bounds) {
        if (!this.show || !this._isInView(bounds) || bounds.width <= 0 || bounds.height <= 0) {
            return;
        }

        this._canvasContext.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);

        this._canvas.width = bounds.width;
        this._canvas.height = bounds.height;

        let centerXRounded = Math.round(this.center.x) - bounds.left;
        let centerYRounded = Math.round(this.center.y) - bounds.top;
        let radiusRounded = Math.round(this.radius);

        if (this.outlineWidth > 0) {
            this._canvasContext.lineWidth = this.outlineWidth;
            this._canvasContext.strokeStyle = this.outlineColor;
            this._canvasContext.setLineDash(this.outlineDash);
            this._canvasContext.beginPath();
            this._canvasContext.arc(centerXRounded, centerYRounded, radiusRounded, 0, 2 * Math.PI);
            this._canvasContext.stroke();
        }

        this._canvasContext.lineWidth = this.strokeWidth;
        this._canvasContext.strokeStyle = this.strokeColor;
        this._canvasContext.setLineDash(this.strokeDash);
        this._canvasContext.beginPath();
        this._canvasContext.arc(centerXRounded, centerYRounded, radiusRounded, 0, 2 * Math.PI);
        this._canvasContext.stroke();

        let thick = Math.max(this.strokeWidth, this.outlineWidth);
        let toDrawLeft = Math.max(centerXRounded - radiusRounded - thick, bounds.left);
        let toDrawTop = Math.max(centerYRounded - radiusRounded - thick, bounds.top);
        let toDrawWidth = Math.min(centerXRounded + radiusRounded + thick, bounds.left + bounds.width) - toDrawLeft;
        let toDrawHeight = Math.min(centerYRounded + radiusRounded + thick, bounds.top + bounds.height) - toDrawTop;
        this._lastDrawnBounds = {left: toDrawLeft, top: toDrawTop, width: toDrawWidth, height: toDrawHeight};

        return {image: this._canvas, bounds: this._lastDrawnBounds};
    }
}
WT_MapViewRing.OPTIONS_DEF = {
    show: {default: true, auto: true},
    center: {default: {x: 0, y: 0}, auto: true},
    radius: {default: 0, auto: true},
    strokeWidth: {default: 1, auto: false},
    strokeColor: {default: "#ffffff", auto: false},
    strokeDash: {default: [], auto: false},
    outlineWidth: {default: 0, auto: false},
    outlineColor: {default: "#000000", auto: false},
    outlineDash: {default: [], auto: false}
};

class WT_MapViewRingLabel {
    constructor() {
        this._htmlElement = this._createLabel();
        this._htmlElement.style.position = "absolute";

        this._optsManager = new WT_OptionsManager(this, WT_MapViewRingLabel.OPTIONS_DEF);

        this._needRedraw = false;
    }

    _createLabel() {
        let element = document.createElement("div");
        return element;
    }

    get htmlElement() {
        return this._htmlElement;
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
        let needRedraw = true;
        if (name === "center" && oldValue && newValue) {
            needRedraw = oldValue.x !== newValue.x || oldValue.y !== newValue.y;
        }
        this._needRedraw = needRedraw;
    }

    onUpdate(data) {
        if (!this.show || !this._needRedraw) {
            return;
        }

        let position = data.projection.xyOffsetByViewAngle(this.center, this.radius + this.radialOffset, this.radialAngle);
        this.htmlElement.style.left = `${position.x}px`;
        this.htmlElement.style.top = `${position.y}px`;

        this._needRedraw = false;
    }
}
WT_MapViewRingLabel.OPTIONS_DEF = {
    show: {default: true, auto: true},
    center: {default: {x: 0, y: 0}, auto: true, observed: true},
    radius: {default: 0, auto: true, observed: true},
    radialAngle: {default: 0, auto: true, observed: true},
    radialOffset: {default: 0, auto: true, observed: true},
    anchor: {default: {x: 0, y: 0}, auto: false}
};