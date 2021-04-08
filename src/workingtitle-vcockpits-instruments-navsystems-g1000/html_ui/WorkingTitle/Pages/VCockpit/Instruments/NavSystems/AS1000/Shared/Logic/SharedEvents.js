class WT_Shared_Instrument_Events {
    /**
     * @param {NavSystem} instrument 
     */
    constructor(instrument) {
        this.instrument = instrument;
        this.index = 0;
        this.listeners = {};
        window.addEventListener("storage", event => {
            if (event.key.startsWith(this.prefix) && event.newValue) {
                const eventData = JSON.parse(event.newValue);
                const eventKey = eventData.event;
                const data = eventData.data;
                if (eventKey in this.listeners) {
                    for (let listener of this.listeners[eventKey]) {
                        listener(data);
                    }
                }
            }
        });
    }
    get prefix() {
        return `WT_Instrument_Events`;
    }
    getLocalStorageKey() {
        return `${this.prefix}.${this.instrument.instrumentIdentifier}.${this.index++}`;
    }
    fire(event, data) {
        const localStorageKey = this.getLocalStorageKey();
        window.localStorage.setItem(localStorageKey, JSON.stringify({
            event: event,
            data: data
        }));
        if (event in this.listeners) {
            for (let listener of this.listeners[event]) {
                listener(data);
            }
        }

        // delete the event in a short time
        setTimeout(() => window.localStorage.removeItem(localStorageKey), 1000);
    }
    addListener(event, listener) {
        if (!(event in this.listeners)) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }
    removeListener(event, listener) {
        if (event in this.listeners) {
            const idx = this.listeners[event].indexOf(listener);
            if (idx > -1) {
                this.listeners[event].splice(idx, 1);
            }
        }
    }
    observe(event) {
        const observable = new rxjs.Subject();
        const listener = data => observable.next(data);
        this.addListener(event, listener);
        return observable.pipe(
            rxjs.operators.finalize(() => this.removeListener(event, listener))
        );
    }
}
WT_Shared_Instrument_Events.EVENT_ADD_PFD_ALERT = "ADD_PFD_ALERT";
WT_Shared_Instrument_Events.EVENT_PFD_ALERT_CLICKED = "PFD_ALERT_CLICKED";