class WT_MapModelUnitsModule extends WT_MapModelModule {
    constructor(name = WT_MapModelUnitsModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions({
            distance: {default: 0, auto: true},
            bearing: {default: 0, auto: true}
        });
    }
}
WT_MapModelUnitsModule.NAME_DEFAULT = "units";

WT_MapModelUnitsModule.Bearing = {
    MAGNETIC: 0,
    TRUE: 1
}

WT_MapModelUnitsModule.Distance = {
    NM: 0,
    KM: 1
}