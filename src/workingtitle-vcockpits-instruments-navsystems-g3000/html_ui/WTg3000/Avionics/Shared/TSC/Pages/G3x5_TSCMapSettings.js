class WT_G3x5_TSCMapSettings extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName, instrumentID) {
        super(homePageGroup, homePageName);

        this._instrumentID = instrumentID;

        this._allControllerIDs = ["PFD", "MFD-LEFT", "MFD-RIGHT"];
    }

    /**
     * @readonly
     * @property {String} instrumentID
     * @type {String}
     */
    get instrumentID() {
        return this._instrumentID;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCMapSettingsHTMLElement} htmlElement
     * @type {WT_G3x5_TSCMapSettingsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @property {String[]} allControllerIDs
     * @type {String[]}
     */
    get allControllerIDs() {
        return this._allControllerIDs;
    }

    getControllerID() {
        return this.instrumentID;
    }

    _initHTMLElement() {
        this._htmlElement = new WT_G3x5_TSCMapSettingsHTMLElement();
        this._htmlElement.setParentPage(this);
    }

    init(root) {
        this._initHTMLElement();
        root.appendChild(this.htmlElement);
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }
}

class WT_G3x5_TSCPFDMapSettings extends WT_G3x5_TSCMapSettings {
    constructor(homePageGroup, homePageName, instrumentID) {
        super(homePageGroup, homePageName, instrumentID);

        this._initInsetMapController();
    }

    _initInsetMapController() {
        this._controller = new WT_DataStoreController(this.instrumentID, null);
        this._controller.addSetting(this._insetMapShowSetting = new WT_G3x5_PFDInsetMapShowSetting(this._controller));
    }

    /**
     * @readonly
     * @property {WT_G3x5_PFDInsetMapShowSetting} showSetting
     * @type {WT_G3x5_PFDInsetMapShowSetting}
     */
    get insetMapShowSetting() {
        return this._insetMapShowSetting;
    }

    _initHTMLElement() {
        this._htmlElement = new WT_G3x5_TSCPFDMapSettingsHTMLElement();
        this._htmlElement.setParentPage(this);
    }
}

class WT_G3x5_TSCMFDMapSettings extends WT_G3x5_TSCMapSettings {
    getControllerID() {
        return `${this.instrumentID}-${this.gps.getSelectedMFDPane()}`;
    }

    _initHTMLElement() {
        this._htmlElement = new WT_G3x5_TSCMFDMapSettingsHTMLElement();
        this._htmlElement.setParentPage(this);
    }
}

