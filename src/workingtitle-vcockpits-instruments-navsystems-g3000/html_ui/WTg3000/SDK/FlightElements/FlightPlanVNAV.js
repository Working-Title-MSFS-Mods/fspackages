/**
 * A VNAV component for a flight plan. Defines and manages flight plan leg VNAV restrictions.
 */
class WT_FlightPlanVNAV {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_FlightPlan} flightPlan
     * @param {Object} [options]
     */
    constructor(flightPlan, options) {
        this._flightPlan = flightPlan;

        /**
         * @type {WT_FlightPlanVNAVLegRestriction[]}
         */
        this._legRestrictions = [];
        this._legRestrictionsReadOnly = new WT_ReadOnlyArray(this._legRestrictions);

        /**
         * @type {WT_FlightPlanVNAVLegRestriction}
         */
        this._firstDescentLegRestriction = null;
        /**
         * @type {WT_FlightPlanVNAVLegRestriction}
         */
        this._lastDescentLegRestriction = null;

        this._legRestrictionListener = this._onLegRestrictionChanged.bind(this);

        /**
         * @type {WT_FlightPlanVNAVListener[]}
         */
        this._listeners = [];

        this._optsManager = new WT_OptionsManager(this, WT_FlightPlanVNAV.OPTION_DEFS);
        if (options) {
            this._optsManager.setOptions(options);
        }

        this._tempNM = WT_Unit.NMILE.createNumber(0);
        this._tempFeet = WT_Unit.FOOT.createNumber(0);

        this._flightPlan.addListener(this._onFlightPlanEvent.bind(this));
        this.build();

        this._ignoreFlightPlanEvents = false;
    }

    /**
     * The flight plan associated with this VNAV component.
     * @readonly
     * @type {WT_FlightPlan}
     */
    get flightPlan() {
        return this._flightPlan;
    }

    /**
     * An array of flight plan leg VNAV restrictions. Each restriction is indexed according to the index of the flight
     * plan leg with which it is associated.
     * @readonly
     * @type {WT_ReadOnlyArray<WT_FlightPlanVNAVLegRestriction>}
     */
    get legRestrictions() {
        return this._legRestrictionsReadOnly;
    }

    /**
     * Gets the first flight plan leg VNAV restriction of the descent phase.
     * @returns {WT_FlightPlanVNAVLegDesignatedRestriction} the first flight plan leg VNAV restriction of the descent
     *          phase.
     */
    getFirstDescentLegRestriction() {
        return this._firstDescentLegRestriction;
    }

    /**
     * Gets the last flight plan leg VNAV restriction of the descent phase, which is also the last restriction in the
     * flight plan.
     * @returns {WT_FlightPlanVNAVLegDesignatedRestriction} the last flight plan leg VNAV restriction of the descent
     *          phase.
     */
    getLastDescentLegRestriction() {
        return this._lastDescentLegRestriction;
    }

    setOptions(options) {
        this._optsManager.setOptions(options);
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @returns {WT_NumberUnitReadOnly}
     */
    _getAltitudeRestrictionFromLeg(leg) {
        if (!leg.altitudeConstraint.isSuppressed && (leg.altitudeConstraint.customAltitude || (leg.altitudeConstraint.publishedConstraint && leg.altitudeConstraint.publishedConstraint.type !== WT_AltitudeConstraint.Type.NONE))) {
            if (leg.altitudeConstraint.customAltitude) {
                return leg.altitudeConstraint.customAltitude;
            } else {
                switch (leg.altitudeConstraint.publishedConstraint.type) {
                    case WT_AltitudeConstraint.Type.AT:
                    case WT_AltitudeConstraint.Type.AT_OR_ABOVE:
                    case WT_AltitudeConstraint.Type.BETWEEN:
                        return leg.altitudeConstraint.publishedConstraint.floor;
                    case WT_AltitudeConstraint.Type.AT_OR_BELOW:
                        return leg.altitudeConstraint.publishedConstraint.ceiling;
                }
            }
        }
        return null;
    }

    _clearData() {
        this._legRestrictions.forEach(legRestriction => {
            if (legRestriction && legRestriction.isDesignated && legRestriction.isValid) {
                legRestriction.removeListener(this._legRestrictionListener);
            }
        }, this);
        this._legRestrictions.splice(0, this._legRestrictions.length);
        this._lastDescentLegRestriction = null;
        this._firstDescentLegRestriction = null;
    }

    /**
     *
     * @returns {WT_FlightPlanVNAVLegRestriction}
     */
    _createLastDescentLegRestriction() {
        // find the last leg (that is not the destination airport or runway fix leg) with a published altitude constraint or custom altitude entry

        let lastDescentLegRestriction = null;
        let destinationLeg = this.flightPlan.getDestination().leg();
        for (let i = this.flightPlan.legs.length - 1; i >= 0; i--) {
            let leg = this.flightPlan.legs.get(i);
            if (leg !== destinationLeg && !(leg.fix instanceof WT_RunwayWaypoint)) {
                let altitudeRestriction = this._getAltitudeRestrictionFromLeg(leg);
                if (altitudeRestriction) {
                    lastDescentLegRestriction = new WT_FlightPlanVNAVLegDesignatedRestriction(leg, altitudeRestriction, true);
                    break;
                }
            }
        }

        if (lastDescentLegRestriction) {
            this._legRestrictions[lastDescentLegRestriction.leg.index] = lastDescentLegRestriction;
            this._lastDescentLegRestriction = lastDescentLegRestriction;
        }
    }

    _getHighestRestrictionleg() {
        // tiebreakers go to the earlier leg

        let highestLeg = this._lastDescentLegRestriction.leg;
        let highestAltitude = this._lastDescentLegRestriction.altitude;
        for (let i = this._lastDescentLegRestriction.leg.index - 1; i >= 0; i--) {
            let leg = this.flightPlan.legs.get(i);
            let altitudeRestriction = this._getAltitudeRestrictionFromLeg(leg);
            if (altitudeRestriction && altitudeRestriction.compare(highestAltitude) >= 0) {
                highestLeg = leg;
                highestAltitude = altitudeRestriction;
            }
        }

        return highestLeg;
    }

    /**
     *
     * @param {WT_FlightPlanLeg} highestRestrictionLeg
     */
    _createDescentDesignatedRestrictions(highestRestrictionLeg) {
        // walk backwards through the flight plan, starting with the leg identified as the last descent restriction leg,
        // creating new designated restrictions every time we come across either a custom set altitude restriction or a
        // published altitude restriction. If meeting a restriction requires a steeper flight path angle than the
        // maximum in order to reach the next restriction in the sequence, the restriction that appears earlier in the
        // flight plan is marked as invalid and won't be used for VNAV. All valid restrictions are initialized with a
        // flight path angle equal to either the shallowest angle that allows the aircraft to meet the restriction when
        // flying from the previous valid designated restriction, or the default descent flight path angle, whichever is
        // steeper.

        let prevLegRestriction = this._lastDescentLegRestriction;
        for (let i = prevLegRestriction.leg.index - 1; i >= highestRestrictionLeg.index; i--) {
            let leg = this.flightPlan.legs.get(i);
            let altitudeRestriction = this._getAltitudeRestrictionFromLeg(leg);
            if (altitudeRestriction) {
                let compare = altitudeRestriction.compare(prevLegRestriction.altitude);
                if (compare >= 0) {
                    let distance = this._tempNM.set(prevLegRestriction.leg.cumulativeDistance).subtract(leg.cumulativeDistance);
                    let flightPathAngle = prevLegRestriction.vnavPath.getFlightPathAngleRequiredAt(distance, altitudeRestriction);
                    let isValid = flightPathAngle >= this.minDescentFlightPathAngle;
                    this._legRestrictions[i] = new WT_FlightPlanVNAVLegDesignatedRestriction(leg, altitudeRestriction, isValid);
                    if (isValid) {
                        prevLegRestriction.setInitialAltitude(altitudeRestriction);
                        prevLegRestriction.setFlightPathAngle((flightPathAngle !== 0 && flightPathAngle > this.maxDescentFlightPathAngle) ? this.defaultDescentFlightPathAngle : flightPathAngle);
                        prevLegRestriction.computeVNAVPath();
                        prevLegRestriction.addListener(this._legRestrictionListener);
                        prevLegRestriction = this._legRestrictions[i];
                    }
                } else {
                    this._legRestrictions[i] = new WT_FlightPlanVNAVLegDesignatedRestriction(leg, altitudeRestriction, false);
                }
            }
        }

        prevLegRestriction.setFlightPathAngle(this.defaultDescentFlightPathAngle);
        prevLegRestriction.addListener(this._legRestrictionListener);
        this._firstDescentLegRestriction = prevLegRestriction;
    }

    _rebuildDescent() {
        this._createLastDescentLegRestriction();
        if (this._lastDescentLegRestriction) {
            let highestRestrictionLeg = this._getHighestRestrictionleg();
            this._createDescentDesignatedRestrictions(highestRestrictionLeg);
        }
    }

    /**
     * Builds a sequence of flight plan leg VNAV restrictions based on altitude constraints found in the flight plan.
     * Designated restrictions are created from custom altitude constraints and published constraints. When a
     * designated restriction is not created for a leg, an advisory restriction is created instead where appropriate
     * based on the VNAV paths from nearby designated restrictions.
     */
    build() {
        this._clearData();
        this._legRestrictions.length = this.flightPlan.legs.length;
        this._legRestrictions.fill(null);
        this._rebuildDescent();
        this.computeAdvisoryRestrictions();
    }

    _findPreviousDesignatedDescentLegRestrictionIndex(endIndex) {
        for (let i = endIndex - 1; i >= 0; i--) {
            let legRestriction = this._legRestrictions[i];
            if (legRestriction && legRestriction.isDesignated && legRestriction.isValid) {
                return i;
            }
        }
        return -1;
    }

    /**
     *
     * @param {WT_FlightPlanVNAVLegDesignatedRestriction} designatedRestriction
     * @param {Number} [beginIndex]
     */
    _computeAdvisoryRestrictions(designatedRestriction, beginIndex) {
        if (!designatedRestriction.isDesignated || designatedRestriction.vnavPath.getTotalDistance().isNaN()) {
            return;
        }

        if (typeof beginIndex !== "number") {
            beginIndex = this._findPreviousDesignatedDescentLegRestrictionIndex(designatedRestriction.leg.index);
        }

        for (let i = designatedRestriction.leg.index - 1; i > beginIndex; i--) {
            let legRestriction = this._legRestrictions[i];
            if (!legRestriction || !legRestriction.isDesignated) {
                let leg = this.flightPlan.legs.get(i);
                if (leg === this.flightPlan.getOrigin().leg() || leg.fix instanceof WT_RunwayWaypoint) {
                    // do not create advisory restriction for origin or runway fix legs
                    continue;
                }

                let distanceRemaining = this._tempNM.set(designatedRestriction.leg.cumulativeDistance).subtract(leg.cumulativeDistance);
                if (beginIndex < 0 && distanceRemaining.compare(designatedRestriction.vnavPath.getTotalDistance()) > 0) {
                    // if designated restriction is the first descent restriction in the fpln, only create advisory restrictions
                    // at and after the TOD
                    this._legRestrictions[i] = null;
                } else {
                    let altitude = designatedRestriction.vnavPath.getTargetAltitudeAt(distanceRemaining, false, this._tempFeet);
                    if (!legRestriction) {
                        this._legRestrictions[i] = new WT_FlightPlanVNAVLegAdvisoryRestriction(leg, altitude);
                    } else {
                        legRestriction.setAltitude(altitude);
                    }
                }
            }
        }
    }

    _computeDescentAdvisoryRestrictions() {
        if (!this._lastDescentLegRestriction) {
            return;
        }

        // create advisory restrictions in between valid designated restrictions for every leg without a designated
        // restriction (valid or not), with altitude values based on the computed vertical paths to meet the valid
        // designated restrictions.

        let index = this._lastDescentLegRestriction.leg.index;
        while (index >= this._firstDescentLegRestriction.leg.index) {
            let beginIndex = this._findPreviousDesignatedDescentLegRestrictionIndex(index);
            this._computeAdvisoryRestrictions(this._legRestrictions[index], beginIndex);
            index = beginIndex;
        }
    }

    /**
     * Computes advisory VNAV restrictions based on existing designated restrictions and places these in the VNAV
     * restriction sequence.
     */
    computeAdvisoryRestrictions() {
        this._computeDescentAdvisoryRestrictions();
        this._notifyListeners();
    }

    /**
     * Activates a VNAV Direct-To to a flight plan leg with a designated VNAV restriction. Activating the VNAV Direct-
     * To will remove all designated restrictions prior to the targeted leg and will set the flight path angle of the
     * leg's VNAV path such that the TOD falls at the specified distance along the flight plan path from the leg's
     * terminator fix. An initial altitude must be specified for the Direct-To, which must be greater than the leg's
     * VNAV altitude restriction. If the required flight path angle to meet the leg's altitude restriction is steeper
     * than the maximum allowable value, the VNAV Direct-To will not be activated.
     * @param {WT_FlightPlanVNAVLegRestriction} legRestriction - the designated VNAV restriction of the leg to which to
     *        activate the VNAV Direct-To.
     * @param {WT_NumberUnitObject} initialAltitude - the initial altitude of the VNAV Direct-To.
     * @param {WT_NumberUnitObject} distanceToLegFix - the distance along the flight plan path from the leg's
     *        terminator fix at which to place the TOD.
     * @returns {Boolean} whether the VNAV Direct-To was successfully activated.
     */
    activateVNAVDirectTo(legRestriction, initialAltitude, distanceToLegFix) {
        if (!legRestriction || this.legRestrictions.get(legRestriction.leg.index) !== legRestriction || !legRestriction.isDesignated || !legRestriction.isValid || initialAltitude.compare(legRestriction.altitude) <= 0) {
            return false;
        }

        let flightPathAngle = legRestriction.vnavPath.getFlightPathAngleRequiredAt(distanceToLegFix, initialAltitude);
        if (flightPathAngle < this.minDescentFlightPathAngle) {
            return false;
        }

        // remove all custom flight plan altitude constraints prior to the direct to
        this._ignoreFlightPlanEvents = true;
        for (let i = 0; i < legRestriction.leg.index; i++) {
            this._flightPlan.legs.get(i).altitudeConstraint.removeCustomAltitude();
        }
        this._ignoreFlightPlanEvents = false;

        // remove all leg restrictions prior to the direct to
        for (let i = legRestriction.leg.index - 1; i >= 0; i--) {
            this._legRestrictions[i] = null;
        }

        legRestriction.activateVNAVDirectTo(initialAltitude, flightPathAngle);

        this._firstDescentLegRestriction = legRestriction;

        this.computeAdvisoryRestrictions();
        return true;
    }

    /**
     *
     * @param {WT_FlightPlanEvent} event
     */
    _onFlightPlanEvent(event) {
        if (this._ignoreFlightPlanEvents) {
            return;
        }

        this.build();
    }

    _onLegRestrictionChanged(source, eventType) {
        this._computeAdvisoryRestrictions(source);
        this._notifyListeners();
    }

    _notifyListeners() {
        this._listeners.forEach(listener => listener(this));
    }

    /**
     * Adds a listener to this flight plan VNAV component. The listener is called every time a restriction is added or
     * removed, or a designated restriction's VNAV path is changed.
     * @param {WT_FlightPlanVNAVListener} listener - the listener to add.
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     * Removes a previously added listener from this flight plan VNAV component.
     * @param {WT_FlightPlanVNAVListener} listener - the listener to remove.
     */
    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }
}
WT_FlightPlanVNAV.OPTION_DEFS = {
    defaultDescentFlightPathAngle: {default: -3, auto: true},
    maxDescentFlightPathAngle: {default: -1.5, auto: true},
    minDescentFlightPathAngle: {default: -6, auto: true}
};

