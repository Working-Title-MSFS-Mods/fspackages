class WT_Plane_Statistics {
    /**
     * @param {*} update$ 
     * @param {WT_Plane_State} planeState 
     * @param {WT_Clock} clock
     */
    constructor(update$, planeState, clock) {
        this.resetOdometer$ = (new rxjs.Subject());
        const resetOdometer$ = this.resetOdometer$.pipe(
            rxjs.operators.startWith(WTDataStore.get("odometer", 0)),
            rxjs.operators.tap(odometer => WTDataStore.set("odometer", odometer)),
            rxjs.operators.shareReplay(1)
        );

        const movement$ = planeState.getLowResCoordinates(0.02).pipe(
            rxjs.operators.shareReplay(1),
            rxjs.operators.pairwise(),
            rxjs.operators.map(([a, b]) => Avionics.Utils.computeDistance(a, b) * 1.852),
            rxjs.operators.startWith(0)
        );

        const inAir$ = planeState.groundSpeed.pipe(
            rxjs.operators.map(speed => speed > WT_Plane_Statistics.GROUND_SPEED_MINIMUM),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.debounceTime(1000),
            rxjs.operators.shareReplay(1)
        )

        const tripOdometer$ = movement$.pipe(
            rxjs.operators.startWith(0),
            rxjs.operators.scan((previous, current) => previous + current, 0),
        );

        this.tripOdometer = inAir$.pipe(
            rxjs.operators.switchMap(inAir => inAir ? tripOdometer$ : rxjs.empty()),
            rxjs.operators.shareReplay(1)
        );

        this.odometer = resetOdometer$.pipe(
            rxjs.operators.switchMap(startValue => movement$.pipe(
                rxjs.operators.scan((previous, current) => previous + current, startValue),
            )),
            rxjs.operators.shareReplay(1)
        );

        this.maximumGroundSpeed = planeState.groundSpeed.pipe(
            rxjs.operators.scan((previous, current) => Math.max(previous, current), 0/*WTDataStore.get("max_ground_speed", 0)*/),
            rxjs.operators.shareReplay(1)
        );

        const totalTime$ = clock.absoluteTime.pipe(
            rxjs.operators.throttleTime(500),
            rxjs.operators.pairwise(),
            rxjs.operators.map(([a, b]) => b - a),
            rxjs.operators.filter(delta => delta < 1), // Values over 1 probably caused by pausing the game so we should ignore those
            rxjs.operators.scan((previous, current) => previous + current, 0),
        );

        const distanceTime$ = movement$.pipe(
            rxjs.operators.scan((previous, current) => previous + current, 0),
            rxjs.operators.withLatestFrom(totalTime$.pipe(rxjs.operators.map(seconds => seconds / 3600)))
        );

        this.averageGroundSpeed = inAir$.pipe(
            rxjs.operators.switchMap(inAir => inAir ? distanceTime$ : rxjs.empty()),
            rxjs.operators.map(([distance, time]) => distance / time),
            rxjs.operators.shareReplay(1)
        );

        this.averageGroundSpeed.subscribe(() => { });
        this.tripOdometer.subscribe(() => { });

        update$.pipe(
            rxjs.operators.throttleTime(WT_Plane_Statistics.PERSIST_FREQUENCY),
            rxjs.operators.withLatestFrom(this.odometer, this.maximumGroundSpeed)
        ).subscribe(([dt, odometer, maximumGroundSpeed]) => {
            WTDataStore.set("odometer", odometer);
            //WTDataStore.set("max_ground_speed", maximumGroundSpeed);
        });

        this.inAirTimer = inAir$.pipe(
            rxjs.operators.switchMap(inAir => inAir ? totalTime$ : rxjs.of(null)),
            rxjs.operators.shareReplay(1)
        );
        this.inAirTimer.subscribe(() => { });

        this.powerOnTimer = planeState.electricity.observable.pipe(
            rxjs.operators.switchMap(on => on ? totalTime$ : rxjs.of(null)),
            rxjs.operators.shareReplay(1)
        );
        this.powerOnTimer.subscribe(() => { });

        this.inAirDepartureTime = inAir$.pipe(
            rxjs.operators.switchMap(inAir => inAir ? clock.localTime.pipe(
                rxjs.operators.first()
            ) : rxjs.of(null)),
            rxjs.operators.shareReplay(1)
        );
        this.inAirDepartureTime.subscribe(() => { });

        this.powerOnDepartureTime = planeState.electricity.observable.pipe(
            rxjs.operators.switchMap(inAir => inAir ? clock.localTime.pipe(
                rxjs.operators.first()
            ) : rxjs.of(null)),
            rxjs.operators.shareReplay(1)
        );
        this.powerOnDepartureTime.subscribe(() => { });
    }
    resetStatistics() {
        this.resetOdometer$.next(0);
    }
    persist() {
        WTDataStore.set("odometer", this.odometer.value);
        WTDataStore.set("max_ground_speed", this.maximumGroundSpeed.value);
    }
}
WT_Plane_Statistics.ODOMETER_FREQUENCY = 1 * 1000;
WT_Plane_Statistics.PERSIST_FREQUENCY = 60 * 1000;
WT_Plane_Statistics.GROUND_SPEED_MINIMUM = 50;