class WT_GVector2 {
    constructor(x, y) {
        this.set(x, y);
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    get length() {
        return this._length;
    }

    set x(val) {
        this._x = val;
        this._updateLength();
    }

    set y(val) {
        this._y = val;
        this._updateLength();
    }

    set(...args) {
        let xy = WT_GVector2._parseXYArgs(args);
        if (!xy) {
            return undefined;
        }

        this._x = xy.x;
        this._y = xy.y;
        this._updateLength();
        return this;
    }

    setFromPolar(r, theta) {
        return this.set(r * Math.sin(theta), r * -Math.cos(theta));
    }

    _updateLength() {
        this._length = Math.sqrt(this.x * this.x + this.y * this.y);
    }

    add(other, mutate = false) {
        let x = this.x + other.x;
        let y = this.y + other.y;
        if (mutate) {
            return this.set(x, y)
        } else {
            return new WT_GVector2(x, y);
        }
    }

    subtract(other, mutate = false) {
        let x = this.x - other.x;
        let y = this.y - other.y;
        if (mutate) {
            return this.set(x, y)
        } else {
            return new WT_GVector2(x, y);
        }
    }

    scale(scale, mutate = false) {
        let x = this.x * scale;
        let y = this.y * scale;
        if (mutate) {
            return this.set(x, y);
        } else {
            return new WT_GVector2(x, y);
        }
    }

    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    copy() {
        return new WT_GVector2(this.x, this.y);
    }

    toString() {
        return `[${this.x} ${this.y}]`;
    }

    static _parseXYArgs(args) {
        if (args.length === 1) {
            return {x: args[0].x, y: args[0].y};
        } else if (args.length === 2) {
            return {x: args[0], y: args[1]};
        } else {
            return undefined;
        }
    }

    static fromPolar(r, theta) {
        return new WT_GVector2(r * Math.sin(theta), r * -Math.cos(theta));
    }
}

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
        let xy = WT_GVector2._parseXYArgs(args);
        if (!xy) {
            return undefined;
        }

        return new WT_GTransform2([
            [1, 0, xy.x],
            [0, 1, xy.y],
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
            let xy = WT_GVector2._parseXYArgs(args);
            if (!xy) {
                return undefined;
            }

            transform = WT_GTransform2._offsetOrigin(transform, xy.x, xy.y);
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
            let xy = WT_GVector2._parseXYArgs(args);
            if (!xy) {
                return undefined;
            }

            transform = WT_GTransform2._offsetOrigin(transform, xy.x, xy.y);
        }
        return transform;
    }
}