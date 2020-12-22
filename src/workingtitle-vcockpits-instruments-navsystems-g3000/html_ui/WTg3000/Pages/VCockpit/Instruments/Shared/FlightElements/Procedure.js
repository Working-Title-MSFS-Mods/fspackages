class WT_Procedure {
    constructor(airport, name, index) {
        this._airport = airport;
        this._name = name;
        this._index = index;
    }

    /**
     * @readonly
     * @property {WT_Airport} airport
     * @type {WT_Airport}
     */
    get airport() {
        return this._airport;
    }

    /**
     * @readonly
     * @property {String} name
     * @type {String}
     */
    get name() {
        return this._name;
    }

    /**
     * @readonly
     * @property {Number} index
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

class WT_DepartureArrival extends WT_Procedure {
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
     * @property {WT_ProcedureLegList} commonLegs
     * @type {WT_ProcedureLegList}
     */
    get commonLegs() {
        return this._commonLegs;
    }

    /**
     * @readonly
     * @property {WT_TransitionList<WT_ProcedureRunwayTransition>} runwayTransitions
     * @type {WT_TransitionList<WT_ProcedureRunwayTransition>}
     */
    get runwayTransitions() {
        return this._runwayTransitions;
    }

    /**
     * @readonly
     * @property {WT_TransitionList<WT_ProcedureTransition>} enrouteTransitions
     * @type {WT_TransitionList<WT_ProcedureTransition>}
     */
    get enrouteTransitions() {
        return this._enrouteTransitions;
    }
}

class WT_Departure extends WT_DepartureArrival {
}

class WT_Arrival extends WT_DepartureArrival {
}

class WT_Approach extends WT_Procedure {
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
     * @property {WT_Runway} runway
     * @type {WT_Runway}
     */
    get runway() {
        return this._runway;
    }

    /**
     * @readonly
     * @property {WT_ProcedureLegList} finalLegs
     * @type {WT_ProcedureLegList}
     */
    get finalLegs() {
        return this._finalLegs;
    }

    /**
     * @readonly
     * @property {WT_TransitionList<WT_ProcedureTransition>} transitions
     * @type {WT_TransitionList<WT_ProcedureTransition>}
     */
    get transitions() {
        return this._transitions;
    }
}

class WT_ProcedureTransition {
    constructor(procedure, data) {
        this._procedure = procedure;
        this._initFromData(data);
    }

    _initFromData(data) {
        this._legs = new WT_ProcedureLegList(data.legs.map(this.procedure._legMap.bind(this.procedure)));
    }

    /**
     * @readonly
     * @property {WT_Procedure} procedure
     * @type {WT_Procedure}
     */
    get procedure() {
        return this._procedure;
    }

    /**
     * @readonly
     * @property {WT_ProcedureLegList} runwayTransitions
     * @type {WT_ProcedureLegList}
     */
    get legs() {
        return this._legs;
    }
}

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
     * @property {WT_Runway} runway
     * @type {WT_Runway}
     */
    get runway() {
        return this._runway;
    }
}

/**
 * @template T
 */
class WT_TransitionList {
    /**
     * @param {Array<T>} transitions
     */
    constructor(transitions) {
        this._transitions = transitions;
    }

    /**
     * @returns {Number}
     */
    count() {
        return this._transitions.length;
    }

    /**
     *
     * @param {Number} index
     * @returns {T}
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

class WT_ProcedureLeg {
    constructor(procedure, type, data) {
        this._procedure = procedure;
        this._type = type;
        this._initFromData(data);
    }

    _initFromData(data) {
        this._altitudeDescription = data.altDesc;
        switch (data.altDesc) {
            case WT_ProcedureLeg.AltitudeDescription.AT:
                this._altitudeCeiling = new WT_NumberUnit(data.altitude1, WT_Unit.METER);
                this._altitudeFloor = this._altitudeCeiling;
                break;
            case WT_ProcedureLeg.AltitudeDescription.ABOVE:
                this._altitudeFloor = new WT_NumberUnit(data.altitude1, WT_Unit.METER);
                break;
            case WT_ProcedureLeg.AltitudeDescription.BELOW:
                this._altitudeCeiling = new WT_NumberUnit(data.altitude1, WT_Unit.METER);
                break;
            case WT_ProcedureLeg.AltitudeDescription.ABOVE_BELOW:
                this._altitudeCeiling = new WT_NumberUnit(data.altitude1, WT_Unit.METER);
                this._altitudeFloor = new WT_NumberUnit(data.altitude2, WT_Unit.METER);
        }
    }

    /**
     * @readonly
     * @property {WT_Procedure} procedure
     * @type {WT_Procedure}
     */
    get procedure() {
        return this._procedure;
    }

