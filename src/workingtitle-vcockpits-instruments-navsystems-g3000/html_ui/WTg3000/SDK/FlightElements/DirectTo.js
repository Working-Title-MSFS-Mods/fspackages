class WT_DirectTo {
    constructor(options) {
        /**
         * @type {WT_FlightPathWaypoint}
         */
        this._origin = null;
        /**
         * @type {WT_Waypoint}
         */
        this._destination = null;
        this._initialBearing = new WT_NavAngleUnit(false).createNumber(0);
        this._finalBearing = new WT_NavAngleUnit(false).createNumber(0);

        this._vnavPath = new WT_VNAVPath();
        this._vnavOffset = WT_Unit.NMILE.createNumber(0);

        this._isActive = false;
        this._isVNAVActive = false;
        this._hasVNAVPath = false;

        this._listeners = [];

        this._optsManager = new WT_OptionsManager(this, WT_DirectTo.OPTION_DEFS);
        if (options) {
            this._optsManager.setOptions(options);
        }
    }

    /**
     * @readonly
     * @type {WT_VNAVPathReadOnly}
     */
    get vnavPath() {
        return this.isVNAVActive() ? this._vnavPath.readonly() : null;
    }

    /**
     * @returns {WT_Waypoint}
     */
    getOrigin() {
        return this._origin;
    }

    /**
     * @returns {WT_Waypoint}
     */
    getDestination() {
        return this._destination;
    }

    /**
     *
     * @returns {WT_NumberUnitReadOnly}
     */
    getInitialBearing() {
        return this.isActive() ? this._initialBearing.readonly() : null;
    }

    /**
     *
     * @returns {WT_NumberUnitReadOnly}
     */
    getFinalBearing() {
        return this.isActive() ? this._finalBearing.readonly() : null;
    }

    /**
     *
     * @returns {WT_NumberUnitReadOnly}
     */
    getFinalAltitude() {
        return this._hasVNAVPath ? this._vnavPath.finalAltitude : undefined;
    }

    /**
     *
     * @returns {WT_NumberUnitReadOnly}
     */
    getVNAVOffset() {
        return this._hasVNAVPath ? this._vnavOffset.readonly() : undefined;
    }

    isActive() {
        return this._isActive;
    }

    isVNAVActive() {
        return this._isVNAVActive;
    }

    _initVNAVPath(eventData) {
        if (!this._hasVNAVPath || this._vnavPath.initialAltitude.isNaN() || this._vnavPath.initialAltitude.compare(this._vnavPath.finalAltitude) < 0) {
            this._isVNAVActive = false;
            return;
        }

        let distance = WT_DirectTo._tempNM.set(this.getDestination().location.distance(this.getOrigin().location), WT_Unit.GA_RADIAN).add(this._vnavOffset);
        let flightPathAngle = this._vnavPath.getFlightPathAngleRequiredAt(distance, this._vnavPath.initialAltitude)

        if (flightPathAngle < this.minDescentFlightPathAngle) {
            this._isVNAVActive = false;
            return;
        }

        this._vnavPath.setFlightPathAngle(flightPathAngle);
        this._vnavPath.compute();

        this._isVNAVActive = true;

        eventData.types = eventData.types | WT_DirectToEvent.Type.VNAV_PATH_CHANGED;
    }

    /**
     *
     * @param {{lat:Number, long:Number}} origin
     * @param {Object} eventData
     */
    _activate(origin, eventData) {
        if (this.isActive() && this._origin.location.equals(origin)) {
            return;
        }

        this._origin = new WT_FlightPathWaypoint("DRCT-ORIG", origin);
        this._isActive = true;

        this._initialBearing.unit.setLocation(origin);
        this._initialBearing.set(this._origin.location.bearingTo(this._destination.location));
        this._finalBearing.unit.setLocation(this._destination.location);
        this._finalBearing.set(this._destination.location.bearingFrom(this._origin.location));

        eventData.types = eventData.types | WT_DirectToEvent.Type.ACTIVATED;

        this._initVNAVPath(eventData);
    }

    _deactivate(eventData) {
        if (!this.isActive()) {
            return;
        }

        this._isActive = false;
        this._isVNAVActive = false;
        eventData.types = eventData.types | WT_DirectToEvent.Type.DEACTIVATED;
    }

    _changeDestination(destination, eventData) {
        if ((!this._destination && !destination) || (destination && destination.equals(this._destination))) {
            return;
        }

        eventData.types = eventData.types | WT_DirectToEvent.Type.DESTINATION_CHANGED;
        eventData.oldDestination = this._destination;
        this._destination = destination;
    }

    /**
     *
     * @param {{lat:Number, long:Number}} origin
     */
    activate(origin) {
        if (origin) {
            let eventData = {types: 0};
            this._activate(origin, eventData);
            this._fireEvent(eventData);
        }
    }

    deactivate() {
        let eventData = {types: 0};
        this._deactivate(eventData);
        this._fireEvent(eventData);
    }

    /**
     *
     * @param {WT_NumberUnitObject} initialAltitude
     * @param {WT_NumberUnitObject} distanceRemaining
     */
    activateVNAVDirectTo(initialAltitude, distanceRemaining) {
        if (!this._isVNAVActive) {
            return false;
        }

        let flightPathAngle = this._vnavPath.getFlightPathAngleRequiredAt(distanceRemaining, initialAltitude);
        if (flightPathAngle < this.minDescentFlightPathAngle) {
            return false;
        }

        this._vnavPath.setInitialAltitude(initialAltitude);
        this._vnavPath.setFlightPathAngle(flightPathAngle);
        this.computeVNAVPath();
        return true;
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    setDestination(waypoint) {
        let eventData = {types: 0};
        if (!waypoint && this.isActive()) {
            this._deactivate(eventData);
        }

        this._changeDestination(waypoint, eventData);
        this._fireEvent(eventData);
    }

    _changeFinalAltitude(altitude, eventData) {
        if ((!altitude && !this._hasVNAVPath) || (altitude && altitude.equals(this._vnavPath.finalAltitude))) {
            return;
        }

        let oldFinalAltitude = this._hasVNAVPath ? this.getFinalAltitude().copy().readonly() : undefined;
        if (altitude) {
            this._vnavPath.setFinalAltitude(altitude);
            this._hasVNAVPath = true;
        } else {
            this._vnavPath.setFinalAltitude(NaN);
            this._hasVNAVPath = false;
        }

        eventData.types = eventData.types | WT_DirectToEvent.Type.FINAL_ALTITUDE_CHANGED;
        eventData.oldFinalAltitude = oldFinalAltitude;

        if (this.isActive()) {
            this._initVNAVPath(eventData);
        }
    }

    /**
     *
     * @param {WT_NumberUnitObject} altitude
     */
    setFinalAltitude(altitude) {
        let eventData = {types: 0};
        this._changeFinalAltitude(altitude, eventData);
        this._fireEvent(eventData);
    }

    _changeVNAVOffset(offset, eventData) {
        if (offset.equals(this._vnavOffset)) {
            return;
        }

        let oldVNAVOffset = this._vnavOffset.copy();
        this._vnavOffset.set(offset);

        eventData.types = eventData.types | WT_DirectToEvent.Type.VNAV_PATH_CHANGED;
        eventData.oldVNAVOffset = oldVNAVOffset.readonly();

        if (this.isActive()) {
            this._initVNAVPath(eventData);
        }
    }

    /**
     *
     * @param {WT_NumberUnitObject} offset
     */
    setVNAVOffset(offset) {
        let eventData = {types: 0};
        this._changeVNAVOffset(offset, eventData);
        this._fireEvent(eventData);
    }

    _changeInitialAltitude(altitude, eventData) {
        if ((!altitude && !this._vnavPath.initialAltitude.isNaN()) || (altitude && altitude.equals(this._vnavPath.initialAltitude))) {
            return;
        }

        if (altitude) {
            this._vnavPath.setInitialAltitude(altitude);
        } else {
            this._vnavPath.setInitialAltitude(NaN);
        }

        if (this.isActive()) {
            this._initVNAVPath(eventData);
        }
    }

    /**
     *
     * @param {WT_NumberUnitObject} altitude
     */
    setInitialAltitude(altitude) {
        let eventData = {types: 0};
        this._changeInitialAltitude(altitude, eventData);
        this._fireEvent(eventData);
    }

    /**
     *
     * @param {Number} angle
     */
    setFlightPathAngle(angle) {
        this._vnavPath.setFlightPathAngle(angle);
    }

    /**
     *
     * @param {WT_NumberUnitObject} target
     * @param {WT_NumberUnitObject} groundSpeed
     */
    setVerticalSpeedTarget(target, groundSpeed) {
        this._vnavPath.setVerticalSpeedTarget(target, groundSpeed);
    }

    _computeVNAVPath(eventData) {
        let oldDistance = this.vnavPath.getTotalDistance().asUnit(WT_Unit.NMILE);
        this._vnavPath.compute();
        if (oldDistance !== this.vnavPath.getTotalDistance()) {
            eventData.types = eventData.types | WT_DirectToEvent.Type.VNAV_PATH_CHANGED;
        }
    }

    computeVNAVPath() {
        if (!this.isVNAVActive()) {
            return;
        }

        let eventData = {types: 0};
        this._computeVNAVPath(eventData);
        this._fireEvent(eventData);
    }

    _fireEvent(eventData) {
        if (eventData.types === 0) {
            return;
        }

        let event = new WT_DirectToEvent(this, eventData);
        for (let listener of this._listeners) {
            listener(event);
        }
    }

    addListener(listener) {
        this._listeners.push(listener);
    }

    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    clearListeners() {
        this._listeners = [];
    }
}
WT_DirectTo._tempNM = WT_Unit.NMILE.createNumber(0);
WT_DirectTo.OPTION_DEFS = {
    defaultDescentFlightPathAngle: {default: -3, auto: true},
    maxDescentFlightPathAngle: {default: -1.5, auto: true},
    minDescentFlightPathAngle: {default: -6, auto: true}
};

class WT_DirectToEvent {
    constructor(directTo, data) {
        this._directTo = directTo;
        this._data = data;
    }

    /**
     * @readonly
     * @type {WT_DirectTo}
     */
    get directTo() {
        return this._directTo;
    }

    /**
     * @readonly
     * @type {Number}
     */
    get types() {
        return this._data.types;
    }

    anyType(type) {
        return (this.types & type) !== 0;
    }

    allTypes(type) {
        return (this.types & type) === type;
    }

    /**
     * @readonly
     * @type {WT_Waypoint}
     */
    get oldDestination() {
        return this._data.oldDestination;
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get oldFinalAltitude() {
        return this._data.oldFinalAltitude;
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get oldVNAVOffset() {
        return this._data.oldVNAVOffset;
    }
}
/**
 * @enum {Number}
 */
WT_DirectToEvent.Type = {
    DESTINATION_CHANGED: 1,
    FINAL_ALTITUDE_CHANGED: 1 << 1,
    VNAV_OFFSET_CHANGED: 1 << 2,
    ACTIVATED: 1 << 3,
    DEACTIVATED: 1 << 4,
    VNAV_PATH_CHANGED: 1 << 5
};