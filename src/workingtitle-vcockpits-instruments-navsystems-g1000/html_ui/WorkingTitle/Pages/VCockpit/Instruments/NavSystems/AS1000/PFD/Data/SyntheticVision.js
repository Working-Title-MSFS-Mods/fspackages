class WT_Synthetic_Vision {
    constructor() {
        this.enabled = new Subject(WTDataStore.set(`PFD.SyntheticVision`, false));
        this.airportSigns = new Subject(WTDataStore.set(`PFD.SyntheticVisionAirportSigns`, true));
    }
    toggle() {
        this.set(!this.enabled.value);
    }
    set(enabled) {
        WTDataStore.set(`PFD.SyntheticVision`, enabled);
        this.enabled.value = enabled;
    }
    toggleAirportSigns() {
        this.airportSigns.value = !this.airportSigns.value;
        WTDataStore.set(`PFD.SyntheticVisionAirportSigns`, this.airportSigns.value);
    }
}