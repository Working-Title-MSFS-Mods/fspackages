class WT_G3000WeatherRadar extends NavSystemElement {
    constructor(instrumentID) {
        super(instrumentID);

        this._instrumentID = instrumentID;
    }

    /**
     * @readonly
     * @property {String} instrumentID - the ID of the instrument to which this weather radar belongs.
     * @type {String}
     */
    get instrumentID() {
        return this._instrumentID;
    }

    /**
     * @readonly
     * @property {WT_WeatherRadarModel} model - the model associated with this weather radar.
     * @type {WT_WeatherRadarModel}
     */
    get model() {
        return this._model;
    }

    init(root) {
        this._radarView = root.querySelector(`weatherradar-view`);
        this._model = new WT_WeatherRadarModel();
        this._radarView.setModel(this.model);
        this._radarView.setBingMapID(`${this.instrumentID}-weatherradar`);

        this._settingsView = root.querySelector(`weatherradar-view-settings`);
        this._settingsView.setModel(this.model);
    }

    onUpdate(deltaTime) {
        this._radarView.update();
        this._settingsView.update();
    }
}

