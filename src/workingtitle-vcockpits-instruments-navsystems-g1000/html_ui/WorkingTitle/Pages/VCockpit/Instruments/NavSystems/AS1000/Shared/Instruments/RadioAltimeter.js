class WT_Radio_Altimeter {
    /**
     * @param {WT_Plane_Config} config 
     */
    constructor(config, update$) {
        this.isAvailable = true;
        this.enabled = new rxjs.BehaviorSubject(false);
        config.watchNode("RadarAltitude").subscribe(node => {
            this.isAvailable = node && node.textContent == "True";
            this.enabled.next(node && node.textContent == "True");
        });

        const height$ = WT_RX.observeSimVar(update$, "RADIO HEIGHT", "feet");

        const acceptable$ = update$.pipe(
            rxjs.operators.withLatestFrom(height$),
            rxjs.operators.map(([dt, height]) => {
                const heightAcceptable = height > 0 && height < 2500;
                const xyz = Simplane.getOrientationAxis();
                const bankAcceptable = Math.abs(xyz.bank) < Math.PI * 0.35;
                return (bankAcceptable && heightAcceptable);
            }),
            rxjs.operators.distinctUntilChanged()
        )

        this.available = rxjs.combineLatest(update$, acceptable$).pipe(
            rxjs.operators.map(([dt, acceptable]) => acceptable)
        );

        this.altitude = this.enabled.pipe(
            rxjs.operators.switchMap(enabled => {
                if (enabled) {
                    return acceptable$.pipe(
                        rxjs.operators.switchMap(available => available ? height$ : rxjs.of(1000)),
                        rxjs.operators.distinctUntilChanged(),
                        WT_RX.shareReplay()
                    )
                } else {
                    return rxjs.of(null);
                }
            })
        );
    }
}