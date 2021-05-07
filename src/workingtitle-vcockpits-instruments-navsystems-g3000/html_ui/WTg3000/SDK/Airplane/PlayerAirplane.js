class WT_PlayerAirplane {
    constructor() {
        this._type = WT_PlayerAirplane.getAircraftType();
        this._sensors = this._createSensors();
        this._environment = this._createEnvironment();
        this._navigation = this._createNavigation();
        this._fms = this._createFMS();
        this._navCom = this._createNavCom();
        this._engineering = this._createEngineering();
        this._controls = this._createControls();
        this._autopilot = this._createAutopilot();
        this._references = this._createReferences();
    }

    static getAircraftType() {
        switch (SimVar.GetSimVarValue("ATC MODEL", "string")) {
            case "TT:ATCCOM.AC_MODEL_TBM9.0.text":
                return WT_PlayerAirplane.Type.TBM930;
            case "TT:ATCCOM.AC_MODEL_C700.0.text":
            case "TT:ATCCOM.AC_MODEL_LONGITUDE.0.text": // for compatibility with Longitude performance mod
                return WT_PlayerAirplane.Type.CITATION_LONGITUDE;
            default:
                return WT_PlayerAirplane.Type.UNKNOWN;
        }
    }

    _createSensors() {
        return new WT_AirplaneSensors(this);
    }

    _createEnvironment() {
        return new WT_AirplaneEnvironment(this);
    }

    _createNavigation() {
        return new WT_AirplaneNavigation(this);
    }

    _createFMS() {
        return new WT_AirplaneFMS(this);
    }

    _createNavCom() {
        return new WT_AirplaneNavCom(this, 2, 2, 1, 1);
    }

    _createEngineering() {
        return new WT_AirplaneEngineering(this);
    }

    _createControls() {
        return new WT_AirplaneControls(this);
    }

    _createAutopilot() {
        return new WT_AirplaneAutopilot();
    }

    _createReferences() {
        return undefined;
    }

    /**
     * The type of this airplane.
     * @readonly
     * @type {WT_PlayerAirplane.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * The sensors component of this airplane.
     * @readonly
     * @type {WT_AirplaneSensors}
     */
    get sensors() {
        return this._sensors;
    }

    /**
     * The environment component of this airplane.
     * @readonly
     * @type {WT_AirplaneEnvironment}
     */
    get environment() {
        return this._environment;
    }

    /**
     * The navigation component of this airplane.
     * @readonly
     * @type {WT_AirplaneNavigation}
     */
    get navigation() {
        return this._navigation;
    }

    /**
     * The flight management system (FMS) component of this airplane.
     * @readonly
     * @type {WT_AirplaneFMS}
     */
    get fms() {
        return this._fms;
    }

    /**
     * The NAV/COM component of this airplane.
     * @readonly
     * @type {WT_AirplaneNavCom}
     */
    get navCom() {
        return this._navCom;
    }

    /**
     * The engineering component of this airplane.
     * @readonly
     * @type {WT_AirplaneEngineering}
     */
    get engineering() {
        return this._engineering;
    }

    /**
     * The flight controls component of this airplane.
     * @readonly
     * @type {WT_AirplaneControls}
     */
    get controls() {
        return this._controls;
    }

    /**
     * The autopilot component of this airplane.
     * @readonly
     * @type {WT_AirplaneAutopilot}
     */
    get autopilot() {
        return this._autopilot;
    }

    /**
     * Reference values for this airplane.
     * @readonly
     * @type {WT_AirplaneReferences}
     */
    get references() {
        return this._references;
    }
}
WT_PlayerAirplane._tempGPH = new WT_NumberUnit(0, WT_Unit.GPH);
/**
 * @enum {Number}
 */
WT_PlayerAirplane.Type = {
    UNKNOWN: 0,
    TBM930: 1,
    CITATION_LONGITUDE: 2
};

class WT_AirplaneComponent {
    constructor(airplane) {
        this._airplane = airplane;
    }

    /**
     * @readonly
     * @type {WT_PlayerAirplane}
     */
    get airplane() {
        return this._airplane;
    }
}

class WT_AirplaneSensors extends WT_AirplaneComponent {
    constructor(airplane, airspeedSensorCount = 2, altimeterCount = 2) {
        super(airplane);

        this._airspeedSensors = [...Array(airspeedSensorCount)].map((value, index) => new WT_AirplaneAirspeedSensor(index + 1));
        this._altimeters = [...Array(altimeterCount)].map((value, index) => new WT_AirplaneAltimeter(index + 1));
    }

    /**
     * Gets an indexed airspeed sensor.
     * @param {Number} index - the index of the airspeed sensor.
     * @returns {WT_AirplaneAirspeedSensor} an airspeed sensor.
     */
    getAirspeedSensor(index) {
        return this._airspeedSensors[index - 1];
    }

    /**
     * Gets an indexed altimeter.
     * @param {Number} index - the index of the altimeter.
     * @returns {WT_AirplaneAltimeter} an altimeter.
     */
    getAltimeter(index) {
        return this._altimeters[index - 1];
    }

    /**
     * Gets the airplane's current pitch.
     * @returns {Number} the airplane's current pitch, in degrees.
     */
    pitch() {
        return SimVar.GetSimVarValue("PLANE PITCH DEGREES", "degrees");
    }

    /**
     * Gets the airplane's current bank.
     * @returns {Number} the airplane's current bank, in degrees.
     */
    bank() {
        return SimVar.GetSimVarValue("PLANE BANK DEGREES", "degrees");
    }

    /**
     * Gets the airplane's current angle of attack.
     * @returns {Number} the airplane's current angle of attack, in degrees.
     */
    aoa() {
        return SimVar.GetGameVarValue("AIRCRAFT AOA ANGLE", "angl16");
    }

    /**
     * Checks whether the airplane is currently on the ground.
     * @returns {Boolean} whether the airplane is currently on the ground.
     */
    isOnGround() {
        return SimVar.GetSimVarValue("SIM ON GROUND", "bool");
    }

    /**
     * Gets the airplane's current vertical speed.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created.
     * @returns {WT_NumberUnit} the current vertical speed of the airplane. Default unit is feet per minute.
     */
    verticalSpeed(reference) {
        let vs = SimVar.GetSimVarValue("VERTICAL SPEED", "feet per minute");
        return reference ? reference.set(vs, WT_Unit.FPM) : new WT_NumberUnit(vs, WT_Unit.FPM);
    }

    /**
     * Gets the airplane's current radar altitude.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of feet.
     * @returns {WT_NumberUnit} the current radar altitude of the airplane.
     */
    radarAltitude(reference) {
        let value = SimVar.GetSimVarValue("RADIO HEIGHT", "feet");
        return reference ? reference.set(value, WT_Unit.FOOT) : new WT_NumberUnit(value, WT_Unit.FOOT);
    }

    /**
     * Converts a mach number to indicated airspeed (IAS) given the aircraft's current situation.
     * @param {Number} mach - the mach number to convert.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of knots.
     * @returns {WT_NumberUnit} the indicated airspeed equivalent of the mach number.
     */
    machToIAS(mach, reference) {
        let value = SimVar.GetGameVarValue("FROM MACH TO KIAS", "number", mach);
        return reference ? reference.set(value, WT_Unit.KNOT) : WT_Unit.KNOT.createNumber(value);
    }

