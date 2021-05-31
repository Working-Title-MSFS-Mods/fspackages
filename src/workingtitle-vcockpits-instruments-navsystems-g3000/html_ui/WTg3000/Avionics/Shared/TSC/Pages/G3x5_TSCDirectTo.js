class WT_G3x5_TSCDirectTo extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName) {
        super(homePageGroup, homePageName);

        /**
         * @type {WT_Waypoint}
         */
        this._presetWaypoint = null;
        this._presetVNAVAltitude = WT_Unit.FOOT.createNumber(NaN);
        this._presetVNAVOffset = WT_Unit.NMILE.createNumber(0);

        /**
         * @type {WT_Waypoint}
         */
        this._selectedWaypoint = null;
        this._selectedVNAVAltitude = WT_Unit.FOOT.createNumber(NaN);
        this._selectedVNAVOffset = WT_Unit.NMILE.createNumber(0);
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCDirectToHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _initPopUps() {
        this._directToCancelConfirmPopUp = new WT_G3x5_TSCElementContainer("Direct To Cancel Confirm", "DirectToCancelConfirm", new WT_G3x5_TSCDirectToCancelConfirmation());
        this._directToCancelConfirmPopUp.setGPS(this.instrument);
    }

    _getTitle() {
        return WT_G3x5_TSCDirectTo.TITLE;
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCDirectToHTMLElement();
        htmlElement.setParentPage(this);
        return htmlElement;
    }

    _initFromHTMLElement() {
        this.htmlElement.addListener(this._onHTMLElementEvent.bind(this));
    }

    init(root) {
        this._initPopUps();

        this.container.title = this._getTitle();

        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
        this._initFromHTMLElement();
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     * @param {WT_NumberUnitObject} [finalAltitude]
     * @param {WT_NumberUnitObject} [vnavOffset]
     */
    presetWaypoint(waypoint, finalAltitude, vnavOffset) {
        this._presetWaypoint = waypoint;
        this._presetVNAVAltitude.set(finalAltitude ? finalAltitude : NaN);
        this._presetVNAVOffset.set(vnavOffset ? vnavOffset : 0);
    }

    _updateFromSelectedWaypoint() {
        this.htmlElement.setWaypoint(this._selectedWaypoint);
    }

    _selectWaypoint(waypoint) {
        if ((!waypoint && !this._selectedWaypoint) || (waypoint && waypoint.equals(this._selectedWaypoint))) {
            return;
        }

        this._selectedWaypoint = waypoint;
        this._updateFromSelectedWaypoint();
    }

    _updateFromSelectedVNAVAltitude() {
        this.htmlElement.setVNAVAltitude(this._selectedVNAVAltitude);
    }

    _selectVNAVAltitude(altitude) {
        if (altitude.equals(this._selectedVNAVAltitude)) {
            return;
        }

        this._selectedVNAVAltitude.set(altitude);
        this._updateFromSelectedVNAVAltitude();
    }

    _updateFromSelectedVNAVOffset() {
        this.htmlElement.setVNAVOffset(this._selectedVNAVOffset);
    }

    _selectVNAVOffset(offset) {
        if (offset.equals(this._selectedVNAVOffset)) {
            return;
        }

        this._selectedVNAVOffset.set(offset);
        this._updateFromSelectedVNAVOffset();
    }

    _cancelDirectTo() {
        this.instrument.flightPlanManagerWT.deactivateDirectTo();
    }

    _openDirectToCancelConfirmPopUp() {
        this._directToCancelConfirmPopUp.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            callback: (confirmed => {
                if (confirmed) {
                    this._cancelDirectTo();
                }
            }).bind(this)
        });
        this.instrument.switchToPopUpPage(this._directToCancelConfirmPopUp);
    }

    _activateDirectTo() {
        if (!this._selectedWaypoint) {
            return;
        }

        this.instrument.flightPlanManagerWT.activateDirectTo(this._selectedWaypoint, this._selectedVNAVAltitude.isNaN() ? null : this._selectedVNAVAltitude, this._selectedVNAVOffset);
    }

    /**
     *
     * @param {WT_G3x5_TSCDirectToEvent} event
     */
    _onHTMLElementEvent(event) {
        switch (event.type) {
            case WT_G3x5_TSCDirectToHTMLElement.EventType.SELECT_WAYPOINT:
                this._selectWaypoint(event.waypoint);
                break;
            case WT_G3x5_TSCDirectToHTMLElement.EventType.SELECT_VNAV_ALTITUDE:
                this._selectVNAVAltitude(event.altitude);
                break;
            case WT_G3x5_TSCDirectToHTMLElement.EventType.SELECT_VNAV_OFFSET:
                this._selectVNAVOffset(event.offset);
                break;
            case WT_G3x5_TSCDirectToHTMLElement.EventType.CANCEL:
                this._openDirectToCancelConfirmPopUp();
                break;
            case WT_G3x5_TSCDirectToHTMLElement.EventType.ACTIVATE:
                this._activateDirectTo();
                break;
        }
    }

    onFocusGained() {
        super.onFocusGained();

        this.htmlElement.gainFocus();
    }

    onFocusLost() {
        super.onFocusLost();

        this.htmlElement.loseFocus();
    }

    _loadPresets() {
        if (this._presetWaypoint) {
            this._selectWaypoint(this._presetWaypoint);
            this._presetWaypoint = null;
        }
        if (!this._presetVNAVAltitude.isNaN()) {
            this._selectVNAVAltitude(this._presetVNAVAltitude);
            this._presetVNAVAltitude.set(NaN);
        }
        if (!this._presetVNAVOffset.isNaN()) {
            this._selectVNAVOffset(this._presetVNAVOffset);
            this._presetVNAVOffset.set(NaN);
        }
    }

    onEnter() {
        this._loadPresets();
        this.htmlElement.open();
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }

    onExit() {
        this.htmlElement.close();
    }
}
WT_G3x5_TSCDirectTo.TITLE = "Direct To";

