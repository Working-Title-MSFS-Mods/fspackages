/**
 * A 3D vector.
 */
class WT_GVector3 {
    /**
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     */
    constructor(x, y, z) {
        this.set(x, y, z);
        this._readonly = new WT_GVector3ReadOnly(this);
    }

    /**
     * @readonly
     * @property {Number} x - the x value of this vector.
     * @type {Number}
     */
    get x() {
        return this._x;
    }

    /**
     * @readonly
     * @property {Number} y - the y value of this vector.
     * @type {Number}
     */
    get y() {
        return this._y;
    }

    /**
     * @readonly
     * @property {Number} z - the z value of this vector.
     * @type {Number}
     */
    get z() {
        return this._z;
    }

    /**
     * @readonly
     * @property {Number} length - the length of this vector.
     * @type {Number}
     */
    get length() {
        return this._length;
    }

    /**
     * @readonly
     * @property {Number} theta - the inclination of this vector in spherical coordinates.
     * @type {Number}
     */
    get theta() {
        return this._theta;
    }

    /**
     * @readonly
     * @property {Number} phi - the azimuth of this vector in spherical coordinates.
     * @type {Number}
     */
    get phi() {
        return this._phi;
    }

    static _parseArgs(_1, _2, _3) {
        let returnValue = undefined;
        if (_1 !== undefined && typeof _1.x === "number" && typeof _1.y === "number" && typeof _1.z === "number") {
            WT_GVector3._tempValue.x = _1.x;
            WT_GVector3._tempValue.y = _1.y;
            WT_GVector3._tempValue.z = _1.z;
            returnValue = WT_GVector3._tempValue;
        } else if (typeof _1 === "number" && typeof _2 === "number" && typeof _3 === "number") {
            WT_GVector3._tempValue.x = _1;
            WT_GVector3._tempValue.y = _2;
            WT_GVector3._tempValue.z = _3;
            returnValue = WT_GVector3._tempValue;
        }
        return returnValue;
    }

    _updateSphericals() {
        this._length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        this._theta = Math.atan2(Math.sqrt(this.x * this.x + this.y * this.y), this.z);
        this._phi = Math.atan2(this.y, this.x);
    }

    /**
     * Sets this vector's x, y, z values. This method takes either one or three arguments. The one-argument version takes a single object
     * with .x, .y, .z properties. The three-argument version takes three scalar numbers.
     * @param {{x:Number, y:Number, z:Number}|Number} arg1 - an object defining the new x, y, z values, or the new x value as a scalar number.
     * @param {Number} [arg2] - the new y value as a scalar number.
     * @param {Number} [arg3] - the new z value as a scalar number.
     * @returns {WT_GVector3} this vector, after it has been changed.
     */
    set(arg1, arg2, arg3) {
        let value = WT_GVector3._parseArgs(arg1, arg2, arg3);
        if (value) {
            this._x = value.x;
            this._y = value.y;
            this._z = value.z;
            this._updateSphericals();
        }
        return this;
    }

    /**
     * Sets this vector's x, y, z values using spherical coordinates.
     * @param {Number} r - the new radius.
     * @param {Number} theta - the new inclination.
     * @param {Number} phi - the new azimuth.
     * @returns {WT_GVector3} this vector, after it has been changed.
     */
    setFromSpherical(r, theta, phi) {
        let sinTheta = Math.sin(theta);
        return this.set(r * sinTheta * Math.cos(phi), r * sinTheta * Math.sin(phi), r * Math.cos(theta));
    }

    /**
     * Scales this vector to a length of one. The operation can either be performed in-place or a new WT_GVector3 object can
     * be returned.
     * @param {Boolean} [mutate] - whether to perform the operation in place.
     * @return {WT_GVector3} the unit vector, either as a new WT_GVector3 object or this vector after it has been changed.
     */
    unit(mutate) {
        return this.scale(1 / this.length, mutate);
    }

