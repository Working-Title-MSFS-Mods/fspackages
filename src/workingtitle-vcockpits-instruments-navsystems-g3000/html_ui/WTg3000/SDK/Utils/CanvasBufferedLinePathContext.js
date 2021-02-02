/**
 * A canvas 2D rendering context for drawing lines. The default canvas 2D rendering context suffers from
 * a large performance penalty after too many path commands are buffered. This class circumvents that issue
 * by buffering path commands across multiple invisible sub-contexts.
 */
class WT_CanvasBufferedLinePathContext {
    /**
     * @param {HTMLCanvasElement} canvas - the canvas to which the new context will render.
     * @param {CanvasRenderingContext2D} canvasContext - the default 2D rendering context of the new context's canvas.
     * @param {Number} [pathCommandLimit] - the maximum number of path commands each sub-context can buffer.
     */
    constructor(canvas, canvasContext, pathCommandLimit = WT_CanvasBufferedLinePathContext.DRAW_CALL_LIMIT_DEFAULT ) {
        this._canvas = canvas;
        this._context = canvasContext;
        this._pathCommandLimit = pathCommandLimit;

        this._pathCommandCount = 0;
        this._buffers = [];
        this._bufferIndex = -1;

        this._initialPoint = null;
        this._tempPair = {x: 0, y: 0};
    }

    /**
     * @readonly
     * @property {HTMLCanvasElement} canvas - this canvas to which this context renders.
     * @type {HTMLCanvasElement}
     */
    get canvas() {
        return this._canvas;
    }

    /**
     * @readonly
     * @property {CanvasRenderingContext2D} context - the default 2D rendering context of this context's canvas.
     * @type {CanvasRenderingContext2D}
     */
    get context() {
        return this._context;
    }

    get lineWidth() {
        return this.context.lineWidth;
    }

    set lineWidth(value) {
        this.context.lineWidth = value;
    }

    get strokeStyle() {
        return this.context.strokeStyle;
    }

    set strokeStyle(value) {
        this.context.strokeStyle = value;
    }

    _reset() {
        this._pathCommandCount = 0;
        this._bufferIndex = -1;
    }

    _createBuffer() {
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");
        let buffer = {
            canvas: canvas,
            context: context
        };
        this._buffers.push(buffer);
        return buffer;
    }

    _selectBuffer() {
        while (this._bufferIndex >= this._buffers.length) {
            this._createBuffer();
        }

        return this._buffers[this._bufferIndex];
    }

    _nextBuffer() {
        this._pathCommandCount = 0;
        this._bufferIndex++;
        let buffer = this._selectBuffer();
        buffer.canvas.width = this.canvas.width;
        buffer.canvas.height = this.canvas.height;
        buffer.context.beginPath();
        return buffer;
    }

    _checkDrawCalls(x, y) {
        if (this._pathCommandCount > this._pathCommandLimit) {
            let buffer = this._nextBuffer();
            buffer.context.moveTo(x, y);
            return true;
        }
        return false;
    }

    beginPath() {
        this._reset();
        this._nextBuffer();
        this._initialPoint = null;
    }

    moveTo(x, y) {
        let buffer = this._selectBuffer();
        buffer.context.moveTo(x, y);
        this._pathCommandCount++;

        this._checkDrawCalls(x, y);
        if (this._initialPoint === null) {
            this._initialPoint = {x: x, y: y};
        }
    }

    lineTo(x, y) {
        let buffer = this._selectBuffer();
        buffer.context.lineTo(x, y);
        this._pathCommandCount++;

        this._checkDrawCalls(x, y);
        if (this._initialPoint === null) {
            this._initialPoint = {x: x, y: y};
        }
    }

    _radialOffset(x, y, radius, angle) {
        let offsetX = x + radius * Math.cos(angle);
        let offsetY = y + radius * Math.sin(angle);
        this._tempPair.x = offsetX;
        this._tempPair.y = offsetY;
        return this._tempPair;
    }

    arc(x, y, radius, startAngle, endAngle) {
        let buffer = this._selectBuffer();
        buffer.context.arc(x, y, radius, startAngle, endAngle);
        this._pathCommandCount++;

        let endPoint = this._radialOffset(x, y, radius, endAngle);
        this._checkDrawCalls(endPoint.x, endPoint.y);
        if (this._initialPoint === null) {
            let startPoint = this._radialOffset(x, y, radius, startAngle);
            this._initialPoint = {x: startPoint.x, y: startPoint.y};
        }
    }

    closePath() {
        if (this._initialPoint) {
            this.moveTo(this._initialPoint.x, this._initialPoint.y);
            this._initialPoint = null;
        }
    }

    stroke() {
        for (let i = 0; i <= this._bufferIndex; i++) {
            let buffer = this._buffers[i];
            buffer.context.lineWidth = this.context.lineWidth;
            buffer.context.strokeStyle = this.context.strokeStyle;
            buffer.context.stroke();
            this.context.drawImage(buffer.canvas, 0, 0);
        }
    }
}
WT_CanvasBufferedLinePathContext.DRAW_CALL_LIMIT_DEFAULT = 1000;