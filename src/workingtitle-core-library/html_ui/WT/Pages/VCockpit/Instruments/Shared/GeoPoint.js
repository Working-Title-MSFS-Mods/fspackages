/**
 * A point on Earth defined by latitude, longitude, and elevation.
 */
class WT_GeoPoint {
    /**
     * @param {Number} lat - the latitude, in degrees.
     * @param {Number} long - the longitude, in degrees.
     * @param {Number} elevation - the elevation, in great-arc radians.
     */
    constructor(lat, long, elevation) {
        this.set(lat, long, elevation);
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

    /**
     * @readonly
     * @property {Number} elevation - the elevation of this point, in great-arc radians.
     * @type {Number}
     */
    get elevation() {
        return this._elevation;
    }

    static _parseArgs(_1, _2, _3) {
        let returnValue = undefined;
        if (_1 !== undefined && typeof _1.lat === "number" && typeof _1.long === "number" && typeof _1.elevation === "number") {
            WT_GeoPoint._tempValue.lat = _1.lat;
            WT_GeoPoint._tempValue.long = _1.long;
            WT_GeoPoint._tempValue.elevation = _1.elevation;
            returnValue = WT_GeoPoint._tempValue;
        } else if (typeof _1 === "number" && typeof _2 === "number" && typeof _3 === "number") {
            WT_GeoPoint._tempValue.lat = _1;
            WT_GeoPoint._tempValue.long = _2;
            WT_GeoPoint._tempValue.elevation = _3;
            returnValue = WT_GeoPoint._tempValue;
        }
        return returnValue;
    }

    /**
     * Sets this point's coordinate values. This method takes either one or three arguments. The one-argument version takes a single object
     * with .lat, .long, .elevation properties. The three-argument version takes three numbers.
     * @param {{lat:Number, long:Number, elevation:Number}|Number} arg1 - an object defining the new coordinate values, or the new latitude
     *                                                                    value.
     * @param {Number} [arg2] - the new longitude value.
     * @param {Number} [arg3] - the new elevation value.
     * @returns {WT_GeoPoint} this point, after it has been changed.
     */
    set(arg1, arg2, arg3) {
        let value = WT_GeoPoint._parseArgs(arg1, arg2, arg3);
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
     * Calculates the distance between two points. This method takes either one or three arguments. The one-argument version takes a single
     * object with .lat, .long, .elevation properties. The three-argument version takes three numbers.
     * @param {{lat:Number, long:Number, elevation:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @param {Number} [arg3] - the elevation value of the other point.
     * @returns {Number} the distance between the two points, in great-arc radians.
     */
    distance(arg1, arg2, arg3) {
        let other = WT_GeoPoint._parseArgs(arg1, arg2, arg3);
        if (other) {
            let lat1 = this.lat * Avionics.Utils.DEG2RAD;
            let lat2 = other.lat * Avionics.Utils.DEG2RAD;
            let long1 = this.long * Avionics.Utils.DEG2RAD;
            let long2 = other.long * Avionics.Utils.DEG2RAD;
            let deltaElevation = other.elevation - this.elevation;

            let sinHalfDeltaLat = Math.sin((lat2 - lat1) / 2);
            let sinHalfDeltaLong = Math.sin((long2 - long1) / 2);
            let a = sinHalfDeltaLat * sinHalfDeltaLat + Math.cos(lat1) * Math.cos(lat2) * sinHalfDeltaLong * sinHalfDeltaLong;
            let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return Math.sqrt(c * c + deltaElevation * deltaElevation);
        } else {
            return undefined;
        }
    }

    /**
     * Offsets this point by a constant bearing and distance. The operation can either be performed in-place or a new WT_GeoPoint
     * object can be returned.
     * @param {Number} bearing - the initial bearing (forward azimuth) by which to offset.
     * @param {Number} distance - the distance, in great-arc radians, by which to offset.
     * @param {Boolean} [mutate] - whether to perform the operation in place.
     * @returns {WT_GeoPoint} the offset point, either as a new WT_GeoPoint object or this point after it has been changed.
     */
    offset(bearing, distance, mutate) {
        let lat = this.lat;
        let long = this.long;
        let sinLat = Math.sin(lat * Avionics.Utils.DEG2RAD);
        let cosLat = Math.cos(lat * Avionics.Utils.DEG2RAD);
        let sinBearing = Math.sin(bearing * Avionics.Utils.DEG2RAD);
        let cosBearing = Math.cos(bearing * Avionics.Utils.DEG2RAD);
        let angularDistance = distance;
        let sinAngularDistance = Math.sin(angularDistance);
        let cosAngularDistance = Math.cos(angularDistance);

        let offsetLatRad = Math.asin(sinLat * cosAngularDistance + cosLat * sinAngularDistance * cosBearing);
        let offsetLongDeltaRad = Math.atan2(sinBearing * sinAngularDistance * cosLat, cosAngularDistance - sinLat * Math.sin(offsetLatRad));

        let offsetLat = offsetLatRad * Avionics.Utils.RAD2DEG;
        let offsetLong = long + offsetLongDeltaRad * Avionics.Utils.RAD2DEG;

        if (mutate) {
            return this.set(offsetLat, offsetLong, this.elevation);
        } else {
            return new WT_GeoPoint(offsetLat, offsetLong, this.elevation);
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
     * Calculates the initial bearing (forward azimuth) from this point to another point. This method takes either one or two arguments.
     * The one-argument version takes a single object with .lat, .long properties. The two-argument version takes two numbers.
     * @param {{lat:Number, long:Number, elevation:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
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
     * Calculates the final bearing from another point to this point (i.e. the back azimuth from this point to the other point).
     * This method takes either one or two arguments. The one-argument version takes a single object with .lat, .long properties.
     * The two-argument version takes two numbers.
     * @param {{lat:Number, long:Number, elevation:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
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
     * Checks whether this point is equal to another point. Two points are considered equal if and only if they occupy the same location.
     * @param {{lat:Number, long:Number, elevation:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @param {Number} [arg3] - the elevation value of the other point.
     * @returns {Boolean} whether this point is equal to the other point.
     */
    equals(arg1, arg2, arg3) {
        let other = WT_GeoPoint._parseArgs(arg1, arg2, arg3);
        if (other) {
            return this.lat === other.lat && this.long === other.long && this.elevation === other.elevation;
        } else {
            return false;
        }
    }

    /**
     * Copies this point.
     * @returns {WT_GeoPoint} a copy of this point.
     */
    copy() {
        return new WT_GeoPoint(this.lat, this.long, this.elevation);
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
}
WT_GeoPoint._tempValue = {lat: 0, long: 0, elevation: 0};

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
     * @readonly
     * @property {Number} elevation - the elevation of this point, in great-arc radians.
     * @type {Number}
     */
    get elevation() {
        return this._source.elevation;
    }

    /**
     * Sets this point's coordinate values. This method takes either one or three arguments. The one-argument version takes a single object
     * with .lat, .long, .elevation properties. The three-argument version takes three numbers.
     * @param {{lat:Number, long:Number, elevation:Number}|Number} arg1 - an object defining the new coordinate values, or the new latitude
     *                                                                    value.
     * @param {Number} [arg2] - the new longitude value.
     * @param {Number} [arg3] - the new elevation value.
     * @returns {WT_GeoPoint} this point, after it has been changed.
     */
    set(arg1, arg2, arg3) {
        return this._source.copy().set(arg1, arg2, arg3);
    }

    /**
     * Calculates the distance between two points. This method takes either one or three arguments. The one-argument version takes a single
     * object with .lat, .long, .elevation properties. The three-argument version takes three numbers.
     * @param {{lat:Number, long:Number, elevation:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @param {Number} [arg3] - the elevation value of the other point.
     * @returns {Number} the distance between the two points, in great-arc radians.
     */
    distance(arg1, arg2, arg3) {
        return this._source.distance(arg1, arg2, arg3);
    }

    /**
     * Offsets this point by a constant bearing and distance and returns the result as a new WT_GeoPoint object.
     * object can be returned.
     * @param {Number} bearing - the initial bearing (forward azimuth) by which to offset.
     * @param {Number} distance - the distance, in great-arc radians, by which to offset.
     * @param {Boolean} [mutate] - this argument is ignored.
     * @returns {WT_GeoPoint} the offset point.
     */
    offset(bearing, distance, mutate) {
        return this._source.offset(bearing, distance, false);
    }

    /**
     * Calculates the initial bearing (forward azimuth) from this point to another point. This method takes either one or two arguments.
     * The one-argument version takes a single object with .lat, .long properties. The two-argument version takes two numbers.
     * @param {{lat:Number, long:Number, elevation:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @returns {Number} the initial bearing to the other point, in degrees.
     */
    bearingTo(arg1, arg2) {
        return this._source.bearingTo(arg1, arg2);
    }

    /**
     * Calculates the final bearing from another point to this point (i.e. the back azimuth from this point to the other point).
     * This method takes either one or two arguments. The one-argument version takes a single object with .lat, .long properties.
     * The two-argument version takes two numbers.
     * @param {{lat:Number, long:Number, elevation:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @returns {Number} the final bearing from the other point, in degrees.
     */
    bearingFrom(arg1, arg2) {
        return this._source.bearingFrom(arg1, arg2);
    }

    /**
     * Checks whether this point is equal to another point. Two points are considered equal if and only if they occupy the same location.
     * @param {{lat:Number, long:Number, elevation:Number}|Number} arg1 - an object defining the coordinate values of the other point, or the
     *                                                                    latitude value of the other point.
     * @param {Number} [arg2] - the longitude value of the other point.
     * @param {Number} [arg3] - the elevation value of the other point.
     * @returns {Boolean} whether this point is equal to the other point.
     */
    equals(arg1, arg2, arg3) {
        return this._source.equals(arg1, arg2, arg3);
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