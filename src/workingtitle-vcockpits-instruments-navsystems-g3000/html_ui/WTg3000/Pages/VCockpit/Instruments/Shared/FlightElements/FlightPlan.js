class WT_FlightPlan {
    constructor(icaoWaypointFactory) {
        this._icaoWaypointFactory = icaoWaypointFactory;

        /**
         * @type {WT_Waypoint}
         */
        this._origin = null;
        /**
         * @type {WT_Waypoint}
         */
        this._destination = null;

        this._originLeg = null;
        this._destinationLeg = null;

        this._enroute = new WT_FlightPlanSequence();

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

        this._listeners = [];
    }

    hasOrigin() {
        return this._origin !== null;
    }

    isOriginAirport() {
        return this.hasOrigin() && this._origin.icao && this._origin.type === WT_ICAOWaypoint.Type.AIRPORT;
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
        return this._destination !== null;
    }

    isDestinationAirport() {
        return this.hasDestination() && this._destination.icao && this._destination.type === WT_ICAOWaypoint.Type.AIRPORT;
    }

    /**
     * @returns {WT_Waypoint}
     */
    getOrigin() {
        return this._origin;
    }

    /**
     * @returns {WT_Waypoint}
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

    _changeOrigin(origin, eventData) {
        if (origin !== this._origin) {
            eventData.types = eventData.types | WT_FlightPlanEvent.Type.ORIGIN_CHANGED;
            eventData.oldOrigin = this._origin;
            eventData.newOrigin = origin;
            this._origin = origin;
            this._originLeg = origin ? new WT_FlightPlanWaypointFixLeg(origin) : null;
        }
    }

    _changeDeparture(departure, eventData) {
        if (departure !== this._departure) {
            eventData.types = eventData.types | WT_FlightPlanEvent.Type.DEPARTURE_CHANGED;
            eventData.oldDeparture = this._departure;
            eventData.newDeparture = departure;
            this._departure = departure;
        }
    }

    _changeArrival(arrival, eventData) {
        if (arrival !== this._arrival) {
            eventData.types = eventData.types | WT_FlightPlanEvent.Type.ARRIVAL_CHANGED;
            eventData.oldArrival = this._arrival;
            eventData.newArrival = arrival;
            this._arrival = arrival;
        }
    }

    _changeApproach(approach, eventData) {
        if (approach !== this._approach) {
            eventData.types = eventData.types | WT_FlightPlanEvent.Type.APPROACH_CHANGED;
            eventData.oldApproach = this._approach;
            eventData.newApproach = approach;
            this._approach = approach;
        }
    }

    _changeDestination(destination, eventData) {
        if (destination !== this._destination) {
            eventData.types = eventData.types | WT_FlightPlanEvent.Type.DESTINATION_CHANGED;
            eventData.oldDestination = this._destination;
            eventData.newDestination = destination;
            this._destination = destination;
            this._destinationLeg = destination ? new WT_FlightPlanWaypointFixLeg(destination) : null;
        }
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    setOrigin(waypoint) {
        if (!waypoint || (this.hasOrigin() && (waypoint.uniqueID === this._origin.uniqueID))) {
            return;
        }

        let eventData = {types: 0};
        this._changeOrigin(waypoint, eventData);
        this._changeDeparture(null, eventData);
        this._enroute._setPrevious(this._originLeg);
        this._updateFromEnroute();
        this._fireEvent(eventData);
    }

    removeOrigin() {
        if (!this.hasOrigin()) {
            return;
        }

        let eventData = {types: 0};
        this._changeOrigin(null, eventData);
        this._changeDeparture(null, eventData);
        this._enroute._setPrevious(null);
        this._updateFromEnroute();
        this._fireEvent(eventData);
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    setDestination(waypoint) {
        if (!waypoint || (this.hasDestination() && (waypoint.uniqueID === this._destination.uniqueID))) {
            return;
        }

        let eventData = {types: 0};
        this._changeDestination(waypoint, eventData);
        this._destinationLeg._setPrevious(this._enroute);
        this._changeArrival(null, eventData);
        this._approach = null;
        this._fireEvent(eventData);
    }

    removeDestination() {
        if (!this.hasDestination()) {
            return;
        }

        let eventData = {types: 0};
        this._changeDestination(null, eventData);
        this._changeArrival(null, eventData);
        this._approach = null;
        this._fireEvent(eventData);
    }

    _updateFromEnroute() {
        if (this.hasArrival()) {
            this._arrival._update();
        }
        if (this.hasApproach()) {
            this._approach._update();
        }
        if (this.hasDestination()) {
            this._destinationLeg._update();
        }
    }

    _insertEnroute(elements, index, eventData) {
        if (elements.length === 0) {
            return;
        }

        eventData.types = eventData.types | WT_FlightPlanEvent.Type.ENROUTE_WAYPOINT_ADDED;
        if (!eventData.enrouteAdded) {
            eventData.enrouteAdded = [];
        }
        for (let i = 0; i < elements.length; i++) {
            eventData.enrouteAdded.push({element: elements[i], index: index + i});
        }
        this._enroute._insertMultiple(elements, index);
    }

    _removeEnroute(index, eventData) {
        eventData.types = eventData.types | WT_FlightPlanEvent.Type.ENROUTE_WAYPOINT_REMOVED;
        if (!eventData.enrouteRemoved) {
            eventData.enrouteRemoved = [];
        }
        eventData.enrouteRemoved.push({element: this._enroute.getElement(index), index: index});
        this._enroute._removeByIndex(index, 1);
    }

    _clearEnroute(eventData) {
        if (this._enroute.length() > 0) {
            eventData.types = eventData.types | WT_FlightPlanEvent.Type.ENROUTE_WAYPOINT_REMOVED;
            if (!eventData.enrouteRemoved) {
                eventData.enrouteRemoved = [];
            }
            let i = 0;
            for (let element of this._enroute.elements()) {
                eventData.enrouteRemoved.push({element: element, index: i});
                i++;
            }
            this._enroute.clear();
        }
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     * @param {Number} [index]
     */
    async insertEnrouteWaypoint(waypoint, index) {
        this.insertEnrouteWaypoints([waypoint], index);
    }

    /**
     *
     * @param {WT_Waypoint[]} waypoints
     * @param {Number} [index]
     */
    async insertEnrouteWaypoints(waypoints, index) {
        if (index === undefined) {
            index = this._enroute.length();
        }

        let elements = waypoints.map(waypoint => new WT_FlightPlanWaypointFixLeg(waypoint));
        let eventData = {types: 0};
        this._insertEnroute(elements, index, eventData);
        this._updateFromEnroute();
        this._fireEvent(eventData);
    }

    /**
     *
     * @param {WT_Airway} airway
     * @param {WT_Waypoint} enter
     * @param {WT_Waypoint} exit
     * @param {Number} [index]
     */
    async insertEnrouteAirway(airway, enter, exit, index) {
        if (index === undefined) {
            index = this._enroute.length();
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
        this._insertEnroute([element], index, eventData);
        this._updateFromEnroute();
        this._fireEvent(eventData);
    }

    removeEnrouteIndex(index) {
        if (index >= 0 && index < this._enroute.length()) {
            let eventData = {types: 0};
            this._removeEnroute(index, eventData);
            this._updateFromEnroute();
            this._fireEvent(eventData);
        }
    }

    /**
     *
     * @param {WT_ProcedureLegList} procedureLegs
     * @param {WT_FlightPlanProcedureLeg[]} legs
     */
    async _buildLegsFromProcedure(procedureLegs, legs) {
        let previous = legs.length > 0 ? legs[legs.length - 1].waypoint : undefined;
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
        let runwayTransition = departure.runwayTransitions.getByIndex(runwayTransitionIndex);
        let runway = runwayTransition.runway;
        let enrouteTransition = departure.enrouteTransitions.getByIndex(enrouteTransitionIndex);
        let legs = [new WT_FlightPlanWaypointFixLeg(new WT_CustomWaypoint(runway.designation, runway.end))]; // runway fix
        await this._buildLegsFromProcedure(runwayTransition.legs, legs);
        await this._buildLegsFromProcedure(departure.commonLegs, legs);
        await this._buildLegsFromProcedure(enrouteTransition.legs, legs);
        let eventData = {types: 0};
        this._changeDeparture(new WT_FlightPlanDeparture(departure, runwayTransitionIndex, enrouteTransitionIndex, legs), eventData);
        this._enroute._setPrevious(this._departure);
        this._updateFromEnroute();
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

        let departure = this._origin.departures.getByName(name);
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

        let departure = this._origin.departures.getByIndex(index);
        await this._setDeparture(departure, runwayTransitionIndex, enrouteTransitionIndex);
    }

    async removeDeparture() {
        if (!this.hasDeparture()) {
            return;
        }

        let eventData = {types: 0};
        this._changeDeparture(null, eventData);
        this._enroute._setPrevious(this._origin);
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
        let runway;
        if (runwayTransitionIndex >= 0) {
            runwayTransition = arrival.runwayTransitions.getByIndex(runwayTransitionIndex);
            runway = runwayTransition.runway;
        }
        let legs = [];
        await this._buildLegsFromProcedure(enrouteTransition.legs, legs);
        await this._buildLegsFromProcedure(arrival.commonLegs, legs);
        if (runwayTransition) {
            await this._buildLegsFromProcedure(runwayTransition.legs, legs);
        }
        if (!this.hasApproach && runway) {
            legs.push(new WT_FlightPlanWaypointFixLeg(new WT_CustomWaypoint(runway.designation, runway.start))); // runway fix
        }
        let eventData = {types: 0};
        this._changeArrival(new WT_FlightPlanArrival(arrival, runwayTransitionIndex, enrouteTransitionIndex, legs), eventData);
        this._arrival._setPrevious(this._enroute);
        if (this.hasApproach()) {
            this._approach._setPrevious(this._arrival);
        }
        this._destinationLeg._setPrevious(this._arrival);
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

        let arrival = this._destination.arrivals.getByName(name);
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

        let arrival = this._destination.arrivals.getByIndex(index);
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
        this._destinationLeg._setPrevious(this._enroute);
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

        let approach = this._destination.approaches.getByName(name);
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

        let approach = this._destination.approaches.getByIndex(index);
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
        this._fireEvent(eventData);
    }

    clear() {
        let eventData = {types: 0};
        this._changeOrigin(null, eventData);
        this._changeDeparture(null, eventData);
        this._clearEnroute(eventData);
        this._changeArrival(null, eventData);
        this._changeApproach(null, eventData);
        this._enroute._setPrevious(null);
        this._fireEvent(eventData);
    }

    copy() {
        let copy = new WT_FlightPlan(this._icaoWaypointFactory);
        copy.copyFrom(flightPlan);
        return copy;
    }

    copyFrom(flightPlan) {
        let eventData = {types: 0};
        this._changeOrigin(flightPlan.getOrigin(), eventData);
        this._changeDestination(flightPlan.getDestination(), eventData);
        if (flightPlan.hasDeparture()) {
            let departure = flightPlan.getDeparture();
            this._changeDeparture(departure.copy(), eventData);
            this._departure._setPrevious(this._originLeg);
        } else {
            this._changeDeparture(null, eventData);
        }
        this._enroute._setPrevious(this._departure ? this._departure : this._originLeg);
        let enrouteElements = [];
        for (let element of flightPlan.getEnroute().elements()) {
            enrouteElements.push(element.copy());
        }
        this._clearEnroute(eventData);
        this._insertEnroute(enrouteElements, 0, eventData);
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
            this._destinationLeg._setPrevious(this._arrival ? this._arrival : this._enroute);
        }
        this._fireEvent(eventData);
    }

    /**
     * @returns {WT_FlightPlanLeg[]}
     */
    legs() {
        let legs = [];
        if (this._departure) {
            legs.push(...this._departure.legs());
        } else if (this._origin) {
            legs.push(this._originLeg);
        }
        legs.push(...this._enroute.legs());
        if (this._destination) {
            if (this._arrival) {
                legs.push(...this._arrival.legs());
            }
            if (this._approach) {
                legs.push(...this._approach.legs());
            }
            if (!this._approach && (!this._arrival || this._arrival.runwayTransitionIndex < 0)) {
                legs.push(this._destinationLeg);
            }
        }
        return legs;
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

    get enrouteAdded() {
        return this._data.enrouteAdded;
    }

    get enrouteRemoved() {
        return this._data.enrouteRemoved;
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
}
/**
 * @enum {Number}
 */
WT_FlightPlanEvent.Type = {
    ORIGIN_CHANGED: 1,
    DEPARTURE_CHANGED: 1 << 1,
    ENROUTE_WAYPOINT_ADDED: 1 << 2,
    ENROUTE_WAYPOINT_REMOVED: 1 << 3,
    DESTINATION_CHANGED: 1 << 4,
    ARRIVAL_CHANGED: 1 << 5,
    APPROACH_CHANGED: 1 << 6
};

class WT_FlightPlanElement {
    constructor() {
        /**
         * @type {WT_FlightPlanElement}
         */
        this._prev;
        this._distance = new WT_NumberUnit(0, WT_Unit.GA_RADIAN);
        this._cumulativeDistance = new WT_NumberUnit(0, WT_Unit.GA_RADIAN);
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
     * @param {WT_FlightPlanElement} leg
     */
    _setPrevious(leg) {
        this._prev = leg;
        this._update();
    }

    copy() {
        return null;
    }
}

class WT_FlightPlanLeg extends WT_FlightPlanElement {
    constructor() {
        super();
        this._desiredTrack;
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
     * @readonly
     * @property {Number} desiredTrack
     * @type {Number}
     */
    get desiredTrack() {
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
     * @param {WT_Waypoint} waypoint
     */
    constructor(waypoint) {
        super();
        this._waypoint = waypoint;
    }

    /**
     * @readonly
     * @property {WT_Waypoint} waypoint
     * @type {WT_Waypoint}
     */
    get waypoint() {
        return this._waypoint;
    }

    /**
     * @readonly
     * @property {WT_GeoPointReadOnly} endpoint
     * @type {WT_GeoPointReadOnly}
     */
    get endpoint() {
        return this.waypoint.location;
    }

    _updateDistance() {
        this._distance.set((this._prev && this._prev.endpoint) ? this.endpoint.distance(this._prev.endpoint) : 0);
    }

    copy() {
        return new WT_FlightPlanWaypointFixLeg(this.waypoint);
    }
}

class WT_FlightPlanProcedureLeg extends WT_FlightPlanWaypointFixLeg {
    /**
     * @param {WT_ProcedureLeg} procedureLeg
     * @param {WT_Waypoint} fix
     */
    constructor(procedureLeg, fix) {
        super(fix);
        this._procedureLeg = procedureLeg;
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
        return new WT_FlightPlanProcedureLeg(this.procedureLeg, this.waypoint);
    }
}

class WT_FlightPlanSequence extends WT_FlightPlanElement {
    constructor(elements = []) {
        super();
        /**
         * @type {WT_FlightPlanElement[]}
         */
        this._elements = Array.from(elements);
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
        this._update();
    }

    _insertMultiple(elements, index) {
        if (index === undefined) {
            index = this._elements.length;
        }
        this._elements.splice(index, 0, ...elements);
        this._update();
    }

    _remove(element) {
        let index = this._elements.indexOf(element);
        if (index >= 0) {
            this.removeByIndex(index);
        }
    }

    _removeByIndex(index, count = 1) {
        this._elements.splice(index, count);
        this._update();
    }

    _clear() {
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
        return new WT_FlightPlanSequence(this._copyElements());
    }
}

class WT_FlightPlanAirwaySequence extends WT_FlightPlanSequence {
    constructor(airway, legs) {
        super(legs);
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
        return new WT_FlightPlanAirwaySequence(this.airway, this._copyElements());
    }
}

class WT_FlightPlanProcedure extends WT_FlightPlanSequence {
    constructor(procedure, legs) {
        super(legs);
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

class WT_FlightPlanDepartureArrival extends WT_FlightPlanProcedure {
    constructor(procedure, runwayTransitionIndex, enrouteTransitionIndex, legs) {
        super(procedure, legs);

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
    copy() {
        return new WT_FlightPlanDeparture(this.procedure, this.runwayTransitionIndex, this.enrouteTransitionIndex, this._copyElements());
    }
}

class WT_FlightPlanArrival extends WT_FlightPlanDepartureArrival {
    copy() {
        return new WT_FlightPlanArrival(this.procedure, this.runwayTransitionIndex, this.enrouteTransitionIndex, this._copyElements());
    }
}

class WT_FlightPlanApproach extends WT_FlightPlanProcedure {
    constructor(approach, transitionIndex, legs) {
        super(approach, legs);

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
}