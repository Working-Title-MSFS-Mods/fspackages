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
         * The nav mode selector
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
        this._destination = undefined;
        
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
         * The flight plan version from which the vertical flight plan built.
         * @type {number}
         */
        this._verticalFlightPlanVersion = undefined;

        /**
         * The waypoint index for the next constraint.
         * @type {number}
         */
        this._activeConstraintIndex = undefined;

        /**
         * The next constraint altitude in feet.
         * @type {number}
         */
        this._activeConstraintAltitude = undefined;

        /**
         * The furthest distance away to show a constraint on the PFD.
         * @type {number}
         */
        this._distanceToShowConstraint = 40;

        /**
         * The vertical direct target waypoint.
         * @type {VerticalWaypoint}
         */
        this._verticalDirectWaypoint = undefined;

        /**
         * The current VNAV state.
         * 
         */
        this._vnavState = VnavState.NONE;
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

    /**
     * The active flight plan.
     * @type {ManagedFlightPlan}
     */
    get flightplan() {
        return this._fpm.getFlightPlan(0);
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

        this.update();
    }

    /**
     * Update data if needed.
     */
    update() {

        if (this._verticalFlightPlanVersion != this._fpm.flightPlanVersion) {
            this._destination = this._fpm.getDestination();
        }
        this._activeWaypoint = this.flightplan.waypoints[this.flightplan.activeWaypointIndex];
        this._currentFlightSegment = this._fpm.getSegmentFromWaypoint(this._activeWaypoint);

        //CAN VNAV EVEN RUN?
        if (this._destination && this.waypoints && this.waypoints.length > 0 && this._activeWaypoint) {
            this._vnavCalculating = true;
            this._currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
            this._activeWaypointDist = Avionics.Utils.computeDistance(this._currPos, this._activeWaypoint.infos.coordinates);
            this._currentDistanceInFP = this._activeWaypoint.cumulativeDistanceInFP - this._activeWaypointDist;

            if (this._verticalFlightPlanVersion != this._fpm.flightPlanVersion) {
                switch(this._vnavState) {
                    case VnavState.NONE:
                    case VnavState.PATH:
                        this.setVnavState(this.buildVerticalFlightPlan());
                        break;
                    case VnavState.DIRECT:
                        const directWaypoint = this.allWaypoints.find(w => { return (w && w.ident === this._verticalDirectWaypoint.ident) });
                        const directWaypointIndex = this.allWaypoints.indexOf(directWaypoint);
                        this.activateVerticalDirectTo(directWaypointIndex, this._verticalDirectWaypoint.waypointFPTA);
                }
                if (this._fpm.isLoadedApproach()) {
                    this._approachGlidePath = this.buildGlidepath();

                } else {this._approachGlidePath = undefined;}
            }

            this.manageConstraints();
            this.calculateTod();
        }
    }

    getFirstApproachWaypointIndex() {
        const approach = this._fpm.getApproachWaypoints();
        if (approach && approach.length > 0) {
            return this.allWaypoints.indexOf(approach[0]);
        }
        return undefined;
    }

    setVnavState(state = VnavState.NONE) {
        this._vnavState = state;
    }

    activateVerticalDirectTo(targetIndex, altitude) {
        const distanceToTarget = this.allWaypoints[targetIndex].cumulativeDistanceInFP - this._currentDistanceInFP;
        const descentRequired = this.indicatedAltitude - altitude;
        const fpa = AutopilotMath.calculateFPA(descentRequired, distanceToTarget);
        setVnavState(buildVerticalFlightPlan(true, targetIndex, altitude, fpa));
    }

    cancelVerticalDirectTo() {
        this._verticalDirectWaypoint = undefined;
        this._pathExists = buildVerticalFlightPlan();
    }

    buildVerticalFlightPlan(verticalDirect = false, vDirectTargetIndex, vDirectAltitude, vDirectFpa) {
        this._verticalFlightPlanVersion = this._fpm.flightPlanVersion;
        this._verticalFlightPlan = [];
        const waypointCount = this.allWaypoints.length;
        let lastClimbIndex = 0;
        let firstApproachWaypointIndex = this.getFirstApproachWaypointIndex();
       
        for (let i = 0; i < waypointCount; i++) { //Assemble this._verticalFlightPlan
            const isClimb = this._fpm.getSegmentFromWaypoint(this.allWaypoints[i]).type === SegmentType.Departure;
            const constraints = this.parseConstraints(this.allWaypoints[i]);
            const vwp = new VerticalWaypoint(i, this.allWaypoints[i].ident, isClimb);
            vwp.legDistanceTo = i > 0 ? this.allWaypoints[i].cumulativeDistanceInFP - this.allWaypoints[i - 1].cumulativeDistanceInFP : 0;
            vwp.upperConstraintAltitude = constraints.upperConstraint;
            vwp.lowerConstraintAltitude = constraints.lowerConstraint;
            vwp.isAtConstraint = constraints.isAtConstraint;
            if (firstApproachWaypointIndex !== undefined && i >= firstApproachWaypointIndex && vwp.lowerConstraintAltitude > 0) {
                vwp.upperConstraintAltitude = constraints.lowerConstraint;
                vwp.isAtConstraint = true;
                firstApproachWaypointIndex = undefined;
            }
            if (verticalDirect && i <= vDirectTargetIndex) {
                switch(i) {
                    case vDirectTargetIndex:
                        vwp.upperConstraintAltitude = vDirectAltitude;
                        vwp.lowerConstraintAltitude = vDirectAltitude;
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
            lastClimbIndex = isClimb ? i : lastClimbIndex;
        }
        
        this._verticalFlightPlanSegments = [];
        let segment = this._verticalFlightPlanSegments.length;
        let nextSegmentEndIndex = undefined;
        for (let j = waypointCount - 1; j > lastClimbIndex; j--) { //Build Path Segments
            if (verticalDirect && j === vDirectTargetIndex) {
                this._verticalFlightPlan[j].waypointFPTA = this._verticalFlightPlan[j].lowerConstraintAltitude;
                this._verticalFlightPlanSegments.push(this.buildVerticalSegment(segment, j, vDirectFpa));
                j = this._verticalFlightPlanSegments[segment].segmentStartIndex;
                segment++;
            }
            else if (segment === 0 && this._verticalFlightPlan[j].isAtConstraint && this._verticalFlightPlan[j].segment === undefined) { //Segments ex
                this._verticalFlightPlan[j].waypointFPTA = this._verticalFlightPlan[j].lowerConstraintAltitude;
                this._verticalFlightPlanSegments.push(this.buildVerticalSegment(segment, j));
                j = 0;
                segment++;
            }
            else if (segment > 0 && this._verticalFlightPlan[j].segment === undefined && this._verticalFlightPlan[j].waypointFPTA != undefined) {
                this._verticalFlightPlanSegments.push(this.buildVerticalSegment(segment, j));
                j = this._verticalFlightPlanSegments[segment].segmentStartIndex;
                segment++;
            }
        }
        this._firstPossibleDescentIndex = lastClimbIndex + 1;
        this._firstPathSegment = this._verticalFlightPlanSegments.length - 1;
        const isPath = segment === 0 & nextSegmentEndIndex === undefined ? false : true;
        const state = verticalDirect ? VnavState.DIRECT : isPath ? VnavState.PATH : VnavState.NONE;
        return state;
    }

    buildVerticalSegment(segment, endingIndex, inputFPA = this.vnavTargetFPA) {
        const vwp = this._verticalFlightPlan[endingIndex];
        let segmentMaxFPA = 6;
        let segmentMinFPA = 1;
        let segmentStartIndex = endingIndex;
        let lateralDistance = vwp.legDistanceTo;
        let bestFPA = inputFPA;
        let segmentIsFirst = false;
        for (let k = j - 1; k >= 0; k--) {
            const wptToEvaluate = this._verticalFlightPlan[k];
            const altToUpperConstraint = wptToEvaluate.upperConstraintAltitude - vwp.waypointFPTA;
            const altToLowerConstraint = wptToEvaluate.lowerConstraintAltitude - vwp.waypointFPTA;
            if (wptToEvaluate.isClimb) {
                segmentIsFirst = true;
                break;
            }
            else if (!wptToEvaluate.isAtConstraint) {
                const maxFPA = altToUpperConstraint < Infinity ? AutopilotMath.calculateFPA(altToUpperConstraint, lateralDistance) : 6;
                const minFPA = altToLowerConstraint > 0 ? AutopilotMath.calculateFPA(altToLowerConstraint, lateralDistance) : 0;
                if (maxFPA < segmentMinFPA) {
                    bestFPA = segmentMinFPA;
                    break;
                }
                if (minFPA > segmentMaxFPA) {
                    bestFPA = segmentMaxFPA;
                    break;
                }
                segmentMaxFPA = maxFPA < segmentMaxFPA ? maxFPA : segmentMaxFPA;
                segmentMinFPA = minFPA > segmentMinFPA ? minFPA : segmentMinFPA;
                segmentStartIndex = k;
                lateralDistance = lateralDistance + wptToEvaluate.legDistanceTo;
            }
            else {
                const fpa = AutopilotMath.calculateFPA(altToLowerConstraint, lateralDistance);
                if (fpa >= segmentMaxFPA) {
                    bestFPA = segmentMaxFPA;
                    break;
                }
                if (fpa <= segmentMinFPA) {
                    bestFPA = segmentMinFPA
                    break;
                }
                segmentMaxFPA = fpa;
                segmentMinFPA = fpa;
                segmentStartIndex = k;
                lateralDistance = lateralDistance + wptToEvaluate.legDistanceTo;
            }
        }
        for (let l = segmentStartIndex + 1; l <= endingIndex; l++) {
            this._verticalFlightPlan[l].segment = segment;
            this._verticalFlightPlan[l].waypointFPA = bestFPA;
        }
        switch(segmentIsFirst) {
            case true:
                break;
            case false:
                this._verticalFlightPlan[segmentStartIndex].waypointFPTA = AutopilotMath.calculateFPTA(bestFPA, lateralDistance);
        }
        return new PathSegment(segmentStartIndex + 1, endingIndex, bestFPA);
    }


    parseConstraints(waypoint) {
        const constraints = {
            upperConstraint: Infinity,
            lowerConstraint: 0,
            isAtConstraint: false
        }
        switch(waypoint.legAltitudeDescription) {
            case 1:
                constraints.upperConstraint = Math.floor(waypoint.legAltitude1);
                constraints.lowerConstraint = Math.floor(waypoint.legAltitude1);
                constraints.isAtConstraint = true;
                break;
            case 2:
                constraints.lowerConstraint = Math.floor(waypoint.legAltitude1);
                break;
            case 3:
                constraints.upperConstraint = Math.floor(waypoint.legAltitude1);
                break;
            case 4:
                constraints.lowerConstraint = Math.floor(waypoint.legAltitude2);
                constraints.upperConstraint = Math.floor(waypoint.legAltitude1);
                break;
        }
        return constraints;
    }

    /**
    * Set the constraint altitude.
    */
    getConstraintAltitude() {
        //SET CURRENT CONSTRAINT ALTITUDE SIMVAR -- This only needs to run when active waypoint changes
        let constraint = undefined;
        if (this._verticalFlightPlan[this._activeWaypointIndex].isClimb) {
            for (let i = this._activeWaypointIndex; i < this._firstPossibleDescentIndex - 1; i++) {
                if (this._verticalFlightPlan[i].upperConstraintAltitude) {
                    constraint = this._verticalFlightPlan[i].upperConstraintAltitude;
                    this._activeConstraintIndex = i;
                    break;
                }
            }
        } else {
            for (let i = this._activeWaypointIndex; i < this._verticalFlightPlan.length; i++) {
                if (this._verticalFlightPlan[i].lowerConstraintAltitude) {
                    constraint = this._verticalFlightPlan[i].lowerConstraintAltitude;
                    this._activeConstraintIndex = i;
                    break;
                }
            }
        }
        return Math.floor(constraint);
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
        if (this.flightplan.activeWaypointIndex > this._activeConstraintIndex) {
            this._activeConstraintAltitude = this.getConstraintAltitude();
        }

        if (this._activeConstraintIndex >= this.flightplan.activeWaypointIndex) {
            if (this._activeConstraintAltitude != parseInt(this.constraintValue) && !waypoints[this._activeConstraintIndex].isRunway) {
                if (waypoints[this._activeConstraintIndex].cumulativeDistanceInFP - this._currentDistanceInFP < this._distanceToShowConstraint) {
                    this.setConstraint(this._activeConstraintAltitude);
                } else {
                    this.setConstraint();
                }
            }
            else if (waypoints[this._activeConstraintIndex].isRunway && waypoints[this._activeConstraintIndex].ident != this.constraintValue) {
                if (waypoints[this._activeConstraintIndex].isRunway && this._activeConstraintIndex > 1
                    && waypoints[this._activeConstraintIndex].cumulativeDistanceInFP - this._currentDistanceInFP < this._distanceToShowConstraint) {
                    this.setConstraint(waypoints[this._activeConstraintIndex].ident);
                } else {
                    this.setConstraint();
                }
            }
        } else {
            this.setConstraint();
        }
    }

    trackApproachGlidepath() {
        const runwayDistance = Avionics.Utils.computeDistance(this._currPos, this.waypoints[this._approachRunwayIndex].infos.coordinates);
        const runwayAltitude = this._verticalFlightPlan[this._approachRunwayIndex].lowerConstraintAltitude;
        const desiredAltitude = runwayAltitude + AutopilotMath.calculateFPTA(this._approachGlidePath, runwayDistance);
        SimVar.SetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet", (this.gpsAltitude - desiredAltitude));
        return this.gpsAltitude - desiredAltitude;
    }

    trackPath() {
        const currentPathSegment = this._verticalFlightPlan[this.flightplan.activeWaypointIndex].segment;
        const flightPathTarget = this._verticalFlightPlanSegments[currentPathSegment].targetIndex;
        const fpta = this._verticalFlightPlan[flightPathTarget].waypointFPTA;
        const fpa = this._verticalFlightPlanSegments[currentPathSegment].fpa;
        const distance = this.waypoints[flightPathTarget].cumulativeDistanceInFP - this._currentDistanceInFP;
        const desiredAltitude = fpta + AutopilotMath.calculateFPTA(fpa, distance);
        SimVar.SetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet", (this.indicatedAltitude - desiredAltitude));
        return this.indicatedAltitude - desiredAltitude;
    }

    calculateTod() {
        let todExists = false;
        let altitude = undefined;
        let fpta = undefined;
        let fpa = undefined;
        let todDistanceInFP = undefined;
        if (this.flightplan.activeWaypointIndex < this._firstPossibleDescentIndex) {
            altitude = this._fmc.cruiseFlightLevel * 100;
            fpta = this._verticalFlightPlan[this._verticalFlightPlanSegments[this._firstPathSegment].targetIndex].waypointFPTA;
            fpa = this._verticalFlightPlanSegments[this._firstPathSegment].fpa;
            descentDistance = AutopilotMath.calculateDescentDistance(fpa, altitude - fpta);
            todDistanceInFP = this.waypoints[this._verticalFlightPlanSegments[this._firstPathSegment].targetIndex].cumulativeDistanceInFP - descentDistance;
            todExists = true;
        }
        else if (this._verticalFlightPlan[this.flightplan.activeWaypointIndex].segment === undefined) {
            todExists = false;
        }
        else if (this.flightplan.activeWaypointIndex >= this._firstPossibleDescentIndex) {
            altitude = this.indicatedAltitude;
            const currentSegment = this._verticalFlightPlan[this.flightplan.activeWaypointIndex].segment;
            fpta = this._verticalFlightPlan[this._verticalFlightPlanSegments[currentSegment].targetIndex].waypointFPTA;
            fpa = this._verticalFlightPlanSegments[currentSegment].fpa;
            descentDistance = AutopilotMath.calculateDescentDistance(fpa, altitude - fpta);
            todDistanceInFP = this.waypoints[this._verticalFlightPlanSegments[this._firstPathSegment].targetIndex].cumulativeDistanceInFP - descentDistance;
            todExists = true;
        }
        if (todExists) {
            this.setTodWaypoint(true, todDistanceInFP)
        } else {
            this.setTodWaypoint();
        }
    }

    setTodWaypoint(calculate = false, todDistanceInFP) {
        if (calculate === true) {
            const todDistanceFromDest = this._destination.cumulativeDistanceInFP - todDistanceInFP;
            const todDistanceFromCurrPos = todDistanceInFP < this._currentDistanceInFP ? 0 : todDistanceInFP - this._currentDistanceInFP;
            SimVar.SetSimVarValue("L:WT_CJ4_TOD_DISTANCE", "number", todDistanceFromDest);
            SimVar.SetSimVarValue("L:WT_CJ4_TOD_REMAINING", "number", todDistanceFromCurrPos);
        }
        else {
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
                this._approachRunwayIndex = this.waypoints.indexOf(lastApproachWaypoint);
                let fafAltitude = undefined;
                let fafDistance = undefined;
                for (let i = approach.length - 2; i >= 0; i--) {
                    const waypoint = approach[i];
                    const distance = lastApproachWaypoint.cumulativeDistanceInFP - waypoint.cumulativeDistanceInFP;
                    if (waypoint.legAltitudeDescription > 0 && altDesc < 3 && waypoint.legAltitude1 > 0 && distance > 3) { // FAF
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
    constructor(startIndex = undefined, targetIndex = undefined, fpa = undefined) {
        
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
    }
}

class VnavState { }
VnavState.NONE = 'NONE';
VnavState.PATH = 'PATH';
VnavState.DIRECT = 'DIRECT';
