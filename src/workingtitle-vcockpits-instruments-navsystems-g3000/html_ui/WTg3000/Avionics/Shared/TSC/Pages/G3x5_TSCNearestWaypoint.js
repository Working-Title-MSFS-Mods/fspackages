class WT_G3x5_TSCNearestWaypoint extends WT_G3x5_TSCPageElement {
    /**
     * @readonly
     * @type {WT_G3x5_TSCNearestWaypointHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createUnitsModel() {
        return new WT_G3x5_TSCNearestWaypointUnitsModel(this.instrument.unitsSettingModel);
    }

    init(root) {
        this.container.title = this._getTitle();

        this._unitsModel = this._createUnitsModel();

        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
    }

    _activateNavButtons() {
        super._activateNavButtons();

        this.instrument.activateNavButton(5, "Up", this._onUpPressed.bind(this), false, "ICON_TSC_BUTTONBAR_UP.png");
        this.instrument.activateNavButton(6, "Down", this._onDownPressed.bind(this), false, "ICON_TSC_BUTTONBAR_DOWN.png");
    }

    _deactivateNavButtons() {
        super._deactivateNavButtons();

        this.instrument.deactivateNavButton(5, false);
        this.instrument.deactivateNavButton(6, false);
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }

    _onUpPressed() {
        this.htmlElement.scrollUp();
    }

    _onDownPressed() {
        this.htmlElement.scrollDown();
    }
}

class WT_G3x5_TSCNearestWaypointUnitsModel extends WT_G3x5_UnitsSettingModelAdapter {
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

    /**
     * @readonly
     * @type {WT_Unit}
     */
    get lengthUnit() {
        return this._lengthUnit;
    }

    _updateBearing() {
        this._bearingUnit = this.unitsSettingModel.navAngleSetting.getNavAngleUnit();
    }

    _updateDistance() {
        if (this.unitsSettingModel.distanceSpeedSetting.getValue() === WT_G3x5_DistanceSpeedUnitsSetting.Value.NAUTICAL) {
            this._distanceUnit = WT_Unit.NMILE;
            this._lengthUnit = WT_Unit.FOOT;
        } else {
            this._distanceUnit = WT_Unit.KILOMETER;
            this._lengthUnit = WT_Unit.METER;
        }
    }
}

class WT_G3x5_TSCNearestAirport extends WT_G3x5_TSCNearestWaypoint {
    _getTitle() {
        return "Nearest Airport";
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCNearestAirportHTMLElement();
        let nearestAirportList = this.instrument.nearestAirportList;
        htmlElement.setContext({
            airplane: this.instrument.airplane,
            unitsModel: this._unitsModel,
            getWaypoints() {
                return nearestAirportList.airports;
            }
        });
        return htmlElement;
    }
}

/**
 * @template {WT_ICAOWaypoint} T
 */
