class AutopilotMath {

  /**
  * Calculates the desired intercept angle, taking the current nav sensitivity into account.
  * @param {number} xtk The current cross-track error, in NM.
  * @param {number} navSensitivity The current nav sensitity mode.
  * @param {number} maxAngle The maximum intercept angle, in degrees.
  * @returns {number} The desired intercept angle, in degrees.
  */
 static interceptAngle(xtk, navSensitivity, maxAngle = 45) {
     let sensitivityModifier = 1;
     let minimumInterceptAngle = 2.5;
     let minimumXtk = 0.025;

     switch (navSensitivity) {
         case NavSensitivity.TERMINALLPV:
         case NavSensitivity.TERMINAL:
             sensitivityModifier = 1.1;
             minimumInterceptAngle = 3.0;
             minimumXtk = 0.015;
             break;
         case NavSensitivity.APPROACH:
         case NavSensitivity.APPROACHLPV:
             sensitivityModifier = 1.25;
             minimumInterceptAngle = 3.0;
             minimumXtk = 0.005;
             break;
     }

     let absInterceptAngle = Math.min(Math.pow(Math.abs(xtk) * 20, 1.35) * sensitivityModifier, maxAngle);

     //If we still have some XTK, bake in a minimum intercept angle to keep us on the line
     if (Math.abs(xtk) > minimumXtk) {
         absInterceptAngle = Math.max(absInterceptAngle, minimumInterceptAngle);
     }

     const interceptAngle = xtk < 0 ? absInterceptAngle : -1 * absInterceptAngle;
     return interceptAngle;
 }

  /**
   * Calculates the wind correction angle.
   * @param {number} course The current plane true course. 
   * @param {number} airspeedTrue The current plane true airspeed.
   * @param {number} windDirection The direction of the wind, in degrees true.
   * @param {number} windSpeed The current speed of the wind.
   * @returns {number} The calculated wind correction angle.
   */
  static windCorrectionAngle(course, airspeedTrue, windDirection, windSpeed) {
    const currCrosswind = windSpeed * (Math.sin((course * Math.PI / 180) - (windDirection * Math.PI / 180)));
    const windCorrection = 180 * Math.asin(currCrosswind / airspeedTrue) / Math.PI;

    return windCorrection;
  }

  /**
   * Calculates the cross track deviation from the provided leg fixes.
   * @param {LatLongAlt} fromFix The location of the starting fix of the leg.
   * @param {LatLongAlt} toFix The location of the ending fix of the leg. 
   * @param {LatLongAlt} planeCoords The current plane location coordinates.
   * @returns {number} The amount of cross track deviation, in nautical miles.
   */
  static crossTrack(fromFix, toFix, planeCoords) {
    const planePosition = new LatLon(planeCoords.lat, planeCoords.long);
    return planePosition.crossTrackDistanceTo(new LatLon(fromFix.lat, fromFix.long), new LatLon(toFix.lat, toFix.long)) * (0.000539957);
  }

  /**
   * Calculates the desired track from the provided leg fixes.
   * @param {LatLongAlt} fromFix The location of the starting fix of the leg.
   * @param {LatLongAlt} toFix The location of the ending fix of the leg. 
   * @param {LatLongAlt} planeCoords The current plane location coordinates.
   * @returns {number} The desired track, in degrees true.
   */
  static desiredTrack(fromFix, toFix, planeCoords) {
    const planePosition = new LatLon(planeCoords.lat, planeCoords.long);
    const legStart = new LatLon(fromFix.lat, fromFix.long);
    const legEnd = new LatLon(toFix.lat, toFix.long);

    const totalTrackDistance = legStart.distanceTo(legEnd);
    const alongTrackDistance = planePosition.alongTrackDistanceTo(legStart, legEnd);

    const currentTrackPoint = legStart.intermediatePointTo(legEnd, Math.min(Math.max(alongTrackDistance / totalTrackDistance, .05), .95));
    return currentTrackPoint.initialBearingTo(legEnd);
  }

  /**
   * Calculates the desired track from the provided leg fixes.
   * @param {LatLongAlt} fromFix The location of the starting fix of the leg.
   * @param {LatLongAlt} toFix The location of the ending fix of the leg. 
   * @param {LatLongAlt} planeCoords The current plane location coordinates.
   * @returns {number} The desired track, in degrees true.
   */
  static desiredTrackArc(fromFix, toFix, planeCoords) {
    const cLat = (fromFix.lat + toFix.lat) / 2;
    const cLon = (fromFix.long + toFix.long) / 2;

    const arcAngle = Math.atan2(planeCoords.lat - cLat, cLon - planeCoords.long) * Avionics.Utils.RAD2DEG;
    return AutopilotMath.normalizeHeading(arcAngle);
  }

