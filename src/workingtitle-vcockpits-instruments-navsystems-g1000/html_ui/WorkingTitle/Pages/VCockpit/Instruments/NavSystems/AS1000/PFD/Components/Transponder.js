class WT_Transponder_Model {
    /**
     * @param {WT_Settings} settings 
     * @param {WT_Plane_State} planeState 
     */
    constructor(settings, planeState) {
        this.settings = settings;
        this.planeState = planeState;
        this.code = new Subject(this.getSimCode());
        this.mode = new Subject();
        this.editing = new Subject(false);
        this.interrogated = new Subject(false);
        this.interrogatedTimeout = null;
        this.editingCode = null;

        /*planeState.inAir.subscribe(inAir => {
            this.setMode(4);
        })*/
    }
    getSimCode() {
        return ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4);
    }
    getMode() {
        let mode = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        switch (mode) {
            case 1:
                return "STBY";
            case 2:
                return "GND";
            case 3:
                return "ON";
            case 4:
                return "ALT";
        }
        return "IDNT";
    }
    setEditCode(code) {
        this.editingCode = code;
    }
    update(dt) {
        this.code.value = this.editingCode === null ? this.getSimCode() : this.editingCode.padEnd(4, "_");
        this.mode.value = this.getMode();

        if (Math.random() < 1 / 90 && !this.interrogated.value) {
            this.interrogated.value = true;
            setTimeout(() => this.interrogated.value = false, Math.random() * 500);
        }

        let onGround = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots") < 50;
        if (this.lastOnGround && !onGround) {
            this.setMode(4);
        }
        this.lastOnGround = onGround;
    }
    enterNumber(number) {
        if (!this.editing) {
            this.editingCode = "";
        }
        if (this.editingTimeout) {
            clearTimeout(this.editingTimeout);
        }
        this.editingTimeout += number.toFixed(0);
    }
    setSquawk(squawk) {
        squawk = String(squawk);
        let code = parseInt(squawk[0]) * 4096 + parseInt(squawk[1]) * 256 + parseInt(squawk[2]) * 16 + parseInt(squawk[3]);
        SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", code);
    }
    setVfrSquawk() {
        this.setSquawk(this.settings.getValue("vfr_xpdr"));
    }
    setMode(mode) {
        SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", mode)
    }
}

class WT_Transponder_View extends WT_HTML_View {
    /**
     * @param {WT_PFD_Transponder_Model} model 
     */
    setModel(model) {
        model.code.subscribe(code => this.elements.code.textContent = code);
        model.mode.subscribe(mode => {
            if (mode == "STBY")
                this.removeAttribute("enabled");
            else
                this.setAttribute("enabled", "enabled");
            this.elements.mode.textContent = mode;
        });
        model.interrogated.subscribe(interrogated => {
            if (interrogated) {
                this.setAttribute("interrogated", "interrogated");
            } else {
                this.removeAttribute("interrogated");
            }
        })
    }
}
customElements.define("g1000-transponder", WT_Transponder_View);