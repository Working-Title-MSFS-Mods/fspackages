class WT_G3x5_TSCVNAVAltitudeKeyboard extends WT_G3x5_TSCPopUpElement {
    /**
     * @readonly
     * @type {WT_G3x5_TSCVNAVAltitudeKeyboardHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCVNAVAltitudeKeyboardHTMLElement();
    }

    async _initFromHTMLElement() {
        await WT_Wait.awaitCallback(() => this.htmlElement.isInitialized, this);
        this.htmlElement.removeButton.addButtonListener(this._onRemoveButtonPressed.bind(this));
        this.htmlElement.vnavDRCTButton.addButtonListener(this._onVNAVDRCTButtonPressed.bind(this));
    }

    onInit() {
        this._htmlElement = this._createHTMLElement();
        this.popUpWindow.appendChild(this.htmlElement);
        this._initFromHTMLElement();
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

    _onEnterPressed() {
        let value = this.htmlElement.getValue();
        this.context.valueEnteredCallback(value);
        this.instrument.goBack();
    }

    _onRemoveButtonPressed(button) {
        this.context.removeCallback();
        this.instrument.goBack();
    }

    _onVNAVDRCTButtonPressed(button) {
        let value = this.htmlElement.getValue();
        this.context.vnavDRCTCallback(value);
        this.instrument.goBack();
    }

    onEnter() {
        super.onEnter();

        this.htmlElement.setContext({
            showDirectTo: this.context.showDirectTo,
            leg: this.context.leg,
            digitCount: 5,
            decimalPlaces: 0,
            positiveOnly: true,
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

class WT_G3x5_TSCVNAVAltitudeKeyboardHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._context = null;
        this._isOpen = false;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCVNAVAltitudeKeyboardHTMLElement.TEMPLATE;
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
     * @type {WT_TSCLabeledButton}
     */
    get removeButton() {
        return this._removeButton;
    }

    /**
     * @readonly
     * @type {WT_TSCContentButton}
     */
    get vnavDRCTButton() {
        return this._vnavDRCTButton;
    }

    /**
     *
     * @returns {WT_NumberUnitReadOnly}
     */
    getValue() {
        return this._isInit ? this._keyboard.getValue() : null;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector("#wrapper");

        [
            this._keyboard,
            this._removeButton,
            this._vnavDRCTButton,
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, "#keyboard", WT_G3x5_TSCNumericKeyboardHTMLElement),
            WT_CustomElementSelector.select(this.shadowRoot, "#remove", WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, "#vnavdrct", WT_TSCContentButton)
        ]);

        this._vnavDRCTIdent = this.shadowRoot.querySelector("#vnavdrctident");
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        this._updateFromContext();
        if (this._isOpen) {
            this._initFromOpen();
        }
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateVNAVDRCTButton() {
        this._wrapper.setAttribute("show-drct", `${this._context.showDirectTo}`);
        this._vnavDRCTIdent.textContent = this._context.leg ? this._context.leg.fix.ident : "";
    }

    _updateFromContext() {
        this._keyboard.setContext(this._context);
        this._updateVNAVDRCTButton();
    }

    setContext(context) {
        this._context = context;
        if (this._isInit) {
            this._updateFromContext();
        }
    }

    _initFromOpen() {
        this._keyboard.open();
    }

    open() {
        this._isOpen = true;
        if (!this._isInit || !this._context) {
            return;
        }

        if (this._isInit) {
            this._initFromOpen();
        }
    }

    _cleanUpFromClose() {
        this._keyboard.close();
    }

    close() {
        this._isOpen = false;

        if (this._isInit) {
            this._cleanUpFromClose();
        }
    }
}
WT_G3x5_TSCVNAVAltitudeKeyboardHTMLElement.NAME = "wt-tsc-vnavaltkeyboard";
WT_G3x5_TSCVNAVAltitudeKeyboardHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCVNAVAltitudeKeyboardHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 5px;
            background: linear-gradient(#1f3445, black 25px);
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: absolute;
            left: var(--vnavaltkeyboard-padding-left, 0.2em);
            top: var(--vnavaltkeyboard-padding-top, 0.2em);
            width: calc(100% - var(--vnavaltkeyboard-padding-left, 0.2em) - var(--vnavaltkeyboard-padding-right, 0.2em));
            height: calc(100% - var(--vnavaltkeyboard-padding-top, 0.2em) - var(--vnavaltkeyboard-padding-bottom, 0.2em));
        }
            #keyboard {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                height: 100%;
                border-radius: 0;
                background: transparent;
                border: none;
                --numkeyboard-padding-left: 0%;
                --numkeyboard-padding-top: 0%;
                --numkeyboard-padding-right: 0%;
                --numkeyboard-padding-bottom: 0%;
                --numkeyboard-display-horizontal-offset: -15%;
                --numkeyboard-keyboard-horizontal-offset: -15%;
            }
            #removecontainer {
                position: absolute;
                left: 0%;
                bottom: 0%;
                width: var(--vnavaltkeyboard-bottom-button-width, calc(var(--numkeyboard-button-size, 1.5em) * 1.5));
                height: var(--vnavaltkeyboard-bottom-button-height, var(--numkeyboard-button-size, 1.5em));
            }
                #remove {
                    position: absolute;
                    left: 0%;
                    top: 0%;
                    width: 100%;
                    height: 100%;
                    font-size: var(--vnavaltkeyboard-bottom-button-font-size, 0.5em);
                }
            #vnavdrctcontainer {
                display: none;
                position: absolute;
                right: 30%;
                bottom: 0%;
                width: var(--vnavaltkeyboard-bottom-button-width, calc(var(--numkeyboard-button-size, 1.5em) * 1.5));
                height: var(--vnavaltkeyboard-bottom-button-height, var(--numkeyboard-button-size, 1.5em));
            }
            #wrapper[show-drct="true"] #vnavdrctcontainer {
                display: block;
            }
                #vnavdrct {
                    position: absolute;
                    left: 0%;
                    top: 0%;
                    width: 100%;
                    height: 100%;
                    font-size: var(--vnavaltkeyboard-bottom-button-font-size, 0.5em);
                }
                    #vnavdrctcontent {
                        position: relative;
                        width: 100%;
                        height: 100%;
                    }
                        #vnavdrcttop {
                            position: absolute;
                            left: 0%;
                            bottom: 50%;
                            width: 100%;
                            display: flex;
                            flex-flow: row nowrap;
                            justify-content: center;
                            align-items: center;
                        }
                            .drctSymbol {
                                width: calc(1.43 * 0.8em);
                                height: 0.8em;
                            }
                                .drctArrow {
                                    fill: white;
                                }
                                .drctLetterD {
                                    fill: transparent;
                                    stroke-width: 10;
                                    stroke: white;
                                }
                        #vnavdrctident {
                            position: absolute;
                            left: 0%;
                            top: 50%;
                            width: 100%;
                            text-align: center;
                        }
    </style>
    <div id="wrapper">
        <wt-tsc-numkeyboard id="keyboard"></wt-tsc-numkeyboard>
        <div id="removecontainer">
            <wt-tsc-button-label id="remove" labeltext="Remove VNAV ALT"></wt-tsc-button-label>
        </div>
        <div id="vnavdrctcontainer">
            <wt-tsc-button-content id="vnavdrct">
                <div id="vnavdrctcontent" slot="content">
                    <div id="vnavdrcttop">
                        <div>VNAV&nbsp</div>
                        <svg class="drctSymbol" viewBox="0 -35 100 70">
                            <path class="drctArrow" d="M 5 -2.5 L 75 -2.5 L 75 -20 L 95 0 L 75 20 L 75 2.5 L 5 2.5 Z" />
                            <path class="drctLetterD" d="M 20 -30 L 30 -30 C 70 -30 70 30 30 30 L 20 30 Z" />
                        </svg>
                    </div>
                    <div id="vnavdrctident"></div>
                </div>
            </wt-tsc-button-content>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCVNAVAltitudeKeyboardHTMLElement.NAME, WT_G3x5_TSCVNAVAltitudeKeyboardHTMLElement);