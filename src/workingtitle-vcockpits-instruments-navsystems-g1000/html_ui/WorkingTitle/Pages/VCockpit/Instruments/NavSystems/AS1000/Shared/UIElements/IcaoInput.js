class WT_Icao_Input_Input_Layer extends Input_Layer {
    constructor(input) {
        super();
        this.input = input;
    }
    onLargeInc(inputStack) {
        this.input.selectNextCharacter();
    }
    onLargeDec(inputStack) {
        this.input.selectPreviousCharacter();
    }
    onSmallInc(inputStack) {
        this.input.incrementCharacter(1);
    }
    onSmallDec(inputStack) {
        this.input.incrementCharacter(-1);
    }
    onNavigationPush(inputStack) {
        this.input.cancel();
    }
    onCLR(inputStack) {
        this.input.cancel();
    }
    onEnter(inputStack) {
        this.input.confirm();
    }
}

class WT_Icao_Input extends HTMLElement {
    constructor() {
        super();
        this._ident = null;
        this._icao = null;
        this.elements = {
            characters: []
        };
        this.active = false;
        this.editingPosition = null;

        this.addEventListener("selected", this.enter.bind(this));
    }
    set ident(value) {
        if (this._ident !== value) {
            this._ident = value;
            this.updateDisplay();
        }
    }
    get ident() {
        return this._ident;
    }
    set icao(icao) {
        this._icao = icao;
        if (this._icao) {
            SimVar.SetSimVarValue("C:fs9gps:IcaoSearchInitialIcao", "string", this.icao, this.instrumentIdentifier);
        }
    }
    get icao() {
        return this._icao;
    }
    get instrumentIdentifier() {
        return "icao-search-knighty"; //TODO: Need a team scheme for this maybe
    }
    get value() {
        return this.icao;
    }
    updateDisplay() {
        let value = this._ident ? this._ident : "";
        for (let i = 0; i < value.length; i++) {
            this.elements.characters[i].textContent = value[i] == " " ? "_" : value[i];
        }
        for (let i = value.length; i < this.elements.characters.length; i++) {
            this.elements.characters[i].textContent = "_";
        }
    }
    selectEditingPosition(character) {
        if (this.editingPosition !== null) {
            this.elements.characters[this.editingPosition].removeAttribute("state");
        }
        this.editingPosition = character;
        if (this.editingPosition !== null) {
            this.elements.characters[this.editingPosition].setAttribute("state", "Selected");
        }
    }
    updateFromSimVars() {
        let icao = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcao", "string", this.instrumentIdentifier);
        if (this._icao != icao) {
            this._icao = icao;
            let evt = document.createEvent("HTMLEvents");
            evt.initEvent("input", true, true);
            this.dispatchEvent(evt);
        }

        this.ident = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIdent", "string", this.instrumentIdentifier);
        this.selectEditingPosition(SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCursorPosition", "number", this.instrumentIdentifier));
    }
    connectedCallback() {
        for (let i = 0; i < this.getAttribute("characters"); i++) {
            let character = document.createElement("span");
            character.className = "character";
            this.elements.characters.push(character);
            this.appendChild(character);
        }
        this.icao = this.getAttribute("value");
        this.updateDisplay();
    }
    back() {
        this.exit();
    }
    enter(e) {
        let inputStack = e.detail.inputStack;
        let inputLayer = new WT_Icao_Input_Input_Layer(this);
        this.inputStackManipulator = inputStack.push(inputLayer);

        if (this.icao) {
            SimVar.SetSimVarValue("C:fs9gps:IcaoSearchInitialIcao", "string", this.icao, this.instrumentIdentifier);
        }
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchStartCursor", "string", "A", this.instrumentIdentifier);

        let cb = () => {
            if (this.active) {
                this.updateFromSimVars();
                requestAnimationFrame(cb);
            }
        }
        this.active = true;
        requestAnimationFrame(cb);

        this.updateDisplay();
    }
    confirm() {
        this.active = false;

        let evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", true, true);
        this.dispatchEvent(evt);
        this.exit();
    }
    cancel() {
        //TODO: Reset to old value on cancel
        this.exit();
    }
    exit() {
        this.active = false;
        this.selectEditingPosition(null);

        if (this.inputStackManipulator) {
            this.inputStackManipulator.pop();
            this.inputStackManipulator = null;
        }
    }
    selectNextCharacter() {
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchAdvanceCursor", "number", 1, this.instrumentIdentifier);
    }
    selectPreviousCharacter() {
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchAdvanceCursor", "number", -1, this.instrumentIdentifier);
    }
    incrementCharacter(amount) {
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchAdvanceCharacter", "number", amount, this.instrumentIdentifier);
    }
}
customElements.define("icao-input", WT_Icao_Input);