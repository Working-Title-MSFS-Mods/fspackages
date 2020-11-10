import { SegmentType, FlightPlanSegment } from './FlightPlanSegment';
import { LegsProcedure } from './LegsProcedure';
import { RawDataMapper } from './RawDataMapper';
import { GPS }  from './GPS';
import { ProcedureDetails } from './ProcedureDetails';
import { DirectTo } from './DirectTo';
import { WayPoint, BaseInstrument, WayPointInfo, VORInfo, NDBInfo, IntersectionInfo, AirportInfo, LatLongAlt, Avionics, SimVar, OneWayRunway } from 'MSFS';

/**
 * A flight plan managed by the FlightPlanManager.
 */
export class ManagedFlightPlan {

  /** Whether or not the flight plan has an origin airfield. */
  public originAirfield?: WayPoint;

  /** Whether or not the flight plan has a destination airfield. */
  public destinationAirfield?: WayPoint;

  /** The cruise altitude for this flight plan. */
  public cruiseAltitude: number = 0;

  /** The index of the currently active waypoint. */
  public activeWaypointIndex: number = 0;

  /** The details for selected procedures on this flight plan. */
  public procedureDetails: ProcedureDetails = new ProcedureDetails();

  /** The details of any direct-to procedures on this flight plan. */
  public directTo: DirectTo = new DirectTo();

  /** The length of the flight plan. */
  public length: number = 0;

  /** The departure segment of the flight plan. */
  public get departure(): FlightPlanSegment { return this.getSegment(SegmentType.Departure); }

  /** The enroute segment of the flight plan. */
  public get enroute(): FlightPlanSegment { return this.getSegment(SegmentType.Enroute); }

  /** The arrival segment of the flight plan. */
  public get arrival(): FlightPlanSegment { return this.getSegment(SegmentType.Arrival); }

  /** The approach segment of the flight plan. */
  public get approach(): FlightPlanSegment { return this.getSegment(SegmentType.Approach); }

  /** The approach segment of the flight plan. */
  public get missed(): FlightPlanSegment { return this.getSegment(SegmentType.Missed); }

  /** Whether the flight plan has an origin airfield. */
  public get hasOrigin() { return this.originAirfield; }

  /** Whether the flight plan has a destination airfield. */
  public get hasDestination() { return this.destinationAirfield; }

  /** The currently active waypoint. */
  public get activeWaypoint() { return this.waypoints[this.activeWaypointIndex]; }

  /** The parent instrument this flight plan is attached to locally. */
  private _parentInstrument?: BaseInstrument;

  /** The current active segments of the flight plan. */
  private _segments: FlightPlanSegment[] = [new FlightPlanSegment(SegmentType.Enroute, 0, [])];

