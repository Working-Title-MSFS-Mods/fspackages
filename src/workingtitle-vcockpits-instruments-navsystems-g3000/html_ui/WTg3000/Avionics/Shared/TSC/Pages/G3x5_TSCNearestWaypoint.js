class WT_G3x5_TSCNearestWaypointSelection extends WT_G3x5_TSCDirectoryPage {
    _createHTMLElement() {
        return new WT_G3x5_TSCNearestWaypointSelectionHTMLElement();
    }

    _getTitle() {
        return "Nearest";
    }

    _openPage(pagePropertyName) {
        super._openPage(this.instrument.getSelectedMFDPanePages()[pagePropertyName].name);
    }

    _initAirportButton() {
        this.htmlElement.airportButton.addButtonListener(this._openPage.bind(this, "nearestAirport"));
    }

    _initINTButton() {
        this.htmlElement.intButton.addButtonListener(this._openPage.bind(this, "nearestINT"));
    }

    _initVORButton() {
        this.htmlElement.vorButton.addButtonListener(this._openPage.bind(this, "nearestVOR"));
    }

    _initNDBButton() {
        this.htmlElement.ndbButton.addButtonListener(this._openPage.bind(this, "nearestNDB"));
    }

    _doInitButtons() {
        this._initAirportButton();
        this._initINTButton();
        this._initVORButton();
        this._initNDBButton();
    }
}

