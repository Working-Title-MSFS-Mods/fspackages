/**
 * A 2D vector.
 */
class WT_GVector2 {
    /**
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the new vector's x and y values, or the x value as a scalar number.
     * @param {Number} [arg2] - the y value as a scalar number.
     */
    constructor(arg1, arg2) {
        this.set(arg1, arg2);
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
     * @property {Number} theta - the angle of this vector in radians, measured from the NEGATIVE Y-AXIS (as opposed to the usual
     *                            convention of measuring from the positive x-axis).
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
     * @param {Number} [arg2] - the new y value as a scalar number.
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
     * Scales this vector to a length of one. The operation can either be performed in-place or a new WT_GVector2 object can
     * be returned.
     * @param {Boolean} [mutate] - whether to perform the operation in place.
     * @return {WT_GVector2} the unit vector, either as a new WT_GVector2 object or this vector after it has been changed.
     */
    unit(mutate) {
        return this.scale(1 / this.length, mutate);
    }

    /**
     * Adds another vector to this one and returns the result as a new WT_GVector2 object. This method takes either one or two arguments.
     * The one-argument version takes a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x and y values of the vector to add, or the x value to add as a
     * scalar number.
     * @param {Number} [arg2] - the y value to add as a scalar number.
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
     * @param {Number} [arg2] - the y value to add as a scalar number.
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
     * @param {Number} [arg2] - the y value to subtract as a scalar number.
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
     * @param {Number} [arg2] - the y value to subtract as a scalar number.
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
     * @param {Number} [arg2] - the y value of the other vector as a scalar number.
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
     * @param {Number} [arg2] - the y value of the other vector as a scalar number.
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

    /**
     * Gets a read-only version of this vector. The read-only version is updated as this vector is changed. Attempting to call
     * any mutating method on the read-only version will create and return a mutated copy of this vector instead.
     * @returns {WT_GVector2ReadOnly} a read-only version of this vector.
     */
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
     * Copies this vector and sets the copy's x and y values. This method takes either one or two arguments. The one-argument version takes
     * a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the new x and y values, or the new x value as a scalar number.
     * @param {Number} [arg2] - the new y value as a scalar number.
     * @returns {WT_GVector2} the new vector.
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
     * Copies this vector and sets the copy's x and y values using polar coordinates.
     * @param {Number} r - the new length.
     * @param {Number} theta - the new angle, in radians. An angle of 0 is defined as pointing in the negative y direction.
     * @returns {WT_GVector2} the new vector.
     */
    setFromPolar(r, theta) {
        return this.set(r * Math.sin(theta), r * -Math.cos(theta));
    }

    /**
     * Scales this vector to a length of one and returns the result as a new WT_GVector2 object.
     * @return {WT_GVector2} the unit vector.
     */
    unit() {
        return this._source.scale(false);
    }

    /**
     * Adds another vector to this one and returns the result as a new WT_GVector2 object. This method takes either one or two arguments.
     * The one-argument version takes a single object with .x and .y properties. The two-argument version takes two scalar numbers.
     * @param {{x:Number, y:Number}|Number} arg1 - an object defining the x and y values of the vector to add, or the x value to add as a
     * scalar number.
     * @param {Number} [arg2] - the y value to add as a scalar number.
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
     * @param {Number} [arg2] - the y value to add as a scalar number.
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
     * @param {Number} [arg2] - the y value to subtract as a scalar number.
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
     * @param {Number} [arg2] - the y value to subtract as a scalar number.
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
     * @param {Number} [arg2] - the y value of the other vector as a scalar number.
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
     * @param {Number} [arg2] - the y value of the other vector as a scalar number.
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

    /**
     * Gets a read-only version of this vector. The read-only version is updated as this vector is changed. Attempting to call
     * any mutating method on the read-only version will create and return a mutated copy of this vector instead.
     * @returns {WT_GVector2ReadOnly} a read-only version of this vector.
     */
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
    /**
     * @param {Number[][]|WT_GTransform2} [definition] - the 3x3 matrix defining the new transformation or a WT_GTransform2 object
     *                                                   from which to copy. If this argument is not supplied, the new transformation
     *                                                   will be created as the identity transformation.
     */
    constructor(definition) {
        this._ = [[1, 0, 0],
                  [0, 1, 0],
                  [0, 0, 1]];
        this.set(definition);
    }

    static _toMatrix(definition) {
        if (definition instanceof WT_GTransform2) {
            return definition._;
        } else if (definition instanceof Array && definition[0] instanceof Array) {
            return definition;
        } else {
            return undefined;
        }
    }

    /**
     * Sets this transformation's matrix.
     * @param {Number[][]|WT_GTransform2} definition - the 3x3 matrix defining the new transformation or a WT_GTransform2 object
     *                                                 from which to copy.
     * @returns {WT_GTransform2} this transformation, after it has been changed.
     */
    set(definition) {
        let matrix = WT_GTransform2._toMatrix(definition);
        if (!matrix) {
            return;
        }

        this._[0][0] = matrix[0][0];
        this._[0][1] = matrix[0][1];
        this._[0][2] = matrix[0][2];
        this._[1][0] = matrix[1][0];
        this._[1][1] = matrix[1][1];
        this._[1][2] = matrix[1][2];
        return this;
    }

    /**
     * Applies this transformation to a vector and returns the result. The operation can either be performed in-place or a new
     * WT_GVector2 object can be created.
     * @param {WT_GVector2} vec - the vector to transform.
     * @param {Boolean} mutate - whether to perform the operation in-place.
     * @returns {WT_GVector2} the transformed vector.
     */
    apply(vec, mutate = false) {
        let x = vec.x * this._[0][0] + vec.y * this._[0][1] + this._[0][2];
        let y = vec.x * this._[1][0] + vec.y * this._[1][1] + this._[1][2];
        if (mutate) {
            return vec.set(x, y);
        } else {
            return new WT_GVector2(x, y);
        }
    }

    /**
     * Concatenates this transformation with one or more other transformations in order and returns the result. This method takes
     * an arbitrary number of transformation objects as arguments. The last argument to this method can optionally be a boolean
     * that indicates whether to set this transformation to the concatenated transformation. If the optional boolean argument is
     * false or omitted, then the result is stored in a new WT_GTransform2 object instead.
     * @param  {...any} args - the arguments to pass to this method.
     * @returns {WT_GTransform2} a single transformation equivalent to the ordered concatenation of two or more transformations.
     */
    concat(...args) {
        return WT_GTransform2.concat(this, ...args);
    }

    /**
     * Calculates and returns the inverse of this transformation. The operation can be performed in-place or a new WT_GTransform2
     * object can be created.
     * @param {Boolean} [mutate] - whether to perform the operation in-place.
     * @returns {WT_GTransform2} the inverse of this transformation.
     */
    inverse(mutate = false) {
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

        let inverse = WT_GTransform2._setMatrix(WT_GTransform2._tempMatrix1,
            i_00 / det, i_01 / det, i_02 / det,
            i_10 / det, i_11 / det, i_12 / det,
            i_20 / det, i_21 / det, i_22 / det
        );

        if (mutate) {
            return this.set(inverse);
        } else {
            return new WT_GTransform2(inverse);
        }
    }

    /**
     * Concatenates one or more other transformations in order and returns the result. This method takes an arbitrary number of
     * transformation objects as arguments. The last argument to this method can optionally be a boolean that indicates whether
     * to store the resulting concatenated transformation in the transformation object provided as the first argument. If the
     * optional boolean argument is false or omitted, then the result is stored in a new WT_GTransform2 object instead.
     * @param  {...any} args - the arguments to pass to this method.
     * @returns {WT_GTransform2} a single transformation equivalent to the ordered concatenation of one or more transformations.
     */
    static concat(...args) {
        if (args.length === 0) {
            return undefined;
        }

        if (args.length === 1 && args[1] instanceof WT_GTransform2) {
            return args[1];
        }

        let mutate = args[args.length - 1] === true;

        let index = 0;
        let next = args[index];
        let oldMatrix = WT_GTransform2._setMatrix(WT_GTransform2._tempMatrix1,
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        );
        let newMatrix = WT_GTransform2._setMatrix(WT_GTransform2._tempMatrix2,
            next._[0][0], next._[0][1], next._[0][2],
            next._[1][0], next._[1][1], next._[1][2],
            next._[2][0], next._[2][1], next._[2][2]
        );
        let end = args.length - (typeof args[args.length - 1] === "boolean");
        while (++index < end) {
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

        if (mutate) {
            return args[0].set(newMatrix);
        } else {
            return new WT_GTransform2(newMatrix);
        }
    }

    static _setMatrix(matrix, _00, _01, _02, _10, _11, _12, _20, _21, _22) {
        matrix[0][0] = _00;
        matrix[0][1] = _01;
        matrix[0][2] = _02;
        matrix[1][0] = _10;
        matrix[1][1] = _11;
        matrix[1][2] = _12;
        matrix[2][0] = _20;
        matrix[2][1] = _21;
        matrix[2][2] = _22;
        return matrix;
    }

    static _offsetOrigin(transform, x, y) {
        let concat = WT_GTransform2.concat(
            WT_GTransform2.translation(-x, -y, WT_GTransform2._tempTransform1),
            transform,
            WT_GTransform2.translation(x, y, WT_GTransform2._tempTransform2),
            true
        );
        return transform.set(concat);
    }

    /**
     * Gets a transformation representing a translation. This method takes in as arguments either a 2D vector object or separate
     * x and y values to define the translation. Additionally, the last argument can optionally be a WT_GTransform2 object to
     * set to the new translation transformation. If this optional argument is omitted, then a new WT_GTransform2 object will be
     * created.
     * @param {...any} args - the arguments to pass to this method.
     * @returns {WT_GTransform2} a translation transformation.
     */
    static translation(...args) {
        let value = WT_GVector2._parseArgs(args[0], args[1]);
        if (!value) {
            return undefined;
        }

        let translate = WT_GTransform2._setMatrix(WT_GTransform2._tempMatrix1,
            1, 0, value.x,
            0, 1, value.y,
            0, 0, 1
        );

        if (args.length === 2 && args[1] instanceof WT_GTransform2) {
            return args[1].set(translate);
        } else if (args.length === 3 && args[2] instanceof WT_GTransform2) {
            return args[2].set(translate);
        } else {
            return new WT_GTransform2(translate);
        }
    }

    /**
     * Gets a transformation representing a rotation. In addition to the rotation angle, this method takes in additional optional
     * arguments in the form of a position vector or separate x and y values defining the center of rotation. If these are omitted,
     * then the center of rotation is set to be the origin. Additionally, the last argument can optionally be a WT_GTransform2
     * object to set to the new rotation transformation. If this last optional argument is omitted, then a new WT_GTransform2 object
     * will be created.
     * @param {Number} theta - the rotation angle, in radians.
     * @param {...any} [args] - additional optional arguments to pass to this method.
     * @returns {WT_GTransform2} a rotation transformation.
     */
    static rotation(theta, ...args) {
        let sin = Math.sin(theta);
        let cos = Math.cos(theta);

        let rotate = WT_GTransform2._setMatrix(WT_GTransform2._tempMatrix1,
            cos,  -sin, 0,
            sin,  cos,  0,
            0,    0,    1
        );

        let transform;
        if (args.length === 1 && args[0] instanceof WT_GTransform2) {
            transform = args[0].set(rotate);
        } else if (args.length === 2 && args[1] instanceof WT_GTransform2) {
            transform = args[1].set(rotate);
        } else if (args.length === 3 && args[2] instanceof WT_GTransform2) {
            transform = args[2].set(rotate);
        } else {
            transform = new WT_GTransform2(rotate);
        }

        let value = WT_GVector2._parseArgs(args[0], args[1]);
        if (value) {
            transform = WT_GTransform2._offsetOrigin(transform, value.x, value.y);
        }
        return transform;
    }

    /**
     * Gets a transformation representing a scaling. This method takes in as arguments one or two numeric scale factors. If only one
     * is provided, it will be applied in both the x- and y- dimensions. If two are provided, the first will apply to the x-dimension
     * and the second to the y-dimension. Additionally, the last argument can optionally be a WT_GTransform2 object to
     * set to the new scaling transformation. If this optional argument is omitted, then a new WT_GTransform2 object will be
     * created.
     * @param {...any} args - the arguments to pass to this method.
     * @returns {WT_GTransform2} a scaling transformation.
     */
    static scale(...args) {
        let x;
        let y;
        if (typeof args[0] === "number" && typeof args[1] === "number") {
            x = arg1;
            y = arg2;
        } else if (typeof args[0] === "number") {
            x = arg1;
            y = arg1;
        } else {
            return undefined;
        }

        let scale = WT_GTransform2._setMatrix(WT_GTransform2._tempMatrix1,
            x, 0, 0,
            0, y, 0,
            0, 0, 1
        );

        if (args.length === 2 && args[1] instanceof WT_GTransform2) {
            return args[1].set(scale);
        } else if (args.length === 3 && args[2] instanceof WT_GTransform2) {
            return args[2].set(scale);
        } else {
            return new WT_GTransform2(scale);
        }
    }

    /**
     * Gets a transformation representing a reflection. In addition to the line of reflection angle, this method takes in additional
     * optional arguments in the form of a position vector or separate x and y values defining a point through which the line passes.
     * If these are omitted, then the line will be set to pass through the origin. Additionally, the last argument can optionally be
     * a WT_GTransform2 object to set to the new reflection transformation. If this last optional argument is omitted, then a new
     * WT_GTransform2 object will be created.
     * @param {Number} theta - the angle of the line across which to reflect, in radians. A value of 0 defines a vertical line, with
     *                         positive values proceeding clockwise.
     * @param {...any} [args] - additional optional arguments to pass to this method.
     * @returns {WT_GTransform2} a reflection transformation.
     */
    static reflection(theta, ...args) {
        let sin = Math.sin(2 * theta);
        let cos = Math.cos(2 * theta);

        let reflect = WT_GTransform2._setMatrix(WT_GTransform2._tempMatrix1,
            -cos, -sin, 0,
            -sin, cos,  0,
            0,    0,    1
        );

        let transform;
        if (args.length === 1 && args[0] instanceof WT_GTransform2) {
            transform = args[0].set(reflect);
        } else if (args.length === 2 && args[1] instanceof WT_GTransform2) {
            transform = args[1].set(reflect);
        } else if (args.length === 3 && args[2] instanceof WT_GTransform2) {
            transform = args[2].set(reflect);
        } else {
            transform = new WT_GTransform2(reflect);
        }

        let value = WT_GVector2._parseArgs(args[0], args[1]);
        if (value) {
            transform = WT_GTransform2._offsetOrigin(transform, value.x, value.y);
        }
        return transform;
    }
}
WT_GTransform2._tempMatrix1 = [[1, 0, 0],[0, 1, 0],[0, 0, 1]];
WT_GTransform2._tempMatrix2 = [[1, 0, 0],[0, 1, 0],[0, 0, 1]];
WT_GTransform2._tempTransform1 = new WT_GTransform2();
WT_GTransform2._tempTransform2 = new WT_GTransform2();