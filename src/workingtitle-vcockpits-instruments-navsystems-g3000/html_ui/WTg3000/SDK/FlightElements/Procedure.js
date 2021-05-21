/**
 * A procedure.
 * @abstract
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
     * The airport to which this procedure belongs.
     * @readonly
     * @type {WT_Airport}
     */
    get airport() {
        return this._airport;
    }

    /**
     * The name of this procedure.
     * @readonly
     * @type {String}
     */
    get name() {
        return this._name;
    }

    /**
     * The index of this procedure in its parent airport's procedure list.
     * @readonly
     * @type {Number}
     */
    get index() {
        return this._index;
    }

    _legMap(data) {
        return ProcedureLegFactory.createFromData(this, data);
    }

    _enrouteTransitionMap(data) {
    }

    _runwayTransitionMap(data) {
    }

    /**
     * Checks whether this procedure is equal to another value. Returns true if and only if the other value is an
     * WT_Procedure object of the same type as this procedure and has the same owning airport and name.
     * @param {*} other - the value to check for equality against this procedure.
     * @returns {Boolean} whether this procedure is equal to the specified value.
     */
    equals(other) {
    }
}

/**
 * A SID/STAR-type procedure.
 * @abstract
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
            this._commonLegs = new WT_ReadOnlyArray(data.commonLegs.map(this._legMap.bind(this)));
        }
        if (data.runwayTransitions) {
            this._runwayTransitions = new WT_TransitionList(data.runwayTransitions.map(data => this._runwayTransitionMap(data), this));
        }
        if (data.enRouteTransitions) {
            this._enrouteTransitions = new WT_TransitionList(data.enRouteTransitions.map(data => this._enrouteTransitionMap(data), this));
        }
    }

    /**
     * The common legs for this procedure.
     * @readonly
     * @type {WT_ReadOnlyArray<WT_ProcedureLeg>}
     */
    get commonLegs() {
        return this._commonLegs;
    }

    /**
     * The runway transitions for this procedure.
     * @readonly
     * @type {WT_TransitionList<WT_ProcedureRunwayTransition>}
     */
    get runwayTransitions() {
        return this._runwayTransitions;
    }

    /**
     * The enroute transitions for this procedure.
     * @readonly
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
    _enrouteTransitionMap(data) {
        return new WT_DepartureEnrouteTransition(this, data);
    }

    _runwayTransitionMap(data) {
        return new WT_DepartureRunwayTransition(this, data);
    }

    /**
     * Checks whether this procedure is equal to another value. Returns true if and only if the other value is an
     * WT_Procedure object of the same type as this procedure and has the same owning airport and name.
     * @param {*} other - the value to check for equality against this procedure.
     * @returns {Boolean} whether this procedure is equal to the specified value.
     */
    equals(other) {
        return other instanceof WT_Departure && this.airport.equals(other.airport) && this.name === other.name;
    }
}

/**
 * A standard terminal arrival (STAR) procedure.
 */
class WT_Arrival extends WT_DepartureArrival {
    _enrouteTransitionMap(data) {
        return new WT_ArrivalEnrouteTransition(this, data);
    }

    _runwayTransitionMap(data) {
        return new WT_ArrivalRunwayTransition(this, data);
    }

    /**
     * Checks whether this procedure is equal to another value. Returns true if and only if the other value is an
     * WT_Procedure object of the same type as this procedure and has the same owning airport and name.
     * @param {*} other - the value to check for equality against this procedure.
     * @returns {Boolean} whether this procedure is equal to the specified value.
     */
    equals(other) {
        return other instanceof WT_Arrival && this.airport.equals(other.airport) && this.name === other.name;
    }
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

    _enrouteTransitionMap(data) {
        return new WT_ApproachTransition(this, data);
    }