    /**
     * @readonly
     * @property {Number} type
     * @type {Number}
     */
    get type() {
        return this._type;
    }

    /**
     * @readonly
     * @property {Number} altitudeDescription
     * @type {Number}
     */
    get altitudeDescription() {
        return this._altitudeDescription;
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} altitudeCeiling
     * @type {WT_NumberUnitReadOnly}
     */
    get altitudeCeiling() {
        return this._altitudeCeiling.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} altitudeFloor
     * @type {WT_NumberUnitReadOnly}
     */
    get altitudeFloor() {
        return this._altitudeFloor.readonly();
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
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @param {WT_Waypoint} [previousFix]
     * @param {WT_ProcedureLeg} [nextLeg]
     * @returns {Promise<WT_Waypoint>}
     */
    async waypointFix(icaoWaypointFactory, previousFix, nextLeg) {
        return null;
    }
}
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
    ABOVE: 2,
    BELOW: 3,
    ABOVE_BELOW: 4
};

class WT_ProcedureLegList {
    constructor(legs) {
        this._legs = legs;
    }

    count() {
        return this._legs.length;
    }

    getByIndex(index) {
        return this._legs[index];
    }

    [Symbol.iterator]() {
        return this._legs.values();
    }
}

class WT_ProcedureLegCourse extends WT_ProcedureLeg {
    _initFromData(data) {
        super._initFromData(data);

        this._course = data.course;
    }

    /**
     * @readonly
     * @property {Number} course
     * @type {Number}
     */
    get course() {
        return this._course;
    }
}

class WT_FlyToFix extends WT_ProcedureLegCourse {
    _initFromData(data) {
        super._initFromData(data);

        this._fixICAO = data.fixIcao;
    }

    /**
     * @readonly
     * @property {String} fixICAO
     * @type {String}
     */
    get fixICAO() {
        return this._fixICAO;
    }

    /**
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @returns {Promise<WT_ICAOWaypoint>}
     */
    async waypointFix(icaoWaypointFactory) {
        return icaoWaypointFactory.getWaypoint(this.fixICAO);
    }
}

class WT_ProcedureLegCourseReference extends WT_ProcedureLegCourse {
    _initFromData(data) {
        super._initFromData(data);

        this._referenceICAO = data.originIcao;
    }

    /**
     * @readonly
     * @property {String} fixICAO
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
     * @property {WT_NumberUnitReadOnly} distance
     * @type {WT_NumberUnitReadOnly}
     */
    get distance() {
        return this._distance.readonly();
    }
}

