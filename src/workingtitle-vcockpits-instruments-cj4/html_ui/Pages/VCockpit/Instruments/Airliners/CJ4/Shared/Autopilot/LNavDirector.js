/**
 * A class that manages flight plan lateral guidance.
 */
class LNavDirector {
  /**
   * Creates an instance of the LNavDirector.
   * @param {FlightPlanManager} fpm The FlightPlanManager to use with this instance. 
   * @param {CJ4NavModeSelector} navModeSelector The nav mode selector to use with this instance.
   * @param {LNavDirectorOptions} options The LNAV options to use with this instance.
   */
  constructor(fpm, navModeSelector, options) {

    /** The FlightPlanManager instance. */
    this.fpm = fpm;

    /** The nav mode selector instance. */
    this.navModeSelector = navModeSelector;

    /** The current flight plan version. */
    this.currentFlightPlanVersion = 0;

    /**
     * The currently active flight plan.
     * @type {ManagedFlightPlan}
     */
    this.activeFlightPlan = undefined;

    /** The current director options. */
    this.options = options || new LNavDirectorOptions();

    /** The current flight plan sequencing mode. */
    this.sequencingMode = FlightPlanSequencing.AUTO;

    /** The current LNAV state. */
    this.state = LNavState.TRACKING;

    /** An instance of the LNAV holds director. */
    this.holdsDirector = new HoldsDirector(fpm);

    /** An instance of the localizer director. */
    this.locDirector = new LocDirector(navModeSelector);

    /** The current nav sensitivity. */
    this.currentNavSensitivity = NavSensitivity.NORMAL;
  }

  /**
   * Updates the LNavDirector.
   */
  update() {
    const currentFlightPlanVersion = SimVar.GetSimVarValue('L:WT.FlightPlan.Version', 'number');
    if (this.currentFlightPlanVersion != currentFlightPlanVersion) {
      this.handleFlightPlanChanged(currentFlightPlanVersion);
    }

    if (this.activeFlightPlan) {
      const previousWaypoint = this.activeFlightPlan.getWaypoint(this.activeFlightPlan.activeWaypointIndex - 1);
      const activeWaypoint = this.activeFlightPlan.getWaypoint(this.activeFlightPlan.activeWaypointIndex);

      const planeState = LNavDirector.getAircraftState();

      const navSensitivity = this.getNavSensitivity(planeState.position);
      SimVar.SetSimVarValue('L:WT_NAV_SENSITIVITY', 'number', navSensitivity);

      this.postDisplayedNavSensitivity(navSensitivity);

      const navSensitivityScalar = this.getNavSensitivityScalar(planeState.position, navSensitivity);
      SimVar.SetSimVarValue('L:WT_NAV_SENSITIVITY_SCALAR', 'number', navSensitivityScalar);
        
      if (!this.delegateToHoldsDirector(activeWaypoint) && activeWaypoint && previousWaypoint) {
        this.generateGuidance(activeWaypoint, planeState, previousWaypoint, navSensitivity);
      }
    }
  }

