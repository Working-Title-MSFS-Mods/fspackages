/**
 * A procedure.
 */
class WT_Procedure {
    /**
     * @param {WT_Airport} airport - the airport to which the new procedure belongs.
     * @param {String} name - the name of the new procedure.
     * @param {Number} index - the index of the new procedure within its parent airport's procedure list.
     */
    constructor(airport, name, index) {
        this._airport = airport;
        this._name = name;
        this._index = index;
    }

    /**
     * @readonly
     * @property {WT_Airport} airport - the airport to which this procedure belongs.
     * @type {WT_Airport}
     */
    get airport() {
        return this._airport;
    }

    /**
     * @readonly
     * @property {String} name - the name of this procedure.
     * @type {String}
     */
    get name() {
        return this._name;
    }

    /**
     * @readonly
     * @property {Number} index - the index of this procedure in its parent airport's procedure list.
     * @type {Number}
     */
    get index() {
        return this._index;
    }

    _legMap(data) {
        return ProcedureLegFactory.createFromData(this, data);
    }

    _runwayTransitionMap(data) {
        return new WT_ProcedureRunwayTransition(this, data);
    }

    _enrouteTransitionMap(data) {
        return new WT_ProcedureTransition(this, data);
    }
}

/**
 * A SID/STAR-type procedure.
 */
class WT_DepartureArrival extends WT_Procedure {
    /**
     * @param {WT_Airport} airport - the airport to which the new procedure belongs.
     * @param {String} name - the name of the new procedure.
     * @param {Number} index - the index of the new procedure within its parent airport's procedure list.
     * @param {Object} data - a data object describing the new procedure.
     */
    constructor(airport, name, index, data) {
        super(airport, name, index);

        this._initFromData(data);
    }

    _initFromData(data) {
        if (data.commonLegs) {
            this._commonLegs = new WT_ProcedureLegList(data.commonLegs.map(this._legMap.bind(this)));
        }
        if (data.runwayTransitions) {
            this._runwayTransitions = new WT_TransitionList(data.runwayTransitions.map(this._runwayTransitionMap.bind(this)));
        }
        if (data.enRouteTransitions) {
            this._enrouteTransitions = new WT_TransitionList(data.enRouteTransitions.map(this._enrouteTransitionMap.bind(this)));
        }
    }

    /**
     * @readonly
     * @property {WT_ProcedureLegList} commonLegs - the common legs for this procedure.
     * @type {WT_ProcedureLegList}
     */
    get commonLegs() {
        return this._commonLegs;
    }

    /**
     * @readonly
     * @property {WT_TransitionList<WT_ProcedureRunwayTransition>} runwayTransitions - the runway transitions for this procedure.
     * @type {WT_TransitionList<WT_ProcedureRunwayTransition>}
     */
    get runwayTransitions() {
        return this._runwayTransitions;
    }

    /**
     * @readonly
     * @property {WT_TransitionList<WT_ProcedureTransition>} enrouteTransitions - the enroute transitions for this procedure.
     * @type {WT_TransitionList<WT_ProcedureTransition>}
     */
    get enrouteTransitions() {
        return this._enrouteTransitions;
    }
}

/**
 * A standard instrument departure (SID) procedure.
 */
class WT_Departure extends WT_DepartureArrival {
}

/**
 * A standard terminal arrival (STAR) procedure.
 */
class WT_Arrival extends WT_DepartureArrival {
}

/**
 * An approach procedure.
 */
class WT_Approach extends WT_Procedure {
    /**
     * @param {WT_Airport} airport - the airport to which the new procedure belongs.
     * @param {String} name - the name of the new procedure.
     * @param {Number} index - the index of the new procedure within its parent airport's procedure list.
     * @param {Object} data - a data object describing the new procedure.
     */
    constructor(airport, name, index, data) {
        super(airport, name, index);

        this._initFromData(data);
    }

    _initFromData(data) {
        let runwayDesignation = data.runway.trim();
        this._runway = this.airport.runways.getByDesignation(runwayDesignation);
        if (!this._runway) {
            this._runway = this.airport.runways.getByDesignation(runwayDesignation + "C"); // data from the game leaves out the C for center runways
        }
        if (data.finalLegs) {
            this._finalLegs = new WT_ProcedureLegList(data.finalLegs.map(this._legMap.bind(this)));
        }
        if (data.transitions) {
            this._transitions = new WT_TransitionList(data.transitions.map(this._enrouteTransitionMap.bind(this)));
        }
    }

    /**
     * @readonly
     * @property {WT_Runway} runway - the runway for this approach.
     * @type {WT_Runway}
     */
    get runway() {
        return this._runway;
    }

    /**
     * @readonly
     * @property {WT_ProcedureLegList} finalLegs - the final approach legs for this approach.
     * @type {WT_ProcedureLegList}
     */
    get finalLegs() {
        return this._finalLegs;
    }

