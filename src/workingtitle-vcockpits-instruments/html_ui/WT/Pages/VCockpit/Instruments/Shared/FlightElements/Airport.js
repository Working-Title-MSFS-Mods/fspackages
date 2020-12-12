/**
 * An airport.
 */
class WT_Airport extends WT_ICAOWaypoint {
    constructor(data) {
        super(data, WT_ICAOWaypoint.Type.AIRPORT);
    }

    _initFromData(data) {
        super._initFromData(data);

        this._class = data.airportClass;
        this._privacy = data.airportPrivateType;
        this._isTowered = data.towered;
        this._fuel = `${data.fuel1} ${data.fuel2}`;
        this._radarCoverage = data.radarCoverage;
        this._runways = this._initRunways(data.runways);
        this._size = this._calculateSize();
    }

    _initRunways(runwayData) {
        if (!runwayData) {
            return [];
        }

        let runways = [];
        for (let data of runwayData) {
            let newRunwayPair = WT_Runway._createFromData(this, data);
            for (let runway of newRunwayPair) {
                let i = 0;
                let length = runway.length;
                let width = runway.width;
                while (i < runways.length) {
                    let other = runways[i++];
                    let lengthCompare = length.compare(other.length);
                    if (lengthCompare > 0) {
                        break;
                    } else if (lengthCompare === 0) {
                        let widthCompare = width.compare(other.width);
                        if (widthCompare > 0) {
                            break;
                        } else if (widthCompare === 0) {
                            if (runway.number < other.number) {
                                break;
                            } else if (runway.number === other.number) {
                                let shouldBreak = false;
                                switch (runway.suffix) {
                                    case WT_Runway.Suffix.R:
                                        if (other.suffix === WT_Runway.Suffix.C) {
                                            break;
                                        }
                                    case WT_Runway.Suffix.C:
                                        if (other.suffix === WT_Runway.Suffix.L) {
                                            break;
                                        }
                                    case WT_Runway.Suffix.L:
                                        shouldBreak = true;
                                }
                                if (shouldBreak) {
                                    break;
                                }
                            }
                        }
                    }
                }
                runways.splice(i, 0, runway);
            }
        }
        return runways;
    }

    _calculateSize() {
        let longestRunwayLength;
        if (this.longestRunway) {
            longestRunwayLength = this.longestRunway.length;
        }

        if (this.longestRunway && longestRunwayLength.compare(WT_Unit.FOOT.createNumber(8100)) >= 0) {
            return WT_Airport.Size.LARGE;
        }

        if (this.isTowered || this.longestRunway && longestRunwayLength.compare(WT_Unit.FOOT.createNumber(5000)) >= 0) {
            return WT_Airport.Size.MEDIUM;
        }

        return WT_Airport.Size.SMALL;
    }

    /**
     * @readonly
     * @property {Number} size - the size of this airport.
     * @type {Number}
     */
    get size() {
        return this._size;
    }

    /**
     * @readonly
     * @property {WT_Airport.Class} class - the class of this airport.
     * @type {WT_Airport.Class}
     */
    get class() {
        return this._class;
    }

    /**
     * @readonly
     * @property {WT_Airport.Privacy} privacy - the privacy type of this airport.
     * @type {WT_Airport.Privacy}
     */
    get privacy() {
        return this._privacy;
    }

    /**
     * @readonly
     * @property {Boolean} isTowered - whether is airport is tower-controlled.
     * @type {Boolean}
     */
    get isTowered() {
        return this._isTowered;
    }

    get fuel() {
        return this._fuel;
    }

    /**
     * @readonly
     * @property {WT_Airport.RadarCoverage} radarCoverage - the type of radar coverage this airport has.
     * @type {WT_Airport.RadarCoverage}
     */
    get radarCoverage() {
        return this._radarCoverage;
    }

    /**
     * @readonly
     * @property {WT_Runway[]} runways - a list of runways belonging to this airport.
     * @type {WT_Runway[]}
     */
    get runways() {
        return Array.from(this._runways);
    }

    /**
     * @readonly
     * @property {WT_Runway} longestRunway - the longest runway at this airport.
     * @type {WT_Runway}
     */
    get longestRunway() {
        return this._runways[0];
    }
}
/**
 * Airport size.
 * @readonly
 * @enum {Number}
 */
WT_Airport.Size = {
    LARGE: 0,
    MEDIUM: 1,
    SMALL: 2
}
/**
 * Airport class.
 * @readonly
 * @enum {Number}
 */
WT_Airport.Class = {
    UNKNOWN: 0,
    PAVED_SURFACE: 1,
    SOFT_SURFACE: 2,
    SEAPLANE: 3,
    HELIPORT: 4,
    RESTRICTED: 5
}
/**
 * Airport privacy type.
 * @readonly
 * @enum {Number}
 */
WT_Airport.Privacy = {
    UNKNOWN: 0,
    PUBLIC: 1,
    MILITARY: 2,
    PRIVATE: 3
}
/**
 * Airport radar coverage type.
 * @readonly
 * @enum {Number}
 */
WT_Airport.RadarCoverage = {
    UNKNOWN: 0,
    NO: 1,
    YES: 2
}

