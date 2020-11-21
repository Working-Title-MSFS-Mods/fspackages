class WT_MapModelRangeCompassModule extends WT_MapModelModule {
    constructor(name = WT_MapModelRangeCompassModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions({
            show: {default: true, auto: true}
        });
    }
}
WT_MapModelRangeCompassModule.NAME_DEFAULT = "rangeCompass";