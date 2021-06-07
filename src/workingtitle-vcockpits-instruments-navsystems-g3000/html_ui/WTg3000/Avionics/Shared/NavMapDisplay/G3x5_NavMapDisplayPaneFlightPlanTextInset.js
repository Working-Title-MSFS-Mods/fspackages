class WT_G3x5_NavMapDisplayPaneFlightPlanTextInset {
    /**
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement} htmlElement
     * @param {WT_G3x5_BaseInstrument} instrument
     * @param {WT_G3x5_NavMapDisplayFlightPlanTextDistanceSetting} distanceSetting
     */
    constructor(htmlElement, instrument, distanceSetting) {
        this._htmlElement = htmlElement;
        this._instrument = instrument;
        this._distanceSetting = distanceSetting;

        this._initHTMLElement();
        this._initState();
        this._initSettings();
    }

    _initHTMLElement() {
        this.htmlElement.setInstrument(this._instrument);
    }

    _initState() {
        /**
         * @type {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState}
         */
        this._state = {
            _unitsModel: new WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetUnitsModel(this._instrument.unitsSettingModel),
            _isDirectToActive: false,
            _activeLeg: null,

            get unitsModel() {
                return this._unitsModel;
            },

            get isDirectToActive() {
                return this._isDirectToActive;
            },

            get activeLeg() {
                return this._activeLeg;
            }
        };
    }

    _initSettings() {
        this._distanceSetting.init();
        this._distanceSetting.addListener(this._onDistanceSettingChanged.bind(this));
        this.htmlElement.setDistanceCumulative(this._distanceSetting.isCumulative);
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     *
     * @param {WT_G3x5_DisplayPane.Size} size
     */
    setSize(size) {
        this.htmlElement.setSize(size);
    }

    _onDistanceSettingChanged(setting, newValue, oldValue) {
        this.htmlElement.setDistanceCumulative(newValue);
    }

    wake() {
        this.htmlElement.setFlightPlan(this._instrument.flightPlanManagerWT.activePlan, this._instrument.flightPlanManagerWT.activePlanVNAV);
    }

    sleep() {
        this.htmlElement.setFlightPlan(null, null);
    }

    _updateState() {
        this._state._isDirectToActive = this._instrument.flightPlanManagerWT.directTo.isActive();
        this._state._activeLeg = this._state.isDirectToActive ? this._instrument.flightPlanManagerWT.getDirectToLeg(true) : this._instrument.flightPlanManagerWT.getActiveLeg(true);
    }

    update() {
        this._updateState();
        this.htmlElement.update(this._state);
    }
}

/**
 * @typedef WT_G3x5_NavMapDisplayPaneFlightPlanInsetState
 * @property {readonly WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetUnitsModel} unitsModel
 * @property {readonly Boolean} isDirectToActive
 * @property {readonly WT_FlightPlanLeg} activeLeg
 */

class WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetUnitsModel extends WT_G3x5_UnitsSettingModelAdapter {
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
    get altitudeUnit() {
        return this._altitudeUnit;
    }

    /**
     * @readonly
     * @type {WT_Unit}
     */
    get fuelUnit() {
        return this._fuelUnit;
    }

    /**
     * @readonly
     * @type {WT_Unit}
     */
    get verticalSpeedUnit() {
        return this._verticalSpeedUnit;
    }

    _updateBearing() {
        this._bearingUnit = this.unitsSettingModel.navAngleSetting.getNavAngleUnit();
    }

    _updateDistance() {
        this._distanceUnit = this.unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
    }

    _updateAltitude() {
        this._altitudeUnit = this.unitsSettingModel.altitudeSetting.getAltitudeUnit();
        this._verticalSpeedUnit = this.unitsSettingModel.altitudeSetting.getVerticalSpeedUnit();
    }

    _updateFuel() {
        this._fuelUnit = this.unitsSettingModel.fuelSetting.getUnit();
    }
}

class WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_G3x5_BaseInstrument}
         */
        this._instrument = null;
        /**
         * @type {WT_FlightPlan}
         */
        this._flightPlan = null;
        /**
         * @type {WT_FlightPlanVNAV}
         */
        this._flightPlanVNAV = null;
        this._size = WT_G3x5_DisplayPane.Size.OFF;
        this._isDistanceCumulative = false;

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement.TEMPLATE;
    }

    async _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));

        [
            this._main,
            this._vnav
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, "#main", WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetMainHTMLElement),
            WT_CustomElementSelector.select(this.shadowRoot, "#vnav", WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement)
        ]);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        if (this._instrument) {
            this._updateFromInstrument();
        }
        this._updateFromFlightPlan();
        this._updateFromSize();
        this._updateFromDistanceCumulative();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateFromInstrument() {
        this._main.setInstrument(this._instrument);
        this._vnav.setInstrument(this._instrument);
    }

    /**
     *
     * @param {WT_G3x5_BaseInstrument} instrument
     */
    setInstrument(instrument) {
        if (!instrument || this._instrument) {
            return;
        }

        this._instrument = instrument;
        if (this._isInit) {
            this._updateFromInstrument();
        }
    }

    _updateFromFlightPlan() {
        this._main.setFlightPlan(this._flightPlan, this._flightPlanVNAV);
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @param {WT_FlightPlanVNAV} flightPlanVNAV
     */
    setFlightPlan(flightPlan, flightPlanVNAV) {
        if (flightPlan === this._flightPlan) {
            return;
        }

        this._flightPlan = flightPlan;
        this._flightPlanVNAV = flightPlanVNAV;
        if (this._isInit) {
            this._updateFromFlightPlan();
        }
    }

    _updateFromSize() {
        this._wrapper.setAttribute("size", `${WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement.SIZE_ATTRIBUTES[this._size]}`);
        this._main.setSize(this._size);
    }

    /**
     *
     * @param {WT_G3x5_DisplayPane.Size} size
     */
    setSize(size) {
        if (this._size === size) {
            return;
        }

        this._size = size;
        if (this._isInit) {
            this._updateFromSize();
        }
    }

    _updateFromDistanceCumulative() {
        this._main.setDistanceCumulative(this._isDistanceCumulative);
    }

    /**
     *
     * @param {Boolean} isCumulative
     */
    setDistanceCumulative(isCumulative) {
        if (this._isDistanceCumulative === isCumulative) {
            return;
        }

        this._isDistanceCumulative = isCumulative;
        if (this._isInit) {
            this._updateFromDistanceCumulative();
        }
    }

    _doUpdate(state) {
        this._main.update(state);
        if (this._size !== WT_G3x5_DisplayPane.Size.HALF) {
            this._vnav.update(state);
        }
    }

    update(state) {
        if (!this._isInit) {
            return;
        }

        this._doUpdate(state);
    }
}
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement.SIZE_ATTRIBUTES = [
    "off",
    "full",
    "half"
];
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement.NAME = "wt-navmapdisplaypane-flightplantextinset";
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
            background: black;
        }

        #wrapper {
            position: absolute;
            left: var(--flightplantextinset-padding-left, 0.1em);
            top: var(--flightplantextinset-padding-top, 0.1em);
            width: calc(100% - var(--flightplantextinset-padding-left, 0.1em) - var(--flightplantextinset-padding-right, 0.1em));
            height: calc(100% - var(--flightplantextinset-padding-top, 0.1em) - var(--flightplantextinset-padding-bottom, 0.1em));
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: var(--flightplantextinset-main-width, 75%) 1fr;
            grid-gap: 0 var(--flightplantextinset-main-margin-right, 0.1em);
        }
        #wrapper[size="half"] {
            grid-template-columns: 100%;
        }
            #main {
                transform: rotateX(0deg);
            }
            #vnav {
                transform: rotateX(0deg);
            }
            #wrapper[size="half"] #vnav {
                display: none;
            }
    </style>
    <div id="wrapper">
        <wt-navmapdisplaypane-flightplantextinset-main id="main"></wt-navmapdisplaypane-flightplantextinset-main>
        <wt-navmapdisplaypane-flightplantextinset-vnav id="vnav"></wt-navmapdisplaypane-flightplantextinset-vnav>
    </div>