    /**
     * Converts indicated airspeed (IAS) to mach given the aircraft's current situation.
     * @param {WT_NumberUnit} ias - the indicated airspeed to convert.
     * @returns {Number} the mach equivalent of the indicated airspeed.
     */
    iasToMach(ias) {
        return SimVar.GetGameVarValue("FROM KIAS TO MACH", "number", ias.asUnit(WT_Unit.KNOT));
    }
}

class WT_AirplaneAirspeedSensor {
    constructor(index) {
        this._index = index;
    }

    /**
     * The index of this airspeed sensor.
     * @readonly
     * @type {Number}
     */
    get index() {
        return this._index;
    }

    /**
     * Gets this sensor's current calculated indicated airspeed.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of knots.
     * @returns {WT_NumberUnit} this sensor's current calculated indicated airspeed.
     */
    ias(reference) {
        let value = SimVar.GetSimVarValue(`AIRSPEED INDICATED:${this.index}`, "knots");
        return reference ? reference.set(value, WT_Unit.KNOT) : new WT_NumberUnit(value, WT_Unit.KNOT);
    }

    /**
     * Gets this sensor's current calculated true airspeed.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of knots.
     * @returns {WT_NumberUnit} this sensor's current calculated true airspeed.
     */
    tas(reference) {
        let value = SimVar.GetSimVarValue(`AIRSPEED TRUE:${this.index}`, "knots");
        return reference ? reference.set(value, WT_Unit.KNOT) : new WT_NumberUnit(value, WT_Unit.KNOT);
    }

    /**
     * Gets this sensor's current calculated true airspeed in mach units.
     * @returns {Number} this sensor's current calculated true airspeed in mach units.
     */
    mach() {
        return SimVar.GetSimVarValue(`AIRSPEED MACH:${this.index}`, "mach");
    }
}

class WT_AirplaneAltimeter {
    constructor(index) {
        this._index = index;
    }

    /**
     * The index of this altimeter.
     * @readonly
     * @type {Number}
     */
    get index() {
        return this._index;
    }

    /**
     * Gets the current indicated altitude.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of feet.
     * @returns {WT_NumberUnit} the current indicated altitude.
     */
    altitudeIndicated(reference) {
        let value = SimVar.GetSimVarValue(`INDICATED ALTITUDE:${this.index}`, "feet");
        return reference ? reference.set(value, WT_Unit.FOOT) : new WT_NumberUnit(value, WT_Unit.FOOT);
    }

    /**
     * Gets this altimeter's current baro pressure setting.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of hectopascals.
     * @returns {WT_NumberUnit} this altimeter's current baro pressure setting.
     */
    baroPressure(reference) {
        let value = SimVar.GetSimVarValue(`KOHLSMAN SETTING MB:${this.index}`, "millibars");
        return reference ? reference.set(value, WT_Unit.HPA) : new WT_NumberUnit(value, WT_Unit.HPA);
    }

    /**
     * Increments this altimeter's baro pressure setting.
     */
    decrementBaroPressure() {
        SimVar.SetSimVarValue(`K:KOHLSMAN_DEC`, "number", this.index);
    }

    /**
     * Decrements this altimeter's baro pressure setting.
     */
    incrementBaroPressure() {
        SimVar.SetSimVarValue(`K:KOHLSMAN_INC`, "number", this.index);
    }

    setBaroPressure(pressure) {
        SimVar.SetSimVarValue(`K:${this.index}:KOHLSMAN_SET`, "number", pressure.asUnit(WT_Unit.HPA) * 16);
    }
}

class WT_AirplaneEnvironment extends WT_AirplaneComponent {
    /**
     * Gets the pressure altitude at the airplane's current position.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of feet.
     * @returns {WT_NumberUnit} the pressure altitude at the airplane's current position.
     */
    pressureAltitude(reference) {
        let value = SimVar.GetSimVarValue("PRESSURE ALTITUDE", "feet");
        return reference ? reference.set(value, WT_Unit.FOOT) : new WT_NumberUnit(value, WT_Unit.FOOT);
    }

    /**
     * Gets the outside air temperature at the airplane's current position.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of degrees Celsius.
     * @returns {WT_NumberUnit} the outside air temperature at the airplane's current position.
     */
    oat(reference) {
        let value = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "Celsius");
        return reference ? reference.set(value, WT_Unit.CELSIUS) : WT_Unit.CELSIUS.createNumber(value);
    }

    /**
     * Gets the ISA temperature at the airplane's current position.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of degrees Celsius.
     * @returns the ISA temperature at the airplane's current position.
     */
    isaTemperature(reference) {
        let value = SimVar.GetSimVarValue("STANDARD ATM TEMPERATURE", "Celsius");
        return reference ? reference.set(value, WT_Unit.CELSIUS) : WT_Unit.CELSIUS.createNumber(value);
    }

    /**
     * Gets the difference between the outside air temperature at the airplane's current position and ISA temperature.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of degrees Celsius.
     * @returns the difference between the outside air temperature at the airplane's current position and ISA temperature.
     */
    isaTemperatureDelta(reference) {
        let value = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "Celsius") - SimVar.GetSimVarValue("STANDARD ATM TEMPERATURE", "Celsius");
        return reference ? reference.set(value, WT_Unit.CELSIUS) : WT_Unit.CELSIUS.createNumber(value);
    }

    /**
     * Gets the atmospheric pressure at the airplane's current position.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of inHg.
     * @returns {WT_NumberUnit} the atmospheric pressure at the airplane's current position.
     */
    pressure(reference) {
        let value = SimVar.GetSimVarValue("AMBIENT PRESSURE", "inHg");
        return reference ? reference.set(value, WT_Unit.IN_HG) : new WT_NumberUnit(value, WT_Unit.IN_HG);
    }

    /**
     * Gets the wind speed at the airplane's current position.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of knots.
     * @returns {WT_NumberUnit} the wind speed at the airplane's current position.
     */
    windSpeed(reference) {
        let value = SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots");
        return reference ? reference.set(value, WT_Unit.KNOT) : WT_Unit.KNOT.createNumber(value);
    }

    /**
     * Gets the wind direction at the airplane's current position.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of magnetic bearing.
     * @returns {WT_NumberUnit} the wind direction at the airplane's current position.
     */
    windDirection(reference) {
        let value = SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degree");
        let position = this.airplane.navigation.position(WT_AirplaneEnvironment._tempGeoPoint);
        WT_AirplaneEnvironment._tempTrueBearing.setLocation(position);
        if (!reference) {
            reference = new WT_NavAngleUnit(true, position).createNumber(0);
        } else {
            reference.unit.setLocation(position);
        }
        return reference.set(value, WT_AirplaneEnvironment._tempTrueBearing);
    }
}
WT_AirplaneEnvironment._tempGeoPoint = new WT_GeoPoint(0, 0);
WT_AirplaneEnvironment._tempTrueBearing = new WT_NavAngleUnit(false);