class WT_FlyHeadingUntilDistanceFromReference extends WT_ProcedureLegCourseReferenceDistance {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_HEADING_UNTIL_DISTANCE_FROM_REFERENCE, data);
    }

    /**
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @param {WT_Waypoint} previousFix
     * @returns {Promise<WT_ICAOWaypoint>}
     */
    async waypointFix(icaoWaypointFactory, previousFix) {
        let reference = await icaoWaypointFactory.getWaypoint(this.referenceICAO);
        let targetDistance = this.distance.asUnit(WT_Unit.GA_RADIAN);
        let courseTrue = GeoMagnetic.INSTANCE.magneticToTrue(this.course, previousFix.location);

        // because I'm not smart enough to derive the closed-form solution, we will approximate using small circle intersection,
        // then iterate to find the solution numerically
        let solutions = [new WT_GVector3(0, 0, 0), new WT_GVector3(0, 0, 0)];
        let path = WT_GreatCircle.createFromPointBearing(previousFix.location, courseTrue);
        let circle = WT_SmallCircle.createFromPoint(reference.location, targetDistance);
        path.intersection(circle, solutions);
        if (solutions[0].length === 0) {
            throw new Error("Invalid procedure leg definition.");
        }

        let solution = WT_FlyHeadingUntilDistanceFromReference._tempGeoPoint1.setFromCartesian(solutions[0]);
        if (solutions[1].length > 0) {
            let alternate = WT_FlyHeadingUntilDistanceFromReference._tempGeoPoint2.setFromCartesian(solutions[1]);
            let headingTo1 = previousFix.location.bearingTo(solution);
            let headingTo2 = previousFix.location.bearingTo(alternate);
            let delta1 = Math.abs(headingTo1 - courseTrue);
            let delta2 = Math.abs(headingTo2 - courseTrue);
            delta1 = Math.min(delta1, 360 - delta1);
            delta2 = Math.min(delta2, 360 - delta2);
            if (delta2 < delta1) {
                solution = alternate;
            }
        }

        let a = previousFix.location.distance(reference.location);
        let aSquared = a * a;
        solution = solution.set(previousFix.location).offsetRhumb(courseTrue, b, true);
        let c = reference.location.distance(solution);
        let previousFixBearingFromOrigin = previousFix.location.bearingFrom(reference.location);
        let theta = Math.abs(180 - (courseTrue - previousFixBearingFromOrigin)) * Avionics.Utils.DEG2RAD;
        let cosTheta = Math.cos(theta);
        while (Math.abs(c - targetDistance) > WT_FlyHeadingUntilDistanceFromReference.FIX_TOLERANCE) {
            let b = previousFix.location.distance(solution);
            let bSquared = b * b;

            let targetFactor = targetDistance / c;
            let term1 = a * b * cosTheta;
            let term2 = Math.sqrt(bSquared * (aSquared * cosTheta * cosTheta - aSquared + targetFactor * targetFactor * c * c));
            let bFactor1 = (term1 + term2) / bSquared;
            let bFactor2 = (term1 - term2) / bSquared;
            let bFactorSolution;
            if (bFactor1 > 0) {
                bFactorSolution = bFactor1;
            } else if (bFactor2 > 0) {
                bFactorSolution = bFactor2;
            } else {
                break;
            }
            solution = solution.set(previousFix.location).offsetRhumb(courseTrue, b * bFactorSolution, true);
            c = reference.location.distance(solution);
        }

        return new WT_CustomWaypoint(this.procedure.name, solution);
    }
}
WT_FlyHeadingUntilDistanceFromReference.FIX_TOLERANCE = WT_Unit.METER.convert(100, WT_Unit.GA_RADIAN);
WT_FlyHeadingUntilDistanceFromReference._tempGeoPoint1 = new WT_GeoPoint(0, 0);
WT_FlyHeadingUntilDistanceFromReference._tempGeoPoint2 = new WT_GeoPoint(0, 0);

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
     * @property {String} fixICAO
     * @type {String}
     */
    get fixICAO() {
        return this._fixICAO;
    }

    /**
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @param {WT_Waypoint} previousFix
     * @returns {Promise<WT_ICAOWaypoint>}
     */
    async waypointFix(icaoWaypointFactory, previousFix) {
        if (this.fixICAO) {
            try {
                let fix = await icaoWaypointFactory.getWaypoint(this.fixICAO);
                return fix;
            } catch (e) {}
        }

        let courseTrue = GeoMagnetic.INSTANCE.magneticToTrue(this.course, previousFix.location);

        let targetDistance = this.distance.asUnit(WT_Unit.GA_RADIAN);
        let fix = WT_FlyReferenceRadialForDistance._tempGeoPoint.set(previousFix.location).offsetRhumb(courseTrue, targetDistance);

        return new WT_CustomWaypoint(this.procedure.name, fix);
    }
}
WT_FlyReferenceRadialForDistance._tempGeoPoint = new WT_GeoPoint(0, 0);

