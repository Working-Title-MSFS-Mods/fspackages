class WT_G3x5_TSCMapSettings extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName, mapID) {
        super(homePageGroup, homePageName);

        this._mapID = mapID;

        this._allSettingModelIDs = ["PFD", "MFD-LEFT", "MFD-RIGHT"];

        this._initSettingModel();
    }

    _initSettingModel() {
        this._settingModel = new WT_MapSettingModel(this.mapID, null, null);

        this._mapSettings = new WT_G3x5_NavMapSettings(this._settingModel, this._getLayerOptions(), false);
    }

    /**
     * @readonly
     * @type {String}
     */
    get mapID() {
        return this._mapID;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCMapSettingsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @type {String[]}
     */
    get allSettingModelIDs() {
        return this._allSettingModelIDs;
    }

    /**
     * @readonly
     * @type {WT_MapSettingModel}
     */
    get settingModel() {
        return this._settingModel;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavMapSettings}
     */
    get mapSettings() {
        return this._mapSettings;
    }

    init(root) {
        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }
}

class WT_G3x5_TSCPFDMapSettings extends WT_G3x5_TSCMapSettings {
    constructor(homePageGroup, homePageName, instrumentID) {
        super(homePageGroup, homePageName, instrumentID);

        this._initInsetMapSettingModel();
    }

    _getLayerOptions() {
        return WT_G3x5_TSCPFDMapSettings.MAP_LAYER_OPTIONS;
    }

    _initInsetMapSettingModel() {
        this._insetMapSettingModel = new WT_DataStoreSettingModel(this.mapID, null);
        this._insetMapSettingModel.addSetting(this._insetMapShowSetting = new WT_G3x5_PFDInsetMapShowSetting(this._insetMapSettingModel));
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDInsetMapShowSetting}
     */
    get insetMapShowSetting() {
        return this._insetMapShowSetting;
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCPFDMapSettingsHTMLElement();
        htmlElement.setParentPage(this);
        return htmlElement;
    }
}
WT_G3x5_TSCPFDMapSettings.MAP_LAYER_OPTIONS = {
    pointer: false,
    miniCompass: true,
    rangeDisplay: true,
    windData: false,
    roads: false
};

class WT_G3x5_TSCMFDMapSettings extends WT_G3x5_TSCMapSettings {
    constructor(homePageGroup, homePageName, instrumentID, halfPaneID, paneSettings) {
        super(homePageGroup, homePageName, `${instrumentID}-${halfPaneID}`);

        this._paneSettings = paneSettings;
    }

    _getLayerOptions() {
        return WT_G3x5_TSCMFDMapSettings.MAP_LAYER_OPTIONS;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PaneSettings}
     */
    get paneSettings() {
        return this._paneSettings;
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCMFDMapSettingsHTMLElement();
        htmlElement.setParentPage(this);
        return htmlElement;
    }
}
WT_G3x5_TSCMFDMapSettings.MAP_LAYER_OPTIONS = {
    pointer: true,
    miniCompass: true,
    rangeDisplay: false,
    windData: true,
    roads: true
};

