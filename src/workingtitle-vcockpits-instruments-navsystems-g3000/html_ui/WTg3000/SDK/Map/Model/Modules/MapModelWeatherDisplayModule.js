class WT_MapModelWeatherDisplayModule extends WT_MapModelModule {
    constructor(name = WT_MapModelWeatherDisplayModule.NAME_DEFAULT) {
        super(name);

        this._nexradRange = new WT_NumberUnit(0, WT_Unit.NMILE);

        this._optsManager.addOptions(WT_MapModelWeatherDisplayModule.OPTIONS_DEF);
    }

    get nexradRange() {
        return this._nexradRange.readonly();
    }

    set nexradRange(range) {
        this._nexradRange.set(range);
    }
}
WT_MapModelWeatherDisplayModule.NAME_DEFAULT = "weatherDisplay";
WT_MapModelWeatherDisplayModule.OPTIONS_DEF = {
    nexradShow: {default: false, auto: true},
    nexradRange: {}
};