class WT_G3x5_TrafficMap {
    /**
     * @param {String} instrumentID
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_G3x5_TrafficSystem} trafficSystem
     */
    constructor(instrumentID, airplane, trafficSystem) {
        this._instrumentID = instrumentID;
        this._controllerID = `${instrumentID}-TrafficMap`;

        this._airplane = airplane;
        this._trafficSystem = trafficSystem;
    }

    /**
     * @readonly
     * @property {String} instrumentID
     * @type {String}
     */
    get instrumentID() {
        return this._instrumentID;
    }

    /**
     * @readonly
     * @property {String} controllerID
     * @type {String}
     */
    get controllerID() {
        return this._controllerID;
    }

    /**
     * @readonly
     * @property {WT_MapModel} model - the model associated with this map.
     * @type {WT_MapModel}
     */
    get model() {
        return this._model;
    }

    /**
     * @readonly
     * @property {WT_MapView} view - the view associated with this map.
     * @type {WT_MapView}
     */
    get view() {
        return this._view;
    }

    /**
     * @readonly
     * @property {WT_MapController} controller - the controller associated with this map.
     * @type {WT_MapController}
     */
    get controller() {
        return this._controller;
    }

    _initModel() {
        this.model.addModule(new WT_MapModelUnitsModule());
        this.model.addModule(new WT_MapModelOrientationModule());
        this.model.addModule(new WT_G3x5_MapModelTrafficModule(this._trafficSystem));
    }

    _initView() {
        let labelManager = new WT_MapViewTextLabelManager({preventOverlap: true});

        let intruderLayer = (this._airplane.type === WT_PlayerAirplane.Type.TBM930) ? new WT_G3000_MapViewTrafficIntruderLayer() : new WT_G3000_MapViewTrafficIntruderLayer();
        this.view.addLayer(new WT_MapViewTextLabelLayer(labelManager));
        this.view.addLayer(new WT_G3x5_MapViewTrafficRangeLayer());
        this.view.addLayer(intruderLayer);
        this.view.addLayer(new WT_MapViewAirplaneLayer());
        this.view.addLayer(new WT_MapViewOrientationDisplayLayer(WT_G3x5_TrafficMap.ORIENTATION_DISPLAY_TEXT));
        this.view.addLayer(new WT_MapViewMiniCompassLayer());
    }

    _initController() {
        this.controller.addSetting(this._rangeTargetController = new WT_G3x5_TrafficMapRangeTargetController(this.controller));

        this.controller.init();
        this.controller.update();
    }

    init(viewElement) {
        this._model = new WT_MapModel(this._airplane);
        this._view = viewElement;
        this.view.setModel(this.model);
        this._controller = new WT_MapController(this.controllerID, this.model, this.view);

        this._initModel();
        this._initView();
        this._initController();
    }

    sleep() {
    }

    wake() {
    }

    update() {
        this._rangeTargetController.update();
        this.view.update();
    }
}

WT_G3x5_TrafficMap.MAP_RANGE_LEVELS =
    [750, 1500].map(range => new WT_NumberUnit(range, WT_Unit.FOOT)).concat(
        [0.5, 1, 2, 6, 12, 24, 40].map(range => new WT_NumberUnit(range, WT_Unit.NMILE))
    );
WT_G3x5_TrafficMap.MAP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(12);

WT_G3x5_TrafficMap.ORIENTATION_DISPLAY_TEXT = ["HDG UP"];

class WT_G3x5_MapModelTrafficModule extends WT_MapModelTrafficModule {
    constructor(trafficSystem, name = WT_MapModelTrafficModule.NAME_DEFAULT) {
        super(name);

        this._trafficSystem = trafficSystem;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TrafficSystem}
     */
    get trafficSystem() {
        return this._trafficSystem;
    }
}

/**
 * Traffic map range overlay. Consists of an inner and outer range ring. Each range ring can have an associated label
 * and major and minor tick marks.
 */
class WT_G3x5_MapViewTrafficRangeLayer extends WT_MapViewLabeledRingLayer {
    constructor(className = WT_G3x5_MapViewTrafficRangeLayer.CLASS_DEFAULT, configName = WT_G3x5_MapViewTrafficRangeLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._outerRing = new WT_MapViewLabeledRing(new WT_MapViewRing(), new WT_G3x5_MapViewTrafficRangeLabel(false));
        this._innerRing = new WT_MapViewLabeledRing(new WT_MapViewRing(), new WT_G3x5_MapViewTrafficRangeLabel(true));

        this._outerRingTickLayer = new WT_MapViewCanvas(false, true);
        this._innerRingTickLayer = new WT_MapViewCanvas(false, true);

        this.addRing(this._outerRing);
        this.addRing(this._innerRing);
        this.addSubLayer(this._outerRingTickLayer);
        this.addSubLayer(this._innerRingTickLayer);
        this._outerRing.label.anchor = {x: 0.5, y: 0.5};
        this._innerRing.label.anchor = {x: 0.5, y: 0.5};

        this._optsManager = new WT_OptionsManager(this, WT_G3x5_MapViewTrafficRangeLayer.OPTIONS_DEF);

        this._tempVector2 = new WT_GVector2(0, 0);
    }

