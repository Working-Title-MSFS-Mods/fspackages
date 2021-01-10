class WT_VerticalAutopilot {
    constructor(vnav, modeSelector) {

        /**
        * The instance of the base vnav class
        * @type {WT_BaseVnav}
        */
        this._vnav = vnav;

        /**
        * The nav mode selector
        * @type {CJ4NavModeSelector}
        */
        this._navModeSelector = modeSelector;

        /**
        * Current Path Status
        * @type {VnavPathStatus}
        */
        this._vnavPathStatus = VnavPathStatus.NONE;

        /**
        * Current Path Intercept Status
        * @type {PathInterceptStatus}
        */
        this._pathInterceptStatus = PathInterceptStatus.NONE;

        /**
        * Tracked Vnav State
        * @type {VnavState}
        */
        this._vnavState = undefined;

        /**
        * Tracked Glidepath State
        * @type {GlidepathStatus}
        */
        this._glidepathStatus = GlidepathStatus.NONE;

        /**
        * Update Time for intercept logic
        * @type {number}
        */
        this._lastUpdateTime = undefined;

        /**
        * The altitude at which the aircraft should level
        * (This value is a proxy for alt slot 2 and is monitored by this class and
        * inserted to alt slot 2 only when a level-off is commanded by VNAV)
        * @type {number}
        */
        this._targetAltitude = undefined;

    }

    get vnavState() {
        return this._vnav._vnavState;
    }

    get glidePath() {
        return this._vnav._approachGlidePath;
    }

    get distanceToTod() {
        return SimVar.GetSimVarValue("L:WT_CJ4_TOD_REMAINING", "number")
    }

    get groundSpeed() {
        return Math.round(Simplane.getGroundSpeed());
    }

    get verticalSpeed() {
        return Math.round(Simplane.getVerticalSpeed());
    }

    get altSet1() {
        return this._navModeSelector.altSet1;
    }

    get altSet2() {
        return this._navModeSelector.altSet2;
    }

    set altSet2(value) {
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, Math.floor(value), true);
    }

    get path() {
        return this._vnav.trackPath();
    }

    get glidepath() {
        return this._vnav.trackApproachGlidepath();
    }

    get verticalMode() {
        return this._navModeSelector.currentVerticalActiveState;
    }

    get lateralMode() {
        return this._navModeSelector.currentLateralActiveState;
    }

    get isVNAVOn() {
        return this._navModeSelector.isVNAVOn;
    }
    set isVNAVOn(value) {
        this._navModeSelector.isVNAVOn = value;
    }

    get constraintAltitude() {
        return this._vnav._activeConstraintAltitude;
    }

    get altSlot() {
        return this._navModeSelector.currentAltSlotIndex;
    }

    set altSlot(value) {
        switch(value) {
            case AltitudeSlot.SELECTED:
                this._navModeSelector.handleVnavRequestSlot1();
                break;
            case AltitudeSlot.MANAGED:
                this._navModeSelector.handleVnavRequestSlot2();
                break;
            case AltitudeSlot.LOCK:
                this._navModeSelector.handleVnavRequestSlot3();
                break;
        }
    }

    get vsSlot() {
        return SimVar.GetSimVarValue("AUTOPILOT VS SLOT INDEX", "number");
    }

    set vsSlot(value) {
        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", value);
    }

    get vsSlot2Value() {
        SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:2", "feet per minute");
    }

    set vsSlot2Value(value) {
        Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, value);
    }

    get targetAltitude() {
        return this._targetAltitude;
    }

    set targetAltitude(value) {
        this._targetAltitude = targetAltitude;
    }

    get indicatedAltitude() {
        return this._vnav.indicatedAltitude;
    }

    get snowflake() {
        let snowflake = SimVar.GetSimVarValue('L:WT_CJ4_SNOWFLAKE', 'number') == 1;
        return snowflake
    }

    set snowflake(value) {
        let setValue = value === true ? 1 : 0;
        SimVar.SetSimVarValue('L:WT_CJ4_SNOWFLAKE', 'number', setValue);
    }

    get donut() {
        return SimVar.GetSimVarValue("L:WT_CJ4_DONUT", "number");
    }

    set donut(value) {
        let donutValue = Math.round(value);
        SimVar.SetSimVarValue("L:WT_CJ4_DONUT", "number", donutValue);
    }

    get currentSegment() {
        const currentIndex = this._vnav.flightplan.activeWaypointIndex;
        const currentSegmentIndex = this._vnav._verticalFlightPlan[currentIndex].segment;
        return this._vnav._verticalFlightPlanSegments[currentSegmentIndex];
    }

    /**
     * Run on first activation.
     */
    activate() {
        this.update();
    }

    /**
     * Update data if needed.
     */
    update() {
        this._vnavState = this.checkVnavState(); 
        this._glidepathStatus = this.checkGlidepathStatus();

        switch(this._vnavPathStatus) {
            case VnavPathStatus.NONE:
                break;
            case VnavPathStatus.PATH_EXISTS:
                if (this.canPathArm()) {
                    this._vnavPathStatus = VnavPathStatus.PATH_ARMED;
                } else {this.checkPreselector;}
                break;
            case VnavPathStatus.PATH_ARMED:
                if (!this.isVNAVOn) {
                    this._vnavPathStatus = VnavPathStatus.NONE;
                    break;
                }
                if (this.canPathActivate()) {
                    this._vnavPathStatus = VnavPathStatus.PATH_ACTIVE;
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    if (this._glidepathStatus === GlidepathStatus.GP_ACTIVE) {
                        this._glidepathStatus = GlidepathStatus.NONE;
                    }
                }
                break;
            case VnavPathStatus.PATH_ACTIVE:
                if (!this.isVNAVOn) {
                    this._vnavPathStatus = VnavPathStatus.NONE;
                    break;
                }
                this.followPath()
                break;
        }

        switch(this._glidepathStatus) {
            case GlidepathStatus.NONE:
                break;
            case GlidepathStatus.GP_CAN_ARM:
                if (this._navModeSelector.currentLateralActiveState === LateralNavModeState.APPR) {
                    this._glidepathStatus = GlidepathStatus.GP_ARMED;
                }
                break;
            case GlidepathStatus.GP_ARMED:
                if (this._navModeSelector.currentLateralActiveState !== LateralNavModeState.APPR) {
                    this.cancelGlidepath();
                    break;
                }
                if (this.canGlidepathActivate()) {
                    this._glidepathStatus = GlidepathStatus.GP_ACTIVE;
                    this._vnavPathStatus = VnavPathStatus.NONE;
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    this.isVNAVOn = false;
                }
                break;
            case GlidepathStatus.GP_ACTIVE:
                if (this._navModeSelector.currentLateralActiveState !== LateralNavModeState.APPR) {
                    this.cancelGlidepath();
                    break;
                }
                this.followGlidepath()
                break;
        }

        switch(this.isVNAVOn) {
            case false:
                if (this.altSlot === AltitudeSlot.MANAGED) {
                    this.altSlot = AltitudeSlot.SELECTED;
                }
                this.setDonut(0);
                break;
            case true:
                if (this._vnavPathStatus !== VnavPathStatus.PATH_ACTIVE) {
                    this.setConstraintAltitude();
                }
        }

        this.setSnowflake();
        this.monitorValues();
    }

    canPathArm() {
        switch(this.isVNAVOn) {
            case false:
                break;
            case true:
                const distance = this._vnav.getDistanceToTarget();
                const altitudeDifference = this.indicatedAltitude - this._vnav.getTargetAltitude();
                const requiredFpa = AutopilotMath.calculateFPA(altitudeDifference, distance);
                const reqVs = AutopilotMath.calculateVerticaSpeed(requiredFpa, this.groundSpeed);
                if (this.path.deviation <= 1000 && altitudeDifference > 100
                    && this.verticalSpeed > reqVs && this.altSet1 < this.indicatedAltitude + 100) {
                    return true;
                } else if (this.path.deviation > 1000 && this.verticalSpeed < reqVs && this.altSet1 < this.indicatedAltitude + 100) {
                    return true;
                }
        }
        return false;
    }

    canPathActivate() {
        if (this.path.deviation < 1000 && this.path.deviation > -300) {
            return true;
        }
        return false;
    }

    canGlidepathActivate() {
        if (this.glidepath.deviation < 100 && this.glidepath.deviation > -300) {
            return true;
        }
        return false;
    }

    cancelGlidepath() {
        this._glidepathStatus = GlidepathStatus.NONE;
        this.snowflake = false;
    }

    checkVnavState() {
        switch(this.vnavState) {
            case this._vnavState:
                break;
            case VnavState.PATH:
            case VnavState.DIRECT:
                if (this._vnavPathStatus === VnavPathStatus.NONE) {
                    this._vnavPathStatus = VnavPathStatus.PATH_EXISTS;
                }
                this._vnavState = this.vnavState;
                break;
            case VnavState.NONE:
                this._vnavPathStatus = VnavPathStatus.NONE;
                this._vnavState = this.vnavState;
        }
        return this._vnavState;
    }

    checkGlidepathStatus() {
        const gp = this.glidepath != undefined && this.glidepath > 0;
        switch(this._glidepathStatus) {
            case GlidepathStatus.NONE:
                if (gp) {
                    return GlidepathStatus.GP_CAN_ARM;
                }
                break;
            case GlidepathStatus.GP_CAN_ARM:
            case GlidepathStatus.GP_ARMED:
            case GlidepathStatus.GP_ACTIVE:
                if (!gp) {
                    return GlidepathStatus.NONE;
                }
        }
        return this._glidepathStatus;
    }

    manageAltitude() {
        switch(this._pathInterceptStatus) {
            case PathInterceptStatus.NONE:
            case PathInterceptStatus.INTERCEPTING:
                this.setManagedAltitude();
            case PathInterceptStatus.INTERCEPTED:
            case PathInterceptStatus.CONTINUOUS:
                if (this._glidepathStatus === GlidepathStatus.GP_ACTIVE) {
                    if (this.altSlot !== AltitudeSlot.MANAGED) {
                        this.altSlot = AltitudeSlot.MANAGED;
                    }
                } else if (this._vnavPathStatus === VnavPathStatus.PATH_ACTIVE) {
                    if (this.altSlot !== AltitudeSlot.SELECTED) {
                        this.altSlot = AltitudeSlot.SELECTED;
                    }
                    if (this.currentSegment.distanceToNextTod < 1) {
                        this._pathInterceptStatus = PathInterceptStatus.CONTINUOUS;
                    }
                    else if (this.indicatedAltitude < this.targetAltitude + 500) {
                        this.altSet2 = this.targetAltitude;
                        this.altSlot = AltitudeSlot.MANAGED;
                        this._pathInterceptStatus = PathInterceptStatus.LEVELING;
                    } 
                }
                break;
            case PathInterceptStatus.LEVELING:
                if (this._navModeSelector.currentVerticalActiveState === VerticalNavModeState.ALT) {
                    this.vsSlot2Value = 0;
                    this.vsSlot = 1;
                    this.setManagedAltitude();
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    this._vnavPathStatus = VnavPathStatus.NONE;
                    this.setDonut(0);
                }
                break;

        }
    }

    interceptPath(fpa) {
        switch(this._pathInterceptStatus) {
            case PathInterceptStatus.NONE:
                const desiredVerticalSpeed = AutopilotMath.calculateVerticaSpeed(fpa, this.groundSpeed);
                this.setDonut(desiredVerticalSpeed);
                const deltaVS = desiredVerticalSpeed - this.verticalSpeed;
                const intercept = {
                    verticalSpeed: 100 * Math.floor(this.verticalSpeed / 100),
                    increments: Math.floor(deltaVS / 100)
                }
                this._pathInterceptValues = intercept;
                this._pathInterceptStatus = PathInterceptStatus.INTERCEPTING;
                this.vsSlot2Value = this.verticalSpeed;
                this.vsSlot = 2;
                break;
            case PathInterceptStatus.INTERCEPTING:
                let now = performance.now();
                let dt = this._lastUpdateTime != undefined ? now - this._lastUpdateTime : 101;
                this._lastUpdateTime = now;
                if (dt > 100) {
                    if (this._pathInterceptValues.increments > 0) {
                        this._pathInterceptValues.verticalSpeed += 100;
                        this._pathInterceptValues.increments -= 1;
                    } else {
                        this._pathInterceptValues.verticalSpeed -= 100;
                        this._pathInterceptValues.increments += 1;
                    }
                    this.vsSlot2Value = this._pathInterceptValues.verticalSpeed;
                }
                if (this._pathInterceptValues.increments == 0) {
                    this._pathInterceptStatus = PathInterceptStatus.INTERCEPTED;
                    this._pathInterceptValues = undefined;
                }
                break;
        }
    }

    followPath() {
        switch(this._pathInterceptStatus) {
            case PathInterceptStatus.NONE:
                this.targetAltitude = this.path.fpta;
                this.manageAltitude();
            case PathInterceptStatus.INTERCEPTING:
                this.interceptPath(this.path.fpa);
                break;
            case PathInterceptStatus.INTERCEPTED:
            case PathInterceptStatus.CONTINUOUS:
                this.manageAltitude();
                this.commandVerticalSpeed(this.path.fpa, this.path.deviation);
                break;
            case PathInterceptStatus.LEVELING:
                this.manageAltitude();
                break;
        }
    }

    followGlidepath() {
        switch(this._pathInterceptStatus) {
            case PathInterceptStatus.NONE:
                this.targetAltitude = this.glidepath.fpta;
                this.manageAltitude();
            case PathInterceptStatus.INTERCEPTING:
                this.interceptPath(this.glidepath.fpa);
                break;
            case PathInterceptStatus.INTERCEPTED:
                this.manageAltitude();
                this.commandVerticalSpeed(this.glidepath.fpa, this.glidepath.deviation);
        }
    }

    commandVerticalSpeed(fpa, deviation) {
        let setVerticalSpeed = 0;
        const desiredVerticalSpeed = AutopilotMath.calculateVerticaSpeed(fpa, this.groundSpeed);
        const maxVerticalSpeed = -1 * AutopilotMath.calculateVerticaSpeed(6, this.groundSpeed);
        const maxCorrection = maxVerticalSpeed + desiredVerticalSpeed;
        
        if (deviation > 10) {
            const correction = Math.min(Math.max((2.1 * deviation), 100), maxCorrection);
            setVerticalSpeed = desiredVerticalSpeed - correction;
        }
        else if (deviation < -10) {
            const correction = Math.min(Math.max((-2.1 * deviation), 100), (-1 * desiredVerticalSpeed));
            setVerticalSpeed = desiredVerticalSpeed + correction;
        }
        else {
            setVerticalSpeed = desiredVerticalSpeed;
        }
        setVerticalSpeed = 100 * Math.ceil(setVerticalSpeed / 100);
        this.vsSlot2Value = setVerticalSpeed;
    }

    setConstraintAltitude() {
        this.targetAltitude = this.constraintAltitude;
        this.setManagedAltitude(this.targetAltitude);
        if (this.altSlot === AltitudeSlot.SELECTED) {
            this.altSlot = AltitudeSlot.MANAGED;
        }
    }

    setManagedAltitude(altitude = -1000) {
        if (Math.round(this.altSet2) != altitude) {
            this.altSet2 = altitude;
        }
        //SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 1);
    }

    setSnowflake(value = undefined) {
        if (value !== undefined && (value === true || value === false)) {
            this.snowflake = value;
            return;
        }
        const isGlidepathActive = this._glidepathStatus === GlidepathStatus.GP_ARMED || this._glidepathStatus === GlidepathStatus.GP_ACTIVE ? true : false;
        const isPathActive = this._vnavPathStatus === VnavPathStatus.PATH_ARMED || this._vnavPathStatus === VnavPathStatus.PATH_ACTIVE ? true : false;
        let newSnowflakeStatus = false;
        if (isGlidepathActive || isPathActive) {
            newSnowflakeStatus = true;
        }
        if (this.snowflake !== newSnowflakeStatus) {
            this.snowflake = newSnowflakeStatus;
        }
    }

    setDonut(donutValue = 0, calculate = false) {
        if (calculate) {
            const index = this._vnav._activeConstraintIndex;
            const lDistance = this._vnav.waypoints[index].cumulativeDistanceInFP - this._vnav._currentDistanceInFP;
            const vDistance = this.indicatedAltitude - this.targetAltitude;
            const fpa = AutopilotMath.calculateFPA(vDistance, lDistance);
            this.donut = Math.round(AutopilotMath.calculateVerticaSpeed(fpa, this.groundSpeed));
        } else if (Math.round(this.donut) != donutValue) {
            this.donut = donutValue;
        }
    }

    checkPreselector() {
        const approachingTodDistance = 0.0125 * this.groundSpeed;
        if (this.distanceToTod < approachingTodDistance && this.distanceToTod > 0) {
            this._vnav.setCheckPreselector();
        }
    }

    
