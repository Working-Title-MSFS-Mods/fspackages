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

        this._drctWaypoint = null;
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

    _initButtonListener() {
        this.htmlElement.addButtonListener(this._onButtonPressed.bind(this));
    }

    init(root) {
        this._fpm = this.instrument.flightPlanManagerWT;
        this._state._unitsModel = new WT_G3x5_TSCFlightPlanUnitsModel(this.instrument.unitsSettingModel);

        this.container.title = WT_G3x5_TSCFlightPlan.TITLE;
        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
        this._initHTMLElement();
        this._initButtonListener();
    }

    _setDisplayedFlightPlan(flightPlan) {
        this.htmlElement.setFlightPlan(flightPlan);
    }

    async _selectOrigin(icao) {
        if (icao === "") {
            return;
        }

        try {
            await this._fpm.setActiveOriginICAO(icao);
        } catch (e) {
            console.log(e);
        }
    }

    async _selectDestination(icao) {
        if (icao === "") {
            return;
        }

        try {
            await this._fpm.setActiveDestinationICAO(icao);
        } catch (e) {
            console.log(e);
        }
    }

    async _removeOrigin() {
        await this._fpm.removeActiveOrigin();
    }

    async _removeDestination() {
        await this._fpm.removeActiveDestination();
    }

    async _appendToEnroute(icao) {
        if (icao === "") {
            return;
        }

        try {
            await this._fpm.addWaypointICAOToActive(WT_FlightPlan.Segment.ENROUTE, icao);
        } catch (e) {
            console.log(e);
        }
    }

    async _removeLeg(leg) {
        try {
            await this._fpm.removeLegFromActive(leg);
        } catch (e) {
            console.log(e);
        }
    }

    async _activateLeg(leg) {
        try {
            await this._fpm.setActiveLeg(leg);
        } catch (e) {
            console.log(e);
        }
    }

    _openWaypointKeyboard(callback) {
        this.instrument.deactivateNavButton(5);
        this.instrument.deactivateNavButton(6);
        this.instrument.fullKeyboard.element.setContext(callback);
        this.instrument.switchToPopUpPage(this.instrument.fullKeyboard);
    }

    _openDRCTPage(waypoint) {
        this._drctWaypoint = waypoint;
        this.instrument.SwitchToPageName("MFD", "Direct To");
    }

    _openWaypointInfoPage(waypoint) {
        if (!waypoint || !(waypoint instanceof WT_ICAOWaypoint)) {
            return;
        }

        let infoPage;
        let pages = this.instrument.getSelectedMFDPanePages();
        switch (waypoint.type) {
            case WT_ICAOWaypoint.Type.AIRPORT:
                infoPage = pages.airportInfo;
                break;
            case WT_ICAOWaypoint.Type.VOR:
                infoPage = pages.vorInfo;
                break;
            case WT_ICAOWaypoint.Type.NDB:
                infoPage = pages.ndbInfo;
                break;
            case WT_ICAOWaypoint.Type.INT:
                infoPage = pages.intInfo;
                break;
        }
        if (infoPage) {
            infoPage.element.setWaypoint(waypoint);
            this.instrument.SwitchToPageName("MFD", infoPage.name);
        }
    }

    _onDRCTButtonPressed(event) {
        let selectedRow = this.htmlElement.getSelectedRow();
        let waypoint = null;
        if (selectedRow && selectedRow.getMode() === WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG) {
            waypoint = selectedRow.getActiveModeHTMLElement().leg.fix;
        }
        this._openDRCTPage(waypoint);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onOriginHeaderButtonPressed(event) {
        let flightPlan = this._fpm.activePlan;
        if (!flightPlan.hasOrigin()) {
            this._openWaypointKeyboard(this._selectOrigin.bind(this));
        } else {
            this.htmlElement.toggleRowSelection(event.row);
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onDestinationHeaderButtonPressed(event) {
        let flightPlan = this._fpm.activePlan;
        if (!flightPlan.hasDestination()) {
            this._openWaypointKeyboard(this._selectDestination.bind(this));
        } else {
            this.htmlElement.toggleRowSelection(event.row);
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onHeaderButtonPressed(event) {
        let flightPlan = this._fpm.activePlan;
        if (event.sequence === flightPlan.getOrigin() || event.sequence === flightPlan.getDeparture()) {
            this._onOriginHeaderButtonPressed(event);
        } else if (event.sequence === flightPlan.getDestination() || event.sequence === flightPlan.getArrival()) {
            this._onDestinationHeaderButtonPressed(event);
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onLegWaypointButtonPressed(event) {
        this.htmlElement.toggleRowSelection(event.row);
    }

    _onEnrouteAddButtonPressed(event) {
        this._openWaypointKeyboard(this._appendToEnroute.bind(this));
    }

    _onOriginSelectButtonPressed(event) {
        this._openWaypointKeyboard(this._selectOrigin.bind(this));
    }

    _onOriginRemoveButtonPressed(event) {
        this._removeOrigin();
    }

    _onOriginInfoButtonPressed(event) {
        let origin = this._fpm.activePlan.getOrigin().waypoint;
        this._openWaypointInfoPage(origin);
    }

    _onDestinationSelectButtonPressed(event) {
        this._openWaypointKeyboard(this._selectDestination.bind(this));
    }

    _onDestinationRemoveButtonPressed(event) {
        this._removeDestination();
    }

    _onDestinationInfoButtonPressed(event) {
        let destination = this._fpm.activePlan.getDestination().waypoint;
        this._openWaypointInfoPage(destination);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onWaypointDRCTButtonPressed(event) {
        this._openDRCTPage(event.leg.fix);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onActivateLegButtonPressed(event) {
        this._activateLeg(event.leg);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onWaypointRemoveButtonPressed(event) {
        this._removeLeg(event.leg);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onWaypointInfoButtonPressed(event) {
        this._openWaypointInfoPage(event.leg.fix);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onButtonPressed(event) {
        switch (event.type) {
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DRCT:
                this._onDRCTButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.HEADER:
                this._onHeaderButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LEG_WAYPOINT:
                this._onLegWaypointButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ENROUTE_ADD:
                this._onEnrouteAddButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_SELECT:
                this._onOriginSelectButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_REMOVE:
                this._onOriginRemoveButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_INFO:
                this._onOriginInfoButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_SELECT:
                this._onDestinationSelectButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_REMOVE:
                this._onDestinationRemoveButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_INFO:
                this._onDestinationInfoButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_DRCT:
                this._onWaypointDRCTButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ACTIVATE_LEG:
                this._onActivateLegButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_REMOVE:
                this._onWaypointRemoveButtonPressed(event);
                break;
            case WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_INFO:
                this._onWaypointInfoButtonPressed(event);
                break;
        }
    }

    _updateState() {
        this._state._airplaneHeadingTrue = this.instrument.airplane.navigation.headingTrue();
        this._state._activeLeg = this.instrument.flightPlanManagerWT.getActiveLeg(true);
    }

    onEnter() {
        super.onEnter();

        this.htmlElement.open();
    }

    onUpdate(deltaTime) {
        this._updateState();
        this.htmlElement.update(this._state);
    }

    _updateDirectTo() {
        // TODO: Implement a more sane way to push data to direct to page.
        this.instrument.lastRelevantICAO = (this._drctWaypoint && this._drctWaypoint instanceof WT_ICAOWaypoint) ? this._drctWaypoint.icao : null;
    }

    onExit() {
        super.onExit();

        this.htmlElement.close();
        this._updateDirectTo();
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
        this._rowButtonListener = this._onRowButtonPressed.bind(this);

        /**
         * @type {WT_FlightPlan}
         */
        this._flightPlan = null;
        /**
         * @type {WT_G3x5_TSCFlightPlanRowHTMLElement[]}
         */
        this._visibleRows = [];
        this._selectedRow = null;
        this._activeArrowShow = null;
        this._activeArrowFrom = 0;
        this._activeArrowTo = 0;
        this._isInit = false;

        /**
         * @type {((event:WT_G3x5_TSCFlightPlanButtonEvent) => void)[]}
         */
        this._buttonListeners = [];
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanHTMLElement.TEMPLATE;
    }

    async _defineOriginBannerButtons() {
        [
            this._originSelectButton,
            this._departureSelectButton,
            this._originRemoveButton,
            this._originInfoButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#originselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#departureselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#originremove`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#origininfo`, WT_TSCLabeledButton),
        ]);
    }

    async _defineDestinationBannerButtons() {
        [
            this._destinationSelectButton,
            this._arrivalSelectButton,
            this._approachSelectButton,
            this._destinationRemoveButton,
            this._destinationInfoButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#destinationselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#arrivalselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#approachselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#destinationremove`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#destinationinfo`, WT_TSCLabeledButton),
        ]);
    }

    async _defineWaypointBannerButtons() {
        [
            this._insertBeforeButton,
            this._insertAfterButton,
            this._waypointDRCTButton,
            this._activateLegButton,
            this._loadAirway,
            this._waypointRemoveButton,
            this._waypointInfoButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#insertbefore`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#insertafter`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#waypointdrct`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#activateleg`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#loadairway`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#waypointremove`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#waypointinfo`, WT_TSCLabeledButton),
        ]);
    }

    async _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));

        this._nameTitle = this.shadowRoot.querySelector(`#nametitle`);

        [
            this._drctButton,
            this._procButton,
            this._rows,
            this._banner
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#drct`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#proc`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#rows`, WT_TSCScrollList),
            WT_CustomElementSelector.select(this.shadowRoot, `#banner`, WT_TSCSlidingBanner),
            this._defineOriginBannerButtons(),
            this._defineDestinationBannerButtons(),
            this._defineWaypointBannerButtons()
        ]);

        this._rowsContainer = this.shadowRoot.querySelector(`#rowscontainer`);
        this._activeArrowStemRect = this.shadowRoot.querySelector(`#activearrowstem rect`);
        this._activeArrowHead = this.shadowRoot.querySelector(`#activearrowhead`);
    }

    _initLeftButtonListeners() {
        this._drctButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._drctButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DRCT
        }));
        this._procButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._procButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.PROC
        }));
    }

    _initOriginBannerButtonListeners() {
        this._originSelectButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._originSelectButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_SELECT
        }));
        this._originRemoveButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._originRemoveButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_REMOVE
        }));
        this._originInfoButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._originInfoButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_INFO
        }));
    }

    _initDestinationBannerButtonListeners() {
        this._destinationSelectButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._destinationSelectButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_SELECT
        }));
        this._destinationRemoveButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._destinationRemoveButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_REMOVE
        }));
        this._destinationInfoButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._destinationInfoButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_INFO
        }));
    }

    _initWaypointBannerButtonListeners() {
        this._waypointDRCTButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_DRCT));
        this._activateLegButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ACTIVATE_LEG));
        this._waypointRemoveButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_REMOVE));
        this._waypointInfoButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_INFO));
    }

    _initButtonListeners() {
        this._initLeftButtonListeners();
        this._initOriginBannerButtonListeners();
        this._initDestinationBannerButtonListeners();
        this._initWaypointBannerButtonListeners();
    }

    _initRowRecycler() {
        this._rowRecycler = new WT_CustomHTMLElementRecycler(this._rowsContainer, WT_G3x5_TSCFlightPlanRowHTMLElement);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initButtonListeners();
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
        this.unselectRow();
        this._rowRecycler.recycleAll();
        this._visibleRows.forEach(row => row.removeButtonListener(this._rowButtonListener));
        this._visibleRows = [];
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

    _initRow(row) {
        row.addButtonListener(this._rowButtonListener);
        this._visibleRows.push(row);
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

    /**
     *
     * @returns {WT_G3x5_TSCFlightPlanRowHTMLElement}
     */
    getSelectedRow() {
        return this._selectedRow;
    }

    _cleanUpSelectedRow() {
        let row = this.getSelectedRow();
        if (row) {
            row.onUnselected();
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement} row
     * @returns {WT_G3x5_TSCFlightPlanHTMLElement.BannerMode}
     */
    _getBannerModeFromRow(row) {
        switch (row.getMode()) {
            case WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER:
                let sequence = row.getActiveModeHTMLElement().sequence;
                if ((sequence === this._flightPlan.getOrigin() && this._flightPlan.hasOrigin()) || sequence === this._flightPlan.getDeparture()) {
                    return WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.ORIGIN;
                } else if ((sequence === this._flightPlan.getDestination() && this._flightPlan.hasDestination()) || sequence === this._flightPlan.getArrival()) {
                    return WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.DESTINATION;
                }
                break;
            case WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG:
                return WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.WAYPOINT;
        }
        return undefined;
    }

    _updateWaypointBanner() {
        let row = this.getSelectedRow();
        let leg = row.getActiveModeHTMLElement().leg;
        let isEditable = leg.segment === WT_FlightPlan.Segment.ENROUTE;
        let isRemovable = isEditable || leg.segment === WT_FlightPlan.Segment.ORIGIN || leg.segment === WT_FlightPlan.Segment.DESTINATION;

        this._insertBeforeButton.enabled = isEditable;
        this._insertAfterButton.enabled = isEditable;
        this._loadAirway.enabled = isEditable;
        this._waypointRemoveButton.enabled = isRemovable;
    }

    _updateBanner(mode) {
        if (mode === WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.WAYPOINT) {
            this._updateWaypointBanner();
        }
    }

    _initSelectedRow() {
        let row = this.getSelectedRow();
        let bannerMode;
        if (row) {
            row.onSelected();
            bannerMode = this._getBannerModeFromRow(row);
        }

        if (bannerMode !== undefined) {
            this.setBannerMode(bannerMode);
            this._updateBanner(bannerMode);
            this.showBanner();
        } else {
            this.hideBanner();
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement} row
     */
    selectRow(row) {
        if (this.getSelectedRow() === row) {
            return;
        }

        this._cleanUpSelectedRow();
        this._selectedRow = row;
        this._initSelectedRow();
    }

    unselectRow() {
        this.selectRow(null);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement} row
     */
    toggleRowSelection(row) {
        if (row === this.getSelectedRow()) {
            this.unselectRow();
        } else {
            this.selectRow(row);
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

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement.BannerMode} mode
     */
    setBannerMode(mode) {
        this._wrapper.setAttribute("banner-mode", WT_G3x5_TSCFlightPlanHTMLElement.BANNER_MODE_ATTRIBUTES[mode]);
    }

    showBanner() {
        this._banner.slideIn(WT_TSCSlidingBanner.Direction.RIGHT);
    }

    hideBanner() {
        this._banner.slideOut(WT_TSCSlidingBanner.Direction.RIGHT);
    }

    toggleBanner() {
        if (this._banner.isVisible) {
            this.showBanner();
        } else {
            this.hideBanner();
        }
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCFlightPlanButtonEvent) => void} listener
     */
    addButtonListener(listener) {
        this._buttonListeners.push(listener);
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCFlightPlanButtonEvent) => void} listener
     */
    removeButtonListener(listener) {
        let index = this._buttonListeners.indexOf(listener);
        if (index >= 0) {
            this._buttonListeners.splice(index, 1);
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

    _notifyButtonListeners(event) {
        this._buttonListeners.forEach(listener => listener(event));
    }

    _onRowButtonPressed(event) {
        this._notifyButtonListeners(event);
    }

    _onWaypointBannerButtonPressed(eventType, button) {
        let row = this.getSelectedRow();
        let leg = row.getMode() === WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG ? row.getActiveModeHTMLElement().leg : null;

        if (leg) {
            this._notifyButtonListeners({
                button: button,
                type: eventType,
                row: row,
                leg: leg
            });
        }
    }

    open() {
    }

    close() {
        this.unselectRow();
        if (this._isInit) {
            this._banner.popOut();
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
/**
 * @enum {Number}
 */
WT_G3x5_TSCFlightPlanHTMLElement.BannerMode = {
    ORIGIN: 0,
    DESTINATION: 1,
    WAYPOINT: 2
};
WT_G3x5_TSCFlightPlanHTMLElement.BANNER_MODE_ATTRIBUTES = [
    "origin",
    "destination",
    "waypoint"
];
/**
 * @enum {Number}
 */
WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType = {
    DRCT: 0,
    PROC: 1,
    STANDBY_FLIGHT_PLAN: 2,
    VNAV: 3,
    FLIGHT_PLAN_OPTIONS: 4,
    HEADER: 5,
    LEG_WAYPOINT: 6,
    LEG_ALTITUDE: 7,
    ENROUTE_ADD: 8,
    ENROUTE_DONE: 9,
    ORIGIN_SELECT: 10,
    DEPARTURE_SELECT: 11,
    ORIGIN_REMOVE: 12,
    ORIGIN_INFO: 13,
    DESTINATION_SELECT: 14,
    ARRIVAL_SELECT: 15,
    APPROACH_SELECT: 16,
    DESTINATION_REMOVE: 17,
    DESTINATION_INFO: 18,
    INSERT_BEFORE: 19,
    INSERT_AFTER: 20,
    WAYPOINT_DRCT: 21,
    ACTIVATE_LEG: 22,
    LOAD_AIRWAY: 23,
    WAYPOINT_REMOVE: 24,
    WAYPOINT_INFO: 25
};
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
                    #drct {
                        --button-img-image-height: 90%;
                    }
                    #stdbyfpln,
                    #fplnoptions {
                        font-size: 0.85em;
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
            #banner {
                position: absolute;
                right: -1vw;
                top: 50%;
                width: calc(var(--flightplan-banner-width, 40%) + 1vw + var(--flightplan-banner-margin-right, 0px));
                height: var(--flightplan-banner-height, 100%);
                transform: translateY(-50%);
                --slidingbanner-padding-right: calc(1vw + var(--flightplan-banner-margin-right, 0px));
            }
                #bannerpadding {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 5px;
                    border: 3px solid var(--wt-g3x5-bordergray);
                    background: black;
                }
                    .bannerContent {
                        display: none;
                        position: absolute;
                        left: var(--flightplan-banner-padding-left, 0.1em);
                        top: var(--flightplan-banner-padding-top, 0.1em);
                        width: calc(100% - var(--flightplan-banner-padding-left, 0.1em) - var(--flightplan-banner-padding-right, 0.1em));
                        height: calc(100% - var(--flightplan-banner-padding-top, 0.1em) - var(--flightplan-banner-padding-bottom, 0.1em));
                        font-size: var(--flightplan-banner-font-size, 0.85em);
                        grid-template-rows: repeat(5, 1fr);
                        grid-template-columns: 1fr 1fr;
                        grid-gap: var(--flightplan-banner-grid-gap, 0.1em);
                    }
                    #wrapper[banner-mode="origin"] #originbanner {
                        display: grid;
                    }
                    #wrapper[banner-mode="destination"] #destinationbanner {
                        display: grid;
                    }
                    #wrapper[banner-mode="waypoint"] #waypointbanner {
                        display: grid;
                    }
                        .bannerPosition11 {
                            grid-area: 1 / 1;
                        }
                        .bannerPosition12 {
                            grid-area: 1 / 2;
                        }
                        .bannerPosition21 {
                            grid-area: 2 / 1;
                        }
                        .bannerPosition22 {
                            grid-area: 2 / 2;
                        }
                        .bannerPosition31 {
                            grid-area: 3 / 1;
                        }
                        .bannerPosition32 {
                            grid-area: 3 / 2;
                        }
                        .bannerPosition41 {
                            grid-area: 4 / 1;
                        }
                        .bannerPosition42 {
                            grid-area: 4 / 2;
                        }
                        .bannerPosition51 {
                            grid-area: 5 / 1;
                        }
                        .bannerPosition52 {
                            grid-area: 5 / 2;
                        }
                        #waypointdrct {
                            --button-img-image-height: 90%;
                        }
    </style>
    <div id="wrapper">
        <div id="grid">
            <div id="left">
                <wt-tsc-button-img id="drct" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAP_DIRECT_TO_1.png"></wt-tsc-button-img>
                <wt-tsc-button-label id="proc" labeltext="PROC"></wt-tsc-button-label>
                <wt-tsc-button-label id="stdbyfpln" labeltext="Standby Flight Plan" enabled="false"></wt-tsc-button-label>
                <wt-tsc-button-label id="vnav" labeltext="VNAV" enabled="false"></wt-tsc-button-label>
                <wt-tsc-button-label id="fplnoptions" labeltext="Flight Plan Options" enabled="false"></wt-tsc-button-label>
            </div>
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
            <div id="bannerpadding" slot="content">
                <div id="originbanner" class="bannerContent">
                    <wt-tsc-button-label id="originselect" class="bannerPosition11" labeltext="Select Origin Airport"></wt-tsc-button-label>
                    <wt-tsc-button-label id="departurerwyselect" class="bannerPosition21" labeltext="Select Departure Runway" enabled="false"></wt-tsc-button-label>
                    <wt-tsc-button-label id="departureselect" class="bannerPosition31" labeltext="Select Departure"></wt-tsc-button-label>
                    <wt-tsc-button-label id="originremove" class="bannerPosition51" labeltext="Remove Origin Airport"></wt-tsc-button-label>
                    <wt-tsc-button-label id="origininfo" class="bannerPosition12" labeltext="Waypoint Info"></wt-tsc-button-label>
                    <wt-tsc-button-label id="takeoffdata" class="bannerPosition22" labeltext="Takeoff Data" enabled="false"></wt-tsc-button-label>
                </div>
                <div id="destinationbanner" class="bannerContent">
                    <wt-tsc-button-label id="destinationselect" class="bannerPosition11" labeltext="Select Destination Airport"></wt-tsc-button-label>
                    <wt-tsc-button-label id="arrivalrwyselect" class="bannerPosition21" labeltext="Select Arrival Runway" enabled="false"></wt-tsc-button-label>
                    <wt-tsc-button-label id="arrivalselect" class="bannerPosition31" labeltext="Select Arrival"></wt-tsc-button-label>
                    <wt-tsc-button-label id="approachselect" class="bannerPosition41" labeltext="Select Approach"></wt-tsc-button-label>
                    <wt-tsc-button-label id="destinationremove" class="bannerPosition51" labeltext="Remove Destination Airport"></wt-tsc-button-label>
                    <wt-tsc-button-label id="destinationinfo" class="bannerPosition12" labeltext="Waypoint Info"></wt-tsc-button-label>
                    <wt-tsc-button-label id="landingdata" class="bannerPosition22" labeltext="Landing Data" enabled="false"></wt-tsc-button-label>
                </div>
                <div id="waypointbanner" class="bannerContent">
                    <wt-tsc-button-label id="insertbefore" class="bannerPosition11" labeltext="Insert Before"></wt-tsc-button-label>
                    <wt-tsc-button-label id="insertafter" class="bannerPosition12" labeltext="Insert After"></wt-tsc-button-label>
                    <wt-tsc-button-img id="waypointdrct" class="bannerPosition21" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAP_DIRECT_TO_1.png"></wt-tsc-button-img>
                    <wt-tsc-button-label id="activateleg" class="bannerPosition22" labeltext="Activate Leg to Waypoint"></wt-tsc-button-label>
                    <wt-tsc-button-label id="loadairway" class="bannerPosition31" labeltext="Load Airway"></wt-tsc-button-label>
                    <wt-tsc-button-label id="alongtrack" class="bannerPosition32" labeltext="Along Track Waypoint" enabled="false"></wt-tsc-button-label>
                    <wt-tsc-button-label id="hold" class="bannerPosition41" labeltext="Hold at Waypoint" enabled="false"></wt-tsc-button-label>
                    <wt-tsc-button-label id="waypointinfo" class="bannerPosition42" labeltext="Waypoint Info"></wt-tsc-button-label>
                    <wt-tsc-button-label id="waypointremove" class="bannerPosition51" labeltext="Remove Waypoint"></wt-tsc-button-label>
                    <wt-tsc-button-statusbar id="flyover" class="bannerPosition52" labeltext="Fly Over Waypoint" enabled="false"></wt-tsc-button-statusbar>
                </div>
            </div>
        </wt-tsc-slidingbanner>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanHTMLElement.NAME, WT_G3x5_TSCFlightPlanHTMLElement);

