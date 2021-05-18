class WT_G3x5_MapModelChartsModule extends WT_MapModelModule {
    constructor(name = WT_G3x5_MapModelChartsModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_G3x5_MapModelChartsModule.OPTION_DEFS);
    }
}
WT_G3x5_MapModelChartsModule.NAME_DEFAULT = "charts";
WT_G3x5_MapModelChartsModule.OPTION_DEFS = {
    displayedChart: {default: null, auto: true},
    isToScale: {default: false, auto: true},
    showAirplane: {default: false, auto: true}
};