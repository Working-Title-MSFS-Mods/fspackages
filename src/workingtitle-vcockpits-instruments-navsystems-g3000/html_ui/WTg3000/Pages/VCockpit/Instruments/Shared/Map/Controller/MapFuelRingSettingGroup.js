/**
 * A setting that controls the map's fuel ring overlay.
 */
class WT_MapFuelRingSettingGroup extends WT_MapSettingGroup {
    /**
     * @param {WT_MapElement} controller - the controller with which to associate the new setting.
     * @param {Number} [reserveDefault=WT_MapFuelRingSetting.VARNAME_RESERVE_DEFAULT] - the default reserve fuel time (in minutes).
     * @param {Boolean} [isSyncable] - whether the fuel ring settings are sync-able. True by default.
     * @param {Boolean} [isPersistent] - whether the fuel ring settings persist across sessions. True by default.
     */
    constructor(controller, reserveDefault = WT_MapFuelRingSettingGroup.RESERVE_DEFAULT, isSyncable = true, isPersistent = true) {
        super(controller, [], isSyncable, true);

        this._showSetting = new WT_MapSetting(controller, WT_MapFuelRingSettingGroup.SHOW_KEY, false, isSyncable, false, isPersistent);
        this._reserveSetting = new WT_MapSetting(controller, WT_MapFuelRingSettingGroup.RESERVE_KEY, reserveDefault, isSyncable, false, isPersistent);
        this.addSetting(this._showSetting);
        this.addSetting(this._reserveSetting);
    }

    update() {
        let show = this._showSetting.getValue();
        let reserveTime = this._reserveSetting.getValue();

        this.model.fuelRing.show = show;
        this.model.fuelRing.reserveTime = new WT_NumberUnit(reserveTime, WT_Unit.MINUTE);
    }
}
WT_MapFuelRingSettingGroup.SHOW_KEY = "WT_Map_FuelRing_Show";
WT_MapFuelRingSettingGroup.RESERVE_KEY = "WT_Map_FuelRing_Reserve";
WT_MapFuelRingSettingGroup.RESERVE_DEFAULT = 45;