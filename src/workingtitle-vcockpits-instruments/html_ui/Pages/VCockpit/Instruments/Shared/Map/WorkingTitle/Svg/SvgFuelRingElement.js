class SvgFuelRingElement extends SvgLabeledRingElement {
    constructor() {
        super();

        this.innerRingStrokeColor = SvgFuelRingElement.INNER_RING_STROKE_COLOR_DEFAULT;
        this.innerRingStrokeWidth = SvgFuelRingElement.INNER_RING_STROKE_WIDTH_DEFAULT;
        this.innerRingStrokeDash = SvgFuelRingElement.INNER_RING_STROKE_DASH_DEFAULT;
        this.innerRingOutlineColor = SvgFuelRingElement.INNER_RING_OUTLINE_COLOR_DEFAULT;
        this.innerRingOutlineWidth = SvgFuelRingElement.INNER_RING_OUTLINE_WIDTH_DEFAULT;

        this.outerRingStrokeColor = SvgFuelRingElement.OUTER_RING_STROKE_COLOR_DEFAULT;
        this.outerRingStrokeReserveColor = SvgFuelRingElement.OUTER_RING_STROKE_COLOR_RESERVE_DEFAULT;
        this.outerRingStrokeWidth = SvgFuelRingElement.OUTER_RING_STROKE_WIDTH_DEFAULT;
        this.outerRingOutlineColor = SvgFuelRingElement.OUTER_RING_OUTLINE_COLOR_DEFAULT;
        this.outerRingOutlineWidth = SvgFuelRingElement.OUTER_RING_OUTLINE_WIDTH_DEFAULT;

        this.labelFont = SvgFuelTimeLabelElement.FONT_DEFAULT;
        this.labelFontSize = SvgFuelTimeLabelElement.FONT_SIZE_DEFAULT;
        this.labelFontColor = SvgFuelTimeLabelElement.FONT_COLOR_DEFAULT;
        this.labelAngle = SvgFuelRingElement.LABEL_ANGLE_DEFAULT;

        this.smoothingConstant = SvgFuelRingElement.SMOOTHING_CONSTANT_DEFAULT;

        this.radiusOuter = 300;

        this.reserveFuelTime = 45;

        this.lastFuelTime = -1;
        this.lastTime = 0;
    }

    id(map) {
        return "fuel-ring" + "-map-" + map.index;
    }

    appendToMap(map) {
        map.appendChild(this.svgElement, map.fuelRingLayer);
    }

    createDraw(map) {
        this.setPropertyFromConfig(map.config.fuelRing, "innerRingStrokeColor");
        this.setPropertyFromConfig(map.config.fuelRing, "innerRingStrokeWidth");
        this.setPropertyFromConfig(map.config.fuelRing, "innerRingStrokeDash");
        this.setPropertyFromConfig(map.config.fuelRing, "innerRingOutlineColor");
        this.setPropertyFromConfig(map.config.fuelRing, "innerRingOutlineWidth");

        this.setPropertyFromConfig(map.config.fuelRing, "outerRingStrokeColor");
        this.setPropertyFromConfig(map.config.fuelRing, "outerRingStrokeReserveColor");
        this.setPropertyFromConfig(map.config.fuelRing, "outerRingStrokeWidth");
        this.setPropertyFromConfig(map.config.fuelRing, "outerRingOutlineColor");
        this.setPropertyFromConfig(map.config.fuelRing, "outerRingOutlineWidth");

        this.setPropertyFromConfig(map.config.fuelRing, "labelFont");
        this.setPropertyFromConfig(map.config.fuelRing, "labelFontSize");
        this.setPropertyFromConfig(map.config.fuelRing, "labelFontColor");
        this.setPropertyFromConfig(map.config.fuelRing, "labelAngle");

        let container = super.createDraw(map);

        this.rangeRingOuter = this.createRingOuter(map);
        container.appendChild(this.rangeRingOuter);

        return container;
    }

    updateDraw(map) {
        this.updateRing(map);
        if (this.showLabel) {
            this.updateLabel(map);
            this.labelSvg.setAttribute("display", "inherit");
        } else {
            this.labelSvg.setAttribute("display", "none");
        }
    }

    createRing(map) {
        let ring = document.createElementNS(Avionics.SVG.NS, "g");

        this.rangeRingOutline = document.createElementNS(Avionics.SVG.NS, "circle");
        this.rangeRingOutline.setAttribute("fill-opacity", "0");
        this.rangeRingOutline.setAttribute("stroke", this.innerRingOutlineColor);
        this.rangeRingOutline.setAttribute("stroke-width", this.innerRingOutlineWidth);
        this.rangeRingOutline.setAttribute("stroke-opacity", "1");
        ring.appendChild(this.rangeRingOutline);

        // the game doesn't support dasharray for circles, so we need to use path instead
        this.rangeRingCore = document.createElementNS(Avionics.SVG.NS, "path");
        this.rangeRingCore.setAttribute("fill-opacity", "0");
        this.rangeRingCore.setAttribute("stroke", this.innerRingStrokeColor);
        this.rangeRingCore.setAttribute("stroke-width", this.innerRingStrokeWidth);
        this.rangeRingCore.setAttribute("stroke-dasharray", this.innerRingStrokeDash);
        this.rangeRingCore.setAttribute("vector-effect", "non-scaling-stroke");
        this.rangeRingCore.setAttribute("stroke-opacity", "1");
        this.rangeRingCore.setAttribute("d", "M 0 -1 A 1 1 0 0 1 0 1 A 1 1 0 0 1 0 -1 Z");

        ring.appendChild(this.rangeRingCore);

        return ring;
    }

    createRingOuter(map) {
        let ring = document.createElementNS(Avionics.SVG.NS, "g");

        this.rangeRingOuterOutline = document.createElementNS(Avionics.SVG.NS, "circle");
        this.rangeRingOuterOutline.setAttribute("fill-opacity", "0");
        this.rangeRingOuterOutline.setAttribute("stroke", this.outerRingOutlineColor);
        this.rangeRingOuterOutline.setAttribute("stroke-width", this.outerRingOutlineWidth);
        this.rangeRingOuterOutline.setAttribute("stroke-opacity", "1");
        ring.appendChild(this.rangeRingOuterOutline);

        this.rangeRingOuterCore = document.createElementNS(Avionics.SVG.NS, "circle");
        this.rangeRingOuterCore.setAttribute("fill-opacity", "0");
        this.rangeRingOuterCore.setAttribute("stroke", this.outerRingStrokeColor);
        this.rangeRingOuterCore.setAttribute("stroke-width", this.outerRingStrokeWidth);
        this.rangeRingOuterCore.setAttribute("stroke-opacity", "1");
        ring.appendChild(this.rangeRingOuterCore);

        return ring;
    }

    createLabel(map) {
        this.reserveTimeLabelElement = new SvgFuelTimeLabelElement(this.labelFont, this.labelFontSize, this.labelFontColor);
        return this.reserveTimeLabelElement.createDraw(map);
    }

    updateDraw(map) {
        if (SimVar.GetSimVarValue("SIM ON GROUND", "bool")) {
            return;
        }

        let currentTime = Date.now() / 1000;
        let dt = currentTime - this.lastTime;

        this.centerPos = map.getPlanePositionXY();

        let fuelRemaining = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons");

        let numEngines = SimVar.GetSimVarValue("NUMBER OF ENGINES", "number");
        let fuelFlow = 0;
        for (let i = 1; i <= numEngines; i++ ) {
            fuelFlow += SimVar.GetSimVarValue("ENG FUEL FLOW GPH:" + i, "gallons per hour");
        }

        if (fuelFlow <= 0) {
            this.lastFuelTime = -1;
            return;
        }

        let fuelTimeRemaining = fuelRemaining / fuelFlow * 60;
        if (this.lastFuelTime > 0) {
            let smoothingFactor = Math.pow(0.5, dt * this.smoothingConstant);
            fuelTimeRemaining = fuelTimeRemaining * smoothingFactor + (this.lastFuelTime) * (1 - smoothingFactor);
        }
        let timeToReserve = Math.max(fuelTimeRemaining - this.reserveFuelTime, 0);
        let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");

        if (timeToReserve > 0) {
            this.showRing = true;
            this.showLabel = true;
            this.radius = timeToReserve * groundSpeed / 60 / map.NMWidth * 1000;
            this.reserveTimeLabelElement.time = timeToReserve;
            this.rangeRingOuterCore.setAttribute("stroke", this.outerRingStrokeColor);
        } else {
            this.showRing = false;
            this.showLabel = false;
            this.rangeRingOuterCore.setAttribute("stroke", this.outerRingStrokeReserveColor);
        }

        this.radiusOuter = fuelTimeRemaining * groundSpeed / 60 / map.NMWidth * 1000;

        if (!this.isInView()) {
            fuelTimeRemaining = -1;
            this.showRing = false;
            this.showLabel = false;
            this.rangeRingOuter.setAttribute("display", "none");
        } else {
            this.rangeRingOuter.setAttribute("display", "inherit");
            this.updateRingComponent(this.rangeRingOuterCore, this.radiusOuter);
            this.updateRingComponent(this.rangeRingOuterOutline, this.radiusOuter);
        }
        super.updateDraw(map);

        this.lastTime = currentTime;
        this.lastFuelTime = fuelTimeRemaining;
    }

    updateRing(map) {
        this.updateRingComponent(this.rangeRingOutline, this.radius);

        this.rangeRingCore.setAttribute("transform", "translate(" + this.centerPos.x + ", " + this.centerPos.y + ") scale(" + this.radius + ")");
    }

    updateRingComponent(_component, _radius) {
        _component.setAttribute("cx", this.centerPos.x);
        _component.setAttribute("cy", this.centerPos.y);
        _component.setAttribute("r", _radius);
    }

    updateLabel(map) {
        this.reserveTimeLabelElement.updateDraw(map);
        super.updateLabel(map);
    }

    isInView(map) {
        let outerRadius = this.radiusOuter;
        let innerRadius = outerRadius;
        if (this.showRing) {
            innerRadius = this.radius;
        }

        let innerHalfLength = innerRadius / Math.sqrt(2);
        let innerLeft = this.centerPos.x - innerHalfLength;
        let innerRight = this.centerPos.x + innerHalfLength;
        let innerTop = this.centerPos.y - innerHalfLength;
        let innerBottom = this.centerPos.y + innerHalfLength;

        let outerLeft = this.centerPos.x - outerRadius;
        let outerRight = this.centerPos.x + outerRadius;
        let outerTop = this.centerPos.y - outerRadius;
        let outerBottom = this.centerPos.y + outerRadius;

        // check if view bounds are completely inside inner circle (with margin)
        if (innerLeft < -50 && innerRight > 1050 && innerTop < -50 && innerBottom > 1050) {
            return false;
        }

        // check if view bounds are outside outer circle (with margin)
        if (outerLeft > 1050 || outerRight < -50 || outerTop > 1050 || outerBottom < -50) {
            return false;
        }

        return true;
    }

    static getRadialOffsetPos(_center, _radius, _angle) {
        return new Vec2(_center.x + _radius * Math.sin(_angle), _center.y - _radius * Math.cos(_angle));
    }
}
SvgFuelRingElement.INNER_RING_STROKE_COLOR_DEFAULT = "#63aa59";
SvgFuelRingElement.INNER_RING_STROKE_WIDTH_DEFAULT = 3;
SvgFuelRingElement.INNER_RING_STROKE_DASH_DEFAULT = "5";
SvgFuelRingElement.INNER_RING_OUTLINE_COLOR_DEFAULT = "black";
SvgFuelRingElement.INNER_RING_OUTLINE_WIDTH_DEFAULT = 3;

