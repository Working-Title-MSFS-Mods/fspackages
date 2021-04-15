class WT_G3x5_WaypointInfo {
    constructor(instrumentID, airplane, icaoWaypointFactory, icaoSearchers) {
        this._instrumentID = instrumentID;
        this._settingModelID = `${instrumentID}-WaypointInfo`;

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
    get controllerID() {
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
     * @property {WT_MapModelWaypointInfoModule} waypointInfoModule - the waypoint info module associated with this map.
     * @type {WT_G3x5_MapModelWaypointInfoModule}
     */
    get waypointInfoModule() {
        return this._waypointInfoModule;
    }

    _initModel() {
        this.model.addModule(new WT_MapModelUnitsModule());
        this.model.addModule(new WT_MapModelCrosshairModule());
        this.model.addModule(new WT_MapModelAirplaneIconModule());
        this.model.addModule(new WT_MapModelTerrainModule());
        this.model.addModule(new WT_MapModelWeatherDisplayModule());
        this.model.addModule(new WT_MapModelOrientationModule());
        this.model.addModule(new WT_MapModelRangeRingModule());
        this.model.addModule(new WT_MapModelWaypointsModule());
        this.model.addModule(this._waypointInfoModule = new WT_G3x5_MapModelWaypointInfoModule(this._icaoWaypointFactory));
        this.model.addModule(this._waypointHighlightModule = new WT_MapModelWaypointHighlightModule(this._icaoWaypointFactory));

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
        this._waypointRenderer = new WT_MapViewWaypointCanvasRenderer(labelManager);
        let runwayRenderer = new WT_G3x5_MapViewRunwayCanvasRenderer(labelManager);

        this.view.addLayer(this._bingLayer = new WT_MapViewBingLayer(this.instrumentID));
        this.view.addLayer(new WT_G3x5_MapViewAirportRunwayLayer(runwayRenderer));
        this.view.addLayer(new WT_MapViewWaypointLayer(this._icaoSearchers, this._icaoWaypointFactory, this._waypointRenderer, labelManager));
        this.view.addLayer(new WT_MapViewWaypointHighlightLayer(this._waypointRenderer));
        this.view.addLayer(new WT_MapViewTextLabelLayer(labelManager));
        this.view.addLayer(new WT_MapViewRangeRingLayer());
        this.view.addLayer(new WT_MapViewCrosshairLayer());
        this.view.addLayer(new WT_MapViewAirplaneLayer());
        this.view.addLayer(new WT_MapViewOrientationDisplayLayer(WT_G3x5_WaypointInfo.ORIENTATION_DISPLAY_TEXT));
        this.view.addLayer(new WT_MapViewMiniCompassLayer());
    }

    _initSettingModel() {
        this.settingModel.addSetting(this._rangeTargetController = new WT_G3x5_WaypointInfoRangeTargetController(this.settingModel));

        this.settingModel.init();
        this.settingModel.update();
    }

    init(viewElement) {
        this._model = new WT_MapModel(this._airplane);
        this._view = viewElement;
        this.view.setModel(this.model);
        this._settingModel = new WT_MapSettingModel(this.controllerID, this.model, this.view);

        this._initModel();
        this._initView();
        this._initSettingModel();
    }

    sleep() {
        this._bingLayer.sleep();
    }

    wake() {
    }

    update() {
        this._rangeTargetController.update();
        this.view.update();
        this._waypointRenderer.update(this.view.state);
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
     * @param {WT_MapSettingModel} settingModel
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     */
    constructor(settingModel, icaoWaypointFactory) {
        super(settingModel, [], false, false);

        this._icaoWaypointFactory = icaoWaypointFactory;

        this._rangeSetting = new WT_MapRangeSetting(settingModel, WT_G3x5_WaypointInfo.MAP_RANGE_LEVELS, WT_G3x5_WaypointInfo.MAP_RANGE_DEFAULT, false, false);
        this.addSetting(this._rangeSetting);

        settingModel.mapView.setTargetOffsetHandler(this);
        settingModel.mapView.setRangeInterpreter(this);

        this._target = new WT_GeoPoint(0, 0);
        /**
         * @type {WT_ICAOWaypoint}
         */
        this._waypoint = null;

        this._aspectRatio = 1;
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
        this.mapModel.range = this._rangeSetting.getRange();
    }

    /**
     *
     * @param {WT_Airport} airport
     */
    _calculateAirportRadius(airport) {
        let maxRunwayDistance = airport.runways.array.reduce((accum, runway) => {
            let distance = Math.max(runway.start.distance(airport.location), runway.end.distance(airport.location));
            return (distance > accum) ? distance : accum;
        }, 0);
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
                airportRadius *= 0.6 * Math.max(1, 1 / this._aspectRatio);
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
        this.mapModel.waypointHighlight.waypoint = waypoint;
        this._waypoint = waypoint;
    }

    _updateWaypoint() {
        let waypoint = this.mapModel.waypointInfo.waypoint;
        if (this._waypoint === null && waypoint === null || (this._waypoint && waypoint && this._waypoint.uniqueID === waypoint.uniqueID)) {
            return;
        }

        this._setWaypoint(waypoint);
    }

    _updateTarget() {
        this.mapModel.target = this._target;
    }

    update() {
        let aspectRatio = this.mapView.projection.viewWidth / this.mapView.projection.viewHeight;
        if (aspectRatio !== this._aspectRatio) {
            this._aspectRatio = aspectRatio;
            this._setInitialRange(this._waypoint);
        }

        this._updateWaypoint();
        this._updateTarget();
        this._updateRange();
    }
}