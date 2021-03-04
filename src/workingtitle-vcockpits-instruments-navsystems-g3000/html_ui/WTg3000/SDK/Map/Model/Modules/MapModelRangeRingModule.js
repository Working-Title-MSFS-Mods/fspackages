class WT_MapModelRangeRingModule extends WT_MapModelModule {
    constructor(name = WT_MapModelRangeRingModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions({
            show: {default: true, auto: true}
        });
    }
}
WT_MapModelRangeRingModule.NAME_DEFAULT = "rangeRing";