class WT_AirplaneNavigation extends WT_AirplaneComponent {
    /**
     * Gets the airplane's current geographic position.
     * @param {WT_GeoPoint} [reference] - a WT_GeoPoint object in which to store the result. If not supplied, a new WT_GeoPoint
     *                                    object will be created.
     * @returns {WT_GeoPoint} the current position of the airplane.
     */
    position(reference) {
        let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        return reference? reference.set(lat, long) : new WT_GeoPoint(lat, long);
    }

    /**
     * Gets the airplane's current heading.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of magnetic heading.
     * @returns {WT_NumberUnit} the airplane's current heading.
     */
    heading(reference) {
        let value = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        let position = this.position(WT_AirplaneNavigation._tempGeoPoint);
        if (reference) {
            WT_AirplaneNavigation._tempNavAngleUnit.setLocation(position);
            reference.unit.setLocation(position);
            reference.set(value, WT_AirplaneNavigation._tempNavAngleUnit);
            return reference;
        } else {
            return new WT_NavAngleUnit(true, position).createNumber(value);
        }
    }

    /**
     * Gets the airplane's current true heading.
     * @returns {Number} the true heading of the airplane in degrees.
     */
    headingTrue() {
        return SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree");
    }

    /**
     * Gets the airplane's current true ground track.
     * @returns {Number} the true track of the airplane in degrees.
     */
    trackTrue() {
        return SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
    }

    /**
     * Gets the airplane's current turn speed.
     * @returns {Number} the current turn speed of the airplane in degrees per second.
     */
    turnSpeed() {
        return SimVar.GetSimVarValue("DELTA HEADING RATE", "degrees per second");
    }

    /**
     * Gets the magnetic variation (declination) at the airplane's current position.
     * @returns {Number} the magnetic variation, in degrees, at the current position of the airplane.
     */
    magVar() {
        return SimVar.GetSimVarValue("GPS MAGVAR", "degree");
    }

    /**
     * Gets the airplane's current true altitude.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of feet.
     * @returns {WT_NumberUnit} the current altitude of the airplane.
     */
    altitude(reference) {
        let value = SimVar.GetSimVarValue("PLANE ALTITUDE", "feet");
        return reference ? reference.set(value, WT_Unit.FOOT) : new WT_NumberUnit(value, WT_Unit.FOOT);
    }

    /**
     * Gets the airplane's current ground speed.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created.
     * @returns {WT_NumberUnit} the current ground speed of the airplane. Default unit is knots.
     */
    groundSpeed(reference) {
        let gs = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
        return reference ? reference.set(gs, WT_Unit.KNOT) : new WT_NumberUnit(gs, WT_Unit.KNOT);
    }
}
WT_AirplaneNavigation._tempGeoPoint = new WT_GeoPoint(0, 0);
WT_AirplaneNavigation._tempNavAngleUnit = new WT_NavAngleUnit(true);

class WT_AirplaneFMS extends WT_AirplaneComponent {
    /**
     * @readonly
     * @property {WT_FlightPlanManager} flightPlanManager - the flight plan manager associated with this FMS.
     * @type {WT_FlightPlanManager}
     */
    get flightPlanManager() {
        return this._fpm;
    }

    /**
     * Associates a flight plan manager with this FMS.
     * @param {WT_FlightPlanManager} fpm - a flight plan manager.
     */
    setFlightPlanManager(fpm) {
        this._fpm = fpm;
    }

    /**
     * Checks whether this FMS is tracking a target.
     * @returns {Boolean} whether this FMS is tracking a target.
     */
    hasTarget() {
        return SimVar.GetSimVarValue("GPS IS ACTIVE WAY POINT", "Bool") === 1;
    }

    /**
     * Gets the ident string of this FMS's tracked target.
     * @returns {String} the ident string of this FMS's tracked target, or null if this FMS is not tracking a target.
     */
    targetIdent() {
        return this.hasTarget() ? SimVar.GetSimVarValue("GPS WP NEXT ID", "string") : null;
    }

    /**
     * Gets the distance to this FMS's tracked target.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of nautical miles.
     * @returns {WT_NumberUnit} the distance to this FMS's tracked target, or null if this FMS is not tracking a target.
     */
    targetDistance(reference) {
        if (!this.hasTarget()) {
            return null;
        }

        let value = SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical miles");
        return reference ? reference.set(value, WT_Unit.NMILE) : WT_Unit.NMILE.createNumber(value);
    }

    /**
     * Gets the initial bearing (forward azimuth) to this FMS's tracked target.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of magnetic bearing.
     * @returns {WT_NumberUnit} the initial bearing to this FMS's tracked target, or null if this FMS is not tracking a target.
     */
    targetBearing(reference) {
        if (!this.hasTarget()) {
            return null;
        }

        let value = SimVar.GetSimVarValue("GPS WP BEARING", "degree");
        let position = this.airplane.navigation.position(WT_AirplaneFMS._tempGeoPoint);
        if (reference) {
            WT_AirplaneFMS._tempNavAngleUnit.setLocation(position);
            reference.unit.setLocation(position);
            reference.set(value, WT_AirplaneFMS._tempNavAngleUnit);
            return reference;
        } else {
            return new WT_NavAngleUnit(true, position).createNumber(value);
        }
    }

    /**
     * Gets the estimated time enroute to this FMS's tracked target. The ETE is calculated using the current distance to the target
     * and the current groundspeed of the airplane.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of seconds.
     * @returns {WT_NumberUnit} the estimated time enroute to this FMS's tracked target, or null if this FMS is not tracking a target.
     */
    targetETE(reference) {
        if (!this.hasTarget()) {
            return null;
        }

        let value = SimVar.GetSimVarValue("GPS WP ETE", "seconds");
        return reference ? reference.set(value, WT_Unit.SECOND) : WT_Unit.SECOND.createNumber(value);
    }

    /**
     * Gets the currently activated approach type.
     * @returns {WT_AirplaneFMS.ApproachType} the currently activated approach type.
     */
    approachType() {
        return SimVar.GetSimVarValue("GPS APPROACH APPROACH TYPE", "Enum");
    }

    /**
     * Gets the angle of the active glidepath.
     * @returns {Number} the angle, in degrees, of the active glidepath.
     */
    glidepathAngle() {
        return SimVar.GetSimVarValue("GPS VERTICAL ANGLE", "degrees");
    }

    /**
     * Gets the angular difference between the aircraft's current position and the active glidepath.
     * @returns {Number} the angular difference, in degrees, between the aircraft's current position and the active glidepath.
     */
    glidepathError() {
        return SimVar.GetSimVarValue("GPS VERTICAL ANGLE ERROR", "radians") * Avionics.Utils.RAD2DEG;
    }

    /**
     * Gets the vertical deviation between the aircraft's current position and the active glidepath.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of feet.
     * @returns {WT_NumberUnit} the vertical deviation between the aircraft's current position and the active glidepath.
     */
    glidepathDeviation(reference) {
        let value = SimVar.GetSimVarValue("GPS VERTICAL ERROR", "feet");
        return reference ? reference.set(value, WT_Unit.FOOT) : WT_Unit.FOOT.createNumber(value);
    }
}
WT_AirplaneFMS._tempGeoPoint = new WT_GeoPoint(0, 0);
WT_AirplaneFMS._tempNavAngleUnit = new WT_NavAngleUnit(true);
/**
 * @enum {Number}
 */
