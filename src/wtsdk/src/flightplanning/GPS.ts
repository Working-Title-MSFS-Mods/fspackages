import { SimVar } from 'MSFS';

/**
 * Methods for interacting with the FS9GPS subsystem.
 */
export default class GPS {

  /**
   * Clears the FS9GPS flight plan.
   */
  public static async clearPlan(): Promise<void> {
    const totalGpsWaypoints = SimVar.GetSimVarValue('C:fs9gps:FlightPlanWaypointsNumber', 'number');
    for (var i = 0; i < totalGpsWaypoints; i++) {

      //Always remove waypoint 0 here, which shifts the rest of the waypoints down one
      await GPS.deleteWaypoint(0);
    }
  }

  /**
   * Adds a waypoint to the FS9GPS flight plan by ICAO designation.
   * @param icao The MSFS ICAO to add to the flight plan.
   * @param index The index of the waypoint to add in the flight plan.
   */
  public static async addIcaoWaypoint(icao: string, index: number): Promise<void> {
    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanNewWaypointICAO', 'string', icao);
    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanAddWaypoint', 'number', index);
  }

  /**
   * Adds a user waypoint to the FS9GPS flight plan.
   * @param lat The latitude of the user waypoint.
   * @param lon The longitude of the user waypoint.
   * @param index The index of the waypoint to add in the flight plan.
   * @param ident The ident of the waypoint.
   */
  public static async addUserWaypoint(lat: number, lon: number, index: number, ident: string): Promise<void> {
    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanNewWaypointLatitude', 'degrees', lat);
    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanNewWaypointLongitude', 'degrees', lon);

    if (ident) {
      await SimVar.SetSimVarValue('C:fs9gps:FlightPlanNewWaypointIdent', 'string', ident);
    }

    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanAddWaypoint', 'number', index); 
  }

  /**
   * Deletes a waypoint from the FS9GPS flight plan.
   * @param index The index of the waypoint in the flight plan to delete.
   */
  public static async deleteWaypoint(index: number): Promise<void> {
    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanDeleteWaypoint', 'number', index);
  }

  /**
   * Sets the active FS9GPS waypoint.
   * @param {Number} index The index of the waypoint to set active.
   */
  public static async setActiveWaypoint(index: number): Promise<void> {
    await SimVar.SetSimVarValue('C:fs9gps:FlightPlanActiveWaypoint', 'number', index); 
  }

  /**
   * Gets the active FS9GPS waypoint.
   */
  public static getActiveWaypoint(): Promise<void> {
    return SimVar.GetSimVarValue('C:fs9gps:FlightPlanActiveWaypoint', 'number'); 
  }

  /**
   * Logs the current FS9GPS flight plan.
   */
  public static async logCurrentPlan(): Promise<void> {
    const waypointIdents = [];
    const totalGpsWaypoints = SimVar.GetSimVarValue('C:fs9gps:FlightPlanWaypointsNumber', 'number');

    for (var i = 0; i < totalGpsWaypoints; i++) {
      await SimVar.SetSimVarValue('C:fs9gps:FlightPlanWaypointIndex', 'number', i);
      waypointIdents.push(SimVar.GetSimVarValue('C:fs9gps:FlightPlanWaypointIdent', 'string'));
    }

    console.log(`GPS Plan: ${waypointIdents.join(' ')}`);
  }
}