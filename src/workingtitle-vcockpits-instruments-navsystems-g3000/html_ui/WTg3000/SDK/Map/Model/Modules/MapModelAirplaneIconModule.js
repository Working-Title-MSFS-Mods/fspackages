class WT_MapModelAirplaneIconModule extends WT_MapModelModule {
    constructor(name = WT_MapModelAirplaneIconModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelAirplaneIconModule.OPTIONS_DEF);
    }
}
WT_MapModelAirplaneIconModule.NAME_DEFAULT = "airplaneIcon";
WT_MapModelAirplaneIconModule.OPTIONS_DEF = {
    show: {default: true, auto: true}
};