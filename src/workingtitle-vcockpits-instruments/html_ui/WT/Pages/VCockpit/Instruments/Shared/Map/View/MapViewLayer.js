/**
 * A map view layer.
 */
class WT_MapViewLayer {
    /**
     * @param {String} className - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} configName - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(className, configName) {
        this._configName = configName;

        this._htmlElement = this._createHTMLElement();
        this._htmlElement.classList.add(className);
    }

    /**
     * @abstract
     * @returns {HTMLElement} the top-level element of this layer.
     */
    _createHTMLElement() {
    }

    _setPropertyFromConfig(name) {
        if (this.config[name]) {
            this[name] = this.config[name];
        }
    }

    /**
     * @readonly
     * @property {String} configName - the name of the property in the map view's config file associated with this layer.
     * @type {String}
     */
    get configName() {
        return this._configName;
    }

    /**
     * @readonly
     * @property {HTMLElement} - the top-level element of this layer.
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * Indicates whether this layer should be visible.
     * @param {WT_MapViewState} state - the current state of this layer's parent map view.
     * @returns {Boolean} whether this layer should be visible.
     */
    isVisible(state) {
        return true;
    }

    /**
     * This method is called when this layer's config is loaded.
     * @param {WT_MapViewState} state - the current state of this layer's parent map view.
     */
    onConfigLoaded(state) {
    }

    /**
     * This method is called whenever the model associated with this layer's parent map view changes.
     * @param {WT_MapViewState} state - the current state of this layer's parent map view.
     */
    onModelChanged(state) {
    }

    /**
     * This method is called whenever the projected viewing window changes. This includes changes of the projection type,
     * window size, and window DPI scale.
     * @param {WT_MapViewState} state - the current state of this layer's parent map view.
     */
    onProjectionViewChanged(state) {
    }

    /**
     * This method is called whenever this layer is added to a map view.
     * @param {WT_MapViewState} state - the current state of this layer's parent map view.
     */
    onAttached(state) {
    }

    /**
     * This method is called on every rendering frame while this layer is visible.
     * @param {WT_MapViewState} state - the current state of this layer's parent map view.
     */
    onUpdate(state) {
    }

    /**
     * This method is called whenever this layer is removed from a map view.
     */
    onDetached() {
    }
}

/**
 * A map view layer that has one or more sublayers.
 */
