class WT_G3x5_TSCFlightPlan extends WT_G3x5_TSCPageElement {
    /**
     * @param {String} homePageGroup
     * @param {String} homePageName
     */
    constructor(homePageGroup, homePageName) {
        super(homePageGroup, homePageName);
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCFlightPlanHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCFlightPlanHTMLElement();
    }

    _initHTMLElement() {
        this._setDisplayedFlightPlan(this._fpm.activePlan);
    }

    init(root) {
        this._fpm = this.instrument.flightPlanManagerWT;
        this.container.title = WT_G3x5_TSCFlightPlan.TITLE;
        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
        this._initHTMLElement();
    }

    _setDisplayedFlightPlan(flightPlan) {
        this.htmlElement.setFlightPlan(flightPlan);
    }
}
WT_G3x5_TSCFlightPlan.TITLE = "Active Flight Plan";

class WT_G3x5_TSCFlightPlanHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_FlightPlan}
         */
        this._flightPlan = null;
        this._isInit = false;

        this._flightPlanListener = this._onFlightPlanChanged.bind(this);
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanHTMLElement.TEMPLATE;
    }

    async _defineChildren() {
        this._nameTitle = this.shadowRoot.querySelector(`#nametitle`);

        [
            this._rows,
            this._banner
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#rows`, WT_TSCScrollList),
            WT_CustomElementSelector.select(this.shadowRoot, `#banner`, WT_TSCSlidingBanner)
        ]);

        this._rowsContainer = this.shadowRoot.querySelector(`#rowscontainer`);
    }

    _initRowRecycler() {
        this._rowRecycler = new WT_CustomHTMLElementRecycler(this._rowsContainer, WT_G3x5_TSCFlightPlanRowHTMLElement);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initRowRecycler();
        this._isInit = true;
        if (this._flightPlan) {
            this._updateFromFlightPlan();
        }
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _cleanUpFlightPlanListener() {
        this._flightPlan.removeListener(this._flightPlanListener);
    }

    _cleanUpHeader() {
        this._nameTitle.textContent = "______/______";
    }

    _cleanUpRows() {
        this._rowRecycler.recycleAll();
    }

    _cleanUpFlightPlan() {
        if (!this._flightPlan) {
            return;
        }

        this._cleanUpFlightPlanListener();
        this._cleanUpHeader();
        this._cleanUpRows();
    }

    _initFlightPlanRenderer() {
        this._flightPlanRenderer = new WT_G3x5_TSCFlightPlanRenderer(this._flightPlan);
    }

    _initFlightPlanListener() {
        this._flightPlan.addListener(this._flightPlanListener);
    }

    _updateFromFlightPlan() {
        if (!this._flightPlan) {
            return;
        }

        this._initFlightPlanRenderer();
        this._initFlightPlanListener();
        this._drawFlightPlan();
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     */
    setFlightPlan(flightPlan) {
        if (flightPlan === this._flightPlan) {
            return;
        }

        this._cleanUpFlightPlan();
        this._flightPlan = flightPlan;
        if (this._isInit) {
            this._updateFromFlightPlan();
        }
    }

    requestRow() {
        if (this._isInit) {
            return this._rowRecycler.request();
        } else {
            return null;
        }
    }

    _drawName() {
        let originWaypoint = this._flightPlan.getOrigin().waypoint;
        let destinationWaypoint = this._flightPlan.getDestination().waypoint;
        this._nameTitle.textContent = `${originWaypoint ? originWaypoint.ident : "______"}/${destinationWaypoint ? destinationWaypoint.ident : "______"}`;
    }

    _drawRows() {
        this._flightPlanRenderer.draw(this);
    }

    _drawFlightPlan() {
        this._drawName();
        this._drawRows();
    }

    _redrawFlightPlan() {
        this._cleanUpRows();
        this._drawFlightPlan();
    }

    _onFlightPlanChanged(event) {
        if (event.types !== WT_FlightPlanEvent.Type.LEG_ALTITUDE_CHANGED) {
            this._redrawFlightPlan();
        } else {
        }
    }
}
WT_G3x5_TSCFlightPlanHTMLElement.NAME = "wt-tsc-flightplan";
WT_G3x5_TSCFlightPlanHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
        }

        #grid {
            position: absolute;
            left: 0%;
            top: 0%;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: var(--flightplan-left-width, 4em) 1fr;
            grid-gap: 0 var(--flightplan-left-margin-right, 0.2em);
        }
            #left {
                position: relative;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-rows: repeat(5, 1fr);
                grid-template-columns: 100%;
                grid-gap: var(--flightplan-left-button-margin-vertical, 0.2em) 0;
            }
            #tablecontainer {
                position: relative;
                border-radius: 3px;
                background: linear-gradient(#1f3445, black 25px);
                border: 3px solid var(--wt-g3x5-bordergray);
            }
                #table {
                    position: absolute;
                    left: var(--flightplan-table-padding-left, 0.1em);
                    top: var(--flightplan-table-padding-top, 0.1em);
                    width: calc(100% - var(--flightplan-table-padding-left, 0.1em) - var(--databasestatus-table-padding-right, 0.1em));
                    height: calc(100% - var(--flightplan-table-padding-top, 0.1em) - var(--databasestatus-table-padding-bottom, 0.1em));
                    display: grid;
                    grid-template-columns: 100%;
                    grid-template-rows: var(--flightplan-table-head-height, 1em) 1fr;
                    grid-gap: var(--flightplan-table-head-margin-bottom, 0.1em) 0;
                }
                    #header {
                        position: relative;
                        width: calc(100% - var(--scrolllist-scrollbar-width, 1vw) - var(--flightplan-table-row-margin-right, 0.2em));
                        height: 100%;
                        display: grid;
                        grid-template-rows: 100%;
                        grid-template-columns: var(--flightplan-table-grid-columns, 2fr 1fr 1fr);
                        grid-gap: 0 var(--flightplan-table-grid-column-gap, 0.2em);
                        align-items: center;
                        justify-items: center;
                        font-size: var(--flightplan-table-header-font-size, 0.85em);
                        color: white;
                    }
                        #nametitle {
                            justify-self: start;
                            margin: 0 0.2em;
                        }
                    #rows {
                        position: relative;
                        width: 100%;
                        height: 100%;
                        --scrolllist-padding-left: 0%;
                        --scrolllist-padding-right: var(--flightplan-table-row-margin-right, 0.2em);
                        --scrolllist-padding-top: 0%;
                    }
                        #rowscontainer {
                            position: relative;
                            width: 100%;
                            height: 100%;
                            display: flex;
                            flex-flow: column nowrap;
                            align-items: stretch;
                        }
                            wt-tsc-flightplan-row {
                                height: var(--flightplan-table-row-height, 3em);
                                margin-bottom: var(--flightplan-table-row-margin-vertical, 0.1em);
                            }
    </style>
    <div id="wrapper">
        <div id="grid">
            <div id="left"></div>
            <div id="tablecontainer">
                <div id="table">
                    <div id="header">
                        <div id="nametitle">______/______</div>
                        <div id="alttitle">ALT</div>
                        <div id="dtkdistitle">DTK/DIS</div>
                    </div>
                    <wt-tsc-scrolllist id="rows">
                        <div id="rowscontainer" slot="content"></div>
                    </wt-tsc-scrolllist>
                </div>
            </div>
        </div>
        <wt-tsc-slidingbanner id="banner">
        </wt-tsc-slidingbanner>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanHTMLElement.NAME, WT_G3x5_TSCFlightPlanHTMLElement);