class WT_FlyHeadingToIntercept extends WT_ProcedureLegCourse {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_HEADING_TO_INTERCEPT, data);
    }

    /**
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @param {WT_Waypoint} previousFix
     * @param {WT_ProcedureLeg} nextLeg
     * @returns {Promise<WT_Waypoint>}
     */
    async waypointFix(icaoWaypointFactory, previousFix, nextLeg) {
        let reference;
        switch (nextLeg.type) {
            case WT_ProcedureLeg.Type.INITIAL_FIX:
            case WT_ProcedureLeg.Type.FIX:
                reference = await nextLeg.waypointFix(icaoWaypointFactory);
                break;
            case WT_ProcedureLeg.Type.FLY_REFERENCE_RADIAL_FOR_DISTANCE:
                if (nextLeg.fixICAO) {
                    reference = await icaoWaypointFactory.getWaypoint(nextLeg.fixICAO);
                }
                break;
        }

        if (!reference) {
            throw new Error("Invalid procedure leg definition.");
        }

        let courseTrue = GeoMagnetic.INSTANCE.magneticToTrue(this.course, previousFix.location);
        let nextLegCourseTrue = GeoMagnetic.INSTANCE.magneticToTrue(nextLeg.course, reference.location);

        let path = WT_RhumbLine.createFromPointBearing(previousFix.location, courseTrue);
        let courseToIntercept = WT_RhumbLine.createFromPointBearing(reference.location, nextLegCourseTrue);

        let intersection = path.intersectionGeoPoint(courseToIntercept, WT_FlyHeadingToIntercept._tempGeoPoint);
        if (!intersection) {
            throw new Error("Invalid procedure leg definition.");
        }

        return new WT_CustomWaypoint(this.procedure.name, intersection);
    }
}
WT_FlyHeadingToIntercept._tempGeoPoint = new WT_GeoPoint(0, 0);

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
     * @property {Number} radial
     * @type {Number}
     */
    get radial() {
        return this._radial;
    }

    /**
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @param {WT_Waypoint} previousFix
     * @returns {Promise<WT_ICAOWaypoint>}
     */
    async waypointFix(icaoWaypointFactory, previousFix) {
        let reference = await icaoWaypointFactory.getWaypoint(this.referenceICAO);
        let courseTrue = GeoMagnetic.INSTANCE.magneticToTrue(this.course, previousFix.location);
        let radialTrue = GeoMagnetic.INSTANCE.magneticToTrue(this.radial, reference.location);

        let path = WT_RhumbLine.createFromPointBearing(previousFix.location, courseTrue);
        let radial = WT_RhumbLine.createFromPointBearing(reference.location, radialTrue);

        let intersection = path.intersectionGeoPoint(radial, WT_FlyHeadingUntilReferenceRadialCrossing._tempGeoPoint);
        if (!intersection) {
            throw new Error("Invalid procedure leg definition.");
        }

        return new WT_CustomWaypoint(this.procedure.name, intersection);
    }
}
WT_FlyHeadingUntilReferenceRadialCrossing._tempGeoPoint = new WT_GeoPoint(0, 0);

class WT_FlyToBearingDistanceFromReference extends WT_ProcedureLegCourseReferenceDistance {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_TO_BEARING_DISTANCE_FROM_REFERENCE, data);
    }

    /**
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @returns {Promise<WT_ICAOWaypoint>}
     */
    async waypointFix(icaoWaypointFactory) {
        let reference = await icaoWaypointFactory.getWaypoint(this.referenceICAO);
        let courseTrue = GeoMagnetic.INSTANCE.magneticToTrue(this.course, reference.location);

        let targetDistance = this.distance.asUnit(WT_Unit.GA_RADIAN);
        let fix = WT_FlyToBearingDistanceFromReference._tempGeoPoint.set(reference.location).offset(courseTrue, targetDistance);

        return new WT_CustomWaypoint(this.procedure.name, fix);
    }
}
WT_FlyToBearingDistanceFromReference._tempGeoPoint = new WT_GeoPoint(0, 0);

class WT_FlyHeadingToAltitude extends WT_ProcedureLegCourse {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_HEADING_TO_ALTITUDE, data);
    }

    /**
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @param {WT_Waypoint} previousFix
     * @returns {Promise<WT_ICAOWaypoint>}
     */
    async waypointFix(icaoWaypointFactory, previousFix) {
        let courseTrue = GeoMagnetic.INSTANCE.magneticToTrue(this.course, previousFix.location);
        let targetDistance = this.altitudeFloor.asUnit(WT_Unit.FOOT) / 500;
        let fix = previousFix.location.offsetRhumb(courseTrue, WT_Unit.NMILE.convert(targetDistance, WT_Unit.GA_RADIAN));
        return new WT_CustomWaypoint(this.procedure.name, fix);
    }
}

class WT_FlyVectors extends WT_ProcedureLeg {
    constructor(procedure, data) {
        super(procedure, WT_ProcedureLeg.Type.FLY_VECTORS, data);
    }

    /**
     * @readonly
     * @property {Boolean} discontinuity
     * @type {Boolean}
     */
    get discontinuity() {
        return true;
    }

    /**
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @param {WT_Waypoint} previousFix
     * @returns {Promise<WT_ICAOWaypoint>}
     */
    async waypointFix(icaoWaypointFactory, previousFix) {
        return new WT_CustomWaypoint("VECTORS", previousFix.location);
    }
}

class ProcedureLegFactory {
    static createFromData(procedure, data) {
        switch (data.type) {
            case 7:
            case 15:
            case 17:
            case 18:
                let type = data.type === 15 ? WT_ProcedureLeg.Type.INITIAL_FIX : WT_ProcedureLeg.Type.FIX;
                return new WT_FlyToFix(procedure, type, data);
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