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
    FLIGHT_PLAN_TEXT: 1
};
WT_G3x5_NavMapDisplayInsetSetting.KEY = "WT_NavMapDisplay_Inset";
WT_G3x5_NavMapDisplayInsetSetting.DEFAULT_VALUE = WT_G3x5_NavMapDisplayInsetSetting.Mode.NONE;

class WT_G3x5_NavMapDisplayFlightPlanTextDistanceSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_NavMapDisplayFlightPlanTextDistanceSetting.DEFAULT_VALUE, key = WT_G3x5_NavMapDisplayFlightPlanTextDistanceSetting.KEY) {
        super(model, key, defaultValue, true, true);

        this._isCumulative = this.getValue();
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isCumulative() {
        return this._isCumulative;
    }

    update() {
        this._isCumulative = this.getValue();
    }
}
WT_G3x5_NavMapDisplayFlightPlanTextDistanceSetting.KEY = "WT_NavMapDisplay_FlightPlanTextInset_Distance";
WT_G3x5_NavMapDisplayFlightPlanTextDistanceSetting.DEFAULT_VALUE = false;