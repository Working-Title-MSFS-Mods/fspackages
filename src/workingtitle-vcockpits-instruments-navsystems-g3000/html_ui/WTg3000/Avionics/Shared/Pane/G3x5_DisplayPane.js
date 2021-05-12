class WT_G3x5_DisplayPane {
    constructor(paneID, paneSettings) {
        this._paneID = paneID;
        this._paneSettings = paneSettings;
    }

    /**
     * @readonly
     * @type {String}
     */
    get paneID() {
        return this._paneID;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PaneSettings}
     */
    get paneSettings() {
        return this._paneSettings;
    }

    getTitle() {
    }

    init(root) {
    }

    wake() {
    }

    sleep() {
    }

    update() {
    }
}

class WT_G3x5_WeatherRadarDisplayPane extends WT_G3x5_DisplayPane {
    constructor(paneID, paneSettings, weatherRadar) {
        super(paneID, paneSettings);

        this._weatherRadar = weatherRadar;
    }

    /**
     * @readonly
     * @type {WT_G3x5_WeatherRadar}
     */
    get weatherRadar() {
        return this._weatherRadar;
    }

    getTitle() {
        return "Weather Radar";
    }

    init(root) {
        this.weatherRadar.init(root);
    }

    wake() {
        this.weatherRadar.wake();
    }

    sleep() {
        this.weatherRadar.sleep();
    }

    update() {
        this.weatherRadar.update();
    }
}