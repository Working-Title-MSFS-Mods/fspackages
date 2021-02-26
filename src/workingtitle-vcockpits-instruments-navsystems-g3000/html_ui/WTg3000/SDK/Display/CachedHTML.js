/**
 * Wrapper for HTMLElement which locally caches innerHTML and attributes. Calls to set innerHTML and attributes
 * through the wrapper only change the wrapped HTMLElement if the new values are different from the current
 * values. All changes to innerHTML and attributes must be made through the wrapper in order to guarantee correct
 * behavior.
 */
class WT_CachedHTML {
    /**
     * @param {HTMLElement} htmlElement - the HTML element to be wrapped by the new wrapper.
     */
    constructor(htmlElement) {
        this._htmlElement = htmlElement;
        this._cachedHTML = htmlElement.innerHTML;
        this._attributes = new Map();
    }

    /**
     * @readonly
     * @property {HTMLElement} htmlElement - the HTML element wrapped by this wrapper.
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @property {String} innerHTML - the innerHTML string of the HTML element wrapped by this wrapper.
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
        this.htmlElement.innerHTML = html;
    }

    /**
     * Gets the value of an attribute of the HTML element wrapped by this wrapper.
     * @param {String} name - the name of the attribute.
     * @returns {String} the value of the attribute.
     */
    getAttribute(name) {
        let value;
        if (!this._attributes.has(name)) {
            value = this.htmlElement.getAttribute(name);
            this._attributes.set(name, value);
        } else {
            value = this._attributes.get(name);
        }
        return value;
    }

    /**
     * Sets the value of an attribute of the HTML element wrapped by this wrapper.
     * @param {String} name - the name of the attribute.
     * @param {String} value - the new value of the attribute.
     */
    setAttribute(name, value) {
        this._attributes.set(name, value);
        this.htmlElement.setAttribute(name, value);
    }
}