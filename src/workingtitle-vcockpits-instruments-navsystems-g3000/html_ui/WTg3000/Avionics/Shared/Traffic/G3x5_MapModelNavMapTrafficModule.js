class WT_G3x5_MapModelNavMapTrafficModule extends WT_G3x5_MapModelTrafficModule {
    constructor(trafficSystem) {
        super(trafficSystem);

        this._symbolRange = WT_Unit.NMILE.createNumber(0);
        this._labelRange = WT_Unit.NMILE.createNumber(0);

        this._optsManager.addOptions(WT_G3x5_MapModelNavMapTrafficModule.OPTION_DEFS);
    }

    get symbolRange() {
        return this._symbolRange.readonly();
    }

    set symbolRange(range) {
        this._symbolRange.set(range);
    }

    get labelRange() {
        return this._labelRange.readonly();
    }

    set labelRange(range) {
        this._labelRange.set(range);
    }
}
WT_G3x5_MapModelNavMapTrafficModule.OPTION_DEFS = {
    symbolRange: {},
    labelShow: {default: true, auto: true},
    labelRange: {}
}