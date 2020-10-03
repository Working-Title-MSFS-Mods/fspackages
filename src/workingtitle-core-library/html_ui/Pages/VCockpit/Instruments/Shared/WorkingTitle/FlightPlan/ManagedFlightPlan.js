/**
 * A flight plan managed by the FlightPlanManager.
 */
class ManagedFlightPlan {

  constructor() {

    /**
     * The collection of waypoints in this flight plan.
     * @type {WayPoint[]}
     */
    this._waypoints = [];

    /**
     * The parent instrument this flight plan is attached to locally.
     * @type {BaseInstrument}
     */
    this._parentInstrument;

    /** Whether or not the flight plan has an origin airfield. */
    this._hasOrigin = false;

    /** Whether or not the flight plan has a destination airfield. */
    this._hasDestination = false;

    /** The index where the departure segment starts in the flight plan. */
    this.departureStart = 0;

    /** The index where the enroute segment starts in the flight plan. */
    this.enrouteStart = 0;

    /** The index where the arrival begins in the flight plan. */
    this.arrivalStart = 0;

    /** The index where the approach starts in the flight plan. */
    this.approachStart = 0;

    /** The cruise altitude for this flight plan. */
    this.cruiseAltitude = 0;

    /** The index of the currently active waypoint. */
    this.activeWaypointIndex = 0;

    /** The details for selected procedures on this flight plan. */
    this.procedureDetails = new ProcedureDetails();

    /** The details of any direct-to procedures on this flight plan. */
    this.directTo = new DirectTo();
  }

  /** The length of the flight plan */
  get length() { return this._waypoints.length; }

  /** The departure segment of the flight plan. */
  get departure() { return new FlightPlanSegment(0, this._waypoints.slice(0, this.enrouteStart)); }

  /** The enroute segment of the flight plan. */
  get enroute() { return new FlightPlanSegment(this.enrouteStart, this._waypoints.slice(this.enrouteStart, this.arrivalStart)); }

  /** The arrival segment of the flight plan. */
  get arrival() { return new FlightPlanSegment(this.arrivalStart, this._waypoints.slice(this.arrivalStart, this.approachStart)); }

  /** The approach segment of the flight plan. */
  get approach() { return new FlightPlanSegment(this.approachStart, this._waypoints.slice(this.approachStart, this._waypoints.length)); }

  /** The waypoints of the flight plan. */
  get waypoints() { [...this._waypoints]; }

  /** Whether the flight plan has an origin airfield. */
  get hasOrigin() { return this._hasOrigin; }

  /** Whether the flight plan has a destination airfield. */
  get hasDestination() { return this._hasDestination; }

  /** The currently active waypoint. */
  get activeWaypoint() { return this._waypoints[this.activeWaypointIndex]; }

  /**
   * Sets the parent instrument that the flight plan is attached to locally.
   * @param {BaseInstrument} instrument 
   */
  setParentInstrument(instrument) {
    this._parentInstrument = instrument;
  }

  /**
   * Clears the flight plan.
   */
  clearPlan() {
    this._waypoints = [];
    this._hasOrigin = undefined;
    this._destination = undefined;

    this.arrivalStart = 0;
    this.enrouteStart = 0;
    this.approachStart = 0;
    this.departureStart = 0;

    this.cruiseAltitude = 0;
    this.activeWaypointIndex = 0;
    
    this.procedureDetails = new ProcedureDetails();
  }

  /**
   * Adds a waypoint to the flight plan.
   * @param {WayPoint} waypoint The waypoint to add.
   * @param {Number} index The index to add the waypoint at. If ommitted or if larger than the
   * flight plan length, the waypoint will be appended to the end of the flight plan.
   */
  addWaypoint(waypoint, index) {
    if (index === undefined || index >= this._waypoints.length) {
      index = this._waypoints.length;
      this._waypoints.push()
    }
    else {
      this._waypoints.splice(index, 0, waypoint);
    }
    
    this._shiftSegmentIndexes(waypoint, index);
  }

  /**
   * Gets a waypoint by index from the flight plan.
   * @param {Number} index The index of the waypoint to get.
   */
  getWaypoint(index) {
    if (index >= 0 && index < this._waypoints.length) {
      return this._waypoints[index];
    }

    return undefined;
  }