  /**
   * Calculates the desired track from the provided leg fixes.
   * @param {LatLongAlt} fromFix The location of the starting fix of the leg.
   * @param {LatLongAlt} toFix The location of the ending fix of the leg. 
   * @param {LatLongAlt} planeCoords The current plane location coordinates.
   * @returns {number} The desired track, in degrees true.
   */
  static crossTrackArc(fromFix, toFix, planeCoords) {
    const cLat = (fromFix.lat + toFix.lat) / 2;
    const cLon = (fromFix.long + toFix.long) / 2;
    const radius = Avionics.Utils.computeGreatCircleDistance(fromFix, toFix) / 2;

    const centerDistance = Avionics.Utils.computeGreatCircleDistance(planeCoords, new LatLongAlt(cLat, cLon)); 
    return -1 * (centerDistance - radius);
  }

  /**
   * Calculates the distance the plane has traveled along the arc.
   * @param {LatLongAlt} fromFix The location of the starting fix of the leg.
   * @param {LatLongAlt} toFix The location of the ending fix of the leg. 
   * @param {LatLongAlt} planeCoords The current plane location coordinates.
   * @returns {number} The distance traveled, in NM.
   */
  static distanceAlongArc(fromFix, toFix, planeCoords) {
    const cLat = (fromFix.lat + toFix.lat) / 2;
    const cLon = (fromFix.long + toFix.long) / 2;
    const radius = Avionics.Utils.computeGreatCircleDistance(fromFix, toFix) / 2;

    const planeAngle = Math.atan2(planeCoords.lat - cLat, cLon - planeCoords.long);
    const endAngle = Math.atan2(toFix.lat - cLat, cLon - toFix.long);

    return Math.abs((endAngle - planeAngle) * radius);
  }

  /**
   * Normalizes a heading to a 0-360 range.
   * @param {number} heading The heading to normalize.
   * @returns {number} The normalized heading.
   */
  static normalizeHeading(heading) {
    let normalized = heading;
    while (normalized > 360) {
      normalized -= 360;
    }

    while (normalized < 0) {
      normalized += 360;
    }

    return normalized;
  }

  /**
   * Gets the turn radius for a given true airspeed.
   * @param {number} airspeedTrue The true airspeed of the plane.
   * @param {number} bankAngle The bank angle of the plane, in degrees.
   * @returns {number} The airplane turn radius.
   */
  static turnRadius(airspeedTrue, bankAngle) {
    return (Math.pow(airspeedTrue, 2) / (11.26 * Math.tan(bankAngle * Avionics.Utils.DEG2RAD)))
      / 6076.11549;
  }

  /**
   * Gets the headwind/tailwind and crosswind components from a wind vector
   * relative to a provided heading.
   * @param {number} heading The direction to get components for. 
   * @param {number} windDirection The direction of the wind.
   * @param {number} windSpeed The speed of the wind.
   * @returns {{headwind: number, crosswind: number}} The wind components.
   */
  static windComponents(heading, windDirection, windSpeed) {
    const relativeWindHeading = AutopilotMath.normalizeHeading(windDirection - heading);
    const headwind = windSpeed * Math.sin(relativeWindHeading * Avionics.Utils.DEG2RAD);
    const crosswind = windSpeed * Math.cos(relativeWindHeading * Avionics.Utils.DEG2RAD);

    return {headwind, crosswind};
  }

  /**
   * Gets the FPA for a given vertical and lateral distance.
   * @param {number} verticalDistance The vertical distance in feet. 
   * @param {number} lateralDistance The lateral distance in NM.
   * @returns {number} The FPA in degrees.
   */
  static calculateFPA(verticalDistance, lateralDistance) {
    return (180 / Math.PI) * (Math.atan(verticalDistance / (lateralDistance * 6076.12)));
  }

  /**
   * Gets the FPTA DELTA for a given FPA and lateral distance.
   * @param {number} fpa The FPA in degrees.
   * @param {number} lateralDistance The lateral distance in NM.
   * @returns {number} The delta altitude in feet.
   */
  static calculateFPTA(fpa, lateralDistance) {
    return (Math.tan(fpa * (Math.PI / 180)) * lateralDistance * 6076.12);
  }

  /**
   * Gets the DESCENT DISTANCE for a given FPA and vertical distance.
   * @param {number} fpa The FPA in degrees 
   * @param {number} verticalDistance The vertical distance in feet.
   * @returns {number} The lateral distance in NM to descend the specified vertical distance at the specified FPA.
   */
  static calculateDescentDistance(fpa, verticalDistance) {
    return ((verticalDistance) / (Math.tan(fpa * (Math.PI / 180)))) / 6076.12;
  }

  /**
   * Gets the DESCENT RATE for a given FPA and groundspeed.
   * @param {number} fpa The FPA in degrees 
   * @param {number} groundspeed The current groundspeed.
   * @returns {number} The rate of descent required to descend at the specified FPA in ft/minute.
   */
  static calculateVerticaSpeed(fpa, groundspeed) {
    return -101.2686667 * groundspeed * Math.tan(fpa * (Math.PI / 180));
  }
}