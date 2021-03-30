class WT_TrafficAvoidanceSystem {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_NumberUnit} protectedRadius - the initial radius of the cylindrical protected zone around own
     *                                          airplane.
     * @param {WT_NumberUnit} protectedHeight - the initial height of the cylindrical protected zone around own
     *                                          airplane.
     * @param {WT_TrafficTracker} trafficTracker
     * @param {Object} [options]
     */
    constructor(airplane, protectedRadius, protectedHeight, trafficTracker, options = {}) {
        this._ownAirplane = new WT_TrafficAvoidanceSystemOwnAirplane(airplane, protectedRadius, protectedHeight);
        this._trafficTracker = trafficTracker;
        this._lookaheadTime = WT_Unit.SECOND.createNumber(0);
        this._minimumGroundSpeed = WT_Unit.KNOT.createNumber(0);

        /**
         * @type {WT_TrafficAvoidanceSystemIntruder[]}
         */
        this._intruders = [];
        this._intrudersReadOnly = new WT_ReadOnlyArray(this._intruders);

        this._optsManager = new WT_OptionsManager(this, WT_TrafficAvoidanceSystem.OPTION_DEFS);
        this._optsManager.setOptions(options);

        this._initListeners();
    }

    _initListeners() {
        this._trafficTracker.addListener(WT_TrafficTracker.EventType.CONTACT_CREATED, this._onContactCreated.bind(this));
        this._trafficTracker.addListener(WT_TrafficTracker.EventType.CONTACT_REMOVED, this._onContactRemoved.bind(this));
    }

    /**
     * The maximum lookahead time when calculating time of closest approach for intruders.
     * @type {WT_NumberUnit}
     */
    get lookaheadTime() {
        return this._lookaheadTime.readonly();
    }

    set lookaheadTime(time) {
        this._lookaheadTime.set(time);
    }

    /**
     * The maximum lookahead time when calculating time of closest approach for intruders.
     * @type {WT_NumberUnit}
     */
    get minimumGroundSpeed() {
        return this._minimumGroundSpeed.readonly();
    }

    set minimumGroundSpeed(speed) {
        this._minimumGroundSpeed.set(speed);
    }

    /**
     * @readonly
     * @type {WT_TrafficAvoidanceSystemOwnAirplane}
     */
    get ownAirplane() {
        return this._ownAirplane;
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<WT_TrafficAvoidanceSystemIntruder>}
     */
    get intruders() {
        return this._intrudersReadOnly;
    }

    _onContactCreated(eventType, contact) {
        let entry = new WT_TrafficAvoidanceSystemIntruder(contact);
        this._intruders.push(entry);
    }

    _onContactRemoved(eventType, contact) {
        let index = this._intruders.findIndex(entry => entry.contact === contact);
        if (index >= 0) {
            this._intruders.splice(index, 1);
        }
    }

    update() {
        this._ownAirplane.update();
        this._intruders.forEach(entry => entry.update(this._ownAirplane, this.lookaheadTime, this.minimumGroundSpeed), this);
    }
}
WT_TrafficAvoidanceSystem.OPTION_DEFS = {
    lookaheadTime: {default: WT_Unit.MINUTE.createNumber(20)},
    minimumGroundSpeed: {default: WT_Unit.KNOT.createNumber(30)}
};

class WT_TrafficAvoidanceSystemOwnAirplane {
    /**
     * @param {WT_PlayerAirplane} airplane - the airplane.
     * @param {WT_NumberUnit} protectedRadius - the radius of the cylindrical protected zone around the new airplane.
     * @param {WT_NumberUnit} protectedHeight - the height of the cylindrical protected zone around the new airplane.
     */
    constructor(airplane, protectedRadius, protectedHeight) {
        this._airplane = airplane;

        this._protectedRadius = WT_Unit.METER.createNumber(protectedRadius.asUnit(WT_Unit.METER));
        this._protectedHeight = WT_Unit.METER.createNumber(protectedHeight.asUnit(WT_Unit.METER));

        this._position = new WT_GeoPoint(0, 0);
        this._altitude = WT_Unit.FOOT.createNumber(0);
        this._groundTrack = 0;
        this._groundSpeed = WT_Unit.KNOT.createNumber(0);
        this._verticalSpeed = WT_Unit.FPM.createNumber(0);

        this._positionVector = new WT_GVector3(0, 0, 0);
        this._velocityVector = new WT_GVector3(0, 0, 0);

        this._tempVector2 = new WT_GVector2(0, 0);
    }