  /**
   * Shifts waypoint segment indexes up after a waypoint addition.
   * @param {WayPoint} waypoint The waypoint that is being added.
   * @param {Number} index The index that the waypoint is being added at.
   */
  _shiftSegmentIndexes(waypoint, index) {
    if (index === 0 && waypoint.type === 'A') {
      this._hasOrigin = true;
      this.departureStart = 1;
      this.enrouteStart++;
      this.arrivalStart++;
      this.approachStart++;
    }
    else if (index === this._waypoints.length - 1 && this._waypoints.length > 1 && waypoint.type === 'A') {
      this._hasDestination = true;
    }
    else {
      if (index <= this.approachStart) this.approachStart++;
      if (index <= this.arrivalStart) this.arrivalStart++;
      if (index < this.enrouteStart) this.enrouteStart++;
    }

    if (index <= this.activeWaypointIndex) this.activeWaypointIndex++;
    if (this.directTo.isActive && this.directTo.waypointIsInFlightPlan && index < this.directTo.waypointIndex) {
      this.directTo.waypointIndex++;
    }
  }

  /**
   * Shifts waypoint segment indexes down after a waypoint addition.
   * @param {WayPoint} waypoint The waypoint that is being added.
   * @param {Number} index The index that the waypoint is being added at.
   */
  _unshiftSegmentIndexes(waypoint, index) {
    if (index === 0 && waypoint.type === 'A') {
      this._hasOrigin = false;
      this.departureStart = 0;
      this.enrouteStart--;
      this.arrivalStart--;
      this.approachStart--;
    }
    else if (index === this._waypoints.length - 1 && this._waypoints.length > 1 && waypoint.type === 'A') {
      this._hasDestination = false;
    }
    else {
      if (index >= this.approachStart) this.approachStart--;
      if (index >= this.arrivalStart) this.arrivalStart--;
      if (index > this.enrouteStart) this.enrouteStart--;
    }

    if (index <= this.activeWaypointIndex) this.activeWaypointIndex--;
    if (this.directTo.isActive && this.directTo.waypointIsInFlightPlan && index < this.directTo.waypointIndex) {
      this.directTo.waypointIndex--;
    }
  }

  /**
   * Adds a discontinuity to the flight plan.
   * @param {Number} index The index to add the discontinuity at. If ommitted or if larger than the
   * flight plan length, the waypoint will be appended to the end of the flight plan.
   */
  addDiscontinuity(index) {
    const discontinuity = new DiscontinuityWayPointInfo();
    const waypoint = new WayPoint(this._parentInstrument);

    waypoint.type = DiscontinuityWayPointInfo.WayPointType;
    waypoint.infos = discontinuity;

    this.addWaypoint(waypoint, index);
  }

  /**
   * Adds a vectors instruction to the flight plan.
   * @param {Number} index The index to add the vectors at. If ommitted or if larger than the
   * flight plan length, the waypoint will be appended to the end of the flight plan.
   */
  addVectors(index) {
    const vectors = new VectorsWayPointInfo();
    const waypoint = new WayPoint(this._parentInstrument);

    waypoint.type = VectorsWayPointInfo.WayPointType;
    waypoint.infos = vectors;

    this.addWaypoint(waypoint, index);
  }

  /**
   * Adds a bearing a distance waypoint to the flight plan.
   * @param {Number} bearing The bearing, in degrees, from the reference fix.
   * @param {Number} distance The distance, in NM, from the reference fix along the bearing.
   * @param {WayPoint} waypoint The reference fix for this bearing/distance waypoint.
   * @param {Number} index The index to add the waypoint at. If ommitted or if larger than the
   * flight plan length, the waypoint will be appended to the end of the flight plan.
   */
  addBearingAndDistance(bearing, distance, waypoint, index) {
    const bearingAndDistance = new BearingDistanceWayPointInfo();

    bearingAndDistance.bearing = bearing;
    bearingAndDistance.distance = distance;
    bearingAndDistance.referenceFix = waypoint;

    const bearingDistancewaypoint = new WayPoint(this._parentInstrument);
    waypoint.type = BearingDistanceWayPointInfo.WayPointType;
    waypoint.infos = bearingAndDistance;

    this.addWaypoint(bearingDistancewaypoint, index)
  }

