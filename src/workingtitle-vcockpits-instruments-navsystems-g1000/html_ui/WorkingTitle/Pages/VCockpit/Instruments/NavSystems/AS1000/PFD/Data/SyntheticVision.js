class WT_Synthetic_Vision {
    /**
     * @param {WT_Plane_Config} config 
     */
    constructor(config) {
        this.enabled = new Subject(WTDataStore.get(WT_Synthetic_Vision.ENABLED_KEY, false));
        this.airportSigns = new Subject(WTDataStore.get(WT_Synthetic_Vision.AIRPORT_SIGNS_KEY, true));
        this.horizonHeadings = new Subject(WTDataStore.get(WT_Synthetic_Vision.HORIZON_HEADINGS_KEY, true));

        config.watchNode("SyntheticVision", node => {
            this.enabled.value = WTDataStore.get(WT_Synthetic_Vision.ENABLED_KEY, node && node.textContent == "True");
        });
    }
    toggle() {
        this.set(!this.enabled.value);
        WTDataStore.set(WT_Synthetic_Vision.ENABLED_KEY, this.enabled.value);
    }
    set(enabled) {
        this.enabled.value = enabled;
        WTDataStore.set(WT_Synthetic_Vision.ENABLED_KEY, this.enabled.value);
    }
    toggleAirportSigns() {
        this.airportSigns.value = !this.airportSigns.value;
        WTDataStore.set(WT_Synthetic_Vision.AIRPORT_SIGNS_KEY, this.airportSigns.value);
    }
    toggleHorizonHeadings() {
        this.horizonHeadings.value = !this.horizonHeadings.value;
        WTDataStore.set(WT_Synthetic_Vision.HORIZON_HEADINGS_KEY, this.horizonHeadings.value);
    }
}
WT_Synthetic_Vision.ENABLED_KEY = "PFD.SyntheticVision";
WT_Synthetic_Vision.AIRPORT_SIGNS_KEY = "PFD.SyntheticVisionAirportSigns";
WT_Synthetic_Vision.HORIZON_HEADINGS_KEY = "PFD.SyntheticVisionHorizonHeadings";