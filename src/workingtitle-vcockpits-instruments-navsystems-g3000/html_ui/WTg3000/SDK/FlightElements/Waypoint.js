/**
 * A navigational waypoint.
 */
class WT_Waypoint {
    /**
     * A unique identifier for this waypoint.
     * @readonly
     * @type {String}
     */
    get uniqueID() {
        return undefined;
    }

    /**
     * The ident string for this waypoint.
     * @readonly
     * @type {String}
     */
    get ident() {
        return undefined;
    }

    /**
     * The name of this waypoint.
     * @readonly
     * @type {String}
     */
    get name() {
        return undefined;
    }

    /**
     * The lat/long coordinates of this waypoint.
     * @readonly
     * @type {WT_GeoPoint}
     */
    get location() {
        return undefined;
    }

    /**
     * Checks whether this waypoint is equivalent to another object. Returns true if and only if the other object
     * is an WT_Waypoint object and shares the same uniqueID.
     * @param {Object} other - another object.
     * @returns {Boolean} whether this waypoint is equivalent to the other object.
     */
    equals(other) {
        return other instanceof WT_Waypoint && this.uniqueID === other.uniqueID;
    }
}

/**
 * A navigational waypoint defined by a custom set of lat/long coordinates.
 */
class WT_CustomWaypoint extends WT_Waypoint {
    /**
     * @param {String} ident - the ident string for the new waypoint.
     * @param {WT_GeoPoint} location - the lat/long coordinates of the new waypoint.
     */
    constructor(ident, location) {
        super();
        this._ident = ident;
        this._location = new WT_GeoPoint(location.lat, location.long);
        this._uniqueID = `${ident} (${location.lat.toFixed(6)},${location.long.toFixed(6)})`
    }

    /**
     * A unique identifier for this waypoint.
     * @readonly
     * @type {String}
     */
    get uniqueID() {
        return this._uniqueID;
    }

    /**
     * The ident string for this waypoint.
     * @readonly
     * @type {String}
     */
    get ident() {
        return this._ident;
    }

    /**
     * The name of this waypoint.
     * @readonly
     * @type {String}
     */
    get name() {
        return this.ident;
    }

    /**
     * The lat/long coordinates of this waypoint.
     * @readonly
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
     * A unique identifier for this waypoint.
     * @readonly
     * @type {String}
     */
    get uniqueID() {
        return this._uniqueID;
    }

    /**
     * The ICAO type of this waypoint.
     * @readonly
     * @type {WT_ICAOWaypoint.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * The ICAO string for this waypoint.
     * @readonly
     * @type {String}
     */
    get icao() {
        return this._icao;
    }

    /**
     * The 5LNC identifier for this waypoint.
     * @readonly
     * @type {String}
     */
    get ident() {
        return this._ident;
    }

    /**
     * The lat/long coordinates of this waypoint.
     * @readonly
     * @type {WT_GeoPoint}
     */
    get location() {
        return this._location.readonly();
    }

    /**
     * The long-form name of this waypoint.
     * @readonly
     * @type {String}
     */
    get name() {
        return this._name;
    }

    /**
     * Information on the city and (optionally) state/province associated with this waypoint.
     * @readonly
     * @type {WT_ICAOWaypointCity}
     */
    get city() {
        return this._city;
    }

    /**
     * The two-letter region code of this waypoint.
     * @readonly
     * @type {String}
     */
    get region() {
        return this._region;
    }

    /**
     * Gets the ICAO type of the waypoint with the specified ICAO string.
     * @param {String} icao - an ICAO string.
     * @returns {WT_ICAOWaypoint.Type} the ICAO type of the waypoint with the specified ICAO string.
     */
    static getICAOType(icao) {
        if (!icao) {
            return undefined;
        }

        switch (icao[0]) {
            case "A":
                return WT_ICAOWaypoint.Type.AIRPORT;
            case "V":
                return WT_ICAOWaypoint.Type.VOR;
            case "N":
                return WT_ICAOWaypoint.Type.NDB;
            case "W":
                return WT_ICAOWaypoint.Type.INT;
        }
    }

    /**
     * Gets the ICAO string prefix (the first character of the full ICAO string) associated with the specified ICAO
     * type.
     * @param {WT_ICAOWaypoint.Type} type - an ICAO type.
     * @returns {String} the ICAO string prefix associated with the specified ICAO type.
     */
    static getICAOPrefixFromType(type) {
        return WT_ICAOWaypoint.PREFIXES[type];
    }
}
/**
 * Type of ICAO waypoint.
 * @enum {Number}
 */
WT_ICAOWaypoint.Type = {
    AIRPORT: 0,
    VOR: 1,
    NDB: 2,
    INT: 3
};
WT_ICAOWaypoint.PREFIXES = ["A", "V", "N", "W"];

class WT_ICAOWaypointCity {
    constructor(city, state) {
        this._city = city;
        this._state = state;
    }

    /**
     * The name of this city.
     * @readonly
     * @type {String}
     */
    get city() {
        return this._city;
    }

    /**
     * The name of the state/province in which this city is located.
     * @readonly
     * @type {String}
     */
    get state() {
        return this._state;
    }

    toString() {
        return this.state ? `${this.city}, ${this.state}` : this.city;
    }
}