class WT_G3x5_TSCNearestWaypointHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_G3x5_TSCNearestWaypointRowHTMLElement<T>[]}
         */
        this._rows = [];
        /**
         * @type {T[]}
         */
        this._waypoints = [];

        /**
         * @type {{airplane:WT_PlayerAirplane, unitsModel:WT_G3x5_TSCNearestWaypointUnitsModel, getWaypoints:() => WT_ReadOnlyArray<T>}}
         */
        this._context = null;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCNearestWaypointHTMLElement.TEMPLATE;
    }

    async _defineChildren() {
        this._col1Title = this.shadowRoot.querySelector(`#col1title`);
        this._col2Title = this.shadowRoot.querySelector(`#col2title`);
        this._col3Title = this.shadowRoot.querySelector(`#col3title`);
        this._col4Title = this.shadowRoot.querySelector(`#col4title`);
        /**
         * @type {WT_TSCScrollList}
         */
        this._waypointsList = await WT_CustomElementSelector.select(this.shadowRoot, `#waypoints`, WT_TSCScrollList);
    }

    _initWaypointRowRecycler() {
        /**
         * @type {WT_HTMLElementRecycler<WT_G3x5_TSCNearestWaypointRowHTMLElement<T>>}
         */
        this._waypointRowRecycler = this._createWaypointRowRecycler();
    }

    _initHeader() {
        this._col1Title.innerHTML = this._getCol1TitleText();
        this._col2Title.innerHTML = this._getCol2TitleText();
        this._col3Title.innerHTML = this._getCol3TitleText();
        this._col4Title.innerHTML = this._getCol4TitleText();
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initWaypointRowRecycler();
        this._initHeader();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    setContext(context) {
        this._context = context;
    }

    _updateWaypoints() {
        let waypoints = this._context.getWaypoints().slice();
        if (waypoints.length === this._waypoints.length && waypoints.every((waypoint, index) => waypoint.equals(this._waypoints[index]))) {
            return;
        }

        for (let i = 0; i < this._rows.length; i++) {
            let row = this._rows[i];
            let index = waypoints.findIndex(waypoint => waypoint.equals(row.waypoint));
            if (index < 0) {
                this._waypointRowRecycler.recycle(row);
                this._rows.splice(i, 1);
                i--;
            }
        }

        for (let i = 0; i < waypoints.length; i++) {
            let waypoint = waypoints[i];
            let index = this._rows.findIndex(row => row.waypoint.equals(waypoint));
            let row;
            if (index >= 0) {
                row = this._rows[index];
            } else {
                row = this._waypointRowRecycler.request();
                row.setContext({
                    airplane: this._context.airplane,
                    unitsModel: this._context.unitsModel
                });
                row.setWaypoint(waypoint);
                this._rows.push(row);
            }
            row.style.order = `${i}`;
        }

        this._waypoints = waypoints;
    }

    _updateRows() {
        this._rows.forEach(row => row.update());
    }

    _doUpdate() {
        this._updateWaypoints();
        this._updateRows();
        this._waypointsList.scrollManager.update();
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._doUpdate();
    }

    scrollUp() {
        this._waypointsList.scrollManager.scrollUp();
    }

    scrollDown() {
        this._waypointsList.scrollManager.scrollDown();
    }
}
WT_G3x5_TSCNearestWaypointHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCNearestWaypointHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 5px;
            border: 3px solid var(--wt-g3x5-bordergray);
            background: linear-gradient(#1f3445, black 25px);
        }

        #wrapper {
            position: absolute;
            left: var(--nearestwaypoints-padding-left, 0.1em);
            top: var(--nearestwaypoints-padding-top, 0.1em);
            width: calc(100% - var(--nearestwaypoints-padding-left, 0.1em) - var(--nearestwaypoints-padding-right, 0.1em));
            height: calc(100% - var(--nearestwaypoints-padding-top, 0.1em) - var(--nearestwaypoints-padding-bottom, 0.1em));
        }
            #header {
                position: absolute;
                left: var(--nearestwaypoint-row-padding-left, 0.1em);
                top: 0%;
                width: calc(100% - var(--scrolllist-scrollbar-width, 1vw) - var(--nearestwaypoint-row-padding-left, 0.1em) - var(--nearestwaypoint-row-padding-right, 0.1em));
                height: var(--nearestwaypoints-header-height, calc(var(--nearestwaypoints-header-font-size, 0.75em) * 1.5));
                display: grid;
                grid-template-rows: 100%;
                grid-template-columns: var(--nearestwaypoints-col1-width, 1fr) var(--nearestwaypoints-col2-width, 1fr) var(--nearestwaypoints-col3-width, 1fr) var(--nearestwaypoints-col4-width, 1fr);
                grid-gap: 0 var(--nearestwaypoints-column-gap, 0.1em);
                align-items: center;
                font-size: var(--nearestwaypoints-header-font-size, 0.75em);
            }
                #col2title,
                #col3title,
                #col4title {
                    text-align: center;
                }
            #waypoints {
                position: absolute;
                left: 0%;
                top: var(--nearestwaypoints-header-height, calc(var(--nearestwaypoints-header-font-size, 0.75em) * 1.5));
                width: 100%;
                height: calc(100% - var(--nearestwaypoints-header-height, calc(var(--nearestwaypoints-header-font-size, 0.75em) * 1.5)));
                --scrolllist-padding-left: 0px;
                --scrolllist-padding-right: 0px;
                --scrolllist-padding-top: 0px;
                --scrolllist-padding-bottom: 0px;
                --scrolllist-align-items: stretch;
            }
                #waypoints wt-tsc-nearestairport-row {
                    height: var(--nearestwaypoints-row-height, 3em);
                    margin: var(--nearestwaypoints-row-margin, 0);
                }
    </style>
    <div id="wrapper">
        <div id="header">
            <div id="col1title"></div>
            <div id="col2title"></div>
            <div id="col3title"></div>
            <div id="col4title"></div>
        </div>
        <wt-tsc-scrolllist id="waypoints"></wt-tsc-scrolllist>
    </div>
