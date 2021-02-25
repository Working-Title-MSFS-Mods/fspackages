/**
 * A point on Earth's surface defined by latitude and longitude.
 */
class WT_GeoPoint {
    /**
     * @param {Number} lat - the latitude, in degrees.
     * @param {Number} long - the longitude, in degrees.
     */
    constructor(lat, long) {
        this.set(lat, long);
        this._readonly = new WT_GeoPointReadOnly(this);
    }

    /**
     * @readonly
     * @property {Number} lat - the latitude of this point, in degrees.
     * @type {Number}
     */
    get lat() {
        return this._lat;
    }

    /**
     * @readonly
     * @property {Number} long - the longitude of this point, in degrees.
     * @type {Number}
     */
    get long() {
        return this._long;
    }

    static _parseArgs(_1, _2) {
        let returnValue = undefined;
        if (_1 !== undefined && _1 !== null && typeof _1.lat === "number" && typeof _1.long === "number") {
            WT_GeoPoint._tempValue.lat = _1.lat;
            WT_GeoPoint._tempValue.long = _1.long;
            returnValue = WT_GeoPoint._tempValue;
        } else if (typeof _1 === "number" && typeof _2 === "number") {
            WT_GeoPoint._tempValue.lat = _1;
            WT_GeoPoint._tempValue.long = _2;
            returnValue = WT_GeoPoint._tempValue;
        }
        return returnValue;
    }

    /**
     * Sets this point's coordinate values. This method takes either one or two arguments. The one-argument version takes a single object
     * with .lat and .long properties. The two-argument version takes two numbers.
     * @param {{lat:Number, long:Number}|Number} arg1 - an object defining the new coordinate values, or the new latitude
     *                                                                    value.
     * @param {Number} [arg2] - the new longitude value.
     * @returns {WT_GeoPoint} this point, after it has been changed.
     */
    set(arg1, arg2) {
        let value = WT_GeoPoint._parseArgs(arg1, arg2);
        if (value) {
            let lat = WT_GeoPoint._toPlusMinus180(value.lat);
            let long = WT_GeoPoint._toPlusMinus180(value.long);
            if (Math.abs(lat) > 90) {
                lat = 180 - lat;
                lat = WT_GeoPoint._toPlusMinus180(lat);
                long += 180;
                long = WT_GeoPoint._toPlusMinus180(long);
            }
            this._lat = lat;
            this._long = long;
            this._elevation = value.elevation;
        }
        return this;
    }

    /**
     * Sets this point's coordinate values from a cartesian position vector. By convention, in the cartesian coordinate system the
     * origin is at the center of the Earth, the positive x-axis passes through 0 degrees N, 0 degrees E, and the positive z-axis
     * passes through the north pole.
     * @param {WT_GVector3} vector - a position vector defining the new coordinates.
     * @returns {WT_GeoPoint} this point, after it has been changed.
     */
    setFromCartesian(vector) {
        return this.set(90 - vector.theta * Avionics.Utils.RAD2DEG, vector.phi * Avionics.Utils.RAD2DEG);
    }

    /**
     * Calculates the great-circle distance between this point and another point. This method takes either one or two arguments.
     * The one-argument version takes a single object with .lat and .long properties. The two-argument version takes two numbers.
     * @param {{lat:Number, long:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @returns {Number} the great-circle distance to the other point, in great-arc radians.
     */
    distance(arg1, arg2) {
        let other = WT_GeoPoint._parseArgs(arg1, arg2);
        if (other) {
            let lat1 = this.lat * Avionics.Utils.DEG2RAD;
            let lat2 = other.lat * Avionics.Utils.DEG2RAD;
            let long1 = this.long * Avionics.Utils.DEG2RAD;
            let long2 = other.long * Avionics.Utils.DEG2RAD;

            let sinHalfDeltaLat = Math.sin((lat2 - lat1) / 2);
            let sinHalfDeltaLong = Math.sin((long2 - long1) / 2);
            let a = sinHalfDeltaLat * sinHalfDeltaLat + Math.cos(lat1) * Math.cos(lat2) * sinHalfDeltaLong * sinHalfDeltaLong;
            return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        } else {
            return undefined;
        }
    }

