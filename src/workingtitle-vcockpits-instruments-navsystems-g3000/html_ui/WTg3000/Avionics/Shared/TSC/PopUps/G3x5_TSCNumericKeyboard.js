class WT_G3x5_TSCNumericKeyboard extends WT_G3x5_TSCPopUpElement {
    /**
     * @readonly
     * @type {WT_G3x5_TSCNumericKeyboardHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCNumericKeyboardHTMLElement();
    }

    onInit() {
        this._htmlElement = this._createHTMLElement();
        this.popUpWindow.appendChild(this.htmlElement);
    }

    _activateEnterButton() {
        this.instrument.activateNavButton(6, "Enter", this._onEnterPressed.bind(this), true, "ICON_TSC_BUTTONBAR_ENTER.png");
    }

    _deactivateEnterButton() {
        this.instrument.deactivateNavButton(6, true);
    }

    _activateNavButtons() {
        super._activateNavButtons();

        this._activateEnterButton();
    }

    _deactivateNavButtons() {
        super._activateNavButtons();

        this._deactivateEnterButton();
    }

    _isValueInRange(value) {
        if (this.context.unit) {
            return (!this.context.minValue || value.compare(this.context.minValue) >= 0) && (!this.context.maxValue || value.compare(this.context.maxValue) <= 0);
        } else {
            return (this.context.minValue === undefined || value >= this.context.minValue) && (this.context.maxValue === undefined || value <= this.context.maxValue);
        }
    }

    _onEnterPressed() {
        let value = this.htmlElement.getValue();
        if (this._isValueInRange(value)) {
            this.context.valueEnteredCallback(value);
            this.instrument.goBack();
        } else {
            this.htmlElement.showInvalidWindow(this.context.minValue, this.context.maxValue);
            this._deactivateEnterButton();
        }
    }

    _onBackPressed() {
        if (this.htmlElement.isInvalidWindowVisible) {
            this.htmlElement.hideInvalidWindow();
            this._activateEnterButton();
        } else {
            this.instrument.goBack();
        }
    }

    onEnter() {
        super.onEnter();

        this.setTitle(this.context.title);
        this.htmlElement.setContext({
            digitCount: this.context.digitCount,
            decimalPlaces: this.context.decimalPlaces,
            positiveOnly: this.context.positiveOnly,
            unit: this.context.unit,
            initialValue: this.context.initialValue
        });
        this.htmlElement.open();
    }

    onExit() {
        super.onExit();

        this.htmlElement.close();
    }
}

class WT_G3x5_TSCNumericKeyboardHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._digitDisplays = [];
        this._replace = false;
        this._placesEntered = 0;
        this._isInvalidWindowVisible = false;

        /**
         * @type {WT_NumberUnit}
         */
        this._value = null;

        /**
         * @type {WT_G3x5_TSCNumericKeyboardContext}
         */
        this._context = null;
        this._isOpen = false;
        this._isInit = false;

        this._initFormatter();
    }

    _getTemplate() {
        return WT_G3x5_TSCNumericKeyboardHTMLElement.TEMPLATE;
    }

    _initFormatter() {
        this._formatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter({
            forceDecimalZeroes: true,
            unitCaps: true,
        }), {
            numberUnitDelim: "",
            classGetter: {
                _numberClassList: [],
                _unitClassList: [WT_G3x5_TSCNumericKeyboardHTMLElement.UNIT_CLASS],

                getNumberClassList() {
                    return this._numberClassList;
                },
                getUnitClassList() {
                    return this._unitClassList;
                }
            }
        });
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInitialized() {
        return this._isInit;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInvalidWindowVisible() {
        return this._isInvalidWindowVisible;
    }

    /**
     *
     * @returns {WT_NumberUnitReadOnly}
     */
    getValue() {
        return (this._value !== null) ? (this._context.unit ? this._value.readonly() : this._value) : null;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector("#wrapper");
        this._display = this.shadowRoot.querySelector("#display");
        this._unit = this.shadowRoot.querySelector("#unit span");
        this._minValueDisplay = this.shadowRoot.querySelector("#minvalue");
        this._maxValueDisplay = this.shadowRoot.querySelector("#maxvalue");

        [
            this._numeralButtons,
            this._dotButton,
            this._backspaceButton,
            this._negativeButton,
            this._positiveButton
        ] = await Promise.all([
            Promise.all([...Array(10)].map((value, index) => WT_CustomElementSelector.select(this.shadowRoot, `#button${index}`, WT_TSCLabeledButton))),
            WT_CustomElementSelector.select(this.shadowRoot, "#buttonDot", WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, "#backspace", WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, "#negative", WT_TSCStatusBarButton),
            WT_CustomElementSelector.select(this.shadowRoot, "#positive", WT_TSCStatusBarButton)
        ]);
    }

    _initButtons() {
        this._numeralButtons.forEach((button, index) => button.addButtonListener(this._onKeyboardButtonPressed.bind(this, index)));
        this._dotButton.addButtonListener(this._onKeyboardButtonPressed.bind(this, "."));
        this._backspaceButton.addButtonListener(this._onBackspaceButtonPressed.bind(this));
        this._negativeButton.addButtonListener(this._onNegativeButtonPressed.bind(this));
        this._positiveButton.addButtonListener(this._onPositiveButtonPressed.bind(this));
    }

    _initDigitsRecycler() {
        this._digitsRecycler = new WT_SimpleHTMLElementRecycler(this._display, "div", element => element.classList.add("displayItem", "digit"));
    }

    _initChildren() {
        this._initDigitsRecycler();
        this._initButtons();
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initChildren();
        this._isInit = true;
        if (this._isOpen) {
            this._onOpen();
        }
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateFromContext() {

    }

    setContext(context) {
        this._context = context;
        this._updateFromContext();
    }

    _setInvalidWindowVisible(value) {
        this._wrapper.setAttribute("invalid", `${value}`);
        this._isInvalidWindowVisible = value;
    }

    _setInvalidValue(display, value) {
        if (this._context.unit) {
            display.innerHTML = this._formatter.getFormattedHTML(value, this._context.unit);
        } else {
            display.innerHTML = value.toFixed(this._context.decimalPlaces);
        }
    }

    showInvalidWindow(minValue, maxValue) {
        this._setInvalidValue(this._minValueDisplay, minValue);
        this._setInvalidValue(this._maxValueDisplay, maxValue);
        this._setInvalidWindowVisible(true);
    }

    hideInvalidWindow() {
        this._setInvalidWindowVisible(false);
    }

    _setReplace(value) {
        this._replace = value;
        this._wrapper.setAttribute("replace", `${value}`);
    }

    _setPlacesEntered(count) {
        count = Math.max(0, Math.min(this._digitDisplays.length, count));
        for (let i = 0; i < this._digitDisplays.length; i++) {
            if (i < count) {
                this._digitDisplays[i].setAttribute("entered", "true");
            } else {
                this._digitDisplays[i].setAttribute("entered", "false");
            }
        }
        this._placesEntered = count;
    }

    _resetDigits() {
        this._digitDisplays.forEach(digit => digit.textContent = "0");
        this._setPlacesEntered(0);
    }

    _shiftDigits(places) {
        if (places === 0) {
            return;
        }

        let start = places < 0 ? -places : (this._digitDisplays.length - 1 - places);
        let end = places < 0 ? this._digitDisplays.length : -1;
        let delta = -Math.sign(places);

        for (let i = start; Math.sign(end - i) === delta; i += delta) {
            let from = this._digitDisplays[i];
            let to = this._digitDisplays[i + places];
            to.textContent = from.textContent;
            from.textContent = "0";
        }
    }

    _setDigitText(place, digitText) {
        if (place < 0 || place >= this._digitDisplays.length) {
            return;
        }

        this._digitDisplays[place].textContent = digitText;
    }

    _updateValueFromDigits() {
        let text = this._digitDisplays.map(display => display.textContent).reverse().join("");
        let number = parseFloat(text);
        if (this._isNegative) {
            number *= -1;
        }

        if (this._context.unit) {
            this._value.set(number);
        } else {
            this._value = number;
        }
    }

    _onKeyboardButtonPressed(digit, button) {
        if (this._replace) {
            this._resetDigits();
            this._setReplace(false);
        } else {
            if (this._placesEntered === this._digitDisplays.length) {
                // maximum number of digits already entered.
                return;
            }

            let decimalIndex = this._digitDisplays.findIndex(display => display.textContent === ".");
            if (digit === "." && decimalIndex >= 0) {
                // can't add more than one decimal point to a number
                return;
            }
            if (decimalIndex >= this._context.decimalPlaces) {
                return;
            }

            this._shiftDigits(1);
        }

        if (digit === "." && this._placesEntered === 0) {
            // attempting to add decimal point at beginning of number -> automatically add "0" before the decimal point
            this._setPlacesEntered(1);
        }

        this._setDigitText(0, digit);
        this._updateValueFromDigits();
        this._setPlacesEntered(this._placesEntered + 1);
    }

    _onBackspaceButtonPressed(button) {
        if (this._replace) {
            this._resetDigits();
            this._updateValueFromDigits();
            this._setReplace(false);
        } else {
            this._shiftDigits(-1);
            this._updateValueFromDigits();
            this._setPlacesEntered(this._placesEntered - 1);
        }
    }

    _updateSignButtons() {
        this._negativeButton.toggle = this._isNegative ? "on" : "off";
        this._positiveButton.toggle = this._isNegative ? "off" : "on";
    }

    _setNegative(value) {
        this._isNegative = value;
        if (this._context.unit) {
            this._value.abs(true).scale(value ? -1 : 1, true);
        } else {
            this._value = Math.abs(this._value) * (value ? -1 : 1);
        }
        this._wrapper.setAttribute("negative", `${value}`);
        this._updateSignButtons();
    }

    _onNegativeButtonPressed(button) {
        this._setNegative(true);
    }

    _onPositiveButtonPressed(button) {
        this._setNegative(false);
    }

    _initFormatterOnOpen() {
        if (this._context.unit) {
            this._formatter.numberFormatter.precision = 10 ** -this._context.decimalPlaces;
        }
    }

    _initSignButtonVisibilityOnOpen() {
        this._wrapper.setAttribute("positiveonly", `${Boolean(this._context.positiveOnly)}`);
    }

    _initDotButtonVisibilityOnOpen() {
        this._wrapper.setAttribute("allowdecimal", `${this._context.decimalPlaces > 0}`);
    }

    _initDigitsOnOpen() {
        for (let i = 0; i < this._context.digitCount; i++) {
            let digit = this._digitsRecycler.request();
            digit.style.order = -i;
            digit.setAttribute("place", `${i}`);
            digit.setAttribute("entered", "false");
            this._digitDisplays[i] = digit;
        }
    }

    _updateDigitsFromValue() {
        let number = this._context.unit ? this._value.number : this._value;
        let valueText = Math.abs(number).toFixed(this._context.decimalPlaces);
        for (let i = 0; i < this._digitDisplays.length; i++) {
            let digitText = i < valueText.length ? valueText[valueText.length - 1 - i] : "0";
            this._setDigitText(i, digitText);
        }
        this._setPlacesEntered(valueText.length);
        this._setNegative(number < 0);
    }

    _initValueOnOpen() {
        if (this._context.unit) {
            this._value = this._context.unit.createNumber(this._context.initialValue.asUnit(this._context.unit));
        } else {
            this._value = this._context.initialValue;
        }

        if (this._context.positiveOnly) {
            if (this._context.unit) {
                this._value.abs(true);
            } else {
                this._value = Math.abs(this._value);
            }
        }

        this._updateDigitsFromValue();
    }

    _initUnitOnOpen() {
        if (this._context.unit) {
            this._unit.textContent = this._context.unit.abbrevName.toUpperCase();
        } else {
            this._unit.textContent = "";
        }
    }

    _onOpen() {
        this._initFormatterOnOpen();
        this._initSignButtonVisibilityOnOpen();
        this._initDotButtonVisibilityOnOpen();
        this._initDigitsOnOpen();
        this._initValueOnOpen();
        this._initUnitOnOpen();
        this._setReplace(true);
    }

    open() {
        this._isOpen = true;
        if (!this._isInit || !this._context) {
            return;
        }

        this._onOpen();
    }

    _cleanUpDigits() {
        this._digitsRecycler.recycleAll();
        this._digitDisplays = [];
    }

    close() {
        this._cleanUpDigits();
        this._isOpen = false;
    }
}
WT_G3x5_TSCNumericKeyboardHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_TSCNumericKeyboardHTMLElement.NAME = "wt-tsc-numkeyboard";
WT_G3x5_TSCNumericKeyboardHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCNumericKeyboardHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 5px;
            background: linear-gradient(#1f3445, black 25px);
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        @keyframes blink {
            0% {
                background: var(--wt-g3x5-lightblue);
            }
            50% {
                background: transparent;
            }
            100% {
                background: var(--wt-g3x5-lightblue);
            }
        }

        #wrapper {
            position: absolute;
            left: var(--numkeyboard-padding-left, 0.5em);
            top: var(--numkeyboard-padding-top, 0.5em);
            width: calc(100% - var(--numkeyboard-padding-left, 0.5em) - var(--numkeyboard-padding-right, 0.5em));
            height: calc(100% - var(--numkeyboard-padding-top, 0.5em) - var(--numkeyboard-padding-bottom, 0.5em));
            color: white;
        }
            #display {
                position: absolute;
                left: calc((100% - var(--numkeyboard-display-width, 50%)) / 2 + var(--numkeyboard-display-horizontal-offset, -10%));
                top: 0%;
                width: var(--numkeyboard-display-width, 50%);
                height: var(--numkeyboard-display-height, 1.5em);
                display: flex;
                flex-flow: row nowrap;
                justify-content: center;
                align-items: center;
                color: var(--wt-g3x5-lightblue);
                background: #222222;
            }
                #wrapper[replace="true"] .displayItem {
                    color: black;
                    background: var(--wt-g3x5-lightblue);
                }
                .digit[entered="false"] {
                    color: #083f42;
                }
                #wrapper[replace="true"] #display .digit[entered="false"] {
                    color: #bebebe;
                }
                #negativesign {
                    order: -99;
                    visibility: hidden;
                }
                #wrapper[negative="true"] #negativesign {
                    visibility: visible;
                }
                #cursor {
                    width: var(--numkeyboard-cursor-width, 0.1em);
                    color: transparent;
                    order: 1;
                }
                #wrapper[replace="true"] #cursor {
                    background: var(--wt-g3x5-lightblue);
                }
                #wrapper[replace="false"] #cursor {
                    animation: blink 1s infinite step-end;
                }
                #unit {
                    order: 2;
                }
                    #unit span {
                        font-size: var(--numkeyboard-display-unit-font-size, 0.75em);
                    }
            #keyboard {
                position: absolute;
                left: calc((100% - var(--numkeyboard-keyboard-width, 60%)) / 2 + var(--numkeyboard-keyboard-horizontal-offset, -10%));
                top: calc(var(--numkeyboard-display-height, 1.5em) + var(--numkeyboard-display-margin-bottom, 0.2em));
                width: var(--numkeyboard-keyboard-width, 60%);
                height: calc(100% - var(--numkeyboard-display-height, 1.5em) - var(--numkeyboard-display-margin-bottom, 0.2em));
                display: grid;
                grid-template-rows: repeat(4, 1fr);
                grid-template-columns: repeat(3, 1fr);
                grid-gap: var(--numkeyboard-keyboard-grid-gap, 0.2em);
                justify-items: center;
                align-items: center;
            }
                .keyboardButton {
                    width: var(--numkeyboard-button-size, 1.5em);
                    height: var(--numkeyboard-button-size, 1.5em);
                    font-size: var(--numkeyboard-button-font-size, 1.25em);
                    border-radius: 50%;
                }
                #button0 {
                    grid-area: 4 / 2;
                }
                #buttonDot {
                    display: none;
                    grid-area: 4 / 3;
                }
                #wrapper[allowdecimal="true"] #buttonDot {
                    display: block;
                }
            #backspace {
                position: absolute;
                left: var(--numkeyboard-bksp-button-left, 75%);
                top: var(--numkeyboard-bksp-button-top, 0%);
                width: var(--numkeyboard-bksp-button-width, 3em);
                height: var(--numkeyboard-bksp-button-height, 3em);
                font-size: var(--numkeyboard-bksp-button-font-size, 0.6em);
                --button-img-label-top: 65%;
                --button-img-label-height: 30%;
                --button-img-image-top: -12.5%;
                --button-img-image-height: 90%;
            }
            #wrapper[positiveonly="true"] .signbutton {
                display: none;
            }
            #negative {
                position: absolute;
                left: var(--numkeyboard-negative-button-left, 75%);
                top: var(--numkeyboard-negative-button-top, 50%);
                width: var(--numkeyboard-negative-button-width, 6em);
                height: var(--numkeyboard-negative-button-height, 3em);
                font-size: var(--numkeyboard-negative-button-font-size, 0.6em);
            }
            #positive {
                position: absolute;
                left: var(--numkeyboard-positive-button-left, 75%);
                top: var(--numkeyboard-positive-button-top, calc(var(--numkeyboard-negative-button-top, 50%) + var(--numkeyboard-negative-button-height, 3em) + 0.5em));
                width: var(--numkeyboard-positive-button-width, 6em);
                height: var(--numkeyboard-positive-button-height, 3em);
                font-size: var(--numkeyboard-positive-button-font-size, 0.6em);
            }
            #invalid {
                display: none;
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
            }
            #wrapper[invalid="true"] #invalid {
                display: block;
            }
                #invalidtext {
                    position: absolute;
                    left: 0%;
                    top: 50%;
                    width: 100%;
                    transform: translateY(-50%);
                    padding: var(--timekeyboard-invalid-padding, 0.5em);
                    text-align: center;
                    font-size: var(--numkeyboard-invalid-font-size, 0.75em);
                    border-radius: 3px;
                    background: black;
                    border: 3px solid var(--wt-g3x5-bordergray);
                }

        .${WT_G3x5_TSCNumericKeyboardHTMLElement.UNIT_CLASS} {
            font-size: var(--numkeyboard-display-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <div id="display">
            <div id="negativesign" class="displayItem">−</div>
            <div id="cursor">I</div>
            <div id="unit" class="displayItem">
                <span></span>
            </div>
        </div>
        <wt-tsc-button-img id="backspace" labeltext="Bksp" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAP_BKSP.png"></wt-tsc-button-img>
        <wt-tsc-button-statusbar id="negative" class="signbutton" labeltext="Negative (−)"></wt-tsc-button-statusbar>
        <wt-tsc-button-statusbar id="positive" class="signbutton" labeltext="Positive (+)"></wt-tsc-button-statusbar>
        <div id="keyboard">
            <wt-tsc-button-label id="button1" class="keyboardButton" labeltext="1"></wt-tsc-button-label>
            <wt-tsc-button-label id="button2" class="keyboardButton" labeltext="2"></wt-tsc-button-label>
            <wt-tsc-button-label id="button3" class="keyboardButton" labeltext="3"></wt-tsc-button-label>
            <wt-tsc-button-label id="button4" class="keyboardButton" labeltext="4"></wt-tsc-button-label>
            <wt-tsc-button-label id="button5" class="keyboardButton" labeltext="5"></wt-tsc-button-label>
            <wt-tsc-button-label id="button6" class="keyboardButton" labeltext="6"></wt-tsc-button-label>
            <wt-tsc-button-label id="button7" class="keyboardButton" labeltext="7"></wt-tsc-button-label>
            <wt-tsc-button-label id="button8" class="keyboardButton" labeltext="8"></wt-tsc-button-label>
            <wt-tsc-button-label id="button9" class="keyboardButton" labeltext="9"></wt-tsc-button-label>
            <wt-tsc-button-label id="button0" class="keyboardButton" labeltext="0"></wt-tsc-button-label>
            <wt-tsc-button-label id="buttonDot" class="keyboardButton" labeltext="."></wt-tsc-button-label>
        </div>
        <div id="invalid">
            <div id="invalidtext">Invalid value entered.<br>Enter a value between<br><span id="minvalue"></span> and <span id="maxvalue"></span></div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCNumericKeyboardHTMLElement.NAME, WT_G3x5_TSCNumericKeyboardHTMLElement);

/**
 * @typedef WT_G3x5_TSCNumericKeyboardContext
 * @property {Number} digitCount
 * @property {WT_Unit} unit
 * @property {WT_NumberUnit} initialValue
 */