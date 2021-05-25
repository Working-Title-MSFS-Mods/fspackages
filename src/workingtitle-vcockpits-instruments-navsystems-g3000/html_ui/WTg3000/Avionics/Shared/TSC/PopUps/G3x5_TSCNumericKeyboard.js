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

    _deactivateScrollButtons() {
        this.instrument.deactivateNavButton(5, false);
        this.instrument.deactivateNavButton(6, false);
    }

    _activateEnterButton() {
        this.instrument.activateNavButton(6, "Enter", this._onEnterPressed.bind(this), true, "ICON_TSC_BUTTONBAR_ENTER.png");
    }

    _deactivateEnterButton() {
        this.instrument.deactivateNavButton(6, true);
    }

    _activateNavButtons() {
        super._activateNavButtons();

        this._deactivateScrollButtons();
        this._activateEnterButton();
    }

    _deactivateNavButtons() {
        super._activateNavButtons();

        this._deactivateEnterButton();
    }

    _onEnterPressed() {
        let value = this.htmlElement.getValue();
        this.context.valueEnteredCallback(value);
        this._onBackPressed();
    }

    onEnter() {
        super.onEnter();

        this.setTitle(this.context.title);
        this.htmlElement.setContext({
            digitCount: this.context.digitCount,
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
    }

    _getTemplate() {
        return WT_G3x5_TSCNumericKeyboardHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInitialized() {
        return this._isInit;
    }

    /**
     *
     * @returns {WT_NumberUnitReadOnly}
     */
    getValue() {
        return this._value ? this._value.readonly() : null;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
        this._display = this.shadowRoot.querySelector(`#display`);
        this._unit = this.shadowRoot.querySelector(`#unit span`);

        this._keyboardButtons = await Promise.all([...Array(10)].map((value, index) => WT_CustomElementSelector.select(this.shadowRoot, `#button${index}`, WT_TSCLabeledButton)));
        this._backspaceButton = await WT_CustomElementSelector.select(this.shadowRoot, `#backspace`, WT_TSCImageButton);
    }

    _initButtons() {
        this._keyboardButtons.forEach((button, index) => button.addButtonListener(this._onKeyboardButtonPressed.bind(this, index)));
        this._backspaceButton.addButtonListener(this._onBackspaceButtonPressed.bind(this));
    }

    _initDigitsRecycler() {
        this._digitsRecycler = new WT_SimpleHTMLElementRecycler(this._display, "div");
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
            this.open();
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

    _setReplace(value) {
        this._replace = value;
        this._wrapper.setAttribute("replace", `${value}`);
    }

    _resetDigits() {
        this._digitDisplays.forEach(digit => digit.textContent = "");
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
            from.textContent = "";
        }
    }

    _setDigitText(place, digitText) {
        if (place < 0 || place >= this._digitDisplays.length) {
            return;
        }

        this._digitDisplays[place].textContent = digitText;
    }

    _updateValueFromDigits() {
        let number = 0;
        let power = 1;
        for (let i = 0; i < this._digitDisplays.length; i++) {
            let digit = this._digitDisplays[i];
            let digitText = digit.textContent;
            number += power * (digitText === "" ? 0 : parseInt(digitText));
            power *= 10;
        }
        this._value.set(number);
    }

    _onKeyboardButtonPressed(digit, button) {
        if (this._replace) {
            this._resetDigits();
            this._setReplace(false);
        } else {
            this._shiftDigits(1);
        }
        this._setDigitText(0, digit);
        this._updateValueFromDigits();
    }

    _onBackspaceButtonPressed(button) {
        if (this._replace) {
            this._resetDigits();
            this._setReplace(false);
        } else {
            this._shiftDigits(-1);
        }
    }

    _initDigits() {
        for (let i = 0; i < this._context.digitCount; i++) {
            let digit = this._digitsRecycler.request();
            digit.style.order = -i;
            digit.setAttribute("place", `${i}`);
            this._digitDisplays[i] = digit;
        }
    }

    _updateDigitsFromValue() {
        let valueText = this._value.number.toFixed(0);
        for (let i = 0; i < this._digitDisplays.length; i++) {
            let digitText = i < valueText.length ? valueText[valueText.length - 1 - i] : "";
            this._setDigitText(i, digitText);
        }
    }

    _initValue() {
        this._value = this._context.unit.createNumber(this._context.initialValue.asUnit(this._context.unit));
        this._updateDigitsFromValue();
    }

    _initUnit() {
        this._unit.textContent = this._context.unit.abbrevName.toUpperCase();
    }

    open() {
        this._isOpen = true;
        if (!this._isInit || !this._context) {
            return;
        }

        this._initDigits();
        this._initValue();
        this._initUnit();
        this._setReplace(true);
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
WT_G3x5_TSCNumericKeyboardHTMLElement.NAME = "wt-tsc-numkeyboard";
WT_G3x5_TSCNumericKeyboardHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCNumericKeyboardHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 5px;
            background: linear-gradient(#1f3445, black 25px);
            background-color: black;
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
                left: calc((100% - var(--numkeyboard-display-width, 50%)) / 2 + var(--numkeyboard-display-horizontal-offset, 0%));
                top: 0%;
                width: var(--numkeyboard-display-width, 50%);
                height: var(--numkeyboard-display-height, 1.5em);
                display: flex;
                flex-flow: row nowrap;
                justify-content: center;
                align-items: center;
                color: var(--wt-g3x5-lightblue);
                background: gray;
            }
                #wrapper[replace="true"] #display div {
                    color: black;
                    background: var(--wt-g3x5-lightblue);
                }
                #cursor {
                    width: var(--numkeyboard-cursor-width, 0.1em);
                    color: transparent;
                    order: 1;
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
                left: calc((100% - var(--numkeyboard-keyboard-width, 60%)) / 2 + var(--numkeyboard-keyboard-horizontal-offset, 0%));
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
            #backspace {
                position: absolute;
                left: var(--numkeyboard-bksp-button-left, 80%);
                top: var(--numkeyboard-bksp-button-top, 0%);
                width: var(--numkeyboard-bksp-button-width, 3em);
                height: var(--numkeyboard-bksp-button-height, 3em);
                font-size: var(--numkeyboard-bksp-button-font-size, 0.6em);
                --button-img-label-top: 65%;
                --button-img-label-height: 30%;
                --button-img-image-top: -12.5%;
                --button-img-image-height: 90%;
            }
    </style>
    <div id="wrapper">
        <div id="display">
            <div id="cursor">I</div>
            <div id="unit">
                <span></span>
            </div>
        </div>
        <wt-tsc-button-img id="backspace" labeltext="Bksp" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAP_BKSP.png"></wt-tsc-button-img>
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