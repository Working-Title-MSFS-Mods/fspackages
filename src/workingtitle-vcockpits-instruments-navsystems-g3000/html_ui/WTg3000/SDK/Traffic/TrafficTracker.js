/**
 * Tracks aircraft traffic. Maintains a list of contacts, periodically updates their position, altitude, and reported
 * heading, and uses these data to compute ground speed, ground track, and vertical speed.
 */
class WT_TrafficTracker {
    /**
     * @param {Object} [options] - optional options to pass to the new tracker.
     */
    constructor(options) {
        /**
         * @type {Map<String,WT_TrafficContact>}
         */
        this._tracked = new Map();
        /**
         * @type {WT_TrafficContact[]}
         */
        this._trackedArray = [];
        this._trackedArrayReadOnly = new WT_ReadOnlyArray(this._trackedArray);

        /**
         * @type {((eventType:WT_TrafficTracker.EventType, contact:WT_TrafficContact) => void)[][]}
         */
        this._listeners = [[], [], []];

        this._optsManager = new WT_OptionsManager(this, WT_TrafficTracker.OPTION_DEFS);
        this._optsManager.setOptions(options);

        this._tempGeoPoint = new WT_GeoPoint(0, 0);
        this._tempMeters = WT_Unit.METER.createNumber(0);
        this._tempBearingTrue = new WT_NavAngleUnit(false).createNumber(0);
    }

    /**
     * An array of contacts currently being tracked.
     * @readonly
     * @type {WT_ReadOnlyArray<WT_TrafficContact>}
     */
    get contacts() {
        return this._trackedArrayReadOnly;
    }

    /**
     *
     * @param {Object} entry
     */
    _createContact(entry) {
        let id = `${entry.uId}`;
        let position = this._tempGeoPoint.set(entry.lat, entry.lon);
        let altitude = this._tempMeters.set(entry.alt);
        let heading = this._tempBearingTrue.set(entry.heading);
        let contact = new WT_TrafficContact(id, position, altitude, heading, this.contactOptions);
        this._tracked.set(id, contact);
        this._trackedArray.push(contact);
        this._listeners[WT_TrafficTracker.EventType.CONTACT_CREATED].forEach(listener => listener(WT_TrafficTracker.EventType.CONTACT_CREATED, contact));
    }

    /**
     *
     * @param {WT_TrafficContact} contact
     * @param {Object} entry
     */
    _updateContact(contact, entry) {
        let position = this._tempGeoPoint.set(entry.lat, entry.lon);
        let altitude = this._tempMeters.set(entry.alt);
        let heading = this._tempBearingTrue.set(entry.heading);
        contact.update(position, altitude, heading);
        this._listeners[WT_TrafficTracker.EventType.CONTACT_UPDATED].forEach(listener => listener(WT_TrafficTracker.EventType.CONTACT_UPDATED, contact));
    }

    _updateContacts(data) {
        data.forEach(entry => {
            let contact = this._tracked.get(`${entry.uId}`);
            if (contact) {
                this._updateContact(contact, entry);
            } else {
                this._createContact(entry);
            }
        }, this);
    }

    _deprecateContacts() {
        let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
        for (let i = 0; i < this._trackedArray.length; i++) {
            let contact = this._trackedArray[i];
            let dt = currentTime - contact.lastContactTime.asUnit(WT_Unit.SECOND);
            if (dt >= this.contactDeprecateTime) {
                this._tracked.delete(contact.id);
                this._trackedArray.splice(i, 1);
                i--;
                this._listeners[WT_TrafficTracker.EventType.CONTACT_REMOVED].forEach(listener => listener(WT_TrafficTracker.EventType.CONTACT_REMOVED, contact));
            }
        }
    }

    /**
     * Adds a listener to be called on certain events. Supported events include creation of a new contact, update of an
     * existing contact, and removal of a contact.
     * @param {WT_TrafficTracker.EventType} eventType - the type of event to which the listener should respond.
     * @param {(eventType:WT_TrafficTracker.EventType, contact:WT_TrafficContact) => void} listener - a listener function.
     */
    addListener(eventType, listener) {
        this._listeners[eventType].push(listener);
    }

    /**
     * Removes a listener from this tracker.
     * @param {WT_TrafficTracker.EventType} eventType - the type of event to which the listener was bound.
     * @param {(eventType:WT_TrafficTracker.EventType, contact:WT_TrafficContact) => void} listener - a listener function.
     */
    removeListener(eventType, listener) {
        let array = this._listeners[eventType];
        let index = array.indexOf(listener);
        if (index >= 0) {
            array.splice(index, 1);
        }
    }

    /**
     * Updates this tracker. This will create new contacts as they are found, update existing contacts based on new
     * data, and remove contacts which can no longer be found.
     * @returns {Promise<void>} a Promise which resolves when the update is complete.
     */
    async update() {
        let data = await Coherent.call("GET_AIR_TRAFFIC");
        this._updateContacts(data);
        this._deprecateContacts();
    }
}
/**
 * @enum {Number}
 */
