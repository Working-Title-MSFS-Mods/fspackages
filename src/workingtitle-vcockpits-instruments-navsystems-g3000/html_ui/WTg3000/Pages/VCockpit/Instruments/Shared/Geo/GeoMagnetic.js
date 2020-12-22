class GeoMagnetic {
    constructor(model) {
        this._model = model;
    }

    /**
     * Converts a true bearing at a specific location to magnetic bearing.
     * @param {Number} bearing - the true bearing to convert.
     * @param {{lat:Number, long:Number}} point - the location specified as lat/long coordinates.
     * @returns {Number} the converted magnetic bearing.
     */
    trueToMagnetic(bearing, point) {
        let result = bearing - this.magneticVariation(point);
        return ((result % 360) + 360) % 360;
    }

    /**
     * Converts a magnetic bearing at a specific location to true bearing.
     * @param {Number} bearing - the magnetic bearing to convert.
     * @param {{lat:Number, long:Number}} point - the location specified as lat/long coordinates.
     * @returns {Number} the converted true bearing.
     */
    magneticToTrue(bearing, point) {
        let result = bearing + this.magneticVariation(point);
        return ((result % 360) + 360) % 360;
    }

    /**
     * Gets the magnetic variation (declination) at a specific location.
     * @param {{lat:Number, long:Number}} point - the location specified as lat/long coordinates.
     * @returns {Number} the magnetic variation (declination), in degrees east of true north.
     */
    magneticVariation(point) {
        return this._model.declination(0, point.lat, point.long, 2020);
    }
}
GeoMagnetic.INSTANCE = new GeoMagnetic(new WorldMagneticModel());