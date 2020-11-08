class WT_Synthetic_Vision {
    constructor() {
        this.enabled = new Subject(WTDataStore.set(`PFD.SyntheticVision`, false));
        this.airportSigns = new Subject(WTDataStore.set(`PFD.SyntheticVisionAirportSigns`, true));
    }
    toggle() {
        this.set(!this.enabled.value);
        WTDataStore.set(`PFD.SyntheticVision`, this.enabled.value);
    }
    set(enabled) {
        this.enabled.value = enabled;
        WTDataStore.set(`PFD.SyntheticVision`, this.enabled.value);
    }
    toggleAirportSigns() {
        this.airportSigns.value = !this.airportSigns.value;
        WTDataStore.set(`PFD.SyntheticVisionAirportSigns`, this.airportSigns.value);
    }
}