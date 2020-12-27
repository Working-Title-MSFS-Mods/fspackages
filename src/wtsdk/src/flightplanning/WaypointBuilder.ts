import { Avionics, BaseInstrument, IntersectionInfo, LatLongAlt, WayPoint } from "MSFS";
import { FlightPlanManager } from "../wtsdk";

/**
 * Creating a new waypoint to be added to a flight plan.
 */
export class WaypointBuilder {


  /**
   * Builds a WayPoint from basic data.
   * @param ident The ident of the waypoint to be created.
   * @param coordinates The coordinates of the waypoint. 
   * @param instrument The base instrument instance.
   * @returns The built waypoint.
   */
  public static fromCoordinates(ident: string, coordinates: LatLongAlt, instrument: BaseInstrument): WayPoint {
    const waypoint = new WayPoint(instrument);
    waypoint.type = 'W';

    waypoint.infos = new IntersectionInfo(instrument);
    waypoint.infos.coordinates = coordinates;

    waypoint.ident = ident;
    waypoint.infos.ident = ident;

    return waypoint;
  }

  /**
   * Builds a WayPoint from a refrence waypoint.
   * @param ident The ident of the waypoint to be created.
   * @param placeCoordinates The coordinates of the reference waypoint. 
   * @param bearing The bearing from the reference waypoint.
   * @param distance The distance from the reference waypoint.
   * @param instrument The base instrument instance.
   * @returns The built waypoint.
   */
  public static fromPlaceBearingDistance(ident: string, placeCoordinates: LatLongAlt, bearing: number, distance: number, instrument: BaseInstrument): WayPoint {

    const coordinates = Avionics.Utils.bearingDistanceToCoordinates(bearing, distance, placeCoordinates.lat, placeCoordinates.long);
  
    return WaypointBuilder.fromCoordinates(ident, coordinates, instrument);
  }

  /**
   * Builds a WayPoint at a distance from an existing waypoint along the flight plan.
   * @param ident The ident of the waypoint to be created.
   * @param placeIndex The index of the reference waypoint in the flight plan. 
   * @param distance The distance from the reference waypoint.
   * @param instrument The base instrument instance.
   * @param fpm The flightplanmanager instance.
   * @returns The built waypoint.
   */
  public static fromPlaceAlongFlightPlan(ident: string, placeIndex: number, distance: number, instrument: BaseInstrument, fpm: FlightPlanManager): WayPoint {

    const destinationDistanceInFlightplan = fpm.getDestination().distanceInFP;
    const placeDistanceFromDestination = fpm.getWaypoint(placeIndex, fpm._currentFlightPlanIndex, true).distanceInFP;
    const distanceFromDestination = destinationDistanceInFlightplan - placeDistanceFromDestination - distance;

    const coordinates = fpm.getCoordinatesAtNMFromDestinationAlongFlightPlan(distanceFromDestination);
  
    return WaypointBuilder.fromCoordinates(ident, coordinates, instrument);
  }

}