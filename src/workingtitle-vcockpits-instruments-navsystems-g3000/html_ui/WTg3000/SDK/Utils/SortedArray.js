/**
 *
 * @template T
 */
class WT_SortedArray {
    constructor(comparator, iterable, equals) {
        this._array = iterable ? [...iterable] : [];
        this._comparator = comparator;
        this._equals = equals ? equals : (a, b) => a === b;
        this._array.sort(comparator);
    }

    /**
     * @readonly
     * @property {Array<T>} array
     * @type {Array<T>}
     */
    get array() {
        return this._array;
    }

    /**
     * @readonly
     * @property {Function} keyFunc
     * @type {Function}
     */
    get comparator() {
        return this._comparator;
    }

    /**
     * @readonly
     * @property {Function} equals
     * @type {Function}
     */
    get equals() {
        return this._equals;
    }

    _findIndex(element, first = true) {
        let min = 0;
        let max = this.array.length;
        let index = Math.floor((min + max) / 2);

        while (min < max) {
            let compare = this._comparator(element, this.array[index]);
            if (compare < 0) {
                max = index;
            } else if (compare > 0) {
                min = index + 1;
            } else {
                break;
            }
            index = Math.floor((min + max) / 2);
        }
        let delta = first ? -1 : 1;
        while (index + delta < this.array.length && this._comparator(element, this.array[index + delta]) === 0) {
            index += delta;
        }
        return index;
    }

    _searchEquals(element, first) {
        let index = first;
        while (index >= 0 && index < this.array.length && this._comparator(element, this.array[index]) === 0) {
            if (this._equals(element, this.array[index])) {
                return index;
            }
            index++;
        }
        return -1;
    }

    length() {
        return this.array.length;
    }

    /**
     *
     * @param {Number} index
     * @returns {T}
     */
    get(index) {
        return this.array[index];
    }

    /**
     *
     * @returns {T}
     */
    first() {
        return this.array[0];
    }

    /**
     *
     * @returns {T}
     */
    last() {
        return this.array[this.array.length - 1];
    }

    /**
     *
     * @param {T} element
     * @returns {Boolean}
     */
    has(element) {
        return this._searchEquals(this._findIndex(element)) >= 0;
    }

    /**
     *
     * @param {T} element
     * @returns {Number}
     */
    insert(element) {
        let index = this._findIndex(element, false);
        this.array.splice(index, 0, element);
        return index;
    }

    /**
     *
     * @param {T} element
     * @returns {Number}
     */
    remove(element) {
        let index = this._searchEquals(this._findIndex(element));
        if (index >= 0) {
            this.array.splice(index, 1);
        }
        return index;
    }

    /**
     *
     * @param {T} element
     * @returns {Number}
     */
    indexOf(element) {
        return this._searchEquals(element, this._findIndex(element));
    }

    clear() {
        this._array = [];
    }

    /**
     *
     * @returns {IterableIterator<T>}
     */
    values() {
        return this.array.values();
    }

    [Symbol.iterator]() {
        return this.array.values();
    }
}