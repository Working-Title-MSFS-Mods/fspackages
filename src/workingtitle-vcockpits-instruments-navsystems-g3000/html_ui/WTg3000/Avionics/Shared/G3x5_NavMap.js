class WT_G3x5_NavMap {
    /**
     * @param {String} instrumentID
     * @param {WT_PlayerAirplane} airplane
     * @param {Number} altimeterIndex
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @param {{{airport:WT_ICAOSearcher, vor:WT_ICAOSearcher, ndb:WT_ICAOSearcher, int:WT_ICAOSearcher}}} icaoSearchers
     * @param {WT_FlightPlanManager} flightPlanManager
     * @param {WT_G3x5_UnitsSettingModel} unitsController
     * @param {WT_CitySearchHandler} citySearcher
     * @param {WT_MapViewBorderData} borderData
     * @param {WT_MapViewRoadFeatureCollection} roadFeatureData
     * @param {WT_MapViewRoadLabelCollection} roadLabelData
     * @param {WT_G3x5_TrafficSystem} trafficSystem
     * @param {*} layerOptions
     */
    constructor(instrumentID, airplane, airspeedSensorIndex, altimeterIndex, icaoWaypointFactory, icaoSearchers, flightPlanManager, unitsController, citySearcher, borderData, roadFeatureData, roadLabelData, trafficSystem, layerOptions = WT_G3x5_NavMap.LAYER_OPTIONS_DEFAULT) {
        this._instrumentID = instrumentID;
        this._settingModelID = instrumentID;

        this._airplane = airplane;
        this._airspeedSensorIndex = airspeedSensorIndex;
        this._altimeterIndex = altimeterIndex;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._icaoSearchers = icaoSearchers;
        this._fpm = flightPlanManager;
        this._unitsController = unitsController;
        this._citySearcher = citySearcher;
        this._borderData = borderData;
        this._roadFeatureData = roadFeatureData;
        this._roadLabelData = roadLabelData;
        this._trafficSystem = trafficSystem;

        this._layerOptions = layerOptions;
    }

    /**
     * @readonly
     * @type {String}
     */
    get instrumentID() {
        return this._instrumentID;
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
     * @type {WT_MapRangeSetting}
     */
    get rangeSetting() {
        return this._rangeTargetRotationController.rangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapTerrainModeSetting}
     */
    get terrainSetting() {
        return this._terrainSetting;
    }

    /**
     * @readonly
     * @type {WT_MapDCLTRSetting}
     */
    get dcltrSetting() {
        return this._dcltrSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolShowSetting}
     */
    get nexradShowSetting() {
        return this._nexradShowSetting;
    }

    _initUnitsModule() {
        this._unitsAdapter = new WT_G3x5_UnitsControllerMapModelAdapter(this._unitsController, this.model);
    }

    /**
     * @returns {WT_G3x5_MapModelNavMapTrafficModule}
     */
    _createTrafficModule() {
        return new WT_G3x5_MapModelNavMapTrafficModule(this._trafficSystem);
    }

    _initModel() {
        this._initUnitsModule();
        this.model.addModule(new WT_MapModelCrosshairModule());
        this.model.addModule(new WT_MapModelTerrainModule());
        this.model.addModule(new WT_MapModelWeatherDisplayModule());
        this.model.addModule(new WT_MapModelOrientationModule());
        if (this._layerOptions.windData) {
            this.model.addModule(new WT_MapModelWindDataModule());
        }
        this.model.addModule(new WT_MapModelPointerModule());
        this.model.addModule(new WT_MapModelRangeRingModule());
        this.model.addModule(new WT_MapModelRangeCompassModule());
        this.model.addModule(new WT_MapModelTrackVectorModule());
        this.model.addModule(new WT_MapModelFuelRingModule());
        this.model.addModule(new WT_MapModelAltitudeInterceptModule());
        this.model.addModule(new WT_MapModelBordersModule());
        this.model.addModule(new WT_MapModelWaypointsModule());
        this.model.addModule(new WT_MapModelCitiesModule());
        if (this._layerOptions.roads) {
            this.model.addModule(new WT_MapModelRoadsModule());
        }
        this.model.addModule(this._createTrafficModule());
    }

    /**
     * @returns {WT_G3x5_MapViewTrafficIntruderLayer}
     */
    _createTrafficIntruderLayer() {
    }

    /**
     * @returns {WT_G3x5_MapViewNavMapTrafficStatusLayer}
     */
    _createTrafficStatusLayer() {
    }

    _initView() {
        let labelManager = new WT_MapViewTextLabelManager({preventOverlap: true});
        this._waypointRenderer = new WT_MapViewWaypointCanvasRenderer(labelManager);

        this.view.addLayer(this._bingLayer = new WT_MapViewBingLayer(`${this.instrumentID}`));
        /*
        this.view.addLayer(new WT_MapViewBorderLayer(this._borderData, WT_G3x5_NavMap.BORDER_LOD_RESOLUTION_THRESHOLDS, labelManager));
        if (this._layerOptions.roads) {
            this.view.addLayer(new WT_MapViewRoadLayer(this._roadFeatureData, this._roadLabelData, WT_G3x5_NavMap.ROAD_LOD_RESOLUTION_THRESHOLDS));
        }
        this.view.addLayer(new WT_MapViewCityLayer(this._citySearcher, labelManager));
        this.view.addLayer(new WT_MapViewWaypointLayer(this._icaoSearchers, this._icaoWaypointFactory, this._waypointRenderer, labelManager));
        this.view.addLayer(new WT_MapViewFlightPlanLayer(this._fpm, this._icaoWaypointFactory, this._waypointRenderer, labelManager, new WT_G3x5_MapViewFlightPlanLegCanvasStyler()));
        this.view.addLayer(new WT_MapViewTextLabelLayer(labelManager));
        this.view.addLayer(new WT_MapViewFuelRingLayer());
        this.view.addLayer(new WT_MapViewAltitudeInterceptLayer(this._altimeterIndex));
        this.view.addLayer(new WT_MapViewTrackVectorLayer(this._airspeedSensorIndex));
        */
        this.view.addLayer(new WT_MapViewRangeRingLayer());
        this.view.addLayer(new WT_MapViewRangeCompassArcLayer({
            getForwardTickBearing: function(state) {
                return state.model.orientation.mode === WT_G3x5_NavMap.Orientation.TRK ? state.model.airplane.navigation.trackTrue() : state.model.airplane.navigation.headingTrue();
            }
        }));
        this.view.addLayer(new WT_MapViewCrosshairLayer());
        this.view.addLayer(new WT_MapViewAirplaneLayer());
        this.view.addLayer(this._createTrafficIntruderLayer());
        this.view.addLayer(this._createTrafficStatusLayer());
        this.view.addLayer(new WT_MapViewPointerLayer());
        if (this._layerOptions.windData) {
            this.view.addLayer(new WT_MapViewWindDataLayer());
        }
        this.view.addLayer(new WT_MapViewOrientationDisplayLayer(WT_G3x5_NavMap.ORIENTATION_DISPLAY_TEXTS));
        if (this._layerOptions.rangeDisplay) {
            this.view.addLayer(new WT_MapViewRangeDisplayLayer());
        }
        this.view.addLayer(new WT_MapViewPointerInfoLayer());
        if (this._layerOptions.miniCompass) {
            this.view.addLayer(new WT_MapViewMiniCompassLayer());
        }
    }

    _initSettingModel() {
        this.settingModel.addSetting(this._rangeTargetRotationController = new WT_G3x5_MapRangeTargetRotationController(this.settingModel));
        this.settingModel.addSetting(this._terrainSetting = new WT_MapTerrainModeSetting(this.settingModel));
        this.settingModel.addSetting(new WT_MapTrackVectorSettingGroup(this.settingModel));
        this.settingModel.addSetting(new WT_MapFuelRingSettingGroup(this.settingModel));
        this.settingModel.addSetting(new WT_MapAltitudeInterceptSetting(this.settingModel));

        if (this._layerOptions.windData) {
            this.settingModel.addSetting(new WT_MapWindDataShowSetting(this.settingModel));
        }

        this._dcltrSetting = new WT_MapDCLTRSetting(this.settingModel, [
            // OFF
            {},

            // DCLTR1
            {
                stateBorder: true,
                city: true,
                road: true
            },

            // DCLTR2
            {
                stateBorder: true,
                city: true,
                road: true,
                userWaypoint: true,
                vor: true,
                ndb: true,
                int: true
            },

            // LEAST
            {
                nexrad: true,
                stateBorder: true,
                city: true,
                road: true,
                userWaypoint: true,
                vor: true,
                ndb: true,
                int: true,
                airport: true
            }
        ]);
        this.settingModel.addSetting(this._dcltrSetting);

        this.settingModel.addSetting(this._nexradShowSetting = new WT_MapSymbolShowSetting(this.settingModel, "nexrad", "weatherDisplay", "nexradShow", WT_G3x5_NavMap.NEXRAD_SHOW_KEY, this._dcltrSetting, false));
        this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.NEXRAD_RANGE_KEY, "weatherDisplay", "nexradRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.NEXRAD_RANGE_DEFAULT));

        this.settingModel.addSetting(new WT_MapSymbolShowSetting(this.settingModel, "airway", "waypoints", "airwayShow", WT_G3x5_NavMap.AIRWAY_SHOW_KEY, this._dcltrSetting));
        this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.AIRWAY_RANGE_KEY, "waypoints", "airwayRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.AIRWAY_RANGE_DEFAULT));

        this.settingModel.addSetting(new WT_MapSymbolShowSetting(this.settingModel, "airport", "waypoints", "airportShow", WT_G3x5_NavMap.AIRPORT_SHOW_KEY, this._dcltrSetting));
        this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.AIRPORT_LARGE_RANGE_KEY, "waypoints", "airportLargeRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.AIRPORT_LARGE_RANGE_DEFAULT));
        this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.AIRPORT_MEDIUM_RANGE_KEY, "waypoints", "airportMediumRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.AIRPORT_MEDIUM_RANGE_DEFAULT));
        this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.AIRPORT_SMALL_RANGE_KEY, "waypoints", "airportSmallRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.AIRPORT_SMALL_RANGE_DEFAULT));

        this.settingModel.addSetting(new WT_MapSymbolShowSetting(this.settingModel, "vor", "waypoints", "vorShow", WT_G3x5_NavMap.VOR_SHOW_KEY, this._dcltrSetting));
        this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.VOR_RANGE_KEY, "waypoints", "vorRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.VOR_RANGE_DEFAULT));

        this.settingModel.addSetting(new WT_MapSymbolShowSetting(this.settingModel, "ndb", "waypoints", "ndbShow", WT_G3x5_NavMap.NDB_SHOW_KEY, this._dcltrSetting));
        this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.NDB_RANGE_KEY, "waypoints", "ndbRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.NDB_RANGE_DEFAULT));

        this.settingModel.addSetting(new WT_MapSymbolShowSetting(this.settingModel, "int", "waypoints", "intShow", WT_G3x5_NavMap.INT_SHOW_KEY, this._dcltrSetting));
        this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.INT_RANGE_KEY, "waypoints", "intRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.INT_RANGE_DEFAULT));

        this.settingModel.addSetting(new WT_MapSymbolShowSetting(this.settingModel, "stateBorder", "borders", "stateBorderShow", WT_G3x5_NavMap.BORDERS_SHOW_KEY, this._dcltrSetting));
        this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.BORDERS_RANGE_KEY, "borders", "stateBorderRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.BORDERS_RANGE_DEFAULT));

        this.settingModel.addSetting(new WT_MapSymbolShowSetting(this.settingModel, "city", "cities", "show", WT_G3x5_NavMap.CITY_SHOW_KEY, this._dcltrSetting));
        this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.CITY_LARGE_RANGE_KEY, "cities", "largeRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.CITY_LARGE_RANGE_DEFAULT));
        this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.CITY_MEDIUM_RANGE_KEY, "cities", "mediumRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.CITY_MEDIUM_RANGE_DEFAULT));
        this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.CITY_SMALL_RANGE_KEY, "cities", "smallRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.CITY_SMALL_RANGE_DEFAULT));

        if (this._layerOptions.roads) {
            this.settingModel.addSetting(new WT_MapSymbolShowSetting(this.settingModel, "road", "roads", "show", WT_G3x5_NavMap.ROAD_SHOW_KEY, this._dcltrSetting));
            this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.ROAD_HIGHWAY_RANGE_KEY, "roads", "highwayRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.ROAD_HIGHWAY_RANGE_DEFAULT));
            this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.ROAD_PRIMARY_RANGE_KEY, "roads", "primaryRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.ROAD_PRIMARY_RANGE_DEFAULT));
        }

        this.settingModel.addSetting(new WT_G3x5_NavMapTrafficShowSetting(this.settingModel));

        this.settingModel.addSetting(new WT_G3x5_TrafficMapAltitudeModeSetting(this.settingModel));
        this.settingModel.addSetting(new WT_G3x5_TrafficMapAltitudeRestrictionSetting(this.settingModel));
        this.settingModel.addSetting(new WT_G3x5_TrafficMapMotionVectorModeSetting(this.settingModel));
        this.settingModel.addSetting(new WT_G3x5_TrafficMapMotionVectorLookaheadSetting(this.settingModel));

        this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.TRAFFIC_SYMBOL_RANGE_KEY, "traffic", "symbolRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.TRAFFIC_SYMBOL_RANGE_DEFAULT));

        this.settingModel.addSetting(new WT_MapSymbolShowSetting(this.settingModel, "trafficLabel", "traffic", "labelShow", WT_G3x5_NavMap.TRAFFIC_LABEL_SHOW_KEY, this._dcltrSetting));
        this.settingModel.addSetting(new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMap.TRAFFIC_LABEL_RANGE_KEY, "traffic", "labelRange", WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.TRAFFIC_LABEL_RANGE_DEFAULT));

        this.settingModel.init();
        this.settingModel.update();
    }

    init(viewElement) {
        this._model = new WT_MapModel(this._airplane);
        this._view = viewElement;
        this.view.setModel(this.model);
        this._settingModel = new WT_MapSettingModel(this._settingModelID, this.model, this.view);

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
        this._rangeTargetRotationController.update();
        this.view.update();
        this._waypointRenderer.update(this.view.state);
    }
}
WT_G3x5_NavMap.TRAFFIC_SETTING_MODEL_ID_SUFFIX = "TrafficMap";
WT_G3x5_NavMap.LAYER_OPTIONS_DEFAULT = {
    miniCompass: true,
    rangeDisplay: false,
    windData: true,
    roads: true
};
WT_G3x5_NavMap.BORDER_LOD_RESOLUTION_THRESHOLDS = [
    WT_Unit.NMILE.createNumber(0),
    WT_Unit.NMILE.createNumber(0.06),
    WT_Unit.NMILE.createNumber(0.3),
    WT_Unit.NMILE.createNumber(0.9),
    WT_Unit.NMILE.createNumber(3)
];
WT_G3x5_NavMap.ROAD_LOD_RESOLUTION_THRESHOLDS = [
    WT_Unit.NMILE.createNumber(0),
    WT_Unit.NMILE.createNumber(0.01),
    WT_Unit.NMILE.createNumber(0.05),
    WT_Unit.NMILE.createNumber(0.3)
];