  /**
   * Adds an altitude and turn waypoint to the flight plan.
   * @param {Number} altitude The altitude to target.
   * @param {Number} hasInbound Whether or not this waypoint has an inbound track.
   * @param {Number} hasOutbound Whether or not this waypoint has an outbound track.
   * @param {Number} inboundTrack The inbound track of the waypoint, if any.
   * @param {Number} outboundTrack The outbound track of the waypoint, if any.
   * @param {Number} index The index to add the waypoint at. If ommitted or if larger than the
   * flight plan length, the waypoint will be appended to the end of the flight plan.
   */
  addAltitudeTurn(altitude, hasInbound, hasOutbound, inboundTrack, outboundTrack, index) {
    const altitudeTurn = new AltitudeTurnWayPointInfo();

    altitudeTurn.coordinates = new LatLongAlt(0, 0, altitude);
    altitudeTurn.hasInboundTrack = hasInbound;
    altitudeTurn.hasOutboundTrack = hasOutbound;
    altitudeTurn.inboundTrack = inboundTrack;
    altitudeTurn.outboundTrack = outboundTrack;

    const waypoint = new WayPoint(this._parentInstrument);
    waypoint.type = AltitudeTurnWayPointInfo.WayPointType;
    waypoint.infos = altitudeTurn;

    this.addWaypoint(waypoint, index);
  }

  /**
   * Adds a radius about a reference fix to the flight plan.
   * @param {Number} radius The radius, in NM, around the reference fix. 
   * @param {WayPoint} waypoint The reference fix for this radius waypoint.
   * @param {Number} index The index to add the waypoint at. If ommitted or if larger than the
   * flight plan length, the waypoint will be appended to the end of the flight plan.
   */
  addRadius(radius, waypoint, index) {
    const radiusFix = new RadiusFixWayPointInfo();
    radiusFix.radius = radius;
    radiusFix.referenceFix = waypoint;

    const radiusWaypoint = new WayPoint(this._parentInstrument);
    waypoint.type = RadiusFixWayPointInfo.WayPointType;
    waypoint.infos = radiusFix;

    this.addWaypoint(radiusWaypoint, index);
  }

  /**
   * Removes a waypoint from the flight plan.
   * @param {Number} index The index of the waypoint to remove.
   */
  removeWaypoint(index) {
    if (index === undefined || index >= this._waypoints.length) {
      index = this._waypoints.length;
      this._waypoints.pop()
    }
    else {
      this._waypoints.splice(index, 1);
    }
    
    this._unshiftSegmentIndexes(waypoint, index);
  }

  /**
   * Copies a sanitized version of the flight plan for shared data storage.
   * @returns {ManagedFlightPlan} The sanitized flight plan.
   */
  copySanitized() {

    let sanitized = Object.assign({}, this);
    delete sanitized._parentInstrument;

    sanitized._waypoints = this._waypoints.map(waypoint => {
      let clone = Object.assign({}, waypoint);
      clone.infos = Object.assign({}, clone.infos);

      delete clone._svgElements;
      return clone;
    });

    sanitized;
  }

  /**
   * Copies the flight plan.
   * @returns {ManagedFlightPlan} The copied flight plan.
   */
  copy() {
    let newFlightPlan = Object.assign(new ManagedFlightPlan(), this);
    newFlightPlan._waypoints = [...this._waypoints];

    return newFlightPlan;
  }

  /**
   * Reverses the flight plan.
   */
  reverse() {
    //TODO: Fix flight plan indexes after reversal
    this._waypoints.reverse();
  }

  /**
   * Sets the departure from an index in the origin airport departure information.
   * @param {Number} index The index of the departure in the origin departures information.
   */
  setDepartureFromIndex(index) {
    if (this.hasOrigin) {
      const origin = this._waypoints[0];
      if (index >= 0 && index < origin.infos.departures.length) {
        this._waypoints.splice(1, this.enrouteStart - 1, origin.infos.departures[index]);
        
        this.procedureDetails.departureSelected = true;
        this.procedureDetails.departureFromOriginData = true;
        this.procedureDetails.departureIndex = index;
      }
    }
  }

