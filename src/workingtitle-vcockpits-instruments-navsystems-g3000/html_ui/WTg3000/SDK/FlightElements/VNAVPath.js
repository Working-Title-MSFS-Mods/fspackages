/**
 * A vertical navigation path. The path is defined by initial and final altitudes and a flight path angle.
 */
class WT_VNAVPath {
    /**
     * @param {WT_NumberUnitObject} [finalAltitude] - the final altitude of the new path.
     * @param {WT_NumberUnitObject} [initialAltitude] - the initial altitude of the new path.
     */
    constructor(finalAltitude, initialAltitude) {
        this._initialAltitude = WT_Unit.FOOT.createNumber(initialAltitude ? initialAltitude.asUnit(WT_Unit.FOOT) : NaN);
        this._finalAltitude = WT_Unit.FOOT.createNumber(finalAltitude ? finalAltitude.asUnit(WT_Unit.FOOT): NaN);
        this._deltaAltitude = WT_Unit.FOOT.createNumber(NaN);
        this._updateDeltaAltitude();

        this._flightPathAngle = NaN;

        this._totalDistance = WT_Unit.NMILE.createNumber(NaN);

        this._readonly = new WT_VNAVPathReadOnly(this);
    }

    /**
     * The initial altitude of this path.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get initialAltitude() {
        return this._initialAltitude.readonly();
    }

    /**
     * The final altitude of this path.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get finalAltitude() {
        return this._finalAltitude.readonly();
    }

    /**
     * The total altitude change over the length of this path.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get deltaAltitude() {
        return this._deltaAltitude.readonly();
    }

    _updateDeltaAltitude() {
        this._deltaAltitude.set(this._finalAltitude).subtract(this._initialAltitude);
    }

    /**
     * Sets this path's initial altitude.
     * @param {WT_NumberUnitObject} altitude - the new initial altitude.
     */
    setInitialAltitude(altitude) {
        if (this._initialAltitude.equals(altitude)) {
            return;
        }

        this._initialAltitude.set(altitude);
        this._updateDeltaAltitude();
    }

    /**
     * Sets this path's final altitude.
     * @param {WT_NumberUnitObject} altitude - the new final altitude.
     */
    setFinalAltitude(altitude) {
        if (this._finalAltitude.equals(altitude)) {
            return;
        }

        this._finalAltitude.set(altitude);
        this._updateDeltaAltitude();
    }

    /**
     * Gets this path's flight path angle in degrees.
     * @returns {Number} - this path's flight path angle.
     */
    getFlightPathAngle() {
        return this._flightPathAngle;
    }

    /**
     * Gets the vertical speed target required to remain on this path for a specific ground speed.
     * @param {WT_NumberUnitObject} groundSpeed - the ground speed for which to calculate the vertical speed target.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *        new WT_NumberUnit object will be created with units of feet per minute.
     * @returns {WT_NumberUnit} the vertical speed target required to remain on this path at the specified ground
     *                          speed.
     */
    getVerticalSpeedTarget(groundSpeed, reference) {
        let deltaAltitudeFeet = this._deltaAltitude.number;

        let value;
        if (deltaAltitudeFeet === 0) {
            value = 0;
        } else {
            let distanceFeet = deltaAltitudeFeet / Math.tan(this._flightPathAngle * Avionics.Utils.DEG2RAD);
            let timeToAltitudeMinutes = distanceFeet / groundSpeed.asUnit(WT_Unit.FPM);
            value = deltaAltitudeFeet / timeToAltitudeMinutes;
        }

        return reference ? reference.set(value) : WT_Unit.FPM.createNumber(value);
    }

    /**
     * Sets this path's flight path angle.
     * @param {Number} angle - the new flight path angle, in degrees.
     */
    setFlightPathAngle(angle) {
        this._flightPathAngle = angle;
    }