WT_AirplaneFMS.ApproachType = {
    UNKNOWN: 0,
    GPS: 1,
    VOR: 2,
    NDB: 3,
    ILS: 4,
    LOC: 5,
    SDF: 6,
    LDA: 7,
    VOR_DME: 8,
    NDB_DME: 9,
    RNAV: 10,
    LOC_BACK_COURSE: 11
}

class WT_AirplaneNavCom extends WT_AirplaneComponent {
    constructor(airplane, numComSlots, numNavSlots, numADFSlots, numXPDRs) {
        super(airplane);

        this._comSlots = [...Array(numComSlots)].map((e, i) => new WT_AirplaneComSlot(airplane, i + 1));
        this._navSlots = [...Array(numNavSlots)].map((e, i) => new WT_AirplaneNavSlot(airplane, i + 1));
        this._adfSlots = [...Array(numADFSlots)].map((e, i) => new WT_AirplaneADFSlot(airplane, i + 1));
        this._xpdrs = [...Array(numXPDRs)].map((e, i) => new WT_AirplaneTransponder(i + 1));
    }

    /**
     *
     * @param {Number} index
     * @returns {WT_AirplaneComSlot}
     */
    getCom(index) {
        return this._comSlots[index - 1];
    }

    /**
     *
     * @param {Number} index
     * @returns {WT_AirplaneNavSlot}
     */
    getNav(index) {
        return this._navSlots[index - 1];
    }

    /**
     *
     * @param {Number} index
     * @returns {WT_AirplaneADFSlot}
     */
    getADF(index) {
        return this._adfSlots[index - 1];
    }

    /**
     *
     * @param {Number} index
     * @returns {WT_AirplaneTransponder}
     */
    getTransponder(index) {
        return this._xpdrs[index - 1];
    }
}

class WT_AirplaneRadioSlot {
    constructor(airplane, index) {
        this._airplane = airplane;
        this._index = index;
    }

    /**
     * @readonly
     * @property {WT_PlayerAirplane} index
     * @type {WT_PlayerAirplane}
     */
    get airplane() {
        return this._airplane;
    }

    /**
     * @readonly
     * @property {Number} index
     * @type {Number}
     */
    get index() {
        return this._index;
    }

    /**
     * @readonly
     * @property {String} name
     * @type {String}
     */
    get name() {
        return undefined;
    }

    /**
     * Gets this radio's active frequency.
     * @returns {WT_Frequency} this radio's active frequency.
     */
    activeFrequency() {
    }

    /**
     * Gets this radio's standby frequency.
     * @returns {WT_Frequency} this radio's standby frequency.
     */
    standbyFrequency() {
    }

    /**
     * Sets this radio's active frequency.
     * @param {WT_Frequency} frequency - the new frequency.
     */
    setActiveFrequency(frequency) {
    }

    /**
     * Sets this radio's standby frequency.
     * @param {WT_Frequency} frequency - the new frequency.
     */
    setStandbyFrequency(frequency) {
    }

    /**
     * Swaps this radio's active and standby frequencies.
     */
    swapFrequency() {
    }
}

class WT_AirplaneComSlot extends WT_AirplaneRadioSlot {
    /**
     * @readonly
     * @property {String} name
     * @type {String}
     */
    get name() {
        return `COM${this.index}`;
    }

    /**
     * Gets this radio's active frequency.
     * @returns {WT_Frequency} this radio's active frequency.
     */
    activeFrequency() {
        return new WT_Frequency(SimVar.GetSimVarValue(`COM ACTIVE FREQUENCY:${this.index}`, "Hz"));
    }

    /**
     * Gets this radio's standby frequency.
     * @returns {WT_Frequency} this radio's standby frequency.
     */
    standbyFrequency() {
        return new WT_Frequency(SimVar.GetSimVarValue(`COM STANDBY FREQUENCY:${this.index}`, "Hz"));
    }

    /**
     * Sets this radio's active frequency.
     * @param {WT_Frequency} frequency - the new frequency.
     */
    setActiveFrequency(frequency) {
        SimVar.SetSimVarValue(`K:COM${this.index === 1 ? "" : this.index}_RADIO_SET_HZ`, "Hz", frequency.hertz());
    }

    /**
     * Sets this radio's standby frequency.
     * @param {WT_Frequency} frequency - the new frequency.
     */
    setStandbyFrequency(frequency) {
        SimVar.SetSimVarValue(`K:COM${this.index === 1 ? "" : this.index}_STBY_RADIO_SET_HZ`, "Hz", frequency.hertz());
    }

    /**
     * Swaps this radio's active and standby frequencies.
     */
    swapFrequency() {
        SimVar.SetSimVarValue(`K:COM${this.index === 1 ? "" : this.index}${this.index === 1 ? "_STBY" : ""}_RADIO_SWAP`, "Bool", 1);
    }
}

class WT_AirplaneNavSlot extends WT_AirplaneRadioSlot {
    /**
     * @readonly
     * @property {String} name
     * @type {String}
     */
    get name() {
        return `NAV${this.index}`;
    }

    /**
     * Gets this radio's active frequency.
     * @returns {WT_Frequency} this radio's active frequency.
     */
    activeFrequency() {
        return new WT_Frequency(SimVar.GetSimVarValue(`NAV ACTIVE FREQUENCY:${this.index}`, "Hz"));
    }

    /**
     * Gets this radio's standby frequency.
     * @returns {WT_Frequency} this radio's standby frequency.
     */
    standbyFrequency() {
        return new WT_Frequency(SimVar.GetSimVarValue(`NAV STANDBY FREQUENCY:${this.index}`, "Hz"));
    }

    /**
     * Sets this radio's active frequency.
     * @param {WT_Frequency} frequency - the new frequency.
     */
    setActiveFrequency(frequency) {
        SimVar.SetSimVarValue(`K:NAV${this.index}_RADIO_SET_HZ`, "Hz", frequency.hertz());
    }

    /**
     * Sets this radio's standby frequency.
     * @param {WT_Frequency} frequency - the new frequency.
     */
    setStandbyFrequency(frequency) {
        SimVar.SetSimVarValue(`K:NAV${this.index}_STBY_SET_HZ`, "Hz", frequency.hertz());
    }

    /**
     * Swaps this radio's active and standby frequencies.
     */
    swapFrequency() {
        SimVar.SetSimVarValue(`K:NAV${this.index}_RADIO_SWAP`, "Bool", 1);
    }

    /**
     * Checks whether this radio is currently receiving a signal.
     * @returns {Boolean} whether this radio is currently receiving a signal.
     */
    isReceiving() {
        return SimVar.GetSimVarValue(`NAV SIGNAL:${this.index}`, "number") > 0;
    }