class WT_G3x5_TSCDirectToHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_G3x5_TSCDirectTo}
         */
        this._parentPage = null;

        /**
         * @type {WT_Waypoint}
         */
        this._waypoint = null;
        this._vnavAltitude = WT_Unit.FOOT.createNumber(NaN);
        this._vnavOffset = WT_Unit.NMILE.createNumber(0);

        /**
         * @type {((event:WT_G3x5_TSCDirectToEvent) => void)[]}
         */
        this._listeners = [];

        this._initChildren();
    }

    _getTemplate() {
        return WT_G3x5_TSCDirectToHTMLElement.TEMPLATE;
    }

    _initChildren() {
        this._tabbedView = new WT_G3x5_TSCTabbedView();
        this._tabbedView.classList.add(WT_G3x5_TSCDirectToHTMLElement.TABBED_VIEW_CLASS);
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCDirectTo}
     */
    get parentPage() {
        return this._parentPage;
    }

    _appendChildren() {
        this._tabbedView.slot = "main";
        this.appendChild(this._tabbedView);
    }

    _initTabs() {
        this._waypointTab = new WT_G3x5_TSCDirectToWaypointTab(this);
        this._tabbedView.addTab(this._waypointTab);

        this._flightPlanTab = new WT_G3x5_TSCDirectToFlightPlanTab(this);
        this._tabbedView.addTab(this._flightPlanTab, WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);

        this._nearestTab = new WT_G3x5_TSCDirectToNearestTab(this);
        this._tabbedView.addTab(this._nearestTab, WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);

        this._recentTab = new WT_G3x5_TSCDirectToRecentTab(this);
        this._tabbedView.addTab(this._recentTab, WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);

        this._lastActiveTabIndex = 0;
    }

    _doInit() {
        this._initTabs();
        this._isInit = true;
        this._updateFromWaypoint();
        this._updateFromVNAVAltitude();
        this._updateFromVNAVOffset();
    }

    connectedCallback() {
        this._appendChildren();
        this._doInit();
    }

    setParentPage(parentPage) {
        if (!parentPage || this._parentPage) {
            return;
        }

        this._parentPage = parentPage;
    }

    _updateFromWaypoint() {
        this._waypointTab.setWaypoint(this._waypoint);
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
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

    _updateFromVNAVAltitude() {
        this._waypointTab.setVNAVAltitude(this._vnavAltitude);
    }

    /**
     *
     * @param {WT_NumberUnitObject} altitude
     */
    setVNAVAltitude(altitude) {
        if (altitude.equals(this._vnavAltitude)) {
            return;
        }

        this._vnavAltitude.set(altitude);
        if (this._isInit) {
            this._updateFromVNAVAltitude();
        }
    }

    _updateFromVNAVOffset() {
        this._waypointTab.setVNAVOffset(this._vnavOffset);
    }

    /**
     *
     * @param {WT_NumberUnitObject} offset
     */
    setVNAVOffset(offset) {
        if (offset.equals(this._vnavOffset)) {
            return;
        }

        this._vnavOffset.set(offset);
        if (this._isInit) {
            this._updateFromVNAVOffset();
        }
    }

    _notifyListeners(event) {
        this._listeners.forEach(listener => listener(event));
    }

    fireEvent(eventType, data) {
        let event = {
            source: this,
            type: eventType
        };
        if (data) {
            Object.assign(event, data);
        }
        this._notifyListeners(event);
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCDirectToEvent) => void} listener
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCDirectToEvent) => void} listener
     */
    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    gainFocus() {
        let activeTab = this._tabbedView.getActiveTab();
        if (activeTab) {
            activeTab.gainFocus();
        }
    }

    loseFocus() {
        let activeTab = this._tabbedView.getActiveTab();
        if (activeTab) {
            activeTab.loseFocus();
        }
    }

    open() {
        this._tabbedView.setActiveTabIndex(this._lastActiveTabIndex);
    }

    _doUpdate() {
        this._tabbedView.getActiveTab().update();
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._doUpdate();
    }

    close() {
        this._lastActiveTabIndex = this._tabbedView.getActiveTabIndex();
        this._tabbedView.setActiveTabIndex(-1);
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCDirectToHTMLElement.EventType = {
    SELECT_WAYPOINT: 0,
    SELECT_VNAV_ALTITUDE: 1,
    SELECT_VNAV_OFFSET: 2,
    CANCEL: 3,
    ACTIVATE: 4,
    ACTIVATE_AND_INSERT_IN_FPLN: 5
};
WT_G3x5_TSCDirectToHTMLElement.WAYPOINT_ICON_PATH = "/WTg3000/SDK/Assets/Images/Garmin/TSC/Waypoints";
WT_G3x5_TSCDirectToHTMLElement.TABBED_VIEW_CLASS = "directToTabbedView";
WT_G3x5_TSCDirectToHTMLElement.NAME = "wt-tsc-directto";
WT_G3x5_TSCDirectToHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCDirectToHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }
    </style>
    <div id="wrapper">
        <slot name="main" id="main"></slot>
    </div>