    /**
     * Calculates the distance along the rhumb line connecting this point with another point. This method takes either one or two
     * arguments. The one-argument version takes a single object with .lat and .long properties. The two-argument version takes
     * two numbers.
     * @param {{lat:Number, long:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @returns {Number} the rhumb-line distance to the other point, in great-arc radians.
     */
    distanceRhumb(arg1, arg2) {
        let other = WT_GeoPoint._parseArgs(arg1, arg2);
        if (other) {
            let lat1 = this.lat * Avionics.Utils.DEG2RAD;
            let lat2 = other.lat * Avionics.Utils.DEG2RAD;
            let long1 = this.long * Avionics.Utils.DEG2RAD;
            let long2 = other.long * Avionics.Utils.DEG2RAD;
            let deltaLat = lat2 - lat1;
            let deltaLong = long2 - long1;

            let deltaPsi = WT_GeoPoint._deltaPsi(lat1, lat2);
            let correction = WT_GeoPoint._rhumbCorrection(deltaPsi, lat1, lat2);
            if (Math.abs(deltaLong) > Math.PI) {
                deltaLong += -Math.sign(deltaLong) * 2 * Math.PI;
            }
            return Math.sqrt(deltaLat * deltaLat + correction * correction * deltaLong * deltaLong);
        } else {
            return undefined;
        }
    }

    /**
     * Offsets this point by an initial bearing and distance along a great circle. The operation can either be performed in-place
     * or a new WT_GeoPoint object can be returned.
     * @param {Number} bearing - the initial bearing (forward azimuth) by which to offset.
     * @param {Number} distance - the distance, in great-arc radians, by which to offset.
     * @param {Boolean} [mutate] - whether to perform the operation in place.
     * @returns {WT_GeoPoint} the offset point, either as a new WT_GeoPoint object or this point after it has been changed.
     */
    offset(bearing, distance, mutate) {
        let lat = this.lat * Avionics.Utils.DEG2RAD;
        let long = this.long * Avionics.Utils.DEG2RAD;
        let sinLat = Math.sin(lat);
        let cosLat = Math.cos(lat);
        let sinBearing = Math.sin(bearing * Avionics.Utils.DEG2RAD);
        let cosBearing = Math.cos(bearing * Avionics.Utils.DEG2RAD);
        let angularDistance = distance;
        let sinAngularDistance = Math.sin(angularDistance);
        let cosAngularDistance = Math.cos(angularDistance);

        let offsetLatRad = Math.asin(sinLat * cosAngularDistance + cosLat * sinAngularDistance * cosBearing);
        let offsetLongDeltaRad = Math.atan2(sinBearing * sinAngularDistance * cosLat, cosAngularDistance - sinLat * Math.sin(offsetLatRad));

        let offsetLat = offsetLatRad * Avionics.Utils.RAD2DEG;
        let offsetLong = (long + offsetLongDeltaRad) * Avionics.Utils.RAD2DEG;

        if (mutate) {
            return this.set(offsetLat, offsetLong);
        } else {
            return new WT_GeoPoint(offsetLat, offsetLong);
        }
    }

    /**
     * Offsets this point by a constant bearing and distance along a rhumb line. The operation can either be performed in-place
     * or a new WT_GeoPoint object can be returned.
     * @param {Number} bearing - the bearing by which to offset.
     * @param {Number} distance - the distance, in great-arc radians, by which to offset.
     * @param {Boolean} [mutate] - whether to perform the operation in place.
     * @returns {WT_GeoPoint} the offset point, either as a new WT_GeoPoint object or this point after it has been changed.
     */
    offsetRhumb(bearing, distance, mutate) {
        let lat = this.lat * Avionics.Utils.DEG2RAD;
        let long = this.long * Avionics.Utils.DEG2RAD;
        let bearingRad = bearing * Avionics.Utils.DEG2RAD;

        let deltaLat = distance * Math.cos(bearingRad);
        let offsetLat = lat + deltaLat;

        if (Math.abs(offsetLat) >= Math.PI / 2) {
            // you can't technically go past the poles along a rhumb line, so we will simply terminate the path at the pole
            offsetLat = Math.sign(offsetLat) * 90;
            offsetLong = 0; // since longitude is meaningless at the poles, we'll arbitrarily pick a longitude of 0 degrees.
        } else {
            let deltaPsi = WT_GeoPoint._deltaPsi(lat, offsetLat);
            let correction = WT_GeoPoint._rhumbCorrection(deltaPsi, lat, offsetLat);
            let deltaLong = distance * Math.sin(bearingRad) / correction;
            let offsetLong = long + deltaLong;

            offsetLat *= Avionics.Utils.RAD2DEG;
            offsetLong *= Avionics.Utils.RAD2DEG;
        }

        if (mutate) {
            return this.set(offsetLat, offsetLong);
        } else {
            return new WT_GeoPoint(offsetLat, offsetLong);
        }
    }

