class SvgMapEnhanced extends SvgMap {
    constructor(_root, arg) {
		super(_root, arg);
		
		/*
		 * Defines orientation of the map:
		 * hdg: current aircraft heading up
		 * trk: current ground track up
		 * north: North up
		 */
		this.orientation = "hdg";
		
		this.rotation = 0;		// rotation of map, in degrees
		this.cosRotation = 1;	// cosine of rotation, mainly for internal use
		this.sinRotation = 0;	// sine of rotation, mainly for internal use
    }
    
    update() {
        if (!this.configLoaded) {
            return;
        }
        this.htmlRoot.onBeforeMapRedraw();
        if (!this.centerCoordinates) {
            return;
        }
        if (!this.flightPlanLayer) {
            this.flightPlanLayer = document.createElementNS(Avionics.SVG.NS, "g");
            this.svgHtmlElement.appendChild(this.flightPlanLayer);
        }
        if (!this.defaultLayer) {
            this.defaultLayer = document.createElementNS(Avionics.SVG.NS, "g");
            this.svgHtmlElement.appendChild(this.defaultLayer);
        }
        if (!this.textLayer) {
            this.textLayer = document.createElementNS(Avionics.SVG.NS, "g");
            this.svgHtmlElement.appendChild(this.textLayer);
        }
        if (!this.maskLayer) {
            this.maskLayer = document.createElementNS(Avionics.SVG.NS, "g");
            this.svgHtmlElement.appendChild(this.maskLayer);
        }
        if (!this.planeLayer) {
            this.planeLayer = document.createElementNS(Avionics.SVG.NS, "g");
            this.svgHtmlElement.appendChild(this.planeLayer);
        }
		
		if (this.orientation == "hdg") {
			this.rotation = -SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree");
		} else if (this.orientation == "trk") {
			this.rotation = -SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
		} else {
			this.rotation = 0;
		}

        this.planeDirection = Math.abs(SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree")) % 360;
        
        this.cosRotation = Math.cos(this.rotation * Math.PI / 180);
        this.sinRotation = Math.sin(this.rotation * Math.PI / 180);
        this.planeAltitude = SimVar.GetSimVarValue("PLANE ALT ABOVE GROUND", "feet");
		
		
        let w = this.htmlRoot.getWidth();
        let h = this.htmlRoot.getHeight();
        let r = w / h;
        if (isFinite(r) && r > 0) {
            this._ratio = r;
        }
		
        if (this._lastW !== w || this._lastH !== h) {
            this._lastW = w;
            this._lastH = h;
            this.resize(w, h);
        }
        this.computeCoordinates();
        let t0 = 0;
        if (SvgMap.LOG_PERFS) {
            t0 = performance.now();
        }
        ;
        for (let i = 0; i < this.planeLayer.children.length; i++) {
            this.planeLayer.children[i].setAttribute("needDeletion", "true");
        }
        for (let i = 0; i < this.maskLayer.children.length; i++) {
            this.maskLayer.children[i].setAttribute("needDeletion", "true");
        }
        for (let i = 0; i < this.defaultLayer.children.length; i++) {
            this.defaultLayer.children[i].setAttribute("needDeletion", "true");
        }
        for (let i = 0; i < this.flightPlanLayer.children.length; i++) {
            this.flightPlanLayer.children[i].setAttribute("needDeletion", "true");
        }
        if (this.lineCanvas) {
            this.lineCanvas.getContext("2d").clearRect(0, 0, this.lineCanvas.width, this.lineCanvas.height);
        }
        for (let i = 0; i < this.mapElements.length; i++) {
            let svgElement = this.mapElements[i].draw(this);
            svgElement.setAttribute("needDeletion", "false");
        }
        let i = 0;
        while (i < this.planeLayer.children.length) {
            let e = this.planeLayer.children[i];
            if (e.getAttribute("needDeletion") === "true") {
                this.planeLayer.removeChild(e);
            }
            else {
                i++;
            }
        }
        i = 0;
        while (i < this.defaultLayer.children.length) {
            let e = this.defaultLayer.children[i];
            if (e.getAttribute("needDeletion") === "true") {
                this.defaultLayer.removeChild(e);
                if (e.getAttribute("hasTextBox") === "true") {
                    let textElement = this.htmlRoot.querySelector("#" + e.id + "-text-" + this.index);
                    if (textElement) {
                        this.textLayer.removeChild(textElement);
                    }
                    let rectElement = this.htmlRoot.querySelector("#" + e.id + "-rect-" + this.index);
                    if (rectElement) {
                        this.textLayer.removeChild(rectElement);
                    }
                }
            }
            else {
                i++;
            }
        }
        i = 0;
        while (i < this.flightPlanLayer.children.length) {
            let e = this.flightPlanLayer.children[i];
            if (e.getAttribute("needDeletion") === "true") {
                this.flightPlanLayer.removeChild(e);
            }
            else {
                i++;
            }
        }
        i = 0;
        while (i < this.maskLayer.children.length) {
            let e = this.maskLayer.children[i];
            if (e.getAttribute("needDeletion") === "true") {
                this.maskLayer.removeChild(e);
            }
            else {
                i++;
            }
        }
        if (this.config.preventLabelOverlap) {
            this._elementsWithTextBox = [];
            for (let i = 0; i < this.mapElements.length; i++) {
                let e = this.mapElements[i];
                if (e instanceof SvgNearestAirportElement) {
                    this._elementsWithTextBox.push(e);
                }
                else if (e instanceof SvgWaypointElement) {
                    this._elementsWithTextBox.push(e);
                }
                else if (e instanceof SvgConstraintElement) {
                    this._elementsWithTextBox.push(e);
                }
            }
            if (!this.textManager) {
                this.textManager = new SvgTextManager();
            }
            this.textManager.update(this, this._elementsWithTextBox);
        }
        if (SvgMap.LOG_PERFS) {
            let dt = performance.now() - t0;
            this._iterations += 1;
            this._mediumUpdateTime *= 99 / 100;
            this._mediumUpdateTime += dt / 100;
            this._maxUpdateTime = Math.max(dt, this._maxUpdateTime);
            this._lastMaxUpdateTime = Math.max(dt, this._lastMaxUpdateTime);
            if (this._iterations >= 60) {
                console.log("-----------------------------------------------");
                console.log("Medium Update Time   " + this._mediumUpdateTime.toFixed(3) + " ms");
                console.log("Last Max Update Time " + this._lastMaxUpdateTime.toFixed(3) + " ms");
                console.log("Max Update Time      " + this._maxUpdateTime.toFixed(3) + " ms");
                console.log("-----------------------------------------------");
                this._lastMaxUpdateTime = 0;
                this._iterations = 0;
                SvgMapElement.logPerformances();
            }
        }
    }
	
	resize(w, h) {
        console.log("SvgMap Resize : " + w + " " + h);
        let max = Math.max(w, h);
		
		//max *= MapInstrumentEnhanced.OVERDRAW_FACTOR;
		
        //this.svgHtmlElement.setAttribute("width", fastToFixed(max, 0) + "px");
        //this.svgHtmlElement.setAttribute("height", fastToFixed(max, 0) + "px");
        let top = "0px";
        let left = "0px";
		/*
        if (h < max) {
            top = fastToFixed((h - max) / 2, 0) + "px";
        }
        if (w < max) {
            left = fastToFixed((w - max) / 2, 0) + "px";
        }
		*/
		this.svgHtmlElement.style.width = fastToFixed(max, 0) + "px";
		this.svgHtmlElement.style.height = fastToFixed(max, 0) + "px";
		this.svgHtmlElement.style.top = fastToFixed((h - max) / 2, 0) + "px";
		this.svgHtmlElement.style.left = fastToFixed((w - max) / 2, 0) + "px";
			
        //this.svgHtmlElement.style.top = top;
        //this.svgHtmlElement.style.left = left;
        this.lineCanvas.width = w;
        this.lineCanvas.height = h;
    }
    
    latLongToXYToRef(lat, long, ref) {
        let xNorth = (long - this.centerCoordinates.long) / this._angularWidthNorth * 1000;
        let xSouth = (long - this.centerCoordinates.long) / this._angularWidthSouth * 1000;
        let deltaLat = (lat - this.centerCoordinates.lat) / this._angularHeight;
        let y = -deltaLat * 1000;
        deltaLat += 0.5;
        let x = xNorth * deltaLat + xSouth * (1 - deltaLat);
        if (this.orientation != "north") {
            ref.x = x * this.cosRotation - y * this.sinRotation + 500;
            ref.y = x * this.sinRotation + y * this.cosRotation + 500;
        }
        else {
            ref.x = x + 500;
            ref.y = y + 500;
        }
    }
    coordinatesToXYToRef(coordinates, ref) {
        let xNorth = (coordinates.long - this.centerCoordinates.long) / this._angularWidthNorth * 1000;
        let xSouth = (coordinates.long - this.centerCoordinates.long) / this._angularWidthSouth * 1000;
        let deltaLat = (coordinates.lat - this.centerCoordinates.lat) / this._angularHeight;
        let y = -deltaLat * 1000;
        deltaLat += 0.5;
        let x = xNorth * deltaLat + xSouth * (1 - deltaLat);
        if (this.orientation != "north") {
            ref.x = x * this.cosRotation - y * this.sinRotation + 500;
            ref.y = x * this.sinRotation + y * this.cosRotation + 500;
        }
        else {
            ref.x = x + 500;
            ref.y = y + 500;
        }
    }
    latLongToXYToRefForceCenter(lat, long, ref, forcedCenterCoordinates) {
        let xNorth = (long - forcedCenterCoordinates.long) / this._angularWidthNorth * 1000;
        let xSouth = (long - forcedCenterCoordinates.long) / this._angularWidthSouth * 1000;
        let deltaLat = (lat - forcedCenterCoordinates.lat) / this._angularHeight;
        let y = -deltaLat * 1000;
        deltaLat += 0.5;
        let x = xNorth * deltaLat + xSouth * (1 - deltaLat);
        if (this.orientation != "north") {
            ref.x = x * this.cosRotation - y * this.sinRotation + 500;
            ref.y = x * this.sinRotation + y * this.cosRotation + 500;
        }
        else {
            ref.x = x + 500;
            ref.y = y + 500;
        }
    }
    coordinatesToXYToRefForceCenter(coordinates, ref, forcedCenterCoordinates) {
        let xNorth = (coordinates.long - forcedCenterCoordinates.long) / this._angularWidthNorth * 1000;
        let xSouth = (coordinates.long - forcedCenterCoordinates.long) / this._angularWidthSouth * 1000;
        let deltaLat = (coordinates.lat - forcedCenterCoordinates.lat) / this._angularHeight;
        let y = -deltaLat * 1000;
        deltaLat += 0.5;
        let x = xNorth * deltaLat + xSouth * (1 - deltaLat);
        if (this.orientation != north) {
            ref.x = x * this.cosRotation - y * this.sinRotation + 500;
            ref.y = x * this.sinRotation + y * this.cosRotation + 500;
        }
        else {
            ref.x = x + 500;
            ref.y = y + 500;
        }
    }
	setOrientation(_val) {
		switch (_val) {
			case "trk":
			case "north":
				this.orientation = _val;
				break;
			case "hdg":
			default:
				this.orientation = "hdg";
		}
	}
	
	// returns lat/long coordinates of (X,Y) point of map with plane at center, taking into account any current map rotation
	// (X,Y) is vector of arbitrary units where (0,0) is top left and (1000, 1000) is bottom right of map
	XYToCoordinatesFromPlaneWithRotation(xy) {
		// transform xy with opposite of map rotation;
		let transformed = new Vec2();
		transformed.x = (xy.x - 500) * this.cosRotation + (xy.y - 500) * this.sinRotation + 500;
		transformed.y = -(xy.x - 500) * this.sinRotation + (xy.y - 500) * this.cosRotation + 500;
		
		let lat = this.planeCoordinates.lat - ((transformed.y - 500) / 1000) * this._angularHeight;
        let long = this.planeCoordinates.long + ((transformed.x - 500) / 1000) * this._angularWidth;
        return new LatLongAlt(lat, long);
    }
}
checkAutoload();