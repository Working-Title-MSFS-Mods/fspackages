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
        let approach = new WT_Approach(this, data.name, index, data);
        let runway = approach.runway;
        if (runway) {
            runway.addApproach(approach);
        }
        return approach;
    }

    _calculateElevation(runwayData) {
        if (!runwayData) {
            return undefined;
        }

        let sum = 0;
        for (let data of runwayData) {
            sum += data.elevation;
        }
        return WT_Unit.METER.createNumber(sum / runwayData.length);
    }

    _initFrequencies(freqData) {
        return freqData.map(freq => new WT_AirportFrequency(this, freq.name, new WT_Frequency(Math.round(freq.freqMHz * 1000), WT_Frequency.Prefix.KHz)));
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
        if (this.runways.longest()) {
            longestRunwayLength = this.runways.longest().length;
        }

        if (longestRunwayLength && longestRunwayLength.compare(WT_Unit.FOOT.createNumber(8100)) >= 0) {
            return WT_Airport.Size.LARGE;
        }

        if (this.isTowered || longestRunwayLength && longestRunwayLength.compare(WT_Unit.FOOT.createNumber(5000)) >= 0) {
            return WT_Airport.Size.MEDIUM;
        }

        return WT_Airport.Size.SMALL;
    }

    _initFromData(data) {
        super._initFromData(data);

        this._class = data.airportClass;
        this._privacy = data.airportPrivateType;
        this._isTowered = data.towered;
        this._fuel = `${data.fuel1} ${data.fuel2}`;
        this._radarCoverage = data.radarCoverage;
        this._elevation = this._calculateElevation(data.runways);
        this._frequencies = new WT_AirportFrequencyList(this._initFrequencies(data.frequencies));
        this._runways = new WT_RunwayList(this._initRunways(data.runways));
        this._size = this._calculateSize();
        this._timezone = new WT_Timezone(tzlookup(this.location.lat, this.location.long));

        this._departures = new WT_ProcedureList(data.departures.map(this._departureMap.bind(this)));
        this._arrivals = new WT_ProcedureList(data.arrivals.map(this._arrivalMap.bind(this)));
        this._approaches = new WT_ProcedureList(data.approaches.map(this._approachMap.bind(this)));
    }

    /**
     * The size of this airport.
     * @readonly
     * @type {WT_Airport.Size}
     */
    get size() {
        return this._size;
    }

    /**
     * The class of this airport.
     * @readonly
     * @type {WT_Airport.Class}
     */
    get class() {
        return this._class;
    }

    /**
     * The privacy type of this airport.
     * @readonly
     * @type {WT_Airport.Privacy}
     */
    get privacy() {
        return this._privacy;
    }

    /**
     * Whether is airport is tower-controlled.
     * @readonly
     * @type {Boolean}
     */
    get isTowered() {
        return this._isTowered;
    }

    get fuel() {
        return this._fuel;
    }

    /**
     * The type of radar coverage this airport has.
     * @readonly
     * @type {WT_Airport.RadarCoverage}
     */
    get radarCoverage() {
        return this._radarCoverage;
    }

    /**
     * The elevation of this airport.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get elevation() {
        return this._elevation ? this._elevation.readonly() : undefined;
    }

    /**
     * The timezone of this airport.
     * @readonly
     * @type {WT_TimezoneReadOnly}
     */
    get timezone() {
        return this._timezone.readonly();
    }

    /**
     * A list of radio frequencies associated with airport.
     * @readonly
     * @type {WT_AirportFrequencyList}
     */
    get frequencies() {
        return this._frequencies;
    }

    /**
     * A list of runways belonging to this airport.
     * @readonly
     * @type {WT_RunwayList}
     */
    get runways() {
        return this._runways;
    }

    /**
     * A list of standard instrument departure procedures (SIDs) belonging to this airport.
     * @readonly
     * @type {WT_ProcedureList<WT_Departure>}
     */
    get departures() {
        return this._departures;
    }

    /**
     * A list of standard terminal arrival procedures (STARs) belonging to this airport.
     * @readonly
     * @type {WT_ProcedureList<WT_Arrival>}
     */
    get arrivals() {
        return this._arrivals;
    }

    /**
     * A list of approach procedures belonging to this airport.
     * @readonly
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

class WT_AirportFrequency {
    constructor(airport, name, frequency) {
        this._airport = airport;
        this._name = name;
        this._frequency = frequency;
    }

    /**
     * The airport to which this frequency entry belongs.
     * @readonly
     * @type {WT_Airport}
     */
    get airport() {
        return this._airport;
    }

    /**
     * The name of this airport frequency entry.
     * @readonly
     * @type {String}
     */
    get name() {
        return this._name;
    }

    /**
     * The frequency of this airport frequency entry.
     * @readonly
     * @type {WT_Frequency}
     */
    get frequency() {
        return this._frequency;
    }
}

