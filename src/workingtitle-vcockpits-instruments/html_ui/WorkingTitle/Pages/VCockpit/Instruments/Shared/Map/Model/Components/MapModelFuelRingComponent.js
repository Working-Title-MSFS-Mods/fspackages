class WT_MapModelFuelRingComponent extends WT_MapModelComponent {
    constructor(name = WT_MapModelFuelRingComponent.NAME_DEFAULT) {
        super(name);

        this._reserveTime = new WT_NumberUnit(0, WT_Unit.SECOND);

        this._optsManager.addOptions(WT_MapModelFuelRingComponent.OPTIONS_DEF);
    }

    get reserveTime() {
        return this._reserveTime.copy();
    }

    set reserveTime(time) {
        this._reserveTime.copyFrom(time);
    }
}
WT_MapModelFuelRingComponent.NAME_DEFAULT = "fuelRing";
WT_MapModelFuelRingComponent.OPTIONS_DEF = {
    show: {default: false, auto: true},
    reserveTime: {}
};