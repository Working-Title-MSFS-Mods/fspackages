class Jet_PFD_ILSIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.loc_cursorMinX = 0;
        this.loc_cursorMaxX = 0;
        this.loc_cursorPosX = 0;
        this.loc_cursorPosY = 0;
        this.gs_cursorMinY = 0;
        this.gs_cursorMaxY = 0;
        this.gs_cursorPosX = 0;
        this.gs_cursorPosY = 0;
        this.locVisible = false;
        this.gsVisible = false;
        this.infoVisible = false;
        this.isHud = false;
        this._aircraft = Aircraft.A320_NEO;
    }
    static get observedAttributes() {
        return ["hud"];
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
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue)
            return;
        switch (name) {
            case "hud":
                this.isHud = newValue == "true";
                break;
        }
    }
    construct() {
        Utils.RemoveAllChildren(this);
        this.InfoGroup = null;
        if (this.aircraft == Aircraft.CJ4) {
            this.construct_CJ4();
        }
        else if (this.aircraft == Aircraft.B747_8) {
            this.construct_B747_8();
        }
        else if (this.aircraft == Aircraft.AS01B) {
            this.construct_AS01B();
        }
        else {
            this.construct_A320_Neo();
        }
        this.showGlideslope(this.gsVisible);
        this.showLocalizer(this.locVisible);
        this.showNavInfo(this.infoVisible);
    }
    construct_CJ4() {
        var posX = 0;
        var posY = 0;
        var width = 500;
        var height = 500;
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 " + width + " " + height);
        this.centerGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.centerGroup.setAttribute("id", "ILSGroup");
        this.centerGroup.setAttribute("transform", "translate(82 70) scale(0.65)");
        this.rootSVG.appendChild(this.centerGroup);
        {
            posX = 434;
            posY = 0;
            width = 27;
            height = 275;
            this.gs_mainGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.gs_mainGroup.setAttribute("id", "GlideSlopeGroup");
            {
                let bg = document.createElementNS(Avionics.SVG.NS, "rect");
                bg.setAttribute("x", posX.toString());
                bg.setAttribute("y", posY.toString());
                bg.setAttribute("width", width.toString());
                bg.setAttribute("height", height.toString());
                bg.setAttribute("fill", "black");
                bg.setAttribute("fill-opacity", "0.3");
                this.gs_mainGroup.appendChild(bg);
                let rangeFactor = 0.85;
                let nbCircles = 2;
                this.gs_cursorMinY = posY + (height * 0.5) + (rangeFactor * height * 0.5);
                this.gs_cursorMaxY = posY + (height * 0.5) - (rangeFactor * height * 0.5);
                this.gs_cursorPosX = posX + width * 0.5;
                this.gs_cursorPosY = posY + height * 0.5;
                for (let i = 0; i < nbCircles; i++) {
                    let y = posY + (height * 0.5) + ((rangeFactor * height * 0.5) * (i + 1)) / nbCircles;
                    let circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", this.gs_cursorPosX.toString());
                    circle.setAttribute("cy", y.toString());
                    circle.setAttribute("r", "4");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    this.gs_mainGroup.appendChild(circle);
                    y = posY + (height * 0.5) - ((rangeFactor * height * 0.5) * (i + 1)) / nbCircles;
                    circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", this.gs_cursorPosX.toString());
                    circle.setAttribute("cy", y.toString());
                    circle.setAttribute("r", "4");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    this.gs_mainGroup.appendChild(circle);
                }

                let neutralLine = document.createElementNS(Avionics.SVG.NS, "line");
                neutralLine.setAttribute("id", "NeutralLine");
                neutralLine.setAttribute("x1", (posX + 5).toString());
                neutralLine.setAttribute("y1", (posY + height * 0.5).toString());
                neutralLine.setAttribute("x2", (posX + width - 5).toString());
                neutralLine.setAttribute("y2", (posY + height * 0.5).toString());
                neutralLine.setAttribute("stroke", "white");
                neutralLine.setAttribute("stroke-width", "2");
                this.gs_mainGroup.appendChild(neutralLine);

                this.gs_cursorGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.gs_cursorGroup.setAttribute("id", "CursorGroup");
                this.gs_cursorGroup.setAttribute("transform", "translate(" + this.gs_cursorPosX + ", " + this.gs_cursorPosY + ")");
                this.gs_mainGroup.appendChild(this.gs_cursorGroup);

                {
                    let x = 12;
                    let y = 20;
                    this.gs_cursorShapeUp = document.createElementNS(Avionics.SVG.NS, "path");
                    this.gs_cursorShapeUp.setAttribute("fill", "#11d011");
                    this.gs_cursorShapeUp.setAttribute("d", "M -12 0 L 0 -20 L 12 0 L 7 0 L 0 -13 L -7 0");
                    this.gs_cursorGroup.appendChild(this.gs_cursorShapeUp);
                    this.gs_cursorShapeDown = document.createElementNS(Avionics.SVG.NS, "path");
                    this.gs_cursorShapeDown.setAttribute("fill", "#11d011");
                    this.gs_cursorShapeDown.setAttribute("d", "M -12 0 L 0 20 L 12 0 L 7 0 L 0 14 L -7 0");
                    this.gs_cursorGroup.appendChild(this.gs_cursorShapeDown);

                    this.vertical_snowFlake = document.createElementNS(Avionics.SVG.NS, "path");
                    this.vertical_snowFlake.setAttribute("fill", "none");
                    this.vertical_snowFlake.setAttribute("d", "M 0 11 c -0.0599 -0.1556 -0.6583 -2.0229 -1.3406 -4.1656 l -1.2449 -3.8902 l -4.1296 -1.3167 c -3.579 -1.1491 -4.1296 -1.3526 -4.1296 -1.5561 c 0 -0.2035 0.5386 -0.395 4.1296 -1.4962 l 4.1296 -1.2568 l 1.3167 -4.1296 c 1.0174 -3.1601 1.3765 -4.1416 1.5322 -4.1656 c 0.2514 -0.0479 0.1436 -0.3471 1.58 4.3451 l 1.209 3.9381 l 3.9381 1.209 c 4.6922 1.4364 4.393 1.3287 4.3451 1.58 c -0.0239 0.1556 -1.0055 0.5147 -4.1656 1.5322 l -4.1296 1.3167 l -1.2568 4.1296 c -0.9815 3.2199 -1.3047 4.1296 -1.4723 4.1656 c -0.1317 0.0239 -0.2394 -0.0599 -0.3112 -0.2394 z");
                    this.vertical_snowFlake.setAttribute("stroke", "magenta");
                    this.vertical_snowFlake.setAttribute("stroke-width", "2.5");
                    this.gs_cursorGroup.appendChild(this.vertical_snowFlake);
                }
            }
            this.centerGroup.appendChild(this.gs_mainGroup);
            posX = 114;
            posY = 323;
            width = 275;
            height = 27;
            this.loc_mainGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.loc_mainGroup.setAttribute("id", "LocalizerGroup");
            {
                let bg = document.createElementNS(Avionics.SVG.NS, "rect");
                bg.setAttribute("x", posX.toString());
                bg.setAttribute("y", posY.toString());
                bg.setAttribute("width", width.toString());
                bg.setAttribute("height", height.toString());
                bg.setAttribute("fill", "black");
                bg.setAttribute("fill-opacity", "0.3");
                this.loc_mainGroup.appendChild(bg);
                let rangeFactor = 0.85;
                let nbCircles = 2;
                this.loc_cursorMinX = posX + (width * 0.5) - (rangeFactor * width * 0.5);
                this.loc_cursorMaxX = posX + (width * 0.5) + (rangeFactor * width * 0.5);
                this.loc_cursorPosX = posX + width * 0.5;
                this.loc_cursorPosY = posY + height * 0.5;
                for (let i = 0; i < nbCircles; i++) {
                    let x = posX + (width * 0.5) + ((rangeFactor * width * 0.5) * (i + 1)) / nbCircles;
                    let circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", x.toString());
                    circle.setAttribute("cy", this.loc_cursorPosY.toString());
                    circle.setAttribute("r", "4");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    this.loc_mainGroup.appendChild(circle);
                    x = posX + (width * 0.5) - ((rangeFactor * width * 0.5) * (i + 1)) / nbCircles;
                    circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", x.toString());
                    circle.setAttribute("cy", this.loc_cursorPosY.toString());
                    circle.setAttribute("r", "4");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    this.loc_mainGroup.appendChild(circle);
                }

                let neutralLine = document.createElementNS(Avionics.SVG.NS, "line");
                neutralLine.setAttribute("id", "NeutralLine");
                neutralLine.setAttribute("x1", (posX + width * 0.5).toString());
                neutralLine.setAttribute("y1", (posY + 5).toString());
                neutralLine.setAttribute("x2", (posX + width * 0.5).toString());
                neutralLine.setAttribute("y2", (posY + height - 5).toString());
                neutralLine.setAttribute("stroke", "white");
                neutralLine.setAttribute("stroke-width", "2");
                this.loc_mainGroup.appendChild(neutralLine);

                this.loc_cursorGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.loc_cursorGroup.setAttribute("id", "CursorGroup");
                this.loc_cursorGroup.setAttribute("transform", "translate(" + this.loc_cursorPosX + ", " + this.loc_cursorPosY + ")");
                this.loc_mainGroup.appendChild(this.loc_cursorGroup);
                {
                    let x = 20;
                    let y = 12;
                    this.loc_cursorShapeRight = document.createElementNS(Avionics.SVG.NS, "path");
                    this.loc_cursorShapeRight.setAttribute("fill", "#11d011");
                    this.loc_cursorShapeRight.setAttribute("d", "M 0 -12 L -20 0 L 0 12 L 0 6 L -14 0 L 0 -7");
                    this.loc_cursorGroup.appendChild(this.loc_cursorShapeRight);
                    this.loc_cursorShapeLeft = document.createElementNS(Avionics.SVG.NS, "path");
                    this.loc_cursorShapeLeft.setAttribute("fill", "#11d011");
                    this.loc_cursorShapeLeft.setAttribute("d", "M 0 -12 L 20 0 L 0 12 L 0 6 L 14 0 L 0 -7");
                    this.loc_cursorGroup.appendChild(this.loc_cursorShapeLeft);

                    this.lateral_snowFlake = document.createElementNS(Avionics.SVG.NS, "path");
                    this.lateral_snowFlake.setAttribute("fill", "none");
                    this.lateral_snowFlake.setAttribute("d", "M 0 11 c -0.0599 -0.1556 -0.6583 -2.0229 -1.3406 -4.1656 l -1.2449 -3.8902 l -4.1296 -1.3167 c -3.579 -1.1491 -4.1296 -1.3526 -4.1296 -1.5561 c 0 -0.2035 0.5386 -0.395 4.1296 -1.4962 l 4.1296 -1.2568 l 1.3167 -4.1296 c 1.0174 -3.1601 1.3765 -4.1416 1.5322 -4.1656 c 0.2514 -0.0479 0.1436 -0.3471 1.58 4.3451 l 1.209 3.9381 l 3.9381 1.209 c 4.6922 1.4364 4.393 1.3287 4.3451 1.58 c -0.0239 0.1556 -1.0055 0.5147 -4.1656 1.5322 l -4.1296 1.3167 l -1.2568 4.1296 c -0.9815 3.2199 -1.3047 4.1296 -1.4723 4.1656 c -0.1317 0.0239 -0.2394 -0.0599 -0.3112 -0.2394 z");
                    this.lateral_snowFlake.setAttribute("stroke", "magenta");
                    this.lateral_snowFlake.setAttribute("stroke-width", "2.5");
                    this.loc_cursorGroup.appendChild(this.lateral_snowFlake);

                }
            }
            this.centerGroup.appendChild(this.loc_mainGroup);
        }
        this.appendChild(this.rootSVG);
    }
    construct_B747_8() {
        var posX = 0;
        var posY = 0;
        var width = 500;
        var height = 500;
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 " + width + " " + height);
        this.centerGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.centerGroup.setAttribute("id", "ILSGroup");
        this.centerGroup.setAttribute("transform", "translate(35 88) scale(0.75)");
        this.rootSVG.appendChild(this.centerGroup);
        {
            posX = 418;
            posY = 45;
            width = 40;
            height = 375;
            this.gs_mainGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.gs_mainGroup.setAttribute("id", "GlideSlopeGroup");
            {
                let neutralLine = document.createElementNS(Avionics.SVG.NS, "line");
                neutralLine.setAttribute("id", "NeutralLine");
                neutralLine.setAttribute("x1", (posX + 5).toString());
                neutralLine.setAttribute("y1", (posY + height * 0.5).toString());
                neutralLine.setAttribute("x2", (posX + width - 5).toString());
                neutralLine.setAttribute("y2", (posY + height * 0.5).toString());
                neutralLine.setAttribute("stroke", "white");
                neutralLine.setAttribute("stroke-width", "2");
                this.gs_mainGroup.appendChild(neutralLine);
                let rangeFactor = 0.7;
                let nbCircles = 2;
                this.gs_cursorMinY = posY + (height * 0.5) + (rangeFactor * height * 0.5);
                this.gs_cursorMaxY = posY + (height * 0.5) - (rangeFactor * height * 0.5);
                this.gs_cursorPosX = posX + width * 0.5;
                this.gs_cursorPosY = posY + height * 0.5;
                for (let i = 0; i < nbCircles; i++) {
                    let y = posY + (height * 0.5) + ((rangeFactor * height * 0.5) * (i + 1)) / nbCircles;
                    let circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", this.gs_cursorPosX.toString());
                    circle.setAttribute("cy", y.toString());
                    circle.setAttribute("r", "5");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    this.gs_mainGroup.appendChild(circle);
                    y = posY + (height * 0.5) - ((rangeFactor * height * 0.5) * (i + 1)) / nbCircles;
                    circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", this.gs_cursorPosX.toString());
                    circle.setAttribute("cy", y.toString());
                    circle.setAttribute("r", "5");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    this.gs_mainGroup.appendChild(circle);
                }
                this.gs_cursorGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.gs_cursorGroup.setAttribute("id", "CursorGroup");
                this.gs_cursorGroup.setAttribute("transform", "translate(" + this.gs_cursorPosX + ", " + this.gs_cursorPosY + ")");
                this.gs_mainGroup.appendChild(this.gs_cursorGroup);
                {
                    let x = 12;
                    let y = 20;
                    this.gs_cursorShapeUp = document.createElementNS(Avionics.SVG.NS, "path");
                    this.gs_cursorShapeUp.setAttribute("fill", "transparent");
                    this.gs_cursorShapeUp.setAttribute("stroke", "#FF0CE2");
                    this.gs_cursorShapeUp.setAttribute("stroke-width", "2");
                    this.gs_cursorShapeUp.setAttribute("d", "M " + (-x) + " 0 L0 " + (-y) + " L" + (x) + " 0");
                    this.gs_cursorGroup.appendChild(this.gs_cursorShapeUp);
                    this.gs_cursorShapeDown = document.createElementNS(Avionics.SVG.NS, "path");
                    this.gs_cursorShapeDown.setAttribute("fill", "transparent");
                    this.gs_cursorShapeDown.setAttribute("stroke", "#FF0CE2");
                    this.gs_cursorShapeDown.setAttribute("stroke-width", "2");
                    this.gs_cursorShapeDown.setAttribute("d", "M " + (-x) + " 0 L0 " + (y) + " L" + (x) + " 0");
                    this.gs_cursorGroup.appendChild(this.gs_cursorShapeDown);
                    this.gs_glidePathCursorUp = document.createElementNS(Avionics.SVG.NS, "path");
                    this.gs_glidePathCursorUp.setAttribute("fill", "transparent");
                    this.gs_glidePathCursorUp.setAttribute("stroke", "#FF0CE2");
                    this.gs_glidePathCursorUp.setAttribute("stroke-width", "2");
                    this.gs_glidePathCursorUp.setAttribute("d", "M " + (-x) + " 0 L" + (-x) + " " + (-y / 2) + " L" + (x) + " " + (-y / 2) + " L " + (x) + " 0");
                    this.gs_cursorGroup.appendChild(this.gs_glidePathCursorUp);
                    this.gs_glidePathCursorDown = document.createElementNS(Avionics.SVG.NS, "path");
                    this.gs_glidePathCursorDown.setAttribute("fill", "transparent");
                    this.gs_glidePathCursorDown.setAttribute("stroke", "#FF0CE2");
                    this.gs_glidePathCursorDown.setAttribute("stroke-width", "2");
                    this.gs_glidePathCursorDown.setAttribute("d", "M " + (-x) + " 0 L" + (-x) + " " + (y / 2) + " L" + (x) + " " + (y / 2) + " L " + (x) + " 0");
                    this.gs_cursorGroup.appendChild(this.gs_glidePathCursorDown);
                }
            }
            this.centerGroup.appendChild(this.gs_mainGroup);
            posX = 69;
            posY = 413;
            width = 375;
            height = 35;
            this.loc_mainGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.loc_mainGroup.setAttribute("id", "LocalizerGroup");
            {
                let neutralLine = document.createElementNS(Avionics.SVG.NS, "line");
                neutralLine.setAttribute("id", "NeutralLine");
                neutralLine.setAttribute("x1", (posX + width * 0.5).toString());
                neutralLine.setAttribute("y1", (posY + 5).toString());
                neutralLine.setAttribute("x2", (posX + width * 0.5).toString());
                neutralLine.setAttribute("y2", (posY + height - 5).toString());
                neutralLine.setAttribute("stroke", "white");
                neutralLine.setAttribute("stroke-width", "2");
                this.loc_mainGroup.appendChild(neutralLine);
                let rangeFactor = 0.7;
                let nbCircles = 2;
                this.loc_cursorMinX = posX + (width * 0.5) - (rangeFactor * width * 0.5);
                this.loc_cursorMaxX = posX + (width * 0.5) + (rangeFactor * width * 0.5);
                this.loc_cursorPosX = posX + width * 0.5;
                this.loc_cursorPosY = posY + height * 0.5;
                for (let i = 0; i < nbCircles; i++) {
                    let x = posX + (width * 0.5) + ((rangeFactor * width * 0.5) * (i + 1)) / nbCircles;
                    let circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", x.toString());
                    circle.setAttribute("cy", this.loc_cursorPosY.toString());
                    circle.setAttribute("r", "5");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    this.loc_mainGroup.appendChild(circle);
                    x = posX + (width * 0.5) - ((rangeFactor * width * 0.5) * (i + 1)) / nbCircles;
                    circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", x.toString());
                    circle.setAttribute("cy", this.loc_cursorPosY.toString());
                    circle.setAttribute("r", "5");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    this.loc_mainGroup.appendChild(circle);
                }
                this.loc_cursorGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.loc_cursorGroup.setAttribute("id", "CursorGroup");
                this.loc_cursorGroup.setAttribute("transform", "translate(" + this.loc_cursorPosX + ", " + this.loc_cursorPosY + ")");
                this.loc_mainGroup.appendChild(this.loc_cursorGroup);
                {
                    let x = 20;
                    let y = 12;
                    this.loc_cursorShapeRight = document.createElementNS(Avionics.SVG.NS, "path");
                    this.loc_cursorShapeRight.setAttribute("fill", "transparent");
                    this.loc_cursorShapeRight.setAttribute("stroke", "#FF0CE2");
                    this.loc_cursorShapeRight.setAttribute("stroke-width", "2");
                    this.loc_cursorShapeRight.setAttribute("d", "M 0 " + (-y) + " L" + (-x) + " 0 L0 " + (y));
                    this.loc_cursorGroup.appendChild(this.loc_cursorShapeRight);
                    this.loc_cursorShapeLeft = document.createElementNS(Avionics.SVG.NS, "path");
                    this.loc_cursorShapeLeft.setAttribute("fill", "transparent");
                    this.loc_cursorShapeLeft.setAttribute("stroke", "#FF0CE2");
                    this.loc_cursorShapeLeft.setAttribute("stroke-width", "2");
                    this.loc_cursorShapeLeft.setAttribute("d", "M 0 " + (-y) + " L" + (x) + " 0 L0 " + (y));
                    this.loc_cursorGroup.appendChild(this.loc_cursorShapeLeft);
                }
            }
            this.centerGroup.appendChild(this.loc_mainGroup);
        }
        this.InfoGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.InfoGroup.setAttribute("id", "InfoGroup");
        this.InfoGroup.setAttribute("transform", "translate(112 73)");
        this.rootSVG.appendChild(this.InfoGroup);
        {
            this.ILSIdent = document.createElementNS(Avionics.SVG.NS, "text");
            this.ILSIdent.textContent = "ILS";
            this.ILSIdent.setAttribute("x", "0");
            this.ILSIdent.setAttribute("y", "0");
            this.ILSIdent.setAttribute("fill", "white");
            this.ILSIdent.setAttribute("font-size", "10");
            this.ILSIdent.setAttribute("font-family", "Roboto-Bold");
            this.ILSIdent.setAttribute("text-anchor", "start");
            this.ILSIdent.setAttribute("alignment-baseline", "central");
            this.InfoGroup.appendChild(this.ILSIdent);
            this.ILSFreq = document.createElementNS(Avionics.SVG.NS, "text");
            this.ILSFreq.textContent = "109.50";
            this.ILSFreq.setAttribute("x", "0");
            this.ILSFreq.setAttribute("y", "10");
            this.ILSFreq.setAttribute("fill", "white");
            this.ILSFreq.setAttribute("font-size", "10");
            this.ILSFreq.setAttribute("font-family", "Roboto-Bold");
            this.ILSFreq.setAttribute("text-anchor", "start");
            this.ILSFreq.setAttribute("alignment-baseline", "central");
            this.InfoGroup.appendChild(this.ILSFreq);
            this.ILSDist = document.createElementNS(Avionics.SVG.NS, "text");
            this.ILSDist.textContent = "109 NM";
            this.ILSDist.setAttribute("x", "0");
            this.ILSDist.setAttribute("y", "20");
            this.ILSDist.setAttribute("fill", "white");
            this.ILSDist.setAttribute("font-size", "10");
            this.ILSDist.setAttribute("font-family", "Roboto-Bold");
            this.ILSDist.setAttribute("text-anchor", "start");
            this.ILSDist.setAttribute("alignment-baseline", "central");
            this.InfoGroup.appendChild(this.ILSDist);
            this.ILSOrigin = document.createElementNS(Avionics.SVG.NS, "text");
            this.ILSOrigin.textContent = "ILS/FMC";
            this.ILSOrigin.setAttribute("x", "0");
            this.ILSOrigin.setAttribute("y", "30");
            this.ILSOrigin.setAttribute("fill", "white");
            this.ILSOrigin.setAttribute("font-size", "13");
            this.ILSOrigin.setAttribute("font-family", "Roboto-Bold");
            this.ILSOrigin.setAttribute("text-anchor", "start");
            this.ILSOrigin.setAttribute("alignment-baseline", "central");
            this.InfoGroup.appendChild(this.ILSOrigin);
        }
        this.appendChild(this.rootSVG);
    }
    construct_AS01B() {
        var posX = 0;
        var posY = 0;
        var width = 500;
        var height = 500;
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 " + width + " " + height);
        this.centerGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.centerGroup.setAttribute("id", "ILSGroup");
        this.centerGroup.setAttribute("transform", "translate(100 80) scale(0.6)");
        this.rootSVG.appendChild(this.centerGroup);
        {
            posX = (this.isHud) ? 500 : 405;
            posY = (this.isHud) ? 152 : 52;
            width = 35;
            height = 275;
            this.gs_mainGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.gs_mainGroup.setAttribute("id", "GlideSlopeGroup");
            {
                if (!this.isHud) {
                    let bg = document.createElementNS(Avionics.SVG.NS, "rect");
                    bg.setAttribute("x", posX.toString());
                    bg.setAttribute("y", posY.toString());
                    bg.setAttribute("width", width.toString());
                    bg.setAttribute("height", height.toString());
                    bg.setAttribute("fill", "black");
                    bg.setAttribute("fill-opacity", "0.3");
                    this.gs_mainGroup.appendChild(bg);
                }
                let rangeFactor = 0.85;
                let nbCircles = 2;
                this.gs_cursorMinY = posY + (height * 0.5) + (rangeFactor * height * 0.5);
                this.gs_cursorMaxY = posY + (height * 0.5) - (rangeFactor * height * 0.5);
                this.gs_cursorPosX = posX + width * 0.5;
                this.gs_cursorPosY = posY + height * 0.5;
                for (let i = 0; i < nbCircles; i++) {
                    let y = posY + (height * 0.5) + ((rangeFactor * height * 0.5) * (i + 1)) / nbCircles;
                    let circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", this.gs_cursorPosX.toString());
                    circle.setAttribute("cy", y.toString());
                    circle.setAttribute("r", "5");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", (this.isHud) ? "lime" : "white");
                    circle.setAttribute("stroke-width", "2");
                    this.gs_mainGroup.appendChild(circle);
                    y = posY + (height * 0.5) - ((rangeFactor * height * 0.5) * (i + 1)) / nbCircles;
                    circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", this.gs_cursorPosX.toString());
                    circle.setAttribute("cy", y.toString());
                    circle.setAttribute("r", "5");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", (this.isHud) ? "lime" : "white");
                    circle.setAttribute("stroke-width", "2");
                    this.gs_mainGroup.appendChild(circle);
                }
                this.gs_cursorGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.gs_cursorGroup.setAttribute("id", "CursorGroup");
                this.gs_cursorGroup.setAttribute("transform", "translate(" + this.gs_cursorPosX + ", " + this.gs_cursorPosY + ")");
                this.gs_mainGroup.appendChild(this.gs_cursorGroup);
                {
                    let x = 12;
                    let y = 20;
                    this.gs_cursorShapeUp = document.createElementNS(Avionics.SVG.NS, "path");
                    this.gs_cursorShapeUp.setAttribute("fill", (this.isHud) ? "lime" : "#FF0CE2");
                    this.gs_cursorShapeUp.setAttribute("d", "M " + (-x) + " 0 L0 " + (-y) + " L" + (x) + " 0 Z");
                    this.gs_cursorGroup.appendChild(this.gs_cursorShapeUp);
                    this.gs_cursorShapeDown = document.createElementNS(Avionics.SVG.NS, "path");
                    this.gs_cursorShapeDown.setAttribute("fill", (this.isHud) ? "lime" : "#FF0CE2");
                    this.gs_cursorShapeDown.setAttribute("d", "M " + (-x) + " 0 L0 " + (y) + " L" + (x) + " 0 Z");
                    this.gs_cursorGroup.appendChild(this.gs_cursorShapeDown);
                }
                let neutralLine = document.createElementNS(Avionics.SVG.NS, "line");
                neutralLine.setAttribute("id", "NeutralLine");
                neutralLine.setAttribute("x1", (posX + 5).toString());
                neutralLine.setAttribute("y1", (posY + height * 0.5).toString());
                neutralLine.setAttribute("x2", (posX + width - 5).toString());
                neutralLine.setAttribute("y2", (posY + height * 0.5).toString());
                neutralLine.setAttribute("stroke", (this.isHud) ? "lime" : "white");
                neutralLine.setAttribute("stroke-width", "2");
                this.gs_mainGroup.appendChild(neutralLine);
            }
            this.centerGroup.appendChild(this.gs_mainGroup);
            posX = 112;
            posY = 435;
            width = 275;
            height = 35;
            this.loc_mainGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.loc_mainGroup.setAttribute("id", "LocalizerGroup");
            {
                if (!this.isHud) {
                    let bg = document.createElementNS(Avionics.SVG.NS, "rect");
                    bg.setAttribute("x", posX.toString());
                    bg.setAttribute("y", posY.toString());
                    bg.setAttribute("width", width.toString());
                    bg.setAttribute("height", height.toString());
                    bg.setAttribute("fill", "black");
                    bg.setAttribute("fill-opacity", "0.3");
                    this.gs_mainGroup.appendChild(bg);
                }
                let rangeFactor = 0.85;
                let nbCircles = 2;
                this.loc_cursorMinX = posX + (width * 0.5) - (rangeFactor * width * 0.5);
                this.loc_cursorMaxX = posX + (width * 0.5) + (rangeFactor * width * 0.5);
                this.loc_cursorPosX = posX + width * 0.5;
                this.loc_cursorPosY = posY + height * 0.5;
                for (let i = 0; i < nbCircles; i++) {
                    let x = posX + (width * 0.5) + ((rangeFactor * width * 0.5) * (i + 1)) / nbCircles;
                    let circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", x.toString());
                    circle.setAttribute("cy", this.loc_cursorPosY.toString());
                    circle.setAttribute("r", "5");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", (this.isHud) ? "lime" : "white");
                    circle.setAttribute("stroke-width", "2");
                    this.loc_mainGroup.appendChild(circle);
                    x = posX + (width * 0.5) - ((rangeFactor * width * 0.5) * (i + 1)) / nbCircles;
                    circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", x.toString());
                    circle.setAttribute("cy", this.loc_cursorPosY.toString());
                    circle.setAttribute("r", "5");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", (this.isHud) ? "lime" : "white");
                    circle.setAttribute("stroke-width", "2");
                    this.loc_mainGroup.appendChild(circle);
                }
                this.loc_cursorGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.loc_cursorGroup.setAttribute("id", "CursorGroup");
                this.loc_cursorGroup.setAttribute("transform", "translate(" + this.loc_cursorPosX + ", " + this.loc_cursorPosY + ")");
                this.loc_mainGroup.appendChild(this.loc_cursorGroup);
                {
                    let x = 20;
                    let y = 12;
                    this.loc_cursorShapeRight = document.createElementNS(Avionics.SVG.NS, "path");
                    this.loc_cursorShapeRight.setAttribute("fill", (this.isHud) ? "lime" : "#FF0CE2");
                    this.loc_cursorShapeRight.setAttribute("d", "M 0 " + (-y) + " L" + (-x) + " 0 L0 " + (y) + " Z");
                    this.loc_cursorGroup.appendChild(this.loc_cursorShapeRight);
                    this.loc_cursorShapeLeft = document.createElementNS(Avionics.SVG.NS, "path");
                    this.loc_cursorShapeLeft.setAttribute("fill", (this.isHud) ? "lime" : "#FF0CE2");
                    this.loc_cursorShapeLeft.setAttribute("d", "M 0 " + (-y) + " L" + (x) + " 0 L0 " + (y) + " Z");
                    this.loc_cursorGroup.appendChild(this.loc_cursorShapeLeft);
                }
                let neutralLine = document.createElementNS(Avionics.SVG.NS, "line");
                neutralLine.setAttribute("id", "NeutralLine");
                neutralLine.setAttribute("x1", (posX + width * 0.5).toString());
                neutralLine.setAttribute("y1", (posY + 5).toString());
                neutralLine.setAttribute("x2", (posX + width * 0.5).toString());
                neutralLine.setAttribute("y2", (posY + height - 5).toString());
                neutralLine.setAttribute("stroke", (this.isHud) ? "lime" : "white");
                neutralLine.setAttribute("stroke-width", "2");
                this.loc_mainGroup.appendChild(neutralLine);
            }
            this.centerGroup.appendChild(this.loc_mainGroup);
        }
        this.InfoGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.InfoGroup.setAttribute("id", "InfoGroup");
        this.InfoGroup.setAttribute("transform", "translate(150 50)");
        this.rootSVG.appendChild(this.InfoGroup);
        {
            this.ILSIdent = document.createElementNS(Avionics.SVG.NS, "text");
            this.ILSIdent.textContent = "ILS";
            this.ILSIdent.setAttribute("x", "0");
            this.ILSIdent.setAttribute("y", "0");
            this.ILSIdent.setAttribute("fill", (this.isHud) ? "lime" : "white");
            this.ILSIdent.setAttribute("font-size", "10");
            this.ILSIdent.setAttribute("font-family", "Roboto-Bold");
            this.ILSIdent.setAttribute("text-anchor", "start");
            this.ILSIdent.setAttribute("alignment-baseline", "central");
            this.InfoGroup.appendChild(this.ILSIdent);
            this.ILSFreq = document.createElementNS(Avionics.SVG.NS, "text");
            this.ILSFreq.textContent = "109.50";
            this.ILSFreq.setAttribute("x", "0");
            this.ILSFreq.setAttribute("y", "10");
            this.ILSFreq.setAttribute("fill", (this.isHud) ? "lime" : "white");
            this.ILSFreq.setAttribute("font-size", "10");
            this.ILSFreq.setAttribute("font-family", "Roboto-Bold");
            this.ILSFreq.setAttribute("text-anchor", "start");
            this.ILSFreq.setAttribute("alignment-baseline", "central");
            this.InfoGroup.appendChild(this.ILSFreq);
            this.ILSDist = document.createElementNS(Avionics.SVG.NS, "text");
            this.ILSDist.textContent = "109 NM";
            this.ILSDist.setAttribute("x", "0");
            this.ILSDist.setAttribute("y", "20");
            this.ILSDist.setAttribute("fill", (this.isHud) ? "lime" : "white");
            this.ILSDist.setAttribute("font-size", "10");
            this.ILSDist.setAttribute("font-family", "Roboto-Bold");
            this.ILSDist.setAttribute("text-anchor", "start");
            this.ILSDist.setAttribute("alignment-baseline", "central");
            this.InfoGroup.appendChild(this.ILSDist);
            this.ILSOrigin = document.createElementNS(Avionics.SVG.NS, "text");
            this.ILSOrigin.textContent = "ILS/FMC";
            this.ILSOrigin.setAttribute("x", "0");
            this.ILSOrigin.setAttribute("y", "40");
            this.ILSOrigin.setAttribute("fill", (this.isHud) ? "lime" : "white");
            this.ILSOrigin.setAttribute("font-size", "13");
            this.ILSOrigin.setAttribute("font-family", "Roboto-Bold");
            this.ILSOrigin.setAttribute("text-anchor", "start");
            this.ILSOrigin.setAttribute("alignment-baseline", "central");
            this.InfoGroup.appendChild(this.ILSOrigin);
        }
        this.appendChild(this.rootSVG);
    }
    construct_A320_Neo() {
        var posX = 0;
        var posY = 0;
        var width = 500;
        var height = 500;
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 " + width + " " + height);
        this.centerGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.centerGroup.setAttribute("id", "ILSGroup");
        this.centerGroup.setAttribute("transform", "translate(35 88) scale(0.75)");
        this.rootSVG.appendChild(this.centerGroup);
        {
            posX = 407;
            posY = 35;
            width = 40;
            height = 375;
            this.neutralLine = document.createElementNS(Avionics.SVG.NS, "line");
            this.neutralLine.setAttribute("id", "NeutralLine");
            this.neutralLine.setAttribute("x1", posX.toString());
            this.neutralLine.setAttribute("y1", (posY + height * 0.5).toString());
            this.neutralLine.setAttribute("x2", (posX + width).toString());
            this.neutralLine.setAttribute("y2", (posY + height * 0.5).toString());
            this.neutralLine.setAttribute("stroke", "yellow");
            this.neutralLine.setAttribute("stroke-width", "5");
            this.centerGroup.appendChild(this.neutralLine);
            this.gs_mainGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.gs_mainGroup.setAttribute("id", "GlideSlopeGroup");
            {
                let rangeFactor = 0.7;
                let nbCircles = 2;
                this.gs_cursorMinY = posY + (height * 0.5) + (rangeFactor * height * 0.5);
                this.gs_cursorMaxY = posY + (height * 0.5) - (rangeFactor * height * 0.5);
                this.gs_cursorPosX = posX + width * 0.5;
                this.gs_cursorPosY = posY + height * 0.5;
                for (let i = 0; i < nbCircles; i++) {
                    let y = posY + (height * 0.5) + ((rangeFactor * height * 0.5) * (i + 1)) / nbCircles;
                    let circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", this.gs_cursorPosX.toString());
                    circle.setAttribute("cy", y.toString());
                    circle.setAttribute("r", "5");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    this.gs_mainGroup.appendChild(circle);
                    y = posY + (height * 0.5) - ((rangeFactor * height * 0.5) * (i + 1)) / nbCircles;
                    circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", this.gs_cursorPosX.toString());
                    circle.setAttribute("cy", y.toString());
                    circle.setAttribute("r", "5");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    this.gs_mainGroup.appendChild(circle);
                }
                this.gs_cursorGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.gs_cursorGroup.setAttribute("id", "CursorGroup");
                this.gs_cursorGroup.setAttribute("transform", "translate(" + this.gs_cursorPosX + ", " + this.gs_cursorPosY + ")");
                this.gs_mainGroup.appendChild(this.gs_cursorGroup);
                {
                    let x = 12;
                    let y = 20;
                    this.gs_cursorShapeUp = document.createElementNS(Avionics.SVG.NS, "path");
                    this.gs_cursorShapeUp.setAttribute("fill", "transparent");
                    this.gs_cursorShapeUp.setAttribute("stroke", "#FF0CE2");
                    this.gs_cursorShapeUp.setAttribute("stroke-width", "2");
                    this.gs_cursorShapeUp.setAttribute("d", "M " + (-x) + " 0 L0 " + (-y) + " L" + (x) + " 0");
                    this.gs_cursorGroup.appendChild(this.gs_cursorShapeUp);
                    this.gs_cursorShapeDown = document.createElementNS(Avionics.SVG.NS, "path");
                    this.gs_cursorShapeDown.setAttribute("fill", "transparent");
                    this.gs_cursorShapeDown.setAttribute("stroke", "#FF0CE2");
                    this.gs_cursorShapeDown.setAttribute("stroke-width", "2");
                    this.gs_cursorShapeDown.setAttribute("d", "M " + (-x) + " 0 L0 " + (y) + " L" + (x) + " 0");
                    this.gs_cursorGroup.appendChild(this.gs_cursorShapeDown);
                    this.gs_glidePathCursorUp = document.createElementNS(Avionics.SVG.NS, "path");
                    this.gs_glidePathCursorUp.setAttribute("fill", "transparent");
                    this.gs_glidePathCursorUp.setAttribute("stroke", "#FF0CE2");
                    this.gs_glidePathCursorUp.setAttribute("stroke-width", "2");
                    this.gs_glidePathCursorUp.setAttribute("d", "M " + (-x) + " 0 L" + (-x) + " " + (-y / 2) + " L" + (x) + " " + (-y / 2) + " L " + (x) + " 0");
                    this.gs_cursorGroup.appendChild(this.gs_glidePathCursorUp);
                    this.gs_glidePathCursorDown = document.createElementNS(Avionics.SVG.NS, "path");
                    this.gs_glidePathCursorDown.setAttribute("fill", "transparent");
                    this.gs_glidePathCursorDown.setAttribute("stroke", "#FF0CE2");
                    this.gs_glidePathCursorDown.setAttribute("stroke-width", "2");
                    this.gs_glidePathCursorDown.setAttribute("d", "M " + (-x) + " 0 L" + (-x) + " " + (y / 2) + " L" + (x) + " " + (y / 2) + " L " + (x) + " 0");
                    this.gs_cursorGroup.appendChild(this.gs_glidePathCursorDown);
                }
            }
            this.centerGroup.appendChild(this.gs_mainGroup);
            posX = 60;
            posY = 425;
            width = 375;
            height = 35;
            this.loc_mainGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.loc_mainGroup.setAttribute("id", "LocalizerGroup");
            {
                let neutralLine = document.createElementNS(Avionics.SVG.NS, "line");
                neutralLine.setAttribute("id", "NeutralLine");
                neutralLine.setAttribute("x1", (posX + width * 0.5).toString());
                neutralLine.setAttribute("y1", posY.toString());
                neutralLine.setAttribute("x2", (posX + width * 0.5).toString());
                neutralLine.setAttribute("y2", (posY + height).toString());
                neutralLine.setAttribute("stroke", "yellow");
                neutralLine.setAttribute("stroke-width", "5");
                this.loc_mainGroup.appendChild(neutralLine);
                let rangeFactor = 0.7;
                let nbCircles = 2;
                this.loc_cursorMinX = posX + (width * 0.5) - (rangeFactor * width * 0.5);
                this.loc_cursorMaxX = posX + (width * 0.5) + (rangeFactor * width * 0.5);
                this.loc_cursorPosX = posX + width * 0.5;
                this.loc_cursorPosY = posY + height * 0.5;
                for (let i = 0; i < nbCircles; i++) {
                    let x = posX + (width * 0.5) + ((rangeFactor * width * 0.5) * (i + 1)) / nbCircles;
                    let circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", x.toString());
                    circle.setAttribute("cy", this.loc_cursorPosY.toString());
                    circle.setAttribute("r", "5");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    this.loc_mainGroup.appendChild(circle);
                    x = posX + (width * 0.5) - ((rangeFactor * width * 0.5) * (i + 1)) / nbCircles;
                    circle = document.createElementNS(Avionics.SVG.NS, "circle");
                    circle.setAttribute("cx", x.toString());
                    circle.setAttribute("cy", this.loc_cursorPosY.toString());
                    circle.setAttribute("r", "5");
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-width", "2");
                    this.loc_mainGroup.appendChild(circle);
                }
                this.loc_cursorGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.loc_cursorGroup.setAttribute("id", "CursorGroup");
                this.loc_cursorGroup.setAttribute("transform", "translate(" + this.loc_cursorPosX + ", " + this.loc_cursorPosY + ")");
                this.loc_mainGroup.appendChild(this.loc_cursorGroup);
                {
                    let x = 20;
                    let y = 12;
                    this.loc_cursorShapeRight = document.createElementNS(Avionics.SVG.NS, "path");
                    this.loc_cursorShapeRight.setAttribute("fill", "transparent");
                    this.loc_cursorShapeRight.setAttribute("stroke", "#FF0CE2");
                    this.loc_cursorShapeRight.setAttribute("stroke-width", "2");
                    this.loc_cursorShapeRight.setAttribute("d", "M 0 " + (-y) + " L" + (-x) + " 0 L0 " + (y));
                    this.loc_cursorGroup.appendChild(this.loc_cursorShapeRight);
                    this.loc_cursorShapeLeft = document.createElementNS(Avionics.SVG.NS, "path");
                    this.loc_cursorShapeLeft.setAttribute("fill", "transparent");
                    this.loc_cursorShapeLeft.setAttribute("stroke", "#FF0CE2");
                    this.loc_cursorShapeLeft.setAttribute("stroke-width", "2");
                    this.loc_cursorShapeLeft.setAttribute("d", "M 0 " + (-y) + " L" + (x) + " 0 L0 " + (y));
                    this.loc_cursorGroup.appendChild(this.loc_cursorShapeLeft);
                }
            }
            this.centerGroup.appendChild(this.loc_mainGroup);
        }
        this.InfoGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.InfoGroup.setAttribute("id", "InfoGroup");
        this.InfoGroup.setAttribute("transform", "translate(13 455)");
        this.rootSVG.appendChild(this.InfoGroup);
        {
            this.ILSIdent = document.createElementNS(Avionics.SVG.NS, "text");
            this.ILSIdent.textContent = "ILS";
            this.ILSIdent.setAttribute("x", "0");
            this.ILSIdent.setAttribute("y", "0");
            this.ILSIdent.setAttribute("fill", "#FF0CE2");
            this.ILSIdent.setAttribute("font-size", "16");
            this.ILSIdent.setAttribute("font-family", "Roboto-Light");
            this.ILSIdent.setAttribute("text-anchor", "start");
            this.ILSIdent.setAttribute("alignment-baseline", "central");
            this.InfoGroup.appendChild(this.ILSIdent);
            this.ILSFreq = document.createElementNS(Avionics.SVG.NS, "text");
            this.ILSFreq.textContent = "109.50";
            this.ILSFreq.setAttribute("x", "0");
            this.ILSFreq.setAttribute("y", "15");
            this.ILSFreq.setAttribute("fill", "#FF0CE2");
            this.ILSFreq.setAttribute("font-size", "16");
            this.ILSFreq.setAttribute("font-family", "Roboto-Light");
            this.ILSFreq.setAttribute("text-anchor", "start");
            this.ILSFreq.setAttribute("alignment-baseline", "central");
            this.InfoGroup.appendChild(this.ILSFreq);
            this.ILSDist = document.createElementNS(Avionics.SVG.NS, "text");
            this.ILSDist.textContent = "109 NM";
            this.ILSDist.setAttribute("x", "0");
            this.ILSDist.setAttribute("y", "30");
            this.ILSDist.setAttribute("fill", "#FF0CE2");
            this.ILSDist.setAttribute("font-size", "16");
            this.ILSDist.setAttribute("font-family", "Roboto-Light");
            this.ILSDist.setAttribute("text-anchor", "start");
            this.ILSDist.setAttribute("alignment-baseline", "central");
            this.InfoGroup.appendChild(this.ILSDist);
        }
        this.appendChild(this.rootSVG);
    }
    update(_deltaTime) {

        let navCheck = SimVar.GetSimVarValue('L:RADIONAV_SOURCE', 'Number');
        if (navCheck === 1) {
            this.gs_cursorShapeUp.setAttribute("display", "none");
            this.gs_cursorShapeDown.setAttribute("display", "none");
            this.loc_cursorShapeRight.setAttribute("display", "none");
            this.loc_cursorShapeLeft.setAttribute("display", "none");
            this.lateral_snowFlake.setAttribute("display", "");
            this.vertical_snowFlake.setAttribute("display", "");

            // The snowflake should only show when in FMS and in either PPOS or flying an RNAV approach. But we can't detect mapDisplayMode through this

            /*if (this.mapDisplayMode === Jet_NDCompass_Display.PPOS) {
                this.loc_mainGroup.setAttribute("display", "");
            } else {
                this.loc_mainGroup.setAttribute("display", "none");
            }*/ 

        } else {
            this.gs_cursorShapeUp.setAttribute("display", "");
            this.gs_cursorShapeDown.setAttribute("display", "");
            this.loc_cursorShapeRight.setAttribute("display", "");
            this.loc_cursorShapeLeft.setAttribute("display", "");
            this.lateral_snowFlake.setAttribute("display", "none");
            this.vertical_snowFlake.setAttribute("display", "none");
       }

       const navSensitivity = SimVar.GetSimVarValue("L:WT_NAV_SENSITIVITY", "number");

        if (this.gsVisible || this.locVisible || this.infoVisible) {
            let localizer = this.gps.radioNav.getBestILSBeacon();
            let isApproachLoaded = Simplane.getAutoPilotApproachLoaded();
            let approachType = Simplane.getAutoPilotApproachType();
            
            /*if (this.gs_cursorGroup && this.gsVisible && navCheck === 1) {
                console.log("We are in Nav");
            }*/

            if (this.gs_cursorGroup && this.gsVisible) {
                //if (isApproachLoaded && approachType == 10) {
                if (SimVar.GetSimVarValue('L:WT_CJ4_SNOWFLAKE', 'number') == 1) {
                    this.vertical_snowFlake.setAttribute("visibility", "visible");
                } else {
                    this.vertical_snowFlake.setAttribute("visibility", "hidden");
                }
                if (navCheck === 1) {
                    let gsiFeet = -SimVar.GetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet");
                    let gsi = gsiFeet / 3.28;
                    let delta = 0.5 + ((gsi / 500.0) / 2);

                    switch (navSensitivity) {
                        case 3:
                            delta = 0.5 + ((gsi / 250.0) / 2);
                            break;
                        case 4: {
                            const sensitivityScalar = SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY_SCALAR', 'number');
                            delta = 0.5 + ((gsi / (250.0 * sensitivityScalar)) / 2);
                            break;
                        }
                    }
                
                    let y = this.gs_cursorMinY + (this.gs_cursorMaxY - this.gs_cursorMinY) * delta;
                    y = Math.min(this.gs_cursorMinY, Math.max(this.gs_cursorMaxY, y));
                    this.gs_cursorGroup.setAttribute("transform", "translate(" + this.gs_cursorPosX + ", " + y + ")");
                }
                else if (localizer.id > 0 && SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:" + localizer.id, "Bool")) {
                    let gsi = -SimVar.GetSimVarValue("NAV GSI:" + localizer.id, "number") / 127.0;
                    let delta = (gsi + 1.0) * 0.5;
                    let y = this.gs_cursorMinY + (this.gs_cursorMaxY - this.gs_cursorMinY) * delta;
                    y = Math.min(this.gs_cursorMinY, Math.max(this.gs_cursorMaxY, y));
                    this.gs_cursorGroup.setAttribute("transform", "translate(" + this.gs_cursorPosX + ", " + y + ")");
                    if (delta >= 0.95) {
                        this.gs_cursorShapeUp.setAttribute("visibility", "visible");
                        this.gs_cursorShapeDown.setAttribute("visibility", "hidden");
                    }
                    else if (delta <= 0.05) {
                        this.gs_cursorShapeUp.setAttribute("visibility", "hidden");
                        this.gs_cursorShapeDown.setAttribute("visibility", "visible");
                    }
                    else {
                        this.gs_cursorShapeUp.setAttribute("visibility", "visible");
                        this.gs_cursorShapeDown.setAttribute("visibility", "visible");
                    }
                    this.gs_glidePathCursorUp.setAttribute("visibility", "hidden");
                    this.gs_glidePathCursorDown.setAttribute("visibility", "hidden");
                }
                else {
                    this.gs_cursorShapeUp.setAttribute("visibility", "hidden");
                    this.gs_cursorShapeDown.setAttribute("visibility", "hidden");
                    this.gs_glidePathCursorUp.setAttribute("visibility", "hidden");
                    this.gs_glidePathCursorDown.setAttribute("visibility", "hidden");
                }
            }
            if (this.loc_cursorGroup && this.locVisible) {
                const hasCDI = ((!isApproachLoaded || approachType != 10) && localizer.id > 0)
                    || navSensitivity === 4;
                
                if (hasCDI) {
                    let cdi = 0;

                    if (navSensitivity === 4) {
                        const xtk = SimVar.GetSimVarValue("L:WT_CJ4_XTK", "number");
                        const sensitivityScalar = SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY_SCALAR', 'number');
                        const deviation = (-(xtk / 2) / 0.3) / sensitivityScalar;

                        cdi = Math.min(Math.max(deviation, -1.0), 1.0);
                    }
                    else {
                        cdi = SimVar.GetSimVarValue("NAV CDI:" + localizer.id, "number") / 127.0;
                    }
                    
                    let delta = (cdi + 1.0) * 0.5;
                    let x = this.loc_cursorMinX + (this.loc_cursorMaxX - this.loc_cursorMinX) * delta;
                    x = Math.max(this.loc_cursorMinX, Math.min(this.loc_cursorMaxX, x));
                    this.loc_cursorGroup.setAttribute("transform", "translate(" + x + ", " + this.loc_cursorPosY + ")");
                    if (delta >= 0.95) {
                        this.loc_cursorShapeLeft.setAttribute("visibility", "visible");
                        this.loc_cursorShapeRight.setAttribute("visibility", "hidden");
                    }
                    else if (delta <= 0.05) {
                        this.loc_cursorShapeLeft.setAttribute("visibility", "hidden");
                        this.loc_cursorShapeRight.setAttribute("visibility", "visible");
                    }
                    else {
                        this.loc_cursorShapeLeft.setAttribute("visibility", "visible");
                        this.loc_cursorShapeRight.setAttribute("visibility", "visible");
                    }
                }
                else {
                    this.loc_cursorShapeLeft.setAttribute("visibility", "hidden");
                    this.loc_cursorShapeRight.setAttribute("visibility", "hidden");
                }
                if (this.isHud) {
                    let ySlide = B787_10_HUD_ILS.getYSlide();
                    this.loc_mainGroup.setAttribute("transform", "translate(0, " + ySlide + ")");
                }
            }
            if (this.InfoGroup && this.infoVisible) {
                if (localizer.id > 0) {
                    this.InfoGroup.setAttribute("visibility", "visible");
                    if (this.ILSIdent)
                        this.ILSIdent.textContent = localizer.ident;
                    if (this.ILSFreq)
                        this.ILSFreq.textContent = localizer.freq.toFixed(2);
                    if (this.ILSDist)
                        this.ILSDist.textContent = SimVar.GetSimVarValue("NAV HAS DME:" + localizer.id, "Bool") ? SimVar.GetSimVarValue("NAV DME:" + localizer.id, "nautical miles").toFixed(1) + "NM" : "";
                }
                else {
                    this.InfoGroup.setAttribute("visibility", "hidden");
                }
            }
        }
    }
    showLocalizer(_val) {
        this.locVisible = _val;
        if (_val) {
            this.loc_mainGroup.setAttribute("visibility", "visible");
        }
        else {
            this.loc_mainGroup.setAttribute("visibility", "hidden");
            this.loc_cursorShapeLeft.removeAttribute("visibility");
            this.loc_cursorShapeRight.removeAttribute("visibility");
        }
    }
    showGlideslope(_val) {
        _val = true; // TODO: REMOVE THIS
        this.gsVisible = _val;
        if (_val) {
            this.gs_mainGroup.setAttribute("visibility", "visible");
        }
        else {
            this.gs_mainGroup.setAttribute("visibility", "hidden");
            this.gs_cursorShapeUp.removeAttribute("visibility");
            this.gs_cursorShapeDown.removeAttribute("visibility");
        }
    }
    showNavInfo(_val) {
        this.infoVisible = _val;
        if (this.InfoGroup) {
            if (_val) {
                this.InfoGroup.setAttribute("visibility", "visible");
            }
            else {
                this.InfoGroup.setAttribute("visibility", "hidden");
            }
        }
    }
}
customElements.define("jet-pfd-ils-indicator", Jet_PFD_ILSIndicator);
//# sourceMappingURL=ILSIndicator.js.map