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
        * Tracked Glideslope State
        * @type {GlideslopeStatus}
        */
        this._glideslopeStatus = GlideslopeStatus.NONE;

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

    get selectedAltitude() {
        return Math.floor(this._navModeSelector.selectedAlt1);
    }

    get managedAltitude() {
        return Math.floor(this._navModeSelector.selectedAlt2);
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
        switch(this._navModeSelector.currentAltSlotIndex) {
            case 1:
                return AltitudeSlot.SELECTED;
            case 2:
                return AltitudeSlot.MANAGED;
            case 3:
                return AltitudeSlot.LOCK;
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

    get navMode() {
        return SimVar.GetSimVarValue("L:WT_CJ4_LNAV_MODE", "number");
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

    get modeSelectorGlideslopeStatus() {
        return this._navModeSelector.glideslopeState;
    }

    set modeSelectorGlideslopeStatus(value) {
        this._navModeSelector.glideslopeState = value;
    }

    get glideslopeFpa() {
        return SimVar.GetSimVarValue("NAV GLIDE SLOPE", "number");
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
        this._glideslopeStatus = this.checkGlideslopeStatus();

        switch(this._vnavPathStatus) {
            case VnavPathStatus.NONE:
                break;
            case VnavPathStatus.PATH_EXISTS:
                if (this.canPathArm()) {
                    console.log("path arm");
                    this._vnavPathStatus = VnavPathStatus.PATH_ARMED;
                } else {
                    this.checkPreselector;
                }
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
                    console.log("GP Armed");
                    this._navModeSelector.currentArmedVnavState = VerticalNavModeState.GP;
                }
                break;
            case GlidepathStatus.GP_ARMED:
                if (this.lateralMode !== LateralNavModeState.APPR || this.approachMode !== WT_ApproachType.RNAV) {
                    console.log("GP Canceled");
                    this.cancelGlidepath();
                    break;
                }
                if (this.canGlidepathActivate()) {
                    console.log("GP Activated");
                    this.isVNAVOn = false;
                    this._glidepathStatus = GlidepathStatus.GP_ACTIVE;
                    this._vnavPathStatus = VnavPathStatus.NONE;
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    this.setFmaVerticalArmedState();
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

        switch(this._glideslopeStatus) {
            case GlideslopeStatus.NONE:
                break;
            case GlideslopeStatus.GS_CAN_ARM:
                if (this.lateralMode === LateralNavModeState.APPR && this.approachMode === WT_ApproachType.ILS) {
                    this._glideslopeStatus = GlideslopeStatus.GS_ARMED;
                    console.log("GS Armed");
                    this._navModeSelector.currentArmedVnavState = VerticalNavModeState.GS;
                }
                break;
            case GlideslopeStatus.GS_ARMED:
                if (this.lateralMode !== LateralNavModeState.APPR || this.approachMode !== WT_ApproachType.ILS) {
                    console.log("GS Canceled");
                    this.cancelGlideslope();
                    break;
                }
                if (this.canGlideslopeActivate()) {
                    console.log("GS Activated");
                    this.isVNAVOn = false;
                    this._glideslopeStatus = GlideslopeStatus.GS_ACTIVE;
                    this._vnavPathStatus = VnavPathStatus.NONE;
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    this.setFmaVerticalArmedState();
                }
                break;
            case GlideslopeStatus.GS_ACTIVE:
                if (this.lateralMode !== LateralNavModeState.APPR || this.approachMode !== WT_ApproachType.ILS) {
                    this.cancelGlideslope();
                    break;
                }
                this.followGlideslope()
                break;
        }

        switch(this.isVNAVOn) {
            case false:
                if (this._glidepathStatus === GlidepathStatus.GP_ACTIVE) {
                    break;
                }
                if (this.altSlot === AltitudeSlot.MANAGED) {
                    this.setAltitudeAndSlot(AltitudeSlot.SELECTED);
                    this._navModeSelector.setProperVerticalArmedStates();
                }
                if (this.currentAltitudeTracking === AltitudeState.MANAGED) {
                    this.currentAltitudeTracking = AltitudeState.SELECTED;
                    this._navModeSelector.setProperVerticalArmedStates();
                }
                if (this.donut != 0) {
                    this.setDonut(0);
                }
                break;
            case true:
                if (this._vnavPathStatus !== VnavPathStatus.PATH_ACTIVE) {
                    this.observeConstraints();
                }
        }

        this.setSnowflake();
        this.monitorValues();
    }

    setFmaVerticalArmedState() {
        if (this._vnavPathStatus === VnavPathStatus.PATH_ARMED && this._navModeSelector.currentArmedVnavState !== VerticalNavModeState.PATH) {
            this._navModeSelector.currentArmedVnavState = VerticalNavModeState.PATH;
        } else if (this._glidepathStatus === GlidepathStatus.GP_ARMED && this._navModeSelector.currentArmedVnavState !== VerticalNavModeState.GP) {
            this._navModeSelector.currentArmedVnavState = VerticalNavModeState.GP;
        } else if (this._glideslopeStatus === GlideslopeStatus.GS_ARMED && this._navModeSelector.currentArmedVnavState !== VerticalNavModeState.GS) {
            console.log("this._glideslopeStatus " + this._glideslopeStatus);
            this._navModeSelector.currentArmedVnavState = VerticalNavModeState.GS;
        }
        if (this._vnavPathStatus === VnavPathStatus.PATH_ACTIVE) {
            if (this._navModeSelector.currentArmedVnavState === VerticalNavModeState.PATH && this._pathInterceptStatus !== PathInterceptStatus.LEVELED) {
                this._navModeSelector.currentArmedVnavState = VerticalNavModeState.NONE;
            }
            if (Math.floor(this.selectedAltitude) >= this.targetAltitude && (this._pathInterceptStatus === PathInterceptStatus.INTERCEPTED
                    || this._pathInterceptStatus === PathInterceptStatus.CONTINUOUS)) {
                if (this._navModeSelector.currentArmedAltitudeState !== VerticalNavModeState.ALTS) {
                    this._navModeSelector.currentArmedAltitudeState = VerticalNavModeState.ALTS;
                }
            } else if (this._pathInterceptStatus === PathInterceptStatus.INTERCEPTED || this._pathInterceptStatus === PathInterceptStatus.CONTINUOUS) {
                if (this._navModeSelector.currentArmedAltitudeState !== VerticalNavModeState.ALTV) {
                    this._navModeSelector.currentArmedAltitudeState = VerticalNavModeState.ALTV;
                }
            }
        } else if (this._glidepathStatus === GlidepathStatus.GP_ACTIVE) {
            if (this._navModeSelector.currentArmedVnavState === VerticalNavModeState.GP) {
                this._navModeSelector.currentArmedVnavState = VerticalNavModeState.NONE;
            }
            if (this._navModeSelector.currentVerticalActiveState !== VerticalNavModeState.GP) {
                this._navModeSelector.currentVerticalActiveState = VerticalNavModeState.GP;
            }
            if (this._navModeSelector.currentArmedAltitudeState !== VerticalNavModeState.NONE) {
                this._navModeSelector.currentArmedAltitudeState = VerticalNavModeState.NONE;
            }
        } else if (this._glideslopeStatus === GlideslopeStatus.GS_ACTIVE) {
            console.log("this._glideslopeStatus " + this._glideslopeStatus);
            if (this._navModeSelector.currentArmedVnavState !== VerticalNavModeState.NONE) {
                this._navModeSelector.currentArmedVnavState = VerticalNavModeState.NONE;
            }
            if (this._navModeSelector.currentVerticalActiveState !== VerticalNavModeState.GS) {
                this._navModeSelector.currentVerticalActiveState = VerticalNavModeState.GS;
            }
            if (this._navModeSelector.currentArmedAltitudeState !== VerticalNavModeState.NONE) {
                this._navModeSelector.currentArmedAltitudeState = VerticalNavModeState.NONE;
            }
        }
    }

    updateNavModeSelector(status = false) {
        console.log("running updateNavModeSelector");

        switch(status) {
            case VnavPathStatus.PATH_ACTIVE:
                if (Math.floor(this.selectedAltitude) < this.targetAltitude - 50) {
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
                        && this.verticalSpeed > reqVs && this.selectedAltitude < this.indicatedAltitude - 100) {
                        console.log("normal path arming");
                        return true;
                    } else if (this.path.deviation > 1000 && this.selectedAltitude < this.indicatedAltitude - 100) {
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

    canGlideslopeActivate() {
        const gs = this.trackGlideslope();
        if (gs < 100 && gs > -300) {
            return true;
        }
        return false;
    }

    cancelGlidepath() {
        this._glidepathStatus = GlidepathStatus.NONE;
        this._navModeSelector.currentArmedVnavState = VerticalNavModeState.NONE;
        this.snowflake = false;
    }

    cancelGlideslope() {
        this._glideslopeStatus = GlideslopeStatus.NONE;
        this._navModeSelector.currentArmedVnavState = VerticalNavModeState.NONE;
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

    checkGlideslopeStatus() {
        const signal = (this.navMode == 1 || this.navMode == 2) ? SimVar.GetSimVarValue("NAV HAS NAV:" + this.navMode, "bool") : false;
        const isIls = signal ? SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + this.navMode, "bool") : false;
        const gs = isIls ? SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:" + this.navMode, "bool") : false; 
        console.log("GS EXISTS? " + gs);
        switch(this._glideslopeStatus) {
            case GlideslopeStatus.NONE:
                if (gs) {
                    return GlideslopeStatus.GS_CAN_ARM;
                }
                break;
            case GlideslopeStatus.GS_CAN_ARM:
            case GlideslopeStatus.GS_ARMED:
            case GlideslopeStatus.GS_ACTIVE:
                if (!gs) {
                    return GlideslopeStatus.NONE;
                }
        }
        return this._glideslopeStatus;
    }

    trackGlideslope() {
        const gsi = SimVar.GetSimVarValue("NAV GSI:" + this.navMode, "number");
        console.log("gs deviation: " + gsi);
        return gsi * 100;
    }

    setVerticalNavModeState(state) {
        if (this._navModeSelector.currentVerticalActiveState !== state) {
            this._navModeSelector.currentVerticalActiveState = state;
        }
    }

    manageAltitude() {
        switch(this._pathInterceptStatus) {
            case PathInterceptStatus.NONE:
            case PathInterceptStatus.INTERCEPTING:
                this.setManagedAltitude();
            case PathInterceptStatus.INTERCEPTED:
                if (this._glidepathStatus === GlidepathStatus.GP_ACTIVE) {
                    this.setVerticalNavModeState(VerticalNavModeState.GP);
                    if (this.altSlot !== AltitudeSlot.MANAGED) {
                        this.setAltitudeAndSlot(AltitudeSlot.MANAGED, -1000, true);
                    }
                }
                else if (this._glideslopeStatus === GlideslopeStatus.GS_ACTIVE) {
                    this.setVerticalNavModeState(VerticalNavModeState.GS);
                    if (this.altSlot !== AltitudeSlot.MANAGED) {
                        this.setAltitudeAndSlot(AltitudeSlot.MANAGED, -1000, true);
                    }
                }
                else if (this._vnavPathStatus === VnavPathStatus.PATH_ACTIVE) {
                    this.setVerticalNavModeState(VerticalNavModeState.PATH);
                    if (this.altSlot !== AltitudeSlot.SELECTED) {
                        this.setAltitudeAndSlot(AltitudeSlot.SELECTED);
                    }
                    const targetDistance = this._vnav.allWaypoints[this.currentSegment.targetIndex].cumulativeDistanceInFP - this._vnav._currentDistanceInFP;
                    if (this.currentSegment.distanceToNextTod < 1 && this._pathInterceptStatus === PathInterceptStatus.INTERCEPTED 
                            && targetDistance < 1) {
                        console.log("this.currentSegment.distanceToNextTod " + this.currentSegment.distanceToNextTod);
                        this._pathInterceptStatus = PathInterceptStatus.CONTINUOUS;
                        this._continuousIndex = this._vnav.flightplan.activeWaypointIndex;
                    }
                    else if (this.indicatedAltitude < this.targetAltitude + 500) {
                        this.setAltitudeAndSlot(AltitudeSlot.MANAGED, this.targetAltitude);
                        this._pathInterceptStatus = PathInterceptStatus.LEVELING;
                    } 
                }
                else {
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                }
                break;
            case PathInterceptStatus.CONTINUOUS:
                this.setVerticalNavModeState(VerticalNavModeState.PATH);
                if (this._continuousIndex != this._vnav.flightplan.activeWaypointIndex) {
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    this._continuousIndex = undefined;
                }
                if (this.altSlot !== AltitudeSlot.SELECTED) {
                    this.setAltitudeAndSlot(AltitudeSlot.SELECTED);
                }
                break;
            case PathInterceptStatus.LEVELING:
                if (this._navModeSelector.isAltitudeLocked) {
                    this.setManagedAltitude();
                    this._pathInterceptStatus = PathInterceptStatus.LEVELED;
                    this.setDonut(0);
                } else if (this.path.fpta && this.targetAltitude !== this.path.fpta) {
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    this._navModeSelector.currentArmedVnavState = VerticalNavModeState.PATH;
                    this._vnavPathStatus = VnavPathStatus.NONE
                }
                break;
            case PathInterceptStatus.LEVELED:
                if (this.path.fpta && this.targetAltitude !== this.path.fpta) {
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    this._navModeSelector.currentArmedVnavState = VerticalNavModeState.PATH;
                    this._vnavPathStatus = VnavPathStatus.NONE
                } else if (!this.path.fpta || this.vnavState === VnavState.NONE) {
                    this._navModeSelector.currentArmedVnavState = VerticalNavModeState.NONE;
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    this._vnavPathStatus = VnavPathStatus.NONE
                    this.setAltitudeAndSlot(AltitudeSlot.SELECTED, -1000, true);
                    this.vsSlot = 1;
                    this.vsSlot2Value = 0;
                } else if (this.path.fpa == 0) {
                    this.currentAltitudeTracking = AltitudeState.MANAGED;
                    this._navModeSelector.currentArmedVnavState = VerticalNavModeState.PATH;
                    this._navModeSelector.currentVerticalActiveState = VerticalNavModeState.ALTV;
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
                    this.setAltitudeAndSlot(AltitudeSlot.SELECTED);
                    this._navModeSelector.queueEvent(NavModeEvent.PATH_ACTIVE);
                    console.log("switched to PATH");
                }
                else if (this._glidepathStatus === GlidepathStatus.GP_ACTIVE) {
                    this.modeSelectorGlidepathStatus = GlidepathStatus.GP_ACTIVE;
                    this.setAltitudeAndSlot(AltitudeSlot.MANAGED);
                    this._navModeSelector.queueEvent(NavModeEvent.GP_ACTIVE);
                    console.log("switched to GP");
                }
                else if (this._glideslopeStatus === GlideslopeStatus.GS_ACTIVE) {
                    this.modeSelectorGlideslopeStatus = GlideslopeStatus.GS_ACTIVE;
                    this.setAltitudeAndSlot(AltitudeSlot.MANAGED);
                    this._navModeSelector.queueEvent(NavModeEvent.GS_ACTIVE);
                    console.log("switched to GS");
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
            case PathInterceptStatus.LEVELED:
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

    followGlideslope() {
        switch(this._pathInterceptStatus) {
            case PathInterceptStatus.NONE:
                this.targetAltitude = undefined;
                this.manageAltitude();
            case PathInterceptStatus.INTERCEPTING:
                console.log("this.glideslopeFpa "+ this.glideslopeFpa);
                this.interceptPath(this.glideslopeFpa);
                break;
            case PathInterceptStatus.INTERCEPTED:
                this.manageAltitude();
                console.log("this.glideslopeFpa "+ this.glideslopeFpa);
                this.commandVerticalSpeed(this.glideslopeFpa, this.trackGlideslope());
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

    /**
     * Shared method to set Alt Slot and Alt Slot values for slots 1 (selected) and 2 (managed).
     * @param {AltitudeSlot} activeSlot is requested active slot.
     * @param {number} managedAltitude is the altitude, if any, requested for slot 2.
     * @param {boolean} forceSlot is to force the slot set in navModeSelector
     */
    setAltitudeAndSlot(activeSlot = AltitudeSlot.SELECTED, managedAltitude = false, forceSlot = false) {

        if (managedAltitude) {
            this.setManagedAltitude(managedAltitude);
        }

        console.log("this.altSlot: " + this.altSlot);
        console.log("activeSlot: " + activeSlot);



        if (this.altSlot !== activeSlot) {
            switch(activeSlot) {
                case AltitudeSlot.SELECTED:
                    this._navModeSelector.queueEvent(NavModeEvent.VNAV_REQUEST_SLOT_1);
                    if (forceSlot) {
                        console.log("forcing alt slot 1");
                        this._navModeSelector.handleVnavRequestSlot1(true);
                    }
                    break;
                case AltitudeSlot.MANAGED:
                    this._navModeSelector.queueEvent(NavModeEvent.VNAV_REQUEST_SLOT_2);
                    if (forceSlot) {
                        this._navModeSelector.handleVnavRequestSlot2(true);
                    }
                    break;
                case AltitudeSlot.LOCK:
                    this._navModeSelector.handleVnavRequestSlot3();
                    break;
            }
        }
    }

    checkAndSetManagedAltitude(isClimb = false) {
        if (isClimb) {
            if (this.indicatedAltitude > this.targetAltitude - 1000) {
                this.setAltitudeAndSlot(AltitudeSlot.MANAGED, this.targetAltitude);
                return true;
            }
        } else {
            if (this.indicatedAltitude < this.targetAltitude + 500) {
                this.setAltitudeAndSlot(AltitudeSlot.MANAGED, this.targetAltitude);
                return true;
            }
        }
        return false;
    }

    checkAndSetTrackedAltitude(status) {
        switch(status) {
            case ConstraintStatus.OBSERVING_CLIMB:
                if (this.targetAltitude >= this.selectedAltitude) {
                    if (this.currentAltitudeTracking !== AltitudeState.SELECTED) {
                        this.currentAltitudeTracking = AltitudeState.SELECTED;
                        this._navModeSelector.setProperVerticalArmedStates();
                    }
                } else {
                    if (this.currentAltitudeTracking !== AltitudeState.MANAGED) {
                        this.currentAltitudeTracking = AltitudeState.MANAGED;
                        this._navModeSelector.setProperVerticalArmedStates();
                    }
                }
                break;
            case ConstraintStatus.OBSERVING_DESCENT:
            case VnavPathStatus.PATH_ACTIVE:
                if (this.targetAltitude <= this.selectedAltitude) {
                    if (this.currentAltitudeTracking !== AltitudeState.SELECTED) {
                        this.currentAltitudeTracking = AltitudeState.SELECTED;
                        this._navModeSelector.setProperVerticalArmedStates();
                    }
                } else {
                    if (this.currentAltitudeTracking !== AltitudeState.MANAGED) {
                        this.currentAltitudeTracking = AltitudeState.MANAGED;
                        this._navModeSelector.setProperVerticalArmedStates();
                    }
                }
                break;
        }
    }

    observeConstraints() {
        switch(this._constraintStatus) {
            case ConstraintStatus.NONE:
                if (this.constraint.index !== undefined && this.constraint.index >= this._vnav.flightplan.activeWaypointIndex) {
                    this.setConstraintAltitude();
                }
                break;
            case ConstraintStatus.OBSERVING_CLIMB:
                if (this._activeConstraintIndex < this._vnav.flightplan.activeWaypointIndex) {
                    this._constraintStatus = ConstraintStatus.PASSED;
                }
                else if (this.checkAndSetManagedAltitude(true)) {
                    this._constraintStatus = ConstraintStatus.LEVEL_CLIMB;
                    this.setDonut(0);
                } else {
                    this.checkAndSetTrackedAltitude(ConstraintStatus.OBSERVING_CLIMB);
                    this.setDonut(0, true);
                }
                break;
            case ConstraintStatus.LEVEL_CLIMB:
                if (this._activeConstraintIndex < this._vnav.flightplan.activeWaypointIndex) {
                    this._constraintStatus = ConstraintStatus.PASSED;
                }
                else if (this._navModeSelector.currentVerticalActiveState === VerticalNavModeState.ALTVCAP 
                        || this._navModeSelector.currentVerticalActiveState === VerticalNavModeState.ALTV) {
                    if (this.targetAltitude + 100 < this.selectedAltitude) {
                        if (this._navModeSelector.currentArmedVnavState !== VerticalNavModeState.FLC) {
                            this._navModeSelector.currentArmedVnavState = VerticalNavModeState.FLC;
                        }
                    } else {
                        if (this._navModeSelector.currentArmedVnavState === VerticalNavModeState.FLC) {
                            this._navModeSelector.currentArmedVnavState = VerticalNavModeState.NONE;
                        }
                    }
                }
                break;
            case ConstraintStatus.OBSERVING_DESCENT:
                if (this._activeConstraintIndex < this._vnav.flightplan.activeWaypointIndex) {
                    this._constraintStatus = ConstraintStatus.PASSED;
                }
                else if (this.checkAndSetManagedAltitude(false)) {
                    this._constraintStatus = ConstraintStatus.LEVEL_DESCENT;
                    this.setDonut(0);
                } else {
                    this.checkAndSetTrackedAltitude(ConstraintStatus.OBSERVING_DESCENT);
                    this.setDonut(0, true);
                }
                break;
            case ConstraintStatus.LEVEL_DESCENT:
                if (this._activeConstraintIndex < this._vnav.flightplan.activeWaypointIndex) {
                    this._constraintStatus = ConstraintStatus.PASSED;
                }
                break;
            case ConstraintStatus.PASSED:
                this.setDonut(0);
                this._activeConstraintIndex = undefined;
                if (this.constraint.index !== undefined && this.constraint.index >= this._vnav.flightplan.activeWaypointIndex) {
                    if (this.constraint.isClimb) {
                        this._constraintStatus = ConstraintStatus.OBSERVING_CLIMB;
                        this.setConstraintAltitude(true);
                        break;
                    }
                    this._constraintStatus = ConstraintStatus.NONE;
                    break;
                } else {
                    this.currentAltitudeTracking = AltitudeState.SELECTED;
                    console.log("forcing alt slot 2 from: " + this.altSlot);
                    this.setAltitudeAndSlot(AltitudeSlot.SELECTED, 50000, true);
                    console.log("alt slot after setting: " + this.altSlot);
                    if (this.selectedAltitude > this.indicatedAltitude + 100) {
                        this.setConstraintAltitude(true, true);
                    }
                }
                this._constraintStatus = ConstraintStatus.NONE;
                this._navModeSelector.setProperVerticalArmedStates();
                break;
        }
    }

    /**
     * Shared method to set and fly between altitude constraints.
     * @param {boolean} resumeClimb is a flag to resume a climb after a constraint.
     * @param {number} unrestricted is a flag to when there is no next constraint to resume climb to the selected altitude.
     */
    setConstraintAltitude(resumeClimb = false, unrestricted = false) {
        if (resumeClimb && unrestricted) {
            this.targetAltitude = undefined;
            this._navModeSelector.currentVerticalActiveState = VerticalNavModeState.FLC;
            this._navModeSelector.setProperVerticalArmedStates(true);
            this._navModeSelector.engageFlightLevelChange(WTDataStore.get('CJ4_vnavClimbIas', 240));
            this.setAltitudeAndSlot(AltitudeSlot.SELECTED, 0, true);
            this._navModeSelector.setProperVerticalArmedStates;
            return;
        }
        this.targetAltitude = this.constraint.altitude;
        this._activeConstraintIndex = this.constraint.index;

        if (resumeClimb) {
            this._navModeSelector.setProperVerticalArmedStates(true);
            this.setManagedAltitude(50000);
                if (this.selectedAltitude > this.targetAltitude + 100) {
                    this.currentAltitudeTracking = AltitudeState.MANAGED;
                } else {
                    this.currentAltitudeTracking = AltitudeState.SELECTED;
                }
            this._navModeSelector.engageFlightLevelChange(WTDataStore.get('CJ4_vnavClimbIas', 240));
            this._navModeSelector.currentVerticalActiveState = VerticalNavModeState.FLC;
        } 
        else {
            if (this.constraint.isClimb) {
                this._constraintStatus = ConstraintStatus.OBSERVING_CLIMB;
                this.setManagedAltitude(50000);
                if (this.selectedAltitude > this.targetAltitude + 100) {
                    this.currentAltitudeTracking = AltitudeState.MANAGED;
                } else {
                    this.currentAltitudeTracking = AltitudeState.SELECTED;
                }
            } else {
                this._constraintStatus = ConstraintStatus.OBSERVING_DESCENT;
                this.setManagedAltitude();
                if (this.selectedAltitude < this.targetAltitude - 100) {
                    this.currentAltitudeTracking = AltitudeState.MANAGED;
                } else {
                    this.currentAltitudeTracking = AltitudeState.SELECTED;
                }
            }
        }
        this._navModeSelector.setProperVerticalArmedStates();
    }

    setManagedAltitude(altitude = -1000) {
        if (Math.round(this.managedAltitude) != altitude) {
            Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, altitude, true);
        }
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
            if (this._pathInterceptStatus === PathInterceptStatus.LEVELED) {
                newSnowflakeStatus = false;
            } else {
                newSnowflakeStatus = true;
            }
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
PathInterceptStatus.LEVELED = 'LEVELED';

class GlidepathStatus { }
GlidepathStatus.NONE = 'NONE';
GlidepathStatus.GP_CAN_ARM = 'GP_CAN_ARM';
GlidepathStatus.GP_ARMED = 'GP_ARMED';
GlidepathStatus.GP_ACTIVE = 'GP_ACTIVE';

class GlideslopeStatus { }
GlideslopeStatus.NONE = 'NONE';
GlideslopeStatus.GS_CAN_ARM = 'GS_CAN_ARM';
GlideslopeStatus.GS_ARMED = 'GS_ARMED';
GlideslopeStatus.GS_ACTIVE = 'GS_ACTIVE';

class AltitudeSlot { }
AltitudeSlot.SELECTED = 1;
AltitudeSlot.MANAGED = 2;
AltitudeSlot.LOCK = 3;

class ConstraintStatus { }
ConstraintStatus.NONE = 'NONE';
ConstraintStatus.OBSERVING_CLIMB = 'OBSERVING_CLIMB';
ConstraintStatus.OBSERVING_DESCENT = 'OBSERVING_DESCENT';
ConstraintStatus.LEVEL_CLIMB = 'LEVEL_CLIMB';
ConstraintStatus.LEVEL_DESCENT = 'LEVEL_DESCENT';
ConstraintStatus.PASSED = 'PASSED';