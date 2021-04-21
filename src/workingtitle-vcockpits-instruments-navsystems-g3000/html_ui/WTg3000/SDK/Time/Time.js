/**
 * A specific instance in time.
 */
class WT_Time {
    /**
     * @param {WT_TimeObject|Number} time - the new time.
     */
    constructor(time) {
        this._unix = Math.round(WT_Time._toUnixTimeStamp(time));
        this._readonly = new WT_TimeReadOnly(this);
    }

    /**
     * The UNIX timestamp of this time.
     * @readonly
     * @type {Number}
     */
    get unix() {
        return this._unix;
    }

    /**
     * The absolute time value of this time.
     * @readonly
     * @type {Number}
     */
    get absoluteTime() {
        return WT_Time.unixToAbsoluteTime(this.unix);
    }

    static _toUnixTimeStamp(value) {
        if ((value instanceof WT_Time || value instanceof WT_TimeReadOnly)) {
            return value.unix;
        }
        if (typeof value === "number") {
            return value;
        }
        return undefined;
    }

    /**
     * Checks whether this is a valid time.
     * @returns {Boolean} whether this is a valid time.
     */
    isValid() {
        return typeof this.unix === "number" && !isNaN(this.unix);
    }

    /**
     * Sets the instant in time represented by this time object.
     * @param {WT_TimeObject|Number} time - the new time.
     * @returns {WT_Time} this time object, after it has been changed.
     */
    set(time) {
        this._unix = Math.round(WT_Time._toUnixTimeStamp(time));
        return this;
    }

    /**
     * Creates a new time object initialized to the instant in time equal to this time projected forward by a specific
     * amount of time.
     * @param {WT_NumberUnit|WT_NumberUnitReadOnly|Number} value - the amount of time to move forward.
     * @param {WT_Unit} [unit] - the unit type of value. Defaults to milliseconds. This argument is ignored if value is
     *                           a WT_NumberUnit object.
     * @returns {WT_Time} the new time object.
     */
    plus(value, unit) {
        WT_Time._tempMS.set(0);
        let delta = WT_Time._tempMS.set(value, unit);
        return new WT_Time(this.unix + delta.number);
    }

    /**
     * Moves this time forward by a specific amount of time.
     * @param {WT_NumberUnit|WT_NumberUnitReadOnly|Number} value - the amount of time to move forward.
     * @param {WT_Unit} [unit] - the unit type of value. Defaults to milliseconds. This argument is ignored if value is
     *                           a WT_NumberUnit object.
     * @returns {WT_Time} this time object, after it has been changed.
     */
    add(value, unit) {
        WT_Time._tempMS.set(0);
        let delta = WT_Time._tempMS.set(value, unit);
        this.set(this.unix + delta.number);
        return this;
    }

    /**
     * Creates a new time object initialized to the instant in time equal to this time projected backward by a specific
     * amount of time.
     * @param {WT_NumberUnit|WT_NumberUnitReadOnly|Number} value - the amount of time to move backward.
     * @param {WT_Unit} [unit] - the unit type of value. Defaults to milliseconds. This argument is ignored if value is
     *                           a WT_NumberUnit object.
     * @returns {WT_Time} the new time object.
     */
    minus(value, unit) {
        WT_Time._tempMS.set(0);
        let delta = WT_Time._tempMS.set(value, unit);
        return new WT_Time(this.unix - delta.number);
    }

    /**
     * Moves this time backward by a specific amount of time.
     * @param {WT_NumberUnit|WT_NumberUnitReadOnly|Number} value - the amount of time to move backward.
     * @param {WT_Unit} [unit] - the unit type of value. Defaults to milliseconds. This argument is ignored if value is
     *                           a WT_NumberUnit object.
     * @returns {WT_Time} this time object, after it has been changed.
     */
    subtract(value, unit) {
        WT_Time._tempMS.set(0);
        let delta = WT_Time._tempMS.set(value, unit);
        this.set(this.unix - delta.number);
        return this;
    }

