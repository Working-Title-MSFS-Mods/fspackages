class SvgRoadNetworkElementEnhanced extends SvgRoadNetworkElement {
    constructor() {
        super();
		this.lastShowRoadsHighway = true;
		this.lastShowRoadsTrunk = true;
		this.lastShowRoadsPrimary = true;
		this.lastShowAirspaces = true;
		this.lastShowAirways = true;
    }
	
	updateDraw(map) {
        if (!this._visibleCanvas) {
            let canvasImage = map.htmlRoot.querySelector("#road-network-canvas");
            if (!(canvasImage instanceof HTMLCanvasElement)) {
                return;
            }
            this._visibleCanvas = new RoadCanvas(canvasImage);
            if (this.visible)
                this._visibleCanvas.canvas.style.display = "block";
            else
                this._visibleCanvas.canvas.style.display = "none";
        }
		
		let mapRange = map.htmlRoot.getDisplayRange();
		let showRoadsHighway = map.htmlRoot.showRoads && (mapRange <= map.htmlRoot.roadHighwayMaxRange);
		let showRoadsTrunk = map.htmlRoot.showRoads && (mapRange <= map.htmlRoot.roadTrunkMaxRange);
		let showRoadsPrimary = map.htmlRoot.showRoads && (mapRange <= map.htmlRoot.roadPrimaryMaxRange);
		let showAirspaces = map.htmlRoot.showAirspaces && (map.htmlRoot.getDisplayRange() <= map.htmlRoot.airspaceMaxRange);
		let showAirways = map.htmlRoot.showAirways;
		
		let visibilityChanged = (this.lastShowRoadsHighway != showRoadsHighway) ||
								(this.lastShowRoadsTrunk != showRoadsTrunk) ||
								(this.lastShowRoadsPrimary != showRoadsPrimary) ||
								(this.lastShowAirspaces != showAirspaces) ||
								(this.lastShowAirways != showAirways);
								
		this.lastShowRoads = map.htmlRoot.showRoads;
		this.lastShowAirspaces = map.htmlRoot.showAirspaces;
		this.lastShowAirways = map.htmlRoot.showAirways;
		
        this.parentWidth = map.htmlRoot.getWidth();
        this.parentHeight = map.htmlRoot.getHeight();
        if (this.parentWidth * this.parentHeight < 1) {
            return;
        }
        this.displayedSize = Math.max(this.parentWidth, this.parentHeight);
        this.canvasSize = Math.min(SvgRoadNetworkElement.ROADS_CANVAS_OVERFLOW_FACTOR * this.displayedSize, SvgRoadNetworkElement.MAX_SIZE_ROADS_CANVAS);
        this.canvasOffset = (this.canvasSize - this.displayedSize) * 0.5;
        let thresholdLat = 0.25 * map.angularHeight;
        let thresholdLong = 0.25 * map.angularWidth;
        let resized = false;
        if (this._visibleCanvas.canvas.style.width !== fastToFixed(this.canvasSize, 0) + "px") {
            console.log("Resize RoadNetworkElement " + fastToFixed(this.canvasSize, 0) + "px");
            this._visibleCanvas.canvas.width = this.canvasSize;
            this._visibleCanvas.canvas.height = this.canvasSize;
            this._visibleCanvas.canvas.style.width = fastToFixed(this.canvasSize, 0) + "px";
            this._visibleCanvas.canvas.style.height = fastToFixed(this.canvasSize, 0) + "px";
            this._visibleCanvas.canvas.style.top = "0px";
            this._visibleCanvas.canvas.style.left = "0px";
            let top = 0;
            let left = 0;
            if (this.parentHeight < this.canvasSize) {
                top = Math.round((this.parentHeight - this.canvasSize) / 2);
            }
            if (this.parentWidth < this.canvasSize) {
                left = Math.round((this.parentWidth - this.canvasSize) / 2);
            }
            this.translateCanvas(this._visibleCanvas.canvas, left, top, 0);
            if (this._visibleCanvas.context2D) {
                this._visibleCanvas.context2D.imageSmoothingEnabled = false;
                this._visibleCanvas.context2D.globalCompositeOperation = "copy";
            }
            if (!this._invisibleCanvases) {
                this._invisibleCanvases = [];
                this._invisibleCanvases[0] = new RoadCanvas(document.createElement("canvas"));
                this._invisibleCanvases[1] = new RoadCanvas(document.createElement("canvas"));
            }
            this._invisibleCanvases[0].canvas.width = this.canvasSize;
            this._invisibleCanvases[0].canvas.height = this.canvasSize;
            document.body.appendChild(this._invisibleCanvases[0].canvas);
            this._invisibleCanvases[0].canvas.style.position = "fixed";
            this.translateCanvas(this._invisibleCanvases[0].canvas, 10000, 10000, 0);
            this._invisibleCanvases[1].canvas.width = this.canvasSize;
            this._invisibleCanvases[1].canvas.height = this.canvasSize;
            document.body.appendChild(this._invisibleCanvases[1].canvas);
            this._invisibleCanvases[1].canvas.style.position = "fixed";
            this.translateCanvas(this._invisibleCanvases[1].canvas, 10000, 10000, 0);
            resized = true;
        }
        let invisibleContext = this._invisibleCanvases[this._activeInvisibleCanvasIndex].context2D;
        invisibleContext.strokeStyle = "gray";
        invisibleContext.lineWidth = 3;
        let links = this.links(map);
        let l = links.length;
        if (l === 0) {
            return;
        }
		
		if (!map.htmlRoot.showRoads && !map.htmlRoot.showAirspaces && !map.htmlRoot.showAirways) {
			// all elements are hidden, so cleanup graphics and skip the rest of the update
			this._iterator = 0;
			this._visibleCanvas.context2D.clearRect(0, 0, this.canvasSize, this.canvasSize);
            invisibleContext.clearRect(0, 0, this.canvasSize, this.canvasSize);
			this._deprecatePoints = true;
			this._deprecatePointsIterator = 0;
			return;
		}
		
        this.onLatLongChanged(map, this._lastCoords);
        let diffLastLat = Math.abs(this._lastCoords.lat - map.centerCoordinates.lat);
        let diffLastLong = Math.abs(this._lastCoords.long - map.centerCoordinates.long);
		
        if (this._lastRange !== map.NMWidth || resized) {
			// map was resized or map range (zoom level) was changed
            this._iterator = 0;
            this._lastRange = map.NMWidth;
            this._visibleCanvas.context2D.clearRect(0, 0, this.canvasSize, this.canvasSize);
            invisibleContext.clearRect(0, 0, this.canvasSize, this.canvasSize);
            this._deprecatePoints = true;
            this._hasNewRoads = false;
            this._deprecatePointsIterator = 0;
            this._forcedCoords.lat = map.centerCoordinates.lat;
            this._forcedCoords.long = map.centerCoordinates.long;
            this._forcedDirection = map.rotation;
            this._lastCoords.lat = map.centerCoordinates.lat;
            this._lastCoords.long = map.centerCoordinates.long;
            return;
        }
        if (this._iterator >= l) {
			// finished drawing to back buffer
            if (this._iterator !== Infinity) {
				// screen needs to be updated from back buffer
                let visibleContext = this._visibleCanvas.context2D;
                visibleContext.clearRect(0, 0, this.canvasSize, this.canvasSize);
                visibleContext.drawImage(this._invisibleCanvases[this._activeInvisibleCanvasIndex].canvas, 0, 0, this.canvasSize, this.canvasSize);
                this._lastCoords.lat = this._forcedCoords.lat;
                this._lastCoords.long = this._forcedCoords.long;
                this._forcedDirection = map.rotation;
                this.onLatLongChanged(map, this._lastCoords);
            }
            if (visibilityChanged || this._hasNewRoads || diffLastLat > thresholdLat || diffLastLong > thresholdLong || Math.abs(this._forcedDirection - map.rotation) > 2) {
                // back buffer needs to be updated
				this._iterator = 0;
                this._activeInvisibleCanvasIndex = (this._activeInvisibleCanvasIndex + 1) % 2;
                invisibleContext = this._invisibleCanvases[this._activeInvisibleCanvasIndex].context2D;
                invisibleContext.clearRect(0, 0, this.canvasSize, this.canvasSize);
                this._forcedCoords.lat = map.centerCoordinates.lat;
                this._forcedCoords.long = map.centerCoordinates.long;
                this._deprecatePoints = true;
                this._hasNewRoads = false;
                this._deprecatePointsIterator = 0;
            }
            else {
                this._iterator = Infinity;
                this.onLatLongChanged(map, this._lastCoords);
            }
            return;
        }
        if (this._deprecatePoints) {
            let nodes = this.nodes(map);
            let l = nodes.length;
            let t0 = performance.now();
            while ((performance.now() - t0) < SvgRoadNetworkElement.MAX_STALL_NODE_DEPRECATION && this._deprecatePointsIterator < l) {
                nodes.get(this._deprecatePointsIterator).isPointUpToDate = false;
                this._deprecatePointsIterator++;
            }
            if (this._deprecatePointsIterator >= l) {
                this._deprecatePoints = false;
            }
            this.onLatLongChanged(map, this._lastCoords);
            return;
        }
        let t0 = performance.now();
        let lastLinkType = NaN;
        invisibleContext.beginPath();
        while ((performance.now() - t0) < SvgRoadNetworkElement.MAX_STALL_DRAW_ROADS && this._iterator < l) {
            let link = links.get(this._iterator++);
            if (link) {
				
				if ((link.type == 0 && !showRoadsHighway) ||
					(link.type == 2 && !showRoadsTrunk) ||
					(link.type == 4 && !showRoadsPrimary) ||
					(link.type == 101 && !showAirways) ||
					(link.type > 102 && !showAirspaces)) {
					continue;
				}
				
                if (lastLinkType !== link.type) {
                    if (link.type === 0) {
                        invisibleContext.stroke();
                        invisibleContext.strokeStyle = map.config.roadMotorWayColor;
                        invisibleContext.beginPath();
                        invisibleContext.lineWidth = map.config.roadMotorWayWidth;
                        lastLinkType = link.type;
                    }
                    else if (link.type === 2) {
                        invisibleContext.stroke();
                        invisibleContext.strokeStyle = map.config.roadTrunkColor;
                        invisibleContext.beginPath();
                        invisibleContext.lineWidth = map.config.roadTrunkWidth;
                        lastLinkType = link.type;
                    }
                    else if (link.type === 4) {
                        invisibleContext.stroke();
                        invisibleContext.strokeStyle = map.config.roadPrimaryColor;
                        invisibleContext.beginPath();
                        invisibleContext.lineWidth = map.config.roadPrimaryWidth;
                        lastLinkType = link.type;
                    }
                    else if (link.type >= 100) {
                        let t = link.type - 100;
                        if (t === 1) {
                            invisibleContext.stroke();
                            invisibleContext.strokeStyle = "red";
                            invisibleContext.beginPath();
                            invisibleContext.lineWidth = 1;
                            lastLinkType = link.type;
                        }
                        else if (t === 3) {
                            invisibleContext.lineWidth = 1;
                            invisibleContext.stroke();
                            invisibleContext.strokeStyle = "#0b80fa";
                            invisibleContext.beginPath();
                            lastLinkType = link.type;
                        }
                        else if (t === 4) {
                            invisibleContext.lineWidth = 1;
                            invisibleContext.stroke();
                            invisibleContext.strokeStyle = "#bb09c5";
                            invisibleContext.beginPath();
                            lastLinkType = link.type;
                        }
                        else if (t === 5) {
                            invisibleContext.lineWidth = 1;
                            invisibleContext.stroke();
                            invisibleContext.strokeStyle = "#a0bcee";
                            invisibleContext.beginPath();
                            lastLinkType = link.type;
                        }
                        else if (t === 15) {
                            invisibleContext.lineWidth = 2;
                            invisibleContext.stroke();
                            invisibleContext.strokeStyle = "#0b80fa";
                            invisibleContext.beginPath();
                            lastLinkType = link.type;
                        }
                        else if (t === 16) {
                            invisibleContext.lineWidth = 2;
                            invisibleContext.stroke();
                            invisibleContext.strokeStyle = "#580982";
                            invisibleContext.beginPath();
                            lastLinkType = link.type;
                        }
                        else {
                            invisibleContext.lineWidth = 2;
                            invisibleContext.stroke();
                            invisibleContext.strokeStyle = "#f99509";
                            invisibleContext.beginPath();
                            lastLinkType = link.type;
                        }
                    }
                    else {
                        invisibleContext.stroke();
                        invisibleContext.strokeStyle = "magenta";
                        invisibleContext.beginPath();
                        invisibleContext.lineWidth = 2;
                        lastLinkType = link.type;
                    }
                }
				
                let n1 = link.start;
                let n2 = link.end;
                if (!n1.isPointUpToDate) {
                    map.latLongToXYToRefForceCenter(n1.lat, n1.long, n1, this._forcedCoords);
                    n1.isInFrame = map.isVec2InFrame(n1, 1.4);
                    n1.x *= this.displayedSize / this.svgMapSize;
                    n1.x += this.canvasOffset;
                    n1.y *= this.displayedSize / this.svgMapSize;
                    n1.y += this.canvasOffset;
                    n1.isPointUpToDate = true;
                }
                if (!n2.isPointUpToDate) {
                    map.latLongToXYToRefForceCenter(n2.lat, n2.long, n2, this._forcedCoords);
                    n2.isInFrame = map.isVec2InFrame(n2, 1.4);
                    n2.x *= this.displayedSize / this.svgMapSize;
                    n2.x += this.canvasOffset;
                    n2.y *= this.displayedSize / this.svgMapSize;
                    n2.y += this.canvasOffset;
                    n2.isPointUpToDate = true;
                }
                if (n1 && n2) {
                    if (n1.isInFrame || n2.isInFrame) {
                        invisibleContext.moveTo(n1.x, n1.y);
                        invisibleContext.lineTo(n2.x, n2.y);
                    }
                }
            }
        }
        invisibleContext.stroke();
        this.onLatLongChanged(map, this._lastCoords);
    }
    
    onLatLongChanged(_map, _coords) {
        let p = _map.coordinatesToXY(_coords);
        p.x -= this.svgMapSize * 0.5;
        p.y -= this.svgMapSize * 0.5;
        p.x *= this.displayedSize / this.svgMapSize;
        p.y *= this.displayedSize / this.svgMapSize;
        let top = p.y;
        let left = p.x;
        if (this.parentHeight < this.canvasSize) {
            top = (this.parentHeight - this.canvasSize) * 0.5 + p.y;
        }
        if (this.parentWidth < this.canvasSize) {
            left = (this.parentWidth - this.canvasSize) * 0.5 + p.x;
        }
        let deltaRotation = 0;
        if (_map.orientation != "north") {
            deltaRotation = _map.rotation - this._forcedDirection;
        }
        this.translateCanvas(this._visibleCanvas.canvas, left, top, deltaRotation);
    }
	
	translateCanvas(_canvas, _x, _y, _rotation) {
        _canvas.style.transform = "translate(" + _x + "px, " + _y + "px) rotate(" + _rotation + "deg)";
    }
}