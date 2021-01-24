class WT_PlayerAirplane {
    constructor() {
        this._type = this._getAircraftType();
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

    /**
     * Gets the type of the airplane.
     * @returns {Number} the type of the airplane.
     */
    type() {
        return this._type;
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
WT_PlayerAirplane.INSTANCE = new WT_PlayerAirplane();