    /**
     * Gets the difference in time between this time and another time.
     * @param {WT_TimeObject} other - the other time.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new
     *                                      WT_NumberUnit object will be created with units of milliseconds.
     * @returns {WT_NumberUnit} the difference in time between this time and another time.
     */
    difference(other, reference) {
        if (!(other instanceof WT_Time) && !(other instanceof WT_TimeReadOnly)) {
            return undefined;
        }

        let value = this.unix - other.unix;
        return reference ? reference.set(value, WT_Unit.MILLISECOND) : WT_Unit.MILLISECOND.createNumber(value);
    }

    /**
     * Checks whether this time object is equal to the supplied argument. The argument is considered equal if and only
     * if it is a WT_Time or WT_TimeReadOnly object with an identical UNIX timestamp.
     * @param {*} other - the value against which to check for equality with this time object.
     * @returns {Boolean} whether this time object is equal to the supplied argument.
     */
    equals(other) {
        if (!(other instanceof WT_Time) && !(other instanceof WT_TimeReadOnly)) {
            return false;
        }

        return this.unix === other.unix;
    }

    /**
     * Checks whether this time object is equal to, greater than, or less than the supplied argument. If the argument
     * is not a WT_Time or WT_TimeReadOnly object, this method returns undefined. Time A is considered equal to time B
     * if both have the same UNIX timestamp. Time A is considered greather than time B if time A's UNIX timestamp is
     * greater than time B's timestamp (in other words, if time A occurs after time B).
     * @param {*} other - value to which to compare this time object.
     * @returns {Number} a numeric value of either 0, 1, or -1, indicating that this time is equal to, greater than, or
     * less than the supplied argument, respectively.
     */
    compare(other) {
        if (!(other instanceof WT_Time) && !(other instanceof WT_TimeReadOnly)) {
            return undefined;
        }

        return Math.sign(this.unix - other.unix);
    }

    /**
     * Copies this time object.
     * @returns {WT_Time} a copy of this time object.
     */
    copy() {
        return new WT_Time(this.unix);
    }

    /**
     * Gets a formatted string of this time localized to a specific timezone.
     * @param {WT_TimezoneObject} timezone - the timezone for which to get the formatted string.
     * @param {String} format - a formatting string defining the format of the output.
     * @returns {String} a formatted string of this time.
     */
    format(timezone, format) {
        return spacetime(this.unix).goto(timezone.iana).format(format);
    }

    /**
     * Gets a formatted string of this time localized to a specific timezone using standard UNIX formatting.
     * @param {WT_TimezoneObject} timezone - the timezone for which to get the formatted string.
     * @param {String} format - a UNIX time formatting string defining the format of the output.
     * @returns {String} a formatted string of this time.
     */
    formatUnix(timezone, format) {
        return spacetime(this.unix).goto(timezone.iana).unixFmt(format);
    }

    /**
     * Gets a read-only version of this time object.
     * @returns {WT_TimeReadOnly} a read-only version of this time object.
     */
    readonly() {
        return this._readonly;
    }

    /**
     * Converts an absolute time value as reported by the sim to a UNIX timestamp.
     * @param {Number} absoluteTime - an absolute time value in seconds.
     * @returns {Number} a Unix timestamp.
     */
    static absoluteTimeToUnix(absoluteTime) {
        return (absoluteTime - 621355968000) * 1000;
    }

    /**
     * Converts a UNIX timestamp to an absolute time value as would be reported by the sim.
     * @param {Number} unixTimeStamp - a UNIX timestamp.
     * @returns {Number} an absolute time value in seconds.
     */
    static unixToAbsoluteTime(unixTimeStamp) {
        return unixTimeStamp / 1000 + 621355968000;
    }
}
WT_Time._tempMS = WT_Unit.MILLISECOND.createNumber(0);

