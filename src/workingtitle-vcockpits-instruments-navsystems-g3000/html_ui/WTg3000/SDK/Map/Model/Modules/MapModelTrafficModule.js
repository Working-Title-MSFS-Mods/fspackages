class WT_MapModelTrafficModule extends WT_MapModelModule {
    constructor(name = WT_MapModelTrafficModule.NAME_DEFAULT) {
        super(name);

        this._outerRange = WT_Unit.NMILE.createNumber(0);
        this._innerRange = WT_Unit.NMILE.createNumber(0);
        this._altitudeRestrictionAbove = WT_Unit.FOOT.createNumber(0);
        this._altitudeRestrictionBelow = WT_Unit.FOOT.createNumber(0);

        this._optsManager.addOptions(WT_MapModelTrafficModule.OPTION_DEFS);
    }

    get outerRange() {
        return this._outerRange.readonly();
    }

    set outerRange(range) {
        this._outerRange.set(range);
    }

    get innerRange() {
        return this._innerRange.readonly();
    }

    set innerRange(range) {
        this._innerRange.set(range);
    }

    get altitudeRestrictionAbove() {
        return this._altitudeRestrictionAbove.readonly();
    }

    set altitudeRestrictionAbove(altitude) {
        this._altitudeRestrictionAbove.set(altitude);
    }

    get altitudeRestrictionBelow() {
        return this._altitudeRestrictionBelow.readonly();
    }

    set altitudeRestrictionBelow(altitude) {
        this._altitudeRestrictionBelow.set(altitude);
    }
}
WT_MapModelTrafficModule.NAME_DEFAULT = "traffic";
/**
 * @enum {Number}
 */
WT_MapModelTrafficModule.MotionVectorMode = {
    NONE: 0,
    ABSOLUTE: 1,
    RELATIVE: 2
};
WT_MapModelTrafficModule.OPTION_DEFS = {
    show: {default: true, auto: true},
    outerRange: {default: WT_Unit.NMILE.createNumber(0)},
    innerRange: {default: WT_Unit.NMILE.createNumber(0)},
    altitudeRestrictionAbove: {default: WT_Unit.FOOT.createNumber(0)},
    altitudeRestrictionBelow: {default: WT_Unit.FOOT.createNumber(0)},
    motionVectorMode: {default: WT_MapModelTrafficModule.MotionVectorMode.NONE, auto: true},
};