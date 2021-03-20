/**
 * A setting that controls the map's track vector overlay.
 */
class WT_MapTrackVectorSettingGroup extends WT_MapSettingGroup {
    /**
     * @param {WT_MapElement} controller - the controller with which to associate the new setting.
     * @param {WT_NumberUnit[]} [lookaheadValues=WT_MapTrackVectorSettingGroup.LOOKAHEAD_VALUES_DEFAULT] - an Iterable of the possible lookahead times (in seconds).
     * @param {number} [lookaheadDefault=WT_MapTrackVectorSettingGroup.LOOKAHEAD_DEFAULT] - the default lookahead time (in seconds).
     * @param {Boolean} [isSyncable] - whether the track vector settings are sync-able. True by default.
     * @param {Boolean} [isPersistent] - whether the track vector settings persist across sessions. True by default.
     */
    constructor(controller, lookaheadValues = WT_MapTrackVectorSettingGroup.LOOKAHEAD_VALUES_DEFAULT, lookaheadDefault = WT_MapTrackVectorSettingGroup.LOOKAHEAD_DEFAULT, isSyncable = true, isPersistent = true) {
        super(controller, [], isSyncable, true);

        this.lookaheadValues = lookaheadValues;
        this._showSetting = new WT_MapSetting(controller, WT_MapTrackVectorSettingGroup.SHOW_KEY, false, isSyncable, false, isPersistent);
        this._lookaheadSetting = new WT_MapSetting(controller, WT_MapTrackVectorSettingGroup.LOOKAHEAD_KEY, this.lookaheadValues.findIndex(e => e.equals(lookaheadDefault)), isSyncable, false, isPersistent);
        this.addSetting(this._showSetting);
        this.addSetting(this._lookaheadSetting);
    }

    update() {
        let show = this._showSetting.getValue();
        let lookahead = this.lookaheadValues[this._lookaheadSetting.getValue()];

        this.model.trackVector.show = show;
        this.model.trackVector.lookahead = lookahead;
    }
}
WT_MapTrackVectorSettingGroup.SHOW_KEY = "WT_Map_TrackVector_Show";
WT_MapTrackVectorSettingGroup.LOOKAHEAD_KEY = "WT_Map_TrackVector_Lookahead";
WT_MapTrackVectorSettingGroup.LOOKAHEAD_DEFAULT = WT_Unit.SECOND.createNumber(60);
WT_MapTrackVectorSettingGroup.LOOKAHEAD_VALUES_DEFAULT = [
    WT_Unit.SECOND.createNumber(30),
    WT_Unit.SECOND.createNumber(60),
    WT_Unit.SECOND.createNumber(120),
    WT_Unit.SECOND.createNumber(300),
    WT_Unit.SECOND.createNumber(600),
    WT_Unit.SECOND.createNumber(1200)
];