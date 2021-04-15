class WT_G3x5_MapModelTrafficModule extends WT_MapModelModule {
    constructor(trafficSystem, name = WT_G3x5_MapModelTrafficModule.NAME_DEFAULT) {
        super(name);

        this._trafficSystem = trafficSystem;
        this._outerRange = WT_Unit.NMILE.createNumber(0);
        this._innerRange = WT_Unit.NMILE.createNumber(0);
        this._altitudeRestrictionAbove = WT_Unit.FOOT.createNumber(0);
        this._altitudeRestrictionBelow = WT_Unit.FOOT.createNumber(0);
        this._motionVectorLookahead = WT_Unit.SECOND.createNumber(0);

        this._optsManager.addOptions(WT_G3x5_MapModelTrafficModule.OPTION_DEFS);
    }

    /**
     * @readonly
     * @type {WT_G3x5_TrafficSystem}
     */
    get trafficSystem() {
        return this._trafficSystem;
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

    get motionVectorLookahead() {
        return this._motionVectorLookahead.readonly();
    }

    set motionVectorLookahead(time) {
        this._motionVectorLookahead.set(time);
    }
}
WT_G3x5_MapModelTrafficModule.NAME_DEFAULT = "traffic";
/**
 * @enum {Number}
 */
WT_G3x5_MapModelTrafficModule.AltitudeMode = {
    RELATIVE: 0,
    ABSOLUTE: 1
};
/**
 * @enum {Number}
 */
WT_G3x5_MapModelTrafficModule.AltitudeRestrictionMode = {
    UNRESTRICTED: 0,
    ABOVE: 1,
    NORMAL: 2,
    BELOW: 3
};
/**
 * @enum {Number}
 */
WT_G3x5_MapModelTrafficModule.MotionVectorMode = {
    OFF: 0,
    ABSOLUTE: 1,
    RELATIVE: 2
};
WT_G3x5_MapModelTrafficModule.OPTION_DEFS = {
    show: {default: true, auto: true},
    outerRange: {default: WT_Unit.NMILE.createNumber(0)},
    innerRange: {default: WT_Unit.NMILE.createNumber(0)},
    altitudeMode: {default: WT_G3x5_MapModelTrafficModule.AltitudeMode.RELATIVE, auto: true},
    altitudeRestrictionMode: {default: WT_G3x5_MapModelTrafficModule.AltitudeRestrictionMode.UNRESTRICTED, auto: true},
    altitudeRestrictionAbove: {default: WT_Unit.FOOT.createNumber(0)},
    altitudeRestrictionBelow: {default: WT_Unit.FOOT.createNumber(0)},
    motionVectorMode: {default: WT_G3x5_MapModelTrafficModule.MotionVectorMode.NONE, auto: true},
    motionVectorLookahead: {default: WT_Unit.SECOND.createNumber(60)}
};