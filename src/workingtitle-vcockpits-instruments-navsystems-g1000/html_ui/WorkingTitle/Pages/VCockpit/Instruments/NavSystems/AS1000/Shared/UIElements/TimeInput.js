class WT_Time_Input_Input_Layer extends Input_Layer {
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
    onCLR(inputStack) {
        this.input.cancel();
    }
}

class WT_Time_Input extends HTMLElement {
    constructor() {
        super();
        this.elements = {
            hours: null,
            minutes: null,
            seconds: null,
            digits: []
        };

        this.positive = true;
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;

        this.showSeconds = true;
        this.allowNegative = false;

        this.previousValue = 0;
        this._editingValue = 0;
        this._editingDigitIndex = 0;

        this.addEventListener("selected", this.enter.bind(this));
    }
    get value() {
        return (this.hours * 3600 + this.minutes * 60 + this.seconds) * (this.positive ? 1 : -1);
    }
    set value(value) {
        value = parseInt(value);
        this.hours = Math.floor(value / 3600);
        this.minutes = Math.floor((value % 3600) / 60);
        this.seconds = Math.floor(value % 60);
        this.updateDisplay();
    }
    pad(num, size) {
        var s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }
    updateDisplay() {
        if (this.elements.sign) {
            this.elements.sign.textContent = this.positive ? "+" : "-";
        }
        this.elements.hours.textContent = Math.floor(this.hours).toFixed(0);//.padStart("0", 2);
        this.elements.minutes.textContent = Math.floor(this.minutes).toFixed(0).padStart(2, "0");
        if (this.showSeconds) {
            this.elements.seconds.textContent = Math.floor(this.seconds).toFixed(0).padStart(2, "0");
        }
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        if (this.getAttribute("allow-negative")) {
            this.allowNegative = true;
            this.elements.sign = document.createElement("span");
            this.elements.sign.className = "digit";
            this.elements.sign.dataset.number = "sign";
            this.elements.digits.push(this.elements.sign);
            this.appendChild(this.elements.sign);
        }

        this.elements.hours = document.createElement("span");
        this.elements.hours.className = "digit";
        this.elements.hours.dataset.number = "hours";
        this.elements.digits.push(this.elements.hours);
        this.appendChild(this.elements.hours);

        {
            let colon = document.createElement("span");
            colon.textContent = ":";
            this.appendChild(colon);
        }
        this.elements.minutes = document.createElement("span");
        this.elements.minutes.className = "digit";
        this.elements.minutes.dataset.number = "minutes";
        this.elements.digits.push(this.elements.minutes);
        this.appendChild(this.elements.minutes);

        this.showSeconds = this.hasAttribute("show-seconds") ? (this.getAttribute("show-seconds") == "true") : true;
        if (this.showSeconds) {
            {
                let colon = document.createElement("span");
                colon.textContent = ":";
                this.appendChild(colon);
            }
            this.elements.seconds = document.createElement("span");
            this.elements.seconds.className = "digit";
            this.elements.seconds.dataset.number = "seconds";
            this.elements.digits.push(this.elements.seconds);
            this.appendChild(this.elements.seconds);
        }

        this.value = parseInt(this.getAttribute("value"));
    }
    back() {
        this.exit();
    }
    enter(e) {
        this.previousValue = this.value;
        let inputStack = e.detail.inputStack;
        let inputLayer = new WT_Time_Input_Input_Layer(this);
        this.inputStackManipulator = inputStack.push(inputLayer);
        this._editingDigitIndex = 0;
        this.elements.digits[this._editingDigitIndex].setAttribute("state", "Selected");
        this.updateDisplay();

        let evt = document.createEvent("HTMLEvents");
        evt.initEvent("focus", true, true);
        this.dispatchEvent(evt);
    }
    cancel() {
        this.value = this.previousValue;
        this.exit();
    }
    confirm() {
        let evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", true, true);
        this.dispatchEvent(evt);
        this.exit();
    }
    exit() {
        if (this.inputStackManipulator) {
            this.inputStackManipulator.pop();
            this.inputStackManipulator = null;
        }
        this.elements.digits[this._editingDigitIndex].removeAttribute("state");

        let evt = document.createEvent("HTMLEvents");
        evt.initEvent("blur", true, true);
        this.dispatchEvent(evt);
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
        let digit = this.elements.digits[this._editingDigitIndex];
        switch (digit.dataset.number) {
            case "sign":
                this.positive = !this.positive;
            case "hours":
                this.hours = (this.hours + amount + 24) % 24;
                break;
            case "minutes":
                this.minutes = (this.minutes + amount + 60) % 60;
                break;
            case "seconds":
                this.seconds = (this.seconds + amount + 60) % 60;
                break;
        }
        this.updateDisplay();

        let evt = document.createEvent("HTMLEvents");
        evt.initEvent("input", true, true);
        this.dispatchEvent(evt);
    }
}
customElements.define("time-input", WT_Time_Input);