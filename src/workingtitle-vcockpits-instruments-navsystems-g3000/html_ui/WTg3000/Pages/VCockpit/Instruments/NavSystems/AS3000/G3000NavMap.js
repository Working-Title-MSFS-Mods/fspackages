class WT_G3000NavMap extends NavSystemElement {
    constructor(instrumentID, icaoWaypointFactory, icaoSearchers, flightPlanManager, layerOptions = WT_G3000NavMap.LAYER_OPTIONS_DEFAULT) {
        super(instrumentID);

        this._instrumentID = instrumentID;

        this._map = new WT_Map(instrumentID);
        this._layerOptions = layerOptions;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._icaoSearchers = icaoSearchers;
        this._fpm = flightPlanManager;
    }

    /**
     * @readonly
     * @property {String} map
     * @type {String}
     */
    get instrumentID() {
        return this._instrumentID;
    }

    /**
     * @readonly
     * @property {WT_Map} map
     * @type {WT_Map}
     */
    get map() {
        return this._map;
    }

    /**
     * @readonly
     * @property {WT_MapRangeSetting} rangeSetting
     * @type {WT_MapRangeSetting}
     */
    get rangeSetting() {
        return this._rangeTargetRotationController.rangeSetting;
    }

    /**
     * @readonly
     * @property {WT_MapTerrainModeSetting} terrainSetting
     * @type {WT_MapTerrainModeSetting}
     */
    get terrainSetting() {
        return this._terrainSetting;
    }

    /**
     * @readonly
     * @property {WT_MapDCLTRSetting} dcltrSetting
     * @type {WT_MapDCLTRSetting}
     */
    get dcltrSetting() {
        return this._dcltrSetting;
    }

    /**
     * @readonly
     * @property {WT_MapSymbolShowSetting} dcltrSetting
     * @type {WT_MapSymbolShowSetting}
     */
    get nexradShowSetting() {
        return this._nexradShowSetting;
    }

    init(root) {
        this.map.init(root.querySelector(`map-view`));

        this.map.model.addModule(new WT_MapModelUnitsModule());
        this.map.model.addModule(new WT_MapModelCrosshairModule());
        this.map.model.addModule(new WT_MapModelTerrainModule());
        this.map.model.addModule(new WT_MapModelWeatherDisplayModule());
        this.map.model.addModule(new WT_MapModelOrientationModule());
        if (this._layerOptions.windData) {
            this.map.model.addModule(new WT_MapModelWindDataModule());
        }
        this.map.model.addModule(new WT_MapModelPointerModule());
        this.map.model.addModule(new WT_MapModelRangeRingModule());
        this.map.model.addModule(new WT_MapModelRangeCompassModule());
        this.map.model.addModule(new WT_MapModelTrackVectorModule());
        this.map.model.addModule(new WT_MapModelFuelRingModule());
        this.map.model.addModule(new WT_MapModelAltitudeInterceptModule());
        this.map.model.addModule(new WT_MapModelBordersModule());
        this.map.model.addModule(new WT_MapModelWaypointsModule());
        this.map.model.addModule(new WT_MapModelCitiesModule());

        let labelManager = new WT_MapViewTextLabelManager({preventOverlap: true});

        this.map.view.addLayer(new WT_MapViewBingLayer(`${this.instrumentID}-navmap`));
        this.map.view.addLayer(new WT_MapViewBorderLayer(labelManager));
        this.map.view.addLayer(new WT_MapViewCityLayer(labelManager));
        this.map.view.addLayer(new WT_MapViewWaypointLayer(this._icaoSearchers, this._icaoWaypointFactory, labelManager));
        this.map.view.addLayer(new WT_MapViewFlightPlanLayer(this._fpm, this._icaoWaypointFactory, labelManager, new WT_G3000MapViewFlightPlanLegStyleChooser()));
        this.map.view.addLayer(new WT_MapViewTextLabelLayer(labelManager));
        this.map.view.addLayer(new WT_MapViewFuelRingLayer());
        this.map.view.addLayer(new WT_MapViewAltitudeInterceptLayer());
        this.map.view.addLayer(new WT_MapViewTrackVectorLayer());
        this.map.view.addLayer(new WT_MapViewRangeRingLayer());
        this.map.view.addLayer(new WT_MapViewRangeCompassArcLayer({
            getForwardTickBearing: function(state) {
                return state.model.orientation.mode === WT_G3000NavMap.Orientation.TRK ? state.model.airplane.model.trackTrue() : state.model.airplane.model.headingTrue();
            }
        }));
        this.map.view.addLayer(new WT_MapViewCrosshairLayer());
        this.map.view.addLayer(new WT_MapViewAirplaneLayer());
        this.map.view.addLayer(new WT_MapViewPointerLayer());
        if (this._layerOptions.windData) {
            this.map.view.addLayer(new WT_MapViewWindDataLayer());
        }
        this.map.view.addLayer(new WT_MapViewOrientationDisplayLayer(WT_G3000NavMap.ORIENTATION_DISPLAY_TEXTS));
        if (this._layerOptions.rangeDisplay) {
            this.map.view.addLayer(new WT_MapViewRangeDisplayLayer());
        }
        this.map.view.addLayer(new WT_MapViewPointerInfoLayer());
        if (this._layerOptions.miniCompass) {
            this.map.view.addLayer(new WT_MapViewMiniCompassLayer());
        }

        this.map.controller.addSetting(this._rangeTargetRotationController = new WT_G3000MapRangeTargetRotationController(this.map.controller));
        this.map.controller.addSetting(this._terrainSetting = new WT_MapTerrainModeSetting(this.map.controller));
        this.map.controller.addSetting(new WT_MapTrackVectorSettingGroup(this.map.controller));
        this.map.controller.addSetting(new WT_MapFuelRingSettingGroup(this.map.controller));
        this.map.controller.addSetting(new WT_MapAltitudeInterceptSetting(this.map.controller));

        if (this._layerOptions.windData) {
            this.map.controller.addSetting(new WT_MapWindDataShowSetting(this.map.controller));
        }

        this._dcltrSetting = new WT_MapDCLTRSetting(this.map.controller, [
            // OFF
            {},

            // DCLTR1
            {
                stateBorder: true,
                city: true
            },

            // DCLTR2
            {
                stateBorder: true,
                city: true,
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
                userWaypoint: true,
                vor: true,
                ndb: true,
                int: true,
                airport: true
            }
        ]);
        this.map.controller.addSetting(this._dcltrSetting);

        this.map.controller.addSetting(this._nexradShowSetting = new WT_MapSymbolShowSetting(this.map.controller, "nexrad", "weatherDisplay", "nexradShow", WT_G3000NavMap.NEXRAD_SHOW_KEY, this._dcltrSetting, false));
        this.map.controller.addSetting(new WT_MapSymbolRangeSetting(this.map.controller, WT_G3000NavMap.NEXRAD_RANGE_KEY, "weatherDisplay", "nexradRange", WT_G3000NavMap.MAP_RANGE_LEVELS, WT_G3000NavMap.NEXRAD_RANGE_DEFAULT));

        this.map.controller.addSetting(new WT_MapSymbolShowSetting(this.map.controller, "airway", "waypoints", "airwayShow", WT_G3000NavMap.AIRWAY_SHOW_KEY, this._dcltrSetting));
        this.map.controller.addSetting(new WT_MapSymbolRangeSetting(this.map.controller, WT_G3000NavMap.AIRWAY_RANGE_KEY, "waypoints", "airwayRange", WT_G3000NavMap.MAP_RANGE_LEVELS, WT_G3000NavMap.AIRWAY_RANGE_DEFAULT));

        this.map.controller.addSetting(new WT_MapSymbolShowSetting(this.map.controller, "airport", "waypoints", "airportShow", WT_G3000NavMap.AIRPORT_SHOW_KEY, this._dcltrSetting));
        this.map.controller.addSetting(new WT_MapSymbolRangeSetting(this.map.controller, WT_G3000NavMap.AIRPORT_LARGE_RANGE_KEY, "waypoints", "airportLargeRange", WT_G3000NavMap.MAP_RANGE_LEVELS, WT_G3000NavMap.AIRPORT_LARGE_RANGE_DEFAULT));
        this.map.controller.addSetting(new WT_MapSymbolRangeSetting(this.map.controller, WT_G3000NavMap.AIRPORT_MEDIUM_RANGE_KEY, "waypoints", "airportMediumRange", WT_G3000NavMap.MAP_RANGE_LEVELS, WT_G3000NavMap.AIRPORT_MEDIUM_RANGE_DEFAULT));
        this.map.controller.addSetting(new WT_MapSymbolRangeSetting(this.map.controller, WT_G3000NavMap.AIRPORT_SMALL_RANGE_KEY, "waypoints", "airportSmallRange", WT_G3000NavMap.MAP_RANGE_LEVELS, WT_G3000NavMap.AIRPORT_SMALL_RANGE_DEFAULT));

        this.map.controller.addSetting(new WT_MapSymbolShowSetting(this.map.controller, "vor", "waypoints", "vorShow", WT_G3000NavMap.VOR_SHOW_KEY, this._dcltrSetting));
        this.map.controller.addSetting(new WT_MapSymbolRangeSetting(this.map.controller, WT_G3000NavMap.VOR_RANGE_KEY, "waypoints", "vorRange", WT_G3000NavMap.MAP_RANGE_LEVELS, WT_G3000NavMap.VOR_RANGE_DEFAULT));

        this.map.controller.addSetting(new WT_MapSymbolShowSetting(this.map.controller, "ndb", "waypoints", "ndbShow", WT_G3000NavMap.NDB_SHOW_KEY, this._dcltrSetting));
        this.map.controller.addSetting(new WT_MapSymbolRangeSetting(this.map.controller, WT_G3000NavMap.NDB_RANGE_KEY, "waypoints", "ndbRange", WT_G3000NavMap.MAP_RANGE_LEVELS, WT_G3000NavMap.NDB_RANGE_DEFAULT));

        this.map.controller.addSetting(new WT_MapSymbolShowSetting(this.map.controller, "int", "waypoints", "intShow", WT_G3000NavMap.INT_SHOW_KEY, this._dcltrSetting));
        this.map.controller.addSetting(new WT_MapSymbolRangeSetting(this.map.controller, WT_G3000NavMap.INT_RANGE_KEY, "waypoints", "intRange", WT_G3000NavMap.MAP_RANGE_LEVELS, WT_G3000NavMap.INT_RANGE_DEFAULT));

        this.map.controller.addSetting(new WT_MapSymbolShowSetting(this.map.controller, "stateBorder", "borders", "stateBorderShow", WT_G3000NavMap.BORDERS_SHOW_KEY, this._dcltrSetting));
        this.map.controller.addSetting(new WT_MapSymbolRangeSetting(this.map.controller, WT_G3000NavMap.BORDERS_RANGE_KEY, "borders", "stateBorderRange", WT_G3000NavMap.MAP_RANGE_LEVELS, WT_G3000NavMap.BORDERS_RANGE_DEFAULT));

        this.map.controller.addSetting(new WT_MapSymbolShowSetting(this.map.controller, "city", "cities", "show", WT_G3000NavMap.CITY_SHOW_KEY, this._dcltrSetting));
        this.map.controller.addSetting(new WT_MapSymbolRangeSetting(this.map.controller, WT_G3000NavMap.CITY_LARGE_RANGE_KEY, "cities", "largeRange", WT_G3000NavMap.MAP_RANGE_LEVELS, WT_G3000NavMap.CITY_LARGE_RANGE_DEFAULT));
        this.map.controller.addSetting(new WT_MapSymbolRangeSetting(this.map.controller, WT_G3000NavMap.CITY_MEDIUM_RANGE_KEY, "cities", "mediumRange", WT_G3000NavMap.MAP_RANGE_LEVELS, WT_G3000NavMap.CITY_MEDIUM_RANGE_DEFAULT));
        this.map.controller.addSetting(new WT_MapSymbolRangeSetting(this.map.controller, WT_G3000NavMap.CITY_SMALL_RANGE_KEY, "cities", "smallRange", WT_G3000NavMap.MAP_RANGE_LEVELS, WT_G3000NavMap.CITY_SMALL_RANGE_DEFAULT));

        this.map.controller.init();
        this.map.controller.update();
    }

    onEvent(event) {
    }

    onUpdate(deltaTime) {
        this._rangeTargetRotationController.update();
        this.map.update();
    }
}
WT_G3000NavMap.LAYER_OPTIONS_DEFAULT = {
    miniCompass: true,
    rangeDisplay: false,
    windData: true
};

