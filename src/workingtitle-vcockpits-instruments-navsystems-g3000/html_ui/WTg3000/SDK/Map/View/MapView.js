/**
 * A view implementation of a navigational map. The base view only maintains a map projection and a viewing window.
 * Additional graphical features are added to the view through the use of layers.
 */
class WT_MapView extends HTMLElement {
    constructor() {
        super();

        this._dpiScale = 1;
        this._projection = WT_MapProjection.createProjection(WT_MapProjection.Projection.MERCATOR);
        this._viewPlane = new WT_GVector2(0, 0);
        this._state = new WT_MapViewState(this);

        this._layers = [];

        this._configLoaded = false;

        this._lastWidth = 0;
        this._lastHeight = 0;
        this._lastModel = undefined;
        this._lastProjection = this._projection;
        this._lastDPIScale = 1;

        this.setTargetOffsetHandler({getTargetOffset(model, offset) {offset.set(0, 0);}});
        this.setRangeInterpreter({getTrueRange(model, range) {range.set(model.range);}});

        this._targetOffsetTemp = new WT_GVector2(0, 0);
        this._trueRangeTemp = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._airplanePosition = new WT_GeoPoint(0, 0);
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
     * @property {WT_MapProjection} projection - the projection for this view.
     */
    get projection() {
        return this._projection;
    }

    /**
     * @readonly
     * @property {WT_GVector2ReadOnly} viewPlane - the projected location of the player aircraft in the viewing window.
     * @type {WT_GVector2ReadOnly}
     */
    get viewPlane() {
        return this._viewPlane.readonly();
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
    }

    /**
     * Sets the projection for this view.
     * @param {WT_MapProjection} projection
     */
    setProjection(projection) {
        this._projection = projection;
        if (this.model) {
            this._updateProjection();
        }
    }

    /**
     * Sets this view's target offset handler. The target offset handler defines the target offset of this view's map projection
     * by implementing the getTargetOffset() method. The getTargetOffset() method should set the supplied offset argument to the
     * desired target offset.
     * @param {{getTargetOffset(model:WT_MapModel, offset:WT_GVector2)}} handler
     */
    setTargetOffsetHandler(handler) {
        this._targetOffsetHandler = handler;
    }

    /**
     * Sets this view's range interpreter. The target offset handler defines how this view should interpret the nominal range set
     * by the model by implementing the getTrueRange() method. The getTrueRange() method should set the supplied range argument
     * to the desired range.
     * @param {{getTrueRange(model:WT_MapModel, range:WT_NumberUnit)}} interpreter
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

    _checkProjectionViewChanged() {
        let currentWidth = this.viewWidth;
        let currentHeight = this.viewHeight;

        let changed = currentWidth !== this._lastWidth ||
                      currentHeight !== this._lastHeight ||
                      this.dpiScale !== this._lastDPIScale ||
                      this.projection !== this._lastProjection;

        this._lastWidth = currentWidth;
        this._lastHeight = currentHeight;
        this._lastDPIScale = this.dpiScale;
        this._lastProjection = this.projection;

        return changed;
    }

    _checkModelChanged() {
        this.model !== this._lastModel;
        this._lastModel = this.model;
    }

    _updateProjection() {
        if (!this.model) {
            return;
        }

        this._targetOffsetHandler.getTargetOffset(this.model, this._targetOffsetTemp);
        this._rangeInterpreter.getTrueRange(this.model, this._trueRangeTemp);

        this.projection.setOptions({
            _viewWidth: this.viewWidth,
            _viewHeight: this.viewHeight,
            _target: this.model.target,
            _viewTargetOffset: this.projection.relXYToAbsXY(this._targetOffsetTemp, this._targetOffsetTemp),
            _rotation: this.model.rotation,
            _range: this._trueRangeTemp
        });

        if (this.model.airplane) {
            this.projection.project(this.model.airplane.position(this._airplanePosition), this._viewPlane);
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

        let viewSizeChanged = this._checkProjectionViewChanged();
        let modelChanged = this._checkModelChanged();
        this._currentTime = Date.now();
        this._updateProjection();

        for (let layerContainer of this._layers) {
            if (!layerContainer.isInitialized) {
                layerContainer.init(this._state, this._config[layerContainer.layer.configName]);
            } else {
                if (modelChanged) {
                    layerContainer.layer.onModelChanged(this._state);
                }
                if (viewSizeChanged) {
                    layerContainer.layer.onProjectionViewChanged(this._state);
                }
            }
            if (layerContainer.layer.isEnabled() && layerContainer.layer.isVisible(this._state)) {
                layerContainer.container.style.display = "block";
                layerContainer.layer.onUpdate(this._state);
            } else {
                layerContainer.container.style.display = "none";
            }
        }
    }
}

/**
 * A read-only interface for the state of a map view.
 */
class WT_MapViewState {
    /**
     * @param {WT_MapView} view
     */
    constructor(view) {
        this._view = view;
    }

    /**
     * @readonly
     * @property {WT_MapModel} model
     * @type {WT_MapModel}
     */
    get model() {
        return this._view.model;
    }

    /**
     * @readonly
     * @property {Number} dpiScale
     * @type {Number}
     */
    get dpiScale() {
        return this._view.dpiScale;
    }

    /**
     * @readonly
     * @property {WT_MapProjectionReadOnly} projection
     * @type {WT_MapProjectionReadOnly}
     */
    get projection() {
        return this._view.projection.readonly();
    }

    /**
     * @readonly
     * @property {WT_GVector2ReadOnly} viewPlane
     * @type {WT_GVector2ReadOnly}
     */
    get viewPlane() {
        return this._view.viewPlane;
    }

    /**
     * @readonly
     * @property {Number} currentTime
     * @type {Number}
     */
    get currentTime() {
        return this._view.currentTime;
    }
}

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