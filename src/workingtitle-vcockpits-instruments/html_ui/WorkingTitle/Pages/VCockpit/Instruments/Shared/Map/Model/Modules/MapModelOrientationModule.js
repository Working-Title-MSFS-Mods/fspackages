class WT_MapModelOrientationModule extends WT_MapModelModule {
    constructor(name = WT_MapModelOrientationModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions({
            mode: {default: 0, auto: true}
        });
    }
}
WT_MapModelOrientationModule.NAME_DEFAULT = "orientation";