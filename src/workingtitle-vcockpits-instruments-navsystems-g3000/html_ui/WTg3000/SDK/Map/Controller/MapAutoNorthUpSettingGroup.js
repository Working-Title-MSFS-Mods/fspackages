/**
 * A setting that forces a north-up map orientation above a certain map zoom range.
 */
class WT_MapAutoNorthUpSettingGroup extends WT_MapSettingGroup {
    /**
     * @param {WT_MapController} controller - the controller with which to associate the new setting.
     * @param {WT_NumberUnit[]} ranges - an array of map zoom ranges.
     * @param {WT_NumberUnit} defaultRange - the default threshold range.
     * @param {Boolean} [isSyncable] - whether the auto north-up settings are sync-able. True by default.
     * @param {Boolean} [autoUpdate] - whether the new setting group should automatically update its associated model/view whenever the value
     *                                 of any of its consituent settings changes. False by default.
     * @param {Boolean} [isPersistent] - whether the auto north-up settings persist across sessions. True by default.
     */
    constructor(controller, ranges, defaultRange, isSyncable = true, autoUpdate = false, isPersistent = true) {
        super(controller, [], isSyncable, autoUpdate);

        this._ranges = ranges;
        this._activeSetting = new WT_MapSetting(controller, WT_MapAutoNorthUpSettingGroup.ACTIVE_KEY, false, isSyncable, false, isPersistent);
        this._rangeSetting = new WT_MapSetting(controller, WT_MapAutoNorthUpSettingGroup.RANGE_KEY, ranges.findIndex(range => range.equals(defaultRange)), isSyncable, false, isPersistent);
        this.addSetting(this._activeSetting);
        this.addSetting(this._rangeSetting);
    }

    isActive() {
        return this._activeSetting.getValue();
    }

    getRange() {
        return this._ranges[this._rangeSetting.getValue()];
    }
}
WT_MapAutoNorthUpSettingGroup.ACTIVE_KEY = "WT_Map_NorthUpAbove_Active";
WT_MapAutoNorthUpSettingGroup.RANGE_KEY = "WT_Map_NorthUpAbove_Range";