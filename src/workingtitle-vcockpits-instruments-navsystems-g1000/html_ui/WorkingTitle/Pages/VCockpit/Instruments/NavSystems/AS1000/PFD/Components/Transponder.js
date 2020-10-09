class AS1000_PFD_Transponder_Model {
    constructor() {
        this.code = new Subject(this.getSimCode());
        this.mode = new Subject();
        this.editing = new Subject(false);

        //this.codeDisplay = new CombinedSubject([this.code, this.editing])
    }
    getSimCode() {
        return ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4);
    }
    getMode() {
        let mode = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        switch (mode) {
            case 1:
                return "STBY";
            case 3:
                return "ON";
            case 4:
                return "ALT";
        }
        return "IDENT";
    }
    setEditingCode(code) {
        this.code.value = code;
    }
    update(dt) {
        this.code.value = this.getSimCode();
        this.mode.value = this.getMode();
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
}

class AS1000_PFD_Transponder_View extends AS1000_HTML_View {
    /**
     * @param {AS1000_PFD_Transponder_Model} model 
     */
    setModel(model) {
        model.code.subscribe(code => this.elements.code.textContent = code);
        model.mode.subscribe(mode => this.elements.mode.textContent = mode);
    }
}
customElements.define("g1000-transponder", AS1000_PFD_Transponder_View);