class SvgRangeCompassElement extends SvgMapElement {
    constructor() {
        super();

        this.centerPos = new Vec2(500, 500);                                                                    // center of the compass, in SVG coordinates for a 1000x1000 map
        this.radius = 250;                                                                                      // in SVG coordinate units
        this.arcStrokeWidth = SvgRangeCompassElement.ARC_STROKE_WIDTH_DEFAULT;                                  // in SVG coordinate units
        this.arcStrokeColor = SvgRangeCompassElement.ARC_STROKE_COLOR_DEFAULT;
        this.arcAngularWidth = SvgRangeCompassElement.ARC_ANGULAR_WIDTH_DEFAULT;                                // degrees
        this.arcFacingAngle = SvgRangeCompassElement.ARC_FACING_ANGLE_DEFAULT;                                  // degrees, 0 = up, increasing clockwise

        this.bearingTickWindowTolerance = SvgRangeCompassElement.BEARING_TICK_WINDOW_TOLERANCE;                 // degrees, how much extra angular width on either side of the displayed compass arc
                                                                                                                // to accept display of ticks and labels

        this.bearingTickMinorStart = SvgRangeCompassElement.BEARING_TICK_MINOR_START_DEFAULT;                   // degrees, the value of the first minor bearing tick mark on the compass (0 = NORTH)
        this.bearingTickMinorInterval = SvgRangeCompassElement.BEARING_TICK_MINOR_INTERVAL_DEFAULT;             // degrees, how far apart the minor bearing tick marks on the compass should be
        this.bearingTickMinorColor = SvgRangeCompassElement.BEARING_TICK_MINOR_COLOR_DEFAULT;
        this.bearingTickMinorStrokeWidth = SvgRangeCompassElement.BEARING_TICK_MINOR_STROKE_WIDTH_DEFAULT;      // in SVG coordinate units
        this.bearingTickMinorLength = SvgRangeCompassElement.BEARING_TICK_MINOR_LENGTH_DEFAULT;                 // in SVG coordinate units

        this.bearingTickMajorStart = SvgRangeCompassElement.BEARING_TICK_MAJOR_START_DEFAULT;                   // degrees, the value of the first major bearing tick mark on the compass (0 = NORTH)
        this.bearingTickMajorInterval = SvgRangeCompassElement.BEARING_TICK_MAJOR_INTERVAL_DEFAULT;             // degrees, how far apart the major bearing tick marks on the compass should be
        this.bearingTickMajorColor = SvgRangeCompassElement.BEARING_TICK_MAJOR_COLOR_DEFAULT;
        this.bearingTickMajorStrokeWidth = SvgRangeCompassElement.BEARING_TICK_MAJOR_STROKE_WIDTH_DEFAULT;      // in SVG coordinate units
        this.bearingTickMajorLength = SvgRangeCompassElement.BEARING_TICK_MAJOR_LENGTH_DEFAULT;                 // in SVG coordinate units

        this.bearingLabelStart = SvgRangeCompassElement.BEARING_LABEL_START_DEFAULT;                            // degrees, the value of the first bearing label on the compass (0 = NORTH)
        this.bearingLabelInterval = SvgRangeCompassElement.BEARING_LABEL_INTERVAL_DEFAULT;                      // degrees, how far apart the bearing labels on the compass should be
        this.bearingLabelFont = SvgRangeCompassElement.BEARING_LABEL_FONT_DEFAULT;
        this.bearingLabelFontColor = SvgRangeCompassElement.BEARING_LABEL_FONT_COLOR_DEFAULT;
        this.bearingLabelFontOutlineWidth = SvgRangeCompassElement.BEARING_LABEL_FONT_OUTLINE_WIDTH_DEFAULT;    // in SVG coordinate units
        this.bearingLabelFontOutlineColor = SvgRangeCompassElement.BEARING_LABEL_FONT_OUTLINE_COLOR_DEFAULT;
        this.bearingLabelFontSize = SvgRangeCompassElement.BEARING_LABEL_FONT_SIZE_DEFAULT;                     // in SVG coordinate units

        this.hdgTrkTickStrokeColor = SvgRangeCompassElement.HDGTRK_TICK_STROKE_COLOR_DEFAULT;
        this.hdgTrkTickStrokeWidth = SvgRangeCompassElement.HDGTRK_TICK_STROKE_WIDTH_DEFAULT;                   // in SVG coordinate units
        this.hdgTrkTickLength = SvgRangeCompassElement.HDGTRK_TICK_LENGTH_DEFAULT;                              // in SVG coordinate units

        this.labelFont = SvgRangeLabelElement.FONT_DEFAULT;
        this.labelValueFontSize = SvgRangeLabelElement.VALUE_FONT_SIZE_DEFAULT;
        this.labelUnitFontSize = SvgRangeLabelElement.UNIT_FONT_SIZE_DEFAULT;
        this.labelAutoFontSize = SvgRangeLabelElement.AUTO_FONT_SIZE_DEFAULT;
        this.labelFontColor = SvgRangeLabelElement.FONT_COLOR_DEFAULT;
        this.labelAngle = SvgRangeCompassElement.RANGE_DISPLAY_ANGLE_DEFAULT;
        this.showLabel = SvgRangeCompassElement.RANGE_DISPLAY_SHOW_DEFAULT;
    }

