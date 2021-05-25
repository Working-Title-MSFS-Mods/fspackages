class WT_G3x5_TSCAvionicsSettings extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName, mfdInstrumentID) {
        super(homePageGroup, homePageName);

        this._mfdInstrumentID = mfdInstrumentID;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCAvionicsSettingsHTMLElement} htmlElement
     * @type {WT_G3x5_TSCAvionicsSettingsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @property {String} mfdInstrumentID
     * @type {String}
     */
    get mfdInstrumentID() {
        return this._mfdInstrumentID;
    }

    _initHTMLElement() {
        this._htmlElement = new WT_G3x5_TSCAvionicsSettingsHTMLElement();
        this._htmlElement.setParentPage(this);
    }

    init(root) {
        this._initHTMLElement();
        root.appendChild(this.htmlElement);
    }

    onEnter() {
        super.onEnter();

        this.htmlElement.open();
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }

    onExit() {
        super.onExit();

        this.htmlElement.close();
    }
}

class WT_G3x5_TSCAvionicsSettingsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCAvionicsSettingsHTMLElement.TEMPLATE.content.cloneNode(true));
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCAvionicsSettings} parentPage
     * @type {WT_G3x5_TSCAvionicsSettings}
     */
    get parentPage() {
        return this._parentPage;
    }

    _initTabs() {
        this._tabbedContent.addTab(new WT_G3x5_TSCAvionicsSettingsSystemTab(this.parentPage));
        this._tabbedContent.addTab(new WT_G3x5_TSCAvionicsSettingsUnitsTab(this.parentPage));
        this._tabbedContent.addTab(new WT_G3x5_TSCAvionicsSettingsAlertsTab(), WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);
        this._tabbedContent.addTab(new WT_G3x5_TSCAvionicsSettingsMFDFieldsTab(this.parentPage, this.parentPage.mfdInstrumentID));
        this._tabbedContent.addTab(new WT_G3x5_TSCAvionicsSettingsAudioTab(), WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);

        this._lastActiveTabIndex = 0;
    }

    _initTabbedContent() {
        this._tabbedContent = new WT_G3x5_TSCTabbedView();
        this._initTabs();

        this._tabbedContent.slot = "content";
        this.appendChild(this._tabbedContent);
    }

    connectedCallback() {
        this._initTabbedContent();
    }

    setParentPage(parentPage) {
        this._parentPage = parentPage;
    }

    _updateActiveTab() {
        let activeTab = this._tabbedContent.getActiveTab();
        if (activeTab) {
            activeTab.update();
        }
    }

    open() {
        this._tabbedContent.setActiveTabIndex(this._lastActiveTabIndex);
    }

    update() {
        this._updateActiveTab();
    }

    close() {
        this._lastActiveTabIndex = this._tabbedContent.getActiveTabIndex();
        this._tabbedContent.setActiveTabIndex(-1);
    }
}
WT_G3x5_TSCAvionicsSettingsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCAvionicsSettingsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #content {
            display: block;
            width: 100%;
            height: 100%;
        }
    </style>
    <slot name="content" id="content"></slot>
`;

customElements.define("tsc-avionicssettings", WT_G3x5_TSCAvionicsSettingsHTMLElement);

class WT_G3x5_TSCAvionicsSettingsTab extends WT_G3x5_TSCTabContent {
    constructor(title, parentPage, tabClass) {
        super(title);

        this._parentPage = parentPage;
        this._htmlElement = this._createHTMLElement();
        this._htmlElement.classList.add(tabClass);
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCAvionicsSettings} parentPage
     * @type {WT_G3x5_TSCAvionicsSettings}
     */
    get parentPage() {
        return this._parentPage;
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

class WT_G3x5_TSCAvionicsSettingsScrollTab extends WT_G3x5_TSCAvionicsSettingsTab {
    _activateNavButtons() {
        this.parentPage.instrument.activateNavButton(5, "Up", this._onUpPressed.bind(this), false, "ICON_TSC_BUTTONBAR_UP.png");
        this.parentPage.instrument.activateNavButton(6, "Down", this._onDownPressed.bind(this), false, "ICON_TSC_BUTTONBAR_DOWN.png");
    }

    _deactivateNavButtons() {
        this.parentPage.instrument.deactivateNavButton(5, false);
        this.parentPage.instrument.deactivateNavButton(6, false);
    }

    onActivated() {
        this._activateNavButtons();
    }

    onDeactivated() {
        this._deactivateNavButtons();
    }

    _onUpPressed() {
    }

    _onDownPressed() {
    }
}

class WT_G3x5_TSCAvionicsSettingsRowTab extends WT_G3x5_TSCAvionicsSettingsScrollTab {
    _createHTMLElement() {
        return new WT_TSCScrollList();
    }

    /**
     *
     * @param {WT_G3x5_TSCAvionicsSettingsRow} row
     */
    attachRow(row) {
        row.slot = "content";
        row.classList.add(WT_G3x5_TSCAvionicsSettingsRowTab.ROW_CLASS);
        this.htmlElement.appendChild(row);
    }

    _cancelScroll() {
        this.htmlElement.scrollManager.cancelScroll();
    }

    onDeactivated() {
        super.onDeactivated();

        this._cancelScroll();
    }

    update() {
        this.htmlElement.scrollManager.update();
    }

    _onUpPressed() {
        this.htmlElement.scrollManager.scrollUp();
    }

    _onDownPressed() {
        this.htmlElement.scrollManager.scrollDown();
    }
}
WT_G3x5_TSCAvionicsSettingsRowTab.ROW_CLASS = "avionicsSettingsRow";

class WT_G3x5_TSCAvionicsSettingsRow extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._context = null;

        this._isInit = false;
        this._lastContext = null;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
        this._title = this.shadowRoot.querySelector(`#title`);
    }

    _initChildren() {
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initChildren();
        this._isInit = true;
        if (this._context) {
            this._updateFromContext();
        }
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _cleanUpContext() {
    }

    _updateFromContext() {
    }

    setContext(context) {
        if (context === this._context) {
            return;
        }

        this._cleanUpContext();

        this._context = context;
        if (this._isInit) {
            this._updateFromContext();
        }
    }
}

