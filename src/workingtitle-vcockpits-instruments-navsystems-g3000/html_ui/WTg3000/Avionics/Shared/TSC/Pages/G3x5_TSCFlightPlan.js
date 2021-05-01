class WT_G3x5_TSCFlightPlan extends WT_G3x5_TSCPageElement {
    /**
     * @param {String} homePageGroup
     * @param {String} homePageName
     */
    constructor(homePageGroup, homePageName) {
        super(homePageGroup, homePageName);

        /**
         * @type {WT_G3x5_TSCFlightPlanState}
         */
        this._state = {
            _unitsModel: null,
            _airplaneHeadingTrue: 0,
            _activeLeg: null,

            get unitsModel() {
                return this._unitsModel;
            },

            get airplaneHeadingTrue() {
                return this._airplaneHeadingTrue;
            },

            get activeLeg() {
                return this._activeLeg;
            }
        };
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
        this._state._unitsModel = new WT_G3x5_TSCFlightPlanUnitsModel(this.instrument.unitsSettingModel);

        this.container.title = WT_G3x5_TSCFlightPlan.TITLE;
        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
        this._initHTMLElement();
    }

    _setDisplayedFlightPlan(flightPlan) {
        this.htmlElement.setFlightPlan(flightPlan);
    }

    _updateState() {
        this._state._airplaneHeadingTrue = this.instrument.airplane.navigation.headingTrue();
        this._state._activeLeg = this.instrument.flightPlanManagerWT.getActiveLeg(true);
    }

    onUpdate(deltaTime) {
        this._updateState();
        this.htmlElement.update(this._state);
    }
}
WT_G3x5_TSCFlightPlan.TITLE = "Active Flight Plan";

/**
 * @typedef WT_G3x5_TSCFlightPlanState
 * @property {readonly WT_G3x5_TSCFlightPlanUnitsModel} unitsModel
 * @property {readonly Number} airplaneHeadingTrue
 * @property {readonly WT_FlightPlanLeg} activeLeg
 */

class WT_G3x5_TSCFlightPlanUnitsModel extends WT_G3x5_UnitsSettingModelAdapter {
    /**
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     */
    constructor(unitsSettingModel) {
        super(unitsSettingModel);

        this._initListeners();
        this._initModel();
    }

    /**
     * @readonly
     * @type {WT_NavAngleUnit}
     */
    get bearingUnit() {
        return this._bearingUnit;
    }

    /**
     * @readonly
     * @type {WT_Unit}
     */
    get distanceUnit() {
        return this._distanceUnit;
    }

    _updateBearing() {
        this._bearingUnit = this.unitsSettingModel.navAngleSetting.getNavAngleUnit();
    }

    _updateDistance() {
        this._distanceUnit = this.unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
    }
}

