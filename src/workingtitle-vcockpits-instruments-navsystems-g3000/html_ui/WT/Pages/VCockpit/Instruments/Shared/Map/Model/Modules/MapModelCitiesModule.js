class WT_MapModelCitiesModule extends WT_MapModelModule {
    constructor(name = WT_MapModelCitiesModule.NAME_DEFAULT) {
        super(name);

        this._largeRange = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._mediumRange = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._smallRange = new WT_NumberUnit(0, WT_Unit.NMILE);

        this._optsManager.addOptions(WT_MapModelCitiesModule.OPTIONS_DEF);
    }

    get largeRange() {
        return this._largeRange.readonly();
    }

    set largeRange(range) {
        this._largeRange.set(range);
    }

    get mediumRange() {
        return this._mediumRange.readonly();
    }

    set mediumRange(range) {
        this._mediumRange.set(range);
    }

    get smallRange() {
        return this._smallRange.readonly();
    }

    set smallRange(range) {
        this._smallRange.set(range);
    }
}
WT_MapModelCitiesModule.NAME_DEFAULT = "cities";
WT_MapModelCitiesModule.OPTIONS_DEF = {
    show: {default: false, auto: true},
    largeRange: {},
    mediumRange: {},
    smallRange: {}
};