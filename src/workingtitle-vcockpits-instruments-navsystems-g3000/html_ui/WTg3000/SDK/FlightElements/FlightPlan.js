class WT_FlightPlan {
    constructor(icaoWaypointFactory) {
        this._icaoWaypointFactory = icaoWaypointFactory;

        this._origin = new WT_FlightPlanOrigin();
        this._origin._setFlightPlan(this);

        this._enroute = new WT_FlightPlanEnroute();
        this._enroute._setFlightPlan(this);
        this._enroute._setPrevious(this._origin);

        this._destination = new WT_FlightPlanDestination();
        this._destination._setFlightPlan(this);
        this._destination._setPrevious(this._enroute);

        /**
         * @type {WT_FlightPlanDeparture}
         */
        this._departure = null;
        /**
         * @type {WT_FlightPlanArrival}
         */
        this._arrival = null;
        /**
         * @type {WT_FlightPlanApproach}
         */
        this._approach = null;

        this._legs = [];
        this._totalDistance = new WT_NumberUnit(0, WT_Unit.NMILE);

        this._listeners = [];
    }

    hasOrigin() {
        return this._origin.waypoint !== null;
    }

    isOriginAirport() {
        return this.hasOrigin() && this._origin.waypoint.icao && this._origin.waypoint.type === WT_ICAOWaypoint.Type.AIRPORT;
    }

    hasDeparture() {
        return this._departure !== null;
    }

    hasArrival() {
        return this._arrival !== null;
    }

    hasApproach() {
        return this._approach !== null;
    }

    hasDestination() {
        return this._destination.waypoint !== null;
    }

    isDestinationAirport() {
        return this.hasDestination() && this._destination.waypoint.icao && this._destination.waypoint.type === WT_ICAOWaypoint.Type.AIRPORT;
    }

    /**
     * @returns {WT_FlightPlanOrigin}
     */
    getOrigin() {
        return this._origin;
    }

    /**
     * @returns {WT_FlightPlanDestination}
     */
    getDestination() {
        return this._destination;
    }

    /**
     * @returns {WT_FlightPlanSequence}
     */
    getEnroute() {
        return this._enroute;
    }

    /**
     * @returns {WT_FlightPlanDeparture}
     */
    getDeparture() {
        return this._departure;
    }

    /**
     * @returns {WT_FlightPlanArrival}
     */
    getArrival() {
        return this._arrival;
    }

    /**
     * @returns {WT_FlightPlanApproach}
     */
    getApproach() {
        return this._approach;
    }

    /**
     *
     * @param {Number} segment
     * @returns {WT_FlightPlanElement}
     */
    getSegment(segment) {
        switch (segment) {
            case WT_FlightPlan.Segment.ORIGIN: return this._origin;
            case WT_FlightPlan.Segment.DEPARTURE: return this._departure;
            case WT_FlightPlan.Segment.ENROUTE: return this._enroute;
            case WT_FlightPlan.Segment.ARRIVAL: return this._arrival;
            case WT_FlightPlan.Segment.APPROACH: return this._approach;
            case WT_FlightPlan.Segment.DESTINATION: return this._destination;
            default: return null;
        }
    }

    /**
     * @returns {Number}
     */
    legCount() {
        return this._legs.length;
    }

    /**
     * @returns {WT_FlightPlanLeg}
     */
    firstLeg() {
        return this._legs[0];
    }

    /**
     * @returns {WT_FlightPlanLeg}
     */
    lastLeg() {
        return this._legs[this._legs.length - 1];
    }

    /**
     * @returns {WT_FlightPlanLeg[]}
     */
    legs() {
        return Array.from(this._legs);
    }

    /**
     * @returns {WT_NumberUnitReadOnly}
     */
    totalDistance() {
        return this._totalDistance.readonly();
    }

    _updateFromSegment(segment) {
        switch (segment) {
            case WT_FlightPlan.Segment.ORIGIN:
                if (this.hasDeparture()) {
                    this._departure._update();
                }
            case WT_FlightPlan.Segment.DEPARTURE:
                this._enroute._update();
            case WT_FlightPlan.Segment.ENROUTE:
                if (this.hasArrival()) {
                    this._arrival._update();
                }
            case WT_FlightPlan.Segment.ARRIVAL:
                if (this.hasApproach()) {
                    this._approach._update();
                }
            case WT_FlightPlan.Segment.APPROACH:
                if (this.hasDestination()) {
                    this._destination._update();
                }
        }
    }

    _updateLegs() {
        this._legs = [];
        if (this.hasOrigin()) {
            if (!this._departure || this._departure.runwayTransitionIndex < 0) {
                this._legs.push(...this._origin.legs());
            }
            if (this._departure) {
                this._legs.push(...this._departure.legs());
            }
        }
        this._legs.push(...this._enroute.legs());
        if (this.hasDestination()) {
            if (this._arrival) {
                this._legs.push(...this._arrival.legs());
            }
            if (this._approach) {
                this._legs.push(...this._approach.legs());
            }
            if (!this._approach) {
                this._legs.push(...this._destination.legs());
            }
        }

        for (let i = 0; i < this._legs.length; i++) {
            this._legs[i]._index = i;
        }

        let lastLeg = this.lastLeg();
        this._totalDistance.set(lastLeg ? lastLeg.cumulativeDistance : 0);
    }

    /**
     *
     * @param {WT_Waypoint} origin
     * @param {*} eventData
     */
    _changeOrigin(origin, eventData) {
        if (origin === null && this._origin.waypoint === null) {
            return;
        } else if (origin !== null && this._origin.waypoint !== null && origin.uniqueID === this._origin.waypoint.uniqueID) {
            return;
        }

        eventData.types = eventData.types | WT_FlightPlanEvent.Type.ORIGIN_CHANGED;
        eventData.oldOrigin = this._origin.waypoint;
        eventData.newOrigin = origin;
        if (this._origin.waypoint) {
            this._origin.leg()._index = -1;
        }
        this._origin._setWaypoint(origin);
    }

    _changeDeparture(departure, eventData) {
        if (departure === null && this._departure === null) {
            return;
        } else if (departure !== null && departure.equals(this._departure)) {
            return;
        }

        eventData.types = eventData.types | WT_FlightPlanEvent.Type.DEPARTURE_CHANGED;
        eventData.oldDeparture = this._departure;
        eventData.newDeparture = departure;
        if (this._departure) {
            for (let leg of this._departure.legs()) {
                leg._index = -1;
            }
            this._departure._setFlightPlan(null);
        }
        this._departure = departure;
        if (departure) {
            this._departure._setFlightPlan(this);
        }
    }

    _changeArrival(arrival, eventData) {
        if (arrival === null && this._arrival === null) {
            return;
        } else if (arrival !== null && arrival.equals(this._arrival)) {
            return;
        }

        eventData.types = eventData.types | WT_FlightPlanEvent.Type.ARRIVAL_CHANGED;
        eventData.oldArrival = this._arrival;
        eventData.newArrival = arrival;
        if (this._arrival) {
            for (let leg of this._arrival.legs()) {
                leg._index = -1;
            }
            this._arrival._setFlightPlan(null);
        }
        this._arrival = arrival;
        if (arrival) {
            this._arrival._setFlightPlan(this);
        }
    }

    _changeApproach(approach, eventData) {
        if (approach === null && this._approach === null) {
            return;
        } else if (approach !== null && approach.equals(this._approach)) {
            return;
        }

        eventData.types = eventData.types | WT_FlightPlanEvent.Type.APPROACH_CHANGED;
        eventData.oldApproach = this._approach;
        eventData.newApproach = approach;
        if (this._approach) {
            for (let leg of this._approach.legs()) {
                leg._index = -1;
            }
            this._approach._setFlightPlan(null);
        }
        this._approach = approach;
        if (approach) {
            this._approach._setFlightPlan(this);
        }
    }

    _changeDestination(destination, eventData) {
        if (destination === null && this._destination.waypoint === null) {
            return;
        } else if (destination !== null && this._destination.waypoint !== null && destination.uniqueID === this._destination.waypoint.uniqueID) {
            return;
        }

        eventData.types = eventData.types | WT_FlightPlanEvent.Type.DESTINATION_CHANGED;
        eventData.oldDestination = this._destination.waypoint;
        eventData.newDestination = destination;
        if (this._destination.waypoint) {
            this._destination.leg()._index = -1;
        }
        this._destination._setWaypoint(destination);
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    setOrigin(waypoint) {
        if (!waypoint || (this.hasOrigin() && (waypoint.uniqueID === this._origin.waypoint.uniqueID))) {
            return;
        }

        let eventData = {types: 0};
        this._changeOrigin(waypoint, eventData);
        this._changeDeparture(null, eventData);
        this._enroute._setPrevious(this._origin);
        this._updateFromSegment(this._enroute.segment);
        this._updateLegs();
        this._fireEvent(eventData);
    }

    removeOrigin() {
        if (!this.hasOrigin()) {
            return;
        }

        let eventData = {types: 0};
        this._changeOrigin(null, eventData);
        this._changeDeparture(null, eventData);
        this._enroute._setPrevious(this._origin);
        this._updateFromSegment(this._enroute.segment);
        this._updateLegs();
        this._fireEvent(eventData);
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    setDestination(waypoint) {
        if (!waypoint || (this.hasDestination() && (waypoint.uniqueID === this._destination.waypoint.uniqueID))) {
            return;
        }

        let eventData = {types: 0};
        this._changeDestination(waypoint, eventData);
        this._destination._setPrevious(this._enroute);
        this._changeArrival(null, eventData);
        this._changeApproach(null, eventData);
        this._updateLegs();
        this._fireEvent(eventData);
    }

    removeDestination() {
        if (!this.hasDestination()) {
            return;
        }

        let eventData = {types: 0};
        this._changeDestination(null, eventData);
        this._destination._setPrevious(this._enroute);
        this._changeArrival(null, eventData);
        this._changeApproach(null, eventData);
        this._updateLegs();
        this._fireEvent(eventData);
    }

    /**
     *
     * @param {WT_ProcedureLegList} procedureLegs
     * @param {WT_FlightPlanProcedureLeg[]} legs
     */
    async _buildLegsFromProcedure(procedureLegs, legs) {
        let previous = legs.length > 0 ? legs[legs.length - 1].fix : undefined;
        for (let i = 0; i < procedureLegs.count(); i++) {
            let current = procedureLegs.getByIndex(i);
            let next = procedureLegs.getByIndex(i + 1);
            try {
                let fix = await current.waypointFix(this._icaoWaypointFactory, previous, next);
                if (fix) {
                    legs.push(new WT_FlightPlanProcedureLeg(current, fix));
                    previous = fix;
                }
            } catch (e) {}
        }
    }

    /**
     *
     * @param {WT_Departure} departure
     * @param {Number} runwayTransitionIndex
     * @param {Number} enrouteTransitionIndex
     */
    async _setDeparture(departure, runwayTransitionIndex, enrouteTransitionIndex) {
        let runwayTransition;
        let runway;
        if (runwayTransitionIndex >= 0) {
            runwayTransition = departure.runwayTransitions.getByIndex(runwayTransitionIndex);
            runway = runwayTransition.runway;
        }
        let enrouteTransition = departure.enrouteTransitions.getByIndex(enrouteTransitionIndex);

        let legs = [];
        if (runwayTransition) {
            legs.push(new WT_FlightPlanWaypointFixLeg(new WT_CustomWaypoint(runway.designation, runway.end))); // runway fix
            await this._buildLegsFromProcedure(runwayTransition.legs, legs);
        }
        await this._buildLegsFromProcedure(departure.commonLegs, legs);
        if (enrouteTransition) {
            await this._buildLegsFromProcedure(enrouteTransition.legs, legs);
        }

        let eventData = {types: 0};
        this._changeDeparture(new WT_FlightPlanDeparture(departure, runwayTransitionIndex, enrouteTransitionIndex, legs), eventData);
        this._departure._setPrevious(this._origin);
        this._enroute._setPrevious(this._departure);
        this._updateFromSegment(this._enroute.segment);
        this._updateLegs();
        this._fireEvent(eventData);
    }

    /**
     *
     * @param {String} name
     * @param {Number} runwayTransitionIndex
     * @param {Number} enrouteTransitionIndex
     */
    async setDeparture(name, runwayTransitionIndex, enrouteTransitionIndex) {
        if (!this.isOriginAirport() ||
            (this.hasDeparture() && (this._departure.procedure.name === name && this._departure.runwayTransitionIndex === runwayTransitionIndex && this._departure.enrouteTransitionIndex === enrouteTransitionIndex))) {
            return;
        }

        let departure = this._origin.waypoint.departures.getByName(name);
        await this._setDeparture(departure, runwayTransitionIndex, enrouteTransitionIndex);
    }

    /**
     *
     * @param {Number} index
     * @param {Number} runwayTransitionIndex
     * @param {Number} enrouteTransitionIndex
     */
    async setDepartureIndex(index, runwayTransitionIndex, enrouteTransitionIndex) {
        if (!this.isOriginAirport() ||
            (this.hasDeparture() && (this._departure.procedure.name === this._origin.departures.getByIndex(index).name && this._departure.runwayTransitionIndex === runwayTransitionIndex && this._departure.enrouteTransitionIndex === enrouteTransitionIndex))) {
            return;
        }

        let departure = this._origin.waypoint.departures.getByIndex(index);
        await this._setDeparture(departure, runwayTransitionIndex, enrouteTransitionIndex);
    }

    async removeDeparture() {
        if (!this.hasDeparture()) {
            return;
        }

        let eventData = {types: 0};
        this._changeDeparture(null, eventData);
        this._enroute._setPrevious(this._origin);
        this._updateLegs();
        this._fireEvent(eventData);
    }

    /**
     *
     * @param {WT_Arrival} arrival
     * @param {Number} enrouteTransitionIndex
     * @param {Number} runwayTransitionIndex
     */
    async _setArrival(arrival, enrouteTransitionIndex, runwayTransitionIndex) {
        let enrouteTransition = arrival.enrouteTransitions.getByIndex(enrouteTransitionIndex);
        let runwayTransition;
        if (runwayTransitionIndex >= 0) {
            runwayTransition = arrival.runwayTransitions.getByIndex(runwayTransitionIndex);
        }

        let legs = [];
        if (enrouteTransition) {
            await this._buildLegsFromProcedure(enrouteTransition.legs, legs);
        }
        await this._buildLegsFromProcedure(arrival.commonLegs, legs);
        if (runwayTransition) {
            await this._buildLegsFromProcedure(runwayTransition.legs, legs);
        }

        let eventData = {types: 0};
        this._changeArrival(new WT_FlightPlanArrival(arrival, runwayTransitionIndex, enrouteTransitionIndex, legs), eventData);
        this._arrival._setPrevious(this._enroute);
        if (this.hasApproach()) {
            this._approach._setPrevious(this._arrival);
        }
        this._destination._setPrevious(this._arrival);
        this._updateLegs();
        this._fireEvent(eventData);
    }

    /**
     *
     * @param {String} name
     * @param {Number} enrouteTransitionIndex
     * @param {Number} [runwayTransitionIndex]
     */
    async setArrival(name, enrouteTransitionIndex, runwayTransitionIndex = -1) {
        if (!this.isDestinationAirport() ||
            (this.hasArrival() && (this._arrival.procedure.name === name && this._arrival.runwayTransitionIndex === runwayTransitionIndex && this._arrival.enrouteTransitionIndex === enrouteTransitionIndex))) {
            return;
        }

        let arrival = this._destination.waypoint.arrivals.getByName(name);
        await this._setArrival(arrival, enrouteTransitionIndex, runwayTransitionIndex);
    }

    /**
     *
     * @param {Index} index
     * @param {Number} runwayTransitionIndex
     * @param {Number} [enrouteTransitionIndex]
     */
    async setArrivalIndex(index, enrouteTransitionIndex, runwayTransitionIndex = -1) {
        if (!this.isDestinationAirport() ||
            (this.hasArrival() && (this._arrival.procedure.name === this._destination.arrivals.getByIndex(index).name && this._arrival.runwayTransitionIndex === runwayTransitionIndex && this._arrival.enrouteTransitionIndex === enrouteTransitionIndex))) {
            return;
        }

        let arrival = this._destination.waypoint.arrivals.getByIndex(index);
        await this._setArrival(arrival, enrouteTransitionIndex, runwayTransitionIndex);
    }

    async removeArrival() {
        if (!this.hasArrival()) {
            return;
        }

        let eventData = {types: 0};
        this._changeArrival(null, eventData);
        if (this.hasApproach()) {
            this._approach._setPrevious(this._enroute);
        }
        this._destination._setPrevious(this._enroute);
        this._updateLegs();
        this._fireEvent(eventData);
    }

    /**
     *
     * @param {WT_Approach} approach
     * @param {Number} transitionIndex
     */
    async _setApproach(approach, transitionIndex) {
        let transition;
        if (transitionIndex >= 0) {
            transition = approach.transitions.getByIndex(transitionIndex);
        }
        let runway = approach.runway;
        let legs = [];
        if (transition) {
            await this._buildLegsFromProcedure(transition.legs, legs);
        }
        await this._buildLegsFromProcedure(approach.finalLegs, legs);
        legs.push(new WT_FlightPlanWaypointFixLeg(new WT_CustomWaypoint(runway.designation, runway.start))); // runway fix
        let eventData = {types: 0};
        this._changeApproach(new WT_FlightPlanApproach(approach, transitionIndex, legs), eventData);
        if (this.hasArrival()) {
            this._approach._setPrevious(this._arrival);
        } else {
            this._approach._setPrevious(this._enroute);
        }
        this._updateLegs();
        this._fireEvent(eventData);
    }

    /**
     *
     * @param {String} name
     * @param {Number} [transitionIndex]
     */
    async setApproach(name, transitionIndex = -1) {
        if (!this.isDestinationAirport() ||
            (this.hasApproach() && (this._approach.procedure.name === name && this._approach.transitionIndex === transitionIndex))) {
            return;
        }

        let approach = this._destination.waypoint.approaches.getByName(name);
        await this._setApproach(approach, transitionIndex);
    }

    /**
     *
     * @param {Number} index
     * @param {Number} [transitionIndex]
     */
    async setApproachIndex(index, transitionIndex = -1) {
        if (!this.isDestinationAirport() ||
            (this.hasApproach() && (this._approach.procedure.name === this._destination.approaches.getByIndex(index).name && this._approach.transitionIndex === transitionIndex))) {
            return;
        }

        let approach = this._destination.waypoint.approaches.getByIndex(index);
        await this._setApproach(approach, transitionIndex);
    }

    async removeApproach() {
        if (!this.hasApproach()) {
            return;
        }

        let eventData = {types: 0};
        this._changeApproach(null, eventData);
        if (this.hasArrival()) {
            this._destinationLeg._setPrevious(this._arrival);
        } else {
            this._destinationLeg._setPrevious(this._enroute);
        }
        this._updateLegs();
        this._fireEvent(eventData);
    }

    /**
     *
     * @param {WT_FlightPlanElement} segmentElement
     * @param {WT_FlightPlanElement[]} elements
     * @param {Number} index
     * @param {Object} eventData
     */
    _insertToSegment(segmentElement, elements, index, eventData) {
        if (elements.length === 0) {
            return;
        }

        let eventType;
        switch (segmentElement.segment) {
            case WT_FlightPlan.Segment.DEPARTURE:
                eventType = WT_FlightPlanEvent.Type.DEPARTURE_ELEMENT_ADDED;
                break;
            case WT_FlightPlan.Segment.ENROUTE:
                eventType = WT_FlightPlanEvent.Type.ENROUTE_ELEMENT_ADDED;
                break;
            case WT_FlightPlan.Segment.ARRIVAL:
                eventType = WT_FlightPlanEvent.Type.ARRIVAL_ELEMENT_ADDED;
                break;
            case WT_FlightPlan.Segment.APPROACH:
                eventType = WT_FlightPlanEvent.Type.APPROACH_ELEMENT_ADDED;
                break;
        }
        eventData.types = eventData.types | eventType;

        if (!eventData.elementsAdded) {
            eventData.elementsAdded = [];
        }
        if (!eventData.elementsAdded[segmentElement.segment]) {
            eventData.elementsAdded[segmentElement.segment] = [];
        }
        for (let i = 0; i < elements.length; i++) {
            eventData.elementsAdded[segmentElement.segment].push({element: elements[i], index: index + i});
        }
        segmentElement._insertMultiple(elements, index);
    }

    /**
     *
     * @param {WT_FlightPlanElement} segmentElement
     * @param {Number} index
     * @param {Number} count
     * @param {Object} eventData
     */
    _removeFromSegment(segmentElement, index, count, eventData) {
        if (index < 0 || index >= segmentElement.length() || count === 0) {
            return;
        }

        let eventType;
        switch (segmentElement.segment) {
            case WT_FlightPlan.Segment.DEPARTURE:
                eventType = WT_FlightPlanEvent.Type.DEPARTURE_ELEMENT_REMOVED;
                break;
            case WT_FlightPlan.Segment.ENROUTE:
                eventType = WT_FlightPlanEvent.Type.ENROUTE_ELEMENT_REMOVED;
                break;
            case WT_FlightPlan.Segment.ARRIVAL:
                eventType = WT_FlightPlanEvent.Type.ARRIVAL_ELEMENT_REMOVED;
                break;
            case WT_FlightPlan.Segment.APPROACH:
                eventType = WT_FlightPlanEvent.Type.APPROACH_ELEMENT_REMOVED;
                break;
        }
        eventData.types = eventData.types | eventType;

        if (!eventData.elementsRemoved) {
            eventData.elementsRemoved = [];
        }
        if (!eventData.elementsRemoved[segmentElement.segment]) {
            eventData.elementsRemoved[segmentElement.segment] = [];
        }
        for (let i = index; i < index + count && i < segmentElement.length(); i++) {
            let removed = segmentElement.getElement(i);
            removed._index = -1;
            eventData.elementsRemoved[segmentElement.segment].push({element: removed, index: i});
        }
        segmentElement._removeByIndex(index, count);
    }

    _clearSegment(segmentElement, eventData) {
        this._removeFromSegment(segmentElement, 0, segmentElement.length(), eventData);
    }

    /**
     *
     * @param {WT_FlightPlanElement} segmentElement
     * @param {WT_FlightPlanElement[]} elements
     * @param {Object} eventData
     */
    _setSegmentTo(segmentElement, elements, eventData) {
        if (segmentElement.length() === elements.length) {
            let equals = true;
            for (let i = 0; i < elements.length; i++) {
                if (!segmentElement.getElement(i).equals(elements[i])) {
                    equals = false;
                    break;
                }
            }
            if (equals) {
                return;
            }
        }

        this._clearSegment(segmentElement, eventData);
        this._insertToSegment(segmentElement, elements, 0, eventData);
    }

    /**
     *
     * @param {Number} segment
     * @param {WT_Waypoint} waypoint
     * @param {Number} [index]
     */
    async insertWaypoint(segment, waypoint, index) {
        await this.insertWaypoints([waypoint], segment, index);
    }

    /**
     *
     * @param {Number} segment
     * @param {WT_Airway} airway
     * @param {WT_Waypoint} enter
     * @param {WT_Waypoint} exit
     * @param {Number} [index]
     */
    async insertAirway(segment, airway, enter, exit, index) {
        switch (segment) {
            case WT_FlightPlan.Segment.DEPARTURE:
            case WT_FlightPlan.Segment.ENROUTE:
            case WT_FlightPlan.Segment.ARRIVAL:
            case WT_FlightPlan.Segment.APPROACH:
                let segmentElement = this.getSegment(segment);
                if (index === undefined) {
                    index = segmentElement.length();
                }

                let waypoints = await airway.getWaypoints();
                let waypointCompare = (compare, waypoint) => waypoint.uniqueID === compare.uniqueID;
                let enterIndex = waypoints.findIndex(waypointCompare.bind(enter));
                let exitIndex = waypoints.findIndex(waypointCompare.bind(exit));
                if (enterIndex < 0 || exitIndex < 0 || enterIndex >= exitIndex) {
                    throw new Error("Invalid enter and/or exit points.");
                }

                let element = new WT_FlightPlanAirwaySequence(airway, waypoints.slice(enterIndex, exitIndex + 1).map(waypoint => new WT_FlightPlanWaypointFixLeg(waypoint)));

                let eventData = {types: 0};
                this._insertToSegment(segmentElement, [element], index, eventData);
                this._updateFromSegment(segment);
                this._updateLegs();
                this._fireEvent(eventData);
        }
    }

    /**
     *
     * @param {Number} segment
     * @param {WT_Waypoint[]} waypoints
     * @param {Number} index
     */
    async insertWaypoints(segment, waypoints, index) {
        switch (segment) {
            case WT_FlightPlan.Segment.DEPARTURE:
            case WT_FlightPlan.Segment.ENROUTE:
            case WT_FlightPlan.Segment.ARRIVAL:
            case WT_FlightPlan.Segment.APPROACH:
                let segmentElement = this.getSegment(segment);
                if (index === undefined) {
                    index = segmentElement.length();
                }
                let elements = waypoints.map(waypoint => new WT_FlightPlanWaypointFixLeg(waypoint));
                let eventData = {types: 0};
                this._insertToSegment(segmentElement, elements, index, eventData);
                this._updateFromSegment(segment);
                this._updateLegs();
                this._fireEvent(eventData);
        }
    }

    /**
     *
     * @param {Number} segment
     * @param {Number} index
     * @param {Number} [count]
     */
    removeByIndex(segment, index, count = 1) {
        switch (segment) {
            case WT_FlightPlan.Segment.DEPARTURE:
            case WT_FlightPlan.Segment.ENROUTE:
            case WT_FlightPlan.Segment.ARRIVAL:
            case WT_FlightPlan.Segment.APPROACH:
                let segmentElement = this.getSegment(segment);
                if (index >= 0 && index < segmentElement.length()) {
                    let eventData = {types: 0};
                    this._removeFromSegment(segmentElement, index, count, eventData);
                    this._updateFromSegment(segment);
                    this._updateLegs();
                    this._fireEvent(eventData);
                }
        }
    }

    clear() {
        let eventData = {types: 0};
        this._changeOrigin(null, eventData);
        this._changeDeparture(null, eventData);
        this._clearSegment(this._enroute, eventData);
        this._changeArrival(null, eventData);
        this._changeApproach(null, eventData);
        this._enroute._setPrevious(this._origin);
        this._destination._setPrevious(this._enroute);
        this._updateLegs();
        this._fireEvent(eventData);
    }

    copy() {
        let copy = new WT_FlightPlan(this._icaoWaypointFactory);
        copy.copyFrom(flightPlan);
        return copy;
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     */
    copyFrom(flightPlan) {
        let eventData = {types: 0};
        this._changeOrigin(flightPlan.getOrigin().waypoint, eventData);
        this._changeDestination(flightPlan.getDestination().waypoint, eventData);
        if (flightPlan.hasDeparture()) {
            let departure = flightPlan.getDeparture();
            this._changeDeparture(departure.copy(), eventData);
            this._departure._setPrevious(this._origin);
        } else {
            this._changeDeparture(null, eventData);
        }
        this._enroute._setPrevious(this._departure ? this._departure : this._origin);
        if (!flightPlan.getEnroute().equals(this._enroute)) {
            let enrouteElements = [];
            for (let element of flightPlan.getEnroute().elements()) {
                enrouteElements.push(element.copy());
            }
            this._clearSegment(this._enroute, eventData);
            this._insertToSegment(this._enroute, enrouteElements, 0, eventData);
        }
        if (flightPlan.hasArrival()) {
            let arrival = flightPlan.getArrival();
            this._changeArrival(arrival.copy(), eventData);
            this._arrival._setPrevious(this._enroute);
        } else {
            this._changeArrival(null, eventData);
        }
        if (flightPlan.hasApproach()) {
            let approach = flightPlan.getApproach();
            this._changeApproach(approach.copy(), eventData);
            this._approach._setPrevious(this._arrival ? this._arrival : this._enroute);
        } else {
            this._changeApproach(null, eventData);
        }
        if (this.hasDestination()) {
            this._destination._setPrevious(this._arrival ? this._arrival : this._enroute);
        }
        if (eventData.types !== 0) {
            this._updateLegs();
            this._fireEvent(eventData);
        }
    }

    _onLegAltitudeConstraintChanged(leg, newValue, oldValue) {
        if (!newValue.equals(oldValue)) {
            this._fireEvent({
                type: WT_FlightPlanEvent.LEG_ALTITUDE_CHANGED,
                oldAltitudeConstraint: oldValue,
                newAltitudeConstraint: newValue
            });
        }
    }

    _fireEvent(eventData) {
        if (eventData.types === 0) {
            return;
        }

        let event = new WT_FlightPlanEvent(eventData);
        for (let listener of this._listeners) {
            listener(event);
        }
    }

    addListener(listener) {
        this._listeners.push(listener);
    }

    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    clearListeners() {
        this._listeners = [];
    }
}
/**
 * @enum {Number}
 */
WT_FlightPlan.Segment = {
    ORIGIN: 0,
    DEPARTURE: 1,
    ENROUTE: 2,
    ARRIVAL: 3,
    APPROACH: 4,
    DESTINATION: 5
};

class WT_FlightPlanEvent {
    constructor(data) {
        this._data = data;
    }

    /**
     * @readonly
     * @property {Number} types
     * @type {Number}
     */
    get types() {
        return this._data.types;
    }

    anyType(type) {
        return (this.types & type) !== 0;
    }

    allTypes(type) {
        return (this.types & type) === type;
    }

    get oldOrigin() {
        return this._data.oldOrigin;
    }

    get newOrigin() {
        return this._data.newOrigin;
    }

    get oldDeparture() {
        return this._data.oldDeparture;
    }

    get newDeparture() {
        return this._data.newDeparture;
    }

    get oldDestination() {
        return this._data.oldDestination;
    }

    get newDestination() {
        return this._data.newDestination;
    }

    get oldArrival() {
        return this._data.oldArrival;
    }

    get newArrival() {
        return this._data.newArrival;
    }

    get oldApproach() {
        return this._data.oldApproach;
    }

    get newApproach() {
        return this._data.newApproach;
    }

    get elementsAdded() {
        return this._data.elementsAdded;
    }

    get elementsRemoved() {
        return this._data.elementsRemoved;
    }

    get oldAltitudeConstraint() {
        return this._data.oldAltitudeConstraint;
    }

    get newAltitudeConstraint() {
        return this._data.newAltitudeConstraint;
    }
}
/**
 * @enum {Number}
 */
WT_FlightPlanEvent.Type = {
    ORIGIN_CHANGED: 1,
    DESTINATION_CHANGED: 1 << 2,
    DEPARTURE_CHANGED: 1 << 3,
    ARRIVAL_CHANGED: 1 << 4,
    APPROACH_CHANGED: 1 << 5,
    DEPARTURE_ELEMENT_ADDED: 1 << 6,
    DEPARTURE_ELEMENT_REMOVED: 1 << 7,
    ENROUTE_ELEMENT_ADDED: 1 << 8,
    ENROUTE_ELEMENT_REMOVED: 1 << 9,
    ARRIVAL_ELEMENT_ADDED: 1 << 10,
    ARRIVAL_ELEMENT_REMOVED: 1 << 11,
    APPROACH_ELEMENT_ADDED: 1 << 12,
    APPROACH_ELEMENT_REMOVED: 1 << 13,
    LEG_ALTITUDE_CHANGED: 1 << 14
};

class WT_FlightPlanElement {
    /**
     * @param {WT_FlightPlanElement} [parent]
     * @param {Number} [segment]
     */
    constructor(parent, segment) {
        this._parent = null;
        this._flightPlan = null;
        this._segment = (typeof segment === "number") ? segment : null;
        this._setParent(parent);
        /**
         * @type {WT_FlightPlanElement}
         */
        this._prev;
        this._distance = new WT_NumberUnit(0, WT_Unit.GA_RADIAN);
        this._cumulativeDistance = new WT_NumberUnit(0, WT_Unit.GA_RADIAN);
    }

    /**
     * @readonly
     * @property {WT_FlightPlanElement} parent
     * @type {WT_FlightPlanElement}
     */
    get parent() {
        return this._parent;
    }

    /**
     * @readonly
     * @property {WT_FlightPlan} flightPlan
     * @type {WT_FlightPlan}
     */
    get flightPlan() {
        return this.parent ? this.parent.flightPlan : this._flightPlan;
    }

    /**
     * @readonly
     * @property {Number} segment
     * @type {Number}
     */
    get segment() {
        if (this.parent) {
            return this.parent.segment;
        } else {
            return this._segment;
        }
    }

    /**
     * @readonly
     * @property {WT_GeoPointReadOnly} endpoint
     * @type {WT_GeoPointReadOnly}
     */
    get endpoint() {
        return undefined;
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} distance
     * @type {WT_NumberUnitReadOnly}
     */
    get distance() {
        return this._distance.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} distance
     * @type {WT_NumberUnitReadOnly}
     */
    get cumulativeDistance() {
        return this._cumulativeDistance.readonly();
    }

    _updateDistance() {
    }

    _update() {
        this._updateDistance();
        this._cumulativeDistance.set(this.distance.asUnit(WT_Unit.GA_RADIAN) + (this._prev ? this._prev.cumulativeDistance.asUnit(WT_Unit.GA_RADIAN) : 0));
    }

    /**
     *
     * @param {WT_FlightPlanElement} parent
     */
    _setParent(parent) {
        this._parent = parent;
        if (parent) {
            this._root = parent.root ? parent.root : parent;
        } else {
            this._root = null;
        }
    }

    /**
     *
     * @param {WT_FlightPlanElement} leg
     */
    _setPrevious(leg) {
        this._prev = leg;
        this._update();
    }

    copy() {
        return null;
    }

    /**
     * @returns {WT_FlightPlanLeg[]}
     */
    legs() {
        return null;
    }
}

class WT_FlightPlanLeg extends WT_FlightPlanElement {
    constructor(parent, segment, altitudeConstraint) {
        super(parent, segment);

        this._altitudeConstraint = altitudeConstraint ? altitudeConstraint : WT_AltitudeConstraint.NO_CONSTRAINT;
        this._desiredTrack;
        this._index = -1;
    }

    /**
     * @readonly
     * @property {WT_GeoPointReadOnly} endpoint
     * @type {WT_GeoPointReadOnly}
     */
    get endpoint() {
        return this.fix.location;
    }

    /**
     * @readonly
     * @property {Number} index - the index of this leg in its parent flight plan, or -1 if this leg does not belong to a
     *                            flight plan.
     * @type {Number}
     */
    get index() {
        return this._index;
    }

    /**
     * @readonly
     * @property {WT_Waypoint} fix
     * @type {WT_Waypoint}
     */
    get fix() {
        return null;
    }

    /**
     * @readonly
     * @property {Boolean} discontinuity
     * @type {Boolean}
     */
    get discontinuity() {
        return false;
    }

    /**
     *
     * @returns {WT_AltitudeConstraint}
     */
    getAltitudeConstraint() {
        return this._altitudeConstraint;
    }

    /**
     *
     * @param {WT_AltitudeConstraint} constraint
     */
    setAltitudeConstraint(constraint) {
        let old = this._altitudeConstraint;
        this._altitudeConstraint = constraint;
        if (this.flightPlan) {
            this.flightPlan._onLegAltitudeConstraintChanged(this, constraint, old);
        }
    }

    /**
     *
     * @returns {Number}
     */
    desiredTrack() {
        return this._desiredTrack;
    }

    _updateDTK() {
        this._desiredTrack = (this._prev && this._prev.endpoint) ? this._prev.endpoint.bearingTo(this.endpoint) : undefined;
    }

    _update() {
        super._update();
        this._updateDTK();
    }

    legs() {
        return [this];
    }
}

class WT_FlightPlanWaypointFixLeg extends WT_FlightPlanLeg {
    /**
     *
     * @param {WT_Waypoint} fix
     */
    constructor(fix, parent, segment) {
        super(parent, segment);
        this._fix = fix;
    }

    /**
     * @readonly
     * @property {WT_Waypoint} fix
     * @type {WT_Waypoint}
     */
    get fix() {
        return this._fix;
    }

    _updateDistance() {
        this._distance.set((this._prev && this._prev.endpoint) ? this.endpoint.distance(this._prev.endpoint) : 0);
    }

    copy() {
        return new WT_FlightPlanWaypointFixLeg(this.fix, null, this._segment);
    }

    equals(other) {
        return (other instanceof WT_FlightPlanWaypointFixLeg) && this.fix.uniqueID === other.fix.uniqueID;
    }
}

class WT_FlightPlanProcedureLeg extends WT_FlightPlanWaypointFixLeg {
    /**
     * @param {WT_ProcedureLeg} procedureLeg
     * @param {WT_Waypoint} fix
     */
    constructor(procedureLeg, fix, parent, segment) {
        super(fix, parent, segment);
        this._procedureLeg = procedureLeg;

        this.setAltitudeConstraint(procedureLeg.altitudeConstraint);
    }

    /**
     * @readonly
     * @property {WT_ProcedureLeg} airport
     * @type {WT_ProcedureLeg}
     */
    get procedureLeg() {
        return this._procedureLeg;
    }

    /**
     * @readonly
     * @property {Boolean} discontinuity
     * @type {Boolean}
     */
    get discontinuity() {
        return this.procedureLeg.discontinuity;
    }

    copy() {
        return new WT_FlightPlanProcedureLeg(this.procedureLeg, this.fix, null, this._segment);
    }

    equals(other) {
        return super.equals(other) && (other instanceof WT_FlightPlanProcedureLeg);
    }
}

class WT_FlightPlanSequence extends WT_FlightPlanElement {
    constructor(parent, segment, elements) {
        super(parent, segment);
        /**
         * @type {WT_FlightPlanElement[]}
         */
        this._elements = [];

        if (elements) {
            this._insertMultiple(elements);
        }
        this._update();
    }

    /**
     * @readonly
     * @property {WT_GeoPointReadOnly} endpoint
     * @type {WT_GeoPointReadOnly}
     */
    get endpoint() {
        return this._elements.length > 0 ? this._elements[this._elements.length - 1].endpoint : (this._prev ? this._prev.endpoint : null);
    }

    /**
     * @readonly
     * @property {Number} desiredTrack
     * @type {Number}
     */
    get desiredTrack() {
        return undefined;
    }

    length() {
        return this._elements.length;
    }

    getElement(index) {
        return this._elements[index];
    }

    elements() {
        return this._elements.values();
    }

    _updateDistance() {
        this._distance.set(0);
        for (let i = 0; i < this._elements.length; i++) {
            let current = this._elements[i];
            let prev = i === 0 ? this._prev : this._elements[i - 1];
            current._setPrevious(prev);
            this._distance.add(current.distance);
        }
    }

    _insert(element, index) {
        if (index === undefined) {
            index = this._elements.length;
        }
        this._elements.splice(index, 0, element);
        element._setParent(this);
        this._update();
    }

    _insertMultiple(elements, index) {
        if (index === undefined) {
            index = this._elements.length;
        }
        this._elements.splice(index, 0, ...elements);
        for (let element of elements) {
            element._setParent(this);
        }
        this._update();
    }

    _remove(element) {
        let index = this._elements.indexOf(element);
        if (index >= 0) {
            this.removeByIndex(index);
        }
    }

    _removeByIndex(index, count = 1) {
        let removed = this._elements.splice(index, count);
        for (let element of removed) {
            element._setParent(null);
        }
        this._update();
    }

    _clear() {
        for (let element of this._elements) {
            element._setParent(null);
        }
        this._elements = [];
        this._update();
    }

    legs() {
        let legs = [];
        for (let element of this._elements) {
            legs.push(...element.legs());
        }
        return legs;
    }

    _copyElements() {
        return this._elements.map(element => element.copy());
    }

    copy() {
        return new WT_FlightPlanSequence(this._copyElements(), null, this._segment);
    }

    equals(other) {
        if (!(other instanceof WT_FlightPlanSequence)) {
            return false;
        }
        if (this.length() !== other.length()) {
            return false;
        }

        for (let i = 0; i < this._elements.length; i++) {
            if (!this._elements[i].equals(other._elements[i])) {
                return false;
            }
        }
        return true;
    }
}

class WT_FlightPlanAirwaySequence extends WT_FlightPlanSequence {
    constructor(airway, legs, parent, segment) {
        super(parent, segment, legs);
        this._airway = airway;
    }

    /**
     * @readonly
     * @property {WT_Airway} airway
     * @type {WT_Airway}
     */
    get airway() {
        return this._airway;
    }

    copy() {
        return new WT_FlightPlanAirwaySequence(this.airway, this._copyElements(), null, this._segment);
    }
}

class WT_FlightPlanSegment extends WT_FlightPlanSequence {
    _setFlightPlan(flightPlan) {
        this._flightPlan = flightPlan;
    }
}

class WT_FlightPlanOriginDest extends WT_FlightPlanSegment {
    constructor(waypoint, segment) {
        super(null, segment);

        this._setWaypoint(waypoint);
    }

    /**
     * @readonly
     * @property {WT_Waypoint} waypoint
     * @type {WT_Waypoint}
     */
    get waypoint() {
        return this._elements.length > 0 ? this._elements[0].fix : null;
    }

    leg() {
        return this._elements.length > 0 ? this._elements[0] : null;
    }

    _setWaypoint(waypoint) {
        this._clear();
        if (waypoint) {
            this._insert(new WT_FlightPlanWaypointFixLeg(waypoint, this), 0);
        }
    }
}

class WT_FlightPlanOrigin extends WT_FlightPlanOriginDest {
    constructor(waypoint) {
        super(waypoint, WT_FlightPlan.Segment.ORIGIN);
    }

    copy() {
        return new WT_FlightPlanOrigin(this.waypoint);
    }

    equals(other) {
        return other instanceof WT_FlightPlanOrigin &&
               ((this.waypoint && other.waypoint && this.waypoint.uniqueID === other.waypoint.uniqueID) || this.waypoint === null && other.waypoint === null);
    }
}

class WT_FlightPlanDestination extends WT_FlightPlanOriginDest {
    constructor(waypoint) {
        super(waypoint, WT_FlightPlan.Segment.DESTINATION);
    }

    copy() {
        return new WT_FlightPlanDestination(this.waypoint);
    }

    equals(other) {
        return other instanceof WT_FlightPlanDestination &&
               ((this.waypoint && other.waypoint && this.waypoint.uniqueID === other.waypoint.uniqueID) || this.waypoint === null && other.waypoint === null);
    }
}

class WT_FlightPlanEnroute extends WT_FlightPlanSegment {
    constructor() {
        super(null, WT_FlightPlan.Segment.ENROUTE);
    }
}

class WT_FlightPlanProcedureSegment extends WT_FlightPlanSegment {
    constructor(procedure, segment, legs) {
        super(null, segment, legs);
        this._procedure = procedure;
    }

    /**
     * @readonly
     * @property {WT_Procedure} procedure
     * @type {WT_Procedure}
     */
    get procedure() {
        return this._procedure;
    }
}

class WT_FlightPlanDepartureArrival extends WT_FlightPlanProcedureSegment {
    constructor(procedure, runwayTransitionIndex, enrouteTransitionIndex, segment, legs) {
        super(procedure, segment, legs);

        this._runwayTransitionIndex = runwayTransitionIndex;
        this._enrouteTransitionIndex = enrouteTransitionIndex;
    }

    /**
     * @readonly
     * @property {Number} runwayTransitionIndex
     * @type {Number}
     */
    get runwayTransitionIndex() {
        return this._runwayTransitionIndex;
    }

    /**
     * @readonly
     * @property {Number} enrouteTransitionIndex
     * @type {Number}
     */
    get enrouteTransitionIndex() {
        return this._enrouteTransitionIndex;
    }
}

class WT_FlightPlanDeparture extends WT_FlightPlanDepartureArrival {
    constructor(departure, runwayTransitionIndex, enrouteTransitionIndex, legs) {
        super(departure, runwayTransitionIndex, enrouteTransitionIndex, WT_FlightPlan.Segment.DEPARTURE, legs);
    }

    copy() {
        return new WT_FlightPlanDeparture(this.procedure, this.runwayTransitionIndex, this.enrouteTransitionIndex, this._copyElements());
    }

    equals(other) {
        return other instanceof WT_FlightPlanDeparture &&
               this.procedure.name === other.procedure.name &&
               this.procedure.airport.icao === other.procedure.airport.icao &&
               this.runwayTransitionIndex === other.runwayTransitionIndex &&
               this.enrouteTransitionIndex === other.enrouteTransitionIndex &&
               super.equals(other);
    }
}

class WT_FlightPlanArrival extends WT_FlightPlanDepartureArrival {
    constructor(arrival, runwayTransitionIndex, enrouteTransitionIndex, legs) {
        super(arrival, runwayTransitionIndex, enrouteTransitionIndex, WT_FlightPlan.Segment.ARRIVAL, legs);
    }

    copy() {
        return new WT_FlightPlanArrival(this.procedure, this.runwayTransitionIndex, this.enrouteTransitionIndex, this._copyElements());
    }

    equals(other) {
        return other instanceof WT_FlightPlanArrival &&
               this.procedure.name === other.procedure.name &&
               this.procedure.airport.icao === other.procedure.airport.icao &&
               this.runwayTransitionIndex === other.runwayTransitionIndex &&
               this.enrouteTransitionIndex === other.enrouteTransitionIndex &&
               super.equals(other);
    }
}

class WT_FlightPlanApproach extends WT_FlightPlanProcedureSegment {
    constructor(approach, transitionIndex, legs) {
        super(approach, WT_FlightPlan.Segment.APPROACH, legs);

        this._transitionIndex = transitionIndex;
    }

    /**
     * @readonly
     * @property {Number} transitionIndex
     * @type {Number}
     */
    get transitionIndex() {
        return this._transitionIndex;
    }

    copy() {
        return new WT_FlightPlanApproach(this.procedure, this.transitionIndex, this._copyElements());
    }

    equals(other) {
        return other instanceof WT_FlightPlanApproach &&
               this.procedure.airport.icao === other.procedure.airport.icao &&
               this.procedure.name === other.procedure.name &&
               this.transitionIndex === other.transitionIndex &&
               super.equals(other);
    }
}