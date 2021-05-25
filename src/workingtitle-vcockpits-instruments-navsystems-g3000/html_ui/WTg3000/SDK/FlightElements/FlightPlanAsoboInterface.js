class WT_FlightPlanAsoboInterface {
    constructor(icaoWaypointFactory) {
        this._icaoWaypointFactory = icaoWaypointFactory;
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

    async _syncFlightPlan(flightPlan, data, approachData) {
        let tempFlightPlan = new WT_FlightPlan(this._icaoWaypointFactory);

        let origin;
        let firstICAO = data.waypoints[0].icao;
        if (firstICAO[0] === "A") {
            origin = await this._icaoWaypointFactory.getAirport(firstICAO);
            tempFlightPlan.setOrigin(origin);
        }
        let lastICAO = data.waypoints[data.waypoints.length - 1].icao;
        let destination;
        if (data.waypoints.length > 1 && lastICAO[0] === "A") {
            destination = await this._icaoWaypointFactory.getAirport(data.waypoints[data.waypoints.length - 1].icao);
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
            tempFlightPlan.removeByIndex(WT_FlightPlan.Segment.DEPARTURE, removeStart, tempFlightPlan.getDeparture().length() - removeStart);
            await this._getWaypointEntriesFromData(data.waypoints.slice(departureStart, enrouteStart), waypointEntries);
            await tempFlightPlan.insertWaypoints(WT_FlightPlan.Segment.DEPARTURE, waypointEntries);
            waypointEntries = [];
        }

        await this._getWaypointEntriesFromData(data.waypoints.slice(enrouteStart, enrouteEnd), waypointEntries);
        await tempFlightPlan.insertWaypoints(WT_FlightPlan.Segment.ENROUTE, waypointEntries);

        if (data.arrivalProcIndex >= 0) {
            waypointEntries = [];
            await tempFlightPlan.setArrivalIndex(data.arrivalProcIndex, data.arrivalEnRouteTransitionIndex, data.arrivalRunwayIndex);
            tempFlightPlan.removeByIndex(WT_FlightPlan.Segment.ARRIVAL, 0, tempFlightPlan.getArrival().length());
            await this._getWaypointEntriesFromData(data.waypoints.slice(arrivalStart, destinationStart), waypointEntries);
            await tempFlightPlan.insertWaypoints(WT_FlightPlan.Segment.ARRIVAL, waypointEntries, 0);
        }
        if (data.approachIndex >= 0) {
            await tempFlightPlan.setApproachIndex(data.approachIndex, data.approachTransitionIndex);
            // replace all waypoints except for the last, which should always be a runway fix.
            tempFlightPlan.removeByIndex(WT_FlightPlan.Segment.APPROACH, 0, tempFlightPlan.getApproach().length() - 1);
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

        if (data.waypoints.length === 0) {
            return;
        }

        let isDRCTActive = false;
        let drctOrigin = null;
        let drctDestination = null;

        let firstICAO = data.waypoints[0].icao;
        if (!(firstICAO[0] === "U" && data.waypoints.length === 2 && data.approachIndex < 0)) {
            await this._syncFlightPlan(flightPlan, data, approachData);
        } else {
            flightPlan.clear();
            isDRCTActive = true;
            drctOrigin = data.waypoints[0].lla;
            drctDestination = data.waypoints[1];
        }

        if (directTo) {
            if (data.isDirectTo) {
                isDRCTActive = true;
                drctOrigin = data.directToOrigin;
                drctDestination = data.directToTarget;
            }
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
}