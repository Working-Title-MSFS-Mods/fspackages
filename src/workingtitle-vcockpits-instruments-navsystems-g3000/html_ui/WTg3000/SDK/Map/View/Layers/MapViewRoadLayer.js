/**
 * Road overlay. The use of this layer requires the .roads module to be added to the map model.
 */
class WT_MapViewRoadLayer extends WT_MapViewMultiLayer {
    /**
     * @param {WT_MapViewRoadData} roadData - the object from which to retrieve border data.
     * @param {WT_NumberUnit[]} lodResolutionThresholds - the map view window resolution thresholds to use when selecting a border LOD
     *                                                    level.
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(roadData, lodResolutionThresholds, className = WT_MapViewRoadLayer.CLASS_DEFAULT, configName = WT_MapViewRoadLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._roadData = roadData;
        this._lodResolutionThresholds = lodResolutionThresholds;

        this._roadLayers = [
            new WT_MapViewPersistentCanvas(WT_MapViewRoadLayer.OVERDRAW_FACTOR),
            new WT_MapViewPersistentCanvas(WT_MapViewRoadLayer.OVERDRAW_FACTOR),
        ];
        this.addSubLayer(this._roadLayers[1]);
        this.addSubLayer(this._roadLayers[0]);

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
        }

        this._optsManager = new WT_OptionsManager(this, WT_MapViewRoadLayer.OPTIONS_DEF);

        this._shouldDrawUnfinished = [false, false];
        this._lastShow = [false, false];
        this._redrawTimer = [0, 0];
        this._lastTime = 0;

        this._tempNM1 = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._tempNM2 = new WT_NumberUnit(0, WT_Unit.NMILE);
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.roads.show;
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

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapViewPersistentCanvas} layer
     * @param {WT_CanvasBufferedLinePathContext} bufferedContext
     * @param {WT_MapViewRoadFeature[]} features
     */
    _enqueueFeaturesToDraw(state, layer, bufferedContext, features) {
        for (let feature of features) {
            layer.buffer.projectionRenderer.renderCanvas(feature, bufferedContext);
        }
    }

    _canContinueRender(current, renderCount, renderTime) {
        return renderTime < WT_MapViewRoadLayer.DRAW_TIME_BUDGET;
    }

    _resolveDrawCall(type, current, state) {
        current();
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapViewRoadData.Type} type
     */
    _startRenderRoads(state, type) {
        let layer = this._roadLayers[type];
        let renderQueue = this._renderQueues[type];
        let bufferedContext = this._bufferedContexts[type];
        let renderer = this._renderers[type];

        layer.syncBuffer(state);

        let lod = this._selectLOD(state.projection.viewResolution);
        let searchRadius = this._tempNM1.set(state.projection.range).scale(WT_MapViewRoadLayer.OVERDRAW_FACTOR / 2, true);
        let minLength = this._tempNM2.set(state.projection.viewResolution).scale(1);
        renderQueue.clear();
        this._enqueueFeaturesToDraw(state, layer, bufferedContext, this._roadData.searchFeatures(type, lod, state.projection.center, searchRadius, minLength));

        this._lastLiveRender[type] = state.currentTime / 1000;

        bufferedContext.context.beginPath();
        renderQueue.start(renderer, state);
    }

    /**
     * @param {WT_MapViewState} state
     * @param {WT_MapViewRoadData.Type} type
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
     * @param {WT_MapViewRoadData.Type} type
     * @param {WT_MapViewState} state
     */
    _drawRoadsToDisplay(type, state) {
        let layer = this._roadLayers[type];
        let bufferedPathContext = this._bufferedContexts[type].context;
        layer.buffer.clear();

        if (this.outlineWidth > 0) {
            this._applyStrokeToContext(bufferedPathContext, (this.strokeWidth + 2 * this.outlineWidth) * state.dpiScale, this.outlineColor);
        }
        this._applyStrokeToContext(bufferedPathContext, this.strokeWidth * state.dpiScale, this.strokeColor);

        layer.syncDisplay(state);
    }

    /**
     * @param {WT_MapViewRoadData.Type} type
     * @param {WT_MapViewState} state
     */
    _updateRenderRoads(type, state) {
        if (this._shouldDrawUnfinished[type] && state.currentTime / 1000 - this._lastLiveRender[type] > this.liveRenderInterval) {
            this._drawRoadsToDisplay(type, state);
            this._lastLiveRender[type] = state.currentTime / 1000;
        }
    }

    /**
     * @param {WT_MapViewRoadData.Type} type
     * @param {WT_MapViewState} state
     */
    _finishRenderRoads(type, state) {
        this._drawRoadsToDisplay(type, state);
        this._roadLayers[type].resetBuffer();
        this._shouldDrawUnfinished[type] = false;
    }

    _abortRenderRoads() {
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapViewRoadData.Type} type
     * @param {Boolean} show
     */
    _updateLayer(state, type, show) {
        let layer = this._roadLayers[type];
        layer.update(state);

        let transform = layer.display.transform;
        let offsetXAbs = Math.abs(transform.offset.x);
        let offsetYAbs = Math.abs(transform.offset.y);

        let isDisplayInvalid = layer.display.isInvalid;
        let showChanged = show != this._lastShow[type];
        let shouldInvalidate = isDisplayInvalid ||
                               showChanged;

        let shouldPredraw = offsetXAbs > transform.margin * 0.9 || offsetYAbs > transform.margin * 0.9;

        if (shouldInvalidate) {
            layer.syncDisplay(state, false);
            this._shouldDrawUnfinished[type] = this.liveRender;
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

            if (shouldInvalidate || (shouldPredraw && !this._renderQueues[type].isBusy)) {
                this._startRenderRoads(state, type);
            } else if (this._renderQueues[type].isBusy) {
                this._continueRenderRoads(state, type);
            }
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        if (!this._roadData.isReady()) {
            return;
        }

        let show = [
            this._shouldShowSymbolFromModel(state, state.model.roads.show, state.model.roads.highwayRange),
            this._shouldShowSymbolFromModel(state, state.model.roads.show, state.model.roads.primaryRange)
        ];

        for (let type = show.length - 1; type >= 0; type--) {
            this._updateLayer(state, type, show[type]);
        }

        this._lastShow = show;
        this._lastTime = state.currentTime;
    }
}
WT_MapViewRoadLayer.CLASS_DEFAULT = "roadLayer";
WT_MapViewRoadLayer.CONFIG_NAME_DEFAULT = "roads";
WT_MapViewRoadLayer.OVERDRAW_FACTOR = 1.91421356237;
WT_MapViewRoadLayer.REDRAW_DELAY = 500; // ms
WT_MapViewRoadLayer.DRAW_TIME_BUDGET = 0.5; // ms
WT_MapViewRoadLayer.OPTIONS_DEF = {
    liveRender: {default: true, auto: true},
    liveRenderInterval: {default: 1, auto: true},
    strokeWidth: {default: 2, auto: true},
    strokeColor: {default: "#878787", auto: true},
    outlineWidth: {default: 0, auto: true},
    outlineColor: {default: "black", auto: true}
};
WT_MapViewRoadLayer.CONFIG_PROPERTIES = [
    "liveRender",
    "strokeWidth",
    "strokeColor",
    "outlineWidth",
    "outlineColor"
];