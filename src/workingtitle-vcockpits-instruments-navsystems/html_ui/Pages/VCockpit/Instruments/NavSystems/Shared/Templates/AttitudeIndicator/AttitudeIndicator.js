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
                rect.setAttribute("fill", "white");
                rect.setAttribute("x", (-width / 2).toString());
                rect.setAttribute("y", (this.bankSizeRatio * angle - height / 2).toString());
                rect.setAttribute("width", width.toString());
                rect.setAttribute("height", height.toString());
                this.attitude_pitch.appendChild(rect);
                if (text) {
                    let leftText = document.createElementNS(Avionics.SVG.NS, "text");
                    leftText.textContent = Math.abs(angle).toString();
                    leftText.setAttribute("x", ((-width / 2) - 5).toString());
                    leftText.setAttribute("y", (this.bankSizeRatio * angle - height / 2 + fontSize / 2).toString());
                    leftText.setAttribute("text-anchor", "end");
                    leftText.setAttribute("font-size", fontSize.toString());
                    leftText.setAttribute("font-family", "Roboto-Bold");
                    leftText.setAttribute("fill", "white");
                    this.attitude_pitch.appendChild(leftText);
                    let rightText = document.createElementNS(Avionics.SVG.NS, "text");
                    rightText.textContent = Math.abs(angle).toString();
                    rightText.setAttribute("x", ((width / 2) + 5).toString());
                    rightText.setAttribute("y", (this.bankSizeRatio * angle - height / 2 + fontSize / 2).toString());
                    rightText.setAttribute("text-anchor", "start");
                    rightText.setAttribute("font-size", fontSize.toString());
                    rightText.setAttribute("font-family", "Roboto-Bold");
                    rightText.setAttribute("fill", "white");
                    this.attitude_pitch.appendChild(rightText);
                }
                if (angle < unusualAttitudeLowerLimit) {
                    let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                    let path = "M" + -smallWidth / 2 + " " + (this.bankSizeRatio * nextAngle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                    path += "L" + bigWidth / 2 + " " + (this.bankSizeRatio * angle - bigHeight / 2) + " l" + -smallWidth + " 0 ";
                    path += "L0 " + (this.bankSizeRatio * nextAngle + 20) + " ";
                    path += "L" + (-bigWidth / 2 + smallWidth) + " " + (this.bankSizeRatio * angle - bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                    chevron.setAttribute("d", path);
                    chevron.setAttribute("fill", "red");
                    this.attitude_pitch.appendChild(chevron);
                }
                if (angle >= unusualAttitudeUpperLimit && nextAngle <= maxDash) {
                    let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                    let path = "M" + -smallWidth / 2 + " " + (this.bankSizeRatio * angle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                    path += "L" + (bigWidth / 2) + " " + (this.bankSizeRatio * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 ";
                    path += "L0 " + (this.bankSizeRatio * angle - 20) + " ";
                    path += "L" + (-bigWidth / 2 + smallWidth) + " " + (this.bankSizeRatio * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                    chevron.setAttribute("d", path);
                    chevron.setAttribute("fill", "red");
                    this.attitude_pitch.appendChild(chevron);
                }
            }
            angle = nextAngle;
        }
    }
    construct() {
        Utils.RemoveAllChildren(this);
        {
            this.horizon = document.createElementNS(Avionics.SVG.NS, "svg");
            let defs = document.createElementNS(Avionics.SVG.NS, "defs");
            defs.innerHTML = `
                <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${this.horizonTopColor};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${this.horizonTopColorHorizon};stop-opacity:1" />
                </linearGradient>`;
            this.horizon.appendChild(defs);
            this.horizon.setAttribute("width", "100%");
            this.horizon.setAttribute("height", "100%");
            this.horizon.setAttribute("viewBox", "-200 -200 400 300");
            this.horizon.setAttribute("x", "-100");
            this.horizon.setAttribute("y", "-100");
            this.horizon.setAttribute("overflow", "visible");
            this.horizon.setAttribute("style", "position:absolute; z-index: -2; width: 100%; height:100%;");
            this.appendChild(this.horizon);
            this.horizonTop = document.createElementNS(Avionics.SVG.NS, "rect");
            this.horizonTop.setAttribute("fill", (this.backgroundVisible) ? this.horizonTopColor : "transparent");
            this.horizonTop.setAttribute("x", "-1000");
            this.horizonTop.setAttribute("y", "-1000");
            this.horizonTop.setAttribute("width", "2000");
            this.horizonTop.setAttribute("height", "2000");
            this.horizon.appendChild(this.horizonTop);
            this.bottomPart = document.createElementNS(Avionics.SVG.NS, "g");
            this.horizon.appendChild(this.bottomPart);            
            this.horizonTopGradient = document.createElementNS(Avionics.SVG.NS, "rect");
            this.horizonTopGradient.setAttribute("fill", (this.backgroundVisible) ? "url(#sky)" : "transparent");
            this.horizonTopGradient.setAttribute("x", "-1000");
            this.horizonTopGradient.setAttribute("y", "-200");
            this.horizonTopGradient.setAttribute("width", "2000");
            this.horizonTopGradient.setAttribute("height", "200");
            this.bottomPart.appendChild(this.horizonTopGradient);
            this.horizonBottom = document.createElementNS(Avionics.SVG.NS, "rect");
            this.horizonBottom.setAttribute("fill", (this.backgroundVisible) ? this.horizonBottomColor : "transparent");
            this.horizonBottom.setAttribute("x", "-1500");
            this.horizonBottom.setAttribute("y", "0");
            this.horizonBottom.setAttribute("width", "3000");
            this.horizonBottom.setAttribute("height", "3000");
            this.bottomPart.appendChild(this.horizonBottom);
            let separator = document.createElementNS(Avionics.SVG.NS, "rect");
            separator.setAttribute("fill", "#e0e0e0");
            separator.setAttribute("x", "-1500");
            separator.setAttribute("y", "-3");
            separator.setAttribute("width", "3000");
            separator.setAttribute("height", "6");
            this.bottomPart.appendChild(separator);
        }
        let attitudeContainer = document.createElement("div");
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
        let attitude_pitch_container = document.createElementNS(Avionics.SVG.NS, "svg");
        attitude_pitch_container.setAttribute("width", "300");
        attitude_pitch_container.setAttribute("height", refHeight.toString());
        attitude_pitch_container.setAttribute("x", "-150");
        attitude_pitch_container.setAttribute("y", "-130");
        attitude_pitch_container.setAttribute("viewBox", "-150 -130 300 " + refHeight.toString());
        attitude_pitch_container.setAttribute("overflow", "hidden");
        this.root.appendChild(attitude_pitch_container);
        this.attitude_pitch = document.createElementNS(Avionics.SVG.NS, "g");
        attitude_pitch_container.appendChild(this.attitude_pitch);
        this.buildGraduations();
        this.flightDirector = document.createElementNS(Avionics.SVG.NS, "g");
        attitude_pitch_container.appendChild(this.flightDirector);
        let triangleOuterLeft = document.createElementNS(Avionics.SVG.NS, "path");
        triangleOuterLeft.setAttribute("d", "M-140 30 l50 0 L0 0 Z");
        triangleOuterLeft.setAttribute("fill", "#d12bc7");
        //this.flightDirector.appendChild(triangleOuterLeft);
        let triangleOuterRight = document.createElementNS(Avionics.SVG.NS, "path");
        triangleOuterRight.setAttribute("d", "M140 30 l-50 0 L0 0 Z");
        triangleOuterRight.setAttribute("fill", "#d12bc7");
        //this.flightDirector.appendChild(triangleOuterRight);
 
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
            triangle.setAttribute("d", `M-${flightDirectorWidth} ${trianglePitch} l-${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} L-${originOffsetX} 0 Z`);
            triangle.setAttribute("fill", "transparent");
            triangle.setAttribute("stroke", "#000000");
            triangle.setAttribute("stroke-width", this.strokeWidth);
            triangle.setAttribute("stroke-linejoin", "miter");
            this.flightDirector.appendChild(triangle);
        }
        {
            let triangle = document.createElementNS(Avionics.SVG.NS, "path");
            triangle.setAttribute("d", `M-${flightDirectorWidth} ${trianglePitch} l-${flightDirectorTriangle} -${flightDirectorTriangleHeight} L-${originOffsetX} 0 Z`);
            triangle.setAttribute("fill", "#d12bc7");
            this.flightDirector.appendChild(triangle);
        }
        {
            let triangle = document.createElementNS(Avionics.SVG.NS, "path");
            triangle.setAttribute("d", `M-${flightDirectorWidth} ${trianglePitch} l-${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} Z`);
            triangle.setAttribute("fill", "#990891");
            this.flightDirector.appendChild(triangle);
        }
        // Right indicator
        {
            let triangle = document.createElementNS(Avionics.SVG.NS, "path");
            triangle.setAttribute("d", `M${flightDirectorWidth} ${trianglePitch} l${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} L${originOffsetX} 0 Z`);
            triangle.setAttribute("fill", "transparent");
            triangle.setAttribute("stroke", "#000000");
            triangle.setAttribute("stroke-width", this.strokeWidth);
            triangle.setAttribute("stroke-linejoin", "miter");
            this.flightDirector.appendChild(triangle);
        }
        {
            let triangle = document.createElementNS(Avionics.SVG.NS, "path");
            triangle.setAttribute("d", `M${flightDirectorWidth} ${trianglePitch} l${flightDirectorTriangle} -${flightDirectorTriangleHeight} L${originOffsetX} 0 Z`);
            triangle.setAttribute("fill", "#d12bc7");
            this.flightDirector.appendChild(triangle);
        }
        {
            let triangle = document.createElementNS(Avionics.SVG.NS, "path");
            triangle.setAttribute("d", `M${flightDirectorWidth} ${trianglePitch} l${flightDirectorTriangle} 0 l0 -${flightDirectorTriangleHeight} Z`);
            triangle.setAttribute("fill", "#990891");
            this.flightDirector.appendChild(triangle);
        }

        {
            this.attitude_bank = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(this.attitude_bank);
            let topTriangle = document.createElementNS(Avionics.SVG.NS, "path");
            topTriangle.setAttribute("d", "M0 -170 l-20 -30 l40 0 Z");
            topTriangle.setAttribute("fill", "white");
            this.attitude_bank.appendChild(topTriangle);
            let bigDashes = [-60, -30, 30, 60];
            let smallDashes = [-45, -20, -10, 10, 20, 45];
            let radius = 170;
            let width = 4;
            let height = 30;
            for (let i = 0; i < bigDashes.length; i++) {
                let dash = document.createElementNS(Avionics.SVG.NS, "rect");
                dash.setAttribute("x", (-width / 2).toString());
                dash.setAttribute("y", (-radius - height).toString());
                dash.setAttribute("height", height.toString());
                dash.setAttribute("width", width.toString());
                dash.setAttribute("fill", "white");
                dash.setAttribute("transform", "rotate(" + bigDashes[i] + ",0,0)");
                this.attitude_bank.appendChild(dash);
            }
            width = 4;
            height = 20;
            for (let i = 0; i < smallDashes.length; i++) {
                let dash = document.createElementNS(Avionics.SVG.NS, "rect");
                dash.setAttribute("x", (-width / 2).toString());
                dash.setAttribute("y", (-radius - height).toString());
                dash.setAttribute("height", height.toString());
                dash.setAttribute("width", width.toString());
                dash.setAttribute("fill", "white");
                dash.setAttribute("transform", "rotate(" + smallDashes[i] + ",0,0)");
                this.attitude_bank.appendChild(dash);
            }
        }
        {
            let cursors = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(cursors);
            let leftBackground = document.createElementNS(Avionics.SVG.NS, "path");
            leftBackground.setAttribute("d", "M-190 0 l-10 12 l50 0 l10 -12 l-10 -12 l-50 0 l10 12 Z");
            leftBackground.setAttribute("stroke", "#000000");
            leftBackground.setAttribute("stroke-width", this.strokeWidth);
            cursors.appendChild(leftBackground);
            let leftLower = document.createElementNS(Avionics.SVG.NS, "path");
            leftLower.setAttribute("d", "M-190 0 l-10 12 l50 0 l10 -12 Z");
            leftLower.setAttribute("fill", "#cccc00");
            cursors.appendChild(leftLower);
            let leftUpper = document.createElementNS(Avionics.SVG.NS, "path");
            leftUpper.setAttribute("d", "M-190 0 l-10 -12 l50 0 l10 12 Z");
            leftUpper.setAttribute("fill", "#ffff00");
            cursors.appendChild(leftUpper);
            let rightBackground = document.createElementNS(Avionics.SVG.NS, "path");
            rightBackground.setAttribute("d", "M190 0 l10 12 l-50 0 l-10 -12 l10 -12 l50 0 l-10 12 Z");
            rightBackground.setAttribute("stroke", "#000000");
            rightBackground.setAttribute("stroke-width", this.strokeWidth);
            cursors.appendChild(rightBackground);
            let rightLower = document.createElementNS(Avionics.SVG.NS, "path");
            rightLower.setAttribute("d", "M190 0 l10 12 l-50 0 l-10 -12 Z");
            rightLower.setAttribute("fill", "#cccc00");
            cursors.appendChild(rightLower);
            let rightUpper = document.createElementNS(Avionics.SVG.NS, "path");
            rightUpper.setAttribute("d", "M190 0 l10 -12 l-50 0 l-10 12 Z");
            rightUpper.setAttribute("fill", "#ffff00");
            cursors.appendChild(rightUpper);
            // Left indicator
            {
                let triangle = document.createElementNS(Avionics.SVG.NS, "path");
                triangle.setAttribute("d", `M-${triangleWidth} ${trianglePitch} l${triangleWidthSmall} 0 L-${originOffsetX} 0 Z`);
                triangle.setAttribute("fill", "transparent");
                triangle.setAttribute("stroke", "#000000");
                triangle.setAttribute("stroke-width", this.strokeWidth);
                triangle.setAttribute("stroke-linejoin", "miter");
                cursors.appendChild(triangle);
            }
            {
                let triangle = document.createElementNS(Avionics.SVG.NS, "path");
                triangle.setAttribute("d", `M-${triangleWidth} ${trianglePitch} l${triangleWidthSmall} 0 L-${originOffsetX} 0 Z`);
                triangle.setAttribute("fill", "#ffff00");
                cursors.appendChild(triangle);
            }
            {
                let triangle = document.createElementNS(Avionics.SVG.NS, "path");
                triangle.setAttribute("d", `M-${triangleWidth - triangleWidthSmall / 2} ${trianglePitch} l${triangleWidthSmall / 2} 0 L-${originOffsetX} 0 Z`);
                triangle.setAttribute("fill", "#a4a400");
                cursors.appendChild(triangle);
            }
            // Right indicator
            {
                let triangle = document.createElementNS(Avionics.SVG.NS, "path");
                triangle.setAttribute("d", `M${triangleWidth} ${trianglePitch} l-${triangleWidthSmall} 0 L${originOffsetX} 0 Z`);
                triangle.setAttribute("fill", "transparent");
                triangle.setAttribute("stroke", "#000000");
                triangle.setAttribute("stroke-width", this.strokeWidth);
                triangle.setAttribute("stroke-linejoin", "miter");
                cursors.appendChild(triangle);
            }
            {
                let triangle = document.createElementNS(Avionics.SVG.NS, "path");
                triangle.setAttribute("d", `M${triangleWidth} ${trianglePitch} l-${triangleWidthSmall} 0 L${originOffsetX} 0 Z`);
                triangle.setAttribute("fill", "#ffff00");
                cursors.appendChild(triangle);
            }
            {
                let triangle = document.createElementNS(Avionics.SVG.NS, "path");
                triangle.setAttribute("d", `M${triangleWidth - triangleWidthSmall / 2} ${trianglePitch} l-${triangleWidthSmall / 2} 0 L${originOffsetX} 0 Z`);
                triangle.setAttribute("fill", "#a4a400");
                cursors.appendChild(triangle);
            }
            let topTriangle = document.createElementNS(Avionics.SVG.NS, "path");
            topTriangle.setAttribute("d", "M0 -170 l-13 20 l26 0 Z");
            topTriangle.setAttribute("fill", "white");
            this.root.appendChild(topTriangle);
            this.slipSkid = document.createElementNS(Avionics.SVG.NS, "path");
            this.slipSkid.setAttribute("d", "M-20 -140 L-16 -146 L16 -146 L20 -140 Z");
            this.slipSkid.setAttribute("fill", "white");
            this.root.appendChild(this.slipSkid);
        }
        
        {
            let radius = 10;
            let strokeWidth = 2;
            let barbThickness = 3;
            let barbLength = 10;
            function createBarb(rotation, outline) {
                let barb = document.createElementNS(Avionics.SVG.NS, "rect");
                barb.setAttribute("x",-radius - barbLength);
                barb.setAttribute("y",-barbThickness / 2);
                barb.setAttribute("width",barbLength);
                barb.setAttribute("height",barbThickness);
                if (outline) {
                    barb.setAttribute("fill","transparent");
                    barb.setAttribute("stroke","black");
                    barb.setAttribute("stroke-width",strokeWidth);
                } else {
                    barb.setAttribute("fill","green");
                }
                barb.setAttribute("transform",`rotate(${rotation})`);
                return barb;
            }
            let actualDirectionMarker = document.createElementNS(Avionics.SVG.NS, "g");
            {
                let outline = document.createElementNS(Avionics.SVG.NS, "circle");
                outline.setAttribute("cx",0);
                outline.setAttribute("cy",0);
                outline.setAttribute("r",radius);
                outline.setAttribute("fill","transparent");
                outline.setAttribute("stroke","black");
                outline.setAttribute("stroke-width",strokeWidth + barbThickness);
                actualDirectionMarker.appendChild(outline);
            }
            actualDirectionMarker.appendChild(createBarb(0, true));
            actualDirectionMarker.appendChild(createBarb(90, true));
            actualDirectionMarker.appendChild(createBarb(180, true));
            actualDirectionMarker.appendChild(createBarb(0, false));
            actualDirectionMarker.appendChild(createBarb(90, false));
            actualDirectionMarker.appendChild(createBarb(180, false));
            
            let fill = document.createElementNS(Avionics.SVG.NS, "circle");
            fill.setAttribute("cx",0);
            fill.setAttribute("cy",0);
            fill.setAttribute("r",radius);
            fill.setAttribute("fill","transparent");
            fill.setAttribute("stroke","green");
            fill.setAttribute("stroke-width",barbThickness);
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
            case "synthetic-vision":
                this.syntheticVision = newValue == "true";
                break;                
            case "ground-speed":
                this.groundSpeed = parseFloat(newValue);
                break;
            case "bank":
                this.bank = parseFloat(newValue);
                break;
            case "track":
                this.track = parseFloat(newValue);
                console.log("track:" + this.track);
                break;
            case "heading":
                this.heading = parseFloat(newValue);
                console.log("heading:" + this.heading);
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
    applyAttributes() {
        if (this.bottomPart)
            this.bottomPart.setAttribute("transform", "rotate(" + this.bank + ", 0, 0) translate(0," + (this.pitch * this.bankSizeRatio) + ")");
        if (this.attitude_pitch) {
            this.attitude_pitch.setAttribute("transform", "rotate(" + this.bank + ", 0, 0) translate(0," + (this.pitch * this.bankSizeRatio) + ")");
            let y = this.bankSizeRatio * this.actualPitch;
            let a = this.track - this.heading;
            a = (a + 180) % 360 - 180;
            a = a * Math.PI / 180;
            let ax = Math.sin(a);
            let ay = Math.sin(-this.actualPitch * Math.PI / 180);
            let az = Math.cos(a);
            let screenWidth = 400 * 100/47.0; //From the css setting the width
            let screenHeight = screenWidth * 3/4;
            let fov = (80/2) * Math.PI / 180.0; 
            let focalLength = 1 / Math.tan(fov);
            let screenX = (ax * (focalLength / az)) * screenWidth;
            let screenY = (ay * (focalLength / az)) * screenHeight;
            this.actualDirectionMarker.setAttribute("transform", "translate(" + screenX.toString() + "," + screenY.toString() + ")");
            this.actualDirectionMarker.style.visibility = (this.groundSpeed > 30 && this.syntheticVision) ? "visible" : "hidden";
        }
        if (this.attitude_bank)
            this.attitude_bank.setAttribute("transform", "rotate(" + this.bank + ", 0, 0)");
        if (this.slipSkid)
            this.slipSkid.setAttribute("transform", "translate(" + (this.slipSkidValue * 40) + ", 0)");
        if (this.horizonTop) {
            if (this.backgroundVisible) {
                this.horizonTop.setAttribute("fill", this.horizonTopColor);
                this.horizonBottom.setAttribute("fill", this.horizonBottomColor);
                this.horizonTopGradient.setAttribute("fill", "url(#sky)");
            }
            else {
                this.horizonTop.setAttribute("fill", "transparent");
                this.horizonBottom.setAttribute("fill", "transparent");
                this.horizonTopGradient.setAttribute("fill", "transparent");
            }
        }
        if (this.flightDirector) {
            if (this.flightDirectorActive) {
                this.flightDirector.setAttribute("transform", "rotate(" + (this.bank - this.flightDirectorBank) + ") translate(0 " + ((this.pitch - this.flightDirectorPitch) * this.bankSizeRatio) + ")");
                this.flightDirector.setAttribute("display", "");
            }
            else {
                this.flightDirector.setAttribute("display", "none");
            }
        }
    }
}
customElements.define('glasscockpit-attitude-indicator', AttitudeIndicator);
//# sourceMappingURL=AttitudeIndicator.js.map