  /**
   * Generates lateral guidance for LNAV.
   * @param {WayPoint} activeWaypoint The current active waypoint.
   * @param {AircraftState} planeState The current aircraft state.
   * @param {WayPoint} previousWaypoint The previous waypoint.
   * @param {number} navSensitivity The current nav sensitivity.
   */
  generateGuidance(activeWaypoint, planeState, previousWaypoint, navSensitivity) {
    const activeLatLon = new LatLon(activeWaypoint.infos.coordinates.lat, activeWaypoint.infos.coordinates.long);

    const nextWaypoint = this.activeFlightPlan.getWaypoint(this.activeFlightPlan.activeWaypointIndex + 1);
    const nextLatLon = nextWaypoint ? new LatLon(nextWaypoint.infos.coordinates.lat, nextWaypoint.infos.coordinates.long) : undefined;

    const planeLatLon = new LatLon(planeState.position.lat, planeState.position.long);

    const dtk = AutopilotMath.desiredTrack(previousWaypoint.infos.coordinates, activeWaypoint.infos.coordinates, planeState.position);
    const distanceToActive = planeLatLon.distanceTo(activeLatLon) / 1852;

    this.alertIfClose(planeState, distanceToActive);

    if (AutopilotMath.isAbeam(dtk, planeState.position, activeWaypoint.infos.coordinates)) {
      this.sequenceToNextWaypoint(planeState, activeWaypoint);
    }
    else {
      const planeToActiveBearing = planeLatLon.initialBearingTo(activeLatLon);
      const nextStartTrack = nextWaypoint ? activeLatLon.initialBearingTo(nextLatLon) : planeToActiveBearing;

      const anticipationDistance = this.getAnticipationDistance(planeState, Avionics.Utils.angleDiff(planeToActiveBearing, nextStartTrack));
      if (!nextWaypoint || !nextWaypoint.isFlyover) {
        this.alertIfClose(planeState, distanceToActive, anticipationDistance);

        if (distanceToActive < anticipationDistance && !nextWaypoint.isFlyover) {
          this.sequenceToNextWaypoint(planeState, activeWaypoint);
        }
      }
    }

    if (!this.delegateToLocDirector()) {
      this.tryActivateIfArmed(previousWaypoint.infos.coordinates, activeWaypoint.infos.coordinates, planeState, navSensitivity);

      switch (this.state) {
        case LNavState.TRACKING:
          const activeMode = this.navModeSelector.currentLateralActiveState;
          const shouldExecute = distanceToActive > this.options.minimumTrackingDistance
            && (activeMode === LateralNavModeState.LNAV || (activeMode === LateralNavModeState.APPR && this.navModeSelector.approachMode === WT_ApproachType.RNAV));
          LNavDirector.trackLeg(previousWaypoint.infos.coordinates, activeWaypoint.infos.coordinates, planeState, navSensitivity, shouldExecute);
          break;
        case LNavState.TURN_COMPLETING:
          this.handleTurnCompleting(planeState, dtk, previousWaypoint, activeWaypoint);
          break;
      }
    }
  }

  /**
   * Handles the turn completion phase of lateral guidance.
   * @param {AircraftState} planeState The current aircraft state.
   * @param {number} dtk The current desired track.
   * @param {WayPoint} previousWaypoint The previous (from) waypoint.
   * @param {WayPoint} activeWaypoint The active (to) waypoint.
   */
  handleTurnCompleting(planeState, dtk, previousWaypoint, activeWaypoint, execute) {
    const angleDiffToTarget = Avionics.Utils.angleDiff(planeState.trueHeading, dtk);
    if (angleDiffToTarget < this.options.degreesRollout || this.navModeSelector.currentLateralActiveState !== LateralNavModeState.LNAV) {
      this.state = LNavState.TRACKING;
    }
    else {
      const turnDirection = Math.sign(angleDiffToTarget);
      const targetHeading = AutopilotMath.normalizeHeading(planeState.trueHeading + (turnDirection * 90));

      LNavDirector.trackLeg(previousWaypoint.infos.coordinates, activeWaypoint.infos.coordinates, planeState, false);
      LNavDirector.setCourse(targetHeading, planeState);
    }
  }

  /**
   * Checks to see if the waypoint can be sequenced past.
   * @param {WayPoint} activeWaypoint The waypoint to check against.
   * @returns {boolean} True if it can be sequenced past, false otherwise.
   */
  canSequence(activeWaypoint) {
    return activeWaypoint && !(activeWaypoint.endsInDiscontinuity || activeWaypoint.isRunway);
  }

  /**
   * Alerts the waypoint will be sequenced if within the 5 second sequencing
   * threshold.
   * @param {AircraftState} planeState The current aircraft state.
   * @param {number} distanceToActive The current distance to the active waypoint.
   * @param {number} sequenceDistance The distance where LNAV will sequence to the next waypoint.
   */
  alertIfClose(planeState, distanceToActive, sequenceDistance = 0) {
    const fiveSecondDistance = (planeState.groundSpeed / 3600) * 5;
    if (distanceToActive < sequenceDistance + fiveSecondDistance && this.state !== LNavState.IN_DISCONTINUITY && this.sequencingMode !== FlightPlanSequencing.INHIBIT) {
      SimVar.SetSimVarValue('L:WT_CJ4_WPT_ALERT', 'number', 1);
    }
    else {
      SimVar.SetSimVarValue('L:WT_CJ4_WPT_ALERT', 'number', 0);
    }
  }