  /**
   * Clears the departure from the flight plan.
   */
  clearDeparture() {
    if (this.procedureDetails.departureSelected = true) {
      this._waypoints.splice(1, this.enrouteStart - 1);

      this.procedureDetails.departureSelected = false;
      this.procedureDetails.departureFromOriginData = false;
      this.procedureDetails.departureIndex = 0;
      this.procedureDetails.departureTransitionIndex = 0;
    }
  }

  /**
   * Sets the arrival from an index in the destination airport arrival information.
   * @param {Number} index The index of the arrival in the destination arrivals information.
   */
  setArrivalFromIndex(index) {
    if (this.hasDestination) {
      const destination = this._waypoints[this._waypoints.length - 1];
      if (index >= 0 && index < destination.infos.arrivals.length) {
        this._waypoints.splice(this.arrivalStart, this.approachStart - this.arrivalStart, destination.infos.arrivals[index]);

        this.procedureDetails.arrivalSelected = true;
        this.procedureDetails.arrivalFromDestinationData = true;
        this.procedureDetails.arrivalIndex = index;
      }
    }
  }

  /**
   * Clears the arrival from the flight plan.
   */
  clearArrival() {
    if (this.procedureDetails.arrivalSelected = true) {
      this._waypoints.splice(this.arrivalStart, this.approachStart - this.arrivalStart);

      this.procedureDetails.arrivalSelected = false;
      this.procedureDetails.arrivalFromDestinationData = false;
      this.procedureDetails.arrivalIndex = 0;
      this.procedureDetails.arrivalTransitionIndex = 0;
    }
  }

  /**
   * Sets the approach from an index in the destination airport arrival information.
   * @param {Number} index The index of the approach in the destination approaches information.
   */
  setApproachFromIndex(index) {
    if (this.hasDestination) {
      const destination = this._waypoints[this._waypoints.length - 1];
      if (index >= 0 && index < destination.infos.approaches.length) {
        this._waypoints.splice(this.approachStart, this._waypoints.length - this.approachStart - 2, destination.infos.approaches[index]);

        this.procedureDetails.approachSelected = true;
        this.procedureDetails.approachFromDestinationData = true;
        this.procedureDetails.approachIndex = index;
      }
    }
  }

  /**
   * Clears the approach from the flight plan.
   */
  clearApproach() {
    if (this.procedureDetails.approachSelected = true) {
      this._waypoints.splice(this.approachStart, this._waypoints.length - this.approachStart - 2);

      this.procedureDetails.approachSelected = false;
      this.procedureDetails.approachFromDestinationData = false;
      this.procedureDetails.approachIndex = 0;
      this.procedureDetails.approachTransitionIndex = 0;
    }
  }
}

/**
 * A waypoint that represents a flight plan discontinuity.
 */
class DiscontinuityWayPointInfo extends WayPointInfo {

  constructor() {
    /** Whether or not the waypoint is a discontinuity. */
    this.isDiscontinuity = true;
  }
  
}
DiscontinuityWayPointInfo.WayPointType = "D";

/**
 * A waypoint that represents a radius about a reference fix.
 */
class RadiusFixWayPointInfo extends WayPointInfo {
  
  constructor() {
    /** The radius, in NM, around the reference fix. */
    this.radius = 0;

    /**
     * The reference fix for this radius waypoint.
     * @type {WayPoint}
     */
    this.referenceFix = {};
  }
  
}
RadiusFixWayPointInfo.WayPointType = "R"

/**
 * A waypoint that represents a bearing and distance from a reference fix.
 */
class BearingDistanceWayPointInfo extends WayPointInfo {
  
  constructor() {

    /** The bearing, in degrees, from the reference fix. */
    this.bearing = 0;

    /** The distance, in NM, from the reference fix along the bearing. */
    this.distance = 0;

    /**
     * The reference fix for this bearing/distance waypoint.
     * @type {WayPoint}
     */
    this.referenceFix = {};
  }
  
}
BearingDistanceWayPointInfo.WayPointType = "BD";

/**
 * A waypoint that represents an altitude instruction with optional inbound
 * and outbound tracks.
 */
class AltitudeTurnWayPointInfo extends WayPointInfo {