class WT_G3x5_TSCAvionicsSettingsDisplayRow extends WT_G3x5_TSCAvionicsSettingsRow {
    _getTemplate() {
        return WT_G3x5_TSCAvionicsSettingsDisplayRow.TEMPLATE;
    }

    async _defineChildren() {
        await super._defineChildren();
        this._display = new WT_CachedElement(this.shadowRoot.querySelector(`#display`));
    }

    _updateTitle() {
        this._title.innerHTML = this._context ? this._context.title : "";
    }

    _updateFromContext() {
        this._updateTitle();
    }

    setDisplayText(text) {
        if (!this._isInit) {
            return;
        }

        this._display.innerHTML = text;
    }

    update() {
        if (this._context) {
            this.setDisplayText(this._context.getDisplayText());
        }
    }
}
WT_G3x5_TSCAvionicsSettingsDisplayRow.NAME = "wt-tsc-avionicssettings-displayrow";
WT_G3x5_TSCAvionicsSettingsDisplayRow.TEMPLATE = document.createElement("template");
WT_G3x5_TSCAvionicsSettingsDisplayRow.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            background-color: black;
            border: solid 1px white;
            border-radius: 5px;
        }

        #wrapper {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: auto;
            grid-template-columns: var(--avionicssettings-row-left-width, 50%) var(--avionicssettings-row-left-width, 50%);
        }
            #title {
                text-align: center;
                align-self: center;
            }
            #display {
                text-align: center;
                align-self: center;
                font-size: 1.33em;
            }
    </style>
    <div id="wrapper">
        <div id="title"></div>
        <div id="display"></div>
    </div>
