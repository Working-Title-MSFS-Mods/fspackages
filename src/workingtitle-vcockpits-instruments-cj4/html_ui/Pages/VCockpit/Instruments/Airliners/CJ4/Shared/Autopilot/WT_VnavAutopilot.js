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
        * The index of the waypoint we are continuing a descent through.
        * @type {number}
        */
        this._continuousIndex = undefined;

        /**
        * The index of the current constraint being observed, if any.
        * @type {number}
        */
        this._activeConstraintIndex = undefined;

        this._altInterceptValues = false;

        this._priorVerticalModeState = undefined;
    }

    get vnavState() {
        return this._vnav._vnavState;
    }

    get distanceToTod() {
        return SimVar.GetSimVarValue("L:WT_CJ4_TOD_REMAINING", "number");
    }

    get groundSpeed() {
        return Math.round(Simplane.getGroundSpeed());
    }

    get verticalSpeed() {
        return Math.round(Simplane.getVerticalSpeed());
    }

    get path() {
        return this._vnav.trackPath();
    }

    get nextPath() {
        return this._vnav.trackPath(true);
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

    get altitudeArmedState() {
        return this._navModeSelector.currentArmedAltitudeState;
    }

    set altitudeArmedState(value) {
        this._navModeSelector.currentArmedAltitudeState = value;
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
        switch (this._navModeSelector.currentAltSlotIndex) {
            case 1:
                return SimAltitudeSlot.SELECTED;
            case 2:
                return SimAltitudeSlot.MANAGED;
            case 3:
                return SimAltitudeSlot.LOCK;
        }
    }

    get vsSlot() {
        return SimVar.GetSimVarValue("AUTOPILOT VS SLOT INDEX", "number");
    }

    set vsSlot(value) {
        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", value);
    }

    get vsSlot2Value() {
        return SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:2", "feet per minute");
    }

    get vsSlot1Value() {
        return SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:1", "feet per minute");
    }

    set vsSlot2Value(value) {
        Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, value);
    }

    set vsSlot3Value(value) {
        Coherent.call("AP_VS_VAR_SET_ENGLISH", 3, value);
    }

    get vsSlot3Value() {
        return SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:3", "feet per minute");
    }

    get selectedAltitude() {
        return Math.floor(this._navModeSelector.selectedAlt1);
    }

    get simAltSet() {
        return this._navModeSelector.selectedAlt2;
    }

    set simAltSet(value) {
        this._navModeSelector.setSimAltitude(2, value);
    }

    get managedAltitude() {
        return this._navModeSelector.managedAltitudeTarget;
    }

    set managedAltitude(value) {
        this._navModeSelector.managedAltitudeTarget = value;
    }

    get indicatedAltitude() {
        return this._vnav.indicatedAltitude;
    }

    get lockedAltitude() {
        return this._navModeSelector.pressureAltitudeTarget;
    }

    get snowflake() {
        let snowflake = SimVar.GetSimVarValue('L:WT_CJ4_SNOWFLAKE', 'number') == 1;
        return snowflake;
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
        let segment = this._vnav._verticalFlightPlanSegments.length - 1;
        if (currentSegmentIndex >= 0) {
            segment = currentSegmentIndex;
        }
        return this._vnav._verticalFlightPlanSegments[segment];
    }

    get navMode() {
        const navMode = this._navModeSelector.lNavModeState;
        const navSource = navMode == LNavModeState.NAV2 ? 2 : navMode == LNavModeState.NAV1 ? 1 : 0;
        return navSource;
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
        return SimVar.GetSimVarValue("NAV RAW GLIDE SLOPE:" + this.navMode, "Degree");
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

        switch (this._vnavPathStatus) {
            case VnavPathStatus.NONE:
                break;
            case VnavPathStatus.PATH_EXISTS:
                if (this.canPathArm()) {
                    console.log("path arm");
                    this._vnavPathStatus = VnavPathStatus.PATH_ARMED;
                } else {
                    this.checkPreselector();
                }
                break;
            case VnavPathStatus.PATH_ARMED:
                if (!this.isVNAVOn) {
                    this._vnavPathStatus = VnavPathStatus.NONE;
                    break;
                }
                if (this.canPathActivate()) {
                    console.log("path activate");
                    this._vnavPathStatus = VnavPathStatus.PATH_ACTIVE;
                    this.verticalMode = VerticalNavModeState.PATH;
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    if (this._glidepathStatus === GlidepathStatus.GP_ACTIVE) {
                        this._glidepathStatus = GlidepathStatus.NONE;
                    }
                }
                if (!this.canPathArm()) {
                    this.setArmedVnavVerticalState(VerticalNavModeState.NONE);
                    this._vnavPathStatus = VnavPathStatus.PATH_EXISTS;
                    break;
                }
                if (this._pathInterceptStatus === PathInterceptStatus.LEVELED) {
                    this.manageAltitude();
                }
                break;
            case VnavPathStatus.PATH_ACTIVE:
                if (!this.isVNAVOn) {
                    this._vnavPathStatus = VnavPathStatus.NONE;
                    break;
                }
                if (this.verticalMode !== VerticalNavModeState.PATH && this._pathInterceptStatus !== PathInterceptStatus.LEVELING
                    && this._pathInterceptStatus !== PathInterceptStatus.LEVELED) {
                    this._vnavPathStatus = VnavPathStatus.NONE;
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    break;
                }
                if (!this.canPathActivate(true) && this._pathInterceptStatus !== PathInterceptStatus.LEVELING && this._pathInterceptStatus !== PathInterceptStatus.LEVELED) {
                    this.setVerticalNavModeState(VerticalNavModeState.PTCH);
                    this._vnavPathStatus = VnavPathStatus.NONE;
                    this.vsSlot = 1;
                    this.currentAltitudeTracking = AltitudeState.SELECTED;
                    this._navModeSelector.engagePitch();
                }
                this.checkAndSetTrackedAltitude(this._vnavPathStatus);
                this.followPath();
                break;
        }

        switch (this._glidepathStatus) {
            case GlidepathStatus.NONE:
                break;
            case GlidepathStatus.GP_CAN_ARM:
                if (this.lateralMode === LateralNavModeState.APPR && this.approachMode === WT_ApproachType.RNAV) {
                    this._glidepathStatus = GlidepathStatus.GP_ARMED;
                    console.log("GP Armed");
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
                }
                break;
            case GlidepathStatus.GP_ACTIVE:
                if (this.lateralMode !== LateralNavModeState.APPR || this.approachMode !== WT_ApproachType.RNAV) {
                    this.cancelGlidepath();
                    break;
                }
                this.followGlidepath();
                break;
        }

        switch (this._glideslopeStatus) {
            case GlideslopeStatus.NONE:
                break;
            case GlideslopeStatus.GS_CAN_ARM:
                if (this.lateralMode === LateralNavModeState.APPR && this.approachMode !== WT_ApproachType.RNAV) {
                    this._glideslopeStatus = GlideslopeStatus.GS_ARMED;
                }
                break;
            case GlideslopeStatus.GS_ARMED:
                if (this.lateralMode !== LateralNavModeState.APPR || this.approachMode !== WT_ApproachType.ILS && this.navMode < 1) {
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
                }
                break;
            case GlideslopeStatus.GS_ACTIVE:
                if (this.lateralMode !== LateralNavModeState.APPR || this.checkGlideslopeStatus(true) === GlideslopeStatus.NONE) {
                    this.cancelGlideslope();
                    break;
                }
                this.setDonut(0);
                this.followGlideslope();
                break;
        }

        switch (this.isVNAVOn) {
            case false:
                if (this._glidepathStatus === GlidepathStatus.GP_ACTIVE || this._glideslopeStatus === GlideslopeStatus.GS_ACTIVE) {
                    break;
                }
                if (this.currentAltitudeTracking === AltitudeState.MANAGED) {
                    this.currentAltitudeTracking = AltitudeState.SELECTED;
                    this._navModeSelector.setProperAltitudeArmedState();
                }
                if (this.donut != 0) {
                    this.setDonut(0);
                }
                break;
            case true:
                if (this._vnavPathStatus !== VnavPathStatus.PATH_ACTIVE) {
                    if (this._vnavPathStatus === VnavPathStatus.PATH_ARMED && this.path.fpa == 0) {
                        break;
                    }
                    this.observeConstraints();
                }
        }
        this.setArmedApproachVerticalState();
        this.setArmedVnavVerticalState();
        this.setSnowflake();
        this.fmsTextValues();
        this.wtAltituteManager();

        if (this._vnavPathStatus !== VnavPathStatus.PATH_ACTIVE && this.distanceToTod > 0.1 && this.vnavState !== VnavState.NONE) {
            const todAlertDistance = AutopilotMath.calculateDescentDistance(this.path.fpa, 250) + (0.017 * this.groundSpeed);
            if (todAlertDistance > this.distanceToTod) {
                MessageService.getInstance().post(FMS_MESSAGE_ID.TOD, () => {
                    return this._vnavPathStatus === VnavPathStatus.PATH_ACTIVE || (todAlertDistance < this.distanceToTod - 0.2) || this.distanceToTod < 0.1;
                }, () => {
                    const todBlinkDistance = AutopilotMath.calculateDescentDistance(this.path.fpa, 250) + (0.0014 * this.groundSpeed);
                    return todBlinkDistance > this.distanceToTod;
                });
            }
        }
    }

    setArmedApproachVerticalState() {
        if (this._glidepathStatus === GlidepathStatus.GP_ARMED) {
            this._navModeSelector.setArmedApproachVerticalState(VerticalNavModeState.GP);
        }
        else if (this._glideslopeStatus === GlideslopeStatus.GS_ARMED) {
            this._navModeSelector.setArmedApproachVerticalState(VerticalNavModeState.GS);
        }
        else {
            if (this._navModeSelector.currentArmedApproachVerticalState !== VerticalNavModeState.NONE) {
                this._navModeSelector.setArmedApproachVerticalState();
            }
        }
    }

    setArmedVnavVerticalState(nopath = false) {
        if (nopath === VerticalNavModeState.NOPATH) {
            this._navModeSelector.setArmedVnavState(VerticalNavModeState.NOPATH);
        }
        else if (this._vnavPathStatus === VnavPathStatus.PATH_ARMED) {
            this._navModeSelector.setArmedVnavState(VerticalNavModeState.PATH);
        }
        else {
            if (this._navModeSelector.currentArmedVnavState === VerticalNavModeState.PATH) {
                this._navModeSelector.setArmedVnavState();
            }
            if (this._navModeSelector.currentArmedVnavState === VerticalNavModeState.FLC && 
                    this._constraintStatus !== ConstraintStatus.LEVEL_CLIMB && this._constraintStatus !== ConstraintStatus.PASSED) {
                this._navModeSelector.setArmedVnavState();
            }
            if (this._navModeSelector.currentArmedVnavState === VerticalNavModeState.NOPATH && this._vnavPathStatus !== VnavPathStatus.PATH_EXISTS) {
                this._navModeSelector.setArmedVnavState();
            }
        }
    }

    canPathArm() {
        switch (this.isVNAVOn) {
            case false:
                break;
            case true:
                if (this._pathInterceptStatus === PathInterceptStatus.LEVELED || this._pathInterceptStatus === PathInterceptStatus.LEVELING 
                        || this.verticalMode === VerticalNavModeState.ALTVCAP || this.verticalMode === VerticalNavModeState.ALTSCAP) {
                    break;
                }
                if (this.path.fpa !== undefined && this.path.fpa == 0 && this.nextPath.fpa !== undefined && this.nextPath.fpa != 0) {
                    if (this.nextPath.deviation <= 1000 && this.selectedAltitude < this.indicatedAltitude - 100) {
                        return true;
                    }
                }
                if (this.firstPossibleDescentIndex && this._vnav.flightplan.activeWaypointIndex >= this.firstPossibleDescentIndex) {
                    const distance = this._vnav.getDistanceToTarget();
                    const altitudeDifference = this.indicatedAltitude - this._vnav.getTargetAltitude();
                    const requiredFpa = AutopilotMath.calculateFPA(altitudeDifference, distance);
                    const reqVs = AutopilotMath.calculateVerticaSpeed(requiredFpa, this.groundSpeed);
                    if (this.path.deviation <= 1000 && altitudeDifference > 100 && this.distanceToTod < 20
                        && this.selectedAltitude < this.indicatedAltitude - 100 && (this.selectedAltitude < this.lockedAltitude - 100 || this.lockedAltitude === undefined)) {
                        return true;
                    } else if (this.path.deviation > 1000 && this.selectedAltitude < this.indicatedAltitude - 100) {
                        if (this.verticalSpeed < reqVs) {
                            return true;
                        } else {
                            if (this._navModeSelector.currentArmedVnavState !== VerticalNavModeState.NOPATH) {
                                this.setArmedVnavVerticalState(VerticalNavModeState.NOPATH);
                            }
                        }
                    }
                }
        }
        return false;
    }

    canPathActivate(alreadyActive = false) {
        if (!alreadyActive) {
            const gsBasedDeviation = -1 * (((this.groundSpeed && this.groundSpeed > 100 ? this.groundSpeed : 200) * (4 / 11)) + (750/11));
            if (this.path.fpa != 0 && this.path.deviation < 1000 && this.path.deviation > gsBasedDeviation) {
                return true;
            }
            return false;
        } else {
            if (this.path.fpa != 0 && this.path.deviation < 1000 && this.path.deviation > -1000) {
                return true;
            }
            return false;
        }
        
    }

    canGlidepathActivate() {
        const gsBasedDeviation = -1 * (((this.groundSpeed && this.groundSpeed > 100 ? this.groundSpeed : 200) * (4 / 11)) + (750/11));
        if (this.glidepath.deviation < 100 && this.glidepath.deviation > gsBasedDeviation) {
            return true;
        }
        return false;
    }

    canGlideslopeActivate() {
        const gsi = SimVar.GetSimVarValue("NAV GSI:" + this.navMode, "number");
        if (gsi < 50 && gsi > -50 && gsi != 0) {
            return true;
        }
        return false;
    }

    cancelGlidepath() {
        this._glidepathStatus = GlidepathStatus.NONE;
        this.setArmedApproachVerticalState(this._glidepathStatus);
        this.snowflake = false;
    }

    cancelGlideslope() {
        this._glideslopeStatus = GlideslopeStatus.NONE;
        this.setArmedApproachVerticalState(this._glideslopeStatus);
        this._navModeSelector.currentArmedVnavState = VerticalNavModeState.NONE;
    }

    checkVnavState() {
        switch (this.vnavState) {
            case this._vnavState:
                if ((this._vnavState === VnavState.PATH || this._vnavState === VnavState.DIRECT) && this._vnavPathStatus === VnavPathStatus.NONE) {
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
        switch (this._glidepathStatus) {
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

    checkGlideslopeStatus(activeNavIndex = false) {
        let navIndex = this.navMode == 0 ? 1 : this.navMode;
        if (activeNavIndex) {
            navIndex = this.navMode;
        }
        const signal = SimVar.GetSimVarValue("NAV HAS NAV:" + navIndex, "bool") !== 0 ? true : false;
        const isIls = signal ? SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + navIndex, "bool") !== 0 : false;
        const gs = isIls ? SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:" + navIndex, "bool") !== 0 : false;
        switch (this._glideslopeStatus) {
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
        const gslla = SimVar.GetSimVarValue("NAV GS LATLONALT:" + this.navMode, "latlonalt");
        const distance = Avionics.Utils.computeDistance(this._vnav._currPos, gslla);
        let correctedgsi = gsi;
        if (distance) {
            correctedgsi = gsi * Math.max(Math.min(distance, 10), 1);
        }

        return correctedgsi;
    }

    setVerticalNavModeState(state) {
        if (this._navModeSelector.currentVerticalActiveState !== state) {
            this._navModeSelector.currentVerticalActiveState = state;
        }
    }

    manageAltitude() {
        switch (this._pathInterceptStatus) {
            case PathInterceptStatus.NONE:
            case PathInterceptStatus.INTERCEPTING:
                this.managedAltitude = this.path.fpta;
            case PathInterceptStatus.INTERCEPTED:
                if (this._glidepathStatus === GlidepathStatus.GP_ACTIVE) {
                    this.setVerticalNavModeState(VerticalNavModeState.GP);
                    this._navModeSelector.setProperAltitudeArmedState();
                    if (this.currentAltitudeTracking !== AltitudeState.NONE) {
                        this.currentAltitudeTracking = AltitudeState.NONE;
                    }
                }
                else if (this._glideslopeStatus === GlideslopeStatus.GS_ACTIVE) {
                    this.setVerticalNavModeState(VerticalNavModeState.GS);
                    this._navModeSelector.setProperAltitudeArmedState();
                    if (this.currentAltitudeTracking !== AltitudeState.NONE) {
                        this.currentAltitudeTracking = AltitudeState.NONE;
                    }
                }
                else if (this._vnavPathStatus === VnavPathStatus.PATH_ACTIVE) {
                    if (this.indicatedAltitude < this.managedAltitude + 1000 && this.path.endsLevel) {
                        this._pathInterceptStatus = PathInterceptStatus.LEVELING;
                        break;
                    }
                    else if (!this.path.endsLevel && this._pathInterceptStatus === PathInterceptStatus.INTERCEPTED
                        && this.indicatedAltitude < this.managedAltitude + 1000 && this.nextPath && this.nextPath.fpta) {
                        this._pathInterceptStatus = PathInterceptStatus.CONTINUOUS;
                        this._continuousIndex = this._vnav.flightplan.activeWaypointIndex;
                    } else {
                        this.setVerticalNavModeState(VerticalNavModeState.PATH);
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
                break;
            case PathInterceptStatus.LEVELING:
                if (this._navModeSelector.isAltitudeLocked) {
                    this._pathInterceptStatus = PathInterceptStatus.LEVELED;
                    console.log("setting PathInterceptStatus.LEVELED");
                    this.setDonut(0);
                } else if (this.path.fpta && this.managedAltitude !== this.path.fpta) {
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    this._navModeSelector.currentArmedVnavState = VerticalNavModeState.PATH;
                    this._vnavPathStatus = VnavPathStatus.NONE;
                    console.log("setting PathInterceptStatus.NONE");
                }
                break;
            case PathInterceptStatus.LEVELED:
                if (!this.path.fpta || this.managedAltitude !== this.path.fpta || this.vnavState === VnavState.NONE || this.path.fpa == 0) {
                    this._pathInterceptStatus = PathInterceptStatus.NONE;
                    this._vnavPathStatus = VnavPathStatus.NONE;
                    this._navModeSelector.currentArmedVnavState = VerticalNavModeState.NONE;
                    this.vsSlot2Value = 0;
                    console.log("RESETTING FROM LEVELED");
                }
                break;
        }
    }

    interceptPath(fpa) {
        //console.log("interceptPath - status: " + this._pathInterceptStatus);
        switch (this._pathInterceptStatus) {
            case PathInterceptStatus.NONE:
                const desiredVerticalSpeed = AutopilotMath.calculateVerticaSpeed(fpa, this.groundSpeed);
                this.setDonut(desiredVerticalSpeed);
                const deltaVS = desiredVerticalSpeed - this.verticalSpeed;
                const intercept = {
                    verticalSpeed: 100 * Math.floor(this.verticalSpeed / 100),
                    increments: Math.floor(deltaVS / 100)
                };
                this._pathInterceptValues = intercept;
                this._pathInterceptStatus = PathInterceptStatus.INTERCEPTING;
                this.vsSlot2Value = intercept.verticalSpeed;
                this.vsSlot = 2;
                if (this._vnavPathStatus === VnavPathStatus.PATH_ACTIVE) {
                    this.modeSelectorPathStatus = VnavPathStatus.PATH_ACTIVE;
                    this._navModeSelector.queueEvent(NavModeEvent.PATH_ACTIVE);
                    console.log("switched to PATH");
                }
                else if (this._glidepathStatus === GlidepathStatus.GP_ACTIVE) {
                    this.modeSelectorGlidepathStatus = GlidepathStatus.GP_ACTIVE;
                    this.currentAltitudeTracking = AltitudeState.NONE;
                    this._navModeSelector.queueEvent(NavModeEvent.GP_ACTIVE);
                    console.log("switched to GP");
                }
                else if (this._glideslopeStatus === GlideslopeStatus.GS_ACTIVE) {
                    this.modeSelectorGlideslopeStatus = GlideslopeStatus.GS_ACTIVE;
                    this.currentAltitudeTracking = AltitudeState.NONE;
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
        switch (this._pathInterceptStatus) {
            case PathInterceptStatus.NONE:
                console.log("starting intercept");
                this.managedAltitude = this.path.fpta;
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
        switch (this._pathInterceptStatus) {
            case PathInterceptStatus.NONE:
                this.managedAltitude = this.glidepath.fpta;
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
        switch (this._pathInterceptStatus) {
            case PathInterceptStatus.NONE:
                this.managedAltitude = undefined;
                this.manageAltitude();
            case PathInterceptStatus.INTERCEPTING:
                this.interceptPath(this.glideslopeFpa);
                break;
            case PathInterceptStatus.INTERCEPTED:
                this.manageAltitude();
                this.commandVerticalSpeed(this.glideslopeFpa, this.trackGlideslope());
        }
    }

    commandVerticalSpeed(fpa, deviation) {
        let setVerticalSpeed = 0;
        const desiredVerticalSpeed = AutopilotMath.calculateVerticaSpeed(fpa, this.groundSpeed);
        const maxVerticalSpeed = -1 * AutopilotMath.calculateVerticaSpeed(6, this.groundSpeed);
        const maxCorrection = maxVerticalSpeed + desiredVerticalSpeed;
        if (this._glideslopeStatus !== GlideslopeStatus.GS_ACTIVE) {
            this.setDonut(desiredVerticalSpeed);
        }

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
     * @param {SimAltitudeSlot} activeSlot is requested active slot.
     * @param {number} altitude is the altitude, if any, requested for slot 2.
     * @param {boolean} forceSlot is to force the slot set in navModeSelector
     */
    setAltitudeAndSlot(activeSlot = SimAltitudeSlot.MANAGED, altitude = false, forceSlot = false) {
        if (altitude) {
            this._navModeSelector.setSimAltitude(SimAltitudeSlot.MANAGED, altitude);
        }
        if (this.altSlot !== activeSlot) {
            switch (activeSlot) {
                case SimAltitudeSlot.SELECTED:
                    if (forceSlot) {
                        console.log("forcing alt slot 1");
                        this._navModeSelector.handleVnavRequestSlot1(true);
                    } else {
                        this._navModeSelector.queueEvent(NavModeEvent.VNAV_REQUEST_SLOT_1);
                    }
                    break;
                case SimAltitudeSlot.MANAGED:
                    if (forceSlot) {
                        this._navModeSelector.handleVnavRequestSlot2(true);
                    } else {
                        this._navModeSelector.queueEvent(NavModeEvent.VNAV_REQUEST_SLOT_2);
                    }
                    break;
                case SimAltitudeSlot.LOCK:
                    if (forceSlot) {
                        this._navModeSelector.handleVnavRequestSlot3(true);
                    } else {
                        this._navModeSelector.handleVnavRequestSlot3();
                    }
                    break;
            }
        }
    }

    checkAndSetManagedAltitude(isClimb = false) {
        if (this.managedAltitude !== this.constraint.altitude) {
            this.managedAltitude = this.constraint.altitude;
        }
        if (isClimb) {
            if (this.indicatedAltitude > this.managedAltitude - 1000) {
                return true;
            }
        } else {
            if (this.indicatedAltitude < this.managedAltitude + 500) {
                return true;
            }
        }
        return false;
    }

    checkAndSetTrackedAltitude(status) {
        switch (status) {
            case ConstraintStatus.OBSERVING_CLIMB:
                if (this.managedAltitude >= this.selectedAltitude) {
                    if (this.currentAltitudeTracking !== AltitudeState.SELECTED) {
                        this.currentAltitudeTracking = AltitudeState.SELECTED;
                    }
                } else {
                    if (this.currentAltitudeTracking !== AltitudeState.MANAGED) {
                        this.currentAltitudeTracking = AltitudeState.MANAGED;
                    }
                }
                break;
            case ConstraintStatus.OBSERVING_DESCENT:
            case VnavPathStatus.PATH_ACTIVE:
                if (this.managedAltitude <= this.selectedAltitude) {
                    if (this.currentAltitudeTracking !== AltitudeState.SELECTED) {
                        this.currentAltitudeTracking = AltitudeState.SELECTED;
                    }
                } else {
                    if (this.currentAltitudeTracking !== AltitudeState.MANAGED) {
                        this.currentAltitudeTracking = AltitudeState.MANAGED;
                    }
                }
                break;
            default:
                this.currentAltitudeTracking = AltitudeState.SELECTED;
        }
    }

    observeConstraints() {
        switch (this._constraintStatus) {
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
                    if (this.managedAltitude + 100 < this.selectedAltitude) {
                        this._navModeSelector.setArmedVnavState(VerticalNavModeState.FLC);
                    } else {
                        if (this._navModeSelector.currentArmedVnavState === VerticalNavModeState.FLC) {
                            this._navModeSelector.setArmedVnavState();
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
                    } else if (this._navModeSelector.currentArmedVnavState === VerticalNavModeState.FLC && this.constraint.isClimb === false && this.selectedAltitude > this.indicatedAltitude + 500) {
                        this.setConstraintAltitude(true, true);
                    }
                    this._constraintStatus = ConstraintStatus.NONE;
                    break;
                } else {
                    this.currentAltitudeTracking = AltitudeState.SELECTED;
                    if (this.selectedAltitude > this.indicatedAltitude + 100) {
                        this.setConstraintAltitude(true, true);
                    }
                }
                this._constraintStatus = ConstraintStatus.NONE;
                this._navModeSelector.setProperAltitudeArmedState();
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
            this.managedAltitude = undefined;
            this._navModeSelector.currentVerticalActiveState = VerticalNavModeState.FLC;
            this._navModeSelector.engageFlightLevelChange(WTDataStore.get('CJ4_vnavClimbIas', 240));
            this.currentAltitudeTracking = AltitudeState.SELECTED;
            this._navModeSelector.setProperAltitudeArmedState();
            return;
        }
        this.managedAltitude = this.constraint.altitude;
        this._activeConstraintIndex = this.constraint.index;

        if (resumeClimb) {
            if (this.selectedAltitude > this.managedAltitude + 100) {
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
                if (this.selectedAltitude > this.managedAltitude + 100) {
                    this.currentAltitudeTracking = AltitudeState.MANAGED;
                } else {
                    this.currentAltitudeTracking = AltitudeState.SELECTED;
                }
            }
            else if (this.indicatedAltitude + 100 < this.selectedAltitude) {
                this.currentAltitudeTracking = AltitudeState.SELECTED;
                this._constraintStatus = ConstraintStatus.NONE;
            }
            else {
                this._constraintStatus = ConstraintStatus.OBSERVING_DESCENT;
                if (this.selectedAltitude < this.managedAltitude - 100) {
                    this.currentAltitudeTracking = AltitudeState.MANAGED;
                } else {
                    this.currentAltitudeTracking = AltitudeState.SELECTED;
                }
            }
        }
        this._navModeSelector.setProperAltitudeArmedState();
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
        const isPathActive = this._vnavPathStatus === VnavPathStatus.PATH_EXISTS || this._vnavPathStatus === VnavPathStatus.PATH_ARMED || this._vnavPathStatus === VnavPathStatus.PATH_ACTIVE ? true : false;
        let newSnowflakeStatus = false;
        if (isGlidepathActive || isPathActive) {
            if (this._pathInterceptStatus === PathInterceptStatus.LEVELED) {
                newSnowflakeStatus = false;
            } else if (this.path.deviation && Math.abs(this.path.deviation) < 1000) {
                newSnowflakeStatus = true;
            } else {
                newSnowflakeStatus = false;
            }
        }
        if (isGlidepathActive) {
            newSnowflakeStatus = true;
        }
        if (this.snowflake !== newSnowflakeStatus) {
            this.snowflake = newSnowflakeStatus;
        }
        if (this.snowflake) {
            if (isGlidepathActive) {
                SimVar.SetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet", this.glidepath.deviation);
            }
            else if (this.path.fpa == 0) {
                console.log("this.path.fpa == 0 ; this.nextPath.deviation: " + this.nextPath.deviation);
                SimVar.SetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet", this.nextPath.deviation);
            } else {
                SimVar.SetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet", this.path.deviation);
            }
        } else {
            if (SimVar.GetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet") != 0) {
                SimVar.SetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet", 0);
            }
        }
    }

    setDonut(donutValue = 0, calculate = false) {
        if (calculate) {
            if (this.constraint.index !== undefined && this._glideslopeStatus !== GlideslopeStatus.GS_ACTIVE && this.distanceToTod < 50) {
                const index = this.constraint.index;
                const lDistance = this._vnav.allWaypoints[index].cumulativeDistanceInFP - this._vnav._currentDistanceInFP;
                const vDistance = this.indicatedAltitude - this.managedAltitude;
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
        if (this.distanceToTod < approachingTodDistance && this.distanceToTod > 0 && this.selectedAltitude >= this._vnav.indicatedAltitude - 50) {
            MessageService.getInstance().post(FMS_MESSAGE_ID.CHK_ALT_SEL, () => {
                return (this.selectedAltitude + 100) < this._vnav.indicatedAltitude || !this.isVNAVOn;
            });
        }
    }

    isClimb() {
        switch(this.verticalMode) {
            case VerticalNavModeState.VS:
                if (this.vsSlot1Value > 0) {
                    return true;
                }
                break;
            case VerticalNavModeState.FLC:
                if (this.selectedAltitude > this.indicatedAltitude) {
                    return true;
                }
                break;
            case VerticalNavModeState.PTCH:
            case VerticalNavModeState.ALTSCAP:
            case VerticalNavModeState.ALTVCAP:
            case VerticalNavModeState.ALTCAP:
                if (this.verticalSpeed > 0) {
                    return true;
                }
                break;
            case VerticalNavModeState.PATH:
            case VerticalNavModeState.GP:
            case VerticalNavModeState.GS:
                return false;
            case VerticalNavModeState.GA:
            case VerticalNavModeState.TO:
                return true;
        }
        return false;
    }

    altCapArm(isClimb) {
        const managedAltitude = this.isVNAVOn ? this.managedAltitude : false;
        // console.log("managedAltitude " + managedAltitude);
        // console.log("this.currentAltitudeTracking " + this.currentAltitudeTracking);
        let targetAltitude = this.selectedAltitude;
        let mode = AltitudeState.SELECTED;
        if (this.currentAltitudeTracking === AltitudeState.MANAGED && managedAltitude && managedAltitude > 0) {
            targetAltitude = managedAltitude;
            mode = AltitudeState.MANAGED;
        }
        const altCap = {
            altitude: targetAltitude,
            mode: mode
        }
        // console.log("isClimb && this.indicatedAltitude < targetAltitude " + this.indicatedAltitude + " " + targetAltitude);
        // console.log("isClimb " + isClimb);
        // console.log("this.verticalMode " + this.verticalMode);

        switch(this.verticalMode) {
            case VerticalNavModeState.VS:
            case VerticalNavModeState.FLC:
            case VerticalNavModeState.PTCH:
                if (isClimb && this.indicatedAltitude < targetAltitude) {
                    return altCap;
                } else if (!isClimb && this.indicatedAltitude > targetAltitude) {
                    return altCap;
                }
                break;
            case VerticalNavModeState.PATH:
                altCap.mode = this.currentAltitudeTracking;
                altCap.altitude = targetAltitude;
                return altCap;
                break;
            case VerticalNavModeState.GA:
            case VerticalNavModeState.TO:
                if (isClimb && this.indicatedAltitude < targetAltitude) {
                    return altCap;
                }
                break;
            case VerticalNavModeState.ALTCAP:
            case VerticalNavModeState.ALTSCAP:
            case VerticalNavModeState.ALTVCAP:
                if (isClimb && this.indicatedAltitude < targetAltitude) {
                    return altCap;
                } else if (!isClimb && this.indicatedAltitude > targetAltitude) {
                    return altCap;
                }
                break;
        }
        return false;
    }

    holdAltitude(targetAltitude = this._navModeSelector.pressureAltitudeTarget) {
        if (this.vsSlot != 2) {
            this.vsSlot = 2;
        }
        this._navModeSelector.checkVerticalSpeedActive();
        const deltaAlt = this.indicatedAltitude - targetAltitude;
        let setVerticalSpeed = 0;
        const max = 1000;
        const correction = Math.min(Math.max((10 * Math.abs(deltaAlt)), 100), max);
        if (deltaAlt > 10) {
            setVerticalSpeed = 0 - correction;
        }
        else if (deltaAlt < -10) {
            setVerticalSpeed = correction;
        }
        else {
            setVerticalSpeed = 0;
        }
        setVerticalSpeed = 100 * Math.ceil(setVerticalSpeed / 100);
        this.vsSlot2Value = setVerticalSpeed;
    }

    captureAltitude(altitude) {
        if (this._altInterceptValues === false) {
            const values = {
                verticalSpeed: undefined,
                altitude: altitude
            };
            values.verticalSpeed = this.verticalSpeed > 0 ? 100 * Math.floor(this.verticalSpeed / 100) : 100 * Math.ceil(this.verticalSpeed / 100);
            this._altInterceptValues = values;
            this._lastUpdateTime = undefined;
            this._navModeSelector.engageVerticalSpeed(2, this._altInterceptValues.verticalSpeed, false);
        }
        if (this.vsSlot != 2) {
            this.vsSlot = 2;
        }
        this._navModeSelector.checkVerticalSpeedActive();
        let now = performance.now();
        let dt = this._lastUpdateTime != undefined ? now - this._lastUpdateTime : 251;
        this._lastUpdateTime = now;
        
        if (dt > 250) {
            const deltaAlt = this.indicatedAltitude - altitude;
            let setVerticalSpeed = 0;
            const max = Math.abs(this._altInterceptValues.verticalSpeed);
            const correction = Math.min(Math.max((10 * Math.abs(deltaAlt)), 500), max);
            if (deltaAlt > 10) {
                setVerticalSpeed = 0 - correction;
            }
            else if (deltaAlt < -10) {
                setVerticalSpeed = correction;
            }
            else {
                setVerticalSpeed = 0;
            }
            setVerticalSpeed = 100 * Math.ceil(setVerticalSpeed / 100);
            this.vsSlot2Value = setVerticalSpeed;
            if (Math.abs(deltaAlt) < 20) {
                this._altInterceptValues = false;
                this._lastUpdateTime = undefined;
                this._navModeSelector.pressureAltitudeTarget = altitude;
                switch(this.verticalMode) {
                    case VerticalNavModeState.ALTCAP:
                        this.verticalMode = VerticalNavModeState.ALT;
                        break;
                    case VerticalNavModeState.ALTSCAP:
                        this.verticalMode = VerticalNavModeState.ALTS;
                        break;
                    case VerticalNavModeState.ALTVCAP:
                        this.verticalMode = VerticalNavModeState.ALTV;
                        break;
                }
            }
        }
    }

    storePriorVerticalModeState(mode, altitude) {
        const priorVerticalModeState = {
            mode: mode,
            value: undefined,
            altitude: altitude
        };
        switch(mode) {
            case VerticalNavModeState.VS:
                priorVerticalModeState.value = this.vsSlot1Value;
                break;
            case VerticalNavModeState.FLC:
                if (Simplane.getAutoPilotMachModeActive()) {
                    priorVerticalModeState.value = Simplane.getAutoPilotMachHoldValue();
                } else {
                    priorVerticalModeState.value = Simplane.getAutoPilotAirspeedHoldValue();
                }
                break;
            case VerticalNavModeState.PTCH:
                priorVerticalModeState.value = -1;
                break;
            case VerticalNavModeState.PATH:
                priorVerticalModeState.mode = VerticalNavModeState.PTCH;
                priorVerticalModeState.value = -1;
                break;
        }
        this._priorVerticalModeState = priorVerticalModeState;
    }

    setPriorVerticalModeState() {
        if (this._priorVerticalModeState === undefined || this._priorVerticalModeState.mode === undefined) {
            this.verticalMode = VerticalNavModeState.PTCH;
            this._navModeSelector.engagePitch;
            return;
        } else {
            switch(this._priorVerticalModeState.mode) {
                case VerticalNavModeState.VS:
                    this.verticalMode = VerticalNavModeState.VS;
                    this._navModeSelector.engageVerticalSpeed(1, this._priorVerticalModeState.value, true);
                    break;
                case VerticalNavModeState.FLC:
                    this.verticalMode = VerticalNavModeState.FLC;
                    this._navModeSelector.engageFlightLevelChange(this._priorVerticalModeState.value);
                    break;
                case VerticalNavModeState.PTCH:
                case VerticalNavModeState.PATH:
                    this.verticalMode = VerticalNavModeState.PTCH;
                    this._navModeSelector.engagePitch();
                    break;
            }
        }
    }

    /**
     * Working Title custom altitude manager that tracks selected/managed/locked status and handles intercepts.
     */
    wtAltituteManager() {
        if (this.altSlot !== SimAltitudeSlot.MANAGED) {
            this._navModeSelector.setSimAltSlot(2);
        }
        const isClimb = this.isClimb();
        if (isClimb === true) {
            if (this.simAltSet != 60000) {
                this.simAltSet = 60000;
            }
        } else {
            if (this.simAltSet != -5000) {
                this.simAltSet = -5000;
            }
        }
        switch(this.verticalMode) {
            case VerticalNavModeState.ALT:
            case VerticalNavModeState.ALTS:
            case VerticalNavModeState.ALTV:
                if (this._altInterceptValues !== false) {
                    this._altInterceptValues = false;
                }
                if (this._priorVerticalModeState !== undefined) {
                    this._priorVerticalModeState = undefined;
                }
                if (this.altitudeArmedState !== VerticalNavModeState.NONE) {
                    this.altitudeArmedState = VerticalNavModeState.NONE;
                }
                if (!this._navModeSelector.isAltitudeLocked) {
                    SimVar.SetSimVarValue("L:WT_CJ4_ALT_HOLD", "number", 1);
                }
                this.holdAltitude();
                break;
            case VerticalNavModeState.ALTCAP:
            case VerticalNavModeState.ALTSCAP:
            case VerticalNavModeState.ALTVCAP:
                if (this.verticalMode === VerticalNavModeState.ALTSCAP && this._priorVerticalModeState.altitude !== this.selectedAltitude) {
                    console.log("altS cap booken");
                    this.setPriorVerticalModeState();
                    break;
                } else if (this.verticalMode === VerticalNavModeState.ALTVCAP && this._priorVerticalModeState.altitude !== this.managedAltitude) {
                    console.log("altV cap booken");
                    this.setPriorVerticalModeState();
                    break;
                }
                if (this.altitudeArmedState !== VerticalNavModeState.NONE) {
                    this.altitudeArmedState = VerticalNavModeState.NONE;
                }
                if (this._navModeSelector.isAltitudeLocked) {
                    SimVar.SetSimVarValue("L:WT_CJ4_ALT_HOLD", "number", 0);
                }
                this.captureAltitude(this._priorVerticalModeState.altitude);
                break;
            case VerticalNavModeState.VS:
            case VerticalNavModeState.FLC:
            case VerticalNavModeState.PTCH:
            case VerticalNavModeState.TO:
            case VerticalNavModeState.GA:
            case VerticalNavModeState.PATH:
                if (this._navModeSelector.pressureAltitudeTarget !== undefined) {
                    this._navModeSelector.pressureAltitudeTarget = undefined;
                }
                if (this._navModeSelector.isAltitudeLocked) {
                    SimVar.SetSimVarValue("L:WT_CJ4_ALT_HOLD", "number", 0);
                }
                if (this._altInterceptValues !== false) {
                    this._altInterceptValues = false;
                }
                //const interceptMargin = Math.abs(this.verticalSpeed) / 100;
                //const interceptMargin = 1.2 * ((Math.abs(this.verticalSpeed) / 2) * ((Math.abs(this.verticalSpeed) / 100)/60));
                //const temp = 60 * SimVar.GetSimVarValue("VELOCITY WORLD Y", "feet per second");
                const interceptMargin = 0.15 * Math.abs(this.verticalSpeed);
                const altCaptureArmed = this.altCapArm(isClimb);
                if (altCaptureArmed) {
                    switch(altCaptureArmed.mode) {
                        case AltitudeState.SELECTED:
                            if (this.altitudeArmedState !== VerticalNavModeState.ALTS) {
                                this.altitudeArmedState = VerticalNavModeState.ALTS;
                            }
                            if (isClimb && Math.abs(altCaptureArmed.altitude - this.indicatedAltitude) < interceptMargin) {
                                this.storePriorVerticalModeState(this.verticalMode, altCaptureArmed.altitude);
                                this.verticalMode = VerticalNavModeState.ALTSCAP
                            } else if (!isClimb && Math.abs(this.indicatedAltitude - altCaptureArmed.altitude) < interceptMargin) {
                                this.storePriorVerticalModeState(this.verticalMode, altCaptureArmed.altitude);
                                this.verticalMode = VerticalNavModeState.ALTSCAP
                            }
                            break;
                        case AltitudeState.MANAGED:
                            if (this.altitudeArmedState !== VerticalNavModeState.ALTV) {
                                this.altitudeArmedState = VerticalNavModeState.ALTV;
                            }
                            if (this.verticalMode === VerticalNavModeState.PATH && this.PathInterceptStatus === PathInterceptStatus.CONTINUOUS) {
                                break;
                            }
                            if (isClimb && Math.abs(altCaptureArmed.altitude - this.indicatedAltitude) < interceptMargin) {
                                this.storePriorVerticalModeState(this.verticalMode, altCaptureArmed.altitude);
                                this.verticalMode = VerticalNavModeState.ALTVCAP
                            } else if (!isClimb && Math.abs(this.indicatedAltitude - altCaptureArmed.altitude) < interceptMargin) {
                                this.storePriorVerticalModeState(this.verticalMode, altCaptureArmed.altitude);
                                this.verticalMode = VerticalNavModeState.ALTVCAP
                            }
                            break;
                    }
                } else {
                    this.altitudeArmedState = VerticalNavModeState.NONE;
                }
                break;
            case VerticalNavModeState.GS:
            case VerticalNavModeState.GP:
                this.altitudeArmedState = VerticalNavModeState.NONE;
                break;
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

    buildConstraintText(waypoint) {
        let constraintText = undefined;
        switch (waypoint.legAltitudeDescription) {
            case 1:
                constraintText = Math.floor(waypoint.legAltitude1).toFixed(0);
                break;
            case 2:
                constraintText = Math.floor(waypoint.legAltitude1).toFixed(0) + "A";
                break;
            case 3:
                constraintText = Math.floor(waypoint.legAltitude1).toFixed(0) + "B";
                break;
            case 4:
                constraintText = Math.floor(waypoint.legAltitude2).toFixed(0) + "A" + Math.floor(waypoint.legAltitude1).toFixed(0) + "B";
                break;
        }
        return constraintText;
    }

    fmsTextValues() {
        //Datastore for VNAV Window in FMS TEXT
        let vnavWindowData = {};
        const vnavstate = this.checkVnavState();
        let vnavDirectTo = (vnavstate == VnavState.DIRECT) ? true : false;
        let constraintIndex = undefined;
        let isClimb = false;
        if (vnavstate == VnavState.PATH || vnavstate == VnavState.DIRECT) {
            if (this._vnav._activeConstraint.index === undefined && this.distanceToTod && this.distanceToTod > 0) {
                for (let i = this._vnav._firstPossibleDescentIndex; i < this._vnav.allWaypoints.length; i++) {
                    if (this._vnav._verticalFlightPlan[i].hasConstraint) {
                        constraintIndex = this._vnav._verticalFlightPlan[i].indexInFlightPlan;
                        break;
                    }
                }
            } else {
                constraintIndex = this._vnav._activeConstraint.index;
                isClimb = this._vnav._activeConstraint.isClimb;
            }

            vnavWindowData = {
                toddistance: this.distanceToTod,
                fpa: this.path.fpa,
                descentrate: this.donut,
                constraintreal: constraintIndex ? this._vnav.allWaypoints[constraintIndex].ident : "",
                constraintrealaltitude: constraintIndex ? this.buildConstraintText(this._vnav.allWaypoints[constraintIndex]) : "",
                fptaDistance: constraintIndex ? this._vnav.allWaypoints[constraintIndex].cumulativeDistanceInFP - this._vnav._currentDistanceInFP : "",
                isdirect: vnavDirectTo,
                isclimb: isClimb
            };
        }
        else if (this._vnav._currentFlightSegment.type === SegmentType.Departure && this._vnav._activeConstraint && this._vnav._activeConstraint.index) {
            constraintIndex = this._vnav._activeConstraint.index;
            isClimb = true;
            vnavWindowData = {
                toddistance: undefined,
                fpa: 0,
                descentrate: 0,
                constraintreal: constraintIndex ? this._vnav.allWaypoints[constraintIndex].ident : "",
                constraintrealaltitude: constraintIndex ? this.buildConstraintText(this._vnav.allWaypoints[constraintIndex]) : "",
                fptaDistance: constraintIndex ? this._vnav.allWaypoints[constraintIndex].cumulativeDistanceInFP - this._vnav._currentDistanceInFP : "",
                isdirect: false,
                isclimb: isClimb
            };
        }
        localStorage.setItem("VNAVWINDOWDATA", JSON.stringify(vnavWindowData));
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

class SimAltitudeSlot { }
SimAltitudeSlot.SELECTED = 1;
SimAltitudeSlot.MANAGED = 2;
SimAltitudeSlot.LOCK = 3;

class ConstraintStatus { }
ConstraintStatus.NONE = 'NONE';
ConstraintStatus.OBSERVING_CLIMB = 'OBSERVING_CLIMB';
ConstraintStatus.OBSERVING_DESCENT = 'OBSERVING_DESCENT';
ConstraintStatus.LEVEL_CLIMB = 'LEVEL_CLIMB';
ConstraintStatus.LEVEL_DESCENT = 'LEVEL_DESCENT';
ConstraintStatus.PASSED = 'PASSED';

class AltitudeCaptureStatus { }
AltitudeCaptureStatus.CAPTURING_CLIMB = 'CAPTURING_CLIMB';
AltitudeCaptureStatus.CAPTURING_DESCENT = 'OCAPTURING_DESCENT';
AltitudeCaptureStatus.CAPTURED = 'CAPTURED';
AltitudeCaptureStatus.LEVEL = 'LEVEL';
AltitudeCaptureStatus.WATCHING = 'WATCHING';
