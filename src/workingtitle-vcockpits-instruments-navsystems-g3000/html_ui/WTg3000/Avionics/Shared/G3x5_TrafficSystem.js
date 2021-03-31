class WT_G3x5_TrafficSystem {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_TrafficTracker} trafficTracker
     */
    constructor(airplane, trafficTracker) {
        this._airplane = airplane;

        this._protectedRadius = WT_Unit.NMILE.createNumber(0);
        this._protectedHeight = WT_Unit.FOOT.createNumber(0);

        this._updateProtectedZone();

        this._tas = new WT_TrafficAvoidanceSystem(airplane, this._protectedRadius, this._protectedHeight, trafficTracker);
        this._intrudersSorted = new WT_SortedArray(this._intruderComparator.bind(this));
        this._intrudersSortedReadOnly = new WT_ReadOnlyArray(this._intrudersSorted.array);

        this._lastUpdateTime = 0;
    }

    /**
     *
     * @param {WT_TASDistributedModelIntruder} a
     * @param {WT_TASDistributedModelIntruder} b
     * @returns {Number}
     */
    _intruderComparator(a, b) {
        // always sort intruders with valid predictions first
        if (a.isPredictionValid && !b.isPredictionValid) {
            return -1;
        } else if (!a.isPredictionValid && b.isPredictionValid) {
            return 1;
        } else if (a.isPredictionValid) {
            // always sort intruders predicted to violate protected zone first
            if (a.tcaNorm <= 1 && b.tcaNorm > 1) {
                return -1;
            } else if (a.tcaNorm > 1 && b.tcaNorm <= 1) {
                return 1;
            } else {
                // if both are predicted to violate protected zone, sort by TCA.
                // Otherwise sort by how close they approach the protected zone at TCA.
                let tcaComparison = a.tca.compare(b.tca);
                let normComparison = a.tcaNorm - b.tcaNorm;
                let firstComparison;
                let secondComparison;
                if (a.tca <= 1) {
                    firstComparison = tcaComparison;
                    secondComparison = normComparison;
                } else {
                    firstComparison = normComparison;
                    secondComparison = tcaComparison;
                }
                if (firstComparison === 0) {
                    return secondComparison;
                } else {
                    return firstComparison;
                }
            }
        } else {
            return 0;
        }
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<WT_TrafficAvoidanceSystemIntruder>}
     */
    get intruders() {
        return this._intrudersSortedReadOnly;
    }

    _updateProtectedZone() {
    }

    _updateTAS() {
        this._tas.ownAirplane.protectedRadius = this._protectedRadius;
        this._tas.ownAirplane.protectedHeight = this._protectedHeight;
        this._tas.update();
    }

    _updateIntrudersArray() {
        this._intrudersSorted.clear();
        this._tas.intruders.forEach(intruder => this._intrudersSorted.insert(intruder));
    }

    _doUpdate(currentTime) {
        this._updateProtectedZone();
        this._updateTAS();
        this._updateIntrudersArray();
        this._lastUpdateTime = currentTime;
    }

    update() {
        let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
        if (currentTime - this._lastUpdateTime >= WT_G3x5_TrafficSystem.UPDATE_INTERVAL) {
            this._doUpdate(currentTime);
        }
    }
}
WT_G3x5_TrafficSystem.ID = "G3x5_TrafficSystem";
WT_G3x5_TrafficSystem.UPDATE_INTERVAL = 1 // seconds