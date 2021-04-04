/**
 * A traffic avoidance system. Given a list of aircraft contacts (intruders), it calculates the time of closest
 * approach (TCA) for each, as well as the 3D location of the intruder at TCA relative to own airplane and whether
 * it violates a cylindrical protected zone around own airplane.
 */
class WT_TrafficAvoidanceSystem {
    /**
     * @param {WT_PlayerAirplane} airplane - the new system's own airplane.
     * @param {WT_NumberUnit} protectedRadius - the initial radius of the cylindrical protected zone around own
     *                                          airplane.
     * @param {WT_NumberUnit} protectedHeight - the initial height of the cylindrical protected zone around own
     *                                          airplane.
     * @param {WT_TrafficTracker} trafficTracker - the traffic tracker from which to retrieve aircraft contact data.
     * @param {Object} [options] - optional options to pass to the new system.
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

        /**
         * @type {((eventType:WT_TrafficAvoidanceSystem.IntruderEventType, intruder:WT_TrafficAvoidanceSystemIntruder) => void)[][]}
         */
        this._listeners = [[], [], []];

        this._initTrafficTrackerListeners();

        this._tempSecond = WT_Unit.SECOND.createNumber(0);
    }

    _initTrafficTrackerListeners() {
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
     * This traffic avoidance system's own airplane.
     * @readonly
     * @type {WT_TrafficAvoidanceSystemOwnAirplane}
     */
    get ownAirplane() {
        return this._ownAirplane;
    }

    /**
     * An array of intruders currently being tracked by this traffic avoidance system.
     * @readonly
     * @type {WT_ReadOnlyArray<WT_TrafficAvoidanceSystemIntruder>}
     */
    get intruders() {
        return this._intrudersReadOnly;
    }

    _onContactCreated(eventType, contact) {
        let intruder = new WT_TrafficAvoidanceSystemIntruder(contact);
        this._intruders.push(intruder);
        this._fireIntruderEvent(WT_TrafficAvoidanceSystem.IntruderEventType.CREATE, intruder);
    }

    _onContactRemoved(eventType, contact) {
        let index = this._intruders.findIndex(entry => entry.contact === contact);
        if (index >= 0) {
            let removed = this._intruders.splice(index, 1);
            this._fireIntruderEvent(WT_TrafficAvoidanceSystem.IntruderEventType.REMOVE, removed[0]);
        }
    }

    /**
     * Adds a listener to this traffic avoidance system which will be called on certain events. Supported events
     * include addition of a new intruder, update of an existing intruder, and removal of an intruder.
     * @param {eventType:WT_TrafficAvoidanceSystem.IntruderEventType} eventType - the type of event to which the listener should respond.
     * @param {(eventType:WT_TrafficAvoidanceSystem.IntruderEventType, intruder:WT_TrafficAvoidanceSystemIntruder) => void} listener - a listener function.
     */
    addIntruderListener(eventType, listener) {
        this._listeners[eventType].push(listener);
    }

    /**
     * Removes a listener from this traffic avoidance system.
     * @param {eventType:WT_TrafficAvoidanceSystem.IntruderEventType} eventType - the type of event to which the listener was bound.
     * @param {(eventType:WT_TrafficAvoidanceSystem.IntruderEventType, intruder:WT_TrafficAvoidanceSystemIntruder) => void} listener - a listener function.
     */
    removeIntruderListener(eventType, listener) {
        let index = this._listeners[eventType].indexOf(listener);
        if (index >= 0) {
            this._listeners[eventType].splice(index, 1);
        }
    }

    _fireIntruderEvent(eventType, intruder) {
        this._listeners[eventType].forEach(listener => listener(eventType, intruder));
    }

    /**
     * Updates this traffic avoidance system. The TCA and related data for each intruder is recalculated based on the
     * most recent available data.
     */
    update() {
        let time = this._tempSecond.set(SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds")).readonly();
        this._ownAirplane.update(time);
        this._intruders.forEach(intruder => {
            intruder.update(time, this._ownAirplane, this.lookaheadTime, this.minimumGroundSpeed);
            this._fireIntruderEvent(WT_TrafficAvoidanceSystem.IntruderEventType.UPDATE, intruder);
        }, this);
    }
}
/**
 * @enum {Number}
 */
WT_TrafficAvoidanceSystem.IntruderEventType = {
    CREATE: 0,
    UPDATE: 1,
    REMOVE: 2
};
WT_TrafficAvoidanceSystem.OPTION_DEFS = {
    lookaheadTime: {default: WT_Unit.MINUTE.createNumber(20)},
    minimumGroundSpeed: {default: WT_Unit.KNOT.createNumber(30)}
};

/**
 * A traffic avoidance system's own airplane.
 */
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

        this._lastUpdatedTime = WT_Unit.SECOND.createNumber(0);

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
     * The time at which this airplane was last updated.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get lastUpdatedTime() {
        return this._lastUpdatedTime.readonly();
    }

    /**
     * The position of this airplane at the time of the last update.
     * @readonly
     * @type {WT_GeoPointReadOnly}
     */
    get position() {
        return this._position.readonly();
    }

    /**
     * The altitude of this airplane at the time of the last update.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get altitude() {
        return this._altitude.readonly();
    }

    /**
     * The true ground track of this airplane at the time of the last update.
     * @readonly
     * @type {Number}
     */
    get groundTrack() {
        return this._groundTrack;
    }

    /**
     * The ground speed of this airplane at the time of the last update.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get groundSpeed() {
        return this._groundSpeed.readonly();
    }

    /**
     * The vertical speed of this airplane at the time of the last update.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get verticalSpeed() {
        return this._verticalSpeed.readonly();
    }

    /**
     * The 3D position vector of this airplane at the time of the last update. By definition, this vector always points
     * to the origin. Each component is expressed in units of meters. The coordinate system is an Euclidean
     * approximation of the geodetic space around this airplane such that the z-coordinate represents orthometric
     * height (the reference datum being the altitude of this airplane) and the x- and y-coordinates represent an
     * equirectangular projection of latitude and longitude, with the positive x-axis pointing due east, the
     * positive y-axis pointing due south, and x = 0, y = 0 located at this aircraft's position.
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get positionVector() {
        return this._positionVector.readonly();
    }

    /**
     * The 3D velocity vector of this airplane at the time of the last update. Each component is expressed in units of
     * meters per second. The coordinate system is defined the same as for position vectors.
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
        let horizontalVelocity = this._tempVector2.setFromPolar(this.groundSpeed.asUnit(WT_Unit.MPS), this.groundTrack * Avionics.Utils.DEG2RAD);
        let verticalVelocity = this.verticalSpeed.asUnit(WT_Unit.MPS);
        this._velocityVector.set(horizontalVelocity.x, horizontalVelocity.y, verticalVelocity);
    }

    /**
     * Updates this airplane's position and velocity data.
     * @param {WT_NumberUnit} time - the current time.
     */
    update(time) {
        this._updateParameters();
        this._updateVectors();
        this._lastUpdatedTime.set(time);
    }
}

