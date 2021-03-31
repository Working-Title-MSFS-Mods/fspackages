class WT_G3000_TrafficAdvisorySystem extends WT_G3x5_TrafficSystem {
    constructor(airplane, trafficTracker) {
        super(airplane, trafficTracker);

        this._sensitivity = new WT_G3000_TrafficAdvisorySystemSensitivity(airplane);
    }

    /**
     * @readonly
     * @type {WT_G3000_TrafficAdvisorySystemSensitivity.Level}
     */
    get sensitivity() {
        return this._sensitivity.level;
    }

    _updateSensitivity() {
        this._sensitivity.update();
    }

    _updateProtectedZone() {
        if (!this._isProtectedZoneInit) {
            this._protectedRadius.set(WT_G3000_TrafficAdvisorySystem.PROTECTED_RADIUS);
            this._protectedHeight.set(WT_G3000_TrafficAdvisorySystem.PROTECTED_HEIGHT);
            this._isProtectedZoneInit = true;
        }
    }

    _doUpdate(currentTime) {
        this._updateSensitivity();

        super._doUpdate(currentTime);
    }
}
WT_G3000_TrafficAdvisorySystem.PROTECTED_RADIUS = WT_Unit.NMILE.createNumber(1);
WT_G3000_TrafficAdvisorySystem.PROTECTED_HEIGHT = WT_Unit.FOOT.createNumber(2000);

class WT_G3000_TrafficAdvisorySystemSensitivity {
    /**
     * @param {WT_PlayerAirplane} airplane
     */
    constructor(airplane) {
        this._airplane = airplane;
        this._level = WT_G3000_TrafficAdvisorySystemSensitivity.Level.B;

        this._tempFeet = WT_Unit.FOOT.createNumber(0);
    }

    /**
     * @readonly
     * @type {WT_G3000_TrafficAdvisorySystemSensitivity.Level}
     */
    get level() {
        return this._level;
    }

    update() {
        if (this._airplane.controls.isGearHandleDown() || this._airplane.sensors.radarAltitude(this._tempFeet).compare(WT_G3000_TrafficAdvisorySystemSensitivity.LEVEL_A_RA_THRESHOLD) < 0) {
            this._level = WT_G3000_TrafficAdvisorySystemSensitivity.Level.A;
        } else {
            this._level = WT_G3000_TrafficAdvisorySystemSensitivity.Level.B;
        }
    }
}
WT_G3000_TrafficAdvisorySystemSensitivity.LEVEL_A_RA_THRESHOLD = WT_Unit.FOOT.createNumber(2000);
/**
 * @enum {Number}
 */
WT_G3000_TrafficAdvisorySystemSensitivity.Level = {
    A: 0,
    B: 1
};