class WT_G3x5_TSCFlightPlanRowHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._mode = WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.NONE;
        this._isInit = false;

        this._initChildren();
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanRowHTMLElement.TEMPLATE;
    }

    _initLeg() {
        let leg = new WT_G3x5_TSCFlightPlanRowLegHTMLElement();
        leg.id = WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG];
        leg.classList.add("mode");
        this._modeHTMLElements.push(leg);
    }

    _initHeader() {
        let header = new WT_G3x5_TSCFlightPlanRowHeaderHTMLElement();
        header.id = WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER];
        header.classList.add("mode");
        this._modeHTMLElements.push(header);
    }

    _initEnrouteFooter() {
        let enrouteFooter = new WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement();
        enrouteFooter.id = WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.ENROUTE_FOOTER];
        enrouteFooter.classList.add("mode");
        this._modeHTMLElements.push(enrouteFooter);
    }

    _initChildren() {
        this._modeHTMLElements = [null];
        this._initLeg();
        this._initHeader();
        this._initEnrouteFooter();
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement.Mode} mode
     * @return {HTMLElement}
     */
    getModeHTMLElement(mode) {
        return this._modeHTMLElements[mode];
    }

    /**
     *
     * @return {HTMLElement}
     */
    getActiveModeHTMLElement() {
        return this._modeHTMLElements[this._mode];
    }

    _appendChildren() {
        this._modeHTMLElements.forEach(element => {
            if (element) {
                this.shadowRoot.appendChild(element);
            }
        });
    }

    async _connectedCallbackHelper() {
        this._appendChildren();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement.Mode} mode
     */
    setMode(mode) {
        if (this._mode !== mode) {
            this.setAttribute("mode", WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[mode]);
            this._mode = mode;
        }
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCFlightPlanRowHTMLElement.Mode = {
    NONE: 0,
    LEG: 1,
    HEADER: 2,
    ENROUTE_FOOTER: 3
}
WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS = [
    "",
    "leg",
    "header",
    "enroutefooter"
];
WT_G3x5_TSCFlightPlanRowHTMLElement.NAME = "wt-tsc-flightplan-row";
WT_G3x5_TSCFlightPlanRowHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanRowHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
        }

        .mode {
            display: none;
        }

        :host([mode=${WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG]}]) #leg {
            display: block;
        }
        :host([mode=${WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER]}]) #header {
            display: block;
        }
        :host([mode=${WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.ENROUTE_FOOTER]}]) #enroutefooter {
            display: block;
        }
    </style>
