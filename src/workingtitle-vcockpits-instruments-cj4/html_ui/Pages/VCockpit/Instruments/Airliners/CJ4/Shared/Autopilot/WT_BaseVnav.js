class WT_BaseVnav {

    /**
     * Creates an instance of WT_BaseVnav.
     * @param {FlightPlanManager} fpm The flight plan manager to use with this instance.
     * @param {CJ4_FMC} fmc The nav mode selector to use with this instance.
     */
    constructor(fpm, fmc) {
        /**
         * The flight plan manager
         * @type {FlightPlanManager}
         */
        this._fpm = fpm;

        /**
        * The FMC class
        * @type {CJ4_FMC}
        */
        this._fmc = fmc;

        /**
        * Whether VNAV is calculating or not
        * @type {boolean}
        */
        this._vnavCalculating = false;

        /**
         * Whether VNAV is calculating or not
         * @type {WayPoint}
         */
        this._activeWaypoint = undefined;

        /**
         * The vertical flight plan array of vertical waypoint objects
         * @type {Array}
         */
        this._verticalFlightPlan = [];

        /**
        * The vertical flight plan array of VNAV segments
        * @type {Array}
        */
        this._verticalFlightPlanSegments = [];

        /**
         * The calculated approach GP if GP is loaded.
         * @type {number}
         */
        this._approachGlidePath = undefined;

        /**
         * Index of the approach runway if GP is loaded.
         * @type {number}
         */
        this._approachRunwayIndex = undefined;

        /**
         * The index of the first waypoint that is not a climb waypoint.
         * @type {number}
         */
        this._firstPossibleDescentIndex = 0;

        /**
         * The index of the last waypoint that is a climb/departure waypoint.
         * @type {number}
         */
        this._lastClimbIndex = 0;

        /**
         * The index of the first path segment (path segments run in reverse order to 0,
         * so the first one is the highest number).
         * @type {number}
         */
        this._firstPathSegment = 0;

        /**
         * Whether or not a descent path has been calculated/exists
         * @type {boolean}
         */
        this._pathExists = false;

        /**
        * The next constraint.
        * @type {object}
        */
        this._activeConstraint = {};

        /**
         * The furthest distance away to show a constraint on the PFD.
         * @type {number}
         */
        this._distanceToShowConstraint = 80;

        /**
         * The vertical direct target waypoint.
         * @type {VerticalWaypoint}
         */
        this._verticalDirectWaypoint = undefined;

        /**
         * The current VNAV state.
         * @type {VnavState}
         */
        this._vnavState = VnavState.NONE;

        /**
         * The at constraints in the current plan for segment building.
         * @type {Array}
         */
        this._atConstraints = [];

        /**
         * The checksum to compare against the flight plan.
         * @type {number}
         */
        this._fpChecksum = -1;
    }

    /**
     * The active flight plan.
     * @type {ManagedFlightPlan}
     */
    get flightplan() {
        return this._fpm.getFlightPlan(0);
    }

    get destination() {
        if (this._fpm.getDestination()) {
            return this._fpm.getDestination();
        } else {
            return undefined;
        }
    }

    get currentWaypoints() {
        return this.flightplan.waypoints.slice(this.flightplan.activeWaypointIndex);
    }

    get allWaypoints() {
        return this.flightplan.waypoints;
    }

    get vnavTargetFPA() {
        return WTDataStore.get('CJ4_vpa', 3);
    }

    get constraintValue() {
        return localStorage.getItem("WT_CJ4_CONSTRAINT");
    }

    get indicatedAltitude() {
        return SimVar.GetSimVarValue("INDICATED ALTITUDE:1", "feet");
    }

    get gpsAltitude() {
        return SimVar.GetSimVarValue("PLANE ALTITUDE", "Feet");
    }

    get vnavState() {
        return this._vnavState;
    }

    set vnavState(value) {
        this._vnavState = value;
    }

    /**
     * Run on first activation.
     */
    activate() {
        SimVar.SetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "feet", 0);
        localStorage.setItem("WT_CJ4_CONSTRAINT", "");
        SimVar.SetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_TOD_DISTANCE", "number", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_TOD_REMAINING", "number", 0);
        this._vnavState = VnavState.NONE;

        this.update();
    }

    /**
     * Update data if needed.
     */
    update() {

        this._activeWaypoint = this.allWaypoints[this.flightplan.activeWaypointIndex];
        this._currentFlightSegment = this._fpm.getSegmentFromWaypoint(this._activeWaypoint);
        if (this.vnavState !== VnavState.NONE && (!this.allWaypoints || this.allWaypoints.length < 2)) {
            this.vnavState = VnavState.NONE;
        }

        //CAN VNAV EVEN RUN?
        if (this.destination && this.allWaypoints && this.allWaypoints.length > 1 && this._activeWaypoint) {
            this._vnavCalculating = true;
            this._currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
            this._activeWaypointDist = Avionics.Utils.computeDistance(this._currPos, this._activeWaypoint.infos.coordinates);
            this._currentDistanceInFP = this._activeWaypoint.cumulativeDistanceInFP - this._activeWaypointDist;

            if (this._fpChecksum !== this.flightplan.checksum) {
                this._activeConstraint = {};
                this._atConstraints = [];
                switch (this._vnavState) {
                    case VnavState.NONE:
                    case VnavState.PATH:
                        this.vnavState = this.buildVerticalFlightPlan();
                        break;
                    case VnavState.DIRECT:
                        this.reactivateVerticalDirect();
                }
                if (this._fpm.isLoadedApproach()) {
                    this._approachGlidePath = this.buildGlidepath();

                } else { this._approachGlidePath = undefined; }

                this._fpChecksum = this.flightplan.checksum;
            }

            if (this._vnavState === VnavState.DIRECT) {
                const directWaypoint = this.currentWaypoints.find(w => { return (w && w.ident === this._verticalDirectWaypoint.ident); });
                if (!directWaypoint) {
                    this._vnavState = VnavState.PATH;
                }
            }

            this.manageConstraints();
            this.calculateTod();
            this.calculateAdvisoryDescent();
        }
    }

    getFirstApproachWaypointIndex() {
        const approach = this._fpm.getApproachWaypoints();
        if (approach && approach.length > 0) {
            return this.allWaypoints.indexOf(approach[0]);
        }
        return undefined;
    }

    getLastApproachWaypointIndex() {
        const approach = this._fpm.getApproachWaypoints();
        if (approach && approach.length > 0) {
            return this.allWaypoints.indexOf(approach[approach.length - 1]);
        }
        return false;
    }

    activateVerticalDirect(targetIndex, altitude, callback = EmptyCallback.Void) {
        for (let i = this.flightplan.activeWaypointIndex; i < targetIndex; i++) {
            this.allWaypoints[i].legAltitudeDescription = 0;
        }
        this.allWaypoints[targetIndex].legAltitudeDescription = 1;
        this.allWaypoints[targetIndex].legAltitude1 = altitude;
        const distanceToTarget = this.allWaypoints[targetIndex].cumulativeDistanceInFP - this._currentDistanceInFP;
        const descentRequired = 250 + this.indicatedAltitude - altitude;
        const fpa = AutopilotMath.calculateFPA(descentRequired, distanceToTarget);
        this.vnavState = this.buildVerticalFlightPlan(true, targetIndex, altitude, fpa);
        callback();
    }

    reactivateVerticalDirect() {
        const directWaypoint = this.allWaypoints.find(w => { return (w && w.ident === this._verticalDirectWaypoint.ident); });
        if (directWaypoint) {
            const directWaypointIndex = this.allWaypoints.indexOf(directWaypoint);
            let constraintAddedBeforeDirectWaypoint = false;
            if (this.allWaypoints[directWaypointIndex].legAltitudeDescription <= 0) {
                constraintAddedBeforeDirectWaypoint = true;
            }
            for (let i = this.flightplan.activeWaypointIndex; i < directWaypointIndex; i++) {
                if (this.allWaypoints[i].legAltitudeDescription > 0) {
                    constraintAddedBeforeDirectWaypoint = true;
                    break;
                }
            }
            if (constraintAddedBeforeDirectWaypoint) {
                this._verticalDirectWaypoint = undefined;
                this.vnavState = this.buildVerticalFlightPlan();
            } else {
                this.activateVerticalDirect(directWaypointIndex, this._verticalDirectWaypoint.waypointFPTA);
            }
        } else {
            this._verticalDirectWaypoint = undefined;
            this.vnavState = this.buildVerticalFlightPlan();
        }
    }

    cancelVerticalDirectTo() {
        this._verticalDirectWaypoint = undefined;
        this._pathExists = buildVerticalFlightPlan();
    }

    buildVerticalFlightPlan(verticalDirect = false, vDirectTargetIndex, vDirectAltitude, vDirectFpa) {
        this._verticalFlightPlan = [];
        this._atConstraints = [];
        this._activeConstraint = {};
        const waypointCount = this.allWaypoints.length;
        let lastClimbIndex = 0;
        let firstPossibleDescentIndex = 0;
        let firstApproachWaypointIndex = this.getFirstApproachWaypointIndex();
        let lastApproachWaypointIndex = this.getLastApproachWaypointIndex();
        if (!lastApproachWaypointIndex) {
            lastApproachWaypointIndex = this.allWaypoints.length - 1;
        }

        for (let i = 0; i < waypointCount; i++) { //Assemble this._verticalFlightPlan
            const segmentType = this._fpm.getSegmentFromWaypoint(this.allWaypoints[i]).type;
            const isClimb = (segmentType === SegmentType.Departure || segmentType === SegmentType.Missed) ? true : false;
            const isLastApproachWaypoint = i == lastApproachWaypointIndex ? true : false;
            const constraints = this.parseConstraints(this.allWaypoints[i]);
            const vwp = new VerticalWaypoint(i, this.allWaypoints[i].ident, isClimb);
            console.log("creating vertical waypoint " + i + " " + vwp.ident + " is climb? " + isClimb);
            vwp.legDistanceTo = i > 0 ? this.allWaypoints[i].cumulativeDistanceInFP - this.allWaypoints[i - 1].cumulativeDistanceInFP : 0;
            vwp.upperConstraintAltitude = constraints.upperConstraint;
            vwp.lowerConstraintAltitude = constraints.lowerConstraint;
            vwp.isAtConstraint = constraints.isAtConstraint;
            vwp.hasConstraint = constraints.hasConstraint;
            if (firstApproachWaypointIndex !== undefined && i >= firstApproachWaypointIndex && vwp.lowerConstraintAltitude > 0) {
                vwp.upperConstraintAltitude = constraints.lowerConstraint;
                vwp.isAtConstraint = true;
                firstApproachWaypointIndex = undefined;
                console.log("setting " + vwp.ident + " as first approach waypoint AT constraint " + constraints.lowerConstraint + "FT");
            }
            if (vwp.isAtConstraint) {
                vwp.waypointFPTA = vwp.lowerConstraintAltitude;
                const atConstraint = {
                    index: i,
                    altitude: vwp.waypointFPTA
                };
                this._atConstraints.push(atConstraint);
            }
            if (verticalDirect && i <= vDirectTargetIndex) {
                switch (i) {
                    case vDirectTargetIndex:
                        vwp.upperConstraintAltitude = vDirectAltitude;
                        vwp.lowerConstraintAltitude = vDirectAltitude;
                        vwp.waypointFPTA = vDirectAltitude;
                        vwp.isAtConstraint = true;
                        this._verticalDirectWaypoint = vwp;
                        break;
                    default:
                        vwp.upperConstraintAltitude = Infinity;
                        vwp.lowerConstraintAltitude = 0;
                        vwp.isAtConstraint = false;
                }
            }
            this._verticalFlightPlan.push(vwp);
            lastClimbIndex = (isClimb && i < lastApproachWaypointIndex) ? i : lastClimbIndex;
            firstPossibleDescentIndex = (isClimb && vwp.hasConstraint && i < lastApproachWaypointIndex) ? i : firstPossibleDescentIndex;
        }
        console.log("lastClimbIndex " + lastClimbIndex);
        const segmentBuildStartIndex = Math.max(this.flightplan.activeWaypointIndex - 1, lastClimbIndex); 
        this._verticalFlightPlanSegments = [];
        let segment = 0;
        let nextSegmentEndIndex = undefined;
        let verticalDirectSegmentCreated = false;
        for (let j = lastApproachWaypointIndex; j > segmentBuildStartIndex; j--) { //Build Path Segments
            console.log("j: " + j + " ident: " + this._verticalFlightPlan[j].ident + " segment: " + this._verticalFlightPlan[j].segment + " FPTA: " + this._verticalFlightPlan[j].waypointFPTA);
            if (verticalDirectSegmentCreated || (this._verticalFlightPlanSegments[segment - 1] && j >= this._verticalFlightPlanSegments[segment - 1].startIndex)) {
                console.log("skipping j: " + j);
            }
            else if (verticalDirect && j === vDirectTargetIndex) {
                console.log("building segment DIRECT: " + segment);
                this._verticalFlightPlan[j].waypointFPTA = this._verticalFlightPlan[j].lowerConstraintAltitude;
                this._verticalFlightPlanSegments.push(this.buildVerticalSegment(segment, j, vDirectFpa));
                segment = segment + 1;
                verticalDirectSegmentCreated = true;
            }
            else if (!this._verticalFlightPlan[j].segment && this._verticalFlightPlan[j].waypointFPTA) {
                this._verticalFlightPlanSegments.push(this.buildVerticalSegment(segment, j));
                segment = segment + 1;
            }
        }
        this._lastClimbIndex = lastClimbIndex;
        this._firstPossibleDescentIndex = firstPossibleDescentIndex + 1;
        this._firstPathSegment = this._verticalFlightPlanSegments.length - 1;
        const isPath = segment === 0 & nextSegmentEndIndex === undefined ? false : true;
        const state = verticalDirect ? VnavState.DIRECT : isPath ? VnavState.PATH : VnavState.NONE;
        //console.log(JSON.stringify(this._verticalFlightPlanSegments));
        return state;
    }

    isSegmentFlat(endingIndex, waypointFPTA) {
        let flatPathStartIndex = undefined;
        for (let i = this._atConstraints.length - 1; i >= 0; i--) {
            if (this._atConstraints[i].index < endingIndex && !this._verticalFlightPlan[this._atConstraints[i].index].isClimb &&
                waypointFPTA == this._atConstraints[i].altitude) {
                flatPathStartIndex = this._atConstraints[i].index;
            }
        }
        if (flatPathStartIndex) {
            return flatPathStartIndex;
        } else {
            return false;
        }
    }

    buildVerticalSegment(segment, endingIndex, inputFPA = this.vnavTargetFPA) {
        const vwp = this._verticalFlightPlan[endingIndex];
        console.log("building vertical segment " + segment + " to " + vwp.ident + " index: " + endingIndex + " with FPTA: " + vwp.waypointFPTA);
        let isFlatSegment = false;
        let flatPathStartIndex = undefined;
        let segmentMaxFPA = 6;
        let segmentMinFPA = 1;
        let segmentBreakIndex = endingIndex;
        let lateralDistance = vwp.legDistanceTo;
        let bestFPA = inputFPA;
        let segmentIsFirst = false;
        let maxAltitude = 0;
        let segmentStartsLevel = false;
        let segmentEndsLevel = false;
        if (this.isSegmentFlat(endingIndex, vwp.waypointFPTA)) {
            maxAltitude = vwp.waypointFPTA;
            bestFPA = 0;
            flatPathStartIndex = this.isSegmentFlat(endingIndex, vwp.waypointFPTA) + 1;
            isFlatSegment = true;
            segmentStartsLevel = true;
            console.log("flat segment detected - segment " + segment + " from " + vwp.ident + " to " + this._verticalFlightPlan[flatPathStartIndex - 1].ident + " at " + maxAltitude + "FT");
        }
        if (!isFlatSegment) {
            for (let k = endingIndex - 1; k >= 0; k--) {
                const wptToEvaluate = this._verticalFlightPlan[k];
                for (let m = this._atConstraints.length - 1; m >= 0; m--) {
                    if (this._atConstraints[m].index <= k && !this._verticalFlightPlan[this._atConstraints[m].index].isClimb) {
                        maxAltitude = this._atConstraints[m].altitude;
                        console.log("preceding at constraint at index " + this._atConstraints[m].index + "; altitude " + maxAltitude);
                        break;
                    } else {
                        maxAltitude = 0;
                    }
                }
                let upperAltitude = maxAltitude > 0 ? Math.min(maxAltitude, wptToEvaluate.upperConstraintAltitude) : wptToEvaluate.upperConstraintAltitude;
                const altToUpperConstraint = upperAltitude - vwp.waypointFPTA;
                const altToLowerConstraint = wptToEvaluate.lowerConstraintAltitude - vwp.waypointFPTA;
                console.log("segment wpt " + wptToEvaluate.ident + " upperAltitude " + upperAltitude + " wptToEvaluate.lowerConstraintAltitude " + wptToEvaluate.lowerConstraintAltitude);
                console.log("segmentMaxFPA " + segmentMaxFPA + " segmentMinFPA " + segmentMinFPA + " segment best fpa " + bestFPA);
                if (wptToEvaluate.isClimb) {
                    segmentIsFirst = true;
                    segmentBreakIndex = k;
                    bestFPA = Math.max(Math.min(segmentMaxFPA, bestFPA), segmentMinFPA);
                    console.log(wptToEvaluate.ident + " breaks path isClimb ");
                    break;
                }
                else if (wptToEvaluate.isAtConstraint) {
                    const fpa = AutopilotMath.calculateFPA(altToLowerConstraint, lateralDistance);
                    console.log(wptToEvaluate.ident + " is at constraint " + "lateralDistance " + lateralDistance + " altToLowerConstraint " + altToLowerConstraint + " with fpa: " + fpa);
                    if (fpa >= segmentMaxFPA) {
                        bestFPA = segmentMaxFPA;
                        console.log(wptToEvaluate.ident + " breaks path ABOVE; segment FPA to segmentMaxFPA " + bestFPA);
                        break;
                    }
                    if (fpa <= segmentMinFPA) {
                        bestFPA = segmentMinFPA;
                        console.log(wptToEvaluate.ident + " breaks path BELOW; segment FPA to segmentMinFPA " + bestFPA);
                        break;
                    }
                    segmentMaxFPA = fpa;
                    segmentMinFPA = fpa;
                    bestFPA = fpa;
                    segmentBreakIndex = k;
                    console.log(wptToEvaluate.ident + " ends next segment; segment FPA to " + bestFPA);
                    break;
                }
                else {
                    const maxFPA = altToUpperConstraint < Infinity ? AutopilotMath.calculateFPA(altToUpperConstraint, lateralDistance) : 6;
                    const minFPA = altToLowerConstraint > 0 ? AutopilotMath.calculateFPA(altToLowerConstraint, lateralDistance) : 0;
                    console.log("maxFPA " + maxFPA + " minFPA " + minFPA);
                    console.log(wptToEvaluate.ident + " not at constraint " + "lateralDistance " + lateralDistance);
                    if (maxFPA < segmentMinFPA) {
                        if (segmentMinFPA <= 1) {
                            bestFPA = Math.min(3, segmentMaxFPA);
                            segmentStartsLevel = true;
                        } else {
                            bestFPA = segmentMinFPA;
                        }
                        console.log(wptToEvaluate.ident + " breaks path BELOW; segment FPA to segmentMinFPA " + bestFPA);
                        break;
                    }
                    if (minFPA > segmentMaxFPA) {
                        bestFPA = segmentMaxFPA;
                        console.log(wptToEvaluate.ident + " breaks path ABOVE; segment FPA to segmentMaxFPA " + bestFPA);
                        break;
                    }
                    segmentMaxFPA = maxFPA < segmentMaxFPA ? maxFPA : segmentMaxFPA;
                    segmentMinFPA = minFPA > segmentMinFPA ? minFPA : segmentMinFPA;
                    segmentBreakIndex = k;
                    lateralDistance = lateralDistance + wptToEvaluate.legDistanceTo;
                    console.log("segmentMaxFPA updated to " + segmentMaxFPA + "; segmentMinFPA updated to " + segmentMinFPA);
                    console.log(wptToEvaluate.ident + " added to segment " + segment);
                }
                
            }
        }
        const segmentStartIndex = isFlatSegment ? flatPathStartIndex : Math.min(segmentBreakIndex + 1, endingIndex);
        console.log("starting fix: " + this._verticalFlightPlan[segmentStartIndex].ident + " target fix: " + this._verticalFlightPlan[endingIndex].ident);
        console.log("segment " + segment + " break idx " + segmentBreakIndex + " starting idx " + segmentStartIndex + " endingIndex " + endingIndex);
        for (let l = segmentStartIndex; l <= endingIndex; l++) {
            this._verticalFlightPlan[l].segment = segment;
            this._verticalFlightPlan[l].waypointFPA = bestFPA;
            console.log("setting: " + this._verticalFlightPlan[l].ident + " FPA: " + bestFPA + " segment: " + segment);
        }
        switch (segmentIsFirst) {
            case true:
                break;
            case false:
                console.log("segment " + segment + " is not first segment");
                if (segmentBreakIndex != endingIndex && !this._verticalFlightPlan[segmentBreakIndex].waypointFPTA && !isFlatSegment) {
                    const segmentLateralDistance = lateralDistance - this._verticalFlightPlan[segmentBreakIndex].legDistanceTo;
                    const segmentStartFPTA = this._verticalFlightPlan[endingIndex].waypointFPTA + AutopilotMath.calculateFPTA(bestFPA, segmentLateralDistance);
                    this._verticalFlightPlan[segmentBreakIndex].waypointFPTA = maxAltitude > 0 ? Math.min(segmentStartFPTA, maxAltitude) : segmentStartFPTA;
                    segmentStartsLevel = maxAltitude > 0 && maxAltitude < segmentStartFPTA ? true : segmentStartsLevel;
                    console.log("based on distance: " + segmentLateralDistance + " FPA: " + bestFPA);
                    console.log("setting: " + this._verticalFlightPlan[segmentBreakIndex].ident + " wpt FPTA: " + this._verticalFlightPlan[segmentBreakIndex].waypointFPTA);
                }
        }
        const distanceToNextTod = this.checkIfSegmentEndsLevel(segment, endingIndex, vwp.waypointFPTA);
        segmentEndsLevel = distanceToNextTod > 0 ? true : segmentEndsLevel;
        console.log("writing segment " + segment + "; Start: " + segmentStartIndex + " " + this._verticalFlightPlan[segmentStartIndex].ident + "; Target: " + endingIndex + " " + this._verticalFlightPlan[endingIndex].ident
            + "; FPA: " + bestFPA + "; distanceToNextTod " + distanceToNextTod);
        return new PathSegment(segmentStartIndex, endingIndex, bestFPA, distanceToNextTod, segmentStartsLevel, segmentEndsLevel);
    }

    checkIfSegmentEndsLevel(segment, endingIndex, fpta) {
        if (segment > 0 && this._verticalFlightPlanSegments[segment - 1].fpa === 0) {
            const prevDistanceToNextTod = this._verticalFlightPlanSegments[segment - 1].distanceToNextTod;
            const prevFlatSementTarget = this._verticalFlightPlanSegments[segment - 1].targetIndex;
            const prevFlatSegmentDistance = this.allWaypoints[prevFlatSementTarget].cumulativeDistanceInFP - this.allWaypoints[endingIndex].cumulativeDistanceInFP;
            const distanceToNextTod = prevFlatSegmentDistance + prevDistanceToNextTod;
            return distanceToNextTod;
        }
        else if (segment > 0) {
            const nextFPTA = this._verticalFlightPlan[this._verticalFlightPlanSegments[segment - 1].targetIndex].waypointFPTA;
            const nextFPA = this._verticalFlightPlanSegments[segment - 1].fpa;
            const distance = this.allWaypoints[this._verticalFlightPlanSegments[segment - 1].targetIndex].cumulativeDistanceInFP
                - this.allWaypoints[endingIndex].cumulativeDistanceInFP;
            const descentDistance = AutopilotMath.calculateDescentDistance(nextFPA, fpta - nextFPTA);
            const distanceToNextTod = distance - descentDistance > 0 ? distance - descentDistance : 0;
            return distanceToNextTod;
        }
        return 0;
    }

    parseConstraints(waypoint) {
        const constraints = {
            upperConstraint: Infinity,
            lowerConstraint: 0,
            isAtConstraint: false,
            hasConstraint: false
        };
        switch (waypoint.legAltitudeDescription) {
            case 1:
                constraints.upperConstraint = Math.floor(waypoint.legAltitude1);
                constraints.lowerConstraint = Math.floor(waypoint.legAltitude1);
                constraints.isAtConstraint = true;
                constraints.hasConstraint = true;
                break;
            case 2:
                constraints.lowerConstraint = Math.floor(waypoint.legAltitude1);
                constraints.hasConstraint = true;
                break;
            case 3:
                constraints.upperConstraint = Math.floor(waypoint.legAltitude1);
                constraints.hasConstraint = true;
                break;
            case 4:
                constraints.lowerConstraint = Math.floor(waypoint.legAltitude2);
                constraints.upperConstraint = Math.floor(waypoint.legAltitude1);
                constraints.hasConstraint = true;
                break;
        }
        return constraints;
    }

    /**
    * Get the next constraint.
    */
    getConstraint() {
        let constraint = undefined;
        let index = undefined;
        let isClimb = false;
        if (this._verticalFlightPlan.length > 0 && this._verticalFlightPlan[this.flightplan.activeWaypointIndex].isClimb) {
            isClimb = true;
            for (let i = this.flightplan.activeWaypointIndex; i <= this._lastClimbIndex; i++) {
                if (this._verticalFlightPlan[i].upperConstraintAltitude && this._verticalFlightPlan[i].upperConstraintAltitude < Infinity) {
                    constraint = this._verticalFlightPlan[i].upperConstraintAltitude;
                    index = i;
                    break;
                }
            }
        } else if (this._verticalFlightPlan.length > 0) {
            for (let i = this.flightplan.activeWaypointIndex; i < this._verticalFlightPlan.length; i++) {
                if (this._verticalFlightPlan[i].lowerConstraintAltitude && this._verticalFlightPlan[i].lowerConstraintAltitude > 0) {
                    constraint = this._verticalFlightPlan[i].lowerConstraintAltitude;
                    index = i;
                    break;
                }
            }
        }
        const constraintObject = {
            index: index,
            altitude: Math.round(constraint),
            isClimb: isClimb
        };
        return constraintObject;
    }

    setConstraint(constraint = 0) {
        let constraintText = undefined;
        switch (typeof constraint) {
            case "string":
                constraintText = constraint;
                break;
            case "number":
                if (constraint > 0) {
                    constraintText = constraint.toFixed(0);
                } else {
                    constraintText = "";
                }
                break;
            default:
                return;
        }
        localStorage.setItem("WT_CJ4_CONSTRAINT", constraintText);
    }

    manageConstraints() {
        if (this._activeConstraint == {} || this._activeConstraint.index === undefined) {
            this._activeConstraint = this.getConstraint();
        }

        if (this._activeConstraint.index === undefined) {
            this.setConstraint();
            return;
        } else if (this.flightplan.activeWaypointIndex > this._activeConstraint.index) {
            this._activeConstraint = this.getConstraint();
        }

        if (this._activeConstraint.index >= this.flightplan.activeWaypointIndex) {
            if (this._activeConstraint.altitude != parseInt(this.constraintValue) && !this.allWaypoints[this._activeConstraint.index].isRunway) {
                if (this.allWaypoints[this._activeConstraint.index].cumulativeDistanceInFP - this._currentDistanceInFP < this._distanceToShowConstraint) {
                    this.setConstraint(this._activeConstraint.altitude);
                } else {
                    this.setConstraint();
                }
            }
            else if (this.allWaypoints[this._activeConstraint.index].isRunway && this.allWaypoints[this._activeConstraint.index].ident != this.constraintValue) {
                if (this.allWaypoints[this._activeConstraint.index].isRunway && this._activeConstraint.index > 1
                    && this.allWaypoints[this._activeConstraint.index].cumulativeDistanceInFP - this._currentDistanceInFP < this._distanceToShowConstraint) {
                    this.setConstraint("RWY");
                } else {
                    this.setConstraint();
                }
            }
        } else {
            this.setConstraint();
        }
    }

    trackApproachGlidepath() {
        const path = {
            deviation: undefined,
            fpa: undefined,
            fpta: undefined
        };
        if (this._fpm.isLoadedApproach() && this._approachRunwayIndex === undefined && !this._fmc._fpHasChanged) {
            this.buildGlidepath();
        }
        if (this._fpm.isLoadedApproach() && this._approachRunwayIndex && this._approachGlidePath && !this._fmc._fpHasChanged) {
            const runwayDistance = Avionics.Utils.computeDistance(this._currPos, this.allWaypoints[this._approachRunwayIndex].infos.coordinates);
            const runwayAltitude = this._verticalFlightPlan[this._approachRunwayIndex].lowerConstraintAltitude;
            const desiredAltitude = runwayAltitude + AutopilotMath.calculateFPTA(this._approachGlidePath, runwayDistance);
            path.deviation = this.gpsAltitude - desiredAltitude;
            path.fpa = this._approachGlidePath;
            path.fpta = runwayAltitude;
        }
        return path;
    }

    trackPath(nextSegment = false) {
        const currentPathSegment = this._verticalFlightPlan[this.flightplan.activeWaypointIndex].segment;
        //console.log("currentPathSegment " + currentPathSegment);
        let trackSegment = this._verticalFlightPlanSegments.length - 1;
        if (currentPathSegment >= 0) {
            trackSegment = currentPathSegment;
            if (trackSegment > 0 && nextSegment) {
                trackSegment = currentPathSegment - 1;
            }
        }
        const flightPathTarget = this._verticalFlightPlanSegments[trackSegment].targetIndex;
        const fpta = this._verticalFlightPlan[flightPathTarget].waypointFPTA;
        const fpa = this._verticalFlightPlanSegments[trackSegment].fpa;
        const distance = this.allWaypoints[flightPathTarget].cumulativeDistanceInFP - this._currentDistanceInFP;
        const desiredAltitude = fpta + AutopilotMath.calculateFPTA(fpa, distance);
        const path = {
            deviation: this.indicatedAltitude - desiredAltitude,
            fpa: fpa,
            fpta: fpta,
            endsLevel: this._verticalFlightPlanSegments[trackSegment].segmentEndsLevel
        };
        return path;
    }

    getDistanceToTarget() {
        let segment = this._verticalFlightPlanSegments.length - 1;
        const currentPathSegment = this._verticalFlightPlan[this.flightplan.activeWaypointIndex].segment;
        if (currentPathSegment) {
            segment = currentPathSegment;
        }
        const flightPathTarget = this._verticalFlightPlanSegments[segment].targetIndex;
        return this.allWaypoints[flightPathTarget].cumulativeDistanceInFP - this._currentDistanceInFP;
    }

    getTargetAltitude() {
        let segment = this._verticalFlightPlanSegments.length - 1;
        const currentPathSegment = this._verticalFlightPlan[this.flightplan.activeWaypointIndex].segment;
        if (currentPathSegment) {
            segment = currentPathSegment;
        }
        const flightPathTarget = this._verticalFlightPlanSegments[segment].targetIndex;
        return this._verticalFlightPlan[flightPathTarget].waypointFPTA;
    }

    calculateTod() {
        let todExists = false;
        let altitude = undefined;
        let fpta = undefined;
        let fpa = undefined;
        let todDistanceInFP = undefined;
        const currentSegment = this._verticalFlightPlan[this.flightplan.activeWaypointIndex].segment;
        if (this._fmc._currentVerticalAutopilot && this._fmc._currentVerticalAutopilot._vnavPathStatus && this._fmc._currentVerticalAutopilot._vnavPathStatus == VnavPathStatus.PATH_ACTIVE) {
            todExists = false;
        }
        else if (currentSegment !== undefined && currentSegment > 0 && this._verticalFlightPlanSegments[currentSegment].fpa == 0) {
            todDistanceInFP = this.allWaypoints[this._verticalFlightPlanSegments[currentSegment].targetIndex].cumulativeDistanceInFP + this._verticalFlightPlanSegments[currentSegment].distanceToNextTod;
            todExists = true;
        }
        else if (this._firstPathSegment >= 0 && this.flightplan.activeWaypointIndex <= this._lastClimbIndex) {
            altitude = this._fmc.cruiseFlightLevel * 100;
            fpta = this._verticalFlightPlan[this._verticalFlightPlanSegments[this._firstPathSegment].targetIndex].waypointFPTA;
            fpa = this._verticalFlightPlanSegments[this._firstPathSegment].fpa;
            if (this.indicatedAltitude > fpta + 100) {
                altitude = this.indicatedAltitude;
            }
            const descentDistance = AutopilotMath.calculateDescentDistance(fpa, altitude - fpta);
            todDistanceInFP = this.allWaypoints[this._verticalFlightPlanSegments[this._firstPathSegment].targetIndex].cumulativeDistanceInFP - descentDistance;
            todExists = true;
        }
        else if (this._firstPathSegment < 0 || !this._verticalFlightPlan[this.flightplan.activeWaypointIndex]) {
            todExists = false;
        }
        else if (this.flightplan.activeWaypointIndex > this._lastClimbIndex) {
            altitude = this.indicatedAltitude;
            if (currentSegment >= 0) {
                fpta = this._verticalFlightPlan[this._verticalFlightPlanSegments[currentSegment].targetIndex].waypointFPTA;
                fpa = this._verticalFlightPlanSegments[currentSegment].fpa;
                const descentDistance = AutopilotMath.calculateDescentDistance(fpa, altitude - fpta);
                todDistanceInFP = this.allWaypoints[this._verticalFlightPlanSegments[this._firstPathSegment].targetIndex].cumulativeDistanceInFP - descentDistance;
                todExists = true;
            } else {
                todExists = false;
            }
        }
        if (todExists) {
            this.setTodWaypoint(true, todDistanceInFP);
        } else {
            this.setTodWaypoint();
        }
    }

    calculateAdvisoryDescent() { //Creates a point when VNAV is not available to start descent to reach 1500' AGL 10nm from airport
        if (this.vnavState = VnavState.NONE) {
            if (this.destination && this._fmc.cruiseFlightLevel && !Simplane.getIsGrounded()) {
                const elevation = parseFloat(this.destination.infos.oneWayRunways[0].elevation) * 3.28;
                const altitude = this._fmc.cruiseFlightLevel * 100;
                const verticalDistance = (altitude - elevation) - 1500;
                const horizontalDescentDistance = (verticalDistance / Math.tan(3 * Math.PI / 180)) / 6076.12;
                const advDesDisFromCurrPos = this.destination.cumulativeDistanceInFP - horizontalDescentDistance;
                SimVar.SetSimVarValue("L:WT_CJ4_TOD_DISTANCE", "number", horizontalDescentDistance);
                SimVar.SetSimVarValue("L:WT_CJ4_TOD_REMAINING", "number", advDesDisFromCurrPos);
                SimVar.SetSimVarValue("L:WT_CJ4_ADV_DES_ACTIVE", "number", 1);
            }          
        } else {
            SimVar.SetSimVarValue("L:WT_CJ4_TOD_DISTANCE", "number", 0);
            SimVar.SetSimVarValue("L:WT_CJ4_TOD_REMAINING", "number", 0);
            SimVar.SetSimVarValue("L:WT_CJ4_ADV_DES_ACTIVE", "number", 0);
        }
    }

    setTodWaypoint(calculate = false, todDistanceInFP) {

        if (calculate === true) {
            const todDistanceFromCurrPos = todDistanceInFP < this._currentDistanceInFP ? 0 : todDistanceInFP - this._currentDistanceInFP;
            const todDistanceFromDest = this.destination.cumulativeDistanceInFP - todDistanceInFP;
            // console.log("todDistanceInFP " + todDistanceInFP + " this._currentDistanceInFP " + this._currentDistanceInFP);
            // console.log("todDistanceFromCurrPos " + todDistanceFromCurrPos + " todDistanceFromDest " + todDistanceFromDest);
            SimVar.SetSimVarValue("L:WT_CJ4_TOD_DISTANCE", "number", todDistanceFromDest);
            SimVar.SetSimVarValue("L:WT_CJ4_TOD_REMAINING", "number", todDistanceFromCurrPos);
        } else {
            SimVar.SetSimVarValue("L:WT_CJ4_TOD_DISTANCE", "number", 0);
            SimVar.SetSimVarValue("L:WT_CJ4_TOD_REMAINING", "number", 0);
        }
    }


    // writeDatastoreValues() {
    //     const vnavValues = {
    //         vnavTargetAltitude: this._vnavTargetAltitude,
    //         vnavTargetDistance: this._vnavTargetDistance,
    //         topOfDescent: this._topOfDescent,
    //         distanceToTod: this._distanceToTod,
    //         gpExists: this._gpExists,
    //         gpAngle: this._gpAngle
    //     };
    //     WTDataStore.set('CJ4_vnavValues', JSON.stringify(vnavValues));
    // }

    // writeMonitorValues() {
    //     if (this._vnavTargetWaypoint) {
    //         WTDataStore.set('CJ4_vnavTargetWaypoint', this._vnavTargetWaypoint.ident);
    //     }
    // }

    buildGlidepath() {
        const approach = this._fpm.getApproachWaypoints();
        this._approachRunwayIndex = undefined;
        if (approach.length > 0) {
            const lastApproachWaypoint = approach[approach.length - 1];
            if (lastApproachWaypoint.isRunway) {
                //console.log("this.allWaypoints.indexOf(lastApproachWaypoint) " + this.allWaypoints.indexOf(lastApproachWaypoint));
                this._approachRunwayIndex = this.allWaypoints.indexOf(lastApproachWaypoint);
                let fafAltitude = undefined;
                let fafDistance = undefined;
                for (let i = approach.length - 2; i >= 0; i--) {
                    const waypoint = approach[i];
                    const distance = lastApproachWaypoint.cumulativeDistanceInFP - waypoint.cumulativeDistanceInFP;
                    if (waypoint.legAltitudeDescription > 0 && waypoint.legAltitudeDescription < 3 && waypoint.legAltitude1 > 0 && distance > 3) { // FAF
                        fafAltitude = waypoint.legAltitude1;
                        fafDistance = lastApproachWaypoint.cumulativeDistanceInFP - waypoint.cumulativeDistanceInFP;
                        break;
                    }
                }
                const altitudeDifference = fafAltitude - lastApproachWaypoint.legAltitude1;
                return AutopilotMath.calculateFPA(altitudeDifference, fafDistance);
            }
        }
        return undefined;
    }
}


