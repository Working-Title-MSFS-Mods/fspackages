import { Avionics, LatLongAlt } from "MSFS";
import { WorldMagneticModel } from "./WorldMagneticModel";

/** A class for geographical mathematics. */
export class GeoMath {

  private static magneticModel = new WorldMagneticModel();

  /**
   * Gets coordinates at a relative bearing and distance from a set of coordinates.
   * @param course The course, in degrees, from the reference coordinates.
   * @param distanceInNM The distance, in nautical miles, from the reference coordinates.
   * @param referenceCoordinates The reference coordinates to calculate from.
   * @returns The calculated coordinates.
   */
  public static relativeBearingDistanceToCoords(course: number, distanceInNM: number, referenceCoordinates: LatLongAlt): LatLongAlt {
    const courseRadians = course * Avionics.Utils.DEG2RAD;
    const distanceRadians = (Math.PI / (180 * 60)) * distanceInNM;

    const refLat = referenceCoordinates.lat * Avionics.Utils.DEG2RAD;
    const refLon = -(referenceCoordinates.long * Avionics.Utils.DEG2RAD);
    
    const lat = Math.asin(Math.sin(refLat) * Math.cos(distanceRadians) + Math.cos(refLat) * Math.sin(distanceRadians) * Math.cos(courseRadians));
    const dlon = Math.atan2(Math.sin(courseRadians) * Math.sin(distanceRadians) * Math.cos(refLat), Math.cos(distanceRadians) - Math.sin(refLat) * Math.sin(lat));
    const lon = Avionics.Utils.fmod(refLon - dlon + Math.PI, 2 * Math.PI) - Math.PI;

    return new LatLongAlt(lat * Avionics.Utils.RAD2DEG, -(lon * Avionics.Utils.RAD2DEG));
  }

  /**
   * Gets a corrected heading given a heading and a magnetic variation.
   * @param headingMagnetic The magnetic heading to correct.
   * @param magneticVariation The measured magnetic variation.
   * @returns The true heading, corrected for magnetic variation.
   */
  public static correctMagvar(headingMagnetic: number, magneticVariation: number): number {
    let magvarDiff: number;
    if (magneticVariation <= 180) {
      magvarDiff = magneticVariation;
    }
    else {
      magvarDiff = magneticVariation - 360;
    }

    return headingMagnetic - magvarDiff;
  }

  /**
   * Gets the magnetic variation for a given latitude and longitude.
   * @param lat The latitude to get a magvar for.
   * @param lon The longitude to get a magvar for.
   * @returns The magnetic variation at the specific latitude and longitude.
   */
  public static getMagvar(lat: number, lon: number): number {
    return GeoMath.magneticModel.declination(0, lat, lon, 2020);
  }
}