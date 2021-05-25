class WT_G3x5_TSCWaypointInfoSelection extends WT_G3x5_TSCDirectoryPage {
    _createHTMLElement() {
        return new WT_G3x5_TSCWaypointInfoSelectionHTMLElement();
    }

    _getTitle() {
        return "Waypoint Info";
    }

    _openPage(pagePropertyName) {
        super._openPage(this.instrument.getSelectedMFDPanePages()[pagePropertyName].name);
    }

    _initAirportButton() {
        this.htmlElement.airportButton.addButtonListener(this._openPage.bind(this, "airportInfo"));
    }

    _initINTButton() {
        this.htmlElement.intButton.addButtonListener(this._openPage.bind(this, "intInfo"));
    }

    _initVORButton() {
        this.htmlElement.vorButton.addButtonListener(this._openPage.bind(this, "vorInfo"));
    }

    _initNDBButton() {
        this.htmlElement.ndbButton.addButtonListener(this._openPage.bind(this, "ndbInfo"));
    }

    _doInitButtons() {
        this._initAirportButton();
        this._initINTButton();
        this._initVORButton();
        this._initNDBButton();
    }
}

class WT_G3x5_TSCWaypointInfoSelectionHTMLElement extends WT_G3x5_TSCDirectoryPageHTMLElement {
    _getTemplate() {
        return WT_G3x5_TSCWaypointInfoSelectionHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {WT_TSCImageButton}
     */
    get airportButton() {
        return this._airportButton;
    }

    /**
     * @readonly
     * @type {WT_TSCImageButton}
     */
    get intButton() {
        return this._intButton;
    }

    /**
     * @readonly
     * @type {WT_TSCImageButton}
     */
    get vorButton() {
        return this._vorButton;
    }

    /**
     * @readonly
     * @type {WT_TSCImageButton}
     */
    get ndbButton() {
        return this._ndbButton;
    }

    async _defineButtons() {
        [
            this._airportButton,
            this._intButton,
            this._vorButton,
            this._ndbButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#airport`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#int`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#vor`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#ndb`, WT_TSCImageButton)
        ]);
    }
}
WT_G3x5_TSCWaypointInfoSelectionHTMLElement.NAME = "wt-tsc-waypointinfoselection";
WT_G3x5_TSCWaypointInfoSelectionHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCWaypointInfoSelectionHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: repeat(3, var(--waypointinfoselection-grid-row, 1fr));
            grid-template-columns: repeat(3, var(--waypointinfoselection-grid-column, 1fr));
            grid-gap: var(--waypointinfoselection-grid-gap-row, 1em) var(--waypointinfoselection-grid-gap-column, 2em);
            --button-img-image-top: 10%;
            --button-img-image-height: 45%;
        }
    </style>
    <div id="wrapper">
        <wt-tsc-button-img id="airport" class="button" labeltext="Airport" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_TSC_AIRPORT.png"></wt-tsc-button-img>
        <wt-tsc-button-img id="int" class="button" labeltext="INT" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_TSC_INTERSECTION.png"></wt-tsc-button-img>
        <wt-tsc-button-img id="vor" class="button" labeltext="VOR" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_TSC_VOR.png"></wt-tsc-button-img>
        <wt-tsc-button-img id="ndb" class="button" labeltext="NDB" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_TSC_NDB.png"></wt-tsc-button-img>
    </div>
