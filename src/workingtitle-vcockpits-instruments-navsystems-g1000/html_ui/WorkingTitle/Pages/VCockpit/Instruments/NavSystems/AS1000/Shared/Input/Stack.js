class WT_Input_Stack_Handle {
    constructor(stack, stackSize) {
        this.stack = stack;
        this.stackSize = stackSize;
        this.onPopped = new WT_Event();
    }
    pop() {
        this.stack.pop(this.stackSize);
    }
}

class Input_Stack {
    constructor() {
        this.stack = [];
        this.handlers = [];
    }
    get currentLayer() {
        return (this.stack.length > 0) ? this.stack[this.stack.length - 1] : null;
    }
    get currentHandler() {
        return (this.stack.length > 0) ? this.handlers[this.handlers.length - 1] : null;
    }
    /**
     * @param {Input_Layer} layer
     * @returns {WT_Input_Stack_Handle}
     */
    push(layer) {
        let stackSize = this.stack.length;
        if (this.currentLayer) {
            this.currentLayer.onDeactivate();
        }
        this.stack.push(layer);
        const handler = new WT_Input_Stack_Handle(this, stackSize);
        this.handlers.push(handler);
        this.currentLayer.onActivate();
        return handler;
    }
    pop(index) {
        while (this.stack.length > index) {
            this.currentLayer.onDeactivate();
            this.currentHandler.onPopped.fire();
            this.stack.pop();
            this.handlers.pop();
        }
        if (this.currentLayer) {
            this.currentLayer.onActivate();
        }
    }
    processEvent(_event) {
        if (!this.currentLayer)
            return false;
        let i = this.stack.length - 1;
        while (i >= 0) {
            let layer = this.stack[i];
            let handled = layer.processEvent(_event, this);
            if (handled !== false)
                return true;
            i--;
        }
        return false;
    }
}