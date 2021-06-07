class WT_G3x5_TSCConfirmationTextPopUp extends WT_G3x5_TSCConfirmationPopUp {
    _createHTMLElement() {
        return new WT_G3x5_TSCConfirmationTextPopUpHTMLElement();
    }

    onEnter() {
        super.onEnter();

        this.htmlElement.setText(this.context.text);
    }
}

class WT_G3x5_TSCConfirmationTextPopUpHTMLElement extends WT_G3x5_TSCConfirmationPopUpHTMLElement {
    constructor() {
        super();

        this._text = "";
    }

    _getTemplate() {
        return WT_G3x5_TSCConfirmationTextPopUpHTMLElement.TEMPLATE;
    }

    _getOKButtonQuery() {
        return "#ok";
    }

    _getCancelButtonQuery() {
        return "#cancel";
    }

    async _defineChildren() {
        await super._defineChildren();

        this._textDisplay = this.shadowRoot.querySelector("#text");
    }

    _onInit() {
        this._updateFromText();
    }

    _updateFromText() {
        this._textDisplay.innerHTML = this._text;
    }

    setText(text) {
        if (text === this._text) {
            return;
        }

        this._text = text;
        if (this._isInit) {
            this._updateFromText();
        }
    }
}
WT_G3x5_TSCConfirmationTextPopUpHTMLElement.NAME = "wt-tsc-confirmtext";
WT_G3x5_TSCConfirmationTextPopUpHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCConfirmationTextPopUpHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            border-radius: 5px;
            background: linear-gradient(#1f3445, black 25px);
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: relative;
            left: var(--confirmtext-padding-left, 1em);
            width: calc(100% - var(--confirmtext-padding-left, 1em) - var(--confirmtext-padding-right, 1em));
            padding-top: var(--confirmtext-padding-top, 1em);
            padding-bottom: var(--confirmtext-padding-bottom, 1em);
            display: flex;
            flex-flow: column nowrap;
            align-items: stretch;
        }
            #text {
                margin-bottom: var(--confirmtext-text-margin-bottom, 0.5em);
                text-align: center;
            }
            #buttons {
                position: relative;
                width: 100%;
                display: flex;
                flex-flow: row nowrap;
                justify-content: space-between;
                align-items: center;
            }
                .button {
                    width: var(--confirmtext-button-width, 40%);
                    height: var(--confirmtext-button-height, 3em);
                    font-size: var(--confirmtext-button-font-size, 0.85em);
                }
    </style>
    <div id="wrapper">
        <div id="text"></div>
        <div id="buttons">
            <wt-tsc-button-label id="ok" class="button" labeltext="OK"></wt-tsc-button-label>
            <wt-tsc-button-label id="cancel" class="button" labeltext="Cancel"></wt-tsc-button-label>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCConfirmationTextPopUpHTMLElement.NAME, WT_G3x5_TSCConfirmationTextPopUpHTMLElement);