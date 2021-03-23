class WT_FlightPlanManager {
    constructor(airplane, icaoWaypointFactory) {
        this._airplane = airplane;

        this._active = new WT_FlightPlan(icaoWaypointFactory);
        this._standby = new WT_FlightPlan(icaoWaypointFactory);
        this._directTo = new WT_DirectTo();

        this._interface = new WT_FlightPlanAsoboInterface(icaoWaypointFactory);

        /**
         * @type {WT_FlightPlanLeg[]}
         */
        this._activePlanLegsCached = [];
        this._activeLegCached = null;
    }

    /**
     * @readonly
     * @property {WT_FlightPlan} activePlan
     * @type {WT_FlightPlan}
     */
    get activePlan() {
        return this._active;
    }

    /**
     * @readonly
     * @property {WT_FlightPlan} standbyPlan
     * @type {WT_FlightPlan}
     */
    get standbyPlan() {
        return this._standby;
    }

    /**
     * @readonly
     * @property {WT_DirectTo} directTo
     * @type {WT_DirectTo}
     */
    get directTo() {
        return this._directTo;
    }

    async copyToActive(flightPlan) {
        this._active.copyFrom(flightPlan);
        await this.syncActiveToGame();
    }

    async activateStandby() {
        await this.copyToActive(this._standby);
    }

    async syncActiveToGame() {
        await this._interface.syncToGame(this._active);
    }

    async syncActiveFromGame() {
        await this._interface.syncFromGame(this._active, this._directTo);
        this._activePlanLegsCached = this._active.legs();

        if (!this.directTo.isActive()) {
            this._activeLegCached = await this._interface.getActiveLeg(this._active);
        } else {
            this._activeLegCached = null;
        }
    }

    /**
     *
     * @param {Boolean} [cached]
     * @returns {Promise<WT_FlightPlanLeg>|WT_FlightPlanLeg}
     */
    getActiveLeg(cached = false) {
        if (cached) {
            return this._activeLegCached;
        } else {
            return new Promise(async resolve => {
                await this.syncActiveFromGame();
                resolve(this._activeLegCached);
            });
        }
    }

    _getDirectToLeg() {
        if (!this.directTo.isActive()) {
            return null;
        }

        let waypoint = this.directTo.getDestination();
        let leg = this._activePlanLegsCached.find(leg => leg.fix.equals(waypoint));
        return leg ? leg : null;
    }

    getDirectToLeg(cached = false) {
        if (cached) {
            return this._getDirectToLeg();
        } else {
            return new Promise(async resolve => {
                await this.syncActiveFromGame();
                resolve(this._getDirectToLeg());
            })
        }
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    _distanceToWaypoint(waypoint) {
        if (waypoint) {
            return waypoint.location.distance(this._airplane.navigation.position(WT_FlightPlanManager._tempGeoPoint));
        } else {
            return 0;
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} activeLeg
     * @param {WT_NumberUnit} reference
     */
    _distanceToActiveFix(activeLeg, reference) {
        let distance = this._distanceToWaypoint(activeLeg ? activeLeg.fix : null);
        if (!reference) {
            reference = WT_Unit.NMILE.createNumber(0);
        }
        return reference.set(distance, WT_Unit.GA_RADIAN);
    }

    /**
     * @param {Boolean} [cached]
     * @param {WT_NumberUnit} [reference]
     * @returns {Promise<WT_NumberUnit>|WT_NumberUnit}
     */
    distanceToActiveFix(cached = false, reference) {
        if (cached) {
            return this._distanceToActiveFix(this._activeLegCached, reference);
        } else {
            return new Promise(async resolve => {
                let leg = await this.getActiveLeg();
                resolve(this._distanceToActiveFix(leg, reference));
            });
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} activeLeg
     * @param {WT_NumberUnit} reference
     */
    _distanceToDestination(activeLeg, reference) {
        let distance = this._distanceToActiveFix(activeLeg, reference);
        return distance.add(this.activePlan.totalDistance()).subtract(activeLeg ? activeLeg.cumulativeDistance : 0);
    }

    /**
     *
     * @param {Boolean} [cached]
     * @param {WT_NumberUnit} [reference]
     * @returns {Promise<WT_NumberUnit>|WT_NumberUnit}
     */
    distanceToDestination(cached = false, reference) {
        if (cached) {
            return this._distanceToDestination(this._activeLegCached, reference);
        } else {
            return new Promise(async resolve => {
                let leg = await this.getActiveLeg();
                resolve(this._distanceToDestination(leg, reference));
            });
        }
    }

    _distanceToDirectTo(reference) {
        if (!reference) {
            reference = WT_Unit.NMILE.createNumber(0);
        }
        let distance = this._distanceToWaypoint(this.directTo.isActive() ? this.directTo.getDestination() : null);
        return reference.set(distance, WT_Unit.GA_RADIAN);
    }

    /**
     *
     * @param {Boolean} [cached]
     * @param {WT_NumberUnit} [reference]
     * @returns {Promise<WT_NumberUnit>|WT_NumberUnit}
     */
    distanceToDirectTo(cached = false, reference) {
        if (cached) {
            return this._distanceToDirectTo(reference);
        } else {
            return new Promise(async resolve => {
                await this.syncActiveFromGame();
                resolve(this._distanceToDirectTo(reference));
            })
        }
    }
}
WT_FlightPlanManager._tempGeoPoint = new WT_GeoPoint(0, 0);