/**
 * A definition for vertical waypoints.
 */
class VerticalWaypoint {
    constructor(index = undefined, ident = undefined, isClimb = false) {
        /** 
         * The waypoint's index in the lateral flight plan. 
         * @type {number}
         */
        this.indexInFlightPlan = index;

        /**
         * The ident of the vertical waypoint.
         * @type {string}
         */
        this.ident = ident;

        /**
         * The calculated flight path angle TO the waypoint.
         * @type {number}
         */
        this.waypointFPA = undefined;

        /**
         * The calculated flight plan target altitude for the waypoint.
         * @type {number}
         */
        this.waypointFPTA = undefined;

        /**
         * The highest altitude allowed at this vertical wapyoint.
         * @type {number}
         */
        this.upperConstraintAltitude = undefined;

        /**
         * The lowest altitude allowed at this vertical wapyoint.
         * @type {number}
         */
        this.lowerConstraintAltitude = undefined;

        /**
         * The FPA from the upper constraint altitude to the next fixed vnav target.
         * @type {number}
         */
        this.upperConstraintFPA = undefined;

        /**
         * The FPA from the lower constraint altitude to the next fixed vnav target.
         * @type {number}
         */
        this.lowerConstraintFPA = undefined;

        /**
         * The leg distance from the prior waypoint to this waypoint.
         * @type {number}
         */
        this.legDistanceTo = undefined;

        /**
         * Whether this waypoint is part of the climb or not.
         * @type {boolean}
         */
        this.isClimb = isClimb;

        /**
         * Whether this waypoint is an AT constraint.
         * @type {boolean}
         */
        this.isAtConstraint = false;

        /**
         * Whether this waypoint has a constraint.
         * @type {boolean}
         */
        this.hasConstraint = false;

        /**
         * Which vertical path segment is this waypoint part of.
         * @type {number}
         */
        this.segment = undefined;
    }
}

