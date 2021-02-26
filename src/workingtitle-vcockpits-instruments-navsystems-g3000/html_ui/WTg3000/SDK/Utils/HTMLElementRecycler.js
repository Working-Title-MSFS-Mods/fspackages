/**
 * A recycler for HTML elements. When an element is requested from the recycler, it will look for any available
 * recycled elements that can be re-used. If none are found, a new element is created. All newly created elements
 * are automatically appended to a specified parent element. When an element retrieved from this recycler is no
 * longer needed, it can be recycled to make it available for re-use in the future.
 * @template T
 */
class WT_HTMLElementRecycler {
    /**
     * @param {HTMLElement} parent - the parent HTML element of the elements maintained by this recycler.
     */
    constructor(parent) {
        this._parent = parent;

        this._elements = [];
        this._head = 0;
    }

    /**
     * @readonly
     * @property {HTMLElement} parent - the parent HTML element of the elements maintained by this recycler.
     * @type {HTMLElement}
     */
    get parent() {
        return this._parent;
    }

    /**
     *
     * @returns {T}
     */
    _createElement() {
        return null;
    }

    /**
     *
     * @param {T} element
     */
    _initElement(element) {
        element.style.display = "block";
    }

    /**
     *
     * @param {T} element
     */
    _cleanupElement(element) {
        element.style.display = "none";
    }

    /**
     * Counts the number of elements maintained by this recycler. Optionally only counts elements currently in use.
     * @param {Boolean} [inUseOnly] - whether to only count elements currently in use.
     * @returns {Number} the requested element count.
     */
    count(inUseOnly = false) {
        return inUseOnly ? this._head : this._elements.length;
    }

    /**
     * Requests an element. If a recycled element is available, it will be returned. Otherwise, a new element will be created
     * and returned.
     * @returns {T} an element.
     */
    request() {
        let element;
        if (this._head < this._elements.length) {
            element = this._elements[this._head];
        } else {
            element = this._createElement();
            this.parent.appendChild(element);
            this._elements.push(element);
        }
        this._head++;
        this._initElement(element);
        return element;
    }

    /**
     * Recycles an element, allowing it to be re-used by future calls to .request().
     * @param {T} element - the element to recycle.
     */
    recycle(element) {
        let index = this._elements.indexOf(element);
        if (index < 0 || index >= this._head) {
            return;
        }

        let lastIndexInUse = this._head - 1;
        this._elements[index] = this._elements[lastIndexInUse];
        this._elements[lastIndexInUse] = element;
        this._head--;
        this._cleanupElement(element);
    }

    /**
     * Recycles all elements currently in use.
     */
    recycleAll() {
        for (let i = 0; i < this._head; i++) {
            this._cleanupElement(this._elements[i]);
        }
        this._head = 0;
    }
}