var CJ4_SystemPage;
(function (CJ4_SystemPage) {
    CJ4_SystemPage[CJ4_SystemPage["NONE"] = 0] = "NONE";
    CJ4_SystemPage[CJ4_SystemPage["ENGINES"] = 1] = "ENGINES";
    CJ4_SystemPage[CJ4_SystemPage["ELECTRICS"] = 2] = "ELECTRICS";
    CJ4_SystemPage[CJ4_SystemPage["FMS"] = 3] = "FMS";
    CJ4_SystemPage[CJ4_SystemPage["ANNUNCIATIONS"] = 4] = "ANNUNCIATIONS";
})(CJ4_SystemPage || (CJ4_SystemPage = {}));

class CJ4_SystemContainer extends NavSystemElementContainer {
    constructor(_name, _root) {
        super(_name, _root, null);
        this.engines = new CJ4_SystemEngines();
        this.electrics = new CJ4_SystemElectrics();
        this.fms = new CJ4_SystemFMS();
        this.annunciations = new CJ4_SystemAnnunciations();
        this.warnings = new CJ4_SystemWarnings();
        this.curPage = undefined;
        this.element = new NavSystemElementGroup([this.engines, this.electrics, this.fms, this.annunciations, this.warnings]);
    }
    init() {
        super.init();
        this.root = this.gps.getChildById(this.htmlElemId);
        if (!this.root) {
            console.log("Root component expected!");
        }
    }
    reboot() {
        if (this.warnings)
            this.warnings.reset();
        if (this.annunciations)
            this.annunciations.reset();
    }
    minimize(_value) {
        switch (this.curPage) {
            case CJ4_SystemPage.ENGINES:
                this.engines.minimize(_value);
                break;
        }
    }
    show(_page) {
        if (this.curPage != _page) {
            this.curPage = _page;
            switch (_page) {
                case CJ4_SystemPage.ENGINES:
                    this.root.setAttribute("page", "engines");
                    this.root.setAttribute("visible", "true");
                    break;
                case CJ4_SystemPage.ELECTRICS:
                    this.root.setAttribute("page", "electrics");
                    this.root.setAttribute("visible", "true");
                    break;
                case CJ4_SystemPage.FMS:
                    this.root.setAttribute("page", "fms");
                    this.root.setAttribute("visible", "true");
                    break;
                case CJ4_SystemPage.ANNUNCIATIONS:
                    this.root.setAttribute("page", "annunciations");
                    this.root.setAttribute("visible", "true");
                    break;
                default:
                    this.root.setAttribute("visible", "false");
                    break;
            }
        }
    }
    hasAnnunciations() {
        return this.annunciations.hasMessages();
    }
}
class CJ4_SystemEngines extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.isMinimized = false;
        this.N1_Table_Values = [0, 20, 80, 90, 100, 110];
        this.N1_Table_Percents = [0, 6.5, 38, 59, 79.5, 100];
        this.N1_Table_Values_Minimized = [0, 20, 60, 80, 100, 110];
        this.N1_Table_Percents_Minimized = [0, 12, 38, 62, 87, 100];
        this.ITT_Table_Values = [0, 200, 600, 700, 800, 900, 1000, 1050];
        this.ITT_Table_Percents = [0, 4, 21.5, 42.5, 63.5, 81.5, 94.5, 100];
        this.ITT_Table_Values_Minimized = [200, 600, 700, 800, 900, 1000];
        this.ITT_Table_Percents_Minimized = [0, 24, 41, 57, 79, 100];
        this.OilPSIMax = 125;
        this.OilTempMax = 160;
        this.Flaps_Table_Values = [0, 15, 35];
        this.Flaps_Table_Angles = [0, 25, 60];
    }
    init(_root) {
        this.root = _root.querySelector(".SystemEngines");
        this.construct();
    }
    onEnter() {
    }
    minimize(_value) {
        if (this.isMinimized != _value) {
            this.isMinimized = _value;
            this.construct();
        }
    }
    construct() {
        if (this.root) {
            Utils.RemoveAllChildren(this.root);
            if (this.isMinimized)
                this.constructMinimized();
            else
                this.constructDefault();
        }
    }
    constructMinimized() {
        var rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        rootSVG.setAttribute("id", "Minimized");
        rootSVG.setAttribute("viewBox", "0 0 1000 1000");
        this.root.appendChild(rootSVG);
        {
            var n1Group = document.createElementNS(Avionics.SVG.NS, "g");
            n1Group.setAttribute("id", "N1");
            rootSVG.appendChild(n1Group);
            var startPosX = 140;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "N1%";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "#cccac8");
            titleText.setAttribute("font-size", "24");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            n1Group.appendChild(titleText);
            var gradValues = [0, 0, 100, 0, 80, 0, 60, 0, 20];
            var gradLength = [26, 20, 20, 12, 20, 12, 20, 20, 20];
            var gradSpacing = [10, 10, 18, 18, 18, 18, 20, 20, 16];
            startPosY += 5;
            var posY = startPosY;
            var halfWidth = 80;
            for (var i = 0; i < gradValues.length; i++) {
                if (gradValues[i] > 0) {
                    var text = document.createElementNS(Avionics.SVG.NS, "text");
                    text.textContent = gradValues[i].toString();
                    text.setAttribute("x", startPosX.toString());
                    text.setAttribute("y", posY.toString());
                    text.setAttribute("fill", "#cccac8");
                    text.setAttribute("font-size", "24");
                    text.setAttribute("font-family", "Roboto-Light");
                    text.setAttribute("text-anchor", "middle");
                    text.setAttribute("alignment-baseline", "central");
                    n1Group.appendChild(text);
                }
                var line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("x1", (startPosX - halfWidth).toString());
                line.setAttribute("y1", posY.toString());
                line.setAttribute("x2", (startPosX - halfWidth + gradLength[i]).toString());
                line.setAttribute("y2", posY.toString());
                line.setAttribute("stroke", (i == 1) ? "red" : "#52504d");
                line.setAttribute("stroke-width", "3");
                n1Group.appendChild(line);
                var line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("x1", (startPosX + halfWidth - gradLength[i]).toString());
                line.setAttribute("y1", posY.toString());
                line.setAttribute("x2", (startPosX + halfWidth).toString());
                line.setAttribute("y2", posY.toString());
                line.setAttribute("stroke", (i == 1) ? "red" : "#52504d");
                line.setAttribute("stroke-width", "3");
                n1Group.appendChild(line);
                posY += gradSpacing[i];
            }
            this.N1LeftZoneX = startPosX - halfWidth;
            this.N1LeftZoneY2 = startPosY;
            this.N1LeftZoneY1 = posY;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", this.N1LeftZoneX.toString());
            line.setAttribute("y1", this.N1LeftZoneY1.toString());
            line.setAttribute("x2", this.N1LeftZoneX.toString());
            line.setAttribute("y2", this.N1LeftZoneY2.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            n1Group.appendChild(line);
            this.N1RightZoneX = startPosX + halfWidth;
            this.N1RightZoneY2 = startPosY;
            this.N1RightZoneY1 = posY;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", this.N1RightZoneX.toString());
            line.setAttribute("y1", this.N1RightZoneY1.toString());
            line.setAttribute("x2", this.N1RightZoneX.toString());
            line.setAttribute("y2", this.N1RightZoneY2.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            n1Group.appendChild(line);
            this.N1LeftCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.N1LeftCursor.setAttribute("fill", "white");
            n1Group.appendChild(this.N1LeftCursor);
            this.N1RightCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.N1RightCursor.setAttribute("fill", "white");
            n1Group.appendChild(this.N1RightCursor);
            var rectOffsetX = 15;
            var rectWidth = 95;
            var rectHeight = 40;
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (startPosX - halfWidth - rectOffsetX).toString());
            rect.setAttribute("y", posY.toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            n1Group.appendChild(rect);
            this.N1LeftValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.N1LeftValue.textContent = "0.0";
            this.N1LeftValue.setAttribute("x", (startPosX - halfWidth - rectOffsetX + rectWidth * 0.95).toString());
            this.N1LeftValue.setAttribute("y", (posY + rectHeight * 0.62).toString());
            this.N1LeftValue.setAttribute("fill", "#11d011");
            this.N1LeftValue.setAttribute("font-size", "32");
            this.N1LeftValue.setAttribute("font-family", "Roboto-Bold");
            this.N1LeftValue.setAttribute("text-anchor", "end");
            this.N1LeftValue.setAttribute("alignment-baseline", "central");
            n1Group.appendChild(this.N1LeftValue);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (startPosX + halfWidth + rectOffsetX - rectWidth).toString());
            rect.setAttribute("y", posY.toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            n1Group.appendChild(rect);
            this.N1RightValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.N1RightValue.textContent = "0.0";
            this.N1RightValue.setAttribute("x", (startPosX + halfWidth + rectOffsetX - rectWidth * 0.05).toString());
            this.N1RightValue.setAttribute("y", (posY + rectHeight * 0.62).toString());
            this.N1RightValue.setAttribute("fill", "#11d011");
            this.N1RightValue.setAttribute("font-size", "32");
            this.N1RightValue.setAttribute("font-family", "Roboto-Bold");
            this.N1RightValue.setAttribute("text-anchor", "end");
            this.N1RightValue.setAttribute("alignment-baseline", "central");
            n1Group.appendChild(this.N1RightValue);

            startPosY = 70;

            // engine modes
            this.N1ModeLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.N1ModeLeft.textContent = "TO";
            this.N1ModeLeft.setAttribute("x", 100);
            this.N1ModeLeft.setAttribute("y", startPosY);
            this.N1ModeLeft.setAttribute("fill", "#cccac8");
            this.N1ModeLeft.setAttribute("font-size", "24");
            this.N1ModeLeft.setAttribute("writing-mode", "tb-rl");
            this.N1ModeLeft.setAttribute("glyph-orientation-vertical", "0");
            this.N1ModeLeft.setAttribute("font-family", "Roboto-Bold");
            n1Group.appendChild(this.N1ModeLeft);

            this.N1ModeRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.N1ModeRight.textContent = "TO";
            this.N1ModeRight.setAttribute("x", 180);
            this.N1ModeRight.setAttribute("y", startPosY);
            this.N1ModeRight.setAttribute("fill", "#cccac8");
            this.N1ModeRight.setAttribute("font-size", "24");
            this.N1ModeRight.setAttribute("writing-mode", "tb-rl");
            this.N1ModeRight.setAttribute("glyph-orientation-vertical", "0");
            this.N1ModeRight.setAttribute("font-family", "Roboto-Bold");
            n1Group.appendChild(this.N1ModeRight);

        }
        {
            var ittGroup = document.createElementNS(Avionics.SVG.NS, "g");
            ittGroup.setAttribute("id", "ITT");
            rootSVG.appendChild(ittGroup);
            var startPosX = 350;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "ITT°C";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "#cccac8");
            titleText.setAttribute("font-size", "24");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            ittGroup.appendChild(titleText);
            var gradValues = [0, 0, 900, 0, 800, 700, 600, 0, 200];
            var gradLength = [14, 26, 26, 18, 26, 26, 26, 26, 26];
            var gradSpacing = [14, 18, 16, 16, 24, 24, 18, 18, 0];
            startPosY += 5;
            var posY = startPosY;
            var halfWidth = 60;
            for (var i = 0; i < gradValues.length; i++) {
                if (gradValues[i] > 0) {
                    var text = document.createElementNS(Avionics.SVG.NS, "text");
                    text.textContent = gradValues[i].toString();
                    text.setAttribute("x", startPosX.toString());
                    text.setAttribute("y", posY.toString());
                    text.setAttribute("fill", "#cccac8");
                    text.setAttribute("font-size", "24");
                    text.setAttribute("font-family", "Roboto-Light");
                    text.setAttribute("text-anchor", "middle");
                    text.setAttribute("alignment-baseline", "central");
                    ittGroup.appendChild(text);
                }
                var line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("x1", (startPosX - halfWidth).toString());
                line.setAttribute("y1", posY.toString());
                line.setAttribute("x2", (startPosX - halfWidth + gradLength[i]).toString());
                line.setAttribute("y2", posY.toString());
                line.setAttribute("stroke", (i == 3) ? "red" : "#52504d");
                line.setAttribute("stroke-width", "2");
                ittGroup.appendChild(line);
                var line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("x1", (startPosX + halfWidth - gradLength[i]).toString());
                line.setAttribute("y1", posY.toString());
                line.setAttribute("x2", (startPosX + halfWidth).toString());
                line.setAttribute("y2", posY.toString());
                line.setAttribute("stroke", (i == 3) ? "red" : "#52504d");
                line.setAttribute("stroke-width", "2");
                ittGroup.appendChild(line);
                posY += gradSpacing[i];
            }
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", (startPosX - halfWidth - 12).toString());
            line.setAttribute("y1", posY.toString());
            line.setAttribute("x2", (startPosX - halfWidth).toString());
            line.setAttribute("y2", posY.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            ittGroup.appendChild(line);
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", (startPosX + halfWidth).toString());
            line.setAttribute("y1", posY.toString());
            line.setAttribute("x2", (startPosX + halfWidth + 12).toString());
            line.setAttribute("y2", posY.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            ittGroup.appendChild(line);
            this.ITTLeftZoneX = startPosX - halfWidth;
            this.ITTLeftZoneY2 = startPosY;
            this.ITTLeftZoneY1 = posY;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", this.ITTLeftZoneX.toString());
            line.setAttribute("y1", this.ITTLeftZoneY1.toString());
            line.setAttribute("x2", this.ITTLeftZoneX.toString());
            line.setAttribute("y2", this.ITTLeftZoneY2.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            ittGroup.appendChild(line);
            this.ITTRightZoneX = startPosX + halfWidth;
            this.ITTRightZoneY2 = startPosY;
            this.ITTRightZoneY1 = posY;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", this.ITTRightZoneX.toString());
            line.setAttribute("y1", this.ITTRightZoneY1.toString());
            line.setAttribute("x2", this.ITTRightZoneX.toString());
            line.setAttribute("y2", this.ITTRightZoneY2.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            ittGroup.appendChild(line);
            var cursorWidth = 10;
            var cursorHeight = 10;
            this.ITTLeftBeacon = document.createElementNS(Avionics.SVG.NS, "rect");
            this.ITTLeftBeacon.setAttribute("x", this.ITTLeftZoneX.toString());
            this.ITTLeftBeacon.setAttribute("y", this.ITTLeftZoneY1.toString());
            this.ITTLeftBeacon.setAttribute("width", cursorWidth.toString());
            this.ITTLeftBeacon.setAttribute("height", cursorHeight.toString());
            this.ITTLeftBeacon.setAttribute("fill", "darkorange");
            ittGroup.appendChild(this.ITTLeftBeacon);
            this.ITTRightBeacon = document.createElementNS(Avionics.SVG.NS, "rect");
            this.ITTRightBeacon.setAttribute("x", (this.ITTRightZoneX - cursorWidth).toString());
            this.ITTRightBeacon.setAttribute("y", this.ITTRightZoneY1.toString());
            this.ITTRightBeacon.setAttribute("width", cursorWidth.toString());
            this.ITTRightBeacon.setAttribute("height", cursorHeight.toString());
            this.ITTRightBeacon.setAttribute("fill", "darkorange");
            ittGroup.appendChild(this.ITTRightBeacon);
            this.ITTLeftCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.ITTLeftCursor.setAttribute("fill", "white");
            ittGroup.appendChild(this.ITTLeftCursor);
            this.ITTRightCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.ITTRightCursor.setAttribute("fill", "white");
            ittGroup.appendChild(this.ITTRightCursor);


            // IGN
            this.IgnLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.IgnLeft.textContent = "IGN";
            this.IgnLeft.setAttribute("x", (startPosX - halfWidth - 28).toString());
            this.IgnLeft.setAttribute("y", (startPosY - 10).toString());
            this.IgnLeft.setAttribute("fill", "#11d011");
            this.IgnLeft.setAttribute("font-size", "26");
            this.IgnLeft.setAttribute("visibility", "hidden");
            this.IgnLeft.setAttribute("writing-mode", "tb-rl");
            this.IgnLeft.setAttribute("glyph-orientation-vertical", "0");
            this.IgnLeft.setAttribute("font-family", "Roboto-Bold");
            ittGroup.appendChild(this.IgnLeft);

            this.IgnRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.IgnRight.textContent = "IGN";
            this.IgnRight.setAttribute("x", (startPosX + halfWidth + 25).toString());
            this.IgnRight.setAttribute("y", (startPosY - 10).toString());
            this.IgnRight.setAttribute("fill", "#11d011");
            this.IgnRight.setAttribute("font-size", "26");
            this.IgnRight.setAttribute("visibility", "hidden");
            this.IgnRight.setAttribute("writing-mode", "tb-rl");
            this.IgnRight.setAttribute("glyph-orientation-vertical", "0");
            this.IgnRight.setAttribute("font-family", "Roboto-Bold");
            ittGroup.appendChild(this.IgnRight);
        }
        {
            var n2Group = document.createElementNS(Avionics.SVG.NS, "g");
            n2Group.setAttribute("id", "N2Group");
            rootSVG.appendChild(n2Group);
            var startPosX = 580;
            var startPosY = 50;
            var titleTextTop = document.createElementNS(Avionics.SVG.NS, "text");
            titleTextTop.textContent = "N2 %";
            titleTextTop.setAttribute("x", startPosX.toString());
            titleTextTop.setAttribute("y", startPosY.toString());
            titleTextTop.setAttribute("fill", "#cccac8");
            titleTextTop.setAttribute("font-size", "22");
            titleTextTop.setAttribute("font-family", "Roboto-Light");
            titleTextTop.setAttribute("text-anchor", "middle");
            titleTextTop.setAttribute("alignment-baseline", "central");
            n2Group.appendChild(titleTextTop);
            var rectMarginX = 40;
            var rectWidth = 85;
            var rectHeight = 32;
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (startPosX - rectMarginX - rectWidth).toString());
            rect.setAttribute("y", (startPosY - rectHeight * 0.6).toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            n2Group.appendChild(rect);
            this.N2LeftValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.N2LeftValue.textContent = "0.0";
            this.N2LeftValue.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.N2LeftValue.setAttribute("y", 51);
            this.N2LeftValue.setAttribute("fill", "#11d011");
            this.N2LeftValue.setAttribute("font-size", "28");
            this.N2LeftValue.setAttribute("font-family", "Roboto-Bold");
            this.N2LeftValue.setAttribute("text-anchor", "end");
            this.N2LeftValue.setAttribute("alignment-baseline", "central");
            n2Group.appendChild(this.N2LeftValue);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (startPosX + rectMarginX).toString());
            rect.setAttribute("y", (startPosY - rectHeight * 0.6).toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            n2Group.appendChild(rect);
            this.N2RightValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.N2RightValue.textContent = "0.0";
            this.N2RightValue.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.N2RightValue.setAttribute("y", 51);
            this.N2RightValue.setAttribute("fill", "#11d011");
            this.N2RightValue.setAttribute("font-size", "28");
            this.N2RightValue.setAttribute("font-family", "Roboto-Bold");
            this.N2RightValue.setAttribute("text-anchor", "end");
            this.N2RightValue.setAttribute("alignment-baseline", "central");
            n2Group.appendChild(this.N2RightValue);
        }
        {
            var oilGroup = document.createElementNS(Avionics.SVG.NS, "g");
            oilGroup.setAttribute("id", "OilGroup");
            rootSVG.appendChild(oilGroup);
            var startPosX = 580;
            var startPosY = 90;
            var rectMarginX = 40;
            var rectWidth = 80;
            var rectHeight = 30;
            var titleTextLeft = document.createElementNS(Avionics.SVG.NS, "text");
            titleTextLeft.textContent = "OIL °C";
            titleTextLeft.setAttribute("x", startPosX.toString());
            titleTextLeft.setAttribute("y", startPosY.toString());
            titleTextLeft.setAttribute("fill", "#cccac8");
            titleTextLeft.setAttribute("font-size", "22");
            titleTextLeft.setAttribute("font-family", "Roboto-Light");
            titleTextLeft.setAttribute("text-anchor", "middle");
            titleTextLeft.setAttribute("alignment-baseline", "central");
            oilGroup.appendChild(titleTextLeft);
            this.OilTemp1Value = document.createElementNS(Avionics.SVG.NS, "text");
            this.OilTemp1Value.textContent = "15";
            this.OilTemp1Value.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.2).toString());
            this.OilTemp1Value.setAttribute("y", startPosY.toString());
            this.OilTemp1Value.setAttribute("fill", "#11d011");
            this.OilTemp1Value.setAttribute("font-size", "28");
            this.OilTemp1Value.setAttribute("font-family", "Roboto-Bold");
            this.OilTemp1Value.setAttribute("text-anchor", "end");
            this.OilTemp1Value.setAttribute("alignment-baseline", "central");
            oilGroup.appendChild(this.OilTemp1Value);
            this.OilTemp2Value = document.createElementNS(Avionics.SVG.NS, "text");
            this.OilTemp2Value.textContent = "15";
            this.OilTemp2Value.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.OilTemp2Value.setAttribute("y", startPosY.toString());
            this.OilTemp2Value.setAttribute("fill", "#11d011");
            this.OilTemp2Value.setAttribute("font-size", "28");
            this.OilTemp2Value.setAttribute("font-family", "Roboto-Bold");
            this.OilTemp2Value.setAttribute("text-anchor", "end");
            this.OilTemp2Value.setAttribute("alignment-baseline", "central");
            oilGroup.appendChild(this.OilTemp2Value);
            startPosY += 35;
            var titleTextLeft = document.createElementNS(Avionics.SVG.NS, "text");
            titleTextLeft.textContent = "OIL PSI";
            titleTextLeft.setAttribute("x", startPosX.toString());
            titleTextLeft.setAttribute("y", startPosY.toString());
            titleTextLeft.setAttribute("fill", "#cccac8");
            titleTextLeft.setAttribute("font-size", "22");
            titleTextLeft.setAttribute("font-family", "Roboto-Light");
            titleTextLeft.setAttribute("text-anchor", "middle");
            titleTextLeft.setAttribute("alignment-baseline", "central");
            oilGroup.appendChild(titleTextLeft);
            this.OilPSI1Value = document.createElementNS(Avionics.SVG.NS, "text");
            this.OilPSI1Value.textContent = "0";
            this.OilPSI1Value.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.2).toString());
            this.OilPSI1Value.setAttribute("y", startPosY.toString());
            this.OilPSI1Value.setAttribute("fill", "#11d011");
            this.OilPSI1Value.setAttribute("font-size", "28");
            this.OilPSI1Value.setAttribute("font-family", "Roboto-Bold");
            this.OilPSI1Value.setAttribute("text-anchor", "end");
            this.OilPSI1Value.setAttribute("alignment-baseline", "central");
            oilGroup.appendChild(this.OilPSI1Value);
            this.OilPSI2Value = document.createElementNS(Avionics.SVG.NS, "text");
            this.OilPSI2Value.textContent = "0";
            this.OilPSI2Value.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.OilPSI2Value.setAttribute("y", startPosY.toString());
            this.OilPSI2Value.setAttribute("fill", "#11d011");
            this.OilPSI2Value.setAttribute("font-size", "28");
            this.OilPSI2Value.setAttribute("font-family", "Roboto-Bold");
            this.OilPSI2Value.setAttribute("text-anchor", "end");
            this.OilPSI2Value.setAttribute("alignment-baseline", "central");
            oilGroup.appendChild(this.OilPSI2Value);
        }
        {
            var fuelGroup = document.createElementNS(Avionics.SVG.NS, "g");
            fuelGroup.setAttribute("id", "FuelGroup");
            rootSVG.appendChild(fuelGroup);
            var startPosX = 580;
            var startPosY = 165;
            var rectMarginX = 40;
            var rectWidth = 75;
            var rectHeight = 35;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "FUEL";
            text.setAttribute("x", startPosX.toString());
            text.setAttribute("y", (startPosY - 10).toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = WT_ConvertUnit.isMetric() ? "KGS" : "LBS";
            text.setAttribute("x", startPosX.toString());
            text.setAttribute("y", (startPosY + 10).toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(text);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (startPosX - rectMarginX - 72).toString());
            rect.setAttribute("y", (startPosY - rectHeight * 0.55).toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            fuelGroup.appendChild(rect);
            this.FuelLBSLeftValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.FuelLBSLeftValue.textContent = "2910";
            this.FuelLBSLeftValue.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.FuelLBSLeftValue.setAttribute("y", 167);
            this.FuelLBSLeftValue.setAttribute("fill", "#11d011");
            this.FuelLBSLeftValue.setAttribute("font-size", "28");
            this.FuelLBSLeftValue.setAttribute("font-family", "Roboto-Bold");
            this.FuelLBSLeftValue.setAttribute("text-anchor", "end");
            this.FuelLBSLeftValue.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FuelLBSLeftValue);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (startPosX + 35).toString());
            rect.setAttribute("y", (startPosY - rectHeight * 0.55).toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            fuelGroup.appendChild(rect);
            this.FuelLBSRightValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.FuelLBSRightValue.textContent = "2910";
            this.FuelLBSRightValue.setAttribute("x", (startPosX + 33 + rectWidth * 0.95).toString());
            this.FuelLBSRightValue.setAttribute("y", 167);
            this.FuelLBSRightValue.setAttribute("fill", "#11d011");
            this.FuelLBSRightValue.setAttribute("font-size", "28");
            this.FuelLBSRightValue.setAttribute("font-family", "Roboto-Bold");
            this.FuelLBSRightValue.setAttribute("text-anchor", "end");
            this.FuelLBSRightValue.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FuelLBSRightValue);
        }
        {
            var trimGroup = document.createElementNS(Avionics.SVG.NS, "g");
            trimGroup.setAttribute("id", "TrimGroup");
            rootSVG.appendChild(trimGroup);
            var startPosX = 760;
            var startPosY = 30;
            var blockPosX = startPosX;
            var blockPosY = startPosY;
            var lineSize = 15;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", blockPosX.toString());
            line.setAttribute("y1", blockPosY.toString());
            line.setAttribute("x2", (blockPosX + lineSize).toString());
            line.setAttribute("y2", blockPosY.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            trimGroup.appendChild(line);
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", blockPosX.toString());
            line.setAttribute("y1", blockPosY.toString());
            line.setAttribute("x2", blockPosX.toString());
            line.setAttribute("y2", (blockPosY + lineSize).toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            trimGroup.appendChild(line);
            var textStartY = blockPosY + lineSize + 15;
            var textSpacingY = 18;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "T";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", (textStartY + textSpacingY * 0).toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "R";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", (textStartY + textSpacingY * 1).toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "I";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", (textStartY + textSpacingY * 2).toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "M";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", (textStartY + textSpacingY * 3).toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var lineStartY = (textStartY + textSpacingY * 3) + 15;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", blockPosX.toString());
            line.setAttribute("y1", lineStartY.toString());
            line.setAttribute("x2", blockPosX.toString());
            line.setAttribute("y2", (lineStartY + lineSize).toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            trimGroup.appendChild(line);
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", blockPosX.toString());
            line.setAttribute("y1", (lineStartY + lineSize).toString());
            line.setAttribute("x2", (blockPosX + lineSize).toString());
            line.setAttribute("y2", (lineStartY + lineSize).toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            trimGroup.appendChild(line);
            blockPosX = startPosX + 80;
            blockPosY = startPosY + 25;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "AIL";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", blockPosY.toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            blockPosY += 30;
            var gaugeWidth = 80;
            var gaugeHeight = 11;
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (blockPosX - gaugeWidth * 0.5).toString());
            rect.setAttribute("y", blockPosY.toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", gaugeHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            trimGroup.appendChild(rect);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "L";
            text.setAttribute("x", (blockPosX - gaugeWidth * 0.5 - 10).toString());
            text.setAttribute("y", (blockPosY + gaugeHeight * 0.5).toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "end");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "R";
            text.setAttribute("x", (blockPosX + gaugeWidth * 0.5 + 10).toString());
            text.setAttribute("y", (blockPosY + gaugeHeight * 0.5).toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "start");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (blockPosX - gaugeWidth * 0.15).toString());
            rect.setAttribute("y", blockPosY.toString());
            rect.setAttribute("width", (gaugeWidth * 0.15).toString());
            rect.setAttribute("height", gaugeHeight.toString());
            rect.setAttribute("fill", "#11d011");
            trimGroup.appendChild(rect);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", blockPosX.toString());
            rect.setAttribute("y", blockPosY.toString());
            rect.setAttribute("width", (gaugeWidth * 0.15).toString());
            rect.setAttribute("height", gaugeHeight.toString());
            rect.setAttribute("fill", "#11d011");
            trimGroup.appendChild(rect);
            this.AileronCursorX1 = blockPosX - gaugeWidth * 0.5;
            this.AileronCursorX2 = blockPosX + gaugeWidth * 0.5;
            this.AileronCursorY = blockPosY;
            this.AileronCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.AileronCursor.setAttribute("transform", "translate (" + this.AileronCursorX1 + " " + this.AileronCursorY + ")");
            this.AileronCursor.setAttribute("fill", "white");
            this.AileronCursor.setAttribute("d", "M0 0 l-5 -15 l10 0 l-5 15 Z");
            trimGroup.appendChild(this.AileronCursor);
            this.RudderCursorX1 = blockPosX - gaugeWidth * 0.5;
            this.RudderCursorX2 = blockPosX + gaugeWidth * 0.5;
            this.RudderCursorY = blockPosY + gaugeHeight;
            this.RudderCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.RudderCursor.setAttribute("transform", "translate (" + this.RudderCursorX1 + " " + this.RudderCursorY + ")");
            this.RudderCursor.setAttribute("fill", "white");
            this.RudderCursor.setAttribute("d", "M0 0 l-5 15 l10 0 l-5 -15 Z");
            trimGroup.appendChild(this.RudderCursor);
            blockPosY += 30 + gaugeHeight;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "RUD";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", blockPosY.toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            blockPosX = startPosX + 180;
            blockPosY = startPosY + 10;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "ELEV";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", blockPosY.toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var gaugeStartX = blockPosX;
            var gaugeStartY = blockPosY + 19;
            var gaugeWidth = 11;
            var gaugeHeight = 85;
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", gaugeStartX.toString());
            rect.setAttribute("y", gaugeStartY.toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", gaugeHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            trimGroup.appendChild(rect);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            var percent = (-Simplane.getTrimNeutral() + 1.0) * 0.5;
            percent = Math.min(1, Math.max(0, percent));
            var posY = ((gaugeStartY + gaugeHeight) - (gaugeHeight * percent)) - ((gaugeHeight * 0.18) / 2);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", gaugeStartX.toString());
            rect.setAttribute("y", (posY).toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", (gaugeHeight * 0.20).toString());
            rect.setAttribute("fill", "#11d011");
            trimGroup.appendChild(rect);
            this.ElevatorCursorX = gaugeStartX + gaugeWidth;
            this.ElevatorCursorY1 = gaugeStartY;
            this.ElevatorCursorY2 = gaugeStartY + gaugeHeight;
            this.ElevatorCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.ElevatorCursor.setAttribute("transform", "translate (" + this.ElevatorCursorX + " " + this.ElevatorCursorY2 + ")");
            this.ElevatorCursor.setAttribute("fill", "white");
            this.ElevatorCursor.setAttribute("d", "M0 0 l15 -5 l0 10 l-15 -5 Z");
            trimGroup.appendChild(this.ElevatorCursor);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "ND";
            text.setAttribute("x", (gaugeStartX - 8).toString());
            text.setAttribute("y", (gaugeStartY + 14).toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "end");
            text.setAttribute("alignment-baseline", "top");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "NU";
            text.setAttribute("x", (gaugeStartX - 8).toString());
            text.setAttribute("y", (gaugeStartY + gaugeHeight).toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "end");
            text.setAttribute("alignment-baseline", "bottom");
            trimGroup.appendChild(text);
            blockPosX = startPosX + 75;
            blockPosY = startPosY + 150;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "FLAPS";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", blockPosY.toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var cursorCenterX = blockPosX + 42;
            var cursorCenterY = blockPosY - 20;
            this.flapsCursorTransform = "translate (" + cursorCenterX + " " + cursorCenterY + ") scale(0.65)";
            this.FlapsCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.FlapsCursor.setAttribute("transform", this.flapsCursorTransform + " rotate(0)");
            this.FlapsCursor.setAttribute("fill", "white");
            this.FlapsCursor.setAttribute("d", "M0 0 M-10 10 q-10 -10 0 -20 l70 7 q3 3 0 6 l-70 7 Z");
            trimGroup.appendChild(this.FlapsCursor);
            for (var i = 0; i < this.Flaps_Table_Angles.length; i++) {
                var radians = this.Flaps_Table_Angles[i] * Math.PI / 180;
                var startX = cursorCenterX + Math.cos(radians) * 45;
                var startY = cursorCenterY + Math.sin(radians) * 45;
                var endX = cursorCenterX + Math.cos(radians) * 60;
                var endY = cursorCenterY + Math.sin(radians) * 60;
                var textX = cursorCenterX + Math.cos(radians) * 72;
                var textY = cursorCenterY + Math.sin(radians) * 72;
                var line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("x1", startX.toString());
                line.setAttribute("y1", startY.toString());
                line.setAttribute("x2", endX.toString());
                line.setAttribute("y2", endY.toString());
                line.setAttribute("stroke", "#52504d");
                line.setAttribute("stroke-width", "2");
                trimGroup.appendChild(line);
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = this.Flaps_Table_Values[i].toString();
                text.setAttribute("x", textX.toString());
                text.setAttribute("y", textY.toString());
                text.setAttribute("fill", "#cccac8");
                text.setAttribute("font-size", "22");
                text.setAttribute("font-family", "Roboto-Light");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                trimGroup.appendChild(text);
            }
        }
    }
    constructDefault() {
        var rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        rootSVG.setAttribute("id", "Standard");
        rootSVG.setAttribute("viewBox", "0 0 1000 1000");
        this.root.appendChild(rootSVG);
        {
            var n1Group = document.createElementNS(Avionics.SVG.NS, "g");
            n1Group.setAttribute("id", "N1");
            rootSVG.appendChild(n1Group);
            var startPosX = 140;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "N1%";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "#cccac8");
            titleText.setAttribute("font-size", "24");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            n1Group.appendChild(titleText);
            var gradValues = [0, 0, 100, 0, 90, 0, 80, 60, 40, 20];
            var gradLength = [26, 20, 20, 12, 20, 12, 20, 20, 20, 20];
            var gradSpacing = [25, 25, 25, 25, 25, 25, 25, 25, 25, 15];
            startPosY += 20;
            var posY = startPosY;
            var halfWidth = 80;
            for (var i = 0; i < gradValues.length; i++) {
                if (gradValues[i] > 0) {
                    var text = document.createElementNS(Avionics.SVG.NS, "text");
                    text.textContent = gradValues[i].toString();
                    text.setAttribute("x", startPosX.toString());
                    text.setAttribute("y", posY.toString());
                    text.setAttribute("fill", "#cccac8");
                    text.setAttribute("font-size", "24");
                    text.setAttribute("font-family", "Roboto-Light");
                    text.setAttribute("text-anchor", "middle");
                    text.setAttribute("alignment-baseline", "central");
                    n1Group.appendChild(text);
                }
                var line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("x1", (startPosX - halfWidth).toString());
                line.setAttribute("y1", posY.toString());
                line.setAttribute("x2", (startPosX - halfWidth + gradLength[i]).toString());
                line.setAttribute("y2", posY.toString());
                line.setAttribute("stroke", (i == 1) ? "red" : "#52504d");
                line.setAttribute("stroke-width", "2");
                n1Group.appendChild(line);
                var line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("x1", (startPosX + halfWidth - gradLength[i]).toString());
                line.setAttribute("y1", posY.toString());
                line.setAttribute("x2", (startPosX + halfWidth).toString());
                line.setAttribute("y2", posY.toString());
                line.setAttribute("stroke", (i == 1) ? "red" : "#52504d");
                line.setAttribute("stroke-width", "2");
                n1Group.appendChild(line);
                posY += gradSpacing[i];
            }
            this.N1LeftZoneX = startPosX - halfWidth;
            this.N1LeftZoneY2 = startPosY;
            this.N1LeftZoneY1 = posY;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", this.N1LeftZoneX.toString());
            line.setAttribute("y1", this.N1LeftZoneY1.toString());
            line.setAttribute("x2", this.N1LeftZoneX.toString());
            line.setAttribute("y2", this.N1LeftZoneY2.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            n1Group.appendChild(line);
            this.N1RightZoneX = startPosX + halfWidth;
            this.N1RightZoneY2 = startPosY;
            this.N1RightZoneY1 = posY;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", this.N1RightZoneX.toString());
            line.setAttribute("y1", this.N1RightZoneY1.toString());
            line.setAttribute("x2", this.N1RightZoneX.toString());
            line.setAttribute("y2", this.N1RightZoneY2.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            n1Group.appendChild(line);
            this.N1LeftCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.N1LeftCursor.setAttribute("fill", "white");
            n1Group.appendChild(this.N1LeftCursor);
            this.N1RightCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.N1RightCursor.setAttribute("fill", "white");
            n1Group.appendChild(this.N1RightCursor);
            var rectOffsetX = 37;
            var rectWidth = 110;
            var rectHeight = 40;
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (startPosX - halfWidth - rectOffsetX).toString());
            rect.setAttribute("y", posY.toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            n1Group.appendChild(rect);
            this.N1LeftValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.N1LeftValue.textContent = "0.0";
            this.N1LeftValue.setAttribute("x", (startPosX - halfWidth - rectOffsetX + rectWidth * 0.95).toString());
            this.N1LeftValue.setAttribute("y", (posY + rectHeight * 0.62).toString());
            this.N1LeftValue.setAttribute("fill", "#11d011");
            this.N1LeftValue.setAttribute("font-size", "32");
            this.N1LeftValue.setAttribute("font-family", "Roboto-Bold");
            this.N1LeftValue.setAttribute("text-anchor", "end");
            this.N1LeftValue.setAttribute("alignment-baseline", "central");
            n1Group.appendChild(this.N1LeftValue);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (startPosX + halfWidth + rectOffsetX - rectWidth).toString());
            rect.setAttribute("y", posY.toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            n1Group.appendChild(rect);
            this.N1RightValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.N1RightValue.textContent = "0.0";
            this.N1RightValue.setAttribute("x", (startPosX + halfWidth + rectOffsetX - rectWidth * 0.05).toString());
            this.N1RightValue.setAttribute("y", (posY + rectHeight * 0.62).toString());
            this.N1RightValue.setAttribute("fill", "#11d011");
            this.N1RightValue.setAttribute("font-size", "32");
            this.N1RightValue.setAttribute("font-family", "Roboto-Bold");
            this.N1RightValue.setAttribute("text-anchor", "end");
            this.N1RightValue.setAttribute("alignment-baseline", "central");
            n1Group.appendChild(this.N1RightValue);
        }
        {
            var ittGroup = document.createElementNS(Avionics.SVG.NS, "g");
            ittGroup.setAttribute("id", "ITT");
            rootSVG.appendChild(ittGroup);
            var startPosX = 390;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "ITT°C";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "#cccac8");
            titleText.setAttribute("font-size", "24");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            ittGroup.appendChild(titleText);
            var gradValues = [0, 1000, 0, 900, 0, 800, 0, 700, 0, 600, 400, 200];
            var gradLength = [14, 26, 12, 26, 18, 26, 12, 26, 12, 26, 26, 26];
            var gradSpacing = [18, 18, 18, 25, 25, 30, 30, 30, 30, 25, 25, 10];
            startPosY += 5;
            var posY = startPosY;
            var halfWidth = 60;
            for (var i = 0; i < gradValues.length; i++) {
                if (gradValues[i] > 0) {
                    var text = document.createElementNS(Avionics.SVG.NS, "text");
                    text.textContent = gradValues[i].toString();
                    text.setAttribute("x", startPosX.toString());
                    text.setAttribute("y", posY.toString());
                    text.setAttribute("fill", "#cccac8");
                    text.setAttribute("font-size", "24");
                    text.setAttribute("font-family", "Roboto-Light");
                    text.setAttribute("text-anchor", "middle");
                    text.setAttribute("alignment-baseline", "central");
                    ittGroup.appendChild(text);
                }
                var line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("x1", (startPosX - halfWidth).toString());
                line.setAttribute("y1", posY.toString());
                line.setAttribute("x2", (startPosX - halfWidth + gradLength[i]).toString());
                line.setAttribute("y2", posY.toString());
                line.setAttribute("stroke", (i == 4) ? "red" : "#52504d");
                line.setAttribute("stroke-width", "2");
                ittGroup.appendChild(line);
                var line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("x1", (startPosX + halfWidth - gradLength[i]).toString());
                line.setAttribute("y1", posY.toString());
                line.setAttribute("x2", (startPosX + halfWidth).toString());
                line.setAttribute("y2", posY.toString());
                line.setAttribute("stroke", (i == 4) ? "red" : "#52504d");
                line.setAttribute("stroke-width", "2");
                ittGroup.appendChild(line);
                posY += gradSpacing[i];
            }
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", (startPosX - halfWidth - 12).toString());
            line.setAttribute("y1", posY.toString());
            line.setAttribute("x2", (startPosX - halfWidth).toString());
            line.setAttribute("y2", posY.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            ittGroup.appendChild(line);
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", (startPosX + halfWidth).toString());
            line.setAttribute("y1", posY.toString());
            line.setAttribute("x2", (startPosX + halfWidth + 12).toString());
            line.setAttribute("y2", posY.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            ittGroup.appendChild(line);
            this.ITTLeftZoneX = startPosX - halfWidth;
            this.ITTLeftZoneY2 = startPosY;
            this.ITTLeftZoneY1 = posY;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", this.ITTLeftZoneX.toString());
            line.setAttribute("y1", this.ITTLeftZoneY1.toString());
            line.setAttribute("x2", this.ITTLeftZoneX.toString());
            line.setAttribute("y2", this.ITTLeftZoneY2.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            ittGroup.appendChild(line);
            this.ITTRightZoneX = startPosX + halfWidth;
            this.ITTRightZoneY2 = startPosY;
            this.ITTRightZoneY1 = posY;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", this.ITTRightZoneX.toString());
            line.setAttribute("y1", this.ITTRightZoneY1.toString());
            line.setAttribute("x2", this.ITTRightZoneX.toString());
            line.setAttribute("y2", this.ITTRightZoneY2.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            ittGroup.appendChild(line);
            var cursorWidth = 10;
            var cursorHeight = 10;
            this.ITTLeftBeacon = document.createElementNS(Avionics.SVG.NS, "rect");
            this.ITTLeftBeacon.setAttribute("x", this.ITTLeftZoneX.toString());
            this.ITTLeftBeacon.setAttribute("y", this.ITTLeftZoneY1.toString());
            this.ITTLeftBeacon.setAttribute("width", cursorWidth.toString());
            this.ITTLeftBeacon.setAttribute("height", cursorHeight.toString());
            this.ITTLeftBeacon.setAttribute("fill", "darkorange");
            ittGroup.appendChild(this.ITTLeftBeacon);
            this.ITTRightBeacon = document.createElementNS(Avionics.SVG.NS, "rect");
            this.ITTRightBeacon.setAttribute("x", (this.ITTRightZoneX - cursorWidth).toString());
            this.ITTRightBeacon.setAttribute("y", this.ITTRightZoneY1.toString());
            this.ITTRightBeacon.setAttribute("width", cursorWidth.toString());
            this.ITTRightBeacon.setAttribute("height", cursorHeight.toString());
            this.ITTRightBeacon.setAttribute("fill", "darkorange");
            ittGroup.appendChild(this.ITTRightBeacon);
            this.ITTLeftCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.ITTLeftCursor.setAttribute("fill", "white");
            ittGroup.appendChild(this.ITTLeftCursor);
            this.ITTRightCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.ITTRightCursor.setAttribute("fill", "white");
            ittGroup.appendChild(this.ITTRightCursor);

            // IGN
            this.IgnLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.IgnLeft.textContent = "IGN";
            this.IgnLeft.setAttribute("x", (startPosX - halfWidth - 30).toString());
            this.IgnLeft.setAttribute("y", (startPosY - 6).toString());
            this.IgnLeft.setAttribute("fill", "#11d011");
            this.IgnLeft.setAttribute("font-size", "28");
            this.IgnLeft.setAttribute("visibility", "hidden");
            this.IgnLeft.setAttribute("writing-mode", "tb-rl");
            this.IgnLeft.setAttribute("glyph-orientation-vertical", "0");
            this.IgnLeft.setAttribute("font-family", "Roboto-Bold");
            ittGroup.appendChild(this.IgnLeft);

            this.IgnRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.IgnRight.textContent = "IGN";
            this.IgnRight.setAttribute("x", (startPosX + halfWidth + 30).toString());
            this.IgnRight.setAttribute("y", (startPosY - 6).toString());
            this.IgnRight.setAttribute("fill", "#11d011");
            this.IgnRight.setAttribute("font-size", "28");
            this.IgnRight.setAttribute("visibility", "hidden");
            this.IgnRight.setAttribute("writing-mode", "tb-rl");
            this.IgnRight.setAttribute("glyph-orientation-vertical", "0");
            this.IgnRight.setAttribute("font-family", "Roboto-Bold");
            ittGroup.appendChild(this.IgnRight);
        }
        {
            var n2Group = document.createElementNS(Avionics.SVG.NS, "g");
            n2Group.setAttribute("id", "N2Group");
            rootSVG.appendChild(n2Group);
            var startPosX = 630;
            var startPosY = 30;
            var titleTextTop = document.createElementNS(Avionics.SVG.NS, "text");
            titleTextTop.textContent = "N2";
            titleTextTop.setAttribute("x", startPosX.toString());
            titleTextTop.setAttribute("y", startPosY.toString());
            titleTextTop.setAttribute("fill", "#cccac8");
            titleTextTop.setAttribute("font-size", "22");
            titleTextTop.setAttribute("font-family", "Roboto-Light");
            titleTextTop.setAttribute("text-anchor", "middle");
            titleTextTop.setAttribute("alignment-baseline", "central");
            n2Group.appendChild(titleTextTop);
            var titleTextBottom = document.createElementNS(Avionics.SVG.NS, "text");
            titleTextBottom.textContent = "%";
            titleTextBottom.setAttribute("x", startPosX.toString());
            titleTextBottom.setAttribute("y", (startPosY + 20).toString());
            titleTextBottom.setAttribute("fill", "#cccac8");
            titleTextBottom.setAttribute("font-size", "24");
            titleTextBottom.setAttribute("font-family", "Roboto-Light");
            titleTextBottom.setAttribute("text-anchor", "middle");
            titleTextBottom.setAttribute("alignment-baseline", "central");
            n2Group.appendChild(titleTextBottom);
            var rectMarginX = 22;
            var rectMarginY = -3;
            var rectWidth = 85;
            var rectHeight = 32;
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (startPosX - rectMarginX - rectWidth).toString());
            rect.setAttribute("y", (startPosY + rectMarginY).toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            n2Group.appendChild(rect);
            this.N2LeftValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.N2LeftValue.textContent = "0.0";
            this.N2LeftValue.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.N2LeftValue.setAttribute("y", (startPosY + rectMarginY + rectHeight * 0.65).toString());
            this.N2LeftValue.setAttribute("fill", "#11d011");
            this.N2LeftValue.setAttribute("font-size", "28");
            this.N2LeftValue.setAttribute("font-family", "Roboto-Bold");
            this.N2LeftValue.setAttribute("text-anchor", "end");
            this.N2LeftValue.setAttribute("alignment-baseline", "central");
            n2Group.appendChild(this.N2LeftValue);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (startPosX + rectMarginX).toString());
            rect.setAttribute("y", (startPosY + rectMarginY).toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            n2Group.appendChild(rect);
            this.N2RightValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.N2RightValue.textContent = "0.0";
            this.N2RightValue.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.N2RightValue.setAttribute("y", (startPosY + rectMarginY + rectHeight * 0.65).toString());
            this.N2RightValue.setAttribute("fill", "#11d011");
            this.N2RightValue.setAttribute("font-size", "28");
            this.N2RightValue.setAttribute("font-family", "Roboto-Bold");
            this.N2RightValue.setAttribute("text-anchor", "end");
            this.N2RightValue.setAttribute("alignment-baseline", "central");
            n2Group.appendChild(this.N2RightValue);
        }
        {
            var oilGroup = document.createElementNS(Avionics.SVG.NS, "g");
            oilGroup.setAttribute("id", "OilGroup");
            rootSVG.appendChild(oilGroup);
            var startPosX = 630;
            var startPosY = 75;
            var halfWidth = 60;
            var fullHeight = 120;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", (startPosX - halfWidth * 1.8).toString());
            line.setAttribute("y1", startPosY.toString());
            line.setAttribute("x2", (startPosX + halfWidth * 1.8).toString());
            line.setAttribute("y2", startPosY.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            oilGroup.appendChild(line);
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", (startPosX - halfWidth * 1.8).toString());
            line.setAttribute("y1", (startPosY + fullHeight).toString());
            line.setAttribute("x2", (startPosX + halfWidth * 1.8).toString());
            line.setAttribute("y2", (startPosY + fullHeight).toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            oilGroup.appendChild(line);
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", "630");
            line.setAttribute("y1", "85");
            line.setAttribute("x2", "630");
            line.setAttribute("y2", "185");
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            oilGroup.appendChild(line);
            var gaugeWidth = 8;
            var gaugeHeight = fullHeight * 0.55;
            var titleTextLeft = document.createElementNS(Avionics.SVG.NS, "text");
            titleTextLeft.textContent = "OIL PSI";
            titleTextLeft.setAttribute("x", (startPosX - halfWidth).toString());
            titleTextLeft.setAttribute("y", (startPosY + 16).toString());
            titleTextLeft.setAttribute("fill", "#cccac8");
            titleTextLeft.setAttribute("font-size", "22");
            titleTextLeft.setAttribute("font-family", "Roboto-Light");
            titleTextLeft.setAttribute("text-anchor", "middle");
            titleTextLeft.setAttribute("alignment-baseline", "central");
            oilGroup.appendChild(titleTextLeft);
            {
                var psiRects = [0.1, 0.1, 0.6, 0.1, 0.1];
                var psiColors = ["red", "yellow", "#11d011", "yellow", "red"];
                this.OilPSI1CursorX = startPosX - halfWidth * 1.4;
                this.OilPSI1CursorY2 = startPosY + fullHeight * 0.25;
                this.OilPSI1CursorY1 = this.OilPSI1CursorY2 + gaugeHeight;
                var x = this.OilPSI1CursorX;
                var y = this.OilPSI1CursorY2;
                for (var i = 0; i < psiRects.length; i++) {
                    var h = (this.OilPSI1CursorY1 - this.OilPSI1CursorY2) * psiRects[i];
                    var rect = document.createElementNS(Avionics.SVG.NS, "rect");
                    rect.setAttribute("x", x.toString());
                    rect.setAttribute("y", y.toString());
                    rect.setAttribute("width", gaugeWidth.toString());
                    rect.setAttribute("height", h.toString());
                    rect.setAttribute("fill", psiColors[i]);
                    oilGroup.appendChild(rect);
                    y += h;
                }
                this.OilPSI1Value = document.createElementNS(Avionics.SVG.NS, "text");
                this.OilPSI1Value.textContent = "0";
                this.OilPSI1Value.setAttribute("x", (this.OilPSI1CursorX + gaugeWidth * 0.5).toString());
                this.OilPSI1Value.setAttribute("y", (this.OilPSI1CursorY1 + 15).toString());
                this.OilPSI1Value.setAttribute("fill", "#11d011");
                this.OilPSI1Value.setAttribute("font-size", "22");
                this.OilPSI1Value.setAttribute("font-family", "Roboto-Bold");
                this.OilPSI1Value.setAttribute("text-anchor", "middle");
                this.OilPSI1Value.setAttribute("alignment-baseline", "central");
                oilGroup.appendChild(this.OilPSI1Value);
                this.OilPSI1Cursor = document.createElementNS(Avionics.SVG.NS, "path");
                this.OilPSI1Cursor.setAttribute("transform", "translate (" + this.OilPSI1CursorX + " " + this.OilPSI1CursorY1 + ")");
                this.OilPSI1Cursor.setAttribute("fill", "#11d011");
                this.OilPSI1Cursor.setAttribute("d", "M0 0 l-15 5 l0 -10 l15 5 Z");
                oilGroup.appendChild(this.OilPSI1Cursor);
                this.OilPSI2CursorX = startPosX - halfWidth * 0.7;
                this.OilPSI2CursorY2 = startPosY + fullHeight * 0.25;
                this.OilPSI2CursorY1 = this.OilPSI2CursorY2 + gaugeHeight;
                var x = this.OilPSI2CursorX;
                var y = this.OilPSI2CursorY2;
                for (var i = 0; i < psiRects.length; i++) {
                    var h = (this.OilPSI2CursorY1 - this.OilPSI2CursorY2) * psiRects[i];
                    var rect = document.createElementNS(Avionics.SVG.NS, "rect");
                    rect.setAttribute("x", x.toString());
                    rect.setAttribute("y", y.toString());
                    rect.setAttribute("width", gaugeWidth.toString());
                    rect.setAttribute("height", h.toString());
                    rect.setAttribute("fill", psiColors[i]);
                    oilGroup.appendChild(rect);
                    y += h;
                }
                this.OilPSI2Value = document.createElementNS(Avionics.SVG.NS, "text");
                this.OilPSI2Value.textContent = "0";
                this.OilPSI2Value.setAttribute("x", (this.OilPSI2CursorX + gaugeWidth * 0.5).toString());
                this.OilPSI2Value.setAttribute("y", (this.OilPSI2CursorY1 + 15).toString());
                this.OilPSI2Value.setAttribute("fill", "#11d011");
                this.OilPSI2Value.setAttribute("font-size", "22");
                this.OilPSI2Value.setAttribute("font-family", "Roboto-Bold");
                this.OilPSI2Value.setAttribute("text-anchor", "middle");
                this.OilPSI2Value.setAttribute("alignment-baseline", "central");
                oilGroup.appendChild(this.OilPSI2Value);
                this.OilPSI2Cursor = document.createElementNS(Avionics.SVG.NS, "path");
                this.OilPSI2Cursor.setAttribute("transform", "translate (" + this.OilPSI2CursorX + " " + this.OilPSI2CursorY1 + ")");
                this.OilPSI2Cursor.setAttribute("fill", "#11d011");
                this.OilPSI2Cursor.setAttribute("d", "M 0 0 l 15 5 l 0 -10 l -15 5 Z");
                oilGroup.appendChild(this.OilPSI2Cursor);
            }
            var titleTextRight = document.createElementNS(Avionics.SVG.NS, "text");
            titleTextRight.textContent = "OIL °C";
            titleTextRight.setAttribute("x", (startPosX + halfWidth).toString());
            titleTextRight.setAttribute("y", (startPosY + 16).toString());
            titleTextRight.setAttribute("fill", "#cccac8");
            titleTextRight.setAttribute("font-size", "22");
            titleTextRight.setAttribute("font-family", "Roboto-Light");
            titleTextRight.setAttribute("text-anchor", "middle");
            titleTextRight.setAttribute("alignment-baseline", "central");
            oilGroup.appendChild(titleTextRight);
            {
                var tempRects = [0.1, 0.1, 0.6, 0.1, 0.1];
                var tempColors = ["red", "yellow", "#11d011", "yellow", "red"];
                this.OilTemp1CursorX = startPosX + halfWidth * 0.7;
                this.OilTemp1CursorY2 = startPosY + fullHeight * 0.25;
                this.OilTemp1CursorY1 = this.OilTemp1CursorY2 + gaugeHeight;
                var x = this.OilTemp1CursorX;
                var y = this.OilTemp1CursorY2;
                for (var i = 0; i < tempRects.length; i++) {
                    var h = (this.OilTemp1CursorY1 - this.OilTemp1CursorY2) * tempRects[i];
                    var rect = document.createElementNS(Avionics.SVG.NS, "rect");
                    rect.setAttribute("x", x.toString());
                    rect.setAttribute("y", y.toString());
                    rect.setAttribute("width", gaugeWidth.toString());
                    rect.setAttribute("height", h.toString());
                    rect.setAttribute("fill", tempColors[i]);
                    oilGroup.appendChild(rect);
                    y += h;
                }
                this.OilTemp1Value = document.createElementNS(Avionics.SVG.NS, "text");
                this.OilTemp1Value.textContent = "0";
                this.OilTemp1Value.setAttribute("x", (this.OilTemp1CursorX + gaugeWidth * 0.5).toString());
                this.OilTemp1Value.setAttribute("y", (this.OilTemp1CursorY1 + 15).toString());
                this.OilTemp1Value.setAttribute("fill", "#11d011");
                this.OilTemp1Value.setAttribute("font-size", "22");
                this.OilTemp1Value.setAttribute("font-family", "Roboto-Bold");
                this.OilTemp1Value.setAttribute("text-anchor", "middle");
                this.OilTemp1Value.setAttribute("alignment-baseline", "central");
                oilGroup.appendChild(this.OilTemp1Value);
                this.OilTemp1Cursor = document.createElementNS(Avionics.SVG.NS, "path");
                this.OilTemp1Cursor.setAttribute("transform", "translate (" + this.OilTemp1CursorX + " " + this.OilTemp1CursorY1 + ")");
                this.OilTemp1Cursor.setAttribute("fill", "#11d011");
                this.OilTemp1Cursor.setAttribute("d", "M0 0 l-15 5 l0 -10 l15 5 Z");
                oilGroup.appendChild(this.OilTemp1Cursor);
                this.OilTemp2CursorX = startPosX + halfWidth * 1.4;
                this.OilTemp2CursorY2 = startPosY + fullHeight * 0.25;
                this.OilTemp2CursorY1 = this.OilTemp2CursorY2 + gaugeHeight;
                var x = this.OilTemp2CursorX;
                var y = this.OilTemp2CursorY2;
                for (var i = 0; i < tempRects.length; i++) {
                    var h = (this.OilTemp2CursorY1 - this.OilTemp2CursorY2) * tempRects[i];
                    var rect = document.createElementNS(Avionics.SVG.NS, "rect");
                    rect.setAttribute("x", x.toString());
                    rect.setAttribute("y", y.toString());
                    rect.setAttribute("width", gaugeWidth.toString());
                    rect.setAttribute("height", h.toString());
                    rect.setAttribute("fill", tempColors[i]);
                    oilGroup.appendChild(rect);
                    y += h;
                }
                this.OilTemp2Value = document.createElementNS(Avionics.SVG.NS, "text");
                this.OilTemp2Value.textContent = "0";
                this.OilTemp2Value.setAttribute("x", (this.OilTemp2CursorX + gaugeWidth * 0.5).toString());
                this.OilTemp2Value.setAttribute("y", (this.OilTemp2CursorY1 + 15).toString());
                this.OilTemp2Value.setAttribute("fill", "#11d011");
                this.OilTemp2Value.setAttribute("font-size", "22");
                this.OilTemp2Value.setAttribute("font-family", "Roboto-Bold");
                this.OilTemp2Value.setAttribute("text-anchor", "middle");
                this.OilTemp2Value.setAttribute("alignment-baseline", "central");
                oilGroup.appendChild(this.OilTemp2Value);
                this.OilTemp2Cursor = document.createElementNS(Avionics.SVG.NS, "path");
                this.OilTemp2Cursor.setAttribute("transform", "translate (" + this.OilTemp2CursorX + " " + this.OilTemp2CursorY1 + ")");
                this.OilTemp2Cursor.setAttribute("fill", "#11d011");
                this.OilTemp2Cursor.setAttribute("d", "M 0 0 l 15 5 l 0 -10 l -15 5 Z");
                oilGroup.appendChild(this.OilTemp2Cursor);
            }
        }
        {
            var fuelGroup = document.createElementNS(Avionics.SVG.NS, "g");
            fuelGroup.setAttribute("id", "FuelGroup");
            rootSVG.appendChild(fuelGroup);
            var startPosX = 630;
            var startPosY = 220;
            var spacingX = 35;
            var spacingY = 30;
            var rectWidth = 75;
            var rectHeight = 35;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "FUEL";
            text.setAttribute("x", startPosX.toString());
            text.setAttribute("y", startPosY.toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(text);
            startPosY += spacingY;
            text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = WT_ConvertUnit.isMetric() ? "KG/H" : "PPH";
            text.setAttribute("x", startPosX.toString());
            text.setAttribute("y", startPosY.toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(text);
            this.FuelPPHLeftValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.FuelPPHLeftValue.textContent = "2910";
            this.FuelPPHLeftValue.setAttribute("x", (startPosX - spacingX - 5).toString());
            this.FuelPPHLeftValue.setAttribute("y", startPosY.toString());
            this.FuelPPHLeftValue.setAttribute("fill", "#11d011");
            this.FuelPPHLeftValue.setAttribute("font-size", "28");
            this.FuelPPHLeftValue.setAttribute("font-family", "Roboto-Bold");
            this.FuelPPHLeftValue.setAttribute("text-anchor", "end");
            this.FuelPPHLeftValue.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FuelPPHLeftValue);
            this.FuelPPHRightValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.FuelPPHRightValue.textContent = "2910";
            this.FuelPPHRightValue.setAttribute("x", (startPosX + spacingX + rectWidth - 5).toString());
            this.FuelPPHRightValue.setAttribute("y", startPosY.toString());
            this.FuelPPHRightValue.setAttribute("fill", "#11d011");
            this.FuelPPHRightValue.setAttribute("font-size", "28");
            this.FuelPPHRightValue.setAttribute("font-family", "Roboto-Bold");
            this.FuelPPHRightValue.setAttribute("text-anchor", "end");
            this.FuelPPHRightValue.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FuelPPHRightValue);
            startPosY += spacingY;
            text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "°C";
            text.setAttribute("x", startPosX.toString());
            text.setAttribute("y", startPosY.toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(text);
            this.FuelTempLeftValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.FuelTempLeftValue.textContent = "2910";
            this.FuelTempLeftValue.setAttribute("x", (startPosX - spacingX - 5).toString());
            this.FuelTempLeftValue.setAttribute("y", startPosY.toString());
            this.FuelTempLeftValue.setAttribute("fill", "#11d011");
            this.FuelTempLeftValue.setAttribute("font-size", "28");
            this.FuelTempLeftValue.setAttribute("font-family", "Roboto-Bold");
            this.FuelTempLeftValue.setAttribute("text-anchor", "end");
            this.FuelTempLeftValue.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FuelTempLeftValue);
            this.FuelTempRightValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.FuelTempRightValue.textContent = "2910";
            this.FuelTempRightValue.setAttribute("x", (startPosX + spacingX + rectWidth - 5).toString());
            this.FuelTempRightValue.setAttribute("y", startPosY.toString());
            this.FuelTempRightValue.setAttribute("fill", "#11d011");
            this.FuelTempRightValue.setAttribute("font-size", "28");
            this.FuelTempRightValue.setAttribute("font-family", "Roboto-Bold");
            this.FuelTempRightValue.setAttribute("text-anchor", "end");
            this.FuelTempRightValue.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FuelTempRightValue);
            startPosY += spacingY;
            text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = WT_ConvertUnit.isMetric() ? "KGS" : "LBS";
            text.setAttribute("x", startPosX.toString());
            text.setAttribute("y", startPosY.toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(text);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (startPosX - spacingX - rectWidth).toString());
            rect.setAttribute("y", (startPosY - rectHeight * 0.55).toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            fuelGroup.appendChild(rect);
            this.FuelLBSLeftValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.FuelLBSLeftValue.textContent = "2910";
            this.FuelLBSLeftValue.setAttribute("x", (startPosX - spacingX - 5).toString());
            this.FuelLBSLeftValue.setAttribute("y", 312);
            this.FuelLBSLeftValue.setAttribute("fill", "#11d011");
            this.FuelLBSLeftValue.setAttribute("font-size", "28");
            this.FuelLBSLeftValue.setAttribute("font-family", "Roboto-Bold");
            this.FuelLBSLeftValue.setAttribute("text-anchor", "end");
            this.FuelLBSLeftValue.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FuelLBSLeftValue);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (startPosX + spacingX).toString());
            rect.setAttribute("y", (startPosY - rectHeight * 0.55).toString());
            rect.setAttribute("width", rectWidth.toString());
            rect.setAttribute("height", rectHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            fuelGroup.appendChild(rect);
            this.FuelLBSRightValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.FuelLBSRightValue.textContent = "2910";
            this.FuelLBSRightValue.setAttribute("x", (startPosX + spacingX + rectWidth - 5).toString());
            this.FuelLBSRightValue.setAttribute("y", 312);
            this.FuelLBSRightValue.setAttribute("fill", "#11d011");
            this.FuelLBSRightValue.setAttribute("font-size", "28");
            this.FuelLBSRightValue.setAttribute("font-family", "Roboto-Bold");
            this.FuelLBSRightValue.setAttribute("text-anchor", "end");
            this.FuelLBSRightValue.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FuelLBSRightValue);
        }
        {
            var trimGroup = document.createElementNS(Avionics.SVG.NS, "g");
            trimGroup.setAttribute("id", "TrimGroup");
            rootSVG.appendChild(trimGroup);
            var startPosX = 875;
            var startPosY = 30;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "TRIM";
            text.setAttribute("x", startPosX.toString());
            text.setAttribute("y", startPosY.toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", (startPosX - 90).toString());
            line.setAttribute("y1", startPosY.toString());
            line.setAttribute("x2", (startPosX - 30).toString());
            line.setAttribute("y2", startPosY.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            trimGroup.appendChild(line);
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", (startPosX + 30).toString());
            line.setAttribute("y1", startPosY.toString());
            line.setAttribute("x2", (startPosX + 90).toString());
            line.setAttribute("y2", startPosY.toString());
            line.setAttribute("stroke", "#52504d");
            line.setAttribute("stroke-width", "2");
            trimGroup.appendChild(line);
            startPosY += 25;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "AIL";
            text.setAttribute("x", startPosX.toString());
            text.setAttribute("y", startPosY.toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            startPosY += 25;
            var gaugeWidth = 100;
            var gaugeHeight = 11;
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (startPosX - gaugeWidth * 0.5).toString());
            rect.setAttribute("y", startPosY.toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", gaugeHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            trimGroup.appendChild(rect);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "L";
            text.setAttribute("x", (startPosX - gaugeWidth * 0.5 - 10).toString());
            text.setAttribute("y", (startPosY + gaugeHeight * 0.5).toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "end");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "R";
            text.setAttribute("x", (startPosX + gaugeWidth * 0.5 + 10).toString());
            text.setAttribute("y", (startPosY + gaugeHeight * 0.5).toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "start");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (startPosX - gaugeWidth * 0.15).toString());
            rect.setAttribute("y", startPosY.toString());
            rect.setAttribute("width", (gaugeWidth * 0.15).toString());
            rect.setAttribute("height", gaugeHeight.toString());
            rect.setAttribute("fill", "#11d011");
            trimGroup.appendChild(rect);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", startPosX.toString());
            rect.setAttribute("y", startPosY.toString());
            rect.setAttribute("width", (gaugeWidth * 0.15).toString());
            rect.setAttribute("height", gaugeHeight.toString());
            rect.setAttribute("fill", "#11d011");
            trimGroup.appendChild(rect);
            this.AileronCursorX1 = startPosX - gaugeWidth * 0.5;
            this.AileronCursorX2 = startPosX + gaugeWidth * 0.5;
            this.AileronCursorY = startPosY;
            this.AileronCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.AileronCursor.setAttribute("transform", "translate (" + this.AileronCursorX1 + " " + this.AileronCursorY + ")");
            this.AileronCursor.setAttribute("fill", "white");
            this.AileronCursor.setAttribute("d", "M0 0 l-5 -15 l10 0 l-5 15 Z");
            trimGroup.appendChild(this.AileronCursor);
            this.RudderCursorX1 = startPosX - gaugeWidth * 0.5;
            this.RudderCursorX2 = startPosX + gaugeWidth * 0.5;
            this.RudderCursorY = startPosY + gaugeHeight;
            this.RudderCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.RudderCursor.setAttribute("transform", "translate (" + this.RudderCursorX1 + " " + this.RudderCursorY + ")");
            this.RudderCursor.setAttribute("fill", "white");
            this.RudderCursor.setAttribute("d", "M0 0 l-5 15 l10 0 l-5 -15 Z");
            trimGroup.appendChild(this.RudderCursor);
            startPosY += 25 + gaugeHeight;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "RUD";
            text.setAttribute("x", startPosX.toString());
            text.setAttribute("y", 122);
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            startPosY += 62;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "ELEV";
            text.setAttribute("x", (startPosX - 50).toString());
            text.setAttribute("y", startPosY.toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var gaugeStartX = startPosX + 30;
            var gaugeWidth = 11;
            var gaugeHeight = 70;
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", gaugeStartX.toString());
            rect.setAttribute("y", (startPosY - gaugeHeight * 0.5).toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", gaugeHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "#52504d");
            rect.setAttribute("stroke-width", "2");
            trimGroup.appendChild(rect);
            // elev trim expanded bar
            var percent = (-Simplane.getTrimNeutral() + 1.0) * 0.5;
            percent = Math.min(1, Math.max(0, percent));
            var posY = startPosY;
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", gaugeStartX.toString());
            rect.setAttribute("y", posY.toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", (gaugeHeight * 0.25).toString());
            rect.setAttribute("fill", "#11d011");
            trimGroup.appendChild(rect);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "ND";
            text.setAttribute("x", (gaugeStartX - 8).toString());
            text.setAttribute("y", (startPosY - gaugeHeight * 0.5 + 14).toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "end");
            text.setAttribute("alignment-baseline", "top");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "NU";
            text.setAttribute("x", (gaugeStartX - 8).toString());
            text.setAttribute("y", (startPosY + gaugeHeight * 0.5).toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "end");
            text.setAttribute("alignment-baseline", "bottom");
            trimGroup.appendChild(text);
            this.ElevatorCursorX = gaugeStartX + gaugeWidth;
            this.ElevatorCursorY1 = startPosY - gaugeHeight * 0.5;
            this.ElevatorCursorY2 = startPosY + gaugeHeight * 0.5;
            this.ElevatorCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.ElevatorCursor.setAttribute("transform", "translate (" + this.ElevatorCursorX + " " + this.ElevatorCursorY2 + ")");
            this.ElevatorCursor.setAttribute("fill", "white");
            this.ElevatorCursor.setAttribute("d", "M0 0 l15 -5 l0 10 l-15 -5 Z");
            trimGroup.appendChild(this.ElevatorCursor);
            startPosY += 85;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "FLAPS";
            text.setAttribute("x", (startPosX - 45).toString());
            text.setAttribute("y", startPosY.toString());
            text.setAttribute("fill", "#cccac8");
            text.setAttribute("font-size", "22");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var cursorCenterX = startPosX + 5;
            var cursorCenterY = startPosY - 20;
            this.flapsCursorTransform = "translate (" + cursorCenterX + " " + cursorCenterY + ") scale(0.65)";
            this.FlapsCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.FlapsCursor.setAttribute("transform", this.flapsCursorTransform + " rotate(0)");
            this.FlapsCursor.setAttribute("fill", "white");
            this.FlapsCursor.setAttribute("d", "M0 0 M-10 10 q-10 -10 0 -20 l70 7 q3 3 0 6 l-70 7 Z");
            trimGroup.appendChild(this.FlapsCursor);
            var flapAngles = [0, 25, 60];
            var flapTexts = ["0", "15", "35"];
            for (var i = 0; i < flapAngles.length; i++) {
                var radians = flapAngles[i] * Math.PI / 180;
                var startX = cursorCenterX + Math.cos(radians) * 45;
                var startY = cursorCenterY + Math.sin(radians) * 45;
                var endX = cursorCenterX + Math.cos(radians) * 60;
                var endY = cursorCenterY + Math.sin(radians) * 60;
                var textX = cursorCenterX + Math.cos(radians) * 72;
                var textY = cursorCenterY + Math.sin(radians) * 72;
                var line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("x1", startX.toString());
                line.setAttribute("y1", startY.toString());
                line.setAttribute("x2", endX.toString());
                line.setAttribute("y2", endY.toString());
                line.setAttribute("stroke", "#52504d");
                line.setAttribute("stroke-width", "2");
                trimGroup.appendChild(line);
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = flapTexts[i];
                text.setAttribute("x", textX.toString());
                text.setAttribute("y", textY.toString());
                text.setAttribute("fill", "#cccac8");
                text.setAttribute("font-size", "22");
                text.setAttribute("font-family", "Roboto-Light");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                trimGroup.appendChild(text);
            }
        }

        startPosY = 100;

        // engine modes
        this.N1ModeLeft = document.createElementNS(Avionics.SVG.NS, "text");
        this.N1ModeLeft.textContent = "TO";
        this.N1ModeLeft.setAttribute("x", 100);
        this.N1ModeLeft.setAttribute("y", startPosY);
        this.N1ModeLeft.setAttribute("fill", "#cccac8");
        this.N1ModeLeft.setAttribute("font-size", "24");
        this.N1ModeLeft.setAttribute("writing-mode", "tb-rl");
        this.N1ModeLeft.setAttribute("glyph-orientation-vertical", "0");
        this.N1ModeLeft.setAttribute("font-family", "Roboto-Bold");
        n1Group.appendChild(this.N1ModeLeft);

        this.N1ModeRight = document.createElementNS(Avionics.SVG.NS, "text");
        this.N1ModeRight.textContent = "TO";
        this.N1ModeRight.setAttribute("x", 180);
        this.N1ModeRight.setAttribute("y", startPosY);
        this.N1ModeRight.setAttribute("fill", "#cccac8");
        this.N1ModeRight.setAttribute("font-size", "24");
        this.N1ModeRight.setAttribute("writing-mode", "tb-rl");
        this.N1ModeRight.setAttribute("glyph-orientation-vertical", "0");
        this.N1ModeRight.setAttribute("font-family", "Roboto-Bold");
        n1Group.appendChild(this.N1ModeRight);
    }
    onUpdate(_deltaTime) {
        if (!this.root)
            return;
        this.updateN1();
        this.updateN2();
        this.updateITT();
        this.updateIGN();
        this.updateOil();
        this.updateFuel();
        this.updateFlaps();
        this.updateTrims();
    }
    onExit() {
    }
    onEvent(_event) {
    }
    updateN1() {
        {
            // update thrust setting
            let throttleModeArr = [SimVar.GetSimVarValue("L:THROTTLE1_MODE", "number"), SimVar.GetSimVarValue("L:THROTTLE2_MODE", "number")];
            let onGround = SimVar.GetSimVarValue("SIM ON GROUND", "boolean");

            for (let i = 0; i < throttleModeArr.length; i++) {
                let throttleMode = throttleModeArr[i];

                let thrustSetting = "TO";
                let modeClr = "#11d011";

                if (throttleMode < 3 && onGround) {
                    throttleMode = 0;
                } else if (throttleMode == 0 && !onGround) {
                    throttleMode = 1;
                }

                switch (throttleMode) {
                    case 0:
                        modeClr = "#cccac8";
                        break;
                    case 1:
                        thrustSetting = "CRU";
                        break;
                    case 2:
                        thrustSetting = "CLB";
                        break;
                    case 3:
                        thrustSetting = "TO";
                        break;
                    default:
                        break;
                }

                if (i == 0) {
                    this.N1ModeLeft.textContent = thrustSetting;
                    this.N1ModeLeft.setAttribute("fill", modeClr);

                } else {
                    this.N1ModeRight.textContent = thrustSetting;
                    this.N1ModeRight.setAttribute("fill", modeClr);
                }
            }

        }
        {
            let N1Eng1 = SimVar.GetSimVarValue("TURB ENG CORRECTED N1:1", "percent");
            let n1_y = this.N1ToPixels(N1Eng1);
            if ((this.N1LeftZoneY1 - n1_y) > 10)
                this.N1LeftCursor.setAttribute("d", "M" + (this.N1LeftZoneX - 1) + " " + n1_y + " l-10 0 l0 " + (this.N1LeftZoneY1 - n1_y) + " l5 0 l0 " + -(this.N1LeftZoneY1 - n1_y - 8) + " Z");
            else
                this.N1LeftCursor.setAttribute("d", "");
            this.N1LeftValue.textContent = N1Eng1.toFixed(1);
        }
        {
            let N1Eng2 = SimVar.GetSimVarValue("TURB ENG CORRECTED N1:2", "percent");
            let n1_y = this.N1ToPixels(N1Eng2);
            if ((this.N1LeftZoneY1 - n1_y) > 10)
                this.N1RightCursor.setAttribute("d", "M" + (this.N1RightZoneX + 1) + " " + n1_y + " l10 0 l0 " + (this.N1RightZoneY1 - n1_y) + " l-5 0 l0 " + -(this.N1RightZoneY1 - n1_y - 8) + " Z");
            else
                this.N1RightCursor.setAttribute("d", "");
            this.N1RightValue.textContent = N1Eng2.toFixed(1);
        }
    }
    updateITT() {
        {
            let ITTEng1 = SimVar.GetSimVarValue("TURB ENG1 ITT", "celsius");
            let itt_y = this.ITTToPixels(ITTEng1);
            if ((this.ITTLeftZoneY1 - itt_y) > 10)
                this.ITTLeftCursor.setAttribute("d", "M" + (this.ITTLeftZoneX - 1) + " " + itt_y + " l-10 0 l0 " + (this.ITTLeftZoneY1 - itt_y) + " l5 0 l0 " + -(this.ITTLeftZoneY1 - itt_y - 8) + " Z");
            else
                this.ITTLeftCursor.setAttribute("d", "");
            let startValue = 825;
            let endValue = (ITTEng1 > 200) ? ((this.isMinimized) ? this.ITT_Table_Values_Minimized[this.ITT_Table_Values_Minimized.length - 1] : this.ITT_Table_Values[this.ITT_Table_Values.length - 1]) : 850;
            let beacon_y1 = this.ITTToPixels(startValue);
            let beacon_y2 = this.ITTToPixels(endValue);
            this.ITTLeftBeacon.setAttribute("y", beacon_y2.toString());
            this.ITTLeftBeacon.setAttribute("height", (beacon_y1 - beacon_y2).toString());
        }
        {
            let ITTEng2 = SimVar.GetSimVarValue("TURB ENG2 ITT", "celsius");
            let itt_y = this.ITTToPixels(ITTEng2);
            if ((this.ITTLeftZoneY1 - itt_y) > 10)
                this.ITTRightCursor.setAttribute("d", "M" + (this.ITTRightZoneX + 1) + " " + itt_y + " l10 0 l0 " + (this.ITTRightZoneY1 - itt_y) + " l-5 0 l0 " + -(this.ITTRightZoneY1 - itt_y - 8) + " Z");
            else
                this.ITTRightCursor.setAttribute("d", "");
            let startValue = 825;
            let endValue = (ITTEng2 > 200) ? (this.isMinimized) ? this.ITT_Table_Values_Minimized[this.ITT_Table_Values_Minimized.length - 1] : this.ITT_Table_Values[this.ITT_Table_Values.length - 1] : 850;
            let beacon_y1 = this.ITTToPixels(startValue);
            let beacon_y2 = this.ITTToPixels(endValue);
            this.ITTRightBeacon.setAttribute("y", beacon_y2.toString());
            this.ITTRightBeacon.setAttribute("height", (beacon_y1 - beacon_y2).toString());
        }
    }
    updateIGN() {
        let ignLeft = ((SimVar.GetSimVarValue("GENERAL ENG STARTER:1", "number") == 1) && (SimVar.GetSimVarValue("GENERAL ENG COMBUSTION:1", "number") == 1));
        let ignRight = ((SimVar.GetSimVarValue("GENERAL ENG STARTER:2", "number") == 1) && (SimVar.GetSimVarValue("GENERAL ENG COMBUSTION:2", "number") == 1));

        this.IgnLeft.setAttribute("visibility", ignLeft ? "visible" : "hidden");
        this.IgnRight.setAttribute("visibility", ignRight ? "visible" : "hidden");
    }
    updateN2() {
        {
            let N2Eng1 = SimVar.GetSimVarValue("TURB ENG CORRECTED N2:1", "percent");
            this.N2LeftValue.textContent = N2Eng1.toFixed(1);
        }
        {
            let N2Eng2 = SimVar.GetSimVarValue("TURB ENG CORRECTED N2:2", "percent");
            this.N2RightValue.textContent = N2Eng2.toFixed(1);
        }
    }
    updateOil() {
        {
            let PSIEng1 = SimVar.GetSimVarValue("ENG OIL PRESSURE:1", "psi");
            this.OilPSI1Value.textContent = Math.round(PSIEng1).toString();
            let PSIPct1 = (PSIEng1 / this.OilPSIMax);
            let psi_y = this.OilPSI1CursorY1 + (this.OilPSI1CursorY2 - this.OilPSI1CursorY1) * PSIPct1;
            this.OilPSI1Cursor.setAttribute("transform", "translate (" + this.OilPSI1CursorX + " " + psi_y + ")");
            let TempEng1 = SimVar.GetSimVarValue("ENG OIL TEMPERATURE:1", "celsius");
            this.OilTemp1Value.textContent = Math.round(TempEng1).toString();
            let TempPct1 = (TempEng1 / this.OilTempMax);
            let temp_y = this.OilTemp1CursorY1 + (this.OilTemp1CursorY2 - this.OilTemp1CursorY1) * TempPct1;
            this.OilTemp1Cursor.setAttribute("transform", "translate (" + this.OilTemp1CursorX + " " + temp_y + ")");
        }
        {
            let PSIEng2 = SimVar.GetSimVarValue("ENG OIL PRESSURE:2", "psi");
            this.OilPSI2Value.textContent = Math.round(PSIEng2).toString();
            let PSIPct2 = (PSIEng2 / this.OilPSIMax);
            let psi_y = this.OilPSI2CursorY1 + (this.OilPSI2CursorY2 - this.OilPSI2CursorY1) * PSIPct2;
            this.OilPSI2Cursor.setAttribute("transform", "translate (" + (this.OilPSI2CursorX + 7) + " " + psi_y + ")");
            let TempEng2 = SimVar.GetSimVarValue("ENG OIL TEMPERATURE:2", "celsius");
            this.OilTemp2Value.textContent = Math.round(TempEng2).toString();
            let TempPct2 = (TempEng2 / this.OilTempMax);
            let temp_y = this.OilTemp2CursorY1 + (this.OilTemp2CursorY2 - this.OilTemp2CursorY1) * TempPct2;
            this.OilTemp2Cursor.setAttribute("transform", "translate (" + (this.OilTemp2CursorX + 7) + " " + temp_y + ")");
        }
    }
    updateFuel() {
        let gallonToLBS = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "lbs");
        {
            let LBSEng1 = WT_ConvertUnit.getWeight(SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "gallons") * gallonToLBS).Value;
            this.FuelLBSLeftValue.textContent = Math.round(LBSEng1).toString();
            let PPHEng1 = WT_ConvertUnit.getFuelFlow(SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:1", "Pounds per hour")).Value;
            this.FuelPPHLeftValue.textContent = Math.round(PPHEng1).toString();
            this.FuelTempLeftValue.textContent = "--";
        }
        {
            let LBSEng2 = WT_ConvertUnit.getWeight(SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "gallons") * gallonToLBS).Value;
            this.FuelLBSRightValue.textContent = Math.round(LBSEng2).toString();
            let PPHEng2 = WT_ConvertUnit.getFuelFlow(SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:2", "Pounds per hour")).Value;
            this.FuelPPHRightValue.textContent = Math.round(PPHEng2).toString();
            this.FuelTempRightValue.textContent = "--";
        }
    }
    updateTrims() {
        let AilPct = (SimVar.GetSimVarValue("AILERON TRIM PCT", "percent over 100") + 1.0) * 0.5;
        let ail_x = this.AileronCursorX1 + (this.AileronCursorX2 - this.AileronCursorX1) * AilPct;
        this.AileronCursor.setAttribute("transform", "translate (" + ail_x + " " + this.AileronCursorY + ")");
        let RudPct = (SimVar.GetSimVarValue("RUDDER TRIM PCT", "percent over 100") + 1.0) * 0.5;
        let rud_x = this.RudderCursorX1 + (this.RudderCursorX2 - this.RudderCursorX1) * RudPct;
        this.RudderCursor.setAttribute("transform", "translate (" + rud_x + " " + this.RudderCursorY + ")");
        let ElevPct = (SimVar.GetSimVarValue("ELEVATOR TRIM PCT", "percent over 100") + 1.0) * 0.5;
        let elev_y = this.ElevatorCursorY1 + (this.ElevatorCursorY2 - this.ElevatorCursorY1) * ElevPct;
        this.ElevatorCursor.setAttribute("transform", "translate (" + this.ElevatorCursorX + " " + elev_y + ")");
    }
    updateFlaps() {
        let FlapsPct = SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT ANGLE", "degrees");
        var angle = this.SourceToTarget(FlapsPct, this.Flaps_Table_Values, this.Flaps_Table_Angles);
        this.FlapsCursor.setAttribute("transform", this.flapsCursorTransform + " rotate(" + angle + ")");
    }
    N1ToPixels(_value) {
        var percent;
        if (this.isMinimized)
            percent = this.SourceToTarget(_value, this.N1_Table_Values_Minimized, this.N1_Table_Percents_Minimized);
        else
            percent = this.SourceToTarget(_value, this.N1_Table_Values, this.N1_Table_Percents);
        percent /= 100;
        let pixels = this.N1LeftZoneY1 + (this.N1LeftZoneY2 - this.N1LeftZoneY1) * percent;
        return pixels;
    }
    ITTToPixels(_value) {
        var percent;
        if (this.isMinimized)
            percent = this.SourceToTarget(_value, this.ITT_Table_Values_Minimized, this.ITT_Table_Percents_Minimized);
        else
            percent = this.SourceToTarget(_value, this.ITT_Table_Values, this.ITT_Table_Percents);
        percent /= 100;
        let pixels = this.ITTLeftZoneY1 + (this.ITTLeftZoneY2 - this.ITTLeftZoneY1) * percent;
        return pixels;
    }
    SourceToTarget(_value, _allSources, _allTargets) {
        let target = 0.0;
        if (_value <= _allSources[0])
            target = _allTargets[0];
        else if (_value >= _allSources[_allSources.length - 1])
            target = _allTargets[_allTargets.length - 1];
        else {
            for (var i = 0; i < _allSources.length - 1; i++) {
                if (_value >= _allSources[i] && _value < _allSources[i + 1]) {
                    let percent = (_value - _allSources[i]) / (_allSources[i + 1] - _allSources[i]);
                    target = _allTargets[i] + (_allTargets[i + 1] - _allTargets[i]) * percent;
                    break;
                }
            }
        }
        return target;
    }
}
class CJ4_SystemElectrics extends NavSystemElement {
    init(_root) {
        this.root = _root.querySelector(".SystemElectrics");
        this.constructSVG();
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (!this.root)
            return;
        let GenAmp1 = SimVar.GetSimVarValue("ELECTRICAL GENALT BUS AMPS:1", "amperes");
        this.DCAmpValueLeft.textContent = Math.round(GenAmp1).toString();
        let GenAmp2 = SimVar.GetSimVarValue("ELECTRICAL GENALT BUS AMPS:2", "amperes");
        this.DCAmpValueRight.textContent = Math.round(GenAmp2).toString();
        let GenVolt1 = SimVar.GetSimVarValue("ELECTRICAL GENALT BUS VOLTAGE:1", "volts");
        this.DCVoltValueLeft.textContent = Math.round(GenVolt1).toString();
        let GenVolt2 = SimVar.GetSimVarValue("ELECTRICAL GENALT BUS VOLTAGE:2", "volts");
        this.DCVoltValueRight.textContent = Math.round(GenVolt2).toString();
        let BatVolt = SimVar.GetSimVarValue("ELECTRICAL BATTERY VOLTAGE:1", "volts");
        this.BATVoltValue.textContent = Math.round(BatVolt).toString();
        let BatAmp = SimVar.GetSimVarValue("ELECTRICAL BATTERY LOAD:1", "amperes");
        BatAmp = BatAmp / BatVolt;
        this.BATAmpValue.textContent = Math.round(BatAmp).toString();
        this.BATTempValue.textContent = "26";

        let N2Eng1 = SimVar.GetSimVarValue("ENG N2 RPM:1", "percent");
        let HydPSI1 = N2Eng1 >= 20 ? 3000 : N2Eng1 * 150;
        this.HYDPSIValueLeft.textContent = Math.round(HydPSI1).toString();

        let N2Eng2 = SimVar.GetSimVarValue("ENG N2 RPM:2", "percent");
        let HydPSI2 = N2Eng2 >= 20 ? 3000 : N2Eng2 * 150;
        this.HYDPSIValueRight.textContent = Math.round(HydPSI2).toString();

        let PPHEng1 = SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:1", "Pounds per hour");
        this.FUELPPHValueLeft.textContent = Math.round(WT_ConvertUnit.getFuelFlow(PPHEng1).Value);
        let PPHEng2 = SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:2", "Pounds per hour");
        this.FUELPPHValueRight.textContent = Math.round(WT_ConvertUnit.getFuelFlow(PPHEng2).Value);

        this.FUELTempValueLeft.textContent = "--";
        this.FUELTempValueRight.textContent = "--";
    }
    onExit() {
    }
    onEvent(_event) {
    }
    constructSVG() {
        if (!this.root)
            return;
        Utils.RemoveAllChildren(this.root);
        var rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        rootSVG.setAttribute("id", "Standard");
        rootSVG.setAttribute("viewBox", "0 0 1000 1000");
        this.root.appendChild(rootSVG);
        {
            var dcGroup = document.createElementNS(Avionics.SVG.NS, "g");
            dcGroup.setAttribute("id", "dcGroup");
            rootSVG.appendChild(dcGroup);
            var startPosX = 155;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "DC ELEC";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "22");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 110).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 50).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "#52504d");
            lineLeft.setAttribute("stroke-width", "2");
            dcGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 50).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 110).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "#52504d");
            lineLeft.setAttribute("stroke-width", "2");
            dcGroup.appendChild(lineLeft);
            var rectMarginX = 40;
            var rectWidth = 60;
            var rectHeight = 30;
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "AMP";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "22");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(titleText);
            this.DCAmpValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.DCAmpValueLeft.textContent = "0";
            this.DCAmpValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.3).toString());
            this.DCAmpValueLeft.setAttribute("y", startPosY.toString());
            this.DCAmpValueLeft.setAttribute("fill", "#11d011");
            this.DCAmpValueLeft.setAttribute("font-size", "26");
            this.DCAmpValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.DCAmpValueLeft.setAttribute("text-anchor", "end");
            this.DCAmpValueLeft.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(this.DCAmpValueLeft);
            this.DCAmpValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.DCAmpValueRight.textContent = "0";
            this.DCAmpValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.DCAmpValueRight.setAttribute("y", startPosY.toString());
            this.DCAmpValueRight.setAttribute("fill", "#11d011");
            this.DCAmpValueRight.setAttribute("font-size", "26");
            this.DCAmpValueRight.setAttribute("font-family", "Roboto-Bold");
            this.DCAmpValueRight.setAttribute("text-anchor", "end");
            this.DCAmpValueRight.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(this.DCAmpValueRight);
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "VOLT";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "22");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(titleText);
            this.DCVoltValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.DCVoltValueLeft.textContent = "0";
            this.DCVoltValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.3).toString());
            this.DCVoltValueLeft.setAttribute("y", startPosY.toString());
            this.DCVoltValueLeft.setAttribute("fill", "#11d011");
            this.DCVoltValueLeft.setAttribute("font-size", "26");
            this.DCVoltValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.DCVoltValueLeft.setAttribute("text-anchor", "end");
            this.DCVoltValueLeft.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(this.DCVoltValueLeft);
            this.DCVoltValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.DCVoltValueRight.textContent = "0";
            this.DCVoltValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.DCVoltValueRight.setAttribute("y", startPosY.toString());
            this.DCVoltValueRight.setAttribute("fill", "#11d011");
            this.DCVoltValueRight.setAttribute("font-size", "26");
            this.DCVoltValueRight.setAttribute("font-family", "Roboto-Bold");
            this.DCVoltValueRight.setAttribute("text-anchor", "end");
            this.DCVoltValueRight.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(this.DCVoltValueRight);
        }
        {
            var batteryGroup = document.createElementNS(Avionics.SVG.NS, "g");
            batteryGroup.setAttribute("id", "batteryGroup");
            rootSVG.appendChild(batteryGroup);
            var startPosX = 400;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "BATT";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "22");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 110).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 40).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "#52504d");
            lineLeft.setAttribute("stroke-width", "2");
            batteryGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 40).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 110).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "#52504d");
            lineLeft.setAttribute("stroke-width", "2");
            batteryGroup.appendChild(lineLeft);
            var rectMarginX = 40;
            var rectWidth = 60;
            var rectHeight = 30;
            startPosX -= 35;
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "AMP";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "22");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(titleText);
            this.BATAmpValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.BATAmpValue.textContent = "-7";
            this.BATAmpValue.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.BATAmpValue.setAttribute("y", startPosY.toString());
            this.BATAmpValue.setAttribute("fill", "#11d011");
            this.BATAmpValue.setAttribute("font-size", "26");
            this.BATAmpValue.setAttribute("font-family", "Roboto-Bold");
            this.BATAmpValue.setAttribute("text-anchor", "end");
            this.BATAmpValue.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(this.BATAmpValue);
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "VOLT";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "22");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(titleText);
            this.BATVoltValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.BATVoltValue.textContent = "24";
            this.BATVoltValue.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.BATVoltValue.setAttribute("y", startPosY.toString());
            this.BATVoltValue.setAttribute("fill", "#11d011");
            this.BATVoltValue.setAttribute("font-size", "26");
            this.BATVoltValue.setAttribute("font-family", "Roboto-Bold");
            this.BATVoltValue.setAttribute("text-anchor", "end");
            this.BATVoltValue.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(this.BATVoltValue);
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "TEMP °C";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "22");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(titleText);
            this.BATTempValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.BATTempValue.textContent = "0";
            this.BATTempValue.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.BATTempValue.setAttribute("y", startPosY.toString());
            this.BATTempValue.setAttribute("fill", "#11d011");
            this.BATTempValue.setAttribute("font-size", "26");
            this.BATTempValue.setAttribute("font-family", "Roboto-Bold");
            this.BATTempValue.setAttribute("text-anchor", "end");
            this.BATTempValue.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(this.BATTempValue);
        }
        {
            var oxyGroup = document.createElementNS(Avionics.SVG.NS, "g");
            oxyGroup.setAttribute("id", "oxyGroup");
            rootSVG.appendChild(oxyGroup);
            var startPosX = 620;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "OXY PSI";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "22");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            oxyGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 80).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 50).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "#52504d");
            lineLeft.setAttribute("stroke-width", "2");
            oxyGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 50).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 80).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "#52504d");
            lineLeft.setAttribute("stroke-width", "2");
            oxyGroup.appendChild(lineLeft);
            var gaugeStartX = startPosX + 20;
            var gaugeStartY = startPosY + 25;
            var gaugeWidth = 12;
            var gaugeHeight = 125;
            this.OXYCursorX = gaugeStartX + gaugeWidth;
            //this.OXYCursorY1 = gaugeStartY + gaugeHeight;
            this.OXYCursorY1 = 86;
            this.OXYCursorY2 = gaugeStartY;
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", gaugeStartX.toString());
            rect.setAttribute("y", gaugeStartY.toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", (gaugeHeight * 0.75).toString());
            rect.setAttribute("fill", "#11d011");
            oxyGroup.appendChild(rect);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", gaugeStartX.toString());
            rect.setAttribute("y", (gaugeStartY + gaugeHeight * 0.75).toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", (gaugeHeight * 0.25).toString());
            rect.setAttribute("fill", "darkorange");
            oxyGroup.appendChild(rect);
            var gradTexts = ["2400", "", "1200", "", "0"];
            var gradPercents = [0.0, 0.25, 0.5, 0.75, 1.0];
            var gradLength = [14, 10, 14, 10, 14];
            for (var i = 0; i < gradPercents.length; i++) {
                var line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("x1", (gaugeStartX - gradLength[i]).toString());
                line.setAttribute("y1", (gaugeStartY + gaugeHeight * gradPercents[i]).toString());
                line.setAttribute("x2", gaugeStartX.toString());
                line.setAttribute("y2", (gaugeStartY + gaugeHeight * gradPercents[i]).toString());
                line.setAttribute("stroke", (i == 4) ? "darkorange" : "#11d011");
                line.setAttribute("stroke-width", "2");
                oxyGroup.appendChild(line);
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = gradTexts[i];
                text.setAttribute("x", (gaugeStartX - gradLength[i] - 10).toString());
                text.setAttribute("y", (gaugeStartY + gaugeHeight * gradPercents[i]).toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", "22");
                text.setAttribute("font-family", "Roboto-Light");
                text.setAttribute("text-anchor", "end");
                text.setAttribute("alignment-baseline", "central");
                oxyGroup.appendChild(text);
            }
            this.OXYCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.OXYCursor.setAttribute("transform", "translate (" + this.OXYCursorX + " " + this.OXYCursorY1 + ")");
            this.OXYCursor.setAttribute("fill", "#11d011");
            this.OXYCursor.setAttribute("d", "M0 0 l15 5 l0 -10 l-15 5 Z");
            oxyGroup.appendChild(this.OXYCursor);
        }
        {
            var hydroGroup = document.createElementNS(Avionics.SVG.NS, "g");
            hydroGroup.setAttribute("id", "HydroGroup");
            rootSVG.appendChild(hydroGroup);
            var startPosX = 840;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "HYD";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "22");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            hydroGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 110).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 40).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "#52504d");
            lineLeft.setAttribute("stroke-width", "2");
            hydroGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 40).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 110).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "#52504d");
            lineLeft.setAttribute("stroke-width", "2");
            hydroGroup.appendChild(lineLeft);
            var rectMarginX = 40;
            var rectWidth = 60;
            var rectHeight = 30;
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "PSI";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "22");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            hydroGroup.appendChild(titleText);
            this.HYDPSIValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.HYDPSIValueLeft.textContent = "0";
            this.HYDPSIValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.HYDPSIValueLeft.setAttribute("y", startPosY.toString());
            this.HYDPSIValueLeft.setAttribute("fill", "#11d011");
            this.HYDPSIValueLeft.setAttribute("font-size", "26");
            this.HYDPSIValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.HYDPSIValueLeft.setAttribute("text-anchor", "end");
            this.HYDPSIValueLeft.setAttribute("alignment-baseline", "central");
            hydroGroup.appendChild(this.HYDPSIValueLeft);
            this.HYDPSIValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.HYDPSIValueRight.textContent = "0";
            this.HYDPSIValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.HYDPSIValueRight.setAttribute("y", startPosY.toString());
            this.HYDPSIValueRight.setAttribute("fill", "#11d011");
            this.HYDPSIValueRight.setAttribute("font-size", "26");
            this.HYDPSIValueRight.setAttribute("font-family", "Roboto-Bold");
            this.HYDPSIValueRight.setAttribute("text-anchor", "end");
            this.HYDPSIValueRight.setAttribute("alignment-baseline", "central");
            hydroGroup.appendChild(this.HYDPSIValueRight);
        }
        {
            var fuelGroup = document.createElementNS(Avionics.SVG.NS, "g");
            fuelGroup.setAttribute("id", "FuelGroup");
            rootSVG.appendChild(fuelGroup);
            var startPosX = 840;
            var startPosY = 110;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "FUEL";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "22");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 110).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 40).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "#52504d");
            lineLeft.setAttribute("stroke-width", "2");
            fuelGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 40).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 110).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "#52504d");
            lineLeft.setAttribute("stroke-width", "2");
            fuelGroup.appendChild(lineLeft);
            var rectMarginX = 40;
            var rectWidth = 60;
            var rectHeight = 30;
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = WT_ConvertUnit.isMetric() ? "KG/H" : "PPH";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "22");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(titleText);
            this.FUELPPHValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.FUELPPHValueLeft.textContent = "0";
            this.FUELPPHValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.FUELPPHValueLeft.setAttribute("y", startPosY.toString());
            this.FUELPPHValueLeft.setAttribute("fill", "#11d011");
            this.FUELPPHValueLeft.setAttribute("font-size", "26");
            this.FUELPPHValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.FUELPPHValueLeft.setAttribute("text-anchor", "end");
            this.FUELPPHValueLeft.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FUELPPHValueLeft);
            this.FUELPPHValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.FUELPPHValueRight.textContent = "0";
            this.FUELPPHValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.FUELPPHValueRight.setAttribute("y", startPosY.toString());
            this.FUELPPHValueRight.setAttribute("fill", "#11d011");
            this.FUELPPHValueRight.setAttribute("font-size", "26");
            this.FUELPPHValueRight.setAttribute("font-family", "Roboto-Bold");
            this.FUELPPHValueRight.setAttribute("text-anchor", "end");
            this.FUELPPHValueRight.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FUELPPHValueRight);
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "°C";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "22");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(titleText);
            this.FUELTempValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.FUELTempValueLeft.textContent = "15";
            this.FUELTempValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.FUELTempValueLeft.setAttribute("y", startPosY.toString());
            this.FUELTempValueLeft.setAttribute("fill", "#11d011");
            this.FUELTempValueLeft.setAttribute("font-size", "26");
            this.FUELTempValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.FUELTempValueLeft.setAttribute("text-anchor", "end");
            this.FUELTempValueLeft.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FUELTempValueLeft);
            this.FUELTempValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.FUELTempValueRight.textContent = "15";
            this.FUELTempValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.FUELTempValueRight.setAttribute("y", startPosY.toString());
            this.FUELTempValueRight.setAttribute("fill", "#11d011");
            this.FUELTempValueRight.setAttribute("font-size", "26");
            this.FUELTempValueRight.setAttribute("font-family", "Roboto-Bold");
            this.FUELTempValueRight.setAttribute("text-anchor", "end");
            this.FUELTempValueRight.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FUELTempValueRight);
        }
    }
}
class CJ4_SystemFMS extends NavSystemElement {
    init(_root) {
        this.root = _root;
        this.previousWaypoint = undefined;
        this._flightPlanUpdateCounter = 0;

        if (!this.root) {
            console.log("Root component expected!");
        }
        else {
            let waypointContainers = this.root.querySelectorAll(".cj4x-navigation-data-row");
            this._previousWaypointContainer = waypointContainers[0];
            this._activeWaypointContainer = waypointContainers[1];
            this._nextWaypointContainer = waypointContainers[2];
            this._destinationWaypointContainer = waypointContainers[3];
        }
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (!this._previousWaypointContainer || !this._activeWaypointContainer || !this._nextWaypointContainer || !this._destinationWaypointContainer) {
            if (!this.isInitialized) {
                this.init();
            }
            return;
        }
        if (this.root.getAttribute("page") === "fms") {
            let flightPlanManager = this.gps.currFlightPlanManager;
            if (flightPlanManager) {
                this._flightPlanUpdateCounter++;
                if (this._flightPlanUpdateCounter > 120) {
                    flightPlanManager.updateFlightPlan();
                    this._flightPlanUpdateCounter = 0;
                }
                if (this._flightPlanUpdateCounter % 20 == 0) {

                    // Grab plane information
                    let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                    let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                    let aircraftPosition = new LatLong(lat, long);
                    let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
                    const FPWaypoints = flightPlanManager.getWaypoints();
                    const UTCTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");

                    if (FPWaypoints) {

                        // Grab waypoints
                        let previousWaypointIndex = flightPlanManager.getActiveWaypointIndex() - 1;
                        let previousWaypoint = flightPlanManager.getWaypoint(previousWaypointIndex);
                        let activeIndex = flightPlanManager.getActiveWaypointIndex();
                        let activeWaypoint = flightPlanManager.getWaypoint(activeIndex);
                        let nextWaypoint = flightPlanManager.getWaypoint(activeIndex + 1);
                        let destination = flightPlanManager.getDestination();

                        if (destination && (!nextWaypoint || (nextWaypoint.ident === destination.ident)))
                            nextWaypoint = flightPlanManager.getWaypoint(activeIndex + 1, NaN, true);

                        // Set ICAOs
                        this._previousWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ident")
                            .textContent = previousWaypoint ? previousWaypoint.ident : "----";
                        this._activeWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ident")
                            .textContent = activeWaypoint && destination && activeWaypoint.ident != destination.ident ? activeWaypoint.ident : "----";
                        this._nextWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ident")
                            .textContent = nextWaypoint && destination && nextWaypoint.ident != destination.ident && nextWaypoint.ident != "USER" ? nextWaypoint.ident : "----";
                        this._destinationWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ident")
                            .textContent = destination ? destination.ident : "----";

                        // Set distances to go
                        let previousWaypointDistanceNumber = previousWaypoint ? Avionics.Utils.computeDistance(aircraftPosition, previousWaypoint.infos.coordinates) : -1;
                        let activeWaypointDistanceNumber = activeWaypoint && destination && activeWaypoint.ident != destination.ident ? Avionics.Utils.computeDistance(aircraftPosition, activeWaypoint.infos.coordinates) : -1;
                        let nextWaypointDistanceNumber = nextWaypoint && destination && nextWaypoint.ident != destination.ident && activeWaypoint ? (activeWaypointDistanceNumber + new Number(Avionics.Utils.computeDistance(activeWaypoint.infos.coordinates, nextWaypoint.infos.coordinates))) : -1;
                        const previousWaypointDistance = previousWaypointDistanceNumber >= 100 ? previousWaypointDistanceNumber.toFixed(0) : previousWaypointDistanceNumber.toFixed(1);
                        const activeWaypointDistance = activeWaypointDistanceNumber >= 100 ? activeWaypointDistanceNumber.toFixed(0) : activeWaypointDistanceNumber.toFixed(1);
                        const nextWaypointDistance = nextWaypointDistanceNumber >= 100 ? nextWaypointDistanceNumber.toFixed(0) : nextWaypointDistanceNumber.toFixed(1);
                        let destinationDistanceNumber = 0;
                        if (destination) {
                            let destinationDistanceDirect = new Number(Avionics.Utils.computeDistance(aircraftPosition, destination.infos.coordinates).toFixed(1));
                            let destinationDistanceFlightplan = 0;
                            destinationDistanceNumber = new Number(destinationDistanceDirect);
                            let destinationCumulativeDistanceInFP = destination.cumulativeDistanceInFP;
                            const approach = flightPlanManager.getApproachWaypoints();
                            if (approach && approach.length > 0) {
                                const allWaypoints = flightPlanManager.getAllWaypoints();
                                const lastApproachIndex = allWaypoints.indexOf(approach[approach.length - 1]);
                                destinationCumulativeDistanceInFP = allWaypoints[lastApproachIndex].cumulativeDistanceInFP;
                            }
                            if (activeWaypoint) {
                                destinationDistanceFlightplan = new Number(destinationCumulativeDistanceInFP - activeWaypoint.cumulativeDistanceInFP + new Number(activeWaypointDistance));
                            }
                            else {
                                destinationDistanceFlightplan = new Number(destinationCumulativeDistanceInFP);
                            }
                            destinationDistanceNumber = destinationDistanceDirect > destinationDistanceFlightplan ? destinationDistanceDirect.toFixed(1)
                                : destinationDistanceFlightplan.toFixed(1);
                        }
                        const destinationDistance = destinationDistanceNumber >= 100 ? Math.trunc(destinationDistanceNumber) : destinationDistanceNumber;

                        this._previousWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-distance")
                            .textContent = previousWaypointDistance != -1 ? previousWaypointDistance + "NM" : "---NM";
                        this._activeWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-distance")
                            .textContent = activeWaypointDistance != -1 ? activeWaypointDistance + "NM" : "---NM";
                        this._nextWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-distance")
                            .textContent = nextWaypointDistance != -1 ? nextWaypointDistance + "NM" : "---NM";
                        this._destinationWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-distance")
                            .textContent = destinationDistance != 0 ? destinationDistance + "NM" : "---NM";

                        // Set ETE
                        let activeWaypointETEValue = "-:--";
                        if (groundSpeed >= 50 && activeWaypointDistance > 0) {
                            activeWaypointETEValue = new Date(this.calcETEseconds(activeWaypointDistance, groundSpeed) * 1000).toISOString().substr(12, 4);
                        }
                        let nextWaypointETEValue = "-:--";
                        if (groundSpeed >= 50 && nextWaypointDistance > 0) {
                            nextWaypointETEValue = new Date(this.calcETEseconds(nextWaypointDistance, groundSpeed) * 1000).toISOString().substr(12, 4);
                        }
                        let destinationWaypointETEValue = "-:--";
                        if (groundSpeed >= 50 && destinationDistance > 0) {
                            destinationWaypointETEValue = new Date(this.calcETEseconds(destinationDistance, groundSpeed) * 1000).toISOString().substr(12, 4);
                        }

                        this._activeWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ete")
                            .textContent = activeWaypointETEValue;

                        this._nextWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ete")
                            .textContent = nextWaypointETEValue;

                        this._destinationWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ete")
                            .textContent = destinationWaypointETEValue;

                        // Set ETA
                        let previousWaypointETAValue;
                        if (previousWaypoint && flightPlanManager.getOrigin() !== undefined && previousWaypoint.ident != flightPlanManager.getOrigin().ident) {
                            if (this.previousWaypoint == undefined || this.previousWaypoint.ident != previousWaypoint.ident) {
                                const seconds = Number.parseInt(UTCTime);
                                previousWaypointETAValue = Utils.SecondsToDisplayTime(seconds, true, false, false);
                                this.previousWaypoint = previousWaypoint;

                                this._previousWaypointContainer
                                    .querySelector(".cj4x-navigation-data-waypoint-eta")
                                    .textContent = previousWaypointETAValue;
                            }
                        }
                        else {
                            this._previousWaypointContainer
                                .querySelector(".cj4x-navigation-data-waypoint-eta")
                                .textContent = "--:--";
                        }


                        let activeWaypointETAValue = "--:--";
                        if (groundSpeed >= 50 && activeWaypointDistance > 0) {
                            const seconds = ((Number.parseInt(UTCTime) + (this.calcETEseconds(activeWaypointDistance, groundSpeed))) % 86400);
                            const time = Utils.SecondsToDisplayTime(seconds, true, false, false);
                            activeWaypointETAValue = time;
                        }

                        let nextWaypointETAValue = "--:--";
                        if (groundSpeed >= 50 && nextWaypointDistance > 0) {
                            const seconds = ((Number.parseInt(UTCTime) + (this.calcETEseconds(nextWaypointDistance, groundSpeed))) % 86400);
                            const time = Utils.SecondsToDisplayTime(seconds, true, false, false);
                            nextWaypointETAValue = time;
                        }

                        let destinationWaypointETAValue = "--:--";
                        if (groundSpeed >= 50 && destinationDistance > 0) {
                            const seconds = ((Number.parseInt(UTCTime) + (this.calcETEseconds(destinationDistance, groundSpeed))) % 86400);
                            const time = Utils.SecondsToDisplayTime(seconds, true, false, false);
                            destinationWaypointETAValue = time;
                        }

                        this._activeWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-eta")
                            .textContent = activeWaypointETAValue;

                        this._nextWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-eta")
                            .textContent = nextWaypointETAValue;

                        this._destinationWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-eta")
                            .textContent = destinationWaypointETAValue;


                        // Set expected fuel and gross weight
                        if (groundSpeed >= 50) {
                            const fuelFlow = SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:1", "Pounds per hour") + SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:2", "Pounds per hour");
                            const expectedFuelUsage = (fuelFlow * (this.calcETEseconds(destinationDistance, groundSpeed) / 3600)).toFixed(0);
                            const currentFuel = (SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "pounds") * SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons")).toFixed(0);
                            const expectedFuelAtDestination = (currentFuel - expectedFuelUsage) < 0 ? 0 : (currentFuel - expectedFuelUsage);
                            const grossWeight = SimVar.GetSimVarValue("TOTAL WEIGHT", "kg") * 2.205;
                            // const oilQuantity = SimVar.GetSimVarValue("OIL AMOUNT", "pounds")
                            const expectedGrossWeight = expectedFuelAtDestination == 0 ? (grossWeight / 1000) : ((grossWeight - expectedFuelUsage) / 1000);

                            const exfuelValue = WT_ConvertUnit.getWeight(expectedFuelAtDestination);
                            const weightsTextContent = `${exfuelValue.Value.toFixed(0)} ${exfuelValue.Unit} ${WT_ConvertUnit.getWeight(expectedGrossWeight).Value.toFixed(1)} GW`;

                            this._destinationWaypointContainer
                                .querySelector(".cj4x-navigation-data-waypoint-expected-fuel")
                                .textContent = weightsTextContent;

                        }

                        if (activeWaypoint && destination) {
                            if (destination.ident == activeWaypoint.ident) {
                                this._destinationWaypointContainer
                                    .setAttribute("style", "color: magenta");
                                this._activeWaypointContainer
                                    .setAttribute("style", "color: white");
                            }
                            else {
                                this._destinationWaypointContainer
                                    .setAttribute("style", "color: white");
                                this._activeWaypointContainer
                                    .setAttribute("style", "color: magenta");
                            }
                        }
                        
                        // VNAV WINDOW
                        //
                       /*  let todDistance = 0;
                        let timeToTOD = 0;
                        let descentAngle = 0;
                        let descentRate = 0;
                        let constraintName = "";
                        let fptaConstraint = "";
                        let fptaDistance = 0;
                        let fptaTime = 0; */
                        
                        const data = JSON.parse(localStorage.getItem("VNAVWINDOWDATA"));
                        let todDistance = data.toddistance.toFixed(1);
                        let timeToTOD = new Date(this.calcETEseconds(todDistance, groundSpeed) * 1000).toISOString().substr(12, 4);
                        let descentAngle = data.fpa;
                        let descentRate = data.descentrate;
                        let constraintName = data.fptaname;
                        let fptaConstraint = data.fptaconstraint ? data.fptaconstraint : 0;
                        let fptaDistance = data.fptaDistance.toFixed(1);
                        let fptaTime = new Date(this.calcETEseconds(fptaDistance, groundSpeed) * 1000).toISOString().substr(12, 4);

                        let todText = "TOD";
                        let fpmText = "FPM";
                        let nmText = "NM";
                        let slashText = "/";
                        console.log("TOD " + todDistance);
                        if (todDistance < .1) {
                            todText = "";
                            todDistance = "";
                            timeToTOD = "";
                            nmText = "";
                            slashText = "";
                        } else {
                            todText = "TOD";
                            nmText = "NM";
                            slashText = "/";
                        }

                        if (descentAngle === 0) {
                            descentAngle = 0;
                        } else {
                            descentAngle = descentAngle.toFixed(1) + String.fromCharCode(176);
                        }

                        if (descentRate === 0) {
                            descentRate = "";
                            fpmText = "";
                        } else{
                            fpmText = "FPM";
                        }

                        if (fptaDistance === 0) {
                            fptaDistance = 0;
                            fptaTime = 0;
                            nmText = "";
                            slashText = "";
                        } else {
                            nmText = "NM";
                            slashText = "/";
                        }

                        this._previousWaypointContainer // PREVIOUS ETA SHOULD BE  BLANK
                        .querySelector(".cj4x-navigation-data-waypoint-eta")
                        .textContent = "";
                        
                        const vnavTODorDirect = this._activeWaypointContainer.querySelector(".cj4x-navigation-data-waypoint-eta");
                            vnavTODorDirect.textContent = ""; //DIRECT would go here, do it later
                            vnavTODorDirect.setAttribute("style", "color: #11d011");

                        const vnavFix = this._nextWaypointContainer.querySelector(".cj4x-navigation-data-waypoint-eta");
                            vnavFix.textContent = constraintName;
                            vnavFix.setAttribute("style", "color: #11d011");

                        this._destinationWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-eta")
                            .textContent = "";

                        const vnavFixETADist = this._destinationWaypointContainer.querySelector(".cj4x-navigation-data-waypoint-expected-fuel");
                            vnavFixETADist.textContent = fptaTime + slashText + fptaDistance + nmText;
                            vnavFixETADist.setAttribute("style", "color: #11d011");

                        const vnavFixConstraint = this._nextWaypointContainer.querySelector(".cj4x-navigation-data-vnav-constraint");
                            vnavFixConstraint.textContent = fptaConstraint;
                            vnavFixConstraint.setAttribute("style", "color: #11d011");

                        const vnavFixAngleRate = this._activeWaypointContainer.querySelector(".cj4x-navigation-data-vnav-angle-descent-rate");
                            vnavFixAngleRate.textContent = descentAngle + String.fromCharCode(2) + String.fromCharCode(2) + descentRate + fpmText;
                            vnavFixAngleRate.setAttribute("style", "color: #11d011");

                        const vnavAdvisoryDescent = this._previousWaypointContainer.querySelector(".cj4x-navigation-data-waypoint-eta");
                            vnavAdvisoryDescent.textContent = todText;
                            vnavAdvisoryDescent.setAttribute("style", "color: #11d011");

                        const vnavAdvisoryDescentTimeDistance = this._previousWaypointContainer.querySelector(".cj4x-navigation-data-vnav-advisory-time-distance");
                            vnavAdvisoryDescentTimeDistance.textContent = timeToTOD + slashText + todDistance + nmText;
                            vnavAdvisoryDescentTimeDistance.setAttribute("style", "color: #11d011");
                        



                    }
                }
            }
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    calcETEseconds(distance, currentGroundSpeed) {
        return (distance / currentGroundSpeed) * 3600;
    }
}
class CJ4_SystemAnnunciations extends Cabin_Annunciations {
    constructor() {
        super();
        this.rootElementName = "";
        this.warningToneNameZ = new Name_Z("WT_tone_warning");
        this.cautionToneNameZ = new Name_Z("WT_tone_caution");
    }
    init(_root) {
        super.init(_root);
        this.annunciations = _root.querySelector(".SystemAnnunciations");
    }