/**
 * @typedef {(source:WT_FlightPlanVNAV) => void} WT_FlightPlanVNAVListener
 */

/**
 * A VNAV restriction for a flight plan leg.
 */
class WT_FlightPlanVNAVLegRestriction {
    /**
     * @param {WT_FlightPlanLeg} leg - the flight plan leg associated with the new restriction.
     * @param {WT_NumberUnitObject} altitude - the new restriction's altitude.
     * @param {Boolean} isDesignated - whether the restriction is designated for VNAV guidance.
     */
    constructor(leg, altitude, isDesignated) {
        this._leg = leg;
        this._altitude = WT_Unit.FOOT.createNumber(altitude.asUnit(WT_Unit.FOOT));
        this._isDesignated = isDesignated;

        /**
         * @type {WT_FlightPlanVNAVLegRestrictionListener[]}
         */
        this._listeners = [];
    }

    /**
     * The flight plan leg associated with this restriction.
     * @readonly
     * @type {WT_FlightPlanLeg}
     */
    get leg() {
        return this._leg;
    }

    /**
     * This restriction's altitude.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get altitude() {
        return this._altitude.readonly();
    }

    /**
     * Whether this restriction is designated for VNAV guidance.
     * @readonly
     * @type {Boolean}
     */
    get isDesignated() {
        return this._isDesignated;
    }

