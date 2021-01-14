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
        * Tracked Constraint State
        * @type {ConstraintStatus}
        */
        this._constraintStatus = ConstraintStatus.NONE;

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

        /**
        * The index of the waypoint we are continuing a descent through.
        * @type {number}
        */
        this._continuousIndex = undefined;

        /**
        * The index of the current constraint being observed, if any.
        * @type {number}
        */
        this._activeConstraintIndex = undefined;

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
        return Math.floor(this._navModeSelector.selectedAlt1);
    }

    get altSet2() {
        return Math.floor(this._navModeSelector.selectedAlt2);
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

    set verticalMode(value) {
        this._navModeSelector.currentVerticalActiveState = value;
    }

    get isVNAVOn() {
        return this._navModeSelector.isVNAVOn;
    }
    set isVNAVOn(value) {
        this._navModeSelector.isVNAVOn = value;
    }

    get constraint() {
        return this._vnav._activeConstraint;
    }

    get altSlot() {
        return this._navModeSelector.currentAltSlotIndex;
    }

    set altSlot(value) {
        switch(value) {
            case AltitudeSlot.SELECTED:
                this._navModeSelector.queueEvent(NavModeEvent.VNAV_REQUEST_SLOT_1);
                break;
            case AltitudeSlot.MANAGED:
                this._navModeSelector.queueEvent(NavModeEvent.VNAV_REQUEST_SLOT_2);
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
        this._targetAltitude = value;
        this._navModeSelector.managedAltitudeTarget = this._targetAltitude;
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

    get modeSelectorPathStatus() {
        return this._navModeSelector.vPathState;
    }

    set modeSelectorPathStatus(value) {
        this._navModeSelector.vPathState = value;
    }

    get modeSelectorGlidepathStatus() {
        return this._navModeSelector.glidepathState;
    }

    set modeSelectorGlidepathStatus(value) {
        this._navModeSelector.glidepathState = value;
    }

    get approachMode() {
        return this._navModeSelector.approachMode;
    }

    get currentAltitudeTracking() {
        return this._navModeSelector.currentAltitudeTracking;
    }

    set currentAltitudeTracking(value) {
        this._navModeSelector.currentAltitudeTracking = value;
    }

    get firstPossibleDescentIndex() {
        return this._vnav._firstPossibleDescentIndex;
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
                    console.log("path arm");
                    this._vnavPathStatus = VnavPathStatus.PATH_ARMED;
                } else {this.checkPreselector;}
                break;
            case VnavPathStatus.PATH_ARMED:
                if (!this.isVNAVOn) {
                    this._vnavPathStatus = VnavPathStatus.NONE;
                    break;
                }
                this.setFmaVerticalArmedState();
                if (this.canPathActivate()) {
                    console.log("path activate");
                    this._vnavPathStatus = VnavPathStatus.PATH_ACTIVE;
                    this.fmaVerticalActiveState = VerticalNavModeState.PATH;
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
                this.followPath();
                this.setFmaVerticalArmedState();
                break;
        }

        switch(this._glidepathStatus) {
            case GlidepathStatus.NONE:
                break;
            case GlidepathStatus.GP_CAN_ARM:
                if (this.lateralMode === LateralNavModeState.APPR && this.approachMode === WT_ApproachType.RNAV) {
                    this._glidepathStatus = GlidepathStatus.GP_ARMED;
                    this.fmaVerticalArmedState = VerticalNavModeState.GP;
                }
                break;
            case GlidepathStatus.GP_ARMED:
                if (this.lateralMode !== LateralNavModeState.APPR || this.approachMode !== WT_ApproachType.RNAV) {
                    this.cancelGlidepath();
                    break;
                }
                if (this.canGlidepathActivate()) {
                    this._glidepathStatus = GlidepathStatus.GP_ACTIVE;
                    this._vnavPathStatus = VnavPathStatus.NONE;
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    this.fmaVerticalActiveState = VerticalNavModeState.GP;
                    this.isVNAVOn = false;
                }
                break;
            case GlidepathStatus.GP_ACTIVE:
                if (this.lateralMode !== LateralNavModeState.APPR || this.approachMode !== WT_ApproachType.RNAV) {
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

    setFmaVerticalArmedState() {
        if (this._vnavPathStatus === VnavPathStatus.PATH_ARMED) {
            this._navModeSelector.setProperVerticalArmedStates(false, VerticalNavModeState.PATH, 1)
        }
        if (this._vnavPathStatus === VnavPathStatus.PATH_ACTIVE) {
            if (Math.floor(this.altSet1) >= this.targetAltitude) {
                this._navModeSelector.setProperVerticalArmedStates(false, VerticalNavModeState.ALTS, 0)
            } else {
                this._navModeSelector.setProperVerticalArmedStates(false, VerticalNavModeState.ALTV, 0)
            }
        }
    }

    updateNavModeSelector(status = false) {
        console.log("running updateNavModeSelector");

        switch(status) {
            case VnavPathStatus.PATH_ACTIVE:
                if (Math.floor(this.altSet1) < this.targetAltitude - 50) {
                    this.currentAltitudeTracking = AltitudeState.MANAGED;
                } else {
                    this.currentAltitudeTracking = AltitudeState.SELECTED;
                }
                break;
            case GlidepathStatus.GP_ACTIVE:
                this.currentAltitudeTracking = AltitudeState.NONE;
                break;
            case PathInterceptStatus.LEVELING:
                this.currentAltitudeTracking = AltitudeState.MANAGED;
                break;
            case false:
                this.currentAltitudeTracking = AltitudeState.SELECTED;
                break;
        }
    }

    canPathArm() {
        
        switch(this.isVNAVOn) {
            case false:
                break;
            case true:
                if (this.firstPossibleDescentIndex && this._vnav.flightplan.activeWaypointIndex >= this.firstPossibleDescentIndex) {
                    const distance = this._vnav.getDistanceToTarget();
                    const altitudeDifference = this.indicatedAltitude - this._vnav.getTargetAltitude();
                    const requiredFpa = AutopilotMath.calculateFPA(altitudeDifference, distance);
                    const reqVs = AutopilotMath.calculateVerticaSpeed(requiredFpa, this.groundSpeed);
                    if (this.path.deviation <= 1000 && altitudeDifference > 100 && this.distanceToTod < 20
                        && this.verticalSpeed > reqVs && this.altSet1 < this.indicatedAltitude - 100) {
                        console.log("normal path arming");
                        return true;
                    } else if (this.path.deviation > 1000 && this.altSet1 < this.indicatedAltitude - 100) {
                        if (this.verticalSpeed < reqVs) {
                            console.log("above path arming");
                            return true;
                        } else {
                            console.log("no path");
                            this.fmaVerticalArmedState = VerticalNavModeState.NOPATH;
                        }
                    }
                }
        }
        return false;
    }

    canPathActivate() {
        console.log("can path activate running");
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
                if (this._vnavState === VnavState.PATH && this._vnavPathStatus === VnavPathStatus.NONE) {
                    this._vnavPathStatus = VnavPathStatus.PATH_EXISTS;
                }
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
        const gp = this.glidepath && this.glidepath.fpa !== undefined && this.glidepath.fpa > 0;
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
                if (this._glidepathStatus === GlidepathStatus.GP_ACTIVE) {
                    if (this.altSlot !== AltitudeSlot.MANAGED) {
                        this.altSlot = AltitudeSlot.MANAGED;
                    }
                } else if (this._vnavPathStatus === VnavPathStatus.PATH_ACTIVE) {
                    if (this.altSlot !== AltitudeSlot.SELECTED) {
                        this.altSlot = AltitudeSlot.SELECTED;
                    }
                    if (this.currentSegment.distanceToNextTod < 1 && this._pathInterceptStatus === PathInterceptStatus.INTERCEPTED) {
                        this._pathInterceptStatus = PathInterceptStatus.CONTINUOUS;
                        this._continuousIndex = this._vnav.flightplan.activeWaypointIndex;
                    }
                    else if (this.indicatedAltitude < this.targetAltitude + 500) {
                        this.altSet2 = this.targetAltitude;
                        this.altSlot = AltitudeSlot.MANAGED;
                        this._pathInterceptStatus = PathInterceptStatus.LEVELING;
                    } 
                }
                break;
            case PathInterceptStatus.CONTINUOUS:
                if (this._continuousIndex != this._vnav.flightplan.activeWaypointIndex) {
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    this._continuousIndex = undefined;
                }
                if (this.altSlot !== AltitudeSlot.SELECTED) {
                    this.altSlot = AltitudeSlot.SELECTED;
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
        console.log("interceptPath - status: " + this._pathInterceptStatus);
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
                if (this._vnavPathStatus === VnavPathStatus.PATH_ACTIVE) {
                    this.modeSelectorPathStatus = VnavPathStatus.PATH_ACTIVE;
                    this.altSlot = AltitudeSlot.SELECTED;
                    this._navModeSelector.queueEvent(NavModeEvent.PATH_ACTIVE);
                    console.log("switched to PATH");
                }
                else if (this._glidepathStatus === GlidepathStatus.GP_ACTIVE) {
                    this.modeSelectorGlidepathStatus = GlidepathStatus.GP_ACTIVE;
                    this.altSlot = AltitudeSlot.MANAGED;
                    this._navModeSelector.queueEvent(NavModeEvent.GP_ACTIVE);
                    console.log("switched to GP");
                }
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
                console.log("starting intercept");
                this.targetAltitude = this.path.fpta;
                this.manageAltitude();
            case PathInterceptStatus.INTERCEPTING:
                console.log("sending fpa for intercept " + this.path.fpa);
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
        this.setDonut(desiredVerticalSpeed);
        
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
        let newAltSlot = this.altSlot;

        const setConstraint = () => {
            this.targetAltitude = this.constraint.altitude;
            if (this.constraint.isClimb) {
                if (this.targetAltitude < this.altSet1) {
                    this.setManagedAltitude(this.targetAltitude);
                    this.currentAltitudeTracking = AltitudeState.MANAGED;
                    console.log("vnav setConstraint setting MANAGED");
                    this._constraintStatus = ConstraintStatus.OBSERVING_CLIMB;
                    this._activeConstraintIndex = this.constraint.index;
                    this._navModeSelector.setProperVerticalArmedStates();
                    return AltitudeSlot.MANAGED;
                }
            } else {
                if (this.targetAltitude > this.altSet1) {
                    this.setManagedAltitude(this.targetAltitude);
                    this.currentAltitudeTracking = AltitudeState.MANAGED;
                    console.log("vnav setConstraint setting SELECTED");
                    this._constraintStatus = ConstraintStatus.OBSERVING_DESCENT;
                    this._activeConstraintIndex = this.constraint.index;
                    this._navModeSelector.setProperVerticalArmedStates();
                    return AltitudeSlot.MANAGED;
                }
            }
            
        }

        const resumeClimb = () => {
            if (this.altSet1 > this._vnav.indicatedAltitude + 100) {
                let speed = WTDataStore.get('CJ4_vnavClimbIas', 240);
                this._navModeSelector.engageFlightLevelChange(speed);
                this._navModeSelector.currentVerticalActiveState = VerticalNavModeState.FLC;
                this.currentAltitudeTracking = AltitudeState.SELECTED;
                console.log("vnav resumeClimb setting SELECTED");
                this._navModeSelector.setProperVerticalArmedStates(true);
                this._navModeSelector.setProperVerticalArmedStates();
                
            }
            return AltitudeSlot.SELECTED;
        }

        switch(this._constraintStatus) {
            case ConstraintStatus.NONE:
                if (this.constraint.index !== undefined && this.constraint.index >= this._vnav.flightplan.activeWaypointIndex) {
                    newAltSlot = setConstraint();
                }
                break;
            case ConstraintStatus.OBSERVING_CLIMB:
                if (this._activeConstraintIndex < this._vnav.flightplan.activeWaypointIndex) {
                    this._constraintStatus = ConstraintStatus.PASSED;
                    newAltSlot = resumeClimb();
                } else if (this.targetAltitude >= this.altSet1) {
                    newAltSlot = AltitudeSlot.SELECTED;
                    if (this.currentAltitudeTracking !== AltitudeState.SELECTED) {
                        this.currentAltitudeTracking = AltitudeState.SELECTED;
                        console.log("vnav ConstraintStatus.OBSERVING_CLIMB setting SELECTED");
                        this._navModeSelector.setProperVerticalArmedStates();
                    }
                } else if (this.targetAltitude < this.altSet1) {
                    newAltSlot = AltitudeSlot.MANAGED;
                    if (this.currentAltitudeTracking !== AltitudeState.MANAGED) {
                        this.currentAltitudeTracking = AltitudeState.MANAGED;
                        console.log("vnav ConstraintStatus.OBSERVING_CLIMB setting MANAGED");
                        this._navModeSelector.setProperVerticalArmedStates();
                    }
                }
                if (this._navModeSelector.currentVerticalActiveState === VerticalNavModeState.ALTV && this.targetAltitude < this.altSet1) {
                    this._navModeSelector.setProperVerticalArmedStates(true);
                    this._navModeSelector.setProperVerticalArmedStates(false, VerticalNavModeState.FLC, 1);
                    this.setDonut(0);
                } else {
                    this.setDonut(0, true);
                }
                break;
            case ConstraintStatus.OBSERVING_DESCENT:
                if (this._activeConstraintIndex < this._vnav.flightplan.activeWaypointIndex) {
                    this._constraintStatus = ConstraintStatus.PASSED;
                } else if (this.targetAltitude <= this.altSet1) {
                    newAltSlot = AltitudeSlot.SELECTED;
                    this.currentAltitudeTracking = AltitudeState.SELECTED;
                    console.log("vnav ConstraintStatus.OBSERVING_DESCENT setting SELECTED");

                } else if (this.targetAltitude > this.altSet1) {
                    newAltSlot = AltitudeSlot.MANAGED;
                    this.currentAltitudeTracking = AltitudeState.MANAGED;
                    console.log("vnav ConstraintStatus.OBSERVING_DESCENT setting MANAGED");

                }
                if (this.VerticalNavModeState === VerticalNavModeState.ALTV || this.VerticalNavModeState === VerticalNavModeState.ALTS) {
                    this.setDonut(0);
                } else {
                    this.setDonut(0, true);
                }
                break;
            case ConstraintStatus.PASSED:
                this.setDonut(0);
                this._activeConstraintIndex = undefined;
                this._constraintStatus = ConstraintStatus.NONE;
                break;
        }

        if (this.altSlot !== newAltSlot) {
            this.altSlot = newAltSlot;
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
            if (this.constraint.index !== undefined) {
                const index = this.constraint.index;
                const lDistance = this._vnav.allWaypoints[index].cumulativeDistanceInFP - this._vnav._currentDistanceInFP;
                const vDistance = this.indicatedAltitude - this.targetAltitude;
                const fpa = AutopilotMath.calculateFPA(vDistance, lDistance);
                const donut = Math.round(AutopilotMath.calculateVerticaSpeed(fpa, this.groundSpeed));
                this.donut = vDistance < 0 ? -1 * donut : donut;
            } else {
                this.donut = 0;
            }
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
GlidepathStatus.GS_CAN_ARM = 'GS_CAN_ARM';
GlidepathStatus.GS_ARMED = 'GS_ARMED';
GlidepathStatus.GS_ACTIVE = 'GS_ACTIVE';

class AltitudeSlot { }
AltitudeSlot.SELECTED = 1;
AltitudeSlot.MANAGED = 2;
AltitudeSlot.LOCK = 3;

class ConstraintStatus { }
ConstraintStatus.NONE = 'NONE';
ConstraintStatus.OBSERVING_CLIMB = 'OBSERVING_CLIMB';
ConstraintStatus.OBSERVING_DESCENT = 'OBSERVING_DESCENT';
ConstraintStatus.PASSED = 'PASSED';