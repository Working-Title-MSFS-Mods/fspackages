class WT_G3x5_WaypointDisplayICAOSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = "", key = WT_G3x5_WaypointDisplayICAOSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }
}
WT_G3x5_WaypointDisplayICAOSetting.KEY = "WT_WaypointDisplay_ICAO";