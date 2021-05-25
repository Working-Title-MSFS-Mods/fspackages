class WT_TemplateLoader {
    static load(path) {
        let link = document.createElement("link");
        link.rel = "import";
        link.href = path;
        document.head.appendChild(link);
    }
}