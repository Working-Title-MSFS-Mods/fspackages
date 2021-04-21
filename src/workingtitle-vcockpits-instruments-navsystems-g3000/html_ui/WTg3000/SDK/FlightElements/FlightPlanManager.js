/**
 * A manager for an active and standby flight plan and direct-to.
 */
class WT_FlightPlanManager {
    /**
     * @param {WT_PlayerAirplane} airplane - the player airplane.
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory - the waypoint factory used to create ICAO waypoint objects.
     */
    constructor(airplane, icaoWaypointFactory) {
        this._airplane = airplane;

        this._active = new WT_FlightPlan(icaoWaypointFactory);
        this._standby = new WT_FlightPlan(icaoWaypointFactory);
        this._directTo = new WT_DirectTo();

        this._interface = new WT_FlightPlanAsoboInterface(icaoWaypointFactory);

        this._activeLegCached = null;
    }

    /**
     * This manager's active flight plan.
     * @readonly
     * @type {WT_FlightPlan}
     */
    get activePlan() {
        return this._active;
    }

    /**
     * This manager's standby flight plan.
     * @readonly
     * @type {WT_FlightPlan}
     */
    get standbyPlan() {
        return this._standby;
    }

    /**
     * This manager's direct to.
     * @readonly
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

    /**
     * Syncs this manager's active flight plan from the sim's default flight plan manager.
     * @returns {Promise<void>} a Promise which is fulfilled when the sync completes.
     */
    async syncActiveFromGame() {
        await this._interface.syncFromGame(this._active, this._directTo);

        if (!this.directTo.isActive()) {
            this._activeLegCached = await this._interface.getActiveLeg(this._active);
        } else {
            this._activeLegCached = null;
        }
    }

    /**
     * Gets the waypoint of the currently active origin.
     * @param {Boolean} [cached] - whether to use cached data. If true, this method will immediately return a result
     *                             based on data cached from the last time the active flight plan was synced from the
     *                             sim. If false, this method will return a Promise which is fulfilled once the active
     *                             flight plan is synced and the result is available. False by default.
     * @returns {Promise<WT_Waypoint>|WT_Waypoint} the waypoint of the currently active origin, or a Promise which will
     * be fulfilled with the waypoint after the active flight plan is synced.
     */
    getOriginWaypoint(cached = false) {
        if (cached) {
            return this.activePlan.getOrigin().waypoint;
        } else {
            return new Promise(async resolve => {
                await this.syncActiveFromGame();
                resolve(this.activePlan.getOrigin().waypoint);
            });
        }
    }

    _getDestinationWaypoint() {
        if (!this.directTo.isActive() || this._getDirectToLeg()) {
            return this.activePlan.getDestination().waypoint;
        } else {
            return this.directTo.getDestination();
        }
    }

    /**
     * Gets the waypoint of the currently active destination.
     * @param {Boolean} [cached] - whether to use cached data. If true, this method will immediately return a result
     *                             based on data cached from the last time the active flight plan was synced from the
     *                             sim. If false, this method will return a Promise which is fulfilled once the active
     *                             flight plan is synced and the result is available. False by default.
     * @returns {Promise<WT_Waypoint>|WT_Waypoint} the waypoint of the currently active destination, or a Promise which
     *          which will be fulfilled with the waypoint after the active flight plan is synced.
     */
    getDestinationWaypoint(cached = false) {
        if (cached) {
            return this._getDestinationWaypoint();
        } else {
            return new Promise(async resolve => {
                await this.syncActiveFromGame();
                resolve(this._getDestinationWaypoint());
            })
        }
    }

    /**
     * Gets the currently active flight plan leg. If there is no active flight plan leg, null is returned instead.
     * @param {Boolean} [cached] - whether to use cached data. If true, this method will immediately return a result
     *                             based on data cached from the last time the active flight plan was synced from the
     *                             sim. If false, this method will return a Promise which is fulfilled once the active
     *                             flight plan is synced and the result is available. False by default.
     * @returns {Promise<WT_FlightPlanLeg>|WT_FlightPlanLeg} the currently active flight plan leg, or a Promise which
     *          will be fulfilled with the leg after the active flight plan is synced.
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
        let leg = this.activePlan.legs.find(leg => leg.fix.equals(waypoint));
        return leg ? leg : null;
    }

    /**
     * Gets the leg in the active flight plan to which the currently active direct-to is directed. If a direct-to is
     * not active or the direct-to destination is not in the active flight plan, null is returned instead.
     * @param {Boolean} [cached] - whether to use cached data. If true, this method will immediately return a result
     *                             based on data cached from the last time the active flight plan was synced from the
     *                             sim. If false, this method will return a Promise which is fulfilled once the active
     *                             flight plan is synced and the result is available. False by default.
     * @returns {Promise<WT_FlightPlanLeg>|WT_FlightPlanLeg} the leg in the active flight plan to which the currently
     *          active direct-to is directed, or a Promise which will be fulfilled with the leg after the active flight
     *          plan is synced.
     */
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
     * @param {WT_GeoPoint} location
     */
    _distanceToLocation(location) {
        if (location) {
            return location.distance(this._airplane.navigation.position(WT_FlightPlanManager._tempGeoPoint));
        } else {
            return 0;
        }
    }

