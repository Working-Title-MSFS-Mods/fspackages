/**
 * @extends WT_G3x5_TSCWaypointInfo<WT_Airport>
 */
class WT_G3x5_TSCAirportInfo extends WT_G3x5_TSCWaypointInfo {
    constructor(homePageGroup, homePageName, instrumentID, halfPaneID, mfdPaneDisplaySetting) {
        super(homePageGroup, homePageName, instrumentID, halfPaneID, mfdPaneDisplaySetting, WT_ICAOWaypoint.Type.AIRPORT);
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCWaypointInfoUnitsModel}
     */
    get unitsModel() {
        return this._unitsModel;
    }

    _getTitle() {
        return "Airport Information";
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCAirportInfoHTMLElement();
        htmlElement.setContext({
            parentPage: this,
            airplane: this.instrument.airplane,
            unitsModel: this.unitsModel
        })
        return htmlElement;
    }

    async _createWaypointFromICAO(icao) {
        return this.instrument.icaoWaypointFactory.getAirport(icao);
    }

    setTitle(title) {
        this.container.title = title;
    }
}

/**
 * @extends WT_G3x5_TSCWaypointInfoHTMLElement<WT_Airport>
 */
class WT_G3x5_TSCAirportInfoHTMLElement extends WT_G3x5_TSCWaypointInfoHTMLElement {
    constructor() {
        super();

        this._isConnected = false;
        this._initChildren();
    }

    _getTemplate() {
        return WT_G3x5_TSCAirportInfoHTMLElement.TEMPLATE;
    }

    _initChildren() {
        this._header = document.createElement("div");
        this._header.classList.add(WT_G3x5_TSCAirportInfoHTMLElement.HEADER_CLASS);

        this._selectButton = new WT_G3x5_TSCWaypointButton();
        this._selectButton.classList.add(WT_G3x5_TSCAirportInfoHTMLElement.SELECT_BUTTON_CLASS);
        this._selectButton.emptyText = "Select Airport";
        this._selectButton.setIconSrcFactory(new WT_G3x5_TSCWaypointButtonIconSrcFactory(WT_G3x5_TSCWaypointInfoHTMLElement.WAYPOINT_ICON_PATH));
        this._header.appendChild(this._selectButton);

        this._optionsButton = new WT_TSCLabeledButton();
        this._optionsButton.classList.add(WT_G3x5_TSCAirportInfoHTMLElement.OPTIONS_BUTTON_CLASS);
        this._optionsButton.labelText = "Waypoint<br>Options";
        this._header.appendChild(this._optionsButton);

        this._main = new WT_G3x5_TSCTabbedView();
        this._main.classList.add(WT_G3x5_TSCAirportInfoHTMLElement.MAIN_VIEW_CLASS);
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCTabbedView}
     */
    get mainTabView() {
        return this._main;
    }

    _appendChildren() {
        this._header.slot = "header";
        this.appendChild(this._header);

        this._main.slot = "main";
        this.appendChild(this._main);
    }

    _initTabs() {
        this._infoTab = new WT_G3x5_TSCAirportInfoInfoTab(this._context.parentPage);
        this._main.addTab(this._infoTab);

        this._freqTab = new WT_G3x5_TSCAirportFreqTab(this._context.parentPage);
        this._main.addTab(this._freqTab, WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT);

        this._weatherTab = new WT_G3x5_TSCAirportWeatherTab();
        this._main.addTab(this._weatherTab, WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);

        this._aptdirTab = new WT_G3x5_TSCAirportAPTDIRTab();
        this._main.addTab(this._aptdirTab, WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);

        this._chartsTab = new WT_G3x5_TSCAirportChartsTab();
        this._main.addTab(this._chartsTab, WT_G3x5_TSCTabbedView.TabButtonPosition.RIGHT, false);

        this._runwaysTab = new WT_G3x5_TSCAirportRunwayTab(this._context.parentPage);
        this._main.addTab(this._runwaysTab, WT_G3x5_TSCTabbedView.TabButtonPosition.RIGHT);

        this._notamTab = new WT_G3x5_TSCAirportNOTAMTab();
        this._main.addTab(this._notamTab, WT_G3x5_TSCTabbedView.TabButtonPosition.RIGHT, false);

        this._procTab = new WT_G3x5_TSCAirportProcedureTab();
        this._main.addTab(this._procTab, WT_G3x5_TSCTabbedView.TabButtonPosition.RIGHT, false);

        this._lastActiveTabIndex = 0;
    }

    _doInit() {
        this._initTabs();
        this._isInit = true;
    }