/**
 * A read-only interface for a WT_Time object.
 */
class WT_TimeReadOnly {
    /**
     * @param {WT_Time} source
     */
    constructor(source) {
        this._source = source;
    }

    /**
     * The UNIX timestamp of this time.
     * @readonly
     * @type {Number}
     */
    get unix() {
        return this._source.unix;
    }

    /**
     * The absolute time value of this time.
     * @readonly
     * @type {Number}
     */
    get absoluteTime() {
        return this._source.absoluteTime;
    }

    /**
     * Checks whether this is a valid time.
     * @returns {Boolean} whether this is a valid time.
     */
    isValid() {
        return this._source.isValid();
    }

    /**
     * Gets a new WT_Time object initialized with a specific UNIX timestamp.
     * @param {WT_TimeObject|Number} time - the new time.
     * @returns {WT_Time} the new time object.
     */
    set(time) {
        return new WT_Time(time);
    }

    /**
     * Creates a new time object initialized to the instant in time equal to this time projected forward by a specific
     * amount of time.
     * @param {WT_NumberUnit|WT_NumberUnitReadOnly|Number} value - the amount of time to move forward.
     * @param {WT_Unit} [unit] - the unit type of value. Defaults to milliseconds. This argument is ignored if value is
     *                           a WT_NumberUnit object.
     * @returns {WT_Time} the new time object.
     */
    plus(value, unit) {
        return this._source.plus(value, unit);
    }

    /**
     * Creates a new time object initialized to the instant in time equal to this time projected forward by a specific
     * amount of time.
     * @param {WT_NumberUnit|WT_NumberUnitReadOnly|Number} value - the amount of time to move forward.
     * @param {WT_Unit} [unit] - the unit type of value. Defaults to milliseconds. This argument is ignored if value is
     *                           a WT_NumberUnit object.
     * @returns {WT_Time} the new time object.
     */
    add(value, unit) {
        return this._source.plus(value, unit);
    }

    /**
     * Creates a new time object initialized to the instant in time equal to this time projected backward by a specific
     * amount of time.
     * @param {WT_NumberUnit|WT_NumberUnitReadOnly|Number} value - the amount of time to move backward.
     * @param {WT_Unit} [unit] - the unit type of value. Defaults to milliseconds. This argument is ignored if value is
     *                           a WT_NumberUnit object.
     * @returns {WT_Time} the new time object.
     */
    minus(value, unit) {
        return this._source.minus(value, unit);
    }

    /**
     * Creates a new time object initialized to the instant in time equal to this time projected backward by a specific
     * amount of time.
     * @param {WT_NumberUnit|WT_NumberUnitReadOnly|Number} value - the amount of time to move backward.
     * @param {WT_Unit} [unit] - the unit type of value. Defaults to milliseconds. This argument is ignored if value is
     *                           a WT_NumberUnit object.
     * @returns {WT_Time} the new time object.
     */
    subtract(value, unit) {
        return this._source.minus(value, unit);
    }

    /**
     * Gets the difference in time between this time and another time.
     * @param {WT_TimeObject} other - the other time.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new
     *                                      WT_NumberUnit object will be created with units of milliseconds.
     * @returns {WT_NumberUnit} the difference in time between this time and another time.
     */
    difference(other, reference) {
        return this._source.difference(other, reference);
    }

    /**
     * Checks whether this time object is equal to the supplied argument. The argument is considered equal if and only
     * if it is a WT_Time or WT_TimeReadOnly object with an identical UNIX timestamp.
     * @param {*} other - the value against which to check for equality with this time object.
     * @returns {Boolean} whether this time object is equal to the supplied argument.
     */
    equals(other) {
        return this._source.equals(other);
    }

