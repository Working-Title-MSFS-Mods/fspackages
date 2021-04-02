class WT_G5000_TransponderModeSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G5000_TransponderModeSetting.DEFAULT, key = WT_G5000_TransponderModeSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }
}
WT_G5000_TransponderModeSetting.KEY = "WT_Transponder_Mode";
/**
 * @enum {Number}
 */
WT_G5000_TransponderModeSetting.Mode = {
    AUTO: 0,
    TA_ONLY: 1,
    ALTITUDE_REPORTING: 2,
    ON: 3,
    STANDBY: 4
};
WT_G5000_TransponderModeSetting.DEFAULT = WT_G5000_TransponderModeSetting.Mode.TA_ONLY;