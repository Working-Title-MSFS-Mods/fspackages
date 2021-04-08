class WT_CustomElementSelector {
    /**
     * Waits until a custom element has been defined and then returns it. If the query selector does not match any
     * element, the Promise returned by this method will resolve with a value of undefined instead.
     * @param {Element} root - the root element from which to start searching for the element.
     * @param {String} query - the query selector string to use to select the element.
     * @param {*} [enforceType] - an optional class type to enforce on the selected element.
     * @returns {Promise<Element>} - a Promise to return the selected element.
     */
    static async select(root, query, type) {
        let element = root.querySelector(query);
        if (!element) {
            return undefined;
        }

        await customElements.whenDefined(element.localName);
        if (type !== undefined) {
            await WT_Wait.awaitCallback(() => {
                let element = root.querySelector(query);
                return element instanceof type;
            });
        }
        return root.querySelector(query);
    }
}