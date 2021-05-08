class WT_FlightPlanAsoboInterface {
    /**
     *
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     */
    constructor(icaoWaypointFactory) {
        this._icaoWaypointFactory = icaoWaypointFactory;

        this._asoboFlightPlanInfo = {
            hasOrigin: false,
            hasDestination: false,
            hasDeparture: false,
            hasArrival: false,
            hasApproach: false,
            originIndex: -1,
            destinationIndex: -1,
            departureStartIndex: -1,
            departureLength: 0,
            enrouteStartIndex: -1,
            enrouteLength: 0,
            arrivalStartIndex: -1,
            arrivalLength: 0
        };

        RegisterViewListener("JS_LISTENER_FLIGHTPLAN");
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

    _asoboHasOrigin() {
        return SimVar.GetSimVarValue("L:Glasscockpits_FPLHaveOrigin", "boolean") !== 0;
    }

    _asoboHasDestination() {
        return SimVar.GetSimVarValue("L:Glasscockpits_FPLHaveDestination", "boolean") !== 0;
    }

    /**
     *
     * @param {Object} data
     * @param {WT_Waypoint[]} array
     * @returns {Promise<void>}
     */
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
                if (leg.lla.alt > 0) {
                    entry.advisoryAltitude = WT_Unit.METER.createNumber(leg.lla.alt);
                }
                array.push(entry);
            }
        }
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @param {Object} data
     * @param {Object} approachData
     * @param {Boolean} forceDRCTDestination
     * @param {Boolean} forceEnrouteSync
     * @returns {Promise<void>}
     */
    async _syncFlightPlan(flightPlan, data, approachData, forceDRCTDestination, forceEnrouteSync) {
        let tempFlightPlan = new WT_FlightPlan(this._icaoWaypointFactory);

        let origin;
        let firstICAO = data.waypoints[0].icao;
        if (this._asoboHasOrigin()) {
            origin = await this._icaoWaypointFactory.getWaypoint(firstICAO);
            tempFlightPlan.setOrigin(origin);
            this._asoboFlightPlanInfo.hasOrigin = true;
            this._asoboFlightPlanInfo.originIndex = 0;
        } else {
            this._asoboFlightPlanInfo.hasOrigin = false;
            this._asoboFlightPlanInfo.originIndex = -1;
        }

        let lastICAO = data.waypoints[data.waypoints.length - 1].icao;
        let destination;
        if (forceDRCTDestination || this._asoboHasDestination()) {
            destination = await this._icaoWaypointFactory.getWaypoint(lastICAO);
            tempFlightPlan.setDestination(destination);
            this._asoboFlightPlanInfo.hasDestination = true;
            this._asoboFlightPlanInfo.destinationIndex = data.waypoints.length - 1;
        } else {
            this._asoboFlightPlanInfo.hasDestination = false;
            this._asoboFlightPlanInfo.destinationIndex = -1;
        }

        let waypointEntries = [];
        let originEnd = (origin ? 1 : 0);
        let destinationStart = data.waypoints.length - (destination ? 1 : 0);
        let departureStart = (data.departureWaypointsSize <= 0) ? -1 : originEnd;
        let enrouteStart = originEnd + ((data.departureWaypointsSize <= 0) ? 0 : data.departureWaypointsSize);
        let enrouteEnd = destinationStart - ((data.arrivalWaypointsSize <= 0) ? 0 : data.arrivalWaypointsSize);
        let arrivalStart = (data.arrivalWaypointsSize <= 0) ? -1 : enrouteEnd;

        this._asoboFlightPlanInfo.departureStartIndex = departureStart;
        this._asoboFlightPlanInfo.departureLength = Math.max(0, data.departureWaypointsSize);
        this._asoboFlightPlanInfo.enrouteStartIndex = enrouteStart;
        this._asoboFlightPlanInfo.enrouteLength = enrouteEnd - enrouteStart;
        this._asoboFlightPlanInfo.arrivalStartIndex = arrivalStart;
        this._asoboFlightPlanInfo.arrivalLength = Math.max(0, data.departureWaypointsSize);

        if (data.departureProcIndex >= 0) {
            await tempFlightPlan.setDepartureIndex(data.departureProcIndex, data.departureRunwayIndex, data.departureEnRouteTransitionIndex);
            let removeStart = 0;
            let firstLeg = tempFlightPlan.getDeparture().legs.first();
            if (firstLeg && firstLeg.fix instanceof WT_RunwayWaypoint) {
                // don't remove runway fix if it exists.
                removeStart++;
            }
            tempFlightPlan.removeByIndex(WT_FlightPlan.Segment.DEPARTURE, removeStart, tempFlightPlan.getDeparture().length - removeStart);
            await this._getWaypointEntriesFromData(data.waypoints.slice(departureStart, enrouteStart), waypointEntries);
            await tempFlightPlan.insertWaypoints(WT_FlightPlan.Segment.DEPARTURE, waypointEntries);
            waypointEntries = [];
        }

        if (forceEnrouteSync) {
            await this._getWaypointEntriesFromData(data.waypoints.slice(enrouteStart, enrouteEnd), waypointEntries);
            await tempFlightPlan.insertWaypoints(WT_FlightPlan.Segment.ENROUTE, waypointEntries);
        } else {
            tempFlightPlan.copySegmentFrom(flightPlan, WT_FlightPlan.Segment.ENROUTE);
        }

        if (data.arrivalProcIndex >= 0) {
            waypointEntries = [];
            await tempFlightPlan.setArrivalIndex(data.arrivalProcIndex, data.arrivalEnRouteTransitionIndex, data.arrivalRunwayIndex);
            let removeCount = tempFlightPlan.getArrival().length;
            let lastLeg = tempFlightPlan.getArrival().legs.last();
            if (lastLeg && lastLeg.fix instanceof WT_RunwayWaypoint) {
                // don't remove runway fix if it exists.
                removeCount--;
            }
            tempFlightPlan.removeByIndex(WT_FlightPlan.Segment.ARRIVAL, 0, removeCount);
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
     * @param {Boolean} [forceEnrouteSync]
     */
    async syncFromGame(flightPlan, directTo, forceEnrouteSync) {
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
            await this._syncFlightPlan(flightPlan, data, approachData, forceDRCTDestination, forceEnrouteSync);
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
        switch (leg.segment) {
            case WT_FlightPlan.Segment.ORIGIN:
                return this._asoboFlightPlanInfo.originIndex;
            case WT_FlightPlan.Segment.DESTINATION:
                return this._asoboFlightPlanInfo.destinationIndex;
            case WT_FlightPlan.Segment.DEPARTURE:
                let firstDepartureLeg = leg.flightPlan.getDeparture().legs.first();
                let index = leg.index - firstDepartureLeg.index;
                if (firstDepartureLeg.fix instanceof WT_RunwayWaypoint) {
                    // need to subtract 1 from index because the sim's flight plan does not include departure runway fixes.
                    index--;
                }
                return index + 1; // add one to index since origin is at index 0.
            case WT_FlightPlan.Segment.ENROUTE:
                return leg.index - leg.flightPlan.getEnroute().legs.first().index + this._asoboFlightPlanInfo.enrouteStartIndex;
            case WT_FlightPlan.Segment.ARRIVAL:
                return leg.index - leg.flightPlan.getArrival().legs.first().index + this._asoboFlightPlanInfo.arrivalStartIndex;
            case WT_FlightPlan.Segment.APPROACH:
                return leg.index - leg.flightPlan.getApproach().legs.first().index;
        }
    }

    /**
     *
     * @param {String} icao
     * @returns {Promise<void>}
     */
    async setOrigin(icao) {
        await Coherent.call("SET_ORIGIN", icao, !this._asoboHasOrigin());
        await SimVar.SetSimVarValue("L:Glasscockpits_FPLHaveOrigin", "boolean", 1);
    }

    /**
     *
     * @param {String} icao
     * @returns {Promise<void>}
     */
    async setDestination(icao) {
        await Coherent.call("SET_DESTINATION", icao, !this._asoboHasDestination());
        await SimVar.SetSimVarValue("L:Glasscockpits_FPLHaveDestination", "boolean", 1);
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async removeOrigin() {
        if (this._asoboHasOrigin()) {
            await Coherent.call("REMOVE_ORIGIN", 0, false);
            await SimVar.SetSimVarValue("L:Glasscockpits_FPLHaveOrigin", "boolean", 0);
        }
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async removeDestination() {
        if (this._asoboHasDestination()) {
            await Coherent.call("REMOVE_DESTINATION", this._asoboFlightPlanInfo.destinationIndex, false);
            await SimVar.SetSimVarValue("L:Glasscockpits_FPLHaveDestination", "boolean", 0);
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @returns {Promise<void>}
     */
    async syncEnrouteLeg(leg) {
        if (leg.segment !== WT_FlightPlan.Segment.ENROUTE) {
            throw "Attempted to sync a non-enroute leg";
        }
        if (!(leg.fix instanceof WT_ICAOWaypoint)) {
            throw "Attempted to sync a leg with a non-ICAO fix";
        }

        let legBefore = leg.previousLeg();
        let asoboIndex;
        if (legBefore) {
            asoboIndex = this._findAsoboIndex(legBefore) + 1;
            if (asoboIndex < 0) {
                throw "Asobo flight plan is out of sync";
            }
        } else {
            asoboIndex = this._asoboFlightPlanInfo.hasOrigin ? 1 : 0;
        }
        await Coherent.call("ADD_WAYPOINT", leg.fix.icao, asoboIndex, true);
    }

    /**
     *
     * @param {WT_FlightPlanAirwaySequence} airwaySequence
     * @returns {Promise<void>}
     */
    async syncEnrouteAirwaySequence(airwaySequence) {
        if (airwaySequence.segment !== WT_FlightPlan.Segment.ENROUTE) {
            throw "Attempted to sync a non-enroute airway sequence";
        }

        let legBefore = airwaySequence.legs.first().previousLeg();
        let asoboIndex;
        if (legBefore) {
            asoboIndex = this._findAsoboIndex(legBefore) + 1;
            if (asoboIndex < 0) {
                throw "Asobo flight plan is out of sync";
            }
        } else {
            asoboIndex = this._asoboFlightPlanInfo.hasOrigin ? 1 : 0;
        }

        for (let i = 0; i < airwaySequence.legs.length; i++) {
            await Coherent.call("ADD_WAYPOINT", airwaySequence.legs.get(i).fix.icao, asoboIndex + i, true);
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @returns {Promise<void>}
     */
    async removeLeg(leg) {
        if (leg.segment === WT_FlightPlan.Segment.APPROACH) {
            return;
        }

        let index = this._findAsoboIndex(leg);
        if (index < 0) {
            throw "Could not find leg in Asobo flight plan";
        }

        await Coherent.call("REMOVE_WAYPOINT", index, false);
    }

    /**
     *
     * @param {WT_FlightPlanAirwaySequence} airwaySequence
     * @returns {Promise<void>}
     */
    async removeAirwaySequence(airwaySequence) {
        if (airwaySequence.segment === WT_FlightPlan.Segment.APPROACH) {
            return;
        }

        let startIndex = this._findAsoboIndex(airwaySequence.legs.first());
        if (startIndex < 0) {
            throw "Could not find leg in Asobo flight plan";
        }

        for (let i = 0; i < airwaySequence.legs.length; i++) {
            await Coherent.call("REMOVE_WAYPOINT", startIndex, false);
        }
    }

    /**
     *
     * @param {Number} departureIndex
     * @param {Number} enrouteTransitionIndex
     * @param {Number} runwayTransitionIndex
     * @returns {Promise<void>}
     */
    async loadDeparture(departureIndex, enrouteTransitionIndex, runwayTransitionIndex) {
        await Coherent.call("SET_DEPARTURE_PROC_INDEX", departureIndex);
        await Coherent.call("SET_DEPARTURE_RUNWAY_INDEX", runwayTransitionIndex);
        await Coherent.call("SET_DEPARTURE_ENROUTE_TRANSITION_INDEX", enrouteTransitionIndex);
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async removeDeparture() {
        await Coherent.call("REMOVE_DEPARTURE_PROC");
    }

    /**
     *
     * @param {Number} departureIndex
     * @param {Number} enrouteTransitionIndex
     * @param {Number} runwayTransitionIndex
     * @returns {Promise<void>}
     */
    async loadArrival(departureIndex, enrouteTransitionIndex, runwayTransitionIndex) {
        await Coherent.call("SET_ARRIVAL_PROC_INDEX", departureIndex);
        await Coherent.call("SET_ARRIVAL_ENROUTE_TRANSITION_INDEX", enrouteTransitionIndex);
        await Coherent.call("SET_ARRIVAL_RUNWAY_INDEX", runwayTransitionIndex);
    }

    /**
     *
     * @returns {Promise<void>}
     */
     async removeArrival() {
        await Coherent.call("REMOVE_ARRIVAL_PROC");
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
    async setActiveLeg(leg) {
        let index = this._findAsoboIndex(leg);
        if (index < 0) {
            reject("Could not find leg in Asobo flight plan");
            return;
        }

        let isApproachActive = this.isApproachActive();
        if (leg.segment === WT_FlightPlan.Segment.APPROACH && !isApproachActive) {
            await Coherent.call("ACTIVATE_APPROACH");
            index++; // need to add 1 to index because once approach is activated, a USR waypoint is added to the beginning of the approach
        } else if (leg.segment !== WT_FlightPlan.Segment.APPROACH && isApproachActive) {
            await Coherent.call("DEACTIVATE_APPROACH");
        }
        await Coherent.call("SET_ACTIVE_WAYPOINT_INDEX", index);
    }
}