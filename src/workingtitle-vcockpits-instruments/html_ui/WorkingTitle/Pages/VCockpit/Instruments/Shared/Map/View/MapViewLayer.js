class WT_MapViewLayer {
    constructor(id, configName) {
        this._id = id;
        this._configName = configName;

        this._htmlElement = this._createHTMLElement();
        this._htmlElement.id = id;
    }

    _createHTMLElement() {
    }

    _setPropertyFromConfig(name) {
        if (this.config[name]) {
            this[name] = this.config[name];
        }
    }

    get id() {
        return this._id;
    }

    get configName() {
        return this._configName;
    }

    get htmlElement() {
        return this._htmlElement;
    }

    isVisible(data) {
        return true;
    }

    onViewSizeChanged(data) {
    }

    onConfigLoaded() {
    }

    onModelChanged(data) {
    }

    onAttached(data) {
    }

    onUpdate(data) {
    }

    onDetached() {
    }
}

class WT_MapViewCanvasLayer extends WT_MapViewLayer {
    constructor(id, configName, canvasCount = 1) {
        super(id, configName);
        this._canvases = [];

        this._lastWidth = 0;
        this._lastHeight = 0;

        for (let i = 0; i < canvasCount; i++) {
            this.addCanvas();
        }
    }

    _createHTMLElement() {
        let container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = 0;
        container.style.top = 0;
        container.style.width = "100%";
        container.style.height = "100%";
        return container;
    }

    _updateCanvasSize(canvas) {
        canvas.width = this._lastWidth;
        canvas.height = this._lastHeight;
        canvas.style.width = `${this._lastWidth}px`;
        canvas.style.height = `${this._lastHeight}px`;
    }

    _createCanvas() {
        let entry = {};

        entry.container = document.createElement("div");
        entry.container.style.position = "absolute";
        entry.container.style.left = 0;
        entry.container.style.top = 0;
        entry.container.style.width = "100%";
        entry.container.style.height = "100%";
        entry.container.style.transform = "rotateX(0deg)";

        entry.canvas = document.createElement("canvas");
        entry.context = entry.canvas.getContext("2d");
        entry.context.imageSmoothingEnabled = false;

        entry.canvas.style.position = "absolute";
        entry.canvas.style.left = 0;
        entry.canvas.style.top = 0;

        this._updateCanvasSize(entry.canvas);

        entry.container.appendChild(entry.canvas);
        return entry;
    }

    get canvases() {
        return this._canvases;
    }

    addCanvas() {
        let entry = this._createCanvas();
        this._canvases.push(entry);
        entry.container.style.zIndex = this._canvases.length;
        this.htmlElement.appendChild(entry.container);
    }

    removeCanvas() {
        let entry = this._canvases.pop();
        if (entry && entry.container.parentNode === this.htmlElement) {
            this.htmlElement.removeChild(entry.container);
        }
    }

    onViewSizeChanged(data) {
        this._lastWidth = data.projection.viewWidth;
        this._lastHeight = data.projection.viewHeight;

        for (let entry of this._canvases) {
            this._updateCanvasSize(entry.canvas);
        }
    }

    onAttached(data) {
        this.onViewSizeChanged(data);
    }
}

class WT_MapViewSvgLayer extends WT_MapViewLayer {
    _createHTMLElement() {
        this._svg = document.createElementNS(Avionics.SVG.NS, "svg");
        this._svg.style.left = 0;
        this._svg.style.top = 0;
        return this._svg;
    }

    get svg() {
        return this._svg;
    }

    onViewSizeChanged(data) {
        this.svg.setAttribute("viewbox", `0 0 ${data.projection.viewWidth} ${data.projection.viewHeight}`);
        this.svg.style.width = `${data.projection.viewWidth}px`;
        this.svg.style.height = `${data.projection.viewHeight}px`;
    }

    onAttached(data) {
        this.onViewSizeChanged(data);
    }
}
/*
class WT_MapProjectedLayerView extends WT_MapLayerView {
    constructor(configName, projection) {
        super(configName);
        this.projection = projection;
    }

    get viewPortWidth() {
        return super.viewPortWidth;
    }

    set viewPortWidth(width) {
        super.viewPortWidth = width;
        this.projection.viewPortWidth = width;
    }

    get viewPortHeight() {
        return super.viewPortHeight;
    }

    set viewPortHeight(height) {
        super.viewPortHeight = height;
        this.projection.viewPortHeight = height;
    }

    onUpdate() {
        let projectionOpts = {
            center: this.model.map.center,
            range: this.model.map.range,
            rotation: this.model.map.rotation
        };
        this.projection.setOptions(projectionOpts);
    }
}
*/