class WT_G3x5_TSCMapSettingsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCMapSettingsHTMLElement.TEMPLATE.content.cloneNode(true));
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCMapSettings} settingsPage
     * @type {WT_G3x5_TSCMapSettings}
     */
    get parentPage() {
        return this._parentPage;
    }

    setParentPage(page) {
        this._parentPage = page;
    }

    _createWindowContext(titleText, values, callback, key) {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(values);
        return {
            title: titleText,
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            callback: callback,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            currentIndexGetter: new WT_G3x5_TSCMapSettingIndexGetter(this.parentPage.getControllerID.bind(this.parentPage), key),
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName
        };
    }

    _initOrientationButton() {
        this._orientationWindowContext = this._createWindowContext("Map Orientation", WT_G3x5_TSCMapSettingsHTMLElement.ORIENTATION_TEXTS, this._onOrientationSelected.bind(this), WT_G3x5_NavMap.ORIENTATION_KEY);

        this._orientationButton = new WT_TSCValueButton();
        this._orientationButton.classList.add(WT_G3x5_TSCMapSettingsHTMLElement.LEFT_BUTTON_CLASS);
        this._orientationButton.labelText = "Orientation";
        this._orientationButton.addButtonListener(this._onOrientationButtonPressed.bind(this));

        this._orientationButton.slot = "left";
        this.appendChild(this._orientationButton);
    }

    _initSyncButton() {
        this._syncWindowContext = this._createWindowContext("Map Sync", WT_G3x5_TSCMapSettingsHTMLElement.SYNC_TEXTS, this._onSyncSelected.bind(this), WT_MapController.SYNC_MODE_KEY);

        this._syncButton = new WT_TSCValueButton();
        this._syncButton.classList.add(WT_G3x5_TSCMapSettingsHTMLElement.LEFT_BUTTON_CLASS);
        this._syncButton.labelText = "Map Sync";
        this._syncButton.addButtonListener(this._onSyncButtonPressed.bind(this));

        this._syncButton.slot = "left";
        this.appendChild(this._syncButton);
    }

    _initDetailButton() {
        this._detailButton = new WT_G3x5_TSCMapDetailButton();
        this._detailButton.classList.add(WT_G3x5_TSCMapSettingsHTMLElement.LEFT_BUTTON_CLASS);
        this._detailButton.labelText = "Map Detail";
        this._detailButton.addButtonListener(this._onDetailButtonPressed.bind(this));

        this._detailButton.slot = "left";
        this.appendChild(this._detailButton);
    }

    _initLeftButtons() {
        this._initOrientationButton();
        this._initSyncButton();
        this._initDetailButton();
    }

    _initSensorTab() {
        this._sensorTab = new WT_G3x5_TSCMapSettingsTab("Sensor", this.parentPage);

        this._sensorTab.attachRow(new WT_G3x5_TSCMapSettingsTerrainTabRow(WT_MapTerrainModeSetting.KEY_DEFAULT));
        this._sensorTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("NEXRAD Data", WT_G3x5_NavMap.NEXRAD_SHOW_KEY, WT_G3x5_NavMap.NEXRAD_RANGE_KEY, WT_G3x5_NavMap.NEXRAD_RANGE_MAX, "Map NEXRAD Range"));

        this._tabbedContent.addTab(this._sensorTab);
    }

    _initInsetTab() {
        this._insetTab = new WT_G3x5_TSCMapSettingsTab("Inset Window", this.parentPage);

        this._tabbedContent.addTab(this._insetTab, WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);
    }

    _initAviationTab() {
        this._aviationTab = new WT_G3x5_TSCMapSettingsTab("Aviation", this.parentPage);

        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("Airways", WT_G3x5_NavMap.AIRWAY_SHOW_KEY, WT_G3x5_NavMap.AIRWAY_RANGE_KEY, WT_G3x5_NavMap.AIRWAY_RANGE_MAX, "Map Airway Range"));
        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsMultiRangeTabRow("Airports",
            WT_G3x5_NavMap.AIRPORT_SHOW_KEY, [
                WT_G3x5_NavMap.AIRPORT_LARGE_RANGE_KEY,
                WT_G3x5_NavMap.AIRPORT_MEDIUM_RANGE_KEY,
                WT_G3x5_NavMap.AIRPORT_SMALL_RANGE_KEY
            ], [
                WT_G3x5_NavMap.AIRPORT_LARGE_RANGE_MAX,
                WT_G3x5_NavMap.AIRPORT_MEDIUM_RANGE_MAX,
                WT_G3x5_NavMap.AIRPORT_SMALL_RANGE_MAX
            ], [
                "Large Airport",
                "Medium Airport",
                "Small Airport"
            ], "Airport Settings", [
                "Map Large Airport Range",
                "Map Medium Airport Range",
                "Map Small Airport Range"
            ]
        ));
        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("VOR", WT_G3x5_NavMap.VOR_SHOW_KEY, WT_G3x5_NavMap.VOR_RANGE_KEY, WT_G3x5_NavMap.VOR_RANGE_MAX, "Map VOR Range"));
        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("INT", WT_G3x5_NavMap.INT_SHOW_KEY, WT_G3x5_NavMap.INT_RANGE_KEY, WT_G3x5_NavMap.INT_RANGE_MAX, "Map INT Range"));
        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("NDB", WT_G3x5_NavMap.NDB_SHOW_KEY, WT_G3x5_NavMap.NDB_RANGE_KEY, WT_G3x5_NavMap.NDB_RANGE_MAX, "Map NDB Range"));

        this._tabbedContent.addTab(this._aviationTab);
    }

    _initLandTab() {
        this._landTab = new WT_G3x5_TSCMapSettingsTab("Land", this.parentPage);

        this._landTab.attachRow(new WT_G3x5_TSCMapSettingsMultiRangeTabRow("Cities",
            WT_G3x5_NavMap.CITY_SHOW_KEY, [
                WT_G3x5_NavMap.CITY_LARGE_RANGE_KEY,
                WT_G3x5_NavMap.CITY_MEDIUM_RANGE_KEY,
                WT_G3x5_NavMap.CITY_SMALL_RANGE_KEY
            ], [
                WT_G3x5_NavMap.CITY_LARGE_RANGE_MAX,
                WT_G3x5_NavMap.CITY_MEDIUM_RANGE_MAX,
                WT_G3x5_NavMap.CITY_SMALL_RANGE_MAX
            ], [
                "Large City",
                "Medium City",
                "Small City"
            ], "City Settings", [
                "Map Large City Range",
                "Map Medium City Range",
                "Map Small City Range"
            ]
        ));
        this._landTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("States/Provinces", WT_G3x5_NavMap.BORDERS_SHOW_KEY, WT_G3x5_NavMap.BORDERS_RANGE_KEY, WT_G3x5_NavMap.BORDERS_RANGE_MAX, "Map State/Province Range"));

        this._tabbedContent.addTab(this._landTab);
    }

    _initOtherTab() {
        this._otherTab = new WT_G3x5_TSCMapSettingsTab("Other", this.parentPage);

        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("North Up<br>Above", WT_MapAutoNorthUpSettingGroup.ACTIVE_KEY, WT_MapAutoNorthUpSettingGroup.RANGE_KEY, WT_G3x5_NavMap.MAP_RANGE_LEVELS[WT_G3x5_NavMap.MAP_RANGE_LEVELS.length - 1], "Map North Up Above"));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsTrackVectorTabRow("Track Vector", WT_MapTrackVectorSettingGroup.SHOW_KEY, WT_MapTrackVectorSettingGroup.LOOKAHEAD_KEY, WT_MapTrackVectorSettingGroup.LOOKAHEAD_VALUES_DEFAULT));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsFuelRingTabRow("Fuel Rng (Rsv)", WT_MapFuelRingSettingGroup.SHOW_KEY, WT_MapFuelRingSettingGroup.RESERVE_KEY));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsToggleTabRow("Range to<br>Altitude", WT_MapAltitudeInterceptSetting.SHOW_KEY_DEFAULT));

        this._tabbedContent.addTab(this._otherTab);
    }

    _initTabs() {
        this._initSensorTab();
        this._initInsetTab();
        this._initAviationTab();
        this._initLandTab();
        this._initOtherTab();

        this._tabbedContent.setActiveTabIndex(0);
    }

    _initTabbedContent() {
        this._tabbedContent = new WT_G3x5_TSCTabbedView();
        this._initTabs();

        this._tabbedContent.slot = "right";
        this.appendChild(this._tabbedContent);
    }

    connectedCallback() {
        this._initLeftButtons();
        this._initTabbedContent();
    }

    _onOrientationButtonPressed() {
        this.parentPage.instrument.selectionListWindow1.element.setContext(this._orientationWindowContext);
        this.parentPage.instrument.switchToPopUpPage(this.parentPage.instrument.selectionListWindow1);
    }

    _onSyncButtonPressed() {
        this.parentPage.instrument.selectionListWindow1.element.setContext(this._syncWindowContext);
        this.parentPage.instrument.switchToPopUpPage(this.parentPage.instrument.selectionListWindow1);
    }

    _onDetailButtonPressed() {
        this.parentPage.instrument.mapDetailSelect.element.setContext(this.parentPage.getControllerID(), this.parentPage.homePageGroup, this.parentPage.homePageName);
        this.parentPage.instrument.switchToPopUpPage(this.parentPage.instrument.mapDetailSelect);
    }

    _onOrientationSelected(value) {
        WT_MapController.setSettingValue(this.parentPage.getControllerID(), WT_G3x5_NavMap.ORIENTATION_KEY, value, true);
        this._updateOrientationButton();
    }

    _onSyncSelected(value) {
        let oldValue = WT_MapController.getSyncMode(this.parentPage.getControllerID());
        if (value !== oldValue) {
            switch (value) {
                case WT_MapController.SyncMode.ALL:
                    for (let id of this.parentPage.allControllerIDs) {
                        WT_MapController.setSyncMode(id, value, this.parentPage.getControllerID());
                    }
                    break;
                case WT_MapController.SyncMode.OFF:
                    for (let id of this.parentPage.allControllerIDs) {
                        WT_MapController.setSyncMode(id, value, this.parentPage.getControllerID());
                    }
                    break;
            }
        }
        this._updateSyncButton();
    }

    _updateOrientationButton() {
        let value = WT_MapController.getSettingValue(this.parentPage.getControllerID(), WT_G3x5_NavMap.ORIENTATION_KEY, 0);
        this._orientationButton.valueText = WT_G3x5_TSCMapSettingsHTMLElement.ORIENTATION_TEXTS[value];
    }

    _updateSyncButton() {
        let value = WT_MapController.getSyncMode(this.parentPage.getControllerID());
        this._syncButton.valueText = WT_G3x5_TSCMapSettingsHTMLElement.SYNC_TEXTS[value];
    }

    _updateDetailButton() {
        let value = WT_MapController.getSettingValue(this.parentPage.getControllerID(), WT_MapDCLTRSetting.KEY_DEFAULT);
        this._detailButton.setValue(value);
    }

    _updateTabbedContent() {
        this._tabbedContent.getActiveTab().update();
    }

    update() {
        this._updateOrientationButton();
        this._updateSyncButton();
        this._updateDetailButton();
        this._updateTabbedContent();
    }
}
WT_G3x5_TSCMapSettingsHTMLElement.ORIENTATION_TEXTS = [
    "Heading Up",
    "Track Up",
    "North Up"
];
WT_G3x5_TSCMapSettingsHTMLElement.SYNC_TEXTS = [
    "Off",
    "All"
];
WT_G3x5_TSCMapSettingsHTMLElement.LEFT_BUTTON_CLASS = "leftButton";
WT_G3x5_TSCMapSettingsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCMapSettingsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: auto;
            grid-template-columns: var(--mapsettings-left-width, 1fr) var(--mapsettings-right-width, 3fr);
            grid-gap: 0 var(--mapsettings-left-right-gap, 3vh);
        }
            slot {
                display: block;
                position: relative;
                width: 100%;
                height: 100%;
            }
            #left {
                display: flex;
                flex-flow: column nowrap;
                justify-content: flex-start;
                align-items: center;
            }
    </style>
    <div id="wrapper">
        <slot name="left" id="left"></slot>
        <slot name="right" id="right"></slot>
    </div>