`;

customElements.define(WT_G3x5_TSCFlightPlanRowHTMLElement.NAME, WT_G3x5_TSCFlightPlanRowHTMLElement);

class WT_G3x5_TSCFlightPlanRowLegHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._initFormatters();

        this._waypoint = null;
        this._dtk = new WT_NavAngleUnit(true).createNumber(0);
        this._distance = WT_Unit.NMILE.createNumber(0);
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanRowLegHTMLElement.TEMPLATE;
    }

    _initDTKFormatter() {
        this._dtkFormatter = new WT_NumberFormatter({
            precision: 1,
            unitSpaceBefore: false
        });
    }

    _initDistanceFormatter() {
        let formatterOpts = {
            precision: 0.1,
            maxDigits: 3,
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                _numberClassList: [],
                _unitClassList: [WT_G3x5_TSCFlightPlanRowLegHTMLElement.UNIT_CLASS],
                getNumberClassList() {
                    return this._numberClassList;
                },
                getUnitClassList() {
                    return this._unitClassList;
                }
            }
        };
        this._distanceFormatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);
    }

    _initFormatters() {
        this._initDistanceFormatter();
        this._initDTKFormatter();
    }

    async _defineChildren() {
        this._dtkDisplay = this.shadowRoot.querySelector(`#dtk`);
        this._distanceDisplay = this.shadowRoot.querySelector(`#dis`);
        [
            this._waypointButton,
            this._altitudeButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#waypoint`, WT_G3x5_TSCWaypointButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#alt`, WT_TSCLabeledButton)
        ]);
    }

    _initChildren() {
        this._waypointButton.setIconSrcFactory(new WT_G3x5_TSCWaypointButtonIconSrcFactory(WT_G3x5_TSCFlightPlanRowLegHTMLElement.WAYPOINT_ICON_IMAGE_DIRECTORY));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initChildren();
        this._isInit = true;
        this._updateFromWaypoint();
        this._updateFromDTK();
        this._updateFromDistance();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateFromWaypoint() {
        this._waypointButton.setWaypoint(this._waypoint);
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    setWaypoint(waypoint) {
        if ((!this._waypoint && !waypoint) || (this._waypoint && this._waypoint.equals(waypoint))) {
            return;
        }

        this._waypoint = waypoint;
        if (this._isInit) {
            this._updateFromWaypoint();
        }
    }

    _updateFromDTK() {
        this._dtkDisplay.textContent = `${this._dtk.isNaN() ? "___" : this._dtkFormatter.getFormattedNumber(this._dtk)}${this._dtkFormatter.getFormattedUnit(this._dtk)}`;
    }

    /**
     *
     * @param {WT_NumberUnit} distance
     */
    setDTK(dtk) {
        this._dtk.unit.setLocation(dtk.unit.location);
        this._dtk.set(dtk);
        if (this._isInit) {
            this._updateFromDTK();
        }
    }

    _updateFromDistance() {
        this._distanceDisplay.innerHTML = this._distanceFormatter.getFormattedHTML(this._distance, WT_Unit.NMILE);
    }

    /**
     *
     * @param {WT_NumberUnit} distance
     */
    setDistance(distance) {
        this._distance.set(distance);
        if (this._isInit) {
            this._updateFromDistance();
        }
    }
}
WT_G3x5_TSCFlightPlanRowLegHTMLElement.WAYPOINT_ICON_IMAGE_DIRECTORY = "/WTg3000/SDK/Assets/Images/Garmin/TSC/Waypoints";
WT_G3x5_TSCFlightPlanRowLegHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_TSCFlightPlanRowLegHTMLElement.NAME = "wt-tsc-flightplan-row-leg";
WT_G3x5_TSCFlightPlanRowLegHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanRowLegHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: var(--flightplan-table-grid-columns, 2fr 1fr 1fr);
            grid-gap: 0 var(--flightplan-table-grid-column-gap, 0.2em);
        }
            #waypoint {
                font-size: var(--flightplan-table-row-waypointbutton-font-size, 0.85em);
            }
            #dtkdis {
                position: relative;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-columns: 100%;
                grid-template-rows: 50% 50%;
                justify-items: end;
                align-items: center;
            }

        .${WT_G3x5_TSCFlightPlanRowLegHTMLElement.UNIT_CLASS} {
            font-size: var(--flightplan-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <wt-tsc-button-waypoint id="waypoint"></wt-tsc-button-waypoint>
        <wt-tsc-button-label id="alt"></wt-tsc-button-label>
        <div id="dtkdis">
            <div id="dtk"></div>
            <div id="dis"></div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanRowLegHTMLElement.NAME, WT_G3x5_TSCFlightPlanRowLegHTMLElement);

class WT_G3x5_TSCFlightPlanRowHeaderHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._headerText = "";
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.TEMPLATE;
    }

    async _defineChildren() {
        this._headerButton = await WT_CustomElementSelector.select(this.shadowRoot, `#header`, WT_TSCLabeledButton);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        this._updateFromHeaderText();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateFromHeaderText() {
        this._headerButton.labelText = this._headerText;
    }

    setHeaderText(text) {
        if (this._headerText === text) {
            return;
        }

        this._headerText = text;
        if (this._isInit) {
            this._updateFromHeaderText();
        }
    }
}
WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.NAME = "wt-tsc-flightplan-row-header";
WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: var(--flightplan-table-grid-columns, 2fr 1fr 1fr);
            grid-gap: 0 var(--flightplan-table-grid-column-gap, 0.2em);
        }
            #header {
                grid-column: 1 / span 3;
            }
    </style>
    <div id="wrapper">
        <wt-tsc-button-label id="header"></wt-tsc-button-label>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.NAME, WT_G3x5_TSCFlightPlanRowHeaderHTMLElement);

class WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.TEMPLATE;
    }

    async _defineChildren() {
        [
            this._enrouteFooterAddButton,
            this._enrouteFooterDoneButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#enroutefooteradd`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#enroutefooterdone`, WT_TSCLabeledButton)
        ]);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }
}
WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.NAME = "wt-tsc-flightplan-row-enroutefooter";
WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: var(--flightplan-table-grid-columns, 2fr 1fr 1fr);
            grid-gap: 0 var(--flightplan-table-grid-column-gap, 0.2em);
        }
            #enroutefooter {
                color: white;
            }
                #enroutefooteradd {
                    grid-column: 1 / span 2;
                }
    </style>
    <div id="wrapper">
        <wt-tsc-button-label id="enroutefooteradd" labeltext="Add Enroute Waypoint"></wt-tsc-button-label>
        <wt-tsc-button-label id="enroutefooterdone" labeltext="Done"></wt-tsc-button-label>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.NAME, WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement);

class WT_G3x5_TSCFlightPlanRenderer {
    /**
     * @param {WT_FlightPlan} flightPlan
     */
    constructor(flightPlan) {
        this._flightPlan = flightPlan;

        this._origin = new WT_G3x5_TSCFlightPlanOriginRenderer(flightPlan.getOrigin());
        this._enroute = new WT_G3x5_TSCFlightPlanEnrouteRenderer(flightPlan.getEnroute());
        this._destination = new WT_G3x5_TSCFlightPlanDestinationRenderer(flightPlan.getDestination());

        this._departure = null;
        this._arrival = null;
        this._approach = null;
    }

