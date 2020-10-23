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
  get waypoints() { return [...this._waypoints]; }

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
  async clearPlan() {
    
    this._hasOrigin = false;
    this._hasDestination = false;

    this.arrivalStart = 0;
    this.enrouteStart = 0;
    this.approachStart = 0;
    this.departureStart = 0;

    this.cruiseAltitude = 0;
    this.activeWaypointIndex = 0;
    
    this.procedureDetails = new ProcedureDetails();
    this.directTo = new DirectTo();

    for (var i = 0; i < this._waypoints.length; i++) {
      await SimVar.SetSimVarValue('C:fs9gps:FlightPlanDeleteWaypoint', 'number', i);
    }

    this._waypoints = [];
  }

  /**
   * Adds a waypoint to the flight plan.
   * @param {WayPoint} waypoint The waypoint to add.
   * @param {Number} index The index to add the waypoint at. If ommitted or if larger than the
   * flight plan length, the waypoint will be appended to the end of the flight plan.
   * @param {Boolean} replace Whether or not to replace the waypoint at the specified index
   * instead of inserting or appending.
   */
  async addWaypoint(waypoint, index) {

    const mappedWaypoint = RawDataMapper.toWaypoint(waypoint, this._parentInstrument);

    if (index === undefined || index >= this._waypoints.length) {
      this._waypoints.push(mappedWaypoint);
      index = this._waypoints.length - 1;
    }
    else {
      this._waypoints.splice(index, 0, mappedWaypoint);
    }

    if (mappedWaypoint.icao && mappedWaypoint.icao.trim() !== '') {
      await SimVar.SetSimVarValue('C:fs9gps:FlightPlanNewWaypointICAO', 'string', waypoint.icao);
      await SimVar.SetSimVarValue('C:fs9gps:FlightPlanAddWaypoint', 'number', index);
    }
    
    this._shiftSegmentIndexes(mappedWaypoint, index);
    this._reflowDistances();
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

    if (index < this.activeWaypointIndex) this.activeWaypointIndex++;
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
   * Recalculates all waypoint bearings and distances in the flight plan.
   */
  _reflowDistances() {
    let cumulativeDistance = 0;

    for (var i = 0; i < this._waypoints.length; i++) {
      if (i > 0) {

        //If there's an approach selected and this is the last approach waypoint, use the destination waypoint for coordinates
        //Runway waypoints do not have coordinates
        const referenceWaypoint = this._waypoints[i];
        const waypoint = (this.procedureDetails.approachSelected && i === this._waypoints.length - 2) ? this._waypoints[i + 1] : this._waypoints[i];
        const prevWaypoint = (this.procedureDetails.approachSelected && i === this._waypoints.length - 1) ? this._waypoints[i - 2] : this._waypoints[i - 1];

        referenceWaypoint.bearingInFP = Avionics.Utils.computeGreatCircleHeading(prevWaypoint.infos.coordinates, waypoint.infos.coordinates);
        referenceWaypoint.distanceInFP = Avionics.Utils.computeGreatCircleDistance(prevWaypoint.infos.coordinates, waypoint.infos.coordinates);
        
        cumulativeDistance += referenceWaypoint.distanceInFP;
        referenceWaypoint.cumulativeDistanceInFP = cumulativeDistance;
      }
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

    const computedCoordinates = this.computeCoordsFromBearingAndDistance(waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long, bearing, distance);
    bearingAndDistance.coordinates = new LatLongAlt(computedCoordinates.lat, computedCoordinates.lon);

    const bearingDistancewaypoint = new WayPoint(this._parentInstrument);
    waypoint.type = BearingDistanceWayPointInfo.WayPointType;
    waypoint.infos = bearingAndDistance;

    this.addWaypoint(bearingDistancewaypoint, index);
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
  async removeWaypoint(index) {
    let waypoint;

    if (index === undefined || index >= this._waypoints.length) {
      index = this._waypoints.length;
      waypoint = this._waypoints.pop()
    }
    else {
      waypoint = this._waypoints[index];
      this._waypoints.splice(index, 1);
    }

    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanDeleteWaypoint', 'number', index);
    
    this._unshiftSegmentIndexes(waypoint, index);
    this._reflowDistances();
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

      const visitObject = (obj) => {

        if (Array.isArray(obj)) {
          obj = [...obj];
        }
        else {
          obj = Object.assign({}, obj);
        }

        delete obj.instrument;
        delete obj._svgElements;

        for(var key in obj) {
          if (typeof obj[key] === 'object') {
            obj[key] = visitObject(obj[key]);
          }
        }

        return obj;
      };

      clone = visitObject(clone);
      return clone;
    });

    return sanitized;
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
  async setDepartureFromIndex(index) {
    if (this.hasOrigin) {
      const origin = this._waypoints[0];

      if (index >= 0 && index < origin.infos.departures.length) {
        this.procedureDetails.departureIndex = index;

        if (this.procedureDetails.departureRunwayIndex !== -1) {
          await this._insertDepartureFromIndexes();
        }
      }
    }
  }

  /**
   * Sets the departure runway transition from an index in the origin airport departure information.
   * @param {Number} index The index of the runway transition in the origin departures information.
   */
  async setDepartureRunwayFromIndex(index) {
    if (this.hasOrigin) {
      const origin = this._waypoints[0];
      if (index >= 0 && index < origin.infos.oneWayRunways.length) {
        this.procedureDetails.departureRunwayIndex = index;

        if (this.procedureDetails.departureIndex !== -1) {
          await this._insertDepartureFromIndexes();
        }
      }
    }
  }

  /**
   * Inserts a departure into the flight plan from indexes in the departure airport information.
   */
  async _insertDepartureFromIndexes() {
      const legs = [];
      const origin = this._waypoints[0];

      const departureIndex = this.procedureDetails.departureIndex;
      const runwayIndex = this.procedureDetails.departureRunwayIndex;
      const transitionIndex = this.procedureDetails.departureTransitionIndex;

      const runwayTransition = origin.infos.departures[departureIndex].runwayTransitions[runwayIndex];

      for (var i = 0; i < runwayTransition.legs.length; i++) {
        if (runwayTransition.legs[i].fixIcao.trim() !== "") {
          const legWaypoint = await this._parentInstrument.facilityLoader.getFacilityRaw(runwayTransition.legs[i].fixIcao);
          legs.push(legWaypoint);
        }
      }

      this._waypoints.splice(1, this.enrouteStart - 1, ...legs);
      const numWaypointsDiff = legs.length - (this.enrouteStart - this.departureStart);

      this.enrouteStart += numWaypointsDiff;
      this.arrivalStart += numWaypointsDiff;
      this.approachStart += numWaypointsDiff;
      
      this.procedureDetails.departureSelected = true;
      this.procedureDetails.departureFromOriginData = true;

      this._reflowDistances();
  }

  /**
   * Clears the departure from the flight plan.
   */
  clearDeparture() {
    if (this.procedureDetails.departureSelected === true) {
      this._waypoints.splice(1, this.enrouteStart - 1);

      this.procedureDetails.departureSelected = false;
      this.procedureDetails.departureFromOriginData = false;
      this.procedureDetails.departureIndex = -1;
      this.procedureDetails.departureTransitionIndex = -1;
      this.procedureDetails.departureRunwayIndex = -1;
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
    if (this.procedureDetails.arrivalSelected === true) {
      this._waypoints.splice(this.arrivalStart, this.approachStart - this.arrivalStart);

      this.procedureDetails.arrivalSelected = false;
      this.procedureDetails.arrivalFromDestinationData = false;
      this.procedureDetails.arrivalIndex = -1;
      this.procedureDetails.arrivalTransitionIndex = -1;
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

        const fixCache = new Map();
        for (var leg of destination.infos.approaches[index].legs) {

        }

        this._waypoints.splice(this.approachStart, this._waypoints.length - this.approachStart - 2, ...destination.infos.approaches[index].wayPoints);

        this.procedureDetails.approachSelected = true;
        this.procedureDetails.approachFromDestinationData = true;
        this.procedureDetails.approachIndex = index;

        this._reflowDistances();
      }
    }
  }

  /**
   * Clears the approach from the flight plan.
   */
  clearApproach() {
    if (this.procedureDetails.approachSelected === true) {
      this._waypoints.splice(this.approachStart, this._waypoints.length - this.approachStart - 2);

      this.procedureDetails.approachSelected = false;
      this.procedureDetails.approachFromDestinationData = false;
      this.procedureDetails.approachIndex = -1;
      this.procedureDetails.approachTransitionIndex = -1;
      this.procedureDetails.arrivalRunwayIndex = -1;
    }
  }
}
ManagedFlightPlan.fromObject = (flightPlanObject, parentInstrument) => {
  let plan = Object.assign(new ManagedFlightPlan(), flightPlanObject);
  plan.setParentInstrument(parentInstrument);

  plan.directTo = Object.assign(new DirectTo(), plan.directTo);


  const mapObject = (obj, parentType) => {
    if (obj&& obj.infos) {
      obj = Object.assign(new WayPoint(parentInstrument), obj);          
    }

    if(obj && obj.coordinates) {
      switch (parentType) {
        case 'A':
          obj = Object.assign(new AirportInfo(parentInstrument), obj);
          break;
        case 'W':
          obj = Object.assign(new IntersectionInfo(parentInstrument), obj);
          break;
        case 'V':
          obj = Object.assign(new VORInfo(parentInstrument), obj);
          break;
        case 'N':
          obj = Object.assign(new NDBInfo(parentInstrument), obj);
          break;
      }
      
      obj.coordinates = Object.assign(new LatLongAlt(), obj.coordinates);
    }

    return obj;
  };

  const visitObject = (obj) => {
    for(var key in obj) {
      if (typeof obj[key] === 'object' && obj[key] && obj[key].scroll === undefined) {
        if (Array.isArray(obj[key])) {
          visitArray(obj[key]);
        }
        else {  
          visitObject(obj[key]);
        }

        obj[key] = mapObject(obj[key], obj.type);
      }
    }
  };

  const visitArray = (array) => {
    array.forEach((item, index) => {
      if (Array.isArray(item)) {
        visitArray(item);      
      }
      else if (typeof item === 'object') {
        visitObject(item);
      }

      array[index] = mapObject(item);
    });
  };

  visitObject(plan);
  return plan;
};

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
    this.departureIndex = -1;

    /** The index of the departure transition in the origin airport departure information. */
    this.departureTransitionIndex = -1;

    /** The index of the selected runway in the original airport departure information. */
    this.departureRunwayIndex = -1;

    /** Whether or not an arrival has been selected for the flight plan. */
    this.arrivalSelected = false;

    /** Whether or not the arrival has been taken from destination airport information. */
    this.arrivalFromDestinationData = false;

    /** The index of the arrival in the destination airport information. */
    this.arrivalIndex = -1;

    /** The index of the arrival transition in the destination airport arrival information. */
    this.arrivalTransitionIndex = -1;

    /** The index of the selected runway at the destination airport. */
    this.arrivalRunwayIndex = -1;

    /** Whether or not an approach has been selected for the flight plan. */
    this.approachSelected = false;

    /** Whether or not the approach has been taken from destination airport information. */
    this.approachFromDestinationData = false;

    /** The index of the apporach in the destination airport information.*/
    this.approachIndex = -1;

    /** The index of the approach transition in the destination airport approach information.*/
    this.approachTransitionIndex = -1;
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
 * A waypoint that represents a flight plan discontinuity.
 */
class DiscontinuityWayPointInfo extends WayPointInfo {

  constructor() {
    super();

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
    super();

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
    super();

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
    super();

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
    super();

    /** Whether or not this waypoint is a vectors instruction. */
    this.isVectors = true;
  }

}
VectorsWayPointInfo.WayPointType = "VEC";

/** A class for mapping raw facility data to WayPoints. */
class RawDataMapper { }

/**
 * Maps a raw facility record to a WayPoint.
 * @param {*} facility The facility record to map.
 * @param {BaseInstrument} instrument The instrument to attach to the WayPoint.
 * @returns {WayPoint} The mapped waypoint.
 */
RawDataMapper.toWaypoint = (facility, instrument) => {
  const waypoint = new WayPoint(instrument);

  waypoint.ident = facility.icao.substring(7, 12).trim();
  waypoint.icao = facility.icao;
  waypoint.type = facility.icao[0];

  switch (waypoint.type) {
    case 'A':
      waypoint.infos = new AirportInfo(instrument);

      waypoint.infos.approaches = facility.approaches;
      //waypoint.infos.approaches.forEach(approach => 
      //  approach.runwayTransitions.forEach(trans => trans.name = RawDataMapper.generateRunwayTransitionName(trans)));

      waypoint.infos.departures = facility.departures;
      waypoint.infos.departures.forEach(departure => 
        departure.runwayTransitions.forEach(trans => trans.name = RawDataMapper.generateRunwayTransitionName(trans)));

      waypoint.infos.arrivals = facility.arrivals;
      waypoint.infos.arrivals.forEach(arrival => 
        arrival.runwayTransitions.forEach(trans => trans.name = RawDataMapper.generateRunwayTransitionName(trans)));

      waypoint.infos.runways = facility.runways;

      waypoint.infos.oneWayRunways = [];
      facility.runways.forEach(runway => waypoint.infos.oneWayRunways.push(...Object.assign(new Runway(), runway).splitIfTwoWays()));

      waypoint.infos.oneWayRunways.sort(RawDataMapper.sortRunways);

      break;
    case 'V':
      waypoint.infos = new VORInfo(instrument);
      break;
    case 'N':
      waypoint.infos = new NDBInfo(instrument);
      break;
    case 'W':
      waypoint.infos = new IntersectionInfo(instrument);
      break;
    default:
      waypoint.infos = new WayPointInfo(instrument);
      break;
  }

  waypoint.infos.coordinates = new LatLongAlt(facility.lat, facility.lon);
  return waypoint;
};

/**
 * A comparer for sorting runways by number, and then by L, C, and R.
 * @param {*} r1 The first runway to compare.
 * @param {*} r2 The second runway to compare.
 * @returns {Number} -1 if the first is before, 0 if equal, 1 if the first is after.
 */
RawDataMapper.sortRunways = (r1, r2) => {
  if (parseInt(r1.designation) === parseInt(r2.designation)) {
    let v1 = 0;
    if (r1.designation.indexOf("L") != -1) {
        v1 = 1;
    }
    else if (r1.designation.indexOf("C") != -1) {
        v1 = 2;
    }
    else if (r1.designation.indexOf("R") != -1) {
        v1 = 3;
    }
    let v2 = 0;
    if (r2.designation.indexOf("L") != -1) {
        v2 = 1;
    }
    else if (r2.designation.indexOf("C") != -1) {
        v2 = 2;
    }
    else if (r2.designation.indexOf("R") != -1) {
        v2 = 3;
    }
    return v1 - v2;
  }
  return parseInt(r1.designation) - parseInt(r2.designation);
};

/**
 * Generates a runway transition name from the designated runway in the transition data.
 * @param {*} runwayTransition The runway transition to generate the name for.
 * @returns {String} The runway transition name.
 */
RawDataMapper.generateRunwayTransitionName = (runwayTransition) => {
  let name = `RW${runwayTransition.runwayNumber}`;

  switch (runwayTransition.runwayDesignation) {
      case 1:
          name += "L";
          break;
      case 2:
          name += "R";
          break;
      case 3:
          name += "C";
          break;
  }

  return name;
};

/**
 * Creates a collection of waypoints from a legs procedure.
 */
class LegsProcedure {
  /**
   * Creates an instance of a LegsProcedure.
   * @param {Array} legs The legs that are part of the procedure.
   * @param {WayPoint} startingPoint The starting point for the procedure.
   * @param {BaseInstrument} instrument The instrument that is attached to the flight plan.
   */
  constructor(legs, startingPoint, instrument) {
    /**
     * The legs that are part of this procedure.
     */
    this._legs = legs;

    /**
     * The starting point for the procedure.
     */
    this._startingPoint = startingPoint;

    /**
     * The instrument that is attached to the flight plan.
     */
    this._instrument = instrument;
  }

  [Symbol.iterator]() {
    let index = 0;
    let prevFix = this._startingPoint;

    return {
      next: () => {
        while (true) {
          if (index < this._legs.length) {
            const leg = this._legs[index];
            index++;
  
            switch (leg.type) {
              case 2:
                break;
              case 3:
                prevFix = this.mapHeadingForDistance(leg, prevFix);
                return {value: prevFix, done: false};
            }
          }
          else {
            return {done: true};
          }         
        }
      }
    };
  }

  mapHeadingForDistance(leg, prevFix) {
    
  }
}