SvgFuelRingElement.OUTER_RING_STROKE_COLOR_DEFAULT = "#63aa59";
SvgFuelRingElement.OUTER_RING_STROKE_COLOR_RESERVE_DEFAULT = "yellow";
SvgFuelRingElement.OUTER_RING_STROKE_WIDTH_DEFAULT = 3;
SvgFuelRingElement.OUTER_RING_OUTLINE_COLOR_DEFAULT = "black";
SvgFuelRingElement.OUTER_RING_OUTLINE_WIDTH_DEFAULT = 4;

SvgFuelRingElement.LABEL_ANGLE_DEFAULT = 0;
SvgFuelRingElement.SMOOTHING_CONSTANT_DEFAULT = 120;

class SvgFuelTimeLabelElement {
    constructor(_font, _fontSize, _fontColor) {
        this.time = 0;
        this.font = _font;
        this.fontSize = _fontSize;
        this.fontColor = _fontColor;
    }

    createDraw(map) {
        this.svgElement = document.createElementNS(Avionics.SVG.NS, "svg");

        this.displayBox = document.createElementNS(Avionics.SVG.NS, "rect");
        this.displayBox.setAttribute("x", "1");
        this.displayBox.setAttribute("y", "1");
        this.displayBox.setAttribute("fill", "#1a1d21");
        this.displayBox.setAttribute("style", "fill:#1a1d21; stroke:white; stroke-width:1");
        this.svgElement.appendChild(this.displayBox);

        this.displayValueText = document.createElementNS(Avionics.SVG.NS, "text");
        this.displayValueText.setAttribute("fill", this.fontColor);
        this.displayValueText.setAttribute("text-anchor", "start");
        this.displayValueText.setAttribute("font-size", this.valueFontSize);
        this.displayValueText.setAttribute("font-family", this.font);
        this.svgElement.appendChild(this.displayValueText);

        return this.svgElement;
    }

