class WT_G3x5_TSCPopUpElement extends NavSystemElement {
    constructor() {
        super();
    }

    /**
     * @readonly
     * @property {NavSystemTouch} instrument
     * @type {NavSystemTouch}
     */
    get instrument() {
        return this.gps;
    }

    /**
     * @readonly
     * @property {HTMLElement} popUpWindow
     * @type {HTMLElement}
     */
    get popUpWindow() {
        return this._popUpWindow;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCPopUpElementContext} context
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

    init(root) {
        this._popUpWindow = root;
    }

    setContext(context) {
        this._context = context;
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

    onEnter() {
        this._activateNavButtons();
        this._setVisible(true);
    }

    onUpdate(deltaTime) {
    }

    onEvent(event) {
    }

    _deactivateNavButtons() {
        this.instrument.deactivateNavButton(1);
        this.instrument.deactivateNavButton(2);
    }

    onExit() {
        this._setVisible(false);
        this._deactivateNavButtons();
    }
}

/**
 * @typedef WT_G3x5_TSCPopUpElementContext
 * @property {String} homePageGroup
 * @property {String} homePageName
 */