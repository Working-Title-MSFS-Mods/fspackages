class WT_Radio_Altimeter_Model {
    /**
     * @param {WT_Radio_Altimeter} radioAltimeter 
     */
    constructor(radioAltimeter) {
        this.radioAltimeter = radioAltimeter;
        this.isAvailable = new Subject(false);
        this.altitude = new Subject(0);
    }
    update(dt) {
        this.isAvailable.value = this.radioAltimeter.isAvailable && this.radioAltimeter.isHeightAcceptable();
        if (this.isAvailable.value) {
            this.altitude.value = this.radioAltimeter.getAltitude();
        }
    }
}

class WT_Radio_Altimeter_View extends WT_HTML_View {
    /**
     * @param {WT_Radio_Altimeter_Model} model 
     */
    setModel(model) {
        model.isAvailable.subscribe(available => this.setAttribute("state", available ? "active" : "inactive"));
        model.altitude.subscribe(altitude => this.elements.altitude.textContent = altitude.toFixed(0));
    }
}
customElements.define("g1000-radio-altimeter", WT_Radio_Altimeter_View);