WT_G3x5_NavMap.MAP_RANGE_LEVELS =
    [250, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.FOOT)).concat(
        [0.25, 0.5, 0.75, 1, 1.5, 2.5, 4, 5, 7.5, 10, 15, 25, 40, 50, 75, 100, 150, 250, 400, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.NMILE))
    );
WT_G3x5_NavMap.MAP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

WT_G3x5_NavMap.ORIENTATION_KEY = "WT_Map_Orientation";
/**
 * @enum {Number}
 */
WT_G3x5_NavMap.Orientation = {
    HDG: 0,
    TRK: 1,
    NORTH: 2
};
WT_G3x5_NavMap.ORIENTATION_DISPLAY_TEXTS = [
    "HDG UP",
    "TRK UP",
    "NORTH UP"
];

WT_G3x5_NavMap.DCLTR_DISPLAY_TEXTS = [
    "Off",
    "DCLTR1",
    "DCLTR2",
    "Least"
];

WT_G3x5_NavMap.NORTHUP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(1000);

WT_G3x5_NavMap.TERRAIN_MODE_DISPLAY_TEXT = [
    "Off",
    "Absolute",
    "Relative"
];

WT_G3x5_NavMap.NEXRAD_SHOW_KEY = "WT_Map_NEXRAD_Show";
WT_G3x5_NavMap.NEXRAD_RANGE_KEY = "WT_Map_NEXRAD_Range";
WT_G3x5_NavMap.NEXRAD_RANGE_MAX = WT_Unit.NMILE.createNumber(1000);
WT_G3x5_NavMap.NEXRAD_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(1000);

