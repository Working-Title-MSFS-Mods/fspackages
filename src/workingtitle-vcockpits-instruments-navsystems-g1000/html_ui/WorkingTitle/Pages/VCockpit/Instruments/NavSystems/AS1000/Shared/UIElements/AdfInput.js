class WT_Adf_Input_Input_Layer extends Input_Layer {
    constructor(input) {
        super();
        this.input = input;
    }
    onLargeInc(inputStack) {
        this.input.selectNextDigit();
    }
    onLargeDec(inputStack) {
        this.input.selectPreviousDigit();
    }
    onSmallInc(inputStack) {
        this.input.incrementDigit();
    }
    onSmallDec(inputStack) {
        this.input.decrementDigit();
    }
    onNavigationPush(inputStack) {
        this.input.cancel();
    }
    onEnter(inputStack) {
        this.input.confirm();
    }
    onCLR(inputStack) {
        this.input.cancel();
    }
}

class WT_Adf_Input extends HTMLElement {
    constructor() {
        super();
        this._value = null;
        this.elements = {
            digits: [],
            editableDigits: []
        };
        this._editingDigitIndex = 0;
        this.isVisible = true;

        this.addEventListener("increment", this.enter.bind(this));
    }
    get value() {
        return SimVar.GetSimVarValue("ADF STANDBY FREQUENCY:1", "KHz");
    }
    updateDisplay() {
        const value = this.value;
        const stringValue = value.toFixed(1).padStart(5, "0");
        const firstCharLength = stringValue.length == 6 ? 2 : 1;
        let char = 0;
        for (let i = 0; i < this.elements.digits.length; i++) {
            this.elements.digits[i].textContent = i == 0 ? stringValue.substr(0, firstCharLength) : stringValue[char];
            char += i == 0 ? firstCharLength : 1;
        }
    }
    confirm() {
        this.exit();
    }
    cancel() {
        this.exit();
    }
    enter(e) {
        const inputStack = e.detail.inputStack;
        const inputLayer = new WT_Adf_Input_Input_Layer(this);
        this.inputHandle = inputStack.push(inputLayer);
        this._editingDigitIndex = 0;
        this.elements.editableDigits[this._editingDigitIndex].setAttribute("state", "Selected");
        this.updateDisplay();
    }
    exit() {
        if (this.inputHandle) {
            this.inputHandle = this.inputHandle.pop();
        }
        this.elements.editableDigits[this._editingDigitIndex].removeAttribute("state");
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;
        this.isVisible = true;

        const addDigit = (position = null) => {
            let digit = document.createElement("span");
            digit.className = "digit";
            if (position !== null) {
                digit.dataset.position = position;
                this.elements.editableDigits.push(digit);
            }
            this.elements.digits.push(digit);
            this.appendChild(digit);
        };

        addDigit(0);
        addDigit(1);
        addDigit(2);
        addDigit(null);
        addDigit(3);

        this.updateDisplay();

        const frame = () => {
            this.updateDisplay();
            if (this.isVisible)
                requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }
    selectNextDigit() {
        this.elements.editableDigits[this._editingDigitIndex].removeAttribute("state");
        this._editingDigitIndex = (this._editingDigitIndex + 1) % this.elements.editableDigits.length;
        this.elements.editableDigits[this._editingDigitIndex].setAttribute("state", "Selected");
    }
    selectPreviousDigit() {
        this.elements.editableDigits[this._editingDigitIndex].removeAttribute("state");
        this._editingDigitIndex = (this._editingDigitIndex + this.elements.editableDigits.length - 1) % this.elements.editableDigits.length;
        this.elements.editableDigits[this._editingDigitIndex].setAttribute("state", "Selected");
    }
    _modifyDigit(operation) {
        const digit = this.elements.editableDigits[this._editingDigitIndex];
        switch (parseInt(digit.dataset.position)) {
            case 0:
                SimVar.SetSimVarValue(`K:ADF_100_${operation}`, "number", 1);
                break;
            case 1:
                SimVar.SetSimVarValue(`K:ADF_10_${operation}`, "number", 1);
                break;
            case 2:
                SimVar.SetSimVarValue(`K:ADF_1_${operation}`, "number", 1);
                break;
            case 3:
                SimVar.SetSimVarValue(`K:ADF1_RADIO_TENTHS_${operation}`, "number", 1);
                break;
        }
    }
    incrementDigit() {
        this._modifyDigit("INC");
    }
    decrementDigit() {
        this._modifyDigit("DEC");
    }
}
customElements.define("adf-input", WT_Adf_Input);