    _calculateBearing(origin, destination) {
        let lat1 = origin.lat * Avionics.Utils.DEG2RAD;
        let lat2 = destination.lat * Avionics.Utils.DEG2RAD;
        let long1 = origin.long * Avionics.Utils.DEG2RAD;
        let long2 = destination.long * Avionics.Utils.DEG2RAD;
        let cosLat2 = Math.cos(lat2);
        let x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * cosLat2 * Math.cos(long2 - long1);
        let y = Math.sin(long2 - long1) * cosLat2;
        let bearing = Math.atan2(y, x) * Avionics.Utils.RAD2DEG;
        return (bearing + 360) % 360;
    }

    /**
     * Calculates the initial bearing (forward azimuth) from this point to another point along the great circle connecting the two.
     * This method takes either one or two arguments. The one-argument version takes a single object with .lat, .long properties.
     * The two-argument version takes two numbers.
     * @param {{lat:Number, long:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @returns {Number} the initial bearing to the other point, in degrees.
     */
    bearingTo(arg1, arg2) {
        let other = WT_GeoPoint._parseArgs(arg1, arg2, 0);
        if (other) {
            return this._calculateBearing(this, other);
        } else {
            return undefined;
        }
    }

    /**
     * Calculates the final bearing from another point to this point (i.e. the back azimuth from this point to the other point)
     * along the great circle connecting the two. This method takes either one or two arguments. The one-argument version takes
     * a single object with .lat, .long properties. The two-argument version takes two numbers.
     * @param {{lat:Number, long:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @returns {Number} the final bearing from the other point, in degrees.
     */
    bearingFrom(arg1, arg2) {
        let other = WT_GeoPoint._parseArgs(arg1, arg2, 0);
        if (other) {
            return (this._calculateBearing(this, other) + 180) % 360;
        } else {
            return undefined;
        }
    }

    /**
     * Calculates the constant bearing to another point to this point along the rhumb line connecting the two. This method takes
     * either one or two arguments. The one-argument version takes a single object with .lat, .long properties. The two-argument
     * version takes two numbers.
     * @param {{lat:Number, long:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @returns {Number} the constant bearing to the other point, in degrees.
     */
    bearingRhumb(arg1, arg2) {
        let other = WT_GeoPoint._parseArgs(arg1, arg2, 0);
        if (other) {
            let lat1 = this.lat * Avionics.Utils.DEG2RAD;
            let long1 = this.long * Avionics.Utils.DEG2RAD;
            let lat2 = other.lat * Avionics.Util.DEG2RAD;
            let long2 = other.long * Avionics.Util.DEG2RAD;

            let deltaLong = long2 - long1;
            let deltaPsi = WT_GeoPoint._deltaPsi(lat1, lat2);
            if (Math.abs(deltaLong) > Math.PI) {
                deltaLong += -Math.sign(deltaLong) * 2 * Math.PI;
            }
            return Math.atan2(deltaLong, deltaPsi) * Avionics.Utils.RAD2DEG;
        } else {
            return undefined;
        }
    }