WT_G3x5_NavMap.AIRWAY_SHOW_KEY = "WT_Map_Airway_Show";
WT_G3x5_NavMap.AIRWAY_RANGE_KEY = "WT_Map_Airway_Range";
WT_G3x5_NavMap.AIRWAY_RANGE_MAX = WT_Unit.NMILE.createNumber(100);
WT_G3x5_NavMap.AIRWAY_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(50);

WT_G3x5_NavMap.AIRPORT_SHOW_KEY = "WT_Map_Airport_Show";

WT_G3x5_NavMap.AIRPORT_LARGE_RANGE_KEY = "WT_Map_AirportLarge_Range";
WT_G3x5_NavMap.AIRPORT_LARGE_RANGE_MAX = WT_Unit.NMILE.createNumber(1000);
WT_G3x5_NavMap.AIRPORT_LARGE_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(100);

WT_G3x5_NavMap.AIRPORT_MEDIUM_RANGE_KEY = "WT_Map_AirportMedium_Range";
WT_G3x5_NavMap.AIRPORT_MEDIUM_RANGE_MAX = WT_Unit.NMILE.createNumber(400);
WT_G3x5_NavMap.AIRPORT_MEDIUM_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(50);

WT_G3x5_NavMap.AIRPORT_SMALL_RANGE_KEY = "WT_Map_AirportSmall_Range";
WT_G3x5_NavMap.AIRPORT_SMALL_RANGE_MAX = WT_Unit.NMILE.createNumber(150);
WT_G3x5_NavMap.AIRPORT_SMALL_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(15);

