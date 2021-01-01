class WT_MapModelWaypointInfoModule extends WT_MapModelModule {
    constructor(name = WT_MapModelWaypointInfoModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelWaypointInfoModule.OPTIONS_DEF);
    }
}
WT_MapModelWaypointInfoModule.NAME_DEFAULT = "waypointInfo";
/**
 * @enum {Number}
 */
WT_MapModelWaypointInfoModule.Mode = {
    OFF: 0,
    AIRPORT: 1,
    VOR: 2,
    NDB: 3,
    INT: 4
}
WT_MapModelWaypointInfoModule.OPTIONS_DEF = {
    mode: {default: WT_MapModelWaypointInfoModule.Mode.OFF, auto: true},
    waypointICAO: {default: "", auto: true}
};