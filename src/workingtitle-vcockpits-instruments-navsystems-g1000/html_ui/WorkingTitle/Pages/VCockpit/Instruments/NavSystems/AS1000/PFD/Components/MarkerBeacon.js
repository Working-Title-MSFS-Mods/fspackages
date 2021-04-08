class WT_Marker_Beacon_Model {
    constructor() {
        this.state = new Subject("Inactive");
        this.text = new Subject("");
    }
    update(dt) {
        const state = SimVar.GetSimVarValue("MARKER BEACON STATE", "number");
        switch (state) {
            case 0:
                this.state.value = "Inactive";
                break;
            case 1:
                this.state.value = "O";
                this.text.value = "O";
                break;
            case 2:
                this.state.value = "M";
                this.text.value = "M";
                break;
            case 3:
                this.state.value = "I";
                this.text.value = "I";
                break;
        }
    }
}

class WT_Marker_Beacon_View extends WT_HTML_View {
    /**
     * @param {WT_Marker_Beacon_Model} model 
     */
    setModel(model) {
        model.state.subscribe(state => this.setAttribute("state", state));
        model.text.subscribe(text => this.textContent = text);
    }
}
customElements.define("g1000-marker-beacon", WT_Marker_Beacon_View)