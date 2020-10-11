
class WT_Com_Frequencies_Model extends WT_Radio_Frequencies_Model {
    get simVarPrefix() {
        return `K:COM${this.selected.value == 1 ? "" : "2"}`;
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
        SimVar.SetSimVarValue(`K:COM${this.selected.value == 1 ? "_STBY" : "2"}_RADIO_SWAP`, "number", 0);
    }
    make_bcd16(arg) {
        var iarg = (arg / 10000.0 - 10000);
        arg = (iarg % 10) + ((iarg / 10 % 10) << 4) + ((iarg / 100 % 10) << 8) + ((iarg / 1000 % 10) << 12);
        return arg;
    }
    setEmergencyFrequency() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_SET`, "Frequency BCD16", this.make_bcd16(121500000));
    }
    update(dt) {
        for (let i = 1; i <= 2; i++) {
            let radio = this[`radio${i}`];
            radio.active.value = SimVar.GetSimVarValue(`COM ACTIVE FREQUENCY:${i}`, "MHz").toFixed(3);
            radio.standby.value = SimVar.GetSimVarValue(`COM STANDBY FREQUENCY:${i}`, "MHz").toFixed(3);
            radio.volume.value = SimVar.GetSimVarValue(`COM VOLUME:${i}`, "number");
        }
    }
}

class WT_Com_Frequencies_View extends WT_Radio_Frequencies_View { }
customElements.define("g1000-com-frequencies", WT_Com_Frequencies_View);