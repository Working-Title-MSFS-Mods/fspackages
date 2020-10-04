class SvgAirplaneElementEnhanced extends SvgAirplaneElement {
    constructor() {
        super();
    }
	
    updateDraw(map) {
        let track = map.planeDirection;
        if (this._forcePosAndRot) {
            let rotation = "rotate(" + fastToFixed(this._forcedRot, 1) + " " + fastToFixed((map.config.airplaneIconSize * 0.5), 1) + " " + fastToFixed((map.config.airplaneIconSize * 0.5), 1) + ")";
            this.svgElement.children[0].setAttribute("transform", rotation);
        }
        else if (map.orientation != "hdg") {
            if (this._lastTrack !== track && isFinite(track)) {
                if (this.svgElement.children[0]) {
                    this._lastTrack = track;
                    let rotation = "rotate(" + fastToFixed(track + map.rotation, 1) + " " + fastToFixed((map.config.airplaneIconSize * 0.5), 1) + " " + fastToFixed((map.config.airplaneIconSize * 0.5), 1) + ")";
                    this.svgElement.children[0].setAttribute("transform", rotation);
                }
            }
        }
        else {
            this._lastTrack = NaN;
            this.svgElement.children[0].removeAttribute("transform");
        }
        if (this._forcePosAndRot) {
            this.svgElement.setAttribute("x", fastToFixed(500 + this._forcedPos.x - map.config.airplaneIconSize * 0.5, 1));
            this.svgElement.setAttribute("y", fastToFixed(500 + this._forcedPos.y - map.config.airplaneIconSize * 0.5, 1));
        }
        else {
            if (this._forceCoordinates) {
                map.coordinatesToXYToRef(this._forcedCoordinates, this._pos);
                this._forceCoordinates = false;
            }
            else {
                map.coordinatesToXYToRef(map.planeCoordinates, this._pos);
            }
            if (isFinite(this._pos.x) && isFinite(this._pos.y)) {
                this.svgElement.setAttribute("x", fastToFixed((this._pos.x - map.config.airplaneIconSize * 0.5), 1));
                this.svgElement.setAttribute("y", fastToFixed((this._pos.y - map.config.airplaneIconSize * 0.5), 1));
            }
        }
    }
}

class NPCAirplaneManagerEnhanced {
    constructor() {
        this.npcAirplanes = [];
        this.useTCAS = false;
        this._timer = Infinity;
    }
    update() {
        this._timer++;
        if (this._timer >= 60) {
            this._timer = 0;
            Coherent.call("GET_AIR_TRAFFIC").then((obj) => {
                for (let i = 0; i < this.npcAirplanes.length; i++) {
                    let npcAirplane = this.npcAirplanes[i];
                    npcAirplane.alive = 0;
                }
                for (let i = 0; i < obj.length; i++) {
                    let data = obj[i];
                    let npcAirplane = this.npcAirplanes.find(p => { return p.name === data.uId.toFixed(0); });
                    if (!npcAirplane) {
                        npcAirplane = new SvgNPCAirplaneElementEnhanced(data.uId.toFixed(0));
                        npcAirplane.useTCAS = this.useTCAS;
                        this.npcAirplanes.push(npcAirplane);
                    }
                    npcAirplane.alive = 3;
                    npcAirplane.targetLat = obj[i].lat;
                    npcAirplane.targetLon = obj[i].lon;
                    npcAirplane.targetAlt = obj[i].alt;
                    npcAirplane.targetHeading = obj[i].heading;
                    if (isFinite(npcAirplane.lat) && isFinite(npcAirplane.lon) && isFinite(npcAirplane.alt)) {
                        npcAirplane.deltaLat = (npcAirplane.targetLat - npcAirplane.lat) / 60;
                        npcAirplane.deltaLon = (npcAirplane.targetLon - npcAirplane.lon) / 60;
                        npcAirplane.deltaAlt = (npcAirplane.targetAlt - npcAirplane.alt) / 60;
                        npcAirplane.targetHeading = Math.atan(npcAirplane.deltaLon / npcAirplane.deltaLat / Math.cos(npcAirplane.targetLat * Avionics.Utils.DEG2RAD)) * Avionics.Utils.RAD2DEG;
                        if (npcAirplane.deltaLat < 0) {
                            npcAirplane.targetHeading += 180;
                        }
                    }
                }
            });
        }
        for (let i = 0; i < this.npcAirplanes.length; i++) {
            let npcAirplane = this.npcAirplanes[i];
            npcAirplane.alive -= 1 / 60;
            if (npcAirplane.alive < 0) {
                this.npcAirplanes.splice(i, 1);
                i--;
            }
            else {
                if (isFinite(npcAirplane.lat) && isFinite(npcAirplane.lon) && isFinite(npcAirplane.heading)) {
                    npcAirplane.lat += npcAirplane.deltaLat;
                    npcAirplane.lon += npcAirplane.deltaLon;
                    npcAirplane.alt += npcAirplane.deltaAlt;
                    let deltaHeading = Avionics.Utils.angleDiff(npcAirplane.heading, npcAirplane.targetHeading);
                    if (deltaHeading > 60) {
                        npcAirplane.heading = npcAirplane.targetHeading;
                    }
                    else {
                        npcAirplane.heading = Avionics.Utils.lerpAngle(npcAirplane.heading, npcAirplane.targetHeading, 1 / 60);
                    }
                }
                else {
                    npcAirplane.lat = npcAirplane.targetLat;
                    npcAirplane.lon = npcAirplane.targetLon;
                    npcAirplane.alt = npcAirplane.targetAlt;
                    npcAirplane.heading = npcAirplane.targetHeading;
                }
            }
        }
    }
}

