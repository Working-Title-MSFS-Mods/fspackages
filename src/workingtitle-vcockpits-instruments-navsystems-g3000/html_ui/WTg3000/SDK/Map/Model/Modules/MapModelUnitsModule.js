class WT_MapModelUnitsModule extends WT_MapModelModule {
    constructor(name = WT_MapModelUnitsModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelUnitsModule.OPTIONS_DEF);
    }
}
WT_MapModelUnitsModule.NAME_DEFAULT = "units";
WT_MapModelUnitsModule.OPTIONS_DEF = {
    bearing: {default: new WT_NavAngleUnit(true), auto: true},
    distance: {default: WT_Unit.NMILE, auto: true},
    speed: {default: WT_Unit.KNOT, auto: true},
    verticalSpeed: {default: WT_Unit.FPM, auto: true},
    altitude: {default: WT_Unit.FOOT, auto: true}
};