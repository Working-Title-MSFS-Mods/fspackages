class WT_AltitudeConstraint {
    constructor(type) {
        this._type = type;
    }

    /**
     * @readonly
     * @property {Number} type
     * @type {Number}
     */
    get type() {
        return this._type;
    }

    get ceiling() {
        return undefined;
    }

    get floor() {
        return undefined;
    }

    isInLimits(altitude) {
        return false;
    }

    equals(other) {
        return other instanceof WT_AltitudeConstraint && this.type === other.type;
    }
}
WT_AltitudeConstraint._CEILING = new WT_NumberUnit(Number.MAX_VALUE, WT_Unit.FOOT);
WT_AltitudeConstraint._FLOOR = new WT_NumberUnit(-Number.MAX_VALUE, WT_Unit.FOOT);
/**
 * @enum {Number}
 */
WT_AltitudeConstraint.Type = {
    NONE: 0,
    AT: 1,
    AT_OR_ABOVE: 2,
    AT_OR_BELOW: 3,
    BETWEEN: 4
};

class WT_NoAltitudeConstraint extends WT_AltitudeConstraint {
    constructor() {
        super(WT_AltitudeConstraint.Type.NONE);
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} ceiling
     * @type {WT_NumberUnitReadOnly}
     */
    get ceiling() {
        return WT_AltitudeConstraint._CEILING.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} floor
     * @type {WT_NumberUnitReadOnly}
     */
    get floor() {
        return WT_AltitudeConstraint._FLOOR.readonly();
    }

    /**
     *
     * @param {WT_NumberUnit} altitude
     * @returns {Boolean}
     */
    isInLimits(altitude) {
        return true;
    }
}

WT_AltitudeConstraint.NO_CONSTRAINT = new WT_NoAltitudeConstraint();

class WT_AtAltitude extends WT_AltitudeConstraint {
    /**
     * @param {WT_NumberUnit} altitude
     */
    constructor(altitude) {
        super(WT_AltitudeConstraint.Type.AT);

        this._altitude = new WT_NumberUnit(altitude.asUnit(WT_Unit.FOOT), WT_Unit.FOOT);
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} ceiling
     * @type {WT_NumberUnitReadOnly}
     */
    get ceiling() {
        return this._altitude.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} floor
     * @type {WT_NumberUnitReadOnly}
     */
    get floor() {
        return this._altitude.readonly();
    }

    /**
     *
     * @param {WT_NumberUnit} altitude
     * @returns {Boolean}
     */
    isInLimits(altitude) {
        return this._altitude.equals(altitude);
    }

    equals(other) {
        return super.equals(other) && this.floor.equals(other.floor);
    }
}

class WT_AtOrAboveAltitude extends WT_AltitudeConstraint {
    /**
     * @param {WT_NumberUnit} altitude
     */
    constructor(altitude) {
        super(WT_AltitudeConstraint.Type.AT_OR_ABOVE);

        this._altitude = new WT_NumberUnit(altitude.asUnit(WT_Unit.FOOT), WT_Unit.FOOT);
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} ceiling
     * @type {WT_NumberUnitReadOnly}
     */
    get ceiling() {
        return WT_AltitudeConstraint._CEILING.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} floor
     * @type {WT_NumberUnitReadOnly}
     */
    get floor() {
        return this._altitude.readonly();
    }

    /**
     *
     * @param {WT_NumberUnit} altitude
     */
    isInLimits(altitude) {
        return altitude.compare(this._altitude) >= 0;
    }

    equals(other) {
        return super.equals(other) && this.floor.equals(other.floor);
    }
}

class WT_AtOrBelowAltitude extends WT_AltitudeConstraint {
    /**
     * @param {WT_NumberUnit} altitude
     */
    constructor(altitude) {
        super(WT_AltitudeConstraint.Type.AT_OR_BELOW);

        this._altitude = new WT_NumberUnit(altitude.asUnit(WT_Unit.FOOT), WT_Unit.FOOT);
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} ceiling
     * @type {WT_NumberUnitReadOnly}
     */
    get ceiling() {
        return this._altitude.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} floor
     * @type {WT_NumberUnitReadOnly}
     */
    get floor() {
        return WT_AltitudeConstraint._FLOOR.readonly();
    }

    /**
     *
     * @param {WT_NumberUnit} altitude
     */
    isInLimits(altitude) {
        return altitude.compare(this._altitude) >= 0;
    }

    equals(other) {
        return super.equals(other) && this.ceiling.equals(other.ceiling);
    }
}

class WT_BetweenAltitude extends WT_AltitudeConstraint {
    /**
     * @param {WT_NumberUnit} altitude
     */
    constructor(floor, ceiling) {
        super(WT_AltitudeConstraint.Type.BETWEEN);

        this._floor = new WT_NumberUnit(floor.asUnit(WT_Unit.FOOT), WT_Unit.FOOT);
        this._ceiling = new WT_NumberUnit(ceiling.asUnit(WT_Unit.FOOT), WT_Unit.FOOT);
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} ceiling
     * @type {WT_NumberUnitReadOnly}
     */
    get ceiling() {
        return this._ceiling.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} floor
     * @type {WT_NumberUnitReadOnly}
     */
    get floor() {
        return this._floor.readonly();
    }

    /**
     *
     * @param {WT_NumberUnit} altitude
     */
    isInLimits(altitude) {
        return altitude.compare(this._floor) >= 0 && altitude.compare(this._ceiling) <= 0;
    }

    equals(other) {
        return super.equals(other) && this.floor.equals(other.floor) && this.ceiling.equals(other.ceiling);
    }
}