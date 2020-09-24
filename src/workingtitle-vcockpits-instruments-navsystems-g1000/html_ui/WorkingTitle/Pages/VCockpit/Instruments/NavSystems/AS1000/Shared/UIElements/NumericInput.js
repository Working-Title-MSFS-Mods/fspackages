class AS1000_Numeric_Input_Input_Layer extends Input_Layer {
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
        this.input.exit();
    }
    onEnter(inputStack) {
        this.input.confirm();
    }
}

class AS1000_Numeric_Input extends HTMLElement {
    constructor() {
        super();
        this._value = null;
        this.elements = {
            digits: []
        };
        this.mode = "display";

        this._editingValue = 0;
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
            this.updateDisplay();
        }
    }
    pad(num, size) {
        var s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }
    updateDisplay() {
        if (this.mode == "edit") {
            let value = this._editingValue;
            let stringValue = this.pad(value, this.elements.digits.length);
            for (let i = 0; i < this.elements.digits.length; i++) {
                this.elements.digits[i].textContent = stringValue[i];
            }
        } else {
            let value = this._value;
            let stringValue = this.pad(value, this.elements.digits.length);
            let pastZeroes = false;
            for (let i = 0; i < this.elements.digits.length; i++) {
                let digit = stringValue[i];
                if (digit != 0) {
                    pastZeroes = true;
                }
                this.elements.digits[i].textContent = (pastZeroes || digit > 0) ? digit : " ";
            }
        }
    }
    connectedCallback() {
        for (let i = 0; i < this.getAttribute("digits"); i++) {
            let digit = document.createElement("span");
            digit.className = "digit";
            this.elements.digits.push(digit);
            this.appendChild(digit);
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
        let inputLayer = new AS1000_Numeric_Input_Input_Layer(this);
        this.inputStackManipulator = inputStack.push(inputLayer);
        this._editingValue = this._value;
        this._editingDigitIndex = 0;
        this.elements.digits[this._editingDigitIndex].setAttribute("state", "Selected");
        this.mode = "edit";
        this.updateDisplay();
    }
    confirm() {
        this.value = this._editingValue;

        let evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", true, true);
        this.dispatchEvent(evt);
        this.updateDisplay();
        this.exit();
    }
    exit() {
        if (this.inputStackManipulator) {
            this.inputStackManipulator.pop();
            this.inputStackManipulator = null;
        }
        this.mode = "display";
        this.elements.digits[this._editingDigitIndex].removeAttribute("state");
    }
    selectNextDigit() {
        this.elements.digits[this._editingDigitIndex].removeAttribute("state");
        this._editingDigitIndex = (this._editingDigitIndex + 1) % this.elements.digits.length;
        this.elements.digits[this._editingDigitIndex].setAttribute("state", "Selected");
    }
    selectPreviousDigit() {
        this.elements.digits[this._editingDigitIndex].removeAttribute("state");
        this._editingDigitIndex = (this._editingDigitIndex - 1 + this.elements.digits.length) % this.elements.digits.length;
        this.elements.digits[this._editingDigitIndex].setAttribute("state", "Selected");
    }
    incrementDigit(amount) {
        let stringValue = this.pad(this._editingValue, this.elements.digits.length);
        stringValue = stringValue.substr(0, this._editingDigitIndex) + ((parseInt(stringValue[this._editingDigitIndex]) + 10 + amount) % 10) + stringValue.substr(this._editingDigitIndex + 1);
        this._editingValue = parseInt(stringValue);
        this.updateDisplay();
    }
}
customElements.define("numeric-input", AS1000_Numeric_Input);