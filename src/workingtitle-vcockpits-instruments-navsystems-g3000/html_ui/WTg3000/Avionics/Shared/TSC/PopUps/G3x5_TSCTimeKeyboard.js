class WT_G3x5_TSCTimeKeyboard extends WT_G3x5_TSCPopUpElement {
    /**
     * @readonly
     * @type {WT_G3x5_TSCTimeKeyboardHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCTimeKeyboardHTMLElement();
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
        if (value) {
            this.context.valueEnteredCallback(value);
            this.instrument.goBack();
        } else {
            this.htmlElement.setInvalidWindowVisible(true);
            this._deactivateEnterButton();
        }
    }

    _onBackPressed() {
        if (this.htmlElement.isInvalidWindowVisible) {
            this.htmlElement.setInvalidWindowVisible(false);
            this._activateEnterButton();
        } else {
            this.instrument.goBack();
        }
    }

    onEnter() {
        super.onEnter();

        this.setTitle(this.context.title);
        this.htmlElement.setContext({
            positiveOnly: this.context.positiveOnly,
            limit24Hours: this.context.limit24Hours,
            initialValue: this.context.initialValue
        });
        this.htmlElement.open();
    }

    onExit() {
        super.onExit();

        this.htmlElement.setInvalidWindowVisible(false);
        this.htmlElement.close();
    }
}

class WT_G3x5_TSCTimeKeyboardHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._replace = false;
        this._isNegative = false;
        this._placesEntered = 0;
        this._isInvalidWindowVisible = false;

        /**
         * @type {WT_NumberUnit}
         */
        this._value = WT_Unit.SECOND.createNumber(0);

        /**
         * @type {WT_G3x5_TSCNumericKeyboardContext}
         */
        this._context = null;
        this._isOpen = false;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCTimeKeyboardHTMLElement.TEMPLATE;
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

    _checkValidity(hours, minutes, seconds) {
        let limit = this._context.limit24Hours ? WT_G3x5_TSCTimeKeyboardHTMLElement.LIMIT_24_HOURS : WT_G3x5_TSCTimeKeyboardHTMLElement.LIMIT_100_HOURS;
        return minutes < 60 && seconds < 60 && (hours * 3600 + minutes * 60 + seconds <= limit);
    }

    /**
     *
     * @returns {WT_NumberUnitReadOnly}
     */
    getValue() {
        let hours = parseInt(this._h1.textContent + this._h2.textContent);
        let minutes = parseInt(this._m1.textContent + this._m2.textContent);
        let seconds = parseInt(this._s1.textContent + this._s2.textContent);

        if (this._checkValidity(hours, minutes, seconds)) {
            let number = hours * 3600 + minutes * 60 + seconds;
            number *= this._isNegative ? -1 : 1;
            return this._value.set(number).readonly();
        } else {
            return undefined;
        }
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        this._negativeSign = this.shadowRoot.querySelector(`#negativesign`);
        this._h1 = this.shadowRoot.querySelector(`#h1`);
        this._h2 = this.shadowRoot.querySelector(`#h2`);
        this._m1 = this.shadowRoot.querySelector(`#m1`);
        this._m2 = this.shadowRoot.querySelector(`#m2`);
        this._s1 = this.shadowRoot.querySelector(`#s1`);
        this._s2 = this.shadowRoot.querySelector(`#s2`);
        this._digitDisplays = [this._s2, this._s1, this._m2, this._m1, this._h2, this._h1];

        this._keyboardButtons = await Promise.all([...Array(10)].map((value, index) => WT_CustomElementSelector.select(this.shadowRoot, `#button${index}`, WT_TSCLabeledButton)));
        this._backspaceButton = await WT_CustomElementSelector.select(this.shadowRoot, `#backspace`, WT_TSCImageButton);
        this._negativeButton = await WT_CustomElementSelector.select(this.shadowRoot, `#negative`, WT_TSCStatusBarButton);
        this._positiveButton = await WT_CustomElementSelector.select(this.shadowRoot, `#positive`, WT_TSCStatusBarButton);

        this._maxTime = this.shadowRoot.querySelector(`#maxtime`);
    }

    _initButtons() {
        this._keyboardButtons.forEach((button, index) => button.addButtonListener(this._onKeyboardButtonPressed.bind(this, index)));
        this._backspaceButton.addButtonListener(this._onBackspaceButtonPressed.bind(this));
        this._negativeButton.addButtonListener(this._onNegativeButtonPressed.bind(this));
        this._positiveButton.addButtonListener(this._onPositiveButtonPressed.bind(this));
    }

    _initChildren() {
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

    setInvalidWindowVisible(value) {
        this._wrapper.setAttribute("invalid", `${value}`);
        this._isInvalidWindowVisible = value;
    }

    _setReplace(value) {
        this._replace = value;
        this._wrapper.setAttribute("replace", `${value}`);
    }

    _setPlacesEntered(count) {
        count = Math.max(0, Math.min(6, count));
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
        this._h1.textContent = "0";
        this._h2.textContent = "0";
        this._m1.textContent = "0";
        this._m2.textContent = "0";
        this._s1.textContent = "0";
        this._s2.textContent = "0";
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

    _onKeyboardButtonPressed(digit, button) {
        if (this._replace) {
            this._resetDigits();
            this._setReplace(false);
        } else {
            this._shiftDigits(1);
        }
        this._setDigitText(0, digit);
        this._setPlacesEntered(this._placesEntered + 1);
    }

    _onBackspaceButtonPressed(button) {
        if (this._replace) {
            this._resetDigits();
            this._setReplace(false);
        } else {
            this._shiftDigits(-1);
            this._setPlacesEntered(this._placesEntered - 1);
        }
    }

    _updateSignButtons() {
        this._negativeButton.toggle = this._isNegative ? "on" : "off";
        this._positiveButton.toggle = this._isNegative ? "off" : "on";
    }

    _setNegative(value) {
        this._isNegative = value;
        this._wrapper.setAttribute("negative", `${value}`);
        this._updateSignButtons();
    }

    _onNegativeButtonPressed(button) {
        this._setNegative(true);
    }

    _onPositiveButtonPressed(button) {
        this._setNegative(false);
    }

    _initSignButtonVisibility() {
        this._wrapper.setAttribute("positiveonly", `${this._context.positiveOnly}`);
    }

    _initMaxTime() {
        this._maxTime.textContent = this._context.limit24Hours ? "23:59:59" : "99:99:99";
    }

    _updateDigitsFromValue() {
        let time = this._value.asUnit(WT_Unit.SECOND);
        let isNegative = time < 0;
        let timeAbs = Math.abs(time);
        let hours = `${Math.floor(timeAbs / 3600)}`.padStart(2, "0");
        let minutes = `${Math.floor((timeAbs / 60)) % 60}`.padStart(2, "0");
        let seconds = `${Math.floor(timeAbs % 60)}`.padStart(2, "0");

        this._setNegative(isNegative);
        this._h1.textContent = hours[0];
        this._h2.textContent = hours[1];
        this._m1.textContent = minutes[0];
        this._m2.textContent = minutes[1];
        this._s1.textContent = seconds[0];
        this._s2.textContent = seconds[1];
        this._setPlacesEntered(6);
    }

    _initValue() {
        let limit = this._context.limit24Hours ? WT_G3x5_TSCTimeKeyboardHTMLElement.LIMIT_24_HOURS : WT_G3x5_TSCTimeKeyboardHTMLElement.LIMIT_100_HOURS;
        let seconds = Math.round(Math.min(limit, Math.max(this._context.positiveOnly ? 0 : -limit, this._context.initialValue.asUnit(WT_Unit.SECOND))));
        this._value.set(seconds);
        this._updateDigitsFromValue();
    }

    open() {
        this._isOpen = true;
        if (!this._isInit || !this._context) {
            return;
        }

        this._initSignButtonVisibility();
        this._initMaxTime();
        this._initValue();
        this._setReplace(true);
    }

    close() {
        this._isOpen = false;
    }
}
WT_G3x5_TSCTimeKeyboardHTMLElement.LIMIT_100_HOURS = 359999;
WT_G3x5_TSCTimeKeyboardHTMLElement.LIMIT_24_HOURS = 86399;
WT_G3x5_TSCTimeKeyboardHTMLElement.NAME = "wt-tsc-timekeyboard";
WT_G3x5_TSCTimeKeyboardHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCTimeKeyboardHTMLElement.TEMPLATE.innerHTML = `
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
            position: relative;
            width: 100%;
            height: 100%;
        }
            #main {
                position: absolute;
                left: var(--timekeyboard-padding-left, 0.5em);
                top: var(--timekeyboard-padding-top, 0.5em);
                width: calc(100% - var(--timekeyboard-padding-left, 0.5em) - var(--timekeyboard-padding-right, 0.5em));
                height: calc(100% - var(--timekeyboard-padding-top, 0.5em) - var(--timekeyboard-padding-bottom, 0.5em));
                color: white;
            }
                #display {
                    position: absolute;
                    left: calc((100% - var(--timekeyboard-display-width, 60%)) / 2 + var(--timekeyboard-display-horizontal-offset, -10%));
                    top: 0%;
                    width: var(--timekeyboard-display-width, 60%);
                    height: var(--timekeyboard-display-height, 1.5em);
                    display: flex;
                    flex-flow: row nowrap;
                    justify-content: center;
                    align-items: center;
                    color: var(--wt-g3x5-lightblue);
                    background: #222222;
                }
                    #wrapper[replace="true"] #display div {
                        background: var(--wt-g3x5-lightblue);
                    }
                    #wrapper[replace="true"] #number {
                        color: black;
                    }
                        #negativesign {
                            visibility: hidden;
                        }
                        #wrapper[negative="true"] #negativesign {
                            visibility: visible;
                        }
                        .digit[entered="false"] {
                            color: #083f42;
                        }
                    #cursor {
                        width: var(--timekeyboard-cursor-width, 0.1em);
                        color: transparent;
                    }
                    #wrapper[replace="false"] #cursor {
                        animation: blink 1s infinite step-end;
                    }
                #keyboard {
                    position: absolute;
                    left: calc((100% - var(--timekeyboard-keyboard-width, 60%)) / 2 + var(--timekeyboard-keyboard-horizontal-offset, -10%));
                    top: calc(var(--timekeyboard-display-height, 1.5em) + var(--timekeyboard-display-margin-bottom, 0.2em));
                    width: var(--timekeyboard-keyboard-width, 60%);
                    height: calc(100% - var(--timekeyboard-display-height, 1.5em) - var(--timekeyboard-display-margin-bottom, 0.2em));
                    display: grid;
                    grid-template-rows: repeat(4, 1fr);
                    grid-template-columns: repeat(3, 1fr);
                    grid-gap: var(--timekeyboard-keyboard-grid-gap, 0.2em);
                    justify-items: center;
                    align-items: center;
                }
                    .keyboardButton {
                        width: var(--timekeyboard-button-size, 1.5em);
                        height: var(--timekeyboard-button-size, 1.5em);
                        font-size: var(--timekeyboard-button-font-size, 1.25em);
                        border-radius: 50%;
                        border: white solid 2px;
                    }
                    #button0 {
                        grid-area: 4 / 2;
                    }
                #backspace {
                    position: absolute;
                    left: var(--timekeyboard-bksp-button-left, 75%);
                    top: var(--timekeyboard-bksp-button-top, 0%);
                    width: var(--timekeyboard-bksp-button-width, 3em);
                    height: var(--timekeyboard-bksp-button-height, 3em);
                    font-size: var(--timekeyboard-bksp-button-font-size, 0.6em);
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
                    left: var(--timekeyboard-negative-button-left, 75%);
                    top: var(--timekeyboard-negative-button-top, 50%);
                    width: var(--timekeyboard-negative-button-width, 6em);
                    height: var(--timekeyboard-negative-button-height, 3em);
                    font-size: var(--timekeyboard-negative-button-font-size, 0.6em);
                }
                #positive {
                    position: absolute;
                    left: var(--timekeyboard-positive-button-left, 75%);
                    top: var(--timekeyboard-positive-button-top, calc(var(--timekeyboard-negative-button-top, 50%) + var(--timekeyboard-negative-button-height, 3em) + 0.5em));
                    width: var(--timekeyboard-positive-button-width, 6em);
                    height: var(--timekeyboard-positive-button-height, 3em);
                    font-size: var(--timekeyboard-positive-button-font-size, 0.6em);
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
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    padding: var(--timekeyboard-invalid-padding, 0.5em);
                    white-space: nowrap;
                    text-align: center;
                    font-size: var(--timekeyboard-invalid-font-size, 0.75em);
                    border-radius: 3px;
                    background: black;
                    border: 3px solid var(--wt-g3x5-bordergray);
                }
    </style>
    <div id="wrapper">
        <div id="main">
            <div id="display">
                <div id="number">
                    <span id="negativesign">−</span><span id="h1" class="digit">0</span><span id="h2" class="digit">0</span><span>:</span><span id="m1" class="digit">0</span><span id="m2" class="digit">0</span><span>:</span><span id="s1" class="digit">0</span><span id="s2" class="digit">0</span>
                </div>
                <div id="cursor">I</div>
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
            </div>
        </div>
        <div id="invalid">
            <div id="invalidtext">Invalid time entered.<br>Enter a time between<br>00:00:00 and <span id="maxtime"></span></div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCTimeKeyboardHTMLElement.NAME, WT_G3x5_TSCTimeKeyboardHTMLElement);

/**
 * @typedef WT_G3x5_TSCTimeKeyboardContext
 * @property {Boolean} positiveOnly
 * @property {Boolean} limit24Hours
 * @property {WT_NumberUnit} initialValue
 */