`;

customElements.define(WT_G3x5_TSCAvionicsSettingsDisplayRow.NAME, WT_G3x5_TSCAvionicsSettingsDisplayRow);

class WT_G3x5_TSCAvionicsSettingsLabeledButtonRow extends WT_G3x5_TSCAvionicsSettingsRow {
    _getTemplate() {
        return WT_G3x5_TSCAvionicsSettingsLabeledButtonRow.TEMPLATE;
    }

    async _defineChildren() {
        await super._defineChildren();

        this._button = await WT_CustomElementSelector.select(this.shadowRoot, `#button`, WT_TSCLabeledButton);
    }
}
WT_G3x5_TSCAvionicsSettingsLabeledButtonRow.UNIT_CLASS = "unit";
WT_G3x5_TSCAvionicsSettingsLabeledButtonRow.TEMPLATE = document.createElement("template");
WT_G3x5_TSCAvionicsSettingsLabeledButtonRow.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            background-color: black;
            border: solid 1px white;
            border-radius: 5px;
        }

        #wrapper {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: auto;
            grid-template-columns: var(--avionicssettings-row-left-width, 50%) var(--avionicssettings-row-right-width, 50%);
        }
            #title {
                text-align: center;
                align-self: center;
            }
            #button {
                position: relative;
                margin: var(--avionicssettings-row-button-margin, 0.1em);
                font-size: 1.33em;
                color: var(--avionicssettings-row-button-color, var(--wt-g3x5-lightblue));
            }

        .${WT_G3x5_TSCAvionicsSettingsLabeledButtonRow.UNIT_CLASS} {
            font-size: var(--avionicssettings-row-button-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <div id="title"></div>
        <wt-tsc-button-label id="button"></wt-tsc-button-label>
    </div>
`;

class WT_G3x5_TSCAvionicsSettingsManagedLabeledButtonRow extends WT_G3x5_TSCAvionicsSettingsLabeledButtonRow {
    _cleanUpContext() {
        if (this._buttonManager) {
            this._buttonManager.destroy();
        }
    }

    _initTitle() {
        this._title.textContent = this._context.rowTitle;
    }

    _initSelectionWindowContext() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(this._context.valueText);
        this._selectionWindowContext = {
            title: this._context.selectionWindowTitle,
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            homePageGroup: this._context.parentPage.homePageGroup,
            homePageName: this._context.parentPage.homePageName
        };
    }

    _initButtonManager() {
        let instrument = this._context.parentPage.instrument;
        this._buttonManager = new WT_TSCSettingLabeledButtonManager(instrument, this._button, this._context.setting, instrument.selectionListWindow1, this._selectionWindowContext, value => this._context.valueText[value]);
        this._buttonManager.init();
    }

    _updateFromContext() {
        if (!this._context) {
            return;
        }

        this._initTitle();
        this._initSelectionWindowContext();
        this._initButtonManager();
    }
}
WT_G3x5_TSCAvionicsSettingsManagedLabeledButtonRow.NAME = "wt-tsc-avionicssettings-managedlabelbuttonrow";

customElements.define(WT_G3x5_TSCAvionicsSettingsManagedLabeledButtonRow.NAME, WT_G3x5_TSCAvionicsSettingsManagedLabeledButtonRow);

class WT_G3x5_TSCAvionicsSettingsSystemTab extends WT_G3x5_TSCAvionicsSettingsRowTab {
    constructor(parentPage) {
        super(WT_G3x5_TSCAvionicsSettingsSystemTab.TITLE, parentPage, WT_G3x5_TSCAvionicsSettingsSystemTab.CLASS);
    }

    _initTimeFormatRow() {
        this._timeFormatRow = new WT_G3x5_TSCAvionicsSettingsManagedLabeledButtonRow();
        this._timeFormatRow.setContext({
            parentPage: this.parentPage,
            rowTitle: "Time Format",
            setting: this.parentPage.instrument.avionicsSystemSettingModel.timeFormatSetting,
            valueText: WT_G3x5_TSCAvionicsSettingsSystemTab.TIME_FORMAT_VALUE_TEXT,
            selectionWindowTitle: "Select Time Format"
        });
        this.attachRow(this._timeFormatRow);
    }

    _initTimeOffsetRow() {
        this._timeOffsetRow = new WT_G3x5_TSCSystemTimeOffsetRow();
        this._timeOffsetRow.setContext({
            parentPage: this.parentPage,
            formatSetting: this.parentPage.instrument.avionicsSystemSettingModel.timeFormatSetting,
            offsetSetting: this.parentPage.instrument.avionicsSystemSettingModel.timeLocalOffsetSetting
        });
        this.attachRow(this._timeOffsetRow);
    }

    _initRunwaySurfaceRow() {
        this._runwaySurfaceRow = new WT_G3x5_TSCAvionicsSettingsManagedLabeledButtonRow();
        this._runwaySurfaceRow.setContext({
            parentPage: this.parentPage,
            rowTitle: "Nearest Airport Runway Surface",
            setting: this.parentPage.instrument.nearestAirportList.runwaySurfaceSetting,
            valueText: WT_G3x5_TSCAvionicsSettingsSystemTab.RUNWAY_SURFACE_VALUE_TEXT,
            selectionWindowTitle: "Select Runway Surface"
        });
        this.attachRow(this._runwaySurfaceRow);
    }

    _initRunwayLengthRow() {
        this._runwayLengthRow = new WT_G3x5_TSCSystemRunwayLengthRow();
        this._runwayLengthRow.setContext({
            parentPage: this.parentPage,
            setting: this.parentPage.instrument.nearestAirportList.runwayLengthSetting
        });
        this.attachRow(this._runwayLengthRow);
    }

    _initRows() {
        this._initTimeFormatRow();
        this._initTimeOffsetRow();
        this._initRunwaySurfaceRow();
        this._initRunwayLengthRow();
    }

    onAttached() {
        super.onAttached();

        this._initRows();
    }
}
WT_G3x5_TSCAvionicsSettingsSystemTab.TITLE = "System";
WT_G3x5_TSCAvionicsSettingsSystemTab.CLASS = "systemTab";
WT_G3x5_TSCAvionicsSettingsSystemTab.TIME_FORMAT_VALUE_TEXT = [
    "Local 12hr",
    "Local 24hr",
    "UTC"
];
WT_G3x5_TSCAvionicsSettingsSystemTab.RUNWAY_SURFACE_VALUE_TEXT = [
    "All",
    "Hard Surface",
    "Soft Surface"
];

class WT_G3x5_TSCSystemTimeOffsetRow extends WT_G3x5_TSCAvionicsSettingsRow {
    constructor() {
        super();

        this._timeFormatSettingListener = this._onTimeFormatSettingChanged.bind(this);
        this._timeOffsetSettingListener = this._onTimeOffsetSettingChanged.bind(this);
        this._initTimeKeyboardContext();
        this._initTimeFormatter();
    }

    _getTemplate() {
        return WT_G3x5_TSCSystemTimeOffsetRow.TEMPLATE;
    }

    _initTimeKeyboardContext() {
        this._timeKeyboardContext = {
            title: "Enter Time Offset",
            isPositive: false,
            limit24Hours: true,
            valueEnteredCallback: this._onValueEntered.bind(this)
        };
    }

    _initTimeFormatter() {
        this._formatter = new WT_TimeFormatter({
            timeFormat: WT_TimeFormatter.Format.HH_MM
        });
    }

    async _defineChildren() {
        await super._defineChildren();

        this._button = await WT_CustomElementSelector.select(this.shadowRoot, `#button`, WT_TSCLabeledButton);
        this._display = this.shadowRoot.querySelector(`#display`);
    }

    _initTitle() {
        this._title.textContent = "Time Offset";
    }

    _initButton() {
        this._button.addButtonListener(this._onButtonPressed.bind(this));
    }

    _initChildren() {
        this._initTitle();
        this._initButton();
    }

    _cleanUpListeners() {
        this._context.formatSetting.removeListener(this._timeFormatSettingListener);
        this._context.offsetSetting.removeListener(this._timeOffsetSettingListener);
    }

    _cleanUpContext() {
        if (!this._context) {
            return;
        }

        this._cleanUpListeners();
    }

    _initSettingListeners() {
        this._context.formatSetting.addListener(this._timeFormatSettingListener);
        this._context.offsetSetting.addListener(this._timeOffsetSettingListener);
    }

    _updateFromContext() {
        if (!this._context) {
            return;
        }

        this._initSettingListeners();
        this._updateRight(this._context.formatSetting.getValue());
        this._updateButton();
    }

    _updateRight(timeFormat) {
        if (timeFormat === WT_G3x5_TimeFormatSetting.Mode.UTC) {
            this._wrapper.setAttribute("right", "display");
        } else {
            this._wrapper.setAttribute("right", "button");
        }
    }

    _updateButton() {
        let offset = this._context.offsetSetting.getOffset();
        let prefix = offset.number < 0 ? "−" : "+";
        this._button.labelText = `${prefix}${this._formatter.getFormattedString(offset.abs(true))}`;
    }

    _onTimeFormatSettingChanged(setting, newValue, oldValue) {
        this._updateRight(newValue);
    }

    _onTimeOffsetSettingChanged(setting, newValue, oldValue) {
        this._updateButton();
    }

    _updateTimeKeyboardContext() {
        this._timeKeyboardContext.initialValue = this._context.offsetSetting.getOffset();
        this._timeKeyboardContext.homePageGroup = this._context.parentPage.homePageGroup;
        this._timeKeyboardContext.homePageName = this._context.parentPage.homePageName;
    }

    _openTimeKeyboard() {
        this._updateTimeKeyboardContext();
        let instrument = this._context.parentPage.instrument;

        instrument.timeKeyboard.element.setContext(this._timeKeyboardContext);
        instrument.switchToPopUpPage(instrument.timeKeyboard);
    }

    _onButtonPressed(button) {
        if (!this._context) {
            return;
        }

        this._openTimeKeyboard();
    }

    /**
     *
     * @param {WT_NumberUnitReadOnly} value
     */
    _onValueEntered(value) {
        if (!this._context) {
            return;
        }

        this._context.offsetSetting.setOffset(value.set(Math.round(value.asUnit(WT_Unit.MINUTE)), WT_Unit.MINUTE));
    }
}
WT_G3x5_TSCSystemTimeOffsetRow.NAME = "wt-tsc-avionicssettings-timeoffsetrow";
WT_G3x5_TSCSystemTimeOffsetRow.TEMPLATE = document.createElement("template");
WT_G3x5_TSCSystemTimeOffsetRow.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            background-color: black;
            border: solid 1px white;
            border-radius: 5px;
        }

        #wrapper {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: var(--avionicssettings-row-left-width, 50%) var(--avionicssettings-row-right-width, 50%);
        }
            #title {
                text-align: center;
                align-self: center;
            }
            #button {
                display: none;
                position: relative;
                margin: var(--avionicssettings-row-button-margin, 0.1em);
                color: var(--wt-g3x5-lightblue);
                font-size: 1.33em;
                grid-area: 1 / 2;
            }
            #wrapper[right="button"] #button {
                display: block;
            }
            #display {
                display: none;
                color: white;
                font-size: 1.33em;
                grid-area: 1 / 2;
                text-align: center;
                align-self: center;
            }
            #wrapper[right="display"] #display {
                display: block;
            }
    </style>
    <div id="wrapper">
        <div id="title"></div>
        <wt-tsc-button-label id="button"></wt-tsc-button-label>
        <div id="display">––:––</div>
    </div>