    async _connectedCallbackHelper() {
        this._isConnected = true;
        this._appendChildren();
        if (this._context) {
            this._doInit();
        }
    }

    setContext(context) {
        super.setContext(context);

        if (this._context && this._isConnected && !this._isInit) {
            this._doInit();
        }
    }

    _updateTabs() {
        this._infoTab.setAirport(this._waypoint);
        this._freqTab.setAirport(this._waypoint);
        this._runwaysTab.setAirport(this._waypoint);
    }

    _updateFromWaypoint() {
        super._updateFromWaypoint();

        this._updateTabs();
    }

    open() {
        this._main.setActiveTabIndex(this._lastActiveTabIndex);
    }

    _updateSelectButton() {
        this._selectButton.update(this._context.airplane.navigation.headingTrue());
    }

    _updateParentTitle() {
        let activeTab = this.mainTabView.getActiveTab();
        let title;
        switch (activeTab ? activeTab.title : "") {
            case WT_G3x5_TSCAirportFreqTab.TITLE:
                title = "Airport Frequencies";
                break;
            case WT_G3x5_TSCAirportRunwayTab.TITLE:
                title = "Airport Runway Info";
                break;
            default:
                title = "Airport Information";
        }
        if (this._airport) {
            title += ` – ${this._airport.ident}`;
        }
        this._context.parentPage.setTitle(title);
    }

    _doUpdate() {
        this._updateSelectButton();
        this.mainTabView.getActiveTab().update();
        this._updateParentTitle();
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._doUpdate();
    }

