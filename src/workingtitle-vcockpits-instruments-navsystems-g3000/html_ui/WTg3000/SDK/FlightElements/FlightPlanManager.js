/**
 * A manager for an active and standby flight plan and direct-to.
 */
class WT_FlightPlanManager {
    /**
     * @param {Boolean} isMaster - whether to designate the new manager has the master flight plan manager. Only the
     *                             master flight plan manager may sync changes to the sim's built-in flight plan
     *                             manager.
     * @param {String} instrumentID - the ID string of the new manager's parent instrument.
     * @param {WT_PlayerAirplane} airplane - the player airplane.
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory - the waypoint factory used to create ICAO waypoint objects.
     */
    constructor(isMaster, instrumentID, airplane, icaoWaypointFactory) {
        this._isMaster = isMaster;
        this._instrumentID = instrumentID;
        this._airplane = airplane;
        this._icaoWaypointFactory = icaoWaypointFactory;

        this._active = new WT_FlightPlan(icaoWaypointFactory);
        this._standby = new WT_FlightPlan(icaoWaypointFactory);
        this._isSyncingStandby = false;
        this._standby.addListener(this._onStandbyFlightPlanChanged.bind(this));
        this._directTo = new WT_DirectTo();

        this._isActiveLocked = false;

        this._syncHandler = new WT_FlightPlanSyncHandler(icaoWaypointFactory);
        this._syncHandler.addListener(this._onSyncEvent.bind(this));

        this._asoboInterface = new WT_FlightPlanAsoboInterface(icaoWaypointFactory);
        this._lastActiveSyncTime = 0;

        this._activeLegCached = null;

        this._tempFeet = WT_Unit.FOOT.createNumber(0);
    }

    /**
     * Whether this manager is the master flight plan manager.
     * @readonly
     * @type {Boolean}
     */
    get isMaster() {
        return this._isMaster;
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

    /**
     * Syncs this manager's active flight plan from the sim's default flight plan manager.
     * @param {Boolean} [forceEnrouteSync] - whether to force syncing of the enroute segment from the sim's flight plan
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
     *
     * @param {WT_FlightPlanSyncHandler.Command} command
     * @param {WT_FlightPlanSyncHandler.EventType} type
     * @param {Object} [additionalData]
     * @returns {WT_FlightPlanSyncEvent}
     */
    _prepareEvent(command, type, additionalData) {
        let event = {
            sourceID: this._instrumentID,
            command: command,
            type: type
        };
        if (additionalData) {
            Object.assign(event, additionalData);
        }
        return event;
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
     * Sets the active flight plan's origin waypoint.
     * @param {WT_ICAOWaypoint} waypoint - the waypoint to set as the origin.
     */
    setActiveOrigin(waypoint) {
        this.setActiveOriginICAO(waypoint ? waypoint.icao : "");
    }

    /**
     * Sets the active flight plan's origin waypoint.
     * @param {String} icao - the ICAO string of the waypoint to set as the origin.
     */
    setActiveOriginICAO(icao) {
        if (icao === "") {
            throw new Error("Invalid waypoint ICAO to set as origin");
        }

        let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_ORIGIN, {
            icao: icao
        });
        this._syncHandler.fireEvent(syncEvent);
    }

    /**
     * Sets the active flight plan's destination waypoint.
     * @param {WT_ICAOWaypoint} waypoint - the waypoint to set as the destination.
     */
    async setActiveDestination(waypoint) {
        this.setActiveDestinationICAO(waypoint ? waypoint.icao : "");
    }

    /**
     * Sets the active flight plan's destination waypoint.
     * @param {String} icao - the ICAO string of the waypoint to set as the destination.
     */
    setActiveDestinationICAO(icao) {
        if (icao === "") {
            throw new Error("Invalid waypoint ICAO to set as destination");
        }

        let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_DESTINATION, {
            icao: icao
        });
        this._syncHandler.fireEvent(syncEvent);
    }

