class WT_VNavPathAutopilot extends WT_BaseAutopilot {
    constructor(fpm) {
        super(fpm);
        this._vnavConstraintAltitude = undefined;
        this._vnavTargetAltitude = undefined;
        this._vnavTargetDistance = undefined;
        this._topOfDescent = undefined;
        this._distanceToTod = undefined;
        this._altDeviation = undefined;
        //this._desiredAltitude = undefined;
        this._lastVnavTargetAltitude = undefined;
        this._interceptingLastAltitude = false;
        this._lastVerticalMode = undefined;
        this._vnavMode = 0; //0 = none; 1 = V Mode; 2 = V PATH
        this._vnavStatus = 0;   //0 = none
                                //1 = VMODE BEFORE CONSTRAINT; 2 = VMODE OBSERVING CONSTRAINT; 3 = VMODE SETTING NEW CONSTRAINT; 4 = VMODE CLEAR CONSTRAINT
                                //11 = VPATH BEFORE TOD; 12 = VPATH APPROACHING TOD; 13 = VPATH DESCENDING; 14 = VPATH APPROACHING INTERMEDIATE LEVEL OFF
                                //15 = VPATH NEW TARGET; 16 = VPATH INTERCEPTING ALTITUDE
    }

    /**
     * Run on first activation.
     */
    activate() {
        this._vnavStatus = 0;
        // Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, 0);
        // SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 2);
    }

    /**
     * Update data if needed.
     */
    update() {
        super.update();
        
        const altMode = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Boolean") === 1;
        const flcMode = SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "Boolean") === 1;
        const vsMode = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean") === 1;
        const gsMode = SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ACTIVE", "Boolean") === 1;
        const pitMode = SimVar.GetSimVarValue("AUTOPILOT PITCH HOLD", "Boolean") === 1;
        //let currentAltLock = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet");
        //let selectedAltLock = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:1", "feet");
        const altDelta = Simplane.getAltitude() - Simplane.getAutoPilotAltitudeLockValue("feet");

        //WHAT VMODE ARE WE IN? remember: VNAV is on for this class to run
        const vsModeSelected = SimVar.GetSimVarValue("L:WT_CJ4_VS_ON", "number") == 1;
        const flcModeSelected = SimVar.GetSimVarValue("L:WT_CJ4_FLC_ON", "number") == 1;

        if (vsModeSelected || flcModeSelected) { //WE ARE IN VVS OR VFLC VMODE (NO PATH!)
            this._vnavMode = 1; //0 = none; 1 = V Mode; 2 = V PATH
            if (this._vnavStatus > 5) {
                this._vnavStatus = 0;
            }

            //GRAB THE CURRENT CONSTRAINT
            const constraintAltitude = SimVar.GetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "feet");

