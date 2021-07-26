Include.addScript("/Pages/VCockpit/Instruments/Shared/WorkingTitle/DataStore.js")

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
    connectedCallback() {
        let vsStyle = this.getAttribute("VSStyle");
        if (!vsStyle) {
            vsStyle = "Default";
        }
        else if (vsStyle == "Compact") {
            this.compactVs = true;
        }
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "-50 -100 " + (this.compactVs ? 300 : 380) + " 700");
        this.appendChild(this.root);
        {
            this.verticalDeviationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.verticalDeviationGroup.setAttribute("visibility", "hidden");
            this.root.appendChild(this.verticalDeviationGroup);
            let background = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(background, "x", "-50");
            diffAndSetAttribute(background, "y", "50");
            diffAndSetAttribute(background, "width", "50");
            diffAndSetAttribute(background, "height", "400");
            diffAndSetAttribute(background, "fill", "#1a1d21");
            diffAndSetAttribute(background, "fill-opacity", "0.25");
            this.verticalDeviationGroup.appendChild(background);
            let topBackground = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(topBackground, "x", "-50");
            diffAndSetAttribute(topBackground, "y", "0");
            diffAndSetAttribute(topBackground, "width", "50");
            diffAndSetAttribute(topBackground, "height", "50");
            diffAndSetAttribute(topBackground, "fill", "#1a1d21");
            this.verticalDeviationGroup.appendChild(topBackground);
            this.verticalDeviationText = document.createElementNS(Avionics.SVG.NS, "text");
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
                    let grad = document.createElementNS(Avionics.SVG.NS, "circle");
                    diffAndSetAttribute(grad, "cx", "-25");
                    diffAndSetAttribute(grad, "cy", (250 + 66 * i).toString());
                    diffAndSetAttribute(grad, "r", "6");
                    diffAndSetAttribute(grad, "stroke", "white");
                    diffAndSetAttribute(grad, "stroke-width", "3");
                    diffAndSetAttribute(grad, "fill-opacity", "0");
                    this.verticalDeviationGroup.appendChild(grad);
                }
            }
            this.chevronBug = document.createElementNS(Avionics.SVG.NS, "polygon");
            this.chevronBug.setAttribute("points", "-45,250 -10,230 -10,240 -25,250 -10,260 -10,270");
            this.chevronBug.setAttribute("fill", "#d12bc7");
            this.verticalDeviationGroup.appendChild(this.chevronBug);
            this.diamondBug = document.createElementNS(Avionics.SVG.NS, "polygon");
            this.diamondBug.setAttribute("points", "-40,250 -25,235 -10,250 -25,265");
            this.diamondBug.setAttribute("fill", "#10c210");
            this.verticalDeviationGroup.appendChild(this.diamondBug);
            this.hollowDiamondBug = document.createElementNS(Avionics.SVG.NS, "polygon");
            this.hollowDiamondBug.setAttribute("points", "-40,250 -25,235 -10,250 -25,265 -25,255 -20,250 -25,245 -30,250 -25,255 -25,265");
            this.hollowDiamondBug.setAttribute("fill", "#DFDFDF");
            this.verticalDeviationGroup.appendChild(this.hollowDiamondBug);
        }
        {
            this.selectedAltitudeBackground = document.createElementNS(Avionics.SVG.NS, "rect");
            this.selectedAltitudeBackground.setAttribute("x", "0");
            this.selectedAltitudeBackground.setAttribute("y", "-100");
            this.selectedAltitudeBackground.setAttribute("width", this.compactVs ? "250" : "200");
            this.selectedAltitudeBackground.setAttribute("height", "50");
            this.selectedAltitudeBackground.setAttribute("fill", "#1a1d21");
            this.root.appendChild(this.selectedAltitudeBackground);
            this.selectedAltitudeFixedBug = document.createElementNS(Avionics.SVG.NS, "polygon");
            this.selectedAltitudeFixedBug.setAttribute("points", "10,-90 20,-90 20,-80 15,-75 20,-70 20,-60 10,-60 ");
            this.selectedAltitudeFixedBug.setAttribute("fill", "#36c8d2");
            this.root.appendChild(this.selectedAltitudeFixedBug);
            this.selectedAltText = document.createElementNS(Avionics.SVG.NS, "text");
            this.selectedAltText.setAttribute("x", "125");
            this.selectedAltText.setAttribute("y", "-60");
            this.selectedAltText.setAttribute("fill", "#36c8d2");
            this.selectedAltText.setAttribute("font-size", "45");
            this.selectedAltText.setAttribute("font-family", "Roboto-Bold");
            this.selectedAltText.setAttribute("text-anchor", "middle");
            this.selectedAltText.textContent = "----";
            this.root.appendChild(this.selectedAltText);
        }
        {
            let background = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(background, "x", "0");
            diffAndSetAttribute(background, "y", "-50");
            diffAndSetAttribute(background, "width", "200");
            diffAndSetAttribute(background, "height", "600");
            diffAndSetAttribute(background, "fill", "#1a1d21");
            diffAndSetAttribute(background, "fill-opacity", "0.25");
            this.root.appendChild(background);
            let graduationSvg = document.createElementNS(Avionics.SVG.NS, "svg");
            diffAndSetAttribute(graduationSvg, "x", "0");
            diffAndSetAttribute(graduationSvg, "y", "-50");
            diffAndSetAttribute(graduationSvg, "width", "200");
            diffAndSetAttribute(graduationSvg, "height", "600");
            diffAndSetAttribute(graduationSvg, "viewBox", "0 0 200 600");
            this.root.appendChild(graduationSvg);
            let center = 300;
            this.graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationSvg.appendChild(this.graduationGroup);
            {
                let graduationSize = 160;
                this.graduationTexts = [];
                for (let i = -3; i <= 3; i++) {
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
            this.trendElement.setAttribute("x", "0");
            this.trendElement.setAttribute("y", "-50");
            this.trendElement.setAttribute("width", "8");
            this.trendElement.setAttribute("height", "0");
            this.trendElement.setAttribute("fill", "#d12bc7");
            this.root.appendChild(this.trendElement);
            this.groundLine = document.createElementNS(Avionics.SVG.NS, "g");
            this.groundLine.setAttribute("transform", "translate(0, 700)");
            graduationSvg.appendChild(this.groundLine);
            {
                let background = document.createElementNS(Avionics.SVG.NS, "rect");
                diffAndSetAttribute(background, "fill", "#654222");
                diffAndSetAttribute(background, "stroke", "white");
                diffAndSetAttribute(background, "stroke-width", "4");
                diffAndSetAttribute(background, "x", "0");
                diffAndSetAttribute(background, "y", "0");
                diffAndSetAttribute(background, "width", "196");
                diffAndSetAttribute(background, "height", "600");
                this.groundLine.appendChild(background);
                let groundLineSvg = document.createElementNS(Avionics.SVG.NS, "svg");
                diffAndSetAttribute(groundLineSvg, "x", "0");
                diffAndSetAttribute(groundLineSvg, "y", "0");
                diffAndSetAttribute(groundLineSvg, "width", "200");
                diffAndSetAttribute(groundLineSvg, "height", "600");
                diffAndSetAttribute(groundLineSvg, "viewBox", "0 0 200 600");
                this.groundLine.appendChild(groundLineSvg);
                for (let i = -5; i <= 25; i++) {
                    let line = document.createElementNS(Avionics.SVG.NS, "rect");
                    diffAndSetAttribute(line, "fill", "white");
                    diffAndSetAttribute(line, "x", "0");
                    diffAndSetAttribute(line, "y", (-50 + i * 30).toString());
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
            diffAndSetAttribute(cursorBaseSvg, "y", (center - 40).toString());
            diffAndSetAttribute(cursorBaseSvg, "width", "100");
            diffAndSetAttribute(cursorBaseSvg, "height", "80");
            diffAndSetAttribute(cursorBaseSvg, "viewBox", "0 0 100 80");
            graduationSvg.appendChild(cursorBaseSvg);
            {
                this.digit1Top = document.createElementNS(Avionics.SVG.NS, "text");
                this.digit1Top.setAttribute("x", "16");
                this.digit1Top.setAttribute("y", "-1");
                this.digit1Top.setAttribute("fill", "white");
                this.digit1Top.setAttribute("font-size", "50");
                this.digit1Top.setAttribute("font-family", "Roboto-Bold");
                this.digit1Top.textContent = "X";
                cursorBaseSvg.appendChild(this.digit1Top);
                this.digit1Bot = document.createElementNS(Avionics.SVG.NS, "text");
                this.digit1Bot.setAttribute("x", "16");
                this.digit1Bot.setAttribute("y", "57");
                this.digit1Bot.setAttribute("fill", "white");
                this.digit1Bot.setAttribute("font-size", "50");
                this.digit1Bot.setAttribute("font-family", "Roboto-Bold");
                this.digit1Bot.textContent = "X";
                cursorBaseSvg.appendChild(this.digit1Bot);
                this.digit2Top = document.createElementNS(Avionics.SVG.NS, "text");
                this.digit2Top.setAttribute("x", "44");
                this.digit2Top.setAttribute("y", "-1");
                this.digit2Top.setAttribute("fill", "white");
                this.digit2Top.setAttribute("font-size", "50");
                this.digit2Top.setAttribute("font-family", "Roboto-Bold");
                this.digit2Top.textContent = "X";
                cursorBaseSvg.appendChild(this.digit2Top);
                this.digit2Bot = document.createElementNS(Avionics.SVG.NS, "text");
                this.digit2Bot.setAttribute("x", "44");
                this.digit2Bot.setAttribute("y", "57");
                this.digit2Bot.setAttribute("fill", "white");
                this.digit2Bot.setAttribute("font-size", "50");
                this.digit2Bot.setAttribute("font-family", "Roboto-Bold");
                this.digit2Bot.textContent = "X";
                cursorBaseSvg.appendChild(this.digit2Bot);
                this.digit3Top = document.createElementNS(Avionics.SVG.NS, "text");
                this.digit3Top.setAttribute("x", "72");
                this.digit3Top.setAttribute("y", "-1");
                this.digit3Top.setAttribute("fill", "white");
                this.digit3Top.setAttribute("font-size", "50");
                this.digit3Top.setAttribute("font-family", "Roboto-Bold");
                this.digit3Top.textContent = "X";
                cursorBaseSvg.appendChild(this.digit3Top);
                this.digit3Bot = document.createElementNS(Avionics.SVG.NS, "text");
                this.digit3Bot.setAttribute("x", "72");
                this.digit3Bot.setAttribute("y", "57");
                this.digit3Bot.setAttribute("fill", "white");
                this.digit3Bot.setAttribute("font-size", "50");
                this.digit3Bot.setAttribute("font-family", "Roboto-Bold");
                this.digit3Bot.textContent = "X";
                cursorBaseSvg.appendChild(this.digit3Bot);
            }
            let cursorRotatingSvg = document.createElementNS(Avionics.SVG.NS, "svg");
            diffAndSetAttribute(cursorRotatingSvg, "x", "130");
            diffAndSetAttribute(cursorRotatingSvg, "y", (center - 60).toString());
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
                    diffAndSetAttribute(digit, "y", (27 + 45 * i).toString());
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
                this.selectedAltitudeBug.setAttribute("points", "0, " + (center - 20) + " 20, " + (center - 20) + " 20, " + (center - 15) + " 10, " + center + " 20, " + (center + 15) + " 20, " + (center + 20) + " 0, " + (center + 20));
                this.selectedAltitudeBug.setAttribute("fill", "#36c8d2");
                this.bugsGroup.appendChild(this.selectedAltitudeBug);
                this.minimumAltitudeBug = document.createElementNS(Avionics.SVG.NS, "polyline");
                this.minimumAltitudeBug.setAttribute("points", "20,260 20,273 0,300 20,327 20,340");
                this.minimumAltitudeBug.setAttribute("stroke", "#36c8d2");
                this.minimumAltitudeBug.setAttribute("fill", "none");
                this.minimumAltitudeBug.setAttribute("display", "none");
                this.minimumAltitudeBug.setAttribute("stroke-width", "5");
                this.bugsGroup.appendChild(this.minimumAltitudeBug);
            }
        }
        {
            let background = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(background, "x", "0");
            diffAndSetAttribute(background, "y", "550");
            diffAndSetAttribute(background, "width", "250");
            diffAndSetAttribute(background, "height", "50");
            diffAndSetAttribute(background, "fill", "#1a1d21");
            this.root.appendChild(background);
            this.baroText = document.createElementNS(Avionics.SVG.NS, "text");
            this.baroText.setAttribute("x", "125");
            this.baroText.setAttribute("y", "590");
            this.baroText.setAttribute("fill", "#36c8d2");
            this.baroText.setAttribute("font-size", "45");
            this.baroText.setAttribute("font-family", "Roboto-Bold");
            this.baroText.setAttribute("text-anchor", "middle");
            this.baroText.textContent = "--.--IN";
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
                        diffAndSetAttribute(background, "d", "M200 -50 L200 550 L250 550 L250 275 L210 250 L250 225 L250 -50 Z");
                        diffAndSetAttribute(background, "fill", "#1a1d21");
                        diffAndSetAttribute(background, "fill-opacity", "0.25");
                        verticalSpeedGroup.appendChild(background);
                        let leftBar = document.createElementNS(Avionics.SVG.NS, "rect");
                        diffAndSetAttribute(leftBar, "x", "210");
                        diffAndSetAttribute(leftBar, "y", "10");
                        diffAndSetAttribute(leftBar, "height", "480");
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
                            diffAndSetAttribute(rect, "y", (250 - dashes[i] - height / 2).toString());
                            diffAndSetAttribute(rect, "height", height.toString());
                            diffAndSetAttribute(rect, "width", (width).toString());
                            diffAndSetAttribute(rect, "fill", "white");
                            verticalSpeedGroup.appendChild(rect);
                            if (texts[i] != "") {
                                let text = document.createElementNS(Avionics.SVG.NS, "text");
                                diffAndSetText(text, texts[i]);
                                diffAndSetAttribute(text, "y", ((250 - dashes[i] - height / 2) + fontSize / 3).toString());
                                diffAndSetAttribute(text, "x", "235");
                                diffAndSetAttribute(text, "fill", "white");
                                diffAndSetAttribute(text, "font-size", fontSize.toString());
                                diffAndSetAttribute(text, "font-family", "Roboto-Bold");
                                diffAndSetAttribute(text, "text-anchor", "middle");
                                verticalSpeedGroup.appendChild(text);
                            }
                        }
                        let center = 250;
                        this.selectedVSBug = document.createElementNS(Avionics.SVG.NS, "polygon");
                        this.selectedVSBug.setAttribute("points", "200, " + (center - 20) + " 220, " + (center - 20) + " 220, " + (center - 15) + " 210, " + center + " 220, " + (center + 15) + " 220, " + (center + 20) + " 200, " + (center + 20));
                        this.selectedVSBug.setAttribute("fill", "#36c8d2");
                        verticalSpeedGroup.appendChild(this.selectedVSBug);
                        {
                            this.indicator = document.createElementNS(Avionics.SVG.NS, "polygon");
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
                        let verticalSpeedGroup = document.createElementNS(Avionics.SVG.NS, "g");
                        diffAndSetAttribute(verticalSpeedGroup, "id", "VerticalSpeed");
                        this.root.appendChild(verticalSpeedGroup);
                        let background = document.createElementNS(Avionics.SVG.NS, "path");
                        diffAndSetAttribute(background, "d", "M200 0 L200 500 L275 500 L275 300 L210 250 L275 200 L275 0 Z");
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
                            diffAndSetAttribute(rect, "y", (250 - dashes[i] - height / 2).toString());
                            diffAndSetAttribute(rect, "height", height.toString());
                            diffAndSetAttribute(rect, "width", ((dashes[i] % 100) == 0 ? 2 * width : width).toString());
                            diffAndSetAttribute(rect, "fill", "white");
                            verticalSpeedGroup.appendChild(rect);
                            if ((dashes[i] % 100) == 0) {
                                let text = document.createElementNS(Avionics.SVG.NS, "text");
                                diffAndSetText(text, (dashes[i] / 100).toString());
                                diffAndSetAttribute(text, "y", ((250 - dashes[i] - height / 2) + fontSize / 3).toString());
                                diffAndSetAttribute(text, "x", (200 + 3 * width).toString());
                                diffAndSetAttribute(text, "fill", "white");
                                diffAndSetAttribute(text, "font-size", fontSize.toString());
                                diffAndSetAttribute(text, "font-family", "Roboto-Bold");
                                verticalSpeedGroup.appendChild(text);
                            }
                        }
                        let center = 250;
                        this.selectedVSBug = document.createElementNS(Avionics.SVG.NS, "polygon");
                        this.selectedVSBug.setAttribute("points", "200, " + (center - 20) + " 220, " + (center - 20) + " 220, " + (center - 15) + " 210, " + center + " 220, " + (center + 15) + " 220, " + (center + 20) + " 200, " + (center + 20));
                        this.selectedVSBug.setAttribute("fill", "#36c8d2");
                        verticalSpeedGroup.appendChild(this.selectedVSBug);
                        {
                            this.indicator = document.createElementNS(Avionics.SVG.NS, "g");
                            verticalSpeedGroup.appendChild(this.indicator);
                            let indicatorBackground = document.createElementNS(Avionics.SVG.NS, "path");
                            diffAndSetAttribute(indicatorBackground, "d", "M210 250 L235 275 L330 275 L330 225 L235 225 Z");
                            diffAndSetAttribute(indicatorBackground, "fill", "#1a1d21");
                            this.indicator.appendChild(indicatorBackground);
                            this.indicatorText = document.createElementNS(Avionics.SVG.NS, "text");
                            this.indicatorText.textContent = "-0000";
                            this.indicatorText.setAttribute("x", "235");
                            this.indicatorText.setAttribute("y", "260");
                            this.indicatorText.setAttribute("fill", "white");
                            this.indicatorText.setAttribute("font-size", fontSize.toString());
                            this.indicatorText.setAttribute("font-family", "Roboto-Bold");
                            this.indicator.appendChild(this.indicatorText);
                        }
                        this.selectedVSBackground = document.createElementNS(Avionics.SVG.NS, "rect");
                        this.selectedVSBackground.setAttribute("x", "200");
                        this.selectedVSBackground.setAttribute("y", "-50");
                        this.selectedVSBackground.setAttribute("width", "75");
                        this.selectedVSBackground.setAttribute("height", "50");
                        this.selectedVSBackground.setAttribute("fill", "#1a1d21");
                        verticalSpeedGroup.appendChild(this.selectedVSBackground);
                        this.selectedVSText = document.createElementNS(Avionics.SVG.NS, "text");
                        this.selectedVSText.setAttribute("x", "237.5");
                        this.selectedVSText.setAttribute("y", "-15");
                        this.selectedVSText.setAttribute("fill", "#36c8d2");
                        this.selectedVSText.setAttribute("font-size", "25");
                        this.selectedVSText.setAttribute("font-family", "Roboto-Bold");
                        this.selectedVSText.setAttribute("text-anchor", "middle");
                        this.selectedVSText.textContent = "----";
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
                this.graduationGroup.setAttribute("transform", "translate(0, " + ((value - center) * 160 / 100) + ")");
                this.bugsGroup.setAttribute("transform", "translate(0, " + ((value - center) * 160 / 100) + ")");
                this.selectedAltitudeBug.setAttribute("transform", "translate(0, " + (center - this.selectedAltitude) * 160 / 100 + ")");
                if (!isNaN(this.minimumAltitude)) {
                    this.minimumAltitudeBug.setAttribute("transform", "translate(0, " + (center - this.minimumAltitude) * 160 / 100 + ")");
                }
                if (this.currentCenterGrad != center) {
                    this.currentCenterGrad = center;
                    for (let i = 0; i < this.graduationTexts.length; i++) {
                        this.graduationTexts[i].textContent = fastToFixed(((3 - i) * 100) + center, 0);
                    }
                }
                let endValue = value % 100;
                let endCenter = Math.round(endValue / 10) * 10;
                this.endDigitsGroup.setAttribute("transform", "translate(0, " + ((endValue - endCenter) * 45 / 10) + ")");
                for (let i = 0; i < this.endDigits.length; i++) {
                    let digitValue = Math.round((((2 - i) * 10) + value) % 100 / 10) * 10;
                    this.endDigits[i].textContent = fastToFixed(Math.abs((digitValue % 100) / 10), 0) + "0";
                }
                if (Math.abs(value) >= 90) {
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
                }
                break;
            case "radar-altitude":
                this.groundLine.setAttribute("transform", "translate(0," + Math.min(300 + parseFloat(newValue) * 160 / 100, 700) + ")");
                break;
            case "reference-altitude":
                this.selectedAltText.textContent = newValue;
                if (newValue != "----") {
                    this.selectedAltitude = parseFloat(newValue);
                    this.selectedAltitudeBug.setAttribute("transform", "translate(0, " + (Math.round(this.altitude / 100) * 100 - this.selectedAltitude) * 160 / 100 + ")");
                    this.selectedAltitudeBug.setAttribute("display", "");
                }
                else {
                    this.selectedAltitudeBug.setAttribute("display", "none");
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
                        this.selectedVSBug.setAttribute("transform", "translate(0, " + value + ")");
                    }
                    else {
                        this.selectedVSBug.setAttribute("transform", "translate(0, " + -Math.max(Math.min(this.selectedVS, 2500), -2500) / 10 + ")");
                        this.selectedVSText.textContent = newValue;
                    }
                    this.selectedVSBug.setAttribute("display", "");
                }
                else {
                    this.selectedVSBug.setAttribute("display", "none");
                    if (!this.compactVs) {
                        this.selectedVSText.textContent = newValue;
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
                    this.minimumAltitudeBug.setAttribute("display", "none");
                }
                else {
                    this.minimumAltitudeBug.setAttribute("display", "");
                    this.minimumAltitudeBug.setAttribute("transform", "translate(0, " + (Math.round(this.altitude / 100) * 100 - this.minimumAltitude) * 160 / 100 + ")");
                }
                break;
            case "minimum-altitude-state":
                switch (newValue) {
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
                break;
            case "pressure":
                this.lastPressure = newValue;
                newValue = this.baroMode;
            /* fall through to update the HTML text */
            case "baro-mode":
                if (newValue == "HPA") {
                    this.baroMode = "HPA";
                    this.baroText.textContent = fastToFixed(parseFloat(this.lastPressure) * 33.8639, 0) + "HPA";
                } else {
                    this.baroMode = "IN";
                    this.baroText.textContent = fastToFixed(parseFloat(this.lastPressure), 2) + "IN";
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
                    this.indicator.setAttribute("transform", "translate(0, " + value + ")");
                }
                else {
                    this.indicator.setAttribute("transform", "translate(0, " + -Math.max(Math.min(vSpeed, 2500), -2500) / 10 + ")");
                    this.indicatorText.textContent = Math.abs(vSpeed) >= 100 ? fastToFixed(Math.round(vSpeed / 50) * 50, 0) : "";
                }
                let trendValue = Math.min(Math.max(250 + (vSpeed / 10) * -1.5, -50), 550);
                this.trendElement.setAttribute("y", Math.min(trendValue, 250).toString());
                this.trendElement.setAttribute("height", Math.abs(trendValue - 250).toString());
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
                switch (newValue) {
                    case "BlueBackground":
                        this.selectedAltitudeBackground.setAttribute("fill", "#36c8d2");
                        this.selectedAltText.setAttribute("fill", "#1a1d21");
                        this.selectedAltitudeFixedBug.setAttribute("fill", "#1a1d21");
                        break;
                    case "YellowText":
                        this.selectedAltitudeBackground.setAttribute("fill", "#1a1d21");
                        this.selectedAltText.setAttribute("fill", "yellow");
                        this.selectedAltitudeFixedBug.setAttribute("fill", "yellow");
                        break;
                    case "Empty":
                        this.selectedAltitudeBackground.setAttribute("fill", "#1a1d21");
                        this.selectedAltText.setAttribute("fill", "#1a1d21");
                        this.selectedAltitudeFixedBug.setAttribute("fill", "#1a1d21");
                        break;
                    case "BlueText":
                    default:
                        this.selectedAltitudeBackground.setAttribute("fill", "#1a1d21");
                        this.selectedAltText.setAttribute("fill", "#36c8d2");
                        this.selectedAltitudeFixedBug.setAttribute("fill", "#36c8d2");
                        break;
                }
        }
    }
}
customElements.define('glasscockpit-altimeter', Altimeter);
//# sourceMappingURL=Altimeter.js.map