    /**
     * Removes the active flight plan's origin waypoint.
     */
    removeActiveOrigin() {
        let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_ORIGIN, {
            icao: ""
        });
        this._syncHandler.fireEvent(syncEvent);
    }

    /**
     * Removes the active flight plan's destination waypoint.
     */
    removeActiveDestination() {
        let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_DESTINATION, {
            icao: ""
        });
        this._syncHandler.fireEvent(syncEvent);
    }

    /**
     * Adds a waypoint to the active flight plan.
     * @param {WT_FlightPlan.Segment} segment - the flight plan segment to which to add the new waypoint.
     * @param {WT_ICAOWaypoint} waypoint - the waypoint to add.
     * @param {Number} [index] - the index within the specified flight plan segment at which to add the new waypoint.
     *                           If this argument is not supplied, the waypoint will be added to the end of the
     *                           segment.
     */
    addWaypointToActive(segment, waypoint, index) {
        return this.addWaypointICAOToActive(segment, waypoint ? waypoint.icao : "", index);
    }

    /**
     * Adds a waypoint to the active flight plan.
     * @param {WT_FlightPlan.Segment} segment - the flight plan segment to which to add the new waypoint.
     * @param {String} icao - the ICAO string of the waypoint to add.
     * @param {Number} [index] - the index within the specified flight plan segment at which to add the new waypoint.
     *                           If this argument is not supplied, the waypoint will be added to the end of the
     *                           segment.
     */
    addWaypointICAOToActive(segment, icao, index) {
        if (icao === "") {
            throw new Error("Invalid waypoint ICAO to add to the flight plan");
        }

        if (segment === WT_FlightPlan.Segment.ENROUTE) {
            let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_ENROUTE_INSERT_WAYPOINT, {
                icao: icao,
                index: index
            });
            this._syncHandler.fireEvent(syncEvent);
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
     */
    addAirwaySequenceToActive(segment, airway, enter, exit, index) {
        if (segment === WT_FlightPlan.Segment.ENROUTE) {
            let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_ENROUTE_INSERT_AIRWAY, {
                airwayName: airway.name,
                enterICAO: enter.icao,
                exitICAO: exit.icao,
                index: index
            });
            this._syncHandler.fireEvent(syncEvent);
        } else {
            throw new Error("Cannot add airway to a non-enroute segment");
        }
    }

    /**
     * Removes a flight plan element from the active flight plan.
     * @param {WT_FlightPlanElement} element - the element to remove.
     */
    removeFromActive(element) {
        if (element.flightPlan !== this.activePlan) {
            throw new Error("The provided element is not in the active flight plan.");
        }

        if (element.segment === WT_FlightPlan.Segment.ENROUTE) {
            let index = element.flightPlan.getEnroute().elements.indexOf(element);
            let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_ENROUTE_REMOVE_INDEX, {
                index: index
            });
            this._syncHandler.fireEvent(syncEvent);
        } else {
            throw new Error("Cannot remove element from a non-enroute segment");
        }
    }

    /**
     * Loads a departure procedure to the active flight plan.
     * @param {Number} departureIndex - the index of the departure to load.
     * @param {Number} enrouteTransitionIndex - the index of the enroute transition of the departure to load.
     * @param {Number} runwayTransitionIndex - the index of the runway transition of the departure to load.
     */
    loadDepartureToActive(departureIndex, enrouteTransitionIndex, runwayTransitionIndex) {
        if (!this.activePlan.isOriginAirport()) {
            throw new Error("Cannot add departure to a flight plan without an origin airport");
        }
        if (departureIndex < 0 || departureIndex >= this.activePlan.getOrigin().waypoint.departures.array.length) {
            throw new Error("Invalid departure index");
        }

        let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_DEPARTURE, {
            procedureIndex: departureIndex,
            enrouteTransitionIndex: enrouteTransitionIndex,
            runwayTransitionIndex: runwayTransitionIndex
        });
        this._syncHandler.fireEvent(syncEvent);
    }

    /**
     * Removes the departure procedure from the active flight plan.
     */
    removeDepartureFromActive() {
        let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_DEPARTURE, {
            procedureIndex: -1,
            enrouteTransitionIndex: -1,
            runwayTransitionIndex: -1
        });
        this._syncHandler.fireEvent(syncEvent);
    }

    /**
     * Loads an arrival procedure to the active flight plan.
     * @param {Number} arrivalIndex - the index of the arrival to load.
     * @param {Number} enrouteTransitionIndex - the index of the enroute transition of the arrival to load.
     * @param {Number} runwayTransitionIndex - the index of the runway transition of the arrival to load.
     */
    loadArrivalToActive(arrivalIndex, enrouteTransitionIndex, runwayTransitionIndex) {
        if (!this.activePlan.isDestinationAirport()) {
            throw new Error("Cannot add arrival to a flight plan without a destination airport");
        }
        if (arrivalIndex < 0 || arrivalIndex >= this.activePlan.getDestination().waypoint.arrivals.array.length) {
            throw new Error("Invalid arrival index");
        }

        let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_ARRIVAL, {
            procedureIndex: arrivalIndex,
            enrouteTransitionIndex: enrouteTransitionIndex,
            runwayTransitionIndex: runwayTransitionIndex
        });
        this._syncHandler.fireEvent(syncEvent);
    }

    /**
     * Removes the arrival procedure from the active flight plan.
     */
    removeArrivalFromActive() {
        let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_ARRIVAL, {
            procedureIndex: -1,
            enrouteTransitionIndex: -1,
            runwayTransitionIndex: -1
        });
        this._syncHandler.fireEvent(syncEvent);
    }

    /**
     * Loads an approach procedure to the active flight plan.
     * @param {Number} arrivalIndex - the index of the approach to load.
     * @param {Number} transitionIndex - the index of the transition of the approach to load.
     */
    loadApproachToActive(approachIndex, transitionIndex) {
        if (!this.activePlan.isDestinationAirport()) {
            throw new Error("Cannot add approach to a flight plan without a destination airport");
        }
        if (approachIndex < 0 || approachIndex >= this.activePlan.getDestination().waypoint.approaches.array.length) {
            throw new Error("Invalid approach index");
        }

        let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_APPROACH, {
            procedureIndex: approachIndex,
            transitionIndex: transitionIndex
        });
        this._syncHandler.fireEvent(syncEvent);
    }

    /**
     * Removes the approach procedure from the active flight plan.
     */
    removeApproachFromActive() {
        let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_APPROACH, {
            procedureIndex: -1,
            transitionIndex: -1
        });
        this._syncHandler.fireEvent(syncEvent);
    }

    /**
     * Sets a custom altitude restriction for a leg in the active flight plan.
     * @param {WT_FlightPlanLeg} leg - the leg for which to set the new altitude restriction.
     * @param {WT_NumberUnit} altitude - the new altitude restriction.
     */
    setCustomLegAltitudeInActive(leg, altitude) {
        if (leg.flightPlan !== this.activePlan) {
            throw new Error("The provided leg is not in the active flight plan.");
        }

        if (!altitude) {
            return;
        }

        let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_ALTITUDE, {
            index: leg.index,
            altitude: altitude.asUnit(WT_Unit.FOOT)
        });
        this._syncHandler.fireEvent(syncEvent);
    }

    /**
     * Removes the custom altitude restriction for a leg in the active flight plan.
     */
    removeCustomLegAltitudeInActive(leg) {
        if (leg.flightPlan !== this.activePlan) {
            throw new Error("The provided leg is not in the active flight plan.");
        }

        let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_REMOVE_ALTITUDE, {
            index: leg.index
        });
        this._syncHandler.fireEvent(syncEvent);
    }

    /**
     * Clears the active flight plan.
     */
    clearActivePlan() {
        let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVE_CLEAR_FLIGHT_PLAN);
        this._syncHandler.fireEvent(syncEvent);
    }

    /**
     * Activates the active flight plan's currently loaded approach procedure and syncs the active flight plan after
     * the approach has been activated.
     * @returns {Promise<void>} a Promise which will be fulfilled when the approach has been activated.
     */
    async activateApproach() {
        await this._asoboInterface.activateApproach();
        await this.syncActiveFromGame();
    }

    /**
     * Deactivates the active flight plan's currently active approach procedure and syncs the active flight plan after
     * the approach has been deactivated.
     * @returns {Promise<void>} a Promise which will be fulfilled when the approach has been deactivated.
     */
    async deactivateApproach() {
        await this._asoboInterface.deactivateApproach();
        await this.syncActiveFromGame();
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
     * Activates the standby flight plan. The currently active flight plan will be replaced by the standby flight plan.
     * The standby flight plan will remain unchanged.
     */
    activateStandby() {
        let event = this._prepareEvent(WT_FlightPlanSyncHandler.Command.REQUEST, WT_FlightPlanSyncHandler.EventType.ACTIVATE_STANDBY);
        this._syncHandler.fireEvent(event);
    }

    /**
     *
     * @param {WT_FlightPlanEvent} event
     */
    _onStandbyFlightPlanChanged(event) {
        if (this._isSyncingStandby) {
            // ignore changes made while syncing from another source to avoid sending unnecessary reflexive sync events
            return;
        }

        let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.SYNC, WT_FlightPlanSyncHandler.EventType.STANDBY_SYNC, {
            flightPlan: this.standbyPlan
        });
        this._syncHandler.fireEvent(syncEvent);
    }

    async _doSetOriginWithSync(icao) {
        if (this._isActiveLocked) {
            return;
        }

        this._isActiveLocked = true;
        try {
            if (icao === "") {
                await this._asoboInterface.removeOrigin();
            } else {
                await this._asoboInterface.setOrigin(icao);
            }

            let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_ORIGIN, {
                icao: icao
            });
            this._syncHandler.fireEvent(syncEvent);
        } catch (e) {
            console.log(e);
        }
        this._isActiveLocked = false;

        try {
            await this.syncActiveFromGame();
        } catch (e) {
            console.log(e);
        }
    }

    async _doSetOriginWithoutSync(icao) {
        try {
            await this.syncActiveFromGame();
        } catch (e) {
            console.log(e);
        }
    }

    async _doSetOrigin(icao) {
        if (this.isMaster) {
            await this._doSetOriginWithSync(icao);
        } else {
            await this._doSetOriginWithoutSync(icao);
        }
    }

    async _doSetDestinationWithSync(icao) {
        if (this._isActiveLocked) {
            return;
        }

        this._isActiveLocked = true;
        try {
            if (icao === "") {
                await this._asoboInterface.removeDestination();
            } else {
                await this._asoboInterface.setDestination(icao);
            }

            let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_DESTINATION, {
                icao: icao
            });
            this._syncHandler.fireEvent(syncEvent);
        } catch (e) {
            console.log(e);
        }
        this._isActiveLocked = false;

        try {
            await this.syncActiveFromGame();
        } catch (e) {
            console.log(e);
        }
    }

    async _doSetDestinationWithoutSync(icao) {
        try {
            await this.syncActiveFromGame();
        } catch (e) {
            console.log(e);
        }
    }

    async _doSetDestination(icao) {
        if (this.isMaster) {
            await this._doSetDestinationWithSync(icao);
        } else {
            await this._doSetDestinationWithoutSync(icao);
        }
    }

    async _doSetDepartureWithSync(procedureIndex, enrouteTransitionIndex, runwayTransitionIndex) {
        if (this._isActiveLocked) {
            return;
        }

        this._isActiveLocked = true;
        try {
            if (procedureIndex < 0) {
                await this._asoboInterface.removeDeparture();
            } else {
                await this._asoboInterface.loadDeparture(procedureIndex, enrouteTransitionIndex, runwayTransitionIndex);
            }

            let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_DEPARTURE, {
                procedureIndex: procedureIndex,
                enrouteTransitionIndex: enrouteTransitionIndex,
                runwayTransitionIndex: runwayTransitionIndex
            });
            this._syncHandler.fireEvent(syncEvent);
        } catch (e) {
            console.log(e);
        }
        this._isActiveLocked = false;

        try {
            await this.syncActiveFromGame();
        } catch (e) {
            console.log(e);
        }
    }

    async _doSetDepartureWithoutSync(procedureIndex, enrouteTransitionIndex, runwayTransitionIndex) {
        try {
            await this.syncActiveFromGame();
        } catch (e) {
            console.log(e);
        }
    }

    async _doSetDeparture(procedureIndex, enrouteTransitionIndex, runwayTransitionIndex) {
        if (this.isMaster) {
            await this._doSetDepartureWithSync(procedureIndex, enrouteTransitionIndex, runwayTransitionIndex);
        } else {
            await this._doSetDepartureWithoutSync(procedureIndex, enrouteTransitionIndex, runwayTransitionIndex);
        }
    }

    async _doInsertEnrouteWaypointWithSync(icao, index) {
        if (this._isActiveLocked) {
            return;
        }

        this._isActiveLocked = true;
        let leg;
        try {
            leg = await this.activePlan.insertWaypoint(WT_FlightPlan.Segment.ENROUTE, {icao: icao}, index);
            await this._asoboInterface.syncEnrouteLeg(leg);

            let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVE_ENROUTE_INSERT_WAYPOINT, {
                icao: icao,
                index: index
            });
            this._syncHandler.fireEvent(syncEvent);
        } catch (e) {
            console.log(e);
            if (leg) {
                // sync to the sim's built-in flight plan manager failed, so we need to remove the leg from the flight plan
                this.activePlan.removeElement(leg);
            }
        }
        this._isActiveLocked = false;
    }

    async _doInsertEnrouteWaypointWithoutSync(icao, index) {
        try {
            await this.activePlan.insertWaypoint(WT_FlightPlan.Segment.ENROUTE, {icao: icao}, index);
        } catch (e) {
            console.log(e);
        }
    }

    async _doInsertEnrouteWaypoint(icao, index) {
        if (this.isMaster) {
            await this._doInsertEnrouteWaypointWithSync(icao, index);
        } else {
            await this._doInsertEnrouteWaypointWithoutSync(icao, index);
        }
    }

    async _doInsertEnrouteAirwayWithSync(airwayName, enterICAO, exitICAO, index) {
        if (this._isActiveLocked) {
            return;
        }

        this._isActiveLocked = true;
        let sequence;
        try {
            sequence = await this.activePlan.insertAirway(WT_FlightPlan.Segment.ENROUTE, airwayName, enterICAO, exitICAO, index);
            await this._asoboInterface.syncEnrouteAirwaySequence(sequence);

            let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVE_ENROUTE_INSERT_AIRWAY, {
                airwayName: airwayName,
                enterICAO: enterICAO,
                exitICAO: exitICAO,
                index: index
            });
            this._syncHandler.fireEvent(syncEvent);
        } catch (e) {
            console.log(e);
            if (sequence) {
                // sync to the sim's built-in flight plan manager failed, so we need to remove the airway from the flight plan
                this.activePlan.removeElement(WT_FlightPlan.Segment.ENROUTE. sequence);
            }
        }
        this._isActiveLocked = false;
    }

    async _doInsertEnrouteAirwayWithoutSync(airwayName, enterICAO, exitICAO, index) {
        try {
            await this.activePlan.insertAirway(WT_FlightPlan.Segment.ENROUTE, airwayName, enterICAO, exitICAO, index);
        } catch (e) {
            console.log(e);
        }
    }

    async _doInsertEnrouteAirway(airwayName, enterICAO, exitICAO, index) {
        if (this.isMaster) {
            await this._doInsertEnrouteAirwayWithSync(airwayName, enterICAO, exitICAO, index);
        } else {
            await this._doInsertEnrouteAirwayWithoutSync(airwayName, enterICAO, exitICAO, index);
        }
    }

    async _doRemoveEnrouteElementWithSync(index) {
        if (this._isActiveLocked) {
            return;
        }

        let element = this.activePlan.getEnroute().elements.get(index);

        if (element) {
            this._isActiveLocked = true;
            try {
                if (element instanceof WT_FlightPlanLeg) {
                    await this._asoboInterface.removeLeg(element);
                } else if (element instanceof WT_FlightPlanAirwaySequence) {
                    await this._asoboInterface.removeAirwaySequence(element);
                }
                this.activePlan.removeByIndex(WT_FlightPlan.Segment.ENROUTE, index);

                let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVE_ENROUTE_REMOVE_INDEX, {
                    index: index
                });
                this._syncHandler.fireEvent(syncEvent);
            } catch (e) {
                console.log(e);
            }
            this._isActiveLocked = false;
        }
    }

    async _doRemoveEnrouteElementWithoutSync(index) {
        this.activePlan.removeByIndex(WT_FlightPlan.Segment.ENROUTE, index);
    }

    async _doRemoveEnrouteElement(index) {
        if (this.isMaster) {
            await this._doRemoveEnrouteElementWithSync(index);
        } else {
            await this._doRemoveEnrouteElementWithoutSync(index);
        }
    }

    async _doSetArrivalWithSync(procedureIndex, enrouteTransitionIndex, runwayTransitionIndex) {
        if (this._isActiveLocked) {
            return;
        }

        this._isActiveLocked = true;
        try {
            if (procedureIndex < 0) {
                await this._asoboInterface.removeArrival();
            } else {
                await this._asoboInterface.loadArrival(procedureIndex, enrouteTransitionIndex, runwayTransitionIndex);
            }

            let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_ARRIVAL, {
                procedureIndex: procedureIndex,
                enrouteTransitionIndex: enrouteTransitionIndex,
                runwayTransitionIndex: runwayTransitionIndex
            });
            this._syncHandler.fireEvent(syncEvent);
        } catch (e) {
            console.log(e);
        }
        this._isActiveLocked = false;

        try {
            await this.syncActiveFromGame();
        } catch (e) {
            console.log(e);
        }
    }

    async _doSetArrivalWithoutSync(procedureIndex, enrouteTransitionIndex, runwayTransitionIndex) {
        try {
            await this.syncActiveFromGame();
        } catch (e) {
            console.log(e);
        }
    }

    async _doSetArrival(procedureIndex, enrouteTransitionIndex, runwayTransitionIndex) {
        if (this.isMaster) {
            await this._doSetArrivalWithSync(procedureIndex, enrouteTransitionIndex, runwayTransitionIndex);
        } else {
            await this._doSetArrivalWithoutSync(procedureIndex, enrouteTransitionIndex, runwayTransitionIndex);
        }
    }

    async _doSetApproachWithSync(procedureIndex, transitionIndex) {
        if (this._isActiveLocked) {
            return;
        }

        this._isActiveLocked = true;
        try {
            if (procedureIndex < 0) {
                await this._asoboInterface.removeApproach();
            } else {
                await this._asoboInterface.loadApproach(procedureIndex, transitionIndex);
            }

            let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_APPROACH, {
                procedureIndex: procedureIndex,
                transitionIndex: transitionIndex
            });
            this._syncHandler.fireEvent(syncEvent);
        } catch (e) {
            console.log(e);
        }
        this._isActiveLocked = false;

        try {
            await this.syncActiveFromGame();
        } catch (e) {
            console.log(e);
        }
    }

    async _doSetApproachWithoutSync(procedureIndex, transitionIndex) {
        try {
            await this.syncActiveFromGame();
        } catch (e) {
            console.log(e);
        }
    }

    async _doSetApproach(procedureIndex, transitionIndex) {
        if (this.isMaster) {
            await this._doSetApproachWithSync(procedureIndex, transitionIndex);
        } else {
            await this._doSetApproachWithoutSync(procedureIndex, transitionIndex);
        }
    }

    async _doSetAltitudeWithSync(index, altitude) {
        if (this._isActiveLocked) {
            return;
        }

        let leg = this.activePlan.legs.get(index);
        if (!leg || leg.segment === WT_FlightPlan.Segment.APPROACH) { // sim does not let you set altitudes for approach legs
            return;
        }

        if (leg.segment === WT_FlightPlan.Segment.ENROUTE) {
            // no need to sync with the sim if modifying an enroute leg
            leg.altitudeConstraint.setCustomAltitude(this._tempFeet.set(altitude));
            let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_ALTITUDE, {
                index: index,
                altitude: altitude
            });
            this._syncHandler.fireEvent(syncEvent);
        } else {
            this._isActiveLocked = true;
            try {
                await this._asoboInterface.setLegAltitude(leg, this._tempFeet.set(altitude));

                let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_ALTITUDE, {
                    index: index,
                    altitude: altitude
                });
                this._syncHandler.fireEvent(syncEvent);
            } catch (e) {
                console.log(e);
            }
            this._isActiveLocked = false;

            try {
                await this.syncActiveFromGame();
            } catch (e) {
                console.log(e);
            }
        }
    }

    async _doSetAltitudeWithoutSync(index, altitude) {
        let leg = this.activePlan.legs.get(index);
        if (!leg || leg.segment === WT_FlightPlan.Segment.APPROACH) { // sim does not let you set altitudes for approach legs
            return;
        }

        if (leg.segment === WT_FlightPlan.Segment.ENROUTE) {
            // no need to sync with the sim if modifying an enroute leg
            leg.altitudeConstraint.setCustomAltitude(this._tempFeet.set(altitude));
        } else {
            try {
                await this.syncActiveFromGame();
            } catch (e) {
                console.log(e);
            }
        }
    }

    async _doSetAltitude(index, altitude) {
        if (this.isMaster) {
            await this._doSetAltitudeWithSync(index, altitude);
        } else {
            await this._doSetAltitudeWithoutSync(index, altitude);
        }
    }

    async _doRemoveAltitudeWithSync(index) {
        if (this._isActiveLocked) {
            return;
        }

        let leg = this.activePlan.legs.get(index);
        if (!leg || leg.segment === WT_FlightPlan.Segment.APPROACH) { // sim does not let you set altitudes for approach legs
            return;
        }

        if (leg.segment === WT_FlightPlan.Segment.ENROUTE) {
            // no need to sync with the sim if modifying an enroute leg
            leg.altitudeConstraint.removeCustomAltitude();
            let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVE_REMOVE_ALTITUDE, {
                index: index
            });
            this._syncHandler.fireEvent(syncEvent);
        } else {
            this._isActiveLocked = true;
            try {
                await this._asoboInterface.setLegAltitude(leg, null);

                let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVE_REMOVE_ALTITUDE, {
                    index: index
                });
                this._syncHandler.fireEvent(syncEvent);
            } catch (e) {
                console.log(e);
            }
            this._isActiveLocked = false;

            try {
                await this.syncActiveFromGame();
            } catch (e) {
                console.log(e);
            }
        }
    }

    async _doRemoveAltitudeWithoutSync(index) {
        let leg = this.activePlan.legs.get(index);
        if (!leg || leg.segment === WT_FlightPlan.Segment.APPROACH) { // sim does not let you set altitudes for approach legs
            return;
        }

        if (leg.segment === WT_FlightPlan.Segment.ENROUTE) {
            // no need to sync with the sim if modifying an enroute leg
            leg.altitudeConstraint.removeCustomAltitude();
        } else {
            try {
                await this.syncActiveFromGame();
            } catch (e) {
                console.log(e);
            }
        }
    }

    async _doRemoveAltitude(index) {
        if (this.isMaster) {
            await this._doRemoveAltitudeWithSync(index);
        } else {
            await this._doRemoveAltitudeWithoutSync(index);
        }
    }

    async _doClearFlightPlanWithSync() {
        if (this._isActiveLocked) {
            return;
        }

        this._isActiveLocked = true;
        try {
            await this._asoboInterface.clearFlightPlan();
            // only clear the enroute segment; the rest will be synced from the sim's built-in flight plan manager
            this.activePlan.removeByIndex(WT_FlightPlan.Segment.ENROUTE, 0, this.activePlan.getEnroute().length);

            let syncEvent = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVE_CLEAR_FLIGHT_PLAN);
            this._syncHandler.fireEvent(syncEvent);
        } catch (e) {
            console.log(e);
        }
        this._isActiveLocked = false;
    }

    async _doClearFlightPlanWithoutSync() {
        this.activePlan.removeByIndex(WT_FlightPlan.Segment.ENROUTE, 0, this.activePlan.getEnroute().length);
    }

    async _doClearFlightPlan() {
        if (this.isMaster) {
            await this._doClearFlightPlanWithSync();
        } else {
            await this._doClearFlightPlanWithoutSync();
        }
    }

    async _doActivateStandbyWithSync() {
        if (this._isActiveLocked) {
            return;
        }

        this._isActiveLocked = true;
        try {
            let tempFlightPlan = new WT_FlightPlan(this._icaoWaypointFactory);
            await this._asoboInterface.clearFlightPlan();
            if (this.standbyPlan.hasOrigin()) {
                await this._asoboInterface.setOrigin(this.standbyPlan.getOrigin().waypoint.icao);
            }
            if (this.standbyPlan.hasDestination()) {
                await this._asoboInterface.setDestination(this.standbyPlan.getDestination().waypoint.icao);
            }

            tempFlightPlan.copySegmentFrom(this.standbyPlan, WT_FlightPlan.Segment.ENROUTE);
            let enrouteElements = tempFlightPlan.getEnroute().elements;
            for (let i = 0; i < enrouteElements.length; i++) {
                let element = enrouteElements.get(i);
                if (element instanceof WT_FlightPlanLeg) {
                    await this._asoboInterface.syncEnrouteLeg(element);
                } else {
                    await this._asoboInterface.syncEnrouteAirwaySequence(element);
                }
            }
            this.activePlan.copyFrom(tempFlightPlan);

            if (this.standbyPlan.hasDeparture()) {
                let departureSegment = this.standbyPlan.getDeparture();
                await this._asoboInterface.loadDeparture(departureSegment.procedure.index, departureSegment.enrouteTransitionIndex, departureSegment.runwayTransitionIndex);
            }

            if (this.standbyPlan.hasArrival()) {
                let arrivalSegment = this.standbyPlan.getArrival();
                await this._asoboInterface.loadArrival(arrivalSegment.procedure.index, arrivalSegment.enrouteTransitionIndex, arrivalSegment.runwayTransitionIndex);
            }

            if (this.standbyPlan.hasApproach()) {
                let approachSegment = this.standbyPlan.getApproach();
                await this._asoboInterface.loadApproach(approachSegment.procedure.index, approachSegment.transitionIndex);
            }

            let event = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVATE_STANDBY);
            this._syncHandler.fireEvent(event);
        } catch (e) {
            console.log(e);

            // if activation fails, we need to clear the active flight plan so we don't leave it in an invalid state
            this.activePlan.clear();
            await this._asoboInterface.clearFlightPlan();
            let event = this._prepareEvent(WT_FlightPlanSyncHandler.Command.CONFIRM, WT_FlightPlanSyncHandler.EventType.ACTIVE_CLEAR_FLIGHT_PLAN);
            this._syncHandler.fireEvent(event);
        }
        this._isActiveLocked = false;

        try {
            await this.syncActiveFromGame();
        } catch (e) {
            console.log(e);
        }
    }

    async _doActivateStandbyWithoutSync() {
        // only need to copy over the enroute segment; the rest will be synced through the sim's built-in flight plan manager
        let tempFlightPlan = new WT_FlightPlan(this._icaoWaypointFactory);
        tempFlightPlan.copySegmentFrom(this.standbyPlan, WT_FlightPlan.Segment.ENROUTE);

        this.activePlan.copyFrom(tempFlightPlan);

        try {
            await this.syncActiveFromGame();
        } catch (e) {
            console.log(e);
        }
    }

    async _doActivateStandby() {
        if (this.isMaster) {
            await this._doActivateStandbyWithSync();
        } else {
            await this._doActivateStandbyWithoutSync();
        }
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     */
    async _doStandbySync(flightPlan) {
        this._isSyncingStandby = true;
        this.standbyPlan.copyFrom(flightPlan);
        this._isSyncingStandby = false;
    }

    /**
     *
     * @param {WT_FlightPlanSyncEvent} event
     */
    _onSyncEvent(event) {
        if ((event.command === WT_FlightPlanSyncHandler.Command.REQUEST && !this.isMaster) ||
            (event.command === WT_FlightPlanSyncHandler.Command.CONFIRM && this.isMaster)) {
            // only master FPM should respond to request commands
            // master FPM should not respond to confirm commands
            return;
        }
        if (event.command === WT_FlightPlanSyncHandler.Command.SYNC && event.sourceID === this._instrumentID) {
            // ignore sync commands from self
            return;
        }

        switch (event.type) {
            case WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_ORIGIN:
                this._doSetOrigin(event.icao);
                break;
            case WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_DESTINATION:
                this._doSetDestination(event.icao);
                break;
            case WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_DEPARTURE:
                this._doSetDeparture(event.procedureIndex, event.enrouteTransitionIndex, event.runwayTransitionIndex);
                break;
            case WT_FlightPlanSyncHandler.EventType.ACTIVE_ENROUTE_INSERT_WAYPOINT:
                this._doInsertEnrouteWaypoint(event.icao, event.index);
                break;
            case WT_FlightPlanSyncHandler.EventType.ACTIVE_ENROUTE_INSERT_AIRWAY:
                this._doInsertEnrouteAirway(event.airwayName, event.enterICAO, event.exitICAO, event.index);
                break;
            case WT_FlightPlanSyncHandler.EventType.ACTIVE_ENROUTE_REMOVE_INDEX:
                this._doRemoveEnrouteElement(event.index);
                break;
            case WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_ARRIVAL:
                this._doSetArrival(event.procedureIndex, event.enrouteTransitionIndex, event.runwayTransitionIndex);
                break;
            case WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_APPROACH:
                this._doSetApproach(event.procedureIndex, event.transitionIndex);
                break;
            case WT_FlightPlanSyncHandler.EventType.ACTIVE_SET_ALTITUDE:
                this._doSetAltitude(event.index, event.altitude);
                break;
            case WT_FlightPlanSyncHandler.EventType.ACTIVE_REMOVE_ALTITUDE:
                this._doRemoveAltitude(event.index);
                break;
            case WT_FlightPlanSyncHandler.EventType.ACTIVE_CLEAR_FLIGHT_PLAN:
                this._doClearFlightPlan();
                break;
            case WT_FlightPlanSyncHandler.EventType.ACTIVATE_STANDBY:
                this._doActivateStandby();
                break;
            case WT_FlightPlanSyncHandler.EventType.STANDBY_SYNC:
                this._doStandbySync(event.flightPlan);
                break;
        }
    }
}
WT_FlightPlanManager._tempNM = WT_Unit.NMILE.createNumber(0);
WT_FlightPlanManager._tempKnot = WT_Unit.KNOT.createNumber(0);
WT_FlightPlanManager._tempGeoPoint = new WT_GeoPoint(0, 0);