    /**
     * Adds another vector to this one and returns the result as a new WT_GVector2 object. This method takes either one or three arguments.
     * The one-argument version takes a single object with .x, .y, .z properties. The three-argument version takes three scalar numbers.
     * @param {{x:Number, y:Number, z:Number}|Number} arg1 - an object defining the x, y, z values of the vector to add, or the x value to
     *                                                       add as a scalar number.
     * @param {Number} [arg2] - the y value to add as a scalar number.
     * @param {Number} [arg3] - the z value to add as a scalar number.
     * @returns {WT_GVector3} the summed vector.
     */
    plus(arg1, arg2, arg3) {
        let value = WT_GVector3._parseArgs(arg1, arg2, arg3);
        if (value) {
            return new WT_GVector3(this.x + value.x, this.y + value.y, this.z + value.z);
        }
        return undefined;
    }

    /**
     * Adds another vector to this one in place and returns this vector. This method takes either one or three arguments.
     * The one-argument version takes a single object with .x, .y, .z properties. The three-argument version takes three scalar numbers.
     * @param {{x:Number, y:Number, z:Number}|Number} arg1 - an object defining the x, y, z values of the vector to add, or the x value to add
     * as a scalar number.
     * @param {Number} [arg2] - the y value to add as a scalar number.
     * @param {Number} [arg3] - the z value to add as a scalar number.
     * @returns {WT_GVector3} this vector, after it has been changed.
     */
    add(arg1, arg2, arg3) {
        let value = WT_GVector3._parseArgs(arg1, arg2, arg3);
        if (value) {
            this._x += value.x;
            this._y += value.y;
            this._z += value.z;
            this._updateSphericals();
        }
        return this;
    }

    /**
     * Subtracts another vector from this one and returns the result as a new WT_GVector2 object. This method takes either one or three arguments.
     * The one-argument version takes a single object with .x, .y, .z properties. The three-argument version takes three scalar numbers.
     * @param {{x:Number, y:Number, z:Number}|Number} arg1 - an object defining the x, y, z values of the vector to subtract, or the x value
     *                                                       to subtract as a scalar number.
     * @param {Number} [arg2] - the y value to subtract as a scalar number.
     * @param {Number} [arg3] - the z value to subtract as a scalar number.
     * @returns {WT_GVector3} the difference vector.
     */
    minus(arg1, arg2, arg3) {
        let value = WT_GVector3._parseArgs(arg1, arg2, arg3);
        if (value) {
            return new WT_GVector3(this.x - value.x, this.y - value.y, this.z = value.z);
        }
        return undefined;
    }

    /**
     * Subtracts another vector to this one in place and returns this vector. This method takes either one or three arguments.
     * The one-argument version takes a single object with .x, .y, .z properties. The three-argument version takes three scalar numbers.
     * @param {{x:Number, y:Number, z:Number}|Number} arg1 - an object defining the x, y, z values of the vector to subtract, or the x value
     *                                                       to subtract as a scalar number.
     * @param {Number} [arg2] - the y value to subtract as a scalar number.
     * @param {Number} [arg3] - the z value to subtract as a scalar number.
     * @returns {WT_GVector3} this vector, after it has been changed.
     */
    subtract(arg1, arg2, arg3) {
        let value = WT_GVector3._parseArgs(arg1, arg2, arg3);
        if (value) {
            this._x -= value.x;
            this._y -= value.y;
            this._z -= value.z;
            this._updateSphericals();
        }
        return this;
    }

    /**
     * Scales this vector by a scalar factor. The operation can either be performed in-place or a new WT_GVector3 object can
     * be returned.
     * @param {Number} factor - the scalar factor by which to scale.
     * @param {Boolean} [mutate] - whether to perform the operation in place.
     * @return {WT_GVector3} the scaled vector, either as a new WT_GVector3 object or this vector after it has been changed.
     */
    scale(factor, mutate) {
        let x = this.x * factor;
        let y = this.y * factor;
        let z = this.z * factor;
        if (mutate) {
            return this.set(x, y, z);
        } else {
            return new WT_GVector3(x, y, z);
        }
    }