`;

customElements.define("tsc-mapsettings", WT_G3x5_TSCMapSettingsHTMLElement);

class WT_G3x5_TSCPFDMapSettingsHTMLElement extends WT_G3x5_TSCMapSettingsHTMLElement {
    _initInsetMapButton() {
        this._insetMapButton = new WT_TSCStatusBarButton();
        this._insetMapButton.classList.add(WT_G3x5_TSCMapSettingsHTMLElement.LEFT_BUTTON_CLASS);
        this._insetMapButton.labelText = "Inset Map";
        this._insetMapButton.addButtonListener(this._onInsetMapButtonPressed.bind(this));
        this.parentPage.insetMapShowSetting.addListener(this._onInsetMapShowSettingChanged.bind(this));

        this._insetMapButton.slot = "left";
        this.appendChild(this._insetMapButton);

        this._updateInsetMapButton();
    }

    _initLeftButtons() {
        this._initInsetMapButton();
        super._initLeftButtons();
    }

    _onInsetMapButtonPressed(button) {
        this.parentPage.insetMapShowSetting.setValue(!this.parentPage.insetMapShowSetting.getValue());
    }

    _updateInsetMapButton() {
        this._insetMapButton.toggle = this.parentPage.insetMapShowSetting.getValue() ? "on" : "off";
    }

    _onInsetMapShowSettingChanged(setting, newValue, oldValue) {
        this._updateInsetMapButton();
    }
}

customElements.define("tsc-pfdmapsettings", WT_G3x5_TSCPFDMapSettingsHTMLElement);

class WT_G3x5_TSCMFDMapSettingsHTMLElement extends WT_G3x5_TSCMapSettingsHTMLElement {
    _initOtherTab() {
        this._otherTab = new WT_G3x5_TSCMapSettingsTab("Other", this.parentPage);

        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("North Up<br>Above", WT_MapAutoNorthUpSettingGroup.ACTIVE_KEY, WT_MapAutoNorthUpSettingGroup.RANGE_KEY, WT_G3x5_NavMap.MAP_RANGE_LEVELS[WT_G3x5_NavMap.MAP_RANGE_LEVELS.length - 1], "Map North Up Above"));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsTrackVectorTabRow("Track Vector", WT_MapTrackVectorSettingGroup.SHOW_KEY, WT_MapTrackVectorSettingGroup.LOOKAHEAD_KEY, WT_MapTrackVectorSettingGroup.LOOKAHEAD_VALUES_DEFAULT));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsToggleTabRow("Wind Vector", WT_MapWindDataShowSetting.KEY));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsFuelRingTabRow("Fuel Rng (Rsv)", WT_MapFuelRingSettingGroup.SHOW_KEY, WT_MapFuelRingSettingGroup.RESERVE_KEY));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsToggleTabRow("Range to<br>Altitude", WT_MapAltitudeInterceptSetting.SHOW_KEY_DEFAULT));

        this._tabbedContent.addTab(this._otherTab);
    }
}

customElements.define("tsc-mfdmapsettings", WT_G3x5_TSCMFDMapSettingsHTMLElement);

class WT_G3x5_TSCMapDetailButton extends WT_TSCLabeledButton {
    constructor() {
        super();

        this._value = 0;
        this._lastVisible = null;
    }

    _initLabelBoxStyle() {
        return `
            #labelbox {
                position: absolute;
                width: 100%;
                top: 5%;
                height: 30%;
            }
        `;
    }

    _initImageStyle() {
        return `
            img {
                position: absolute;
                left: 25%;
                max-height: 60%;
                width: 50%;
                bottom: 5%;
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();
        let imageStyle = this._initImageStyle();

        return `
            ${style}
            ${imageStyle}
        `;
    }

    _initImages() {
        this._images = [];
        for (let i = 0; i < WT_G3x5_TSCMapDetailButton.IMAGE_SOURCES.length; i++) {
            let img = document.createElement("img");
            img.style.display = "none";
            img.src = WT_G3x5_TSCMapDetailButton.IMAGE_SOURCES[i];
            this._wrapper.appendChild(img);
            this._images.push(img);
        }
    }

    _appendChildren() {
        super._appendChildren();

        this._initImages();
    }

    connectedCallback() {
        super.connectedCallback();

        this._updateImages();
    }

    _updateImages() {
        if (this._lastVisible) {
            this._lastVisible.style.display = "none";
        }

        let image = this._images[this._value];

        if (image) {
            image.style.display = "block";
            this._lastVisible = image;
        } else {
            this._lastVisible = null;
        }
    }

    setValue(value) {
        if (value === this._value) {
            return;
        }

        this._value = value;
        this._updateImages();
    }
}
WT_G3x5_TSCMapDetailButton.IMAGE_SOURCES = [
    "/WTg3000/SDK/Assets/Images/TSC/ICON_MAPDETAIL_SMALL_4.png",
    "/WTg3000/SDK/Assets/Images/TSC/ICON_MAPDETAIL_SMALL_3.png",
    "/WTg3000/SDK/Assets/Images/TSC/ICON_MAPDETAIL_SMALL_2.png",
    "/WTg3000/SDK/Assets/Images/TSC/ICON_MAPDETAIL_SMALL_1.png"
];