/**
 * A definition for vertical flight plan segments.
 */
class PathSegment {
    constructor(startIndex = undefined, targetIndex = undefined, fpa = undefined, distanceToNextTod = 0, segmentStartsLevel = false, segmentEndsLevel = false) {

        /**
         * The first waypoint index of this segment.
         * @type {number}
         */
        this.startIndex = startIndex;

        /**
         * The last waypoint index of this segment and the vertical target of this segment.
         * @type {number}
         */
        this.targetIndex = targetIndex;

        /**
        * The segment flight path angle (fpa).
        * @type {number}
        */
        this.fpa = fpa;

        /**
         * The distance from the end of this segment to the next TOD;
         * 0 if it is a continuous descent or at the end of the path.
         * @type {number}
         */
        this.distanceToNextTod = distanceToNextTod;

        /**
         * If the segment starts flat/with a TOD.
         * @type {boolean}
         */
        this.segmentStartsLevel = segmentStartsLevel;

        /**
         * If the segment ends flat/level.
         * @type {boolean}
         */
        this.segmentEndsLevel = segmentEndsLevel;
    }
}

/**
 * VNAV States.
 */
class VnavState { }
VnavState.NONE = 'NONE';
VnavState.PATH = 'PATH';
VnavState.DIRECT = 'DIRECT';
