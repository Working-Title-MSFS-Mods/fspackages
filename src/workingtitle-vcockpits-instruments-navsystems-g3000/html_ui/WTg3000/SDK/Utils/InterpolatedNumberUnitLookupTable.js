/**
 * An N-dimensional lookup table. The table supports lookup of WT_NumberUnit objects using ordered N-tuples of numbers
 * as keys. Lookups for keys that do not lie exactly on a breakpoint return values which are linearly interpolated from
 * surrounding breakpoints.
 */
class WT_InterpolatedNumberUnitLookupTable {
    /**
     * @param {Array[]} breakpoints - an array of breakpoints of the new lookup table. Each breakpoint should be
     *                                expressed as an array, where the first N elements represent the breakpoint
     *                                key, and the last element represents the breakpoint value. Breakpoint values
     *                                may be expressed as either WT_NumberUnit objects or numbers. If the latter,
     *                                the optional unit argument must be specified.
     * @param {WT_Unit} [unit] - the unit type in which the breakpoint values contained in the breakpoints argument
     *                           are expressed.
     */
    constructor(breakpoints, unit) {
        if (unit) {
            this._unit = unit;
        } else {
            this._unit = this._getUnit(breakpoints[0]);
            if (!this._unit) {
                breakpoints = [];
            } else {
                breakpoints = this._convertBreakpointsToNumber(breakpoints, this._unit);
            }
        }

        this._lookupTable = new WT_InterpolatedLookupTable(breakpoints);
    }

    _getUnit(breakpoint) {
        if (!breakpoint) {
            return null;
        }

        let value = breakpoint[breakpoint.length - 1];
        return (value instanceof WT_NumberUnit) ? value.unit : null;
    }

    _convertBreakpointsToNumber(breakpoints, unit) {
        return breakpoints.map(breakpoint => {
            let breakpointNumber = breakpoint.slice(0, breakpoint.length - 1);
            breakpointNumber.push(breakpoint[breakpoint.length - 1].asUnit(unit));
            return breakpointNumber;
        });
    }

    /**
     * Looks up a value in this table using a specified key. The returned value will be linearly interpolated from
     * surrounding breakpoints if the key is not an exact match for any of the table's breakpoints.
     * @param {Number[]} key - an array representing an ordered N-tuple of numbers to use as the key for the lookup.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *                                      new WT_NumberUnit object will be created.
     * @returns {WT_NumberUnit} a value corresponding to the supplied key.
     */
    get(key, reference) {
        let value = this._lookupTable.get(key);
        if (value === undefined) {
            return;
        }

        return reference ? reference.set(value, this._unit) : this._unit.createNumber(value);
    }
}