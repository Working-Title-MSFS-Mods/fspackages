class WT_WeatherRadarModel {
    constructor() {
        this._optsManager = new WT_OptionsManager(this, WT_WeatherRadarModel.OPTIONS_DEF);

        this._range = new WT_NumberUnit(20, WT_Unit.NMILE);
    }

    get range() {
        return this._range.readonly();
    }

    set range(value) {
        this._range.set(value);
    }

    /**
     * @readonly
     * @property {WT_AirplaneModel} airplane
     * @type {WT_AirplaneModel}
     */
    get airplane() {
        return WT_AirplaneModel.INSTANCE;
    }
}
WT_WeatherRadarModel.Mode = {
    HORIZONTAL: 0,
    VERTICAL: 1
};
WT_WeatherRadarModel.OPTIONS_DEF = {
    mode: {default: WT_WeatherRadarModel.Mode.HORIZONTAL, auto: true},
    range: {},
    tilt: {default: 0, auto: true},
    bearing: {default: 0, auto: true},
    gain: {default: -1, auto: true}
};