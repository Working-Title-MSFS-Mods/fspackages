class WT_G3x5_TSCDuplicateWaypointSelection extends WT_G3x5_TSCPopUpElement {
    /**
     * @readonly
     * @type {WT_G3x5_TSCDuplicateWaypointSelectionHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _initState() {
        this._state = {
            _airplane: this.instrument.airplane,
            _unitsSettingModel: this.instrument.unitsSettingModel,

            get airplane() {
                return this._airplane;
            },

            get unitsSettingModel() {
                return this._unitsSettingModel;
            }
        };
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCDuplicateWaypointSelectionHTMLElement();
    }

    _initFromHTMLElement() {
        this.htmlElement.addSelectionListener(this._onSelectionMade.bind(this));
    }

    onInit() {
        this._initState();
        this._htmlElement = this._createHTMLElement();
        this.popUpWindow.appendChild(this.htmlElement);
        this._initFromHTMLElement();
    }

    _onSelectionMade(source, waypoint) {
        this.context.callback(waypoint);
        this.instrument.goBack();
    }

    _onBackPressed() {
        this.context.callback(null);
        this.instrument.goBack();
    }

    _activateScrollButtons() {
        this.instrument.activateNavButton(5, "Up", this._onUpPressed.bind(this), true, "ICON_TSC_BUTTONBAR_UP.png");
        this.instrument.activateNavButton(6, "Down", this._onDownPressed.bind(this), true, "ICON_TSC_BUTTONBAR_DOWN.png");
    }

    _deactivateScrollButtons() {
        this.instrument.deactivateNavButton(5);
        this.instrument.deactivateNavButton(6);
    }

    _activateNavButtons() {
        super._activateNavButtons();

        this._activateScrollButtons();
    }

    _deactivateNavButtons() {
        super._deactivateNavButtons();

        this._deactivateScrollButtons();
    }

    onEnter() {
        super.onEnter();

        this.htmlElement.setIdent(this.context.ident);
        this.htmlElement.setWaypoints(this.context.waypoints);
        this.htmlElement.open();
    }

    onUpdate(deltaTime) {
        this.htmlElement.update(this._state);
    }

    _onUpPressed() {
        this.htmlElement.scrollUp();
    }

    _onDownPressed() {
        this.htmlElement.scrollDown();
    }

    onExit() {
        super.onExit();

        this.htmlElement.close();
    }
}

/**
 * @typedef WT_G3x5_TSCDuplicateWaypointSelectionState
 * @property {readonly WT_PlayerAirplane} airplane
 * @property {readonly WT_G3x5_UnitsSettingModel} unitsSettingModel
 */

class WT_G3x5_TSCDuplicateWaypointSelectionHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {((source:WT_G3x5_TSCDuplicateWaypointSelectionHTMLElement, waypoint:WT_ICAOWaypoint) => void)[]}
         */
        this._listeners = [];

        this._ident = "";
        /**
         * @type {WT_ICAOWaypoint}
         */
        this._waypoints = [];
        /**
         * @type {WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement[]}
         */
        this._visibleRows = [];
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCDuplicateWaypointSelectionHTMLElement.TEMPLATE;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        this._topLabel = this.shadowRoot.querySelector(`#toplabel`);
        this._rows = await WT_CustomElementSelector.select(this.shadowRoot, `#rows`, WT_TSCScrollList);
    }

    _initRowRecycler() {
        this._rowRecycler = new WT_CustomHTMLElementRecycler(this._rows, WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement, element => {
            element.slot = "content";
            element.addSelectionListener(this._onRowSelected.bind(this));
        });
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initRowRecycler();
        this._isInit = true;
        this._updateFromWaypoints();
        this._updateFromIdent();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateFromIdent() {
        this._topLabel.textContent = `Search Results for "${this._ident}"`;
    }

    setIdent(ident) {
        if (this._ident === ident) {
            return;
        }

        this._ident = ident;
        this._updateFromIdent();
    }

    _updateFromWaypoints() {
        this._visibleRows = [];
        this._rowRecycler.recycleAll();

        this._waypoints.forEach(waypoint => {
            let row = this._rowRecycler.request();
            row.setWaypoint(waypoint);
            this._visibleRows.push(row);
        });
    }

    /**
     *
     * @param {WT_ICAOWaypoint[]} waypoints
     */
    setWaypoints(waypoints) {
        this._waypoints = waypoints.slice();
        if (this._isInit) {
            this._updateFromWaypoints();
        }
    }

    _notifySelectionListeners(waypoint) {
        this._listeners.forEach(listener => listener(this, waypoint));
    }

    _onRowSelected(row, waypoint) {
        this._notifySelectionListeners(waypoint);
    }

    /**
     *
     * @param {(source:WT_G3x5_TSCDuplicateWaypointSelectionHTMLElement, waypoint:WT_ICAOWaypoint) => void} listener
     */
    addSelectionListener(listener) {
        this._listeners.push(listener);
    }

    /**
     *
     * @param {(source:WT_G3x5_TSCDuplicateWaypointSelectionHTMLElement, waypoint:WT_ICAOWaypoint) => void} listener
     */
    removeSelectionListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    scrollUp() {
        if (!this._isInit) {
            return;
        }

        this._rows.scrollManager.scrollUp();
    }

    scrollDown() {
        if (!this._isInit) {
            return;
        }

        this._rows.scrollManager.scrollDown();
    }

    open() {
    }

    /**
     *
     * @param {WT_G3x5_TSCDuplicateWaypointSelectionState} state
     */
    _doUpdate(state) {
        this._visibleRows.forEach(row => row.update(state));
        this._rows.scrollManager.update();
    }

    /**
     *
     * @param {WT_G3x5_TSCDuplicateWaypointSelectionState} state
     */
    update(state) {
        if (!this._isInit) {
            return;
        }

        this._doUpdate(state);
    }

    close() {
        if (!this._isInit) {
            return;
        }

        this._rows.scrollManager.cancelScroll();
    }
}
WT_G3x5_TSCDuplicateWaypointSelectionHTMLElement.NAME = "wt-tsc-duplicatewaypoint";
WT_G3x5_TSCDuplicateWaypointSelectionHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCDuplicateWaypointSelectionHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 5px;
            background: linear-gradient(#1f3445, black 25px);
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: absolute;
            left: var(--waypointkeyboard-padding-left, 0.1em);
            top: var(--waypointkeyboard-padding-top, 0.1em);
            width: calc(100% - var(--waypointkeyboard-padding-left, 0.1em) - var(--waypointkeyboard-padding-right, 0.1em));
            height: calc(100% - var(--waypointkeyboard-padding-top, 0.1em) - var(--waypointkeyboard-padding-bottom, 0.1em));
            --duplicatewaypoint-table-grid-columns-master: var(--duplicatewaypoint-table-grid-columns, 2.5fr 1fr 1.5fr);
        }
            #toplabel {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                height: var(--duplicatewaypoint-toplabel-height, 1em);
            }
            #table {
                position: absolute;
                left: 0%;
                top: calc(var(--duplicatewaypoint-toplabel-height, 1em) + var(--duplicatewaypoint-toplabel-margin-bottom, 0.1em));
                width: 100%;
                height: calc(100% - var(--duplicatewaypoint-toplabel-height, 1em) - var(--duplicatewaypoint-toplabel-margin-bottom, 0.1em));
                display: grid;
                grid-template-rows: var(--duplicatewaypoint-table-header-height, 0.75em) 1fr;
                grid-template-columns: 100%;
                grid-gap: var(--duplicatewaypoint-table-header-margin-bottom, 0.1em) 0;
            }
                #tableheader {
                    position: relative;
                    width: calc(100% - var(--scrolllist-scrollbar-width, 1vw));
                    justify-self: start;
                    align-self: center;
                    display: grid;
                    grid-template-rows: 100%;
                    grid-template-columns: var(--duplicatewaypoint-table-grid-columns-master);
                    font-size: var(--duplicatewaypoint-table-header-font-size, 0.75em);
                    justify-items: center;
                    align-items: center;
                }
                    #bearingtitle {
                        grid-column-start: 2;
                    }
                    #distancetitle {
                        grid-column-start: 3;
                    }
                #rows {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    --scrolllist-padding-left: 0px;
                    --scrolllist-padding-top: 0px;
                    --scrolllist-padding-right: 0px;
                    --scrolllist-padding-bottom: 0px;
                    --scrolllist-align-items: stretch;
                }
                    wt-tsc-duplicatewaypoint-row {
                        height: 3.5em;
                    }
    </style>
    <div id="wrapper">
        <div id="toplabel"></div>
        <div id="table">
            <div id="tableheader">
                <div id="bearingtitle">Bearing</div>
                <div id="distancetitle">Distance</div>
            </div>
            <wt-tsc-scrolllist id="rows"></wt-tsc-scrolllist>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCDuplicateWaypointSelectionHTMLElement.NAME, WT_G3x5_TSCDuplicateWaypointSelectionHTMLElement);

class WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {((row:WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement, waypoint:WT_ICAOWaypoint) => void)[]}
         */
        this._listeners = [];

        /**
         * @type {WT_ICAOWaypoint}
         */
        this._waypoint = null;
        this._isInit = false;

        this._initFormatters();

        this._tempTrueBearing = new WT_NavAngleUnit(false).createNumber(0);
        this._tempGARad = WT_Unit.GA_RADIAN.createNumber(0);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    _getTemplate() {
        return WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement.TEMPLATE;
    }

    _initBearingFormatter() {
        this._bearingFormatter = new WT_NumberFormatter({
            precision: 1,
            pad: 3,
            unitSpaceBefore: false
        });
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
                _numberClassList: [],
                _unitClassList: [WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement.UNIT_CLASS],

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
        this._initBearingFormatter();
        this._initDistanceFormatter();
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        [
            this._button,
            this._bearingArrow
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#button`, WT_G3x5_TSCDuplicateWaypointButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#bearingarrow`, WT_TSCBearingArrow)
        ]);

        this._bearingText = new WT_CachedElement(this.shadowRoot.querySelector(`#bearingtext`));
        this._distanceText = new WT_CachedElement(this.shadowRoot.querySelector(`#distancetext`));
    }

    _initWaypointIconSrcFactory() {
        this._button.setIconSrcFactory(new WT_G3x5_TSCWaypointButtonIconSrcFactory(WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement.WAYPOINT_ICON_PATH));
    }

    _initButtonListener() {
        this._button.addButtonListener(this._onButtonPressed.bind(this));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initWaypointIconSrcFactory();
        this._initButtonListener();
        this._isInit = true;
        this._updateFromWaypoint();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateFromWaypoint() {
        this._button.setWaypoint(this._waypoint);
    }

    /**
     *
     * @param {WT_ICAOWaypoint} waypoint
     */
    setWaypoint(waypoint) {
        if ((!this._waypoint && !waypoint) || (waypoint && waypoint.equals(this._waypoint))) {
            return;
        }

        this._waypoint = waypoint;
        if (this._isInit) {
            this._updateFromWaypoint();
        }
    }

    _notifySelectionListeners() {
        this._listeners.forEach(listener => listener(this, this._waypoint));
    }

    _onButtonPressed(button) {
        this._notifySelectionListeners();
    }

    /**
     *
     * @param {(row:WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement, waypoint:WT_ICAOWaypoint) => void} listener
     */
    addSelectionListener(listener) {
        this._listeners.push(listener);
    }

    /**
     *
     * @param {(row:WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement, waypoint:WT_ICAOWaypoint) => void} listener
     */
    removeSelectionListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    _updateButton(planeHeadingTrue) {
        this._button.update(planeHeadingTrue);
    }

    _updateBearing(planeHeadingTrue, planePos, bearingUnit) {
        let bearing = this._tempTrueBearing.set(planePos.bearingTo(this._waypoint.location));
        bearing.unit.setLocation(planePos);
        this._bearingText.textContent = this._bearingFormatter.getFormattedString(bearing, bearingUnit);
        this._bearingArrow.setBearing(bearing.number - planeHeadingTrue);
    }

    _updateDistance(planePos, distanceUnit) {
        let distance = this._tempGARad.set(planePos.distance(this._waypoint.location));
        this._distanceText.innerHTML = this._distanceFormatter.getFormattedHTML(distance, distanceUnit);
    }

    /**
     *
     * @param {WT_G3x5_TSCDuplicateWaypointSelectionState} state
     */
    _doUpdate(state) {
        let planeHeadingTrue = state.airplane.navigation.headingTrue();
        let planePos = state.airplane.navigation.position(this._tempGeoPoint);
        this._updateButton(planeHeadingTrue);
        this._updateBearing(planeHeadingTrue, planePos.readonly(), state.unitsSettingModel.navAngleSetting.getNavAngleUnit());
        this._updateDistance(planePos.readonly(), state.unitsSettingModel.distanceSpeedSetting.getDistanceUnit());
    }

    /**
     *
     * @param {WT_G3x5_TSCDuplicateWaypointSelectionState} state
     */
    update(state) {
        if (!this._isInit || !this._waypoint) {
            return;
        }

        this._doUpdate(state);
    }
}
WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement.WAYPOINT_ICON_PATH = "/WTg3000/SDK/Assets/Images/Garmin/TSC/Waypoints";
WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement.NAME = "wt-tsc-duplicatewaypoint-row";
WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            border-radius: 5px;
            background: black;
            border: 1px solid white;
        }

        #wrapper {
            position: absolute;
            left: var(--duplicatewaypoint-row-padding-left, 0.1em);
            top: var(--duplicatewaypoint-row-padding-top, 0.1em);
            width: calc(100% - var(--duplicatewaypoint-row-padding-left, 0.1em) - var(--duplicatewaypoint-row-padding-right, 0.1em));
            height: calc(100% - var(--duplicatewaypoint-row-padding-top, 0.1em) - var(--duplicatewaypoint-row-padding-bottom, 0.1em));
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: var(--duplicatewaypoint-table-grid-columns-master);
            color: white;
        }
            #button {
                font-size: var(--duplicatewaypoint-row-button-font-size, 0.75em);
                --button-waypoint-icon-top: 5%;
                --button-waypoint-ident-color: white;
            }
            #bearingcontainer {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                flex-flow: row nowrap;
                justify-content: center;
                align-items: center;
            }
                #bearingarrow {
                    width: var(--duplicatewaypoint-row-bearingarrow-size, 1em);
                    height: var(--duplicatewaypoint-row-bearingarrow-size, 1em);
                    margin-right: 0.1em;
                }
            #distancecontainer {
                position: relative;
            }
                #distancetext {
                    position: absolute;
                    right: var(--duplicatewaypoint-row-distance-padding-right, 1em);
                    top: 50%;
                    transform: translateY(-50%);
                }

        .${WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement.UNIT_CLASS} {
            font-size: var(--duplicatewaypoint-row-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <wt-tsc-button-duplicatewaypoint id="button"></wt-tsc-button-duplicatewaypoint>
        <div id="bearingcontainer">
            <wt-tsc-bearingarrow id="bearingarrow"></wt-tsc-bearingarrow>
            <div id="bearingtext"></div>
        </div>
        <div id="distancecontainer">
            <div id="distancetext"></div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement.NAME, WT_G3x5_TSCDuplicateWaypointSelectionRowHTMLElement);

class WT_G3x5_TSCDuplicateWaypointButton extends WT_G3x5_TSCWaypointButton {
    constructor() {
        super();
    }

    _createIdentStyle() {
        return `
            #ident {
                position: absolute;
                left: 2%;
                top: 2%;
                font-size: var(--button-waypoint-ident-font-size, 1.67em);
                text-align: left;
                color: var(--button-waypoint-ident-color, var(--wt-g3x5-lightblue));
            }
            :host([highlight=true][primed=false]) #ident {
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
                top: 45%;
                font-size: var(--button-waypoint-name-font-size, 1em);
                text-align: left;
                white-space: nowrap;
                overflow: hidden;
                color: var(--button-waypoint-name-color, white);
            }
            :host([highlight=true][primed=false]) #name {
                color: black;
            }
        `;
    }

    _createRegionStyle() {
        return `
            #region {
                position: absolute;
                left: 2%;
                width: 90%;
                bottom: 2%;
                font-size: var(--button-waypoint-region-font-size, 1em);
                text-align: left;
                white-space: nowrap;
                overflow: hidden;
                color: var(--button-waypoint-region-color, white);
            }
            :host([highlight=true][primed=false]) #region {
                color: black;
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();
        let regionStyle = this._createRegionStyle();
        return `
            ${style}
            ${regionStyle}
        `;
    }

    _appendRegion() {
        this._region = document.createElement("div");
        this._region.id = "region";
        this._wrapper.appendChild(this._region);
    }

    _appendChildren() {
        super._appendChildren();

        this._appendRegion();
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    _showWaypointInfo(waypoint) {
        super._showWaypointInfo(waypoint);

        this._region.style.display = "block";
        if (waypoint instanceof WT_Airport) {
            this._region.textContent = waypoint.city.toString();
        } else {
            this._region.textContent = WT_G3x5_RegionNames.getName(waypoint.region);
        }
    }

    _showEmptyText() {
        super._showEmptyText();

        this._region.style.display = "none";
    }
}
WT_G3x5_TSCDuplicateWaypointButton.NAME = "wt-tsc-button-duplicatewaypoint";

customElements.define(WT_G3x5_TSCDuplicateWaypointButton.NAME, WT_G3x5_TSCDuplicateWaypointButton);