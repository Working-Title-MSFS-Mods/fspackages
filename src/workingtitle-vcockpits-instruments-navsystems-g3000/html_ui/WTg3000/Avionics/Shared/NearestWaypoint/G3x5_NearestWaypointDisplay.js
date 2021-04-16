class WT_G3x5_NearestWaypointDisplay {
    constructor(instrumentID, airplane, icaoWaypointFactory, icaoSearchers) {
        this._instrumentID = instrumentID;
        this._settingModelID = `${instrumentID}_${WT_G3x5_NearestWaypointDisplay.SETTING_MODEL_ID}`;

        this._airplane = airplane;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._icaoSearchers = icaoSearchers;
    }

    /**
     * @readonly
     * @type {String}
     */
    get instrumentID() {
        return this._instrumentID;
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
    get mapModel() {
        return this._model;
    }

    /**
     * The view associated with this map.
     * @readonly
     * @type {WT_MapView}
     */
    get mapView() {
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
     * @property {WT_MapModelWaypointInfoModule} waypointInfoModule - the waypoint info module associated with this map.
     * @type {WT_G3x5_MapModelWaypointInfoModule}
     */
    get waypointInfoModule() {
        return this._waypointInfoModule;
    }

    _initMapModel() {
        this.mapModel.addModule(new WT_MapModelUnitsModule());
        this.mapModel.addModule(new WT_MapModelAirplaneIconModule());
        this.mapModel.addModule(new WT_MapModelTerrainModule());
        this.mapModel.addModule(new WT_MapModelWeatherDisplayModule());
        this.mapModel.addModule(new WT_MapModelOrientationModule());
        this.mapModel.addModule(new WT_MapModelRangeRingModule());
        this.mapModel.addModule(new WT_MapModelWaypointsModule());
        this.mapModel.addModule(this._waypointInfoModule = new WT_G3x5_MapModelNearestWaypointModule(this._icaoWaypointFactory));
        this.mapModel.addModule(this._waypointHighlightModule = new WT_MapModelWaypointHighlightModule(this._icaoWaypointFactory));

        this.mapModel.terrain.mode = WT_MapModelTerrainModule.TerrainMode.OFF;

        this.mapModel.waypoints.airwayShow = false;
        this.mapModel.waypoints.airportSmallRange = WT_G3x5_NearestWaypointDisplay.AIRPORT_SMALL_RANGE;
        this.mapModel.waypoints.airportMediumRange = WT_G3x5_NearestWaypointDisplay.AIRPORT_MEDIUM_RANGE;
        this.mapModel.waypoints.airportLargeRange = WT_G3x5_NearestWaypointDisplay.AIRPORT_LARGE_RANGE;
        this.mapModel.waypoints.vorRange = WT_G3x5_NearestWaypointDisplay.VOR_RANGE;
        this.mapModel.waypoints.ndbRange = WT_G3x5_NearestWaypointDisplay.NDB_RANGE;
        this.mapModel.waypoints.intRange = WT_G3x5_NearestWaypointDisplay.INT_RANGE;
    }

    _initMapView() {
        let labelManager = new WT_MapViewTextLabelManager({preventOverlap: true});
        this._waypointRenderer = new WT_MapViewWaypointCanvasRenderer(labelManager);

        this.mapView.addLayer(this._bingLayer = new WT_MapViewBingLayer(this.instrumentID));
        this.mapView.addLayer(new WT_MapViewWaypointLayer(this._icaoSearchers, this._icaoWaypointFactory, this._waypointRenderer, labelManager));
        this.mapView.addLayer(new WT_MapViewWaypointHighlightLayer(this._waypointRenderer));
        this.mapView.addLayer(new WT_G3x5_MapViewNearestWaypointLineLayer());
        this.mapView.addLayer(new WT_MapViewTextLabelLayer(labelManager));
        this.mapView.addLayer(new WT_MapViewRangeRingLayer());
        this.mapView.addLayer(new WT_MapViewAirplaneLayer());
        this.mapView.addLayer(new WT_MapViewOrientationDisplayLayer(WT_G3x5_NearestWaypointDisplay.ORIENTATION_DISPLAY_TEXT));
        this.mapView.addLayer(new WT_MapViewMiniCompassLayer());
    }

    _initSettingValues() {
        this._setICAO(this._icaoSetting.getValue());
    }

    _initSettingListeners() {
        this._icaoSetting.addListener(this._onICAOSettingChanged.bind(this));
    }

    _initSettingModel() {
        this.settingModel.addSetting(this._icaoSetting = new WT_G3x5_NearestWaypointICAOSetting(this.settingModel));

        this.settingModel.init();

        this._initSettingValues();
        this._initSettingListeners();
    }

    _initRangeTargetController() {
        this._rangeTargetController = new WT_G3x5_NearestWaypointRangeTargetController(this.mapModel, this.mapView, WT_G3x5_NearestWaypointDisplay.MAP_RANGE_LEVELS, WT_G3x5_NearestWaypointDisplay.MAP_RANGE_DEFAULT);
    }

    init(viewElement) {
        this._model = new WT_MapModel(this._airplane);
        this._view = viewElement;
        this.mapView.setModel(this.mapModel);
        this._settingModel = new WT_DataStoreSettingModel(this.settingModelID);

        this._initMapModel();
        this._initMapView();
        this._initSettingModel();
        this._initRangeTargetController();
    }

    _setICAO(icao) {
        this.mapModel.nearestWaypoint.waypointICAO = icao;
    }

    _onICAOSettingChanged(setting, newValue, oldValue) {
        this._setICAO(newValue);
    }

    sleep() {
        this._bingLayer.sleep();
    }

    wake() {
    }

    update() {
        this._rangeTargetController.update();
        this.mapView.update();
        this._waypointRenderer.update(this.mapView.state);
    }
}
WT_G3x5_NearestWaypointDisplay.SETTING_MODEL_ID = "NearestWaypoint";

WT_G3x5_NearestWaypointDisplay.MAP_RANGE_LEVELS =
    [250, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.FOOT)).concat(
        [0.25, 0.5, 0.75, 1, 1.5, 2.5, 4, 5, 7.5, 10, 15, 25, 40, 50, 75, 100, 150, 250, 400, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.NMILE))
    );
