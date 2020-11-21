class WT_MapModelBordersModule extends WT_MapModelModule {
    constructor(name = WT_MapModelBordersModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelBordersModule.OPTIONS_DEF);
    }
}
WT_MapModelBordersModule.NAME_DEFAULT = "borders";
WT_MapModelBordersModule.OPTIONS_DEF = {
    show: {default: true, auto: true},
    showStateBorders: {default: true, auto: true},
};