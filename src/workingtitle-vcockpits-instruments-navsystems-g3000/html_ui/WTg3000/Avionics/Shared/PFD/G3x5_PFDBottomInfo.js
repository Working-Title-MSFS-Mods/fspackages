class WT_G3x5_PFDBottomInfo extends NavSystemElement {
    constructor(unitsController, bearingInfos) {
        super();

        this._unitsController = unitsController;
        this._bearingInfos = bearingInfos;

        /**
         * @type {WT_G3x5_PFDBottomInfoCell[]}
         */
        this._cells = [];
    }

    /**
     * @readonly
     * @property {WT_G3x5_PFDBottomInfoHTMLElement} htmlElement
     * @type {WT_G3x5_PFDBottomInfoHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_PFDBottomInfoHTMLElement();
        return htmlElement;
    }

    _initInfoCells() {
    }

    /**
     *
     * @param {WT_G3x5_PFDBottomInfoCell} cell
     */
    addCell(cell) {
        this._cells.push(cell);
        cell.htmlElement.classList.add(WT_G3x5_PFDBottomInfo.CELL_CLASS);
        this.htmlElement.appendChild(cell.htmlElement);
    }

    init(root) {
        let container = root.querySelector(`#InstrumentsContainer`);
        this._htmlElement = this._createHTMLElement();
        this._initInfoCells();
        container.appendChild(this.htmlElement);
    }

    onEnter() {
    }

    onUpdate(deltaTime) {
        this._cells.forEach(cell => cell.update());
    }

    onExit() {
    }

    onEvent(event) {
    }
}
WT_G3x5_PFDBottomInfo.CELL_CLASS = "pfdBottomInfoCell";

class WT_G3x5_PFDBottomInfoHTMLElement extends HTMLElement {
}
WT_G3x5_PFDBottomInfoHTMLElement.NAME = "wt-pfd-bottominfo";
WT_StyleInjector.inject(`
    ${WT_G3x5_PFDBottomInfoHTMLElement.NAME} {
        display: block;
        background-color: #1a1d21;
    }
`);

customElements.define(WT_G3x5_PFDBottomInfoHTMLElement.NAME, WT_G3x5_PFDBottomInfoHTMLElement);

class WT_G3x5_PFDBottomInfoCell {
    constructor() {
        this._htmlElement = this._createHTMLElement();
    }

    _createHTMLElement() {
    }

    /**
     * @readonly
     * @property {HTMLElement} htmlElement
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    update() {
    }
}

class WT_G3x5_PFDBottomInfoAirspeedCell extends WT_G3x5_PFDBottomInfoCell {
    /**
     *
     * @param {WT_G3x5_UnitsController} unitsController
     */
    constructor(unitsController) {
        super();

        this._unitsController = unitsController;
        this._initModels();
        this._initUnitsListeners();
        this._setHTMLElementContext();
    }

    _createHTMLElement() {
        return new WT_G3x5_PFDBottomInfoAirspeedCellHTMLElement();
    }

    _initModels() {
        this._tasModel = new WT_NumberUnitModelSimVar(WT_Unit.KNOT, "AIRSPEED TRUE", "knots");
        this._gsModel = new WT_NumberUnitModelSimVar(WT_Unit.KNOT, "GPS GROUND SPEED", "knots");
        this._updateUnits();
    }

    _initUnitsListeners() {
        this._unitsController.distanceSpeedSetting.addListener(this._onSpeedUnitsChanged.bind(this));
    }

    _setHTMLElementContext() {
        this.htmlElement.setContext({
            tasModel: this._tasModel,
            gsModel: this._gsModel
        });
    }

    _updateUnits() {
        let speedUnit = this._unitsController.distanceSpeedSetting.getSpeedUnit();
        this._tasModel.setUnit(speedUnit);
        this._gsModel.setUnit(speedUnit);
    }

    _onSpeedUnitsChanged(setting, newValue, oldValue) {
        this._updateUnits();
    }

    update() {
        this.htmlElement.update();
    }
}

