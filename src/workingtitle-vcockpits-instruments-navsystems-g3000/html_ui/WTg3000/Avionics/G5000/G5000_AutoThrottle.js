class WT_G5000_AutoThrottle {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_AirplaneAltimeter} altimeter
     * @param {WT_InterpolatedLookupTable} clbN1Table
     * @param {WT_InterpolatedLookupTable} cruN1Table
     * @param {Number} [referenceEngineIndex]
     */
    constructor(airplane, altimeter, clbN1Table, cruN1Table, referenceEngineIndex = 1) {
        this._airplane = airplane;
        this._altimeter = altimeter;
        this._clbN1Table = clbN1Table;
        this._cruN1Table = cruN1Table;
        this._refEngine = airplane.engineering.getEngine(referenceEngineIndex);

        this._selectedAltitude = WT_Unit.FOOT.createNumber(0);
        this._indicatedAltitude = WT_Unit.FOOT.createNumber(0);

        this._cruLimitArmed = false;
        this._cruLimitArmedTime = 0;

        this._mode = WT_G5000_AutoThrottle.Mode.OFF;
        this._lastMode = WT_G5000_AutoThrottle.Mode.OFF;
        this._thrustLimitMode = WT_G5000_AutoThrottle.ThrustLimitMode.OFF;
        this._throttleLimit = airplane.autopilot.autoThrottleThrottleLimit();

        this._isAtMaxThrust = false;

        this._n1LookupKey = [0, 0];
        this._pressureAltitude = WT_Unit.FOOT.createNumber(0);
        this._isaDeltaTemp = WT_Unit.CELSIUS.createNumber(0);
    }

    /**
     * @readonly
     * @type {WT_G5000_AutoThrottle.Mode}
     */
    get mode() {
        return this._mode;
    }

    /**
     * @readonly
     * @type {WT_G5000_AutoThrottle.ThrustLimitMode}
     */
    get thrustLimitMode() {
        return this._thrustLimitMode;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isAtMaxThrust() {
        return this._isAtMaxThrust;
    }

    _updateMode() {
        this._lastMode = this.mode;
        let isActive = this._airplane.autopilot.isAutoThrottleActive();
        if (isActive) {
            if (this._airplane.autopilot.isFLCActive()) {
                let selectedAlt = this._airplane.autopilot.selectedAltitude(this._selectedAltitude);
                let indicatedAlt = this._altimeter.altitudeIndicated(this._indicatedAltitude);
                if (indicatedAlt.compare(selectedAlt) < 0) {
                    this._mode = WT_G5000_AutoThrottle.Mode.CLIMB;
                } else {
                    this._mode = WT_G5000_AutoThrottle.Mode.DESC;
                }
            } else {
                this._mode = WT_G5000_AutoThrottle.Mode.SPD;
            }
        } else {
            this._mode = WT_G5000_AutoThrottle.Mode.OFF;
        }
    }

    _updateThrustLimitMode() {
        if (this.mode === WT_G5000_AutoThrottle.Mode.CLIMB) {
            this._thrustLimitMode = WT_G5000_AutoThrottle.ThrustLimitMode.CLB;
            this._cruLimitArmed = false;
        } else {
            if (this._lastMode === WT_G5000_AutoThrottle.Mode.CLIMB) {
                this._cruLimitArmed = true;
                this._cruLimitArmedTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
            } else if (this.thrustLimitMode !== WT_G5000_AutoThrottle.ThrustLimitMode.CRU && this._cruLimitArmed) {
                let armedElapsedTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds") - this._cruLimitArmedTime;
                if (armedElapsedTime >= WT_G5000_AutoThrottle.CRU_ARM_DELAY) {
                    this._thrustLimitMode = WT_G5000_AutoThrottle.ThrustLimitMode.CRU;
                    this._cruLimitArmed = false;
                }
            }
        }
    }

    _updateN1LookupKey() {
        this._n1LookupKey[0] = this._airplane.environment.pressureAltitude(this._pressureAltitude).number;
        this._n1LookupKey[1] = this._airplane.environment.isaTemperatureDelta(this._isaDeltaTemp).number;
    }

    _calculateN1Limit(thrustLimitMode) {
        switch (thrustLimitMode) {
            case WT_G5000_AutoThrottle.ThrustLimitMode.CLB:
                this._updateN1LookupKey();
                return this._clbN1Table.get(this._n1LookupKey);
            case WT_G5000_AutoThrottle.ThrustLimitMode.CRU:
                this._updateN1LookupKey();
                return this._cruN1Table.get(this._n1LookupKey);
            case WT_G5000_AutoThrottle.ThrustLimitMode.GA:
                return 1;
            default:
                return 1;
        }
    }

    _setThrottleLimit(limit) {
        if (limit === this._throttleLimit) {
            return;
        }

        this._airplane.autopilot.setAutoThrottleThrottleLimit(limit);
        this._throttleLimit = limit;
    }

    _updateThrustLimit() {
        let isAtMaxThrust = false;
        let throttleLimit = this._throttleLimit;
        let n1Limit = this._calculateN1Limit(this.thrustLimitMode);
        if (n1Limit < 1) {
            let commandedN1 = this._refEngine.commandedN1();
            let diff = commandedN1 - n1Limit;
            let throttle = this._airplane.controls.throttlePosition(this._refEngine.index);
            if (diff > WT_G5000_AutoThrottle.N1_LIMIT_TOLERANCE) {
                let adjustment = Math.max(WT_G5000_AutoThrottle.THROTTLE_LIMIT_ADJUST_MIN, diff * WT_G5000_AutoThrottle.THROTTLE_LIMIT_ADJUST_FACTOR);
                throttleLimit -= adjustment;
                isAtMaxThrust = true;
            } else if (diff < -WT_G5000_AutoThrottle.N1_LIMIT_TOLERANCE) {
                if (throttle > this._throttleLimit - WT_G5000_AutoThrottle.THROTTLE_LIMIT_TOLERANCE) {
                    let adjustment = Math.max(WT_G5000_AutoThrottle.THROTTLE_LIMIT_ADJUST_MIN, -diff * WT_G5000_AutoThrottle.THROTTLE_LIMIT_ADJUST_FACTOR);
                    throttleLimit += adjustment;
                }
            } else {
                isAtMaxThrust = throttle > this._throttleLimit - WT_G5000_AutoThrottle.THROTTLE_LIMIT_TOLERANCE;
            }
        } else {
            throttleLimit = 1;
        }
        this._setThrottleLimit(throttleLimit);
        this._isAtMaxThrust = isAtMaxThrust;
    }

    update() {
        this._updateMode();
        this._updateThrustLimitMode();
        this._updateThrustLimit();
    }
}
WT_G5000_AutoThrottle.CRU_ARM_DELAY = 600; // seconds
WT_G5000_AutoThrottle.N1_LIMIT_TOLERANCE = 0.005;
WT_G5000_AutoThrottle.THROTTLE_LIMIT_TOLERANCE = 0.01;
WT_G5000_AutoThrottle.THROTTLE_LIMIT_ADJUST_FACTOR = 0.5;
WT_G5000_AutoThrottle.THROTTLE_LIMIT_ADJUST_MIN = 0.001;
/**
 * @enum {Number}
 */
WT_G5000_AutoThrottle.Mode = {
    OFF: 0,
    SPD: 1,
    CLIMB: 2,
    DESC: 3
};
/**
 * @enum {Number}
 */
WT_G5000_AutoThrottle.ThrustLimitMode = {
    OFF: 1,
    CLB: 2,
    CRU: 3,
    GA: 4
};