    _initType(data) {
        if (this.name.indexOf("ILS") >= 0) {
            this._type = WT_Approach.Type.ILS;
        } else if (this.name.indexOf("RNAV") >= 0) {
            this._type = WT_Approach.Type.RNAV;
        } else if (this.name.indexOf("LOC") >= 0) {
            this._type = WT_Approach.Type.LOC;
        } else if (this.name.indexOf("VOR") >= 0) {
            this._type = WT_Approach.Type.VOR;
        } else if (this.name.indexOf("NDB") >= 0) {
            this._type = WT_Approach.Type.NDB;
        } else if (this.name.indexOf("LDA") >= 0) {
            this._type = WT_Approach.Type.LDA;
        } else {
            this._type = WT_Approach.Type.UNKNOWN;
        }
    }

    _initRunway(data) {
        let runwayDesignation = data.runway.trim();
        this._runway = this.airport.runways.getByDesignation(runwayDesignation);
        if (!this._runway) {
            this._runway = this.airport.runways.getByDesignation(runwayDesignation + "C"); // data from the game leaves out the C for center runways
        }
    }

    _initLegs(data) {
        if (data.finalLegs) {
            this._finalLegs = data.finalLegs.map(this._legMap.bind(this));
            if (this.runway) {
                // nav data from the sim doesn't include runway fix, so we have to add it ourselves
                this._finalLegs.push(new WT_ProcedureRunwayFix(this, false, new WT_RunwayWaypoint(this.runway, WT_RunwayWaypoint.Reference.START)));
            }
            this._finalLegsReadOnly = new WT_ReadOnlyArray(this._finalLegs);
        }
        if (data.transitions) {
            this._transitions = new WT_TransitionList(data.transitions.map(data => this._enrouteTransitionMap(data), this));
        }
    }

    _initFrequency() {
        if (!(this.type === WT_Approach.Type.ILS || this.type === WT_Approach.Type.LOC) || !this.runway) {
            return;
        }

        let name = `RW${this.runway.number.toFixed(0).padStart(2, "0")}${this.runway.suffix}`;
        let airportFreq = this.airport.frequencies.array.find(airportFreq => airportFreq.name.search(name) >= 0);
        if (airportFreq) {
            this._frequency = airportFreq.frequency;
        }
    }

    _initFromData(data) {
        this._initType(data);
        this._initRunway(data);
        this._initLegs(data);
        this._initFrequency();
    }

    /**
     * The type of this approach.
     * @readonly
     * @type {WT_Approach.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * The runway for this approach. If this approach has no assigned runway, this property is undefined.
     * @readonly
     * @type {WT_Runway}
     */
    get runway() {
        return this._runway;
    }

    /**
     * The final approach legs for this approach.
     * @readonly
     * @type {WT_ReadOnlyArray<WT_ProcedureLeg>}
     */
    get finalLegs() {
        return this._finalLegsReadOnly;
    }

    /**
     * The transitions for this approach.
     * @readonly
     * @type {WT_TransitionList<WT_ApproachTransition>}
     */
    get transitions() {
        return this._transitions;
    }

    /**
     * The ILS/LOC frequency of this approach. If this approach is not an ILS/LOC approach, this property is undefined.
     * @readonly
     * @type {WT_Frequency}
     */
    get frequency() {
        return this._frequency;
    }

    /**
     * Checks whether this procedure is equal to another value. Returns true if and only if the other value is an
     * WT_Procedure object of the same type as this procedure and has the same owning airport and name.
     * @param {*} other - the value to check for equality against this procedure.
     * @returns {Boolean} whether this procedure is equal to the specified value.
     */
    equals(other) {
        return other instanceof WT_Approach && this.airport.equals(other.airport) && this.name === other.name;
    }
}
/**
 * @enum {Number}
 */
WT_Approach.Type = {
    UNKNOWN: 0,
    ILS: 1,
    LOC: 2,
    RNAV: 3,
    VOR: 4,
    NDB: 5,
    LDA: 6
}

/**
 * A procedure transition.
 * @abstract
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
        this._name = data.name; // provided only with Navigraph data
        this._legs = data.legs.map(this.procedure._legMap.bind(this.procedure));
        this._legsReadOnly = new WT_ReadOnlyArray(this._legs);
    }

    /**
     * The procedure to which this transition belongs.
     * @readonly
     * @type {WT_Procedure}
     */
    get procedure() {
        return this._procedure;
    }

    /**
     * The name of this transition.
     * @readonly
     * @type {String}
     */
    get name() {
        return this._name;
    }

    /**
     * The procedure legs for this transition.
     * @readonly
     * @type {WT_ReadOnlyArray<WT_ProcedureLeg>}
     */
    get legs() {
        return this._legsReadOnly;
    }
}

