class WT_G3x5_MapModelWindDataModule extends WT_MapModelModule {
    constructor(name = WT_G3x5_MapModelWindDataModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_G3x5_MapModelWindDataModule.OPTIONS_DEF);
    }
}
WT_G3x5_MapModelWindDataModule.NAME_DEFAULT = "wind";
WT_G3x5_MapModelWindDataModule.OPTIONS_DEF = {
    show: {default: false, auto: true}
};