    /**
     * Gets the identifier of the tuned navigation station.
     * @returns {String} the identifier of the tuned navigation station, or null if this radio is not currently receiving.
     */
    ident() {
        return this.isReceiving() ? SimVar.GetSimVarValue(`NAV IDENT:${this.index}`, "string") : null;
    }

    /**
     * Checks whether the tuned navigation station is sending directional information.
     * @returns {Boolean} whether the tuned navigation station is sending directional information.
     */
    hasDirection() {
        return SimVar.GetSimVarValue(`NAV HAS NAV:${this.index}`, "Bool") !== 0;
    }

    /**
     * Gets the radial of the tuned navigation station on which the airplane's current position lies.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of magnetic bearing.
     * @returns {WT_NumberUnit} the radial of the tuned navigation station on which the airplane's current position lies, or null if
     *                          this radio is not currently receiving or the tuned navigation station is not sending directional
     *                          information.
     */
    radial(reference) {
        if (!this.isReceiving() || !this.hasDirection()) {
            return null;
        }

        let value = SimVar.GetSimVarValue(`NAV RADIAL:${this.index}`, "degree");
        let position = this.airplane.navigation.position(WT_AirplaneNavSlot._tempGeoPoint);
        if (reference) {
            WT_AirplaneNavSlot._tempNavAngleUnit.setLocation(position);
            reference.unit.setLocation(position);
            reference.set(value, WT_AirplaneNavSlot._tempNavAngleUnit);
            return reference;
        } else {
            return new WT_NavAngleUnit(true, position).createNumber(value);
        }
    }

    /**
     * Checks whether the tuned navigation station is sending DME distance information.
     * @returns {Boolean} whether the tuned navigation station is sending DME distance information.
     */
    hasDME() {
        return SimVar.GetSimVarValue(`NAV HAS DME:${this.index}`, "Boolean") !== 0;
    }

    /**
     * Gets the distance from the airplane's current position to the tuned navigation station.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of nautical miles.
     * @returns {WT_NumberUnit} the distance to the tuned navigation station, or null if this radio is not currently receiving or the
     *                          tuned navigation station is not equipped with DME.
     */
    dme(reference) {
        if (!this.isReceiving() || !this.hasDME()) {
            return null;
        }

        let value = SimVar.GetSimVarValue(`NAV DME:${this.index}`, "nautical miles");
        return reference ? reference.set(value, WT_Unit.NMILE) : new WT_Unit.NMILE.createNumber(value);
    }

    /**
     * Checks whether the tuned navigation station is equipped with a localizer.
     * @returns {Boolean} whether the tuned navigation station is equipped with a localizer.
     */
    hasLOC() {
        return SimVar.GetSimVarValue(`NAV HAS LOCALIZER:${this.index}`, "Boolean") !== 0;
    }

    /**
     * Checks whether the tuned navigation station is equipped with a glideslope.
     * @returns {Boolean} whether the tuned navigation station is equipped with a glideslope.
     */
    hasGS() {
        return SimVar.GetSimVarValue(`NAV HAS GLIDE SLOPE:${this.index}`, "Boolean") !== 0;
    }

    /**
     * Gets the angular difference between the aircraft's current position and the glideslope of the tuned navigation station.
     * @returns {Number} the angular difference, in degrees, between the aircraft's current position and the glideslope of the tuned
     *                   navigation station, or null if this radio is not currently receiving or the tuned navigation station is
     *                   equipped with a glideslope.
     */
    glideslopeError() {
        if (!this.isReceiving() || !this.hasGS()) {
            return null;
        }

        return SimVar.GetSimVarValue(`NAV GLIDE SLOPE ERROR:${this.index}`, "radians") * Avionics.Utils.RAD2DEG;
    }
}
WT_AirplaneNavSlot._tempGeoPoint = new WT_GeoPoint(0, 0);
WT_AirplaneNavSlot._tempNavAngleUnit = new WT_NavAngleUnit(true);

class WT_AirplaneADFSlot extends WT_AirplaneRadioSlot {
    /**
     * @readonly
     * @property {String} name
     * @type {String}
     */
    get name() {
        return `ADF${this.index}`;
    }

    /**
     * Gets this radio's active frequency.
     * @returns {WT_Frequency} this radio's active frequency.
     */
    activeFrequency() {
        return new WT_Frequency(SimVar.GetSimVarValue(`ADF ACTIVE FREQUENCY:${this.index}`, "Hz"));
    }

    /**
     * Gets this radio's standby frequency.
     * @returns {WT_Frequency} this radio's standby frequency.
     */
    standbyFrequency() {
        return new WT_Frequency(SimVar.GetSimVarValue(`ADF STANDBY FREQUENCY:${this.index}`, "Hz"));
    }

    /**
     * Sets this radio's active frequency.
     * @param {WT_Frequency} frequency - the new frequency.
     */
    setActiveFrequency(frequency) {
        SimVar.SetSimVarValue(`K:ADF${this.index === 1 ? "" : this.index}_COMPLETE_SET`, "Frequency ADF BCD32", frequency.bcd32());
    }

    /**
     * Sets this radio's standby frequency.
     * @param {WT_Frequency} frequency - the new frequency.
     */
    setStandbyFrequency(frequency) {
        SimVar.SetSimVarValue(`K:ADF${this.index === 1 ? "" : this.index}_STBY_SET`, "Frequency ADF BCD32", frequency.bcd32());
    }

    /**
     * Swaps this radio's active and standby frequencies.
     */
    swapFrequency() {
        SimVar.SetSimVarValue(`K:ADF${this.index}_RADIO_SWAP`, "Boolean", 0);
    }

    isReceiving() {
        return SimVar.GetSimVarValue(`ADF SIGNAL:${this.index}`, "number") > 0;
    }

    /**
     * Gets the bearing of the tuned navigation station relative to the airplane's current heading.
     * @returns {Number} the bearing of the tuned navigation station relative to the airplane's current heading, or null if
     *                   this radio is not currently receiving.
     */
    bearing() {
        if (!this.isReceiving()) {
            return null;
        }

        return (SimVar.GetSimVarValue(`ADF RADIAL:${this.index}`, "degree") + 360) % 360;
    }
}

class WT_AirplaneTransponder {
    constructor(index) {
        this._index = index;
    }

    /**
     * The index of this transponder.
     * @readonly
     * @type {Number}
     */
    get index() {
        return this._index;
    }

    /**
     * Gets this transponder's current mode.
     * @returns {WT_AirplaneTransponder.Mode} this transponder's current mode.
     */
    mode() {
        return SimVar.GetSimVarValue(`TRANSPONDER STATE:${this.index}`, "number");
    }

    /**
     * Sets this transponder's current mode.
     * @param {WT_AirplaneTransponder.Mode} mode - the new mode.
     */
    setMode(mode) {
        SimVar.SetSimVarValue(`TRANSPONDER STATE:${this.index}`, "number", mode);
    }

    /**
     * Gets this transponder's current code.
     * @returns {Number} this transponder's current code.
     */
    code() {
        return SimVar.GetSimVarValue(`TRANSPONDER CODE:${this.index}`, "number");
    }
}
/**
 * @enum {Number}
 */
