class WT_Synthetic_Vision {
    constructor() {
        this.enabled = new Subject(WTDataStore.set(`PFD.SyntheticVision`, false));
    }
    toggle() {
        this.set(!this.enabled.value);
    }
    set(enabled) {
        WTDataStore.set(`PFD.SyntheticVision`, enabled);
        this.enabled.value = enabled;
    }
}