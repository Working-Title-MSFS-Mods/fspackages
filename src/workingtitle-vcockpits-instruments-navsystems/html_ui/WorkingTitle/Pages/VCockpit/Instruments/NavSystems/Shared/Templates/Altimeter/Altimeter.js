Include.addScript("/Pages/VCockpit/Instruments/Shared/WorkingTitle/DataStore.js");

class Altimeter extends HTMLElement {
    constructor() {
        super();
        this.currentCenterGrad = -10000;
        this.minimumAltitude = NaN;
        this.compactVs = false;
        this.height = 700;
        this.baroMode = WTDataStore.get("Alt.BaroMode", "IN");
        this.lastPressure = "29.92";
    }
    static get observedAttributes() {
        return [
            "altitude",
            "radar-altitude",
            "reference-altitude",
            "no-reference-altitude",
            "minimum-altitude",
            "minimum-altitude-state",
            "pressure",
            "no-pressure",
            "vspeed",
            "reference-vspeed",
            "vertical-deviation-mode",
            "vertical-deviation-value",
            "selected-altitude-alert",
            "baro-mode"
        ];
    }
    parseDefinitionAttributes() {
        let height = this.getAttribute("height");
        if (height) {
            this.height = parseFloat(height);
        }
    }
    connectedCallback() {
        this.parseDefinitionAttributes();
        let vsStyle = this.getAttribute("VSStyle");
        if (!vsStyle) {
            vsStyle = "Default";
        }
        else if (vsStyle == "Compact") {
            this.compactVs = true;
        }
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        diffAndSetAttribute(this.root, "width", "100%");
        diffAndSetAttribute(this.root, "height", "100%");
        diffAndSetAttribute(this.root, "viewBox", "-50 -100 " + (this.compactVs ? 300 : 380) + " " + this.height);
        this.appendChild(this.root);
        let centerY = this.height / 2 - 100;
        {
            this.verticalDeviationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            diffAndSetAttribute(this.verticalDeviationGroup, "visibility", "hidden");
            this.root.appendChild(this.verticalDeviationGroup);
            let background = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(background, "x", "-50");
            diffAndSetAttribute(background, "y", (centerY - 200) + '');
            diffAndSetAttribute(background, "width", "50");
            diffAndSetAttribute(background, "height", "400");
            diffAndSetAttribute(background, "fill", "#1a1d21");
            diffAndSetAttribute(background, "fill-opacity", "0.25");
            this.verticalDeviationGroup.appendChild(background);
            let topBackground = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(topBackground, "x", "-50");
            diffAndSetAttribute(topBackground, "y", (centerY - 250) + '');
            diffAndSetAttribute(topBackground, "width", "50");
            diffAndSetAttribute(topBackground, "height", "50");
            diffAndSetAttribute(topBackground, "fill", "#1a1d21");
            this.verticalDeviationGroup.appendChild(topBackground);
            this.verticalDeviationText = document.createElementNS(Avionics.SVG.NS, "text");
            diffAndSetAttribute(this.verticalDeviationText, "x", "-25");
            diffAndSetAttribute(this.verticalDeviationText, "y", (centerY - 210) + '');
            diffAndSetAttribute(this.verticalDeviationText, "fill", "#d12bc7");
            diffAndSetAttribute(this.verticalDeviationText, "font-size", "45");
            diffAndSetAttribute(this.verticalDeviationText, "font-family", "Roboto-Bold");
            diffAndSetAttribute(this.verticalDeviationText, "text-anchor", "middle");
            diffAndSetText(this.verticalDeviationText, "V");
            this.verticalDeviationGroup.appendChild(this.verticalDeviationText);
            for (let i = -2; i <= 2; i++) {
                if (i != 0) {
                    let grad = document.createElementNS(Avionics.SVG.NS, "circle");
                    diffAndSetAttribute(grad, "cx", "-25");
                    diffAndSetAttribute(grad, "cy", (centerY + 66 * i) + '');
                    diffAndSetAttribute(grad, "r", "6");
                    diffAndSetAttribute(grad, "stroke", "white");
                    diffAndSetAttribute(grad, "stroke-width", "3");
                    diffAndSetAttribute(grad, "fill-opacity", "0");
                    this.verticalDeviationGroup.appendChild(grad);
                }
            }
            this.chevronBug = document.createElementNS(Avionics.SVG.NS, "polygon");
            diffAndSetAttribute(this.chevronBug, "points", "-45," + centerY + " -10," + (centerY - 20) + " -10," + (centerY - 10) + " -25," + centerY + " -10," + (centerY + 10) + " -10," + (centerY + 20));
            diffAndSetAttribute(this.chevronBug, "fill", "#d12bc7");
            this.verticalDeviationGroup.appendChild(this.chevronBug);
            this.diamondBug = document.createElementNS(Avionics.SVG.NS, "polygon");
            diffAndSetAttribute(this.diamondBug, "points", "-40," + centerY + " -25," + (centerY - 15) + " -10," + centerY + " -25," + (centerY + 15));
            diffAndSetAttribute(this.diamondBug, "fill", "#10c210");
            this.verticalDeviationGroup.appendChild(this.diamondBug);
            this.hollowDiamondBug = document.createElementNS(Avionics.SVG.NS, "polygon");
            diffAndSetAttribute(this.hollowDiamondBug, "points", "-40," + centerY + " -25," + (centerY - 15) + " -10," + centerY + " -25," + (centerY + 15) + " -25," + (centerY + 5) + " -20," + centerY + " -25," + (centerY - 5) + " -30," + centerY + " -25," + (centerY + 5) + " -25," + (centerY + 15));
            diffAndSetAttribute(this.hollowDiamondBug, "fill", "#DFDFDF");
            this.verticalDeviationGroup.appendChild(this.hollowDiamondBug);
        }
        {
            this.selectedAltitudeBackground = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(this.selectedAltitudeBackground, "x", "0");
            diffAndSetAttribute(this.selectedAltitudeBackground, "y", "-100");
            diffAndSetAttribute(this.selectedAltitudeBackground, "width", this.compactVs ? "250" : "200");
            diffAndSetAttribute(this.selectedAltitudeBackground, "height", "50");
            diffAndSetAttribute(this.selectedAltitudeBackground, "fill", "#1a1d21");
            this.root.appendChild(this.selectedAltitudeBackground);
            this.selectedAltitudeFixedBug = document.createElementNS(Avionics.SVG.NS, "polygon");
            diffAndSetAttribute(this.selectedAltitudeFixedBug, "points", "10,-90 20,-90 20,-80 15,-75 20,-70 20,-60 10,-60 ");
            diffAndSetAttribute(this.selectedAltitudeFixedBug, "fill", "#36c8d2");
            this.root.appendChild(this.selectedAltitudeFixedBug);
            this.selectedAltText = document.createElementNS(Avionics.SVG.NS, "text");
            diffAndSetAttribute(this.selectedAltText, "x", "125");
            diffAndSetAttribute(this.selectedAltText, "y", "-60");
            diffAndSetAttribute(this.selectedAltText, "fill", "#36c8d2");
            diffAndSetAttribute(this.selectedAltText, "font-size", "45");
            diffAndSetAttribute(this.selectedAltText, "font-family", "Roboto-Bold");
            diffAndSetAttribute(this.selectedAltText, "text-anchor", "middle");
            diffAndSetText(this.selectedAltText, "----");
            this.root.appendChild(this.selectedAltText);
        }
        {
            let background = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(background, "x", "0");
            diffAndSetAttribute(background, "y", "-50");
            diffAndSetAttribute(background, "width", "200");
            diffAndSetAttribute(background, "height", (this.height - 100) + '');
            diffAndSetAttribute(background, "fill", "#1a1d21");
            diffAndSetAttribute(background, "fill-opacity", "0.25");
            this.root.appendChild(background);
            let graduationSvg = document.createElementNS(Avionics.SVG.NS, "svg");
            diffAndSetAttribute(graduationSvg, "x", "0");
            diffAndSetAttribute(graduationSvg, "y", "-50");
            diffAndSetAttribute(graduationSvg, "width", "200");
            diffAndSetAttribute(graduationSvg, "height", (this.height - 100) + '');
            diffAndSetAttribute(graduationSvg, "viewBox", "0 0 200 " + (this.height - 100));
            this.root.appendChild(graduationSvg);
            let center = (this.height - 100) / 2;
            this.graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationSvg.appendChild(this.graduationGroup);
            {
                let graduationSize = 160;
                this.graduationTexts = [];
                let n = Math.ceil((this.height - 100) / 200);
                for (let i = -n; i <= n; i++) {
                    let mainGrad = document.createElementNS(Avionics.SVG.NS, "rect");
                    diffAndSetAttribute(mainGrad, "x", "0");
                    diffAndSetAttribute(mainGrad, "y", fastToFixed(center - 2 + i * graduationSize, 0));
                    diffAndSetAttribute(mainGrad, "height", "4");
                    diffAndSetAttribute(mainGrad, "width", "40");
                    diffAndSetAttribute(mainGrad, "fill", "white");
                    this.graduationGroup.appendChild(mainGrad);
                    let gradText = document.createElementNS(Avionics.SVG.NS, "text");
                    diffAndSetAttribute(gradText, "x", "50");
                    diffAndSetAttribute(gradText, "y", fastToFixed(center + 16 + i * graduationSize, 0));
                    diffAndSetAttribute(gradText, "fill", "white");
                    diffAndSetAttribute(gradText, "font-size", "45");
                    diffAndSetAttribute(gradText, "font-family", "Roboto-Bold");
                    diffAndSetText(gradText, "XXXX");
                    this.graduationGroup.appendChild(gradText);
                    this.graduationTexts.push(gradText);
                    for (let j = 1; j < 5; j++) {
                        let grad = document.createElementNS(Avionics.SVG.NS, "rect");
                        diffAndSetAttribute(grad, "x", "0");
                        diffAndSetAttribute(grad, "y", fastToFixed(center - 2 + i * graduationSize + j * (graduationSize / 5), 0));
                        diffAndSetAttribute(grad, "height", "4");
                        diffAndSetAttribute(grad, "width", "15");
                        diffAndSetAttribute(grad, "fill", "white");
                        this.graduationGroup.appendChild(grad);
                    }
                }
            }
            this.trendElement = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(this.trendElement, "x", "0");
            diffAndSetAttribute(this.trendElement, "y", "-50");
            diffAndSetAttribute(this.trendElement, "width", "8");
            diffAndSetAttribute(this.trendElement, "height", "0");
            diffAndSetAttribute(this.trendElement, "fill", "#d12bc7");
            this.root.appendChild(this.trendElement);
            this.groundLine = document.createElementNS(Avionics.SVG.NS, "g");
            diffAndSetAttribute(this.groundLine, "transform", "translate(0, " + this.height + ")");
            graduationSvg.appendChild(this.groundLine);
            {
                let background = document.createElementNS(Avionics.SVG.NS, "rect");
                diffAndSetAttribute(background, "fill", "#654222");
                diffAndSetAttribute(background, "stroke", "white");
                diffAndSetAttribute(background, "stroke-width", "4");
                diffAndSetAttribute(background, "x", "0");
                diffAndSetAttribute(background, "y", "0");
                diffAndSetAttribute(background, "width", "196");
                diffAndSetAttribute(background, "height", (this.height - 100) + '');
                this.groundLine.appendChild(background);
                let groundLineSvg = document.createElementNS(Avionics.SVG.NS, "svg");
                diffAndSetAttribute(groundLineSvg, "x", "0");
                diffAndSetAttribute(groundLineSvg, "y", "0");
                diffAndSetAttribute(groundLineSvg, "width", "200");
                diffAndSetAttribute(groundLineSvg, "height", (this.height - 100) + '');
                diffAndSetAttribute(groundLineSvg, "viewBox", "0 0 200 " + (this.height - 100));
                this.groundLine.appendChild(groundLineSvg);
                for (let i = -5; i <= 25; i++) {
                    let line = document.createElementNS(Avionics.SVG.NS, "rect");
                    diffAndSetAttribute(line, "fill", "white");
                    diffAndSetAttribute(line, "x", "0");
                    diffAndSetAttribute(line, "y", (-50 + i * 30) + '');
                    diffAndSetAttribute(line, "width", "200");
                    diffAndSetAttribute(line, "height", "4");
                    diffAndSetAttribute(line, "transform", "skewY(-30)");
                    groundLineSvg.appendChild(line);
                }
            }
            let cursor = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(cursor, "d", "M0 " + center + " L30 " + (center - 40) + " L130 " + (center - 40) + " L130 " + (center - 60) + " L200 " + (center - 60) + " L200 " + (center + 60) + " L130 " + (center + 60) + " L130 " + (center + 40) + " L30 " + (center + 40) + "Z");
            diffAndSetAttribute(cursor, "fill", "#1a1d21");
            graduationSvg.appendChild(cursor);
            let cursorBaseSvg = document.createElementNS(Avionics.SVG.NS, "svg");
            diffAndSetAttribute(cursorBaseSvg, "x", "30");
            diffAndSetAttribute(cursorBaseSvg, "y", (center - 40) + '');
            diffAndSetAttribute(cursorBaseSvg, "width", "100");
            diffAndSetAttribute(cursorBaseSvg, "height", "80");
            diffAndSetAttribute(cursorBaseSvg, "viewBox", "0 0 100 80");
            graduationSvg.appendChild(cursorBaseSvg);
            {
                this.digit1Top = document.createElementNS(Avionics.SVG.NS, "text");
                diffAndSetAttribute(this.digit1Top, "x", "16");
                diffAndSetAttribute(this.digit1Top, "y", "-1");
                diffAndSetAttribute(this.digit1Top, "fill", "white");
                diffAndSetAttribute(this.digit1Top, "font-size", "50");
                diffAndSetAttribute(this.digit1Top, "font-family", "Roboto-Bold");
                diffAndSetText(this.digit1Top, "X");
                cursorBaseSvg.appendChild(this.digit1Top);
                this.digit1Bot = document.createElementNS(Avionics.SVG.NS, "text");
                diffAndSetAttribute(this.digit1Bot, "x", "16");
                diffAndSetAttribute(this.digit1Bot, "y", "57");
                diffAndSetAttribute(this.digit1Bot, "fill", "white");
                diffAndSetAttribute(this.digit1Bot, "font-size", "50");
                diffAndSetAttribute(this.digit1Bot, "font-family", "Roboto-Bold");
                diffAndSetText(this.digit1Bot, "X");
                cursorBaseSvg.appendChild(this.digit1Bot);
                this.digit2Top = document.createElementNS(Avionics.SVG.NS, "text");
                diffAndSetAttribute(this.digit2Top, "x", "44");
                diffAndSetAttribute(this.digit2Top, "y", "-1");
                diffAndSetAttribute(this.digit2Top, "fill", "white");
                diffAndSetAttribute(this.digit2Top, "font-size", "50");
                diffAndSetAttribute(this.digit2Top, "font-family", "Roboto-Bold");
                diffAndSetText(this.digit2Top, "X");
                cursorBaseSvg.appendChild(this.digit2Top);
                this.digit2Bot = document.createElementNS(Avionics.SVG.NS, "text");
                diffAndSetAttribute(this.digit2Bot, "x", "44");
                diffAndSetAttribute(this.digit2Bot, "y", "57");
                diffAndSetAttribute(this.digit2Bot, "fill", "white");
                diffAndSetAttribute(this.digit2Bot, "font-size", "50");
                diffAndSetAttribute(this.digit2Bot, "font-family", "Roboto-Bold");
                diffAndSetText(this.digit2Bot, "X");
                cursorBaseSvg.appendChild(this.digit2Bot);
                this.digit3Top = document.createElementNS(Avionics.SVG.NS, "text");
                diffAndSetAttribute(this.digit3Top, "x", "72");
                diffAndSetAttribute(this.digit3Top, "y", "-1");
                diffAndSetAttribute(this.digit3Top, "fill", "white");
                diffAndSetAttribute(this.digit3Top, "font-size", "50");
                diffAndSetAttribute(this.digit3Top, "font-family", "Roboto-Bold");
                diffAndSetText(this.digit3Top, "X");
                cursorBaseSvg.appendChild(this.digit3Top);
                this.digit3Bot = document.createElementNS(Avionics.SVG.NS, "text");
                diffAndSetAttribute(this.digit3Bot, "x", "72");
                diffAndSetAttribute(this.digit3Bot, "y", "57");
                diffAndSetAttribute(this.digit3Bot, "fill", "white");
                diffAndSetAttribute(this.digit3Bot, "font-size", "50");
                diffAndSetAttribute(this.digit3Bot, "font-family", "Roboto-Bold");
                diffAndSetText(this.digit3Bot, "X");
                cursorBaseSvg.appendChild(this.digit3Bot);
            }
            let cursorRotatingSvg = document.createElementNS(Avionics.SVG.NS, "svg");
            diffAndSetAttribute(cursorRotatingSvg, "x", "130");
            diffAndSetAttribute(cursorRotatingSvg, "y", (center - 60) + '');
            diffAndSetAttribute(cursorRotatingSvg, "width", "70");
            diffAndSetAttribute(cursorRotatingSvg, "height", "120");
            diffAndSetAttribute(cursorRotatingSvg, "viewBox", "0 -50 70 120");
            graduationSvg.appendChild(cursorRotatingSvg);
            {
                this.endDigitsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                cursorRotatingSvg.appendChild(this.endDigitsGroup);
                this.endDigits = [];
                for (let i = -2; i <= 2; i++) {
                    let digit = document.createElementNS(Avionics.SVG.NS, "text");
                    diffAndSetAttribute(digit, "x", "7");
                    diffAndSetAttribute(digit, "y", (27 + 45 * i) + '');
                    diffAndSetAttribute(digit, "fill", "white");
                    diffAndSetAttribute(digit, "font-size", "50");
                    diffAndSetAttribute(digit, "font-family", "Roboto-Bold");
                    diffAndSetText(digit, "XX");
                    this.endDigits.push(digit);
                    this.endDigitsGroup.appendChild(digit);
                }
            }
            this.bugsGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationSvg.appendChild(this.bugsGroup);
            {
                this.selectedAltitudeBug = document.createElementNS(Avionics.SVG.NS, "polygon");
                diffAndSetAttribute(this.selectedAltitudeBug, "points", "0," + (center - 20) + " 20," + (center - 20) + " 20," + (center - 15) + " 10," + center + " 20," + (center + 15) + " 20," + (center + 20) + " 0," + (center + 20));
                diffAndSetAttribute(this.selectedAltitudeBug, "fill", "#36c8d2");
                this.bugsGroup.appendChild(this.selectedAltitudeBug);
                this.minimumAltitudeBug = document.createElementNS(Avionics.SVG.NS, "polyline");
                diffAndSetAttribute(this.minimumAltitudeBug, "points", "20," + (center - 40) + " 20," + (center - 27) + " 0," + center + " 20," + (center + 27) + " 20," + (center + 40));
                diffAndSetAttribute(this.minimumAltitudeBug, "stroke", "#36c8d2");
                diffAndSetAttribute(this.minimumAltitudeBug, "fill", "none");
                diffAndSetAttribute(this.minimumAltitudeBug, "display", "none");
                diffAndSetAttribute(this.minimumAltitudeBug, "stroke-width", "5");
                this.bugsGroup.appendChild(this.minimumAltitudeBug);
            }
        }
        {
            this.pressureBackground = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(this.pressureBackground, "x", "0");
            diffAndSetAttribute(this.pressureBackground, "y", (this.height - 100 - 50) + '');
            diffAndSetAttribute(this.pressureBackground, "width", "250");
            diffAndSetAttribute(this.pressureBackground, "height", "50");
            diffAndSetAttribute(this.pressureBackground, "fill", "#1a1d21");
            this.root.appendChild(this.pressureBackground);
            this.baroText = document.createElementNS(Avionics.SVG.NS, "text");
            diffAndSetAttribute(this.baroText, "x", "125");
            diffAndSetAttribute(this.baroText, "y", (this.height - 100 - 10) + '');
            diffAndSetAttribute(this.baroText, "fill", "#36c8d2");
            diffAndSetAttribute(this.baroText, "font-size", "45");
            diffAndSetAttribute(this.baroText, "font-family", "Roboto-Bold");
            diffAndSetAttribute(this.baroText, "text-anchor", "middle");
            diffAndSetText(this.baroText, "--.--IN");
            this.root.appendChild(this.baroText);
        }
        {
            switch (vsStyle) {
                case "Compact":
                    {
                        let verticalSpeedGroup = document.createElementNS(Avionics.SVG.NS, "g");
                        diffAndSetAttribute(verticalSpeedGroup, "id", "VerticalSpeed");
                        this.root.appendChild(verticalSpeedGroup);
                        let background = document.createElementNS(Avionics.SVG.NS, "path");
                        diffAndSetAttribute(background, "d", "M200 -50 v" + (this.height - 100) + " H250 V-" + (centerY + 25) + " l-40 -25 l40 -25 V-50 Z");
                        diffAndSetAttribute(background, "fill", "#1a1d21");
                        diffAndSetAttribute(background, "fill-opacity", "0.25");
                        verticalSpeedGroup.appendChild(background);
                        let leftBar = document.createElementNS(Avionics.SVG.NS, "rect");
                        diffAndSetAttribute(leftBar, "x", "210");
                        diffAndSetAttribute(leftBar, "y", (centerY - 240) + '');
                        diffAndSetAttribute(leftBar, "height", '480');
                        diffAndSetAttribute(leftBar, "width", "2");
                        diffAndSetAttribute(leftBar, "fill", "white");
                        verticalSpeedGroup.appendChild(leftBar);
                        let dashes = [-240, -200, -160, -80, 80, 160, 200, 240];
                        let texts = ["2", "", "1", ".5", ".5", "1", "", "2"];
                        let height = 2.5;
                        let width = 20;
                        let fontSize = 30;
                        for (let i = 0; i < dashes.length; i++) {
                            let rect = document.createElementNS(Avionics.SVG.NS, "rect");
                            diffAndSetAttribute(rect, "x", "200");
                            diffAndSetAttribute(rect, "y", (centerY - dashes[i] - height / 2) + '');
                            diffAndSetAttribute(rect, "height", height + '');
                            diffAndSetAttribute(rect, "width", (width) + '');
                            diffAndSetAttribute(rect, "fill", "white");
                            verticalSpeedGroup.appendChild(rect);
                            if (texts[i] != "") {
                                let text = document.createElementNS(Avionics.SVG.NS, "text");
                                diffAndSetText(text, texts[i]);
                                diffAndSetAttribute(text, "y", ((centerY - dashes[i] - height / 2) + fontSize / 3) + '');
                                diffAndSetAttribute(text, "x", "235");
                                diffAndSetAttribute(text, "fill", "white");
                                diffAndSetAttribute(text, "font-size", fontSize + '');
                                diffAndSetAttribute(text, "font-family", "Roboto-Bold");
                                diffAndSetAttribute(text, "text-anchor", "middle");
                                verticalSpeedGroup.appendChild(text);
                            }
                        }
                        this.selectedVSBug = document.createElementNS(Avionics.SVG.NS, "polygon");
                        diffAndSetAttribute(this.selectedVSBug, "points", "200, " + (centerY - 20) + " 220, " + (centerY - 20) + " 220, " + (centerY - 15) + " 210, " + centerY + " 220, " + (centerY + 15) + " 220, " + (centerY + 20) + " 200, " + (centerY + 20));
                        diffAndSetAttribute(this.selectedVSBug, "fill", "#36c8d2");
                        verticalSpeedGroup.appendChild(this.selectedVSBug);
                        {
                            this.indicator = document.createElementNS(Avionics.SVG.NS, "polygon");
                            diffAndSetAttribute(this.indicator, "points", centerY + ",275 " + (centerY - 40) + ",250 " + centerY + ",225");
                            diffAndSetAttribute(this.indicator, "points", "250," + (centerY + 25) + " 210," + centerY + " 250," + (centerY - 25));
                            diffAndSetAttribute(this.indicator, "stroke", "#1a1d21");
                            diffAndSetAttribute(this.indicator, "fill", "white");
                            verticalSpeedGroup.appendChild(this.indicator);
                        }
                    }
                    break;
                case "Default":
                default:
                    {
                        let verticalSpeedGroup = document.createElementNS(Avionics.SVG.NS, "g");
                        diffAndSetAttribute(verticalSpeedGroup, "id", "VerticalSpeed");
                        this.root.appendChild(verticalSpeedGroup);
                        let background = document.createElementNS(Avionics.SVG.NS, "path");
                        diffAndSetAttribute(background, "d", "M200 0 V" + (this.height - 200) + " H275 V" + (centerY + 50) + " L210 " + centerY + " L275 " + (centerY - 50) + " V0 Z");
                        diffAndSetAttribute(background, "fill", "#1a1d21");
                        diffAndSetAttribute(background, "fill-opacity", "0.25");
                        verticalSpeedGroup.appendChild(background);
                        let dashes = [-200, -150, -100, -50, 50, 100, 150, 200];
                        let height = 3;
                        let width = 10;
                        let fontSize = 30;
                        for (let i = 0; i < dashes.length; i++) {
                            let rect = document.createElementNS(Avionics.SVG.NS, "rect");
                            diffAndSetAttribute(rect, "x", "200");
                            diffAndSetAttribute(rect, "y", (centerY - dashes[i] - height / 2) + '');
                            diffAndSetAttribute(rect, "height", height + '');
                            diffAndSetAttribute(rect, "width", ((dashes[i] % 100) == 0 ? 2 * width : width) + '');
                            diffAndSetAttribute(rect, "fill", "white");
                            verticalSpeedGroup.appendChild(rect);
                            if ((dashes[i] % 100) == 0) {
                                let text = document.createElementNS(Avionics.SVG.NS, "text");
                                diffAndSetText(text, (dashes[i] / 100) + '');
                                diffAndSetAttribute(text, "y", ((centerY - dashes[i] - height / 2) + fontSize / 3) + '');
                                diffAndSetAttribute(text, "x", (200 + 3 * width) + '');
                                diffAndSetAttribute(text, "fill", "white");
                                diffAndSetAttribute(text, "font-size", fontSize + '');
                                diffAndSetAttribute(text, "font-family", "Roboto-Bold");
                                verticalSpeedGroup.appendChild(text);
                            }
                        }
                        this.selectedVSBug = document.createElementNS(Avionics.SVG.NS, "polygon");
                        diffAndSetAttribute(this.selectedVSBug, "points", "200, " + (centerY - 20) + " 220, " + (centerY - 20) + " 220, " + (centerY - 15) + " 210, " + centerY + " 220, " + (centerY + 15) + " 220, " + (centerY + 20) + " 200, " + (centerY + 20));
                        diffAndSetAttribute(this.selectedVSBug, "fill", "#36c8d2");
                        verticalSpeedGroup.appendChild(this.selectedVSBug);
                        {
                            this.indicator = document.createElementNS(Avionics.SVG.NS, "g");
                            verticalSpeedGroup.appendChild(this.indicator);
                            let indicatorBackground = document.createElementNS(Avionics.SVG.NS, "path");
                            diffAndSetAttribute(indicatorBackground, "d", "M210 " + centerY + " L235 " + (centerY + 25) + " H330 V" + (centerY - 25) + " H235 Z");
                            diffAndSetAttribute(indicatorBackground, "fill", "#1a1d21");
                            this.indicator.appendChild(indicatorBackground);
                            this.indicatorText = document.createElementNS(Avionics.SVG.NS, "text");
                            diffAndSetText(this.indicatorText, "-0000");
                            diffAndSetAttribute(this.indicatorText, "x", "235");
                            diffAndSetAttribute(this.indicatorText, "y", (centerY + 10) + '');
                            diffAndSetAttribute(this.indicatorText, "fill", "white");
                            diffAndSetAttribute(this.indicatorText, "font-size", fontSize + '');
                            diffAndSetAttribute(this.indicatorText, "font-family", "Roboto-Bold");
                            this.indicator.appendChild(this.indicatorText);
                        }
                        this.selectedVSBackground = document.createElementNS(Avionics.SVG.NS, "rect");
                        diffAndSetAttribute(this.selectedVSBackground, "x", "200");
                        diffAndSetAttribute(this.selectedVSBackground, "y", "-50");
                        diffAndSetAttribute(this.selectedVSBackground, "width", "75");
                        diffAndSetAttribute(this.selectedVSBackground, "height", "50");
                        diffAndSetAttribute(this.selectedVSBackground, "fill", "#1a1d21");
                        verticalSpeedGroup.appendChild(this.selectedVSBackground);
                        this.selectedVSText = document.createElementNS(Avionics.SVG.NS, "text");
                        diffAndSetAttribute(this.selectedVSText, "x", "237.5");
                        diffAndSetAttribute(this.selectedVSText, "y", "-15");
                        diffAndSetAttribute(this.selectedVSText, "fill", "#36c8d2");
                        diffAndSetAttribute(this.selectedVSText, "font-size", "25");
                        diffAndSetAttribute(this.selectedVSText, "font-family", "Roboto-Bold");
                        diffAndSetAttribute(this.selectedVSText, "text-anchor", "middle");
                        diffAndSetText(this.selectedVSText, "----");
                        verticalSpeedGroup.appendChild(this.selectedVSText);
                    }
                    break;
            }
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue)
            return;
        switch (name) {
            case "altitude":
                let value = parseFloat(newValue);
                this.altitude = value;
                let center = Math.round(value / 100) * 100;
                diffAndSetAttribute(this.graduationGroup, "transform", "translate(0, " + ((value - center) * 160 / 100) + ")");
                diffAndSetAttribute(this.bugsGroup, "transform", "translate(0, " + ((value - center) * 160 / 100) + ")");
                diffAndSetAttribute(this.selectedAltitudeBug, "transform", "translate(0, " + (center - this.selectedAltitude) * 160 / 100 + ")");
                if (!isNaN(this.minimumAltitude)) {
                    diffAndSetAttribute(this.minimumAltitudeBug, "transform", "translate(0, " + (center - this.minimumAltitude) * 160 / 100 + ")");
                }
                if (this.currentCenterGrad != center) {
                    this.currentCenterGrad = center;
                    let n = (this.graduationTexts.length - 1) / 2;
                    for (let i = 0; i < this.graduationTexts.length; i++) {
                        diffAndSetText(this.graduationTexts[i], fastToFixed(((n - i) * 100) + center, 0));
                    }
                }
                let endValue = value % 100;
                let endCenter = Math.round(endValue / 10) * 10;
                diffAndSetAttribute(this.endDigitsGroup, "transform", "translate(0, " + ((endValue - endCenter) * 45 / 10) + ")");
                for (let i = 0; i < this.endDigits.length; i++) {
                    let digitValue = Math.round((((2 - i) * 10) + value) % 100 / 10) * 10;
                    diffAndSetText(this.endDigits[i], fastToFixed(Math.abs((digitValue % 100) / 10), 0) + "0");
                }
                if (Math.abs(value) >= 90) {
                    let d3Value = (Math.abs(value) % 1000) / 100;
                    diffAndSetText(this.digit3Bot, Math.abs(value) < 100 ? "" : fastToFixed(Math.floor(d3Value), 0));
                    diffAndSetText(this.digit3Top, fastToFixed((Math.floor(d3Value) + 1) % 10, 0));
                    if (endValue > 90 || endValue < -90) {
                        if (endValue < 0) {
                            diffAndSetText(this.digit3Bot, fastToFixed((Math.floor(d3Value) + 1) % 10, 0));
                            diffAndSetText(this.digit3Top, Math.abs(value) < 100 ? "" : fastToFixed(Math.floor(d3Value), 0));
                        }
                        let translate = (endValue > 0 ? (endValue - 90) : (endValue + 100)) * 5.7;
                        diffAndSetAttribute(this.digit3Bot, "transform", "translate(0, " + translate + ")");
                        diffAndSetAttribute(this.digit3Top, "transform", "translate(0, " + translate + ")");
                    }
                    else {
                        diffAndSetAttribute(this.digit3Bot, "transform", "");
                        diffAndSetAttribute(this.digit3Top, "transform", "");
                    }
                    if (Math.abs(value) >= 990) {
                        let d2Value = (Math.abs(value) % 10000) / 1000;
                        diffAndSetText(this.digit2Bot, Math.abs(value) < 1000 ? "" : fastToFixed(Math.floor(d2Value), 0));
                        diffAndSetText(this.digit2Top, fastToFixed((Math.floor(d2Value) + 1) % 10, 0));
                        if ((endValue > 90 || endValue < -90) && d3Value > 9) {
                            if (endValue < 0) {
                                diffAndSetText(this.digit2Bot, fastToFixed((Math.floor(d2Value) + 1) % 10, 0));
                                diffAndSetText(this.digit2Top, Math.abs(value) < 1000 ? "" : fastToFixed(Math.floor(d2Value), 0));
                            }
                            let translate = (endValue > 0 ? (endValue - 90) : (endValue + 100)) * 5.7;
                            diffAndSetAttribute(this.digit2Bot, "transform", "translate(0, " + translate + ")");
                            diffAndSetAttribute(this.digit2Top, "transform", "translate(0, " + translate + ")");
                        }
                        else {
                            diffAndSetAttribute(this.digit2Bot, "transform", "");
                            diffAndSetAttribute(this.digit2Top, "transform", "");
                        }
                        if (Math.abs(value) >= 9990) {
                            let d1Value = (Math.abs(value) % 100000) / 10000;
                            diffAndSetText(this.digit1Bot, Math.abs(value) < 10000 ? "" : fastToFixed(Math.floor(d1Value), 0));
                            diffAndSetText(this.digit1Top, fastToFixed((Math.floor(d1Value) + 1) % 10, 0));
                            if ((endValue > 90 || endValue < -90) && d3Value > 9 && d2Value > 9) {
                                if (endValue < 0) {
                                    diffAndSetText(this.digit1Bot, fastToFixed((Math.floor(d2Value) + 1) % 10, 0));
                                    diffAndSetText(this.digit1Top, Math.abs(value) < 10000 ? "" : fastToFixed(Math.floor(d2Value), 0));
                                }
                                let translate = (endValue > 0 ? (endValue - 90) : (endValue + 100)) * 5.7;
                                diffAndSetAttribute(this.digit1Bot, "transform", "translate(0, " + translate + ")");
                                diffAndSetAttribute(this.digit1Top, "transform", "translate(0, " + translate + ")");
                            }
                            else {
                                diffAndSetAttribute(this.digit1Bot, "transform", "");
                                diffAndSetAttribute(this.digit1Top, "transform", "");
                            }
                        }
                        else {
                            diffAndSetAttribute(this.digit1Bot, "transform", "");
                            diffAndSetAttribute(this.digit1Top, "transform", "");
                            if (value < 0) {
                                diffAndSetText(this.digit1Bot, "-");
                            }
                            else {
                                diffAndSetText(this.digit1Bot, "");
                            }
                            diffAndSetText(this.digit1Top, "");
                        }
                    }
                    else {
                        diffAndSetAttribute(this.digit2Bot, "transform", "");
                        diffAndSetAttribute(this.digit2Top, "transform", "");
                        if (value < 0) {
                            diffAndSetText(this.digit2Bot, "-");
                        }
                        else {
                            diffAndSetText(this.digit2Bot, "");
                        }
                        diffAndSetText(this.digit1Bot, "");
                        diffAndSetText(this.digit1Top, "");
                        diffAndSetText(this.digit2Top, "");
                    }
                }
                else {
                    if (value < 0) {
                        diffAndSetText(this.digit3Bot, "-");
                    }
                    else {
                        diffAndSetText(this.digit3Bot, "");
                    }
                    diffAndSetText(this.digit2Bot, "");
                    diffAndSetText(this.digit1Bot, "");
                    diffAndSetText(this.digit2Top, "");
                    diffAndSetText(this.digit1Top, "");
                    diffAndSetAttribute(this.digit3Bot, "transform", "");
                    diffAndSetAttribute(this.digit3Top, "transform", "");
                }
                break;
            case "radar-altitude":
                diffAndSetAttribute(this.groundLine, "transform", "translate(0," + Math.min(((this.height - 100) / 2) + parseFloat(newValue) * 160 / 100, this.height) + ")");
                break;
            case "no-reference-altitude":
                if (newValue == "true") {
                    diffAndSetAttribute(this.selectedAltText, "visibility", "hidden");
                    diffAndSetAttribute(this.selectedAltitudeBackground, "visibility", "hidden");
                    diffAndSetAttribute(this.selectedAltitudeFixedBug, "visibility", "hidden");
                    diffAndSetAttribute(this.selectedAltitudeBug, "visibility", "hidden");
                }
                break;
            case "reference-altitude":
                diffAndSetText(this.selectedAltText, newValue);
                if (newValue != "----") {
                    this.selectedAltitude = parseFloat(newValue);
                    diffAndSetAttribute(this.selectedAltitudeBug, "transform", "translate(0, " + (Math.round(this.altitude / 100) * 100 - this.selectedAltitude) * 160 / 100 + ")");
                    diffAndSetAttribute(this.selectedAltitudeBug, "display", "");
                }
                else {
                    diffAndSetAttribute(this.selectedAltitudeBug, "display", "none");
                }
                break;
            case "reference-vspeed":
                if (newValue != "----") {
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
                        diffAndSetAttribute(this.selectedVSBug, "transform", "translate(0, " + value + ")");
                    }
                    else {
                        this.selectedVSBug.setAttribute("transform", "translate(0, " + -Math.max(Math.min(this.selectedVS, 2250), -2250) / 10 + ")");
                        this.selectedVSText.textContent = newValue;
                    }
                    diffAndSetAttribute(this.selectedVSBug, "display", "");
                }
                else {
                    diffAndSetAttribute(this.selectedVSBug, "display", "none");
                    if (!this.compactVs) {
                        diffAndSetText(this.selectedVSText, newValue);
                    }
                }
                break;
            case "minimum-altitude":
                if (newValue == "none") {
                    this.minimumAltitude = NaN;
                }
                else {
                    this.minimumAltitude = parseFloat(newValue);
                }
                if (isNaN(this.minimumAltitude)) {
                    diffAndSetAttribute(this.minimumAltitudeBug, "display", "none");
                }
                else {
                    diffAndSetAttribute(this.minimumAltitudeBug, "display", "");
                    diffAndSetAttribute(this.minimumAltitudeBug, "transform", "translate(0, " + (Math.round(this.altitude / 100) * 100 - this.minimumAltitude) * 160 / 100 + ")");
                }
                break;
            case "minimum-altitude-state":
                switch (newValue) {
                    case "low":
                        diffAndSetAttribute(this.minimumAltitudeBug, "stroke", "yellow");
                        break;
                    case "near":
                        diffAndSetAttribute(this.minimumAltitudeBug, "stroke", "white");
                        break;
                    default:
                        diffAndSetAttribute(this.minimumAltitudeBug, "stroke", "#36c8d2");
                        break;
                }
                break;
            case "no-pressure":
                if (newValue == "true") {
                    diffAndSetAttribute(this.pressureBackground, "visibility", "hidden");
                    diffAndSetAttribute(this.baroText, "visibility", "hidden");
                }
                break;
            case "pressure":
                this.lastPressure = newValue;
                newValue = this.baroMode;
            /* fall through to update the HTML text */
            case "baro-mode":
                if (newValue == "HPA") {
                    this.baroMode = "HPA";
                    diffAndSetText(this.baroText, fastToFixed(parseFloat(this.lastPressure) * 33.8639, 0) + "HPA");
                } else {
                    this.baroMode = "IN";
                    diffAndSetText(this.baroText, fastToFixed(parseFloat(this.lastPressure), 2) + "IN");
                }
                WTDataStore.set("Alt.BaroMode", this.baroMode);
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
                    diffAndSetAttribute(this.indicator, "transform", "translate(0, " + value + ")");
                }
                else {
                    diffAndSetAttribute(this.indicator, "transform", "translate(0, " + -Math.max(Math.min(vSpeed, 2500), -2500) / 10 + ")");
                    this.indicatorText.textContent = Math.abs(vSpeed) >= 100 ? fastToFixed(Math.round(vSpeed / 50) * 50, 0) : "";
                }
                let centerY = (this.height / 2 - 100);
                let trendValue = Utils.Clamp(centerY + (vSpeed / 10) * -1.5, -50, (this.height - 100 - 50));
                diffAndSetAttribute(this.trendElement, "y", Math.min(trendValue, centerY) + '');
                diffAndSetAttribute(this.trendElement, "height", Math.abs(trendValue - centerY) + '');
                break;
            case "vertical-deviation-mode":
                switch (newValue) {
                    case "VDI":
                        this.currentMode = 1;
                        diffAndSetText(this.verticalDeviationText, "V");
                        diffAndSetAttribute(this.verticalDeviationText, "fill", "#d12bc7");
                        diffAndSetAttribute(this.diamondBug, "visibility", "hidden");
                        diffAndSetAttribute(this.chevronBug, "visibility", "inherit");
                        diffAndSetAttribute(this.hollowDiamondBug, "visibility", "hidden");
                        diffAndSetAttribute(this.verticalDeviationGroup, "visibility", "inherit");
                        break;
                    case "GS":
                        this.currentMode = 2;
                        diffAndSetText(this.verticalDeviationText, "G");
                        diffAndSetAttribute(this.verticalDeviationText, "fill", "#10c210");
                        diffAndSetAttribute(this.diamondBug, "visibility", "inherit");
                        diffAndSetAttribute(this.diamondBug, "fill", "#10c210");
                        diffAndSetAttribute(this.chevronBug, "visibility", "hidden");
                        diffAndSetAttribute(this.hollowDiamondBug, "visibility", "hidden");
                        diffAndSetAttribute(this.verticalDeviationGroup, "visibility", "inherit");
                        break;
                    case "GSPreview":
                        this.currentMode = 4;
                        diffAndSetText(this.verticalDeviationText, "G");
                        diffAndSetAttribute(this.verticalDeviationText, "fill", "#DFDFDF");
                        diffAndSetAttribute(this.diamondBug, "visibility", "hidden");
                        diffAndSetAttribute(this.chevronBug, "visibility", "hidden");
                        diffAndSetAttribute(this.hollowDiamondBug, "visibility", "inherit");
                        diffAndSetAttribute(this.verticalDeviationGroup, "visibility", "inherit");
                        break;
                    case "GP":
                        this.currentMode = 3;
                        diffAndSetText(this.verticalDeviationText, "G");
                        diffAndSetAttribute(this.verticalDeviationText, "fill", "#d12bc7");
                        diffAndSetAttribute(this.diamondBug, "visibility", "inherit");
                        diffAndSetAttribute(this.diamondBug, "fill", "#d12bc7");
                        diffAndSetAttribute(this.chevronBug, "visibility", "hidden");
                        diffAndSetAttribute(this.hollowDiamondBug, "visibility", "hidden");
                        diffAndSetAttribute(this.verticalDeviationGroup, "visibility", "inherit");
                        break;
                    default:
                        this.currentMode = 0;
                        diffAndSetAttribute(this.verticalDeviationGroup, "visibility", "hidden");
                        break;
                }
                break;
            case "vertical-deviation-value":
                let pos = (Math.min(Math.max(parseFloat(newValue), -1), 1) * 200);
                diffAndSetAttribute(this.chevronBug, "transform", "translate(0," + pos + ")");
                diffAndSetAttribute(this.diamondBug, "transform", "translate(0," + pos + ")");
                diffAndSetAttribute(this.hollowDiamondBug, "transform", "translate(0," + pos + ")");
                break;
            case "selected-altitude-alert":
                switch (newValue) {
                    case "BlueBackground":
                        diffAndSetAttribute(this.selectedAltitudeBackground, "fill", "#36c8d2");
                        diffAndSetAttribute(this.selectedAltText, "fill", "#1a1d21");
                        diffAndSetAttribute(this.selectedAltitudeFixedBug, "fill", "#1a1d21");
                        break;
                    case "YellowText":
                        diffAndSetAttribute(this.selectedAltitudeBackground, "fill", "#1a1d21");
                        diffAndSetAttribute(this.selectedAltText, "fill", "yellow");
                        diffAndSetAttribute(this.selectedAltitudeFixedBug, "fill", "yellow");
                        break;
                    case "Empty":
                        diffAndSetAttribute(this.selectedAltitudeBackground, "fill", "#1a1d21");
                        diffAndSetAttribute(this.selectedAltText, "fill", "#1a1d21");
                        diffAndSetAttribute(this.selectedAltitudeFixedBug, "fill", "#1a1d21");
                        break;
                    case "BlueText":
                    default:
                        diffAndSetAttribute(this.selectedAltitudeBackground, "fill", "#1a1d21");
                        diffAndSetAttribute(this.selectedAltText, "fill", "#36c8d2");
                        diffAndSetAttribute(this.selectedAltitudeFixedBug, "fill", "#36c8d2");
                        break;
                }
        }
    }
}
customElements.define('glasscockpit-altimeter', Altimeter);
//# sourceMappingURL=Altimeter.js.map