Include.addScript("/Pages/VCockpit/Instruments/Shared/WorkingTitle/DataStore.js")

class HSI_Input_Layer extends Input_Layer {
    constructor(hsiModel) {
        super();
        this.cdiSource = hsiModel.cdi.sourceId;
        this.courseIncrement = 1;
        this.courseIncrementLastUpdate = 1;
        this.courseIncrementTimeout = null;
        this.courseIncrementDirection = true;
    }
    speedUp() {
        if (this.courseIncrementLastUpdate == null) {
            this.courseIncrementLastUpdate = performance.now();
        }
        const now = performance.now();
        const dt = (now - this.courseIncrementLastUpdate) / 1000;
        this.courseIncrementLastUpdate = now;
        this.courseIncrement = this.courseIncrement * 1.2;
        this.courseIncrement += (1 - this.courseIncrement) * dt;
        this.courseIncrement = Math.max(1, Math.min(10, this.courseIncrement));
        clearTimeout(this.courseIncrementTimeout);
        this.courseIncrementTimeout = setTimeout(() => this.courseIncrement = 1, 500);
    }
    incrementCourse(direction) {
        if (this.courseIncrementDirection != direction) {
            this.courseIncrement = 1;
            this.courseIncrementDirection = direction;
        }

        this.speedUp();
        const amount = Math.floor(this.courseIncrement) * (direction ? 1 : -1);
        if (this.cdiSource.value == 3) {
            const value = (SimVar.GetSimVarValue("L:GPS OBS", "degree") + amount + 360) % 360;
            SimVar.SetSimVarValue("L:GPS OBS", "degree", value);
        } else if (this.cdiSource.value == 1) {
            const value = (SimVar.GetSimVarValue("NAV OBS:1", "degree") + amount + 360) % 360;
            SimVar.SetSimVarValue("K:VOR1_SET", "degree", value);
        } else if (this.cdiSource.value == 2) {
            const value = (SimVar.GetSimVarValue("NAV OBS:2", "degree") + amount + 360) % 360;
            SimVar.SetSimVarValue("K:VOR2_SET", "degree", value);
        }
    }
    onCourseIncrement(inputStack) {
        this.incrementCourse(true);
    }
    onCourseDecrement(inputStack) {
        this.incrementCourse(false);
    }
    onCoursePush(inputStack) {
        if (this.cdiSource.value == 1) {
            SimVar.SetSimVarValue("K:VOR1_SET", "number", ((180 + SimVar.GetSimVarValue("NAV RADIAL:1", "degree")) % 360));
        } else if (this.cdiSource.value == 2) {
            SimVar.SetSimVarValue("K:VOR2_SET", "number", ((180 + SimVar.GetSimVarValue("NAV RADIAL:2", "degree")) % 360));
        }
    }
}

