/**
 * A setting that controls the map's fuel ring overlay.
 */
class WT_MapFuelRingSettingGroup extends WT_MapSettingGroup {
    /**
     * @param {WT_MapElement} model - the setting model with which to associate the new setting.
     * @param {Boolean} autoUpdate - whether the new setting should automatically call its update() method whenever its value
     *                               changes.
     * @param {Number} [reserveDefault] - the default reserve fuel time (in minutes).
     * @param {Boolean} [isSyncable] - whether the fuel ring settings are sync-able. True by default.
     * @param {Boolean} [isPersistent] - whether the fuel ring settings persist across sessions. True by default.
     */
    constructor(model, autoUpdate, reserveDefault = WT_MapFuelRingSettingGroup.RESERVE_DEFAULT, isSyncable = true, isPersistent = true) {
        super(model, [], isSyncable, autoUpdate);

        this._showSetting = new WT_MapSetting(model, WT_MapFuelRingSettingGroup.SHOW_KEY, false, isSyncable, false, isPersistent);
        this._reserveSetting = new WT_MapSetting(model, WT_MapFuelRingSettingGroup.RESERVE_KEY, reserveDefault, isSyncable, false, isPersistent);
        this.addSetting(this._showSetting);
        this.addSetting(this._reserveSetting);
    }

    /**
     * The setting that controls fuel ring visibility.
     * @readonly
     * @type {WT_MapSetting}
     */
    get showSetting() {
        return this._showSetting;
    }

    /**
     * The setting that controls the reserve time of the fuel ring.
     * @readonly
     * @type {WT_MapSetting}
     */
    get reserveTimeSetting() {
        return this._reserveSetting;
    }

    update() {
        let show = this._showSetting.getValue();
        let reserveTime = this._reserveSetting.getValue();

        this.mapModel.fuelRing.show = show;
        this.mapModel.fuelRing.reserveTime = new WT_NumberUnit(reserveTime, WT_Unit.MINUTE);
    }
}
WT_MapFuelRingSettingGroup.SHOW_KEY = "WT_Map_FuelRing_Show";
WT_MapFuelRingSettingGroup.RESERVE_KEY = "WT_Map_FuelRing_Reserve";
WT_MapFuelRingSettingGroup.RESERVE_DEFAULT = 45;