`;

customElements.define(WT_G3x5_TSCDirectToHTMLElement.NAME, WT_G3x5_TSCDirectToHTMLElement);

/**
 * @typedef WT_G3x5_TSCDirectToEvent
 * @property {WT_G3x5_TSCDirectToHTMLElement} source
 * @property {WT_G3x5_TSCDirectToHTMLElement.EventType} type
 * @property {WT_Waypoint} [waypoint]
 * @property {WT_NumberUnit} [altitude]
 * @property {WT_NumberUnit} [offset]
 */

class WT_G3x5_TSCDirectToTab extends WT_G3x5_TSCTabContent {
    /**
     * @param {WT_G3x5_TSCDirectToHTMLElement} parent
     * @param {String} title
     */
    constructor(parent, title) {
        super(title);

        this._parent = parent;
        this._htmlElement = this._createHTMLElement();
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCDirectToHTMLElement}
     */
    get parent() {
        return this._parent;
    }

    /**
     * @readonly
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    gainFocus() {
    }

    loseFocus() {
    }

    onActivated() {
        this.gainFocus();
    }

    onDeactivated() {
        this.loseFocus();
    }

    update() {
    }
}

class WT_G3x5_TSCDirectToScrollTab extends WT_G3x5_TSCDirectToTab {
    _activateNavButtons() {
        this.parent.parentPage.instrument.activateNavButton(5, "Up", this._onUpPressed.bind(this), false, "ICON_TSC_BUTTONBAR_UP.png");
        this.parent.parentPage.instrument.activateNavButton(6, "Down", this._onDownPressed.bind(this), false, "ICON_TSC_BUTTONBAR_DOWN.png");
    }

    _deactivateNavButtons() {
        this.parent.parentPage.instrument.deactivateNavButton(5, false);
        this.parent.parentPage.instrument.deactivateNavButton(6, false);
    }

    gainFocus() {
        this._activateNavButtons();
    }

    loseFocus() {
        this._deactivateNavButtons();
    }

    _onUpPressed() {
    }

    _onDownPressed() {
    }
}

class WT_G3x5_TSCDirectToWaypointTab extends WT_G3x5_TSCDirectToTab {
    /**
     * @param {WT_G3x5_TSCDirectToHTMLElement} parent
     */
    constructor(parent) {
        super(parent, WT_G3x5_TSCDirectToWaypointTab.TITLE);
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCDirectToWaypointTabHTMLElement();
        htmlElement.setParent(this.parent);
        return htmlElement;
    }

    setWaypoint(waypoint) {
        this.htmlElement.setWaypoint(waypoint);
    }

    setVNAVAltitude(altitude) {
        this.htmlElement.setVNAVAltitude(altitude);
    }

    setVNAVOffset(offset) {
        this.htmlElement.setVNAVOffset(offset);
    }

    update() {
        this.htmlElement.update();
    }
}
WT_G3x5_TSCDirectToWaypointTab.TITLE = "Waypoint";

class WT_G3x5_TSCDirectToWaypointTabHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_G3x5_TSCDirectToHTMLElement}
         */
        this._parent = null;

        /**
         * @type {WT_Waypoint}
         */
        this._waypoint = null;
        this._vnavAltitude = WT_Unit.FOOT.createNumber(NaN);
        this._vnavOffset = WT_Unit.NMILE.createNumber(0);

        this._altitudeUnit = null;
        this._distanceUnit = null;

        this._isInit = false;

        this._initFormatters();

        this._tempGARad = new WT_NumberUnit(0, WT_Unit.GA_RADIAN);
        this._tempAngle = new WT_NumberUnit(0, WT_Unit.DEGREE);
        this._tempTrueBearing = new WT_NavAngleUnit(false).createNumber(0);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    _getTemplate() {
        return WT_G3x5_TSCDirectToWaypointTabHTMLElement.TEMPLATE;
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
                _unitClassList: [WT_G3x5_TSCDirectToWaypointTabHTMLElement.UNIT_CLASS],

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
            pad: 3,
            unitSpaceBefore: false
        });
    }

    _initAltitudeFormatter() {
        this._altitudeFormatter = new WT_NumberFormatter({
            precision: 1,
            unitCaps: true
        });
    }

    _initVNAVOffsetFormatter() {
        this._vnavOffsetFormatter = new WT_NumberFormatter({
            precision: 1,
            unitCaps: true
        });
    }

    _initFormatters() {
        this._initDistanceFormatter();
        this._initBearingFormatter();
        this._initAltitudeFormatter();
        this._initVNAVOffsetFormatter();
    }

    async _defineChildren() {
        this._city = this.shadowRoot.querySelector(`#city`);
        this._region = this.shadowRoot.querySelector(`#region`);
        this._bearingText = new WT_CachedElement(this.shadowRoot.querySelector(`#bearingtext`));
        this._distanceValue = new WT_CachedElement(this.shadowRoot.querySelector(`#distancevalue`));

        [
            this._selectButton,
            this._bearingArrow,
            this._vnavAltitudeButton,
            this._vnavOffsetButton,
            this._courseButton,
            this._cancelButton,
            this._activateButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#selectbutton`, WT_G3x5_TSCWaypointButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#bearingarrow`, WT_TSCBearingArrow),
            WT_CustomElementSelector.select(this.shadowRoot, `#vnavaltitude`, WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#vnavoffset`, WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#course`, WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#cancel`, WT_TSCContentButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#activate`, WT_TSCContentButton),
        ]);
        this._selectButton.setIconSrcFactory(new WT_G3x5_TSCWaypointButtonIconSrcFactory(WT_G3x5_TSCDirectToHTMLElement.WAYPOINT_ICON_PATH));

        this._cancelButtonIdent = this.shadowRoot.querySelector(`#cancel .functionButtonIdent`);
        this._activateButtonIdent = this.shadowRoot.querySelector(`#activate .functionButtonIdent`);
    }

    _initButtonListeners() {
        this._selectButton.addButtonListener(this._onSelectButtonPressed.bind(this));
        this._vnavAltitudeButton.addButtonListener(this._onVNAVAltitudeButtonPressed.bind(this));
        this._vnavOffsetButton.addButtonListener(this._onVNAVOffsetButtonPressed.bind(this));
        this._cancelButton.addButtonListener(this._onCancelButtonPressed.bind(this));
        this._activateButton.addButtonListener(this._onActivateButtonPressed.bind(this));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initButtonListeners();
        this._isInit = true;
        this._updateFromParent();
        this._updateFromWaypoint();
        this._updateFromVNAVAltitude();
        this._updateFromVNAVOffset();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _initDirectToListener() {
        this._parent.parentPage.instrument.flightPlanManagerWT.directTo.addListener(this._onDirectToEvent.bind(this));
    }

    _updateFromParent() {
        this._initDirectToListener();
        this._updateFromDirectTo();
    }

    setParent(parent) {
        if (!parent || this._parent) {
            return;
        }

        this._parent = parent;
        if (this._isInit) {
            this._updateFromParent();
        }
    }

    _updateSelectButtonFromWaypoint() {
        this._selectButton.setWaypoint(this._waypoint);
    }

    _updateCityRegion() {
        if (this._waypoint) {
            this._city.textContent = this._waypoint.city ? this._waypoint.city.toString() : "";
            this._region.textContent = WT_G3x5_RegionNames.getName(this._waypoint.region);
        } else {
            this._city.textContent = "";
            this._region.textContent = "";
        }
    }

    _updateActivateButton() {
        if (this._waypoint) {
            this._activateButton.enabled = "true";
            this._activateButtonIdent.textContent = this._waypoint.ident;
        } else {
            this._activateButton.enabled = "false";
            this._activateButtonIdent.textContent = "______";
        }
    }

    _updateFromWaypoint() {
        this._updateSelectButtonFromWaypoint();
        this._updateCityRegion();
        this._updateActivateButton();
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
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

    _updateFromVNAVAltitude() {
        let numberText = this._vnavAltitude.isNaN() ? "_____" : this._altitudeFormatter.getFormattedNumber(this._vnavAltitude, this._altitudeUnit);
        let unitText = this._altitudeFormatter.getFormattedUnit(this._vnavAltitude, this._altitudeUnit);
        this._vnavAltitudeButton.valueText = `${numberText}<span style="font-size: var(--directto-unit-font-size, 0.75em);">${unitText}</span>`;
    }

    /**
     *
     * @param {WT_NumberUnitObject} altitude
     */
    setVNAVAltitude(altitude) {
        if (altitude.equals(this._vnavAltitude)) {
            return;
        }

        this._vnavAltitude.set(altitude);
        if (this._isInit) {
            this._updateFromVNAVAltitude();
        }
    }

    _updateFromVNAVOffset() {
        let numberText = this._vnavOffsetFormatter.getFormattedNumber(this._vnavOffset, this._distanceUnit);
        let unitText = this._vnavOffsetFormatter.getFormattedUnit(this._vnavOffset, this._distanceUnit);
        this._vnavOffsetButton.valueText = `${numberText}<span style="font-size: var(--directto-unit-font-size, 0.75em);">${unitText}</span>`;
    }

    /**
     *
     * @param {WT_NumberUnitObject} offset
     */
    setVNAVOffset(offset) {
        if (offset.equals(this._vnavOffset)) {
            return;
        }

        this._vnavOffset.set(offset);
        if (this._isInit) {
            this._updateFromVNAVOffset();
        }
    }

    _updateCancelButton() {
        let directTo = this._parent.parentPage.instrument.flightPlanManagerWT.directTo;
        if (directTo.isActive()) {
            this._cancelButton.enabled = "true";
            this._cancelButtonIdent.textContent = directTo.getDestination().ident;
            this._cancelButtonIdent.style.color = "var(--wt-g3x5-purple)";
        } else {
            this._cancelButton.enabled = "false";
            this._cancelButtonIdent.textContent = "______";
            this._cancelButtonIdent.style.color = "white";
        }
    }

    _updateFromDirectTo() {
        this._updateCancelButton();
    }

    /**
     *
     * @param {WT_DirectToEvent} event
     */
    _onDirectToEvent(event) {
        this._updateFromDirectTo();
    }

    _onWaypointSelected(waypoint) {
        this._parent.fireEvent(WT_G3x5_TSCDirectToHTMLElement.EventType.SELECT_WAYPOINT, {waypoint});
    }

    _openWaypointKeyboard() {
        this._parent.parentPage.instrument.waypointKeyboard.element.setContext({
            homePageGroup: this._parent.parentPage.homePageGroup,
            homePageName: this._parent.parentPage.homePageName,
            searchTypes: null,
            callback: this._onWaypointSelected.bind(this)
        });
        this._parent.parentPage.instrument.switchToPopUpPage(this._parent.parentPage.instrument.waypointKeyboard);
    }

    _onSelectButtonPressed(button) {
        this._openWaypointKeyboard();
    }

    _onVNAVAltitudeSelected(altitude) {
        this._parent.fireEvent(WT_G3x5_TSCDirectToHTMLElement.EventType.SELECT_VNAV_ALTITUDE, {altitude: altitude.copy().readonly()});
    }

    _onVNAVAltitudeRemoved() {
        this._parent.fireEvent(WT_G3x5_TSCDirectToHTMLElement.EventType.SELECT_VNAV_ALTITUDE, {altitude: WT_Unit.FOOT.createNumber(NaN).readonly()});
    }

    _openVNAVAltitudeKeyboard() {
        let initialValue = this._vnavAltitude.isNaN() ? WT_Unit.FOOT.createNumber(0) : this._vnavAltitude;

        this._parent.parentPage.instrument.vnavAltitudeKeyboard.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            showDirectTo: false,
            unit: this._parent.parentPage.instrument.unitsSettingModel.altitudeSetting.getAltitudeUnit(),
            initialValue: initialValue,
            valueEnteredCallback: this._onVNAVAltitudeSelected.bind(this),
            removeCallback: this._onVNAVAltitudeRemoved.bind(this)
        });
        this._parent.parentPage.instrument.switchToPopUpPage(this._parent.parentPage.instrument.vnavAltitudeKeyboard);
    }

    _onVNAVAltitudeButtonPressed(button) {
        this._openVNAVAltitudeKeyboard();
    }

    _onVNAVOffsetSelected(offset) {
        this._parent.fireEvent(WT_G3x5_TSCDirectToHTMLElement.EventType.SELECT_VNAV_OFFSET, {offset: offset.copy().readonly()});
    }

    _openVNAVOffsetKeyboard() {
        this._parent.parentPage.instrument.numKeyboard.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            digitCount: 3,
            decimalPlaces: 0,
            positiveOnly: false,
            unit: this._parent.parentPage.instrument.unitsSettingModel.distanceSpeedSetting.getDistanceUnit(),
            initialValue: this._vnavOffset,
            valueEnteredCallback: this._onVNAVOffsetSelected.bind(this)
        });
        this._parent.parentPage.instrument.switchToPopUpPage(this._parent.parentPage.instrument.numKeyboard);
    }

    _onVNAVOffsetButtonPressed(button) {
        this._openVNAVOffsetKeyboard();
    }

    _onCancelButtonPressed(button) {
        this._parent.fireEvent(WT_G3x5_TSCDirectToHTMLElement.EventType.CANCEL);
    }

    _onActivateButtonPressed(button) {
        this._parent.fireEvent(WT_G3x5_TSCDirectToHTMLElement.EventType.ACTIVATE);
    }

    _updateSelectButton() {
        this._selectButton.update(this._parent.parentPage.instrument.airplane.navigation.headingTrue());
    }

    _updateBearingDistance() {
        let unitsSettingModel = this._parent.parentPage.instrument.unitsSettingModel;
        if (this._waypoint) {
            let airplane = this._parent.parentPage.instrument.airplane;
            let ppos = airplane.navigation.position(this._tempGeoPoint);
            let heading = airplane.navigation.headingTrue();
            let bearing = this._tempTrueBearing.set(ppos.bearingTo(this._waypoint.location));
            bearing.unit.setLocation(ppos);

            let bearingText = this._bearingFormatter.getFormattedString(bearing, unitsSettingModel.navAngleSetting.getNavAngleUnit());
            this._bearingText.textContent = bearingText;
            this._bearingArrow.setBearing(bearing.number - heading);

            this._courseButton.valueText = bearingText;

            let distance = this._tempGARad.set(ppos.distance(this._waypoint.location));
            this._distanceValue.innerHTML = this._distanceFormatter.getFormattedHTML(distance, unitsSettingModel.distanceSpeedSetting.getDistanceUnit());

            if (this._bearingArrow.style.display !== "block") {
                this._bearingArrow.style.display = "block";
            }
        } else {
            if (this._bearingArrow.style.display !== "none") {
                this._bearingArrow.style.display = "none";
            }
            this._bearingText.textContent = "";
            this._courseButton.valueText = `___${this._bearingFormatter.getFormattedUnit(this._tempTrueBearing, unitsSettingModel.navAngleSetting.getNavAngleUnit())}`;
            this._distanceValue.innerHTML = "";
        }
    }

    _updateUnits() {
        let unitsSettingModel = this._parent.parentPage.instrument.unitsSettingModel;

        let altitudeUnit = unitsSettingModel.altitudeSetting.getAltitudeUnit();
        if (!altitudeUnit.equals(this._altitudeUnit)) {
            this._altitudeUnit = altitudeUnit;
            this._updateFromVNAVAltitude();
        }

        let distanceUnit = unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
        if (!distanceUnit.equals(this._distanceUnit)) {
            this._distanceUnit = distanceUnit;
            this._updateFromVNAVOffset();
        }
    }

    _doUpdate() {
        this._updateSelectButton();
        this._updateBearingDistance();
        this._updateUnits();
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._doUpdate();
    }
}
WT_G3x5_TSCDirectToWaypointTabHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_TSCDirectToWaypointTabHTMLElement.NAME = "wt-tsc-directto-waypoint";
WT_G3x5_TSCDirectToWaypointTabHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCDirectToWaypointTabHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
            background-color: black;
        }

        #wrapper {
            position: absolute;
            left: var(--directto-waypoint-padding-left, 0.2em);
            top: var(--directto-waypoint-padding-top, 0.2em);
            width: calc(100% - var(--directto-waypoint-padding-left, 0.2em) - var(--directto-waypoint-padding-right, 0.2em));
            height: calc(100% - var(--directto-waypoint-padding-top, 0.2em) - var(--directto-waypoint-padding-bottom, 0.2em));
            display: grid;
            grid-template-rows: var(--directto-waypoint-grid-rows, 1fr 0.67fr 2fr 4px 1fr);
            grid-template-columns: 100%;
            grid-gap: var(--directto-waypoint-grid-row-gap, 0.1em) 0;
        }
            #selectbutton {
                position: relative;
                justify-self: center;
                width: 80%;
                --button-waypoint-emptytext-font-size: 1.25em;
            }
            #info {
                position: relative;
                border: solid 1px white;
                color: white;
            }
                #infogrid {
                    position: absolute;
                    left: var(--directto-waypoint-info-padding-left, 0.2em);
                    top: var(--directto-waypoint-info-padding-top, 0.1em);
                    width: calc(100% - var(--directto-waypoint-info-padding-left, 0.2em) - var(--directto-waypoint-info-padding-right, 0.2em));
                    height: calc(100% - var(--directto-waypoint-info-padding-top, 0.1em) - var(--directto-waypoint-info-padding-bottom, 0.1em));
                    display: grid;
                    grid-template-rows: 1fr 1fr;
                    grid-template-columns: 2fr 1fr 1fr;
                    grid-gap: 0.1em;
                    align-items: center;
                }
                #city,
                #region {
                    text-align: left;
                }
                #bearingtitle,
                #distancetitle {
                    text-align: center;
                }
                #bearingvalue {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-flow: row nowrap;
                    justify-content: center;
                    align-items: center;
                    transform: rotateX(0deg);
                }
                    #bearingtext {
                        margin-right: 0.1em;
                    }
                    #bearingarrow {
                        width: 1.2em;
                        height: 1.2em;
                    }
                #distancevalue {
                    text-align: right;
                    transform: rotateX(0deg);
                }
            #options {
                justify-self: center;
                position: relative;
                width: 90%;
                height: 100%;
                display: grid;
                grid-template-rows: 1fr 1fr;
                grid-template-columns: 1fr 1fr;
                grid-gap: 0.5em;
                --button-value-font-size: var(--directto-waypoint-options-button-value-font-size, 1.25em);
            }
            #divider {
                align-self: center;
                height: 0px;
                border-top: ridge 2px white;
            }
            #functions {
                position: relative;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-rows: 100%;
                grid-template-columns: repeat(3, 1fr);
                grid-gap: 0 1px;
            }
                .functionButtonTitle {
                    position: absolute;
                    left: 0%;
                    top: 0%;
                    width: 100%;
                    height: 50%;
                    display: flex;
                    flex-flow: row nowrap;
                    justify-content: center;
                    align-items: center;
                }
                    .drctSymbol {
                        width: calc(1.43 * 0.8em);
                        height: 0.8em;
                    }
                        .drctArrow {
                            fill: white;
                        }
                        .drctLetterD {
                            fill: transparent;
                            stroke-width: 10;
                            stroke: white;
                        }
                .functionButtonIdent {
                    position: absolute;
                    left: 50%;
                    top: 75%;
                    transform: translate(-50%, -50%);
                    font-size: var(--directto-waypoint-ident-font-size, 1.25em);
                }

        .${WT_G3x5_TSCDirectToWaypointTabHTMLElement.UNIT_CLASS} {
            font-size: var(--directto-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <wt-tsc-button-waypoint id="selectbutton" emptytext="Select Waypoint"></wt-tsc-button-waypoint>
        <div id="info">
            <div id="infogrid">
                <div id="city"></div>
                <div id="bearingtitle">BRG</div>
                <div id="distancetitle">DIS</div>
                <div id="region"></div>
                <div id="bearingvalue">
                    <div id="bearingtext"></div>
                    <wt-tsc-bearingarrow id="bearingarrow"></wt-tsc-bearingarrow>
                </div>
                <div id="distancevalue"></div>
            </div>
        </div>
        <div id="options">
            <wt-tsc-button-value id="vnavaltitude" labeltext="VNAV Altitude"></wt-tsc-button-value>
            <wt-tsc-button-value id="vnavoffset" labeltext="VNAV Offset"></wt-tsc-button-value>
            <wt-tsc-button-value id="course" labeltext="Course" enabled="false"></wt-tsc-button-value>
            <wt-tsc-button-value id="hold" labeltext="Hold" valuetext="–––" enabled="false"></wt-tsc-button-value>
        </div>
        <div id="divider"></div>
        <div id="functions">
            <wt-tsc-button-content id="cancel">
                <div class="functionButtonTitle" slot="content">
                    <div>Cancel&nbsp</div>
                    <svg class="drctSymbol" viewBox="0 -35 100 70">
                        <path class="drctArrow" d="M 5 -2.5 L 75 -2.5 L 75 -20 L 95 0 L 75 20 L 75 2.5 L 5 2.5 Z" />
                        <path class="drctLetterD" d="M 20 -30 L 30 -30 C 70 -30 70 30 30 30 L 20 30 Z" />
                    </svg>
                </div>
                <div class="functionButtonIdent" slot="content">
                </div>
            </wt-tsc-button-content>
            <wt-tsc-button-label id="activateinsertfpln" labeltext="Activate and<br>Insert in<br>Flight Plan" enabled="false"></wt-tsc-button-label>
            <wt-tsc-button-content id="activate">
                <div class="functionButtonTitle" slot="content">
                    <div>Activate&nbsp</div>
                    <svg class="drctSymbol" viewBox="0 -35 100 70">
                        <path class="drctArrow" d="M 5 -2.5 L 75 -2.5 L 75 -20 L 95 0 L 75 20 L 75 2.5 L 5 2.5 Z" />
                        <path class="drctLetterD" d="M 20 -30 L 30 -30 C 70 -30 70 30 30 30 L 20 30 Z" />
                    </svg>
                </div>
                <div class="functionButtonIdent" slot="content">
                </div>
            </wt-tsc-button-content>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCDirectToWaypointTabHTMLElement.NAME, WT_G3x5_TSCDirectToWaypointTabHTMLElement);

class WT_G3x5_TSCDirectToFlightPlanTab extends WT_G3x5_TSCDirectToScrollTab {
    /**
     * @param {WT_G3x5_TSCDirectToHTMLElement} parent
     */
    constructor(parent) {
        super(parent, WT_G3x5_TSCDirectToFlightPlanTab.TITLE);
    }

    _createHTMLElement() {
        return document.createElement("div");
    }
}
WT_G3x5_TSCDirectToFlightPlanTab.TITLE = "Flight<br>Plan";

class WT_G3x5_TSCDirectToNearestTab extends WT_G3x5_TSCDirectToScrollTab {
    /**
     * @param {WT_G3x5_TSCDirectToHTMLElement} parent
     */
    constructor(parent) {
        super(parent, WT_G3x5_TSCDirectToNearestTab.TITLE);
    }

    _createHTMLElement() {
        return document.createElement("div");
    }
}
WT_G3x5_TSCDirectToNearestTab.TITLE = "Nearest";

class WT_G3x5_TSCDirectToRecentTab extends WT_G3x5_TSCDirectToScrollTab {
    /**
     * @param {WT_G3x5_TSCDirectToHTMLElement} parent
     */
    constructor(parent) {
        super(parent, WT_G3x5_TSCDirectToRecentTab.TITLE);
    }

    _createHTMLElement() {
        return document.createElement("div");
    }
}
WT_G3x5_TSCDirectToRecentTab.TITLE = "Recent";

class WT_G3x5_TSCDirectToCancelConfirmation extends WT_G3x5_TSCConfirmationPopUp {
    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCDirectToCancelConfirmationHTMLElement();
        htmlElement.setDirectTo(this.instrument.flightPlanManagerWT.directTo);
        return htmlElement;
    }
}