var HSIndicatorDisplayType;
(function (HSIndicatorDisplayType) {
    HSIndicatorDisplayType[HSIndicatorDisplayType["GlassCockpit"] = 0] = "GlassCockpit";
    HSIndicatorDisplayType[HSIndicatorDisplayType["HUD"] = 1] = "HUD";
    HSIndicatorDisplayType[HSIndicatorDisplayType["HUD_Simplified"] = 2] = "HUD_Simplified";
})(HSIndicatorDisplayType || (HSIndicatorDisplayType = {}));
;
class HSIndicator extends HTMLElement {
    constructor() {
        super();
        this.isDmeDisplayed = false;
        this.isBearing1Displayed = false;
        this.isBearing2Displayed = false;
        this.sourceIsGps = true;
        this.displayStyle = HSIndicatorDisplayType.GlassCockpit;
        this.fmsAlias = "FMS";
    }
    connectedCallback() {
        let fmsAlias = this.getAttribute("fmsAlias");
        if (fmsAlias && fmsAlias != "") {
            this.fmsAlias = fmsAlias;
        }
        let viewBox = `-86 -65 ${86 * 2} 117`;
        this.innerHTML = `
            <div class="compass-background">
                <svg viewBox="${viewBox}"></svg>
            </div>
            <div class="compass-background-circle">
                <svg viewBox="-50 -50 100 100"></svg>
            </div>                    
            <div class="compass-overlay">
                <svg viewBox="-50 -50 100 100"></svg>
            </div>
            <div class="compass-static-overlay">
                <svg viewBox="${viewBox}"></svg>
            </div>`;
        this.elements = {
            background: this.querySelector(".compass-background svg"),
            backgroundCircle: this.querySelector(".compass-background-circle svg"),
            overlay: this.querySelector(".compass-overlay svg"),
            staticOverlay: this.querySelector(".compass-static-overlay svg"),
            bearingTabs: []
        };
        this.createSVG();
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
    createCircleGraduations(frequency = 5) {
        let graduationSegments = [];
        for (let i = 0; i < 360; i += frequency) {
            let length = i % 10 == 0 ? 5 : 2;
            graduationSegments.push(...this.getRectSegments(-0.3, -50, 0.6, length, i * Math.PI / 180));
        }
        return this.createSvgElement("path", { d: graduationSegments.join(" "), fill: "white" });
    }
    createStaticLineMarkers(angles) {
        let lineSegments = angles.map(angle => this.getRectSegments(-0.5, -57, 1, 6, angle * Math.PI / 180).join(" "));
        return this.createSvgElement("path", { d: lineSegments.join(" "), fill: "white", });
    }
    createCirclePath(radius, num) {
        const segments = [];
        for (let i = 0; i <= num; i++) {
            const angle = i / num * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            segments.push(`${i == 0 ? "M" : "L"}${x} ${y}`);
        }
        return segments.join(" ");
    }
    createBackgroundCircle() {
        return this.createSvgElement("path", { d: this.createCirclePath(50, 360), class: "background-circle" });
        //return this.createSvgElement("circle", { cx: 0, cy: 0, r: 50, class: "background-circle" });
    }
    createBackgroudCircleText() {
        const texts = ["N", "3", "6", "E", "12", "15", "S", "21", "24", "W", "30", "33"];
        const g = this.createSvgElement("g", { class: "background-circle-text" });
        let angle = 0;
        for (let i = 0; i < texts.length; i++) {
            let isLetter = (i % 3) == 0;
            const text = this.createSvgElement("text", {
                x: 0, y: isLetter ? -35 : -38, transform: `rotate(${angle})`, class: isLetter ? "letter" : "number",
            });
            text.textContent = texts[i];
            angle += 360 / texts.length;
            g.appendChild(text);
        }
        return g;
    }
    createHeadingBug() {
        return this.createSvgElement("polygon", { points: "-4,-50 -3,-50 0,-46 3,-50 4,-50 4,-45 -4,-45", class: "heading-bug" });
    }
    createInnerCircle() {
        return this.createSvgElement("path", { d: this.createCirclePath(30, 180), class: "inner-circle" });
    }
    createTopArrow() {
        return this.createSvgElement("polygon", { points: "-4,-53 4,-53 0,-47", fill: "white", stroke: "#222", "stroke-width": "0.5" });
    }
    createPlane() {
        return this.createSvgElement("path", {
            d: "M44 50 L49 50 L49 53 L48 54 L48 55 L52 55 L52 54 L51 53 L51 50 L56 50 L56 49 L51 48 L51 46 Q50 44 49 46 L49 48 L44 49 Z",
            fill: "white",
            transform: "translate(-50, -50)"
        });
    }
    createHeadingText() {
        const x = -63, y = -57, width = 30, height = 10;
        const rectangle = this.createSvgElement("rect", { x: x, y: y, height: height, width: width });
        const text = this.createSvgElement("text", { x: x + 2, y: y + height - 2, class: "label" });
        text.textContent = "HDG";
        this.headingText = this.createSvgElement("text", { x: x + width - 2, y: y + height - 2, class: "value" });

        const g = this.createSvgElement("g", { class: "heading-text" });
        g.appendChild(rectangle);
        g.appendChild(text);
        g.appendChild(this.headingText);
        return g;
    }
    createCourseText() {
        const x = 33, y = -57, width = 30, height = 10;
        const rectangle = this.createSvgElement("rect", { x: x, y: y, height: height, width: width });
        const text = this.createSvgElement("text", { x: x + 2, y: y + height - 2, class: "label" });
        text.textContent = "CRS";
        this.courseText = this.createSvgElement("text", { x: x + width - 2, y: y + height - 2, class: "value" });

        const g = this.createSvgElement("g", { class: "course-text" });
        g.appendChild(rectangle);
        g.appendChild(text);
        g.appendChild(this.courseText);
        return g;
    }
    createCourse() {
        const width = 1, indicatorRadius = 20;
        const course = this.createSvgElement("g", { class: "course" });

        [-20, -10, 10, 20].forEach(position => {
            //course.appendChild(this.createSvgElement("circle", { cx: position, cy: 0, r: 2, class: "circle-outline" }));
            course.appendChild(this.createSvgElement("path", { d: this.createCirclePath(2, 60), class: "circle", transform: `translate(${position}, 0)` }));
        });

        course.appendChild(this.createSvgElement("polygon", { points: `${width},46 -${width},46 -${width},25 ${width},25`, class: "begin-arrow" }));
        course.appendChild(this.createSvgElement("polygon", { points: `${width},-25 -${width},-25 -${width},-35 -5,-35 0,-46 5,-35 ${width},-35`, class: "end-arrow" }));
        this.CDI = this.createSvgElement("polygon", { points: `-${width},24.5 ${width},24.5 ${width},-24.5 -${width},-24.5`, class: "cdi" });
        course.appendChild(this.CDI);
        course.appendChild(this.createSvgElement("polygon", { points: `-4,-${indicatorRadius} 4,-${indicatorRadius} 0,-${indicatorRadius + 5}`, class: "to-indicator" }));
        course.appendChild(this.createSvgElement("polygon", { points: `-4,${indicatorRadius} 4,${indicatorRadius} 0,${indicatorRadius + 5}`, class: "from-indicator" }));

        return course;
    }
    createCurrentTrackIndicator() {
        return this.createSvgElement("polygon", { points: "0,-54 2,-50 0,-46 -2,-50", class: "current-track-indicator" });
    }
    createDme() {
        const background = this.createSvgElement("path", {
            d: this.getExternalTextZonePath(HSIndicator.BEARING_RADIUS, 270 - HSIndicator.DME_ANGLE_START, 270 - HSIndicator.DME_ANGLE_END, -(HSIndicator.BEARING_RADIUS + HSIndicator.BEARING_WIDTH)),
            class: "background",
        });
        const coordinates = this.getRadiusCoordinates(270 - HSIndicator.DME_ANGLE_START, HSIndicator.BEARING_RADIUS);
        const x = -(HSIndicator.BEARING_RADIUS + HSIndicator.BEARING_WIDTH) + 3;
        const y = coordinates.y + 7;

        let label = this.createSvgElement("text", { x: x, y: y });
        label.textContent = "DME";
        this.dmeSource = this.createSvgElement("text", { x: x, y: y + 6, class: "source" });
        this.dmeIdent = this.createSvgElement("text", { x: x, y: y + 12, class: "ident" });
        this.dmeDistance = this.createSvgElement("text", { x: x, y: y + 18, class: "distance" });

        const group = this.createSvgElement("g", { class: "dme-tab" });
        group.appendChild(background);
        group.appendChild(label);
        group.appendChild(this.dmeSource);
        group.appendChild(this.dmeIdent);
        group.appendChild(this.dmeDistance);
        return group;
    }
    createBearing1() {
        const background = this.createSvgElement("path", {
            d: this.getExternalTextZonePath(HSIndicator.BEARING_RADIUS, 270 - HSIndicator.BEARING_ANGLE_START, 270 - HSIndicator.BEARING_ANGLE_END, -(HSIndicator.BEARING_RADIUS + HSIndicator.BEARING_WIDTH)),
            class: "background",
        });
        const coordinates = this.getRadiusCoordinates(270 - HSIndicator.BEARING_ANGLE_START, HSIndicator.BEARING_RADIUS);
        const x = -(HSIndicator.BEARING_RADIUS + HSIndicator.BEARING_WIDTH) + 3;
        const y = coordinates.y + 7;

        const group = this.createSvgElement("g", { class: "bearing-tab-left" });
        this.elements.bearingTabs[0] = {
            element: group,
            distance: this.createSvgElement("text", { x: x, y: y }),
            ident: this.createSvgElement("text", { x: x, y: y + 6, class: "ident" }),
            source: this.createSvgElement("text", { x: x, y: y + 12 }),
        }
        group.appendChild(background);
        group.appendChild(this.elements.bearingTabs[0].distance);
        group.appendChild(this.elements.bearingTabs[0].ident);
        group.appendChild(this.elements.bearingTabs[0].source);
        group.appendChild(this.createSvgElement("path", {
            transform: `translate(${x + 25},${y + 10})`,
            d: "M0 0 L10 0 M4 -2 L2 0 L4 2",
            class: "arrow-icon"
        }));
        return group;
    }
    createBearing2() {
        const background = this.createSvgElement("path", {
            d: this.getExternalTextZonePath(HSIndicator.BEARING_RADIUS, 270 + HSIndicator.BEARING_ANGLE_START, 270 + HSIndicator.BEARING_ANGLE_END, (HSIndicator.BEARING_RADIUS + HSIndicator.BEARING_WIDTH), true),
            class: "background",
        });
        const coordinates = this.getRadiusCoordinates(270 + HSIndicator.BEARING_ANGLE_START, HSIndicator.BEARING_RADIUS);
        const x = (HSIndicator.BEARING_RADIUS + HSIndicator.BEARING_WIDTH) - 3;
        const y = coordinates.y + 7;

        const group = this.createSvgElement("g", { class: "bearing-tab-right" });
        this.elements.bearingTabs[1] = {
            element: group,
            distance: this.createSvgElement("text", { x: x, y: y }),
            ident: this.createSvgElement("text", { x: x, y: y + 6, class: "ident" }),
            source: this.createSvgElement("text", { x: x, y: y + 12 }),
        }
        group.appendChild(background);
        group.appendChild(this.elements.bearingTabs[1].distance);
        group.appendChild(this.elements.bearingTabs[1].ident);
        group.appendChild(this.elements.bearingTabs[1].source);
        group.appendChild(this.createSvgElement("path", {
            transform: `translate(-46,-50)`,
            d: "M90 97 L92 97 M105 97 L103 97 L100 100 M103 97 L100 94 M101.5 98.5 L93 98.5 Q90 97 93 95.5 L101.5 95.5",
            class: "arrow-icon",
        }));
        return group;
    }
    createNavSource() {
        return this.createSvgElement("text", { x: -15, y: -10, class: "nav-source" });
    }
    createFlightPhase() {
        return this.createSvgElement("text", { x: 15, y: -10, class: "flight-phase" });
    }
    createCrossTrackError() {
        return this.createSvgElement("text", { x: 0, y: 16, class: "crosstrack-error" });
    }
    createBearing() {
        const background = this.createSvgElement("rect", { x: -15, y: -65, height: 12, width: 30 });
        this.bearingText = this.createSvgElement("text", { x: 0, y: -55, });

        const group = this.createSvgElement("g", { class: "bearing-top" });
        group.appendChild(background);
        group.appendChild(this.bearingText);
        return group;
    }
    createSvgElement(tagName, attributes = []) {
        return DOMUtilities.createElementNS(Avionics.SVG.NS, tagName, attributes);
    }
    createSVG() {
        Utils.RemoveAllChildren(this.elements.background);
        Utils.RemoveAllChildren(this.elements.backgroundCircle);
        Utils.RemoveAllChildren(this.elements.overlay);
        Utils.RemoveAllChildren(this.elements.staticOverlay);

        if (this.hasAttribute("displaystyle")) {
            var style = this.getAttribute("displaystyle").toLowerCase();
            if (style == "hud") {
                this.displayStyle = HSIndicatorDisplayType.HUD;
            }
            else if (style == "hud_simplified") {
                this.displayStyle = HSIndicatorDisplayType.HUD_Simplified;
            }
        }

        this.backgroundCircle = this.elements.backgroundCircle;
        this.root = this.elements.overlay;
        this.elements.background.appendChild(this.createStaticLineMarkers([-135, -90, -45, 45, 90, 135]));
        {
            {
                let arcSize = 45;
                let arcRadius = 53;
                let arcWidth = 5;
                let beginPointHalfUnitSize = (arcSize / 2) / arcRadius;
                let beginPointTopX = - Math.sin(beginPointHalfUnitSize) * (arcRadius + arcWidth / 2);
                let beginPointBotX = - Math.sin(beginPointHalfUnitSize) * (arcRadius - arcWidth / 2);
                let endPointTopX = + Math.sin(beginPointHalfUnitSize) * (arcRadius + arcWidth / 2);
                let endPointBotX = + Math.sin(beginPointHalfUnitSize) * (arcRadius - arcWidth / 2);
                let pointTopY = - Math.cos(beginPointHalfUnitSize) * (arcRadius + arcWidth / 2);
                let pointBotY = - Math.cos(beginPointHalfUnitSize) * (arcRadius - arcWidth / 2);
                let turnRateBackground = document.createElementNS(Avionics.SVG.NS, "path");
                let path = "M" + beginPointBotX + " " + pointBotY + "A " + (arcRadius - arcWidth / 2) + " " + (arcRadius - arcWidth / 2) + " 0 0 1 " + endPointBotX + " " + pointBotY;
                path += "L" + endPointTopX + " " + pointTopY + "A " + (arcRadius + arcWidth / 2) + " " + (arcRadius + arcWidth / 2) + " 0 0 0 " + beginPointTopX + " " + pointTopY;
                turnRateBackground.setAttribute("d", path);
                turnRateBackground.setAttribute("fill", "#1a1d21");
                turnRateBackground.setAttribute("fill-opacity", "0.25");
                this.elements.background.appendChild(turnRateBackground);
                let lines = [-18, -9, 9, 18];
                for (let i = 0; i < lines.length; i++) {
                    let line = document.createElementNS(Avionics.SVG.NS, "rect");
                    line.setAttribute("x", "-0.5");
                    line.setAttribute("y", (-50 - arcWidth).toString());
                    line.setAttribute("width", "1");
                    line.setAttribute("height", arcWidth.toString());
                    line.setAttribute("transform", "rotate(" + lines[i] + ")");
                    line.setAttribute("fill", "white");
                    this.elements.background.appendChild(line);
                }
            }
            {
                let turnRateArc = document.createElementNS(Avionics.SVG.NS, "path");
                this.turnRateArc = turnRateArc;
                turnRateArc.setAttribute("fill", "#d12bc7");
                this.elements.staticOverlay.appendChild(turnRateArc);
            }
        }
        this.backgroundCircle.append(this.createBackgroundCircle());
        this.backgroundCircle.append(this.createCircleGraduations());
        this.backgroundCircle.append(this.createBackgroudCircleText());
        this.headingBug = this.createHeadingBug();
        this.elements.overlay.appendChild(this.headingBug);
        this.innerCircle = this.createInnerCircle();
        this.elements.backgroundCircle.appendChild(this.innerCircle);

        this.currentTrackIndicator = this.createCurrentTrackIndicator();
        this.elements.overlay.appendChild(this.currentTrackIndicator);

        this.course = this.createCourse();
        this.elements.overlay.appendChild(this.course);

        this.elements.staticOverlay.appendChild(this.createTopArrow());
        this.elements.staticOverlay.appendChild(this.createPlane());

        this.elements.staticOverlay.appendChild(this.createBearing());

        this.elements.staticOverlay.appendChild(this.createHeadingText());
        this.elements.staticOverlay.appendChild(this.createCourseText());

        this.navSource = this.createNavSource();
        this.elements.staticOverlay.appendChild(this.navSource);
        this.flightPhase = this.createFlightPhase();
        this.elements.staticOverlay.appendChild(this.flightPhase);
        this.crossTrackError = this.createCrossTrackError();
        this.elements.staticOverlay.appendChild(this.crossTrackError);

        this.dme = this.createDme();
        this.elements.staticOverlay.appendChild(this.dme);
        this.bearing1FixedGroup = this.createBearing1();
        this.elements.staticOverlay.appendChild(this.bearing1FixedGroup);
        this.bearing2FixedGroup = this.createBearing2();
        this.elements.staticOverlay.appendChild(this.bearing2FixedGroup);

        this.elements.bearingTabs[0].needle = this.createSvgElement("path", {
            d: "M0 46 L0 30 M0 -46 L0 -30 M0 -42 L7 -35 M0 -42 L-7 -35",
            class: "bearing-arrow"
        });
        this.elements.overlay.appendChild(this.elements.bearingTabs[0].needle);

        this.elements.bearingTabs[1].needle = this.createSvgElement("path", {
            d: "M0 46 L0 42 M-3 30 L-3 40 Q0 46 3 40 L3 30 M0 -46 L0 -42 L7 -35 M0 -42 L-7 -35 M-3 -39 L-3 -30 M3 -39 L3 -30",
            transform: "translate(-50,-50)",
            class: "bearing-arrow"
        });
        this.elements.overlay.appendChild(this.elements.bearingTabs[1].needle);
    }
    /**
     * @param {HSIIndicatorModel} model 
     */
    setModel(model) {
        if (this.flightPhase) {
            model.flightPhase.subscribe(phase => this.flightPhase.textContent = phase);
        }

        model.rotation.subscribe(rotation => {
            this.querySelector(".compass-background-circle").style.transform = `rotate(${-rotation}deg)`;
            this.querySelector(".compass-overlay").style.transform = `rotate(${-rotation}deg)`;
            if (this.bearingText) {
                let brg = Math.round(parseFloat(rotation));
                brg = (brg == 0) ? 360 : brg;
                this.bearingText.textContent = `${brg.toFixed(0).padStart(3, "0")}°`;
            }
        });

        if (this.turnRateArc) {
            model.turnRate.subscribe(turnRate => {
                if (!this.smoothedTurnRate)
                    this.smoothedTurnRate = 0;
                this.smoothedTurnRate += (turnRate - this.smoothedTurnRate) / 5;

                let value = Math.max(Math.min(parseFloat(this.smoothedTurnRate), 4), -4);
                let arcAngle = 6 * value * Math.PI / 180;
                let arcRadius = 53;
                let arcWidth = 2;
                let arrowWidth = 6;
                let beginPointTopX = 0;
                let beginPointBotX = 0;
                let beginPointTopY = 0 - arcRadius - (arcWidth / 2);
                let beginPointBotY = 0 - arcRadius + (arcWidth / 2);
                let endPointTopX = 0 + Math.sin(arcAngle) * (arcRadius + arcWidth / 2);
                let endPointBotX = 0 + Math.sin(arcAngle) * (arcRadius - arcWidth / 2);
                let endPointTopY = 0 - Math.cos(arcAngle) * (arcRadius + arcWidth / 2);
                let endPointBotY = 0 - Math.cos(arcAngle) * (arcRadius - arcWidth / 2);
                let path;
                if (value == 4 || value == -4) {
                    let endPointArrowTopX = 0 + Math.sin(arcAngle) * (arcRadius + arrowWidth / 2);
                    let endPointArrowBotX = 0 + Math.sin(arcAngle) * (arcRadius - arrowWidth / 2);
                    let endPointArrowTopY = 0 - Math.cos(arcAngle) * (arcRadius + arrowWidth / 2);
                    let endPointArrowBotY = 0 - Math.cos(arcAngle) * (arcRadius - arrowWidth / 2);
                    let endPointArrowEndX = 0 + Math.sin(arcAngle + (value > 0 ? 0.1 : -0.1)) * (arcRadius);
                    let endPointArrowEndY = 0 - Math.cos(arcAngle + (value > 0 ? 0.1 : -0.1)) * (arcRadius);
                    path = "M" + beginPointBotX + " " + beginPointBotY + "A " + (arcRadius - arcWidth / 2) + " " + (arcRadius - arcWidth / 2) + " 0 0 " + (arcAngle > 0 ? "1" : "0") + " " + endPointBotX + " " + endPointBotY;
                    path += "L" + endPointArrowBotX + " " + endPointArrowBotY + " L" + endPointArrowEndX + " " + endPointArrowEndY + " L" + endPointArrowTopX + " " + endPointArrowTopY;
                    path += "L" + endPointTopX + " " + endPointTopY + "A " + (arcRadius + arcWidth / 2) + " " + (arcRadius + arcWidth / 2) + " 0 0 " + (arcAngle > 0 ? "0" : "1") + " " + beginPointTopX + " " + beginPointTopY;
                }
                else {
                    path = "M" + beginPointBotX + " " + beginPointBotY + "A " + (arcRadius - arcWidth / 2) + " " + (arcRadius - arcWidth / 2) + " 0 0 " + (arcAngle > 0 ? "1" : "0") + " " + endPointBotX + " " + endPointBotY;
                    path += "L" + endPointTopX + " " + endPointTopY + "A " + (arcRadius + arcWidth / 2) + " " + (arcRadius + arcWidth / 2) + " 0 0 " + (arcAngle > 0 ? "0" : "1") + " " + beginPointTopX + " " + beginPointTopY;
                }
                this.turnRateArc.setAttribute("d", path);
            });
        }

        model.heading.subscribe(heading => {
            this.headingBug.setAttribute("transform", "rotate(" + (heading) + ")");
            if (this.headingText) {
                let headingValue = parseFloat(heading);
                if (headingValue == 0) {
                    headingValue = 360;
                }
                let hdg = fastToFixed(headingValue, 0);
                this.headingText.textContent = "000".slice(hdg.length) + hdg + "°";
            }
        });

        if (this.course) {
            model.cdi.bearing.subscribe(bearing => {
                if (this.courseText) {
                    if (bearing == 0) {
                        bearing = 360;
                    }
                    let crs = fastToFixed(parseFloat(bearing), 0);
                    this.courseText.textContent = "000".slice(crs.length) + crs + "°";
                }
            });
            model.cdi.bearingAmount.subscribe(bearing => {
                this.course.setAttribute("transform", `rotate(${bearing})`);
            });
        }

        rxjs.combineLatest(model.cdi.deviationAmount.observable, model.cdi.source.observable, (deviation, source) => deviation > 0.95 && source == "FMS")
            .subscribe(full => this.crossTrackError.setAttribute("visibility", full ? "visible" : "hidden"));

        if (this.CDI) {
            model.cdi.deviationAmount.subscribe(deviation => {
                this.CDI.setAttribute("transform", `translate(${deviation * 20} 0)`);
            });
            model.cdi.deviation.subscribe(deviation => {
                deviation = parseFloat(deviation);
                if (this.sourceIsGps) {
                    this.crossTrackError.textContent = `XTK ${deviation.toFixed(2)}NM`;
                }
            });
            model.cdi.displayDeviation.subscribe(display => this.CDI.setAttribute("display", display ? "block" : "none"));
            model.cdi.toFrom.subscribe(toFrom => toFrom == 0 ? this.course.removeAttribute("direction") : this.course.setAttribute("direction", toFrom == 1 ? "to" : "from"))
        }

        if (this.navSource) {
            model.cdi.source.subscribe(source => {
                this.navSource.textContent = source == "FMS" ? this.fmsAlias : source;
                this.sourceIsGps = source == "FMS";
                switch (source) {
                    case "FMS":
                        this.setAttribute("mode", "gps");
                        break;
                    case "VOR1":
                    case "LOC1":
                        this.setAttribute("mode", "nav1");
                        break;
                    case "VOR2":
                    case "LOC2":
                        this.setAttribute("mode", "nav2");
                        break;
                }
            });
        };

        for (let tabIndex in this.elements.bearingTabs) {
            const tab = this.elements.bearingTabs[tabIndex], modelBearing = model.bearing[tabIndex];
            modelBearing.source.subscribe(source => tab.source.textContent = source);
            modelBearing.display.subscribe(display => tab.element.setAttribute("display", display ? "block" : "none"));
            modelBearing.displayNeedle.subscribe(display => tab.needle.setAttribute("visibility", display ? "visible" : "hidden"));
            modelBearing.ident.subscribe(ident => tab.ident.textContent = ident ? ident : "NO DATA");
            modelBearing.distance.subscribe(distance => tab.distance.textContent = distance == "" ? "" : fastToFixed(parseFloat(distance), 1) + "NM");
            modelBearing.bearing.subscribe(bearing => tab.needle.setAttribute("transform", `rotate(${bearing})`));
        }

        if (this.dme) {
            model.dme.display.subscribe(display => this.dme.style.display = display ? "block" : "none");
            model.dme.ident.subscribe(value => this.dmeIdent.textContent = value);
            model.dme.distance.subscribe(value => this.dmeDistance.textContent = value === null ? "" : `${value.toFixed(value > 100 ? 0 : 1)}NM`);
            model.dme.source.subscribe(value => this.dmeSource.textContent = value);
        }

        if (this.currentTrackIndicator) {
            model.track.subscribe(track => this.currentTrackIndicator.setAttribute("transform", `rotate(${track})`));
        }
    }
    getRadiusCoordinates(angle, radius) {
        angle = angle * Math.PI / 180;
        return {
            x: radius * Math.cos(angle),
            y: -radius * Math.sin(angle)
        };
    }
    getExternalTextZonePath(radius, beginAngle, endAngle, xEnd, reverse = false) {
        beginAngle = beginAngle * Math.PI / 180;
        endAngle = endAngle * Math.PI / 180;
        const beginX = (radius * Math.cos(beginAngle));
        const beginY = -(radius * Math.sin(beginAngle));
        const endX = (radius * Math.cos(endAngle));
        const endY = -(radius * Math.sin(endAngle));
        const path = `M ${beginX} ${beginY} L ${xEnd} ${beginY} L ${xEnd} ${endY} L ${endX} ${endY} A ${radius} ${radius} 0 0 ${reverse ? 0 : 1} ${beginX} ${beginY}`;
        return path;
    }
    applyHUDStyle(_elem) {
        _elem.setAttribute("fill", "rgb(26,29,33)");
        _elem.setAttribute("fill-opacity", "0.5");
        _elem.setAttribute("stroke", "rgb(255, 255, 255)");
        _elem.setAttribute("stroke-width", "0.75");
        _elem.setAttribute("stroke-opacity", "0.2");
    }
}
HSIndicator.DME_ANGLE_START = 90;
HSIndicator.DME_ANGLE_END = 62;
HSIndicator.BEARING_ANGLE_START = 60;
HSIndicator.BEARING_ANGLE_END = 30;
HSIndicator.BEARING_RADIUS = 59;
HSIndicator.BEARING_WIDTH = 22;
function getSize(_elementPercent, _canvasSize) {
    return _elementPercent * _canvasSize / 100;
}
customElements.define('glasscockpit-hsi', HSIndicator);
//# sourceMappingURL=HSIndicator.js.map