class WT_G3x5_TSCNearestWaypointSelectionHTMLElement extends WT_G3x5_TSCDirectoryPageHTMLElement {
    _getTemplate() {
        return WT_G3x5_TSCNearestWaypointSelectionHTMLElement.TEMPLATE;
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
WT_G3x5_TSCNearestWaypointSelectionHTMLElement.NAME = "wt-tsc-nearestwaypointselection";
WT_G3x5_TSCNearestWaypointSelectionHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCNearestWaypointSelectionHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: repeat(2, var(--nearestwaypointselection-grid-row, 1fr));
            grid-template-columns: repeat(3, var(--nearestwaypointselection-grid-column, 1fr));
            grid-gap: var(--nearestwaypointselection-grid-gap-row, 2em) var(--nearestwaypointselection-grid-gap-column, 0.5em);
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

customElements.define(WT_G3x5_TSCNearestWaypointSelectionHTMLElement.NAME, WT_G3x5_TSCNearestWaypointSelectionHTMLElement);

/**
 * @abstract
 * @template {WT_ICAOWaypoint} T
 */
class WT_G3x5_TSCNearestWaypoint extends WT_G3x5_TSCPageElement {
    /**
     * @param {String} homePageGroup
     * @param {String} homePageName
     * @param {String} instrumentID
     * @param {WT_G3x5_MFDHalfPane.ID} halfPaneID
     * @param {Object} mfdPanePages
     * @param {Object} mfdPaneSettings
     */
    constructor(homePageGroup, homePageName, instrumentID, halfPaneID, mfdPanePages, mfdPaneSettings) {
        super(homePageGroup, homePageName);

        /**
         * @type {WT_ReadOnlyArray<T>}
         */
        this._waypoints = null;
        this._selectedWaypoint = null;

        this._settingModelID = this._getSettingModelID(instrumentID, halfPaneID);
        this._mfdPanePages = mfdPanePages;
        this._mfdPaneSettings = mfdPaneSettings;
        this._initSettingModel();
    }

    _getSettingModelID(instrumentID, halfPaneID) {
        return `${instrumentID}-${halfPaneID}_${WT_G3x5_NearestWaypointDisplay.SETTING_MODEL_ID}`;
    }

    _initSettingModel() {
        this._settingModel = new WT_DataStoreSettingModel(this._settingModelID);
        this._settingModel.addSetting(this._displayPaneICAOSetting = new WT_G3x5_WaypointDisplayICAOSetting(this._settingModel));
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCNearestWaypointHTMLElement<T>}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @type {WT_G3x5_MFDHalfPaneDisplaySetting}
     */
    get mfdPaneDisplaySetting() {
        return this._mfdPaneSettings.display;
    }

    /**
     * @readonly
     * @type {T}
     */
    get selectedWaypoint() {
        return this._selectedWaypoint;
    }

    _createUnitsModel() {
        return new WT_G3x5_TSCNearestWaypointUnitsModel(this.instrument.unitsSettingModel);
    }

    _initWaypointList() {
        this._waypointList = this._getWaypointList();
        this._waypointList.addListener(this._onWaypointListChanged.bind(this));
        this._updateWaypoints();
    }

    _initHTMLElement() {
        this.htmlElement.addListener(this._onHTMLElementEvent.bind(this));
    }

    init(root) {
        this.container.title = this._getTitle();

        this._unitsModel = this._createUnitsModel();

        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
        this._initWaypointList();
        this._initHTMLElement();
    }

    _updateWaypoints() {
        this._waypoints = this._waypointList.waypoints;
        this.htmlElement.setWaypoints(this._waypoints);

        if (this.selectedWaypoint !== null && !this._waypoints.some(waypoint => waypoint.equals(this.selectedWaypoint), this)) {
            this._setSelectedWaypoint(null);
        }
    }

    _onWaypointListChanged(source) {
        this._updateWaypoints();
    }

    /**
     *
     * @param {T} waypoint
     */
    _setSelectedWaypoint(waypoint) {
        this._selectedWaypoint = waypoint;
    }

    /**
     *
     * @param {T} waypoint
     */
    _onWaypointButtonPressed(waypoint) {
        if (waypoint.equals(this.selectedWaypoint)) {
            this._setSelectedWaypoint(null);
            this.htmlElement.hideOptionsBanner();
        } else {
            this._setSelectedWaypoint(waypoint);
            this.htmlElement.showOptionsBanner();
        }
    }

    _onDRCTButtonPressed() {
        this.instrument.SwitchToPageName("MFD", "Direct To");
    }

    _toggleNearestWaypointDisplayPane() {
        if (this.mfdPaneDisplaySetting.getValue() === WT_G3x5_MFDHalfPaneDisplaySetting.Display.NRST_WAYPOINT && this._displayPaneICAOSetting.getValue() === this.selectedWaypoint.icao) {
            this.mfdPaneDisplaySetting.setValue(WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP);
        } else {
            this._displayPaneICAOSetting.setValue(this.selectedWaypoint.icao);
            this.mfdPaneDisplaySetting.setValue(WT_G3x5_MFDHalfPaneDisplaySetting.Display.NRST_WAYPOINT);
        }
    }

    _onInfoButtonPressed() {
        if (!this.selectedWaypoint) {
            return;
        }

        let infoPage = this._getInfoPage();
        infoPage.element.setWaypoint(this.selectedWaypoint);
        this.instrument.SwitchToPageName("MFD", infoPage.name);
    }

    _onChartsButtonPressed() {
    }

    _onShowMapButtonPressed() {
        if (!this.selectedWaypoint) {
            return;
        }

        this._toggleNearestWaypointDisplayPane();
    }

    _onHTMLElementEvent(source, eventType, data) {
        switch (eventType) {
            case this._getWaypointButtonEventType():
                this._onWaypointButtonPressed(data);
                break;
            case this._getDRCTButtonEventType():
                this._onDRCTButtonPressed();
                break;
            case this._getInfoButtonEventType():
                this._onInfoButtonPressed();
                break;
            case this._getChartsButtonEventType():
                this._onChartsButtonPressed();
                break;
            case this._getShowMapButtonEventType():
                this._onShowMapButtonPressed();
                break;
        }
    }

    _onUpPressed() {
        if (this.selectedWaypoint && this._waypoints) {
            let index = this._waypoints.findIndex(waypoint => waypoint.equals(this.selectedWaypoint));
            if (index - 1 >= 0) {
                let waypoint = this._waypoints.get(index - 1);
                this._setSelectedWaypoint(waypoint);
                this.htmlElement.scrollToWaypoint(waypoint);
                return;
            }
        }

        this.htmlElement.scrollUp();
    }

    _onDownPressed() {
        if (this.selectedWaypoint && this._waypoints) {
            let index = this._waypoints.findIndex(waypoint => waypoint.equals(this.selectedWaypoint));
            if (index >= 0 && index + 1 < this._waypoints.length) {
                let waypoint = this._waypoints.get(index + 1);
                this._setSelectedWaypoint(waypoint);
                this.htmlElement.scrollToWaypoint(waypoint);
                return;
            }
        }

        this.htmlElement.scrollDown();
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

    onEnter() {
        super.onEnter();

        this.htmlElement.open();
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }

    _updateDirectTo() {
        // TODO: Implement a more sane way to push data to direct to page.
        let waypoint = this.selectedWaypoint;
        this.instrument.lastRelevantICAO = waypoint ? waypoint.icao : null;
    }

    onExit() {
        super.onExit();

        this.htmlElement.close();
        this._updateDirectTo();
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

/**
 * @abstract
 * @template {WT_ICAOWaypoint} T
 */
class WT_G3x5_TSCNearestWaypointHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._airplanePosition = new WT_GeoPoint(0, 0);
        this._state = {
            airplanePosition: this._airplanePosition.readonly()
        };

        /**
         * @type {WT_G3x5_TSCNearestWaypointRowHTMLElement<T>[]}
         */
        this._rows = [];
        /**
         * @type {T[]}
         */
        this._waypoints = [];
        this._waypointRowListener = this._onWaypointRowEvent.bind(this);

        /**
         * @type {((source:WT_G3x5_TSCNearestWaypointHTMLElement<T>, eventType:Number, data:*) => void)[]}
         */
        this._listeners = [];

        /**
         * @type {{parentPage:WT_G3x5_TSCNearestWaypoint, airplane:WT_PlayerAirplane, unitsModel:WT_G3x5_TSCNearestWaypointUnitsModel, displayPaneICAOSetting:WT_G3x5_NearestWaypointICAOSetting}}
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
        [
            this._waypointsList,
            this._optionsBanner,
            this._drctButton,
            this._infoButton,
            this._chartsButton,
            this._showMapButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#waypoints`, WT_TSCScrollList),
            WT_CustomElementSelector.select(this.shadowRoot, `#optionsbanner`, WT_TSCSlidingBanner),
            WT_CustomElementSelector.select(this.shadowRoot, `#directto`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#info`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#charts`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#map`, WT_TSCStatusBarButton)
        ]);
    }

    _initWaypointRowRecycler() {
        /**
         * @type {WT_G3x5_TSCNearestWaypointRowRecycler<WT_G3x5_TSCNearestWaypointRowHTMLElement<T>>}
         */
        this._waypointRowRecycler = this._createWaypointRowRecycler();
    }

    _initHeader() {
        this._col1Title.innerHTML = this._getCol1TitleText();
        this._col2Title.innerHTML = this._getCol2TitleText();
        this._col3Title.innerHTML = this._getCol3TitleText();
        this._col4Title.innerHTML = this._getCol4TitleText();
    }

    _initOptions() {
        this._drctButton.addButtonListener(this._onDRCTButtonPressed.bind(this));
        this._infoButton.addButtonListener(this._onInfoButtonPressed.bind(this));
        this._chartsButton.addButtonListener(this._onChartsButtonPressed.bind(this));
        this._showMapButton.addButtonListener(this._onShowMapButtonPressed.bind(this));
        this._infoButton.labelText = this._getOptionsInfoButtonLabelText();
        this._chartsButton.labelText = this._getOptionsChartsButtonLabelText();
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initWaypointRowRecycler();
        this._initHeader();
        this._initOptions();
        this._isInit = true;
        this._updateFromWaypoints();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    setContext(context) {
        this._context = context;
    }

    /**
     *
     * @param {(source:WT_G3x5_TSCNearestWaypointHTMLElement<T>, eventType:Number, data:*) => void} listener
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     *
     * @param {(source:WT_G3x5_TSCNearestWaypointHTMLElement<T>, eventType:Number, data:*) => void} listener
     */
    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    _fireEvent(eventType, data) {
        this._listeners.forEach(listener => listener(this, eventType, data));
    }

    _onDRCTButtonPressed(button) {
        this._fireEvent(this._getDRCTButtonEventType());
    }

    _onInfoButtonPressed(button) {
        this._fireEvent(this._getInfoButtonEventType());
    }

    _onChartsButtonPressed(button) {
        this._fireEvent(this._getChartsButtonEventType());
    }

    _onShowMapButtonPressed(button) {
        this._fireEvent(this._getShowMapButtonEventType());
    }

    _onWaypointRowEvent(row, eventType) {
    }

    showOptionsBanner() {
        this._optionsBanner.slideIn(WT_TSCSlidingBanner.Direction.RIGHT);
    }

    hideOptionsBanner() {
        this._optionsBanner.slideOut(WT_TSCSlidingBanner.Direction.RIGHT);
    }

    toggleOptionsBanner() {
        if (this._optionsBanner.isVisible) {
            this.hideOptionsBanner();
        } else {
            this.showOptionsBanner();
        }
    }

    _updateFromWaypoints() {
        for (let i = 0; i < this._rows.length; i++) {
            let row = this._rows[i];
            let index = this._waypoints.findIndex(waypoint => waypoint.equals(row.waypoint));
            if (index < 0) {
                this._waypointRowRecycler.recycle(row);
                this._rows.splice(i, 1);
                i--;
            }
        }

        for (let i = 0; i < this._waypoints.length; i++) {
            let waypoint = this._waypoints[i];
            let index = this._rows.findIndex(row => row.waypoint.equals(waypoint));
            let row;
            if (index >= 0) {
                row = this._rows[index];
            } else {
                row = this._waypointRowRecycler.request();
                row.setContext({
                    parentPage: this._context.parentPage,
                    airplane: this._context.airplane,
                    unitsModel: this._context.unitsModel
                });
                row.setWaypoint(waypoint);
                this._rows.push(row);
            }
            row.style.order = `${i}`;
        }
    }

    /**
     *
     * @param {WT_ReadOnlyArray<T>} waypoints
     */
    setWaypoints(waypoints) {
        if (waypoints.length === this._waypoints.length && waypoints.every((waypoint, index) => waypoint.equals(this._waypoints[index]))) {
            return;
        }

        this._waypoints = waypoints.slice();
        if (this._isInit) {
            this._updateFromWaypoints();
        }
    }

    open() {
    }

    _updateState() {
        this._context.airplane.navigation.position(this._airplanePosition);
        this._state.airplaneHeadingTrue = this._context.airplane.navigation.headingTrue();
    }

    _updateRows() {
        this._rows.forEach(row => row.update(this._state), this);
    }

    _updateMapButton() {
        let paneDisplayMode = this._context.parentPage.mfdPaneDisplaySetting.getValue();
        let selectedWaypoint = this._context.parentPage.selectedWaypoint;
        let selectedWaypointICAO = selectedWaypoint ? selectedWaypoint.icao : "";
        this._showMapButton.enabled = selectedWaypoint === null ? "false" : "true";
        this._showMapButton.toggle = (paneDisplayMode === WT_G3x5_MFDHalfPaneDisplaySetting.Display.NRST_WAYPOINT && selectedWaypoint && selectedWaypointICAO === this._context.displayPaneICAOSetting.getValue()) ? "on" : "off";
    }

    _updateOptions() {
        if (this._optionsBanner.isVisible && this._context.parentPage.selectedWaypoint === null) {
            this.hideOptionsBanner();
        }

        if (!this._optionsBanner.isVisible) {
            return;
        }

        this._updateMapButton();
    }

    _doUpdate() {
        this._updateState();
        this._updateRows();
        this._updateOptions();
        this._waypointsList.scrollManager.update();
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._doUpdate();
    }

    close() {
        this._optionsBanner.popOut();
    }

    scrollUp() {
        this._waypointsList.scrollManager.scrollUp();
    }

    scrollDown() {
        this._waypointsList.scrollManager.scrollDown();
    }

    scrollToWaypoint(waypoint) {
        let targetRow = this._rows.find(row => row.waypoint.equals(waypoint));
        if (targetRow) {
            this._waypointsList.scrollManager.scrollToElement(targetRow);
        }
    }
}
WT_G3x5_TSCNearestWaypointHTMLElement.ROW_CLASS = "nearestWaypointRow";
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
                #waypoints .${WT_G3x5_TSCNearestWaypointHTMLElement.ROW_CLASS} {
                    height: var(--nearestwaypoints-row-height, 3em);
                    margin: var(--nearestwaypoints-row-margin, 0);
                }
            #optionsbanner {
                position: absolute;
                right: -1vw;
                top: 50%;
                width: calc(var(--nearestwaypoints-options-width, 25%) + 1vw + var(--nearestwaypoints-options-margin-right, 0px));
                height: var(--nearestwaypoints-options-height, 100%);
                transform: translateY(-50%);
                --slidingbanner-padding-right: calc(1vw + var(--nearestwaypoints-options-margin-right, 0px));
            }
                #optionspadding {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 5px;
                    border: 3px solid var(--wt-g3x5-bordergray);
                    background: black;
                }
                #optionscontainer {
                    position: absolute;
                    left: var(--nearestwaypoints-options-padding-left, 0.25em);
                    top: var(--nearestwaypoints-options-padding-top, 0.25em);
                    width: calc(100% - var(--nearestwaypoints-options-padding-left, 0.25em) - var(--nearestwaypoints-options-padding-right, 0.25em));
                    height: calc(100% - var(--nearestwaypoints-options-padding-top, 0.25em) - var(--nearestwaypoints-options-padding-bottom, 0.25em));
                    font-size: var(--nearestwaypoints-options-font-size, 0.85em);
                    display: flex;
                    flex-flow: column nowrap;
                    align-items: stretch;
                }
                    #optionstitle {
                        margin-bottom: var(--nearestwaypoints-options-title-margin-bottom, 0.25em);
                        text-align: center;
                    }
                    .optionsButton {
                        height: var(--nearestwaypoints-options-button-height, 3em);
                        margin-bottom: var(--nearestwaypoints-options-button-margin, 0.25em);
                    }
                    #directto {
                        --button-img-image-height: 100%;
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
        <wt-tsc-slidingbanner id="optionsbanner">
            <div slot="content" id="optionspadding">
                <div id="optionscontainer">
                    <div id="optionstitle">Waypoint Options</div>
                    <wt-tsc-button-img id="directto" class="optionsButton" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAP_DIRECT_TO_1.png"></wt-tsc-button-img>
                    <wt-tsc-button-label id="info" class="optionsButton"></wt-tsc-button-label>
                    <wt-tsc-button-label id="charts" class="optionsButton"></wt-tsc-button-label>
                    <wt-tsc-button-statusbar id="map" class="optionsButton" labeltext="Show On Map"></wt-tsc-button-statusbar>
                </div>
            </div>
        </wt-tsc-slidingbanner>
    </div>
