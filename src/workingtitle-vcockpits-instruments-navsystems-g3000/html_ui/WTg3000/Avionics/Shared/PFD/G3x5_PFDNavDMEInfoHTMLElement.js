class WT_G3x5_PFDNavDMEInfoHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._initDistanceFormatter();

        this._context = null;
        this._isInit = false;

        this._tempNM = WT_Unit.NMILE.createNumber(0);
    }

    _initDistanceFormatter() {
        let formatter = new WT_NumberFormatter({
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        });
        this._distanceFormatter = new WT_NumberHTMLFormatter(formatter, {
            classGetter: {
                getNumberClassList: (numberUnit, forceUnit) => [],
                getUnitClassList: (numberUnit, forceUnit) => [WT_G3x5_PFDNavDMEInfoHTMLElement.UNIT_CLASS]
            },
            numberUnitDelim: ""
        });
    }

    _defineChildren() {
        this._navTitle = new WT_CachedHTML(this.shadowRoot.querySelector(`#navtitle`));
        this._ident = new WT_CachedHTML(this.shadowRoot.querySelector(`#ident`));
        this._frequency = new WT_CachedHTML(this.shadowRoot.querySelector(`#frequency`));
        this._dmeTitle = new WT_CachedHTML(this.shadowRoot.querySelector(`#dmetitle`));
        this._dme = new WT_CachedHTML(this.shadowRoot.querySelector(`#dme`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    /**
     *
     * @param {{airplane:WT_PlayerAirplane, unitsController:WT_G3x5_UnitsController}} context
     */
    setContext(context) {
        this._context = context;
    }

    _clearDisplay() {
        this._navTitle.innerHTML = "";
        this._ident.innerHTML = "";
        this._frequency.innerHTML = "";
        this._dmeTitle.innerHTML = "";
        this._dme.innerHTML = "";
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateNavTitle(nav) {
        this._navTitle.innerHTML = nav.name;
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateIdent(nav) {
        this._ident.innerHTML = nav.isReceiving() ? nav.ident() : "";
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateFrequency(nav) {
        this._frequency.innerHTML = nav.activeFrequency().hertz(WT_Frequency.Prefix.MHz).toFixed(2);
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateDMETitle(nav, hasDME) {
        this._dmeTitle.innerHTML = `DME${nav.index}`;
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateDME(nav, hasDME) {
        let dme = nav.dme(this._tempNM);
        let text;
        if (dme) {
            text = this._distanceFormatter.getFormattedHTML(dme, this._context.unitsController.distanceSpeedSetting.getDistanceUnit());
        } else {
            text = `___${this._distanceFormatter.getFormattedUnitHTML(this._tempNM, this._context.unitsController.distanceSpeedSetting.getDistanceUnit())}`;
        }
        this._dme.innerHTML = text;
    }

    _updateDisplay() {
        let source = this._context.airplane.autopilot.navigationSource();
        if (source === WT_AirplaneAutopilot.NavSource.FMS) {
            this._clearDisplay();
        } else {
            let nav = this._context.airplane.navCom.getNav(source);
            let hasDME = nav.hasDME();
            this._updateNavTitle(nav);
            this._updateIdent(nav);
            this._updateFrequency(nav);
            this._updateDMETitle(nav, hasDME);
            this._updateDME(nav, hasDME);
        }
    }

    update() {
        this._updateDisplay();
    }
}
WT_G3x5_PFDNavDMEInfoHTMLElement.UNIT_CLASS = "unit";