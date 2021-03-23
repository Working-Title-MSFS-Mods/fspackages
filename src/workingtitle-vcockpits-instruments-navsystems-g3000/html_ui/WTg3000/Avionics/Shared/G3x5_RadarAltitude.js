class WT_G3x5_RadarAltitude {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {{maxAltitude:WT_NumberUnit, precision:WT_NumberUnit}[]} precisions
     */
    constructor(airplane, precisions) {
        this._airplane = airplane;
        this._precisions = precisions;
    }

    _selectPrecision(altitude) {
        let entry = this._precisions.find(entry => altitude.compare(entry.maxAltitude) <= 0);
        return entry ? entry.precision : null;
    }

    /**
     *
     * @param {WT_NumberUnit} [reference]
     * @returns {WT_NumberUnit}
     */
    altitude(reference) {
        let altitude = this._airplane.sensors.radarAltitude(reference);
        let precision = this._selectPrecision(altitude);
        let altitudeFeet = altitude.asUnit(WT_Unit.FOOT);
        let precisionFeet = precision ? precision.asUnit(WT_Unit.FOOT) : 1;
        return altitude.set(Math.round(altitudeFeet / precisionFeet) * precisionFeet);
    }
}