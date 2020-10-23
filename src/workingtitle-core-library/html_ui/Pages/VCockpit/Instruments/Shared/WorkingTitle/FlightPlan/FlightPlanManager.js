/**
 * A system for managing flight plan data used by various instruments.
 */
class FlightPlanManager {

  /**
   * Constructs an instance of the FlightPlanManager with the provided
   * parent instrument attached.
   * @param {BaseInstrument} parentInstrument The parent instrument attached to this FlightPlanManager.
   */
  constructor(parentInstrument) {
    this._parentInstrument = parentInstrument;
    this._isRegistered = false;
    this._currentFlightPlanVersion = 0;
    this.__currentFlightPlanIndex = 0;

    /**
     * The current stored flight plan data.
     * @type ManagedFlightPlan[]
     */
    this._flightPlans;
    this._loadFlightPlans();

    FlightPlanManager.DEBUG_INSTANCE = this;
  }

  get _currentFlightPlanIndex() { 
    return this.__currentFlightPlanIndex; 
  }
  set _currentFlightPlanIndex(value) {
    this.__currentFlightPlanIndex = value;
  }

  addHardCodedConstraints(wp) {
  }

  /**
   * Registers the FlightPlanManager with various game listeners.
   */
  registerListener() {
  }

  /**
   * Loads sim flight plan data into WayPoint objects for consumption.
   * @param {*} data The flight plan data to load.
   * @param {*} currentWaypoints The waypoints array to modify with the data loaded.
   * @param {*} callback A callback to call when the data has completed loading.
   */
  _loadWaypoints(data, currentWaypoints, callback) {
  }

  /**
   * Updates the current active waypoint index from the sim.
   */
  async updateWaypointIndex() {
    const waypointIndex = await Coherent.call("GET_ACTIVE_WAYPOINT_INDEX");
    this._activeWaypointIndex = waypointIndex;
  }

  /**
   * Scans for updates to the synchronized flight plan and loads them into the flight plan
   * manager if the flight plan is out of date.
   * @param {() => void} callback A callback to call when the update has completed.
   * @param {Boolean} log Whether or not to log the loaded flight plan value.
   */
  updateFlightPlan(callback = () => { }, log = false) {
    const flightPlanVersion = SimVar.GetSimVarValue("L:WT.FlightPlan.Version", "number");
    if (flightPlanVersion !== this._currentFlightPlanVersion) {
      this._loadFlightPlans();
      this._currentFlightPlanVersion = flightPlanVersion;
    }

    callback();
  }

  /**
   * Loads the flight plans from data storage.
   */
  _loadFlightPlans() {
    this._flightPlans = JSON.parse(WTDataStore.get("WT.FlightPlan", "[]"));

    if (this._flightPlans.length === 0) {
      this._flightPlans.push(new ManagedFlightPlan());
    }
    else {
      this._flightPlans = this._flightPlans.map(fp => ManagedFlightPlan.fromObject(fp, this._parentInstrument));
    }
  }

  updateCurrentApproach(callback = () => { }, log = false) {
    callback();
  }

  get cruisingAltitude() {
  }

  /**
   * Gets the index of the currently active flight plan.
   */
  getCurrentFlightPlanIndex() {
    return this._currentFlightPlanIndex;
  }

  /**
   * Switches the active flight plan index to the supplied index.
   * @param {Number} index The index to now use for the active flight plan.
   * @param {(Boolean) => void} callback A callback to call when the operation has completed.
   */
  setCurrentFlightPlanIndex(index, callback = EmptyCallback.Boolean) {
    if (index >= 0 && index < this._flightPlans.length) {
      this._currentFlightPlanIndex = index;
      callback(true);
    }
    else {
      callback(false);
    }
  }

  /**
   * Creates a new flight plan.
   * @param {(Boolean) => void} callback 
   */
  createNewFlightPlan(callback = EmptyCallback.Void) {
    const newFlightPlan = new ManagedFlightPlan();
    newFlightPlan.setParentInstrument(this._parentInstrument);

    this._flightPlans.push(newFlightPlan);
    this._updateFlightPlanVersion();

    callback();
  }