class WT_G3x5_TSCDirectToCancelConfirmationHTMLElement extends WT_G3x5_TSCConfirmationPopUpHTMLElement {
    constructor() {
        super();

        /**
         * @type {WT_DirectTo}
         */
        this._directTo = null;
    }

    _getTemplate() {
        return WT_G3x5_TSCDirectToCancelConfirmationHTMLElement.TEMPLATE;
    }

    _getOKButtonQuery() {
        return "#ok";
    }

    _getCancelButtonQuery() {
        return "#cancel";
    }

    async _defineChildren() {
        await super._defineChildren();

        this._identText = this.shadowRoot.querySelector(`#ident`);
    }

    _onInit() {
        this._initFromDirectTo();
    }

    _initFromDirectTo() {
        this._directTo.addListener(this._onDirectToEvent.bind(this));
        this._updateFromDirectTo();
    }

    setDirectTo(directTo) {
        if (!directTo || this._directTo) {
            return;
        }

        this._directTo = directTo;
        if (this._isInit) {
            this._initFromDirectTo();
        }
    }

    _updateFromDirectTo() {
        if (this._directTo.isActive()) {
            this._okButton.enabled = "true";
            this._identText.innerHTML = `&nbsp${this._directTo.getDestination().ident}`;
            this._identText.style.color = "var(--wt-g3x5-purple)";
        } else {
            this._okButton.enabled = "false";
            this._identText.innerHTML = "&nbsp______";
            this._identText.style.color = "white";
        }
    }

