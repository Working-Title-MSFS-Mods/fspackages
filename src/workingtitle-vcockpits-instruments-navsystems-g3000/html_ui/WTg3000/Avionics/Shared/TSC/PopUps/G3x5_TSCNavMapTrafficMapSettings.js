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

        /**
         * @type {{instrument:AS3000_TSC, getSettingModelID:() => String, homePageGroup:String, homePageName:String}}
         */
        this._context = null;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCNavMapTrafficMapSettingsHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        let labelShowButton = this.shadowRoot.querySelector(`#labelshow`);
        let symbolRangeButton = this.shadowRoot.querySelector(`#symbolrange`);
        let labelRangeButton = this.shadowRoot.querySelector(`#labelrange`);
        if (labelShowButton instanceof WT_TSCStatusBarButton && symbolRangeButton instanceof WT_G3x5_TSCRangeTypeDisplayButton && labelRangeButton instanceof WT_G3x5_TSCRangeTypeDisplayButton) {
            this._labelShowButton = new WT_CachedElement(labelShowButton);
            this._symbolRangeButton = symbolRangeButton;
            this._labelRangeButton = labelRangeButton;
            return true;
        } else {
            return false;
        }
    }

    _initSymbolRangeWindowContext() {
        let elementHandler = new WT_G3x5_TSCRangeSelectionElementHandler(WT_G3x5_NavMap.MAP_RANGE_LEVELS.filter(value => value.compare(WT_G3x5_NavMap.TRAFFIC_SYMBOL_RANGE_MAX) <= 0), this._context.instrument.unitsSettingModel);
        this._symbolRangeWindowContext = {
            title: "Map Traffic Symbol Range",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            callback: this._setRangeSetting.bind(this, WT_G3x5_NavMap.TRAFFIC_SYMBOL_RANGE_KEY),
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            currentIndexGetter: new WT_G3x5_TSCMapSettingIndexGetter(this._getSettingModelID.bind(this), WT_G3x5_NavMap.TRAFFIC_SYMBOL_RANGE_KEY),
        };
    }

    _initLabelRangeWindowContext() {
        let elementHandler = new WT_G3x5_TSCRangeSelectionElementHandler(WT_G3x5_NavMap.MAP_RANGE_LEVELS.filter(value => value.compare(WT_G3x5_NavMap.TRAFFIC_LABEL_RANGE_MAX) <= 0), this._context.instrument.unitsSettingModel);
        this._labelRangeWindowContext = {
            title: "Map Traffic Label Range",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            callback: this._setRangeSetting.bind(this, WT_G3x5_NavMap.TRAFFIC_LABEL_RANGE_KEY),
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            currentIndexGetter: new WT_G3x5_TSCMapSettingIndexGetter(this._getSettingModelID.bind(this), WT_G3x5_NavMap.TRAFFIC_LABEL_RANGE_KEY),
        };
    }

    _initSelectionListWindowContexts() {
        this._initSymbolRangeWindowContext();
        this._initLabelRangeWindowContext();
    }

    _initButtonListeners() {
        this._labelShowButton.element.addButtonListener(this._onLabelShowButtonPressed.bind(this));
        this._symbolRangeButton.addButtonListener(this._onSymbolRangeButtonPressed.bind(this));
        this._labelRangeButton.addButtonListener(this._onLabelRangeButtonPressed.bind(this));
    }

    async _connectedCallbackHelper() {
        await WT_Wait.awaitCallback(this._defineChildren.bind(this));
        this._initSelectionListWindowContexts();
        this._initButtonListeners();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    setContext(context) {
        this._context = context;
    }

    _getSettingModelID() {
        return this._context.getSettingModelID();
    }

    _toggleLabelShow() {
        if (!this._context) {
            return;
        }

        let settingModelID = this._getSettingModelID();
        let labelShow = WT_MapSettingModel.getSettingValue(settingModelID, WT_G3x5_NavMap.TRAFFIC_LABEL_SHOW_KEY, true);
        WT_MapSettingModel.setSettingValue(settingModelID, WT_G3x5_NavMap.TRAFFIC_LABEL_SHOW_KEY, !labelShow, true);
    }

    _setRangeSetting(key, value) {
        if (!this._context) {
            return;
        }

        let settingModelID = this._getSettingModelID();
        WT_MapSettingModel.setSettingValue(settingModelID, key, value, true);
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

    _onLabelShowButtonPressed(button) {
        this._toggleLabelShow();
    }

    _onSymbolRangeButtonPressed(button) {
        this._openSelectionListWindow(this._symbolRangeWindowContext);
    }

    _onLabelRangeButtonPressed(button) {
        this._openSelectionListWindow(this._labelRangeWindowContext);
    }

    _updateSymbolRangeButton(settingModelID, unit) {
        let range = WT_G3x5_NavMap.MAP_RANGE_LEVELS[WT_MapSettingModel.getSettingValue(settingModelID, WT_G3x5_NavMap.TRAFFIC_SYMBOL_RANGE_KEY, 0)];

        this._symbolRangeButton.setRange(range);
        this._symbolRangeButton.setUnit(unit);
    }

    _updateLabelShowButton(settingModelID) {
        let labelShow = WT_MapSettingModel.getSettingValue(settingModelID, WT_G3x5_NavMap.TRAFFIC_LABEL_SHOW_KEY, true);
        this._labelShowButton.setAttribute("toggle", labelShow ? "on" : "off");
    }

    _updateLabelRangeButton(settingModelID, unit) {
        let range = WT_G3x5_NavMap.MAP_RANGE_LEVELS[WT_MapSettingModel.getSettingValue(settingModelID, WT_G3x5_NavMap.TRAFFIC_LABEL_RANGE_KEY, 0)];
        this._labelRangeButton.setRange(range);
        this._symbolRangeButton.setUnit(unit);
    }

    _doUpdate() {
        let settingModelID = this._getSettingModelID();
        let unit = this._context.instrument.unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
        this._updateSymbolRangeButton(settingModelID, unit);
        this._updateLabelShowButton(settingModelID);
        this._updateLabelRangeButton(settingModelID, unit);
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