  /**
   * Copies the currently active flight plan into the specified flight plan index.
   * @param {Number} index The index to copy the currently active flight plan into.
   * @param {() => void} callback A callback to call when the operation has completed.
   */
  copyCurrentFlightPlanInto(index, callback = EmptyCallback.Void) {
    const copiedFlightPlan = this._flightPlans[this._currentFlightPlanIndex].copy();
    this._flightPlans[index] = copiedFlightPlan;

    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Copies the flight plan at the specified index to the currently active flight plan index.
   * @param {Number} index The index to copy into the currently active flight plan.
   * @param {() => void} callback A callback to call when the operation has completed.
   */
  copyFlightPlanIntoCurrent(index, callback = EmptyCallback.Void) {
    const copiedFlightPlan = this._flightPlans[index].copy();
    this._flightPlans[this._currentFlightPlanIndex] = copiedFlightPlan;

    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Clears the currently active flight plan.
   * @param {() => void} callback A callback to call when the operation has completed.
   */
  async clearFlightPlan(callback = EmptyCallback.Void) {
    await this._flightPlans[this._currentFlightPlanIndex].clearPlan();
    this._updateFlightPlanVersion();
    
    callback();
  }

  /**
   * Gets the origin of the currently active flight plan.
   */
  getOrigin() {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (currentFlightPlan.hasOrigin) {
      return currentFlightPlan.waypoints[0];
    }
    
    return undefined;
  }

  /**
   * Sets the origin in the currently active flight plan.
   * @param {String} icao The ICAO designation of the origin airport.
   * @param {() => void} callback A callback to call when the operation has completed.
   */
  async setOrigin(icao, callback = () => { }) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    const airport = await this._parentInstrument.facilityLoader.getFacilityRaw(icao);

    await currentFlightPlan.clearPlan();
    await currentFlightPlan.addWaypoint(airport, 0);
    this._updateFlightPlanVersion();

    callback();
  }

  /**
   * Gets the index of the active waypoint in the flight plan.
   * @param {Boolean} forceSimVarCall Unused
   * @param {Boolean} useCorrection Unused
   */
  getActiveWaypointIndex(forceSimVarCall = false, useCorrection = false) {
    return this._flightPlans[this._currentFlightPlanIndex].activeWaypointIndex;
  }

  /**
   * Sets the index of the active waypoint in the flight plan.
   * @param {Number} index The index to make active in the flight plan.
   * @param {() => void} callback A callback to call when the operation has completed.
   */
  setActiveWaypointIndex(index, callback = EmptyCallback.Void) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (index >= 0 && index < currentFlightPlan.length) {
      currentFlightPlan.activeWaypointIndex = index;
    }

    this._updateFlightPlanVersion();
    callback();
  }

  /** Unknown */
  recomputeActiveWaypointIndex(callback = EmptyCallback.Void) {
    callback();
  }

  /**
   * Gets the index of the waypoint prior to the currently active waypoint.
   * @param {Boolean} forceSimVarCall Unused
   */
  getPreviousActiveWaypoint(forceSimVarCall = false) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    const previousWaypointIndex = currentFlightPlan.activeWaypoint - 1;

