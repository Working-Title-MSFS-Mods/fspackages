class WT_VnavAutopilot {
    constructor(vnav, modeSelector) {
        this._vnav = vnav;
        this._navModeSelector = modeSelector;

        this._vnavType = false;
        this._runPath = false;

        this._vnavTargetAltitude = undefined;
        this._vnavTargetDistance = undefined;
        this._topOfDescent = undefined;
        this._distanceToTod = undefined;
        this._lastVnavTargetAltitude = undefined;
        this._inhibitExecute = false;
        this._lastVerticalMode = undefined;

        this._constraintExists = false;
        this._pathExists = false;
        this._pathArm = false;
        this._pathArmAbove = false;
        this._pathArmFired = false;
        this._pathFromAboveRequiredVs = undefined;
        this._pathActive = false;
        this._pathActivate = false;

        this._indicatedAltitude = undefined;

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
        //We are intercepting the constraint, inhibit execution until we change path conditions
        if (this._pathActive === true && this._navModeSelector.currentVerticalActiveState === VerticalNavModeState.ALTC && this._inhibitExecute !== true) {
            this._inhibitExecute = true;
            SimVar.SetSimVarValue("L:WT_VNAV_PATH_STATUS", "number", 0);
        }

        if (this._vnav._vnavCalculating) {
            this._indicatedAltitude = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");

            //CONSTRAINT DATA
            if (this._vnav._vnavConstraintType) {
                this._constraintExists = true;
            }
            else {
                this._constraintExists = false;
            }

            //PATH DATA
            if (this._vnav._pathCalculating) {
                //FOR EXECUTION ALL WE CARE ABOUT IS WHETHER TO SET A NEW TARGET ALTITUDE AND WHETHER TO MANAGE VS

                //IS THERE A NEW PATH?
                if (this._vnav._newPath) {
                    this._inhibitExecute = false;
                    this._pathArm = false;
                    this._pathArmAbove = false;
                    this._pathActive = false;
                    this._pathActivate = false;
                    this._vnav._newPath = false;
                }

                //CAN PATH ARM?
                if (!this._pathActive) {
                    const verticalMode = this._navModeSelector.currentVerticalActiveState;
                    const currentAlt3 = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:3", "feet");

                    if((verticalMode === VerticalNavModeState.ALTC || verticalMode === VerticalNavModeState.ALT)
                        && Math.round(currentAlt3) === Math.round(this._vnav._vnavTargetAltitude)) {
                        //DO NOT ARM OR ACTIVATE IF ALREADY AT OR CAPTURING DESIRED RESTRICTION
                        this._pathArm = false;
                        this._pathArmAbove = false;
                    }
                    else if (this._vnav._altDeviation < 0 && this._vnav._distanceToTod < 20 && this._vnav._distanceToTod > 0 
                        && (this._navModeSelector.selectedAlt1 + 75 < this._indicatedAltitude || this._navModeSelector.currentLateralActiveState === LateralNavModeState.APPR)) {
                        //CAN ARM INTERCEPT FROM BELOW
                        this._pathArm = true;
                        this._pathArmAbove = false;
                    }
                    else if (this._vnav._altDeviation > 0 && this._vnav._topOfDescent > this._vnav._vnavTargetDistance 
                        && (this._navModeSelector.selectedAlt1 + 75 < this._indicatedAltitude || this._navModeSelector.currentLateralActiveState === LateralNavModeState.APPR)) {
                        //CAN ARM INTERCEPT FROM ABOVE
                        this._pathArmAbove = true;
                        this._pathArm = false;
                    }        
                    else {
                        this._pathArm = false;
                        this._pathArmAbove = false;
                    }
                }


                //CAN PATH EXECUTE?
                if (this._pathArm && !this._pathActive) {
                    //REACHED TOD
                    if (this._vnav._altDeviation > -300 && this._vnav._altDeviation < 0) {
                        //TIME TO ACTIVATE PATH
                        this._vnavTargetAltitude = this._vnav._vnavTargetAltitude;
                        this._pathActivate = true;
                    }
                    // ELSE OUTSIDE ACTIVATION PARAMETERS
                }
                else if (this._pathArmAbove && !this._pathActive) {
                    //WE NEED TO ATTEMPT TO INTERCEPT FROM ABOVE
                    const altitudeDifference = this._indicatedAltitude - this._vnav._vnavTargetAltitude;
                    const requiredFpa = (180 / Math.PI) * (Math.atan(altitudeDifference / (this._vnav._vnavTargetDistance * 6076.12)));
                    const groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
                    this._pathFromAboveRequiredVs = -101.2686667 * groundSpeed * Math.tan(requiredFpa * (Math.PI / 180));
                    if (this._vnav._altDeviation > -300 && this._vnav._altDeviation < 300) {
                        //TIME TO ACTIVATE PATH
                        this._vnavTargetAltitude = this._vnav._vnavTargetAltitude;
                        this._pathActivate = true;
                    }
                }

                //IS PATH ACTIVE?
                if (this._pathActive) {
                    //PATH MODE IS ACTIVE
                    if (this._vnavTargetAltitude == this._vnav._vnavTargetAltitude) {
                        //WE HAVE NOT PASSED THE TARGET YET 
                    }
                    else if (this._vnav._vnavTargetAltitude > this._vnavTargetAltitude) {
                        //ODD CASE WHERE NEXT CONSTRAINT IS HIGHER THAN CURRENT CONSTRAINT
                        this.setTargetAltitude(this._vnavTargetAltitude);
                        this.deactivate();
                        return;
                    }
                    else {
                        this._pathArmFired = false;
                        if (this._vnav._distanceToTod > 1) {
                            //WE HAVE PASSED THE TARGET, BUT DO NOT YET NEED TO SET A NEW ALT TARGET
                            this._pathActive = false;
                        }
                        else {
                            //WE HAVE PASSED THE TARGET AND NEED TO SET A NEW TARGET TO CONTINUE DESCENDING
                            this._vnavTargetAltitude = this._vnav._vnavTargetAltitude;
                            this._pathActive = false;
                            this._pathActivate = true;
                        }
                    }
                }
            }
            else {
                this.recalculate();
                return;
            }
            this.execute();
        }
        else {
            this.deactivate();
        }
    }

    /**
     * Execute.
     */
    execute() {
        
        this.checkPreselector();
        this.setSnowflake();
        this.setDonut();

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
            if (this._navModeSelector.selectedAlt2 != this._vnavTargetAltitude) {
                this.setTargetAltitude();
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
            console.log("constraint exists execute");
            if (this._vnav._vnavConstraintWaypoint && this._vnav._vnavConstraintWaypoint == this._vnav._activeWaypoint) {
                if (this._navModeSelector.currentVerticalActiveState == VerticalNavModeState.PTCH
                     || this._navModeSelector.currentVerticalActiveState == VerticalNavModeState.VS 
                     || this._navModeSelector.currentVerticalActiveState == VerticalNavModeState.FLC) {
                        console.log("constraint execute in vertical mode");
                        const altSlot = this._navModeSelector.currentAltSlotIndex;
                        const altSet1 = this._navModeSelector.selectedAlt1;
                        const altSet2 = this._navModeSelector.selectedAlt2;
                        if (Math.round(altSet2) != Math.round(this._vnav._vnavConstraintAltitude)) {
                            console.log("setting target alt");
                            this.setTargetAltitude(this._vnav._vnavConstraintAltitude);
                        }
                        if (this._vnav._currentFlightSegment.type == SegmentType.Departure) {
                            //CLIMB CONSTRAINTS
                            console.log("climb constraint");
                            if (altSet1 > altSet2 && altSlot == 1) {
                                console.log("set slot 2");
                                SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
                            }
                            else if (altSlot == 2) {
                                console.log("set slot 1");
                                SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
                            }
                        }
                        else if (this._vnav._currentFlightSegment.type != SegmentType.Departure) {
                            //DESCENT CONSTRAINTS
                            console.log("descent constraint");
                            if (altSet1 < altSet2 && altSlot == 1) {
                                console.log("set slot 2");
                                SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
                            }
                            else if (altSlot == 2) {
                                console.log("set slot 1");
                                SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
                            }
                        }
                    }
            }
            else {
                //SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
                SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
            }
            if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:2", "feet per minute") != 0) {
                Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, 0);
            }
        }
        else if (this._pathActive) {
            //SET VS FOR VNAV PATH
            let setVerticalSpeed = 0;
            const groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            const desiredVerticalSpeed = -101.2686667 * groundSpeed * Math.tan(this._vnav._desiredFPA * (Math.PI / 180));
            const maxVerticalSpeed = 101.2686667 * groundSpeed * Math.tan(6 * (Math.PI / 180));
            const maxCorrection = maxVerticalSpeed + desiredVerticalSpeed;
            //const altSlot = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number");
            //const vsSlot = SimVar.GetSimVarValue("AUTOPILOT VS SLOT INDEX", "number");
            const selectedAltitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:1", "feet");
            //const targetAltitude = Math.max(this._vnavTargetAltitude, selectedAltitude);
            if (this._navModeSelector.selectedAlt2 != this._vnavTargetAltitude) {
                this.setTargetAltitude();
            }
            // if (this._distanceToTod > 1 || this._vnav._altitude < targetAltitude) {
            //     setVerticalSpeed = 0;
            // }
            if (this._vnav._vnavTargetDistance < 1 && this._vnav._vnavTargetDistance > 0) {
                setVerticalSpeed = desiredVerticalSpeed;
                //console.log("this._vnavTargetDistance < 1 && this._vnavTargetDistance > 0");
            }
            else {
                if (this._vnav._altDeviation > 10) {
                    const correction = Math.min(Math.max((2.1 * this._vnav._altDeviation), 100), maxCorrection);
                    setVerticalSpeed = desiredVerticalSpeed - correction;
                    //console.log("this._vnav._altDeviation > 10 " + setVerticalSpeed);
                }
                else if (this._vnav._altDeviation < -10) {
                    const correction = Math.min(Math.max((-2.1 * this._vnav._altDeviation), 100), (-1 * desiredVerticalSpeed));
                    setVerticalSpeed = desiredVerticalSpeed + correction;
                    //console.log("this._vnav._altDeviation < -10 " + setVerticalSpeed);
                }
                else {
                    setVerticalSpeed = desiredVerticalSpeed;
                    //console.log("else " + setVerticalSpeed);
                }
            }
            //console.log("setvs: " + setVerticalSpeed);
            Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, setVerticalSpeed);
            // if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
            //     SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 1);
            // }
            // if (vsSlot != 2) {
            //     SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 2);
            // }
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
        // SimVar.SetSimVarValue("L:XMLVAR_VNAVButtonValue", "boolean", 0);
        // SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        // if (!SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Boolean")) {
        //     SimVar.SetSimVarValue("K:AP_ALT_HOLD", "number", 1);
        // }
        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
        // SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
        WTDataStore.set('CJ4_VNAV_SNOWFLAKE', 'false');
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
        // SimVar.SetSimVarValue("L:XMLVAR_VNAVButtonValue", "boolean", 0);
        // SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, this._vnav._altitude, true);
        // if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
        //     SimVar.SetSimVarValue("K:AP_ALT_HOLD", "number", 1);
        // }
        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
        // SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
        WTDataStore.set('CJ4_VNAV_SNOWFLAKE', 'false');
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

            Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, Math.round(updatedTargetAltitude), false);
            //SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
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
            const desiredVerticalSpeed = -101.2686667 * groundSpeed * Math.tan(this._vnav._desiredFPA * (Math.PI / 180));
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
        if (!this._pathArm && !this._pathArmFired && this._vnav._distanceToTod < approachingTodDistance) {
            if (SimVar.GetSimVarValue("L:WT_VNAV_TOD_FMC_ALERT", "bool") != 1) {
                SimVar.SetSimVarValue("L:WT_VNAV_TOD_FMC_ALERT", "bool", 1); 
                this._pathArmFired = true;
            }
        }
    }

    recalculate() {
        this._pathArm = false;
        this._pathArmAbove = false;
        this._pathActive = false;
        this._pathActivate = false;
        return;
    }
}