    /**
     *
     * @param {WT_DirectToEvent} event
     */
    _onDirectToEvent(event) {
        this._updateFromDirectTo();
    }
}
WT_G3x5_TSCDirectToCancelConfirmationHTMLElement.NAME = "wt-tsc-directtocancelconfirm";
WT_G3x5_TSCDirectToCancelConfirmationHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCDirectToCancelConfirmationHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            border-radius: 5px;
            background: linear-gradient(#1f3445, black 25px);
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: absolute;
            left: var(--directtocancelconfirm-padding-left, 1em);
            top: var(--directtocancelconfirm-padding-top, 1em);
            width: calc(100% - var(--directtocancelconfirm-padding-left, 1em) - var(--directtocancelconfirm-padding-right, 1em));
            height: calc(100% - var(--directtocancelconfirm-padding-top, 1em) - var(--directtocancelconfirm-padding-bottom, 1em));
        }
            #info {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                display: flex;
                flex-flow: row nowrap;
                justify-content: center;
                align-items: center;
            }
                #drctSymbol {
                    width: calc(1.43 * 0.8em);
                    height: 0.8em;
                }
                    #drctArrow {
                        fill: white;
                    }
                    #drctLetterD {
                        fill: transparent;
                        stroke-width: 10;
                        stroke: white;
                    }
            #buttons {
                position: absolute;
                left: 0%;
                bottom: 0%;
                width: 100%;
                height: 60%;
                display: flex;
                flex-flow: row nowrap;
                justify-content: space-between;
                align-items: center;
            }
                .button {
                    width: var(--directtocancelconfirm-button-width, 40%);
                    height: var(--directtocancelconfirm-button-height, 3em);
                    font-size: var(--directtocancelconfirm-button-font-size, 0.85em);
                }
    </style>
    <div id="wrapper">
        <div id="info">
            <div>Cancel&nbsp</div>
            <svg id="drctSymbol" viewBox="0 -35 100 70">
                <path id="drctArrow" d="M 5 -2.5 L 75 -2.5 L 75 -20 L 95 0 L 75 20 L 75 2.5 L 5 2.5 Z" />
                <path id="drctLetterD" d="M 20 -30 L 30 -30 C 70 -30 70 30 30 30 L 20 30 Z" />
            </svg>
            <div id="ident"></div>
            <div>?</div>
        </div>
        <div id="buttons">
            <wt-tsc-button-label id="ok" class="button" labeltext="OK"></wt-tsc-button-label>
            <wt-tsc-button-label id="cancel" class="button" labeltext="Cancel"></wt-tsc-button-label>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCDirectToCancelConfirmationHTMLElement.NAME, WT_G3x5_TSCDirectToCancelConfirmationHTMLElement);