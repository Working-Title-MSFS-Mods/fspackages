class WT_G3x5_WaypointInfo {
    constructor(instrumentID, icaoWaypointFactory, icaoSearchers) {
        this._instrumentID = instrumentID;
        this._controllerID = `${instrumentID}-WaypointInfo`;

        this._icaoWaypointFactory = icaoWaypointFactory;
        this._icaoSearchers = icaoSearchers;
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

    /**
     * @readonly
     * @property {WT_MapModelWaypointInfoModule} waypointInfoModule - the waypoint info module associated with this map.
     * @type {WT_MapModelWaypointInfoModule}
     */
    get waypointInfoModule() {
        return this._waypointInfoModule;
    }

    _initModel() {
        this.model.addModule(new WT_MapModelUnitsModule());
        this.model.addModule(new WT_MapModelCrosshairModule());
        this.model.addModule(new WT_MapModelTerrainModule());
        this.model.addModule(new WT_MapModelWeatherDisplayModule());
        this.model.addModule(new WT_MapModelOrientationModule());
        this.model.addModule(new WT_MapModelRangeRingModule());
        this.model.addModule(new WT_MapModelWaypointsModule());
        this.model.addModule(this._waypointInfoModule = new WT_MapModelWaypointInfoModule(this._icaoWaypointFactory));

        this.model.crosshair.show = true;
        this.model.terrain.mode = WT_MapModelTerrainModule.TerrainMode.OFF;

        this.model.waypoints.airwayShow = false;
        this.model.waypoints.airportSmallRange = WT_G3x5_WaypointInfo.AIRPORT_SMALL_RANGE;
        this.model.waypoints.airportMediumRange = WT_G3x5_WaypointInfo.AIRPORT_MEDIUM_RANGE;
        this.model.waypoints.airportLargeRange = WT_G3x5_WaypointInfo.AIRPORT_LARGE_RANGE;
        this.model.waypoints.vorRange = WT_G3x5_WaypointInfo.VOR_RANGE;
        this.model.waypoints.ndbRange = WT_G3x5_WaypointInfo.NDB_RANGE;
        this.model.waypoints.intRange = WT_G3x5_WaypointInfo.INT_RANGE;
    }

    _initView() {
        let labelManager = new WT_MapViewTextLabelManager({preventOverlap: true});
        let waypointRenderer = new WT_MapViewWaypointCanvasRenderer(labelManager);
        let runwayRenderer = new WT_MapViewRunwayCanvasRenderer(labelManager);

        this.view.addLayer(this._bingLayer = new WT_MapViewBingLayer(this.instrumentID));
        this.view.addLayer(new WT_MapViewAirportInfoLayer(runwayRenderer));
        this.view.addLayer(new WT_MapViewWaypointLayer(this._icaoSearchers, this._icaoWaypointFactory, waypointRenderer, labelManager));
        this.view.addLayer(new WT_MapViewTextLabelLayer(labelManager));
        this.view.addLayer(new WT_MapViewRangeRingLayer());
        this.view.addLayer(new WT_MapViewCrosshairLayer());
        this.view.addLayer(new WT_MapViewAirplaneLayer());
        this.view.addLayer(new WT_MapViewOrientationDisplayLayer(WT_G3x5_WaypointInfo.ORIENTATION_DISPLAY_TEXT));
        this.view.addLayer(new WT_MapViewMiniCompassLayer());
    }

    _initController() {
        this.controller.addSetting(this._rangeTargetController = new WT_G3x5_WaypointInfoRangeTargetController(this.controller));

        this.controller.init();
        this.controller.update();
    }

    init(viewElement) {
        this._model = new WT_MapModel();
        this._view = viewElement;
        this.view.setModel(this.model);
        this._controller = new WT_MapController(this.controllerID, this.model, this.view);

        this._initModel();
        this._initView();
        this._initController();
    }

    sleep() {
        this._bingLayer.sleep();
    }

    wake() {
    }

    update() {
        this._rangeTargetController.update();
        this.view.update();
    }
}

WT_G3x5_WaypointInfo.MAP_RANGE_LEVELS =
    [250, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.FOOT)).concat(
        [0.25, 0.5, 0.75, 1, 1.5, 2.5, 4, 5, 7.5, 10, 15, 25, 40, 50, 75, 100, 150, 250, 400, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.NMILE))
    );
