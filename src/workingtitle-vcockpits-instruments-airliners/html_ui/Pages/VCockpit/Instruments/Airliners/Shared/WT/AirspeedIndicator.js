class Jet_PFD_AirspeedIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.cursorOpacity = "1.0";
        this.fontSize = 25;
        this.machVisible = false;
        this.machSpeed = 0;
        this.refHeight = 0;
        this.targetSpeedPointerHeight = 0;
        this.stripHeight = 0;
        this.stripBorderSize = 0;
        this.stripOffsetX = 0;
        this.speedMarkers = new Array();
        this.speedMarkersWidth = 50;
        this.lineLength = 15;
        this.speedMarkersHeight = 50;
        this.graduationScrollPosX = 0;
        this.graduationScrollPosY = 0;
        this.graduationSpacing = 30;
        this.graduationMinValue = 40;
        this.nbPrimaryGraduations = 11;
        this.nbSecondaryGraduations = 1;
        this.totalGraduations = this.nbPrimaryGraduations + ((this.nbPrimaryGraduations - 1) * this.nbSecondaryGraduations);
        this.hudAPSpeed = 0;
        this.isHud = false;
        this.altOver20k = false;
        this._aircraft = Aircraft.A320_NEO;
        this._computedIASAcceleration = 0;
        this._lowestSelectableSpeed = 0;
        this._alphaProtectionMin = 0;
        this._alphaProtectionMax = 0;
        this._stallSpeed = 0;
        this._maxSpeed = 600;
        this._lastMaxSpeedOverride = 600;
        this._lastMaxSpeedOverrideTime = 0;
        this._smoothFactor = 0.5;
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
        this.machPrefixSVG = null;
        this.machPrefixdecimalSVG = null;
        this.machValueSVG = null;
        this.cursorIntegrals = null;
        this.cursorDecimals = null;
        this.targetSpeedSVG = null;
        this.targetSpeedBgSVG = null;
        this.targetSpeedIconSVG = null;
        this.targetSpeedPointerSVG = null;
        this.speedTrendArrowSVG = null;
        this.speedTrendArrowSVGShape = null;
        this.blueSpeedSVG = null;
        this.blueSpeedText = null;
        this.redSpeedSVG = null;
        this.redSpeedText = null;
        this.speedNotSetSVG = null;
        this.nextFlapSVG = null;
        this.nextFlapSVGShape = null;
        this.greenDotSVG = null;
        this.greenDotSVGShape = null;
        this.stripsSVG = null;
        this.vMaxStripSVG = null;
        this.vLSStripSVG = null;
        this.stallProtMinStripSVG = null;
        this.stallProtMaxStripSVG = null;
        this.stallStripSVG = null;
        this.speedMarkerSVG = null;
        this.speedMarkersWidth = null;
        this.speedMarkersHeight = null;
        this.speedMarkers.splice(0, this.speedMarkers.length);
        this.vSpeedSVG = null;
        this.v1Speed = null;
        this.vRSpeed = null;
        this.v2Speed = null;
        this.vXSpeed = null;
        this.graduationVLine = null;
        this.stripBorderSize = 0;
        this.stripOffsetX = 0;
        this.altOver20k = false;
        if (this.aircraft == Aircraft.CJ4)
            this.construct_CJ4();
        else if (this.aircraft == Aircraft.B747_8)
            this.construct_B747_8();
        else if (this.aircraft == Aircraft.AS01B)
            this.construct_AS01B();
        else
            this.construct_A320_Neo();
    }
    construct_CJ4() {
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 250 500");
        var width = 140;
        var height = 415;
        var posX = width * 0.5;
        var posY = 452.5;
        var gradWidth = 90;
        this.refHeight = height;
        this.graduationSpacing = 27.5;
        this.graduationScroller = new Avionics.Scroller(this.nbPrimaryGraduations, 10);
        this.cursorIntegrals = new Array();
        this.cursorIntegrals.push(new Avionics.AirspeedScroller(45, 100));
        this.cursorIntegrals.push(new Avionics.AirspeedScroller(45, 10));
        this.cursorDecimals = new Avionics.AirspeedScroller(30);
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "Airspeed");
        }
        else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        {
            this.machPrefixSVG = document.createElementNS(Avionics.SVG.NS, "text");
            this.machPrefixSVG.textContent = "M";
            this.machPrefixSVG.setAttribute("x", (posX - 24).toString());
            this.machPrefixSVG.setAttribute("y", (posY + 30).toString());
            this.machPrefixSVG.setAttribute("fill", "#9c9c9c");
            this.machPrefixSVG.setAttribute("font-size", (this.fontSize * 1.2).toString());
            this.machPrefixSVG.setAttribute("font-family", "Roboto-Light");
            this.machPrefixSVG.setAttribute("text-anchor", "end");
            this.machPrefixSVG.setAttribute("stroke", "black");
            this.machPrefixSVG.setAttribute("stroke-width", "7px");
            this.machPrefixSVG.setAttribute("alignment-baseline", "top");
            this.rootGroup.appendChild(this.machPrefixSVG);
            this.machPrefixdecimalSVG = document.createElementNS(Avionics.SVG.NS, "text");
            this.machPrefixdecimalSVG.textContent = ".";
            this.machPrefixdecimalSVG.setAttribute("x", (posX - 4).toString());
            this.machPrefixdecimalSVG.setAttribute("y", (posY + 30).toString());
            this.machPrefixdecimalSVG.setAttribute("fill", "#11d011");
            this.machPrefixdecimalSVG.setAttribute("font-size", (this.fontSize * 2.5).toString());
            this.machPrefixdecimalSVG.setAttribute("font-family", "Roboto-Light");
            this.machPrefixdecimalSVG.setAttribute("text-anchor", "end");
			this.machPrefixdecimalSVG.setAttribute("stroke", "black");
			this.machPrefixdecimalSVG.setAttribute("stroke-width", "7px");
            this.machPrefixdecimalSVG.setAttribute("alignment-baseline", "top");
            this.rootGroup.appendChild(this.machPrefixdecimalSVG);
            this.machValueSVG = document.createElementNS(Avionics.SVG.NS, "text");
            this.machValueSVG.textContent = "422";
            this.machValueSVG.setAttribute("x", (posX - 16).toString());
            this.machValueSVG.setAttribute("y", (posY + 30).toString());
            this.machValueSVG.setAttribute("fill", "#11d011");
			      this.machValueSVG.setAttribute("stroke", "black");
			      this.machValueSVG.setAttribute("stroke-width", "7px");
            this.machValueSVG.setAttribute("font-size", (this.fontSize * 1.3).toString());
            this.machValueSVG.setAttribute("font-family", "Roboto-Light");
            this.machValueSVG.setAttribute("text-anchor", "start");
            //this.machPrefixSVG.setAttribute("alignment-baseline", "top");
            this.rootGroup.appendChild(this.machValueSVG);
        }
        posY -= height;
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
            bg.setAttribute("fill-opacity", "0.5");
            this.centerSVG.appendChild(bg);
            var graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationGroup.setAttribute("id", "Graduations");
            {
                this.graduationScrollPosX = _left + gradWidth;
                this.graduationScrollPosY = _top + _height * 0.5;
                this.graduations = [];
                for (var i = 0; i < this.totalGraduations; i++) {
                    var line = new Avionics.SVGGraduation();
                    line.IsPrimary = (i % (this.nbSecondaryGraduations + 1)) ? false : true;
                    var lineWidth = line.IsPrimary ? 20 : 8;
                    var lineHeight = line.IsPrimary ? 2 : 2;
                    var linePosX = -lineWidth;
                    line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                    line.SVGLine.setAttribute("x", linePosX.toString());
                    line.SVGLine.setAttribute("width", lineWidth.toString());
                    line.SVGLine.setAttribute("height", lineHeight.toString());
                    line.SVGLine.setAttribute("fill", "#cccac8");
                    if (line.IsPrimary) {
                        line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                        line.SVGText1.setAttribute("x", (linePosX - 4).toString());
                        line.SVGText1.setAttribute("y", "4");
                        line.SVGText1.setAttribute("fill", "white");
                        line.SVGText1.setAttribute("font-size", (this.fontSize * 1.0).toString());
                        line.SVGText1.setAttribute("font-family", "Roboto-Light");
                        line.SVGText1.setAttribute("text-anchor", "end");
                        line.SVGText1.setAttribute("alignment-baseline", "central");
                    }
                    this.graduations.push(line);
                }
                this.graduationVLine = document.createElementNS(Avionics.SVG.NS, "line");
                this.graduationVLine.setAttribute("x1", this.graduationScrollPosX.toString());
                this.graduationVLine.setAttribute("y1", "0");
                this.graduationVLine.setAttribute("x2", this.graduationScrollPosX.toString());
                this.graduationVLine.setAttribute("y2", "0");
                this.graduationVLine.setAttribute("stroke", "#cccac8");
                this.graduationVLine.setAttribute("stroke-width", "2");
                for (var i = 0; i < this.totalGraduations; i++) {
                    var line = this.graduations[i];
                    graduationGroup.appendChild(line.SVGLine);
                    if (line.SVGText1) {
                        graduationGroup.appendChild(line.SVGText1);
                    }
                }
                graduationGroup.appendChild(this.graduationVLine);
                this.centerSVG.appendChild(graduationGroup);
            }
            var cursorPosX = _left - 18;
            var cursorPosY = _top + _height * 0.5 + 2;
            var cursorWidth = width;
            var cursorHeight = 64;
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
            this.cursorSVG.setAttribute("viewBox", "0 7 " + cursorWidth + " " + cursorHeight);
            {
                this.cursorSVGDefs = document.createElementNS(Avionics.SVG.NS, "defs");
                this.cursorSVGClip = document.createElementNS(Avionics.SVG.NS, "clipPath");
                this.cursorSVGClip.setAttribute("id", "SpdCursorClip");
                this.cursorSVGClipShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.cursorSVGClipShape.setAttribute("d", "M 24 23 L 62 23 L 62 9 L 86 9 L 86 28 L 105 39 L 86 50 L 86 70 L 62 70 L 62 55 L 24 55 Z");
                this.cursorSVGClip.appendChild(this.cursorSVGClipShape);
                this.cursorSVGDefs.appendChild(this.cursorSVGClip);
                this.cursorSVG.appendChild(this.cursorSVGDefs);

                if (!this.cursorSVGShape)
                    this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.cursorSVGShape.setAttribute("fill", "black");
                this.cursorSVGShape.setAttribute("d", "M24 22 L62 22 L62 8 L86 8 L86 28 L105 39 L86 50 L86 71 L62 71 L62 56 L24 56 Z");
                this.cursorSVGShape.setAttribute("stroke", "white");
                this.cursorSVGShape.setAttribute("stroke-width", "1.5");
                this.cursorSVG.appendChild(this.cursorSVGShape);
                var _cursorPosX = -2;
                var _cursorPosY = cursorHeight * 0.5 + 10.5;
                this.cursorSVGIntegralContainer = document.createElementNS(Avionics.SVG.NS, "g");
                this.cursorSVGIntegralContainer.setAttribute("clip-path", "url(#SpdCursorClip)");
                this.cursorIntegrals[0].construct(this.cursorSVGIntegralContainer, _cursorPosX + 48, _cursorPosY, _width, "Roboto-Bold", this.fontSize * 1.2, "green");
                this.cursorIntegrals[1].construct(this.cursorSVGIntegralContainer, _cursorPosX + 66, _cursorPosY, _width, "Roboto-Bold", this.fontSize * 1.2, "green");
                this.cursorDecimals.construct(this.cursorSVGIntegralContainer, _cursorPosX + 86, _cursorPosY, _width, "Roboto-Bold", this.fontSize * 1.2, "green");
                this.cursorSVG.appendChild(this.cursorSVGIntegralContainer);
            }
            if (!this.speedTrendArrowSVG) {
                this.speedTrendArrowSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.speedTrendArrowSVG.setAttribute("id", "SpeedTrendArrowGroup");
            }
            else
                Utils.RemoveAllChildren(this.speedTrendArrowSVG);
            this.speedTrendArrowSVG.setAttribute("x", "68");
            this.speedTrendArrowSVG.setAttribute("y", "0");
            this.speedTrendArrowSVG.setAttribute("width", "250");
            this.speedTrendArrowSVG.setAttribute("height", height.toString());
            this.speedTrendArrowSVG.setAttribute("viewBox", "0 0 250 " + height.toString());
            {
                if (!this.speedTrendArrowSVGShape)
                    this.speedTrendArrowSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.speedTrendArrowSVGShape.setAttribute("fill", "none");
                this.speedTrendArrowSVGShape.setAttribute("stroke", "magenta");
                this.speedTrendArrowSVGShape.setAttribute("stroke-width", "2");
                this.speedTrendArrowSVG.appendChild(this.speedTrendArrowSVGShape);
                let dash = document.createElementNS(Avionics.SVG.NS, "line");
                dash.setAttribute("x1", "55");
                dash.setAttribute("y1", (height * 0.5).toString());
                dash.setAttribute("x2", "71");
                dash.setAttribute("y2", (height * 0.5).toString());
                dash.setAttribute("stroke", "white");
                dash.setAttribute("stroke-width", "3");
                this.speedTrendArrowSVG.appendChild(dash);
            }
            var stripViewPosX = _left + gradWidth + 2;
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
                    let stripWidth = 9;
                    let shape = document.createElementNS(Avionics.SVG.NS, "path");
                    shape.setAttribute("fill", "red");
                    shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.vMaxStripSVG.appendChild(shape);
                }
                this.stripsSVG.appendChild(this.vMaxStripSVG);
                this.stallStripSVG = document.createElementNS(Avionics.SVG.NS, "g");
                this.stallStripSVG.setAttribute("id", "Stall");
                {
                    let stripWidth = 9;
                    let shape = document.createElementNS(Avionics.SVG.NS, "path");
                    shape.setAttribute("fill", "red");
                    shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.stallStripSVG.appendChild(shape);
                }
                this.stripsSVG.appendChild(this.stallStripSVG);
            }
            var targetSpeedPointerPosX = _left + gradWidth + 2;
            var targetSpeedPointerPosY = _top + _height * 0.5;
            var targetSpeedPointerWidth = width;
            this.targetSpeedPointerHeight = 47;
            this.targetSpeedPointerSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.targetSpeedPointerSVG.setAttribute("id", "TargetSpeedPointerGroup");
            this.targetSpeedPointerSVG.setAttribute("x", targetSpeedPointerPosX.toString());
            this.targetSpeedPointerSVG.setAttribute("y", (targetSpeedPointerPosY - this.targetSpeedPointerHeight * 0.5).toString());
            this.targetSpeedPointerSVG.setAttribute("width", targetSpeedPointerWidth.toString());
            this.targetSpeedPointerSVG.setAttribute("height", this.targetSpeedPointerHeight.toString());
            this.targetSpeedPointerSVG.setAttribute("viewBox", "0 0 " + targetSpeedPointerWidth + " " + this.targetSpeedPointerHeight);
            {
                let shape = document.createElementNS(Avionics.SVG.NS, "path");
                shape.setAttribute("fill", "none");
                shape.setAttribute("stroke", "cyan");
                shape.setAttribute("stroke-width", "2");
                shape.setAttribute("d", "M 0 22 l 18 -8 l 11 0 l 0 16 l -11 0 l -18 -8 z");
                this.targetSpeedPointerSVG.appendChild(shape);
            }
            var speedMarkersPosX = _left + gradWidth;
            var speedMarkersPosY = 0;
            this.speedMarkersWidth = width;
            this.speedMarkersHeight = 70;
            this.createSpeedMarker("1", speedMarkersPosX, speedMarkersPosY, this.updateMarkerV1, 0.8, 1.2, "cyan", false, [], 16, 0);
            this.createSpeedMarker("R", speedMarkersPosX, speedMarkersPosY, this.updateMarkerVR, 0.8, 1.2, "cyan", false, [], 22, 10);
            this.createSpeedMarker("2", speedMarkersPosX, speedMarkersPosY, this.updateMarkerV2, 0.8, 1.2, "cyan", false, [], 35, 20);
            this.createSpeedMarker("RF", speedMarkersPosX, speedMarkersPosY, this.updateMarkerVRef, 0.8, 1.2, "cyan", false, [], 15, 0);
            this.createSpeedMarker("T", speedMarkersPosX, speedMarkersPosY, this.updateMarkerVX, 0.8, 1.2, "cyan", false, [], 45, 30);
            this.createSpeedMarker("AP", speedMarkersPosX, speedMarkersPosY, this.updateMarkerVApp, 0.8, 1.2, "cyan", false, [], 22, 10);
            this.createSpeedMarker("F15", speedMarkersPosX, speedMarkersPosY, this.updateMarkerFlaps15Marker, 0.8, 1.2, "white", false, [], 10, -4);
            this.createSpeedMarker("F35", speedMarkersPosX, speedMarkersPosY, this.updateMarkerFlaps35Marker, 0.8, 1.2, "white", false, [], 10, -4);
            this.centerSVG.appendChild(this.stripsSVG);
            this.centerSVG.appendChild(this.speedMarkerSVG);
            this.centerSVG.appendChild(this.targetSpeedPointerSVG);
            this.centerSVG.appendChild(this.cursorSVG);
            this.centerSVG.appendChild(this.speedTrendArrowSVG);
        }
        this.rootGroup.appendChild(this.centerSVG);
        this.vSpeedSVG = document.createElementNS(Avionics.SVG.NS, "g");
        this.vSpeedSVG.setAttribute("id", "VSpeeds");
        {
            let speedX = posX - 45;
            let speedY = posY + height - 18;
            this.titleV1V = document.createElementNS(Avionics.SVG.NS, "text");
            this.titleV1V.textContent = "V";
            this.titleV1V.setAttribute("x", speedX.toString());
            this.titleV1V.setAttribute("y", speedY.toString());
            this.titleV1V.setAttribute("fill", "white");
            this.titleV1V.setAttribute("font-size", (this.fontSize * 1.5).toString());
            this.titleV1V.setAttribute("font-family", "Roboto-Bold");
            this.titleV1V.setAttribute("text-anchor", "start");
            this.titleV1V.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(this.titleV1V);

            this.title1 = document.createElementNS(Avionics.SVG.NS, "text");
            this.title1.textContent = "1";
            this.title1.setAttribute("x", (speedX + 19).toString());
            this.title1.setAttribute("y", (speedY + 1).toString());
            this.title1.setAttribute("fill", "white");
            this.title1.setAttribute("font-size", (this.fontSize * 0.5).toString());
            this.title1.setAttribute("font-family", "Roboto-Bold");
            this.title1.setAttribute("text-anchor", "start");
            this.title1.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(this.title1);
            this.title1.setAttribute("class", "subscript-vspeed");

            this.v1Speed = document.createElementNS(Avionics.SVG.NS, "text");
            this.v1Speed.setAttribute("x", (speedX + 85).toString());
            this.v1Speed.setAttribute("y", speedY.toString());
            this.v1Speed.setAttribute("fill", "white");
            this.v1Speed.setAttribute("font-size", (this.fontSize * 0.8).toString());
            this.v1Speed.setAttribute("font-family", "Roboto-Bold");
            this.v1Speed.setAttribute("text-anchor", "end");
            this.v1Speed.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(this.v1Speed);
            speedY -= 40;

            this.titleVRV = document.createElementNS(Avionics.SVG.NS, "text");
            this.titleVRV.textContent = "V";
            this.titleVRV.setAttribute("x", speedX.toString());
            this.titleVRV.setAttribute("y", speedY.toString());
            this.titleVRV.setAttribute("fill", "white");
            this.titleVRV.setAttribute("font-size", (this.fontSize * 1.5).toString());
            this.titleVRV.setAttribute("font-family", "Roboto-Bold");
            this.titleVRV.setAttribute("text-anchor", "start");
            this.titleVRV.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(this.titleVRV);

            this.titleR = document.createElementNS(Avionics.SVG.NS, "text");
            this.titleR.textContent = "R";
            this.titleR.setAttribute("x", (speedX + 19).toString());
            this.titleR.setAttribute("y", (speedY + 1).toString());
            this.titleR.setAttribute("fill", "white");
            this.titleR.setAttribute("font-size", (this.fontSize * 1.5).toString());
            this.titleR.setAttribute("font-family", "Roboto-Bold");
            this.titleR.setAttribute("text-anchor", "start");
            this.titleR.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(this.titleR);
            this.titleR.setAttribute("class", "subscript-vspeed");

            this.vRSpeed = document.createElementNS(Avionics.SVG.NS, "text");
            this.vRSpeed.setAttribute("x", (speedX + 85).toString());
            this.vRSpeed.setAttribute("y", speedY.toString());
            this.vRSpeed.setAttribute("fill", "cyan");
            this.vRSpeed.setAttribute("font-size", (this.fontSize * 0.8).toString());
            this.vRSpeed.setAttribute("font-family", "Roboto-Bold");
            this.vRSpeed.setAttribute("text-anchor", "end");
            this.vRSpeed.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(this.vRSpeed);
            speedY -= 40;

            this.titleV2V = document.createElementNS(Avionics.SVG.NS, "text");
            this.titleV2V.textContent = "V";
            this.titleV2V.setAttribute("x", speedX.toString());
            this.titleV2V.setAttribute("y", speedY.toString());
            this.titleV2V.setAttribute("fill", "white");
            this.titleV2V.setAttribute("font-size", (this.fontSize * 1.5).toString());
            this.titleV2V.setAttribute("font-family", "Roboto-Bold");
            this.titleV2V.setAttribute("text-anchor", "start");
            this.titleV2V.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(this.titleV2V);

            this.title2 = document.createElementNS(Avionics.SVG.NS, "text");
            this.title2.textContent = "2";
            this.title2.setAttribute("x", (speedX + 19).toString());
            this.title2.setAttribute("y", (speedY + 2).toString());
            this.title2.setAttribute("fill", "white");
            this.title2.setAttribute("font-size", (this.fontSize * 1.5).toString());
            this.title2.setAttribute("font-family", "Roboto-Bold");
            this.title2.setAttribute("text-anchor", "start");
            this.title2.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(this.title2);
            this.title2.setAttribute("class", "subscript-vspeed");

            this.v2Speed = document.createElementNS(Avionics.SVG.NS, "text");
            this.v2Speed.setAttribute("x", (speedX + 85).toString());
            this.v2Speed.setAttribute("y", speedY.toString());
            this.v2Speed.setAttribute("fill", "cyan");
            this.v2Speed.setAttribute("font-size", (this.fontSize * 0.8).toString());
            this.v2Speed.setAttribute("font-family", "Roboto-Bold");
            this.v2Speed.setAttribute("text-anchor", "end");
            this.v2Speed.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(this.v2Speed);
            speedY -= 40;

            this.titleVTV = document.createElementNS(Avionics.SVG.NS, "text");
            this.titleVTV.textContent = "V";
            this.titleVTV.setAttribute("x", speedX.toString());
            this.titleVTV.setAttribute("y", speedY.toString());
            this.titleVTV.setAttribute("fill", "white");
            this.titleVTV.setAttribute("font-size", (this.fontSize * 1.5).toString());
            this.titleVTV.setAttribute("font-family", "Roboto-Bold");
            this.titleVTV.setAttribute("text-anchor", "start");
            this.titleVTV.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(this.titleVTV);

            this.titleT = document.createElementNS(Avionics.SVG.NS, "text");
            this.titleT.textContent = "T";
            this.titleT.setAttribute("x", (speedX + 19).toString());
            this.titleT.setAttribute("y", (speedY + 1).toString());
            this.titleT.setAttribute("fill", "white");
            this.titleT.setAttribute("font-size", (this.fontSize * 1.5).toString());
            this.titleT.setAttribute("font-family", "Roboto-Bold");
            this.titleT.setAttribute("text-anchor", "start");
            this.titleT.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(this.titleT);
            this.titleT.setAttribute("class", "subscript-vspeed");

            this.vXSpeed = document.createElementNS(Avionics.SVG.NS, "text");
            this.vXSpeed.setAttribute("x", (speedX + 85).toString());
            this.vXSpeed.setAttribute("y", speedY.toString());
            this.vXSpeed.setAttribute("fill", "cyan");
            this.vXSpeed.setAttribute("font-size", (this.fontSize * 0.8).toString());
            this.vXSpeed.setAttribute("font-family", "Roboto-Bold");
            this.vXSpeed.setAttribute("text-anchor", "end");
            this.vXSpeed.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(this.vXSpeed);
            /* speedY -= 25;
            title = document.createElementNS(Avionics.SVG.NS, "text");
            title.textContent = "VRF";
            title.setAttribute("x", speedX.toString());
            title.setAttribute("y", speedY.toString());
            title.setAttribute("fill", "white");
            title.setAttribute("font-size", (this.fontSize * 1.5).toString());
            title.setAttribute("font-family", "Roboto-Bold");
            title.setAttribute("text-anchor", "start");
            title.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(title);
            this.vRefSpeed = document.createElementNS(Avionics.SVG.NS, "text");
            this.vRefSpeed.setAttribute("x", (speedX + 40).toString());
            this.vRefSpeed.setAttribute("y", speedY.toString());
            this.vRefSpeed.setAttribute("fill", "cyan");
            this.vRefSpeed.setAttribute("font-size", (this.fontSize * 0.8).toString());
            this.vRefSpeed.setAttribute("font-family", "Roboto-Bold");
            this.vRefSpeed.setAttribute("text-anchor", "start");
            this.vRefSpeed.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(this.vRefSpeed);
            speedY -= 25;
            title = document.createElementNS(Avionics.SVG.NS, "text");
            title.textContent = "VAP";
            title.setAttribute("x", speedX.toString());
            title.setAttribute("y", speedY.toString());
            title.setAttribute("fill", "white");
            title.setAttribute("font-size", (this.fontSize * 1.5).toString());
            title.setAttribute("font-family", "Roboto-Bold");
            title.setAttribute("text-anchor", "start");
            title.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(title);
            this.vAppSpeed = document.createElementNS(Avionics.SVG.NS, "text");
            this.vAppSpeed.setAttribute("x", (speedX + 40).toString());
            this.vAppSpeed.setAttribute("y", speedY.toString());
            this.vAppSpeed.setAttribute("fill", "cyan");
            this.vAppSpeed.setAttribute("font-size", (this.fontSize * 0.8).toString());
            this.vAppSpeed.setAttribute("font-family", "Roboto-Bold");
            this.vAppSpeed.setAttribute("text-anchor", "start");
            this.vAppSpeed.setAttribute("alignment-baseline", "central");
            this.vSpeedSVG.appendChild(this.vAppSpeed); */
        }
        this.rootGroup.appendChild(this.vSpeedSVG);

        this.speedBackground = document.createElementNS(Avionics.SVG.NS, "rect");
        this.speedBackground.setAttribute("x", 12);
        this.speedBackground.setAttribute("y", 2);
        this.speedBackground.setAttribute("width", 113);
        this.speedBackground.setAttribute("height", 32);
        this.speedBackground.setAttribute("fill", "black");
        this.speedBackground.setAttribute("fill-opacity", "0.5");
        this.rootGroup.appendChild(this.speedBackground);

        this.targetSpeedIconSVG = document.createElementNS(Avionics.SVG.NS, "path");
        this.targetSpeedIconSVG.setAttribute("d", "M 21 19 l 19 -8 l 11 0 l 0 16 l -11 0 l -19 -8 z");
        this.targetSpeedIconSVG.setAttribute("fill", "none");
        this.targetSpeedIconSVG.setAttribute("stroke", "cyan");
        this.targetSpeedIconSVG.setAttribute("stroke-width", "2");
        this.rootGroup.appendChild(this.targetSpeedIconSVG);
        this.targetSpeedSVG = document.createElementNS(Avionics.SVG.NS, "text");
        this.targetSpeedSVG.textContent = "260";
        this.targetSpeedSVG.setAttribute("x", (posX - 12).toString());
        this.targetSpeedSVG.setAttribute("y", (posY - 8).toString());
        this.targetSpeedSVG.setAttribute("fill", "cyan");
        this.targetSpeedSVG.setAttribute("font-size", (this.fontSize * 0.5).toString());
        this.targetSpeedSVG.setAttribute("font-family", "Roboto-Bold");
        this.targetSpeedSVG.setAttribute("text-anchor", "start");
        this.rootGroup.appendChild(this.targetSpeedSVG);
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    construct_B747_8() {
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 250 800");
        var posX = 100;
        var posY = 0;
        var width = 105;
        var height = 640;
        var arcWidth = 100;
        this.refHeight = height;
        this.stripOffsetX = -2;
        this.graduationSpacing = 54;
        this.graduationScroller = new Avionics.Scroller(this.nbPrimaryGraduations, 20);
        this.cursorIntegrals = new Array();
        this.cursorIntegrals.push(new Avionics.AirspeedScroller(52, 100));
        this.cursorIntegrals.push(new Avionics.AirspeedScroller(52, 10));
        this.cursorDecimals = new Avionics.AirspeedScroller(37);
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "Airspeed");
        }
        else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        var sideTextHeight = 75;
        if (!this.targetSpeedSVG)
            this.targetSpeedSVG = document.createElementNS(Avionics.SVG.NS, "text");
        this.targetSpeedSVG.textContent = ".000";
        this.targetSpeedSVG.setAttribute("x", (posX + 10).toString());
        this.targetSpeedSVG.setAttribute("y", (posY + sideTextHeight * 0.5).toString());
        this.targetSpeedSVG.setAttribute("fill", "#D570FF");
        this.targetSpeedSVG.setAttribute("font-size", (this.fontSize * 1.6).toString());
        this.targetSpeedSVG.setAttribute("font-family", "Roboto-Bold");
        this.targetSpeedSVG.setAttribute("text-anchor", "middle");
        this.targetSpeedSVG.setAttribute("alignment-baseline", "central");
        this.rootGroup.appendChild(this.targetSpeedSVG);
        posY += sideTextHeight;
        if (!this.centerSVG) {
            this.centerSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.centerSVG.setAttribute("id", "CenterGroup");
        }
        else
            Utils.RemoveAllChildren(this.centerSVG);
        this.centerSVG.setAttribute("x", (posX - width * 0.5).toString());
        this.centerSVG.setAttribute("y", posY.toString());
        this.centerSVG.setAttribute("width", (width + arcWidth).toString());
        this.centerSVG.setAttribute("height", height.toString());
        this.centerSVG.setAttribute("viewBox", "0 0 " + (width + arcWidth) + " " + height);
        {
            var _top = 0;
            var _left = 7;
            var _width = width;
            var _height = height;
            var bg = document.createElementNS(Avionics.SVG.NS, "rect");
            bg.setAttribute("x", _left.toString());
            bg.setAttribute("y", _top.toString());
            bg.setAttribute("width", _width.toString());
            bg.setAttribute("height", _height.toString());
            bg.setAttribute("fill", "#343B51");
            this.centerSVG.appendChild(bg);
            var graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationGroup.setAttribute("id", "Graduations");
            {
                this.graduationScrollPosX = _left + _width;
                this.graduationScrollPosY = _top + _height * 0.5;
                this.graduations = [];
                for (var i = 0; i < this.totalGraduations; i++) {
                    var line = new Avionics.SVGGraduation();
                    line.IsPrimary = (i % (this.nbSecondaryGraduations + 1)) ? false : true;
                    var lineWidth = line.IsPrimary ? 22 : 22;
                    var lineHeight = line.IsPrimary ? 3 : 3;
                    var linePosX = -lineWidth;
                    line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                    line.SVGLine.setAttribute("x", linePosX.toString());
                    line.SVGLine.setAttribute("width", lineWidth.toString());
                    line.SVGLine.setAttribute("height", lineHeight.toString());
                    line.SVGLine.setAttribute("fill", "white");
                    if (line.IsPrimary) {
                        line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                        line.SVGText1.setAttribute("x", (linePosX - 10).toString());
                        line.SVGText1.setAttribute("fill", "white");
                        line.SVGText1.setAttribute("font-size", (this.fontSize * 1.1).toString());
                        line.SVGText1.setAttribute("font-family", "Roboto-Bold");
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
            var cursorPosX = _left - 7;
            var cursorPosY = _top + _height * 0.5 + 3;
            var cursorWidth = width;
            var cursorHeight = 76;
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
            this.cursorSVG.setAttribute("viewBox", "0 2 " + cursorWidth + " " + cursorHeight);
            {
                if (!this.cursorSVGShape)
                    this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.cursorSVGShape.setAttribute("fill", "black");
                this.cursorSVGShape.setAttribute("d", "M2 2 L76 2 L76 28 L88 38 L76 50 L76 78 L2 78 Z");
                this.cursorSVGShape.setAttribute("stroke", "white");
                this.cursorSVGShape.setAttribute("stroke-width", "0.85");
                this.cursorSVG.appendChild(this.cursorSVGShape);
                var _cursorPosX = -14;
                var _cursorPosY = cursorHeight * 0.5;
                this.cursorIntegrals[0].construct(this.cursorSVG, _cursorPosX + 40, _cursorPosY, _width, "Roboto-Bold", this.fontSize * 1.5, "white");
                this.cursorIntegrals[1].construct(this.cursorSVG, _cursorPosX + 64, _cursorPosY, _width, "Roboto-Bold", this.fontSize * 1.5, "white");
                this.cursorDecimals.construct(this.cursorSVG, _cursorPosX + 87, _cursorPosY, _width, "Roboto-Bold", this.fontSize * 1.5, "white");
            }
            if (!this.speedTrendArrowSVG) {
                this.speedTrendArrowSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.speedTrendArrowSVG.setAttribute("id", "SpeedTrendArrowGroup");
            }
            else
                Utils.RemoveAllChildren(this.speedTrendArrowSVG);
            this.speedTrendArrowSVG.setAttribute("x", "18");
            this.speedTrendArrowSVG.setAttribute("y", "0");
            this.speedTrendArrowSVG.setAttribute("width", "250");
            this.speedTrendArrowSVG.setAttribute("height", height.toString());
            this.speedTrendArrowSVG.setAttribute("viewBox", "0 0 250 " + height.toString());
            {
                if (!this.speedTrendArrowSVGShape)
                    this.speedTrendArrowSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.speedTrendArrowSVGShape.setAttribute("fill", "none");
                this.speedTrendArrowSVGShape.setAttribute("stroke", "green");
                this.speedTrendArrowSVGShape.setAttribute("stroke-width", "2");
                this.speedTrendArrowSVG.appendChild(this.speedTrendArrowSVGShape);
            }
            var stripViewPosX = _left + _width;
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
                    let stripWidth = 14;
                    let shape = document.createElementNS(Avionics.SVG.NS, "path");
                    shape.setAttribute("fill", "black");
                    shape.setAttribute("stroke", "none");
                    shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.vMaxStripSVG.appendChild(shape);
                    let dashHeight = stripWidth * 1.0;
                    let dashSpacing = dashHeight * 1.15;
                    let y = this.stripHeight - dashHeight;
                    while (y > 0) {
                        let rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        rect.setAttribute("fill", "red");
                        rect.setAttribute("x", "0");
                        rect.setAttribute("y", y.toString());
                        rect.setAttribute("width", stripWidth.toString());
                        rect.setAttribute("height", dashHeight.toString());
                        this.vMaxStripSVG.appendChild(rect);
                        y -= dashHeight + dashSpacing;
                    }
                }
                this.stripsSVG.appendChild(this.vMaxStripSVG);
                this.stallProtMinStripSVG = document.createElementNS(Avionics.SVG.NS, "g");
                this.stallProtMinStripSVG.setAttribute("id", "StallProtMin");
                {
                    let stripWidth = 9;
                    let shape = document.createElementNS(Avionics.SVG.NS, "path");
                    shape.setAttribute("fill", "none");
                    shape.setAttribute("stroke", "orange");
                    shape.setAttribute("stroke-width", "3");
                    shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.stallProtMinStripSVG.appendChild(shape);
                }
                this.stripsSVG.appendChild(this.stallProtMinStripSVG);
                this.stallProtMaxStripSVG = document.createElementNS(Avionics.SVG.NS, "g");
                this.stallProtMaxStripSVG.setAttribute("id", "StallProtMax");
                {
                    let stripWidth = 14;
                    let shape = document.createElementNS(Avionics.SVG.NS, "path");
                    shape.setAttribute("fill", "black");
                    shape.setAttribute("stroke", "none");
                    shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.stallProtMaxStripSVG.appendChild(shape);
                    let dashHeight = stripWidth * 1.0;
                    let dashSpacing = dashHeight * 1.15;
                    let y = 0;
                    while (y < this.stripHeight) {
                        let rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        rect.setAttribute("fill", "red");
                        rect.setAttribute("x", "0");
                        rect.setAttribute("y", y.toString());
                        rect.setAttribute("width", stripWidth.toString());
                        rect.setAttribute("height", dashHeight.toString());
                        this.stallProtMaxStripSVG.appendChild(rect);
                        y += dashHeight + dashSpacing;
                    }
                }
                this.stripsSVG.appendChild(this.stallProtMaxStripSVG);
            }
            this.speedNotSetSVG = document.createElementNS(Avionics.SVG.NS, "g");
            this.speedNotSetSVG.setAttribute("id", "speedNotSet");
            {
                let textPosX = _left + _width * 1.25;
                let textPosY = _top + _height * 0.325;
                let textSpace = 25;
                let text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "NO";
                text.setAttribute("x", textPosX.toString());
                text.setAttribute("y", textPosY.toString());
                text.setAttribute("fill", "orange");
                text.setAttribute("font-size", (this.fontSize * 1.0).toString());
                text.setAttribute("font-family", "Roboto-Bold");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                this.speedNotSetSVG.appendChild(text);
                textPosY += textSpace;
                text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "V";
                text.setAttribute("x", textPosX.toString());
                text.setAttribute("y", textPosY.toString());
                text.setAttribute("fill", "orange");
                text.setAttribute("font-size", (this.fontSize * 1.0).toString());
                text.setAttribute("font-family", "Roboto-Bold");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                this.speedNotSetSVG.appendChild(text);
                textPosY += textSpace;
                text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "S";
                text.setAttribute("x", textPosX.toString());
                text.setAttribute("y", textPosY.toString());
                text.setAttribute("fill", "orange");
                text.setAttribute("font-size", (this.fontSize * 1.0).toString());
                text.setAttribute("font-family", "Roboto-Bold");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                this.speedNotSetSVG.appendChild(text);
                textPosY += textSpace;
                text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "P";
                text.setAttribute("x", textPosX.toString());
                text.setAttribute("y", textPosY.toString());
                text.setAttribute("fill", "orange");
                text.setAttribute("font-size", (this.fontSize * 1.0).toString());
                text.setAttribute("font-family", "Roboto-Bold");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                this.speedNotSetSVG.appendChild(text);
                textPosY += textSpace;
                text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "D";
                text.setAttribute("x", textPosX.toString());
                text.setAttribute("y", textPosY.toString());
                text.setAttribute("fill", "orange");
                text.setAttribute("font-size", (this.fontSize * 1.0).toString());
                text.setAttribute("font-family", "Roboto-Bold");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                this.speedNotSetSVG.appendChild(text);
            }
            var targetSpeedPointerPosX = _left + _width * 0.77;
            var targetSpeedPointerPosY = _top + _height * 0.5;
            var targetSpeedPointerWidth = width;
            this.targetSpeedPointerHeight = 46;
            this.targetSpeedPointerSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.targetSpeedPointerSVG.setAttribute("id", "TargetSpeedPointerGroup");
            this.targetSpeedPointerSVG.setAttribute("x", targetSpeedPointerPosX.toString());
            this.targetSpeedPointerSVG.setAttribute("y", (targetSpeedPointerPosY - this.targetSpeedPointerHeight * 0.5).toString());
            this.targetSpeedPointerSVG.setAttribute("width", targetSpeedPointerWidth.toString());
            this.targetSpeedPointerSVG.setAttribute("height", this.targetSpeedPointerHeight.toString());
            this.targetSpeedPointerSVG.setAttribute("viewBox", "0 0 " + targetSpeedPointerWidth + " " + this.targetSpeedPointerHeight);
            {
                let shape = document.createElementNS(Avionics.SVG.NS, "path");
                shape.setAttribute("fill", "none");
                shape.setAttribute("stroke", "#D570FF");
                shape.setAttribute("stroke-width", "2");
                shape.setAttribute("d", "M 0 22 L 25 10 L 52 10 L 52 34 L 25 34 Z");
                this.targetSpeedPointerSVG.appendChild(shape);
            }
            var speedMarkersPosX = _left + _width - 5;
            var speedMarkersPosY = 0;
            this.speedMarkersWidth = width;
            this.speedMarkersHeight = 70;
            let nbHandles = Simplane.getFlapsNbHandles();
            for (let i = 0; i < nbHandles; i++) {
                this.createSpeedMarker("", speedMarkersPosX, speedMarkersPosY, this.updateMarkerFlap, 0.8, 0.9, "#24F000", false, [i]);
            }
            this.createSpeedMarker("V1", speedMarkersPosX, speedMarkersPosY, this.updateMarkerV1, 0.8, 0.9, "#24F000");
            this.createSpeedMarker("VR", speedMarkersPosX, speedMarkersPosY, this.updateMarkerVR, 0.8, 0.9, "#24F000");
            this.createSpeedMarker("V2", speedMarkersPosX, speedMarkersPosY, this.updateMarkerV2, 0.8, 0.9, "#24F000");
            this.createSpeedMarker("REF", speedMarkersPosX, speedMarkersPosY, this.updateMarkerVRef, 0.8, 0.9, "#24F000");
            this.centerSVG.appendChild(this.stripsSVG);
            this.centerSVG.appendChild(this.speedNotSetSVG);
            this.centerSVG.appendChild(this.speedMarkerSVG);
            this.centerSVG.appendChild(this.targetSpeedPointerSVG);
            this.centerSVG.appendChild(this.cursorSVG);
            this.centerSVG.appendChild(this.speedTrendArrowSVG);
        }
        this.rootGroup.appendChild(this.centerSVG);
        {
            this.machPrefixSVG = document.createElementNS(Avionics.SVG.NS, "text");
            this.machPrefixSVG.textContent = ".";
            this.machPrefixSVG.setAttribute("x", (posX - 4).toString());
            this.machPrefixSVG.setAttribute("y", (posY + height + sideTextHeight * 0.65).toString());
            this.machPrefixSVG.setAttribute("fill", "white");
            this.machPrefixSVG.setAttribute("font-size", (this.fontSize * 1.1).toString());
            this.machPrefixSVG.setAttribute("font-family", "Roboto-Bold");
            this.machPrefixSVG.setAttribute("text-anchor", "end");
            this.machPrefixSVG.setAttribute("alignment-baseline", "top");
            this.rootGroup.appendChild(this.machPrefixSVG);
            this.machValueSVG = document.createElementNS(Avionics.SVG.NS, "text");
            this.machValueSVG.textContent = "000";
            this.machValueSVG.setAttribute("x", (posX).toString());
            this.machValueSVG.setAttribute("y", (posY + height + sideTextHeight * 0.65).toString());
            this.machValueSVG.setAttribute("fill", "white");
            this.machValueSVG.setAttribute("font-size", (this.fontSize * 1.25).toString());
            this.machValueSVG.setAttribute("font-family", "Roboto-Bold");
            this.machValueSVG.setAttribute("text-anchor", "start");
            this.machValueSVG.setAttribute("alignment-baseline", "top");
            this.rootGroup.appendChild(this.machValueSVG);
        }
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    construct_AS01B() {
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 250 800");
        var posX = 100;
        var posY = 0;
        var width = 105;
        var height = 640;
        var arcWidth = 35;
        this.refHeight = height;
        this.stripOffsetX = -2;
        this.graduationSpacing = 54;
        this.graduationScroller = new Avionics.Scroller(this.nbPrimaryGraduations, 20);
        this.cursorIntegrals = new Array();
        this.cursorIntegrals.push(new Avionics.AirspeedScroller(52, 100));
        this.cursorIntegrals.push(new Avionics.AirspeedScroller(52, 10));
        this.cursorDecimals = new Avionics.AirspeedScroller(37);
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "Airspeed");
        }
        else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        var sideTextHeight = 80;
        if (!this.isHud) {
            this.targetSpeedBgSVG = document.createElementNS(Avionics.SVG.NS, "rect");
            this.targetSpeedBgSVG.setAttribute("x", "90");
            this.targetSpeedBgSVG.setAttribute("y", "20");
            this.targetSpeedBgSVG.setAttribute("width", "80");
            this.targetSpeedBgSVG.setAttribute("height", "45");
            this.targetSpeedBgSVG.setAttribute("fill", "black");
            this.rootGroup.appendChild(this.targetSpeedBgSVG);
        }
        if (!this.targetSpeedSVG)
            this.targetSpeedSVG = document.createElementNS(Avionics.SVG.NS, "text");
        this.targetSpeedSVG.textContent = ".000";
        this.targetSpeedSVG.setAttribute("x", "165");
        this.targetSpeedSVG.setAttribute("y", (posY + sideTextHeight * 0.5).toString());
        this.targetSpeedSVG.setAttribute("fill", (this.isHud) ? "lime" : "#D570FF");
        this.targetSpeedSVG.setAttribute("font-size", (this.fontSize * 1.5).toString());
        this.targetSpeedSVG.setAttribute("font-family", "Roboto-bold");
        this.targetSpeedSVG.setAttribute("text-anchor", "end");
        this.targetSpeedSVG.setAttribute("alignment-baseline", "central");
        this.rootGroup.appendChild(this.targetSpeedSVG);
        posY += sideTextHeight;
        if (!this.centerSVG) {
            this.centerSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.centerSVG.setAttribute("id", "CenterGroup");
        }
        else
            Utils.RemoveAllChildren(this.centerSVG);
        this.centerSVG.setAttribute("x", (posX - width * 0.5).toString());
        this.centerSVG.setAttribute("y", posY.toString());
        this.centerSVG.setAttribute("width", (width + 30 + arcWidth).toString());
        this.centerSVG.setAttribute("height", height.toString());
        this.centerSVG.setAttribute("viewBox", "0 0 " + (width + arcWidth) + " " + height);
        {
            var _top = 0;
            var _left = 7;
            var _width = width;
            var _height = height;
            if (this.isHud) {
                var topLine = document.createElementNS(Avionics.SVG.NS, "line");
                topLine.setAttribute("x1", _left.toString());
                topLine.setAttribute("y1", _top.toString());
                topLine.setAttribute("x2", (_left + _width).toString());
                topLine.setAttribute("y2", _top.toString());
                topLine.setAttribute("stroke", "lime");
                topLine.setAttribute("stroke-width", "6");
                this.centerSVG.appendChild(topLine);
                var verticalLine = document.createElementNS(Avionics.SVG.NS, "line");
                verticalLine.setAttribute("x1", (_left + _width).toString());
                verticalLine.setAttribute("y1", _top.toString());
                verticalLine.setAttribute("x2", (_left + _width).toString());
                verticalLine.setAttribute("y2", (_top + _height).toString());
                verticalLine.setAttribute("stroke", "lime");
                verticalLine.setAttribute("stroke-width", "6");
                this.centerSVG.appendChild(verticalLine);
                var bottomLine = document.createElementNS(Avionics.SVG.NS, "line");
                bottomLine.setAttribute("x1", _left.toString());
                bottomLine.setAttribute("y1", (_top + _height).toString());
                bottomLine.setAttribute("x2", (_left + _width).toString());
                bottomLine.setAttribute("y2", (_top + _height).toString());
                bottomLine.setAttribute("stroke", "lime");
                bottomLine.setAttribute("stroke-width", "6");
                this.centerSVG.appendChild(bottomLine);
            }
            else {
                var bg = document.createElementNS(Avionics.SVG.NS, "rect");
                bg.setAttribute("x", _left.toString());
                bg.setAttribute("y", _top.toString());
                bg.setAttribute("width", _width.toString());
                bg.setAttribute("height", _height.toString());
                bg.setAttribute("fill", "black");
                bg.setAttribute("fill-opacity", "0.3");
                this.centerSVG.appendChild(bg);
            }
            var graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationGroup.setAttribute("id", "Graduations");
            {
                this.graduationScrollPosX = _left + _width;
                this.graduationScrollPosY = _top + _height * 0.505;
                this.graduations = [];
                for (var i = 0; i < this.totalGraduations; i++) {
                    var line = new Avionics.SVGGraduation();
                    line.IsPrimary = (i % (this.nbSecondaryGraduations + 1)) ? false : true;
                    var lineWidth = line.IsPrimary ? 22 : 22;
                    var lineHeight = line.IsPrimary ? 3 : 3;
                    var linePosX = -lineWidth;
                    line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                    line.SVGLine.setAttribute("x", linePosX.toString());
                    line.SVGLine.setAttribute("width", lineWidth.toString());
                    line.SVGLine.setAttribute("height", lineHeight.toString());
                    line.SVGLine.setAttribute("fill", (this.isHud) ? "lime" : "white");
                    if (line.IsPrimary) {
                        line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                        line.SVGText1.setAttribute("x", (linePosX - 10).toString());
                        line.SVGText1.setAttribute("fill", (this.isHud) ? "lime" : "white");
                        line.SVGText1.setAttribute("font-size", (this.fontSize * 1.1).toString());
                        line.SVGText1.setAttribute("font-family", "Roboto-Bold");
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
            var cursorPosX = _left - 7;
            var cursorPosY = _top + _height * 0.5 + 7;
            var cursorWidth = width;
            var cursorHeight = 76;
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
            this.cursorSVG.setAttribute("viewBox", "0 2 " + cursorWidth + " " + cursorHeight);
            {
                if (!this.cursorSVGShape)
                    this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.cursorSVGShape.setAttribute("fill", "black");
                this.cursorSVGShape.setAttribute("d", "M2 2 L76 2 L76 28 L88 38 L76 50 L76 78 L2 78 Z");
                this.cursorSVGShape.setAttribute("stroke", (this.isHud) ? "lime" : "white");
                this.cursorSVGShape.setAttribute("stroke-width", "0.85");
                this.cursorSVG.appendChild(this.cursorSVGShape);
                var _cursorPosX = -14;
                var _cursorPosY = cursorHeight * 0.5;
                this.cursorIntegrals[0].construct(this.cursorSVG, _cursorPosX + 40, _cursorPosY, _width, "Roboto-Bold", this.fontSize * 1.5, (this.isHud) ? "lime" : "white");
                this.cursorIntegrals[1].construct(this.cursorSVG, _cursorPosX + 64, _cursorPosY, _width, "Roboto-Bold", this.fontSize * 1.5, (this.isHud) ? "lime" : "white");
                this.cursorDecimals.construct(this.cursorSVG, _cursorPosX + 87, _cursorPosY, _width, "Roboto-Bold", this.fontSize * 1.5, (this.isHud) ? "lime" : "white");
            }
            this.speedNotSetSVG = document.createElementNS(Avionics.SVG.NS, "g");
            this.speedNotSetSVG.setAttribute("id", "speedNotSet");
            {
                let textPosX = _left + _width * 1.25;
                let textPosY = _top + _height * 0.325;
                let textSpace = 25;
                let text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "NO";
                text.setAttribute("x", textPosX.toString());
                text.setAttribute("y", textPosY.toString());
                text.setAttribute("fill", (this.isHud) ? "lime" : "orange");
                text.setAttribute("font-size", (this.fontSize * 1.0).toString());
                text.setAttribute("font-family", "Roboto-Bold");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                this.speedNotSetSVG.appendChild(text);
                textPosY += textSpace;
                text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "V";
                text.setAttribute("x", textPosX.toString());
                text.setAttribute("y", textPosY.toString());
                text.setAttribute("fill", (this.isHud) ? "lime" : "orange");
                text.setAttribute("font-size", (this.fontSize * 1.0).toString());
                text.setAttribute("font-family", "Roboto-Bold");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                this.speedNotSetSVG.appendChild(text);
                textPosY += textSpace;
                text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "S";
                text.setAttribute("x", textPosX.toString());
                text.setAttribute("y", textPosY.toString());
                text.setAttribute("fill", (this.isHud) ? "lime" : "orange");
                text.setAttribute("font-size", (this.fontSize * 1.0).toString());
                text.setAttribute("font-family", "Roboto-Bold");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                this.speedNotSetSVG.appendChild(text);
                textPosY += textSpace;
                text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "P";
                text.setAttribute("x", textPosX.toString());
                text.setAttribute("y", textPosY.toString());
                text.setAttribute("fill", (this.isHud) ? "lime" : "orange");
                text.setAttribute("font-size", (this.fontSize * 1.0).toString());
                text.setAttribute("font-family", "Roboto-Bold");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                this.speedNotSetSVG.appendChild(text);
                textPosY += textSpace;
                text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "D";
                text.setAttribute("x", textPosX.toString());
                text.setAttribute("y", textPosY.toString());
                text.setAttribute("fill", (this.isHud) ? "lime" : "orange");
                text.setAttribute("font-size", (this.fontSize * 1.0).toString());
                text.setAttribute("font-family", "Roboto-Bold");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                this.speedNotSetSVG.appendChild(text);
            }
            var targetSpeedPointerPosX = _left + _width * 0.77;
            var targetSpeedPointerPosY = _top + _height * 0.5;
            var targetSpeedPointerWidth = width;
            this.targetSpeedPointerHeight = 40;
            this.targetSpeedPointerSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.targetSpeedPointerSVG.setAttribute("id", "TargetSpeedPointerGroup");
            this.targetSpeedPointerSVG.setAttribute("x", targetSpeedPointerPosX.toString());
            this.targetSpeedPointerSVG.setAttribute("y", (targetSpeedPointerPosY - this.targetSpeedPointerHeight * 0.5).toString());
            this.targetSpeedPointerSVG.setAttribute("width", targetSpeedPointerWidth.toString());
            this.targetSpeedPointerSVG.setAttribute("height", this.targetSpeedPointerHeight.toString());
            this.targetSpeedPointerSVG.setAttribute("viewBox", "0 0 " + targetSpeedPointerWidth + " " + this.targetSpeedPointerHeight);
            {
                let shape = document.createElementNS(Avionics.SVG.NS, "path");
                shape.setAttribute("fill", "none");
                shape.setAttribute("stroke", (this.isHud) ? "lime" : "#D570FF");
                shape.setAttribute("stroke-width", "2");
                shape.setAttribute("d", "M 0 22 L 25 10 L 52 10 L 52 34 L 25 34 Z");
                this.targetSpeedPointerSVG.appendChild(shape);
            }
            if (!this.speedTrendArrowSVG) {
                this.speedTrendArrowSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.speedTrendArrowSVG.setAttribute("id", "SpeedTrendArrowGroup");
            }
            else
                Utils.RemoveAllChildren(this.speedTrendArrowSVG);
            this.speedTrendArrowSVG.setAttribute("x", "18");
            this.speedTrendArrowSVG.setAttribute("y", "0");
            this.speedTrendArrowSVG.setAttribute("width", "250");
            this.speedTrendArrowSVG.setAttribute("height", height.toString());
            this.speedTrendArrowSVG.setAttribute("viewBox", "0 0 250 " + height.toString());
            {
                if (!this.speedTrendArrowSVGShape)
                    this.speedTrendArrowSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.speedTrendArrowSVGShape.setAttribute("fill", "none");
                this.speedTrendArrowSVGShape.setAttribute("stroke", (this.isHud) ? "lime" : "green");
                this.speedTrendArrowSVGShape.setAttribute("stroke-width", "2");
                this.speedTrendArrowSVG.appendChild(this.speedTrendArrowSVGShape);
            }
            var stripViewPosX = _left + _width;
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
                    let stripWidth = 14;
                    if (!this.isHud) {
                        let shape = document.createElementNS(Avionics.SVG.NS, "path");
                        shape.setAttribute("fill", "black");
                        shape.setAttribute("stroke", "none");
                        shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                        this.vMaxStripSVG.appendChild(shape);
                    }
                    let dashHeight = stripWidth * 1.0;
                    let dashSpacing = dashHeight * 1.15;
                    let y = this.stripHeight - dashHeight;
                    while (y > 0) {
                        let rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        (this.isHud) ? rect.setAttribute("stroke", "lime") : rect.setAttribute("fill", "red");
                        rect.setAttribute("x", "0");
                        rect.setAttribute("y", y.toString());
                        rect.setAttribute("width", stripWidth.toString());
                        rect.setAttribute("height", dashHeight.toString());
                        this.vMaxStripSVG.appendChild(rect);
                        y -= dashHeight + dashSpacing;
                    }
                }
                this.stripsSVG.appendChild(this.vMaxStripSVG);
                this.stallProtMinStripSVG = document.createElementNS(Avionics.SVG.NS, "g");
                this.stallProtMinStripSVG.setAttribute("id", "StallProtMin");
                {
                    let stripWidth = 9;
                    let shape = document.createElementNS(Avionics.SVG.NS, "path");
                    shape.setAttribute("fill", "none");
                    shape.setAttribute("stroke", (this.isHud) ? "lime" : "orange");
                    shape.setAttribute("stroke-width", "3");
                    shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.stallProtMinStripSVG.appendChild(shape);
                }
                this.stripsSVG.appendChild(this.stallProtMinStripSVG);
                this.stallProtMaxStripSVG = document.createElementNS(Avionics.SVG.NS, "g");
                this.stallProtMaxStripSVG.setAttribute("id", "StallProtMax");
                {
                    let stripWidth = 14;
                    if (!this.isHud) {
                        let shape = document.createElementNS(Avionics.SVG.NS, "path");
                        shape.setAttribute("fill", "black");
                        shape.setAttribute("stroke", "none");
                        shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                        this.stallProtMaxStripSVG.appendChild(shape);
                    }
                    let dashHeight = stripWidth * 1.0;
                    let dashSpacing = dashHeight * 1.15;
                    let y = 0;
                    while (y < this.stripHeight) {
                        let rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        (this.isHud) ? rect.setAttribute("stroke", "lime") : rect.setAttribute("fill", "red");
                        rect.setAttribute("x", "0");
                        rect.setAttribute("y", y.toString());
                        rect.setAttribute("width", stripWidth.toString());
                        rect.setAttribute("height", dashHeight.toString());
                        this.stallProtMaxStripSVG.appendChild(rect);
                        y += dashHeight + dashSpacing;
                    }
                }
                this.stripsSVG.appendChild(this.stallProtMaxStripSVG);
            }
            var speedMarkersPosX = _left + _width - 5;
            var speedMarkersPosY = 0;
            this.speedMarkersWidth = width;
            this.speedMarkersHeight = 70;
            let nbHandles = Simplane.getFlapsNbHandles();
            for (let i = 0; i < nbHandles; i++) {
                this.createSpeedMarker("", speedMarkersPosX, speedMarkersPosY, this.updateMarkerFlap, 0.8, 1, (this.isHud) ? "lime" : "#24F000", false, [i]);
            }
            this.createSpeedMarker("V1", speedMarkersPosX, speedMarkersPosY, this.updateMarkerV1, 0.8, 1, (this.isHud) ? "lime" : "#24F000");
            this.createSpeedMarker("VR", speedMarkersPosX, speedMarkersPosY, this.updateMarkerVR, 0.8, 1, (this.isHud) ? "lime" : "#24F000");
            this.createSpeedMarker("V2", speedMarkersPosX, speedMarkersPosY, this.updateMarkerV2, 0.8, 1, (this.isHud) ? "lime" : "#24F000");
            this.createSpeedMarker("REF", speedMarkersPosX, speedMarkersPosY, this.updateMarkerVRef, 0.8, 1, (this.isHud) ? "lime" : "#24F000");
            this.centerSVG.appendChild(this.stripsSVG);
            this.centerSVG.appendChild(this.speedNotSetSVG);
            this.centerSVG.appendChild(this.cursorSVG);
            this.centerSVG.appendChild(this.speedMarkerSVG);
            this.centerSVG.appendChild(this.targetSpeedPointerSVG);
            this.centerSVG.appendChild(this.speedTrendArrowSVG);
        }
        this.rootGroup.appendChild(this.centerSVG);
        {
            this.machPrefixSVG = document.createElementNS(Avionics.SVG.NS, "text");
            this.machPrefixSVG.textContent = ".";
            this.machPrefixSVG.setAttribute("x", (posX + 8).toString());
            this.machPrefixSVG.setAttribute("y", (posY + height + sideTextHeight * 0.58).toString());
            this.machPrefixSVG.setAttribute("fill", (this.isHud) ? "lime" : "white");
            this.machPrefixSVG.setAttribute("font-size", (this.fontSize * 1.1).toString());
            this.machPrefixSVG.setAttribute("font-family", "Roboto-Bold");
            this.machPrefixSVG.setAttribute("text-anchor", "end");
            this.machPrefixSVG.setAttribute("alignment-baseline", "top");
            this.rootGroup.appendChild(this.machPrefixSVG);
            this.machValueSVG = document.createElementNS(Avionics.SVG.NS, "text");
            this.machValueSVG.textContent = "000";
            this.machValueSVG.setAttribute("x", (posX + 12).toString());
            this.machValueSVG.setAttribute("y", (posY + height + sideTextHeight * 0.58).toString());
            this.machValueSVG.setAttribute("fill", (this.isHud) ? "lime" : "white");
            this.machValueSVG.setAttribute("font-size", (this.fontSize * 1.25).toString());
            this.machValueSVG.setAttribute("font-family", "Roboto-Bold");
            this.machValueSVG.setAttribute("text-anchor", "start");
            this.machValueSVG.setAttribute("alignment-baseline", "top");
            this.rootGroup.appendChild(this.machValueSVG);
        }
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    construct_A320_Neo() {
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 215 605");
        var posX = 94;
        var posY = 60;
        var width = 105;
        var height = 480;
        var arcWidth = 40;
        this.refHeight = height;
        this.stripBorderSize = 4;
        this.stripOffsetX = -2;
        this.graduationSpacing = 57;
        this.graduationScroller = new Avionics.Scroller(this.nbPrimaryGraduations, 20);
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "Airspeed");
        }
        else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        {
            if (!this.blueSpeedText) {
                this.blueSpeedText = document.createElementNS(Avionics.SVG.NS, "text");
                this.blueSpeedText.setAttribute("id", "BlueAirspeedText");
            }
            else {
                Utils.RemoveAllChildren(this.blueSpeedText);
            }
            this.blueSpeedText.setAttribute("x", (posX + 72).toString());
            this.blueSpeedText.setAttribute("y", (posY + 20).toString());
            this.blueSpeedText.setAttribute("fill", "cyan");
            this.blueSpeedText.setAttribute("font-size", (this.fontSize * 1.1).toString());
            this.blueSpeedText.setAttribute("font-family", "Roboto-Bold");
            this.blueSpeedText.setAttribute("text-anchor", "start");
            this.blueSpeedText.setAttribute("alignment-baseline", "central");
            if (!this.redSpeedText) {
                this.redSpeedText = document.createElementNS(Avionics.SVG.NS, "text");
                this.redSpeedText.setAttribute("id", "RedAirspeedText");
            }
            else {
                Utils.RemoveAllChildren(this.redSpeedText);
            }
            this.redSpeedText.setAttribute("x", (posX + 75).toString());
            this.redSpeedText.setAttribute("y", (posY - 17).toString());
            this.redSpeedText.setAttribute("fill", "magenta");
            this.redSpeedText.setAttribute("font-size", (this.fontSize * 1.1).toString());
            this.redSpeedText.setAttribute("font-family", "Roboto-Bold");
            this.redSpeedText.setAttribute("text-anchor", "end");
            this.redSpeedText.setAttribute("alignment-baseline", "central");
            if (!this.speedNotSetSVG) {
                this.speedNotSetSVG = document.createElementNS(Avionics.SVG.NS, "text");
                this.speedNotSetSVG.setAttribute("id", "speedNotSet");
            }
            else {
                Utils.RemoveAllChildren(this.speedNotSetSVG);
            }
            this.speedNotSetSVG.textContent = "SPD SEL";
            this.speedNotSetSVG.setAttribute("x", (posX + 60).toString());
            this.speedNotSetSVG.setAttribute("y", (posY - 15).toString());
            this.speedNotSetSVG.setAttribute("fill", "red");
            this.speedNotSetSVG.setAttribute("font-size", (this.fontSize * 1.0).toString());
            this.speedNotSetSVG.setAttribute("font-family", "Roboto-Bold");
            this.speedNotSetSVG.setAttribute("text-anchor", "end");
            this.speedNotSetSVG.setAttribute("alignment-baseline", "central");
            this.rootGroup.appendChild(this.blueSpeedText);
            this.rootGroup.appendChild(this.redSpeedText);
            this.rootGroup.appendChild(this.speedNotSetSVG);
        }
        if (!this.centerSVG) {
            this.centerSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.centerSVG.setAttribute("id", "CenterGroup");
        }
        else
            Utils.RemoveAllChildren(this.centerSVG);
        this.centerSVG.setAttribute("x", (posX - width * 0.5).toString());
        this.centerSVG.setAttribute("y", posY.toString());
        this.centerSVG.setAttribute("width", (width + arcWidth).toString());
        this.centerSVG.setAttribute("height", height.toString());
        this.centerSVG.setAttribute("viewBox", "0 0 " + (width + arcWidth) + " " + height);
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
            bg.setAttribute("fill", "#343B51");
            this.centerSVG.appendChild(bg);
            var topLine = document.createElementNS(Avionics.SVG.NS, "line");
            topLine.setAttribute("x1", _left.toString());
            topLine.setAttribute("y1", (_top + 2).toString());
            topLine.setAttribute("x2", (_left + _width + arcWidth).toString());
            topLine.setAttribute("y2", (_top + 2).toString());
            topLine.setAttribute("stroke", "white");
            topLine.setAttribute("stroke-width", "4");
            this.centerSVG.appendChild(topLine);
            var bottomLine = document.createElementNS(Avionics.SVG.NS, "line");
            bottomLine.setAttribute("x1", _left.toString());
            bottomLine.setAttribute("y1", (_top + _height - 2).toString());
            bottomLine.setAttribute("x2", (_left + _width + arcWidth).toString());
            bottomLine.setAttribute("y2", (_top + _height - 2).toString());
            bottomLine.setAttribute("stroke", "white");
            bottomLine.setAttribute("stroke-width", "4");
            this.centerSVG.appendChild(bottomLine);
            var graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationGroup.setAttribute("id", "Graduations");
            {
                this.graduationScrollPosX = _left + _width;
                this.graduationScrollPosY = _top + _height * 0.5;
                this.graduations = [];
                for (var i = 0; i < this.totalGraduations; i++) {
                    var line = new Avionics.SVGGraduation();
                    line.IsPrimary = (i % (this.nbSecondaryGraduations + 1)) ? false : true;
                    var lineWidth = line.IsPrimary ? 16 : 16;
                    var lineHeight = line.IsPrimary ? 6 : 6;
                    var linePosX = -lineWidth;
                    line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                    line.SVGLine.setAttribute("x", linePosX.toString());
                    line.SVGLine.setAttribute("width", lineWidth.toString());
                    line.SVGLine.setAttribute("height", lineHeight.toString());
                    line.SVGLine.setAttribute("fill", "white");
                    if (line.IsPrimary) {
                        line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                        line.SVGText1.setAttribute("x", (linePosX - 6).toString());
                        line.SVGText1.setAttribute("fill", "white");
                        line.SVGText1.setAttribute("font-size", (this.fontSize * 1.7).toString());
                        line.SVGText1.setAttribute("font-family", "Roboto-Bold");
                        line.SVGText1.setAttribute("text-anchor", "end");
                        line.SVGText1.setAttribute("alignment-baseline", "central");
                    }
                    this.graduations.push(line);
                }
                this.graduationVLine = document.createElementNS(Avionics.SVG.NS, "line");
                this.graduationVLine.setAttribute("x1", this.graduationScrollPosX.toString());
                this.graduationVLine.setAttribute("y1", "0");
                this.graduationVLine.setAttribute("x2", this.graduationScrollPosX.toString());
                this.graduationVLine.setAttribute("y2", "0");
                this.graduationVLine.setAttribute("stroke", "white");
                this.graduationVLine.setAttribute("stroke-width", "6");
                for (let i = 0; i < this.totalGraduations; i++) {
                    let line = this.graduations[i];
                    graduationGroup.appendChild(line.SVGLine);
                    if (line.SVGText1) {
                        graduationGroup.appendChild(line.SVGText1);
                    }
                }
                graduationGroup.appendChild(this.graduationVLine);
                this.centerSVG.appendChild(graduationGroup);
            }
            var cursorPosX = _left + _width * 0.5;
            var cursorPosY = _top + _height * 0.5 + 3;
            var cursorWidth = width;
            var cursorHeight = 23;
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
            this.cursorSVG.setAttribute("viewBox", "0 0 " + cursorWidth + " " + cursorHeight);
            {
                if (!this.cursorSVGShape)
                    this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.cursorSVGShape.setAttribute("fill", "yellow");
                this.cursorSVGShape.setAttribute("fill-opacity", this.cursorOpacity);
                this.cursorSVGShape.setAttribute("d", "M 25 9 L 55 9 L 78 1 L 78 21 L 55 13 L 25 13 Z");
                this.cursorSVG.appendChild(this.cursorSVGShape);
            }
            if (!this.speedTrendArrowSVG) {
                this.speedTrendArrowSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.speedTrendArrowSVG.setAttribute("id", "SpeedTrendArrowGroup");
            }
            else
                Utils.RemoveAllChildren(this.speedTrendArrowSVG);
            this.speedTrendArrowSVG.setAttribute("x", "18");
            this.speedTrendArrowSVG.setAttribute("y", "0");
            this.speedTrendArrowSVG.setAttribute("width", "250");
            this.speedTrendArrowSVG.setAttribute("height", height.toString());
            this.speedTrendArrowSVG.setAttribute("viewBox", "0 0 250 " + height.toString());
            {
                if (!this.speedTrendArrowSVGShape)
                    this.speedTrendArrowSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.speedTrendArrowSVGShape.setAttribute("fill", "none");
                this.speedTrendArrowSVGShape.setAttribute("stroke", "yellow");
                this.speedTrendArrowSVGShape.setAttribute("stroke-width", "2");
                this.speedTrendArrowSVG.appendChild(this.speedTrendArrowSVGShape);
            }
            var greenDotPosX = _left + _width * 0.9;
            var greenDotPosY = _top + _height * 0.5;
            var greenDotWidth = width;
            var greenDotHeight = 20;
            if (!this.greenDotSVG) {
                this.greenDotSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.greenDotSVG.setAttribute("id", "GreenDotIndicatorGroup");
            }
            else
                Utils.RemoveAllChildren(this.greenDotSVG);
            this.greenDotSVG.setAttribute("x", greenDotPosX.toFixed(0));
            this.greenDotSVG.setAttribute("y", (greenDotPosY - greenDotHeight * 0.5).toFixed(0));
            this.greenDotSVG.setAttribute("width", greenDotWidth.toFixed(0));
            this.greenDotSVG.setAttribute("height", greenDotHeight.toFixed(0));
            this.greenDotSVG.setAttribute("viewBox", "0 0 " + greenDotWidth + " " + greenDotHeight);
            {
                if (!this.greenDotSVGShape)
                    this.greenDotSVGShape = document.createElementNS(Avionics.SVG.NS, "circle");
                this.greenDotSVGShape.setAttribute("fill", "none");
                this.greenDotSVGShape.setAttribute("stroke", "rgb(36,255,0)");
                this.greenDotSVGShape.setAttribute("stroke-width", "4");
                this.greenDotSVGShape.setAttribute("cx", "10");
                this.greenDotSVGShape.setAttribute("cy", "10");
                this.greenDotSVGShape.setAttribute("r", "7");
                this.greenDotSVG.appendChild(this.greenDotSVGShape);
            }
            var blueSpeedPosX = _left + _width * 1.025;
            var blueSpeedPosY = _top + _height * 0.5;
            var blueSpeedWidth = width;
            var blueSpeedHeight = 44;
            if (!this.blueSpeedSVG) {
                this.blueSpeedSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.blueSpeedSVG.setAttribute("id", "BlueSpeedGroup");
            }
            else
                Utils.RemoveAllChildren(this.blueSpeedSVG);
            this.blueSpeedSVG.setAttribute("x", blueSpeedPosX.toString());
            this.blueSpeedSVG.setAttribute("y", (blueSpeedPosY - blueSpeedHeight * 0.5).toString());
            this.blueSpeedSVG.setAttribute("width", blueSpeedWidth.toString());
            this.blueSpeedSVG.setAttribute("height", blueSpeedHeight.toString());
            this.blueSpeedSVG.setAttribute("viewBox", "0 0 " + blueSpeedWidth + " " + blueSpeedHeight);
            {
                let shape = document.createElementNS(Avionics.SVG.NS, "path");
                shape.setAttribute("fill", "none");
                shape.setAttribute("stroke", "cyan");
                shape.setAttribute("stroke-width", "2");
                shape.setAttribute("d", "M 0 22 L 25 0 L 25 44 Z");
                this.blueSpeedSVG.appendChild(shape);
            }
            var redSpeedPosX = _left + _width * 1.025;
            var redSpeedPosY = _top + _height * 0.5;
            var redSpeedWidth = width;
            var redSpeedHeight = 44;
            if (!this.redSpeedSVG) {
                this.redSpeedSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.redSpeedSVG.setAttribute("id", "redAirspeedPointerGroup");
            }
            else
                Utils.RemoveAllChildren(this.redSpeedSVG);
            this.redSpeedSVG.setAttribute("x", redSpeedPosX.toString());
            this.redSpeedSVG.setAttribute("y", (redSpeedPosY - redSpeedHeight * 0.5).toString());
            this.redSpeedSVG.setAttribute("width", redSpeedWidth.toString());
            this.redSpeedSVG.setAttribute("height", redSpeedHeight.toString());
            this.redSpeedSVG.setAttribute("viewBox", "0 0 " + redSpeedWidth + " " + redSpeedHeight);
            {
                let shape = document.createElementNS(Avionics.SVG.NS, "path");
                shape.setAttribute("fill", "none");
                shape.setAttribute("stroke", "magenta");
                shape.setAttribute("stroke-width", "2");
                shape.setAttribute("d", "M 0 22 L 25 0 L 25 44 Z");
                this.redSpeedSVG.appendChild(shape);
            }
            var nextFlapPosX = _left + _width * 0.8;
            var nextFlapPosY = _top + _height * 0.5;
            var nextFlapWidth = width;
            var nextFlapHeight = 20;
            if (!this.nextFlapSVG) {
                this.nextFlapSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.nextFlapSVG.setAttribute("id", "NextFlapIndicatorGroup");
            }
            else
                Utils.RemoveAllChildren(this.nextFlapSVG);
            this.nextFlapSVG.setAttribute("x", nextFlapPosX.toFixed(0));
            this.nextFlapSVG.setAttribute("y", (nextFlapPosY - nextFlapHeight * 0.5).toFixed(0));
            this.nextFlapSVG.setAttribute("width", nextFlapWidth.toFixed(0));
            this.nextFlapSVG.setAttribute("height", nextFlapHeight.toFixed(0));
            this.nextFlapSVG.setAttribute("viewBox", "0 0 " + nextFlapWidth + " " + nextFlapHeight);
            {
                if (!this.nextFlapSVGShape)
                    this.nextFlapSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.nextFlapSVGShape.setAttribute("fill", "none");
                this.nextFlapSVGShape.setAttribute("stroke", "orange");
                this.nextFlapSVGShape.setAttribute("stroke-width", "4");
                this.nextFlapSVGShape.setAttribute("d", "M 0 4 L 15 4 M 0 16 L 15 16");
                this.nextFlapSVG.appendChild(this.nextFlapSVGShape);
            }
            var stripViewPosX = _left + _width + 4;
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
                    let stripWidth = 14;
                    let shape = document.createElementNS(Avionics.SVG.NS, "path");
                    shape.setAttribute("fill", "black");
                    shape.setAttribute("stroke", "red");
                    shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.vMaxStripSVG.appendChild(shape);
                    let dashHeight = stripWidth * 1.0;
                    let dashSpacing = dashHeight * 0.75;
                    let y = this.stripHeight - dashHeight;
                    while (y > 0) {
                        let rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        rect.setAttribute("fill", "red");
                        rect.setAttribute("x", "0");
                        rect.setAttribute("y", y.toString());
                        rect.setAttribute("width", stripWidth.toString());
                        rect.setAttribute("height", dashHeight.toString());
                        this.vMaxStripSVG.appendChild(rect);
                        y -= dashHeight + dashSpacing;
                    }
                }
                this.stripsSVG.appendChild(this.vMaxStripSVG);
                this.vLSStripSVG = document.createElementNS(Avionics.SVG.NS, "g");
                this.vLSStripSVG.setAttribute("id", "VLS");
                {
                    let stripWidth = 9;
                    let shape = document.createElementNS(Avionics.SVG.NS, "path");
                    shape.setAttribute("fill", "black");
                    shape.setAttribute("stroke", "orange");
                    shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.vLSStripSVG.appendChild(shape);
                }
                this.stripsSVG.appendChild(this.vLSStripSVG);
                this.stallProtMinStripSVG = document.createElementNS(Avionics.SVG.NS, "g");
                this.stallProtMinStripSVG.setAttribute("id", "StallProtMin");
                {
                    let stripWidth = 14;
                    let shape = document.createElementNS(Avionics.SVG.NS, "path");
                    shape.setAttribute("fill", "black");
                    shape.setAttribute("stroke", "orange");
                    shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.stallProtMinStripSVG.appendChild(shape);
                    let dashHeight = stripWidth * 1.0;
                    let dashSpacing = dashHeight * 0.75;
                    let y = 0;
                    while (y < this.stripHeight) {
                        let rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        rect.setAttribute("fill", "orange");
                        rect.setAttribute("x", "0");
                        rect.setAttribute("y", y.toString());
                        rect.setAttribute("width", stripWidth.toString());
                        rect.setAttribute("height", dashHeight.toString());
                        this.stallProtMinStripSVG.appendChild(rect);
                        y += dashHeight + dashSpacing;
                    }
                }
                this.stripsSVG.appendChild(this.stallProtMinStripSVG);
                this.stallProtMaxStripSVG = document.createElementNS(Avionics.SVG.NS, "g");
                this.stallProtMaxStripSVG.setAttribute("id", "StallProtMax");
                {
                    let stripWidth = 19;
                    let shape = document.createElementNS(Avionics.SVG.NS, "path");
                    shape.setAttribute("fill", "red");
                    shape.setAttribute("stroke", "red");
                    shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.stallProtMaxStripSVG.appendChild(shape);
                }
                this.stripsSVG.appendChild(this.stallProtMaxStripSVG);
            }
            var speedMarkersPosX = _left + _width;
            var speedMarkersPosY = 0;
            this.speedMarkersWidth = width;
            this.speedMarkersHeight = 50;
            this.createSpeedMarker("1", speedMarkersPosX, speedMarkersPosY, this.updateMarkerV1, 1.0, 1.0, "cyan", false, [], 16, 0);
            this.createSpeedMarker("F", speedMarkersPosX, speedMarkersPosY, this.updateMarkerF, 1.0, 1.0, "cyan", false, [], 16, 0);
            this.createSpeedMarker("S", speedMarkersPosX, speedMarkersPosY, this.updateMarkerS, 1.0, 1.0, "cyan", false, [], 16, 0);
            this.centerSVG.appendChild(this.stripsSVG);
            this.centerSVG.appendChild(this.cursorSVG);
            this.centerSVG.appendChild(this.speedTrendArrowSVG);
            this.centerSVG.appendChild(this.redSpeedSVG);
            this.centerSVG.appendChild(this.blueSpeedSVG);
            this.centerSVG.appendChild(this.speedMarkerSVG);
            this.centerSVG.appendChild(this.nextFlapSVG);
            this.centerSVG.appendChild(this.greenDotSVG);
        }
        this.rootGroup.appendChild(this.centerSVG);
        {
            this.machPrefixSVG = document.createElementNS(Avionics.SVG.NS, "text");
            this.machPrefixSVG.textContent = ".";
            this.machPrefixSVG.setAttribute("x", (posX - 10).toString());
            this.machPrefixSVG.setAttribute("y", (posY + height + 45).toString());
            this.machPrefixSVG.setAttribute("fill", "rgb(36,255,0)");
            this.machPrefixSVG.setAttribute("font-size", (this.fontSize * 1.4).toString());
            this.machPrefixSVG.setAttribute("font-family", "Roboto-Bold");
            this.machPrefixSVG.setAttribute("text-anchor", "end");
            this.machPrefixSVG.setAttribute("alignment-baseline", "central");
            this.rootGroup.appendChild(this.machPrefixSVG);
            this.machValueSVG = document.createElementNS(Avionics.SVG.NS, "text");
            this.machValueSVG.textContent = "000";
            this.machValueSVG.setAttribute("x", (posX - 10).toString());
            this.machValueSVG.setAttribute("y", (posY + height + 45).toString());
            this.machValueSVG.setAttribute("fill", "rgb(36,255,0)");
            this.machValueSVG.setAttribute("font-size", (this.fontSize * 1.4).toString());
            this.machValueSVG.setAttribute("font-family", "Roboto-Bold");
            this.machValueSVG.setAttribute("text-anchor", "start");
            this.machValueSVG.setAttribute("alignment-baseline", "central");
            this.rootGroup.appendChild(this.machValueSVG);
        }
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    createSpeedMarker(_text, _x, _y, _handler, _scale = 1.0, _textScale = 1.4, _color = "green", _bg = false, _params = [], lineLength, textOffset) {
        let svg = document.createElementNS(Avionics.SVG.NS, "svg");
        svg.setAttribute("id", _text + "_Marker");
        svg.setAttribute("x", _x.toString());
        svg.setAttribute("y", _y.toString());
        svg.setAttribute("width", (this.speedMarkersWidth * _scale).toFixed(0));
        svg.setAttribute("height", (this.speedMarkersHeight * _scale * 1.05).toFixed(0));
        svg.setAttribute("viewBox", "0 0 " + this.speedMarkersWidth + " " + (this.speedMarkersHeight * 1.05));
        let offsetY = (this.speedMarkersHeight - this.speedMarkersHeight * _scale) * 0.5;
        let line = document.createElementNS(Avionics.SVG.NS, "line");
        line.setAttribute("x1", "0");
        line.setAttribute("y1", (offsetY + this.speedMarkersHeight * 0.5).toString());
        line.setAttribute("x2", lineLength.toString());
        line.setAttribute("y2", (offsetY + this.speedMarkersHeight * 0.5).toString());
        line.setAttribute("stroke", _color);
        line.setAttribute("stroke-width", "2");
        svg.appendChild(line);
        if (_bg) {
            let textBG = document.createElementNS(Avionics.SVG.NS, "rect");
            textBG.setAttribute("x", "17");
            textBG.setAttribute("y", (offsetY + this.speedMarkersHeight * 0.3).toString());
            textBG.setAttribute("width", (this.speedMarkersWidth * 0.275).toString());
            textBG.setAttribute("height", (this.speedMarkersHeight * 0.4).toString());
            textBG.setAttribute("fill", "black");
            svg.appendChild(textBG);
        }
        let text = document.createElementNS(Avionics.SVG.NS, "text");
        text.textContent = _text;
        text.setAttribute("x", (17 + textOffset).toString());
        text.setAttribute("y", (offsetY + this.speedMarkersHeight * 0.5).toString());
        text.setAttribute("fill", _color);
        text.setAttribute("font-size", (this.fontSize * _textScale).toString());
        text.setAttribute("font-family", "Roboto-Bold");
        text.setAttribute("text-anchor", "start");
        text.setAttribute("alignment-baseline", "central");
        svg.appendChild(text);
        let speed = document.createElementNS(Avionics.SVG.NS, "text");
        speed.textContent = _text;
        speed.setAttribute("x", "17");
        speed.setAttribute("y", (offsetY + this.speedMarkersHeight * 0.8).toString());
        speed.setAttribute("fill", _color);
        speed.setAttribute("font-size", (this.fontSize * _textScale).toString());
        speed.setAttribute("font-family", "Roboto-Bold");
        speed.setAttribute("text-anchor", "start");
        speed.setAttribute("alignment-baseline", "central");
        svg.appendChild(speed);
        let marker = new AirspeedMarker(line, text, speed, _handler.bind(this));
        marker.svg = svg;
        marker.params = _params;
        this.speedMarkers.push(marker);
        if (!this.speedMarkerSVG)
            this.speedMarkerSVG = document.createElementNS(Avionics.SVG.NS, "g");
        this.speedMarkerSVG.appendChild(svg);
        return marker;
    }
    update(dTime) {
        let indicatedSpeed = Simplane.getIndicatedSpeed();
        if (!this.altOver20k && Simplane.getAltitude() >= 20000)
            this.altOver20k = true;
        this.updateArcScrolling(indicatedSpeed);
        this.updateGraduationScrolling(indicatedSpeed);
        this.updateCursorScrolling(indicatedSpeed);
        let iasAcceleration = this.computeIAS(indicatedSpeed);
        let speedTrend = iasAcceleration;
        let crossSpeed = SimVar.GetGameVarValue("AIRCRAFT CROSSOVER SPEED", "Knots");
        let cruiseMach = SimVar.GetGameVarValue("AIRCRAFT CRUISE MACH", "mach");
        let crossSpeedFactor = Simplane.getCrossoverSpeedFactor(crossSpeed, cruiseMach);
        let nextFlapSpeed = Simplane.getNextFlapsExtendSpeed(this.aircraft) * crossSpeedFactor;

        const alt = Simplane.getAltitude();
        let maxSpeed = 260;
        if (alt >= 8000 && alt <= 27884) {
            maxSpeed = 305;
        }
        else if (alt > 27884) {
            const ambientPressure = SimVar.GetSimVarValue('AMBIENT PRESSURE', 'inHG');
            const machScalar2 = Math.pow(0.77, 2);
            const machScalar4 = Math.pow(0.77, 4);
            maxSpeed = Math.sqrt(ambientPressure / 29.92) * Math.sqrt(1 + machScalar2 / 4 + machScalar4 / 40) * 0.77 * 661.5;
        }

        let greenDot = Simplane.getGreenDotSpeed() * crossSpeedFactor;
        let lowestSelectableSpeed = Simplane.getLowestSelectableSpeed();
        let stallProtectionMin = Simplane.getStallProtectionMinSpeed();
        let stallProtectionMax = Simplane.getStallProtectionMaxSpeed();
        let stallSpeed = Simplane.getStallSpeed();
        let planeOnGround = Simplane.getIsGrounded();
        this.smoothSpeeds(indicatedSpeed, dTime, maxSpeed, lowestSelectableSpeed, stallProtectionMin, stallProtectionMax, stallSpeed);
        this.updateSpeedTrendArrow(indicatedSpeed, speedTrend);
        this.updateTargetSpeeds(indicatedSpeed);
        this.updateNextFlapSpeedIndicator(indicatedSpeed, nextFlapSpeed);
        this.updateStrip(this.vMaxStripSVG, indicatedSpeed, this._maxSpeed, false, true);
        this.updateStrip(this.vLSStripSVG, indicatedSpeed, this._lowestSelectableSpeed, planeOnGround, false);
        this.updateStrip(this.stallProtMinStripSVG, indicatedSpeed, this._alphaProtectionMin, planeOnGround, false);
        this.updateStrip(this.stallProtMaxStripSVG, indicatedSpeed, this._alphaProtectionMax, planeOnGround, false);
        this.updateStrip(this.stallStripSVG, indicatedSpeed, this._stallSpeed, planeOnGround, false);
        this.updateGreenDot(indicatedSpeed, greenDot);
        this.updateSpeedMarkers(indicatedSpeed);
        this.updateMachSpeed(dTime);
        this.updateSpeedOverride(dTime);
        this.updateVSpeeds();
    }
    smoothSpeeds(_indicatedSpeed, _dTime, _maxSpeed, _lowestSelectableSpeed, _stallProtectionMin, _stallProtectionMax, _stallSpeed) {
        let refSpeed = _maxSpeed;
        if (this.vLSStripSVG) {
            let delta = _lowestSelectableSpeed - refSpeed;
            if (delta >= 0)
                _lowestSelectableSpeed -= delta + 5;
            refSpeed = _lowestSelectableSpeed;
        }
        if (this.stallProtMinStripSVG) {
            let delta = _stallProtectionMin - refSpeed;
            if (delta >= 0)
                _stallProtectionMin -= delta + 5;
            refSpeed = _stallProtectionMin;
        }
        if (this.stallProtMaxStripSVG) {
            let delta = _stallProtectionMax - refSpeed;
            if (delta >= 0)
                _stallProtectionMax -= delta + 5;
            refSpeed = _stallProtectionMax;
        }
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
    updateSpeedOverride(_dTime) {
        if (Math.abs(this._maxSpeed - this._lastMaxSpeedOverride) >= 0) {
            this._lastMaxSpeedOverrideTime += _dTime / 1000;
            if (this._lastMaxSpeedOverrideTime > 5) {
                SimVar.SetGameVarValue("AIRCRAFT_MAXSPEED_OVERRIDE", "knots", this._maxSpeed - 3);
                this._lastMaxSpeedOverride = this._maxSpeed;
                this._lastMaxSpeedOverrideTime = 0;
            }
        }
        else {
            this._lastMaxSpeedOverrideTime = 0;
        }
    }
    updateVSpeeds() {
        if (this.vSpeedSVG) {
            let v1 = SimVar.GetSimVarValue("L:WT_CJ4_V1_SPEED", "Knots");
            let v2 = SimVar.GetSimVarValue("L:WT_CJ4_V2_SPEED", "Knots");
            let vR = SimVar.GetSimVarValue("L:WT_CJ4_VR_SPEED", "Knots");
            let vT = SimVar.GetSimVarValue("L:WT_CJ4_VT_SPEED", "Knots");
            if (Simplane.getIndicatedSpeed() < 40){
                this.vSpeedSVG.setAttribute("opacity", "1");
                this.v1Speed.textContent = v1.toFixed(0);
                if (SimVar.GetSimVarValue("L:WT_CJ4_V1_ON", "Bool")){
                    if (SimVar.GetSimVarValue("L:WT_CJ4_V1_FMCSET", "Bool")) {
                        this.v1Speed.setAttribute("fill", "magenta");
                        this.titleV1V.setAttribute("fill", "magenta");
                        this.title1.setAttribute("fill", "magenta");
                    }else{
                        this.v1Speed.setAttribute("fill", "cyan");
                        this.titleV1V.setAttribute("fill", "cyan");
                        this.title1.setAttribute("fill", "cyan");
                    }
                }else{
                    this.v1Speed.setAttribute("fill", "none");
                    this.titleV1V.setAttribute("fill", "none");
                    this.title1.setAttribute("fill", "none");
                }

                this.vRSpeed.textContent = vR.toFixed(0);
                if (SimVar.GetSimVarValue("L:WT_CJ4_VR_ON", "Bool")){
                    if (SimVar.GetSimVarValue("L:WT_CJ4_VR_FMCSET", "Bool")) {
                        this.vRSpeed.setAttribute("fill", "magenta");
                        this.titleVRV.setAttribute("fill", "magenta");
                        this.titleR.setAttribute("fill", "magenta");
                    }else{
                        this.vRSpeed.setAttribute("fill", "cyan");
                        this.titleVRV.setAttribute("fill", "cyan");
                        this.titleR.setAttribute("fill", "cyan");
                    }
                }else{
                    this.vRSpeed.setAttribute("fill", "none");
                    this.titleVRV.setAttribute("fill", "none");
                    this.titleR.setAttribute("fill", "none");
                }
                
                this.v2Speed.textContent = v2.toFixed(0);
                if (SimVar.GetSimVarValue("L:WT_CJ4_V2_ON", "Bool")){
                    if (SimVar.GetSimVarValue("L:WT_CJ4_V2_FMCSET", "Bool")) {
                        this.v2Speed.setAttribute("fill", "magenta");
                        this.titleV2V.setAttribute("fill", "magenta");
                        this.title2.setAttribute("fill", "magenta");
                    }else{
                        this.v2Speed.setAttribute("fill", "cyan");
                        this.titleV2V.setAttribute("fill", "cyan");
                        this.title2.setAttribute("fill", "cyan");
                    }
                }else{
                    this.v2Speed.setAttribute("fill", "none");
                    this.titleV2V.setAttribute("fill", "none");
                    this.title2.setAttribute("fill", "none");
                }

                this.vXSpeed.textContent = vT.toFixed(0);
                if (SimVar.GetSimVarValue("L:WT_CJ4_VT_ON", "Bool")){
                    if (SimVar.GetSimVarValue("L:WT_CJ4_VT_FMCSET", "Bool")) {
                        this.vXSpeed.setAttribute("fill", "magenta");
                        this.titleVTV.setAttribute("fill", "magenta");
                        this.titleT.setAttribute("fill", "magenta");
                    }else{
                        this.vXSpeed.setAttribute("fill", "cyan");
                        this.titleVTV.setAttribute("fill", "cyan");
                        this.titleT.setAttribute("fill", "cyan");
                    }
                }else{
                    this.vXSpeed.setAttribute("fill", "none");
                    this.titleVTV.setAttribute("fill", "none");
                    this.titleT.setAttribute("fill", "none");
                }
            }
            else {
                this.vSpeedSVG.setAttribute("opacity", "0");
            }

            if (Simplane.getIndicatedSpeed() > 200 && SimVar.GetSimVarValue("L:WT_CJ4_VT_SPEED", "Knots") != 0) {
                SimVar.SetSimVarValue("L:WT_CJ4_V1_SPEED", "Knots", 0);
                SimVar.SetSimVarValue("L:WT_CJ4_VR_SPEED", "Knots", 0);
                SimVar.SetSimVarValue("L:WT_CJ4_V2_SPEED", "Knots", 0);
                SimVar.SetSimVarValue("L:WT_CJ4_VT_SPEED", "Knots", 0);
                SimVar.SetSimVarValue("L:WT_CJ4_V1_FMCSET", "Bool", true);
                SimVar.SetSimVarValue("L:WT_CJ4_VR_FMCSET", "Bool", true);
                SimVar.SetSimVarValue("L:WT_CJ4_V2_FMCSET", "Bool", true);
                SimVar.SetSimVarValue("L:WT_CJ4_VT_FMCSET", "Bool", true);
            }
        }
    }
    computeIAS(_currentSpeed) {
        let newIASTime = {
            ias: _currentSpeed,
            t: performance.now() / 1000
        };
        if (!this._lastIASTime) {
            this._lastIASTime = newIASTime;
            return;
        }
        let frameIASAcceleration = (newIASTime.ias - this._lastIASTime.ias) / (newIASTime.t - this._lastIASTime.t);
        frameIASAcceleration = Math.min(frameIASAcceleration, 10);
        frameIASAcceleration = Math.max(frameIASAcceleration, -10);
        if (isFinite(frameIASAcceleration)) {
            this._computedIASAcceleration += (frameIASAcceleration - this._computedIASAcceleration) / (50 / ((newIASTime.t - this._lastIASTime.t) / .016));
        }
        this._lastIASTime = newIASTime;
        let accel = this._computedIASAcceleration * 6;
        return accel;
    }
    getAutopilotMode() {
        if (this.aircraft == Aircraft.A320_NEO) {
            if (Simplane.getAutoPilotAirspeedHoldActive())
                return AutopilotMode.SELECTED;
            return AutopilotMode.MANAGED;
        }
        else if (this.aircraft == Aircraft.B747_8 || this.aircraft == Aircraft.AS01B) {
            if (Simplane.getAutoPilotAirspeedHoldActive())
                return AutopilotMode.HOLD;
            else {
                return AutopilotMode.SELECTED;
            }
        }
        else {
            return AutopilotMode.SELECTED;
        }
    }
    updateMachSpeed(dTime) {
        if (this.machPrefixSVG && this.machValueSVG) {
            var trueMach = Simplane.getMachSpeed();
            this.machSpeed = Utils.SmoothSin(this.machSpeed, trueMach, 0.25, dTime / 1000);
            if (this.machSpeed > 0.998)
                this.machSpeed = 0.998;
            if (this.aircraft == Aircraft.B747_8 || this.aircraft == Aircraft.AS01B) {
                if ((!this.machVisible && this.machSpeed >= 0.4) || (this.machVisible && this.machSpeed >= 0.35)) {
                    var fixedMach = this.machSpeed.toFixed(3);
                    var radixPos = fixedMach.indexOf('.');
                    this.machPrefixSVG.textContent = ".";
                    this.machValueSVG.textContent = fixedMach.slice(radixPos + 1);
                    this.machVisible = true;
                }
                else {
                    var groundSpeed = Math.round(Simplane.getGroundSpeed());
                    this.machPrefixSVG.textContent = "GS";
                    this.machValueSVG.textContent = Utils.leadingZeros(groundSpeed, 3);
                    this.machVisible = true;
                }
            }
            else if (this.aircraft == Aircraft.CJ4) {
                if ((!this.machVisible && this.machSpeed >= 0.4) || (this.machVisible && this.machSpeed >= 0.35)) {
                    var fixedMach = this.machSpeed.toFixed(3);
                    var radixPos = fixedMach.indexOf('.');
                    this.machPrefixSVG.textContent = "M";
                    this.machValueSVG.textContent = fixedMach.slice(radixPos + 1);
                    this.machVisible = true;
                }
                else {
                    this.machVisible = false;
                }
            }
            else {
                var fixedMach = this.machSpeed.toFixed(3);
                if ((!this.machVisible && this.machSpeed >= 0.5) || (this.machVisible && this.machSpeed >= 0.45)) {
                    var radixPos = fixedMach.indexOf('.');
                    this.machValueSVG.textContent = fixedMach.slice(radixPos + 1);
                    this.machVisible = true;
                }
                else {
                    this.machVisible = false;
                }
            }
        }
        if (this.machVisible) {
            this.machPrefixSVG.setAttribute("visibility", "visible");
            this.machValueSVG.setAttribute("visibility", "visible");
            this.machPrefixdecimalSVG.setAttribute("visibility", "visible");
        }
        else {
            this.machPrefixSVG.setAttribute("visibility", "hidden");
            this.machValueSVG.setAttribute("visibility", "hidden");
            this.machPrefixdecimalSVG.setAttribute("visibility", "hidden");
        }
    }
    arcToSVG(_value) {
        var pixels = (_value * this.graduationSpacing * (this.nbSecondaryGraduations + 1)) / 10;
        return pixels;
    }
    updateGraduationScrolling(_speed) {
        if (this.graduations) {
            if (_speed < this.graduationMinValue)
                _speed = this.graduationMinValue;
            this.graduationScroller.scroll(_speed);
            var currentVal = this.graduationScroller.firstValue;
            var currentY = this.graduationScrollPosY + this.graduationScroller.offsetY * this.graduationSpacing * (this.nbSecondaryGraduations + 1);
            var startVal = currentVal;
            var startY = currentY;
            for (var i = 0; i < this.totalGraduations; i++) {
                var posX = this.graduationScrollPosX;
                var posY = currentY;
                if ((currentVal < this.graduationMinValue) || (currentVal == this.graduationMinValue && !this.graduations[i].SVGText1)) {
                    this.graduations[i].SVGLine.setAttribute("visibility", "hidden");
                    if (this.graduations[i].SVGText1) {
                        this.graduations[i].SVGText1.setAttribute("visibility", "hidden");
                    }
                }
                else {
                    this.graduations[i].SVGLine.setAttribute("visibility", "visible");
                    this.graduations[i].SVGLine.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    if (this.graduations[i].SVGText1) {
                        if(currentVal == this.graduationMinValue){
                            var graduationMinValuePosY = posY;
                        }
                        if (this.aircraft == Aircraft.CJ4) {
                            if ((currentVal % 4) == 0)
                                this.graduations[i].SVGText1.textContent = currentVal.toString();
                            else
                                this.graduations[i].SVGText1.textContent = "";
                        }
                        else if (this.aircraft == Aircraft.B747_8 || this.aircraft == Aircraft.AS01B) {
                            if (currentVal < this.graduationMinValue)
                                this.graduations[i].SVGText1.textContent = "";
                            else
                                this.graduations[i].SVGText1.textContent = currentVal.toString();
                        }
                        else {
                            if (currentVal < this.graduationMinValue)
                                this.graduations[i].SVGText1.textContent = "";
                            else
                                this.graduations[i].SVGText1.textContent = Utils.leadingZeros(currentVal, 3);
                        }
                        this.graduations[i].SVGText1.setAttribute("visibility", "visible");
                        this.graduations[i].SVGText1.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    }
                }
                if (this.graduations[i].SVGText1)
                    currentVal = this.graduationScroller.nextValue;
                currentY -= this.graduationSpacing;
            }
            if (this.graduationVLine) {
                var factor = 10 / this.graduationScroller.increment;
                var offsetY = (Math.min((startVal - this.graduationMinValue), 0) / 10) * this.graduationSpacing * (this.nbSecondaryGraduations) * factor;

                var graduationVLineY1 = 0;                
                if(typeof graduationMinValuePosY != "undefined"){
                    graduationVLineY1 = graduationMinValuePosY + 1;
                }else{
                    graduationVLineY1 = (startY + offsetY).toString();
                }
                this.graduationVLine.setAttribute("y1", graduationVLineY1);
                this.graduationVLine.setAttribute("y2", Math.floor(currentY + offsetY).toString());
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
        if (_speed < this.graduationMinValue && this.aircraft != Aircraft.B747_8 && this.aircraft != Aircraft.AS01B) {
            if (this.cursorIntegrals) {
                for (let i = 0; i < this.cursorIntegrals.length; i++) {
                    this.cursorIntegrals[i].clear("-");
                }
            }
            if (this.cursorDecimals) {
                this.cursorDecimals.clear();
            }
        }
        else {
            let speed = Math.max(_speed, this.graduationMinValue);
            if (this.cursorIntegrals) {
                this.cursorIntegrals[0].update(speed, 100, 100);
                this.cursorIntegrals[1].update(speed, 10, 10);
            }
            if (this.cursorDecimals) {
                this.cursorDecimals.update(speed);
            }
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
    updateSpeedTrendArrow(currentAirspeed, speedTrend, hide = false) {
        let hideArrow = true;
        if (this.speedTrendArrowSVG && !hide) {
            if (currentAirspeed >= 40 && Math.abs(speedTrend) > 1) {
                let arrowBaseY = this.valueToSvg(currentAirspeed, currentAirspeed);
                let arrowTopY = this.valueToSvg(currentAirspeed, currentAirspeed + speedTrend);
                let arrowPath = "M 70 " + arrowBaseY + " L 70 " + arrowTopY.toFixed(1) + " ";
                if (this.aircraft == Aircraft.CJ4) {
                    arrowPath += "L 50 " + arrowTopY.toFixed(1);
                }
                else {
                    if (speedTrend > 0) {
                        arrowPath += "M 62 " + (arrowTopY + 8).toFixed(1) + " L 70 " + arrowTopY.toFixed(1) + " L 78 " + (arrowTopY + 8).toFixed(1);
                    }
                    else {
                        arrowPath += "M 62 " + (arrowTopY - 8).toFixed(1) + " L 70 " + arrowTopY.toFixed(1) + " L 78 " + (arrowTopY - 8).toFixed(1);
                    }
                }
                this.speedTrendArrowSVGShape.setAttribute("d", arrowPath);
                hideArrow = false;
            }
        }
        if (hideArrow) {
            this.speedTrendArrowSVGShape.setAttribute("visibility", "hidden");
        }
        else {
            this.speedTrendArrowSVGShape.setAttribute("visibility", "visible");

        }
    }
    updateTargetSpeeds(currentAirspeed) {
        let takeOffSpeedNotSet = false;
        let hudSpeed = -1;
        if (this.aircraft == Aircraft.A320_NEO) {
            let hideBluePointer = true;
            let hideBlueText = true;
            {
                let blueAirspeed = 0;
                if (Simplane.getV1Airspeed() < 0) {
                    let isSelected = Simplane.getAutoPilotAirspeedSelected();
                    if (isSelected) {
                        if (Simplane.getAutoPilotMachModeActive())
                            blueAirspeed = SimVar.GetGameVarValue("FROM MACH TO KIAS", "number", Simplane.getAutoPilotMachHoldValue());
                        else
                            blueAirspeed = Simplane.getAutoPilotAirspeedHoldValue();
                    }
                }
                if (blueAirspeed > this.graduationMinValue) {
                    let blueSpeedPosY = this.valueToSvg(currentAirspeed, blueAirspeed);
                    let blueSpeedHeight = 44;
                    if (blueSpeedPosY > 0) {
                        if (this.blueSpeedSVG) {
                            this.blueSpeedSVG.setAttribute("visibility", "visible");
                            this.blueSpeedSVG.setAttribute("y", (blueSpeedPosY - blueSpeedHeight * 0.5).toString());
                        }
                        hideBluePointer = false;
                    }
                    else {
                        hideBlueText = false;
                    }
                    hudSpeed = blueAirspeed;
                }
                if (this.blueSpeedSVG && hideBluePointer) {
                    this.blueSpeedSVG.setAttribute("visibility", "hidden");
                }
                if (this.blueSpeedText) {
                    if (hideBlueText) {
                        this.blueSpeedText.setAttribute("visibility", "hidden");
                    }
                    else {
                        this.blueSpeedText.setAttribute("visibility", "visible");
                        this.blueSpeedText.textContent = blueAirspeed.toFixed(0);
                    }
                }
            }
            let hideRedPointer = true;
            let hideRedText = true;
            {
                let redAirspeed = Simplane.getV2Airspeed();
                if (redAirspeed < 0) {
                    let isManaged = Simplane.getAutoPilotAirspeedManaged();
                    if (isManaged) {
                        if (Simplane.getAutoPilotMachModeActive())
                            redAirspeed = SimVar.GetGameVarValue("FROM MACH TO KIAS", "number", Simplane.getAutoPilotMachHoldValue());
                        else
                            redAirspeed = Simplane.getAutoPilotAirspeedHoldValue();
                    }
                }
                if (redAirspeed > this.graduationMinValue) {
                    let redSpeedPosY = this.valueToSvg(currentAirspeed, redAirspeed);
                    let redSpeedHeight = 44;
                    if (redSpeedPosY > 0) {
                        if (this.redSpeedSVG) {
                            this.redSpeedSVG.setAttribute("visibility", "visible");
                            this.redSpeedSVG.setAttribute("y", (redSpeedPosY - redSpeedHeight * 0.5).toString());
                        }
                        hideRedPointer = false;
                    }
                    else {
                        hideRedText = false;
                    }
                    hudSpeed = redAirspeed;
                }
                if (this.redSpeedSVG && hideRedPointer) {
                    this.redSpeedSVG.setAttribute("visibility", "hidden");
                }
                if (this.redSpeedText) {
                    if (hideRedText) {
                        this.redSpeedText.setAttribute("visibility", "hidden");
                    }
                    else {
                        this.redSpeedText.setAttribute("visibility", "visible");
                        this.redSpeedText.textContent = redAirspeed.toFixed(0);
                    }
                }
            }
            if (hideRedPointer && hideRedText && hideBluePointer && hideBlueText) {
                takeOffSpeedNotSet = true;
            }
        }
        else {
            let hideText = true;
            let hidePointer = true;
            if (this.targetSpeedSVG) {
                var APMode = this.getAutopilotMode();
                if (APMode != AutopilotMode.MANAGED) {
                    let selectedAirspeed = 0;
                    var machMode = Simplane.getAutoPilotMachModeActive();
                    if (machMode) {
                        let machAirspeed = Simplane.getAutoPilotMachHoldValue();
                        if (machAirspeed < 1.0) {
                            var fixedMach = machAirspeed.toFixed(2);
                            this.targetSpeedSVG.textContent = "M" + fixedMach.slice(1);
                        }
                        else {
                            this.targetSpeedSVG.textContent = "M" + machAirspeed.toFixed(2);
                        }
                        selectedAirspeed = SimVar.GetGameVarValue("FROM MACH TO KIAS", "number", machAirspeed);
                    }
                    else {
                        selectedAirspeed = Simplane.getAutoPilotAirspeedHoldValue();
                        this.targetSpeedSVG.textContent = Utils.leadingZeros(Math.round(selectedAirspeed), 3);
                    }
                    if (selectedAirspeed >= this.graduationMinValue) {
                        let pointerPosY = this.valueToSvg(currentAirspeed, selectedAirspeed);
                        if (pointerPosY > 0) {
                            if (this.targetSpeedPointerSVG) {
                                this.targetSpeedPointerSVG.setAttribute("visibility", "visible");
                                this.speedBackground.setAttribute("visibility", "visible");
                                this.targetSpeedPointerSVG.setAttribute("y", (pointerPosY - this.targetSpeedPointerHeight * 0.5).toString());
                            }
                            hidePointer = false;
                        }
                        hudSpeed = selectedAirspeed;
                        hideText = false;
                    }
                    else {
                        this.targetSpeedSVG.textContent = "";
                        this.speedBackground.setAttribute("visibility", "hidden");
                        this.targetSpeedPointerSVG.setAttribute("visibility", "hidden");
                    }
                }
                else {
                    this.targetSpeedSVG.textContent = "";
                }
            }
            if (this.targetSpeedPointerSVG && hidePointer)
                this.targetSpeedPointerSVG.setAttribute("visibility", "hidden");
            if (this.targetSpeedBgSVG)
                this.targetSpeedBgSVG.classList.toggle('hide', hideText);
            if (this.targetSpeedIconSVG)
                this.targetSpeedIconSVG.classList.toggle('hide', hideText);
            if (Simplane.getIsGrounded() && Simplane.getV1Airspeed() <= 0 && Simplane.getVRAirspeed() <= 0 && Simplane.getV2Airspeed() <= 0) {
                takeOffSpeedNotSet = true;
            }
        }
        if (this.speedNotSetSVG) {
            this.speedNotSetSVG.setAttribute("visibility", (takeOffSpeedNotSet) ? "visible" : "hidden");
        }
        if (this.hudAPSpeed != hudSpeed) {
            this.hudAPSpeed = Math.round(hudSpeed);
            SimVar.SetSimVarValue("L:HUD_AP_SELECTED_SPEED", "Number", this.hudAPSpeed);
        }

        let flcActive = SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "number");
        if (flcActive != 1) {
            this.speedBackground.setAttribute("visibility", "hidden");
            this.targetSpeedIconSVG.setAttribute("visibility", "hidden");
            this.targetSpeedSVG.setAttribute("visibility", "hidden");
            this.targetSpeedPointerSVG.setAttribute("visibility", "hidden");
        } else {
            this.targetSpeedIconSVG.setAttribute("visibility", "visible");
            this.targetSpeedSVG.setAttribute("visibility", "visible");
        }
    }
    updateNextFlapSpeedIndicator(currentAirspeed, nextFlapSpeed) {
        if (this.nextFlapSVG) {
            let hidePointer = true;
            if (nextFlapSpeed > this.graduationMinValue) {
                var nextFlapSpeedPosY = this.valueToSvg(currentAirspeed, nextFlapSpeed);
                var nextFlapSpeedHeight = 20;
                if (nextFlapSpeedPosY > 0) {
                    this.nextFlapSVG.setAttribute("y", (nextFlapSpeedPosY - nextFlapSpeedHeight * 0.5).toString());
                    hidePointer = false;
                }
            }
            if (hidePointer) {
                this.nextFlapSVG.setAttribute("visibility", "hidden");
            }
            else {
                this.nextFlapSVG.setAttribute("visibility", "visible");
            }
        }
    }
    updateGreenDot(currentAirspeed, _greenDot) {
        if (this.greenDotSVG) {
            let hidePointer = true;
            if (_greenDot > this.graduationMinValue) {
                var greenDotPosY = this.valueToSvg(currentAirspeed, _greenDot);
                var greenDotHeight = 20;
                if (greenDotPosY > 0) {
                    this.greenDotSVG.setAttribute("y", (greenDotPosY - greenDotHeight * 0.5).toString());
                    hidePointer = false;
                }
            }
            if (hidePointer) {
                this.greenDotSVG.setAttribute("visibility", "hidden");
            }
            else {
                this.greenDotSVG.setAttribute("visibility", "visible");
            }
        }
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
    updateSpeedMarkers(currentAirspeed) {
        for (let i = 0; i < this.speedMarkers.length; i++) {
            this.speedMarkers[i].update(currentAirspeed);
        }
    }
    updateMarkerF(_marker, currentAirspeed) {
        let hideMarker = true;
        let phase = Simplane.getCurrentFlightPhase();
        let flapsHandleIndex = Simplane.getFlapsHandleIndex();
        if (flapsHandleIndex == 2 || flapsHandleIndex == 3) {
            let flapSpeed = 0;
            if (phase == FlightPhase.FLIGHT_PHASE_TAKEOFF || phase == FlightPhase.FLIGHT_PHASE_CLIMB || phase == FlightPhase.FLIGHT_PHASE_GOAROUND) {
                flapSpeed = Simplane.getStallSpeedPredicted(flapsHandleIndex - 1) * 1.26;
            }
            else if (phase == FlightPhase.FLIGHT_PHASE_DESCENT || phase == FlightPhase.FLIGHT_PHASE_APPROACH) {
                if (flapsHandleIndex == 2)
                    flapSpeed = Simplane.getStallSpeedPredicted(flapsHandleIndex + 1) * 1.47;
                else
                    flapSpeed = Simplane.getStallSpeedPredicted(flapsHandleIndex + 1) * 1.36;
            }
            if (flapSpeed >= 60) {
                let posY = this.valueToSvg(currentAirspeed, flapSpeed);
                _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
                _marker.svg.setAttribute("visibility", "visible");
                hideMarker = false;
            }
        }
        if (hideMarker)
            _marker.svg.setAttribute("visibility", "hidden");
    }
    updateMarkerS(_marker, currentAirspeed) {
        let hideMarker = true;
        let phase = Simplane.getCurrentFlightPhase();
        let flapsHandleIndex = Simplane.getFlapsHandleIndex();
        if (flapsHandleIndex == 1) {
            let slatSpeed = 0;
            if (phase == FlightPhase.FLIGHT_PHASE_TAKEOFF || phase == FlightPhase.FLIGHT_PHASE_CLIMB || phase == FlightPhase.FLIGHT_PHASE_GOAROUND) {
                slatSpeed = Simplane.getStallSpeedPredicted(flapsHandleIndex - 1) * 1.25;
            }
            else if (phase == FlightPhase.FLIGHT_PHASE_DESCENT || phase == FlightPhase.FLIGHT_PHASE_APPROACH) {
                slatSpeed = Simplane.getStallSpeedPredicted(flapsHandleIndex + 1) * 1.23;
            }
            if (slatSpeed >= 60) {
                var posY = this.valueToSvg(currentAirspeed, slatSpeed);
                _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
                _marker.svg.setAttribute("visibility", "visible");
                hideMarker = false;
            }
        }
        if (hideMarker)
            _marker.svg.setAttribute("visibility", "hidden");
    }
    updateMarkerV1(_marker, currentAirspeed) {
        let v1Speed = SimVar.GetSimVarValue("L:WT_CJ4_V1_SPEED", "Knots");
        if (v1Speed >= 40) {
            _marker.engaged = true;
        }
        else if (_marker.engaged && !_marker.passed) {
            v1Speed = SimVar.GetSimVarValue("L:WT_CJ4_V1_SPEED", "Knots");
        }
        if (v1Speed >= 40) {
            var posY = this.valueToSvg(currentAirspeed, v1Speed);
            _marker.setOffscreen(false);
            if (posY >= this.refHeight + 25) {
                _marker.passed = true;
            }
            _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
            _marker.svg.setAttribute("visibility", "visible");
        }
        else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
        if (SimVar.GetSimVarValue("L:WT_CJ4_V1_FMCSET", "Bool")) {
            _marker.textSVG.setAttribute("fill", "magenta");
            _marker.lineSVG.style.stroke = "magenta";
        }
        else {
            _marker.textSVG.setAttribute("fill", "cyan");
            _marker.lineSVG.style.stroke = "cyan";
        }
    }
    updateMarkerVR(_marker, currentAirspeed) {
        let vRSpeed = SimVar.GetSimVarValue("L:WT_CJ4_VR_SPEED", "Knots");
        if (vRSpeed >= 40) {
            _marker.engaged = true;
        }
        else if (_marker.engaged && !_marker.passed) {
            vRSpeed = SimVar.GetSimVarValue("L:WT_CJ4_VR_SPEED", "Knots");
        }
        if (vRSpeed >= 40) {
            var posY = this.valueToSvg(currentAirspeed, vRSpeed);
            if (posY >= this.refHeight + 25) {
                _marker.passed = true;
            }
            _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
            _marker.svg.setAttribute("visibility", "visible");
        }
        else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
        if (SimVar.GetSimVarValue("L:WT_CJ4_VR_FMCSET", "Bool")) {
            _marker.textSVG.setAttribute("fill", "magenta");
            _marker.lineSVG.style.stroke = "magenta";

        }
        else {
            _marker.textSVG.setAttribute("fill", "cyan");
            _marker.lineSVG.style.stroke = "cyan";
        }
    }
    updateMarkerV2(_marker, currentAirspeed) {
        let v2Speed = SimVar.GetSimVarValue("L:WT_CJ4_V2_SPEED", "Knots");
        if (v2Speed >= 40) {
            _marker.engaged = true;
        }
        else if (_marker.engaged && !_marker.passed) {
            v2Speed = SimVar.GetSimVarValue("L:WT_CJ4_V2_SPEED", "Knots");
        }
        if (v2Speed >= 40) {
            var posY = this.valueToSvg(currentAirspeed, v2Speed);
            if (posY >= this.refHeight + 25) {
                _marker.passed = true;
            }
            _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
            _marker.svg.setAttribute("visibility", "visible");
        }
        else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
        if (SimVar.GetSimVarValue("L:WT_CJ4_V2_FMCSET", "Bool")) {
            _marker.textSVG.setAttribute("fill", "magenta");
            _marker.lineSVG.style.stroke = "magenta";

        }
        else {
            _marker.textSVG.setAttribute("fill", "cyan");
            _marker.lineSVG.style.stroke = "cyan";
        }
    }
    updateMarkerVRef(_marker, currentAirspeed) {
        let vRefSpeed = SimVar.GetSimVarValue("L:WT_CJ4_VREF_SPEED", "Knots");
        if (vRefSpeed >= 40) {
            var posY = this.valueToSvg(currentAirspeed, vRefSpeed);
            _marker.setOffscreen(false);
            _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
            _marker.svg.setAttribute("visibility", "visible");
        }
        else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
        if (SimVar.GetSimVarValue("L:WT_CJ4_VREF_FMCSET", "Bool")) {
            _marker.textSVG.setAttribute("fill", "magenta");
            _marker.lineSVG.style.stroke = "magenta";

        }
        else {
            _marker.textSVG.setAttribute("fill", "cyan");
            _marker.lineSVG.style.stroke = "cyan";
        }
    }
    updateMarkerVApp(_marker, currentAirspeed) {
        let vAppSpeed = SimVar.GetSimVarValue("L:WT_CJ4_VAP", "Knots");
        if (vAppSpeed >= 40 && this.aircraft == Aircraft.CJ4) {
            var posY = this.valueToSvg(currentAirspeed, vAppSpeed);
            _marker.setOffscreen(false);
            _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
            _marker.svg.setAttribute("visibility", "visible");
        }
        else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
        if (SimVar.GetSimVarValue("L:WT_CJ4_VAP_FMCSET", "Bool")) {
            _marker.textSVG.setAttribute("fill", "magenta");
            _marker.lineSVG.style.stroke = "magenta";

        }
        else {
            _marker.textSVG.setAttribute("fill", "cyan");
            _marker.lineSVG.style.stroke = "cyan";
        }
    }
    updateMarkerVX(_marker, currentAirspeed) {
        let vxSpeed = SimVar.GetSimVarValue("L:WT_CJ4_VT_SPEED", "Knots");
        if (vxSpeed >= 40) {
            _marker.engaged = true;
        }
        else if (_marker.engaged && !_marker.passed) {
            vxSpeed = SimVar.GetSimVarValue("L:WT_CJ4_VT_SPEED", "Knots");
        }
        if (vxSpeed >= 40) {
            var posY = this.valueToSvg(currentAirspeed, vxSpeed);
            if (posY >= this.refHeight + 25) {
                _marker.passed = true;
            }
            _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
            _marker.svg.setAttribute("visibility", "visible");
        }
        else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
        if (this.aircraft == Aircraft.CJ4 && SimVar.GetSimVarValue("L:WT_CJ4_VT_FMCSET", "Bool")) {
            _marker.textSVG.setAttribute("fill", "magenta");
            _marker.lineSVG.style.stroke = "magenta";
        }
        else if (this.aircraft == Aircraft.CJ4) {
            _marker.textSVG.setAttribute("fill", "cyan");
            _marker.lineSVG.style.stroke = "cyan";
        }
    }
    updateMarkerFlaps15Marker(_marker, currentAirspeed) {
        _marker.engaged = true;
        var posY = this.valueToSvg(currentAirspeed, 200);
        _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
        if (Simplane.getAltitude() < 18000) {
            _marker.svg.setAttribute("visibility", "visible");
        } else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
    }
    updateMarkerFlaps35Marker(_marker, currentAirspeed) {
        _marker.engaged = true;
        var posY = this.valueToSvg(currentAirspeed, 160);
        _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
        if (Simplane.getAltitude() < 18000) {
            _marker.svg.setAttribute("visibility", "visible");
        } else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
    }
    updateMarkerFlap(_marker, currentAirspeed) {
        let hideMarker = true;
        let phase = Simplane.getCurrentFlightPhase();
        let flapsHandleIndex = Simplane.getFlapsHandleIndex();
        let markerHandleIndex = _marker.params[0];
        if (markerHandleIndex == flapsHandleIndex || markerHandleIndex == (flapsHandleIndex - 1)) {
            if (phase >= FlightPhase.FLIGHT_PHASE_TAKEOFF && ((phase != FlightPhase.FLIGHT_PHASE_CLIMB && phase != FlightPhase.FLIGHT_PHASE_CRUISE) || !this.altOver20k)) {
                hideMarker = false;
            }
        }
        if (!hideMarker) {
            let limitSpeed = 0;
            if (markerHandleIndex == 0) {
                limitSpeed = Simplane.getFlapsLimitSpeed(this.aircraft, 1) + 20;
                _marker.setText("UP");
            }
            else {
                limitSpeed = Simplane.getFlapsLimitSpeed(this.aircraft, markerHandleIndex);
                let degrees = Simplane.getFlapsHandleAngle(markerHandleIndex);
                _marker.setText(degrees.toFixed(0));
            }
            let speedBuffer = 50;
            {
                let weightRatio = Simplane.getWeight() / Simplane.getMaxWeight();
                weightRatio = (weightRatio - 0.65) / (1 - 0.65);
                weightRatio = 1.0 - Utils.Clamp(weightRatio, 0, 1);
                let altitudeRatio = Simplane.getAltitude() / 30000;
                altitudeRatio = 1.0 - Utils.Clamp(altitudeRatio, 0, 1);
                speedBuffer *= (weightRatio * 0.7 + altitudeRatio * 0.3);
            }
            var posY = this.valueToSvg(currentAirspeed, limitSpeed - speedBuffer);
            _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
            _marker.svg.setAttribute("visibility", "visible");
        }
        else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
    }
}
customElements.define("jet-pfd-airspeed-indicator", Jet_PFD_AirspeedIndicator);
class AirspeedMarker {
    constructor(_lineSVG, _textSVG, _offscreenSVG, _handler) {
        this.engaged = false;
        this.passed = false;
        this.lineSVG = _lineSVG;
        this.textSVG = _textSVG;
        this.offscreenSVG = _offscreenSVG;
        this.handler = _handler;
        this.setOffscreen(false);
    }
    update(_indicatedSpeed) {
        this.handler(this, _indicatedSpeed);
    }
    setText(_text) {
        this.textSVG.textContent = _text;
    }
    setOffscreen(_offscreen, _speed = 0) {
        if (_offscreen) {
            this.lineSVG.setAttribute("visibility", "hidden");
            this.offscreenSVG.removeAttribute("visibility");
            this.offscreenSVG.textContent = _speed.toString();
        }
        else {
            this.lineSVG.removeAttribute("visibility");
            this.offscreenSVG.setAttribute("visibility", "hidden");
        }
    }
}