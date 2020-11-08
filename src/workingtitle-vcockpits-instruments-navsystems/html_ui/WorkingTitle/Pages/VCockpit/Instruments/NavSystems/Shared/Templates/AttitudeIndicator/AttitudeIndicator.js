class Attitude_Indicator_Model {
    /**
     * @param {WT_Synthetic_Vision} syntheticVision 
     * @param {WT_Nearest_Waypoints_Repository} nearestWaypointsRepository
     */
    constructor(syntheticVision, nearestWaypointsRepository) {
        this.syntheticVision = syntheticVision;
        this.nearestWaypointsRepository = nearestWaypointsRepository;
        this.attributes = new Subject({});

        this.flightPathMarker = {
            show: new Subject(true),
            position: new Subject({ x: 0, y: 0 })
        }
        this.pitchBank = new Subject({ pitch: 0, bank: 0 });
        this.heading = new Subject(0);
        this.flightDirector = {
            pitchBank: new Subject({ pitch: 0, bank: 0 }),
            show: new Subject(false),
        };
        this.slipSkid = new Subject(0);
        this.airportSigns = new Subject([]);

        this.nearestAirports = [];
    }
    update(dt) {
        const xyz = Simplane.getOrientationAxis();
        if (xyz) {
            this.pitchBank.value = {
                pitch: xyz.pitch / Math.PI * 180,
                bank: xyz.bank / Math.PI * 180
            };

            this.flightDirector.show.value = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE", "Bool");
            this.flightDirector.pitchBank.value = {
                pitch: xyz.pitch / Math.PI * 180 - SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR PITCH", "degree"),
                bank: xyz.bank / Math.PI * 180 - SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR BANK", "degree")
            };

            this.slipSkid.value = Simplane.getInclinometer();

            this.flightPathMarker.show.value = Simplane.getGroundSpeed() > 30 && this.syntheticVision.enabled.value;
            const markerPos = this.getFlightPathMarkerPosition(
                Simplane.getGroundSpeed() * 1.68781 * 60, // Knots -> FPM
                Simplane.getVerticalSpeed(),
                SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degrees"),
                SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree")
            );
            if (!isNaN(markerPos.x) && !isNaN(markerPos.y)) {
                const current = this.flightPathMarker.position.value;
                this.flightPathMarker.position.value = {
                    x: (current.x + (markerPos.x - current.x) / 5),
                    y: (current.y + (markerPos.y - current.y) / 5),
                };
            }

            this.heading.value = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        }

        if (this.airportSigns.hasSubscribers()) {
            this.airportSigns.value = this.nearestAirports.map(airport => {
                return {
                    projectedPosition: this.projectLatLongAlt(airport.coordinates),
                    name: airport.ident
                }
            }).filter(airport => {
                return airport.projectedPosition.x > -1.1 && airport.projectedPosition.x < 1.1 &&
                    airport.projectedPosition.y > -1.1 && airport.projectedPosition.y < 1.1 &&
                    airport.projectedPosition.z > 0
            }).slice(0, 5);
            if (!this.nearestWaypointsSubscription) {
                this.nearestWaypointsSubscription = this.nearestWaypointsRepository.airports.subscribe(airports => this.updateNearestAirports(airports));
            };
        } else {
            if (this.nearestWaypointsSubscription) {
                this.nearestWaypointsSubscription = this.nearestWaypointsSubscription();
            }
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
        const fov = (57 / 2) * Math.PI / 180.0;
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
    projectLatLongAlt(latLongAlt) {
        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        const alt = SimVar.GetSimVarValue("INDICATED ALTITUDE:1", "feet");
        const planeCoordinates = new LatLongAlt(lat, long, alt);

        const heading = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        const directionToPos = Avionics.Utils.computeGreatCircleHeading(planeCoordinates, latLongAlt);
        const yaw = this.getDeltaAngle(directionToPos, heading);

        const deltaPos = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, latLongAlt) * 6076;
        const deltaAlt = Math.abs(latLongAlt.alt - planeCoordinates.alt);
        const pitch = -Math.tan(deltaAlt / deltaPos);

        return this.projectYawPitch(yaw, pitch);
    }
    updateNearestAirports(airports) {
        this.nearestAirports = airports;
    }
}

class AttitudeIndicator extends HTMLElement {
    constructor() {
        super();
        this.bankSizeRatio = -24;
        this.backgroundVisible = true;
        this.flightDirectorActive = false;
        this.flightDirectorPitch = 0;
        this.flightDirectorBank = 0;
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
            "actual-pitch",
            "ground-speed",
            "synthetic-vision",
            "track",
            "heading",
            "pitch",
            "bank",
            "slip_skid",
            "background",
            "flight_director-active",
            "flight_director-pitch",
            "flight_director-bank",
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
        const screenSize = 200 * 100.0 / 41.0;

        this.model = model;
        this.model.syntheticVision.enabled.subscribe(enabled => {
            this.horizonBottom.style.display = enabled ? "none" : "block";
            this.horizonTop.style.display = enabled ? "none" : "block";
            this.horizonTopGradient.style.display = enabled ? "none" : "block";
        });
        const signsEnabled = new CombinedSubject([this.model.syntheticVision.enabled, this.model.syntheticVision.airportSigns], (signs, enabled) => {
            return enabled && signs;
        });
        signsEnabled.subscribe(enabled => {
            this.airportSignsGroup.style.display = enabled ? "block" : "none";
            if (enabled) {
                this.signsSubscription = this.model.airportSigns.subscribe(airportSigns => {
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
            } else {
                if (this.signsSubscription) {
                    this.signsSubscription = this.signsSubscription();
                }
            }
        });
        this.model.flightPathMarker.show.subscribe(show => {
            this.flightPathMarker.style.display = show ? "block" : "none";
        });
        this.model.flightPathMarker.position.subscribe(position => {
            if (position) {
                this.flightPathMarker.setAttribute("transform", `translate(${position.x * screenSize}, ${position.y * screenSize})`);
            }
        });
        this.model.attributes.subscribe(attributes => {
            for (let key in attributes) {
                this.setAttribute(key, attributes[key]);
            }
        });
        this.model.pitchBank.subscribe(pitchBank => {
            const pitch = pitchBank.pitch;
            const bank = pitchBank.bank;

            // We quantize the angle to 5 degree increments and move the text group by that amount so we always see 5 sets of text at once
            // Then we update the text values to correspond to the correct angle
            const quantizedAngle = Math.floor(pitch / 10) * 10;
            if (quantizedAngle !== this.lastQuantizedAngle) {
                this.angleGroup.setAttribute("transform", `translate(0,${-quantizedAngle * this.bankSizeRatio})`);
                for (const angleTextElement of this.angleTextElements) {
                    let angle = -(quantizedAngle + angleTextElement.position * 10);
                    angle = angle == 0 ? "" : angle;
                    angleTextElement.left.textContent = angle;
                    angleTextElement.right.textContent = angle;
                }
                this.lastQuantizedAngle = quantizedAngle;
            }

            this.attitudeBank.setAttribute("transform", `rotate(${bank}, 0, 0)`);
            this.bottomPart.setAttribute("transform", `rotate(${bank}, 0, 0) translate(0,${pitch * this.bankSizeRatio})`);
            this.attitudePitch.setAttribute("transform", `rotate(${bank}, 0, 0) translate(0,${pitch * this.bankSizeRatio})`);
        });
        this.model.flightDirector.pitchBank.subscribe(pitchBank => {
            this.flightDirector.setAttribute("transform", `rotate(${pitchBank.bank}) translate(0 ${(pitchBank.pitch) * this.bankSizeRatio})`);
        });
        this.model.flightDirector.show.subscribe(show => this.flightDirector.style.display = show ? "block" : "none");
        this.model.slipSkid.subscribe(value => this.slipSkid.setAttribute("transform", `translate(${value * 40}, 0)`));

        this.model.heading.subscribe(heading => {
            const quantizedHeading = Math.floor(heading / 30) * 30;
            const delta = quantizedHeading - heading;
            for (let i = 0; i < this.horizonHeadings.length; i++) {
                const j = i - 1;
                const projected = this.model.projectYawPitch((j * 30 + delta) * Math.PI / 180, 0);
                const text = quantizedHeading + j * 30;
                this.horizonHeadings[i].querySelector("text").textContent = text == 0 ? 360 : text;
                this.horizonHeadings[i].setAttribute("transform", `translate(${projected.x * screenSize}, 0)`);
            }
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

        this.horizon = this.createHorizon()
        this.appendChild(this.horizon);

        const attitudeContainer = DOMUtilities.createElement("div");
        attitudeContainer.setAttribute("id", "Attitude");
        attitudeContainer.style.width = "100%";
        attitudeContainer.style.height = "100%";
        attitudeContainer.style.position = "absolute";
        this.appendChild(attitudeContainer);

        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "-200 -200 400 300");
        this.root.setAttribute("overflow", "visible");
        this.root.setAttribute("style", "position:absolute");
        attitudeContainer.appendChild(this.root);

        var refHeight = (this.isBackup) ? 330 : 230;

        const attitudePitchContainer = this.createSvgElement("svg", {
            width: "300",
            height: refHeight,
            x: "-150",
            y: "-130",
            viewBox: `-150 -130 300 ${refHeight}`,
            overflow: "hidden",
        });
        this.root.appendChild(attitudePitchContainer);

        this.attitudePitch = this.createSvgElement("g");
        attitudePitchContainer.appendChild(this.attitudePitch);

        this.buildGraduations();

        this.flightDirector = this.createFlightDirector();
        attitudePitchContainer.appendChild(this.flightDirector);

        this.attitudeBank = this.createBankIndicator();
        this.root.appendChild(this.attitudeBank);

        this.root.appendChild(this.createBankTriangle());

        this.slipSkid = this.createSlipSkid();
        this.root.appendChild(this.slipSkid);

        this.root.appendChild(this.createCursors());
        this.flightPathMarker = this.createFlightPathMarker();
        this.bottomPart.appendChild(this.flightPathMarker);

        this.bottomPart.appendChild(this.createHorizonHeadings());
        this.bottomPart.appendChild(this.createAirportSigns());
    }
    createHorizon() {
        const horizon = this.createSvgElement("svg", {
            width: "100%",
            height: "100%",
            viewBox: "-200 -200 400 300",
            x: "-100",
            y: "-100",
            overflow: "visible",
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

        this.bottomPart = this.createSvgElement("g");
        this.bottomPart.appendChild(this.horizonTop);
        this.bottomPart.appendChild(this.horizonTopGradient);
        this.bottomPart.appendChild(this.horizonBottom);
        this.bottomPart.appendChild(separator);
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

        // Left
        g.appendChild(this.createSvgElement("path", {
            "d": `M-${flightDirectorWidth} ${trianglePitch} l-${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} L-${originOffsetX} 0 Z`,
            class: "outline"
        }));
        g.appendChild(this.createSvgElement("path", {
            "d": `M-${flightDirectorWidth} ${trianglePitch} l-${flightDirectorTriangle} -${flightDirectorTriangleHeight} L-${originOffsetX} 0 Z`,
            class: "fill"
        }));
        g.appendChild(this.createSvgElement("path", {
            "d": `M-${flightDirectorWidth} ${trianglePitch} l-${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} Z`,
            class: "fill-dark"
        }));

        // Right
        g.appendChild(this.createSvgElement("path", {
            "d": `M${flightDirectorWidth} ${trianglePitch} l${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} L${originOffsetX} 0 Z`,
            class: "outline"
        }));
        g.appendChild(this.createSvgElement("path", {
            "d": `M${flightDirectorWidth} ${trianglePitch} l${flightDirectorTriangle} -${flightDirectorTriangleHeight} L${originOffsetX} 0 Z`,
            class: "fill"
        }));
        g.appendChild(this.createSvgElement("path", {
            "d": `M${flightDirectorWidth} ${trianglePitch} l${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} Z`,
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