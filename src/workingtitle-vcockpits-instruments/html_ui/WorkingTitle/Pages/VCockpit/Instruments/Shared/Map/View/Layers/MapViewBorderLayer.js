class WT_MapViewBorderLayer extends WT_MapViewMultiLayer {
    constructor(labelManager, className = WT_MapViewBorderLayer.CLASS_DEFAULT, configName = WT_MapViewBorderLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._labelManager = labelManager;

        this._borderLayer = new WT_MapViewCanvas(true, false);
        this.addSubLayer(this._borderLayer);

        this._renderQueue = new WT_MapViewRenderQueue();
        this._bufferedContext = new WT_MapViewBufferedCanvasContext(this._borderLayer.buffer.context, this._renderQueue);
        this._renderer = {
            canRender: this._canContinueRender.bind(this),
            render: this._resolveDrawCall.bind(this),
            onPaused: this._updateDrawBorders.bind(this),
            onFinished: this._finishDrawBorders.bind(this)
        };

        this._labelCache = new WT_MapViewBorderLabelCache();
        this._labelsToShow = new Set();

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
        this._drawUnfinishedBorders = false;
    }

    get isReady() {
        return this._isReady;
    }

    get labelManager() {
        return this._labelManager;
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

    _createFeatureInfo(feature) {
        let bounds = d3.geoBounds(feature);
        // avoid +90 or -90 latitude
        bounds[0][1] = Math.min(89.9, Math.max(-89.9, bounds[0][1]));
        bounds[1][1] = Math.min(89.9, Math.max(-89.9, bounds[1][1]));

        return {
            feature: feature,
            geoBounds: bounds,
            geoCentroid: d3.geoCentroid(feature),
            geoArea: d3.geoArea(feature)
        };
    }

    _processFeaturesObject(topology, object, array, simplifyThreshold, scaleRankThreshold) {
        array.push(...topojson.feature(topojson.simplify(topology, simplifyThreshold), object).features.filter(
            this._filterScaleRank.bind(this, scaleRankThreshold)
        ).map(
            this._createFeatureInfo.bind(this)
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
        this._processFeaturesObject(topology, topology.objects.admin0Polygons, this._admin0Polygons, Number.MIN_VALUE, Infinity);

        this._admin1Polygons = [];
        this._processFeaturesObject(topology, topology.objects.admin1Polygons, this._admin1Polygons, Number.MIN_VALUE, 2);
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
        this._projectionRenderer = data.projection.createCustomRenderer();
        super.onAttached(data);
    }

    _cullFeatureByBounds(renderer, bounds, featureInfo) {
        let min = renderer.project(featureInfo.geoBounds[0]);
        let max = renderer.project(featureInfo.geoBounds[1]);
        let left = Math.min(min[0], max[0]);
        let right = Math.max(min[0], max[0]);
        let top = Math.min(min[1], max[1]);
        let bottom = Math.max(min[1], max[1]);

        return left <= bounds[1].x &&
               right >= bounds[0].x &&
               top <= bounds[1].y &&
               bottom >= bounds[0].y;
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
        let clipExtent = this.projectionRenderer.viewClipExtent;
        for (let feature of features[lod].filter(this._cullFeatureByBounds.bind(this, this.projectionRenderer, clipExtent))) {
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

        if (this._drawUnfinishedBorders) {
            this._copyReferenceUpdatedToDisplayed();
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

    _drawBordersToBuffer(data) {
        if (this.outlineWidth > 0) {
            this._applyStrokeToBuffer((this.strokeWidth + 2 * this.outlineWidth) * data.dpiScale, this.outlineColor);
        }
        this._applyStrokeToBuffer(this.strokeWidth * data.dpiScale, this.strokeColor);

        this.borderLayer.buffer.context.resetTransform();
        this.borderLayer.context.clearRect(0, 0, this.borderLayer.width, this.borderLayer.height);
        this.borderLayer.copyBufferToCanvas();
    }

    _updateDrawBorders(data) {
        if (this._drawUnfinishedBorders) {
            this._drawBordersToBuffer(data);
            this._updateTransform(data);
        }
    }

    _finishDrawBorders(data) {
        this._drawBordersToBuffer(data);

        if (!this._drawUnfinishedBorders) {
            this._copyReferenceUpdatedToDisplayed();
        }
        this._updateTransform(data);
        this._updateLabels(data);
        this._drawUnfinishedBorders = false;
    }

    _clearLabels() {
        for (let label of this._labelsToShow.values()) {
            this.labelManager.remove(label);
        }
        this._labelsToShow.clear();
    }

    _cullLabelsToShow(data, featureInfo) {
        if (!this._cullFeatureByBounds(this.projectionRenderer, this.projectionRenderer.viewClipExtent, featureInfo)) {
            return false;
        }

        let viewCentroid = WT_MapProjection.xyProjectionToView(data.projection.project(featureInfo.geoCentroid));
        let sec = 1 / Math.cos(featureInfo.geoCentroid[1] * Avionics.Utils.DEG2RAD);
        let area = featureInfo.geoArea * data.projection.scaleFactor * data.projection.scaleFactor * sec * sec; // estimate based on mercator projection
        let viewArea = data.projection.viewWidth * data.projection.viewHeight;
        return this.projectionRenderer.isInView(viewCentroid, -0.05) &&
               area < viewArea * WT_MapViewBorderLayer.LABEL_FEATURE_AREA_MAX &&
               area > viewArea * WT_MapViewBorderLayer.LABEL_FEATURE_AREA_MIN;
    }

    _setLabelStyles(label, fontSize, fontColor, outlineWidth, outlineColor) {
        label.fontSize = fontSize;
        label.fontColor = fontColor;
        label.outlineWidth = outlineWidth;
        label.outlineColor = outlineColor;
    }

    _updateLabelsToShow(newLabelsToShow) {
        this._clearLabels();
        for (let label of newLabelsToShow) {
            if (label.featureClass === WT_MapViewBorderLabel.Class.ADMIN0) {
                this._setLabelStyles(label, this.countryFontSize, this.countryFontColor, this.countryFontOutlineWidth, this.countryFontOutlineColor);
            } else {
                this._setLabelStyles(label, this.stateFontSize, this.stateFontColor, this.stateFontOutlineWidth, this.stateFontOutlineColor);
            }
            this._labelsToShow.add(label);
            this.labelManager.add(label);
        }
    }

    _updateLabels(data) {
        let toShow = this._admin0Polygons.filter(this._cullLabelsToShow.bind(this, data));
        if (data.model.borders.showStateBorders) {
            toShow = toShow.concat(this._admin1Polygons.filter(this._cullLabelsToShow.bind(this, data)));
        }
        this._updateLabelsToShow(toShow.map(featureInfo => this._labelCache.getLabel(featureInfo)));
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
            this._clearLabels();
            this._drawUnfinishedBorders = true;
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
WT_MapViewBorderLayer.DATA_FILE_PATH = "/WorkingTitle/Pages/VCockpit/Instruments/Shared/Map/View/Data/borders.json";
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
WT_MapViewBorderLayer.LABEL_FEATURE_AREA_MAX = 0.75; // fraction of view area
WT_MapViewBorderLayer.LABEL_FEATURE_AREA_MIN = 0.0025; // fraction of view area
WT_MapViewBorderLayer.OPTIONS_DEF = {
    strokeWidth: {default: 2, auto: true},
    strokeColor: {default: "white", auto: true},
    outlineWidth: {default: 0, auto: true},
    outlineColor: {default: "black", auto: true},

    countryFontSize: {default: 25, auto: true},
    countryFontColor: {default: "white", auto: true},
    countryFontOutlineWidth: {default: 6, auto: true},
    countryFontOutlineColor: {default: "black", auto: true},

    stateFontSize: {default: 20, auto: true},
    stateFontColor: {default: "white", auto: true},
    stateFontOutlineWidth: {default: 6, auto: true},
    stateFontOutlineColor: {default: "black", auto: true}
};
WT_MapViewBorderLayer.CONFIG_PROPERTIES = [
    "strokeWidth",
    "strokeColor",
    "outlineWidth",
    "outlineColor",
    "countryFontSize",
    "countryFontColor",
    "countryFontOutlineWidth",
    "countryFontOutlineColor",
    "stateFontSize",
    "stateFontColor",
    "stateFontOutlineWidth",
    "stateFontOutlineColor",
];

class WT_MapViewBorderLabel extends WT_MapViewSimpleTextLabel {
    constructor(featureInfo, featureClass, text, priority) {
        super(text, priority);
        this._feature = featureInfo.feature;
        this._featureClass = featureClass;
        this._geoPosition = WT_MapProjection.latLongProjectionToGame(featureInfo.geoCentroid);

        this.anchor = {x: 0.5, y: 0.5};
    }

    get feature() {
        return this._feature;
    }

    get featureClass() {
        return this._featureClass;
    }

    get geoPosition() {
        return this._geoPosition;
    }

    update(data) {
        this.position = data.projection.projectLatLong(this.geoPosition);

        super.update(data);
    }

    static createFromFeature(featureInfo) {
        let text = featureInfo.feature.properties.name;
        let featureClass;
        let priority;

        switch (featureInfo.feature.properties.featurecla) {
            case WT_MapViewBorderLabel.Class.ADMIN0:
                featureClass = WT_MapViewBorderLabel.Class.ADMIN0;
                priority = 220 + featureInfo.feature.properties.labelrank;
                break;
            case WT_MapViewBorderLabel.Class.ADMIN1:
                featureClass = WT_MapViewBorderLabel.Class.ADMIN1;
                priority = 200 + featureInfo.feature.properties.labelrank;
                break;
        }

        return new WT_MapViewBorderLabel(featureInfo, featureClass, text, priority);
    }
}
WT_MapViewBorderLabel.Class = {
    ADMIN0: "Admin-0 map subunit",
    ADMIN1: "Admin-1 scale rank"
}

class WT_MapViewBorderLabelCache {
    constructor() {
        this._cache = new Map();
    }

    getLabel(featureInfo) {
        let existing = this._cache.get(featureInfo);
        if (!existing) {
            existing = WT_MapViewBorderLabel.createFromFeature(featureInfo);
            this._cache.set(featureInfo, existing);
        }
        return existing;
    }
}