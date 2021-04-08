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
            WT_RX.shareReplay()
        );

        this.referenceAltitude = WT_RX.observeSimVar(update$, "AUTOPILOT ALTITUDE LOCK VAR", "feet");
        this.selectedAltitudeAlert = this.initSelectedAltitudeAlert();
    }
    initVdi(update$) {
        const cdiSource$ = WT_RX.observeSimVar(update$, "GPS DRIVES NAV1", "Bool").pipe(
            rxjs.operators.switchMap(gps => gps ? rxjs.of(3) : WT_RX.observeSimVar(update$, "AUTOPILOT NAV SELECTED", "Number")),
            rxjs.operators.distinctUntilChanged(),
            WT_RX.shareReplay()
        );

        const nav1HasGlideSlope$ = WT_RX.observeSimVar(update$, "NAV HAS GLIDE SLOPE:1", "Bool").pipe(WT_RX.shareReplay());
        const nav2HasGlideSlope$ = WT_RX.observeSimVar(update$, "NAV HAS GLIDE SLOPE:2", "Bool").pipe(WT_RX.shareReplay());
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
            WT_RX.shareReplay()
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

class Altimeter extends HTMLElement {
    constructor() {
        super();
        this.currentCenterGrad = -10000;
        this.minimumAltitude = NaN;
        this.compactVs = false;
        this.baroMode = WTDataStore.get("Alt.BaroMode", "IN");
        this.lastPressure = "29.92";
    }
    static get observedAttributes() {
        return [
            "altitude",
            "radar-altitude",
            "reference-altitude",
            "minimum-altitude",
            "minimum-altitude-state",
            "pressure",
            "vspeed",
            "reference-vspeed",
            "vertical-deviation-mode",
            "vertical-deviation-value",
            "selected-altitude-alert",
            "baro-mode"
        ];
    }
    /**
     * @param {WT_Altimeter_Model} model 
     */
    setModel(model) {
        model.altitude.subscribe(altitude => this.setAttribute("altitude", altitude));
        model.radioAltimeter.altitude.subscribe(altitude => {
            if (altitude !== null) {
                this.setAttribute("radar-altitude", altitude);
            }
        });
        //model.vspeed.subscribe(vspeed => this.setAttribute("vspeed", vspeed));
        model.referenceVSpeed.subscribe(speed => this.setAttribute("reference-vspeed", speed));
        model.referenceAltitude.subscribe(altitude => this.setAttribute("reference-altitude", altitude));
        model.selectedAltitudeAlert.subscribe(alert => this.setAttribute("selected-altitude-alert", alert));
        model.verticalDeviation.mode.subscribe(mode => this.setAttribute("vertical-deviation-mode", mode));
        model.verticalDeviation.value.subscribe(value => this.setAttribute("vertical-deviation-value", value));

        const altitude$ = model.altitude;
        const center$ = model.altitude.pipe(
            rxjs.operators.map(altitude => Math.round(altitude / Altimeter.GRADUATION_SCALE) * 100),
            rxjs.operators.distinctUntilChanged(),
            WT_RX.shareReplay()
        );

        // Graduations
        center$.subscribe(center => {
            for (let i = 0; i < this.graduationTexts.length; i++) {
                this.graduationTexts[i].textContent = Math.floor((((3 - i) * 100) + center) / 100);
            }
        });

        // Ladder
        rxjs.combineLatest(model.altitude, center$).pipe(
            rxjs.operators.map(([altitude, center]) => (altitude - center) * Altimeter.GRADUATION_SCALE / 100),
            rxjs.operators.map(Math.round),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(translate => {
            this.graduationGroup.setAttribute("transform", `translate(0, ${translate})`);
            this.bugsGroup.setAttribute("transform", `translate(0, ${translate})`);
        });

        // Selected altitude bug
        rxjs.combineLatest(model.referenceAltitude, center$).pipe(
            rxjs.operators.map(([altitude, center]) => (center - altitude) * Altimeter.GRADUATION_SCALE / 100),
            rxjs.operators.map(Math.round),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(translate => {
            this.selectedAltitudeBug.setAttribute("transform", `translate(0, ${translate})`);
        });

        // Minimums
        const minimumsTranslate$ = rxjs.combineLatest(model.minimums.value, center$).pipe(
            rxjs.operators.map(([altitude, center]) => (center - altitude) * Altimeter.GRADUATION_SCALE / 100),
            rxjs.operators.map(Math.round),
            rxjs.operators.distinctUntilChanged(),
        );
        model.minimums.mode.pipe(
            rxjs.operators.switchMap(mode => mode != 0 ? minimumsTranslate$ : rxjs.empty())
        ).subscribe(translate => {
            this.minimumAltitudeBug.setAttribute("transform", `translate(0, ${translate})`);
        });

        model.minimums.mode.subscribe(mode => {
            this.minimumAltitudeBug.setAttribute("display", mode === 0 ? "none" : "block");
        });
        model.minimums.state.subscribe(state => {
            switch (state) {
                case "low":
                    this.minimumAltitudeBug.setAttribute("stroke", "yellow");
                    break;
                case "near":
                    this.minimumAltitudeBug.setAttribute("stroke", "white");
                    break;
                default:
                    this.minimumAltitudeBug.setAttribute("stroke", "#36c8d2");
                    break;
            }
        });

        // Pressure
        rxjs.combineLatest(model.barometer.altUnit, model.barometer.pressure).pipe(
            rxjs.operators.map(([unit, pressure]) => {
                const isStandard = (unit == WT_Barometer.IN_MG && (Math.abs(pressure - 29.92) < 0.005)) || (unit == WT_Barometer.HPA && (Math.abs(pressure - 1013) < 0.5));
                return isStandard ? "STD BARO" : pressure.toFixed(unit == "IN" ? 2 : 0) + unit;
            }),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(text => this.baroText.textContent = text);

        // VSpeed
        model.vspeed.pipe(
            WT_RX.distinctMap(vSpeed => Math.round(vSpeed / 50) * 50),
        ).subscribe(vSpeed => this.indicatorText.textContent = Math.abs(vSpeed) >= 100 ? vSpeed : "");

        model.vspeed.pipe(
            rxjs.operators.map(vSpeed => Math.max(Math.min(vSpeed, 2500), -2500)),
            rxjs.operators.map(vSpeed => vSpeed / 10),
            WT_RX.distinctMap(Math.round)
        ).subscribe(translate => this.indicator.setAttribute("transform", `translate(0, ${-translate})`));

        // Trend Line
        model.vspeed.pipe(
            WT_RX.interpolateTo(5),
            rxjs.operators.map(smoothed => Math.min(Math.max(Altimeter.ALTIMETER_HEIGHT / 2 + (smoothed / 10) * -1, 0), Altimeter.ALTIMETER_HEIGHT)),
            WT_RX.distinctMap(Math.round),
        ).subscribe(trend => {
            this.trendElement.setAttribute("y", Math.min(trend, Altimeter.ALTIMETER_HEIGHT / 2));
            this.trendElement.setAttribute("height", Math.abs(trend - Altimeter.ALTIMETER_HEIGHT / 2));
        });

        // Digits
        const handleDigit = (position, topElement, bottomElement) => {
            const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
            const digitMove = 57 / 20;
            const modulo = Math.pow(10, position);
            const divisor = Math.pow(10, position - 1);
            const digit$ = model.altitude.pipe(
                rxjs.operators.map(altitude => Math.floor((altitude % modulo) / divisor)),
                WT_RX.shareReplay()
            );
            const textBottom$ = digit$.pipe(
                rxjs.operators.combineLatest(model.altitude),
                WT_RX.distinctMap(([digit, altitude]) => altitude > divisor ? digit : "")
            );
            const textTop$ = digit$.pipe(WT_RX.distinctMap(digit => (digit + 1) % 10));
            const translate$ = altitude$.pipe(
                WT_RX.distinctMap(altitude => clamp(altitude % divisor - (divisor - 20), 0, 20) * digitMove)
            );
            textTop$.subscribe(top => topElement.textContent = top);
            textBottom$.subscribe(bottom => bottomElement.textContent = bottom);
            translate$.subscribe(translate => {
                topElement.setAttribute("transform", `translate(0, ${translate})`);
                bottomElement.setAttribute("transform", `translate(0, ${translate})`);
            });
        }
        handleDigit(5, this.digit1Top, this.digit1Bot);
        handleDigit(4, this.digit2Top, this.digit2Bot);
        handleDigit(3, this.digit3Top, this.digit3Bot);

        // End digits
        const roundAltitude$ = model.altitude.pipe(
            WT_RX.distinctMap(v => Math.round(v * 5) / 5),
            WT_RX.shareReplay()
        );

        roundAltitude$.pipe(
            rxjs.operators.map(altitude => (altitude % 20) / 20 * 45),
        ).subscribe(translate => this.endDigitsGroup.setAttribute("transform", `translate(0, ${translate})`));

        roundAltitude$.pipe(
            rxjs.operators.map(altitude => Math.floor(altitude % 100 / 20) * 20),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(altitude => {
            for (let i = 0; i < this.endDigits.length; i++) {
                this.endDigits[i].textContent = Avionics.Utils.fmod((2 - i) * 20 + altitude, 100).toFixed(0).padStart(2, "0");
            }
        });

    }
    createSvgElement(tagName, attributes = []) {
        return DOMUtilities.createElementNS(Avionics.SVG.NS, tagName, attributes);
    }
    createBackground() {
        return this.createSvgElement("rect", { x: 0, y: -50, width: Altimeter.ALTIMETER_WIDTH, height: Altimeter.ALTIMETER_HEIGHT, class: "altimeter-background" });
    }
    createBarometricPressure() {
        const g = this.createSvgElement("g", { class: "barometric-pressure" });
        const background = this.createSvgElement("rect", { x: 0, y: 550, width: Altimeter.ALTIMETER_WIDTH, height: 50 });
        this.baroText = this.createSvgElement("text", { x: Altimeter.ALTIMETER_WIDTH / 2, y: 590 });

        g.appendChild(background);
        g.appendChild(this.baroText);
        return g;
    }
    createSelectedAltitude() {
        const g = this.createSvgElement("g", { class: "selected-altitude" });
        const background = this.createSvgElement("rect", { x: 0, y: -100, width: Altimeter.ALTIMETER_WIDTH, height: 50, class: "selected-altitude-background" });
        const bug = this.createSvgElement("polygon", {
            points: "10,-90 20,-90 20,-80 15,-75 20,-70 20,-60 10,-60 ",
            class: "selected-altitude-bug"
        });
        this.selectedAltText = this.createSvgElement("text", { x: Altimeter.ALTIMETER_WIDTH - 60, y: -60, class: "selected-altitude" });
        this.selectedAltText.textContent = "---";
        this.selectedAltTextSmall = this.createSvgElement("text", { x: Altimeter.ALTIMETER_WIDTH - 20, y: -60, class: "selected-altitude-small" });
        this.selectedAltTextSmall.textContent = "--";

        g.appendChild(background);
        g.appendChild(bug);
        g.appendChild(this.selectedAltText);
        g.appendChild(this.selectedAltTextSmall);

        return g;
    }
    createRotatingSvg(center) {
        const margin = 5;
        const svg = this.createSvgElement("svg", {
            x: Altimeter.ALTIMETER_WIDTH - 60,
            y: center - 60 + margin,
            width: 60,
            height: 120 - margin * 2,
            viewBox: "0 -50 60 110",
        });
        this.endDigitsGroup = this.createSvgElement("g");
        svg.appendChild(this.endDigitsGroup);
        this.endDigits = [];
        for (let i = -2; i <= 2; i++) {
            let digit = this.createSvgElement("text", { x: 4, y: 23 + 45 * i, class: "rotating-digit" });
            digit.textContent = "XX";
            this.endDigits.push(digit);
            this.endDigitsGroup.appendChild(digit);
        }
        return svg;
    }
    rotate2d(x, y, radians) {
        return [
            x * Math.cos(radians) + y * Math.sin(radians),
            -x * Math.sin(radians) + y * Math.cos(radians),
        ]
    }
    getRectSegments(x, y, w, h, r = 0, tx = 0, ty = 0) {
        return [
            this.rotate2d(x, y, r),
            this.rotate2d(x + w, y, r),
            this.rotate2d(x + w, y + h, r),
            this.rotate2d(x, y + h, r)
        ].map((point, i) => `${(i == 0) ? "M" : "L"}${point[0] + tx} ${point[1] + ty}`);
    }
    connectedCallback() {
        let vsStyle = this.getAttribute("VSStyle");
        if (!vsStyle) {
            vsStyle = "Default";
        }
        else if (vsStyle == "Compact") {
            this.compactVs = true;
        }
        this.root = this.createSvgElement("svg", { width: "100%", height: "100%", viewBox: `-50 -102 ${this.compactVs ? 300 : 380} 704`, class: "svg-background" });
        this.appendChild(this.root);
        this.overlayRoot = this.createSvgElement("svg", { width: "100%", height: "100%", viewBox: `-50 -102 ${this.compactVs ? 300 : 380} 704`, class: "svg-overlay" });
        this.appendChild(this.overlayRoot);

        // VSpeed
        {
            switch (vsStyle) {
                case "Compact":
                    {
                        let verticalSpeedGroup = this.createSvgElement("g");
                        verticalSpeedGroup.setAttribute("id", "VerticalSpeed");
                        this.root.appendChild(verticalSpeedGroup);
                        let background = this.createSvgElement("path");
                        background.setAttribute("d", "M200 -50 L200 550 L250 550 L250 275 L210 250 L250 225 L250 -50 Z");
                        background.setAttribute("fill", "#1a1d21");
                        background.setAttribute("fill-opacity", "0.25");
                        verticalSpeedGroup.appendChild(background);
                        let leftBar = this.createSvgElement("rect");
                        leftBar.setAttribute("x", "210");
                        leftBar.setAttribute("y", "10");
                        leftBar.setAttribute("height", "480");
                        leftBar.setAttribute("width", "2");
                        leftBar.setAttribute("fill", "white");
                        verticalSpeedGroup.appendChild(leftBar);
                        let dashes = [-240, -200, -160, -80, 80, 160, 200, 240];
                        let texts = ["2", "", "1", ".5", ".5", "1", "", "2"];
                        let height = 2.5;
                        let width = 20;
                        let fontSize = 30;
                        for (let i = 0; i < dashes.length; i++) {
                            let rect = this.createSvgElement("rect");
                            rect.setAttribute("x", "200");
                            rect.setAttribute("y", (250 - dashes[i] - height / 2).toString());
                            rect.setAttribute("height", height.toString());
                            rect.setAttribute("width", (width).toString());
                            rect.setAttribute("fill", "white");
                            verticalSpeedGroup.appendChild(rect);
                            if (texts[i] != "") {
                                let text = this.createSvgElement("text");
                                text.textContent = texts[i];
                                text.setAttribute("y", ((250 - dashes[i] - height / 2) + fontSize / 3).toString());
                                text.setAttribute("x", "235");
                                text.setAttribute("fill", "white");
                                text.setAttribute("font-size", fontSize.toString());
                                text.setAttribute("font-family", "Roboto-Bold");
                                text.setAttribute("text-anchor", "middle");
                                verticalSpeedGroup.appendChild(text);
                            }
                        }
                        let center = 250;
                        this.selectedVSBug = this.createSvgElement("polygon");
                        this.selectedVSBug.setAttribute("points", "200, " + (center - 20) + " 220, " + (center - 20) + " 220, " + (center - 15) + " 210, " + center + " 220, " + (center + 15) + " 220, " + (center + 20) + " 200, " + (center + 20));
                        this.selectedVSBug.setAttribute("fill", "#36c8d2");
                        verticalSpeedGroup.appendChild(this.selectedVSBug);
                        {
                            this.indicator = this.createSvgElement("polygon");
                            this.indicator.setAttribute("points", "250,275 210,250 250,225");
                            this.indicator.setAttribute("stroke", "#1a1d21");
                            this.indicator.setAttribute("fill", "white");
                            verticalSpeedGroup.appendChild(this.indicator);
                        }
                    }
                    break;
                case "Default":
                default:
                    {
                        let verticalSpeedGroup = this.createSvgElement("g", {
                            transform: `translate(${Altimeter.ALTIMETER_WIDTH}, 0)`
                        });
                        let verticalOverlaySpeedGroup = this.createSvgElement("g", {
                            transform: `translate(${Altimeter.ALTIMETER_WIDTH}, 0)`
                        });
                        verticalSpeedGroup.setAttribute("id", "VerticalSpeed");
                        this.root.appendChild(verticalSpeedGroup);
                        this.overlayRoot.appendChild(verticalOverlaySpeedGroup);
                        let background = this.createSvgElement("path", {
                            d: "M0 0 L0 500 L75 500 L75 300 L10 250 L75 200 L75 0 Z",
                            class: "vspeed-background",
                        });
                        verticalSpeedGroup.appendChild(background);
                        let dashes = [-200, -150, -100, -50, 50, 100, 150, 200];
                        let height = 3;
                        let width = 10;
                        let fontSize = 30;
                        for (let i = 0; i < dashes.length; i++) {
                            let rect = this.createSvgElement("rect");
                            rect.setAttribute("x", 0);
                            rect.setAttribute("y", (250 - dashes[i] - height / 2).toString());
                            rect.setAttribute("height", height.toString());
                            rect.setAttribute("width", ((dashes[i] % 100) == 0 ? 2 * width : width).toString());
                            rect.setAttribute("fill", "white");
                            verticalSpeedGroup.appendChild(rect);
                            if ((dashes[i] % 100) == 0) {
                                let text = this.createSvgElement("text");
                                text.textContent = Math.abs(dashes[i] / 100);
                                text.setAttribute("y", ((250 - dashes[i] - height / 2) + fontSize / 3).toString());
                                text.setAttribute("x", (3 * width).toString());
                                text.setAttribute("fill", "white");
                                text.setAttribute("font-size", fontSize.toString());
                                text.setAttribute("font-family", "Roboto-Bold");
                                verticalSpeedGroup.appendChild(text);
                            }
                        }
                        let center = 250;
                        this.selectedVSBug = this.createSvgElement("polygon", {
                            points: "0, " + (center - 20) + " 20, " + (center - 20) + " 20, " + (center - 15) + " 10, " + center + " 20, " + (center + 15) + " 20, " + (center + 20) + " 0, " + (center + 20),
                            class: "selected-altitude-bug",
                        });
                        verticalSpeedGroup.appendChild(this.selectedVSBug);
                        {
                            this.indicator = this.createSvgElement("g", { class: "vspeed-indicator" });
                            verticalOverlaySpeedGroup.appendChild(this.indicator);
                            let indicatorBackground = this.createSvgElement("path", {
                                d: "M10 250 L35 275 L130 275 L130 225 L35 225 Z",
                            });
                            this.indicator.appendChild(indicatorBackground);
                            this.indicatorText = this.createSvgElement("text", { x: 35, y: 260 });
                            this.indicator.appendChild(this.indicatorText);
                        }
                        this.selectedVSBackground = this.createSvgElement("rect", { x: 0, y: -50, width: 75, height: 50, class: "selected-vspeed-background" });
                        verticalSpeedGroup.appendChild(this.selectedVSBackground);
                        this.selectedVSText = this.createSvgElement("text", { x: 37.5, y: -15, class: "selected-vspeed" });
                        this.selectedVSText.textContent = "----";
                        verticalSpeedGroup.appendChild(this.selectedVSText);
                    }
                    break;
            }
        }

        {
            this.verticalDeviationGroup = this.createSvgElement("g");
            this.verticalDeviationGroup.setAttribute("visibility", "hidden");
            this.root.appendChild(this.verticalDeviationGroup);
            let background = this.createSvgElement("rect");
            background.setAttribute("x", "-50");
            background.setAttribute("y", "50");
            background.setAttribute("width", "50");
            background.setAttribute("height", "400");
            background.setAttribute("fill", "#1a1d21");
            background.setAttribute("fill-opacity", "0.25");
            this.verticalDeviationGroup.appendChild(background);
            let topBackground = this.createSvgElement("rect");
            topBackground.setAttribute("x", "-50");
            topBackground.setAttribute("y", "0");
            topBackground.setAttribute("width", "50");
            topBackground.setAttribute("height", "50");
            topBackground.setAttribute("fill", "#1a1d21");
            this.verticalDeviationGroup.appendChild(topBackground);
            this.verticalDeviationText = this.createSvgElement("text");
            this.verticalDeviationText.setAttribute("x", "-25");
            this.verticalDeviationText.setAttribute("y", "40");
            this.verticalDeviationText.setAttribute("fill", "#d12bc7");
            this.verticalDeviationText.setAttribute("font-size", "45");
            this.verticalDeviationText.setAttribute("font-family", "Roboto-Bold");
            this.verticalDeviationText.setAttribute("text-anchor", "middle");
            this.verticalDeviationText.textContent = "V";
            this.verticalDeviationGroup.appendChild(this.verticalDeviationText);
            for (let i = -2; i <= 2; i++) {
                if (i != 0) {
                    let grad = this.createSvgElement("circle");
                    grad.setAttribute("cx", "-25");
                    grad.setAttribute("cy", (250 + 66 * i).toString());
                    grad.setAttribute("r", "6");
                    grad.setAttribute("stroke", "white");
                    grad.setAttribute("stroke-width", "3");
                    grad.setAttribute("fill-opacity", "0");
                    this.verticalDeviationGroup.appendChild(grad);
                }
            }
            this.chevronBug = this.createSvgElement("polygon");
            this.chevronBug.setAttribute("points", "-45,250 -10,230 -10,240 -25,250 -10,260 -10,270");
            this.chevronBug.setAttribute("fill", "#d12bc7");
            this.verticalDeviationGroup.appendChild(this.chevronBug);
            this.diamondBug = this.createSvgElement("polygon");
            this.diamondBug.setAttribute("points", "-40,250 -25,235 -10,250 -25,265");
            this.diamondBug.setAttribute("fill", "#10c210");
            this.verticalDeviationGroup.appendChild(this.diamondBug);
            this.hollowDiamondBug = this.createSvgElement("polygon");
            this.hollowDiamondBug.setAttribute("points", "-40,250 -25,235 -10,250 -25,265 -25,255 -20,250 -25,245 -30,250 -25,255 -25,265");
            this.hollowDiamondBug.setAttribute("fill", "#DFDFDF");
            this.verticalDeviationGroup.appendChild(this.hollowDiamondBug);
        }

        this.selectedAltitudeGroup = this.createSelectedAltitude();
        this.root.appendChild(this.selectedAltitudeGroup);

        this.root.appendChild(this.createBackground());

        {
            let graduationSvg = this.createSvgElement("svg");
            graduationSvg.setAttribute("x", "0");
            graduationSvg.setAttribute("y", "-50");
            graduationSvg.setAttribute("width", Altimeter.ALTIMETER_WIDTH);
            graduationSvg.setAttribute("height", Altimeter.ALTIMETER_HEIGHT);
            graduationSvg.setAttribute("viewBox", `0 0 ${Altimeter.ALTIMETER_WIDTH} ${Altimeter.ALTIMETER_HEIGHT}`);
            this.overlayRoot.appendChild(graduationSvg);
            let center = 300;
            this.graduationGroup = this.createSvgElement("g");
            graduationSvg.appendChild(this.graduationGroup);
            {
                let graduationSize = Altimeter.GRADUATION_SCALE;
                this.graduationTexts = [];
                const graduationSegments = [];
                for (let i = -3; i <= 3; i++) {
                    graduationSegments.push(...this.getRectSegments(0, center - 2 + i * graduationSize, 40, 4), "Z");
                    const gradText = this.createSvgElement("text", { x: Altimeter.ALTIMETER_WIDTH - 48, y: fastToFixed(center + 11 + i * graduationSize, 0), class: "graduation-text" });
                    const gradTextSmall = this.createSvgElement("text", { x: Altimeter.ALTIMETER_WIDTH - 10, y: fastToFixed(center + 11 + i * graduationSize, 0), class: "graduation-text-small" });
                    gradTextSmall.textContent = "00";
                    this.graduationGroup.appendChild(gradTextSmall);
                    this.graduationGroup.appendChild(gradText);
                    this.graduationTexts.push(gradText);
                    for (let j = 1; j < 5; j++) {
                        graduationSegments.push(...this.getRectSegments(0, center - 2 + i * graduationSize + j * (graduationSize / 5), 15, 4), "Z");
                    }
                }
                const graduationLines = this.createSvgElement("path", {
                    d: graduationSegments.join(" "),
                    fill: "#fff",
                });
                this.graduationGroup.append(graduationLines);
            }
            this.groundLine = this.createSvgElement("g");
            this.groundLine.setAttribute("transform", "translate(0, 700)");
            graduationSvg.appendChild(this.groundLine);
            {
                let background = this.createSvgElement("rect");
                background.setAttribute("fill", "#654222");
                background.setAttribute("stroke", "white");
                background.setAttribute("stroke-width", "4");
                background.setAttribute("x", "0");
                background.setAttribute("y", "0");
                background.setAttribute("width", "196");
                background.setAttribute("height", "600");
                this.groundLine.appendChild(background);
                let groundLineSvg = this.createSvgElement("svg");
                groundLineSvg.setAttribute("x", "0");
                groundLineSvg.setAttribute("y", "0");
                groundLineSvg.setAttribute("width", "200");
                groundLineSvg.setAttribute("height", "600");
                groundLineSvg.setAttribute("viewBox", "0 0 200 600");
                this.groundLine.appendChild(groundLineSvg);
                const lines = [];
                for (let i = -5; i <= 25; i++) {
                    const y = -50 + i * 30;
                    const lineSegments = [];
                    lineSegments.push({ x: 0, y: y });
                    lineSegments.push({ x: 200, y: y - 130 });
                    lineSegments.push({ x: 200, y: y - 126 });
                    lineSegments.push({ x: 0, y: y + 4 });
                    lines.push(lineSegments.map((segment, i) => `${i == 0 ? "M" : "L"}${segment.x} ${segment.y}`), "Z");
                }
                const linesPath = this.createSvgElement("path", {
                    d: lines.join(" "),
                    fill: "white"
                });
                groundLineSvg.appendChild(linesPath);
            }

            this.bugsGroup = this.createSvgElement("g");
            graduationSvg.appendChild(this.bugsGroup);
            {
                const left = 1.5;
                const right = 20;
                const top = center - 20;
                const bottom = center + 20;
                this.selectedAltitudeBug = this.createSvgElement("polygon", {
                    points: `${left}, ${top} ${right}, ${top} ${right}, ${center - 15} 10, ${center} ${right}, ${center + 15} ${right}, ${bottom} ${left}, ${bottom}`,
                    class: "selected-altitude-bug"
                });
                this.bugsGroup.appendChild(this.selectedAltitudeBug);
                this.minimumAltitudeBug = this.createSvgElement("polyline", {
                    points: "20,260 20,273 0,300 20,327 20,340",
                    stroke: "#36c8d2",
                    fill: "none",
                    display: "none",
                    "stroke-width": 5,
                });
                this.bugsGroup.appendChild(this.minimumAltitudeBug);
            }

            this.trendElement = this.createSvgElement("rect", { x: 1.5, y: 0, width: 8, height: 0, class: "trend-line" });
            graduationSvg.appendChild(this.trendElement);

            const smallStartX = Altimeter.ALTIMETER_WIDTH - 60;
            const startY = center - 30;
            const endY = center + 30;
            const smallStartY = center - 60;
            const smallEndY = center + 60;
            const right = Altimeter.ALTIMETER_WIDTH - 2;
            const cursor = this.createSvgElement("path", {
                d: `M2 ${center} L20 ${center - 20} L20 ${startY} L${smallStartX} ${startY} L${smallStartX} ${smallStartY} L${right} ${smallStartY} L${right} ${smallEndY} L${smallStartX} ${smallEndY} L${smallStartX} ${endY} L20 ${endY} L20 ${center + 20} Z`,
                class: "cursor-background"
            });
            graduationSvg.appendChild(cursor);
            const margin = 5;
            const cursorBaseSvg = this.createSvgElement("svg", { x: 20 + margin, y: center - 30 + margin, width: Altimeter.ALTIMETER_WIDTH - 20 - margin, height: 60 - margin * 2, viewBox: `5 5 ${Altimeter.ALTIMETER_WIDTH - 20 - margin * 2} 50` });
            graduationSvg.appendChild(cursorBaseSvg);
            this.digit1Top = this.createSvgElement("text", { x: 13, y: -6, class: "rotating-digit-thousands" });
            this.digit1Top.textContent = "X";
            cursorBaseSvg.appendChild(this.digit1Top);
            this.digit1Bot = this.createSvgElement("text", { x: 13, y: 49, class: "rotating-digit-thousands" });
            this.digit1Bot.textContent = "X";
            cursorBaseSvg.appendChild(this.digit1Bot);
            this.digit2Top = this.createSvgElement("text", { x: 40, y: -6, class: "rotating-digit-thousands" });
            this.digit2Top.textContent = "X";
            cursorBaseSvg.appendChild(this.digit2Top);
            this.digit2Bot = this.createSvgElement("text", { x: 40, y: 49, class: "rotating-digit-thousands" });
            this.digit2Bot.textContent = "X";
            cursorBaseSvg.appendChild(this.digit2Bot);
            this.digit3Top = this.createSvgElement("text", { x: 70, y: -6, class: "rotating-digit" });
            this.digit3Top.textContent = "X";
            cursorBaseSvg.appendChild(this.digit3Top);
            this.digit3Bot = this.createSvgElement("text", { x: 70, y: 49, class: "rotating-digit" });
            this.digit3Bot.textContent = "X";
            cursorBaseSvg.appendChild(this.digit3Bot);
            graduationSvg.appendChild(this.createRotatingSvg(center));
        }
        this.root.appendChild(this.createBarometricPressure());

    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue)
            return;
        switch (name) {
            case "altitude":
                let value = parseFloat(newValue);
                this.altitude = value;
                /*let center = Math.round(value / Altimeter.GRADUATION_SCALE) * 100;
                this.graduationGroup.setAttribute("transform", "translate(0, " + ((value - center) * Altimeter.GRADUATION_SCALE / 100) + ")");
                this.bugsGroup.setAttribute("transform", "translate(0, " + ((value - center) * Altimeter.GRADUATION_SCALE / 100) + ")");
                this.selectedAltitudeBug.setAttribute("transform", "translate(0, " + (center - this.selectedAltitude) * Altimeter.GRADUATION_SCALE / 100 + ")");
                if (!isNaN(this.minimumAltitude)) {
                    this.minimumAltitudeBug.setAttribute("transform", "translate(0, " + (center - this.minimumAltitude) * Altimeter.GRADUATION_SCALE / 100 + ")");
                }
                if (this.currentCenterGrad != center) {
                    this.currentCenterGrad = center;
                    for (let i = 0; i < this.graduationTexts.length; i++) {
                        this.graduationTexts[i].textContent = Math.floor((((3 - i) * 100) + center) / 100);
                    }
                }*/
                /*let endValue = value % 100;
                let endCenter = Math.round(endValue / 10) * 10;
                this.endDigitsGroup.setAttribute("transform", "translate(0, " + ((endValue - endCenter) * 45 / 10) + ")");
                for (let i = 0; i < this.endDigits.length; i++) {
                    let digitValue = Math.round((((2 - i) * 10) + value) % 100 / 10) * 10;
                    this.endDigits[i].textContent = fastToFixed(Math.abs((digitValue % 100) / 10), 0) + "0";
                }*/
                /*if (Math.abs(value) >= 90) {
                    let d3Value = (Math.abs(value) % 1000) / 100;
                    this.digit3Bot.textContent = Math.abs(value) < 100 ? "" : fastToFixed(Math.floor(d3Value), 0);
                    this.digit3Top.textContent = fastToFixed((Math.floor(d3Value) + 1) % 10, 0);
                    if (endValue > 90 || endValue < -90) {
                        if (endValue < 0) {
                            this.digit3Bot.textContent = fastToFixed((Math.floor(d3Value) + 1) % 10, 0);
                            this.digit3Top.textContent = Math.abs(value) < 100 ? "" : fastToFixed(Math.floor(d3Value), 0);
                        }
                        let translate = (endValue > 0 ? (endValue - 90) : (endValue + 100)) * 5.7;
                        this.digit3Bot.setAttribute("transform", "translate(0, " + translate + ")");
                        this.digit3Top.setAttribute("transform", "translate(0, " + translate + ")");
                    }
                    else {
                        this.digit3Bot.setAttribute("transform", "");
                        this.digit3Top.setAttribute("transform", "");
                    }
                    if (Math.abs(value) >= 990) {
                        let d2Value = (Math.abs(value) % 10000) / 1000;
                        this.digit2Bot.textContent = Math.abs(value) < 1000 ? "" : fastToFixed(Math.floor(d2Value), 0);
                        this.digit2Top.textContent = fastToFixed((Math.floor(d2Value) + 1) % 10, 0);
                        if ((endValue > 90 || endValue < -90) && d3Value > 9) {
                            if (endValue < 0) {
                                this.digit2Bot.textContent = fastToFixed((Math.floor(d2Value) + 1) % 10, 0);
                                this.digit2Top.textContent = Math.abs(value) < 1000 ? "" : fastToFixed(Math.floor(d2Value), 0);
                            }
                            let translate = (endValue > 0 ? (endValue - 90) : (endValue + 100)) * 5.7;
                            this.digit2Bot.setAttribute("transform", "translate(0, " + translate + ")");
                            this.digit2Top.setAttribute("transform", "translate(0, " + translate + ")");
                        }
                        else {
                            this.digit2Bot.setAttribute("transform", "");
                            this.digit2Top.setAttribute("transform", "");
                        }
                        if (Math.abs(value) >= 9990) {
                            let d1Value = (Math.abs(value) % 100000) / 10000;
                            this.digit1Bot.textContent = Math.abs(value) < 10000 ? "" : fastToFixed(Math.floor(d1Value), 0);
                            this.digit1Top.textContent = fastToFixed((Math.floor(d1Value) + 1) % 10, 0);
                            if ((endValue > 90 || endValue < -90) && d3Value > 9 && d2Value > 9) {
                                if (endValue < 0) {
                                    this.digit1Bot.textContent = fastToFixed((Math.floor(d2Value) + 1) % 10, 0);
                                    this.digit1Top.textContent = Math.abs(value) < 10000 ? "" : fastToFixed(Math.floor(d2Value), 0);
                                }
                                let translate = (endValue > 0 ? (endValue - 90) : (endValue + 100)) * 5.7;
                                this.digit1Bot.setAttribute("transform", "translate(0, " + translate + ")");
                                this.digit1Top.setAttribute("transform", "translate(0, " + translate + ")");
                            }
                            else {
                                this.digit1Bot.setAttribute("transform", "");
                                this.digit1Top.setAttribute("transform", "");
                            }
                        }
                        else {
                            this.digit1Bot.setAttribute("transform", "");
                            this.digit1Top.setAttribute("transform", "");
                            if (value < 0) {
                                this.digit1Bot.textContent = "-";
                            }
                            else {
                                this.digit1Bot.textContent = "";
                            }
                            this.digit1Top.textContent = "";
                        }
                    }
                    else {
                        this.digit2Bot.setAttribute("transform", "");
                        this.digit2Top.setAttribute("transform", "");
                        if (value < 0) {
                            this.digit2Bot.textContent = "-";
                        }
                        else {
                            this.digit2Bot.textContent = "";
                        }
                        this.digit1Bot.textContent = "";
                        this.digit1Top.textContent = "";
                        this.digit2Top.textContent = "";
                    }
                }
                else {
                    if (value < 0) {
                        this.digit3Bot.textContent = "-";
                    }
                    else {
                        this.digit3Bot.textContent = "";
                    }
                    this.digit2Bot.textContent = "";
                    this.digit1Bot.textContent = "";
                    this.digit2Top.textContent = "";
                    this.digit1Top.textContent = "";
                    this.digit3Bot.setAttribute("transform", "");
                    this.digit3Top.setAttribute("transform", "");
                }*/
                break;
            case "radar-altitude":
                this.groundLine.setAttribute("transform", "translate(0," + Math.min(300 + parseFloat(newValue) * Altimeter.GRADUATION_SCALE / 100, 700) + ")");
                break;
            case "reference-altitude":
                this.selectedAltText.textContent = Math.floor(newValue / 100);
                this.selectedAltTextSmall.textContent = (newValue % 100).toFixed(0).padStart(2, "0");
                if (newValue != "----") {
                    this.selectedAltitude = parseFloat(newValue);
                    this.selectedAltitudeBug.setAttribute("transform", "translate(0, " + (Math.round(this.altitude / 100) * 100 - this.selectedAltitude) * Altimeter.GRADUATION_SCALE / 100 + ")");
                    this.selectedAltitudeBug.setAttribute("display", "");
                }
                else {
                    this.selectedAltitudeBug.setAttribute("display", "none");
                }
                break;
            case "reference-vspeed":
                if (newValue !== "null") {
                    this.selectedVS = parseFloat(newValue);
                    if (this.compactVs) {
                        let value;
                        if (Math.abs(this.selectedVS) < 1000) {
                            value = this.selectedVS / 6.25;
                        }
                        else {
                            value = (this.selectedVS < 0 ? -160 : 160) + ((this.selectedVS - (this.selectedVS < 0 ? -1000 : 1000)) / 12.5);
                        }
                        value = -Math.max(Math.min(value, 240), -240);
                        this.selectedVSBug.setAttribute("transform", "translate(0, " + value + ")");
                    }
                    else {
                        this.selectedVSBug.setAttribute("transform", "translate(0, " + -Math.max(Math.min(this.selectedVS, 2500), -2500) / 10 + ")");
                        this.selectedVSText.textContent = newValue;
                    }
                    this.selectedVSBug.setAttribute("display", "");
                } else {
                    this.selectedVSBug.setAttribute("display", "none");
                    if (!this.compactVs) {
                        this.selectedVSText.textContent = "----";
                    }
                }
                break;
            case "vspeed":
                let vSpeed = parseFloat(newValue);
                if (this.compactVs) {
                    let value;
                    if (Math.abs(vSpeed) < 1000) {
                        value = vSpeed / 6.25;
                    }
                    else {
                        value = (vSpeed < 0 ? -160 : 160) + ((vSpeed - (vSpeed < 0 ? -1000 : 1000)) / 12.5);
                    }
                    value = -Math.max(Math.min(value, 240), -240);
                    this.indicator.setAttribute("transform", `translate(0, ${value})`);
                }
                else {
                    this.indicator.setAttribute("transform", `translate(0, ${-Math.max(Math.min(vSpeed, 2500), -2500) / 10})`);
                    this.indicatorText.textContent = Math.abs(vSpeed) >= 100 ? fastToFixed(Math.round(vSpeed / 50) * 50, 0) : "";
                }
                break;
            case "vertical-deviation-mode":
                switch (newValue) {
                    case "VDI":
                        this.currentMode = 1;
                        this.verticalDeviationText.textContent = "V";
                        this.verticalDeviationText.setAttribute("fill", "#d12bc7");
                        this.diamondBug.setAttribute("visibility", "hidden");
                        this.chevronBug.setAttribute("visibility", "inherit");
                        this.hollowDiamondBug.setAttribute("visibility", "hidden");
                        this.verticalDeviationGroup.setAttribute("visibility", "inherit");
                        break;
                    case "GS":
                        this.currentMode = 2;
                        this.verticalDeviationText.textContent = "G";
                        this.verticalDeviationText.setAttribute("fill", "#10c210");
                        this.diamondBug.setAttribute("visibility", "inherit");
                        this.diamondBug.setAttribute("fill", "#10c210");
                        this.chevronBug.setAttribute("visibility", "hidden");
                        this.hollowDiamondBug.setAttribute("visibility", "hidden");
                        this.verticalDeviationGroup.setAttribute("visibility", "inherit");
                        break;
                    case "GSPreview":
                        this.currentMode = 4;
                        this.verticalDeviationText.textContent = "G";
                        this.verticalDeviationText.setAttribute("fill", "#DFDFDF");
                        this.diamondBug.setAttribute("visibility", "hidden");
                        this.chevronBug.setAttribute("visibility", "hidden");
                        this.hollowDiamondBug.setAttribute("visibility", "inherit");
                        this.verticalDeviationGroup.setAttribute("visibility", "inherit");
                        break;
                    case "GP":
                        this.currentMode = 3;
                        this.verticalDeviationText.textContent = "G";
                        this.verticalDeviationText.setAttribute("fill", "#d12bc7");
                        this.diamondBug.setAttribute("visibility", "inherit");
                        this.diamondBug.setAttribute("fill", "#d12bc7");
                        this.chevronBug.setAttribute("visibility", "hidden");
                        this.hollowDiamondBug.setAttribute("visibility", "hidden");
                        this.verticalDeviationGroup.setAttribute("visibility", "inherit");
                        break;
                    default:
                        this.currentMode = 0;
                        this.verticalDeviationGroup.setAttribute("visibility", "hidden");
                        break;
                }
                break;
            case "vertical-deviation-value":
                let pos = (Math.min(Math.max(parseFloat(newValue), -1), 1) * 200);
                this.chevronBug.setAttribute("transform", "translate(0," + pos + ")");
                this.diamondBug.setAttribute("transform", "translate(0," + pos + ")");
                this.hollowDiamondBug.setAttribute("transform", "translate(0," + pos + ")");
                break;
            case "selected-altitude-alert":
                this.selectedAltitudeGroup.setAttribute("alert", newValue);
        }
    }
}
Altimeter.ALTIMETER_WIDTH = 175;
Altimeter.ALTIMETER_HEIGHT = 600;
Altimeter.GRADUATION_SCALE = 100;
customElements.define('glasscockpit-altimeter', Altimeter);
//# sourceMappingURL=Altimeter.js.map