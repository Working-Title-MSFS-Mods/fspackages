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
                _numberClassList: [],
                _unitClassList: [WT_G3x5_PFDNavDMEInfoHTMLElement.UNIT_CLASS],

                getNumberClassList(numberUnit, forceUnit) {
                    return this._numberClassList;
                },
                getUnitClassList(numberUnit, forceUnit) {
                    return this._unitClassList;
                }
            },
            numberUnitDelim: ""
        });
    }

    _defineChildren() {
        this._navTitle = new WT_CachedElement(this.shadowRoot.querySelector(`#navtitle`));
        this._ident = new WT_CachedElement(this.shadowRoot.querySelector(`#ident`));
        this._frequency = new WT_CachedElement(this.shadowRoot.querySelector(`#frequency`));
        this._dmeTitle = new WT_CachedElement(this.shadowRoot.querySelector(`#dmetitle`));
        this._dme = new WT_CachedElement(this.shadowRoot.querySelector(`#dme`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    /**
     *
     * @param {{airplane:WT_PlayerAirplane, unitsSettingModel:WT_G3x5_UnitsSettingModel}} context
     */
    setContext(context) {
        this._context = context;
    }

    _clearDisplay() {
        this._navTitle.textContent = "";
        this._ident.textContent = "";
        this._frequency.textContent = "";
        this._dmeTitle.textContent = "";
        this._dme.innerHTML = "";
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateNavTitle(nav) {
        this._navTitle.textContent = nav.name;
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateIdent(nav) {
        this._ident.textContent = nav.isReceiving() ? nav.ident() : "";
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateFrequency(nav) {
        this._frequency.textContent = nav.activeFrequency().hertz(WT_Frequency.Prefix.MHz).toFixed(2);
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateDMETitle(nav, hasDME) {
        this._dmeTitle.textContent = `DME${nav.index}`;
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateDME(nav, hasDME) {
        let dme = nav.dme(this._tempNM);
        let text;
        if (dme) {
            text = this._distanceFormatter.getFormattedHTML(dme, this._context.unitsSettingModel.distanceSpeedSetting.getDistanceUnit());
        } else {
            text = `___${this._distanceFormatter.getFormattedUnitHTML(this._tempNM, this._context.unitsSettingModel.distanceSpeedSetting.getDistanceUnit())}`;
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