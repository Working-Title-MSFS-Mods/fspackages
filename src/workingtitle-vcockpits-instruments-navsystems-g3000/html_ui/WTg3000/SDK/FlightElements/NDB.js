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
        this._frequency = {MHz: data.freqMHz, bcd16: undefined};
    }

    /**
     * @readonly
     * @property {WT_NDB.Type} vorType - the type of this NDB.
     * @type {WT_NDB.Type}
     */
    get ndbType() {
        return this._ndbType;
    }

    /**
     * @readonly
     * @property {{MHz:Number, bcd16:Number}} frequency - the frequency of this NDB, in MHz and BCD16 formats.
     * @type {{MHz:Number, bcd16:Number}}
     */
    get frequency() {
        return this._frequency;
    }

    /**
     * @readonly
     * @property {WT_Airway[]} airways - a list of airways passing through this NDB.
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