customElements.define("tsc-button-mapdetail", WT_G3x5_TSCMapDetailButton);

class WT_G3x5_TSCMapDetailSelect extends NavSystemElement {
    init(root) {
        this.window = root;
        this.slider = root.getElementsByClassName("slider")[0];
        this.slider.addEventListener("input", this.syncDetailToSlider.bind(this));
        this.sliderBackground = root.getElementsByClassName("sliderBackground")[0];
        this.decButton = this.gps.getChildById("MapDetailDecreaseButton");
        this.incButton = this.gps.getChildById("MapDetailIncreaseButton");

        this.gps.makeButton(this.decButton, this.changeDetail.bind(this, 1));
        this.gps.makeButton(this.incButton, this.changeDetail.bind(this, -1));

        this.updateSlider();
    }

    onEnter() {
        this.window.setAttribute("state", "Active");
        this.gps.activateNavButton(1, "Back", this._onBackPressed.bind(this), false, "ICON_TSC_BUTTONBAR_BACK.png");
        this.gps.activateNavButton(2, "Home", this._onHomePressed.bind(this), false, "ICON_TSC_BUTTONBAR_HOME.png");
    }

    onUpdate(_deltaTime) {
        this.updateSlider();
    }

    onExit() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
        this.window.setAttribute("state", "Inactive");
    }

    onEvent(_event) {
    }

    setContext(controllerID, homePageGroup, homePageName) {
        this._controllerID = controllerID;
        this._homePageGroup = homePageGroup;
        this._homePageName = homePageName;
    }

    updateSlider() {
        let currentDetail = 3 - WT_MapController.getSettingValue(this._controllerID, WT_MapDCLTRSetting.KEY_DEFAULT);
        let currentClip = Math.min(100 * (1 - currentDetail / 3), 99);
        this.slider.value = currentDetail;
        this.sliderBackground.style.webkitClipPath = "polygon(0 " + fastToFixed(currentClip, 0) + "%, 100% " + fastToFixed(currentClip, 0) + "%, 100% 100%, 0 100%)"; // update the range slider's track background to only show below the thumb
    }

    syncDetailToSlider() {
        let value = 3 - parseInt(this.slider.value);
        WT_MapController.setSettingValue(this._controllerID, WT_MapDCLTRSetting.KEY_DEFAULT, value, true);
    }

    changeDetail(delta) {
        let newValue = Math.min(Math.max(WT_MapController.getSettingValue(this._controllerID, WT_MapDCLTRSetting.KEY_DEFAULT) + delta, 0), 3);
        WT_MapController.setSettingValue(this._controllerID, WT_MapDCLTRSetting.KEY_DEFAULT, newValue, true);
    }

    _onBackPressed() {
        this.gps.goBack();
    }

    _onHomePressed() {
        this.gps.closePopUpElement();
        this.gps.SwitchToPageName(this._homePageGroup, this._homePageName);
    }
}