WT_G3000NavMap.MAP_RANGE_LEVELS =
    [250, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.FOOT)).concat(
        [0.25, 0.5, 0.75, 1, 1.5, 2.5, 4, 5, 7.5, 10, 15, 25, 40, 50, 75, 100, 150, 250, 400, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.NMILE))
    );
WT_G3000NavMap.MAP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

WT_G3000NavMap.ORIENTATION_KEY = "WT_Map_Orientation";
/**
 * @enum {Number}
 */
WT_G3000NavMap.Orientation = {
    HDG: 0,
    TRK: 1,
    NORTH: 2
};
WT_G3000NavMap.ORIENTATION_DISPLAY_TEXTS = [
    "HDG UP",
    "TRK UP",
    "NORTH UP"
];

WT_G3000NavMap.DCLTR_DISPLAY_TEXTS = [
    "Off",
    "DCLTR1",
    "DCLTR2",
    "Least"
];

WT_G3000NavMap.NORTHUP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(1000);

WT_G3000NavMap.TERRAIN_MODE_DISPLAY_TEXT = [
    "Off",
    "Absolute",
    "Relative"
];

WT_G3000NavMap.NEXRAD_SHOW_KEY = "WT_Map_NEXRAD_Show";
WT_G3000NavMap.NEXRAD_RANGE_KEY = "WT_Map_NEXRAD_Range";
WT_G3000NavMap.NEXRAD_RANGE_MAX = WT_Unit.NMILE.createNumber(1000);
WT_G3000NavMap.NEXRAD_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(1000);