`;

customElements.define(WT_G3x5_TSCSystemTimeOffsetRow.NAME, WT_G3x5_TSCSystemTimeOffsetRow);

class WT_G3x5_TSCSystemRunwayLengthRow extends WT_G3x5_TSCAvionicsSettingsRow {
    constructor() {
        super();

        this._settingListener = this._onSettingChanged.bind(this);
        this._initNumKeyboardContext();
    }

    _getTemplate() {
        return WT_G3x5_TSCSystemRunwayLengthRow.TEMPLATE;
    }

    _initNumKeyboardContext() {
        this._numKeyboardContext = {
            title: "Select Runway Length",
            digitCount: 5,
            valueEnteredCallback: this._onValueEntered.bind(this)
        };
    }

    async _defineChildren() {
        await super._defineChildren();

        this._button = await WT_CustomElementSelector.select(this.shadowRoot, `#button`, WT_G3x5_TSCNumberUnitButton);
    }

    _initTitle() {
        this._title.textContent = "Nearest Airport Min Rwy Length";
    }

    _initButton() {
        this._button.setFormatterOptions({
            precision: 1,
            unitCaps: true
        });
        this._button.addButtonListener(this._onButtonPressed.bind(this));
    }

    _initChildren() {
        this._initTitle();
        this._initButton();
    }

    _cleanUpContext() {
        if (!this._context) {
            return;
        }

        this._context.setting.removeListener(this._settingListener);
    }

    _initSettingListener() {
        this._context.setting.addListener(this._settingListener);
        this._updateButton();
    }

    _updateFromContext() {
        if (!this._context) {
            return;
        }

        this._initSettingListener();
    }

    /**
     *
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     * @returns {WT_Unit}
     */
    _getLengthUnit(unitsSettingModel) {
        if (unitsSettingModel.distanceSpeedSetting.getValue() === WT_G3x5_DistanceSpeedUnitsSetting.Value.NAUTICAL) {
            return WT_Unit.FOOT;
        } else {
            return WT_Unit.METER;
        }
    }

    _updateButton() {
        this._button.setNumberUnit(this._context.setting.getLength());
        this._button.setDisplayUnit(this._getLengthUnit(this._context.parentPage.instrument.unitsSettingModel));
    }

    _onSettingChanged(setting, newValue, oldValue) {
        this._updateButton();
    }

    _updateNumKeyboardContext() {
        this._numKeyboardContext.unit = this._getLengthUnit(this._context.parentPage.instrument.unitsSettingModel);
        this._numKeyboardContext.initialValue = this._context.setting.getLength();
        this._numKeyboardContext.homePageGroup = this._context.parentPage.homePageGroup;
        this._numKeyboardContext.homePageName = this._context.parentPage.homePageName;
    }

    _openNumKeyboard() {
        this._updateNumKeyboardContext();
        let instrument = this._context.parentPage.instrument;

        instrument.numKeyboard.element.setContext(this._numKeyboardContext);
        instrument.switchToPopUpPage(instrument.numKeyboard);
    }

    _onButtonPressed(button) {
        if (!this._context) {
            return;
        }

        this._openNumKeyboard();
    }

    _onValueEntered(value) {
        if (!this._context) {
            return;
        }

        this._context.setting.setLength(value);
    }
}
WT_G3x5_TSCSystemRunwayLengthRow.NAME = "wt-tsc-avionicssettings-runwaylengthrow";
WT_G3x5_TSCSystemRunwayLengthRow.TEMPLATE = document.createElement("template");
WT_G3x5_TSCSystemRunwayLengthRow.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            background-color: black;
            border: solid 1px white;
            border-radius: 5px;
        }

        #wrapper {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: auto;
            grid-template-columns: var(--avionicssettings-row-left-width, 50%) var(--avionicssettings-row-right-width, 50%);
        }
            #title {
                text-align: center;
                align-self: center;
            }
            #button {
                position: relative;
                margin: var(--avionicssettings-row-button-margin, 0.1em);
                color: var(--wt-g3x5-lightblue);
                font-size: 1.33em;
            }
    </style>
    <div id="wrapper">
        <div id="title"></div>
        <wt-tsc-button-numberunit id="button"></wt-tsc-button-numberunit>
    </div>
