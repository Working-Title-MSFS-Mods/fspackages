class AS1000_Map_Model extends AS1000_Model {
    constructor(mapElement) {
        super();
        this.mapElement = mapElement;
    }
}

class AS1000_Map_View extends AS1000_HTML_View {
    /**
     * @param {AS1000_Map_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.appendChild(this.model.mapElement);
    }
    connectedCallback() {
        super.connectedCallback();
    }
    enter(inputStack) {
        return false;
    }
}
customElements.define("g1000-map-page", AS1000_Map_View);