class SvgMap {
    constructor(_root, arg) {
        this._maxUpdateTime = 0;
        this._lastMaxUpdateTime = 0;
        this._mediumUpdateTime = 0;
        this._iterations = 0;
        this.configLoaded = false;
        this.rotateWithPlane = false;
        this.mapElements = [];
        this._elementsWithTextBox = [];
        
        this.svgLayersToUpdate = [];
        
        this._previousCenterCoordinates = [];
        this.planeDirection = 0;
        this.planeDirectionRadian = 0;
        this.planeAltitude = 0;
        this._ratio = 1;
        this._NMWidth = 100;
        this._ftWidth = 0;
        this._angularHeight = 0;
        this._angularWidth = 0;
        this._angularWidthNorth = 0;
        this._angularWidthSouth = 0;
        this._bottomLeftCoordinates = new LatLongAlt();
        this._topRightCoordinates = new LatLongAlt();
        this.index = SvgMap.Index;
        console.log("New SvgMap of index " + this.index);
        SvgMap.Index++;
        this.htmlRoot = _root;
        this.planeXY = new Vec2(0.5, 0.5);
        
        this.cosRotation = 1;   // cosine of rotation, mainly for internal use
        this.sinRotation = 0;   // sine of rotation, mainly for internal use
        
        let configPath = "./";
        let elementId = "MapSVG";
        if (typeof (arg) === "string") {
            configPath = arg;
        }
        else if (arg) {
            if (arg.svgElement instanceof Element) {
                this._svgHtmlElement = arg.svgElement;
            }
            else if (typeof (arg.svgElementId) === "string") {
                elementId = arg.svgElementId;
            }
            if (typeof (arg.configPath) === "string") {
                configPath = arg.configPath;
            }
        }
        if (!this._svgHtmlElement) {
            this._svgHtmlElement = _root.querySelector("#" + elementId);
        }
        this.svgHtmlElement.setAttribute("viewBox", "0 0 1000 1000");
        
        this.cityLayer = document.createElementNS(Avionics.SVG.NS, "g");
        this.svgHtmlElement.appendChild(this.cityLayer);
        this.svgLayersToUpdate.push(this.cityLayer);
        
        this.flightPlanLayer = document.createElementNS(Avionics.SVG.NS, "svg");
        this.svgHtmlElement.appendChild(this.flightPlanLayer);
        this.svgLayersToUpdate.push(this.flightPlanLayer);
        
        this.defaultLayer = document.createElementNS(Avionics.SVG.NS, "svg");
        this.svgHtmlElement.appendChild(this.defaultLayer);
        this.svgLayersToUpdate.push(this.defaultLayer);
        
        this.textLayer = document.createElementNS(Avionics.SVG.NS, "svg");
        this.svgHtmlElement.appendChild(this.textLayer);
        
        this.trackVectorLayer = document.createElementNS(Avionics.SVG.NS, "svg");
        this.svgHtmlElement.appendChild(this.trackVectorLayer);
        this.svgLayersToUpdate.push(this.trackVectorLayer);
        
        this.altitudeInterceptLayer = document.createElementNS(Avionics.SVG.NS, "svg");
        this.svgHtmlElement.appendChild(this.altitudeInterceptLayer);
        this.svgLayersToUpdate.push(this.altitudeInterceptLayer);
        
        this.fuelRingLayer = document.createElementNS(Avionics.SVG.NS, "svg");
        this.svgHtmlElement.appendChild(this.fuelRingLayer);
        this.svgLayersToUpdate.push(this.fuelRingLayer);
        
        this.rangeRingLayer = document.createElementNS(Avionics.SVG.NS, "svg");
        this.svgHtmlElement.appendChild(this.rangeRingLayer);
        this.svgLayersToUpdate.push(this.rangeRingLayer);
        
        this.maskLayer = document.createElementNS(Avionics.SVG.NS, "svg");
        this.svgHtmlElement.appendChild(this.maskLayer);
        this.svgLayersToUpdate.push(this.maskLayer);
        
        this.planeLayer = document.createElementNS(Avionics.SVG.NS, "svg");
        this.svgHtmlElement.appendChild(this.planeLayer);
        this.svgLayersToUpdate.push(this.planeLayer);
        
        let loadConfig = () => {
            if (typeof (SvgMapConfig) !== "undefined") {
                this.config = new SvgMapConfig();
                this.config.load(configPath, () => {
                    this.configLoaded = true;
                });
            }
            else {
                setTimeout(loadConfig, 200);
            }
        };
        loadConfig();
    }
    
    get svgHtmlElement() {
        return this._svgHtmlElement;
    }
    
    get lastCenterCoordinates() {
        if (this._previousCenterCoordinates.length <= 0)
            return null;
        return this._previousCenterCoordinates[this._previousCenterCoordinates.length - 1];
    }
    
