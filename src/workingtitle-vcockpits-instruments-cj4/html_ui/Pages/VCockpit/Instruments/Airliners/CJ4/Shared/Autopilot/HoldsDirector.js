/** A class that manages lateral guidance for holds. */
class HoldsDirector {

  /** 
   * Creates an instance of a HoldsDirector.
   * @param {FlightPlanManager} fpm An instance of the flight plan manager.
   */
  constructor(fpm) {

    /** The flight plan manager. */
    this.fpm = fpm;

    /** The hold waypoint index. */
    this.holdWaypointIndex = -1;

    /** The current flight plan version. */
    this.currentFlightPlanVersion = 0;

    /** The current state of the holds director. */
    this.state = HoldsDirectorState.NONE;

    /**
     * The coordinates to hold at.
     * @type {LatLongAlt}
     */
    this.fixCoords = undefined;

    /**
     * The fix coordinates prior to the hold fix.
     * @type {LatLongAlt}
     */
    this.prevFixCoords = undefined;

    /** The inbound leg for the hold. */
    this.inboundLeg = [];

    /** The outbound leg for the hold. */
    this.outboundLeg = [];

    /** The parallel entry leg for the hold. */
    this.parallelLeg = [];

    /** The direction of the turn. */
    this.turnDirection = HoldTurnDirection.Right;

    SimVar.SetSimVarValue('L:WT_NAV_HOLD_INDEX', 'number', -1);
  }

  /**
   * Sets up the hold in the HoldsDirector.
   * @param {number} holdWaypointIndex The index of the waypoint for the hold.
   */
  initializeHold(holdWaypointIndex) {
    const holdWaypoint = this.fpm.getFlightPlan(0).getWaypoint(holdWaypointIndex);
    const prevWaypoint = this.fpm.getFlightPlan(0).getWaypoint(holdWaypointIndex - 2);

    if (holdWaypoint && prevWaypoint) {
      const holdDetails = holdWaypoint.holdDetails;
      const fixCoords = holdWaypoint.infos.coordinates;
      const prevFixCoords = prevWaypoint.infos.coordinates;

      const trackToHold = new LatLon(prevFixCoords.lat, prevFixCoords.long).finalBearingTo(new LatLon(fixCoords.lat, fixCoords.long));

      if (this.state === HoldsDirectorState.NONE || this.state === HoldsDirectorState.EXITED) {
        switch (holdDetails.entryType) {
          case HoldEntry.Direct:
            this.state = HoldsDirectorState.ENTRY_DIRECT_INBOUND;
            break;
          case HoldEntry.Teardrop:
            this.state = HoldsDirectorState.ENTRY_TEARDROP_INBOUND;
            break;
          case HoldEntry.Parallel:
            this.state = HoldsDirectorState.ENTRY_PARALLEL_INBOUND;
            break;
        }
      }
      
      this.fixCoords = fixCoords;
      this.prevFixCoords = prevFixCoords;

      const legFixes = HoldsDirector.calculateHoldFixes(fixCoords, holdDetails);
      this.inboundLeg = [legFixes[3], legFixes[0]];
      this.outboundLeg = [legFixes[1], legFixes[2]];
      this.parallelLeg = [legFixes[4], legFixes[5]];

      this.turnDirection = holdDetails.turnDirection;
    }
  }

  /**
   * Recalculates the hold with a new plane speed.
   * @param {AircraftState} planeState The current aircraft state. 
   */
  recalculateHold(planeState) {
    const holdWaypoint = this.fpm.getFlightPlan(0).getWaypoint(this.holdWaypointIndex);
    const holdDetails = Object.assign(new HoldDetails(), holdWaypoint.holdDetails);

    holdDetails.speed = planeState.groundSpeed;
    holdDetails.windDirection = planeState.windDirection;
    holdDetails.windSpeed = planeState.windSpeed;

    const windComponents = AutopilotMath.windComponents(holdDetails.holdCourse, planeState.windDirection, planeState.windSpeed);
    holdDetails.legDistance = ((holdDetails.speed + Math.abs(windComponents.headwind / 2)) / 3600) * holdDetails.legTime;

    this.fpm.addHoldAtWaypointIndex(this.holdWaypointIndex, holdDetails);
  }