/**
 * A departure enroute transition.
 */
class WT_DepartureEnrouteTransition extends WT_ProcedureTransition {
    _initFromData(data) {
        super._initFromData(data);

        if (!this._name) {
            let lastLeg = this.legs.last();
            this._name = (lastLeg && lastLeg.fixICAO) ? lastLeg.fixICAO.substr(7, 5).trim() : "";
        }
    }
}

/**
 * An arrival enroute transition.
 */
class WT_ArrivalEnrouteTransition extends WT_ProcedureTransition {
    _initFromData(data) {
        super._initFromData(data);

        if (!this._name) {
            let firstLeg = this.legs.first();
            this._name = (firstLeg && firstLeg.fixICAO) ? firstLeg.fixICAO.substr(7, 5).trim() : "";
        }
    }
}

/**
 * An approach transition.
 */
class WT_ApproachTransition extends WT_ProcedureTransition {
    _initFromData(data) {
        super._initFromData(data);

        if (!this._name) {
            let firstLeg = this.legs.first();
            this._name = (firstLeg && firstLeg.fixICAO) ? firstLeg.fixICAO.substr(7, 5).trim() : "";
        }
    }
}

/**
 * A procedure runway transition.
 * @abstract
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
        this._name = this._runway ? `RW${this._runway.designationFull}` : "";
    }

    /**
     * The runway for this transition.
     * @readonly
     * @type {WT_Runway}
     */
    get runway() {
        return this._runway;
    }
}

class WT_DepartureRunwayTransition extends WT_ProcedureRunwayTransition {
    _initFromData(data) {
        super._initFromData(data);

        // nav data from the sim doesn't include runway fix, so we have to add it ourselves
        this._legs.unshift(new WT_ProcedureRunwayFix(this.procedure, true, new WT_RunwayWaypoint(this.runway, WT_RunwayWaypoint.Reference.END)));
    }
}

class WT_ArrivalRunwayTransition extends WT_ProcedureRunwayTransition {
    _initFromData(data) {
        super._initFromData(data);

        // nav data from the sim doesn't include runway fix, so we have to add it ourselves
        this._legs.push(new WT_ProcedureRunwayFix(this.procedure, false, new WT_RunwayWaypoint(this.runway, WT_RunwayWaypoint.Reference.START)));
    }
}

/**
 * A list of procedure transitions.
 * @template {WT_ProcedureTransition} T
 */
class WT_TransitionList {
    /**
     * @param {Array<T>} transitions - an array of transitions with which to initialize the new list.
     */
    constructor(transitions) {
        this._array = new WT_ReadOnlyArray(transitions);
    }

    /**
     * A read-only array of the transitions in this list.
     * @readonly
     * @type {WT_ReadOnlyArray<T>}
     */
    get array() {
        return this._array;
    }

    /**
     * Gets a transition from this list by its index.
     * @param {Number} index - the index of the transition to get.
     * @returns {T} a transition.
     */
    getByIndex(index) {
        return this._array.get(index);
    }