    get centerCoordinates() {
        if (this._previousCenterCoordinates.length <= 0)
            return null;
        return this._previousCenterCoordinates[0];
    }
    
    setCenterCoordinates(a, b, c) {
        if (a === undefined) {
            return;
        }
        let lat = NaN;
        let long = NaN;
        if ((a instanceof LatLong) || (a instanceof LatLongAlt) || (typeof (a.lat) === "number" && typeof (a.long) === "number")) {
            lat = a.lat;
            long = a.long;
        }
        else if (typeof (a) === "number" && typeof (b) === "number") {
            if (isFinite(a)) {
                lat = a;
            }
            if (isFinite(b)) {
                long = b;
            }
        }
        if (isFinite(lat) && isFinite(long)) {
            if (!isFinite(c))
                c = 5;
            this._previousCenterCoordinates.push(new LatLong(lat, long));
            while (this._previousCenterCoordinates.length > c) {
                this._previousCenterCoordinates.splice(0, 1);
            }
        }
    }
    
    get planeCoordinates() {
        return this._planeCoordinates;
    }
    
    setPlaneCoordinates(a, b, c) {
        if (a === undefined) {
            return false;
        }
        let lat = NaN;
        let long = NaN;
        let smoothness = 0;
        let unsmoothedMove = false;
        if (((a instanceof LatLong) || (a instanceof LatLongAlt)) && (typeof (a.lat) === "number" && typeof (a.long) === "number")) {
            lat = a.lat;
            long = a.long;
            if (isFinite(b)) {
                smoothness = Math.min(1, Math.max(b, 0));
            }
        }
        else if (typeof (a) === "number" && typeof (b) === "number") {
            if (isFinite(a)) {
                lat = a;
            }
            if (isFinite(b)) {
                long = b;
            }
            if (isFinite(c)) {
                smoothness = Math.min(1, Math.max(c, 0));
            }
        }
        if (isFinite(lat) && isFinite(long)) {
            if (!this._planeCoordinates) {
                this._planeCoordinates = new LatLong(lat, long);
            }
            else {
                if (Math.abs(this._planeCoordinates.lat - lat) > 0.01 || Math.abs(this._planeCoordinates.long - long) > 0.01) {
                    this._planeCoordinates.lat = lat;
                    this._planeCoordinates.long = long;
                    if (Math.abs(this._planeCoordinates.lat - lat) > 0.5 || Math.abs(this._planeCoordinates.long - long) > 0.5) {
                        unsmoothedMove = true;
                    }
                }
                else {
                    this._planeCoordinates.lat *= smoothness;
                    this._planeCoordinates.lat += lat * (1 - smoothness);
                    this._planeCoordinates.long *= smoothness;
                    this._planeCoordinates.long += long * (1 - smoothness);
                }
            }
        }
        return unsmoothedMove;
    }
    
    // MOD: width / height
    get aspectRatio() {
        return this._ratio;
    }
    
    get NMWidth() {
        return this._NMWidth;
    }
    
    // MOD: get the width in NM along the short axis of the map
    get NMWidthShort() {
        return this._NMWidth * Math.min(this._ratio, 1 / this._ratio);
    }
    
    set NMWidth(v) {
        if (this.NMWidth !== v) {
            this._NMWidth = v;
            this.computeCoordinates();
        }
    }
    
    setRange(r) {
        this.NMWidth = r;
    }
    
    // MOD: convenience methods that just pass through to MapInstrument
    get rotation() {
        return this.htmlRoot.rotation;
    }
    
    get overdrawFactor() {
        return this.htmlRoot.overdrawFactor;
    }
    
    get minVisibleX() {
        return this.htmlRoot.minVisibleX;
    }
    
    get maxVisibleX() {
        return this.htmlRoot.maxVisibleX;
    }
    
    get minVisibleY() {
        return this.htmlRoot.minVisibleY;
    }
    
    get maxVisibleY() {
        return this.htmlRoot.maxVisibleY;
    }
    
    computeCoordinates() {
        this._ftWidth = 6076.11 * this._NMWidth;
        if (this.centerCoordinates) {
            let centerCoordinates = this.centerCoordinates;
            this._angularWidth = this._NMWidth / 60 / Math.cos(centerCoordinates.lat * Avionics.Utils.DEG2RAD);
            this._angularHeight = this._NMWidth / 60;
            this._bottomLeftCoordinates.lat = centerCoordinates.lat - this._angularHeight * 0.5;
            this._bottomLeftCoordinates.long = centerCoordinates.long - this._angularWidth * 0.5;
            this._topRightCoordinates.lat = centerCoordinates.lat + this._angularHeight * 0.5;
            this._topRightCoordinates.long = centerCoordinates.long + this._angularWidth * 0.5;
            this._angularWidthNorth = this._NMWidth / 60 / Math.cos(this._topRightCoordinates.lat * Avionics.Utils.DEG2RAD);
            this._angularWidthSouth = this._NMWidth / 60 / Math.cos(this._bottomLeftCoordinates.lat * Avionics.Utils.DEG2RAD);
        }
    }
    
