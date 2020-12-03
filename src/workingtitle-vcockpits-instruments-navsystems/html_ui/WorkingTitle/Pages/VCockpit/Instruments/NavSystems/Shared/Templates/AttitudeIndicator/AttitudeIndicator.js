class Attitude_Indicator_Model {
    /**
     * @param {WT_Synthetic_Vision} syntheticVision 
     * @param {WT_Nearest_Waypoints_Repository} nearestWaypointsRepository
     * @param {WT_Plane_State} planeState
     * @param {WT_Auto_Pilot} autoPilot
     * @param {rxjs.Observable} update$
     */
    constructor(syntheticVision, nearestWaypointsRepository, planeState, autoPilot, update$) {
        this.update$ = update$;

        this.syntheticVision = syntheticVision;
        this.nearestWaypointsRepository = nearestWaypointsRepository;

        this.pitchBank = planeState.orientation.pipe(
            rxjs.operators.map(orientation => ({
                pitch: orientation.pitch / Math.PI * 180,
                bank: orientation.bank / Math.PI * 180
            }))
        )
        this.heading = planeState.heading;
        this.flightDirector = autoPilot.flightDirector;
        this.turnCoordinator = planeState.turnCoordinator;

        this.airportSigns = rxjs.combineLatest(planeState.coordinates, planeState.heading, this.nearestWaypointsRepository.airports).pipe(
            rxjs.operators.sample(update$),
            rxjs.operators.map(([planeCoordinates, heading, airports]) => {
                return airports
                    .map(airport => ({
                        projectedPosition: this.projectLatLongAlt(airport.coordinates, planeCoordinates, heading),
                        name: airport.ident
                    }))
                    .filter(airport => airport.projectedPosition.x > -1.1 && airport.projectedPosition.x < 1.1 &&
                        airport.projectedPosition.y > -1.1 && airport.projectedPosition.y < 1.1 &&
                        airport.projectedPosition.z > 0)
                    .slice(0, 5)
            })
        );

        this.flightPathMarker = {
            show: rxjs.combineLatest(
                planeState.groundSpeed.pipe(
                    rxjs.operators.map(speed => speed > 30)
                ),
                syntheticVision.enabled,
                (a, b) => a && b
            ).pipe(
                rxjs.operators.distinctUntilChanged(),
                rxjs.operators.shareReplay(1)
            ),

            position: rxjs.combineLatest(planeState.groundSpeed, planeState.verticalSpeed, planeState.track, planeState.heading).pipe(
                rxjs.operators.sample(update$),
                rxjs.operators.map(([groundSpeed, verticalSpeed, track, heading]) => {
                    return this.getFlightPathMarkerPosition(groundSpeed * 1.68781 * 60, verticalSpeed, track, heading);
                }),
                rxjs.operators.scan((smoothed, position) => {
                    if (isNaN(position.x) || isNaN(position.y))
                        return smoothed;
                    smoothed.x = smoothed.x + (position.x - smoothed.x) / 5;
                    smoothed.y = smoothed.y + (position.y - smoothed.y) / 5;
                    return smoothed;
                }, { x: 0, y: 0 })
            )
        }
    }
    getDeltaAngle(a, b) {
        let c = a - b;
        c = (c + 180) % 360 - 180;
        return c * Math.PI / 180;
    }
    project(x, y, z) {
        const screenWidth = 1;
        const screenHeight = screenWidth;// * 3 / 4;
        const fov = (55 / 2) * Math.PI / 180.0;
        const focalLength = 1 / Math.tan(fov);
        return {
            x: (x * (focalLength / z)) * screenWidth,
            y: (y * (focalLength / z)) * screenHeight,
            z: z
        };
    }
    /**
     * Relative yaw/pitch to plane, both in radians
     * @param {number} yaw 
     * @param {number} pitch 
     */
    projectYawPitch(yaw, pitch) {
        const cos = Math.cos, sin = Math.sin;
        let vec = { x: 0, y: 0, z: 1 };

        // transformed with pitch then yaw, this can be condensed but it's easier to understand 
        // and modify when split up like this
        vec = {
            x: vec.x,
            y: vec.y * cos(pitch) - vec.z * sin(pitch),
            z: vec.y * sin(pitch) + vec.z * cos(pitch),
        };

        vec = {
            x: vec.x * cos(yaw) + vec.z * sin(yaw),
            y: vec.y,
            z: vec.x * -sin(yaw) + vec.z * cos(yaw),
        };

        return this.project(vec.x, vec.y, vec.z);
    }
    getFlightPathMarkerPosition(groundSpeed, verticalSpeed, track, heading) {
        const pitch = Math.atan(verticalSpeed / groundSpeed);
        const yaw = this.getDeltaAngle(track, heading);
        return this.projectYawPitch(yaw, pitch);
    }
    projectLatLongAlt(latLongAlt, planeCoordinates, heading) {
        const directionToPos = Avionics.Utils.computeGreatCircleHeading(planeCoordinates, latLongAlt);
        const yaw = this.getDeltaAngle(directionToPos, heading);

        const deltaPos = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, latLongAlt) * 6076;
        const deltaAlt = Math.abs(latLongAlt.alt - planeCoordinates.alt);
        const pitch = -Math.tan(deltaAlt / deltaPos);

        return this.projectYawPitch(yaw, pitch);
    }
}