    /**
     * Sets this path's flight path angle by specifying a vertical speed target and ground speed.
     * @param {WT_NumberUnitObject} target - the vertical speed target to use to calculate the new flight path angle.
     * @param {WT_NumberUnitObject} groundSpeed - the ground speed to use to calculate the new flight path angle.
     */
    setVerticalSpeedTarget(target, groundSpeed) {
        let deltaAltitudeFeet = this._deltaAltitude.number;
        let timeToAltitudeMinutes = deltaAltitudeFeet / target.asUnit(WT_Unit.FPM);
        let distanceFeet = groundSpeed.asUnit(WT_Unit.FPM) * timeToAltitudeMinutes;
        this._flightPathAngle = Math.atan2(deltaAltitudeFeet, distanceFeet) * Avionics.Utils.RAD2DEG;
    }

    _computeTotalDistance() {
        if (this._deltaAltitude.number === 0) {
            this._totalDistance.set(0);
        } else {
            let distanceFeet = this._deltaAltitude.number / Math.tan(this.getFlightPathAngle() * Avionics.Utils.DEG2RAD);
            this._totalDistance.set(distanceFeet, WT_Unit.FOOT);
        }
    }

    /**
     * Computes and updates this path's total horizontal distance over ground. The horizontal distance is determined
     * from the initial altitude, final altitude, and flight path angle. If one or more of these parameters are not
     * defined for this path, the total horizontal distance will be set to a numeric value of NaN.
     */
    compute() {
        this._computeTotalDistance();
    }

    /**
     * Gets the total horizontal distance of this path over ground. This method will return the value computed by the
     * most recent invocation of the compute() method.
     * @returns {WT_NumberUnitReadOnly} the total horizontal distance of this path over ground.
     */
    getTotalDistance() {
        return this._totalDistance.readonly();
    }

    /**
     * Gets the target altitude at a point defined by horizontal distance from the end of this path.
     * @param {WT_NumberUnitObject} distanceRemaining - the distance from the end of this path, defining the point
     *        at which to get the target altitude.
     * @param {Boolean} [shouldProject] - whether to project this path's slope infinitely forwards and backwards past
     *        the final and initial altitudes, respectively. If false, the target altitude is equal to the initial
     *        altitude if distanceRemaining is less than 0, and equal to the final altitude if distanceRemaining is
     *        greater than the total horizontal distance of this path. False by default.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *        new WT_NumberUnit object will be created with units of feet.
     * @returns {WT_NumberUnit} the target altitude at the specified distance from the end of this path.
     */
    getTargetAltitudeAt(distanceRemaining, shouldProject = false, reference) {
        let value;
        if (this._totalDistance.isNaN()) {
            value = NaN;
        } else {
            let distanceRatio = distanceRemaining.ratio(this._totalDistance);
            if (!shouldProject) {
                distanceRatio = Math.max(0, Math.min(1, distanceRatio));
            }
            value = this.finalAltitude.asUnit(WT_Unit.FOOT) - this._deltaAltitude.number * distanceRatio;
        }

        return reference ? reference.set(value, WT_Unit.FOOT) : WT_Unit.FOOT.createNumber(value);
    }

    /**
     * Gets the vertical deviation from this path of a point defined by horizontal distance from the end of this
     * path and altitude.
     * @param {WT_NumberUnitObject} distanceRemaining - the horizontal distance from the end of this path of the point
     *        for which to get the vertical deviation.
     * @param {WT_NumberUnitObject} indicatedAltitude - the indicated altitude of the point for which to get the
     *        vertical deviation.
     * @param {Boolean} [shouldProject] - whether to project this path's slope infinitely forwards and backwards past
     *        the final and initial altitudes, respectively. If false, the target altitude used to calculate the
     *        vertical deviation is equal to the initial altitude if distanceRemaining is less than 0, and equal to the
     *        final altitude if distanceRemaining is greater than the total horizontal distance of this path. False by
     *        default.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *        new WT_NumberUnit object will be created with units of feet.
     * @returns {WT_NumberUnit} the vertical deviation from this path of the specified point.
     */
    getVerticalDeviationAt(distanceRemaining, indicatedAltitude, shouldProject = false, reference) {
        let targetAltitude = this.getTargetAltitudeAt(distanceRemaining, shouldProject, reference);
        return targetAltitude.scale(-1, true).add(indicatedAltitude);
    }