    /**
     * The radius of the cylindrical protected zone around this airplane.
     * @type {WT_NumberUnit}
     */
    get protectedRadius() {
        return this._protectedRadius.readonly();
    }

    set protectedRadius(radius) {
        this._protectedRadius.set(radius);
    }

    /**
     * The height of the cylindrical protected zone around this airplane.
     * @type {WT_NumberUnit}
     */
    get protectedHeight() {
        return this._protectedHeight.readonly();
    }

    set protectedHeight(height) {
        this._protectedHeight.set(height);
    }

    /**
     * @readonly
     * @type {WT_GeoPointReadOnly}
     */
    get position() {
        return this._position.readonly();
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get altitude() {
        return this._altitude.readonly();
    }

    /**
     * @readonly
     * @type {Number}
     */
    get groundTrack() {
        return this._groundTrack;
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get groundSpeed() {
        return this._groundSpeed.readonly();
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get verticalSpeed() {
        return this._verticalSpeed.readonly();
    }

    /**
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get positionVector() {
        return this._positionVector.readonly();
    }

    /**
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get velocityVector() {
        return this._velocityVector.readonly();
    }

    _updateParameters() {
        this._airplane.navigation.position(this._position);
        this._airplane.navigation.altitude(this._altitude);
        this._groundTrack = this._airplane.navigation.trackTrue();
        this._airplane.navigation.groundSpeed(this._groundSpeed);
        this._airplane.sensors.verticalSpeed(this._verticalSpeed);
    }

    _updateVectors() {
        let horizontalVelocity = this._tempVector2.setFromPolar(this.groundSpeed.asUnit(WT_Unit.MPS), this.groundTrack);
        let verticalVelocity = this.verticalSpeed.asUnit(WT_Unit.MPS);
        this._velocityVector.set(horizontalVelocity.x, horizontalVelocity.y, verticalVelocity);
    }

    update() {
        this._updateParameters();
        this._updateVectors();
    }
}

class WT_TrafficAvoidanceSystemIntruder {
    /**
     * @param {WT_TrafficContact} contact - the traffic contact to associate with the new intruder.
     */
    constructor(contact) {
        this._contact = contact;

        this._positionVector = new WT_GVector3(0, 0, 0);
        this._velocityVector = new WT_GVector3(0, 0, 0);
        this._deltaPosition = new WT_GVector3(0, 0, 0);
        this._deltaVelocity = new WT_GVector3(0, 0, 0);

        this._isPredictionValid = false;
        this._tca = WT_Unit.SECOND.createNumber(NaN);
        this._tcaNorm = NaN;
        this._tcaDisplacement = new WT_GVector3(NaN, NaN, NaN);

        this._tempVector2_1 = new WT_GVector2(0, 0);
        this._tempVector2_2 = new WT_GVector2(0, 0);
        this._tempVector3 = new WT_GVector3(0, 0, 0);
    }

    /**
     * The traffic contact associated with this intruder.
     * @readonly
     * @type {WT_TrafficContact}
     */
    get contact() {
        return this._contact;
    }

    /**
     * Whether there is a valid prediction for time of closest approach between this intruder and own airplane.
     * @readonly
     * @type {Boolean}
     */
    get isPredictionValid() {
        return this._isPredictionValid;
    }

    /**
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get positionVector() {
        return this._positionVector.readonly();
    }

    /**
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get velocityVector() {
        return this._velocityVector.readonly();
    }

    /**
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get positionVector() {
        return this._positionVector.readonly();
    }

    /**
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get velocityVector() {
        return this._velocityVector.readonly();
    }

    /**
     * The position of this intruder relative to own airplane. Expressed as a 3D vector in units of meters.
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get relativePositionVector() {
        return this._deltaPosition.readonly();
    }

    /**
     * The velocity of this intruder relative to own airplane. Expressed as a 3D vector in units of meters per second.
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get relativeVelocityVector() {
        return this._deltaVelocity.readonly();
    }

    /**
     * Time to closest approach between this intruder and own airplane.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get tca() {
        return this._tca.readonly();
    }

    /**
     * The cylindrical norm of the predicted displacement vector between this intruder and own airplane at time of
     * closest approach. A value less than or equal to 1 indicates the intruder will be inside the protected zone.
     * Larger values correspond to greater separation.
     * @readonly
     * @type {Number}
     */
    get tcaNorm() {
        return this._tcaNorm;
    }

    /**
     * The predicted displacement vector from own airplane to this intruder at time of closest approach. The coordinate
     * system is defined in units of meters, with the positive x axis pointing due east, the positive y axis pointing
     * due south, and the positive z axis pointing upwards.
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get tcaDisplacement() {
        return this._tcaDisplacement.readonly();
    }

    /**
     *
     * @param {WT_TrafficAvoidanceSystemOwnAirplane} self
     */
    _updatePosition(self) {
        let distance = WT_Unit.GA_RADIAN.convert(this.contact.lastPosition.distance(self.position), WT_Unit.METER);
        let bearing = self.position.bearingTo(this.contact.lastPosition);
        let horizontalPosition = this._tempVector2_1.setFromPolar(distance, bearing);
        let verticalPosition = this.contact.lastAltitude.asUnit(WT_Unit.METER) - self.altitude.asUnit(WT_Unit.METER);
        this._positionVector.set(horizontalPosition.x, horizontalPosition.y, verticalPosition);
    }

    /**
     *
     * @param {WT_TrafficAvoidanceSystemOwnAirplane} self
     * @param {WT_NumberUnitReadOnly} minimumGroundSpeed
     */
    _updateVelocity(self, minimumGroundSpeed) {
        if (isNaN(this.contact.computedGroundTrack) || this.contact.computedGroundSpeed.compare(minimumGroundSpeed) < 0) {
            this._velocityVector.set(NaN, NaN, NaN);
            this._isPredictionValid = false;
        } else {
            let horizontalVelocity = this._tempVector2_1.setFromPolar(this.contact.computedGroundSpeed.asUnit(WT_Unit.MPS), this.contact.computedGroundTrack);
            let verticalVelocity = this.contact.computedVerticalSpeed.asUnit(WT_Unit.MPS);
            this._velocityVector.set(horizontalVelocity.x, horizontalVelocity.y, verticalVelocity);
            this._isPredictionValid = true;
        }
    }

    /**
     *
     * @param {WT_TrafficAvoidanceSystemOwnAirplane} self
     * @param {WT_NumberUnitReadOnly} minimumGroundSpeed
     */
    _updateVectors(self, minimumGroundSpeed) {
        this._updatePosition(self);
        this._updateVelocity(self, minimumGroundSpeed);
    }

    /**
     *
     * @param {WT_GVector3} vector
     * @returns {Number}
     */
    _calculateCylindricalNorm(vector, radius, halfHeight) {
        let vectorHoriz = this._tempVector2_1.set(vector);
        return Math.max(Math.abs(vector.z) / halfHeight, vectorHoriz.length / radius);
    }

    _calculateDisplacementVector(initialDisplacement, velocityDelta, elapsedTime) {
        return this._tempVector3.set(velocityDelta).scale(elapsedTime, true).add(initialDisplacement);
    }

    _addSolution(t, s, v, r, h, solutions, norms) {
        solutions.push(t);
        let vector = this._calculateDisplacementVector(s, v, t);
        norms.push(this._calculateCylindricalNorm(vector, r, h));
    }

    /**
     *
     * @param {WT_TrafficAvoidanceSystemOwnAirplane} ownAirplane
     * @param {WT_NumberUnitReadOnly} lookaheadTime
     */
    _updateTCA(ownAirplane, lookaheadTime) {
        // Source: Munoz, CA and Narkawicz, AJ. "Time of Closest Approach in Three-Dimensional Airspace." 2010.
        // https://ntrs.nasa.gov/api/citations/20100037766/downloads/20100037766.pdf
        let s = this._deltaPosition.set(this.positionVector).subtract(ownAirplane.positionVector);
        let v = this._deltaVelocity.set(this.velocityVector).subtract(ownAirplane.velocityVector);
        let sHoriz = this._tempVector2_1.set(s);
        let vHoriz = this._tempVector2_2.set(v);
        let h = ownAirplane.protectedHeight.asUnit(WT_Unit.METER) / 2;
        let r = ownAirplane.protectedRadius.asUnit(WT_Unit.METER);

        let vHorizSquared = vHoriz.length * vHoriz.length;
        let sHorizSquared = sHoriz.length * sHoriz.length;
        let hSquared = h * h;
        let rSquared = r * r;
        let a = (v.z * v.z) / hSquared - vHorizSquared / rSquared;
        let b = 2 * s.z * v.z / hSquared - 2 * sHoriz.dot(vHoriz) / rSquared;
        let c = (s.z * s.z) / hSquared - sHorizSquared / rSquared;

        let solutions = [];
        let norms = [];
        this._addSolution(0, s, v, r, h, solutions, norms);
        if (vHoriz.length !== 0) {
            let t = -sHoriz.dot(vHoriz) / vHorizSquared;
            this._addSolution(t, s, v, r, h, solutions, norms);
        }
        if (v.z !== 0) {
            let t = -s.z / v.z;
            this._addSolution(t, s, v, r, h, solutions, norms);
        }
        let discriminant = b * b - 4 * a * c;
        if (a !== 0 && discriminant >= 0) {
            let sqrt = Math.sqrt(discriminant);
            let t = (-b + sqrt) / (2 * a);
            this._addSolution(t, s, v, r, h, solutions, norms);
            t = (-b - sqrt) / (2 * a);
            this._addSolution(t, s, v, r, h, solutions, norms);
        } else if (a === 0 && b !== 0) {
            let t = -c / b;
            this._addSolution(t, s, v, r, h, solutions, norms);
        }

        let tcaIndex = norms.reduce((candidate, norm, index) => {
            let best = candidate;
            if (solutions[index] >= 0 && norm < norms[candidate]) {
                best = index;
            }
            return best;
        }, 0);

        let tca = solutions[tcaIndex];
        let tcaNorm = norms[tcaIndex];
        let tcaDisplacement;

        let lookaheadTimeSeconds = lookaheadTime.asUnit(WT_Unit.SECOND);
        if (tca > lookaheadTimeSeconds) {
            tca = lookaheadTimeSeconds;
            tcaDisplacement = this._calculateDisplacementVector(s, v, tca);
            tcaNorm = this._calculateCylindricalNorm(tcaDisplacement);
        }
        if (!tcaDisplacement) {
            tcaDisplacement = this._calculateDisplacementVector(s, v, tca);
        }

        this._tca.set(tca);
        this._tcaNorm = tcaNorm;
        this._tcaDisplacement.set(tcaDisplacement);
    }

    _invalidatePrediction() {
        this._tca.set(NaN);
        this._tcaNorm = NaN;
        this._tcaDisplacement.set(NaN, NaN, NaN);
    }

    /**
     *
     * @param {WT_TrafficAvoidanceSystemOwnAirplane} ownAirplane
     * @param {WT_NumberUnitReadOnly} lookaheadTime
     * @param {WT_NumberUnitReadOnly} minimumGroundSpeed
     */
    update(ownAirplane, lookaheadTime, minimumGroundSpeed) {
        this._updateVectors(ownAirplane, minimumGroundSpeed);
        if (this.isPredictionValid) {
            this._updateTCA(ownAirplane, lookaheadTime);
        } else {
            this._invalidatePrediction();
        }
    }
}