class WT_VnavAutopilot {
    constructor(vnav) {
        this._vnav = vnav;

        this._vnavType = false;
        
        this._vnavConstraintAltitude = undefined;
        this._vnavTargetAltitude = undefined;
        this._vnavTargetDistance = undefined;
        this._topOfDescent = undefined;
        this._distanceToTod = undefined;
        this._altDeviation = 0;
        this._lastVnavTargetAltitude = undefined;
        this._interceptingLastAltitude = false;
        this._lastVerticalMode = undefined;
        this._vnavMode = 0; //0 = none; 1 = V Mode; 2 = V PATH
        this._vnavStatus = 0;   //0 = none
                                //1 = VMODE BEFORE CONSTRAINT; 2 = VMODE OBSERVING CONSTRAINT; 3 = VMODE SETTING NEW CONSTRAINT; 4 = VMODE CLEAR CONSTRAINT
                                //10 = VPATH VERY TOD NEW PATH
                                //11 = VPATH BEFORE TOD; 12 = VPATH APPROACHING TOD; 13 = VPATH DESCENDING; 14 = VPATH APPROACHING INTERMEDIATE LEVEL OFF
                                //15 = VPATH NEW TARGET; 16 = VPATH INTERCEPTING ALTITUDE
    }

    /**
     * Run on first activation.
     */
    activate() {
        this._vnavStatus = 0;
        this._vnavMode = 0;
    }

    /**
     * Update data if needed.
     */
    update() {
        this._altDeviation = 0;
        
        //WHAT VMODE ARE WE IN? remember: VNAV is on for this class to run
        const vsModeSelected = SimVar.GetSimVarValue("L:WT_CJ4_VS_ON", "number") == 1;
        const flcModeSelected = SimVar.GetSimVarValue("L:WT_CJ4_FLC_ON", "number") == 1;

        if (this._vnav._vnavCalculating && (vsModeSelected || flcModeSelected)) { //WE ARE IN VVS OR VFLC VMODE (NO PATH!)
            this._vnavMode = 1; //0 = none; 1 = V Mode; 2 = V PATH
            if (this._vnavStatus > 5) {
                this._vnavStatus = 0;
            }

            //GRAB THE CURRENT CONSTRAINT
            const constraintAltitude = this._vnav._vnavConstraintAltitude;

            //WHERE ARE WE AT IN THE LIFECYCLE?
            if (constraintAltitude > 0 && this._vnavConstraintAltitude == constraintAltitude) {
                //CONSTRAINT EXISTS AND HASN'T CHANGED - DO NOT NEED TO CHANGE ALT TARGET
                this._vnavStatus = 1;
            }
            else if (constraintAltitude > 0 && this._vnavConstraintAltitude != constraintAltitude) {
                //CONSTRAINT EXISTS AND HAS CHANGED - WILL NEED TO SET NEW ALT TARGET
                this._vnavStatus = 3;
                this._vnavConstraintAltitude = Math.round(constraintAltitude);
            }
            else {
                //CONSTRAINT PASSED AND THERE IS NO NEXT CONSTRAINT
                this._vnavConstraintAltitude = undefined;
                this._vnavStatus = 4;
            }
            //TODO: Need case for observing constraint and resume climb after constraint passed?

            //TODO: Need case for intercepting path while in FLC/VS

        }
        else {
            //WE ARE IN VPATH MODE
            if (this._vnavStatus < 10) {
                this._vnavStatus = 0;
            }
            //10 = VERY TOD NEW PATH; 11 = VPATH BEFORE TOD; 12 = VPATH APPROACHING TOD; 13 = VPATH DESCENDING; 14 = VPATH APPROACHING INTERMEDIATE LEVEL OFF



            //FETCH VNAV VARIABLES
            //const vnavValues = WTDataStore.get('CJ4_vnavValues', 'none');
            if (this._vnav._vnavCalculating) {
                this._vnavMode = 2; //0 = none; 1 = V Mode; 2 = V PATH
                const vnavTargetAltitude = this._vnav._vnavTargetAltitude;
                this._vnavTargetDistance = this._vnav._vnavTargetDistance;
                const topOfDescent = this._vnav._topOfDescent;
                const distanceToTod = this._vnav._distanceToTod;

                //FOR EXECUTION ALL WE CARE ABOUT IS WHETHER TO SET A NEW TARGET ALTITUDE AND WHETHER TO MANAGE VS

                //WHERE ARE WE AT IN THE LIFECYCLE?
                if (this._vnav._newPath || this._vnavStatus == 10) { //TODO: do we need && this._vnavStatus == 0 ???
                    //THIS IS THE VERY TOD
                    if (distanceToTod < 2) {
                        //WITHIN 2 MILES, TIME TO SHOW THE SNOWFLAKE AND PREPARE AP PARAMETERS
                        this._vnavTargetAltitude = vnavTargetAltitude;
                        this._topOfDescent = topOfDescent;
                        this._distanceToTod = distanceToTod;
                        this._vnavStatus = 12;
                        this._vnav._newPath = false;
                    }
                    else {
                        //MORE THAN 2 MILES FROM TOD, DON'T SHOW SNOWFLAKE AND DON'T DO ANYTHING
                        this._vnavStatus = 10;
                    }
                }
                else if (this._vnavStatus == 0 || this._vnavStatus == 11) {
                    //APPROACHING A TOD THAT IS NOT THE FIRST TOD IN THE PATH
                    if (distanceToTod < 2) {
                        this._vnavTargetAltitude = vnavTargetAltitude;
                        this._topOfDescent = topOfDescent;
                        this._distanceToTod = distanceToTod;
                        this._vnavStatus = 12;
                    }
                    else {
                        this._vnavStatus = 11;
                    }
                }
                else if (this._vnavStatus == 14) {
                    //LEVEL OFF
                    if (this._vnavTargetAltitude == vnavTargetAltitude) {
                        //WE HAVE NOT PASSED THE TARGET YET 
                        this._vnavStatus = 14;
                    }
                    else if (vnavTargetAltitude > this._vnavTargetAltitude) {
                        //ODD CASE WHERE NEXT CONSTRAINT IS HIGHER THAN CURRENT CONSTRAINT
                        this.setTargetAltitude(this._vnavTargetAltitude);
                        this.deactivate();
                        return;
                    }
                    else {
                        if (distanceToTod > 1) {
                            //WE HAVE PASSED THE TARGET, BUT DO NOT YET NEED TO SET A NEW ALT TARGET
                            this._vnavStatus = 11;
                        }
                        else {
                            //WE HAVE PASSED THE TARGET AND NEED TO SET A NEW TARGET TO CONTINUE DESCENDING
                            this._vnavTargetAltitude = vnavTargetAltitude;
                            this._topOfDescent = topOfDescent;
                            this._distanceToTod = distanceToTod;
                            this._vnavStatus = 12;
                        }
                    }
                }
                else if (this._vnavStatus == 13) {
                    //WE ARE DESCENDING ON PATH
                    if (this._vnavTargetDistance <= 2) {
                        //WE ARE APPROACHING CONSTRAINT, STATUS TO LEVEL OFF
                        this._vnavStatus = 14;
                    }
                    else {
                        //WE ARE CONTINUING OUR DESCENT
                        this._vnavStatus = 13;
                    }
                }
                else {
                    //VPATH NO FURTHER TARGETS
                    this._vnavStatus = 0;
                }
            }
            else if (!this._vnav._vnavCalculating && this._vnavStatus == 14) {
                //VPATH HAS REACHED THE FINAL WAYPOINT AND SHOULD GRACEFULLY EXIT
                this.deactivate();
                return;
            }
            else {
                //SOMETHING IS WRONG AND WE NEED A HARD EXIT
                this.failed();
                return;
            }
        }

        if (this._vnavMode == 2) {
            WTDataStore.set('CJ4_VNAV_ACTIVE', 'true');
        } else {
            WTDataStore.set('CJ4_VNAV_ACTIVE', 'false');
        }
        this.execute();
    }

