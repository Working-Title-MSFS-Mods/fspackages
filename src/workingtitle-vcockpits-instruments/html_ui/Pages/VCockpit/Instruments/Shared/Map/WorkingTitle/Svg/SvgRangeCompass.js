class SvgRangeCompass extends SvgMapElement {
	
	id(map) {
        return "range-compass" + "-map-" + map.index;;
    }
	
	createDraw(map) {
		let container = document.createElementNS(Avionics.SVG.NS, "svg");
		container.id = this.id(map);
		
		container.setAttribute("x", 0);
        container.setAttribute("y", 0);
        container.setAttribute("width", 1000);
        container.setAttribute("height", 1000);
        container.setAttribute("overflow", "hidden");
		
		return container;
	}
	
	updateDraw(map) {
		if (map.htmlRoot.orientation == "north") {
			// draw range ring
		} else {
			// draw compass
		}
	}
}