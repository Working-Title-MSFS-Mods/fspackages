class GeoMagnetic {
    constructor(model) {
        this._model = model;
    }

    trueToMagnetic(bearing, point) {
        let result = bearing - this.magneticVariation(point);
        return ((result % 360) + 360) % 360;
    }

    magneticToTrue(bearing, point) {
        let result = bearing + this.magneticVariation(point);
        return ((result % 360) + 360) % 360;
    }

    /**
     *
     * @param {*} point
     * @param {*} time
     */
    magneticVariation(point) {
        return this._model.declination(0, point.lat, point.long, 2020);
    }
}
GeoMagnetic.INSTANCE = new GeoMagnetic(new WorldMagneticModel());