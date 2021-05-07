class WT_G3x5_AvionicsSystemSettingModel {
    constructor() {
        this._settingModel = new WT_DataStoreSettingModel(WT_G3x5_AvionicsSystemSettingModel.ID);
        this._initSettings();
        this._settingModel.init();
    }

    _initSettings() {
        this._settingModel.addSetting(this._timeFormatSetting = new WT_G3x5_TimeFormatSetting(this._settingModel));
        this._settingModel.addSetting(this._timeLocalOffsetSetting = new WT_G3x5_TimeLocalOffsetSetting(this._settingModel));
    }

    /**
     * @readonly
     * @type {WT_G3x5_TimeFormatSetting}
     */
    get timeFormatSetting() {
        return this._timeFormatSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TimeLocalOffsetSetting}
     */
    get timeLocalOffsetSetting() {
        return this._timeLocalOffsetSetting;
    }
}
WT_G3x5_AvionicsSystemSettingModel.ID = "AvionicsSystem";

class WT_G3x5_TimeFormatSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_TimeFormatSetting.DEFAULT, key = WT_G3x5_TimeFormatSetting.KEY) {
        super(model, key, defaultValue, false, true);
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TimeFormatSetting.Mode = {
    LOCAL_12_HOUR: 0,
    LOCAL_24_HOUR: 1,
    UTC: 2
};
WT_G3x5_TimeFormatSetting.KEY = "WT_Time_Format";
WT_G3x5_TimeFormatSetting.DEFAULT = WT_G3x5_TimeFormatSetting.Mode.UTC;

class WT_G3x5_TimeLocalOffsetSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = 0, key = WT_G3x5_TimeLocalOffsetSetting.KEY) {
        super(model, key, defaultValue, false, true);
    }

    /**
     *
     * @param {WT_NumberUnit} [reference]
     * @returns {WT_NumberUnit}
     */
    getOffset(reference) {
        let value = this.getValue();
        return reference ? reference.set(value, WT_Unit.SECOND) : WT_Unit.SECOND.createNumber(value);
    }

    /**
     *
     * @param {WT_NumberUnit} offset
     */
    setOffset(offset) {
        this.setValue(offset.asUnit(WT_Unit.SECOND));
    }
}
WT_G3x5_TimeLocalOffsetSetting.KEY = "WT_Time_LocalOffset";