  /** 
   * Updates the hold director.
   * @param {number} holdWaypointIndex The current waypoint index to hold at.
   */
  update(holdWaypointIndex) {
    const flightPlanVersion = SimVar.GetSimVarValue('L:WT.FlightPlan.Version', 'number');

    if (this.holdWaypointIndex !== holdWaypointIndex) {
      this.initializeHold(holdWaypointIndex);
      this.holdWaypointIndex = holdWaypointIndex;
    }

    if (flightPlanVersion !== this.currentFlightPlanVersion) {
      this.initializeHold(this.holdWaypointIndex);
      this.currentFlightPlanVersion = flightPlanVersion;
    }

    const planeState = LNavDirector.getAircraftState();
    switch (this.state) {
      case HoldsDirectorState.ENTRY_DIRECT_INBOUND:
        this.handleDirectEntry(planeState);
        break;
      case HoldsDirectorState.ENTRY_TEARDROP_INBOUND:
      case HoldsDirectorState.ENTRY_TEARDROP_OUTBOUND:
      case HoldsDirectorState.ENTRY_TEARDROP_TURNING:
        this.handleTeardropEntry(planeState);
        break;
      case HoldsDirectorState.ENTRY_PARALLEL_INBOUND:
      case HoldsDirectorState.ENTRY_PARALLEL_OUTBOUND:
      case HoldsDirectorState.ENTRY_PARALLEL_TURNING:
        this.handleParallelEntry(planeState);
        break;
      case HoldsDirectorState.INBOUND:
      case HoldsDirectorState.TURNING_OUTBOUND:
      case HoldsDirectorState.OUTBOUND:
      case HoldsDirectorState.TURNING_INBOUND:
        this.handleInHold(planeState);
        break;
      case HoldsDirectorState.EXITING:
        this.handleExitingHold(planeState);
        break;
    }

    const distanceRemaining = this.calculateDistanceRemaining(planeState);
    SimVar.SetSimVarValue("L:WT_CJ4_WPT_DISTANCE", "number", distanceRemaining);
  }

  /**
   * Handles the direct entry state.
   * @param {AircraftState} planeState The current aircraft state.
   */
  handleDirectEntry(planeState) {
    const dtk = AutopilotMath.desiredTrack(this.prevFixCoords, this.fixCoords, planeState.position);

    if (this.isAbeam(dtk, planeState.position, this.fixCoords)) {
      this.recalculateHold(planeState);
      this.cancelAlert();

      SimVar.SetSimVarValue('L:WT_NAV_HOLD_INDEX', 'number', this.holdWaypointIndex);
      this.state = HoldsDirectorState.TURNING_OUTBOUND;
    }
    else {
      this.alertIfClose(planeState, this.fixCoords);
      this.trackLeg(this.prevFixCoords, this.fixCoords, planeState);
    }
  }

  /**
   * Handles the teardrop entry state.
   * @param {AircraftState} planeState The current aircraft state.
   */
  handleTeardropEntry(planeState) {
    if (this.state === HoldsDirectorState.ENTRY_TEARDROP_INBOUND) {
      const dtk = AutopilotMath.desiredTrack(this.prevFixCoords, this.fixCoords, planeState.position);

      if (this.isAbeam(dtk, planeState.position, this.fixCoords)) {
        this.recalculateHold(planeState);
        this.cancelAlert();
  
        SimVar.SetSimVarValue('L:WT_NAV_HOLD_INDEX', 'number', this.holdWaypointIndex);
        this.state = HoldsDirectorState.OUTBOUND;
      }
      else {
        this.alertIfClose(planeState, this.fixCoords);
        this.trackLeg(this.prevFixCoords, this.fixCoords, planeState);
      }
    }
  }

