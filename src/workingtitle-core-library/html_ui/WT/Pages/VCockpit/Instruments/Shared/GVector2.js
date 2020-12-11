/**
 * A 2D vector.
 */
class WT_GVector2 {
    /**
     * @param {Number} x
     * @param {Number} y
     */
    constructor(x, y) {
        this.set(x, y);
        this._readonly = new WT_GVector2ReadOnly(this);
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
     * @property {Number} length - the length of this vector.
     * @type {Number}
     */
    get length() {
        return this._length;
    }

    /**
     * @readonly
     * @property {Number} theta - the angle of this vector in radians.
     * @type {Number}
     */
    get theta() {
        return this._theta;
    }

    static _parseArgs(_1, _2) {
        let returnValue = undefined;
        if (_1 !== undefined && _1.x !== undefined && _1.y !== undefined) {
            WT_GVector2._tempValue.x = _1.x;
            WT_GVector2._tempValue.y = _1.y;
            returnValue = WT_GVector2._tempValue;
        } else if (typeof _1 === "number" && typeof _2 === "number") {
            WT_GVector2._tempValue.x = _1;
            WT_GVector2._tempValue.y = _2;
            returnValue = WT_GVector2._tempValue;
        }
        return returnValue;
    }

    _updatePolars() {
        this._length = Math.sqrt(this.x * this.x + this.y * this.y);
        this._theta = Math.atan2(this.x, -this.y);
    }

    /**
     * Sets this vector's x and y values. This method takes either one or two arguments. The one-argument version takes a single object
     * with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the new x and y values, or the new x value as a scalar number.
     * @param {Number} arg2 - the new y value as a scalar number.
     * @returns {WT_GVector2} this vector, after it has been changed.
     */
    set(arg1, arg2) {
        let value = WT_GVector2._parseArgs(arg1, arg2);
        if (value) {
            this._x = value.x;
            this._y = value.y;
            this._updatePolars();
        }
        return this;
    }

    /**
     * Sets this vector's x and y values using polar coordinates.
     * @param {Number} r - the new length.
     * @param {Number} theta - the new angle, in radians. An angle of 0 is defined as pointing in the negative y direction.
     * @returns {WT_GVector2} this vector, after it has been changed.
     */
    setFromPolar(r, theta) {
        return this.set(r * Math.sin(theta), r * -Math.cos(theta));
    }

    /**
     * Adds another vector to this one and returns the result as a new WT_GVector2 object. This method takes either one or two arguments.
     * The one-argument version takes a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x and y values of the vector to add, or the x value to add as a
     * scalar number.
     * @param {Number} arg2 - the y value to add as a scalar number.
     * @returns {WT_GVector2} the summed vector.
     */
    plus(arg1, arg2) {
        let value = WT_GVector2._parseArgs(arg1, arg2);
        if (value) {
            return new WT_GVector2(this.x + value.x, this.y + value.y);
        }
        return undefined;
    }

    /**
     * Adds another vector to this one in place and returns this vector. This method takes either one or two arguments.
     * The one-argument version takes a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x and y values of the vector to add, or the x value to add
     * as a scalar number.
     * @param {Number} arg2 - the y value to add as a scalar number.
     * @returns {WT_GVector2} this vector, after it has been changed.
     */
    add(arg1, arg2) {
        let value = WT_GVector2._parseArgs(arg1, arg2);
        if (value) {
            this._x += value.x;
            this._y += value.y;
            this._updatePolars();
        }
        return this;
    }

    /**
     * Subtracts another vector from this one and returns the result as a new WT_GVector2 object. This method takes either one or two arguments.
     * The one-argument version takes a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x and y values of the vector to subtract, or the x value to subtract
     * as a scalar number.
     * @param {Number} arg2 - the y value to subtract as a scalar number.
     * @returns {WT_GVector2} the difference vector.
     */
    minus(arg1, arg2) {
        let value = WT_GVector2._parseArgs(arg1, arg2);
        if (value) {
            return new WT_GVector2(this.x - value.x, this.y - value.y);
        }
        return undefined;
    }

    /**
     * Subtracts another vector to this one in place and returns this vector. This method takes either one or two arguments.
     * The one-argument version takes a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x and y values of the vector to subtract, or the x value to subtract
     * as a scalar number.
     * @param {Number} arg2 - the y value to subtract as a scalar number.
     * @returns {WT_GVector2} this vector, after it has been changed.
     */
    subtract(arg1, arg2) {
        let value = WT_GVector2._parseArgs(arg1, arg2);
        if (value) {
            this._x -= value.x;
            this._y -= value.y;
            this._updatePolars();
        }
        return this;
    }

    /**
     * Scales this vector by a scalar factor. The operation can either be performed in-place or a new WT_GVector2 object can
     * be returned.
     * @param {Number} factor - the scalar factor by which to scale.
     * @param {Boolean} mutate - whether to perform the operation in place.
     * @return {WT_GVector2} the scaled vector, either as a new WT_GVector2 object or this vector after it has been changed.
     */
    scale(factor, mutate) {
        let x = this.x * factor;
        let y = this.y * factor;
        if (mutate) {
            return this.set(x, y);
        } else {
            return new WT_GVector2(x, y);
        }
    }

    /**
     * Calculates the dot (scalar) product of this vector and another vector. This method takes either one or two arguments.
     * The one-argument version takes a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x and y values of other vector, or the x value of the other vector
     * as a scalar number.
     * @param {Number} arg2 - the y value of the other vector as a scalar number.
     * @returns {Number} the dot product.
     */
    dot(arg1, arg2) {
        let value = WT_GVector2._parseArgs(arg1, arg2);
        let returnValue = undefined;
        if (value) {
            returnValue = this.x * value.x + this.y * value.y;
        }
        return returnValue;
    }

    /**
     * Checks whether this vector is equal to another vector (i.e. has the same x and y values). This method takes either one or two arguments.
     * The one-argument version takes a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x and y values of other vector, or the x value of the other vector
     * as a scalar number.
     * @param {Number} arg2 - the y value of the other vector as a scalar number.
     * @returns {Boolean} whether this vector is equal to the other vector.
     */
    equals(arg1, arg2) {
        let value = WT_GVector2._parseArgs(arg1, arg2);
        if (!value) {
            return false;
        }
        return this.x === value.x && this.y === value.y;
    }

    /**
     * Copies this vector.
     * @returns {WT_GVector2} a copy of this vector.
     */
    copy() {
        return new WT_GVector2(this.x, this.y);
    }

    readonly() {
        return this._readonly;
    }

    /**
     * @returns a string representation of this vector.
     */
    toString() {
        return `[${this.x} ${this.y}]`;
    }

    /**
     * Creates a new vector using polar coordinates.
     * @param {Number} r - the length of the new vector.
     * @param {Number} theta - the angle of the new vector, in radians. An angle of 0 is defined as pointing in the negative y direction.
     * @returns {WT_GVector2} a vector.
     */
    static fromPolar(r, theta) {
        return new WT_GVector2(r * Math.sin(theta), r * -Math.cos(theta));
    }
}
WT_GVector2._tempValue = {x: 0, y: 0};

/**
 * A read-only interface for a WT_GVector2.
 */
class WT_GVector2ReadOnly {
    /**
     * @param {WT_GVector2} source
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
     * @property {Number} length - the length of this vector.
     * @type {Number}
     */
    get length() {
        return this._source.length;
    }

