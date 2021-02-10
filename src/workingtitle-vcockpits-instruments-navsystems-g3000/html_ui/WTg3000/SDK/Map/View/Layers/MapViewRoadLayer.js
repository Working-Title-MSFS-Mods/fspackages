/**
 * Road overlay. The use of this layer requires the .roads module to be added to the map model.
 */
class WT_MapViewRoadLayer extends WT_MapViewMultiLayer {
    /**
     * @param {WT_MapViewRoadFeatureCollection} roadFeatureData - the object from which to retrieve road feature data.
     * @param {WT_MapViewRoadLabelCollection[]} roadLabelData - objects from which to retrieve road label data.
     * @param {WT_NumberUnit[]} lodResolutionThresholds - the map view window resolution thresholds to use when selecting a LOD
     *                                                    level.
     * @param {WT_MapViewTextLabelManager} labelManager - the label manager to use for labels.
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(roadFeatureData, roadLabelData, lodResolutionThresholds, className = WT_MapViewRoadLayer.CLASS_DEFAULT, configName = WT_MapViewRoadLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._roadFeatureData = roadFeatureData;
        this._roadLabelData = roadLabelData;
        this._lodResolutionThresholds = lodResolutionThresholds;

        this._roadLayers = [
            new WT_MapViewPersistentCanvas(WT_MapViewRoadLayer.OVERDRAW_FACTOR),
            new WT_MapViewPersistentCanvas(WT_MapViewRoadLayer.OVERDRAW_FACTOR),
        ];
        this._labelLayer = new WT_MapViewCanvas(true, true);
        this.addSubLayer(this._roadLayers[1]);
        this.addSubLayer(this._roadLayers[0]);
        this.addSubLayer(this._labelLayer);

        this._labelManager = new WT_MapViewRoadLabelManager(this._labelLayer);

        /**
         * @type {WT_MapViewRenderQueue[]}
         */
        this._renderQueues = [];
        this._renderers = [];
        /**
         * @type {WT_CanvasBufferedLinePathContext[]}
         */
        this._bufferedContexts = [];
        this._lastLiveRender = [];
        this._toEnqueue = [];
        this._isValidated = [];
        for (let type = 0; type < this._roadLayers.length; type++) {
            let layer = this._roadLayers[type];
            let renderQueue = new WT_MapViewRenderQueue();
            this._renderQueues.push(renderQueue);
            this._renderers.push({
                canRender: this._canContinueRender.bind(this),
                render: this._resolveDrawCall.bind(this, type),
                onPaused: this._updateRenderRoads.bind(this, type),
                onFinished: this._finishRenderRoads.bind(this, type),
                onAborted: this._abortRenderRoads.bind(this, type)
            });
            let bufferedPathContext = new WT_CanvasBufferedLinePathContext(layer.buffer.canvas, layer.buffer.context);
            this._bufferedContexts.push(new WT_MapViewBufferedCanvasContext(bufferedPathContext, renderQueue));
            this._toEnqueue.push({id: 0, buffer: null, head: 0});
            this._isValidated.push(true);
        }

        this._needUpdateLabels = false;
        this._labelSearchID = [];

        this._optsManager = new WT_OptionsManager(this, WT_MapViewRoadLayer.OPTIONS_DEF);

        this._shouldDrawUnfinished = [false, false];
        this._lastShow = [false, false];
        this._redrawTimer = [0, 0];
        this._lastTime = 0;