    /**
     * Gets a transition from this list by its name.
     * @param {String} name - the name of the transition to get.
     * @returns {T} a transition.
     */
    getByName(name) {
        return this._array.find(transition => transition.name === name);
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
                this._altitudeConstraint = new WT_BetweenAltitude(WT_ProcedureLeg._tempMeter1.set(data.altitude2), WT_ProcedureLeg._tempMeter2.set(data.altitude1));
                break;
            default:
                this._altitudeConstraint = WT_AltitudeConstraint.NO_CONSTRAINT;
        }
    }

    /**
     * The procedure to which this leg belongs.
     * @readonly
     * @type {WT_Procedure}
     */
    get procedure() {
        return this._procedure;
    }

    /**
     * The type of this leg.
     * @readonly
     * @type {Number}
     */
    get type() {
        return this._type;
    }

    /**
     * The altitude constraint type of this leg.
     * @readonly
     * @type {Number}
     */
    get altitudeDescription() {
        return this._altitudeDescription;
    }

    /**
     * The altitude constraint of this leg.
     * @readonly
     * @type {WT_AltitudeConstraint}
     */
    get altitudeConstraint() {
        return this._altitudeConstraint;
    }

    /**
     * Whether this leg ends in a discontinuity.
     * @readonly
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
    INITIAL_FIX: 0,
    FIX: 1,
    FLY_HEADING_UNTIL_DISTANCE_FROM_REFERENCE:2,
    FLY_REFERENCE_RADIAL_FOR_DISTANCE: 3,
    FLY_HEADING_TO_INTERCEPT: 4,
    FLY_HEADING_UNTIL_REFERENCE_RADIAL_CROSSING: 5,
    FLY_TO_BEARING_DISTANCE_FROM_REFERENCE: 6,
    FLY_HEADING_TO_ALTITUDE: 7,
    FLY_VECTORS: 8,
    INITIAL_RUNWAY_FIX: 9,
    RUNWAY_FIX: 10,
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
 * A procedure leg representing an initial waypoint fix.
 */
class WT_ProcedureInitialFix extends WT_ProcedureLeg {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.INITIAL_FIX, data);
    }

    _initFromData(data) {
        super._initFromData(data);

        this._fixICAO = data.fixIcao;
    }

    /**
     * The ICAO string of the waypoint fix for this leg.
     * @readonly
     * @type {String}
     */
    get fixICAO() {
        return this._fixICAO;
    }
}

/**
 * A procedure leg which involves flying a constant heading.
 * @abstract
 */
class WT_ProcedureLegCourse extends WT_ProcedureLeg {
    _initFromData(data) {
        super._initFromData(data);

        this._course = data.course;
    }

    /**
     * The course heading of this leg.
     * @readonly
     * @type {Number}
     */
    get course() {
        return this._course;
    }
}

/**
 * A procedure leg consisting of flying a direct course to a pre-defined terminator waypoint fix.
 */
class WT_ProcedureFlyToFix extends WT_ProcedureLegCourse {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FIX, data);
    }

    _initFromData(data) {
        super._initFromData(data);

        this._fixICAO = data.fixIcao;
    }

    /**
     * The ICAO string of the terminator waypoint fix for this leg.
     * @readonly
     * @type {String}
     */
    get fixICAO() {
        return this._fixICAO;
    }
}

/**
 * A procedure leg which involves flying a constant heading and which ends at a position derived from a reference ICAO
 * waypoint fix.
 * @abstract
 */
class WT_ProcedureLegCourseReference extends WT_ProcedureLegCourse {
    _initFromData(data) {
        super._initFromData(data);

        this._referenceICAO = data.originIcao;
    }

    /**
     * The ICAO string of the reference fix for this leg.
     * @readonly
     * @type {String}
     */
    get referenceICAO() {
        return this._referenceICAO;
    }
}

/**
 * A procedure leg which involves flying a constant heading, ends at a position derived from a reference ICAO waypoint
 * fix, and whose end .
 * @abstract
 */
class WT_ProcedureLegCourseReferenceDistance extends WT_ProcedureLegCourseReference {
    _initFromData(data) {
        super._initFromData(data);

        this._distance = new WT_NumberUnit(WT_Unit.METER.convert(data.distance, WT_Unit.NMILE), WT_Unit.NMILE);
    }

    /**
     * The distance to fly for this leg.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get distance() {
        return this._distance.readonly();
    }
}

/**
 * A procedure leg consisting of flying a constant heading from the previous fix until reaching a specified distance from a reference fix.
 */
class WT_ProcedureFlyHeadingUntilDistanceFromReference extends WT_ProcedureLegCourseReferenceDistance {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_HEADING_UNTIL_DISTANCE_FROM_REFERENCE, data);
    }
}

