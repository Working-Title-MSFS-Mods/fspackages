class WT_MapViewBufferedCanvasContext {
    constructor(context, renderQueue) {
        this._context = context;
        this._renderQueue = renderQueue;
    }

    get context() {
        return this._context;
    }

    get renderQueue() {
        return this._renderQueue;
    }

    beginPath() {
        this.renderQueue.enqueue(this.context.beginPath.bind(this.context));
    }

    moveTo(x, y) {
        this.renderQueue.enqueue(this.context.moveTo.bind(this.context, x, y));
    }

    lineTo(x, y) {
        this.renderQueue.enqueue(this.context.lineTo.bind(this.context, x, y));
    }

    arc(x, y, radius, startAngle, endAngle) {
        this.renderQueue.enqueue(this.context.arc.bind(this.context, x, y, radius, startAngle, endAngle));
    }

    closePath() {
        this.renderQueue.enqueue(this.context.closePath.bind(this.context));
    }
}