    /**
     * Calculates the cartesian (x, y, z) representation of this point, in units of great-arc radians, and returns the result.
     * By convention, in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
     * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
     * @param {WT_GVector3} [reference] - a WT_GVector3 object in which to store the results. If this argument is not supplied,
     *                                    a new WT_GVector3 object will be created.
     * @returns {WT_GVector3} the cartesian representation of this point.
     */
    cartesian(reference) {
        if (reference) {
            return reference.setFromSpherical(1, (90 - this.lat) * Avionics.Utils.DEG2RAD, this.long * Avionics.Utils.DEG2RAD);
        } else {
            return WT_GVector3.createFromSpherical(1, (90 - this.lat) * Avionics.Utils.DEG2RAD, this.long * Avionics.Utils.DEG2RAD);
        }
    }

    /**
     * Checks whether this point is equal to another point. Two points are considered equal if and only if they occupy the same location.
     * @param {{lat:Number, long:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @returns {Boolean} whether this point is equal to the other point.
     */
    equals(arg1, arg2, arg3) {
        let other = WT_GeoPoint._parseArgs(arg1, arg2);
        if (other) {
            return Math.abs(this.lat - other.lat) + Math.abs(this.long - other.long) <= WT_GeoPoint.EQUALITY_TOLERANCE;
        } else {
            return false;
        }
    }

    /**
     * Copies this point.
     * @returns {WT_GeoPoint} a copy of this point.
     */
    copy() {
        return new WT_GeoPoint(this.lat, this.long);
    }

    /**
     * Gets a read-only version of this point. The read-only version is updated as this point is changed. Attempting to call
     * any mutating method on the read-only version will create and return a mutated copy of this point instead.
     * @returns {WT_GeoPointReadOnly} a read-only version of this point.
     */
    readonly() {
        return this._readonly;
    }

    static _toPlusMinus180(value) {
        return ((value % 360) + 540) % 360 - 180;
    }

    static _deltaPsi(latRad1, latRad2) {
        return Math.log(Math.tan(latRad2 / 2 + Math.PI / 4) / Math.tan(latRad1 / 2 + Math.PI / 4));
    }

    static _rhumbCorrection(deltaPsi, latRad1, latRad2) {
        return Math.abs(deltaPsi) > 1e-12 ? (latRad2 - latRad1) / deltaPsi : Math.cos(lat1);
    }
}
WT_GeoPoint._tempValue = {lat: 0, long: 0};
WT_GeoPoint.EQUALITY_TOLERANCE = 1e-8; // 6 cm

/**
 * A read-only interface for a WT_GeoPoint.
 */
class WT_GeoPointReadOnly {
    /**
     * @param {WT_GeoPoint} source
     */
    constructor(source) {
        this._source = source;
    }

    /**
     * @readonly
     * @property {Number} lat - the latitude of this point, in degrees.
     * @type {Number}
     */
    get lat() {
        return this._source.lat;
    }

    /**
     * @readonly
     * @property {Number} long - the longitude of this point, in degrees.
     * @type {Number}
     */
    get long() {
        return this._source.long;
    }

    /**
     * Copies this point and sets the copy's coordinate values. This method takes either one or two arguments. The one-argument
     * version takes a single object with .lat and .long properties. The two-argument version takes two numbers.
     * @param {{lat:Number, long:Number}|Number} arg1 - an object defining the new coordinate values, or the new latitude
     *                                                                    value.
     * @param {Number} [arg2] - the new longitude value.
     * @returns {WT_GeoPoint} this point, after it has been changed.
     */
    set(arg1, arg2) {
        return this._source.copy().set(arg1, arg2);
    }

    /**
     * Copies this point and sets the copy's coordinate values from a cartesian position vector. By convention, in the cartesian
     * coordinate system the origin is at the center of the Earth, the positive x-axis passes through 0 degrees N, 0 degrees E,
     * and the positive z-axis passes through the north pole.
     * @param {WT_GVector3} vector - a position vector defining the new coordinates.
     * @returns {WT_GeoPoint} this point, after it has been changed.
     */
    setFromCartesian(vector) {
        return this._source.copy().setFromCartesian(vector);
    }

    /**
     * Calculates the great-circle distance between this point and another point. This method takes either one or two arguments.
     * The one-argument version takes a single object with .lat and .long properties. The two-argument version takes two numbers.
     * @param {{lat:Number, long:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @returns {Number} the great-circle distance to the other point, in great-arc radians.
     */
    distance(arg1, arg2) {
        return this._source.distance(arg1, arg2);
    }