class WT_G3x5_TSCMapSettingsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCMapSettingsHTMLElement.TEMPLATE.content.cloneNode(true));

        this._isConnected = false;
        this._isInit = false;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCMapSettings}
     */
    get parentPage() {
        return this._parentPage;
    }

    /**
     *
     * @param {WT_G3x5_TSCMapSettings} page
     */
    setParentPage(page) {
        if (!page || this._parentPage) {
            return;
        }

        this._parentPage = page;
        if (!this._isInit && this._isConnected) {
            this._doInit();
        }
    }

    _initOrientationButton() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(WT_G3x5_TSCMapSettingsHTMLElement.ORIENTATION_TEXTS);
        this._orientationWindowContext = {
            title: "Map Orientation",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            homePageGroup: this.parentPage.homePageGroup,
            homePageName: this.parentPage.homePageName
        };

        this._orientationButton = new WT_TSCValueButton();
        this._orientationButton.classList.add(WT_G3x5_TSCMapSettingsHTMLElement.LEFT_BUTTON_CLASS);
        this._orientationButton.labelText = "Orientation";

        this._orientationButton.slot = "left";
        this.appendChild(this._orientationButton);

        this._orientationButtonManager = new WT_TSCSettingValueButtonManager(this.parentPage.instrument, this._orientationButton, this.parentPage.mapSettings.orientationSetting, this.parentPage.instrument.selectionListWindow1, this._orientationWindowContext, value => WT_G3x5_TSCMapSettingsHTMLElement.ORIENTATION_TEXTS[value]);
        this._orientationButtonManager.init();
    }

    _initSyncButton() {
        let setting = this.parentPage.mapSettings.syncModeSetting;
        let elementHandler = new WT_TSCStandardSelectionElementHandler(WT_G3x5_TSCMapSettingsHTMLElement.SYNC_TEXTS);
        this._syncWindowContext = {
            title: "Map Sync",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            callback: this._onSyncSelected.bind(this),
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            currentIndexGetter: new WT_G3x5_TSCMapSettingIndexGetter(setting),
            homePageGroup: this.parentPage.homePageGroup,
            homePageName: this.parentPage.homePageName
        };

        this._syncButton = new WT_TSCValueButton();
        this._syncButton.classList.add(WT_G3x5_TSCMapSettingsHTMLElement.LEFT_BUTTON_CLASS);
        this._syncButton.labelText = "Map Sync";
        this._syncButton.addButtonListener(this._onSyncButtonPressed.bind(this));

        this._syncButton.slot = "left";
        this.appendChild(this._syncButton);

        setting.addListener(this._onSyncSettingChanged.bind(this));
        this._updateSyncButton(setting.getValue());
    }

    _initDetailButton() {
        this._detailButton = new WT_G3x5_TSCMapDetailButton();
        this._detailButton.classList.add(WT_G3x5_TSCMapSettingsHTMLElement.LEFT_BUTTON_CLASS);
        this._detailButton.labelText = "Map Detail";
        this._detailButton.addButtonListener(this._onDetailButtonPressed.bind(this));

        this._detailButton.slot = "left";
        this.appendChild(this._detailButton);

        this.parentPage.mapSettings.dcltrSetting.addListener(this._onDCLTRSettingChanged.bind(this));
        this._updateDetailButton(this.parentPage.mapSettings.dcltrSetting.getValue());
    }

    _initLeftButtons() {
        this._initOrientationButton();
        this._initSyncButton();
        this._initDetailButton();
    }

    _initSensorTab() {
        let settings = this.parentPage.mapSettings;

        this._sensorTab = new WT_G3x5_TSCMapSettingsTab("Sensor", this.parentPage);

        this._sensorTab.attachRow(new WT_G3x5_TSCMapSettingsTrafficTabRow(settings.trafficShowSetting));
        this._sensorTab.attachRow(new WT_G3x5_TSCMapSettingsTerrainTabRow(settings.terrainModeSetting));
        this._sensorTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("NEXRAD Data", settings.nexradShowSetting, settings.nexradRangeSetting, settings.rangeSetting, WT_G3x5_NavMapSettings.NEXRAD_RANGE_MAX, "Map NEXRAD Range"));

        this._tabbedContent.addTab(this._sensorTab);
    }

    _initInsetTab() {
        this._insetTab = new WT_G3x5_TSCMapSettingsTab("Inset Window", this.parentPage);

        this._tabbedContent.addTab(this._insetTab, WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);
    }

    _initAviationTab() {
        let settings = this.parentPage.mapSettings;

        this._aviationTab = new WT_G3x5_TSCMapSettingsTab("Aviation", this.parentPage);

        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("Airways", settings.airwayShowSetting, settings.airwayRangeSetting, settings.rangeSetting, WT_G3x5_NavMapSettings.AIRWAY_RANGE_MAX, "Map Airway Range"));
        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsMultiRangeTabRow("Airports",
            settings.airportShowSetting, [
                settings.airportLargeRangeSetting,
                settings.airportMediumRangeSetting,
                settings.airportSmallRangeSetting
            ], settings.rangeSetting, [
                WT_G3x5_NavMapSettings.AIRPORT_LARGE_RANGE_MAX,
                WT_G3x5_NavMapSettings.AIRPORT_MEDIUM_RANGE_MAX,
                WT_G3x5_NavMapSettings.AIRPORT_SMALL_RANGE_MAX
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
        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("VOR", settings.vorShowSetting, settings.vorRangeSetting, settings.rangeSetting, WT_G3x5_NavMapSettings.VOR_RANGE_MAX, "Map VOR Range"));
        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("INT", settings.intShowSetting, settings.intRangeSetting, settings.rangeSetting, WT_G3x5_NavMapSettings.INT_RANGE_MAX, "Map INT Range"));
        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("NDB", settings.ndbShowSetting, settings.ndbRangeSetting, settings.rangeSetting, WT_G3x5_NavMapSettings.NDB_RANGE_MAX, "Map NDB Range"));

        this._tabbedContent.addTab(this._aviationTab);
    }

    _initLandTab() {
        let settings = this.parentPage.mapSettings;

        this._landTab = new WT_G3x5_TSCMapSettingsTab("Land", this.parentPage);

        this._landTab.attachRow(new WT_G3x5_TSCMapSettingsMultiRangeTabRow("Cities",
            settings.cityShowSetting, [
                settings.cityLargeRangeSetting,
                settings.cityMediumRangeSetting,
                settings.citySmallRangeSetting
            ], settings.rangeSetting, [
                WT_G3x5_NavMapSettings.CITY_LARGE_RANGE_MAX,
                WT_G3x5_NavMapSettings.CITY_MEDIUM_RANGE_MAX,
                WT_G3x5_NavMapSettings.CITY_SMALL_RANGE_MAX
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
        this._landTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("States/Provinces", settings.stateBorderShowSetting, settings.stateBorderRangeSetting, settings.rangeSetting, WT_G3x5_NavMapSettings.BORDERS_RANGE_MAX, "Map State/Province Range"));

        this._tabbedContent.addTab(this._landTab);
    }

    _initOtherTab() {
        let settings = this.parentPage.mapSettings;

        this._otherTab = new WT_G3x5_TSCMapSettingsTab("Other", this.parentPage);

        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("North Up<br>Above", settings.autoNorthUpActiveSetting, settings.autoNorthUpRangeSetting, settings.rangeSetting, settings.rangeSetting.ranges.get(settings.rangeSetting.ranges.length - 1), "Map North Up Above"));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsTrackVectorTabRow("Track Vector", settings.trackVectorShowSetting, settings.trackVectorLookaheadSetting, WT_MapTrackVectorSettingGroup.LOOKAHEAD_VALUES_DEFAULT));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsFuelRingTabRow("Fuel Rng (Rsv)", settings.fuelRingShowSetting, settings.fuelRingReserveTimeSetting));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsToggleTabRow("Range to<br>Altitude", settings.altitudeInterceptShowSetting));

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

    _doInit() {
        this._initLeftButtons();
        this._initTabbedContent();
        this._isInit = true;
    }

    connectedCallback() {
        this._isConnected = true;
        if (this.parentPage) {
            this._doInit();
        }
    }

    _onSyncSettingChanged(setting, newValue, oldValue) {
        this._updateSyncButton(newValue);
    }

    _onDCLTRSettingChanged(setting, newValue, oldValue) {
        this._updateDetailButton(newValue);
    }

    _onSyncButtonPressed() {
        this.parentPage.instrument.selectionListWindow1.element.setContext(this._syncWindowContext);
        this.parentPage.instrument.switchToPopUpPage(this.parentPage.instrument.selectionListWindow1);
    }

    _onDetailButtonPressed() {
        this.parentPage.instrument.mapDetailSelect.element.setContext({
            homePageGroup: this.parentPage.homePageGroup,
            homePageName: this.parentPage.homePageName,
            setting: this.parentPage.mapSettings.dcltrSetting
        });
        this.parentPage.instrument.switchToPopUpPage(this.parentPage.instrument.mapDetailSelect);
    }

    _onSyncSelected(value) {
        let oldValue = WT_MapSettingModel.getSyncMode(this.parentPage.settingModel.id);
        if (value !== oldValue) {
            switch (value) {
                case WT_MapSettingModel.SyncMode.ALL:
                    for (let id of this.parentPage.allSettingModelIDs) {
                        WT_MapSettingModel.setSyncMode(id, value, this.parentPage.settingModel.id);
                    }
                    break;
                case WT_MapSettingModel.SyncMode.OFF:
                    for (let id of this.parentPage.allSettingModelIDs) {
                        WT_MapSettingModel.setSyncMode(id, value, this.parentPage.settingModel.id);
                    }
                    break;
            }
        }
    }

    _updateSyncButton(value) {
        this._syncButton.valueText = WT_G3x5_TSCMapSettingsHTMLElement.SYNC_TEXTS[value];
    }

    _updateDetailButton(value) {
        this._detailButton.setValue(value);
    }

    _updateTabbedContent() {
        this._tabbedContent.getActiveTab().update();
    }

    update() {
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

class WT_G3x5_TSCPFDMapSettingsHTMLElement extends WT_G3x5_TSCMapSettingsHTMLElement {
    _initInsetMapButton() {
        this._insetMapButton = new WT_TSCStatusBarButton();
        this._insetMapButton.classList.add(WT_G3x5_TSCMapSettingsHTMLElement.LEFT_BUTTON_CLASS);
        this._insetMapButton.labelText = "Inset Map";

        this._insetMapButton.slot = "left";
        this.appendChild(this._insetMapButton);

        this._insetMapButtonManager = new WT_TSCSettingStatusBarButtonManager(this._insetMapButton, this.parentPage.insetMapShowSetting);
        this._insetMapButtonManager.init();
    }

    _initLeftButtons() {
        this._initInsetMapButton();
        super._initLeftButtons();
    }
}

customElements.define("wt-tsc-pfdmapsettings", WT_G3x5_TSCPFDMapSettingsHTMLElement);

class WT_G3x5_TSCMFDMapSettingsHTMLElement extends WT_G3x5_TSCMapSettingsHTMLElement {
    _initInsetTab() {
        super._initInsetTab();

        this._tabbedContent.enableTab(this._insetTab);

        this._insetTab.attachRow(new WT_G3x5_TSCMapSettingsFlightPlanTextTabRow(this.parentPage.paneSettings.navMapInset, this.parentPage.paneSettings.navMapFlightPlanTextInsetDistance));
    }

    _initLandTab() {
        let settings = this.parentPage.mapSettings;

        this._landTab = new WT_G3x5_TSCMapSettingsTab("Land", this.parentPage);

        this._landTab.attachRow(new WT_G3x5_TSCMapSettingsMultiRangeTabRow("Roads",
            settings.roadShowSetting, [
                settings.roadHighwayRangeSetting,
                settings.roadPrimaryRangeSetting,
            ], settings.rangeSetting, [
                WT_G3x5_NavMapSettings.ROAD_HIGHWAY_RANGE_MAX,
                WT_G3x5_NavMapSettings.ROAD_PRIMARY_RANGE_MAX,
            ], [
                "Highway",
                "Primary Road"
            ], "Road Settings", [
                "Map Highway Range",
                "Map Primary Road Range"
            ]
        ));
        this._landTab.attachRow(new WT_G3x5_TSCMapSettingsMultiRangeTabRow("Cities",
            settings.cityShowSetting, [
                settings.cityLargeRangeSetting,
                settings.cityMediumRangeSetting,
                settings.citySmallRangeSetting
            ], settings.rangeSetting, [
                WT_G3x5_NavMapSettings.CITY_LARGE_RANGE_MAX,
                WT_G3x5_NavMapSettings.CITY_MEDIUM_RANGE_MAX,
                WT_G3x5_NavMapSettings.CITY_SMALL_RANGE_MAX
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
        this._landTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("States/Provinces", settings.stateBorderShowSetting, settings.stateBorderRangeSetting, settings.rangeSetting, WT_G3x5_NavMapSettings.BORDERS_RANGE_MAX, "Map State/Province Range"));

        this._tabbedContent.addTab(this._landTab);
    }

    _initOtherTab() {
        let settings = this.parentPage.mapSettings;

        this._otherTab = new WT_G3x5_TSCMapSettingsTab("Other", this.parentPage);

        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("North Up<br>Above", settings.autoNorthUpActiveSetting, settings.autoNorthUpRangeSetting, settings.rangeSetting, settings.rangeSetting.ranges.get(settings.rangeSetting.ranges.length - 1), "Map North Up Above"));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsTrackVectorTabRow("Track Vector", settings.trackVectorShowSetting, settings.trackVectorLookaheadSetting, WT_MapTrackVectorSettingGroup.LOOKAHEAD_VALUES_DEFAULT));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsToggleTabRow("Wind Vector", settings.windDataShowSetting));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsFuelRingTabRow("Fuel Rng (Rsv)", settings.fuelRingShowSetting, settings.fuelRingReserveTimeSetting));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsToggleTabRow("Range to<br>Altitude", settings.altitudeInterceptShowSetting));

        this._tabbedContent.addTab(this._otherTab);
    }
}