WT_AirplaneTransponder.Mode = {
    STANDBY: 1,
    ON: 3,
    ALT: 4
};

class WT_AirplaneEngineering extends WT_AirplaneComponent {
    constructor(airplane) {
        super(airplane);

        this._engineCount = SimVar.GetSimVarValue("NUMBER OF ENGINES", "number");
        this._engines = [...Array(this._engineCount)].map((value, index) => new WT_AirplaneEngine(index + 1));
    }

    /**
     * The number of engines on this airplane.
     * @readonly
     * @type {Number}
     */
    get engineCount() {
        return this._engineCount;
    }

    /**
     * Gets an indexed engine.
     * @param {Number} index - the index of the engine.
     * @returns {WT_AirplaneEngine} an indexed engine.
     */
    getEngine(index) {
        return this._engines[index - 1];
    }

    /**
     * Gets the current amount of fuel remaining on the airplane.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of gallons.
     * @returns {WT_NumberUnit} the current amount of fuel remaining on the airplane.
     */
    fuelOnboard(reference) {
        let value = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons");
        return reference ? reference.set(value, WT_Unit.GALLON) : WT_Unit.GALLON.createNumber(value);
    }

    /**
     * Gets the total fuel consumption of the airplane, which is the sum of the fuel consumption of all engines.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of gallons per hour.
     * @returns {WT_NumberUnit} the current total fuel consumption of the airplane.
     */
    fuelFlowTotal(reference) {
        let fuelFlow = reference ? reference.set(0) : WT_Unit.GPH.createNumber(0);
        for (let i = 0; i < this.engineCount; i++) {
            fuelFlow.add(this.getEngine(i + 1).fuelFlow(WT_PlayerAirplane._tempGPH));
        }
        return fuelFlow;
    }

    /**
     * Gets the fuel consumption of an engine.
     * @param {Number} index - the index of the engine.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of gallons per hour.
     * @returns {WT_NumberUnit} the current fuel consumption of the engine.
     */
    fuelFlow(index, reference) {
        let value = SimVar.GetSimVarValue(`ENG FUEL FLOW GPH:${index + 1}`, "gallons per hour");
        return reference ? reference.set(value, WT_Unit.GPH) : WT_Unit.GPH.createNumber(value);
    }

    /**
     * Gets the value of an indexed light potentiometer setting. Values range from 0 to 1.
     * @param {Number} index - the index of the setting.
     * @returns {Number} the value of the indexed light potentiometer setting.
     */
    potentiometer(index) {
        return SimVar.GetSimVarValue(`A:LIGHT POTENTIOMETER:${index}`, "number");
    }
}

class WT_AirplaneEngine {
    constructor(index) {
        this._index = index;
        this._type = SimVar.GetSimVarValue(`ENGINE TYPE:${index}`, "Enum");
    }

    /**
     * The index of this engine.
     * @readonly
     * @type {Number}
     */
    get index() {
        return this._index;
    }

    /**
     * The type of this engine.
     * @readonly
     * @type {WT_AirplaneEngine.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * Checks whether this engine is running.
     * @returns {Boolean} whether this engine is running.
     */
    isRunning() {
        return SimVar.GetSimVarValue(`ENG COMBUSTION:${this.index}`, "Boolean") !== 0;
    }

    /**
     * Gets the fuel consumption of this engine.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of gallons per hour.
     * @returns {WT_NumberUnit} the current fuel consumption of this engine.
     */
    fuelFlow(reference) {
        let value = SimVar.GetSimVarValue(`ENG FUEL FLOW GPH:${this.index}`, "gallons per hour");
        return reference ? reference.set(value, WT_Unit.GPH) : WT_Unit.GPH.createNumber(value);
    }

    /**
     * Gets this engine's current N1 speed expressed as a fraction between 0 and 1.
     * @returns {Number} this engine's current N1 speed.
     */
    n1() {
        return SimVar.GetSimVarValue(`ENG N1 RPM:${this.index}`, "number");
    }

    /**
     * Gets this engine's current N2 speed expressed as a fraction between 0 and 1.
     * @returns this engine's current N2 speed.
     */
    n2() {
        return SimVar.GetSimVarValue(`ENG N2 RPM:${this.index}`, "number");
    }

    /**
     * Gets the target N1 speed currently commanded for this engine expressed as a fraction between 0 and 1.
     * @returns {Number} the target N1 speed currently commanded for this engine.
     */
    commandedN1() {
        return SimVar.GetSimVarValue(`TURB ENG THROTTLE COMMANDED N1:${this.index}`, "Number");
    }
}
/**
 * @enum {Number}
 */
WT_AirplaneEngine.Type = {
    PISTON: 0,
    JET: 1,
    NONE: 2,
    HELO_TURBINE: 3,
    UNSUPPORTED: 4,
    TURBOPROP: 5
};

class WT_AirplaneControls extends WT_AirplaneComponent {
    /**
     * Gets this airplane's current throttle position expressed as a fraction between 0 and 1.
     * @param {Number} index - the index of the throttle.
     * @returns {Number} this airplane's current throttle position.
     */
    throttlePosition(index) {
        return SimVar.GetSimVarValue(`GENERAL ENG THROTTLE LEVER POSITION:${index}`, "Number");
    }

    /**
     * Gets this airplane's current flaps position.
     * @returns {Number} this airplane's current flaps position.
     */
    flapsPosition() {
        return SimVar.GetSimVarValue("FLAPS HANDLE INDEX", "Number");
    }

    /**
     * Checks whether this airplane's gear handle is in the down position.
     * @returns {Boolean} whether this airplane's gear handle is in the down position.
     */
    isGearHandleDown() {
        return SimVar.GetSimVarValue("GEAR HANDLE POSITION", "Number") !== 0;
    }
}
/**
 * @enum {Number}
 */
WT_AirplaneControls.GearPosition = {
    UNKNOWN: 0,
    UP: 1,
    DOWN: 2
}

class WT_AirplaneAutopilot extends WT_AirplaneComponent {
    constructor(airplane) {
        super(airplane);

        this._flightDirector = this._createFlightDirector();
    }

    _createFlightDirector() {
        return new WT_AirplaneFlightDirector();
    }

    /**
     * The flight director.
     * @readonly
     * @type {WT_AirplaneFlightDirector}
     */
    get flightDirector() {
        return this._flightDirector;
    }

    /**
     * Checks whether the autopilot is active.
     * @returns {Boolean} whether the autopilot is active.
     */
    isMasterActive() {
        return SimVar.GetSimVarValue("AUTOPILOT MASTER", "Boolean") === 1;
    }

    /**
     * Checks whether the autothrottle is active.
     * @returns {Boolean} whether the autothrottle is active.
     */
    isAutoThrottleActive() {
        return SimVar.GetSimVarValue("AUTOPILOT MANAGED THROTTLE ACTIVE", "Boolean") !== 0;
    }

    /**
     * Checks whether Take-off/Go-around (TOGA) Mode is active.
     * @returns {Boolean} whether Take-off/Go-around Mode is active.
     */
    isTOGAActive() {
        return SimVar.GetSimVarValue("AUTOPILOT TAKEOFF POWER ACTIVE", "Boolean") !== 0;
    }

