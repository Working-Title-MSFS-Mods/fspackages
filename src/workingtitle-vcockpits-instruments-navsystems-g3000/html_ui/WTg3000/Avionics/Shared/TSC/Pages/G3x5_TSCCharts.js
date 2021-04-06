class WT_G3x5_TSCCharts extends WT_G3x5_TSCPageElement {
    /**
     * @param {String} homePageGroup
     * @param {String} homePageName
     * @param {WT_NavigraphAPI} navigraphAPI
     * @param {WT_G3x5_MFDHalfPane.ID} halfPaneID
     */
    constructor(homePageGroup, homePageName, navigraphAPI, halfPaneID) {
        super(homePageGroup, homePageName);

        /**
         * @type {WT_Airport}
         */
        this._airport = null;
        /**
         * @type {WT_NavigraphChartDefinition[]}
         */
        this._charts = null;
        this._chartID = "";

        this._navigraphAPI = navigraphAPI;
        this._settingModelID = `MFD-${halfPaneID}`;
        this._initSettingModel();

        this._isLocked = false;
    }

    _initSettingModel() {
        this._settingModel = new WT_DataStoreSettingModel(this._settingModelID);
        this._settingModel.addSetting(this._icaoSetting = new WT_G3x5_ChartsICAOSetting(this._settingModel));
        this._settingModel.addSetting(this._chartIDSetting = new WT_G3x5_ChartsChartIDSetting(this._settingModel));
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCChartsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCChartsHTMLElement();
        htmlElement.setParentPage(this);
        return htmlElement;
    }

    _initICAOSettingListener() {
        this._icaoSetting.addListener(this._onICAOSettingChanged.bind(this));
        this._setAirportICAO(this._icaoSetting.getValue());
    }

    _initChartIDSettingListener() {
        this._chartIDSetting.addListener(this._onChartIDSettingChanged.bind(this));
        this._setChartID(this._chartIDSetting.getValue());
    }

    _initSettingListeners() {
        this._initICAOSettingListener();
        this._initChartIDSettingListener();
    }

    _initButtonListeners() {
        this.htmlElement.selectButton.addButtonListener(this._onSelectButtonPressed.bind(this));
        this.htmlElement.optionsButton.addButtonListener(this._onOptionsButtonPressed.bind(this));
    }

    _initChartSelectListener() {
        this.htmlElement.addChartSelectListener(this._onChartSelected.bind(this));
    }

    async _initHTMLElement() {
        await WT_Wait.awaitCallback(() => this.htmlElement.isInitialized, this);
        this._initSettingListeners();
        this._initButtonListeners();
        this._initChartSelectListener();
    }

    init(root) {
        this.container.title = WT_G3x5_TSCCharts.TITLE;
        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);

        this._initHTMLElement();
    }

    /**
     *
     * @param {WT_Airport} airport
     * @returns {Promise<WT_NavigraphChartDefinition[]>}
     */
    async _retrieveCharts(airport) {
        if (airport) {
            try {
                let charts = await this._navigraphAPI.getChartsList(this._airport.ident);
                if (charts) {
                    return charts.charts;
                } else {
                    return [];
                }
            } catch (e) {
                console.log(e);
            }
        }
        return [];
    }

    async _updateCharts() {
        this._charts = await this._retrieveCharts(this._airport);
        this.htmlElement.setAirport(this._airport, this._charts);
    }

    /**
     *
     * @param {WT_Airport} airport
     */
    _setAirport(airport) {
        if (airport === null && this._airport === null || (airport && airport.equals(this._airport))) {
            return;
        }

        this._airport = airport;
        this._icaoSetting.setValue(this._airport ? this._airport.icao : "");
        this._updateCharts();
    }

    async _setAirportICAO(icao) {
        if (icao) {
            try {
                let airport = await this.instrument.icaoWaypointFactory.getAirport(icao);
                this._setAirport(airport);
                return;
            } catch (e) {
                console.log(e);
            }
        }
        this._setAirport(null);
    }

    _onICAOSettingChanged(setting, newValue, oldValue) {
        this._setAirportICAO(newValue);
    }

    _setChartID(id) {
        this._chartID = id;
        this.htmlElement.setChartID(this._chartID);
    }

    _onChartIDSettingChanged(setting, newValue, oldValue) {
        this._setChartID(newValue);
    }

    _openKeyboard() {
        this.instrument.deactivateNavButton(5);
        this.instrument.deactivateNavButton(6);
        this.instrument.fullKeyboard.element.setContext(this._onKeyboardClosed.bind(this), WT_ICAOWaypoint.Type.AIRPORT);
        this.instrument.switchToPopUpPage(this.instrument.fullKeyboard);
    }

    _onSelectButtonPressed(button) {
        this._openKeyboard();
    }

    _onOptionsButtonPressed(button) {
    }

    _onKeyboardClosed(icao) {
        this._setAirportICAO(icao);
    }

    /**
     *
     * @param {WT_NavigraphChartDefinition} chart
     */
    _onChartSelected(chart) {
        this._chartIDSetting.setValue(chart.id);
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
WT_G3x5_TSCCharts.TITLE = "Charts";

class WT_G3x5_TSCChartsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCChartsHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCCharts}
     */
    get parentPage() {
        return this._parentPage;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInitialized() {
        return this._isInit;
    }

    /**
     * @readonly
     * @type {WT_TSCWaypointButton}
     */
    get selectButton() {
        return this._selectButton;
    }

    /**
     * @readonly
     * @type {WT_TSCLabeledButton}
     */
    get optionsButton() {
        return this._optionsButton;
    }

    _initSelectButton() {
        this._selectButton = new WT_TSCWaypointButton();
        this._selectButton.classList.add(WT_G3x5_TSCChartsHTMLElement.SELECT_BUTTON_CLASS);
        this._selectButton.emptyText = "Select Airport";
        this._selectButton.setIconSrcFactory(new WT_TSCWaypointButtonIconSrcFactory(WT_G3x5_TSCChartsHTMLElement.WAYPOINT_ICON_PATH));
        this._header.appendChild(this._selectButton);
    }

    _initOptionsButton() {
        this._optionsButton = new WT_TSCLabeledButton();
        this._optionsButton.classList.add(WT_G3x5_TSCChartsHTMLElement.OPTIONS_BUTTON_CLASS);
        this._optionsButton.labelText = "Charts<br>Options";
        this._header.appendChild(this._optionsButton);
    }

    _initHeader() {
        this._header = document.createElement("div");
        this._header.classList.add(WT_G3x5_TSCChartsHTMLElement.HEADER_CLASS);

        this._initSelectButton();
        this._initOptionsButton();

        this._header.slot = "header";
        this.appendChild(this._header);
    }

    _initMain() {
        this._main = new WT_G3x5_TSCTabbedView();
        this._main.classList.add(WT_G3x5_TSCChartsHTMLElement.MAIN_VIEW_CLASS);
        this._main.slot = "main";
        this.appendChild(this._main);
    }

    _initChildren() {
        this._initHeader();
        this._initMain();
    }

    _initInfoTab() {
        this._info = new WT_G3x5_TSCChartsTab("Info", this.parentPage, chart => {
            return chart.type.section === "APT" || chart.type.section === "REF";
        });
        this._main.addTab(this._info);
    }

    _initDepartureTab() {
        this._departure = new WT_G3x5_TSCChartsTab("Departure", this.parentPage, chart => {
            return chart.type.section === "DEP";
        });
        this._main.addTab(this._departure);
    }

    _initArrivalTab() {
        this._arrival = new WT_G3x5_TSCChartsTab("Arrival", this.parentPage, chart => {
            return chart.type.section === "ARR";
        });
        this._main.addTab(this._arrival);
    }

    _initApproachTab() {
        this._approach = new WT_G3x5_TSCChartsTab("Approach", this.parentPage, chart => {
            return chart.type.section === "APP";
        });
        this._main.addTab(this._approach);
    }

    _initTabs() {
        this._initInfoTab();
        this._initDepartureTab();
        this._initArrivalTab();
        this._initApproachTab();

        this._lastActiveTabIndex = 0;
    }

    connectedCallback() {
        this._initChildren();
        this._initTabs();
        this._isInit = true;
    }

    setParentPage(page) {
        this._parentPage = page;
    }

    setAirport(airport, charts) {
        this._selectButton.setWaypoint(airport);
        this._info.setAirport(airport, charts);
        this._departure.setAirport(airport, charts);
        this._arrival.setAirport(airport, charts);
        this._approach.setAirport(airport, charts);
    }

    setChartID(id) {
        this._info.setChartID(id);
        this._departure.setChartID(id);
        this._arrival.setChartID(id);
        this._approach.setChartID(id);
    }

    addChartSelectListener(listener) {
        this._info.addChartSelectListener(listener);
        this._departure.addChartSelectListener(listener);
        this._arrival.addChartSelectListener(listener);
        this._approach.addChartSelectListener(listener);
    }

    removeChartSelectListener(listener) {
        this._info.removeChartSelectListener(listener);
        this._departure.removeChartSelectListener(listener);
        this._arrival.removeChartSelectListener(listener);
        this._approach.removeChartSelectListener(listener);
    }

    open() {
        this._main.setActiveTabIndex(this._lastActiveTabIndex);
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._main.getActiveTab().update();
    }

    close() {
        this._lastActiveTabIndex = this._main.getActiveTabIndex();
        this._main.setActiveTabIndex(-1);
    }
}
WT_G3x5_TSCChartsHTMLElement.WAYPOINT_ICON_PATH = "/WTg3000/SDK/Assets/Images/Garmin/TSC/Waypoints";
WT_G3x5_TSCChartsHTMLElement.HEADER_CLASS = "chartsHeader";
WT_G3x5_TSCChartsHTMLElement.SELECT_BUTTON_CLASS = "chartsSelectButton";
WT_G3x5_TSCChartsHTMLElement.OPTIONS_BUTTON_CLASS = "chartsOptionsButton";
WT_G3x5_TSCChartsHTMLElement.MAIN_VIEW_CLASS = "chartsMain";
WT_G3x5_TSCChartsHTMLElement.NAME = "wt-tsc-charts";
WT_G3x5_TSCChartsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCChartsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }
    </style>
    <div id="wrapper">
        <slot name="header"></slot>
        <slot name="main" id="main"></slot>
    </div>