    /**
     *
     * @param {Number} deltaAltitude
     * @param {Number} distance
     */
    _calculateFlightPathAngle(deltaAltitude, distance) {
        return Math.atan2(deltaAltitude, distance) * Avionics.Utils.RAD2DEG;
    }

    /**
     * Gets the flight path angle required to meet this path's final altitude given a starting point.
     * @param {WT_NumberUnitObject} distanceRemaining - the horizontal distance from the end of this path of the
     *        starting point.
     * @param {WT_NumberUnitObject} indicatedAltitude - the indicated altitude of the starting point.
     * @returns {Number} the flight path angle required to meet this path's final altitude given the specified starting
     *          point.
     */
    getFlightPathAngleRequiredAt(distanceRemaining, indicatedAltitude) {
        let deltaAltitude = this.finalAltitude.asUnit(WT_Unit.FOOT) - indicatedAltitude.asUnit(WT_Unit.FOOT);
        let distance = distanceRemaining.asUnit(WT_Unit.FOOT);
        return this._calculateFlightPathAngle(deltaAltitude, distance);
    }

    /**
     * Gets the vertical speed required to meet this path's final altitude given a specific ground speed and starting
     * point.
     * @param {WT_NumberUnitObject} distanceRemaining - the horizontal distance from the end of this path of the
     *        starting point.
     * @param {WT_NumberUnitObject} indicatedAltitude - the indicated altitude of the starting point.
     * @param {WT_NumberUnitObject} groundSpeed - the ground speed to use to calculate the vertical speed requirement.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *        new WT_NumberUnit object will be created with units of feet.
     * @returns {WT_NumberUnit} the vertical speed required to meet this path's final altitude given the specified
     *          ground speed and starting point.
     */
    getVerticalSpeedRequiredAt(distanceRemaining, indicatedAltitude, groundSpeed, reference) {
        let deltaFeet = this.finalAltitude.asUnit(WT_Unit.FOOT) - indicatedAltitude.asUnit(WT_Unit.FOOT);
        let distanceFeet = distanceRemaining.asUnit(WT_Unit.FOOT);
        let groundSpeedFPM = groundSpeed.asUnit(WT_Unit.FPM);
        let timeRemainingMinutes = distanceFeet / groundSpeedFPM;
        let vsRequiredFPM = deltaFeet / timeRemainingMinutes;
        return reference ? reference.set(vsRequiredFPM, WT_Unit.FPM) : WT_Unit.FPM.createNumber(vsRequiredFPM);
    }

    /**
     * Gets a read-only version of this path. Any changes made to this path will automatically be reflected in the
     * read-only version.
     * @returns {WT_VNAVPathReadOnly} a read-only version of this path.
     */
    readonly() {
        return this._readonly;
    }
}

/**
 * A read-only version of a vertical navigation path.
 */
class WT_VNAVPathReadOnly {
    /**
     * @param {WT_VNAVPath} source
     */
    constructor(source) {
        this._source = source;
    }

    /**
     * The initial altitude of this path.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get initialAltitude() {
        return this._source.initialAltitude;
    }

    /**
     * The final altitude of this path.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get finalAltitude() {
        return this._source.finalAltitude;
    }

    /**
     * The total altitude change over the length of this path.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get deltaAltitude() {
        return this._source.deltaAltitude;
    }

    /**
     * Gets this path's flight path angle in degrees.
     * @returns {Number} - this path's flight path angle.
     */
    getFlightPathAngle() {
        return this._source.getFlightPathAngle();
    }

