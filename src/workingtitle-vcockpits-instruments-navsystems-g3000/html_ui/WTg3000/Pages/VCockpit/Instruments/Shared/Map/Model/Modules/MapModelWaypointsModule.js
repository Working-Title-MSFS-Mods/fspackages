class WT_MapModelWaypointsModule extends WT_MapModelModule {
    constructor(name = WT_MapModelWaypointsModule.NAME_DEFAULT) {
        super(name);

        this._airwayRange = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._airportSmallRange = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._airportMediumRange = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._airportLargeRange = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._vorRange = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._ndbRange = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._intRange = new WT_NumberUnit(0, WT_Unit.NMILE);

        this._optsManager.addOptions(WT_MapModelWaypointsModule.OPTIONS_DEF);
    }

    get airwayRange() {
        return this._airwayRange.readonly();
    }

    set airwayRange(range) {
        this._airwayRange.set(range);
    }

    get airportSmallRange() {
        return this._airportSmallRange.readonly();
    }

    set airportSmallRange(range) {
        this._airportSmallRange.set(range);
    }

    get airportMediumRange() {
        return this._airportMediumRange.readonly();
    }

    set airportMediumRange(range) {
        this._airportMediumRange.set(range);
    }

    get airportLargeRange() {
        return this._airportLargeRange.readonly();
    }

    set airportLargeRange(range) {
        this._airportLargeRange.set(range);
    }

    get vorRange() {
        return this._vorRange.readonly();
    }

    set vorRange(range) {
        this._vorRange.set(range);
    }

    get ndbRange() {
        return this._ndbRange.readonly();
    }

    set ndbRange(range) {
        this._ndbRange.set(range);
    }

    get intRange() {
        return this._intRange.readonly();
    }

    set intRange(range) {
        this._intRange.set(range);
    }
}
WT_MapModelWaypointsModule.NAME_DEFAULT = "waypoints";
WT_MapModelWaypointsModule.OPTIONS_DEF = {
    show: {default: true, auto: true},
    airwayShow: {default: true, auto: true},
    airwayRange: {},
    airportShow: {default: true, auto: true},
    airportSmallRange: {},
    airportMediumRange: {},
    airportLargeRange: {},
    vorShow: {default: true, auto: true},
    vorRange: {},
    ndbShow: {default: true, auto: true},
    ndbRange: {},
    intShow: {default: true, auto: true},
    intRange: {}
};