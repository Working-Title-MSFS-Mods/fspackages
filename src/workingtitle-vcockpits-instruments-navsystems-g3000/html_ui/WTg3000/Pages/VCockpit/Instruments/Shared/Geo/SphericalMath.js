class WT_SmallCircle {
    /**
     *
     * @param {WT_GVector3} normal
     * @param {Number} radius
     */
    constructor(normal, radius) {
        this._normal = normal.unit();
        this._radius = radius;
    }

    /**
     * @readonly
     * @property {WT_GVector3} normal
     * @type {WT_GVector3}
     */
    get normal() {
        return this._normal.readonly();
    }

    /**
     * @readonly
     * @property {Number} radius
     * @type {Number}
     */
    get radius() {
        return this._radius;
    }

    /**
     *
     * @param {WT_SmallCircle} other
     * @param {WT_GVector3[]} [reference]
     * @returns {WT_GVector3[]}
     */
    intersection(other, reference) {
        if (!reference) {
            reference = [];
        }

        let normal1 = this.normal;
        let normal2 = other.normal;
        let radius1 = this.radius;
        let radius2 = other.radius;

        let dot = normal1.dot(normal2);
        if (dot === 1) {
            return reference;
        }
        let dotSquared = dot * dot;

        let a = (Math.cos(radius1) - dot * Math.cos(radius2)) / (1 - dotSquared);
        let b = (Math.cos(radius2) - dot * Math.cos(radius1)) / (1 - dotSquared);
        let intersection = WT_SmallCircle._tempVector1.set(normal1).scale(a, true).add(WT_SmallCircle._tempVector2.set(normal2).scale(b, true));

        if (intersection.length > 1) {
            return reference;
        }

        let cross = WT_SmallCircle._tempVector2.set(normal1).cross(normal2, true);
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
     *
     * @param {WT_SmallCircle} other
     * @param {WT_GeoPoint[]} [reference]
     * @returns {WT_GeoPoint[]}
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
     *
     * @param {WT_GeoPoint} point
     * @param {Number} radius
     * @returns {WT_SmallCircle}
     */
    static createFromPoint(point, radius) {
        return new WT_SmallCircle(point.cartesian(WT_SmallCircle._tempVector1), radius);
    }
}
WT_SmallCircle._tempVector1 = new WT_GVector3(0, 0, 0);
WT_SmallCircle._tempVector2 = new WT_GVector3(0, 0, 0);
WT_SmallCircle._tempArray = [new WT_GVector3(0, 0, 0), new WT_GVector3(0, 0, 0)];

class WT_GreatCircle extends WT_SmallCircle {
    constructor(normal) {
        super(normal, Math.PI / 2);
    }

    /**
     *
     * @param {WT_GeoPoint} point1
     * @param {WT_GeoPoint} point2
     * @returns {WT_GreatCircle}
     */
    static createFromPoints(point1, point2) {
        let normal1 = point1.cartesian(WT_SmallCircle._tempVector1);
        let normal2 = point2.cartesian(WT_SmallCircle._tempVector2);
        return new WT_GreatCircle(normal1.cross(normal2, true));
    }

    /**
     *
     * @param {WT_GeoPoint} point
     * @param {Number} bearing
     * @returns {WT_GreatCircle}
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

class WT_RhumbLine {
    constructor(vector) {
        this._vector = vector.copy();
    }

    /**
     * @readonly
     * @property {WT_GVector3} vector
     * @type {WT_GVector3}
     */
    get vector() {
        return this._vector;
    }

    /**
     *
     * @param {WT_RhumbLine} other
     * @param {WT_GVector3} [reference]
     * @returns {WT_GVector3}
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
     *
     * @param {WT_RhumbLine} other
     * @param {WT_GeoPoint} [reference]
     * @returns {WT_GeoPoint}
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
     *
     * @param {WT_GeoPoint} point
     * @param {Number} bearing
     * @returns {WT_RhumbLine}
     */
    static createFromPointBearing(point, bearing) {
        return WT_RhumbLine.createFromPoints(point, WT_RhumbLine._tempGeoPoint.set(point).offsetRhumb(bearing, WT_Unit.NMILE.getConversionFactor(WT_Unit.GA_RADIAN)));
    }

    /**
     *
     * @param {WT_GeoPoint} point1
     * @param {WT_GeoPoint} point2
     * @returns {WT_RhumbLine}
     */
    static createFromPoints(point1, point2) {
        WT_RhumbLine._tempArray[1] = point1.lat;
        WT_RhumbLine._tempArray[0] = point1.long;
        let projected1 = WT_RhumbLine._PROJECTION(WT_RhumbLine._tempArray, WT_RhumbLine._tempArray);
        let vector1 = WT_RhumbLine._tempVector2.set(projected1[0], projected1[1]);

        WT_RhumbLine._tempArray[1] = point2.lat;
        WT_RhumbLine._tempArray[0] = point2.long;
        let projected2 = WT_RhumbLine._PROJECTION(WT_RhumbLine._tempArray, WT_RhumbLine._tempArray);
        let delta = vector1.subtract(projected2[0], projected2[1]);
        let a = -delta.y;
        let b = delta.x;
        if (a === 0 && b === 0) {
            return undefined;
        }
        let c = -(a * projected2[0] + b * projected2[1]);
        return new WT_RhumbLine(WT_RhumbLine._tempVector3.set(a, b, c));
    }
}
WT_RhumbLine._PROJECTION = d3.geoMercator().translate([0, 0]).scale(WT_Unit.GA_RADIAN.getConversionFactor(WT_Unit.NMILE));
WT_RhumbLine._PROJECTION_ANTIMERIDIAN = WT_RhumbLine._PROJECTION([180, 0])[0];
WT_RhumbLine._tempVector2 = new WT_GVector2(0, 0);
WT_RhumbLine._tempVector3 = new WT_GVector3(0, 0, 0);
WT_RhumbLine._tempArray = [0, 0];
WT_RhumbLine._tempGeoPoint = new WT_GeoPoint(0, 0);