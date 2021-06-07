class WT_MapModelFlightPlanModule extends WT_MapModelModule {
    constructor(name = WT_MapModelFlightPlanModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelFlightPlanModule.OPTIONS_DEF);
    }
}
WT_MapModelFlightPlanModule.NAME_DEFAULT = "flightPlan";
WT_MapModelFlightPlanModule.OPTIONS_DEF = {
    show: {default: true, auto: true},
    plan: {default: null, auto: true}
};