`;

customElements.define(WT_G3x5_TSCSystemRunwayLengthRow.NAME, WT_G3x5_TSCSystemRunwayLengthRow);

class WT_G3x5_TSCAvionicsSettingsUnitsTab extends WT_G3x5_TSCAvionicsSettingsRowTab {
    constructor(parentPage) {
        super(WT_G3x5_TSCAvionicsSettingsUnitsTab.TITLE, parentPage, WT_G3x5_TSCAvionicsSettingsUnitsTab.CLASS);
    }

    /**
     * @readonly
     * @type {WT_G3x5_UnitsSettingModel}
     */
    get unitsSettingModel() {
        return this.parentPage.instrument.unitsSettingModel;
    }

    _initButtonRow(row, title, setting, valueTexts, unitSymbols) {
        row.setContext({
            instrument: this.parentPage.instrument,
            title: title,
            setting: setting,
            valueTexts: valueTexts,
            unitSymbols: unitSymbols,
            homePageGroup: this.parentPage.homePageGroup,
            homePageName: this.parentPage.homePageName
        });
        this.attachRow(row);
    }

    _initDisplayRow(row, title, getDisplayText) {
        row.setContext({
            title: title,
            getDisplayText: getDisplayText
        });
        this.attachRow(row);
    }

    _initRows() {
        this._navAngleRow = new WT_G3x5_TSCUnitsButtonRow();
        this._initButtonRow(this._navAngleRow, "Nav Angle", this.unitsSettingModel.navAngleSetting, ["Magnetic", "True"], this.unitsSettingModel.navAngleSetting.getAllUnits().map(units => units.map(unit => unit.abbrevName.toUpperCase())));

        this._magVarRow = new WT_G3x5_TSCAvionicsSettingsDisplayRow();
        let airplane = this.parentPage.instrument.airplane;
        this._initDisplayRow(this._magVarRow, "Magnetic Variance", function() {
            let magVar = Math.round(airplane.navigation.magVar());
            let direction = "E";
            if (magVar < 0) {
                magVar = -magVar;
                direction = "W";
            }
            return `${magVar}°${direction}`;
        });

        this._distanceSpeedRow = new WT_G3x5_TSCUnitsButtonRow();
        this._initButtonRow(this._distanceSpeedRow, "Distance/Speed", this.unitsSettingModel.distanceSpeedSetting, ["Nautical", "Metric"], this.unitsSettingModel.distanceSpeedSetting.getAllUnits().map(units => units.map(unit => unit.abbrevName.toUpperCase())));

        this._altitudeRow = new WT_G3x5_TSCUnitsButtonRow();
        this._initButtonRow(this._altitudeRow, "Altitude/Vertical Speed", this.unitsSettingModel.altitudeSetting, ["Feet", "Meters"], this.unitsSettingModel.altitudeSetting.getAllUnits().map(units => units.map(unit => unit.abbrevName.toUpperCase())));

        this._extTemperatureRow = new WT_G3x5_TSCUnitsButtonRow();
        this._initButtonRow(this._extTemperatureRow, "External Temperature", this.unitsSettingModel.extTemperatureSetting, ["Celsius", "Fahrenheit"], this.unitsSettingModel.extTemperatureSetting.getAllUnits().map(units => units.map(unit => unit.abbrevName.toUpperCase())));
    }

    onAttached() {
        super.onAttached();

        this._initRows();
    }

    update() {
        super.update();

        this._magVarRow.update();
    }
}
WT_G3x5_TSCAvionicsSettingsUnitsTab.TITLE = "Units";
WT_G3x5_TSCAvionicsSettingsUnitsTab.CLASS = "unitsTab";

class WT_G3x5_TSCUnitsButtonRow extends WT_G3x5_TSCAvionicsSettingsRow {
    constructor() {
        super();

        this._settingListener = this._onSettingChanged.bind(this);
    }

    _getTemplate() {
        return WT_G3x5_TSCUnitsButtonRow.TEMPLATE;
    }

    async _defineChildren() {
        await super._defineChildren();

        this._button = await WT_CustomElementSelector.select(this.shadowRoot, `#button`, WT_G3x5_TSCUnitsButton);
    }

    _initButton() {
        this._button.addButtonListener(this._onButtonPressed.bind(this));
    }

    _initChildren() {
        this._initButton();
    }

    _cleanUpSettingListener() {
        this._context.setting.removeListener(this._settingListener);
    }

    _cleanUpContext() {
        if (!this._context) {
            return;
        }

        this._cleanUpSettingListener();
    }

    _updateTitle() {
        this._title.innerHTML = this._context ? this._context.title : "";
    }

    _updateButton() {
        if (!this._context) {
            return;
        }

        let value = this._context.setting.getValue();
        this._button.setDisplay(this._context.valueTexts[value], this._context.unitSymbols[value]);
    }

    _initSelectionWindowContext() {
        if (!this._context) {
            this._selectionWindowContext = null;
            return;
        }

        let elementHandler = new WT_G3x5_TSCUnitsSelectionElementHandler(this._context.setting, this._context.valueTexts, this._context.unitSymbols);
        this._selectionWindowContext = {
            title: "Select Units",
            subclass: "unitsDynamicSelectionListWindow",
            closeOnSelect: true,
            callback: this._onSelectionMade.bind(this),
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            currentIndexGetter: elementHandler,
            homePageGroup: this._context.homePageGroup,
            homePageName: this._context.homePageName
        };
    }

    _initSettingListener() {
        if (!this._context) {
            return;
        }

        this._context.setting.addListener(this._settingListener);
    }

    _updateFromContext() {
        this._initSelectionWindowContext();
        this._initSettingListener();
        this._updateTitle();
        this._updateButton();
    }

    _onButtonPressed(button) {
        if (this._context) {
            this._context.instrument.selectionListWindow1.element.setContext(this._selectionWindowContext);
            this._context.instrument.switchToPopUpPage(this._context.instrument.selectionListWindow1);
        }
    }

    _onSettingChanged(setting, newValue, oldValue) {
        this._updateButton();
    }

    _onSelectionMade(value) {
        this._context.setting.setValue(value);
    }
}
WT_G3x5_TSCUnitsButtonRow.NAME = "wt-tsc-avionicssettings-unitsbuttonrow";
WT_G3x5_TSCUnitsButtonRow.TEMPLATE = document.createElement("template");
WT_G3x5_TSCUnitsButtonRow.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            background-color: black;
            border: solid 1px white;
            border-radius: 5px;
        }

        #wrapper {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: auto;
            grid-template-columns: var(--avionicssettings-row-left-width, 50%) var(--avionicssettings-row-right-width, 50%);
        }
            #title {
                text-align: center;
                align-self: center;
            }
            #button {
                position: relative;
                margin: var(--avionicssettings-row-button-margin, 0.1em);
                color: var(--wt-g3x5-lightblue);
                font-size: 1.33em;
            }
    </style>
    <div id="wrapper">
        <div id="title"></div>
        <wt-tsc-button-units id="button"></wt-tsc-button-units>
    </div>
