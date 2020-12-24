/**
 * A setting that controls whether the map's altitude intercept arc overlay is visible.
 */
class WT_MapAltitudeInterceptSetting extends WT_MapSetting {
    /**
     * @param {WT_MapElement} controller - the controller with which to associate the new setting.
     * @param {Boolean} [isSyncable] - whether the new setting is sync-able. True by default.
     * @param {Boolean} [isPersistent] - whether the new setting persists across sessions. True by default.
     * @param {String} [key=WT_MapAltitudeInterceptSetting.SHOW_KEY_DEFAULT] - the data store key of the new setting.
     */
    constructor(controller, isSyncable = true, isPersistent = true, key = WT_MapAltitudeInterceptSetting.SHOW_KEY_DEFAULT) {
        super(controller, key, false, isSyncable, true, isPersistent);
    }

    update() {
        this.model.altitudeIntercept.show = this.getValue();
    }
}
WT_MapAltitudeInterceptSetting.SHOW_KEY_DEFAULT = "WT_Map_AltitudeIntercept_Show";