class WT_G3x5_TSCFlightPlanHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._flightPlanListener = this._onFlightPlanChanged.bind(this);

        /**
         * @type {WT_FlightPlan}
         */
        this._flightPlan = null;
        this._activeArrowShow = null;
        this._activeArrowFrom = 0;
        this._activeArrowTo = 0;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanHTMLElement.TEMPLATE;
    }

    async _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));

        this._nameTitle = this.shadowRoot.querySelector(`#nametitle`);

        [
            this._rows,
            this._banner
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#rows`, WT_TSCScrollList),
            WT_CustomElementSelector.select(this.shadowRoot, `#banner`, WT_TSCSlidingBanner)
        ]);

        this._rowsContainer = this.shadowRoot.querySelector(`#rowscontainer`);
        this._activeArrowStemRect = this.shadowRoot.querySelector(`#activearrowstem rect`);
        this._activeArrowHead = this.shadowRoot.querySelector(`#activearrowhead`);
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
        this._updateFromActiveArrowShow();
        this._updateFromActiveArrowPosition();
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

    _updateFromActiveArrowShow() {
        this._wrapper.setAttribute("activearrow-show", `${this._activeArrowShow}`);
    }

    setActiveArrowVisible(value) {
        this._activeArrowShow = value;
        if (this._isInit) {
            this._updateFromActiveArrowShow();
        }
    }

    _updateFromActiveArrowPosition() {
        let top = Math.min(this._activeArrowFrom, this._activeArrowTo);
        let height = Math.abs(this._activeArrowTo - this._activeArrowFrom);

        this._activeArrowStemRect.setAttribute("y", `${top}`);
        this._activeArrowStemRect.setAttribute("height", `${height}`);
        this._activeArrowHead.style.transform = `translateY(${this._activeArrowTo}px) rotateX(0deg)`;
    }

    moveActiveArrow(from, to) {
        this._activeArrowFrom = from;
        this._activeArrowTo = to;
        if (this._isInit) {
            this._updateFromActiveArrowPosition();
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

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(state) {
        if (!this._isInit || !this._flightPlan) {
            return;
        }

        this._flightPlanRenderer.update(this, state);
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

        #wrapper {
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
                            #scrollcontainer {
                                position: relative;
                                width: 100%;
                            }
                            #rowscontainer {
                                position: relative;
                                width: 100%;
                                display: flex;
                                flex-flow: column nowrap;
                                align-items: stretch;
                            }
                                wt-tsc-flightplan-row {
                                    height: var(--flightplan-table-row-height, 3em);
                                    margin-bottom: var(--flightplan-table-row-margin-vertical, 0.1em);
                                }
                            .activeArrow {
                                display: none;
                            }
                            #wrapper[activearrow-show="true"] .activeArrow {
                                display: block;
                            }
                            #activearrowstem {
                                position: absolute;
                                left: var(--flightplan-table-arrow-left, 0.2em);
                                top: 0%;
                                width: calc(100% - var(--flightplan-table-arrow-right, calc(100% - 1.2em)) - var(--flightplan-table-arrow-left, 0.2em) - var(--flightplan-table-arrow-head-size, 0.5em) / 2);
                                height: 100%;
                                transform: rotateX(0deg);
                            }
                                #activearrowstem rect {
                                    stroke-width: var(--flightplan-table-arrow-stroke-width, 0.2em);
                                    stroke: var(--wt-g3x5-purple);
                                    fill: transparent;
                                    transform: translate(calc(var(--flightplan-table-arrow-stroke-width, 0.2em) / 2), 0);
                                }
                            #activearrowhead {
                                position: absolute;
                                right: var(--flightplan-table-arrow-right, calc(100% - 1.2em));
                                top: calc(-1 * var(--flightplan-table-arrow-head-size, 0.5em) / 2);
                                width: var(--flightplan-table-arrow-head-size, 0.5em);
                                height: var(--flightplan-table-arrow-head-size, 0.5em);
                                transform: rotateX(0deg);
                            }
                                #activearrowhead polygon {
                                    fill: var(--wt-g3x5-purple);
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
                        <div id="scrollcontainer" slot="content">
                            <div id="rowscontainer"></div>
                            <svg id="activearrowstem" class="activeArrow">
                                <rect x="0" y="0" rx="10" ry="10" width="1000" height="0" />
                            </svg>
                            <svg id="activearrowhead" class="activeArrow" viewBox="0 0 86.6 100">
                                <polygon points="0,0 86.6,50 0,100" />
                            </svg>
                        </div>
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

class WT_G3x5_TSCFlightPlanWaypointButton extends WT_G3x5_TSCWaypointButton {
    constructor() {
        super();
    }

    _createIdentStyle() {
        return `
            #ident {
                position: absolute;
                left: 2%;
                top: 5%;
                font-size: var(--waypoint-ident-font-size, 1.67em);
                text-align: left;
                color: var(--waypoint-ident-color, var(--wt-g3x5-lightblue));
            }
            :host([active=true]) #ident {
                color: var(--wt-g3x5-purple);
            }
            :host([highlight=true][primed=false][active=false]) #ident {
                color: black;
            }
        `;
    }

    _createNameStyle() {
        return `
            #name {
                position: absolute;
                left: 2%;
                width: 90%;
                bottom: 5%;
                font-size: var(--waypoint-name-font-size, 1em);
                text-align: left;
                white-space: nowrap;
                overflow: hidden;
                color: var(--waypoint-name-color, white);
            }
            :host([active=true]) #name {
                color: var(--wt-g3x5-purple);
            }
            :host([highlight=true][primed=false][active=false]) #name {
                color: black;
            }
        `;
    }

    get active() {
        return this.getAttribute("active");
    }