class WT_G3x5_TSCMapSettingsTab extends WT_G3x5_TSCTabContent {
    constructor(title, settingsPage) {
        super(title);

        this._settingsPage = settingsPage;

        this._htmlElement = new WT_TSCScrollList();

        /**
         * @type {WT_G3x5_TSCMapSettingsTabRow[]}
         */
        this._rows = [];
    }

    /**
     * @readonly
     * @property {WT_TSCMapSettingsTabElement} htmlElement
     * @type {WT_G3x5_TSCMapSettingsTabElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createContext() {
        return {
            instrument: this._settingsPage.gps,
            getControllerID: this._settingsPage.getControllerID.bind(this._settingsPage),
            homePageGroup: this._settingsPage.homePageGroup,
            homePageName: this._settingsPage.homePageName
        };
    }

    /**
     *
     * @param {WT_G3x5_TSCMapSettingsTabRow} row
     */
    _initRow(row) {
        this.htmlElement.appendChild(row.htmlElement);
        row.htmlElement.slot = "content";
        row.onAttached(this._createContext());
    }

    /**
     *
     * @param {WT_G3x5_TSCMapSettingsTabRow} row
     */
    attachRow(row) {
        this._rows.push(row);
        this._initRow(row);
    }

    update() {
        for (let i = 0; i < this._rows.length; i++) {
            let row = this._rows[i];
            if (row) {
                row.onUpdate();
            }
        }
    }
}

class WT_G3x5_TSCMapSettingsTabRowElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCMapSettingsTabRowElement.TEMPLATE.content.cloneNode(true));

        this._left = null;
        this._right = null;
    }

    /**
     * @readonly
     * @property {HTMLElement} left
     * @type {HTMLElement}
     */
    get left() {
        return this._left;
    }

    /**
     * @readonly
     * @property {HTMLElement} right
     * @type {HTMLElement}
     */
    get right() {
        return this._right;
    }

    setLeft(element) {
        if (this.left && this.left.parentNode === this) {
            this.left.classList.remove(WT_G3x5_TSCMapSettingsTabRowElement.LEFT_CLASS);
            this.removeChild(this.left);
        }
        this.appendChild(element);
        element.setAttribute("slot", "left");
        element.classList.add(WT_G3x5_TSCMapSettingsTabRowElement.LEFT_CLASS);
        this._left = element;
    }

    setRight(element) {
        if (this.right && this.right.parentNode === this) {
            this.right.classList.remove(WT_G3x5_TSCMapSettingsTabRowElement.RIGHT_CLASS);
            this._wrapper.removeChild(this.right);
        }
        this.appendChild(element);
        element.setAttribute("slot", "right");
        element.classList.add(WT_G3x5_TSCMapSettingsTabRowElement.RIGHT_CLASS);
        this._right = element;
    }
}
WT_G3x5_TSCMapSettingsTabRowElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCMapSettingsTabRowElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            position: relative;
            display: block;
            margin: 0.5vh 0;
        }

        #wrapper {
            position: relative;
            height: 100%;
            width: 100%;
            display: grid;
            grid-template-rows: 1fr;
            grid-template-columns: 55% 45%;
        }
    </style>
    <div id="wrapper">
        <slot name="left"></slot>
        <slot name="right"></slot>
    </div>
