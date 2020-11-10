class WT_MapView extends HTMLElement {
    constructor() {
        super();

        this._layers = [];

        this._lastWidth = 0;
        this._lastHeight = 0;

        this.setTargetOffsetHandler({getTargetOffset(model) {return {x: 0, y: 0}}});
        this.setRangeInterpreter({getRangeFactor(model) {return 1}});

        this._optsManager = new WT_OptionsManager(this, WT_MapView.OPTIONS_DEF);
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
        for (layer of this._layers) {
            this._loadLayerConfig(layer);
        }
    }

    _loadLayerConfig(layer) {
        if (this._config[layer.configName]) {
            layer.config = this._config[layer.configName];
            layer.onConfigLoaded();
        }
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

    get model() {
        return this._model;
    }

    get viewPlane() {
        return this._viewPlane;
    }

    setModel(model) {
        if (!model) {
            return;
        }

        this._model = model;
        this._updateProjection();
        for (let layer of this._layers) {
            layer.onModelChanged(this._optsManager.getOptionsFromList(WT_MapView.OPTIONS_TO_PASS));
        }
    }

    setTargetOffsetHandler(handler) {
        this._targetOffsetHandler = handler;
    }

    setRangeInterpreter(interpreter) {
        this._rangeInterpreter = interpreter;
    }

    addLayer(layer) {
        this._layers.push(layer);
        if (this._configLoaded) {
            this._loadLayerConfig(layer);
        }
        this.appendChild(layer.htmlElement);
        layer.onAttached(this._optsManager.getOptionsFromList(WT_MapView.OPTIONS_TO_PASS));
    }

    removeLayer(layer) {
        let index = this._layers.indexOf(layer);
        if (index >= 0) {
            this.removeLayerByIndex(index);
        }
    }

    removeLayerByIndex(index) {
        let removed = this._layers[index];
        if (removed) {
            removed.onDetached();
            if (removed.htmlElement.parentNode == this) {
                this.removeChild(removed.htmlElement);
            }
            removed.config = undefined;
            this._layers.splice(index, 1);
        }
    }

    removeLayerByName(name) {
        let index = this._layers.findIndex(layer => layer.name === name);
        if (index >= 0) {
            this.removeLayerByIndex(index);
        }
    }

    _checkViewSizeChanged() {
        let currentWidth = this.viewWidth;
        let currentHeight = this.viewHeight;

        let changed = currentWidth != this._lastWidth || currentHeight != this._lastHeight

        this._lastWidth = currentWidth;
        this._lastHeight = currentHeight;

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

    update() {
        let viewSizeChanged = this._checkViewSizeChanged();
        this._updateProjection();

        let optionsToPass = this._optsManager.getOptionsFromList(WT_MapView.OPTIONS_TO_PASS);

        for (let layer of this._layers) {
            if (layer.isVisible(optionsToPass)) {
                if (viewSizeChanged) {
                    layer.onViewSizeChanged(optionsToPass);
                }
                Avionics.Utils.diffAndSetAttribute(layer.htmlElement, "display", "block");
                layer.onUpdate(optionsToPass);
            } else {
                Avionics.Utils.diffAndSetAttribute(layer.htmlElement, "display", "none");
            }
        }
    }
}
WT_MapView.OPTIONS_DEF = {
    model: {default: undefined, readOnly: true},
    projection: {default: WT_MapProjection.createProjection(WT_MapProjection.Projection.MERCATOR), auto: true},
    viewPlane: {default: undefined, auto: true}
};
WT_MapView.OPTIONS_TO_PASS = ["model", "viewWidth", "viewHeight", "projection", "viewPlane"];

customElements.define("map-view", WT_MapView);