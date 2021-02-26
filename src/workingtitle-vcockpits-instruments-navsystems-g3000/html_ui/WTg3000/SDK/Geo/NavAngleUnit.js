class WT_NavAngleUnit extends WT_Unit {
    /**
     * @param {Boolean} isMagnetic
     * @param {{lat:Number, long:Number}} [location]
     */
    constructor(isMagnetic, location) {
        super(isMagnetic ? "degree" : "degree true", isMagnetic ? "degrees" : "degrees true", isMagnetic ? "°" : "°ᵀ");

        this._family = WT_NavAngleUnit.FAMILY;
        this._isMagnetic = isMagnetic;
        this._location = new WT_GeoPoint(0, 0);
        if (location) {
            this._location.set(location);
        }
    }

    /**
     * @readonly
     * @property {Boolean} isMagnetic
     * @type {Boolean}
     */
    get isMagnetic() {
        return this._isMagnetic;
    }

    /**
     * @readonly
     * @property {WT_GeoPointReadOnly} location
     * @type {WT_GeoPointReadOnly}
     */
    get location() {
        return this._location.readonly();
    }

    /**
     * Sets the reference geographic location for this unit. The magnetic variation (declination)
     * at the reference location is used when converting numbers via this unit's convert() method.
     * @param {{lat:Number, long:Number}} location - the reference location.
     */
    setLocation(location) {
        this._location.set(location);
    }

    /**
     * Gets the conversion factor to convert from this unit to another unit.
     * @param {WT_Unit} otherUnit - the other unit to which to convert.
     * @returns {Number} the conversion factor.
     */
    getConversionFactor(otherUnit) {
        return NaN;
    }

    /**
     * Converts a value of this unit to another unit.
     * @param {Number} value - the value to convert.
     * @param {WT_Unit} otherUnit - the unit to which to convert.
     * @returns {Number} the converted value.
     */
    convert(value, otherUnit) {
        if (!(otherUnit instanceof WT_NavAngleUnit)) {
            return;
        }

        if (this.isMagnetic === otherUnit.isMagnetic) {
            return value;
        }

        return this.isMagnetic ? WT_GeoMagnetic.INSTANCE.magneticToTrue(value, this.location) : WT_GeoMagnetic.INSTANCE.trueToMagnetic(value, this.location);
    }

    /**
     * Checks whether this unit is equal to an argument. Returns true if and only if the argument is an instance of
     * WT_NavAngleUnit, and the argument's isMagnetic and location properties match those of this unit.
     * @param {*} other - the comparison.
     * @returns {Boolean} whether this unit is equal to the comparison.
     */
    equals(other) {
        return (other instanceof WT_NavAngleUnit) && this.isMagnetic === other.isMagnetic && this.location.equals(other.location);
    }
}
WT_NavAngleUnit.FAMILY = "nav_angle";