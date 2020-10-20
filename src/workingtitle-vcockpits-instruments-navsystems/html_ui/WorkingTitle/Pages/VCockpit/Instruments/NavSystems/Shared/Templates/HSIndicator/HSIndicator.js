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
        let now = performance.now();
        let dt = (now - this.courseIncrementLastUpdate) / 1000;
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
        let amount = Math.floor(this.courseIncrement) * (direction ? 1 : -1);
        if (this.cdiSource.value == 3) {
            let value = (SimVar.GetSimVarValue("L:GPS OBS", "degree") + amount + 360) % 360;
            SimVar.SetSimVarValue("L:GPS OBS", "degree", value);
        } else if (this.cdiSource.value == 1) {
            let value = (SimVar.GetSimVarValue("NAV OBS:1", "degree") + amount + 360) % 360;
            SimVar.SetSimVarValue("K:VOR1_SET", "degree", value);
        } else if (this.cdiSource.value == 2) {
            let value = (SimVar.GetSimVarValue("NAV OBS:2", "degree") + amount + 360) % 360;
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
        let viewBox = "-60 -65 120 130";
        this.innerHTML = `
            <div class="compass-background">
                <svg viewBox="${viewBox}"></svg>
            </div>
            <div class="compass-background-circle">
                <svg viewBox="${viewBox}"></svg>
            </div>                    
            <div class="compass-overlay">
                <svg viewBox="${viewBox}"></svg>
            </div>
            <div class="compass-static-overlay">
                <svg viewBox="${viewBox}"></svg>
            </div>`;
        this.elements = {
            background: this.querySelector(".compass-background svg"),
            backgroundCircle: this.querySelector(".compass-background-circle svg"),
            overlay: this.querySelector(".compass-overlay svg"),
            staticOverlay: this.querySelector(".compass-static-overlay svg"),
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
        let i = 0;
        return [
            this.rotate2d(x, y, r),
            this.rotate2d(x + w, y, r),
            this.rotate2d(x + w, y + h, r),
            this.rotate2d(x, y + h, r)
        ].map(point => `${(i++ == 0) ? "M" : "L"}${point[0] + tx} ${point[1] + ty}`);
    }
    createCircleGraduations(frequency = 5) {
        let graduationSegments = [];
        for (let i = 0; i < 360; i += frequency) {
            let length = i % 10 == 0 ? 5 : 2;
            graduationSegments.push(...this.getRectSegments(-0.3, -50, 0.6, length, i * Math.PI / 180));
        }
        let graduationMarkers = document.createElementNS(Avionics.SVG.NS, "path");
        graduationMarkers.setAttribute("d", graduationSegments.join(" "));
        graduationMarkers.setAttribute("fill", "white");
        return graduationMarkers;
    }
    createStaticLineMarkers(angles) {
        let lines = angles;
        let lineSegments = [];
        for (let i = 0; i < lines.length; i++) {
            lineSegments.push(...this.getRectSegments(-0.5, -57, 1, 6, lines[i] * Math.PI / 180));
        }
        let lineMarkers = document.createElementNS(Avionics.SVG.NS, "path");
        lineMarkers.setAttribute("d", lineSegments.join(" "));
        lineMarkers.setAttribute("fill", "white");
        return lineMarkers;
    }
    createBackgroundCircle() {
        let circle = document.createElementNS(Avionics.SVG.NS, "circle");
        circle.setAttribute("cx", "0");
        circle.setAttribute("cy", "0");
        circle.setAttribute("r", "50");
        circle.setAttribute("fill", "#1a1d21");
        circle.setAttribute("fill-opacity", "0.25");
        return circle;
    }
    createBackgroudCircleText() {
        let texts = ["N", "3", "6", "E", "12", "15", "S", "21", "24", "W", "30", "33"];
        let angle = 0;
        let g = document.createElementNS(Avionics.SVG.NS, "g");
        for (let i = 0; i < texts.length; i++) {
            let text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = texts[i];
            text.setAttribute("x", "0");
            text.setAttribute("y", (i % 3) == 0 ? "-40" : "-40");
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", (i % 3) == 0 ? "11" : "7");
            text.setAttribute("font-family", "Roboto-Regular");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            text.setAttribute("transform", "rotate(" + angle + ")");
            angle += 360 / texts.length;
            g.appendChild(text);
        }
        return g;
    }
    createHeadingBug() {
        let bug = document.createElementNS(Avionics.SVG.NS, "polygon");
        bug.setAttribute("points", "-4,-50 -3,-50 0,-46 3,-50 4,-50 4,-45 -4,-45");
        bug.setAttribute("fill", "aqua");
        return bug;
    }
    createInnerCircle() {
        let circle = document.createElementNS(Avionics.SVG.NS, "circle");
        circle.setAttribute("cx", "0");
        circle.setAttribute("cy", "0");
        circle.setAttribute("r", "30");
        circle.setAttribute("stroke", "white");
        circle.setAttribute("stroke-width", "0.8");
        circle.setAttribute("fill-opacity", "0");
        circle.setAttribute("display", "none");
        return circle;
    }
    createTopArrow() {
        let arrow = document.createElementNS(Avionics.SVG.NS, "polygon");
        arrow.setAttribute("points", "-4,-53 4,-53 0,-47");
        arrow.setAttribute("fill", "white");
        arrow.setAttribute("stroke", "#222");
        arrow.setAttribute("stroke-width", "0.5");
        return arrow;
    }
    createPlane() {
        let plane = document.createElementNS(Avionics.SVG.NS, "path");
        plane.setAttribute("d", "M44 50 L49 50 L49 53 L48 54 L48 55 L52 55 L52 54 L51 53 L51 50 L56 50 L56 49 L51 48 L51 46 Q50 44 49 46 L49 48 L44 49 Z");
        plane.setAttribute("fill", "white");
        plane.setAttribute("transform", "translate(-50, -50)");
        return plane;
    }
    createHeadingText() {
        let rectangle = document.createElementNS(Avionics.SVG.NS, "rect");
        let x = -63;
        let y = -57;
        let width = 30;
        let height = 10;
        rectangle.setAttribute("x", x);
        rectangle.setAttribute("y", y);
        rectangle.setAttribute("height", height);
        rectangle.setAttribute("width", width);
        rectangle.setAttribute("fill", "#000");
        rectangle.setAttribute("fill-opacity", "1");
        rectangle.setAttribute("stroke", "#fff");
        rectangle.setAttribute("stroke-width", "1");
        if (this.displayStyle == HSIndicatorDisplayType.HUD)
            this.applyHUDStyle(rectangle);
        let text = document.createElementNS(Avionics.SVG.NS, "text");
        text.textContent = "HDG";
        text.setAttribute("fill", "white");
        text.setAttribute("x", x + 2);
        text.setAttribute("y", y + height - 2);
        text.setAttribute("font-size", "5");
        text.setAttribute("font-family", "Roboto-Mono");
        text.setAttribute("font-weight", "bold");
        let value = document.createElementNS(Avionics.SVG.NS, "text");
        value.setAttribute("fill", "#00ffff");
        value.setAttribute("x", x + width - 2);
        value.setAttribute("y", y + height - 2);
        value.setAttribute("font-size", "7");
        value.setAttribute("font-family", "Roboto-Mono");
        value.setAttribute("font-weight", "bold");
        value.setAttribute("letter-spacing", "-1");
        value.setAttribute("text-anchor", "end");
        this.headingText = value;

        let g = document.createElementNS(Avionics.SVG.NS, "g");
        g.appendChild(rectangle);
        g.appendChild(text);
        g.appendChild(value);
        return g;
    }
    createCourseText() {
        let x = 33;
        let y = -57;
        let width = 30;
        let height = 10;
        let rectangle = document.createElementNS(Avionics.SVG.NS, "rect");
        rectangle.setAttribute("x", x);
        rectangle.setAttribute("y", y);
        rectangle.setAttribute("height", height);
        rectangle.setAttribute("width", width);
        rectangle.setAttribute("fill", "#000");
        rectangle.setAttribute("stroke", "#fff");
        rectangle.setAttribute("stroke-width", "1");
        if (this.displayStyle == HSIndicatorDisplayType.HUD)
            this.applyHUDStyle(rectangle);
        let text = document.createElementNS(Avionics.SVG.NS, "text");
        text.textContent = "CRS";
        text.setAttribute("fill", "white");
        text.setAttribute("x", x + 2);
        text.setAttribute("y", y + height - 2);
        text.setAttribute("font-size", "5");
        text.setAttribute("font-family", "Roboto-Mono");
        text.setAttribute("font-weight", "bold");
        let value = document.createElementNS(Avionics.SVG.NS, "text");
        value.setAttribute("fill", "#ff00ff");
        value.setAttribute("x", x + width - 2);
        value.setAttribute("y", y + height - 2);
        value.setAttribute("font-size", "7");
        value.setAttribute("font-family", "Roboto-Mono");
        value.setAttribute("font-weight", "bold");
        value.setAttribute("letter-spacing", "-1");
        value.setAttribute("text-anchor", "end");
        this.courseText = value;

        let g = document.createElementNS(Avionics.SVG.NS, "g");
        g.appendChild(rectangle);
        g.appendChild(text);
        g.appendChild(value);
        return g;
    }
    createCourse() {
        let course = document.createElementNS(Avionics.SVG.NS, "g");
        course.setAttribute("fill", "#d12bc7");
        {
            this.beginArrow = document.createElementNS(Avionics.SVG.NS, "polygon");
            this.beginArrow.setAttribute("points", "1,46 -1,46 -1,25 1,25");
            course.appendChild(this.beginArrow);
            this.fromIndicator = document.createElementNS(Avionics.SVG.NS, "polygon");
            this.fromIndicator.setAttribute("points", "-4,25 4,25 0,30");
            this.fromIndicator.setAttribute("stroke", "black");
            this.fromIndicator.setAttribute("stroke-width", "0.2");
            this.fromIndicator.setAttribute("display", "none");
            course.appendChild(this.fromIndicator);
        }
        {
            this.CDI = document.createElementNS(Avionics.SVG.NS, "polygon");
            this.CDI.setAttribute("points", "-1,24.5 1,24.5 1,-24.5 -1,-24.5");
            course.appendChild(this.CDI);
        }
        {
            this.endArrow = document.createElementNS(Avionics.SVG.NS, "polygon");
            this.endArrow.setAttribute("points", "1,-25 -1,-25 -1,-35 -5,-35 0,-46 5,-35 1,-35");
            course.appendChild(this.endArrow);
            this.toIndicator = document.createElementNS(Avionics.SVG.NS, "polygon");
            this.toIndicator.setAttribute("points", "-4,-25 4,-25 0,-30");
            this.toIndicator.setAttribute("stroke", "black");
            this.toIndicator.setAttribute("stroke-width", "0.2");
            this.toIndicator.setAttribute("display", "none");
            course.appendChild(this.toIndicator);
        }
        let circlePosition = [-20, -10, 10, 20];
        for (let i = 0; i < circlePosition.length; i++) {
            let CDICircle = document.createElementNS(Avionics.SVG.NS, "circle");
            CDICircle.setAttribute("cx", (circlePosition[i]).toString());
            CDICircle.setAttribute("cy", "0");
            CDICircle.setAttribute("r", "2");
            CDICircle.setAttribute("stroke", "white");
            CDICircle.setAttribute("stroke-width", "1");
            CDICircle.setAttribute("fill-opacity", "0");
            course.appendChild(CDICircle);
        }
        return course;
    }
    createCurrentTrackIndicator() {
        let track = document.createElementNS(Avionics.SVG.NS, "polygon");
        track.setAttribute("points", "0,-54 2,-50 0,-54 -2,-50");
        track.setAttribute("fill", "#d12bc7");
        return track;
    }
    createNavSource() {
        let rectangle = document.createElementNS(Avionics.SVG.NS, "rect");
        rectangle.setAttribute("fill", "#1a1d21");
        rectangle.setAttribute("fill-opacity", "1");
        rectangle.setAttribute("x", "-32");
        rectangle.setAttribute("y", "-15.5");
        rectangle.setAttribute("height", "7");
        rectangle.setAttribute("width", "14");
        this.navSourceBg = rectangle;
        let value = document.createElementNS(Avionics.SVG.NS, "text");
        value.textContent = "GPS";
        value.setAttribute("fill", "#d12bc7");
        value.setAttribute("x", "-15");
        value.setAttribute("y", "-10");
        value.setAttribute("font-size", "6");
        value.setAttribute("font-family", "Roboto-Bold");
        value.setAttribute("text-anchor", "middle");
        this.navSource = value;
        let g = document.createElementNS(Avionics.SVG.NS, "g");
        g.appendChild(rectangle);
        g.appendChild(value);
        return g;
    }
    createDme() {
        this.dme = document.createElementNS(Avionics.SVG.NS, "g");
        this.dme.setAttribute("display", "none");
        let topLeftZone = document.createElementNS(Avionics.SVG.NS, "path");
        topLeftZone.setAttribute("d", this.getExternalTextZonePath(57, 0, -0.58, -28));
        topLeftZone.setAttribute("fill", "#1a1d21");
        this.dme.appendChild(topLeftZone);
        let dme1 = document.createElementNS(Avionics.SVG.NS, "text");
        dme1.textContent = "DME";
        dme1.setAttribute("fill", "white");
        dme1.setAttribute("x", "-27");
        dme1.setAttribute("y", "57");
        dme1.setAttribute("font-size", "6");
        dme1.setAttribute("font-family", "Roboto-Bold");
        dme1.setAttribute("text-anchor", "start");
        this.dme.appendChild(dme1);
        this.dmeSource = document.createElementNS(Avionics.SVG.NS, "text");
        this.dmeSource.textContent = "NAV1";
        this.dmeSource.setAttribute("fill", "#36c8d2");
        this.dmeSource.setAttribute("x", "-27");
        this.dmeSource.setAttribute("y", "64");
        this.dmeSource.setAttribute("font-size", "6");
        this.dmeSource.setAttribute("font-family", "Roboto-Bold");
        this.dmeSource.setAttribute("text-anchor", "start");
        this.dme.appendChild(this.dmeSource);
        this.dmeIdent = document.createElementNS(Avionics.SVG.NS, "text");
        this.dmeIdent.textContent = "117.80";
        this.dmeIdent.setAttribute("fill", "#36c8d2");
        this.dmeIdent.setAttribute("x", "-27");
        this.dmeIdent.setAttribute("y", "71");
        this.dmeIdent.setAttribute("font-size", "6");
        this.dmeIdent.setAttribute("font-family", "Roboto-Bold");
        this.dmeIdent.setAttribute("text-anchor", "start");
        this.dme.appendChild(this.dmeIdent);
        this.dmeDistance = document.createElementNS(Avionics.SVG.NS, "text");
        this.dmeDistance.textContent = "97.7NM";
        this.dmeDistance.setAttribute("fill", "white");
        this.dmeDistance.setAttribute("x", "-27");
        this.dmeDistance.setAttribute("y", "78");
        this.dmeDistance.setAttribute("font-size", "6");
        this.dmeDistance.setAttribute("font-family", "Roboto-Bold");
        this.dmeDistance.setAttribute("text-anchor", "start");
        this.dme.appendChild(this.dmeDistance);
        return this.dme;
    }
    createFlightPhase() {
        let rectangle = document.createElementNS(Avionics.SVG.NS, "rect");
        rectangle.setAttribute("fill", "#1a1d21");
        rectangle.setAttribute("fill-opacity", "1");
        rectangle.setAttribute("x", "7");
        rectangle.setAttribute("y", "-15.5");
        rectangle.setAttribute("height", "7");
        rectangle.setAttribute("width", "16");
        this.flightPhaseBg = rectangle;
        let value = document.createElementNS(Avionics.SVG.NS, "text");
        value.textContent = "TERM";
        value.setAttribute("fill", "#d12bc7");
        value.setAttribute("x", "15");
        value.setAttribute("y", "-10");
        value.setAttribute("font-size", "6");
        value.setAttribute("font-family", "Roboto-Bold");
        value.setAttribute("text-anchor", "middle");
        this.flightPhase = value;
        let g = document.createElementNS(Avionics.SVG.NS, "g");
        g.appendChild(rectangle);
        g.appendChild(value);
        return g;
    }
    createCrossTrackError() {
        let background = document.createElementNS(Avionics.SVG.NS, "rect");
        background.setAttribute("fill", "#1a1d21");
        background.setAttribute("fill-opacity", "1");
        background.setAttribute("x", "-20");
        background.setAttribute("y", "10.5");
        background.setAttribute("height", "7");
        background.setAttribute("width", "38");
        this.crossTrackErrorBg = background;
        this.elements.staticOverlay.appendChild(this.crossTrackErrorBg);
        let value = document.createElementNS(Avionics.SVG.NS, "text");
        value.textContent = "XTK 3.15NM";
        value.setAttribute("fill", "#d12bc7");
        value.setAttribute("x", "0");
        value.setAttribute("y", "16");
        value.setAttribute("font-size", "6");
        value.setAttribute("font-family", "Roboto-Bold");
        value.setAttribute("text-anchor", "middle");
        this.crossTrackError = value;
        let g = document.createElementNS(Avionics.SVG.NS, "g");
        g.appendChild(background);
        g.appendChild(value);
        return g;
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

        if (this.displayStyle != HSIndicatorDisplayType.HUD_Simplified) {
            this.currentTrackIndicator = this.createCurrentTrackIndicator();
            this.elements.overlay.appendChild(this.currentTrackIndicator);
            {
                this.bearing1 = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing1.setAttribute("display", "none");
                this.elements.overlay.appendChild(this.bearing1);
                let arrow = document.createElementNS(Avionics.SVG.NS, "path");
                arrow.setAttribute("d", "M50 96 L50 80 M50 4 L50 20 M50 8 L57 15 M50 8 L43 15");
                arrow.setAttribute("stroke", "#36c8d2");
                arrow.setAttribute("stroke-width", "1");
                arrow.setAttribute("fill-opacity", "0");
                this.bearing1.appendChild(arrow);
            }
            {
                this.bearing2 = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing2.setAttribute("display", "none");
                this.elements.overlay.appendChild(this.bearing2);
                let arrow = document.createElementNS(Avionics.SVG.NS, "path");
                arrow.setAttribute("d", "M50 96 L50 92 M47 80 L47 90 Q50 96 53 90 L53 80 M50 4 L50 8 L57 15 M50 8 L43 15 M47 11 L47 20 M53 11 L53 20");
                arrow.setAttribute("stroke", "#36c8d2");
                arrow.setAttribute("stroke-width", "1");
                arrow.setAttribute("fill-opacity", "0");
                this.bearing2.appendChild(arrow);
            }
            this.course = this.createCourse();
            this.elements.overlay.appendChild(this.course);
        }
        this.elements.staticOverlay.appendChild(this.createTopArrow());
        this.elements.staticOverlay.appendChild(this.createPlane());
        {
            let bearingRectangle = document.createElementNS(Avionics.SVG.NS, "rect");
            bearingRectangle.setAttribute("x", "-15");
            bearingRectangle.setAttribute("y", "-65");
            bearingRectangle.setAttribute("height", "12");
            bearingRectangle.setAttribute("width", "30");
            bearingRectangle.setAttribute("fill", "#000");
            bearingRectangle.setAttribute("stroke", "#666");
            bearingRectangle.setAttribute("stroke-width", "0.5");
            this.elements.staticOverlay.appendChild(bearingRectangle);
            if (this.displayStyle == HSIndicatorDisplayType.HUD)
                this.applyHUDStyle(bearingRectangle);
            let bearingText = document.createElementNS(Avionics.SVG.NS, "text");
            bearingText.setAttribute("fill", "white");
            bearingText.setAttribute("text-anchor", "middle");
            bearingText.setAttribute("x", "0");
            bearingText.setAttribute("y", "-55");
            bearingText.setAttribute("font-size", "11");
            bearingText.setAttribute("font-family", "Roboto-Bold");
            this.bearingText = bearingText;
            this.elements.staticOverlay.appendChild(bearingText);
        }
        if (this.displayStyle == HSIndicatorDisplayType.HUD_Simplified)
            return;

        this.elements.staticOverlay.appendChild(this.createHeadingText());
        this.elements.staticOverlay.appendChild(this.createCourseText());
        let navSource = this.createNavSource();
        this.elements.staticOverlay.appendChild(navSource);
        let flightPhase = this.createFlightPhase();
        this.elements.staticOverlay.appendChild(flightPhase);
        let crossTrackError = this.createCrossTrackError();
        this.elements.staticOverlay.appendChild(crossTrackError);
        this.root.appendChild(this.createDme());
        {
            {
                this.bearing1FixedGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing1FixedGroup.setAttribute("display", "none");
                this.root.appendChild(this.bearing1FixedGroup);
                let botLeftZone = document.createElementNS(Avionics.SVG.NS, "path");
                botLeftZone.setAttribute("d", this.getExternalTextZonePath(57, -0.6, -1.1, -28));
                botLeftZone.setAttribute("fill", "#1a1d21");
                this.bearing1FixedGroup.appendChild(botLeftZone);
                this.bearing1Distance = document.createElementNS(Avionics.SVG.NS, "text");
                this.bearing1Distance.textContent = "16.2 NM";
                this.bearing1Distance.setAttribute("fill", "white");
                this.bearing1Distance.setAttribute("x", "-27");
                this.bearing1Distance.setAttribute("y", "88");
                this.bearing1Distance.setAttribute("font-size", "6");
                this.bearing1Distance.setAttribute("font-family", "Roboto-Bold");
                this.bearing1Distance.setAttribute("text-anchor", "start");
                this.bearing1FixedGroup.appendChild(this.bearing1Distance);
                this.bearing1Ident = document.createElementNS(Avionics.SVG.NS, "text");
                this.bearing1Ident.textContent = "ATL";
                this.bearing1Ident.setAttribute("fill", "#36c8d2");
                this.bearing1Ident.setAttribute("x", "-27");
                this.bearing1Ident.setAttribute("y", "94");
                this.bearing1Ident.setAttribute("font-size", "6");
                this.bearing1Ident.setAttribute("font-family", "Roboto-Bold");
                this.bearing1Ident.setAttribute("text-anchor", "start");
                this.bearing1FixedGroup.appendChild(this.bearing1Ident);
                this.bearing1Source = document.createElementNS(Avionics.SVG.NS, "text");
                this.bearing1Source.textContent = "NAV1";
                this.bearing1Source.setAttribute("fill", "white");
                this.bearing1Source.setAttribute("x", "-27");
                this.bearing1Source.setAttribute("y", "100");
                this.bearing1Source.setAttribute("font-size", "6");
                this.bearing1Source.setAttribute("font-family", "Roboto-Bold");
                this.bearing1Source.setAttribute("text-anchor", "left");
                this.bearing1FixedGroup.appendChild(this.bearing1Source);
                {
                    let pointer1Main = document.createElementNS(Avionics.SVG.NS, "rect");
                    pointer1Main.setAttribute("x", "-5");
                    pointer1Main.setAttribute("y", "96.875");
                    pointer1Main.setAttribute("width", "15");
                    pointer1Main.setAttribute("height", "0.25");
                    pointer1Main.setAttribute("fill", "#36c8d2");
                    this.bearing1FixedGroup.appendChild(pointer1Main);
                    let pointer1Top = document.createElementNS(Avionics.SVG.NS, "rect");
                    pointer1Top.setAttribute("x", "-3");
                    pointer1Top.setAttribute("y", "96.875");
                    pointer1Top.setAttribute("width", "4");
                    pointer1Top.setAttribute("height", "0.25");
                    pointer1Top.setAttribute("transform", "rotate(-45 -3 97)");
                    pointer1Top.setAttribute("fill", "#36c8d2");
                    this.bearing1FixedGroup.appendChild(pointer1Top);
                    let pointer1Bot = document.createElementNS(Avionics.SVG.NS, "rect");
                    pointer1Bot.setAttribute("x", "-3");
                    pointer1Bot.setAttribute("y", "96.875");
                    pointer1Bot.setAttribute("width", "4");
                    pointer1Bot.setAttribute("height", "0.25");
                    pointer1Bot.setAttribute("transform", "rotate(45 -3 97)");
                    pointer1Bot.setAttribute("fill", "#36c8d2");
                    this.bearing1FixedGroup.appendChild(pointer1Bot);
                }
            }
            {
                this.bearing2FixedGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.bearing2FixedGroup.setAttribute("display", "none");
                this.root.appendChild(this.bearing2FixedGroup);
                let botRightZone = document.createElementNS(Avionics.SVG.NS, "path");
                botRightZone.setAttribute("d", this.getExternalTextZonePath(57, Math.PI + 0.6, Math.PI + 1.1, 128, true));
                botRightZone.setAttribute("fill", "#1a1d21");
                this.bearing2FixedGroup.appendChild(botRightZone);
                this.bearing2Distance = document.createElementNS(Avionics.SVG.NS, "text");
                this.bearing2Distance.textContent = "16.2 NM";
                this.bearing2Distance.setAttribute("fill", "white");
                this.bearing2Distance.setAttribute("x", "127");
                this.bearing2Distance.setAttribute("y", "88");
                this.bearing2Distance.setAttribute("font-size", "6");
                this.bearing2Distance.setAttribute("font-family", "Roboto-Bold");
                this.bearing2Distance.setAttribute("text-anchor", "end");
                this.bearing2FixedGroup.appendChild(this.bearing2Distance);
                this.bearing2Ident = document.createElementNS(Avionics.SVG.NS, "text");
                this.bearing2Ident.textContent = "ATL";
                this.bearing2Ident.setAttribute("fill", "#36c8d2");
                this.bearing2Ident.setAttribute("x", "127");
                this.bearing2Ident.setAttribute("y", "94");
                this.bearing2Ident.setAttribute("font-size", "6");
                this.bearing2Ident.setAttribute("font-family", "Roboto-Bold");
                this.bearing2Ident.setAttribute("text-anchor", "end");
                this.bearing2FixedGroup.appendChild(this.bearing2Ident);
                this.bearing2Source = document.createElementNS(Avionics.SVG.NS, "text");
                this.bearing2Source.textContent = "NAV1";
                this.bearing2Source.setAttribute("fill", "white");
                this.bearing2Source.setAttribute("x", "127");
                this.bearing2Source.setAttribute("y", "100");
                this.bearing2Source.setAttribute("font-size", "6");
                this.bearing2Source.setAttribute("font-family", "Roboto-Bold");
                this.bearing2Source.setAttribute("text-anchor", "end");
                this.bearing2FixedGroup.appendChild(this.bearing2Source);
                let pointer2 = document.createElementNS(Avionics.SVG.NS, "path");
                pointer2.setAttribute("d", "M90 97 L92 97 M105 97 L103 97 L100 100 M103 97 L100 94 M101.5 98.5 L93 98.5 Q90 97 93 95.5 L101.5 95.5");
                pointer2.setAttribute("stroke", "#36c8d2");
                pointer2.setAttribute("stroke-width", "0.5");
                pointer2.setAttribute("fill-opacity", "0");
                this.bearing2FixedGroup.appendChild(pointer2);
            }
        }
    }
    /**
     * @param {HSIIndicatorModel} model 
     */
    setModel(model) {
        if (this.flightPhase) {
            model.flightPhase.subscribe(phase => {
                this.flightPhase.textContent = phase;
                let rect = this.flightPhase.getBBox();
                this.flightPhaseBg.setAttribute("width", (rect.width + 2).toString());
                this.flightPhaseBg.setAttribute("x", (rect.x - 1).toString());
            });
        }

        model.rotation.subscribe(rotation => {
            this.querySelector(".compass-background-circle").style.transform = "rotate(" + (-rotation) + "deg)";
            this.querySelector(".compass-overlay").style.transform = "rotate(" + (-rotation) + "deg)";
            if (this.bearingText) {
                let brg = Math.round(parseFloat(rotation));
                brg = (brg == 0) ? 360 : brg;
                this.bearingText.textContent = "000".slice(brg.toString().length) + brg + "°";
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
                this.course.setAttribute("transform", "rotate(" + (bearing) + ")");
            });
        }

        let showXtkText = new CombinedSubject([model.cdi.deviationAmount, model.cdi.source], (deviation, source) => {
            return deviation > 0.95 && source == "FMS"
        });
        showXtkText.subscribe(full => {
            this.crossTrackError.setAttribute("visibility", full ? "visible" : "hidden");
            this.crossTrackErrorBg.setAttribute("visibility", full ? "visible" : "hidden");
        });

        if (this.CDI) {
            model.cdi.deviationAmount.subscribe(deviation => {
                this.CDI.setAttribute("transform", `translate(${deviation * 20} 0)`);
            });
            model.cdi.deviation.subscribe(deviation => {
                deviation = parseFloat(deviation);
                if (this.sourceIsGps) {
                    this.crossTrackError.textContent = "XTK " + fastToFixed(deviation, 2) + "NM";
                    let courseDevRect = this.crossTrackError.getBBox();
                    this.crossTrackErrorBg.setAttribute("width", (courseDevRect.width + 2).toString());
                    this.crossTrackErrorBg.setAttribute("x", (courseDevRect.x - 1).toString());
                }
            });
            model.cdi.displayDeviation.subscribe(display => this.CDI.setAttribute("display", display ? "block" : "none"));
        }

        if (this.navSource) {
            model.cdi.source.subscribe(source => {
                this.navSource.textContent = source == "FMS" ? this.fmsAlias : source;
                let rect = this.navSource.getBBox();
                this.navSourceBg.setAttribute("width", (rect.width + 2).toString());
                this.navSourceBg.setAttribute("x", (rect.x - 1).toString());
                this.sourceIsGps = source == "FMS";
                switch (source) {
                    case "FMS":
                        this.course.setAttribute("fill", "#d12bc7");
                        this.beginArrow.setAttribute("stroke", "");
                        this.CDI.setAttribute("stroke", "");
                        this.endArrow.setAttribute("stroke", "");
                        this.flightPhase.setAttribute("visibility", "visible");
                        this.flightPhaseBg.setAttribute("visibility", "visible");
                        this.courseText.setAttribute("fill", "#ff00ff");
                        break;
                    case "VOR1":
                    case "LOC1":
                        this.course.setAttribute("fill", "#10c210");
                        this.beginArrow.setAttribute("stroke", "");
                        this.CDI.setAttribute("stroke", "");
                        this.endArrow.setAttribute("stroke", "");
                        this.navSource.setAttribute("fill", "#10c210");
                        this.flightPhase.setAttribute("visibility", "hidden");
                        this.flightPhaseBg.setAttribute("visibility", "hidden");
                        this.crossTrackError.setAttribute("visibility", "hidden");
                        this.crossTrackErrorBg.setAttribute("visibility", "hidden");
                        this.courseText.setAttribute("fill", "#00ff00");
                        break;
                    case "VOR2":
                    case "LOC2":
                        this.course.setAttribute("fill", "none");
                        this.beginArrow.setAttribute("stroke", "#10c210");
                        this.CDI.setAttribute("stroke", "#10c210");
                        this.endArrow.setAttribute("stroke", "#10c210");
                        this.navSource.setAttribute("fill", "#10c210");
                        this.flightPhase.setAttribute("visibility", "hidden");
                        this.flightPhaseBg.setAttribute("visibility", "hidden");
                        this.crossTrackError.setAttribute("visibility", "hidden");
                        this.crossTrackErrorBg.setAttribute("visibility", "hidden");
                        this.courseText.setAttribute("fill", "#00ff00");
                        break;
                }
            });
        };

        model.bearing[0].source.subscribe(source => {
            if (this.bearing1Source)
                this.bearing1Source.textContent = source;
        });

        model.bearing[0].ident.subscribe(ident => {
            if (this.bearing1Ident)
                this.bearing1Ident.textContent = ident;
        });

        model.bearing[0].distance.subscribe(distance => {
            if (this.bearing1Distance)
                this.bearing1Distance.textContent = distance == "" ? "" : fastToFixed(parseFloat(distance), 1) + " NM";
        });

        model.bearing[0].bearing.subscribe(bearing => {
            if (this.bearing1) {
                if (bearing != "") {
                    this.bearing1.setAttribute("transform", "rotate(" + bearing + ")");
                    this.bearing1.setAttribute("visibility", "visible");
                }
                else {
                    this.bearing1.setAttribute("visibility", "hidden");
                }
            }
        });

        model.bearing[1].source.subscribe(source => {
            if (this.bearing2Source)
                this.bearing2Source.textContent = source;
        });

        model.bearing[1].ident.subscribe(ident => {
            if (this.bearing2Ident)
                this.bearing2Ident.textContent = ident;
        });

        model.bearing[1].distance.subscribe(distance => {
            if (this.bearing2Distance)
                this.bearing2Distance.textContent = distance == "" ? "" : fastToFixed(parseFloat(distance), 1) + " NM";
        });

        model.bearing[1].bearing.subscribe(bearing => {
            if (this.bearing2) {
                if (bearing != "") {
                    this.bearing2.setAttribute("transform", "rotate(" + bearing + ")");
                    this.bearing2.setAttribute("visibility", "visible");
                }
                else {
                    this.bearing2.setAttribute("visibility", "hidden");
                }
            }
        });

        if (this.currentTrackIndicator)
            model.track.subscribe(track => this.currentTrackIndicator.setAttribute("transform", "rotate(" + (track) + ")"));
    }
    attributeChangedCallback(name, oldValue, newValue) {
        return;
        //if (name != "rotation")
        //    return;
        switch (name) {
            case "toggle_dme":
                this.isDmeDisplayed = !this.isDmeDisplayed;
                if (this.dme) {
                    if (this.isDmeDisplayed) {
                        this.dme.setAttribute("display", "inherit");
                    }
                    else {
                        this.dme.setAttribute("display", "none");
                    }
                }
                break;
            case "toggle_bearing1":
                this.isBearing1Displayed = !this.isBearing1Displayed;
                if (this.bearing1) {
                    if (this.isBearing1Displayed || this.isBearing2Displayed) {
                        this.innerCircle.setAttribute("display", "inherit");
                    }
                    else {
                        this.innerCircle.setAttribute("display", "none");
                    }
                    if (this.isBearing1Displayed) {
                        this.bearing1.setAttribute("display", "inherit");
                        this.bearing1FixedGroup.setAttribute("display", "inherit");
                    }
                    else {
                        this.bearing1.setAttribute("display", "none");
                        this.bearing1FixedGroup.setAttribute("display", "none");
                    }
                }
                break;
            case "toggle_bearing2":
                this.isBearing2Displayed = !this.isBearing2Displayed;
                if (this.bearing2) {
                    if (this.isBearing1Displayed || this.isBearing2Displayed) {
                        this.innerCircle.setAttribute("display", "inherit");
                    }
                    else {
                        this.innerCircle.setAttribute("display", "none");
                    }
                    if (this.isBearing2Displayed) {
                        this.bearing2.setAttribute("display", "inherit");
                        this.bearing2FixedGroup.setAttribute("display", "inherit");
                    }
                    else {
                        this.bearing2.setAttribute("display", "none");
                        this.bearing2FixedGroup.setAttribute("display", "none");
                    }
                }
                break;
        }
        if (oldValue == newValue)
            return;
        switch (name) {


            case "display_deviation":
                if (newValue == "True") {
                    this.CDI.setAttribute("display", "");
                }
                else {
                    this.CDI.setAttribute("display", "none");
                }
                break;


            case "crosstrack_full_error":
                this.crosstrackFullError = parseFloat(newValue);
                break;
            case "show_dme":
                this.isDmeDisplayed = newValue == "true";
                if (this.dme) {
                    if (this.isDmeDisplayed) {
                        this.dme.setAttribute("display", "inherit");
                    }
                    else {
                        this.dme.setAttribute("display", "none");
                    }
                }
                break;
            case "show_bearing1":
                this.isBearing1Displayed = newValue == "true";
                if (this.bearing1) {
                    if (this.isBearing1Displayed || this.isBearing2Displayed) {
                        this.innerCircle.setAttribute("display", "inherit");
                    }
                    else {
                        this.innerCircle.setAttribute("display", "none");
                    }
                    if (this.isBearing1Displayed) {
                        this.bearing1.setAttribute("display", "inherit");
                        this.bearing1FixedGroup.setAttribute("display", "inherit");
                    }
                    else {
                        this.bearing1.setAttribute("display", "none");
                        this.bearing1FixedGroup.setAttribute("display", "none");
                    }
                }
                break;
            case "show_bearing2":
                this.isBearing2Displayed = newValue == "true";
                if (this.bearing2) {
                    if (this.isBearing1Displayed || this.isBearing2Displayed) {
                        this.innerCircle.setAttribute("display", "inherit");
                    }
                    else {
                        this.innerCircle.setAttribute("display", "none");
                    }
                    if (this.isBearing2Displayed) {
                        this.bearing2.setAttribute("display", "inherit");
                        this.bearing2FixedGroup.setAttribute("display", "inherit");
                    }
                    else {
                        this.bearing2.setAttribute("display", "none");
                        this.bearing2FixedGroup.setAttribute("display", "none");
                    }
                }
                break;

            case "dme_source":
                if (this.dmeSource)
                    this.dmeSource.textContent = newValue;
                break;
            case "dme_ident":
                if (this.dmeIdent)
                    this.dmeIdent.textContent = newValue;
                break;
            case "dme_distance":
                if (this.dmeDistance)
                    this.dmeDistance.textContent = (newValue == "" ? "" : fastToFixed(parseFloat(newValue), 1) + " NM");
                break;
            case "to_from":
                if (this.toIndicator && this.fromIndicator) {
                    switch (newValue) {
                        case "0":
                            this.toIndicator.setAttribute("display", "none");
                            this.fromIndicator.setAttribute("display", "none");
                            break;
                        case "1":
                            this.toIndicator.setAttribute("display", "inherit");
                            this.fromIndicator.setAttribute("display", "none");
                            break;
                        case "2":
                            this.toIndicator.setAttribute("display", "none");
                            this.fromIndicator.setAttribute("display", "inherit");
                            break;
                    }
                }
                break;
            case "displaystyle":
                this.createSVG();
                break;
        }
    }
    getExternalTextZonePath(radius, beginAngle, endAngle, xEnd, reverse = false) {
        let beginX = 50 - (radius * Math.cos(beginAngle));
        let beginY = 50 - (radius * Math.sin(beginAngle));
        let endX = 50 - (radius * Math.cos(endAngle));
        let endY = 50 - (radius * Math.sin(endAngle));
        let path = "M" + beginX + " " + beginY + "L" + xEnd + " " + beginY + "L" + xEnd + " " + endY + "L" + endX + " " + endY;
        path += "A " + radius + " " + radius + " 0 0 " + (reverse ? 0 : 1) + " " + beginX + " " + beginY;
        return path;
    }
    applyHUDStyle(_elem) {
        _elem.setAttribute("fill", "rgb(26,29,33)");
        _elem.setAttribute("fill-opacity", "0.5");
        _elem.setAttribute("stroke", "rgb(255, 255, 255)");
        _elem.setAttribute("stroke-width", "0.75");
        _elem.setAttribute("stroke-opacity", "0.2");
    }
    init() {
    }
    update(_deltaTime) {
        return;
        var compass = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        var roundedCompass = fastToFixed(compass, 3);
        this.setAttribute("rotation", roundedCompass);
        //return;
        var turnRate = SimVar.GetSimVarValue("TURN INDICATOR RATE", "degree per second");
        this.setAttribute("turn_rate", turnRate);
        var heading = SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR", "degree");
        var roundedHeading = fastToFixed(heading, 3);
        this.setAttribute("heading_bug_rotation", roundedHeading);
        this.setAttribute("current_track", SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degrees"));
        this.logic_cdiSource = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool") ? 3 : SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number");
        switch (this.logic_cdiSource) {
            case 1:
                this.setAttribute("display_deviation", SimVar.GetSimVarValue("NAV HAS NAV:1", "boolean") != 0 ? "True" : "False");
                if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:1", "Bool")) {
                    this.setAttribute("nav_source", "LOC1");
                    this.setAttribute("course", SimVar.GetSimVarValue("NAV LOCALIZER:1", "degree").toString());
                }
                else {
                    this.setAttribute("nav_source", "VOR1");
                    this.setAttribute("course", SimVar.GetSimVarValue("NAV OBS:1", "degree").toString());
                }
                this.setAttribute("course_deviation", (SimVar.GetSimVarValue("NAV CDI:1", "number") / 127).toString());
                this.setAttribute("to_from", SimVar.GetSimVarValue("NAV TOFROM:1", "Enum").toString());
                break;
            case 2:
                this.setAttribute("display_deviation", SimVar.GetSimVarValue("NAV HAS NAV:2", "boolean") != 0 ? "True" : "False");
                if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:2", "Bool")) {
                    this.setAttribute("nav_source", "LOC2");
                    this.setAttribute("course", SimVar.GetSimVarValue("NAV LOCALIZER:2", "degree").toString());
                }
                else {
                    this.setAttribute("nav_source", "VOR2");
                    this.setAttribute("course", SimVar.GetSimVarValue("NAV OBS:2", "degree").toString());
                }
                this.setAttribute("course_deviation", (SimVar.GetSimVarValue("NAV CDI:2", "number") / 127).toString());
                this.setAttribute("to_from", SimVar.GetSimVarValue("NAV TOFROM:2", "Enum").toString());
                break;
            case 3:
                this.setAttribute("nav_source", "FMS");
                this.setAttribute("display_deviation", SimVar.GetSimVarValue("GPS WP NEXT ID", "string") != "" ? "True" : "False");
                this.setAttribute("course", SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree"));
                this.setAttribute("course_deviation", SimVar.GetSimVarValue("GPS WP CROSS TRK", "nautical mile"));
                this.setAttribute("to_from", "1");
                let curPhase = SimVar.GetSimVarValue("L:GPS_Current_Phase", "number");
                switch (curPhase) {
                    case 1:
                        this.setAttribute("flight_phase", "DPRT");
                        this.setAttribute("crosstrack_full_error", "0.3");
                        break;
                    case 2:
                        this.setAttribute("flight_phase", "TERM");
                        this.setAttribute("crosstrack_full_error", "1.0");
                        break;
                    case 4:
                        this.setAttribute("flight_phase", "OCN");
                        this.setAttribute("crosstrack_full_error", "4.0");
                        break;
                    default:
                        this.setAttribute("flight_phase", "ENR");
                        this.setAttribute("crosstrack_full_error", "2.0");
                        break;
                }
                break;
        }
        this.logic_brg1Source = SimVar.GetSimVarValue("L:PFD_BRG1_Source", "Number");
        if (this.logic_brg1Source)
            this.setAttribute("show_bearing1", "true");
        else
            this.setAttribute("show_bearing1", "false");
        switch (this.logic_brg1Source) {
            case 1:
                this.setAttribute("bearing1_source", "NAV1");
                if (SimVar.GetSimVarValue("NAV HAS NAV:1", "Bool")) {
                    this.setAttribute("bearing1_ident", SimVar.GetSimVarValue("NAV IDENT:1", "string"));
                    this.setAttribute("bearing1_distance", SimVar.GetSimVarValue("NAV HAS DME:1", "Bool") ? SimVar.GetSimVarValue("NAV DME:1", "nautical miles") : "");
                    this.setAttribute("bearing1_bearing", ((180 + SimVar.GetSimVarValue("NAV RADIAL:1", "degree")) % 360).toString());
                }
                else {
                    this.setAttribute("bearing1_ident", "NO DATA");
                    this.setAttribute("bearing1_distance", "");
                    this.setAttribute("bearing1_bearing", "");
                }
                break;
            case 2:
                this.setAttribute("bearing1_source", "NAV2");
                if (SimVar.GetSimVarValue("NAV HAS NAV:2", "Bool")) {
                    this.setAttribute("bearing1_ident", SimVar.GetSimVarValue("NAV IDENT:2", "string"));
                    this.setAttribute("bearing1_distance", SimVar.GetSimVarValue("NAV HAS DME:2", "Bool") ? SimVar.GetSimVarValue("NAV DME:2", "nautical miles") : "");
                    this.setAttribute("bearing1_bearing", ((180 + SimVar.GetSimVarValue("NAV RADIAL:2", "degree")) % 360).toString());
                }
                else {
                    this.setAttribute("bearing1_ident", "NO DATA");
                    this.setAttribute("bearing1_distance", "");
                    this.setAttribute("bearing1_bearing", "");
                }
                break;
            case 3:
                this.setAttribute("bearing1_source", "GPS");
                this.setAttribute("bearing1_ident", SimVar.GetSimVarValue("GPS WP NEXT ID", "string"));
                this.setAttribute("bearing1_distance", SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical miles"));
                this.setAttribute("bearing1_bearing", SimVar.GetSimVarValue("GPS WP BEARING", "degree"));
                break;
            case 4:
                this.setAttribute("bearing1_source", "ADF");
                this.setAttribute("bearing1_distance", "");
                if (SimVar.GetSimVarValue("ADF SIGNAL:1", "number")) {
                    this.setAttribute("bearing1_ident", fastToFixed(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz"), 1));
                    this.setAttribute("bearing1_bearing", ((SimVar.GetSimVarValue("ADF RADIAL:1", "degree") + compass) % 360).toString());
                }
                else {
                    this.setAttribute("bearing1_ident", "NO DATA");
                    this.setAttribute("bearing1_bearing", "");
                }
                break;
        }
        this.logic_brg2Source = SimVar.GetSimVarValue("L:PFD_BRG2_Source", "Number");
        if (this.logic_brg2Source)
            this.setAttribute("show_bearing2", "true");
        else
            this.setAttribute("show_bearing2", "false");
        switch (this.logic_brg2Source) {
            case 1:
                this.setAttribute("bearing2_source", "NAV1");
                if (SimVar.GetSimVarValue("NAV HAS NAV:1", "Bool")) {
                    this.setAttribute("bearing2_ident", SimVar.GetSimVarValue("NAV IDENT:1", "string"));
                    this.setAttribute("bearing2_distance", SimVar.GetSimVarValue("NAV HAS DME:1", "Bool") ? SimVar.GetSimVarValue("NAV DME:1", "nautical miles") : "");
                    this.setAttribute("bearing2_bearing", ((180 + SimVar.GetSimVarValue("NAV RADIAL:1", "degree")) % 360).toString());
                }
                else {
                    this.setAttribute("bearing2_ident", "NO DATA");
                    this.setAttribute("bearing2_distance", "");
                    this.setAttribute("bearing2_bearing", "");
                }
                break;
            case 2:
                this.setAttribute("bearing2_source", "NAV2");
                if (SimVar.GetSimVarValue("NAV HAS NAV:2", "Bool")) {
                    this.setAttribute("bearing2_ident", SimVar.GetSimVarValue("NAV IDENT:2", "string"));
                    this.setAttribute("bearing2_distance", SimVar.GetSimVarValue("NAV HAS DME:2", "Bool") ? SimVar.GetSimVarValue("NAV DME:2", "nautical miles") : "");
                    this.setAttribute("bearing2_bearing", ((180 + SimVar.GetSimVarValue("NAV RADIAL:2", "degree")) % 360).toString());
                }
                else {
                    this.setAttribute("bearing2_ident", "NO DATA");
                    this.setAttribute("bearing2_distance", "");
                    this.setAttribute("bearing2_bearing", "");
                }
                break;
            case 3:
                this.setAttribute("bearing2_source", "GPS");
                this.setAttribute("bearing2_ident", SimVar.GetSimVarValue("GPS WP NEXT ID", "string"));
                this.setAttribute("bearing2_distance", SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical miles"));
                this.setAttribute("bearing2_bearing", SimVar.GetSimVarValue("GPS WP BEARING", "degree"));
                break;
            case 4:
                this.setAttribute("bearing2_source", "ADF");
                this.setAttribute("bearing2_distance", "");
                if (SimVar.GetSimVarValue("ADF SIGNAL:1", "number")) {
                    this.setAttribute("bearing2_ident", fastToFixed(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz"), 1));
                    this.setAttribute("bearing2_bearing", ((SimVar.GetSimVarValue("ADF RADIAL:1", "degree") + compass) % 360).toString());
                }
                else {
                    this.setAttribute("bearing2_ident", "NO DATA");
                    this.setAttribute("bearing2_bearing", "");
                }
                break;
        }
        this.logic_dmeDisplayed = SimVar.GetSimVarValue("L:PFD_DME_Displayed", "number");
        if (this.logic_dmeDisplayed) {
            this.setAttribute("show_dme", "true");
        }
        else {
            this.setAttribute("show_dme", "false");
        }
        this.logic_dmeSource = SimVar.GetSimVarValue("L:Glasscockpit_DmeSource", "Number");
        switch (this.logic_dmeSource) {
            case 0:
                SimVar.SetSimVarValue("L:Glasscockpit_DmeSource", "Number", 1);
            case 1:
                this.setAttribute("dme_source", "NAV1");
                if (SimVar.GetSimVarValue("NAV HAS DME:1", "Bool")) {
                    this.setAttribute("dme_ident", fastToFixed(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:1", "MHz"), 2));
                    this.setAttribute("dme_distance", SimVar.GetSimVarValue("NAV DME:1", "nautical miles"));
                }
                else {
                    this.setAttribute("dme_ident", "");
                    this.setAttribute("dme_distance", "");
                }
                break;
            case 2:
                this.setAttribute("dme_source", "NAV2");
                if (SimVar.GetSimVarValue("NAV HAS DME:2", "Bool")) {
                    this.setAttribute("dme_ident", fastToFixed(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:2", "MHz"), 2));
                    this.setAttribute("dme_distance", SimVar.GetSimVarValue("NAV DME:2", "nautical miles"));
                }
                else {
                    this.setAttribute("dme_ident", "");
                    this.setAttribute("dme_distance", "");
                }
                break;
        }
        let diff = this.crossTrackGoal - this.crossTrackCurrent;
        let toAdd = (_deltaTime / 1000) * diff * 7.5;
        if (Math.abs(toAdd) < 0.75) {
            toAdd = toAdd > 0 ? 0.75 : -0.75;
        }
        if (Math.abs(diff) < 0.1 || Math.abs(toAdd) > Math.abs(diff)) {
            this.crossTrackCurrent = this.crossTrackGoal;
        }
        else {
            this.crossTrackCurrent += toAdd;
        }
        Avionics.Utils.diffAndSetAttribute(this.CDI, "transform", "translate(" + this.crossTrackCurrent + " 0)");
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "CRS_INC":
                if (this.logic_cdiSource == 1) {
                    SimVar.SetSimVarValue("K:VOR1_OBI_INC", "number", 0);
                }
                else if (this.logic_cdiSource == 2) {
                    SimVar.SetSimVarValue("K:VOR2_OBI_INC", "number", 0);
                }
                break;
            case "CRS_DEC":
                if (this.logic_cdiSource == 1) {
                    SimVar.SetSimVarValue("K:VOR1_OBI_DEC", "number", 0);
                }
                else if (this.logic_cdiSource == 2) {
                    SimVar.SetSimVarValue("K:VOR2_OBI_DEC", "number", 0);
                }
                break;
            case "CRS_PUSH":
                if (this.logic_cdiSource == 1) {
                    SimVar.SetSimVarValue("K:VOR1_SET", "number", ((180 + SimVar.GetSimVarValue("NAV RADIAL:1", "degree")) % 360));
                }
                else if (this.logic_cdiSource == 2) {
                    SimVar.SetSimVarValue("K:VOR2_SET", "number", ((180 + SimVar.GetSimVarValue("NAV RADIAL:2", "degree")) % 360));
                }
                break;
            case "SoftKeys_PFD_DME":
                this.logic_dmeDisplayed = !this.logic_dmeDisplayed;
                SimVar.SetSimVarValue("L:PFD_DME_Displayed", "number", this.logic_dmeDisplayed ? 1 : 0);
                WTDataStore.set("HSI.ShowDme", this.logic_dmeDisplayed);
                if (this.logic_dmeDisplayed) {
                    this.setAttribute("show_dme", "true");
                }
                else {
                    this.setAttribute("show_dme", "false");
                }
                break;
            case "SoftKeys_PFD_BRG1":
            case "BRG1Switch":
                this.logic_brg1Source = (this.logic_brg1Source + 1) % 5;
                SimVar.SetSimVarValue("L:PFD_BRG1_Source", "number", this.logic_brg1Source);
                WTDataStore.set("HSI.Brg1Src", this.logic_brg1Source);
                if (this.logic_brg1Source == 0) {
                    this.setAttribute("show_bearing1", "false");
                }
                else {
                    this.setAttribute("show_bearing1", "true");
                }
                break;
            case "SoftKeys_PFD_BRG2":
            case "BRG2Switch":
                this.logic_brg2Source = (this.logic_brg2Source + 1) % 5;
                SimVar.SetSimVarValue("L:PFD_BRG2_Source", "number", this.logic_brg2Source);
                WTDataStore.set("HSI.Brg2Src", this.logic_brg2Source);
                if (this.logic_brg2Source == 0) {
                    this.setAttribute("show_bearing2", "false");
                }
                else {
                    this.setAttribute("show_bearing2", "true");
                }
                break;
            case "SoftKey_CDI":
            case "NavSourceSwitch":
                this.logic_cdiSource = (this.logic_cdiSource % 3) + 1;
                let isGPSDrived = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool");
                if (this.logic_cdiSource == 2 && !SimVar.GetSimVarValue("NAV AVAILABLE:2", "Bool")) {
                    this.logic_cdiSource = 3;
                }
                if (this.logic_cdiSource == 3 != isGPSDrived) {
                    SimVar.SetSimVarValue("K:TOGGLE_GPS_DRIVES_NAV1", "Bool", 0);
                }
                if (this.logic_cdiSource != 3) {
                    SimVar.SetSimVarValue("K:AP_NAV_SELECT_SET", "number", this.logic_cdiSource);
                }
                break;
        }
    }
}
function getSize(_elementPercent, _canvasSize) {
    return _elementPercent * _canvasSize / 100;
}
customElements.define('glasscockpit-hsi', HSIndicator);
//# sourceMappingURL=HSIndicator.js.map