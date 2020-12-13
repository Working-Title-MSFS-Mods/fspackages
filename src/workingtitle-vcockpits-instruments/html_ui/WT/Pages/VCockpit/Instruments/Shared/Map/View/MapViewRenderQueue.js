class WT_MapViewRenderQueue {
    constructor() {
        this._queue = [];
        this._head = 0;
        this._isBusy = false;
        this._renderer;
    }

    /**
     * @readonly
     * @property {Number} size
     * @type {Number}
     */
    get size() {
        return this._queue.length - this._head;
    }

    /**
     * @readonly
     * @property {Boolean} isBusy
     * @type {Boolean}
     */
    get isBusy() {
        return this._isBusy;
    }

    enqueue(element) {
        this._queue.push(element);
    }

    _finishRender(data) {
        this.clear();
        this._renderer.onFinished(data);
        this._isBusy = false;
    }

    _doRender(data) {
        let renderCount = 0;
        let t0 = performance.now();
        while (this._head < this._queue.length) {
            let current = this._queue[this._head];
            if (this._renderer.canRender(current, renderCount, performance.now() - t0)) {
                this._renderer.render(current, data);
                this._head++;
                renderCount++;
            } else {
                break;
            }
        }
        if (this.size === 0 && renderCount > 0) {
            this._finishRender(data);
        } else {
            this._renderer.onPaused(data);
        }
        return renderCount;
    }

    start(renderer, data) {
        if (this.isBusy) {
            this._renderer.onAborted();
        }
        this._isBusy = true;
        this._head = 0;
        this._renderer = renderer;
        return this._doRender(data);
    }

    resume(data) {
        if (this.isBusy) {
            return this._doRender(data);
        }
        return 0;
    }

    clear() {
        this._queue = [];
        this._head = 0;
    }

    abort() {
        if (this.isBusy) {
            this.clear();
            this._renderer.onAborted();
            this._isBusy = false;
        }
    }
}