WT_G3000NavMap.AIRWAY_SHOW_KEY = "WT_Map_Airway_Show";
WT_G3000NavMap.AIRWAY_RANGE_KEY = "WT_Map_Airway_Range";
WT_G3000NavMap.AIRWAY_RANGE_MAX = WT_Unit.NMILE.createNumber(100);
WT_G3000NavMap.AIRWAY_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(50);

WT_G3000NavMap.AIRPORT_SHOW_KEY = "WT_Map_Airport_Show";

WT_G3000NavMap.AIRPORT_LARGE_RANGE_KEY = "WT_Map_AirportLarge_Range";
WT_G3000NavMap.AIRPORT_LARGE_RANGE_MAX = WT_Unit.NMILE.createNumber(1000);
WT_G3000NavMap.AIRPORT_LARGE_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(100);

WT_G3000NavMap.AIRPORT_MEDIUM_RANGE_KEY = "WT_Map_AirportMedium_Range";
WT_G3000NavMap.AIRPORT_MEDIUM_RANGE_MAX = WT_Unit.NMILE.createNumber(400);
WT_G3000NavMap.AIRPORT_MEDIUM_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(50);

WT_G3000NavMap.AIRPORT_SMALL_RANGE_KEY = "WT_Map_AirportSmall_Range";
WT_G3000NavMap.AIRPORT_SMALL_RANGE_MAX = WT_Unit.NMILE.createNumber(150);
WT_G3000NavMap.AIRPORT_SMALL_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(15);