  /**
   * Delegates navigation to the holds director, if necessary.
   * @param {WayPoint} activeWaypoint 
   * @returns True if the holds director is now active, false otherwise.
   */
  delegateToHoldsDirector(activeWaypoint) {
    if (activeWaypoint && activeWaypoint.hasHold && !this.holdsDirector.isHoldExited(this.activeFlightPlan.activeWaypointIndex - 1)) {
      this.holdsDirector.update(this.activeFlightPlan.activeWaypointIndex);

      return this.holdsDirector.state !== HoldsDirectorState.NONE && this.holdsDirector.state !== HoldsDirectorState.EXITED;
    }

    return false;
  }

  /**
   * Delegates navigation to the localizer director, if necessary.
   * @returns True if the localizer director is now active, false otherwise.
   */
  delegateToLocDirector() {
    const armedState = this.navModeSelector.currentLateralArmedState;
    const activeState = this.navModeSelector.currentLateralActiveState;

    if ((armedState === LateralNavModeState.APPR || activeState === LateralNavModeState.APPR) && this.navModeSelector.approachMode === WT_ApproachType.ILS) {
      this.locDirector.update();
      return this.locDirector.state === LocDirectorState.ACTIVE;
    }

    return false;
  }

  /**
   * Gets the current turn anticipation distance based on the plane state
   * and next turn angle.
   * @param {AircraftState} planeState The current aircraft state. 
   * @param {number} turnAngle The next turn angle, in degrees.
   */
  getAnticipationDistance(planeState, turnAngle) {
    const turnRadius = AutopilotMath.turnRadius(planeState.trueAirspeed, this.options.maxBankAngle);

    const bankDiff = (Math.sign(turnAngle) * this.options.maxBankAngle) - planeState.bankAngle;
    const enterBankDistance = (Math.abs(bankDiff) / this.options.bankRate) * (planeState.trueAirspeed / 3600);

    const turnAnticipationAngle = Math.min(this.options.maxTurnAnticipationAngle, Math.abs(turnAngle)) * Avionics.Utils.DEG2RAD;
    return Math.min((turnRadius * Math.abs(Math.tan(turnAnticipationAngle / 2))) + enterBankDistance, this.options.maxTurnAnticipationDistance(planeState));
  }

  /**
   * Handles when the flight plan version changes.
   * @param {number} currentFlightPlanVersion The new current flight plan version.
   */
  handleFlightPlanChanged(currentFlightPlanVersion) {
    this.activeFlightPlan = this.fpm.getFlightPlan(0);
    const activeWaypoint = this.activeFlightPlan.getWaypoint(this.activeFlightPlan.activeWaypointIndex);

    if (this.state === LNavState.TURN_COMPLETING) {
      this.state === LNavState.TRACKING;
    }

    if (this.sequencingMode === FlightPlanSequencing.INHIBIT && !activeWaypoint.isRunway) {
      this.sequencingMode = FlightPlanSequencing.AUTO;
    }

    if (this.state === LNavState.IN_DISCONTINUITY && !(activeWaypoint && activeWaypoint.endsInDiscontinuity)) {
      SimVar.SetSimVarValue("L:WT_CJ4_IN_DISCONTINUITY", "number", 0);
      this.state = LNavState.TRACKING;
    }

    SimVar.SetSimVarValue('L:WT_CJ4_WPT_ALERT', 'number', 0);
    this.currentFlightPlanVersion = currentFlightPlanVersion;
  }

