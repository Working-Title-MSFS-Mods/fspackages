import { WayPoint } from "MSFS";

/**
 * A segment of a flight plan.
 */
export class FlightPlanSegment {

  /**
   * Creates a new FlightPlanSegment.
   * @param type The type of the flight plan segment.
   * @param offset The offset within the original flight plan that
   * the segment starts at.
   * @param waypoints The waypoints in the flight plan segment. 
   */
  constructor(public type: SegmentType, public offset: number, public waypoints: WayPoint[]) {
  }

  /** An empty flight plan segment. */
  public static Empty: FlightPlanSegment = new FlightPlanSegment(-1, -1, []);
}

/** Types of flight plan segments. */
export enum SegmentType {

  /** The origin airfield segment. */
  Origin,

  /** The departure segment. */
  Departure,

  /** The enroute segment. */
  Enroute,

  /** The arrival segment. */
  Arrival,

  /** The approach segment. */
  Approach,

  /** The missed approach segment. */
  Missed,

  /** The destination airfield segment. */
  Destination
}