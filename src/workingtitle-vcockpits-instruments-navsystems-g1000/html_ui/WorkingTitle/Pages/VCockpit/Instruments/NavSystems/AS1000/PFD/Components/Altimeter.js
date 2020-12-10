class WT_Altimeter_Model {
    /**
     * @param {FlightPlanManager} flightPlanManager 
     * @param {WT_Plane_State} planeState 
     * @param {WT_Barometer} barometer 
     * @param {WT_Minimums} minimums
     * @param {WT_Radio_Altimeter} radioAltimeter
     * @param {WT_Sound} sound
     */
    constructor(update$, flightPlanManager, planeState, barometer, minimums, radioAltimeter, sound) {
        this.flightPlanManager = flightPlanManager;
        this.barometer = barometer;
        this.minimums = minimums;
        this.radioAltimeter = radioAltimeter;
        this.sound = sound;

        this.altimeterIndex = 1;

        this.vspeed = planeState.verticalSpeed;
        this.verticalDeviation = this.initVdi(update$);
        this.referenceVSpeed = WT_RX.observeSimVar(update$, "AUTOPILOT VERTICAL HOLD", "bool").pipe(
            rxjs.operators.switchMap(hold => {
                if (hold) {
                    return WT_RX.observeSimVar(update$, "AUTOPILOT VERTICAL HOLD VAR", "feet per minute")
                } else {
                    return rxjs.of(null)
                }
            })
        );

        this.units = new rxjs.BehaviorSubject("nautical");

        this.altitude = this.units.pipe(
            rxjs.operators.switchMap(units => {
                switch (units) {
                    case "nautical":
                        return planeState.indicatedAltitude
                    case "metric":
                        return planeState.indicatedAltitude.pipe(rxjs.operators.map(feet => feet / 3.2808));
                }
            }),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.shareReplay(1)
        );

        this.referenceAltitude = WT_RX.observeSimVar(update$, "AUTOPILOT ALTITUDE LOCK VAR", "feet");
        this.selectedAltitudeAlert = this.initSelectedAltitudeAlert();
    }
    initVdi(update$) {
        const cdiSource$ = WT_RX.observeSimVar(update$, "GPS DRIVES NAV1", "Bool").pipe(
            rxjs.operators.switchMap(gps => gps ? rxjs.of(3) : WT_RX.observeSimVar(update$, "AUTOPILOT NAV SELECTED", "Number")),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.shareReplay(1)
        );

        const nav1HasGlideSlope$ = WT_RX.observeSimVar(update$, "NAV HAS GLIDE SLOPE:1", "Bool").pipe(rxjs.operators.shareReplay(1));
        const nav2HasGlideSlope$ = WT_RX.observeSimVar(update$, "NAV HAS GLIDE SLOPE:2", "Bool").pipe(rxjs.operators.shareReplay(1));
        const isActiveApproach$ = update$.pipe(
            rxjs.operators.map(dt => this.flightPlanManager.isActiveApproach() && Simplane.getAutoPilotApproachType() == 10),
            rxjs.operators.distinctUntilChanged()
        )
        const nav1GlideSlope$ = WT_RX.observeSimVar(update$, "NAV GSI:1", "number").pipe(rxjs.operators.map(gsi => gsi / 127.0));
        const nav2GlideSlope$ = WT_RX.observeSimVar(update$, "NAV GSI:2", "number").pipe(rxjs.operators.map(gsi => gsi / 127.0));

        /*const nav1GlideSlope$ = update$.pipe(
            rxjs.operators.withLatestFrom(WT_RX.observeSimVar(update$, "NAV GSI:1", "number").pipe(rxjs.operators.map(gsi => gsi / 127.0))),
            rxjs.operators.map(([dt, gs]) => gs),
            WT_RX.interpolateTo(10)
        )
        const nav2GlideSlope$ = update$.pipe(
            rxjs.operators.withLatestFrom(WT_RX.observeSimVar(update$, "NAV GSI:2", "number").pipe(rxjs.operators.map(gsi => gsi / 127.0))),
            rxjs.operators.map(([dt, gs]) => gs),
            WT_RX.interpolateTo(10)
        )*/

        const gpsGlideSlopePreview$ = nav1HasGlideSlope$.pipe(
            rxjs.operators.switchMap(hasNav1 => {
                if (hasNav1) {
                    return nav1GlideSlope$;
                } else {
                    return nav2HasGlideSlope$.pipe(
                        rxjs.operators.switchMap(hasNav2 => hasNav2 ? nav2GlideSlope$ : rxjs.empty())
                    )
                }
            })
        );
        const verticalError$ = WT_RX.observeSimVar(update$, "GPS VERTICAL ERROR", "meters").pipe(rxjs.operators.map(gsi => gsi / 150.0));

        return {
            mode: cdiSource$.pipe(rxjs.operators.switchMap(cdiSource => {
                switch (cdiSource) {
                    case 1:
                        return nav1HasGlideSlope$.pipe(rxjs.operators.map(has => has ? "GS" : "None"))
                    case 2:
                        return nav2HasGlideSlope$.pipe(rxjs.operators.map(has => has ? "GS" : "None"))
                    case 3:
                        return isActiveApproach$.pipe(
                            rxjs.operators.switchMap(isActiveApproach => {
                                if (isActiveApproach) {
                                    return rxjs.of("GP");
                                } else {
                                    return rxjs.combineLatest(nav1HasGlideSlope$, nav2HasGlideSlope$, (nav1, nav2) => nav1 || nav2).pipe(
                                        rxjs.operators.map(hasPreview => rxjs.of(hasPreview ? "GSPreview" : "None"))
                                    )
                                }
                            })
                        );
                }
            })),

            value: cdiSource$.pipe(rxjs.operators.switchMap(cdiSource => {
                switch (cdiSource) {
                    case 1:
                        return nav1HasGlideSlope$.pipe(
                            rxjs.operators.switchMap(has => has ? nav1GlideSlope$ : rxjs.empty())
                        )
                    case 2:
                        return nav2HasGlideSlope$.pipe(
                            rxjs.operators.switchMap(has => has ? nav2GlideSlope$ : rxjs.empty())
                        )
                    case 3:
                        return isActiveApproach$.pipe(
                            rxjs.operators.switchMap(isActiveApproach => isActiveApproach ? verticalError$ : gpsGlideSlopePreview$)
                        );
                }
            }))
        }
    }
    initSelectedAltitudeAlert() {
        const deltaAltitudeSelected$ = rxjs.combineLatest(this.altitude, this.referenceAltitude).pipe(
            rxjs.operators.map(([altitude, selected]) => Math.abs(altitude - selected)),
            rxjs.operators.share()
        );
        const altitudeAtSelected$ = deltaAltitudeSelected$.pipe(
            rxjs.operators.map(delta => delta <= 200),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.debounceTime(100)
        );
        const altitudeCloseToSelected$ = deltaAltitudeSelected$.pipe(
            rxjs.operators.map(delta => delta <= 1000),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.debounceTime(100)
        );

        const selectedAltWasCaptured$ = this.referenceAltitude.pipe(
            rxjs.operators.switchMapTo(altitudeAtSelected$.pipe(
                rxjs.operators.takeWhile(at => !at, true)
            )),
            rxjs.operators.distinctUntilChanged(),
        )

        const flashAnimation$ = rxjs.interval(250).pipe(
            rxjs.operators.map(i => i % 2 == 0),
            rxjs.operators.takeUntil(rxjs.timer(5000)),
            rxjs.operators.endWith(true)
        );
        const flashAt$ = selectedAltWasCaptured$.pipe(
            rxjs.operators.switchMap(() => flashAnimation$.pipe(rxjs.operators.map(show => show ? "BlueText" : "Empty"))),
            rxjs.operators.shareReplay(1)
        );
        const capturedLost$ = flashAnimation$.pipe(rxjs.operators.map(show => show ? "YellowText" : "Empty"));
        const uncapturedFlashClose$ = flashAnimation$.pipe(rxjs.operators.map(show => show ? "BlueBackground" : "BlueText"));

        const capturedAnimation$ = altitudeAtSelected$.pipe(rxjs.operators.switchMap(at => {
            if (at) {
                return flashAt$;
            } else {
                this.sound.play("tone_altitude_alert_default");
                return capturedLost$;
            }
        }));
        const uncapturedAnimation$ = rxjs.combineLatest(altitudeAtSelected$, altitudeCloseToSelected$).pipe(
            rxjs.operators.switchMap(([at, close]) => {
                if (at) {
                    return flashAt$;
                } else if (close) {
                    return uncapturedFlashClose$;
                } else {
                    return rxjs.of("BlueText");
                }
            })
        )

        return selectedAltWasCaptured$.pipe(
            rxjs.operators.switchMap(captured => captured ? capturedAnimation$ : uncapturedAnimation$),
            rxjs.operators.startWith("BlueText")
        )
    }
}