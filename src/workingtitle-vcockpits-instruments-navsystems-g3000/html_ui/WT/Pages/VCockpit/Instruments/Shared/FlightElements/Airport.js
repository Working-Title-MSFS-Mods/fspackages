/**
 * An airport.
 */
class WT_Airport extends WT_ICAOWaypoint {
    constructor(data) {
        super(data, WT_ICAOWaypoint.Type.AIRPORT);
    }

    _departureMap(data, index) {
        return new WT_Departure(this, data.name, index, data);
    }

    _arrivalMap(data, index) {
        return new WT_Arrival(this, data.name, index, data);
    }

    _approachMap(data, index) {
        return new WT_Approach(this, data.name, index, data);
    }

    _initFromData(data) {
        super._initFromData(data);

        this._class = data.airportClass;
        this._privacy = data.airportPrivateType;
        this._isTowered = data.towered;
        this._fuel = `${data.fuel1} ${data.fuel2}`;
        this._radarCoverage = data.radarCoverage;
        this._runways = new WT_RunwayList(this._initRunways(data.runways));
        this._size = this._calculateSize();

        this._departures = new WT_ProcedureList(data.departures.map(this._departureMap.bind(this)));
        this._arrivals = new WT_ProcedureList(data.arrivals.map(this._arrivalMap.bind(this)));
        this._approaches = new WT_ProcedureList(data.approaches.map(this._approachMap.bind(this)));
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
                while (i < runways.length) {
                    let other = runways[i++];
                    let numberCompare = runway.number - other.number;
                    if (numberCompare < 0) {
                        break;
                    } else if (numberCompare === 0) {
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
     * @property {WT_RunwayList} runways - a list of runways belonging to this airport.
     * @type {WT_RunwayList}
     */
    get runways() {
        return this._runways;
    }

    /**
     * @readonly
     * @property {WT_ProcedureList<WT_Departure>} departures - a list of standard instrument departure procedures (SIDs) belonging
     *                                                         to this airport.
     * @type {WT_ProcedureList<WT_Departure>}
     */
    get departures() {
        return this._departures;
    }

    /**
     * @readonly
     * @property {WT_ProcedureList<WT_Arrival>} arrivals - a list of standard terminal arrival procedures (STARs) belonging
     *                                                     to this airport.
     * @type {WT_ProcedureList<WT_Arrival>}
     */
    get arrivals() {
        return this._arrivals;
    }

    /**
     * @readonly
     * @property {WT_ProcedureList<WT_Approach>} approaches - a list of approach procedures belonging to this airport.
     * @type {WT_ProcedureList<WT_Approach>}
     */
    get approaches() {
        return this._approaches;
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

class WT_RunwayList {
    constructor(runways) {
        /**
         * @type {WT_Runway[]}
         */
        this._runways = runways;

        this._longest;
        for (let runway of this._runways) {
            if (!this._longest || runway.length > this._longest.length) {
                this._longest = runway;
            }
        }
    }

    count() {
        return this._runways.length;
    }

    longest() {
        return this._longest;
    }

    getByIndex(index) {
        return this._runways[index];
    }

    getByDesignation(designation) {
        let index = this._runways.findIndex(runway => runway.designation === designation);
        return this.getByIndex(index);
    }

    [Symbol.iterator]() {
        return this._runways.values();
    }
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
            case 2: this._suffix = WT_Runway.Suffix.R; break;
            case 3: this._suffix = WT_Runway.Suffix.C; break;
            default: this._suffix = WT_Runway.Suffix.NONE;
        }
        this._designation = this._number + this._suffix;
        this._location = new WT_GeoPoint(data.latitude, data.longitude);
        this._elevation = new WT_NumberUnit(data.elevation, WT_Unit.METER);
        this._direction = reverse ? (data.direction + 180) % 360 : data.direction;
        this._length = new WT_NumberUnit(data.length, WT_Unit.METER);
        this._width = new WT_NumberUnit(data.width, WT_Unit.METER);
        this._surface = data.surface;
        this._lighting = data.lighting;

        this._start = this._location.offset(this._direction + 180, this._length.asUnit(WT_Unit.GA_RADIAN) / 2);
        this._end = this._location.offset(this._direction, this._length.asUnit(WT_Unit.GA_RADIAN) / 2);
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
     * @property {WT_GeoPoint} location - the lat/long coordinates of the center of this runway.
     * @type {WT_GeoPoint}
     */
    get location() {
        return this._location.readonly();
    }

    /**
     * @readonly
     * @property {WT_GeoPoint} start - the lat/long coordinates of the start of this runway.
     * @type {WT_GeoPoint}
     */
    get start() {
        return this._start.readonly();
    }

    /**
     * @readonly
     * @property {WT_GeoPoint} end - the lat/long coordinates of the end of this runway.
     * @type {WT_GeoPoint}
     */
    get end() {
        return this._end.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} elevation - the elevation of the center of this runway.
     * @type {WT_NumberUnitReadOnly}
     */
    get elevation() {
        return this._elevation.readonly();
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
     * @property {WT_NumberUnitReadOnly} length - the length of this runway.
     * @type {WT_NumberUnitReadOnly}
     */
    get length() {
        return this._length.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} width - the width of this runway.
     * @type {WT_NumberUnitReadOnly}
     */
    get width() {
        return this._width.readonly();
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

/**
 * @template T
 */
class WT_ProcedureList {
    /**
     * @param {Array<T>} procedures
     */
    constructor(procedures) {
        this._procedures = procedures;
    }

    /**
     *
     * @param {Number} index
     * @returns {T}
     */
    getByIndex(index) {
        return this._procedures[index];
    }

    /**
     *
     * @param {String} name
     * @returns {T}
     */
    getByName(name) {
        let index = this._procedures.findIndex(procedure => procedure.name === name);
        return this.getByIndex(index);
    }

    /**
     * @returns {Iterator<T>}
     */
    [Symbol.iterator]() {
        return this._procedures.values();
    }
}