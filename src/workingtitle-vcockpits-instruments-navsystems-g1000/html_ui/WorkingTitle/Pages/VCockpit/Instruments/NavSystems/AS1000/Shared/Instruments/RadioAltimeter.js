class WT_Radio_Altimeter {
    /**
     * @param {WT_Plane_Config} config 
     */
    constructor(config, update$) {
        this.isAvailable = true;
        this.enabled = new rxjs.BehaviorSubject(false);
        config.watchNode("RadarAltitude").subscribe(node => {
            this.isAvailable = true;// node && node.textContent == "True"; //TODO:
            this.enabled.next(true);//node && node.textContent == "True");
        });

        const height$ = update$.pipe(
            rxjs.operators.map(() => SimVar.GetSimVarValue("RADIO HEIGHT", "feet")),
            rxjs.operators.shareReplay(1)
        )

        const acceptable$ = update$.pipe(
            rxjs.operators.withLatestFrom(height$),
            rxjs.operators.map(([dt, height]) => {
                const heightAcceptable = height > 0 && height < 2500;
                const xyz = Simplane.getOrientationAxis();
                const bankAcceptable = Math.abs(xyz.bank) < Math.PI * 0.35;
                return (bankAcceptable && heightAcceptable);
            })
        )

        this.available = rxjs.combineLatest(update$, acceptable$).pipe(
            rxjs.operators.map(([dt, acceptable]) => acceptable)
        );

        this.altitude = this.enabled.pipe(
            rxjs.operators.switchMap(enabled => {
                if (enabled) {
                    return update$.pipe(
                        rxjs.operators.withLatestFrom(acceptable$),
                        rxjs.operators.switchMap(([dt, available]) => available ? height$ : rxjs.of(1000)),
                        rxjs.operators.distinctUntilChanged(),
                        rxjs.operators.shareReplay(1)
                    )
                } else {
                    return rxjs.of(null);
                }
            })
        );
    }
}