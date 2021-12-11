var SlipSkidDisplayMode;
(function (SlipSkidDisplayMode) {
    SlipSkidDisplayMode[SlipSkidDisplayMode["ROUND"] = 0] = "ROUND";
    SlipSkidDisplayMode[SlipSkidDisplayMode["DEFAULT"] = 1] = "DEFAULT";
})(SlipSkidDisplayMode || (SlipSkidDisplayMode = {}));
class AttitudeIndicator extends HTMLElement {
    constructor() {
        super();
        this.bankSizeRatio = -24;
        this.backgroundVisible = true;
        this.bottomY = undefined;
        this.turnRateIndicatorShown = false;
        this.turnRateIndicatorMarkerX = 80;
        this.flightDirectorActive = false;
        this.flightDirectorPitch = 0;
        this.flightDirectorBank = 0;
        this.aspectRatio = 1.0;
        this.isBackup = false;
        this.horizonTopColor = "#004cff";
        this.horizonTopColorHorizon = "#4664e7";
        this.horizonBottomColor = "#54350a";
        this.strokeWidth = 3;
        this.syntheticVision = false;
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
    parseDefinitionAttributes() {
        let isVerticalCenter = this.getAttribute("vertical-center");
        if (isVerticalCenter) {
            this.isVerticalCenter = (isVerticalCenter == "True");
        }
        switch (this.getAttribute("slip-skid-display-mode")) {
            case "Round":
                this.slipSkidDisplayMode = SlipSkidDisplayMode.ROUND;
                break;
            default:
                this.slipSkidDisplayMode = SlipSkidDisplayMode.DEFAULT;
                break;
        }
        let turnRateIndicatorShown = this.getAttribute("show-turn-rate");
        if (turnRateIndicatorShown) {
            this.turnRateIndicatorShown = (turnRateIndicatorShown == "True");
        }
        let bottomY = this.getAttribute("bottom-y");
        if (bottomY) {
            this.bottomY = parseFloat(bottomY);
        }
    }
    connectedCallback() {
        this.parseDefinitionAttributes();
        this.construct();
    }
    buildGraduations() {
        if (!this.attitude_pitch)
            return;
        this.attitude_pitch.innerHTML = "";
        let maxDash = 80;
        let fullPrecisionLowerLimit = -20;
        let fullPrecisionUpperLimit = 20;
        let halfPrecisionLowerLimit = -30;
        let halfPrecisionUpperLimit = 45;
        let unusualAttitudeLowerLimit = -30;
        let unusualAttitudeUpperLimit = 50;
        let bigWidth = 120;
        let bigHeight = 3;
        let mediumWidth = 60;
        let mediumHeight = 3;
        let smallWidth = 40;
        let smallHeight = 2;
        let fontSize = 20;
        let angle = -maxDash;
        let nextAngle;
        let width;
        let height;
        let text;
        while (angle <= maxDash) {
            if (angle % 10 == 0) {
                width = bigWidth;
                height = bigHeight;
                text = true;
                if (angle >= fullPrecisionLowerLimit && angle < fullPrecisionUpperLimit) {
                    nextAngle = angle + 2.5;
                }
                else if (angle >= halfPrecisionLowerLimit && angle < halfPrecisionUpperLimit) {
                    nextAngle = angle + 5;
                }
                else {
                    nextAngle = angle + 10;
                }
            }
            else {
                if (angle % 5 == 0) {
                    width = mediumWidth;
                    height = mediumHeight;
                    text = true;
                    if (angle >= fullPrecisionLowerLimit && angle < fullPrecisionUpperLimit) {
                        nextAngle = angle + 2.5;
                    }
                    else {
                        nextAngle = angle + 5;
                    }
                }
                else {
                    width = smallWidth;
                    height = smallHeight;
                    nextAngle = angle + 2.5;
                    text = false;
                }
            }
            if (angle != 0) {
                let rect = document.createElementNS(Avionics.SVG.NS, "rect");
                diffAndSetAttribute(rect, "fill", "white");
                diffAndSetAttribute(rect, "x", (-width / 2).toString());
                diffAndSetAttribute(rect, "y", (this.bankSizeRatio * angle - height / 2).toString());
                diffAndSetAttribute(rect, "width", width.toString());
                diffAndSetAttribute(rect, "height", height.toString());
                this.attitude_pitch.appendChild(rect);
                if (text) {
                    let leftText = document.createElementNS(Avionics.SVG.NS, "text");
                    leftText.textContent = Math.abs(angle).toString();
                    diffAndSetAttribute(leftText, "x", ((-width / 2) - 5).toString());
                    diffAndSetAttribute(leftText, "y", (this.bankSizeRatio * angle - height / 2 + fontSize / 2).toString());
                    diffAndSetAttribute(leftText, "text-anchor", "end");
                    diffAndSetAttribute(leftText, "font-size", fontSize.toString());
                    diffAndSetAttribute(leftText, "font-family", "Roboto-Bold");
                    diffAndSetAttribute(leftText, "fill", "white");
                    this.attitude_pitch.appendChild(leftText);
                    let rightText = document.createElementNS(Avionics.SVG.NS, "text");
                    rightText.textContent = Math.abs(angle).toString();
                    diffAndSetAttribute(rightText, "x", ((width / 2) + 5).toString());
                    diffAndSetAttribute(rightText, "y", (this.bankSizeRatio * angle - height / 2 + fontSize / 2).toString());
                    diffAndSetAttribute(rightText, "text-anchor", "start");
                    diffAndSetAttribute(rightText, "font-size", fontSize.toString());
                    diffAndSetAttribute(rightText, "font-family", "Roboto-Bold");
                    diffAndSetAttribute(rightText, "fill", "white");
                    this.attitude_pitch.appendChild(rightText);
                }
                if (angle < unusualAttitudeLowerLimit) {
                    let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                    let path = "M" + -smallWidth / 2 + " " + (this.bankSizeRatio * nextAngle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                    path += "L" + bigWidth / 2 + " " + (this.bankSizeRatio * angle - bigHeight / 2) + " l" + -smallWidth + " 0 ";
                    path += "L0 " + (this.bankSizeRatio * nextAngle + 20) + " ";
                    path += "L" + (-bigWidth / 2 + smallWidth) + " " + (this.bankSizeRatio * angle - bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                    diffAndSetAttribute(chevron, "d", path);
                    diffAndSetAttribute(chevron, "fill", "red");
                    this.attitude_pitch.appendChild(chevron);
                }
                if (angle >= unusualAttitudeUpperLimit && nextAngle <= maxDash) {
                    let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                    let path = "M" + -smallWidth / 2 + " " + (this.bankSizeRatio * angle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                    path += "L" + (bigWidth / 2) + " " + (this.bankSizeRatio * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 ";
                    path += "L0 " + (this.bankSizeRatio * angle - 20) + " ";
                    path += "L" + (-bigWidth / 2 + smallWidth) + " " + (this.bankSizeRatio * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                    diffAndSetAttribute(chevron, "d", path);
                    diffAndSetAttribute(chevron, "fill", "red");
                    this.attitude_pitch.appendChild(chevron);
                }
            }
            angle = nextAngle;
        }
    }
    construct() {
        Utils.RemoveAllChildren(this);
        if (!this.bottomY) {
            this.bottomY = this.isVerticalCenter ? 150 : 100;
        }
        {
            this.horizon = document.createElementNS(Avionics.SVG.NS, "svg");
            let defs = document.createElementNS(Avionics.SVG.NS, "defs");
            defs.innerHTML = `
                <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${this.horizonTopColor};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${this.horizonTopColorHorizon};stop-opacity:1" />
                </linearGradient>`;
            this.horizon.appendChild(defs);
            diffAndSetAttribute(this.horizon, "width", "100%");
            diffAndSetAttribute(this.horizon, "height", "100%");
            diffAndSetAttribute(this.horizon, "viewBox", this.isVerticalCenter ? "-200 -150 400 300" : "-200 -200 400 300");
            diffAndSetAttribute(this.horizon, "x", "-100");
            diffAndSetAttribute(this.horizon, "y", "-100");
            diffAndSetAttribute(this.horizon, "overflow", "visible");
            diffAndSetAttribute(this.horizon, "style", "position:absolute; z-index: -2; width: 100%; height:100%;");
            this.appendChild(this.horizon);
            this.horizonTop = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(this.horizonTop, "fill", (this.backgroundVisible) ? this.horizonTopColor : "transparent");
            diffAndSetAttribute(this.horizonTop, "x", "-1500");
            diffAndSetAttribute(this.horizonTop, "y", "-1000");
            diffAndSetAttribute(this.horizonTop, "width", "3000");
            diffAndSetAttribute(this.horizonTop, "height", "2000");
            this.horizon.appendChild(this.horizonTop);
            this.bottomPart = document.createElementNS(Avionics.SVG.NS, "g");
            this.horizon.appendChild(this.bottomPart);
            this.horizonTopGradient = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(this.horizonTopGradient, "fill", (this.backgroundVisible) ? "url(#sky)" : "transparent");
            diffAndSetAttribute(this.horizonTopGradient, "x", "-1500");
            diffAndSetAttribute(this.horizonTopGradient, "y", "-200");
            diffAndSetAttribute(this.horizonTopGradient, "width", "3000");
            diffAndSetAttribute(this.horizonTopGradient, "height", "200");
            this.bottomPart.appendChild(this.horizonTopGradient);
            this.horizonBottom = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(this.horizonBottom, "fill", (this.backgroundVisible) ? this.horizonBottomColor : "transparent");
            diffAndSetAttribute(this.horizonBottom, "x", "-1500");
            diffAndSetAttribute(this.horizonBottom, "y", "0");
            diffAndSetAttribute(this.horizonBottom, "width", "3000");
            diffAndSetAttribute(this.horizonBottom, "height", "3000");
            this.bottomPart.appendChild(this.horizonBottom);
            let separator = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(separator, "fill", "#e0e0e0");
            diffAndSetAttribute(separator, "x", "-1500");
            diffAndSetAttribute(separator, "y", "-3");
            diffAndSetAttribute(separator, "width", "3000");
            diffAndSetAttribute(separator, "height", "6");
            this.bottomPart.appendChild(separator);
        }
        let attitudeContainer = document.createElement("div");
        diffAndSetAttribute(attitudeContainer, "id", "Attitude");
        attitudeContainer.style.width = "100%";
        attitudeContainer.style.height = "100%";
        attitudeContainer.style.position = "absolute";
        this.appendChild(attitudeContainer);
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        diffAndSetAttribute(this.root, "width", "100%");
        diffAndSetAttribute(this.root, "height", "100%");
        diffAndSetAttribute(this.root, "viewBox", "-200 -200 400 300");
        diffAndSetAttribute(this.root, "overflow", "visible");
        diffAndSetAttribute(this.root, "style", "position:absolute");
        attitudeContainer.appendChild(this.root);
        var refHeight = (this.isBackup) ? 330 : 230;
        let y = (this.isVerticalCenter) ? -80 : -130;
        let attitude_pitch_container = document.createElementNS(Avionics.SVG.NS, "svg");
        diffAndSetAttribute(attitude_pitch_container, "width", "300");
        diffAndSetAttribute(attitude_pitch_container, "height", refHeight.toString());
        diffAndSetAttribute(attitude_pitch_container, "x", "-150");
        diffAndSetAttribute(attitude_pitch_container, "y", y + '');
        diffAndSetAttribute(attitude_pitch_container, "viewBox", "-115 " + y + " 230 " + refHeight + '');
        diffAndSetAttribute(attitude_pitch_container, "overflow", "hidden");
        this.root.appendChild(attitude_pitch_container);
        this.attitude_pitch = document.createElementNS(Avionics.SVG.NS, "g");
        attitude_pitch_container.appendChild(this.attitude_pitch);
        this.buildGraduations();
        this.flightDirector = document.createElementNS(Avionics.SVG.NS, "g");
        attitude_pitch_container.appendChild(this.flightDirector);
        let triangleOuterLeft = document.createElementNS(Avionics.SVG.NS, "path");
        diffAndSetAttribute(triangleOuterLeft, "d", "M-140 30 l50 0 L0 0 Z");
        diffAndSetAttribute(triangleOuterLeft, "fill", "#d12bc7");
        //this.flightDirector.appendChild(triangleOuterLeft);
        let triangleOuterRight = document.createElementNS(Avionics.SVG.NS, "path");
        diffAndSetAttribute(triangleOuterRight, "d", "M140 30 l-50 0 L0 0 Z");
        diffAndSetAttribute(triangleOuterRight, "fill", "#d12bc7");
        //this.flightDirector.appendChild(triangleOuterRight);
        let topY = this.isVerticalCenter ? -120 : -170;

        let triangleHeight = 16;
        let triangleHalfHeight = triangleHeight / 2;
        let triangleWidth = 110;
        let triangleWidthSmall = 50;
        let trianglePitch = 30;
        let originOffsetX = 5;
        let flightDirectorTriangle = 20;
        let flightDirectorTriangleHeight = flightDirectorTriangle / 2;
        let flightDirectorWidth = triangleWidth;
        // Left
        {
            let triangle = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(triangle, "d", `M-${flightDirectorWidth} ${trianglePitch} l-${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} L-${originOffsetX} 0 Z`);
            diffAndSetAttribute(triangle, "fill", "transparent");
            diffAndSetAttribute(triangle, "stroke", "#000000");
            diffAndSetAttribute(triangle, "stroke-width", this.strokeWidth);
            diffAndSetAttribute(triangle, "stroke-linejoin", "miter");
            this.flightDirector.appendChild(triangle);
        }
        {
            let triangle = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(triangle, "d", `M-${flightDirectorWidth} ${trianglePitch} l-${flightDirectorTriangle} -${flightDirectorTriangleHeight} L-${originOffsetX} 0 Z`);
            diffAndSetAttribute(triangle, "fill", "#d12bc7");
            this.flightDirector.appendChild(triangle);
        }
        {
            let triangle = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(triangle, "d", `M-${flightDirectorWidth} ${trianglePitch} l-${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} Z`);
            diffAndSetAttribute(triangle, "fill", "#990891");
            this.flightDirector.appendChild(triangle);
        }
        // Right indicator
        {
            let triangle = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(triangle, "d", `M${flightDirectorWidth} ${trianglePitch} l${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} L${originOffsetX} 0 Z`);
            diffAndSetAttribute(triangle, "fill", "transparent");
            diffAndSetAttribute(triangle, "stroke", "#000000");
            diffAndSetAttribute(triangle, "stroke-width", this.strokeWidth);
            diffAndSetAttribute(triangle, "stroke-linejoin", "miter");
            this.flightDirector.appendChild(triangle);
        }
        {
            let triangle = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(triangle, "d", `M${flightDirectorWidth} ${trianglePitch} l${flightDirectorTriangle} -${flightDirectorTriangleHeight} L${originOffsetX} 0 Z`);
            diffAndSetAttribute(triangle, "fill", "#d12bc7");
            this.flightDirector.appendChild(triangle);
        }
        {
            let triangle = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(triangle, "d", `M${flightDirectorWidth} ${trianglePitch} l${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} Z`);
            diffAndSetAttribute(triangle, "fill", "#990891");
            this.flightDirector.appendChild(triangle);
        }

        {
            this.attitude_bank = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(this.attitude_bank);
            let topTriangle = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(topTriangle, "d", "M0 " + topY + " l -20 -30 l40 0 Z");
            diffAndSetAttribute(topTriangle, "fill", "white");
            this.attitude_bank.appendChild(topTriangle);
            let bigDashes = [-60, -30, 30, 60];
            let smallDashes = [-45, -20, -10, 10, 20, 45];
            let radius = -topY;
            let width = 4;
            let height = 30;
            for (let i = 0; i < bigDashes.length; i++) {
                let dash = document.createElementNS(Avionics.SVG.NS, "rect");
                diffAndSetAttribute(dash, "x", (-width / 2).toString());
                diffAndSetAttribute(dash, "y", (-radius - height).toString());
                diffAndSetAttribute(dash, "height", height.toString());
                diffAndSetAttribute(dash, "width", width.toString());
                diffAndSetAttribute(dash, "fill", "white");
                diffAndSetAttribute(dash, "transform", "rotate(" + bigDashes[i] + ",0,0)");
                this.attitude_bank.appendChild(dash);
            }
            width = 4;
            height = 20;
            for (let i = 0; i < smallDashes.length; i++) {
                let dash = document.createElementNS(Avionics.SVG.NS, "rect");
                diffAndSetAttribute(dash, "x", (-width / 2).toString());
                diffAndSetAttribute(dash, "y", (-radius - height).toString());
                diffAndSetAttribute(dash, "height", height.toString());
                diffAndSetAttribute(dash, "width", width.toString());
                diffAndSetAttribute(dash, "fill", "white");
                diffAndSetAttribute(dash, "transform", "rotate(" + smallDashes[i] + ",0,0)");
                this.attitude_bank.appendChild(dash);
            }
        }
        {
            if (this.turnRateIndicatorShown) {
                let turnRateIndicatorGroup = document.createElementNS(Avionics.SVG.NS, 'g');
                diffAndSetAttribute(turnRateIndicatorGroup, "id", "turnRateIndicator");
                this.turnRateIndicatorY = this.bottomY - 15;
                this.turnRateIndicatorHeight = 15;
                let w = 2;
                this.turnRateIndicator = document.createElementNS(Avionics.SVG.NS, "rect");
                diffAndSetAttribute(this.turnRateIndicator, "fill", "#eb008b");
                diffAndSetAttribute(this.turnRateIndicator, "width", "0");
                diffAndSetAttribute(this.turnRateIndicator, "height", this.turnRateIndicatorHeight + '');
                diffAndSetAttribute(this.turnRateIndicator, "x", "0");
                diffAndSetAttribute(this.turnRateIndicator, "y", this.turnRateIndicatorY + '');
                turnRateIndicatorGroup.appendChild(this.turnRateIndicator);
                let leftMarker = document.createElementNS(Avionics.SVG.NS, "rect");
                diffAndSetAttribute(leftMarker, "fill", "white");
                diffAndSetAttribute(leftMarker, "width", w + '');
                diffAndSetAttribute(leftMarker, "height", this.turnRateIndicatorHeight + '');
                diffAndSetAttribute(leftMarker, "x", (-this.turnRateIndicatorMarkerX - w / 2) + '');
                diffAndSetAttribute(leftMarker, "y", this.turnRateIndicatorY + '');
                turnRateIndicatorGroup.appendChild(leftMarker);
                let rightMarker = document.createElementNS(Avionics.SVG.NS, "rect");
                diffAndSetAttribute(rightMarker, "fill", "white");
                diffAndSetAttribute(rightMarker, "width", w + '');
                diffAndSetAttribute(rightMarker, "height", this.turnRateIndicatorHeight + '');
                diffAndSetAttribute(rightMarker, "x", (this.turnRateIndicatorMarkerX - w / 2) + '');
                diffAndSetAttribute(rightMarker, "y", this.turnRateIndicatorY + '');
                turnRateIndicatorGroup.appendChild(rightMarker);
                let centerMarker = document.createElementNS(Avionics.SVG.NS, "rect");
                diffAndSetAttribute(centerMarker, "fill", "black");
                diffAndSetAttribute(centerMarker, "width", '1');
                diffAndSetAttribute(centerMarker, "height", this.turnRateIndicatorHeight + '');
                diffAndSetAttribute(centerMarker, "x", '-0.5');
                diffAndSetAttribute(centerMarker, "y", this.turnRateIndicatorY + '');
                turnRateIndicatorGroup.appendChild(centerMarker);
                this.root.appendChild(turnRateIndicatorGroup);
            }
        }
        {
            let cursors = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(cursors);
            let leftBackground = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(leftBackground, "d", "M-190 0 l-10 12 l50 0 l10 -12 l-10 -12 l-50 0 l10 12 Z");
            diffAndSetAttribute(leftBackground, "stroke", "#000000");
            diffAndSetAttribute(leftBackground, "stroke-width", this.strokeWidth);
            cursors.appendChild(leftBackground);
            let leftLower = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(leftLower, "d", "M-190 0 l-10 12 l50 0 l10 -12 Z");
            diffAndSetAttribute(leftLower, "fill", "#cccc00");
            cursors.appendChild(leftLower);
            let leftUpper = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(leftUpper, "d", "M-190 0 l-10 -12 l50 0 l10 12 Z");
            diffAndSetAttribute(leftUpper, "fill", "#ffff00");
            cursors.appendChild(leftUpper);
            let rightBackground = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(rightBackground, "d", "M190 0 l10 12 l-50 0 l-10 -12 l10 -12 l50 0 l-10 12 Z");
            diffAndSetAttribute(rightBackground, "stroke", "#000000");
            diffAndSetAttribute(rightBackground, "stroke-width", this.strokeWidth);
            cursors.appendChild(rightBackground);
            let rightLower = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(rightLower, "d", "M190 0 l10 12 l-50 0 l-10 -12 Z");
            diffAndSetAttribute(rightLower, "fill", "#cccc00");
            cursors.appendChild(rightLower);
            let rightUpper = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(rightUpper, "d", "M190 0 l10 -12 l-50 0 l-10 12 Z");
            diffAndSetAttribute(rightUpper, "fill", "#ffff00");
            cursors.appendChild(rightUpper);
            // Left indicator
            {
                let triangle = document.createElementNS(Avionics.SVG.NS, "path");
                diffAndSetAttribute(triangle, "d", `M-${triangleWidth} ${trianglePitch} l${triangleWidthSmall} 0 L-${originOffsetX} 0 Z`);
                diffAndSetAttribute(triangle, "fill", "transparent");
                diffAndSetAttribute(triangle, "stroke", "#000000");
                diffAndSetAttribute(triangle, "stroke-width", this.strokeWidth);
                diffAndSetAttribute(triangle, "stroke-linejoin", "miter");
                cursors.appendChild(triangle);
            }
            {
                let triangle = document.createElementNS(Avionics.SVG.NS, "path");
                diffAndSetAttribute(triangle, "d", `M-${triangleWidth} ${trianglePitch} l${triangleWidthSmall} 0 L-${originOffsetX} 0 Z`);
                diffAndSetAttribute(triangle, "fill", "#ffff00");
                cursors.appendChild(triangle);
            }
            {
                let triangle = document.createElementNS(Avionics.SVG.NS, "path");
                diffAndSetAttribute(triangle, "d", `M-${triangleWidth - triangleWidthSmall / 2} ${trianglePitch} l${triangleWidthSmall / 2} 0 L-${originOffsetX} 0 Z`);
                diffAndSetAttribute(triangle, "fill", "#a4a400");
                cursors.appendChild(triangle);
            }
            // Right indicator
            {
                let triangle = document.createElementNS(Avionics.SVG.NS, "path");
                diffAndSetAttribute(triangle, "d", `M${triangleWidth} ${trianglePitch} l-${triangleWidthSmall} 0 L${originOffsetX} 0 Z`);
                diffAndSetAttribute(triangle, "fill", "transparent");
                diffAndSetAttribute(triangle, "stroke", "#000000");
                diffAndSetAttribute(triangle, "stroke-width", this.strokeWidth);
                diffAndSetAttribute(triangle, "stroke-linejoin", "miter");
                cursors.appendChild(triangle);
            }
            {
                let triangle = document.createElementNS(Avionics.SVG.NS, "path");
                diffAndSetAttribute(triangle, "d", `M${triangleWidth} ${trianglePitch} l-${triangleWidthSmall} 0 L${originOffsetX} 0 Z`);
                diffAndSetAttribute(triangle, "fill", "#ffff00");
                cursors.appendChild(triangle);
            }
            {
                let triangle = document.createElementNS(Avionics.SVG.NS, "path");
                diffAndSetAttribute(triangle, "d", `M${triangleWidth - triangleWidthSmall / 2} ${trianglePitch} l-${triangleWidthSmall / 2} 0 L${originOffsetX} 0 Z`);
                diffAndSetAttribute(triangle, "fill", "#a4a400");
                cursors.appendChild(triangle);
            }
            let topTriangle = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(topTriangle, "d", "M0 " + topY + " l-13 20 l26 0 Z");
            diffAndSetAttribute(topTriangle, "fill", "white");
            this.root.appendChild(topTriangle);
        }
        {
            switch (this.slipSkidDisplayMode) {
                case SlipSkidDisplayMode.ROUND:
                    let slipSkidGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    diffAndSetAttribute(slipSkidGroup, "id", "slipSkid");
                    let y = this.bottomY - 30;
                    this.slipSkid = document.createElementNS(Avionics.SVG.NS, "circle");
                    diffAndSetAttribute(this.slipSkid, "cx", "0");
                    diffAndSetAttribute(this.slipSkid, "cy", y + '');
                    diffAndSetAttribute(this.slipSkid, "r", "10");
                    diffAndSetAttribute(this.slipSkid, "fill", "white");
                    diffAndSetAttribute(this.slipSkid, "stroke", "black");
                    slipSkidGroup.appendChild(this.slipSkid);
                    let slipSkidLeft = document.createElementNS(Avionics.SVG.NS, "rect");
                    diffAndSetAttribute(slipSkidLeft, "x", "-15");
                    diffAndSetAttribute(slipSkidLeft, "y", (y - 11) + '');
                    diffAndSetAttribute(slipSkidLeft, "width", "4");
                    diffAndSetAttribute(slipSkidLeft, "height", "22");
                    diffAndSetAttribute(slipSkidLeft, "fill", "white");
                    diffAndSetAttribute(slipSkidLeft, "stroke", "black");
                    slipSkidGroup.appendChild(slipSkidLeft);
                    let slipSkidRight = document.createElementNS(Avionics.SVG.NS, "rect");
                    diffAndSetAttribute(slipSkidRight, "x", "11");
                    diffAndSetAttribute(slipSkidRight, "y", (y - 11) + '');
                    diffAndSetAttribute(slipSkidRight, "width", "4");
                    diffAndSetAttribute(slipSkidRight, "height", "22");
                    diffAndSetAttribute(slipSkidRight, "fill", "white");
                    diffAndSetAttribute(slipSkidRight, "stroke", "black");
                    slipSkidGroup.appendChild(slipSkidRight);
                    this.root.appendChild(slipSkidGroup);
                    break;
                case SlipSkidDisplayMode.DEFAULT:
                default:
                    this.slipSkid = document.createElementNS(Avionics.SVG.NS, "path");
                    diffAndSetAttribute(this.slipSkid, "id", "slipSkid");
                    diffAndSetAttribute(this.slipSkid, "d", "M-20 " + (topY + 30) + " l4 -6 h32 l4 6 Z");
                    diffAndSetAttribute(this.slipSkid, "fill", "white");
                    this.root.appendChild(this.slipSkid);
                    break;
            }
        }

        {
            let radius = 10;
            let strokeWidth = 2;
            let barbThickness = 3;
            let barbLength = 10;
            let color = "#00ff00";
            function createBarb(rotation, outline) {
                let barb = document.createElementNS(Avionics.SVG.NS, "rect");
                diffAndSetAttribute(barb, "x", -radius - barbLength);
                diffAndSetAttribute(barb, "y", -barbThickness / 2);
                diffAndSetAttribute(barb, "width", barbLength);
                diffAndSetAttribute(barb, "height", barbThickness);
                if (outline) {
                    diffAndSetAttribute(barb, "fill", "transparent");
                    diffAndSetAttribute(barb, "stroke", "black");
                    diffAndSetAttribute(barb, "stroke-width", strokeWidth);
                } else {
                    diffAndSetAttribute(barb, "fill", color);
                }
                diffAndSetAttribute(barb, "transform", `rotate(${rotation})`);
                return barb;
            }
            let actualDirectionMarker = document.createElementNS(Avionics.SVG.NS, "g");
            {
                let outline = document.createElementNS(Avionics.SVG.NS, "circle");
                diffAndSetAttribute(outline, "cx", 0);
                diffAndSetAttribute(outline, "cy", 0);
                diffAndSetAttribute(outline, "r", radius);
                diffAndSetAttribute(outline, "fill", "transparent");
                diffAndSetAttribute(outline, "stroke", "black");
                diffAndSetAttribute(outline, "stroke-width", strokeWidth + barbThickness);
                actualDirectionMarker.appendChild(outline);
            }
            actualDirectionMarker.appendChild(createBarb(0, true));
            actualDirectionMarker.appendChild(createBarb(90, true));
            actualDirectionMarker.appendChild(createBarb(180, true));
            actualDirectionMarker.appendChild(createBarb(0, false));
            actualDirectionMarker.appendChild(createBarb(90, false));
            actualDirectionMarker.appendChild(createBarb(180, false));

            let fill = document.createElementNS(Avionics.SVG.NS, "circle");
            diffAndSetAttribute(fill, "cx", 0);
            diffAndSetAttribute(fill, "cy", 0);
            diffAndSetAttribute(fill, "r", radius);
            diffAndSetAttribute(fill, "fill", "transparent");
            diffAndSetAttribute(fill, "stroke", color);
            diffAndSetAttribute(fill, "stroke-width", barbThickness);
            actualDirectionMarker.appendChild(fill);
            this.actualDirectionMarker = actualDirectionMarker;
            this.attitude_pitch.appendChild(actualDirectionMarker);
        }
        this.applyAttributes();
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
            case "pitch":
                this.pitch = parseFloat(newValue);
                break;
            case "actual-pitch":
                this.actualPitch = parseFloat(newValue);
                break;
            case "ground-speed":
                this.groundSpeed = parseFloat(newValue);
                break;
            case "bank":
                this.bank = parseFloat(newValue);
                break;
            case "track":
                this.track = parseFloat(newValue);
                break;
            case "heading":
                this.heading = parseFloat(newValue);
                break;
            case "slip_skid":
                this.slipSkidValue = parseFloat(newValue);
                break;
            case "background":
                if (newValue == "false")
                    this.backgroundVisible = false;
                else
                    this.backgroundVisible = true;
                break;
            case "flight_director-active":
                this.flightDirectorActive = newValue == "true";
                break;
            case "flight_director-pitch":
                this.flightDirectorPitch = parseFloat(newValue);
                break;
            case "flight_director-bank":
                this.flightDirectorBank = parseFloat(newValue);
                break;
            case "bank_size_ratio":
                this.bankSizeRatio = parseFloat(newValue);
                this.buildGraduations();
                break;
            default:
                return;
        }
        this.applyAttributes();
    }
    getSyntheticVisionEnabled() {
        return this.syntheticVision;
    }
    setSytheticVisionEnabled(enabled) {
        this.syntheticVision = enabled;
        if (this.syntheticVision) {
            diffAndSetAttribute(this, "background", "false");
        } else {
            diffAndSetAttribute(this, "background", "true");
        }
    }
    applyAttributes() {
        if (this.bottomPart)
            diffAndSetAttribute(this.bottomPart, "transform", "rotate(" + this.bank + ", 0, 0) translate(0," + (this.pitch * this.bankSizeRatio) + ")");
        if (this.attitude_pitch) {
            diffAndSetAttribute(this.attitude_pitch, "transform", "rotate(" + this.bank + ", 0, 0) translate(0," + (this.pitch * this.bankSizeRatio) + ")");
            let y = this.bankSizeRatio * this.actualPitch;
            let a = this.track - this.heading;
            a = (a + 180) % 360 - 180;
            a = a * Math.PI / 180;
            let ax = Math.sin(a);
            let ay = Math.sin(-this.actualPitch * Math.PI / 180);
            let az = Math.cos(a);
            let screenWidth = 400 * 100 / 47.0; //From the css setting the width
            let screenHeight = screenWidth * 3 / 4;
            let fov = (80 / 2) * Math.PI / 180.0;
            let focalLength = 1 / Math.tan(fov);
            let screenX = (ax * (focalLength / az)) * screenWidth;
            let screenY = (ay * (focalLength / az)) * screenHeight;
            diffAndSetAttribute(this.actualDirectionMarker, "transform", "translate(" + screenX.toString() + "," + screenY.toString() + ")");
            this.actualDirectionMarker.style.visibility = (this.groundSpeed > 30 && this.syntheticVision) ? "visible" : "hidden";
        }
        if (this.attitude_bank)
            diffAndSetAttribute(this.attitude_bank, "transform", "rotate(" + this.bank + ", 0, 0)");
        if (this.slipSkid)
            diffAndSetAttribute(this.slipSkid, "transform", "translate(" + (this.slipSkidValue * 40) + ", 0)");
        if (this.horizonTop) {
            if (this.backgroundVisible) {
                diffAndSetAttribute(this.horizonTop, "fill", this.horizonTopColor);
                diffAndSetAttribute(this.horizonBottom, "fill", this.horizonBottomColor);
                diffAndSetAttribute(this.horizonTopGradient, "fill", "url(#sky)");
            }
            else {
                diffAndSetAttribute(this.horizonTop, "fill", "transparent");
                diffAndSetAttribute(this.horizonBottom, "fill", "transparent");
                diffAndSetAttribute(this.horizonTopGradient, "fill", "transparent");
            }
        }
        if (this.flightDirector) {
            if (this.flightDirectorActive) {
                diffAndSetAttribute(this.flightDirector, "transform", "rotate(" + (this.bank - this.flightDirectorBank) + ") translate(0 " + ((this.pitch - this.flightDirectorPitch) * this.bankSizeRatio) + ")");
                diffAndSetAttribute(this.flightDirector, "display", "");
            }
            else {
                diffAndSetAttribute(this.flightDirector, "display", "none");
            }
        }
        if (this.turnRateIndicator) {
            let turnRate = Simplane.getTurnRate();
            turnRate *= Avionics.Utils.RAD2DEG;
            if (turnRate < 0) {
                diffAndSetAttribute(this.turnRateIndicator, "transform", "rotate(180, 0, " + (this.turnRateIndicatorY + this.turnRateIndicatorHeight / 2) + ")");
            }
            else {
                diffAndSetAttribute(this.turnRateIndicator, "transform", "rotate(0, 0, " + (this.turnRateIndicatorY + this.turnRateIndicatorHeight / 2) + ")");
            }
            diffAndSetAttribute(this.turnRateIndicator, "width", (Math.abs(turnRate) * (this.turnRateIndicatorMarkerX / 3)).toFixed(6));
        }
    }
}
customElements.define('glasscockpit-attitude-indicator', AttitudeIndicator);
//# sourceMappingURL=AttitudeIndicator.js.map