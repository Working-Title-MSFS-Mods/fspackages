class WT_G3x5_PFDBottomInfo extends WT_G3x5_PFDElement {
    constructor() {
        super();

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

    _initBearingInfos() {
        this._bearingInfos = new WT_G3x5_PFDBearingInfoContainer(this.instrument.airplane, this.instrument.unitsSettingModel);
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
        this._initBearingInfos();

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
        background-color: var(--wt-g3x5-bggray);
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
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     */
    constructor(unitsSettingModel) {
        super();

        this._unitsSettingModel = unitsSettingModel;
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
        this._unitsSettingModel.distanceSpeedSetting.addListener(this._onSpeedUnitsChanged.bind(this));
    }

    _setHTMLElementContext() {
        this.htmlElement.setContext({
            tasModel: this._tasModel,
            gsModel: this._gsModel
        });
    }

    _updateUnits() {
        let speedUnit = this._unitsSettingModel.distanceSpeedSetting.getSpeedUnit();
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

        this._formatter = new WT_NumberFormatter({
            precision: 1,
            unitCaps: true
        });

        /**
         * @type {{tasModel:WT_NumberUnitModel,gsModel:WT_NumberUnitModel}}
         */
        this._context = null;
        this._isInit = false;
    }

    async _defineChildren() {
        [
            this._tasValue,
            this._gsValue
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, "#tas .value", WT_NumberUnitView),
            WT_CustomElementSelector.select(this.shadowRoot, "#gs .value", WT_NumberUnitView)
        ]);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    setContext(context) {
        this._context = context;
    }

    _updateTAS() {
        let tasModel = this._context.tasModel;
        let value = tasModel.getValue();
        let displayUnit = tasModel.getUnit();
        this._tasValue.setNumberText(this._formatter.getFormattedNumber(value, displayUnit));
        this._tasValue.setUnitText(this._formatter.getFormattedUnit(value, displayUnit));
    }

    _updateGS() {
        let gsModel = this._context.gsModel;
        let value = gsModel.getValue();
        let displayUnit = gsModel.getUnit();
        this._gsValue.setNumberText(this._formatter.getFormattedNumber(value, displayUnit));
        this._gsValue.setUnitText(this._formatter.getFormattedUnit(value, displayUnit));
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
    </style>
    <div id="wrapper">
        <div id="tas">
            <div class="title">TAS</div>
            <wt-numberunit class="value"></wt-numberunit>
        </div>
        <div id="gs">
            <div class="title">GS</div>
            <wt-numberunit class="value"></wt-numberunit>
        </div>
    </div>
`;

customElements.define(WT_G3x5_PFDBottomInfoAirspeedCellHTMLElement.NAME, WT_G3x5_PFDBottomInfoAirspeedCellHTMLElement);

class WT_G3x5_PFDBottomInfoTemperatureCell extends WT_G3x5_PFDBottomInfoCell {
    /**
     *
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     */
    constructor(unitsSettingModel) {
        super();

        this._unitsSettingModel = unitsSettingModel;
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
        this._unitsSettingModel.extTemperatureSetting.addListener(this._onTemperatureUnitsChanged.bind(this));
    }

    _setHTMLElementContext() {
        this.htmlElement.setContext({
            oatModel: this._oatModel,
            isaModel: this._isaModel
        });
    }

    _updateUnits() {
        let temperatureUnit = this._unitsSettingModel.extTemperatureSetting.getTemperatureUnit();
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

        this._formatter = new WT_NumberFormatter({
            precision: 1
        });

        /**
         * @type {{oatModel:WT_NumberUnitModel,isaModel:WT_NumberUnitModel}}
         */
        this._context = null;
        this._isInit = false;
    }

    async _defineChildren() {
        [
            this._oatValue,
            this._isaValue
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, "#oat .value", WT_NumberUnitView),
            WT_CustomElementSelector.select(this.shadowRoot, "#isa .value", WT_NumberUnitView)
        ]);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    setContext(context) {
        this._context = context;
    }

    _updateOAT() {
        let oatModel = this._context.oatModel;
        let value = oatModel.getValue();
        let displayUnit = oatModel.getUnit();
        this._oatValue.setNumberText(this._formatter.getFormattedNumber(value, displayUnit));
        this._oatValue.setUnitText(this._formatter.getFormattedUnit(value, displayUnit));
    }

    _updateISA() {
        let isaModel = this._context.isaModel;
        let value = isaModel.getValue();
        let displayUnit = isaModel.getUnit();
        this._isaValue.setNumberText(this._formatter.getFormattedNumber(value, displayUnit));
        this._isaValue.setUnitText(this._formatter.getFormattedUnit(value, displayUnit));
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
                    --numberunit-unit-font-size: 1em;
                }
    </style>
    <div id="wrapper">
        <div id="oat">
            <div class="title">OAT</div>
            <wt-numberunit class="value"></wt-numberunit>
        </div>
        <div id="isa">
            <div class="title">ISA</div>
            <wt-numberunit class="value"></wt-numberunit>
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

        /**
         * @type {{model:WT_G3x5_PFDBearingInfoModel}}
         */
        this._context = null;
        this._isInit = false;
    }

    _getTemplate() {
    }

    _initDistanceFormatter() {
        this._distanceFormatter = new WT_NumberFormatter({
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        });
    }

    _initBearingFormatter() {
        this._bearingFormatter = new WT_NumberFormatter({
            precision: 1,
            unitSpaceBefore: false
        });
    }

    async _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));
        this._arrow = this.shadowRoot.querySelector(`#arrow`);
        this._sourceValue = new WT_CachedElement(this.shadowRoot.querySelector(`#source`), {cacheAttributes: false});
        this._identValue = new WT_CachedElement(this.shadowRoot.querySelector(`#ident`), {cacheAttributes: false});
        this._bearingValue = new WT_CachedElement(this.shadowRoot.querySelector(`#bearing`), {cacheAttributes: false});

        this._distanceValue = await WT_CustomElementSelector.select(this.shadowRoot, "#distance");
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;

        if (this._context) {
            this._updateFromContext();
        }
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateArrow() {
        let slot = this._context ? this._context.model.slot : "none";
        this._arrow.setAttribute("infoSlot", `${slot}`);
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

    _updateNoSource(source) {
        this._wrapper.setAttribute("nosource", `${source === WT_G3x5_PFDBearingInfoModel.Source.NONE}`);
    }

    _updateNoData(source, hasData) {
        this._wrapper.setAttribute("nodata", `${source !== WT_G3x5_PFDBearingInfoModel.Source.NONE && !hasData}`);
    }

    _updateSource(source, hasData) {
        this._sourceValue.textContent = WT_G3x5_PFDBottomInfoBearingCellHTMLElement.SOURCE_TEXT[source];
    }

    _updateIdent(source, hasData) {
        let text;
        if (hasData) {
            text = this._context.model.getIdent();
        } else {
            text = "";
        }
        this._identValue.textContent = text;
    }

    _updateDistance(source, hasData) {
        let numberText;
        let unitText;
        if (hasData && this._context.model.hasDistance()) {
            let model = this._context.model.getDistance();
            let value = model.getValue();
            let displayUnit = model.getUnit();
            numberText = this._distanceFormatter.getFormattedNumber(value, displayUnit);
            unitText = this._distanceFormatter.getFormattedUnit(value, displayUnit);
        } else {
            numberText = "";
            unitText = "";
        }
        this._distanceValue.setNumberText(numberText);
        this._distanceValue.setUnitText(unitText);
    }

    _updateBearing(source, hasData) {
        let text;
        if (hasData && this._context.model.hasBearing()) {
            let numberModel = this._context.model.getBearing();
            text = this._bearingFormatter.getFormattedString(numberModel.getValue(), numberModel.getUnit());
        } else {
            text = "";
        }
        this._bearingValue.textContent = text;
    }

    _updateDisplay() {
        let source = this._context.model.getSource();
        let hasData = this._context.model.hasData();
        this._updateNoSource(source);
        this._updateNoData(source, hasData);
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
WT_G3x5_PFDBottomInfoBearingCellHTMLElement.SOURCE_TEXT = [
    "OFF",
    "NAV1",
    "NAV2",
    "FMS",
    "ADF"
];

class WT_G3x5_PFDBottomInfoTimeCell extends WT_G3x5_PFDBottomInfoCell {
    /**
     * @param {WT_G3x5_PFD} instrument
     */
    constructor(instrument) {
        super();

        this._instrument = instrument;
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
        let instrument = this._instrument;
        this._currentTimeModel = new WT_TimeModelAutoUpdated("{hour-24-pad}:{minute-pad}:{second-pad}", {
            updateTime(time) {
                time.set(instrument.time);
            }
        });
    }

    _setHTMLElementContext() {
        this.htmlElement.setContext({
            timer: this._timer,
            currentTimeModel: this._currentTimeModel
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
         * @type {{timer:WT_Timer,currentTimeModel:WT_TimeModel}}
         */
        this._context = null;
        this._isInit = false;
    }

    _defineChildren() {
        this._timerValue = new WT_CachedElement(this.shadowRoot.querySelector(`#timer .value`));
        this._utcValue = new WT_CachedElement(this.shadowRoot.querySelector(`#utc .value`));
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
        this._timerValue.textContent = this._formatter.getFormattedString(timer.value);
    }

    _updateUTC() {
        let utcModel = this._context.currentTimeModel;
        this._utcValue.textContent = utcModel.getTimezone().format(utcModel.getTime(), utcModel.getFormat());
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