  /**
   * Handles the teardrop entry state.
   * @param {AircraftState} planeState The current aircraft state.
   */
  handleParallelEntry(planeState) {

    if (this.state === HoldsDirectorState.ENTRY_PARALLEL_INBOUND) {
      const dtk = AutopilotMath.desiredTrack(this.prevFixCoords, this.fixCoords, planeState.position);

      if (this.isAbeam(dtk, planeState.position, this.fixCoords)) {
        this.recalculateHold(planeState);
        this.cancelAlert();
  
        SimVar.SetSimVarValue('L:WT_NAV_HOLD_INDEX', 'number', this.holdWaypointIndex);
        this.state = HoldsDirectorState.ENTRY_PARALLEL_OUTBOUND;
      }
      else {
        this.alertIfClose(planeState, this.fixCoords);
        this.trackLeg(this.prevFixCoords, this.fixCoords, planeState);
      }
    }
    
    if (this.state === HoldsDirectorState.ENTRY_PARALLEL_OUTBOUND) {
      const dtk = AutopilotMath.desiredTrack(this.parallelLeg[0], this.parallelLeg[1], planeState.position);

      if (this.isAbeam(dtk, planeState.position, this.parallelLeg[1])) {
        this.state = HoldsDirectorState.INBOUND;
      }
      else {
        this.trackLeg(this.parallelLeg[0], this.parallelLeg[1], planeState);
      }
    }
  }

  /**
   * Handles the in-hold state.
   * @param {AircraftState} planeState The current aircraft state.
   */
  handleInHold(planeState) {
    if (this.state === HoldsDirectorState.TURNING_OUTBOUND) {
      const dtk = AutopilotMath.desiredTrack(this.outboundLeg[0], this.outboundLeg[1], planeState.position);

      if (this.isAbeam(dtk, planeState.position, this.outboundLeg[0])) {
        this.state = HoldsDirectorState.OUTBOUND;
      }
      else {
        this.trackArc(this.inboundLeg[1], this.outboundLeg[0], planeState);
        this.trackLeg(this.outboundLeg[0], this.outboundLeg[1], planeState, false);
      }
    }

    if (this.state === HoldsDirectorState.OUTBOUND) {
      const dtk = AutopilotMath.desiredTrack(this.outboundLeg[0], this.outboundLeg[1], planeState.position);

      if (this.isAbeam(dtk, planeState.position, this.outboundLeg[1])) {
        this.state = HoldsDirectorState.TURNING_INBOUND;
      }
      else {
        this.trackLeg(this.outboundLeg[0], this.outboundLeg[1], planeState);
      }
    }

    if (this.state === HoldsDirectorState.TURNING_INBOUND) {
      const dtk = AutopilotMath.desiredTrack(this.inboundLeg[0], this.inboundLeg[1], planeState.position);

      if (this.isAbeam(dtk, planeState.position, this.inboundLeg[0])) {
        this.state = HoldsDirectorState.INBOUND;
      }
      else {
        this.trackArc(this.outboundLeg[1], this.inboundLeg[0], planeState);
        this.trackLeg(this.inboundLeg[0], this.inboundLeg[1], planeState, false);
      }
    }

    if (this.state === HoldsDirectorState.INBOUND) {
      const dtk = AutopilotMath.desiredTrack(this.inboundLeg[0], this.inboundLeg[1], planeState.position);

      if (this.isAbeam(dtk, planeState.position, this.inboundLeg[1])) {
        this.recalculateHold(planeState);
        this.cancelAlert();

        this.state = HoldsDirectorState.TURNING_OUTBOUND;
      }
      else {
        this.trackLeg(this.inboundLeg[0], this.inboundLeg[1], planeState);
        this.alertIfClose(planeState, this.inboundLeg[1]);
      } 
    }
  }

  /**
   * Activates the waypoint alert if close enough to the provided fix.
   * @param {AircraftState} planeState The current aircraft state.
   * @param {LatLongAlt} fix The fix to alert for.
   */
  alertIfClose(planeState, fix) {
    const alertDistance = 3 * (planeState.groundSpeed / 3600);
    const fixDistance = Avionics.Utils.computeGreatCircleDistance(planeState.position, fix);

    if (fixDistance <= alertDistance) {
      SimVar.SetSimVarValue('L:WT_CJ4_WPT_ALERT', 'number', 1);
    }
  }

  /**
   * Cancels the waypoint alert.
   */
  cancelAlert() {
    SimVar.SetSimVarValue('L:WT_CJ4_WPT_ALERT', 'number', 0);
  }

  /**
   * Handles the exiting state.
   * @param {AircraftState} planeState The current aircraft state. 
   */
  handleExitingHold(planeState) {
    const dtk = AutopilotMath.desiredTrack(this.inboundLeg[0], this.inboundLeg[1], planeState.position);

    if (this.isAbeam(dtk, planeState.position, this.inboundLeg[1])) {
      this.cancelAlert();
      SimVar.SetSimVarValue('L:WT_NAV_HOLD_INDEX', 'number', -1);

      this.state = HoldsDirectorState.EXITED;
    }
    else {
      this.alertIfClose(planeState, this.inboundLeg[1]);
      this.trackLeg(this.inboundLeg[0], this.inboundLeg[1], planeState);
    }
  }

