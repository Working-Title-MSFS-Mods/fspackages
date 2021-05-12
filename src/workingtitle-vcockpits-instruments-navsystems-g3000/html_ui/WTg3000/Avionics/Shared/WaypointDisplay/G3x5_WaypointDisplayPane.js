class WT_G3x5_WaypointDisplayPane extends WT_G3x5_DisplayPane {
    constructor(paneID, settings, airplane, icaoWaypointFactory, icaoSearchers, unitsSettingModel) {
        super(paneID, settings);

        this._settingModelID = this._getSettingModelID(paneID);

        this._airplane = airplane;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._icaoSearchers = icaoSearchers;
        this._unitsSettingModel = unitsSettingModel;

        this._waypointRequestID = 0;
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
        return this._mapModel;
    }

    /**
     * The view associated with this map.
     * @readonly
     * @type {WT_MapView}
     */
    get mapView() {
        return this._mapView;
    }

    /**
     * The setting model associated with this map.
     * @readonly
     * @type {WT_MapSettingModel}
     */
    get settingModel() {
        return this._settingModel;
    }

    _initMapModel() {
        this._unitsAdapter = new WT_G3x5_UnitsSettingModelMapModelAdapter(this._unitsSettingModel, this.mapModel);
        this.mapModel.addModule(new WT_MapModelCrosshairModule());
        this.mapModel.addModule(new WT_MapModelAirplaneIconModule());
        this.mapModel.addModule(new WT_MapModelTerrainModule());
        this.mapModel.addModule(new WT_MapModelWeatherDisplayModule());
        this.mapModel.addModule(new WT_MapModelOrientationModule());
        this.mapModel.addModule(new WT_MapModelRangeRingModule());
        this.mapModel.addModule(new WT_MapModelWaypointsModule());
        this.mapModel.addModule(new WT_G3x5_MapModelWaypointDisplayModule());
        this.mapModel.addModule(new WT_MapModelWaypointHighlightModule());

        this.mapModel.terrain.mode = WT_MapModelTerrainModule.TerrainMode.OFF;

        this.mapModel.waypoints.airwayShow = false;
        this.mapModel.waypoints.airportSmallRange = WT_G3x5_WaypointDisplayPane.AIRPORT_SMALL_RANGE;
        this.mapModel.waypoints.airportMediumRange = WT_G3x5_WaypointDisplayPane.AIRPORT_MEDIUM_RANGE;
        this.mapModel.waypoints.airportLargeRange = WT_G3x5_WaypointDisplayPane.AIRPORT_LARGE_RANGE;
        this.mapModel.waypoints.vorRange = WT_G3x5_WaypointDisplayPane.VOR_RANGE;
        this.mapModel.waypoints.ndbRange = WT_G3x5_WaypointDisplayPane.NDB_RANGE;
        this.mapModel.waypoints.intRange = WT_G3x5_WaypointDisplayPane.INT_RANGE;
    }

    _initSettingValues() {
        this._setICAO(this._icaoSetting.getValue());
    }

    _initSettingListeners() {
        this._icaoSetting.addListener(this._onICAOSettingChanged.bind(this));
    }

    _initSettingModel() {
        this.settingModel.addSetting(this._icaoSetting = new WT_G3x5_WaypointDisplayICAOSetting(this.settingModel));

        this.settingModel.init();

        this._initSettingValues();
        this._initSettingListeners();
    }

    init(viewElement) {
        this._mapModel = new WT_MapModel(this._airplane);
        this._mapView = viewElement;
        this.mapView.setModel(this.mapModel);
        this._settingModel = new WT_DataStoreSettingModel(this.settingModelID);

        this._initMapModel();
        this._initMapView();
        this._initSettingModel();
    }

    _setWaypoint(waypoint) {
        this.mapModel.waypointDisplay.waypoint = waypoint;
        this.mapModel.waypointHighlight.waypoint = waypoint;
    }

    async _requestWaypoint(icao, requestID) {
        let waypoint = null;
        try {
            waypoint = await this._icaoWaypointFactory.getWaypoint(icao);
        } catch (e) {}

        if (requestID === this._waypointRequestID) {
            this._setWaypoint(waypoint);
        }
    }

    _setICAO(icao) {
        let currentWaypoint = this.mapModel.waypointDisplay.waypoint;
        if ((icao === "" && currentWaypoint === null) || (currentWaypoint && currentWaypoint.icao === icao)) {
            return;
        }

        this._waypointRequestID++;
        if (icao) {
            this._requestWaypoint(icao, this._waypointRequestID);
        } else {
            this._setWaypoint(null);
        }
    }

    _onICAOSettingChanged(setting, newValue, oldValue) {
        this._setICAO(newValue);
    }
}
WT_G3x5_WaypointDisplayPane.MAP_RANGE_LEVELS =
    [250, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.FOOT)).concat(
        [0.25, 0.5, 0.75, 1, 1.5, 2.5, 4, 5, 7.5, 10, 15, 25, 40, 50, 75, 100, 150, 250, 400, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.NMILE))
    );

WT_G3x5_WaypointDisplayPane.AIRPORT_LARGE_RANGE = WT_Unit.NMILE.createNumber(100);
WT_G3x5_WaypointDisplayPane.AIRPORT_MEDIUM_RANGE = WT_Unit.NMILE.createNumber(25);
WT_G3x5_WaypointDisplayPane.AIRPORT_SMALL_RANGE = WT_Unit.NMILE.createNumber(7.5);
WT_G3x5_WaypointDisplayPane.VOR_RANGE = WT_Unit.NMILE.createNumber(50);
WT_G3x5_WaypointDisplayPane.NDB_RANGE = WT_Unit.NMILE.createNumber(25);
WT_G3x5_WaypointDisplayPane.INT_RANGE = WT_Unit.NMILE.createNumber(2.5);

WT_G3x5_WaypointDisplayPane.ORIENTATION_DISPLAY_TEXT = ["NORTH UP"];