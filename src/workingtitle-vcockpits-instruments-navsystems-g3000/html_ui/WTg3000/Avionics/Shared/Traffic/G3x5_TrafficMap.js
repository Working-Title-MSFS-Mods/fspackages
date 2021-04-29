class WT_G3x5_TrafficMap {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_G3x5_TrafficSystem} trafficSystem
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     */
    constructor(airplane, trafficSystem, unitsSettingModel) {
        this._settingModelID = WT_G3x5_TrafficMap.SETTING_MODEL_ID;

        this._airplane = airplane;
        this._trafficSystem = trafficSystem;
        this._unitsSettingModel = unitsSettingModel;
    }

    /**
     * @readonly
     * @type {String}
     */
    get settingModelID() {
        return this._settingModelID;
    }

    /**
     * The model associated with this map.
     * @readonly
     * @type {WT_MapModel}
     */
    get model() {
        return this._model;
    }

    /**
     * The view associated with this map.
     * @readonly
     * @type {WT_MapView}
     */
    get view() {
        return this._view;
    }

    /**
     * The setting model associated with this map.
     * @readonly
     * @type {WT_MapSettingModel}
     */
    get settingModel() {
        return this._settingModel;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TrafficMapRangeSetting}
     */
    get rangeSetting() {
        return this._rangeTargetController.rangeSetting;
    }

    _initUnitsAdapter() {
        this._unitsAdapter = new WT_G3x5_UnitsSettingModelMapModelAdapter(this._unitsSettingModel, this.model);
    }

    /**
     * @returns {WT_G3x5_MapModelTrafficModule}
     */
    _createTrafficModule() {
        return new WT_G3x5_MapModelTrafficModule(this._trafficSystem);
    }

    _initModel() {
        this._initUnitsAdapter();
        this.model.addModule(new WT_MapModelOrientationModule());
        this.model.addModule(new WT_MapModelAirplaneIconModule());
        this.model.addModule(this._trafficModule = this._createTrafficModule());
    }

    /**
     * @returns {WT_G3x5_MapViewTrafficIntruderLayer}
     */
    _createTrafficIntruderLayer() {
    }

    /**
     * @returns {WT_MapViewLayer}
     */
    _createTrafficStatusLayer() {
    }

    _initView() {
        let labelManager = new WT_MapViewTextLabelManager({preventOverlap: true});

        this.view.addLayer(new WT_MapViewTextLabelLayer(labelManager));
        this.view.addLayer(new WT_G3x5_MapViewTrafficRangeLayer());
        this.view.addLayer(new WT_MapViewAirplaneLayer());
        this.view.addLayer(this._createTrafficIntruderLayer());
        this.view.addLayer(new WT_MapViewOrientationDisplayLayer(WT_G3x5_TrafficMap.ORIENTATION_DISPLAY_TEXT));
        this.view.addLayer(new WT_MapViewMiniCompassLayer());
        this.view.addLayer(this._createTrafficStatusLayer());
    }

    _initSettingModel() {
        this.settingModel.addSetting(new WT_G3x5_TrafficMapAltitudeModeSetting(this.settingModel));
        this.settingModel.addSetting(new WT_G3x5_TrafficMapAltitudeRestrictionSetting(this.settingModel));
        this.settingModel.addSetting(new WT_G3x5_TrafficMapMotionVectorModeSetting(this.settingModel));
        this.settingModel.addSetting(new WT_G3x5_TrafficMapMotionVectorLookaheadSetting(this.settingModel));
        this.settingModel.addSetting(this._rangeTargetController = new WT_G3x5_TrafficMapRangeTargetController(this.settingModel));

        this.settingModel.init();
        this.settingModel.update();
    }

    init(viewElement) {
        this._model = new WT_MapModel(this._airplane);
        this._view = viewElement;
        this.view.setModel(this.model);
        this._settingModel = new WT_MapSettingModel(this.settingModelID, this.model, this.view);

        this._initModel();
        this._initView();
        this._initSettingModel();
    }

    update() {
        this._rangeTargetController.update();
        this.view.update();
    }
}
WT_G3x5_TrafficMap.SETTING_MODEL_ID = "TrafficMap";

WT_G3x5_TrafficMap.MAP_RANGE_LEVELS =
    [750, 1500].map(range => new WT_NumberUnit(range, WT_Unit.FOOT)).concat(
        [0.5, 1, 2, 6, 12, 24, 40].map(range => new WT_NumberUnit(range, WT_Unit.NMILE))
    );
WT_G3x5_TrafficMap.MAP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(12);

WT_G3x5_TrafficMap.ORIENTATION_DISPLAY_TEXT = ["HDG UP"];

WT_G3x5_TrafficMap.STATUS_ALTITUDE_RESTRICTION_MODE_TEXT = [
    "UNRESTRICTED",
    "ABOVE",
    "NORMAL",
    "BELOW"
];
WT_G3x5_TrafficMap.STATUS_MOTION_VECTOR_MODE_TEXT = [
    "OFF",
    "ABS",
    "REL",
];

class WT_G3x5_TrafficMapRangeTargetController extends WT_MapSettingGroup {
    /**
     * @param {WT_MapSettingModel} model
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     */
    constructor(model, icaoWaypointFactory) {
        super(model, [], false, false);

        this._icaoWaypointFactory = icaoWaypointFactory;

        this._rangeSetting = new WT_G3x5_TrafficMapRangeSetting(model, WT_G3x5_TrafficMap.MAP_RANGE_LEVELS, WT_G3x5_TrafficMap.MAP_RANGE_DEFAULT);
        this.addSetting(this._rangeSetting);

        model.mapView.setTargetOffsetHandler(this);
        model.mapView.setRangeInterpreter(this);

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
        this.mapModel.target = this.mapModel.airplane.navigation.position(this._target);
    }

    _updateRotation() {
        this.mapModel.rotation = -this.mapModel.airplane.navigation.headingTrue();
    }

    update() {
        let aspectRatio = this.mapView.projection.viewWidth / this.mapView.projection.viewHeight;
        if (aspectRatio !== this._aspectRatio) {
            this._aspectRatio = aspectRatio;
        }

        this._rangeSetting.update();
        this._updateTarget();
        this._updateRotation();
    }
}