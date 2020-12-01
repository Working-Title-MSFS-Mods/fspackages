class WT_Airspeed_Model {
    /**
     * @param {WT_Airspeed_References} airspeedReferences 
     * @param {WT_Unit_Chooser} unitChooser
     */
    constructor(airspeedReferences, unitChooser) {
        this.updateObservable = new rxjs.Subject();
        this.units = new rxjs.BehaviorSubject("nautical");
        this.planeReferenceSpeeds = new rxjs.Subject();

        this.airspeedReferences = airspeedReferences;
        this.unitChooser = unitChooser;

        this.lastIndicatedSpeed = -10000;
        this.lastTrueSpeed = -10000;
        this.acceleration = 0;
        this.lastSpeed = null;
        this.alwaysDisplaySpeed = false;

        const units$ = this.units.pipe(
            rxjs.operators.distinctUntilChanged()
        );

        const update$ = rxjs.combineLatest(
            units$,
            this.updateObservable,
            units => units
        )

        this.airspeed = update$.pipe(
            rxjs.operators.map(units => {
                switch (units) {
                    case "nautical":
                        return Simplane.getIndicatedSpeed()
                    case "metric":
                        return Simplane.getIndicatedSpeed() * 1.852
                }
            }),
            rxjs.operators.shareReplay(1)
        );

        this.airspeedUnits = units$.pipe(rxjs.operators.map(units => units == "nautical" ? "KTS" : "KPH"));

        this.trueAirspeed = update$.pipe(
            rxjs.operators.map(units => {
                switch (units) {
                    case "nautical":
                        return Simplane.getTrueSpeed()
                    case "metric":
                        return Simplane.getTrueSpeed() * 1.852
                }
            }),
            rxjs.operators.shareReplay(1)
        );

        this.trend = rxjs.combineLatest(
            this.updateObservable,
            this.airspeed.pipe(
                rxjs.operators.pairwise(),
                rxjs.operators.map(values => {
                    return values[1] - values[0]
                })
            ),
            (dt, instantAcceleration) => {
                return [instantAcceleration / dt, dt];
            }
        ).pipe(
            rxjs.operators.scan((acceleration, instant) => {
                return acceleration + (instant[0] - acceleration) * Math.min(1, 1 - Math.pow(0.5, instant[1]));
            }, 0)
        );

        const showReferenceSpeed$ = WT_RX.observeSimVar(update$, "AUTOPILOT FLIGHT LEVEL CHANGE", "Boolean");
        const referenceSpeedKnots$ = WT_RX.observeSimVar(update$, "AUTOPILOT AIRSPEED HOLD VAR", "knots");
        const referenceSpeedKph$ = WT_RX.observeSimVar(update$, "AUTOPILOT AIRSPEED HOLD VAR", "kilometers per hour");
        this.referenceSpeed = {
            show: showReferenceSpeed$,
            speed: update$.pipe(
                rxjs.operators.withLatestFrom(showReferenceSpeed$),
                rxjs.operators.filter(values => values[1]),
                rxjs.operators.switchMap(values => {
                    switch (values[0]) {
                        case "nautical":
                            return referenceSpeedKnots$
                        case "metric":
                            return referenceSpeedKph$
                    }
                })
            )
        }

        this.references = rxjs.combineLatest(
            airspeedReferences.references.observable,
            units$,
            (references, units) => references
                .filter(reference => reference.enabled)
                .map(reference => ({
                    id: reference.id,
                    speed: units == "nautical" ? reference.speed : reference.speed * 1.852
                }))
        );

        this.referenceSpeeds = rxjs.combineLatest(
            this.planeReferenceSpeeds,
            units$,
            (speeds, units) => {
                let result = {};
                for (let index in speeds) {
                    const value = speeds[index];
                    result[index] = units == "nautical" ? value : value * 1.852
                }
                return result;
            }
        )
    }
    updateCockpitSettings(cockpitSettings) {
        const speeds = {};
        if (cockpitSettings && cockpitSettings.AirSpeed.Initialized) {
            speeds["min-speed"] = cockpitSettings.AirSpeed.lowLimit;
            speeds["green-begin"] = cockpitSettings.AirSpeed.greenStart;
            speeds["green-end"] = cockpitSettings.AirSpeed.greenEnd;
            speeds["flaps-begin"] = cockpitSettings.AirSpeed.whiteStart;
            speeds["flaps-end"] = cockpitSettings.AirSpeed.whiteEnd;
            speeds["yellow-begin"] = cockpitSettings.AirSpeed.yellowStart;
            speeds["yellow-end"] = cockpitSettings.AirSpeed.yellowEnd;
            speeds["red-begin"] = cockpitSettings.AirSpeed.redStart;
            speeds["red-end"] = cockpitSettings.AirSpeed.redEnd;
            speeds["max-speed"] = cockpitSettings.AirSpeed.highLimit;
        } else {
            var designSpeeds = Simplane.getDesignSpeeds();
            speeds["green-begin"] = designSpeeds.VS1;
            speeds["green-end"] = designSpeeds.VNo;
            speeds["flaps-begin"] = designSpeeds.VS0;
            speeds["flaps-end"] = designSpeeds.VFe;
            speeds["yellow-begin"] = designSpeeds.VNo;
            speeds["yellow-end"] = designSpeeds.VNe;
            speeds["red-begin"] = designSpeeds.VNe;
            speeds["red-end"] = designSpeeds.VMax;
            speeds["max-speed"] = designSpeeds.VNe;
        }
        this.planeReferenceSpeeds.next(speeds);
    }
    update(dt) {
        dt /= 1000;

        this.updateObservable.next(dt);
        this.units.next(this.unitChooser.chooseSpeed("metric", "nautical"));

        //TODO:
        let crossSpeed = SimVar.GetGameVarValue("AIRCRAFT CROSSOVER SPEED", "Knots");
        let cruiseMach = SimVar.GetGameVarValue("AIRCRAFT CRUISE MACH", "mach");
        let crossSpeedFactor = Simplane.getCrossoverSpeedFactor(this.maxSpeed, cruiseMach);
        if (crossSpeed != 0) {
            //this.airspeedElement.setAttribute("max-speed", (Math.min(crossSpeedFactor, 1) * this.maxSpeed).toString()); // TODO:
        }
    }
    convertSpeed(speed) {
        return this.unitChooser.chooseSpeed(speed * 1.852, speed);
    }
}