/**
 * A procedure leg consisting of flying a constant heading from the previous fix for a specified distance.
 */
class WT_ProcedureFlyReferenceRadialForDistance extends WT_ProcedureLegCourseReferenceDistance {
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
class WT_ProcedureFlyHeadingToIntercept extends WT_ProcedureLegCourse {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_HEADING_TO_INTERCEPT, data);
    }
}

/**
 * A procedure leg consisting of flying a constant heading from the previous fix until crossing a specified radial line
 * of a reference fix.
 */
class WT_ProcedureFlyHeadingUntilReferenceRadialCrossing extends WT_ProcedureLegCourseReference {
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
class WT_ProcedureFlyToBearingDistanceFromReference extends WT_ProcedureLegCourseReferenceDistance {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_TO_BEARING_DISTANCE_FROM_REFERENCE, data);
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
 * A procedure leg consisting of flying a constant heading from the previous fix until reaching a specified altitude.
 */
class WT_ProcedureFlyHeadingToAltitude extends WT_ProcedureLegCourse {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_HEADING_TO_ALTITUDE, data);
    }

    /**
     * @readonly
     * @property {Boolean} discontinuity - whether this leg ends in a discontinuity.
     * @type {Boolean}
     */
    get discontinuity() {
        return true;
    }
}

/**
 * A procedure leg consisting of flying a VECTORS instruction. Ends in a discontinuity.
 */
class WT_ProcedureFlyVectors extends WT_ProcedureLeg {
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
}

/**
 * A procedure leg representing either an initial runway fix or flying a direct course to a runway fix.
 */
class WT_ProcedureRunwayFix extends WT_ProcedureLeg {
    /**
     * @param {WT_Procedure} procedure - the procedure to which the new leg belongs.
     * @param {Boolean} isInitial - whether the new leg is an initial runway fix.
     * @param {WT_RunwayWaypoint} fix - the new leg's runway waypoint fix.
     */
    constructor(procedure, isInitial, fix) {
        super(procedure, isInitial ? WT_ProcedureLeg.Type.INITIAL_RUNWAY_FIX : WT_ProcedureLeg.Type.RUNWAY_FIX, null);

        this._fix = fix;
    }

    _initFromData(data) {
        this._altitudeDescription = WT_ProcedureLeg.AltitudeDescription.NONE;
        this._altitudeConstraint = WT_AltitudeConstraint.NO_CONSTRAINT;
    }

    /**
     * This leg's runway fix.
     * @readonly
     * @type {WT_RunwayWaypoint}
     */
    get fix() {
        return this._fix;
    }

    /**
     * The runway associated with this leg.
     * @readonly
     * @type {WT_Runway}
     */
    get runway() {
        return this.fix.runway;
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
                return new WT_ProcedureInitialFix(procedure, data);
            case 7:
            case 17:
            case 18:
                if (data.fixIcao && data.fixIcao[0] === "R") { // ignore runway fixes
                    return;
                }
                return new WT_ProcedureFlyToFix(procedure, data);
            case 3:
                return new WT_ProcedureFlyHeadingUntilDistanceFromReference(procedure, data);
            case 4:
                if (data.fixIcao && data.fixIcao[0] === "R") { // ignore runway fixes
                    return;
                }
                return new WT_ProcedureFlyReferenceRadialForDistance(procedure, data);
            case 5:
            case 21:
                return new WT_ProcedureFlyHeadingToIntercept(procedure, data);
            case 6:
            case 23:
                return new WT_ProcedureFlyHeadingUntilReferenceRadialCrossing(procedure, data);
            case 9:
            case 10:
                return new WT_ProcedureFlyToBearingDistanceFromReference(procedure, data);
            case 2:
            case 19:
                return new WT_ProcedureFlyHeadingToAltitude(procedure, data);
            case 11:
            case 22:
                return new WT_ProcedureFlyVectors(procedure, data);
            default:
                if (data.fixIcao) {
                    // for now we will treat all unknown leg types with a defined fix as a direct leg
                    return new WT_ProcedureFlyToFix(procedure, data);
                }
        }
    }
}