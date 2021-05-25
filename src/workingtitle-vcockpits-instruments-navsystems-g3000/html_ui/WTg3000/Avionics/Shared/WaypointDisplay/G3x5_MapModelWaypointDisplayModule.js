class WT_G3x5_MapModelWaypointDisplayModule extends WT_MapModelModule {
    constructor(name = WT_G3x5_MapModelWaypointDisplayModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_G3x5_MapModelWaypointDisplayModule.OPTIONS_DEF);
    }
}
WT_G3x5_MapModelWaypointDisplayModule.NAME_DEFAULT = "waypointDisplay";
WT_G3x5_MapModelWaypointDisplayModule.OPTIONS_DEF = {
    waypoint: {default: null, auto: true}
};