    /**
     * Calculates the dot (scalar) product of this vector and another vector. This method takes either one or three arguments.
     * The one-argument version takes a single object with .x, .y, .z properties. The three-argument version takes three scalar numbers.
     * @param {{x:Number, y:Number, z:Number}|Number} arg1 - an object defining the x, y, z values of other vector, or the x value of the
     *                                                       other vector as a scalar number.
     * @param {Number} [arg2] - the y value of the other vector as a scalar number.
     * @param {Number} [arg3] - the z value of the other vector as a scalar number.
     * @returns {Number} the dot product.
     */
    dot(arg1, arg2, arg3) {
        let other = WT_GVector3._parseArgs(arg1, arg2, arg3);
        let returnValue = undefined;
        if (other) {
            returnValue = this.x * other.x + this.y * other.y + this.z * other.z;
        }
        return returnValue;
    }

    /**
     * Calculates the cross product of this vector and another vector. The operation can either be performed in-place or a
     * new WT_GVector3 object can be returned.
     * @param {{x:Number, y:Number, z:Number}|Number} arg1 - an object defining the x, y, z values of other vector, or the x value of the
     *                                                       other vector as a scalar number.
     * @param {Number|Boolean} [arg2] - the y value of the other vector as a scalar number, or whether to perform the operation
     *                                  in place.
     * @param {Number} [arg3] - the z value of the other vector as a scalar number.
     * @param {Boolean} [arg4] - whether to perform the operation in-place.
     * @returns {WT_GVector3} the cross product, either as a new WT_GVector3 object or this vector after it has been changed.
     */
    cross(arg1, arg2, arg3, arg4) {
        let other = WT_GVector3._parseArgs(arg1, arg2, arg3);
        let returnValue = undefined;
        if (other) {
            let x = this.y * other.z - this.z * other.y;
            let y = this.z * other.x - this.x * other.z;
            let z = this.x * other.y - this.y * other.x;
            if (arg2 === true || arg4 === true) {
                returnValue = this.set(x, y, z);
            } else {
                returnValue = new WT_GVector3(x, y, z);
            }
        }
        return returnValue;
    }

    /**
     * Checks whether this vector is equal to another vector (i.e. has the same x, y, z values). This method takes either one or three arguments.
     * The one-argument version takes a single object with .x, .y, .z properties. The three-argument version takes three scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x, y, z values of other vector, or the x value of the other vector
     * as a scalar number.
     * @param {Number} [arg2] - the y value of the other vector as a scalar number.
     * @param {Number} [arg3] - the z value of the other vector as a scalar number.
     * @returns {Boolean} whether this vector is equal to the other vector.
     */
    equals(arg1, arg2, arg3) {
        let other = WT_GVector3._parseArgs(arg1, arg2, arg3);
        if (!other) {
            return false;
        }
        return this.x === other.x && this.y === other.y && this.z === other.z;
    }

    /**
     * Copies this vector.
     * @returns {WT_GVector3} a copy of this vector.
     */
    copy() {
        return new WT_GVector3(this.x, this.y, this.z);
    }

    /**
     * Gets a read-only version of this vector. The read-only version is updated as this vector is changed. Attempting to call
     * any mutating method on the read-only version will create and return a mutated copy of this vector instead.
     * @returns {WT_GVector3ReadOnly} a read-only version of this vector.
     */
    readonly() {
        return this._readonly;
    }

    /**
     * @returns a string representation of this vector.
     */
    toString() {
        return `[${this.x} ${this.y} ${this.z}]`;
    }

    /**
     * Creates a new 3D vector using spherical coordinates.
     * @param {Number} r - the radius of the new vector.
     * @param {Number} theta - the inclination of the new vector.
     * @param {Number} phi - the azimuth of the new vector.
     * @returns {WT_GVector3} a 3D vector.
     */
    static createFromSpherical(r, theta, phi) {
        let sinTheta = Math.sin(theta);
        return new WT_GVector3(r * sinTheta * Math.cos(phi), r * sinTheta * Math.sin(phi), r * Math.cos(theta));
    }
}
WT_GVector3._tempValue = {x: 0, y: 0, z: 0};