    onUpdate(_deltaTime) {
        if (!this.annunciations)
            return;

        for (var i = 0; i < this.allMessages.length; i++) {
            var message = this.allMessages[i];
            var value = false;
            if (message.Handler)
                value = message.Handler() != 0;
            if (value != message.Visible) {
                this.needReload = true;
                message.Visible = value;
                message.Acknowledged = (this.gps.getTimeSinceStart() < 10000 && !this.offStart);
                if (value) {
                    switch (message.Type) {
                        case Annunciation_MessageType.WARNING:
                            this.displayWarning.push(message);
                            break;
                        case Annunciation_MessageType.CAUTION:
                            this.displayCaution.push(message);
                            if (!message.Acknowledged && !this.isPlayingWarningTone && this.gps.isPrimary) {
                                let res = this.gps.playInstrumentSound("WT_tone_caution");
                                if (res)
                                    this.isPlayingWarningTone = true;
                            }
                            break;
                        case Annunciation_MessageType.ADVISORY:
                            this.displayAdvisory.push(message);
                            break;
                    }
                }
                else {
                    switch (message.Type) {
                        case Annunciation_MessageType.WARNING:
                            for (let i = 0; i < this.displayWarning.length; i++) {
                                if (this.displayWarning[i].Text == message.Text) {
                                    this.displayWarning.splice(i, 1);
                                    break;
                                }
                            }
                            break;
                        case Annunciation_MessageType.CAUTION:
                            for (let i = 0; i < this.displayCaution.length; i++) {
                                if (this.displayCaution[i].Text == message.Text) {
                                    this.displayCaution.splice(i, 1);
                                    break;
                                }
                            }
                            break;
                        case Annunciation_MessageType.ADVISORY:
                            for (let i = 0; i < this.displayAdvisory.length; i++) {
                                if (this.displayAdvisory[i].Text == message.Text) {
                                    this.displayAdvisory.splice(i, 1);
                                    break;
                                }
                            }
                            break;
                    }
                }
            }
        }
        if (this.annunciations)
            this.annunciations.setAttribute("state", this.gps.blinkGetState(800, 400) ? "Blink" : "None");
        if (this.needReload) {
            let warningOn = 0;
            let cautionOn = 0;
            let messages = "";
            for (let i = this.displayWarning.length - 1; i >= 0; i--) {
                messages += '<div class="Warning';
                if (!this.displayWarning[i].Acknowledged) {
                    messages += '_Blink';
                    warningOn = 1;
                }
                messages += '">' + this.displayWarning[i].Text + "</div>";
            }
            for (let i = this.displayCaution.length - 1; i >= 0; i--) {
                messages += '<div class="Caution';
                if (!this.displayCaution[i].Acknowledged) {
                    messages += '_Blink';
                    cautionOn = 1;
                }
                messages += '">' + this.displayCaution[i].Text + "</div>";
            }
            for (let i = this.displayAdvisory.length - 1; i >= 0; i--) {
                messages += '<div class="Advisory">' + this.displayAdvisory[i].Text + "</div>";
            }
            this.warningTone = warningOn > 0;
            if (this.gps.isPrimary) {
                SimVar.SetSimVarValue("L:Generic_Master_Warning_Active", "Bool", warningOn);
                SimVar.SetSimVarValue("L:Generic_Master_Caution_Active", "Bool", cautionOn);
            }
            if (this.annunciations)
                this.annunciations.innerHTML = messages;
            this.needReload = false;
        }
        if (this.warningTone && !this.isPlayingWarningTone && this.gps.isPrimary) {
            let res = this.gps.playInstrumentSound("WT_tone_warning");
            if (res)
                this.isPlayingWarningTone = true;
        }
    }
}
class CJ4_SystemWarnings extends Cabin_Warnings {
    init(_root) {
        super.init(_root);
        this.warningBox = _root.querySelector(".SystemWarnings");
        if (this.warningBox)
            this.warningContent = this.warningBox.querySelector("#Content");
    }
    onUpdate(_dTime) {
        if (!this.warningBox)
            return;
        super.onUpdate(_dTime);
    }
}
var CJ4_MapSymbol;
(function (CJ4_MapSymbol) {
    CJ4_MapSymbol[CJ4_MapSymbol["TRAFFIC"] = 0] = "TRAFFIC";
    CJ4_MapSymbol[CJ4_MapSymbol["CONSTRAINTS"] = 1] = "CONSTRAINTS";
    CJ4_MapSymbol[CJ4_MapSymbol["AIRSPACES"] = 2] = "AIRSPACES";
    CJ4_MapSymbol[CJ4_MapSymbol["AIRWAYS"] = 3] = "AIRWAYS";
    CJ4_MapSymbol[CJ4_MapSymbol["AIRPORTS"] = 4] = "AIRPORTS";
    CJ4_MapSymbol[CJ4_MapSymbol["INTERSECTS"] = 5] = "INTERSECTS";
    CJ4_MapSymbol[CJ4_MapSymbol["NAVAIDS"] = 6] = "NAVAIDS";
    CJ4_MapSymbol[CJ4_MapSymbol["NDBS"] = 7] = "NDBS";
    CJ4_MapSymbol[CJ4_MapSymbol["TERMWPTS"] = 8] = "TERMWPTS";
})(CJ4_MapSymbol || (CJ4_MapSymbol = {}));
class CJ4_MapContainer extends NavSystemElementContainer {
    constructor(_name, _root) {
        super(_name, _root, null);
        this.map = new CJ4_Map();
        this.isMapVisible = undefined;
        this.isRouteVisible = undefined;
        this.isTerrainVisible = undefined;
        this.isWeatherVisible = undefined;
        this.isGwxVisible = undefined;
        this.isExtended = undefined;
        this.zoomRanges = [5, 10, 25, 50, 100, 200, 300, 600];
        this.zoomFactor = 1.0;
        this.symbols = -1;
        this.symbolsToSimvar = false;
        this.element = new NavSystemElementGroup([this.map]);
    }
    init() {
        super.init();
        this.root = this.gps.getChildById(this.htmlElemId);
        if (!this.root) {
            console.log("Root component expected!");
        }
        this.map.instrument.showRoads = false;
        this.map.instrument.showObstacles = false;
        this.map.instrument.showVORs = false;
        this.map.instrument.showIntersections = false;
        this.map.instrument.showNDBs = false;
        this.map.instrument.showAirports = false;
        this.map.instrument.showAirspaces = false;
        this.map.instrument.setZoom(1);
        SimVar.SetSimVarValue("L:CJ4_MAP_ZOOM", "number", 1);
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (this.symbolsToSimvar) {
            SimVar.SetSimVarValue("L:CJ4_MAP_SYMBOLS", "number", this.symbols);
            this.syncSymbols();
            this.symbolsToSimvar = false;
        }
        else {
            let symbols = SimVar.GetSimVarValue("L:CJ4_MAP_SYMBOLS", "number");
            if (symbols != this.symbols) {
                this.symbols = symbols;
                this.syncSymbols();
            }
        }
        let zoom = SimVar.GetSimVarValue("L:CJ4_MAP_ZOOM", "number");
        if (zoom >= 0) {
            this.map.instrument.setZoom(zoom);
        }

        this.updateTerrainColors(_deltaTime);
    }
    updateTerrainColors(_deltaTime) {
        if (!this.lastTerrainUpdate) {
            this.lastTerrainUpdate = 0;
        }
        
        this.lastTerrainUpdate += _deltaTime;

        if (this.lastTerrainUpdate > 1000) {
            const curve = new Avionics.Curve();
            const altitude = Math.min(Simplane.getAltitude(), 15000);

            curve.interpolationFunction = Avionics.CurveTool.StringColorRGBInterpolation;
            curve.add(0, '#000000');
            curve.add(altitude, '#000000');
            curve.add(altitude + 1000, '#ff9900');
            curve.add(altitude + 3000, '#cc0000');

            const altitudeColors = [SvgMapConfig.hexaToRGB('#0000ff')];

            for (let j = 0; j < 60; j++) {
                let color = curve.evaluate(j * 30000 / 60);
                altitudeColors[j + 1] = SvgMapConfig.hexaToRGB(color);
            }

            if (this.map && this.map.instrument && this.map.instrument.bingMap && this.map.instrument.bingMap.m_configs && this.map.instrument.bingMap.m_configs[1]) {
                this.map.instrument.bingMap.m_configs[1].heightColors = altitudeColors;
                this.map.instrument.bingMap.updateConfig();
            }

            this.lastTerrainUpdate = 0;
        }
    }
    onEvent(_event) {
        super.onEvent(_event);
    }
    setMode(_mode) {
        this.map.setMode(_mode);
        switch (_mode) {
            case Jet_NDCompass_Display.ARC:
                this.zoomFactor = 3.6;
                break;
            case Jet_NDCompass_Display.ROSE:
                this.zoomFactor = 4.3;
                break;
            case Jet_NDCompass_Display.PLAN:
                this.zoomFactor = 5.4;
                break;
            case Jet_NDCompass_Display.PPOS:
                this.zoomFactor = 3.6;
                break;
            default:
                this.zoomFactor = 1.0;
                break;
        }
        this.map.instrument.zoomRanges = this.getAdaptiveRanges();
        this.setWxRadarBug();
    }
    showTerrain(_value) {
        if (this.isTerrainVisible != _value) {
            this.isTerrainVisible = _value;
            if (this.isTerrainVisible) {
                this.showWeather(false);
                this.showGwx(false);
            }
            this.refreshLayout();
        }
    }
    showWeather(_value) {
        if (this.isWeatherVisible != _value) {
            this.isWeatherVisible = _value;
            if (this.isWeatherVisible) {
                this.showTerrain(false);
                this.showGwx(false);
                this.map.instrument.showWeatherWithGPS(EWeatherRadar.HORIZONTAL, Math.PI * 2.0);
                this.map.instrument.setBingMapStyle("8%", "0%", "100%", "80%");
            }
            else {
                this.map.instrument.showWeather(EWeatherRadar.OFF);
            }
            this.refreshLayout();
        }
    }
    showGwx(_value) {
        if (this.isGwxVisible != _value) {
            this.isGwxVisible = _value;
            if (this.isGwxVisible) {
                this.showTerrain(false);
                this.showWeather(false);
                this.setMode(Jet_NDCompass_Display.NONE);
            }
            this.refreshLayout();
        }
    }
    setExtended(_value) {
        if (this.map.compassDisplayMode == Jet_NDCompass_Display.ARC) {
            _value = false;
        }
        if (this.isExtended != _value) {
            this.isExtended = _value;
            if (this.isExtended)
                this.root.setAttribute("extended", "on");
            else
                this.root.setAttribute("extended", "off");
        }
    }
    rangeDec() {
        let zoom = this.map.instrument.getZoom();
        if (zoom > 0) {
            zoom--;
            SimVar.SetSimVarValue("L:CJ4_MAP_ZOOM", "number", zoom);
        }
    }
    rangeInc() {
        let zoom = this.map.instrument.getZoom();
        if (zoom < this.zoomRanges.length - 1) {
            zoom++;
            SimVar.SetSimVarValue("L:CJ4_MAP_ZOOM", "number", zoom);
        }
    }
    get range() { return this.zoomRanges[this.map.instrument.getZoom()]; }
    set range(_val) {
        for (let i = 0; i < this.zoomRanges.length; i++) {
            if (this.zoomRanges[i] == _val) {
                SimVar.SetSimVarValue("L:CJ4_MAP_ZOOM", "number", i);
                break;
            }
        }
    }
    hasSymbol(_symbol) {
        if (this.symbols == -1)
            return false;
        if (this.symbols & (1 << _symbol))
            return true;
        return false;
    }
    setSymbol(_symbol, _val) {
        if (this.symbols == -1)
            return;
        if (_val)
            this.symbols |= (1 << _symbol);
        else
            this.symbols &= ~(1 << _symbol);
        this.symbolsToSimvar = true;
    }
    toggleSymbol(_symbol) {
        if (this.symbols == -1)
            return;
        this.symbols ^= (1 << _symbol);
        this.symbolsToSimvar = true;
    }
    syncSymbols() {
        this.map.instrument.showTraffic = (this.symbols & (1 << CJ4_MapSymbol.TRAFFIC)) ? true : false;
        this.map.instrument.showConstraints = (this.symbols & (1 << CJ4_MapSymbol.CONSTRAINTS)) ? true : false;
        this.map.instrument.showAirspaces = (this.symbols & (1 << CJ4_MapSymbol.AIRSPACES)) ? true : false;
        this.map.instrument.showAirways = (this.symbols & (1 << CJ4_MapSymbol.AIRWAYS)) ? true : false;
        this.map.instrument.showVORs = (this.symbols & (1 << CJ4_MapSymbol.NAVAIDS)) ? true : false;
        this.map.instrument.showNDBs = (this.symbols & (1 << CJ4_MapSymbol.NDBS)) ? true : false;
        this.map.instrument.showAirports = (this.symbols & (1 << CJ4_MapSymbol.AIRPORTS)) ? true : false;
        this.map.instrument.showIntersections = (this.symbols & (1 << CJ4_MapSymbol.INTERSECTS)) ? true : false;
        this.map.instrument.showTermWpts = (this.symbols & (1 << CJ4_MapSymbol.TERMWPTS)) ? true : false;
    }
    getAdaptiveRanges() {
        let ranges = Array.from(this.zoomRanges);
        for (let i = 0; i < ranges.length; i++)
            ranges[i] *= this.zoomFactor;
        return ranges;
    }
    setWxRadarBug() {
        let radarbug = document.querySelector("#weather_radar_bug");
        if (radarbug) {
            radarbug.style.display = (this.isWeatherVisible) ? "" : "none";
        }
    }

