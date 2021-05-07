/**
 * A setting that controls whether the map's altitude intercept arc overlay is visible.
 */
class WT_MapAltitudeInterceptSetting extends WT_MapSetting {
    /**
     * @param {WT_MapElement} model - the setting model with which to associate the new setting.
     * @param {Boolean} autoUpdate - whether the new setting should automatically call its update() method whenever its value
     *                               changes.
     * @param {Boolean} [isSyncable] - whether the new setting is sync-able. True by default.
     * @param {Boolean} [isPersistent] - whether the new setting persists across sessions. True by default.
     * @param {String} [key=WT_MapAltitudeInterceptSetting.SHOW_KEY_DEFAULT] - the data store key of the new setting.
     */
    constructor(model, autoUpdate, isSyncable = true, isPersistent = true, key = WT_MapAltitudeInterceptSetting.SHOW_KEY_DEFAULT) {
        super(model, key, false, isSyncable, autoUpdate, isPersistent);
    }

    update() {
        this.mapModel.altitudeIntercept.show = this.getValue();
    }
}
WT_MapAltitudeInterceptSetting.SHOW_KEY_DEFAULT = "WT_Map_AltitudeIntercept_Show";