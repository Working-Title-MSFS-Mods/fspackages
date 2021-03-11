class WT_AviationMath {
    /**
     * Converts indicated airspeed (IAS) to mach.
     * @param {Number} ias - the indicated airspeed to convert, in knots.
     * @param {Number} pressure - the static pressure, in inches of mercury.
     * @returns {Number} the mach equivalent of the indicated airspeed.
     */
    static iasToMach(ias, pressure) {
        return Math.pow(5 * (Math.pow((Math.pow(1 + 0.2 * Math.pow(ias / 661.4786, 2), 3.5) - 1) * 29.9212553 / pressure + 1, 0.2857142857) - 1), 0.5);
    }

    /**
     * Converts a mach number to indicated airspeed (IAS).
     * @param {Number} mach - the mach number to convert.
     * @param {Number} pressure - the static pressure, in inches of mercury.
     * @returns {Number} the indicated airspeed equivalent of the mach number, in knots.
     */
    static machToIAS(mach, pressure) {
        return 661.4786 * Math.pow(5 * (Math.pow(1 + pressure * (Math.pow(1 + Math.pow(mach, 2) / 5, 3.5) - 1) / 29.9212553, 0.2857142857) - 1), 0.5);
    }

    /**
     * Converts a mach number to true airspeed (TAS).
     * @param {Number} mach - the mach number to convert.
     * @param {Number} oat - the true air temperature, in degrees Celsius.
     * @returns {Number} the true airspeed equivalent of the mach number, in knots.
     */
    static machToTAS(mach, oat) {
        return mach * 38.967854 * Math.pow(oat + 273.15, 0.5);
    }

    /**
     * Converts true airspeed (TAS) to mach.
     * @param {Number} tas - the true airspeed to convert, in knots.
     * @param {Number} oat - the true air temperature, in degrees Celsius.
     * @returns {Number} the mach equivalent of the true airspeed.
     */
    static tasToMach(tas, oat) {
        return tas / WT_AviationMath.machToTAS(1, oat);
    }

    /**
     * Converts indicated airspeed (IAS) to true airspeed (TAS).
     * @param {Number} ias - the indicated airspeed to convert, in knots.
     * @param {Number} pressure - the static pressure, in inches of mercury.
     * @param {Number} oat - the true air temperature, in degrees Celsius.
     * @returns {Number} the true airspeed equivalent of the indicated airspeed, in knots.
     */
    static iasToTAS(ias, pressure, oat) {
        return WT_AviationMath.machToTAS(WT_AviationMath.iasToMach(ias, pressure), oat);
    }

    /**
     * Converts true airspeed (TAS) to indicated airspeed (IAS).
     * @param {Number} tas - the indicated airspeed to convert, in knots.
     * @param {Number} pressure - the static pressure, in inches of mercury.
     * @param {Number} oat - the true air temperature, in degrees Celsius.
     * @returns {Number} the indicated airspeed equivalent of the true airspeed, in knots.
     */
    static tasToIAS(tas, pressure, oat) {
        return WT_AviationMath.machToIAS(WT_AviationMath.tasToMach(tas, oat), pressure);
    }
}