`;

customElements.define(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement.NAME, WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement);

class WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetMainHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._flightPlanListener = this._onFlightPlanChanged.bind(this);
        this._flightPlanVNAVListener = this._onFlightPlanVNAVChanged.bind(this);

        /**
         * @type {WT_G3x5_BaseInstrument}
         */
        this._instrument = null;
        /**
         * @type {WT_FlightPlan}
         */
        this._flightPlan = null;
        /**
         * @type {WT_FlightPlanVNAV}
         */
        this._flightPlanVNAV = null;
        this._size = WT_G3x5_DisplayPane.Size.OFF;
        this._isDistanceCumulative = false;
        /**
         * @type {WT_G3x5_TSCFlightPlanRowHTMLElement[]}
         */
        this._visibleRows = [];
        this._activeArrowShow = null;
        this._activeArrowFrom = 0;
        this._activeArrowTo = 0;
        this._needRedrawFlightPlan = false;
        this._isInit = false;

        this._altitudeUnit = null;
    }

    _getTemplate() {
        return WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetMainHTMLElement.TEMPLATE;
    }

    async _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));

        this._disTitle = this.shadowRoot.querySelector(`#distitle`);
        this._eteTitle = this.shadowRoot.querySelector(`#etetitle`);
        this._rowsContainer = this.shadowRoot.querySelector(`#rowscontainer`);
        this._activeArrowStemRect = this.shadowRoot.querySelector(`#activearrowstem rect`);
        this._activeArrowHead = this.shadowRoot.querySelector(`#activearrowhead`);
    }

    _initRowRecycler() {
        this._rowRecycler = new WT_CustomHTMLElementRecycler(this._rowsContainer, WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement, (element => element.setInstrument(this._instrument)).bind(this));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initRowRecycler();
        this._isInit = true;
        if (this._flightPlan) {
            this._updateFromFlightPlan();
        }
        this._updateFromSize();
        this._updateFromDistanceCumulative();
        this._updateFromActiveArrowShow();
        this._updateFromActiveArrowPosition();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    /**
     *
     * @param {WT_G3x5_BaseInstrument} instrument
     */
    setInstrument(instrument) {
        if (!instrument || this._instrument) {
            return;
        }

        this._instrument = instrument;
    }

    _cleanUpFlightPlanRenderer() {
        this._flightPlanRenderer = null;
    }

    _cleanUpFlightPlanListener() {
        this._flightPlan.removeListener(this._flightPlanListener);
    }

    _cleanUpFlightPlanVNAVListener() {
        this._flightPlanVNAV.removeListener(this._flightPlanVNAVListener);
    }

    _cleanUpRows() {
        this._rowRecycler.recycleAll();
        this._visibleRows = [];
    }

    _cleanUpFlightPlan() {
        if (!this._flightPlan) {
            return;
        }

        this._cleanUpFlightPlanRenderer();
        this._cleanUpFlightPlanListener();
        this._cleanUpFlightPlanVNAVListener();
        this._cleanUpRows();
    }

    _initFlightPlanRenderer() {
        this._flightPlanRenderer = new WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRenderer(this, this._flightPlan, this._flightPlanVNAV);
    }

    _initFlightPlanListener() {
        this._flightPlan.addListener(this._flightPlanListener);
    }

    _initFlightPlanVNAVListener() {
        this._flightPlanVNAV.addListener(this._flightPlanVNAVListener);
    }

    _updateFromFlightPlan() {
        if (!this._flightPlan) {
            return;
        }

        this._initFlightPlanRenderer();
        this._initFlightPlanListener();
        this._initFlightPlanVNAVListener();
        this._drawFlightPlan();
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @param {WT_FlightPlanVNAV} flightPlanVNAV
     */
    setFlightPlan(flightPlan, flightPlanVNAV) {
        if (flightPlan === this._flightPlan) {
            return;
        }

        this._cleanUpFlightPlan();
        this._flightPlan = flightPlan;
        this._flightPlanVNAV = flightPlanVNAV;
        if (this._isInit) {
            this._updateFromFlightPlan();
        }
    }

    _updateFromSize() {
        this._wrapper.setAttribute("size", `${WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetMainHTMLElement.SIZE_ATTRIBUTES[this._size]}`);
        this._visibleRows.forEach(row => row.setSize(this._size), this);
    }

    /**
     *
     * @param {WT_G3x5_DisplayPane.Size} size
     */
    setSize(size) {
        if (this._size === size) {
            return;
        }

        this._size = size;
        if (this._isInit) {
            this._updateFromSize();
        }
    }

    _updateFromDistanceCumulative() {
        this._disTitle.innerHTML = this._isDistanceCumulative ? "Cum<br>DIS" : "Leg<br>DIS";
        this._eteTitle.innerHTML = this._isDistanceCumulative ? "Cum<br>ETE" : "Leg<br>ETE";
        this._visibleRows.forEach(row => row.setDistanceCumulative(this._isDistanceCumulative), this);
    }

    /**
     *
     * @param {Boolean} isCumulative
     */
    setDistanceCumulative(isCumulative) {
        if (this._isDistanceCumulative === isCumulative) {
            return;
        }

        this._isDistanceCumulative = isCumulative;
        if (this._isInit) {
            this._updateFromDistanceCumulative();
        }
    }

    _initRow(row) {
        row.setSize(this._size);
        row.setDistanceCumulative(this._isDistanceCumulative);
        this._visibleRows.push(row);
    }

    clearRows() {
        if (this._isInit) {
            this._cleanUpRows();
        }
    }

    requestRow() {
        if (this._isInit) {
            let row = this._rowRecycler.request();
            this._initRow(row);
            return row;
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
        let height = Math.max(0.01, Math.abs(this._activeArrowTo - this._activeArrowFrom)); // enforce minimum height b/c otherwise rendering will not be updated if height = 0

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

    _drawRows(isDirectToActive, activeLeg) {
        this._flightPlanRenderer.draw(isDirectToActive, activeLeg);
    }

    _drawFlightPlan(isDirectToActive, activeLeg) {
        this._drawRows(isDirectToActive, activeLeg);
    }

    _onFlightPlanChanged(event) {
        if (event.types !== WT_FlightPlanEvent.Type.LEG_ALTITUDE_CHANGED) {
            this._drawFlightPlan();
        }
    }

    _onFlightPlanVNAVChanged(source) {
        this._flightPlanRenderer.refreshAllAltitudeConstraints();
    }

    _updateFlightPlanRenderer(state) {
        this._flightPlanRenderer.update(state);
    }

    _updateAltitudeUnits() {
        let altitudeUnit = this._instrument.unitsSettingModel.altitudeSetting.getAltitudeUnit();
        if (!altitudeUnit.equals(this._altitudeUnit)) {
            this._altitudeUnit = altitudeUnit;
            this._flightPlanRenderer.refreshAllAltitudeConstraints();
        }
    }

    _updateUnits() {
        this._updateAltitudeUnits();
    }

    _doUpdate(state) {
        this._updateFlightPlanRenderer(state);
        this._updateUnits();
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     */
    update(state) {
        if (!this._isInit || !this._flightPlan) {
            return;
        }

        this._doUpdate(state);
    }
}
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetMainHTMLElement.SIZE_ATTRIBUTES = [
    "off",
    "full",
    "half"
];
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetMainHTMLElement.NAME = "wt-navmapdisplaypane-flightplantextinset-main";
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetMainHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetMainHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            border-radius: 3px;
            background: linear-gradient(#1f3445, black 25px);
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: absolute;
            left: var(--flightplantextinset-main-padding-left, 0.2em);
            top: var(--flightplantextinset-main-padding-top, 0.1em);
            width: calc(100% - var(--flightplantextinset-main-padding-left, 0.2em) - var(--flightplantextinset-main-padding-right, 0.2em));
            height: calc(100% - var(--flightplantextinset-main-padding-top, 0.1em) - var(--flightplantextinset-main-padding-bottom, 0.1em));
            display: grid;
            grid-template-rows: calc(var(--flightplantextinset-main-title-font-size, 0.85em) * 1) 1fr;
            grid-template-columns: 100%;
            grid-gap: var(--flightplantextinset-main-title-margin-bottom, 0) 0;
            --flightplantextinset-main-table-grid-columns: var(--flightplantextinset-main-table-grid-columns-full, 1.4fr 0.5fr 0.8fr 1fr 0.7fr 0.6fr 0.8fr);
        }
        #wrapper[size="half"] {
            --flightplantextinset-main-table-grid-columns: var(--flightplantextinset-main-table-grid-columns-half, 1.5fr 0.6fr 1fr 1.25fr);
        }
            #title {
                color: white;
                text-align: left;
                align-self: center;
                font-size: var(--flightplantextinset-main-title-font-size, 0.85em);
            }
            #table {
                position: relative;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-columns: 100%;
                grid-template-rows: calc(var(--flightplantextinset-main-table-header-font-size, 0.75em) * 2) 1fr;
                grid-gap: var(--flightplantextinset-main-table-header-margin-bottom, 0.1em) 0;
            }
                #header {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: grid;
                    grid-template-rows: 100%;
                    grid-template-columns: var(--flightplantextinset-main-table-grid-columns);
                    grid-gap: 0 var(--flightplan-main-table-grid-column-gap, 0.2em);
                    align-items: end;
                    justify-items: center;
                    border-bottom: solid 3px var(--wt-g3x5-bordergray);
                    font-size: var(--flightplantextinset-main-table-header-font-size, 0.75em);
                    line-height: 1.2em;
                    color: white;
                }
                    .title {
                        color: var(--flightplantextinset-field-title-color, #bebebe);
                    }
                    .fullSizeOnlyTitle {
                        display: none;
                    }
                    #wrapper[size="full"] .fullSizeOnlyTitle {
                        display: block;
                    }
                #rows {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
                    #rowscontainer {
                        position: relative;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        flex-flow: column nowrap;
                        align-items: stretch;
                    }
                        wt-navmapdisplaypane-flightplantextinset-row {
                            height: calc((100% - 4 * var(--flightplantextinset-main-table-row-margin-vertical, 0.1em)) / 5);
                            margin-bottom: var(--flightplantextinset-main-table-row-margin-vertical, 0.1em);
                        }
                    .activeArrow {
                        display: none;
                    }
                    #wrapper[activearrow-show="true"] .activeArrow {
                        display: block;
                    }
                    #activearrowstem {
                        position: absolute;
                        left: var(--flightplantextinset-table-arrow-left, 0.1em);
                        top: 0%;
                        width: calc(100% - var(--flightplantextinset-main-table-arrow-right, calc(100% - 1em)) - var(--flightplantextinset-main-table-arrow-left, 0.1em) - var(--flightplantextinset-main-table-arrow-head-size, 0.5em) / 2);
                        height: 100%;
                        transform: rotateX(0deg);
                    }
                        #activearrowstem rect {
                            stroke-width: var(--flightplantextinset-main-table-arrow-stroke-width, 0.2em);
                            stroke: var(--wt-g3x5-purple);
                            fill: transparent;
                            transform: translate(calc(var(--flightplantextinset-main-table-arrow-stroke-width, 0.2em) / 2), 0);
                        }
                    #activearrowhead {
                        position: absolute;
                        right: var(--flightplantextinset-main-table-arrow-right, calc(100% - 1em));
                        top: calc(-1 * var(--flightplantextinset-main-table-arrow-head-size, 0.5em) / 2);
                        width: var(--flightplantextinset-main-table-arrow-head-size, 0.5em);
                        height: var(--flightplantextinset-main-table-arrow-head-size, 0.5em);
                        transform: rotateX(0deg);
                    }
                        #activearrowhead polygon {
                            fill: var(--wt-g3x5-purple);
                        }
    </style>
    <div id="wrapper">
        <div id="title">Active Flight Plan</div>
        <div id="table">
            <div id="header">
                <div class="title"></div>
                <div id="dtktitle" class="title">DTK</div>
                <div id="distitle" class="title"></div>
                <div id="alttitle" class="title">ALT</div>
                <div id="fueltitle" class="title fullSizeOnlyTitle">Fuel<br>REM</div>
                <div id="etetitle" class="title fullSizeOnlyTitle"></div>
                <div id="etatitle" class="title fullSizeOnlyTitle">ETA</div>
            </div>
            <div id="rows">
                <div id="rowscontainer"></div>
                <svg id="activearrowstem" class="activeArrow">
                    <rect x="0" y="0" rx="2" ry="2" width="1000" height="0" />
                </svg>
                <svg id="activearrowhead" class="activeArrow" viewBox="0 0 86.6 100">
                    <polygon points="0,0 86.6,50 0,100" />
                </svg>
            </div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetMainHTMLElement.NAME, WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetMainHTMLElement);

class WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_G3x5_BaseInstrument}
         */
        this._instrument = null;
        /**
         * @type {WT_FlightPlan}
         */
        this._flightPlan = null;
        /**
         * @type {WT_FlightPlanVNAV}
         */
        this._flightPlanVNAV = null;
        this._size = WT_G3x5_DisplayPane.Size.OFF;
        this._isDistanceCumulative = false;
        /**
         * @type {WT_G3x5_TSCFlightPlanRowHTMLElement[]}
         */
        this._visibleRows = [];
        this._activeArrowShow = null;
        this._activeArrowFrom = 0;
        this._activeArrowTo = 0;
        this._needRedrawFlightPlan = false;
        this._isInit = false;

        this._tempSecond1 = WT_Unit.SECOND.createNumber(0);
        this._tempSecond2 = WT_Unit.SECOND.createNumber(0);
        this._tempFoot1 = WT_Unit.FOOT.createNumber(0);
        this._tempFoot2 = WT_Unit.FOOT.createNumber(0);
        this._tempNM = WT_Unit.NMILE.createNumber(0);
        this._tempFPM = WT_Unit.FPM.createNumber(0);
        this._tempKnot = WT_Unit.KNOT.createNumber(0);

        this._initFormatters();
    }

    _getTemplate() {
        return WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement.TEMPLATE;
    }

    _initDurationFormatter() {
        this._durationFormatter = new WT_TimeFormatter({
            pad: 1,
            timeFormat: WT_TimeFormatter.Format.HH_MM_OR_MM_SS,
            delim: WT_TimeFormatter.Delim.COLON_OR_CROSS
        });
    }

    _initAltitudeFormatter() {
        this._altitudeFormatter = new WT_NumberFormatter({
            precision: 1,
            unitCaps: true
        });
    }

    _initVerticalSpeedFormatter() {
        this._verticalSpeedFormatter = new WT_NumberFormatter({
            precision: 1,
            unitCaps: true
        });
    }

    _initFormatters() {
        this._initDurationFormatter();
        this._initAltitudeFormatter();
        this._initVerticalSpeedFormatter();
    }

    async _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector("#wrapper"));

        this._waypointIdentDisplay = new WT_CachedElement(this.shadowRoot.querySelector("#waypointident"), {cacheAttributes: false});
        this._waypointAltitudeNumber = new WT_CachedElement(this.shadowRoot.querySelector("#waypointaltitudenumber"), {cacheAttributes: false});
        this._waypointAltitudeUnit = new WT_CachedElement(this.shadowRoot.querySelector("#waypointaltitudeunit"), {cacheAttributes: false});

        this._timeToTitle = new WT_CachedElement(this.shadowRoot.querySelector("#timetotitle"), {cacheAttributes: false});
        this._timeToNumber = new WT_CachedElement(this.shadowRoot.querySelector("#timetonumber"), {cacheAttributes: false});
        this._fpaNumber = new WT_CachedElement(this.shadowRoot.querySelector("#fpanumber"), {cacheAttributes: false});
        this._vsTargetNumber = new WT_CachedElement(this.shadowRoot.querySelector("#vstargetnumber"), {cacheAttributes: false});
        this._vsTargetUnit = new WT_CachedElement(this.shadowRoot.querySelector("#vstargetunit"), {cacheAttributes: false});
        this._vsRequiredNumber = new WT_CachedElement(this.shadowRoot.querySelector("#vsrequirednumber"), {cacheAttributes: false});
        this._vsRequiredUnit = new WT_CachedElement(this.shadowRoot.querySelector("#vsrequiredunit"), {cacheAttributes: false});
        this._verticalDeviationNumber = new WT_CachedElement(this.shadowRoot.querySelector("#vertdevnumber"), {cacheAttributes: false});
        this._verticalDeviationUnit = new WT_CachedElement(this.shadowRoot.querySelector("#vertdevunit"), {cacheAttributes: false});
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    /**
     *
     * @param {WT_G3x5_BaseInstrument} instrument
     */
    setInstrument(instrument) {
        if (!instrument || this._instrument) {
            return;
        }

        this._instrument = instrument;
    }

    _setFieldsColorMode(mode) {
        this._wrapper.setAttribute("fields-color", mode);
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     * @param {WT_VNAVPathReadOnly} vnavPath
     */
    _updateWaypoint(state, vnavPath) {
        let waypoint = this._instrument.flightPlanManagerWT.getActiveVNAVWaypoint(true);

        let altitude = vnavPath.finalAltitude;
        this._waypointIdentDisplay.textContent = waypoint.ident;
        this._waypointAltitudeNumber.textContent = this._altitudeFormatter.getFormattedNumber(altitude, state.unitsModel.altitudeUnit);
        this._waypointAltitudeUnit.textContent = this._altitudeFormatter.getFormattedUnit(altitude, state.unitsModel.altitudeUnit);
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     */
    _clearWaypoint(state) {
        this._waypointIdentDisplay.textContent = "__________";
        this._waypointAltitudeNumber.textContent = "_____";
        this._waypointAltitudeUnit.textContent = this._altitudeFormatter.getFormattedUnit(this._tempFoot1, state.unitsModel.altitudeUnit);
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     * @param {WT_VNAVPathReadOnly} activeVNAVPath
     * @param {WT_NumberUnitObject} timeToTOD
     * @param {WT_NumberUnitObject} timeToBOD
     */
    _updateTimeTo(state, activeVNAVPath, timeToTOD, timeToBOD) {
        if (activeVNAVPath.deltaAltitude.number < 0 && timeToTOD && timeToBOD) {
            if (timeToTOD.number >= 0) {
                this._timeToTitle.textContent = "Time to TOD";
                this._timeToNumber.textContent = this._durationFormatter.getFormattedString(timeToTOD);
            } else {
                this._timeToTitle.textContent = "Time to BOD";
                this._timeToNumber.textContent = this._durationFormatter.getFormattedString(timeToBOD);
            }
        } else {
            this._timeToTitle.textContent = "Time to BOD";
            this._timeToNumber.textContent = "__:__";
        }
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     * @param {WT_VNAVPathReadOnly} activeVNAVPath
     */
    _updateFPA(state, activeVNAVPath) {
        this._fpaNumber.textContent = activeVNAVPath.getFlightPathAngle().toFixed(2);
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     * @param {WT_VNAVPathReadOnly} activeVNAVPath
     * @param {WT_NumberUnitReadOnly} groundSpeed
     */
    _updateVSTarget(state, activeVNAVPath, groundSpeed) {
        let vsTarget = activeVNAVPath.getVerticalSpeedTarget(groundSpeed, this._tempFPM);
        this._vsTargetNumber.textContent = this._verticalSpeedFormatter.getFormattedNumber(vsTarget, state.unitsModel.verticalSpeedUnit);
        this._vsTargetUnit.textContent = this._verticalSpeedFormatter.getFormattedUnit(vsTarget, state.unitsModel.verticalSpeedUnit);
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     * @param {WT_VNAVPathReadOnly} activeVNAVPath
     * @param {Boolean} hasReachedTOD
     * @param {WT_NumberUnitObject} distanceRemaining
     * @param {WT_NumberUnitObject} altitude
     * @param {WT_NumberUnitObject} groundSpeed
     */
    _updateVSRequired(state, activeVNAVPath, hasReachedTOD, distanceRemaining, altitude, groundSpeed) {
        if (hasReachedTOD) {
            let vsRequired = activeVNAVPath.getVerticalSpeedRequiredAt(distanceRemaining, altitude, groundSpeed, this._tempFPM);
            this._vsRequiredNumber.textContent = this._verticalSpeedFormatter.getFormattedNumber(vsRequired, state.unitsModel.verticalSpeedUnit);
            this._vsRequiredUnit.textContent = this._verticalSpeedFormatter.getFormattedUnit(vsRequired, state.unitsModel.verticalSpeedUnit);
        } else {
            this._vsRequiredNumber.textContent = "_____";
            this._vsRequiredUnit.textContent = this._verticalSpeedFormatter.getFormattedUnit(this._tempFPM, state.unitsModel.verticalSpeedUnit);
        }
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     * @param {WT_VNAVPathReadOnly} activeVNAVPath
     * @param {Boolean} hasReachedTOD
     * @param {WT_NumberUnitObject} distanceRemaining
     * @param {WT_NumberUnitObject} altitude
     */
    _updateVerticalDeviation(state, activeVNAVPath, hasReachedTOD, distanceRemaining, altitude) {
        if (hasReachedTOD) {
            let verticalDeviation = activeVNAVPath.getVerticalDeviationAt(distanceRemaining, altitude, true, this._tempFoot2);
            this._verticalDeviationNumber.textContent = this._altitudeFormatter.getFormattedNumber(verticalDeviation, state.unitsModel.altitudeUnit);
            this._verticalDeviationUnit.textContent = this._altitudeFormatter.getFormattedUnit(verticalDeviation, state.unitsModel.altitudeUnit);
        } else {
            this._verticalDeviationNumber.textContent = "_____";
            this._verticalDeviationUnit.textContent = this._altitudeFormatter.getFormattedUnit(this._tempFoot1, state.unitsModel.altitudeUnit);
        }
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     * @param {WT_VNAVPathReadOnly} activeVNAVPath
     */
    _updateFields(state, activeVNAVPath) {
        let altitude = this._instrument.airplane.sensors.getAltimeter(this._instrument.flightPlanManagerWT.altimeterIndex).altitudeIndicated(this._tempFoot1);
        let distanceRemaining = this._instrument.flightPlanManagerWT.distanceToActiveVNAVWaypoint(true, this._tempNM);
        let groundSpeed = this._instrument.airplane.navigation.groundSpeed(this._tempKnot);
        let timeToTOD = this._instrument.flightPlanManagerWT.timeToActiveVNAVPathStart(true, this._tempSecond1);
        let timeToBOD = this._instrument.flightPlanManagerWT.timeToActiveVNAVWaypoint(true, this._tempSecond2);

        let hasReachedTOD = activeVNAVPath.deltaAltitude.number === 0 || !(timeToTOD && timeToBOD && timeToTOD.number >= 0);
        if (hasReachedTOD) {
            this._setFieldsColorMode("bod");
        } else {
            this._setFieldsColorMode("tod");
        }

        this._updateTimeTo(state, activeVNAVPath, timeToTOD, timeToBOD);
        this._updateFPA(state, activeVNAVPath);
        this._updateVSTarget(state, activeVNAVPath, groundSpeed);
        this._updateVSRequired(state, activeVNAVPath, hasReachedTOD, distanceRemaining, altitude, groundSpeed);
        this._updateVerticalDeviation(state, activeVNAVPath, hasReachedTOD, distanceRemaining, altitude);
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     */
    _clearFields(state) {
        this._timeToTitle.textContent = "Time to BOD";
        this._timeToNumber.textContent = "__:__";

        this._fpaNumber.textContent = "_____";

        this._vsTargetNumber.textContent = "_____";
        this._vsTargetUnit.textContent = this._verticalSpeedFormatter.getFormattedUnit(this._tempFPM, state.unitsModel.verticalSpeedUnit);

        this._vsRequiredNumber.textContent = "_____";
        this._vsRequiredUnit.textContent = this._verticalSpeedFormatter.getFormattedUnit(this._tempFPM, state.unitsModel.verticalSpeedUnit);

        this._verticalDeviationNumber.textContent = "_____";
        this._verticalDeviationUnit.textContent = this._altitudeFormatter.getFormattedUnit(this._tempFoot1, state.unitsModel.altitudeUnit);

        this._setFieldsColorMode("none");
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     */
    _doUpdate(state) {
        let vnavPath = this._instrument.flightPlanManagerWT.getActiveVNAVPath(true);
        if (vnavPath && vnavPath.deltaAltitude.number <= 0) {
            this._updateWaypoint(state, vnavPath);
            this._updateFields(state, vnavPath);
        } else {
            this._clearWaypoint(state);
            this._clearFields(state);
        }
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     */
    update(state) {
        if (!this._isInit || !this._instrument) {
            return;
        }

        this._doUpdate(state);
    }
}
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement.NAME = "wt-navmapdisplaypane-flightplantextinset-vnav";
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            border-radius: 3px;
            background: linear-gradient(#1f3445, black 25px);
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: absolute;
            left: var(--flightplantextinset-vnav-padding-left, 0.2em);
            top: var(--flightplantextinset-vnav--padding-top, 0.1em);
            width: calc(100% - var(--flightplantextinset-vnav--padding-left, 0.2em) - var(--flightplantextinset-vnav--padding-right, 0.2em));
            height: calc(100% - var(--flightplantextinset-vnav--padding-top, 0.1em) - var(--flightplantextinset-vnav--padding-bottom, 0.1em));
            display: grid;
            grid-template-rows: calc(var(--flightplantextinset-vnav-title-font-size, 0.85em) * 1) 1fr;
            grid-template-columns: 100%;
            grid-gap: var(--flightplantextinset-main-vnav-margin-bottom, 0.2em) 0;
            color: white;
        }
            #title {
                color: white;
                text-align: left;
                align-self: center;
                font-size: var(--flightplantextinset-vnav-title-font-size, 0.85em);
            }
            #info {
                position: relative;
                font-size: var(--flightplantext-inset-vnav-info-font-size, 0.75em);
            }
                #waypoint {
                    position: absolute;
                    left: 0%;
                    top: 0%;
                    width: 100%;
                    height: var(--flightplantext-inset-vnav-waypoint-height, 3em);
                }
                    #waypointtitle {
                        position: absolute;
                        left: 0%;
                        top: 25%;
                        width: 100%;
                        transform: translateY(-50%);
                        text-align: center;
                        color: var(--flightplantext-inset-field-title-color, #bebebe);
                    }
                    #waypointident {
                        position: absolute;
                        left: 0%;
                        top: 75%;
                        transform: translateY(-50%);
                    }
                    #waypointaltitude {
                        position: absolute;
                        left: 50%;
                        top: 75%;
                        transform: translateY(-50%);
                    }
                #fields {
                    position: absolute;
                    left: 0%;
                    bottom: 0%;
                    width: 100%;
                    height: calc(100% - var(--flightplantext-inset-vnav-waypoint-height, 3em) - var(--flightplantext-inset-vnav-waypoint-margin-bottom, 0.2em));
                    display: grid;
                    grid-template-rows: repeat(5, 1fr);
                    grid-template-columns: var(--flightplantext-inset-vnav-fields-grid-columns, 2.75fr 2.25fr 1fr);
                    grid-gap: 0 var(--flightplantext-inset-vnav-fields-grid-column-gap, 0.1em);
                    align-items: end;
                    text-align: left;
                }
                    .title {
                        color: var(--flightplantextinset-field-title-color, #bebebe);
                    }
                    .number {
                        text-align: right;
                    }
                    #wrapper[fields-color="tod"] .fpa,
                    #wrapper[fields-color="tod"] .vsTarget,
                    #wrapper[fields-color="bod"] .fpa,
                    #wrapper[fields-color="bod"] .vsTarget {
                        color: var(--wt-g3x5-lightblue);
                    }

        .${WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement.UNIT_CLASS} {
            font-size: var(--flightplantextinset-vnav-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <div id="title">Current VNAV Profile</div>
        <div id="info">
            <div id="waypoint">
                <div id="waypointtitle">Active VNAV Waypoint</div>
                <div id="waypointident"></div>
                <div id="waypointaltitude">
                    <span id="waypointaltitudenumber"></span><span id="waypointaltitudeunit" class=${WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement.UNIT_CLASS}></span>
                </div>
            </div>
            <div id="fields">
                <div id="timetotitle" class="timeTo title"></div>
                <div id="timetonumber" class="timeTo value number"></div>
                <div id="timetounit" class="timeTo value ${WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement.UNIT_CLASS}"></div>
                <div id="fpatitle" class="fpa title">FPA</div>
                <div id="fpanumber" class="fpa value number"></div>
                <div id="fpaunit" class="fpa value">°</div>
                <div id="vstargettitle" class="vsTarget title">VS TGT</div>
                <div id="vstargetnumber" class="vsTarget number"></div>
                <div id="vstargetunit" class="vsTarget ${WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement.UNIT_CLASS}"></div>
                <div id="vsrequiredtitle" class="vsRequired title">VS REQ</div>
                <div id="vsrequirednumber" class="vsRequired number"></div>
                <div id="vsrequiredunit" class="vsRequired ${WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement.UNIT_CLASS}"></div>
                <div id="vertdevtitle" class="vertDev title">V DEV</div>
                <div id="vertdevnumber" class="vertDev number"></div>
                <div id="vertdevunit" class="vertDev ${WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement.UNIT_CLASS}"></div>
            </div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement.NAME, WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetVNAVHTMLElement);

class WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._mode = WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.Mode.NONE;
        this._isInit = false;

        this._initChildren();
    }

    _getTemplate() {
        return WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.TEMPLATE;
    }

    _initLeg() {
        this._leg = new WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement();
        this._leg.id = WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.MODE_IDS[WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.Mode.LEG];
        this._leg.classList.add("mode");
        this._modeHTMLElements.push(this._leg);
    }

    _initHeader() {
        this._header = new WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHeaderHTMLElement();
        this._header.id = WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.MODE_IDS[WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.Mode.HEADER];
        this._header.classList.add("mode");
        this._modeHTMLElements.push(this._header);
    }

    _initAirwayFooter() {
        this._airwayFooter = new WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowAirwaySequenceFooterHTMLElement();
        this._airwayFooter.id = WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.MODE_IDS[WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.Mode.AIRWAY_FOOTER];
        this._airwayFooter.classList.add("mode");
        this._modeHTMLElements.push(this._airwayFooter);
    }

    _initChildren() {
        this._modeHTMLElements = [null];
        this._initLeg();
        this._initHeader();
        this._initAirwayFooter();
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

    _initFromInstrument() {
        this._leg.setInstrument(this._instrument);
        this._airwayFooter.setInstrument(this._instrument);
    }

    /**
     *
     * @param {WT_G3x5_BaseInstrument} instrument
     */
    setInstrument(instrument) {
        if (!instrument || this._instrument) {
            return;
        }

        this._instrument = instrument;
        this._initFromInstrument();
    }

    /**
     *
     * @param {WT_G3x5_DisplayPane.Size} size
     */
    setSize(size) {
        this._modeHTMLElements.forEach(element => {
            if (element) {
                element.setSize(size);
            }
        });
    }

    /**
     *
     * @param {Boolean} isCumulative
     */
    setDistanceCumulative(isCumulative) {
        this._modeHTMLElements.forEach(element => {
            if (element) {
                element.setDistanceCumulative(isCumulative);
            }
        });
    }

    /**
     *
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.Mode}
     */
    getMode() {
        return this._mode;
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.Mode} mode
     */
    setMode(mode) {
        if (this._mode !== mode) {
            this.setAttribute("mode", WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.MODE_IDS[mode]);
            this._mode = mode;
        }
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.Mode} mode
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

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     */
    _doUpdate(state) {
        let activeModeHTMLElement = this.getActiveModeHTMLElement();
        if (activeModeHTMLElement) {
            activeModeHTMLElement.update(state);
        }
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     */
    update(state) {
        if (!this._isInit) {
            return;
        }

        this._doUpdate(state);
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.Mode = {
    NONE: 0,
    LEG: 1,
    HEADER: 2,
    AIRWAY_FOOTER: 3
}
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.MODE_IDS = [
    "",
    "leg",
    "header",
    "airwayfooter"
];
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.NAME = "wt-navmapdisplaypane-flightplantextinset-row";
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
        }

        .mode {
            display: none;
        }

        :host([mode=${WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.MODE_IDS[WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.Mode.LEG]}]) #leg {
            display: block;
        }
        :host([mode=${WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.MODE_IDS[WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.Mode.HEADER]}]) #header {
            display: block;
        }
        :host([mode=${WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.MODE_IDS[WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.Mode.AIRWAY_FOOTER]}]) #airwayfooter {
            display: block;
        }
    </style>
`;

customElements.define(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.NAME, WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement);

class WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_G3x5_BaseInstrument}
         */
        this._instrument = null;
        this._size = WT_G3x5_DisplayPane.Size.OFF;
        this._isDistanceCumulative = false;
        /**
         * @type {WT_FlightPlanLeg}
         */
        this._leg = null;
        /**
         * @type {WT_FlightPlanVNAVLegRestriction}
         */
        this._vnavLegRestriction = null;
        this._indent = 0;
        this._bearingUnit = null;
        this._distanceUnit = null;
        this._fuelUnit = null;
        this._needUpdateDataFields = false;
        this._dynamicDataFieldUpdateTime = 0;

        this._isActive = false;
        this._isInit = false;

        this._tempNM = WT_Unit.NMILE.createNumber(0);
        this._tempKnots = WT_Unit.KNOT.createNumber(0);
        this._tempGallons = WT_Unit.GALLON_FUEL.createNumber(0);
        this._tempGPH = WT_Unit.GPH_FUEL.createNumber(0);
    }

    _getTemplate() {
        return WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.TEMPLATE;
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
     * @type {WT_FlightPlanLeg}
     */
    get leg() {
        return this._leg;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        this._waypointDisplay = this.shadowRoot.querySelector(`#waypoint`);

        [
            this._altitudeConstraint,
            this._dtkField,
            this._disField,
            this._fuelField,
            this._eteField,
            this._etaField
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#altconstraint`, WT_G3x5_NavMapDisplayPaneFlightPlanInsetLegAltitudeConstraintHTMLElement),
            WT_CustomElementSelector.select(this.shadowRoot, `#dtk`, WT_G3x5_NavDataInfoView),
            WT_CustomElementSelector.select(this.shadowRoot, `#dis`, WT_G3x5_NavDataInfoView),
            WT_CustomElementSelector.select(this.shadowRoot, `#fuel`, WT_G3x5_NavDataInfoView),
            WT_CustomElementSelector.select(this.shadowRoot, `#ete`, WT_G3x5_NavDataInfoView),
            WT_CustomElementSelector.select(this.shadowRoot, `#eta`, WT_G3x5_NavDataInfoView),
        ]);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        this._updateFromSize();
        this._updateFromDistanceCumulative();
        this._updateFromLeg();
        this._updateFromIndent();
        this._updateFromActive();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateCumulativeDistance(value) {
        value.set(this.leg ? this.leg.cumulativeDistance : NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateLegDistance(value) {
        value.set(this.leg ? this.leg.distance : NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateDTK(value) {
        if (this.leg) {
            value.unit.setLocation(this.leg.desiredTrack.unit.location);
            value.set(this.leg.desiredTrack);
        } else {
            value.set(NaN);
        }
    }

    /**
     *
     * @param {WT_Time} time
     */
    _updateETA(time) {
        if (this.leg && !this._instrument.airplane.sensors.isOnGround()) {
            let fpm = this._instrument.flightPlanManagerWT;
            let activeLeg = fpm.directTo.isActive() ? fpm.getDirectToLeg(true) : fpm.getActiveLeg(true);
            if (activeLeg && activeLeg.flightPlan === this.leg.flightPlan && activeLeg.index <= this.leg.index) {
                let distanceToActiveLegFixNM = fpm.directTo.isActive() ? fpm.distanceToDirectTo(true, this._tempNM).number : fpm.distanceToActiveLegFix(true, this._tempNM).number;
                let distanceNM = this.leg.cumulativeDistance.asUnit(WT_Unit.NMILE) - activeLeg.cumulativeDistance.asUnit(WT_Unit.NMILE) + distanceToActiveLegFixNM;
                let speed = this._instrument.airplane.navigation.groundSpeed(this._tempKnots);
                if (speed.compare(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.MIN_COMPUTE_SPEED) >= 0) {
                    let ete = distanceNM / speed.number;
                    time.set(this._instrument.time);
                    time.add(ete, WT_Unit.HOUR);
                    return;
                }
            }
        }
        time.set(NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateLegETE(value) {
        if (this.leg && !this._instrument.airplane.sensors.isOnGround()) {
            let distanceNM = this.leg.distance.asUnit(WT_Unit.NMILE);
            let speed = this._instrument.airplane.navigation.groundSpeed(this._tempKnots);
            value.set(speed.compare(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.MIN_COMPUTE_SPEED) >= 0 ? (distanceNM / speed.number) : NaN, WT_Unit.HOUR);
        } else {
            value.set(NaN);
        }
    }

    _updateCumulativeETE(value) {
        if (this.leg && !this._instrument.airplane.sensors.isOnGround()) {
            let distanceNM = this.leg.cumulativeDistance.asUnit(WT_Unit.NMILE);
            let speed = this._instrument.airplane.navigation.groundSpeed(this._tempKnots);
            value.set(speed.compare(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.MIN_COMPUTE_SPEED) >= 0 ? (distanceNM / speed.number) : NaN, WT_Unit.HOUR);
        } else {
            value.set(NaN);
        }
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateFuelRemaining(value) {
        if (this.leg && !this._instrument.airplane.sensors.isOnGround()) {
            let fpm = this._instrument.flightPlanManagerWT;
            let activeLeg = fpm.directTo.isActive() ? fpm.getDirectToLeg(true) : fpm.getActiveLeg(true);
            if (activeLeg && activeLeg.flightPlan === this.leg.flightPlan && activeLeg.index <= this.leg.index) {
                let distanceToActiveLegFixNM = fpm.directTo.isActive() ? fpm.distanceToDirectTo(true, this._tempNM).number : fpm.distanceToActiveLegFix(true, this._tempNM).number;
                let distanceToLeg = this.leg.cumulativeDistance.asUnit(WT_Unit.NMILE) - activeLeg.cumulativeDistance.asUnit(WT_Unit.NMILE) + distanceToActiveLegFixNM;
                let speed = this._instrument.airplane.navigation.groundSpeed(this._tempKnots);
                let currentFuelGal = this._instrument.airplane.engineering.fuelOnboard(this._tempGallons).number;
                let fuelFlow = this._instrument.airplane.engineering.fuelFlowTotal(this._tempGPH);
                value.set((speed.compare(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.MIN_COMPUTE_SPEED) >= 0 && fuelFlow.compare(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.MIN_COMPUTE_FUEL_FLOW) >= 0) ? (currentFuelGal - distanceToLeg / speed.number * fuelFlow.number) : NaN, WT_Unit.GALLON_FUEL);
                return;
            }
        }
        value.set(NaN);
    }

    _initNavDataInfos() {
        this._dtkInfo = new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "DTK"}, new WT_NumberUnitModelAutoUpdated(new WT_NavAngleUnit(true), {updateValue: this._updateDTK.bind(this)}));
        this._cumDisInfo = new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "CUM"}, new WT_NumberUnitModelAutoUpdated(WT_Unit.NMILE, {updateValue: this._updateCumulativeDistance.bind(this)}));
        this._legDisInfo = new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "DIS"}, new WT_NumberUnitModelAutoUpdated(WT_Unit.NMILE, {updateValue: this._updateLegDistance.bind(this)}));
        this._fuelInfo = new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "FUEL"}, new WT_NumberUnitModelAutoUpdated(WT_Unit.GALLON_FUEL, {updateValue: this._updateFuelRemaining.bind(this)}));
        this._legETEInfo = new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "ETE"}, new WT_NumberUnitModelAutoUpdated(WT_Unit.SECOND, {updateValue: this._updateLegETE.bind(this)}));
        this._cumETEInfo = new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "ETE"}, new WT_NumberUnitModelAutoUpdated(WT_Unit.SECOND, {updateValue: this._updateCumulativeETE.bind(this)}));
        this._etaInfo = new WT_G3x5_NavDataInfoTime({shortName: "", longName: "ETA"}, new WT_G3x5_TimeModel(new WT_TimeModelAutoUpdated("", {updateTime: this._updateETA.bind(this)}), this._instrument.avionicsSystemSettingModel.timeFormatSetting, this._instrument.avionicsSystemSettingModel.timeLocalOffsetSetting));
    }

    _initNavDataFormatters() {
        let bearingFormatter = new WT_NumberFormatter({
            precision: 1,
            unitSpaceBefore: false
        });

        let distanceFormatter = new WT_NumberFormatter({
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        });

        let fuelFormatter = new WT_NumberFormatter({
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        });

        let durationFormatter = new WT_TimeFormatter({
            timeFormat: WT_TimeFormatter.Format.HH_MM_OR_MM_SS,
            delim: WT_TimeFormatter.Delim.COLON_OR_CROSS
        });

        this._bearingInfoFormatter = new WT_G3x5_NavDataInfoViewDegreeFormatter(bearingFormatter);
        this._distanceInfoFormatter = new WT_G3x5_NavDataInfoViewNumberFormatter(distanceFormatter);
        this._volumeInfoFormatter = new WT_G3x5_NavDataInfoViewNumberFormatter(fuelFormatter);
        this._durationInfoFormatter = new WT_G3x5_NavDataInfoViewDurationFormatter(durationFormatter, "__:__");
        this._timeInfoFormatter = new WT_G3x5_NavDataInfoViewTimeFormatter();
    }

    _initFromInstrument() {
        this._initNavDataInfos();
        this._initNavDataFormatters();
    }

    /**
     *
     * @param {AS3000_TSC} instrument
     */
    setInstrument(instrument) {
        if (!instrument || this._instrument) {
            return;
        }

        this._instrument = instrument;
        this._initFromInstrument();
    }

    _updateFromSize() {
        this._wrapper.setAttribute("size", `${WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement.SIZE_ATTRIBUTES[this._size]}`);
        this._needUpdateDataFields = true;
    }

    /**
     *
     * @param {WT_G3x5_DisplayPane.Size} size
     */
    setSize(size) {
        if (this._size === size) {
            return;
        }

        this._size = size;
        if (this._isInit) {
            this._updateFromSize();
        }
    }

    _updateFromDistanceCumulative() {
        this._needUpdateDataFields = true;
    }

    /**
     *
     * @param {WT_G3x5_DisplayPane.Size} isCumulative
     */
    setDistanceCumulative(isCumulative) {
        if (this._isDistanceCumulative === isCumulative) {
            return;
        }

        this._isDistanceCumulative = isCumulative;
        if (this._isInit) {
            this._updateFromDistanceCumulative();
        }
    }

    _clearWaypoint() {
        this._waypointDisplay.textContent = "";
    }

    _clearAltitudeConstraint() {
        this._altitudeConstraint.update(null, null, this._instrument.unitsSettingModel.altitudeSetting.getAltitudeUnit());
    }

    _updateWaypointFromLeg() {
        this._waypointDisplay.textContent = this._leg.fix.ident;
    }

    _updateAltitudeConstraint() {
        this._altitudeConstraint.update(this._leg.altitudeConstraint, this._vnavLegRestriction, this._instrument.unitsSettingModel.altitudeSetting.getAltitudeUnit());
    }

    _updateAllDataFields() {
        this._dtkField.update(this._dtkInfo, this._bearingInfoFormatter);
        this._disField.update(this._isDistanceCumulative ? this._cumDisInfo : this._legDisInfo, this._distanceInfoFormatter);
        this._updateDynamicDataFields();
        this._needUpdateDataFields = false;
    }

    _updateFromLeg() {
        if (this._leg) {
            this._updateWaypointFromLeg();
            this._updateAltitudeConstraint();
        } else {
            this._clearWaypoint();
            this._clearAltitudeConstraint();
        }
        this._updateAllDataFields();
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    setLeg(leg) {
        this._leg = leg;
        if (this._isInit) {
            this._updateFromLeg();
        }
    }

    _updateFromVNAVLegRestriction() {
        this._updateAltitudeConstraint();
    }

    /**
     *
     * @param {WT_FlightPlanVNAVLegRestriction} restriction
     */
    setVNAVLegRestriction(restriction) {
        if (this._vnavLegRestriction === restriction) {
            return;
        }

        this._vnavLegRestriction = restriction;
        if (this._isInit) {
            this._updateFromVNAVLegRestriction();
        }
    }

    _updateFromIndent() {
        this._waypointDisplay.style.paddingLeft = `${this._indent * 0.5}em`;
    }

    /**
     *
     * @param {Number} indent
     */
    setIndent(indent) {
        this._indent = indent;
        if (this._isInit) {
            this._updateFromIndent();
        }
    }

    _updateFromActive() {
        this._wrapper.setAttribute("active", `${this._isActive}`);
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

    refreshAltitudeConstraint() {
        if (!this._isInit) {
            return;
        }

        this._updateAltitudeConstraint();
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanUnitsModel} unitsModel
     * @returns {Boolean}
     */
    _updateDataFieldUnits(unitsModel) {
        if (!unitsModel.bearingUnit.equals(this._bearingUnit)) {
            this._bearingUnit = unitsModel.bearingUnit;
            this._dtkInfo.setDisplayUnit(this._bearingUnit);
            this._needUpdateDataFields = true;
        }
        if (!unitsModel.distanceUnit.equals(this._distanceUnit)) {
            this._distanceUnit = unitsModel.distanceUnit;
            this._legDisInfo.setDisplayUnit(this._distanceUnit);
            this._cumDisInfo.setDisplayUnit(this._distanceUnit);
            this._needUpdateDataFields = true;
        }
        if (!unitsModel.fuelUnit.equals(this._fuelUnit)) {
            this._fuelUnit = unitsModel.fuelUnit;
            this._fuelInfo.setDisplayUnit(this._fuelUnit);
            this._needUpdateDataFields = true;
        }
    }

    _updateDynamicDataFields() {
        if (this._size !== WT_G3x5_DisplayPane.Size.FULL) {
            return;
        }

        this._fuelField.update(this._fuelInfo, this._volumeInfoFormatter);
        this._eteField.update(this._isDistanceCumulative ? this._cumETEInfo : this._legETEInfo, this._durationInfoFormatter);
        this._etaField.update(this._etaInfo, this._timeInfoFormatter);

        this._dynamicDataFieldUpdateTime = this._instrument.currentTimeStamp;
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanUnitsModel} unitsModel
     */
    _updateDataFields(unitsModel) {
        this._updateDataFieldUnits(unitsModel);
        if (this._needUpdateDataFields) {
            this._updateAllDataFields();
        } else if (this._instrument.currentTimeStamp - this._dynamicDataFieldUpdateTime >= WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.DYNAMIC_DATA_FIELD_UPDATE_INTERVAL) {
            this._updateDynamicDataFields();
        }
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     */
    update(state) {
        if (!this._isInit || !this._leg) {
            return;
        }

        this._updateDataFields(state.unitsModel);
    }
}
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.MIN_COMPUTE_SPEED = WT_Unit.KNOT.createNumber(30);
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.MIN_COMPUTE_FUEL_FLOW = WT_Unit.GPH_FUEL.createNumber(1);
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.DYNAMIC_DATA_FIELD_UPDATE_INTERVAL = 2000; // ms
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.NAME = "wt-navmapdisplaypane-flightplantextinset-row-leg";
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.TEMPLATE.innerHTML = `
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
            grid-template-columns: var(--flightplantextinset-main-table-grid-columns);
            grid-gap: 0 var(--flightplantextinset-main-table-grid-column-gap, 0.2em);
            justify-items: stretch;
            align-items: center;
        }
            #waypoint {
                text-align: left;
                color: var(--wt-g3x5-lightblue);
                white-space: nowrap;
                overflow: hidden;
            }
            #wrapper[active="true"] #waypoint {
                color: var(--wt-g3x5-purple);
            }
            .dataFieldContainer {
                position: relative;
            }
            .fullSizeOnly {
                display: none;
            }
            #wrapper[size="full"] .fullSizeOnly {
                display: block;
            }
                wt-navdatainfo-view {
                    position: absolute;
                    left: 0%;
                    top: 50%;
                    width: 100%;
                    height: auto;
                    --navdatainfo-justify-content: flex-end;
                    transform: translateY(-50%) rotateX(0deg);
                }
                #wrapper[active="true"] wt-navdatainfo-view {
                    --navdatainfo-value-color: var(--wt-g3x5-purple);
                }
    </style>
    <div id="wrapper">
        <div id="waypoint"></div>
        <div class="dataFieldContainer">
            <wt-navdatainfo-view id="dtk" class="dataField"></wt-navdatainfo-view>
        </div>
        <div class="dataFieldContainer">
            <wt-navdatainfo-view id="dis" class="dataField"></wt-navdatainfo-view>
        </div>
        <wt-navmapdisplaypane-flightplantextinset-row-altitudeconstraint id="altconstraint" slot="content"></wt-navmapdisplaypane-flightplantextinset-row-altitudeconstraint>
        <div class="dataFieldContainer fullSizeOnly">
            <wt-navdatainfo-view id="fuel" class="dataField"></wt-navdatainfo-view>
        </div>
        <div class="dataFieldContainer fullSizeOnly">
            <wt-navdatainfo-view id="ete" class="dataField"></wt-navdatainfo-view>
        </div>
        <div class="dataFieldContainer fullSizeOnly">
            <wt-navdatainfo-view id="eta" class="dataField"></wt-navdatainfo-view>
        </div>
    </div>
`;

customElements.define(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.NAME, WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement);

class WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowAirwaySequenceFooterHTMLElement extends WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement {
    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateLegDistance(value) {
        value.set(this.leg ? this.leg.parent.distance : NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateDTK(value) {
        value.set(NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateLegETE(value) {
        if (this.leg && !this._instrument.airplane.sensors.isOnGround()) {
            let distanceNM = this.leg.parent.distance.asUnit(WT_Unit.NMILE);
            let speed = this._instrument.airplane.navigation.groundSpeed(this._tempKnots);
            value.set(speed.compare(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowLegHTMLElement.MIN_COMPUTE_SPEED) >= 0 ? (distanceNM / speed.number) : NaN, WT_Unit.HOUR);
        } else {
            value.set(NaN);
        }
    }
}
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowAirwaySequenceFooterHTMLElement.NAME = "wt-navmapdisplaypane-flightplantextinset-row-airwayfooter";

customElements.define(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowAirwaySequenceFooterHTMLElement.NAME, WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowAirwaySequenceFooterHTMLElement);

class WT_G3x5_NavMapDisplayPaneFlightPlanInsetLegAltitudeConstraintHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_FlightPlanLegAltitudeConstraint}
         */
        this._legConstraint = null;
        /**
         * @type {WT_FlightPlanVNAVLegRestriction}
         */
        this._vnavLegRestriction = null;
        this._altitudeUnit = null;
        this._isInit = false;

        this._initFormatter();
    }

    _getTemplate() {
        return WT_G3x5_NavMapDisplayPaneFlightPlanInsetLegAltitudeConstraintHTMLElement.TEMPLATE;
    }

    _initFormatter() {
        let formatterOpts = {
            precision: 1,
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                _numberClassList: [],
                _unitClassList: [WT_G3x5_NavMapDisplayPaneFlightPlanInsetLegAltitudeConstraintHTMLElement.UNIT_CLASS],
                getNumberClassList() {
                    return this._numberClassList;
                },
                getUnitClassList() {
                    return this._unitClassList;
                }
            }
        };
        this._altitudeFormatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);
    }

    _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        this._ceilText = this.shadowRoot.querySelector(`#ceiltext`);
        this._floorText = this.shadowRoot.querySelector(`#floortext`);
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
        this._doUpdate();
    }

    _setDesignated(value) {
        this._wrapper.setAttribute("designated", `${value}`);
    }

    _setInvalid(value) {
        this._wrapper.setAttribute("invalid", `${value}`);
    }

    _displayNone() {
        this._ceilText.innerHTML = `_____${this._altitudeFormatter.getFormattedUnitHTML(WT_Unit.FOOT.createNumber(0), this._altitudeUnit)}`;
        this._wrapper.setAttribute("mode", "none");
    }

    _displayCustomAltitude(altitude) {
        this._ceilText.innerHTML = this._altitudeFormatter.getFormattedHTML(altitude, this._altitudeUnit);
        this._wrapper.setAttribute("mode", "custom");
    }

    _displayDefaultAltitude(altitude) {
        this._ceilText.innerHTML = this._altitudeFormatter.getFormattedHTML(altitude, this._altitudeUnit);
        this._wrapper.setAttribute("mode", "default");
    }

    /**
     *
     * @param {WT_AltitudeConstraint} constraint
     */
    _displayPublishedConstraint(constraint) {
        switch (constraint.type) {
            case WT_AltitudeConstraint.Type.AT_OR_ABOVE:
                this._floorText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.floor, this._altitudeUnit);
                this._wrapper.setAttribute("mode", "above");
                break;
            case WT_AltitudeConstraint.Type.AT_OR_BELOW:
                this._ceilText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.ceiling, this._altitudeUnit);
                this._wrapper.setAttribute("mode", "below");
                break;
            case WT_AltitudeConstraint.Type.AT:
                this._ceilText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.ceiling, this._altitudeUnit);
                this._wrapper.setAttribute("mode", "at");
                break;
            case WT_AltitudeConstraint.Type.BETWEEN:
                this._ceilText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.ceiling, this._altitudeUnit);
                this._floorText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.floor, this._altitudeUnit);
                this._wrapper.setAttribute("mode", "between");
                break;
            default:
                this._displayNone();
        }
    }

    _doUpdate() {
        let isDesignated = false;
        let isInvalid = false;
        if (this._vnavLegRestriction) {
            isDesignated = this._vnavLegRestriction.isDesignated;
            isInvalid = isDesignated && !this._vnavLegRestriction.isValid;
        }

        this._setDesignated(isDesignated);
        this._setInvalid(isInvalid);

        // order of precedence for display:
        // 1) VNAV designated altitude
        // 2) VNAV advisory altitude
        // 3) flight plan custom altitude
        // 4) flight plan advisory altitude
        // 5) published altitude

        if (isDesignated) {
            if (this._legConstraint && this._legConstraint.customAltitude) {
                this._displayCustomAltitude(this._vnavLegRestriction.altitude);
            } else {
                this._displayDefaultAltitude(this._vnavLegRestriction.altitude);
            }
        } else if (this._vnavLegRestriction) {
            this._displayDefaultAltitude(this._vnavLegRestriction.altitude);
        } else if (this._legConstraint && this._legConstraint.customAltitude) {
            this._displayCustomAltitude(this._legConstraint.customAltitude);
        } else if (this._legConstraint && this._legConstraint.advisoryAltitude) {
            this._displayDefaultAltitude(this._legConstraint.advisoryAltitude);
        } else if (this._legConstraint && this._legConstraint.publishedConstraint) {
            this._displayPublishedConstraint(this._legConstraint.publishedConstraint);
        } else {
            this._displayNone();
        }
    }

    /**
     *
     * @param {WT_FlightPlanLegAltitudeConstraint} legConstraint
     * @param {WT_FlightPlanVNAVLegRestriction} vnavLegRestriction
     * @param {WT_Unit} altitudeUnit
     */
    update(legConstraint, vnavLegRestriction, altitudeUnit) {
        this._legConstraint = legConstraint;
        this._vnavLegRestriction = vnavLegRestriction;
        this._altitudeUnit = altitudeUnit;
        if (this._isInit) {
            this._doUpdate();
        }
    }
}
WT_G3x5_NavMapDisplayPaneFlightPlanInsetLegAltitudeConstraintHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_NavMapDisplayPaneFlightPlanInsetLegAltitudeConstraintHTMLElement.NAME = "wt-navmapdisplaypane-flightplantextinset-row-altitudeconstraint";
WT_G3x5_NavMapDisplayPaneFlightPlanInsetLegAltitudeConstraintHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_NavMapDisplayPaneFlightPlanInsetLegAltitudeConstraintHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: absolute;
            left: var(--flightplanaltitudeconstraint-padding-left, 0.2em);
            top: var(--flightplanaltitudeconstraint-padding-top, 0.2em);
            width: calc(100% - var(--flightplanaltitudeconstraint-padding-left, 0.2em) - var(--flightplanaltitudeconstraint-padding-right, 0.2em));
            height: calc(100% - var(--flightplanaltitudeconstraint-padding-top, 0.2em) - var(--flightplanaltitudeconstraint-padding-bottom, 0.2em));
            --flightplanaltitudeconstraint-content-color: white;
        }
        #wrapper[designated="true"] {
            --flightplanaltitudeconstraint-content-color: var(--wt-g3x5-lightblue);
        }
            #flexbox {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-flow: row nowrap;
                justify-content: center;
                align-items: center;
            }
                #altitude {
                    display: flex;
                    flex-flow: column nowrap;
                    align-items: center;
                    color: var(--flightplanaltitudeconstraint-content-color);
                }
                    .altitudeComponent {
                        display: none;
                    }
                    #wrapper[mode="none"] .none,
                    #wrapper[mode="custom"] .custom,
                    #wrapper[mode="default"] .default,
                    #wrapper[mode="above"] .above,
                    #wrapper[mode="below"] .below,
                    #wrapper[mode="at"] .at,
                    #wrapper[mode="between"] .between {
                        display: block;
                    }
                    #ceilbar {
                        width: 100%;
                        height: 0;
                        border-bottom: solid var(--flightplanaltitudeconstraint-bar-stroke-width, 2px) white;
                    }
                    #floorbar {
                        width: 100%;
                        height: 0;
                        border-top: solid var(--flightplanaltitudeconstraint-bar-stroke-width, 2px) white;
                    }
                #editicon {
                    display: none;
                    width: var(--flightplanaltitudeconstraint-editicon-size, 0.8em);
                    height: var(--flightplanaltitudeconstraint-editicon-size, 0.8em);
                    fill: var(--flightplanaltitudeconstraint-content-color);
                }
                #wrapper[mode="custom"] #editicon {
                    display: block;
                }
                #invalidicon {
                    display: none;
                    position: absolute;
                    left: 0%;
                    top: 0%;
                    width: 100%;
                    height: 100%;
                    fill: transparent;
                    stroke-width: 5;
                    stroke: var(--flightplanaltitudeconstraint-content-color);
                }
                #wrapper[invalid="true"] #invalidicon {
                    display: block;
                }

        .${WT_G3x5_NavMapDisplayPaneFlightPlanInsetLegAltitudeConstraintHTMLElement.UNIT_CLASS} {
            font-size: var(--flightplanaltitudeconstraint-unit-font-size, 0.75em)
        }
    </style>
    <div id="wrapper">
        <div id="flexbox">
            <div id="altitude">
                <div id="ceilbar" class="altitudeComponent between at below"></div>
                <div id="ceiltext" class="altitudeComponent between at below default custom none"></div>
                <div id="floortext" class="altitudeComponent between above"></div>
                <div id="floorbar" class="altitudeComponent between at above"></div>
            </div>
            <svg id="editicon" viewBox="0 0 64 64">
                <path d="M48.4,6.28l3.1-3.11S55.39-.71,60.05,4s.78,8.55.78,8.55l-3.11,3.1Z" />
                <path d="M46.84,7.84,4.11,50.56S1,61.44,1.78,62.22s11.66-2.33,11.66-2.33L56.16,17.16Z" />
            </svg>
            <svg id="invalidicon" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 5 5 L 95 95 M 5 95 L 95 5" vector-effect="non-scaling-stroke" />
            </svg>
        </div>
    </div>
