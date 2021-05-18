class WT_G3x5_TSCCharts extends WT_G3x5_TSCPageElement {
    /**
     * @param {String} homePageGroup
     * @param {String} homePageName
     * @param {WT_NavigraphAPI} navigraphAPI
     * @param {WT_G3x5_MFDHalfPane.ID} halfPaneID
     */
    constructor(homePageGroup, homePageName, navigraphAPI, halfPaneID, icaoWaypointFactory) {
        super(homePageGroup, homePageName);

        this._icaoWaypointFactory = icaoWaypointFactory;

        this._icao = "";
        /**
         * @type {WT_Airport}
         */
        this._airport = null;
        /**
         * @type {WT_NavigraphChartDefinition[]}
         */
        this._charts = [];
        this._chartID = "";
        /**
         * @type {WT_NavigraphChartDefinition}
         */
        this._chart = null;
        this._dataFail = false;

        this._navigraphAPI = navigraphAPI;
        this._settingModelID = `MFD-${halfPaneID}_${WT_G3x5_ChartsDisplay.SETTING_MODEL_ID}`;
        this._initSettingModel();

        this._scrollEventKey = `${WT_G3x5_ChartsDisplay.SCROLL_EVENT_KEY_PREFIX}_MFD-${halfPaneID}`;

        this._hasMadeManualAirportSelection = false;
        this._manualAirportSelectKey = `${WT_G3x5_TSCCharts.AIRPORT_SELECT_EVENT_KEY_PREFIX}_MFD-${halfPaneID}`;
        this._initManualAirportSelectListener();
    }

    _initICAOSettingListener() {
        this._icaoSetting.addListener(this._onICAOSettingChanged.bind(this));
        this._setAirportICAO(this._icaoSetting.getValue(), true);
    }

    _initChartIDSettingListener() {
        this._chartIDSetting.addListener(this._onChartIDSettingChanged.bind(this));
        this._setChartID(this._chartIDSetting.getValue());
    }

    _initSettingListeners() {
        this._initICAOSettingListener();
        this._initChartIDSettingListener();
    }

    _initSettingModel() {
        this._settingModel = new WT_DataStoreSettingModel(this._settingModelID);
        this._settingModel.addSetting(this._icaoSetting = new WT_G3x5_ChartsICAOSetting(this._settingModel));
        this._settingModel.addSetting(this._chartIDSetting = new WT_G3x5_ChartsChartIDSetting(this._settingModel));
        this._settingModel.addSetting(this._lightModeSetting = new WT_G3x5_ChartsLightModeSetting(this._settingModel));
        this._settingModel.addSetting(this._lightThresholdSetting = new WT_G3x5_ChartsLightThresholdSetting(this._settingModel));
        this._settingModel.addSetting(this._sectionSetting = new WT_G3x5_ChartsSectionSetting(this._settingModel));
        this._settingModel.addSetting(this._rotationSetting = new WT_G3x5_ChartsRotationSetting(this._settingModel));
        this._settingModel.addSetting(this._zoomSetting = new WT_G3x5_ChartsZoomSetting(this._settingModel));

        this._icaoSetting.init();

        this._initSettingListeners();
    }

    _initManualAirportSelectListener() {
        WT_CrossInstrumentEvent.addListener(this._manualAirportSelectKey, this._onManualAirportSelect.bind(this));
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCChartsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @type {WT_Airport}
     */
    get selectedAirport() {
        return this._airport;
    }

    /**
     * @readonly
     * @type {String}
     */
    get selectedChartID() {
        return this._chartID;
    }

    /**
     * @readonly
     * @type {WT_NavigraphChartDefinition}
     */
    get selectedChart() {
        return this._chart;
    }

    /**
     * @readonly
     * @type {WT_G3x5_ChartsLightModeSetting}
     */
    get lightModeSetting() {
        return this._lightModeSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_ChartsLightThresholdSetting}
     */
    get lightThresholdSetting() {
        return this._lightThresholdSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_ChartsSectionSetting}
     */
    get sectionSetting() {
        return this._sectionSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_ChartsRotationSetting}
     */
    get rotationSetting() {
        return this._rotationSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_ChartsZoomSetting}
     */
    get zoomSetting() {
        return this._zoomSetting;
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCChartsHTMLElement();
        htmlElement.setParentPage(this);
        return htmlElement;
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
        this.htmlElement.setAirport(this._airport);
        this.htmlElement.setCharts(this._charts);
        this.htmlElement.setChartID(this._chartID);
        this.htmlElement.setDataFail(this._dataFail);
        this._initButtonListeners();
        this._initChartSelectListener();
    }

    init(root) {
        this.container.title = WT_G3x5_TSCCharts.TITLE;
        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);

        this._initHTMLElement();
    }

    rotateCCW() {
        if (!this.selectedChart) {
            return;
        }

        this.rotationSetting.rotateCCW();
    }

    rotateCW() {
        if (!this.selectedChart) {
            return;
        }

        this.rotationSetting.rotateCW();
    }

    resetRotation() {
        this.rotationSetting.resetRotation();
    }

    changeZoom(delta) {
        if (!this.selectedChart) {
            return;
        }

        this.zoomSetting.changeZoom(delta);
    }

    resetZoom() {
        this.zoomSetting.resetZoom();
    }

    /**
     *
     * @param {WT_GVector2} delta
     */
    scroll(delta) {
        if (!this.selectedChart) {
            return;
        }

        WT_CrossInstrumentEvent.fireEvent(this._scrollEventKey, `${delta.x},${delta.y}`);
    }

    resetScroll() {
        WT_CrossInstrumentEvent.fireEvent(this._scrollEventKey, WT_G3x5_ChartsDisplay.SCROLL_EVENT_RESET);
    }

    _findChart(id) {
        let chart = this._charts.find(chart => chart.id === id);
        return chart ? chart : null;
    }

    _updateChartFromID(id) {
        this._chart = this._findChart(id);
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
                this._dataFail = false;
                if (this.htmlElement && this.htmlElement.isInitialized) {
                    this.htmlElement.setDataFail(this._dataFail);
                }
                if (charts) {
                    return charts.charts;
                }
            } catch (e) {
                console.log(e);
                if (e === WT_NavigraphAPI.Error.ACCESS_DENIED) {
                    this._dataFail = true;
                    if (this.htmlElement && this.htmlElement.isInitialized) {
                        this.htmlElement.setDataFail(this._dataFail);
                    }
                }
            }
        }
        return [];
    }

    async _updateCharts() {
        let airport = this._airport;
        this._charts = await this._retrieveCharts(airport);

        if (airport === this._airport && this.htmlElement && this.htmlElement.isInitialized) {
            this.htmlElement.setCharts(this._charts);
        }
    }

    /**
     *
     * @param {WT_Airport} airport
     */
    _updateChartIDFromAirport(airport) {
        if (airport) {
            if (this._chartID.substring(0, 4) !== airport.ident) {
                // selected chart ID does not belong to the airport -> try to select airport diagram.
                let chartID = "";
                let chart = this._charts.find(chart => chart.type.code === "AP");
                if (chart) {
                    chartID = chart.id;
                }
                this._chartIDSetting.setValue(chartID);
                this._resetChartSettings();
            } else {
                this._updateChartFromID(this._chartID);
            }
        } else {
            this._chartIDSetting.setValue("");
        }
    }

    async _updateChartsFromAirport(fromSync) {
        await this._updateCharts();
        if (!fromSync) {
            this._updateChartIDFromAirport(this._airport);
        } else {
            this._updateChartFromID(this._chartID);
        }
    }

    /**
     *
     * @param {WT_Airport} airport
     * @param {Boolean} fromSync
     */
    async _setAirport(airport, fromSync) {
        if ((airport === null && this._airport === null) || (airport && airport.equals(this._airport))) {
            return;
        }

        this._airport = airport;
        if (!fromSync) {
            this._icaoSetting.setValue(this._airport ? this._airport.icao : "");
        }
        if (this.htmlElement && this.htmlElement.isInitialized) {
            this.htmlElement.setAirport(this._airport);
        }
        await this._updateChartsFromAirport(fromSync);
    }

    /**
     *
     * @param {String} icao
     * @param {Boolean} fromSync
     */
    async _setAirportICAO(icao, fromSync) {
        if (this._icao === icao) {
            return;
        }

        this._icao = icao;
        if (icao) {
            try {
                let airport = await this._icaoWaypointFactory.getAirport(icao);
                await this._setAirport(airport, fromSync);
            } catch (e) {
                console.log(e);
                await this._setAirportICAO("");
            }
        } else {
            await this._setAirport(null, fromSync);
        }
    }

    setAirportICAO(icao) {
        if (icao !== "" && !this._hasMadeManualAirportSelection) {
            this._fireManualAirportSelectionEvent();
        }

        this._setAirportICAO(icao, false);
    }

    _onICAOSettingChanged(setting, newValue, oldValue) {
        this._setAirportICAO(newValue, true);
    }

    _setChartID(id) {
        this._chartID = id;
        this._updateChartFromID(id);
        if (this.htmlElement && this.htmlElement.isInitialized) {
            this.htmlElement.setChartID(this._chartID);
        }
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

    _openOptionsWindow() {
        this.instrument.deactivateNavButton(5);
        this.instrument.deactivateNavButton(6);
        this.instrument.chartsOptions.element.setContext({homePageGroup: this.homePageGroup, homePageName: this.homePageName, chartsPage: this});
        this.instrument.switchToPopUpPage(this.instrument.chartsOptions);
    }

    _onSelectButtonPressed(button) {
        this._openKeyboard();
    }

    _onOptionsButtonPressed(button) {
        this._openOptionsWindow();
    }

    _fireManualAirportSelectionEvent() {
        WT_CrossInstrumentEvent.fireEvent(this._manualAirportSelectKey, "");
    }

    _onKeyboardClosed(icao) {
        this.setAirportICAO(icao);
    }

    _onManualAirportSelect(key, data) {
        this._hasMadeManualAirportSelection = true;
    }

    _resetChartSettings() {
        this.sectionSetting.setValue(WT_G3x5_ChartsModel.SectionMode.ALL);
        this.resetRotation();
        this.resetZoom();
        this.resetScroll();
    }

    /**
     *
     * @param {WT_NavigraphChartDefinition} chart
     */
    _onChartSelected(chart) {
        this._chartIDSetting.setValue(chart.id);
        this._resetChartSettings();
    }

    /**
     *
     * @returns {WT_Airport}
     */
    _chooseAutoSelectAirport() {
        if (this._icao !== "" && this._hasMadeManualAirportSelection) {
            return null;
        }

        let fpm = this.instrument.flightPlanManagerWT;
        let origin = fpm.getOriginWaypoint(true);
        let destination = fpm.getDestinationWaypoint(true);

        if (origin && origin instanceof WT_Airport) {
            // if there is an origin loaded into the active flight plan, we will check to see if a departure is also
            // loaded. If there is a departure, we will attempt to switch to origin airport only if active leg is
            // before end of departure. If there is no departure or no active leg, we will switch to origin if the
            // distance of the airplane from the origin is less than 15 NM or the distance to the destination,
            // whichever is smaller.

            let shouldSelectOrigin = false;
            let departure = fpm.activePlan.getDeparture();
            let activeLeg = fpm.directTo.isActive() ? fpm.getDirectToLeg(true) : fpm.getActiveLeg(true);
            if (departure && activeLeg) {
                shouldSelectOrigin = activeLeg.index <= departure.legs.get(departure.legs.length - 1).index;
            } else {
                let planePos = this.instrument.airplane.navigation.position();
                let distanceFromOrigin = origin.location.distance(planePos);
                let distanceToDest = destination ? destination.location.distance(planePos) : Infinity;
                let compareDistance = Math.min(distanceToDest, WT_G3x5_TSCCharts.AIRPORT_AUTOSELECT_ORIGIN_RADIUS.asUnit(WT_Unit.GA_RADIAN));
                shouldSelectOrigin = distanceFromOrigin <= compareDistance;
            }

            if (shouldSelectOrigin) {
                return origin;
            }
        }

        if (destination && destination instanceof WT_Airport) {
            // if an origin was not selected and a destination airport is loaded into the flight plan (or a direct-to
            // an airport is active), select the destination.

            return destination;
        } else {
            // select nearest airport if a current airport is not selected.

            let nearest = this.instrument.nearestAirportList.airports.get(0);
            if (nearest) {
                return nearest;
            }
        }
        return null;
    }

    _autoSelectAirport() {
        let lastPageName = this.instrument.history[this.instrument.history.length - 1].pageName;
        if (lastPageName !== "MFD Home") {
            return;
        }

        let airportToSelect = this._chooseAutoSelectAirport();
        if (airportToSelect && airportToSelect.icao !== this._icao) {
            this._setAirportICAO(airportToSelect.icao, false);
        } else if (this._airport && this._dataFail) {
            // there was an error retrieving charts for the selected airport the last time the page was open,
            // so we will force another charts update in case the issue preventing chart retrieval has since
            // been resolved
            this._updateChartsFromAirport(false);
        }
    }

    _activateChartsDisplayPane() {
        let settings = this.instrument.getSelectedMFDPaneSettings();
        settings.display.setValue(WT_G3x5_MFDHalfPaneDisplaySetting.Display.CHARTS);
    }

    onEnter() {
        super.onEnter();

        this._autoSelectAirport();
        this._activateChartsDisplayPane();
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
WT_G3x5_TSCCharts.AIRPORT_SELECT_EVENT_KEY_PREFIX = "WT_Charts_ManualAirportSelection";
WT_G3x5_TSCCharts.AIRPORT_AUTOSELECT_ORIGIN_RADIUS = WT_Unit.NMILE.createNumber(15);

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
     * @type {WT_G3x5_TSCWaypointButton}
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

    _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
    }

    _initSelectButton() {
        this._selectButton = new WT_G3x5_TSCWaypointButton();
        this._selectButton.classList.add(WT_G3x5_TSCChartsHTMLElement.SELECT_BUTTON_CLASS);
        this._selectButton.emptyText = "Select Airport";
        this._selectButton.setIconSrcFactory(new WT_G3x5_TSCWaypointButtonIconSrcFactory(WT_G3x5_TSCChartsHTMLElement.WAYPOINT_ICON_PATH));
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
        this._defineChildren();
        this._initChildren();
        this._initTabs();
        this._isInit = true;
    }

    setParentPage(page) {
        this._parentPage = page;
    }

    setAirport(airport) {
        this._selectButton.setWaypoint(airport);
    }

    setCharts(charts) {
        this._info.setCharts(charts);
        this._departure.setCharts(charts);
        this._arrival.setCharts(charts);
        this._approach.setCharts(charts);
    }

    setChartID(id) {
        this._info.setChartID(id);
        this._departure.setChartID(id);
        this._arrival.setChartID(id);
        this._approach.setChartID(id);
    }

    setDataFail(value) {
        this._wrapper.setAttribute("datafail", `${value}`);
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
WT_G3x5_TSCChartsHTMLElement.DATA_FAIL_CLASS = "chartsDataFail";
WT_G3x5_TSCChartsHTMLElement.NAME = "wt-tsc-charts";
WT_G3x5_TSCChartsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCChartsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }
            #datafail {
                display: none;
                position: absolute;
                left: var(--charts-datafail-position-x, 50%);
                top: var(--charts-datafail-position-y, 50%);
                transform: translate(-50%, -50%);
                text-align: center;
                font-size: var(--charts-datafail-font-size, 1.5em);
                color: white;
                padding: 0 0.2em;
                border-radius: 5px;
                border: 3px solid var(--wt-g3x5-bordergray);
                background-color: black;
            }
            #wrapper[datafail="true"] #datafail {
                display: block;
            }
    </style>
    <div id="wrapper">
        <slot name="header"></slot>
        <slot name="main" id="main"></slot>
        <div name="datafail" id="datafail">CHARTS&nbspDATA&nbspFAIL</div>
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

    setCharts(charts) {
        this.htmlElement.setCharts(charts);
        this.htmlElement.setCharts(charts);
        this.htmlElement.setCharts(charts);
        this.htmlElement.setCharts(charts);
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
        this._airportCharts = [];
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
        if (!this._context) {
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

    setCharts(charts) {
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

    _shiftSelectedEntry(delta) {
        let currentIndex = this._filteredChartEntries.indexOf(this._highlightedEntry);
        if (currentIndex < 0) {
            return;
        }

        let targetIndex = currentIndex + delta;
        if (targetIndex >= 0 && targetIndex < this._filteredChartEntries.length) {
            let entry = this._filteredChartEntries[targetIndex];
            this._notifyChartSelectListeners(entry.chart);
            this._scrollList.scrollManager.scrollToElement(entry.button);
        }
    }

    scrollUp() {
        if (!this._isInit) {
            return;
        }

        if (this._highlightedEntry) {
            this._shiftSelectedEntry(-1);
        } else {
            this._scrollList.scrollManager.scrollUp();
        }
    }

    scrollDown() {
        if (!this._isInit) {
            return;
        }

        if (this._highlightedEntry) {
            this._shiftSelectedEntry(1);
        } else {
            this._scrollList.scrollManager.scrollDown();
        }
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