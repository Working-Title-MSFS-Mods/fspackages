class WT_PlayerAirplane {
    constructor() {
        this._type = this._getAircraftType();
        this._dynamics = this._createDynamics();
        this._navigation = this._createNavigation();
        this._fms = this._createFMS();
        this._navCom = this._createNavCom();
        this._autopilot = this._createAutopilot();
    }

    _getAircraftType() {
        switch (SimVar.GetSimVarValue("ATC MODEL", "string")) {
            case "TT:ATCCOM.AC_MODEL_TBM9.0.text":
                return WT_PlayerAirplane.Type.TBM930;
            case "TT:ATCCOM.AC_MODEL_C700.0.text":
                return WT_PlayerAirplane.Type.CITATION_LONGITUDE;
            default:
                return WT_PlayerAirplane.Type.UNKNOWN;
        }
    }

    _createDynamics() {
        return new WT_AirplaneDynamics(this);
    }

    _createNavigation() {
        return new WT_AirplaneNavigation(this);
    }

    _createFMS() {
        return new WT_AirplaneFMS(this);
    }

    _createNavCom() {
        return new WT_AirplaneNavCom(this, 2, 2, 1);
    }

    _createAutopilot() {
        return new WT_AirplaneAutopilot();
    }

    /**
     * @readonly
     * @property {WT_PlayerAirplane.Type} type - the type this airplane.
     * @type {WT_PlayerAirplane.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @readonly
     * @property {WT_AirplaneDynamics} dynamics - the dynamics component of this airplane.
     * @type {WT_AirplaneDynamics}
     */
    get dynamics() {
        return this._dynamics;
    }

    /**
     * @readonly
     * @property {WT_AirplaneNavigation} navigation - the navigation component of this airplane.
     * @type {WT_AirplaneNavigation}
     */
    get navigation() {
        return this._navigation;
    }

    /**
     * @readonly
     * @property {WT_AirplaneFMS} gps - the GPS component of this airplane.
     * @type {WT_AirplaneFMS}
     */
    get fms() {
        return this._fms;
    }

    /**
     * @readonly
     * @property {WT_AirplaneNavCom} navCom - the NAVCOM component of this airplane.
     * @type {WT_AirplaneNavCom}
     */
    get navCom() {
        return this._navCom;
    }

    /**
     * @readonly
     * @property {WT_AirplaneAutopilot} autopilot - the autopilot component of this airplane.
     * @type {WT_AirplaneAutopilot}
     */
    get autopilot() {
        return this._autopilot;
    }

    /**
     * Gets the airplane's current geographic position.
     * @param {WT_GeoPoint} [reference] - a WT_GeoPoint object in which to store the result. If not supplied, a new WT_GeoPoint
     *                                      object will be created.
     * @returns {WT_GeoPoint}  the current position of the airplane.
     */
    position(reference) {
        let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        return reference? reference.set(lat, long) : new WT_GeoPoint(lat, long);
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
     *                                      object will be created.
     * @returns {WT_NumberUnit} the current altitude of the airplane. Default unit is feet.
     */
    altitude(reference) {
        let alt = SimVar.GetSimVarValue("PLANE ALTITUDE", "feet");
        return reference ? reference.set(alt, WT_Unit.FOOT) : new WT_NumberUnit(alt, WT_Unit.FOOT);
    }

    /**
     * Gets the airplane's current indicated altitude.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created.
     * @returns {WT_NumberUnit} the current indicated altitude of the airplane. Default unit is feet.
     */
    altitudeIndicated(reference) {
        let alt = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
        return reference ? reference.set(alt, WT_Unit.FOOT) : new WT_NumberUnit(alt, WT_Unit.FOOT);
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

    /**
     * Gets the airplane's current true airspeed.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created.
     * @returns {WT_NumberUnit} the current true airspeed of the airplane. Default unit is knots.
     */
    tas(reference) {
        let tas = SimVar.GetSimVarValue("AIRSPEED TRUE", "knots");
        return reference ? reference.set(tas, WT_Unit.KNOT) : new WT_NumberUnit(tas, WT_Unit.KNOT);
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
     * Checks whether the airplane is currently on the ground.
     * @returns {Boolean} whether the airplane is currently on the ground.
     */
    isOnGround() {
        return SimVar.GetSimVarValue("SIM ON GROUND", "bool");
    }

    /**
     * Gets the current amount of fuel remaining on the airplane.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created.
     * @returns {WT_NumberUnit} the current amount of fuel remaining on the airplane. Default unit is gallons.
     */
    fuelOnboard(reference) {
        let fob = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons");
        return reference ? reference.set(fob, WT_Unit.GALLON) : new WT_NumberUnit(fob, WT_Unit.GALLON);
    }

    /**
     * Gets the number of engines on board this airplane.
     * @returns {Number} the number of engines on board this airplane.
     */
    engineCount() {
        return SimVar.GetSimVarValue("NUMBER OF ENGINES", "number");
    }

    /**
     * Gets the total fuel consumption of the airplane, which is the sum of the fuel consumption of all engines.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created.
     * @returns {WT_NumberUnit} the current total fuel consumption of the airplane. Default unit is gallons per hour.
     */
    fuelFlowTotal(reference) {
        let numEngines = this.engineCount();
        let fuelFlow = reference ? reference.set(0) : new WT_NumberUnit(0, WT_Unit.GPH);
        for (let i = 0; i < numEngines; i++) {
            fuelFlow.add(this.fuelFlow(i, WT_PlayerAirplane._tempGPH));
        }
        return fuelFlow;
    }

    /**
     * Gets the fuel consumption of an engine.
     * @param {Number} index - the index of the engine.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created.
     * @returns {WT_NumberUnit} the current fuel consumption of the engine. Default unit is gallons per hour.
     */
    fuelFlow(index, reference) {
        let ff = SimVar.GetSimVarValue(`ENG FUEL FLOW GPH:${index + 1}`, "gallons per hour");
        return reference ? reference.set(ff, WT_Unit.GPH) : new WT_NumberUnit(ff, WT_Unit.GPH);
    }

    /**
     * @readonly
     * @property {WT_PlayerAirplane} INSTANCE
     * @type {WT_PlayerAirplane}
     */
    static get INSTANCE() {
        if (!WT_PlayerAirplane._instance) {
            WT_PlayerAirplane._instance = new WT_PlayerAirplane();
        }
        return WT_PlayerAirplane._instance;
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
     * @property {WT_PlayerAirplane} index
     * @type {WT_PlayerAirplane}
     */
    get airplane() {
        return this._airplane;
    }
}

class WT_AirplaneDynamics extends WT_AirplaneComponent {
    /**
     * Gets the airplane's current indicated airspeed.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of knots.
     * @returns {WT_NumberUnit} the current indicated airspeed of the airplane.
     */
    ias(reference) {
        let value = SimVar.GetSimVarValue("AIRSPEED INDICATED", "knots");
        return reference ? reference.set(value, WT_Unit.KNOT) : new WT_NumberUnit(value, WT_Unit.KNOT);
    }

    /**
     * Gets the airplane's current true airspeed.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of knots.
     * @returns {WT_NumberUnit} the current true airspeed of the airplane.
     */
    tas(reference) {
        let value = SimVar.GetSimVarValue("AIRSPEED TRUE", "knots");
        return reference ? reference.set(value, WT_Unit.KNOT) : new WT_NumberUnit(value, WT_Unit.KNOT);
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
}

class WT_AirplaneNavigation extends WT_AirplaneComponent {
    /**
     * Gets the airplane's current geographic position.
     * @param {WT_GeoPoint} [reference] - a WT_GeoPoint object in which to store the result. If not supplied, a new WT_GeoPoint
     *                                      object will be created.
     * @returns {WT_GeoPoint}  the current position of the airplane.
     */
    position(reference) {
        let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        return reference? reference.set(lat, long) : new WT_GeoPoint(lat, long);
    }

    heading(reference) {
        if (!this.hasTarget()) {
            return null;
        }

        let value = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        let position = this.airplane.position(WT_AirplaneNavigation._tempGeoPoint);
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
     *                                      object will be created.
     * @returns {WT_NumberUnit} the current altitude of the airplane. Default unit is feet.
     */
    altitude(reference) {
        let alt = SimVar.GetSimVarValue("PLANE ALTITUDE", "feet");
        return reference ? reference.set(alt, WT_Unit.FOOT) : new WT_NumberUnit(alt, WT_Unit.FOOT);
    }

    /**
     * Gets the airplane's current indicated altitude.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created.
     * @returns {WT_NumberUnit} the current indicated altitude of the airplane. Default unit is feet.
     */
    altitudeIndicated(reference) {
        let alt = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
        return reference ? reference.set(alt, WT_Unit.FOOT) : new WT_NumberUnit(alt, WT_Unit.FOOT);
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
}
WT_AirplaneNavigation._tempGeoPoint = new WT_GeoPoint(0, 0);
WT_AirplaneNavigation._tempNavAngleUnit = new WT_NavAngleUnit(true);

class WT_AirplaneFMS extends WT_AirplaneComponent {
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
        let position = this.airplane.position(WT_AirplaneFMS._tempGeoPoint);
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
}
WT_AirplaneFMS._tempGeoPoint = new WT_GeoPoint(0, 0);
WT_AirplaneFMS._tempNavAngleUnit = new WT_NavAngleUnit(true);

class WT_AirplaneNavCom extends WT_AirplaneComponent {
    constructor(airplane, numComSlots, numNavSlots, numADFSlots) {
        super(airplane);

        this._comSlots = new Array(numComSlots).fill().map((e, i) => new WT_AirplaneComSlot(airplane, i + 1));
        this._navSlots = new Array(numNavSlots).fill().map((e, i) => new WT_AirplaneNavSlot(airplane, i + 1));
        this._adfSlots = new Array(numADFSlots).fill().map((e, i) => new WT_AirplaneADFSlot(airplane, i + 1));
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
        return WT_Frequency.createFromHz(SimVar.GetSimVarValue(`COM ACTIVE FREQUENCY:${this.index}`, "Hz"));
    }

    /**
     * Gets this radio's standby frequency.
     * @returns {WT_Frequency} this radio's standby frequency.
     */
    standbyFrequency() {
        return WT_Frequency.createFromHz(SimVar.GetSimVarValue(`COM STANDBY FREQUENCY:${this.index}`, "Hz"));
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
        return WT_Frequency.createFromHz(SimVar.GetSimVarValue(`NAV ACTIVE FREQUENCY:${this.index}`, "Hz"));
    }

    /**
     * Gets this radio's standby frequency.
     * @returns {WT_Frequency} this radio's standby frequency.
     */
    standbyFrequency() {
        return WT_Frequency.createFromHz(SimVar.GetSimVarValue(`NAV STANDBY FREQUENCY:${this.index}`, "Hz"));
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

    isReceiving() {
        return SimVar.GetSimVarValue(`NAV HAS NAV:${this.index}`, "Bool") !== 0;
    }

    ident() {
        return this.isReceiving() ? SimVar.GetSimVarValue(`NAV IDENT:${this.index}`, "string") : null;
    }

    /**
     * Gets the radial of the tuned navigation station on which the airplane's current position lies.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a new WT_NumberUnit
     *                                      object will be created with units of magnetic bearing.
     * @returns {WT_NumberUnit} the radial of the tuned navigation station on which the airplane's current position lies, or null if
     *                          this radio is not currently receiving.
     */
    radial(reference) {
        if (!this.isReceiving()) {
            return null;
        }

        let value = SimVar.GetSimVarValue(`NAV RADIAL:${this.index}`, "degree");
        let position = this.airplane.position(WT_AirplaneNavSlot._tempGeoPoint);
        if (reference) {
            WT_AirplaneNavSlot._tempNavAngleUnit.setLocation(position);
            reference.unit.setLocation(position);
            reference.set(value, WT_AirplaneNavSlot._tempNavAngleUnit);
            return reference;
        } else {
            return new WT_NavAngleUnit(true, position).createNumber(value);
        }
    }

    hasDME() {
        return SimVar.GetSimVarValue(`NAV HAS DME:${this.index}`, "Bool") !== 0;
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
        return WT_Frequency.createFromHz(SimVar.GetSimVarValue(`ADF ACTIVE FREQUENCY:${this.index}`, "Hz"));
    }

    /**
     * Gets this radio's standby frequency.
     * @returns {WT_Frequency} this radio's standby frequency.
     */
    standbyFrequency() {
        return WT_Frequency.createFromHz(SimVar.GetSimVarValue(`ADF STANDBY FREQUENCY:${this.index}`, "Hz"));
    }

    /**
     * Sets this radio's standby frequency.
     * @param {WT_Frequency} frequency - the new frequency.
     */
    setStandbyFrequency(frequency) {
        this.swapFrequency();
        SimVar.SetSimVarValue(`K:ADF${this.index === 1 ? "" : this.index}_COMPLETE_SET`, "Frequency ADF BCD32", frequency.bcd32);
        this.swapFrequency();
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
        return SimVar.GetSimVarValue(`ADF RADIAL:${this.index}`, "degree");
    }
}

class WT_AirplaneEngine {

}

class WT_AirplaneControls {

}

class WT_AirplaneAutopilot {
    navigationSource() {
        if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
            return WT_AirplaneAutopilot.NavSource.FMS;
        } else {
            return SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "number");
        }
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