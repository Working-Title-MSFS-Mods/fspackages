class WT_MapViewBorderLayer extends WT_MapViewMultiLayer {
    constructor(className = WT_MapViewBorderLayer.CLASS_DEFAULT, configName = WT_MapViewBorderLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._borderLayer = new WT_MapViewCanvas(true, false);
        this.addSubLayer(this._borderLayer);

        this._renderQueue = new WT_MapViewRenderQueue();
        this._bufferedContext = new WT_MapViewBufferedCanvasContext(this._borderLayer.buffer.context, this._renderQueue);
        this._renderer = {
            canRender: this._canContinueRender.bind(this),
            render: this._resolveDrawCall.bind(this),
            onFinished: this._finishDrawBorders.bind(this)
        };

        this._loadBorderJSON(WT_MapViewBorderLayer.DATA_FILE_PATH);

        this._display = {
            viewCenter: new WT_GVector2(0, 0),
            topLeft: new WT_GVector2(0, 0),
            size: 1,
            margin: 0
        };

        this._referenceDisplayed = {
            range: new WT_NumberUnit(-1, WT_Unit.NMILE),
            center: new LatLong(0, 0),
            scaleFactor: 150,
            rotation: 0,
        };

        this._referenceUpdated = {
            range: new WT_NumberUnit(-1, WT_Unit.NMILE),
            center: new LatLong(0, 0),
            scaleFactor: 150,
            rotation: 0
        };

        this._optsManager = new WT_OptionsManager(this, WT_MapViewBorderLayer.OPTIONS_DEF);

        this._isReady = false;
        this._lastShowStateBorders = false;
        this._viewSizeChanged = false;
    }

    get isReady() {
        return this._isReady;
    }

    get borderLayer() {
        return this._borderLayer;
    }

    get projectionRenderer() {
        return this._projectionRenderer;
    }

    _loadBorderJSON(path) {
        let request = new XMLHttpRequest();
        request.overrideMimeType("application/json");

        request.addEventListener("load",
            (function() {
                this._loadData(request.responseText);
            }).bind(this)
        );
        request.open("GET", path);
        request.send();
    }

    _filterScaleRank(threshold, feature) {
        return feature.properties.scalerank <= threshold;
    }

    _createFeatureWrapper(feature) {
        return {
            feature: feature,
            geoBounds: d3.geoBounds(feature)
        };
    }

    _processFeaturesObject(topology, object, array, simplifyThreshold, scaleRankThreshold) {
        array.push(...topojson.feature(topojson.simplify(topology, simplifyThreshold), object).features.filter(
            this._filterScaleRank.bind(this, scaleRankThreshold)
        ).map(
            this._createFeatureWrapper.bind(this)
        ));
    }

    _processBorders(topology) {
        this._admin0Borders = [[], [], [], []];
        this._admin1Borders = [[], [], [], []];
        for (let i = 0; i < WT_MapViewBorderLayer.LOD_SIMPLIFY_THRESHOLDS.length; i++) {
            this._processFeaturesObject(topology, topology.objects.admin0Boundaries, this._admin0Borders[i], WT_MapViewBorderLayer.LOD_SIMPLIFY_THRESHOLDS[i], 2);
            this._processFeaturesObject(topology, topology.objects.admin0MapUnitBoundaries, this._admin0Borders[i], WT_MapViewBorderLayer.LOD_SIMPLIFY_THRESHOLDS[i], Infinity);
            this._processFeaturesObject(topology, topology.objects.admin1Boundaries, this._admin1Borders[i], WT_MapViewBorderLayer.LOD_SIMPLIFY_THRESHOLDS[i], 2);
        }
    }

    _processPolygons(topology) {
        this._admin0Polygons = [];
        this._processFeaturesObject(topology, topology.objects.admin0MapUnitPolygons, this._admin0Polygons, 0.000003);

        this._admin1Polygons = [];
        this._processFeaturesObject(topology, topology.objects.admin1Polygons, this._admin1Polygons, 0.000003);
    }

    _loadData(data) {
        let topology = JSON.parse(data);
        let presimplified = topojson.presimplify(topology, topojson.sphericalTriangleArea);
        this._processBorders(presimplified);
        this._processPolygons(presimplified);
        this._isReady = true;
    }

    isVisible(data) {
        return data.model.borders.show;
    }

    _updateCanvasSize(data) {
        let long = Math.max(data.projection.viewWidth, data.projection.viewHeight);
        let size = long * WT_MapViewBorderLayer.OVERDRAW_FACTOR;

        let left = -(size - data.projection.viewWidth) / 2;
        let top = -(size - data.projection.viewHeight) / 2;
        this.projectionRenderer.projection.clipExtent([[left, top], [left + size, top + size]]);

        this._display.viewCenter.set(data.projection.viewCenter);
        this._display.topLeft.set(left, top);
        this._display.size = size;
        this._display.margin = long * (WT_MapViewBorderLayer.OVERDRAW_FACTOR - 1.41421356237) / 2;

        this.borderLayer.width = size;
        this.borderLayer.height = size;
        this.borderLayer.canvas.style.left = `${left}px`;
        this.borderLayer.canvas.style.top = `${top}px`;
        this.borderLayer.canvas.style.width = `${size}px`;
        this.borderLayer.canvas.style.height = `${size}px`;
    }

    onConfigLoaded(data) {
        for (let property of WT_MapViewBorderLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    onViewSizeChanged(data) {
        super.onViewSizeChanged(data);
        this._updateCanvasSize(data);
        this._viewSizeChanged = true;
    }

    onAttached(data) {
        this._projectionRenderer = data.projection.createRenderer();
        super.onAttached(data);
    }

    _cullFeatureToDraw(data, feature) {
        let min = data.projection.project(feature.geoBounds[0]);
        let max = data.projection.project(feature.geoBounds[1]);
        let left = Math.min(min[0], max[0]);
        let right = Math.max(min[0], max[0]);
        let top = Math.min(min[1], max[1]);
        let bottom = Math.max(min[1], max[1]);

        let clipExtent = this.projectionRenderer.projection.clipExtent();

        return left <= clipExtent[1][0] &&
               right >= clipExtent[0][0] &&
               top < clipExtent[1][1] &&
               bottom >= clipExtent[0][1];
    }

    _clearCanvas() {
        this.borderLayer.context.clearRect(0, 0, this.borderLayer.width, this.borderLayer.height);
    }

    _calculateTransform(data, reference) {
        let scale = data.projection.scaleFactor / reference.scaleFactor;
        let rotation = data.projection.rotation - reference.rotation;
        let centerOffset = data.projection.projectLatLong(reference.center).subtract(data.projection.viewCenter, true);
        let margin = this._display.margin * scale;
        return {scale: scale, rotation: rotation, centerOffset: centerOffset, margin: margin};
    }

    _updateTransform(data) {
        let transform = this._calculateTransform(data, this._referenceDisplayed);
        transform.centerOffset.scale(1 / transform.scale, true);
        this.borderLayer.canvas.style.transform = `scale(${transform.scale}) translate(${transform.centerOffset.x}px, ${transform.centerOffset.y}px) rotate(${transform.rotation}deg)`;
    }

    _selectLOD(viewResolution) {
        for (let i = WT_MapViewBorderLayer.LOD_RESOLUTION_THRESHOLDS.length - 1; i >= 0; i--) {
            if (viewResolution.compare(WT_MapViewBorderLayer.LOD_RESOLUTION_THRESHOLDS[i]) >= 0) {
                return i;
            }
        }
        return 0;
    }

    _enqueueFeaturesToDraw(data, features, lod) {
        for (let feature of features[lod].filter(this._cullFeatureToDraw.bind(this, data))) {
            this.projectionRenderer.renderCanvas(feature.feature, this._bufferedContext);
        }
    }

    _canContinueRender(current, renderCount, renderTime) {
        return renderTime < WT_MapViewBorderLayer.DRAW_TIME_BUDGET;
    }

    _resolveDrawCall(current, data) {
        this.borderLayer.buffer.context.resetTransform();
        this.borderLayer.buffer.context.translate(-this._display.topLeft.x, -this._display.topLeft.y);
        current();
    }

    _setReferenceUpdated(data) {
        this._referenceUpdated.range = data.projection.range;
        this._referenceUpdated.center = data.projection.center;
        this._referenceUpdated.scaleFactor = data.projection.scaleFactor;
        this._referenceUpdated.rotation = data.projection.rotation;
    }

    _copyReferenceUpdatedToDisplayed() {
        this._referenceDisplayed.range = this._referenceUpdated.range;
        this._referenceDisplayed.center = this._referenceUpdated.center;
        this._referenceDisplayed.scaleFactor = this._referenceUpdated.scaleFactor;
        this._referenceDisplayed.rotation = this._referenceUpdated.rotation;
    }

    _startDrawBorders(data) {
        this._setReferenceUpdated(data);
        data.projection.syncRenderer(this.projectionRenderer);

        let lod = this._selectLOD(data.projection.viewResolution);
        this._renderQueue.clear();
        this._enqueueFeaturesToDraw(data, this._admin0Borders, lod);
        if (data.model.borders.showStateBorders) {
            this._enqueueFeaturesToDraw(data, this._admin1Borders, lod);
        }

        this.borderLayer.buffer.context.resetTransform();
        this.borderLayer.buffer.context.clearRect(0, 0, this.borderLayer.width, this.borderLayer.height);
        this.borderLayer.buffer.context.beginPath();
        this._renderQueue.start(this._renderer, data);
    }

    _continueDrawBorders(data) {
        this._renderQueue.resume(this._renderer, data);
    }

    _applyStrokeToBuffer(lineWidth, strokeColor) {
        this.borderLayer.buffer.context.lineWidth = lineWidth;
        this.borderLayer.buffer.context.strokeStyle = strokeColor;
        this.borderLayer.buffer.context.stroke();
    }

    _finishDrawBorders(data) {
        if (this.outlineWidth > 0) {
            this._applyStrokeToBuffer((this.strokeWidth + 2 * this.outlineWidth) * data.dpiScale, this.outlineColor);
        }
        this._applyStrokeToBuffer(this.strokeWidth * data.dpiScale, this.strokeColor);

        this.borderLayer.buffer.context.resetTransform();
        this.borderLayer.context.clearRect(0, 0, this.borderLayer.width, this.borderLayer.height);
        this.borderLayer.copyBufferToCanvas();

        this._copyReferenceUpdatedToDisplayed();
        this._updateTransform(data);
    }

    onUpdate(data) {
        if (!this.isReady) {
            return;
        }

        let transform = this._calculateTransform(data, this._referenceUpdated);
        let centerOffsetXAbs = Math.abs(transform.centerOffset.x);
        let centerOffsetYAbs = Math.abs(transform.centerOffset.y);

        let isImageInvalid = !this._referenceUpdated.range.equals(data.projection.range) ||
                             (!data.model.borders.showStateBorders && this._lastShowStateBorders) ||
                             (centerOffsetXAbs > transform.margin || centerOffsetYAbs > transform.margin);

        let shouldRedraw = isImageInvalid ||
                           (data.model.borders.showStateBorders != this._lastShowStateBorders) ||
                           (centerOffsetXAbs > transform.margin * 0.75 || centerOffsetYAbs > transform.margin * 0.75);

        this._lastShowStateBorders = data.model.borders.showStateBorders;

        if (isImageInvalid) {
            this._clearCanvas();
        } else {
            this._updateTransform(data);
        }
        if (shouldRedraw) {
            this._startDrawBorders(data);
        } else if (this._renderQueue.isBusy) {
            this._continueDrawBorders(data);
        }
    }
}
WT_MapViewBorderLayer.CLASS_DEFAULT = "borderLayer";
WT_MapViewBorderLayer.CONFIG_NAME_DEFAULT = "border";
WT_MapViewBorderLayer.DATA_FILE_PATH = "/WorkingTitle/Pages/VCockpit/Instruments/Shared/Map/View/Data/boundaries.json";
WT_MapViewBorderLayer.LOD_SIMPLIFY_THRESHOLDS = [
    Number.MIN_VALUE,
    0.00000003,
    0.0000003,
    0.000003
];
WT_MapViewBorderLayer.LOD_RESOLUTION_THRESHOLDS = [
    WT_Unit.NMILE.createNumber(0),
    WT_Unit.NMILE.createNumber(0.06),
    WT_Unit.NMILE.createNumber(0.3),
    WT_Unit.NMILE.createNumber(0.9)
];
WT_MapViewBorderLayer.OVERDRAW_FACTOR = 1.66421356237;
WT_MapViewBorderLayer.DRAW_TIME_BUDGET = 5; // ms
WT_MapViewBorderLayer.OPTIONS_DEF = {
    strokeWidth: {default: 2, auto: true},
    strokeColor: {default: "white", auto: true},
    outlineWidth: {default: 0, auto: true},
    outlineColor: {default: "black", auto: true},
};
WT_MapViewBorderLayer.CONFIG_PROPERTIES = [
    "strokeWidth",
    "strokeColor",
    "outlineWidth",
    "outlineColor",
];