    /**
     * @readonly
     * @type {WT_FlightPlan}
     */
    get flightPlan() {
        return this._flightPlan;
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    draw(htmlElement) {
        this._origin.draw(htmlElement);
        if (this.flightPlan.hasDeparture()) {
            this._departure = new WT_G3x5_TSCFlightPlanDepartureRenderer(this.flightPlan.getDeparture());
            this._departure.draw(htmlElement);
        }
        this._enroute.draw(htmlElement);
        if (this.flightPlan.hasArrival()) {
            this._arrival = new WT_G3x5_TSCFlightPlanArrivalRenderer(this.flightPlan.getArrival());
            this._arrival.draw(htmlElement);
        }
        this._destination.draw(htmlElement);
        if (this.flightPlan.hasApproach()) {
            this._approach = new WT_G3x5_TSCFlightPlanApproachRenderer(this.flightPlan.getApproach());
            this._approach.draw(htmlElement);
        }
    }
}

/**
 * @template {WT_FlightPlanElement} T
 */
class WT_G3x5_TSCFlightPlanElementRenderer {
    /**
     * @param {T} element
     */
    constructor(element) {
        this._element = element;
    }

    /**
     * @readonly
     * @type {T}
     */
    get element() {
        return this._element;
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    draw(pageElement) {
    }
}

/**
 * @template {WT_FlightPlanSequence} T
 * @extends WT_G3x5_TSCFlightPlanElementRenderer<T>
 */
class WT_G3x5_TSCFlightPlanSequenceRenderer extends WT_G3x5_TSCFlightPlanElementRenderer {
    /**
     * @param {T} sequence
     */
    constructor(sequence) {
        super(sequence);

        /**
         * @type {WT_G3x5_TSCFlightPlanElementRenderer[]}
         */
        this._children = [];
    }

    _initChildren() {
        this._children = this.element.elements.map(element => WT_G3x5_TSCFlightPlanElementRendererFactory.create(element));
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        this._header = htmlElement.requestRow();
        this._header.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER);
        this._headerModeHTMLElement = this._header.getActiveModeHTMLElement();
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawChildren(htmlElement) {
        this._children.forEach(child => child.draw(htmlElement));
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    draw(htmlElement) {
        this._initChildren();
        this._drawHeader(htmlElement);
        this._drawChildren(htmlElement);
    }
}

/**
 * @template {WT_FlightPlanSegment} T
 * @extends WT_G3x5_TSCFlightPlanSequenceRenderer<T>
 */
class WT_G3x5_TSCFlightPlanSegmentRenderer extends WT_G3x5_TSCFlightPlanSequenceRenderer {
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanOrigin>
 */
class WT_G3x5_TSCFlightPlanOriginRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        super._drawHeader(htmlElement);

