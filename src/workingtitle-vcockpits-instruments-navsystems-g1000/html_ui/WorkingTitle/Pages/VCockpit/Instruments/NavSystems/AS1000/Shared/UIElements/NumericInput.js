class WT_Numeric_Input_Input_Layer extends Input_Layer {
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
        this.input.incrementDigit(1);
    }
    onSmallDec(inputStack) {
        this.input.incrementDigit(-1);
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

class WT_Numeric_Input extends HTMLElement {
    constructor() {
        super();
        this._value = null;
        this.min = null;
        this.max = null;
        this.increment = 1;
        this.elements = {
            digits: []
        };
        this.mode = "display";

        this._editingDigitIndex = 0;

        this.addEventListener("selected", this.enter.bind(this));
    }
    get value() {
        return this._value;
    }
    set value(value) {
        value = parseInt(value);
        if (this._value !== value) {
            this._value = value;
            let evt = document.createEvent("HTMLEvents");
            evt.initEvent("input", true, true);
            this.dispatchEvent(evt);
            this.updateDisplay();
        }
    }
    pad(num, size) {
        var s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }
    updateDisplay() {
        let value = this._value;
        switch (this.inputMode) {
            case "digit": {
                if (this.mode == "edit") {
                    let stringValue = value.toFixed(0).padStart(this.elements.digits.length, "0");
                    for (let i = 0; i < this.elements.digits.length; i++) {
                        this.elements.digits[i].textContent = stringValue[i];
                    }
                } else {
                    let stringValue = value.toFixed(0).padStart(this.elements.digits.length, "0");
                    let pastZeroes = false;
                    for (let i = 0; i < this.elements.digits.length; i++) {
                        let digit = stringValue[i];
                        if (digit != "0") {
                            pastZeroes = true;
                        }
                        this.elements.digits[i].textContent = pastZeroes ? digit : " ";
                    }
                }
                break;
            }
            case "full": {
                this.elements.digits[0].textContent = value;
                break;
            }
        }
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;
        if (this.hasAttribute("digits")) {
            for (let i = 0; i < this.getAttribute("digits"); i++) {
                let digit = document.createElement("span");
                digit.className = "digit";
                this.elements.digits.push(digit);
                this.appendChild(digit);
            }
            this.inputMode = "digit";
        } else {
            let digit = document.createElement("span");
            digit.className = "digit";
            this.elements.digits.push(digit);
            this.appendChild(digit);
            this.inputMode = "full";
        }
        if (this.hasAttribute("min")) {
            this.min = parseInt(this.getAttribute("min"));
        }
        if (this.hasAttribute("increment")) {
            this.increment = parseInt(this.getAttribute("increment"));
        }
        if (this.hasAttribute("max")) {
            this.max = parseInt(this.getAttribute("max"));
        }
        let units = this.getAttribute("units");
        if (units) {
            let unitsNode = document.createElement("span");
            unitsNode.style.fontSize = "0.8em";
            unitsNode.textContent = units;
            this.appendChild(unitsNode);
        }
        this.value = parseInt(this.getAttribute("value"));
    }
    back() {
        this.exit();
    }
    enter(e) {
        let inputStack = e.detail.inputStack;
        let inputLayer = new WT_Numeric_Input_Input_Layer(this);
        this.inputStackManipulator = inputStack.push(inputLayer);
        this.previousValue = this._value;
        this._editingDigitIndex = 0;
        this.elements.digits[this._editingDigitIndex].setAttribute("state", "Selected");
        this.mode = "edit";
        this.updateDisplay();
    }
    confirm() {
        let evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", true, true);
        this.dispatchEvent(evt);

        this.mode = "display";
        this.updateDisplay();
        this.exit();
    }
    cancel() {
        this.value = this.previousValue;
        this.mode = "display";
        this.updateDisplay();
        this.exit();
    }
    exit() {
        if (this.inputStackManipulator) {
            this.inputStackManipulator.pop();
            this.inputStackManipulator = null;
        }
        this.elements.digits[this._editingDigitIndex].removeAttribute("state");
    }
    clampValue(value) {
        if (this.min !== null)
            value = Math.max(this.min, value);
        if (this.max !== null)
            value = Math.min(this.max, value);
        return parseInt(value);
    }
    selectNextDigit() {
        switch (this.inputMode) {
            case "full": {
                this.incrementDigit(1);
                break;
            }
            case "digit": {
                this.elements.digits[this._editingDigitIndex].removeAttribute("state");
                this._editingDigitIndex = (this._editingDigitIndex + 1) % this.elements.digits.length;
                this.elements.digits[this._editingDigitIndex].setAttribute("state", "Selected");
                break;
            }
        }
    }
    selectPreviousDigit() {
        switch (this.inputMode) {
            case "full": {
                this.incrementDigit(-1);
                break;
            }
            case "digit": {
                this.elements.digits[this._editingDigitIndex].removeAttribute("state");
                this._editingDigitIndex = (this._editingDigitIndex - 1 + this.elements.digits.length) % this.elements.digits.length;
                this.elements.digits[this._editingDigitIndex].setAttribute("state", "Selected");
                break;
            }
        }
    }
    incrementDigit(amount) {
        switch (this.inputMode) {
            case "full": {
                this.value = this.clampValue(this.value + amount * this.increment);
                break;
            }
            case "digit": {
                let stringValue = this.pad(this.value, this.elements.digits.length);
                stringValue = stringValue.substr(0, this._editingDigitIndex) + ((parseInt(stringValue[this._editingDigitIndex]) + 10 + amount) % 10) + stringValue.substr(this._editingDigitIndex + 1);
                this.value = this.clampValue(parseInt(stringValue));
                break;
            }
        }
        this.updateDisplay();
    }
}
customElements.define("numeric-input", WT_Numeric_Input);