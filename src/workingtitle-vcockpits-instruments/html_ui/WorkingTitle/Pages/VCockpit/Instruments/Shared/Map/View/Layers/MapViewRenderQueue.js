class WT_MapViewRenderQueue {
    constructor() {
        this._queue = [];
        this._head = 0;
        this._isBusy = false;
    }

    get size() {
        return this._queue.length - this._head;
    }

    get isBusy() {
        return this._isBusy;
    }

    enqueue(element) {
        this._queue.push(element);
    }

    _doRender(renderer, data) {
        let renderCount = 0;
        let t0 = performance.now();
        while (this._head < this._queue.length) {
            let current = this._queue[this._head];
            if (renderer.canRender(current, renderCount, performance.now() - t0)) {
                renderer.render(current, data);
                this._head++;
                renderCount++;
            } else {
                break;
            }
        }
        if (this.size === 0 && renderCount > 0) {
            this.clear();
            renderer.onFinished(data);
        }
        return renderCount;
    }

    start(renderer, data) {
        this._isBusy = true;
        this._head = 0;
        return this._doRender(renderer, data);
    }

    resume(renderer, data) {
        if (this._isBusy) {
            return this._doRender(renderer, data);
        }
        return 0;
    }

    clear() {
        this._queue = [];
        this._head = 0;
        this._isBusy = false;
    }
}