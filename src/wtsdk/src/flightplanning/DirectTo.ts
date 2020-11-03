import { WayPoint } from "MSFS";

/**
 * Information about the current direct-to procedures in the flight plan.
 */
export default class DirectTo {

  /** Whether or not the current direct-to is in the flight plan. */
  public waypointIsInFlightPlan: boolean = false;

  /** Whether or not direct-to is active. */
  public isActive: boolean = false;

  /** The current direct-to waypoint, if not part of the flight plan. */
  public waypoint?: WayPoint;

  /** The current direct-to waypoint index, if part of the flight plan. */
  public waypointIndex = 0;

  /** The origin created when direct-to is activated. */
  public origin?: WayPoint;

  /**
   * Activates direct-to with an external waypoint.
   * @param waypoint The waypoint to fly direct-to.
   */
  public activateFromWaypoint(waypoint: WayPoint): void {
    this.isActive = true;
    this.waypoint = waypoint;
    this.waypointIsInFlightPlan = false;
  }

  /**
   * Cancels direct-to. 
   */
  public cancel(): void {
    this.isActive = false;
    this.waypointIsInFlightPlan = false;

    this.waypoint = undefined;
    this.origin = undefined;
  }

  /**
   * Activates direct-to a waypoint already in the flight plan.
   * @param index The index of the waypoint in the flight plan.
   */
  public activateFromIndex(index: number): void {
    this.isActive = true;
    this.waypointIsInFlightPlan = true;
    this.waypointIndex = index;
  }
}