class WT_Minimums {
    /**
     * @param {WT_Plane_Config} config 
     */
    constructor(config) {
        this.mode = new Subject();
        this.source = new Subject();
        this.value = new Subject();
        this.state = new Subject();

        this.mode.subscribe(mode => {
            this.wasUpper = false;
        });
        this.wasUpper = false;

        this.modes = new Subject([0, 1]);

        config.watchNode("RadarAltitude").subscribe(node => {
            const isAvailable = node && node.textContent == "True";
            if (isAvailable) {
                this.modes.value = [0, 1, 3];
            } else {
                this.modes.value = [0, 1];
            }
        });
    }
    setModes(modes) {
        this.modes.value = modes;
    }
    setMode(mode) {
        SimVar.SetSimVarValue("L:AS3000_MinimalsMode", "number", mode);
    }
    setAltitude(value) {
        SimVar.SetSimVarValue("L:AS3000_MinimalsValue", "number", value);
    }
    update(dt) {
        const mode = SimVar.GetSimVarValue("L:AS3000_MinimalsMode", "number");
        const value = SimVar.GetSimVarValue("L:AS3000_MinimalsValue", "number");
        this.mode.value = mode;
        switch (mode) {
            case 0:
                this.value.value = null;
                break;
            case 1:
                this.source.value = "BARO MIN";
                this.value.value = value;
                break;
            case 2:
                this.source.value = "COMP MIN";
                this.value.value = value;
                break;
            case 3:
                this.source.value = "RA MIN";
                this.value.value = value;
                break;
        }
        let state = "";
        switch (mode) {
            case 1:
                let currHeight = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
                if (!this.wasUpper || currHeight > (value + 100)) {
                    state = "";
                    if (!this.wasUpper && currHeight > (value + 100)) {
                        this.wasUpper = true;
                    }
                } else if (currHeight > value) {
                    state = "near";
                } else {
                    state = "low";
                }
                break;
            case 2:
                break;
            case 3:
                let currentBaroAlt = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
                let currentRAAlt = SimVar.GetSimVarValue("RADIO HEIGHT", "feet");
                Avionics.Utils.diffAndSetAttribute(this.altimeter, "minimum-altitude", (value + currentBaroAlt - currentRAAlt).toString());
                if (!this.wasUpper || currentRAAlt > (value + 100)) {
                    state = "";
                    if (!this.wasUpper && currentRAAlt > (value + 100)) {
                        this.wasUpper = true;
                    }
                }
                else if (currentRAAlt > value) {
                    state = "near";
                }
                else {
                    state = "low";
                }
                break;
        }
        this.state.value = state;
    }
}