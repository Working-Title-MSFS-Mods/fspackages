class WT_G3x5_TSCAirportInfo extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName, mfdPaneDisplaySetting, mfdPaneWaypointSetting, icaoWaypointFactory) {
        super(homePageGroup, homePageName);

        this._mfdPaneDisplaySetting = mfdPaneDisplaySetting;
        this._mfdPaneWaypointSetting = mfdPaneWaypointSetting;
        this._icaoWaypointFactory = icaoWaypointFactory;

        this._mfdPaneDisplayLastMode = -1;
        this._lastAirport = null;
    }

    _initSelectButton() {
        this._airportInfo.selectButton.addButtonListener(this._onSelectButtonPressed.bind(this));
    }

    init(root) {
        this.container.title = "Airport Info";

        /**
         * @type {WT_G3x5_TSCAirportInfoHTMLElement}
         */
        this._airportInfo = root.querySelector(`tsc-airportinfo`);

        this._initSelectButton();
    }

    async _onKeyboardClosed(icao) {
        if (icao) {
            try {
                let airport = await this._icaoWaypointFactory.getAirport(icao);
                this._airportInfo.setAirport(airport);
                return;
            } catch (e) {}
        }
        this._airportInfo.setAirport(null);
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

    onEnter() {
        super.onEnter();

        this._mfdPaneDisplayLastMode = this._mfdPaneDisplaySetting.getValue();
        this._mfdPaneDisplaySetting.setValue(WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_INFO);
    }

    _updateTitle() {
        let airport = this._airportInfo.getAirport();
        let activeTab = this._airportInfo.mainTabView.getActiveTab();
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
        if (airport) {
            title += ` – ${airport.ident}`;
        }
        this.container.title = title;
    }

    _updateMFDPaneWaypoint() {
        let airport = this._airportInfo.getAirport();
        if (airport === this._lastAirport) {
            return;
        }

        this._mfdPaneWaypointSetting.setValue(airport ? airport.icao : "");
        this._lastAirport = airport;
    }

    onUpdate(deltaTime) {
        this._airportInfo.update();
        this._updateTitle();
        this._updateMFDPaneWaypoint();
    }

    onExit() {
        if (this._mfdPaneDisplaySetting.getValue() === WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_INFO) {
            this._mfdPaneDisplaySetting.setValue(this._mfdPaneDisplayLastMode);
        }

        this.instrument.deactivateNavButton(5);
        this.instrument.deactivateNavButton(6);
        super.onExit();
    }
}

class WT_G3x5_TSCAirportInfoPopUp extends WT_G3x5_TSCPopUpElement {
    init(root) {
        this._airportInfo = root.querySelector(`tsc-airportinfo`);
    }
}