class WT_G3x5_PFDBottomInfoAirspeedCellHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_PFDBottomInfoAirspeedCellHTMLElement.TEMPLATE.content.cloneNode(true));

        let formatter = new WT_NumberFormatter({
            precision: 1,
            unitCaps: true
        });
        this._htmlFormatter = new WT_NumberHTMLFormatter(formatter, {
            classGetter: {
                getNumberClassList: (numberUnit, forceUnit) => [],
                getUnitClassList: (numberUnit, forceUnit) => [WT_G3x5_PFDBottomInfoAirspeedCellHTMLElement.UNIT_CLASS]
            },
            numberUnitDelim: ""
        });

        /**
         * @type {{tasModel:WT_NumberUnitModel,gsModel:WT_NumberUnitModel}}
         */
        this._context = null;
        this._isInit = false;
    }

    _defineChildren() {
        this._tasValue = new WT_CachedHTML(this.shadowRoot.querySelector(`#tas .value`));
        this._gsValue = new WT_CachedHTML(this.shadowRoot.querySelector(`#gs .value`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    setContext(context) {
        this._context = context;
    }

    _updateTAS() {
        let tasModel = this._context.tasModel;
        this._tasValue.innerHTML = this._htmlFormatter.getFormattedHTML(tasModel.getValue(), tasModel.getUnit());
    }

    _updateGS() {
        let gsModel = this._context.gsModel;
        this._gsValue.innerHTML = this._htmlFormatter.getFormattedHTML(gsModel.getValue(), gsModel.getUnit());
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateTAS();
        this._updateGS();
    }
}
WT_G3x5_PFDBottomInfoAirspeedCellHTMLElement.NAME = "wt-pfd-bottominfo-airspeedcell";
WT_G3x5_PFDBottomInfoAirspeedCellHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_PFDBottomInfoAirspeedCellHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_PFDBottomInfoAirspeedCellHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            color: white;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 50% 50%;
            grid-template-columns: 100%;
            align-items: center;
        }
            #wrapper div {
                display: flex;
                flex-flow: row nowrap;
                align-items: baseline;
                justify-content: space-between;
            }
                .title {
                    font-size: var(--airspeedcell-title-font-size, 0.75em);
                }
                .value {
                    display: block;
                }
                .${WT_G3x5_PFDBottomInfoAirspeedCellHTMLElement.UNIT_CLASS} {
                    font-size: var(--airspeedcell-unit-font-size, 0.75em);
                }
    </style>
    <div id="wrapper">
        <div id="tas">
            <div class="title">TAS</div>
            <div class="value"></div>
        </div>
        <div id="gs">
            <div class="title">GS</div>
            <div class="value"></div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_PFDBottomInfoAirspeedCellHTMLElement.NAME, WT_G3x5_PFDBottomInfoAirspeedCellHTMLElement);

class WT_G3x5_PFDBottomInfoTemperatureCell extends WT_G3x5_PFDBottomInfoCell {
    /**
     *
     * @param {WT_G3x5_UnitsController} unitsController
     */
    constructor(unitsController) {
        super();

        this._unitsController = unitsController;
        this._initModels();
        this._initUnitsListeners();
        this._setHTMLElementContext();
    }

    _createHTMLElement() {
        return new WT_G3x5_PFDBottomInfoTemperatureCellHTMLElement();
    }

    _initModels() {
        this._oatModel = new WT_NumberUnitModelSimVar(WT_Unit.CELSIUS, "AMBIENT TEMPERATURE", "celsius");
        this._isaModel = new WT_NumberUnitModelSimVar(WT_Unit.CELSIUS, "STANDARD ATM TEMPERATURE", "celsius");
        this._updateUnits();
    }

    _initUnitsListeners() {
        this._unitsController.extTemperatureSetting.addListener(this._onTemperatureUnitsChanged.bind(this));
    }

    _setHTMLElementContext() {
        this.htmlElement.setContext({
            oatModel: this._oatModel,
            isaModel: this._isaModel
        });
    }

    _updateUnits() {
        let temperatureUnit = this._unitsController.extTemperatureSetting.getTemperatureUnit();
        this._oatModel.setUnit(temperatureUnit);
        this._isaModel.setUnit(temperatureUnit);
    }

    _onTemperatureUnitsChanged(setting, newValue, oldValue) {
        this._updateUnits();
    }

    update() {
        this.htmlElement.update();
    }
}