class SvgNPCAirplaneElementEnhanced extends SvgNPCAirplaneElement {
    constructor(name = "") {
        super(name);
    }
    
    updateDraw(map) {
        if (this._delay > 0) {
            this._delay--;
            this.svgElement.setAttribute("x", "-1000");
            this.svgElement.setAttribute("y", "-1000");
            return;
        }
        if (!this.useTCAS) {
            if (this._lastHeading !== this.heading && isFinite(this.heading)) {
                if (this.svgElement.children[0]) {
                    this._lastHeading = this.heading;
                    let angle = this.heading;
                    if (map.orientation != "north") {
                        angle += map.rotation;
                    }
                    let rotation = "rotate(" + fastToFixed(angle, 1) + " " + fastToFixed((map.config.airplaneIconSize * 0.7 * 0.5), 1) + " " + fastToFixed((map.config.airplaneIconSize * 0.7 * 0.5), 1) + ")";
                    this.svgElement.children[0].setAttribute("transform", rotation);
                }
            }
        }
        map.coordinatesToXYToRef(new LatLong(this.lat, this.lon), this._pos);
        if (isFinite(this._pos.x) && isFinite(this._pos.y)) {
            this.svgElement.setAttribute("x", fastToFixed((this._pos.x - map.config.airplaneIconSize * 0.7 * 0.5), 1));
            this.svgElement.setAttribute("y", fastToFixed((this._pos.y - map.config.airplaneIconSize * 0.7 * 0.5), 1));
        }
        if (this.useTCAS) {
            let altitudeAGL = map.planeAltitude;
            let deltaAltitude = Math.abs(altitudeAGL - this.alt);
            let distanceHorizontal = Avionics.Utils.computeDistance(new LatLong(this.lat, this.lon), map.planeCoordinates);
            if (distanceHorizontal < 2 && altitudeAGL > 1000 && deltaAltitude < 800) {
                if (this._lastCase !== 0) {
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_RA_A320.svg");
                    this.svgElement.setAttribute("visibility", "visible");
                    this._lastCase = 0;
                }
            }
            else if (distanceHorizontal < 4 && altitudeAGL > 500 && deltaAltitude < 1000) {
                if (this._lastCase !== 1) {
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_TA_A320.svg");
                    this.svgElement.setAttribute("visibility", "visible");
                    this._lastCase = 1;
                }
            }
            else if (distanceHorizontal < 6 && deltaAltitude < 1200) {
                if (this._lastCase !== 2) {
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_PROX_A320.svg");
                    this.svgElement.setAttribute("visibility", "visible");
                    this._lastCase = 2;
                }
            }
            else if (distanceHorizontal < 30 && deltaAltitude < 2700) {
                if (this._lastCase !== 3) {
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_OTHER_A320.svg");
                    this.svgElement.setAttribute("visibility", "visible");
                    this._lastCase = 3;
                }
            }
            else {
                if (this._lastCase !== 4) {
                    this.svgElement.setAttribute("visibility", "hidden");
                    this._lastCase = 4;
                }
            }
        }
    }
}