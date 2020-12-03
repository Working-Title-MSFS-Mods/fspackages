class WT_Minimums {
    /**
     * @param {WT_Plane_Config} config 
     * @param {WT_Radio_Altimeter} radioAltimeter 
     * @param {WT_Plane_State} planeState 
     */
    constructor(update$, radioAltimeter, planeState) {
        this.modes = new Subject([0, 1]);

        radioAltimeter.enabled.subscribe(enabled => {
            if (enabled) {
                this.modes.value = [0, 1, 3];
            } else {
                this.modes.value = [0, 1];
            }
        });

        this.forceUpdate$ = new rxjs.Subject();
        const throttledUpdate$ = rxjs.merge(
            this.forceUpdate$,
            update$.pipe(rxjs.operators.throttleTime(1000))
        ).pipe(
            rxjs.operators.share()
        );

        this.value = throttledUpdate$.pipe(
            rxjs.operators.map(() => SimVar.GetSimVarValue("L:AS3000_MinimalsValue", "number")),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.shareReplay(1)
        );

        this.mode = throttledUpdate$.pipe(
            rxjs.operators.map(() => SimVar.GetSimVarValue("L:AS3000_MinimalsMode", "number")),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.shareReplay(1)
        );
        this.source = this.mode.pipe(
            rxjs.operators.map(mode => {
                switch (mode) {
                    case 0:
                        return null;
                    case 1:
                        return "BARO MIN";
                    case 2:
                        return "COMP MIN";
                    case 3:
                        return "RA MIN";
                }
            })
        )

        const wasAbove$ = rxjs.combineLatest(this.mode, this.value).pipe(
            rxjs.operators.switchMap(([mode, value]) => {
                return planeState.indicatedAltitude.pipe(
                    rxjs.operators.map(altitude => altitude > (value + 100)),
                    rxjs.operators.takeWhile(upper => upper != true, true),
                    rxjs.operators.distinctUntilChanged()
                )
            })
        );

        const altitudeMap = ([altitude, wasAbove, minimum]) => {
            if (wasAbove) {
                if (altitude > minimum + 100) {
                    return null;
                } else if (altitude > minimum) {
                    return "near";
                } else {
                    return "low";
                }
            } else {
                return null;
            }
        }

        this.state = this.mode.pipe(
            rxjs.operators.switchMap(mode => {
                switch (mode) {
                    case 0:
                        return rxjs.empty();
                    case 1:
                        return rxjs.combineLatest(planeState.indicatedAltitude, wasAbove$, this.value).pipe(
                            rxjs.operators.map(altitudeMap)
                        )
                    case 2:
                        return rxjs.of(null);
                    case 3:
                        return rxjs.combineLatest(radioAltimeter.altitude, wasAbove$, this.value).pipe(
                            rxjs.operators.map(altitudeMap)
                        )
                }
            }),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.shareReplay(1)
        )
    }
    setModes(modes) {
        this.modes.value = modes;
    }
    setMode(mode) {
        SimVar.SetSimVarValue("L:AS3000_MinimalsMode", "number", mode);
        this.forceUpdate$.next();
    }
    setAltitude(value) {
        SimVar.SetSimVarValue("L:AS3000_MinimalsValue", "number", value);
        this.forceUpdate$.next();
    }
}