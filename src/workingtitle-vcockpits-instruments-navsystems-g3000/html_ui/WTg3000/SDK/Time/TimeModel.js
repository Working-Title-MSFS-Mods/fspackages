class WT_TimeModel {
    /**
     * @param {String} format
     * @param {String} [iana]
     * @param {Number} [time]
     */
    constructor(format, iana, time) {
        this._time = new WT_Time(time);
        this._timezone = new WT_Timezone(iana);
        this._format = format;
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
        return copy ? this._time.copy() : this._time.readonly();
    }

    /**
     * Sets the time of this model.
     * @param {WT_TimeObject|Number} time - the new time, expressed as either a time object or a UNIX timestamp.
     */
    setTime(time) {
        this._time.set(time);
    }

    getTimezone() {
        return this._timezone.readonly();
    }

    setTimezone(iana) {
        this._timezone.set(iana);
    }

    getFormat() {
        return this._format;
    }

    setFormat(format) {
        this._format = format;
    }
}

class WT_TimeModelAutoUpdated extends WT_TimeModel {
    /**
     * @param {String} format
     * @param {{updateTime(time:WT_Time)}} timeUpdater
     * @param {String} [iana]
     */
    constructor(format, timeUpdater, iana) {
        super(format, iana);

        this._time = new WT_Time();
        this._timezone = new WT_Timezone(iana);
        this._format = format;

        this._timeUpdater = timeUpdater;
    }

    _updateTime() {
        this._timeUpdater.updateTime(this._time);
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
        this._updateTime();
        return super.getTime(copy);
    }

    /**
     * This method has no effect. The time of this model is automatically updated with every call to
     * getTime().
     */
    setTime() {
    }
}