WT_G3000NavMap.VOR_SHOW_KEY = "WT_Map_VOR_Show";
WT_G3000NavMap.VOR_RANGE_KEY = "WT_Map_VOR_Range";
WT_G3000NavMap.VOR_RANGE_MAX = WT_Unit.NMILE.createNumber(250);
WT_G3000NavMap.VOR_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(50);

WT_G3000NavMap.NDB_SHOW_KEY = "WT_Map_NDB_Show";
WT_G3000NavMap.NDB_RANGE_KEY = "WT_Map_NDB_Range";
WT_G3000NavMap.NDB_RANGE_MAX = WT_Unit.NMILE.createNumber(50);
WT_G3000NavMap.NDB_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

WT_G3000NavMap.INT_SHOW_KEY = "WT_Map_INT_Show";
WT_G3000NavMap.INT_RANGE_KEY = "WT_Map_INT_Range";
WT_G3000NavMap.INT_RANGE_MAX = WT_Unit.NMILE.createNumber(40);
WT_G3000NavMap.INT_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(7.5);

WT_G3000NavMap.BORDERS_SHOW_KEY = "WT_Map_StateBorders_Show";
WT_G3000NavMap.BORDERS_RANGE_KEY = "WT_Map_StateBorders_Range";
WT_G3000NavMap.BORDERS_RANGE_MAX = WT_Unit.NMILE.createNumber(1000);
WT_G3000NavMap.BORDERS_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(400);

WT_G3000NavMap.CITY_SHOW_KEY = "WT_Map_City_Show";

