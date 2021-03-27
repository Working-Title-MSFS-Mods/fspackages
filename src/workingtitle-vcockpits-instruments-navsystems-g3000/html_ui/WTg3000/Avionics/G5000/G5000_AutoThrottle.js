class WT_G5000_AutoThrottle {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_AirplaneAltimeter} altimeter
     * @param {Number} [referenceEngineIndex]
     */
    constructor(airplane, altimeter, referenceEngineIndex = 1) {
        this._airplane = airplane;
        this._altimeter = altimeter;
        this._refEngine = airplane.engineering.getEngine(referenceEngineIndex);

        this._selectedAltitude = WT_Unit.FOOT.createNumber(0);
        this._indicatedAltitude = WT_Unit.FOOT.createNumber(0);

        this._cruLimitArmed = false;
        this._cruLimitArmedTime = 0;

        this._mode = WT_G5000_AutoThrottle.Mode.OFF;
        this._lastMode = WT_G5000_AutoThrottle.Mode.OFF;
        this._thrustLimitMode = WT_G5000_AutoThrottle.ThrustLimitMode.OFF;
        this._thrustLimit = airplane.autopilot.autoThrottleThrustLimit();

        this._isAtMaxThrust = false;
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

    _calculateN1Limit(thrustLimitMode) {
        // TODO: find some real references
        switch (thrustLimitMode) {
            case WT_G5000_AutoThrottle.ThrustLimitMode.CLB:
                return 0.9;
            case WT_G5000_AutoThrottle.ThrustLimitMode.CRU:
                return 0.75;
            case WT_G5000_AutoThrottle.ThrustLimitMode.GA:
                return 1;
            default:
                return 1;
        }
    }

    _setThrustLimit(limit) {
        if (limit === this._thrustLimit) {
            return;
        }

        this._airplane.autopilot.setAutoThrottleThrustLimit(limit);
        this._thrustLimit = limit;
    }

    _updateThrustLimit() {
        let isAtMaxThrust = false;
        let limit = this._thrustLimit;
        let n1Limit = this._calculateN1Limit(this.thrustLimitMode);
        if (n1Limit < 1) {
            let commandedN1 = this._refEngine.commandedN1();
            let diff = commandedN1 - n1Limit;
            let throttle = this._airplane.controls.throttlePosition(this._refEngine.index);
            if (diff > WT_G5000_AutoThrottle.N1_LIMIT_TOLERANCE) {
                let adjustment = Math.max(WT_G5000_AutoThrottle.THRUST_LIMIT_ADJUST_MIN, diff * WT_G5000_AutoThrottle.THRUST_LIMIT_ADJUST_FACTOR);
                limit = throttle - adjustment;
                isAtMaxThrust = true;
            } else if (diff < -WT_G5000_AutoThrottle.N1_LIMIT_TOLERANCE) {
                if (throttle > this._thrustLimit - WT_G5000_AutoThrottle.THRUST_LIMIT_TOLERANCE) {
                    let adjustment = Math.max(WT_G5000_AutoThrottle.THRUST_LIMIT_ADJUST_MIN, -diff * WT_G5000_AutoThrottle.THRUST_LIMIT_ADJUST_FACTOR);
                    limit = throttle + adjustment;
                }
            } else {
                isAtMaxThrust = throttle > this._thrustLimit - WT_G5000_AutoThrottle.THRUST_LIMIT_TOLERANCE;
            }
        } else {
            limit = 1;
        }
        this._setThrustLimit(limit);
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
WT_G5000_AutoThrottle.THRUST_LIMIT_TOLERANCE = 0.001;
WT_G5000_AutoThrottle.THRUST_LIMIT_ADJUST_FACTOR = 0.5;
WT_G5000_AutoThrottle.THRUST_LIMIT_ADJUST_MIN = 0.001;
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