class WT_G3x5_TSCAirportInfoHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCAirportInfoHTMLElement.TEMPLATE.content.cloneNode(true));

        this._initChildren();

        this._airport = null;

        this._isInit = false;
    }

    _initChildren() {
        this._header = document.createElement("div");
        this._header.classList.add(WT_G3x5_TSCAirportInfoHTMLElement.HEADER_CLASS);

        this._selectButton = new WT_TSCWaypointButton();
        this._selectButton.classList.add(WT_G3x5_TSCAirportInfoHTMLElement.SELECT_BUTTON_CLASS);
        this._selectButton.emptyText = "Select Airport";
        this._header.appendChild(this._selectButton);

        this._optionsButton = new WT_TSCLabeledButton();
        this._optionsButton.classList.add(WT_G3x5_TSCAirportInfoHTMLElement.OPTIONS_BUTTON_CLASS);
        this._optionsButton.labelText = "Waypoint<br>Options";
        this._header.appendChild(this._optionsButton);

        this._main = new WT_G3x5_TSCTabbedView();
        this._main.classList.add(WT_G3x5_TSCAirportInfoHTMLElement.MAIN_VIEW_CLASS);
    }

    get selectButton() {
        return this._selectButton;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCTabbedView} mainTabView
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
        this._infoTab = new WT_G3x5_TSCAirportInfoTab();
        this._main.addTab(this._infoTab);

        this._freqTab = new WT_G3x5_TSCAirportFreqTab();
        this._main.addTab(this._freqTab, WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);

        this._weatherTab = new WT_G3x5_TSCAirportWeatherTab();
        this._main.addTab(this._weatherTab, WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);

        this._aptdirTab = new WT_G3x5_TSCAirportAPTDIRTab();
        this._main.addTab(this._aptdirTab, WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);

        this._chartsTab = new WT_G3x5_TSCAirportChartsTab();
        this._main.addTab(this._chartsTab, WT_G3x5_TSCTabbedView.TabButtonPosition.RIGHT, false);

        this._runwaysTab = new WT_G3x5_TSCAirportRunwayTab();
        this._main.addTab(this._runwaysTab, WT_G3x5_TSCTabbedView.TabButtonPosition.RIGHT);

        this._notamTab = new WT_G3x5_TSCAirportNOTAMTab();
        this._main.addTab(this._notamTab, WT_G3x5_TSCTabbedView.TabButtonPosition.RIGHT, false);

        this._procTab = new WT_G3x5_TSCAirportProcedureTab();
        this._main.addTab(this._procTab, WT_G3x5_TSCTabbedView.TabButtonPosition.RIGHT, false);

        this._updateAirport();

        this._main.setActiveTab(this._infoTab);
    }

    _updateAirport() {
        this._selectButton.setWaypoint(this._airport);
        this._infoTab.setAirport(this._airport);
        this._runwaysTab.setAirport(this._airport);
    }

    connectedCallback() {
        this._appendChildren();
        this._initTabs();
        this._updateAirport();
        this._isInit = true;
    }

    getAirport() {
        return this._airport;
    }

    setAirport(airport) {
        this._airport = airport;
        if (this._isInit) {
            this._updateAirport();
        }
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._main.getActiveTab().update();
    }
}
WT_G3x5_TSCAirportInfoHTMLElement.HEADER_CLASS = "airportInfoHeader";
WT_G3x5_TSCAirportInfoHTMLElement.SELECT_BUTTON_CLASS = "airportInfoSelectButton";
WT_G3x5_TSCAirportInfoHTMLElement.OPTIONS_BUTTON_CLASS = "airportInfoOptionsButton";
WT_G3x5_TSCAirportInfoHTMLElement.MAIN_VIEW_CLASS = "airportInfoMain";
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

customElements.define("tsc-airportinfo", WT_G3x5_TSCAirportInfoHTMLElement);