    /**
     * @readonly
     * @property {WT_TransitionList<WT_ProcedureTransition>} transitions - the transitions for this approach.
     * @type {WT_TransitionList<WT_ProcedureTransition>}
     */
    get transitions() {
        return this._transitions;
    }
}

/**
 * A procedure transition.
 */
class WT_ProcedureTransition {
    /**
     * @param {WT_Procedure} procedure - the procedure to which the new transition belongs.
     * @param {Object} data - a data object describing the new transition.
     */
    constructor(procedure, data) {
        this._procedure = procedure;
        this._initFromData(data);
    }

    _initFromData(data) {
        this._legs = new WT_ProcedureLegList(data.legs.map(this.procedure._legMap.bind(this.procedure)));
    }

    /**
     * @readonly
     * @property {WT_Procedure} procedure - the procedure to which this transition belongs.
     * @type {WT_Procedure}
     */
    get procedure() {
        return this._procedure;
    }

    /**
     * @readonly
     * @property {WT_ProcedureLegList} legs - the legs for this transition.
     * @type {WT_ProcedureLegList}
     */
    get legs() {
        return this._legs;
    }
}

/**
 * A procedure runway transition.
 */
class WT_ProcedureRunwayTransition extends WT_ProcedureTransition {
    _initFromData(data) {
        super._initFromData(data);
        let runwayDesignation = data.runwayNumber + "";
        switch(data.runwayDesignation) {
            case 1: runwayDesignation += WT_Runway.Suffix.L; break;
            case 2: runwayDesignation += WT_Runway.Suffix.R; break;
            case 3: runwayDesignation += WT_Runway.Suffix.C; break;
        }
        this._runway = this.procedure.airport.runways.getByDesignation(runwayDesignation);
    }

    /**
     * @readonly
     * @property {WT_Runway} runway - the runway for this transition.
     * @type {WT_Runway}
     */
    get runway() {
        return this._runway;
    }
}

/**
 * A list of procedure transitions.
 * @template T
 */
class WT_TransitionList {
    /**
     * @param {Array<T>} transitions - an array of transitions with which to initialize the new list.
     */
    constructor(transitions) {
        this._transitions = transitions;
    }

    /**
     * Gets the number of transitions in this list.
     * @returns {Number} the number of transitions in this list.
     */
    count() {
        return this._transitions.length;
    }

    /**
     * Gets a transition from this list by its index.
     * @param {Number} index - the index of the transition to get.
     * @returns {T} a transition.
     */
    getByIndex(index) {
        return this._transitions[index];
    }

    /**
     * @returns {Iterator<T>}
     */
    [Symbol.iterator]() {
        return this._transitions.values();
    }
}

/**
 * A procedure leg.
 */
class WT_ProcedureLeg {
    /**
     * @param {WT_Procedure} procedure - the procedure to which the new leg belongs.
     * @param {Number} type - the type of the new procedure leg.
     * @param {Object} data - a data object describing the new leg.
     */
    constructor(procedure, type, data) {
        this._procedure = procedure;
        this._type = type;
        this._initFromData(data);
    }

    _initFromData(data) {
        this._altitudeDescription = data.altDesc;
        switch (data.altDesc) {
            case WT_ProcedureLeg.AltitudeDescription.NONE:
                this._altitudeConstraint = WT_AltitudeConstraint.NO_CONSTRAINT;
                break;
            case WT_ProcedureLeg.AltitudeDescription.AT:
                this._altitudeConstraint = new WT_AtAltitude(WT_ProcedureLeg._tempMeter1.set(data.altitude1));
                break;
            case WT_ProcedureLeg.AltitudeDescription.AT_OR_ABOVE:
                this._altitudeConstraint = new WT_AtOrAboveAltitude(WT_ProcedureLeg._tempMeter1.set(data.altitude1));
                break;
            case WT_ProcedureLeg.AltitudeDescription.AT_OR_BELOW:
                this._altitudeConstraint = new WT_AtOrBelowAltitude(WT_ProcedureLeg._tempMeter1.set(data.altitude1));
                break;
            case WT_ProcedureLeg.AltitudeDescription.BETWEEN:
                this._altitudeConstraint = new WT_AtAltitude(WT_ProcedureLeg._tempMeter1.set(data.altitude2), WT_ProcedureLeg._tempMeter2.set(data.altitude1));
                break;
        }
    }

    /**
     * @readonly
     * @property {WT_Procedure} procedure - the procedure to which this leg belongs.
     * @type {WT_Procedure}
     */
    get procedure() {
        return this._procedure;
    }

    /**
     * @readonly
     * @property {Number} type - the type of this leg.
     * @type {Number}
     */
    get type() {
        return this._type;
    }

