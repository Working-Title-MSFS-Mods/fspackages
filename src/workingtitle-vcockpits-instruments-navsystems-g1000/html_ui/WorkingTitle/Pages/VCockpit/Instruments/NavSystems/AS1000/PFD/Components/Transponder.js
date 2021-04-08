class WT_Transponder_Model {
    /**
     * @param {WT_Settings} settings 
     * @param {WT_Plane_State} planeState 
     */
    constructor(frame$, settings, planeState) {
        this.settings = settings;
        this.planeState = planeState;
        this.interrogated = new Subject(false);
        this.interrogatedTimeout = null;
        this.editingCode$ = new rxjs.BehaviorSubject(null);

        this.forceUpdate$ = new rxjs.Subject();
        const throttledUpdate$ = rxjs.merge(WT_RX.frameUpdate(frame$, 0.3, 10), this.forceUpdate$.pipe(
            rxjs.operators.delay(16)
        )).pipe(rxjs.operators.share());

        const mode$ = WT_RX.observeSimVar(throttledUpdate$, "TRANSPONDER STATE:1", "number")
        const code$ = WT_RX.observeSimVar(throttledUpdate$, "TRANSPONDER CODE:1", "number").pipe(
            rxjs.operators.map(code => code.toFixed(0).padStart(4, "0"))
        );

        this.mode = mode$.pipe(
            WT_RX.distinctMap(mode => {
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
            })
        );

        this.code = this.editingCode$.pipe(
            WT_RX.distinctMap(editingCode => editingCode !== null),
            rxjs.operators.switchMap(editing => {
                if (editing) {
                    return this.editingCode$;
                } else {
                    return code$;
                }
            })
        )

        planeState.inAir.subscribe(inAir => {
            if (inAir) {
                this.setMode(4);
                this.forceUpdate$.next();
            }
        })
    }
    setEditCode(code) {
        this.editingCode$.next(code);
    }
    update(dt) {
        if (Math.random() < 1 / 90 && !this.interrogated.value) {
            this.interrogated.value = true;
            setTimeout(() => this.interrogated.value = false, Math.random() * 500);
        }
    }
    setSquawk(squawk) {
        const code = parseInt(squawk[0]) * 4096 + parseInt(squawk[1]) * 256 + parseInt(squawk[2]) * 16 + parseInt(squawk[3]);
        SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", code);
        this.forceUpdate$.next();
    }
    setVfrSquawk() {
        this.setSquawk(this.settings.getValue("vfr_xpdr").toFixed(0));
    }
    setMode(mode) {
        SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", mode)
        this.forceUpdate$.next();
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