import { FlightPlanSegment } from "./FlightPlanSegment";

/**
 * Information about the current direct-to procedures in the flight plan.
 */
export class DirectTo {

  /** Whether or not the current direct-to is in the flight plan. */
  public waypointIsInFlightPlan = false;

  /** Whether or not direct-to is active. */
  public isActive = false;

  /** The current direct-to waypoint, if not part of the flight plan. */
  public waypoint?: WayPoint;

  /** The current direct-to waypoint index, if part of the flight plan. */
  public planWaypointIndex = 0;

  /** The intercept points towards the direct. */
  public interceptPoints?: WayPoint[];

  /** The current active index in the direct to waypoints. */
  public currentWaypointIndex = 0;

  /** The segments of the direct plan. */
  public segments?: FlightPlanSegment[];
}