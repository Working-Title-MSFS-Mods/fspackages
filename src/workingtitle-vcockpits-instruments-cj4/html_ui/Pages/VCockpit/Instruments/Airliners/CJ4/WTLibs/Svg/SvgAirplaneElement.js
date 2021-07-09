class SvgAirplaneElement extends SvgMapElement {
    constructor() {
        super();
        this._scale = 1.0;
        this._iconid = 1;
        this._lastTrack = NaN;
        this._forcePosAndRot = false;
        this._forcedPos = undefined;
        this._forcedRot = 0;
        this._forceCoordinates = true;
        this._forcedCoordinates = new LatLong();
        this._pos = new Vec2();
    }
    id(map) {
        return "airplane-icon-map-" + map.index;
    }

    appendToMap(map) {
        map.appendChild(this.svgElement, map.planeLayer);
    }

    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        diffAndSetAttribute(container, "x", fastToFixed(((1000 - map.config.airplaneIconSize) * 0.5), 0));
        diffAndSetAttribute(container, "y", fastToFixed(((1000 - map.config.airplaneIconSize) * 0.5), 0));
        diffAndSetAttribute(container, "width", fastToFixed(map.config.airplaneIconSize, 0));
        diffAndSetAttribute(container, "height", fastToFixed(map.config.airplaneIconSize, 0));
        diffAndSetAttribute(container, "overflow", "visible");
        this._image = document.createElementNS(Avionics.SVG.NS, "image");
        this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", this.getIconPath(map));
        var newScale = 100 * this._scale;
        this._image.setAttribute("x", ((100 - newScale) * 0.5) + "%");
        this._image.setAttribute("y", ((100 - newScale) * 0.5) + "%");
        this._image.setAttribute("width", newScale + "%");
        this._image.setAttribute("height", newScale + "%");
        container.appendChild(this._image);
        return container;
    }
    updateDraw(map) {
        let track = map.planeDirection;
        if (this._forcePosAndRot) {
            let rotation = "rotate(" + fastToFixed(this._forcedRot, 1) + " " + fastToFixed((map.config.airplaneIconSize * 0.5), 1) + " " + fastToFixed((map.config.airplaneIconSize * 0.5), 1) + ")";
            this.svgElement.children[0].setAttribute("transform", rotation);
        }
        else if (map.htmlRoot.orientation != "hdg") { // MOD: adapt code for new hdg/trk orientations
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
    setIcon(_map, _id) {
        if (this._iconid != _id) {
            this._iconid = _id;
            if (this._image) {
                this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", this.getIconPath(_map));
            }
        }
    }
    setScale(_map, _scale) {
        if (Math.abs(this._scale - _scale) > Number.EPSILON) {
            this._scale = _scale;
            if (this._image) {
                var newScale = 100 * _scale;
                this._image.setAttribute("x", ((100 - newScale) * 0.5) + "%");
                this._image.setAttribute("y", ((100 - newScale) * 0.5) + "%");
                this._image.setAttribute("width", newScale + "%");
                this._image.setAttribute("height", newScale + "%");
            }
        }
    }
    force2DPosAndRot(_force, _pos = undefined, _rot = 0) {
        this._forcePosAndRot = _force;
        this._forcedPos = _pos;
        this._forcedRot = _rot;
    }
    forceCoordinates(_lat, _long) {
        this._forceCoordinates = true;
        this._forcedCoordinates.lat = _lat;
        this._forcedCoordinates.long = _long;
    }
    getIconPath(map) {
        let iconPath = map.config.imagesDir;
        switch (this._iconid) {
            case 2:
                iconPath += map.config.airplaneIcon2;
                break;
            case 3:
                iconPath += map.config.airplaneIcon3;
                break;
            default:
                iconPath += map.config.airplaneIcon1;
                break;
        }
        iconPath += ".svg";
        return iconPath;
    }
}
class NPCAirplaneManager {
    constructor() {
        this.npcAirplanes = [];
        this.useTCAS = true;
        this._lastGetTraffic = Date.now();
        this._lastPosUpdate = Date.now();
        this._fullUpdate = true;
    }
    update(force) {
        if (force || Date.now() - this._lastGetTraffic > 3000) {
            this._lastGetTraffic = Date.now();
            if (force) {
                this.npcAirplanes = [];
            }
            Coherent.call("GET_AIR_TRAFFIC").then((obj) => {
                for (let i = 0; i < this.npcAirplanes.length; i++) {
                    let npcAirplane = this.npcAirplanes[i];
                    npcAirplane.alive = 0;
                }

                let aboveModeStatus = SimVar.GetSimVarValue("L:WT_CJ4_TFC_ALT_ABOVE_ENABLED", "number");
                let belowModeStatus = SimVar.GetSimVarValue("L:WT_CJ4_TFC_ALT_BELOW_ENABLED", "number");
                let altitude = Simplane.getAltitude(); //map.planeAltitude;

                for (let i = 0; i < obj.length; i++) {
                    let data = obj[i];
                    // ignore faulty traffic
                    if (data.lat === 0) {
                        continue;
                    }
                    let npcAirplane = this.npcAirplanes.find(p => { return p.name === data.uId.toFixed(0); });
                    if (!npcAirplane) {
                        npcAirplane = new SvgNPCAirplaneElement(data.uId.toFixed(0));
                        npcAirplane.useTCAS = this.useTCAS;
                        this.npcAirplanes.push(npcAirplane);
                    }

                    npcAirplane.alive = 0;
                    let trafficAltFeet = obj[i].alt * 3.281;
                    let deltaAltitudeTraffic = trafficAltFeet - altitude;
                    if (Math.abs(deltaAltitudeTraffic) < 2701) {
                        npcAirplane.alive = 3;
                    } else {
                        if (aboveModeStatus === 1 && deltaAltitudeTraffic >= 0 && deltaAltitudeTraffic < 9901) {
                            npcAirplane.alive = 3;
                        } else if (belowModeStatus === 1 && deltaAltitudeTraffic <= 0 && deltaAltitudeTraffic > -9901) {
                            npcAirplane.alive = 3;
                        }
                    }

                    npcAirplane.targetLat = obj[i].lat;
                    npcAirplane.targetLon = obj[i].lon;
                    npcAirplane.targetAlt = obj[i].alt;
                    npcAirplane.targetHeading = obj[i].heading;
                    if (isFinite(npcAirplane.lat) && isFinite(npcAirplane.lon) && isFinite(npcAirplane.alt)) {
                        npcAirplane.deltaLat = (npcAirplane.targetLat - npcAirplane.lat) / 1.5;
                        npcAirplane.deltaLon = (npcAirplane.targetLon - npcAirplane.lon) / 1.5;
                        npcAirplane.deltaAlt = (npcAirplane.targetAlt - npcAirplane.alt) / 1.5;
                        npcAirplane.vs = ((npcAirplane.targetAlt - npcAirplane.alt) * 40) * 3.281; // times 20 because rate is 3 seconds and convert to feet
                        // npcAirplane.targetHeading = Math.atan(npcAirplane.deltaLon / npcAirplane.deltaLat / Math.cos(npcAirplane.targetLat * Avionics.Utils.DEG2RAD)) * Avionics.Utils.RAD2DEG;
                        // if (npcAirplane.deltaLat < 0) {
                        //     npcAirplane.targetHeading += 180;
                        // }
                    }
                }
                this._fullUpdate = true;
            });
        }
        if (Date.now() - this._lastPosUpdate > 1500) {
            this._lastPosUpdate = Date.now();
            for (let i = 0; i < this.npcAirplanes.length; i++) {
                let npcAirplane = this.npcAirplanes[i];
                npcAirplane.alive -= 1;
                if (npcAirplane.alive < 0) {
                    this.npcAirplanes.splice(i, 1);
                    i--;
                }
                else {
                    if (!this._fullUpdate && isFinite(npcAirplane.lat) && isFinite(npcAirplane.lon) && isFinite(npcAirplane.heading)) {
                        npcAirplane.lat += npcAirplane.deltaLat;
                        npcAirplane.lon += npcAirplane.deltaLon;
                        npcAirplane.alt += npcAirplane.deltaAlt;
                        // let deltaHeading = Avionics.Utils.diffAngle(npcAirplane.heading, npcAirplane.targetHeading);
                        // if (deltaHeading > 60) {
                        //     npcAirplane.heading = npcAirplane.targetHeading;
                        // }
                        // else {
                        //     npcAirplane.heading = Avionics.Utils.lerpAngle(npcAirplane.heading, npcAirplane.targetHeading, 1 / 60);
                        // }
                    }
                    else {
                        npcAirplane.lat = npcAirplane.targetLat;
                        npcAirplane.lon = npcAirplane.targetLon;
                        npcAirplane.alt = npcAirplane.targetAlt;
                        npcAirplane.heading = npcAirplane.targetHeading;
                        // npcAirplane.is
                    }
                }
            }
            this._fullUpdate = false;
        }
    }
}
class SvgNPCAirplaneElement extends SvgMapElement {
    constructor(name = "") {
        super();
        this.name = name;
        this._delay = 40;
        this.alive = 5;
        this.useTCAS = false;
        this.lat = NaN;
        this.lon = NaN;
        this.alt = NaN;
        this.deltaLat = 0;
        this.deltaLon = 0;
        this.deltaAlt = 0;
        this.targetLat = NaN;
        this.targetLon = NaN;
        this.targetAlt = NaN;
        this.heading = NaN;
        this.targetHeading = NaN;
        this._lastHeading = NaN;
        this._lastCase = NaN;
        this._size = 40;
        if (this.name === "") {
            this.name = "A" + Math.floor(Math.random() * 1000000).toFixed(0);
        }
        this._id = "npc-airplaine-" + this.name;
        this._pos = new Vec2();
        this._isCreated = false;
    }
    id(map) {
        return this._id + "-map-" + map.index;
        ;
    }
    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        diffAndSetAttribute(container, "width", fastToFixed(this._size, 0));
        diffAndSetAttribute(container, "height", fastToFixed(this._size, 0));
        diffAndSetAttribute(container, "overflow", "visible");
        let iconPath = map.config.imagesDir;
        iconPath += "ICON_MAP_TCAS_OT"; //map.config.airplaneIcon1;
        iconPath += ".svg";
        this._image = document.createElementNS(Avionics.SVG.NS, "image");
        this._image.setAttribute("width", "100%");
        this._image.setAttribute("height", "100%");
        this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", iconPath);
        container.appendChild(this._image);

        this._alt = document.createElementNS(Avionics.SVG.NS, "text");
        this._altText = document.createTextNode("");
        this._alt.setAttribute("fill", "cyan");
        this._alt.setAttribute("x", "4");
        this._alt.appendChild(this._altText);
        container.appendChild(this._alt);

        this._arrImage = document.createElementNS(Avionics.SVG.NS, "path");
        this._arrImage.setAttribute("d", "M 0 -10 L 0 10 M 0 10 L 4 5 M 0 10 L -4 5");
        this._arrImage.setAttribute("transform", "translate(35,20)");
        this._arrImage.setAttribute("stroke-width", "2");
        container.appendChild(this._arrImage);

        diffAndSetAttribute(container, "x", fastToFixed(((1000 - this._size) * 0.5), 0));
        diffAndSetAttribute(container, "y", fastToFixed(((1000 - this._size) * 0.5), 0));
        this._isCreated = true;
        return container;
    }
    updateDraw(map) {
        if (!this._isCreated) {
            return;
        }

        if (this._delay > 0) {
            this._delay--;
            this.svgElement.setAttribute("x", "-1000");
            this.svgElement.setAttribute("y", "-1000");
            return;
        }

        map.coordinatesToXYToRef(new LatLong(this.lat, this.lon), this._pos);
        if (isFinite(this._pos.x) && isFinite(this._pos.y)) {
            this.svgElement.setAttribute("x", fastToFixed((this._pos.x - this._size * 0.5), 1));
            this.svgElement.setAttribute("y", fastToFixed((this._pos.y - this._size * 0.5), 1));
        }
        if (this.useTCAS) {
            // own ship alt is in feet
            // other aircraft alt is in meter
            let altitude = Simplane.getAltitude(); //map.planeAltitude;
            let altitudeAGL = map.planeAltitude;
            let groundAlt = altitude - altitudeAGL;
            let trafficAltFeet = this.alt * 3.281;
            let deltaAltitudeTraffic = trafficAltFeet - altitude;
            let distanceHorizontalTraffic = Avionics.Utils.computeDistance(new LatLong(this.lat, this.lon), map.planeCoordinates);

            // alt text
            if (SimVar.GetSimVarValue("L:WT_CJ4_TFC_ALT_TAG", "number") === 0) {
                const deltaAltText = Math.abs(deltaAltitudeTraffic / 100).toFixed(0).padStart(2, "0");
                this._alt.setAttribute("x", "4");
                if (deltaAltitudeTraffic > 0) {
                    // above
                    this._alt.setAttribute("y", "3");
                    this._altText.data = "+" + deltaAltText;

                } else if (deltaAltitudeTraffic < 0) {
                    // below
                    this._alt.setAttribute("y", "51");
                    this._altText.data = "-" + deltaAltText;
                }
            } else {
                this._alt.setAttribute("x", "14");
                this._alt.setAttribute("y", "3");
                const altText = Math.abs(trafficAltFeet / 100).toFixed(0).padStart(3, "0");
                this._altText.data = altText;
            }


            // arrow 
            if (this.vs > 500) {
                this._arrImage.style.display = '';
                this._arrImage.setAttribute("transform", "translate(35,20) rotate(180)");
            } else if (this.vs < -500) {
                this._arrImage.style.display = '';
                this._arrImage.setAttribute("transform", "translate(35,20) rotate(0)");
            } else {
                this._arrImage.style.display = 'none';
            }

            deltaAltitudeTraffic = Math.abs(deltaAltitudeTraffic);
            let trafficIsGround = (altitudeAGL < 1750) && (trafficAltFeet - groundAlt < 360) // ; ()
            // TA/RA distance at fantasy values because we have no forward prediction right now
            if (!trafficIsGround && distanceHorizontalTraffic < 1 && altitudeAGL > 500 && deltaAltitudeTraffic < 600) {
                if (this._lastCase !== 0) {
                    // this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_RA_A320.svg");
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_RA.svg");
                    this.svgElement.setAttribute("visibility", "visible");
                    this._alt.setAttribute("fill", "red");
                    this._arrImage.setAttribute("stroke", "red");
                    this._lastCase = 0;
                }
            }
            else if (!trafficIsGround && distanceHorizontalTraffic < 3 && altitudeAGL > 500 && deltaAltitudeTraffic < 850) {
                if (this._lastCase !== 1) {
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_TA.svg");
                    // this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_TA_A320.svg");
                    this.svgElement.setAttribute("visibility", "visible");
                    this._alt.setAttribute("fill", "yellow");
                    this._arrImage.setAttribute("stroke", "yellow");
                    this._lastCase = 1;
                }
            }
            else if (!trafficIsGround && distanceHorizontalTraffic < 6 && deltaAltitudeTraffic < 1200) {
                if (this._lastCase !== 2) {
                    // this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_PROX_A320.svg");
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_PT.svg");
                    this.svgElement.setAttribute("visibility", "visible");
                    this._alt.setAttribute("fill", "cyan");
                    this._arrImage.setAttribute("stroke", "cyan");
                    this._lastCase = 2;
                }
            }
            else if (distanceHorizontalTraffic < 40) {
                if (this._lastCase !== 3) {
                    // this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_OTHER_A320.svg");
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_OT.svg");
                    this.svgElement.setAttribute("visibility", "visible");
                    this._alt.setAttribute("fill", "cyan");
                    this._arrImage.setAttribute("stroke", "cyan");
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