    /**
     * @readonly
     * @property {Number} altitudeDescription - the altitude constraint type of this leg.
     * @type {Number}
     */
    get altitudeDescription() {
        return this._altitudeDescription;
    }

    /**
     * @readonly
     * @property {WT_AltitudeConstraint} altitudeConstraint - the altitude constraint of this leg.
     * @type {WT_AltitudeConstraint}
     */
    get altitudeConstraint() {
        return this._altitudeConstraint;
    }

    /**
     * @readonly
     * @property {Boolean} discontinuity - whether this leg ends in a discontinuity.
     * @type {Boolean}
     */
    get discontinuity() {
        return false;
    }
}
WT_ProcedureLeg._tempMeter1 = WT_Unit.METER.createNumber(0);
WT_ProcedureLeg._tempMeter2 = WT_Unit.METER.createNumber(0);
/**
 * @enum {Number}
 */
WT_ProcedureLeg.Type = {
    INITIAL_FIX: 1,
    FIX: 2,
    FLY_HEADING_UNTIL_DISTANCE_FROM_REFERENCE: 3,
    FLY_REFERENCE_RADIAL_FOR_DISTANCE: 4,
    FLY_HEADING_TO_INTERCEPT: 5,
    FLY_HEADING_UNTIL_REFERENCE_RADIAL_CROSSING: 6,
    FLY_TO_BEARING_DISTANCE_FROM_REFERENCE: 7,
    FLY_HEADING_TO_ALTITUDE: 8,
    FLY_VECTORS: 9
};
/**
 * @enum {Number}
 */
WT_ProcedureLeg.AltitudeDescription = {
    NONE: 0,
    AT: 1,
    AT_OR_ABOVE: 2,
    AT_OR_BELOW: 3,
    BETWEEN: 4
};

/**
 * A list of procedure legs.
 */
class WT_ProcedureLegList {
    /**
     * @param {WT_ProcedureLeg[]} legs - an array of procedure legs with which to initialize the new list.
     */
    constructor(legs) {
        this._legs = legs;
    }

    /**
     * Gets the number of legs in this list.
     * @returns {Number} the number of legs in this list.
     */
    count() {
        return this._legs.length;
    }

    /**
     * Gets a leg from this list by its index.
     * @param {Number} index - the index of the leg to get.
     * @returns {WT_ProcedureLeg} a procedure leg.
     */
    getByIndex(index) {
        return this._legs[index];
    }

    /**
     * @returns {IterableIterator<WT_ProcedureLeg>}
     */
    [Symbol.iterator]() {
        return this._legs.values();
    }
}

class WT_InitialFix extends WT_ProcedureLeg {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.INITIAL_FIX, data);
    }

    _initFromData(data) {
        super._initFromData(data);

        this._fixICAO = data.fixIcao;
    }

    /**
     * @readonly
     * @property {String} fixICAO - the ICAO string of the terminator waypoint fix for this leg.
     * @type {String}
     */
    get fixICAO() {
        return this._fixICAO;
    }

    /**
     * Generates a terminator waypoint fix for this leg.
     * @returns {Promise<WT_Waypoint>} a Promise to return a waypoint.
     */
    async waypointFix(icaoWaypointFactory) {
        return icaoWaypointFactory.getWaypoint(this.fixICAO);
    }
}

class WT_ProcedureLegCourse extends WT_ProcedureLeg {
    _initFromData(data) {
        super._initFromData(data);

        this._course = data.course;
    }

    /**
     * @readonly
     * @property {Number} course - the course heading of this leg.
     * @type {Number}
     */
    get course() {
        return this._course;
    }
}

/**
 * A procedure leg consisting of flying a direct course to a pre-defined terminator waypoint fix.
 */
class WT_FlyToFix extends WT_ProcedureLegCourse {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FIX, data);
    }

    _initFromData(data) {
        super._initFromData(data);

        this._fixICAO = data.fixIcao;
    }

    /**
     * @readonly
     * @property {String} fixICAO - the ICAO string of the terminator waypoint fix for this leg.
     * @type {String}
     */
    get fixICAO() {
        return this._fixICAO;
    }
}

class WT_ProcedureLegCourseReference extends WT_ProcedureLegCourse {
    _initFromData(data) {
        super._initFromData(data);

        this._referenceICAO = data.originIcao;
    }

    /**
     * @readonly
     * @property {String} referenceICAO - the ICAO string of the reference fix for this leg.
     * @type {String}
     */
    get referenceICAO() {
        return this._referenceICAO;
    }
}

class WT_ProcedureLegCourseReferenceDistance extends WT_ProcedureLegCourseReference {
    _initFromData(data) {
        super._initFromData(data);

        this._distance = new WT_NumberUnit(WT_Unit.METER.convert(data.distance, WT_Unit.NMILE), WT_Unit.NMILE);
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} distance - the distance to fly for this leg.
     * @type {WT_NumberUnitReadOnly}
     */
    get distance() {
        return this._distance.readonly();
    }
}

