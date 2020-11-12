class SvgWaypointElement extends SvgMapElement {
    constructor(source) {
        super();
        this.hasTextBox = true;
        this.textOffsetRatio = 0.25;
        this.showText = true;
        this.minimize = false;
        this._alpha = NaN;
        this._textWidth = NaN;
        this._textHeight = NaN;
        this.needRepaint = false;
        this._lastX = 0;
        this._lastY = 0;
        this._lastMinimize = false;
        this._lastIsActiveWaypoint = false;
        this.source = source;

        this._label = new SvgWaypointTextElement(this);
    }

    appendToMap(map) {
        super.appendToMap(map);
        this.needRepaint = true;
    }

    get ident() {
        if (this._ident) {
            return this._ident;
        }
        if (this.source) {
            return this.source.ident;
        }
    }
    set ident(v) {
        this._ident = v;
    }
    get icao() {
        if (this._icao) {
            return this._icao;
        }
        if (this.source) {
            return this.source.icao;
        }
    }
    set icao(v) {
        this._icao = v;
    }
    get coordinates() {
        if (this._coordinates) {
            return this._coordinates;
        }
        if (this.source && this.source.coordinates) {
            return this.source.coordinates;
        }
    }
    set coordinates(v) {
        this._coordinates = v;
    }
    get bearing() {
        if (this._bearing) {
            return this._bearing;
        }
        if (this.source) {
            return this.source.bearing;
        }
    }
    set bearing(v) {
        this._bearing = v;
    }
    get distance() {
        if (this._distance) {
            return this._distance;
        }
        if (this.source) {
            return this.source.distance;
        }
    }
    set distance(v) {
        this._distance = v;
    }
    imageFileName() {
        if (this.source) {
            return this.source.imageFileName();
        }
    }

    isActiveWaypoint() {
        return this.source.ident === FlightPlanManager.DEBUG_INSTANCE.getActiveWaypointIdent();
    }

    getIconSize(map) {
        return map.config.waypointIconSize;
    }

    getLabelFontSize(map) {
        return map.config.waypointLabelFontSize;
    }

    getLabelElement() {
        return this._label;
    }

    getLabelPriority() {
        return 0;
    }

    createDraw(map) {
        let isActiveWaypoint = this.isActiveWaypoint();

        this._image = document.createElementNS(Avionics.SVG.NS, "image");
        this._image.id = this.id(map);
        this._image.classList.add(this.class() + "-icon");
        this._image.setAttribute("hasTextBox", "true");
        this._image.setAttribute("width", "100%");
        this._image.setAttribute("height", "100%");
        if (!isActiveWaypoint) {
            this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + this.imageFileName());
        }
        else {
            this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_INTERSECTION_ACTIVE.png");
        }
        this._lastIsActiveWaypoint = isActiveWaypoint;
        let iconSize = this.getIconSize(map);
        this._image.setAttribute("width", fastToFixed(iconSize, 0));
        this._image.setAttribute("height", fastToFixed(iconSize, 0));
        return this._image;
    }

    updateDraw(map) {
        if (this.coordinates) {
            map.coordinatesToXYToRef(this.coordinates, this);
        }
        else if (isFinite(this.source.latitudeFP) && isFinite(this.source.longitudeFP)) {
            map.coordinatesToXYToRef(new LatLongAlt(this.source.latitudeFP, this.source.longitudeFP), this);
        }
        else {
            let pos = map.bearingDistanceToXY(this.bearing, this.distance);
            this.x = pos.x;
            this.y = pos.y;
        }
        let isActiveWaypoint = this.isActiveWaypoint();
        if (isActiveWaypoint != this._lastIsActiveWaypoint) {
            if (this._image) {
                if (!isActiveWaypoint) {
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + this.imageFileName());
                }
                else {
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_INTERSECTION_ACTIVE.png");
                }
            }
            this._lastIsActiveWaypoint = isActiveWaypoint;
        }
        if (isFinite(this.x) && isFinite(this.y)) {
            let iconSize = this.getIconSize(map);
            if (this._image && this._lastMinimize !== this.minimize) {
                if (this.minimize) {
                    this._image.setAttribute("width", fastToFixed(iconSize * 0.5, 0));
                    this._image.setAttribute("height", fastToFixed(iconSize * 0.5, 0));
                }
                else {
                    this._image.setAttribute("width", fastToFixed(iconSize, 0));
                    this._image.setAttribute("height", fastToFixed(iconSize, 0));
                }
                this._lastMinimize = this.minimize;
                this.needRepaint = true;
            }
            if (this.needRepaint || Math.abs(this._lastX - this.x) > 0.1 || Math.abs(this._lastY - this.y) > 0.1) {
                this._lastX = this.x;
                this._lastY = this.y;
                iconSize *= (this.minimize ? 0.5 : 1);
                let x = (this.x - iconSize * 0.5);
                let y = (this.y - iconSize * 0.5);
                this.svgElement.setAttribute("x", x + "");
                this.svgElement.setAttribute("y", y + "");
                if (this.source instanceof AirportInfo) {
                    let a = this.source.longestRunwayDirection;
                    if (isNaN(a) && this.source.runways[0]) {
                        a = this.source.runways[0].direction;
                    }
                    if (isFinite(a)) {
                        this._alpha = a - 45;
                    }
                }
                if (isFinite(this._alpha)) {
                    this.svgElement.setAttribute("transform", "rotate(" + this._alpha.toFixed(0) + " " + this.x.toFixed(0) + " " + this.y.toFixed(0) + ")");
                }
            }
        }
    }
}

