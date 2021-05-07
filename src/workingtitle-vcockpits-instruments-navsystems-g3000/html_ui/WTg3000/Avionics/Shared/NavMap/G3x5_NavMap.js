class WT_G3x5_NavMap {
    /**
     * @param {String} instrumentID
     * @param {WT_PlayerAirplane} airplane
     * @param {Number} altimeterIndex
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @param {{{airport:WT_ICAOSearcher, vor:WT_ICAOSearcher, ndb:WT_ICAOSearcher, int:WT_ICAOSearcher}}} icaoSearchers
     * @param {WT_FlightPlanManager} flightPlanManager
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     * @param {WT_CitySearchHandler} citySearcher
     * @param {WT_MapViewBorderData} borderData
     * @param {WT_MapViewRoadFeatureCollection} roadFeatureData
     * @param {WT_MapViewRoadLabelCollection} roadLabelData
     * @param {WT_G3x5_TrafficSystem} trafficSystem
     * @param {*} layerOptions
     */
    constructor(instrumentID, airplane, airspeedSensorIndex, altimeterIndex, icaoWaypointFactory, icaoSearchers, flightPlanManager, unitsSettingModel, citySearcher, borderData, roadFeatureData, roadLabelData, trafficSystem, layerOptions = WT_G3x5_NavMap.LAYER_OPTIONS_DEFAULT) {
        this._instrumentID = instrumentID;
        this._settingModelID = instrumentID;

        this._airplane = airplane;
        this._airspeedSensorIndex = airspeedSensorIndex;
        this._altimeterIndex = altimeterIndex;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._icaoSearchers = icaoSearchers;
        this._fpm = flightPlanManager;
        this._unitsSettingModel = unitsSettingModel;
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
     * The setting model associated with this map's traffic layer.
     * @readonly
     * @type {WT_MapSettingModel}
     */
    get trafficSettingModel() {
        return this._trafficSettingModel;
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

    /**
     * @readonly
     * @type {WT_G3x5_NavMapTrafficShowSetting}
     */
    get trafficShowSetting() {
        return this._trafficShowSetting;
    }

    _initUnitsModule() {
        this._unitsAdapter = new WT_G3x5_UnitsSettingModelMapModelAdapter(this._unitsSettingModel, this.model);
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
        this.model.addModule(new WT_MapModelAirplaneIconModule());
        this.model.addModule(new WT_MapModelTerrainModule());
        this.model.addModule(new WT_MapModelWeatherDisplayModule());
        this.model.addModule(new WT_MapModelOrientationModule());
        if (this._layerOptions.windData) {
            this.model.addModule(new WT_G3x5_MapModelWindDataModule());
        }
        this.model.addModule(new WT_G3x5_MapModelPointerModule());
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
        this.view.addLayer(new WT_MapViewRangeRingLayer());
        this.view.addLayer(new WT_MapViewRangeCompassArcLayer({
            getForwardTickBearing: function(state) {
                return (state.model.orientation.mode === WT_G3x5_NavMap.Orientation.TRK && !state.model.airplane.sensors.isOnGround()) ? state.model.airplane.navigation.trackTrue() : state.model.airplane.navigation.headingTrue();
            }
        }));
        this.view.addLayer(new WT_MapViewCrosshairLayer());
        this.view.addLayer(new WT_MapViewAirplaneLayer());
        this.view.addLayer(this._createTrafficIntruderLayer());
        this.view.addLayer(this._createTrafficStatusLayer());
        this.view.addLayer(new WT_G3x5_MapViewPointerLayer());
        if (this._layerOptions.windData) {
            this.view.addLayer(new WT_G3x5_MapViewWindDataLayer());
        }
        this.view.addLayer(new WT_MapViewOrientationDisplayLayer(WT_G3x5_NavMap.ORIENTATION_DISPLAY_TEXTS));
        if (this._layerOptions.rangeDisplay) {
            this.view.addLayer(new WT_MapViewRangeDisplayLayer());
        }
        this.view.addLayer(new WT_G3x5_MapViewPointerInfoLayer());
        if (this._layerOptions.miniCompass) {
            this.view.addLayer(new WT_MapViewMiniCompassLayer());
        }
    }

    _initSettingModel() {
        this._settings = new WT_G3x5_NavMapSettings(this.settingModel, this._layerOptions, true);

        this.settingModel.init();
        this.settingModel.update();
    }

    _initTrafficSettingModel() {
        this.trafficSettingModel.addSetting(new WT_G3x5_TrafficMapAltitudeModeSetting(this.trafficSettingModel));
        this.trafficSettingModel.addSetting(new WT_G3x5_TrafficMapAltitudeRestrictionSetting(this.trafficSettingModel));
        this.trafficSettingModel.addSetting(new WT_G3x5_TrafficMapMotionVectorModeSetting(this.trafficSettingModel));
        this.trafficSettingModel.addSetting(new WT_G3x5_TrafficMapMotionVectorLookaheadSetting(this.trafficSettingModel));

        this.trafficSettingModel.update();
    }

    _initPointerController() {
        this._pointerController = new WT_G3x5_NavMapPointerController(this.model, this.view, new WT_G3x5_NavMapPointerEventHandler(this.instrumentID));
    }

    _initRangeTargetRotationController() {
        this._rangeTargetRotationController = new WT_G3x5_NavMapRangeTargetRotationController(this.model, this.view, this._settings.rangeSetting, this._settings.orientationSetting, this._settings.autoNorthUpSettingGroup);
    }

    init(viewElement) {
        this._model = new WT_MapModel(this._airplane);
        this._view = viewElement;
        this.view.setModel(this.model);
        this._settingModel = new WT_MapSettingModel(this._settingModelID, this.model, this.view);
        this._trafficSettingModel = new WT_MapSettingModel(WT_G3x5_TrafficMap.SETTING_MODEL_ID, this.model, this.view);

        this._initModel();
        this._initView();
        this._initSettingModel();
        this._initTrafficSettingModel();
        if (this._layerOptions.pointer) {
            this._initPointerController();
        }
        this._initRangeTargetRotationController();
    }

    sleep() {
        this._bingLayer.sleep();
    }

    wake() {
    }

    update() {
        if (this._layerOptions.pointer) {
            this._pointerController.update();
        }
        this._rangeTargetRotationController.update();
        this.view.update();
        this._waypointRenderer.update(this.view.state);
    }
}
WT_G3x5_NavMap.LAYER_OPTIONS_DEFAULT = {
    pointer: true,
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

WT_G3x5_NavMap.TERRAIN_MODE_DISPLAY_TEXT = [
    "Off",
    "Absolute",
    "Relative"
];

class WT_G3x5_NavMapRangeTargetRotationController {
    /**
     * @param {WT_MapModel} mapModel
     * @param {WT_MapView} mapView
     * @param {WT_MapRangeSetting} rangeSetting
     * @param {WT_MapSetting} orientationSetting
     * @param {WT_MapAutoNorthUpSettingGroup} autoNorthUpSettingGroup
     */
    constructor(mapModel, mapView, rangeSetting, orientationSetting, autoNorthUpSettingGroup) {
        this._mapModel = mapModel;
        this._mapView = mapView;
        this._rangeSetting = rangeSetting;
        this._orientationSetting = orientationSetting;
        this._autoNorthUpSettingGroup = autoNorthUpSettingGroup;

        this._orientationSettingValue;
        this._autoNorthUpActive = false;
        this._autoNorthUpRange = WT_Unit.NMILE.createNumber(0);

        this._initSettingListeners();

        mapView.setTargetOffsetHandler(this);
        mapView.setRangeInterpreter(this);

        this._isLatitudeCompensationActive = false;

        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    _initSettingListeners() {
        this._rangeSetting.addListener(this._onRangeSettingChanged.bind(this));
        this._orientationSetting.addListener(this._onOrientationSettingChanged.bind(this));
        this._autoNorthUpSettingGroup.activeSetting.addListener(this._onAutoNorthUpActiveSettingChanged.bind(this));
        this._autoNorthUpSettingGroup.rangeSetting.addListener(this._onAutoNorthUpRangeSettingChanged.bind(this));

        this._updateRange();
        this._setOrientation(this._orientationSetting.getValue());
        this._setAutoNorthUpActive(this._autoNorthUpSettingGroup.isActive());
        this._updateAutoNorthUpRange();
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
        this._mapModel.range = this._rangeSetting.getRange();
    }

    _onRangeSettingChanged(setting, newValue, oldValue) {
        this._updateRange();
    }

    _setOrientation(value) {
        this._orientationSettingValue = value;
    }

    _onOrientationSettingChanged(setting, newValue, oldValue) {
        this._setOrientation(newValue);
    }

    _setAutoNorthUpActive(value) {
        this._autoNorthUpActive = value;
    }

    _onAutoNorthUpActiveSettingChanged(setting, newValue, oldValue) {
        this._setAutoNorthUpActive(newValue);
    }

    _updateAutoNorthUpRange() {
        this._autoNorthUpRange.set(this._autoNorthUpSettingGroup.getRange());
    }

    _onAutoNorthUpRangeSettingChanged(setting, newValue, oldValue) {
        this._updateAutoNorthUpRange(newValue);
    }

    /**
     *
     * @param {WT_GeoPoint} target
     */
    _handleLatitudeCompensation(target) {
        let longDimensionFactor = Math.max(1, this._mapView.viewWidth / this._mapView.viewHeight);
        let latDelta = this._mapModel.range.asUnit(WT_Unit.GA_RADIAN) * Avionics.Utils.RAD2DEG * longDimensionFactor * 2;
        let edgeLat = target.lat + (target.lat >= 0 ? 1 : -1) * latDelta;
        if (Math.abs(edgeLat) > WT_G3x5_NavMapRangeTargetRotationController.MAX_LATITUDE) {
            let compensatedLat = Math.max(0, WT_G3x5_NavMapRangeTargetRotationController.MAX_LATITUDE - latDelta) * (target.lat >= 0 ? 1 : -1);
            target.set(compensatedLat, target.long);
            this._isLatitudeCompensationActive = true;
            this._mapModel.crosshair.show = true;
        } else {
            this._isLatitudeCompensationActive = false;
        }
    }

    _updateTarget() {
        let target = this._tempGeoPoint;
        if (this._mapModel.pointer.show) {
            target.set(this._mapModel.pointer.target);
            this._mapModel.crosshair.show = true;
        } else {
            this._mapModel.airplane.navigation.position(target);
            this._mapModel.crosshair.show = false;
        }

        this._handleLatitudeCompensation(target);

        if (target) {
            this._mapModel.target = target;
        }
    }

    _forceNorthUp() {
        // handle latitude compensation
        if (this._isLatitudeCompensationActive) {
            return true;
        }

        // handle cursor
        if (this._mapModel.pointer.show) {
            return true;
        }

        // handle Auto North Up
        if (this._autoNorthUpActive) {
            if (this._mapModel.range.compare(this._autoNorthUpRange) >= 0) {
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
            orientation = this._orientationSettingValue;
        }

        let rotation;
        switch (orientation) {
            case WT_G3x5_NavMap.Orientation.TRK:
                if (!SimVar.GetSimVarValue("SIM ON GROUND", "bool")) {
                    rotation = -this._mapModel.airplane.navigation.trackTrue();
                    this._mapModel.rangeCompass.show = true;
                    this._mapModel.rangeRing.show = false;
                    break;
                }
            case WT_G3x5_NavMap.Orientation.HDG:
                rotation = -this._mapModel.airplane.navigation.headingTrue();
                this._mapModel.rangeCompass.show = true;
                this._mapModel.rangeRing.show = false;
                break;
            case WT_G3x5_NavMap.Orientation.NORTH:
                rotation = 0;
                this._mapModel.rangeRing.show = true;
                this._mapModel.rangeCompass.show = false;
                break;
        }
        this._mapModel.rotation = rotation;
        this._mapModel.orientation.mode = orientation;
    }

    update() {
        this._updateTarget();
        this._updateRotation();
    }
}
WT_G3x5_NavMapRangeTargetRotationController.MAX_LATITUDE = 85;