WT_G3x5_WaypointInfo.MAP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(1);

WT_G3x5_WaypointInfo.AIRPORT_LARGE_RANGE = WT_Unit.NMILE.createNumber(100);
WT_G3x5_WaypointInfo.AIRPORT_MEDIUM_RANGE = WT_Unit.NMILE.createNumber(50);
WT_G3x5_WaypointInfo.AIRPORT_SMALL_RANGE = WT_Unit.NMILE.createNumber(15);
WT_G3x5_WaypointInfo.VOR_RANGE = WT_Unit.NMILE.createNumber(50);
WT_G3x5_WaypointInfo.NDB_RANGE = WT_Unit.NMILE.createNumber(25);
WT_G3x5_WaypointInfo.INT_RANGE = WT_Unit.NMILE.createNumber(7.5);

WT_G3x5_WaypointInfo.ORIENTATION_DISPLAY_TEXT = ["NORTH UP"];

class WT_G3x5_WaypointInfoRangeTargetController extends WT_MapSettingGroup {
    /**
     *
     * @param {WT_MapController} controller
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     */
    constructor(controller, icaoWaypointFactory) {
        super(controller, [], false, false);

        this._icaoWaypointFactory = icaoWaypointFactory;

        this._rangeSetting = new WT_MapRangeSetting(controller, WT_G3x5_WaypointInfo.MAP_RANGE_LEVELS, WT_G3x5_WaypointInfo.MAP_RANGE_DEFAULT, false, false);
        this.addSetting(this._rangeSetting);

        controller.view.setTargetOffsetHandler(this);
        controller.view.setRangeInterpreter(this);

        this._target = new WT_GeoPoint(0, 0);
        /**
         * @type {WT_ICAOWaypoint}
         */
        this._waypoint = null;
    }

    /**
     * @readonly
     * @property {WT_MapRangeSetting} rangeSetting
     * @type {WT_MapRangeSetting}
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
        range.set(model.range).scale(4, true);
    }

    _updateRange() {
        this.model.range = this._rangeSetting.getRange();
    }

    /**
     *
     * @param {WT_Airport} airport
     */
    _calculateAirportRadius(airport) {
        let maxRunwayDistance = 0;
        for (let runway of airport.runways) {
            let distance = Math.max(runway.start.distance(airport.location), runway.end.distance(airport.location));
            if (distance > maxRunwayDistance) {
                maxRunwayDistance = distance;
            }
        }
        return maxRunwayDistance;
    }

    /**
     *
     * @param {WT_ICAOWaypoint} waypoint
     */
    _setInitialRange(waypoint) {
        let range = WT_G3x5_WaypointInfo.MAP_RANGE_DEFAULT;
        if (waypoint && waypoint.type === WT_ICAOWaypoint.Type.AIRPORT) {
            let airportRadius = this._calculateAirportRadius(waypoint);
            if (airportRadius > 0) {
                airportRadius *= 0.6;
                range = WT_G3x5_WaypointInfo.MAP_RANGE_LEVELS.find(rangeLevel => rangeLevel.compare(airportRadius, WT_Unit.GA_RADIAN) >= 0);
            }
        }
        this._rangeSetting.setRange(range);
    }

    _setWaypoint(waypoint) {
        if (waypoint) {
            this._target.set(waypoint.location);
        } else {
            this._target.set(0, 0);
        }
        this._setInitialRange(waypoint);
        this._waypoint = waypoint;
    }

    _updateWaypoint() {
        let waypoint = this.model.waypointInfo.waypoint;
        if (this._waypoint === null && waypoint === null || (this._waypoint && waypoint && this._waypoint.uniqueID === waypoint.uniqueID)) {
            return;
        }

        this._setWaypoint(waypoint);
    }

    _updateTarget() {
        this.model.target = this._target;
    }

    update() {
        this._updateWaypoint();
        this._updateTarget();
        this._updateRange();
    }
}