  /**
   * Sequences to the next waypoint in the flight plan.
   * @param {AircraftState} planeState The current aircraft state.
   * @param {WayPoint} currentWaypoint The current active waypoint.
   */
  sequenceToNextWaypoint(planeState, currentWaypoint) {
    if (this.sequencingMode !== FlightPlanSequencing.INHIBIT && planeState.groundSpeed > 25) {
      const nextWaypoint = this.fpm.getWaypoint(this.activeFlightPlan.activeWaypointIndex + 1);

      if (currentWaypoint && currentWaypoint.endsInDiscontinuity) {
        this.state = LNavState.IN_DISCONTINUITY;
        SimVar.SetSimVarValue("L:WT_CJ4_IN_DISCONTINUITY", "number", 1);
        MessageService.getInstance().post(FMS_MESSAGE_ID.FPLN_DISCO, () => this.state !== LNavState.IN_DISCONTINUITY);

        this.sequencingMode = FlightPlanSequencing.INHIBIT;
        LNavDirector.setCourse(SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'Radians') * Avionics.Utils.RAD2DEG, planeState);
        SimVar.SetSimVarValue('L:WT_CJ4_WPT_ALERT', 'number', 0);
      }
      else if (nextWaypoint && nextWaypoint.isRunway) {
        this.sequencingMode = FlightPlanSequencing.INHIBIT;
        
        this.state = LNavState.TURN_COMPLETING;
        this.fpm.setActiveWaypointIndex(this.activeFlightPlan.activeWaypointIndex + 1);
      }
      else {
        this.state = LNavState.TURN_COMPLETING;
        this.fpm.setActiveWaypointIndex(this.activeFlightPlan.activeWaypointIndex + 1);
      }
    }
  }

  /**
   * Sets LNAV sequencing to AUTO.
   */
  setAutoSequencing() {
    const activeWaypoint = this.activeFlightPlan.getWaypoint(this.activeFlightPlan.activeWaypointIndex);
    if (this.state === LNavState.IN_DISCONTINUITY || (activeWaypoint && activeWaypoint.isRunway)) {
      this.state = LNavState.TRACKING;
      SimVar.SetSimVarValue("L:WT_CJ4_IN_DISCONTINUITY", "number", 0);

      const nextWaypointIndex = this.activeFlightPlan.activeWaypointIndex + 1;

      this.fpm.setActiveWaypointIndex(nextWaypointIndex);
      this.fpm.clearDiscontinuity(nextWaypointIndex - 1);
    }

    this.sequencingMode = FlightPlanSequencing.AUTO;
  }

  /**
   * Sets LNAV sequencing to INHIBIT.
   */
  setInhibitSequencing() {
    this.sequencingMode = FlightPlanSequencing.INHIBIT;
  }

  /**
   * Posts the correct nav sensitivity to the displays.
   * @param {number} navSensitivity The current nav sensitivity.
   */
  postDisplayedNavSensitivity(navSensitivity) {
    if (navSensitivity !== this.currentNavSensitivity) {
      this.currentNavSensitivity = navSensitivity;
      
      switch (this.currentNavSensitivity) {
        case NavSensitivity.TERMINAL:
          MessageService.getInstance().post(FMS_MESSAGE_ID.TERM, () => this.currentNavSensitivity !== NavSensitivity.TERMINAL);
          break;
        case NavSensitivity.TERMINALLPV:
          MessageService.getInstance().post(FMS_MESSAGE_ID.TERM_LPV, () => this.currentNavSensitivity !== NavSensitivity.TERMINALLPV);
          break;
        case NavSensitivity.APPROACH:
          MessageService.getInstance().post(FMS_MESSAGE_ID.APPR, () => this.currentNavSensitivity !== NavSensitivity.APPROACH);
          break;
        case NavSensitivity.APPROACHLPV:
          MessageService.getInstance().post(FMS_MESSAGE_ID.APPR_LPV, () => this.currentNavSensitivity !== NavSensitivity.APPROACHLPV);
          break;
      }
    }
  }

  /**
   * Attempts to activate LNAV automatically if LNAV or APPR LNV1 is armed.
   * @param {LatLongAlt} legStart The coordinates of the start of the leg.
   * @param {LatLongAlt} legEnd The coordinates of the end of the leg.
   * @param {AircraftState} planeState The current aircraft state.
   * @param {number} navSensitivity The sensitivity to use for tracking.
   */
  tryActivateIfArmed(legStart, legEnd, planeState, navSensitivity) {
    const armedState = this.navModeSelector.currentLateralArmedState;
    if (armedState === LateralNavModeState.LNAV || (armedState === LateralNavModeState.APPR && this.navModeSelector.approachMode === WT_ApproachType.RNAV)) {
      const xtk = AutopilotMath.crossTrack(legStart, legEnd, planeState.position);
      let activationXtk = 1.9;

      switch (navSensitivity) {
        case NavSensitivity.TERMINAL:
        case NavSensitivity.TERMINALLPV:
          activationXtk = 0.9;
          break;
        case NavSensitivity.APPROACH:
        case NavSensitivity.APPROACHLPV:
          activationXtk = 0.28;
          break;
      }

      if (Math.abs(xtk) < activationXtk) {
        this.navModeSelector.queueEvent(NavModeEvent.LNAV_ACTIVE);
      }
    }
  }

  /**
   * Tracks the specified leg.
   * @param {LatLongAlt} legStart The coordinates of the start of the leg.
   * @param {LatLongAlt} legEnd The coordinates of the end of the leg.
   * @param {AircraftState} planeState The current aircraft state.
   * @param {number} navSensitivity The sensitivity to use for tracking.
   * @param {boolean} execute Whether or not to execute the calculated course.
   */
  static trackLeg(legStart, legEnd, planeState, navSensitivity, execute = true) {
    const dtk = AutopilotMath.desiredTrack(legStart, legEnd, planeState.position);
    const xtk = AutopilotMath.crossTrack(legStart, legEnd, planeState.position);

    const correctedDtk = AutopilotMath.normalizeHeading(GeoMath.correctMagvar(dtk, SimVar.GetSimVarValue("MAGVAR", "degrees")));

    SimVar.SetSimVarValue("L:WT_CJ4_XTK", "number", xtk);
    SimVar.SetSimVarValue("L:WT_CJ4_DTK", "number", correctedDtk);

    const interceptAngle = AutopilotMath.interceptAngle(xtk, navSensitivity);
    const bearingToWaypoint = Avionics.Utils.computeGreatCircleHeading(planeState.position, legEnd);
    const deltaAngle = Math.abs(Avionics.Utils.angleDiff(dtk, bearingToWaypoint));

    const headingToSet = deltaAngle < Math.abs(interceptAngle) ? AutopilotMath.normalizeHeading(dtk + interceptAngle) : bearingToWaypoint;

    if (execute) {
      LNavDirector.setCourse(headingToSet, planeState);
    }
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

  /**
   * Gets the current state of the aircraft.
   */
  static getAircraftState() {
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
    
    state.bankAngle = SimVar.GetSimVarValue('PLANE BANK DEGREES', 'Radians') * Avionics.Utils.RAD2DEG;

    return state;
  }

  /**
   * Gets the distance from the destination airfield.
   * @param {LatLongAlt} planeCoords The current coordinates of the aircraft.
   * @returns {number} The distance from the airfield in NM.
   */
  getDestinationDistance(planeCoords) {
    const destination = this.fpm.getDestination();

    if (destination) {
      const destinationDistance = Avionics.Utils.computeGreatCircleDistance(planeCoords, destination.infos.coordinates);
      return destinationDistance;
    }

    return NaN;
  }

  /**
   * Gets the distance from the final approach fix.
   * @param {LatLongAlt} planeCoords The current coordinates of the aircraft.
   * @returns {number} The distance from the final approach fix in NM.
   */
  getFinalApproachFixDistance(planeCoords) {
    const approach = this.fpm.getApproachWaypoints();
    if (approach.length > 1) {
      let finalApproachFix = approach[approach.length - 2];
      let finalApproachFixDistance = finalApproachFix.cumulativeDistanceInFp;

      if (finalApproachFixDistance < 3 && approach.length >= 3) {
        finalApproachFix = approach[approach.length - 3];
      }

      finalApproachFixDistance = Avionics.Utils.computeGreatCircleDistance(planeCoords, finalApproachFix.infos.coordinates);
      return finalApproachFixDistance;
    }

    return NaN;
  }

  /**
   * Gets the current system nav sensitivity.
   * @param {LatLongAlt} planeCoords 
   */
  getNavSensitivity(planeCoords) {
    const destinationDistance = this.getDestinationDistance(planeCoords);
    const fafDistance = this.getFinalApproachFixDistance(planeCoords);
    const currentWaypoint = this.fpm.getActiveWaypoint();

    const segment = this.fpm.getSegmentFromWaypoint(currentWaypoint);

    if (((fafDistance <= 3 || (currentWaypoint && currentWaypoint.isRunway))) && segment.type === SegmentType.Approach) {
      if (this.navModeSelector.currentLateralActiveState === LateralNavModeState.APPR && this.navModeSelector.approachMode === WT_ApproachType.RNAV) {
        return NavSensitivity.APPROACHLPV;
      }
      else {
        return NavSensitivity.APPROACH;
      }
    }

    if (destinationDistance <= 31) {
      if (this.navModeSelector.approachMode === WT_ApproachType.RNAV) {
        return NavSensitivity.TERMINALLPV;
      }
      else {
        return NavSensitivity.TERMINAL;
      }
    }

    return NavSensitivity.NORMAL;
  }

  /**
   * Gets the navigational sensitivity scalar for the approach modes.
   * @param {LatLong} planeCoords The current plane location coordinates.
   * @param {number} sensitivity The current navigational sensitivity mode.
   */
  getNavSensitivityScalar(planeCoords, sensitivity) {
    if (sensitivity === NavSensitivity.APPROACHLPV) {
      const runway = this.getRunway();
      if (runway) {
        const distance = Avionics.Utils.computeGreatCircleDistance(runway.infos.coordinates, planeCoords);
        return Math.min(0.1 + ((distance / 7) * 0.9), 1);
      }
    }

    return 1;
  }

  /**
   * Gets the approach runway from the flight plan.
   * @returns {WayPoint} The approach runway waypoint.
   */
  getRunway() {
    const approach = this.fpm.getApproachWaypoints();
    if (approach.length > 0) {
      const lastApproachWaypoint = approach[approach.length - 1];

      if (lastApproachWaypoint.isRunway) {
        return lastApproachWaypoint;
      }
    }
  }
}