`;

customElements.define(WT_G3x5_NavMapDisplayPaneFlightPlanInsetLegAltitudeConstraintHTMLElement.NAME, WT_G3x5_NavMapDisplayPaneFlightPlanInsetLegAltitudeConstraintHTMLElement);

class WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHeaderHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._size = WT_G3x5_DisplayPane.Size.OFF;
        this._isDistanceCumulative = false;
        this._sequence = null;
        this._indent = 0;
        this._headerText = "";
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHeaderHTMLElement.TEMPLATE;
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
     * @type {WT_FlightPlanSequence}
     */
    get sequence() {
        return this._sequence;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
        this._header = this.shadowRoot.querySelector(`#header`);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        this._updateFromIndent();
        this._updateFromHeaderText();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    /**
     *
     * @param {WT_G3x5_DisplayPane.Size} size
     */
    setSize(size) {
        if (this._size === size) {
            return;
        }

        this._size = size;
    }

    /**
     *
     * @param {WT_G3x5_DisplayPane.Size} isCumulative
     */
    setDistanceCumulative(isCumulative) {
        if (this._isDistanceCumulative === isCumulative) {
            return;
        }

        this._isDistanceCumulative = isCumulative;
    }

    /**
     *
     * @param {WT_FlightPlanSequence} sequence
     */
    setSequence(sequence) {
        this._sequence = sequence;
    }

    _updateFromIndent() {
        this._header.style.paddingLeft = `${this._indent * 0.5}em`;
    }

    /**
     *
     * @param {Number} indent
     */
    setIndent(indent) {
        this._indent = indent;
        if (this._isInit) {
            this._updateFromIndent();
        }
    }

    _updateFromHeaderText() {
        this._header.innerHTML = this._headerText;
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

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanInsetState} state
     */
    update(state) {
    }
}
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHeaderHTMLElement.NAME = "wt-navmapdisplaypane-flightplan-row-header";
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHeaderHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHeaderHTMLElement.TEMPLATE.innerHTML = `
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
            grid-template-columns: 100%;
            align-items: center;
        }
            #header {
                text-align: left;
                color: var(--wt-g3x5-lightblue);
                white-space: nowrap;
                overflow: hidden;
            }
    </style>
    <div id="wrapper">
        <div id="header"></div>
    </div>
`;

