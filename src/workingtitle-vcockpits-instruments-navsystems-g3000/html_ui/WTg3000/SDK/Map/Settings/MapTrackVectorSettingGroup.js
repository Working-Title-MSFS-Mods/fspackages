/**
 * A setting that controls the map's track vector overlay.
 */
class WT_MapTrackVectorSettingGroup extends WT_MapSettingGroup {
    /**
     * @param {WT_MapElement} model - the setting model with which to associate the new setting.
     * @param {Boolean} autoUpdate - whether the new setting should automatically call its update() method whenever its value
     *                               changes.
     * @param {WT_NumberUnit[]} [lookaheadValues] - an Iterable of the possible lookahead times (in seconds).
     * @param {number} [lookaheadDefault] - the default lookahead time (in seconds).
     * @param {Boolean} [isSyncable] - whether the track vector settings are sync-able. True by default.
     * @param {Boolean} [isPersistent] - whether the track vector settings persist across sessions. True by default.
     */
    constructor(model, autoUpdate, lookaheadValues = WT_MapTrackVectorSettingGroup.LOOKAHEAD_VALUES_DEFAULT, lookaheadDefault = WT_MapTrackVectorSettingGroup.LOOKAHEAD_DEFAULT, isSyncable = true, isPersistent = true) {
        super(model, [], isSyncable, autoUpdate);

        this.lookaheadValues = lookaheadValues;
        this._showSetting = new WT_MapSetting(model, WT_MapTrackVectorSettingGroup.SHOW_KEY, false, isSyncable, false, isPersistent);
        this._lookaheadSetting = new WT_MapSetting(model, WT_MapTrackVectorSettingGroup.LOOKAHEAD_KEY, this.lookaheadValues.findIndex(e => e.equals(lookaheadDefault)), isSyncable, false, isPersistent);
        this.addSetting(this._showSetting);
        this.addSetting(this._lookaheadSetting);
    }

    /**
     * The setting that controls track vector visibility.
     * @readonly
     * @type {WT_MapSetting}
     */
    get showSetting() {
        return this._showSetting;
    }

    /**
     * The setting that controls the lookahead time of the track vector.
     * @readonly
     * @type {WT_MapSetting}
     */
    get lookaheadSetting() {
        return this._lookaheadSetting;
    }

    update() {
        let show = this._showSetting.getValue();
        let lookahead = this.lookaheadValues[this._lookaheadSetting.getValue()];

        this.mapModel.trackVector.show = show;
        this.mapModel.trackVector.lookahead = lookahead;
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