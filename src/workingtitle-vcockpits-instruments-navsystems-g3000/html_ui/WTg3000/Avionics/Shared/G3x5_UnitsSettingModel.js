class WT_G3x5_UnitsSettingModel extends WT_DataStoreSettingModel {
    constructor() {
        super("ALL");

        this._initSettings();
    }

    _initSettings() {
        this.addSetting(this._navAngleSetting = new WT_G3x5_NavAngleUnitsSetting(this));
        this.addSetting(this._distanceSpeedSetting = new WT_G3x5_DistanceSpeedUnitsSetting(this));
        this.addSetting(this._altitudeSetting = new WT_G3x5_AltitudeUnitsSetting(this));
        this.addSetting(this._extTemperatureSetting = new WT_G3x5_ExtTemperatureUnitsSetting(this));
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavAngleUnitsSetting}
     */
    get navAngleSetting() {
        return this._navAngleSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_DistanceSpeedUnitsSetting}
     */
    get distanceSpeedSetting() {
        return this._distanceSpeedSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_AltitudeUnitsSetting}
     */
    get altitudeSetting() {
        return this._altitudeSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_ExtTemperatureUnitsSetting}
     */
    get extTemperatureSetting() {
        return this._extTemperatureSetting;
    }
}

class WT_G3x5_UnitsSetting extends WT_DataStoreSetting {
    /**
     * @param {WT_G3x5_UnitsSettingModel} model
     * @param {String} key
     * @param {Number} defaultValue
     */
    constructor(model, key, defaultValue) {
        super(model, key, defaultValue, false, true);
    }

    _getAllUnitsHelper(valueEnum, categories) {
        let result = [];
        for (let valueName in valueEnum) {
            let index = valueEnum[valueName];
            result[index] = categories.map(category => category[index]);
        }
        return result;
    }

    /**
     *
     * @returns {WT_Unit[][]}
     */
    getAllUnits() {
    }
}

class WT_G3x5_NavAngleUnitsSetting extends WT_G3x5_UnitsSetting {
    constructor(model, defaultValue = WT_G3x5_NavAngleUnitsSetting.DEFAULT, key = WT_G3x5_NavAngleUnitsSetting.KEY) {
        super(model, key, defaultValue);

        this._allUnits = this._getAllUnitsHelper(WT_G3x5_NavAngleUnitsSetting.Value, [WT_G3x5_NavAngleUnitsSetting.UNITS.navAngle]);
    }

    getNavAngleUnit() {
        return WT_G3x5_NavAngleUnitsSetting.UNITS.navAngle[this.getValue()];
    }