WT_G3x5_NavMap.VOR_SHOW_KEY = "WT_Map_VOR_Show";
WT_G3x5_NavMap.VOR_RANGE_KEY = "WT_Map_VOR_Range";
WT_G3x5_NavMap.VOR_RANGE_MAX = WT_Unit.NMILE.createNumber(250);
WT_G3x5_NavMap.VOR_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(50);

WT_G3x5_NavMap.NDB_SHOW_KEY = "WT_Map_NDB_Show";
WT_G3x5_NavMap.NDB_RANGE_KEY = "WT_Map_NDB_Range";
WT_G3x5_NavMap.NDB_RANGE_MAX = WT_Unit.NMILE.createNumber(50);
WT_G3x5_NavMap.NDB_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

WT_G3x5_NavMap.INT_SHOW_KEY = "WT_Map_INT_Show";
WT_G3x5_NavMap.INT_RANGE_KEY = "WT_Map_INT_Range";
WT_G3x5_NavMap.INT_RANGE_MAX = WT_Unit.NMILE.createNumber(40);
WT_G3x5_NavMap.INT_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(7.5);

WT_G3x5_NavMap.BORDERS_SHOW_KEY = "WT_Map_StateBorders_Show";
WT_G3x5_NavMap.BORDERS_RANGE_KEY = "WT_Map_StateBorders_Range";
WT_G3x5_NavMap.BORDERS_RANGE_MAX = WT_Unit.NMILE.createNumber(1000);
WT_G3x5_NavMap.BORDERS_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(400);

