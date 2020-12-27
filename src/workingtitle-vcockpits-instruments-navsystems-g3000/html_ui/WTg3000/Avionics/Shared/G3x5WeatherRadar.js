class WT_G3x5WeatherRadar extends NavSystemElement {
    constructor(instrumentID) {
        super(instrumentID);

        this._instrumentID = instrumentID;
    }

    /**
     * @readonly
     * @property {String} instrumentID - the ID of this weather radar.
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

    /**
     * @readonly
     * @property {WT_DataStoreController} controller - the controller for this weather radar.
     * @type {WT_DataStoreController}
     */
    get controller() {
        return this._controller;
    }

    init(root) {
        this._radarView = root.querySelector(`weatherradar-view`);
        this._model = new WT_WeatherRadarModel();
        this._radarView.setModel(this.model);
        this._radarView.setBingMapID(`${this.instrumentID}-weatherradar`);

        this._settingsView = root.querySelector(`weatherradar-view-settings`);
        this._settingsView.setModel(this.model);

        this._controller = new WT_DataStoreController(`${this.instrumentID}`, this.model);

        this.controller.addSetting(this._showSetting = new WT_WeatherRadarSetting(this.controller, "mode", WT_G3x5WeatherRadar.SHOW_KEY, WT_G3x5WeatherRadar.SHOW_DEFAULT, true, false));
        this.controller.addSetting(this._modeSetting = new WT_WeatherRadarSetting(this.controller, "mode", WT_G3x5WeatherRadar.MODE_KEY, WT_G3x5WeatherRadar.MODE_DEFAULT, true, false));
        this.controller.addSetting(this._displaySetting = new WT_WeatherRadarSetting(this.controller, "display", WT_G3x5WeatherRadar.DISPLAY_KEY, WT_G3x5WeatherRadar.DISPLAY_DEFAULT, true, false));
        this.controller.addSetting(new WT_WeatherRadarSetting(this.controller, "scanMode", WT_G3x5WeatherRadar.SCAN_MODE_KEY, WT_G3x5WeatherRadar.SCAN_MODE_DEFAULT, true, false));
        this.controller.addSetting(new WT_WeatherRadarSetting(this.controller, "showBearingLine", WT_G3x5WeatherRadar.BEARING_LINE_SHOW_KEY, WT_G3x5WeatherRadar.BEARING_LINE_SHOW_DEFAULT, true, false));
        this.controller.addSetting(new WT_WeatherRadarRangeSetting(this.controller, WT_G3x5WeatherRadar.RANGES, WT_G3x5WeatherRadar.RANGE_DEFAULT));

        this.controller.init();
        this.controller.update();
    }

    isVisible() {
        return this._showSetting.getValue();
    }

    _checkStandby() {
        if (this.model.mode === WT_WeatherRadarModel.Mode.STANDBY) {
            this._displaySetting.setValue(WT_WeatherRadarModel.Display.OFF);
        }
    }

    onUpdate(deltaTime) {
        this._checkStandby();

        if (!this.isVisible()) {
            return;
        }

        this._radarView.update();
        this._settingsView.update();
    }

    onEvent(event) {
    }
}

WT_G3x5WeatherRadar.SHOW_KEY = "WT_WeatherRadar_Show";
WT_G3x5WeatherRadar.SHOW_DEFAULT = false;

WT_G3x5WeatherRadar.MODE_KEY = "WT_WeatherRadar_Mode";
WT_G3x5WeatherRadar.MODE_DEFAULT = WT_WeatherRadarModel.Mode.STANDBY;

WT_G3x5WeatherRadar.DISPLAY_KEY = "WT_WeatherRadar_Display";
WT_G3x5WeatherRadar.DISPLAY_DEFAULT = WT_WeatherRadarModel.Display.OFF;

WT_G3x5WeatherRadar.SCAN_MODE_KEY = "WT_WeatherRadar_ScanMode";
WT_G3x5WeatherRadar.SCAN_MODE_DEFAULT = WT_WeatherRadarModel.ScanMode.HORIZONTAL;

WT_G3x5WeatherRadar.BEARING_LINE_SHOW_KEY = "WT_WeatherRadar_BearingLine_Show";
WT_G3x5WeatherRadar.BEARING_LINE_SHOW_DEFAULT = true;

WT_G3x5WeatherRadar.RANGES = [10, 20, 40, 60, 80, 100, 120, 160].map(range => WT_Unit.NMILE.createNumber(range));
WT_G3x5WeatherRadar.RANGE_DEFAULT = WT_Unit.NMILE.createNumber(20);