    close() {
        this._lastActiveTabIndex = this._main.getActiveTabIndex();
        this._main.setActiveTabIndex(-1);
    }
}
WT_G3x5_TSCAirportInfoHTMLElement.HEADER_CLASS = "airportInfoHeader";
WT_G3x5_TSCAirportInfoHTMLElement.SELECT_BUTTON_CLASS = "airportInfoSelectButton";
WT_G3x5_TSCAirportInfoHTMLElement.OPTIONS_BUTTON_CLASS = "airportInfoOptionsButton";
WT_G3x5_TSCAirportInfoHTMLElement.MAIN_VIEW_CLASS = "airportInfoMain";
WT_G3x5_TSCAirportInfoHTMLElement.NAME = "wt-tsc-airportinfo";
WT_G3x5_TSCAirportInfoHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCAirportInfoHTMLElement.TEMPLATE.innerHTML = `
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

customElements.define(WT_G3x5_TSCAirportInfoHTMLElement.NAME, WT_G3x5_TSCAirportInfoHTMLElement);

class WT_G3x5_TSCAirportInfoTab extends WT_G3x5_TSCTabContent {
    constructor(parentPage, title) {
        super(title);

        this._parentPage = parentPage;
        this._htmlElement = this._createHTMLElement();
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
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    update() {
    }
}

class WT_G3x5_TSCAirportInfoScrollTab extends WT_G3x5_TSCAirportInfoTab {
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

class WT_G3x5_TSCAirportInfoInfoTab extends WT_G3x5_TSCAirportInfoTab {
    constructor(parentPage) {
        super(parentPage, WT_G3x5_TSCAirportInfoInfoTab.TITLE);
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCAirportInfoTabHTMLElement();
        htmlElement.setContext({
            instrument: this.parentPage.instrument,
            unitsModel: this.parentPage.unitsModel
        });
        return htmlElement;
    }

    setAirport(airport) {
        this.htmlElement.setAirport(airport);
    }

    update() {
        this.htmlElement.update();
    }
}
WT_G3x5_TSCAirportInfoInfoTab.TITLE = "Info";

class WT_G3x5_TSCAirportInfoTabHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCAirportInfoTabHTMLElement.TEMPLATE.content.cloneNode(true));

        /**
         * @type {{instrument:AS3000_TSC, unitsModel:WT_G3x5_TSCWaypointInfoUnitsModel}}
         */
        this._context = null;

        /**
         * @type {WT_Airport}
         */
        this._airport = null;
        this._lastAltitudeUnit = null;

        this._initFormatters();

        this._tempGARad = new WT_NumberUnit(0, WT_Unit.GA_RADIAN);
        this._tempAngle = new WT_NumberUnit(0, WT_Unit.DEGREE);
        this._tempTrueBearing = new WT_NavAngleUnit(false).createNumber(0);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    _initDistanceFormatter() {
        let formatterOpts = {
            precision: 0.1,
            forceDecimalZeroes: true,
            maxDigits: 3,
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                getNumberClassList() {
                    return ["number"];
                },
                getUnitClassList() {
                    return ["unit"];
                }
            }
        };
        this._distanceFormatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);
    }

    _initBearingFormatter() {
        this._bearingFormatter = new WT_NumberFormatter({
            precision: 1,
            unitSpaceBefore: false
        });
    }

    _initElevationFormatter() {
        let elevationFormatterOpts = {
            precision: 1,
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                getNumberClassList() {
                    return ["number"];
                },
                getUnitClassList() {
                    return ["unit"];
                }
            }
        };
        this._elevationFormatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(elevationFormatterOpts), htmlFormatterOpts);
    }

    _initCoordinateFormatter() {
        this._coordinateFormatter = new WT_CoordinateFormatter();
    }

    _initFormatters() {
        this._initDistanceFormatter();
        this._initBearingFormatter();
        this._initElevationFormatter();
        this._initCoordinateFormatter();
    }

    _defineChildren() {
        this._city = this.shadowRoot.querySelector(`#city`);
        this._region = this.shadowRoot.querySelector(`#region`);
        this._brgValue = new WT_CachedElement(this.shadowRoot.querySelector(`#brg .value`));
        this._brgArrow = this.shadowRoot.querySelector(`#brg .arrow`);
        this._disValue = new WT_CachedElement(this.shadowRoot.querySelector(`#dis .value`));
        this._latLong = this.shadowRoot.querySelector(`#latlong`);
        this._elevationValue = this.shadowRoot.querySelector(`#elevation .value`);
        this._utcOffsetValue = new WT_CachedElement(this.shadowRoot.querySelector(`#utcoffset .value`));
        this._privacyValue = this.shadowRoot.querySelector(`#privacy .value`);
    }

    connectedCallback() {
        this._defineChildren();
    }

    setContext(context) {
        this._context = context;
    }

    _updateCityRegion() {
        if (this._airport) {
            this._city.textContent = this._airport.city ? this._airport.city.toString() : "";
            this._region.textContent = WT_G3x5_RegionNames.getName(this._airport.region);
        } else {
            this._city.textContent = "";
            this._region.textContent = "";
        }
    }

    _updateBearingDistance() {
        if (this._airport) {
            let airplane = this._context.instrument.airplane;
            let ppos = airplane.navigation.position(this._tempGeoPoint);
            let heading = airplane.navigation.headingTrue();
            let bearing = this._tempTrueBearing.set(ppos.bearingTo(this._airport.location));
            bearing.unit.setLocation(ppos);
            this._brgValue.innerHTML = this._bearingFormatter.getFormattedString(bearing, this._context.unitsModel.bearingUnit);
            this._brgArrow.setBearing(bearing.number - heading);

            let distance = this._tempGARad.set(ppos.distance(this._airport.location));
            this._disValue.innerHTML = this._distanceFormatter.getFormattedHTML(distance, this._context.unitsModel.distanceUnit);

            if (this._brgArrow.style.display !== "block") {
                this._brgArrow.style.display = "block";
            }
        } else {
            if (this._brgArrow.style.display !== "none") {
                this._brgArrow.style.display = "none";
            }
            this._brgValue.innerHTML = "";
            this._disValue.innerHTML = "";
        }
    }

    _updateLatLong() {
        if (this._airport) {
            let latSign = Math.sign(this._airport.location.lat);
            let latPrefix = latSign < 0 ? "S" : "N";
            let lat = this._tempAngle.set(latSign * this._airport.location.lat);
            let latText = latPrefix + this._coordinateFormatter.getFormattedString(lat);

            let longSign = Math.sign(this._airport.location.long);
            let longPrefix = longSign < 0 ? "W" : "E";
            let long = this._tempAngle.set(longSign * this._airport.location.long);
            let longText = longPrefix + this._coordinateFormatter.getFormattedString(long);

            this._latLong.innerHTML = `${latText}<br>${longText}`;
        } else {
            this._latLong.innerHTML = "";
        }
    }

    _updateElevation() {
        if (this._airport) {
            let unit = this._context.unitsModel.altitudeUnit;
            this._elevationValue.innerHTML = this._elevationFormatter.getFormattedHTML(this._airport.elevation, unit);
            this._lastAltitudeUnit = unit;
        } else {
            this._elevationValue.innerHTML = "";
        }
    }

    _updatePrivacy() {
        if (this._airport) {
            this._privacyValue.innerHTML = WT_G3x5_TSCAirportInfoTabHTMLElement.PRIVACY_TEXT[this._airport.privacy];
        } else {
            this._privacyValue.innerHTML = "";
        }
    }

    _updateUTCOffset() {
        if (this._airport) {
            let offset = this._airport.timezone.offset(this._context.instrument.time);
            let prefix = offset >= 0 ? "+" : "−";
            this._utcOffsetValue.textContent = `UTC${prefix}${Math.abs(offset)}`;
        } else {
            this._utcOffsetValue.textContent = "";
        }
    }

    /**
     *
     * @param {WT_Airport} airport
     */
    setAirport(airport) {
        this._airport = airport;
        this._updateCityRegion();
        this._updateBearingDistance();
        this._updateLatLong();
        this._updateElevation();
        this._updatePrivacy();
        this._updateUTCOffset(); // while technically UTC offsets can change with time (i.e. DST), it's unlikely the change will happen in the middle of
                                 // having this tab open, so to save on performance we will update only on setting the airport.
    }

    _updateAltitudeUnit() {
        let unit = this._context.unitsModel.altitudeUnit;
        if (!unit.equals(this._lastAltitudeUnit)) {
            this._updateElevation();
        }
    }

    update() {
        if (this._airport) {
            this._updateBearingDistance();
            this._updateAltitudeUnit();
        }
    }
}
WT_G3x5_TSCAirportInfoTabHTMLElement.PRIVACY_TEXT = [
    "UNKNOWN",
    "PUBLIC",
    "MILITARY",
    "PRIVATE"
];
WT_G3x5_TSCAirportInfoTabHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCAirportInfoTabHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
            background-color: black;
            color: white;
            text-align: center;
        }

        #wrapper {
            position: absolute;
            left: 2%;
            width: 96%;
            top: 2%;
            height: 96%;
            background-color: gray;
            display: grid;
            grid-template-columns: 100%;
            grid-template-rows: 20% 40% 20% 20%;
            grid-gap: 1px 0;
        }
            .row {
                position: relative;
                width: 100%;
                height: 100%;
                background-color: black;
            }
            .title {
                font-size: 0.9em;
            }
            .unit {
                font-size: 0.75em;
            }

            #row1 {
                display: flex;
                flex-flow: column nowrap;
                justify-content: center;
                align-items: flex-start;
            }

                #brg {
                    position: absolute;
                    top: 5%;
                    left: 25%;
                    transform: translateX(-50%);
                }
                    .valuebox {
                        display: flex;
                        flex-flow: row nowrap;
                        align-items: center;
                    }
                        .arrow {
                            width: 1.2em;
                            height: 1.2em;
                        }
                #dis {
                    position: absolute;
                    top: 5%;
                    left: 75%;
                    transform: translateX(-50%);
                }
                #latlong {
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    top: 50%;
                }

                #elevation {
                    position: absolute;
                    left: 25%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                }
                #utcoffset {
                    position: absolute;
                    left: 75%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                }

                #fuel {
                    position: absolute;
                    left: 25%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                }
                #privacy {
                    position: absolute;
                    left: 75%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                }
    </style>
    <div id="wrapper">
        <div class="row" id="row1">
            <div id="city"></div>
            <div id="region"></div>
        </div>
        <div class="row" id="row2">
            <div id="brg">
                <div class="title">BRG</div>
                <div class="valuebox">
                    <div class="value"></div>
                    <wt-tsc-bearingarrow class="arrow"></wt-tsc-bearingarrow>
                </div>
            </div>
            <div id="dis">
                <div class="title">DIS</div>
                <div class="value"></div>
            </div>
            <div id="latlong"></div>
        </div>
        <div class="row" id="row3">
            <div id="elevation">
                <div class="title">Elev</div>
                <div class="value"></div>
            </div>
            <div id="utcoffset">
                <div class="title">Time</div>
                <div class="value"></div>
            </div>
        </div>
        <div class="row" id="row4">
            <div id="fuel">
                <div class="title">Fuel</div>
                <div class="value">UNKNOWN</div>
            </div>
            <div id="privacy">
                <div class="value"></div>
            </div>
        </div>
    </div>
