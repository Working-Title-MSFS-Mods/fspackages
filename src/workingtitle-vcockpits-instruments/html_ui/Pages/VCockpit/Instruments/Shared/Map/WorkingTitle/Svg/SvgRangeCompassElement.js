class SvgRangeCompassElement extends SvgMapElement {
	constructor() {
		super();
		
		// this should return radius in NM (so updateDraw knows what to put in the range display)
		this.rangeRingRadiusCallback = function (map, planePos) {
			// Radius of half the distance from the plane to the top of the map (corrected for overdraw)
			return planePos.y / 2000.0 * map.NMWidthShort;
		};
		// this should return the CENTERPOINT
		this.rangeDisplayPositionCallback = function (map, planePos) {
			let radius = planePos.y / 2.0 * map.NMWidthShort / map.NMWidth;
			let angle = SvgRangeCompassElement.RANGE_DISPLAY_FONT_POSITION * Math.PI / 180;
			return new Vec2(planePos.x + radius * Math.cos(angle), planePos.y + radius * Math.sin(angle));
		};
		
		this.rangeDisplayFont = SvgRangeCompassElement.RANGE_DISPLAY_FONT_DEFAULT;
		this.rangeDisplayFontSize = SvgRangeCompassElement.RANGE_DISPLAY_FONT_SIZE_DEFAULT;
		this.rangeDisplayUnitFontSize = SvgRangeCompassElement.RANGE_DISPLAY_UNIT_FONT_SIZE;
		this.rangeDisplayAutoFontSize = SvgRangeCompassElement.RANGE_DISPLAY_AUTO_FONT_SIZE;
		this.rangeDisplayFontColor = SvgRangeCompassElement.RANGE_DISPLAY_FONT_COLOR_DEFAULT;
	}
	
	id(map) {
        return "range-compass" + "-map-" + map.index;
    }
	
	createDraw(map) {
		let container = document.createElementNS(Avionics.SVG.NS, "svg");
		container.id = this.id(map);
		
		container.setAttribute("x", 0);
        container.setAttribute("y", 0);
        container.setAttribute("width", 1000);
        container.setAttribute("height", 1000);
        container.setAttribute("overflow", "hidden");
		
		// range ring
		
		this.rangeRing = document.createElementNS(Avionics.SVG.NS, "circle");
		this.rangeRing.setAttribute("cx", "500");
		this.rangeRing.setAttribute("cy", "500");
		this.rangeRing.setAttribute("r", "250");
		this.rangeRing.setAttribute("fill-opacity", "0");
		this.rangeRing.setAttribute("stroke", "white");
		this.rangeRing.setAttribute("stroke-width", "2");
		this.rangeRing.setAttribute("stroke-opacity", "1");
		this.rangeRing.setAttribute("stroke-opacity", "1");
		container.appendChild(this.rangeRing);
		
		// compass
		this.compassContainer = document.createElementNS(Avionics.SVG.NS, "g");
		
		// range display
		this.rangeDisplaySvg = document.createElementNS(Avionics.SVG.NS, "svg");
		
		this.rangeDisplayBox = document.createElementNS(Avionics.SVG.NS, "rect");
		this.rangeDisplayBox.setAttribute("x", "1");
        this.rangeDisplayBox.setAttribute("y", "1");
        this.rangeDisplayBox.setAttribute("fill", "#1a1d21");
		this.rangeDisplayBox.setAttribute("style", "fill:#1a1d21; stroke:white; stroke-width:1");
		this.rangeDisplaySvg.appendChild(this.rangeDisplayBox);
		
		this.rangeDisplayAutoText = document.createElementNS(Avionics.SVG.NS, "text");
		this.rangeDisplayAutoText.textContent = "AUTO";
		this.rangeDisplayAutoText.setAttribute("fill", this.rangeDisplayFontColor);
		this.rangeDisplayAutoText.setAttribute("text-anchor", "middle");
		this.rangeDisplayAutoText.setAttribute("font-size", this.rangeDisplayAutoFontSize);
		this.rangeDisplayAutoText.setAttribute("font-family", this.rangeDisplayFont);
		this.rangeDisplaySvg.appendChild(this.rangeDisplayAutoText);
		this.rangeDisplayValueText = document.createElementNS(Avionics.SVG.NS, "text");
		this.rangeDisplayValueText.setAttribute("fill", this.rangeDisplayFontColor);
		this.rangeDisplayValueText.setAttribute("text-anchor", "end");
		this.rangeDisplayValueText.setAttribute("font-size", this.rangeDisplayFontSize);
		this.rangeDisplayValueText.setAttribute("font-family", this.rangeDisplayFont);
		this.rangeDisplaySvg.appendChild(this.rangeDisplayValueText);
		this.rangeDisplayUnitText = document.createElementNS(Avionics.SVG.NS, "text");
		this.rangeDisplayUnitText.textContent = "NM";
		this.rangeDisplayUnitText.setAttribute("fill", this.rangeDisplayFontColor);
		this.rangeDisplayUnitText.setAttribute("font-size", this.rangeDisplayUnitFontSize);
		this.rangeDisplayUnitText.setAttribute("font-family", this.rangeDisplayFont);
		this.rangeDisplaySvg.appendChild(this.rangeDisplayUnitText);
		
		this.formatRangeDisplay(0, false);
		
		container.appendChild(this.rangeDisplaySvg);
		
		return container;
	}
	
	updateDraw(map) {
		if (map.htmlRoot.orientation == "north") {
			// draw range ring
			let planePos = map.getPlanePositionXY();
			let radius = this.rangeRingRadiusCallback(map, planePos);
			
			
			this.rangeRing.setAttribute("cx", planePos.x);
			this.rangeRing.setAttribute("cy", planePos.y);
			this.rangeRing.setAttribute("r", radius / map.NMWidth * 1000);
			this.rangeRing.setAttribute("display", "inherit");
			
			let rangeDisplayPos = this.rangeDisplayPositionCallback(map, planePos);
			
			this.formatRangeDisplay(radius, false);
			
			let rangeDisplayText = "";
			if (radius < 1) {
				rangeDisplayText = radius.toFixed(2);
			} else if (radius < 10) {
				rangeDisplayText = radius.toFixed(1);
			} else {
				rangeDisplayText = radius.toFixed(0);
			}
			
			if (false) {
				this.rangeDisplayAutoText.setAttribute("display", "inherit");
			} else {
				this.rangeDisplayAutoText.setAttribute("display", "none");
			}
			
			this.rangeDisplaySvg.setAttribute("x", rangeDisplayPos.x - this.rangeDisplaySvg.width.baseVal.value / 2);
			this.rangeDisplaySvg.setAttribute("y", rangeDisplayPos.y - this.rangeDisplaySvg.height.baseVal.value / 2);
			
			this.rangeDisplayValueText.textContent = rangeDisplayText;
		} else {
			// draw compass
			this.rangeRing.setAttribute("display", "none");
		}
	}
	
	formatRangeDisplay(_range, _auto) {
		let valueLength = 1;
		if (_range < 1) {
			valueLength = 4;
		} else if (_range < 10) {
			valueLength = 3;
		} else {
			valueLength = Math.floor(Math.log10(_range)) + 1;
		}
		
		let autoFontSize = _auto ? this.rangeDisplayAutoFontSize : 0;
		
		let autoWidth = autoFontSize * 2.4;
		let valueWidth = this.rangeDisplayFontSize * 0.6 * valueLength;
		let unitWidth = this.rangeDisplayUnitFontSize * 1.2;
		let middleBuffer = this.rangeDisplayFontSize * 0.1;
		let leftRightBuffer = this.rangeDisplayFontSize * 0.15;
		let topBottomBuffer = this.rangeDisplayFontSize * 0.1;
		
		let width = Math.max(autoWidth, valueWidth + unitWidth + middleBuffer) + 2 * leftRightBuffer;
		let height = this.rangeDisplayFontSize + autoFontSize + 2 * topBottomBuffer;
		
		this.rangeDisplaySvg.setAttribute("viewBox", "0 0 " + width + " " + height);
		this.rangeDisplaySvg.setAttribute("width", width);
		this.rangeDisplaySvg.setAttribute("height", height);
		
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
SvgRangeCompassElement.RANGE_DISPLAY_FONT_POSITION = -135;
SvgRangeCompassElement.RANGE_DISPLAY_FONT_DEFAULT = "Roboto";
SvgRangeCompassElement.RANGE_DISPLAY_FONT_SIZE_DEFAULT = 20;
SvgRangeCompassElement.RANGE_DISPLAY_UNIT_FONT_SIZE = 15;
SvgRangeCompassElement.RANGE_DISPLAY_AUTO_FONT_SIZE = 15;
SvgRangeCompassElement.RANGE_DISPLAY_FONT_COLOR_DEFAULT = "#8ed0d5";