  constructor() {
    /** Whether or not this waypoint has a specific inbound track. */
    this.hasInboundTrack = false;

    /** The bearing, in degress, of the inbound track. */
    this.inboundTrack = 0;

    /** Whether or not this waypoint has an outbound track. */
    this.hasOutboundTrack = false;

    /** The bearing, in degrees, of the outbound track. */
    this.outboundTrack = 0;
  }
  
}
AltitudeTurnWayPointInfo.WayPointType = "ALT";

/**
 * A waypoint that represents a vectors instruction.
 */
class VectorsWayPointInfo extends WayPointInfo {

  constructor() {
    /** Whether or not this waypoint is a vectors instruction. */
    this.isVectors = true;
  }

}
VectorsWayPointInfo.WayPointType = "VEC";

/**
 * A segment of a flight plan.
 */
class FlightPlanSegment {

  /**
   * Creates a new FlightPlanSegment.
   * @param {Number} offset The offset within the original flight plan that
   * the segment starts at.
   * @param {WayPoint[]} waypoints The waypoints in the flight plan segment. 
   */
  constructor(offset, waypoints) {

    /** The offset within the original flight plan that the segments starts at. */
    this.offset = offset;

    /** The waypoints in the flight plan segment. */
    this.waypoints = waypoints;
  }
}

/**
 * The details of procedures selected in the flight plan.
 */
class ProcedureDetails {

  constructor() {
    /** Whether or not a departure has been selected for the flight plan. */
    this.departureSelected = false;

    /** Whether or not the departure has been taken from origin airport information. */
    this.departureFromOriginData = false;

    /** The index of the departure in the origin airport information. */
    this.departureIndex = 0;

    /** The index of the departure transition in the origin airport departure information. */
    this.departureTransitionIndex = 0;

    /** The index of the selected runway in the original airport departure information. */
    this.departureRunwayIndex = 0;

    /** Whether or not an arrival has been selected for the flight plan. */
    this.arrivalSelected = false;

    /** Whether or not the arrival has been taken from destination airport information. */
    this.arrivalFromDestinationData = false;

    /** The index of the arrival in the destination airport information. */
    this.arrivalIndex = 0;

    /** The index of the arrival transition in the destination airport arrival information. */
    this.arrivalTransitionIndex = 0;

    /** The index of the selected runway at the destination airport. */
    this.arrivalRunwayIndex = 0;

    /** Whether or not an approach has been selected for the flight plan. */
    this.approachSelected = false;

    /** Whether or not the approach has been taken from destination airport information. */
    this.approachFromDestinationData = false;

    /** The index of the apporach in the destination airport information.*/
    this.approachIndex = 0;

    /** The index of the approach transition in the destination airport approach information.*/
    this.approachTransitionIndex = 0;
  }
}

/**
 * Information about the current direct-to procedures in the flight plan.
 */
class DirectTo {
  constructor() {

    /** Whether or not the current direct-to is in the flight plan. */
    this.waypointIsInFlightPlan = false;

    /** Whether or not direct-to is active. */
    this.isActive = false;

    /**
     * The current direct-to waypoint, if not part of the flight plan.
     * @type {WayPoint}
     */
    this.waypoint = {};

    /** The current direct-to waypoint index, if part of the flight plan. */
    this.waypointIndex = 0;

    /**
     * The origin created when direct-to is activated.
     * @type {WayPoint}
     */
    this.origin = {}
  }

  /**
   * Activates direct-to with an external waypoint.
   * @param {WayPoint} waypoint The waypoint to fly direct-to.
   */
  activateFromWaypoint(waypoint) {
    this.isActive = true;
    this.waypoint = waypoint;
    this.waypointIsInFlightPlan = false;
  }

  /**
   * Cancels direct-to. 
   */
  cancel() {
    this.isActive = false;
    this.waypointIsInFlightPlan = false;

    this.waypoint = {};
    this.origin = {};
  }

  /**
   * Activates direct-to a waypoint already in the flight plan.
   * @param {Number} index The index of the waypoint in the flight plan.
   */
  activateFromIndex(index) {
    this.isActive = true;
    this.waypointIsInFlightPlan = true;
    this.waypointIndex = index;
  }
}