WT_G3000NavMap.CITY_LARGE_RANGE_KEY = "WT_Map_CityLarge_Range";
WT_G3000NavMap.CITY_LARGE_RANGE_MAX = WT_Unit.NMILE.createNumber(1000);
WT_G3000NavMap.CITY_LARGE_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(100);

WT_G3000NavMap.CITY_MEDIUM_RANGE_KEY = "WT_Map_CityMedium_Range";
WT_G3000NavMap.CITY_MEDIUM_RANGE_MAX = WT_Unit.NMILE.createNumber(400);
WT_G3000NavMap.CITY_MEDIUM_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(50);

WT_G3000NavMap.CITY_SMALL_RANGE_KEY = "WT_Map_CitySmall_Range";
WT_G3000NavMap.CITY_SMALL_RANGE_MAX = WT_Unit.NMILE.createNumber(100);
WT_G3000NavMap.CITY_SMALL_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

class WT_G3000MapRangeTargetRotationController extends WT_MapSettingGroup {
    constructor(controller) {
        super(controller, [], true, false);

        this._rangeSetting = new WT_MapRangeSetting(controller, WT_G3000NavMap.MAP_RANGE_LEVELS, WT_G3000NavMap.MAP_RANGE_DEFAULT, true, false);
        this._orientationSetting = new WT_MapSetting(controller, WT_G3000NavMap.ORIENTATION_KEY, WT_G3000NavMap.Orientation.HDG, true, false, true);
        this._autoNorthUpSetting = new WT_MapAutoNorthUpSettingGroup(controller, WT_G3000NavMap.MAP_RANGE_LEVELS, WT_G3000NavMap.NORTHUP_RANGE_DEFAULT);
        this._pointerSetting = new WT_MapPointerSettingGroup(controller);

        this.addSetting(this._rangeSetting);
        this.addSetting(this._orientationSetting);
        this.addSetting(this._autoNorthUpSetting);
        this.addSetting(this._pointerSetting);

        controller.view.setTargetOffsetHandler(this);
        controller.view.setRangeInterpreter(this);

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
        if (model.orientation.mode === WT_G3000NavMap.Orientation.NORTH) {
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
        if (model.orientation.mode === WT_G3000NavMap.Orientation.NORTH) {
            factor = 4;
        } else {
            factor = 3;
        }
        range.set(model.range).scale(factor, true);
    }

    _getTargetTrackPlane() {
        return this.model.airplane.model.position(this._tempGeoPoint);
    }

    updateRange() {
        this.model.range = this._rangeSetting.getRange();
    }

    updateTarget() {
        let target;
        if (this._pointerSetting.isPointerActive()) {
            target = this._pointerSetting.getTargetLatLong();
            this.model.crosshair.show = true;
        } else {
            target = this._getTargetTrackPlane();
            this.model.crosshair.show = false;
        }

        if (target) {
            this.model.target = target;
        }
    }

    updateRotation() {
        let orientation = this._orientationSetting.getValue();

        // handle Auto North Up
        if (this._autoNorthUpSetting && this._autoNorthUpSetting.isActive()) {
            if (this.model.range.compare(this._autoNorthUpSetting.getRange()) >= 0) {
                orientation = WT_G3000NavMap.Orientation.NORTH;
            }
        }

        // handle cursor
        if (this._pointerSetting.isPointerActive()) {
            orientation = WT_G3000NavMap.Orientation.NORTH;
        }

        let rotation;
        switch (orientation) {
            case WT_G3000NavMap.Orientation.TRK:
                if (!SimVar.GetSimVarValue("SIM ON GROUND", "bool")) {
                    rotation = -this.model.airplane.model.trackTrue();
                    this.model.rangeCompass.show = true;
                    this.model.rangeRing.show = false;
                    break;
                }
            case WT_G3000NavMap.Orientation.HDG:
                rotation = -this.model.airplane.model.headingTrue();
                this.model.rangeCompass.show = true;
                this.model.rangeRing.show = false;
                break;
            case WT_G3000NavMap.Orientation.NORTH:
                rotation = 0;
                this.model.rangeRing.show = true;
                this.model.rangeCompass.show = false;
                break;
        }
        this.model.rotation = rotation;
        this.model.orientation.mode = orientation;
    }

    update() {
        this._pointerSetting.update();
        this.updateRange();
        this.updateTarget();
        this.updateRotation();
    }
}