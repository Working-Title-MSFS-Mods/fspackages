class WT_FlightPlanAsoboInterface {
    /**
     *
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @param {FlightPlanManager} asoboFPM
     */
    constructor(icaoWaypointFactory, asoboFPM) {
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._asoboFPM = asoboFPM;
        RegisterViewListener("JS_LISTENER_FLIGHTPLAN");
    }

    /**
     * @readonly
     * @type {FlightPlanManager}
     */
    get asoboFPM() {
        return this._asoboFPM;
    }

    async getGameActiveWaypointIndex() {
        return Coherent.call("GET_ACTIVE_WAYPOINT_INDEX");
    }

    getGameActiveWaypointIdent() {
        return SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
    }

    isApproachActive() {
        return SimVar.GetSimVarValue("C:fs9gps:FlightPlanIsActiveApproach", "Bool");
    }

    updateAsoboFPM() {
        return new Promise(resolve => {
            this._asoboFPM.updateFlightPlan(resolve);
        });
    }

    _asoboHasOrigin() {
        return SimVar.GetSimVarValue("L:Glasscockpits_FPLHaveOrigin", "boolean") !== 0;
    }

    _asoboHasDestination() {
        return SimVar.GetSimVarValue("L:Glasscockpits_FPLHaveDestination", "boolean") !== 0;
    }

    async _getWaypointEntriesFromData(data, array) {
        for (let i = 0; i < data.length; i++) {
            let leg = data[i];
            let waypoint = null;
            try {
                waypoint = await this._icaoWaypointFactory.getWaypoint(leg.icao);
            } catch (e) {
                if (leg.lla) {
                    waypoint = new WT_CustomWaypoint(leg.ident, leg.lla);
                }
            }
            if (waypoint) {
                if (waypoint instanceof WT_ICAOWaypoint && waypoint.location.distance(leg.lla) > 0.0001) {
                    // sometimes Asobo will rename custom "USR" waypoints to match the ICAO of the previous waypoint
                    waypoint = new WT_CustomWaypoint("USR", leg.lla);
                }

                let entry = {waypoint: waypoint};
                if (leg.transitionLLas && leg.transitionLLas.length > 1) {
                    entry.steps = leg.transitionLLas.slice(0, leg.transitionLLas.length - 1).map(lla => new WT_GeoPoint(lla.lat, lla.long));
                }
                array.push(entry);
            }
        }
    }

    async _syncFlightPlan(flightPlan, data, approachData, forceDRCTDestination) {
        let tempFlightPlan = new WT_FlightPlan(this._icaoWaypointFactory);

        let origin;
        let firstICAO = data.waypoints[0].icao;
        if (this._asoboHasOrigin()) {
            origin = await this._icaoWaypointFactory.getWaypoint(firstICAO);
            tempFlightPlan.setOrigin(origin);
        }
        let lastICAO = data.waypoints[data.waypoints.length - 1].icao;
        let destination;
        if (data.waypoints.length > 1 && (forceDRCTDestination || this._asoboHasDestination())) {
            destination = await this._icaoWaypointFactory.getWaypoint(lastICAO);
            tempFlightPlan.setDestination(destination);
        }

        let waypointEntries = [];
        let originEnd = (origin ? 1 : 0);
        let destinationStart = data.waypoints.length - (destination ? 1 : 0);
        let departureStart = (data.departureWaypointsSize <= 0) ? -1 : originEnd;
        let enrouteStart = originEnd + ((data.departureWaypointsSize <= 0) ? 0 : data.departureWaypointsSize);
        let enrouteEnd = destinationStart - ((data.arrivalWaypointsSize <= 0) ? 0 : data.arrivalWaypointsSize);
        let arrivalStart = (data.arrivalWaypointsSize <= 0) ? -1 : enrouteEnd;

        if (data.departureProcIndex >= 0) {
            await tempFlightPlan.setDepartureIndex(data.departureProcIndex, data.departureRunwayIndex, data.departureEnRouteTransitionIndex);
            let removeStart = data.departureRunwayIndex < 0 ? 0 : 1; // don't remove runway fix.
            tempFlightPlan.removeByIndex(WT_FlightPlan.Segment.DEPARTURE, removeStart, tempFlightPlan.getDeparture().length - removeStart);
            await this._getWaypointEntriesFromData(data.waypoints.slice(departureStart, enrouteStart), waypointEntries);
            await tempFlightPlan.insertWaypoints(WT_FlightPlan.Segment.DEPARTURE, waypointEntries);
            waypointEntries = [];
        }

        await this._getWaypointEntriesFromData(data.waypoints.slice(enrouteStart, enrouteEnd), waypointEntries);
        await tempFlightPlan.insertWaypoints(WT_FlightPlan.Segment.ENROUTE, waypointEntries);

        if (data.arrivalProcIndex >= 0) {
            waypointEntries = [];
            await tempFlightPlan.setArrivalIndex(data.arrivalProcIndex, data.arrivalEnRouteTransitionIndex, data.arrivalRunwayIndex);
            tempFlightPlan.removeByIndex(WT_FlightPlan.Segment.ARRIVAL, 0, tempFlightPlan.getArrival().length);
            await this._getWaypointEntriesFromData(data.waypoints.slice(arrivalStart, destinationStart), waypointEntries);
            await tempFlightPlan.insertWaypoints(WT_FlightPlan.Segment.ARRIVAL, waypointEntries, 0);
        }
        if (data.approachIndex >= 0) {
            await tempFlightPlan.setApproachIndex(data.approachIndex, data.approachTransitionIndex);
            // replace all waypoints except for the last, which should always be a runway fix.
            tempFlightPlan.removeByIndex(WT_FlightPlan.Segment.APPROACH, 0, tempFlightPlan.getApproach().length - 1);
            waypointEntries = [];
            await this._getWaypointEntriesFromData(approachData.waypoints.slice(0, approachData.waypoints.length - 1), waypointEntries);
            await tempFlightPlan.insertWaypoints(WT_FlightPlan.Segment.APPROACH, waypointEntries, 0);
        }

        flightPlan.copyFrom(tempFlightPlan);
    }

    async _syncDirectTo(directTo, isActive, origin, destination) {
        if (isActive) {
            let targetWaypoint;
            if (destination.icao) {
                targetWaypoint = await this._icaoWaypointFactory.getWaypoint(destination.icao);
            } else {
                targetWaypoint = new WT_CustomWaypoint("DRCT-DEST", destination.lla);
            }
            directTo.setDestination(targetWaypoint);
            if (!directTo.isActive() || !directTo.getOrigin().location.equals(origin)) {
                directTo.activate(origin);
            }
        } else {
            if (directTo.isActive()) {
                directTo.deactivate();
            }
        }
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @param {WT_DirectTo} [directTo]
     */
    async syncFromGame(flightPlan, directTo) {
        let data = await Coherent.call("GET_FLIGHTPLAN");
        let approachData = await Coherent.call("GET_APPROACH_FLIGHTPLAN");

        let isDRCTActive = false;
        let drctOrigin = null;
        let drctDestination = null;

        if (data.waypoints.length === 0) {
            flightPlan.clear();
        } else {
            let forceDRCTDestination = false;
            let firstICAO = data.waypoints[0].icao;
            let lastICAO = data.waypoints[data.waypoints.length - 1].icao;
            if ((firstICAO[0] === "U" && data.waypoints.length === 2 && lastICAO[0] === "A" && data.approachIndex < 0)) {
                isDRCTActive = true;
                drctOrigin = data.waypoints[0].lla;
                drctDestination = data.waypoints[1];
                forceDRCTDestination = true;
            }
            await this._syncFlightPlan(flightPlan, data, approachData, forceDRCTDestination);
        }

        if (data.isDirectTo) {
            isDRCTActive = true;
            drctOrigin = data.directToOrigin;
            drctDestination = data.directToTarget;
        }

        if (directTo) {
            await this._syncDirectTo(directTo, isDRCTActive, drctOrigin, drctDestination);
        }
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @param {Number} [index]
     */
    async syncToGame(flightPlan, index = 0) {
        await Coherent.call("SET_CURRENT_FLIGHTPLAN_INDEX", index);
        await Coherent.call("CLEAR_CURRENT_FLIGHT_PLAN");
        if (flightPlan.hasOrigin() && flightPlan.hasDestination()) {
            await Coherent.call("SET_ORIGIN", flightPlan.getOrigin().waypoint.icao);
            await Coherent.call("SET_DESTINATION", flightPlan.getDestination().waypoint.icao);
            let count = 1;
            for (let leg of flightPlan.getEnroute().legs) {
                let waypoint = leg.fix;
                if (waypoint && waypoint.icao) {
                    await Coherent.call("ADD_WAYPOINT", waypoint.icao, count, false);
                    count++;
                }
            }
            //await Coherent.call("SET_ACTIVE_WAYPOINT_INDEX", fpln.getActiveWaypointIndex());
            if (flightPlan.hasDeparture()) {
                let departure = flightPlan.getDeparture();
                //await Coherent.call("SET_ORIGIN_RUNWAY_INDEX", plan.procedureDetails.originRunwayIndex);
                await Coherent.call("SET_DEPARTURE_PROC_INDEX", departure.procedure.index);
                await Coherent.call("SET_DEPARTURE_RUNWAY_INDEX", departure.runwayTransitionIndex);
                await Coherent.call("SET_DEPARTURE_ENROUTE_TRANSITION_INDEX", departure.enrouteTransitionIndex);
            }
            if (flightPlan.hasArrival()) {
                let arrival = flightPlan.getArrival();
                await Coherent.call("SET_ARRIVAL_PROC_INDEX", arrival.procedure.index);
                await Coherent.call("SET_ARRIVAL_RUNWAY_INDEX", arrival.runwayTransitionIndex);
                await Coherent.call("SET_ARRIVAL_ENROUTE_TRANSITION_INDEX", arrival.enrouteTransitionIndex);
            }
            if (flightPlan.hasApproach()) {
                let approach = flightPlan.getApproach();
                await Coherent.call("SET_APPROACH_INDEX", approach.procedure.index);
                await Coherent.call("SET_APPROACH_TRANSITION_INDEX", approach.transitionIndex);
            }
        }
        //Coherent.call("SET_ACTIVE_WAYPOINT_INDEX", fpln.getActiveWaypointIndex() + 1);
        await Coherent.call("LOAD_CURRENT_ATC_FLIGHTPLAN");
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @returns {Number}
     */
    _findAsoboIndex(leg) {
        let asoboWaypointsCount = this.asoboFPM.getWaypointsCount();
        switch (leg.segment) {
            case WT_FlightPlan.Segment.ORIGIN:
                return this.asoboFPM.getOrigin() === null ? -1 : 0;
            case WT_FlightPlan.Segment.DESTINATION:
                return this.asoboFPM.getDestination() === null ? -1 : asoboWaypointsCount - 1;
            case WT_FlightPlan.Segment.DEPARTURE:
                let firstDepartureLeg = leg.flightPlan.getDeparture().legs.get(0);
                let index = leg.index - firstDepartureLeg.index;
                if (firstDepartureLeg.fix instanceof WT_RunwayWaypoint) {
                    // need to subtract 1 from index because the sim's flight plan does not include departure runway fixes.
                    index--;
                }
                return index + 1; // add one to index since origin is at index 0.
            case WT_FlightPlan.Segment.ENROUTE:
                let asoboEnrouteStartIndex = this.asoboFPM.getOrigin() === null ? 0 : (this.asoboFPM.getDepartureWaypointsCount() + 1);
                return leg.index - leg.flightPlan.getEnroute().legs.get(0).index + asoboEnrouteStartIndex;
            case WT_FlightPlan.Segment.ARRIVAL:
                return leg.index - leg.flightPlan.getArrival().legs.get(0).index + asoboWaypointsCount - this.asoboFPM.getArrivalWaypointsCount() - 1;
            case WT_FlightPlan.Segment.APPROACH:
                return leg.index - leg.flightPlan.getApproach().legs.get(0).index;
        }
    }

    /**
     *
     * @param {String} icao
     * @returns {Promise<void>}
     */
    setOrigin(icao) {
        return new Promise(resolve => this.asoboFPM.setOrigin(icao, resolve, true));
    }

    /**
     *
     * @param {String} icao
     * @returns {Promise<void>}
     */
    setDestination(icao) {
        return new Promise(resolve => this.asoboFPM.setDestination(icao, resolve, true));
    }

    /**
     *
     * @returns {Promise<void>}
     */
    removeOrigin() {
        return new Promise(resolve => this.asoboFPM.removeWaypoint(0, false, resolve));
    }

    /**
     *
     * @returns {Promise<void>}
     */
    removeDestination() {
        return new Promise(resolve => this.asoboFPM.removeWaypoint(this.asoboFPM.getWaypointsCount() - 1, false, resolve));
    }

    /**
     *
     * @param {WT_FlightPlan} plan
     * @param {WT_FlightPlan.Segment} segment
     * @param {String} icao
     * @param {Number} [index]
     * @returns {Promise<void>}
     */
    addWaypoint(plan, segment, icao, index) {
        return new Promise(async (resolve, reject) => {
            if (index === undefined) {
                index = plan.getSegment(segment).legs.length;
            }

            await this.updateAsoboFPM();
            let legBefore = null;
            switch (segment) {
                case WT_FlightPlan.Segment.ORIGIN:
                case WT_FlightPlan.Segment.DESTINATION:
                case WT_FlightPlan.Segment.APPROACH:
                    reject(new Error("Cannot add waypoint to origin, destination, or approach segments"));
                    return;
                case WT_FlightPlan.Segment.ARRIVAL:
                    if (plan.hasArrival()) {
                        let arrival = plan.getArrival();
                        legBefore = arrival.legs.length > 0 ? arrival.legs.get(arrival.legs.length - 1) : null;
                    }
                case WT_FlightPlan.Segment.ENROUTE:
                    if (!legBefore) {
                        let enroute = plan.getEnroute();
                        legBefore = enroute.legs.length > 0 ? enroute.legs.get(enroute.legs.length - 1) : null;
                    }
                case WT_FlightPlan.Segment.DEPARTURE:
                    if (!legBefore && plan.hasDeparture()) {
                        let departure = plan.getDeparture();
                        legBefore = departure.legs.length > 0 ? departure.legs.get(departure.legs.length - 1) : null;
                    }
            }

            let asoboIndex;
            if (legBefore) {
                asoboIndex = this._findAsoboIndex(legBefore) + 1;
                if (asoboIndex < 0) {
                    reject(new Error("Asobo flight plan is out of sync"));
                    return;
                }
            } else {
                asoboIndex = this.asoboFPM.getOrigin() ? 1 : 0;
            }
            this.asoboFPM.addWaypoint(icao, asoboIndex, resolve);
        });
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @returns {Promise<void>}
     */
    removeLeg(leg) {
        return new Promise(async (resolve, reject) => {
            if (leg.segment === WT_FlightPlan.Segment.APPROACH) {
                resolve();
            }

            await this.updateAsoboFPM();
            let index = this._findAsoboIndex(leg);
            if (index < 0) {
                reject(new Error("Could not find leg in Asobo flight plan"));
                return;
            }

            this.asoboFPM.removeWaypoint(index, false, resolve);
        });
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @returns {Promise<WT_FlightPlanLeg>}
     */
    async getActiveLeg(flightPlan) {
        let index = await this.getGameActiveWaypointIndex();
        if (index <= 0) {
            return null;
        }

        let ident = this.getGameActiveWaypointIdent();
        let isApproachActive = this.isApproachActive();

        let legs;
        if (isApproachActive) {
            if (flightPlan.hasApproach()) {
                legs = flightPlan.getApproach().legs;
            } else {
                return null;
            }
        } else {
            legs = flightPlan.legs;
        }

        let leg = legs.get(index);
        if (!leg) {
            let legsBefore = legs.slice(0, index).reverse();
            let legsAfter = legs.slice(index + 1, legs.length);
            let before = legsBefore.findIndex(leg => leg.fix.ident === ident);
            let after = legsAfter.findIndex(leg => leg.fix.ident === ident);
            if (before < 0) {
                if (after >= 0) {
                    index += after + 1;
                } else {
                    index = -1
                }
            } else {
                if (after >= 0 && after <= before) {
                    index += after + 1;
                } else {
                    index -= before + 1;
                }
            }
            if (index >= 0) {
                return legs.get(index);
            }
        }
        return leg ? leg: null;
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    setActiveLeg(leg) {
        return new Promise(async (resolve, reject) => {
            await this.updateAsoboFPM();
            let index = this._findAsoboIndex(leg);
            if (index < 0) {
                reject(new Error("Could not find leg in Asobo flight plan"));
                return;
            }

            let isApproachActive = this.isApproachActive();
            if (leg.segment === WT_FlightPlan.Segment.APPROACH && !isApproachActive) {
                this.asoboFPM.activateApproach((() => {
                    this.asoboFPM.setActiveWaypointIndex(index + 1, resolve); // need to add 1 to index because once approach is activated, a USR waypoint is added to the beginning of the approach
                }).bind(this));
            } else if (leg.segment !== WT_FlightPlan.Segment.APPROACH && isApproachActive) {
                this.asoboFPM.deactivateApproach();
                try {
                    await WT_Wait.awaitCallback(() => !this.isApproachActive(), this, 1000);
                    this.asoboFPM.setActiveWaypointIndex(index, resolve);
                } catch (e) {
                    reject(new Error("Approach deactivation timed out"));
                }
            } else {
                this.asoboFPM.setActiveWaypointIndex(index, resolve);
            }
        });
    }
}