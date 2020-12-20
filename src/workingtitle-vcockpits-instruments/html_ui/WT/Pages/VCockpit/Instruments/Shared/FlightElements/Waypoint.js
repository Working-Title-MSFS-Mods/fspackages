/**
 * A navigational waypoint.
 */
class WT_Waypoint {
    /**
     * @readonly
     * @property {String} uniqueID - a unique identifier for this waypoint.
     * @type {String}
     */
    get uniqueID() {
        return undefined;
    }

    /**
     * @readonly
     * @property {String} ident - the ident string for this waypoint.
     * @type {String}
     */
    get ident() {
        return undefined;
    }

    /**
     * @readonly
     * @property {WT_GeoPoint} location - the lat/long coordinates of this waypoint.
     * @type {WT_GeoPoint}
     */
    get location() {
        return undefined;
    }
}

/**
 * A navigational waypoint defined by a custom set of lat/long coordinates.
 */
class WT_CustomWaypoint extends WT_Waypoint {
    constructor(ident, location) {
        super();
        this._ident = ident;
        this._location = new WT_GeoPoint(location.lat, location.long);
    }

    /**
     * @readonly
     * @property {String} uniqueID - a unique identifier for this waypoint.
     * @type {String}
     */
    get uniqueID() {
        return this._ident;
    }

    /**
     * @readonly
     * @property {String} ident - the ident string for this waypoint.
     * @type {String}
     */
    get ident() {
        return this._ident;
    }

    /**
     * @readonly
     * @property {WT_GeoPoint} location - the lat/long coordinates of this waypoint.
     * @type {WT_GeoPoint}
     */
    get location() {
        return this._location.readonly();
    }
}

/**
 * A navigational waypoint defined by an ICAO string.
 */
class WT_ICAOWaypoint extends WT_Waypoint {
    /**
     * @param {Object} data - an object containing information on this waypoint.
     * @param {WT_ICAOWaypoint.Type} type - the type of this waypoint.
     */
    constructor(data, type) {
        super();
        this._type = type;
        this._initFromData(data);
    }

    _initFromData(data) {
        this._icao = data.icao;
        this._uniqueID = data.icaoTrimmed;
        this._ident = this.icao.substring(7, 12).replace(/ /g, "");
        this._location = new WT_GeoPoint(data.lat, data.lon);
        this._name = Utils.Translate(data.name);

        let city = data.city.split(", ").map(name => Utils.Translate(name));
        this._city = new WT_ICAOWaypointCity(city[0], city[1]);

        this._region = Utils.Translate(data.region);
    }

    /**
     * @readonly
     * @property {String} uniqueID - a unique identifier for this waypoint.
     * @type {String}
     */
    get uniqueID() {
        return this._uniqueID;
    }

    /**
     * @readonly
     * @property {WT_ICAOWaypoint.Type} type - the type of this waypoint.
     * @type {WT_ICAOWaypoint.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @readonly
     * @property {String} icao - the ICAO string for this waypoint.
     * @type {String}
     */
    get icao() {
        return this._icao;
    }

    /**
     * @readonly
     * @property {String} ident - the 5LNC identifier for this waypoint.
     * @type {String}
     */
    get ident() {
        return this._ident;
    }

    /**
     * @readonly
     * @property {WT_GeoPoint} location - the lat/long coordinates of this waypoint.
     * @type {WT_GeoPoint}
     */
    get location() {
        return this._location.readonly();
    }

    /**
     * @readonly
     * @property {String} name - the long-form name of this waypoint.
     * @type {String}
     */
    get name() {
        return this._name;
    }

    /**
     * @readonly
     * @property {WT_ICAOWaypointCity} city - information on the city and (optionally) state/province associated with this waypoint.
     * @type {WT_ICAOWaypointCity}
     */
    get city() {
        return this._city;
    }

    /**
     * @readonly
     * @property {String} region - the two-letter region code of this waypoint.
     * @type {String}
     */
    get region() {
        return this._region;
    }
}
/**
 * Type of ICAO waypoint.
 * @readonly
 * @enum {String}
 */
WT_ICAOWaypoint.Type = {
    AIRPORT: "A",
    VOR: "V",
    NDB: "N",
    INT: "W"
};

class WT_ICAOWaypointCity {
    constructor(city, state) {
        this._city = city;
        this._state = state;
    }

    /**
     * @readonly
     * @property {String} city - the name of this city.
     * @type {String}
     */
    get city() {
        return this._city;
    }

    /**
     * @readonly
     * @property {String} state - the name of the state/province in which this city is located.
     * @type {String}
     */
    get state() {
        return this._state;
    }

    toString() {
        return this.state ? `${this.city}, ${this.state}` : this.city;
    }
}