class WT_G3x5_TSCDirectoryPage extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName) {
        super(homePageGroup, homePageName);
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCDirectoryPageHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @returns {WT_G3x5_TSCDirectoryPageHTMLElement}
     */
    _createHTMLElement() {
    }

    _doInitButtons() {
    }

    async _initButtons() {
        await WT_Wait.awaitCallback(() => this.htmlElement.isInitialized, this);
        this._doInitButtons();
    }

    init(root) {
        this.container.title = this._getTitle();
        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);

        this._initButtons();
    }

    _openPage(pageName) {
        this.instrument.SwitchToPageName(this.homePageGroup, pageName);
    }
}

class WT_G3x5_TSCDirectoryPageHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInitialized() {
        return this._isInit;
    }

    async _defineButtons() {

    }

    async _defineChildren() {
        await this._defineButtons();
    }

    _initChildren() {
    }

    async _doInitialization() {
        await this._defineChildren();
        this._initChildren();
    }

    async _connectedCallbackHelper() {
        await this._doInitialization();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }
}