`;

customElements.define(WT_G3x5_TSCUnitsButtonRow.NAME, WT_G3x5_TSCUnitsButtonRow);

class WT_G3x5_TSCUnitsButton extends WT_TSCButton {
    _initLabelStyle() {
        return `
            #label {
                position: absolute;
                width: 100%;
                top: 50%;
                transform: translateY(-50%);
            }
                .unitSymbol {
                    font-size: 0.75em;
                }
        `;
    }

    _createStyle() {
        let style = super._createStyle();
        let labelStyle = this._initLabelStyle();

        return `
            ${style}
            ${labelStyle}
        `;
    }

    _appendChildren() {
        this._label = document.createElement("div");
        this._label.id = "label";

        this._wrapper.appendChild(this._label);
    }

    setDisplay(valueText, unitSymbols) {
        let html = `${valueText} (&nbsp`;
        for (let symbol of unitSymbols) {
            html += `<span class="unitSymbol">${symbol}</span>,&nbsp`;
        }
        html = html.replace(/,&nbsp$/, "&nbsp)");
        this._label.innerHTML = html;
    }
}
WT_G3x5_TSCUnitsButton.NAME = "wt-tsc-button-units";

customElements.define(WT_G3x5_TSCUnitsButton.NAME, WT_G3x5_TSCUnitsButton);

class WT_G3x5_TSCUnitsSelectionElementHandler {
    /**
     * @param {WT_G3x5_UnitsSetting} model
     * @param {String[]} valueTexts
     * @param {String[][]} unitSymbols
     */
    constructor(setting, valueTexts, unitSymbols) {
        this._setting = setting;
        this._valueTexts = valueTexts;
        this._unitSymbols = unitSymbols;
    }

    nextElement(index) {
        if (index >= this._valueTexts.length) {
            return null;
        }

        let elem = {
            button: new WT_G3x5_TSCUnitsButton()
        };
        elem.button.setDisplay(this._valueTexts[index], this._unitSymbols[index]);
        return elem;
    }

    update(index, elem) {
    }

    getCurrentIndex() {
        return this._setting.getValue();
    }
}

class WT_G3x5_TSCAvionicsSettingsAlertsTab extends WT_G3x5_TSCAvionicsSettingsTab {
    constructor() {
        super(WT_G3x5_TSCAvionicsSettingsAlertsTab.TITLE);
    }

    _createHTMLElement() {
        return document.createElement("div");
    }
}
WT_G3x5_TSCAvionicsSettingsAlertsTab.TITLE = "Alerts";

class WT_G3x5_TSCAvionicsSettingsMFDFieldsTab extends WT_G3x5_TSCAvionicsSettingsRowTab {
    constructor(parentPage, instrumentID) {
        super(WT_G3x5_TSCAvionicsSettingsMFDFieldsTab.TITLE, parentPage, WT_G3x5_TSCAvionicsSettingsMFDFieldsTab.CLASS);

        this._instrumentID = instrumentID;
    }

    _initModel() {
        this._model = new WT_G3x5_NavDataBarModel(this.parentPage.instrument);
        this._model.setDataFieldCount(WT_G3x5_MFDNavDataBar.DATA_FIELD_COUNT);
    }

    _initSettingModel() {
        this._settingModel = new WT_G3x5_NavDataBarSettingModel(this._instrumentID, this._model);
        for (let i = 0; i < WT_G3x5_MFDNavDataBar.DATA_FIELD_COUNT; i++) {
            this._settingModel.addDataFieldSetting(WT_G3x5_MFDNavDataBar.DEFAULT_DATA_FIELD_INFO_IDS[i]);
        }

        this._settingModel.update();
    }

    _initRows() {
        for (let i = 0; i < this._model.dataFieldCount; i++) {
            let row = new WT_G3x5_TSCNavDataFieldRow();
            row.setContext({
                instrument: this.parentPage.instrument,
                index: i,
                model: this._model,
                controller: this._settingModel,
                homePageGroup: this.parentPage.homePageGroup,
                homePageName: this.parentPage.homePageName
            });
            this.attachRow(row);
        }
    }

    onAttached() {
        super.onAttached();

        this._initModel();
        this._initSettingModel();
        this._initRows();
    }
}
WT_G3x5_TSCAvionicsSettingsMFDFieldsTab.TITLE = "MFD<br>Fields";
WT_G3x5_TSCAvionicsSettingsMFDFieldsTab.CLASS = "mfdFieldsTab";

class WT_G3x5_TSCNavDataFieldRow extends WT_G3x5_TSCAvionicsSettingsRow {
    constructor() {
        super();

        this._settingListener = this._onDataFieldSettingChanged.bind(this);
    }

    _getTemplate() {
        return WT_G3x5_TSCNavDataFieldRow.TEMPLATE;
    }

    async _defineChildren() {
        await super._defineChildren();

        this._button = await WT_CustomElementSelector.select(this.shadowRoot, `#button`, WT_G3x5_TSCNavDataFieldButton);
    }

    _initButton() {
        this._button.addButtonListener(this._onButtonPressed.bind(this));
    }

    _initChildren() {
        this._initButton();
    }

    _cleanUpSettingListener() {
        this._context.controller.getDataFieldSetting(this._context.index).removeListener(this._settingListener);
    }

    _cleanUpContext() {
        if (!this._context) {
            return;
        }

        this._cleanUpSettingListener();
    }

    _updateTitle() {
        this._title.innerHTML = this._context ? `MFD<br>Data Bar<br>Field ${this._context.index + 1}` : "";
    }

    _updateButton() {
        let navDataInfo = this._context ? this._context.model.getDataFieldInfo(this._context.index) : null;
        this._button.setNavDataInfo(navDataInfo);
    }

    _initSelectionWindowContext() {
        if (!this._context) {
            this._selectionWindowContext = null;
            this._navDataInfos = null;
            return;
        }

        let elementHandler = new WT_G3x5_TSCNavDataFieldSelectionElementHandler(this._context.model, this._context.index);
        this._selectionWindowContext = {
            title: "Select MFD Data Bar Field",
            subclass: "navDataBarDynamicSelectionListWindow",
            closeOnSelect: true,
            callback: this._onSelectionMade.bind(this),
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            currentIndexGetter: elementHandler,
            homePageGroup: this._context.homePageGroup,
            homePageName: this._context.homePageName
        };

        this._navDataInfos = this._context.model.getAllNavDataInfo();
    }

    _initSettingListener() {
        if (!this._context) {
            return;
        }

        this._context.controller.getDataFieldSetting(this._context.index).addListener(this._settingListener);
    }

    _updateFromContext() {
        this._initSelectionWindowContext();
        this._initSettingListener();
        this._updateTitle();
        this._updateButton();
    }

    _onButtonPressed(button) {
        if (this._context) {
            this._context.instrument.selectionListWindow1.element.setContext(this._selectionWindowContext);
            this._context.instrument.switchToPopUpPage(this._context.instrument.selectionListWindow1);
        }
    }

    _onDataFieldSettingChanged(setting, newValue, oldValue) {
        this._updateButton();
    }

    _onSelectionMade(value) {
        this._context.controller.getDataFieldSetting(this._context.index).setValue(this._navDataInfos[value].id);
    }
}
WT_G3x5_TSCNavDataFieldRow.NAME = "wt-tsc-avionicssettings-mfdnavdatafieldrow";
WT_G3x5_TSCNavDataFieldRow.TEMPLATE = document.createElement("template");
WT_G3x5_TSCNavDataFieldRow.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            background-color: black;
            border: solid 1px white;
            border-radius: 5px;
        }

        #wrapper {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: auto;
            grid-template-columns: var(--avionicssettings-row-left-width, 30%) var(--avionicssettings-row-left-width, 70%);
        }
            #title {
                text-align: center;
                align-self: center;
            }
            #button {
                position: relative;
                margin: var(--avionicssettings-row-button-margin, 0.1em);
                color: var(--wt-g3x5-lightblue);
            }
    </style>
    <div id="wrapper">
        <div id="title"></div>
        <wt-tsc-button-navdatafield id="button"></wt-tsc-button-navdatafield>
    </div>