/**
 * A read-only interface for a WT_GVector3.
 */
class WT_GVector3ReadOnly {
    /**
     * @param {WT_GVector3} source
     */
    constructor(source) {
        this._source = source;
    }

    /**
     * @readonly
     * @property {Number} x - the x value of this vector.
     * @type {Number}
     */
    get x() {
        return this._source.x;
    }

    /**
     * @readonly
     * @property {Number} y - the y value of this vector.
     * @type {Number}
     */
    get y() {
        return this._source.y;
    }

    /**
     * @readonly
     * @property {Number} z - the z value of this vector.
     * @type {Number}
     */
    get z() {
        return this._source.z;
    }

    /**
     * @readonly
     * @property {Number} length - the length of this vector.
     * @type {Number}
     */
    get length() {
        return this._source.length;
    }

    /**
     * Sets this vector's x, y, z values. This method takes either one or three arguments. The one-argument version takes a single object
     * with .x, .y, .z properties. The three-argument version takes three scalar numbers.
     * @param {{x:Number, y:Number, z:Number}|Number} arg1 - an object defining the new x, y, z values, or the new x value as a scalar number.
     * @param {Number} [arg2] - the new y value as a scalar number.
     * @param {Number} [arg3] - the new z value as a scalar number.
     * @returns {WT_GVector3} this vector, after it has been changed.
     */
    set(arg1, arg2, arg3) {
        return this._source.copy.set(arg1, arg2, arg3);
    }

    /**
     * Sets this vector's x, y, z values using spherical coordinates.
     * @param {Number} r - the new radius.
     * @param {Number} theta - the new inclination.
     * @param {Number} phi - the new azimuth.
     * @returns {WT_GVector3} this vector, after it has been changed.
     */
    setFromSpherical(r, theta, phi) {
        return this._source.copy.setFromSpherical(r, theta, phi);
    }

    /**
     * Scales this vector to a length of one. The operation can either be performed in-place or a new WT_GVector3 object can
     * be returned.
     * @return {WT_GVector3} the unit vector, either as a new WT_GVector3 object or this vector after it has been changed.
     */
    unit() {
        return this._source.unit(false);
    }

    /**
     * Adds another vector to this one and returns the result as a new WT_GVector2 object. This method takes either one or three arguments.
     * The one-argument version takes a single object with .x, .y, .z properties. The three-argument version takes three scalar numbers.
     * @param {{x:Number, y:Number, z:Number}|Number} arg1 - an object defining the x, y, z values of the vector to add, or the x value to
     *                                                       add as a scalar number.
     * @param {Number} [arg2] - the y value to add as a scalar number.
     * @param {Number} [arg3] - the z value to add as a scalar number.
     * @returns {WT_GVector3} the summed vector.
     */
    plus(arg1, arg2, arg3) {
        return this._source.plus(arg1, arg2, arg3);
    }

    /**
     * Adds another vector to this one in place and returns this vector. This method takes either one or three arguments.
     * The one-argument version takes a single object with .x, .y, .z properties. The three-argument version takes three scalar numbers.
     * @param {{x:Number, y:Number, z:Number}|Number} arg1 - an object defining the x, y, z values of the vector to add, or the x value to add
     * as a scalar number.
     * @param {Number} [arg2] - the y value to add as a scalar number.
     * @param {Number} [arg3] - the z value to add as a scalar number.
     * @returns {WT_GVector3} this vector, after it has been changed.
     */
    add(arg1, arg2, arg3) {
        return this._source.plus(arg1, arg2, arg3);
    }

