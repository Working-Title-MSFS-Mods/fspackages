class WT_StyleInjector {
    /**
     * Injects css style into the document.
     * @param {String} css - a string containing css style code.
     */
    static inject(css) {
        let style = document.createElement("style");
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }
}