    /**
     * Sets this restriction's altitude.
     * @param {WT_NumberUnitObject} altitude - the new altitude.
     */
    setAltitude(altitude) {
        if (this._altitude.equals(altitude)) {
            return;
        }

        this._altitude.set(altitude);

        this._notifyListeners(WT_FlightPlanVNAVLegRestriction.EventType.ALTITUDE_CHANGED);
    }

    _notifyListeners(eventType) {
        this._listeners.forEach(listener => listener(this, eventType));
    }

    /**
     *
     * @param {WT_FlightPlanVNAVLegRestrictionListener} listener
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     *
     * @param {WT_FlightPlanVNAVLegRestrictionListener} listener
     */
    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }
}
/**
 * @enum {Number}
 */
WT_FlightPlanVNAVLegRestriction.EventType = {
    ALTITUDE_CHANGED: 0,
    PATH_CHANGED: 1
};

/**
 * @typedef {(source:WT_FlightPlanVNAVLegRestriction, eventType:WT_FlightPlanVNAVLegRestriction.EventType) => void} WT_FlightPlanVNAVLegRestrictionListener
 */

/**
 * An advisory flight plan leg VNAV restriction.
 */
class WT_FlightPlanVNAVLegAdvisoryRestriction extends WT_FlightPlanVNAVLegRestriction {
    /**
     * @param {WT_FlightPlanLeg} leg - the flight plan leg associated with the new restriction.
     * @param {WT_NumberUnitObject} altitude - the new restriction's altitude.
     */
    constructor(leg, altitude) {
        super(leg, altitude, false);
    }
}