`;

customElements.define("tsc-airportinfo-info", WT_G3x5_TSCAirportInfoTabHTMLElement);

class WT_G3x5_TSCAirportFreqTab extends WT_G3x5_TSCAirportInfoScrollTab {
    constructor(parentPage) {
        super(parentPage, WT_G3x5_TSCAirportFreqTab.TITLE);
    }

    _createHTMLElement() {
        let element = new WT_G3x5_TSCAirportFreqTabHTMLElement();
        element.setParentPage(this.parentPage);
        return element;
    }

    setAirport(airport) {
        this.htmlElement.setAirport(airport);
    }

    onActivated() {
        super.onActivated();

        this.htmlElement.open();
    }

    onDeactivated() {
        super.onDeactivated();

        this.htmlElement.close();
    }

    update() {
        this.htmlElement.update();
    }

    _onUpPressed() {
        this.htmlElement.scrollUp();
    }

    _onDownPressed() {
        this.htmlElement.scrollDown();
    }
}
WT_G3x5_TSCAirportFreqTab.TITLE = "Freqs";

class WT_G3x5_TSCAirportFreqLine extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCAirportFreqLine.TEMPLATE.content.cloneNode(true));

        this._airportFreq = null;

        this._isInit = false;
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
     * @type {WT_AirportFrequency}
     */
    get airportFreq() {
        return this._airportFreq;
    }

    _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
        this._name = this.shadowRoot.querySelector(`#name`);
    }

    _initButton() {
        this._button = new WT_TSCLabeledButton();
        this._button.id = "button";
        this._wrapper.appendChild(this._button);
        this._button.addButtonListener(this._onButtonPressed.bind(this));
    }

    connectedCallback() {
        this._defineChildren();
        this._initButton();
        this._updateFrequency();
        this._isInit = true;
    }

    setParentPage(parentPage) {
        this._parentPage = parentPage;
    }

    _onButtonPressed(button) {
        if (!this.airportFreq) {
            return;
        }

        let instrument = this.parentPage.instrument;
        let context = {
            homePageGroup: this.parentPage.homePageGroup,
            homePageName: this.parentPage.homePageName,
            frequencyText: `${button.labelText} ${this.airportFreq.airport.ident} ${this.airportFreq.name}`,
            frequency: this.airportFreq.frequency,
            radioSlotType: this.airportFreq.frequency.hertz(WT_Frequency.Prefix.MHz) < 118 ? WT_G3x5_TSCLoadFrequency.RadioSlotType.NAV : WT_G3x5_TSCLoadFrequency.RadioSlotType.COM
        }
        instrument.loadFrequencyWindow.element.setContext(context);
        instrument.switchToPopUpPage(instrument.loadFrequencyWindow);
    }

    /**
     *
     * @param {WT_AirportFrequency} airportFreq
     */
    _updateButton(airportFreq) {
        this._button.labelText = airportFreq.frequency.hertz(WT_Frequency.Prefix.MHz).toFixed(3).replace(/(\.\d\d)0$/, "$1");
    }

    /**
     *
     * @param {WT_AirportFrequency} airportFreq
     */
    _updateName(airportFreq) {
        this._name.innerHTML = airportFreq.name;
    }

    /**
     *
     * @param {WT_AirportFrequency} airportFreq
     */
    _showFrequencyInfo(airportFreq) {
        this._updateName(airportFreq);
        this._updateButton(airportFreq);
    }

    _clear() {
        this._name.innerHTML = "";
        this._button.labelText = "";
    }

    _updateFrequency() {
        if (this.airportFreq) {
            this._showFrequencyInfo(this.airportFreq);
        } else {
            this._clear();
        }
    }

    /**
     *
     * @param {WT_AirportFrequency} airportFreq
     */
    setAirportFrequency(airportFreq) {
        this._airportFreq = airportFreq;
        if (this._isInit) {
            this._updateFrequency();
        }
    }
}
WT_G3x5_TSCAirportFreqLine.TEMPLATE = document.createElement("template");
WT_G3x5_TSCAirportFreqLine.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            border: solid 1px white;
            border-radius: 5px;
            margin: 0.25vh 0;
        }

        #wrapper {
            position: relative;
            height: 100%;
            width: 100%;
            display: grid;
            grid-template-rows: auto;
            grid-template-columns: 60% 40%;
        }
            #name {
                place-self: start start;
                margin: 5%;
                overflow: hidden;
            }
            #button {
                place-self: center center;
                width: 90%;
                height: 90%;
            }

    </style>
    <div id="wrapper">
        <div id="name"></div>
    </div>