/**
 * A list of airport frequencies.
 */
class WT_AirportFrequencyList {
    /**
     * @param {WT_AirportFrequency[]} frequencies - an array of frequencies with which to initialize this list.
     */
    constructor(frequencies) {
        this._array = new WT_ReadOnlyArray(frequencies);
    }

    /**
     * A read-only array of the frequencies in this list.
     * @readonly
     * @type {WT_ReadOnlyArray<WT_AirportFrequency>}
     */
    get array() {
        return this._array;
    }

    /**
     * Gets a frequency from this list by its name.
     * @param {String} name - the name of the frequency to get.
     * @returns {WT_AirportFrequency} a frequency.
     */
    getByName(name) {
        return this._array.find(frequency => frequency.name === name);
    }
}

/**
 * A list of runways at an airport.
 */
class WT_RunwayList {
    /**
     * @param {WT_Runway[]} runways - an array containing the runways with which to initialize the new list.
     */
    constructor(runways) {
        this._array = new WT_ReadOnlyArray(runways);

        this._longest = this._array.length > 0 ? this._array.reduce((previous, current) => (current.length.compare(previous.length) > 0) ? current : previous) : null;
    }

    /**
     * A read-only array of the runways in this list.
     * @readonly
     * @type {WT_ReadOnlyArray<WT_Runway>}
     */
    get array() {
        return this._array;
    }

    /**
     * Gets the longest runway in this list.
     * @returns {WT_Runway} the longest runway in this list.
     */
    longest() {
        return this._longest;
    }

