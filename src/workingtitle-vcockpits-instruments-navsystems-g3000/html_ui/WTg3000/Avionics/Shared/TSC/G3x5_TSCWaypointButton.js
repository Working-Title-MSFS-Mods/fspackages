class WT_G3x5_TSCWaypointButton extends WT_TSCButton {
    constructor() {
        super();

        this._iconSrcFactory = null;
        this._waypoint = null;
        this._airportLongestRunwayHeading = NaN;
        this._isInit = false;
    }

    _createIdentStyle() {
        return `
            #ident {
                position: absolute;
                left: 2%;
                top: 5%;
                font-size: var(--waypoint-ident-font-size, 1.67em);
                text-align: left;
                color: var(--waypoint-ident-color, var(--wt-g3x5-lightblue));
            }
            :host([highlight=true][primed=false]) #ident {
                color: black;
            }
        `;
    }

    _createNameStyle() {
        return `
            #name {
                position: absolute;
                left: 2%;
                width: 90%;
                bottom: 5%;
                font-size: var(--waypoint-name-font-size, 1em);
                text-align: left;
                white-space: nowrap;
                overflow: hidden;
                color: var(--waypoint-name-color, white);
            }
            :host([highlight=true][primed=false]) #name {
                color: black;
            }
        `;
    }

    _createIconStyle() {
        return `
            #icon {
                position: absolute;
                right: 5%;
                top: 10%;
                height: 40%;
                max-width: 15%;
                fill: white;
                transform: rotateX(0deg);
            }
        `;
    }

    _createEmptyStyle() {
        return `
            #empty {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();

        let identStyle = this._createIdentStyle();
        let nameStyle = this._createNameStyle();
        let iconStyle = this._createIconStyle();
        let emptyStyle = this._createEmptyStyle();

        return`
            ${style}
            ${identStyle}
            ${nameStyle}
            ${iconStyle}
            ${emptyStyle}
        `;
    }

    _appendChildren() {
        this._ident = document.createElement("div");
        this._ident.id = "ident";
        this._name = document.createElement("div");
        this._name.id = "name";
        this._icon = document.createElementNS(Avionics.SVG.NS, "svg");
        this._icon.id = "icon";
        this._icon.setAttribute("viewBox", "-50 -50 100 100");
        this._iconImage = document.createElementNS(Avionics.SVG.NS, "image");
        this._iconImage.setAttribute("x", "-50");
        this._iconImage.setAttribute("y", "-50");
        this._iconImage.setAttribute("width", "100");
        this._iconImage.setAttribute("height", "100");
        this._airportRunwaySymbol = document.createElementNS(Avionics.SVG.NS, "rect");
        this._airportRunwaySymbol.setAttribute("x", "-5");
        this._airportRunwaySymbol.setAttribute("y", "-25");
        this._airportRunwaySymbol.setAttribute("width", "10");
        this._airportRunwaySymbol.setAttribute("height", "50");
        this._airportRunwaySymbolCached = new WT_CachedElement(this._airportRunwaySymbol);
        this._icon.appendChild(this._iconImage);
        this._icon.appendChild(this._airportRunwaySymbol);

        this._empty = document.createElement("div");
        this._empty.id = "empty";

        this._wrapper.appendChild(this._ident);
        this._wrapper.appendChild(this._name);
        this._wrapper.appendChild(this._icon);
        this._wrapper.appendChild(this._empty);
    }

    static get observedAttributes() {
        return [...WT_TSCButton.observedAttributes, "emptytext"];
    }

    /**
     * @readonly
     * @property {WT_Waypoint} waypoint
     * @type {WT_Waypoint}
     */
    get waypoint() {
        return this._waypoint;
    }

    get emptyText() {
        return this.getAttribute("emptytext");
    }

    set emptyText(value) {
        this.setAttribute("emptytext", value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "emptytext") {
            this._empty.innerHTML = newValue;
        } else {
            super.attributeChangedCallback(name, oldValue, newValue);
        }
    }

    connectedCallback() {
        super.connectedCallback();

        this._updateWaypoint();
        this._isInit = true;
    }

    setIconSrcFactory(factory) {
        this._iconSrcFactory = factory;
        if (this._isInit) {
            this._updateWaypoint();
        }
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    _showWaypointInfo(waypoint) {
        this._empty.style.display = "none";

        this._ident.innerHTML = waypoint.ident;
        this._name.innerHTML = waypoint.name;
        this._iconImage.setAttributeNS("http://www.w3.org/1999/xlink", "href", this._iconSrcFactory ? this._iconSrcFactory.getSrc(waypoint) : "");

        this._ident.style.display = "block";
        this._name.style.display = "block";
        this._icon.style.display = "block";

        this._airportLongestRunwayHeading = NaN;
        if (waypoint instanceof WT_Airport && waypoint.class === WT_Airport.Class.PAVED_SURFACE) {
            let longestRunway = waypoint.runways.longest();
            if (longestRunway) {
                this._airportLongestRunwayHeading = longestRunway.direction;
            }
        }

        this._airportRunwaySymbol.style.display = isNaN(this._airportLongestRunwayHeading) ? "none" : "inherit";
    }

    _showEmptyText() {
        this._ident.style.display = "none";
        this._name.style.display = "none";
        this._icon.style.display = "none";
        this._empty.style.display = "block";
        this._airportLongestRunwayHeading = NaN;
    }

    _updateWaypoint() {
        if (this.waypoint) {
            this._showWaypointInfo(this.waypoint);
        } else {
            this._showEmptyText();
        }
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    setWaypoint(waypoint) {
        if (!waypoint && !this.waypoint || (waypoint && this.waypoint && waypoint.uniqueID === this.waypoint.uniqueID)) {
            return;
        }

        this._waypoint = waypoint;
        if (this._isInit) {
            this._updateWaypoint();
        }
    }

    /**
     *
     * @param {Number} airplane
     */
    _updateAirportRunwaySymbol(airplaneHeadingTrue) {
        let rotation = this._airportLongestRunwayHeading - airplaneHeadingTrue;
        this._airportRunwaySymbolCached.setAttribute("transform", `rotate(${rotation.toFixed(1)})`);
    }

    /**
     *
     * @param {Number} airplaneHeadingTrue
     */
    _doUpdate(airplaneHeadingTrue) {
        if (!isNaN(this._airportLongestRunwayHeading)) {
            this._updateAirportRunwaySymbol(airplaneHeadingTrue);
        }
    }

    /**
     *
     * @param {Number} airplaneHeadingTrue
     */
    update(airplaneHeadingTrue) {
        if (!this._isInit || !this.waypoint) {
            return;
        }

        this._doUpdate(airplaneHeadingTrue);
    }
}
WT_G3x5_TSCWaypointButton.NAME = "wt-tsc-button-waypoint";

customElements.define(WT_G3x5_TSCWaypointButton.NAME, WT_G3x5_TSCWaypointButton);

class WT_G3x5_TSCWaypointButtonIconSrcFactory {
    constructor(imageDir) {
        this._imageDir = imageDir;
    }

    /**
     *
     * @param {WT_Airport} airport
     * @returns {String}
     */
    _getAirportSrc(airport) {
        let fuel = airport.fuel !== "";
        switch(airport.class) {
            case WT_Airport.Class.PAVED_SURFACE:
                if (airport.isTowered) {
                    return fuel ?
                        `${this._imageDir}/ICON_TSC_WAYPOINT_AIRPORT_PAVED_TOWERED_SERVICED.svg` :
                        `${this._imageDir}/ICON_TSC_WAYPOINT_AIRPORT_PAVED_TOWERED_NONSERVICED.svg`;
                } else {
                    return fuel ?
                        `${this._imageDir}/ICON_TSC_WAYPOINT_AIRPORT_PAVED_NONTOWERED_SERVICED.svg` :
                        `${this._imageDir}/ICON_TSC_WAYPOINT_AIRPORT_PAVED_NONTOWERED_NONSERVICED.svg`;
                }
            case WT_Airport.Class.SOFT_SURFACE:
                return fuel ?
                    `${this._imageDir}/ICON_TSC_WAYPOINT_AIRPORT_SOFT_SERVICED.svg` :
                    `${this._imageDir}/ICON_TSC_WAYPOINT_AIRPORT_SOFT_NONSERVICED.svg`;
            //case WT_Airport.Class.SEAPLANE:
            //    return airport.isTowered ?
            //        `${this._imageDir}/ICON_MAP_AIRPORT_SEAPLANE_TOWERED.svg` :
            //        `${this._imageDir}/ICON_MAP_AIRPORT_SEAPLANE_NONTOWERED.svg`;
            case WT_Airport.Class.HELIPORT:
                return `${this._imageDir}/ICON_TSC_WAYPOINT_AIRPORT_HELIPORT.svg`;
            case WT_Airport.Class.RESTRICTED:
                return `${this._imageDir}/ICON_TSC_WAYPOINT_AIRPORT_RESTRICTED.svg`;
            default:
                return `${this._imageDir}/ICON_TSC_WAYPOINT_AIRPORT_UNKNOWN.svg`;
        }
    }

    /**
     *
     * @param {WT_VOR} vor
     * @returns {String}
     */
    _getVORSrc(vor) {
        switch(vor.vorType) {
            case WT_VOR.Type.VOR_DME:
                return `${this._imageDir}/ICON_TSC_WAYPOINT_VOR_VORDME.svg`;
            case WT_VOR.Type.DME:
                return `${this._imageDir}/ICON_TSC_WAYPOINT_VOR_DME.svg`;
            case WT_VOR.Type.VORTAC:
                return `${this._imageDir}/ICON_TSC_WAYPOINT_VOR_VORTAC.svg`;
            case WT_VOR.Type.TACAN:
                return `${this._imageDir}/ICON_TSC_WAYPOINT_VOR_TACAN.svg`;
            default:
                return `${this._imageDir}/ICON_TSC_WAYPOINT_VOR_VOR.svg`;
        }
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     * @returns {String}
     */
    getSrc(waypoint) {
        if (waypoint.icao) {
            switch (waypoint.type) {
                case WT_ICAOWaypoint.Type.AIRPORT:
                    return this._getAirportSrc(waypoint);
                case WT_ICAOWaypoint.Type.VOR:
                    return this._getVORSrc(waypoint);
                case WT_ICAOWaypoint.Type.NDB:
                    return `${this._imageDir}/ICON_TSC_WAYPOINT_NDB.svg`;
                case WT_ICAOWaypoint.Type.INT:
                    return `${this._imageDir}/ICON_TSC_WAYPOINT_INTERSECTION.svg`;
            }
        } else {
            return `${this._imageDir}/ICON_TSC_WAYPOINT_USER.svg`;
        }
    }
}