    /**
     * @readonly
     * @property {Number} theta - the angle of this vector in radians.
     * @type {Number}
     */
    get theta() {
        return this._source.theta;
    }

    /**
     * Sets this vector's x and y values. This method takes either one or two arguments. The one-argument version takes a single object
     * with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the new x and y values, or the new x value as a scalar number.
     * @param {Number} arg2 - the new y value as a scalar number.
     * @returns {WT_GVector2} this vector, after it has been changed.
     */
    set(arg1, arg2) {
        let value = WT_GVector2._parseArgs(arg1, arg2);
        if (value) {
            return new WT_GVector2(value.x, value.y);
        } else {
            return this._source.copy();
        }
    }

    /**
     * Sets this vector's x and y values using polar coordinates.
     * @param {Number} r - the new length.
     * @param {Number} theta - the new angle, in radians. An angle of 0 is defined as pointing in the negative y direction.
     * @returns {WT_GVector2} this vector, after it has been changed.
     */
    setFromPolar(r, theta) {
        return this.set(r * Math.sin(theta), r * -Math.cos(theta));
    }

    /**
     * Adds another vector to this one and returns the result as a new WT_GVector2 object. This method takes either one or two arguments.
     * The one-argument version takes a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x and y values of the vector to add, or the x value to add as a
     * scalar number.
     * @param {Number} arg2 - the y value to add as a scalar number.
     * @returns {WT_GVector2} the summed vector.
     */
    plus(arg1, arg2) {
        return this._source.plus(arg1, arg2);
    }

