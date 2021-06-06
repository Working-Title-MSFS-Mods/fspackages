/**
 * @abstract
 */
class WT_G3x5_TSCConfirmationPopUp extends WT_G3x5_TSCPopUpElement {
    /**
     * @readonly
     * @type {WT_G3x5_TSCConfirmationPopUpHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    async _initFromHTMLElement() {
        await WT_Wait.awaitCallback(() => this.htmlElement.isInitialized, this);
        this.htmlElement.okButton.addButtonListener(this._onOKButtonPressed.bind(this));
        this.htmlElement.cancelButton.addButtonListener(this._onCancelButtonPressed.bind(this));
    }

    onInit() {
        this._htmlElement = this._createHTMLElement();
        this.popUpWindow.appendChild(this.htmlElement);
        this._initFromHTMLElement();
    }

    _onOKButtonPressed() {
        this.context.callback(true);
        this.instrument.goBack();
    }

    _onCancelButtonPressed() {
        this.context.callback(false);
        this.instrument.goBack();
    }

    _onBackPressed() {
        this.context.callback(false);

        super._onBackPressed();
    }

    _onHomePressed() {
        this.context.callback(false);

        super._onHomePressed();
    }
}

/**
 * @abstract
 */
class WT_G3x5_TSCConfirmationPopUpHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
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
    get okButton() {
        return this._okButton;
    }

    /**
     * @readonly
     * @type {WT_TSCLabeledButton}
     */
    get cancelButton() {
        return this._cancelButton;
    }

    async _defineChildren() {
        [
            this._okButton,
            this._cancelButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, this._getOKButtonQuery(), WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, this._getCancelButtonQuery(), WT_TSCLabeledButton)
        ]);
    }

    _onInit() {
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        this._onInit();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }
}