        this._tempNM1 = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._tempNM2 = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._tempNM3 = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._tempNM4 = new WT_NumberUnit(0, WT_Unit.NMILE);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewRoadLayer.CONFIG_PROPERTIES) {
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
     * Selects an LOD level for a given map view window resolution.
     * @param {WT_NumberUnit} viewResolution - the resolution of the map view window, expressed as the geographic distance covered by one pixel.
     * @returns {Number} an LOD level.
     */
    _selectLOD(viewResolution) {
        for (let i = this._lodResolutionThresholds.length - 1; i >= 0; i--) {
            if (viewResolution.compare(this._lodResolutionThresholds[i]) >= 0) {
                return i;
            }
        }
        return 0;
    }

    _enqueueFeaturesLoop(id, type, resolve, reject) {
        let toEnqueue = this._toEnqueue[type];
        if (toEnqueue.id !== id) {
            reject();
            return;
        }
        let layer = this._roadLayers[type];
        let bufferedContext = this._bufferedContexts[type];
        let t0 = performance.now();
        while (toEnqueue.head < toEnqueue.buffer.length) {
            if (toEnqueue.head % 5 === 0 && performance.now() - t0 >= WT_MapViewRoadLayer.ENQUEUE_TIME_BUDGET) {
                break;
            }
            layer.buffer.projectionRenderer.renderCanvas(toEnqueue.buffer[toEnqueue.head], bufferedContext);
            toEnqueue.head++;
        }
        if (toEnqueue.head >= toEnqueue.buffer.length) {
            resolve();
        } else {
            requestAnimationFrame(this._enqueueFeaturesLoop.bind(this, id, type, resolve, reject));
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapViewRoadFeatureCollection.Type} type
     * @param {WT_MapViewRoadFeature[]} features
     * @returns {Promise<void>}
     */
    async _enqueueFeaturesToDraw(state, type, features) {
        try {
            this._renderQueues[type].clear();
            this._renderQueues[type].abort();
            let toEnqueue = this._toEnqueue[type];
            let id = ++toEnqueue.id;
            await new Promise((resolve, reject) => {
                toEnqueue.buffer = features;
                toEnqueue.head = 0;
                this._enqueueFeaturesLoop(id, type, resolve, reject);
            });
            if (id === toEnqueue.id) {
                toEnqueue.buffer = null;
                toEnqueue.head = 0;
                return true;
            }
        } catch (e) {
        }
        return false;
    }

    _canContinueRender(current, renderCount, renderTime) {
        return current.name !== "bound moveTo" || renderTime < WT_MapViewRoadLayer.DRAW_TIME_BUDGET;
    }

    _resolveDrawCall(type, current, state) {
        current();
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapViewRoadFeatureCollection.Type} type
     */
    async _startRenderRoads(state, type) {
        let layer = this._roadLayers[type];
        let renderQueue = this._renderQueues[type];
        let bufferedContext = this._bufferedContexts[type];
        let renderer = this._renderers[type];
        let toEnqueue = this._toEnqueue[type];

        layer.syncBuffer(state);

        let lod = this._selectLOD(state.projection.viewResolution);
        let searchRadius = this._tempNM1.set(state.projection.range).scale(WT_MapViewRoadLayer.OVERDRAW_FACTOR / 2, true);
        let minLength = this._tempNM2.set(state.projection.viewResolution).scale(1);
        let features = this._roadFeatureData.search(type, lod, state.projection.center, searchRadius, minLength);
        try {
            let id = toEnqueue.id + 1;
            let enqueued = await this._enqueueFeaturesToDraw(state, type, features);
            if (enqueued && id === toEnqueue.id) {
                this._lastLiveRender[type] = state.currentTime / 1000;
                bufferedContext.context.beginPath();
                renderQueue.start(renderer, state);
            }
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * @param {WT_MapViewState} state
     * @param {WT_MapViewRoadFeatureCollection.Type} type
     */
    _continueRenderRoads(state, type) {
        this._renderQueues[type].resume(state);
    }

    _applyStrokeToContext(context, lineWidth, strokeColor) {
        context.lineWidth = lineWidth;
        context.strokeStyle = strokeColor;
        context.stroke();
    }

    /**
     * @param {WT_MapViewRoadFeatureCollection.Type} type
     * @param {WT_MapViewState} state
     */
    _drawRoadsToBuffer(type, state) {
        let bufferedPathContext = this._bufferedContexts[type].context;

        if (this.outlineWidth > 0) {
            this._applyStrokeToContext(bufferedPathContext, (this.strokeWidth + 2 * this.outlineWidth) * state.dpiScale, this.outlineColor);
        }
        this._applyStrokeToContext(bufferedPathContext, this.strokeWidth * state.dpiScale, this.strokeColor);

        bufferedPathContext.beginPath();
    }

    /**
     * @param {WT_MapViewRoadFeatureCollection.Type} type
     * @param {WT_MapViewState} state
     */
    _updateRenderRoads(type, state) {
        this._drawRoadsToBuffer(type, state);
        if (this._shouldDrawUnfinished[type] && state.currentTime / 1000 - this._lastLiveRender[type] > this.liveRenderInterval) {
            this._roadLayers[type].syncDisplay(state);
            this._lastLiveRender[type] = state.currentTime / 1000;
        }
    }

    /**
     * @param {WT_MapViewRoadFeatureCollection.Type} type
     * @param {WT_MapViewState} state
     */
    _finishRenderRoads(type, state) {
        this._drawRoadsToBuffer(type, state);
        this._roadLayers[type].syncDisplay(state);
        this._roadLayers[type].resetBuffer();
        this._shouldDrawUnfinished[type] = false;
        this._validate(type);
    }

    _abortRenderRoads() {

    }

    _clearLabels() {
        this._labelManager.clear();
    }

    _cancelLabelSearches() {
        for (let i = 0; i < this._roadLabelData; i++) {
            let searchID = this._labelSearchID[i];
            if (searchID !== null) {
                this._roadLabelData[i].cancelSearch(searchID);
            }
        }
    }

    async _searchLabels(labelDataIndex, center, radius, types, restrictionDistance, labelDistance, repeatDistance) {
        let labelData = this._roadLabelData[labelDataIndex];
        let search = labelData.search(center, radius, types, restrictionDistance, labelDistance, repeatDistance);
        this._labelSearchID[labelDataIndex] = search.id;
        let labels = await search.execute();

        if (this._labelSearchID[labelDataIndex] !== search.id) {
            return;
        }

        for (let label of labels) {
            this._labelManager.register(label);
        }
        this._labelSearchID[labelDataIndex] = null;
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    async _updateLabels(state, show) {
        this._needUpdateLabels = false;
        this._clearLabels();
        this._cancelLabelSearches();

        let types = [];
        for (let i = 0; i < show.length; i++) {
            if (show[i]) {
                types.push(i);
            }
        }
        if (types.length === 0) {
            return;
        }

        let searchRadius = this._tempNM1.set(state.projection.range).scale(WT_MapViewRoadLayer.OVERDRAW_FACTOR / 2, true);
        let restrictionDistance = this._tempNM2.set(state.projection.viewResolution).scale(this.labelRestrictionDistance, true);
        let labelDistance = this._tempNM3.set(state.projection.viewResolution).scale(this.labelSeparationDistance, true);
        let repeatDistance = this._tempNM4.set(state.projection.viewResolution).scale(this.labelRepeatDistance, true);

        try {
            for (let i = 0; i < this._roadLabelData.length; i++) {
                await this._searchLabels(i, state.projection.center, searchRadius, types, restrictionDistance, labelDistance, repeatDistance);
            }
        } catch (e) {
            console.log(e);
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapViewRoadFeatureCollection.Type} type
     * @param {Boolean} show
     */
    _updateLayer(state, type, show) {
        let layer = this._roadLayers[type];
        layer.update(state);

        let transform = layer.display.transform;
        let offsetXAbs = Math.abs(transform.offset.x);
        let offsetYAbs = Math.abs(transform.offset.y);

        let isDisplayInvalid = layer.display.isInvalid;
        let showChanged = show !== this._lastShow[type];
        let shouldInvalidate = isDisplayInvalid ||
                               showChanged;

        let shouldPredraw = offsetXAbs > transform.margin * 0.9 || offsetYAbs > transform.margin * 0.9;

        if (shouldInvalidate) {
            layer.syncDisplay(state, false);
            if (show || showChanged) {
                this._invalidate(type);
            }
        }
        if (show) {
            if (isDisplayInvalid) {
                // start timer
                this._redrawTimer[type] = WT_MapViewRoadLayer.REDRAW_DELAY;
                return;
            }
            if (this._redrawTimer[type] > 0) {
                this._redrawTimer[type] -= state.currentTime - this._lastTime;
                if (this._redrawTimer[type] <= 0) {
                    shouldInvalidate = true;
                } else {
                    return;
                }
            }

            if (shouldInvalidate || (shouldPredraw && !this._renderQueues[type].isBusy && this._toEnqueue[type].buffer === null)) {
                this._shouldDrawUnfinished[type] = shouldInvalidate && this.liveRender;
                this._startRenderRoads(state, type);
            } else if (this._renderQueues[type].isBusy) {
                this._continueRenderRoads(state, type);
            }
        } else if (showChanged) {
            this._validate(type);
        }
    }

    _isAllValidated() {
        for (let i = 0; i < this._isValidated.length; i++) {
            if (!this._isValidated[i]) {
                return false;
            }
        }
        return true;
    }

    _invalidate(type) {
        this._isValidated[type] = false;
        this._clearLabels();
        this._needUpdateLabels = false;
    }

    _validate(type) {
        this._isValidated[type] = true;
        this._needUpdateLabels = this._isAllValidated();
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        if (!this._roadFeatureData.isReady()) {
            return;
        }

        let show = [
            this._shouldShowSymbolFromModel(state, state.model.roads.show, state.model.roads.highwayRange),
            this._shouldShowSymbolFromModel(state, state.model.roads.show, state.model.roads.primaryRange)
        ];

        for (let type = show.length - 1; type >= 0; type--) {
            this._updateLayer(state, type, show[type]);
        }

        if (this._needUpdateLabels) {
            this._updateLabels(state, show);
        }
        this._labelManager.update(state);

        this._lastShow = show;
        this._lastTime = state.currentTime;
    }
}
WT_MapViewRoadLayer.CLASS_DEFAULT = "roadLayer";
WT_MapViewRoadLayer.CONFIG_NAME_DEFAULT = "roads";
WT_MapViewRoadLayer.OVERDRAW_FACTOR = 1.91421356237;
WT_MapViewRoadLayer.REDRAW_DELAY = 500; // ms
WT_MapViewRoadLayer.ENQUEUE_TIME_BUDGET = 1; // ms
WT_MapViewRoadLayer.DRAW_TIME_BUDGET = 0.5; // ms
WT_MapViewRoadLayer.OPTIONS_DEF = {
    liveRender: {default: true, auto: true},
    liveRenderInterval: {default: 1, auto: true}, // seconds
    labelRestrictionDistance: {default: 20, auto: true}, // pixels
    labelSeparationDistance: {default: 50, auto: true}, // pixels
    labelRepeatDistance: {default: 300, auto: true}, // pixels

    strokeWidth: {default: 2, auto: true},
    strokeColor: {default: "#878787", auto: true},
    outlineWidth: {default: 0, auto: true},
    outlineColor: {default: "black", auto: true}
};
WT_MapViewRoadLayer.CONFIG_PROPERTIES = [
    "liveRender",
    "liveRenderInterval",
    "labelRestrictionDistance",
    "labelSeparationDistance",
    "labelRepeatDistance",
    "strokeWidth",
    "strokeColor",
    "outlineWidth",
    "outlineColor"
];

/**
 * A manager for map road labels which keeps track of a list of labels and renders them to a
 * canvas. The rendering order of labels is based on their priority; labels with higher priority
 * values will always be rendered above labels with lower priority values.
 */
class WT_MapViewRoadLabelManager {
    /**
     * @param {WT_MapViewCanvas} layer - the canvas sublayer to which to draw labels.
     */
    constructor(layer) {
        this._layer = layer;

        /**
         * @type {WT_SortedArray<WT_MapViewRoadLabel>}
         */
        this._registered = new WT_SortedArray((a, b) => a.priority - b.priority);
    }

    /**
     * Deregisters all labels from this manager.
     */
    clear() {
        this._registered.clear();
    }

    /**
     * Registers a label with this manager. Registered labels are rendered on every update.
     * @param {WT_MapViewCanvas} label - the label to register.
     */
    register(label) {
        this._registered.insert(label);
    }

    /**
     * Deregisters a label with this manager. Once a label is deregistered, it will no longer
     * be rendered.
     * @param {WT_MapViewCanvas} label - the label to deregister.
     */
    deregister(label) {
        this._registered.remove(label);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapViewRoadLabel} label
     */
    _renderLabel(state, label) {
        label.draw(state, this._layer.buffer.context);
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    update(state) {
        this._layer.buffer.clear();
        this._registered.array.forEach(this._renderLabel.bind(this, state));
        this._layer.display.clear();
        this._layer.copyBufferToCanvas();
        this._layer.resetBuffer();
    }
}