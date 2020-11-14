class WT_VNavPathAutopilot extends WT_BaseAutopilot {
    constructor(fpm) {
        super(fpm);
        this._vnavConstraintAltitude = undefined;
        this._vnavTargetAltitude = undefined;
        this._vnavTargetDistance = undefined;
        this._topOfDescent = undefined;
        this._distanceToTod = undefined;
        this._altDeviation = undefined;
        this._desiredVerticalSpeed = undefined;
        this._desiredAltitude = undefined;
        this._lastVnavTargetAltitude = undefined;
        this._interceptingLastAltitude = false;
    }

    /**
     * Run on first activation.
     */
    activate() {
        super.activate();
        Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, 0);
        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 2);
    }

    /**
     * Update data if needed.
     */
    update() {
        super.update();

        //GRAB THE CURRENT CONSTRAINT AND SET IT IF IT EXISTS
        if (SimVar.GetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "feet") > 0) {
            this._vnavConstraintAltitude = SimVar.GetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "feet");
        }
        else {
            this._vnavConstraintAltitude = undefined;
        }

        //FETCH VNAV VARIABLES
        const vnavValues = WTDataStore.get('CJ4_vnavValues', 'none');
        if (vnavValues != "none") {
            const parsedVnavValues = JSON.parse(vnavValues);
            this._vnavTargetAltitude = parseInt(parsedVnavValues.vnavTargetAltitude);
            this._vnavTargetDistance = parseFloat(parsedVnavValues.vnavTargetDistance);
            this._topOfDescent = parseFloat(parsedVnavValues.topOfDescent);
            this._distanceToTod = parseFloat(parsedVnavValues.distanceToTod);
        }
        this._altDeviation = SimVar.GetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet");
        
        //PREPARE EXECUTION VARIABLES
        this._desiredVerticalSpeed = -101.2686667 * this._groundSpeed * Math.tan(this._desiredFPA * (Math.PI / 180));
        this._desiredAltitude = this._vnavTargetAltitude + (Math.tan(this._desiredFPA * (Math.PI / 180)) * this._vnavTargetDistance * 6076.12);

        this.execute();
    }

    /**
     * Execute.
     */
    execute() {
        super.execute();
        let setVerticalSpeed = 0;

        //SET BEHAVIOR IF INTERCEPTING TARGET ALTITUDE & SET AP TARGET ALTITUDE
        if (this._lastVnavTargetAltitude !== undefined && this._lastVnavTargetAltitude != this._vnavTargetAltitude && this._vnavTargetDistance > this._topOfDescent && this._altitude > this._lastVnavTargetAltitude) {
            setVerticalSpeed = this._desiredVerticalSpeed;
            if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
                SimVar.SetSimVarValue("K:AP_ALT_HOLD", "number", 1);
            }
            Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, this._lastVnavTargetAltitude, true);
            SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
            SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 1);
            this._interceptingLastAltitude = true;
        }
        else {
            this._lastVnavTargetAltitude = this._vnavTargetAltitude;
            this._interceptingLastAltitude = false;
            if (this._distanceToTod <= 0) {
                if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
                    SimVar.SetSimVarValue("K:AP_ALT_HOLD", "number", 0);
                }
                Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, this._vnavTargetAltitude, true);
                SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
                SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 1);
            }
        }

        //SET VS FOR VNAV PATH
        if (this._interceptingLastAltitude === false) {
            if ((this._vnavTargetDistance - this._topOfDescent) > 0.5 || this._altitude < this._vnavTargetAltitude) {
                setVerticalSpeed = 0;
            }
            else if (this._vnavTargetDistance < 1 && this._vnavTargetDistance > 0) {
                setVerticalSpeed = this._desiredVerticalSpeed;
            }
            else {
                if (this._altDeviation >= 500) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 1.5;
                }
                else if (this._altDeviation <= -500) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 0;
                }
                else if (this._altDeviation >= 400) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 1.4;
                }
                else if (this._altDeviation <= -400) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 0;
                }
                else if (this._altDeviation >= 300) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 1.3;
                }
                else if (this._altDeviation <= -300) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 0.25;
                }
                else if (this._altDeviation >= 200) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 1.2;
                }
                else if (this._altDeviation <= -200) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 0.5;
                }
                else if (this._altDeviation >= 100) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 1.1;
                }
                else if (this._altDeviation <= -100) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 0.8;
                }
                else if (this._altDeviation >= 20) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 1.05;
                }
                else if (this._altDeviation <= -20) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 0.9;
                }
                else {
                    setVerticalSpeed = this._desiredVerticalSpeed;
                }
            }
            Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, setVerticalSpeed);
        }
    }

    /**
     * Run when deactivated.
     */
    deactivate() {
        super.deactivate();
        if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
            SimVar.SetSimVarValue("K:AP_ALT_HOLD", "number", 1);

        }
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:2", "feet"));
        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
    }
}