class WT_G3x5_FlightPlanPreviewSettings {
    /**
     * @param {WT_MapSettingModel} settingModel
     * @param {Boolean} autoUpdate
     */
    constructor(settingModel, autoUpdate) {
        this._settingModel = settingModel;
        this._autoUpdate = autoUpdate;

        this._initSettings();
    }

    _initSettings() {
        this.settingModel.addSetting(this._rangeSetting = new WT_MapRangeSetting(this.settingModel, WT_G3x5_FlightPlanPreviewSettings.MAP_RANGE_LEVELS, WT_G3x5_FlightPlanPreviewSettings.MAP_RANGE_DEFAULT, false, false));
        this.settingModel.addSetting(this._pointerShowSetting = new WT_G3x5_MapPointerShowSetting(this.settingModel, this._autoUpdate));
    }

    /**
     * @readonly
     * @type {WT_MapSettingModel}
     */
    get settingModel() {
        return this._settingModel;
    }

    /**
     * @readonly
     * @type {WT_MapRangeSetting}
     */
    get rangeSetting() {
        return this._rangeSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_MapPointerShowSetting}
     */
    get pointerShowSetting() {
        return this._pointerShowSetting;
    }
}
WT_G3x5_FlightPlanPreviewSettings.MAP_RANGE_LEVELS =
    [250, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.FOOT)).concat(
        [0.25, 0.5, 0.75, 1, 1.5, 2.5, 4, 5, 7.5, 10, 15, 25, 40, 50, 75, 100, 150, 250, 400, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.NMILE))
    );
WT_G3x5_FlightPlanPreviewSettings.MAP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(1);