    _updateStyles(dpiScale) {
        this._outerRing.ring.setOptions({
            strokeWidth: this.outerStrokeWidth * dpiScale,
            strokeColor: this.outerStrokeColor,
            strokeDash: this.outerStrokeDash.map(e => e * dpiScale),
            outlineWidth: this.outerOutlineWidth * dpiScale,
            outlineColor: this.outerOutlineColor,
            outlineDash: this.outerOutlineDash.map(e => e * dpiScale)
        });
        this._innerRing.ring.setOptions({
            strokeWidth: this.innerStrokeWidth * dpiScale,
            strokeColor: this.innerStrokeColor,
            strokeDash: this.innerStrokeDash.map(e => e * dpiScale),
            outlineWidth: this.innerOutlineWidth * dpiScale,
            outlineColor: this.innerOutlineColor,
            outlineDash: this.innerOutlineDash.map(e => e * dpiScale)
        });

        this._outerRing.label.setOptions({
            radialAngle: this.outerLabelAngle,
            radialOffset: this.outerLabelOffset * dpiScale,
        });
        this._innerRing.label.setOptions({
            radialAngle: this.innerLabelAngle,
            radialOffset: this.innerLabelOffset * dpiScale,
        });
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.traffic.show;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_G3x5_MapViewTrafficRangeLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
        this._outerRing.label.show = this.outerLabelShow;
        this._innerRing.label.show = this.innerLabelShow;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onAttached(state) {
        super.onAttached(state);
        this._updateStyles(state.dpiScale);
    }

    _loadTickPath(layer, center, radiusStart, radiusEnd, angle) {
        let angleRad = angle * Avionics.Utils.DEG2RAD;
        let start = this._tempVector2.setFromPolar(radiusStart, angleRad).add(center);
        layer.display.context.moveTo(start.x, start.y);
        let end = this._tempVector2.setFromPolar(radiusEnd, angleRad).add(center);
        layer.display.context.lineTo(end.x, end.y);
    }

    /**
     *
     * @param {WT_MapViewCanvas} layer
     * @param {WT_GVector2} center
     * @param {Number} radius
     * @param {{start:Number, interval:Number, width:Number, length:Number, style:String|CanvasGradient|CanvasPattern}} options
     */
    _drawMajorTicks(layer, center, radius, options) {
        let angle = options.start;
        let radiusShort = radius - (options.length / 2);
        let radiusLong = radius + (options.length / 2);
        layer.display.context.strokeStyle = options.style;
        layer.display.context.lineWidth = options.width;
        layer.display.context.beginPath();
        while (angle < 360) {
            this._loadTickPath(layer, center, radiusShort, radiusLong, angle);
            angle += options.interval;
        }
        layer.display.context.stroke();
    }

    /**
     *
     * @param {WT_MapViewCanvas} layer
     * @param {WT_GVector2} center
     * @param {Number} radius
     * @param {{start:Number, interval:Number, width:Number, length:Number, style:String|CanvasGradient|CanvasPattern}} majorTickOptions
     * @param {{factor:Number, width:Number, length:Number, style:String|CanvasGradient|CanvasPattern}} minorTickOptions
     */
    _drawMinorTicks(layer, center, radius, majorTickOptions, minorTickOptions) {
        if (minorTickOptions.factor <= 1) {
            return;
        }

        let angle = majorTickOptions.start;
        let i = 0;
        let interval = majorTickOptions.interval / minorTickOptions.factor;
        let radiusShort = radius - (minorTickOptions.length / 2);
        let radiusLong = radius + (minorTickOptions.length / 2);
        layer.display.context.strokeStyle = minorTickOptions.style;
        layer.display.context.lineWidth = minorTickOptions.width;
        layer.display.context.beginPath();
        while (angle < 360) {
            if ((i % minorTickOptions.factor) !== 0) {
                this._loadTickPath(layer, center, radiusShort, radiusLong, angle);
            }
            angle += interval;
            i++;
        }
        layer.display.context.stroke();
    }

    /**
     *
     * @param {WT_MapViewCanvas} layer
     * @param {WT_GVector2} center
     * @param {Number} radius
     */
    _setRingTicks(layer, center, radius, majorTickOptions, minorTickOptions) {
        layer.display.clear();
        this._drawMajorTicks(layer, center, radius, majorTickOptions);
        this._drawMinorTicks(layer, center, radius, majorTickOptions, minorTickOptions);
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateOuterRing(state) {
        let center = state.projection.viewTarget;
        let radius = state.model.traffic.outerRange.ratio(state.projection.range) * state.projection.viewHeight;
        if (radius === 0) {
            this._outerRing.ring.show = false;
            this._outerRing.label.show = false;
            return;
        } else {
            this._outerRing.ring.show = true;
            this._outerRing.label.show = this.outerLabelShow;
        }

        if (!center.equals(this._outerRing.center) || radius !== this._outerRing.radius) {
            let majorTickOptions = {
                start: this.outerTickMajorStart,
                interval: this.outerTickMajorInterval,
                width: this.outerTickMajorWidth * state.dpiScale,
                length: this.outerTickMajorLength * state.dpiScale,
                style: this.outerStrokeColor
            };
            let minorTickOptions = {
                factor: this.outerTickMinorFactor,
                width: this.outerTickMinorWidth * state.dpiScale,
                length: this.outerTickMinorLength * state.dpiScale,
                style: this.outerStrokeColor
            };
            this._setRingTicks(this._outerRingTickLayer, center, radius, majorTickOptions, minorTickOptions);
            this._outerRing.center = center;
            this._outerRing.radius = radius;
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateInnerRing(state) {
        let center = state.projection.viewTarget;
        let radius = state.model.traffic.innerRange.ratio(state.projection.range) * state.projection.viewHeight;
        if (radius === 0) {
            this._innerRing.ring.show = false;
            this._innerRing.label.show = false;
            return;
        } else {
            this._innerRing.ring.show = true;
            this._innerRing.label.show = this.innerLabelShow;
        }

        if (!center.equals(this._innerRing.center) || radius !== this._innerRing.radius) {
            let majorTickOptions = {
                start: this.innerTickMajorStart,
                interval: this.innerTickMajorInterval,
                width: this.innerTickMajorWidth * state.dpiScale,
                length: this.innerTickMajorLength * state.dpiScale,
                style: this.innerStrokeColor
            };
            let minorTickOptions = {
                factor: this.innerTickMinorFactor,
                width: this.innerTickMinorWidth * state.dpiScale,
                length: this.innerTickMinorLength * state.dpiScale,
                style: this.innerStrokeColor
            };
            this._setRingTicks(this._innerRingTickLayer, center, radius, majorTickOptions, minorTickOptions);
            this._innerRing.center = center;
            this._innerRing.radius = radius;
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this._updateOuterRing(state);
        this._updateInnerRing(state);

        super.onUpdate(state);
    }
}
WT_G3x5_MapViewTrafficRangeLayer.CLASS_DEFAULT = "trafficRangeLayer";
WT_G3x5_MapViewTrafficRangeLayer.CONFIG_NAME_DEFAULT = "trafficRange";
WT_G3x5_MapViewTrafficRangeLayer.OPTIONS_DEF = {
    outerStrokeWidth: {default: 2, auto: true},
    outerStrokeColor: {default: "white", auto: true},
    outerStrokeDash: {default: [6, 6], auto: true},
    outerOutlineWidth: {default: 0, auto: true},
    outerOutlineColor: {default: "#000000", auto: true},
    outerOutlineDash: {default: [], auto: true},

    outerTickMajorStart: {default: 0, auto: true},
    outerTickMajorInterval: {default: 90, auto: true},
    outerTickMajorLength: {default: 8, auto: true},
    outerTickMajorWidth: {default: 10, auto: true},

    outerTickMinorFactor: {default: 3, auto: true},
    outerTickMinorLength: {default: 6, auto: true},
    outerTickMinorWidth: {default: 6, auto: true},

    innerStrokeWidth: {default: 2, auto: true},
    innerStrokeColor: {default: "white", auto: true},
    innerStrokeDash: {default: [6, 6], auto: true},
    innerOutlineWidth: {default: 0, auto: true},
    innerOutlineColor: {default: "#000000", auto: true},
    innerOutlineDash: {default: [], auto: true},

    innerTickMajorStart: {default: 0, auto: true},
    innerTickMajorInterval: {default: 90, auto: true},
    innerTickMajorLength: {default: 8, auto: true},
    innerTickMajorWidth: {default: 10, auto: true},

    innerTickMinorFactor: {default: 1, auto: true},
    innerTickMinorLength: {default: 6, auto: true},
    innerTickMinorWidth: {default: 6, auto: true},

    outerLabelShow: {default: true, auto: true},
    outerLabelAngle: {default: -135, auto: true},
    outerLabelOffset: {default: 0, auto: true},

    innerLabelShow: {default: true, auto: true},
    innerLabelAngle: {default: -135, auto: true},
    innerLabelOffset: {default: 0, auto: true},
};
WT_G3x5_MapViewTrafficRangeLayer.CONFIG_PROPERTIES = [
    "outerStrokeWidth",
    "outerStrokeColor",
    "outerStrokeDash",
    "outerOutlineWidth",
    "outerOutlineColor",
    "outerOutlineDash",
    "innerStrokeWidth",
    "innerStrokeColor",
    "innerStrokeDash",
    "innerOutlineWidth",
    "innerOutlineColor",
    "innerOutlineDash",
    "outerLabelShow",
    "outerLabelAngle",
    "outerLabelOffset",
    "innerLabelShow",
    "innerLabelAngle",
    "innerLabelOffset"
];

class WT_G3x5_MapViewTrafficRangeLabel extends WT_MapViewRingLabel {
    constructor(isInner) {
        super();

        this._isInner = isInner;
    }

    _createLabel() {
        this._rangeDisplay = new WT_MapViewRangeDisplay();
        return this._rangeDisplay;
    }

    /**
     * This label's range display object.
     * @readonly
     * @type {WT_MapViewRangeDisplay}
     */
    get rangeDisplay() {
        return this._rangeDisplay;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        this.rangeDisplay.setRange(this._isInner ? state.model.traffic.innerRange : state.model.range);
        this.rangeDisplay.update(state);
    }
}

class WT_G3x5_TrafficMapRangeTargetController extends WT_MapSettingGroup {
    /**
     *
     * @param {WT_MapController} controller
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     */
    constructor(controller, icaoWaypointFactory) {
        super(controller, [], false, false);

        this._icaoWaypointFactory = icaoWaypointFactory;

        this._rangeSetting = new WT_G3x5_TrafficMapRangeSetting(controller, WT_G3x5_TrafficMap.MAP_RANGE_LEVELS, WT_G3x5_TrafficMap.MAP_RANGE_DEFAULT);
        this.addSetting(this._rangeSetting);

        controller.view.setTargetOffsetHandler(this);
        controller.view.setRangeInterpreter(this);

        this._target = new WT_GeoPoint(0, 0);
        /**
         * @type {WT_ICAOWaypoint}
         */
        this._waypoint = null;

        this._aspectRatio = 1;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TrafficMapRangeSetting} rangeSetting
     * @type {WT_G3x5_TrafficMapRangeSetting}
     */
    get rangeSetting() {
        return this._rangeSetting;
    }

    /**
     *
     * @param {WT_MapModel} model
     * @param {WT_GVector2} offset
     */
    getTargetOffset(model, offset) {
        offset.set(0, 0);
    }

    /**
     *
     * @param {WT_MapModel} model
     * @param {WT_NumberUnit} range
     */
    getTrueRange(model, range) {
        // nominal range should be 90% of half the smallest dimension
        let rangeHeightFactor = Math.min(0.45, this._aspectRatio * 0.45);
        range.set(model.range).scale(1 / rangeHeightFactor, true);
    }

    _updateTarget() {
        this.model.target = this.model.airplane.navigation.position(this._target);
    }

    _updateRotation() {
        this.model.rotation = -this.model.airplane.navigation.headingTrue();
    }

    update() {
        let aspectRatio = this.view.projection.viewWidth / this.view.projection.viewHeight;
        if (aspectRatio !== this._aspectRatio) {
            this._aspectRatio = aspectRatio;
        }

        this._rangeSetting.update();
        this._updateTarget();
        this._updateRotation();
    }
}

class WT_G3x5_TrafficMapRangeSetting extends WT_MapRangeSetting {
    /**
     *
     * @param {WT_MapController} controller - the controller with which to associate the new setting.
     * @param {WT_NumberUnit[]} ranges - an array of possible range values of the new setting.
     * @param {WT_NumberUnit} defaultRange - the default range of the new setting.
     */
    constructor(controller, ranges, defaultRange) {
        super(controller, ranges, defaultRange, false, false);
    }

    getInnerRange() {
        let index = this.getValue();
        return (index > 0) ? this._ranges[index - 1] : WT_G3x5_TrafficMapRangeSetting.ZERO_RANGE.readonly();
    }

    update() {
        super.update();

        this.model.traffic.outerRange = this.getRange();
        this.model.traffic.innerRange = this.getInnerRange();
    }
}
WT_G3x5_TrafficMapRangeSetting.ZERO_RANGE = WT_Unit.NMILE.createNumber(0);