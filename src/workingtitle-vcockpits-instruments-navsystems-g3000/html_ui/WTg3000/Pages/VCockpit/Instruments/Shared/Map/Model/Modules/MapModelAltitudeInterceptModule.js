class WT_MapModelAltitudeInterceptModule extends WT_MapModelModule {
    constructor(name = WT_MapModelAltitudeInterceptModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelAltitudeInterceptModule.OPTIONS_DEF);
    }
}
WT_MapModelAltitudeInterceptModule.NAME_DEFAULT = "altitudeIntercept";
WT_MapModelAltitudeInterceptModule.OPTIONS_DEF = {
    show: {default: false, auto: true},
};