WT_G3x5_NavMap.CITY_SHOW_KEY = "WT_Map_City_Show";

WT_G3x5_NavMap.CITY_LARGE_RANGE_KEY = "WT_Map_CityLarge_Range";
WT_G3x5_NavMap.CITY_LARGE_RANGE_MAX = WT_Unit.NMILE.createNumber(1000);
WT_G3x5_NavMap.CITY_LARGE_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(100);

WT_G3x5_NavMap.CITY_MEDIUM_RANGE_KEY = "WT_Map_CityMedium_Range";
WT_G3x5_NavMap.CITY_MEDIUM_RANGE_MAX = WT_Unit.NMILE.createNumber(400);
WT_G3x5_NavMap.CITY_MEDIUM_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(50);

WT_G3x5_NavMap.CITY_SMALL_RANGE_KEY = "WT_Map_CitySmall_Range";
WT_G3x5_NavMap.CITY_SMALL_RANGE_MAX = WT_Unit.NMILE.createNumber(100);
WT_G3x5_NavMap.CITY_SMALL_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

WT_G3x5_NavMap.ROAD_SHOW_KEY = "WT_Map_Road_Show";

WT_G3x5_NavMap.ROAD_HIGHWAY_RANGE_KEY = "WT_Map_RoadHighway_Range";
WT_G3x5_NavMap.ROAD_HIGHWAY_RANGE_MAX = WT_Unit.NMILE.createNumber(400);
WT_G3x5_NavMap.ROAD_HIGHWAY_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(50);

