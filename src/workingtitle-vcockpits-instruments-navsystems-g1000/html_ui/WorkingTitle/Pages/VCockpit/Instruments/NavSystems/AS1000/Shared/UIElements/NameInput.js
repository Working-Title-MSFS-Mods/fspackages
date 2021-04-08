class WT_Name_Input_Input_Layer extends Input_Layer {
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

class WT_Show_Duplicates_Handler {
    show(icaos) {
        throw new Error(`WT_Show_Duplicates_Handler.show not implemented`);
    }
}

class WT_Name_Input extends HTMLElement {
    constructor() {
        super();
        this._icao = null;
        this._name = null;
        this.type = null;
        this.elements = {
            characters: []
        };
        this.active = false;
        this.editingPosition = null;

        this.addEventListener("selected", this.enter.bind(this));
        this.addEventListener("decrement", e => {
            this.showQuickSelect(e.detail.inputStack).then((icao) => {
                this.icao = icao;
                this.confirm(false);
            });
        });
    }
    set icao(icao) {
        this._icao = icao;
    }
    get icao() {
        return this._icao;
    }
    set name(name) {
        this._name = name;
        if (this._name) {
            this.updateDisplay();
        }
    }
    get name() {
        return this._name;
    }
    get instrumentIdentifier() {
        return "icao-search-knighty"; //TODO: Need a team scheme for this maybe
    }
    setEditingSimVars() {
        SimVar.SetSimVarValue("C:fs9gps:NameSearchInitialIcao", "string", this.icao ? this.icao : "", this.instrumentIdentifier);
        SimVar.SetSimVarValue("C:fs9gps:NameSearchStartCursor", "string", this.type, this.instrumentIdentifier);
    }
    updateDisplay() {
        let value = this._name;
        for (let i = 0; i < value.length && i < this.elements.characters.length; i++) {
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
        const icao = SimVar.GetSimVarValue("C:fs9gps:NameSearchCurrentIcao", "string", this.instrumentIdentifier);
        const name = SimVar.GetSimVarValue("C:fs9gps:NameSearchCurrentName", "string", this.instrumentIdentifier);
        if (this._name != name) {
            this._name = name;
            let evt = document.createEvent("HTMLEvents");
            evt.initEvent("input", true, true);
            this.dispatchEvent(evt);
        }

        this.selectEditingPosition(SimVar.GetSimVarValue("C:fs9gps:NameSearchCursorPosition", "number", this.instrumentIdentifier));
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        this.quickSelect = document.createElement("waypoint-quick-select");
        this.appendChild(this.quickSelect);

        for (let i = 0; i < 30; i++) {
            const character = document.createElement("span");
            character.className = "character";
            this.elements.characters.push(character);
            this.appendChild(character);
        }
        this.icao = this.getAttribute("value");
        this.type = this.hasAttribute("type") ? this.getAttribute("type") : "A";
        this.updateDisplay();
    }
    disconnectedCallback() {
        if (this.cancelDuplicates) {
            this.cancelDuplicates();
            this.cancelDuplicates = null;
        }
    }
    back() {
        this.exit();
    }
    enter(e) {
        let inputStack = e.detail.inputStack;
        let inputLayer = new WT_Name_Input_Input_Layer(this);
        this.inputStackManipulator = inputStack.push(inputLayer);

        this.setEditingSimVars();

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
    async confirm() {
        this.active = false;

        const evt = document.createEvent("HTMLEvents");
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
        SimVar.SetSimVarValue("C:fs9gps:NameSearchAdvanceCursor", "number", 1, this.instrumentIdentifier);
    }
    selectPreviousCharacter() {
        SimVar.SetSimVarValue("C:fs9gps:NameSearchAdvanceCursor", "number", -1, this.instrumentIdentifier);
    }
    incrementCharacter(amount) {
        SimVar.SetSimVarValue("C:fs9gps:NameSearchAdvanceCharacter", "number", amount, this.instrumentIdentifier);
    }
}
customElements.define("name-input", WT_Name_Input);