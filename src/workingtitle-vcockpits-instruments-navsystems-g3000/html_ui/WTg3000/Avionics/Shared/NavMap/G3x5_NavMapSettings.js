class WT_G3x5_NavMapSettings {
    /**
     * @param {WT_MapSettingModel} settingModel
     * @param {Object} layerOptions
     */
    constructor(settingModel, layerOptions, autoUpdate) {
        this._settingModel = settingModel;
        this._layerOptions = layerOptions;
        this._autoUpdate = autoUpdate;

        this._initSettings();
    }

    _initSettings() {
        this.settingModel.addSetting(this._syncModeSetting = new WT_MapSetting(this.settingModel, WT_MapSettingModel.SYNC_MODE_KEY, WT_MapSettingModel.SyncMode.OFF, false, false, true));

        this.settingModel.addSetting(this._rangeSetting = new WT_MapRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.MAP_RANGE_DEFAULT, true, false));
        this.settingModel.addSetting(this._orientationSetting = new WT_MapSetting(this.settingModel, WT_G3x5_NavMapSettings.ORIENTATION_KEY, WT_G3x5_NavMap.Orientation.HDG, true, false, true));
        this.settingModel.addSetting(this._autoNorthUpSettingGroup = new WT_MapAutoNorthUpSettingGroup(this.settingModel, WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.NORTHUP_RANGE_DEFAULT));

        this.settingModel.addSetting(this._terrainModeSetting = new WT_MapTerrainModeSetting(this.settingModel, this._autoUpdate));
        if (this._layerOptions.pointer) {
            this.settingModel.addSetting(this._pointerShowSetting = new WT_G3x5_MapPointerShowSetting(this.settingModel, this._autoUpdate));
        }
        this.settingModel.addSetting(this._trackVectorSettingGroup = new WT_MapTrackVectorSettingGroup(this.settingModel, this._autoUpdate));
        this.settingModel.addSetting(this._fuelRingSettingGroup = new WT_MapFuelRingSettingGroup(this.settingModel, this._autoUpdate));
        this.settingModel.addSetting(this._altitudeInterceptShowSetting = new WT_MapAltitudeInterceptSetting(this.settingModel, this._autoUpdate));

        if (this._layerOptions.windData) {
            this.settingModel.addSetting(this._windDataShowSetting = new WT_G3x5_MapWindDataShowSetting(this.settingModel, this._autoUpdate));
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

        this.settingModel.addSetting(this._nexradShowSetting = new WT_MapSymbolShowSetting(this.settingModel, "nexrad", "weatherDisplay", "nexradShow", WT_G3x5_NavMapSettings.NEXRAD_SHOW_KEY, this._dcltrSetting, this._autoUpdate, false));
        this.settingModel.addSetting(this._nexradRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.NEXRAD_RANGE_KEY, "weatherDisplay", "nexradRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.NEXRAD_RANGE_DEFAULT, this._autoUpdate));

        this.settingModel.addSetting(this._airwayShowSetting = new WT_MapSymbolShowSetting(this.settingModel, "airway", "waypoints", "airwayShow", WT_G3x5_NavMapSettings.AIRWAY_SHOW_KEY, this._dcltrSetting, this._autoUpdate));
        this.settingModel.addSetting(this._airwayRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.AIRWAY_RANGE_KEY, "waypoints", "airwayRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.AIRWAY_RANGE_DEFAULT, this._autoUpdate));

        this.settingModel.addSetting(this._airportShowSetting = new WT_MapSymbolShowSetting(this.settingModel, "airport", "waypoints", "airportShow", WT_G3x5_NavMapSettings.AIRPORT_SHOW_KEY, this._dcltrSetting, this._autoUpdate));
        this.settingModel.addSetting(this._airportLargeRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.AIRPORT_LARGE_RANGE_KEY, "waypoints", "airportLargeRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.AIRPORT_LARGE_RANGE_DEFAULT, this._autoUpdate));
        this.settingModel.addSetting(this._airportMediumRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.AIRPORT_MEDIUM_RANGE_KEY, "waypoints", "airportMediumRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.AIRPORT_MEDIUM_RANGE_DEFAULT, this._autoUpdate));
        this.settingModel.addSetting(this._airportSmallRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.AIRPORT_SMALL_RANGE_KEY, "waypoints", "airportSmallRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.AIRPORT_SMALL_RANGE_DEFAULT, this._autoUpdate));

        this.settingModel.addSetting(this._vorShowSetting = new WT_MapSymbolShowSetting(this.settingModel, "vor", "waypoints", "vorShow", WT_G3x5_NavMapSettings.VOR_SHOW_KEY, this._dcltrSetting, this._autoUpdate));
        this.settingModel.addSetting(this._vorRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.VOR_RANGE_KEY, "waypoints", "vorRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.VOR_RANGE_DEFAULT, this._autoUpdate));

        this.settingModel.addSetting(this._ndbShowSetting = new WT_MapSymbolShowSetting(this.settingModel, "ndb", "waypoints", "ndbShow", WT_G3x5_NavMapSettings.NDB_SHOW_KEY, this._dcltrSetting, this._autoUpdate));
        this.settingModel.addSetting(this._ndbRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.NDB_RANGE_KEY, "waypoints", "ndbRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.NDB_RANGE_DEFAULT, this._autoUpdate));

        this.settingModel.addSetting(this._intShowSetting = new WT_MapSymbolShowSetting(this.settingModel, "int", "waypoints", "intShow", WT_G3x5_NavMapSettings.INT_SHOW_KEY, this._dcltrSetting, this._autoUpdate));
        this.settingModel.addSetting(this._intRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.INT_RANGE_KEY, "waypoints", "intRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.INT_RANGE_DEFAULT, this._autoUpdate));

        this.settingModel.addSetting(this._stateBorderShowSetting = new WT_MapSymbolShowSetting(this.settingModel, "stateBorder", "borders", "stateBorderShow", WT_G3x5_NavMapSettings.BORDERS_SHOW_KEY, this._dcltrSetting, this._autoUpdate));
        this.settingModel.addSetting(this._stateBorderRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.BORDERS_RANGE_KEY, "borders", "stateBorderRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.BORDERS_RANGE_DEFAULT, this._autoUpdate));

        this.settingModel.addSetting(this._cityShowSetting = new WT_MapSymbolShowSetting(this.settingModel, "city", "cities", "show", WT_G3x5_NavMapSettings.CITY_SHOW_KEY, this._dcltrSetting, this._autoUpdate));
        this.settingModel.addSetting(this._cityLargeRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.CITY_LARGE_RANGE_KEY, "cities", "largeRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.CITY_LARGE_RANGE_DEFAULT, this._autoUpdate));
        this.settingModel.addSetting(this._cityMediumRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.CITY_MEDIUM_RANGE_KEY, "cities", "mediumRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.CITY_MEDIUM_RANGE_DEFAULT, this._autoUpdate));
        this.settingModel.addSetting(this._citySmallRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.CITY_SMALL_RANGE_KEY, "cities", "smallRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.CITY_SMALL_RANGE_DEFAULT, this._autoUpdate));

        if (this._layerOptions.roads) {
            this.settingModel.addSetting(this._roadShowSetting = new WT_MapSymbolShowSetting(this.settingModel, "road", "roads", "show", WT_G3x5_NavMapSettings.ROAD_SHOW_KEY, this._dcltrSetting, this._autoUpdate));
            this.settingModel.addSetting(this._roadHighwayRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.ROAD_HIGHWAY_RANGE_KEY, "roads", "highwayRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.ROAD_HIGHWAY_RANGE_DEFAULT, this._autoUpdate));
            this.settingModel.addSetting(this._roadPrimaryRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.ROAD_PRIMARY_RANGE_KEY, "roads", "primaryRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.ROAD_PRIMARY_RANGE_DEFAULT, this._autoUpdate));
        }

        this.settingModel.addSetting(this._trafficShowSetting = new WT_G3x5_NavMapTrafficShowSetting(this.settingModel, this._autoUpdate));

        this.settingModel.addSetting(this._trafficSymbolRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.TRAFFIC_SYMBOL_RANGE_KEY, "traffic", "symbolRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.TRAFFIC_SYMBOL_RANGE_DEFAULT, this._autoUpdate));

        this.settingModel.addSetting(this._trafficLabelShowSetting = new WT_MapSymbolShowSetting(this.settingModel, "trafficLabel", "traffic", "labelShow", WT_G3x5_NavMapSettings.TRAFFIC_LABEL_SHOW_KEY, this._dcltrSetting, this._autoUpdate));
        this.settingModel.addSetting(this._trafficLabelRangeSetting = new WT_MapSymbolRangeSetting(this.settingModel, WT_G3x5_NavMapSettings.TRAFFIC_LABEL_RANGE_KEY, "traffic", "labelRange", WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS, WT_G3x5_NavMapSettings.TRAFFIC_LABEL_RANGE_DEFAULT, this._autoUpdate));
    }

    /**
     * @readonly
     * @type {WT_MapSettingModel}
     */
    get settingModel() {
        return this._settingModel;
    }

    /**
     * @readonly
     * @type {WT_MapSetting}
     */
    get syncModeSetting() {
        return this._syncModeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapRangeSetting}
     */
    get rangeSetting() {
        return this._rangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSetting}
     */
    get orientationSetting() {
        return this._orientationSetting;
    }

    /**
     * @readonly
     * @type {WT_MapAutoNorthUpSettingGroup}
     */
    get autoNorthUpSettingGroup() {
        return this._autoNorthUpSettingGroup;
    }

    /**
     * @readonly
     * @type {WT_MapSetting}
     */
    get autoNorthUpActiveSetting() {
        return this._autoNorthUpSettingGroup.activeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSetting}
     */
    get autoNorthUpRangeSetting() {
        return this._autoNorthUpSettingGroup.rangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSetting}
     */
    get dcltrSetting() {
        return this._dcltrSetting;
    }

    /**
     * @readonly
     * @type {WT_MapTerrainModeSetting}
     */
    get terrainModeSetting() {
        return this._terrainModeSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_MapPointerShowSetting}
     */
    get pointerShowSetting() {
        return this._pointerShowSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolShowSetting}
     */
    get nexradShowSetting() {
        return this._nexradShowSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get nexradRangeSetting() {
        return this._nexradRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolShowSetting}
     */
    get airwayShowSetting() {
        return this._airwayShowSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get airwayRangeSetting() {
        return this._airwayRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolShowSetting}
     */
    get airportShowSetting() {
        return this._airportShowSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get airportLargeRangeSetting() {
        return this._airportLargeRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get airportMediumRangeSetting() {
        return this._airportMediumRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get airportSmallRangeSetting() {
        return this._airportSmallRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolShowSetting}
     */
    get vorShowSetting() {
        return this._vorShowSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get vorRangeSetting() {
        return this._vorRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolShowSetting}
     */
    get ndbShowSetting() {
        return this._ndbShowSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get ndbRangeSetting() {
        return this._ndbRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolShowSetting}
     */
    get intShowSetting() {
        return this._intShowSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get intRangeSetting() {
        return this._intRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolShowSetting}
     */
    get stateBorderShowSetting() {
        return this._stateBorderShowSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get stateBorderRangeSetting() {
        return this._stateBorderRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolShowSetting}
     */
    get cityShowSetting() {
        return this._cityShowSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get cityLargeRangeSetting() {
        return this._cityLargeRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get cityMediumRangeSetting() {
        return this._cityMediumRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get citySmallRangeSetting() {
        return this._citySmallRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolShowSetting}
     */
    get roadShowSetting() {
        return this._roadShowSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get roadHighwayRangeSetting() {
        return this._roadHighwayRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get roadPrimaryRangeSetting() {
        return this._roadPrimaryRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavMapTrafficShowSetting}
     */
    get trafficShowSetting() {
        return this._trafficShowSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get trafficSymbolRangeSetting() {
        return this._trafficSymbolRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolShowSetting}
     */
    get trafficLabelShowSetting() {
        return this._trafficLabelShowSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSymbolRangeSetting}
     */
    get trafficLabelRangeSetting() {
        return this._trafficLabelRangeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSetting}
     */
    get trackVectorShowSetting() {
        return this._trackVectorSettingGroup.showSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSetting}
     */
    get trackVectorLookaheadSetting() {
        return this._trackVectorSettingGroup.lookaheadSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSetting}
     */
    get fuelRingShowSetting() {
        return this._fuelRingSettingGroup.showSetting;
    }

    /**
     * @readonly
     * @type {WT_MapSetting}
     */
    get fuelRingReserveTimeSetting() {
        return this._fuelRingSettingGroup.reserveTimeSetting;
    }

    /**
     * @readonly
     * @type {WT_MapAltitudeInterceptSetting}
     */
    get altitudeInterceptShowSetting() {
        return this._altitudeInterceptShowSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_MapWindDataShowSetting}
     */
    get windDataShowSetting() {
        return this._windDataShowSetting;
    }
}
WT_G3x5_NavMapSettings.MAP_RANGE_LEVELS =
    [250, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.FOOT)).concat(
        [0.25, 0.5, 0.75, 1, 1.5, 2.5, 4, 5, 7.5, 10, 15, 25, 40, 50, 75, 100, 150, 250, 400, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.NMILE))
    );
WT_G3x5_NavMapSettings.MAP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

WT_G3x5_NavMapSettings.ORIENTATION_KEY = "WT_Map_Orientation";

WT_G3x5_NavMapSettings.NORTHUP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(1000);

WT_G3x5_NavMapSettings.NEXRAD_SHOW_KEY = "WT_Map_NEXRAD_Show";
WT_G3x5_NavMapSettings.NEXRAD_RANGE_KEY = "WT_Map_NEXRAD_Range";
WT_G3x5_NavMapSettings.NEXRAD_RANGE_MAX = WT_Unit.NMILE.createNumber(1000);
WT_G3x5_NavMapSettings.NEXRAD_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(1000);

WT_G3x5_NavMapSettings.AIRWAY_SHOW_KEY = "WT_Map_Airway_Show";
WT_G3x5_NavMapSettings.AIRWAY_RANGE_KEY = "WT_Map_Airway_Range";
WT_G3x5_NavMapSettings.AIRWAY_RANGE_MAX = WT_Unit.NMILE.createNumber(100);
WT_G3x5_NavMapSettings.AIRWAY_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(50);

WT_G3x5_NavMapSettings.AIRPORT_SHOW_KEY = "WT_Map_Airport_Show";

WT_G3x5_NavMapSettings.AIRPORT_LARGE_RANGE_KEY = "WT_Map_AirportLarge_Range";
WT_G3x5_NavMapSettings.AIRPORT_LARGE_RANGE_MAX = WT_Unit.NMILE.createNumber(1000);
WT_G3x5_NavMapSettings.AIRPORT_LARGE_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(100);

WT_G3x5_NavMapSettings.AIRPORT_MEDIUM_RANGE_KEY = "WT_Map_AirportMedium_Range";
WT_G3x5_NavMapSettings.AIRPORT_MEDIUM_RANGE_MAX = WT_Unit.NMILE.createNumber(400);
WT_G3x5_NavMapSettings.AIRPORT_MEDIUM_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(50);

WT_G3x5_NavMapSettings.AIRPORT_SMALL_RANGE_KEY = "WT_Map_AirportSmall_Range";
WT_G3x5_NavMapSettings.AIRPORT_SMALL_RANGE_MAX = WT_Unit.NMILE.createNumber(150);
WT_G3x5_NavMapSettings.AIRPORT_SMALL_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(15);

WT_G3x5_NavMapSettings.VOR_SHOW_KEY = "WT_Map_VOR_Show";
WT_G3x5_NavMapSettings.VOR_RANGE_KEY = "WT_Map_VOR_Range";
WT_G3x5_NavMapSettings.VOR_RANGE_MAX = WT_Unit.NMILE.createNumber(250);
WT_G3x5_NavMapSettings.VOR_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(50);

WT_G3x5_NavMapSettings.NDB_SHOW_KEY = "WT_Map_NDB_Show";
WT_G3x5_NavMapSettings.NDB_RANGE_KEY = "WT_Map_NDB_Range";
WT_G3x5_NavMapSettings.NDB_RANGE_MAX = WT_Unit.NMILE.createNumber(50);
WT_G3x5_NavMapSettings.NDB_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

WT_G3x5_NavMapSettings.INT_SHOW_KEY = "WT_Map_INT_Show";
WT_G3x5_NavMapSettings.INT_RANGE_KEY = "WT_Map_INT_Range";
WT_G3x5_NavMapSettings.INT_RANGE_MAX = WT_Unit.NMILE.createNumber(40);
WT_G3x5_NavMapSettings.INT_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(7.5);

WT_G3x5_NavMapSettings.BORDERS_SHOW_KEY = "WT_Map_StateBorders_Show";
WT_G3x5_NavMapSettings.BORDERS_RANGE_KEY = "WT_Map_StateBorders_Range";
WT_G3x5_NavMapSettings.BORDERS_RANGE_MAX = WT_Unit.NMILE.createNumber(1000);
WT_G3x5_NavMapSettings.BORDERS_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(400);

WT_G3x5_NavMapSettings.CITY_SHOW_KEY = "WT_Map_City_Show";

WT_G3x5_NavMapSettings.CITY_LARGE_RANGE_KEY = "WT_Map_CityLarge_Range";
WT_G3x5_NavMapSettings.CITY_LARGE_RANGE_MAX = WT_Unit.NMILE.createNumber(1000);
WT_G3x5_NavMapSettings.CITY_LARGE_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(100);

WT_G3x5_NavMapSettings.CITY_MEDIUM_RANGE_KEY = "WT_Map_CityMedium_Range";
WT_G3x5_NavMapSettings.CITY_MEDIUM_RANGE_MAX = WT_Unit.NMILE.createNumber(400);
WT_G3x5_NavMapSettings.CITY_MEDIUM_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(50);

WT_G3x5_NavMapSettings.CITY_SMALL_RANGE_KEY = "WT_Map_CitySmall_Range";
WT_G3x5_NavMapSettings.CITY_SMALL_RANGE_MAX = WT_Unit.NMILE.createNumber(100);
WT_G3x5_NavMapSettings.CITY_SMALL_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

WT_G3x5_NavMapSettings.ROAD_SHOW_KEY = "WT_Map_Road_Show";

WT_G3x5_NavMapSettings.ROAD_HIGHWAY_RANGE_KEY = "WT_Map_RoadHighway_Range";
WT_G3x5_NavMapSettings.ROAD_HIGHWAY_RANGE_MAX = WT_Unit.NMILE.createNumber(400);
WT_G3x5_NavMapSettings.ROAD_HIGHWAY_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(50);

WT_G3x5_NavMapSettings.ROAD_PRIMARY_RANGE_KEY = "WT_Map_RoadPrimary_Range";
WT_G3x5_NavMapSettings.ROAD_PRIMARY_RANGE_MAX = WT_Unit.NMILE.createNumber(150);
WT_G3x5_NavMapSettings.ROAD_PRIMARY_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(15);

WT_G3x5_NavMapSettings.TRAFFIC_SYMBOL_RANGE_KEY = "WT_Map_TrafficSymbol_Range";
WT_G3x5_NavMapSettings.TRAFFIC_SYMBOL_RANGE_MAX = WT_Unit.NMILE.createNumber(100);
WT_G3x5_NavMapSettings.TRAFFIC_SYMBOL_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

WT_G3x5_NavMapSettings.TRAFFIC_LABEL_SHOW_KEY = "WT_Map_TrafficLabel_Show";
WT_G3x5_NavMapSettings.TRAFFIC_LABEL_RANGE_KEY = "WT_Map_TrafficLabel_Range";
WT_G3x5_NavMapSettings.TRAFFIC_LABEL_RANGE_MAX = WT_Unit.NMILE.createNumber(100);
WT_G3x5_NavMapSettings.TRAFFIC_LABEL_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);