WT_G3x5_NavMap.ROAD_PRIMARY_RANGE_KEY = "WT_Map_RoadPrimary_Range";
WT_G3x5_NavMap.ROAD_PRIMARY_RANGE_MAX = WT_Unit.NMILE.createNumber(150);
WT_G3x5_NavMap.ROAD_PRIMARY_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(15);

WT_G3x5_NavMap.TRAFFIC_SYMBOL_RANGE_KEY = "WT_Map_TrafficSymbol_Range";
WT_G3x5_NavMap.TRAFFIC_SYMBOL_RANGE_MAX = WT_Unit.NMILE.createNumber(100);
WT_G3x5_NavMap.TRAFFIC_SYMBOL_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

WT_G3x5_NavMap.TRAFFIC_LABEL_SHOW_KEY = "WT_Map_TrafficLabel_Show";
WT_G3x5_NavMap.TRAFFIC_LABEL_RANGE_KEY = "WT_Map_TrafficLabel_Range";
WT_G3x5_NavMap.TRAFFIC_LABEL_RANGE_MAX = WT_Unit.NMILE.createNumber(100);
WT_G3x5_NavMap.TRAFFIC_LABEL_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

class WT_G3x5_MapRangeTargetRotationController extends WT_MapSettingGroup {
    /**
     * @param {WT_MapSetting} model
     */
    constructor(model) {
        super(model, [], true, false);

        this._rangeSetting = new WT_MapRangeSetting(model, WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.MAP_RANGE_DEFAULT, true, false);
        this._orientationSetting = new WT_MapSetting(model, WT_G3x5_NavMap.ORIENTATION_KEY, WT_G3x5_NavMap.Orientation.HDG, true, false, true);
        this._autoNorthUpSetting = new WT_MapAutoNorthUpSettingGroup(model, WT_G3x5_NavMap.MAP_RANGE_LEVELS, WT_G3x5_NavMap.NORTHUP_RANGE_DEFAULT);
        this._pointerSetting = new WT_MapPointerSettingGroup(model);

        this.addSetting(this._rangeSetting);
        this.addSetting(this._orientationSetting);
        this.addSetting(this._autoNorthUpSetting);
        this.addSetting(this._pointerSetting);

        model.mapView.setTargetOffsetHandler(this);
        model.mapView.setRangeInterpreter(this);

        this._isLatitudeCompensationActive = false;

        this._tempGeoPoint = new WT_GeoPoint(0, 0);
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
     * @readonly
     * @property {WT_MapSetting} orientationSetting
     * @type {WT_MapSetting}
     */
    get orientationSetting() {
        return this._orientationSetting;
    }

    /**
     * @readonly
     * @property {WT_MapAutoNorthUpSettingGroup} autoNorthUpSetting
     * @type {WT_MapAutoNorthUpSettingGroup}
     */
    get autoNorthUpSetting() {
        return this._autoNorthUpSetting;
    }

    /**
     *
     * @param {WT_MapModel} model
     * @param {WT_GVector2} offset
     */
    getTargetOffset(model, offset) {
        if (model.orientation.mode === WT_G3x5_NavMap.Orientation.NORTH) {
            offset.set(0, 0);
        } else {
            offset.set(0, 1/6);
        }
    }

    /**
     *
     * @param {WT_MapModel} model
     * @param {WT_NumberUnit} range
     */
    getTrueRange(model, range) {
        let factor = 1;
        if (model.orientation.mode === WT_G3x5_NavMap.Orientation.NORTH) {
            factor = 4;
        } else {
            factor = 3;
        }
        range.set(model.range).scale(factor, true);
    }

    _updateRange() {
        this.mapModel.range = this._rangeSetting.getRange();
    }

    /**
     *
     * @param {WT_GeoPoint} target
     */
    _handleLatitudeCompensation(target) {
        let longDimensionFactor = Math.max(1, this.mapView.viewWidth / this.mapView.viewHeight);
        let latDelta = this.mapModel.range.asUnit(WT_Unit.GA_RADIAN) * Avionics.Utils.RAD2DEG * longDimensionFactor * 2;
        let edgeLat = target.lat + (target.lat >= 0 ? 1 : -1) * latDelta;
        if (Math.abs(edgeLat) > WT_G3x5_MapRangeTargetRotationController.MAX_LATITUDE) {
            let compensatedLat = Math.max(0, WT_G3x5_MapRangeTargetRotationController.MAX_LATITUDE - latDelta) * (target.lat >= 0 ? 1 : -1);
            target.set(compensatedLat, target.long);
            this._isLatitudeCompensationActive = true;
            this.mapModel.crosshair.show = true;
        } else {
            this._isLatitudeCompensationActive = false;
        }
    }

    _updateTarget() {
        let target = this._tempGeoPoint;
        if (this._pointerSetting.isPointerActive()) {
            target.set(this._pointerSetting.getTargetLatLong());
            this.mapModel.crosshair.show = true;
        } else {
            this.mapModel.airplane.navigation.position(target);
            this.mapModel.crosshair.show = false;
        }

        this._handleLatitudeCompensation(target);

        if (target) {
            this.mapModel.target = target;
        }
    }

    _forceNorthUp() {
        // handle latitude compensation
        if (this._isLatitudeCompensationActive) {
            return true;
        }

        // handle cursor
        if (this._pointerSetting.isPointerActive()) {
            return true;
        }

        // handle Auto North Up
        if (this._autoNorthUpSetting && this._autoNorthUpSetting.isActive()) {
            if (this.mapModel.range.compare(this._autoNorthUpSetting.getRange()) >= 0) {
                return true;
            }
        }

        return false;
    }

    _updateRotation() {
        let orientation;
        if (this._forceNorthUp()) {
            orientation = WT_G3x5_NavMap.Orientation.NORTH;
        } else {
            orientation = this._orientationSetting.getValue();
        }

        let rotation;
        switch (orientation) {
            case WT_G3x5_NavMap.Orientation.TRK:
                if (!SimVar.GetSimVarValue("SIM ON GROUND", "bool")) {
                    rotation = -this.mapModel.airplane.navigation.trackTrue();
                    this.mapModel.rangeCompass.show = true;
                    this.mapModel.rangeRing.show = false;
                    break;
                }
            case WT_G3x5_NavMap.Orientation.HDG:
                rotation = -this.mapModel.airplane.navigation.headingTrue();
                this.mapModel.rangeCompass.show = true;
                this.mapModel.rangeRing.show = false;
                break;
            case WT_G3x5_NavMap.Orientation.NORTH:
                rotation = 0;
                this.mapModel.rangeRing.show = true;
                this.mapModel.rangeCompass.show = false;
                break;
        }
        this.mapModel.rotation = rotation;
        this.mapModel.orientation.mode = orientation;
    }

    update() {
        this._pointerSetting.update();
        this._updateRange();
        this._updateTarget();
        this._updateRotation();
    }
}
WT_G3x5_MapRangeTargetRotationController.MAX_LATITUDE = 85;