    return currentFlightPlan.getWaypoint(previousWaypointIndex);
  }

  /**
   * Gets the ident of the active waypoint.
   * @param {Boolean} forceSimVarCall Unused
   */
  getActiveWaypointIdent(forceSimVarCall = false) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (currentFlightPlan.activeWaypoint) {
      return currentFlightPlan.activeWaypoint.ident;
    }

    return "";
  }

  /**
   * Gets the active waypoint index from fs9gps. Currently unimplemented.
   * @param {*} forceSimVarCall Unused
   */
  getGPSActiveWaypointIndex(forceSimVarCall = false) {
    return this.getActiveWaypointIndex();
  }

  /**
   * Gets the active waypoint.
   * @param {Boolean} forceSimVarCall Unused
   * @param {Boolean} useCorrection Unused
   */
  getActiveWaypoint(forceSimVarCall = false, useCorrection = false) {
    return this._flightPlans[this._currentFlightPlanIndex].activeWaypoint;
  }

  /**
   * Gets the next waypoint following the active waypoint.
   * @param {Boolean} forceSimVarCall Unused
   */
  getNextActiveWaypoint(forceSimVarCall = false) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    const nextWaypointIndex = currentFlightPlan.activeWaypoint + 1;

    return currentFlightPlan.getWaypoint(nextWaypointIndex);
  }

  /**
   * Gets the distance, in NM, to the active waypoint.
   */
  getDistanceToActiveWaypoint() {
    let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
    let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
    let ll = new LatLong(lat, long);

    let waypoint = this.getActiveWaypoint();
    if (waypoint && waypoint.infos) {
        return Avionics.Utils.computeDistance(ll, waypoint.infos.coordinates);
    }

    return 0;
  }

  /**
   * Gets the bearing, in degrees, to the active waypoint.
   */
  getBearingToActiveWaypoint() {
    let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
    let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
    let ll = new LatLong(lat, long);

    let waypoint = this.getActiveWaypoint();
    if (waypoint && waypoint.infos) {
        return Avionics.Utils.computeGreatCircleHeading(ll, waypoint.infos.coordinates);
    }

    return 0;
  }

  /**
   * Gets the estimated time enroute to the active waypoint.
   */
  getETEToActiveWaypoint() {
    let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
    let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
    let ll = new LatLong(lat, long);

    let waypoint = this.getActiveWaypoint();
    if (waypoint && waypoint.infos) {
        let dist = Avionics.Utils.computeDistance(ll, waypoint.infos.coordinates);
        let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
        if (groundSpeed < 50) {
            groundSpeed = 50;
        }
        if (groundSpeed > 0.1) {
            return dist / groundSpeed * 3600;
        }
    }

    return 0;
  }

  /**
   * Gets the destination airfield of the current flight plan, if any.
   */
  getDestination() {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (currentFlightPlan.hasDestination) {
      return currentFlightPlan.getWaypoint(currentFlightPlan.length - 1);
    }

    return undefined;
  }

  /**
   * Gets the currently selected departure information for the current flight plan.
   */
  getDeparture() {
    const origin = this.getOrigin();
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

    if (origin) {
      let originInfos = origin.infos;
      if (originInfos.departures !== undefined && currentFlightPlan.procedureDetails.departureSelected) {
          return originInfos.departures[currentFlightPlan.procedureDetails.departureIndex];
      }
    }

    return undefined;
  }

  /**
   * Gets the currently selected arrival information for the current flight plan.
   */
  getArrival() {
    const destination = this.getDestination();
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

    if (destination) {
      let originInfos = destination.infos;
      if (originInfos.arrivals !== undefined && currentFlightPlan.arrivalIndex !== undefined) {
          return originInfos.arrivals[currentFlightPlan.arrivalIndex];
      }
    }

    return undefined;
  }

  /**
   * Gets the currently selected approach information for the current flight plan.
   */
  getAirportApproach() {
    const destination = this.getDestination();
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

    if (destination) {
      let originInfos = destination.infos;
      if (originInfos.approaches !== undefined && currentFlightPlan.approachIndex !== undefined) {
          return originInfos.approaches[currentFlightPlan.approachIndex];
      }
    }

    return undefined;
  }

  /**
   * Gets the departure waypoints for the current flight plan.
   */
  getDepartureWaypoints() {
    return this._flightPlans[this._currentFlightPlanIndex].departure.waypoints;
  }

  /**
   * Gets a map of the departure waypoints (?)
   */
  getDepartureWaypointsMap() {
    return this._flightPlans[this._currentFlightPlanIndex].departure.waypoints;
  }

  /**
   * Gets the enroute waypoints for the current flight plan.
   * @param {Number[]} outFPIndex An array of waypoint indexes to be pushed to.
   */
  getEnRouteWaypoints(outFPIndex) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    const enrouteSegment = currentFlightPlan.enroute;

    if (outFPIndex) {
      for (var i = 0; i < enrouteSegment.waypoints.length; i++) {
        outFPIndex.push(enrouteSegment.offset + i);
      }
    }

    return enrouteSegment.waypoints;
  }

  /**
   * Gets the index of the last waypoint in the enroute segment of the current flight plan.
   */
  getEnRouteWaypointsLastIndex() {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    const enrouteSegment = currentFlightPlan.enroute;

    return enrouteSegment.offset + (enrouteSegment.waypoints.length - 1);
  }

  /**
   * Gets the arrival waypoints for the current flight plan.
   */
  getArrivalWaypoints() {
    return this._flightPlans[this._currentFlightPlanIndex].arrival.waypoints;
  }

  /**
   * Gets the arrival waypoints for the current flight plan as a map. (?)
   */
  getArrivalWaypointsMap() {
    return this._flightPlans[this._currentFlightPlanIndex].arrival.waypoints;
  }

  /**
   * Gets the waypoints for the current flight plan with altitude constraints.
   */
  getWaypointsWithAltitudeConstraints() {
    return this._flightPlans[this._currentFlightPlanIndex].waypoints;
  }

  /**
   * Sets the destination for the current flight plan.
   * @param {String} icao The ICAO designation for the destination airfield. 
   * @param {() => void} callback A callback to call once the operation completes.
   */
  async setDestination(icao, callback = () => { }) {
    const waypoint = await this._parentInstrument.facilityLoader.getFacilityRaw(icao);
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

    if (currentFlightPlan.hasDestination) {
      currentFlightPlan.removeWaypoint(currentFlightPlan.length - 1);
    }
    this._flightPlans[this._currentFlightPlanIndex].addWaypoint(waypoint, undefined, true);

    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Adds a waypoint to the current flight plan.
   * @param {String} icao The ICAO designation for the waypoint.
   * @param {Number} index The index of the waypoint to add.
   * @param {() => void} callback A callback to call once the operation completes.
   * @param {Boolean} setActive Whether or not to set the added waypoint as active immediately.
   */
  async addWaypoint(icao, index = Infinity, callback = () => { }, setActive = true) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    const waypoint = await this._parentInstrument.facilityLoader.getFacilityRaw(icao);
    
    currentFlightPlan.addWaypoint(waypoint, index);
    if (setActive) {
      //currentFlightPlan.activeWaypointIndex = index;
    }

    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Sets the altitude for a waypoint in the current flight plan.
   * @param {Number} altitude The altitude to set for the waypoint.
   * @param {Number} index The index of the waypoint to set.
   * @param {() => void} callback A callback to call once the operation is complete.
   */
  setWaypointAltitude(altitude, index, callback = () => { }) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    const waypoint = currentFlightPlan.getWaypoint(index);

    if (waypoint) {
      waypoint.infos.coordinates.alt = altitude;
      this._updateFlightPlanVersion();
    }

    callback();
  }

  /**
   * Sets additional data on a waypoint in the current flight plan.
   * @param {Number} index The index of the waypoint to set additional data for.
   * @param {String} key The key of the data.
   * @param {*} value The value of the data.
   * @param {() => void} callback A callback to call once the operation is complete.
   */
  setWaypointAdditionalData(index, key, value, callback = () => { }) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    const waypoint = currentFlightPlan.getWaypoint(index);

    if (waypoint) {
      waypoint.additionalData[key] = value;
      this._updateFlightPlanVersion();
    }

    callback();
  }

  /**
   * Gets additional data on a waypoint in the current flight plan.
   * @param {Number} index The index of the waypoint to set additional data for.
   * @param {String} key The key of the data.
   * @param {(any) => void} callback A callback to call with the value once the operation is complete.
   */
  getWaypointAdditionalData(index, key, callback = () => { }) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    const waypoint = currentFlightPlan.getWaypoint(index);

    if (waypoint) {
      callback(waypoint.additionalData[key]);
    }
    else {
      callback(undefined);
    }
  }

  /**
   * Reverses the currently active flight plan.
   * @param {() => void} callback A callback to call when the operation is complete. 
   */
  invertActiveFlightPlan(callback = () => { }) {
    this._flightPlans[this._currentFlightPlanIndex].reverse();

    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Not sure what this is supposed to do.
   * @param {*} callback Stuff?
   */
  getApproachIfIcao(callback = () => { }) {
    callback(this.getApproach());
  }

  /**
   * Unused
   * @param {*} _callback Unused
   */
  addFlightPlanUpdateCallback(_callback) {
  }

  /**
   * Adds a waypoint to the currently active flight plan by ident(?)
   * @param {String} ident The ident of the waypoint.
   * @param {Number} index The index to add the waypoint at.
   * @param {() => void} callback A callback to call when the operation finishes.
   */
  addWaypointByIdent(ident, index = Infinity, callback = EmptyCallback.Void) {
    this.addWaypoint(ident, index, callback);
  }

  /**
   * Removes a waypoint from the currently active flight plan.
   * @param {Number} index The index of the waypoint to remove.
   * @param {Boolean} thenSetActive Unused
   * @param {() => void} callback A callback to call when the operation finishes.
   */
  removeWaypoint(index, thenSetActive = false, callback = () => { }) {
    this._flightPlans[this._currentFlightPlanIndex].removeWaypoint(index);

    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Gets the index of a given waypoint in the current flight plan.
   * @param {WayPoint} waypoint The waypoint to get the index of.
   */
  indexOfWaypoint(waypoint) {
    return this._flightPlans[this._currentFlightPlanIndex].waypoints.indexOf(waypoint);
  }

  /**
   * Gets the number of waypoints in a flight plan.
   * @param {Number} flightPlanIndex The index of the flight plan. If omitted, will get the current flight plan.
   */
  getWaypointsCount(flightPlanIndex = NaN) {
    if (isNaN(flightPlanIndex)) {
      flightPlanIndex = this._currentFlightPlanIndex;
    }

    return this._flightPlans[flightPlanIndex].length;
  }

  /**
   * Gets a count of the number of departure waypoints in the current flight plan.
   */
  getDepartureWaypointsCount() {
    return this._flightPlans[this._currentFlightPlanIndex].departure.length;
  }

  /**
   * Gets a count of the number of arrival waypoints in the current flight plan.
   */
  getArrivalWaypointsCount() {
    return this._flightPlans[this._currentFlightPlanIndex].arrival.length;
  }

  /**
   * Gets a waypoint from a flight plan.
   * @param {Number} index The index of the waypoint to get.
   * @param {Number} flightPlanIndex The index of the flight plan to get the waypoint from. If omitted, will get from the current flight plan.
   * @param {Boolean} considerApproachWaypoints Whether or not to consider approach waypoints.
   */
  getWaypoint(index, flightPlanIndex = NaN, considerApproachWaypoints) {
    if (isNaN(flightPlanIndex)) {
      flightPlanIndex = this._currentFlightPlanIndex;
    }

    return this._flightPlans[flightPlanIndex].getWaypoint(index);
  }

  /**
   * Gets all waypoints from a flight plan.
   * @param {Number} flightPlanIndex The index of the flight plan to get the waypoint from. If omitted, will get from the current flight plan.
   */
  getWaypoints(flightPlanIndex = NaN) {
    if (isNaN(flightPlanIndex)) {
      flightPlanIndex = this._currentFlightPlanIndex;
    }

    return this._flightPlans[flightPlanIndex].waypoints;
  }

  /**
   * Gets the index of the departure runway in the current flight plan.
   */
  getDepartureRunwayIndex() {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (currentFlightPlan.hasOrigin) {
      return currentFlightPlan.procedureDetails.departureRunwayIndex;
    }

    return undefined;
  }

  /**
   * Gets the string value of the departure runway in the current flight plan.
   */
  getDepartureRunway() {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (currentFlightPlan.hasOrigin) {
      return currentFlightPlan.waypoints[0].infos.oneWayRunways[currentFlightPlan.procedureDetails.departureRunwayIndex];
    }

    return undefined;
  }

  /**
   * Gets the best runway based on the current plane heading.
   */
  getDetectedCurrentRunway() {
    const origin = this.getOrigin();

    if (origin && origin.infos instanceof AirportInfo) {
      const runways = origin.infos.oneWayRunways;

      if (runways && runways.length > 0) {
        let direction = Simplane.getHeadingMagnetic();
        let bestRunway = runways[0];
        let bestDeltaAngle = Math.abs(Avionics.Utils.angleDiff(direction, bestRunway.direction));

        for (let i = 1; i < runways.length; i++) {
          let deltaAngle = Math.abs(Avionics.Utils.angleDiff(direction, runways[i].direction));
          if (deltaAngle < bestDeltaAngle) {
              bestDeltaAngle = deltaAngle;
              bestRunway = runways[i];
          }
        }

        return bestRunway;
      }
    }
    return undefined;
  }

  /**
   * Gets the departure procedure index for the current flight plan.
   */
  getDepartureProcIndex() {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (currentFlightPlan.procedureDetails.departureSelected) {
      return currentFlightPlan.procedureDetails.departureIndex;
    }

    return -1;
  }

  /**
   * Sets the departure procedure index for the current flight plan.
   * @param {Number} index The index of the departure procedure in the origin airport departures information.
   * @param {() => void} callback A callback to call when the operation completes.
   */
  async setDepartureProcIndex(index, callback = () => { }) {
    if (index === -1) {
      this._flightPlans[this._currentFlightPlanIndex].clearDeparture();
    }
    else {
      await this._flightPlans[this._currentFlightPlanIndex].setDepartureFromIndex(index);    
    }

    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Sets the departure runway index for the current flight plan.
   * @param {Number} index The index of the runway in the origin airport runway information.
   * @param {() => void} callback A callback to call when the operation completes.
   */
  setDepartureRunwayIndex(index, callback = EmptyCallback.Void) {
    this._flightPlans[this._currentFlightPlanIndex].procedureDetails.departureRunwayIndex = index;

    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Sets the origin runway index for the current flight plan.
   * @param {Number} index The index of the runway in the origin airport runway information.
   * @param {() => void} callback A callback to call when the operation completes.
   */
  setOriginRunwayIndex(index, callback = EmptyCallback.Void) {
    this.setDepartureRunwayIndex(index, callback);
  }

  /**
   * Gets the departure transition index for the current flight plan.
   */
  getDepartureEnRouteTransitionIndex() {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (currentFlightPlan.procedureDetails.departureSelected) {
      return currentFlightPlan.procedureDetails.departureTransitionIndex;
    }

    return -1;
  }

  /**
   * Sets the departure transition index for the current flight plan.
   * @param {Number} index The index of the departure transition to select.
   * @param {() => void} callback A callback to call when the operation completes.
   */
  setDepartureEnRouteTransitionIndex(index, callback = EmptyCallback.Void) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (currentFlightPlan.procedureDetails.departureSelected) {
      currentFlightPlan.procedureDetails.departureTransitionIndex = index;
    }

    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Unused
   */
  getDepartureDiscontinuity() {
  }

  /**
   * Unused
   * @param {() => void} callback A callback to call when the operation completes.
   */
  clearDepartureDiscontinuity(callback = EmptyCallback.Void) {
    callback();
  }

  /**
   * Removes the departure from the currently active flight plan.
   * @param {() => void} callback A callback to call when the operation completes.
   */
  removeDeparture(callback = () => { }) {
    this._flightPlans[this._currentFlightPlanIndex].clearDeparture();

    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Gets the arrival procedure index in the currenly active flight plan.
   */
  getArrivalProcIndex() {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (currentFlightPlan.procedureDetails.arrivalSelected) {
      return currentFlightPlan.procedureDetails.arrivalIndex;
    }

    return -1;
  }

  /**
   * Gets the arrival transition procedure index in the currently active flight plan.
   */
  getArrivalTransitionIndex() {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (currentFlightPlan.procedureDetails.arrivalSelected) {
      return currentFlightPlan.procedureDetails.arrivalTransitionIndex;
    }

    return -1;
  }

  /**
   * Sets the arrival procedure index for the current flight plan.
   * @param {Number} index The index of the arrival procedure to select.
   * @param {() => void} callback A callback to call when the operation completes.
   */
  setArrivalProcIndex(index, callback = () => { }) {
    if (index === -1) {
      this._flightPlans[this._currentFlightPlanIndex].clearArrival();
    }
    else {
      this._flightPlans[this._currentFlightPlanIndex].setArrivalFromIndex(index);
    }
    
    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Unused
   */
  getArrivalDiscontinuity() {
  }

  /**
   * Unused
   * @param {*} callback 
   */
  clearArrivalDiscontinuity(callback = EmptyCallback.Void) {
    callback();
  }

  /**
   * Sets the arrival transition index for the current flight plan.
   * @param {Number} index The index of the arrival transition to select.
   * @param {() => void} callback A callback to call when the operation completes.
   */
  setArrivalEnRouteTransitionIndex(index, callback = () => { }) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

    if (currentFlightPlan.procedureDetails.arrivalSelected) {
      currentFlightPlan.procedureDetails.arrivalTransitionIndex = index;
    }

    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Sets the arrival runway index in the currently active flight plan.
   * @param {Number} index The index of the runway to select.
   * @param {() => void} callback A callback to call when the operation completes.
   */
  setArrivalRunwayIndex(index, callback = () => { }) {
    this._flightPlans[this._currentFlightPlanIndex].procedureDetails.arrivalRunwayIndex = index;

    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Gets the index of the approach in the currently active flight plan.
   */
  getApproachIndex() {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (currentFlightPlan.procedureDetails.approachSelected) {
      return currentFlightPlan.procedureDetails.approachIndex;
    }

    return -1;
  }

  /**
   * Sets the approach index in the currently active flight plan.
   * @param {Number} index The index of the approach in the destination airport information.
   * @param {() => void} callback A callback to call when the operation has completed.
   * @param {Number} transition The approach transition index to set in the approach information. 
   */
  setApproachIndex(index, callback = () => { }, transition = 0) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    currentFlightPlan.setApproachFromIndex(index);
    currentFlightPlan.procedureDetails.approachTransitionIndex = transition;

    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Whether or not an approach is loaded in the current flight plan.
   * @param {Boolean} forceSimVarCall Unused
   */
  isLoadedApproach(forceSimVarCall = false) {
    return this._isApproachLoaded;
  }

  /**
   * Whether or not the approach is active in the current flight plan.
   * @param {Boolean} forceSimVarCall Unused
   */
  isActiveApproach(forceSimVarCall = false) {
    return this._isApproachActive;
  }

  /**
   * Activates the approach segment in the current flight plan.
   * @param {() => void} callback 
   */
  activateApproach(callback = EmptyCallback.Void) {
    callback();
  }

  /**
   * Deactivates the approach segments in the current flight plan.
   */
  deactivateApproach() {
  }

  /**
   * Attemptes to auto-activate the approach in the current flight plan.
   */
  tryAutoActivateApproach() {
  }

  /**
   * Gets the index of the active waypoint on the approach in the current flight plan.
   */
  getApproachActiveWaypointIndex() {
    return this._flightPlans[this._currentFlightPlanIndex].activeWaypointIndex;
  }

  /**
   * Gets the approach from the current flight plan.
   */
  getApproach() {
    return new Approach();
  }

  /**
   * Get the nav frequency for the selected approach in the current flight plan.
   */
  getApproachNavFrequency() {
    return NaN;
  }

  /**
   * Gets the index of the approach transition in the current flight plan.
   */
  getApproachTransitionIndex() {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (currentFlightPlan.procedureDetails.approachSelected) {
      return currentFlightPlan.procedureDetails.approachTransitionIndex;
    }

    return -1;
  }

  /**
   * Gets the last waypoint index before the start of the approach segment in
   * the current flight plan.
   */
  getLastIndexBeforeApproach() {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    return currentFlightPlan.length;
  }

  /**
   * Gets the approach runway from the current flight plan.
   */
  getApproachRunway() {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (currentFlightPlan.procedureDetails.approachSelected && currentFlightPlan.hasDestination) {
      const waypoints = currentFlightPlan.waypoints;
      return waypoints[waypoints.length - 1].infos.oneWayRunways[currentFlightPlan.procedureDetails.arrivalRunwayIndex];
    }

    return undefined;
  }

  /**
   * Gets the approach waypoints for the current flight plan.
   */
  getApproachWaypoints() {
    return this._flightPlans[this._currentFlightPlanIndex].approach.waypoints;
  }

  /**
   * Sets the approach transition index for the current flight plan.
   * @param {Number} index The index of the transition in the destination airport approach information.
   * @param {() => void} callback A callback to call when the operation completes.
   */
  setApproachTransitionIndex(index, callback = () => { }) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    currentFlightPlan.procedureDetails.approachTransitionIndex = index;

    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Removes the arrival segment from the current flight plan.
   * @param {() => void} callback A callback to call when the operation completes.
   */
  removeArrival(callback = () => { }) {
    this._flightPlans[this._currentFlightPlanIndex].clearApproach();
    
    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Activates direct-to an ICAO designated fix.
   * @param {String} icao The ICAO designation for the fix to fly direct-to.
   * @param {() => void} callback A callback to call when the operation completes.
   */
  async activateDirectTo(icao, callback = EmptyCallback.Void) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    const waypoint = this._parentInstrument.facilityLoader.getFacilityRaw(icao);
    
    currentFlightPlan.directTo.activateFromWaypoint(waypoint);
    this._updateFlightPlanVersion();
    callback();
  }

  /**
   * Cancels the current direct-to and proceeds back along the flight plan.
   * @param {() => void} callback A callback to call when the operation completes.
   */
  cancelDirectTo(callback = EmptyCallback.Void) {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    currentFlightPlan.directTo.cancel();

    callback();
  }

  /**
   * Gets whether or not the flight plan is current in a direct-to procedure.
   */
  getIsDirectTo() {
    return this._flightPlans[this._currentFlightPlanIndex].directTo.isActive;
  }

  /**
   * Gets the target of the direct-to procedure in the current flight plan.
   */
  getDirectToTarget() {
    const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
    if (currentFlightPlan.directTo.waypointIsInFlightPlan) {
      return currentFlightPlan.waypoints[currentFlightPlan.directTo.waypointIndex];
    }
    else {
      return currentFlightPlan.directTo.waypoint;
    }
  }

  /**
   * Gets the origin/start waypoint of the direct-to procedure in the current flight plan.
   */
  getDirecToOrigin() {
    return this._flightPlans[this._currentFlightPlanIndex].directTo.origin;
  }

  getCoordinatesHeadingAtDistanceAlongFlightPlan(distance) {
  }

  getCoordinatesAtNMFromDestinationAlongFlightPlan(distance) {
  }

  /**
   * Updates the synchronized flight plan version and saves it to shared storage.
   */
  _updateFlightPlanVersion() {
    SimVar.SetSimVarValue(FlightPlanManager.FlightPlanVersionKey, 'number', ++this._currentFlightPlanVersion);
    WTDataStore.set(FlightPlanManager.FlightPlanKey, JSON.stringify(this._flightPlans.map(fp => fp.copySanitized())));
  }
}
FlightPlanManager.FlightPlanKey = "WT.FlightPlan";
FlightPlanManager.FlightPlanVersionKey = "L:WT.FlightPlan.Version";