    /**
     * Gets the autothrottle's throttle limit. This value represents a throttle lever position, expressed as a
     * fraction between 0 and 1.
     * @returns {Number} the autothrottle's throttle limit.
     */
    autoThrottleThrottleLimit() {
        return SimVar.GetSimVarValue("AUTOPILOT THROTTLE MAX THRUST", "number");
    }

    /**
     * Sets the autothrottle's throttle limit.
     * @param {Number} limit - the new throttle limit. The value should represent a throttle lever position, expressed
     * as a fraction between 0 and 1.
     */
    setAutoThrottleThrottleLimit(limit) {
        SimVar.SetSimVarValue("AUTOPILOT THROTTLE MAX THRUST", "number", Math.max(0, Math.min(1, limit)));
    }

    /**
     * Checks whether the yaw damper is active.
     * @returns {Boolean} whether the yaw damper is active.
     */
    isYawDamperActive() {
        return SimVar.GetSimVarValue("AUTOPILOT YAW DAMPER", "Boolean") !== 0;
    }

    /**
     * Checks whether Wing Leveler Mode is active.
     * @returns {Boolean} whether Wing Leveler Mode is active.
     */
    isWingLevelerActive() {
        return SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Boolean") !== 0;
    }

    /**
     * Checks whether Bank Hold Mode is active.
     * @returns {Boolean} whether Bank Hold Mode is active.
     */
    isBankHoldActive() {
        return SimVar.GetSimVarValue("AUTOPILOT BANK HOLD", "Boolean") !== 0;
    }

    /**
     * Checks whether Heading Hold Mode is active.
     * @returns {Boolean} whether Heading Hold Mode is active.
     */
    isHeadingHoldActive() {
        return SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean") !== 0;
    }

    /**
     * Checks whether Lateral Navigation Mode is active.
     * @returns {Boolean} whether Lateral Navigation Mode is active.
     */
    isNAVActive() {
        return !this.isWingLevelerActive() && !this.isBankHoldActive() && !this.isHeadingHoldActive() && (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean") !== 0 || this.isApproachActive()) && !this.isBackCourseActive();
    }

    /**
     * Checks whether Lateral Navigation Mode is armed.
     * @returns {Boolean} whether Lateral Navigation Mode is armed.
     */
    isNAVArmed() {
        return (this.isWingLevelerActive() || this.isBankHoldActive() || this.isHeadingHoldActive()) && (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean") !== 0 || this.isApproachActive()) && !this.isBackCourseArmed();
    }

    /**
     * Gets the current navigation source of the autopilot.
     * @returns {WT_AirplaneAutopilot.NavSource} the current navigation souce of the autopilot.
     */
    navigationSource() {
        if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
            return WT_AirplaneAutopilot.NavSource.FMS;
        } else {
            return SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "number");
        }
    }

    /**
     * Sets the navigation source of the autopilot.
     * @param {WT_AirplaneAutopilot.NavSource} source - the new navigation source.
     */
    setNavigationSource(source) {
        if (source === WT_AirplaneAutopilot.NavSource.FMS) {
            if (this.navigationSource() !== WT_AirplaneAutopilot.NavSource.FMS) {
                SimVar.SetSimVarValue("K:TOGGLE_GPS_DRIVES_NAV1", "number", 1);
            }
        } else {
            if (this.navigationSource() === WT_AirplaneAutopilot.NavSource.FMS) {
                SimVar.SetSimVarValue("K:TOGGLE_GPS_DRIVES_NAV1", "number", 0);
            }
            SimVar.SetSimVarValue("K:AP_NAV_SELECT_SET", "number", source);
        }
    }

    /**
     * Checks whether Pitch Hold Mode is active.
     * @returns {Boolean} whether Pitch Hold Mode is active.
     */
    isPitchHoldActive() {
        return SimVar.GetSimVarValue("AUTOPILOT PITCH HOLD", "Boolean") !== 0;
    }

    /**
     * Checks whether Flight Level Change Mode is active.
     * @returns {Boolean} whether Flight Level Change Mode is active.
     */
    isFLCActive() {
        return SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "Boolean") !== 0;
    }

    /**
     * Checks whether Airspeed Hold Mode is active.
     * @returns {Boolean} whether Airspeed Hold Mode is active.
     */
    isAirspeedHoldActive() {
        return SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD", "Boolean") || SimVar.GetSimVarValue("AUTOPILOT MACH HOLD", "Boolean") !== 0;
    }

    /**
     * Checks whether the current reference airspeed units is Mach.
     * @returns {Boolean} whether the current reference airspeed units is Mach.
     */
    isSpeedReferenceMach() {
        return SimVar.GetSimVarValue("AUTOPILOT MACH HOLD", "Boolean") !== 0 || SimVar.GetSimVarValue("L:XMLVAR_AirSpeedIsInMach", "Boolean") !== 0 || SimVar.GetSimVarValue("AUTOPILOT MANAGED SPEED IN MACH", "Boolean") !== 0;
    }

    /**
     * Checks whether Vertical Speed Mode is active.
     * @returns {Boolean} whether Vertical Speed Mode is active.
     */
    isVSActive() {
        return SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean") !== 0;
    }

    /**
     * Checks whether Altitude Hold mode is active.
     * @returns {Boolean} whether Altitude Hold Mode is active.
     */
    isAltHoldActive() {
        return SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Boolean") === 1 && !this.isAltHoldArmed();
    }

    /**
     * Checks whether Altitude Hold Mode is armed.
     * @returns {Boolean} whether Altitude Hold Mode is armed.
     */
    isAltHoldArmed() {
        return SimVar.GetSimVarValue("AUTOPILOT ALTITUDE ARM", "Boolean") === 1;
    }

    /**
     * Checks whether Selected Altitude Capture Mode is active.
     * @returns {Boolean} whether Selected Altitude Capture Mode is active.
     */
    isALTSActive() {
        return SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Boolean") === 1 && this.isAltHoldArmed();
    }

    /**
     * Checks whether Selected Altitude Capture Mode is armed.
     * @returns {Boolean} whether Selected Altitude Capture Mode is armed.
     */
    isALTSArmed() {
        return !this.isAltHoldArmed() && (this.isPitchHoldActive() || this.isVSActive() || this.isFLCActive());
    }

    /**
     * Checks whether Approach Mode is active.
     * @returns {Boolean} whether Approach Mode is active.
     */
    isApproachActive() {
        return SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Boolean") !== 0;
    }

    /**
     * Checks whether the autopilot has successfully captured an approach.
     * @returns {Boolean} whether the autopilot has captured an approach.
     */
    isApproachCaptured() {
        return SimVar.GetSimVarValue("AUTOPILOT APPROACH CAPTURED", "Boolean") !== 0;
    }

    /**
     * Checks whether Back Course Mode is active.
     * @returns {Boolean} whether Back Course Mode is active.
     */
    isBackCourseActive() {
        if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "Boolean") !== 0 && (this.isApproachActive() || SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean") !== 0)) {
            let navIndex;
            switch (this.navigationSource()) {
                case WT_AirplaneAutopilot.NavSource.FMS:
                    return false;
                case WT_AirplaneAutopilot.NavSource.NAV1:
                    navIndex = 1;
                    break;
                case WT_AirplaneAutopilot.NavSource.NAV2:
                    navIndex = 2;
                    break;
                case WT_AirplaneAutopilot.NavSource.NAV3:
                    navIndex = 3;
                    break;
            }
            let bcFlags = SimVar.GetSimVarValue(`NAV BACK COURSE FLAGS:${navIndex}`, "number");
            return (bcFlags & 131) !== 0;
        } else {
            return false;
        }
    }

    /**
     * Checks whether Back Course Mode is armed.
     * @returns {Boolean} whether Back Course Mode is armed.
     */
    isBackCourseArmed() {
        return !this.isBackCourseActive() && SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "Boolean") !== 0;
    }

    /**
     * Checks whether glideslope capture is armed.
     * @returns {Boolean} whether glideslope capture is armed.
     */
    isGSArmed() {
        return this.isApproachActive() && SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ARM", "Boolean") !== 0;
    }

    /**
     * Checks whether the autopilot has captured a glideslope.
     * @returns {Boolean} whether the autopilot has captured a glideslope.
     */
    isGSCaptured() {
        return SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ACTIVE", "Boolean") !== 0;
    }

    /**
     * Gets the autopilot's altitude hold setting.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of feet.
     * @returns {WT_NumberUnit} - the autopilot's altitude hold setting.
     */
    referenceAltitude(reference) {
        let value = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:2", "feet");
        return reference ? reference.set(value, WT_Unit.FOOT) : WT_Unit.FOOT.createNumber(value);
    }

    /**
     * Gets the autopilot's selected altitude setting.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of feet.
     * @returns {WT_NumberUnit} - the autopilot's selected altitude setting.
     */
    selectedAltitude(reference) {
        let value = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:1", "feet");
        return reference ? reference.set(value, WT_Unit.FOOT) : WT_Unit.FOOT.createNumber(value);
    }

    /**
     * Gets the autopilot's reference airspeed setting.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of knots.
     * @returns {WT_NumberUnit} - the autopilot's reference airspeed setting.
     */
    referenceAirspeed(reference) {
        let value = SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR", "knots");
        return reference ? reference.set(value, WT_Unit.KNOT) : WT_Unit.KNOT.createNumber(value);
    }

    /**
     * Gets the autopilot's reference Mach setting.
     * @returns {Number} - the autopilot's reference Mach setting.
     */
    referenceMach() {
        return SimVar.GetSimVarValue("AUTOPILOT MACH HOLD VAR", "Number");
    }

    /**
     * Gets the autopilot's reference vertical speed setting.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of knots.
     * @returns {WT_NumberUnit} - the autopilot's reference vertical speed setting.
     */
    referenceVS(reference) {
        let value = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet per minute");
        return reference ? reference.set(value, WT_Unit.FPM) : WT_Unit.FPM.createNumber(value);
    }
}
/**
 * @enum {Number}
 */