`;

customElements.define(WT_G3x5_TSCNavDataFieldRow.NAME, WT_G3x5_TSCNavDataFieldRow);

class WT_G3x5_TSCNavDataFieldButton extends WT_TSCButton {
    _initLabelStyle() {
        return `
            #label {
                width: 100%;
                height: 100%;
                display: flex;
                flex-flow: column nowrap;
                justify-content: center;
                align-items: center;
            }
        `;
    }

    _initShortNameStyle() {
        return `
            #shortname {
                font-size: 1.5em;
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();
        let labelStyle = this._initLabelStyle();
        let shortNameStyle = this._initShortNameStyle();

        return `
            ${style}
            ${labelStyle}
            ${shortNameStyle}
        `;
    }

    _appendChildren() {
        let label = document.createElement("div");
        label.id = "label";

        this._shortName = document.createElement("div");
        this._shortName.id = "shortname";
        label.appendChild(this._shortName);

        this._longName = document.createElement("div");
        this._longName.id = "longname";
        label.appendChild(this._longName);

        this._wrapper.appendChild(label);
    }

    setNavDataInfo(navDataInfo) {
        if (navDataInfo) {
            this._shortName.innerHTML = navDataInfo.shortName;
            this._longName.innerHTML = navDataInfo.longName;
        } else {
            this._shortName.innerHTML = "";
            this._longName.innerHTML = "";
        }
    }
}
WT_G3x5_TSCNavDataFieldButton.NAME = "wt-tsc-button-navdatafield";

