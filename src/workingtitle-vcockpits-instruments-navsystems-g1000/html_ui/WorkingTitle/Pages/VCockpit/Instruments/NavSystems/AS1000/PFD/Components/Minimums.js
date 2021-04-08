class WT_Minimums_Model {
    /**
     * @param {WT_Minimums} minimums 
     */
    constructor(minimums) {
        this.minimums = minimums;
        this.show = new Subject();
        this.source = new Subject();
        this.altitude = new Subject();
        this.state = new Subject();

        this.minimums.mode.subscribe(mode => this.show.value = mode != 0);
        this.minimums.source.subscribe(source => this.source.value = source);
        this.minimums.value.subscribe(altitude => this.altitude.value = `${altitude}FT`);
        this.minimums.state.subscribe(state => this.state.value = state);
    }
}

class WT_Minimums_View extends WT_HTML_View {
    /**
     * @param {WT_Minimums_Model} model 
     */
    setModel(model) {
        model.show.subscribe(show => this.setAttribute("state", show ? "Active" : "Inactive"));
        model.source.subscribe(source => this.elements.source.textContent = source);
        model.altitude.subscribe(value => this.elements.value.textContent = value);
        model.state.subscribe(value => this.elements.value.setAttribute("state", value));
    }
}
customElements.define("g1000-minimums", WT_Minimums_View);