    /**
     * Sets whether or not the map is visible.
     * @param {Boolean} visible True if the map should be visible, false if it should not be displayed.
     */
    showMap(visible) {
        if (this.isMapVisible !== visible) {
            this.isMapVisible = visible;
            this.refreshLayout();
        }
    }

    /**
     * Sets whether or not the flight plan route is visible.
     * @param {Boolean} visible True if the route should be visible, false if it should not be displayed.
     */
    showRoute(visible) {
        if (this.isRouteVisible !== visible) {
            this.isRouteVisible = visible;
            this.refreshLayout();
        }
    }

    refreshLayout() {

        this.setWxRadarBug();
        if (this.isMapVisible) {
            this.map.instrument.setAttribute('style', '');

            if (this.isTerrainVisible || this.isGwxVisible) {
                this.map.instrument.mapConfigId = 1;
                this.map.instrument.bingMapRef = EBingReference.SEA;
            }
            else {
                this.map.instrument.mapConfigId = 0;
                this.map.instrument.bingMapRef = EBingReference.SEA;
            }

            if (!this.isRouteVisible) {
                this.map.instrument.showFlightPlan = false;
                this.map.instrument.updateFlightPlanVisibility();
            }
            else {
                this.map.instrument.showFlightPlan = true;
                this.map.instrument.updateFlightPlanVisibility();
            }
        }
        else {
            this.map.instrument.setAttribute('style', 'display: none');
        }
    }
}
class CJ4_Map extends MapInstrumentElement {
    constructor() {
        super(...arguments);
        this.compassDisplayMode = undefined;
    }
    setMode(_display) {

        this.compassDisplayMode = _display;
        switch (_display) {
            case Jet_NDCompass_Display.ROSE:
                {
                    this.instrument.style.top = "0";
                    this.instrument.rotateWithPlane(true);
                    this.instrument.centerOnActiveWaypoint(false);
                    this.instrument.setPlaneScale(2.5);
                    this.instrument.showAltitudeIntercept = false;
                    break;
                }
            case Jet_NDCompass_Display.PPOS:
                {
                    this.instrument.style.top = "6%";
                    this.instrument.rotateWithPlane(true);
                    this.instrument.centerOnActiveWaypoint(false);
                    this.instrument.setPlaneScale(2.5);
                    this.instrument.showAltitudeIntercept = true;
                    break;
                }
            case Jet_NDCompass_Display.ARC:
                {
                    this.instrument.style.top = "6%";
                    this.instrument.rotateWithPlane(true);
                    this.instrument.centerOnActiveWaypoint(false);
                    this.instrument.setPlaneScale(2.5);
                    this.instrument.showAltitudeIntercept = false;
                    break;
                }
            case Jet_NDCompass_Display.PLAN:
                {
                    this.instrument.style.top = "0";
                    this.instrument.rotateWithPlane(false);
                    this.instrument.centerOnActiveWaypoint(true);
                    this.instrument.setPlaneScale(2.5);
                    this.instrument.showAltitudeIntercept = false;
                    break;
                }
            default:
                {
                    this.instrument.style.top = "0";
                    this.instrument.rotateWithPlane(false);
                    this.instrument.centerOnActiveWaypoint(false);
                    this.instrument.setPlaneScale(1.0);
                    this.instrument.showAltitudeIntercept = false;
                    break;
                }
        }
    }
    onTemplateLoaded() {
        super.onTemplateLoaded();

        this.instrument.altitudeInterceptElement = new SvgAltitudeInterceptElement();
        this.instrument.altitudeInterceptElement.facingHeadingGetter = {
            getFacingHeading() {
                return SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree");
            }
        };
        this.instrument.showAltitudeIntercept = true;
        this.instrument.showCities = false; // not sure if there's code elsewhere for CJ4 that hides the cities, but putting this here just in case.
    }
}
var CJ4_MapOverlaySymbol;
(function (CJ4_MapOverlaySymbol) {
    CJ4_MapOverlaySymbol[CJ4_MapOverlaySymbol["TERR"] = 0] = "TERR";
    CJ4_MapOverlaySymbol[CJ4_MapOverlaySymbol["WX"] = 1] = "WX";
})(CJ4_MapOverlaySymbol || (CJ4_MapOverlaySymbol = {}));
class CJ4_MapOverlayContainer extends NavSystemElementContainer {
    constructor(_name, _root) {
        super(_name, _root, null);
        this.compass = new CJ4_MapCompass();
        this.infos = new CJ4_MapInfo();
        this.isExtended = undefined;
        this.isTerrainVisible = undefined;
        this.isWeatherVisible = undefined;
        this.isGwxVisible = undefined;
        this.element = new NavSystemElementGroup([this.compass, this.infos]);
        this._chronoValue = 0;
        this._chronoStarted = false;
        this._showET = false;
        this._timeCounterStarted = 0;
    }
    init() {
        super.init();
        this.root = this.gps.getChildById(this.htmlElemId);
        if (!this.root) {
            console.log("Root component expected!");
        }
        else {
            this.elapsedTime = this.root.querySelector("#ElapsedTime");
            this.elapsedTimeValue = this.root.querySelector("#ET_Value");
        }
    }
    onUpdate(_dTime) {
        super.onUpdate(_dTime);
        this.infos.showSymbol(CJ4_MapOverlaySymbol.WX, this.isWeatherVisible);
        this.infos.showSymbol(CJ4_MapOverlaySymbol.TERR, this.isTerrainVisible);
        this.updateElapsedTime();
    }
    onEvent(_event) {
        super.onEvent(_event);
    }
    setExtended(_value) {
        if (this.isExtended != _value) {
            this.isExtended = _value;
            this.refreshLayout();
        }
    }
    showTerrain(_value) {
        if (this.isTerrainVisible != _value) {
            this.isTerrainVisible = _value;
            this.refreshLayout();
        }
    }
    showWeather(_value) {
        if (this.isWeatherVisible != _value) {
            this.isWeatherVisible = _value;
            this.refreshLayout();
        }
    }
    showGwx(_value) {
        if (this.isGwxVisible != _value) {
            this.isGwxVisible = _value;
            this.refreshLayout();
        }
    }
    setMode(_display, _navigation, _navigationSource) {
        this.compass.setMode(_display, _navigation);
        this.infos.setMode(_navigation, _navigationSource);
        this.refreshLayout();
    }
    setRange(_range) {
        this.compass.setRange(_range);
    }
    refreshLayout() {
        if (this.isWeatherVisible)
            this.isTerrainVisible = false;
        else if (this.isTerrainVisible)
            this.isWeatherVisible = false;
        if (this.isGwxVisible) {
            this.compass.show(false);
            this.root.setAttribute("extended", "off");
        }
        else {
            this.compass.show(true);
            this.infos.root.setAttribute("masks", "on");
            this.compass.root.showArcMask(!this.isExtended);
            var compassMode = this.compass.getDisplayMode();
            if (this.isExtended && compassMode != Jet_NDCompass_Display.ARC)
                this.root.setAttribute("extended", "on");
            else
                this.root.setAttribute("extended", "off");
        }
    }
    updateElapsedTime(_dTime) {
        if (this.elapsedTime) {
            if (this._showET) {
                if (this._chronoStarted) {
                    if (this._timeCounterStarted == 0) {
                        this._timeCounterStarted = Number.parseInt(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
                    }
                    this._chronoValue = Number.parseInt(SimVar.GetGlobalVarValue("ZULU TIME", "seconds")) - this._timeCounterStarted;
                }
                var hours = Math.floor(this._chronoValue / 3600);
                var minutes = Math.floor((this._chronoValue - (hours * 3600)) / 60);
                var seconds = Math.floor(this._chronoValue - (minutes * 60) - (hours * 3600));
                let val = "";
                if (hours > 0) {
                    if (hours < 10)
                        val += "0";
                    val += hours;
                    val += ":";
                    if (minutes < 10)
                        val += "0";
                    val += minutes;
                }
                else {
                    if (minutes < 10)
                        val += "0";
                    val += minutes;
                    val += ":";
                    if (seconds < 10)
                        val += "0";
                    val += seconds;
                }
                this.elapsedTimeValue.textContent = val;
                this.elapsedTime.style.display = "block";
            }
            else {
                this.elapsedTime.style.display = "none";
                this._timeCounterStarted = 0;
            }
        }
    }
}
class CJ4_MapCompass extends NavSystemElement {
    init(_root) {
        this.root = _root.querySelector("#NDCompass");
        this.root.aircraft = Aircraft.CJ4;
        this.root.gps = this.gps;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.root.update(_deltaTime);
    }
    onExit() {
    }
    onEvent(_event) {
        this.root.onEvent(_event);
    }
    getDisplayMode() {
        return this.root.displayMode;
    }
    getNavigationMode() {
        return this.root.navigationMode;
    }
    setMode(_display, _navigation) {
        this.root.setMode(_display, _navigation);
    }
    setRange(_range) {
        this.root.mapRange = _range;
    }
    show(_value) {
        this.root.classList.toggle("hide", !_value);
    }
}
class CJ4_MapInfo extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.allSymbols = new Array();
    }
    init(_root) {
        this.root = _root.querySelector("#NDInfo");
        this.root.aircraft = Aircraft.CJ4;
        this.root.gps = this.gps;

        this.terrIndicator = this.root.querySelector('#Symbols .overlay-terr');
        this.wxIndicator = this.root.querySelector('#Symbols .overlay-wx');

        this.wxLine1 = this.root.querySelector('#Symbols .overlay-wx-line1');
        this.wxLine2 = this.root.querySelector('#Symbols .overlay-wx-line2');
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.root.update(_deltaTime);
    }
    onExit() {
    }
    onEvent(_event) {
        this.root.onEvent(_event);
    }
    setMode(_navigation, _navigationSource) {
        this.root.setMode(_navigation, _navigationSource);
    }
    showSymbol(_symbol, _show) {
        if (_symbol === CJ4_MapOverlaySymbol.TERR) {
            if (_show) {
                this.terrIndicator.classList.add('active');
            }
            else {
                this.terrIndicator.classList.remove('active');
            }
        }

        if (_symbol === CJ4_MapOverlaySymbol.WX) {
            if (_show) {
                this.wxIndicator.classList.add('active');

                this.wxLine1.style.display = 'block';
                this.wxLine2.style.display = 'block';
            }
            else {
                this.wxIndicator.classList.remove('active');

                this.wxLine1.style.display = 'none';
                this.wxLine2.style.display = 'none';
            }
        }
    }
}
class CJ4_NavBarContainer extends NavSystemElementContainer {
    constructor(_name, _root) {
        super(_name, _root, null);
    }
    init() {
        super.init();
        this.root = this.gps.getChildById(this.htmlElemId);
        if (!this.root) {
            console.log("Root component expected!");
        }
        this.comPage = this.root.querySelector("#Coms");
        this.com1Element = this.root.querySelector("#Com1_Value");
        this.com2Element = this.root.querySelector("#Com2_Value");
        this.atc1Element = this.root.querySelector("#Atc1_Value");
        this.ratElement = this.root.querySelector("#Rat_Value");
        this.utcElement = this.root.querySelector("#Utc_Value");
        this.cabPage = this.root.querySelector("#Cabs");
        this.cabElement = this.root.querySelector("#Cab_Value");
        this.elevElement = this.root.querySelector("#Elev_Value");
        this.altElement = this.root.querySelector("#Alt_Value");
        this.rateElement = this.root.querySelector("#Rate_Value");
        this.diffElement = this.root.querySelector("#Diff_Value");
        this.gsElement = this.root.querySelector("#Gs_Value");
        this.tasElement = this.root.querySelector("#Tas_Value");
        this.satElement = this.root.querySelector("#Sat_Value");
        this.isaElement = this.root.querySelector("#Isa_Value");

    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (this.com1Element) {
            var com1Active = SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:1", "MHz");
            if (com1Active > 0)
                this.com1Element.textContent = com1Active.toFixed(3);
            else
                this.com1Element.textContent = "---";
        }
        if (this.com2Element) {
            var com2Active = SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:2", "MHz");
            if (com2Active > 0)
                this.com2Element.textContent = com2Active.toFixed(3);
            else
                this.com2Element.textContent = "---";
        }
        if (this.atc1Element != null) {
            let code = SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number");
            if (code)
                this.atc1Element.textContent = code.toString().padStart(4, "0");
        }
        if (this.ratElement) {
            var rat = Math.trunc(SimVar.GetSimVarValue("TOTAL AIR TEMPERATURE", "celsius"));
            if (rat)
                this.ratElement.textContent = rat.toFixed(0);
            else
                this.ratElement.textContent = 0;
        }
        if (this.utcElement) {
            let utcTime = "";
            const value = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
            if (value) {
                const seconds = Number.parseInt(value);
                const time = Utils.SecondsToDisplayTime(seconds, true, true, false);
                utcTime = time.toString();
            }
            this.utcElement.textContent = utcTime;
        }
        if (this.gsElement) {
            var gs = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            if (gs)
                this.gsElement.textContent = gs.toFixed(0);
        }
        if (this.tasElement) {
            var tas = SimVar.GetSimVarValue("AIRSPEED TRUE", "knots");
            if (tas)
                this.tasElement.textContent = tas.toFixed(0);
        }
        if (this.satElement) {
            var sat = Math.trunc(SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius"));
            if (sat)
                this.satElement.textContent = sat.toFixed(0);
        }
        if (this.isaElement) {
            var altitude = Math.trunc(SimVar.GetSimVarValue("PLANE ALTITUDE", "feet"));
            let tmpAlt = (altitude / 1000);
            // until 36k
            var isaTemp = Math.trunc(Math.min(tmpAlt, 36) * 2);
            if (tmpAlt > 65) {
                // above 65k
                tmpAlt -= 65;
                isaTemp += Math.trunc(tmpAlt * 0.3);
            }

            // calc isa
            isaTemp = 15 - isaTemp;

            // calc dev
            var isa = sat - isaTemp;
            if (isa)
                this.isaElement.textContent = (isa <= 0 ? "" : "+") + isa;
        }
    }
}
var CJ4_PopupMenu;
(function (CJ4_PopupMenu) {
    CJ4_PopupMenu[CJ4_PopupMenu["NONE"] = 0] = "NONE";
    CJ4_PopupMenu[CJ4_PopupMenu["PFD"] = 1] = "PFD";
    CJ4_PopupMenu[CJ4_PopupMenu["REFS"] = 2] = "REFS";
    CJ4_PopupMenu[CJ4_PopupMenu["UPPER"] = 3] = "UPPER";
    CJ4_PopupMenu[CJ4_PopupMenu["LOWER"] = 4] = "LOWER";
})(CJ4_PopupMenu || (CJ4_PopupMenu = {}));
class CJ4_PopupMenuContainer extends NavSystemElementContainer {
    constructor(_name, _root) {
        super(_name, _root, null);
        this.mode = CJ4_PopupMenu.NONE;
        this.dictionary = new Avionics.Dictionary();
    }
    init() {
        super.init();
        this.root = this.gps.getChildById(this.htmlElemId);
        if (!this.root) {
            console.log("Root component expected!");
        }
    }
    onUpdate(_dTime) {
        super.onUpdate(_dTime);
        if (this.handler)
            this.handler.onUpdate(_dTime);
    }
    onEvent(_event) {
        super.onEvent(_event);
        if (this.handler && this.handler.reactsOnEvent(_event)) {
            if (typeof CJ4_PFD === 'function') {
                switch (_event) {
                    case "Upr_DATA_PUSH":
                        this.handler.onActivate();
                        break;
                    case "Upr_DATA_DEC":
                        this.handler.onDataDec();
                        break;
                    case "Upr_DATA_INC":
                        this.handler.onDataInc();
                        break;
                    case "Upr_MENU_ADV_DEC":
                        this.handler.onMenuDec();
                        break;
                    case "Upr_MENU_ADV_INC":
                        this.handler.onMenuInc();
                        break;
                    case "Upr_Push_ESC":
                        if (this.handler.isOnMainPage) {
                            this.mode = CJ4_PopupMenu.NONE;
                            Utils.RemoveAllChildren(this.root);
                            this.handler = null;
                        }
                        else
                            this.handler.onEscape();
                        break;
                }
            }
            else if (typeof CJ4_MFD === 'function') {
                switch (_event) {
                    case "Lwr_DATA_PUSH":
                        this.handler.onActivate();
                        break;
                    case "Lwr_DATA_DEC":
                        this.handler.onDataDec();
                        break;
                    case "Lwr_DATA_INC":
                        this.handler.onDataInc();
                        break;
                    case "Lwr_MENU_ADV_DEC":
                        this.handler.onMenuDec();
                        break;
                    case "Lwr_MENU_ADV_INC":
                        this.handler.onMenuInc();
                        break;
                    case "Lwr_Push_ESC":
                        if (this.handler.isOnMainPage) {
                            this.mode = CJ4_PopupMenu.NONE;
                            Utils.RemoveAllChildren(this.root);
                            this.handler = null;
                        }
                        else
                            this.handler.onEscape();
                        break;
                }
            }
        }
    }
    setMode(_mode) {
        if (this.mode != _mode) {
            this.mode = _mode;
            Utils.RemoveAllChildren(this.root);
            switch (_mode) {
                case CJ4_PopupMenu.PFD:
                    this.handler = new CJ4_PopupMenu_PFD(this.root, this.dictionary);
                    break;
                case CJ4_PopupMenu.REFS:
                    this.handler = new CJ4_PopupMenu_REF(this.root, this.dictionary);
                    break;
                case CJ4_PopupMenu.UPPER:
                    this.handler = new CJ4_PopupMenu_UPPER(this.root, this.dictionary);
                    break;
                case CJ4_PopupMenu.LOWER:
                    this.handler = new CJ4_PopupMenu_LOWER(this.root, this.dictionary);
                    break;
                default:
                    this.handler = null;
                    break;
            }
        }
        else if (this.handler) {
            if (this.handler.isOnMainPage) {
                this.mode = CJ4_PopupMenu.NONE;
                Utils.RemoveAllChildren(this.root);
                this.handler = null;
            }
            else
                this.handler.reset();
        }
    }
}
var CJ4_PopupMenu_Key;
(function (CJ4_PopupMenu_Key) {
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["MAP_FORMAT"] = 0] = "MAP_FORMAT";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["MAP_SRC"] = 1] = "MAP_SRC";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["MAP_RANGE"] = 2] = "MAP_RANGE";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["MAP_SYMBOL_CONSTRAINTS"] = 3] = "MAP_SYMBOL_CONSTRAINTS";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["MAP_SYMBOL_AIRSPACES"] = 4] = "MAP_SYMBOL_AIRSPACES";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["MAP_SYMBOL_AIRWAYS"] = 5] = "MAP_SYMBOL_AIRWAYS";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["MAP_SYMBOL_NAVAIDS"] = 6] = "MAP_SYMBOL_NAVAIDS";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["MAP_SYMBOL_AIRPORTS"] = 7] = "MAP_SYMBOL_AIRPORTS";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["MAP_SYMBOL_INTERSECTS"] = 8] = "MAP_SYMBOL_INTERSECTS";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["NAV_SRC"] = 9] = "NAV_SRC";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["BRG_PTR1_SRC"] = 10] = "BRG_PTR1_SRC";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["BRG_VOR1_FREQ"] = 11] = "BRG_VOR1_FREQ";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["BRG_ADF1_FREQ"] = 12] = "BRG_ADF1_FREQ";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["BRG_PTR2_SRC"] = 13] = "BRG_PTR2_SRC";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["BRG_VOR2_FREQ"] = 14] = "BRG_VOR2_FREQ";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["BRG_ADF2_FREQ"] = 15] = "BRG_ADF2_FREQ";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["UNITS_PRESS"] = 16] = "UNITS_PRESS";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["UNITS_MTR_ALT"] = 17] = "UNITS_MTR_ALT";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["VSPEED_V1"] = 18] = "VSPEED_V1";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["VSPEED_VR"] = 19] = "VSPEED_VR";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["VSPEED_V2"] = 20] = "VSPEED_V2";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["VSPEED_VT"] = 21] = "VSPEED_VT";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["VSPEED_VRF"] = 22] = "VSPEED_VRF";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["VSPEED_VAP"] = 23] = "VSPEED_VAP";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["MIN_ALT_SRC"] = 24] = "MIN_ALT_SRC";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["MIN_ALT_BARO_VAL"] = 25] = "MIN_ALT_BARO_VAL";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["MIN_ALT_RADIO_VAL"] = 26] = "MIN_ALT_RADIO_VAL";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["SYS_SRC"] = 27] = "SYS_SRC";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["AOA"] = 28] = "AOA";
    CJ4_PopupMenu_Key[CJ4_PopupMenu_Key["FLT_DIR"] = 29] = "FLT_DIR";
})(CJ4_PopupMenu_Key || (CJ4_PopupMenu_Key = {}));
class CJ4_PopupMenu_Handler extends Airliners.PopupMenu_Handler {
    constructor() {
        super(...arguments);
        this._isOnMainPage = false;
    }
    get isOnMainPage() {
        return this._isOnMainPage;
    }
    reactsOnEvent(_event) {
        switch (_event) {
            case "Upr_DATA_PUSH":
            case "Upr_DATA_DEC":
            case "Upr_DATA_INC":
            case "Upr_MENU_ADV_DEC":
            case "Upr_MENU_ADV_INC":
            case "Upr_Push_ESC":
                return true;
            case "Lwr_DATA_PUSH":
            case "Lwr_DATA_DEC":
            case "Lwr_DATA_INC":
            case "Lwr_MENU_ADV_DEC":
            case "Lwr_MENU_ADV_INC":
            case "Lwr_Push_ESC":
                return true;
        }
        return false;
    }
}
class CJ4_PopupMenu_PFD extends CJ4_PopupMenu_Handler {
    constructor(_root, _dictionary) {
        super();
        this.titleSize = 15;
        this.textSize = 13;
        this.root = _root;
        this.menuLeft = 5;
        this.menuTop = 217;
        this.menuWidth = 145;
        this.dictionary = _dictionary;
        this.showMainPage();
    }
    reset() {
        this.showMainPage();
    }
    showMainPage(_highlight = 0) {
        this._isOnMainPage = true;
        let page = document.createElementNS(Avionics.SVG.NS, "svg");
        page.setAttribute("id", "ViewBox");
        page.setAttribute("viewBox", "0 0 500 500");
        let sectionRoot = this.openMenu();
        {
            this.beginSection();
            {
                this.addTitle("PFD MENU", this.titleSize, 1.0);
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("FORMAT", this.textSize, 0.4);
                this.addRadio("ROSE", this.textSize, [CJ4_PopupMenu_Key.MAP_FORMAT]);
                this.addRadio("ARC", this.textSize, [CJ4_PopupMenu_Key.MAP_FORMAT]);

                const navSource = SimVar.GetSimVarValue('L:WT_CJ4_LNAV_MODE', 'number');
                if (navSource === 0) {
                    this.addRadio("PPOS", this.textSize, [CJ4_PopupMenu_Key.MAP_FORMAT]);
                }
                else {
                    this.addRadio("PPOS", this.textSize, null);
                }
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("CONTROLS", this.textSize, 0.5);
                this.addList("NAV-SRC", this.textSize, ["FMS1", "VOR1", "VOR2"], [CJ4_PopupMenu_Key.NAV_SRC]);
                this.addList("RANGE", this.textSize, ["5", "10", "25", "50", "100", "200", "300"], [CJ4_PopupMenu_Key.MAP_RANGE]);
            }
            this.endSection();
            this.beginSection();
            {
                this.addSubMenu("BRG SRC", this.textSize, this.showNavPage.bind(this));
                this.addSubMenu("CONFIG", this.textSize, this.showConfigPage.bind(this));
                this.addSubMenu("OVERLAYS", this.textSize, null);
                this.addSubMenu("RADAR", this.textSize, null);
                this.addSubMenu("REFS", this.textSize, this.showRefPage.bind(this));
                this.addSubMenu("TAWS", this.textSize, null);
                this.addSubMenu("BARO SET", this.textSize, null);
            }
            this.endSection();
        }
        this.closeMenu();
        this.highlight = _highlight;
        page.appendChild(sectionRoot);
        Utils.RemoveAllChildren(this.root);
        this.root.appendChild(page);
    }
    showNavPage() {
        this._isOnMainPage = false;
        let page = document.createElementNS(Avionics.SVG.NS, "svg");
        page.setAttribute("id", "ViewBox");
        page.setAttribute("viewBox", "0 0 500 500");
        let sectionRoot = this.openMenu();
        {
            this.beginSection();
            {
                this.addTitle("PFD MENU", this.titleSize, 1.0, "grey");
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("BRG SRC", this.titleSize, 1.0, "blue", true);
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("BRG PTR 1", this.textSize, 0.5);
                this.addRadio("OFF", this.textSize, [CJ4_PopupMenu_Key.BRG_PTR1_SRC]);
                this.addRadio("FMS1", this.textSize, [CJ4_PopupMenu_Key.BRG_PTR1_SRC]);
                this.addRadio("VOR1", this.textSize, [CJ4_PopupMenu_Key.BRG_PTR1_SRC]);
                this.addRadio("ADF1", this.textSize, [CJ4_PopupMenu_Key.BRG_PTR1_SRC]);
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("BRG PTR 2", this.textSize, 0.5);
                this.addRadio("OFF", this.textSize, [CJ4_PopupMenu_Key.BRG_PTR2_SRC]);
                this.addRadio("VOR2", this.textSize, [CJ4_PopupMenu_Key.BRG_PTR2_SRC]);
                this.addRadio("ADF2", this.textSize, [CJ4_PopupMenu_Key.BRG_PTR2_SRC]);
            }
            this.endSection();
        }
        this.closeMenu();
        this.escapeCbk = this.showMainPage.bind(this, 6);
        page.appendChild(sectionRoot);
        Utils.RemoveAllChildren(this.root);
        this.root.appendChild(page);
    }
    showConfigPage() {
        this._isOnMainPage = false;
        let page = document.createElementNS(Avionics.SVG.NS, "svg");
        page.setAttribute("id", "ViewBox");
        page.setAttribute("viewBox", "0 0 500 500");
        let sectionRoot = this.openMenu();
        {
            this.beginSection();
            {
                this.addTitle("PFD MENU", this.titleSize, 1.0, "grey");
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("CONFIG", this.titleSize, 1.0, "blue", true);
            }
            this.endSection();
            this.beginSection();
            {
                //this.addTitle("UNITS", this.textSize, 0.3);
                this.addList("PRESS", this.textSize, ["IN", "HPA"], [CJ4_PopupMenu_Key.UNITS_PRESS]);
                this.addList("MTR ALT", this.textSize, ["OFF", "ON"], [CJ4_PopupMenu_Key.UNITS_MTR_ALT]);
                this.addList("FLT DIR", this.textSize, ["V-BAR", "X-PTR"], [CJ4_PopupMenu_Key.FLT_DIR]);
            }
            this.endSection();
            this.beginSection();
            {
                this.addList("AOA DISP", this.textSize, ["AUTO", "ON", "OFF"], [CJ4_PopupMenu_Key.AOA]);
            }
            this.endSection();
        }
        this.closeMenu();
        this.escapeCbk = this.showMainPage.bind(this, 7);
        page.appendChild(sectionRoot);
        Utils.RemoveAllChildren(this.root);
        this.root.appendChild(page);
    }
    showRefPage() {
        this._isOnMainPage = false;
        let page = document.createElementNS(Avionics.SVG.NS, "svg");
        page.setAttribute("id", "ViewBox");
        page.setAttribute("viewBox", "0 0 500 500");
        let sectionRoot = this.openMenu();
        {
            this.beginSection();
            {
                this.addTitle("PFD MENU", this.titleSize, 1.0, "grey");
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("REFS", this.titleSize, 1.0, "blue", true);
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("V SPEEDS", this.textSize, 0.45);
                this.addRange("V1", this.textSize, 10, 250, 1, [CJ4_PopupMenu_Key.VSPEED_V1]);
                this.addRange("VR", this.textSize, 10, 250, 1, [CJ4_PopupMenu_Key.VSPEED_VR]);
                this.addRange("V2", this.textSize, 10, 250, 1, [CJ4_PopupMenu_Key.VSPEED_V2]);
                this.addRange("VT", this.textSize, 10, 250, 1, [CJ4_PopupMenu_Key.VSPEED_VT]);
                this.addRange("VRF", this.textSize, 10, 250, 1, [CJ4_PopupMenu_Key.VSPEED_VRF]);
                this.addRange("VAP", this.textSize, 10, 250, 1, [CJ4_PopupMenu_Key.VSPEED_VAP]);
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("RA/BARO MIN", this.textSize, 0.6);
                this.addRadioRange("RA", this.textSize, 0, 2500, 10, [CJ4_PopupMenu_Key.MIN_ALT_SRC, CJ4_PopupMenu_Key.MIN_ALT_RADIO_VAL]);
                this.addRadioRange("BARO", this.textSize, 0, 14000, 10, [CJ4_PopupMenu_Key.MIN_ALT_SRC, CJ4_PopupMenu_Key.MIN_ALT_BARO_VAL]);
            }
            this.endSection();
        }
        this.closeMenu();
        this.escapeCbk = this.showMainPage.bind(this, 8);
        page.appendChild(sectionRoot);
        Utils.RemoveAllChildren(this.root);
        this.root.appendChild(page);
    }
}
class CJ4_PopupMenu_REF extends CJ4_PopupMenu_Handler {
    constructor(_root, _dictionary) {
        super();
        this.titleSize = 15;
        this.textSize = 13;
        this.root = _root;
        this.menuLeft = 5;
        this.menuTop = 217;
        this.menuWidth = 145;
        this.dictionary = _dictionary;
        this.showMainPage();
    }
    reset() {
        this.showMainPage();
    }
    showMainPage() {
        this._isOnMainPage = true;
        let page = document.createElementNS(Avionics.SVG.NS, "svg");
        page.setAttribute("id", "ViewBox");
        page.setAttribute("viewBox", "0 0 500 500");
        let sectionRoot = this.openMenu();
        {
            this.beginSection();
            {
                this.addTitle("REFS", this.titleSize, 1.0, "blue");
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("V SPEEDS", this.textSize, 0.45);
                this.addRange("V1", this.textSize, 10, 250, 1, [CJ4_PopupMenu_Key.VSPEED_V1]);
                this.addRange("VR", this.textSize, 10, 250, 1, [CJ4_PopupMenu_Key.VSPEED_VR]);
                this.addRange("V2", this.textSize, 10, 250, 1, [CJ4_PopupMenu_Key.VSPEED_V2]);
                this.addRange("VT", this.textSize, 10, 250, 1, [CJ4_PopupMenu_Key.VSPEED_VT]);
            }
            this.endSection();
            this.beginSection();
            {
                this.addRange("VRF", this.textSize, 10, 250, 1, [CJ4_PopupMenu_Key.VSPEED_VRF]);
                this.addRange("VAP", this.textSize, 10, 250, 1, [CJ4_PopupMenu_Key.VSPEED_VAP]);
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("RA/BARO MIN", this.textSize, 0.6);
                this.addRadioRange("RA", this.textSize, 0, 2500, 10, [CJ4_PopupMenu_Key.MIN_ALT_SRC, CJ4_PopupMenu_Key.MIN_ALT_RADIO_VAL]);
                this.addRadioRange("BARO", this.textSize, 0, 14000, 10, [CJ4_PopupMenu_Key.MIN_ALT_SRC, CJ4_PopupMenu_Key.MIN_ALT_BARO_VAL]);
            }
            this.endSection();
        }
        this.closeMenu();
        page.appendChild(sectionRoot);
        Utils.RemoveAllChildren(this.root);
        this.root.appendChild(page);
    }
}
class CJ4_PopupMenu_UPPER extends CJ4_PopupMenu_Handler {
    constructor(_root, _dictionary) {
        super();
        this.titleSize = 15;
        this.textSize = 13;
        this.root = _root;
        this.menuLeft = 5;
        this.menuTop = 35;
        this.menuWidth = 145;
        this.dictionary = _dictionary;
        this.showMainPage();
    }
    reset() {
        this.showMainPage();
    }
    showMainPage() {
        this._isOnMainPage = true;
        let page = document.createElementNS(Avionics.SVG.NS, "svg");
        page.setAttribute("id", "ViewBox");
        page.setAttribute("viewBox", "0 0 500 500");
        let sectionRoot = this.openMenu();
        {
            this.beginSection();
            {
                this.addTitle("UPR MENU", this.titleSize, 1.0, "blue");
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("FORMAT", this.textSize, 0.45);
                this.addRadio("OFF", this.textSize, [CJ4_PopupMenu_Key.SYS_SRC]);
                this.addRadio("FMS TEXT", this.textSize, [CJ4_PopupMenu_Key.SYS_SRC]);
                this.addRadio("CHECKLIST", this.textSize, [CJ4_PopupMenu_Key.SYS_SRC]);
                this.addRadio("PASS BRIEF", this.textSize, [CJ4_PopupMenu_Key.SYS_SRC]);
                this.addRadio("SYSTEMS 1/2", this.textSize, [CJ4_PopupMenu_Key.SYS_SRC]);
            }
            this.endSection();
        }
        this.closeMenu();
        page.appendChild(sectionRoot);
        Utils.RemoveAllChildren(this.root);
        this.root.appendChild(page);
    }
}
class CJ4_PopupMenu_LOWER extends CJ4_PopupMenu_Handler {
    constructor(_root, _dictionary) {
        super();
        this.titleSize = 15;
        this.textSize = 13;
        this.root = _root;
        this.menuLeft = 5;
        this.menuTop = 245;
        this.menuWidth = 145;
        this.dictionary = _dictionary;
        this.showMainPage();
    }
    reset() {
        this.showMainPage();
    }
    showMainPage(_highlight = 0) {
        this._isOnMainPage = true;
        let page = document.createElementNS(Avionics.SVG.NS, "svg");
        page.setAttribute("id", "ViewBox");
        page.setAttribute("viewBox", "0 0 500 500");
        let sectionRoot = this.openMenu();
        {
            this.beginSection();
            {
                this.addTitle("LWR MENU", this.titleSize, 1.0, "blue");
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("FORMAT", this.textSize, 0.45);
                this.addRadio("ROSE", this.textSize, [CJ4_PopupMenu_Key.MAP_FORMAT]);
                this.addRadio("ARC", this.textSize, [CJ4_PopupMenu_Key.MAP_FORMAT]);
                this.addRadio("PPOS", this.textSize, [CJ4_PopupMenu_Key.MAP_FORMAT]);
                this.addRadio("PLAN", this.textSize, [CJ4_PopupMenu_Key.MAP_FORMAT]);
                this.addRadio("GWX", this.textSize, null);
                this.addRadio("TCAS", this.textSize, null);
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("CONTROLS", this.textSize, 0.5);
                this.addList("MAP-SRC", this.textSize, ["FMS1"], [CJ4_PopupMenu_Key.MAP_SRC]);
                this.addSubMenu("OVERLAYS", this.textSize, null);
                this.addSubMenu("MAP SYMBOLS", this.textSize, this.showMapSymbolsPage.bind(this));
                this.addSubMenu("TFR TEST", this.textSize, null);
                this.addSubMenu("SYS TEST", this.textSize, this.showSystemTestPage.bind(this));
            }
            this.endSection();

            this.beginSection();
            {
                this.addSubMenu("L PFD MENU", this.textSize, null);
            }
            this.endSection();

        }
        this.closeMenu();
        this.highlight = _highlight;
        page.appendChild(sectionRoot);
        Utils.RemoveAllChildren(this.root);
        this.root.appendChild(page);
    }
    showMapSymbolsPage() {
        this._isOnMainPage = false;
        let page = document.createElementNS(Avionics.SVG.NS, "svg");
        page.setAttribute("id", "ViewBox");
        page.setAttribute("viewBox", "0 0 500 500");
        let sectionRoot = this.openMenu();
        {
            this.beginSection();
            {
                this.addTitle("LWR MENU", this.titleSize, 1.0, "blue");
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("MAP SYMBOLS", this.titleSize, 1.0, "blue", true);
            }
            this.endSection();
            this.beginSection();
            {
                //this.addCheckbox("CONSTRAINTS", this.textSize, [CJ4_PopupMenu_Key.MAP_SYMBOL_CONSTRAINTS]);
                this.addCheckbox("AIRSPACES", this.textSize, [CJ4_PopupMenu_Key.MAP_SYMBOL_AIRSPACES]);
                this.addCheckbox("AIRWAYS", this.textSize, [CJ4_PopupMenu_Key.MAP_SYMBOL_AIRWAYS]);
                this.addCheckbox("NAVAIDS", this.textSize, [CJ4_PopupMenu_Key.MAP_SYMBOL_NAVAIDS]);
                this.addCheckbox("AIRPORTS", this.textSize, [CJ4_PopupMenu_Key.MAP_SYMBOL_AIRPORTS]);
                this.addCheckbox("INTERSECTS", this.textSize, [CJ4_PopupMenu_Key.MAP_SYMBOL_INTERSECTS]);
            }
            this.endSection();
        }
        this.closeMenu();
        this.escapeCbk = this.showMainPage.bind(this, 7);
        page.appendChild(sectionRoot);
        Utils.RemoveAllChildren(this.root);
        this.root.appendChild(page);
    }
    showSystemTestPage() {
        this._isOnMainPage = false;
        let page = document.createElementNS(Avionics.SVG.NS, "svg");
        page.setAttribute("id", "ViewBox");
        page.setAttribute("viewBox", "0 0 500 500");
        let sectionRoot = this.openMenu();
        {
            this.beginSection();
            {
                this.addTitle("LWR MENU", this.titleSize, 1.0, "blue");
            }
            this.endSection();
            this.beginSection();
            {
                this.addTitle("SYS TEST", this.titleSize, 1.0, "blue", true);
            }
            this.endSection();
            this.beginSection();
            {
                this.addCheckbox("FIRE WARN", this.textSize, null);
                this.addCheckbox("LDG GEAR", this.textSize, null);
                this.addCheckbox("BLEED LEAK", this.textSize, null);
                this.addCheckbox("TAIL DE-ICE", this.textSize, null);
                this.addCheckbox("AOA", this.textSize, null);
                this.addCheckbox("RUDDER BIAS", this.textSize, null);
                this.addCheckbox("W/S TEMP", this.textSize, null);
                this.addCheckbox("OVERSPEED", this.textSize, null);
                this.addCheckbox("ANTI-SKID", this.textSize, null);
                this.addCheckbox("ANNUNCIATOR", this.textSize, null);
                this.addCheckbox("CABIN PRESS", this.textSize, null);
                this.addCheckbox("ELEV TRIM", this.textSize, null);
                this.addCheckbox("TAWS", this.textSize, null);
                this.addCheckbox("OFF", this.textSize, null);
            }
            this.endSection();
        }
        this.closeMenu();
        this.escapeCbk = this.showMainPage.bind(this, 7);
        page.appendChild(sectionRoot);
        Utils.RemoveAllChildren(this.root);
        this.root.appendChild(page);
    }
}