`;

customElements.define("tsc-airportinfo-freqline", WT_G3x5_TSCAirportFreqLine);

class WT_G3x5_TSCAirportFreqLineRecycler extends WT_HTMLElementRecycler {
    constructor(parent, parentPage) {
        super(parent);

        this._parentPage = parentPage;
    }

    _createElement() {
        let line = new WT_G3x5_TSCAirportFreqLine();
        line.setParentPage(this._parentPage);
        line.classList.add(WT_G3x5_TSCAirportFreqTabHTMLElement.FREQ_LINE_CLASS);
        line.slot = "content";
        return line;
    }
}

class WT_G3x5_TSCAirportFreqTabHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCAirportFreqTabHTMLElement.TEMPLATE.content.cloneNode(true));

        /**
         * @type {WT_Airport}
         */
        this._airport = null;
        this._isInit = false;
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
        this._scrollList.slot = "freqs";
        this._scrollList.style.position = "relative";
        this._scrollList.style.width = "100%";
        this._scrollList.style.height = "100%";
        this.appendChild(this._scrollList);
    }

    _initFreqLineRecycler() {
        /**
         * @type {WT_HTMLElementRecycler<WT_G3x5_TSCAirportFreqLine>}
         */
         this._freqLineRecycler = new WT_G3x5_TSCAirportFreqLineRecycler(this._scrollList, this.parentPage);
    }

    connectedCallback() {
        this._initScrollList();
        this._initFreqLineRecycler();
        this._isInit = true;
    }

    setParentPage(parentPage) {
        this._parentPage = parentPage;
    }

    _updateFrequencies() {
        this._freqLineRecycler.recycleAll();
        if (!this.airport) {
            return;
        }

        this.airport.frequencies.array.forEach(airportFreq => {
            let line = this._freqLineRecycler.request();
            line.setAirportFrequency(airportFreq);
        }, this);
    }

    /**
     *
     * @param {WT_Airport} airport
     */
    setAirport(airport) {
        if ((!airport && !this._airport) || (this.airport && this.airport.equals(airport))) {
            return;
        }

        this._airport = airport;
        this._updateFrequencies();
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

    open() {
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
WT_G3x5_TSCAirportFreqTabHTMLElement.FREQ_LINE_CLASS = "freqLine";
WT_G3x5_TSCAirportFreqTabHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCAirportFreqTabHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }
            #freqs {
                position: relative;
                width: 100%;
                height: 100%;
            }
    </style>
    <slot name="freqs" id="freqs"></slot>
`;

