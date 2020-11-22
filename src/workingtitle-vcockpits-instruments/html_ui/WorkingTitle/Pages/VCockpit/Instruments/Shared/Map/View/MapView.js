/**
 * A view implementation of a navigational map. The base view only maintains a map projection and a viewing window.
 * Additional graphical features are added to the view through the use of layers.
 */
class WT_MapView extends HTMLElement {
    constructor() {
        super();

        this._dpiScale = 1;
        this._layers = [];

        this._configLoaded = false;

        this._lastWidth = 0;
        this._lastHeight = 0;
        this._lastPixelDensity = 1;

        this.setTargetOffsetHandler({getTargetOffset(model) {return {x: 0, y: 0}}});
        this.setRangeInterpreter({getTrueRange(model) {return model.range}});

        this._optsManager = new WT_OptionsManager(this, WT_MapView.OPTIONS_DEF);
    }

    static get observedAttributes() {
        return ["dpi-scale"];
    }

    connectedCallback() {
        let configPath;
        if (this.hasAttribute("config-path")) {
            configPath = this.getAttribute("config-path");
        }

        if (configPath) {
            this._fetchConfigData(configPath);
        } else {
            this._loadConfig("{}");
        }

        this.style.webkitClipPath = `polygon(0 0, 100% 0, 100% 100%, 0 100%)`;
        this.style.overflow = "hidden";
    }

    _fetchConfigData(path) {
        let request = new XMLHttpRequest();
        request.overrideMimeType("application/json");

        request.addEventListener("load",
            (function() {
                this._loadConfig(request.responseText);
            }).bind(this)
        );
        request.addEventListener("error",
            this._loadConfig.bind(this, "{}")
        );
        request.open("GET", path);
        request.send();
    }

    _loadConfig(data) {
        this._config = JSON.parse(data);
        this._configLoaded = true;
    }

    get templateID() {
        return "MapView";
    }

    /**
     * @readonly
     * @property {Number} viewWidth - the width, in pixels, of the viewing window.
     * @type {Number}
     */
    get viewWidth() {
        return this.clientWidth;
    }

    /**
     * @readonly
     * @property {Number} viewHeight - the height, in pixels, of the viewing window.
     * @type {Number}
     */
    get viewHeight() {
        return this.clientHeight;
    }

    /**
     * @readonly
     * @property {Number} dpiScale - the dpi scaling factor of the viewing window.
     * @type {Number}
     */
    get dpiScale() {
        return this._dpiScale;
    }

    /**
     * @readonly
     * @property {WT_MapModel} model - the model associated with this view.
     * @type {WT_MapModel}
     */
    get model() {
        return this._model;
    }

    /**
     * @readonly
     * @property {*} config - the config object for this view.
     */
    get config() {
        return this._config;
    }

    /**
     * @readonly
     * @property {WT_GVector2} viewPlane - the projected location of the player aircraft in the viewing window.
     * @type {WT_GVector2}
     */
    get viewPlane() {
        return this._viewPlane;
    }