    id(map) {
        return "range-compass" + "-map-" + map.index;
    }

    appendToMap(map) {
        map.appendChild(this.svgElement, map.rangeRingLayer);
    }

    createDraw(map) {
        this.setPropertyFromConfig(map.config.rangeCompass, "arcStrokeWidth");
        this.setPropertyFromConfig(map.config.rangeCompass, "arcStrokeColor");
        this.setPropertyFromConfig(map.config.rangeCompass, "arcAngularWidth");
        this.setPropertyFromConfig(map.config.rangeCompass, "arcFacingAngle");

        this.setPropertyFromConfig(map.config.rangeCompass, "bearingTickMinorStart");
        this.setPropertyFromConfig(map.config.rangeCompass, "bearingTickMinorInterval");
        this.setPropertyFromConfig(map.config.rangeCompass, "bearingTickMinorStrokeColor");
        this.setPropertyFromConfig(map.config.rangeCompass, "bearingTickMinorStrokeWidth");
        this.setPropertyFromConfig(map.config.rangeCompass, "bearingTickMinorLength");

        this.setPropertyFromConfig(map.config.rangeCompass, "bearingTickMajorStart");
        this.setPropertyFromConfig(map.config.rangeCompass, "bearingTickMajorInterval");
        this.setPropertyFromConfig(map.config.rangeCompass, "bearingTickMajorStrokeColor");
        this.setPropertyFromConfig(map.config.rangeCompass, "bearingTickMajorStrokeWidth");
        this.setPropertyFromConfig(map.config.rangeCompass, "bearingTickMajorLength");

        this.setPropertyFromConfig(map.config.rangeCompass, "bearingLabelStart");
        this.setPropertyFromConfig(map.config.rangeCompass, "bearingLabelInterval");
        this.setPropertyFromConfig(map.config.rangeCompass, "bearingLabelFont");
        this.setPropertyFromConfig(map.config.rangeCompass, "bearingLabelFontColor");
        this.setPropertyFromConfig(map.config.rangeCompass, "bearingLabelFontOutlineWidth");
        this.setPropertyFromConfig(map.config.rangeCompass, "bearingLabelFontOutlineColor");
        this.setPropertyFromConfig(map.config.rangeCompass, "bearingLabelFontSize");

        this.setPropertyFromConfig(map.config.rangeCompass, "hdgTrkTickStrokeColor");
        this.setPropertyFromConfig(map.config.rangeCompass, "hdgTrkTickStrokeWidth");
        this.setPropertyFromConfig(map.config.rangeCompass, "hdgTrkTickLength");

        this.setPropertyFromConfig(map.config.rangeCompass, "labelFont");
        this.setPropertyFromConfig(map.config.rangeCompass, "labelValueFontSize");
        this.setPropertyFromConfig(map.config.rangeCompass, "labelUnitFontSize");
        this.setPropertyFromConfig(map.config.rangeCompass, "labelAutoFontSize");
        this.setPropertyFromConfig(map.config.rangeCompass, "labelFontColor");
        this.setPropertyFromConfig(map.config.rangeCompass, "labelAngle");
        this.setPropertyFromConfig(map.config.rangeCompass, "showLabel");

        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);

        container.setAttribute("x", 0);
        container.setAttribute("y", 0);
        container.setAttribute("width", 1000);
        container.setAttribute("height", 1000);
        container.setAttribute("overflow", "hidden");

        this.compassLayer = document.createElementNS(Avionics.SVG.NS, "g");
        this.labelLayer = document.createElementNS(Avionics.SVG.NS, "g");
        container.appendChild(this.compassLayer);
        container.appendChild(this.labelLayer);

