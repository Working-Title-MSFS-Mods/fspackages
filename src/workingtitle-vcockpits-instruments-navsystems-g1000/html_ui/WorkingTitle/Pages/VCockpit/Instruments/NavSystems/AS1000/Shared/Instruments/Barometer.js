class WT_Barometer {
    constructor(update$) {
        this.altUnit = new rxjs.BehaviorSubject(WTDataStore.get(`BarometerUnit`, WT_Barometer.IN_MG));
        this.altimeterIndex = 1;

        this.inMg$ = WT_RX.observeSimVar(update$, `KOHLSMAN SETTING HG:${this.altimeterIndex}`, "inches of mercury");
        this.hpa$ = WT_RX.observeSimVar(update$, `KOHLSMAN SETTING HG:${this.altimeterIndex}`, "Millibars");
        this.pressure = this.altUnit.pipe(
            rxjs.operators.switchMap(unit => {
                switch (unit) {
                    case WT_Barometer.IN_MG:
                        return this.inMg$;
                    case WT_Barometer.HPA:
                        return this.hpa$;
                }
            }),
            rxjs.operators.distinctUntilChanged(),
            WT_RX.shareReplay(),
        );
    }
    setInMG() {
        this.altUnit.next(WT_Barometer.IN_MG);
        WTDataStore.set(`BarometerUnit`, WT_Barometer.IN_MG);
    }
    setHpa() {
        this.altUnit.next(WT_Barometer.HPA);
        WTDataStore.set(`BarometerUnit`, WT_Barometer.HPA);
    }
    setStandard() {
        SimVar.SetSimVarValue("KOHLSMAN SETTING STD", "Bool", 0);
    }
    incrementBaro() {
        SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", this.altimeterIndex);
    }
    decrementBaro() {
        SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", this.altimeterIndex);
    }
    getPressure() {
        return parseFloat(SimVar.GetSimVarValue(`KOHLSMAN SETTING HG:${this.altimeterIndex}`, "inches of mercury"));
    }
}
WT_Barometer.IN_MG = "IN";
WT_Barometer.HPA = "HPA";