    /**
     * Gets the vertical speed target required to remain on this path for a specific ground speed.
     * @param {WT_NumberUnitObject} groundSpeed - the ground speed for which to calculate the vertical speed target.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *        new WT_NumberUnit object will be created with units of feet per minute.
     * @returns {WT_NumberUnit} the vertical speed target required to remain on this path at the specified ground
     *                          speed.
     */
    getVerticalSpeedTarget(groundSpeed, reference) {
        return this._source.getVerticalSpeedTarget(groundSpeed, reference);
    }

    /**
     * Gets the total horizontal distance of this path over ground. This method will return the value computed by the
     * most recent invocation of the compute() method.
     * @returns {WT_NumberUnitReadOnly} the total horizontal distance of this path over ground.
     */
    getTotalDistance() {
        return this._source.getTotalDistance();
    }

    /**
     * Gets the target altitude at a point defined by horizontal distance from the end of this path. If the specified
     * distance is greater than or equal to the total horizontal distance of this path, the target altitude will be
     * equal to this path's initial altitude. If the specified distance is less than or equal to 0, the target altitude
     * will be equal to this path's final altitude.
     * @param {WT_NumberUnitObject} distanceRemaining - the distance from the end of this path, defining the point
     *        at which to get the target altitude.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *        new WT_NumberUnit object will be created with units of feet.
     * @returns {WT_NumberUnit} the target altitude at the specified distance from the end of this path.
     */
    getTargetAltitudeAt(remainingDistance, reference) {
        return this._source.getTargetAltitudeAt(remainingDistance, reference);
    }

    /**
     * Gets the vertical deviation from this path of a point defined by horizontal distance from the end of this
     * path and altitude.
     * @param {WT_NumberUnitObject} distanceRemaining - the horizontal distance from the end of this path of the point
     *        for which to get the vertical deviation.
     * @param {WT_NumberUnitObject} indicatedAltitude - the indicated altitude of the point for which to get the
     *        vertical deviation.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *        new WT_NumberUnit object will be created with units of feet.
     * @returns {WT_NumberUnit} the vertical deviation from this path of the specified point.
     */
    getVerticalDeviationAt(remainingDistance, indicatedAltitude, reference) {
        return this._source.getVerticalDeviationAt(remainingDistance, indicatedAltitude, reference);
    }

    /**
     * Gets the flight path angle required to meet this path's final altitude given a starting point.
     * @param {WT_NumberUnitObject} distanceRemaining - the horizontal distance from the end of this path of the
     *        starting point.
     * @param {WT_NumberUnitObject} indicatedAltitude - the indicated altitude of the starting point.
     * @returns {Number} the flight path angle required to meet this path's final altitude given the specified starting
     *          point.
     */
    getFlightPathAngleRequiredAt(distanceRemaining, indicatedAltitude) {
        return this._source.getFlightPathAngleRequiredAt(distanceRemaining, indicatedAltitude);
    }

    /**
     * Gets the vertical speed required to meet this path's final altitude given a specific ground speed and starting
     * point.
     * @param {WT_NumberUnitObject} distanceRemaining - the horizontal distance from the end of this path of the
     *        starting point.
     * @param {WT_NumberUnitObject} indicatedAltitude - the indicated altitude of the starting point.
     * @param {WT_NumberUnitObject} groundSpeed - the ground speed to use to calculate the vertical speed requirement.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the result. If not supplied, a
     *        new WT_NumberUnit object will be created with units of feet.
     * @returns {WT_NumberUnit} the vertical speed required to meet this path's final altitude given the specified
     *          ground speed and starting point.
     */
    getVerticalSpeedRequiredAt(remainingDistance, indicatedAltitude, groundSpeed, reference) {
        return this._source.getVerticalSpeedRequiredAt(remainingDistance, indicatedAltitude, groundSpeed, reference);
    }
}