    set active(value) {
        this.setAttribute("active", value);
    }
}
WT_G3x5_TSCFlightPlanWaypointButton.NAME = "wt-tsc-button-fpwaypoint";

customElements.define(WT_G3x5_TSCFlightPlanWaypointButton.NAME, WT_G3x5_TSCFlightPlanWaypointButton);

class WT_G3x5_TSCFlightPlanRowLegHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._initFormatters();

        this._waypoint = null;
        this._dtk = new WT_NavAngleUnit(true).createNumber(0);
        this._bearingUnit = null;
        this._distance = WT_Unit.NMILE.createNumber(0);
        this._distanceUnit = null;
        this._isActive = false;
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
            WT_CustomElementSelector.select(this.shadowRoot, `#waypoint`, WT_G3x5_TSCFlightPlanWaypointButton),
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
        this._updateFromActive();
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
        this._dtkDisplay.textContent = `${this._dtk.isNaN() ? "___" : this._dtkFormatter.getFormattedNumber(this._dtk, this._bearingUnit)}${this._dtkFormatter.getFormattedUnit(this._dtk, this._bearingUnit)}`;
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
        this._distanceDisplay.innerHTML = this._distanceFormatter.getFormattedHTML(this._distance, this._distanceUnit);
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

    _updateFromActive() {
        this._waypointButton.active = `${this._isActive}`;
    }

    setActive(value) {
        if (value === this._isActive) {
            return;
        }

        this._isActive = value;
        if (this._isInit) {
            this._updateFromActive();
        }
    }

    /**
     *
     * @param {Number} airplaneHeadingTrue
     */
    _updateWaypointButton(airplaneHeadingTrue) {
        this._waypointButton.update(airplaneHeadingTrue);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanUnitsModel} unitsModel
     */
    _updateUnits(unitsModel) {
        if (!unitsModel.bearingUnit.equals(this._bearingUnit)) {
            this._bearingUnit = unitsModel.bearingUnit;
            this._updateFromDTK();
        }
        if (!unitsModel.distanceUnit.equals(this._distanceUnit)) {
            this._distanceUnit = unitsModel.distanceUnit;
            this._updateFromDistance();
        }
    }

    /**
     *
     * @param {Number} airplaneHeadingTrue
     * @param {WT_G3x5_TSCFlightPlanUnitsModel} unitsModel
     */
    update(airplaneHeadingTrue, unitsModel) {
        if (!this._isInit) {
            return;
        }

        this._updateWaypointButton(airplaneHeadingTrue);
        this._updateUnits(unitsModel);
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
                --button-padding-left: var(--flightplan-table-row-leg-waypointbutton-padding-left, 1.5em);
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
        <wt-tsc-button-fpwaypoint id="waypoint"></wt-tsc-button-fpwaypoint>
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

        this._titleText = "";
        this._subtitleText = "";
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.TEMPLATE;
    }

    async _defineChildren() {
        this._button = await WT_CustomElementSelector.select(this.shadowRoot, `#header`, WT_TSCContentButton);

        this._title = this.shadowRoot.querySelector(`#title`);
        this._subtitle = this.shadowRoot.querySelector(`#subtitle`);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        this._updateFromTitleText();
        this._updateFromSubtitleText();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateFromTitleText() {
        this._title.innerHTML = this._titleText;
    }

    setTitleText(text) {
        if (this._titleText === text) {
            return;
        }

        this._titleText = text;
        if (this._isInit) {
            this._updateFromTitleText();
        }
    }

    _updateFromSubtitleText() {
        this._subtitle.innerHTML = this._subtitleText;
    }

    setSubtitleText(text) {
        if (this._subtitleText === text) {
            return;
        }

        this._subtitleText = text;
        if (this._isInit) {
            this._updateFromSubtitleText();
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
                #headercontent {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-flow: column nowrap;
                    justify-content: center;
                    align-items: center;
                }
                    #title {
                        color: var(--wt-g3x5-lightblue);
                    }
                    #subtitle {
                        color: white;
                    }
                    #header[highlight="true"] #title,
                    #header[primed="true"] #title,
                    #header[highlight="true"] #subtitle,
                    #header[primed="true"] #subtitle, {
                        color: black;
                    }
    </style>
    <div id="wrapper">
        <wt-tsc-button-content id="header">
            <div id="headercontent" slot="content">
                <div id="title"></div>
                <div id="subtitle"></div>
            </div>
        </wt-tsc-button-content>
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

        this._origin = new WT_G3x5_TSCFlightPlanOriginRenderer(this, flightPlan.getOrigin());
        this._enroute = new WT_G3x5_TSCFlightPlanEnrouteRenderer(this, flightPlan.getEnroute());
        this._destination = new WT_G3x5_TSCFlightPlanDestinationRenderer(this, flightPlan.getDestination());

        this._departure = null;
        this._arrival = null;
        this._approach = null;

        /**
         * @type {Map<WT_FlightPlanLeg,WT_G3x5_TSCFlightPlanRowHTMLElement>}
         */
        this._legRows = new Map();
        /**
         * @type {WT_FlightPlanLeg}
         */
        this._activeLeg = null;
    }

    /**
     * @readonly
     * @type {WT_FlightPlan}
     */
    get flightPlan() {
        return this._flightPlan;
    }

    clearLegRows() {
        this._legRows.clear();
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement} row
     */
    registerLegRow(leg, row) {
        this._legRows.set(leg, row);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    draw(htmlElement) {
        this.clearLegRows();
        this._updateActiveLeg(htmlElement, null);

        if (this.flightPlan.hasDeparture()) {
            this._departure = new WT_G3x5_TSCFlightPlanDepartureRenderer(this, this.flightPlan.getDeparture());
            this._departure.draw(htmlElement);
        } else {
            this._origin.draw(htmlElement);
            this._departure = null;
        }
        this._enroute.draw(htmlElement);
        if (this.flightPlan.hasArrival()) {
            this._arrival = new WT_G3x5_TSCFlightPlanArrivalRenderer(this, this.flightPlan.getArrival());
            this._arrival.draw(htmlElement);
        } else {
            this._destination.draw(htmlElement);
            this._arrival = null;
        }
        if (this.flightPlan.hasApproach()) {
            this._approach = new WT_G3x5_TSCFlightPlanApproachRenderer(this, this.flightPlan.getApproach());
            this._approach.draw(htmlElement);
        } else {
            this._approach = null;
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _updateActiveLeg(htmlElement, activeLeg) {
        if (this._activeLeg === activeLeg) {
            return;
        }

        this._activeLeg = activeLeg;
        let showArrow = false;
        if (activeLeg) {
            let previousLeg = activeLeg.previousLeg();
            if (previousLeg) {
                let activeLegRow = this._legRows.get(activeLeg);
                let previousLegRow = this._legRows.get(previousLeg);
                if (activeLegRow && previousLegRow) {
                    let previousLegCenterY = previousLegRow.offsetTop + previousLegRow.offsetHeight / 2;
                    let activeLegCenterY = activeLegRow.offsetTop + activeLegRow.offsetHeight / 2;
                    htmlElement.moveActiveArrow(previousLegCenterY, activeLegCenterY);
                    showArrow = true;
                }
            }
        }
        htmlElement.setActiveArrowVisible(showArrow);
    }

    _updateChildren(htmlElement, state) {
        if (this._departure) {
            this._departure.update(htmlElement, state);
        } else {
            this._origin.update(htmlElement, state);
        }
        this._enroute.update(htmlElement, state);
        if (this._arrival) {
            this._arrival.update(htmlElement, state);
        } else {
            this._destination.update(htmlElement, state);
        }
        if (this._approach) {
            this._approach.update(htmlElement, state);
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(htmlElement, state) {
        this._updateActiveLeg(htmlElement, state.activeLeg);
        this._updateChildren(htmlElement, state);
    }
}

/**
 * @template {WT_FlightPlanElement} T
 */
class WT_G3x5_TSCFlightPlanElementRenderer {
    /**
     * @param {WT_G3x5_TSCFlightPlanRenderer} parent
     * @param {T} element
     */
    constructor(parent, element) {
        this._parent = parent;
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
    draw(htmlElement) {
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(htmlElement, state) {
    }
}

/**
 * @template {WT_FlightPlanSequence} T
 * @extends WT_G3x5_TSCFlightPlanElementRenderer<T>
 */
class WT_G3x5_TSCFlightPlanSequenceRenderer extends WT_G3x5_TSCFlightPlanElementRenderer {
    /**
     * @param {WT_G3x5_TSCFlightPlanRenderer} parent
     * @param {T} sequence
     */
    constructor(parent, sequence) {
        super(parent, sequence);

        /**
         * @type {WT_G3x5_TSCFlightPlanElementRenderer[]}
         */
        this._children = [];
    }

    _mapElementToRenderer(element) {
        if (element instanceof WT_FlightPlanSequence) {
            return new WT_G3x5_TSCFlightPlanSequenceRenderer(this._parent, element);
        } else if (element instanceof WT_FlightPlanLeg) {
            return new WT_G3x5_TSCFlightPlanLegRenderer(this._parent, element);
        }
        return null;
    }

    _initChildren() {
        this._children = this.element.elements.map(this._mapElementToRenderer.bind(this));
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

    _updateChildren(htmlElement, state) {
        this._children.forEach(child => child.update(htmlElement, state));
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(htmlElement, state) {
        this._updateChildren(htmlElement, state);
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
            this._headerModeHTMLElement.setTitleText(`Origin – ${this.element.waypoint.ident}`);
            this._headerModeHTMLElement.setSubtitleText("");
        } else {
            this._headerModeHTMLElement.setTitleText("");
            this._headerModeHTMLElement.setSubtitleText("Add Origin");
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
            this._headerModeHTMLElement.setTitleText(`Destination – ${this.element.waypoint.ident}`);
            this._headerModeHTMLElement.setSubtitleText("");
        } else {
            this._headerModeHTMLElement.setTitleText("");
            this._headerModeHTMLElement.setSubtitleText("Add Destination");
        }
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanDeparture>
 */
class WT_G3x5_TSCFlightPlanDepartureRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    _initChildren() {
        super._initChildren();

        if (!this.element.procedure.runwayTransitions.getByIndex(this.element.runwayTransitionIndex)) {
            // if the departure does not have a runway selected, add the origin as the first "leg"
            this._children.unshift(new WT_G3x5_TSCFlightPlanLegRenderer(this._parent, this.element.flightPlan.getOrigin().leg()));
        }
    }

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
        this._headerModeHTMLElement.setTitleText(`Departure –<br>${departure.airport.ident}–${prefix}${departure.name}${suffix}`);
        this._headerModeHTMLElement.setSubtitleText("");
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanEnroute>
 */
class WT_G3x5_TSCFlightPlanEnrouteRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader(htmlElement) {
        if (this.element.length > 0) {
            super._drawHeader(htmlElement);
            this._headerModeHTMLElement.setTitleText("Enroute");
            this._headerModeHTMLElement.setSubtitleText("");
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
    _initChildren() {
        super._initChildren();

        // we need to manually add the destination "leg" to the end of the arrival since the sim doesn't give it to us automatically
        this._children.push(new WT_G3x5_TSCFlightPlanLegRenderer(this._parent, this.element.flightPlan.getDestination().leg()));
    }

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
        this._headerModeHTMLElement.setTitleText(`Arrival –<br>${arrival.airport.ident}–${prefix}${arrival.name}${suffix}`);
        this._headerModeHTMLElement.setSubtitleText("");
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
        this._headerModeHTMLElement.setTitleText(`Approach –<br>${approach.airport.ident}–${approach.name}`);
        this._headerModeHTMLElement.setSubtitleText("");
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanElementRenderer<WT_FlightPlanLeg>
 */
class WT_G3x5_TSCFlightPlanLegRenderer extends WT_G3x5_TSCFlightPlanElementRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    draw(htmlElement) {
        this._row = htmlElement.requestRow();
        this._row.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG);

        this._modeHTMLElement = this._row.getActiveModeHTMLElement();
        this._modeHTMLElement.setWaypoint(this.element.fix);
        this._modeHTMLElement.setDTK(this.element.desiredTrack);
        this._modeHTMLElement.setDistance(this.element.distance);

        this._parent.registerLegRow(this.element, this._row);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    _updateModeHTMLElement(htmlElement, state) {
        this._modeHTMLElement.update(state.airplaneHeadingTrue, state.unitsModel);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    _updateActive(htmlElement, state) {
        this._modeHTMLElement.setActive(state.activeLeg === this.element);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(htmlElement, state) {
        this._updateModeHTMLElement(htmlElement, state);
        this._updateActive(htmlElement, state);
    }
}