/**
 * Wrapper for Element which locally caches innerHTML and attributes. Calls to set innerHTML and attributes
 * through the wrapper only change the wrapped HTMLElement if the new values are different from the current
 * values. All changes to innerHTML and attributes must be made through the wrapper in order to guarantee correct
 * behavior.
 */
class WT_CachedElement {
    /**
     * @param {Element} element - the DOM element to be wrapped by the new wrapper.
     */
    constructor(element) {
        this._element = element;
        this._cachedHTML = element.innerHTML;
        this._cachedText = element.textContent;
        this._attributes = new Map();
    }

    /**
     * The DOM element wrapped by this wrapper.
     * @readonly
     * @type {Element}
     */
    get element() {
        return this._element;
    }

    /**
     * The innerHTML string of the DOM element wrapped by this wrapper.
     * @type {String}
     */
    get innerHTML() {
        return this._cachedHTML;
    }

    set innerHTML(html) {
        if (this._cachedHTML === html) {
            return;
        }

        this._cachedHTML = html;
        this.element.innerHTML = html;
    }

    /**
     * The text content of the DOM element wrapped by this wrapper.
     * @type {String}
     */
    get textContent() {
        return this._cachedText;
    }

    set textContent(text) {
        if (text === this._cachedText) {
            return;
        }

        this._cachedText = text;
        this.element.textContent = text;
    }

    /**
     * Gets the value of an attribute of the DOM element wrapped by this wrapper.
     * @param {String} name - the name of the attribute.
     * @returns {String} the value of the attribute.
     */
    getAttribute(name) {
        let value;
        if (!this._attributes.has(name)) {
            value = this.element.getAttribute(name);
            this._attributes.set(name, value);
        } else {
            value = this._attributes.get(name);
        }
        return value;
    }

    /**
     * Sets the value of an attribute of the DOM element wrapped by this wrapper.
     * @param {String} name - the name of the attribute.
     * @param {String} value - the new value of the attribute.
     */
    setAttribute(name, value) {
        this._attributes.set(name, value);
        this.element.setAttribute(name, value);
    }
}