class WT_G3x5_PFDBottomInfoTemperatureCellHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_PFDBottomInfoTemperatureCellHTMLElement.TEMPLATE.content.cloneNode(true));

        let formatter = new WT_NumberFormatter({
            precision: 1
        });
        this._htmlFormatter = new WT_NumberHTMLFormatter(formatter, {
            classGetter: {
                getNumberClassList: (numberUnit, forceUnit) => [],
                getUnitClassList: (numberUnit, forceUnit) => [WT_G3x5_PFDBottomInfoTemperatureCellHTMLElement.UNIT_CLASS]
            },
            numberUnitDelim: ""
        });

        /**
         * @type {{oatModel:WT_NumberUnitModel,isaModel:WT_NumberUnitModel}}
         */
        this._context = null;
        this._isInit = false;
    }

    _defineChildren() {
        this._oatValue = new WT_CachedHTML(this.shadowRoot.querySelector(`#oat .value`));
        this._isaValue = new WT_CachedHTML(this.shadowRoot.querySelector(`#isa .value`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    setContext(context) {
        this._context = context;
    }

    _updateOAT() {
        let oatModel = this._context.oatModel;
        this._oatValue.innerHTML = this._htmlFormatter.getFormattedHTML(oatModel.getValue(), oatModel.getUnit());
    }

    _updateISA() {
        let isaModel = this._context.isaModel;
        this._isaValue.innerHTML = this._htmlFormatter.getFormattedHTML(isaModel.getValue(), isaModel.getUnit());
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateOAT();
        this._updateISA();
    }
}
WT_G3x5_PFDBottomInfoTemperatureCellHTMLElement.NAME = "wt-pfd-bottominfo-temperaturecell";
WT_G3x5_PFDBottomInfoTemperatureCellHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_PFDBottomInfoTemperatureCellHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_PFDBottomInfoTemperatureCellHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            color: white;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 50% 50%;
            grid-template-columns: 100%;
            align-items: center;
        }
            #wrapper div {
                display: flex;
                flex-flow: row nowrap;
                align-items: baseline;
                justify-content: space-between;
            }
                .title {
                    font-size: var(--temperaturecell-title-font-size, 0.75em);
                }
                .value {
                    display: block;
                }
                .${WT_G3x5_PFDBottomInfoTemperatureCellHTMLElement.UNIT_CLASS} {
                    font-size: var(--temperaturecell-unit-font-size, 1em);
                }
    </style>
    <div id="wrapper">
        <div id="oat">
            <div class="title">OAT</div>
            <div class="value"></div>
        </div>
        <div id="isa">
            <div class="title">ISA</div>
            <div class="value"></div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_PFDBottomInfoTemperatureCellHTMLElement.NAME, WT_G3x5_PFDBottomInfoTemperatureCellHTMLElement);

class WT_G3x5_PFDBottomInfoBearingCell extends WT_G3x5_PFDBottomInfoCell {
    constructor(bearingInfoModel) {
        super();

        this._model = bearingInfoModel;
        this._setHTMLElementContext();
    }

    _createHTMLElement() {
    }

    _setHTMLElementContext() {
        this.htmlElement.setContext({
            model: this._model
        });
    }

    update() {
        this.htmlElement.update();
    }
}

