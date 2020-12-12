/**
 * An intersection (fix).
 */
class WT_Intersection extends WT_ICAOWaypoint {
    constructor(data) {
        super(data, WT_ICAOWaypoint.Type.INT);
        this._airways = [];
    }

    /**
     * @readonly
     * @property {WT_Airway[]} airways - a list of airways passing through this intersection.
     * @type {WT_Airway[]}
     */
    get airways() {
        return this._airways;
    }
}