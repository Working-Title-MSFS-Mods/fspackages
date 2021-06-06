class WT_G3x5_TSCAlphaNumKeyboard extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {((source:WT_G3x5_TSCAlphaNumKeyboard, eventType:WT_G3x5_TSCAlphaNumKeyboard.EventType, char?:String) => void)[]}
         */
        this._listeners = [];

        this._keyboardMode = WT_G3x5_TSCAlphaNumKeyboard.KeyboardMode.LETTERS;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCAlphaNumKeyboard.TEMPLATE;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
        [
            this._numbersButton,
            this._lettersButton,
            this._backspaceButtons,
            this._letterKeys,
            this._numberKeys,
            this._northKey,
            this._southKey,
            this._eastKey,
            this._westKey
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#numbers`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#letters`, WT_TSCLabeledButton),
            Promise.all([
                WT_CustomElementSelector.select(this.shadowRoot, `#letterkeyboard .backspace`, WT_TSCImageButton),
                WT_CustomElementSelector.select(this.shadowRoot, `#numberkeyboard .backspace`, WT_TSCImageButton),
            ]),
            Promise.all([...Array(26)].map((value, index) => WT_CustomElementSelector.select(this.shadowRoot, `#key${String.fromCharCode(65 + index)}`, WT_TSCLabeledButton), this)),
            Promise.all([...Array(10)].map((value, index) => WT_CustomElementSelector.select(this.shadowRoot, `#key${index}`, WT_TSCLabeledButton), this)),
            WT_CustomElementSelector.select(this.shadowRoot, `#keyNorth`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#keySouth`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#keyEast`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#keyWest`, WT_TSCLabeledButton),
        ]);
    }

    _initButtonListeners() {
        this._numbersButton.addButtonListener(this._onNumbersButtonPressed.bind(this));
        this._lettersButton.addButtonListener(this._onLettersButtonPressed.bind(this));
        this._backspaceButtons.forEach(button => button.addButtonListener(this._onBackspaceButtonPressed.bind(this)), this);
        this._letterKeys.forEach((button, index) => button.addButtonListener(this._onCharKeyPressed.bind(this, String.fromCharCode(65 + index))), this);
        this._numberKeys.forEach((button, index) => button.addButtonListener(this._onCharKeyPressed.bind(this, String.fromCharCode(48 + index))), this);
        this._northKey.addButtonListener(this._onCharKeyPressed.bind(this, "N"));
        this._southKey.addButtonListener(this._onCharKeyPressed.bind(this, "S"));
        this._eastKey.addButtonListener(this._onCharKeyPressed.bind(this, "E"));
        this._westKey.addButtonListener(this._onCharKeyPressed.bind(this, "W"));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initButtonListeners();
        this._isInit = true;
        this._updateFromKeyboardMode();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateFromKeyboardMode() {
        this._wrapper.setAttribute("mode", WT_G3x5_TSCAlphaNumKeyboard.KEYBOARD_MODE_ATTRIBUTES[this._keyboardMode]);
    }

    /**
     *
     * @param {WT_G3x5_TSCAlphaNumKeyboard.KeyboardMode} mode
     */
    setKeyboardMode(mode) {
        if (this._keyboardMode === mode) {
            return;
        }

        this._keyboardMode = mode;
        if (this._isInit) {
            this._updateFromKeyboardMode();
        }
    }

    _onNumbersButtonPressed(button) {
        this.setKeyboardMode(WT_G3x5_TSCAlphaNumKeyboard.KeyboardMode.NUMBERS);
    }

    _onLettersButtonPressed(button) {
        this.setKeyboardMode(WT_G3x5_TSCAlphaNumKeyboard.KeyboardMode.LETTERS);
    }

    _notifyListeners(eventType, char) {
        this._listeners.forEach(listener => listener(this, eventType, char), this);
    }

    _onBackspaceButtonPressed(button) {
        this._notifyListeners(WT_G3x5_TSCAlphaNumKeyboard.EventType.BACKSPACE_PRESSED);
    }

    _onCharKeyPressed(char, button) {
        this._notifyListeners(WT_G3x5_TSCAlphaNumKeyboard.EventType.CHAR_KEY_PRESSED, char);
    }

    /**
     *
     * @param {(source:WT_G3x5_TSCAlphaNumKeyboard, eventType:WT_G3x5_TSCAlphaNumKeyboard.EventType, char?:String) => void} listener
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     *
     * @param {(source:WT_G3x5_TSCAlphaNumKeyboard, eventType:WT_G3x5_TSCAlphaNumKeyboard.EventType, char?:String) => void} listener
     */
    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCAlphaNumKeyboard.KeyboardMode = {
    LETTERS: 0,
    NUMBERS: 1
}
WT_G3x5_TSCAlphaNumKeyboard.KEYBOARD_MODE_ATTRIBUTES = [
    "letters",
    "numbers"
];
/**
 * @enum {Number}
 */
WT_G3x5_TSCAlphaNumKeyboard.EventType = {
    CHAR_KEY_PRESSED: 0,
    BACKSPACE_PRESSED: 1
}
WT_G3x5_TSCAlphaNumKeyboard.NAME = "wt-tsc-alphanumkeyboard";
WT_G3x5_TSCAlphaNumKeyboard.TEMPLATE = document.createElement("template");
WT_G3x5_TSCAlphaNumKeyboard.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: absolute;
            left: var(--alphanumkeyboard-padding-left, 0px);
            top: var(--alphanumkeyboard-padding-top, 0px);
            width: calc(100% - var(--alphanumkeyboard-padding-left, 0px) - var(--alphanumkeyboard-padding-right, 0px));
            height: calc(100% - var(--alphanumkeyboard-padding-top, 0px) - var(--alphanumkeyboard-padding-bottom, 0px));
        }
            .keyboard {
                display: none;
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                height: 100%;
                grid-template-rows: repeat(5, 1fr);
                grid-template-columns: repeat(12, 1fr);
                grid-gap: var(--alphanumkeyboard-grid-gap, 0.2em);
                color: white;
            }
            .find {
                font-size: var(--alphanumkeyboard-findbutton-font-size, 0.5em);
                --button-img-image-top: -10%;
                --button-img-image-height: 80%;
                grid-area: 1 / 5 / span 1 / span 2;
            }
            .backspace {
                font-size: var(--alphanumkeyboard-backspacebutton-font-size, 0.5em);
                --button-img-label-top: 5%;
                --button-img-label-height: 55%;
                --button-img-image-top: 30%;
                --button-img-image-height: 80%;
                grid-area: 1 / 10 / span 1 / span 3;
            }
            .key {
                grid-column-end: span 2;
            }
            #numbers,
            #letters {
                grid-area: 1 / 7 / span 1 / span 3;
            }
            #wrapper[mode="letters"] #letterkeyboard,
            #wrapper[mode="numbers"] #numberkeyboard {
                display: grid;
            }
                #keyNorth {
                    grid-row-start: 2;
                    grid-column-start: 1;
                }
                #keySouth {
                    grid-row-start: 3;
                    grid-column-start: 1;
                }
                #keyEast {
                    grid-row-start: 4;
                    grid-column-start: 1;
                }
                #keyWest {
                    grid-row-start: 5;
                    grid-column-start: 1;
                }
                #key1 {
                    grid-row-start: 2;
                    grid-column-start: 5;
                }
                #key2 {
                    grid-row-start: 2;
                    grid-column-start: 7;
                }
                #key3 {
                    grid-row-start: 2;
                    grid-column-start: 9;
                }
                #key4 {
                    grid-row-start: 3;
                    grid-column-start: 5;
                }
                #key5 {
                    grid-row-start: 3;
                    grid-column-start: 7;
                }
                #key6 {
                    grid-row-start: 3;
                    grid-column-start: 9;
                }
                #key7 {
                    grid-row-start: 4;
                    grid-column-start: 5;
                }
                #key8 {
                    grid-row-start: 4;
                    grid-column-start: 7;
                }
                #key9 {
                    grid-row-start: 4;
                    grid-column-start: 9;
                }
                #key0 {
                    grid-row-start: 5;
                    grid-column-start: 7;
                }
    </style>
    <div id="wrapper">
        <div id="letterkeyboard" class="keyboard">
            <wt-tsc-button-label id="keyA" class="key" labeltext="A"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyB" class="key" labeltext="B"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyC" class="key" labeltext="C"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyD" class="key" labeltext="D"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyE" class="key" labeltext="E"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyF" class="key" labeltext="F"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyG" class="key" labeltext="G"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyH" class="key" labeltext="H"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyI" class="key" labeltext="I"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyJ" class="key" labeltext="J"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyK" class="key" labeltext="K"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyL" class="key" labeltext="L"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyM" class="key" labeltext="M"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyN" class="key" labeltext="N"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyO" class="key" labeltext="O"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyP" class="key" labeltext="P"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyQ" class="key" labeltext="Q"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyR" class="key" labeltext="R"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyS" class="key" labeltext="S"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyT" class="key" labeltext="T"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyU" class="key" labeltext="U"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyV" class="key" labeltext="V"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyW" class="key" labeltext="W"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyX" class="key" labeltext="X"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyY" class="key" labeltext="Y"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyZ" class="key" labeltext="Z"></wt-tsc-button-label>
            <wt-tsc-button-img class="find" labeltext="Find" enabled="false" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_TSC_FIND.png"></wt-tsc-button-img>
            <wt-tsc-button-label id="numbers" labeltext="123..."></wt-tsc-button-label>
            <wt-tsc-button-img class="backspace" labeltext="Backspace" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAP_BKSP.png"></wt-tsc-button-img>
        </div>
        <div id="numberkeyboard" class="keyboard">
            <wt-tsc-button-label id="keyNorth" class="key" labeltext="N"></wt-tsc-button-label>
            <wt-tsc-button-label id="key1" class="key" labeltext="1"></wt-tsc-button-label>
            <wt-tsc-button-label id="key2" class="key" labeltext="2"></wt-tsc-button-label>
            <wt-tsc-button-label id="key3" class="key" labeltext="3"></wt-tsc-button-label>
            <wt-tsc-button-label id="keySouth" class="key" labeltext="S"></wt-tsc-button-label>
            <wt-tsc-button-label id="key4" class="key" labeltext="4"></wt-tsc-button-label>
            <wt-tsc-button-label id="key5" class="key" labeltext="5"></wt-tsc-button-label>
            <wt-tsc-button-label id="key6" class="key" labeltext="6"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyEast" class="key" labeltext="E"></wt-tsc-button-label>
            <wt-tsc-button-label id="key7" class="key" labeltext="7"></wt-tsc-button-label>
            <wt-tsc-button-label id="key8" class="key" labeltext="8"></wt-tsc-button-label>
            <wt-tsc-button-label id="key9" class="key" labeltext="9"></wt-tsc-button-label>
            <wt-tsc-button-label id="key0" class="key" labeltext="0"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyWest" class="key" labeltext="W"></wt-tsc-button-label>
            <wt-tsc-button-img class="find" labeltext="Find" enabled="false"></wt-tsc-button-img>
            <wt-tsc-button-label id="letters" labeltext="ABC..."></wt-tsc-button-label>
            <wt-tsc-button-img class="backspace" labeltext="Backspace" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_TSC_FIND.png"></wt-tsc-button-img>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCAlphaNumKeyboard.NAME, WT_G3x5_TSCAlphaNumKeyboard);