/**
 * An airport runway.
 */
class WT_Runway {
    /**
     * @param {WT_Airport} airport - the airport to which the new runway belongs.
     * @param {Number} number - the number of the new runway.
     * @param {Object} data - a data object containing information on the new runway.
     * @param {Boolean} reverse - whether the runway is the reverse of the runway defined in the data object.
     */
    constructor(airport, number, data, reverse) {
        this._airport = airport;
        this._initFromData(number, data, reverse);
    }

    _initFromData(number, data, reverse) {
        this._number = number;
        let suffixIndex = reverse ? data.designatorCharSecondary : data.designatorCharPrimary;
        switch (suffixIndex) {
            case 1: this._suffix = WT_Runway.Suffix.L; break;
            case 2: this._suffix = WT_Runway.Suffix.C; break;
            case 3: this._suffix = WT_Runway.Suffix.R; break;
            default: this._suffix = WT_Runway.Suffix.NONE;
        }
        this._designation = this._number + this._suffix;
        this._location = new LatLong(data.latitude, data.longitude);
        this._elevation = new WT_NumberUnit(data.elevation, WT_Unit.METER);
        this._direction = reverse ? (data.direction + 180) % 360 : data.direction;
        this._length = new WT_NumberUnit(data.length, WT_Unit.METER);
        this._width = new WT_NumberUnit(data.width, WT_Unit.METER);
        this._surface = data.surface;
        this._lighting = data.lighting;

    }

    /**
     * @readonly
     * @property {WT_Airport} airport - the airport to which this runway belongs.
     * @type {WT_Airport}
     */
    get airport() {
        return this._airport;
    }

    /**
     * @readonly
     * @property {Number} number - the number of this runway.
     * @type {Number}
     */
    get number() {
        return this._number;
    }

    /**
     * @readonly
     * @property {WT_Runway.Suffix} suffix - the suffix of this runway.
     * @type {WT_Runway.Suffix}
     */
    get suffix() {
        return this._suffix;
    }

    /**
     * @readonly
     * @property {String} designation - the designation of this runway, consisting of the runway number followed by an optional L/C/R suffix.
     * @type {String}
     */
    get designation() {
        return this._designation;
    }

    /**
     * @readonly
     * @property {LatLong} location - the lat/long coordinates of the center of this runway.
     * @type {LatLong}
     */
    get location() {
        return this._location;
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} elevation - the elevation of the center of this runway.
     * @type {WT_NumberUnit}
     */
    get elevation() {
        return this._elevation.copy();
    }

    /**
     * @readonly
     * @property {Number} direction - the precise heading of this runway.
     * @type {Number}
     */
    get direction() {
        return this._direction;
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} length - the length of this runway.
     * @type {WT_NumberUnit}
     */
    get length() {
        return this._length.copy();
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} width - the width of this runway.
     * @type {WT_NumberUnit}
     */
    get width() {
        return this._width.copy();
    }

    /**
     * @readonly
     * @property {WT_Runway.Surface} surface - the surface type of this runway.
     * @type {WT_Runway.Surface}
     */
    get surface() {
        return this._surface;
    }

    /**
     * @readonly
     * @property {WT_Runway.Lighting} surface - the lighting type of this runway.
     * @type {WT_Runway.Lighting}
     */
    get lighting() {
        return this._lighting;
    }

    /**
     * Creates one or two runways for an airport given the specified runway data. One runway (forward) is guaranteed to be created.
     * If the forward runway also has an associated reverse runway, the reverse runway will be created as well.
     * @param {WT_Airport} airport - the airport to which the new runways belong.
     * @param {Object} data - the data object containing information on the runway(s).
     * @returns {WT_Runway[]} - the new runways. The forward runway is located at index 0. The reverse runway, if one was created, is
     *                          located at index 1.
     */
    static _createFromData(airport, data) {
        let designations = data.designation.split("-");
        let returnValue = [new WT_Runway(airport, designations[0], data, false)];
        if (designations.length > 1) {
            returnValue.push(new WT_Runway(airport, designations[1], data, true));
        }
        return returnValue;
    }
}
/**
 * Runway suffix.
 * @readonly
 * @enum {String}
 */
WT_Runway.Suffix = {
    NONE: "",
    L: "L",
    C: "C",
    R: "R"
};
/**
 * Runway lighting type.
 * @readonly
 * @enum {Number}
 */
WT_Runway.Lighting = {
    UNKNOWN: 0,
    NONE: 1,
    PART_TIME: 2,
    FULL_TIME: 3,
    FREQUENCY: 4
};
/**
 * Runway surface type.
 * @readonly
 * @enum {Number}
 */
WT_Runway.Surface = {
    UNKNOWN: 0,
    CONCRETE: 1,
    ASPHALT: 2,
    GRASS: 101,
    TURF: 102,
    DIRT: 103,
    CORAL: 104,
    GRAVEL: 105,
    OIL_TREATED: 106,
    STEEL: 107,
    BITUMINUS: 108,
    BRICK: 109,
    MACADAM: 110,
    PLANKS: 111,
    SAND: 112,
    SHALE: 113,
    TARMAC: 114,
    SNOW: 115,
    ICE: 116,
    WATER: 201
};