/**
 * A designated flight plan leg VNAV restriction.
 */
class WT_FlightPlanVNAVLegDesignatedRestriction extends WT_FlightPlanVNAVLegRestriction {
    /**
     * @param {WT_FlightPlanLeg} leg - the flight plan leg associated with the new restriction.
     * @param {WT_NumberUnitObject} altitude - the new restriction's altitude.
     * @param {Boolean} isValid - whether the new restriction is valid.
     */
    constructor(leg, altitude, isValid) {
        super(leg, altitude, true);

        this._isValid = isValid;
        this._vnavPath = new WT_VNAVPath(altitude);
        this._isVNAVDirectToActive = false;
    }

    /**
     * Whether this restriction is valid. VNAV guidance is only provided for valid restrictions.
     * @readonly
     * @type {Boolean}
     */
    get isValid() {
        return this._isValid;
    }

    /**
     * The VNAV path associated with this restriction.
     * @readonly
     * @type {WT_VNAVPathReadOnly}
     */
    get vnavPath() {
        return this._vnavPath.readonly();
    }

    /**
     * Whether a VNAV Direct-To was activated for this restriction.
     * @readonly
     * @type {Boolean}
     */
    get isVNAVDirectToActive() {
        return this._isVNAVDirectToActive;
    }

    /**
     * Sets this restriction's altitude.
     * @param {WT_NumberUnitObject} altitude - the new altitude.
     */
    setAltitude(altitude) {
        super.setAltitude(altitude);

        this.vnavPath.setFinalAltitude(altitude);
    }

