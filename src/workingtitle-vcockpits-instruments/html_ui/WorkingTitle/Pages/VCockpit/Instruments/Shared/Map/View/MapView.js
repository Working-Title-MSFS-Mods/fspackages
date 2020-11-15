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
        this.setRangeInterpreter({getRangeFactor(model) {return 1}});

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

    get viewWidth() {
        return this.clientWidth;
    }

    get viewHeight() {
        return this.clientHeight;
    }

    get dpiScale() {
        return this._dpiScale;
    }

    get model() {
        return this._model;
    }

    get config() {
        return this._config;
    }

    get viewPlane() {
        return this._viewPlane;
    }

    get currentTime() {
        return this._currentTime;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "dpi-scale") {
            this._dpiScale = parseFloat(newValue);
        }
    }

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

    setTargetOffsetHandler(handler) {
        this._targetOffsetHandler = handler;
    }

    setRangeInterpreter(interpreter) {
        this._rangeInterpreter = interpreter;
    }

    addLayer(layer) {
        let layerContainer = new WT_MapViewLayerContainer(this, layer);
        this._layers.push(layerContainer);
        layerContainer.container.style.zIndex = this._layers.length;
    }

    removeLayer(layer) {
        let index = this._layers.findIndex(layerContainer => layerContainer.layer === layer);
        if (index >= 0) {
            this.removeLayerByIndex(index);
        }
    }

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

    removeLayerByName(name) {
        let index = this._layers.findIndex(layerContainer => layerContainer.layer.name === name);
        if (index >= 0) {
            this.removeLayerByIndex(index);
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
            _range: new WT_NumberUnit(this.model.range.asUnit(WT_Unit.METER) / this._rangeInterpreter.getRangeFactor(this.model), WT_Unit.METER)
        });

        if (this.model.airplane) {
            this._viewPlane = this.projection.projectLatLong(this.model.airplane.position);
        }
    }

    isReady() {
        return this.model && this.viewWidth > 0 && this.viewHeight > 0 && this._configLoaded;
    }

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

    init(data) {
        let config = this.view.config[this.layer.configName];
        if (config) {
            this.layer.config = config;
            this.layer.onConfigLoaded(data);
        }
        this.view.appendChild(this.container);
        this.layer.onAttached(data);
        this._isInit = true;
    }
}

customElements.define("map-view", WT_MapView);