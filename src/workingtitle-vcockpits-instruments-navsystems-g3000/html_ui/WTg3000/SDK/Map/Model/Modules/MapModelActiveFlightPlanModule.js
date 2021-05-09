class WT_MapModelActiveFlightPlanModule extends WT_MapModelModule {
    constructor(name = WT_MapModelActiveFlightPlanModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelActiveFlightPlanModule.OPTIONS_DEF);
    }
}
WT_MapModelActiveFlightPlanModule.NAME_DEFAULT = "activeFlightPlan";
WT_MapModelActiveFlightPlanModule.OPTIONS_DEF = {
    show: {default: true, auto: true},
    flightPlanManager: {default: null, auto: true}
};