`;

/**
 * @template T
 * @extends WT_CustomHTMLElementRecycler<T>
 */
class WT_G3x5_TSCNearestWaypointRowRecycler extends WT_CustomHTMLElementRecycler {
    /**
     * @param {HTMLElement} parent
     * @param {new T} htmlElementConstructor
     * @param {(source:T, eventType:Number) => void} listener
     */
    constructor(parent, htmlElementConstructor, listener) {
        super(parent, htmlElementConstructor);

        this._listener = listener;
    }

    _createElement() {
        let element = super._createElement();
        element.addListener(this._listener);
        element.slot = "content";
        element.classList.add(WT_G3x5_TSCNearestWaypointHTMLElement.ROW_CLASS);
        return element;
    }
}

/**
 * @abstract
 * @template {WT_ICAOWaypoint} T
 */
class WT_G3x5_TSCNearestWaypointRowHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {((source:WT_G3x5_TSCNearestWaypointRowHTMLElement<T>, eventType:Number) => void)[]}
         */
        this._listeners = [];

        /**
         * @type {{parentPage:WT_G3x5_TSCNearestWaypoint<T>, airplane:WT_PlayerAirplane, unitsModel:WT_G3x5_TSCNearestWaypointUnitsModel}}
         */
        this._context = null;
        /**
         * @type {T}
         */
        this._waypoint = null;
        this._isHighlighted = false;
        this._isInit = false;

        this._initFormatters();

        this._tempGARad = new WT_NumberUnit(0, WT_Unit.GA_RADIAN);
        this._tempTrueBearing = new WT_NavAngleUnit(false).createNumber(0);
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

        this._bearingText = new WT_CachedElement(this.shadowRoot.querySelector(this._getBearingTextQuery()));
        this._distanceText = new WT_CachedElement(this.shadowRoot.querySelector(this._getDistanceTextQuery()));
    }

    _initWaypointButton() {
        this._waypointButton.setIconSrcFactory(new WT_G3x5_TSCWaypointButtonIconSrcFactory(WT_G3x5_TSCNearestWaypointRowHTMLElement.WAYPOINT_ICON_PATH));
        this._waypointButton.addButtonListener(this._onWaypointButtonPressed.bind(this));
    }

    _initChildren() {
        this._initWaypointButton();
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initChildren();
        this._isInit = true;
        this._updateFromWaypoint();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    setContext(context) {
        this._context = context;
    }

    _updateFromWaypoint() {
        this._waypointButton.setWaypoint(this._waypoint);
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

    /**
     *
     * @param {(source:WT_G3x5_TSCNearestWaypointRowHTMLElement<T>, eventType:Number) => void} listener
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     *
     * @param {(source:WT_G3x5_TSCNearestWaypointRowHTMLElement<T>, eventType:Number) => void} listener
     */
    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    _fireEvent(eventType) {
        this._listeners.forEach(listener => listener(this, eventType));
    }

    _onWaypointButtonPressed(button) {
        this._fireEvent(this._getWaypointButtonEvent());
    }

    /**
     *
     * @param {{airplanePosition:WT_GeoPointReadOnly, airplaneHeadingTrue:Number}} state
     */
    _updateWaypointButton(state) {
        this._waypointButton.update(state.airplaneHeadingTrue);
    }

    _updateHighlight() {
        let shouldHighlight = this.waypoint.equals(this._context.parentPage.selectedWaypoint);
        if (shouldHighlight !== this._isHighlighted) {
            this._waypointButton.highlight = `${shouldHighlight}`;
            this._isHighlighted = shouldHighlight;
        }
    }

    _clearBearingInfo() {
        this._bearingArrow.setBearing(0);
        this._bearingText.textContent = "";
    }

    /**
     *
     * @param {{airplanePosition:WT_GeoPointReadOnly, airplaneHeadingTrue:Number}} state
     */
    _updateBearing(state) {
        if (!this.waypoint) {
            this._clearBearingInfo();
        }

        let bearing = this._tempTrueBearing.set(state.airplanePosition.bearingTo(this.waypoint.location));
        bearing.unit.setLocation(state.airplanePosition);

        this._bearingArrow.setBearing(bearing.number - state.airplaneHeadingTrue);

        let unit = this._context.unitsModel.bearingUnit;
        this._bearingText.textContent = this._bearingFormatter.getFormattedString(bearing, unit);
    }

    _clearDistanceInfo() {
        this._distanceText.innerHTML = "";
    }

    /**
     *
     * @param {{airplanePosition:WT_GeoPointReadOnly, airplaneHeadingTrue:Number}} state
     */
    _updateDistance(state) {
        if (!this.waypoint) {
            this._clearDistanceInfo();
        }

        let distance = this._tempGARad.set(this.waypoint.location.distance(state.airplanePosition));
        let unit = this._context.unitsModel.distanceUnit;
        this._distanceText.innerHTML = this._distanceFormatter.getFormattedHTML(distance, unit);
    }

    /**
     *
     * @param {{airplanePosition:WT_GeoPointReadOnly, airplaneHeadingTrue:Number}} state
     */
    _doUpdate(state) {
        this._updateWaypointButton(state);
        this._updateHighlight(state);
        this._updateBearing(state);
        this._updateDistance(state);
    }

    /**
     *
     * @param {{airplanePosition:WT_GeoPointReadOnly, airplaneHeadingTrue:Number}} state
     */
    update(state) {
        if (!this._isInit || !this._context) {
            return;
        }

        this._doUpdate(state);
    }
}
WT_G3x5_TSCNearestWaypointRowHTMLElement.WAYPOINT_ICON_PATH = "/WTg3000/SDK/Assets/Images/Garmin/TSC/Waypoints";
WT_G3x5_TSCNearestWaypointRowHTMLElement.UNIT_CLASS = "unit";

// NEAREST AIRPORT

/**
 * @extends WT_G3x5_TSCNearestWaypoint<WT_Airport>
 */
class WT_G3x5_TSCNearestAirport extends WT_G3x5_TSCNearestWaypoint {
    _getTitle() {
        return "Nearest Airport";
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCNearestAirportHTMLElement();
        htmlElement.setContext({
            parentPage: this,
            airplane: this.instrument.airplane,
            unitsModel: this._unitsModel,
            displayPaneICAOSetting: this._displayPaneICAOSetting
        });
        return htmlElement;
    }

    _getWaypointList() {
        return this.instrument.nearestAirportList;
    }

    _getWaypointButtonEventType() {
        return WT_G3x5_TSCNearestAirportHTMLElement.EventType.WAYPOINT_BUTTON_PRESSED;
    }

    _getDRCTButtonEventType() {
        return WT_G3x5_TSCNearestAirportHTMLElement.EventType.DRCT_BUTTON_PRESSED;
    }

    _getInfoButtonEventType() {
        return WT_G3x5_TSCNearestAirportHTMLElement.EventType.INFO_BUTTON_PRESSED;
    }

    _getChartsButtonEventType() {
        return WT_G3x5_TSCNearestAirportHTMLElement.EventType.CHARTS_BUTTON_PRESSED;
    }

    _getShowMapButtonEventType() {
        return WT_G3x5_TSCNearestAirportHTMLElement.EventType.MAP_BUTTON_PRESSED;
    }

    _getInfoPage() {
        return this._mfdPanePages.airportInfo;
    }

    _onChartsButtonPressed() {
        if (!this.selectedWaypoint) {
            return;
        }

        let chartsPage = this._mfdPanePages.charts;
        chartsPage.element.setAirportICAO(this.selectedWaypoint.icao);
        this.instrument.SwitchToPageName("MFD", chartsPage.name);
    }
}

/**
 * @extends WT_G3x5_TSCNearestWaypointHTMLElement<WT_Airport>
 */
 class WT_G3x5_TSCNearestAirportHTMLElement extends WT_G3x5_TSCNearestWaypointHTMLElement {
    _createWaypointRowRecycler() {
        return new WT_G3x5_TSCNearestWaypointRowRecycler(this._waypointsList, WT_G3x5_TSCNearestAirportRowHTMLElement, this._waypointRowListener);
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

    _getOptionsInfoButtonLabelText() {
        return "Airport Info";
    }

    _getOptionsChartsButtonLabelText() {
        return "Airport Charts";
    }

    _getWaypointButtonEventType() {
        return WT_G3x5_TSCNearestAirportHTMLElement.EventType.WAYPOINT_BUTTON_PRESSED;
    }

    _getDRCTButtonEventType() {
        return WT_G3x5_TSCNearestAirportHTMLElement.EventType.DRCT_BUTTON_PRESSED;
    }

    _getInfoButtonEventType() {
        return WT_G3x5_TSCNearestAirportHTMLElement.EventType.INFO_BUTTON_PRESSED;
    }

    _getChartsButtonEventType() {
        return WT_G3x5_TSCNearestAirportHTMLElement.EventType.CHARTS_BUTTON_PRESSED;
    }

    _getShowMapButtonEventType() {
        return WT_G3x5_TSCNearestAirportHTMLElement.EventType.MAP_BUTTON_PRESSED;
    }

    /**
     *
     * @param {WT_G3x5_TSCNearestAirportRowHTMLElement} row
     */
    _onWaypointButtonPressed(row) {
        this._fireEvent(this._getWaypointButtonEventType(), row.waypoint);
    }

    _onWaypointRowEvent(row, eventType) {
        if (eventType === WT_G3x5_TSCNearestAirportRowHTMLElement.EventType.WAYPOINT_BUTTON_PRESSED) {
            this._onWaypointButtonPressed(row);
        }
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCNearestAirportHTMLElement.EventType = {
    WAYPOINT_BUTTON_PRESSED: 0,
    DRCT_BUTTON_PRESSED: 1,
    INFO_BUTTON_PRESSED: 2,
    CHARTS_BUTTON_PRESSED: 3,
    MAP_BUTTON_PRESSED: 4
};
WT_G3x5_TSCNearestAirportHTMLElement.NAME = "wt-tsc-nearestairport";

customElements.define(WT_G3x5_TSCNearestAirportHTMLElement.NAME, WT_G3x5_TSCNearestAirportHTMLElement);

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

    _getWaypointButtonEvent() {
        return WT_G3x5_TSCNearestAirportRowHTMLElement.EventType.WAYPOINT_BUTTON_PRESSED;
    }

    /**
     *
     * @param {{airplanePosition:WT_GeoPointReadOnly, airplaneHeadingTrue:Number}} state
     */
    _updateLengthUnit(state) {
        let unit = this._context.unitsModel.lengthUnit;
        if (!unit.equals(this._lastLengthUnit)) {
            this._updateRunway();
        }
    }

    /**
     *
     * @param {{airplanePosition:WT_GeoPointReadOnly, airplaneHeadingTrue:Number}} state
     */
    _doUpdate(state) {
        super._doUpdate(state);

        this._updateLengthUnit(state);
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCNearestAirportRowHTMLElement.EventType = {
    WAYPOINT_BUTTON_PRESSED: 0
};
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
                font-size: var(--nearestwaypoint-row-waypointbutton-font-size, 0.75em);
                --waypoint-ident-color: white;
            }
            #bearing {
                position: relative;
                transform: rotateX(0deg);
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
                transform: rotateX(0deg);
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

// NEAREST VOR/NDB

/**
 * @abstract
 * @template {WT_VOR|WT_NDB} T
 * @extends WT_G3x5_TSCNearestWaypoint<T>
 */
class WT_G3x5_TSCNearestNavAid extends WT_G3x5_TSCNearestWaypoint {
    _getWaypointButtonEventType() {
        return WT_G3x5_TSCNearestNavAidHTMLElement.EventType.WAYPOINT_BUTTON_PRESSED;
    }

    _getFrequencyButtonEventType() {
        return WT_G3x5_TSCNearestNavAidHTMLElement.EventType.FREQUENCY_BUTTON_PRESSED;
    }

    _getDRCTButtonEventType() {
        return WT_G3x5_TSCNearestNavAidHTMLElement.EventType.DRCT_BUTTON_PRESSED;
    }

    _getInfoButtonEventType() {
        return WT_G3x5_TSCNearestNavAidHTMLElement.EventType.INFO_BUTTON_PRESSED;
    }

    _getChartsButtonEventType() {
        return undefined;
    }

    _getShowMapButtonEventType() {
        return WT_G3x5_TSCNearestNavAidHTMLElement.EventType.MAP_BUTTON_PRESSED;
    }

    /**
     *
     * @param {T} waypoint
     */
    _openFrequencyWindow(waypoint) {
        let instrument = this.instrument;
        let context = {
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            frequencyText: this._getFrequencyText(waypoint),
            frequency: waypoint.frequency,
            radioSlotType: this._getRadioSlotType(waypoint)
        }
        instrument.loadFrequencyWindow.element.setContext(context);
        instrument.switchToPopUpPage(instrument.loadFrequencyWindow);
    }

    /**
     *
     * @param {T} waypoint
     */
    _onFrequencyButtonPressed(waypoint) {
        this._openFrequencyWindow(waypoint);
    }

    _onHTMLElementEvent(source, eventType, data) {
        switch (eventType) {
            case this._getWaypointButtonEventType():
                this._onWaypointButtonPressed(data);
                break;
            case this._getFrequencyButtonEventType():
                this._onFrequencyButtonPressed(data);
                break;
            case this._getDRCTButtonEventType():
                this._onDRCTButtonPressed();
                break;
            case this._getInfoButtonEventType():
                this._onInfoButtonPressed();
                break;
            case this._getShowMapButtonEventType():
                this._onShowMapButtonPressed();
                break;
        }
    }
}

/**
 * @abstract
 * @template {WT_VOR|WT_NDB} T
 * @extends WT_G3x5_TSCNearestWaypointHTMLElement<T>
 */
class WT_G3x5_TSCNearestNavAidHTMLElement extends WT_G3x5_TSCNearestWaypointHTMLElement {
    _getCol2TitleText() {
        return "BRG";
    }

    _getCol3TitleText() {
        return "DIS";
    }

    _getCol4TitleText() {
        return "Frequency";
    }

    _getOptionsChartsButtonLabelText() {
        return "";
    }

    _initOptions() {
        super._initOptions();

        this._chartsButton.style.display = "none";
    }

    _getWaypointButtonEventType() {
        return WT_G3x5_TSCNearestNavAidHTMLElement.EventType.WAYPOINT_BUTTON_PRESSED;
    }

    _getFrequencyButtonEventType() {
        return WT_G3x5_TSCNearestNavAidHTMLElement.EventType.FREQUENCY_BUTTON_PRESSED;
    }

    _getDRCTButtonEventType() {
        return WT_G3x5_TSCNearestNavAidHTMLElement.EventType.DRCT_BUTTON_PRESSED;
    }

    _getInfoButtonEventType() {
        return WT_G3x5_TSCNearestNavAidHTMLElement.EventType.INFO_BUTTON_PRESSED;
    }

    _getChartsButtonEventType() {
        return undefined;
    }

    _getShowMapButtonEventType() {
        return WT_G3x5_TSCNearestNavAidHTMLElement.EventType.MAP_BUTTON_PRESSED;
    }

    /**
     *
     * @param {WT_G3x5_TSCNearestNavAidRowHTMLElement} row
     */
    _onWaypointButtonPressed(row) {
        this._fireEvent(this._getWaypointButtonEventType(), row.waypoint);
    }

    /**
     *
     * @param {WT_G3x5_TSCNearestNavAidRowHTMLElement} row
     */
    _onFrequencyButtonPressed(row) {
        this._fireEvent(this._getFrequencyButtonEventType(), row.waypoint);
    }

    _onWaypointRowEvent(row, eventType) {
        switch (eventType) {
            case WT_G3x5_TSCNearestNavAidRowHTMLElement.EventType.WAYPOINT_BUTTON_PRESSED:
                this._onWaypointButtonPressed(row);
                break;
            case WT_G3x5_TSCNearestNavAidRowHTMLElement.EventType.FREQUENCY_BUTTON_PRESSED:
                this._onFrequencyButtonPressed(row);
                break;
        }
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCNearestNavAidHTMLElement.EventType = {
    WAYPOINT_BUTTON_PRESSED: 0,
    FREQUENCY_BUTTON_PRESSED: 1,
    DRCT_BUTTON_PRESSED: 2,
    INFO_BUTTON_PRESSED: 3,
    MAP_BUTTON_PRESSED: 4
};

/**
 * @abstract
 * @template {WT_VOR|WT_NDB} T
 * @extends WT_G3x5_TSCNearestWaypointRowHTMLElement<T>
 */
class WT_G3x5_TSCNearestNavAidRowHTMLElement extends WT_G3x5_TSCNearestWaypointRowHTMLElement {
    constructor() {
        super();
    }

    _getTemplate() {
        return WT_G3x5_TSCNearestNavAidRowHTMLElement.TEMPLATE;
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

        this._frequencyButton = await WT_CustomElementSelector.select(this.shadowRoot, `#frequency`, WT_TSCLabeledButton);
    }

    _initFrequencyButton() {
        this._frequencyButton.addButtonListener(this._onFrequencyButtonPressed.bind(this));
    }

    _initChildren() {
        super._initChildren();

        this._initFrequencyButton();
    }

    _setFrequencyText(text) {
        this._frequencyButton.labelText = text;
    }

    _updateFrequency() {
        if (this.waypoint) {
            let frequencyText = this._getFrequencyText(this.waypoint.frequency);
            this._setFrequencyText(frequencyText);
        } else {
            this._setFrequencyText("");
        }
    }

    _updateFromWaypoint() {
        super._updateFromWaypoint();

        this._updateFrequency();
    }

    _getWaypointButtonEvent() {
        return WT_G3x5_TSCNearestNavAidRowHTMLElement.EventType.WAYPOINT_BUTTON_PRESSED;
    }

    _getFrequencyButtonEvent() {
        return WT_G3x5_TSCNearestNavAidRowHTMLElement.EventType.FREQUENCY_BUTTON_PRESSED;
    }

    _onFrequencyButtonPressed() {
        this._fireEvent(this._getFrequencyButtonEvent());
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCNearestNavAidRowHTMLElement.EventType = {
    WAYPOINT_BUTTON_PRESSED: 0,
    FREQUENCY_BUTTON_PRESSED: 1
};
WT_G3x5_TSCNearestNavAidRowHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCNearestNavAidRowHTMLElement.TEMPLATE.innerHTML = `
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
                font-size: var(--nearestwaypoint-row-waypointbutton-font-size, 0.75em);
                --waypoint-ident-color: white;
            }
            #bearing {
                position: relative;
                transform: rotateX(0deg);
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
                transform: rotateX(0deg);
            }
                #distancetext {
                    position: absolute;
                    left: 0%;
                    top: 50%;
                    width: 100%;
                    transform: translateY(-50%);
                    text-align: center;
                }
            #frequency {
                font-size: var(--nearestwaypoint-row-frequencybutton-font-size, 0.85em);
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
        <wt-tsc-button-label id="frequency"></wt-tsc-button-label>
    </div>
`;

// NEAREST VOR

/**
 * @extends WT_G3x5_TSCNearestNavAid<WT_VOR>
 */
class WT_G3x5_TSCNearestVOR extends WT_G3x5_TSCNearestNavAid {
    _getTitle() {
        return "Nearest VOR";
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCNearestVORHTMLElement();
        htmlElement.setContext({
            parentPage: this,
            airplane: this.instrument.airplane,
            unitsModel: this._unitsModel,
            displayPaneICAOSetting: this._displayPaneICAOSetting
        });
        return htmlElement;
    }

    _getWaypointList() {
        return this.instrument.nearestVORList;
    }

    _getInfoPage() {
        return this._mfdPanePages.vorInfo;
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
 * @extends WT_G3x5_TSCNearestNavAidHTMLElement<WT_VOR>
 */
class WT_G3x5_TSCNearestVORHTMLElement extends WT_G3x5_TSCNearestNavAidHTMLElement {
    _createWaypointRowRecycler() {
        return new WT_G3x5_TSCNearestWaypointRowRecycler(this._waypointsList, WT_G3x5_TSCNearestVORRowHTMLElement, this._waypointRowListener);
    }

    _getCol1TitleText() {
        return "VOR";
    }

    _getOptionsInfoButtonLabelText() {
        return "VOR Info";
    }
}
WT_G3x5_TSCNearestVORHTMLElement.NAME = "wt-tsc-nearestvor";

customElements.define(WT_G3x5_TSCNearestVORHTMLElement.NAME, WT_G3x5_TSCNearestVORHTMLElement);

/**
 * @extends WT_G3x5_TSCNearestNavAidRowHTMLElement<WT_VOR>
 */
class WT_G3x5_TSCNearestVORRowHTMLElement extends WT_G3x5_TSCNearestNavAidRowHTMLElement {
    /**
     *
     * @param {WT_Frequency} frequency
     * @returns {String}
     */
    _getFrequencyText(frequency) {
        return frequency.hertz(WT_Frequency.Prefix.MHz).toFixed(3).replace(/(\...)0$/, "$1");
    }
}
WT_G3x5_TSCNearestVORRowHTMLElement.NAME = "wt-tsc-nearestvor-row";

customElements.define(WT_G3x5_TSCNearestVORRowHTMLElement.NAME, WT_G3x5_TSCNearestVORRowHTMLElement);

// NEAREST NDB

/**
 * @extends WT_G3x5_TSCNearestNavAid<WT_NDB>
 */
class WT_G3x5_TSCNearestNDB extends WT_G3x5_TSCNearestNavAid {
    _getTitle() {
        return "Nearest NDB";
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCNearestNDBHTMLElement();
        htmlElement.setContext({
            parentPage: this,
            airplane: this.instrument.airplane,
            unitsModel: this._unitsModel,
            displayPaneICAOSetting: this._displayPaneICAOSetting
        });
        return htmlElement;
    }

    _getWaypointList() {
        return this.instrument.nearestNDBList;
    }

    _getInfoPage() {
        return this._mfdPanePages.ndbInfo;
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
     * @param {WT_VOR} waypoint
     * @returns {WT_G3x5_TSCLoadFrequency.RadioSlotType}
     */
    _getRadioSlotType(waypoint) {
        return WT_G3x5_TSCLoadFrequency.RadioSlotType.ADF;
    }
}

/**
 * @extends WT_G3x5_TSCNearestNavAidHTMLElement<WT_NDB>
 */
class WT_G3x5_TSCNearestNDBHTMLElement extends WT_G3x5_TSCNearestNavAidHTMLElement {
    _createWaypointRowRecycler() {
        return new WT_G3x5_TSCNearestWaypointRowRecycler(this._waypointsList, WT_G3x5_TSCNearestNDBRowHTMLElement, this._waypointRowListener);
    }

    _getCol1TitleText() {
        return "NDB";
    }

    _getOptionsInfoButtonLabelText() {
        return "NDB Info";
    }
}
WT_G3x5_TSCNearestNDBHTMLElement.NAME = "wt-tsc-nearestndb";

customElements.define(WT_G3x5_TSCNearestNDBHTMLElement.NAME, WT_G3x5_TSCNearestNDBHTMLElement);

/**
 * @extends WT_G3x5_TSCNearestNavAidRowHTMLElement<WT_NDB>
 */
class WT_G3x5_TSCNearestNDBRowHTMLElement extends WT_G3x5_TSCNearestNavAidRowHTMLElement {
    /**
     *
     * @param {WT_Frequency} frequency
     * @returns {String}
     */
    _getFrequencyText(frequency) {
        return frequency.hertz(WT_Frequency.Prefix.KHz).toFixed(1);
    }
}
WT_G3x5_TSCNearestNDBRowHTMLElement.NAME = "wt-tsc-nearestndb-row";

customElements.define(WT_G3x5_TSCNearestNDBRowHTMLElement.NAME, WT_G3x5_TSCNearestNDBRowHTMLElement);

// NEAREST INT

/**
 * @extends WT_G3x5_TSCNearestWaypoint<WT_Intersection>
 */
 class WT_G3x5_TSCNearestINT extends WT_G3x5_TSCNearestWaypoint {
    _getTitle() {
        return "Nearest Intersection";
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCNearestINTHTMLElement();
        htmlElement.setContext({
            parentPage: this,
            airplane: this.instrument.airplane,
            unitsModel: this._unitsModel,
            displayPaneICAOSetting: this._displayPaneICAOSetting
        });
        return htmlElement;
    }

    _getWaypointList() {
        return this.instrument.nearestINTList;
    }

    _getWaypointButtonEventType() {
        return WT_G3x5_TSCNearestINTHTMLElement.EventType.WAYPOINT_BUTTON_PRESSED;
    }

    _getDRCTButtonEventType() {
        return WT_G3x5_TSCNearestINTHTMLElement.EventType.DRCT_BUTTON_PRESSED;
    }

    _getInfoButtonEventType() {
        return WT_G3x5_TSCNearestINTHTMLElement.EventType.INFO_BUTTON_PRESSED;
    }

    _getChartsButtonEventType() {
        return undefined;
    }

    _getShowMapButtonEventType() {
        return WT_G3x5_TSCNearestINTHTMLElement.EventType.MAP_BUTTON_PRESSED;
    }

    _getInfoPage() {
        return this._mfdPanePages.intInfo;
    }
}

/**
 * @extends WT_G3x5_TSCNearestWaypointHTMLElement<WT_Intersection>
 */
 class WT_G3x5_TSCNearestINTHTMLElement extends WT_G3x5_TSCNearestWaypointHTMLElement {
    _createWaypointRowRecycler() {
        return new WT_G3x5_TSCNearestWaypointRowRecycler(this._waypointsList, WT_G3x5_TSCNearestINTRowHTMLElement, this._waypointRowListener);
    }

    _getCol1TitleText() {
        return "Intersection";
    }

    _getCol2TitleText() {
        return "BRG";
    }

    _getCol3TitleText() {
        return "DIS";
    }

    _getCol4TitleText() {
        return "";
    }

    _getOptionsInfoButtonLabelText() {
        return "Intersection Info";
    }

    _getOptionsChartsButtonLabelText() {
        return "";
    }

    _initOptions() {
        super._initOptions();

        this._chartsButton.style.display = "none";
    }

    _getWaypointButtonEventType() {
        return WT_G3x5_TSCNearestINTHTMLElement.EventType.WAYPOINT_BUTTON_PRESSED;
    }

    _getDRCTButtonEventType() {
        return WT_G3x5_TSCNearestINTHTMLElement.EventType.DRCT_BUTTON_PRESSED;
    }

    _getInfoButtonEventType() {
        return WT_G3x5_TSCNearestINTHTMLElement.EventType.INFO_BUTTON_PRESSED;
    }

    _getChartsButtonEventType() {
        return undefined;
    }

    _getShowMapButtonEventType() {
        return WT_G3x5_TSCNearestINTHTMLElement.EventType.MAP_BUTTON_PRESSED;
    }

    /**
     *
     * @param {WT_G3x5_TSCNearestINTRowHTMLElement} row
     */
    _onWaypointButtonPressed(row) {
        this._fireEvent(this._getWaypointButtonEventType(), row.waypoint);
    }

    _onWaypointRowEvent(row, eventType) {
        if (eventType === WT_G3x5_TSCNearestINTRowHTMLElement.EventType.WAYPOINT_BUTTON_PRESSED) {
            this._onWaypointButtonPressed(row);
        }
    }
}
/**
 * @enum {Number}
 */
 WT_G3x5_TSCNearestINTHTMLElement.EventType = {
    WAYPOINT_BUTTON_PRESSED: 0,
    DRCT_BUTTON_PRESSED: 1,
    INFO_BUTTON_PRESSED: 2,
    MAP_BUTTON_PRESSED: 3
};
WT_G3x5_TSCNearestINTHTMLElement.NAME = "wt-tsc-nearestint";

customElements.define(WT_G3x5_TSCNearestINTHTMLElement.NAME, WT_G3x5_TSCNearestINTHTMLElement);

/**
 * @extends WT_G3x5_TSCNearestWaypointRowHTMLElement<WT_Intersection>
 */
class WT_G3x5_TSCNearestINTRowHTMLElement extends WT_G3x5_TSCNearestWaypointRowHTMLElement {
    _getTemplate() {
        return WT_G3x5_TSCNearestINTRowHTMLElement.TEMPLATE;
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

    _getWaypointButtonEvent() {
        return WT_G3x5_TSCNearestINTRowHTMLElement.EventType.WAYPOINT_BUTTON_PRESSED;
    }
}
/**
 * @enum {Number}
 */
 WT_G3x5_TSCNearestINTRowHTMLElement.EventType = {
    WAYPOINT_BUTTON_PRESSED: 0
};
WT_G3x5_TSCNearestINTRowHTMLElement.NAME = "wt-tsc-nearestint-row";
WT_G3x5_TSCNearestINTRowHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCNearestINTRowHTMLElement.TEMPLATE.innerHTML = `
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
                font-size: var(--nearestwaypoint-row-waypointbutton-font-size, 0.75em);
                --waypoint-ident-color: white;
            }
            #bearing {
                position: relative;
                transform: rotateX(0deg);
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
                transform: rotateX(0deg);
            }
                #distancetext {
                    position: absolute;
                    left: 0%;
                    top: 50%;
                    width: 100%;
                    transform: translateY(-50%);
                    text-align: center;
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
    </div>
`;

customElements.define(WT_G3x5_TSCNearestINTRowHTMLElement.NAME, WT_G3x5_TSCNearestINTRowHTMLElement);