class SvgRangeRingElement extends SvgLabeledRingElement {
    constructor() {
        super();

        this.strokeColor = SvgRangeRingElement.STROKE_COLOR_DEFAULT;
        this.strokeWidth = SvgRangeRingElement.STROKE_WIDTH_DEFAULT;
        this.labelAngle = SvgRangeRingElement.RANGE_DISPLAY_ANGLE_DEFAULT;

        this.labelFont = SvgRangeLabelElement.FONT_DEFAULT;
        this.labelValueFontSize = SvgRangeLabelElement.VALUE_FONT_SIZE_DEFAULT;
        this.labelUnitFontSize = SvgRangeLabelElement.UNIT_FONT_SIZE_DEFAULT;
        this.labelAutoFontSize = SvgRangeLabelElement.AUTO_FONT_SIZE_DEFAULT;
        this.labelFontColor = SvgRangeLabelElement.FONT_COLOR_DEFAULT;
    }

    id(map) {
        return "range-ring" + "-map-" + map.index;
    }

    appendToMap(map) {
        map.appendChild(this.svgElement, map.rangeRingLayer);
    }

    createDraw(map) {
        this.setPropertyFromConfig(map.config.rangeRing, "strokeColor");
        this.setPropertyFromConfig(map.config.rangeRing, "strokeWidth");

        this.setPropertyFromConfig(map.config.rangeRing, "labelFont");
        this.setPropertyFromConfig(map.config.rangeRing, "labelValueFontSize");
        this.setPropertyFromConfig(map.config.rangeRing, "labelUnitFontSize");
        this.setPropertyFromConfig(map.config.rangeRing, "labelAutoFontSize");
        this.setPropertyFromConfig(map.config.rangeRing, "labelFontColor");
        this.setPropertyFromConfig(map.config.rangeRing, "labelAngle");
        this.setPropertyFromConfig(map.config.rangeRing, "showLabel");

        return super.createDraw(map);
    }

    createRing(map) {
        let rangeRing = super.createRing(map);

        rangeRing.setAttribute("stroke", this.strokeColor);
        rangeRing.setAttribute("stroke-width", this.strokeWidth);
        rangeRing.setAttribute("stroke-opacity", "1");
        return rangeRing;
    }

    createLabel(map) {
        this.rangeLabelElement = new SvgRangeLabelElement(this.labelFont, this.labelValueFontSize, this.labelUnitFontSize, this.labelAutoFontSize, this.labelFontColor);
        return this.rangeLabelElement.createDraw(map);
    }

    updateDraw(map) {
        this.centerPos = map.getPlanePositionXY();
        this.radius = map.htmlRoot.getDisplayRange() / map.NMWidth * 1000;
        super.updateDraw(map);
    }

    updateLabel(map) {
        this.rangeLabelElement.range = this.radius / 1000 * map.NMWidth;
        this.rangeLabelElement.updateDraw(map);
        super.updateLabel(map);
    }
}
SvgRangeRingElement.STROKE_COLOR_DEFAULT = "white";
SvgRangeRingElement.STROKE_WIDTH_DEFAULT = 2;
SvgRangeRingElement.RANGE_DISPLAY_ANGLE_DEFAULT = -45;

class SvgRangeLabelElement {
    constructor(_font, _valueFontSize, _unitFontSize, _autoFontSize, _fontColor) {
        this.range = 0;
        this.font = _font;
        this.valueFontSize = _valueFontSize;
        this.unitFontSize = _unitFontSize;
        this.autoFontSize = _autoFontSize;
        this.fontColor = _fontColor;
    }

