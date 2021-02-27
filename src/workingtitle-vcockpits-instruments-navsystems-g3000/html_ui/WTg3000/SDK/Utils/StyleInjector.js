class WT_StyleInjector {
    static inject(css) {
        let style = document.createElement("style");
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }
}