    /**
     * Gets a runway from this list by its designation.
     * @param {String} designation - the designation of the runway to get.
     * @returns {WT_Runway} a runway.
     */
    getByDesignation(designation) {
        return this._array.find(runway => runway.designation === designation);
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

        this._approaches = [];
        this._approachesReadOnly = new WT_ReadOnlyArray(this._approaches);
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
     * The airport to which this runway belongs.
     * @readonly
     * @type {WT_Airport}
     */
    get airport() {
        return this._airport;
    }

    /**
     * The number of this runway.
     * @readonly
     * @type {Number}
     */
    get number() {
        return this._number;
    }

    /**
     * The suffix of this runway.
     * @readonly
     * @type {WT_Runway.Suffix}
     */
    get suffix() {
        return this._suffix;
    }

    /**
     * The designation of this runway, consisting of the runway number followed by an optional L/C/R suffix.
     * @readonly
     * @type {String}
     */
    get designation() {
        return this._designation;
    }

    /**
     * The designation of the runway pair that contains this runway, or simply this runway's designation if
     * this runway has no reciprocal.
     * @readonly
     * @type {String}
     */
    get pairDesignation() {
        return this._pairDesignation;
    }

    /**
     * The runway that is the opposite of this runway, if one exists.
     * @readonly
     * @type {WT_Runway}
     */
    get reciprocal() {
        return this._reciprocal;
    }

    /**
     * The lat/long coordinates of the center of this runway.
     * @readonly
     * @type {WT_GeoPointReadOnly}
     */
    get location() {
        return this._location.readonly();
    }

    /**
     * The lat/long coordinates of the start of this runway.
     * @readonly
     * @type {WT_GeoPointReadOnly}
     */
    get start() {
        return this._start.readonly();
    }

    /**
     * The lat/long coordinates of the end of this runway.
     * @readonly
     * @type {WT_GeoPointReadOnly}
     */
    get end() {
        return this._end.readonly();
    }

    /**
     * The elevation of the center of this runway.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get elevation() {
        return this._elevation.readonly();
    }

    /**
     * The precise heading of this runway.
     * @readonly
     * @type {Number}
     */
    get direction() {
        return this._direction;
    }

    /**
     * The length of this runway.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get length() {
        return this._length.readonly();
    }

    /**
     * The width of this runway.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get width() {
        return this._width.readonly();
    }

    /**
     * The surface type of this runway.
     * @readonly
     * @type {WT_Runway.Surface}
     */
    get surface() {
        return this._surface;
    }

    /**
     * The lighting type of this runway.
     * @readonly
     * @type {WT_Runway.Lighting}
     */
    get lighting() {
        return this._lighting;
    }

    /**
     * The approaches associated with this runway.
     * @readonly
     * @type {WT_ReadOnlyArray<WT_Approach>}
     */
    get approaches() {
        return this._approachesReadOnly;
    }

    /**
     * Adds an approach associated with this runway.
     * @param {WT_Approach} approach - an approach procedure.
     */
    addApproach(approach) {
        this._approaches.push(approach);
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
        let returnValue = [new WT_Runway(airport, parseInt(designations[0]), data, false)];
        if (designations.length > 1) {
            returnValue.push(new WT_Runway(airport, parseInt(designations[1]), data, true));

            let pairDesignation = `${returnValue[0].designation}-${returnValue[1].designation}`;

            returnValue[0]._pairDesignation = pairDesignation;
            returnValue[0]._reciprocal = returnValue[1];
            returnValue[1]._pairDesignation = pairDesignation;
            returnValue[1]._reciprocal = returnValue[0];
        } else {
            returnValue[0]._pairDesignation = returnValue[0].designation;
            returnValue[0]._reciprocal = null;
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
    GRASS: 1,           // either grass or turf
    CONCRETE: 4,        // definitely a hard surface, but not sure about exact type
    TURF: 12,           // either grass or turf
    GRAVEL: 14,
    ASPHALT: 17,        // definitely a hard surface, but not sure about exact type
    DIRT: 21
};

/**
 * A waypoint centered on a runway.
 */
class WT_RunwayWaypoint extends WT_Waypoint {
    /**
     * @param {WT_Runway} runway - the runway associated with the new waypoint.
     */
    constructor(runway) {
        super();

        this._runway = runway;
        this._ident = `RW${this.runway.number.toString().padStart(2, "0")}${this.runway.suffix}`;
    }

    /**
     * @readonly
     * @property {WT_Runway} runway - the runway associated with this waypoint.
     * @type {WT_Runway}
     */
    get runway() {
        return this._runway;
    }

    /**
     * @readonly
     * @property {String} uniqueID - a unique identifier for this waypoint.
     * @type {String}
     */
    get uniqueID() {
        return `${this.runway.airport.uniqueID}-${this.ident}`;
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
     * @property {String} name - the name of this waypoint.
     * @type {String}
     */
    get name() {
        return `Runway ${this.runway.designation}`;
    }

    /**
     * @readonly
     * @property {WT_GeoPoint} location - the lat/long coordinates of this waypoint.
     * @type {WT_GeoPoint}
     */
    get location() {
        return this.runway.location;
    }
}

/**
 * A list of procedures.
 * @template {WT_Procedure} T
 */
class WT_ProcedureList {
    /**
     * @param {Array<T>} procedures - an array of procedures with which to initialize this list.
     */
    constructor(procedures) {
        this._array = new WT_ReadOnlyArray(procedures);
    }

    /**
     * A read-only array of the runways in this list.
     * @readonly
     * @type {WT_ReadOnlyArray<T>}
     */
    get array() {
        return this._array;
    }

    /**
     * Gets a procedure from this list by its index.
     * @param {Number} index - the index of the procedure to get.
     * @returns {T} a procedure.
     */
    getByIndex(index) {
        return this._array.get(index);
    }

    /**
     * Gets a procedure from this list by its name.
     * @param {String} name - the name of the procedure to get.
     * @returns {T} a procedure.
     */
    getByName(name) {
        return this._array.find(procedure => procedure.name === name);
    }
}