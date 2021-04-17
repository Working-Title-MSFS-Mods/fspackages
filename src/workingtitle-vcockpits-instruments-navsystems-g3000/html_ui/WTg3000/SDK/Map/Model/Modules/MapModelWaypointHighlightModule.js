class WT_MapModelWaypointHighlightModule extends WT_MapModelModule {
    constructor(name = WT_MapModelWaypointHighlightModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelWaypointHighlightModule.OPTIONS_DEF);
    }
}
WT_MapModelWaypointHighlightModule.NAME_DEFAULT = "waypointHighlight";
WT_MapModelWaypointHighlightModule.OPTIONS_DEF = {
    waypoint: {default: null, auto: true}
};