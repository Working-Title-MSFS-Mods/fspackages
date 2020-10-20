class Input_Stack {
    constructor() {
        this.stack = [];
    }
    get currentLayer() {
        return (this.stack.length > 0) ? this.stack[this.stack.length - 1] : null;
    }
    push(layer) {
        let stackSize = this.stack.length;
        if (this.currentLayer) {
            this.currentLayer.onDeactivate();
        }
        this.stack.push(layer);
        this.currentLayer.onActivate();
        //console.log("Input stack pushed");
        return {
            pop: () => {
                this.pop(stackSize);
                return null;
            }
        };
    }
    pop(index) {
        //console.log("Input stack popped");
        while (this.stack.length > index) {
            this.currentLayer.onDeactivate();
            this.stack.pop();
        }
        if (this.currentLayer) {
            this.currentLayer.onActivate();
        }
    }
    processEvent(_event) {
        //console.log(_event);
        if (!this.currentLayer)
            return;
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