class WT_FlightPlanSyncHandler {
    /**
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     */
    constructor(icaoWaypointFactory) {
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._flightPlanSerializer = new WT_FlightPlanSerializer(icaoWaypointFactory);

        /**
         * @type {((event:WT_FlightPlanSyncEvent) => void)[]}
         */
        this._listeners = [];

        WT_CrossInstrumentEvent.addListener(WT_FlightPlanSyncHandler.EVENT_KEY, this._onCrossInstrumentEvent.bind(this));
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @returns {String}
     */
    _serializeFlightPlan(flightPlan) {
        return this._flightPlanSerializer.serialize(flightPlan);
    }

    /**
     *
     * @param {WT_FlightPlanSyncEvent} event
     * @returns {String}
     */
    _serialize(event) {
        let object;
        if (event.command === WT_FlightPlanSyncHandler.Command.SYNC) {
            object = {
                sourceID: event.sourceID,
                command: event.command,
                type: event.type,
                flightPlanString: this._serializeFlightPlan(event.flightPlan)
            };
        } else {
            object = event;
        }
        return JSON.stringify(object);
    }

    fireEvent(event) {
        let data = this._serialize(event);
        WT_CrossInstrumentEvent.fireEvent(WT_FlightPlanSyncHandler.EVENT_KEY, data);
    }

    /**
     *
     * @param {String} string
     * @returns {Promise<WT_FlightPlan>}
     */
    async _deserializeFlightPlan(string) {
        return this._flightPlanSerializer.deserialize(string, new WT_FlightPlan(this._icaoWaypointFactory));
    }

    /**
     *
     * @param {String} data
     */
    async _parseEventFromData(data) {
        let object = JSON.parse(data);
        if (object.command === WT_FlightPlanSyncHandler.Command.SYNC) {
            return {
                sourceID: object.sourceID,
                command: object.command,
                type: object.type,
                flightPlan: await this._deserializeFlightPlan(object.flightPlanString)
            };
        } else {
            return object;
        }
    }

    _notifyListeners(event) {
        this._listeners.forEach(listener => listener(event));
    }

    async _onCrossInstrumentEvent(key, data) {
        let event;
        try {
            event = await this._parseEventFromData(data);
        } catch (e) {
            console.log(e);
        }
        if (event) {
            this._notifyListeners(event);
        }
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
WT_FlightPlanSyncHandler.Command = {
    REQUEST: 0,
    CONFIRM: 1,
    SYNC: 2
}
/**
 * @enum {Number}
 */
WT_FlightPlanSyncHandler.EventType = {
    ACTIVE_SET_ORIGIN: 0,
    ACTIVE_SET_DESTINATION: 1,
    ACTIVE_SET_DEPARTURE: 2,
    ACTIVE_ENROUTE_INSERT_WAYPOINT: 3,
    ACTIVE_ENROUTE_INSERT_AIRWAY: 4,
    ACTIVE_ENROUTE_REMOVE_INDEX: 5,
    ACTIVE_SET_ARRIVAL: 6,
    ACTIVE_SET_APPROACH: 7,
    ACTIVE_SET_ALTITUDE: 8,
    ACTIVE_REMOVE_ALTITUDE: 9,
    ACTIVE_CLEAR_FLIGHT_PLAN: 10,
    ACTIVATE_STANDBY: 11,
    STANDBY_SYNC: 12
}

/**
 * @typedef WT_FlightPlanSyncEvent
 * @property {String} sourceID
 * @property {WT_FlightPlanSyncHandler.Command} command
 * @property {WT_FlightPlanSyncHandler.EventType} type
 * @property {String} [icao]
 * @property {String} [airwayName]
 * @property {String} [enterICAO]
 * @property {String} [exitICAO]
 * @property {Number} [index]
 * @property {WT_FlightPlan} [flightPlan]
 */