`;

customElements.define(WT_G3x5_TSCWaypointInfoSelectionHTMLElement.NAME, WT_G3x5_TSCWaypointInfoSelectionHTMLElement);

/**
 * @abstract
 * @template {WT_ICAOWaypoint} T
 */
class WT_G3x5_TSCWaypointInfo extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName, instrumentID, halfPaneID, mfdPaneDisplaySetting, icaoWaypointType) {
        super(homePageGroup, homePageName);

        this._settingModelID = this._getSettingModelID(instrumentID, halfPaneID);
        this._mfdPaneDisplaySetting = mfdPaneDisplaySetting;
        this._icaoWaypointType = icaoWaypointType;

        /**
         * @type {T}
         */
        this._selectedWaypoint = null;

        this._initSettingModel();
    }

    _getSettingModelID(instrumentID, halfPaneID) {
        return `${instrumentID}-${halfPaneID}_${WT_G3x5_WaypointInfoDisplay.SETTING_MODEL_ID}`;
    }

    _initSettingModel() {
        this._settingModel = new WT_DataStoreSettingModel(this._settingModelID, null);
        this._settingModel.addSetting(this._displayPaneICAOSetting = new WT_G3x5_WaypointDisplayICAOSetting(this._settingModel));
    }

    /**
     * @readonly
     * @type {WT_G3x5_WaypointDisplayICAOSetting}
     */
    get displayPaneICAOSetting() {
        return this._displayPaneICAOSetting;
    }

    /**
     * @readonly
     * @type {T}
     */
    get selectedWaypoint() {
        return this._selectedWaypoint;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCWaypointInfoHTMLElement<T>}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _initUnitsModel() {
        this._unitsModel = new WT_G3x5_TSCWaypointInfoUnitsModel(this.instrument.unitsSettingModel);
    }

    _initButtonListeners() {
        this.htmlElement.selectButton.addButtonListener(this._onSelectButtonPressed.bind(this));
        this.htmlElement.optionsButton.addButtonListener(this._onOptionsButtonPressed.bind(this));
    }

    async _initFromHTMLElement() {
        await WT_Wait.awaitCallback(() => this.htmlElement.isInitialized, this);
        this._initButtonListeners();
        this.htmlElement.setWaypoint(this.selectedWaypoint);
    }

    init(root) {
        this.container.title = this._getTitle();
        this._initUnitsModel();
        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
        this._initFromHTMLElement();
    }

    setWaypoint(waypoint) {
        if (waypoint === null && this.selectedWaypoint === null || (waypoint && waypoint.equals(this.selectedWaypoint))) {
            return;
        }

        this._selectedWaypoint = waypoint;
        if (this.htmlElement && this.htmlElement.isInitialized) {
            this.htmlElement.setWaypoint(waypoint);
        }
    }

    async _setICAO(icao) {
        if (icao) {
            try {
                let waypoint = await this._createWaypointFromICAO(icao);
                this.setWaypoint(waypoint);
                return;
            } catch (e) {
                console.log(e);
            }
        }
        this.setWaypoint(null);
    }

    _onKeyboardClosed(icao) {
        this._setICAO(icao);
    }

    _openKeyboard() {
        this.instrument.deactivateNavButton(5);
        this.instrument.deactivateNavButton(6);
        this.instrument.fullKeyboard.element.setContext(this._onKeyboardClosed.bind(this), this._icaoWaypointType);
        this.instrument.switchToPopUpPage(this.instrument.fullKeyboard);
    }

    _onSelectButtonPressed(button) {
        this._openKeyboard();
    }

    _openWaypointOptionsWindow() {
        let context = {
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            waypoint: this.selectedWaypoint,
            icaoSetting: this._displayPaneICAOSetting,
            mfdPaneDisplaySetting: this._mfdPaneDisplaySetting,
            showOnMapOnDisplayMode: WT_G3x5_MFDHalfPaneDisplaySetting.Display.WAYPOINT_INFO,
            showOnMapOffDisplayMode: WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP
        }
        this.instrument.waypointOptions.element.setContext(context);
        this.instrument.switchToPopUpPage(this.instrument.waypointOptions);
    }

    _onOptionsButtonPressed(button) {
        this._openWaypointOptionsWindow();
    }

    onEnter() {
        super.onEnter();

        this.htmlElement.open();
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }

    _updateDirectTo() {
        // TODO: Implement a more sane way to push data to direct to page.
        this.instrument.lastRelevantICAO = this.selectedWaypoint ? this.selectedWaypoint.icao : null;
    }

    onExit() {
        this._updateDirectTo();
        this.htmlElement.close();

        super.onExit();
    }
}

class WT_G3x5_TSCWaypointInfoUnitsModel extends WT_G3x5_UnitsSettingModelAdapter {
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

    /**
     * @readonly
     * @type {WT_Unit}
     */
    get altitudeUnit() {
        return this._altitudeUnit;
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

    _updateAltitude() {
        this._altitudeUnit = this.unitsSettingModel.altitudeSetting.getAltitudeUnit();
    }
}

/**
 * @abstract
 * @template {WT_ICAOWaypoint} T
 */
class WT_G3x5_TSCWaypointInfoHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {T}
         */
        this._waypoint = null;

        /**
         * @type {{parentPage:WT_G3x5_TSCWaypointInfo<T>, airplane:WT_PlayerAirplane, unitsModel:WT_G3x5_TSCWaypointInfoUnitsModel}}
         */
        this._context = null;
        this._isInit = false;
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

    _initSelectButton() {
        this.selectButton.setIconSrcFactory(new WT_G3x5_TSCWaypointButtonIconSrcFactory(WT_G3x5_TSCWaypointInfoHTMLElement.WAYPOINT_ICON_PATH));
    }

    async _connectedCallbackHelper() {
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    setContext(context) {
        this._context = context;
    }

    _updateSelectButtonFromWaypoint() {
        this.selectButton.setWaypoint(this._waypoint);
    }

    _updateOptionsButtonFromWaypoint() {
        this.optionsButton.enabled = `${this._waypoint !== null}`;
    }

    _updateFromWaypoint() {
        this._updateSelectButtonFromWaypoint();
        this._updateOptionsButtonFromWaypoint();
    }

    setWaypoint(waypoint) {
        if ((!waypoint && !this._waypoint) || (waypoint && waypoint.equals(this._waypoint))) {
            return;
        }

        this._waypoint = waypoint;
        this._updateFromWaypoint();
    }

    open() {
    }

    _doUpdate() {
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._doUpdate();
    }

    close() {
    }
}
WT_G3x5_TSCWaypointInfoHTMLElement.WAYPOINT_ICON_PATH = "/WTg3000/SDK/Assets/Images/Garmin/TSC/Waypoints";

/**
 * @abstract
 * @template {WT_ICAOWaypoint} T
 * @extends WT_G3x5_TSCWaypointInfoHTMLElement<T>
 */
class WT_G3x5_TSCSimpleWaypointInfoHTMLElement extends WT_G3x5_TSCWaypointInfoHTMLElement {
    constructor() {
        super();

        this._initFormatters();
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
                _unitClassList: [WT_G3x5_TSCSimpleWaypointInfoHTMLElement.UNIT_CLASS],

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

    _initBearingFormatter() {
        this._bearingFormatter = new WT_NumberFormatter({
            precision: 1,
            unitSpaceBefore: false
        });
    }

    _initCoordinateFormatter() {
        this._coordinateFormatter = new WT_CoordinateFormatter();
    }

    _initFormatters() {
        this._initDistanceFormatter();
        this._initBearingFormatter();
        this._initCoordinateFormatter();
    }

    async _defineChildren() {
        [
            this._selectButton,
            this._optionsButton,
            this._locationRow,
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, this._getSelectButtonQuery(), WT_G3x5_TSCWaypointButton),
            WT_CustomElementSelector.select(this.shadowRoot, this._getOptionsButtonQuery(), WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, this._getLocationRowQuery(), WT_G3x5_TSCSimpleWaypointInfoLocationRowHTMLElement)
        ]);

        this._regionText = this.shadowRoot.querySelector(this._getRegionTextQuery());
    }

    _initButtons() {
        this._initSelectButton();
    }

    _initChildren() {
        this._initButtons();
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initChildren();
        this._isInit = true;
    }

    _updateRegionText() {
        this._regionText.textContent = this._waypoint ? WT_G3x5_RegionNames.getName(this._waypoint.region) : "";
    }

    _updateLocationRowWaypoint() {
        this._locationRow.setWaypoint(this._waypoint);
    }

    _updateFromWaypoint() {
        super._updateFromWaypoint();

        this._updateRegionText();
        this._updateLocationRowWaypoint();
    }

    _updateLocationRow() {
        this._locationRow.update(this._context.airplane, this._context.unitsModel);
    }

    _doUpdate() {
        this._updateLocationRow();
    }
}
WT_G3x5_TSCSimpleWaypointInfoHTMLElement.UNIT_CLASS = "unit";

class WT_G3x5_TSCSimpleWaypointInfoLocationRowHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_ICAOWaypoint}
         */
        this._waypoint = null;

        this._isInit = false;

        this._initFormatters();

        this._tempGARad = new WT_NumberUnit(0, WT_Unit.GA_RADIAN);
        this._tempAngle = new WT_NumberUnit(0, WT_Unit.DEGREE);
        this._tempTrueBearing = new WT_NavAngleUnit(false).createNumber(0);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    _getTemplate() {
        return WT_G3x5_TSCSimpleWaypointInfoLocationRowHTMLElement.TEMPLATE;
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
                    return [WT_G3x5_TSCSimpleWaypointInfoHTMLElement.UNIT_CLASS];
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

    _initCoordinateFormatter() {
        this._coordinateFormatter = new WT_CoordinateFormatter();
    }

    _initFormatters() {
        this._initDistanceFormatter();
        this._initBearingFormatter();
        this._initCoordinateFormatter();
    }

    async _defineChildren() {
        this._bearingArrow = await WT_CustomElementSelector.select(this.shadowRoot, `#bearingarrow`, WT_TSCBearingArrow);

        this._coordinates = this.shadowRoot.querySelector(`#coordinates`);
        this._bearingText = new WT_CachedElement(this.shadowRoot.querySelector(`#bearingtext`));
        this._distance = new WT_CachedElement(this.shadowRoot.querySelector(`#distancetext`));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        this._updateFromWaypoint();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateCoordinates() {
        if (this._waypoint) {
            let latSign = Math.sign(this._waypoint.location.lat);
            let latPrefix = latSign < 0 ? "S " : "N ";
            let lat = this._tempAngle.set(latSign * this._waypoint.location.lat);
            let latText = latPrefix + this._coordinateFormatter.getFormattedString(lat);

            let longSign = Math.sign(this._waypoint.location.long);
            let longPrefix = longSign < 0 ? "W " : "E ";
            let long = this._tempAngle.set(longSign * this._waypoint.location.long);
            let longText = longPrefix + this._coordinateFormatter.getFormattedString(long);

            this._coordinates.innerHTML = `${latText}<br>${longText}`;
        } else {
            this._coordinates.innerHTML = "";
        }
    }

    _updateFromWaypoint() {
        this._updateCoordinates();
    }

    /**
     *
     * @param {WT_ICAOWaypoint} waypoint
     */
    setWaypoint(waypoint) {
        if ((!waypoint && !this._waypoint) || (waypoint && waypoint.equals(this._waypoint))) {
            return;
        }

        this._waypoint = waypoint;
        if (this._isInit) {
            this._updateFromWaypoint();
        }
    }

    /**
     *
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_G3x5_TSCWaypointInfoUnitsModel} unitsModel
     */
    _updateBearingDistance(airplane, unitsModel) {
        if (this._waypoint) {
            let ppos = airplane.navigation.position(this._tempGeoPoint);
            let heading = airplane.navigation.headingTrue();
            let bearing = this._tempTrueBearing.set(ppos.bearingTo(this._waypoint.location));
            bearing.unit.setLocation(ppos);
            this._bearingText.textContent = this._bearingFormatter.getFormattedString(bearing, unitsModel.bearingUnit);
            this._bearingArrow.setBearing(bearing.number - heading);

            let distance = this._tempGARad.set(ppos.distance(this._waypoint.location));
            this._distance.innerHTML = this._distanceFormatter.getFormattedHTML(distance, unitsModel.distanceUnit);

            if (this._bearingArrow.style.display !== "block") {
                this._bearingArrow.style.display = "block";
            }
        } else {
            if (this._bearingArrow.style.display !== "none") {
                this._bearingArrow.style.display = "none";
            }
            this._bearingText.textContent = "";
            this._distance.innerHTML = "";
        }
    }

    _doUpdate(airplane, unitsModel) {
        this._updateBearingDistance(airplane, unitsModel);
    }

    /**
     *
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_G3x5_TSCWaypointInfoUnitsModel} unitsModel
     */
    update(airplane, unitsModel) {
        if (!this._isInit) {
            return;
        }

        this._doUpdate(airplane, unitsModel);
    }
}
WT_G3x5_TSCSimpleWaypointInfoLocationRowHTMLElement.NAME = "wt-tsc-simplewaypointinfo-locationrow";
WT_G3x5_TSCSimpleWaypointInfoLocationRowHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCSimpleWaypointInfoLocationRowHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: var(--simplewaypointinfo-locationrow-grid-columns, 1.5fr 1fr 1fr);
            color: white;
        }
            #coordinates {
                text-align: left;
                align-self: center;
            }
                .title {
                    position: absolute;
                    left: 50%;
                    bottom: 50%;
                    transform: translateX(-50%);
                    font-size: var(--simplewaypointinfo-locationrow-title-font-size, 0.85em);
                }
                .value {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%);
                }
            #bearing {
                position: relative;
            }
                #bearingvalue {
                    display: flex;
                    flex-flow: row nowrap;
                    align-items: center;
                }
                    #bearingarrow {
                        width: 1.2em;
                        height: 1.2em;
                    }
            #distance {
                position: relative;
            }

        .${WT_G3x5_TSCSimpleWaypointInfoHTMLElement.UNIT_CLASS} {
            font-size: var(--waypointinfo-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <div id="coordinates"></div>
        <div id="bearing">
            <div id="bearingtitle" class="title">BRG</div>
            <div id="bearingvalue" class="value">
                <div id="bearingtext"></div>
                <wt-tsc-bearingarrow id="bearingarrow"></wt-tsc-bearingarrow>
            </div>
        </div>
        <div id="distance">
            <div id="distancetitle" class="title">DIS</div>
            <div id="distancetext" class="value"></div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCSimpleWaypointInfoLocationRowHTMLElement.NAME, WT_G3x5_TSCSimpleWaypointInfoLocationRowHTMLElement);

// VOR/NDB

/**
 * @abstract
 * @template {WT_VOR|WT_NDB} T
 * @extends WT_G3x5_TSCWaypointInfo<T>
 */
class WT_G3x5_TSCNavAidInfo extends WT_G3x5_TSCWaypointInfo {
    _initButtonListeners() {
        super._initButtonListeners();

        this.htmlElement.frequencyButton.addButtonListener(this._onFrequencyButtonPressed.bind(this));
    }

    /**
     *
     * @param {T} waypoint
     */
    _openFrequencyWindow(waypoint) {
        let context = {
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            frequencyText: this._getFrequencyText(waypoint),
            frequency: waypoint.frequency,
            radioSlotType: this._getRadioSlotType(waypoint)
        }
        this.instrument.loadFrequencyWindow.element.setContext(context);
        this.instrument.switchToPopUpPage(this.instrument.loadFrequencyWindow);
    }

    _onFrequencyButtonPressed(button) {
        this._openFrequencyWindow(this.selectedWaypoint);
    }
}

/**
 * @abstract
 * @template {WT_VOR|WT_NDB} T
 * @extends WT_G3x5_TSCSimpleWaypointInfoHTMLElement<T>
 */
class WT_G3x5_TSCNavAidInfoHTMLElement extends WT_G3x5_TSCSimpleWaypointInfoHTMLElement {
    /**
     * @readonly
     * @type {WT_TSCContentButton}
     */
    get frequencyButton() {
        return this._frequencyButton;
    }

    async _defineChildren() {
        [
            ,
            this._frequencyButton
        ] = await Promise.all([
            super._defineChildren(),
            WT_CustomElementSelector.select(this.shadowRoot, this._getFrequencyButtonQuery(), WT_TSCContentButton)
        ]);

        this._frequencyText = this.shadowRoot.querySelector(this._getFrequencyTextQuery());
    }

    _updateFrequencyText() {
        if (this._waypoint) {
            this._frequencyText.textContent = this._getFrequencyText(this._waypoint.frequency);
        } else {
            this._frequencyText.textContent = "";
        }
    }

    _updateFromWaypoint() {
        super._updateFromWaypoint();

        this._updateFrequencyText();
    }
}

// VOR

/**
 * @extends WT_G3x5_TSCNavAidInfo<WT_VOR>
 */
class WT_G3x5_TSCVORInfo extends WT_G3x5_TSCNavAidInfo {
    constructor(homePageGroup, homePageName, instrumentID, halfPaneID, mfdPaneDisplaySetting) {
        super(homePageGroup, homePageName, instrumentID, halfPaneID, mfdPaneDisplaySetting, WT_ICAOWaypoint.Type.VOR);
    }

    _getTitle() {
        return "VOR Information";
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCVORInfoHTMLElement();
        htmlElement.setContext({
            parentPage: this,
            airplane: this.instrument.airplane,
            unitsModel: this._unitsModel
        })
        return htmlElement;
    }

    async _createWaypointFromICAO(icao) {
        return this.instrument.icaoWaypointFactory.getVOR(icao);
    }

    /**
     *
     * @param {WT_VOR} waypoint
     * @returns {String}
     */
    _getFrequencyText(waypoint) {
        return `${waypoint.frequency.hertz(WT_Frequency.Prefix.MHz).toFixed(3).replace(/(\...)0$/, "$1")} ${waypoint.ident}`;
    }

    /**
     *
     * @param {WT_VOR} waypoint
     * @returns {WT_G3x5_TSCLoadFrequency.RadioSlotType}
     */
    _getRadioSlotType(waypoint) {
        return WT_G3x5_TSCLoadFrequency.RadioSlotType.NAV;
    }
}

/**
 * @extends WT_G3x5_TSCNavAidInfoHTMLElement<WT_VOR>
 */
class WT_G3x5_TSCVORInfoHTMLElement extends WT_G3x5_TSCNavAidInfoHTMLElement {
    _getTemplate() {
        return WT_G3x5_TSCVORInfoHTMLElement.TEMPLATE;
    }

    _getSelectButtonQuery() {
        return `#selectbutton`;
    }

    _getOptionsButtonQuery() {
        return `#optionsbutton`;
    }

    _getLocationRowQuery() {
        return `#locationrow`;
    }

    _getRegionTextQuery() {
        return `#region`;
    }

    _getFrequencyButtonQuery() {
        return `#frequencybutton`;
    }

    _getFrequencyTextQuery() {
        return `#frequencytext`;
    }

    async _defineChildren() {
        await super._defineChildren();

        this._classText = this.shadowRoot.querySelector(`#class`);
        this._typeText = this.shadowRoot.querySelector(`#type`);
        this._magVar = this.shadowRoot.querySelector(`#magvar`);
    }

    _getFrequencyText(frequency) {
        return frequency.hertz(WT_Frequency.Prefix.MHz).toFixed(3).replace(/(\...)0$/, "$1");
    }

    _updateClass() {
        if (this._waypoint) {
            this._classText.textContent = WT_G3x5_TSCVORInfoHTMLElement.VOR_CLASS_TEXT[this._waypoint.vorClass];
        } else {
            this._classText.textContent = "";
        }
    }

    _updateType() {
        if (this._waypoint) {
            this._typeText.textContent = WT_G3x5_TSCVORInfoHTMLElement.VOR_TYPE_TEXT[this._waypoint.vorType];
        } else {
            this._typeText.textContent = "";
        }
    }

    _updateMagVar() {
        if (this._waypoint) {
            let magVar = Math.round(this._waypoint.magVar);
            let direction = "E";
            if (magVar < 0) {
                magVar = -magVar;
                direction = "W";
            }
            this._magVar.textContent = `${magVar}°${direction}`;
        } else {
            this._magVar.textContent = "";
        }
    }

    _updateFromWaypoint() {
        super._updateFromWaypoint();

        this._updateClass();
        this._updateType();
        this._updateMagVar();
    }
}
WT_G3x5_TSCVORInfoHTMLElement.VOR_TYPE_TEXT = [
    "UNKNOWN",
    "VOR",
    "VOR/DME",
    "DME",
    "TACAN",
    "VOR-TACAN",
    "ILS",
    "VOT"
];
WT_G3x5_TSCVORInfoHTMLElement.VOR_CLASS_TEXT = [
    "Unknown",
    "Terminal",
    "Low Altitude",
    "High Altitude",
    "ILS",
    "VOT"
];
WT_G3x5_TSCVORInfoHTMLElement.NAME = "wt-tsc-vorinfo";
WT_G3x5_TSCVORInfoHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCVORInfoHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            border-radius: 5px;
            border: 3px solid var(--wt-g3x5-bordergray);
            background: black;
        }

        #wrapper {
            position: absolute;
            left: var(--simplewaypointinfo-padding-left, 0.2em);
            top: var(--simplewaypointinfo-padding-top, 0.2em);
            width: calc(100% - var(--simplewaypointinfo-padding-left, 0.2em) - var(--simplewaypointinfo-padding-right, 0.2em));
            height: calc(100% - var(--simplewaypointinfo-padding-top, 0.2em) - var(--simplewaypointinfo-padding-bottom, 0.2em));
            display: grid;
            grid-template-rows: var(--simplewaypointinfo-header-height, 4em) 1fr;
            grid-template-columns: 100%;
            grid-gap: var(--simplewaypointinfo-header-margin-bottom, 0.2em) 0;
            justify-items: center;
        }
            #header {
                position: relative;
                width: var(--simplewaypointinfo-header-width, 90%);
                display: grid;
                grid-template-rows: 100%;
                grid-template-columns: var(--simplewaypointinfo-selectbutton-width, 67%) 1fr;
                grid-gap: 0 var(--simplewaypointinfo-header-button-margin, 0.5em);
            }
            #info {
                position: relative;
                width: var(--simplewaypointinfo-info-width, 80%);
                display: grid;
                grid-template-columns: 100%;
                grid-template-rows: var(--vorinfo-grid-rows, repeat(5, 1fr));
                color: white;
            }
                .infoRowContainer {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                .borderRow {
                    border-top: var(--simplewaypointinfo-info-row-border, 1px solid var(--wt-g3x5-bordergray));
                }
                    .infoRow {
                        position: absolute;
                        left: var(--simplewaypointinfo-info-row-padding-left, 0.2em);
                        top: var(--simplewaypointinfo-info-row-padding-top, 0.2em);
                        width: calc(100% - var(--simplewaypointinfo-info-row-padding-left, 0.2em) - var(--simplewaypointinfo-info-row-padding-right, 0.2em));
                        height: calc(100% - var(--simplewaypointinfo-info-row-padding-top, 0.2em) - var(--simplewaypointinfo-info-row-padding-bottom, 0.2em));
                    }
                    #row1 {
                        display: grid;
                        grid-template-rows: 50% 50%;
                        grid-template-columns: 100%;
                        justify-items: start;
                        align-items: center;
                    }
                        #locationrow {
                            position: relative;
                            width: 100%;
                            height: var(--simplewaypointinfo-info-locationrow-height, 100%);
                        }
                    #row3 {
                        display: grid;
                        grid-template-rows: 50% 50%;
                        grid-template-columns: 50% 50%;
                        justify-items: start;
                        align-items: center;
                    }
                        #frequencycontent {
                            position: relative;
                            width: 100%;
                            height: 100%;
                        }
                            #frequencytitle {
                                position: absolute;
                                left: 25%;
                                top: 50%;
                                transform: translate(-50%, -50%);
                            }
                            #frequencytext {
                                position: absolute;
                                left: 50%;
                                top: 50%;
                                transform: translateY(-50%);
                                font-size: var(--navaidinfo-info-frequency-font-size, 1.5em);
                            }

        .${WT_G3x5_TSCSimpleWaypointInfoHTMLElement.UNIT_CLASS} {
            font-size: var(--waypointinfo-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <div id="header">
            <wt-tsc-button-waypoint id="selectbutton" emptytext="Select VOR"></wt-tsc-button-waypoint>
            <wt-tsc-button-label id="optionsbutton" labeltext="Waypoint Options"></wt-tsc-button-label>
        </div>
        <div id="info">
            <div class="infoRowContainer">
                <div id="row1" class="infoRow">
                    <div id="city"></div>
                    <div id="region"></div>
                </div>
            </div>
            <div class="infoRowContainer borderRow">
                <div id="row2" class="infoRow">
                    <wt-tsc-simplewaypointinfo-locationrow id="locationrow"></wt-tsc-simplewaypointinfo-locationrow>
                </div>
            </div>
            <div class="infoRowContainer borderRow">
                <div id="row3" class="infoRow">
                    <div id="class"></div>
                    <div id="magvar"></div>
                    <div id="type"></div>
                </div>
            </div>
            <div class="infoRowContainer borderRow">
            </div>
            <wt-tsc-button-content id="frequencybutton">
                <div id="frequencycontent" slot="content">
                    <div id="frequencytitle">Frequency:</div>
                    <div id="frequencytext"></div>
                </div>
            </wt-tsc-button-content>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCVORInfoHTMLElement.NAME, WT_G3x5_TSCVORInfoHTMLElement);

// NDB

/**
 * @extends WT_G3x5_TSCNavAidInfo<WT_NDB>
 */
class WT_G3x5_TSCNDBInfo extends WT_G3x5_TSCNavAidInfo {
    constructor(homePageGroup, homePageName, instrumentID, halfPaneID, mfdPaneDisplaySetting) {
        super(homePageGroup, homePageName, instrumentID, halfPaneID, mfdPaneDisplaySetting, WT_ICAOWaypoint.Type.NDB);
    }

    _getTitle() {
        return "NDB Information";
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCNDBInfoHTMLElement();
        htmlElement.setContext({
            parentPage: this,
            airplane: this.instrument.airplane,
            unitsModel: this._unitsModel
        })
        return htmlElement;
    }

    async _createWaypointFromICAO(icao) {
        return this.instrument.icaoWaypointFactory.getNDB(icao);
    }

    /**
     *
     * @param {WT_NDB} waypoint
     * @returns {String}
     */
    _getFrequencyText(waypoint) {
        return `${waypoint.frequency.hertz(WT_Frequency.Prefix.KHz).toFixed(1)} ${waypoint.ident}`;
    }

    /**
     *
     * @param {WT_NDB} waypoint
     * @returns {WT_G3x5_TSCLoadFrequency.RadioSlotType}
     */
    _getRadioSlotType(waypoint) {
        return WT_G3x5_TSCLoadFrequency.RadioSlotType.ADF;
    }
}

/**
 * @extends WT_G3x5_TSCNavAidInfoHTMLElement<WT_NDB>
 */
class WT_G3x5_TSCNDBInfoHTMLElement extends WT_G3x5_TSCNavAidInfoHTMLElement {
    _getTemplate() {
        return WT_G3x5_TSCNDBInfoHTMLElement.TEMPLATE;
    }

    _getSelectButtonQuery() {
        return `#selectbutton`;
    }

    _getOptionsButtonQuery() {
        return `#optionsbutton`;
    }

    _getLocationRowQuery() {
        return `#locationrow`;
    }

    _getRegionTextQuery() {
        return `#region`;
    }

    _getFrequencyButtonQuery() {
        return `#frequencybutton`;
    }

    _getFrequencyTextQuery() {
        return `#frequencytext`;
    }

    _getFrequencyText(frequency) {
        return frequency.hertz(WT_Frequency.Prefix.KHz).toFixed(1);
    }
}
WT_G3x5_TSCNDBInfoHTMLElement.NAME = "wt-tsc-ndbinfo";
WT_G3x5_TSCNDBInfoHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCNDBInfoHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            border-radius: 5px;
            border: 3px solid var(--wt-g3x5-bordergray);
            background: black;
        }

        #wrapper {
            position: absolute;
            left: var(--simplewaypointinfo-padding-left, 0.2em);
            top: var(--simplewaypointinfo-padding-top, 0.2em);
            width: calc(100% - var(--simplewaypointinfo-padding-left, 0.2em) - var(--simplewaypointinfo-padding-right, 0.2em));
            height: calc(100% - var(--simplewaypointinfo-padding-top, 0.2em) - var(--simplewaypointinfo-padding-bottom, 0.2em));
            display: grid;
            grid-template-rows: var(--simplewaypointinfo-header-height, 4em) 1fr;
            grid-template-columns: 100%;
            grid-gap: var(--simplewaypointinfo-header-margin-bottom, 0.2em) 0;
            justify-items: center;
        }
            #header {
                position: relative;
                width: var(--simplewaypointinfo-header-width, 90%);
                display: grid;
                grid-template-rows: 100%;
                grid-template-columns: var(--simplewaypointinfo-selectbutton-width, 67%) 1fr;
                grid-gap: 0 var(--simplewaypointinfo-header-button-margin, 0.5em);
            }
            #info {
                position: relative;
                width: var(--simplewaypointinfo-info-width, 80%);
                display: grid;
                grid-template-columns: 100%;
                grid-template-rows: var(--ndbinfo-grid-rows, repeat(4, 1fr));
                color: white;
            }
                .infoRowContainer {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                .borderRow {
                    border-top: var(--simplewaypointinfo-info-row-border, 1px solid var(--wt-g3x5-bordergray));
                }
                    .infoRow {
                        position: absolute;
                        left: var(--simplewaypointinfo-info-row-padding-left, 0.2em);
                        top: var(--simplewaypointinfo-info-row-padding-top, 0.2em);
                        width: calc(100% - var(--simplewaypointinfo-info-row-padding-left, 0.2em) - var(--simplewaypointinfo-info-row-padding-right, 0.2em));
                        height: calc(100% - var(--simplewaypointinfo-info-row-padding-top, 0.2em) - var(--simplewaypointinfo-info-row-padding-bottom, 0.2em));
                    }
                    #row1 {
                        display: grid;
                        grid-template-rows: 50% 50%;
                        grid-template-columns: 100%;
                        justify-items: start;
                        align-items: center;
                    }
                        #locationrow {
                            position: relative;
                            width: 100%;
                            height: var(--simplewaypointinfo-info-locationrow-height, 100%);
                        }
                        #frequencycontent {
                            position: relative;
                            width: 100%;
                            height: 100%;
                        }
                            #frequencytitle {
                                position: absolute;
                                left: 25%;
                                top: 50%;
                                transform: translate(-50%, -50%);
                            }
                            #frequencytext {
                                position: absolute;
                                left: 50%;
                                top: 50%;
                                transform: translateY(-50%);
                                font-size: var(--navaidinfo-info-frequency-font-size, 1.5em);
                            }

        .${WT_G3x5_TSCSimpleWaypointInfoHTMLElement.UNIT_CLASS} {
            font-size: var(--waypointinfo-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <div id="header">
            <wt-tsc-button-waypoint id="selectbutton" emptytext="Select NDB"></wt-tsc-button-waypoint>
            <wt-tsc-button-label id="optionsbutton" labeltext="Waypoint Options"></wt-tsc-button-label>
        </div>
        <div id="info">
            <div class="infoRowContainer">
                <div id="row1" class="infoRow">
                    <div id="city"></div>
                    <div id="region"></div>
                </div>
            </div>
            <div class="infoRowContainer borderRow">
                <div id="row2" class="infoRow">
                    <wt-tsc-simplewaypointinfo-locationrow id="locationrow"></wt-tsc-simplewaypointinfo-locationrow>
                </div>
            </div>
            <div class="infoRowContainer borderRow">
            </div>
            <wt-tsc-button-content id="frequencybutton">
                <div id="frequencycontent" slot="content">
                    <div id="frequencytitle">Frequency:</div>
                    <div id="frequencytext"></div>
                </div>
            </wt-tsc-button-content>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCNDBInfoHTMLElement.NAME, WT_G3x5_TSCNDBInfoHTMLElement);

// INT

/**
 * @extends WT_G3x5_TSCWaypointInfo<WT_Intersection>
 */
 class WT_G3x5_TSCINTInfo extends WT_G3x5_TSCWaypointInfo {
    constructor(homePageGroup, homePageName, instrumentID, halfPaneID, mfdPaneDisplaySetting) {
        super(homePageGroup, homePageName, instrumentID, halfPaneID, mfdPaneDisplaySetting, WT_ICAOWaypoint.Type.INT);
    }

    _getTitle() {
        return "Intersection Information";
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCINTInfoHTMLElement();
        htmlElement.setContext({
            parentPage: this,
            airplane: this.instrument.airplane,
            unitsModel: this._unitsModel
        })
        return htmlElement;
    }

    async _createWaypointFromICAO(icao) {
        return this.instrument.icaoWaypointFactory.getINT(icao);
    }
}

/**
 * @extends WT_G3x5_TSCSimpleWaypointInfoHTMLElement<WT_Intersection>
 */
class WT_G3x5_TSCINTInfoHTMLElement extends WT_G3x5_TSCSimpleWaypointInfoHTMLElement {
    constructor() {
        super();

        this._lastBearingUnit = null;
        this._lastDistanceUnit = null;
    }

    _getTemplate() {
        return WT_G3x5_TSCINTInfoHTMLElement.TEMPLATE;
    }

    _getSelectButtonQuery() {
        return `#selectbutton`;
    }

    _getOptionsButtonQuery() {
        return `#optionsbutton`;
    }

    _getLocationRowQuery() {
        return `#locationrow`;
    }

    _getRegionTextQuery() {
        return `#region`;
    }

    async _defineChildren() {
        await super._defineChildren();

        this._vorIdent = this.shadowRoot.querySelector(`#nrstvorident`);
        this._vorSymbol = this.shadowRoot.querySelector(`#nrstvorsymbol`);
        this._vorRadial = this.shadowRoot.querySelector(`#nrstvorradial .value`);
        this._vorDistance = this.shadowRoot.querySelector(`#nrstvordistance .value`);
    }

    _updateVORIdent() {
        this._vorIdent.textContent = this._waypoint ? this._waypoint.nearestVOR.icao.substring(7, 12).replace(/ /g, "") : "";
    }

    _getVORSymbolImagePath(vorType) {
        let dir = "/WTg3000/SDK/Assets/Images/Garmin/TSC/Waypoints";
        switch(vorType) {
            case WT_VOR.Type.VOR_DME:
                return `${dir}/ICON_TSC_WAYPOINT_VOR_VORDME.svg`;
            case WT_VOR.Type.DME:
                return `${dir}/ICON_TSC_WAYPOINT_VOR_DME.svg`;
            case WT_VOR.Type.VORTAC:
                return `${dir}/ICON_TSC_WAYPOINT_VOR_VORTAC.svg`;
            case WT_VOR.Type.TACAN:
                return `${dir}/ICON_TSC_WAYPOINT_VOR_TACAN.svg`;
            default:
                return `${dir}/ICON_TSC_WAYPOINT_VOR_VOR.svg`;
        }
    }

    _updateVORSymbol() {
        this._vorSymbol.src = this._waypoint ? this._getVORSymbolImagePath(this._waypoint.nearestVOR.vorType) : "";
    }

    _updateVORRadial() {
        let unit = this._context.unitsModel.bearingUnit;
        if (this._waypoint) {
            let isMagnetic = unit.isMagnetic;
            let text;
            if (isMagnetic) {
                text = `${this._waypoint.nearestVOR.radialMagnetic}°`;
            } else {
                text = `${this._waypoint.nearestVOR.radialTrue}°ᵀ`;
            }
            this._vorRadial.textContent = text;
        } else {
            this._vorRadial.textContent = "";
        }
        this._lastBearingUnit = unit;
    }

    _updateVORDistance() {
        let unit = this._context.unitsModel.distanceUnit;
        this._vorDistance.innerHTML = this._waypoint ? this._distanceFormatter.getFormattedHTML(this._waypoint.nearestVOR.distance, unit) : "";
        this._lastDistanceUnit = unit;
    }

    _updateNearestVOR() {
        this._updateVORIdent();
        this._updateVORSymbol();
        this._updateVORRadial();
        this._updateVORDistance();
    }

    _updateFromWaypoint() {
        super._updateFromWaypoint();

        this._updateNearestVOR();
    }

    _checkUnits() {
        if (!this._context.unitsModel.bearingUnit.equals(this._lastBearingUnit)) {
            this._updateVORRadial();
        }
        if (!this._context.unitsModel.distanceUnit.equals(this._lastDistanceUnit)) {
            this._updateVORDistance();
        }
    }

    _doUpdate() {
        super._doUpdate();

        this._checkUnits();
    }
}
WT_G3x5_TSCINTInfoHTMLElement.NAME = "wt-tsc-intinfo";
WT_G3x5_TSCINTInfoHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCINTInfoHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            border-radius: 5px;
            border: 3px solid var(--wt-g3x5-bordergray);
            background: black;
        }

        #wrapper {
            position: absolute;
            left: var(--simplewaypointinfo-padding-left, 0.2em);
            top: var(--simplewaypointinfo-padding-top, 0.2em);
            width: calc(100% - var(--simplewaypointinfo-padding-left, 0.2em) - var(--simplewaypointinfo-padding-right, 0.2em));
            height: calc(100% - var(--simplewaypointinfo-padding-top, 0.2em) - var(--simplewaypointinfo-padding-bottom, 0.2em));
            display: grid;
            grid-template-rows: var(--simplewaypointinfo-header-height, 4em) 1fr;
            grid-template-columns: 100%;
            grid-gap: var(--simplewaypointinfo-header-margin-bottom, 0.2em) 0;
            justify-items: center;
        }
            #header {
                position: relative;
                width: var(--simplewaypointinfo-header-width, 90%);
                display: grid;
                grid-template-rows: 100%;
                grid-template-columns: var(--simplewaypointinfo-selectbutton-width, 67%) 1fr;
                grid-gap: 0 var(--simplewaypointinfo-header-button-margin, 0.5em);
            }
            #info {
                position: relative;
                width: var(--simplewaypointinfo-info-width, 80%);
                display: grid;
                grid-template-columns: 100%;
                grid-template-rows: var(--intinfo-grid-rows, 1fr 1fr 2fr);
                color: white;
            }
                .infoRowContainer {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                .borderRow {
                    border-top: var(--simplewaypointinfo-info-row-border, 1px solid var(--wt-g3x5-bordergray));
                }
                    .infoRow {
                        position: absolute;
                        left: var(--simplewaypointinfo-info-row-padding-left, 0.2em);
                        top: var(--simplewaypointinfo-info-row-padding-top, 0.2em);
                        width: calc(100% - var(--simplewaypointinfo-info-row-padding-left, 0.2em) - var(--simplewaypointinfo-info-row-padding-right, 0.2em));
                        height: calc(100% - var(--simplewaypointinfo-info-row-padding-top, 0.2em) - var(--simplewaypointinfo-info-row-padding-bottom, 0.2em));
                    }
                        #region {
                            position: absolute;
                            left: 0%;
                            top: 50%;
                            transform: translateY(-50%);
                        }
                        #locationrow {
                            position: absolute;
                            top: 50%;
                            width: 100%;
                            transform: translateY(-50%);
                            height: var(--simplewaypointinfo-info-locationrow-height, 50%);
                        }
                        #nrstvorcontainer {
                            position: absolute;
                            left: 50%;
                            top: 50%;
                            width: 100%;
                            height: var(--intinfo-nrstvor-height, 75%);
                            transform: translate(-50%, -50%);
                            display: grid;
                            grid-template-rows: var(--intinfo-nrstvor-title-height, 1.5em) 1fr;
                            grid-template-columns: 100%;
                        }
                            #nrstvortitle {
                                text-align: left;
                            }
                            #nrstvorinfo {
                                position: relative;
                                width: 100%;
                                height: 100%;
                                display: grid;
                                grid-template-rows: 1.5em 1fr;
                                grid-template-columns: 50% 50%;
                                justify-items: center;
                                align-items: center;
                            }
                                #nrstvorid {
                                    justify-self: stretch;
                                    text-align: right;
                                }
                                    #nrstvorsymbol {
                                        width: 1.2em;
                                        height: 1.2em;
                                        vertical-align: bottom;
                                    }
                                #nrstvorradial {
                                    grid-area: 2 / 1;
                                    text-align: center;
                                }
                                #nrstvordistance {
                                    grid-area: 2 / 2;
                                    text-align: center;
                                }
                                    .title {
                                        font-size: var(--intinfo-nrstvor-radialdistance-title-font-size, 0.85em);
                                    }

        .${WT_G3x5_TSCSimpleWaypointInfoHTMLElement.UNIT_CLASS} {
            font-size: var(--waypointinfo-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <div id="header">
            <wt-tsc-button-waypoint id="selectbutton" emptytext="Select Intersection"></wt-tsc-button-waypoint>
            <wt-tsc-button-label id="optionsbutton" labeltext="Waypoint Options"></wt-tsc-button-label>
        </div>
        <div id="info">
            <div class="infoRowContainer">
                <div id="row1" class="infoRow">
                    <div id="region"></div>
                </div>
            </div>
            <div class="infoRowContainer borderRow">
                <div id="row2" class="infoRow">
                    <wt-tsc-simplewaypointinfo-locationrow id="locationrow"></wt-tsc-simplewaypointinfo-locationrow>
                </div>
            </div>
            <div class="infoRowContainer borderRow">
                <div id="row3" class="infoRow">
                    <div id="nrstvorcontainer">
                        <div id="nrstvortitle">Nearest VOR</div>
                        <div id="nrstvorinfo">
                            <div id="nrstvorid">
                                <span id="nrstvorident"></span>
                                <img id="nrstvorsymbol"></img>
                            </div>
                            <div id="nrstvorradial">
                                <div class="title">RAD</div>
                                <div class="value"></div>
                            </div>
                            <div id="nrstvordistance">
                                <div class="title">DIS</div>
                                <div class="value"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCINTInfoHTMLElement.NAME, WT_G3x5_TSCINTInfoHTMLElement);