/**
 * A procedure leg consisting of flying a constant heading from the previous fix until reaching a specified distance from a reference fix.
 */
class WT_FlyHeadingUntilDistanceFromReference extends WT_ProcedureLegCourseReferenceDistance {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_HEADING_UNTIL_DISTANCE_FROM_REFERENCE, data);
    }
}

/**
 * A procedure leg consisting of flying a constant heading from the previous fix for a specified distance.
 */
class WT_FlyReferenceRadialForDistance extends WT_ProcedureLegCourseReferenceDistance {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_REFERENCE_RADIAL_FOR_DISTANCE, data);
    }

    _initFromData(data) {
        super._initFromData(data);

        if (data.fixIcao.trim()) {
            this._fixICAO = data.fixIcao;
        }
    }

    /**
     * @readonly
     * @property {String} fixICAO - the ICAO string of the terminator waypoint fix for this leg, if one exists.
     * @type {String}
     */
    get fixICAO() {
        return this._fixICAO;
    }
}


/**
 * A procedure leg consisting of flying a constant heading from the previous fix until intercepting the next leg's course.
 */
class WT_FlyHeadingToIntercept extends WT_ProcedureLegCourse {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_HEADING_TO_INTERCEPT, data);
    }
}

/**
 * A procedure leg consisting of flying a constant heading from the previous fix until crossing a specified radial line
 * of a reference fix.
 */
class WT_FlyHeadingUntilReferenceRadialCrossing extends WT_ProcedureLegCourseReference {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_HEADING_UNTIL_REFERENCE_RADIAL_CROSSING, data);
    }

    _initFromData(data) {
        super._initFromData(data);

        this._radial = data.theta;
    }

    /**
     * @readonly
     * @property {Number} radial - the radial of the reference fix to cross.
     * @type {Number}
     */
    get radial() {
        return this._radial;
    }
}

/**
 * A procedure leg consisting of flying direct to a point at a specified bearing and distance from a reference fix.
 */
class WT_FlyToBearingDistanceFromReference extends WT_ProcedureLegCourseReferenceDistance {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_TO_BEARING_DISTANCE_FROM_REFERENCE, data);
    }
}

/**
 * A procedure leg consisting of flying a constant heading from the previous fix until reaching a specified altitude.
 */
class WT_FlyHeadingToAltitude extends WT_ProcedureLegCourse {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_HEADING_TO_ALTITUDE, data);
    }
}

/**
 * A procedure leg consisting of flying a VECTORS instruction. Ends in a discontinuity.
 */
class WT_FlyVectors extends WT_ProcedureLeg {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_VECTORS, data);
    }

    /**
     * @readonly
     * @property {Boolean} discontinuity - whether this leg ends in a discontinuity.
     * @type {Boolean}
     */
    get discontinuity() {
        return true;
    }

    /**
     * Generates a (terminal) waypoint fix for this leg.
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory - the factory to use to create a new WT_ICAOWaypoint object, if necessary.
     * @param {WT_Waypoint} previousFix - the waypoint fix of the previous leg in the sequence to which this leg belongs.
     * @returns {Promise<WT_Waypoint>} a Promise to return a waypoint fix.
     */
    async waypointFix(icaoWaypointFactory, previousFix) {
        return new WT_CustomWaypoint("VECTORS", previousFix.location);
    }
}

class ProcedureLegFactory {
    /**
     * Creates a WT_ProcedureLeg object from a procedure data object.
     * @param {WT_Procedure} procedure - the parent procedure of the new leg.
     * @param {Object} data - a data object describing the new leg.
     * @returns {WT_ProcedureLeg}
     */
    static createFromData(procedure, data) {
        switch (data.type) {
            case 15:
                return new WT_InitialFix(procedure, data);
            case 7:
            case 17:
            case 18:
                return new WT_FlyToFix(procedure, data);
            case 3:
                return new WT_FlyHeadingUntilDistanceFromReference(procedure, data);
            case 4:
                if (data.fixIcao && data.fixIcao[0] === "R") { // ignore runway fixes
                    break;
                }
                return new WT_FlyReferenceRadialForDistance(procedure, data);
            case 5:
            case 21:
                return new WT_FlyHeadingToIntercept(procedure, data);
            case 6:
            case 23:
                return new WT_FlyHeadingUntilReferenceRadialCrossing(procedure, data);
            case 9:
            case 10:
                return new WT_FlyToBearingDistanceFromReference(procedure, data);
            case 2:
            case 19:
                return new WT_FlyHeadingToAltitude(procedure, data);
            case 11:
            case 22:
                return new WT_FlyVectors(procedure, data);
        }
    }
}