`;

customElements.define(WT_G3x5_TSCChartsHTMLElement.NAME, WT_G3x5_TSCChartsHTMLElement);

class WT_G3x5_TSCChartsTab extends WT_G3x5_TSCTabContent {
    constructor(title, parentPage, chartsFilter) {
        super(title);

        this._parentPage = parentPage;
        this._htmlElement = this._createHTMLElement();
        this._htmlElement.setContext({
            parentPage: parentPage,
            chartsFilter: chartsFilter
        });
    }

    /**
     *
     * @returns {WT_G3x5_TSCChartsTabHTMLElement}
     */
    _createHTMLElement() {
        return new WT_G3x5_TSCChartsTabHTMLElement();
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCCharts}
     */
    get parentPage() {
        return this._parentPage;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCChartsTabHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    setAirport(airport, charts) {
        this.htmlElement.setAirport(airport, charts);
        this.htmlElement.setAirport(airport, charts);
        this.htmlElement.setAirport(airport, charts);
        this.htmlElement.setAirport(airport, charts);
    }

    setChartID(id) {
        this.htmlElement.setChartID(id);
        this.htmlElement.setChartID(id);
        this.htmlElement.setChartID(id);
        this.htmlElement.setChartID(id);
    }

    addChartSelectListener(listener) {
        this.htmlElement.addChartSelectListener(listener);
    }

    removeChartSelectListener(listener) {
        this.htmlElement.removeChartSelectListener(listener);
    }

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
        this.htmlElement.open();
    }

    onDeactivated() {
        this._deactivateNavButtons();
        this.htmlElement.close();
    }

    _onUpPressed() {
        this.htmlElement.scrollUp();
    }

    _onDownPressed() {
        this.htmlElement.scrollDown();
    }

    update() {
        this.htmlElement.update();
    }
}

class WT_G3x5_TSCChartsTabButtonRecycler extends WT_HTMLElementRecycler {
    constructor(parent, buttonListener) {
        super(parent);

        this._buttonListener = buttonListener;
    }

    _createElement() {
        let button = new WT_TSCLabeledButton();
        button.classList.add(WT_G3x5_TSCChartsTabHTMLElement.BUTTON_CLASS);
        button.slot = "content";
        button.addButtonListener(this._buttonListener);
        return button;
    }
}

class WT_G3x5_TSCChartsTabHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_Airport}
         */
        this._airport = null;
        /**
         * @type {WT_NavigraphChartDefinition[]}
         */
        this._airportCharts = null;
        this._chartID = "";

        /**
         * @type {{chart:WT_NavigraphChartDefinition, button:WT_TSCLabeledButton}[]}
         */
        this._filteredChartEntries = [];
        this._highlightedEntry = null;
        /**
         * @type {((chart:WT_NavigraphChartDefinition) => void)[]}
         */
        this._chartSelectListeners = [];
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCChartsTabHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCAirportInfo}
     */
    get parentPage() {
        return this._parentPage;
    }

    /**
     * @readonly
     * @type {WT_Airport}
     */
    get airport() {
        return this._airport;
    }

    _initScrollList() {
        this._scrollList = new WT_TSCScrollList();
        this._scrollList.slot = "buttons";
        this._scrollList.style.position = "relative";
        this._scrollList.style.width = "100%";
        this._scrollList.style.height = "100%";
        this.appendChild(this._scrollList);
    }

    _initButtonRecycler() {
        /**
         * @type {WT_HTMLElementRecycler<WT_TSCLabeledButton>}
         */
         this._buttonRecycler = new WT_G3x5_TSCChartsTabButtonRecycler(this._scrollList, this._onButtonPressed.bind(this));
    }

    connectedCallback() {
        this._initScrollList();
        this._initButtonRecycler();
        this._isInit = true;
        if (this._context) {
            this._updateFromContext();
        }
    }

    _clearButtons() {
        this._buttonRecycler.recycleAll();
        this._filteredChartEntries = [];
    }

    _populateButtons() {
        if (!this.airport || !this._context) {
            return;
        }

        this._airportCharts.forEach(chart => {
            if (this._context.chartsFilter(chart)) {
                let button = this._buttonRecycler.request();
                button.labelText = chart.procedure_identifier;
                this._filteredChartEntries.push({chart: chart, button: button});
            }
        });
    }

    _updateHighlight() {
        this._highlightedEntry = null;
        this._filteredChartEntries.forEach(entry => {
            if (entry.chart.id === this._chartID) {
                entry.button.highlight = "true";
                this._highlightedEntry = entry;
            } else {
                entry.button.highlight = "false";
            }
        }, this);
    }

    _updateButtons() {
        this._clearButtons();
        this._populateButtons();
        this._updateHighlight();
    }

    _updateFromContext() {
        this._updateButtons();
    }

    setContext(context) {
        if (this._context === context) {
            return;
        }

        this._context = context;
        if (this._isInit) {
            this._updateFromContext();
        }
    }

    /**
     *
     * @param {WT_Airport} airport
     * @param {WT_NavigraphChartDefinition[]} charts
     */
    setAirport(airport, charts) {
        if ((!airport && !this._airport) || (this.airport && this.airport.equals(airport))) {
            return;
        }

        this._airport = airport;
        this._airportCharts = charts;
        this._updateButtons();
    }

    setChartID(id) {
        if (id === this._chartID) {
            return;
        }

        this._chartID = id;
        this._updateHighlight();
    }

    addChartSelectListener(listener) {
        this._chartSelectListeners.push(listener);
    }

    removeChartSelectListener(listener) {
        let index = this._chartSelectListeners.indexOf(listener);
        if (index >= 0) {
            this._chartSelectListeners.splice(index, 1);
        }
    }

    _notifyChartSelectListeners(chart) {
        this._chartSelectListeners.forEach(listener => listener(chart));
    }

    _onButtonPressed(button) {
        let entry = this._filteredChartEntries.find(entry => entry.button === button);
        if (entry) {
            this._notifyChartSelectListeners(entry.chart);
        }
    }

    scrollUp() {
        if (!this._isInit) {
            return;
        }

        this._scrollList.scrollManager.scrollUp();
    }

    scrollDown() {
        if (!this._isInit) {
            return;
        }

        this._scrollList.scrollManager.scrollDown();
    }

    _scrollToHighlightedButton() {
        if (this._highlightedEntry) {
            this._scrollList.scrollManager.scrollToElement(this._highlightedEntry.button, true);
        }
    }

    open() {
        this._scrollToHighlightedButton();
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._scrollList.scrollManager.update();
    }

    close() {
        if (!this._isInit) {
            return;
        }

        this._scrollList.scrollManager.cancelScroll();
    }
}
WT_G3x5_TSCChartsTabHTMLElement.BUTTON_CLASS = "chartButton";
WT_G3x5_TSCChartsTabHTMLElement.NAME = "wt-tsc-charts-tab";
WT_G3x5_TSCChartsTabHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCChartsTabHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }
            #buttons {
                position: relative;
                width: 100%;
                height: 100%;
            }
    </style>
    <slot name="buttons" id="buttons"></slot>
`;

customElements.define(WT_G3x5_TSCChartsTabHTMLElement.NAME, WT_G3x5_TSCChartsTabHTMLElement);