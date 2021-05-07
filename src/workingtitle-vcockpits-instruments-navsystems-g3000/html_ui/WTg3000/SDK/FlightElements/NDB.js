/**
 * An NDB (non-directional beacon).
 */
class WT_NDB extends WT_ICAOWaypoint {
    constructor(data) {
        super(data, WT_ICAOWaypoint.Type.NDB);
        this._airways = [];
    }

    _initFromData(data) {
        super._initFromData(data);

        this._ndbType = data.type;
        this._frequency = new WT_Frequency(data.freqMHz, WT_Frequency.Prefix.KHz); // despite the property name implying the frequency is in MHz, it is actually reported in KHz
    }

    /**
     * The type of this NDB.
     * @readonly
     * @type {WT_NDB.Type}
     */
    get ndbType() {
        return this._ndbType;
    }

    /**
     * The frequency of this NDB.
     * @readonly
     * @type {WT_Frequency}
     */
    get frequency() {
        return this._frequency;
    }

    /**
     * A list of airways passing through this NDB.
     * @readonly
     * @type {WT_Airway[]}
     */
    get airways() {
        return this._airways;
    }
}
/**
 * NDB type.
 * @readonly
 * @enum {Number}
 */
WT_NDB.Type = {
    UNKNOWN: 0,
    COMPASS_LOC: 1,
    MED_HOMING: 2,
    HOMING: 3,
    HIGH_HOMING: 4
};