class WT_PFD_Inset_Map {
    /**
     * @param {MapInstrument} map 
     */
    constructor(map) {
        this.map = map;
        this.mapContainer = document.getElementById("InnerMap");
        this.enabled = new Subject(WTDataStore.get(`PFD.InsetMapEnabled`, true));

        this.enabled.subscribe(enabled => {
            this.mapContainer.style.display = enabled ? "inherit" : "none";
        });
    }
    disable() {
        this.enabled.value = false;
        WTDataStore.set(`PFD.InsetMapEnabled`, false);
    }
    enable() {
        this.enabled.value = true;
        WTDataStore.set(`PFD.InsetMapEnabled`, true);
    }
}