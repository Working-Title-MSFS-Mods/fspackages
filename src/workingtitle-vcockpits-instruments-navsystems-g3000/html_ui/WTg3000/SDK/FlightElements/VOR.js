/**
 * A VOR (VHF omnidirectional range) station.
 */
class WT_VOR extends WT_ICAOWaypoint {
    constructor(data) {
        super(data, WT_ICAOWaypoint.Type.VOR);
        this._airways = [];
    }

    _initFromData(data) {
        super._initFromData(data);

        this._vorType = data.type;
        this._vorClass = data.vorClass;
        this._frequency = new WT_Frequency(data.freqMHz, WT_Frequency.Prefix.MHz);
        this._magVar = (-data.magneticVariation + 540) % 360 - 180; // coerce values to range -180 to 180.
    }

    /**
     * The type of this VOR.
     * @readonly
     * @type {WT_VOR.Type}
     */
    get vorType() {
        return this._vorType;
    }

    /**
     * The class of this VOR.
     * @readonly
     * @type {WT_VOR.Class}
     */
    get vorClass() {
        return this._vorClass;
    }

    /**
     * The frequency of this VOR.
     * @readonly
     * @type {WT_Frequency}
     */
    get frequency() {
        return this._frequency;
    }

    /**
     * The magnetic variation at this VOR.
     * @readonly
     * @type {Number}
     */
    get magVar() {
        return this._magVar;
    }

    /**
     * A list of airways passing through this VOR.
     * @readonly
     * @type {WT_Airway[]}
     */
    get airways() {
        return this._airways;
    }
}
/**
 * VOR type.
 * @readonly
 * @enum {Number}
 */
WT_VOR.Type = {
    UNKNOWN: 0,
    VOR: 1,
    VOR_DME: 2,
    DME: 3,
    TACAN: 4,
    VORTAC: 5,
    ILS: 6,
    VOT: 7
};
/**
 * VOR class.
 * @readonly
 * @enum {Number}
 */
WT_VOR.Class = {
    UNKNOWN: 0,
    TERMINAL: 1,
    LOW_ALT: 2,
    HIGH_ALT: 3,
    ILS: 4,
    VOT: 5
};