customElements.define(WT_G3x5_TSCNavDataFieldButton.NAME, WT_G3x5_TSCNavDataFieldButton);

class WT_G3x5_TSCNavDataFieldSelectionElementHandler {
    /**
     *
     * @param {WT_G3x5_NavDataBarModel} model
     * @param {Number} fieldIndex
     */
    constructor(model, fieldIndex) {
        this._model = model;
        this._infos = model.getAllNavDataInfo();
        this._fieldIndex = fieldIndex;
    }

    nextElement(index) {
        if (index >= this._infos.length) {
            return null;
        }

        let elem = {
            button: new WT_G3x5_TSCNavDataFieldButton()
        };
        elem.button.setNavDataInfo(this._infos[index]);
        return elem;
    }

    update(index, elem) {
    }

    getCurrentIndex() {
        return this._infos.indexOf(this._model.getDataFieldInfo(this._fieldIndex));
    }
}

class WT_G3x5_TSCAvionicsSettingsAudioTab extends WT_G3x5_TSCAvionicsSettingsTab {
    constructor() {
        super(WT_G3x5_TSCAvionicsSettingsAudioTab.TITLE);
    }

    _createHTMLElement() {
        return document.createElement("div");
    }
}
WT_G3x5_TSCAvionicsSettingsAudioTab.TITLE = "Audio";