    updateDraw(map) {
        this.updateText();
        this.formatDisplay();
    }

    updateText() {
        let hours = Math.floor(this.time / 60);
        let minutes = this.time % 60;

        let hoursText = fastToFixed(hours, 0);
        let minutesText = fastToFixed(minutes, 0);

        if (hours < 10) {
            hoursText = "0" + hoursText;
        }
        if (minutes < 10) {
            minutesText = "0" + minutesText;
        }

        this.displayValueText.textContent = hoursText + "h " + minutesText + "m";
    }

    formatDisplay() {
        let valueWidth = 7 * this.fontSize * 0.65;
        let leftRightBuffer = this.fontSize * 0.2;
        let topBottomBuffer = this.fontSize * 0.1;

        let width = valueWidth + 2 * leftRightBuffer;
        let height = this.fontSize + 2 * topBottomBuffer;

        this.svgElement.setAttribute("viewBox", "0 0 " + width + " " + height);
        this.svgElement.setAttribute("width", width);
        this.svgElement.setAttribute("height", height);

        this.displayBox.setAttribute("width", width - 2);
        this.displayBox.setAttribute("height", height - 2);
        this.displayBox.setAttribute("rx", height * 0.2);

        this.displayValueText.setAttribute("x", leftRightBuffer);
        this.displayValueText.setAttribute("y", height - topBottomBuffer - this.fontSize * 0.1);
    }
}
SvgFuelTimeLabelElement.FONT_DEFAULT = "Roboto";
SvgFuelTimeLabelElement.FONT_SIZE_DEFAULT = 15;
SvgFuelTimeLabelElement.FONT_COLOR_DEFAULT = "#63aa59";