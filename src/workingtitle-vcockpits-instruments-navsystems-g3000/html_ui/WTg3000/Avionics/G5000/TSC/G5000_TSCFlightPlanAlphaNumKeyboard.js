class WT_G5000_TSCFlightPlanAlphaNumKeyboard extends WT_G3x5_TSCAlphaNumKeyboard {
    _getTemplate() {
        return WT_G5000_TSCFlightPlanAlphaNumKeyboard.TEMPLATE;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
        [
            this._routeButton,
            this._backspaceButton,
            this._letterKeys,
            this._numberKeys,
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#route`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#backspace`, WT_TSCImageButton),
            Promise.all([...Array(26)].map((value, index) => WT_CustomElementSelector.select(this.shadowRoot, `#key${String.fromCharCode(65 + index)}`, WT_TSCLabeledButton), this)),
            Promise.all([...Array(10)].map((value, index) => WT_CustomElementSelector.select(this.shadowRoot, `#key${index}`, WT_TSCLabeledButton), this))
        ]);
    }

    _initButtonListeners() {
        this._routeButton.addButtonListener(this._onRouteButtonPressed.bind(this));
        this._backspaceButton.addButtonListener(this._onBackspaceButtonPressed.bind(this));
        this._letterKeys.forEach((button, index) => button.addButtonListener(this._onCharKeyPressed.bind(this, String.fromCharCode(65 + index))), this);
        this._numberKeys.forEach((button, index) => button.addButtonListener(this._onCharKeyPressed.bind(this, String.fromCharCode(48 + index))), this);
    }

    _onRouteButtonPressed(button) {
        this._notifyListeners(WT_G5000_TSCFlightPlanAlphaNumKeyboard.EventType.ROUTE_PRESSED);
    }
}
/**
 * @enum {Number}
 */
WT_G5000_TSCFlightPlanAlphaNumKeyboard.EventType = {
    CHAR_KEY_PRESSED: 0,
    BACKSPACE_PRESSED: 1,
    ROUTE_PRESSED: 2
}
WT_G5000_TSCFlightPlanAlphaNumKeyboard.NAME = "wt-tsc-fplnalphanumkeyboard";
WT_G5000_TSCFlightPlanAlphaNumKeyboard.TEMPLATE = document.createElement("template");
WT_G5000_TSCFlightPlanAlphaNumKeyboard.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: absolute;
            left: var(--fplnalphanumkeyboard-padding-left, 0px);
            top: var(--fplnalphanumkeyboard-padding-top, 0px);
            width: calc(100% - var(--fplnalphanumkeyboard-padding-left, 0px) - var(--fplnalphanumkeyboard-padding-right, 0px));
            height: calc(100% - var(--fplnalphanumkeyboard-padding-top, 0px) - var(--fplnalphanumkeyboard-padding-bottom, 0px));
        }
        #keyboard {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-rows: repeat(7, 1fr);
                grid-template-columns: repeat(6, 1fr);
                color: white;
                justify-items: center;
                align-items: center;
            }
                .key {
                    width: var(--fplnalphanumkeyboard-key-size, 100%);
                    height: var(--fplnalphanumkeyboard-key-size, 100%);
                }
                .round {
                    border-radius: 50%;
                }
                #find {
                    font-size: var(--fplnalphanumkeyboard-findbutton-font-size, 0.5em);
                    --button-img-image-top: -10%;
                    --button-img-image-height: 80%;
                }
                #route {
                    font-size: var(--fplnalphanumkeyboard-routebutton-font-size, 0.5em);
                }
                #degtrue {
                    font-size: var(--fplnalphanumkeyboard-degtruebutton-font-size, 0.5em);
                }
                #backspace {
                    font-size: var(--fplnalphanumkeyboard-backspacebutton-font-size, 0.5em);
                    --button-img-label-top: 5%;
                    --button-img-label-height: 55%;
                    --button-img-image-top: 30%;
                    --button-img-image-height: 80%;
                }
    </style>
    <div id="wrapper">
        <div id="keyboard">
            <wt-tsc-button-label id="key1" class="key round" labeltext="1"></wt-tsc-button-label>
            <wt-tsc-button-label id="key2" class="key round" labeltext="2"></wt-tsc-button-label>
            <wt-tsc-button-label id="key3" class="key round" labeltext="3"></wt-tsc-button-label>
            <wt-tsc-button-label id="key4" class="key round" labeltext="4"></wt-tsc-button-label>
            <wt-tsc-button-label id="key5" class="key round" labeltext="5"></wt-tsc-button-label>
            <wt-tsc-button-label id="keySlash" class="key round" labeltext="/" enabled="false"></wt-tsc-button-label>
            <wt-tsc-button-label id="key6" class="key round" labeltext="6"></wt-tsc-button-label>
            <wt-tsc-button-label id="key7" class="key round" labeltext="7"></wt-tsc-button-label>
            <wt-tsc-button-label id="key8" class="key round" labeltext="8"></wt-tsc-button-label>
            <wt-tsc-button-label id="key9" class="key round" labeltext="9"></wt-tsc-button-label>
            <wt-tsc-button-label id="key0" class="key round" labeltext="0"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyDecimal" class="key round" labeltext="." enabled="false"></wt-tsc-button-label>

            <wt-tsc-button-label id="keyA" class="key" labeltext="A"></wt-tsc-button-label>
            <wt-tsc-button-label id="keyB" class="key" labeltext="B"></wt-tsc-button-label>
            <wt-tsc-button-img id="find" class="key" labeltext="Find" enabled="false" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_TSC_FIND.png"></wt-tsc-button-img>
            <wt-tsc-button-label id="route" class="key" labeltext="*<br>Route"></wt-tsc-button-label>
            <wt-tsc-button-label id="degtrue" class="key" labeltext="°T" enabled="false"></wt-tsc-button-label>
            <wt-tsc-button-img id="backspace" class="key" labeltext="BKSP" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAP_BKSP.png"></wt-tsc-button-img>
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
        </div>
    </div>
`;

customElements.define(WT_G5000_TSCFlightPlanAlphaNumKeyboard.NAME, WT_G5000_TSCFlightPlanAlphaNumKeyboard);