customElements.define("wt-tsc-mfdmapsettings", WT_G3x5_TSCMFDMapSettingsHTMLElement);

class WT_G3x5_TSCMapDetailButton extends WT_TSCLabeledButton {
    constructor() {
        super();

        this._value = 0;
        this._lastVisible = null;
    }

    _createLabelBoxStyle() {
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
    "/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAPDETAIL_SMALL_4.png",
    "/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAPDETAIL_SMALL_3.png",
    "/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAPDETAIL_SMALL_2.png",
    "/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAPDETAIL_SMALL_1.png"
];

customElements.define("wt-tsc-button-mapdetail", WT_G3x5_TSCMapDetailButton);

class WT_G3x5_TSCMapDetailSelect extends WT_G3x5_TSCPopUpElement {
    constructor() {
        super();

        this._settingListener = this._onSettingChanged.bind(this);
    }

    onInit() {
        this._slider = this.popUpWindow.getElementsByClassName("slider")[0];
        this._slider.addEventListener("input", this._syncDetailToSlider.bind(this));
        this._sliderBackground = this.popUpWindow.getElementsByClassName("sliderBackground")[0];
        this._decButton = this.popUpWindow.querySelector(`#MapDetailDecreaseButton`);
        this._incButton = this.popUpWindow.querySelector(`#MapDetailIncreaseButton`);

        this.instrument.makeButton(this._decButton, this._changeDetail.bind(this, 1));
        this.instrument.makeButton(this._incButton, this._changeDetail.bind(this, -1));
    }

