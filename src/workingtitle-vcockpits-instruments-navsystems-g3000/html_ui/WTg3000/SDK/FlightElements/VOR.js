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
        this._class = data.vorClass;
        this._frequency = {MHz: data.freqMHz, bcd16: data.freqBCD16};
        this._magVar = data.magneticVariation;
    }

    /**
     * @readonly
     * @property {WT_VOR.Type} vorType - the type of this VOR.
     * @type {WT_VOR.Type}
     */
    get vorType() {
        return this._vorType;
    }

    /**
     * @readonly
     * @property {WT_VOR.Class} class - the class of this VOR.
     * @type {WT_VOR.Class}
     */
    get class() {
        return this._class;
    }

    /**
     * @readonly
     * @property {{MHz:Number, bcd16:Number}} frequency - the frequency of this VOR, in MHz and BCD16 formats.
     * @type {{MHz:Number, bcd16:Number}}
     */
    get frequency() {
        return this._frequency;
    }

    /**
     * @readonly
     * @property {Number} magVar - the magnetic variation at this VOR.
     * @type {Number}
     */
    get magVar() {
        return this._magVar;
    }

    /**
     * @readonly
     * @property {WT_Airway[]} airways - a list of airways passing through this VOR.
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