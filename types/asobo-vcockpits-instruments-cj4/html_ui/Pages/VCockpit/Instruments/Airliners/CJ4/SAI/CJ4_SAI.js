/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class CJ4_SAI extends BaseAirliners {
    get templateID() { return "CJ4_SAI"; }
    connectedCallback() {
        super.connectedCallback();
        this.radioNav.init(NavMode.TWO_SLOTS);
        this.addIndependentElementContainer(new NavSystemElementContainer("Altimeter", "Altimeter", new CJ4_SAI_Altimeter()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Airspeed", "Airspeed", new CJ4_SAI_Airspeed()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Horizon", "Horizon", new CJ4_SAI_Attitude()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Compass", "Compass", new CJ4_SAI_Compass()));
    }
}
class CJ4_SAI_Airspeed extends NavSystemElement {
    constructor() {
        super();
    }
    init(root) {
        this.airspeedElement = this.gps.getChildById("Airspeed");
    }
    onEnter() {
    }
    isReady() {
        return true;
    }
    onUpdate(_deltaTime) {
        this.airspeedElement.update(_deltaTime);
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class CJ4_SAI_AirspeedIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.greenColor = "green";
        this.yellowColor = "yellow";
        this.redColor = "red";
        this.fontSize = 25;
        this.graduationScrollPosX = 0;
        this.graduationScrollPosY = 0;
        this.graduationSpacing = 24;
        this.graduationMinValue = 30;
        this.nbPrimaryGraduations = 11;
        this.nbSecondaryGraduations = 1;
        this.totalGraduations = this.nbPrimaryGraduations + ((this.nbPrimaryGraduations - 1) * this.nbSecondaryGraduations);
    }
    connectedCallback() {
        this.graduationScroller = new Avionics.Scroller(this.nbPrimaryGraduations, 20);
        this.cursorIntegrals = new Array();
        this.cursorIntegrals.push(new Avionics.AirspeedScroller(65, 100));
        this.cursorIntegrals.push(new Avionics.AirspeedScroller(65, 10));
        this.cursorDecimals = new Avionics.AirspeedScroller(30);
        this.construct();
    }
    construct() {
        Utils.RemoveAllChildren(this);
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 250 500");
        var width = 40;
        var height = 250;
        var posX = width * 0.5;
        var posY = 0;
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "Airspeed");
        }
        else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        if (!this.centerSVG) {
            this.centerSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.centerSVG.setAttribute("id", "CenterGroup");
        }
        else
            Utils.RemoveAllChildren(this.centerSVG);
        this.centerSVG.setAttribute("x", (posX - width * 0.5).toString());
        this.centerSVG.setAttribute("y", posY.toString());
        this.centerSVG.setAttribute("width", width.toString());
        this.centerSVG.setAttribute("height", height.toString());
        this.centerSVG.setAttribute("viewBox", "0 0 " + width + " " + height);
        {
            var _top = 0;
            var _left = 0;
            var _width = width;
            var _height = height;
            var bg = document.createElementNS(Avionics.SVG.NS, "rect");
            bg.setAttribute("x", _left.toString());
            bg.setAttribute("y", _top.toString());
            bg.setAttribute("width", _width.toString());
            bg.setAttribute("height", _height.toString());
            bg.setAttribute("fill", "black");
            this.centerSVG.appendChild(bg);
            if (this.airspeeds) {
                var arcGroup = document.createElementNS(Avionics.SVG.NS, "g");
                arcGroup.setAttribute("id", "Arcs");
                {
                    this.arcs = [];
                    var _arcWidth = 18;
                    var _arcPosX = _left + _width + 3;
                    var _arcStartPosY = _top + _height * 0.5;
                    var arcHeight = this.arcToSVG(this.airspeeds.greenEnd - this.airspeeds.greenStart);
                    var arcPosY = _arcStartPosY - this.arcToSVG(this.airspeeds.greenStart) - arcHeight;
                    var arc = document.createElementNS(Avionics.SVG.NS, "rect");
                    arc.setAttribute("x", _arcPosX.toString());
                    arc.setAttribute("y", arcPosY.toString());
                    arc.setAttribute("width", _arcWidth.toString());
                    arc.setAttribute("height", arcHeight.toString());
                    arc.setAttribute("fill", this.greenColor);
                    this.arcs.push(arc);
                    var arcHeight = this.arcToSVG(this.airspeeds.yellowEnd - this.airspeeds.yellowStart);
                    var arcPosY = _arcStartPosY - this.arcToSVG(this.airspeeds.yellowStart) - arcHeight;
                    var arc = document.createElementNS(Avionics.SVG.NS, "rect");
                    arc.setAttribute("x", _arcPosX.toString());
                    arc.setAttribute("y", arcPosY.toString());
                    arc.setAttribute("width", _arcWidth.toString());
                    arc.setAttribute("height", arcHeight.toString());
                    arc.setAttribute("fill", this.yellowColor);
                    this.arcs.push(arc);
                    var arcHeight = this.arcToSVG(this.airspeeds.redEnd - this.airspeeds.redStart);
                    var arcPosY = _arcStartPosY - this.arcToSVG(this.airspeeds.redStart) - arcHeight;
                    var arc = document.createElementNS(Avionics.SVG.NS, "rect");
                    arc.setAttribute("x", _arcPosX.toString());
                    arc.setAttribute("y", arcPosY.toString());
                    arc.setAttribute("width", _arcWidth.toString());
                    arc.setAttribute("height", arcHeight.toString());
                    arc.setAttribute("fill", this.redColor);
                    this.arcs.push(arc);
                    var arcHeight = this.arcToSVG(this.airspeeds.whiteEnd - this.airspeeds.whiteStart);
                    var arcPosY = _arcStartPosY - this.arcToSVG(this.airspeeds.whiteStart) - arcHeight;
                    var arc = document.createElementNS(Avionics.SVG.NS, "rect");
                    arc.setAttribute("x", (_arcPosX + _arcWidth * 0.5).toString());
                    arc.setAttribute("y", arcPosY.toString());
                    arc.setAttribute("width", (_arcWidth * 0.5).toString());
                    arc.setAttribute("height", arcHeight.toString());
                    arc.setAttribute("fill", "white");
                    this.arcs.push(arc);
                    for (var i = 0; i < this.arcs.length; i++) {
                        arcGroup.appendChild(this.arcs[i]);
                    }
                    this.centerSVG.appendChild(arcGroup);
                }
            }
            var graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationGroup.setAttribute("id", "Graduations");
            {
                this.graduationScrollPosX = _left + _width;
                this.graduationScrollPosY = _top + _height * 0.5;
                this.graduations = [];
                for (var i = 0; i < this.totalGraduations; i++) {
                    var line = new Avionics.SVGGraduation();
                    line.IsPrimary = (i % (this.nbSecondaryGraduations + 1)) ? false : true;
                    var lineWidth = line.IsPrimary ? 8 : 5;
                    var lineHeight = line.IsPrimary ? 2 : 2;
                    var linePosX = -lineWidth;
                    line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                    line.SVGLine.setAttribute("x", linePosX.toString());
                    line.SVGLine.setAttribute("width", lineWidth.toString());
                    line.SVGLine.setAttribute("height", lineHeight.toString());
                    line.SVGLine.setAttribute("fill", "white");
                    if (line.IsPrimary) {
                        line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                        line.SVGText1.setAttribute("x", (linePosX - 2).toString());
                        line.SVGText1.setAttribute("fill", "white");
                        line.SVGText1.setAttribute("font-size", (this.fontSize * 0.65).toString());
                        line.SVGText1.setAttribute("font-family", "Roboto-Light");
                        line.SVGText1.setAttribute("text-anchor", "end");
                        line.SVGText1.setAttribute("alignment-baseline", "central");
                    }
                    this.graduations.push(line);
                }
                for (var i = 0; i < this.totalGraduations; i++) {
                    var line = this.graduations[i];
                    graduationGroup.appendChild(line.SVGLine);
                    if (line.SVGText1) {
                        graduationGroup.appendChild(line.SVGText1);
                    }
                }
                this.centerSVG.appendChild(graduationGroup);
            }
            var cursorPosX = _left - 13;
            var cursorPosY = _top + _height * 0.5;
            var cursorWidth = _width + 13;
            var cursorHeight = 38;
            if (!this.cursorSVG) {
                this.cursorSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.cursorSVG.setAttribute("id", "CursorGroup");
            }
            else
                Utils.RemoveAllChildren(this.cursorSVG);
            this.cursorSVG.setAttribute("x", cursorPosX.toString());
            this.cursorSVG.setAttribute("y", (cursorPosY - cursorHeight * 0.5).toString());
            this.cursorSVG.setAttribute("width", cursorWidth.toString());
            this.cursorSVG.setAttribute("height", cursorHeight.toString());
            this.cursorSVG.setAttribute("viewBox", "0 4 " + cursorWidth + " " + cursorHeight);
            {
                let _scale = 0.6;
                var trs = document.createElementNS(Avionics.SVG.NS, "g");
                trs.setAttribute("transform", "scale(" + _scale + ")");
                this.cursorSVG.appendChild(trs);
                if (!this.cursorSVGShape)
                    this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.cursorSVGShape.setAttribute("fill", "black");
                this.cursorSVGShape.setAttribute("d", "M24 22 L62 22 L62 7 L86 7 L86 70 L62 70 L62 56 L24 56 Z");
                this.cursorSVGShape.setAttribute("stroke", "white");
                this.cursorSVGShape.setAttribute("stroke-width", "0.85");
                trs.appendChild(this.cursorSVGShape);
                var _cursorWidth = (cursorWidth / _scale);
                var _cursorHeight = (cursorHeight / _scale + 10);
                var _cursorPosX = -2;
                var _cursorPosY = cursorHeight * 0.5 + 20;
                let integralsGroup = document.createElementNS(Avionics.SVG.NS, "svg");
                integralsGroup.setAttribute("x", "0");
                integralsGroup.setAttribute("y", "23");
                integralsGroup.setAttribute("width", _cursorWidth.toString());
                integralsGroup.setAttribute("height", (_cursorHeight - 41).toString());
                integralsGroup.setAttribute("viewBox", "0 0 " + (_cursorWidth) + " " + (_cursorHeight));
                trs.appendChild(integralsGroup);
                {
                    this.cursorIntegrals[0].construct(integralsGroup, _cursorPosX + 50, _cursorPosY - 5, _width, "Roboto-Bold", this.fontSize * 3, "green");
                    this.cursorIntegrals[1].construct(integralsGroup, _cursorPosX + 92, _cursorPosY - 5, _width, "Roboto-Bold", this.fontSize * 3, "green");
                }
                this.cursorDecimals.construct(trs, _cursorPosX + 86, _cursorPosY - 1, _width, "Roboto-Bold", this.fontSize * 1.4, "green");
                this.centerSVG.appendChild(this.cursorSVG);
            }
        }
        this.rootGroup.appendChild(this.centerSVG);
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    update(dTime) {
        var indicatedSpeed = Simplane.getIndicatedSpeed();
        this.updateArcScrolling(indicatedSpeed);
        this.updateGraduationScrolling(indicatedSpeed);
        this.updateCursorScrolling(indicatedSpeed);
    }
    arcToSVG(_value) {
        var pixels = (_value * this.graduationSpacing * (this.nbSecondaryGraduations + 1)) / 10;
        return pixels;
    }
    updateGraduationScrolling(_speed) {
        if (this.graduations) {
            this.graduationScroller.scroll(_speed);
            var currentVal = this.graduationScroller.firstValue;
            var currentY = this.graduationScrollPosY + this.graduationScroller.offsetY * this.graduationSpacing * (this.nbSecondaryGraduations + 1);
            for (var i = 0; i < this.totalGraduations; i++) {
                var posX = this.graduationScrollPosX;
                var posY = currentY;
                this.graduations[i].SVGLine.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                if (this.graduations[i].SVGText1) {
                    if ((currentVal % 4) == 0)
                        this.graduations[i].SVGText1.textContent = currentVal.toString();
                    else
                        this.graduations[i].SVGText1.textContent = "";
                    this.graduations[i].SVGText1.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    currentVal = this.graduationScroller.nextValue;
                }
                currentY -= this.graduationSpacing;
            }
        }
    }
    updateArcScrolling(_speed) {
        if (this.arcs) {
            var offset = this.arcToSVG(_speed);
            for (var i = 0; i < this.arcs.length; i++) {
                this.arcs[i].setAttribute("transform", "translate(0 " + offset.toString() + ")");
            }
        }
    }
    updateCursorScrolling(_speed) {
        if (_speed <= this.graduationMinValue) {
            if (this.cursorIntegrals) {
                for (let i = 0; i < this.cursorIntegrals.length; i++) {
                    this.cursorIntegrals[i].clear("-");
                }
            }
            if (this.cursorDecimals) {
                this.cursorDecimals.clear("");
            }
        }
        else {
            if (this.cursorIntegrals) {
                this.cursorIntegrals[0].update(_speed, 100, 100);
                this.cursorIntegrals[1].update(_speed, 10, 10);
            }
            if (this.cursorDecimals) {
                this.cursorDecimals.update(_speed);
            }
        }
    }
}
customElements.define('cj4-sai-airspeed-indicator', CJ4_SAI_AirspeedIndicator);
class CJ4_SAI_Altimeter extends NavSystemElement {
    constructor() {
        super();
    }
    init(root) {
        this.altimeterElement = this.gps.getChildById("Altimeter");
    }
    onEnter() {
    }
    isReady() {
        return true;
    }
    onUpdate(_deltaTime) {
        this.altimeterElement.update(_deltaTime);
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "BARO_INC":
                SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", 1);
                break;
            case "BARO_DEC":
                SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", 1);
                break;
        }
    }
}
class CJ4_SAI_AltimeterIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.fontSize = 25;
        this.graduationScrollPosX = 0;
        this.graduationScrollPosY = 0;
        this.nbPrimaryGraduations = 7;
        this.nbSecondaryGraduations = 4;
        this.totalGraduations = this.nbPrimaryGraduations + ((this.nbPrimaryGraduations - 1) * this.nbSecondaryGraduations);
        this.graduationSpacing = 22;
    }
    connectedCallback() {
        this.graduationScroller = new Avionics.Scroller(this.nbPrimaryGraduations, 500, true);
        this.cursorIntegrals = new Array();
        this.cursorIntegrals.push(new Avionics.AltitudeScroller(3, 68, 1, 10, 1000));
        this.cursorIntegrals.push(new Avionics.AltitudeScroller(3, 68, 1, 10, 100));
        this.cursorIntegrals.push(new Avionics.AltitudeScroller(3, 68, 1, 10, 10));
        this.cursorDecimals = new Avionics.AltitudeScroller(3, 28, 10, 100);
        this.construct();
    }
    construct() {
        Utils.RemoveAllChildren(this);
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 250 500");
        var width = 66;
        var height = 250;
        var posX = width * 0.5;
        var posY = 0;
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "Altimeter");
        }
        else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        if (!this.centerSVG) {
            this.centerSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.centerSVG.setAttribute("id", "CenterGroup");
        }
        else
            Utils.RemoveAllChildren(this.centerSVG);
        this.centerSVG.setAttribute("x", posX.toString());
        this.centerSVG.setAttribute("y", posY.toString());
        this.centerSVG.setAttribute("width", width.toString());
        this.centerSVG.setAttribute("height", height.toString());
        this.centerSVG.setAttribute("viewBox", "0 0 " + width + " " + height);
        this.centerSVG.setAttribute("overflow", "hidden");
        {
            var _top = 0;
            var _left = 0;
            var _width = width;
            var _height = height;
            var bg = document.createElementNS(Avionics.SVG.NS, "rect");
            bg.setAttribute("x", _left.toString());
            bg.setAttribute("y", _top.toString());
            bg.setAttribute("width", _width.toString());
            bg.setAttribute("height", _height.toString());
            bg.setAttribute("fill", "black");
            this.centerSVG.appendChild(bg);
            if (!this.graduationBarSVG)
                this.graduationBarSVG = document.createElementNS(Avionics.SVG.NS, "path");
            this.graduationBarSVG.setAttribute("fill", "transparent");
            this.graduationBarSVG.setAttribute("d", "M0 0 l20 20 l0 70 l-20 20 l20 20 l0 70 l-20 20 l20 20 l0 70 l-20 20 l20 20 l0 70 l-20 20 l20 20 l0 70");
            this.graduationBarSVG.setAttribute("stroke", "white");
            this.graduationBarSVG.setAttribute("stroke-width", "0.85");
            this.centerSVG.appendChild(this.graduationBarSVG);
            this.graduationScrollPosX = _left;
            this.graduationScrollPosY = _top + _height * 0.5;
            this.graduations = [];
            for (var i = 0; i < this.totalGraduations; i++) {
                var line = new Avionics.SVGGraduation();
                line.IsPrimary = true;
                if (this.nbSecondaryGraduations > 0 && (i % (this.nbSecondaryGraduations + 1)))
                    line.IsPrimary = false;
                var lineWidth = line.IsPrimary ? 0 : 12;
                line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                line.SVGLine.setAttribute("x", "0");
                line.SVGLine.setAttribute("width", lineWidth.toString());
                line.SVGLine.setAttribute("height", "2");
                line.SVGLine.setAttribute("fill", "white");
                if (line.IsPrimary) {
                    line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                    line.SVGText1.setAttribute("x", (lineWidth + 30).toString());
                    line.SVGText1.setAttribute("fill", "white");
                    line.SVGText1.setAttribute("font-size", (this.fontSize * 0.85).toString());
                    line.SVGText1.setAttribute("font-family", "Roboto-Light");
                    line.SVGText1.setAttribute("text-anchor", "end");
                    line.SVGText1.setAttribute("alignment-baseline", "central");
                    line.SVGText2 = document.createElementNS(Avionics.SVG.NS, "text");
                    line.SVGText2.setAttribute("x", (lineWidth + 30).toString());
                    line.SVGText2.setAttribute("fill", "white");
                    line.SVGText2.setAttribute("font-size", (this.fontSize * 0.6).toString());
                    line.SVGText2.setAttribute("font-family", "Roboto-Light");
                    line.SVGText2.setAttribute("text-anchor", "start");
                    line.SVGText2.setAttribute("alignment-baseline", "central");
                }
                this.graduations.push(line);
            }
            var graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationGroup.setAttribute("id", "graduationGroup");
            for (var i = 0; i < this.totalGraduations; i++) {
                var line = this.graduations[i];
                graduationGroup.appendChild(line.SVGLine);
                if (line.SVGText1)
                    graduationGroup.appendChild(line.SVGText1);
                if (line.SVGText2)
                    graduationGroup.appendChild(line.SVGText2);
            }
            this.centerSVG.appendChild(graduationGroup);
        }
        this.rootGroup.appendChild(this.centerSVG);
        var cursorPosX = _left + 20;
        var cursorPosY = _top + _height * 0.5;
        var cursorWidth = width * 1.1;
        var cursorHeight = 39;
        if (!this.cursorSVG) {
            this.cursorSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.cursorSVG.setAttribute("id", "CursorGroup");
        }
        else
            Utils.RemoveAllChildren(this.cursorSVG);
        this.cursorSVG.setAttribute("x", cursorPosX.toString());
        this.cursorSVG.setAttribute("y", (cursorPosY - cursorHeight * 0.5).toString());
        this.cursorSVG.setAttribute("width", cursorWidth.toString());
        this.cursorSVG.setAttribute("height", cursorHeight.toString());
        this.cursorSVG.setAttribute("viewBox", "0 4 " + cursorWidth + " " + cursorHeight);
        {
            let _scale = 0.6;
            var trs = document.createElementNS(Avionics.SVG.NS, "g");
            trs.setAttribute("transform", "scale(" + _scale + ")");
            this.cursorSVG.appendChild(trs);
            if (!this.cursorSVGShape)
                this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
            this.cursorSVGShape.setAttribute("fill", "black");
            this.cursorSVGShape.setAttribute("d", "M0 22 L65 22 L65 7 L120 7 L120 71 L65 71 L65 56 L0 56 Z");
            this.cursorSVGShape.setAttribute("stroke", "white");
            this.cursorSVGShape.setAttribute("stroke-width", "0.85");
            trs.appendChild(this.cursorSVGShape);
            var _cursorWidth = (cursorWidth / _scale);
            var _cursorHeight = (cursorHeight / _scale + 10);
            var _cursorPosX = 0;
            var _cursorPosY = _cursorHeight * 0.5;
            let integralsGroup = document.createElementNS(Avionics.SVG.NS, "svg");
            integralsGroup.setAttribute("x", "0");
            integralsGroup.setAttribute("y", "23");
            integralsGroup.setAttribute("width", _cursorWidth.toString());
            integralsGroup.setAttribute("height", (_cursorHeight - 43).toString());
            integralsGroup.setAttribute("viewBox", "0 0 " + (_cursorWidth) + " " + (_cursorHeight));
            trs.appendChild(integralsGroup);
            {
                this.cursorIntegrals[0].construct(integralsGroup, _cursorPosX - 22, _cursorPosY - 2, _width, "Roboto-Bold", this.fontSize * 3, "green");
                this.cursorIntegrals[1].construct(integralsGroup, _cursorPosX + 24, _cursorPosY - 2, _width, "Roboto-Bold", this.fontSize * 3, "green");
                this.cursorIntegrals[2].construct(integralsGroup, _cursorPosX + 70, _cursorPosY - 2, _width, "Roboto-Bold", this.fontSize * 3, "green");
            }
            this.cursorDecimals.construct(trs, _cursorPosX + 113, _cursorPosY, _width, "Roboto-Bold", this.fontSize * 1.4, "green");
            this.rootGroup.appendChild(this.cursorSVG);
        }
        var baroGroup = document.createElementNS(Avionics.SVG.NS, "g");
        baroGroup.setAttribute("id", "Barometer");
        this.rootGroup.appendChild(baroGroup);
        {
            var x = posX - width * 0.5;
            var y = posY;
            var w = width * 1.5;
            var h = 16;
            var baroBg = document.createElementNS(Avionics.SVG.NS, "rect");
            baroBg.setAttribute("x", x.toString());
            baroBg.setAttribute("y", y.toString());
            baroBg.setAttribute("width", w.toString());
            baroBg.setAttribute("height", h.toString());
            baroBg.setAttribute("fill", "black");
            baroGroup.appendChild(baroBg);
            if (!this.pressureSVG)
                this.pressureSVG = document.createElementNS(Avionics.SVG.NS, "text");
            this.pressureSVG.textContent = "---";
            this.pressureSVG.setAttribute("x", (x + w * 0.5).toString());
            this.pressureSVG.setAttribute("y", (y + h * 0.5).toString());
            this.pressureSVG.setAttribute("fill", "white");
            this.pressureSVG.setAttribute("font-size", (this.fontSize * 0.60).toString());
            this.pressureSVG.setAttribute("font-family", "Roboto-Bold");
            this.pressureSVG.setAttribute("text-anchor", "middle");
            this.pressureSVG.setAttribute("alignment-baseline", "central");
            baroGroup.appendChild(this.pressureSVG);
        }
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    update(_dTime) {
        var altitude = SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet");
        this.updateGraduationScrolling(altitude);
        this.updateCursorScrolling(altitude);
        this.updateBaroPressure();
    }
    updateBaroPressure() {
        if (this.pressureSVG) {
            var pressure = SimVar.GetSimVarValue("KOHLSMAN SETTING HG:2", "inches of mercury");
            this.pressureSVG.textContent = fastToFixed(pressure, 2) + " in";
        }
    }
    updateGraduationScrolling(_altitude) {
        if (this.graduations) {
            this.graduationScroller.scroll(_altitude);
            var currentVal = this.graduationScroller.firstValue;
            var currentY = this.graduationScrollPosY + this.graduationScroller.offsetY * this.graduationSpacing * (this.nbSecondaryGraduations + 1);
            var firstRoundValueY = currentY;
            for (var i = 0; i < this.totalGraduations; i++) {
                var posX = this.graduationScrollPosX;
                var posY = Math.round(currentY);
                this.graduations[i].SVGLine.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                if (this.graduations[i].SVGText1) {
                    var roundedVal = 0;
                    roundedVal = Math.floor(Math.abs(currentVal));
                    var integral = Math.floor(roundedVal / 1000);
                    var modulo = Math.floor(roundedVal - (integral * 1000));
                    this.graduations[i].SVGText1.textContent = integral.toString();
                    this.graduations[i].SVGText2.textContent = Utils.leadingZeros(modulo, 3);
                    this.graduations[i].SVGText1.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    if (this.graduations[i].SVGText2)
                        this.graduations[i].SVGText2.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    firstRoundValueY = posY;
                    currentVal = this.graduationScroller.nextValue;
                }
                currentY -= this.graduationSpacing;
            }
            if (this.graduationBarSVG) {
                this.graduationBarSVG.setAttribute("transform", "translate(0 " + firstRoundValueY + ")");
            }
        }
    }
    updateCursorScrolling(_altitude) {
        if (this.cursorIntegrals) {
            this.cursorIntegrals[0].update(_altitude, 10000, 10000);
            this.cursorIntegrals[1].update(_altitude, 1000, 1000);
            this.cursorIntegrals[2].update(_altitude, 100);
        }
        if (this.cursorDecimals) {
            this.cursorDecimals.update(_altitude);
        }
    }
}
customElements.define('cj4-sai-altimeter-indicator', CJ4_SAI_AltimeterIndicator);
class CJ4_SAI_Attitude extends NavSystemElement {
    init(root) {
        this.attitudeElement = this.gps.getChildById("Horizon");
        this.attitudeElement.setAttribute("is-backup", "true");
        if (this.gps) {
            var aspectRatio = this.gps.getAspectRatio();
            this.attitudeElement.setAttribute("aspect-ratio", aspectRatio.toString());
        }
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        var xyz = Simplane.getOrientationAxis();
        if (xyz) {
            this.attitudeElement.setAttribute("pitch", (xyz.pitch / Math.PI * 180).toString());
            this.attitudeElement.setAttribute("bank", (xyz.bank / Math.PI * 180).toString());
            this.attitudeElement.setAttribute("slip_skid", Simplane.getInclinometer().toString());
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class CJ4_SAI_AttitudeIndicator extends HTMLElement {
    constructor() {
        super();
        this.backgroundVisible = true;
        this.bankSizeRatio = -7;
        this.bankSizeRatioFactor = 1.0;
    }
    static get observedAttributes() {
        return [
            "pitch",
            "bank",
            "slip_skid",
            "background",
        ];
    }
    connectedCallback() {
        this.construct();
    }
    construct() {
        Utils.RemoveAllChildren(this);
        this.bankSizeRatioFactor = 0.60;
        {
            this.horizon_root = document.createElementNS(Avionics.SVG.NS, "svg");
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
            this.horizonTop = document.createElementNS(Avionics.SVG.NS, "rect");
            this.horizonTop.setAttribute("fill", (this.backgroundVisible) ? this.horizonTopColor : "transparent");
            this.horizonTop.setAttribute("x", "-1000");
            this.horizonTop.setAttribute("y", "-1000");
            this.horizonTop.setAttribute("width", "2000");
            this.horizonTop.setAttribute("height", "2000");
            this.horizon_root.appendChild(this.horizonTop);
            this.bottomPart = document.createElementNS(Avionics.SVG.NS, "g");
            this.horizon_root.appendChild(this.bottomPart);
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
        {
            let pitchContainer = document.createElement("div");
            pitchContainer.setAttribute("id", "Pitch");
            pitchContainer.style.top = "-15.5%";
            pitchContainer.style.left = "-10%";
            pitchContainer.style.width = "120%";
            pitchContainer.style.height = "120%";
            pitchContainer.style.position = "absolute";
            pitchContainer.style.transform = "scale(1.4)";
            this.appendChild(pitchContainer);
            this.pitch_root = document.createElementNS(Avionics.SVG.NS, "svg");
            this.pitch_root.setAttribute("width", "100%");
            this.pitch_root.setAttribute("height", "100%");
            this.pitch_root.setAttribute("viewBox", "-200 -200 400 300");
            this.pitch_root.setAttribute("overflow", "visible");
            this.pitch_root.setAttribute("style", "position:absolute; z-index: -2;");
            pitchContainer.appendChild(this.pitch_root);
            {
                this.pitch_root_group = document.createElementNS(Avionics.SVG.NS, "g");
                this.pitch_root.appendChild(this.pitch_root_group);
                var x = -115;
                var y = -122;
                var w = 230;
                var h = 235;
                let attitudePitchContainer = document.createElementNS(Avionics.SVG.NS, "svg");
                attitudePitchContainer.setAttribute("width", w.toString());
                attitudePitchContainer.setAttribute("height", h.toString());
                attitudePitchContainer.setAttribute("x", x.toString());
                attitudePitchContainer.setAttribute("y", y.toString());
                attitudePitchContainer.setAttribute("viewBox", x + " " + y + " " + w + " " + h);
                attitudePitchContainer.setAttribute("overflow", "hidden");
                this.pitch_root_group.appendChild(attitudePitchContainer);
                {
                    this.attitude_pitch = document.createElementNS(Avionics.SVG.NS, "g");
                    attitudePitchContainer.appendChild(this.attitude_pitch);
                    let maxDash = 80;
                    let fullPrecisionLowerLimit = -20;
                    let fullPrecisionUpperLimit = 20;
                    let halfPrecisionLowerLimit = -30;
                    let halfPrecisionUpperLimit = 45;
                    let unusualAttitudeLowerLimit = -30;
                    let unusualAttitudeUpperLimit = 50;
                    let bigWidth = 120;
                    let bigHeight = 3;
                    let mediumWidth = 52.5;
                    let mediumHeight = 3;
                    let smallWidth = 30;
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
                                leftText.setAttribute("font-family", "Roboto-Light");
                                leftText.setAttribute("fill", "white");
                                this.attitude_pitch.appendChild(leftText);
                                let rightText = document.createElementNS(Avionics.SVG.NS, "text");
                                rightText.textContent = Math.abs(angle).toString();
                                rightText.setAttribute("x", ((width / 2) + 5).toString());
                                rightText.setAttribute("y", (this.bankSizeRatio * angle - height / 2 + fontSize / 2).toString());
                                rightText.setAttribute("text-anchor", "start");
                                rightText.setAttribute("font-size", fontSize.toString());
                                rightText.setAttribute("font-family", "Roboto-Light");
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
            }
        }
        {
            let attitudeContainer = document.createElement("div");
            attitudeContainer.setAttribute("id", "Attitude");
            attitudeContainer.style.top = "-15.5%";
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
                topTriangle.setAttribute("d", "M0 -180 l-7.5 -10 l15 0 Z");
                topTriangle.setAttribute("fill", "white");
                topTriangle.setAttribute("stroke", "white");
                topTriangle.setAttribute("stroke-width", "1");
                topTriangle.setAttribute("stroke-opacity", "1");
                this.attitude_bank.appendChild(topTriangle);
                let smallDashesAngle = [-50, -40, -30, -20, -10, 10, 20, 30, 40, 50];
                let smallDashesHeight = [18, 18, 18, 11, 11, 11, 11, 18, 18, 18];
                let radius = 175;
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
            }
            {
                let cursors = document.createElementNS(Avionics.SVG.NS, "g");
                this.attitude_root.appendChild(cursors);
                let leftUpper = document.createElementNS(Avionics.SVG.NS, "path");
                leftUpper.setAttribute("d", "M-110 0 l0 -6 l55 0 l0 28 l-5 0 l0 -22 l-40 0 Z");
                leftUpper.setAttribute("fill", "black");
                leftUpper.setAttribute("stroke", "white");
                leftUpper.setAttribute("stroke-width", "0.7");
                leftUpper.setAttribute("stroke-opacity", "1.0");
                cursors.appendChild(leftUpper);
                let rightUpper = document.createElementNS(Avionics.SVG.NS, "path");
                rightUpper.setAttribute("d", "M110 0 l0 -6 l-55 0 l0 28 l5 0 l0 -22 l40 0 Z");
                rightUpper.setAttribute("fill", "black");
                rightUpper.setAttribute("stroke", "white");
                rightUpper.setAttribute("stroke-width", "0.7");
                rightUpper.setAttribute("stroke-opacity", "1.0");
                cursors.appendChild(rightUpper);
                let centerRect = document.createElementNS(Avionics.SVG.NS, "rect");
                centerRect.setAttribute("x", "-4");
                centerRect.setAttribute("y", "-8");
                centerRect.setAttribute("height", "8");
                centerRect.setAttribute("width", "8");
                centerRect.setAttribute("stroke", "white");
                centerRect.setAttribute("stroke-width", "3");
                cursors.appendChild(centerRect);
                this.slipSkidTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkidTriangle.setAttribute("d", "M0 -170 l-13 20 l26 0 Z");
                this.slipSkidTriangle.setAttribute("fill", "white");
                this.attitude_root.appendChild(this.slipSkidTriangle);
                this.slipSkid = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkid.setAttribute("d", "M-20 -140 L-16 -146 L16 -146 L20 -140 Z");
                this.slipSkid.setAttribute("fill", "white");
                this.attitude_root.appendChild(this.slipSkid);
            }
        }
        this.applyAttributes();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue)
            return;
        switch (name) {
            case "pitch":
                this.pitch = parseFloat(newValue);
                break;
            case "bank":
                this.bank = parseFloat(newValue);
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
            default:
                return;
        }
        this.applyAttributes();
    }
    applyAttributes() {
        if (this.bottomPart)
            this.bottomPart.setAttribute("transform", "rotate(" + this.bank + ", 0, 0) translate(0," + (this.pitch * this.bankSizeRatio) + ")");
        if (this.pitch_root_group)
            this.pitch_root_group.setAttribute("transform", "rotate(" + this.bank + ", 0, 0)");
        if (this.attitude_pitch)
            this.attitude_pitch.setAttribute("transform", "translate(0," + (this.pitch * this.bankSizeRatio * this.bankSizeRatioFactor) + ")");
        if (this.slipSkid)
            this.slipSkid.setAttribute("transform", "rotate(" + this.bank + ", 0, 0) translate(" + (this.slipSkidValue * 40) + ", 0)");
        if (this.slipSkidTriangle)
            this.slipSkidTriangle.setAttribute("transform", "rotate(" + this.bank + ", 0, 0)");
        if (this.horizonTop) {
            if (this.backgroundVisible) {
                this.horizonTop.setAttribute("fill", this.horizonTopColor);
                this.horizonBottom.setAttribute("fill", this.horizonBottomColor);
            }
            else {
                this.horizonTop.setAttribute("fill", "transparent");
                this.horizonBottom.setAttribute("fill", "transparent");
            }
        }
    }
}
customElements.define('cj4-sai-attitude-indicator', CJ4_SAI_AttitudeIndicator);
class CJ4_SAI_Compass extends NavSystemElement {
    init(root) {
        this.compassElement = this.gps.getChildById("Compass");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.compassElement.update(_deltaTime);
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class CJ4_SAI_CompassIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.cursorOpacity = "1.0";
        this.fontSize = 25;
        this.graduationScrollPosX = 0;
        this.graduationScrollPosY = 0;
        this.nbPrimaryGraduations = 9;
        this.nbSecondaryGraduations = 1;
        this.totalGraduations = this.nbPrimaryGraduations + ((this.nbPrimaryGraduations - 1) * this.nbSecondaryGraduations);
        this.graduationSpacing = 23;
    }
    connectedCallback() {
        this.graduationScroller = new Avionics.Scroller(this.nbPrimaryGraduations, 10, true, 360);
        this.construct();
    }
    construct() {
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 500 250");
        var posX = 0;
        var posY = 0;
        var width = 495;
        var height = 110;
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "HS");
        }
        else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        if (!this.centerSVG) {
            this.centerSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.centerSVG.setAttribute("id", "CenterGroup");
        }
        else
            Utils.RemoveAllChildren(this.centerSVG);
        this.centerSVG.setAttribute("x", posX.toString());
        this.centerSVG.setAttribute("y", posY.toString());
        this.centerSVG.setAttribute("width", width.toString());
        this.centerSVG.setAttribute("height", height.toString());
        this.centerSVG.setAttribute("viewBox", "0 0 " + width + " " + height);
        {
            var _top = 35;
            var _left = 0;
            var _width = width;
            var _height = 80;
            var bg = document.createElementNS(Avionics.SVG.NS, "rect");
            bg.setAttribute("x", _left.toString());
            bg.setAttribute("y", _top.toString());
            bg.setAttribute("width", _width.toString());
            bg.setAttribute("height", _height.toString());
            bg.setAttribute("fill", "transparent");
            this.centerSVG.appendChild(bg);
            var cursorPosX = _left + _width * 0.5;
            var cursorPosY = posY + 30;
            var cursorWidth = 45;
            var cursorHeight = _height + 25;
            if (!this.cursorSVG) {
                this.cursorSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.cursorSVG.setAttribute("id", "CursorGroup");
            }
            else
                Utils.RemoveAllChildren(this.cursorSVG);
            this.cursorSVG.setAttribute("x", (cursorPosX - cursorWidth * 0.5).toString());
            this.cursorSVG.setAttribute("y", cursorPosY.toString());
            this.cursorSVG.setAttribute("width", cursorWidth.toString());
            this.cursorSVG.setAttribute("height", cursorHeight.toString());
            this.cursorSVG.setAttribute("viewBox", "0 0 " + cursorWidth + " " + cursorHeight);
            {
                let cursorShape = document.createElementNS(Avionics.SVG.NS, "path");
                cursorShape.setAttribute("fill", "white");
                cursorShape.setAttribute("fill-opacity", this.cursorOpacity);
                cursorShape.setAttribute("d", "M 18 2 L 25 2 L 25 23 L 25 53 L 18 53 L 18 23 L 18 2 Z");
                this.cursorSVG.appendChild(cursorShape);
            }
            this.centerSVG.appendChild(this.cursorSVG);
            var graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationGroup.setAttribute("id", "Graduations");
            {
                this.graduationScrollPosX = _left + _width * 0.5;
                this.graduationScrollPosY = _top;
                if (!this.graduations) {
                    this.graduations = [];
                    for (var i = 0; i < this.totalGraduations; i++) {
                        var line = new Avionics.SVGGraduation();
                        line.IsPrimary = (i % (this.nbSecondaryGraduations + 1)) ? false : true;
                        var lineWidth = line.IsPrimary ? 2 : 2;
                        var lineHeight = line.IsPrimary ? 21 : 11;
                        var linePosY = 0;
                        line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                        line.SVGLine.setAttribute("y", linePosY.toString());
                        line.SVGLine.setAttribute("width", lineWidth.toString());
                        line.SVGLine.setAttribute("height", lineHeight.toString());
                        line.SVGLine.setAttribute("fill", "white");
                        if (line.IsPrimary) {
                            line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                            line.SVGText1.setAttribute("y", (linePosY + lineHeight + 15).toString());
                            line.SVGText1.setAttribute("fill", "white");
                            line.SVGText1.setAttribute("font-size", (this.fontSize * 1.3).toString());
                            line.SVGText1.setAttribute("font-family", "Roboto-Light");
                            line.SVGText1.setAttribute("text-anchor", "middle");
                            line.SVGText1.setAttribute("alignment-baseline", "central");
                        }
                        this.graduations.push(line);
                    }
                }
                for (var i = 0; i < this.totalGraduations; i++) {
                    var line = this.graduations[i];
                    graduationGroup.appendChild(line.SVGLine);
                    if (line.SVGText1) {
                        graduationGroup.appendChild(line.SVGText1);
                    }
                }
                this.centerSVG.appendChild(graduationGroup);
            }
            this.headingGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.headingGroup.setAttribute("id", "Heading");
            {
                var headingPosX = _left + _width * 0.5;
                var headingPosY = posY + 30;
                var headingWidth = 28;
                var headingHeight = _height;
                if (!this.headingSVG) {
                    this.headingSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                    this.headingSVG.setAttribute("id", "HeadingGroup");
                }
                else
                    Utils.RemoveAllChildren(this.headingSVG);
                this.headingSVG.setAttribute("x", (headingPosX - headingWidth * 0.5).toString());
                this.headingSVG.setAttribute("y", headingPosY.toString());
                this.headingSVG.setAttribute("width", headingWidth.toString());
                this.headingSVG.setAttribute("height", headingHeight.toString());
                this.headingSVG.setAttribute("viewBox", "0 0 " + headingWidth + " " + headingHeight);
                {
                    let headingShape = document.createElementNS(Avionics.SVG.NS, "path");
                    headingShape.setAttribute("fill", "transparent");
                    headingShape.setAttribute("stroke", "#00FF21");
                    headingShape.setAttribute("stroke-width", "4");
                    headingShape.setAttribute("stroke-opacity", "1");
                    headingShape.setAttribute("d", "M13 0 l-13 17 l13 17 l13 -17 Z");
                    this.headingSVG.appendChild(headingShape);
                }
                this.headingGroup.appendChild(this.headingSVG);
            }
            this.centerSVG.appendChild(this.headingGroup);
        }
        this.rootGroup.appendChild(this.centerSVG);
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    update(dTime) {
        var compass = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        this.updateGraduationScrolling(compass);
        var heading = SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR", "degree");
        this.updateHeadingIndicator(heading, compass);
    }
    updateGraduationScrolling(_compass) {
        if (this.graduations) {
            this.graduationScroller.scroll(_compass);
            var currentVal = this.graduationScroller.firstValue;
            var currentX = this.graduationScrollPosX - this.graduationScroller.offsetY * this.graduationSpacing * (this.nbSecondaryGraduations + 1);
            for (var i = 0; i < this.totalGraduations; i++) {
                var posX = currentX;
                var posY = this.graduationScrollPosY;
                this.graduations[i].SVGLine.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                if (this.graduations[i].SVGText1) {
                    var roundedVal = Math.floor(currentVal / 10);
                    if (roundedVal % 3 == 0) {
                        if (roundedVal == 0)
                            this.graduations[i].SVGText1.textContent = "N";
                        else if (roundedVal == 9)
                            this.graduations[i].SVGText1.textContent = "E";
                        else if (roundedVal == 18)
                            this.graduations[i].SVGText1.textContent = "S";
                        else if (roundedVal == 27)
                            this.graduations[i].SVGText1.textContent = "W";
                        else
                            this.graduations[i].SVGText1.textContent = roundedVal.toString();
                    }
                    else {
                        this.graduations[i].SVGText1.textContent = "";
                    }
                    this.graduations[i].SVGText1.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    currentVal = this.graduationScroller.nextValue;
                }
                currentX += this.graduationSpacing;
            }
        }
    }
    updateHeadingIndicator(_heading, _compass) {
        var autoPilotActive = Simplane.getAutoPilotHeadingLockActive();
        if (autoPilotActive) {
            var delta = (_heading - _compass);
            if (delta > 180)
                delta = delta - 360;
            else if (delta < -180)
                delta = delta + 360;
            delta /= 10;
            var posX = delta * this.graduationSpacing * (this.nbSecondaryGraduations + 1);
            var posY = 0;
            this.headingGroup.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
            this.headingGroup.setAttribute("visibility", "visible");
        }
        else {
            this.headingGroup.setAttribute("visibility", "hidden");
        }
    }
}
customElements.define('cj4-sai-compass-indicator', CJ4_SAI_CompassIndicator);
registerInstrument("cj4-sai-display-element", CJ4_SAI);
//# sourceMappingURL=CJ4_SAI.js.map