        this.arc = document.createElementNS(Avionics.SVG.NS, "path");
        this.arc.setAttribute("fill-opacity", "0");
        this.arc.setAttribute("stroke", this.arcStrokeColor);
        this.arc.setAttribute("stroke-width", this.arcStrokeWidth);
        this.arc.setAttribute("stroke-opacity", "1");
        this.compassLayer.appendChild(this.arc);

        this.bearingTicksMinor = [];
        this.bearingTicksMajor = [];
        this.bearingLabels = [];

        this.hdgTrkTick = document.createElementNS(Avionics.SVG.NS, "path");
        this.hdgTrkTick.setAttribute("fill-opacity", "0");
        this.hdgTrkTick.setAttribute("stroke", this.hdgTrkTickStrokeColor);
        this.hdgTrkTick.setAttribute("stroke-width", this.hdgTrkTickStrokeWidth);
        this.hdgTrkTick.setAttribute("stroke-opacity", "1");
        this.compassLayer.appendChild(this.hdgTrkTick);

        this.rangeLabelElement = new SvgRangeLabelElement(this.labelFont, this.labelValueFontSize, this.labelUnitFontSize, this.labelAutoFontSize, this.labelFontColor);
        this.labelLayer.appendChild(this.rangeLabelElement.createDraw(map));

        container.style.webkitTransform = "rotateX(0deg)"; // for optimization... maybe?

