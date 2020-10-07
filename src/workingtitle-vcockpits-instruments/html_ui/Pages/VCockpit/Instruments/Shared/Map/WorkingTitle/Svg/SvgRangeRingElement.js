class SvgRangeRingElement extends SvgLabeledRingElement {
	constructor() {
		super();
		
		this.labelPosAngle = SvgRangeRingElement.RANGE_DISPLAY_ANGLE_DEFAULT;
	}
	
	id(map) {
        return "range-ring" + "-map-" + map.index;
    }
	
	createRing(map) {
		let rangeRing = super.createRing(map);
		rangeRing.setAttribute("stroke", "white");
		rangeRing.setAttribute("stroke-width", "2");
		rangeRing.setAttribute("stroke-opacity", "1");
		return rangeRing;
	}
	
	createLabel(map) {
		this.rangeLabelElement = new SvgRangeLabelElement();
		return this.rangeLabelElement.createDraw(map);
	}
	
	updateDraw(map) {
		this.centerPos = map.getPlanePositionXY();
		this.radius = this.centerPos.y / 2 * map.NMWidthShort / map.NMWidth;
		super.updateDraw(map);
	}
	
	updateLabel(map) {
		this.rangeLabelElement.range = this.radius / 1000 * map.NMWidth;
		this.rangeLabelElement.updateDraw(map);
		super.updateLabel(map);
	}
}
SvgRangeRingElement.RANGE_DISPLAY_ANGLE_DEFAULT = -135;

class SvgRangeLabelElement {
	constructor() {
		this.range;
		this.rangeDisplayFont = SvgRangeLabelElement.RANGE_DISPLAY_FONT_DEFAULT;
		this.rangeDisplayFontSize = SvgRangeLabelElement.RANGE_DISPLAY_FONT_SIZE_DEFAULT;
		this.rangeDisplayUnitFontSize = SvgRangeLabelElement.RANGE_DISPLAY_UNIT_FONT_SIZE;
		this.rangeDisplayAutoFontSize = SvgRangeLabelElement.RANGE_DISPLAY_AUTO_FONT_SIZE;
		this.rangeDisplayFontColor = SvgRangeLabelElement.RANGE_DISPLAY_FONT_COLOR_DEFAULT;
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
		this.rangeDisplayAutoText.setAttribute("fill", this.rangeDisplayFontColor);
		this.rangeDisplayAutoText.setAttribute("text-anchor", "middle");
		this.rangeDisplayAutoText.setAttribute("font-size", this.rangeDisplayAutoFontSize);
		this.rangeDisplayAutoText.setAttribute("font-family", this.rangeDisplayFont);
		this.svgElement.appendChild(this.rangeDisplayAutoText);
		
		this.rangeDisplayValueText = document.createElementNS(Avionics.SVG.NS, "text");
		this.rangeDisplayValueText.setAttribute("fill", this.rangeDisplayFontColor);
		this.rangeDisplayValueText.setAttribute("text-anchor", "end");
		this.rangeDisplayValueText.setAttribute("font-size", this.rangeDisplayFontSize);
		this.rangeDisplayValueText.setAttribute("font-family", this.rangeDisplayFont);
		this.svgElement.appendChild(this.rangeDisplayValueText);
		
		this.rangeDisplayUnitText = document.createElementNS(Avionics.SVG.NS, "text");
		this.rangeDisplayUnitText.textContent = "NM";
		this.rangeDisplayUnitText.setAttribute("fill", this.rangeDisplayFontColor);
		this.rangeDisplayUnitText.setAttribute("font-size", this.rangeDisplayUnitFontSize);
		this.rangeDisplayUnitText.setAttribute("font-family", this.rangeDisplayFont);
		this.svgElement.appendChild(this.rangeDisplayUnitText);
		
		return this.svgElement;
	}
	
	updateDraw(map) {
		if (false) {
			this.rangeDisplayAutoText.setAttribute("display", "inherit");
		} else {
			this.rangeDisplayAutoText.setAttribute("display", "none");
		}
		
		let rangeDisplayText = "";
		if (this.range < 1) {
			rangeDisplayText = this.range.toFixed(2);
		} else if (this.range < 10) {
			rangeDisplayText = this.range.toFixed(1);
		} else {
			rangeDisplayText = this.range.toFixed(0);
		}
		this.rangeDisplayValueText.textContent = rangeDisplayText;
		
		this.formatRangeDisplay(false);
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
		
		let autoFontSize = _auto ? this.rangeDisplayAutoFontSize : 0;
		
		let autoWidth = this.rangeDisplayAutoText.getComputedTextLength();
		let valueWidth = this.rangeDisplayValueText.getComputedTextLength();
		let unitWidth = this.rangeDisplayUnitText.getComputedTextLength();
		let middleBuffer = this.rangeDisplayFontSize * 0.1;
		let leftRightBuffer = this.rangeDisplayFontSize * 0.15;
		let topBottomBuffer = this.rangeDisplayFontSize * 0.1;
		
		let width = Math.max(autoWidth, valueWidth + unitWidth + middleBuffer) + 2 * leftRightBuffer;
		let height = this.rangeDisplayFontSize + autoFontSize + 2 * topBottomBuffer;
		
		this.svgElement.setAttribute("viewBox", "0 0 " + width + " " + height);
		this.svgElement.setAttribute("width", width);
		this.svgElement.setAttribute("height", height);
		
        this.rangeDisplayBox.setAttribute("width", width - 2);
        this.rangeDisplayBox.setAttribute("height", height - 2);
		this.rangeDisplayBox.setAttribute("rx", height * 0.1);
		
		this.rangeDisplayAutoText.setAttribute("x", width / 2);
		this.rangeDisplayAutoText.setAttribute("y", topBottomBuffer + autoFontSize * 0.9);
		
		this.rangeDisplayValueText.setAttribute("x", leftRightBuffer + valueWidth);
		this.rangeDisplayValueText.setAttribute("y", height - topBottomBuffer - this.rangeDisplayFontSize * 0.1);
		
		this.rangeDisplayUnitText.setAttribute("x", width - leftRightBuffer - unitWidth);
		this.rangeDisplayUnitText.setAttribute("y", height - topBottomBuffer - this.rangeDisplayFontSize * 0.1);
	}
}
SvgRangeLabelElement.RANGE_DISPLAY_FONT_DEFAULT = "Roboto";
SvgRangeLabelElement.RANGE_DISPLAY_FONT_SIZE_DEFAULT = 20;
SvgRangeLabelElement.RANGE_DISPLAY_UNIT_FONT_SIZE = 15;
SvgRangeLabelElement.RANGE_DISPLAY_AUTO_FONT_SIZE = 15;
SvgRangeLabelElement.RANGE_DISPLAY_FONT_COLOR_DEFAULT = "#8ed0d5";