/////////////////////////////////////////////////////

    cancelConstraint() {
        //method to reset after adhereing to a constraint when no more constraints exist
        this._vnavAltSlot = 1;
        this._navModeSelector.queueEvent(NavModeEvent.VNAV_REQUEST_SLOT_1);
        this._obeyingConstraint = false;
    }

    vnavAltSlotRequest() {
        const altSlot = this._navModeSelector.currentAltSlotIndex;
        if (this._vnavAltSlot == 1 && altSlot == 2) {
            this._navModeSelector.queueEvent(NavModeEvent.VNAV_REQUEST_SLOT_1);
        }
        else if (this._vnavAltSlot == 2 && altSlot == 1) {
            this._navModeSelector.queueEvent(NavModeEvent.VNAV_REQUEST_SLOT_2);
        }
    }

    recalculate() {
        this._pathArm = false;
        this._pathArmAbove = false;
        this._pathActive = false;
        this._pathActivate = false;
        this.vnavAltSlotRequest();
        return;
    }

    monitorValues() {

    }
}

class VnavPathStatus { }
VnavPathStatus.NONE = 'NONE';
VnavPathStatus.PATH_EXISTS = 'PATH_EXISTS';
VnavPathStatus.PATH_CAN_ARM = 'PATH_CAN_ARM';
VnavPathStatus.PATH_ARMED = 'PATH_ARMED';
VnavPathStatus.PATH_ACTIVE = 'PATH_ACTIVE';

class PathInterceptStatus { }
PathInterceptStatus.NONE = 'NONE';
PathInterceptStatus.INTERCEPTING = 'INTERCEPTING';
PathInterceptStatus.INTERCEPTED = 'INTERCEPTED';
PathInterceptStatus.LEVELING = 'LEVELING';
PathInterceptStatus.CONTINUOUS = 'CONTINUOUS';

class GlidepathStatus { }
GlidepathStatus.NONE = 'NONE';
GlidepathStatus.GP_CAN_ARM = 'GP_CAN_ARM';
GlidepathStatus.GP_ARMED = 'GP_ARMED';
GlidepathStatus.GP_ACTIVE = 'GP_ACTIVE';

class AltitudeSlot { }
AltitudeSlot.SELECTED = 1;
AltitudeSlot.MANAGED = 2;
AltitudeSlot.LOCK = 3;