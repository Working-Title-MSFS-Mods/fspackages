class WT_G3x5_TSCMapSettings extends WT_G3x5_TSCPageElement {
    constructor(
        homePageGroup, homePageName, instrumentID,
        orientationButtonName,
        syncButtonName,
        detailButtonName,
        useWindData
    ) {
        super(homePageGroup, homePageName);
        this._instrumentID = instrumentID;

        this._allControllerIDs = ["PFD", "MFD"];

        this.orientationButtonName = orientationButtonName;
        this.syncButtonName = syncButtonName;
        this.detailButtonName = detailButtonName;

        this.tabbedContentContainer = new WT_TSCTabbedContent(this);
        this.tabs = [
            this._sensorTab = new WT_G3x5_TSCMapSettingsTab(this, "MapSensorTab"),
            this._aviationTab = new WT_G3x5_TSCMapSettingsTab(this, "MapAviationTab"),
            this._landTab = new WT_G3x5_TSCMapSettingsTab(this, "MapLandTab"),
            this._otherTab = new WT_G3x5_TSCMapSettingsTab(this, "MapOtherTab")
        ];

        this._sensorTab.attachRow(new WT_G3x5_TSCMapSettingsTerrainTabRow(WT_MapTerrainModeSetting.KEY_DEFAULT));
        this._sensorTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("NEXRAD Data", WT_G3x5NavMap.NEXRAD_SHOW_KEY, WT_G3x5NavMap.NEXRAD_RANGE_KEY, WT_G3x5NavMap.NEXRAD_RANGE_MAX, "Map NEXRAD Range"));

        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("Airways", WT_G3x5NavMap.AIRWAY_SHOW_KEY, WT_G3x5NavMap.AIRWAY_RANGE_KEY, WT_G3x5NavMap.AIRWAY_RANGE_MAX, "Map Airway Range"));
        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsMultiRangeTabRow("Airports",
            WT_G3x5NavMap.AIRPORT_SHOW_KEY, [
                WT_G3x5NavMap.AIRPORT_LARGE_RANGE_KEY,
                WT_G3x5NavMap.AIRPORT_MEDIUM_RANGE_KEY,
                WT_G3x5NavMap.AIRPORT_SMALL_RANGE_KEY
            ], [
                WT_G3x5NavMap.AIRPORT_LARGE_RANGE_MAX,
                WT_G3x5NavMap.AIRPORT_MEDIUM_RANGE_MAX,
                WT_G3x5NavMap.AIRPORT_SMALL_RANGE_MAX
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
        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("VOR", WT_G3x5NavMap.VOR_SHOW_KEY, WT_G3x5NavMap.VOR_RANGE_KEY, WT_G3x5NavMap.VOR_RANGE_MAX, "Map VOR Range"));
        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("INT", WT_G3x5NavMap.INT_SHOW_KEY, WT_G3x5NavMap.INT_RANGE_KEY, WT_G3x5NavMap.INT_RANGE_MAX, "Map INT Range"));
        this._aviationTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("NDB", WT_G3x5NavMap.NDB_SHOW_KEY, WT_G3x5NavMap.NDB_RANGE_KEY, WT_G3x5NavMap.NDB_RANGE_MAX, "Map NDB Range"));

        this._landTab.attachRow(new WT_G3x5_TSCMapSettingsMultiRangeTabRow("Cities",
            WT_G3x5NavMap.CITY_SHOW_KEY, [
                WT_G3x5NavMap.CITY_LARGE_RANGE_KEY,
                WT_G3x5NavMap.CITY_MEDIUM_RANGE_KEY,
                WT_G3x5NavMap.CITY_SMALL_RANGE_KEY
            ], [
                WT_G3x5NavMap.CITY_LARGE_RANGE_MAX,
                WT_G3x5NavMap.CITY_MEDIUM_RANGE_MAX,
                WT_G3x5NavMap.CITY_SMALL_RANGE_MAX
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
        this._landTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("States/Provinces", WT_G3x5NavMap.BORDERS_SHOW_KEY, WT_G3x5NavMap.BORDERS_RANGE_KEY, WT_G3x5NavMap.BORDERS_RANGE_MAX, "Map State/Province Range"));

        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsRangeTabRow("North Up<br>Above", WT_MapAutoNorthUpSettingGroup.ACTIVE_KEY, WT_MapAutoNorthUpSettingGroup.RANGE_KEY, WT_G3x5NavMap.MAP_RANGE_LEVELS[WT_G3x5NavMap.MAP_RANGE_LEVELS.length - 1], "Map North Up Above"));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsTrackVectorTabRow("Track Vector", WT_MapTrackVectorSettingGroup.SHOW_KEY, WT_MapTrackVectorSettingGroup.LOOKAHEAD_KEY, WT_MapTrackVectorSettingGroup.LOOKAHEAD_VALUES_DEFAULT));
        if (useWindData) {
            this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsToggleTabRow("Wind Vector", WT_MapWindDataShowSetting.KEY));
        }
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsFuelRingTabRow("Fuel Rng (Rsv)", WT_MapFuelRingSettingGroup.SHOW_KEY, WT_MapFuelRingSettingGroup.RESERVE_KEY));
        this._otherTab.attachRow(new WT_G3x5_TSCMapSettingsToggleTabRow("Range to<br>Altitude", WT_MapAltitudeInterceptSetting.SHOW_KEY_DEFAULT));

        this._updateCallbacks = [];
    }

    /**
     * @readonly
     * @property {String} instrumentID
     * @type {String}
     */
    get instrumentID() {
        return this._instrumentID;
    }

    getControllerID() {
        return `${this.instrumentID}-${this.gps.getMFDPaneControl()}`;
    }

    init(root) {
        this.initOrientationSetting();
        this.initSyncSetting();
        this.initDetailSetting();
        this.initTabs(root);
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
            currentIndexGetter: new WT_G3x5_TSCMapSettingIndexGetter(this.getControllerID.bind(this), key),
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName
        };
    }

    initOrientationSetting() {
        this._orientationWindowContext = this._createWindowContext("Map Orientation", WT_G3x5_TSCMapSettings.ORIENTATION_TEXTS, this.setOrientation.bind(this), WT_G3x5NavMap.ORIENTATION_KEY);
        this._orientationButton = this.gps.getChildById(this.orientationButtonName);
        if (this._orientationButton) {
            this.orientationButtonValue = this._orientationButton.getElementsByClassName("lowerValue")[0];
            this.gps.makeButton(this._orientationButton, this.openOrientationSelection.bind(this));
            this._updateCallbacks.push(this.updateOrientationValue.bind(this));
        }
    }

    initSyncSetting() {
        this._syncWindowContext = this._createWindowContext("Map Sync", WT_G3x5_TSCMapSettings.SYNC_TEXTS, this.setSync.bind(this), WT_MapController.SYNC_MODE_KEY);
        this._syncButton = this.gps.getChildById(this.syncButtonName);
        if (this._syncButton) {
            this.syncButtonValue = this._syncButton.getElementsByClassName("lowerValue")[0];
            this.gps.makeButton(this._syncButton, this.openSyncSelection.bind(this));
            this._updateCallbacks.push(this.updateSyncValue.bind(this));
        }
    }

    initDetailSetting() {
        this.detailButton = this.gps.getChildById(this.detailButtonName);
        if (this.detailButton) {
            this.detailButtonImages = this.detailButton.getElementsByClassName("img");
            this.gps.makeButton(this.detailButton, this.openDetailSelection.bind(this));
            this._updateCallbacks.push(this.updateDetailValue.bind(this));
        }
    }

    initTabs(_root) {
        this.tabbedContentContainer.init(_root.getElementsByClassName("MapSettingsRight")[0]);
        for (let tab of this.tabs) {
            tab.init(_root.getElementsByClassName(tab.elementName)[0]);
            this._updateCallbacks.push(tab.update.bind(tab));
        }
    }

    onUpdate(_deltaTime) {
        for (let callback of this._updateCallbacks) {
            callback();
        }
    }

    onEvent(_event) {
    }

    // update helpers

    updateOrientationValue() {
        let currentOrientation = WT_MapController.getSettingValue(this.getControllerID(), WT_G3x5NavMap.ORIENTATION_KEY);
        let newValue = "";
        switch (currentOrientation) {
            case WT_G3x5NavMap.Orientation.HDG:
                newValue = "Heading Up";
                break;
            case WT_G3x5NavMap.Orientation.TRK:
                newValue = "Track Up";
                break;
            case WT_G3x5NavMap.Orientation.NORTH:
                newValue = "North Up";
                break;
        }
        Avionics.Utils.diffAndSet(this.orientationButtonValue, newValue);
    }

    updateSyncValue() {
        let currentSync = WT_MapController.getSyncMode(this.getControllerID());
        let newValue = "";
        switch (currentSync) {
            case WT_MapController.SyncMode.OFF:
                newValue = "Off";
                break;
            case WT_MapController.SyncMode.ALL:
                newValue = "All";
                break;
        }
        Avionics.Utils.diffAndSet(this.syncButtonValue, newValue);
    }

    updateDetailValue() {
        let currentDetail = WT_MapController.getSettingValue(this.getControllerID(), WT_MapDCLTRSetting.KEY_DEFAULT);
        for (let i = 0; i < this.detailButtonImages.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.detailButtonImages[i], "state", (currentDetail == i) ? "Active" : "Inactive");
        }
    }

    // button click callbacks

    openOrientationSelection() {
        this.gps.selectionListWindow1.element.setContext(this._orientationWindowContext);
        this.gps.switchToPopUpPage(this.gps.selectionListWindow1);
    }

    openSyncSelection() {
        this.gps.selectionListWindow1.element.setContext(this._syncWindowContext);
        this.gps.switchToPopUpPage(this.gps.selectionListWindow1);
    }

    openDetailSelection() {
        this.gps.mapDetailSelect.element.setContext(this.getControllerID(), this.homePageGroup, this.homePageName);
        this.gps.switchToPopUpPage(this.gps.mapDetailSelect);
    }

    // setter helpers

    setOrientation(value) {
        WT_MapController.setSettingValue(this.getControllerID(), WT_G3x5NavMap.ORIENTATION_KEY, value, true);
        this.updateOrientationValue();
    }

    setSync(mode) {
        let oldMode = WT_MapController.getSyncMode(this.getControllerID());
        if (mode !== oldMode) {
            switch (mode) {
                case WT_MapController.SyncMode.ALL:
                    for (let id of this._allControllerIDs) {
                        WT_MapController.setSyncMode(id, mode, this.getControllerID());
                    }
                    break;
                case WT_MapController.SyncMode.OFF:
                    for (let id of this._allControllerIDs) {
                        WT_MapController.setSyncMode(id, mode, this.getControllerID());
                    }
                    break;
            }
        }
    }
}
WT_G3x5_TSCMapSettings.ORIENTATION_TEXTS = [
    "Heading Up",
    "Track Up",
    "North Up"
];
WT_G3x5_TSCMapSettings.SYNC_TEXTS = [
    "Off",
    "All"
];

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
        this.gps.activateNavButton(1, "Back", this.back.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
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

    back() {
        this.gps.goBack();
    }

    backHome() {
        this.gps.closePopUpElement();
        this.gps.SwitchToPageName(this._homePageGroup, this._homePageName);
    }
}

