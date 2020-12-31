class Jet_PFD_AttitudeIndicator extends HTMLElement {
    constructor() {
        super();
        this.attitude_pitch = [];
        this.radioAltitudeColorOk = "white";
        this.radioAltitudeColorBad = "white";
        this.radioAltitudeColorLimit = 0;
        this.radioAltitudeRotate = false;
        this.cj4_HalfBankActive = false;
        this.cj4_FlightDirectorActive = true;
        this.cj4_FlightDirectorPitch = 0;
        this.cj4_FlightDirectorBank = 0;
        this.horizonAngleFactor = 1.0;
        this.pitchAngleFactor = 1.0;
        this.horizonTopColor = "";
        this.horizonBottomColor = "";
        this.horizonVisible = true;
        this.isHud = false;
        this._aircraft = Aircraft.A320_NEO;
        this.cj4_FlightDirectorStyle = 0;
    }
    static get dynamicAttributes() {
        return [
            "pitch",
            "bank",
            "horizon",
            "slip_skid",
            "flight_director-active",
            "flight_director-pitch",
            "flight_director-bank",
            "flight_director-style",
            "radio_altitude",
            "decision_height",
            "half_bank-active"
        ];
    }
    static get observedAttributes() {
        return this.dynamicAttributes.concat([
            "background",
            "hud"
        ]);
    }
    get aircraft() {
        return this._aircraft;
    }
    set aircraft(_val) {
        if (this._aircraft != _val) {
            this._aircraft = _val;
            this.construct();
        }
    }
    connectedCallback() {
        this.construct();
    }
    showFPV(_active) {
    }
    destroyLayout() {
        Utils.RemoveAllChildren(this);
        for (let i = 0; i < Jet_PFD_AttitudeIndicator.dynamicAttributes.length; i++) {
            this.removeAttribute(Jet_PFD_AttitudeIndicator.dynamicAttributes[i]);
        }
        this.horizonAngleFactor = 1.0;
        this.pitchAngleFactor = 1.0;
        this.radioAltitudeRotate = false;
        this.radioAltitudeColorLimit = 0;
        this.attitude_pitch = [];
    }
    construct() {
        this.destroyLayout();
        if (this.aircraft == Aircraft.CJ4)
            this.construct_CJ4();
    }
    construct_CJ4() {
        let pitchFactor = -7;
        this.pitchAngleFactor = pitchFactor;
        this.horizonAngleFactor = pitchFactor * 1.67;
        {
            this.horizon_root = document.createElementNS(Avionics.SVG.NS, "svg");
            this.horizon_root.setAttribute("id", "Background");
            this.horizon_root.setAttribute("width", "100%");
            this.horizon_root.setAttribute("height", "100%");
            this.horizon_root.setAttribute("viewBox", "-200 -200 400 300");
            this.horizon_root.setAttribute("x", "-100");
            this.horizon_root.setAttribute("y", "-100");
            this.horizon_root.setAttribute("overflow", "visible");
            this.horizon_root.setAttribute("style", "position:absolute; z-index: -3; width: 100%; height:100%;");
            this.horizon_root.setAttribute("transform", "translate(0, 100)");
            this.appendChild(this.horizon_root);
            this.horizonTopColor = "#045CEB";
            this.horizonBottomColor = "#9E6345";
            this.horizon_top_bg = document.createElementNS(Avionics.SVG.NS, "rect");
            this.horizon_top_bg.setAttribute("fill", (this.horizonVisible) ? this.horizonTopColor : "transparent");
            this.horizon_top_bg.setAttribute("x", "-1000");
            this.horizon_top_bg.setAttribute("y", "-1000");
            this.horizon_top_bg.setAttribute("width", "2000");
            this.horizon_top_bg.setAttribute("height", "2000");
            this.horizon_root.appendChild(this.horizon_top_bg);
            this.horizon_bottom = document.createElementNS(Avionics.SVG.NS, "g");
            this.horizon_root.appendChild(this.horizon_bottom);
            {
                this.horizon_bottom_bg = document.createElementNS(Avionics.SVG.NS, "rect");
                this.horizon_bottom_bg.setAttribute("fill", (this.horizonVisible) ? this.horizonBottomColor : "transparent");
                this.horizon_bottom_bg.setAttribute("x", "-1500");
                this.horizon_bottom_bg.setAttribute("y", "0");
                this.horizon_bottom_bg.setAttribute("width", "3000");
                this.horizon_bottom_bg.setAttribute("height", "3000");
                this.horizon_bottom.appendChild(this.horizon_bottom_bg);
                let separator = document.createElementNS(Avionics.SVG.NS, "rect");
                separator.setAttribute("fill", "white");
                separator.setAttribute("x", "-1500");
                separator.setAttribute("y", "-3");
                separator.setAttribute("width", "3000");
                separator.setAttribute("height", "6");
                this.horizon_bottom.appendChild(separator);
            }
        }
        {
            let pitchContainer = document.createElement("div");
            pitchContainer.setAttribute("id", "Pitch");
            pitchContainer.style.top = "-21%";
            pitchContainer.style.left = "-10%";
            pitchContainer.style.width = "120%";
            pitchContainer.style.height = "120%";
            pitchContainer.style.position = "absolute";
            pitchContainer.style.transform = "scale(1.4)";
            this.appendChild(pitchContainer);
            let pitchSvg = document.createElementNS(Avionics.SVG.NS, "svg");
            pitchSvg.setAttribute("width", "100%");
            pitchSvg.setAttribute("height", "100%");
            pitchSvg.setAttribute("viewBox", "-200 -200 400 300");
            pitchSvg.setAttribute("overflow", "visible");
            pitchSvg.setAttribute("style", "position:absolute; z-index: -2;");
            let pitchSvgDefs = document.createElementNS(Avionics.SVG.NS, "defs");
            let pitchSvgClip = document.createElementNS(Avionics.SVG.NS, "clipPath");
            pitchSvgClip.setAttribute("id", "pitchClip");
            let pitchSvgClipShape = document.createElementNS(Avionics.SVG.NS, "circle");
            pitchSvgClipShape.setAttribute("r", "165");
            pitchSvgClip.appendChild(pitchSvgClipShape);
            pitchSvgDefs.appendChild(pitchSvgClip);
            pitchSvg.appendChild(pitchSvgDefs);
            pitchContainer.appendChild(pitchSvg);
            {
                this.pitch_root = document.createElementNS(Avionics.SVG.NS, "g");
                pitchSvg.appendChild(this.pitch_root);
                var x = -215;
                var y = -175;
                var w = 530;
                var h = 365;
                let attitudePitchContainer = document.createElementNS(Avionics.SVG.NS, "svg");
                attitudePitchContainer.setAttribute("width", w.toString());
                attitudePitchContainer.setAttribute("height", h.toString());
                attitudePitchContainer.setAttribute("x", x.toString());
                attitudePitchContainer.setAttribute("y", y.toString());
                attitudePitchContainer.setAttribute("viewBox", x + " " + y + " " + w + " " + h);
                attitudePitchContainer.setAttribute("overflow", "hidden");
                this.pitch_root.appendChild(attitudePitchContainer);
                let attitudePitchInnerContainer = document.createElementNS(Avionics.SVG.NS, "g");
                attitudePitchInnerContainer.setAttribute("clip-path", "url(#pitchClip)");
                attitudePitchContainer.appendChild(attitudePitchInnerContainer);
                {
                    this.attitude_pitch.push(document.createElementNS(Avionics.SVG.NS, "g"));
                    attitudePitchInnerContainer.appendChild(this.attitude_pitch[0]);
                    let maxDash = 80;
                    let fullPrecisionLowerLimit = -20;
                    let fullPrecisionUpperLimit = 20;
                    let halfPrecisionLowerLimit = -30;
                    let halfPrecisionUpperLimit = 45;
                    let unusualAttitudeLowerLimit = -30;
                    let unusualAttitudeUpperLimit = 50;
                    let bigWidth = 60;
                    let bigHeight = 3;
                    let mediumWidth = 32.5;
                    let mediumHeight = 3;
                    let smallWidth = 10;
                    let smallHeight = 2;
                    let fontSize = 25;
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
                                text = false;
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
                            rect.setAttribute("y", (pitchFactor * angle - height / 2).toString());
                            rect.setAttribute("width", width.toString());
                            rect.setAttribute("height", 1);
                            this.attitude_pitch[0].appendChild(rect);
                            if (text) {
                                let rightText = document.createElementNS(Avionics.SVG.NS, "text");
                                rightText.textContent = Math.abs(angle).toString();
                                rightText.setAttribute("x", ((width / 2) + 5).toString());
                                rightText.setAttribute("y", (pitchFactor * angle - height / 2 + fontSize / 2).toString() - 4);
                                rightText.setAttribute("text-anchor", "start");
                                rightText.setAttribute("font-size", fontSize.toString());
                                rightText.setAttribute("font-family", "Roboto-Light");
                                rightText.setAttribute("fill", "white");
                                this.attitude_pitch[0].appendChild(rightText);
                            }
                            if (angle < unusualAttitudeLowerLimit) {
                                let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                                let path = "M" + -smallWidth / 2 + " " + (pitchFactor * nextAngle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                                path += "L" + bigWidth / 2 + " " + (pitchFactor * angle - bigHeight / 2) + " l" + -smallWidth + " 0 ";
                                path += "L0 " + (pitchFactor * nextAngle + 20) + " ";
                                path += "L" + (-bigWidth / 2 + smallWidth) + " " + (pitchFactor * angle - bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                                chevron.setAttribute("d", path);
                                chevron.setAttribute("fill", "red");
                                this.attitude_pitch[0].appendChild(chevron);
                            }
                            if (angle >= unusualAttitudeUpperLimit && nextAngle <= maxDash) {
                                let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                                let path = "M" + -smallWidth / 2 + " " + (pitchFactor * angle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                                path += "L" + (bigWidth / 2) + " " + (pitchFactor * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 ";
                                path += "L0 " + (pitchFactor * angle - 20) + " ";
                                path += "L" + (-bigWidth / 2 + smallWidth) + " " + (pitchFactor * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                                chevron.setAttribute("d", path);
                                chevron.setAttribute("fill", "red");
                                this.attitude_pitch[0].appendChild(chevron);
                            }
                        }
                        angle = nextAngle;
                    }
                }
                {
                    this.cj4_FlightDirector = document.createElementNS(Avionics.SVG.NS, "g");
                    attitudePitchContainer.appendChild(this.cj4_FlightDirector);
                    let triangleOuterLeft = document.createElementNS(Avionics.SVG.NS, "path");
                    triangleOuterLeft.setAttribute("d", "M-110 23 l20 7 L0 0 Z");
                    triangleOuterLeft.setAttribute("fill", "magenta");
                    triangleOuterLeft.setAttribute("stroke", "black");
                    triangleOuterLeft.setAttribute("stroke-width", "1.5");
                    this.cj4_FlightDirector.appendChild(triangleOuterLeft);
                    let triangleBottomLeft = document.createElementNS(Avionics.SVG.NS, "path");
                    triangleBottomLeft.setAttribute("d", "M-110 23 l20 7 l-20 7 Z");
                    triangleBottomLeft.setAttribute("fill", "magenta");
                    triangleBottomLeft.setAttribute("stroke", "black");
                    triangleBottomLeft.setAttribute("stroke-width", "1.5");
                    this.cj4_FlightDirector.appendChild(triangleBottomLeft);
                    let triangleOuterRight = document.createElementNS(Avionics.SVG.NS, "path");
                    triangleOuterRight.setAttribute("d", "M110 23 l-20 7 L0 0 Z");
                    triangleOuterRight.setAttribute("fill", "magenta");
                    triangleOuterRight.setAttribute("stroke", "black");
                    triangleOuterRight.setAttribute("stroke-width", "1.5");
                    this.cj4_FlightDirector.appendChild(triangleOuterRight);
                    let triangleBottomRight = document.createElementNS(Avionics.SVG.NS, "path");
                    triangleBottomRight.setAttribute("d", "M110 23 l-20 7 l20 7 Z");
                    triangleBottomRight.setAttribute("fill", "magenta");
                    triangleBottomRight.setAttribute("stroke", "black");
                    triangleBottomRight.setAttribute("stroke-width", "1.5");
                    this.cj4_FlightDirector.appendChild(triangleBottomRight);
                }
            }
        }
        {
            let attitudeContainer = document.createElement("div");
            attitudeContainer.setAttribute("id", "Attitude");
            attitudeContainer.style.top = "-21%";
            attitudeContainer.style.left = "-10%";
            attitudeContainer.style.width = "120%";
            attitudeContainer.style.height = "120%";
            attitudeContainer.style.position = "absolute";
            attitudeContainer.style.transform = "scale(1.4)";
            this.appendChild(attitudeContainer);
            this.attitude_root = document.createElementNS(Avionics.SVG.NS, "svg");
            this.attitude_root.setAttribute("width", "100%");
            this.attitude_root.setAttribute("height", "100%");
            this.attitude_root.setAttribute("viewBox", "-200 -200 400 300");
            this.attitude_root.setAttribute("overflow", "visible");
            this.attitude_root.setAttribute("style", "position:absolute; z-index: 0");
            attitudeContainer.appendChild(this.attitude_root);
            {
                this.attitude_bank = document.createElementNS(Avionics.SVG.NS, "g");
                this.attitude_root.appendChild(this.attitude_bank);
                let topTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                topTriangle.setAttribute("d", "M 0 -180 l -5 -10 l 10 0 Z");
                topTriangle.setAttribute("fill", "transparent");
                topTriangle.setAttribute("stroke", "white");
                topTriangle.setAttribute("stroke-width", "2");
                topTriangle.setAttribute("stroke-opacity", "1");
                this.attitude_bank.appendChild(topTriangle);
                let smallDashesAngle = [-60, -30, -20, -10, 10, 20, 30, 60];
                let smallDashesHeight = [18, 18, 11, 11, 11, 11, 18, 18];
                let radius = 178;
                for (let i = 0; i < smallDashesAngle.length; i++) {
                    let dash = document.createElementNS(Avionics.SVG.NS, "line");
                    dash.setAttribute("x1", "0");
                    dash.setAttribute("y1", (-radius).toString());
                    dash.setAttribute("x2", "0");
                    dash.setAttribute("y2", (-radius - smallDashesHeight[i]).toString());
                    dash.setAttribute("fill", "none");
                    dash.setAttribute("stroke", "white");
                    dash.setAttribute("stroke-width", "2");
                    dash.setAttribute("transform", "rotate(" + smallDashesAngle[i] + ",0,0)");
                    this.attitude_bank.appendChild(dash);
                }
                let leftTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                leftTriangle.setAttribute("d", "M 0 -180 l -5 -10 l 10 0 Z");
                leftTriangle.setAttribute("fill", "transparent");
                leftTriangle.setAttribute("stroke", "white");
                leftTriangle.setAttribute("stroke-width", "2");
                leftTriangle.setAttribute("stroke-opacity", "1");
                leftTriangle.setAttribute("transform", "rotate(45,0,0)");
                this.attitude_bank.appendChild(leftTriangle);
                let rightTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                rightTriangle.setAttribute("d", "M 0 -180 l -5 -10 l 10 0 Z");
                rightTriangle.setAttribute("fill", "transparent");
                rightTriangle.setAttribute("stroke", "white");
                rightTriangle.setAttribute("stroke-width", "2");
                rightTriangle.setAttribute("stroke-opacity", "1");
                rightTriangle.setAttribute("transform", "rotate(-45,0,0)");
                this.attitude_bank.appendChild(rightTriangle);
                this.halfBankArc = document.createElementNS(Avionics.SVG.NS, "path");
                this.halfBankArc.setAttribute("d", "M 46 -173 A 179 179 0 0 0 -46 -173");
                this.halfBankArc.setAttribute("stroke", "white");
                this.halfBankArc.setAttribute("stroke-width", "2");
                this.halfBankArc.setAttribute("fill", "none");
                this.attitude_bank.appendChild(this.halfBankArc);
            }
            {
                this.vBarAircraftSymbol = document.createElementNS(Avionics.SVG.NS, "g");
                this.attitude_root.appendChild(this.vBarAircraftSymbol);
                let leftUpper1 = document.createElementNS(Avionics.SVG.NS, "rect");
                leftUpper1.setAttribute("fill", "black");
                leftUpper1.setAttribute("stroke", "white");
                leftUpper1.setAttribute("stroke-width", "2");
                leftUpper1.setAttribute("x", "130");
                leftUpper1.setAttribute("y", "-4");
                leftUpper1.setAttribute("width", "32");
                leftUpper1.setAttribute("height", "5");
                this.vBarAircraftSymbol.appendChild(leftUpper1);
                let rightUpper1 = document.createElementNS(Avionics.SVG.NS, "rect");
                rightUpper1.setAttribute("fill", "black");
                rightUpper1.setAttribute("stroke", "white");
                rightUpper1.setAttribute("stroke-width", "2");
                rightUpper1.setAttribute("x", "-162");
                rightUpper1.setAttribute("y", "-4");
                rightUpper1.setAttribute("width", "32");
                rightUpper1.setAttribute("height", "5");
                this.vBarAircraftSymbol.appendChild(rightUpper1);

                this.crossPointersGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.attitude_root.appendChild(this.crossPointersGroup);
                let crossPointersLeft = document.createElementNS(Avionics.SVG.NS, "path");
                crossPointersLeft.setAttribute("d", "M -90 30 m 30 0 L -60 0 L -135 0 L -135 10 L -70 10 L -70 42 L -60 42 Z");
                crossPointersLeft.setAttribute("fill", "#black");
                crossPointersLeft.setAttribute("stroke", "white");
                crossPointersLeft.setAttribute("stroke-width", "2");
                this.crossPointersGroup.appendChild(crossPointersLeft);

                let crossPointersRight = document.createElementNS(Avionics.SVG.NS, "path");
                crossPointersRight.setAttribute("d", "M 90 30 m -30 -4 L 60 0 L 135 0 L 135 10 L 70 10 L 70 42 L 60 42 Z");
                crossPointersRight.setAttribute("fill", "#black");
                crossPointersRight.setAttribute("stroke", "white");
                crossPointersRight.setAttribute("stroke-width", "2");
                this.crossPointersGroup.appendChild(crossPointersRight);

                let triangleInnerLeft = document.createElementNS(Avionics.SVG.NS, "path");
                triangleInnerLeft.setAttribute("d", "M-90 30 l30 0 L0 0 Z");
                triangleInnerLeft.setAttribute("fill", "#black");
                triangleInnerLeft.setAttribute("stroke", "white");
                triangleInnerLeft.setAttribute("stroke-width", "2");
                this.vBarAircraftSymbol.appendChild(triangleInnerLeft);

                let triangleInnerRight = document.createElementNS(Avionics.SVG.NS, "path");
                triangleInnerRight.setAttribute("d", "M90 30 l-30 0 L0 0 Z");
                triangleInnerRight.setAttribute("fill", "#black");
                triangleInnerRight.setAttribute("stroke", "white");
                triangleInnerRight.setAttribute("stroke-width", "2");
                this.vBarAircraftSymbol.appendChild(triangleInnerRight);

                this.slipSkidTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkidTriangle.setAttribute("d", "M 0 -179 l -13 20 l 26 0 Z");
                this.slipSkidTriangle.setAttribute("fill", "white");
                this.attitude_root.appendChild(this.slipSkidTriangle);
                this.slipSkid = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkid.setAttribute("d", "M -13 -152 L -13 -157 L 13 -157 L 13 -152 Z");
                this.slipSkid.setAttribute("fill", "white");
                this.attitude_root.appendChild(this.slipSkid);

                this.crossPointersPitch = document.createElementNS(Avionics.SVG.NS, "path");
                this.crossPointersPitch.setAttribute("d", "M -110 23 m -9 -14 L -119 2 L 119 2 L 119 8 L -119 8 Z");
                this.crossPointersPitch.setAttribute("fill", "magenta");
                this.crossPointersGroup.appendChild(this.crossPointersPitch);

                this.crossPointersBank = document.createElementNS(Avionics.SVG.NS, "path");
                this.crossPointersBank.setAttribute("d", "M -3 0 l 0 -116 l 6 0 l 0 238 L -3 122 L -3 0");
                this.crossPointersBank.setAttribute("fill", "magenta");
                this.crossPointersGroup.appendChild(this.crossPointersBank);

                this.crossPointersMiddle = document.createElementNS(Avionics.SVG.NS, "path");
                this.crossPointersMiddle.setAttribute("d", "M -5 0 L 5 0 L 5 10 L -5 10 L -5 0 Z");
                this.crossPointersMiddle.setAttribute("fill", "none");
                this.crossPointersMiddle.setAttribute("stroke", "white");
                this.crossPointersMiddle.setAttribute("stroke-width", "2");
                this.crossPointersGroup.appendChild(this.crossPointersMiddle);

            }
            {
                this.radioAltitudeGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.radioAltitudeGroup.setAttribute("id", "RadioAltitude");
                this.attitude_root.appendChild(this.radioAltitudeGroup);
                this.radioAltitudeColorOk = "#11d011";
                this.radioAltitudeColorBad = "#11d011";
                this.radioAltitudeColorLimit = 400;
                this.radioAltitudeRotate = false;
                this.radioAltitude = document.createElementNS(Avionics.SVG.NS, "text");
                this.radioAltitude.textContent = "";
                this.radioAltitude.setAttribute("x", "30");
                this.radioAltitude.setAttribute("y", "165");
                this.radioAltitude.setAttribute("text-anchor", "end");
                this.radioAltitude.setAttribute("font-size", "32");
                this.radioAltitude.setAttribute("font-family", "Roboto-Bold");
                this.radioAltitude.setAttribute("fill", "#11d011");
                this.radioAltitude.setAttribute("stroke", "black");
                this.radioAltitude.setAttribute("stroke-width", "3.5");
                this.radioAltitudeGroup.appendChild(this.radioAltitude);
            }
        }
        this.applyAttributes();
    }
    applyAttributes() {
        if (this.horizon_bottom)
            this.horizon_bottom.setAttribute("transform", "rotate(" + this.bankAngle + ", 0, 0) translate(0," + (this.horizonAngle * this.horizonAngleFactor) + ")");
        for (let i = 0; i < this.attitude_pitch.length; i++)
            this.attitude_pitch[i].setAttribute("transform", "translate(0," + (this.pitchAngle * this.pitchAngleFactor) + ")");
        if (this.pitch_root)
            this.pitch_root.setAttribute("transform", "rotate(" + this.bankAngle + ", 0, 0)");
        if (this.slipSkid)
            this.slipSkid.setAttribute("transform", "rotate(" + this.bankAngle + ", 0, 0) translate(" + (this.slipSkidValue * 40) + ", 0)");
        if (this.slipSkidTriangle)
            this.slipSkidTriangle.setAttribute("transform", "rotate(" + this.bankAngle + ", 0, 0)");
        if (this.radioAltitude && this.radioAltitudeRotate)
            this.radioAltitude.setAttribute("transform", "rotate(" + this.bankAngle + ", 0, 0)");
        if (this.crossPointersGroup != null || this.cj4_FlightDirector != null) {
            let currentPlaneBank = Simplane.getBank();
            let fdBank = this.cj4_FlightDirectorBank;
            let bankConversion = (currentPlaneBank - fdBank) * 2;
            if (this.cj4_FlightDirectorActive) {
                if (this.cj4_FlightDirectorStyle == 0) {
                    this.crossPointersGroup.setAttribute("display", "none");
                    this.crossPointersPitch.setAttribute("display", "none");
                    this.crossPointersBank.setAttribute("display", "none");
                    this.vBarAircraftSymbol.setAttribute("display", "");
                    this.cj4_FlightDirector.setAttribute("transform", "rotate(" + (-this.cj4_FlightDirectorBank) + ") translate(0 " + ((this.pitchAngle - this.cj4_FlightDirectorPitch) * this.pitchAngleFactor) + ")");
                    this.cj4_FlightDirector.setAttribute("display", "");
                } else if (this.cj4_FlightDirectorStyle == 1) {
                    this.cj4_FlightDirector.setAttribute("display", "none");
                    this.vBarAircraftSymbol.setAttribute("display", "none");
                    this.crossPointersGroup.setAttribute("display", "");
                    this.crossPointersPitch.setAttribute("display", "");
                    this.crossPointersBank.setAttribute("display", "");
                    this.crossPointersPitch.setAttribute("transform", "translate(0 " + ((this.pitchAngle - this.cj4_FlightDirectorPitch) * this.pitchAngleFactor) + ")");
                    this.crossPointersBank.setAttribute("transform", "translate(" + bankConversion + "0)");
                }
            }
            else {
                this.crossPointersPitch.setAttribute("display", "none");
                this.crossPointersBank.setAttribute("display", "none");
                this.cj4_FlightDirector.setAttribute("display", "none");
            }
        }
        if (this.halfBankArc) {
            if (this.cj4_HalfBankActive) {
                this.halfBankArc.setAttribute("display", "");
            } else {
                this.halfBankArc.setAttribute("display", "none");
            }
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue)
            return;
        switch (name) {
            case "pitch":
                this.pitchAngle = parseFloat(newValue);
                break;
            case "bank":
                this.bankAngle = parseFloat(newValue);
                break;
            case "horizon":
                this.horizonAngle = parseFloat(newValue);
                break;
            case "slip_skid":
                this.slipSkidValue = parseFloat(newValue);
                break;
            case "hud":
                this.isHud = newValue == "true";
                break;
            case "background":
                this.horizonVisible = newValue == "true";
                break;
            case "flight_director-active":
                this.cj4_FlightDirectorActive = newValue == "true";
                break;
            case "flight_director-pitch":
                this.cj4_FlightDirectorPitch = parseFloat(newValue);
                break;
            case "flight_director-bank":
                this.cj4_FlightDirectorBank = parseFloat(newValue);
                break;
            case "flight_director-style":
                this.cj4_FlightDirectorStyle = parseInt(newValue);
            case "radio_altitude":
                if (this.radioAltitude) {
                    let val = parseFloat(newValue);
                    this.updateRadioAltitude(val);
                }
                break;
            case "decision_height":
                if (this.radioDecisionHeight) {
                    let val = parseFloat(newValue);
                    this.radioDecisionHeight.textContent = fastToFixed(val, 0);
                }
                break;
            case "half_bank-active":
                this.cj4_HalfBankActive = parseFloat(newValue) > 15 ? false : true;
                break;
            default:
                return;
        }
        this.applyAttributes();
    }
    update(_deltaTime) {
        if (this.flightDirector != null) {
            this.flightDirector.refresh(_deltaTime);
        }
    }
    updateRadioAltitude(_altitude) {
        var xyz = Simplane.getOrientationAxis();
        let val = Math.floor(_altitude);
        if ((val <= 2500) && (Math.abs(xyz.bank) < Math.PI * 0.35)) {
            let textVal;
            {
                let absVal = Math.abs(val);
                if (absVal <= 10)
                    textVal = absVal;
                else if (absVal <= 50)
                    textVal = absVal - (absVal % 5);
                else
                    textVal = absVal - (absVal % 10);
            }
            this.radioAltitude.textContent = (textVal * Math.sign(val)).toString();
            if (this.radioAltitudeColorLimit > 0) {
                if (val >= this.radioAltitudeColorLimit)
                    this.radioAltitude.setAttribute("fill", this.radioAltitudeColorOk);
                else
                    this.radioAltitude.setAttribute("fill", this.radioAltitudeColorBad);
            }
            this.radioAltitudeGroup.setAttribute("visibility", "visible");
        }
        else
            this.radioAltitudeGroup.setAttribute("visibility", "hidden");
    }
}
var Jet_PFD_FlightDirector;
(function (Jet_PFD_FlightDirector) {
    class DisplayBase {
        constructor(_root) {
            this.group = null;
            this.isActive = false;
            if (_root != null) {
                this.group = document.createElementNS(Avionics.SVG.NS, "g");
                this.group.setAttribute("id", this.getGroupName());
                this.group.setAttribute("display", "none");
                this.create();
                _root.appendChild(this.group);
            }
        }
        set active(_active) {
            if (_active != this.isActive) {
                this.isActive = _active;
                if (this.group != null) {
                    this.group.setAttribute("display", this.isActive ? "block" : "none");
                }
            }
        }
        get active() {
            return this.isActive;
        }
        calculatePosXFromBank(_startBank, _targetBank) {
            var bankDiff = _targetBank - _startBank;
            var angleDiff = Math.abs(bankDiff) % 360;
            if (angleDiff > 180) {
                angleDiff = 360 - angleDiff;
            }
            if (angleDiff > DisplayBase.HEADING_MAX_ANGLE) {
                angleDiff = DisplayBase.HEADING_MAX_ANGLE;
            }
            var sign = (((bankDiff >= 0) && (bankDiff <= 180)) || ((bankDiff <= -180) && (bankDiff >= -360))) ? -1 : 1;
            angleDiff *= sign;
            var x = angleDiff * DisplayBase.HEADING_ANGLE_TO_POS;
            return x;
        }
        calculatePosYFromPitch(_startPitch, _targetPitch) {
            var pitchDiff = _targetPitch - _startPitch;
            var y = Utils.Clamp(pitchDiff * DisplayBase.PITCH_ANGLE_TO_POS, -DisplayBase.PITCH_MAX_POS_Y, DisplayBase.PITCH_MAX_POS_Y);
            return y;
        }
        createCircle(_radius) {
            var circle = document.createElementNS(Avionics.SVG.NS, "circle");
            circle.setAttribute("cx", "0");
            circle.setAttribute("cy", "0");
            circle.setAttribute("r", _radius.toString());
            this.applyStyle(circle);
            return circle;
        }
        createLine(_x1, _y1, _x2, _y2) {
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", _x1.toString());
            line.setAttribute("y1", _y1.toString());
            line.setAttribute("x2", _x2.toString());
            line.setAttribute("y2", _y2.toString());
            this.applyStyle(line);
            return line;
        }
        applyStyle(_element) {
            if (_element != null) {
                _element.setAttribute("stroke", this.getColour());
                _element.setAttribute("stroke-width", this.getStrokeWidth());
                _element.setAttribute("fill", "none");
            }
        }
        getStrokeWidth() { return "1.5"; }
    }
    DisplayBase.HEADING_MAX_POS_X = 60;
    DisplayBase.HEADING_MAX_ANGLE = 10;
    DisplayBase.HEADING_ANGLE_TO_POS = DisplayBase.HEADING_MAX_POS_X / DisplayBase.HEADING_MAX_ANGLE;
    DisplayBase.PITCH_MAX_POS_Y = 100;
    DisplayBase.PITCH_MAX_ANGLE = 15;
    DisplayBase.PITCH_ANGLE_TO_POS = DisplayBase.PITCH_MAX_POS_Y / DisplayBase.PITCH_MAX_ANGLE;
    class CommandBarsDisplay extends DisplayBase {
        constructor() {
            super(...arguments);
            this._pitchIsNotReadyYet = true;
            this._fdPitch = 0;
            this._fdBank = 0;
        }
        getGroupName() {
            return "CommandBars";
        }
        create() {
            var halfLineLength = this.getLineLength() * 0.5;
            this.headingLine = this.createLine(0, -halfLineLength, 0, halfLineLength);
            this.group.appendChild(this.headingLine);
            this.pitchLine = this.createLine(-halfLineLength, 0, halfLineLength, 0);
            this.group.appendChild(this.pitchLine);
        }
        refresh(_deltaTime) {
            if (this.headingLine != null) {
                let currentPlaneBank = Simplane.getBank();
                let currentFDBank = Simplane.getFlightDirectorBank();
                let altAboveGround = Simplane.getAltitudeAboveGround();
                if (altAboveGround > 0 && altAboveGround < 10) {
                    currentFDBank = 0;
                }
                this._fdBank += (currentFDBank - this._fdBank) * Math.min(1.0, _deltaTime * 0.001);
                var lineX = Math.max(-1.0, Math.min(1.0, (currentPlaneBank - this._fdBank) / this.getFDBankLimit())) * this.getFDBankDisplayLimit();
                this.headingLine.setAttribute("transform", "translate(" + lineX + ", 0)");
            }
            if (this.pitchLine != null) {
                let currentPlanePitch = Simplane.getPitch();
                let currentFDPitch = Simplane.getFlightDirectorPitch();
                let altAboveGround = Simplane.getAltitudeAboveGround();
                let _bForcedFdPitchThisFrame = false;
                if (altAboveGround > 0 && altAboveGround < 10) {
                    currentFDPitch = -8;
                }
                if (this._pitchIsNotReadyYet) {
                    this._pitchIsNotReadyYet = Math.abs(currentFDPitch) < 2;
                }
                if (this._pitchIsNotReadyYet) {
                    currentFDPitch = currentPlanePitch;
                }
                this._fdPitch += (currentFDPitch - this._fdPitch) * Math.min(1.0, _deltaTime * 0.001);
                var lineY = this.calculatePosYFromPitch(currentPlanePitch, this._fdPitch);
                this.pitchLine.setAttribute("transform", "translate(0, " + lineY + ")");
            }
        }
        getLineLength() { return 140; }
        getStrokeWidth() { return "4"; }
        getFDBankLimit() { return 30; }
        getFDBankDisplayLimit() { return 75; }
    }
    class CommandBarsDisplay_Airbus extends CommandBarsDisplay {
        getLineLength() { return 160; }
        getColour() { return "#24FF00"; }
        getFDBankLimit() { return 30; }
        getFDBankDisplayLimit() { return 75; }
    }
    class CommandBarsDisplay_B747 extends CommandBarsDisplay {
        getColour() { return "magenta"; }
        getFDBankLimit() { return 30; }
        getFDBankDisplayLimit() { return 50; }
    }
    class CommandBarsDisplay_AS01B extends CommandBarsDisplay {
        getLineLength() { return 175; }
        getColour() { return "magenta"; }
        getFDBankLimit() { return 30; }
        getFDBankDisplayLimit() { return 50; }
    }
    class PathVectorDisplay extends DisplayBase {
        getGroupName() {
            return "PathVector";
        }
        create() {
            var circleRadius = this.getCircleRadius();
            var verticalLineLength = this.getVerticalLineLength();
            var horizontalLineLength = this.getHorizontalLineLength();
            this.group.appendChild(this.createCircle(circleRadius));
            this.group.appendChild(this.createLine(-circleRadius, 0, -(circleRadius + horizontalLineLength), 0));
            this.group.appendChild(this.createLine(circleRadius, 0, (circleRadius + horizontalLineLength), 0));
            this.group.appendChild(this.createLine(0, -circleRadius, 0, -(circleRadius + verticalLineLength)));
        }
        refresh(_deltaTime) {
            if (this.group != null) {
                var originalBodyVelocityZ = SimVar.GetSimVarValue("VELOCITY BODY Z", "feet per second");
                if (originalBodyVelocityZ >= PathVectorDisplay.MIN_SPEED_TO_DISPLAY) {
                    var originalBodyVelocityX = SimVar.GetSimVarValue("VELOCITY BODY X", "feet per second");
                    var originalBodyVelocityY = SimVar.GetSimVarValue("VELOCITY WORLD Y", "feet per second");
                    var originalBodyVelocityXSquared = originalBodyVelocityX * originalBodyVelocityX;
                    var originalBodyVelocityYSquared = originalBodyVelocityY * originalBodyVelocityY;
                    var originalBodyVelocityZSquared = originalBodyVelocityZ * originalBodyVelocityZ;
                    var currentHeading = 0;
                    {
                        var bodyNorm = Math.sqrt(originalBodyVelocityXSquared + originalBodyVelocityZSquared);
                        var bodyNormInv = 1 / bodyNorm;
                        var bodyVelocityX = originalBodyVelocityX * bodyNormInv;
                        var bodyVelocityZ = originalBodyVelocityZ * bodyNormInv;
                        bodyNorm = Math.sqrt((bodyVelocityX * bodyVelocityX) + (bodyVelocityZ * bodyVelocityZ));
                        var angle = bodyVelocityZ / bodyNorm;
                        angle = Utils.Clamp(angle, -1, 1);
                        currentHeading = Math.acos(angle) * (180 / Math.PI);
                        if (bodyVelocityX > 0) {
                            currentHeading *= -1;
                        }
                    }
                    var currentPitch = 0;
                    {
                        var bodyNorm = Math.sqrt(originalBodyVelocityYSquared + originalBodyVelocityZSquared);
                        var bodyNormInv = 1 / bodyNorm;
                        var bodyVelocityY = originalBodyVelocityY * bodyNormInv;
                        var bodyVelocityZ = originalBodyVelocityZ * bodyNormInv;
                        bodyNorm = Math.sqrt((bodyVelocityY * bodyVelocityY) + (bodyVelocityZ * bodyVelocityZ));
                        var angle = bodyVelocityZ / bodyNorm;
                        angle = Utils.Clamp(angle, -1, 1);
                        currentPitch = Math.acos(angle) * (180 / Math.PI);
                        if (bodyVelocityY > 0) {
                            currentPitch *= -1;
                        }
                    }
                    var x = this.calculatePosXFromBank(currentHeading, 0);
                    var y = this.calculatePosYFromPitch(currentPitch, 0);
                    this.group.setAttribute("transform", "translate(" + x + ", " + y + ")");
                }
                else {
                    this.group.setAttribute("transform", "translate(0, 0)");
                }
            }
        }
    }
    PathVectorDisplay.MIN_SPEED_TO_DISPLAY = 25;
    class FPV_Airbus extends PathVectorDisplay {
        getColour() { return "#24FF00"; }
        getCircleRadius() { return 10; }
        getVerticalLineLength() { return 15; }
        getHorizontalLineLength() { return 15; }
    }
    class FPV_Boeing extends PathVectorDisplay {
        getColour() { return "white"; }
        getCircleRadius() { return 10; }
        getVerticalLineLength() { return 15; }
        getHorizontalLineLength() { return 40; }
    }
    class FPD_Airbus extends DisplayBase {
        getGroupName() {
            return "FlightPathDirector";
        }
        create() {
            this.group.appendChild(this.createCircle(FPD_Airbus.CIRCLE_RADIUS));
            var path = document.createElementNS(Avionics.SVG.NS, "path");
            var d = [
                "M", -(FPD_Airbus.LINE_LENGTH * 0.5), ", 0",
                " l", -FPD_Airbus.TRIANGLE_LENGTH, ",", -(FPD_Airbus.TRIANGLE_HEIGHT * 0.5),
                " l0,", FPD_Airbus.TRIANGLE_HEIGHT,
                " l", FPD_Airbus.TRIANGLE_LENGTH, ",", -(FPD_Airbus.TRIANGLE_HEIGHT * 0.5),
                " l", FPD_Airbus.LINE_LENGTH, ",0",
                " l", FPD_Airbus.TRIANGLE_LENGTH, ",", -(FPD_Airbus.TRIANGLE_HEIGHT * 0.5),
                " l0,", FPD_Airbus.TRIANGLE_HEIGHT,
                " l", -FPD_Airbus.TRIANGLE_LENGTH, ",", -(FPD_Airbus.TRIANGLE_HEIGHT * 0.5)
            ].join("");
            path.setAttribute("d", d);
            this.applyStyle(path);
            this.group.appendChild(path);
        }
        refresh(_deltaTime) {
            if (this.group != null) {
                var x = this.calculatePosXFromBank(Simplane.getBank(), Simplane.getFlightDirectorBank());
                var y = this.calculatePosYFromPitch(Simplane.getPitch(), Simplane.getFlightDirectorPitch());
                var angle = -Simplane.getBank();
                this.group.setAttribute("transform", "translate(" + x + ", " + y + ") rotate(" + angle + ")");
            }
        }
        getColour() { return "#24FF00"; }
    }
    FPD_Airbus.CIRCLE_RADIUS = 5;
    FPD_Airbus.LINE_LENGTH = 40;
    FPD_Airbus.TRIANGLE_LENGTH = 20;
    FPD_Airbus.TRIANGLE_HEIGHT = 10;
    class FPA_Boeing extends DisplayBase {
        getGroupName() {
            return "FlightPathAngle";
        }
        create() {
            var path = document.createElementNS(Avionics.SVG.NS, "path");
            var d = [
                "M", -FPA_Boeing.LINE_OFFSET.x, ",", -FPA_Boeing.LINE_OFFSET.y,
                " l", -FPA_Boeing.LINE_LENGTH, ",0",
                " m0,", (FPA_Boeing.LINE_OFFSET.y * 2),
                " l", FPA_Boeing.LINE_LENGTH, ",0",
                " m", (FPA_Boeing.LINE_OFFSET.x * 2), ",0",
                " l", FPA_Boeing.LINE_LENGTH, ",0",
                " m0,", -(FPA_Boeing.LINE_OFFSET.y * 2),
                " l", -FPA_Boeing.LINE_LENGTH, ",0",
            ].join("");
            path.setAttribute("d", d);
            this.applyStyle(path);
            this.group.appendChild(path);
        }
        refresh(_deltaTime) {
            if (this.group != null) {
                var y = this.calculatePosYFromPitch(0, Simplane.getAutoPilotFlightPathAngle());
                this.group.setAttribute("transform", "translate(0, " + y + ") rotate(0)");
            }
        }
        getColour() { return "white"; }
    }
    FPA_Boeing.LINE_LENGTH = 30;
    FPA_Boeing.LINE_OFFSET = new Vec2(30, 6);
    class Handler {
        constructor() {
            this.root = null;
            this.displayMode = new Array();
            this.fFDPitchOffset = 0.0;
        }
        init(_root) {
            this.root = _root;
            if (this.root != null) {
                this.initDefaultValues();
                var group = document.createElementNS(Avionics.SVG.NS, "g");
                group.setAttribute("id", "FlightDirectorDisplay");
                group.setAttribute("transform", "translate(0, " + this.fFDPitchOffset + ")");
                this.createDisplayModes(group);
                this.root.appendChild(group);
            }
        }
        refresh(_deltaTime) {
            this.refreshActiveModes();
            for (var mode = 0; mode < this.displayMode.length; ++mode) {
                if ((this.displayMode[mode] != null) && this.displayMode[mode].active) {
                    this.displayMode[mode].refresh(_deltaTime);
                }
            }
        }
        setModeActive(_mode, _active) {
            if ((_mode >= 0) && (_mode < this.displayMode.length) && (this.displayMode[_mode] != null)) {
                this.displayMode[_mode].active = _active;
            }
        }
    }
    Jet_PFD_FlightDirector.Handler = Handler;
    class A320_Neo_Handler extends Handler {
        createDisplayModes(_group) {
            this.displayMode.push(new CommandBarsDisplay_Airbus(_group));
            this.displayMode.push(new FPV_Airbus(_group));
            this.displayMode.push(new FPD_Airbus(_group));
        }
        refreshActiveModes() {
            var fdActive = (Simplane.getAutoPilotFlightDirectorActive(1));
            var trkfpaMode = Simplane.getAutoPilotTRKFPAModeActive();
            this.setModeActive(0, fdActive && !trkfpaMode);
            this.setModeActive(1, trkfpaMode);
            this.setModeActive(2, fdActive && trkfpaMode);
        }
        initDefaultValues() {
            this.fFDPitchOffset = -2.5;
        }
    }
    Jet_PFD_FlightDirector.A320_Neo_Handler = A320_Neo_Handler;
    class B747_8_Handler extends Handler {
        createDisplayModes(_group) {
            this.displayMode.push(new CommandBarsDisplay_B747(_group));
            this.displayMode.push(new FPV_Boeing(_group));
        }
        refreshActiveModes() {
            var fdActive = (Simplane.getAutoPilotFlightDirectorActive(1));
            this.setModeActive(0, fdActive);
            this.setModeActive(1, fdActive && Simplane.getAutoPilotFPAModeActive());
        }
        initDefaultValues() {
            this.fFDPitchOffset = 1.75;
        }
    }
    Jet_PFD_FlightDirector.B747_8_Handler = B747_8_Handler;
    class AS01B_Handler extends Handler {
        createDisplayModes(_group) {
            this.displayMode.push(new CommandBarsDisplay_AS01B(_group));
            this.displayMode.push(new FPV_Boeing(_group));
            this.displayMode.push(new FPA_Boeing(_group));
        }
        refreshActiveModes() {
            var fdActive = (Simplane.getAutoPilotFlightDirectorActive(1));
            var fpaMode = Simplane.getAutoPilotFPAModeActive();
            this.setModeActive(0, fdActive);
            this.setModeActive(1, fdActive && fpaMode);
            this.setModeActive(2, fdActive && fpaMode);
        }
        initDefaultValues() {
            this.fFDPitchOffset = -1.75;
        }
    }
    Jet_PFD_FlightDirector.AS01B_Handler = AS01B_Handler;
})(Jet_PFD_FlightDirector || (Jet_PFD_FlightDirector = {}));
customElements.define("jet-pfd-attitude-indicator", Jet_PFD_AttitudeIndicator);
//# sourceMappingURL=AttitudeIndicator.js.map