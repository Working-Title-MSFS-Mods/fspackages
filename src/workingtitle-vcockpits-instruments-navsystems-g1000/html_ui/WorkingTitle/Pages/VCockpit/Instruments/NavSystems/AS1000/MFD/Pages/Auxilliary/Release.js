class WT_Release_Page_Model {
    constructor(release) {
        this.release = release;
    }
}

class WT_Release_Page_View extends WT_HTML_View {
    constructor() {
        super();
        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this), false);
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        let template = document.getElementById('release-page-template');
        this.appendChild(template.content.cloneNode(true));

        super.connectedCallback();

        this.elements.selectedChangelogScrollable.addEventListener("focus", e => e.target.parentNode.setAttribute("highlighted", ""));
        this.elements.selectedChangelogScrollable.addEventListener("blur", e => e.target.parentNode.removeAttribute("highlighted"));
    }
    /**
     * @param {WT_Release_Page_Model} model 
     */
    setModel(model) {
        this.elements.body.innerHTML = marked(model.release.body);

        this.elements.releaseButton.setAttribute("href", model.release.url);
        this.elements.downloadButton.setAttribute("href", model.release.download_url);
    }
    enter(inputStack) {
        this.inputHandle = inputStack.push(this.inputLayer);
    }
    exit() {
        if (this.inputHandle) {
            this.inputHandle = this.inputHandle.pop();
        }
    }
}
customElements.define("g1000-release-page", WT_Release_Page_View);