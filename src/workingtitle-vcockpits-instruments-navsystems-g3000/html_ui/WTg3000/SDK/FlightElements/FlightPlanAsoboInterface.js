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

    isApproachLoaded() {
        return SimVar.GetSimVarValue("C:fs9gps:FlightPlanIsLoadedApproach", "Bool");
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

    async _updateAsoboFlightPlanInfo(data, forceDRCTDestination) {
        if (forceDRCTDestination && SimVar.GetSimVarValue("L:Glasscockpits_FPLHaveDestination", "boolean") === 0) {
            await SimVar.SetSimVarValue("L:Glasscockpits_FPLHaveDestination", "boolean", 1);
        }
        if (data.waypoints.length > 0 && data.waypoints[0].icao[0] === "U" && SimVar.GetSimVarValue("L:Glasscockpits_FPLHaveOrigin", "boolean") !== 0) {
            // do not count USER waypoints as origin
            await SimVar.SetSimVarValue("L:Glasscockpits_FPLHaveOrigin", "boolean", 0);
        }

        this._asoboFlightPlanInfo.hasOrigin = false;
        this._asoboFlightPlanInfo.originIndex = -1;
        this._asoboFlightPlanInfo.hasDestination = false;
        this._asoboFlightPlanInfo.destinationIndex = -1;

        if (data.waypoints.length > 0) {
            let hasOrigin = this._asoboHasOrigin();
            if (hasOrigin) {
                this._asoboFlightPlanInfo.hasOrigin = true;
                this._asoboFlightPlanInfo.originIndex = 0;
            }

            if (this._asoboHasDestination() && (!hasOrigin || data.waypoints.length > 1)) {
                this._asoboFlightPlanInfo.hasDestination = true;
                this._asoboFlightPlanInfo.destinationIndex = data.waypoints.length - 1;
            }
        }

        let originEnd = (this._asoboFlightPlanInfo.hasOrigin ? 1 : 0);
        let destinationStart = data.waypoints.length - (this._asoboFlightPlanInfo.hasDestination ? 1 : 0);
        let departureStart = (data.departureWaypointsSize <= 0) ? -1 : originEnd;
        let enrouteStart = originEnd + ((data.departureWaypointsSize <= 0) ? 0 : data.departureWaypointsSize);
        let enrouteEnd = destinationStart - ((data.arrivalWaypointsSize <= 0) ? 0 : data.arrivalWaypointsSize);
        let arrivalStart = (data.arrivalWaypointsSize <= 0) ? -1 : enrouteEnd;

        this._asoboFlightPlanInfo.departureStartIndex = departureStart;
        this._asoboFlightPlanInfo.departureLength = Math.max(0, data.departureWaypointsSize);
        this._asoboFlightPlanInfo.enrouteStartIndex = enrouteStart;
        this._asoboFlightPlanInfo.enrouteLength = enrouteEnd - enrouteStart;
        this._asoboFlightPlanInfo.arrivalStartIndex = arrivalStart;
        this._asoboFlightPlanInfo.arrivalLength = Math.max(0, data.arrivalWaypointsSize);
    }

    async _syncAsoboFlightPlanInfo() {
        let data = await Coherent.call("GET_FLIGHTPLAN");
        this._asoboFlightPlanInfo.hasOrigin = false;
        this._asoboFlightPlanInfo.originIndex = -1;
        this._asoboFlightPlanInfo.hasDestination = false;
        this._asoboFlightPlanInfo.destinationIndex = -1;

        let forceDRCTDestination = false;
        if (data.waypoints.length > 0) {
            let firstICAO = data.waypoints[0].icao;
            let lastICAO = data.waypoints[data.waypoints.length - 1].icao;
            if ((firstICAO[0] === "U" && data.waypoints.length === 2 && lastICAO[0] === "A" && data.approachIndex < 0)) {
                forceDRCTDestination = true;
            }
        }

        this._updateAsoboFlightPlanInfo(data, forceDRCTDestination);
    }

    /**
     *
     * @param {Object} leg
     * @returns {Promise<WT_Waypoint>}
     */
    async _getWaypointFromAsoboLeg(leg) {
        let waypoint = null;
        if (leg.icao.length === 12 && leg.icao !== "W      CUSTD" && leg.icao !== "W      CUSTA") { // the sim encodes custom departure and arrival waypoints from the world map as CUSTD and CUSTA
            waypoint = await this._icaoWaypointFactory.getWaypoint(leg.icao);
        }
        if (!waypoint && leg.lla) {
            // leg has an invalid ICAO string but valid lat/long coordinates, so we will create a flight path waypoint
            waypoint = new WT_FlightPathWaypoint(leg.ident, leg.lla);
        }
        return waypoint;
    }

    /**
     *
     * @param {Object} data
     * @param {WT_Waypoint[]} array
     * @param {Boolean} includeAltitudes
     * @returns {Promise<void>}
     */
    async _getWaypointEntriesFromData(data, array, includeAltitudes) {
        for (let i = 0; i < data.length; i++) {
            let leg = data[i];
            let waypoint = await this._getWaypointFromAsoboLeg(leg);
            if (waypoint) {
                if (waypoint instanceof WT_ICAOWaypoint && waypoint.location.distance(leg.lla) > 0.0001) {
                    // sometimes Asobo will rename custom "USER" waypoints to match the ICAO of the previous waypoint
                    waypoint = new WT_FlightPathWaypoint("USER", leg.lla);
                }

                let entry = {waypoint: waypoint};
                if (leg.transitionLLas && leg.transitionLLas.length > 1) {
                    entry.steps = leg.transitionLLas.slice(0, leg.transitionLLas.length - 1).map(lla => new WT_GeoPoint(lla.lat, lla.long));
                }
                if (includeAltitudes && leg.lla.alt > 0) {
                    let altitude = WT_Unit.METER.createNumber(leg.lla.alt);
                    if (leg.altitudeMode === WT_FlightPlanAsoboInterface.LEG_ALTITUDE_MODE_TEXT[WT_FlightPlanAsoboInterface.LegAltitudeMode.CUSTOM]) {
                        entry.customAltitude = altitude;
                    } else {
                        entry.advisoryAltitude = altitude;
                    }
                }
                array.push(entry);
            }
        }
    }

    /**
     *
     * @param {WT_FlightPlanDepartureArrival} masterSegment
     * @param {WT_FlightPlanDepartureArrival} syncedSegment
     */
    _preserveDepartureArrivalAltitudeConstraints(masterSegment, syncedSegment) {
        if (!masterSegment || !syncedSegment) {
            return;
        }
        if (!masterSegment.equals(syncedSegment)) {
            return;
        }

        for (let i = 0; i < masterSegment.legs.length; i++) {
            let masterLeg = masterSegment.legs.get(i);
            let syncedLeg = syncedSegment.legs.get(i);
            syncedLeg.altitudeConstraint.copyFrom(masterLeg.altitudeConstraint);
        }
    }

    /**
     *
     * @param {WT_FlightPlan} masterFlightPlan
     * @param {WT_FlightPlan} syncedFlightPlan
     */
    _preserveDepartureAltitudeConstraints(masterFlightPlan, syncedFlightPlan) {
        this._preserveDepartureArrivalAltitudeConstraints(masterFlightPlan.getDeparture(), syncedFlightPlan.getDeparture());
    }

    /**
     *
     * @param {WT_FlightPlan} masterFlightPlan
     * @param {WT_FlightPlan} syncedFlightPlan
     */
    _preserveArrivalAltitudeConstraints(masterFlightPlan, syncedFlightPlan) {
        this._preserveDepartureArrivalAltitudeConstraints(masterFlightPlan.getArrival(), syncedFlightPlan.getArrival());
    }

    /**
     *
     * @param {WT_FlightPlan} masterFlightPlan
     * @param {WT_FlightPlan} syncedFlightPlan
     */
    _preserveApproachAltitudeConstraints(masterFlightPlan, syncedFlightPlan) {
        // because the sim's flight plan system does not allow setting of approach altitude constraints, that
        // information is stored exclusively within the custom flight plan object. Therefore we must ensure that after
        // a sync, the altitude constraints are preserved. To that end, if the approach did not change, we will just
        // copy over the altitude constraints. If the approach did change, but only because a USER waypoint was added
        // to the beginning (a result of activating the approach), we will still copy over the constraints for the
        // remaining, unchanged legs.

        if (!masterFlightPlan.hasApproach() || !syncedFlightPlan.hasApproach()) {
            return;
        }

        let masterApproachSegment = masterFlightPlan.getApproach();
        let syncedApproachSegment = syncedFlightPlan.getApproach();
        if (!masterApproachSegment.procedure.equals(syncedApproachSegment.procedure) ||
            masterApproachSegment.transitionIndex !== syncedApproachSegment.transitionIndex ||
            masterApproachSegment.legs.length === 0 ||
            syncedApproachSegment.legs.length === 0 ||
            Math.abs(masterApproachSegment.legs.length - syncedApproachSegment.legs.length) > 1) {

            return;
        }

        let masterApproachLength = masterApproachSegment.legs.length;
        let syncedApproachLength = syncedApproachSegment.legs.length;
        let minLength = Math.min(masterApproachLength, syncedApproachLength);
        for (let offset = 1; offset <= minLength; offset++) {
            let masterLeg = masterApproachSegment.legs.get(masterApproachLength - offset);
            let syncedLeg = syncedApproachSegment.legs.get(syncedApproachLength - offset);
            if (!masterLeg.equals(syncedLeg)) {
                return;
            }
        }

        for (let offset = 1; offset <= minLength; offset++) {
            let masterLeg = masterApproachSegment.legs.get(masterApproachLength - offset);
            let syncedLeg = syncedApproachSegment.legs.get(syncedApproachLength - offset);
            syncedLeg.altitudeConstraint.copyFrom(masterLeg.altitudeConstraint);
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

        this._updateAsoboFlightPlanInfo(data, forceDRCTDestination);

        if (this._asoboFlightPlanInfo.hasOrigin) {
            tempFlightPlan.setOrigin(await this._getWaypointFromAsoboLeg(data.waypoints[0]));
        }
        if (this._asoboFlightPlanInfo.hasDestination) {
            tempFlightPlan.setDestination(await this._getWaypointFromAsoboLeg(data.waypoints[this._asoboFlightPlanInfo.destinationIndex]));
        }

        let waypointEntries = [];
        if (tempFlightPlan.hasOrigin() && data.departureProcIndex >= 0) {
            await tempFlightPlan.setDepartureIndex(data.departureProcIndex, data.departureRunwayIndex, data.departureEnRouteTransitionIndex);
            let removeStart = 0;
            let firstDepartureElement = tempFlightPlan.getDeparture().elements.first();
            if (firstDepartureElement instanceof WT_FlightPlanLeg && firstDepartureElement.fix instanceof WT_RunwayWaypoint) {
                // don't remove runway fix leg if it exists.
                removeStart++;
            }
            tempFlightPlan.removeByIndex(WT_FlightPlan.Segment.DEPARTURE, removeStart, tempFlightPlan.getDeparture().length - removeStart);
            await this._getWaypointEntriesFromData(data.waypoints.slice(this._asoboFlightPlanInfo.departureStartIndex, this._asoboFlightPlanInfo.enrouteStartIndex), waypointEntries, false);
            await tempFlightPlan.insertWaypoints(WT_FlightPlan.Segment.DEPARTURE, waypointEntries);
            this._preserveDepartureAltitudeConstraints(flightPlan, tempFlightPlan);
            waypointEntries = [];
        }

        if (forceEnrouteSync) {
            let enrouteEnd = this._asoboFlightPlanInfo.enrouteStartIndex + this._asoboFlightPlanInfo.enrouteLength;
            await this._getWaypointEntriesFromData(data.waypoints.slice(this._asoboFlightPlanInfo.enrouteStartIndex, enrouteEnd), waypointEntries, false);
            await tempFlightPlan.insertWaypoints(WT_FlightPlan.Segment.ENROUTE, waypointEntries);
        } else {
            tempFlightPlan.copySegmentFrom(flightPlan, WT_FlightPlan.Segment.ENROUTE);
        }

        if (tempFlightPlan.hasDestination() && data.arrivalProcIndex >= 0) {
            waypointEntries = [];
            await tempFlightPlan.setArrivalIndex(data.arrivalProcIndex, data.arrivalEnRouteTransitionIndex, data.arrivalRunwayIndex);
            let removeCount = tempFlightPlan.getArrival().length;
            let lastArrivalElement = tempFlightPlan.getArrival().elements.last();
            if (lastArrivalElement instanceof WT_FlightPlanLeg && lastArrivalElement.fix instanceof WT_RunwayWaypoint) {
                // don't remove runway fix leg if it exists.
                removeCount--;
            }
            tempFlightPlan.removeByIndex(WT_FlightPlan.Segment.ARRIVAL, 0, removeCount);
            let arrivalEnd = this._asoboFlightPlanInfo.arrivalStartIndex + this._asoboFlightPlanInfo.arrivalLength;
            await this._getWaypointEntriesFromData(data.waypoints.slice(this._asoboFlightPlanInfo.arrivalStartIndex, arrivalEnd), waypointEntries, false);
            await tempFlightPlan.insertWaypoints(WT_FlightPlan.Segment.ARRIVAL, waypointEntries, 0);
            this._preserveArrivalAltitudeConstraints(flightPlan, tempFlightPlan);
        }
        if (tempFlightPlan.hasDestination() && data.approachIndex >= 0) {
            await tempFlightPlan.setApproachIndex(data.approachIndex, data.approachTransitionIndex);
            let approachLength = tempFlightPlan.getApproach().length;
            let preserveCount = 0;
            let lastApproachElement = tempFlightPlan.getApproach().elements.last();
            if (lastApproachElement instanceof WT_FlightPlanLeg && lastApproachElement.fix instanceof WT_RunwayWaypoint) {
                // don't remove runway fix leg if it exists.
                preserveCount = 1;
            }
            tempFlightPlan.removeByIndex(WT_FlightPlan.Segment.APPROACH, 0, approachLength - preserveCount);
            waypointEntries = [];
            await this._getWaypointEntriesFromData(approachData.waypoints.slice(0, approachData.waypoints.length - preserveCount), waypointEntries, false);
            await tempFlightPlan.insertWaypoints(WT_FlightPlan.Segment.APPROACH, waypointEntries, 0);
            this._preserveApproachAltitudeConstraints(flightPlan, tempFlightPlan);
        }

        flightPlan.copyFrom(tempFlightPlan);
    }

    async _syncDirectTo(directTo, isActive, origin, destination) {
        if (isActive) {
            let targetWaypoint;
            if (destination.icao) {
                targetWaypoint = await this._icaoWaypointFactory.getWaypoint(destination.icao);
            } else {
                targetWaypoint = new WT_FlightPathWaypoint("DRCT-DEST", destination.lla);
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
        let forceDRCTDestination = false;
        if (data.waypoints.length > 0) {
            let firstICAO = data.waypoints[0].icao;
            let lastICAO = data.waypoints[data.waypoints.length - 1].icao;
            if ((firstICAO[0] === "U" && data.waypoints.length === 2 && lastICAO[0] === "A" && data.approachIndex < 0)) {
                // when activating a direct-to to an airport, the game will replace the entire active flight plan with two waypoints:
                // a USER waypoint at P.POS, and the destination airport waypoint
                isDRCTActive = true;
                drctOrigin = data.waypoints[0].lla;
                drctDestination = data.waypoints[1];
                forceDRCTDestination = true;
            }
        }
        await this._syncFlightPlan(flightPlan, data, approachData, forceDRCTDestination, forceEnrouteSync || isDRCTActive);

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
        if (this._asoboHasOrigin()) {
            // need to remove origin if one exists, otherwise the old origin gets shifted to the next waypoint in the flight plan
            await Coherent.call("REMOVE_ORIGIN", 0, true);
        }
        await Coherent.call("SET_ORIGIN", icao, true);
        await SimVar.SetSimVarValue("L:Glasscockpits_FPLHaveOrigin", "boolean", 1);
    }

    /**
     *
     * @param {String} icao
     * @returns {Promise<void>}
     */
    async setDestination(icao) {
        if (this._asoboHasDestination() && !this._asoboHasOrigin()) {
            // need to remove destination if one exists and there is no origin, otherwise the old destination gets shifted to the previous waypoint in the flight plan
            await Coherent.call("REMOVE_DESTINATION", this._asoboFlightPlanInfo.destinationIndex, true);
        }
        await Coherent.call("SET_DESTINATION", icao, !this._asoboHasDestination());
        await SimVar.SetSimVarValue("L:Glasscockpits_FPLHaveDestination", "boolean", 1);

        await this.removeArrival();
        await this.removeApproach();
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

        await this._syncAsoboFlightPlanInfo();

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

        await this._syncAsoboFlightPlanInfo();

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

        await this._syncAsoboFlightPlanInfo();

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

        await this._syncAsoboFlightPlanInfo();

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
     * @param {WT_Airport} airport
     * @param {Number} approachIndex
     * @param {Number} transitionIndex
     * @returns {Promise<void>}
     */
    async loadApproach(approachIndex, transitionIndex) {
        if (this.isApproachActive()) {
            await this.deactivateApproach();
        }

        await Coherent.call("SET_APPROACH_INDEX", approachIndex);
        await Coherent.call("SET_APPROACH_TRANSITION_INDEX", transitionIndex);
    }

    /**
     *
     * @param {WT_Airport} airport
     * @returns {Promise<void>}
     */
    async removeApproach() {
        await this.deactivateApproach();
        await this.loadApproach(-1, -1);
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_NumberUnit} altitude
     * @param {WT_FlightPlanAsoboInterface.LegAltitudeMode} mode
     */
    async setLegAltitude(leg, altitude, mode) {
        if (leg.segment === WT_FlightPlan.Segment.APPROACH) {
            return;
        }

        await this._syncAsoboFlightPlanInfo();
        let index = this._findAsoboIndex(leg);
        if (index < 0) {
            throw "Could not find leg in Asobo flight plan";
        }

        let altitudeValue = altitude ? altitude.asUnit(WT_Unit.METER) : 0;
        await Coherent.call("SET_WAYPOINT_ALTITUDE", altitudeValue, index);
        await Coherent.call("SET_WAYPOINT_ADDITIONAL_DATA", index, "ALTITUDE_MODE", WT_FlightPlanAsoboInterface.LEG_ALTITUDE_MODE_TEXT[mode]);
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async clearFlightPlan() {
        await Coherent.call("CLEAR_CURRENT_FLIGHT_PLAN");
        await Promise.all([
            SimVar.SetSimVarValue("L:Glasscockpits_FPLHaveOrigin", "boolean", 0),
            SimVar.SetSimVarValue("L:Glasscockpits_FPLHaveDestination", "boolean", 0)
        ]);
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async activateApproach() {
        if (!this.isApproachLoaded()) {
            return;
        }

        let isApproachActive = this.isApproachActive();
        if (isApproachActive) {
            SimVar.SetSimVarValue("L:FLIGHT_PLAN_MANAGER_APPROACH_ACTIVATED", "boolean", true);
        } else {
            await Coherent.call("ACTIVATE_APPROACH");
            SimVar.SetSimVarValue("L:FLIGHT_PLAN_MANAGER_APPROACH_ACTIVATED", "boolean", true);
        }
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async deactivateApproach() {
        await Coherent.call("DEACTIVATE_APPROACH");
        SimVar.SetSimVarValue("L:FLIGHT_PLAN_MANAGER_APPROACH_ACTIVATED", "boolean", false);
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async tryAutoActivateApproach() {
        await Coherent.call("TRY_AUTOACTIVATE_APPROACH");
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
        return leg ? leg : null;
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    async setActiveLeg(leg) {
        let index = this._findAsoboIndex(leg);
        if (index < 0) {
            throw "Could not find leg in Asobo flight plan";
        }

        let isApproachActive = this.isApproachActive();
        if (leg.segment === WT_FlightPlan.Segment.APPROACH && !isApproachActive) {
            await this.activateApproach();
            index++; // need to add 1 to index because once approach is activated, a USR waypoint is added to the beginning of the approach
        } else if (leg.segment !== WT_FlightPlan.Segment.APPROACH && isApproachActive) {
            await this.deactivateApproach();
        }
        await Coherent.call("SET_ACTIVE_WAYPOINT_INDEX", index);
    }

    async deactivateDirectTo() {
        await Coherent.call("CANCEL_DIRECT_TO");
    }

    /**
     *
     * @param {String} icao
     */
    async activateDirectTo(icao) {
        await Coherent.call("ACTIVATE_DIRECT_TO", icao);
    }
}
/**
 * @enum {Number}
 */
WT_FlightPlanAsoboInterface.LegAltitudeMode = {
    NONE: 0,
    CUSTOM: 1,
    SUPPRESSED: 2
};
WT_FlightPlanAsoboInterface.LEG_ALTITUDE_MODE_TEXT = [
    "None",
    "Custom",
    "Suppressed"
];