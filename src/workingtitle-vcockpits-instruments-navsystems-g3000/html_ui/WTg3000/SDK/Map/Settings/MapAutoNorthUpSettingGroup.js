/**
 * A setting that forces a north-up map orientation above a certain map zoom range.
 */
class WT_MapAutoNorthUpSettingGroup extends WT_MapSettingGroup {
    /**
     * @param {WT_MapSettingModel} model - the setting model with which to associate the new setting.
     * @param {WT_NumberUnit[]} ranges - an array of map zoom ranges.
     * @param {WT_NumberUnit} defaultRange - the default threshold range.
     * @param {Boolean} [isSyncable] - whether the auto north-up settings are sync-able. True by default.
     * @param {Boolean} [isPersistent] - whether the auto north-up settings persist across sessions. True by default.
     */
    constructor(model, ranges, defaultRange, isSyncable = true, isPersistent = true) {
        super(model, [], isSyncable, false);

        this._ranges = ranges;
        this._activeSetting = new WT_MapSetting(model, WT_MapAutoNorthUpSettingGroup.ACTIVE_KEY, false, isSyncable, false, isPersistent);
        this._rangeSetting = new WT_MapSetting(model, WT_MapAutoNorthUpSettingGroup.RANGE_KEY, ranges.findIndex(range => range.equals(defaultRange)), isSyncable, false, isPersistent);
        this.addSetting(this._activeSetting);
        this.addSetting(this._rangeSetting);
    }

    /**
     * The setting that controls whether auto north-up is active.
     * @readonly
     * @type {WT_MapSetting}
     */
    get activeSetting() {
        return this._activeSetting;
    }

    /**
     * The setting that controls the maximum map range of the auto north-up function.
     * @readonly
     * @type {WT_MapSetting}
     */
    get rangeSetting() {
        return this._rangeSetting;
    }

    /**
     * Checks whether auto north-up is set to active.
     * @returns {Boolean} whether auto north-up is set to active.
     */
    isActive() {
        return this._activeSetting.getValue();
    }

    /**
     * Gets the maximum map range setting value of the auto north-up function.
     * @returns {WT_NumberUnitReadOnly} the maximum map range setting value of the auto north-up function.
     */
    getRange() {
        return this._ranges[this._rangeSetting.getValue()].readonly();
    }
}
WT_MapAutoNorthUpSettingGroup.ACTIVE_KEY = "WT_Map_NorthUpAbove_Active";
WT_MapAutoNorthUpSettingGroup.RANGE_KEY = "WT_Map_NorthUpAbove_Range";