    /**
     * Adds another vector to this one and returns the result as a new WT_GVector2 object. This method takes either one or two arguments.
     * The one-argument version takes a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x and y values of the vector to add, or the x value to add as a
     * scalar number.
     * @param {Number} arg2 - the y value to add as a scalar number.
     * @returns {WT_GVector2} the summed vector.
     */
    add(arg1, arg2) {
        return this._source.plus(arg1, arg2);
    }

    /**
     * Subtracts another vector from this one and returns the result as a new WT_GVector2 object. This method takes either one or two arguments.
     * The one-argument version takes a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x and y values of the vector to subtract, or the x value to subtract
     * as a scalar number.
     * @param {Number} arg2 - the y value to subtract as a scalar number.
     * @returns {WT_GVector2} the difference vector.
     */
    minus(arg1, arg2) {
        return this._source.minus(arg1, arg2);
    }

    /**
     * Subtracts another vector from this one and returns the result as a new WT_GVector2 object. This method takes either one or two arguments.
     * The one-argument version takes a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x and y values of the vector to subtract, or the x value to subtract
     * as a scalar number.
     * @param {Number} arg2 - the y value to subtract as a scalar number.
     * @returns {WT_GVector2} the difference vector.
     */
    subtract(arg1, arg2) {
        return this._source.minus(arg1, arg2);
    }

    /**
     * Scales this vector by a scalar factor and returns the result as a new WT_GVector2 object.
     * @param {Number} factor - the scalar factor by which to scale.
     * @param {Boolean} mutate - this argument is ignored.
     * @return {WT_GVector2} the scaled vector.
     */
    scale(factor, mutate) {
        return this._source.scale(factor, false);
    }

    /**
     * Calculates the dot (scalar) product of this vector and another vector. This method takes either one or two arguments.
     * The one-argument version takes a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x and y values of other vector, or the x value of the other vector
     * as a scalar number.
     * @param {Number} arg2 - the y value of the other vector as a scalar number.
     * @returns {Number} the dot product.
     */
    dot(arg1, arg2) {
        return this._source.dot(arg1, arg2);
    }

    /**
     * Checks whether this vector is equal to another vector (i.e. has the same x and y values). This method takes either one or two arguments.
     * The one-argument version takes a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x and y values of other vector, or the x value of the other vector
     * as a scalar number.
     * @param {Number} arg2 - the y value of the other vector as a scalar number.
     * @returns {Boolean} whether this vector is equal to the other vector.
     */
    equals(arg1, arg2) {
        return this._source.equals(arg1, arg2);
    }

    /**
     * Copies this vector.
     * @returns {WT_GVector2} a copy of this vector.
     */
    copy() {
        return new WT_GVector2(this.x, this.y);
    }

    readonly() {
        return this;
    }

    /**
     * @returns a string representation of this vector.
     */
    toString() {
        return `[${this.x} ${this.y}]`;
    }
}

/**
 * A 2D affine transformation.
 */
class WT_GTransform2 {
    constructor(matrix) {
        this._ = matrix;
    }

    apply(vec, mutate = false) {
        let x = vec.x * this._[0][0] + vec.y * this._[0][1] + this._[0][2];
        let y = vec.x * this._[1][0] + vec.y * this._[1][1] + this._[1][2];
        if (mutate) {
            vec.set(x, y);
        } else {
            return new WT_GVector2(x, y);
        }
    }

    concat(...others) {
        return WT_GTransform2.concat(this, ...others);
    }

