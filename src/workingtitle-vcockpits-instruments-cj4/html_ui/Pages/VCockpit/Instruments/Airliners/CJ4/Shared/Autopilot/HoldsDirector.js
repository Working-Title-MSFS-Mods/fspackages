/** A class that manages lateral guidance for holds. */
class HoldsDirector {

  /** 
   * Creates an instance of a HoldsDirector.
   * @param {FlightPlanManager} fpm An instance of the flight plan manager.
   * @param {number} holdWaypointIndex The index of the waypoint to hold at.
   */
  constructor(fpm, holdWaypointIndex) {

    /** The flight plan manager. */
    this.fpm = fpm;

    /** The hold waypoint index. */
    this.holdWaypointIndex = holdWaypointIndex;

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
  }

  /**
   * Sets up the hold in the HoldsDirector.
   */
  initializeHold() {
    const holdWaypoint = this.fpm.getFlightPlan(0).getWaypoint(this.holdWaypointIndex);
    const prevWaypoint = this.fpm.getFlightPlan(0).getWaypoint(this.holdWaypointIndex - 1);

    if (holdWaypoint && prevWaypoint) {
      const holdDetails = holdWaypoint.holdDetails;
      const fixCoords = holdWaypoint.infos.coordinates;
      const prevFixCoords = prevWaypoint.infos.coordinates;

      const trackToHold = new LatLon(prevFixCoords.lat, prevFixCoords.long).finalBearingTo(new LatLon(fixCoords.lat, fixCoords.long));

      if (this.state === HoldsDirectorState.NONE) {
        this.state = HoldsDirector.calculateEntryState(holdDetails.holdCourse, trackToHold);
      }
      
      this.fixCoords = fixCoords;
      this.prevFixCoords = prevFixCoords;

      const legFixes = HoldsDirector.calculateHoldFixes(fixCoords, holdDetails);
      this.inboundLeg = [legFixes[3], legFixes[0]];
      this.outboundLeg = [legFixes[1], legFixes[2]];
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
   */
  update() {
    const flightPlanVersion = SimVar.GetSimVarValue('L:WT.FlightPlan.Version', 'number');
    if (flightPlanVersion !== this.currentFlightPlanVersion) {
      this.initializeHold();
      this.currentFlightPlanVersion = flightPlanVersion;
    }

    const planeState = this.getAircraftState();
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
    }
  }

  /**
   * Gets the current state of the aircraft.
   */
  getAircraftState() {
    const state = new AircraftState();
    state.position = new LatLongAlt(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
    state.magVar = SimVar.GetSimVarValue("MAGVAR", "degrees");

    state.groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
    state.trueAirspeed = SimVar.GetSimVarValue('AIRSPEED TRUE', 'knots');

    state.windDirection = SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degrees");
    state.windSpeed = SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots");

    state.trueHeading = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'Radians') * Avionics.Utils.RAD2DEG;
    state.magneticHeading = SimVar.GetSimVarValue('PLANE HEADING DEGREES MAGNETIC', 'Radians') * Avionics.Utils.RAD2DEG;
    state.trueTrack = SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'Radians') * Avionics.Utils.RAD2DEG;

    return state;
  }

  /**
   * Handles the direct entry state.
   * @param {AircraftState} planeState The current aircraft state.
   */
  handleDirectEntry(planeState) {   
    const dtk = AutopilotMath.desiredTrack(this.prevFixCoords, this.fixCoords, planeState.position);
    const planeToFixTrack = Avionics.Utils.computeGreatCircleHeading(planeState.position, this.fixCoords);

    const trackDiff = Math.abs(Avionics.Utils.angleDiff(dtk, planeToFixTrack));

    if (trackDiff > 90) {
      HoldsDirector.setCourse(AutopilotMath.normalizeHeading(dtk + 45), planeState);
      this.fpm.setActiveWaypointIndex(this.holdWaypointIndex + 1);
      this.recalculateHold(planeState);

      this.state = HoldsDirectorState.TURNING_OUTBOUND;
    }
    else {
      this.trackLeg(this.prevFixCoords, this.fixCoords, planeState);
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
      const trackDiff = Avionics.Utils.angleDiff(dtk, planeState.trueTrack);

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
        this.state = HoldsDirectorState.TURNING_OUTBOUND;
      }
      else {
        this.trackLeg(this.inboundLeg[0], this.inboundLeg[1], planeState);
      }
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
    SimVar.SetSimVarValue("L:WT_CJ4_WPT_DISTANCE", "number", distanceRemaining);

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
    const dtk = AutopilotMath.desiredTrackArc(legStart, legEnd, planeState.position);
    const xtk = AutopilotMath.crossTrackArc(legStart, legEnd, planeState.position);

    const distanceRemaining = Avionics.Utils.computeGreatCircleDistance(planeState.position, legEnd);
    const correctedDtk = GeoMath.correctMagvar(dtk, SimVar.GetSimVarValue("MAGVAR", "degrees"));

    const interceptAngle = AutopilotMath.interceptAngle(xtk, NavSensitivity.APPROACHLPV, 25);
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

    return trackDiff > 100;
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
   * @param {AircraftState} planeState The true course that the hold will be flown with.
   * @returns {LatLongAlt[]} The four hold corner positions calculated, clockwise starting with the hold fix coordinates.
   */
  static calculateHoldFixes(holdFixCoords, holdDetails) {

    const windComponents = AutopilotMath.windComponents(holdDetails.holdCourse, holdDetails.windDirection, holdDetails.windSpeed);
    const turnRadius = AutopilotMath.turnRadius(holdDetails.speed + Math.abs(windComponents.crosswind), 25);

    const outboundStart = Avionics.Utils.bearingDistanceToCoordinates(AutopilotMath.normalizeHeading(holdDetails.holdCourse + 90), turnRadius * 2, 
      holdFixCoords.lat, holdFixCoords.long);
    
    const outboundEnd = Avionics.Utils.bearingDistanceToCoordinates(AutopilotMath.normalizeHeading(holdDetails.holdCourse + 180), holdDetails.legDistance,
      outboundStart.lat, outboundStart.long);
    
    const inboundStart = Avionics.Utils.bearingDistanceToCoordinates(AutopilotMath.normalizeHeading(holdDetails.holdCourse + 180), holdDetails.legDistance,
      holdFixCoords.lat, holdFixCoords.long);

    return [holdFixCoords, outboundStart, outboundEnd, inboundStart];
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

/**
 * The current state of the aircraft for LNAV.
 */
class AircraftState {
  constructor() {
    /** 
     * The true airspeed of the plane. 
     * @type {number}
     */
    this.trueAirspeed = undefined;

    /**
     * The ground speed of the plane.
     * @type {number}
     */
    this.groundSpeed = undefined;

    /**
     * The current plane location magvar.
     * @type {number}
     */
    this.magVar = undefined;

    /**
     * The current plane position.
     * @type {LatLon}
     */
    this.position = undefined;

    /**
     * The wind speed.
     * @type {number}
     */
    this.windSpeed = undefined;

    /**
     * The wind direction.
     * @type {number}
     */
    this.windDirection = undefined;

    /**
     * The current heading in degrees true of the plane.
     * @type {number}
     */
    this.trueHeading = undefined;

    /**
     * The current heading in degrees magnetic of the plane.
     * @type {number}
     */
    this.magneticHeading = undefined;

    /**
     * The current track in degrees true of the plane.
     * @type {number}
     */
    this.trueTrack = undefined;
  }
}