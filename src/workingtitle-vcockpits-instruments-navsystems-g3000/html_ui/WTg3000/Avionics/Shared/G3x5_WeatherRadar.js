class WT_G3x5_WeatherRadar {
    constructor(instrumentID, airplane) {
        this._instrumentID = instrumentID;
        this._airplane = airplane;
    }

    /**
     * The ID of this weather radar.
     * @readonly
     * @type {String}
     */
    get instrumentID() {
        return this._instrumentID;
    }

    /**
     * The model associated with this weather radar.
     * @readonly
     * @type {WT_WeatherRadarModel}
     */
    get model() {
        return this._model;
    }

    /**
     * The setting model for this weather radar.
     * @readonly
     * @type {WT_DataStoreSettingModel}
     */
    get settingModel() {
        return this._settingModel;
    }

    init(root) {
        this._radarView = root.querySelector(`weatherradar-view`);
        this._model = new WT_WeatherRadarModel(this._airplane);
        this._radarView.setModel(this.model);
        this._radarView.setBingMapID(`${this.instrumentID}`);

        this._settingsView = root.querySelector(`weatherradar-view-settings`);
        this._settingsView.setModel(this.model);

        this._settingModel = new WT_WeatherRadarSettingModel(`${this.instrumentID}`, this.model);

        this.settingModel.addSetting(this._showSetting = new WT_WeatherRadarGenericSetting(this.settingModel, "mode", WT_G3x5_WeatherRadar.SHOW_KEY, WT_G3x5_WeatherRadar.SHOW_DEFAULT, true, false));
        this.settingModel.addSetting(this._modeSetting = new WT_WeatherRadarGenericSetting(this.settingModel, "mode", WT_G3x5_WeatherRadar.MODE_KEY, WT_G3x5_WeatherRadar.MODE_DEFAULT, true, false));
        this.settingModel.addSetting(this._displaySetting = new WT_WeatherRadarGenericSetting(this.settingModel, "display", WT_G3x5_WeatherRadar.DISPLAY_KEY, WT_G3x5_WeatherRadar.DISPLAY_DEFAULT, true, false));
        this.settingModel.addSetting(new WT_WeatherRadarGenericSetting(this.settingModel, "scanMode", WT_G3x5_WeatherRadar.SCAN_MODE_KEY, WT_G3x5_WeatherRadar.SCAN_MODE_DEFAULT, true, false));
        this.settingModel.addSetting(new WT_WeatherRadarGenericSetting(this.settingModel, "showBearingLine", WT_G3x5_WeatherRadar.BEARING_LINE_SHOW_KEY, WT_G3x5_WeatherRadar.BEARING_LINE_SHOW_DEFAULT, true, false));
        this.settingModel.addSetting(new WT_WeatherRadarRangeSetting(this.settingModel, WT_G3x5_WeatherRadar.RANGES, WT_G3x5_WeatherRadar.RANGE_DEFAULT));

        this.settingModel.init();
        this.settingModel.update();
    }

    sleep() {
        this._radarView.sleep();
    }

    wake() {
        this._radarView.wake();
    }

    _checkStandby() {
        if (this.model.mode === WT_WeatherRadarModel.Mode.STANDBY) {
            this._displaySetting.setValue(WT_WeatherRadarModel.Display.OFF);
        }
    }

    update() {
        this._checkStandby();

        if (!this._radarView.isAwake()) {
            this.wake();
        }

        this._radarView.update();
        this._settingsView.update();
    }
}

WT_G3x5_WeatherRadar.SHOW_KEY = "WT_WeatherRadar_Show";
WT_G3x5_WeatherRadar.SHOW_DEFAULT = false;

WT_G3x5_WeatherRadar.MODE_KEY = "WT_WeatherRadar_Mode";
WT_G3x5_WeatherRadar.MODE_DEFAULT = WT_WeatherRadarModel.Mode.STANDBY;

WT_G3x5_WeatherRadar.DISPLAY_KEY = "WT_WeatherRadar_Display";
WT_G3x5_WeatherRadar.DISPLAY_DEFAULT = WT_WeatherRadarModel.Display.OFF;

WT_G3x5_WeatherRadar.SCAN_MODE_KEY = "WT_WeatherRadar_ScanMode";
WT_G3x5_WeatherRadar.SCAN_MODE_DEFAULT = WT_WeatherRadarModel.ScanMode.HORIZONTAL;

WT_G3x5_WeatherRadar.BEARING_LINE_SHOW_KEY = "WT_WeatherRadar_BearingLine_Show";
WT_G3x5_WeatherRadar.BEARING_LINE_SHOW_DEFAULT = true;

WT_G3x5_WeatherRadar.RANGES = [10, 20, 40, 60, 80, 100, 120, 160].map(range => WT_Unit.NMILE.createNumber(range));
WT_G3x5_WeatherRadar.RANGE_DEFAULT = WT_Unit.NMILE.createNumber(20);