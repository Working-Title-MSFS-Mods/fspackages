var CitySize;
(function (CitySize) {
    CitySize[CitySize["Large"] = 0] = "Large";
    CitySize[CitySize["Medium"] = 1] = "Medium";
    CitySize[CitySize["Small"] = 2] = "Small";
})(CitySize || (CitySize = {}));
class SvgCityElement {
    constructor(_city) {
        this.city = _city;
        this._lastX = 0;
        this._lastY = 0;
        this.idRoot = "city-" + this.name.toLowerCase().replace(/[^a-z]/g, "") + "-" + (this.lat + "-" + this.long).replace(/\./g, "_");
        this._labelFontSize = 0;

        this.shouldDraw = false;
        this.isDrawn = false;
        this.lastDrawnTime = -1;
    }

    id(map) {
        return this.idRoot + "-text-map-" + map.index;
    }

    get name() {
        return this.city.name;
    }

    get size() {
        return this.city.size;
    }

    get lat() {
        return this.city.lat;
    }

    get long() {
        return this.city.long;
    }

    getLabel() {
        return this._label;
    }

    getLabelPriority() {
        return 100 + this.size;
    }

    getLabelRect() {
        return {
            top: parseFloat(this._label.getAttribute("y")) - this._labelFontSize,
            left: parseFloat(this._label.getAttribute("x")) - this._labelFontSize * this.name.length * 0.3,
            bottom: parseFloat(this._label.getAttribute("y")),
            right: parseFloat(this._label.getAttribute("x")) + this._labelFontSize * this.name.length * 0.3
        };
    }

    updateDraw(map) {
        if (!this._label) {
            this.createLabel(map);
        }
        map.latLongToXYToRef(this.lat, this.long, this);
        if (isFinite(this.x) && isFinite(this.y)) {
            this._label.setAttribute("x", this.x);
            this._label.setAttribute("y", this.y - map.config.cityIconSize[this.size] * 0.25 - map.config.cityLabelDistance);

            this._lastX = this.x;
            this._lastY = this.y;
        }
    }

    createLabel(map) {
        this._labelFontSize = map.config.cityLabelFontSize;

        this._label = document.createElementNS(Avionics.SVG.NS, "text");
        this._label.id = this.id(map);
        this._label.textContentCached = this.name;
        this._label.setAttribute("text-anchor", "middle");
        this._label.setAttribute("fill", map.config.cityLabelColor);
        this._label.setAttribute("stroke", map.config.cityLabelStrokeColor);
        this._label.setAttribute("stroke-width", map.config.cityLabelStrokeWidth);
        this._label.setAttribute("font-size", map.config.cityLabelFontSize);
        this._label.setAttribute("font-family", map.config.cityLabelFontFamily);
    }
}

class SvgCityElementCanvas extends SvgMapElement {
    constructor() {
        super();

        this.cityElements = new Map();
        this.toProcessBuffer = [];
        this.toProcessHead = 0;
        this.toDrawHead = 0;

        this.lastNMWidth = 0;
        this.zoomChanged = false;

        this.elementCleanUpTime = SvgCityElementCanvas.ELEMENT_CLEAN_UP_TIME_DEFAULT;

        this.preprocess = {
            limit: SvgCityElementCanvas.PREPROCESS_LIMIT_DEFAULT,
            done: true,
            citiesChanged: false
        };
        this.redraw = {
            limit: SvgCityElementCanvas.DRAW_LIMIT_DEFAULT,
            started: false,
            done: true,
            referenceCoord: {lat: 0, long: 0},
            referenceRotation: 0
        };

        this.counter = 0;
    }

    id(map) {
        return "city-canvas" + "-map-" + map.index;
    }

    appendToMap(map) {
        map.appendChild(this.svgElement, map.cityLayer);
    }

    addCity(city) {
        if (!this.cityElements.has(city)) {
            this.cityElements.set(city, new SvgCityElement(city));
        }
        return this.cityElements.get(city);
    }

    hasCity(city) {
        return this.cityElements.has(city);
    }

    createDraw(map) {
        let container = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
        this.canvas = document.createElement("canvas");
        this.canvasContext = this.canvas.getContext("2d");
        this.canvasContext.imageSmoothingEnabled = false;
        this.canvas.setAttribute("width", map.htmlRoot.overdrawFactor * 1000);
        this.canvas.setAttribute("height", map.htmlRoot.overdrawFactor * 1000);
        container.appendChild(this.canvas);

        this.backBuffer = document.createElement("canvas");
        this.backBufferContext = this.backBuffer.getContext("2d");
        this.backBuffer.setAttribute("width", map.htmlRoot.overdrawFactor * 1000);
        this.backBuffer.setAttribute("height", map.htmlRoot.overdrawFactor * 1000);

        this.backBufferContext.fillStyle = map.config.cityIconFillColor;
        this.backBufferContext.strokeStyle = map.config.cityIconStrokeColor;
        this.backBufferContext.lineWidth = map.config.cityIconStrokeWidth;

        container.setAttribute("x", -(map.htmlRoot.overdrawFactor - 1) * 500);
        container.setAttribute("y", -(map.htmlRoot.overdrawFactor - 1) * 500);
        container.setAttribute("width", map.htmlRoot.overdrawFactor * 1000);
        container.setAttribute("height", map.htmlRoot.overdrawFactor * 1000);

        return container;
    }

