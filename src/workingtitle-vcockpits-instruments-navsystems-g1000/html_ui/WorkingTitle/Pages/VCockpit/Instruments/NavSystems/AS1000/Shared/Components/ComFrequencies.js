class WT_Com_Frequencies_Model extends WT_Radio_Frequencies_Model {
    constructor(update$) {
        // This means we only update once per second unless we focce an update
        const forceUpdate$ = new rxjs.Subject();
        const throttledUpdate$ = rxjs.merge(
            forceUpdate$.pipe(rxjs.operators.delay(16)),
            update$.pipe(rxjs.operators.throttleTime(1000))
        ).pipe(
            rxjs.operators.shareReplay(1)
        );

        const radios = [];
        for (let i = 1; i <= 2; i++) {
            let radio = {};
            radio.active = WT_RX.observeSimVar(throttledUpdate$, `COM ACTIVE FREQUENCY:${i}`, "MHz").pipe(rxjs.operators.map(mhz => mhz.toFixed(3)));
            radio.standby = WT_RX.observeSimVar(throttledUpdate$, `COM STANDBY FREQUENCY:${i}`, "MHz").pipe(rxjs.operators.map(mhz => mhz.toFixed(3)));
            radio.volume = WT_RX.observeSimVar(throttledUpdate$, `COM VOLUME:${i}`, "number");
            radios[i] = radio;
        }

        super(radios[1], radios[2]);
        this.forceUpdate$ = new rxjs.Subject();
        this.forceUpdate$.subscribe(() => forceUpdate$.next()); // This is really messy because of the class setup, needs refactoring
    }
    get simVarPrefix() {
        return `K:COM${this.selected.value == 1 ? "" : "2"}`;
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
        SimVar.SetSimVarValue(`K:COM${this.selected.value == 1 ? "_STBY" : "2"}_RADIO_SWAP`, "number", 0);
        this.forceUpdate$.next();
    }
    make_bcd16(arg) {
        var iarg = (arg / 10000.0 - 10000);
        arg = (iarg % 10) + ((iarg / 10 % 10) << 4) + ((iarg / 100 % 10) << 8) + ((iarg / 1000 % 10) << 12);
        return arg;
    }
    setEmergencyFrequency() {
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_SET`, "Frequency BCD16", this.make_bcd16(121500000));
        this.forceUpdate$.next();
    }
    /**
     * @param {Number} bcd 
     */
    selectFrequency(bcd) {
        SimVar.SetSimVarValue(`K:COM${this.selected.value == 1 ? "_STBY" : "2"}_RADIO_SWAP`, "number", 0);
        SimVar.SetSimVarValue(`${this.simVarPrefix}_RADIO_SET`, "Frequency BCD16", bcd);
        this.forceUpdate$.next();
    }
}

class WT_Com_Frequencies_View extends WT_Radio_Frequencies_View { }
customElements.define("g1000-com-frequencies", WT_Com_Frequencies_View);