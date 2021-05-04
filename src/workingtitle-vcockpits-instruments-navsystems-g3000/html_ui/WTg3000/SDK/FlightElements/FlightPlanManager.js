/**
 * A manager for an active and standby flight plan and direct-to.
 */
class WT_FlightPlanManager {
    /**
     * @param {String} instrumentID - the ID string of the new manager's parent instrument.
     * @param {WT_PlayerAirplane} airplane - the player airplane.
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory - the waypoint factory used to create ICAO waypoint objects.
     */
    constructor(instrumentID, airplane, icaoWaypointFactory) {
        this._instrumentID = instrumentID;
        this._airplane = airplane;
        this._icaoWaypointFactory = icaoWaypointFactory;

        this._active = new WT_FlightPlan(icaoWaypointFactory);
        this._standby = new WT_FlightPlan(icaoWaypointFactory);
        this._directTo = new WT_DirectTo();

        this._syncHandler = new WT_FlightPlanSyncHandler();
        this._syncHandler.addListener(this._onSyncEvent.bind(this));

        this._asoboInterface = new WT_FlightPlanAsoboInterface(icaoWaypointFactory);
        this._lastActiveSyncTime = 0;

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

    /**
     * The timestamp of the most recent time the active flight plan was synced from the game.
     * @readonly
     * @type {Number}
     */
    get lastActiveSyncTime() {
        return this._lastActiveSyncTime;
    }

    async copyToActive(flightPlan) {
        this._active.copyFrom(flightPlan);
        await this.syncActiveToGame();
    }

    async activateStandby() {
        await this.copyToActive(this._standby);
    }

    async syncActiveToGame() {
        await this._asoboInterface.syncToGame(this._active);
    }

    /**
     * Syncs this manager's active flight plan from the sim's default flight plan manager.
     * @param {Boolean} [forceEnrouteSyn] - whether to force syncing of the enroute segment from the sim's flight plan
     *                                      manager. False by default.
     * @returns {Promise<void>} a Promise which is fulfilled when the sync completes.
     */
    async syncActiveFromGame(forceEnrouteSync) {
        this._lastActiveSyncTime = Date.now();
        await this._asoboInterface.syncFromGame(this._active, this._directTo, forceEnrouteSync);

        if (!this.directTo.isActive()) {
            this._activeLegCached = await this._asoboInterface.getActiveLeg(this._active);
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
            });
        }
    }

    /**
     * Sets the active flight plan's origin waypoint and syncs the active flight plan after the origin has been
     * changed.
     * @param {WT_ICAOWaypoint} waypoint - the waypoint to set as the origin.
     * @returns {Promise<void>} a Promise which will be fulfilled when the origin has been successfully changed,
     *                          or rejected if the provided waypoint could not be set as the origin.
     */
    async setActiveOrigin(waypoint) {
        return this.setActiveOriginICAO(waypoint ? waypoint.icao : "");
    }

    /**
     * Sets the active flight plan's origin waypoint and syncs the active flight plan after the origin has been
     * changed.
     * @param {String} icao - the ICAO string of the waypoint to set as the origin.
     * @returns {Promise<void>} a Promise which will be fulfilled when the origin has been successfully changed,
     *                          or rejected if the provided string was not a valid ICAO string.
     */
    async setActiveOriginICAO(icao) {
        if (icao === "") {
            throw new Error("Invalid waypoint ICAO to set as origin");
        }

        await this._asoboInterface.setOrigin(icao);
        await this.syncActiveFromGame();
    }

    /**
     * Sets the active flight plan's destination waypoint and syncs the active flight plan after the destination has
     * been changed.
     * @param {WT_ICAOWaypoint} waypoint - the waypoint to set as the destination.
     * @returns {Promise<void>} a Promise which will be fulfilled when the destination has been successfully changed,
     *                          or rejected if the provided waypoint could not be set as the destination.
     */
    async setActiveDestination(waypoint) {
        return this.setActiveDestinationICAO(waypoint ? waypoint.icao : "");
    }

    /**
     * Sets the active flight plan's destination waypoint and syncs the active flight plan after the destination has
     * been changed.
     * @param {String} icao - the ICAO string of the waypoint to set as the destination.
     * @returns {Promise<void>} a Promise which will be fulfilled when the destination has been successfully changed,
     *                          or rejected if the provided string was not a valid ICAO string.
     */
    async setActiveDestinationICAO(icao) {
        if (icao === "") {
            throw new Error("Invalid waypoint ICAO to set as destination");
        }

        await this._asoboInterface.setDestination(icao);
        await this.syncActiveFromGame();
    }

    /**
     * Removes the active flight plan's origin waypoint and syncs the active flight plan after the origin has been
     * removed.
     * @returns {Promise<void>} a Promise which will be fulfilled when the origin has been removed.
     */
    async removeActiveOrigin() {
        await this._asoboInterface.removeOrigin();
        await this.syncActiveFromGame();
    }

    /**
     * Removes the active flight plan's destination waypoint and syncs the active flight plan after the destination has
     * been removed.
     * @returns {Promise<void>} a Promise which will be fulfilled when the destination has been removed.
     */
    async removeActiveDestination() {
        await this._asoboInterface.removeDestination();
        await this.syncActiveFromGame();
    }

    async _doInsertEnrouteWaypoint(icao, index) {
        let waypoint = await this._icaoWaypointFactory.getWaypoint(icao);
        return this.activePlan.insertWaypoint(WT_FlightPlan.Segment.ENROUTE, {waypoint: waypoint}, index);
    }

    async _doInsertEnrouteAirway(airwayName, enterICAO, exitICAO, index) {
        let enter = await this._icaoWaypointFactory.getWaypoint(enterICAO);
        let airway = enter.airways.find(airway => airway.name === airwayName);
        let exit = await this._icaoWaypointFactory.getWaypoint(exitICAO);
        return this.activePlan.insertAirway(WT_FlightPlan.Segment.ENROUTE, airway, enter, exit, index);
    }

    async _doRemoveEnrouteElement(index) {
        let element = this.activePlan.getEnroute().elements.get(index);
        if (element) {
            this.activePlan.removeByIndex(WT_FlightPlan.Segment.ENROUTE, index);
            return element;
        } else {
            return null;
        }
    }

    /**
     * Adds a waypoint to the active flight plan.
     * @param {WT_FlightPlan.Segment} segment - the flight plan segment to which to add the new waypoint.
     * @param {WT_ICAOWaypoint} waypoint - the waypoint to add.
     * @param {Number} [index] - the index within the specified flight plan segment at which to add the new waypoint.
     *                           If this argument is not supplied, the waypoint will be added to the end of the
     *                           segment.
     * @returns {Promise<void>} a Promise which will be fulfilled when the waypoint has been added, or rejected if the
     *                          waypoint could not be added.
     */
    async addWaypointToActive(segment, waypoint, index) {
        return this.addWaypointICAOToActive(segment, waypoint ? waypoint.icao : "", index);
    }

    /**
     * Adds a waypoint to the active flight plan.
     * @param {WT_FlightPlan.Segment} segment - the flight plan segment to which to add the new waypoint.
     * @param {String} icao - the ICAO string of the waypoint to add.
     * @param {Number} [index] - the index within the specified flight plan segment at which to add the new waypoint.
     *                           If this argument is not supplied, the waypoint will be added to the end of the
     *                           segment.
     * @returns {Promise<void>} a Promise which will be fulfilled when the waypoint has been added, or rejected if the
     *                          waypoint could not be added.
     */
    async addWaypointICAOToActive(segment, icao, index) {
        if (icao === "") {
            throw new Error("Invalid waypoint ICAO to add to the flight plan");
        }

        if (segment === WT_FlightPlan.Segment.ENROUTE) {
            let leg = await this._doInsertEnrouteWaypoint(icao, index);
            if (leg) {
                await this._asoboInterface.syncEnrouteLeg(leg);
                let syncEvent = {
                    sourceID: this._instrumentID,
                    type: WT_FlightPlanSyncHandler.EventType.ENROUTE_INSERT_WAYPOINT,
                    waypointICAO: icao,
                    index: index
                };
                this._syncHandler.fireEvent(syncEvent);
            }
        } else {
            throw new Error("Cannot add waypoint to a non-enroute segment");
        }
    }

    /**
     * Adds an airway sequence to the active flight plan.
     * @param {WT_FlightPlan.Segment} segment - the flight plan segment to which to add the airway sequence.
     * @param {WT_Airway} airway - the airway to which the sequence to be added belongs.
     * @param {WT_ICAOWaypoint} enter - the entry waypoint of the airway sequence.
     * @param {WT_ICAOWaypoint} exit - the exit waypoint of the airway sequence.
     * @param {Number} [index] - the index within the specified flight plan segment at which to add the airway
     *                           sequence. If this argument is not supplied, the waypoint will be added to the
     *                           end of the segment.
     * @returns {Promise<void>} a Promise which will be fulfilled when the airway sequence has been added, or rejected
     *                          if the sequence could not be added.
     */
    async addAirwaySequenceToActive(segment, airway, enter, exit, index) {
        if (segment === WT_FlightPlan.Segment.ENROUTE) {
            let sequence = await this._doInsertEnrouteAirway(airway.name, enter.icao, exit.icao, index);
            if (sequence) {
                await this._asoboInterface.syncEnrouteAirwaySequence(sequence);
                let syncEvent = {
                    sourceID: this._instrumentID,
                    type: WT_FlightPlanSyncHandler.EventType.ENROUTE_INSERT_AIRWAY,
                    airwayName: airway.name,
                    enterICAO: enter.icao,
                    exitICAO: exit.icao,
                    index: index
                };
                this._syncHandler.fireEvent(syncEvent);
            }
        } else {
            throw new Error("Cannot add airway to a non-enroute segment");
        }
    }

    /**
     * Removes a flight plan element from the active flight plan.
     * @param {WT_FlightPlanElement} element - the element to remove.
     * @returns {Promise<void>} a Promise which will be fulfilled when the element has been removed, or rejected if the
     *                          element could not be removed.
     */
    async removeFromActive(element) {
        if (element.flightPlan !== this.activePlan) {
            throw new Error("Attempted to remove a leg that was not in the active flight plan.");
        }

        if (element.segment === WT_FlightPlan.Segment.ENROUTE) {
            let index = element.flightPlan.getEnroute().elements.indexOf(element);
            if (element instanceof WT_FlightPlanLeg) {
                await this._asoboInterface.removeLeg(element);
            } else if (element instanceof WT_FlightPlanAirwaySequence) {
                await this._asoboInterface.removeAirwaySequence(element);
            }
            await this._doRemoveEnrouteElement(index);
            let syncEvent = {
                sourceID: this._instrumentID,
                type: WT_FlightPlanSyncHandler.EventType.ENROUTE_REMOVE_INDEX,
                index: index
            };
            this._syncHandler.fireEvent(syncEvent);
        } else {
            throw new Error("Cannot remove element from a non-enroute segment");
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

    /**
     * Sets the currently active flight plan leg and syncs the active flight plan after the active leg has been
     * changed.
     * @param {WT_FlightPlanLeg} leg - the leg to set as the active leg.
     * @returns {Promise<void>} a Promise which will be fulfilled when the active leg has been successfully changed, or
     *                          rejected if the provided leg was not able to be set as the active leg.
     */
    async setActiveLeg(leg) {
        if (leg.flightPlan !== this.activePlan) {
            throw new Error("Attempted to activate a leg that was not in the active flight plan.");
        }

        await this._asoboInterface.setActiveLeg(leg);
        await this.syncActiveFromGame();
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

    /**
     *
     * @param {WT_FlightPlanSyncEvent} event
     */
    _onSyncEvent(event) {
        if (event.sourceID === this._instrumentID) {
            return;
        }

        switch (event.type) {
            case WT_FlightPlanSyncHandler.EventType.ENROUTE_INSERT_WAYPOINT:
                this._doInsertEnrouteWaypoint(event.waypointICAO, event.index);
                break;
            case WT_FlightPlanSyncHandler.EventType.ENROUTE_INSERT_AIRWAY:
                this._doInsertEnrouteAirway(event.airwayName, event.enterICAO, event.exitICAO, event.index);
                break;
            case WT_FlightPlanSyncHandler.EventType.ENROUTE_REMOVE_INDEX:
                this._doRemoveEnrouteElement(event.index);
                break;
        }
        console.log(event);
        console.log(this.activePlan);
    }
}
WT_FlightPlanManager._tempNM = WT_Unit.NMILE.createNumber(0);
WT_FlightPlanManager._tempKnot = WT_Unit.KNOT.createNumber(0);
WT_FlightPlanManager._tempGeoPoint = new WT_GeoPoint(0, 0);

class WT_FlightPlanSyncHandler {
    constructor() {
        /**
         * @type {((event:WT_FlightPlanSyncEvent) => void)[]}
         */
        this._listeners = [];

        WT_CrossInstrumentEvent.addListener(WT_FlightPlanSyncHandler.EVENT_KEY, this._onCrossInstrumentEvent.bind(this));
    }

    fireEvent(event) {
        WT_CrossInstrumentEvent.fireEvent(WT_FlightPlanSyncHandler.EVENT_KEY, JSON.stringify(event))
    }

    /**
     *
     * @param {String} data
     */
    _parseEventFromData(data) {
        return JSON.parse(data);
    }

    _notifyListeners(event) {
        this._listeners.forEach(listener => listener(event));
    }

    _onCrossInstrumentEvent(key, data) {
        let event = this._parseEventFromData(data);
        this._notifyListeners(event);
    }

    /**
     *
     * @param {(event:WT_FlightPlanSyncEvent) => void} listener
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     *
     * @param {(event:WT_FlightPlanSyncEvent) => void} listener
     */
    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }
}
WT_FlightPlanSyncHandler.EVENT_KEY = "WT_FlightPlanSync";
/**
 * @enum {Number}
 */
WT_FlightPlanSyncHandler.EventType = {
    ENROUTE_INSERT_WAYPOINT: 0,
    ENROUTE_INSERT_AIRWAY: 1,
    ENROUTE_REMOVE_INDEX: 2
}

/**
 * @typedef WT_FlightPlanSyncEvent
 * @property {String} sourceID
 * @property {WT_FlightPlanSyncHandler.EventType} type
 * @property {String} [waypointICAO]
 * @property {String} [airwayName]
 * @property {String} [enterICAO]
 * @property {String} [exitICAO]
 * @property {Number} [index]
 */