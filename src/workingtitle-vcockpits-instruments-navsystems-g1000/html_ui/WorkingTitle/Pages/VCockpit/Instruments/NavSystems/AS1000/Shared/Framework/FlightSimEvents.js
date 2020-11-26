class WT_Flight_Sim_Events {
    constructor() {
        this.listeners = [];
    }
    processEvent(event) {
        for (let listener of this.listeners) {
            listener(event);
        }
    }
    subscribe(listener) {
        this.listeners.push(listener);
    }
}