    /**
     * @readonly
     * @property {Number} currentTime - the current time, in milliseconds since the Epoch.
     * @type {Number}
     */
    get currentTime() {
        return this._currentTime;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "dpi-scale") {
            this._dpiScale = parseFloat(newValue);
        }
    }

    /**
     * Sets the model for this view.
     * @param {WT_MapModel} model - a map model.
     */
    setModel(model) {
        if (!model) {
            return;
        }

        this._model = model;
        this._updateProjection();
        for (let layerContainer of this._layers) {
            layerContainer.layer.onModelChanged(this._optsManager.getOptionsFromList(WT_MapView.OPTIONS_TO_PASS));
        }
    }

    /**
     * Sets this view's target offset handler. The target offset handler defines the target offset of this view's map projection
     * by implementing the getTargetOffset() method. The getTargetOffset() method should return the offset of the projected location
     * of the map's target from center of the viewing window (in pixel coordinates)
     * @param {{getTargetOffset(model:WT_MapModel):{x:Number, y:Number}}} handler
     */
    setTargetOffsetHandler(handler) {
        this._targetOffsetHandler = handler;
    }

    /**
     * Sets this view's range interpreter. The target offset handler defines how this view should interpret the nominal range set
     * by the model by implementing the getTrueRange() method. The getTrueRange() method should return the top-to-bottom range
     * that this view's map projection should use.
     * @param {{getTrueRange(model:WT_MapModel):WT_NumberUnit}} interpreter
     */
    setRangeInterpreter(interpreter) {
        this._rangeInterpreter = interpreter;
    }

    /**
     * Adds a layer to this map view. When added, layers form a stack, with each layer always appearing above layers added before it.
     * @param {WT_MapViewLayer} layer - the layer to add.
     */
    addLayer(layer) {
        let layerContainer = new WT_MapViewLayerContainer(this, layer);
        this._layers.push(layerContainer);
        layerContainer.container.style.zIndex = this._layers.length;
    }

    /**
     * Removes a layer from this map view.
     * @param {WT_MapViewLayer} layer - the layer to remove.
     */
    removeLayer(layer) {
        let index = this._layers.findIndex(layerContainer => layerContainer.layer === layer);
        if (index >= 0) {
            this.removeLayerByIndex(index);
        }
    }

    /**
     * Removes a layer from this map view by index.
     * @param {Number} index - the index of the layer to remove.
     */
    removeLayerByIndex(index) {
        let removed = this._layers[index];
        if (removed) {
            removed.layer.onDetached();
            if (removed.container.parentNode == this) {
                this.removeChild(removed.container);
            }
            removed.layer.config = undefined;
            this._layers.splice(index, 1);
        }
    }

    _checkViewSizeChanged() {
        let currentWidth = this.viewWidth;
        let currentHeight = this.viewHeight;

        let changed = currentWidth != this._lastWidth || currentHeight != this._lastHeight || this.dpiScale != this._lastPixelDensity;

        this._lastWidth = currentWidth;
        this._lastHeight = currentHeight;
        this._lastPixelDensity = this.dpiScale;

        return changed;
    }

    _updateProjection() {
        if (!this.model) {
            return;
        }

        this.projection.setOptions({
            _viewWidth: this.viewWidth,
            _viewHeight: this.viewHeight,
            _target: this.model.target,
            _viewTargetOffset: this.projection.relXYToAbsXY(this._targetOffsetHandler.getTargetOffset(this.model)),
            _rotation: this.model.rotation,
            _range: this._rangeInterpreter.getTrueRange(this.model)
        });

        if (this.model.airplane) {
            this._viewPlane = this.projection.projectLatLong(this.model.airplane.position);
        }
    }

    /**
     * Indicates whether this map view is ready to begin rendering its graphical elements. To be considered ready, the map view
     * must have an associated model, it must have finished loading its config file, and it must have a non-zero-sized viewing window.
     * @returns {Boolean} whether this map view is ready to begin rendering.
     */
    isReady() {
        return this.model && this.viewWidth > 0 && this.viewHeight > 0 && this._configLoaded;
    }

    /**
     * Updates the map view. This method should be called every rendering frame.
     */
    update() {
        if (!this.isReady()) {
            return;
        }

        let viewSizeChanged = this._checkViewSizeChanged();
        this._currentTime = Date.now();
        this._updateProjection();

        let optionsToPass = this._optsManager.getOptionsFromList(WT_MapView.OPTIONS_TO_PASS);

        for (let layerContainer of this._layers) {
            if (!layerContainer.isInitialized) {
                layerContainer.init(optionsToPass, this._config[layerContainer.layer.configName]);
            } else if (viewSizeChanged) {
                layerContainer.layer.onViewSizeChanged(optionsToPass);
            }
            if (layerContainer.layer.isVisible(optionsToPass)) {
                layerContainer.container.style.display = "block";
                layerContainer.layer.onUpdate(optionsToPass);
            } else {
                layerContainer.container.style.display = "none";
            }
        }
    }
}
WT_MapView.OPTIONS_DEF = {
    model: {default: undefined, readOnly: true},
    dpiScale: {},
    projection: {default: WT_MapProjection.createProjection(WT_MapProjection.Projection.MERCATOR), auto: true},
    viewPlane: {readOnly: true},
    currentTime: {readOnly: true}
};
WT_MapView.OPTIONS_TO_PASS = ["model", "dpiScale", "projection", "viewPlane", "currentTime"];

/**
 * @typedef {Object} WT_MapViewState
 * @property {WT_MapModel} model - the current map model.
 * @property {Number} dpiScale - the current dpi scale.
 * @property {WT_MapProjection} projection - the current map projection.
 * @property {WT_GVector2} viewPlane - the current projected position of the player aircraft in the viewing window.
 * @property {Number} currentTime - the current time, in milliseconds since the Epoch.
 */

class WT_MapViewLayerContainer {
    constructor(view, layer) {
        this._view = view;
        this._layer = layer;
        this._isInit = false;

        this._container = document.createElement("div");
        this._container.style.position = "absolute";
        this._container.style.left = 0;
        this._container.style.top = 0;
        this._container.style.width = "100%";
        this._container.style.height = "100%";

        this._container.appendChild(layer.htmlElement);
    }

    get view() {
        return this._view;
    }

    get layer() {
        return this._layer;
    }

    get container() {
        return this._container;
    }

    get isInitialized() {
        return this._isInit;
    }

    init(state) {
        let config = this.view.config[this.layer.configName];
        if (config) {
            this.layer.config = config;
            this.layer.onConfigLoaded(state);
        }
        this.view.appendChild(this.container);
        this.layer.onAttached(state);
        this._isInit = true;
    }
}

customElements.define("map-view", WT_MapView);