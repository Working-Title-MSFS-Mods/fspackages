class WT_Weather_Radar {
    /**
     * @param {WT_Plane_Config} config 
     */
    constructor(config) {
        this.available = new Subject(false);
        config.watchNode("WeatherRadar").subscribe(node => {
            if (node && (node.textContent.toLowerCase() == "off" || node.toLowerCase() == "none")) {
                this.available.value = false;
            } else {
                this.available.value = true;
            }
        });
    }
}