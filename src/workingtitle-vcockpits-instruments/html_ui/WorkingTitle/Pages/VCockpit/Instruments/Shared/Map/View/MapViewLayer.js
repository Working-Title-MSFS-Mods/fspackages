class WT_MapViewLayer {
    constructor(className, configName) {
        this._configName = configName;

        this._htmlElement = this._createHTMLElement();
        this._htmlElement.classList.add(className);
    }

    _createHTMLElement() {
    }

    _setPropertyFromConfig(name) {
        if (this.config[name]) {
            this[name] = this.config[name];
        }
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

class WT_MapViewMultiLayer extends WT_MapViewLayer {
    constructor(className, configName) {
        super(className, configName);
        this._subLayers = [];

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

    _updateSubLayerSize(subLayer) {
        subLayer.width = this._lastWidth;
        subLayer.height = this._lastHeight;
    }

    get subLayers() {
        return this._subLayers;
    }

    addSubLayer(subLayer, parentHTMLElement) {
        if (!parentHTMLElement) {
            parentHTMLElement = this.htmlElement;
        }

        this._subLayers.push(subLayer);
        subLayer.container.style.zIndex = this._subLayers.length;
        subLayer.parentHTMLElement = parentHTMLElement;
        parentHTMLElement.appendChild(subLayer.container);
        if (subLayer.syncSizeToView) {
            this._updateSubLayerSize(subLayer);
        }
    }

    removeSubLayer(subLayer) {
        let index = this._subLayers.indexOf(subLayer);
        if (index >= 0) {
            if (subLayer.container.parentNode === subLayer.parentHTMLElement) {
                subLayer.parentHTMLElement.removeChild(subLayer.container);
            }
        }
    }

    onViewSizeChanged(data) {
        this._lastWidth = data.projection.viewWidth;
        this._lastHeight = data.projection.viewHeight;

        for (let subLayer of this.subLayers) {
            if (subLayer.syncSizeToView) {
                this._updateSubLayerSize(subLayer);
            }
        }
    }

    onAttached(data) {
        this.onViewSizeChanged(data);
    }
}

class WT_MapViewSubLayer {
    constructor(syncSizeToView) {
        this._syncSizeToView = syncSizeToView;

        this._container = this._createContainer();
    }

    _createContainer() {
        let container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = 0;
        container.style.top = 0;
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.transform = "rotateX(0deg)";
        return container;
    }

    get syncSizeToView() {
        return this._syncSizeToView;
    }

    get container() {
        return this._container;
    }
}

class WT_MapViewCanvas extends WT_MapViewSubLayer {
    constructor(useBuffer, syncSizeToView) {
        super(syncSizeToView);
        this._useBuffer = useBuffer;

        if (useBuffer) {
            this._buffer = this._createBuffer();
        }

        let canvasObject = this._createCanvas();
        this._canvas = canvasObject.canvas;
        this._context = canvasObject.context;
        this._container.appendChild(this._canvas);
    }

    _createBuffer() {
        let buffer = document.createElement("canvas");
        let bufferContext = buffer.getContext("2d");
        return {canvas: buffer, context: bufferContext};
    }

    _createCanvas() {
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");
        context.imageSmoothingEnabled = false;

        canvas.style.position = "absolute";
        canvas.style.left = 0;
        canvas.style.top = 0;

        return {canvas: canvas, context: context};
    }

    get useBuffer() {
        return this._useBuffer;
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

class WT_MapViewSvg extends WT_MapViewSubLayer {
    constructor(syncSizeToView) {
        super(syncSizeToView);

        this._svg = this._createSVG();
        this._container.appendChild(this._svg);
    }

    _createSVG() {
        let svg = document.createElementNS(Avionics.SVG.NS, "svg");
        svg.style.position = "absolute";
        svg.style.left = 0;
        svg.style.top = 0;
        svg.style.width = "100px";
        svg.style.height = "100px";
        svg.setAttribute("viewBox", `0 0 100 100`);
        this._width = 100;
        this._height = 100;
        return svg;
    }

    get svg() {
        return this._svg;
    }

    get width() {
        return this._width;
    }

    set width(width) {
        this._width = width;
        this.svg.style.width = `${width}px`;
        this.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    }

    get height() {
        return this._height;
    }

    set height(height) {
        this._height = height;
        this.svg.style.height = `${height}px`;
        this.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    }
}