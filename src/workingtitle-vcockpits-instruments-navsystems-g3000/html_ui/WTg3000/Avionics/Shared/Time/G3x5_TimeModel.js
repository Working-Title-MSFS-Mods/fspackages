class WT_G3x5_TimeModel {
    /**
     * @param {WT_TimeModel} timeModel
     * @param {WT_G3x5_TimeFormatSetting} formatSetting
     * @param {WT_G3x5_TimeLocalOffsetSetting} offsetSetting
     */
    constructor(timeModel, formatSetting, offsetSetting) {
        this._timeModel = timeModel;
        this._formatSetting = formatSetting;
        this._offsetSetting = offsetSetting;

        this._format = null;
        this._offset = WT_Unit.SECOND.createNumber(0);

        this._timeModel.setTimezone("etc/UTC");
        this._initSettingListeners();
    }

    _initSettingListeners() {
        this._formatSetting.addListener(this._onFormatSettingChanged.bind(this));
        this._offsetSetting.addListener(this._onOffsetSettingChanged.bind(this));
        this._updateFormat();
        this._updateOffset();
    }

    _updateFormat() {
        this._format = this._formatSetting.getValue();
    }

    _updateOffset() {
        this._offsetSetting.getOffset(this._offset);
    }

    _onFormatSettingChanged(setting, newValue, oldValue) {
        this._updateFormat();
    }

    _onOffsetSettingChanged(setting, newValue, oldValue) {
        this._updateOffset();
    }

    /**
     * Gets the current time of this model.
     * @param {Boolean} [copy] - whether to return the value as a copy of the WT_Time object maintained in this
     *                           model. If false, a readonly version of this model's WT_Time object will be
     *                           returned instead. The readonly version will automatically update to reflect any
     *                           subsequent changes made to this model via setTime(). False by default.
     * @returns {WT_TimeObject} the current time of this model.
     */
    getTime(copy = false) {
        return this._timeModel.getTime(copy);
    }

    /**
     * Sets the time of this model.
     * @param {WT_TimeObject|Number} time - the new time, expressed as either a time object or a UNIX timestamp.
     */
    setTime(time) {
        this._timeModel.setTime(time);
    }

    /**
     * Gets the time format of this model.
     * @returns {WT_G3x5_TimeFormatSetting.Mode} the time format of this model.
     */
    getFormat() {
        return this._format;
    }

    /**
     * Gets the local time offset of this model.
     * @param {Boolean} [copy] - whether to return the offset as a copy of the WT_NumberUnit object maintained in this
     *                           model. If false, a readonly version of this model's WT_NumberUnit object will be
     *                           returned instead. The readonly version will automatically update to reflect any
     *                           subsequent changes made to this model. False by default.
     * @returns {WT_NumberUnit|WT_NumberUnitReadOnly} the local time offset of this model.
     */
    getLocalOffset(copy = false) {
        return copy ? this._offset.copy() : this._offset.readonly();
    }
}