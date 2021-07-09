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
        this.machVisible = false;
        this.machSpeed = 0;
        this._stallSpeed = 0;
        this._maxSpeed = 600;
        this.graduationScrollPosX = 0;
        this.graduationScrollPosY = 0;
        this.graduationSpacing = 24;
        this.graduationMinValue = 40;
        this.nbPrimaryGraduations = 11;
        this.nbSecondaryGraduations = 1;
        this.stripsSVG = null;
        this.vMaxStripSVG = null;
        this.stallStripSVG = null;
        this.refHeight = 0;
        this.stripHeight = 0;
        this.stripBorderSize = 0;
        this.stripOffsetX = 0;
        this._smoothFactor = 0.5;
        this._alphaProtectionMin = 0;
        this._alphaProtectionMax = 0;
        this._lowestSelectableSpeed = 0;
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
        var gradWidth = 90;
        this.refHeight = height;
        this.graduationVLine = null;
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
            diffAndSetAttribute(bg, "x", _left.toString());
            diffAndSetAttribute(bg, "y", _top.toString());
            diffAndSetAttribute(bg, "width", _width.toString());
            diffAndSetAttribute(bg, "height", _height.toString());
            diffAndSetAttribute(bg, "fill", "#30323d");
            this.centerSVG.appendChild(bg);

            this.graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.graduationGroup.setAttribute("id", "Graduations");
            {
                this.graduationScrollPosX = _left + _width;
                this.graduationScrollPosY = _top + _height * 0.5;
                this.graduations = [];
                for (var i = 0; i < this.totalGraduations; i++) {
                    var line = new Avionics.SVGGraduation();
                    line.IsPrimary = (i % (this.nbSecondaryGraduations + 1)) ? false : true;
                    var lineWidth = line.IsPrimary ? 10 : 6;
                    var lineHeight = line.IsPrimary ? 2 : 2;
                    var linePosX = -lineWidth;
                    line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                    line.SVGLine.setAttribute("x", linePosX.toString());
                    line.SVGLine.setAttribute("width", lineWidth.toString());
                    line.SVGLine.setAttribute("height", lineHeight.toString());
                    line.SVGLine.setAttribute("fill", "white");
                    if (line.IsPrimary) {
                        line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                        line.SVGText1.setAttribute("x", (linePosX - 1).toString());
                        line.SVGText1.setAttribute("y", "1");
                        line.SVGText1.setAttribute("fill", "white");
                        line.SVGText1.setAttribute("font-size", (this.fontSize * 0.6).toString());
                        line.SVGText1.setAttribute("font-family", "Jost-Medium");
                        line.SVGText1.setAttribute("text-anchor", "end");
                        line.SVGText1.setAttribute("alignment-baseline", "central");
                    }
                    this.graduations.push(line);
                }
                for (var i = 0; i < this.totalGraduations; i++) {
                    var line = this.graduations[i];
                    this.graduationGroup.appendChild(line.SVGLine);
                    if (line.SVGText1) {
                        this.graduationGroup.appendChild(line.SVGText1);
                    }
                }
                this.centerSVG.appendChild(this.graduationGroup);
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
            this.cursorSVG.setAttribute("width", (cursorWidth + 1).toString());
            this.cursorSVG.setAttribute("height", cursorHeight.toString());
            this.cursorSVG.setAttribute("viewBox", "0 4 " + cursorWidth + " " + cursorHeight);
            {
                let _scale = 0.6;
                this.trs = document.createElementNS(Avionics.SVG.NS, "g");
                this.trs.setAttribute("fill", "#11d011");
                this.trs.setAttribute("transform", "scale(" + _scale + ")");
                this.cursorSVG.appendChild(this.trs);
                this.cursorSVGClip = document.createElementNS(Avionics.SVG.NS, "path");
                this.cursorSVGClip.setAttribute("fill", "transparent");
                this.cursorSVGClip.setAttribute("d", "M24 22 L62 22 L62 7 L86 7 L86 70 L62 70 L62 56 L24 56 Z");
                this.cursorSVGClip.setAttribute("stroke", "white");
                this.cursorSVGClip.setAttribute("stroke-width", "3");
                this.trs.appendChild(this.cursorSVGClip);
                if (!this.cursorSVGShape)
                    this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.cursorSVGShape.setAttribute("fill", "black");
                this.cursorSVGShape.setAttribute("d", "M24 22 L62 22 L62 7 L86 7 L86 70 L62 70 L62 56 L24 56 Z");
                this.cursorSVGShape.setAttribute("stroke", "white");
                this.cursorSVGShape.setAttribute("stroke-width", "0");
                this.trs.appendChild(this.cursorSVGShape);

                var _cursorWidth = (cursorWidth / _scale);
                var _cursorHeight = (cursorHeight / _scale + 10);
                var _cursorPosX = -2;
                var _cursorPosY = cursorHeight * 0.5 + 20;
                this.integralsGroup = document.createElementNS(Avionics.SVG.NS, "svg");
                this.integralsGroup.setAttribute("x", "0");
                this.integralsGroup.setAttribute("fill", "#11d011");
                this.integralsGroup.setAttribute("y", "21");
                this.integralsGroup.setAttribute("width", _cursorWidth.toString());
                this.integralsGroup.setAttribute("height", (_cursorHeight - 39).toString());
                this.integralsGroup.setAttribute("viewBox", "0 0 " + (_cursorWidth) + " " + (_cursorHeight - 5));
                this.trs.appendChild(this.integralsGroup);
                {
                    this.cursorIntegrals[0].construct(this.integralsGroup, _cursorPosX + 50, _cursorPosY - 5, _width, "Jost-SemiBold", this.fontSize * 2.7);
                    this.cursorIntegrals[1].construct(this.integralsGroup, _cursorPosX + 89, _cursorPosY - 5, _width, "Jost-SemiBold", this.fontSize * 2.7);
                }
                this.cursorDecimals.construct(this.trs, _cursorPosX + 87, _cursorPosY - 1, _width, "Jost-SemiBold", this.fontSize * 1.3); 
            }
            var stripViewPosX = _left + 34;
            var stripViewPosY = this.stripBorderSize;
            var stripViewWidth = width;
            var stripViewHeight = _height - this.stripBorderSize * 2;
            if (!this.stripsSVG) {
                this.stripsSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.stripsSVG.setAttribute("id", "StripsGroup");
            }
            else
                Utils.RemoveAllChildren(this.stripsSVG);
            this.stripsSVG.setAttribute("x", stripViewPosX.toFixed(0));
            this.stripsSVG.setAttribute("y", stripViewPosY.toFixed(0));
            this.stripsSVG.setAttribute("width", stripViewWidth.toFixed(0));
            this.stripsSVG.setAttribute("height", stripViewHeight.toFixed(0));
            this.stripsSVG.setAttribute("viewBox", "0 0 " + stripViewWidth + " " + stripViewHeight);
            {
                this.stripHeight = stripViewHeight * 3;
                this.vMaxStripSVG = document.createElementNS(Avionics.SVG.NS, "g");
                this.vMaxStripSVG.setAttribute("id", "VMax");
                {
                    let stripWidth = 10;
                    let shape = document.createElementNS(Avionics.SVG.NS, "path");
                    diffAndSetAttribute(shape, "fill", "red");
                    diffAndSetAttribute(shape, "d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.vMaxStripSVG.appendChild(shape);
                }
                this.stripsSVG.appendChild(this.vMaxStripSVG);
                this.stallStripSVG = document.createElementNS(Avionics.SVG.NS, "g");
                this.stallStripSVG.setAttribute("id", "Stall");
                {
                    let stripWidth = 10;
                    let shape = document.createElementNS(Avionics.SVG.NS, "path");
                    diffAndSetAttribute(shape, "fill", "red");
                    diffAndSetAttribute(shape, "d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.stallStripSVG.appendChild(shape);
                }
                this.stripsSVG.appendChild(this.stallStripSVG);
            }
            this.centerSVG.appendChild(this.stripsSVG);
            this.centerSVG.appendChild(this.graduationGroup);
            this.centerSVG.appendChild(this.cursorSVG);
            this.trs.appendChild(this.cursorSVGClip);

        }
        this.rootGroup.appendChild(this.centerSVG);
        this.machGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.machGroup.setAttribute("id", "Mach");
        {
            this.rootGroup.appendChild(this.machGroup);
            var x = 0;
            var y = 0;
            var w = 50;
            var h = 22;
            this.machBg = document.createElementNS(Avionics.SVG.NS, "rect");
            this.machBg.setAttribute("x", x.toString());
            this.machBg.setAttribute("y", y.toString());
            this.machBg.setAttribute("width", w.toString());
            this.machBg.setAttribute("height", h.toString());
            this.machBg.setAttribute("fill", "black");
            this.machGroup.appendChild(this.machBg);
            if (!this.machSVG)
            this.machSVG = document.createElementNS(Avionics.SVG.NS, "text");
            this.machSVG.textContent = "---";
            this.machSVG.setAttribute("x", "25");
            this.machSVG.setAttribute("y", (y + 13));
            this.machSVG.setAttribute("fill", "#11d011");
            this.machSVG.setAttribute("font-size", (this.fontSize * 0.65).toString());
            this.machSVG.setAttribute("font-family", "Jost-SemiBold");
            this.machSVG.setAttribute("text-anchor", "middle");
            this.machSVG.setAttribute("alignment-baseline", "central");
            this.machGroup.appendChild(this.machSVG);
        }
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    update(dTime) {
        let indicatedSpeed = Simplane.getIndicatedSpeed();
        this.updateCursorScrolling(indicatedSpeed);
        this.updateGraduationScrolling(indicatedSpeed);

        var trueMach = Simplane.getMachSpeed();
            this.machSpeed = Utils.SmoothSin(this.machSpeed, trueMach, 0.25, dTime / 1000);

        if (this.machSVG) {
            const mach = this.machSpeed;
            this.machSVG.textContent = (mach.toFixed(2)).slice(1) + " M";
        }
        if (this.machSpeed > 0.40) {
            this.machGroup.setAttribute("visibility", "visible");
        } else if (this.machSpeed <= 0.35) {
            this.machGroup.setAttribute("visibility", "hidden");
        }

        const alt = Simplane.getAltitude();
        this.maxSpeed = 260;
        if (alt >= 8000 && alt <= 27884) {
            this.maxSpeed = 305;
        }
        else if (alt > 27884) {
            const ambientPressure = SimVar.GetSimVarValue('AMBIENT PRESSURE', 'inHG');
            const machScalar2 = Math.pow(0.77, 2);
            const machScalar4 = Math.pow(0.77, 4);
            this.maxSpeed = Math.sqrt(ambientPressure / 29.92) * Math.sqrt(1 + machScalar2 / 4 + machScalar4 / 40) * 0.77 * 661.5;
        }
        if (indicatedSpeed >= this.maxSpeed) {
            this.machSVG.setAttribute("fill", "red");
            this.integralsGroup.setAttribute("fill", "red");
            this.trs.setAttribute("fill", "red");
        } else if (this.machSpeed >= this.maxSpeed) {
            this.machSVG.setAttribute("fill", "red");
            this.integralsGroup.setAttribute("fill", "red");
            this.trs.setAttribute("fill", "red");
        } else {
            this.machSVG.setAttribute("fill", "#11d011");
            this.integralsGroup.setAttribute("fill", "#11d011");
            this.trs.setAttribute("fill", "#11d011");
        }
        let maxSpeed = this.maxSpeed;
        let lowestSelectableSpeed = Simplane.getLowestSelectableSpeed();
        let stallProtectionMin = Simplane.getStallProtectionMinSpeed();
        let stallProtectionMax = Simplane.getStallProtectionMaxSpeed();
        let stallSpeed = Simplane.getStallSpeed();
        let planeOnGround = Simplane.getIsGrounded();
        this.smoothSpeeds(indicatedSpeed, dTime, maxSpeed, lowestSelectableSpeed, stallProtectionMin, stallProtectionMax, stallSpeed);
        this.updateStrip(this.vMaxStripSVG, indicatedSpeed, this._maxSpeed, false, true);
        this.updateStrip(this.stallStripSVG, indicatedSpeed, this._stallSpeed, planeOnGround, false);
        
    }
    smoothSpeeds(_indicatedSpeed, _dTime, _maxSpeed, _lowestSelectableSpeed, _stallProtectionMin, _stallProtectionMax, _stallSpeed) {
        let refSpeed = _maxSpeed;
        if (this.stallStripSVG) {
            let delta = _stallSpeed - refSpeed;
            if (delta >= 0)
                _stallProtectionMax -= delta + 5;
            refSpeed = _stallSpeed;
        }
        let seconds = _dTime / 1000;
        this._maxSpeed = Utils.SmoothSin(this._maxSpeed, _maxSpeed, this._smoothFactor, seconds);
        this._lowestSelectableSpeed = Utils.SmoothSin(this._lowestSelectableSpeed, _lowestSelectableSpeed, this._smoothFactor, seconds);
        this._alphaProtectionMin = Utils.SmoothSin(this._alphaProtectionMin, _stallProtectionMin, this._smoothFactor, seconds);
        this._alphaProtectionMax = Utils.SmoothSin(this._alphaProtectionMax, _stallProtectionMax, this._smoothFactor, seconds);
        this._stallSpeed = Utils.SmoothSin(this._stallSpeed, _stallSpeed, this._smoothFactor, seconds);
        let delta = this._alphaProtectionMax - _indicatedSpeed;
        if (delta >= 0) {
            this._alphaProtectionMax -= delta;
        }
    }
    valueToSvg(current, target) {
        var _top = 0;
        var _height = this.refHeight;
        if (current < this.graduationMinValue)
            current = this.graduationMinValue;
        let deltaValue = current - target;
        let deltaSVG = deltaValue * this.graduationSpacing * (this.nbSecondaryGraduations + 1) / this.graduationScroller.increment;
        var posY = _top + _height * 0.5 + deltaSVG;
        posY += 2.5;
        return posY;    
    }
    updateStrip(_strip, currentAirspeed, maxSpeed, _forceHide, _topToBottom) {
        if (_strip) {
            let hideStrip = true;
            if (!_forceHide) {
                if (maxSpeed > this.graduationMinValue) {
                    let vPosY = this.valueToSvg(currentAirspeed, maxSpeed);
                    if (vPosY > 0) {
                        if (_topToBottom)
                            vPosY -= this.stripHeight + this.stripBorderSize;
                        _strip.setAttribute("transform", "translate(" + this.stripOffsetX + " " + vPosY + ")");
                        hideStrip = false;
                    }
                }
            }
            if (hideStrip) {
                _strip.setAttribute("visibility", "hidden");
            }
            else {
                _strip.setAttribute("visibility", "visible");
            }
        }
    }
    updateGraduationScrolling(_speed) {
        var startSpeed = this.graduationMinValue;
        if (_speed < this.graduationMinValue) {
            startSpeed = this.graduationMinValue;
        } else {
            startSpeed = _speed;
        }
        if (this.graduations) {
            this.graduationScroller.scroll(startSpeed);
            var currentVal = this.graduationScroller.firstValue;
            var currentY = this.graduationScrollPosY + this.graduationScroller.offsetY * this.graduationSpacing * (this.nbSecondaryGraduations + 1);
            for (var i = 0; i < this.totalGraduations; i++) {
                var posX = this.graduationScrollPosX;
                var posY = currentY;
                if ((currentVal < this.graduationMinValue) || (currentVal == this.graduationMinValue && !this.graduations[i].SVGText1)) {
                    this.graduations[i].SVGLine.setAttribute("visibility", "hidden");
                    if (this.graduations[i].SVGText1) {
                        this.graduations[i].SVGText1.setAttribute("visibility", "hidden");
                    }
                } else {
                    this.graduations[i].SVGLine.setAttribute("visibility", "visible");
                    this.graduations[i].SVGLine.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                }
                if (this.graduations[i].SVGText1) {
                    if ((currentVal % 4) == 0)
                        if (currentVal < this.graduationMinValue) {
                            this.graduations[i].SVGText1.textContent = "";
                        } else {
                            this.graduations[i].SVGText1.textContent = currentVal.toString();
                        }
                    else
                        this.graduations[i].SVGText1.textContent = "";
                    this.graduations[i].SVGText1.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    currentVal = this.graduationScroller.nextValue;
                }
                currentY -= this.graduationSpacing;
            }
        }
    }
    updateCursorScrolling(_speed) {
        var startSpeed = 40;
        if (_speed < 40) {
            startSpeed = 40;
        } else {
            startSpeed = _speed;
        }
        if (_speed <= this.graduationMinValue) {
            if (this.cursorIntegrals) {
                this.cursorIntegrals[0].update(startSpeed, 100, 100);
                this.cursorIntegrals[1].update(startSpeed, 10, 10);
            }
            if (this.cursorDecimals) {
                this.cursorDecimals.update(startSpeed);
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
        ;
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
        this.cursorIntegrals.push(new Avionics.AltitudeScroller(3, 72, 1, 10, 1000));
        this.cursorIntegrals.push(new Avionics.AltitudeScroller(3, 72, 1, 10, 100));
        this.cursorIntegrals.push(new Avionics.AltitudeScroller(3, 72, 1, 10, 10));
        this.cursorDecimals = new Avionics.AltitudeScroller(3, 36, 10, 100);
        this.construct();
    }
    construct() {
        Utils.RemoveAllChildren(this);
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 250 500");
        var width = 57;
        var height = 250;
        var posX = width * 0.5 + 11;
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
            diffAndSetAttribute(bg, "x", _left.toString());
            diffAndSetAttribute(bg, "y", _top.toString());
            diffAndSetAttribute(bg, "width", _width.toString());
            diffAndSetAttribute(bg, "height", _height.toString());
            diffAndSetAttribute(bg, "fill", "#30323d");
            this.centerSVG.appendChild(bg);
            if (!this.graduationBarSVG)
                this.graduationBarSVG = document.createElementNS(Avionics.SVG.NS, "path");
            this.graduationBarSVG.setAttribute("fill", "transparent");
            this.graduationBarSVG.setAttribute("d", "M0 0 l20 20 l0 70 l-20 20 l20 20 l0 70 l-20 20 l20 20 l0 70 l-20 20 l20 20 l0 70 l-20 20 l20 20 l0 70");
            this.graduationBarSVG.setAttribute("stroke", "white");
            this.graduationBarSVG.setAttribute("stroke-width", "2");
            this.centerSVG.appendChild(this.graduationBarSVG);
            this.graduationScrollPosX = _left;
            this.graduationScrollPosY = _top + _height * 0.5;
            this.graduations = [];
            for (var i = 0; i < this.totalGraduations; i++) {
                var line = new Avionics.SVGGraduation();
                line.IsPrimary = true;
                if (this.nbSecondaryGraduations > 0 && (i % (this.nbSecondaryGraduations + 1)))
                    line.IsPrimary = false;
                var lineWidth = line.IsPrimary ? 0 : 10;
                line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                line.SVGLine.setAttribute("x", "0");
                line.SVGLine.setAttribute("width", lineWidth.toString());
                line.SVGLine.setAttribute("height", "2");
                line.SVGLine.setAttribute("fill", "white");
                if (line.IsPrimary) {
                    line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                    line.SVGText1.setAttribute("x", (lineWidth + 30).toString());
                    line.SVGText1.setAttribute("y", "0");
                    line.SVGText1.setAttribute("fill", "white");
                    line.SVGText1.setAttribute("font-size", (this.fontSize * 0.65).toString());
                    line.SVGText1.setAttribute("font-family", "Jost-Medium");
                    line.SVGText1.setAttribute("text-anchor", "end");
                    line.SVGText1.setAttribute("alignment-baseline", "central");
                    line.SVGText2 = document.createElementNS(Avionics.SVG.NS, "text");
                    line.SVGText2.setAttribute("x", (lineWidth + 31).toString());
                    line.SVGText2.setAttribute("y", "0");
                    line.SVGText2.setAttribute("fill", "white");
                    line.SVGText2.setAttribute("font-size", (this.fontSize * 0.45).toString());
                    line.SVGText2.setAttribute("font-family", "Jost-Medium");
                    line.SVGText2.setAttribute("text-anchor", "start");
                    line.SVGText2.setAttribute("alignment-baseline", "central");
                }
                this.graduations.push(line);
            }
            var graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            diffAndSetAttribute(graduationGroup, "id", "graduationGroup");
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
        var cursorPosY = _top + _height * 0.5 - 4;
        var cursorWidth = width * 1.4;
        var cursorHeight = 44;
        if (!this.cursorSVG) {
            this.cursorSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.cursorSVG.setAttribute("id", "CursorGroup");
        }
        else
            Utils.RemoveAllChildren(this.cursorSVG);
        this.cursorSVG.setAttribute("x", cursorPosX.toString());
        this.cursorSVG.setAttribute("y", (cursorPosY - cursorHeight * 0.5).toString());
        this.cursorSVG.setAttribute("width", cursorWidth.toString());
        this.cursorSVG.setAttribute("height", (cursorHeight + 8).toString());
        this.cursorSVG.setAttribute("viewBox", "0 3 " + cursorWidth + " " + cursorHeight);
        {
            let _scale = 0.6;
            var trs = document.createElementNS(Avionics.SVG.NS, "g");
            diffAndSetAttribute(trs, "transform", "scale(" + _scale + ")");
            this.cursorSVG.appendChild(trs);

            this.cursorSVGClip = document.createElementNS(Avionics.SVG.NS, "path");
            this.cursorSVGClip.setAttribute("fill", "transparent");
            this.cursorSVGClip.setAttribute("d", "M0 25 L74 25 L74 -1 L123 -1 L123 84 L74 84 L74 60 L0 60 Z");
            this.cursorSVGClip.setAttribute("stroke", "white");
            this.cursorSVGClip.setAttribute("stroke-width", "3");
            trs.appendChild(this.cursorSVGClip);

            if (!this.cursorSVGShape)
                this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
            this.cursorSVGShape.setAttribute("fill", "black");
            this.cursorSVGShape.setAttribute("d", "M0 25 L75 25 L75 0 L123 0 L123 84 L75 84 L75 59 L0 59 Z");
            this.cursorSVGShape.setAttribute("stroke", "white");
            this.cursorSVGShape.setAttribute("stroke-width", "0");
            trs.appendChild(this.cursorSVGShape);
            var _cursorWidth = (cursorWidth / _scale);
            var _cursorHeight = (cursorHeight / _scale + 1);
            var _cursorPosX = 3;
            var _cursorPosY = _cursorHeight * 0.5;
            let integralsGroup = document.createElementNS(Avionics.SVG.NS, "svg");
            diffAndSetAttribute(integralsGroup, "x", "0");
            diffAndSetAttribute(integralsGroup, "y", "28");
            diffAndSetAttribute(integralsGroup, "width", _cursorWidth.toString());
            diffAndSetAttribute(integralsGroup, "height", (_cursorHeight - 42).toString());
            diffAndSetAttribute(integralsGroup, "viewBox", "0 0 " + (_cursorWidth) + " " + (_cursorHeight));
            trs.appendChild(integralsGroup);
            {
                this.cursorIntegrals[0].construct(integralsGroup, _cursorPosX - 27, _cursorPosY - 2, _width, "Jost-Bold", this.fontSize * 3.4, "#11d011");
                this.cursorIntegrals[1].construct(integralsGroup, _cursorPosX + 27, _cursorPosY - 2, _width, "Jost-Bold", this.fontSize * 3.4, "#11d011");
                this.cursorIntegrals[2].construct(integralsGroup, _cursorPosX + 81, _cursorPosY - 2, _width, "Jost-Bold", this.fontSize * 3.4, "#11d011");
            }
            this.cursorDecimals.construct(trs, _cursorPosX + 119, _cursorPosY + 6, _width, "Jost-Bold", this.fontSize * 1.50, "#11d011");
            trs.appendChild(this.cursorSVGClip);
            this.rootGroup.appendChild(this.cursorSVG);
        }
        var baroGroup = document.createElementNS(Avionics.SVG.NS, "g");
        diffAndSetAttribute(baroGroup, "id", "Barometer");
        this.rootGroup.appendChild(baroGroup);
        {
            var x = posX - 12;
            var y = posY;
            var w = width;
            var h = 22;
            var baroBg = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(baroBg, "x", x.toString());
            diffAndSetAttribute(baroBg, "y", y.toString());
            diffAndSetAttribute(baroBg, "width", "67".toString());
            diffAndSetAttribute(baroBg, "height", h.toString());
            diffAndSetAttribute(baroBg, "fill", "black");
            baroGroup.appendChild(baroBg);
            if (!this.pressureSVG)
                this.pressureSVG = document.createElementNS(Avionics.SVG.NS, "text");
            this.pressureSVG.textContent = "---";
            this.pressureSVG.setAttribute("x", (x + w * 0.57).toString());
            this.pressureSVG.setAttribute("y", (y + 13));
            this.pressureSVG.setAttribute("fill", "cyan");
            this.pressureSVG.setAttribute("font-size", (this.fontSize * 0.65).toString());
            this.pressureSVG.setAttribute("font-family", "Jost-SemiBold");
            this.pressureSVG.setAttribute("text-anchor", "middle");
            this.pressureSVG.setAttribute("alignment-baseline", "central");
            baroGroup.appendChild(this.pressureSVG);
        }
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    update(_dTime) {
        var altitude = SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet").toFixed(2).padStart(8, "0");
        this.updateGraduationScrolling(altitude);
        this.updateCursorScrolling(altitude);
        this.updateBaroPressure();
    }
    updateBaroPressure() {
        if (this.pressureSVG) {
            const baroHpa = SimVar.GetSimVarValue("L:XMLVAR_Baro_Selector_HPA_1", "Bool");
            const baroMode = Simplane.getPressureSelectedMode(this.aircraft);

            if (baroHpa && baroMode !== "STD") {    
                var pressure = SimVar.GetSimVarValue("KOHLSMAN SETTING MB:2", "Millibars");          
                this.pressureSVG.textContent = pressure.toFixed(0) + " mb";
                SimVar.SetSimVarValue("KOHLSMAN SETTING STD:2", "Bool", false);
            } else if (!baroHpa && baroMode !== "STD") { 
                var pressure = SimVar.GetSimVarValue("KOHLSMAN SETTING HG:2", "inches of mercury");            
                this.pressureSVG.textContent = pressure.toFixed(2) + " in";
                SimVar.SetSimVarValue("KOHLSMAN SETTING STD:2", "Bool", false);
            } else if (baroMode == "STD")  {
                this.pressureSVG.textContent = "STD";
                SimVar.SetSimVarValue("KOHLSMAN SETTING STD:2", "Bool", true);
            }
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
        this.bankSizeRatio = -6.5;
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
            diffAndSetAttribute(separator, "fill", "#e0e0e0");
            diffAndSetAttribute(separator, "x", "-1500");
            diffAndSetAttribute(separator, "y", "-3");
            diffAndSetAttribute(separator, "width", "3000");
            diffAndSetAttribute(separator, "height", "6");
            this.bottomPart.appendChild(separator);
        }
        {
            let pitchContainer = document.createElement("div");
            diffAndSetAttribute(pitchContainer, "id", "Pitch");
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
            let pitchSvgDefs = document.createElementNS(Avionics.SVG.NS, "defs");
            let pitchSvgClip = document.createElementNS(Avionics.SVG.NS, "clipPath");
            diffAndSetAttribute(pitchSvgClip, "id", "pitchClip");
            let attitudePitchContainerShape = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(attitudePitchContainerShape, "d", "M 0 -130 L -120 -70 L -120 70 L 0 130 L 120 70 L 120 -70 Z");
            pitchSvgClip.appendChild(attitudePitchContainerShape);
            pitchSvgDefs.appendChild(pitchSvgClip);
            this.pitch_root.appendChild(pitchSvgDefs);
            pitchContainer.appendChild(this.pitch_root);
            {
                this.pitch_root_group = document.createElementNS(Avionics.SVG.NS, "g");
                this.pitch_root.appendChild(this.pitch_root_group);
                var x = -115;
                var y = -102;
                var w = 240;
                var h = 270;              
                let attitudePitchContainer = document.createElementNS(Avionics.SVG.NS, "svg");
                diffAndSetAttribute(attitudePitchContainer, "width", w.toString());
                diffAndSetAttribute(attitudePitchContainer, "height", h.toString());
                diffAndSetAttribute(attitudePitchContainer, "x", x.toString());
                diffAndSetAttribute(attitudePitchContainer, "y", y.toString());
                diffAndSetAttribute(attitudePitchContainer, "viewBox", x + " " + y + " " + w + " " + h);
                diffAndSetAttribute(attitudePitchContainer, "overflow", "hidden");
                this.pitch_root_group.appendChild(attitudePitchContainer);
                let attitudePitchInnerContainer = document.createElementNS(Avionics.SVG.NS, "g");
                diffAndSetAttribute(attitudePitchInnerContainer, "clip-path", "url(#pitchClip)");
                attitudePitchContainer.appendChild(attitudePitchInnerContainer);
                {
                    this.attitude_pitch = document.createElementNS(Avionics.SVG.NS, "g");
                    attitudePitchInnerContainer.appendChild(this.attitude_pitch);
                    let maxDash = 80;
                    let fullPrecisionLowerLimit = -10;
                    let fullPrecisionUpperLimit = 10;
                    let halfPrecisionLowerLimit = -30;
                    let halfPrecisionUpperLimit = 45;
                    let unusualAttitudeLowerLimit = -30;
                    let unusualAttitudeUpperLimit = 50;
                    let bigWidth = 100;
                    let bigHeight = 3;
                    let mediumWidth = 52.5;
                    let mediumHeight = 3;
                    let smallWidth = 20;
                    let smallHeight = 3;
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
                            diffAndSetAttribute(rect, "fill", "white");
                            diffAndSetAttribute(rect, "x", (-width / 2).toString());
                            diffAndSetAttribute(rect, "y", (this.bankSizeRatio * angle - height / 2).toString());
                            diffAndSetAttribute(rect, "width", width.toString());
                            diffAndSetAttribute(rect, "height", height.toString());
                            this.attitude_pitch.appendChild(rect);
                            if (text) {
                                let leftText = document.createElementNS(Avionics.SVG.NS, "text");
                                diffAndSetText(leftText, Math.abs(angle).toString());
                                diffAndSetAttribute(leftText, "x", ((-width / 2) - 2).toString());
                                diffAndSetAttribute(leftText, "y", ((this.bankSizeRatio * angle - height / 2 + fontSize / 2) + 1).toString());
                                diffAndSetAttribute(leftText, "text-anchor", "end");
                                diffAndSetAttribute(leftText, "font-size", (fontSize * 1.6).toString());
                                diffAndSetAttribute(leftText, "font-family", "Jost-Medium");
                                diffAndSetAttribute(leftText, "fill", "white");
                                this.attitude_pitch.appendChild(leftText);
                                let rightText = document.createElementNS(Avionics.SVG.NS, "text");
                                diffAndSetText(rightText, Math.abs(angle).toString());
                                diffAndSetAttribute(rightText, "x", ((width / 2) + 2).toString());
                                diffAndSetAttribute(rightText, "y", ((this.bankSizeRatio * angle - height / 2 + fontSize / 2) + 1).toString());
                                diffAndSetAttribute(rightText, "text-anchor", "start");
                                diffAndSetAttribute(rightText, "font-size", (fontSize * 1.6).toString());
                                diffAndSetAttribute(rightText, "font-family", "Jost-Medium");
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
            }
        }
        {
            let attitudeContainer = document.createElement("div");
            diffAndSetAttribute(attitudeContainer, "id", "Attitude");
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
                diffAndSetAttribute(topTriangle, "d", "M0 -160 l-13 -20 l26 0 Z");
                diffAndSetAttribute(topTriangle, "fill", "white");
                diffAndSetAttribute(topTriangle, "stroke", "white");
                diffAndSetAttribute(topTriangle, "stroke-width", "1");
                diffAndSetAttribute(topTriangle, "stroke-opacity", "1");
                this.attitude_bank.appendChild(topTriangle);
                let smallDashesAngle = [-60, -30, -20, -10, 10, 20, 30, 60];
                let smallDashesHeight = [18, 30, 18, 18, 18, 18, 30, 18];
                let radius = 160;
                for (let i = 0; i < smallDashesAngle.length; i++) {
                    let dash = document.createElementNS(Avionics.SVG.NS, "line");
                    diffAndSetAttribute(dash, "x1", "0");
                    diffAndSetAttribute(dash, "y1", (-radius).toString());
                    diffAndSetAttribute(dash, "x2", "0");
                    diffAndSetAttribute(dash, "y2", (-radius - smallDashesHeight[i]).toString());
                    diffAndSetAttribute(dash, "fill", "none");
                    diffAndSetAttribute(dash, "stroke", "white");
                    diffAndSetAttribute(dash, "stroke-width", "3");
                    diffAndSetAttribute(dash, "transform", "rotate(" + smallDashesAngle[i] + ",0,0)");
                    this.attitude_bank.appendChild(dash);
                }
            }
            {
                let leftTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                diffAndSetAttribute(leftTriangle, "d", "M 0 -160 l -8 -10 l 15 0 Z");
                diffAndSetAttribute(leftTriangle, "fill", "white");
                diffAndSetAttribute(leftTriangle, "stroke", "white");
                diffAndSetAttribute(leftTriangle, "stroke-width", "2");
                diffAndSetAttribute(leftTriangle, "stroke-opacity", "1");
                diffAndSetAttribute(leftTriangle, "transform", "rotate(45,0,0)");
                this.attitude_bank.appendChild(leftTriangle);
                let rightTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                diffAndSetAttribute(rightTriangle, "d", "M 0 -160 l -8 -10 l 15 0 Z");
                diffAndSetAttribute(rightTriangle, "fill", "white");
                diffAndSetAttribute(rightTriangle, "stroke", "white");
                diffAndSetAttribute(rightTriangle, "stroke-width", "2");
                diffAndSetAttribute(rightTriangle, "stroke-opacity", "1");
                diffAndSetAttribute(rightTriangle, "transform", "rotate(-45,0,0)");
                this.attitude_bank.appendChild(rightTriangle);
        
                let cursors = document.createElementNS(Avionics.SVG.NS, "g");
                this.attitude_root.appendChild(cursors);
                let leftUpper = document.createElementNS(Avionics.SVG.NS, "path");
                diffAndSetAttribute(leftUpper, "d", "M-100 5 l0 -10 l55 0 l0 32 l-10 0 l0 -22 l-40 0 Z");
                diffAndSetAttribute(leftUpper, "fill", "black");
                diffAndSetAttribute(leftUpper, "stroke", "white");
                diffAndSetAttribute(leftUpper, "stroke-width", "3");
                diffAndSetAttribute(leftUpper, "stroke-opacity", "1.0");
                cursors.appendChild(leftUpper);
                let rightUpper = document.createElementNS(Avionics.SVG.NS, "path");
                diffAndSetAttribute(rightUpper, "d", "M100 5 l0 -10 l-55 0 l0 32 l10 0 l0 -22 l40 0 Z");
                diffAndSetAttribute(rightUpper, "fill", "black");
                diffAndSetAttribute(rightUpper, "stroke", "white");
                diffAndSetAttribute(rightUpper, "stroke-width", "3");
                diffAndSetAttribute(rightUpper, "stroke-opacity", "1.0");
                cursors.appendChild(rightUpper);
                let centerRect = document.createElementNS(Avionics.SVG.NS, "rect");
                diffAndSetAttribute(centerRect, "x", "-4");
                diffAndSetAttribute(centerRect, "y", "-5");
                diffAndSetAttribute(centerRect, "height", "10");
                diffAndSetAttribute(centerRect, "width", "10");
                diffAndSetAttribute(centerRect, "stroke", "white");
                diffAndSetAttribute(centerRect, "stroke-width", "3");
                cursors.appendChild(centerRect);
                this.slipSkidTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkidTriangle.setAttribute("d", "M0 -160 l-13 20 l26 0 Z");
                this.slipSkidTriangle.setAttribute("fill", "white");
                this.attitude_root.appendChild(this.slipSkidTriangle);
                this.slipSkid = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkid.setAttribute("d", "M-13 -136 L-13 -140 L13 -140 L13 -136 Z");
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
            this.bottomPart.setAttribute("transform", "rotate(" + this.bank + ", 0, 0) translate(0," + (this.pitch * this.bankSizeRatio * 1.67) + ")");
        if (this.pitch_root_group)
            this.pitch_root_group.setAttribute("transform", "rotate(" + this.bank + ", 0, 0)");
        if (this.attitude_pitch)
            this.attitude_pitch.setAttribute("transform", "translate(0," + (this.pitch * this.bankSizeRatio * this.bankSizeRatioFactor * 1.67) + ")");
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
            var _top = 33;
            var _left = 0;
            var _width = width;
            var _height = 80;
            var bg = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(bg, "x", _left.toString());
            diffAndSetAttribute(bg, "y", _top.toString());
            diffAndSetAttribute(bg, "width", _width.toString());
            diffAndSetAttribute(bg, "height", _height.toString());
            diffAndSetAttribute(bg, "fill", "white");
            bg.setAttribute("fill-opacity", 0.15)
            this.centerSVG.appendChild(bg);
            var cursorPosX = _width * 0.5;
            var cursorPosY = posY + 30;
            var cursorWidth = 35;
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
                diffAndSetAttribute(cursorShape, "fill", "white");
                diffAndSetAttribute(cursorShape, "fill-opacity", this.cursorOpacity);
                diffAndSetAttribute(cursorShape, "d", "M 19 1 L 20 1 L 20 62 L 18 62 L 18 20 L 18 1 Z");
                this.cursorSVG.appendChild(cursorShape);
            }
            this.centerSVG.appendChild(this.cursorSVG);
            var graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            diffAndSetAttribute(graduationGroup, "id", "Graduations");
            {
                this.graduationScrollPosX = _left + _width * 0.5;
                this.graduationScrollPosY = _top;
                if (!this.graduations) {
                    this.graduations = [];
                    for (var i = 0; i < this.totalGraduations; i++) {
                        var line = new Avionics.SVGGraduation();
                        line.IsPrimary = (i % (this.nbSecondaryGraduations + 1)) ? false : true;
                        var lineWidth = line.IsPrimary ? 4 : 4;
                        var lineHeight = line.IsPrimary ? 30 : 18;
                        var linePosY = 0;
                        line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                        line.SVGLine.setAttribute("y", linePosY.toString());
                        line.SVGLine.setAttribute("width", lineWidth.toString());
                        line.SVGLine.setAttribute("height", lineHeight.toString());
                        line.SVGLine.setAttribute("fill", "white");
                        if (line.IsPrimary) {
                            line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                            line.SVGText1.setAttribute("x", "2");
                            line.SVGText1.setAttribute("y", (linePosY + lineHeight + 15).toString());
                            line.SVGText1.setAttribute("fill", "white");
                            line.SVGText1.setAttribute("font-size", (this.fontSize * 1.5).toString());
                            line.SVGText1.setAttribute("font-family", "Jost-SemiBold");
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
        }
        this.rootGroup.appendChild(this.centerSVG);
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    update(dTime) {
        var compass = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        this.updateGraduationScrolling(compass);
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
                        this.graduations[i].SVGLine.setAttribute("height", "18");
                        this.graduations[i].SVGText1.setAttribute("y", "36");
                        if (roundedVal == 0)
                            this.graduations[i].SVGText1.textContent = "N";
                        else if (roundedVal == 9)
                            this.graduations[i].SVGText1.textContent = "E";
                        else if (roundedVal == 18)
                            this.graduations[i].SVGText1.textContent = "S";
                        else if (roundedVal == 27)
                            this.graduations[i].SVGText1.textContent = "W";
                        else
                            this.graduations[i].SVGText1.textContent = roundedVal.toString().padStart(2,"0");

                    }
                    else {
                        this.graduations[i].SVGText1.textContent = "";
                        this.graduations[i].SVGLine.setAttribute("height", "30");
                    }
                    this.graduations[i].SVGText1.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    currentVal = this.graduationScroller.nextValue;
                }
                currentX += this.graduationSpacing;
            }
        }
    }
}
customElements.define('cj4-sai-compass-indicator', CJ4_SAI_CompassIndicator);
registerInstrument("cj4-sai-display-element", CJ4_SAI);