class WT_TrafficAvoidanceSystemIntruder {
    /**
     * @param {WT_TrafficContact} contact - the traffic contact to associate with the new intruder.
     */
    constructor(contact) {
        this._contact = contact;

        this._position = new WT_GeoPoint(0, 0);
        this._altitude = WT_Unit.FOOT.createNumber(0);
        this._positionVector = new WT_GVector3(0, 0, 0);
        this._velocityVector = new WT_GVector3(0, 0, 0);
        this._deltaPosition = new WT_GVector3(0, 0, 0);
        this._deltaVelocity = new WT_GVector3(0, 0, 0);

        this._isPredictionValid = false;
        this._tca = WT_Unit.SECOND.createNumber(NaN);
        this._tcaNorm = NaN;
        this._tcaDisplacement = new WT_GVector3(NaN, NaN, NaN);
        this._tcaHorizontalSeparation = WT_Unit.NMILE.createNumber(0);
        this._tcaVerticalSeparation = WT_Unit.FOOT.createNumber(0);

        this._lastUpdatedTime = WT_Unit.SECOND.createNumber(0);

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
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get lastUpdatedTime() {
        return this._lastUpdatedTime.readonly();
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
     * The most recent calculated position of this intruder.
     * @readonly
     * @type {WT_GeoPointReadOnly}
     */
    get position() {
        return this._position.readonly();
    }

    /**
     * The most recent calculated altitude of this intruder.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get altitude() {
        return this._altitude.readonly();
    }

    /**
     * The 3D position vector of this intruder. Each component is expressed in units of meters. The coordinate system
     * is an Euclidean approximation of the geodetic space around own airplane such that the z-coordinate represents
     * orthometric height (the reference datum being the altitude of own airplane) and the x- and y-coordinates
     * represent an equirectangular projection of latitude and longitude, with the positive x-axis pointing due east,
     * the positive y-axis pointing due south, and x = 0, y = 0 located at own aircraft's position.
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get positionVector() {
        return this._positionVector.readonly();
    }

    /**
     * The 3D velocity vector of this intruder. Each component is expressed in units of meters per second. The
     * coordinate system is defined the same as for position vectors.
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get velocityVector() {
        return this._velocityVector.readonly();
    }

    /**
     * The 3D position vector of this intruder relative to own airplane.
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get relativePositionVector() {
        return this._deltaPosition.readonly();
    }

    /**
     * The 3D velocity vector of this intruder relative to own airplane.
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
     * The predicted 3D displacement vector from own airplane to this intruder at time of closest approach.
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get tcaDisplacement() {
        return this._tcaDisplacement.readonly();
    }

    /**
     * The predicted horizontal separation between this intruder and own airplane at time of closest approach.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get tcaHorizontalSeparation() {
        return this._tcaHorizontalSeparation.readonly();
    }

    /**
     * The predicted vertical separation between this intruder and own airplane at time of closest approach.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get tcaVerticalSeparation() {
        return this._tcaVerticalSeparation.readonly();
    }

    _displacementToHorizontalSeparation(displacement, reference) {
        return reference.set(this._tempVector2_1.set(displacement).length, WT_Unit.METER);
    }

    _displacementToVerticalSeparation(displacement, reference) {
        return reference.set(Math.abs(displacement.z), WT_Unit.METER);
    }

    /**
     * Calculates the predicted 3D displacement vector from own airplane to this intruder at a specified time based on
     * the most recent available data. If insufficient data is available to calculate the prediction, null will be
     * returned.
     * @param {WT_NumberUnit} time - the time at which to calculate the displacement.
     * @param {WT_GVector3} [reference] - a WT_GVector3 object in which to store the result. If not supplied, a new
     *                                    object will be created.
     * @returns {WT_GVector3} the predicted displacement vector from own airplane to this intruder at the specified
     *                        time.
     */
    predictDisplacement(time, reference) {
        if (!this.isPredictionValid) {
            return null;
        }

        let dt = time.asUnit(WT_Unit.SECOND) - this.contact.lastContactTime.asUnit(WT_Unit.SECOND);
        if (!reference) {
            reference = new WT_GVector3(0, 0, 0);
        }
        return reference.set(this.relativeVelocityVector).scale(dt, true).add(this.relativePositionVector);
    }

    /**
     * Calculates the predicted separation between this intruder and own airplane at a specified time based on the most
     * recent available data and stores the results in the supplied WT_NumberUnit objects. If insufficient data is
     * available to calculate the prediction, the result will be a value of NaN.
     * @param {WT_NumberUnit} time - the time at which to calculate the separation.
     * @param {WT_NumberUnit} horizontalReference - a WT_NumberUnit object in which to store the horizontal separation.
     * @param {WT_NumberUnit} horizontalReference - a WT_NumberUnit object in which to store the vertical separation.
     */
    predictSeparation(time, horizontalReference, verticalReference) {
        if (!this.isPredictionValid) {
            horizontalReference.set(NaN);
            verticalReference.set(NaN);
            return;
        }

        let displacement = this.predictDisplacement(time, this._tempVector3);
        this._displacementToHorizontalSeparation(displacement, horizontalReference);
        this._displacementToVerticalSeparation(displacement, verticalReference);
    }

    /**
     *
     * @param {WT_NumberUnitReadOnly} time
     * @param {WT_TrafficAvoidanceSystemOwnAirplane} ownAirplane
     */
    _updatePosition(time, ownAirplane) {
        this.contact.predict(time, this._position, this._altitude);

        let distance = WT_Unit.GA_RADIAN.convert(this.position.distance(ownAirplane.position), WT_Unit.METER);
        let bearing = ownAirplane.position.bearingTo(this.position);
        let horizontalPosition = this._tempVector2_1.setFromPolar(distance, bearing * Avionics.Utils.DEG2RAD);
        let verticalPosition = this.altitude.asUnit(WT_Unit.METER) - ownAirplane.altitude.asUnit(WT_Unit.METER);
        this._positionVector.set(horizontalPosition.x, horizontalPosition.y, verticalPosition);
    }

    /**
     *
     * @param {WT_NumberUnitReadOnly} time
     * @param {WT_TrafficAvoidanceSystemOwnAirplane} ownAirplane
     */
    _updateVelocity(time, ownAirplane) {
        let horizontalVelocity = this._tempVector2_1.setFromPolar(this.contact.computedGroundSpeed.asUnit(WT_Unit.MPS), this.contact.computedGroundTrack * Avionics.Utils.DEG2RAD);
        let verticalVelocity = this.contact.computedVerticalSpeed.asUnit(WT_Unit.MPS);
        this._velocityVector.set(horizontalVelocity.x, horizontalVelocity.y, verticalVelocity);
    }

    /**
     *
     * @param {WT_NumberUnitReadOnly} time
     * @param {WT_TrafficAvoidanceSystemOwnAirplane} ownAirplane
     * @param {WT_NumberUnitReadOnly} minimumGroundSpeed
     */
    _updateVectors(time, ownAirplane, minimumGroundSpeed) {
        if (isNaN(this.contact.computedGroundTrack) || this.contact.computedGroundSpeed.compare(minimumGroundSpeed) < 0) {
            this._isPredictionValid = false;
            this._positionVector.set(NaN, NaN, NaN);
            this._velocityVector.set(NaN, NaN, NaN);
        } else {
            this._updatePosition(time, ownAirplane);
            this._updateVelocity(time, ownAirplane);
            this._isPredictionValid = true;
        }
    }

    /**
     *
     * @param {WT_GVector3} vector
     * @returns {Number}
     */
    _calculateCylindricalNorm(vector, radius, halfHeight) {
        let horizLength = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        return Math.max(Math.abs(vector.z) / halfHeight, horizLength / radius);
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
            if (t > 0) {
                this._addSolution(t, s, v, r, h, solutions, norms);
            }
        }
        if (v.z !== 0) {
            let t = -s.z / v.z;
            if (t > 0) {
                this._addSolution(t, s, v, r, h, solutions, norms);
            }
        }
        let discriminant = b * b - 4 * a * c;
        if (a !== 0 && discriminant >= 0) {
            let sqrt = Math.sqrt(discriminant);
            let t = (-b + sqrt) / (2 * a);
            if (t > 0) {
                this._addSolution(t, s, v, r, h, solutions, norms);
            }
            t = (-b - sqrt) / (2 * a);
            if (t > 0) {
                this._addSolution(t, s, v, r, h, solutions, norms);
            }
        } else if (a === 0 && b !== 0) {
            let t = -c / b;
            if (t > 0) {
                this._addSolution(t, s, v, r, h, solutions, norms);
            }
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
        this._displacementToHorizontalSeparation(tcaDisplacement, this._tcaHorizontalSeparation);
        this._displacementToVerticalSeparation(tcaDisplacement, this._tcaVerticalSeparation);
    }

    _invalidatePrediction() {
        this._deltaPosition.set(NaN, NaN, NaN);
        this._deltaVelocity.set(NaN, NaN, NaN);
        this._tca.set(NaN);
        this._tcaNorm = NaN;
        this._tcaDisplacement.set(NaN, NaN, NaN);
        this._tcaHorizontalSeparation.set(NaN);
        this._tcaVerticalSeparation.set(NaN);
    }

    /**
     * Updates this intruder's predicted TCA and related data.
     * @param {WT_NumberUnitReadOnly} time - the current time.
     * @param {WT_TrafficAvoidanceSystemOwnAirplane} ownAirplane - own airplane.
     * @param {WT_NumberUnitReadOnly} lookaheadTime - the maximum lookahead time to calculate TCA.
     * @param {WT_NumberUnitReadOnly} minimumGroundSpeed - the minimum ground speed this intruder must have to make
     *                                                     a valid prediction of TCA.
     */
    update(time, ownAirplane, lookaheadTime, minimumGroundSpeed) {
        this._updateVectors(time, ownAirplane, minimumGroundSpeed);
        if (this.isPredictionValid) {
            this._updateTCA(ownAirplane, lookaheadTime);
        } else {
            this._invalidatePrediction();
        }
        this._lastUpdatedTime.set(time);
    }
}