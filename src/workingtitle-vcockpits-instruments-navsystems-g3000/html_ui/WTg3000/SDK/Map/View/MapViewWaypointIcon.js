/**
 * A map icon for a waypoint.
 */
class WT_MapViewWaypointIcon {
    /**
     * @param {WT_Waypoint} waypoint - the waypoint associated with the new icon.
     * @param {Number} priority - the priority of the new icon. Icons with higher priority values are drawn above those with lower
     *                            priority values.
     */
    constructor(waypoint, priority) {
        this._waypoint = waypoint;
        this._priority = priority;
    }

    /**
     * @readonly
     * @property {WT_Waypoint} waypoint - the waypoint associated with this icon.
     * @type {WT_Waypoint}
     */
    get waypoint() {
        return this._waypoint;
    }

    /**
     * @readonly
     * @property {Number} priority - the priority of this icon. Icons with higher priority values are drawn above those with
     *                               lower priority values.
     * @type {Number}
     */
    get priority() {
        return this._priority;
    }

    /**
     * Draws this icon to a canvas rendering context.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {CanvasRenderingContext2D} context - the context to which to draw.
     */
    draw(state, context) {
    }
}

/**
 * A waypoint map icon whose graphics are defined by an image file.
 */
class WT_MapViewWaypointImageIcon extends WT_MapViewWaypointIcon {
    constructor(waypoint, priority, imageDir) {
        super(waypoint, priority);

        this._viewPosition = new WT_GVector2(0, 0);

        this._iconImage = WT_MapViewWaypointImageIcon._getImage(`${imageDir}/${this.imageFileName}`);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewWaypointImageIcon.OPTIONS_DEF);
    }

    get imageFileName() {
        return "";
    }

    get iconImage() {
        return this._iconImage;
    }

    setOptions(opts) {
        this._optsManager.setOptions(opts);
    }

    /**
     * Draws this icon to a canvas rendering context.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {CanvasRenderingContext2D} context - the context to which to draw.
     */
    draw(state, context) {
        state.projection.project(this.waypoint.location, this._viewPosition);
        let sizePx = this.size * state.dpiScale;
        context.drawImage(this.iconImage, this._viewPosition.x - sizePx / 2, this._viewPosition.y - sizePx / 2, sizePx, sizePx);
    }

    static _getImage(path) {
        let existing = WT_MapViewWaypointImageIcon._imageCache.get(path);
        if (!existing) {
            existing = document.createElement("img");
            existing.src = path;
            WT_MapViewWaypointImageIcon._imageCache.set(path, existing);
        }
        return existing;
    }
}
WT_MapViewWaypointImageIcon._imageCache = new Map();
WT_MapViewWaypointImageIcon.OPTIONS_DEF = {
    size: {default: 40, auto: true}
}

/**
 * A map icon for an airport.
 */
class WT_MapViewAirportImageIcon extends WT_MapViewWaypointImageIcon {
    constructor(waypoint, priority, imageDir) {
        super(waypoint, priority, imageDir);

        this._longestRunway = waypoint.runways.longest();
    }

    get imageFileName() {
        let fuel = this.waypoint.fuel !== "";
        switch(this.waypoint.class) {
            case WT_Airport.Class.PAVED_SURFACE:
                if (this.waypoint.isTowered) {
                    return fuel ?
                        "ICON_MAP_AIRPORT_PAVED_TOWERED_SERVICED.svg" :
                        "ICON_MAP_AIRPORT_PAVED_TOWERED_NONSERVICED.svg";
                } else {
                    return fuel ?
                        "ICON_MAP_AIRPORT_PAVED_NONTOWERED_SERVICED.svg" :
                        "ICON_MAP_AIRPORT_PAVED_NONTOWERED_NONSERVICED.svg";
                }
            case WT_Airport.Class.SOFT_SURFACE:
                return fuel ?
                    "ICON_MAP_AIRPORT_SOFT_SERVICED.svg" :
                    "ICON_MAP_AIRPORT_SOFT_NONSERVICED.svg";
            //case WT_Airport.Class.SEAPLANE:
            //    return this.waypoint.isTowered ?
            //        "ICON_MAP_AIRPORT_SEAPLANE_TOWERED.svg" :
            //        "ICON_MAP_AIRPORT_SEAPLANE_NONTOWERED.svg";
            case WT_Airport.Class.HELIPORT:
                return "ICON_MAP_AIRPORT_HELIPORT.svg";
            case WT_Airport.Class.RESTRICTED:
                return "ICON_MAP_AIRPORT_RESTRICTED.svg";
            default:
                return "ICON_MAP_AIRPORT_UNKNOWN.svg";
        }
    }