    /**
     * Checks whether this time object is equal to, greater than, or less than the supplied argument. If the argument
     * is not a WT_Time or WT_TimeReadOnly object, this method returns undefined. Time A is considered equal to time B
     * if both have the same UNIX timestamp. Time A is considered greather than time B if time A's UNIX timestamp is
     * greater than time B's timestamp (in other words, if time A occurs after time B).
     * @param {*} other - value to which to compare this time object.
     * @returns {Number} a numeric value of either 0, 1, or -1, indicating that this time is equal to, greater than, or
     * less than the supplied argument, respectively.
     */
    compare(other) {
        return this._source.compare(other);
    }

    /**
     * Copies this time object.
     * @returns {WT_Time} a copy of this time object.
     */
    copy() {
        return new WT_Time(this.unix);
    }

    /**
     * Gets a formatted string of this time localized to a specific timezone.
     * @param {WT_TimezoneObject} timezone - the timezone for which to get the formatted string.
     * @param {String} format - a formatting string defining the format of the output.
     * @returns {String} a formatted string of this time.
     */
    format(timezone, format) {
        return this._source.format(timezone, format);
    }

    /**
     * Gets a formatted string of this time localized to a specific timezone using standard UNIX formatting.
     * @param {WT_TimezoneObject} timezone - the timezone for which to get the formatted string.
     * @param {String} format - a UNIX time formatting string defining the format of the output.
     * @returns {String} a formatted string of this time.
     */
    formatUnix(timezone, format) {
        return this._source.formatUnix(timezone, format);
    }

    /**
     * Gets a read-only version of this time object.
     * @returns {WT_TimeReadOnly} a read-only version of this time object.
     */
    readonly() {
        return this;
    }
}

/**
 * @typedef {WT_Time|WT_TimeReadOnly} WT_TimeObject
 */

/**
 * A timezone.
 */
class WT_Timezone {
    /**
     * @param {String} [iana] - the IANA code for the new timezone. Defaults to "etc/UTC" (UTC +0).
     */
    constructor(iana) {
        if (!iana) {
            iana = "etc/UTC";
        }
        this._timezone = WT_Timezone._spacetime.goto(iana).timezone();

        this._readonly = new WT_TimezoneReadOnly(this);
    }

    /**
     * The canonical IANA code of this timezone.
     * @readonly
     * @type {String}
     */
    get iana() {
        return this._timezone.name;
    }

    /**
     * Whether this timezone observes daylight savings time.
     * @readonly
     * @type {Boolean}
     */
    get hasDST() {
        return this._timezone.hasDst;
    }

    /**
     * The offset (in hours) of this timezone with respect to UTC.
     * @readonly
     * @type {Number}
     */
    get offset() {
        return this._timezone.default_offset;
    }

    /**
     * Changes this timezone to another one.
     * @param {String} iana - the IANA code of the new timezone.
     * @returns {WT_Timezone} this timezone object, after it has been changed.
     */
    set(iana) {
        this._timezone = WT_Timezone._spacetime.goto(iana).timezone();
        return this;
    }

    /**
     * Gets the offset (in hours) of this timezone with respect to UTC at a particular time. If a time is not provided,
     * this method will return the default offset of this timezone (the same as that provided by the this.offset
     * property).
     * @param {WT_TimeObject} [time] - a specific time at which to calculate the offset.
     * @returns {Number} the offset of this timezone at the specified time.
     */
    offset(time) {
        if (!time) {
            return this.offset;
        }

        return spacetime(time.unix).goto(this.iana).timezone().current.offset;
    }

    /**
     * Checks whether this timezone is equal to the supplied argument. The argument is considered equal if and only
     * if it is a WT_Timezone or WT_TimezoneReadOnly object with the same canonical IANA code.
     * @param {*} other - the value against which to check for equality with this timezone.
     * @returns {Boolean} whether this timezone is equal to the supplied argument.
     */
    equals(other) {
        if (!(other instanceof WT_Timezone) && !(other instanceof WT_TimezoneReadOnly)) {
            return false;
        }

        return this.iana === other.iana;
    }

