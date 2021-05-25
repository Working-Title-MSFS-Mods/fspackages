class WT_G3x5_PFDInsetMapShowSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = false, autoUpdate = false, isPersistent = true, key = WT_G3x5_PFDInsetMapShowSetting.KEY) {
        super(model, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_PFDInsetMapShowSetting.KEY = "WT_InsetMap_Show";

class WT_G3x5_PFDTrafficInsetMapShowSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = false, autoUpdate = false, isPersistent = true, key = WT_G3x5_PFDTrafficInsetMapShowSetting.KEY) {
        super(model, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_PFDTrafficInsetMapShowSetting.KEY = "WT_TrafficInsetMap_Show";

class WT_G3x5_PFDSVTShowSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = false, autoUpdate = false, isPersistent = true, key = WT_G3x5_PFDSVTShowSetting.KEY) {
        super(model, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_PFDSVTShowSetting.KEY = "WT_SVT_Show";

class WT_G3x5_PFDAoAModeSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_PFDAoAModeSetting.DEFAULT, autoUpdate = false, isPersistent = true, key = WT_G3x5_PFDAoAModeSetting.KEY) {
        super(model, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_PFDAoAModeSetting.KEY = "WT_AoA_Mode";
/**
 * @enum {Number}
 */
WT_G3x5_PFDAoAModeSetting.Mode = {
    OFF: 0,
    ON: 1,
    AUTO: 2
};
WT_G3x5_PFDAoAModeSetting.DEFAULT = WT_G3x5_PFDAoAModeSetting.Mode.ON;

class WT_G3x5_PFDWindModeSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_PFDWindModeSetting.DEFAULT, autoUpdate = false, isPersistent = true, key = WT_G3x5_PFDWindModeSetting.KEY) {
        super(model, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_PFDWindModeSetting.KEY = "WT_Wind_Mode";
/**
 * @enum {Number}
 */
WT_G3x5_PFDWindModeSetting.Mode = {
    OFF: 0,
    OPTION_1: 1,
    OPTION_2: 2,
    OPTION_3: 3
};
WT_G3x5_PFDWindModeSetting.DEFAULT = WT_G3x5_PFDWindModeSetting.Mode.OFF;

class WT_G3x5_PFDBaroUnitsSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_PFDBaroUnitsSetting.DEFAULT, autoUpdate = false, isPersistent = true, key = WT_G3x5_PFDBaroUnitsSetting.KEY) {
        super(model, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_PFDBaroUnitsSetting.KEY = "WT_Baro_Units";
/**
 * @enum {Number}
 */
WT_G3x5_PFDBaroUnitsSetting.Mode = {
    IN_HG: 0,
    HPA: 1
};
WT_G3x5_PFDBaroUnitsSetting.DEFAULT = WT_G3x5_PFDBaroUnitsSetting.Mode.IN_HG;

class WT_G3x5_PFDAltimeterMetersSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = false, autoUpdate = false, isPersistent = true, key = WT_G3x5_PFDAltimeterMetersSetting.KEY) {
        super(model, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_PFDAltimeterMetersSetting.KEY = "WT_Altimeter_Meters";