    createDraw(map) {
        this.svgElement = document.createElementNS(Avionics.SVG.NS, "svg");

        this.rangeDisplayBox = document.createElementNS(Avionics.SVG.NS, "rect");
        this.rangeDisplayBox.setAttribute("x", "1");
        this.rangeDisplayBox.setAttribute("y", "1");
        this.rangeDisplayBox.setAttribute("fill", "#1a1d21");
        this.rangeDisplayBox.setAttribute("style", "fill:#1a1d21; stroke:white; stroke-width:1");
        this.svgElement.appendChild(this.rangeDisplayBox);

        this.rangeDisplayAutoText = document.createElementNS(Avionics.SVG.NS, "text");
        this.rangeDisplayAutoText.textContentCached = "AUTO";
        this.rangeDisplayAutoText.setAttribute("fill", this.fontColor);
        this.rangeDisplayAutoText.setAttribute("text-anchor", "middle");
        this.rangeDisplayAutoText.setAttribute("font-size", this.autoFontSize);
        this.rangeDisplayAutoText.setAttribute("font-family", this.font);
        this.svgElement.appendChild(this.rangeDisplayAutoText);

        this.rangeDisplayValueText = document.createElementNS(Avionics.SVG.NS, "text");
        this.rangeDisplayValueText.setAttribute("fill", this.fontColor);
        this.rangeDisplayValueText.setAttribute("text-anchor", "end");
        this.rangeDisplayValueText.setAttribute("font-size", this.valueFontSize);
        this.rangeDisplayValueText.setAttribute("font-family", this.font);
        this.svgElement.appendChild(this.rangeDisplayValueText);

        this.rangeDisplayUnitText = document.createElementNS(Avionics.SVG.NS, "text");
        this.rangeDisplayUnitText.textContentCached = "NM";
        this.rangeDisplayUnitText.setAttribute("fill", this.fontColor);
        this.rangeDisplayUnitText.setAttribute("font-size", this.unitFontSize);
        this.rangeDisplayUnitText.setAttribute("font-family", this.font);
        this.svgElement.appendChild(this.rangeDisplayUnitText);

        return this.svgElement;
    }

    updateDraw(map) {
        if (false) {
            this.rangeDisplayAutoText.setAttribute("display", "inherit");
        } else {
            this.rangeDisplayAutoText.setAttribute("display", "none");
        }
        this.updateRangeText();
        this.formatRangeDisplay(false);
    }

    updateRangeText() {
        // switch between NM and feet
        if (this.range <= 1000 / 6076) {
            this.rangeDisplayValueText.textContentCached = MapInstrument.getFormattedRangeDisplayText(this.range * 6076);
            this.rangeDisplayUnitText.textContentCached = "FT";
        } else {
            this.rangeDisplayValueText.textContentCached = MapInstrument.getFormattedRangeDisplayText(this.range);
            this.rangeDisplayUnitText.textContentCached = "NM";
        }
    }

    formatRangeDisplay(_auto) {
        let valueLength = this.rangeDisplayValueText.textContent.length;

        let autoFontSize = _auto ? this.autoFontSize : 0;

        let autoWidth = 4 * this.autoFontSize * 0.6;
        let valueWidth = valueLength * this.valueFontSize * 0.6;
        let unitWidth = 2 * this.unitFontSize * 0.6;
        let middleBuffer = this.valueFontSize * 0.1;
        let leftRightBuffer = this.valueFontSize * 0.15;
        let topBottomBuffer = this.valueFontSize * 0.1;

        let width = Math.max(autoWidth, valueWidth + unitWidth + middleBuffer) + 2 * leftRightBuffer;
        let height = this.valueFontSize + autoFontSize + 2 * topBottomBuffer;

        this.svgElement.setAttribute("viewBox", "0 0 " + width + " " + height);
        this.svgElement.setAttribute("width", width);
        this.svgElement.setAttribute("height", height);

        this.rangeDisplayBox.setAttribute("width", width - 2);
        this.rangeDisplayBox.setAttribute("height", height - 2);
        this.rangeDisplayBox.setAttribute("rx", height * 0.1);

        this.rangeDisplayAutoText.setAttribute("x", width / 2);
        this.rangeDisplayAutoText.setAttribute("y", topBottomBuffer + autoFontSize * 0.9);

        this.rangeDisplayValueText.setAttribute("x", leftRightBuffer + valueWidth);
        this.rangeDisplayValueText.setAttribute("y", height - topBottomBuffer - this.valueFontSize * 0.1);

        this.rangeDisplayUnitText.setAttribute("x", width - leftRightBuffer - unitWidth);
        this.rangeDisplayUnitText.setAttribute("y", height - topBottomBuffer - this.valueFontSize * 0.1);
    }
}
SvgRangeLabelElement.FONT_DEFAULT = "Roboto";
SvgRangeLabelElement.VALUE_FONT_SIZE_DEFAULT = 20;
SvgRangeLabelElement.UNIT_FONT_SIZE_DEFAULT = 15;
SvgRangeLabelElement.AUTO_FONT_SIZE_DEFAULT = 15;
SvgRangeLabelElement.FONT_COLOR_DEFAULT = "#8ed0d5";