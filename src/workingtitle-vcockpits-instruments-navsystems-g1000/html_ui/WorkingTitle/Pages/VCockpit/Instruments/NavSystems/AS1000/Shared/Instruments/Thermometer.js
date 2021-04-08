class WT_Thermometer {
    constructor(frame$) {
        const throttledUpdate$ = WT_RX.frameUpdate(frame$, 0.3, WT_Thermometer.UPDATE_FREQUENCY);

        this.outsideAirTemperature = {
            celsius: throttledUpdate$.pipe(
                rxjs.operators.map(() => SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius")),
                rxjs.operators.distinctUntilChanged(),
                rxjs.operators.share(),
            ),
            farenheit: throttledUpdate$.pipe(
                rxjs.operators.map(() => SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "farenheit")),
                rxjs.operators.distinctUntilChanged(),
                rxjs.operators.share(),
            )
        };
    }
}
WT_Thermometer.UPDATE_FREQUENCY = 5; //seconds