class WT_G3x5_PFDBottomInfoBearingCellHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._initDistanceFormatter();
        this._initBearingFormatter();

        this._hasData = false;

        /**
         * @type {{model:WT_G3x5_PFDBearingInfoModel}}
         */
        this._context = null;
        this._isInit = false;
    }

    _getTemplate() {
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
                getUnitClassList: (numberUnit, forceUnit) => [WT_G3x5_PFDBottomInfoBearingCellHTMLElement.UNIT_CLASS]
            },
            numberUnitDelim: ""
        });
    }

    _initBearingFormatter() {
        this._bearingFormatter = new WT_NumberFormatter({
            precision: 1,
            unitSpaceBefore: false
        });
    }

    _defineChildren() {
        this._arrow = this.shadowRoot.querySelector(`#arrow`);
        this._sourceValue = new WT_CachedHTML(this.shadowRoot.querySelector(`#source`));
        this._identValue = new WT_CachedHTML(this.shadowRoot.querySelector(`#ident`));
        this._distanceValue = new WT_CachedHTML(this.shadowRoot.querySelector(`#distance`));
        this._bearingValue = new WT_CachedHTML(this.shadowRoot.querySelector(`#bearing`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;

        if (this._context) {
            this._updateFromContext();
        }
    }

    _updateArrow() {
        let slot = this._context ? this._context.model.slot : "none";
        this._arrow.setAttribute("infoSlot", slot);
    }

    _updateFromContext() {
        this._updateArrow();
    }

    setContext(context) {
        this._context = context;
        if (this._isInit) {
            this._updateFromContext();
        }
    }

    _updateSource(source, hasData) {
        this._sourceValue.innerHTML = WT_G3x5_PFDBottomInfoBearingCellHTMLElement.SOURCE_TEXT[source];
    }

    _updateIdent(source, hasData) {
        let text;
        if (hasData) {
            text = this._context.model.getIdent();
        } else {
            text = "";
        }
        this._identValue.innerHTML = text;
    }

    _updateDistance(source, hasData) {
        let text;
        if (hasData && this._context.model.hasDistance()) {
            let numberModel = this._context.model.getDistance();
            text = this._distanceFormatter.getFormattedHTML(numberModel.getValue(), numberModel.getUnit());
        } else {
            text = "";
        }
        this._distanceValue.innerHTML = text;
    }

    _updateBearing(source, hasData) {
        let text;
        if (hasData) {
            let numberModel = this._context.model.getBearing();
            text = this._bearingFormatter.getFormattedString(numberModel.getValue(), numberModel.getUnit());
        } else {
            text = "NONE";
        }
        this._bearingValue.innerHTML = text;

        // hack for formatting
        this._bearingValue.setAttribute("visible", hasData);
    }

    _updateDisplay() {
        let source = this._context.model.getSource();
        let hasData = this._context.model.hasData();
        this._updateSource(source, hasData);
        this._updateIdent(source, hasData);
        this._updateDistance(source, hasData);
        this._updateBearing(source, hasData);
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateDisplay();
    }
}
WT_G3x5_PFDBottomInfoBearingCellHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_PFDBottomInfoBearingCellHTMLElement.SOURCE_TEXT = [
    "OFF",
    "NAV1",
    "NAV2",
    "FMS",
    "ADF"
];

class WT_G3x5_PFDBottomInfoTimeCell extends WT_G3x5_PFDBottomInfoCell {
    constructor() {
        super();

        this._initTimer();
        this._initUTCModel();
        this._setHTMLElementContext();
    }

    _createHTMLElement() {
        return new WT_G3x5_PFDBottomInfoTimeCellHTMLElement();
    }

    _initTimer() {
        this._timer = new WT_Timer("Generic");
        this._timer.clear();
    }

    _initUTCModel() {
        this._utcModel = new WT_NumberUnitModelAutoUpdated(WT_Unit.SECOND, {
            updateValue(value) {
                value.set(SimVar.GetGlobalVarValue("ZULU TIME", "seconds") % 86400);
            }
        });
    }

    _setHTMLElementContext() {
        this.htmlElement.setContext({
            timer: this._timer,
            utcModel: this._utcModel
        });
    }

    update() {
        this._timer.update();
        this.htmlElement.update();
    }
}

class WT_G3x5_PFDBottomInfoTimeCellHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_PFDBottomInfoTimeCellHTMLElement.TEMPLATE.content.cloneNode(true));

        this._formatter = new WT_TimeFormatter({round: 0});

        /**
         * @type {{timer:WT_Timer,utcModel:WT_NumberUnitModel}}
         */
        this._context = null;
        this._isInit = false;
    }

    _defineChildren() {
        this._timerValue = new WT_CachedHTML(this.shadowRoot.querySelector(`#timer .value`));
        this._utcValue = new WT_CachedHTML(this.shadowRoot.querySelector(`#utc .value`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    setContext(context) {
        this._context = context;
    }

    _updateTimer() {
        let timer = this._context.timer;
        this._timerValue.innerHTML = this._formatter.getFormattedString(timer.value);
    }

    _updateUTC() {
        let utcModel = this._context.utcModel;
        this._utcValue.innerHTML = this._formatter.getFormattedString(utcModel.getValue());
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateTimer();
        this._updateUTC();
    }
}
WT_G3x5_PFDBottomInfoTimeCellHTMLElement.NAME = "wt-pfd-bottominfo-timecell";
WT_G3x5_PFDBottomInfoTimeCellHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_PFDBottomInfoTimeCellHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            color: white;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 50% 50%;
            grid-template-columns: 100%;
            align-items: center;
        }
            #wrapper div {
                display: flex;
                flex-flow: row nowrap;
                align-items: baseline;
                justify-content: space-between;
            }
                .title {
                    font-size: var(--timecell-title-font-size, 0.75em);
                }
                .value {
                    display: block;
                }
    </style>
    <div id="wrapper">
        <div id="timer">
            <div class="title">TMR</div>
            <div class="value"></div>
        </div>
        <div id="utc">
            <div class="title">UTC</div>
            <div class="value"></div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_PFDBottomInfoTimeCellHTMLElement.NAME, WT_G3x5_PFDBottomInfoTimeCellHTMLElement);