customElements.define(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHeaderHTMLElement.NAME, WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHeaderHTMLElement);

class WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRenderer {
    /**
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement} htmlElement
     * @param {WT_FlightPlan} flightPlan
     * @param {WT_FlightPlanVNAV} flightPlanVNAV
     */
    constructor(htmlElement, flightPlan, flightPlanVNAV) {
        this._htmlElement = htmlElement;
        this._flightPlan = flightPlan;
        this._flightPlanVNAV = flightPlanVNAV;

        this._origin = new WT_G3x5_NavMapDisplayPaneFlightPlanOriginRenderer(this, flightPlan.getOrigin());
        this._enroute = new WT_G3x5_NavMapDisplayPaneFlightPlanEnrouteRenderer(this, flightPlan.getEnroute());
        this._destination = new WT_G3x5_NavMapDisplayPaneFlightPlanDestinationRenderer(this, flightPlan.getDestination());

        this._departure = null;
        this._arrival = null;
        this._approach = null;

        /**
         * @type {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement[]}
         */
        this._renderedRows = [];
        /**
         * @type {Map<WT_FlightPlanLeg,WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement>}
         */
        this._legRows = new Map();
        this._isDirectToActive = false;
        /**
         * @type {WT_FlightPlanLeg}
         */
        this._activeLeg = null;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @type {WT_FlightPlan}
     */
    get flightPlan() {
        return this._flightPlan;
    }

    /**
     * @readonly
     * @type {WT_FlightPlanVNAV}
     */
    get flightPlanVNAV() {
        return this._flightPlanVNAV;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isDirectToActive() {
        return this._isDirectToActive;
    }

    /**
     * @readonly
     * @type {WT_FlightPlanLeg}
     */
    get activeLeg() {
        return this._activeLeg;
    }

    clearRenderedRows() {
        this._renderedRows = [];
        this._legRows.clear();
        this.htmlElement.clearRows();
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement} row
     */
    _registerLegRow(leg, row) {
        this._legRows.set(leg, row);
    }

    _createRowRenderers() {
        let rowRenderers = [];
        if (this.flightPlan.hasDeparture()) {
            this._departure = new WT_G3x5_NavMapDisplayPaneFlightPlanDepartureRenderer(this, this.flightPlan.getDeparture());
            rowRenderers.push(...this._departure.createRowRenderers());
        } else {
            rowRenderers.push(...this._origin.createRowRenderers());
            this._departure = null;
        }
        rowRenderers.push(...this._enroute.createRowRenderers());
        if (this.flightPlan.hasArrival()) {
            this._arrival = new WT_G3x5_NavMapDisplayPaneFlightPlanArrivalRenderer(this, this.flightPlan.getArrival());
            rowRenderers.push(...this._arrival.createRowRenderers());
        } else {
            rowRenderers.push(...this._destination.createRowRenderers());
            this._arrival = null;
        }
        if (this.flightPlan.hasApproach()) {
            this._approach = new WT_G3x5_NavMapDisplayPaneFlightPlanApproachRenderer(this, this.flightPlan.getApproach());
            rowRenderers.push(...this._approach.createRowRenderers());
        } else {
            this._approach = null;
        }
        return rowRenderers;
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowRenderer[]} rowRenderers
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _findRowStartIndex(rowRenderers, activeLeg) {
        if (!activeLeg || rowRenderers.length <= 5) {
            return 0;
        }

        let activeLegRowIndex = rowRenderers.findIndex(rowRenderer => rowRenderer instanceof WT_G3x5_NavMapDisplayPaneFlightPlanLegRowRenderer && rowRenderer.leg === activeLeg);
        if (activeLegRowIndex <= 0) {
            return 0;
        }

        let previousLeg = activeLeg.previousLeg();
        let previousLegRowIndex = previousLeg ? Math.min(activeLegRowIndex, rowRenderers.findIndex(rowRenderer => rowRenderer instanceof WT_G3x5_NavMapDisplayPaneFlightPlanLegRowRenderer && rowRenderer.leg === previousLeg)) : activeLegRowIndex;

        if (previousLegRowIndex > 0) {
            // check if the row before the first leg row is a header row; if so, we will show the header row as the first row instead
            if (rowRenderers[previousLegRowIndex - 1] instanceof WT_G3x5_NavMapDisplayPaneFlightPlanSequenceHeaderRowRenderer) {
                previousLegRowIndex--;
            }
        }

        return Math.min(previousLegRowIndex, rowRenderers.length - 5);
    }

    _updateActiveLegArrow() {
        let showArrow = false;
        if (this._activeLeg) {
            let activeLegRow = this._legRows.get(this._activeLeg);
            if (activeLegRow) {
                let previousLeg;
                if (!this._isDirectToActive) {
                    previousLeg = this._activeLeg.previousLeg();
                }

                let activeLegCenterY = activeLegRow.offsetTop + activeLegRow.offsetHeight / 2;
                let previousLegCenterY = activeLegCenterY;

                if (previousLeg) {
                    let previousLegRow = this._legRows.get(previousLeg);
                    if (previousLegRow) {
                        previousLegCenterY = previousLegRow.offsetTop + previousLegRow.offsetHeight / 2;
                    }
                }

                this.htmlElement.moveActiveArrow(previousLegCenterY, activeLegCenterY);
                showArrow = true;
            }
        }
        this.htmlElement.setActiveArrowVisible(showArrow);
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowRenderer[]} rowRenderers
     * @param {Number} startIndex
     */
    _drawRows(rowRenderers, startIndex) {
        let endIndex = Math.min(startIndex + 5, rowRenderers.length);
        for (let i = startIndex; i < endIndex; i++) {
            let renderer = rowRenderers[i];
            let row = renderer.draw(this.htmlElement, this.activeLeg);
            this._renderedRows.push(row);
            if (renderer instanceof WT_G3x5_NavMapDisplayPaneFlightPlanLegRowRenderer) {
                this._registerLegRow(renderer.leg, row);
            }
        }
    }

    /**
     *
     * @param {Boolean} [isDirectToActive]
     * @param {WT_FlightPlanLeg} [activeLeg]
     */
    draw(isDirectToActive, activeLeg) {
        this.clearRenderedRows();
        this._isDirectToActive = isDirectToActive === undefined ? false : isDirectToActive;
        this._activeLeg = activeLeg ? activeLeg : null;

        let rowRenderers = this._createRowRenderers();
        let rowStartIndex = this._findRowStartIndex(rowRenderers, activeLeg);
        this._drawRows(rowRenderers, rowStartIndex);

        this._updateActiveLegArrow();
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    refreshAltitudeConstraint(leg) {
        let row = this._legRows.get(leg);
        if (row) {
            let modeHTMLElement = row.getActiveModeHTMLElement();
            modeHTMLElement.setVNAVLegRestriction(this.flightPlanVNAV.legRestrictions.get(modeHTMLElement.leg.index));
            modeHTMLElement.refreshAltitudeConstraint();
        }
    }

    refreshAllAltitudeConstraints() {
        this._legRows.forEach(row => {
            let modeHTMLElement = row.getActiveModeHTMLElement();
            modeHTMLElement.setVNAVLegRestriction(this.flightPlanVNAV.legRestrictions.get(modeHTMLElement.leg.index));
            modeHTMLElement.refreshAltitudeConstraint();
        }, this);
    }

    /**
     *
     * @param {Boolean} isDirectToActive
     * @param {WT_FlightPlanLeg} activeLeg
     * @param {Boolean}
     */
    _updateActiveLeg(isDirectToActive, activeLeg) {
        if (this._activeLeg === activeLeg && this._isDirectToActive === isDirectToActive) {
            return false;
        }

        this._isDirectToActive = isDirectToActive;
        this._activeLeg = activeLeg;
        this.draw(isDirectToActive, activeLeg);
        return true;
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    _updateRows(state) {
        this._renderedRows.forEach(row => row.update(state));
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(state) {
        let updated = this._updateActiveLeg(state.isDirectToActive, state.activeLeg);
        if (!updated) {
            this._updateRows(state);
        }
    }
}

class WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowRenderer {
    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement} row
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _doRender(row, activeLeg) {
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement} htmlElement
     * @param {WT_FlightPlanLeg} activeLeg
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement}
     */
    draw(htmlElement, activeLeg) {
        let row = htmlElement.requestRow();
        this._doRender(row, activeLeg);
        return row;
    }
}

/**
 * @abstract
 * @template {WT_FlightPlanElement} T
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanElementRenderer {
    /**
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRenderer} parent
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
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowRenderer[]}
     */
    createRowRenderers() {
    }
}

/**
 * @template {WT_FlightPlanSequence} T
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanSequenceHeaderRowRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowRenderer {
    /**
     * @param {T} sequence
     */
    constructor(sequence) {
        super();

        this._sequence = sequence;
    }

    /**
     * @readonly
     * @type {T}
     */
    get sequence() {
        return this._sequence;
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement} row
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _doRender(row, activeLeg) {
        row.setMode(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.Mode.HEADER);
        let modeHTMLElement = row.getActiveModeHTMLElement();
        modeHTMLElement.setSequence(this._sequence);
    }
}

/**
 * @abstract
 * @template {WT_FlightPlanSequence} T
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanElementRenderer<T>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanSequenceRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanElementRenderer {
    /**
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRenderer} parent
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
        if (element instanceof WT_FlightPlanAirwaySequence) {
            return new WT_G3x5_NavMapDisplayPaneFlightPlanAirwayRenderer(this._parent, element);
        } else if (element instanceof WT_FlightPlanLeg) {
            return new WT_G3x5_NavMapDisplayPaneFlightPlanLegRenderer(this._parent, element);
        }
        return null;
    }

    /**
     *
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanSequenceHeaderRowRenderer<T>}
     */
    _createHeaderRowRenderer() {
    }

