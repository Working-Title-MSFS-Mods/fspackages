/**
 * A small circle. A small circle is the set of points on the Earth's surface equidistant (as measured geodetically) from a
 * central point.
 */
class WT_SmallCircle {
    /**
     * @param {{x:Number, y:Number, z:Number}} center - the center of the new small circle, represented as a position vector in
     *                                                  the standard geographic cartesian reference system.
     * @param {Number} radius - the radius of the new small circle in great-arc radians.
     */
    constructor(center, radius) {
        this._center = new WT_GVector3(center).unit(true);
        this._radius = Math.abs(radius) % Math.PI;
    }

    /**
     * @readonly
     * @property {WT_GVector3ReadOnly} center - the center of this small circle.
     * @type {WT_GVector3ReadOnly}
     */
    get center() {
        return this._center.readonly();
    }

    /**
     * @readonly
     * @property {Number} radius - the radius of this small circle, in great-arc radians.
     * @type {Number}
     */
    get radius() {
        return this._radius;
    }

    _distanceToCenter(point) {
        if (typeof point.lat === "number" && typeof point.long === "number") {
            point = WT_SmallCircle._tempGeoPoint.set(point).cartesian(WT_SmallCircle._tempVector1);
        } else if (typeof point.x === "number" && typeof point.y === "number" && typeof point.z === "number") {
            point = WT_SmallCircle._tempVector1.set(point);
        } else {
            return undefined;
        }

        return Math.acos(point.dot(this.center) / (point.length * this.center.length));
    }

    /**
     * Calculates and returns the great circle distance from a specified point to the closest point that lies on this small circle.
     * In other words, calculates the shortest distance from a point to this small circle.
     * @param {{x:Number, y:Number, z:Number}|{lat:Number, long:Number}} point - a point, represented as either a position vector or
     *                                                                           lat/long coordinates.
     * @returns {Number} the great circle distance, in great-arc radians, from the point to the closest point on this small circle.
     */
    distance(point) {
        let distanceToCenter = this._distanceToCenter(point);
        if (distanceToCenter === undefined) {
            return undefined;
        }
        return Math.abs(distanceToCenter - this.radius);
    }

    /**
     * Checks whether a point lies on this small circle.
     * @param {{x:Number, y:Number, z:Number}|{lat:Number, long:Number}} point - a point, represented as either a position vector or
     *                                                                           lat/long coordinates.
     * @param {Number} [tolerance] - the error tolerance, in great-arc radians, of this operation. Defaults to 1e-8 (roughly 6 cm)
     *                               if not specified.
     * @returns {Boolean} whether the point lies on this small circle.
     */
    contains(point, tolerance = WT_SmallCircle.ANGULAR_TOLERANCE) {
        let distance = this.distance(point);
        if (distance === undefined) {
            return undefined;
        }
        return distance < tolerance;
    }

    /**
     * Checks whether a point lies within the boundary defined by this small circle. This is equivalent to checking whether the
     * distance of the point from the center of this circle is less than or equal to this circle's radius.
     * @param {{x:Number, y:Number, z:Number}|{lat:Number, long:Number}} point - a point, represented as either a position vector or
     *                                                                           lat/long coordinates.
     * @param {Number} [tolerance] - the error tolerance, in great-arc radians, of this operation. Defaults to 1e-8 (roughly 6 cm)
     *                               if not specified.
     * @returns {Boolean} whether the point lies within the boundary defined by this small circle.
     */
    encircles(point, tolerance = WT_SmallCircle.ANGULAR_TOLERANCE) {
        let distanceToCenter = this._distanceToCenter(point);
        if (distanceToCenter === undefined) {
            return undefined;
        }
        return distanceToCenter - this.radius < tolerance;
    }