class CJ4_Checklist_Container extends NavSystemElementContainer {
    constructor(_name, _root) {
        super(_name, _root, null);
        this.isVisible = undefined;
        this.dictionary = new Avionics.Dictionary();
        this.otherMenusOpen = false;
        this.checklist = new NormalChecklist;
    }
    init() {
        super.init();
        this.root = this.gps.getChildById(this.htmlElemId);
        if (!this.root) {
            console.log("Root component expected!");
        }
        else {
            this.handler = new CJ4_MFDChecklist(this.root, this.dictionary, this.checklist);
        }
    }
    onUpdate(_dTime) {
        super.onUpdate(_dTime);
        if (this.handler)
            this.handler.onUpdate(_dTime);
    }
    show(_value) {
        if (this.isVisible != _value) {
            this.isVisible = _value;
            this.root.setAttribute("visible", (_value) ? "true" : "false");

            if (this.isVisible == true) {
                this.handler.expand();
            }
            else if (this.isVisible == false) {
                this.handler.minimise();
            }
        }
    }
    onEvent(_event) {
        super.onEvent(_event);
        if (this.handler && this.handler.reactsOnEvent(_event)) {
            switch (_event) {
                case "Upr_DATA_PUSH":
                case "Lwr_DATA_PUSH":
                    if (!this.otherMenusOpen) {
                        this.handler.onActivate();
                        if (this.handler.highlightItem) {
                            if (this.handler.onChecklistItemPage && this.handler.highlightItem.checkboxVal) {
                                this.handler.highlight(this.handler.highlightId + 1);
                                this.handler.changeCurrentSelectionIndex(1);
                            }
                        }
                    }
                    break;
                case "Upr_DATA_DEC":
                case "Lwr_DATA_DEC":
                    if (!this.otherMenusOpen) {
                        this.handler.onDataDec();
                    }
                    break;
                case "Upr_DATA_INC":
                case "Lwr_DATA_INC":
                    if (!this.otherMenusOpen) {
                        this.handler.onDataInc();
                    }
                    break;
                case "Upr_MENU_ADV_DEC":
                case "Lwr_MENU_ADV_DEC":
                    if (!this.otherMenusOpen) {
                        this.handler.onMenuDec();
                        this.handler.changeCurrentSelectionIndex(-1);
                    }
                    break;
                case "Upr_MENU_ADV_INC":
                case "Lwr_MENU_ADV_INC":
                    if (!this.otherMenusOpen) {
                        this.handler.onMenuInc();
                        this.handler.changeCurrentSelectionIndex(1);
                    }
                    break;
                case "Upr_Push_ESC":
                case "Lwr_Push_ESC":
                    if (!this.handler.isOnMainPage && !this.otherMenusOpen) {
                        this.handler.escapeCbk();
                    }
                    break;
            }
        }
    }
}
class CJ4_MFDChecklist extends WTMenu.Checklist_Menu_Handler {
    constructor(_root, _dictionary, _checklist) {
        super();
        // Styling
        this.titleSize = 13;
        this.textSize = 13;
        this.root = _root;
        this.menuLeft = 75;
        this.menuWidth = 350;
        this.dictionary = _dictionary;
        this.maximumItemsPerPage = 7;

        // Logic
        this.onChecklistItemPage = false;
        this.checklist = _checklist;

        this.currentMenu = this.showMainPage.bind(this);
        this.currentPage = 1;
        this.totalPages = 1;
        this.currentItemIndex = 0;

        this.showMainPage();
    }
    refreshPage() {
        if (this.currentMenu) {
            this.currentMenu();
        }
    }
    changeCurrentSelectionIndex(_delta, _override = false) {
        // Menu scrolling
        if ((this.currentItemIndex + _delta) >= 0 && (this.currentItemIndex + _delta < this.totalSectionItems)) {
            if (_override == true) {
                this.currentItemIndex = _delta;
            }
            else {
                this.currentItemIndex += _delta;
            }

            // Handle page transition
            let startAtLastPageItem = false;
            const newPage = Math.ceil((this.currentItemIndex + 1) / this.maximumItemsPerPage);
            if (newPage != this.currentPage && newPage >= 1) {
                if (newPage < this.currentPage) startAtLastPageItem = true;
                this.currentPage = newPage;
                this.refreshPage();
                if (startAtLastPageItem) this.highlight(6); // Starts selection highlight on last item of previous page
            }

            if (_override) {
                let pageIndex = this.currentItemIndex;
                if (this.currentItemIndex > 6) {
                    pageIndex -= this.maximumItemsPerPage * (this.currentPage - 1);
                }
                //= Math.abs(this.currentItemIndex - this.currentPage * (this.maximumItemsPerPage - 1)  Math.ceil(this.currentItemIndex / (this.maximumItemsPerPage - 1));
                if ((this.totalPages == this.currentPage && pageIndex == 6) || (pageIndex == 0 && this.currentPage == 1)) {
                    this.highlight(pageIndex);
                    console.log(pageIndex + "+0");
                }
                else {
                    this.highlight(pageIndex + 1);
                    console.log(pageIndex + "+1");
                }

            }
        }
    }
    showMainPage(_highlight = 0) {
        this.onChecklistItemPage = false;
        this.currentItemIndex = 0;
        this.currentMenu = this.showMainPage.bind(this, 0);

        let page = document.createElementNS(Avionics.SVG.NS, "svg");
        page.setAttribute("id", "ViewBox");
        page.setAttribute("viewBox", "0 0 500 500");
        let sectionRoot = this.openMenu();
        {
            this.beginSection();
            {
                this.addChecklistTitle("CHECKLIST INDEX", this.titleSize, 1.0, undefined, undefined);
                this.addChecklistTitle("", this.titleSize, 1.0);
            }
            this.endSection();
            this.beginSection();
            {
                this.addSubMenu(this.checklist.name, this.textSize, (() => { this.showChecklistSections(this.checklist); this.changeCurrentSelectionIndex(this.checklist.findCurrentSectionIndex(), true); }).bind(this));
                this.addSubMenu("CHECKLIST/PASS BRIEF CONFIG MENU", this.textSize, null);
                if (this.checklist.hasProgress()) this.addSubMenu("RESET CHECKLIST", this.textSize, (() => { this.checklist.resetChecklistState(); this.currentItemIndex = 0; this.refreshPage() }).bind(this));
            }
            this.endSection();
        }
        this.closeMenu();
        this.escapeCbk = () => { };
        this.highlight(_highlight);
        page.appendChild(sectionRoot);
        Utils.RemoveAllChildren(this.root);
        this.root.appendChild(page);
    }
    showChecklistSections(_checklist) {
        this.onChecklistItemPage = false;
        this.currentMenu = this.showChecklistSections.bind(this, _checklist);

        this.totalSectionItems = _checklist.sections.length;
        this.totalPages = Math.ceil(_checklist.sections.length / this.maximumItemsPerPage);

        let page = document.createElementNS(Avionics.SVG.NS, "svg");
        page.setAttribute("id", "ViewBox");
        page.setAttribute("viewBox", "0 0 500 500");

        let sectionRoot = this.openMenu();
        {
            this.beginSection();
            {
                this.addChecklistTitle(_checklist.name, this.titleSize, 1.0, this.currentPage, this.totalPages);
                this.addChecklistTitle("", this.titleSize, 1.0);
            }
            this.endSection();
            this.beginSection();
            {
                let startingSection = (this.currentPage * this.maximumItemsPerPage) - this.maximumItemsPerPage;
                let endSection = Math.min(_checklist.sections.length, startingSection + this.maximumItemsPerPage);

                for (let i = startingSection; i < endSection; i++) {
                    this.addSubMenu(_checklist.sections[i].name, this.textSize, (() => { this.currentItemIndex = 0; this.currentPage = 1; this.showChecklistSection(_checklist, i) }).bind(this), _checklist.isSectionComplete(i) ? "#11d011" : "white");
                }

            }
            this.endSection();
        }
        this.closeMenu();
        this.escapeCbk = this.showMainPage.bind(this, 0);
        page.appendChild(sectionRoot);
        Utils.RemoveAllChildren(this.root);
        this.root.appendChild(page);
    }
    showChecklistSection(_checklist, _section_id) {
        this.onChecklistItemPage = true;

        this.currentMenu = this.showChecklistSection.bind(this, _checklist, _section_id);
        this.totalPages = Math.ceil(_checklist.sections[_section_id].checklistItems.length / this.maximumItemsPerPage);
        this.totalSectionItems = _checklist.sections[_section_id].checklistItems.length;
        if (_checklist.sections[_section_id].checklistItems.length % 7 == 0) {
            this.totalPages += 1;
            this.totalSectionItems += 1;
        }
        // (this.totalPages - (_checklist.sections[_section_id].checklistItems.length / 7)).toFixed(2)) == 0.16

        let page = document.createElementNS(Avionics.SVG.NS, "svg");
        page.setAttribute("id", "ViewBox");
        page.setAttribute("viewBox", "0 0 500 500");

        let sectionRoot = this.openMenu();
        {
            this.beginSection();
            {
                this.addChecklistTitle(_checklist.name, this.titleSize, 1.0, this.currentPage, this.totalPages);
                this.addChecklistTitle(_checklist.sections[_section_id].name, this.titleSize, 1.0, undefined, undefined, "left");
            }
            this.endSection();
            this.beginSection();
            {
                let checklistItems = _checklist.sections[_section_id].checklistItems;
                let startingItem = (this.currentPage * this.maximumItemsPerPage) - this.maximumItemsPerPage;
                let endItem = Math.min(checklistItems.length, startingItem + this.maximumItemsPerPage);
                for (let i = startingItem; i < endItem; i++) {
                    if (checklistItems[i]) {
                        this.addChecklistItem(_checklist.sections[_section_id].checklistItems[i], this.textSize);
                    }
                }

                if (endItem == checklistItems.length && _section_id < _checklist.sections.length - 1) {
                    if (checklistItems.length % 7 != 0) {
                        this.addChecklistTitle("", this.titleSize, 1.0);
                        this.addSubMenu("CKLST COMPLETE: NEXT " + _checklist.name, this.textSize, (() => { this.currentItemIndex = 0; this.currentPage = 1; this.showChecklistSection(_checklist, _section_id + 1); }).bind(this));
                    }
                    else {
                        if (this.currentPage == this.totalPages) {
                            this.addSubMenu("CKLST COMPLETE: NEXT " + _checklist.name, this.textSize, (() => { this.currentItemIndex = 0; this.currentPage = 1; this.showChecklistSection(_checklist, _section_id + 1); }).bind(this));
                        }
                    }
                }
            }
            this.endSection();
        }
        this.closeMenu();
        this.escapeCbk = (() => { this.showChecklistSections(_checklist); this.currentItemIndex = 0; this.changeCurrentSelectionIndex(this.checklist.findCurrentSectionIndex(), true); }).bind(this);
        page.appendChild(sectionRoot);
        Utils.RemoveAllChildren(this.root);
        this.root.appendChild(page);
    }
    minimise() {
        this.root.setAttribute("visible", "false");
    }
    expand() {
        this.root.setAttribute("visible", "true");
    }
}
class CJ4_PassengerBrief_Container extends NavSystemElementContainer {
    constructor(_name, _root) {
        super(_name, _root, null);
        this.isVisible = undefined;
        this.dictionary = new Avionics.Dictionary();
        this.otherMenusOpen = false;
    }
    init() {
        super.init();
        this.root = this.gps.getChildById(this.htmlElemId);
        if (!this.root) {
            console.log("Root component expected!");
        }
    }
    onUpdate(_dTime) {
        super.onUpdate(_dTime);
        if (this.handler)
            this.handler.onUpdate(_dTime);
    }
    show(_value) {
        if (this.isVisible != _value) {
            this.isVisible = _value;
            this.root.setAttribute("visible", (_value) ? "true" : "false");

            if (this.isVisible == true) {
                this.handler = new CJ4_PassengerBrief(this.root, this.dictionary);
            }
            else if (this.isVisible == false) {
                Utils.RemoveAllChildren(this.root);
                this.handler = null;
            }
        }
    }
    onEvent(_event) {
        super.onEvent(_event);
        if (this.handler && this.handler.reactsOnEvent(_event)) {
            switch (_event) {
                case "Lwr_DATA_PUSH":
                    if (!this.otherMenusOpen) {
                        this.handler.onActivate();
                    }
                    break;
                case "Lwr_DATA_DEC":
                    if (!this.otherMenusOpen)
                        this.handler.onDataDec();
                    break;
                case "Lwr_DATA_INC":
                    if (!this.otherMenusOpen)
                        this.handler.onDataInc();
                    break;
                case "Lwr_MENU_ADV_DEC":
                    if (!this.otherMenusOpen) {
                        this.handler.onMenuDec();
                    }
                    break;
                case "Lwr_MENU_ADV_INC":
                    if (!this.otherMenusOpen) {
                        this.handler.onMenuInc();
                    }
                    break;
                case "Lwr_Push_ESC":
                    if (!this.handler.isOnMainPage && !this.otherMenusOpen) {
                        this.handler.escapeCbk();
                    }
                    break;
            }
        }
    }
}
class CJ4_PassengerBrief extends WTMenu.PassengerBrief_Menu_Handler {
    constructor(_root, _dictionary) {
        super();
        // Styling
        this.titleSize = 13;
        this.textSize = 13;
        this.root = _root;
        this.menuLeft = 75;
        this.menuWidth = 350;
        this.dictionary = _dictionary;

        // Logic
        this.showMainPage();
    }
    refreshPage() {
        if (this.currentMenu) {
            this.currentMenu();
        }
    }
    showMainPage(_highlight = 0) {
        let page = document.createElementNS(Avionics.SVG.NS, "svg");
        page.setAttribute("id", "ViewBox");
        page.setAttribute("viewBox", "0 0 500 500");
        let sectionRoot = this.openMenu();
        {
            this.beginSection();
            {
                this.addPassBriefTitle("PASSENGER BRIEFING MENU", this.titleSize, 1.0);
                this.addPassBriefTitle("", this.titleSize, 1.0);
            }
            this.endSection();
            this.beginSection();
            {
                this.addPassBriefItem("TAKEOFF (LONG)", this.textSize, "L:PAX_BRIEF_TAKEOFF_LONG_PLAYED");
                this.addPassBriefItem("TAKEOFF (SHORT)", this.textSize, "L:PAX_BRIEF_TAKEOFF_SHORT_PLAYED");
                this.addPassBriefItem("LANDING", this.textSize, "L:PAX_BRIEF_LANDING_PLAYED");
                this.addPassBriefItem("TURBULENCE", this.textSize, "L:PAX_BRIEF_TURBULENCE_PLAYED");
                this.addPassBriefItem("SEATBELT", this.textSize, "L:SEATBELT_LIGHT_ON");
                this.addPassBriefItem("PASSENGER SAFETY", this.textSize, "L:SAFETY_LIGHT_ON");
                this.addPassBriefItem("OXYGEN MASK DEPLOYMENT", this.textSize, "L:PAX_BRIEF_OXYGEN_PLAYED");
            }
            this.endSection();
        }
        this.closeMenu();
        this.escapeCbk = () => { };
        this.highlight(_highlight);
        page.appendChild(sectionRoot);
        Utils.RemoveAllChildren(this.root);
        this.root.appendChild(page);
    }
}
