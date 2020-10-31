/**
 * A flight plan managed by the FlightPlanManager.
 */
class ManagedFlightPlan {

  constructor() {

    /**
     * The parent instrument this flight plan is attached to locally.
     * @type {BaseInstrument}
     */
    this._parentInstrument;

    /**
     * Whether or not the flight plan has an origin airfield.
     * @type {WayPoint}
     */
    this.originAirfield;

    /**
     * Whether or not the flight plan has a destination airfield.
     * @type {WayPoint}
     */
    this.destinationAirfield;

    /** The cruise altitude for this flight plan. */
    this.cruiseAltitude = 0;

    /** The index of the currently active waypoint. */
    this.activeWaypointIndex = 0;

    /** The details for selected procedures on this flight plan. */
    this.procedureDetails = new ProcedureDetails();

    /** The details of any direct-to procedures on this flight plan. */
    this.directTo = new DirectTo();

    /** The current active segments of the flight plan. */
    this._segments = [new FlightPlanSegment(FlightPlanSegment.Enroute, 0, [])];

    /** The length of the flight plan. */
    this.length = 0;
  }

  /** The departure segment of the flight plan. */
  get departure() { return this.getSegment(FlightPlanSegment.Departure); }

  /** The enroute segment of the flight plan. */
  get enroute() { return this.getSegment(FlightPlanSegment.Enroute); }

  /** The arrival segment of the flight plan. */
  get arrival() { return this.getSegment(FlightPlanSegment.Arrival); }

  /** The approach segment of the flight plan. */
  get approach() { return this.getSegment(FlightPlanSegment.Approach); }

  /** The approach segment of the flight plan. */
  get missed() { return this.getSegment(FlightPlanSegment.Missed); }

  /** The waypoints of the flight plan. */
  get waypoints() { 
    const waypoints = [];
    if (this.originAirfield) {
      waypoints.push(this.originAirfield);
    }

    for (var segment of this._segments) {
      waypoints.push(...segment.waypoints);
    }

    if (this.destinationAirfield) {
      waypoints.push(this.destinationAirfield);
    }

    return waypoints;
  }

  /** Whether the flight plan has an origin airfield. */
  get hasOrigin() { return this.originAirfield; }

  /** Whether the flight plan has a destination airfield. */
  get hasDestination() { return this.destinationAirfield; }

  /** The currently active waypoint. */
  get activeWaypoint() { return this.waypoints[this.activeWaypointIndex]; }

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
    
    this.originAirfield = undefined;
    this.destinationAirfield = undefined;

    this.cruiseAltitude = 0;
    this.activeWaypointIndex = 0;
    this.length = 0;
    
    this.procedureDetails = new ProcedureDetails();
    this.directTo = new DirectTo();

