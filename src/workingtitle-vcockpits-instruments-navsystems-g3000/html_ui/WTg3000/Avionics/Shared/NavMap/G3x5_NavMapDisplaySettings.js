class WT_G3x5_NavMapDisplayInsetSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_NavMapDisplayInsetSetting.DEFAULT_VALUE, key = WT_G3x5_NavMapDisplayInsetSetting.KEY) {
        super(model, key, defaultValue, true, true);

        this._mode = this.getValue();
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavMapDisplayInsetSetting.Mode}
     */
    get mode() {
        return this._mode;
    }

    update() {
        this._mode = this.getValue();
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_NavMapDisplayInsetSetting.Mode = {
    NONE: 0,
    FLIGHT_PLAN: 1
};
WT_G3x5_NavMapDisplayInsetSetting.KEY = "WT_NavMapDisplay_Inset";
WT_G3x5_NavMapDisplayInsetSetting.DEFAULT_VALUE = WT_G3x5_NavMapDisplayInsetSetting.Mode.NONE;