class WT_G3x5_TSCAirportInfoTab extends WT_G3x5_TSCTabContent {
    constructor() {
        super(WT_G3x5_TSCAirportInfoTab.TITLE);

        this._htmlElement = this._createHTMLElement();
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCAirportInfoTabHTMLElement();
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCAirportInfoTabHTMLElement} htmlElement
     * @type {WT_G3x5_TSCAirportInfoTabHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    setAirport(airport) {
        this.htmlElement.setAirport(airport);
    }

    update() {
        this.htmlElement.update();
    }
}
WT_G3x5_TSCAirportInfoTab.TITLE = "Info";

class WT_G3x5_TSCAirportInfoTabHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCAirportInfoTabHTMLElement.TEMPLATE.content.cloneNode(true));

        /**
         * @type {WT_Airport}
         */
        this._airport = null;

        let distanceFormatterOpts = {
            precision: 0.01,
            forceDecimalZeroes: false,
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
        this._distanceFormatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(distanceFormatterOpts), htmlFormatterOpts);

        this._coordinateFormatter = new WT_CoordinateFormatter();

        let elevationFormatterOpts = {
            precision: 1,
            unitCaps: true
        };
        this._elevationFormatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(elevationFormatterOpts), htmlFormatterOpts);

        this._tempGARad = new WT_NumberUnit(0, WT_Unit.GA_RADIAN);
        this._tempAngle = new WT_NumberUnit(0, WT_Unit.DEGREE);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    _defineChildren() {
        this._city = this.shadowRoot.querySelector(`#city`);
        this._region = this.shadowRoot.querySelector(`#region`);
        this._brgValue = this.shadowRoot.querySelector(`#brg .value`);
        this._brgArrow = this.shadowRoot.querySelector(`#brg .arrow`);
        this._disValue = this.shadowRoot.querySelector(`#dis .value`);
        this._latLong = this.shadowRoot.querySelector(`#latlong`);
        this._elevationValue = this.shadowRoot.querySelector(`#elevation .value`);
        this._privacyValue = this.shadowRoot.querySelector(`#privacy .value`);
    }

    connectedCallback() {
        this._defineChildren();
    }

    _updateCityRegion() {
        if (this._airport) {
            this._city.innerHTML = this._airport.city ? this._airport.city.toString() : "";
            this._region.innerHTML = this._airport.region ? this._airport.region : "";
        } else {
            this._city.innerHTML = "";
            this._region.innerHTML = "";
        }
    }

    _updateBearingDistance() {
        if (this._airport) {
            let ppos = WT_PlayerAirplane.INSTANCE.position(this._tempGeoPoint);
            let heading = WT_PlayerAirplane.INSTANCE.headingTrue();
            let bearing = ppos.bearingTo(this._airport.location);
            let magBearing = bearing - WT_PlayerAirplane.INSTANCE.magVar();
            this._brgValue.innerHTML = magBearing.toFixed(0) + "°";
            this._brgArrow.setBearing(bearing - heading);

            let distance = this._tempGARad.set(ppos.distance(this._airport.location));
            this._disValue.innerHTML = this._distanceFormatter.getFormattedHTML(distance, WT_Unit.NMILE);

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
            this._elevationValue.innerHTML = this._elevationFormatter.getFormattedHTML(this._airport.elevation, WT_Unit.FOOT);
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
    }

    update() {
        if (this._airport) {
            this._updateBearingDistance();
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
            font-size: 4vh;
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
            grid-template-columns: auto;
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
                    <tsc-bearingarrow class="arrow"></tsc-bearingarrow>
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

class WT_G3x5_TSCAirportFreqTab extends WT_G3x5_TSCTabContent {
    constructor() {
        super(WT_G3x5_TSCAirportFreqTab.TITLE);

        this._htmlElement = this._createHTMLElement();
    }

    _createHTMLElement() {
        return document.createElement("div");
    }

    /**
     * @readonly
     * @property {HTMLElement} htmlElement
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }
}
WT_G3x5_TSCAirportFreqTab.TITLE = "Freqs";

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
     * @property {HTMLElement} htmlElement
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
     * @property {HTMLElement} htmlElement
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
     * @property {HTMLElement} htmlElement
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }
}
WT_G3x5_TSCAirportChartsTab.TITLE = "Charts";

class WT_G3x5_TSCAirportRunwayTab extends WT_G3x5_TSCTabContent {
    constructor() {
        super(WT_G3x5_TSCAirportRunwayTab.TITLE);

        this._htmlElement = this._createHTMLElement();
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCAirportRunwaysTabHTMLElement();
    }

    /**
     * @readonly
     * @property {HTMLElement} htmlElement
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    setAirport(airport) {
        this.htmlElement.setAirport(airport);
    }

    update() {
    }
}
WT_G3x5_TSCAirportRunwayTab.TITLE = "Runways";

class WT_G3x5_TSCRunwayButton extends WT_TSCButton {
    constructor() {
        super();

        this._runway = null;

        let distanceFormatterOpts = {
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
        this._distanceFormatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(distanceFormatterOpts), htmlFormatterOpts);

        this._isInit = false;
    }

    _initWrapperStyle() {
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

    _initDesignationStyle() {
        return `
            #designation {
                font-size: 1.5em;
            }
        `;
    }

    _initSizeStyle() {
        return `
            .unit {
                font-size: 0.75em;
            }
        `;
    }

    _initSurfaceStyle() {
        return "";
    }

    _initLightingStyle() {
        return "";
    }

    _createStyle() {
        let style = super._createStyle();

        let designationStyle = this._initDesignationStyle();
        let sizeStyle = this._initSizeStyle();
        let surfaceStyle = this._initSurfaceStyle();
        let lightingStyle = this._initLightingStyle();

        return`
            ${style}
            ${designationStyle}
            ${sizeStyle}
            ${surfaceStyle}
            ${lightingStyle}
        `;
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
     * @property {WT_Runway} runway
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
        let lengthText = this._distanceFormatter.getFormattedHTML(runway.length, WT_Unit.FOOT);
        let widthText = this._distanceFormatter.getFormattedHTML(runway.width, WT_Unit.FOOT);
        this._size.innerHTML = `${lengthText} x ${widthText}`;
    }

    /**
     *
     * @param {WT_Runway} runway
     */
    _updateSurface(runway) {
        switch (runway.surface) {
            case WT_Runway.Surface.CONCRETE:
            case WT_Runway.Surface.ASPHALT:
            case WT_Runway.Surface.STEEL:
            case WT_Runway.Surface.TARMAC:
                this._surface.innerHTML = "Hard";
                break;
            case WT_Runway.Surface.GRASS:
            case WT_Runway.Surface.TURF:
                this._surface.innerHTML = "Turf";
                break;
            case WT_Runway.Surface.DIRT:
                this._surface.innerHTML = "Dirt";
                break;
            case WT_Runway.Surface.GRAVEL:
            case WT_Runway.Surface.MACADAM:
                this._surface.innerHTML = "Gravel";
                break;
            case WT_Runway.Surface.CORAL:
            case WT_Runway.Surface.SAND:
            case WT_Runway.Surface.SHALE:
            case WT_Runway.Surface.SNOW:
            case WT_Runway.Surface.ICE:
                this._surface.innerHTML = "Soft";
                break;
            case WT_Runway.Surface.WATER:
                this._surface.innerHTML = "Water";
                break;
            default:
                this._surface.innerHTML = "Unknown";
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
}
WT_G3x5_TSCRunwayButton.LIGHTING_TEXT = [
    "Unknown",
    "No Lights",
    "Part Time",
    "Full Time",
    "PCL"
];

customElements.define("tsc-button-runway", WT_G3x5_TSCRunwayButton);

class WT_G3x5_TSCAirportRunwaysTabHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCAirportRunwaysTabHTMLElement.TEMPLATE.content.cloneNode(true));

        /**
         * @type {WT_Airport}
         */
        this._airport = null;

        /**
         * @type {WT_G3x5_TSCRunwayButton[]}
         */
        this._buttons = [];
        this._buttonsHead = 0;
    }

    /**
     * @readonly
     * @property {WT_Airport} airport
     * @type {WT_Airport}
     */
    get airport() {
        return this._airport;
    }

    _clearButtons() {
        for (let i = 0; i < this._buttonsHead; i++) {
            this._buttons[i].style.display = "none";
        }
        this._buttonsHead = 0;
    }

    _requestButton() {
        let button;
        if (this._buttonsHead < this._buttons.length) {
            button = this._buttons[this._buttonsHead];
        } else {
            button = new WT_G3x5_TSCRunwayButton();
            button.classList.add(WT_G3x5_TSCAirportRunwaysTabHTMLElement.BUTTON_CLASS);
            button.slot = "buttons";
            this.appendChild(button);
            this._buttons.push(button);
        }
        this._buttonsHead++;
        button.style.display = "block";
        return button;
    }

    _updateRunways() {
        this._clearButtons();
        if (!this.airport) {
            return;
        }

        let added = [];
        for (let runway of this.airport.runways) {
            let existing = added.find(compare => compare.pairDesignation === runway.pairDesignation);
            if (!existing) {
                let button = this._requestButton();
                button.setRunway(runway);
                added.push(runway);
            }
        }
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
            font-size: 4vh;
            color: white;
            text-align: center;
        }

        #wrapper {
            position: absolute;
            left: 2%;
            width: 96%;
            top: 2%;
            height: 96%;
            background-color: black;
            overflow-x: hidden;
            overflow-y: scroll;

        }
            #wrapper::-webkit-scrollbar {
                width: 1vw;
            }
            #wrapper::-webkit-scrollbar-track {
                background: none;
            }
            #wrapper::-webkit-scrollbar-thumb {
                background: white;
            }

            #buttons {
                position: relative;
                width: 100%;
                display: flex;
                flex-flow: column nowrap;
                align-items: center;
            }

    </style>
    <div id="wrapper">
        <slot name="buttons" id="buttons"></slot>
    </div>
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
     * @property {HTMLElement} htmlElement
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
     * @property {HTMLElement} htmlElement
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }
}
WT_G3x5_TSCAirportProcedureTab.TITLE = "Proc";