    /**
     * Subtracts another vector from this one and returns the result as a new WT_GVector2 object. This method takes either one or three arguments.
     * The one-argument version takes a single object with .x, .y, .z properties. The three-argument version takes three scalar numbers.
     * @param {{x:Number, y:Number, z:Number}|Number} arg1 - an object defining the x, y, z values of the vector to subtract, or the x value
     *                                                       to subtract as a scalar number.
     * @param {Number} [arg2] - the y value to subtract as a scalar number.
     * @param {Number} [arg3] - the z value to subtract as a scalar number.
     * @returns {WT_GVector3} the difference vector.
     */
    minus(arg1, arg2, arg3) {
        return this._source.minus(arg1, arg2, arg3);
    }

    /**
     * Subtracts another vector to this one in place and returns this vector. This method takes either one or three arguments.
     * The one-argument version takes a single object with .x, .y, .z properties. The three-argument version takes three scalar numbers.
     * @param {{x:Number, y:Number, z:Number}|Number} arg1 - an object defining the x, y, z values of the vector to subtract, or the x value
     *                                                       to subtract as a scalar number.
     * @param {Number} [arg2] - the y value to subtract as a scalar number.
     * @param {Number} [arg3] - the z value to subtract as a scalar number.
     * @returns {WT_GVector3} this vector, after it has been changed.
     */
    subtract(arg1, arg2, arg3) {
        return this._source.minus(arg1, arg2, arg3);
    }

    /**
     * Scales this vector by a scalar factor. The operation can either be performed in-place or a new WT_GVector3 object can
     * be returned.
     * @param {Number} factor - the scalar factor by which to scale.
     * @return {WT_GVector3} the scaled vector, either as a new WT_GVector2 object or this vector after it has been changed.
     */
    scale(factor) {
        return this._source.scale(factor, false);
    }

    /**
     * Calculates the dot (scalar) product of this vector and another vector. This method takes either one or three arguments.
     * The one-argument version takes a single object with .x, .y, .z properties. The three-argument version takes three scalar numbers.
     * @param {{x:Number, y:Number, z:Number}|Number} arg1 - an object defining the x, y, z values of other vector, or the x value of the
     *                                                       other vector as a scalar number.
     * @param {Number} [arg2] - the y value of the other vector as a scalar number.
     * @param {Number} [arg3] - the z value of the other vector as a scalar number.
     * @returns {Number} the dot product.
     */
    dot(arg1, arg2, arg3) {
        return this._source.dot(arg1, arg2, arg3);
    }

    /**
     * Calculates the cross product of this vector and another vector and returns the result as a new WT_GVector3 object.
     * @param {{x:Number, y:Number, z:Number}|Number} arg1 - an object defining the x, y, z values of other vector, or the x value of the
     *                                                       other vector as a scalar number.
     * @param {Number|Boolean} [arg2] - the y value of the other vector as a scalar number.
     * @param {Number} [arg3] - the z value of the other vector as a scalar number.
     * @returns {WT_GVector3} the cross product as a new WT_GVector3 object.
     */
    cross(arg1, arg2, arg3) {
        if (arg2 === true) {
            arg2 = false;
        }
        return this._source.cross(arg1, arg2, arg3);
    }

    /**
     * Checks whether this vector is equal to another vector (i.e. has the same x, y, z values). This method takes either one or three arguments.
     * The one-argument version takes a single object with .x, .y, .z properties. The three-argument version takes three scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x, y, z values of other vector, or the x value of the other vector
     * as a scalar number.
     * @param {Number} [arg2] - the y value of the other vector as a scalar number.
     * @param {Number} [arg3] - the z value of the other vector as a scalar number.
     * @returns {Boolean} whether this vector is equal to the other vector.
     */
    equals(arg1, arg2, arg3) {
        return this._source.equals(arg1, arg2, arg3);
    }

    /**
     * Copies this vector.
     * @returns {WT_GVector3} a copy of this vector.
     */
    copy() {
        return this._source.copy();
    }

    readonly() {
        return this;
    }

    /**
     * @returns a string representation of this vector.
     */
    toString() {
        return this._source.toString();
    }
}