        return container;
    }

    updateDraw(map) {
        this.centerPos = map.getPlanePositionXY();
        this.radius = map.htmlRoot.getDisplayRange() / map.NMWidth * 1000;

        // draw arc

        let arcAngularWidthRad = this.arcAngularWidth * Math.PI / 180;
        let arcTickStart = SvgRangeCompassElement.getRadialOffsetPos(this.centerPos, this.radius + this.bearingTickMajorLength, -arcAngularWidthRad / 2);
        let arcStart = SvgRangeCompassElement.getRadialOffsetPos(this.centerPos, this.radius, -arcAngularWidthRad / 2);
        let arcEnd = SvgRangeCompassElement.getRadialOffsetPos(this.centerPos, this.radius, arcAngularWidthRad / 2);
        let arcTickEnd = SvgRangeCompassElement.getRadialOffsetPos(this.centerPos, this.radius + this.bearingTickMajorLength, arcAngularWidthRad / 2);

        this.arc.setAttribute("d", `M ${arcTickStart.x} ${arcTickStart.y} L ${arcStart.x} ${arcStart.y} A ${this.radius} ${this.radius} 0 0 1 ${arcEnd.x} ${arcEnd.y} L ${arcTickEnd.x} ${arcTickEnd.y}`);
        this.arc.setAttribute("transform", "rotate(" + this.arcFacingAngle + ", " + this.centerPos.x + ", " + this.centerPos.y + ")");

        // draw bearing indicator ticks
        let magDev = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degrees") - SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degrees"); // kind of a hack-y way to get magnetic deviation

        let arcBearingStart = this.arcFacingAngle - this.arcAngularWidth / 2 - map.rotation + magDev;
        let arcBearingEnd = this.arcFacingAngle + this.arcAngularWidth / 2 - map.rotation + magDev;
        if (arcBearingStart < 0) {
            arcBearingStart += 360;
            arcBearingEnd += 360;
        }
        let currentBearing = Math.ceil((arcBearingStart - this.bearingTickMinorStart) / this.bearingTickMinorInterval) * this.bearingTickMinorInterval + this.bearingTickMinorStart;
        if (currentBearing - this.bearingTickMinorInterval >= arcBearingStart - this.bearingTickWindowTolerance) {
            currentBearing -= this.bearingTickMinorInterval;
        }
        let i = 0;
        while (currentBearing <= arcBearingEnd + this.bearingTickWindowTolerance) {
            if ((currentBearing - this.bearingTickMajorStart) % this.bearingTickMajorInterval != 0) {
                if (i >= this.bearingTicksMinor.length) {
                    this.bearingTicksMinor[i] = this.createBearingTickMinor();
                    this.compassLayer.appendChild(this.bearingTicksMinor[i]);
                }
                SvgRangeCompassElement.drawRadialTick(this.bearingTicksMinor[i], this.centerPos, this.radius - this.bearingTickMinorLength, this.bearingTickMinorLength, Math.PI * (currentBearing + map.rotation - magDev) / 180);
                this.bearingTicksMinor[i].setAttribute("display", "inherit");
                i++;
            }
            currentBearing += this.bearingTickMinorInterval;
        }
        while (i < this.bearingTicksMinor.length) {
            this.bearingTicksMinor[i++].setAttribute("display", "none");
        }

        currentBearing = Math.ceil((arcBearingStart - this.bearingTickMajorStart) / this.bearingTickMajorInterval) * this.bearingTickMajorInterval + this.bearingTickMajorStart;
        if (currentBearing - this.bearingTickMajorInterval >= arcBearingStart - this.bearingTickWindowTolerance) {
            currentBearing -= this.bearingTickMajorInterval;
        }
        i = 0;
        while (currentBearing <= arcBearingEnd + this.bearingTickWindowTolerance) {
            if (i >= this.bearingTicksMajor.length) {
                this.bearingTicksMajor[i] = this.createBearingTickMajor();
                this.compassLayer.appendChild(this.bearingTicksMajor[i]);
            }
            SvgRangeCompassElement.drawRadialTick(this.bearingTicksMajor[i], this.centerPos, this.radius - this.bearingTickMajorLength, this.bearingTickMajorLength, Math.PI * (currentBearing + map.rotation - magDev) / 180);
            this.bearingTicksMajor[i].setAttribute("display", "inherit");
            i++;
            currentBearing += this.bearingTickMajorInterval;
        }
        while (i < this.bearingTicksMajor.length) {
            this.bearingTicksMajor[i++].setAttribute("display", "none");
        }

        currentBearing = Math.ceil((arcBearingStart - this.bearingLabelStart) / this.bearingLabelInterval) * this.bearingLabelInterval + this.bearingLabelStart;
        if (currentBearing - this.bearingLabelInterval >= arcBearingStart - this.bearingTickWindowTolerance) {
            currentBearing -= this.bearingLabelInterval;
        }
        i = 0;
        while (currentBearing <= arcBearingEnd + this.bearingTickWindowTolerance) {
            if (i >= this.bearingLabels.length) {
                this.bearingLabels[i] = this.createBearingLabel();
                this.compassLayer.appendChild(this.bearingLabels[i]);
            }
            let offset = this.bearingLabelFontSize * 1.02;  // calculate how much the labels need to be offset from ticks to not collide
                                                            // label length approximated as font size * 3 chars * 0.6 (empiric constant), label height is ~= font size
                                                            // longest path through the label is through the diagonal, so Pythagorean theorem and then divide by 2 because middle anchor
            let pos = SvgRangeCompassElement.getRadialOffsetPos(this.centerPos, this.radius - this.bearingTickMajorLength - offset, Math.PI * (currentBearing + map.rotation - magDev) / 180);
            this.bearingLabels[i].setAttribute("x", pos.x);
            this.bearingLabels[i].setAttribute("y", pos.y);
            this.bearingLabels[i].textContentCached = fastToFixed(currentBearing % 360, 0);
            this.bearingLabels[i].setAttribute("display", "inherit");
            currentBearing += this.bearingLabelInterval;
            i++;
        }
        while (i < this.bearingLabels.length) {
            this.bearingLabels[i++].setAttribute("display", "none");
        }

        SvgRangeCompassElement.drawRadialTick(this.hdgTrkTick, this.centerPos, this.radius, this.hdgTrkTickLength, 0);

        if (this.showLabel) {
            this.rangeLabelElement.range = this.radius / 1000 * map.NMWidth;
            this.rangeLabelElement.updateDraw(map);

            let labelAngleRad = this.labelAngle * Math.PI / 180;
            let x = this.centerPos.x + this.radius * Math.sin(labelAngleRad);
            let y = this.centerPos.y - this.radius * Math.cos(labelAngleRad);

            this.rangeLabelElement.svgElement.setAttribute("x", x - this.rangeLabelElement.svgElement.width.baseVal.value / 2);
            this.rangeLabelElement.svgElement.setAttribute("y", y - this.rangeLabelElement.svgElement.height.baseVal.value / 2);
            this.rangeLabelElement.svgElement.setAttribute("display", "inherit");
        } else {
            this.rangeLabelElement.svgElement.setAttribute("display", "none");
        }
    }

    createBearingTickMinor() {
        let bearingTick = document.createElementNS(Avionics.SVG.NS, "path");
        bearingTick.setAttribute("fill-opacity", "0");
        bearingTick.setAttribute("stroke", this.bearingTickMinorColor);
        bearingTick.setAttribute("stroke-width", this.bearingTickMinorStrokeWidth);
        bearingTick.setAttribute("stroke-opacity", "1");
        return bearingTick;
    }

    createBearingTickMajor() {
        let bearingTick = document.createElementNS(Avionics.SVG.NS, "path");
        bearingTick.setAttribute("fill-opacity", "0");
        bearingTick.setAttribute("stroke", this.bearingTickMajorColor);
        bearingTick.setAttribute("stroke-width", this.bearingTickMajorStrokeWidth);
        bearingTick.setAttribute("stroke-opacity", "1");
        return bearingTick;
    }

    createBearingLabel() {
        let bearingLabel = document.createElementNS(Avionics.SVG.NS, "text");
        bearingLabel.setAttribute("fill", this.bearingLabelFontColor);
        bearingLabel.setAttribute("text-anchor", "middle");
        bearingLabel.setAttribute("dominant-baseline", "middle");
        bearingLabel.setAttribute("stroke", this.bearingLabelFontOutlineColor);
        bearingLabel.setAttribute("stroke-width", this.bearingLabelFontOutlineWidth);
        bearingLabel.setAttribute("font-size", this.bearingLabelFontSize);
        bearingLabel.setAttribute("font-family", this.bearingLabelFont);
        return bearingLabel;
    }

    static drawRadialTick(_tick, _center, _radiusInner, _length, _angle) {
        let start = SvgRangeCompassElement.getRadialOffsetPos(_center, _radiusInner, _angle);
        let end = SvgRangeCompassElement.getRadialOffsetPos(_center, _radiusInner + _length, _angle);
        _tick.setAttribute("d", `M ${start.x} ${start.y} L ${end.x} ${end.y}`);
    }

    static getRadialOffsetPos(_center, _radius, _angle) {
        return new Vec2(_center.x + _radius * Math.sin(_angle), _center.y - _radius * Math.cos(_angle));
    }
}
SvgRangeCompassElement.ARC_STROKE_WIDTH_DEFAULT = 2;
SvgRangeCompassElement.ARC_STROKE_COLOR_DEFAULT = "white";
SvgRangeCompassElement.ARC_ANGULAR_WIDTH_DEFAULT = 122;
SvgRangeCompassElement.ARC_FACING_ANGLE_DEFAULT = 0;

