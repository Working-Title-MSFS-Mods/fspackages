class WT_G3x5_UnitsController extends WT_DataStoreController {
    constructor() {
        super("ALL", null);

        this._initSettings();
    }

    _initSettings() {
        this.addSetting(this._navAngleSetting = new WT_G3x5_NavAngleUnitsSetting(this));
        this.addSetting(this._distanceSpeedSetting = new WT_G3x5_DistanceSpeedUnitsSetting(this));
    }

    /**
     * @readonly
     * @property {WT_G3x5_NavAngleUnitsSetting} navAngleSetting
     * @type {WT_G3x5_NavAngleUnitsSetting}
     */
    get navAngleSetting() {
        return this._navAngleSetting;
    }

    /**
     * @readonly
     * @property {WT_G3x5_DistanceSpeedUnitsSettingGroup} distanceSpeedSetting
     * @type {WT_G3x5_DistanceSpeedUnitsSetting}
     */
    get distanceSpeedSetting() {
        return this._distanceSpeedSetting;
    }
}

class WT_G3x5_UnitsSetting extends WT_DataStoreSetting {
    /**
     * @param {WT_G3x5_UnitsController} controller
     * @param {String} key
     * @param {Number} defaultValue
     */
    constructor(controller, key, defaultValue) {
        super(controller, key, defaultValue, false, true);
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
    constructor(controller, defaultValue = WT_G3x5_NavAngleUnitsSetting.DEFAULT, key = WT_G3x5_NavAngleUnitsSetting.KEY) {
        super(controller, key, defaultValue);

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
    constructor(controller, defaultOption = WT_G3x5_DistanceSpeedUnitsSetting.DEFAULT, key = WT_G3x5_DistanceSpeedUnitsSetting.KEY) {
        super(controller, key, defaultOption);

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

/**
 * @abstract
 */
class WT_G3x5_UnitsControllerModelAdapter {
    /**
     * @param {WT_G3x5_UnitsController} controller
     */
    constructor(controller) {
        this._controller = controller;
    }

    _initListeners() {
        this.controller.navAngleSetting.addListener(this._onNavAngleSettingChanged.bind(this));
        this.controller.distanceSpeedSetting.addListener(this._onDistanceSpeedSettingChanged.bind(this));
    }

    _initModel() {
        this._updateBearing();
        this._updateDistance();
        this._updateSpeed();
    }

    /**
     * @readonly
     * @property {WT_G3x5_UnitsController} controller
     * @type {WT_G3x5_UnitsController}
     */
    get controller() {
        return this._controller;
    }

    _updateBearing() {
    }

    _updateDistance() {
    }

    _updateSpeed() {
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
}

class WT_G3x5_UnitsControllerMapModelAdapter extends WT_G3x5_UnitsControllerModelAdapter {
    /**
     * @param {WT_G3x5_UnitsController} controller
     * @param {WT_MapModel} mapModel
     */
    constructor(controller, mapModel) {
        super(controller);

        this._mapModel = mapModel;
        this._initListeners();
        this._initModel();
    }

    /**
     * @readonly
     * @property {WT_MapModel} mapModel
     * @type {WT_MapModel}
     */
    get mapModel() {
        return this._mapModel;
    }

    _updateBearing() {
        this.mapModel.units.bearing = this.controller.navAngleSetting.getNavAngleUnit();
    }

    _updateDistance() {
        this.mapModel.units.distance = this.controller.distanceSpeedSetting.getDistanceUnit();
    }

    _updateSpeed() {
        this.mapModel.units.speed = this.controller.distanceSpeedSetting.getSpeedUnit();
    }
}

class WT_G3x5_UnitsControllerNavDataBarModelAdapter extends WT_G3x5_UnitsControllerModelAdapter {
    /**
     * @param {WT_G3x5_UnitsController} controller
     * @param {WT_NavDataBarModel} navDataBarModel
     */
    constructor(controller, navDataBarModel) {
        super(controller);

        this._navDataBarModel = navDataBarModel;
        this._initListeners();
        this._initModel();
    }

    /**
     * @readonly
     * @property {WT_NavDataBarModel} navDataBarModel
     * @type {WT_NavDataBarModel}
     */
    get navDataBarModel() {
        return this._navDataBarModel;
    }

    _updateBearing() {
        let unit = this.controller.navAngleSetting.getNavAngleUnit();
        this.navDataBarModel.getNavDataInfo("BRG").setDisplayUnit(unit);
        this.navDataBarModel.getNavDataInfo("DTK").setDisplayUnit(unit);
        this.navDataBarModel.getNavDataInfo("TRK").setDisplayUnit(unit);
    }

    _updateDistance() {
        let unit = this.controller.distanceSpeedSetting.getDistanceUnit();
        this.navDataBarModel.getNavDataInfo("DIS").setDisplayUnit(unit);
        this.navDataBarModel.getNavDataInfo("DTG").setDisplayUnit(unit);
        this.navDataBarModel.getNavDataInfo("XTK").setDisplayUnit(unit);
    }

    _updateSpeed() {
        let unit = this.controller.distanceSpeedSetting.getSpeedUnit();
        this.navDataBarModel.getNavDataInfo("GS").setDisplayUnit(unit);
        this.navDataBarModel.getNavDataInfo("TAS").setDisplayUnit(unit);
    }
}