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
        this._distanceFormatter = new WT_NumberFormatter({
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        });
    }

    async _defineChildren() {
        this._navTitle = new WT_CachedElement(this.shadowRoot.querySelector("#navtitle"), {cacheAttributes: false});
        this._ident = new WT_CachedElement(this.shadowRoot.querySelector("#ident"), {cacheAttributes: false});
        this._frequency = new WT_CachedElement(this.shadowRoot.querySelector("#frequency"), {cacheAttributes: false});
        this._dmeTitle = new WT_CachedElement(this.shadowRoot.querySelector("#dmetitle"), {cacheAttributes: false});

        this._dme = await WT_CustomElementSelector.select(this.shadowRoot, "#dme", WT_NumberUnitView);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
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
        this._dme.setNumberText("");
        this._dme.setUnitText("");
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
        let displayUnit = this._context.unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
        let numberText;
        let unitText;
        if (dme) {
            numberText = this._distanceFormatter.getFormattedNumber(dme, displayUnit);
            unitText = this._distanceFormatter.getFormattedUnit(dme, displayUnit);
        } else {
            numberText = "___";
            unitText = this._distanceFormatter.getFormattedUnit(this._tempNM, displayUnit)
        }
        this._dme.setNumberText(numberText);
        this._dme.setUnitText(unitText);
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
        if (!this._isInit) {
            return;
        }

        this._updateDisplay();
    }
}