            //WHERE ARE WE AT IN THE LIFECYCLE?
            if (constraintAltitude > 0 && this._vnavConstraintAltitude == constraintAltitude) {
                //CONSTRAINT EXISTS AND HASN'T CHANGED - DO NOT NEED TO CHANGE ALT TARGET
                this._vnavStatus = 1;
            }
            else if (constraintAltitude > 0 && this._vnavConstraintAltitude != constraintAltitude) {
                //CONSTRAINT EXISTS AND HAS CHANGED - WILL NEED TO SET NEW ALT TARGET
                this._vnavStatus = 3;
                this._vnavConstraintAltitude = constraintAltitude;
            }
            else {
                //CONSTRAINT PASSED AND THERE IS NO NEXT CONSTRAINT
                this._vnavConstraintAltitude = undefined;
                this._vnavStatus = 4;
            }
            //TODO: Need case for observing constraint and resume climb after constraint passed?

        }
        else {
            //WE ARE IN VPATH MODE
            if (this._vnavStatus < 10) {
                this._vnavStatus = 0;
            }
            //11 = VPATH BEFORE TOD; 12 = VPATH APPROACHING TOD; 13 = VPATH DESCENDING; 14 = VPATH APPROACHING INTERMEDIATE LEVEL OFF

            //FETCH VNAV VARIABLES
            const vnavValues = WTDataStore.get('CJ4_vnavValues', 'none');
            if (vnavValues != "none") {
                this._vnavMode = 2; //0 = none; 1 = V Mode; 2 = V PATH
                const parsedVnavValues = JSON.parse(vnavValues);
                const vnavTargetAltitude = parseInt(parsedVnavValues.vnavTargetAltitude);
                this._vnavTargetDistance = parseFloat(parsedVnavValues.vnavTargetDistance);
                const topOfDescent = parseFloat(parsedVnavValues.topOfDescent);
                const distanceToTod = parseFloat(parsedVnavValues.distanceToTod);

                //FOR EXECUTION ALL WE CARE ABOUT IS WHETHER TO SET A NEW TARGET ALTITUDE AND WHETHER TO MANAGE VS

                //WHERE ARE WE AT IN THE LIFECYCLE?
                if (this._vnavStatus == 0 || this._vnavStatus == 11) {
                    //THIS IS THE VERY TOD
                    if (distanceToTod < 2) {
                        this._vnavTargetAltitude = vnavTargetAltitude;
                        this._topOfDescent = topOfDescent;
                        this._distanceToTod = distanceToTod;
                        this._vnavStatus = 12;
                    }
                    else {
                        this._vnavStatus = 11;
                    }                }

                else if (this._vnavStatus == 14) {
                    //LEVEL OFF
                    if (this._vnavTargetAltitude == vnavTargetAltitude) {
                        //WE HAVE NOT PASSED THE TARGET YET 
                        this._vnavStatus = 14;
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
            else if (vnavValues == "none" && this._vnavStatus == 14) {
                //VPATH HAS REACHED THE FINAL WAYPOINT AND SHOULD GRACEFULLY EXIT
                this.deactivate();
                return;
            }
            else {
                //SOMETHING IS WRONG AND WE NEED A HARD EXIT
                this.failed();
                return;
            }
            this._altDeviation = SimVar.GetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet");

            //PREPARE EXECUTION VARIABLES
            //this._desiredAltitude = this._vnavTargetAltitude + (Math.tan(this._desiredFPA * (Math.PI / 180)) * this._vnavTargetDistance * 6076.12);
        }
        this.execute();
    }

    /**
     * Execute.
     */
    execute() {
        super.execute();
        let setVerticalSpeed = 0;

        if (this._vnavMode == 1 && this._vnavStatus > 0) { //V MODE ENABLED
            //WHERE ARE WE IN THE LIFECYCLE (this._vnavStatus)
            //1 = VMODE BEFORE CONSTRAINT; 2 = VMODE OBSERVING CONSTRAINT; 3 = VMODE SETTING NEW CONSTRAINT; 4 = VMODE CLEAR CONSTRAINT
            if (this._vnavStatus == 1) {
                //DO NOTHING - NO CHANGE
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
        else if (this._vnavMode == 2 && this._vnavStatus > 0) { //V PATH ENABLED
            //WHERE ARE WE IN THE LIFECYCLE (this._vnavStatus)
            //11 = VPATH BEFORE TOD; 12 = VPATH APPROACHING TOD; 13 = VPATH DESCENDING; 14 = VPATH APPROACHING INTERMEDIATE LEVEL OFF

            //IF STATUS 11 DO NOTHING WITH ALTITUDES
            //IF STATUS 14 DO NOTHING WITH ALTITUDES

            if (this._vnavStatus == 12) {
                //VPATH APPROACHING TOD
                this.setTargetAltitude();
                this._vnavStatus = 13;
            }



            // //SET BEHAVIOR IF INTERCEPTING TARGET ALTITUDE & SET AP TARGET ALTITUDE
            // //TOP OF DESCENT CASE
            // if (this._lastVnavTargetAltitude === undefined) {
            //     this._lastVnavTargetAltitude = this._vnavTargetAltitude;
            //     this._interceptingLastAltitude = false;
            //     if (this._distanceToTod <= 1) { //ACTIVATE TARGET ALT IN SLOT2 ONE MILE BEFORE TOD
            //         this.setTargetAltitude();
            //     }
            // }
            // //INTERCEPTING LAST ALTITUDE CASE WHILE DISTANCE TO NEXT PATH DESCENT TOD IS > 0
            // else if (this._lastVnavTargetAltitude != this._vnavTargetAltitude && this._distanceToTod > 0 && this._altitude > this._lastVnavTargetAltitude) {
            //     setVerticalSpeed = desiredVerticalSpeed;
            //     this.setTargetAltitude(this._lastVnavTargetAltitude);
            //     this._interceptingLastAltitude = true;
            //     if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) { //ONCE VS MODE ENDS SET ALT HOLD
            //         SimVar.SetSimVarValue("K:AP_ALT_HOLD", "number", 1);
            //     }
            // }
            // //NOT INTERCEPTING LAST ALTITUDE CASE
            // else {
            //     this._lastVnavTargetAltitude = this._vnavTargetAltitude;
            //     this._interceptingLastAltitude = false;
            //     if (this._distanceToTod <= 1) {
            //         this.setTargetAltitude();
            //     }
            // }

            //SET VS FOR VNAV PATH
            const desiredVerticalSpeed = -101.2686667 * this._groundSpeed * Math.tan(this._desiredFPA * (Math.PI / 180));
            const maxVerticalSpeed = 101.2686667 * this._groundSpeed * Math.tan(6 * (Math.PI / 180));
            const maxCorrection = maxVerticalSpeed + desiredVerticalSpeed;
            
            if (this._vnavStatus == 13) {
                if (this._distanceToTod > 1 || this._altitude < this._vnavTargetAltitude) {
                    setVerticalSpeed = 0;
                }
                else if (this._vnavTargetDistance < 1 && this._vnavTargetDistance > 0) {
                    setVerticalSpeed = desiredVerticalSpeed;
                }
                else {
                    if (this._altDeviation > 10) {
                        const correction = Math.min(Math.max((2.1 * this._altDeviation), 100), maxCorrection);
                        setVerticalSpeed = desiredVerticalSpeed - correction;
                    }
                    else if (this._altDeviation < -10) {
                        const correction = Math.min(Math.max((-2.1 * this._altDeviation), 100), (-1 * desiredVerticalSpeed));
                        setVerticalSpeed = desiredVerticalSpeed + correction;
                    }
                    else {
                        setVerticalSpeed = desiredVerticalSpeed;
                    }
                }
                if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
                    SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 1);
                }
                Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, setVerticalSpeed);
            }
        }
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
        super.deactivate();
    }

    failed() {
        this._vnavMode = 0; //0 = none; 1 = V Mode; 2 = V PATH
        this._vnavStatus = 0;
        SimVar.SetSimVarValue("L:XMLVAR_VNAVButtonValue", "boolean", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_VS_ON", "number", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_FLC_ON", "number", 0);
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, this._altitude, true);
        if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
            SimVar.SetSimVarValue("K:AP_ALT_HOLD", "number", 1);
        }
        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
        super.deactivate();
    }

    setTargetAltitude(targetAltitude = this._vnavTargetAltitude) {
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, targetAltitude, true);
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 1);
    }
}