WT_TrafficTracker.EventType = {
    CONTACT_CREATED: 0,
    CONTACT_UPDATED: 1,
    CONTACT_REMOVED: 2
};
WT_TrafficTracker.OPTION_DEFS = {
    contactDeprecateTime: {default: 10, auto: true},
    contactOptions: {default: {}, auto: true}
};

/**
 * An aircraft contact that is being tracked. Each contact tracks its last reported position, altitude, and heading.
 * Successively updating these values will allow ground speed, ground track, and vertical speed to be calculated based
 * on changes in the values over time. The calculated values are exponentially smoothed to reduce artifacts from
 * potentially noisy data.
 */
class WT_TrafficContact {
    /**
     * @param {String} id - the new contact's unique ID.
     * @param {{lat:Number, long:Number}} position - the initial reported lat/long coordinates of the new contact.
     * @param {WT_NumberUnit} altitude - the initial reported altitude of the new contact.
     * @param {WT_NumberUnit} heading - the initial reported heading of the new contact.
     * @param {Object} [options] - optional options to pass to the new contact.
     */
    constructor(id, position, altitude, heading, options) {
        this._id = id;
        this._lastPosition = new WT_GeoPoint(position.lat, position.long);
        this._lastAltitude = WT_Unit.FOOT.createNumber(altitude.asUnit(WT_Unit.FOOT));

        let headingUnit = new WT_NavAngleUnit(false, this._lastPosition);
        this._lastHeading = headingUnit.createNumber(heading.asUnit(headingUnit));

        this._lastContactTime = WT_Unit.SECOND.createNumber(SimVar.GetSimVarValue("E:ZULU TIME", "seconds"));

        this._computedGroundSpeed = WT_Unit.KNOT.createNumber(NaN);
        this._computedGroundTrack = NaN;
        this._computedVerticalSpeed = WT_Unit.FPM.createNumber(NaN);

        this._maxValidGroundSpeed = WT_Unit.KNOT.createNumber(0);
        this._maxValidVerticalSpeed = WT_Unit.FPM.createNumber(0);

        this._optsManager = new WT_OptionsManager(this, WT_TrafficContact.OPTION_DEFS);
        this._optsManager.setOptions(options);

        this._groundSpeedSmoother = new WT_ExponentialSmoother(this.groundSpeedSmoothingConstant, null, this.contactTimeResetThreshold);
        this._groundTrackSmoother = new WT_ExponentialSmoother(this.groundTrackSmoothingConstant, null, this.contactTimeResetThreshold);
        this._verticalSpeedSmoother = new WT_ExponentialSmoother(this.verticalSpeedSmoothingConstant, null, this.contactTimeResetThreshold);
    }

    /**
     * This contact's unique ID.
     * @readonly
     * @type {String}
     */
    get id() {
        return this._id;
    }

    /**
     * The time at which this contact last reported its position, altitude, and heading.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get lastContactTime() {
        return this._lastContactTime.readonly();
    }

    /**
     * The last reported position of this contact.
     * @readonly
     * @type {WT_GeoPointReadOnly}
     */
    get lastPosition() {
        return this._lastPosition.readonly();
    }

    /**
     * The last reported altitude of this contact.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get lastAltitude() {
        return this._lastAltitude.readonly();
    }

    /**
     * The last reported heading of this contact.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get lastHeading() {
        return this._lastHeading.readonly();
    }

    /**
     * The most recent computed ground speed of this contact. If there are insufficient data to calculate ground speed,
     * the returned value will be equal to NaN.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get computedGroundSpeed() {
        return this._computedGroundSpeed.readonly();
    }

    /**
     * The most recent computed true ground track of this contact. If there are insufficient data to calculate the
     * track, the returned value will be equal to NaN.
     * @readonly
     * @type {Number}
     */
    get computedGroundTrack() {
        return this._computedGroundTrack;
    }

    /**
     * The most recent computed vertical speed of this contact. If there are insufficient data to calculate vertical
     * speed, the returned value will be euqal to NaN.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get computedVerticalSpeed() {
        return this._computedVerticalSpeed.readonly();
    }

    /**
     * @type {WT_NumberUnit}
     */
    get maxValidGroundSpeed() {
        return this._maxValidGroundSpeed.readonly();
    }

    set maxValidGroundSpeed(speed) {
        this._maxValidGroundSpeed.set(speed);
    }

    /**
     * @type {WT_NumberUnit}
     */
    get maxValidVerticalSpeed() {
        return this._maxValidVerticalSpeed.readonly();
    }

    set maxValidVerticalSpeed(speed) {
        this._maxValidVerticalSpeed.set(speed);
    }