customElements.define("tsc-airportinfo-freqs", WT_G3x5_TSCAirportFreqTabHTMLElement);

class WT_G3x5_TSCAirportWeatherTab extends WT_G3x5_TSCTabContent {
    constructor() {
        super(WT_G3x5_TSCAirportWeatherTab.TITLE);

        this._htmlElement = this._createHTMLElement();
    }

    _createHTMLElement() {
        return document.createElement("div");
    }

    /**
     * @readonly
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }
}
WT_G3x5_TSCAirportWeatherTab.TITLE = "Weather";

class WT_G3x5_TSCAirportAPTDIRTab extends WT_G3x5_TSCTabContent {
    constructor() {
        super(WT_G3x5_TSCAirportAPTDIRTab.TITLE);

        this._htmlElement = this._createHTMLElement();
    }

    _createHTMLElement() {
        return document.createElement("div");
    }

    /**
     * @readonly
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }
}
WT_G3x5_TSCAirportAPTDIRTab.TITLE = "APT DIR";

class WT_G3x5_TSCAirportChartsTab extends WT_G3x5_TSCTabContent {
    constructor() {
        super(WT_G3x5_TSCAirportChartsTab.TITLE);

        this._htmlElement = this._createHTMLElement();
    }

    _createHTMLElement() {
        return document.createElement("div");
    }

    /**
     * @readonly
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }
}
WT_G3x5_TSCAirportChartsTab.TITLE = "Charts";

class WT_G3x5_TSCAirportRunwayTab extends WT_G3x5_TSCAirportInfoScrollTab {
    constructor(parentPage) {
        super(parentPage, WT_G3x5_TSCAirportRunwayTab.TITLE);
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCAirportRunwaysTabHTMLElement();
        htmlElement.setContext({
            unitsModel: this.parentPage.unitsModel
        });
        return htmlElement;
    }

    setAirport(airport) {
        this.htmlElement.setAirport(airport);
    }

    onActivated() {
        super.onActivated();

        this.htmlElement.open();
    }

    onDeactivated() {
        super.onDeactivated();

        this.htmlElement.close();
    }

    update() {
        this.htmlElement.update();
    }

    _onUpPressed() {
        this.htmlElement.scrollUp();
    }

    _onDownPressed() {
        this.htmlElement.scrollDown();
    }
}
WT_G3x5_TSCAirportRunwayTab.TITLE = "Runways";

class WT_G3x5_TSCRunwayButton extends WT_TSCButton {
    constructor() {
        super();

        /**
         * @type {{unitsModel:WT_G3x5_TSCWaypointInfoUnitsModel}}
         */
        this._context = null;
        this._runway = null;
        this._lastLengthUnit = null;
        this._isInit = false;