  /**
   * Tracks the specified leg.
   * @param {LatLongAlt} legStart The coordinates of the start of the leg.
   * @param {LatLongAlt} legEnd The coordinates of the end of the leg.
   * @param {AircraftState} planeState The current aircraft state.
   * @param {boolean} execute Whether or not to execute the calculated course.
   */
  trackLeg(legStart, legEnd, planeState, execute = true) {
    const dtk = AutopilotMath.desiredTrack(legStart, legEnd, planeState.position);
    const xtk = AutopilotMath.crossTrack(legStart, legEnd, planeState.position);

    const distanceRemaining = Avionics.Utils.computeGreatCircleDistance(planeState.position, legEnd);
    const correctedDtk = GeoMath.correctMagvar(dtk, SimVar.GetSimVarValue("MAGVAR", "degrees"));

    SimVar.SetSimVarValue("L:WT_CJ4_XTK", "number", xtk);
    SimVar.SetSimVarValue("L:WT_CJ4_DTK", "number", correctedDtk);

    const interceptAngle = AutopilotMath.interceptAngle(xtk, NavSensitivity.NORMAL);
    const bearingToWaypoint = Avionics.Utils.computeGreatCircleHeading(planeState.position, legEnd);
    const deltaAngle = Math.abs(Avionics.Utils.angleDiff(dtk, bearingToWaypoint));

    const headingToSet = deltaAngle < Math.abs(interceptAngle) ? AutopilotMath.normalizeHeading(dtk + interceptAngle) : bearingToWaypoint;

    if (distanceRemaining > 1 && execute) {
      HoldsDirector.setCourse(headingToSet, planeState);
    }
  }

  /**
   * Tracks an arc leg.
   * @param {LatLongAlt} legStart The start of the leg.
   * @param {LatLongAlt} legEnd The end of the leg.
   * @param {AircraftState} planeState The state of the aircraft.
   */
  trackArc(legStart, legEnd, planeState) {
    let dtk = AutopilotMath.desiredTrackArc(legStart, legEnd, planeState.position);
    if (this.turnDirection === HoldTurnDirection.Left) {
      dtk = AutopilotMath.normalizeHeading(dtk + 180);
    }

    let xtk = AutopilotMath.crossTrackArc(legStart, legEnd, planeState.position);
    let interceptScalar = 0;
    if (this.turnDirection === HoldTurnDirection.Left) {
      xtk = -1 * xtk;
      interceptScalar = Math.sign(xtk) === 1 ? 2 : .25;
    }
    else {
      interceptScalar = Math.sign(xtk) === -1 ? 2 : .25;
    }

    const interceptAngle = AutopilotMath.interceptAngle(xtk, NavSensitivity.APPROACHLPV, 35) * interceptScalar;
    HoldsDirector.setCourse(AutopilotMath.normalizeHeading(dtk + interceptAngle), planeState);
  }

  /**
   * Calculates whether or not the aircraft is abeam the provided leg end.
   * @param {number} dtk The desired track along the leg.
   * @param {LatLongAlt} planePosition The current position of the aircraft. 
   * @param {LatLongAlt} fixCoords The coordinates of the leg end fix.
   */
  isAbeam(dtk, planePosition, fixCoords) {
    const planeToFixTrack = Avionics.Utils.computeGreatCircleHeading(planePosition, fixCoords);
    const trackDiff = Math.abs(Avionics.Utils.angleDiff(dtk, planeToFixTrack));

    return trackDiff > 91;
  }

  /**
   * Exits the active hold.
   */
  exitActiveHold() {
    this.state = HoldsDirectorState.EXITING;
  }

  /**
   * Cancels exiting the hold at the hold fix.
   */
  cancelHoldExit() {
    this.state = HoldsDirectorState.INBOUND;
  }