    await GPS.clearPlan();
    this._segments = [new FlightPlanSegment(FlightPlanSegment.Enroute, 0, [])];
  }

  /**
   * Syncs the flight plan to FS9GPS.
   */
  async syncToGPS() {
    await GPS.clearPlan();
    for (var i = 0; i < this.waypoints.length; i++) {
      const waypoint = this.waypoints[i];

      if (waypoint.icao && waypoint.icao.trim() !== '') {
        await GPS.addIcaoWaypoint(waypoint.icao, i);
      }
      else {
        await GPS.addUserWaypoint(waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long, i, waypoint.ident);
      }
    }

    await GPS.setActiveWaypoint(this.activeWaypointIndex);
    await GPS.logCurrentPlan();
  }

  /**
   * Adds a waypoint to the flight plan.
   * @param {WayPoint} waypoint The waypoint to add.
   * @param {Number} index The index to add the waypoint at. If ommitted the waypoint will 
   * be appended to the end of the flight plan.
   */
  addWaypoint(waypoint, index) {

    const mappedWaypoint = (waypoint instanceof WayPoint) ? waypoint : RawDataMapper.toWaypoint(waypoint, this._parentInstrument);
    if (mappedWaypoint.type === 'A' && index === 0) {
      this.originAirfield = mappedWaypoint;
      this.length++;

      this.reflowSegments();
      this.reflowDistances();
    }
    else if (mappedWaypoint.type === 'A' && index === undefined) {
      this.destinationAirfield = mappedWaypoint;
      this.length++;
    }
    else {
      const segment = this.findSegmentByWaypointIndex(index);

      if (segment) {

        if (index > this.length) {
          index = undefined;
        }   

        if (index !== undefined) {
          const segmentIndex = index - segment.offset;
          if (segmentIndex < segment.waypoints.length) {
            segment.waypoints.splice(index, 0, mappedWaypoint);
          }
          else {
            segment.waypoints.push(mappedWaypoint);
          }
        }
        else {
          segment.waypoints.push(mappedWaypoint);
        }

        this.length++;

        this.reflowSegments();
        this.reflowDistances();
      }
    }
  }

  /**
   * Removes a waypoint from the flight plan.
   * @param {Number} index The index of the waypoint to remove.
   */
  removeWaypoint(index) {

    if (this.originAirfield && index === 0) {
      this.originAirfield = undefined;
      this.length--;

      this.reflowSegments();
      this.reflowDistances();
    }
    else if (this.destinationAirfield && index === this.length - 1) {
      this.destinationAirfield = undefined;
      this.length--;
    }
    else {
      const segment = this.findSegmentByWaypointIndex(index);
      if (segment) {
        segment.waypoints.splice(index - segment.offset, 1);
        this.length--;
        
        if (segment.waypoints === 0 && segment.type !== FlightPlanSegment.Enroute) {
          this.removeSegment(segment.type);
        }

        this.reflowSegments();
        this.reflowDistances();
      }
    }
  }

  /**
   * Gets a waypoint by index from the flight plan.
   * @param {Number} index The index of the waypoint to get.
   */
  getWaypoint(index) {
    const segment = this.findSegmentByWaypointIndex(index);
    if (segment) {
      return segment.waypoints[index - segment.offset];
    }
  }

  /**
   * Adds a plan segment to the flight plan.
   * @param {Number} type The type of the segment to add.
   */
  addSegment(type) {
    const segment = new FlightPlanSegment(type, 0, []);
    this._segments.push(segment);

    this._segments.sort((a, b) => a.type - b.type);
    this.reflowSegments();

    return segment;
  }

  /**
   * Removes a plan segment from the flight plan.
   * @param {Number} type The type of plan segment to remove.
   */
  removeSegment(type) {
    const segmentIndex = this._segments.findIndex(s => s.type === type);
    this._segments.splice(segmentIndex, 1);
  }

  /**
   * Reflows waypoint index offsets accross plans segments.
   */
  reflowSegments() {
    let index = 0;
    if (this.originAirfield) {
      index = 1;
    }

    for (var segment of this._segments) {
      segment.offset = index;
      index += segment.waypoints.length;
    }
  }

  /**
   * Gets a flight plan segment of the specified type.
   * @param {Number} type The type of flight plan segment to get.
   * @returns {FlightPlanSegment} The found segment, or FlightPlanSegment.Empty if not found. 
   */
  getSegment(type) {
    const segment = this._segments.find(s => s.type === type);
    return segment !== undefined ? segment : FlightPlanSegment.Empty;
  }

  /**
   * Finds a flight plan segment by waypoint index.
   * @param {Number} index The index of the waypoint to find the segment for.
   * @returns {FlightPlanSegment} The located segment, if any. 
   */
  findSegmentByWaypointIndex(index) {
    for (var i = 0; i < this._segments.length; i++) {
      if (this._segments[i].offset <= index) {
        return this._segments[i];
      }
    }
  }

  /**
   * Recalculates all waypoint bearings and distances in the flight plan.
   */
  reflowDistances() {
    let cumulativeDistance = 0;
    let waypoints = this.waypoints;

    for (var i = 0; i < waypoints.length; i++) {
      if (i > 0) {

        //If there's an approach selected and this is the last approach waypoint, use the destination waypoint for coordinates
        //Runway waypoints do not have coordinates
        const referenceWaypoint = waypoints[i];
        const waypoint = (this.procedureDetails.approachSelected && i === waypoints.length - 2) ? waypoints[i + 1] : waypoints[i];
        const prevWaypoint = (this.procedureDetails.approachSelected && i === waypoints.length - 1) ? waypoints[i - 2] : waypoints[i - 1];

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
   * Copies a sanitized version of the flight plan for shared data storage.
   * @returns {ManagedFlightPlan} The sanitized flight plan.
   */
  copySanitized() {

    let sanitized = Object.assign({}, this);
    delete sanitized._parentInstrument;

    if (sanitized.originAirfield) {
      sanitized.originAirfield = Object.assign({}, sanitized.originAirfield);
      delete sanitized.originAirfield.instrument;
      delete sanitized.originAirfield.infos.instrument;
      delete sanitized.originAirfield.infos._svgElements;
    }

    if (sanitized.destinationAirfield) {
      sanitized.destinationAirfield = Object.assign({}, sanitized.destinationAirfield);
      delete sanitized.destinationAirfield.instrument;
      delete sanitized.destinationAirfield.infos.instrument;
      delete sanitized.destinationAirfield.infos._svgElements;
    }

    for (var i = 0; i < sanitized._segments.length; i++) {
      const segment = Object.assign({}, sanitized._segments[i]);
      segment.waypoints = segment.waypoints.map(waypoint => {
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

      sanitized._segments[i] = segment;
    }

    return sanitized;
  }

  /**
   * Copies the flight plan.
   * @returns {ManagedFlightPlan} The copied flight plan.
   */
  copy() {
    let newFlightPlan = Object.assign(new ManagedFlightPlan(), this);
    newFlightPlan._segments = [...newFlightPlan._segments];

    for (var segment of newFlightPlan._segments) {
      segment.waypoints = [...segment.waypoints];
    }

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
   * Builds a departure into the flight plan from indexes in the departure airport information.
   */
  async buildDeparture() {
      const legs = [];
      const origin = this.originAirfield;

      const departureIndex = this.procedureDetails.departureIndex;
      const runwayIndex = this.procedureDetails.departureRunwayIndex;
      const transitionIndex = this.procedureDetails.departureTransitionIndex;

      if (departureIndex !== -1 && runwayIndex !== -1) {
        const runwayTransition = origin.infos.departures[departureIndex].runwayTransitions[runwayIndex];
        legs.push(...runwayTransition.legs); 
      }

      if (departureIndex !== -1) {
        legs.push(...origin.infos.departures[departureIndex].commonLegs);
      }

      if (transitionIndex !== -1 && departureIndex !== -1) {
        const transition = origin.infos.departures[departureIndex].enRouteTransitions[transitionIndex].legs;
        legs.push(...transition);
      }

      let segment = this.departure;
      if (segment !== FlightPlanSegment.Empty) {
        for (var i = 0; i < segment.waypoints.length; i++) {
          this.removeWaypoint(segment.offset);
        }

        this.removeSegment(segment.type);
      }
      
      if (legs.length > 0) {
        segment = this.addSegment(FlightPlanSegment.Departure);
        const procedure = new LegsProcedure(legs, origin, this._parentInstrument);

        let waypointIndex = segment.offset;
        while (procedure.hasNext()) {
          this.addWaypoint(await procedure.getNext(), ++waypointIndex);
        }
      } 
  }

  /**
   * Builds an arrival into the flight plan from indexes in the arrival airport information.
   */
  async buildArrival() {
    const legs = [];
    const destination = this.destinationAirfield;

    const arrivalIndex = this.procedureDetails.arrivalIndex;
    const arrivalRunwayIndex = this.procedureDetails.arrivalRunwayIndex;
    const arrivalTransitionIndex = this.procedureDetails.arrivalTransitionIndex;

    if (arrivalIndex !== -1 && arrivalTransitionIndex !== -1) {
      const transition = destination.infos.arrivals[arrivalIndex].enRouteTransitions[arrivalTransitionIndex].legs;
      legs.push(...transition);
    }

    if (arrivalIndex !== -1) {
      legs.push(...destination.infos.arrivals[arrivalIndex].commonLegs);
    }

    if (arrivalIndex !== -1 && arrivalRunwayIndex !== -1) {
      const runwayTransition = destination.infos.arrivals[arrivalIndex].runwayTransitions[arrivalRunwayIndex];
      legs.push(...runwayTransition.legs);
    }

    let segment = this.arrival;
    if (segment !== FlightPlanSegment.Empty) {
      for (var i = 0; i < this.arrival.waypoints.length; i++) {
        this.removeWaypoint(segment.offset);
      }

      this.removeSegment(segment.type);
    }
    
    if (legs.length > 0) {
      segment = this.addSegment(FlightPlanSegment.Arrival);
      const procedure = new LegsProcedure(legs, this.getWaypoint(segment.offset - 1), this._parentInstrument);

      let waypointIndex = segment.offset;
      while (procedure.hasNext()) {
        this.addWaypoint(await procedure.getNext(), ++waypointIndex);
      }
    }
  }

  /**
   * Builds an approach into the flight plan from indexes in the arrival airport information.
   */
  async buildApproach() {
    const legs = [];
    const destination = this.destinationAirfield;

    const approachIndex = this.procedureDetails.approachIndex;
    const approachTransitionIndex = this.procedureDetails.approachTransitionIndex;

    if (approachIndex !== -1 && approachTransitionIndex !== -1) {
      const transition = destination.infos.approaches[approachIndex].transitions[approachTransitionIndex].legs;
      legs.push(...transition);
    }

    if (approachIndex !== -1) {
      legs.push(...destination.infos.approaches[approachIndex].finalLegs);
    }

    let segment = this.approach;
    if (segment !== FlightPlanSegment.Approach) {
      for (var i = 0; i < segment.waypoints.length; i++) {
        this.removeWaypoint(segment.offset);
      }

      this.removeSegment(segment.type);
    }
    
    if (legs.length > 0) {
      segment = this.addSegment(FlightPlanSegment.Approach);
      const procedure = new LegsProcedure(legs, this.getWaypoint(segment.offset - 1), this._parentInstrument);

      let waypointIndex = segment.offset;
      while (procedure.hasNext()) {
        this.addWaypoint(await procedure.getNext(), ++waypointIndex);
      }
    }  
  }
}

/**
 * Converts a plain object into a ManagedFlightPlan.
 * @param {*} flightPlanObject The object to convert.
 * @param {BaseInstrument} parentInstrument The parent instrument attached to this flight plan.
 * @returns {ManagedFlightPlan} The converted ManagedFlightPlan.
 */
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
        default:
          obj = Object.assign(new WayPointInfo(parentInstrument), obj);
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
 * Methods for interacting with the FS9GPS subsystem.
 */
class GPS {

  /**
   * Clears the FS9GPS flight plan.
   */
  static async clearPlan() {
    const totalGpsWaypoints = SimVar.GetSimVarValue('C:fs9gps:FlightPlanWaypointsNumber', 'number');
    for (var i = 0; i < totalGpsWaypoints; i++) {

      //Always remove waypoint 0 here, which shifts the rest of the waypoints down one
      await GPS.deleteWaypoint(0);
    }
  }

  /**
   * Adds a waypoint to the FS9GPS flight plan by ICAO designation.
   * @param {String} icao The MSFS ICAO to add to the flight plan.
   * @param {Number} index The index of the waypoint to add in the flight plan.
   */
  static async addIcaoWaypoint(icao, index) {
    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanNewWaypointICAO', 'string', icao);
    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanAddWaypoint', 'number', index);
  }

  /**
   * Adds a user waypoint to the FS9GPS flight plan.
   * @param {Number} lat The latitude of the user waypoint.
   * @param {Number} lon The longitude of the user waypoint.
   * @param {Number} index The index of the waypoint to add in the flight plan.
   * @param {String} ident The ident of the waypoint.
   */
  static async addUserWaypoint(lat, lon, index, ident) {
    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanNewWaypointLatitude', 'degrees', lat);
    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanNewWaypointLongitude', 'degrees', lon);

    if (ident) {
      await SimVar.SetSimVarValue('C:fs9gps:FlightPlanNewWaypointIdent', 'string', ident);
    }

    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanAddWaypoint', 'number', index); 
  }

  /**
   * Deletes a waypoint from the FS9GPS flight plan.
   * @param {Number} index The index of the waypoint in the flight plan to delete.
   */
  static async deleteWaypoint(index) {
    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanDeleteWaypoint', 'number', index);
  }

  /**
   * Sets the active FS9GPS waypoint.
   * @param {Number} index The index of the waypoint to set active.
   */
  static async setActiveWaypoint(index) {
    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanActiveWaypoint', 'number', index); 
  }

  /**
   * Gets the active FS9GPS waypoint.
   */
  static getActiveWaypoint() {
    return SimVar.GetSimVarValue('C:fs9gps:FlightPlanActiveWaypoint', 'number'); 
  }

  /**
   * Logs the current FS9GPS flight plan.
   */
  static async logCurrentPlan() {
    const waypointIdents = [];
    const totalGpsWaypoints = SimVar.GetSimVarValue('C:fs9gps:FlightPlanWaypointsNumber', 'number');

    for (var i = 0; i < totalGpsWaypoints; i++) {
      await SimVar.SetSimVarValue('C:fs9gps:FlightPlanWaypointIndex', 'number', i);
      waypointIdents.push(SimVar.GetSimVarValue('C:fs9gps:FlightPlanWaypointIdent', 'string'));
    }

    console.log(`GPS Plan: ${waypointIdents.join(' ')}`);
  }
}

/**
 * The details of procedures selected in the flight plan.
 */
class ProcedureDetails {

  constructor() {
    /** The index of the origin runway in the origin runway information. */
    this.originRunwayIndex = -1;

    /** The index of the departure in the origin airport information. */
    this.departureIndex = -1;

    /** The index of the departure transition in the origin airport departure information. */
    this.departureTransitionIndex = -1;

    /** The index of the selected runway in the original airport departure information. */
    this.departureRunwayIndex = -1;

    /** The index of the arrival in the destination airport information. */
    this.arrivalIndex = -1;

    /** The index of the arrival transition in the destination airport arrival information. */
    this.arrivalTransitionIndex = -1;

    /** The index of the selected runway at the destination airport. */
    this.arrivalRunwayIndex = -1;

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
    this.origin = {};
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
   * @param {Number} type The type of the flight plan segment.
   * @param {Number} offset The offset within the original flight plan that
   * the segment starts at.
   * @param {WayPoint[]} waypoints The waypoints in the flight plan segment. 
   */
  constructor(type, offset, waypoints) {

    /** The name for this flight plan segment. */
    this.type = type;

    /** The offset within the original flight plan that the segments starts at. */
    this.offset = offset;

    /** The waypoints in the flight plan segment. */
    this.waypoints = waypoints;
  }
}

FlightPlanSegment.Origin = 0;
FlightPlanSegment.Departure = 1;
FlightPlanSegment.Enroute = 2;
FlightPlanSegment.Arrival = 3;
FlightPlanSegment.Approach = 4;
FlightPlanSegment.Missed = 5;
FlightPlanSegment.Destination = 6;

FlightPlanSegment.Empty = new FlightPlanSegment(-1, -1, []);

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
      waypoint.infos.approaches.forEach(approach => 
        approach.transitions.forEach(trans => trans.name = trans.legs[0].fixIcao.substring(7, 12).trim()));

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
    this._previousFix = startingPoint;

    /**
     * The instrument that is attached to the flight plan.
     */
    this._instrument = instrument;

    /**
     * The current index in the procedure.
     */
    this._currentIndex = 0;

    /**
     * Whether or not there is a discontinuity pending to be mapped.
     */
    this._isDiscontinuityPending = false;

    /**
     * A collection of the loaded facilities needed for this procedure.
     * @type {Map<String, any>}
     */
    this._facilities = new Map();

    /**
     * Whether or not the facilities have completed loading.
     */
    this._facilitiesLoaded = false;

    /**
     * The collection of facility promises to await on first load.
     */
    this._facilitiesToLoad = new Map();

    for (var leg of this._legs) {
      if (leg.fixIcao.trim() !== '' && !this._facilitiesToLoad.has(leg.fixIcao)) {
        this._facilitiesToLoad.set(leg.fixIcao, this._instrument.facilityLoader.getFacilityRaw(leg.fixIcao, 2000));
      }

      if (leg.originIcao.trim() !== '' && !this._facilitiesToLoad.has(leg.originIcao)) {
        this._facilitiesToLoad.set(leg.originIcao, this._instrument.facilityLoader.getFacilityRaw(leg.originIcao, 2000));
      }
    }
  }

  /**
   * Checks whether or not there are any legs remaining in the procedure.
   * @returns {Boolean} True if there is a next leg, false otherwise.
   */
  hasNext() {
    return this._currentIndex < this._legs.length || this._isDiscontinuityPending;
  }

  /**
   * Gets the next mapped leg from the procedure.
   * @returns {WayPoint} The mapped waypoint from the leg of the procedure.
   */
  async getNext() {   
    let isLegMappable = false;
    let mappedLeg;

    if (!this._facilitiesLoaded) {
      const facilityResults = await Promise.all(this._facilitiesToLoad.values());
      for (var facility of facilityResults.filter(f => f !== undefined)) {
        this._facilities.set(facility.icao, facility);
      }

      this._facilitiesLoaded = true;
    }

    while (!isLegMappable) {
      const currentLeg = this._legs[this._currentIndex];
      isLegMappable = true;

      if (this._isDiscontinuityPending) {
        mappedLeg = this.mapDiscontinuity(this._previousFix);
        this._isDiscontinuityPending = false;
      }
      else {
        switch (currentLeg.type) {
          case 3:
            mappedLeg = this.mapHeadingUntilDistanceFromOrigin(currentLeg, this._previousFix);
            break;
          case 4:
            mappedLeg = this.mapOriginRadialForDistance(currentLeg, this._previousFix);
            break;
          case 5:
            mappedLeg = this.mapHeadingToInterceptNextLeg(currentLeg, this._previousFix, this._legs[this._currentIndex + 1]);
            break;
          case 6:
            mappedLeg = this.mapHeadingUntilRadialCrossing(currentLeg, this._previousFix);
            break;
          case 9:
            mappedLeg = this.mapBearingAndDistanceFromOrigin(currentLeg, this._previousFix);
            break;
          case 11:
            mappedLeg = this.mapVectors(currentLeg, this._previousFix);
            break;
          case 7:
          case 15:
          case 17:
          case 18:
            mappedLeg = this.mapExactFix(currentLeg, this._previousFix);
            break;
          case 2:
          case 19:
            mappedLeg = this.mapHeadingUntilAltitude(currentLeg, this._previousFix);
            break;
          default:
            isLegMappable = false;
            break;
        }

        this._currentIndex++;
      }
    }

    this._previousFix = mappedLeg;
    return mappedLeg;
  }

  /**
   * Maps a heading until distance from origin leg.
   * @param {*} leg The procedure leg to map. 
   * @param {WayPoint} prevLeg The previously mapped waypoint in the procedure.
   * @returns {WayPoint} The mapped leg.
   */
  mapHeadingUntilDistanceFromOrigin(leg, prevLeg) {
    const origin = this._facilities.get(leg.originIcao);
    const originIdent = origin.icao.substring(7, 12).trim();

    const bearingToOrigin = Avionics.Utils.computeGreatCircleHeading(prevLeg.infos.coordinates, new LatLongAlt(origin.lat, origin.lon));
    const distanceToOrigin = Avionics.Utils.computeGreatCircleDistance(prevLeg.infos.coordinates, new LatLongAlt(origin.lat, origin.lon)) / LegsProcedure.distanceNormalFactorNM;

    const deltaAngle = this.deltaAngleRadians(bearingToOrigin, leg.course);
    const targetDistance = (leg.distance / 1852) / LegsProcedure.distanceNormalFactorNM;

    const distanceAngle = Math.asin((Math.sin(distanceToOrigin) * Math.sin(deltaAngle)) / Math.sin(targetDistance));
    const inverseDistanceAngle = Math.PI - distanceAngle;

    const legDistance1 = 2 * Math.atan(Math.tan(0.5 * (targetDistance - distanceToOrigin)) * (Math.sin(0.5 * (deltaAngle + distanceAngle)) 
      / Math.sin(0.5 * (deltaAngle - distanceAngle))));

    const legDistance2 = 2 * Math.atan(Math.tan(0.5 * (targetDistance - distanceToOrigin)) * (Math.sin(0.5 * (deltaAngle + inverseDistanceAngle)) 
      / Math.sin(0.5 * (deltaAngle - inverseDistanceAngle))));

    const legDistance = targetDistance > distanceToOrigin ? legDistance1 : Math.min(legDistance1, legDistance2);
    const coordinates = Avionics.Utils.bearingDistanceToCoordinates(leg.course, legDistance * LegsProcedure.distanceNormalFactorNM, prevLeg.infos.coordinates.lat, prevLeg.infos.coordinates.long);

    return this.buildWaypoint(`${originIdent}${Math.trunc(legDistance * LegsProcedure.distanceNormalFactorNM)}`, coordinates);
  }

  /**
   * Maps a bearing/distance fix in the procedure.
   * @param {*} leg The procedure leg to map.
   * @returns {WayPoint} The mapped leg.
   */
  mapBearingAndDistanceFromOrigin(leg) {
    const origin = this._facilities.get(leg.originIcao);
    const originIdent = origin.icao.substring(7, 12).trim();
    const coordinates = Avionics.Utils.bearingDistanceToCoordinates(leg.course, leg.distance / 1852, origin.lat, origin.lon);

    return this.buildWaypoint(`${originIdent}${Math.trunc(leg.distance / 1852)}`, coordinates);
  }

  /**
   * Maps a radial on the origin for a specified distance leg in the procedure.
   * @param {*} leg The procedure leg to map.
   * @param {WayPoint} prevLeg The previously mapped leg.
   * @returns {Waypoint} The mapped leg.
   */
  mapOriginRadialForDistance(leg, prevLeg) {
    if (leg.fixIcao.trim() !== '') {
      return this.mapExactFix(leg);
    }
    else {
      const origin = this._facilities.get(leg.originIcao);
      const originIdent = origin.icao.substring(7, 12).trim();
      const coordinates = Avionics.Utils.bearingDistanceToCoordinates(leg.course, leg.distance / 1852, prevLeg.infos.coordinates.lat, prevLeg.infos.coordinates.long);

      const distanceFromOrigin = Avionics.Utils.computeGreatCircleDistance(new LatLongAlt(origin.lat, origin.lon), coordinates);
      return this.buildWaypoint(`${originIdent}${Math.trunc(distanceFromOrigin / 1852)}`, coordinates);
    }
  }

  /**
   * Maps a heading turn to intercept the next leg in the procedure.
   * @param {*} leg The procedure leg to map. 
   * @param {WayPoint} prevLeg The previously mapped leg.
   * @param {*} nextLeg The next leg in the procedure to intercept.
   * @returns {WayPoint} The mapped leg.
   */
  mapHeadingToInterceptNextLeg(leg, prevLeg, nextLeg) {
    let referenceCoordinates;
    let courseToIntercept;
    let referenceFix;

    switch (nextLeg.type) {
      case 4:
      case 7:
      case 15:
      case 17:
      case 18:
        referenceFix = this._facilities.get(nextLeg.fixIcao);
        referenceCoordinates = new LatLongAlt(referenceFix.lat, referenceFix.lon);
        courseToIntercept = nextLeg.course - 180;
        if (courseToIntercept < 0) {
          courseToIntercept += 360;
        }
        break;
      case 9:
        referenceFix = this._facilities.get(nextLeg.originIcao);
        referenceCoordinates = new LatLongAlt(referenceFix.lat, referenceFix.lon);
        courseToIntercept = nextLeg.course;
        break;
    }

    if (referenceCoordinates !== undefined && courseToIntercept !== undefined) {
      const distanceFromOrigin = Avionics.Utils.computeGreatCircleDistance(prevLeg.infos.coordinates, referenceCoordinates);
      const bearingToOrigin = Avionics.Utils.computeGreatCircleHeading(prevLeg.infos.coordinates, referenceCoordinates);
      const bearingFromOrigin = Avionics.Utils.computeGreatCircleHeading(referenceCoordinates, prevLeg.infos.coordinates);

      let ang1 = this.deltaAngleRadians(bearingToOrigin, leg.course);
      let ang2 = this.deltaAngleRadians(bearingFromOrigin, courseToIntercept);
      let ang3 = Math.acos(Math.sin(ang1) * Math.sin(ang2) * Math.cos(distanceFromOrigin / LegsProcedure.distanceNormalFactorNM) - Math.cos(ang1) * Math.cos(ang2));

      let legDistance = Math.acos((Math.cos(ang1) + Math.cos(ang2) * Math.cos(ang3)) / (Math.sin(ang2) * Math.sin(ang3))) * LegsProcedure.distanceNormalFactorNM;
      const coordinates = Avionics.Utils.bearingDistanceToCoordinates(leg.course, legDistance, prevLeg.infos.coordinates.lat, prevLeg.infos.coordinates.long);

      return this.buildWaypoint(`T${leg.course}${referenceFix.icao.substring(7, 12).trim()}`, coordinates);
    }
  }

  /**
   * Maps flying a heading until crossing a radial of a reference fix.
   * @param {*} leg The procedure leg to map.
   * @param {WayPoint} prevLeg The previously mapped leg.
   * @returns {WayPoint} The mapped leg.
   */
  mapHeadingUntilRadialCrossing(leg, prevLeg) {
    const origin = this._facilities.get(leg.originIcao);
    const originCoordinates = new LatLongAlt(origin.lat, origin.lon);

    const originToCoordinates = Avionics.Utils.computeGreatCircleHeading(originCoordinates, prevLeg.infos.coordinates);
    const coordinatesToOrigin = Avionics.Utils.computeGreatCircleHeading(prevLeg.infos.coordinates, new LatLongAlt(origin.lat, origin.lon));
    const distanceToOrigin = Avionics.Utils.computeGreatCircleDistance(prevLeg.infos.coordinates, originCoordinates) / LegsProcedure.distanceNormalFactorNM;

    const alpha = this.deltaAngleRadians(coordinatesToOrigin, leg.course);
    const beta = this.deltaAngleRadians(originToCoordinates, leg.theta);

    const gamma = Math.acos(Math.sin(alpha) * Math.sin(beta) * Math.cos(distanceToOrigin) - Math.cos(alpha) * Math.cos(beta));
    const legDistance = Math.acos((Math.cos(beta) + Math.cos(alpha) * Math.cos(gamma)) / (Math.sin(alpha) * Math.sin(gamma)));

    const coordinates = Avionics.Utils.bearingDistanceToCoordinates(leg.course, legDistance * LegsProcedure.distanceNormalFactorNM, prevLeg.infos.coordinates.lat, prevLeg.infos.coordinates.long);
    return this.buildWaypoint(`${this.getIdent(origin.icao)}${leg.theta}`, coordinates);
  }

  /**
   * Maps flying a heading until a proscribed altitude.
   * @param {*} leg The procedure leg to map. 
   * @param {WayPoint} prevLeg The previous leg in the procedure.
   * @returns {WayPoint} The mapped leg.
   */
  mapHeadingUntilAltitude(leg, prevLeg) {
    const altitudeFeet = (leg.altitude1 * 3.2808399);
    const distanceInNM = altitudeFeet / 500.0;
    const coordinates = Avionics.Utils.bearingDistanceToCoordinates(leg.course, distanceInNM, prevLeg.infos.coordinates.lat, prevLeg.infos.coordinates.long);

    return this.buildWaypoint(`A${Math.trunc(altitudeFeet)}`, coordinates);
  }

  /**
   * Maps a vectors instruction.
   * @param {*} leg The procedure leg to map.
   * @param {WayPoint} prevLeg The previous leg in the procedure.
   * @returns {WayPoint} The mapped leg.
   */
  mapVectors(leg, prevLeg) {
    const coordinates = Avionics.Utils.bearingDistanceToCoordinates(leg.course, 2.5, prevLeg.infos.coordinates.lat, prevLeg.infos.coordinates.long);

    const waypoint =  this.buildWaypoint('(VECT)', coordinates);
    waypoint.isVectors = true;

    this._isDiscontinuityPending = true;
    return waypoint;
  }

  /**
   * Maps an exact fix leg in the procedure.
   * @param {*} leg The procedure leg to map.
   * @returns {WayPoint} The mapped leg.
   */
  mapExactFix(leg) {
    const facility = this._facilities.get(leg.fixIcao);
    if (facility) {
      return RawDataMapper.toWaypoint(facility, this._instrument);
    }
    else {
      const origin = this._facilities.get(leg.originIcao);
      const originIdent = origin.icao.substring(7, 12).trim();

      const coordinates = Avionics.Utils.bearingDistanceToCoordinates(leg.theta, leg.rho / 1852, origin.lat, origin.lon);
      return this.buildWaypoint(`${originIdent}${Math.trunc(leg.rho / 1852)}`, coordinates);
    }
  }

  /**
   * Maps a flight plan discontinuity.
   * @param {Waypoint} prevLeg The previous leg in the procedure.
   * @returns {Waypoint} The mapped flight plan discontinuity.
   */
  mapDiscontinuity(prevLeg) {
    const waypoint = this.buildWaypoint('DISCO', prevLeg.infos.coordinates);
    waypoint.isDiscontinuity = true;

    return waypoint;
  }

  /**
   * Gets the difference between two headings in zero north normalized radians.
   * @param {Number} a The degrees of heading a. 
   * @param {Number} b The degrees of heading b.
   * @returns {Number} The difference between the two headings in zero north normalized radians.
   */
  deltaAngleRadians(a, b) {
    return Math.abs((Avionics.Utils.fmod((a - b) + 180, 360) - 180) * Avionics.Utils.DEG2RAD);
  }

  /**
   * Gets an ident from an ICAO.
   * @param {String} icao The icao to pull the ident from.
   * @returns {String} The parsed ident. 
   */
  getIdent(icao) {
    return icao.substring(7, 12).trim();
  }

  /**
   * Builds a WayPoint from basic data.
   * @param {String} ident The ident of the waypoint.
   * @param {LatLongAlt} coordinates The coordinates of the waypoint. 
   */
  buildWaypoint(ident, coordinates) {
    const waypoint = new WayPoint(this._instrument);
    waypoint.type = 'W';

    waypoint.infos = new IntersectionInfo(this._instrument);
    waypoint.infos.coordinates = coordinates;

    waypoint.ident = ident;
    waypoint.infos.ident = ident;

    return waypoint;
  }
}

/** A factor used to normalize globe distances for use in spherical triangular ratios. */
LegsProcedure.distanceNormalFactorNM = (21639 / 2) * Math.PI;