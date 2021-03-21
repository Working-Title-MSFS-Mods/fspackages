/**
 *
 * @template T
 */
class WT_ReadOnlyArray {
    /**
     * @param {T[]} array
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
     *
     * @param {Number} index
     * @returns {T}
     */
    get(index) {
        return this._array[index];
    }

    /**
     *
     * @param {T} element
     * @param {Number} [fromIndex]
     * @returns {Number}
     */
    indexOf(element, fromIndex = 0) {
        return this._array.indexOf(element, fromIndex);
    }

    /**
     *
     * @param {Number} [start]
     * @param {Number} [end]
     * @returns {T[]}
     */
    slice(start, end) {
        return this._array.slice(start, end);
    }

    /**
     *
     * @param {(this: void, value: T, index: number, obj: T[]) => Boolean} predicate
     * @param {Object} [thisArg]
     * @returns {Number}
     */
    findIndex(predicate, thisArg) {
        return this._array.findIndex(predicate, thisArg);
    }

    /**
     *
     * @param {(this: void, value: T, index: number, obj: T[]) => Boolean} predicate
     * @param {Object} [thisArg]
     * @returns {T}
     */
    find(predicate, thisArg) {
        return this._array.find(predicate, thisArg);
    }

    /**
     *
     * @param {(value:T, index:Number, array:T[]) => void} callback
     * @param {Object} [thisArg]
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
     *
     * @param {(value: T, index: number, array: T[]) => *} callback
     * @param {Object} [thisArg]
     * @returns {*[]}
     */
    map(callback, thisArg) {
        return this._array.map(callback, thisArg);
    }

    /**
     *
     * @param {(value: T, index: number, array: T[]) => Boolean} predicate
     * @param {Object} [thisArg]
     * @returns {T[]}
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