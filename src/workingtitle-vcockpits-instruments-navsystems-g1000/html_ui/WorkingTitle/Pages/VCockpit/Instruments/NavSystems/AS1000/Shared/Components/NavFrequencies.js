class WT_Nav_Frequencies_Model extends WT_Radio_Frequencies_Model {
    /**
     * @param {rxjs.Observable} update$ 
     */
    constructor(update$) {
        const forceUpdate$ = new rxjs.Subject();
        const throttledUpdate$ = rxjs.merge(
            forceUpdate$.pipe(rxjs.operators.delay(16)),
            update$.pipe(rxjs.operators.throttleTime(1000))
        ).pipe(
            WT_RX.shareReplay()
        );

        const radios = [];
        for (let i = 1; i <= 2; i++) {
            let radio = {};
            radio.active = WT_RX.observeSimVar(throttledUpdate$, `NAV ACTIVE FREQUENCY:${i}`, "MHz").pipe(rxjs.operators.map(mhz => mhz.toFixed(2)));
            radio.standby = WT_RX.observeSimVar(throttledUpdate$, `NAV STANDBY FREQUENCY:${i}`, "MHz").pipe(rxjs.operators.map(mhz => mhz.toFixed(2)));
            radio.ident = WT_RX.observeSimVar(throttledUpdate$, `NAV IDENT:${i}`, "string");
            radio.volume = WT_RX.observeSimVar(throttledUpdate$, `NAV VOLUME:${i}`, "number");
            radios[i] = radio;
        }

        super(radios[1], radios[2]);
        this.forceUpdate$ = new rxjs.Subject();
        this.forceUpdate$.subscribe(() => forceUpdate$.next()); // This is really messy because of the class setup, needs refactoring
    }
    get simVarPrefix() {
        return `K:NAV${this.selected.value}`;
    }
    incrementWhole() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_WHOLE_INC`, "number", 0);
        this.forceUpdate$.next();
    }
    decrementWhole() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_WHOLE_DEC`, "number", 0);
        this.forceUpdate$.next();
    }
    incrementFractional() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_FRACT_INC`, "number", 0);
        this.forceUpdate$.next();
    }
    decrementFractional() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_FRACT_DEC`, "number", 0);
        this.forceUpdate$.next();
    }
    increaseVolume() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_VOLUME_INC`, "number", 0);
        this.forceUpdate$.next();
    }
    decreaseVolume() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_VOLUME_DEC`, "number", 0);
        this.forceUpdate$.next();
    }
    toggleActive() {
        this.selected.value = this.selected.value == 1 ? 2 : 1;
    }
    transferActive() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_SWAP`, "number", 0);
        this.forceUpdate$.next();
    }
    /**
     * @param {Number} bcd 
     */
    selectFrequency(bcd) {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_SWAP`, "number", 0);
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_SET`, "Frequency BCD16", bcd);
        this.forceUpdate$.next();
    }
}

class WT_Nav_Frequencies_View extends WT_Radio_Frequencies_View {
    /**
     * @param {WT_Nav_Frequencies_Model} model 
     */
    setModel(model) {
        super.setModel(model);
        model.radio1.ident.subscribe(ident => this.elements.radio1ident.textContent = ident);
        model.radio2.ident.subscribe(ident => this.elements.radio2ident.textContent = ident);
    }
}
customElements.define("g1000-nav-frequencies", WT_Nav_Frequencies_View);