    /**
     * Calculates the predicted position and altitude of this contact at a specified time based on the most recent
     * available data and stores the results in the supplied objects. If insufficient data are available to calculate
     * the prediction, the results will be equal to NaN.
     * @param {NumberUnit} time - the time at which to calculate the prediction.
     * @param {WT_GeoPoint} positionReference - a WT_GeoPoint object in which to store the position.
     * @param {WT_NumberUnit} altitudeReference - a WT_NumberUnit object in which to store the altitude.
     */
    predict(time, positionReference, altitudeReference) {
        if (this.computedGroundSpeed.isNaN()) {
            positionReference.set(NaN, NaN);
            altitudeReference.set(NaN);
        }

        let dt = time.asUnit(WT_Unit.SECOND) - this.lastContactTime.asUnit(WT_Unit.SECOND);

        let distance = WT_Unit.NMILE.convert(this.computedGroundSpeed.asUnit(WT_Unit.KNOT) * (dt / 3600), WT_Unit.GA_RADIAN);
        positionReference.set(this.lastPosition).offset(this.computedGroundTrack, distance, true);

        let deltaAlt = this.computedVerticalSpeed.asUnit(WT_Unit.FPM) * (dt / 60);
        altitudeReference.set(this.lastAltitude).add(deltaAlt, WT_Unit.FOOT);
    }

    /**
     *
     * @param {Number} dt
     * @param {WT_GeoPoint} newPosition
     */
     _updateGroundSpeed(dt, newPosition) {
        let dtHours = dt / 3600;
        let distanceNM = WT_Unit.GA_RADIAN.convert(newPosition.distance(this.lastPosition), WT_Unit.NMILE);
        let speedKnots = distanceNM / dtHours;
        this._computedGroundSpeed.set(this._groundSpeedSmoother.next(speedKnots, dt));
    }

    /**
     *
     * @param {Number} dt
     * @param {WT_GeoPoint} newPosition
     */
    _updateGroundTrack(dt, newPosition) {
        let track = newPosition.bearingFrom(this._lastPosition);
        this._computedGroundTrack = this._groundTrackSmoother.next(track, dt);
    }

    /**
     *
     * @param {Number} dt
     * @param {WT_GeoPoint} newPosition
     * @param {WT_NumberUnit} newAltitude
     */
    _updateVerticalSpeed(dt, newAltitude) {
        let dtMin = dt / 60;
        let deltaAltFeet = newAltitude.asUnit(WT_Unit.FOOT) - this._lastAltitude.number;
        let vsFPM = deltaAltFeet / dtMin;
        this._computedVerticalSpeed.set(this._verticalSpeedSmoother.next(vsFPM, dt));
    }

    _checkValidity() {
        let isGroundSpeedValid = this.computedGroundSpeed.compare(this.maxValidGroundSpeed) <= 0;
        let isVerticalSpeedValid = this.computedVerticalSpeed.compare(this.maxValidVerticalSpeed) <= 0;
        return isGroundSpeedValid && isVerticalSpeedValid;
    }

    _setReportedValues(position, altitude, heading) {
        this._lastPosition.set(position);
        this._lastAltitude.set(altitude);
        this._lastHeading.unit.setLocation(position);
        this._lastHeading.set(heading);
    }

    /**
     * Updates this contact with the current reported position, altitude and heading. Also updates the computed ground
     * speed, ground track, and vertical speed if there are sufficient data to do so.
     * @param {WT_GeoPoint} position - the current reported position.
     * @param {WT_NumberUnit} altitude - the current reported altitude.
     * @param {WT_NumberUnit} heading - the current reported heading.
     */
    update(position, altitude, heading) {
        let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
        let dt = currentTime - this._lastContactTime.number;
        if (dt < 0 || dt > this.contactTimeResetThreshold) {
            this.reset(position, altitude, heading);
            return;
        }

        if (dt > 0) {
            this._updateGroundSpeed(dt, position);
            this._updateGroundTrack(dt, position);
            this._updateVerticalSpeed(dt, altitude);
        }

        if (this._checkValidity()) {
            this._setReportedValues(position, altitude, heading);
            this._lastContactTime.set(currentTime);
        } else {
            this.reset(position, altitude, heading);
        }
    }

    /**
     * Erases this contact's tracking history and sets the initial reported position, altitude, and heading.
     * @param {WT_GeoPoint} position - the new initial reported position.
     * @param {WT_NumberUnit} altitude - the new initial reported altitude.
     * @param {WT_NumberUnit} heading - the new initial reported heading.
     */
    reset(position, altitude, heading) {
        this._setReportedValues(position, altitude, heading);
        this._computedGroundSpeed.set(NaN);
        this._computedGroundTrack = NaN;
        this._computedVerticalSpeed.set(NaN);
        this._groundSpeedSmoother.reset();
        this._groundTrackSmoother.reset();
        this._verticalSpeedSmoother.reset();
        this._lastContactTime.set(SimVar.GetSimVarValue("E:ZULU TIME", "seconds"));
    }
}
WT_TrafficContact.OPTION_DEFS = {
    groundSpeedSmoothingConstant: {default: 2, auto: true},
    groundTrackSmoothingConstant: {default: 2, auto: true},
    verticalSpeedSmoothingConstant: {default: 2, auto: true},
    contactTimeResetThreshold: {default: 5, auto: true},
    maxValidGroundSpeed: {default: WT_Unit.KNOT.createNumber(1500)},
    maxValidVerticalSpeed: {default: WT_Unit.FPM.createNumber(10000)}
};