  /**
   * Calculates the distance remaining to the hold fix.
   * @param {AircraftState} planeState The current aircraft state.
   * @returns {number} The distance remaining to the hold fix, in NM. 
   */
  calculateDistanceRemaining(planeState) {
    const holdWaypoint = this.fpm.getFlightPlan(0).getWaypoint(this.holdWaypointIndex);
    const legDistance = holdWaypoint.holdDetails.legDistance;
    const turnDistance = Avionics.Utils.computeGreatCircleDistance(this.inboundLeg[1], this.outboundLeg[0]) * Math.PI;

    let distance = (2 * legDistance) + turnDistance;
    if (this.state === HoldsDirectorState.TURNING_OUTBOUND) {
      return distance + AutopilotMath.distanceAlongArc(this.inboundLeg[1], this.outboundLeg[0], planeState.position);
    }

    distance -= legDistance;
    if (this.state === HoldsDirectorState.OUTBOUND) {
      return distance + Avionics.Utils.computeGreatCircleDistance(planeState.position, this.outboundLeg[1]);
    }

    distance -= turnDistance;
    if (this.state === HoldsDirectorState.TURNING_INBOUND) {
      return distance + AutopilotMath.distanceAlongArc(this.outboundLeg[1], this.inboundLeg[0], planeState.position);
    }

    return Avionics.Utils.computeGreatCircleDistance(planeState.position, this.inboundLeg[1]);
  }

  /**
   * Checks whether the holds director is ready to accept a new hold fix
   * or is curently entering the fix at the provided waypoint index.
   * @param {number} index The waypoint index to check against.
   * @returns {boolean} True if active, false otherwise. 
   */
  isReadyOrEntering(index) {
    return this.state === HoldsDirectorState.NONE
    || this.state === HoldsDirectorState.EXITED
    || (
      this.holdWaypointIndex === index
        && (
          this.state === HoldsDirectorState.ENTRY_TEARDROP_INBOUND
          || this.state === HoldsDirectorState.ENTRY_PARALLEL_INBOUND
          || this.state === HoldsDirectorState.ENTRY_DIRECT_INBOUND
        )
    );
  }

  /**
   * Whether or not the current waypoint index is in active hold.
   * @param {number} index The waypoint index to check against.
   * @returns {boolean} True if active, false otherwise.
   */
  isHoldActive(index) {
    return this.holdWaypointIndex === index
      && this.state !== HoldsDirectorState.NONE
      && this.state !== HoldsDirectorState.EXITED
      && this.state !== HoldsDirectorState.ENTRY_TEARDROP_INBOUND
      && this.state !== HoldsDirectorState.ENTRY_PARALLEL_INBOUND
      && this.state !== HoldsDirectorState.ENTRY_DIRECT_INBOUND;
  }

  /**
   * Whether or not the current hold is exiting.
   * @param {number} index The waypoint index to check against.
   * @returns {boolean} True if exiting, false otherwise.
   */
  isHoldExiting(index) {
    return this.holdWaypointIndex === index && this.state === HoldsDirectorState.EXITING;
  }

  /**
   * Whether or not the current hold has exited.
   * @param {number} index The waypoint index to check against.
   * @returns {boolean} True if exiting, false otherwise.
   */
  isHoldExited(index) {
    return this.holdWaypointIndex === index && this.state === HoldsDirectorState.EXITED;
  }

  /**
   * Calculates a hold entry state given the hold course and current
   * inbound course. See FMS guide page 14-21.
   * @param {number} holdCourse The course that the hold will be flown with.
   * @param {number} inboundCourse The course that is being flown towards the hold point.
   * @returns {string} The hold entry state for a given set of courses.
   */
  static calculateEntryState(holdCourse, inboundCourse) {
    const courseDiff = Avionics.Utils.angleDiff(holdCourse, inboundCourse);
    if (courseDiff >= -130 && courseDiff <= 70) {
      return HoldsDirectorState.ENTRY_DIRECT_INBOUND;
    }
    else if (courseDiff < -130 && courseDiff > 175) {
      return HoldsDirectorState.ENTRY_TEARDROP_INBOUND;
    }
    else {
      return HoldsDirectorState.ENTRY_DIRECT_INBOUND;
    }
  }

