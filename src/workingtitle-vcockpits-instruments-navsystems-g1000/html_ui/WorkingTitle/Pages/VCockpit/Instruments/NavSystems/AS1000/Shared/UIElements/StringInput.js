class WT_String_Input_Input_Layer extends Input_Layer {
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

class WT_String_Input extends HTMLElement {
    constructor() {
        super();
        this._value = "";
        this.elements = {
            characters: []
        };
        this.mode = "display";
        this.characters = [
            " ", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
        ];

        this._editingValue = 0;
        this._editingCharacterIndex = 0;

        this.addEventListener("selected", this.enter.bind(this));
    }
    get value() {
        return this._value.trim();
    }
    set value(value) {
        value = value || "";

        if (this._value !== value) {
            this._value = value;
            if (this.mode == "edit") {
                this._editingValue = value.padEnd(this.elements.characters.length, " ");
            }
            this.updateDisplay();
        }
    }
    updateDisplay() {
        let value = this._value;
        if (this.mode == "edit") {
            value = this._editingValue;
        }
        let stringValue = value;
        const fillCharacter = this.mode == "edit" ? "_" : " ";
        for (let i = 0; i < stringValue.length; i++) {
            this.elements.characters[i].textContent = stringValue[i] == " " ? fillCharacter : stringValue[i];
        }
        for (let i = stringValue.length; i < this.elements.characters.length; i++) {
            this.elements.characters[i].textContent = fillCharacter;
        }
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        for (let i = 0; i < this.getAttribute("characters"); i++) {
            let character = document.createElement("span");
            character.className = "character";
            this.elements.characters.push(character);
            this.appendChild(character);
        }
        this.value = this.getAttribute("value");
    }
    back() {
        this.exit();
    }
    enter(e) {
        let inputStack = e.detail.inputStack;
        let inputLayer = new WT_String_Input_Input_Layer(this);
        this.inputStackManipulator = inputStack.push(inputLayer);
        this.previousValue = this.value;
        this._editingValue = this._value.padEnd(this.elements.characters.length, " ");
        this._editingCharacterIndex = 0;
        this.elements.characters[this._editingCharacterIndex].setAttribute("state", "Selected");
        this.mode = "edit";
        this.updateDisplay();
    }
    confirm() {
        this.value = this._editingValue.trim();

        let evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", true, true);
        this.dispatchEvent(evt);
        this.updateDisplay();
        this.exit();
    }
    cancel() {
        this.value = this.previousValue;
        this.exit();
    }
    exit() {
        if (this.inputStackManipulator) {
            this.inputStackManipulator.pop();
            this.inputStackManipulator = null;
        }
        this.mode = "display";
        this.elements.characters[this._editingCharacterIndex].removeAttribute("state");
        this.updateDisplay();
    }
    selectNextCharacter() {
        this.elements.characters[this._editingCharacterIndex].removeAttribute("state");
        this._editingCharacterIndex = (this._editingCharacterIndex + 1) % this.elements.characters.length;
        this.elements.characters[this._editingCharacterIndex].setAttribute("state", "Selected");
    }
    selectPreviousCharacter() {
        this.elements.characters[this._editingCharacterIndex].removeAttribute("state");
        this._editingCharacterIndex = (this._editingCharacterIndex - 1 + this.elements.characters.length) % this.elements.characters.length;
        this.elements.characters[this._editingCharacterIndex].setAttribute("state", "Selected");
    }
    incrementCharacter(amount) {
        let stringValue = this._editingValue;
        let character = stringValue[this._editingCharacterIndex];
        let index = this.characters.indexOf(character);
        index = (index + amount + this.characters.length) % this.characters.length;
        character = this.characters[index];
        this._editingValue = stringValue.substr(0, this._editingCharacterIndex) + character + stringValue.substr(this._editingCharacterIndex + 1);
        this.updateDisplay();
    }
}
customElements.define("string-input", WT_String_Input);