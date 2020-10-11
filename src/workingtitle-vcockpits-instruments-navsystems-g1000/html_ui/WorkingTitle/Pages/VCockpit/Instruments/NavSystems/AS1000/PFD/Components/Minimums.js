class WT_Minimums_Model {
    constructor() {
        this.mode = new Subject("off");
        this.altitude = new Subject(null);
    }
    setAltitude(altitude) {

    }
    setMode(mode) {

    }
}

class WT_Minimums_View extends WT_HTML_View {
    /**
     * @param {WT_Minimums_Model} model 
     */
    setModel(model) {
        model.mode.subscribe(mode => this.elements.mode.value = mode);
        model.altitude.subscribe(altitude => this.elements.altitude.value = altitude);
    }
}