class SvgWaypointTextElement {
    constructor(waypointElement) {
        this.waypointElement = waypointElement;
        this._label;
        this.textOffsetRatio = 0.25;
        this._alpha = NaN;
        this._textWidth = NaN;
        this._textHeight = NaN;
        this._needRepaint = false;
        this._lastX = 0;
        this._lastY = 0;
        this._lastIsActiveWaypoint = false;
    }

    id(map) {
        return this.waypointElement.id(map) + "-text-" + map.index;
    }

    getLabel() {
        return this._label;
    }

    getLabelPriority() {
        return this.waypointElement.getLabelPriority();
    }

    getLabelRect() {
        return {
            top: parseFloat(this._label.getAttribute("y")),
            left: parseFloat(this._label.getAttribute("x")),
            bottom: parseFloat(this._label.getAttribute("y")) + this._textHeight / 0.675,
            right: parseFloat(this._label.getAttribute("x")) + this._textWidth
        };
    }

    updateDraw(map) {
        if (!this._label) {
            this.createLabel(map);
        }

        let isActiveWaypoint = this.waypointElement.isActiveWaypoint();
        if (isActiveWaypoint != this._lastIsActiveWaypoint) {
            this._refreshLabel(map, isActiveWaypoint);
            this._lastIsActiveWaypoint = isActiveWaypoint;
        }

        if (isFinite(this.waypointElement.x) && isFinite(this.waypointElement.y)) {
            if (this._needRepaint || Math.abs(this._lastX - this.waypointElement.x) > 0.1 || Math.abs(this._lastY - this.waypointElement.y) > 0.1) {
                this._lastX = this.waypointElement.x;
                this._lastY = this.waypointElement.y;
                let iconSize = this.waypointElement.getIconSize(map) * (this.waypointElement.minimize ? 0.5 : 1);
                let x = (this.waypointElement.x - iconSize * 0.5);
                let y = (this.waypointElement.y - iconSize * 0.5);

                if (this._label) {
                    let textX = (x + iconSize * 0.5 - this._textWidth * 0.5 + map.config.waypointLabelDistanceX);
                    let textY = y - map.config.waypointLabelDistance;
                    this._label.setAttribute("x", textX);
                    this._label.setAttribute("y", textY);
                    this._needRepaint = false;
                } else {
                    this._needRepaint = true;
                }
            }
        }
    }