    /**
     * Calculates and returns the set of intersection points between this small circle and another one. Any two small circles can have
     * zero, one, two, or infinite points of intersection. In the first and last cases, no results are returned. For the one- or two-
     * solution cases, an array is returned with the solution(s) located at index 0 and index 1.
     * @param {WT_SmallCircle} other - the other small circle to test for intersections.
     * @param {WT_GVector3[]} [reference] - an array in which to store the results. If this argument is not supplied, a new array is
     *                                      created and returned. If one is supplied with WT_GVector3 objects at index 0 and 1, the
     *                                      results will be stored in those objects. Otherwise, new WT_GVector3 objects will be
     *                                      created. If an array is supplied and there are no results to return, then the array and
     *                                      its contents will be unchanged.
     * @returns {WT_GVector3[]} an array of intersection points represented as position vectors in the standard geographic cartesian
     *                          reference system. Solutions, if they exist, are stored at indexes 0 and 1.
     */
    intersection(other, reference) {
        if (!reference) {
            reference = [];
        }

        let center1 = this.center;
        let center2 = other.center;
        let radius1 = this.radius;
        let radius2 = other.radius;

        let dot = center1.dot(center2);
        if (dot === 1) {
            return reference;
        }
        let dotSquared = dot * dot;

        let a = (Math.cos(radius1) - dot * Math.cos(radius2)) / (1 - dotSquared);
        let b = (Math.cos(radius2) - dot * Math.cos(radius1)) / (1 - dotSquared);
        let intersection = WT_SmallCircle._tempVector1.set(center1).scale(a, true).add(WT_SmallCircle._tempVector2.set(center2).scale(b, true));

        if (intersection.length > 1) {
            return reference;
        }

        let cross = WT_SmallCircle._tempVector2.set(center1).cross(center2, true);
        if (cross.length === 0) {
            return reference;
        }

        let offset = Math.sqrt((1 - intersection.length * intersection.length) / (cross.length * cross.length));
        if (!reference[0]) {
            reference[0] = new WT_GVector3(0, 0, 0);
        }
        reference[0].set(intersection).add(cross.x * offset, cross.y * offset, cross.z * offset);
        if (offset > 0) {
            if (!reference[1]) {
                reference[1] = new WT_GVector3(0, 0, 0);
            }
            reference[1].set(intersection).add(cross.x * -offset, cross.y * -offset, cross.z * -offset);
        }
        return reference;
    }

    /**
     * Calculates and returns the set of intersection points between this small circle and another one. Any two small circles can have
     * zero, one, two, or infinite points of intersection. In the first and last cases, no results are returned. For the one- or two-
     * solution cases, an array is returned with the solution(s) located at index 0 and index 1.
     * @param {WT_SmallCircle} other - the other small circle to test for intersections.
     * @param {GeoPoint[]} [reference] - an array in which to store the results. If this argument is not supplied, a new array is
     *                                   created and returned. If one is supplied with WT_GeoPoint objects at index 0 and 1, the
     *                                   results will be stored in those objects. Otherwise, new WT_GeoPoint objects will be
     *                                   created. If an array is supplied and there are no results to return, then the array and
     *                                   its contents will be unchanged.
     * @returns {GeoPoint[]} an array of intersection points represented as lat/long coordinates. Solutions, if they exist, are
     *                       stored at indexes 0 and 1.
     */
    intersectionGeoPoint(other, reference) {
        if (!reference) {
            reference = [];
        }

        WT_SmallCircle._tempArray[0].set(0, 0, 0);
        WT_SmallCircle._tempArray[1].set(0, 0, 0);

        let results = this.intersection(other, WT_SmallCircle._tempArray);
        for (let i = 0; i < results.length; i++) {
            if (results[i].length > 0) {
                if (!reference[i]) {
                    reference[i] = new WT_GeoPoint(0, 0);
                }
                reference[i].setFromCartesian(results[i]);
            } else {
                break;
            }
        }
        return reference;
    }

    /**
     * Creates a new small circle from a lat/long coordinate pair and radius.
     * @param {WT_GeoPoint} point - the center of the new small circle.
     * @param {Number} radius - the radius of the new small circle, in great-arc radians.
     * @returns {WT_SmallCircle} a small circle.
     */
    static createFromPoint(point, radius) {
        return new WT_SmallCircle(point.cartesian(WT_SmallCircle._tempVector1), radius);
    }
}
WT_SmallCircle._tempVector1 = new WT_GVector3(0, 0, 0);
WT_SmallCircle._tempVector2 = new WT_GVector3(0, 0, 0);
WT_SmallCircle._tempArray = [new WT_GVector3(0, 0, 0), new WT_GVector3(0, 0, 0)];
WT_SmallCircle._tempGeoPoint = new WT_GeoPoint(0, 0);
WT_SmallCircle.ANGULAR_TOLERANCE = 1e-8; // ~6 cm

/**
 * A great circle. A great circle is the set of points on the Earth's surface defined by the intersection of the surface sphere
 * with a plane that passes through the center of the Earth. A great circle is a special case of a small circle with radius exactly
 * equal to pi / 2 great-arc radians (thus, great circles are the subset of small circles with the greatest possible circumference).
 */
class WT_GreatCircle extends WT_SmallCircle {
    /**
     * @param {{x:Number, y:Number, z:Number}} normal - the normal vector of the new great circle.
     */
    constructor(normal) {
        super(normal, Math.PI / 2);
    }