class AttitudeIndicator extends HTMLElement {
    constructor() {
        super();
        this.bankSizeRatio = -24;
        this.backgroundVisible = true;
        this.aspectRatio = 1.0;
        this.isBackup = false;
        this.horizonTopColor = "#004cff";
        this.horizonTopColorHorizon = "#4664e7";
        this.horizonBottomColor = "#54350a";
        this.strokeWidth = 3;
        this.subscriptions = new Subscriptions();
    }
    static get observedAttributes() {
        return [
            "bank_size_ratio",
            "aspect-ratio",
            "is-backup",
        ];
    }
    connectedCallback() {
        this.construct();
    }
    /**
     * @param {Attitude_Indicator_Model} model 
     */
    setModel(model) {
        const screenSize = 1000 / 2;

        this.model = model;
        model.syntheticVision.enabled.subscribe(enabled => {
            this.horizonBottom.style.display = enabled ? "none" : "block";
            this.horizonTop.style.display = enabled ? "none" : "block";
            this.horizonTopGradient.style.display = enabled ? "none" : "block";
        });

        // Airport Signs
        rxjs.combineLatest(model.syntheticVision.enabled, model.syntheticVision.airportSigns, (signs, enabled) => enabled && signs).pipe(
            rxjs.operators.tap(enabled => this.airportSignsGroup.style.display = enabled ? "block" : "none"),
            rxjs.operators.switchMap(enabled => enabled ? model.airportSigns : rxjs.empty())
        ).subscribe(airportSigns => {
            let i = 4;
            for (let airportSign of airportSigns) {
                const sign = this.airportSigns[i];
                sign.style.display = airportSign.projectedPosition.z > 0 ? "block" : "none";
                if (airportSign.projectedPosition.z > 0) {
                    sign.setAttribute("transform", `translate(${airportSign.projectedPosition.x * screenSize}, ${airportSign.projectedPosition.y * screenSize})`);
                    Avionics.Utils.diffAndSet(sign.querySelector("text"), airportSign.name);
                    i--;
                }
            }
            for (; i >= 0; i--) {
                const sign = this.airportSigns[i];
                sign.style.display = "none";
            }
        });


        // Flight Path Marker
        model.flightPathMarker.show.pipe(
            rxjs.operators.tap(show => this.flightPathMarker.style.display = show ? "block" : "none"),
            rxjs.operators.switchMap(show => {
                if (show) {
                    return model.flightPathMarker.position.pipe(
                        rxjs.operators.map(position => ({ x: Math.floor(position.x * screenSize), y: Math.floor(position.y * screenSize) })),
                        rxjs.operators.distinctUntilChanged((a, b) => a.x == b.x && a.y == b.y)
                    )
                } else {
                    return rxjs.of({ x: 0, y: 0 })
                }
            })
        ).subscribe(position => {
            this.flightPathMarker.setAttribute("transform", `translate(${position.x}, ${position.y})`);
        });

        // Pitch / Bank
        const pitch$ = model.pitchBank.pipe(
            rxjs.operators.map(pitchBank => pitchBank.pitch),
            rxjs.operators.shareReplay(1)
        );
        const bank$ = model.pitchBank.pipe(
            rxjs.operators.map(pitchBank => pitchBank.bank),
            WT_RX.distinctMap(v => Math.floor(v * 10) / 10),
            rxjs.operators.shareReplay(1)
        );

        // Attitude ladder
        pitch$.pipe(
            rxjs.operators.map(pitch => Math.floor(pitch / 10) * 10),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(quantizedAngle => {
            this.angleGroup.setAttribute("transform", `translate(0,${-quantizedAngle * this.bankSizeRatio})`);
            for (const angleTextElement of this.angleTextElements) {
                let angle = -(quantizedAngle + angleTextElement.position * 10);
                angle = angle == 0 ? "" : angle;
                angleTextElement.left.textContent = angle;
                angleTextElement.right.textContent = angle;
            }
        });

        // Background
        rxjs.combineLatest(
            rxjs.combineLatest(pitch$, model.syntheticVision.enabled).pipe(
                rxjs.operators.map(([pitch, syntheticVision]) => {
                    if (syntheticVision) {
                        const projectedPitch = this.model.projectYawPitch(0, pitch * Math.PI / 180);
                        return projectedPitch.y * 500; // 500 = half screen height
                    } else {
                        return pitch * this.bankSizeRatio;
                    }
                }),
                rxjs.operators.map(v => Math.floor(v * 2) / 2),
                rxjs.operators.distinctUntilChanged(),
                rxjs.operators.map(pitch => `translate(0,${pitch})`),
            ),
            bank$.pipe(rxjs.operators.map(bank => `rotate(${bank}, 0, 0)`))
        ).pipe(
            rxjs.operators.sample(model.update$),
            rxjs.operators.map(([translate, rotate]) => `${rotate} ${translate}`)
        ).subscribe(transform => {
            this.bottomPart.setAttribute("transform", transform);
            this.attitudePitch.setAttribute("transform", transform);
        });
        bank$.subscribe(bank => {
            this.attitudeBank.setAttribute("transform", `rotate(${bank}, 0, 0)`);
        });

        // Flight Director
        const flightDirectorPitchBank$ = rxjs.combineLatest(
            model.flightDirector.pitch.pipe(
                rxjs.operators.combineLatest(model.pitchBank),
                rxjs.operators.map(([pitch, pitchBank]) => pitchBank.pitch - pitch),
                rxjs.operators.map(pitch => Math.round(pitch * 10) / 10 * this.bankSizeRatio),
                rxjs.operators.distinctUntilChanged(),
                rxjs.operators.map(pitch => `translate(0 ${pitch})`)
            ),
            model.flightDirector.bank.pipe(
                rxjs.operators.combineLatest(model.pitchBank),
                rxjs.operators.map(([bank, pitchBank]) => pitchBank.bank - bank),
                rxjs.operators.map(bank => Math.round(bank * 10) / 10),
                rxjs.operators.distinctUntilChanged(),
                rxjs.operators.map(bank => `rotate(${bank})`)
            )
        );
        model.flightDirector.enabled.pipe(
            rxjs.operators.tap(show => this.flightDirector.style.display = show ? "block" : "none"),
            rxjs.operators.switchMap(show => show ? flightDirectorPitchBank$ : rxjs.of(["", ""]))
        ).subscribe(([rotate, translate]) => {
            this.flightDirector.setAttribute("transform", `${rotate} ${translate}`);
        });

        // Slip Skid
        model.turnCoordinator.pipe(
            rxjs.operators.map(value => Math.round(value * 40)),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(value => this.slipSkid.setAttribute("transform", `translate(${value}, 0)`));

        // Horizon Headings
        const horizonHeadingsEnabled$ = rxjs.combineLatest(model.syntheticVision.enabled, model.syntheticVision.horizonHeadings, (horizonHeadings, enabled) => enabled && horizonHeadings).pipe(
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.shareReplay(1)
        );

        horizonHeadingsEnabled$.subscribe(enabled => this.horizonHeadingsGroup.style.display = enabled ? "block" : "none");

        const quantizedHorizonHeading$ = horizonHeadingsEnabled$.pipe(
            rxjs.operators.switchMap(enabled => enabled ? model.heading : rxjs.of(0)),
            rxjs.operators.map(heading => [heading, Math.floor(heading / 30) * 30]),
            rxjs.operators.shareReplay(1),
        )

        quantizedHorizonHeading$.pipe(
            rxjs.operators.map(([heading, quantizedHeading]) => quantizedHeading),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(quantizedHeading => {
            for (let i = 0; i < this.horizonHeadings.length; i++) {
                const j = i - 1;
                const text = quantizedHeading + j * 30;
                this.horizonHeadings[i].querySelector("text").textContent = text == 0 ? 360 : text;
            }
        });
        quantizedHorizonHeading$.subscribe(([heading, quantizedHeading]) => {
            const delta = quantizedHeading - heading;
            for (let i = 0; i < this.horizonHeadings.length; i++) {
                const j = i - 1;
                const projected = model.projectYawPitch((j * 30 + delta) * Math.PI / 180, 0);
                this.horizonHeadings[i].setAttribute("transform", `translate(${projected.x * screenSize}, 0)`);
            }
        });

        // Synthetic Vision
        model.syntheticVision.enabled.subscribe(enabled => {
            this.lastQuantizedAngle = null;
            this.setAttribute("bank_size_ratio", enabled ? "-17" : "-6");
        });
    }
    createSvgElement(tagName, attributes = []) {
        return DOMUtilities.createElementNS(Avionics.SVG.NS, tagName, attributes);
    }
    getRectSegments(x, y, w, h) {
        let i = 0;
        return [
            [x, y],
            [x + w, y],
            [x + w, y + h],
            [x, y + h]
        ].map(point => `${(i++ == 0) ? "M" : "L"}${point[0]} ${point[1]}`);
    }
    buildGraduations() {
        if (!this.attitudePitch)
            return;
        this.attitudePitch.innerHTML = "";
        let maxDash = 80;
        let fullPrecisionLowerLimit = -20;
        let fullPrecisionUpperLimit = 20;
        let halfPrecisionLowerLimit = -30;
        let halfPrecisionUpperLimit = 45;
        let unusualAttitudeLowerLimit = -30;
        let unusualAttitudeUpperLimit = 50;
        let bigWidth = 100;
        let bigHeight = 3;
        let mediumWidth = 40;
        let mediumHeight = 3;
        let smallWidth = 20;
        let smallHeight = 2;
        let fontSize = 20;
        let angle = -maxDash;
        let nextAngle;
        let width;
        let height;
        let text;
        let centerSegments = [];
        let unusualAttitudeSegments = [];
        while (angle <= maxDash) {
            if (angle % 10 == 0) {
                width = bigWidth;
                height = bigHeight;
                text = true;
                if (angle >= fullPrecisionLowerLimit && angle < fullPrecisionUpperLimit) {
                    nextAngle = angle + 2.5;
                } else if (angle >= halfPrecisionLowerLimit && angle < halfPrecisionUpperLimit) {
                    nextAngle = angle + 5;
                } else {
                    nextAngle = angle + 10;
                }
            } else {
                if (angle % 5 == 0) {
                    width = mediumWidth;
                    height = mediumHeight;
                    text = true;
                    if (angle >= fullPrecisionLowerLimit && angle < fullPrecisionUpperLimit) {
                        nextAngle = angle + 2.5;
                    } else {
                        nextAngle = angle + 5;
                    }
                } else {
                    width = smallWidth;
                    height = smallHeight;
                    nextAngle = angle + 2.5;
                    text = false;
                }
            }
            if (angle != 0) {
                centerSegments.push(...this.getRectSegments(-width / 2, this.bankSizeRatio * angle - height / 2, width, height), "Z");
                if (angle < unusualAttitudeLowerLimit) {
                    let path = "M" + -smallWidth / 2 + " " + (this.bankSizeRatio * nextAngle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                    path += "L" + bigWidth / 2 + " " + (this.bankSizeRatio * angle - bigHeight / 2) + " l" + -smallWidth + " 0 ";
                    path += "L0 " + (this.bankSizeRatio * nextAngle + 20) + " ";
                    path += "L" + (-bigWidth / 2 + smallWidth) + " " + (this.bankSizeRatio * angle - bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                    unusualAttitudeSegments.push(path);
                }
                if (angle >= unusualAttitudeUpperLimit && nextAngle <= maxDash) {
                    let path = "M" + -smallWidth / 2 + " " + (this.bankSizeRatio * angle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                    path += "L" + (bigWidth / 2) + " " + (this.bankSizeRatio * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 ";
                    path += "L0 " + (this.bankSizeRatio * angle - 20) + " ";
                    path += "L" + (-bigWidth / 2 + smallWidth) + " " + (this.bankSizeRatio * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                    unusualAttitudeSegments.push(path);
                }
            }
            angle = nextAngle;
        }

        this.attitudePitch.setAttribute("class", "attitude-pitch");

        let centerLines = this.createSvgElement("path");
        centerLines.setAttribute("d", centerSegments.join(" "));
        centerLines.setAttribute("fill", "white");
        this.attitudePitch.appendChild(centerLines);

        let unusualAttitudeChevrons = this.createSvgElement("path");
        unusualAttitudeChevrons.setAttribute("d", unusualAttitudeSegments.join(" "));
        unusualAttitudeChevrons.setAttribute("fill", "red");
        this.attitudePitch.appendChild(unusualAttitudeChevrons);

        let textElements = [];
        this.angleGroup = this.createSvgElement("g");
        this.angleGroup.setAttribute("fill", "white");
        for (let i = -2; i <= 3; i++) {
            let angle = i * 10;

            let left = this.createSvgElement("text", {
                x: ((-width / 2) - 5).toString(),
                y: (this.bankSizeRatio * angle - height / 2 + fontSize / 2).toString(),
                class: "graduation-text-left",
                "font-size": fontSize.toString(),
            });
            this.angleGroup.appendChild(left);

            let right = this.createSvgElement("text", {
                x: ((width / 2) + 5).toString(),
                y: (this.bankSizeRatio * angle - height / 2 + fontSize / 2).toString(),
                class: "graduation-text-right",
                "font-size": fontSize.toString(),
            });
            this.angleGroup.appendChild(right);

            textElements.push({ position: -i, left: left, right: right })
        }
        this.angleTextElements = textElements;
        this.attitudePitch.appendChild(this.angleGroup);
    }
    construct() {
        Utils.RemoveAllChildren(this);

        const centerX = 47;
        const centerY = 39;
        const width = 1000;
        const height = width * 3 / 4;
        const refHeight = (this.isBackup) ? 330 : 230;
        const viewBox = `${-width * (centerX / 100)} ${-height * (centerY / 100)} ${width} ${height}`;

        // Horizon
        this.horizon = this.createHorizon(viewBox);
        this.appendChild(this.horizon);

        // Root
        this.root = this.createSvgElement("svg", {
            width: "100%",
            height: "100%",
            viewBox: viewBox,
            overflow: "hidden",
            style: "position:absolute",
        });
        this.appendChild(this.root);

        const attitudePitchContainer = this.createSvgElement("svg", {
            width: "300",
            height: refHeight,
            x: "-150",
            y: "-130",
            viewBox: `-150 -130 300 ${refHeight}`,
            overflow: "hidden",
        });
        this.root.appendChild(attitudePitchContainer);

        // Graduations
        this.attitudePitch = this.createSvgElement("g");
        attitudePitchContainer.appendChild(this.attitudePitch);
        this.buildGraduations();

        // Flight Director
        this.flightDirector = this.createFlightDirector();
        attitudePitchContainer.appendChild(this.flightDirector);

        // Attitude Bank
        this.attitudeBank = this.createBankIndicator();
        this.root.appendChild(this.attitudeBank);

        this.root.appendChild(this.createBankTriangle());

        this.slipSkid = this.createSlipSkid();
        this.root.appendChild(this.slipSkid);

        this.root.appendChild(this.createCursors());
    }
    createHorizon(viewBox) {
        const horizon = this.createSvgElement("svg", {
            width: "100%",
            height: "100%",
            viewBox: viewBox,
            overflow: "hidden",
            style: "position:absolute; width: 100%; height:100%;",
        });
        const defs = this.createSvgElement("defs");
        defs.innerHTML = `
            <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:${this.horizonTopColor};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${this.horizonTopColorHorizon};stop-opacity:1" />
            </linearGradient>`;
        horizon.appendChild(defs);

        this.horizonTop = this.createSvgElement("rect", {
            fill: this.horizonTopColor,
            x: "-1000", y: "-1000", width: "2000", height: "2000",
        });
        this.horizonTopGradient = this.createSvgElement("rect", {
            fill: "url(#sky)",
            x: "-1000", y: "-200", width: "2000", height: "200",
        });
        this.horizonBottom = this.createSvgElement("rect", {
            fill: this.horizonBottomColor,
            x: "-1500", y: "0", width: "3000", height: "3000",
        });
        const separator = this.createSvgElement("rect", {
            x: "-1500", y: "-2", width: "3000", height: "4", class: "separator"
        });

        this.flightPathMarker = this.createFlightPathMarker();

        this.bottomPart = this.createSvgElement("g");
        this.bottomPart.appendChild(this.horizonTop);
        this.bottomPart.appendChild(this.horizonTopGradient);
        this.bottomPart.appendChild(this.horizonBottom);
        this.bottomPart.appendChild(separator);
        this.bottomPart.appendChild(this.flightPathMarker);
        this.bottomPart.appendChild(this.createHorizonHeadings());
        this.bottomPart.appendChild(this.createAirportSigns());

        horizon.appendChild(this.bottomPart);

        return horizon;
    }
    createBankIndicator() {
        const bigDashes = [-60, -30, 30, 60];
        const smallDashes = [-45, -20, -10, 10, 20, 45];
        const radius = 170;
        const arcStart = rotate2d(radius, 0, 150 * Math.PI / 180);
        const arcEnd = rotate2d(radius, 0, 30 * Math.PI / 180);

        function rotate2d(x, y, radians) {
            return [
                x * Math.cos(radians) + y * Math.sin(radians),
                -x * Math.sin(radians) + y * Math.cos(radians),
            ]
        }

        const g = this.createSvgElement("g");

        g.appendChild(this.createSvgElement("path", {
            d: "M0 -170 l-20 -30 l40 0 Z",
            class: "bank-triangle",
        }));

        let width = 4;
        let height = 30;
        const segments = [];
        for (let i = 0; i < bigDashes.length; i++) {
            const points = [];
            points.push(rotate2d(-width / 2, -radius - height, bigDashes[i] * Math.PI / 180.0));
            points.push(rotate2d(+width / 2, -radius - height, bigDashes[i] * Math.PI / 180.0));
            points.push(rotate2d(+width / 2, -radius, bigDashes[i] * Math.PI / 180.0));
            points.push(rotate2d(-width / 2, -radius, bigDashes[i] * Math.PI / 180.0));
            segments.push(...points.map((point, j) => {
                return `${(j == 0) ? "M" : "L"}${point[0]} ${point[1]}`;
            }), "Z");
        }
        width = 4;
        height = 20;
        for (let i = 0; i < smallDashes.length; i++) {
            const points = [];
            points.push(rotate2d(-width / 2, -radius - height, smallDashes[i] * Math.PI / 180.0));
            points.push(rotate2d(+width / 2, -radius - height, smallDashes[i] * Math.PI / 180.0));
            points.push(rotate2d(+width / 2, -radius, smallDashes[i] * Math.PI / 180.0));
            points.push(rotate2d(-width / 2, -radius, smallDashes[i] * Math.PI / 180.0));
            segments.push(...points.map((point, j) => {
                return `${(j == 0) ? "M" : "L"}${point[0]} ${point[1]}`;
            }), "Z");
        }

        g.appendChild(this.createSvgElement("path", {
            d: `M${arcStart[0]} ${arcStart[1]} A${radius} ${radius} 1 0 1 ${arcEnd[0]} ${arcEnd[1]}`,
            class: "bank-arc-outline",
        }));

        g.appendChild(this.createSvgElement("path", {
            d: segments.join(" "),
            class: "bank-indicator",
        }));

        g.appendChild(this.createSvgElement("path", {
            d: `M${arcStart[0]} ${arcStart[1]} A${radius} ${radius} 1 0 1 ${arcEnd[0]} ${arcEnd[1]}`,
            class: "bank-arc-fill",
        }));

        return g;
    }
    createBankTriangle() {
        return this.createSvgElement("path", {
            d: "M0 -170 l-13 20 l26 0 Z",
            class: "bank-triangle",
        });
    }
    createSlipSkid() {
        return this.createSvgElement("path", {
            d: "M-20 -140 L-16 -146 L16 -146 L20 -140 Z",
            class: "slip-skid",
        });
    }
    createFlightPathMarker() {
        const radius = 10;
        const barbThickness = 4;
        const barbLength = 10;
        const g = this.createSvgElement("g", { class: "flight-path-marker" });
        g.appendChild(this.createSvgElement("circle", { cx: 0, cy: 0, r: radius, class: "circle-outline" }));
        g.appendChild(this.createSvgElement("path", {
            class: "barbs",
            d: [
                ...this.getRectSegments(-radius - barbLength, -barbThickness / 2, barbLength, barbThickness), "Z",
                ...this.getRectSegments(-barbThickness / 2, -radius - barbLength, barbThickness, barbLength), "Z",
                ...this.getRectSegments(radius, -barbThickness / 2, barbLength, barbThickness), "Z",
            ].join(" ")
        }));
        g.appendChild(this.createSvgElement("circle", { cx: 0, cy: 0, r: radius, class: "circle-fill" }));
        return g;
    }
    createCursors() {
        const originOffsetX = 5;
        const triangleWidth = 110;
        const triangleWidthSmall = 50;
        const trianglePitch = 30;
        const g = this.createSvgElement("g", { class: "cursors" });

        // First lines are chevrons, second are the cursors
        g.appendChild(this.createSvgElement("path", {
            d: `
                M-190 0 l-10 12 l50 0 l10 -12 l-10 -12 l-50 0 l10 12 Z 
                M190 0 l10 12 l-50 0 l-10 -12 l10 -12 l50 0 l-10 12 Z
                M-${triangleWidth} ${trianglePitch} l${triangleWidthSmall} 0 L-${originOffsetX} 0 Z 
                M${triangleWidth} ${trianglePitch} l-${triangleWidthSmall} 0 L${originOffsetX} 0 Z
            `,
            class: "outline"
        }));
        g.appendChild(this.createSvgElement("path", {
            d: `
                M-190 0 l-10 12 l50 0 l10 -12 Z 
                M190 0 l10 12 l-50 0 l-10 -12 Z
                M-${triangleWidth} ${trianglePitch} l${triangleWidthSmall} 0 L-${originOffsetX} 0 Z 
                M${triangleWidth} ${trianglePitch} l-${triangleWidthSmall} 0 L${originOffsetX} 0 Z
            `,
            class: "fill-dark"
        }));
        g.appendChild(this.createSvgElement("path", {
            d: `
                M-190 0 l-10 -12 l50 0 l10 12 Z 
                M190 0 l10 -12 l-50 0 l-10 12 Z
                M-${triangleWidth - triangleWidthSmall / 2} ${trianglePitch} l${triangleWidthSmall / 2} 0 L-${originOffsetX} 0 Z 
                M${triangleWidth - triangleWidthSmall / 2} ${trianglePitch} l-${triangleWidthSmall / 2} 0 L${originOffsetX} 0 Z
            `,
            class: "fill"
        }));

        return g;
    }
    createFlightDirector() {
        const trianglePitch = 30;
        const originOffsetX = 5;
        const flightDirectorTriangle = 20;
        const flightDirectorTriangleHeight = flightDirectorTriangle / 2;
        const flightDirectorWidth = 110;
        const g = this.createSvgElement("g", { class: "flight-director" });

        g.appendChild(this.createSvgElement("path", {
            "d": `
                M-${flightDirectorWidth} ${trianglePitch} l-${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} L-${originOffsetX} 0 Z
                M${flightDirectorWidth} ${trianglePitch} l${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} L${originOffsetX} 0 Z
            `,
            class: "outline"
        }));
        g.appendChild(this.createSvgElement("path", {
            "d": `
                M-${flightDirectorWidth} ${trianglePitch} l-${flightDirectorTriangle} -${flightDirectorTriangleHeight} L-${originOffsetX} 0 Z
                M${flightDirectorWidth} ${trianglePitch} l${flightDirectorTriangle} -${flightDirectorTriangleHeight} L${originOffsetX} 0 Z
            `,
            class: "fill"
        }));
        g.appendChild(this.createSvgElement("path", {
            "d": `
                M-${flightDirectorWidth} ${trianglePitch} l-${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} Z
                M${flightDirectorWidth} ${trianglePitch} l${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} Z
            `,
            class: "fill-dark"
        }));

        return g;
    }
    createAirportSigns() {
        const g = this.createSvgElement("g");
        const signs = [];
        for (let i = 0; i < 5; i++) {
            const sign = this.createSvgElement("g");
            const background = this.createSvgElement("rect", {
                fill: "rgba(30,30,30,0.75)",
                stroke: "#fff",
                "stroke-width": 2,
                width: 50,
                height: 20,
                x: -25,
                y: -30 - 20
            });
            const text = this.createSvgElement("text", {
                fill: "#fff",
                "font-size": 15,
                x: 0,
                y: -30 - 5,
                "text-anchor": "middle"
            });
            sign.appendChild(this.createSvgElement("rect", {
                fill: "#fff",
                width: 2,
                height: 30,
                y: -30,
                x: -1
            }));
            sign.appendChild(background);
            sign.appendChild(text);
            g.appendChild(sign);
            signs.push(sign);
        }
        this.airportSigns = signs;
        this.airportSignsGroup = g;
        return g;
    }
    createHorizonHeadings() {
        const g = this.createSvgElement("g");
        const elements = [];
        for (let i = -1; i <= 1; i++) {
            const element = this.createSvgElement("g", { class: "horizon-heading" });
            const text = this.createSvgElement("text", { x: 0, y: -10 - 6 });
            element.appendChild(this.createSvgElement("rect", { width: 2, height: 10, y: -10, x: -1 }));
            element.appendChild(text);
            g.appendChild(element);
            elements.push(element);
        }
        this.horizonHeadings = elements;
        this.horizonHeadingsGroup = g;
        return g;
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue)
            return;
        switch (name) {
            case "is-backup":
                this.isBackup = newValue == "true";
                break;
            case "aspect-ratio":
                this.aspectRatio = parseFloat(newValue);
                this.construct();
                break;
            case "bank_size_ratio":
                this.bankSizeRatio = parseFloat(newValue);
                this.buildGraduations();
                break;
            default:
                return;
        }
    }
}
customElements.define('glasscockpit-attitude-indicator', AttitudeIndicator);
//# sourceMappingURL=AttitudeIndicator.js.map