WT_G3x5_NearestWaypointDisplay.MAP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

WT_G3x5_NearestWaypointDisplay.AIRPORT_LARGE_RANGE = WT_Unit.NMILE.createNumber(100);
WT_G3x5_NearestWaypointDisplay.AIRPORT_MEDIUM_RANGE = WT_Unit.NMILE.createNumber(25);
WT_G3x5_NearestWaypointDisplay.AIRPORT_SMALL_RANGE = WT_Unit.NMILE.createNumber(7.5);
WT_G3x5_NearestWaypointDisplay.VOR_RANGE = WT_Unit.NMILE.createNumber(50);
WT_G3x5_NearestWaypointDisplay.NDB_RANGE = WT_Unit.NMILE.createNumber(25);
WT_G3x5_NearestWaypointDisplay.INT_RANGE = WT_Unit.NMILE.createNumber(2.5);

WT_G3x5_NearestWaypointDisplay.ORIENTATION_DISPLAY_TEXT = ["NORTH UP"];

class WT_G3x5_NearestWaypointRangeTargetController {
    /**
     *
     * @param {WT_MapModel} mapModel
     * @param {WT_MapView} mapView
     * @param {WT_NumberUnit[]} rangeLevels
     * @param {WT_NumberUnit} defaultRange
     */
    constructor(mapModel, mapView, rangeLevels, defaultRange) {
        this._mapModel = mapModel;
        this._mapView = mapView;

        mapView.setTargetOffsetHandler(this);
        mapView.setRangeInterpreter(this);

        this._rangeLevels = rangeLevels;
        this._rangeIndexDefault = rangeLevels.findIndex(range => range.equals(defaultRange));
        this._rangeIndex = this._rangeIndexDefault;

        /**
         * @type {WT_ICAOWaypoint}
         */
        this._waypoint = null;

        this._tempVector2 = new WT_GVector2(0, 0);
        this._tempNM = WT_Unit.NMILE.createNumber(0);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
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
        range.set(model.range).scale(4, true);
    }

    _setWaypoint(waypoint) {
        this._mapModel.waypointHighlight.waypoint = waypoint;
        this._waypoint = waypoint;
    }

    _updateWaypoint() {
        let waypoint = this._mapModel.nearestWaypoint.waypoint;
        if (this._waypoint === null && waypoint === null || (waypoint && waypoint.equals(this._waypoint))) {
            return;
        }

        this._setWaypoint(waypoint);
    }

    _updateTarget() {
        this._mapModel.target = this._mapModel.airplane.navigation.position(this._tempGeoPoint);
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    _calculateNormalizedDistance(waypoint) {
        let waypointViewPos = this._mapView.projection.project(waypoint.location, this._tempVector2);
        let delta = waypointViewPos.subtract(this._mapView.projection.viewCenter);
        let thetaAbs = Math.abs(delta.theta);
        let theta0 = Math.atan2(this._mapView.projection.viewWidth, this._mapView.projection.viewHeight);
        let viewDistanceToEdge;
        if (thetaAbs < theta0 || thetaAbs > Math.PI - theta0) {
            // constrained by height
            viewDistanceToEdge = Math.abs(this._mapView.projection.viewHeight / 2 / Math.cos(thetaAbs));
        } else {
            // constrained by width
            viewDistanceToEdge = this._mapView.projection.viewWidth / 2 / Math.sin(thetaAbs);
        }
        return delta.length / viewDistanceToEdge;
    }

    _setRangeIndex(index) {
        this._rangeIndex = index;
        this._mapModel.range = this._rangeLevels[index];
    }

    _updateRange() {
        if (!this._waypoint) {
            this._setRangeIndex(this._rangeIndexDefault);
            return;
        }

        let rangeIndex = this._rangeIndex;
        while (rangeIndex >= 0 && rangeIndex < this._rangeLevels.length - 1) {
            this._setRangeIndex(rangeIndex);
            this.getTrueRange(this._mapModel, this._tempNM);
            this._mapView.projection.range = this._tempNM;

            let normDistance = this._calculateNormalizedDistance(this._waypoint);
            let indexDelta;
            if (normDistance < WT_G3x5_NearestWaypointRangeTargetController.DISTANCE_NORM_MIN) {
                indexDelta = -1;
            } else if (normDistance > WT_G3x5_NearestWaypointRangeTargetController.DISTANCE_NORM_MAX) {
                indexDelta = 1;
            } else {
                break;
            }
            rangeIndex += indexDelta;
        }
    }

    update() {
        this._updateWaypoint();
        this._updateTarget();
        this._updateRange();
    }
}
WT_G3x5_NearestWaypointRangeTargetController.DISTANCE_NORM_MIN = 0.2;
WT_G3x5_NearestWaypointRangeTargetController.DISTANCE_NORM_MAX = 0.8;