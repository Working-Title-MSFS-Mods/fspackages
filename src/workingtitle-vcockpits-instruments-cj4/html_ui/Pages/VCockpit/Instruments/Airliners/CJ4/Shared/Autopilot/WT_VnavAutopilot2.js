class WT_VnavAutopilot {
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
        this._glidepathState = undefined;

        /**
        * Update Time for intercept logic
        * @type {number}
        */
        this._lastUpdateTime = undefined;

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

    get altSet2() {
        return this._navModeSelector.altSet2;
    }

    get path() {
        return this._vnav.trackPath();
    }

    get glidePath() {
        return this._vnav.trackApproachGlidepath();
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
        this._glidepathState = this.checkGlidepathState();

        switch(this._vnavPathStatus) {
            case VnavPathStatus.NONE:
                break;
            case VnavPathStatus.PATH_EXISTS:
                if (this.canPathArm()) {
                    this._vnavPathStatus = VnavPathStatus.PATH_ARMED;
                }
                break;
            case VnavPathStatus.PATH_ARMED:
                if (this.canPathActivate()) {
                    this._vnavPathStatus = VnavPathStatus.PATH_ACTIVE;
                }
                break;
            case VnavPathStatus.PATH_ACTIVE:
                this.followPath()
                break;
        }

        switch(this._glidepathState) {
            case GlidepathStatus.NONE:
                break;
            case GlidepathStatus.GP_CAN_ARM:
                if (this._navModeSelector.currentLateralActiveState = LateralNavModeState.APPR) {
                    this._glidepathState = GlidepathStatus.GP_ARMED;
                }
                break;
            case GlidepathStatus.GP_ARMED:
                if (this.canGlidepathActivate()) {
                    this._glidepathState = GlidepathStatus.GP_ACTIVE;
                }
                break;
            case GlidepathStatus.GP_ACTIVE:
                this.followGlidepath()
                break;
        }






        VnavPathStatus.NONE
        VnavPathStatus.PATH_ARMED
        VnavPathStatus.PATH_CAN_ARM
        VnavPathStatus.PATH_ACTIVE

        GlidepathStatus.NONE
        GlidepathStatus.GP_CAN_ARM
        GlidepathStatus.GP_ARMED
        GlidepathStatus.GP_ACTIVE



        PathInterceptStatus.NONE
        PathInterceptStatus.INTERCEPTING
        PathInterceptStatus.INTERCEPTED










        //We are intercepting the constraint, inhibit execution until we change path conditions
        if (this._pathActive === true && this._navModeSelector.currentVerticalActiveState === VerticalNavModeState.ALTC && this._inhibitExecute !== true) {
            if (this._navModeSelector.currentVerticalArmedStates[0] = VerticalNavModeState.GP) {
                this._inhibitExecute = false;
                SimVar.SetSimVarValue("L:WT_VNAV_PATH_STATUS", "number", 1);
            } else {
                this._inhibitExecute = true;
                SimVar.SetSimVarValue("L:WT_VNAV_PATH_STATUS", "number", 0);
            }
        }


        this.vnavAltSlotRequest();
    }

    canPathArm() {
        const distance = this._vnav.getDistanceToTarget();
        const altitudeDifference = this._vnav.indicatedAltitude - this._vnav.getTargetAltitude();
        const requiredFpa = AutopilotMath.calculateFPA(altitudeDifference, distance);
        const reqVs = AutopilotMath.calculateVerticaSpeed(requiredFpa, this.groundSpeed);
        if (this.path.deviation <= 1000 && altitudeDifference > 0
            && this.verticalSpeed > reqVs && this.altSet2 < this._vnav.indicatedAltitude + 100) {
            return true;
        } else if (this.path.deviation > 1000 && this.verticalSpeed < reqVs && this.altSet2 < this._vnav.indicatedAltitude + 100) {
            return true;
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
        if (this.glidePath.deviation < 100 && this.glidePath.deviation > -300) {
            return true;
        }
        return false;
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
                this._vnavState = vnavState;
                break;
            case VnavState.NONE:
                this._vnavPathStatus = VnavPathStatus.NONE;
                this._vnavState = vnavState;
        }
        return this.vnavState;
    }

    checkGlidepathState() {
        const gp = this.glidePath != undefined && this.glidePath > 0;
        switch(this._glidepathState) {
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
        return this._glidepathState;
    }

    interceptPath(fpa) {
        switch(this._pathInterceptStatus) {
            case PathInterceptStatus.NONE:
                const desiredVerticalSpeed = AutopilotMath.calculateVerticaSpeed(fpa, this.groundSpeed);
                const deltaVS = desiredVerticalSpeed - this.verticalSpeed;
                const intercept = {
                    verticalSpeed: 100 * Math.floor(this.verticalSpeed / 100),
                    increments: Math.floor(deltaVS / 100)
                }
                this._pathInterceptValues = intercept;
                this._pathInterceptStatus = PathInterceptStatus.INTERCEPTING;
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
                    Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, this._pathInterceptValues.verticalSpeed);
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
                this.setTargetAltitude(this.path.fpta);
            case PathInterceptStatus.INTERCEPTING:
                this.interceptPath(this.path.fpa);
                break;
            case PathInterceptStatus.INTERCEPTED:
                this.commandVerticalSpeed(this.path.fpa, this.path.deviation);
        }
    }

    followGlidepath() {
        switch(this._pathInterceptStatus) {
            case PathInterceptStatus.NONE:
                this.setTargetAltitude(this.path.fpta);
            case PathInterceptStatus.INTERCEPTING:
                this.interceptPath(this.path.fpa);
                break;
            case PathInterceptStatus.INTERCEPTED:
                this.commandVerticalSpeed(this.path.fpa, this.path.deviation);
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
        Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, setVerticalSpeed);
    }

    
    /**
     * Execute.
     */
    execute() {
        
        this.checkPreselector();
        this.setSnowflake();
        this.setDonut();

        this.monitorValues();

        

        if (this._inhibitExecute) {
            return;
        }

        // //TODO: SORT OUT THESE LVARS
        // if (t == 2) {
        //     SimVar.SetSimVarValue("L:WT_VNAV_ACTIVE", "number", 1); 

        // } else {
        //     if (SimVar.GetSimVarValue("L:WT_VNAV_ACTIVE", "number") != 0) {
        //         SimVar.SetSimVarValue("L:WT_VNAV_ACTIVE", "number", 0); 
        //     }
        // }
        
        //EXECUTION CYCLE
        const pathStatusSimVar = SimVar.GetSimVarValue("L:WT_VNAV_PATH_STATUS", "number");
        
        if (this._pathActivate) {
            //TIME TO ACTIVATE
            this.setTargetAltitude();
            this._pathActive = true;
            this._pathActivate = false;
            if (pathStatusSimVar != 3) {
                SimVar.SetSimVarValue("L:WT_VNAV_PATH_STATUS", "number", 3);
            }
        }

        if (this._pathActive) {
            //RUNNING
            if (pathStatusSimVar != 3) {
                SimVar.SetSimVarValue("L:WT_VNAV_PATH_STATUS", "number", 3);
            }
            if (Math.round(this._navModeSelector.selectedAlt2) != this._vnavTargetAltitude) {
                this.setTargetAltitude();
            }
            if (this._navModeSelector.currentAltSlotIndex !=2 && this._vnav._altDeviation > 0) {
                this._vnavAltSlot = 2;
            }

            // if (this._navModeSelector.currentVerticalActiveState != VerticalNavModeState.PATH) {
            //     this.recalculate();
            // }
        }
        else if (this._pathArm) {
            //ARM PATH MODE (FROM BELOW)
            if (pathStatusSimVar != 1) {
                SimVar.SetSimVarValue("L:WT_VNAV_PATH_STATUS", "number", 1);
            }
        }
        else if (this._pathArmAbove) {
            //ARM PATH MODE (FROM ABOVE)
            const currentVS = Math.round(Simplane.getVerticalSpeed());
            if (currentVS < this._pathFromAboveRequiredVs) {
                if (pathStatusSimVar != 1) {
                    SimVar.SetSimVarValue("L:WT_VNAV_PATH_STATUS", "number", 1);
                }
            }
            else {
                if (pathStatusSimVar != 2) {
                    SimVar.SetSimVarValue("L:WT_VNAV_PATH_STATUS", "number", 2);
                }
            }
        }
        else {
            if (pathStatusSimVar != 0) {
                SimVar.SetSimVarValue("L:WT_VNAV_PATH_STATUS", "number", 0);
            }
            this.recalculate();
        }
        
        if (!this._pathActive && this._constraintExists) {
            //NO PATH, SET ALT CONSTRAINTS
            if (this._vnav._vnavConstraintWaypoint) {
                const altSet2 = this._navModeSelector.selectedAlt2;
                if (Math.round(altSet2) != Math.round(this._vnav._vnavConstraintAltitude) && (VerticalNavModeState.ALT || VerticalNavModeState.ALTC)) {
                    this.setTargetAltitude(this._vnav._vnavConstraintAltitude);
                }
                if (this._navModeSelector.currentVerticalActiveState == VerticalNavModeState.PTCH
                     || this._navModeSelector.currentVerticalActiveState == VerticalNavModeState.VS 
                     || this._navModeSelector.currentVerticalActiveState == VerticalNavModeState.FLC) {
                        const altSlot = this._navModeSelector.currentAltSlotIndex;
                        const altSet1 = this._navModeSelector.selectedAlt1;
                        if (Math.round(altSet2) != Math.round(this._vnav._vnavConstraintAltitude)) {
                            this.setTargetAltitude(this._vnav._vnavConstraintAltitude);
                        }
                        if (this._vnav._currentFlightSegment.type == SegmentType.Departure) {
                            //CLIMB CONSTRAINTS
                            this._obeyingConstraint = true;
                            if (altSet1 > altSet2 && (altSlot == 1 || altSlot == 3)) {
                                this._vnavAltSlot = 2;
                                //SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
                            }
                            else if (altSet1 <= altSet2 && altSlot == 2) {
                                this._vnavAltSlot = 1;
                                //SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
                            }
                        }
                        else if (this._vnav._currentFlightSegment.type != SegmentType.Departure) {
                            //DESCENT CONSTRAINTS
                            this._obeyingConstraint = true;
                            if (altSet1 < altSet2 && altSlot == 1) {
                                this._vnavAltSlot = 2;
                            }
                            else if (altSet1 >= altSet2 && altSlot == 2) {
                                this._vnavAltSlot = 1;
                            }
                        }
                    }
            }
            else {
                SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
                this._vnavAltSlot = 1;
            }
            if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:2", "feet per minute") != 0) {
                Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, 0);
            }
        }
        else if (this._pathActive) {
            //SET VS FOR VNAV PATH
            const activeFPA = (this._navModeSelector.currentLateralActiveState === LateralNavModeState.APPR && this._vnav._gpExists) ? this._vnav._gpAngle
                : this._vnav._desiredFPA;
            SimVar.SetSimVarValue("L:WT_TEMP_ACTIVE_FPA", "number", activeFPA);
            let setVerticalSpeed = 0;
            const groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            const desiredVerticalSpeed = -101.2686667 * groundSpeed * Math.tan(activeFPA * (Math.PI / 180));
            const maxVerticalSpeed = 101.2686667 * groundSpeed * Math.tan(6 * (Math.PI / 180));
            const maxCorrection = maxVerticalSpeed + desiredVerticalSpeed;
            if (Math.floor(this._navModeSelector.selectedAlt2) != this._vnavTargetAltitude) {
                this.setTargetAltitude();
            }
            if (this._vnav._vnavTargetDistance < 1 && this._vnav._vnavTargetDistance > 0) {
                setVerticalSpeed = desiredVerticalSpeed;
            }
            else {
                if (this._vnav._altDeviation > 10) {
                    const correction = Math.min(Math.max((2.1 * this._vnav._altDeviation), 100), maxCorrection);
                    setVerticalSpeed = desiredVerticalSpeed - correction;
                }
                else if (this._vnav._altDeviation < -10) {
                    const correction = Math.min(Math.max((-2.1 * this._vnav._altDeviation), 100), (-1 * desiredVerticalSpeed));
                    setVerticalSpeed = desiredVerticalSpeed + correction;
                }
                else {
                    setVerticalSpeed = desiredVerticalSpeed;
                }
            }
            setVerticalSpeed = 100 * Math.ceil(setVerticalSpeed / 100);
            Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, setVerticalSpeed);
            if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "number") != 1 && this._vnav._altDeviation > 0) {
                SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 1);
              }
        }
    }

    /**
     * Run when deactivated.
     */
    deactivate() {
        this._constraintExists = false;
        this._pathArm = false;
        this._pathArmAbove = false;
        this._pathActive = false;
        this._pathActivate = false;
        this._pathArmFired = false;
        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
        SimVar.SetSimVarValue('L:WT_CJ4_SNOWFLAKE', 'number', 0);
        SimVar.SetSimVarValue("L:WT_VNAV_PATH_STATUS", "number", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_DONUT", "number", 0);
        return;
    }

    failed() {
        this._constraintExists = false;
        this._pathArm = false;
        this._pathActive = false;
        this._pathActivate = false;
        this._pathArmFired = false;
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, this._vnav._altitude, true);
        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
        SimVar.SetSimVarValue('L:WT_CJ4_SNOWFLAKE', 'number', 0);
        SimVar.SetSimVarValue("L:WT_VNAV_PATH_STATUS", "number", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_DONUT", "number", 0);
        return;
    }

    setTargetAltitude(targetAltitude = this._vnavTargetAltitude) {

        if (this._navModeSelector.currentLateralActiveState === LateralNavModeState.APPR) {
            Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, Math.round(targetAltitude - 500), false);
            SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
        }
        else {
            let isClimb = this._vnav._currentFlightSegment.type == SegmentType.Departure ? true : false;

            let selectedAltitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:1", "feet");
            let updatedTargetAltitude = isClimb ? Math.min(targetAltitude, selectedAltitude) : Math.max(targetAltitude, selectedAltitude);
            updatedTargetAltitude = Math.floor(updatedTargetAltitude);

            Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, Math.floor(updatedTargetAltitude), true);

            SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 1);
        }
    }

    setSnowflake() {
        //SET SNOWFLAKE -- TODO: NEED MORE RESTRICTIONS?
        if (this._vnav._pathCalculating && Math.abs(this._vnav._altDeviation) < 1001) {
            if (SimVar.GetSimVarValue('L:WT_CJ4_SNOWFLAKE', 'number') != 1) {
                SimVar.SetSimVarValue('L:WT_CJ4_SNOWFLAKE', 'number', 1);
            }
        }
        else {
            if (SimVar.GetSimVarValue('L:WT_CJ4_SNOWFLAKE', 'number') == 1) {
                SimVar.SetSimVarValue('L:WT_CJ4_SNOWFLAKE', 'number', 0);
            }
        }
    }

    setDonut() {
        if (this._pathActive) {
            const groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            const activeFPA = (this._navModeSelector.currentLateralActiveState === LateralNavModeState.APPR && this._vnav._gpExists) ? this._vnav._gpAngle
            : this._vnav._desiredFPA;
            const desiredVerticalSpeed = -101.2686667 * groundSpeed * Math.tan(activeFPA * (Math.PI / 180));
            SimVar.SetSimVarValue("L:WT_CJ4_DONUT", "number", desiredVerticalSpeed); 
        }
        else if (this._vnav._vnavConstraintWaypoint && this._vnav._activeWaypointDist && this._vnav._distanceToTod < 50) {
            const constraintDistance = this._vnav._vnavConstraintWaypoint.cumulativeDistanceInFP;
            const currentDistance = this._vnav._activeWaypoint.cumulativeDistanceInFP - this._vnav._activeWaypointDist;
            const distanceToConstraint = constraintDistance - currentDistance;
            const altitudeDifference = this._indicatedAltitude - this._vnav._vnavConstraintAltitude;
            const requiredFpa = (180 / Math.PI) * (Math.atan(altitudeDifference / (distanceToConstraint * 6076.12)));
            const groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            const reqVs = -101.2686667 * groundSpeed * Math.tan(requiredFpa * (Math.PI / 180));
            SimVar.SetSimVarValue("L:WT_CJ4_DONUT", "number", reqVs); 
        }
        else {
            SimVar.SetSimVarValue("L:WT_CJ4_DONUT", "number", 0);
        }
    }

    checkPreselector() {
        //FLAG "CHECK PRESELECTOR" IN FMC
        const approachingTodDistance = 0.0125 * SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
        if (!this._pathArm && !this._pathArmFired && this._vnav._distanceToTod < approachingTodDistance && this._vnav._distanceToTod > 0) {
            if (SimVar.GetSimVarValue("L:WT_VNAV_TOD_FMC_ALERT", "bool") != 1) {
                SimVar.SetSimVarValue("L:WT_VNAV_TOD_FMC_ALERT", "bool", 1); 
                this._pathArmFired = true;
            }
        }
    }

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
        
        SimVar.SetSimVarValue("L:WT_VNAV_constraintExists", "number", this._constraintExists ? 1 : 0);
        SimVar.SetSimVarValue("L:WT_VNAV_pathArm", "number", this._pathArm ? 1 : 0);
        SimVar.SetSimVarValue("L:WT_VNAV_pathActive", "number", this._pathActive ? 1 : 0);
        SimVar.SetSimVarValue("L:WT_VNAV_inhibitExecute", "number", this._inhibitExecute ? 1 : 0);
        SimVar.SetSimVarValue("L:WT_VNAV_obeyingConstraint", "number", this._obeyingConstraint ? 1 : 0);

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

class GlidepathStatus { }
GlidepathStatus.NONE = 'NONE';
GlidepathStatus.GP_CAN_ARM = 'GP_CAN_ARM';
GlidepathStatus.GP_ARMED = 'GP_ARMED';
GlidepathStatus.GP_ACTIVE = 'GP_ACTIVE';