class WT_MapViewMultiLayer extends WT_MapViewLayer {
    constructor(className, configName) {
        super(className, configName);
        this._subLayers = [];
        this._toAttach = [];

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

    get subLayers() {
        return this._subLayers;
    }

    /**
     * Adds a sublayer to this layer.
     * @param {WT_MapViewSubLayer} subLayer - the sublayer to add.
     * @param {HTMLElement} [parentHTMLElement] - the HTML element to which to append the top-level element of the new sublayer. If this
     *                                            argument is not supplied, then the sublayer will be appended to this layer's top-level
     *                                            element.
     */
    addSubLayer(subLayer, parentHTMLElement) {
        if (!parentHTMLElement) {
            parentHTMLElement = this.htmlElement;
        }

        this.subLayers.push(subLayer);
        subLayer.container.style.zIndex = this.subLayers.length;
        subLayer.parentHTMLElement = parentHTMLElement;
        parentHTMLElement.appendChild(subLayer.container);
        this._toAttach.push(subLayer);
    }

    /**
     * Removes a sublayer from this layer.
     * @param {WT_MapViewSubLayer} subLayer - the sublayer to remove.
     */
    removeSubLayer(subLayer) {
        let index = this.subLayers.indexOf(subLayer);
        if (index >= 0) {
            if (subLayer.container.parentNode === subLayer.parentHTMLElement) {
                subLayer.parentHTMLElement.removeChild(subLayer.container);
            }
            this.subLayers.splice(index, 1);
            subLayer.onDetached();
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onProjectionViewChanged(state) {
        for (let subLayer of this.subLayers) {
            subLayer.onProjectionViewChanged(state);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onAttached(state) {
        for (let subLayer of this.subLayers) {
            subLayer.onAttached(state);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        if (this._toAttach.length > 0) {
            for (let subLayer of this._toAttach) {
                subLayer.onAttached(state);
            }
            this._toAttach = [];
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onDetached() {
        for (let subLayer of this.subLayers) {
            subLayer.onDetached();
        }
    }
}

/**
 * A map view sublayer.
 */
class WT_MapViewSubLayer {
    /**
     * @param {Boolean} syncSizeToView - whether to automatically sync the new sublayer's size to the size of the map view's viewing window.
     */
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
        container.style.overflow = "hidden";
        return container;
    }

    /**
     * @readonly
     * @property {Boolean} syncSizeToView - whether to automatically sync this sublayer's size to the size of the map view's viewing window.
     * @type {Boolean}
     */
    get syncSizeToView() {
        return this._syncSizeToView;
    }

    /**
     * @readonly
     * @property {HTMLElement} container - the top-level HTML element of this sublayer.
     * @type {HTMLElement}
     */
    get container() {
        return this._container;
    }

    /**
     * Sets the size of this sublayer.
     * @param {Number} width - the new width of this sublayer, in pixels.
     * @param {Number} height - the new height of this sublayer, in pixels.
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onAttached(state) {
        if (this.syncSizeToView) {
            this.setSize(state.projection.viewWidth, state.projection.viewHeight);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onProjectionViewChanged(state) {
        if (this.syncSizeToView) {
            this.setSize(state.projection.viewWidth, state.projection.viewHeight);
        }
    }

    onDetached() {

    }
}

/**
 * A canvas sublayer.
 */
class WT_MapViewCanvas extends WT_MapViewSubLayer {
    /**
     * @param {Boolean} useBuffer - whether to automatically create a offscreen buffer for the new canvas.
     * @param {Boolean} syncSizeToView - whether to automatically sync the new sublayer's size to the size of the map view's viewing window.
     */
    constructor(useBuffer, syncSizeToView) {
        super(syncSizeToView);
        this._useBuffer = useBuffer;

        if (useBuffer) {
            this._buffer = this._createBuffer();
        }

        let canvasObject = this._createDisplay();
        this._display = canvasObject;
        this._container.appendChild(this._display.canvas);
    }

    _createBuffer() {
        return new WT_MapViewCanvasDrawable();
    }

    _createDisplay() {
        let display = new WT_MapViewCanvasDrawable();
        display.canvas.style.position = "absolute";
        display.canvas.style.left = 0;
        display.canvas.style.top = 0;
        return display;
    }

    /**
     * @readonly
     * @property {Boolean} useBuffer - whether this canvas sublayer has an offscreen buffer.
     * @type {Boolean}
     */
    get useBuffer() {
        return this._useBuffer;
    }

    /**
     * @readonly
     * @property {{canvas:HTMLCanvasElement, context:CanvasRenderingContext2D}} display - an object containing this sublayer's display canvas and its rendering context.
     * @type {{canvas:HTMLCanvasElement, context:CanvasRenderingContext2D}}
     */
    get display() {
        return this._display;
    }

    /**
     * @readonly
     * @property {{canvas:HTMLCanvasElement, context:CanvasRenderingContext2D}} buffer - an object containing this sublayer's offscreen buffer and its rendering context, if they exist.
     * @type {{canvas:HTMLCanvasElement, context:CanvasRenderingContext2D}}
     */
    get buffer() {
        return this._buffer;
    }

    /**
     * @property {Number} width - the width, in pixels, of this sublayer.
     * @type {Number}
     */
    get width() {
        return this.display.canvas.width;
    }

    set width(width) {
        this.display.canvas.width = width;
        this.display.canvas.style.width = `${width}px`;
        if (this.useBuffer) {
            this.buffer.canvas.width = width;
        }
    }

    /**
     * @property {Number} height - the height, in pixels, of this sublayer.
     * @type {Number}
     */
    get height() {
        return this.display.canvas.height;
    }

    set height(height) {
        this.display.canvas.height = height;
        this.display.canvas.style.height = `${height}px`;
        if (this.useBuffer) {
            this.buffer.canvas.height = height;
        }
    }

    /**
     * Copies the contents of this sublayer's offscreen buffer to the display. If this sublayer does not have an offscreen buffer,
     * this method does nothing. This method optionally takes in arguments to define the bounds of the area to copy to the display.
     * If these arguments are not supplied, by default the entire buffer is copied over.
     * @param {Number} [left] - the x-coordinate of the left edge of the area to copy, in pixels.
     * @param {Number} [top] - the y-coordinate of the top edge of the area to copy, in pixels.
     * @param {Number} [width] - the width of the area to copy, in pixels.
     * @param {Number} [height] - the height of the area to copy, in pixels.
     */
    copyBufferToCanvas(left, top, width, height) {
        if (!this.buffer) {
            return;
        }

        if (left === undefined) {
            left = 0;
            top = 0;
            width = this.width;
            height = this.height;
        }
        this.display.context.drawImage(this.buffer.canvas, left, top, width, height, left, top, width, height);
        return {left: left, top: top, width: width, height: height};
    }
}

class WT_MapViewCanvasDrawable {
    constructor() {
        this._canvas = document.createElement("canvas");
        this._context = this._canvas.getContext("2d");
        this._context.imageSmoothingEnabled = false;
    }

    /**
     * @readonly
     * @property {HTMLCanvasElement} canvas - this drawable's canvas element.
     * @type {HTMLCanvasElement}
     */
    get canvas() {
        return this._canvas;
    }

    /**
     * @readonly
     * @property {CanvasRenderingContext2D} context - this drawable's 2D rendering context.
     * @type {CanvasRenderingContext2D}
     */
    get context() {
        return this._context;
    }

    /**
     * Clears the contents of this drawable. This method optionally takes in arguments to define the bounds of the area to clear.
     * If these arguments are not supplied, by default the entire drawable is cleared.
     * @param {Number} [left] - the x-coordinate of the left edge of the area to clear, in pixels.
     * @param {Number} [top] - the y-coordinate of the top edge of the area to clear, in pixels.
     * @param {Number} [width] - the width of the area to clear, in pixels.
     * @param {Number} [height] - the height of the area to clear, in pixels.
     */
    clear(left, top, width, height) {
        if (left === undefined) {
            left = 0;
            top = 0;
            width = this.canvas.width;
            height = this.canvas.height;
        }
        this.context.clearRect(left, top, width, height);
    }
}

/**
 * An SVG sublayer.
 */
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

    /**
     * @readonly
     * @property {HTMLElement} canvas - this sublayer's svg element.
     * @type {HTMLElement}
     */
    get svg() {
        return this._svg;
    }

    /**
     * @property {Number} width - the width, in pixels, of this sublayer.
     * @type {Number}
     */
    get width() {
        return this._width;
    }

    set width(width) {
        this._width = width;
        this.svg.style.width = `${width}px`;
        this.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    }

    /**
     * @property {Number} height - the height, in pixels, of this sublayer.
     * @type {Number}
     */
    get height() {
        return this._height;
    }

    set height(height) {
        this._height = height;
        this.svg.style.height = `${height}px`;
        this.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    }
}