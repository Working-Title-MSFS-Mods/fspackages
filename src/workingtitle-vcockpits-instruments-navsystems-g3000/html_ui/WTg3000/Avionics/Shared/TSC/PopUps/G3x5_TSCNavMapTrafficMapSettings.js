class WT_G3x5_TSCNavMapTrafficMapSettings extends WT_G3x5_TSCPopUpElement {
    /**
     * @readonly
     * @type {WT_G3x5_TSCNavMapTrafficMapSettingsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCNavMapTrafficMapSettingsHTMLElement();
    }

    onInit() {
        this._htmlElement = this._createHTMLElement();
        this.popUpWindow.appendChild(this.htmlElement);
    }

    onEnter() {
        super.onEnter();

        this.htmlElement.setContext(this.context);
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }
}

class WT_G3x5_TSCNavMapTrafficMapSettingsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._symbolRangeListener = this._onSymbolRangeSettingChanged.bind(this);
        this._labelRangeListener = this._onLabelRangeSettingChanged.bind(this);

        /**
         * @type {{instrument:AS3000_TSC, settings:WT_G3x5_NavMapSettings, homePageGroup:String, homePageName:String}}
         */
        this._context = null;
        this._isInit = false;

        this._lastDistanceUnit = null;
    }

    _getTemplate() {
        return WT_G3x5_TSCNavMapTrafficMapSettingsHTMLElement.TEMPLATE;
    }

    async _defineChildren() {
        [
            this._labelShowButton,
            this._symbolRangeButton,
            this._labelRangeButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#labelshow`, WT_TSCStatusBarButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#symbolrange`, WT_G3x5_TSCRangeTypeDisplayButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#labelrange`, WT_G3x5_TSCRangeTypeDisplayButton)
        ]);
    }

    _initSymbolRangeWindowContext() {
        this._symbolRangeWindowContext = {
            title: "Map Traffic Symbol Range",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true
        };
    }

    _initLabelRangeWindowContext() {
        this._labelRangeWindowContext = {
            title: "Map Traffic Label Range",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true
        };
    }

    _initSelectionListWindowContexts() {
        this._initSymbolRangeWindowContext();
        this._initLabelRangeWindowContext();
    }

    _initButtonListeners() {
        this._symbolRangeButton.addButtonListener(this._onSymbolRangeButtonPressed.bind(this));
        this._labelRangeButton.addButtonListener(this._onLabelRangeButtonPressed.bind(this));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initSelectionListWindowContexts();
        this._initButtonListeners();
        this._isInit = true;
        if (this._context) {
            this._updateFromContext();
        }
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _cleanUpButtonManagers() {
        this._labelShowButtonManager.destroy();
    }

    _cleanUpSettingListeners() {
        this._context.settings.trafficSymbolRangeSetting.removeListener(this._symbolRangeListener);
        this._context.settings.trafficLabelRangeSetting.removeListener(this._labelRangeListener);
    }

    _cleanUpContext() {
        if (!this._context) {
            return;
        }

        this._cleanUpButtonManagers();
        this._cleanUpSettingListeners();
    }

    _updateSymbolRangeWindowContext() {
        let elementHandler = new WT_G3x5_TSCRangeSelectionElementHandler(this._context.settings.rangeSetting.ranges.filter(value => value.compare(WT_G3x5_NavMapSettings.TRAFFIC_SYMBOL_RANGE_MAX) <= 0), this._context.instrument.unitsSettingModel);

        this._symbolRangeWindowContext.elementConstructor = elementHandler;
        this._symbolRangeWindowContext.elementUpdater = elementHandler;
        this._symbolRangeWindowContext.callback = this._setRangeSetting.bind(this, this._context.settings.trafficSymbolRangeSetting);
        this._symbolRangeWindowContext.currentIndexGetter = new WT_G3x5_TSCMapSettingIndexGetter(this._context.settings.trafficSymbolRangeSetting);
    }

    _updateLabelRangeWindowContext() {
        let elementHandler = new WT_G3x5_TSCRangeSelectionElementHandler(this._context.settings.rangeSetting.ranges.filter(value => value.compare(WT_G3x5_NavMapSettings.TRAFFIC_LABEL_RANGE_MAX) <= 0), this._context.instrument.unitsSettingModel);

        this._labelRangeWindowContext.elementConstructor = elementHandler;
        this._labelRangeWindowContext.elementUpdater = elementHandler;
        this._labelRangeWindowContext.callback = this._setRangeSetting.bind(this, this._context.settings.trafficLabelRangeSetting);
        this._labelRangeWindowContext.currentIndexGetter = new WT_G3x5_TSCMapSettingIndexGetter(this._context.settings.trafficLabelRangeSetting);
    }

    _updateWindowContexts() {
        this._updateSymbolRangeWindowContext();
        this._updateLabelRangeWindowContext();
    }

    _initButtonManagers() {
        this._labelShowButtonManager = new WT_TSCSettingStatusBarButtonManager(this._labelShowButton, this._context.settings.trafficLabelShowSetting);
        this._labelShowButtonManager.init();
    }

    _initSettingListeners() {
        this._context.settings.trafficSymbolRangeSetting.addListener(this._symbolRangeListener);
        this._context.settings.trafficLabelRangeSetting.addListener(this._labelRangeListener);
    }

    _updateFromContext() {
        if (!this._context) {
            return;
        }

        this._updateWindowContexts();
        this._initButtonManagers();
        this._initSettingListeners();
    }

    setContext(context) {
        this._cleanUpContext();
        this._context = context;
        if (this._isInit) {
            this._updateFromContext();
        }
    }

    _onSymbolRangeSettingChanged(setting, newValue, oldValue) {
        let distanceUnit = this._context.instrument.unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
        this._updateRangeButton(this._symbolRangeButton, this._context.settings.trafficSymbolRangeSetting.getValue(), distanceUnit);
    }

    _onLabelRangeSettingChanged(setting, newValue, oldValue) {
        let distanceUnit = this._context.instrument.unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
        this._updateRangeButton(this._labelRangeButton, this._context.settings.trafficLabelRangeSetting.getValue(), distanceUnit);
    }

    _setRangeSetting(setting, value) {
        setting.setValue(value);
    }

    _openSelectionListWindow(windowContext) {
        if (!this._context) {
            return;
        }

        let instrument = this._context.instrument;
        windowContext.homePageGroup = this._context.homePageGroup;
        windowContext.homePageName = this._context.homePageName;
        instrument.selectionListWindow1.element.setContext(windowContext);
        instrument.switchToPopUpPage(instrument.selectionListWindow1);
    }

    _onSymbolRangeButtonPressed(button) {
        this._openSelectionListWindow(this._symbolRangeWindowContext);
    }

    _onLabelRangeButtonPressed(button) {
        this._openSelectionListWindow(this._labelRangeWindowContext);
    }

    _updateRangeButton(button, value, unit) {
        let range = this._context.settings.rangeSetting.ranges.get(value);
        button.setRange(range);
        button.setUnit(unit);
    }

    _updateUnits() {
        let distanceUnit = this._context.instrument.unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
        if (!distanceUnit.equals(this._lastDistanceUnit)) {
            this._updateRangeButton(this._symbolRangeButton, this._context.settings.trafficSymbolRangeSetting.getValue(), distanceUnit);
            this._updateRangeButton(this._labelRangeButton, this._context.settings.trafficLabelRangeSetting.getValue(), distanceUnit);
        }
        this._lastDistanceUnit = distanceUnit;
    }

    _doUpdate() {
        this._updateUnits();
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._doUpdate();
    }
}
WT_G3x5_TSCNavMapTrafficMapSettingsHTMLElement.NAME = "wt-tsc-navmaptraffic-mapsettings";
WT_G3x5_TSCNavMapTrafficMapSettingsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCNavMapTrafficMapSettingsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 3px;
            background: linear-gradient(#1f3445, black 25px);
            background-color: black;
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: absolute;
            left: var(--navmaptraffic-mapsettings-padding-left, 0.5em);
            top: var(--navmaptraffic-mapsettings-padding-top, 0.5em);
            width: calc(100% - var(--navmaptraffic-mapsettings-padding-left, 0.5em) - var(--navmaptraffic-mapsettings-padding-right, 0.5em));
            height: calc(100% - var(--navmaptraffic-mapsettings-padding-top, 0.5em) - var(--navmaptraffic-mapsettings-padding-bottom, 0.5em));
            display: grid;
            grid-template-rows: 1fr 1fr;
            grid-template-columns: 1fr 1fr;
            grid-gap: var(--navmaptraffic-mapsettings-button-row-gap, 0.5em) var(--navmaptraffic-mapsettings-button-column-gap, 0.5em);
        }
            #labelshow {
                grid-area: 2 / 1;
            }
            #symbolrange {
                grid-area: 1 / 2;
            }
            #labelrange {
                grid-area: 2 / 2;
            }
                wt-tsc-button-rangetypedisplay {
                    --button-value-font-size: 1.25em;
                }
    </style>
    <div id="wrapper">
        <wt-tsc-button-statusbar id="labelshow" class="button" labelText="Labels"></wt-tsc-button-statusbar>
        <wt-tsc-button-rangetypedisplay id="symbolrange" class="button" labelText="Symbols"></wt-tsc-button-rangetypedisplay>
        <wt-tsc-button-rangetypedisplay id="labelrange" class="button" labelText="Labels"></wt-tsc-button-rangetypedisplay>
    </div>
`;

customElements.define(WT_G3x5_TSCNavMapTrafficMapSettingsHTMLElement.NAME, WT_G3x5_TSCNavMapTrafficMapSettingsHTMLElement);