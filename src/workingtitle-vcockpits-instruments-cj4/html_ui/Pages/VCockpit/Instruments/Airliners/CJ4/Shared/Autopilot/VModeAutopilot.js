class WT_VModeAutopilot extends WT_BaseAutopilot {
    constructor(fpm) {
        super(fpm);
        this._vnavTargetAltitude = undefined;
    }

    /**
     * Run on first activation.
     */
    activate() {
        super.activate();
        this.update();
    }

    /**
     * Update data if needed.
     */
    update() {
        super.update();
        
        if (SimVar.GetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "feet") > 0) {
            this._vnavTargetAltitude = SimVar.GetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "feet");
        }
        else {
            this._vnavTargetAltitude = undefined;
        }

        this.execute();
    }

    /**
     * Execute.
     */
    execute() {
        super.execute();

        //SET ALTITUDE TARGETS
        if (this._vnavTargetAltitude) {
            if (Math.abs(this._altitude - this._vnavTargetAltitude) < 100) {
                if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
                    SimVar.SetSimVarValue("K:AP_ALT_HOLD", "number", 1);
                }
            }
            Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, this._vnavTargetAltitude);
            SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
            SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 1);
        } else {
            this.deactivate();
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
    }
}