class WT_G3x5_TSCMapSettingsTabElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCMapSettingsTabElement.TEMPLATE.content.cloneNode(true));
    }
}
WT_G3x5_TSCMapSettingsTabElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCMapSettingsTabElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper  {
            position: relative;
            width: 100%;
            height: 100%;
            overflow-x: hidden;
            overflow-y: scroll;
        }
            #wrapper::-webkit-scrollbar {
                width: 1vw;
            }
            #wrapper::-webkit-scrollbar-track {
                background: none;
            }
            #wrapper::-webkit-scrollbar-thumb {
                background: white;
            }
    </style>
    <div id="wrapper">
        <slot name="rows"></slot>
    </div>
`;

customElements.define("tsc-mapsettings-tab", WT_G3x5_TSCMapSettingsTabElement);

class WT_G3x5_TSCMapSettingsTab {
    constructor(settingsPage, elementName) {
        this._settingsPage = settingsPage;
        this._elementName = elementName;

        this._htmlElement = new WT_G3x5_TSCMapSettingsTabElement();

        /**
         * @type {WT_G3x5_TSCMapSettingsTabRow[]}
         */
        this._rows = [];
        this._isInitialized = false;
    }

    /**
     * @readonly
     * @property {String} elementName
     * @type {String}
     */
    get elementName() {
        return this._elementName;
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
        row.htmlElement.setAttribute("slot", "rows");
        row.onAttached(this._createContext());
    }

    init(htmlElement) {
        this._htmlElement = htmlElement;
        for (let row of this._rows) {
            this._initRow(row);
        }
        this._isInitialized = true;
    }

    /**
     *
     * @param {WT_G3x5_TSCMapSettingsTabRow} row
     */
    attachRow(row) {
        this._rows.push(row);
        if (this._isInitialized) {
            this._initRow(row);
        }
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
        this._rangeButton = new WT_TSCButton();
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
        this._rangeButton.labelText = WT_G3x5_TSCMapSettingsRangeTabRow.getRangeValueText(WT_G3x5NavMap.MAP_RANGE_LEVELS[WT_MapController.getSettingValue(this.context.getControllerID(), this._rangeKey)]);
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
        for (let i = 0; i < WT_G3x5NavMap.MAP_RANGE_LEVELS.length && WT_G3x5NavMap.MAP_RANGE_LEVELS[i].compare(max) <= 0; i++) {
            values.push(WT_G3x5_TSCMapSettingsRangeTabRow.getRangeValueText(WT_G3x5NavMap.MAP_RANGE_LEVELS[i]));
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
        this._rangeTypeButton = new WT_TSCButton();
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
                currentIndexGetter: new WT_G3x5_TSCMapSettingIndexGetter(this.context.getControllerID(), this._rangeKeys[i]),
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
        Avionics.Utils.diffAndSet(elem.value, WT_G3x5_TSCMapSettingsRangeTabRow.getRangeValueText(WT_G3x5NavMap.MAP_RANGE_LEVELS[WT_MapController.getSettingValue(this._getControllerID(), this._rangeKeys[index])]));
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
        this._lookaheadButton = new WT_TSCButton();
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
        this._reserveButton = new WT_TSCButton();
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
        let elementHandler = new WT_TSCStandardSelectionElementHandler(WT_G3x5NavMap.TERRAIN_MODE_DISPLAY_TEXT);
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
        this._modeButton.valueText = WT_G3x5NavMap.TERRAIN_MODE_DISPLAY_TEXT[WT_MapController.getSettingValue(this.context.getControllerID(), this._modeSettingKey)];
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