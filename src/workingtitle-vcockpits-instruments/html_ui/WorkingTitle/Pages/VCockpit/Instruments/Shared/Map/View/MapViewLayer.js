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

    onConfigLoaded(data) {
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
    constructor(id, configName) {
        super(id, configName);
        this._canvases = [];

        this._lastWidth = 0;
        this._lastHeight = 0;
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
    }

    get canvases() {
        return this._canvases;
    }

    addCanvas(canvas, parentHTMLElement) {
        if (!parentHTMLElement) {
            parentHTMLElement = this.htmlElement;
        }

        this._canvases.push(canvas);
        canvas.container.style.zIndex = this._canvases.length;
        canvas.parentHTMLElement = parentHTMLElement;
        parentHTMLElement.appendChild(canvas.container);
        if (canvas.syncSizeToView) {
            this._updateCanvasSize(canvas);
        }
    }

    removeCanvas(canvas) {
        let index = this._canvases.indexOf(canvas);
        if (index >= 0) {
            if (canvas.container.parentNode === canvas.parentHTMLElement) {
                canvas.parentHTMLElement.removeChild(canvas.container);
            }
        }
    }

    onViewSizeChanged(data) {
        this._lastWidth = data.projection.viewWidth;
        this._lastHeight = data.projection.viewHeight;

        for (let canvas of this._canvases) {
            if (canvas.syncSizeToView) {
                this._updateCanvasSize(canvas);
            }
        }
    }

    onAttached(data) {
        this.onViewSizeChanged(data);
    }
}

class WT_MapViewCanvas {
    constructor(useBuffer, syncSizeToView) {
        this._useBuffer = useBuffer;
        this._syncSizeToView = syncSizeToView;

        if (useBuffer) {
            let buffer = document.createElement("canvas");
            let bufferContext = buffer.getContext("2d");
            this._buffer = {canvas: buffer, context: bufferContext};
        }

        this._container = document.createElement("div");
        this._container.style.position = "absolute";
        this._container.style.left = 0;
        this._container.style.top = 0;
        this._container.style.width = "100%";
        this._container.style.height = "100%";
        this._container.style.transform = "rotateX(0deg)";

        this._canvas = document.createElement("canvas");
        this._context = this._canvas.getContext("2d");
        this._context.imageSmoothingEnabled = false;

        this._canvas.style.position = "absolute";
        this._canvas.style.left = 0;
        this._canvas.style.top = 0;

        this._container.appendChild(this._canvas);
    }

    get useBuffer() {
        return this._useBuffer;
    }

    get syncSizeToView() {
        return this._syncSizeToView;
    }

    get container() {
        return this._container;
    }

    get canvas() {
        return this._canvas;
    }

    get context() {
        return this._context;
    }

    get buffer() {
        return this._buffer;
    }

    get width() {
        return this.canvas.width;
    }

    set width(width) {
        this.canvas.width = width;
        this.canvas.style.width = `${width}px`;
        if (this.useBuffer) {
            this.buffer.canvas.width = width;
        }
    }

    get height() {
        return this.canvas.height;
    }

    set height(height) {
        this.canvas.height = height;
        this.canvas.style.height = `${height}px`;
        if (this.useBuffer) {
            this.buffer.canvas.height = height;
        }
    }

    copyBufferToCanvas(left, top, width, height) {
        if (left === undefined) {
            left = 0;
            top = 0;
            width = this.width;
            height = this.height;
        }
        this.context.drawImage(this.buffer.canvas, left, top, width, height, left, top, width, height);
        return {left: left, top: top, width: width, height: height};
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