    _onSettingChanged(setting, newValue, oldValue) {
        this._updateSlider(newValue);
    }

    _updateSlider(value) {
        let currentDetail = 3 - value;
        let currentClip = Math.min(100 * (1 - currentDetail / 3), 99);
        this._slider.value = currentDetail;
        this._sliderBackground.style.webkitClipPath = "polygon(0 " + currentClip.toFixed(0) + "%, 100% " + currentClip.toFixed(0) + "%, 100% 100%, 0 100%)"; // update the range slider's track background to only show below the thumb
    }

    _syncDetailToSlider() {
        let value = 3 - parseInt(this._slider.value);
        this.context.setting.setValue(value);
    }

    _changeDetail(delta) {
        let currentValue = this.context.setting.getValue();
        let newValue = Math.min(Math.max(currentValue + delta, 0), 3);
        this.context.setting.setValue(newValue);
    }

    _initSettingListener() {
        this.context.setting.addListener(this._settingListener);
        this._updateSlider(this.context.setting.getValue());
    }

    onEnter() {
        super.onEnter();

        this._initSettingListener();
    }

    _cleanUpSettingListener() {
        this.context.setting.removeListener(this._settingListener);
    }

    onExit() {
        super.onExit();

        this._cleanUpSettingListener();
    }
}

class WT_G3x5_TSCMapSettingsTab extends WT_G3x5_TSCTabContent {
    /**
     * @param {String} title
     * @param {WT_G3x5_TSCMapSettings} settingsPage
     */
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
     * @type {WT_G3x5_TSCMapSettingsTabElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createContext() {
        return {
            instrument: this._settingsPage.instrument,
            settingModel: this._settingsPage.settingModel,
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

class WT_G3x5_TSCMapSettingsTabRowHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._left = null;
        this._right = null;
    }

    _getTemplate() {
        return WT_G3x5_TSCMapSettingsTabRowHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {HTMLElement}
     */
    get left() {
        return this._left;
    }

    /**
     * @readonly
     * @type {HTMLElement}
     */
    get right() {
        return this._right;
    }

    setLeft(element) {
        if (this.left && this.left.parentNode === this) {
            this.left.classList.remove(WT_G3x5_TSCMapSettingsTabRowHTMLElement.LEFT_CLASS);
            this.removeChild(this.left);
        }
        this.appendChild(element);
        element.setAttribute("slot", "left");
        element.classList.add(WT_G3x5_TSCMapSettingsTabRowHTMLElement.LEFT_CLASS);
        this._left = element;
    }

    setRight(element) {
        if (this.right && this.right.parentNode === this) {
            this.right.classList.remove(WT_G3x5_TSCMapSettingsTabRowHTMLElement.RIGHT_CLASS);
            this._wrapper.removeChild(this.right);
        }
        this.appendChild(element);
        element.setAttribute("slot", "right");
        element.classList.add(WT_G3x5_TSCMapSettingsTabRowHTMLElement.RIGHT_CLASS);
        this._right = element;
    }
}
WT_G3x5_TSCMapSettingsTabRowHTMLElement.NAME = "wt-tsc-mapsettings-tabrow";
WT_G3x5_TSCMapSettingsTabRowHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCMapSettingsTabRowHTMLElement.TEMPLATE.innerHTML = `
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
WT_G3x5_TSCMapSettingsTabRowHTMLElement.LEFT_CLASS = "mapSettingsTabRowLeft";
WT_G3x5_TSCMapSettingsTabRowHTMLElement.RIGHT_CLASS = "mapSettingsTabRowRight";

customElements.define(WT_G3x5_TSCMapSettingsTabRowHTMLElement.NAME, WT_G3x5_TSCMapSettingsTabRowHTMLElement);

class WT_G3x5_TSCMapSettingsTabRow {
    constructor() {
        this._htmlElement = new WT_G3x5_TSCMapSettingsTabRowHTMLElement();
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCMapSettingsTabRowHTMLElement}
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

    /**
     * @readonly
     * @type {WT_G3x5_TSCMapSettingsTabRowContext}
     */
    get context() {
        return this._context;
    }

    _initChildren() {
        this._htmlElement.setLeft(this._initLeft());
        this._htmlElement.setRight(this._initRight());
    }

    onAttached(context) {
        this._context = context;
        this._initChildren();
    }

    onUpdate() {
    }
}

/**
 * @typedef WT_G3x5_TSCMapSettingsTabRowContext
 * @property {AS3000_TSC} instrument
 * @property {WT_MapSettingModel} settingModel
 * @property {String} homePageGroup
 * @property {String} homePageName
 */

class WT_G3x5_TSCMapSettingsToggleTabRow extends WT_G3x5_TSCMapSettingsTabRow {
    /**
     * @param {String} toggleButtonLabel
     * @param {WT_MapSetting} toggleSetting
     */
    constructor(toggleButtonLabel, toggleSetting) {
        super();

        this._toggleButtonLabel = toggleButtonLabel;
        this._toggleSetting = toggleSetting;
    }

    _initLeft() {
        this._toggleButton = new WT_TSCStatusBarButton();
        this._toggleButton.labelText = this._toggleButtonLabel;

        this._toggleButtonManager = new WT_TSCSettingStatusBarButtonManager(this._toggleButton, this._toggleSetting);
        this._toggleButtonManager.init();

        return this._toggleButton;
    }
}

class WT_G3x5_TSCMapSettingsToggleEnumTabRow extends WT_G3x5_TSCMapSettingsTabRow {
    /**
     * @param {String} toggleButtonLabel
     * @param {WT_MapSetting} setting
     * @param {Number} toggleValue
     * @param {Number} [toggleOffValue]
     */
     constructor(toggleButtonLabel, setting, toggleValue, toggleOffValue) {
        super();

        this._toggleButtonLabel = toggleButtonLabel;
        this._setting = setting;
        this._toggleValue = toggleValue;
        this._toggleOffValue = toggleOffValue;
    }

    _initLeft() {
        this._toggleButton = new WT_TSCStatusBarButton();
        this._toggleButton.labelText = this._toggleButtonLabel;

        this._toggleButtonManager = new WT_TSCSettingEnumStatusBarButtonManager(this._toggleButton, this._setting, this._toggleValue, this._toggleOffValue);
        this._toggleButtonManager.init();

        return this._toggleButton;
    }
}

class WT_G3x5_TSCMapSettingsRangeTabRow extends WT_G3x5_TSCMapSettingsToggleTabRow {
    /**
     * @param {String} showButtonLabel
     * @param {WT_MapSetting} showSetting
     * @param {WT_MapSetting} rangeSetting
     * @param {WT_MapRangeSetting} mapRangeSetting
     * @param {WT_NumberUnit} rangeMax
     * @param {String} rangeWindowTitleText
     */
    constructor(showButtonLabel, showSetting, rangeSetting, mapRangeSetting, rangeMax, rangeWindowTitleText) {
        super(showButtonLabel, showSetting);

        this._rangeSetting = rangeSetting;
        this._mapRangeSetting = mapRangeSetting;
        this._rangeMax = rangeMax;
        this._rangeWindowTitleText = rangeWindowTitleText;

        this._lastDistanceUnit = null;
    }

    _getRangeValuesToMax(max) {
        return this._mapRangeSetting.ranges.filter(range => range.compare(max) <= 0);
    }

    _initRight() {
        this._rangeButton = new WT_G3x5_TSCRangeDisplayButton();
        this._rangeButton.addButtonListener(this._onRangeButtonPressed.bind(this));
        return this._rangeButton;
    }

    _initWindowContext() {
        let elementHandler = new WT_G3x5_TSCRangeSelectionElementHandler(this._getRangeValuesToMax(this._rangeMax), this.context.instrument.unitsSettingModel);
        this._rangeWindowContext = {
            title: this._rangeWindowTitleText,
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            callback: this._onRangeSelected.bind(this),
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            currentIndexGetter: new WT_G3x5_TSCMapSettingIndexGetter(this._rangeSetting),
            homePageGroup: this.context.homePageGroup,
            homePageName: this.context.homePageName
        };
    }

    _initSettingListener() {
        this._rangeSetting.addListener(this._onRangeSettingChanged.bind(this));
    }

    _onRangeSettingChanged(setting, newValue, oldValue) {
        this._updateRangeButton(newValue);
    }

    _onRangeSelected(value) {
        this._rangeSetting.setValue(value);
    }

    _onRangeButtonPressed() {
        this.context.instrument.selectionListWindow1.element.setContext(this._rangeWindowContext);
        this.context.instrument.switchToPopUpPage(this.context.instrument.selectionListWindow1);
    }

    onAttached(context) {
        super.onAttached(context);

        this._initWindowContext();
        this._initSettingListener();
    }

    _updateRangeButton(value) {
        let range = this._mapRangeSetting.ranges.get(value);
        let unit = this.context.instrument.unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
        this._rangeButton.setRange(range);
        this._rangeButton.setUnit(unit);
    }

    _updateUnits() {
        let distanceUnit = this.context.instrument.unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
        if (!distanceUnit.equals(this._lastDistanceUnit)) {
            this._updateRangeButton(this._rangeSetting.getValue());
        }
        this._lastDistanceUnit = distanceUnit;
    }

    onUpdate() {
        super.onUpdate();

        this._updateUnits();
    }
}

class WT_G3x5_TSCMapSettingsMultiRangeTabRow extends WT_G3x5_TSCMapSettingsToggleTabRow {
    /**
     * @param {String} showButtonLabel
     * @param {WT_MapSetting} showSetting
     * @param {WT_MapSetting[]} rangeSettings
     * @param {WT_MapRangeSetting} mapRangeSetting
     * @param {WT_NumberUnit[]} rangesMax
     * @param {String[]} rangeTypeNames
     * @param {String} typeWindowTitleText
     * @param {String[]} rangeWindowTitleTexts
     */
    constructor(showButtonLabel, showSetting, rangeSettings, mapRangeSetting, rangesMax, rangeTypeNames, typeWindowTitleText, rangeWindowTitleTexts) {
        super(showButtonLabel, showSetting);

        this._rangeSettings = rangeSettings;
        this._mapRangeSetting = mapRangeSetting;
        this._rangesMax = rangesMax;
        this._rangeTypeNames = rangeTypeNames;
        this._typeWindowTitleText = typeWindowTitleText;
        this._rangeWindowTitleTexts = rangeWindowTitleTexts;
    }

    _getRangeValuesToMax(max) {
        return this._mapRangeSetting.ranges.filter(range => range.compare(max) <= 0);
    }

    _initRight() {
        this._rangeTypeButton = new WT_TSCLabeledButton();
        this._rangeTypeButton.labelText = "Settings";
        this._rangeTypeButton.addButtonListener(this._onRangeTypeButtonPressed.bind(this));
        return this._rangeTypeButton;
    }

    _initTypeWindowContext() {
        let rangeGetter = {
            _rangeSettings: this._rangeSettings,
            _mapRangeSetting: this._mapRangeSetting,
            getRange(index) {
                return this._mapRangeSetting.ranges.get(this._rangeSettings[index].getValue());
            }
        }
        let elementHandler = new WT_G3x5_TSCRangeTypeSelectionElementHandler(this._rangeTypeNames, rangeGetter, this.context.instrument.unitsSettingModel);
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
        for (let i = 0; i < this._rangeSettings.length; i++) {
            let setting = this._rangeSettings[i];
            let elementHandler = new WT_G3x5_TSCRangeSelectionElementHandler(this._getRangeValuesToMax(this._rangesMax[i]), this.context.instrument.unitsSettingModel);
            this._rangeWindowContexts[i] = {
                title: this._rangeWindowTitleTexts[i],
                subclass: "standardDynamicSelectionListWindow",
                closeOnSelect: true,
                callback: this._setRangeSetting.bind(this, setting),
                elementConstructor: elementHandler,
                elementUpdater: elementHandler,
                currentIndexGetter: new WT_G3x5_TSCMapSettingIndexGetter(setting),
                homePageGroup: this.context.homePageGroup,
                homePageName: this.context.homePageName
            };
        }
    }

    _openRangeWindow(index) {
        this.context.instrument.selectionListWindow2.element.setContext(this._rangeWindowContexts[index]);
        this.context.instrument.switchToPopUpPage(this.context.instrument.selectionListWindow2);
    }

    _setRangeSetting(setting, value) {
        setting.setValue(value);
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

class WT_G3x5_TSCMapSettingsTrackVectorTabRow extends WT_G3x5_TSCMapSettingsToggleTabRow {
    /**
     * @param {String} toggleButtonLabel
     * @param {WT_MapSetting} toggleSetting
     * @param {WT_MapSetting} lookaheadSetting
     * @param {WT_NumberUnit[]} lookaheadValues
     */
    constructor(toggleButtonLabel, toggleSetting, lookaheadSetting, lookaheadValues) {
        super(toggleButtonLabel, toggleSetting);

        this._lookaheadSetting = lookaheadSetting;
        this._lookaheadValues = lookaheadValues;
        this._lookaheadValuesText = lookaheadValues.map(WT_G3x5_TSCMapSettingsTrackVectorTabRow.getTrackVectorLookaheadText);
    }

    _initRight() {
        this._lookaheadButton = new WT_TSCLabeledButton();
        return this._lookaheadButton;
    }

    _initWindowContext() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(this._lookaheadValuesText);
        this._lookaheadWindowContext = {
            title: "Map Track Vector",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            homePageGroup: this.context.homePageGroup,
            homePageName: this.context.homePageName
        };
    }

    _initLookaheadButtonManager() {
        this._lookaheadButtonManager = new WT_TSCSettingLabeledButtonManager(this.context.instrument, this._lookaheadButton, this._lookaheadSetting, this.context.instrument.selectionListWindow1, this._lookaheadWindowContext, (value => this._lookaheadValuesText[value]).bind(this));
        this._lookaheadButtonManager.init();
    }

    onAttached(context) {
        super.onAttached(context);

        this._initWindowContext();
        this._initLookaheadButtonManager();
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
    /**
     * @param {String} toggleButtonLabel
     * @param {WT_MapSetting} toggleSetting
     * @param {WT_MapSetting} reserveTimeSetting
     */
    constructor(toggleButtonLabel, toggleSetting, reserveTimeSetting) {
        super(toggleButtonLabel, toggleSetting);

        this._reserveTimeSetting = reserveTimeSetting;
        this._tempSec = WT_Unit.SECOND.createNumber(0);
    }

    _initRight() {
        this._reserveButton = new WT_TSCLabeledButton();
        this._reserveButton.addButtonListener(this._onReserveButtonPressed.bind(this));
        return this._reserveButton;
    }

    _initReserveTimeSettingListener() {
        this._reserveTimeSetting.addListener(this._onReserveTimeSettingChanged.bind(this));
        this._updateReserveButton(this._reserveTimeSetting.getValue());
    }

    onAttached(context) {
        super.onAttached(context);

        this._initReserveTimeSettingListener();
    }

    _onReserveTimeSettingChanged(setting, newValue, oldValue) {
        this._updateReserveButton(newValue);
    }

    _onReserveButtonPressed() {
        let currentSettingSeconds = this._reserveTimeSetting.getValue() * 60;
        this.context.instrument.timeKeyboard.element.setContext({
            title: "Fuel Ring Reserve Time",
            homePageGroup: this.context.homePageGroup,
            homePageName: this.context.homePageName,
            positiveOnly: true,
            limit24Hours: false,
            initialValue: this._tempSec.set(currentSettingSeconds),
            valueEnteredCallback: this._setReserveTimeSetting.bind(this)
        });
        this.context.instrument.switchToPopUpPage(this.context.instrument.timeKeyboard);
    }

    _setReserveTimeSetting(value) {
        this._reserveTimeSetting.setValue(Math.max(1, Math.round(value.asUnit(WT_Unit.MINUTE))));
    }

    _updateReserveButton(value) {
        this._reserveButton.labelText = WT_G3x5_TSCMapSettingsFuelRingTabRow.getFuelRingReserveTimeText(value);
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

class WT_G3x5_TSCMapSettingsTrafficTabRow extends WT_G3x5_TSCMapSettingsToggleTabRow {
    constructor(showSetting) {
        super(WT_G3x5_TSCMapSettingsTrafficTabRow.TOGGLE_BUTTON_LABEL, showSetting);
    }

    _initRight() {
        this._settingsButton = new WT_TSCLabeledButton();
        this._settingsButton.labelText = "Settings";
        this._settingsButton.addButtonListener(this._onSettingsButtonPressed.bind(this));
        return this._settingsButton;
    }

    _openTrafficSettingsPage() {
        let instrument = this.context.instrument;
        let pageGroup = this.context.homePageGroup;
        if (pageGroup === "PFD") {
            instrument.SwitchToPageName(pageGroup, instrument.pfdNavMapTrafficSettings.name);
        } else {
            instrument.SwitchToPageName(pageGroup, instrument.getSelectedMFDPanePages().navMapTraffic.name);
        }
    }

    _onSettingsButtonPressed(button) {
        this._openTrafficSettingsPage();
    }
}
WT_G3x5_TSCMapSettingsTrafficTabRow.TOGGLE_BUTTON_LABEL = "Traffic";

class WT_G3x5_TSCMapSettingsTerrainTabRow extends WT_G3x5_TSCMapSettingsTabRow {
    /**
     * @param {WT_MapSetting} modeSetting
     */
    constructor(modeSetting) {
        super();

        this._modeSetting = modeSetting;
    }

    _initLeft() {
        this._modeButton = new WT_TSCValueButton();
        this._modeButton.labelText = "Terrain";
        return this._modeButton;
    }

    _initWindowContext() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(WT_G3x5_NavMap.TERRAIN_MODE_DISPLAY_TEXT);
        this._modeWindowContext = {
            title: "Map Terrain Displayed",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            homePageGroup: this.context.homePageGroup,
            homePageName: this.context.homePageName
        };
    }

    _initModeButtonManager() {
        this._modeButtonManager = new WT_TSCSettingValueButtonManager(this.context.instrument, this._modeButton, this._modeSetting, this.context.instrument.selectionListWindow1, this._modeWindowContext, value => WT_G3x5_NavMap.TERRAIN_MODE_DISPLAY_TEXT[value]);
        this._modeButtonManager.init();
    }

    onAttached(context) {
        super.onAttached(context);

        this._initWindowContext();
        this._initModeButtonManager();
    }
}

class WT_G3x5_TSCMapSettingsFlightPlanTextTabRow extends WT_G3x5_TSCMapSettingsToggleEnumTabRow {
    constructor(toggleSetting, distanceSetting) {
        super(WT_G3x5_TSCMapSettingsFlightPlanTextTabRow.TOGGLE_BUTTON_LABEL, toggleSetting, WT_G3x5_NavMapDisplayInsetSetting.Mode.FLIGHT_PLAN_TEXT, WT_G3x5_NavMapDisplayInsetSetting.Mode.NONE);

        this._distanceSetting = distanceSetting;
    }

    _initRight() {
        this._distanceButton = new WT_TSCLabeledButton();
        return this._distanceButton;
    }

    _initDistanceWindowContext() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(WT_G3x5_TSCMapSettingsFlightPlanTextTabRow.DISTANCE_SETTING_VALUE_TEXT);
        this._distanceWindowContext = {
            title: "Flight Plan Text Inset Distance",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            homePageGroup: this.context.homePageGroup,
            homePageName: this.context.homePageName
        };
    }

    _initDistanceButtonManager() {
        this._modeButtonManager = new WT_TSCSettingLabeledButtonManager(this.context.instrument, this._distanceButton, this._distanceSetting, this.context.instrument.selectionListWindow1, this._distanceWindowContext, value => WT_G3x5_TSCMapSettingsFlightPlanTextTabRow.DISTANCE_SETTING_VALUE_TEXT[value ? 1 : 0], [false, true]);
        this._modeButtonManager.init();
    }

    onAttached(context) {
        super.onAttached(context);

        this._initDistanceWindowContext();
        this._initDistanceButtonManager();
    }
}
WT_G3x5_TSCMapSettingsFlightPlanTextTabRow.TOGGLE_BUTTON_LABEL = "Flight Plan Text";
WT_G3x5_TSCMapSettingsFlightPlanTextTabRow.DISTANCE_SETTING_VALUE_TEXT = [
    "Leg-Leg",
    "CUM"
];

class WT_G3x5_TSCMapSettingIndexGetter {
    /**
     * @param {WT_MapSetting} setting
     */
    constructor(setting) {
        this._setting = setting;
    }

    getCurrentIndex() {
        return this._setting.getValue();
    }
}