    createLabel(map) {
        let fontSize = this.waypointElement.getLabelFontSize(map);
        let text = this.waypointElement.ident;
        let c = document.createElement("canvas");
        let ctx = c.getContext("2d", {alpha: false});
        ctx.font = fontSize + "px " + map.config.waypointLabelFontFamily;
        this._textWidth = ctx.measureText(text).width;
        this._textHeight = fontSize * 0.675;
        let ident;
        let activeWaypoint = FlightPlanManager.DEBUG_INSTANCE.getActiveWaypoint(false, true);
        if (activeWaypoint) {
            ident = activeWaypoint.ident;
        }
        let isActiveWaypoint = this.waypointElement.source.ident === ident;
        this._refreshLabel(map, isActiveWaypoint);
    }

    _refreshLabel(map, isActiveWaypoint) {
        let labelId = this.id(map);
        let label = document.getElementById(labelId);
        if (label instanceof SVGForeignObjectElement) {
            this._label = label;
            this._needRepaint = true;
        }
        let fontSize = this.waypointElement.getLabelFontSize(map);
        let text = this.waypointElement.ident;
        let canvas;
        if (!this._label) {
            this._label = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
            this._label.id = labelId;
            this._label.setAttribute("width", (this._textWidth + map.config.waypointLabelBackgroundPaddingLeft + map.config.waypointLabelBackgroundPaddingRight).toFixed(0) + "px");
            this._label.setAttribute("height", (this._textHeight + map.config.waypointLabelBackgroundPaddingTop + map.config.waypointLabelBackgroundPaddingBottom).toFixed(0) + "px");
            canvas = document.createElement("canvas");
            canvas.setAttribute("class", "labelCanvas");
            canvas.setAttribute("width", (this._textWidth + map.config.waypointLabelBackgroundPaddingLeft + map.config.waypointLabelBackgroundPaddingRight).toFixed(0) + "px");
            canvas.setAttribute("height", (this._textHeight + map.config.waypointLabelBackgroundPaddingTop + map.config.waypointLabelBackgroundPaddingBottom).toFixed(0) + "px");
            this._label.appendChild(canvas);
        } else {
            canvas = this._label.getElementsByClassName("labelCanvas")[0];
        }
        if (!canvas) {
            return;
        }

        let context = canvas.getContext("2d");
        if (map.config.waypointLabelUseBackground) {
            context.fillStyle = "black";
            context.fillRect(0, 0, this._textWidth + map.config.waypointLabelBackgroundPaddingLeft + map.config.waypointLabelBackgroundPaddingRight, this._textHeight + map.config.waypointLabelBackgroundPaddingTop + map.config.waypointLabelBackgroundPaddingBottom);
        }
        if (!isActiveWaypoint) {
            if (this.source instanceof IntersectionInfo) {
                context.fillStyle = map.config.intersectionLabelColor;
            }
            else if (this.source instanceof VORInfo) {
                context.fillStyle = map.config.vorLabelColor;
            }
            else if (this.source instanceof NDBInfo) {
                context.fillStyle = map.config.ndbLabelColor;
            }
            else if (this.source instanceof AirportInfo) {
                context.fillStyle = map.config.airportLabelColor;
            }
            else {
                context.fillStyle = map.config.waypointLabelColor;
            }
        }
        else {
            context.fillStyle = "white";
        }
        context.font = fontSize + "px " + map.config.waypointLabelFontFamily;
        context.strokeStyle = map.config.waypointLabelStrokeColor;
        context.lineWidth = map.config.waypointLabelStrokeWidth * 2;
        context.strokeText(text, map.config.waypointLabelBackgroundPaddingLeft, this._textHeight + map.config.waypointLabelBackgroundPaddingTop);
        context.fillText(text, map.config.waypointLabelBackgroundPaddingLeft, this._textHeight + map.config.waypointLabelBackgroundPaddingTop);
    }
}
//# sourceMappingURL=SvgWaypointElement.js.map