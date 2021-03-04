class WT_MapModelFuelRingModule extends WT_MapModelModule {
    constructor(name = WT_MapModelFuelRingModule.NAME_DEFAULT) {
        super(name);

        this._reserveTime = new WT_NumberUnit(0, WT_Unit.SECOND);

        this._optsManager.addOptions(WT_MapModelFuelRingModule.OPTIONS_DEF);
    }

    get reserveTime() {
        return this._reserveTime.readonly();
    }

    set reserveTime(time) {
        this._reserveTime.set(time);
    }
}
WT_MapModelFuelRingModule.NAME_DEFAULT = "fuelRing";
WT_MapModelFuelRingModule.OPTIONS_DEF = {
    show: {default: false, auto: true},
    reserveTime: {}
};