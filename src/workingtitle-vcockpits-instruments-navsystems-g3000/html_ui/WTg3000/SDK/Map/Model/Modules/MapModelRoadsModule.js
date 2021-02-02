class WT_MapModelRoadsModule extends WT_MapModelModule {
    constructor(name = WT_MapModelRoadsModule.NAME_DEFAULT) {
        super(name);

        this._highwayRange = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._primaryRange = new WT_NumberUnit(0, WT_Unit.NMILE);

        this._optsManager.addOptions(WT_MapModelRoadsModule.OPTIONS_DEF);
    }

    get highwayRange() {
        return this._highwayRange.readonly();
    }

    set highwayRange(range) {
        this._highwayRange.set(range);
    }

    get primaryRange() {
        return this._primaryRange.readonly();
    }

    set primaryRange(range) {
        this._primaryRange.set(range);
    }
}
WT_MapModelRoadsModule.NAME_DEFAULT = "roads";
WT_MapModelRoadsModule.OPTIONS_DEF = {
    show: {default: false, auto: true},
    highwayRange: {},
    primaryRange: {},
};