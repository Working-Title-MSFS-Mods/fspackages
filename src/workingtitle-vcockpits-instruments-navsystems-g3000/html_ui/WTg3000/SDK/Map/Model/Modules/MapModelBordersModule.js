class WT_MapModelBordersModule extends WT_MapModelModule {
    constructor(name = WT_MapModelBordersModule.NAME_DEFAULT) {
        super(name);

        this._stateBorderRange = new WT_NumberUnit(0, WT_Unit.NMILE);

        this._optsManager.addOptions(WT_MapModelBordersModule.OPTIONS_DEF);
    }

    get stateBorderRange() {
        return this._stateBorderRange.readonly();
    }

    set stateBorderRange(range) {
        this._stateBorderRange.set(range);
    }
}
WT_MapModelBordersModule.NAME_DEFAULT = "borders";
WT_MapModelBordersModule.OPTIONS_DEF = {
    show: {default: true, auto: true},
    stateBorderShow: {default: true, auto: true},
    stateBorderRange: {}
};