    get angularWidth() {
        return this._angularWidth;
    }
    
    get angularHeight() {
        return this._angularHeight;
    }
    
    get ftWidth() {
        return this._ftWidth;
    }
    
    get bottomLeftCoordinates() {
        return this._bottomLeftCoordinates;
    }
    
    get topRightCoordinates() {
        return this._topRightCoordinates;
    }
    
    update() {
        if (!this.configLoaded) {
            return;
        }
        this.htmlRoot.onBeforeMapRedraw();
        if (!this.centerCoordinates) {
            return;
        }

        this.planeDirection = SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree") % 360;
        
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
        for (let svgLayer of this.svgLayersToUpdate) {
            for (let child of svgLayer.children) {
                child.setAttribute("needDeletion", "true");
            }
        }
        
        if (this.lineCanvas) {
            this.lineCanvas.getContext("2d").clearRect(0, 0, this.lineCanvas.width, this.lineCanvas.height);
        }
        for (let i = 0; i < this.mapElements.length; i++) {
            let svgElement = this.mapElements[i].draw(this);
            svgElement.setAttribute("needDeletion", "false");
        }
        for (let svgLayer of this.svgLayersToUpdate) {
            let i = 0;
            while (i < svgLayer.children.length) {
                let e = svgLayer.children[i];
                if (e.getAttribute("needDeletion") === "true") {
                    svgLayer.removeChild(e);
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
                } else {
                    i++;
                }
            }
        }
        if (this.config.preventLabelOverlap) {
            this._elementsWithTextBox = [];
            for (let i = 0; i < this.mapElements.length; i++) {
                let e = this.mapElements[i];
                if (e.hasTextBox) {
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
    
    appendChild(_svgElement, _svgLayer = null) {
        if (!_svgLayer) {
            _svgLayer = this.defaultLayer;
        }
        _svgLayer.appendChild(_svgElement);
    }
    
    resize(w, h) {
        console.log("SvgMap Resize : " + w + " " + h);
        let max = Math.max(w, h);
        this.svgHtmlElement.setAttribute("width", fastToFixed(max, 0) + "px");
        this.svgHtmlElement.setAttribute("height", fastToFixed(max, 0) + "px");
        let top = "0px";
        let left = "0px";
        if (h < max) {
            top = fastToFixed((h - max) / 2, 0) + "px";
        }
        if (w < max) {
            left = fastToFixed((w - max) / 2, 0) + "px";
        }
        this.svgHtmlElement.style.top = top;
        this.svgHtmlElement.style.left = left;
        this.lineCanvas.width = w;
        this.lineCanvas.height = h;
    }
    
    NMToPixels(distanceInNM) {
        return distanceInNM / this._NMWidth * 1000;
    }
    
    feetsToPixels(distanceInFeets) {
        return distanceInFeets / this._ftWidth * 1000;
    }
    
    deltaLatitudeToPixels(deltaLatitude) {
        return deltaLatitude / this._angularHeight * 1000;
    }
    
    deltaLongitudeToPixels(deltaLongitude) {
        return deltaLongitude / this._angularWidth * 1000;
    }
    
    deltaLatitudeToNM(deltaLatitude) {
        return deltaLatitude / this._angularHeight * this.NMWidth;
    }
    
    deltaLongitudeToNM(deltaLongitude) {
        return deltaLongitude / this._angularWidth * this.NMWidth;
    }
    
    isInFrame(arg, safetyMarginFactor = 0) {
        if (arg && typeof (arg.x) === "number" && typeof (arg.y) === "number") {
            return this.isVec2InFrame(arg, safetyMarginFactor);
        }
        if (arg instanceof LatLong || arg instanceof LatLongAlt) {
            return this.isLatLongInFrame(arg, safetyMarginFactor);
        }
    }
    
    isVec2InFrame(p, safetyMarginFactor = 0) {
        return p.x >= (0 - 1000 * safetyMarginFactor) && p.y >= (0 - 1000 * safetyMarginFactor) && p.x < (1000 + 1000 * safetyMarginFactor) && p.y < (1000 + 1000 * safetyMarginFactor);
    }
    
    isLatLongInFrame(ll, safetyMarginFactor = 0) {
        let dLat = this._angularHeight * safetyMarginFactor;
        let dLong = this._angularWidth * safetyMarginFactor;
        return (ll.lat >= this._bottomLeftCoordinates.lat - dLat &&
            ll.long >= this._bottomLeftCoordinates.long - dLong &&
            ll.lat <= this._topRightCoordinates.lat + dLat &&
            ll.long <= this._topRightCoordinates.long + dLong);
    }
    
    isSegmentInFrame(s1, s2) {
        if (isNaN(s1.x) || isNaN(s1.y) || isNaN(s2.x) || isNaN(s2.y)) {
            return false;
        }
        if (Math.min(s1.x, s2.x) > 1000) {
            return false;
        }
        if (Math.max(s1.x, s2.x) < 0) {
            return false;
        }
        if (Math.min(s1.y, s2.y) > 1000) {
            return false;
        }
        if (Math.max(s1.y, s2.y) < 0) {
            return false;
        }
        return true;
    }
    
    coordinatesToXY(coordinates) {
        let xy = new Vec2();
        this.coordinatesToXYToRef(coordinates, xy);
        return xy;
    }
    
    latLongToXYToRef(lat, long, ref) {
        let xNorth = (long - this.centerCoordinates.long) / this._angularWidthNorth * 1000;
        let xSouth = (long - this.centerCoordinates.long) / this._angularWidthSouth * 1000;
        let deltaLat = (lat - this.centerCoordinates.lat) / this._angularHeight;
        let y = -deltaLat * 1000;
        deltaLat += 0.5;
        let x = xNorth * deltaLat + xSouth * (1 - deltaLat);
        ref.x = x * this.cosRotation - y * this.sinRotation + 500;
        ref.y = x * this.sinRotation + y * this.cosRotation + 500;
    }
    
    coordinatesToXYToRef(coordinates, ref) {
        let xNorth = (coordinates.long - this.centerCoordinates.long) / this._angularWidthNorth * 1000;
        let xSouth = (coordinates.long - this.centerCoordinates.long) / this._angularWidthSouth * 1000;
        let deltaLat = (coordinates.lat - this.centerCoordinates.lat) / this._angularHeight;
        let y = -deltaLat * 1000;
        deltaLat += 0.5;
        let x = xNorth * deltaLat + xSouth * (1 - deltaLat);
        ref.x = x * this.cosRotation - y * this.sinRotation + 500;
        ref.y = x * this.sinRotation + y * this.cosRotation + 500;
    }
    
    latLongToXYToRefForceCenter(lat, long, ref, forcedCenterCoordinates) {
        let xNorth = (long - forcedCenterCoordinates.long) / this._angularWidthNorth * 1000;
        let xSouth = (long - forcedCenterCoordinates.long) / this._angularWidthSouth * 1000;
        let deltaLat = (lat - forcedCenterCoordinates.lat) / this._angularHeight;
        let y = -deltaLat * 1000;
        deltaLat += 0.5;
        let x = xNorth * deltaLat + xSouth * (1 - deltaLat);
        ref.x = x * this.cosRotation - y * this.sinRotation + 500;
        ref.y = x * this.sinRotation + y * this.cosRotation + 500;
    }
    
    coordinatesToXYToRefForceCenter(coordinates, ref, forcedCenterCoordinates) {
        let xNorth = (coordinates.long - forcedCenterCoordinates.long) / this._angularWidthNorth * 1000;
        let xSouth = (coordinates.long - forcedCenterCoordinates.long) / this._angularWidthSouth * 1000;
        let deltaLat = (coordinates.lat - forcedCenterCoordinates.lat) / this._angularHeight;
        let y = -deltaLat * 1000;
        deltaLat += 0.5;
        let x = xNorth * deltaLat + xSouth * (1 - deltaLat);
        ref.x = x * this.cosRotation - y * this.sinRotation + 500;
        ref.y = x * this.sinRotation + y * this.cosRotation + 500;
    }
    
    XYToCoordinates(xy) {
        let lat = this.centerCoordinates.lat - ((xy.y - 500) / 1000) * this._angularHeight;
        let long = this.centerCoordinates.long + ((xy.x - 500) / 1000) * this._angularWidth;
        return new LatLongAlt(lat, long);
    }
    
    bearingDistanceToXY(bearing, distance) {
        let x = 1000 * (this.planeXY.x + Math.sin(bearing * Avionics.Utils.DEG2RAD) * distance / this.NMWidth);
        let y = 1000 * (this.planeXY.y - Math.cos(bearing * Avionics.Utils.DEG2RAD) * distance / this.NMWidth);
        return { x: x, y: y };
    }
    
    // MOD: convenience method to return X,Y coordinates of plane
    getPlanePositionXY() {
        return this.coordinatesToXY(this.planeCoordinates);
    }
    
    // MOD: returns lat/long coordinates of (X,Y) point of map with plane at center, taking into account any current map rotation
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
SvgMap.Index = 0;
SvgMap.LOG_PERFS = false;
checkAutoload();
//# sourceMappingURL=SvgMap.js.map