    /**
     * Gets a formatted string of a time localized to this timezone.
     * @param {WT_TimeObject} time - the time for which to get the formatted string.
     * @param {String} format - a formatting string defining the format of the output.
     * @returns {String} a formatted string of the specified time.
     */
    format(time, format) {
        return spacetime(time.unix).goto(this.iana).format(format);
    }

    /**
     * Gets a formatted string of a time localized to this timezone using standard UNIX formatting.
     * @param {WT_TimeObject} time - the time for which to get the formatted string.
     * @param {String} format - a UNIX time formatting string defining the format of the output.
     * @returns {String} a formatted string of the specified time.
     */
    formatUnix(time, format) {
        return spacetime(time.unix).goto(this.iana).unixFmt(format);
    }

    /**
     * Gets a read-only version of this timezone.
     * @returns {WT_TimezoneReadOnly} a read-only version of this timezone.
     */
    readonly() {
        return this._readonly;
    }
}
WT_Timezone._spacetime = spacetime();

/**
 * A read-only interface for a WT_Timezone object.
 */
class WT_TimezoneReadOnly {
    /**
     * @param {WT_Timezone} source
     */
    constructor(source) {
        this._source = source;
    }

    /**
     * The canonical IANA code of this timezone.
     * @readonly
     * @type {String}
     */
    get iana() {
        return this._source.iana;
    }

    /**
     * Whether this timezone observes daylight savings time.
     * @readonly
     * @type {Boolean}
     */
    get hasDST() {
        return this._source.hasDST;
    }

    /**
     * The offset (in hours) of this timezone with respect to UTC.
     * @readonly
     * @type {Number}
     */
    get offset() {
        return this._source.offset;
    }

    /**
     * Gets a new WT_Timezone object initialized to a specific timezone.
     * @param {String} iana - the IANA code of the new timezone.
     * @returns {WT_Timezone} the new timezone object.
     */
    set(iana) {
        return new WT_Timezone(iana);
    }

    /**
     * Gets the offset (in hours) of this timezone with respect to UTC at a particular time. If a time is not provided,
     * this method will return the default offset of this timezone (the same as that provided by the this.offset
     * property).
     * @param {WT_TimeObject} [time] - a specific time at which to calculate the offset.
     * @returns {Number} the offset of this timezone at the specified time.
     */
    offset(time) {
        return this._source.offset(time);
    }

    /**
     * Checks whether this timezone is equal to the supplied argument. The argument is considered equal if and only
     * if it is a WT_Timezone or WT_TimezoneReadOnly object with the same canonical IANA code.
     * @param {*} other - the value against which to check for equality with this timezone.
     * @returns {Boolean} whether this timezone is equal to the supplied argument.
     */
    equals(other) {
        return this._source.equals(other);
    }

    /**
     * Gets a formatted string of a time localized to this timezone.
     * @param {WT_TimeObject} time - the time for which to get the formatted string.
     * @param {String} format - a formatting string defining the format of the output.
     * @returns {String} a formatted string of the specified time.
     */
    format(time, format) {
        return this._source.format(time, format);
    }

    /**
     * Gets a formatted string of a time localized to this timezone using standard UNIX formatting.
     * @param {WT_TimeObject} time - the time for which to get the formatted string.
     * @param {String} format - a UNIX time formatting string defining the format of the output.
     * @returns {String} a formatted string of the specified time.
     */
    formatUnix(time, format) {
        return this._source.formatUnix(time, format);
    }

    /**
     * Gets a read-only version of this timezone.
     * @returns {WT_TimezoneReadOnly} a read-only version of this timezone.
     */
    readonly() {
        return this;
    }
}

/**
 * @typedef {WT_Timezone|WT_TimezoneReadOnly} WT_TimezoneObject
 */

/**
 * The UTC +0 timezone.
 */
 WT_Timezone.UTC = new WT_Timezone();