        this._initFormatter();
    }

    _createWrapperStyle() {
        return `
            #wrapper {
                position: absolute;
                left: 1%;
                top: 1%;
                width: 99%;
                height: 99%;
                display: flex;
                flex-flow: column nowrap;
                justify-content: center;
                align-items: center;
            }
        `;
    }

    _createDesignationStyle() {
        return `
            #designation {
                font-size: 1.5em;
            }
        `;
    }

    _createSizeStyle() {
        return `
            .unit {
                font-size: 0.75em;
            }
        `;
    }

    _createSurfaceStyle() {
        return "";
    }

    _createLightingStyle() {
        return "";
    }

    _createStyle() {
        let style = super._createStyle();

        let designationStyle = this._createDesignationStyle();
        let sizeStyle = this._createSizeStyle();
        let surfaceStyle = this._createSurfaceStyle();
        let lightingStyle = this._createLightingStyle();

        return`
            ${style}
            ${designationStyle}
            ${sizeStyle}
            ${surfaceStyle}
            ${lightingStyle}
        `;
    }

    _initFormatter() {
        let formatterOpts = {
            precision: 1,
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                getNumberClassList() {
                    return ["number"];
                },
                getUnitClassList() {
                    return ["unit"];
                }
            }
        };
        this._lengthFormatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);
    }

    _appendChildren() {
        this._designation = document.createElement("div");
        this._designation.id = "designation";
        this._size = document.createElement("div");
        this._size.id = "size";
        this._surface = document.createElement("div");
        this._surface.id = "surface";
        this._lighting = document.createElement("div");
        this._lighting.id = "lighting";

        this._wrapper.appendChild(this._designation);
        this._wrapper.appendChild(this._size);
        this._wrapper.appendChild(this._surface);
        this._wrapper.appendChild(this._lighting);
    }

    /**
     * @readonly
     * @type {WT_Runway}
     */
    get runway() {
        return this._runway;
    }

    connectedCallback() {
        super.connectedCallback();

        this._updateRunway();
        this._isInit = true;
    }

    setContext(context) {
        this._context = context;
    }

    /**
     *
     * @param {WT_Runway} runway
     */
    _updateDesignation(runway) {
        this._designation.innerHTML = runway.pairDesignation;
    }

    /**
     *
     * @param {WT_Runway} runway
     */
    _updateSize(runway) {
        let unit = this._context.unitsModel.lengthUnit;
        let lengthText = this._lengthFormatter.getFormattedHTML(runway.length, unit);
        let widthText = this._lengthFormatter.getFormattedHTML(runway.width, unit);
        this._size.innerHTML = `${lengthText} x ${widthText}`;
        this._lastLengthUnit = unit;
    }

    /**
     *
     * @param {WT_Runway} runway
     */
    _updateSurface(runway) {
        switch (runway.surface) {
            case WT_Runway.Surface.CONCRETE:
            case WT_Runway.Surface.ASPHALT:
                this._surface.innerHTML = "Hard Surface";
                break;
            case WT_Runway.Surface.GRASS:
            case WT_Runway.Surface.TURF:
                this._surface.innerHTML = "Turf Surface";
                break;
            case WT_Runway.Surface.GRAVEL:
                this._surface.innerHTML = "Gravel Surface";
                break;
            case WT_Runway.Surface.DIRT:
                this._surface.innerHTML = "Dirt Surface";
                break;
            default:
                this._surface.innerHTML = "Unknown Surface";
        }
    }

    /**
     *
     * @param {WT_Runway} runway
     */
    _updateLighting(runway) {
        this._lighting.innerHTML = WT_G3x5_TSCRunwayButton.LIGHTING_TEXT[runway.lighting];
    }

    /**
     *
     * @param {WT_Runway} runway
     */
    _showRunwayInfo(runway) {
        this._updateDesignation(runway);
        this._updateSize(runway);
        this._updateSurface(runway);
        this._updateLighting(runway);
    }

    _clear() {
        this._designation.innerHTML = "";
        this._size.innerHTML = "";
        this._surface.innerHTML = "";
        this._lighting.innerHTML = "";
    }

    _updateRunway() {
        if (this.runway) {
            this._showRunwayInfo(this.runway);
        } else {
            this._clear();
        }
    }

    /**
     *
     * @param {WT_Runway} runway
     */
    setRunway(runway) {
        if ((!runway && !this.runway) || (runway && this.runway && runway.airport.equals(this.runway.airport) && runway.pairDesignation === this.runway.pairDesignation)) {
            return;
        }

        this._runway = runway;
        if (this._isInit) {
            this._updateRunway();
        }
    }

    _updateLengthUnit() {
        let unit = this._context.unitsModel.lengthUnit;
        if (!unit.equals(this._lastLengthUnit)) {
            this._updateSize(this._runway);
        }
    }

    update() {
        this._updateLengthUnit();
    }
}
WT_G3x5_TSCRunwayButton.LIGHTING_TEXT = [
    "Unknown",
    "No Lights",
    "Part Time",
    "Full Time",
    "PCL"
];