`;
WT_G3x5_TSCMapSettingsTabRowElement.LEFT_CLASS = "mapSettingsTabRowLeft";
WT_G3x5_TSCMapSettingsTabRowElement.RIGHT_CLASS = "mapSettingsTabRowRight";

customElements.define("tsc-mapsettings-tabrow", WT_G3x5_TSCMapSettingsTabRowElement);

class WT_G3x5_TSCMapSettingsTabRow {
    constructor() {
        this._htmlElement = new WT_G3x5_TSCMapSettingsTabRowElement();
        this._htmlElement.setLeft(this._initLeft());
        this._htmlElement.setRight(this._initRight());
    }

    /**
     * @readonly
     * @property {WT_TSCMapSettingsTabRowElement} htmlElement
     * @type {WT_G3x5_TSCMapSettingsTabRowElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _initLeft() {
        return document.createElement("div");
    }

    _initRight() {
        return document.createElement("div");
    }

    get context() {
        return this._context;
    }

    onAttached(context) {
        this._context = context;
    }

    onUpdate() {
    }
}

class WT_G3x5_TSCMapSettingsToggleTabRow extends WT_G3x5_TSCMapSettingsTabRow {
    /**
     * @param {String} toggleButtonLabel
     * @param {String} toggleSettingKey
     */
    constructor(toggleButtonLabel, toggleSettingKey) {
        super();

        this._toggleButton.labelText = toggleButtonLabel;
        this._toggleSettingKey = toggleSettingKey;
    }

    _initLeft() {
        this._toggleButton = new WT_TSCStatusBarButton();
        this._toggleButton.addButtonListener(this._onToggleButtonPressed.bind(this));
        return this._toggleButton;
    }

    _onToggleButtonPressed() {
        WT_MapController.setSettingValue(this.context.getControllerID(), this._toggleSettingKey, !WT_MapController.getSettingValue(this.context.getControllerID(), this._toggleSettingKey, false), true);
    }

    _updateToggleButton() {
        this._toggleButton.toggle = WT_MapController.getSettingValue(this.context.getControllerID(), this._toggleSettingKey, false) ? "on" : "off";
    }

    onUpdate() {
        this._updateToggleButton();
    }
}

class WT_G3x5_TSCMapSettingsRangeTabRow extends WT_G3x5_TSCMapSettingsToggleTabRow {
    /**
     * @param {String} showButtonLabel
     * @param {String} showKey
     * @param {String} rangeKey
     * @param {WT_NumberUnit} rangeMax
     * @param {String} rangeWindowTitleText
     */
    constructor(showButtonLabel, showKey, rangeKey, rangeMax, rangeWindowTitleText) {
        super(showButtonLabel, showKey);
        this._rangeKey = rangeKey;
        this._rangeMax = rangeMax;
        this._rangeWindowTitleText = rangeWindowTitleText;
    }

    _initRight() {
        this._rangeButton = new WT_TSCLabeledButton();
        this._rangeButton.addButtonListener(this._onRangeButtonPressed.bind(this));
        return this._rangeButton;
    }

    _initWindowContext() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(WT_G3x5_TSCMapSettingsRangeTabRow.getRangeValuesDisplayToMax(this._rangeMax));
        this._rangeWindowContext = {
            title: this._rangeWindowTitleText,
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            callback: this._setRangeSetting.bind(this, this.context.getControllerID()),
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            currentIndexGetter: new WT_G3x5_TSCMapSettingIndexGetter(this.context.getControllerID, this._rangeKey),
            homePageGroup: this.context.homePageGroup,
            homePageName: this.context.homePageName
        };
    }

    _setRangeSetting(controllerID, value) {
        WT_MapController.setSettingValue(controllerID, this._rangeKey, value, true);
    }

    _onRangeButtonPressed() {
        this.context.instrument.selectionListWindow1.element.setContext(this._rangeWindowContext);
        this.context.instrument.switchToPopUpPage(this.context.instrument.selectionListWindow1);
    }

    onAttached(context) {
        super.onAttached(context);
        this._initWindowContext();
    }

    _updateRangeButton() {
        this._rangeButton.labelText = WT_G3x5_TSCMapSettingsRangeTabRow.getRangeValueText(WT_G3x5_NavMap.MAP_RANGE_LEVELS[WT_MapController.getSettingValue(this.context.getControllerID(), this._rangeKey)]);
    }

    onUpdate() {
        super.onUpdate();
        this._updateRangeButton();
    }

    static getRangeValueText(range) {
        if (range.compare(WT_Unit.FOOT.createNumber(1000)) <= 0) {
            return range.asUnit(WT_Unit.FOOT).toFixed(0) + "FT";
        } else {
            return range.asUnit(WT_Unit.NMILE) + "NM";
        }
    }

    static getRangeValuesDisplayToMax(max) {
        let values = [];
        for (let i = 0; i < WT_G3x5_NavMap.MAP_RANGE_LEVELS.length && WT_G3x5_NavMap.MAP_RANGE_LEVELS[i].compare(max) <= 0; i++) {
            values.push(WT_G3x5_TSCMapSettingsRangeTabRow.getRangeValueText(WT_G3x5_NavMap.MAP_RANGE_LEVELS[i]));
        }
        return values;
    }
}

class WT_G3x5_TSCMapSettingsMultiRangeTabRow extends WT_G3x5_TSCMapSettingsToggleTabRow {
    /**
     * @param {String} showButtonLabel
     * @param {String} showKey
     * @param {String[]} rangeVarName
     * @param {WT_NumberUnit[]} rangesMax
     * @param {String[]} rangeTypeNames
     * @param {String} typeWindowTitleText
     * @param {String[]} rangeWindowTitleTexts
     */
    constructor(showButtonLabel, showKey, rangeKeys, rangesMax, rangeTypeNames, typeWindowTitleText, rangeWindowTitleTexts) {
        super(showButtonLabel, showKey);
        this._rangeKeys = rangeKeys;
        this._rangesMax = rangesMax;
        this._rangeTypeNames = rangeTypeNames;
        this._typeWindowTitleText = typeWindowTitleText;
        this._rangeWindowTitleTexts = rangeWindowTitleTexts;
    }

    _initRight() {
        this._rangeTypeButton = new WT_TSCLabeledButton();
        this._rangeTypeButton.labelText = "Settings";
        this._rangeTypeButton.addButtonListener(this._onRangeTypeButtonPressed.bind(this));
        return this._rangeTypeButton;
    }

    _initTypeWindowContext() {
        let elementHandler = new WT_G3x5_TSCRangeTypeSelectionElementHandler(this.context.getControllerID, this._rangeTypeNames, this._rangeKeys);
        this._typeWindowContext = {
            title: this._typeWindowTitleText,
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: false,
            callback: this._openRangeWindow.bind(this),
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            currentIndexGetter: {getCurrentIndex() {return -1}},
            homePageGroup: this.context.homePageGroup,
            homePageName: this.context.homePageName
        };
    }

    _initRangeWindowContexts() {
        this._rangeWindowContexts = [];
        for (let i = 0; i < this._rangeKeys.length; i++) {
            let elementHandler = new WT_TSCStandardSelectionElementHandler(WT_G3x5_TSCMapSettingsRangeTabRow.getRangeValuesDisplayToMax(this._rangesMax[i]));
            this._rangeWindowContexts[i] = {
                title: this._rangeWindowTitleTexts[i],
                subclass: "standardDynamicSelectionListWindow",
                closeOnSelect: true,
                callback: this._setRangeSetting.bind(this, i),
                elementConstructor: elementHandler,
                elementUpdater: elementHandler,
                currentIndexGetter: new WT_G3x5_TSCMapSettingIndexGetter(this.context.getControllerID, this._rangeKeys[i]),
                homePageGroup: this.context.homePageGroup,
                homePageName: this.context.homePageName
            };
        }
    }

    _openRangeWindow(index) {
        this.context.instrument.selectionListWindow2.element.setContext(this._rangeWindowContexts[index]);
        this.context.instrument.switchToPopUpPage(this.context.instrument.selectionListWindow2);
    }

    _setRangeSetting(index, value) {
        WT_MapController.setSettingValue(this.context.getControllerID(), this._rangeKeys[index], value, true);
    }

    _onRangeTypeButtonPressed() {
        this.context.instrument.selectionListWindow1.element.setContext(this._typeWindowContext);
        this.context.instrument.switchToPopUpPage(this.context.instrument.selectionListWindow1);
    }

    onAttached(context) {
        super.onAttached(context);
        this._initTypeWindowContext();
        this._initRangeWindowContexts();
    }
}

class WT_G3x5_TSCRangeTypeSelectionElementHandler {
    constructor(getControllerID, typeNames, rangeKeys) {
        this._getControllerID = getControllerID;
        this._typeNames = Array.from(typeNames);
        this._rangeKeys = Array.from(rangeKeys);
    }

    nextElement(index) {
        if (index >= this._typeNames.length) {
            return null;
        }

        let elem = {
            button: document.createElement("div"),
            title: document.createElement("div"),
            value: document.createElement("div")
        };
        elem.button.classList.add("gradientButton", "statusTextButton");
        elem.title.classList.add("mainText");
        elem.value.classList.add("statusText");
        elem.title.innerHTML = this._typeNames[index];
        elem.button.appendChild(elem.title);
        elem.button.appendChild(elem.value);
        return elem;
    }

    update(index, elem) {
        Avionics.Utils.diffAndSet(elem.value, WT_G3x5_TSCMapSettingsRangeTabRow.getRangeValueText(WT_G3x5_NavMap.MAP_RANGE_LEVELS[WT_MapController.getSettingValue(this._getControllerID(), this._rangeKeys[index])]));
    }
}

class WT_G3x5_TSCMapSettingsTrackVectorTabRow extends WT_G3x5_TSCMapSettingsToggleTabRow {
    constructor(toggleButtonLabel, toggleSettingKey, lookaheadSettingKey, lookaheadValues) {
        super(toggleButtonLabel, toggleSettingKey);

        this._lookaheadSettingKey = lookaheadSettingKey;
        this._lookaheadValues = lookaheadValues;
        this._lookaheadValuesText = lookaheadValues.map(WT_G3x5_TSCMapSettingsTrackVectorTabRow.getTrackVectorLookaheadText);
    }

    _initRight() {
        this._lookaheadButton = new WT_TSCLabeledButton();
        this._lookaheadButton.addButtonListener(this._onLookaheadButtonPressed.bind(this));
        return this._lookaheadButton;
    }

    _initWindowContext() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(this._lookaheadValuesText);
        this._rangeWindowContext = {
            title: "Map Track Vector",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            callback: this._setLookaheadSetting.bind(this),
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            currentIndexGetter: new WT_G3x5_TSCMapSettingIndexGetter(this.context.getControllerID, this._lookaheadSettingKey),
            homePageGroup: this.context.homePageGroup,
            homePageName: this.context.homePageName
        };
    }

    _setLookaheadSetting(value) {
        WT_MapController.setSettingValue(this.context.getControllerID(), this._lookaheadSettingKey, value, true);
    }

    _onLookaheadButtonPressed() {
        this.context.instrument.selectionListWindow1.element.setContext(this._rangeWindowContext);
        this.context.instrument.switchToPopUpPage(this.context.instrument.selectionListWindow1);
    }

    onAttached(context) {
        super.onAttached(context);
        this._initWindowContext();
    }

    _updateLookaheadButton() {
        this._lookaheadButton.labelText = WT_G3x5_TSCMapSettingsTrackVectorTabRow.getTrackVectorLookaheadText(this._lookaheadValues[WT_MapController.getSettingValue(this.context.getControllerID(), this._lookaheadSettingKey)]);
    }

    onUpdate() {
        super.onUpdate();
        this._updateLookaheadButton();
    }

    static getTrackVectorLookaheadText(time) {
        let text;
        if (time.asUnit(WT_Unit.SECOND) > 60) {
            text = `${time.asUnit(WT_Unit.MINUTE)}<br>minutes`;
        } else {
            text = `${time.asUnit(WT_Unit.SECOND)}<br>seconds`;
        }
        return text;
    }
}

class WT_G3x5_TSCMapSettingsFuelRingTabRow extends WT_G3x5_TSCMapSettingsToggleTabRow {
    constructor(toggleButtonLabel, toggleSettingKey, reserveTimeSettingKey) {
        super(toggleButtonLabel, toggleSettingKey);

        this._reserveTimeSettingKey = reserveTimeSettingKey;
    }

    _initRight() {
        this._reserveButton = new WT_TSCLabeledButton();
        this._reserveButton.addButtonListener(this._onReserveButtonPressed.bind(this));
        return this._reserveButton;
    }

    _onReserveButtonPressed() {
        let currentSettingValue = WT_MapController.getSettingValue(this.context.getControllerID(), this._reserveTimeSettingKey) * 60000;
        this.context.instrument.timeKeyboard.element.setContext(this._setReserveTimeSetting.bind(this), currentSettingValue, this.context.homePageGroup, this.context.homePageName);
        this.context.instrument.switchToPopUpPage(this.context.instrument.timeKeyboard);
    }

    _setReserveTimeSetting(value) {
        let reserveTime = Math.max(1, Math.round(value / 60000));
        WT_MapController.setSettingValue(this.context.getControllerID(), this._reserveTimeSettingKey, reserveTime, true);
    }

    _updateReserveButton() {
        this._reserveButton.labelText = WT_G3x5_TSCMapSettingsFuelRingTabRow.getFuelRingReserveTimeText(WT_MapController.getSettingValue(this.context.getControllerID(), this._reserveTimeSettingKey));
    }

    onUpdate() {
        super.onUpdate();
        this._updateReserveButton();
    }

    static getFuelRingReserveTimeText(value) {
        let hours = Math.floor(value / 60);
        let minutes = (value % 60).toFixed(0);

        let minutesText = minutes;
        if (minutes < 10) {
            minutesText = "0" + minutesText;
        }

        return hours + "+" + minutesText;
    }
}

class WT_G3x5_TSCMapSettingsTerrainTabRow extends WT_G3x5_TSCMapSettingsTabRow {
    /**
     * @param {String} showButtonLabel
     * @param {String} showKey
     * @param {String} rangeKey
     * @param {WT_NumberUnit} rangeMax
     * @param {String} rangeWindowTitleText
     */
    constructor(modeSettingKey) {
        super();

        this._modeSettingKey = modeSettingKey;
    }

    _initLeft() {
        this._modeButton = new WT_TSCValueButton();
        this._modeButton.labelText = "Terrain";
        this._modeButton.addButtonListener(this._onModeButtonPressed.bind(this));
        return this._modeButton;
    }

    _initWindowContext() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(WT_G3x5_NavMap.TERRAIN_MODE_DISPLAY_TEXT);
        this._modeWindowContext = {
            title: "Map Terrain Displayed",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            callback: this._setModeSetting.bind(this),
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            currentIndexGetter: new WT_G3x5_TSCMapSettingIndexGetter(this.context.getControllerID, this._modeSettingKey),
            homePageGroup: this.context.homePageGroup,
            homePageName: this.context.homePageName
        };
    }

    _setModeSetting(value) {
        WT_MapController.setSettingValue(this.context.getControllerID(), this._modeSettingKey, value, true);
    }

    _onModeButtonPressed() {
        this.context.instrument.selectionListWindow1.element.setContext(this._modeWindowContext);
        this.context.instrument.switchToPopUpPage(this.context.instrument.selectionListWindow1);
    }

    onAttached(context) {
        super.onAttached(context);
        this._initWindowContext();
    }

    _updateModeButton() {
        this._modeButton.valueText = WT_G3x5_NavMap.TERRAIN_MODE_DISPLAY_TEXT[WT_MapController.getSettingValue(this.context.getControllerID(), this._modeSettingKey)];
    }

    onUpdate() {
        super.onUpdate();
        this._updateModeButton();
    }
}

class WT_G3x5_TSCMapSettingIndexGetter {
    constructor(getControllerID, key) {
        this._getControllerID = getControllerID;
        this._key = key;
    }

    getCurrentIndex() {
        return WT_MapController.getSettingValue(this._getControllerID(), this._key);
    }
}