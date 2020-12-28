class WT_G3x5_TSCPageElement extends NavSystemElement {
    constructor(homePageGroup, homePageName) {
        super();

        this._homePageGroup = homePageGroup;
        this._homePageName = homePageName;
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
        this.gps.goBack();
    }

    _onHomePressed() {
        this.gps.SwitchToPageName(this.homePageGroup, this.homePageName);
    }

    onEnter() {
        this.gps.activateNavButton(1, "Back", this._onBackPressed.bind(this), false, "ICON_TSC_BUTTONBAR_BACK.png");
        this.gps.activateNavButton(2, "Home", this._onHomePressed.bind(this), false, "ICON_TSC_BUTTONBAR_HOME.png");
    }

    onExit() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
    }
}