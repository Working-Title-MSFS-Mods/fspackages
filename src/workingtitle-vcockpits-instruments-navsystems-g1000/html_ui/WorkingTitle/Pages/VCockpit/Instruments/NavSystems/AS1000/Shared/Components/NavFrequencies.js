class WT_Nav_Frequencies_Model extends WT_Radio_Frequencies_Model {
    constructor() {
        super();
        this.radio1.ident = new Subject();
        this.radio2.ident = new Subject();
    }
    get simVarPrefix() {
        return `K:NAV${this.selected.value}`;
    }
    incrementWhole() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_WHOLE_INC`, "number", 0);
    }
    decrementWhole() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_WHOLE_DEC`, "number", 0);
    }
    incrementFractional() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_FRACT_INC`, "number", 0);
    }
    decrementFractional() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_FRACT_DEC`, "number", 0);
    }
    increaseVolume() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_VOLUME_INC`, "number", 0);
    }
    decreaseVolume() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_VOLUME_DEC`, "number", 0);
    }
    toggleActive() {
        this.selected.value = this.selected.value == 1 ? 2 : 1;
    }
    transferActive() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_SWAP`, "number", 0);
    }
    /**
     * @param {Number} bcd 
     */
    selectFrequency(bcd) {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_SWAP`, "number", 0);
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_SET`, "Frequency BCD16", bcd);
    }
    update(dt) {
        for (let i = 1; i <= 2; i++) {
            let radio = this[`radio${i}`];
            radio.active.value = SimVar.GetSimVarValue(`NAV ACTIVE FREQUENCY:${i}`, "MHz").toFixed(2);
            radio.standby.value = SimVar.GetSimVarValue(`NAV STANDBY FREQUENCY:${i}`, "MHz").toFixed(2);
            radio.ident.value = SimVar.GetSimVarValue(`NAV IDENT:${i}`, "string");
            radio.volume.value = SimVar.GetSimVarValue(`NAV VOLUME:${i}`, "number");
        }
    }
}

class WT_Nav_Frequencies_View extends WT_Radio_Frequencies_View {
    /**
     * @param {WT_Nav_Frequencies_Model} model 
     */
    setModel(model) {
        super.setModel(model);
        model.radio1.ident.subscribe(ident => this.elements.radio1ident.textContent = ident);
        model.radio2.ident.subscribe(ident => this.elements.radio2ident.textContent = ident);
    }
}
customElements.define("g1000-nav-frequencies", WT_Nav_Frequencies_View);