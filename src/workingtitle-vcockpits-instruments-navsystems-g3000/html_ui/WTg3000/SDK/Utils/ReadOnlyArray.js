/**
 * A wrapper for an Array that provides a read-only interface.
 * @template T
 */
class WT_ReadOnlyArray {
    /**
     * @param {T[]} array - the array to wrap.
     */
    constructor(array) {
        this._array = array;
    }

    /**
     * The length of this array.
     * @readonly
     * @type {Number}
     */
    get length() {
        return this._array.length;
    }

    /**
     * Retrieves an element from this array.
     * @param {Number} index - the index of the element to retrieve.
     * @returns {T} the element at the specified index, or undefined if the index is out of bounds.
     */
    get(index) {
        return this._array[index];
    }

    /**
     * Returns the index of the first occurrence of a value in this array.
     * @param {T} element - the value to locate in the array.
     * @param {Number} [fromIndex] - the array index at which to begin the search. If fromIndex is omitted, the search
     *                               starts at index 0.
     * @returns {Number} the index of the first occurrence of a value in this array, or -1 if it is not present.
     */
    indexOf(element, fromIndex = 0) {
        return this._array.indexOf(element, fromIndex);
    }

    /**
     * Returns a copy of a section of this array. For both start and end, a negative index can be used to indicate an
     * offset from the end of the array. For example, -2 refers to the second to last element of the array.
     * @param {Number} [start] - the beginning index of the specified portion of the array. If start is undefined,
     *                           then the slice begins at index 0.
     * @param {Number} [end] - the end index of the specified portion of the array. This is exclusive of the element
     *                         at the index 'end'. If end is undefined, then the slice extends to the end of the array.
     * @returns {T[]} a copy of a section of this array.
     */
    slice(start, end) {
        return this._array.slice(start, end);
    }

    /**
     * Finds the index of the first element in this array where predicate is true.
     * @param {(value: T, index: number, obj: T[]) => Boolean} predicate - this function is called once for each element of the array,
     *                                                                     in ascending order, until it returns true.
     * @param {Object} [thisArg] - if provided, it will be used as the this value for each invocation of predicate. If
     *                             it is not provided, undefined is used instead.
     * @returns {Number} the index of the first element in this array where predicate is true, or -1 if no such element
     *                   was found.
     */
    findIndex(predicate, thisArg) {
        return this._array.findIndex(predicate, thisArg);
    }

    /**
     * Gets the first element in this array where predicate is true.
     * @param {(value: T, index: number, obj: T[]) => Boolean} predicate - this function is called once for each element of the array,
     *                                                                     in ascending order, until it returns true.
     * @param {Object} [thisArg] - if provided, it will be used as the this value for each invocation of predicate. If
     *                             it is not provided, undefined is used instead.
     * @returns {T} the first element in this array where predicate is true, or undefined if no such element was found.
     */
    find(predicate, thisArg) {
        return this._array.find(predicate, thisArg);
    }

    /**
     * Performs the specified action for each element in this array.
     * @param {(value:T, index:Number, array:T[]) => void} callback - this function is called once for each element
     *                                                                of the array.
     * @param {Object} [thisArg] - if provided, it will be used as the this value for each invocation of callback. If
     *                             it is not provided, undefined is used instead.
     */
    forEach(callback, thisArg) {
        this._array.forEach(callback, thisArg);
    }

    /**
     *
     * @param {(previousValue: T, currentValue: T, currentIndex: number, array: T[]) => *} callback
     * @param {*} [initialValue]
     */
    reduce(callback, initialValue) {
        if (initialValue === undefined) {
            return this._array.reduce(callback);
        } else {
            return this._array.reduce(callback, initialValue);
        }
    }

    /**
     * Determines whether the specified predicate function returns true for any element of this array.
     * @param {(value: T, index: number, array: T[]) => Boolean} predicate - this function is called once for each element of the array,
     *                                                                       in ascending order, until it returns true.
     * @param {Object} [thisArg] - if provided, it will be used as the this value for each invocation of predicate. If
     *                             it is not provided, undefined is used instead.
     * @returns {Boolean} whether at least one element of this array satisfies the predicate.
     */
    some(predicate, thisArg) {
        return this._array.some(predicate, thisArg);
    }

    /**
     * Determines whether every element of this array satisfies the specified predicate.
     * @param {(value: T, index: number, array: T[]) => Boolean} predicate - this function is called once for each element of the array,
     *                                                                       in ascending order, until it returns false.
     * @param {Object} [thisArg] - if provided, it will be used as the this value for each invocation of predicate. If
     *                             it is not provided, undefined is used instead.
     * @returns {Boolean} whether every element of this array satisfies the predicate.
     */
    every(predicate, thisArg) {
        return this._array.every(predicate, thisArg);
    }

    /**
     * Calls a defined callback function on each element of this array, and returns an array that contains the results.
     * @param {(value: T, index: number, array: T[]) => *} callback - this function is called once for each element
     *                                                                of the array.
     * @param {Object} [thisArg] - if provided, it will be used as the this value for each invocation of callback. If
     *                             it is not provided, undefined is used instead.
     * @returns {*[]} an array of the returned values of the callback function, in the same order as they were
     *                returned.
     */
    map(callback, thisArg) {
        return this._array.map(callback, thisArg);
    }

    /**
     * Gets the elements of this array that meet the condition specified by predicate.
     * @param {(value: T, index: number, array: T[]) => Boolean} predicate - this function is called once for each element
     *                                                                       of the array.
     * @param {Object} [thisArg] - if provided, it will be used as the this value for each invocation of predicate. If
     *                             it is not provided, undefined is used instead.
     * @returns {T[]} an array of the elements in this array for which predicate returned true, in the same order as they
     *                were evaluated.
     */
    filter(predicate, thisArg) {
        return this._array.filter(predicate, thisArg);
    }

    /**
     * @returns {Iterator<T>}
     */
     [Symbol.iterator]() {
        return this._array.values();
    }
}