    /**
     * Sets the initial altitude of this restriction's VNAV path.
     * @param {WT_NumberUnitObject} altitude
     */
    setInitialAltitude(altitude) {
        this._vnavPath.setInitialAltitude(altitude);
    }

    /**
     * Sets the flight path angle of this restriction's VNAV path.
     * @param {Number} angle - the new flight path angle, in degrees.
     */
    setFlightPathAngle(angle) {
        this._vnavPath.setFlightPathAngle(angle);
    }

    /**
     * Sets the flight path angle of this restriction's VNAV path by specifying a vertical speed target and ground
     * speed.
     * @param {WT_NumberUnitObject} target - the vertical speed target to use to calculate the new flight path angle.
     * @param {WT_NumberUnitObject} groundSpeed - the ground speed to use to calculate the new flight path angle.
     */
    setVerticalSpeedTarget(target, groundSpeed) {
        this._vnavPath.setVerticalSpeedTarget(target, groundSpeed);
    }

    /**
     * Computes and updates this restriction's VNAV path's total horizontal distance over ground.
     */
    computeVNAVPath() {
        let oldDistance = this.vnavPath.getTotalDistance().asUnit(WT_Unit.NMILE);
        this._vnavPath.compute();
        if (oldDistance !== this.vnavPath.getTotalDistance()) {
            this._notifyListeners(WT_FlightPlanVNAVLegRestriction.EventType.PATH_CHANGED);
        }
    }

    /**
     * Activates a VNAV Direct-To targeting this restriction with a specified initial altitude and flight path angle.
     * @param {WT_NumberunitObject} initialAltitude - the initial altitude of the VNAV Direct-To.
     * @param {Number} flightPathAngle - the flight path angle of the VNAV Direct-To.
     */
    activateVNAVDirectTo(initialAltitude, flightPathAngle) {
        this.setInitialAltitude(initialAltitude);
        this.setFlightPathAngle(flightPathAngle);
        this.computeVNAVPath();
        this._isVNAVDirectToActive = true;
    }
}