        if (this.element.waypoint) {
            this._headerModeHTMLElement.setHeaderText(`Origin – ${this.element.waypoint.ident}`);
        } else {
            this._headerModeHTMLElement.setHeaderText("Add Origin");
        }
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanDestination>
 */
class WT_G3x5_TSCFlightPlanDestinationRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        super._drawHeader(htmlElement);

        if (this.element.waypoint) {
            this._headerModeHTMLElement.setHeaderText(`Destination – ${this.element.waypoint.ident}`);
        } else {
            this._headerModeHTMLElement.setHeaderText("Add Destination");
        }
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanDeparture>
 */
class WT_G3x5_TSCFlightPlanDepartureRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        super._drawHeader(htmlElement);

        let departure = this.element.procedure;
        let rwyTransition = departure.runwayTransitions.getByIndex(this.element.runwayTransitionIndex);
        let enrouteTransition = departure.enrouteTransitions.getByIndex(this.element.enrouteTransitionIndex);
        let prefix = `RW${rwyTransition ? rwyTransition.runway.designationFull : "ALL"}.`;
        let suffix = enrouteTransition ? `.${this.element.legs.get(this.element.legs.length - 1).fix.ident}` : "";
        this._headerModeHTMLElement.setHeaderText(`Departure –<br>${departure.airport.ident}–${prefix}${departure.name}${suffix}`);
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanEnroute>
 */
class WT_G3x5_TSCFlightPlanEnrouteRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    /**
     * @param {WT_FlightPlanEnroute} sequence
     */
    constructor(sequence) {
        super(sequence);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        if (this.element.length > 0) {
            super._drawHeader(htmlElement);
            this._headerModeHTMLElement.setHeaderText("Enroute");
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawFooter(htmlElement) {
        this._footer = htmlElement.requestRow();
        this._footer.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.ENROUTE_FOOTER);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    draw(htmlElement) {
        super.draw(htmlElement);

        this._drawFooter(htmlElement);
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanArrival>
 */
class WT_G3x5_TSCFlightPlanArrivalRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        super._drawHeader(htmlElement);

        let arrival = this.element.procedure;
        let enrouteTransition = arrival.enrouteTransitions.getByIndex(this.element.enrouteTransitionIndex);
        let rwyTransition = arrival.runwayTransitions.getByIndex(this.element.runwayTransitionIndex);
        let prefix = enrouteTransition ? `${this.element.legs.get(0).fix.ident}.` : "";
        let suffix = `.RW${rwyTransition ? rwyTransition.runway.designationFull : "ALL"}`;
        this._headerModeHTMLElement.setHeaderText(`Arrival –<br>${arrival.airport.ident}–${prefix}${arrival.name}${suffix}`);
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanApproach>
 */
class WT_G3x5_TSCFlightPlanApproachRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        super._drawHeader(htmlElement);

        let approach = this.element.procedure;
        this._headerModeHTMLElement.setHeaderText(`Approach –<br>${approach.airport.ident}–${approach.name}`);
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanElementRenderer<WT_FlightPlanLeg>
 */
class WT_G3x5_TSCFlightPlanLegRenderer extends WT_G3x5_TSCFlightPlanElementRenderer {
    /**
     * @param {WT_FlightPlanLeg} leg
     */
    constructor(leg) {
        super(leg);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    draw(htmlElement) {
        this._row = htmlElement.requestRow();
        this._row.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG);

        let modeHTMLElement = this._row.getActiveModeHTMLElement();
        modeHTMLElement.setWaypoint(this.element.fix);
        modeHTMLElement.setDTK(this.element.desiredTrack);
        modeHTMLElement.setDistance(this.element.distance);
    }
}

class WT_G3x5_TSCFlightPlanElementRendererFactory {
    static create(element) {
        if (element instanceof WT_FlightPlanSequence) {
            return new WT_G3x5_TSCFlightPlanSequenceRenderer(element);
        } else if (element instanceof WT_FlightPlanLeg) {
            return new WT_G3x5_TSCFlightPlanLegRenderer(element);
        }
        return null;
    }
}