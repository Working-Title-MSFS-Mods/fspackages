class WT_MapModelCrosshairModule extends WT_MapModelModule {
    constructor(name = WT_MapModelCrosshairModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelCrosshairModule.OPTIONS_DEF);
    }
}
WT_MapModelCrosshairModule.NAME_DEFAULT = "crosshair";
WT_MapModelCrosshairModule.OPTIONS_DEF = {
    show: {default: false, auto: true}
};