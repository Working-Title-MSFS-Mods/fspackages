class SvgRangeRingElement extends SvgLabeledRingElement {
    constructor() {
        super();
        
        this.rangeRingStrokeColor = SvgRangeRingElement.RANGE_RING_STROKE_COLOR_DEFAULT;
        this.rangeRingStrokeWidth = SvgRangeRingElement.RANGE_RING_STROKE_WIDTH_DEFAULT;
        this.labelPosAngle = SvgRangeRingElement.RANGE_DISPLAY_ANGLE_DEFAULT;
    }
    
    id(map) {
        return "range-ring" + "-map-" + map.index;
    }
    
    appendToMap(map) {
        map.appendChild(this.svgElement, map.rangeRingLayer);
    }
    
    createRing(map) {
        let rangeRing = super.createRing(map);
        rangeRing.setAttribute("stroke", this.rangeRingStrokeColor);
        rangeRing.setAttribute("stroke-width", this.rangeRingStrokeWidth);
        rangeRing.setAttribute("stroke-opacity", "1");
        return rangeRing;
    }
    
    createLabel(map) {
        this.rangeLabelElement = new SvgRangeLabelElement();
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
SvgRangeRingElement.RANGE_RING_STROKE_COLOR_DEFAULT = "white";
SvgRangeRingElement.RANGE_RING_STROKE_WIDTH_DEFAULT = 2;
SvgRangeRingElement.RANGE_DISPLAY_ANGLE_DEFAULT = -45;

class SvgRangeLabelElement {
    constructor() {
        this.range;
        this.font = SvgRangeLabelElement.FONT_DEFAULT;
        this.valueFontSize = SvgRangeLabelElement.VALUE_FONT_SIZE_DEFAULT;
        this.unitFontSize = SvgRangeLabelElement.UNIT_FONT_SIZE_DEFAULT;
        this.autoFontSize = SvgRangeLabelElement.AUTO_FONT_SIZE_DEFAULT;
        this.fontColor = SvgRangeLabelElement.FONT_COLOR_DEFAULT;
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
        this.rangeDisplayAutoText.textContent = "AUTO";
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
        this.rangeDisplayUnitText.textContent = "NM";
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
            this.rangeDisplayValueText.textContent = MapInstrument.getFormattedRangeDisplayText(this.range * 6076);
            this.rangeDisplayUnitText.textContent = "FT";
        } else {
            this.rangeDisplayValueText.textContent = MapInstrument.getFormattedRangeDisplayText(this.range);
            this.rangeDisplayUnitText.textContent = "NM";
        }
    }
    
    formatRangeDisplay(_auto) {
        let valueLength = 1;
        if (this.range < 1) {
            valueLength = 4;
        } else if (this.range < 10) {
            valueLength = 3;
        } else {
            valueLength = Math.floor(Math.log10(this.range)) + 1;
        }
        
        let autoFontSize = _auto ? this.autoFontSize : 0;
        
        let autoWidth = this.rangeDisplayAutoText.getComputedTextLength();
        let valueWidth = this.rangeDisplayValueText.getComputedTextLength();
        let unitWidth = this.rangeDisplayUnitText.getComputedTextLength();
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