/**
 * Options for lateral navigation.
 */
class LNavDirectorOptions {

  /**
   * Creates an instance of LNavDirectorOptions.
   */
  constructor() {
    /** 
     * The minimum distance in NM that LNAV will track towards the active waypoint. This
     * value is used to avoid swinging towards the active waypoint when the waypoint is close,
     * if the plane is off track.
     */
    this.minimumTrackingDistance = 1;

    /** The maximum bank angle of the aircraft. */
    this.maxBankAngle = 30;

    /** The rate of bank in degrees per second. */
    this.bankRate = 10;

    /** The maximum turn angle in degrees to calculate turn anticipation to. */
    this.maxTurnAnticipationAngle = 110;

    /** A function that returns the maximum turn anticipation distance. */
    this.maxTurnAnticipationDistance = (planeState) => planeState.trueAirspeed < 350 ? 7 : 10;

    /** The number of degrees left in the turn that turn completion will stop and rollout/tracking will begin. */
    this.degreesRollout = 15;
  }
}

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
     * @type {LatLonAlt}
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

    /**
     * The current plane bank angle.
     * @type {number}
     */
    this.bankAngle = undefined;
  }
}

class FlightPlanSequencing { }
FlightPlanSequencing.AUTO = 'AUTO';
FlightPlanSequencing.INHIBIT = 'INHIBIT';

class LNavState { }
LNavState.TRACKING = 'TRACKING';
LNavState.TURN_COMPLETING = 'TURN_COMPLETING';
LNavState.IN_DISCONTINUITY = 'IN_DISCONTINUITY';

/** The sensitivity of the navigation solution. */
class NavSensitivity { }
/** Vertical and lateral sensitivity is at normal +/- 2.0NM enroute levels. */
NavSensitivity.NORMAL = 0;
/** Vertical and lateral sensitivity is at +/- 1.0NM terminal levels. */
NavSensitivity.TERMINAL = 1;
/** Vertical and lateral sensitivity is at +/- 1.0NM terminal levels. */
NavSensitivity.TERMINALLPV = 2;
/** Vertical and lateral sensitivity is at +/- 0.3NM approach levels. */
NavSensitivity.APPROACH = 3;
/** Vertical and lateral sensitivity increases as distance remaining on final decreases. */
NavSensitivity.APPROACHLPV = 4;
