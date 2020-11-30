class WT_Altimeter_Model {
    /**
     * @param {NavSystem} gps 
     * @param {WT_Barometer} barometricPressure 
     * @param {WT_Minimums} minimums
     * @param {WT_Radio_Altimeter} radioAltimeter
     * @param {WT_Sound} sound
     */
    constructor(update$, gps, barometricPressure, minimums, radioAltimeter, sound) {
        this.gps = gps;
        this.barometricPressure = barometricPressure;
        this.minimums = minimums;
        this.radioAltimeter = radioAltimeter;
        this.sound = sound;

        this.lastPressure = -10000;
        this.lastSelectedAltitude = -10000;
        this.altimeterIndex = 1;

        this.vspeed = new Subject(0);
        this.referenceVSpeed = new Subject(0);
        this.verticalDeviation = {
            mode: new Subject(null),
            value: new Subject(0),
        }
        this.pressure = new Subject(0);

        this.units = new rxjs.BehaviorSubject("nautical");

        this.altitude = update$.pipe(
            rxjs.operators.withLatestFrom(this.units),
            rxjs.operators.map(([dt, units]) => {
                switch (units) {
                    case "nautical":
                        return SimVar.GetSimVarValue("INDICATED ALTITUDE:" + this.altimeterIndex, "feet");
                    case "metric":
                        return SimVar.GetSimVarValue("INDICATED ALTITUDE:" + this.altimeterIndex, "metres");
                }
            }),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.shareReplay(1)
        );

        this.referenceAltitude = update$.pipe(
            rxjs.operators.map(() => SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet")),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.shareReplay(1)
        )

        this.selectedAltitudeAlert = this.initSelectedAltitudeAlert();
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
    updateVdi() {
        const cdiSource = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool") ? 3 : SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number");
        switch (cdiSource) {
            case 1:
                if (SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:1", "Bool")) {
                    this.verticalDeviation.mode.value = "GS";
                    this.verticalDeviation.value.value = SimVar.GetSimVarValue("NAV GSI:1", "number") / 127.0;
                } else {
                    this.verticalDeviation.mode.value = "None";
                }
                break;
            case 2:
                if (SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:2", "Bool")) {
                    this.verticalDeviation.mode.value = "GS";
                    this.verticalDeviation.value.value = SimVar.GetSimVarValue("NAV GSI:2", "number") / 127.0;
                } else {
                    this.verticalDeviation.mode.value = "None";
                }
                break;
            case 3:
                if (this.gps.currFlightPlanManager.isActiveApproach() && Simplane.getAutoPilotApproachType() == 10) {
                    this.verticalDeviation.mode.value = "GP";
                    this.verticalDeviation.value.value = SimVar.GetSimVarValue("GPS VERTICAL ERROR", "meters") / 150;
                } else if (SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:1", "Bool")) {
                    this.verticalDeviation.mode.value = "GSPreview";
                    this.verticalDeviation.value.value = SimVar.GetSimVarValue("NAV GSI:1", "number") / 127.0;
                } else {
                    if (SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:2", "Bool")) {
                        this.verticalDeviation.mode.value = "GSPreview";
                        this.verticalDeviation.value.value = SimVar.GetSimVarValue("NAV GSI:2", "number") / 127.0;
                    } else {
                        this.verticalDeviation.mode.value = "None";
                    }
                }
                break;
        }
    }
    updatePressure() {
        this.pressure.value = this.barometricPressure.getPressure();
    }
    update(dt) {
        this.vspeed.value = Simplane.getVerticalSpeed();
        if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "bool")) {
            this.referenceVSpeed.value = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet per minute");
        } else {
            this.referenceVSpeed.value = null;
        }
        this.updateVdi();
        this.updatePressure();
    }
}