    updateDraw(map) {
        if (map.NMWidth != this.lastNMWidth) {
            // map zoom changed - abort any preprocess or redraw operations and immediately recalculate
            this.preprocess.done = true;
            this.zoomChanged = true;
            this.redraw.done = true;
            this.lastNMWidth = map.NMWidth;
        }
        if (!this.redraw.done) {
            this.redrawCanvas(map);
            return;
        }

        this.preprocessCities(map);
        if (!this.preprocess.done) {
            return;
        }

        let needRedraw = this.preprocess.citiesChanged || this.zoomChanged;

        if (needRedraw) {
            this.redraw.done = false;
            this.zoomChanged = false;
        } else {
            this.updateCanvas(map);
        }
    }

    populateToProcess() {
        this.toProcessBuffer = Array.from(this.cityElements.values());
        this.toProcessHead = 0;
        this.toDrawHead = 0;
    }

    dequeueToProcess() {
        if (this.toProcessHead >= this.toProcessBuffer.length) {
            return null;
        }
        let toReturn = this.toProcessBuffer[this.toProcessHead++];

        return toReturn;
    }

    dequeueToDraw() {
        if (this.toDrawHead >= this.toProcessBuffer.length) {
            return null;
        }
        let toReturn = this.toProcessBuffer[this.toDrawHead++];

        return toReturn;
    }

    preprocessCities(map) {
        if (this.preprocess.done) {
            this.populateToProcess();
            this.preprocess.done = false;
            this.preprocess.citiesChanged = false;
        }

        let currentTime = Date.now() / 1000;

        let processedCount = 0;
        let cityElement = this.dequeueToProcess();
        while (cityElement != null) {
            let shouldDraw = false;
            let isInBounds = map.isLatLongInFrame(cityElement.city, map.htmlRoot.overdrawFactor - 1);
            if (isInBounds) {
                shouldDraw = map.htmlRoot.showCities && map.htmlRoot.getDeclutteredRange() <= map.htmlRoot.cityMaxRanges[cityElement.size];
                this.preprocess.citiesChanged = this.preprocess.citiesChanged || (shouldDraw != cityElement.isDrawn);
            }

            cityElement.shouldDraw = shouldDraw;
            if (!shouldDraw && currentTime - cityElement.lastDrawnTime >= this.elementCleanUpTime) {
                this.cityElements.delete(cityElement.city);
            }

            if (++processedCount > this.preprocess.limit) {
                return;
            }
            cityElement = this.dequeueToProcess();
        }

        this.preprocess.done = true;
    }

    redrawCanvas(map) {
        let currentTime = Date.now() / 1000;
        let offset = (map.htmlRoot.overdrawFactor - 1) * 500;

        if (!this.redraw.started) {
            this.redraw.referenceCoord = map.centerCoordinates;
            this.redraw.referenceRotation = map.rotation;
            this.backBufferContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.redraw.started = true;
        }

        let drawCount = 0;
        let cityElement = this.dequeueToDraw();
        while (cityElement != null) {
            if (cityElement.shouldDraw) {
                let pos = map.coordinatesToXYForceCenterRotation(cityElement.city, this.redraw.referenceCoord, this.redraw.referenceRotation);
                let radius = map.config.cityIconSize[cityElement.size] / 2;
                this.backBufferContext.beginPath();
                this.backBufferContext.arc(Math.round(offset + pos.x), Math.round(offset + pos.y), radius, 0, 2 * Math.PI);
                this.backBufferContext.fill();
                this.backBufferContext.stroke();
                map.textManager.add(cityElement);
                cityElement.lastDrawnTime = currentTime;
                cityElement.isDrawn = true;
                if (++drawCount > this.redraw.limit) {
                    return;
                }
            } else {
                if (cityElement.isDrawn) {
                    map.textManager.remove(cityElement);
                }
                cityElement.isDrawn = false;
            }
            cityElement = this.dequeueToDraw();
        }

        this.updateCanvas(map);
        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvasContext.drawImage(this.backBuffer, 0, 0, this.canvas.width, this.canvas.height);
        this.redraw.done = true;
        this.redraw.started = false;
    }

    updateCanvas(map) {
        let lastCenterPos = map.coordinatesToXY(this.redraw.referenceCoord);
        let displayedSize = this.canvas.width;

        let translateX = lastCenterPos.x - 500;
        let translateY = lastCenterPos.y - 500;
        let rotation = map.rotation - this.redraw.referenceRotation;

        this.svgElement.setAttribute("transform", `translate(${translateX}, ${translateY}) rotate(${rotation} 500 500)`);
    }
}
SvgCityElementCanvas.ELEMENT_CLEAN_UP_TIME_DEFAULT = 10;
SvgCityElementCanvas.PREPROCESS_LIMIT_DEFAULT = 200;
SvgCityElementCanvas.DRAW_LIMIT_DEFAULT = 200;
//# sourceMappingURL=SvgCityElement.js.map