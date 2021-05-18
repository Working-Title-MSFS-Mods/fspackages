class WT_G3x5_TSCPopUpElement extends NavSystemElement {
    constructor() {
        super();

        this._title = null;
        this._isInit = false;
        this._isActive = false;
    }

    /**
     * @readonly
     * @type {AS3000_TSC}
     */
    get instrument() {
        return this.gps;
    }

    /**
     * @readonly
     * @type {HTMLElement}
     */
    get popUpWindow() {
        return this._popUpWindow;
    }

    /**
     * @readonly
     * @type {String}
     */
    get title() {
        return this._title;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isActive() {
        return this._isActive;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCPopUpElementContext}
     */
    get context() {
        return this._context;
    }

    /**
     * @readonly
     * @property {String} homePageGroup
     * @type {String}
     */
    get homePageGroup() {
        return this.context ? this.context.homePageGroup : undefined;
    }

    /**
     * @readonly
     * @property {String} homePageName
     * @type {String}
     */
    get homePageName() {
        return this.context ? this.context.homePageName : undefined;
    }

    onInit() {
    }

    init(root) {
        this._popUpWindow = root;
        this._titleDisplay = root.querySelector(`.WindowTitle`);
        if (this._title === null && this._titleDisplay) {
            this._title = this._titleDisplay.textContent;
        } else {
            this._updateTitle();
        }
        this.onInit();
        this._isInit = true;
    }

    _cleanUpContext() {
    }

    _updateFromContext() {
    }

    setContext(context) {
        this._cleanUpContext();
        this._context = context;
        this._updateFromContext();
    }

    _updateTitle() {
        if (!this._titleDisplay) {
            return;
        }

        this._titleDisplay.textContent = this._title;
    }

    setTitle(title) {
        if (title === this._title) {
            return;
        }

        this._title = title;
        if (this._isInit) {
            this._updateTitle();
        }
    }

    _onBackPressed() {
        this.instrument.goBack();
    }

    _onHomePressed() {
        this.instrument.closePopUpElement();
        this.instrument.SwitchToPageName(this.context.homePageGroup, this.context.homePageName);
    }

    _setVisible(value) {
        this.popUpWindow.style.display = value ? "block" : "none";
    }

    _activateNavButtons() {
        this.instrument.activateNavButton(1, "Back", this._onBackPressed.bind(this), true, "ICON_TSC_BUTTONBAR_BACK.png");
        this.instrument.activateNavButton(2, "Home", this._onHomePressed.bind(this), true, "ICON_TSC_BUTTONBAR_HOME.png");
    }

    _deactivateNavButtons() {
        this.instrument.deactivateNavButton(1);
        this.instrument.deactivateNavButton(2);
    }

    onFocusGained() {
        this._activateNavButtons();
    }

    onFocusLost() {
        this._deactivateNavButtons();
    }

    onEnter() {
        this._setVisible(true);
        this._isActive = true;
    }

    onUpdate(deltaTime) {
    }

    onEvent(event) {
    }

    onExit() {
        this._setVisible(false);
        this._isActive = false;
    }
}

/**
 * @typedef WT_G3x5_TSCPopUpElementContext
 * @property {String} homePageGroup
 * @property {String} homePageName
 */