SvgRangeCompassElement.BEARING_TICK_WINDOW_TOLERANCE = 0;

SvgRangeCompassElement.BEARING_TICK_MINOR_START_DEFAULT = 0;
SvgRangeCompassElement.BEARING_TICK_MINOR_INTERVAL_DEFAULT = 10;
SvgRangeCompassElement.BEARING_TICK_MINOR_COLOR_DEFAULT = "white";
SvgRangeCompassElement.BEARING_TICK_MINOR_STROKE_WIDTH_DEFAULT = 2;
SvgRangeCompassElement.BEARING_TICK_MINOR_LENGTH_DEFAULT = 5;

SvgRangeCompassElement.BEARING_TICK_MAJOR_START_DEFAULT = 0;
SvgRangeCompassElement.BEARING_TICK_MAJOR_INTERVAL_DEFAULT = 30;
SvgRangeCompassElement.BEARING_TICK_MAJOR_COLOR_DEFAULT = "white";
SvgRangeCompassElement.BEARING_TICK_MAJOR_STROKE_WIDTH_DEFAULT = 2;
SvgRangeCompassElement.BEARING_TICK_MAJOR_LENGTH_DEFAULT = 10;

SvgRangeCompassElement.BEARING_LABEL_START_DEFAULT = 0;
SvgRangeCompassElement.BEARING_LABEL_INTERVAL_DEFAULT = 30;
SvgRangeCompassElement.BEARING_LABEL_FONT_DEFAULT = "Roboto";
SvgRangeCompassElement.BEARING_LABEL_FONT_COLOR_DEFAULT = "white";
SvgRangeCompassElement.BEARING_LABEL_FONT_OUTLINE_WIDTH_DEFAULT = 6;
SvgRangeCompassElement.BEARING_LABEL_FONT_OUTLINE_COLOR_DEFAULT = "black";
SvgRangeCompassElement.BEARING_LABEL_FONT_SIZE_DEFAULT = 20;

SvgRangeCompassElement.HDGTRK_TICK_STROKE_COLOR_DEFAULT = "white";
SvgRangeCompassElement.HDGTRK_TICK_STROKE_WIDTH_DEFAULT = 2;
SvgRangeCompassElement.HDGTRK_TICK_LENGTH_DEFAULT = 10;

SvgRangeCompassElement.RANGE_DISPLAY_ANGLE_DEFAULT = -45;
SvgRangeCompassElement.RANGE_DISPLAY_SHOW_DEFAULT = true;