class WT_MapModelUnitsComponent extends WT_MapModelComponent {
    constructor(name = WT_MapModelUnitsComponent.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions({
            distance: {default: 0, auto: true},
            bearing: {default: 0, auto: true}
        });
    }
}
WT_MapModelUnitsComponent.NAME_DEFAULT = "units";

WT_MapModelUnitsComponent.Bearing = {
    MAGNETIC: 0,
    TRUE: 1
}

WT_MapModelUnitsComponent.Distance = {
    NM: 0,
    KM: 1
}