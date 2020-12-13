class WT_City {
    constructor(name, location, size) {
        this._name = name;
        this._location = location;
        this._size = size;
        this._uniqueID = `${name}: ${location.lat.toFixed(2)} ${location.long.toFixed(2)}`;
    }

    /**
     * @readonly
     * @property {String} name - the name of this city.
     * @type {String}
     */
    get name() {
        return this._name;
    }

    /**
     * @readonly
     * @property {WT_GeoPointReadOnly} location - the location of this city.
     * @type {WT_GeoPointReadOnly}
     */
    get location() {
        return this._location.readonly();
    }

    /**
     * @readonly
     * @property {Number} size - the size category of this city.
     * @type {Number}
     */
    get size() {
        return this._size;
    }

    /**
     * @readonly
     * @property {String} size - this city's unique string identifier.
     * @type {String}
     */
    get uniqueID() {
        return this._uniqueID;
    }
}
/**
 * @enum {Number}
 */
WT_City.Size = {
    LARGE: 0,
    MEDIUM: 1,
    SMALL: 2
};