    /**
     *
     * @returns {WT_Unit[][]}
     */
    getAllUnits() {
        return this._allUnits;
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_NavAngleUnitsSetting.Value = {
    MAGNETIC: 0,
    TRUE: 1
};
WT_G3x5_NavAngleUnitsSetting.UNITS = {
    navAngle: [new WT_NavAngleUnit(true), new WT_NavAngleUnit(false)]
};
WT_G3x5_NavAngleUnitsSetting.KEY = "WT_Units_NavAngle";
WT_G3x5_NavAngleUnitsSetting.DEFAULT = WT_G3x5_NavAngleUnitsSetting.Value.MAGNETIC;

class WT_G3x5_DistanceSpeedUnitsSetting extends WT_G3x5_UnitsSetting {
    constructor(model, defaultOption = WT_G3x5_DistanceSpeedUnitsSetting.DEFAULT, key = WT_G3x5_DistanceSpeedUnitsSetting.KEY) {
        super(model, key, defaultOption);

        this._allUnits = this._getAllUnitsHelper(WT_G3x5_DistanceSpeedUnitsSetting.Value, [WT_G3x5_DistanceSpeedUnitsSetting.UNITS.distance, WT_G3x5_DistanceSpeedUnitsSetting.UNITS.speed]);
    }

    getDistanceUnit() {
        return WT_G3x5_DistanceSpeedUnitsSetting.UNITS.distance[this.getValue()];
    }

    getSpeedUnit() {
        return WT_G3x5_DistanceSpeedUnitsSetting.UNITS.speed[this.getValue()];
    }

    /**
     *
     * @returns {WT_Unit[][]}
     */
    getAllUnits() {
        return this._allUnits;
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_DistanceSpeedUnitsSetting.Value = {
    NAUTICAL: 0,
    METRIC: 1
};
WT_G3x5_DistanceSpeedUnitsSetting.UNITS = {
    distance: [WT_Unit.NMILE, WT_Unit.KILOMETER],
    speed: [WT_Unit.KNOT, WT_Unit.KPH]
};
WT_G3x5_DistanceSpeedUnitsSetting.KEY = "WT_Units_DistanceSpeed";
WT_G3x5_DistanceSpeedUnitsSetting.DEFAULT = WT_G3x5_DistanceSpeedUnitsSetting.Value.NAUTICAL;

class WT_G3x5_AltitudeUnitsSetting extends WT_G3x5_UnitsSetting {
    constructor(model, defaultOption = WT_G3x5_AltitudeUnitsSetting.DEFAULT, key = WT_G3x5_AltitudeUnitsSetting.KEY) {
        super(model, key, defaultOption);

        this._allUnits = this._getAllUnitsHelper(WT_G3x5_AltitudeUnitsSetting.Value, [WT_G3x5_AltitudeUnitsSetting.UNITS.altitude, WT_G3x5_AltitudeUnitsSetting.UNITS.verticalSpeed]);
    }

    getAltitudeUnit() {
        return WT_G3x5_AltitudeUnitsSetting.UNITS.altitude[this.getValue()];
    }

    getVerticalSpeedUnit() {
        return WT_G3x5_AltitudeUnitsSetting.UNITS.verticalSpeed[this.getValue()];
    }

    /**
     *
     * @returns {WT_Unit[][]}
     */
    getAllUnits() {
        return this._allUnits;
    }
}
/**
 * @enum {Number}
 */
 WT_G3x5_AltitudeUnitsSetting.Value = {
    FEET: 0,
    METERS: 1
};
WT_G3x5_AltitudeUnitsSetting.UNITS = {
    altitude: [WT_Unit.FOOT, WT_Unit.METER],
    verticalSpeed: [WT_Unit.FPM, WT_Unit.MPM]
};
WT_G3x5_AltitudeUnitsSetting.KEY = "WT_Units_Altitude";
WT_G3x5_AltitudeUnitsSetting.DEFAULT = WT_G3x5_AltitudeUnitsSetting.Value.FEET;

class WT_G3x5_ExtTemperatureUnitsSetting extends WT_G3x5_UnitsSetting {
    constructor(model, defaultValue = WT_G3x5_ExtTemperatureUnitsSetting.DEFAULT, key = WT_G3x5_ExtTemperatureUnitsSetting.KEY) {
        super(model, key, defaultValue);

        this._allUnits = this._getAllUnitsHelper(WT_G3x5_ExtTemperatureUnitsSetting.Value, [WT_G3x5_ExtTemperatureUnitsSetting.UNITS.temperature]);
    }

    getTemperatureUnit() {
        return WT_G3x5_ExtTemperatureUnitsSetting.UNITS.temperature[this.getValue()];
    }

    /**
     *
     * @returns {WT_Unit[][]}
     */
    getAllUnits() {
        return this._allUnits;
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_ExtTemperatureUnitsSetting.Value = {
    CELSIUS: 0,
    FAHRENHEIT: 1
};
WT_G3x5_ExtTemperatureUnitsSetting.UNITS = {
    temperature: [WT_Unit.CELSIUS, WT_Unit.FAHRENHEIT]
};
WT_G3x5_ExtTemperatureUnitsSetting.KEY = "WT_Units_ExtTemperature";
WT_G3x5_ExtTemperatureUnitsSetting.DEFAULT = WT_G3x5_ExtTemperatureUnitsSetting.Value.CELSIUS;

/**
 * @abstract
 */
class WT_G3x5_UnitsSettingModelAdapter {
    /**
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     */
    constructor(unitsSettingModel) {
        this._unitsSettingModel = unitsSettingModel;
    }

    _initListeners() {
        this.unitsSettingModel.navAngleSetting.addListener(this._onNavAngleSettingChanged.bind(this));
        this.unitsSettingModel.distanceSpeedSetting.addListener(this._onDistanceSpeedSettingChanged.bind(this));
        this.unitsSettingModel.altitudeSetting.addListener(this._onAltitudeSettingChanged.bind(this));
        this.unitsSettingModel.extTemperatureSetting.addListener(this._onExtTemperatureSettingChanged.bind(this));
    }

    _initModel() {
        this._updateBearing();
        this._updateDistance();
        this._updateSpeed();
        this._updateAltitude();
        this._updateVerticalSpeed();
        this._updateExtTemperature();
    }

    /**
     * @readonly
     * @type {WT_G3x5_UnitsSettingModel}
     */
    get unitsSettingModel() {
        return this._unitsSettingModel;
    }

    _updateBearing() {
    }

    _updateDistance() {
    }

    _updateSpeed() {
    }

    _updateAltitude() {
    }

    _updateVerticalSpeed() {
    }

    _updateExtTemperature() {
    }

    /**
     *
     * @param {WT_G3x5_NavAngleUnitsSetting} setting
     * @param {WT_G3x5_NavAngleUnitsSetting.Value} newValue
     * @param {WT_G3x5_NavAngleUnitsSetting.Value} oldValue
     */
    _onNavAngleSettingChanged(setting, newValue, oldValue) {
        this._updateBearing();
    }

    /**
     *
     * @param {WT_G3x5_DistanceSpeedUnitsSetting} setting
     * @param {WT_G3x5_DistanceSpeedUnitsSetting.Value} newValue
     * @param {WT_G3x5_DistanceSpeedUnitsSetting.Value} oldValue
     */
    _onDistanceSpeedSettingChanged(setting, newValue, oldValue) {
        this._updateDistance();
        this._updateSpeed();
    }

    /**
     *
     * @param {WT_G3x5_AltitudeUnitsSetting} setting
     * @param {WT_G3x5_AltitudeUnitsSetting.Value} newValue
     * @param {WT_G3x5_AltitudeUnitsSetting.Value} oldValue
     */
    _onAltitudeSettingChanged(setting, newValue, oldValue) {
        this._updateAltitude();
        this._updateVerticalSpeed();
    }

    /**
     *
     * @param {WT_G3x5_ExtTemperatureUnitsSetting} setting
     * @param {WT_G3x5_ExtTemperatureUnitsSetting.Value} newValue
     * @param {WT_G3x5_ExtTemperatureUnitsSetting.Value} oldValue
     */
    _onExtTemperatureSettingChanged(setting, newValue, oldValue) {
        this._updateExtTemperature();
    }
}

class WT_G3x5_UnitsSettingModelMapModelAdapter extends WT_G3x5_UnitsSettingModelAdapter {
    /**
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     * @param {WT_MapModel} mapModel
     */
    constructor(unitsSettingModel, mapModel) {
        super(unitsSettingModel);

        this._mapModel = mapModel;
        this._initListeners();
        this._initModel();
    }

    /**
     * @readonly
     * @type {WT_MapModel}
     */
    get mapModel() {
        return this._mapModel;
    }

    _updateBearing() {
        this.mapModel.units.bearing = this.unitsSettingModel.navAngleSetting.getNavAngleUnit();
    }

    _updateDistance() {
        this.mapModel.units.distance = this.unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
    }

    _updateSpeed() {
        this.mapModel.units.speed = this.unitsSettingModel.distanceSpeedSetting.getSpeedUnit();
    }
}

class WT_G3x5_UnitsControllerNavDataBarModelAdapter extends WT_G3x5_UnitsSettingModelAdapter {
    /**
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     * @param {WT_G3x5_NavDataBarModel} navDataBarModel
     */
    constructor(unitsSettingModel, navDataBarModel) {
        super(unitsSettingModel);

        this._navDataBarModel = navDataBarModel;
        this._initListeners();
        this._initModel();
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavDataBarModel}
     */
    get navDataBarModel() {
        return this._navDataBarModel;
    }

    _updateBearing() {
        let unit = this.unitsSettingModel.navAngleSetting.getNavAngleUnit();
        this.navDataBarModel.getNavDataInfo("BRG").setDisplayUnit(unit);
        this.navDataBarModel.getNavDataInfo("DTK").setDisplayUnit(unit);
        this.navDataBarModel.getNavDataInfo("TRK").setDisplayUnit(unit);
    }

    _updateDistance() {
        let unit = this.unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
        this.navDataBarModel.getNavDataInfo("DIS").setDisplayUnit(unit);
        this.navDataBarModel.getNavDataInfo("DTG").setDisplayUnit(unit);
        this.navDataBarModel.getNavDataInfo("XTK").setDisplayUnit(unit);
    }

    _updateSpeed() {
        let unit = this.unitsSettingModel.distanceSpeedSetting.getSpeedUnit();
        this.navDataBarModel.getNavDataInfo("GS").setDisplayUnit(unit);
        this.navDataBarModel.getNavDataInfo("TAS").setDisplayUnit(unit);
    }
}