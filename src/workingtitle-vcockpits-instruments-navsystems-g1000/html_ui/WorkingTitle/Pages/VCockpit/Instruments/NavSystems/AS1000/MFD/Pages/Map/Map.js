class WT_Map_Model extends WT_Model {
    constructor(mapElement) {
        super();
        this.mapElement = mapElement;
    }
}

class WT_Map_View extends WT_HTML_View {
    /**
     * @param {WT_Map_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.appendChild(this.model.mapElement);
        if (this.model.mapElement.isInit())
            this.model.mapElement.centerOnPlane();
    }
    connectedCallback() {
        super.connectedCallback();
    }
    enter(inputStack) {
        return false;
    }
}
customElements.define("g1000-map-page", WT_Map_View);