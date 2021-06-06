class WT_G3x5_DisplayPane {
    constructor(paneID, paneSettings) {
        this._paneID = paneID;
        this._paneSettings = paneSettings;
        this._size = WT_G3x5_DisplayPane.Size.OFF;
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

    /**
     * @readonly
     * @type {WT_G3x5_DisplayPane.Size}
     */
    get size() {
        return this._size;
    }

    _updateFromSize() {
    }

    /**
     *
     * @param {WT_G3x5_DisplayPane.Size} size
     */
    setSize(size) {
        if (this._size === size) {
            return;
        }

        this._size = size;
        this._updateFromSize();
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
/**
 * @enum {Number}
 */
WT_G3x5_DisplayPane.Size = {
    OFF: 0,
    FULL: 1,
    HALF: 2,
};

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