    /**
     *
     * @param {WT_NumberUnit} distance
     * @param {WT_NumberUnit} [reference]
     * @returns {WT_NumberUnit}
     */
    _timeToDistance(distance, reference) {
        let time = distance.asUnit(WT_Unit.NMILE) / this._airplane.navigation.groundSpeed(WT_FlightPlanManager._tempKnot).asUnit(WT_Unit.KNOT);
        if (!reference) {
            reference = WT_Unit.SECOND.createNumber(0);
        }
        return reference.set(time, WT_Unit.HOUR);
    }

    /**
     *
     * @param {WT_FlightPlanLeg} activeLeg
     * @param {WT_NumberUnit} [reference]
     */
    _distanceToActiveLegFix(reference) {
        if (!this._activeLegCached) {
            return undefined;
        }

        let distance;
        if (this.directTo.isActive()) {
            distance = this._distanceToLocation(this._activeLegCached.fix.location);
        } else {
            let gpsLat = SimVar.GetSimVarValue("GPS WP NEXT LAT", "degrees");
            let gpsLong = SimVar.GetSimVarValue("GPS WP NEXT LON", "degrees");
            let activeStep = this._activeLegCached.firstStep();
            let completedDistance = activeStep.distance.asUnit(WT_Unit.GA_RADIAN);
            while (!activeStep.endpoint.equals(this._activeLegCached.endpoint)) {
                if (activeStep.endpoint.distance(gpsLat, gpsLong) < 1e-6) {
                    break;
                }
                activeStep = activeStep.next();
                completedDistance += activeStep.distance.asUnit(WT_Unit.GA_RADIAN);
            }
            distance = this._activeLegCached.distance.asUnit(WT_Unit.GA_RADIAN) - completedDistance + this._distanceToLocation(activeStep.endpoint);
        }

        if (!reference) {
            reference = WT_Unit.NMILE.createNumber(0);
        }
        return reference.set(distance, WT_Unit.GA_RADIAN);
    }

    /**
     * Gets the remaining distance to the terminator fix of the currently active flight plan leg. If there is no active
     * flight plan leg, undefined is returned instead.
     * @param {Boolean} [cached] - whether to use cached data. If true, this method will immediately return a result
     *                             based on data cached from the last time the active flight plan was synced from the
     *                             sim. If false, this method will return a Promise which is fulfilled once the active
     *                             flight plan is synced and the result is available. False by default.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *                                      new WT_NumberUnit object will be created with units of nautical miles.
     * @returns {Promise<WT_NumberUnit>|WT_NumberUnit} the remaining distance to the terminator fix of the currently
     *          active flight plan leg, or a Promise which will be fulfilled with the distance after the active flight
     *          plan is synced.
     */
    distanceToActiveLegFix(cached = false, reference) {
        if (cached) {
            return this._distanceToActiveLegFix(reference);
        } else {
            return new Promise(async resolve => {
                await this.syncActiveFromGame();
                resolve(this._distanceToActiveLegFix(reference));
            });
        }
    }

    _timeToActiveLegFix(reference) {
        if (this._airplane.sensors.isOnGround()) {
            return undefined;
        }

        let distance = this._distanceToActiveLegFix(WT_FlightPlanManager._tempNM);
        if (!distance) {
            return undefined;
        }

        return this._timeToDistance(distance, reference);
    }

    /**
     * Gets the estimated time enroute to the terminator fix of the currently active flight plan leg. If there is no
     * active flight plan leg or the plane is on the ground, undefined is returned instead.
     * @param {Boolean} [cached] - whether to use cached data. If true, this method will immediately return a result
     *                             based on data cached from the last time the active flight plan was synced from the
     *                             sim. If false, this method will return a Promise which is fulfilled once the active
     *                             flight plan is synced and the result is available. False by default.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *                                      new WT_NumberUnit object will be created with units of seconds.
     * @returns {Promise<WT_NumberUnit>|WT_NumberUnit} the estimated time enroute to the terminator fix of the
     *          currently active flight plan leg, or a Promise which will be fulfilled with the time after the active
     *          flight plan is synced.
     */
    timeToActiveLegFix(cached = false, reference) {
        if (cached) {
            return this._timeToActiveLegFix(reference);
        } else {
            return new Promise(async resolve => {
                await this.syncActiveFromGame();
                resolve(this._timeToActiveLegFix(reference));
            })
        }
    }

    /**
     *
     * @param {WT_NumberUnit} reference
     */
    _distanceToDestination(reference) {
        if (!this.directTo.isActive() && !this.activePlan.hasDestination()) {
            return undefined;
        }

        let distance = reference ? reference : WT_Unit.NMILE.createNumber(0);
        if (this.directTo.isActive()) {
            let leg = this._getDirectToLeg();
            distance.set(this._distanceToLocation(this.directTo.getDestination().location), WT_Unit.GA_RADIAN);
            if (leg) {
                distance.add(this.activePlan.totalDistance()).subtract(leg.cumulativeDistance);
            }
        } else {
            this._distanceToActiveLegFix(distance);
            distance.add(this.activePlan.totalDistance()).subtract(this._activeLegCached ? this._activeLegCached.cumulativeDistance : 0);
        }
        return distance;
    }

