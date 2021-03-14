class WT_G3x5_Minimums {
    /**
     * Gets the set minimums mode.
     * @returns {WT_Minimums.Mode} the currently set mode.
     */
    getMode() {
        return SimVar.GetSimVarValue("L:AS3000_MinimalsMode", "number");
    }

    /**
     * Sets the minimums mode.
     * @param {WT_Minimums.Mode} mode - the new mode.
     */
    setMode(mode) {
        SimVar.SetSimVarValue("L:AS3000_MinimalsMode", "number", mode);
    }

    /**
     * Gets the minimums altitude.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied,
     *                                      a new WT_NumberUnit object will be created with units of feet.
     * @returns {WT_NumberUnit} the currently set altitude.
     */
    getAltitude(reference) {
        let value = SimVar.GetSimVarValue("L:AS3000_MinimalsValue", "number");
        return reference ? reference.set(value, WT_Unit.FOOT) : WT_Unit.FOOT.createNumber(value);
    }

    /**
     * Sets the minimums altitude.
     * @param {WT_NumberUnit} altitude - the new altitude.
     */
    setAltitude(altitude) {
        SimVar.SetSimVarValue("L:AS3000_MinimalsValue", "number", altitude.asUnit(WT_Unit.FOOT));
    }
}
/**
 * @enum {Number}
 */
 WT_G3x5_Minimums.Mode = {
    NONE: 0,
    BARO: 1,
    TEMP_COMPENSATED: 2,
    RADAR: 3
};