class WT_G3x5_PFDInsetMapShowSetting extends WT_DataStoreSetting {
    constructor(controller, defaultValue = false, autoUpdate = false, isPersistent = true, key = WT_G3x5_PFDInsetMapShowSetting.KEY) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_PFDInsetMapShowSetting.KEY = "WT_InsetMap_Show";

class WT_G3x5_PFDSVTShowSetting extends WT_DataStoreSetting {
    constructor(controller, defaultValue = false, autoUpdate = false, isPersistent = true, key = WT_G3x5_PFDSVTShowSetting.KEY) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_PFDSVTShowSetting.KEY = "WT_SVT_Show";

class WT_G3x5_PFDAoAModeSetting extends WT_DataStoreSetting {
    constructor(controller, defaultValue = WT_G3x5_PFDAoAModeSetting.DEFAULT, autoUpdate = false, isPersistent = true, key = WT_G3x5_PFDAoAModeSetting.KEY) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_PFDAoAModeSetting.KEY = "WT_AoA_Mode";
WT_G3x5_PFDAoAModeSetting.Mode = {
    OFF: 0,
    ON: 1,
    AUTO: 2
};
WT_G3x5_PFDAoAModeSetting.DEFAULT = WT_G3x5_PFDAoAModeSetting.Mode.ON;

class WT_G3x5_PFDWindModeSetting extends WT_DataStoreSetting {
    constructor(controller, defaultValue = WT_G3x5_PFDWindModeSetting.DEFAULT, autoUpdate = false, isPersistent = true, key = WT_G3x5_PFDWindModeSetting.KEY) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_PFDWindModeSetting.KEY = "WT_Wind_Mode";
WT_G3x5_PFDWindModeSetting.Mode = {
    OFF: 0,
    OPTION_1: 1,
    OPTION_2: 2,
    OPTION_3: 3
};
WT_G3x5_PFDWindModeSetting.DEFAULT = WT_G3x5_PFDWindModeSetting.Mode.OFF;

class WT_G3x5_PFDBaroUnitsSetting extends WT_DataStoreSetting {
    constructor(controller, defaultValue = WT_G3x5_PFDBaroUnitsSetting.DEFAULT, autoUpdate = false, isPersistent = true, key = WT_G3x5_PFDBaroUnitsSetting.KEY) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_PFDBaroUnitsSetting.KEY = "WT_Baro_Units";
WT_G3x5_PFDBaroUnitsSetting.Mode = {
    IN_HG: 0,
    HPA: 1
};
WT_G3x5_PFDBaroUnitsSetting.DEFAULT = WT_G3x5_PFDBaroUnitsSetting.Mode.IN_HG;