`;

/**
 * @template T
 * @extends WT_CustomHTMLElementRecycler<T>
 */
class WT_G3x5_TSCNearestWaypointRowRecycler extends WT_CustomHTMLElementRecycler {
    _createElement() {
        let element = super._createElement();
        element.slot = "content";
        return element;
    }
}

/**
 * @extends WT_G3x5_TSCNearestWaypointHTMLElement<WT_Airport>
 */
class WT_G3x5_TSCNearestAirportHTMLElement extends WT_G3x5_TSCNearestWaypointHTMLElement {
    _createWaypointRowRecycler() {
        return new WT_G3x5_TSCNearestWaypointRowRecycler(this._waypointsList, WT_G3x5_TSCNearestAirportRowHTMLElement);
    }

    _getCol1TitleText() {
        return "Airport";
    }

    _getCol2TitleText() {
        return "BRG";
    }

    _getCol3TitleText() {
        return "DIS";
    }

    _getCol4TitleText() {
        return "APPR/RWY";
    }
}
WT_G3x5_TSCNearestAirportHTMLElement.NAME = "wt-tsc-nearestairport";

customElements.define(WT_G3x5_TSCNearestAirportHTMLElement.NAME, WT_G3x5_TSCNearestAirportHTMLElement);

/**
 * @template {WT_ICAOWaypoint} T
 */
class WT_G3x5_TSCNearestWaypointRowHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {{airplane:WT_PlayerAirplane, unitsModel:WT_G3x5_TSCNearestWaypointUnitsModel}}
         */
        this._context = null;
        /**
         * @type {T}
         */
        this._waypoint = null;
        this._isInit = false;

        this._initFormatters();

        this._tempGARad = new WT_NumberUnit(0, WT_Unit.GA_RADIAN);
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
                    return [];
                },
                getUnitClassList() {
                    return [WT_G3x5_TSCNearestWaypointRowHTMLElement.UNIT_CLASS];
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

    _initFormatters() {
        this._initDistanceFormatter();
        this._initBearingFormatter();
    }

    /**
     * @readonly
     * @type {T}
     */
    get waypoint() {
        return this._waypoint;
    }

    async _defineChildren() {
        [
            this._waypointButton,
            this._bearingArrow
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, this._getWaypointButtonQuery(), WT_G3x5_TSCWaypointButton),
            WT_CustomElementSelector.select(this.shadowRoot, this._getBearingArrowQuery(), WT_TSCBearingArrow)
        ]);
        this._waypointButton.setIconSrcFactory(new WT_G3x5_TSCWaypointButtonIconSrcFactory(WT_G3x5_TSCNearestWaypointRowHTMLElement.WAYPOINT_ICON_PATH));

        this._bearingText = new WT_CachedElement(this.shadowRoot.querySelector(this._getBearingTextQuery()));
        this._distanceText = new WT_CachedElement(this.shadowRoot.querySelector(this._getDistanceTextQuery()));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        this._updateFromWaypoint();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    setContext(context) {
        this._context = context;
    }

    _updateWaypointButton() {
        this._waypointButton.setWaypoint(this._waypoint);
    }

    _updateFromWaypoint() {
        this._updateWaypointButton();
    }

    /**
     *
     * @param {WT_ICAOWaypoint} waypoint
     */
    setWaypoint(waypoint) {
        this._waypoint = waypoint;
        if (this._isInit) {
            this._updateFromWaypoint();
        }
    }

    _clearBearingInfo() {
        this._bearingArrow.setBearing(0);
        this._bearingText.textContent = "";
    }

    _updateBearing(planePosition) {
        if (!this.waypoint) {
            this._clearBearingInfo();
        }

        let bearing = this._tempTrueBearing.set(planePosition.bearingTo(this.waypoint.location));
        bearing.unit.setLocation(planePosition);

        let heading = this._context.airplane.navigation.headingTrue();
        this._bearingArrow.setBearing(bearing.number - heading);

        let unit = this._context.unitsModel.bearingUnit;
        this._bearingText.textContent = this._bearingFormatter.getFormattedString(bearing, unit);
    }

    _clearDistanceInfo() {
        this._distanceText.innerHTML = "";
    }

    _updateDistance(planePosition) {
        if (!this.waypoint) {
            this._clearDistanceInfo();
        }

        let distance = this._tempGARad.set(this.waypoint.location.distance(planePosition));
        let unit = this._context.unitsModel.distanceUnit;
        this._distanceText.innerHTML = this._distanceFormatter.getFormattedHTML(distance, unit);
    }

    _doUpdate() {
        let planePosition = this._context.airplane.navigation.position(this._tempGeoPoint);
        this._updateBearing(planePosition);
        this._updateDistance(planePosition);
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._doUpdate()
    }
}
WT_G3x5_TSCNearestWaypointRowHTMLElement.WAYPOINT_ICON_PATH = "/WTg3000/SDK/Assets/Images/Garmin/TSC/Waypoints";
WT_G3x5_TSCNearestWaypointRowHTMLElement.UNIT_CLASS = "unit";

/**
 * @extends WT_G3x5_TSCNearestWaypointRowHTMLElement<WT_Airport>
 */
class WT_G3x5_TSCNearestAirportRowHTMLElement extends WT_G3x5_TSCNearestWaypointRowHTMLElement {
    constructor() {
        super();

        this._lastLengthUnit = null;
    }

    _initLengthFormatter() {
        let formatterOpts = {
            precision: 1,
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                getNumberClassList() {
                    return [];
                },
                getUnitClassList() {
                    return [WT_G3x5_TSCNearestWaypointRowHTMLElement.UNIT_CLASS];
                }
            }
        };
        this._lengthFormatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);
    }

    _initFormatters() {
        super._initFormatters();

        this._initLengthFormatter();
    }

    _getTemplate() {
        return WT_G3x5_TSCNearestAirportRowHTMLElement.TEMPLATE;
    }

    _getWaypointButtonQuery() {
        return `#waypointbutton`;
    }

    _getBearingArrowQuery() {
        return `#bearingarrow`;
    }

    _getBearingTextQuery() {
        return `#bearingtext`;
    }

    _getDistanceTextQuery() {
        return `#distancetext`;
    }

    async _defineChildren() {
        await super._defineChildren();

        this._approachText = this.shadowRoot.querySelector(`#app`);
        this._runwayText = this.shadowRoot.querySelector(`#rwy`);
    }

    _clearApproachInfo() {
        this._approachText.textContent = "";
    }

    /**
     *
     * @param {WT_Runway} runway
     * @returns {WT_Approach.Type}
     */
    _calculateBestApproachType(runway) {
        return runway.approaches.reduce((prev, curr) => {
            switch (prev) {
                case WT_Approach.Type.UNKNOWN:
                    return curr.type;
                case WT_Approach.Type.RNAV:
                    if (curr.type === WT_Approach.Type.ILS_LOC) {
                        return curr.type;
                    }
                case WT_Approach.Type.ILS_LOC:
                default:
                    return prev;
            }
        }, WT_Approach.Type.UNKNOWN);
    }

    _updateApproach() {
        if (!this.waypoint) {
            this._clearApproachInfo();
        }

        let longest = this.waypoint.runways.longest();
        let text = "";
        if (longest) {
            let approachType = this._calculateBestApproachType(longest);
            text = WT_G3x5_TSCNearestAirportRowHTMLElement.APPROACH_TEXT[approachType];
        }
        this._approachText.textContent = text;
    }

    _clearRunwayInfo() {
        this._runwayText.textContent = "";
    }

    _updateRunway() {
        if (!this.waypoint) {
            this._clearRunwayInfo();
        }

        let longest = this.waypoint.runways.longest();
        let length = longest ? longest.length : WT_G3x5_TSCNearestAirportRowHTMLElement.ZERO_LENGTH;
        let unit = this._context.unitsModel.lengthUnit;
        this._runwayText.innerHTML = this._lengthFormatter.getFormattedHTML(length, unit);
        this._lastLengthUnit = unit;
    }

    _updateFromWaypoint() {
        super._updateFromWaypoint();

        this._updateApproach();
        this._updateRunway();
    }

    _updateLengthUnit() {
        let unit = this._context.unitsModel.lengthUnit;
        if (!unit.equals(this._lastLengthUnit)) {
            this._updateRunway();
        }
    }

    _doUpdate() {
        super._doUpdate();

        this._updateLengthUnit();
    }
}
WT_G3x5_TSCNearestAirportRowHTMLElement.ZERO_LENGTH = WT_Unit.FOOT.createNumber(0);
WT_G3x5_TSCNearestAirportRowHTMLElement.APPROACH_TEXT = [
    "",
    "ILS",
    "RNA"
];
WT_G3x5_TSCNearestAirportRowHTMLElement.NAME = "wt-tsc-nearestairport-row";
WT_G3x5_TSCNearestAirportRowHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCNearestAirportRowHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            border-radius: 5px;
            border: 1px solid var(--wt-g3x5-bordergray);
            background: black;
        }

        #wrapper {
            position: absolute;
            left: var(--nearestwaypoint-row-padding-left, 0.1em);
            top: var(--nearestwaypoint-row-padding-top, 0.1em);
            width: calc(100% - var(--nearestwaypoint-row-padding-left, 0.1em) - var(--nearestwaypoint-row-padding-right, 0.1em));
            height: calc(100% - var(--nearestwaypoint-row-padding-top, 0.1em) - var(--nearestwaypoint-row-padding-bottom, 0.1em));
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: var(--nearestwaypoints-col1-width, 1fr) var(--nearestwaypoints-col2-width, 1fr) var(--nearestwaypoints-col3-width, 1fr) var(--nearestwaypoints-col4-width, 1fr);
            grid-gap: 0 var(--nearestwaypoints-column-gap, 0.1em);
            color: white;
        }
            #waypointbutton {
                font-size: var(--nearestwaypoint-row-button-font-size, 0.75em);
                --waypoint-ident-color: white;
            }
            #bearing {
                position: relative;
            }
                #bearingarrow {
                    position: absolute;
                    left: 50%;
                    top: 0%;
                    height: 50%;
                    transform: translateX(-50%);
                }
                #bearingtext {
                    position: absolute;
                    left: 0%;
                    top: 75%;
                    width: 100%;
                    transform: translateY(-50%);
                    text-align: center;
                }
            #distance {
                position: relative;
            }
                #distancetext {
                    position: absolute;
                    left: 0%;
                    top: 50%;
                    width: 100%;
                    transform: translateY(-50%);
                    text-align: center;
                }
            #apprwy {
                position: relative;
                text-align: center;
            }
                #app {
                    position: absolute;
                    left: 0%;
                    bottom: 50%;
                    width: 100%;
                }
                #rwy {
                    position: absolute;
                    left: 0%;
                    top: 50%;
                    width: 100%;
                }

        .${WT_G3x5_TSCNearestWaypointRowHTMLElement.UNIT_CLASS} {
            font-size: var(--nearestwaypoint-row-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <wt-tsc-button-waypoint id="waypointbutton"></wt-tsc-button-waypoint>
        <div id="bearing">
            <wt-tsc-bearingarrow id="bearingarrow"></wt-tsc-bearingarrow>
            <div id="bearingtext"></div>
        </div>
        <div id="distance">
            <div id="distancetext"></div>
        </div>
        <div id="apprwy">
            <div id="app"></div>
            <div id="rwy"></div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCNearestAirportRowHTMLElement.NAME, WT_G3x5_TSCNearestAirportRowHTMLElement);