customElements.define("wt-tsc-button-runway", WT_G3x5_TSCRunwayButton);

class WT_G3x5_TSCRunwayButtonRecycler extends WT_HTMLElementRecycler {
    _createElement() {
        let button = new WT_G3x5_TSCRunwayButton();
        button.classList.add(WT_G3x5_TSCAirportRunwaysTabHTMLElement.BUTTON_CLASS);
        button.slot = "content";
        return button;
    }
}

class WT_G3x5_TSCAirportRunwaysTabHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCAirportRunwaysTabHTMLElement.TEMPLATE.content.cloneNode(true));

        /**
         * @type {{unitsModel:WT_G3x5_TSCWaypointInfoUnitsModel}}
         */
        this._context = null;
        /**
         * @type {WT_Airport}
         */
        this._airport = null;
        this._isInit = false;

        /**
         * @type {WT_G3x5_TSCRunwayButton[]}
         */
        this._buttons = [];
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

    _initRunwayButtonRecycler() {
        /**
         * @type {WT_HTMLElementRecycler<WT_G3x5_TSCRunwayButton>}
         */
         this._buttonRecycler = new WT_G3x5_TSCRunwayButtonRecycler(this._scrollList);
    }

    connectedCallback() {
        this._initScrollList();
        this._initRunwayButtonRecycler();
        this._isInit = true;
    }

    setContext(context) {
        this._context = context;
    }

    _updateRunways() {
        this._buttonRecycler.recycleAll();
        this._buttons = [];
        if (!this.airport) {
            return;
        }

        this.airport.runways.array.forEach(runway => {
            let existing = this._buttons.find(compare => compare.runway.pairDesignation === runway.pairDesignation);
            if (!existing) {
                let button = this._buttonRecycler.request();
                button.setContext(this._context);
                button.setRunway(runway);
                this._buttons.push(button);
            }
        }, this);
    }

    /**
     *
     * @param {WT_Airport} airport
     */
    setAirport(airport) {
        if ((!airport && !this._airport) || (this.airport && this.airport.equals(airport))) {
            return;
        }

        this._airport = airport;
        this._updateRunways();
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

    open() {
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._scrollList.scrollManager.update();
        this._buttons.forEach(button => button.update());
    }

    close() {
        if (!this._isInit) {
            return;
        }

        this._scrollList.scrollManager.cancelScroll();
    }
}
WT_G3x5_TSCAirportRunwaysTabHTMLElement.BUTTON_CLASS = "runwayButton";
WT_G3x5_TSCAirportRunwaysTabHTMLElement.PRIVACY_TEXT = [
    "UNKNOWN",
    "PUBLIC",
    "MILITARY",
    "PRIVATE"
];
WT_G3x5_TSCAirportRunwaysTabHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCAirportRunwaysTabHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
            color: white;
            text-align: center;
        }
            #buttons {
                position: relative;
                width: 100%;
                height: 100%;
            }

    </style>
    <slot name="buttons" id="buttons"></slot>
`;

customElements.define("tsc-airportinfo-runways", WT_G3x5_TSCAirportRunwaysTabHTMLElement);

class WT_G3x5_TSCAirportNOTAMTab extends WT_G3x5_TSCTabContent {
    constructor() {
        super(WT_G3x5_TSCAirportNOTAMTab.TITLE);

        this._htmlElement = this._createHTMLElement();
    }

    _createHTMLElement() {
        return document.createElement("div");
    }

    /**
     * @readonly
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }
}
WT_G3x5_TSCAirportNOTAMTab.TITLE = "Chart NOTAMs";

class WT_G3x5_TSCAirportProcedureTab extends WT_G3x5_TSCTabContent {
    constructor() {
        super(WT_G3x5_TSCAirportProcedureTab.TITLE);

        this._htmlElement = this._createHTMLElement();
    }

    _createHTMLElement() {
        return document.createElement("div");
    }

    /**
     * @readonly
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }
}
WT_G3x5_TSCAirportProcedureTab.TITLE = "Proc";