WT_AirplaneAutopilot.NavSource = {
    FMS: 0,
    NAV1: 1,
    NAV2: 2,
    NAV3: 3
};

class WT_AirplaneFlightDirector {
    /**
     * Checks whether the flight director is active.
     * @returns {Boolean} whether the flight director is active.
     */
    isActive() {
        return SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE", "Boolean") !== 0;
    }
}

class WT_AirplaneReferences extends WT_AirplaneComponent {
    constructor(airplane, data) {
        super(airplane);

        this._initFromData(data);
    }

    _initFromData(data) {
        this._vmo = data.vmo !== undefined ? new WT_InterpolatedNumberUnitLookupTable(data.vmo, WT_Unit.KNOT) : undefined;
        this._mmo = data.mmo;
        this._crossover = data.crossover !== undefined ? WT_Unit.FOOT.createNumber(data.crossover) : undefined;
        this._v1 = data.v1 !== undefined ? WT_Unit.KNOT.createNumber(data.v1) : undefined;
        this._vr = data.vr !== undefined ? WT_Unit.KNOT.createNumber(data.vr) : undefined;
        this._v2 = data.v2 !== undefined ? WT_Unit.KNOT.createNumber(data.v2) : undefined;
        this._vfto = data.vfto !== undefined ? WT_Unit.KNOT.createNumber(data.vfto) : undefined;
        this._vy = data.vy !== undefined ? WT_Unit.KNOT.createNumber(data.vy) : undefined;
        this._vx = data.vx !== undefined ? WT_Unit.KNOT.createNumber(data.vx) : undefined;
        this._vapp = data.vapp !== undefined ? WT_Unit.KNOT.createNumber(data.vapp) : undefined;
        this._vref = data.vref !== undefined ? WT_Unit.KNOT.createNumber(data.vref) : undefined;
        this._vglide = data.vglide !== undefined ? WT_Unit.KNOT.createNumber(data.vglide) : undefined;

        this._aoaZeroLift = data.aoaZeroLift;
        this._aoaCritical = data.aoaCritical;
    }

    /**
     * A lookup table for the airplane's maximum indicated operating speed.
     * @readonly
     * @type {WT_InterpolatedNumberUnitLookupTable}
     */
    get Vmo() {
        return this._vmo;
    }

    /**
     * The airplane's maximum mach operating speed.
     * @readonly
     * @type {Number}
     */
    get Mmo() {
        return this._mmo;
    }

    /**
     * The airplane's crossover pressure altitude, at which Vmo and Mmo are equal.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get crossover() {
        return this._crossover ? this._crossover.readonly() : undefined;
    }

    /**
     * The airplane's decision speed.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get V1() {
        return this._v1 ? this._v1.readonly() : undefined;
    }

    /**
     * The airplane's rotation speed.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get Vr() {
        return this._vr ? this._vr.readonly() : undefined;
    }

    /**
     * The airplane's takeoff safety speed.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get V2() {
        return this._v2 ? this._v2.readonly() : undefined;
    }

    /**
     * The airplane's final takeoff speed.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get Vfto() {
        return this._vfto ? this._vfto.readonly() : undefined;
    }

    /**
     * The airplane's best rate of climb speed.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get Vy() {
        return this._vy ? this._vy.readonly() : undefined;
    }

    /**
     * The airplane's best angle of climb speed.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get Vx() {
        return this._vx ? this._vx.readonly() : undefined;
    }

    /**
     * The airplane's approach speed.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get Vapp() {
        return this._vapp ? this._vapp.readonly() : undefined;
    }

    /**
     * The airplane's reference landing speed.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get Vref() {
        return this._vref ? this._vref.readonly() : undefined;
    }

    /**
     * The airplane's best glide speed.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get Vglide() {
        return this._vglide ? this._vglide.readonly() : undefined;
    }

    /**
     * The airplane's zero-lift angle of attack.
     * @readonly
     * @type {Number}
     */
    get aoaZeroLift() {
        return this._aoaZeroLift;
    }

    /**
     * The airplane's critical (stall) angle of attack.
     * @readonly
     * @type {Number}
     */
    get aoaCritical() {
        return this._aoaCritical;
    }
}
