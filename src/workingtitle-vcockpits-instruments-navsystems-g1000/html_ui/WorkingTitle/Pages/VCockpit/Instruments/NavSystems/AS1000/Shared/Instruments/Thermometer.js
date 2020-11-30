class WT_Thermometer {
    constructor(update$) {
        this.update$ = update$;

        const throttledUpdate$ = this.update$.pipe(
            rxjs.operators.throttleTime(WT_Thermometer.UPDATE_FREQUENCY)
        );

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
WT_Thermometer.UPDATE_FREQUENCY = 1000;