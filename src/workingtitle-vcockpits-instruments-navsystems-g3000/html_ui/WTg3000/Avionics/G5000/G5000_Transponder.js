class WT_G5000_TransponderTCASModeSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G5000_TransponderTCASModeSetting.DEFAULT, key = WT_G5000_TransponderTCASModeSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }
}
WT_G5000_TransponderTCASModeSetting.KEY = "WT_Transponder_Mode";
/**
 * @enum {Number}
 */
WT_G5000_TransponderTCASModeSetting.Mode = {
    AUTO: 0,
    TA_ONLY: 1,
    STANDBY: 2
};
WT_G5000_TransponderTCASModeSetting.DEFAULT = WT_G5000_TransponderTCASModeSetting.Mode.TA_ONLY;