    /**
     * Calculates the distance along the rhumb line connecting this point with another point. This method takes either one or two
     * arguments. The one-argument version takes a single object with .lat and .long properties. The two-argument version takes
     * two numbers.
     * @param {{lat:Number, long:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @returns {Number} the rhumb-line distance to the other point, in great-arc radians.
     */
    distanceRhumb(arg1, arg2) {
        return this._source.distanceRhumb(arg1, arg2);
    }

    /**
     * Offsets this point by an initial bearing and distance along a great-circle. The operation can either be performed in-place
     * or a new WT_GeoPoint object can be returned.
     * @param {Number} bearing - the initial bearing (forward azimuth) by which to offset.
     * @param {Number} distance - the distance, in great-arc radians, by which to offset.
     * @returns {WT_GeoPoint} the offset point.
     */
    offset(bearing, distance) {
        return this._source.offset(bearing, distance, false);
    }

    /**
     * Offsets this point by a constant bearing and distance along a rhumb line. The operation can either be performed in-place
     * or a new WT_GeoPoint object can be returned.
     * @param {Number} bearing - the bearing by which to offset.
     * @param {Number} distance - the distance, in great-arc radians, by which to offset.
     * @returns {WT_GeoPoint} the offset point, either as a new WT_GeoPoint object or this point after it has been changed.
     */
    offsetRhumb(bearing, distance) {
        return this._source.offsetRhumb(bearing, distance, false);
    }

    /**
     * Calculates the initial bearing (forward azimuth) from this point to another point along the great circle connecting the two.
     * This method takes either one or two arguments. The one-argument version takes a single object with .lat, .long properties.
     * The two-argument version takes two numbers.
     * @param {{lat:Number, long:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @returns {Number} the initial bearing to the other point, in degrees.
     */
    bearingTo(arg1, arg2) {
        return this._source.bearingTo(arg1, arg2);
    }

    /**
     * Calculates the final bearing from another point to this point (i.e. the back azimuth from this point to the other point)
     * along the great circle connecting the two. This method takes either one or two arguments. The one-argument version takes
     * a single object with .lat, .long properties. The two-argument version takes two numbers.
     * @param {{lat:Number, long:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @returns {Number} the final bearing from the other point, in degrees.
     */
    bearingFrom(arg1, arg2) {
        return this._source.bearingFrom(arg1, arg2);
    }

    /**
     * Calculates the constant bearing to another point to this point along the rhumb line connecting the two. This method takes
     * either one or two arguments. The one-argument version takes a single object with .lat, .long properties. The two-argument
     * version takes two numbers.
     * @param {{lat:Number, long:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @returns {Number} the constant bearing to the other point, in degrees.
     */
    bearingRhumb(arg1, arg2) {
        return this._source.bearingRhumb(arg1, arg2);
    }

    /**
     * Calculates the cartesian (x, y, z) representation of this point, in units of great-arc radians, and returns the result.
     * By convention, in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
     * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
     * @param {WT_GVector3} [reference] - a WT_GVector3 object in which to store the results. If this argument is not supplied,
     *                                    a new WT_GVector3 object will be created.
     * @returns {WT_GVector3} the cartesian representation of this point.
     */
    cartesian(reference) {
        return this._source.cartesian(reference);
    }

    /**
     * Checks whether this point is equal to another point. Two points are considered equal if and only if they occupy the same location.
     * @param {{lat:Number, long:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @returns {Boolean} whether this point is equal to the other point.
     */
    equals(arg1, arg2) {
        return this._source.equals(arg1, arg2);
    }

    /**
     * Copies this point.
     * @returns {WT_GeoPoint} a copy of this point.
     */
    copy() {
        return this._source.copy();
    }

    /**
     * Gets a read-only version of this point. The read-only version is updated as this point is changed. Attempting to call
     * any mutating method on the read-only version will create and return a mutated copy of this point instead.
     * @returns {WT_GeoPointReadOnly} a read-only version of this point.
     */
    readonly() {
        return this;
    }
}