    /**
     *
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanElementRenderer[]}
     */
    _createChildRenderers() {
        return this.element.elements.map(this._mapElementToRenderer.bind(this));
    }

    createRowRenderers() {
        let childRenderers = this._createChildRenderers();
        let rowRenderers = [this._createHeaderRowRenderer()];
        childRenderers.forEach(renderer => rowRenderers.push(...renderer.createRowRenderers()));
        return rowRenderers;
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSequenceHeaderRowRenderer<WT_FlightPlanAirwaySequence>
 */
 class WT_G3x5_NavMapDisplayPaneFlightPlanAirwaySequenceHeaderRowRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSequenceHeaderRowRenderer {
    /**
     * @param {WT_FlightPlanAirwaySequence} sequence
     * @param {Boolean} isCollapsed
     */
    constructor(sequence, isCollapsed) {
        super(sequence);

        this._isCollapsed = isCollapsed;
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement} row
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _doRender(row, activeLeg) {
        super._doRender(row, activeLeg);

        let modeHTMLElement = row.getActiveModeHTMLElement();
        modeHTMLElement.setIndent(2);
        modeHTMLElement.setHeaderText(`Airway – ${this.sequence.airway.name}.${this.sequence.legs.last().fix.ident}${this._isCollapsed ? " (collapsed)" : ""}`);
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSequenceRenderer<WT_FlightPlanAirwaySequence>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanAirwayRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSequenceRenderer {
    /**
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRenderer} parent
     * @param {WT_FlightPlanAirwaySequence} sequence
     */
    constructor(parent, sequence) {
        super(parent, sequence);

        this._shouldCollapse = !(this._parent.activeLeg && this.element === this._parent.activeLeg.parent);
    }

    /**
     *
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanAirwaySequenceHeaderRowRenderer}
     */
    _createHeaderRowRenderer() {
        return new WT_G3x5_NavMapDisplayPaneFlightPlanAirwaySequenceHeaderRowRenderer(this.element, this._shouldCollapse);
    }

    _createChildRenderers() {
        if (this._shouldCollapse) {
            return [new WT_G3x5_NavMapDisplayPaneFlightPlanAirwaySequenceFooterRenderer(this._parent, this.element.legs.last())];
        } else {
            return super._createChildRenderers();
        }
    }
}

/**
 * @template {WT_FlightPlanSegment} T
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSequenceHeaderRowRenderer<T>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanSegmentHeaderRowRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSequenceHeaderRowRenderer {
    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement} row
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _doRender(row, activeLeg) {
        super._doRender(row, activeLeg);

        let modeHTMLElement = row.getActiveModeHTMLElement();
        modeHTMLElement.setIndent(1);
    }
}

/**
 * @template {WT_FlightPlanSegment} T
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSequenceRenderer<T>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanSegmentRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSequenceRenderer {
    createRowRenderers() {
        return this.element.legs.length > 0 ? super.createRowRenderers() : [];
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentHeaderRowRenderer<WT_FlightPlanOrigin>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanOriginHeaderRowRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentHeaderRowRenderer {
    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement} row
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _doRender(row, activeLeg) {
        super._doRender(row, activeLeg);

        let modeHTMLElement = row.getActiveModeHTMLElement();
        if (this.sequence.waypoint) {
            modeHTMLElement.setHeaderText(`Origin – ${this.sequence.waypoint.ident}`);
        } else {
            modeHTMLElement.setHeaderText("Origin");
        }
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentRenderer<WT_FlightPlanOrigin>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanOriginRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentRenderer {
    /**
     *
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanOriginHeaderRowRenderer}
     */
    _createHeaderRowRenderer() {
        return new WT_G3x5_NavMapDisplayPaneFlightPlanOriginHeaderRowRenderer(this.element);
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentHeaderRowRenderer<WT_FlightPlanDestination>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanDestinationHeaderRowRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentHeaderRowRenderer {
    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement} row
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _doRender(row, activeLeg) {
        super._doRender(row, activeLeg);

        let modeHTMLElement = row.getActiveModeHTMLElement();
        if (this.sequence.waypoint) {
            modeHTMLElement.setHeaderText(`Destination – ${this.sequence.waypoint.ident}`);
        } else {
            modeHTMLElement.setHeaderText("Destination");
        }
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentRenderer<WT_FlightPlanDestination>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanDestinationRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentRenderer {
    /**
     *
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanDestinationHeaderRowRenderer}
     */
    _createHeaderRowRenderer() {
        return new WT_G3x5_NavMapDisplayPaneFlightPlanDestinationHeaderRowRenderer(this.element);
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentHeaderRowRenderer<WT_FlightPlanDeparture>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanDepartureHeaderRowRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentHeaderRowRenderer {
    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement} row
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _doRender(row, activeLeg) {
        super._doRender(row, activeLeg);

        let modeHTMLElement = row.getActiveModeHTMLElement();
        let departure = this.sequence.procedure;
        let rwyTransition = departure.runwayTransitions.getByIndex(this.sequence.runwayTransitionIndex);
        let enrouteTransition = departure.enrouteTransitions.getByIndex(this.sequence.enrouteTransitionIndex);
        let prefix = `${rwyTransition ? `RW${rwyTransition.runway.designationFull}` : "ALL"}.`;
        let suffix = (enrouteTransition && this.sequence.legs.length > 0) ? `.${this.sequence.legs.last().fix.ident}` : "";
        modeHTMLElement.setHeaderText(`Departure – ${departure.airport.ident}–${prefix}${departure.name}${suffix}`);
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentRenderer<WT_FlightPlanDeparture>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanDepartureRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentRenderer {
    /**
     *
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanDepartureHeaderRowRenderer}
     */
    _createHeaderRowRenderer() {
        return new WT_G3x5_NavMapDisplayPaneFlightPlanDepartureHeaderRowRenderer(this.element);
    }

    _createChildRenderers() {
        let renderers = super._createChildRenderers();

        if (!this.element.procedure.runwayTransitions.getByIndex(this.element.runwayTransitionIndex)) {
            // if the departure does not have a runway selected, add the origin as the first "leg"
            renderers.unshift(new WT_G3x5_NavMapDisplayPaneFlightPlanLegRenderer(this._parent, this.element.flightPlan.getOrigin().leg()));
        }

        return renderers;
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentHeaderRowRenderer<WT_FlightPlanEnroute>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanEnrouteHeaderRowRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentHeaderRowRenderer {
    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement} row
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _doRender(row, activeLeg) {
        super._doRender(row, activeLeg);

        let modeHTMLElement = row.getActiveModeHTMLElement();
        modeHTMLElement.setHeaderText("Enroute");
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentRenderer<WT_FlightPlanEnroute>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanEnrouteRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentRenderer {
    /**
     *
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanEnrouteHeaderRowRenderer}
     */
    _createHeaderRowRenderer() {
        return new WT_G3x5_NavMapDisplayPaneFlightPlanEnrouteHeaderRowRenderer(this.element);
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentHeaderRowRenderer<WT_FlightPlanArrival>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanArrivalHeaderRowRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentHeaderRowRenderer {
    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement} row
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _doRender(row, activeLeg) {
        super._doRender(row, activeLeg);

        let modeHTMLElement = row.getActiveModeHTMLElement();
        let arrival = this.sequence.procedure;
        let enrouteTransition = arrival.enrouteTransitions.getByIndex(this.sequence.enrouteTransitionIndex);
        let rwyTransition = arrival.runwayTransitions.getByIndex(this.sequence.runwayTransitionIndex);
        let prefix = (enrouteTransition && this.sequence.legs.length > 0) ? `${this.sequence.legs.first().fix.ident}.` : "";
        let suffix = `.${rwyTransition ? `RW${rwyTransition.runway.designationFull}` : "ALL"}`;
        modeHTMLElement.setHeaderText(`Arrival – ${arrival.airport.ident}–${prefix}${arrival.name}${suffix}`);
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentRenderer<WT_FlightPlanArrival>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanArrivalRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentRenderer {
    /**
     *
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanArrivalHeaderRowRenderer}
     */
    _createHeaderRowRenderer() {
        return new WT_G3x5_NavMapDisplayPaneFlightPlanArrivalHeaderRowRenderer(this.element);
    }

    _createChildRenderers() {
        let renderers = super._createChildRenderers();
        // we need to manually add the destination "leg" to the end of the arrival since the sim doesn't give it to us automatically
        renderers.push(new WT_G3x5_NavMapDisplayPaneFlightPlanLegRenderer(this._parent, this.element.flightPlan.getDestination().leg()));
        return renderers;
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentHeaderRowRenderer<WT_FlightPlanApproach>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanApproachHeaderRowRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentHeaderRowRenderer {
    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement} row
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _doRender(row, activeLeg) {
        super._doRender(row, activeLeg);

        let modeHTMLElement = row.getActiveModeHTMLElement();
        let approach = this.sequence.procedure;
        modeHTMLElement.setHeaderText(`Approach – ${approach.airport.ident}–${approach.name}`);
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentRenderer<WT_FlightPlanApproach>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanApproachRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanSegmentRenderer {
    /**
     *
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanApproachHeaderRowRenderer}
     */
    _createHeaderRowRenderer() {
        return new WT_G3x5_NavMapDisplayPaneFlightPlanApproachHeaderRowRenderer(this.element);
    }
}

class WT_G3x5_NavMapDisplayPaneFlightPlanLegRowRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowRenderer {
    /**
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_FlightPlanVNAVLegRestriction} vnavLegRestriction
     */
    constructor(leg, vnavLegRestriction) {
        super();

        this._leg = leg;
        this._vnavLegRestriction = vnavLegRestriction;
    }

    /**
     * @readonly
     * @type {WT_FlightPlanLeg}
     */
    get leg() {
        return this._leg;
    }

    /**
     * @readonly
     * @type {WT_FlightPlanVNAVLegRestriction}
     */
    get vnavLegRestriction() {
        return this._vnavLegRestriction;
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement} row
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _doRender(row, activeLeg) {
        row.setMode(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.Mode.LEG);

        let modeHTMLElement = row.getActiveModeHTMLElement();
        modeHTMLElement.setLeg(this.leg);
        modeHTMLElement.setVNAVLegRestriction(this.vnavLegRestriction);
        modeHTMLElement.setIndent(this.leg.parent instanceof WT_FlightPlanSegment ? 2 : 3);
        modeHTMLElement.setActive(this.leg === activeLeg);
    }
}

/**
 * @extends WT_G3x5_NavMapDisplayPaneFlightPlanElementRenderer<WT_FlightPlanLeg>
 */
class WT_G3x5_NavMapDisplayPaneFlightPlanLegRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanElementRenderer {
    /**
     *
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanLegRowRenderer}
     */
    _createLegRowRenderer() {
        return new WT_G3x5_NavMapDisplayPaneFlightPlanLegRowRenderer(this.element, this._parent.flightPlanVNAV.legRestrictions.get(this.element.index));
    }

    /**
     *
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowRenderer[]}
     */
    createRowRenderers() {
        return [this._createLegRowRenderer()];
    }
}

class WT_G3x5_NavMapDisplayPaneFlightPlanAirwayFooterRowRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanLegRowRenderer {
    /**
     *
     * @param {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement} row
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _doRender(row, activeLeg) {
        row.setMode(WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetRowHTMLElement.Mode.AIRWAY_FOOTER);

        let modeHTMLElement = row.getActiveModeHTMLElement();
        modeHTMLElement.setLeg(this.leg);
        modeHTMLElement.setVNAVLegRestriction(this.vnavLegRestriction);
        modeHTMLElement.setIndent(3);
        modeHTMLElement.setActive(this.leg === activeLeg);
    }
}

class WT_G3x5_NavMapDisplayPaneFlightPlanAirwaySequenceFooterRenderer extends WT_G3x5_NavMapDisplayPaneFlightPlanLegRenderer {
    /**
     *
     * @returns {WT_G3x5_NavMapDisplayPaneFlightPlanAirwayFooterRowRenderer}
     */
    _createLegRowRenderer() {
        return new WT_G3x5_NavMapDisplayPaneFlightPlanAirwayFooterRowRenderer(this.element, this._parent.flightPlanVNAV.legRestrictions.get(this.element.index));
    }
}