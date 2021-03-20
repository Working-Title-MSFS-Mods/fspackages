class WT_G3x5_TSCPageElement extends NavSystemElement {
    constructor(homePageGroup, homePageName) {
        super();

        this._homePageGroup = homePageGroup;
        this._homePageName = homePageName;
    }

    /**
     * @readonly
     * @property {AS3000_TSC} instrument
     * @type {AS3000_TSC}
     */
    get instrument() {
        return this.gps;
    }

    /**
     * @readonly
     * @property {String} homePageGroup
     * @type {String}
     */
    get homePageGroup() {
        return this._homePageGroup;
    }

    /**
     * @readonly
     * @property {String} homePageName
     * @type {String}
     */
    get homePageName() {
        return this._homePageName;
    }

    _onBackPressed() {
        this.instrument.goBack();
    }

    _onHomePressed() {
        this.instrument.SwitchToPageName(this.homePageGroup, this.homePageName);
    }

    _activateNavButtons() {
        this.instrument.activateNavButton(1, "Back", this._onBackPressed.bind(this), false, "ICON_TSC_BUTTONBAR_BACK.png");
        this.instrument.activateNavButton(2, "Home", this._onHomePressed.bind(this), false, "ICON_TSC_BUTTONBAR_HOME.png");
    }

    _deactivateNavButtons() {
        this.instrument.deactivateNavButton(1);
        this.instrument.deactivateNavButton(2);
    }

    onEnter() {
        this._activateNavButtons();
    }

    onUpdate(deltaTime) {
    }

    onEvent(event) {
    }

    onExit() {
        this._deactivateNavButtons();
    }
}