    /**
     * @readonly
     * @property {WT_GVector3ReadOnly} normal - the normal vector of this great circle. This vector is perpendicular to the position
     *                                          vectors of all points on the great circle.
     * @type {WT_GVector3ReadOnly}
     */
    get normal() {
        return this.center;
    }

    /**
     * Creates a new great circle that contains two points. There are two possible great circles that contain any two unique points;
     * these circles differ only by their directionality (equivalently, the sign of their normal vectors or their winding). The order of
     * points passed to this method and the right-hand rule determines which of the two is returned.
     * @param {WT_GeoPoint} point1 - the first point that lies on the new great circle.
     * @param {WT_GeoPoint} point2 - the second point that lies on the new great circle.
     * @returns {WT_GreatCircle} a great circle.
     */
    static createFromPoints(point1, point2) {
        let normal1 = point1.cartesian(WT_SmallCircle._tempVector1);
        let normal2 = point2.cartesian(WT_SmallCircle._tempVector2);
        return new WT_GreatCircle(normal1.cross(normal2, true));
    }

    /**
     * Creates a new great circle defined by one point and a bearing offset. The new great circle will be equivalent to the path
     * projected from the point with the specified initial bearing (forward azimuth).
     * @param {WT_GeoPoint} point - a point that lies on the new great circle.
     * @param {Number} bearing - the initial bearing.
     * @returns {WT_GreatCircle} a great circle.
     */
    static createFromPointBearing(point, bearing) {
        let lat = point.lat * Avionics.Utils.DEG2RAD;
        let long = point.long * Avionics.Utils.DEG2RAD;
        bearing *= Avionics.Utils.DEG2RAD;
        let sinLat = Math.sin(lat);
        let sinLong = Math.sin(long);
        let cosLong = Math.cos(long);
        let sinBearing = Math.sin(bearing);
        let cosBearing = Math.cos(bearing);

        let x = sinLong * cosBearing - sinLat * cosLong * sinBearing;
        let y = -cosLong * cosBearing - sinLat * sinLong * sinBearing;
        let z = Math.cos(lat) * sinBearing;

        return new WT_GreatCircle(WT_SmallCircle._tempVector1.set(x, y, z));
    }
}

/**
 * A rhumb line. A rhumb line is a set of points on the Earth's surface such that the bearing from any point to another, unique point
 * in the set is equal to a constant value theta or theta - 180 degrees. Equivalently, a rhumb line is a set of points that lie along
 * a straight line in a Mercator projection.
 */
class WT_RhumbLine {
    /**
     * @param {{x:Number, y:Number, z:Number}} vector - the vector representation of the line defining the new rhumb line on a
     *                                                  Mercator projection where [0 N, 0 E] lies at (0, 0) and 1 projected unit
     *                                                  equals 1 nautical mile along the equator.
     */
    constructor(vector) {
        this._vector = new WT_GVector3(vector);
    }

    /**
     * @readonly
     * @property {WT_GVector3ReadOnly} vector - the vector representation of this rhumb line.
     * @type {WT_GVector3ReadOnly}
     */
    get vector() {
        return this._vector.readonly();
    }

    /**
     * Checks whether a point lies on this rhumb line.
     * @param {{x:Number, y:Number, z:Number}|{lat:Number, long:Number}} point - a point, represented as either a position vector or
     *                                                                           lat/long coordinates.
     * @returns {Boolean} whether the point lies on this rhumb line.
     */
    contains(point) {
        if (typeof point.lat === "number" && typeof point.long === "number") {
            point = WT_RhumbLine._tempGeoPoint.set(point);
        } else if (typeof point.x === "number" && typeof point.y === "number" && typeof point.z === "number") {
            point = WT_RhumbLine._tempGeoPoint.setFromCartesian(WT_RhumbLine._tempVector3.set(point));
        } else {
            return undefined;
        }

        let projected = WT_RhumbLine._PROJECTION(point, WT_RhumbLine._tempVector2);
        return projected.x * this.vector.x + projected.y * this.vector.y + this.vector.z === 0;
    }

    /**
     * Calculates and returns the intersection point of this rhumb line and another. Two rhumb lines can intersect at exactly zero,
     * one, or infinite points. For the first and last cases, no results are returned.
     * @param {WT_RhumbLine} other - the other rhumb line to test for an intersection.
     * @param {WT_GVector3} [reference] - a WT_GVector3 object in which to store the result. If this argument is no supplied, then a
     *                                    new WT_GVector3 object will be created. If an object is supplied and there are no results
     *                                    to return, the object will remain unchanged.
     * @returns {WT_GVector3} - the intersection point, if a unique one exists, as a position vector in the standard geographic
     *                          cartesian reference system
     */
    intersection(other, reference) {
        if (!reference) {
            reference = new WT_GVector3(0, 0, 0);
        }

        let result = this.intersectionGeoPoint(other, WT_RhumbLine._tempGeoPoint);
        if (!result) {
            return result;
        }
        return result.cartesian(reference);
    }

