class WT_G3x5_TrafficMap {
    constructor(instrumentID, airplane) {
        this._instrumentID = instrumentID;
        this._controllerID = `${instrumentID}-TrafficMap`;

        this._airplane = airplane;
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
        this.model.addModule(new WT_MapModelTrafficModule());
    }

    _initView() {
        let labelManager = new WT_MapViewTextLabelManager({preventOverlap: true});

        this.view.addLayer(new WT_MapViewTextLabelLayer(labelManager));
        this.view.addLayer(new WT_MapViewGarminTrafficRangeLayer());
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
WT_G3x5_TrafficMap.MAP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(6);

WT_G3x5_TrafficMap.ORIENTATION_DISPLAY_TEXT = ["HDG UP"];

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