    /**
     * Gets the remaining distance to the currently active destination. If there is no active destination, undefined
     * is returned instead.
     * @param {Boolean} [cached] - whether to use cached data. If true, this method will immediately return a result
     *                             based on data cached from the last time the active flight plan was synced from the
     *                             sim. If false, this method will return a Promise which is fulfilled once the active
     *                             flight plan is synced and the result is available. False by default.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *                                      new WT_NumberUnit object will be created with units of nautical miles.
     * @returns {Promise<WT_NumberUnit>|WT_NumberUnit} the remaining distance to the currently active destination, or
     *          a Promise which will be fulfilled with the distance after the active flight plan is synced.
     */
    distanceToDestination(cached = false, reference) {
        if (cached) {
            return this._distanceToDestination(reference);
        } else {
            return new Promise(async resolve => {
                await this.syncActiveFromGame();
                resolve(this._distanceToDestination(reference));
            });
        }
    }

    _timeToDestination(reference) {
        if (this._airplane.sensors.isOnGround()) {
            return undefined;
        }

        let distance = this._distanceToDestination(WT_FlightPlanManager._tempNM);
        if (!distance) {
            return undefined;
        }

        return this._timeToDistance(distance, reference);
    }

    /**
     * Gets the estimated time enroute to the currently active destination. If there is no active destination or the
     * plane is on the ground, undefined is returned instead.
     * @param {Boolean} [cached] - whether to use cached data. If true, this method will immediately return a result
     *                             based on data cached from the last time the active flight plan was synced from the
     *                             sim. If false, this method will return a Promise which is fulfilled once the active
     *                             flight plan is synced and the result is available. False by default.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *                                      new WT_NumberUnit object will be created with units of seconds.
     * @returns {Promise<WT_NumberUnit>|WT_NumberUnit} the estimated time enroute to the currently active destination,
     *          or a Promise which will be fulfilled with the time after the active flight plan is synced.
     */
    timeToDestination(cached = false, reference) {
        if (cached) {
            return this._timeToDestination(reference);
        } else {
            return new Promise(async resolve => {
                await this.syncActiveFromGame();
                resolve(this._timeToDestination(reference));
            });
        }
    }

    _distanceToDirectTo(reference) {
        if (!this.directTo.isActive()) {
            return undefined;
        }

        if (!reference) {
            reference = WT_Unit.NMILE.createNumber(0);
        }
        let distance = this._distanceToLocation(this.directTo.getDestination().location);
        return reference.set(distance, WT_Unit.GA_RADIAN);
    }

    /**
     * Gets the remaining distance to the destination waypoint of the currently active direct-to. If direct-to is not
     * active, undefined is returned instead.
     * @param {Boolean} [cached] - whether to use cached data. If true, this method will immediately return a result
     *                             based on data cached from the last time the active flight plan was synced from the
     *                             sim. If false, this method will return a Promise which is fulfilled once the active
     *                             flight plan is synced and the result is available. False by default.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *                                      new WT_NumberUnit object will be created with units of nautical miles.
     * @returns {Promise<WT_NumberUnit>|WT_NumberUnit} the remaining distance to the currently active direct-to, or
     *          a Promise which will be fulfilled with the distance after the active flight plan is synced.
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

    _timeToDirectTo(reference) {
        if (this._airplane.sensors.isOnGround()) {
            return undefined;
        }

        let distance = this._distanceToDirectTo(WT_FlightPlanManager._tempNM);
        if (!distance) {
            return undefined;
        }

        return this._timeToDistance(distance, reference);
    }

    /**
     * Gets the estimated time enroute to the destination waypoint of the currently active direct-to. If there is
     * no active destination or the plane is on the ground, undefined is returned instead.
     * @param {Boolean} [cached] - whether to use cached data. If true, this method will immediately return a result
     *                             based on data cached from the last time the active flight plan was synced from the
     *                             sim. If false, this method will return a Promise which is fulfilled once the active
     *                             flight plan is synced and the result is available. False by default.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *                                      new WT_NumberUnit object will be created with units of seconds.
     * @returns {Promise<WT_NumberUnit>|WT_NumberUnit} the estimated time enroute to destination waypoint of the
     *          currently active direct-to, or a Promise which will be fulfilled with the time after the active flight
     *          plan is synced.
     */
    timeToDirectTo(cached = false, reference) {
        if (cached) {
            return this._timeToDirectTo(reference);
        } else {
            return new Promise(async resolve => {
                await this.syncActiveFromGame();
                resolve(this._timeToDirectTo(reference));
            })
        }
    }
}
WT_FlightPlanManager._tempNM = WT_Unit.NMILE.createNumber(0);
WT_FlightPlanManager._tempKnot = WT_Unit.KNOT.createNumber(0);
WT_FlightPlanManager._tempGeoPoint = new WT_GeoPoint(0, 0);