    /**
     * Calculates and returns the intersection point of this rhumb line and another. Two rhumb lines can intersect at exactly zero,
     * one, or infinite points. For the first and last cases, no results are returned.
     * @param {WT_RhumbLine} other - the other rhumb line to test for an intersection.
     * @param {WT_GeoPoint} [reference] - a WT_GeoPoint object in which to store the result. If this argument is no supplied, then a
     *                                    new WT_GeoPoint object will be created. If an object is supplied and there are no results
     *                                    to return, the object will remain unchanged.
     * @returns {WT_GeoPoint} - the intersection point, if a unique one exists, as lat/long coordinates.
     */
    intersectionGeoPoint(other, reference) {
        let intersection = WT_RhumbLine._tempVector3.set(this.vector).cross(other.vector, true);
        if (intersection.z === 0) {
            return undefined;
        }

        if (reference === undefined) {
            reference = new WT_GeoPoint(0, 0, 0);
        }
        let x = intersection.x / intersection.z;
        // handle wraparound across the antimeridian
        x = (((x + WT_RhumbLine._PROJECTION_ANTIMERIDIAN) % (WT_RhumbLine._PROJECTION_ANTIMERIDIAN * 2) + WT_RhumbLine._PROJECTION_ANTIMERIDIAN * 2) % (WT_RhumbLine._PROJECTION_ANTIMERIDIAN * 2)) - WT_RhumbLine._PROJECTION_ANTIMERIDIAN;
        let y = intersection.y / intersection.z;
        WT_RhumbLine._tempArray[0] = x;
        WT_RhumbLine._tempArray[1] = y;
        let longLat = WT_RhumbLine._PROJECTION.invert(WT_RhumbLine._tempArray, WT_RhumbLine._tempArray);
        return reference.set(longLat[1], longLat[0]);
    }

    /**
     * Creates a new rhumb line from a point and bearing.
     * @param {WT_GeoPoint} point - a point that lies on the new rhumb line.
     * @param {Number} bearing - one of the two constant bearings of the rhumb line.
     * @returns {WT_RhumbLine} a rhumb line.
     */
    static createFromPointBearing(point, bearing) {
        return WT_RhumbLine.createFromPoints(point, WT_RhumbLine._tempGeoPoint.set(point).offsetRhumb(bearing, WT_Unit.NMILE.getConversionFactor(WT_Unit.GA_RADIAN)));
    }

    /**
     * Creates a new rhumb line that contains two points.
     * @param {WT_GeoPoint} point1 - the first point that lies on the new rhumb line.
     * @param {WT_GeoPoint} point2 - the second point that lies on the new rhumb line.
     * @returns {WT_RhumbLine} a rhumb line.
     */
    static createFromPoints(point1, point2) {
        WT_RhumbLine._tempArray[1] = point2.lat;
        WT_RhumbLine._tempArray[0] = point2.long;
        let projected2 = WT_RhumbLine._PROJECTION(WT_RhumbLine._tempArray, WT_RhumbLine._tempArray);
        let vector2 = WT_RhumbLine._tempVector2.set(projected2[0], projected2[1]);

        WT_RhumbLine._tempArray[1] = point1.lat;
        WT_RhumbLine._tempArray[0] = point1.long;
        let projected1 = WT_RhumbLine._PROJECTION(WT_RhumbLine._tempArray, WT_RhumbLine._tempArray);
        let delta = vector2.subtract(projected1[0], projected1[1]);
        let a = -delta.y;
        let b = delta.x;
        if (a === 0 && b === 0) {
            return undefined;
        }
        let c = -(a * projected1[0] + b * projected1[1]);
        return new WT_RhumbLine(WT_RhumbLine._tempVector3.set(a, b, c));
    }
}
WT_RhumbLine._PROJECTION = d3.geoMercator().translate([0, 0]).scale(WT_Unit.GA_RADIAN.getConversionFactor(WT_Unit.NMILE));
WT_RhumbLine._PROJECTION_ANTIMERIDIAN = WT_RhumbLine._PROJECTION([180, 0])[0];
WT_RhumbLine._tempVector2 = new WT_GVector2(0, 0);
WT_RhumbLine._tempVector3 = new WT_GVector3(0, 0, 0);
WT_RhumbLine._tempArray = [0, 0];
WT_RhumbLine._tempGeoPoint = new WT_GeoPoint(0, 0);