    inverse() {
        let e_00 = this._[0][0];
        let e_01 = this._[0][1];
        let e_02 = this._[0][2];
        let e_10 = this._[1][0];
        let e_11 = this._[1][1];
        let e_12 = this._[1][2];
        let e_20 = this._[2][0];
        let e_21 = this._[2][1];
        let e_22 = this._[2][2];

        let i_00 = e_11 * e_22 - e_12 * e_21;
        let i_01 = -(e_10 * e_22 - e_12 * e_20);
        let i_02 = e_10 * e_21 - e_11 * e_20;

        let i_10 = -(e_01 * e_22 - e_02 * e_21);
        let i_11 = e_00 * e_22 - e_02 * e_20;
        let i_12 = -(e_00 * e_21 - e_01 * e_20);

        let i_20 = e_01 * e_12 - e_02 * e_11;
        let i_21 = -(e_00 * e_12 - e_02 * e_10);
        let i_22 = e_00 * e_11 - e_01 * e_10;

        let det = e_00 * i_00 + e_01 * i_01 + e_02 * i_02;

        return new WT_GTransform2([
            [i_00 / det, i_10 / det, i_20 / det],
            [i_01 / det, i_11 / det, i_21 / det],
            [i_02 / det, i_12 / det, i_22 / det]
        ]);
    }

    static concat(...args) {
        if (args.length === 0) {
            return undefined;
        }

        if (args.length === 1) {
            return args[1];
        }

        let index = 0;
        let next = args[index];
        let oldMatrix = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
        let newMatrix = [
            [next._[0][0], next._[0][1], next._[0][2]],
            [next._[1][0], next._[1][1], next._[1][2]],
            [next._[2][0], next._[2][1], next._[2][2]]
        ];
        while (++index < args.length) {
            next = args[index];
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 3; j++) {
                    oldMatrix[i][j] = newMatrix[i][j];
                }
            }
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 2; j++) {
                    newMatrix[j][i] = oldMatrix[0][i] * next._[j][0] + oldMatrix[1][i] * next._[j][1] + oldMatrix[2][i] * next._[j][2];
                }
            }

        }
        return new WT_GTransform2(newMatrix);
    }

    static _offsetOrigin(transform, x, y) {
        return WT_GTransform2.concat(
            WT_GTransform2.translate(-x, -y),
            transform,
            WT_GTransform2.translate(x, y)
        );
    }

    static translate(...args) {
        let x;
        let y;
        if (args.length === 1) {
            x = args[0].x;
            y = args[0].y;
        } else if (args.length === 2) {
            x = args[0];
            y = args[1];
        } else {
            return undefined;
        }

        return new WT_GTransform2([
            [1, 0, x],
            [0, 1, y],
            [0, 0, 1]
        ]);
    }

    static rotate(theta, ...args) {
        let sin = Math.sin(theta);
        let cos = Math.cos(theta);
        let transform = new WT_GTransform2([
            [cos,   -sin,   0],
            [sin,   cos,    0],
            [0,     0,      1]
        ]);
        if (args.length > 0) {
            // handle rotation around arbitrary point
            if (args.length === 1) {
                transform = WT_GTransform2._offsetOrigin(transform, args[0].x, args[0].y);
            } else if (args.length === 2) {
                transform = WT_GTransform2._offsetOrigin(transform, args[0], args[1]);
            } else {
                return undefined;
            }
        }
        return transform;
    }

    static scale(...args) {
        let x;
        let y;
        if (args.length === 1) {
            x = args[0];
            y = args[0];
        } else if (args.length === 2) {
            x = args[0];
            y = args[1];
        } else {
            return undefined;
        }
        return new WT_GTransform2([
            [x, 0, 0],
            [0, y, 0],
            [0, 0, 1]
        ]);
    }

    static reflect(theta, ...args) {
        let sin = Math.sin(2 * theta);
        let cos = Math.cos(2 * theta);
        let transform = new WT_GTransform2([
            [-cos,  -sin,   0],
            [-sin,  cos,    0],
            [0,     0,      1]
        ])
        if (args.length > 0) {
            // handle reflection around arbitrary line
            if (args.length === 1) {
                transform = WT_GTransform2._offsetOrigin(transform, args[0].x, args[0].y);
            } else if (args.length === 2) {
                transform = WT_GTransform2._offsetOrigin(transform, args[0], args[1]);
            } else {
                return undefined;
            }
        }
        return transform;
    }
}