  /** The waypoints of the flight plan. */
  public get waypoints(): WayPoint[] { 
    const waypoints: WayPoint[] = [];
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

  /** The non-approach waypoints of the flight plan. */
  public get nonApproachWaypoints(): WayPoint[] { 
    const waypoints = [];
    if (this.originAirfield) {
      waypoints.push(this.originAirfield);
    }

    for (var segment of this._segments.filter(s => s.type < SegmentType.Approach)) {
      waypoints.push(...segment.waypoints);
    }

    return waypoints;
  }

  /**
   * Sets the parent instrument that the flight plan is attached to locally.
   * @param instrument The instrument that the flight plan is attached to.
   */
  public setParentInstrument(instrument: BaseInstrument): void {
    this._parentInstrument = instrument;
  }

  /**
   * Clears the flight plan.
   */
  public async clearPlan(): Promise<void> {
    
    this.originAirfield = undefined;
    this.destinationAirfield = undefined;

    this.cruiseAltitude = 0;
    this.activeWaypointIndex = 0;
    this.length = 0;
    
    this.procedureDetails = new ProcedureDetails();
    this.directTo = new DirectTo();

    await GPS.clearPlan();
    this._segments = [new FlightPlanSegment(SegmentType.Enroute, 0, [])];
  }

  /**
   * Syncs the flight plan to FS9GPS.
   */
  public async syncToGPS(): Promise<void> {
    await GPS.clearPlan();
    for (var i = 0; i < this.waypoints.length; i++) {
      const waypoint = this.waypoints[i];

      if (waypoint.icao && waypoint.icao.trim() !== '') {
        await GPS.addIcaoWaypoint(waypoint.icao, i);
      }
      else {
        await GPS.addUserWaypoint(waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long, i, waypoint.ident);
      }

      if (waypoint.endsInDiscontinuity) {
        break;
      }
    }

    await GPS.setActiveWaypoint(this.activeWaypointIndex);
    await GPS.logCurrentPlan();
  }

  /**
   * Adds a waypoint to the flight plan.
   * @param waypoint The waypoint to add.
   * @param index The index to add the waypoint at. If ommitted the waypoint will
   * be appended to the end of the flight plan.
   * @param segmentType The type of segment to add the waypoint to.
   */
  public addWaypoint(waypoint: WayPoint, index?: number | undefined, segmentType?: SegmentType): void {

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
      const segment = segmentType !== undefined
        ? this.getSegment(segmentType)
        : this.findSegmentByWaypointIndex(index);

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

    if (this.activeWaypointIndex === 0 && this.originAirfield) {
      this.activeWaypointIndex = 1;
    }
  }

  /**
   * Removes a waypoint from the flight plan.
   * @param index The index of the waypoint to remove.
   */
  public removeWaypoint(index: number): void {

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
        
        if (segment.waypoints.length === 0 && segment.type !== SegmentType.Enroute) {
          this.removeSegment(segment.type);
        }

        this.reflowSegments();
        this.reflowDistances();
      }
    }
  }

  /**
   * Gets a waypoint by index from the flight plan.
   * @param index The index of the waypoint to get.
   */
  public getWaypoint(index: number): WayPoint {
    if (this.originAirfield && index === 0) {
      return this.originAirfield;
    }

    if (this.destinationAirfield && index === this.length - 1) {
      return this.destinationAirfield;
    }

    const segment = this.findSegmentByWaypointIndex(index);
    if (segment) {
      return segment.waypoints[index - segment.offset];
    }
  }

  /**
   * Adds a plan segment to the flight plan.
   * @param type The type of the segment to add.
   */
  public addSegment(type: SegmentType): FlightPlanSegment {
    const segment = new FlightPlanSegment(type, 0, []);
    this._segments.push(segment);

    this._segments.sort((a, b) => a.type - b.type);
    this.reflowSegments();

    return segment;
  }

  /**
   * Removes a plan segment from the flight plan.
   * @param type The type of plan segment to remove.
   */
  public removeSegment(type: SegmentType): void {
    const segmentIndex = this._segments.findIndex(s => s.type === type);
    this._segments.splice(segmentIndex, 1);
  }

  /**
   * Reflows waypoint index offsets accross plans segments.
   */
  public reflowSegments(): void {
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
   * @param type The type of flight plan segment to get.
   * @returns The found segment, or FlightPlanSegment.Empty if not found. 
   */
  public getSegment(type: number): FlightPlanSegment {
    const segment = this._segments.find(s => s.type === type);
    return segment !== undefined ? segment : FlightPlanSegment.Empty;
  }

  /**
   * Finds a flight plan segment by waypoint index.
   * @param index The index of the waypoint to find the segment for.
   * @returns The located segment, if any. 
   */
  public findSegmentByWaypointIndex(index: number): FlightPlanSegment {
    for (var i = 0; i < this._segments.length; i++) {
      if (this._segments[i].offset > index) {
        return this._segments[Math.max(0, i - 1)];
      }
    }

    return this._segments[this._segments.length - 1];
  }

  /**
   * Recalculates all waypoint bearings and distances in the flight plan.
   */
  public reflowDistances(): void {
    let cumulativeDistance = 0;
    let waypoints = this.waypoints;

    for (var i = 0; i < waypoints.length; i++) {
      if (i > 0) {

        //If there's an approach selected and this is the last approach waypoint, use the destination waypoint for coordinates
        //Runway waypoints do not have coordinates
        const referenceWaypoint = waypoints[i];
        const prevWaypoint = waypoints[i - 1];

        referenceWaypoint.bearingInFP = Avionics.Utils.computeGreatCircleHeading(prevWaypoint.infos.coordinates, referenceWaypoint.infos.coordinates);
        referenceWaypoint.distanceInFP = Avionics.Utils.computeGreatCircleDistance(prevWaypoint.infos.coordinates, referenceWaypoint.infos.coordinates);
        
        cumulativeDistance += referenceWaypoint.distanceInFP;
        referenceWaypoint.cumulativeDistanceInFP = cumulativeDistance;
      }
    }
  }

  /**
   * Copies a sanitized version of the flight plan for shared data storage.
   * @returns The sanitized flight plan.
   */
  public copySanitized(): ManagedFlightPlan {

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
   * @returns The copied flight plan.
   */
  public copy(): ManagedFlightPlan {
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
  public reverse(): void {
    //TODO: Fix flight plan indexes after reversal
    //this._waypoints.reverse();
  }

  /**
   * Goes direct to the specified 
   * @param icao 
   */
  public async goDirectToIcao(icao: string): Promise<void> {
    const facility = await this._parentInstrument.facilityLoader.getFacilityRaw(icao);
    if (facility !== undefined) {
      const mappedFacility = RawDataMapper.toWaypoint(facility, this._parentInstrument);
      const interceptPoints = this.calculateDirectIntercept(mappedFacility);

      this.directTo.waypoint = mappedFacility;
      this.directTo.interceptPoints = interceptPoints;
      this.directTo.isActive = true;

      for (var i = 0; i < this.waypoints.length; i++) {
        this.removeWaypoint(0);
      }

      for (var i = 0; i < this.directTo.interceptPoints.length + 1; i ++) {
        if (i < this.directTo.interceptPoints.length) {
          this.addWaypoint(this.directTo.interceptPoints[i], i);
        }
        else {
          this.addWaypoint(this.directTo.waypoint, i);
        }
      }

      await GPS.setActiveWaypoint(0);
      this.activeWaypointIndex = 0;

      await this.syncToGPS();
    }
  }

  /**
   * Calculates an intercept path to a direct-to waypoint.
   * @param waypoint The waypoint to calculate the path to.
   * @returns The waypoints that make up the intercept path.
   */
  public calculateDirectIntercept(waypoint: WayPoint): WayPoint[] {
    const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
    const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");

    const planeCoords = new LatLongAlt(lat, long);

    const groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
    const planeHeading = SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "Radians") * Avionics.Utils.RAD2DEG;

    const headingToFix = Avionics.Utils.computeGreatCircleHeading(planeCoords, waypoint.infos.coordinates);
    let angleDiff = Avionics.Utils.angleDiff(planeHeading, headingToFix);

    const turnDurationSeconds = (angleDiff / 3) + 6;
    const interceptDistance = (groundSpeed / 60) * turnDurationSeconds;

    const createInterceptPoint = (coords: LatLongAlt) => {
      const interceptWaypoint = new WayPoint(this._parentInstrument);
      interceptWaypoint.ident = waypoint.ident;

      interceptWaypoint.infos = new IntersectionInfo(this._parentInstrument);
      interceptWaypoint.infos.coordinates = coords;

      return interceptWaypoint;
    };

    if (angleDiff < 90 && angleDiff > -90) {
      const coords = Avionics.Utils.bearingDistanceToCoordinates(planeHeading, interceptDistance, lat, long);
      return [createInterceptPoint(planeCoords), createInterceptPoint(coords)];
    }
    else {
      const coords1 = Avionics.Utils.bearingDistanceToCoordinates(planeHeading, interceptDistance / 2, lat, long);
      const coords2 = Avionics.Utils.bearingDistanceToCoordinates(planeHeading + (angleDiff / 2), interceptDistance / 2, coords1.lat, coords1.long);

      return [createInterceptPoint(planeCoords), createInterceptPoint(coords1), createInterceptPoint(coords2)];
    }
  }

  /**
   * Builds a departure into the flight plan from indexes in the departure airport information.
   */
  public async buildDeparture(): Promise<void> {
      const legs = [];
      const origin = this.originAirfield;

      const departureIndex = this.procedureDetails.departureIndex;
      const runwayIndex = this.procedureDetails.departureRunwayIndex;
      const transitionIndex = this.procedureDetails.departureTransitionIndex;

      const selectedOriginRunwayIndex = this.procedureDetails.originRunwayIndex;

      const airportInfo = origin.infos as AirportInfo;

      if (departureIndex !== -1 && runwayIndex !== -1) {
        const runwayTransition = airportInfo.departures[departureIndex].runwayTransitions[runwayIndex];
        legs.push(...runwayTransition.legs); 
      }

      if (departureIndex !== -1) {
        legs.push(...airportInfo.departures[departureIndex].commonLegs);
      }

      if (transitionIndex !== -1 && departureIndex !== -1) {
        const transition = airportInfo.departures[departureIndex].enRouteTransitions[transitionIndex].legs;
        legs.push(...transition);
      }

      let segment = this.departure;
      if (segment !== FlightPlanSegment.Empty) {
        for (var i = 0; i < segment.waypoints.length; i++) {
          this.removeWaypoint(segment.offset);
        }

        this.removeSegment(segment.type);
      }
      
      if (legs.length > 0 || selectedOriginRunwayIndex !== -1 || (departureIndex !== -1 && runwayIndex !== -1)) {
        segment = this.addSegment(SegmentType.Departure);
        let procedure = new LegsProcedure(legs, origin, this._parentInstrument);

        let runway;
        if (selectedOriginRunwayIndex !== -1) {
          runway = airportInfo.oneWayRunways[selectedOriginRunwayIndex];
        }
        else if (runwayIndex !== -1) {
          runway = this.getRunway(airportInfo.oneWayRunways, airportInfo.departures[departureIndex].runwayTransitions[runwayIndex].name);
        }
        
        if (runway) {
          const runwayWaypoint = procedure.buildWaypoint(`RW${runway.designation}`, runway.endCoordinates);
          this.addWaypoint(runwayWaypoint, undefined, segment.type);

          procedure = new LegsProcedure(legs, runwayWaypoint, this._parentInstrument);
        }

        let waypointIndex = segment.offset;
        while (procedure.hasNext()) {
          this.addWaypoint(await procedure.getNext(), ++waypointIndex, segment.type);
        }
      } 
  }

  /**
   * Builds an arrival into the flight plan from indexes in the arrival airport information.
   */
  public async buildArrival(): Promise<void> {
    const legs = [];
    const destination = this.destinationAirfield;

    const arrivalIndex = this.procedureDetails.arrivalIndex;
    const arrivalRunwayIndex = this.procedureDetails.arrivalRunwayIndex;
    const arrivalTransitionIndex = this.procedureDetails.arrivalTransitionIndex;

    const destinationInfo = destination.infos as AirportInfo;

    if (arrivalIndex !== -1 && arrivalTransitionIndex !== -1) {
      const transition = destinationInfo.arrivals[arrivalIndex].enRouteTransitions[arrivalTransitionIndex].legs;
      legs.push(...transition);
    }

    if (arrivalIndex !== -1) {
      legs.push(...destinationInfo.arrivals[arrivalIndex].commonLegs);
    }

    if (arrivalIndex !== -1 && arrivalRunwayIndex !== -1) {
      const runwayTransition = destinationInfo.arrivals[arrivalIndex].runwayTransitions[arrivalRunwayIndex];
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
      segment = this.addSegment(SegmentType.Arrival);
      const procedure = new LegsProcedure(legs, this.getWaypoint(segment.offset - 1), this._parentInstrument);

      let waypointIndex = segment.offset;
      while (procedure.hasNext()) {
        this.addWaypoint(await procedure.getNext(), ++waypointIndex, segment.type);
      }
    }
  }

  /**
   * Builds an approach into the flight plan from indexes in the arrival airport information.
   */
  public async buildApproach(): Promise<void> {
    const legs = [];
    const destination = this.destinationAirfield;

    const approachIndex = this.procedureDetails.approachIndex;
    const approachTransitionIndex = this.procedureDetails.approachTransitionIndex;

    const destinationInfo = destination.infos as AirportInfo;

    if (approachIndex !== -1 && approachTransitionIndex !== -1) {
      const transition = destinationInfo.approaches[approachIndex].transitions[approachTransitionIndex].legs;
      legs.push(...transition);
    }

    if (approachIndex !== -1 && approachTransitionIndex === -1) {
      legs.push(...destinationInfo.approaches[approachIndex].finalLegs);
    }

    let segment = this.approach;
    if (segment !== FlightPlanSegment.Empty) {
      for (var i = 0; i < segment.waypoints.length; i++) {
        this.removeWaypoint(segment.offset);
      }

      this.removeSegment(segment.type);
    }
    
    if (legs.length > 0 || approachIndex !== -1) {
      segment = this.addSegment(SegmentType.Approach);
      const procedure = new LegsProcedure(legs, this.getWaypoint(segment.offset - 1), this._parentInstrument);

      let waypointIndex = segment.offset;
      while (procedure.hasNext()) {
        this.addWaypoint(await procedure.getNext(), ++waypointIndex, segment.type);
      }

      const runway = this.getRunway(destinationInfo.oneWayRunways, destinationInfo.approaches[approachIndex].runway);
      if (runway) {
        const runwayWaypoint = procedure.buildWaypoint(`RW${runway.designation}`, runway.beginningCoordinates);
        this.addWaypoint(runwayWaypoint);
      }
    }
  }

  /**
   * Gets the runway information from a given runway name.
   * @param runways The collection of runways to search.
   * @param runwayName The runway name.
   * @returns The found runway, if any.
   */
  public getRunway(runways: OneWayRunway[], runwayName: string): any {
    if (this.destinationAirfield) {
      const runways = (this.destinationAirfield.infos as AirportInfo).oneWayRunways;
      let runwayIndex;
      
      const runwayLetter = runwayName[runwayName.length - 1];
      if (runwayLetter === ' ' || runwayLetter === 'C') {
        const runwayDirection = runwayName.substring(0, -1);
        runwayIndex = runways.findIndex(r => r.designation === runwayDirection || r.designation === `${runwayDirection}C`);
      }
      else {
        runwayIndex = runways.findIndex(r => r.designation === runwayName);
      }

      if (runwayIndex !== -1) {
        return runways[runwayIndex];
      }
    }
  }

  /**
   * Converts a plain object into a ManagedFlightPlan.
   * @param flightPlanObject The object to convert.
   * @param parentInstrument The parent instrument attached to this flight plan.
   * @returns The converted ManagedFlightPlan.
   */
  public static fromObject(flightPlanObject: any, parentInstrument: BaseInstrument): ManagedFlightPlan {
    let plan = Object.assign(new ManagedFlightPlan(), flightPlanObject);
    plan.setParentInstrument(parentInstrument);
  
    plan.directTo = Object.assign(new DirectTo(), plan.directTo);
  
    const mapObject = (obj: any, parentType?: string): any => {
      if (obj && obj.infos) {
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
  
    const visitObject = (obj: any): any => {
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
  }
}
