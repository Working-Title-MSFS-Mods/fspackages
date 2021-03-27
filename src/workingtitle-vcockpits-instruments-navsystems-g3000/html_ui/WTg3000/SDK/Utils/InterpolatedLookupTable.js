/**
 * An N-dimensional lookup table. The table supports lookup of numbers using ordered N-tuples of numbers as keys.
 * Lookups for keys that do not lie exactly on a breakpoint return values which are linearly interpolated from
 * surrounding breakpoints.
 */
class WT_InterpolatedLookupTable {
    /**
     * @param {Number[][]} breakpoints - an array of breakpoints of the new lookup table. Each breakpoint should be
     *                                   expressed as a number array, where the first N elements represent the
     *                                   breakpoint key, and the last element represents the breakpoint value.
     */
    constructor(breakpoints) {
        this._dimensionKeyComparator = (query, element) => query - element.key;
        this._init(breakpoints);
    }

    /**
     * @readonly
     * @type {Number}
     */
    get dimensionCount() {
        return this._dimensionCount;
    }

    _createDimensionArray() {
        return new WT_SortedArray((a, b) => a.key - b.key);
    }

    /**
     *
     * @param {WT_SortedArray} array
     * @param {Number[][]} breakpoint
     * @param {Number} dimensionCount
     * @param {Number} dimension
     */
    _insertInTableHelper(array, breakpoint, dimensionCount, dimension) {
        let dimensionKey = breakpoint[dimension];

        if (dimension === dimensionCount - 1) {
            let value = array.match(dimensionKey, this._dimensionKeyComparator);
            if (!value) {
                value = {key: dimensionKey, value: breakpoint[breakpoint.length - 1]};
                array.insert(value);
            }
        } else {
            let next = array.match(dimensionKey, this._dimensionKeyComparator);
            if (!next) {
                array.insert(next = {key: dimensionKey, array: this._createDimensionArray()});
            }
            this._insertInTableHelper(next.array, breakpoint, dimensionCount, dimension + 1);
        }
    }

    _insertInTable(table, entry, dimensionCount) {
        this._insertInTableHelper(table, entry, dimensionCount, 0);
    }

    /**
     *
     * @param {Number[][]} breakpoints
     * @param {Number} dimensionCount
     */
    _createTable(breakpoints, dimensionCount) {
        let table = this._createDimensionArray();
        breakpoints.forEach(breakpoint => {
            this._insertInTable(table, breakpoint, dimensionCount);
        }, this);
        return table;
    }

    /**
     *
     * @param {Number[][]} breakpoints
     */
    _init(breakpoints) {
        let leastDimension = breakpoints.reduce((accum, current) => (current.length < accum.length) ? current : accum);
        let dimensionCount = Math.max(0, leastDimension ? (leastDimension.length - 1) : 0);
        if (dimensionCount === 0) {
            this._dimensionCount = Infinity;
            return;
        }

        /**
         * @type {WT_SortedArray}
         */
        this._table = this._createTable(breakpoints, dimensionCount);
        this._dimensionCount = dimensionCount;
    }

    _interpolate(startKey, endKey, startValue, endValue, key) {
        let window = endKey - startKey;
        if (window > 0) {
            let fraction = (key - startKey) / window;
            return fraction * (endValue - startValue) + startValue;
        } else {
            return startValue;
        }
    }

    /**
     *
     * @param {Number[]} key
     * @param {Number} dimension
     * @param {WT_SortedArray} lookupArray
     */
    _lookupHelper(key, dimension, lookupArray) {
        let dimensionKey = key[dimension];
        let index = lookupArray.matchIndex(dimensionKey, this._dimensionKeyComparator);
        let start;
        let end;
        if (index >= 0) {
            start = lookupArray.get(index);
            end = start;
        } else {
            start = lookupArray.get(-index - 2);
            end = lookupArray.get(-index - 1);
            if (!start) {
                start = end;
            }
            if (!end) {
                end = start;
            }
        }

        let startValue;
        let endValue;
        if (dimension === this.dimensionCount - 1) {
            startValue = start.value;
            endValue = end.value;
        } else {
            startValue = this._lookupHelper(key, dimension + 1, start.array);
            endValue = this._lookupHelper(key, dimension + 1, end.array);
        }

        if (startValue === endValue) {
            return startValue;
        }

        return this._interpolate(start.key, end.key, startValue, endValue, dimensionKey);
    }

    _lookup(key) {
        return this._lookupHelper(key, 0, this._table);
    }

    /**
     * Looks up a value in this table using a specified key. The returned value will be linearly interpolated from
     * surrounding breakpoints if the key is not an exact match for any of the table's breakpoints.
     * @param {Number[]} key - an array representing an ordered N-tuple of numbers to use as the key for the lookup.
     * @returns {Number} a number value corresponding to the supplied key.
     */
    get(key) {
        if (key.length < this.dimensionCount) {
            return undefined;
        }

        return this._lookup(key);
    }
}