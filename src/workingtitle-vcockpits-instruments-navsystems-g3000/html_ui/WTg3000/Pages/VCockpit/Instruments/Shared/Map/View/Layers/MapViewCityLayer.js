class WT_MapViewCityLayer extends WT_MapViewMultiLayer {
    constructor(labelManager, className = WT_MapViewCityLayer.CLASS_DEFAULT, configName = WT_MapViewCityLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._labelManager = labelManager;

        /**
         * @type {WT_City[][]}
         */
        this._drawnCities = [[], [], []];

        /**
         * @type {Map<String,WT_MapViewRegisteredCityEntry>}
         */
        this._registeredCities = new Map();

        this._cityLayers = [
            new WT_MapViewPersistentCanvas(WT_MapViewCityLayer.OVERDRAW_FACTOR),
            new WT_MapViewPersistentCanvas(WT_MapViewCityLayer.OVERDRAW_FACTOR),
            new WT_MapViewPersistentCanvas(WT_MapViewCityLayer.OVERDRAW_FACTOR)
        ];
        this.addSubLayer(this._cityLayers[2]);
        this.addSubLayer(this._cityLayers[1]);
        this.addSubLayer(this._cityLayers[0]);

        this._searcher = new WT_CitySearcher(WT_MapViewCityLayer.DATA_PATH);
        /**
         * @type {WT_MapViewRenderQueue[]}
         */
        this._renderQueues = [];
        this._renderers = [];
        for (let size = 0; size < this._cityLayers.length; size++) {
            this._renderQueues.push(new WT_MapViewRenderQueue());
            this._renderers.push({
                canRender: this._canContinueRender.bind(this),
                render: this._renderCity.bind(this, size),
                onPaused: this._updateRenderCities.bind(this, size),
                onFinished: this._finishRenderCities.bind(this, size),
                onAborted: this._abortRenderCities.bind(this, size)
            });
        }

        this._labelCache = new WT_MapViewCityLabelCache(WT_MapViewCityLayer.LABEL_CACHE_SIZE);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewCityLayer.OPTIONS_DEF);

        this._tempVector = new WT_GVector2(0, 0);

        this._shouldDrawUnfinished = [false, false, false];
        this._lastShow = [false, false, false];
        this._redrawTimer = [0, 0, 0];
        this._lastTime = 0;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewCityLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    /**
     * Checks whether a type of symbol should be shown on the map according to the map model.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {Boolean} show - the map model's visibility value for the symbol type.
     * @param {WT_NumberUnit} range - the map model's maximum range value for the symbol type.
     * @returns {Boolean} whether the type of symbol should be shown according to the map model.
     */
    _shouldShowSymbolFromModel(state, show, range) {
        return show && state.model.range.compare(range) <= 0;
    }

    /**
     *
     * @param {WT_City} city
     */
    _registerCity(city) {
        let entry = this._registeredCities.get(city.uniqueID);
        if (!entry) {
            this._registeredCities.set(city.uniqueID, {city: city, label: this._getLabel(city), showLabel: false});
        }
    }

    /**
     *
     * @param {WT_City} city
     */
    _deregisterCity(city) {
        let entry = this._registeredCities.get(city.uniqueID);
        if (entry) {
            if (entry.showLabel) {
                this._labelManager.remove(entry.label);
            }
            this._registeredCities.delete(city.uniqueID);
        }
    }

    /**
     *
     * @param {Number} size
     */
    _deregisterAll(size) {
        for (let city of this._drawnCities[size]) {
            this._deregisterCity(city);
        }
    }

    _clearDrawnCities(size) {
        this._deregisterAll(size);
        this._drawnCities[size] = [];
    }

    _canContinueRender(current, renderCount, renderTime) {
        return renderTime < WT_MapViewCityLayer.DRAW_TIME_BUDGET;
    }

    /**
     *
     * @param {WT_City} city
     */
    _getLabel(city) {
        let label = this._labelCache.getLabel(city, this.labelPriority[city.size]);
        label.offset = this.labelOffset[city.size];
        label.fontSize = this.labelFontSize[city.size];
        label.fontColor = this.labelFontColor[city.size];
        label.fontOutlineWidth = this.labelFontOutlineWidth[city.size];
        label.fontOutlineColor = this.labelFontOutlineColor[city.size];
        return label;
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_City} city
     * @param {WT_MapViewPersistentCanvas} layer
     */
    _drawIcon(state, city, layer) {
        let viewPosition = layer.buffer.projectionRenderer.project(city.location, this._tempVector);
        let radius = this.iconSize[city.size] * state.dpiScale / 2;
        layer.buffer.context.beginPath();
        layer.buffer.context.arc(viewPosition.x, viewPosition.y, radius, 0, 2 * Math.PI);
        layer.buffer.context.stroke();
        layer.buffer.context.fill();
    }

    _renderCity(size, city, state) {
        this._drawIcon(state, city, this._cityLayers[size]);
        this._drawnCities[size].push(city);
        if (this._shouldDrawUnfinished[size]) {
            this._registerCity(city);
        }
    }

    _drawCitiesToDisplay(size, state) {
        let layer = this._cityLayers[size];
        layer.redrawDisplay(state);
    }

    _updateRenderCities(size, state) {
        if (this._shouldDrawUnfinished[size]) {
            this._drawCitiesToDisplay(size, state);
        }
    }

    _finishRenderCities(size, state) {
        this._drawCitiesToDisplay(size, state);
        if (!this._shouldDrawUnfinished[size]) {
            for (let city of this._drawnCities[size]) {
                this._registerCity(city);
            }
        }
        this._shouldDrawUnfinished[size] = false;
    }

    _abortRenderCities(size) {
        this._clearDrawnCities(size);
    }

    _enqueueCities(size) {
        let layer = this._cityLayers[size];
        let renderQueue = this._renderQueues[size];
        let cities = this._searcher.search(size, layer.buffer.reference.center, layer.buffer.reference.range);
        for (let city of cities) {
            renderQueue.enqueue(city);
        }
    }

    _startRenderCities(state, size) {
        let layer = this._cityLayers[size];
        let renderQueue = this._renderQueues[size];

        layer.resetBuffer(state);

        renderQueue.clear();
        this._enqueueCities(size);

        layer.buffer.context.fillStyle = this.iconFillColor[size];
        layer.buffer.context.lineWidth = 2 * this.iconOutlineWidth[size] * state.dpiScale;
        layer.buffer.context.strokeStyle = this.iconOutlineColor[size];
        renderQueue.start(this._renderers[size], state);
    }

    _continueRenderCities(state, size) {
        this._renderQueues[size].resume(state);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {Number} size
     * @param {Boolean} show
     */
    _updateLayer(state, size, show) {
        let layer = this._cityLayers[size];
        layer.update(state);

        let transform = layer.display.transform;
        let offsetXAbs = Math.abs(transform.offset.x);
        let offsetYAbs = Math.abs(transform.offset.y);

        let isDisplayInvalid = layer.display.isInvalid;
        let showChanged = show != this._lastShow[size];
        let shouldInvalidate = isDisplayInvalid ||
                               showChanged;

        let shouldRedraw = shouldInvalidate ||
                           (offsetXAbs > transform.margin * 0.9 || offsetYAbs > transform.margin * 0.9);

        if (shouldInvalidate) {
            layer.redrawDisplay(state, false);
            this._clearDrawnCities(size);
            this._shouldDrawUnfinished[size] = true;
        }
        if (show) {
            if (isDisplayInvalid) {
                // start timer
                this._redrawTimer[size] = WT_MapViewCityLayer.REDRAW_DELAY;
                return;
            }
            if (this._redrawTimer[size] > 0) {
                this._redrawTimer[size] -= state.currentTime - this._lastTime;
                if (this._redrawTimer[size] <= 0) {
                    shouldRedraw = true;
                } else {
                    return;
                }
            }

            if (shouldRedraw) {
                this._startRenderCities(state, size);
            } else if (this._renderQueues[size].isBusy) {
                this._continueRenderCities(state, size);
            }
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateRegisteredCities(state) {
        for (let entry of this._registeredCities.values()) {
            let show = state.projection.isInView(entry.label.city.location, 0.05);
            if (show && !entry.showLabel) {
                this._labelManager.add(entry.label);
            } else if (!show && entry.showLabel) {
                this._labelManager.remove(entry.label);
            }
            entry.showLabel = show;
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);
        if (!this._searcher.isReady) {
            return;
        }

        let show = [
            this._shouldShowSymbolFromModel(state, state.model.cities.show, state.model.cities.largeRange),
            this._shouldShowSymbolFromModel(state, state.model.cities.show, state.model.cities.mediumRange),
            this._shouldShowSymbolFromModel(state, state.model.cities.show, state.model.cities.smallRange)
        ];

        for (let size = show.length - 1; size >= 0; size--) {
            this._updateLayer(state, size, show[size]);
        }
        this._updateRegisteredCities(state);

        this._lastShow = show;
        this._lastTime = state.currentTime;
    }
}
WT_MapViewCityLayer.CLASS_DEFAULT = "cityLayer";
WT_MapViewCityLayer.CONFIG_NAME_DEFAULT = "cities";
WT_MapViewCityLayer.DATA_PATH = "/WTg3000/Pages/VCockpit/Instruments/Shared/Data/cities.json";
WT_MapViewCityLayer.LABEL_CACHE_SIZE = 1000;
WT_MapViewCityLayer.OVERDRAW_FACTOR = 1.91421356237;
WT_MapViewCityLayer.REDRAW_DELAY = 500 // ms
WT_MapViewCityLayer.DRAW_TIME_BUDGET = 1; // ms
WT_MapViewCityLayer.OPTIONS_DEF = {
    iconSize: {default: [25, 20, 15], auto: true},
    iconFillColor: {default: ["white", "white", "white"], auto: true},
    iconOutlineWidth: {default: [2, 2, 2], auto: true},
    iconOutlineColor: {default: ["black", "black", "black"], auto: true},

    labelFontSize: {default: [15, 15, 15], auto: true},
    labelFontColor: {default: ["white", "white", "white"], auto: true},
    labelFontOutlineWidth: {default: [6, 6, 6], auto: true},
    labelFontOutlineColor: {default: ["black", "black", "black"], auto: true},

    labelPriority: {default: [72, 71, 70], auto: true},
    labelOffset: {default: [{x: 0, y: -25}, {x: 0, y: -23}, {x: 0, y: -20}], auto: true}
};
WT_MapViewCityLayer.CONFIG_PROPERTIES = [
    "iconSize",
    "iconFillColor",
    "iconOutlineWidth",
    "iconOutlineColor",
    "labelFontSize",
    "labelFontColor",
    "labelFontOutlineWidth",
    "labelFontOutlineColor",
    "labelPriority",
    "labelOffset"
];

/**
 * @typedef WT_MapViewRegisteredCityEntry
 * @property {WT_City} city
 * @property {WT_MapViewCityLabel} label
 * @property {Boolean} showLabel
 */

class WT_MapViewCityLabel extends WT_MapViewSimpleTextLabel {
    /**
     * @param {WT_City} city - the city for which to create the new label.
     * @param {Number} priority - the priority for the new label.
     */
    constructor(city, priority) {
        super(city.name, priority);
        this._city = city;
        this._offset = new WT_GVector2(0, 0);

        this._anchor.set(0.5, 0.5);

        this._optsManager.addOptions(WT_MapViewCityLabel.OPTIONS_DEF);
    }

    /**
     * @readonly
     * @property {WT_City} city - the city to which this label belongs.
     * @type {WT_City}
     */
    get city() {
        return this._city;
    }

    /**
     * @property {WT_GVector2} offset - the offset, in pixel coordinates, of this label from the projected location of its city.
     * @type {WT_GVector2}
     */
    get offset() {
        return this._offset.readonly();
    }

    set offset(value) {
        this._offset.set(value);
    }

    /**
     * @param {WT_MapViewState} state
     */
    update(state) {
        state.projection.project(this.city.location, this._position);
        this._position.add(this.offset.x * state.dpiScale, this.offset.y * state.dpiScale);

        super.update(state);
    }
}
WT_MapViewCityLabel.OPTIONS_DEF = {
    offset: {}
};

/**
 * A cache for city labels.
 */
class WT_MapViewCityLabelCache {
    /**
     * @param {Number} size - the size of the new cache.
     */
    constructor(size) {
        this._cache = new Map();
        this._size = size;
    }

    /**
     * Retrieves a label from the cache for a city. If one cannot be found in the cache, a new label is added to the cache and
     * returned.
     * @param {WT_City} city - the city for which to get a label.
     * @param {Number} priority - the priority for the label, if a new one has to be created.
     * @returns {WT_MapViewCityLabel} a label for the waypoint.
     */
    getLabel(city, priority) {
        let existing = this._cache.get(city.uniqueID);
        if (!existing) {
            existing = new WT_MapViewCityLabel(city, priority);
            this._cache.set(city.uniqueID, existing);
            if (this._cache.size > this._size) {
                this._cache.delete(this._cache.keys().next().value);
            }
        }
        return existing;
    }
}