    /**
     * Execute.
     */
    execute() {
        let setVerticalSpeed = 0;

        if (this._vnavMode == 1 && this._vnavStatus > 0) { //V MODE ENABLED
            //WHERE ARE WE IN THE LIFECYCLE (this._vnavStatus)
            //1 = VMODE BEFORE CONSTRAINT; 2 = VMODE OBSERVING CONSTRAINT; 3 = VMODE SETTING NEW CONSTRAINT; 4 = VMODE CLEAR CONSTRAINT

            if (this._vnav._vnavConstraintWaypoint && this._vnav._vnavConstraintWaypoint == this._vnav._activeWaypoint) {
                if (this._vnav._activeWaypointDist < 40) {
                    if (this._vnavStatus == 1) {
                        const altSlot = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number");
                        const altSet = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:2", "feet");
                        //console.log("checking alt & slot: " + altSlot + altSet);
                        //console.log("this._vnavConstraintAltitude: " + this._vnavConstraintAltitude);
                        if (altSlot != 2 || altSet != this._vnavConstraintAltitude) {
                            this.setTargetAltitude(this._vnavConstraintAltitude);
                        }
                        //ELSE DO NOTHING - NO CHANGE
                    }
                    else if (this._vnavStatus == 3) {
                        //SET NEW MANAGED ALT TARGET TO NEW CONSTRAINT
                        this.setTargetAltitude(this._vnavConstraintAltitude);
                    }
                    else if (this._vnavStatus == 4) {
                        //CANCEL CONSTRAINT TARGET, RESUME SELECTED ALT SLOT & CLEAR VNAV
                        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
                        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
                        this._vnavStatus = 0;
                        this._vnavMode = 0;
                    }
                } 
            }
        }
        else if (this._vnavMode == 2 && this._vnavStatus > 0) { //V PATH ENABLED
            //WHERE ARE WE IN THE LIFECYCLE (this._vnavStatus)
            //11 = VPATH BEFORE TOD; 12 = VPATH APPROACHING TOD; 13 = VPATH DESCENDING; 14 = VPATH APPROACHING INTERMEDIATE LEVEL OFF

            //IF STATUS 11 DO NOTHING WITH ALTITUDES
            //IF STATUS 14 DO NOTHING WITH ALTITUDES
            let runPath = false;

            if (this._vnavStatus == 12) {
                //VPATH APPROACHING TOD
                this.setTargetAltitude();
                this._vnavStatus = 13;
            }

            //PATH ARMED OR ACTIVE?
            if (this._vnavStatus == 12 || this._vnavStatus == 13) {
                //this._altDeviation = SimVar.GetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet");
                if (this._vnav._altDeviation < -1000 || this._vnav._altDeviation > 1000) {
                    WTDataStore.set('CJ4_VNAV_PATH_STATUS', 'armed');
                    runPath = false;
                }
                else {
                    WTDataStore.set('CJ4_VNAV_PATH_STATUS', 'active');
                    runPath = true;
                }
            }

            //SET VS FOR VNAV PATH
            const groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            console.log("groundSpeed: " + groundSpeed)
            console.log("this._vnav._desiredFPA: " + this._vnav._desiredFPA)
            const desiredVerticalSpeed = -101.2686667 * groundSpeed * Math.tan(this._vnav._desiredFPA * (Math.PI / 180));
            const maxVerticalSpeed = 101.2686667 * groundSpeed * Math.tan(6 * (Math.PI / 180));
            const maxCorrection = maxVerticalSpeed + desiredVerticalSpeed;
            const altSlot = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number");
            const vsSlot = SimVar.GetSimVarValue("AUTOPILOT VS SLOT INDEX", "number");
            
            if (this._vnavStatus == 13 && runPath == true) {
                console.log("running set vs");
                const selectedAltitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:1", "feet");
                const targetAltitude = Math.max(this._vnavTargetAltitude, selectedAltitude);
                if (altSlot != 2) {
                    console.log("altSlot != 2");
                    this.setTargetAltitude();
                }
                // if (this._distanceToTod > 1 || this._vnav._altitude < targetAltitude) {
                //     setVerticalSpeed = 0;
                // }
                if (this._vnavTargetDistance < 1 && this._vnavTargetDistance > 0) {
                    setVerticalSpeed = desiredVerticalSpeed;
                    console.log("this._vnavTargetDistance < 1 && this._vnavTargetDistance > 0");
                }
                else {
                    if (this._vnav._altDeviation > 10) {
                        const correction = Math.min(Math.max((2.1 * this._vnav._altDeviation), 100), maxCorrection);
                        setVerticalSpeed = desiredVerticalSpeed - correction;
                        console.log("this._vnav._altDeviation > 10 " + setVerticalSpeed);
                    }
                    else if (this._vnav._altDeviation < -10) {
                        const correction = Math.min(Math.max((-2.1 * this._vnav._altDeviation), 100), (-1 * desiredVerticalSpeed));
                        setVerticalSpeed = desiredVerticalSpeed + correction;
                        console.log("this._vnav._altDeviation < -10 " + setVerticalSpeed);
                    }
                    else {
                        setVerticalSpeed = desiredVerticalSpeed;
                        console.log("else " + setVerticalSpeed);
                    }
                }
                console.log("setvs: " + setVerticalSpeed);
                Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, setVerticalSpeed);
                if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
                    SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 1);
                }
                if (vsSlot != 2) {
                    SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 2);
                }
            }
        }
        SimVar.SetSimVarValue("L:WT_TEMP_VNAV_STATUS", "number", this._vnavStatus);
    }

    /**
     * Run when deactivated.
     */
    deactivate() {
        this._vnavMode = 0; //0 = none; 1 = V Mode; 2 = V PATH
        this._vnavStatus = 0;
        SimVar.SetSimVarValue("L:XMLVAR_VNAVButtonValue", "boolean", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_VS_ON", "number", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_FLC_ON", "number", 0);
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        if (!SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Boolean")) {
            SimVar.SetSimVarValue("K:AP_ALT_HOLD", "number", 1);
        }
        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
        WTDataStore.set('CJ4_VNAV_SNOWFLAKE', 'false');
    }

    failed() {
        this._vnavMode = 0; //0 = none; 1 = V Mode; 2 = V PATH
        this._vnavStatus = 0;
        SimVar.SetSimVarValue("L:XMLVAR_VNAVButtonValue", "boolean", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_VS_ON", "number", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_FLC_ON", "number", 0);
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, this._vnav._altitude, true);
        if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
            SimVar.SetSimVarValue("K:AP_ALT_HOLD", "number", 1);
        }
        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
        WTDataStore.set('CJ4_VNAV_SNOWFLAKE', 'false');
    }

    setTargetAltitude(targetAltitude = this._vnavTargetAltitude) {
        console.log("setting altitude");
        let isClimb = this._vnav._currentFlightSegment.type == SegmentType.Departure ? true : false;
        console.log("climb? " + (isClimb ? "YES" : "NO"));
        let selectedAltitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:1", "feet");
        let updatedTargetAltitude = isClimb ? Math.min(targetAltitude, selectedAltitude) : Math.max(targetAltitude, selectedAltitude);
        console.log(updatedTargetAltitude);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, Math.round(updatedTargetAltitude), false);
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 1);
    }
}