/**
 * @typedef WT_G3x5_TSCFlightPlanButtonEvent
 * @property {WT_TSCButton} button
 * @property {WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType} type
 * @property {WT_G3x5_TSCFlightPlanRowHTMLElement} [row]
 * @property {WT_FlightPlanSequence} [sequence]
 * @property {WT_FlightPlanLeg} [leg]
 */

class WT_G3x5_TSCFlightPlanRowHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {((event:WT_G3x5_TSCFlightPlanButtonEvent) => void)[]}
         */
        this._buttonListeners = [];

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

    _appendChildren() {
        this._modeHTMLElements.forEach(element => {
            if (element) {
                this.shadowRoot.appendChild(element);
            }
        });
    }

    _initLegButtonListeners() {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG);
        mode.addWaypointButtonListener(this._onLegWaypointButtonPressed.bind(this));
        mode.addAltitudeButtonListener(this._onLegAltitudeButtonPressed.bind(this));
    }

    _initHeaderButtonListeners() {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER);
        mode.addButtonListener(this._onHeaderButtonPressed.bind(this));
    }

    _initEnrouteFooterButtonListeners() {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.ENROUTE_FOOTER);
        mode.addAddButtonListener(this._onEnrouteAddButtonPressed.bind(this));
        mode.addDoneButtonListener(this._onEnrouteDoneButtonPressed.bind(this));
    }

    async _initButtonListeners() {
        await Promise.all(this._modeHTMLElements.filter(element => element !== null).map(element => WT_Wait.awaitCallback(() => element.isInitialized)));
        this._initLegButtonListeners();
        this._initHeaderButtonListeners();
        this._initEnrouteFooterButtonListeners();
    }

    async _connectedCallbackHelper() {
        this._appendChildren();
        await this._initButtonListeners();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    /**
     *
     * @returns {WT_G3x5_TSCFlightPlanRowHTMLElement.Mode}
     */
    getMode() {
        return this._mode;
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

    /**
     *
     * @param {(event:WT_G3x5_TSCFlightPlanButtonEvent) => void} listener
     */
    addButtonListener(listener) {
        this._buttonListeners.push(listener);
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCFlightPlanButtonEvent) => void} listener
     */
    removeButtonListener(listener) {
        let index = this._buttonListeners.indexOf(listener);
        if (index >= 0) {
            this._buttonListeners.splice(index, 1);
        }
    }

    _notifyButtonListeners(event) {
        this._buttonListeners.forEach(listener => listener(event));
    }

    _onLegWaypointButtonPressed(button) {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG);
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LEG_WAYPOINT,
            row: this,
            leg: mode.leg
        }
        this._notifyButtonListeners(event);
    }

    _onLegAltitudeButtonPressed(button) {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG);
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LEG_ALTITUDE,
            row: this,
            leg: mode.leg
        }
        this._notifyButtonListeners(event);
    }

    _onHeaderButtonPressed(button) {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER);
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.HEADER,
            row: this,
            sequence: mode.sequence
        }
        this._notifyButtonListeners(event);
    }

    _onEnrouteAddButtonPressed(button) {
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ENROUTE_ADD,
            row: this
        }
        this._notifyButtonListeners(event);
    }

    _onEnrouteDoneButtonPressed(button) {
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ENROUTE_DONE,
            row: this
        }
        this._notifyButtonListeners(event);
    }

    onUnselected() {
        this._modeHTMLElements.forEach(element => {
            if (element) {
                element.onUnselected();
            }
        });
    }

    onSelected() {
        this._modeHTMLElements.forEach(element => {
            if (element) {
                element.onSelected();
            }
        });
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

        /**
         * @type {WT_FlightPlanLeg}
         */
        this._leg = null;
        this._bearingUnit = null;
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
        this._updateFromLeg();
        this._updateFromActive();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _clearWaypointButton() {
        this._waypointButton.setWaypoint(null);
    }

    _clearDTK() {
        this._dtkDisplay.textContent = "";
    }

    _clearDistance() {
        this._distanceDisplay.innerHTML = "";
    }

    _updateWaypointFromLeg() {
        this._waypointButton.setWaypoint(this._leg.fix);
    }

    _updateDTKFromLeg() {
        let dtk = this._leg.desiredTrack;
        this._dtkDisplay.textContent = `${dtk.isNaN() ? "___" : this._dtkFormatter.getFormattedNumber(dtk, this._bearingUnit)}${this._dtkFormatter.getFormattedUnit(dtk, this._bearingUnit)}`;
    }

    _updateDistanceFromLeg() {
        this._distanceDisplay.innerHTML = this._distanceFormatter.getFormattedHTML(this._leg.distance, this._distanceUnit);
    }

    _updateFromLeg() {
        if (this._leg) {
            this._updateWaypointFromLeg();
            this._updateDTKFromLeg();
            this._updateDistanceFromLeg();
        } else {
            this._clearWaypointButton();
            this._clearDTK();
            this._clearDistance();
        }
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

    addWaypointButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._waypointButton.addButtonListener(listener);
    }

    removeWaypointButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._waypointButton.removeButtonListener(listener);
    }

    addAltitudeButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._altitudeButton.addButtonListener(listener);
    }

    removeAltitudeButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._altitudeButton.removeButtonListener(listener);
    }

    onUnselected() {
        this._waypointButton.highlight = "false";
    }

    onSelected() {
        this._waypointButton.highlight = "true";
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
            this._updateDTKFromLeg();
        }
        if (!unitsModel.distanceUnit.equals(this._distanceUnit)) {
            this._distanceUnit = unitsModel.distanceUnit;
            this._updateDistanceFromLeg();
        }
    }

    /**
     *
     * @param {Number} airplaneHeadingTrue
     * @param {WT_G3x5_TSCFlightPlanUnitsModel} unitsModel
     */
    update(airplaneHeadingTrue, unitsModel) {
        if (!this._isInit || !this._leg) {
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

        this._sequence = null;
        this._titleText = "";
        this._subtitleText = "";
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.TEMPLATE;
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

    /**
     *
     * @param {WT_FlightPlanSequence} sequence
     */
    setSequence(sequence) {
        this._sequence = sequence;
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

    addButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._button.addButtonListener(listener);
    }

    removeButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._button.removeButtonListener(listener);
    }

    onUnselected() {
        this._button.highlight = "false";
    }

    onSelected() {
        this._button.highlight = "true";
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
                    #header[highlight=true][primed=false] #title,
                    #header[highlight=true][primed=false] #subtitle {
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

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInitialized() {
        return this._isInit;
    }

    async _defineChildren() {
        [
            this._addButton,
            this._doneButton
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

    addAddButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._addButton.addButtonListener(listener);
    }

    removeAddButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._addButton.removeButtonListener(listener);
    }

    addDoneButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._doneButton.addButtonListener(listener);
    }

    removeDoneButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._doneButton.removeButtonListener(listener);
    }

    onUnselected() {
    }

    onSelected() {
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
        this._headerModeHTMLElement.setSequence(this.element);
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
        let prefix = `${rwyTransition ? `RW${rwyTransition.runway.designationFull}` : "ALL"}.`;
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
        let suffix = `.${rwyTransition ? `RW${rwyTransition.runway.designationFull}` : "ALL"}`;
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
        this._modeHTMLElement.setLeg(this.element);

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