    /**
     * Draws this icon to a canvas rendering context.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {CanvasRenderingContext2D} context - the context to which to draw.
     */
    draw(state, context) {
        super.draw(state, context);
        if (this.waypoint.class !== WT_Airport.Class.PAVED_SURFACE) {
            return;
        }

        let sizePx = this.size * state.dpiScale;
        let rectLength = sizePx * WT_MapViewAirportImageIcon.RUNWAY_RECT_LENGTH_FACTOR;
        let rectWidth = sizePx * WT_MapViewAirportImageIcon.RUNWAY_RECT_WIDTH_FACTOR;
        let rotation = 0;
        if (this._longestRunway) {
            rotation = this._longestRunway.direction + state.projection.rotation;
        }

        context.translate(this._viewPosition.x, this._viewPosition.y);
        context.rotate(rotation * Avionics.Utils.DEG2RAD);
        context.translate(-this._viewPosition.x, -this._viewPosition.y);
        context.fillStyle = WT_MapViewAirportImageIcon.RUNWAY_RECT_COLOR;
        context.fillRect(this._viewPosition.x - rectWidth / 2, this._viewPosition.y - rectLength / 2, rectWidth, rectLength);
        context.resetTransform();
    }
}
WT_MapViewAirportImageIcon.RUNWAY_RECT_LENGTH_FACTOR = 0.55;
WT_MapViewAirportImageIcon.RUNWAY_RECT_WIDTH_FACTOR = 0.1;
WT_MapViewAirportImageIcon.RUNWAY_RECT_COLOR = "white";

/**
 * A map icon for a VOR station.
 */
class WT_MapViewVORImageIcon extends WT_MapViewWaypointImageIcon {
    get imageFileName() {
        switch(this.waypoint.vorType) {
            case WT_VOR.Type.VOR_DME:
                return "ICON_MAP_VOR_VORDME.svg";
            case WT_VOR.Type.DME:
                return "ICON_MAP_VOR_DME.svg";
            case WT_VOR.Type.VORTAC:
                return "ICON_MAP_VOR_VORTAC.svg";
            case WT_VOR.Type.TACAN:
                return "ICON_MAP_VOR_TACAN.svg";
            default:
                return "ICON_MAP_VOR_VOR.svg";
        }
    }
}

/**
 * A map icon for a NDB.
 */
class WT_MapViewNDBImageIcon extends WT_MapViewWaypointImageIcon {
    get imageFileName() {
        return "ICON_MAP_NDB.svg";
    }
}

/**
 * A map icon for an intersection.
 */
class WT_MapViewINTImageIcon extends WT_MapViewWaypointImageIcon {
    get imageFileName() {
        return "ICON_MAP_INTERSECTION.svg";
    }
}

/**
 * A cache for image-based waypoint icons.
 */
class WT_MapViewWaypointImageIconCache {
    /**
     * @param {Number} size - the size of the new cache.
     */
    constructor(size) {
        this._cache = new Map();
        this._size = size;
    }

    _createIconFromWaypoint(waypoint, priority, imageDir) {
        if (waypoint.icao) {
            switch (waypoint.type) {
                case WT_ICAOWaypoint.Type.AIRPORT:
                    return new WT_MapViewAirportImageIcon(waypoint, priority, imageDir);
                case WT_ICAOWaypoint.Type.VOR:
                    return new WT_MapViewVORImageIcon(waypoint, priority, imageDir);
                case WT_ICAOWaypoint.Type.NDB:
                    return new WT_MapViewNDBImageIcon(waypoint, priority, imageDir);
                case WT_ICAOWaypoint.Type.INT:
                    return new WT_MapViewINTImageIcon(waypoint, priority, imageDir);
            }
        }
    }

    /**
     * Gets an icon for a waypoint. If one cannot be found in the cache, a new icon is added to the cache and
     * returned.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get an icon.
     * @param {Number} priority - the priority of the icon, if a new one has to be created.
     * @param {String} imageDir - the path to the directory where the icon image files are located.
     * @returns {WT_MapViewWaypointImageIcon} a waypoint icon.
     */
    getIcon(waypoint, priority, imageDir) {
        let existing = this._cache.get(waypoint.uniqueID);
        if (!existing) {
            existing = this._createIconFromWaypoint(waypoint, priority, imageDir, priority);
            this._cache.set(waypoint.uniqueID, existing);
            if (this._cache.size > this._size) {
                this._cache.delete(this._cache.keys().next().value);
            }
        }
        return existing;
    }
}