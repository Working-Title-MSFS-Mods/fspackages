class WT_MapModelAltitudeInterceptComponent extends WT_MapModelComponent {
    constructor(name = WT_MapModelAltitudeInterceptComponent.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelAltitudeInterceptComponent.OPTIONS_DEF);
    }
}
WT_MapModelAltitudeInterceptComponent.NAME_DEFAULT = "altitudeIntercept";
WT_MapModelAltitudeInterceptComponent.OPTIONS_DEF = {
    show: {default: false, auto: true},
};