  /**
   * Calculates the hold legs from the provided hold course and airspeed.
   * @param {LatLongAlt} holdFixCoords The coordinates of the hold fix.
   * @param {HoldDetails} holdDetails The details of the hold.
   * @returns {LatLongAlt[]} The four hold corner positions calculated, clockwise starting with the hold fix coordinates, plus 2
   * parallel leg fixes.
   */
  static calculateHoldFixes(holdFixCoords, holdDetails) {
    let holdCourse = holdDetails.holdCourse;
    if (!holdDetails.isHoldCourseTrue) {
        const magVar = GeoMath.getMagvar(holdFixCoords.lat, holdFixCoords.long);
        holdCourse = GeoMath.removeMagvar(holdCourse, magVar);
    }

    const windComponents = AutopilotMath.windComponents(holdCourse, holdDetails.windDirection, holdDetails.windSpeed);
    const turnRadius = AutopilotMath.turnRadius(holdDetails.speed + Math.abs(windComponents.crosswind), 25);

    const turnDirection = holdDetails.turnDirection === HoldTurnDirection.Right ? 1 : -1;

    const outboundStart = Avionics.Utils.bearingDistanceToCoordinates(AutopilotMath.normalizeHeading(holdCourse + (turnDirection * 90)), turnRadius * 2,
      holdFixCoords.lat, holdFixCoords.long);

    const outboundEnd = Avionics.Utils.bearingDistanceToCoordinates(AutopilotMath.normalizeHeading(holdCourse + (turnDirection * 180)), holdDetails.legDistance,
      outboundStart.lat, outboundStart.long);

    const inboundStart = Avionics.Utils.bearingDistanceToCoordinates(AutopilotMath.normalizeHeading(holdCourse + (turnDirection * 180)), holdDetails.legDistance,
      holdFixCoords.lat, holdFixCoords.long);

    const parallelStart = Avionics.Utils.bearingDistanceToCoordinates(AutopilotMath.normalizeHeading(holdCourse + (turnDirection * -90)), 1,
      holdFixCoords.lat, holdFixCoords.long);

    const parallelEnd = Avionics.Utils.bearingDistanceToCoordinates(AutopilotMath.normalizeHeading(holdCourse + (turnDirection * 180)), holdDetails.legDistance,
      parallelStart.lat, parallelStart.long);

    return [holdFixCoords, outboundStart, outboundEnd, inboundStart, parallelStart, parallelEnd];
  }

  /**
   * Sets the autopilot course to fly.
   * @param {number} degreesTrue The track in degrees true for the autopilot to fly.
   * @param {AircraftState} planeState The current state of the aircraft.
   */
  static setCourse(degreesTrue, planeState) {
    const currWindDirection = GeoMath.removeMagvar(planeState.windDirection, planeState.magVar);

    const windCorrection = AutopilotMath.windCorrectionAngle(degreesTrue, planeState.trueAirspeed, currWindDirection, planeState.windSpeed);

    let targetHeading = AutopilotMath.normalizeHeading(degreesTrue - windCorrection);
    targetHeading = GeoMath.correctMagvar(targetHeading, planeState.magVar);

    Coherent.call("HEADING_BUG_SET", 2, targetHeading);
  }
}

class HoldsDirectorState { }
HoldsDirectorState.NONE = 'NONE';
HoldsDirectorState.ENTRY_DIRECT_INBOUND = 'ENTRY_DIRECT_INBOUND';
HoldsDirectorState.ENTRY_TEARDROP_INBOUND = 'ENTRY_TEARDROP_INBOUND';
HoldsDirectorState.ENTRY_TEARDROP_OUTBOUND = 'ENTRY_TEARDROP_OUTBOUND';
HoldsDirectorState.ENTRY_TEARDROP_TURNING = 'ENTRY_TEARDROP_TURNING';
HoldsDirectorState.ENTRY_PARALLEL_INBOUND = 'ENTRY_PARALLEL_INBOUND';
HoldsDirectorState.ENTRY_PARALLEL_OUTBOUND = 'ENTRY_PARALLEL_OUTBOUND';
HoldsDirectorState.ENTRY_PARALLEL_TURNING = 'ENTRY_PARALLEL_TURNING';
HoldsDirectorState.TURNING_OUTBOUND = 'TURNING_OUTBOUND';
HoldsDirectorState.OUTBOUND = 'OUTBOUND';
HoldsDirectorState.TURNING_INBOUND = 'TURNING_INBOUND';
HoldsDirectorState.INBOUND = 'INBOUND';
HoldsDirectorState.EXITING = 'EXITING';
HoldsDirectorState.EXITED = 'EXITED';
