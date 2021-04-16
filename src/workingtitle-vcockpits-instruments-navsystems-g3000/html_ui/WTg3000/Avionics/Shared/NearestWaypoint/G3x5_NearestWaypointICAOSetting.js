class WT_G3x5_NearestWaypointICAOSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = "", key = WT_G3x5_NearestWaypointICAOSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }
}
WT_G3x5_NearestWaypointICAOSetting.KEY = "WT_NearestWaypoint_ICAO";