class WT_MapModelWindDataModule extends WT_MapModelModule {
    constructor(name = WT_MapModelWindDataModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelWindDataModule.OPTIONS_DEF);
    }
}
WT_MapModelWindDataModule.NAME_DEFAULT = "wind";
WT_MapModelWindDataModule.OPTIONS_DEF = {
    show: {default: false, auto: true}
};