class ReferenceBug {
}
class AirspeedIndicator extends HTMLElement {
    constructor() {
        super();
        this.trendValue = 0;
        this.redBegin = new rxjs.BehaviorSubject(0);
        this.redEnd = new rxjs.BehaviorSubject(0);
        this.greenBegin = new rxjs.BehaviorSubject(0);
        this.greenEnd = new rxjs.BehaviorSubject(0);
        this.flapsBegin = new rxjs.BehaviorSubject(0);
        this.flapsEnd = new rxjs.BehaviorSubject(0);
        this.yellowBegin = new rxjs.BehaviorSubject(0);
        this.yellowEnd = new rxjs.BehaviorSubject(0);
        this.minValue = new rxjs.BehaviorSubject(0);
        this.maxValue = new rxjs.BehaviorSubject(0);
        this.currentCenterGrad = -1000;
        this.referenceBugs = [];
        this.nocolor = false;
    }
    /**
     * @param {WT_Airspeed_Model} model 
     */
    setModel(model) {
        this.model = model;

        const airspeed$ = model.airspeed.pipe(
            rxjs.operators.map(speed => Math.max(20, speed)),
            rxjs.operators.shareReplay(1)
        );

        const center$ = airspeed$.pipe(
            rxjs.operators.map(airspeed => Math.max(Math.round(airspeed / 10) * 10, 60)),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.shareReplay(1)
        );

        rxjs.combineLatest(airspeed$, center$).pipe(
            rxjs.operators.map(([airspeed, center]) => airspeed - center),
            rxjs.operators.map(delta => Math.floor(delta * 10)),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(translate => {
            this.centerGroup.setAttribute("transform", `translate(0, ${translate})`);
        });

        const updateDigit = (top, bottom) => digits => {
            if (digits === null) {
                bottom.textContent = "-";
                top.textContent = "-";
            } else {
                bottom.textContent = digits[0];
                top.textContent = digits[1];
            }
        }

        const endValue$ = airspeed$.pipe(
            rxjs.operators.map(speed => speed % 10),
            rxjs.operators.shareReplay(1)
        );

        const airspeedAlive$ = airspeed$.pipe(
            rxjs.operators.map(airspeed => airspeed > 20),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.shareReplay(1)
        )

        // First digit
        const airspeedFirstValidDigit$ = airspeed$.pipe(
            rxjs.operators.map(airspeed => (Math.abs(airspeed) % 1000) / 100),
            rxjs.operators.map(Math.floor),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.map(digit => [digit > 0 ? digit : "", (digit + 1) % 10]),
            rxjs.operators.shareReplay(1)
        );

        const airspeedFirstInvalidDigit$ = rxjs.of(["", ""]);

        const airspeedFirstDigit$ = airspeed$.pipe(
            rxjs.operators.map(speed => speed >= 99),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.switchMap(above99 => above99 ? airspeedFirstValidDigit$ : airspeedFirstInvalidDigit$)
        );

        airspeedAlive$.pipe(
            rxjs.operators.switchMap(alive => alive ? airspeedFirstDigit$ : rxjs.of(null)),
        ).subscribe(updateDigit(this.digit1Top, this.digit1Bot));

        // Second digit
        const airspeedSecondDigit$ = airspeed$.pipe(
            rxjs.operators.map(airspeed => (Math.abs(airspeed) % 100) / 10),
            rxjs.operators.map(Math.floor),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.map(digit => [digit, (digit + 1) % 10]),
            rxjs.operators.shareReplay(1)
        );

        airspeedAlive$.pipe(
            rxjs.operators.switchMap(alive => alive ? airspeedSecondDigit$ : rxjs.of(null))
        ).subscribe(updateDigit(this.digit2Top, this.digit2Bot));

        airspeedAlive$.pipe(
            rxjs.operators.switchMap(alive => {
                if (alive) {
                    return endValue$.pipe(
                        rxjs.operators.map(endValue => {
                            if (endValue > 9)
                                return (endValue - 9) * 55
                            return 0;
                        }),
                        rxjs.operators.distinctUntilChanged()
                    )
                } else {
                    return rxjs.of(0)
                }
            })
        ).subscribe(translate => {
            this.digit2Bot.setAttribute("transform", `translate(0,${translate})`);
            this.digit2Top.setAttribute("transform", `translate(0,${translate})`);
        });

        rxjs.combineLatest(endValue$, airspeedSecondDigit$).pipe(
            rxjs.operators.map(([endValue, secondDigits]) => {
                if (endValue > 9 && secondDigits[0] >= 9)
                    return (endValue - 9) * 55;
                return 0;
            }),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(translate => {
            this.digit1Bot.setAttribute("transform", `translate(0, ${translate})`);
            this.digit1Top.setAttribute("transform", `translate(0, ${translate})`);
        });

        // End digits
        const endCenter$ = endValue$.pipe(
            rxjs.operators.map(Math.round),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.shareReplay(1)
        );

        rxjs.combineLatest(airspeedAlive$, endCenter$, endValue$).pipe(
            rxjs.operators.map(([airspeedAlive, endCenter, endValue]) => {
                if (airspeedAlive) {
                    return (endValue - endCenter) * 45;
                }
                return 0;
            }),
            rxjs.operators.map(Math.floor),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(translate => {
            this.endDigitsGroup.setAttribute("transform", `translate(0, ${translate})`);
        });

        airspeedAlive$.pipe(
            rxjs.operators.switchMap(alive => alive ? endCenter$ : rxjs.of(null))
        ).subscribe(endCenter => {
            for (let i = 0; i < this.endDigits.length; i++) {
                const digitValue = (2 - i + endCenter + 10) % 10;
                const emptyValue = i == 2 ? "-" : " ";
                this.endDigits[i].textContent = endCenter === null ? emptyValue : digitValue;
            }
        })

        // Reference bugs
        const referenceBugs$ = model.references.pipe(
            rxjs.operators.scan((elements, references) => {
                for (let i = 0; i < references.length; i++) {
                    if (i >= elements.length) {
                        const bug = new ReferenceBug();
                        bug.group = this.createSvgElement("g", { class: "reference-bug" });
                        this.centerSvg.appendChild(bug.group);
                        bug.bug = this.createSvgElement("polygon", { points: "0,300 10,315 50,315 50,285 10,285" });
                        bug.group.appendChild(bug.bug);
                        bug.text = this.createSvgElement("text", { x: 30, y: 310 });
                        bug.group.appendChild(bug.text);
                        elements.push(bug);
                    }
                    elements[i].value = references[i].speed;
                    elements[i].text.textContent = references[i].id;
                    elements[i].group.setAttribute("display", "");
                }
                for (let i = references.length; i < elements.length; i++) {
                    elements[i].group.setAttribute("display", "none");
                }
                return elements;
            }, [])
        );

        rxjs.combineLatest(
            referenceBugs$,
            airspeed$.pipe(WT_RX.distinctUntilSignificantChange(0.1))
        ).subscribe(([referenceBugs, airspeed]) => {
            for (let i = 0; i < referenceBugs.length; i++) {
                referenceBugs[i].group.setAttribute("transform", `translate(${AirspeedIndicator.WIDTH + 1.5},${(airspeed - referenceBugs[i].value) * 10})`);
            }
        });

        // Selected speed
        rxjs.combineLatest(airspeed$, model.referenceSpeed.speed, (airspeed, selectedSpeed) => (airspeed - selectedSpeed) * 10).pipe(
            rxjs.operators.map(Math.floor),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(translate => this.selectedSpeedBug.setAttribute("transform", `translate(${AirspeedIndicator.WIDTH},${translate})`));

        model.referenceSpeed.speed.pipe(
            rxjs.operators.map(Math.floor)
        ).subscribe(speed => this.selectedSpeedText.textContent = speed);

        model.referenceSpeed.show.subscribe(show => {
            this.airspeedReferenceGroup.setAttribute("display", show ? "" : "none");
            this.selectedSpeedBug.setAttribute("display", show ? "" : "none");
        });

        // True Air Speed
        model.trueAirspeed.pipe(
            rxjs.operators.map(speed => speed.toFixed(0)),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(tas => {
            this.tasText.textContent = tas;
        });

        // Graduations
        center$.subscribe(center => {
            for (let i = 0; i < this.gradTexts.length; i++) {
                this.gradTexts[i].textContent = fastToFixed((4 - i) * 10 + center, 0);
            }
        });

        // Lines
        const handleBar = (element, begin, end) => {
            const getValue = (value, center) => {
                return Math.min(Math.max(-100, 300 - 10 * (value - center)), 700);
            }
            rxjs.combineLatest(center$, begin, end)
                .subscribe(([center, begin, end]) => {
                    if (!this.nocolor) {
                        const beginValue = getValue(begin, center);
                        const endValue = getValue(end, center);
                        element.setAttribute("y", endValue);
                        element.setAttribute("height", beginValue - endValue);
                    }
                })
        }
        handleBar(this.bottomRedElement, rxjs.of(20), this.minValue);
        handleBar(this.greenElement, this.greenBegin, this.greenEnd);
        handleBar(this.yellowElement, this.yellowBegin, this.yellowEnd);
        handleBar(this.redElement, this.redBegin, this.redEnd);
        handleBar(this.flapsElement, this.flapsBegin, this.flapsEnd);

        // End speed line
        rxjs.combineLatest(center$, airspeed$, this.maxValue).pipe(
            rxjs.operators.map(([center, airspeed, maxSpeed]) => {
                if (maxSpeed) {
                    return ((Math.min(Math.max(center + 40 - maxSpeed, -10), 80) * 10) + (airspeed - center) * 10);
                }
                return 0;
            }),
            rxjs.operators.map(Math.floor),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(translate => this.endElement.setAttribute("transform", `translate(0,${translate})`))

        // Speed color
        const compareSpeeds = (airspeed, maxSpeed) => maxSpeed && airspeed > maxSpeed;
        const isAboveMaxSpeed$ = rxjs.combineLatest(airspeed$, this.maxValue, compareSpeeds).pipe(
            rxjs.operators.distinctUntilChanged(),
        );
        const isAboveYellowSpeed$ = rxjs.combineLatest(airspeed$, this.yellowBegin, compareSpeeds).pipe(
            rxjs.operators.distinctUntilChanged(),
        );
        const isAboveRedSpeed$ = rxjs.combineLatest(airspeed$, this.redBegin, compareSpeeds).pipe(
            rxjs.operators.distinctUntilChanged(),
        );
        rxjs.combineLatest(isAboveMaxSpeed$, isAboveYellowSpeed$, isAboveRedSpeed$).pipe(
            rxjs.operators.map(([max, yellow, red]) => {
                if (max) {
                    return "red";
                } else if (red) {
                    return "red";
                } else if (yellow) {
                    return "yellow";
                } else {
                    return "white";
                }
            })
        ).subscribe(color => this.setAttribute("speed", color));

        // Trend Line
        model.trend.pipe(
            rxjs.operators.map(trend => Math.min(Math.max(300 + parseFloat(trend) * 6 * -10, 0), 600)),
            rxjs.operators.map(Math.floor),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(trend => {
            this.trendElement.setAttribute("y", Math.min(trend, 300));
            this.trendElement.setAttribute("height", Math.abs(trend - 300));
        });

        // Reference Speeds
        model.referenceSpeeds.subscribe(speeds => {
            if (!speeds)
                return;
            if ("min-speed" in speeds)
                this.minValue.next(speeds["min-speed"]);
            if ("green-begin" in speeds)
                this.greenBegin.next(speeds["green-begin"]);
            if ("green-end" in speeds)
                this.greenEnd.next(speeds["green-end"]);
            if ("yellow-begin" in speeds)
                this.yellowBegin.next(speeds["yellow-begin"]);
            if ("yellow-end" in speeds)
                this.yellowEnd.next(speeds["yellow-end"]);
            if ("flaps-begin" in speeds)
                this.flapsBegin.next(speeds["flaps-begin"]);
            if ("flaps-end" in speeds)
                this.flapsEnd.next(speeds["flaps-end"]);
            if ("red-begin" in speeds)
                this.redBegin.next(speeds["red-begin"]);
            if ("red-end" in speeds)
                this.redEnd.next(speeds["red-end"]);
            if ("max-speed" in speeds)
                this.maxValue.next(speeds["max-speed"]);
        });

        model.airspeedUnits.subscribe(units => {
            this.tasUnits.textContent = units;
            this.currentCenterGrad = -1000;
        });
    }
    createSvgElement(tagName, attributes = []) {
        return DOMUtilities.createElementNS(Avionics.SVG.NS, tagName, attributes);
    }
    createBackground() {
        return this.createSvgElement("rect", { x: 0, y: 0, width: AirspeedIndicator.WIDTH, height: 600, class: "background" });
    }
    createAirspeedReference() {
        const g = this.createSvgElement("g", { class: "airspeed-reference" });
        g.appendChild(this.createSvgElement("rect", { x: 0, y: -50, width: AirspeedIndicator.WIDTH, height: 50 }));
        this.selectedSpeedFixedBug = this.createSvgElement("polygon", {
            points: "-10,-40 -20,-40 -20,-30 -15,-25 -20,-20 -20,-10 -10,-10 ",
            transform: `translate(${AirspeedIndicator.WIDTH}, 0)`,
        });
        g.appendChild(this.selectedSpeedFixedBug);
        this.selectedSpeedText = this.createSvgElement("text", { x: 20, y: -10 });
        this.selectedSpeedText.textContent = "---";
        g.appendChild(this.selectedSpeedText);
        return g;
    }
    connectedCallback() {
        const viewBox = "0 -52 250 704";
        this.root = this.createSvgElement("svg", { width: "100%", height: "100%", viewBox: viewBox, });
        this.overlayRoot = this.createSvgElement("svg", { width: "100%", height: "100%", viewBox: viewBox, });
        this.appendChild(this.root);
        this.appendChild(this.overlayRoot);

        this.airspeedReferenceGroup = this.createAirspeedReference();
        this.root.appendChild(this.airspeedReferenceGroup);

        this.root.appendChild(this.createBackground());

        this.centerSvg = this.createSvgElement("svg", { x: 0, y: 0, width: 250, height: 600, viewBox: "0 0 250 600", });
        this.overlayRoot.appendChild(this.centerSvg);
        {
            this.centerGroup = this.createSvgElement("g");
            this.centerSvg.appendChild(this.centerGroup);
            {
                this.gradTexts = [];
                if (this.getAttribute("NoColor") != "True") {
                    this.bottomRedElement = this.createSvgElement("rect", { x: AirspeedIndicator.WIDTH - 15, y: -1, width: 15 - 1.5, height: 0, class: "speed-red" });
                    this.centerGroup.appendChild(this.bottomRedElement);
                    this.redElement = this.createSvgElement("rect", { x: AirspeedIndicator.WIDTH - 15, y: -1, width: 15 - 1.5, height: 0, class: "speed-red" });
                    this.centerGroup.appendChild(this.redElement);
                    this.yellowElement = this.createSvgElement("rect", { x: AirspeedIndicator.WIDTH - 15, y: -1, width: 15 - 1.5, height: 0, class: "speed-yellow" });
                    this.centerGroup.appendChild(this.yellowElement);
                    this.greenElement = this.createSvgElement("rect", { x: AirspeedIndicator.WIDTH - 15, y: -1, width: 15 - 1.5, height: 0, class: "speed-green" });
                    this.centerGroup.appendChild(this.greenElement);
                    this.flapsElement = this.createSvgElement("rect", { x: AirspeedIndicator.WIDTH - 15, y: -1, width: 7, height: 0, class: "speed-white" });
                    this.centerGroup.appendChild(this.flapsElement);
                    const dashSvg = this.createSvgElement("svg", { id: "DASH", x: AirspeedIndicator.WIDTH - 15, y: 0, width: 15 - 1.5, height: 600, viewBox: "0 0 13.5 600" });
                    this.root.appendChild(dashSvg);
                    this.endElement = this.createSvgElement("g");
                    dashSvg.appendChild(this.endElement);
                    const endBg = this.createSvgElement("rect", { x: 0, y: -900, width: 20, height: 800, fill: "white" });
                    const lineElements = [];
                    this.endElement.appendChild(endBg);
                    for (let i = 0; i <= 32; i++) {
                        lineElements.push(`M0 ${-125 - 25 * i} l25 -7 l0 12.5 l-25 7Z`);
                    }
                    const redLine = this.createSvgElement("path", { d: lineElements.join(" "), fill: "red" });
                    this.endElement.appendChild(redLine);
                } else {
                    this.nocolor = true;
                }
                const graduationSegments = [];
                for (let i = -4; i <= 4; i++) {
                    graduationSegments.push(`M${AirspeedIndicator.WIDTH - 30} ${298 + 100 * i} l30 0 l0 4 l-30 0Z`);
                    if (i != 0) {
                        graduationSegments.push(`M${AirspeedIndicator.WIDTH - 15} ${298 + 100 * i + (i < 0 ? 50 : -50)} l15 0 l0 4 l-15 0Z`);
                    }
                    const gradText = this.createSvgElement("text", { x: AirspeedIndicator.WIDTH - 40, y: 312 + 100 * i, class: "graduation-text" });
                    this.gradTexts.push(gradText);
                    this.centerGroup.appendChild(gradText);
                }
                this.centerGroup.appendChild(this.createSvgElement("path", { d: graduationSegments.join(" "), class: "graduation" }));
                const center = 300;
                this.selectedSpeedBug = this.createSvgElement("polygon", {
                    points: `0, ${center - 20} -20, ${center - 20} -20, ${center - 15} -10, ${center} -20, ${center + 15} -20, ${center + 20} 0, ${center + 20}`,
                    class: "selected-speed-bug",
                });
                this.centerSvg.appendChild(this.selectedSpeedBug);
            }
            {
                const right = AirspeedIndicator.WIDTH - 1.5;
                this.cursor = this.createSvgElement("polygon", {
                    points: `${right},300 ${right - 20},280 ${right - 20},240 ${right - 60},240 ${right - 60},260 1.5,260 1.5,340 ${right - 60},340 ${right - 60},360 ${right - 20},360 ${right - 20},320 Z`,
                    class: "cursor-background",
                });
            }
            this.overlayRoot.appendChild(this.cursor);
            this.trendElement = this.createSvgElement("rect", { x: AirspeedIndicator.WIDTH, y: -1, width: 8, height: 0, class: "trend-line" });
            this.overlayRoot.appendChild(this.trendElement);

            const margin = 5;
            const baseCursorSvg = this.createSvgElement("svg", { x: margin, y: 260 + margin, width: 100 - margin, height: 80 - margin * 2, viewBox: "5 5 95 70", class: "cursor" });
            this.overlayRoot.appendChild(baseCursorSvg);

            this.digit1Top = this.createSvgElement("text", { x: AirspeedIndicator.WIDTH - 122, y: -1 });
            this.digit1Top.textContent = "-";
            this.digit1Bot = this.createSvgElement("text", { x: AirspeedIndicator.WIDTH - 122, y: 55 });
            this.digit1Bot.textContent = "-";
            baseCursorSvg.appendChild(this.digit1Top);
            baseCursorSvg.appendChild(this.digit1Bot);

            this.digit2Top = this.createSvgElement("text", { x: AirspeedIndicator.WIDTH - 92, y: -1 });
            this.digit2Top.textContent = "-";
            this.digit2Bot = this.createSvgElement("text", { x: AirspeedIndicator.WIDTH - 92, y: 55 });
            this.digit2Bot.textContent = "-";
            baseCursorSvg.appendChild(this.digit2Top);
            baseCursorSvg.appendChild(this.digit2Bot);

            const rotatingCursorSvg = this.createSvgElement("svg", { x: AirspeedIndicator.WIDTH - 60 + margin, y: 240 + margin, width: 50 - margin, height: 120 - margin * 2, viewBox: "5 -65 45 110", });
            this.overlayRoot.appendChild(rotatingCursorSvg);

            this.endDigitsGroup = this.createSvgElement("g", { class: "cursor" });
            rotatingCursorSvg.appendChild(this.endDigitsGroup);
            this.endDigits = [];
            for (let i = -2; i <= 2; i++) {
                let digit = this.createSvgElement("text", { x: 5, y: 15 + 45 * i });
                digit.textContent = i == 0 ? "-" : " ";
                this.endDigits.push(digit);
                this.endDigitsGroup.appendChild(digit);
            }

        }

        this.root.appendChild(this.createTasText());
    }
    createTasText() {
        this.tasBackground = this.createSvgElement("rect", { x: 0, y: 0, width: AirspeedIndicator.WIDTH, height: 50 });
        const label = this.createSvgElement("text", { x: 5, y: 38, class: "label" });
        label.textContent = "TAS";
        const units = this.createSvgElement("text", { x: AirspeedIndicator.WIDTH - 5, y: 38, class: "units" });
        units.textContent = "KT";
        this.tasUnits = units;
        this.tasText = this.createSvgElement("text", { x: AirspeedIndicator.WIDTH - 45, y: 38, class: "value" });
        this.tasText.textContent = "0";

        const g = this.createSvgElement("g", { transform: `translate(0, 600)`, class: "tas-text" });
        g.appendChild(this.tasBackground);
        g.appendChild(label);
        g.appendChild(this.tasText);
        g.appendChild(units);
        return g;
    }
}
AirspeedIndicator.WIDTH = 150;
customElements.define('glasscockpit-airspeed-indicator', AirspeedIndicator);
//# sourceMappingURL=AirspeedIndicator.js.map