class AS3000_TSC_NavButton_Data {
    constructor() {
        this.isActive = false;
    }
}
class AS3000_TSC_NavButton {
    constructor(_id, _gps) {
        this.noData = new AS3000_TSC_NavButton_Data();
        this.gps = _gps;
        this.button = this.gps.getChildById(_id);
        if (this.button) {
            this.text = this.button.getElementsByClassName("label")[0];
            this.img = this.button.getElementsByClassName("img")[0];
        }
        this.currentState = this.noData;
        this.savedData = this.noData;
        this.gps.makeButton(this.button, this.onClick.bind(this));
    }
    setState(_data, _fromPopUp = false) {
        if (!_fromPopUp) {
            this.savedData = _data;
        }
        if (_data.isActive) {
            this.currentState = _data;
            this.text.innerHTML = _data.title;
            this.img.setAttribute("src", _data.imagePath);
            this.button.setAttribute("state", "");
        }
        else {
            this.button.setAttribute("state", "Inactive");
        }
    }
    deactivate(_fromPopUp = false) {
        if (_fromPopUp) {
            this.setState(this.savedData);
        }
        else {
            this.setState(this.noData);
        }
    }
    onClick() {
        if (this.currentState && this.currentState.callback) {
            this.currentState.callback();
        }
    }
}

class WT_G3x5_TSCPageGroup extends NavSystemPageGroup {
    goToPage(name) {
        let index = this.pages.findIndex(page => page.name === name);
        if (index >= 0) {
            this.pageIndex = index;
        }
    }
}

class WT_G3x5_TSCElementContainer extends NavSystemElementContainer {
    onFocusGained() {
        if (this.element) {
            this.element.onFocusGained();
        }
    }

    onFocusLost() {
        if (this.element) {
            this.element.onFocusLost();
        }
    }

    onEnter() {
        if (!this.checkInit())
            return;
        if (this.element) {
            this.element.onEnter();
            this.element.onFocusGained();
        }
    }

    onExit() {
        if (this.element) {
            this.element.onFocusLost();
            this.element.onExit();
        }
    }
}

class WT_G3x5_TSCPage extends WT_G3x5_TSCElementContainer {
    constructor() {
        super(...arguments);

        this.softKeys = new SoftKeysMenu();
    }

    getSoftKeyMenu() {
        return this.softKeys;
    }
}

class AS3000_TSC extends NavSystemTouch {
    constructor() {
        super();

        this.pfdPrefix = "AS3000_PFD_1";
        this._isChangingPages = false;
        this.history = [];
        this._lastFocus = {
            popUp: null,
            page: null
        };
        this.initDuration = 4000;

        this._initUnitsSettingModel();
        this._initLightingControl();
        this._initNavigraphAPI();
        this._initPaneSettings();

        this._selectedMfdPane = WT_G3x5_MFDHalfPane.ID.LEFT;
        this._mfdPaneControlID;
    }

    _initUnitsSettingModel() {
        this.unitsSettingModel.init();
    }

    _initPaneDisplaySettingListeners() {
        this.allPaneSettings.forEach(paneSettings => paneSettings.display.addListener(this._onMFDHalfPaneDisplayChanged.bind(this)), this);
    }

    _initPaneSettings() {
        this._mfdMainPaneSettings = {settingModel: new WT_DataStoreSettingModel("MFD", null)};
        this._mfdMainPaneSettings.settingModel.addSetting(this._mfdMainPaneSettings.mode = new WT_G3x5_MFDMainPaneModeSetting(this._mfdMainPaneSettings.settingModel));
        this._mfdMainPaneSettings.mode.addListener(this._onMFDMainPaneModeChanged.bind(this));

        this._paneSettings = {};
        this._paneSettings[`MFD-${WT_G3x5_MFDHalfPane.ID.LEFT}`] = new WT_G3x5_PaneSettings(`MFD-${WT_G3x5_MFDHalfPane.ID.LEFT}`);
        this._paneSettings[`MFD-${WT_G3x5_MFDHalfPane.ID.RIGHT}`] = new WT_G3x5_PaneSettings(`MFD-${WT_G3x5_MFDHalfPane.ID.RIGHT}`);
        this._paneSettingsAll = new WT_ReadOnlyArray(Object.values(this._paneSettings));
        this._paneSettingsAll.forEach(settings => settings.update());

        this._initPaneDisplaySettingListeners();

        this._mfdMainPaneSettings.settingModel.update();
    }

    _initLightingControl() {
        if (this.isLightingControlAllowed()) {
            SimVar.SetSimVarValue("L:XMLVAR_AS3000_DisplayLightingBool", "bool", true); // tell xmls to use custom display lighting xmlvar
            SimVar.SetSimVarValue("L:XMLVAR_AS3000_DisplayLighting", "number", WTDataStore.get(AS3000_TSC_LightingConfig.VARNAME_DISPLAY_LIGHTING, 1)); // initialize display brightness variable: 1.0 = maximum brightness
        }
    }

    _initNavigraphAPI() {
        this._navigraphNetworkAPI = new WT_NavigraphNetworkAPI(WT_NavigraphNetworkAPI.MAGIC_STRINGS_G3000);
    }

    get templateID() { return "AS3000_TSC"; }

    /**
     * @readonly
     * @type {{popUp:WT_G3x5_TSCElementContainer, page:WT_G3x5_TSCPage}}
     */
    get lastFocus() {
        return this._lastFocus;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PaneControlSetting.Touchscreen}
     */
    get mfdPaneControlID() {
        return this._mfdPaneControlID;
    }

    /**
     * @readonly
     */
    get commonPages() {
        return this._commonPages;
    }

    /**
     * @readonly
     * @type {{settingModel:WT_DataStoreSettingModel, mode:WT_G3x5_MFDMainPaneModeSetting}}
     */
    get mfdMainPaneSettings() {
        return this._mfdMainPaneSettings;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NearestAirportList}
     */
    get nearestAirportList() {
        return this._nearestAirportList;
    }

    /**
     * @readonly
     * @type {WT_NearestWaypointList<WT_VOR>}
     */
    get nearestVORList() {
        return this._nearestVORList;
    }

    /**
     * @readonly
     * @type {WT_NearestWaypointList<WT_NDB>}
     */
    get nearestNDBList() {
        return this._nearestNDBList;
    }

    /**
     * @readonly
     * @type {WT_NearestWaypointList<WT_Intersection>}
     */
    get nearestINTList() {
        return this._nearestINTList;
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<WT_G3x5_PaneSettings>}
     */
    get allPaneSettings() {
        return this._paneSettingsAll;
    }

    /**
     *
     * @param {String} paneID
     * @returns {WT_G3x5_PaneSettings}
     */
    getPaneSettings(paneID) {
        return this._paneSettings[paneID];
    }

    getSelectedMFDPane() {
        if (this.mfdMainPaneSettings.mode.getValue() === WT_G3x5_MFDMainPaneModeSetting.Mode.FULL) {
            return WT_G3x5_MFDHalfPane.ID.LEFT;
        } else {
            return this._selectedMfdPane;
        }
    }

    /**
     *
     * @returns {WT_G3x5_PaneSettings}
     */
    getSelectedPaneSettings() {
        return this.getPaneSettings(`MFD-${this.getSelectedMFDPane()}`);
    }

    isLightingControlAllowed() {
        return AS3000_TSC.LIGHTING_CONTROL_ALLOWED_AIRCRAFT.has(SimVar.GetSimVarValue("ATC MODEL", "string"));
    }

    _defineSoftKeys() {
        this.pageTitle = this.getChildById("PageTitle");
        this.pfdSoftkey = this.getChildById("SoftKey_2");
        this.mfdSoftkey = this.getChildById("SoftKey_3");
        this.navcomSoftkey = this.getChildById("SoftKey_4");
    }

    _defineLabelBar() {
    }

    _createSpeedBugsPage() {
    }

    _createPFDSettingsPage() {
    }

    _createTrafficMapSettingsPage(homePageGroup, homePageName) {
    }

    _createNavMapTrafficSettingsPage(homePageGroup, homePageName, mapSettings) {
    }

    _createFlightPlanPage() {
        return new WT_G3x5_TSCFlightPlan("MFD", "MFD Home", this.instrumentIdentifier);
    }

    _initPages() {
        this.pagesContainer = this.getChildById("PagesDisplay");

        let mfdLeftPaneSettings = this.getPaneSettings(`MFD-${WT_G3x5_MFDHalfPane.ID.LEFT}`);
        let mfdRightPaneSettings = this.getPaneSettings(`MFD-${WT_G3x5_MFDHalfPane.ID.RIGHT}`);

        this._commonPages = {};
        this._mfdPagesLeft = {};
        this._mfdPagesRight = {};

        this._speedBugs = this._createSpeedBugsPage();

        this.pageGroups = [
            new WT_G3x5_TSCPageGroup("PFD", this, [
                new WT_G3x5_TSCPage("PFD Home", "PFDHome", new AS3000_TSC_PFDHome()),
                new WT_G3x5_TSCPage("Speed Bugs", "SpeedBugs", this._speedBugs),
                new WT_G3x5_TSCPage("Timers", "Timers", new WT_G3x5_TSCTimer("PFD", "PFD Home", "Generic")),
                new WT_G3x5_TSCPage("Minimums", "Minimums", new AS3000_TSC_Minimums()),
                this._pfdMapSettings = new WT_G3x5_TSCPage("PFD Map Settings", "PFDMapSettings", new WT_G3x5_TSCPFDMapSettings("PFD", "PFD Home", "PFD")),
                this.pfdNavMapTrafficSettings = new WT_G3x5_TSCPage("PFD NavMap Traffic Settings", "PFDNavMapTrafficSettings", this._createNavMapTrafficSettingsPage("PFD", "PFD Home", this._pfdMapSettings.element.mapSettings)),
                new WT_G3x5_TSCPage("PFD Settings", "PFDSettings", this._createPFDSettingsPage()),
            ]),
            new WT_G3x5_TSCPageGroup("MFD", this, [
                this._mfdHome = new WT_G3x5_TSCPage("MFD Home", "MFDHome", new AS3000_TSC_MFDHome()),
                this._mfdPagesLeft.mapSettings = new WT_G3x5_TSCPage("Map Settings Left", "MFDMapSettingsLeft", new WT_G3x5_TSCMFDMapSettings("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.LEFT, mfdLeftPaneSettings)),
                this._mfdPagesRight.mapSettings = new WT_G3x5_TSCPage("Map Settings Right", "MFDMapSettingsRight", new WT_G3x5_TSCMFDMapSettings("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.RIGHT, mfdRightPaneSettings)),
                this._mfdPagesLeft.mapPointerControl = new WT_G3x5_TSCPage("Map Pointer Control Left", "MapPointerControlLeft", new WT_G3x5_TSCMapPointerControl("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.LEFT)),
                this._mfdPagesRight.mapPointerControl = new WT_G3x5_TSCPage("Map Pointer Control Right", "MapPointerControlRight", new WT_G3x5_TSCMapPointerControl("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.RIGHT)),
                this._mfdPagesLeft.trafficMap = new WT_G3x5_TSCPage("Traffic Map Settings Left", "TrafficMapSettingsLeft", this._createTrafficMapSettingsPage("MFD", "MFD Home")),
                this._mfdPagesRight.trafficMap = new WT_G3x5_TSCPage("Traffic Map Settings Right", "TrafficMapSettingsRight", this._createTrafficMapSettingsPage("MFD", "MFD Home")),
                this._mfdPagesLeft.navMapTraffic = new WT_G3x5_TSCPage("NavMap Traffic Settings Left", "NavMapTrafficSettingsLeft", this._createNavMapTrafficSettingsPage("MFD", "MFD Home", this._mfdPagesLeft.mapSettings.element.mapSettings)),
                this._mfdPagesRight.navMapTraffic = new WT_G3x5_TSCPage("NavMap Traffic Settings Right", "NavMapTrafficSettingsRight", this._createNavMapTrafficSettingsPage("MFD", "MFD Home", this._mfdPagesRight.mapSettings.element.mapSettings)),
                this._mfdPagesLeft.weatherSelection = new WT_G3x5_TSCPage("Weather Selection Left", "WeatherSelectionLeft", new WT_G3x5_TSCWeatherSelection("MFD", "MFD Home", "Weather Radar Settings Left")),
                this._mfdPagesRight.weatherSelection = new WT_G3x5_TSCPage("Weather Selection Right", "WeatherSelectionRight", new WT_G3x5_TSCWeatherSelection("MFD", "MFD Home", "Weather Radar Settings Right")),
                this._mfdPagesLeft.weatherRadar = new WT_G3x5_TSCPage("Weather Radar Settings Left", "WeatherRadarSettingsLeft", new WT_G3x5_TSCWeatherRadarSettings("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.LEFT)),
                this._mfdPagesRight.weatherRadar = new WT_G3x5_TSCPage("Weather Radar Settings Right", "WeatherRadarSettingsRight", new WT_G3x5_TSCWeatherRadarSettings("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.RIGHT)),
                this._commonPages.directTo = new WT_G3x5_TSCPage("Direct To", "DirectTo", new WT_G3x5_TSCDirectTo("MFD", "MFD Home")),
                this._commonPages.flightPlan = new WT_G3x5_TSCPage("Flight Plan", "FlightPlan", this._createFlightPlanPage("MFD Home", "MFD")),
                this._commonPages.procedures = new WT_G3x5_TSCPage("Procedures", "Procedures", new WT_G3x5_TSCProcedures("MFD", "MFD Home")),
                this._commonPages.departureSelection = new WT_G3x5_TSCPage("Departure Selection", "DepartureSelection", new WT_G3x5_TSCDepartureSelection("MFD", "MFD Home", this.instrumentIdentifier, this._navigraphNetworkAPI)),
                this._commonPages.arrivalSelection = new WT_G3x5_TSCPage("Arrival Selection", "ArrivalSelection", new WT_G3x5_TSCArrivalSelection("MFD", "MFD Home", this.instrumentIdentifier, this._navigraphNetworkAPI)),
                this._commonPages.approachSelection = new WT_G3x5_TSCPage("Approach Selection", "ApproachSelection", new WT_G3x5_TSCApproachSelection("MFD", "MFD Home", this.instrumentIdentifier, this._navigraphNetworkAPI)),
                this._commonPages.vnavProfile = new WT_G3x5_TSCPage("VNAV Profile", "VNAVProfile", new WT_G3x5_TSCVNAVProfile("MFD", "MFD Home")),
                new WT_G3x5_TSCPage("Waypoint Info Selection", "WaypointInfoSelection", new WT_G3x5_TSCWaypointInfoSelection("MFD", "MFD Home")),
                this._mfdPagesLeft.airportInfo = new WT_G3x5_TSCPage("Airport Info Left", "AirportInfoLeft", new WT_G3x5_TSCAirportInfo("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.LEFT, mfdLeftPaneSettings.display)),
                this._mfdPagesRight.airportInfo = new WT_G3x5_TSCPage("Airport Info Right", "AirportInfoRight", new WT_G3x5_TSCAirportInfo("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.RIGHT, mfdRightPaneSettings.display)),
                this._mfdPagesLeft.intInfo = new WT_G3x5_TSCPage("INT Info Left", "INTInfoLeft", new WT_G3x5_TSCINTInfo("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.LEFT, mfdLeftPaneSettings.display)),
                this._mfdPagesRight.intInfo = new WT_G3x5_TSCPage("INT Info Right", "INTInfoRight", new WT_G3x5_TSCINTInfo("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.RIGHT, mfdRightPaneSettings.display)),
                this._mfdPagesLeft.vorInfo = new WT_G3x5_TSCPage("VOR Info Left", "VORInfoLeft", new WT_G3x5_TSCVORInfo("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.LEFT, mfdLeftPaneSettings.display)),
                this._mfdPagesRight.vorInfo = new WT_G3x5_TSCPage("VOR Info Right", "VORInfoRight", new WT_G3x5_TSCVORInfo("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.RIGHT, mfdRightPaneSettings.display)),
                this._mfdPagesLeft.ndbInfo = new WT_G3x5_TSCPage("NDB Info Left", "NDBInfoLeft", new WT_G3x5_TSCNDBInfo("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.LEFT, mfdLeftPaneSettings.display)),
                this._mfdPagesRight.ndbInfo = new WT_G3x5_TSCPage("NDB Info Right", "NDBInfoRight", new WT_G3x5_TSCNDBInfo("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.RIGHT, mfdRightPaneSettings.display)),
                new WT_G3x5_TSCPage("Nearest Waypoint Selection", "NearestWaypointSelection", new WT_G3x5_TSCNearestWaypointSelection("MFD", "MFD Home")),
                this._mfdPagesLeft.nearestAirport = new WT_G3x5_TSCPage("Nearest Airport Left", "NearestAirportLeft", new WT_G3x5_TSCNearestAirport("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.LEFT, this._mfdPagesLeft, mfdLeftPaneSettings)),
                this._mfdPagesRight.nearestAirport = new WT_G3x5_TSCPage("Nearest Airport Right", "NearestAirportRight", new WT_G3x5_TSCNearestAirport("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.RIGHT, this._mfdPagesRight, mfdRightPaneSettings)),
                this._mfdPagesLeft.nearestINT = new WT_G3x5_TSCPage("Nearest INT Left", "NearestINTLeft", new WT_G3x5_TSCNearestINT("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.LEFT, this._mfdPagesLeft, mfdLeftPaneSettings)),
                this._mfdPagesRight.nearestINT = new WT_G3x5_TSCPage("Nearest INT Right", "NearestINTRight", new WT_G3x5_TSCNearestINT("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.RIGHT, this._mfdPagesRight, mfdRightPaneSettings)),
                this._mfdPagesLeft.nearestVOR = new WT_G3x5_TSCPage("Nearest VOR Left", "NearestVORLeft", new WT_G3x5_TSCNearestVOR("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.LEFT, this._mfdPagesLeft, mfdLeftPaneSettings)),
                this._mfdPagesRight.nearestVOR = new WT_G3x5_TSCPage("Nearest VOR Right", "NearestVORRight", new WT_G3x5_TSCNearestVOR("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.RIGHT, this._mfdPagesRight, mfdRightPaneSettings)),
                this._mfdPagesLeft.nearestNDB = new WT_G3x5_TSCPage("Nearest NDB Left", "NearestNDBLeft", new WT_G3x5_TSCNearestNDB("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.LEFT, this._mfdPagesLeft, mfdLeftPaneSettings)),
                this._mfdPagesRight.nearestNDB = new WT_G3x5_TSCPage("Nearest NDB Right", "NearestNDBRight", new WT_G3x5_TSCNearestNDB("MFD", "MFD Home", "MFD", WT_G3x5_MFDHalfPane.ID.RIGHT, this._mfdPagesRight, mfdRightPaneSettings)),
                new WT_G3x5_TSCPage("Speed Bugs", "SpeedBugs", this._speedBugs),
                this._mfdPagesLeft.charts = new WT_G3x5_TSCPage("Charts Left", "ChartsLeft", new WT_G3x5_TSCCharts("MFD", "MFD Home", WT_G3x5_MFDHalfPane.ID.LEFT, this._navigraphNetworkAPI, this.icaoWaypointFactory, mfdLeftPaneSettings)),
                this._mfdPagesRight.charts = new WT_G3x5_TSCPage("Charts Right", "ChartsRight", new WT_G3x5_TSCCharts("MFD", "MFD Home", WT_G3x5_MFDHalfPane.ID.RIGHT, this._navigraphNetworkAPI, this.icaoWaypointFactory, mfdRightPaneSettings)),
                this._mfdPagesLeft.chartsTouchControl = new WT_G3x5_TSCPage("Charts Touch Control Left", "ChartsTouchControlLeft", new WT_G3x5_TSCChartsTouchControl("MFD", "MFD Home", this._mfdPagesLeft.charts.element)),
                this._mfdPagesRight.chartsTouchControl = new WT_G3x5_TSCPage("Charts Touch Control Right", "ChartsTouchControlRight", new WT_G3x5_TSCChartsTouchControl("MFD", "MFD Home", this._mfdPagesRight.charts.element)),
                new WT_G3x5_TSCPage("Aircraft Systems", "AircraftSystems", this._createAircraftSystemsPage()),
                new WT_G3x5_TSCPage("Lighting Configuration", "LightingConfig", new AS3000_TSC_LightingConfig()),
                new WT_G3x5_TSCPage("Utilities", "Utilities", new AS3000_TSC_Utilities()),
                new WT_G3x5_TSCPage("Setup", "UtilitiesSetup", new WT_G3x5_TSCUtilitiesSetup("MFD", "MFD Home")),
                new WT_G3x5_TSCPage("Avionics Settings", "AvionicsSettings", new WT_G3x5_TSCAvionicsSettings("MFD", "MFD Home", "MFD")),
                new WT_G3x5_TSCPage("Database Status", "DatabaseStatus", new WT_G3x5_TSCDatabaseStatus("MFD", "MFD Home", this._navigraphNetworkAPI))
            ]),
            new WT_G3x5_TSCPageGroup("NavCom", this, [
                new WT_G3x5_TSCPage("NAV/COM Home", "NavComHome", new AS3000_TSC_NavComHome()),
            ]),
        ];
    }

    _createTransponderPopUp() {
    }

    _initPopUpWindows() {
        this.transponderWindow = new WT_G3x5_TSCElementContainer("Transponder", "TransponderWindow", this._createTransponderPopUp());
        this.transponderWindow.setGPS(this);
        this.audioRadioWindow = new WT_G3x5_TSCElementContainer("Audio & Radios", "AudioRadiosWindow", new AS3000_TSC_AudioRadios());
        this.audioRadioWindow.setGPS(this);
        this.frequencyKeyboard = new WT_G3x5_TSCElementContainer("Frequency Keyboard", "frequencyKeyboard", new AS3000_TSC_FrequencyKeyboard());
        this.frequencyKeyboard.setGPS(this);
        this.speedKeyboard = new WT_G3x5_TSCElementContainer("Speed Keyboard", "speedKeyboard", new AS3000_TSC_SpeedKeyboard());
        this.speedKeyboard.setGPS(this);
        this.insertBeforeWaypoint = new WT_G3x5_TSCElementContainer("Insert Before Waypoint", "insertBeforeWaypointWindow", new AS3000_TSC_InsertBeforeWaypoint());
        this.insertBeforeWaypoint.setGPS(this);
        this.minimumSource = new WT_G3x5_TSCElementContainer("Minimums Source", "minimumSource", new AS3000_TSC_MinimumSource());
        this.minimumSource.setGPS(this);
        this.loadFrequencyWindow = new WT_G3x5_TSCElementContainer("Frequency Window", "LoadFrequencyPopup", new WT_G3x5_TSCLoadFrequency());
        this.loadFrequencyWindow.setGPS(this);
        this.confirmationWindow = new AS3000_TSC_ConfirmationWindow();
        this.terrainAlerts = new AS3000_TSC_TerrainAlert();
        this.addIndependentElementContainer(new WT_G3x5_TSCElementContainer("Terrain Alert", "terrainAlert", this.terrainAlerts));
        this.addIndependentElementContainer(new WT_G3x5_TSCElementContainer("Confirmation Window", "ConfirmationWindow", this.confirmationWindow));

        this.confirmationTextPopUp = new WT_G3x5_TSCElementContainer("Confirmation Text", "ConfirmationText", new WT_G3x5_TSCConfirmationTextPopUp());
        this.confirmationTextPopUp.setGPS(this);

        this.selectionListWindow1 = new WT_G3x5_TSCElementContainer("Dynamic Selection List Window 1", "DynamicSelectionListWindow1", new WT_G3x5_TSCSelectionListWindow());
        this.selectionListWindow1.setGPS(this);
        this.selectionListWindow2 = new WT_G3x5_TSCElementContainer("Dynamic Selection List Window 2", "DynamicSelectionListWindow2", new WT_G3x5_TSCSelectionListWindow());
        this.selectionListWindow2.setGPS(this);

        this.numKeyboard = new WT_G3x5_TSCElementContainer("Numeric Keyboard", "NumKeyboard", new WT_G3x5_TSCNumericKeyboard());
        this.numKeyboard.setGPS(this);

        this.timeKeyboard = new WT_G3x5_TSCElementContainer("Time Keyboard", "TimeKeyboard", new WT_G3x5_TSCTimeKeyboard());
        this.timeKeyboard.setGPS(this);

        this.waypointKeyboard = new WT_G3x5_TSCElementContainer("Waypoint Keyboard", "WaypointKeyboard", new WT_G3x5_TSCWaypointKeyboard());
        this.waypointKeyboard.setGPS(this);

        this.vnavAltitudeKeyboard = new WT_G3x5_TSCElementContainer("VNAV Altitude Keyboard", "VNAVAltitudeKeyboard", new WT_G3x5_TSCVNAVAltitudeKeyboard());
        this.vnavAltitudeKeyboard.setGPS(this);

        this.duplicateWaypointSelection = new WT_G3x5_TSCElementContainer("Duplicate Waypoint Selection", "DuplicateWaypointSelection", new WT_G3x5_TSCDuplicateWaypointSelection());
        this.duplicateWaypointSelection.setGPS(this);

        this.mapDetailSelect = new WT_G3x5_TSCElementContainer("Map Detail Settings", "MapDetailSelect", new WT_G3x5_TSCMapDetailSelect());
        this.mapDetailSelect.setGPS(this);

        this.navMapTrafficMapSettings = new WT_G3x5_TSCElementContainer("Nav Map Traffic Map Settings", "NavMapTrafficMapSettings", new WT_G3x5_TSCNavMapTrafficMapSettings());
        this.navMapTrafficMapSettings.setGPS(this);

        this.chartsOptions = new WT_G3x5_TSCElementContainer("Charts Options", "ChartsOptions", new WT_G3x5_TSCChartsOptions());
        this.chartsOptions.setGPS(this);

        this.chartsLightThreshold = new WT_G3x5_TSCElementContainer("Charts Light Threshold", "ChartsLightThreshold", this._createChartsLightThresholdPopUp());
        this.chartsLightThreshold.setGPS(this);

        this.waypointOptions = new WT_G3x5_TSCElementContainer("Waypoint Options", "WaypointOptions", new WT_G3x5_TSCWaypointOptions());
        this.waypointOptions.setGPS(this);
    }

    _initNavButtons() {
        this.navButtons = [
            new AS3000_TSC_NavButton("NavBar_1", this),
            new AS3000_TSC_NavButton("NavBar_2", this),
            new AS3000_TSC_NavButton("NavBar_3", this),
            new AS3000_TSC_NavButton("NavBar_4", this),
            new AS3000_TSC_NavButton("NavBar_5", this),
            new AS3000_TSC_NavButton("NavBar_6", this)
        ];
    }

    _initMFDPaneControlID() {
        this._mfdPaneControlID = this.urlConfig.index === 1 ? WT_G3x5_PaneControlSetting.Touchscreen.LEFT : WT_G3x5_PaneControlSetting.Touchscreen.RIGHT;
    }

    _initMFDPaneSelectDisplay() {
        this._mfdPaneSelectDisplay = this.getChildById("Softkey_1_Container").querySelector(`tsc-mfdpaneselectdisplay`);
        this._mfdPaneSelectDisplay.selectColor = this.urlConfig.index === 1 ? WT_G3x5_MFDMainPane.LEFT_TSC_COLOR : WT_G3x5_MFDMainPane.RIGHT_TSC_COLOR;
    }

    connectedCallback() {
        super.connectedCallback();

        this._defineSoftKeys();
        this._defineLabelBar();
        this._initPages();
        this._initPopUpWindows();
        this._initNavButtons();

        this._initMFDPaneControlID();
        this._initMFDPaneSelectDisplay();
    }

    getSelectedMFDPanePages() {
        return this.getSelectedMFDPane() === WT_G3x5_MFDHalfPane.ID.LEFT ? this._mfdPagesLeft : this._mfdPagesRight;
    }

    parseXMLConfig() {
        super.parseXMLConfig();
        let pfdPrefix_elem = this.xmlConfig.getElementsByTagName("PFD");
        if (pfdPrefix_elem.length > 0) {
            this.pfdPrefix = pfdPrefix_elem[0].textContent;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    reboot() {
        super.reboot();
        if (this.terrainAlerts)
            this.terrainAlerts.reset();
    }

    _initPaneControlSettings() {
    }

    _initPaneControl() {
    }

    _initNearestAirportList() {
        this._nearestAirportList = new WT_G3x5_NearestAirportList(this.airplane, this.icaoWaypointFactory, this.icaoSearchers.airport);
        this._nearestAirportListUpdated = false;
    }

    _initNearestVORList() {
        this._nearestVORList = new WT_NearestWaypointList(this.airplane, this.icaoWaypointFactory.getVORs.bind(this.icaoWaypointFactory), this.icaoSearchers.vor);
        this._nearestVORList.searchLimit = 25;
        this._nearestVORListUpdated = false;
    }

    _initNearestNDBList() {
        this._nearestNDBList = new WT_NearestWaypointList(this.airplane, this.icaoWaypointFactory.getNDBs.bind(this.icaoWaypointFactory), this.icaoSearchers.ndb);
        this._nearestNDBList.searchLimit = 25;
        this._nearestNDBListUpdated = false;
    }

    _initNearestINTList() {
        this._nearestINTList = new WT_NearestWaypointList(this.airplane, this.icaoWaypointFactory.getINTs.bind(this.icaoWaypointFactory), this.icaoSearchers.int);
        this._nearestINTList.searchLimit = 25;
        this._nearestINTListUpdated = false;
    }

    _initNearestWaypoints() {
        this._initNearestAirportList();
        this._initNearestVORList();
        this._initNearestNDBList();
        this._initNearestINTList();
        this._lastNearestWaypointListUpdateTime = 0;
    }

    Init() {
        super.Init();

        this._initPaneControlSettings();
        this._initPaneControl();
        this._initNearestWaypoints();
    }

    _updatePageTitle() {
        let currentPage = this.getCurrentPage();
        let title = currentPage.title ? currentPage.title : currentPage.name;
        if (this.pageTitle.innerHTML != title) {
            this.pageTitle.innerHTML = title;
        }
    }

    _updateMFDPaneSelectDisplay() {
        let currentPage = this.getCurrentPage();
        if (this.getCurrentPageGroup().name === "MFD" && currentPage.title !== "Map Pointer Control" && currentPage.title !== WT_G3x5_TSCChartsTouchControl.TITLE) {
            if (this._mfdPaneSelectDisplay.style.display !== "block") {
                this._mfdPaneSelectDisplay.style.display = "block";
            }
            this._mfdPaneSelectDisplay.setPaneMode(this._mfdMainPaneSettings.mode.getValue());
            this._mfdPaneSelectDisplay.setSelected(this.getSelectedMFDPane());
        } else if (this._mfdPaneSelectDisplay.style.display !== "none") {
            this._mfdPaneSelectDisplay.style.display = "none";
        }
    }

    _updateSoftkeyLabels() {
        switch (this.getCurrentPageGroup().name) {
            case "PFD":
                Avionics.Utils.diffAndSetAttribute(this.pfdSoftkey, "state", "Selected");
                Avionics.Utils.diffAndSetAttribute(this.mfdSoftkey, "state", "");
                Avionics.Utils.diffAndSetAttribute(this.navcomSoftkey, "state", "");
                break;
            case "MFD":
                Avionics.Utils.diffAndSetAttribute(this.pfdSoftkey, "state", "");
                Avionics.Utils.diffAndSetAttribute(this.mfdSoftkey, "state", "Selected");
                Avionics.Utils.diffAndSetAttribute(this.navcomSoftkey, "state", "");
                break;
            case "NavCom":
                Avionics.Utils.diffAndSetAttribute(this.pfdSoftkey, "state", "");
                Avionics.Utils.diffAndSetAttribute(this.mfdSoftkey, "state", "");
                Avionics.Utils.diffAndSetAttribute(this.navcomSoftkey, "state", "Selected");
                break;
        }
    }

    _updateNearestWaypoints(currentTime) {
        // stagger updates for performance
        let delta = currentTime - this._lastNearestWaypointListUpdateTime;
        if ((delta >= AS3000_TSC.NEAREST_WAYPOINT_LIST_UPDATE_INTERVAL / 4 * 3) && !this._nearestAirportListUpdated) {
            this.nearestAirportList.update();
            this._nearestAirportListUpdated = true;
        }
        if ((delta >= AS3000_TSC.NEAREST_WAYPOINT_LIST_UPDATE_INTERVAL / 4 * 2) && !this._nearestVORListUpdated) {
            this.nearestVORList.update();
            this._nearestVORListUpdated = true;
        }
        if ((delta >= AS3000_TSC.NEAREST_WAYPOINT_LIST_UPDATE_INTERVAL / 4 * 1) && !this._nearestNDBListUpdated) {
            this.nearestNDBList.update();
            this._nearestNDBListUpdated = true;
        }
        if ((delta >= AS3000_TSC.NEAREST_WAYPOINT_LIST_UPDATE_INTERVAL / 4 * 0) && !this._nearestINTListUpdated) {
            this.nearestINTList.update();
            this._nearestINTListUpdated = true;
        }

        if (currentTime - this._lastNearestWaypointListUpdateTime >= AS3000_TSC.NEAREST_WAYPOINT_LIST_UPDATE_INTERVAL) {
            this._lastNearestWaypointListUpdateTime = currentTime;
            this._nearestAirportListUpdated = false;
            this._nearestVORListUpdated = false;
            this._nearestNDBListUpdated = false;
            this._nearestINTListUpdated = false;
        }
    }

    _doUpdates(currentTime) {
        super._doUpdates(currentTime);

        this._updatePageTitle();
        this._updateSoftkeyLabels();
        this._updateMFDPaneSelectDisplay();
        this._updateNearestWaypoints(currentTime);
    }

    _onMFDMainPaneModeChanged(setting, newValue, oldValue) {
        if (newValue === WT_G3x5_MFDMainPaneModeSetting.Mode.FULL) {
            this._setSelectedMFDHalfPane(WT_G3x5_MFDHalfPane.ID.LEFT);
        } else {
            let defaultControl = this._mfdPaneControlID === WT_G3x5_PaneControlSetting.Touchscreen.LEFT ? WT_G3x5_MFDHalfPane.ID.LEFT : WT_G3x5_MFDHalfPane.ID.RIGHT;
            this._setSelectedMFDHalfPane(defaultControl);
        }
    }

    _onMFDPaneNavMapDisplaySwitch(currentPageGroup, currentPage) {
        if (currentPageGroup.name === "MFD" && (currentPage.title === "Map Settings" || currentPage.title === "Map Pointer Control" || currentPage.element instanceof WT_G3x5_TSCNavMapTrafficSettings)) {
            this.closePopUpElement();
            this.SwitchToPageName("MFD", "MFD Home");
        }
    }

    _onMFDPaneTrafficDisplaySwitch(currentPageGroup, currentPage) {
        if (currentPageGroup.name === "MFD" && currentPage.element instanceof WT_G3x5_TSCTrafficMapSettings) {
            this.closePopUpElement();
            this.SwitchToPageName("MFD", "MFD Home");
        }
    }

    _onMFDPaneWeatherDisplaySwitch(currentPageGroup, currentPage) {
        if (currentPageGroup.name === "MFD" && (currentPage.title === "Weather Selection" || currentPage.title === "Weather Radar Settings")) {
            this.closePopUpElement();
            this.SwitchToPageName("MFD", "MFD Home");
        }
    }

    _onMFDPaneChartsDisplaySwitch(currentPageGroup, currentPage) {
        if (currentPageGroup.name === "MFD" && (currentPage.title === WT_G3x5_TSCCharts.TITLE || currentPage.title === WT_G3x5_TSCChartsTouchControl.TITLE)) {
            this.closePopUpElement();
            this.SwitchToPageName("MFD", "MFD Home");
        }
    }

    _onMFDPaneFlightPlanDisplaySwitch(currentPageGroup, currentPage) {
        if (currentPageGroup.name === "MFD" && (currentPage.title === "Map Pointer Control")) {
            this.closePopUpElement();
            this.SwitchToPageName("MFD", "MFD Home");
        }
    }

    _onMFDPaneProcedureDisplaySwitch(currentPageGroup, currentPage) {
        if (currentPageGroup.name === "MFD" && (currentPage.title === "Map Pointer Control")) {
            this.closePopUpElement();
            this.SwitchToPageName("MFD", "MFD Home");
        }
    }

    _onMFDHalfPaneDisplayChanged(setting, newValue, oldValue) {
        if (!this._isChangingPages && setting === this.getSelectedPaneSettings().display) {
            let currentPageGroup = this.getCurrentPageGroup();
            let currentPage = this.getCurrentPage();
            switch (oldValue) {
                case WT_G3x5_PaneDisplaySetting.Mode.NAVMAP:
                    this._onMFDPaneNavMapDisplaySwitch(currentPageGroup, currentPage);
                    break;
                case WT_G3x5_PaneDisplaySetting.Mode.TRAFFIC:
                    this._onMFDPaneTrafficDisplaySwitch(currentPageGroup, currentPage);
                    break;
                case WT_G3x5_PaneDisplaySetting.Mode.WEATHER:
                    this._onMFDPaneWeatherDisplaySwitch(currentPageGroup, currentPage);
                    break;
                case WT_G3x5_PaneDisplaySetting.Mode.CHARTS:
                    this._onMFDPaneChartsDisplaySwitch(currentPageGroup, currentPage);
                    break;
                case WT_G3x5_PaneDisplaySetting.Mode.FLIGHT_PLAN:
                    this._onMFDPaneFlightPlanDisplaySwitch(currentPageGroup, currentPage);
                    break;
                case WT_G3x5_PaneDisplaySetting.Mode.PROCEDURE:
                    this._onMFDPaneProcedureDisplaySwitch(currentPageGroup, currentPage);
                    break;
            }
        }
    }

    _handleNavigationEvent(event) {
        switch (event) {
            case "SoftKey_1":
                this.SwitchToPageName("PFD", "PFD Home");
                this.closePopUpElement();
                this.history = [];
                break;
            case "SoftKey_2":
                this.SwitchToPageName("MFD", "MFD Home");
                this.closePopUpElement();
                this.history = [];
                break;
            case "SoftKey_3":
                this.SwitchToMenuName("NavCom");
                this.closePopUpElement();
                this.history = [];
                break;
        }
    }

    _changePFDTrafficMapRange(delta) {
        let settingModelID = WT_G3x5_TrafficMap.SETTING_MODEL_ID;
        let key = WT_G3x5_TrafficMapRangeSetting.KEY_DEFAULT;
        let currentIndex = WT_MapSettingModel.getSettingValue(settingModelID, key);
        let newIndex = Math.max(Math.min(currentIndex + delta, WT_G3x5_TrafficMap.MAP_RANGE_LEVELS.length - 1), 0);
        WT_MapSettingModel.setSettingValue(settingModelID, key, newIndex, true);
    }

    _handleZoomEventPFD(event) {
        if (this._pfdMapSettings.element.insetMapShowSetting.getValue()) {
            switch (event) {
                case "BottomKnob_Small_INC":
                    this._pfdMapSettings.element.mapSettings.rangeSetting.changeRange(1);
                    break;
                case "BottomKnob_Small_DEC":
                    this._pfdMapSettings.element.mapSettings.rangeSetting.changeRange(-1);
                    break;
            }
        } else if (WT_DataStoreSettingModel.getSettingValue("PFD", WT_G3x5_PFDTrafficInsetMapShowSetting.KEY, false)) {
            switch (event) {
                case "BottomKnob_Small_INC":
                    this._changePFDTrafficMapRange(1);
                    break;
                case "BottomKnob_Small_DEC":
                    this._changePFDTrafficMapRange(-1);
                    break;
            }
        }
    }

    /**
     *
     * @param {String} suffix
     * @param {Number} maxIndex
     * @param {Number} deltaIndex
     * @param {Boolean} isSyncable
     */
    _changeMapRange(suffix, maxIndex, deltaIndex, isSyncable) {
        let id = `MFD-${this.getSelectedMFDPane()}_${suffix}`;
        let currentIndex = WT_MapSettingModel.getSettingValue(id, WT_MapRangeSetting.KEY_DEFAULT, 0);
        let toIndex = Math.max(0, Math.min(maxIndex, currentIndex + deltaIndex));
        WT_MapSettingModel.setSettingValue(id, WT_MapRangeSetting.KEY_DEFAULT, toIndex, isSyncable);
    }

    _handleZoomEventMFD(event) {
        switch (this.getSelectedPaneSettings().display.mode) {
            case WT_G3x5_PaneDisplaySetting.Mode.NAVMAP:
                switch (event) {
                    case "BottomKnob_Small_INC":
                        this.getSelectedMFDPanePages().mapSettings.element.mapSettings.rangeSetting.changeRange(1);
                        break;
                    case "BottomKnob_Small_DEC":
                        this.getSelectedMFDPanePages().mapSettings.element.mapSettings.rangeSetting.changeRange(-1);
                        break;
                }
                break;
            case WT_G3x5_PaneDisplaySetting.Mode.TRAFFIC:
                switch (event) {
                    case "BottomKnob_Small_INC":
                        this.getSelectedMFDPanePages().trafficMap.element.changeRange(1);
                        break;
                    case "BottomKnob_Small_DEC":
                        this.getSelectedMFDPanePages().trafficMap.element.changeRange(-1);
                        break;
                }
                break;
            case WT_G3x5_PaneDisplaySetting.Mode.WEATHER:
                switch (event) {
                    case "BottomKnob_Small_INC":
                        this.getSelectedMFDPanePages().weatherRadar.element.changeRange(1);
                        break;
                    case "BottomKnob_Small_DEC":
                        this.getSelectedMFDPanePages().weatherRadar.element.changeRange(-1);
                        break;
                }
                break;
            case WT_G3x5_PaneDisplaySetting.Mode.CHARTS:
                switch (event) {
                    case "BottomKnob_Small_INC":
                        this.getSelectedMFDPanePages().charts.element.changeZoom(-1);
                        break;
                    case "BottomKnob_Small_DEC":
                        this.getSelectedMFDPanePages().charts.element.changeZoom(1);
                        break;
                }
                break;
            case WT_G3x5_PaneDisplaySetting.Mode.FLIGHT_PLAN:
                switch (event) {
                    case "BottomKnob_Small_INC":
                        this._changeMapRange(WT_G3x5_FlightPlanDisplayPane.MAP_ID_SUFFIX, WT_G3x5_FlightPlanPreviewSettings.MAP_RANGE_LEVELS.length - 1, 1, false);
                        break;
                    case "BottomKnob_Small_DEC":
                        this._changeMapRange(WT_G3x5_FlightPlanDisplayPane.MAP_ID_SUFFIX, WT_G3x5_FlightPlanPreviewSettings.MAP_RANGE_LEVELS.length - 1, -1, false);
                        break;
                }
                break;
            case WT_G3x5_PaneDisplaySetting.Mode.PROCEDURE:
                switch (event) {
                    case "BottomKnob_Small_INC":
                        this._changeMapRange(WT_G3x5_ProcedureDisplayPane.MAP_ID_SUFFIX, WT_G3x5_FlightPlanPreviewSettings.MAP_RANGE_LEVELS.length - 1, 1, false);
                        break;
                    case "BottomKnob_Small_DEC":
                        this._changeMapRange(WT_G3x5_ProcedureDisplayPane.MAP_ID_SUFFIX, WT_G3x5_FlightPlanPreviewSettings.MAP_RANGE_LEVELS.length - 1, -1, false);
                        break;
                }
                break;
        }
    }

    _handleZoomEvent(event) {
        if (this.getCurrentPageGroup().name === "PFD") {
            this._handleZoomEventPFD(event);
        } else if (this.getCurrentPageGroup().name === "MFD") {
            this._handleZoomEventMFD(event);
        }
    }

    _setSelectedMFDHalfPane(pane) {
        if (this._selectedMfdPane === pane || this._mfdPaneControlID === undefined) {
            return;
        }

        let oldPane = this._selectedMfdPane;
        this._selectedMfdPane = pane;
        let oldPaneSettings = oldPane ? this.getPaneSettings(`MFD-${oldPane}`) : null;
        let newPaneSettings = this.getPaneSettings(`MFD-${pane}`);
        if (oldPaneSettings) {
            oldPaneSettings.control.removeControl(this._mfdPaneControlID);
        }
        newPaneSettings.control.addControl(this._mfdPaneControlID);
        if (this.getCurrentPageGroup().name === "MFD") {
            this.closePopUpElement();
            this.SwitchToPageName("MFD", "MFD Home");
        }
    }

    _switchMFDHalfPaneControl() {
        switch (this._selectedMfdPane) {
            case WT_G3x5_MFDHalfPane.ID.LEFT:
                this._setSelectedMFDHalfPane(WT_G3x5_MFDHalfPane.ID.RIGHT);
                break;
            case WT_G3x5_MFDHalfPane.ID.RIGHT:
                this._setSelectedMFDHalfPane(WT_G3x5_MFDHalfPane.ID.LEFT);
                break;
        }
    }

    _handleControlEvent(event) {
        if (this.getCurrentPageGroup().name === "MFD" && this.mfdMainPaneSettings.mode.getValue() === WT_G3x5_MFDMainPaneModeSetting.Mode.HALF && this.getCurrentPage().title !== "Map Pointer Control") {
            switch (event) {
                case "TopKnob_Small_INC":
                case "TopKnob_Small_DEC":
                    this._switchMFDHalfPaneControl();
                    break;
            }
        }
    }

    _handleMapPointerControlNavigationEvent(event) {
        if (this.getCurrentPage().title === "Map Pointer Control") {
            this.goBack();
        } else if (this.getCurrentPageGroup().name === "MFD") {
            let displayMode = this.getSelectedPaneSettings().display.mode;
            switch (displayMode) {
                case WT_G3x5_PaneDisplaySetting.Mode.NAVMAP:
                case WT_G3x5_PaneDisplaySetting.Mode.FLIGHT_PLAN:
                case WT_G3x5_PaneDisplaySetting.Mode.PROCEDURE:
                    this.closePopUpElement();
                    let controlPage = this.getSelectedMFDPanePages().mapPointerControl;
                    controlPage.element.setControlledPane(displayMode);
                    this.SwitchToPageName("MFD", controlPage.name);
                    break;
            }
        }
    }

    _handleChartsTouchControlNavigationEvent(event) {
        if (this.getCurrentPage().title === WT_G3x5_TSCChartsTouchControl.TITLE) {
            this.goBack();
        } else if (this.getCurrentPageGroup().name === "MFD" && this.getSelectedPaneSettings().display.mode === WT_G3x5_PaneDisplaySetting.Mode.CHARTS) {
            this.closePopUpElement();
            this.SwitchToPageName("MFD", this.getSelectedMFDPanePages().chartsTouchControl.name);
        }
    }

    _handleBottomKnobPushEvent(event) {
        if (event === "BottomKnob_Push") {
            this._handleMapPointerControlNavigationEvent(event);
            this._handleChartsTouchControlNavigationEvent(event);
        }
    }

    onEvent(event) {
        super.onEvent(event);

        this._handleNavigationEvent(event);
        this._handleZoomEvent(event);
        this._handleControlEvent(event);
        this._handleBottomKnobPushEvent(event);
    }

    goBack() {
        if (this.history.length === 0) {
            return;
        }

        let last = this.history.pop();
        if (this.popUpElement) {
            this.closePopUpElement(true);
        } else if (!last.popUpPage) {
            this.SwitchToPageName(last.menuName, last.pageName, true);
        }

        if (last.popUpPage) {
            this.switchToPopUpPage(last.popUpPage, true);
        }
    }

    getFullKeyboard() {
        return this.fullKeyboard;
    }

    activateNavButton(_id, _title, _callback, _fromPopUp = false, _imagePath = "defaultImage.png") {
        let data = new AS3000_TSC_NavButton_Data();
        data.title = _title;
        data.callback = _callback;
        data.imagePath = "/WTg3000/SDK/Assets/Images/Garmin/TSC/" + _imagePath;
        data.isActive = true;
        this.navButtons[_id - 1].setState(data, _fromPopUp);
    }

    deactivateNavButton(_id, _fromPopUp = false) {
        this.navButtons[_id - 1].deactivate(_fromPopUp);
    }

    setTopKnobText(_text, _fromPopUp = false) {
        if (!_fromPopUp) {
            this.topKnobText_Save = _text;
        }
        if (this.topKnobText.innerHTML != _text) {
            this.topKnobText.innerHTML = _text;
        }
    }

    setBottomKnobText(_text, _fromPopUp = false) {
        if (!_fromPopUp) {
            this.bottomKnobText_Save = _text;
        }
        if (this.bottomKnobText.innerHTML != _text) {
            this.bottomKnobText.innerHTML = _text;
        }
    }

    rollBackKnobTexts() {
        this.topKnobText.innerHTML = this.topKnobText_Save;
        this.bottomKnobText.innerHTML = this.bottomKnobText_Save;
    }

    closePopUpElement(skipHistory = false) {
        if (!this.popUpElement) {
            return;
        }

        this._lastFocus.popUp = this.popUpElement;
        this._lastFocus.page = this.getCurrentPage();

        if (!skipHistory) {
            let historyPoint = new AS3000_TSC_PageInfos();
            historyPoint.popUpPage = this.popUpElement;
            this.history.push(historyPoint);
        }

        super.closePopUpElement();
        this.rollBackKnobTexts();

        let page = this.getCurrentPage();
        if (page) {
            page.onFocusGained();
        }
    }

    SwitchToPageName(menu, page, skipHistory = false) {
        this._isChangingPages = true;

        this._lastFocus.popUp = this.popUpElement;
        this._lastFocus.page = this.getCurrentPage();

        if (!skipHistory) {
            let historyPoint = new AS3000_TSC_PageInfos();
            if (!this.popUpElement) {
                historyPoint.menuName = this.getCurrentPageGroup().name;
                historyPoint.pageName = this.getCurrentPage().name;
            }
            this.history.push(historyPoint);
        }
        super.SwitchToPageName(menu, page);
        let newPage = this.getCurrentPage();
        if (newPage) {
            newPage.onEnter();
        }

        this._isChangingPages = false;
    }

    switchToPopUpPage(pageContainer, skipHistory = false) {
        this._isChangingPages = true;

        this._lastFocus.popUp = this.popUpElement;
        this._lastFocus.page = this.getCurrentPage();

        let historyPoint;
        if (!skipHistory) {
            historyPoint = new AS3000_TSC_PageInfos();
            historyPoint.popUpPage = this.popUpElement;
            historyPoint.menuName = this.getCurrentPageGroup().name;
            historyPoint.pageName = this.getCurrentPage().name;
        }
        if (!this.popUpElement) {
            let page = this.getCurrentPage();
            if (page) {
                page.onFocusLost();
            }
        }
        if (historyPoint) {
            this.history.push(historyPoint);
        }
        super.switchToPopUpPage(pageContainer);

        this._isChangingPages = false;
    }

    openConfirmationWindow(_text, _button) {
        this.confirmationWindow.open(_text, _button);
    }

    clearPageHistory() {
        this.history = [];
    }
}
AS3000_TSC.LIGHTING_CONTROL_ALLOWED_AIRCRAFT = new Set([
    "TT:ATCCOM.AC_MODEL_TBM9.0.text"
]);
AS3000_TSC.NEAREST_WAYPOINT_LIST_UPDATE_INTERVAL = 5000;

class AS3000_TSC_PageInfos {
}
class AS3000_TSC_PFDHome extends NavSystemElement {
    constructor() {
        super();

        this._initTrafficInsetMapSettingModel();
    }

    _initTrafficInsetMapSettingModel() {
        this._trafficInsetMapSettingModel = new WT_DataStoreSettingModel("PFD");
        this._trafficInsetMapSettingModel.addSetting(this._trafficInsetMapShowSetting = new WT_G3x5_PFDTrafficInsetMapShowSetting(this._trafficInsetMapSettingModel));
    }

    /**
     * @readonly
     * @type {AS3000_TSC}
     */
    get instrument() {
        return this.gps;
    }

    _defineTrafficMapButton(root) {
        let trafficMapButton = root.querySelector(`#TrafficMapButton`);
        if (trafficMapButton instanceof WT_TSCStatusBarImageButton) {
            this._trafficMapButton = trafficMapButton;
            return true;
        } else {
            return false;
        }
    }

    async _defineChildren(root) {
        this.NavSourceButton = this.gps.getChildById("NavSourceButton");
        this.NavSourceButton_Value = this.NavSourceButton.getElementsByClassName("lowerValue")[0];
        this.OBSButton = this.gps.getChildById("OBSButton");
        this.CASUpButton = this.gps.getChildById("CASUpButton");
        this.Bearing1Button = this.gps.getChildById("Bearing1Button");
        this.Bearing1Button_Value = this.Bearing1Button.getElementsByClassName("lowerValue")[0];
        this.Bearing2Button = this.gps.getChildById("Bearing2Button");
        this.Bearing2Button_Value = this.Bearing2Button.getElementsByClassName("lowerValue")[0];
        this.CASDownButton = this.gps.getChildById("CASDownButton");
        this.SpeedBugsButton = this.gps.getChildById("SpeedBugsButton_PFD");
        this.TimersButton = this.gps.getChildById("TimersButton");
        this.MinimumsButton = this.gps.getChildById("MinimumsButton");
        this.PFDMapSettingsButton = this.gps.getChildById("PFDMapSettingsButton");
        this.SensorsButton = this.gps.getChildById("SensorsButton");
        this.PFDSettingsButton = this.gps.getChildById("PFDSettingsButton");

        await WT_Wait.awaitCallback(this._defineTrafficMapButton.bind(this, root));
    }

    _initButtonListeners() {
        this.gps.makeButton(this.NavSourceButton, this.sendMouseEvent.bind(this.gps, this.gps.pfdPrefix + "_NavSourceSwitch"));
        this.gps.makeButton(this.Bearing1Button, this.sendMouseEvent.bind(this.gps, this.gps.pfdPrefix + "_BRG1Switch"));
        this.gps.makeButton(this.Bearing2Button, this.sendMouseEvent.bind(this.gps, this.gps.pfdPrefix + "_BRG2Switch"));
        this.gps.makeButton(this.SpeedBugsButton, this.gps.SwitchToPageName.bind(this.gps, "PFD", "Speed Bugs"));
        this.gps.makeButton(this.TimersButton, this.gps.SwitchToPageName.bind(this.gps, "PFD", "Timers"));
        this.gps.makeButton(this.MinimumsButton, this.gps.SwitchToPageName.bind(this.gps, "PFD", "Minimums"));
        this.gps.makeButton(this.PFDMapSettingsButton, this.gps.SwitchToPageName.bind(this.gps, "PFD", "PFD Map Settings"));
        this.gps.makeButton(this.PFDSettingsButton, this.gps.SwitchToPageName.bind(this.gps, "PFD", "PFD Settings"));
    }

    _initButtonManagers() {
        this._trafficMapButtonManager = new WT_TSCSettingStatusBarButtonManager(this._trafficMapButton, this._trafficInsetMapShowSetting);
        this._trafficMapButtonManager.init();
    }

    async _initHelper(root) {
        await this._defineChildren(root);
        this._initButtonListeners();
        this._initButtonManagers();
    }

    init(root) {
        this._initHelper(root);
    }

    onFocusGained() {
        this.gps.setTopKnobText("");
        this.gps.setBottomKnobText("-Range+");
    }

    onFocusLost() {
    }

    _clearPageHistory() {
        this.instrument.clearPageHistory();
    }

    onEnter() {
        this._clearPageHistory();
    }

    onUpdate(_deltaTime) {
        if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
            Avionics.Utils.diffAndSet(this.NavSourceButton_Value, "FMS");
        }
        else {
            if (SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "number") == 1) {
                Avionics.Utils.diffAndSet(this.NavSourceButton_Value, "NAV1");
            }
            else {
                Avionics.Utils.diffAndSet(this.NavSourceButton_Value, "NAV2");
            }
        }
        let brg1Src = SimVar.GetSimVarValue("L:PFD_BRG1_Source", "number");
        switch (brg1Src) {
            case 0:
                Avionics.Utils.diffAndSet(this.Bearing1Button_Value, "OFF");
                break;
            case 1:
                Avionics.Utils.diffAndSet(this.Bearing1Button_Value, "NAV1");
                break;
            case 2:
                Avionics.Utils.diffAndSet(this.Bearing1Button_Value, "NAV2");
                break;
            case 3:
                Avionics.Utils.diffAndSet(this.Bearing1Button_Value, "GPS");
                break;
            case 4:
                Avionics.Utils.diffAndSet(this.Bearing1Button_Value, "ADF");
                break;
        }
        let brg2Src = SimVar.GetSimVarValue("L:PFD_BRG2_Source", "number");
        switch (brg2Src) {
            case 0:
                Avionics.Utils.diffAndSet(this.Bearing2Button_Value, "OFF");
                break;
            case 1:
                Avionics.Utils.diffAndSet(this.Bearing2Button_Value, "NAV1");
                break;
            case 2:
                Avionics.Utils.diffAndSet(this.Bearing2Button_Value, "NAV2");
                break;
            case 3:
                Avionics.Utils.diffAndSet(this.Bearing2Button_Value, "GPS");
                break;
            case 4:
                Avionics.Utils.diffAndSet(this.Bearing2Button_Value, "ADF");
                break;
        }
    }

    onExit() {
    }

    onEvent(_event) {
    }

    sendMouseEvent(_event) {
        LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", _event);
    }
}
class AS3000_TSC_MFDHome extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.lastMode = 0;
    }

    /**
     * @readonly
     * @type {AS3000_TSC}
     */
    get instrument() {
        return this.gps;
    }

    _initPaneSettingListeners() {
        this.instrument.mfdMainPaneSettings.mode.addListener(this._onMainPaneModeChanged.bind(this));
        this.instrument.allPaneSettings.forEach(paneSettings => paneSettings.control.addListener(this._onPaneControlChanged.bind(this)), this);
        this.instrument.allPaneSettings.forEach(paneSettings => paneSettings.display.addListener(this._onPaneDisplayChanged.bind(this)), this);
    }

    init(root) {
        this._mapButton = this.gps.getChildById("MapButton");
        this._mapButtonTitle = this._mapButton.getElementsByClassName("label")[0];
        this._trafficButton = this.gps.getChildById("TrafficButton");
        this._trafficButtonTitle = this._trafficButton.getElementsByClassName("label")[0];
        this._weatherButton = this.gps.getChildById("WeatherButton");
        this._weatherButtonTitle = this._weatherButton.getElementsByClassName("label")[0];
        this.directToButton = this.gps.getChildById("DirectToButton");
        this.FlightPlanButton = this.gps.getChildById("FlightPlanButton");
        this.procButton = this.gps.getChildById("ProcButton");
        this._chartsButton = this.gps.getChildById("ChartsButton");
        this.NearestButton = this.gps.getChildById("NearestButton");
        this.speedBugsButton = this.gps.getChildById("SpeedBugsButton_MFD");
        this.WaypointsInfoButton = this.gps.getChildById("WaypointInfoButton");
        this.aircraftSystemsButton = this.gps.getChildById("AircraftSystemsButton");
        this.utilitiesButton = this.gps.getChildById("UtilitiesButton");
        this.gps.makeButton(this._mapButton, this._onMapButtonPressed.bind(this));
        this.gps.makeButton(this._trafficButton, this._onTrafficButtonPressed.bind(this));
        this.gps.makeButton(this._weatherButton, this._onWeatherButtonPressed.bind(this));
        this.gps.makeButton(this.directToButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Direct To"));
        this.gps.makeButton(this.FlightPlanButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Flight Plan"));
        this.gps.makeButton(this.procButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Procedures"));
        this.gps.makeButton(this._chartsButton, this._onChartsButtonPressed.bind(this));
        this.gps.makeButton(this.NearestButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Nearest Waypoint Selection"));
        this.gps.makeButton(this.speedBugsButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Speed Bugs"));
        this.gps.makeButton(this.WaypointsInfoButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Waypoint Info Selection"));
        this.gps.makeButton(this.aircraftSystemsButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Aircraft Systems"));
        this.gps.makeButton(this.utilitiesButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Utilities"));

        this._initPaneSettingListeners();

        this._updatePaneDisplayButtons();
    }

    _openMapSettingsPage() {
        this.instrument.SwitchToPageName("MFD", this.instrument.getSelectedMFDPanePages().mapSettings.name);
    }

    _openWeatherSelectPage() {
        this.instrument.SwitchToPageName("MFD", this.instrument.getSelectedMFDPanePages().weatherSelection.name);
    }

    _openTrafficSettingsPage() {
        this.instrument.SwitchToPageName("MFD", this.instrument.getSelectedMFDPanePages().trafficMap.name);
    }

    _onMapButtonPressed() {
        let settings = this.instrument.getSelectedPaneSettings();
        if (settings.display.mode === WT_G3x5_PaneDisplaySetting.Mode.NAVMAP) {
            this._openMapSettingsPage();
        } else {
            settings.display.setValue(WT_G3x5_PaneDisplaySetting.Mode.NAVMAP);
        }
    }

    _onTrafficButtonPressed() {
        let settings = this.instrument.getSelectedPaneSettings();
        if (settings.display.mode === WT_G3x5_PaneDisplaySetting.Mode.TRAFFIC) {
            this._openTrafficSettingsPage();
        } else {
            settings.display.setValue(WT_G3x5_PaneDisplaySetting.Mode.TRAFFIC);
        }
    }

    _onWeatherButtonPressed() {
        let settings = this.instrument.getSelectedPaneSettings();
        if (settings.display.mode === WT_G3x5_PaneDisplaySetting.Mode.WEATHER) {
            this._openWeatherSelectPage();
        } else {
            settings.display.setValue(WT_G3x5_PaneDisplaySetting.Mode.WEATHER);
        }
    }

    _onChartsButtonPressed() {
        this.instrument.SwitchToPageName("MFD", this.instrument.getSelectedMFDPanePages().charts.name);
    }

    _updatePaneDisplayButtons() {
        let display = this.instrument.getSelectedPaneSettings().display.mode;
        switch (display) {
            case WT_G3x5_PaneDisplaySetting.Mode.NAVMAP:
                this._mapButton.setAttribute("state", "Active");
                this._mapButtonTitle.textContent = "Map Settings";
                this._trafficButton.setAttribute("state", "");
                this._trafficButtonTitle.textContent = "Traffic";
                this._weatherButton.setAttribute("state", "");
                this._weatherButtonTitle.textContent = "Weather";
                break;
            case WT_G3x5_PaneDisplaySetting.Mode.TRAFFIC:
                this._mapButton.setAttribute("state", "");
                this._mapButtonTitle.textContent = "Map";
                this._trafficButton.setAttribute("state", "Active");
                this._trafficButtonTitle.textContent = "Traffic Settings";
                this._weatherButton.setAttribute("state", "");
                this._weatherButtonTitle.textContent = "Weather";
                break;
            case WT_G3x5_PaneDisplaySetting.Mode.WEATHER:
                this._mapButton.setAttribute("state", "");
                this._mapButtonTitle.textContent = "Map";
                this._trafficButton.setAttribute("state", "");
                this._trafficButtonTitle.textContent = "Traffic";
                this._weatherButton.setAttribute("state", "Active");
                this._weatherButtonTitle.textContent = "Weather Selection";
                break;
            default:
                this._mapButton.setAttribute("state", "");
                this._mapButtonTitle.textContent = "Map";
                this._trafficButton.setAttribute("state", "");
                this._trafficButtonTitle.textContent = "Traffic";
                this._weatherButton.setAttribute("state", "");
                this._weatherButtonTitle.textContent = "Weather";
        }
    }

    _onPaneControlChanged(setting, newValue, oldValue) {
        if (this.instrument.mfdPaneControlID !== undefined && ((newValue & this.instrument.mfdPaneControlID) !== (oldValue & this.instrument.mfdPaneControlID))) {
            this._updatePaneDisplayButtons();
        }
    }

    _onPaneDisplayChanged(setting, newValue, oldValue) {
        if (setting === this.instrument.getSelectedPaneSettings().display) {
            this._updatePaneDisplayButtons();
        }
    }

    _onMainPaneModeChanged(setting, newValue, oldValue) {
        if (this.instrument && this.instrument.getCurrentPage().name === "MFD Home") {
            this._updateNavButtons();
            this._updatePaneDisplayButtons();
        }
    }

    _setMainPaneMode(mode) {
        this.instrument.mfdMainPaneSettings.mode.setValue(mode);
    }

    _updateNavButtons() {
        if (this.instrument.mfdMainPaneSettings.mode.getValue() === WT_G3x5_MFDMainPaneModeSetting.Mode.FULL) {
            this.instrument.activateNavButton(4, "Half", this._setMainPaneMode.bind(this, WT_G3x5_MFDMainPaneModeSetting.Mode.HALF), false, "ICON_TSC_BUTTONBAR_HALF_SMALL.png");
        } else {
            this.instrument.activateNavButton(4, "Full", this._setMainPaneMode.bind(this, WT_G3x5_MFDMainPaneModeSetting.Mode.FULL), false, "ICON_TSC_BUTTONBAR_FULL_SMALL.png");
        }
    }

    _activateLabelBar() {
        this.instrument.setTopKnobText("");
        this.instrument.setBottomKnobText("-Range+ Push: Pan");
    }

    _deactivateNavButtons() {
        this.instrument.deactivateNavButton(4);
    }

    onFocusGained() {
        this._activateLabelBar();
        this._updateNavButtons();
    }

    onFocusLost() {
        this._deactivateNavButtons();
    }

    _clearPageHistory() {
        this.instrument.clearPageHistory();
    }

    onEnter() {
        this._clearPageHistory();
    }

    onUpdate(_deltaTime) {
        let mapMode = SimVar.GetSimVarValue("L:AS3000_MFD_Current_Map", "number");
        if (mapMode != this.lastMode) {
            this.updateMapButtons();
            this.lastMode = mapMode;
        }
    }

    onExit() {
    }

    onEvent(_event) {
    }
}

class AS3000_TSC_WeatherSelection extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.lastMode = 0;
    }
    init(root) {
        this.nexradButton = this.gps.getChildById("NexradButton");
        this.wxRadarButton = this.gps.getChildById("WxRadarButton");
        this.wxRadarVertButton = this.gps.getChildById("WxRadarVertButton");
        this.nexradButton_text = this.nexradButton.getElementsByClassName("title")[0];
        this.wxRadarButton_text = this.wxRadarButton.getElementsByClassName("title")[0];
        this.wxRadarVertButton_text = this.wxRadarVertButton.getElementsByClassName("title")[0];
        this.updateWeatherMapButtons();
        this.gps.makeButton(this.nexradButton, this.weatherMapSwitch.bind(this, 0));
        if (this.gps.hasWeatherRadar()) {
            this.gps.makeButton(this.wxRadarButton, this.weatherMapSwitch.bind(this, 1));
            this.gps.makeButton(this.wxRadarVertButton, this.weatherMapSwitch.bind(this, 2));
        }
    }
    onEnter() {
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "ICON_TSC_BUTTONBAR_BACK.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "ICON_TSC_BUTTONBAR_HOME.png");
    }
    onUpdate(_deltaTime) {
        let weatherMapMode = SimVar.GetSimVarValue("L:AS3000_MFD_Current_WeatherMap", "number");
        if (weatherMapMode != this.lastMode) {
            this.updateWeatherMapButtons();
            this.lastMode = weatherMapMode;
        }
    }
    onExit() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
    }
    onEvent(_event) {
    }
    back() {
        this.gps.goBack();
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
    }
    weatherMapSwitch(_mapIndex) {
        let currMap = SimVar.GetSimVarValue("L:AS3000_MFD_Current_WeatherMap", "number");
        if (currMap == _mapIndex) {
            switch (_mapIndex) {
                case 0:
                    break;
                case 1:
                    break;
                case 2:
                    break;
            }
        }
        else {
            SimVar.SetSimVarValue("L:AS3000_MFD_Current_WeatherMap", "number", _mapIndex);
        }
        this.updateWeatherMapButtons(_mapIndex);
    }
    updateWeatherMapButtons(_newIndex = undefined) {
        let currMap = _newIndex == undefined ? SimVar.GetSimVarValue("L:AS3000_MFD_Current_WeatherMap", "number") : _newIndex;
        if (currMap == 0) {
            Avionics.Utils.diffAndSet(this.nexradButton_text, "NEXRAD Settings");
            Avionics.Utils.diffAndSetAttribute(this.nexradButton, "state", "Active");
        }
        else {
            Avionics.Utils.diffAndSet(this.nexradButton_text, "NEXRAD");
            Avionics.Utils.diffAndSetAttribute(this.nexradButton, "state", "");
        }
        if (currMap == 1) {
            Avionics.Utils.diffAndSet(this.wxRadarButton_text, "WX RADAR Settings");
            Avionics.Utils.diffAndSetAttribute(this.wxRadarButton, "state", "Active");
        }
        else {
            Avionics.Utils.diffAndSet(this.wxRadarButton_text, "WX RADAR Horizontal");
            Avionics.Utils.diffAndSetAttribute(this.wxRadarButton, "state", "");
        }
        if (currMap == 2) {
            Avionics.Utils.diffAndSet(this.wxRadarVertButton_text, "WX RADAR Settings");
            Avionics.Utils.diffAndSetAttribute(this.wxRadarVertButton, "state", "Active");
        }
        else {
            Avionics.Utils.diffAndSet(this.wxRadarVertButton_text, "WX RADAR Vertical");
            Avionics.Utils.diffAndSetAttribute(this.wxRadarVertButton, "state", "");
        }
    }
}

/*
 * Lighting Configuration Page (via Aircraft Systems Page): controls backlighting of PFD, MFD, and touchscreen, and all G3000 bezel keys/knobs
 */
class AS3000_TSC_LightingConfig extends NavSystemElement {
    init(root) {
        this.slider = this.gps.getChildById("LightingConfigSlider");
        this.slider.addEventListener("input", this.syncLightingToSlider.bind(this));
        this.sliderBackground = this.gps.getChildById("LightingConfigSliderBackground");
        this.display = this.gps.getChildById("LightingValueDisplay");
        this.displayValue = this.display.getElementsByClassName("value")[0];

        this.updateSlider();

        this.decButton = this.gps.getChildById("LightingDecreaseButton");
        this.incButton = this.gps.getChildById("LightingIncreaseButton");

        this.gps.makeButton(this.decButton, this.changeLighting.bind(this, -0.01));
        this.gps.makeButton(this.incButton, this.changeLighting.bind(this, 0.01));
    }

    _activateNavButtons() {
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "ICON_TSC_BUTTONBAR_BACK.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "ICON_TSC_BUTTONBAR_HOME.png");
    }

    _deactivateNavButtons() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
    }

    onFocusGained() {
        this._activateNavButtons();
    }

    onFocusLost() {
        this._deactivateNavButtons();
    }

    onEnter() {
    }

    onUpdate(deltaTime) {
        this.updateSlider();
    }

    onExit() {
    }

    onEvent(_event) {
    }

    back() {
        this.gps.goBack();
    }

    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
    }

    updateSlider() {
        let currValue = SimVar.GetSimVarValue("L:XMLVAR_AS3000_DisplayLighting", "number") * 100;
        let displayValue = fastToFixed(currValue, 0)
        Avionics.Utils.diffAndSet(this.displayValue, currValue.toFixed(0) + "%"); // update readout display
        this.slider.value = currValue;
        this.sliderBackground.style.webkitClipPath = "polygon(0 0, " + displayValue + "% 0, " + displayValue + "% 100%, 0 100%)"; // update the range slider's track background to only show on the left of the thumb
    }

    syncLightingToSlider() {
        this.setLightingValue(parseInt(this.slider.value) / 100.0);
    }

    changeLighting(_delta) {
        this.setLightingValue(Math.min(Math.max(SimVar.GetSimVarValue("L:XMLVAR_AS3000_DisplayLighting", "number") + _delta, 0.01), 1));
    }

    setLightingValue(value) {
        SimVar.SetSimVarValue("L:XMLVAR_AS3000_DisplayLighting", "number", value);
        this.updateDataStore(value);
    }

    updateDataStore(value) {
        WTDataStore.set(AS3000_TSC_LightingConfig.VARNAME_DISPLAY_LIGHTING, value);
    }
}
AS3000_TSC_LightingConfig.VARNAME_DISPLAY_LIGHTING = "Display_Lighting";

/*
 * Utilities Page (via MFD Home)
 */
class AS3000_TSC_Utilities extends NavSystemElement {
    init(root) {
        this.setupButton = this.gps.getChildById("SetupButton");

        this.gps.makeButton(this.setupButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Setup"));
    }

    _activateNavButtons() {
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "ICON_TSC_BUTTONBAR_BACK.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "ICON_TSC_BUTTONBAR_HOME.png");
    }

    _deactivateNavButtons() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
    }

    onFocusGained() {
        this._activateNavButtons();
    }

    onFocusLost() {
        this._deactivateNavButtons();
    }

    onEnter() {
    }

    onUpdate(_deltaTime) {
    }

    onExit() {
    }

    onEvent(_event) {
    }

    back() {
        this.gps.goBack();
    }

    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
    }
}

class AS3000_TSC_NavComHome extends NavSystemElement {
    constructor() {
        super();

        this.xpdrState = -1;
        this.selectedCom = 1;
        this.inputIndex = -1;
        this.identTime = 0;
    }

    /**
     * @readonly
     * @type {AS3000_TSC}
     */
    get instrument() {
        return this.gps;
    }

    _defineXPDRChildren() {
        this.XPDRIdent = this.gps.getChildById("XPDRIdent");
        this._xpdrCodeButton = this.gps.getChildById("XPDR");
        this._xpdrModeDisplay = this._xpdrCodeButton.getElementsByClassName("topText")[0];
        this._xpdrCodeDisplay = this._xpdrCodeButton.getElementsByClassName("mainNumber")[0];
    }

    _defineComsChildren() {
        this.Com1Active = this.gps.getChildById("Com1Active");
        this.Com1Active_Freq = this.Com1Active.getElementsByClassName("mainNumber")[0];
        this.Com1Stby = this.gps.getChildById("Com1Stby");
        this.Com1Stby_Freq = this.Com1Stby.getElementsByClassName("mainNumber")[0];
        this.Com2Active = this.gps.getChildById("Com2Active");
        this.Com2Active_Freq = this.Com2Active.getElementsByClassName("mainNumber")[0];
        this.Com2Stby = this.gps.getChildById("Com2Stby");
        this.Com2Stby_Freq = this.Com2Stby.getElementsByClassName("mainNumber")[0];
    }

    _defineKeyboardChildren() {
        this.NKFindButton = this.gps.getChildById("NKFindButton");
        this.NKBkspButton = this.gps.getChildById("NKBkspButton");
        this.NK_1 = this.gps.getChildById("NK_1");
        this.NK_2 = this.gps.getChildById("NK_2");
        this.NK_3 = this.gps.getChildById("NK_3");
        this.NK_4 = this.gps.getChildById("NK_4");
        this.NK_5 = this.gps.getChildById("NK_5");
        this.NK_6 = this.gps.getChildById("NK_6");
        this.NK_7 = this.gps.getChildById("NK_7");
        this.NK_8 = this.gps.getChildById("NK_8");
        this.NK_9 = this.gps.getChildById("NK_9");
        this.NKPlayButton = this.gps.getChildById("NKPlayButton");
        this.NK_0 = this.gps.getChildById("NK_0");
        this.NKXferButton = this.gps.getChildById("NKXferButton");
    }

    _defineMonitorsChildren() {
        this.PilotIsolate = this.gps.getChildById("PilotIsolate");
        this.Mic_Button = this.gps.getChildById("Mic");
        this.Mon_Button = this.gps.getChildById("Mon");
        this.Mic_Com1_Status = this.gps.getChildById("Com1_MicActive");
        this.Mic_Com2_Status = this.gps.getChildById("Com2_MicActive");
        this.Mon_Com1_Status = this.gps.getChildById("Com1_MonActive");
        this.Mon_Com2_Status = this.gps.getChildById("Com2_MonActive");
    }

    _defineAudioRadio() {
        this.AudioRadio = this.gps.getChildById("AudioRadio");
    }

    _defineIntercom() {
        this.Intercom = this.gps.getChildById("Intercom");
    }

    _defineMusic() {
        this.PilotMusic = this.gps.getChildById("PilotMusic");
    }

    _defineChildren() {
        this._defineXPDRChildren();
        this._defineComsChildren();
        this._defineKeyboardChildren();
        this._defineMonitorsChildren();
        this._defineAudioRadio();
        this._defineIntercom();
        this._defineMusic();
    }

    _initXPDRButtons() {
        this.gps.makeButton(this._xpdrCodeButton, this.openTransponder.bind(this));
        this.gps.makeButton(this.XPDRIdent, this.xpdrIdent.bind(this));
    }

    _initComsButtons() {
        this.gps.makeButton(this.Com1Stby, this.setSelectedCom.bind(this, 1));
        this.gps.makeButton(this.Com2Stby, this.setSelectedCom.bind(this, 2));
        this.gps.makeButton(this.Com1Active, this.swapCom1.bind(this));
        this.gps.makeButton(this.Com2Active, this.swapCom2.bind(this));
    }

    _initKeyboardButtons() {
        this.gps.makeButton(this.NK_0, this.onDigitPress.bind(this, 0));
        this.gps.makeButton(this.NK_1, this.onDigitPress.bind(this, 1));
        this.gps.makeButton(this.NK_2, this.onDigitPress.bind(this, 2));
        this.gps.makeButton(this.NK_3, this.onDigitPress.bind(this, 3));
        this.gps.makeButton(this.NK_4, this.onDigitPress.bind(this, 4));
        this.gps.makeButton(this.NK_5, this.onDigitPress.bind(this, 5));
        this.gps.makeButton(this.NK_6, this.onDigitPress.bind(this, 6));
        this.gps.makeButton(this.NK_7, this.onDigitPress.bind(this, 7));
        this.gps.makeButton(this.NK_8, this.onDigitPress.bind(this, 8));
        this.gps.makeButton(this.NK_9, this.onDigitPress.bind(this, 9));
        this.gps.makeButton(this.NKBkspButton, this.backspace.bind(this));
        this.gps.makeButton(this.NKXferButton, this.swapSelectedCom.bind(this));
    }

    _initMonitorsButtons() {
        this.gps.makeButton(this.Mic_Button, this.MicSwitch.bind(this));
        this.gps.makeButton(this.Mon_Button, this.MonSwitch.bind(this));
    }

    _initAudioRadioButton() {
        this.gps.makeButton(this.AudioRadio, this.openAudioRadios.bind(this));
    }

    _initButtons() {
        this._initXPDRButtons();
        this._initComsButtons();
        this._initKeyboardButtons();
        this._initMonitorsButtons();
        this._initAudioRadioButton();
    }

    init(root) {
        this._defineChildren();
        this._initButtons();
    }

    _deactivateNavButtons() {
        this.instrument.deactivateNavButton(1);
        this.instrument.deactivateNavButton(2);
        this.instrument.deactivateNavButton(3);
        this.instrument.deactivateNavButton(4);
        this.instrument.deactivateNavButton(5);
        this.instrument.deactivateNavButton(6);
    }

    onFocusGained() {
    }

    onFocusLost() {
        this._deactivateNavButtons();
    }

    _clearPageHistory() {
        this.instrument.clearPageHistory();
    }

    onEnter() {
        this._clearPageHistory();
        this.setSoftkeysNames();
    }

    _updateComs() {
        let com1Active = this.gps.frequencyFormat(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:1", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? 2 : 3);
        let com1Stby;
        if (this.selectedCom != 1 || this.inputIndex == -1) {
            com1Stby = this.gps.frequencyFormat(SimVar.GetSimVarValue("COM STANDBY FREQUENCY:1", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? 2 : 3);
        }
        else {
            let state = this.gps.blinkGetState(1000, 500) ? "Blink" : "Off";
            var regex = new RegExp('^(.{' + (this.inputIndex > 2 ? this.inputIndex + 1 : this.inputIndex) + '})(.)(.*)');
            var replace = '<span class="Writed">$1</span><span class="Writing" state="' + state + '">$2</span><span class = "ToWrite">$3</span>';
            com1Stby = ((this.currentInput / 1000).toFixed(SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? 2 : 3) + " ").replace(regex, replace);
        }
        let com2Active = this.gps.frequencyFormat(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:2", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum") == 0 ? 2 : 3);
        let com2Stby;
        if (this.selectedCom != 2 || this.inputIndex == -1) {
            com2Stby = this.gps.frequencyFormat(SimVar.GetSimVarValue("COM STANDBY FREQUENCY:2", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum") == 0 ? 2 : 3);
        }
        else {
            let state = this.gps.blinkGetState(1000, 500) ? "Blink" : "Off";
            var regex = new RegExp('^(.{' + (this.inputIndex > 2 ? this.inputIndex + 1 : this.inputIndex) + '})(.)(.*)');
            var replace = '<span class="Writed">$1</span><span class="Writing" state="' + state + '">$2</span><span class = "ToWrite">$3</span>';
            com2Stby = ((this.currentInput / 1000).toFixed(SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum") == 0 ? 2 : 3) + " ").replace(regex, replace);
        }
        if (this.Com1Active_Freq.innerHTML != com1Active) {
            this.Com1Active_Freq.innerHTML = com1Active;
        }
        if (this.Com1Stby_Freq.innerHTML != com1Stby) {
            this.Com1Stby_Freq.innerHTML = com1Stby;
        }
        if (this.Com2Active_Freq.innerHTML != com2Active) {
            this.Com2Active_Freq.innerHTML = com2Active;
        }
        if (this.Com2Stby_Freq.innerHTML != com2Stby) {
            this.Com2Stby_Freq.innerHTML = com2Stby;
        }
        if (this.selectedCom == 1) {
            this.Com1Stby.setAttribute("state", "Selected");
            this.Com2Stby.setAttribute("state", "none");
        }
        else if (this.selectedCom == 2) {
            this.Com1Stby.setAttribute("state", "none");
            this.Com2Stby.setAttribute("state", "Selected");
        }

        let comSpacingMode = SimVar.GetSimVarValue("COM SPACING MODE:" + this.selectedCom, "Enum");
        if (comSpacingMode == 0 && this.currentInput % 25 != 0) {
            this.currentInput -= this.currentInput % 25;
        }
        if (comSpacingMode == 0 && this.inputIndex > 5) {
            this.inputIndex = 5;
        }
    }

    _updateXPDRMode() {
        let xpdrState = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        if (this.xpdrState != xpdrState) {
            this.xpdrState = xpdrState;
            switch (xpdrState) {
                case 0:
                    this._xpdrModeDisplay.innerHTML = "Off";
                    this._xpdrCodeButton.setAttribute("state", "");
                    break;
                case 1:
                    this._xpdrModeDisplay.innerHTML = "STBY";
                    this._xpdrCodeButton.setAttribute("state", "");
                    break;
                case 2:
                    this._xpdrModeDisplay.innerHTML = "TEST";
                    this._xpdrCodeButton.setAttribute("state", "");
                    break;
                case 3:
                    this._xpdrModeDisplay.innerHTML = "ON";
                    this._xpdrCodeButton.setAttribute("state", "Green");
                    break;
                case 4:
                    this._xpdrModeDisplay.innerHTML = "ALT";
                    this._xpdrCodeButton.setAttribute("state", "Green");
                    break;
            }
        }
    }

    _updateXPDRCode() {
        let transponderCode = ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4);
        if (transponderCode != this._xpdrCodeDisplay.innerHTML) {
            this._xpdrCodeDisplay.innerHTML = transponderCode;
        }
    }

    _updateXPDRIdent() {
        if (this.identTime > 0) {
            this.identTime -= this.gps.deltaTime;
            Avionics.Utils.diffAndSetAttribute(this.XPDRIdent, "state", "Active");
        }
        else {
            Avionics.Utils.diffAndSetAttribute(this.XPDRIdent, "state", "");
        }
    }

    _updateXPDR() {
        this._updateXPDRMode();
        this._updateXPDRCode();
        this._updateXPDRIdent();
    }

    _updateMonitors() {
        Avionics.Utils.diffAndSetAttribute(this.Mic_Com1_Status, "visibility", SimVar.GetSimVarValue("COM TRANSMIT:1", "Bool") ? "visible" : "hidden");
        Avionics.Utils.diffAndSetAttribute(this.Com1Active, "state", SimVar.GetSimVarValue("COM TRANSMIT:1", "Bool") ? "Active" : "");
        Avionics.Utils.diffAndSetAttribute(this.Mic_Com2_Status, "visibility", SimVar.GetSimVarValue("COM TRANSMIT:2", "Bool") ? "visible" : "hidden");
        Avionics.Utils.diffAndSetAttribute(this.Com2Active, "state", SimVar.GetSimVarValue("COM TRANSMIT:2", "Bool") ? "Active" : "");
        Avionics.Utils.diffAndSetAttribute(this.Mon_Com1_Status, "visibility", SimVar.GetSimVarValue("COM RECEIVE:1", "Bool") ? "visible" : "hidden");
        Avionics.Utils.diffAndSetAttribute(this.Mon_Com2_Status, "visibility", SimVar.GetSimVarValue("COM RECEIVE:2", "Bool") ? "visible" : "hidden");
    }

    onUpdate(_deltaTime) {
        this._updateComs();
        this._updateXPDR();
        this._updateMonitors();
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
        }
        if (!this.gps.popUpElement) {
            switch (_event) {
                case "TopKnob_Large_INC":
                    SimVar.SetSimVarValue("K:COM" + (this.selectedCom == 1 ? "" : "2") + "_RADIO_WHOLE_INC", "Bool", 1);
                    break;
                case "TopKnob_Large_DEC":
                    SimVar.SetSimVarValue("K:COM" + (this.selectedCom == 1 ? "" : "2") + "_RADIO_WHOLE_DEC", "Bool", 1);
                    break;
                case "TopKnob_Small_INC":
                    SimVar.SetSimVarValue("K:COM" + (this.selectedCom == 1 ? "" : "2") + "_RADIO_FRACT_INC", "Bool", 1);
                    break;
                case "TopKnob_Small_DEC":
                    SimVar.SetSimVarValue("K:COM" + (this.selectedCom == 1 ? "" : "2") + "_RADIO_FRACT_DEC", "Bool", 1);
                    break;
                case "TopKnob_Push":
                    this.selectedCom == 1 ? this.setSelectedCom(2) : this.setSelectedCom(1);
                    break;
                case "TopKnob_Push_Long":
                    this.swapSelectedCom();
                    break;
                case "BottomKnob_Small_INC":
                    break;
                case "BottomKnob_Small_DEC":
                    break;
                case "BottomKnob_Push":
                    break;
            }
        }
    }
    MicSwitch() {
        SimVar.SetSimVarValue("K:PILOT_TRANSMITTER_SET", "number", SimVar.GetSimVarValue("COM TRANSMIT:1", "Bool") == 1 ? 1 : 0);
        SimVar.SetSimVarValue("K:COPILOT_TRANSMITTER_SET", "number", SimVar.GetSimVarValue("COM TRANSMIT:1", "Bool") == 1 ? 1 : 0);
    }
    MonSwitch() {
        SimVar.SetSimVarValue("K:COM" + (SimVar.GetSimVarValue("COM TRANSMIT:1", "Bool") == 1 ? 2 : 1) + "_RECEIVE_SELECT", "number", SimVar.GetSimVarValue("COM RECEIVE:" + (SimVar.GetSimVarValue("COM TRANSMIT:1", "Bool") == 1 ? 2 : 1), "Bool") == 1 ? 0 : 1);
    }
    setSelectedCom(_id) {
        if (this.inputIndex != -1) {
            this.comFreqValidate();
        }
        this.selectedCom = _id;
        this.setSoftkeysNames();
    }
    swapCom1() {
        if (this.inputIndex != -1 && this.selectedCom == 1) {
            this.comFreqValidate();
        }
        SimVar.SetSimVarValue("K:COM_STBY_RADIO_SWAP", "Boolean", 1);
    }
    swapCom2() {
        if (this.inputIndex != -1 && this.selectedCom == 2) {
            this.comFreqValidate();
        }
        SimVar.SetSimVarValue("K:COM2_RADIO_SWAP", "Boolean", 1);
    }
    swapSelectedCom() {
        if (this.selectedCom == 1) {
            this.swapCom1();
        }
        else if (this.selectedCom == 2) {
            this.swapCom2();
        }
    }
    onDigitPress(_digit) {
        switch (this.inputIndex) {
            case -1:
            case 0:
                this.gps.activateNavButton(1, "Cancel", this.comFreqCancel.bind(this), false, "ICON_TSC_BUTTONBAR_BACK.png");
                this.gps.activateNavButton(6, "Enter", this.comFreqValidate.bind(this), false, "ICON_TSC_BUTTONBAR_ENTER.png");
                if (_digit == 1) {
                    this.inputIndex = 1;
                    this.currentInput = 118000;
                }
                else if (_digit != 0 && _digit < 4) {
                    this.inputIndex = 2;
                    this.currentInput = 100000 + 10000 * _digit;
                }
                else {
                    this.inputIndex = 1;
                    this.currentInput = 118000;
                }
                break;
            case 1:
                if (_digit > 1 && _digit < 4) {
                    this.inputIndex = 2;
                    this.currentInput = 100000 + 10000 * _digit;
                }
                else if (_digit == 1) {
                    this.inputIndex = 2;
                    this.currentInput = 118000;
                }
                else if (_digit >= 8) {
                    this.inputIndex = 3;
                    this.currentInput = 110000 + _digit * 1000;
                }
                break;
            case 2:
                if (this.currentInput == 118000) {
                    if (_digit == 8) {
                        this.inputIndex = 3;
                    }
                    else if (_digit == 9) {
                        this.currentInput = 119000;
                        this.inputIndex = 3;
                    }
                }
                else {
                    if (!(this.currentInput == 130000 && _digit > 6)) {
                        this.currentInput += _digit * 1000;
                        this.inputIndex = 3;
                    }
                }
                break;
            case 3:
                this.currentInput += 100 * _digit;
                this.inputIndex = 4;
                break;
            case 4:
                if (SimVar.GetSimVarValue("COM SPACING MODE:" + this.selectedCom, "Enum") == 0) {
                    if (_digit == 0 || _digit == 2 || _digit == 5 || _digit == 7) {
                        this.currentInput += 10 * _digit;
                        this.inputIndex = 5;
                    }
                }
                else {
                    this.currentInput += 10 * _digit;
                    if (this.currentInput % 25 == 20) {
                        this.currentInput += 5;
                        this.inputIndex = 6;
                    }
                    else {
                        this.inputIndex = 5;
                    }
                }
                break;
            case 5:
                if (SimVar.GetSimVarValue("COM SPACING MODE:" + this.selectedCom, "Enum") == 1) {
                    let newVal = this.currentInput + _digit;
                    let test = newVal % 25;
                    if (test == 0 || test == 5 || test == 10 || test == 15) {
                        this.currentInput = newVal;
                        this.inputIndex = 6;
                    }
                }
                break;
        }
    }
    backspace() {
        if (this.inputIndex > 0) {
            this.inputIndex--;
            this.currentInput = Math.pow(10, 6 - this.inputIndex) * Math.floor(this.currentInput / Math.pow(10, 6 - this.inputIndex));
            if (this.currentInput < 118000) {
                this.currentInput = 118000;
            }
            if (this.inputIndex == 5 && this.currentInput % 25 == 20) {
                this.backspace();
            }
        }
    }
    comFreqValidate() {
        SimVar.SetSimVarValue("K:COM" + (this.selectedCom == 1 ? "" : "2") + "_STBY_RADIO_SET_HZ", "Hz", this.currentInput * 1000);
        this.comFreqCancel();
    }
    comFreqCancel() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(6);
        this.inputIndex = -1;
    }
    openTransponder() {
        if (this.inputIndex != -1) {
            this.comFreqCancel();
        }
        this.gps.transponderWindow.element.setContext("NavCom", "NAV/COM Home");
        this.gps.switchToPopUpPage(this.gps.transponderWindow);
    }
    openAudioRadios() {
        if (this.inputIndex != -1) {
            this.comFreqCancel();
        }
        this.gps.audioRadioWindow.element.setContext("NavCom", "NAV/COM Home");
        this.gps.switchToPopUpPage(this.gps.audioRadioWindow);
    }
    xpdrIdent() {
        let currMode = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        if (currMode == 3 || currMode == 4) {
            this.identTime = 18000;
        }
    }
    setSoftkeysNames() {
        this.gps.setTopKnobText("COM" + this.selectedCom + " Freq<br>Push: 1-2 Hold: Swap");
        this.gps.setBottomKnobText("Pilot COM" + this.selectedCom + " Volume<br>Push: Squelch");
    }
}
class AS3000_TSC_Transponder extends NavSystemTouch_Transponder {
    setContext(_homePageParent, _homePageName) {
        this.homePageParent = _homePageParent;
        this.homePageName = _homePageName;
    }

    _activateLabelBar() {
        this.gps.setTopKnobText("Data Entry Push: Enter", true);
        this.gps.setBottomKnobText("", true);
    }

    _activateNavButtons() {
        this.gps.activateNavButton(1, "Cancel", this.back.bind(this), true, "ICON_TSC_BUTTONBAR_BACK.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), true, "ICON_TSC_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(6, "Enter", this.validateCode.bind(this), true, "ICON_TSC_BUTTONBAR_ENTER.png");
    }

    _deactivateNavButtons() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
        this.gps.deactivateNavButton(6);
    }

    onFocusGained() {
        this._activateLabelBar();
        this._activateNavButtons();
    }

    onFocusLost() {
        this._deactivateNavButtons();
    }

    onEvent(_event) {
        super.onEvent(_event);
        switch (_event) {
            case "TopKnob_Large_INC":
                if (this.inputIndex < 4) {
                    this.inputIndex++;
                }
                break;
            case "TopKnob_Large_DEC":
                if (this.inputIndex == -1) {
                    this.inputIndex = 0;
                }
                else if (this.inputIndex > 0) {
                    this.inputIndex--;
                }
                break;
            case "TopKnob_Small_INC":
                if (this.inputIndex == -1) {
                    this.inputIndex = 0;
                }
                else if (this.inputIndex < 4) {
                    this.currentInput[this.inputIndex] = (this.currentInput[this.inputIndex] + 1) % 8;
                }
                break;
            case "TopKnob_Small_DEC":
                if (this.inputIndex == -1) {
                    this.inputIndex = 0;
                }
                else if (this.inputIndex < 4) {
                    this.currentInput[this.inputIndex]--;
                    if (this.currentInput[this.inputIndex] < 0) {
                        this.currentInput[this.inputIndex] = 7;
                    }
                }
                break;
            case "TopKnob_Push":
            case "TopKnob_Push_Long":
                this.validateCode();
                break;
        }
        this.inputChanged = true;
    }

    back() {
        this.gps.goBack();
    }

    backHome() {
        this.gps.closePopUpElement();
        this.gps.SwitchToPageName(this.homePageParent, this.homePageName);
    }
}
class AS3000_TSC_AudioRadios_Line {
    constructor(_lineElement, _topKnobText, _bottomKnobText, _eventCallback) {
        this.lineElement = _lineElement;
        this.topKnobText = _topKnobText;
        this.bottomKnobText = _bottomKnobText;
        this.eventCallback = _eventCallback;
    }
}
class AS3000_TSC_AudioRadios extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.selectedLine = 0;
    }
    init(root) {
        this.window = root;
        this.pilotBody = this.gps.getChildById("AudioRadioPilotBody");
        this.lines = [];
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Nav1"), "NAV1 Freq<br>Hold: Swap", "Pilot NAV1 Volume<br>Push: ID", this.nav1EventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Nav2"), "NAV2 Freq<br>Hold: Swap", "Pilot NAV2 Volume<br>Push: ID", this.nav2EventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Com1"), "COM1 Freq<br>Push: 1-2 Hold: Swap", "Pilot COM1 Volume<br>Push: Squelch", this.com1EventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Com2"), "COM2 Freq<br>Push: 1-2 Hold: Swap", "Pilot COM2 Volume<br>Push: Squelch", this.com2EventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Speaker"), "", "Pilot Speaker Volume", this.speakerEventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Recorder"), "", "Pilot Recorder Volume", this.recorderEventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Marker"), "", "Pilot Marker Volume", this.markerEventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Adf"), "", "ADF Volume", this.adfEventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Music"), "", "Pilot Music Volume", this.musicEventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Clicks"), "", "Pilot Clicks Volume", this.clicksEventCallback.bind(this)));
        this.Nav1_Frequencies = this.gps.getChildById("Nav1_Frequencies");
        this.Nav1_Active = this.Nav1_Frequencies.getElementsByClassName("activeFreq")[0];
        this.Nav1_Stby = this.Nav1_Frequencies.getElementsByClassName("standbyFreq")[0];
        this.Nav1_ID = this.Nav1_Frequencies.getElementsByClassName("activeNavID")[0];
        this.Nav2_Frequencies = this.gps.getChildById("Nav2_Frequencies");
        this.Nav2_Active = this.Nav2_Frequencies.getElementsByClassName("activeFreq")[0];
        this.Nav2_Stby = this.Nav2_Frequencies.getElementsByClassName("standbyFreq")[0];
        this.Nav2_ID = this.Nav2_Frequencies.getElementsByClassName("activeNavID")[0];
        this.Com1_Frequencies = this.gps.getChildById("Com1_Frequencies");
        this.Com1_Active = this.Com1_Frequencies.getElementsByClassName("activeFreq")[0];
        this.Com1_Stby = this.Com1_Frequencies.getElementsByClassName("standbyFreq")[0];
        this.Com2_Frequencies = this.gps.getChildById("Com2_Frequencies");
        this.Com2_Active = this.Com2_Frequencies.getElementsByClassName("activeFreq")[0];
        this.Com2_Stby = this.Com2_Frequencies.getElementsByClassName("standbyFreq")[0];
        this.Adf_Frequencies = this.gps.getChildById("Adf_Frequencies");
        this.Adf_Active = this.Adf_Frequencies.getElementsByClassName("activeFreq")[0];
        this.Adf_Stby = this.Adf_Frequencies.getElementsByClassName("standbyFreq")[0];
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.pilotBody;
        this.scrollElement.elementSize = this.lines[0].lineElement.getBoundingClientRect().height;
        this.gps.makeButton(this.Nav1_Frequencies, this.openFrequencyKeyboard.bind(this, "NAV1", 108, 117.95, "NAV ACTIVE FREQUENCY:1", "NAV STANDBY FREQUENCY:1", this.setNav1Freq.bind(this), "", false));
        this.gps.makeButton(this.Nav2_Frequencies, this.openFrequencyKeyboard.bind(this, "NAV2", 108, 117.95, "NAV ACTIVE FREQUENCY:2", "NAV STANDBY FREQUENCY:2", this.setNav2Freq.bind(this), "", false));
        this.gps.makeButton(this.Com1_Frequencies, this.openFrequencyKeyboard.bind(this, "COM1 Standby", 118, 136.99, "COM ACTIVE FREQUENCY:1", "COM STANDBY FREQUENCY:1", this.setCom1Freq.bind(this), "COM SPACING MODE:1", false));
        this.gps.makeButton(this.Com2_Frequencies, this.openFrequencyKeyboard.bind(this, "COM2 Standby", 118, 136.99, "COM ACTIVE FREQUENCY:2", "COM STANDBY FREQUENCY:2", this.setCom2Freq.bind(this), "COM SPACING MODE:2", false));
        this.gps.makeButton(this.Adf_Frequencies, this.openFrequencyKeyboard.bind(this, "ADF", 190.0, 1799.5, "ADF ACTIVE FREQUENCY:1", "ADF STANDBY FREQUENCY:1", this.setAdfFreq.bind(this), "", true));
        for (let i = 0; i < this.lines.length; i++) {
            this.gps.makeButton(this.lines[i].lineElement, this.setSelectedLine.bind(this, i));
        }
    }

    setContext(_homePageParent, _homePageName) {
        this.homePageParent = _homePageParent;
        this.homePageName = _homePageName;
    }

    _activateLabelBar() {
        this.gps.setTopKnobText(this.lines[this.selectedLine].topKnobText, true);
        this.gps.setBottomKnobText(this.lines[this.selectedLine].bottomKnobText, true);
    }

    _activateNavButtons() {
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "ICON_TSC_BUTTONBAR_BACK.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "ICON_TSC_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(5, "Up", this.scrollUp.bind(this), true, "ICON_TSC_BUTTONBAR_UP.png");
        this.gps.activateNavButton(6, "Down", this.scrollDown.bind(this), true, "ICON_TSC_BUTTONBAR_DOWN.png");
    }

    _deactivateNavButtons() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
        this.gps.deactivateNavButton(5);
        this.gps.deactivateNavButton(6);
    }

    onFocusGained() {
        this._activateLabelBar();
        this._activateNavButtons();
    }

    onFocusLost() {
        this._deactivateNavButtons();
    }

    onEnter() {
        this.window.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = this.lines[0].lineElement.getBoundingClientRect().height;
        }
        this.scrollElement.update();

        Avionics.Utils.diffAndSet(this.Nav1_Active, this.gps.frequencyFormat(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:1", "MHz"), 2));
        Avionics.Utils.diffAndSet(this.Nav1_Stby, this.gps.frequencyFormat(SimVar.GetSimVarValue("NAV STANDBY FREQUENCY:1", "MHz"), 2));
        Avionics.Utils.diffAndSet(this.Nav1_ID, SimVar.GetSimVarValue("NAV IDENT:1", "string"));
        Avionics.Utils.diffAndSet(this.Nav2_Active, this.gps.frequencyFormat(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:2", "MHz"), 2));
        Avionics.Utils.diffAndSet(this.Nav2_Stby, this.gps.frequencyFormat(SimVar.GetSimVarValue("NAV STANDBY FREQUENCY:2", "MHz"), 2));
        Avionics.Utils.diffAndSet(this.Nav2_ID, SimVar.GetSimVarValue("NAV IDENT:2", "string"));
        Avionics.Utils.diffAndSet(this.Com1_Active, this.gps.frequencyFormat(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:1", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? 2 : 3));
        Avionics.Utils.diffAndSet(this.Com1_Stby, this.gps.frequencyFormat(SimVar.GetSimVarValue("COM STANDBY FREQUENCY:1", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? 2 : 3));
        Avionics.Utils.diffAndSet(this.Com2_Active, this.gps.frequencyFormat(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:2", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum") == 0 ? 2 : 3));
        Avionics.Utils.diffAndSet(this.Com2_Stby, this.gps.frequencyFormat(SimVar.GetSimVarValue("COM STANDBY FREQUENCY:2", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum") == 0 ? 2 : 3));
        Avionics.Utils.diffAndSet(this.Adf_Active, this.gps.frequencyFormat(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz"), 1));
        Avionics.Utils.diffAndSet(this.Adf_Stby, this.gps.frequencyFormat(SimVar.GetSimVarValue("ADF STANDBY FREQUENCY:1", "KHz"), 1));
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
        this.lines[this.selectedLine].eventCallback(_event);
    }

    scrollUp() {
        this.scrollElement.scrollUp();
    }
    scrollDown() {
        this.scrollElement.scrollDown();
    }
    openFrequencyKeyboard(_title, _minFreq, _maxFreq, _activeSimVar, _StbySimVar, _endCallBack, _frequencySpacingModeSimvar, _adf) {
        this.gps.frequencyKeyboard.element.setContext(_title, _minFreq, _maxFreq, _activeSimVar, _StbySimVar, _endCallBack, this.homePageParent, this.homePageName, _frequencySpacingModeSimvar, _adf);
        this.gps.switchToPopUpPage(this.gps.frequencyKeyboard);
    }

    setNav1Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:NAV1_STBY_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:NAV1_RADIO_SWAP", "Bool", 1);
        }
    }
    setNav2Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:NAV2_STBY_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:NAV2_RADIO_SWAP", "Bool", 1);
        }
    }
    setCom1Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:COM_STBY_RADIO_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:COM_STBY_RADIO_SWAP", "Bool", 1);
        }
    }
    setCom2Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:COM2_STBY_RADIO_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:COM2_RADIO_SWAP", "Bool", 1);
        }
    }
    setAdfFreq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:ADF1_RADIO_SWAP", "Boolean", 0);
        SimVar.SetSimVarValue("K:ADF_COMPLETE_SET", "Frequency ADF BCD32", Avionics.Utils.make_adf_bcd32(_newFreq * 1000));
        if (!swap) {
            SimVar.SetSimVarValue("K:ADF1_RADIO_SWAP", "Boolean", 0);
        }
    }
    setSelectedLine(_index) {
        this.lines[this.selectedLine].lineElement.setAttribute("state", "");
        this.selectedLine = _index;
        this.lines[this.selectedLine].lineElement.setAttribute("state", "Selected");
        this.gps.setTopKnobText(this.lines[this.selectedLine].topKnobText, true);
        this.gps.setBottomKnobText(this.lines[this.selectedLine].bottomKnobText, true);
    }
    nav1EventCallback(_event) {
        switch (_event) {
            case "TopKnob_Large_INC":
                SimVar.SetSimVarValue("K:NAV1_RADIO_WHOLE_INC", "Bool", 1);
                break;
            case "TopKnob_Large_DEC":
                SimVar.SetSimVarValue("K:NAV1_RADIO_WHOLE_DEC", "Bool", 1);
                break;
            case "TopKnob_Small_INC":
                SimVar.SetSimVarValue("K:NAV1_RADIO_FRACT_INC", "Bool", 1);
                break;
            case "TopKnob_Small_DEC":
                SimVar.SetSimVarValue("K:NAV1_RADIO_FRACT_DEC", "Bool", 1);
                break;
            case "TopKnob_Push":
                break;
            case "TopKnob_Push_Long":
                SimVar.SetSimVarValue("K:NAV1_RADIO_SWAP", "Bool", 1);
                break;
            case "BottomKnob_Small_INC":
                break;
            case "BottomKnob_Small_DEC":
                break;
            case "BottomKnob_Push":
                break;
        }
    }
    nav2EventCallback(_event) {
        switch (_event) {
            case "TopKnob_Large_INC":
                SimVar.SetSimVarValue("K:NAV2_RADIO_WHOLE_INC", "Bool", 1);
                break;
            case "TopKnob_Large_DEC":
                SimVar.SetSimVarValue("K:NAV2_RADIO_WHOLE_DEC", "Bool", 1);
                break;
            case "TopKnob_Small_INC":
                SimVar.SetSimVarValue("K:NAV2_RADIO_FRACT_INC", "Bool", 1);
                break;
            case "TopKnob_Small_DEC":
                SimVar.SetSimVarValue("K:NAV2_RADIO_FRACT_DEC", "Bool", 1);
                break;
            case "TopKnob_Push":
                break;
            case "TopKnob_Push_Long":
                SimVar.SetSimVarValue("K:NAV2_RADIO_SWAP", "Bool", 1);
                break;
            case "BottomKnob_Small_INC":
                break;
            case "BottomKnob_Small_DEC":
                break;
            case "BottomKnob_Push":
                break;
        }
    }
    com1EventCallback(_event) {
        switch (_event) {
            case "TopKnob_Large_INC":
                SimVar.SetSimVarValue("K:COM_RADIO_WHOLE_INC", "Bool", 1);
                break;
            case "TopKnob_Large_DEC":
                SimVar.SetSimVarValue("K:COM_RADIO_WHOLE_DEC", "Bool", 1);
                break;
            case "TopKnob_Small_INC":
                SimVar.SetSimVarValue("K:COM_RADIO_FRACT_INC", "Bool", 1);
                break;
            case "TopKnob_Small_DEC":
                SimVar.SetSimVarValue("K:COM_RADIO_FRACT_DEC", "Bool", 1);
                break;
            case "TopKnob_Push":
                this.setSelectedLine(3);
                break;
            case "TopKnob_Push_Long":
                SimVar.SetSimVarValue("K:COM_STBY_RADIO_SWAP", "Bool", 1);
                break;
            case "BottomKnob_Small_INC":
                break;
            case "BottomKnob_Small_DEC":
                break;
            case "BottomKnob_Push":
                break;
        }
    }
    com2EventCallback(_event) {
        switch (_event) {
            case "TopKnob_Large_INC":
                SimVar.SetSimVarValue("K:COM2_RADIO_WHOLE_INC", "Bool", 1);
                break;
            case "TopKnob_Large_DEC":
                SimVar.SetSimVarValue("K:COM2_RADIO_WHOLE_DEC", "Bool", 1);
                break;
            case "TopKnob_Small_INC":
                SimVar.SetSimVarValue("K:COM2_RADIO_FRACT_INC", "Bool", 1);
                break;
            case "TopKnob_Small_DEC":
                SimVar.SetSimVarValue("K:COM2_RADIO_FRACT_DEC", "Bool", 1);
                break;
            case "TopKnob_Push":
                this.setSelectedLine(2);
                break;
            case "TopKnob_Push_Long":
                SimVar.SetSimVarValue("K:COM2_RADIO_SWAP", "Bool", 1);
                break;
            case "BottomKnob_Small_INC":
                break;
            case "BottomKnob_Small_DEC":
                break;
            case "BottomKnob_Push":
                break;
        }
    }
    speakerEventCallback(_event) {
    }
    recorderEventCallback(_event) {
    }
    markerEventCallback(_event) {
    }
    adfEventCallback(_event) {
    }
    musicEventCallback(_event) {
    }
    clicksEventCallback(_event) {
    }

    back() {
        this.gps.goBack();
    }

    backHome() {
        this.gps.closePopUpElement();
        this.gps.SwitchToPageName(this.homePageParent, this.homePageName);
    }
}

class AS3000_TSC_FrequencyKeyboard extends NavSystemTouch_FrequencyKeyboard {
    _activateNavButtons() {
        this.gps.activateNavButton(1, "Cancel", this.cancelEdit.bind(this), false, "ICON_TSC_BUTTONBAR_BACK.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "ICON_TSC_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(6, "Enter", this.validateEdit.bind(this), true, "ICON_TSC_BUTTONBAR_ENTER.png");
    }

    _deactivateNavButtons() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
        this.gps.deactivateNavButton(6);
    }

    onFocusGained() {
        this._activateNavButtons();
    }

    onFocusLost() {
        this._deactivateNavButtons();
    }

    setContext(_title, _minFreq, _maxFreq, _activeFreqSimVar, _stbyFreqSimVar, _endCallback, _homePageParent, _homePageName, _frequencySpacingModeSimVar, _adf = false) {
        super.setContext(_title, _minFreq, _maxFreq, _activeFreqSimVar, _stbyFreqSimVar, _endCallback, "", _frequencySpacingModeSimVar);
        this.homePageParent = _homePageParent;
        this.homePageName = _homePageName;
        this.adf = _adf;
        this.unit = _adf ? "KHz" : "MHz";
        this.nbDigits = _adf ? 1 : 2;
    }

    onDigitPress(_digit) {
        if (this.adf) {
            if (this.inputIndex == -1) {
                this.inputIndex = 0;
                this.currentInput = this.minFreq;
            }
            if (this.inputIndex < 5) {
                let newInput = Math.pow(10, 4 - this.inputIndex) * Math.floor((this.currentInput + 0.001) / Math.pow(10, 4 - this.inputIndex)) + Math.pow(10, 3 - this.inputIndex) * _digit;
                if (newInput <= this.maxFreq && newInput >= this.minFreq) {
                    this.currentInput = newInput;
                    this.inputIndex++;
                }
                else if (newInput < this.minFreq && Math.pow(10, 3 - this.inputIndex) > this.minFreq - newInput) {
                    this.currentInput = this.minFreq;
                    this.inputIndex++;
                }
            }
            this.inputChanged = true;
        } else {
            super.onDigitPress(_digit);
        }
    }

    onBackSpacePress(_digit) {
        if (this.adf) {
            if (this.inputIndex > 0) {
                this.inputIndex--;
                this.currentInput = Math.pow(10, 4 - this.inputIndex) * Math.floor(this.currentInput / Math.pow(10, 4 - this.inputIndex));
                if (this.currentInput < this.minFreq) {
                    this.currentInput = this.minFreq;
                }
            }
            this.inputChanged = true;
        } else {
            super.onBackSpacePress(_digit);
        }
    }

    cancelEdit() {
        this.gps.goBack();
    }

    backHome() {
        this.gps.closePopUpElement();
        this.gps.SwitchToPageName(this.homePageParent, this.homePageName);
    }

    validateEdit() {
        let factor = this.adf ? 1 : 1000000;
        this.endCallback(this.inputIndex == -1 ? SimVar.GetSimVarValue(this.stbyFreqSimVar, this.unit) * factor : this.currentInput, false);
        this.cancelEdit();
    }

    validateAndTransferEdit() {
        let factor = this.adf ? 1 : 1000000;
        this.endCallback(this.inputIndex == -1 ? SimVar.GetSimVarValue(this.stbyFreqSimVar, this.unit) * factor: this.currentInput, true);
        this.cancelEdit();
    }
}

class AS3000_TSC_TimeKeyboard extends NavSystemTouch_TimeKeyboard {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.cancelEdit.bind(this), false, "ICON_TSC_BUTTONBAR_BACK.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "ICON_TSC_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(6, "Enter", this.validateEdit.bind(this), true, "ICON_TSC_BUTTONBAR_ENTER.png");
        this.gps.deactivateNavButton(5);
    }

    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
        this.gps.deactivateNavButton(6);
    }

    setContext(_endCallback, _startingValue, _homePageParent, _homePageName) {
        super.setContext(_endCallback, null, _startingValue);
        this.homePageParent = _homePageParent;
        this.homePageName = _homePageName;
    }

    cancelEdit() {
        this.gps.goBack();
    }

    backHome() {
        this.gps.closePopUpElement();
        this.gps.SwitchToPageName(this.homePageParent, this.homePageName);
    }
}

class AS3000_TSC_SpeedKeyboard extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.digits = [0, 0, 0];
        this.isInputing = false;
        this.nbInput = 0;
        this.inputChanged = true;
    }
    init(root) {
        this.window = root;
        this.backspaceButton = this.gps.getChildById("SK_Bksp");
        this.button_0 = this.gps.getChildById("SK_0");
        this.button_1 = this.gps.getChildById("SK_1");
        this.button_2 = this.gps.getChildById("SK_2");
        this.button_3 = this.gps.getChildById("SK_3");
        this.button_4 = this.gps.getChildById("SK_4");
        this.button_5 = this.gps.getChildById("SK_5");
        this.button_6 = this.gps.getChildById("SK_6");
        this.button_7 = this.gps.getChildById("SK_7");
        this.button_8 = this.gps.getChildById("SK_8");
        this.button_9 = this.gps.getChildById("SK_9");
        this.display = this.gps.getChildById("SK_Display");
        this.gps.makeButton(this.button_0, this.onDigitPress.bind(this, 0));
        this.gps.makeButton(this.button_1, this.onDigitPress.bind(this, 1));
        this.gps.makeButton(this.button_2, this.onDigitPress.bind(this, 2));
        this.gps.makeButton(this.button_3, this.onDigitPress.bind(this, 3));
        this.gps.makeButton(this.button_4, this.onDigitPress.bind(this, 4));
        this.gps.makeButton(this.button_5, this.onDigitPress.bind(this, 5));
        this.gps.makeButton(this.button_6, this.onDigitPress.bind(this, 6));
        this.gps.makeButton(this.button_7, this.onDigitPress.bind(this, 7));
        this.gps.makeButton(this.button_8, this.onDigitPress.bind(this, 8));
        this.gps.makeButton(this.button_9, this.onDigitPress.bind(this, 9));
        this.gps.makeButton(this.backspaceButton, this.onBackSpacePress.bind(this));
    }
    setContext(context) {
        this._context = context;
        this.currentInput = context.initialValue;
    }

    _activateNavButtons() {
        this.gps.activateNavButton(1, "Back", this.cancelEdit.bind(this), false, "ICON_TSC_BUTTONBAR_BACK.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "ICON_TSC_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(6, "Enter", this.validateEdit.bind(this), true, "ICON_TSC_BUTTONBAR_ENTER.png");
    }

    _deactivateNavButtons() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
        this.gps.deactivateNavButton(6);
    }

    onFocusGained() {
        this._activateNavButtons();
    }

    onFocusLost() {
        this._deactivateNavButtons();
    }

    onEnter() {
        this.window.setAttribute("state", "Active");
        this.isInputing = false;
        this.digits = [0, 0, 0];
    }
    onUpdate(_deltaTime) {
        if (this.isInputing) {
            if (this.inputChanged) {
                let text = "";
                for (let i = 0; i < this.digits.length - 1; i++) {
                    text += '<span class="' + (i < this.digits.length - this.nbInput ? "ToWrite" : "Writed") + '">';
                    text += this.digits[i];
                    text += '</span>';
                }
                text += '<span class="Writing">' + this.digits[this.digits.length - 1] + '</span>';
                this.inputChanged = false;
                this.display.innerHTML = text;
            }
        }
        else {
            this.display.innerHTML = (this.currentInput < 0 ? "---" : fastToFixed(this.currentInput, 0)) + "KT";
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    onDigitPress(_digit) {
        if (!this.isInputing) {
            this.isInputing = true;
            this.nbInput = 0;
            this.digits = [0, 0, 0];
        }
        if (this.digits[0] == 0) {
            for (let i = 0; i < this.digits.length - 1; i++) {
                this.digits[i] = this.digits[i + 1];
            }
        }
        this.digits[this.digits.length - 1] = _digit;
        this.currentInput = 100 * this.digits[0] + 10 * this.digits[1] + this.digits[2];
        this.inputChanged = true;
        if (this.nbInput < this.digits.length) {
            this.nbInput++;
        }
    }
    onBackSpacePress() {
        if (!this.isInputing) {
            this.isInputing = true;
            this.nbInput = 0;
            this.digits = [0, 0, 0];
        }
        for (let i = this.digits.length - 1; i > 0; i--) {
            this.digits[i] = this.digits[i - 1];
        }
        this.digits[0] = 0;
        this.currentInput = 100 * this.digits[0] + 10 * this.digits[1] + this.digits[2];
        this.inputChanged = true;
        if (this.nbInput > 0) {
            this.nbInput--;
        }
    }
    backHome() {
        this.gps.closePopUpElement();
        this.gps.SwitchToPageName(this._context.homePageGroup, this._context.homePageName);
    }
    cancelEdit() {
        this.gps.goBack();
    }
    validateEdit() {
        this._context.callback(this.currentInput);
        this.cancelEdit();
    }
}
class AS3000_TSC_TerrainAlert extends Warnings {
    constructor() {
        super(...arguments);
        this.lastAcknowledged = 0;
        this.lastActive = 0;
    }
    init(_root) {
        super.init(_root);
        this.window = _root;
        this.warning = this.gps.getChildById("Warning");
        this.warningContent = this.gps.getChildById("WarningContent");
        this.Warning_Ok = this.gps.getChildById("Warning_Ok");
        this.gps.makeButton(this.Warning_Ok, this.acknowledge.bind(this));
    }

    onFocusGained() {
    }

    onFocusLost() {
    }

    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        let warningIndex = SimVar.GetSimVarValue("L:AS1000_Warnings_WarningIndex", "number");
        if (warningIndex == 0) {
            this.lastAcknowledged = 0;
            this.lastActive = 0;
        }
        if (warningIndex > 0 && this.lastAcknowledged != warningIndex && this.warnings[warningIndex - 1].level > 1) {
            if (this.lastActive != warningIndex) {
                this.window.setAttribute("state", "Active");
                this.warning.setAttribute("state", (this.warnings[warningIndex - 1].level == 2 ? "Yellow" : "Red"));
                this.warningContent.innerHTML = this.warnings[warningIndex - 1].longText;
                this.lastActive = warningIndex;
            }
        }
        else {
            if (this.window.getAttribute("state") == "Active") {
                this.window.setAttribute("state", "Inactive");
                this.lastActive = 0;
            }
        }
    }
    onEnter() {
    }
    onExit() {
    }
    onEvent(_event) {
    }
    acknowledge() {
        this.lastAcknowledged = SimVar.GetSimVarValue("L:AS1000_Warnings_WarningIndex", "number");
    }
}
class AS3000_TSC_WaypointButtonElement {
    constructor() {
        this.base = window.document.createElement("div");
        this.base.setAttribute("class", "line");
        {
            this.button = window.document.createElement("div");
            this.button.setAttribute("class", "gradientButton");
            {
                this.ident = window.document.createElement("div");
                this.ident.setAttribute("class", "mainValue");
                this.button.appendChild(this.ident);
                this.name = window.document.createElement("div");
                this.name.setAttribute("class", "title");
                this.button.appendChild(this.name);
                this.symbol = window.document.createElement("img");
                this.symbol.setAttribute("class", "symbol");
                this.button.appendChild(this.symbol);
            }
            this.base.appendChild(this.button);
        }
    }
}
class AS3000_TSC_InsertBeforeWaypoint extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.elements = [];
    }
    init(root) {
        this.window = root;
        this.tableContainer = root.getElementsByClassName("Container")[0];
        this.table = this.tableContainer.getElementsByClassName("WayPoints")[0];
        this.endButtonLine = this.table.getElementsByClassName("EndButtonLine")[0];
        this.endButton = this.gps.getChildById("EndButton");
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.tableContainer;
        this.scrollElement.elementSize = (this.elements.length > 0 ? this.elements[1].base.getBoundingClientRect().height : 0);
        this.gps.makeButton(this.endButton, this.endButtonClick.bind(this));
    }
    onEnter() {
        this.gps.currFlightPlanManager.updateFlightPlan();
        this.window.setAttribute("state", "Active");
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "ICON_TSC_BUTTONBAR_BACK.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "ICON_TSC_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(5, "Up", this.scrollUp.bind(this), false, "ICON_TSC_BUTTONBAR_UP.png");
        this.gps.activateNavButton(6, "Down", this.scrollDown.bind(this), false, "ICON_TSC_BUTTONBAR_DOWN.png");
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = (this.elements.length > 0 ? this.elements[1].base.getBoundingClientRect().height : 0);
        }
        this.scrollElement.update();
        for (let i = 0; i < this.gps.currFlightPlanManager.getWaypointsCount(); i++) {
            if (this.elements.length < i + 1) {
                let newElem = new AS3000_TSC_WaypointButtonElement();
                this.gps.makeButton(newElem.button, this.elementClick.bind(this, i));
                this.table.insertBefore(newElem.base, this.endButtonLine);
                this.elements.push(newElem);
            }
            let infos = this.gps.currFlightPlanManager.getWaypoint(i).infos;
            Avionics.Utils.diffAndSet(this.elements[i].ident, infos.ident);
            Avionics.Utils.diffAndSet(this.elements[i].name, infos.name);
            let symbol = infos.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.elements[i].symbol, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
        }
        for (let i = this.gps.currFlightPlanManager.getWaypointsCount(); i < this.elements.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.elements[i].base, "state", "Inactive");
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
        this.gps.deactivateNavButton(1, true);
        this.gps.deactivateNavButton(2, true);
        this.gps.deactivateNavButton(4, true);
        this.gps.deactivateNavButton(6, true);
    }
    onEvent(_event) {
    }
    setContext(_endCallback) {
        this.endCallback = _endCallback;
    }
    elementClick(_index) {
        if (this.endCallback) {
            this.endCallback(_index);
        }
        this.gps.goBack();
    }
    endButtonClick() {
        this.elementClick(this.elements.length);
    }
    back() {
        this.gps.goBack();
        return true;
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
        this.gps.closePopUpElement();
        return true;
    }
    scrollUp() {
        this.scrollElement.scrollUp();
    }
    scrollDown() {
        this.scrollElement.scrollDown();
    }
}
class AS3000_TSC_Minimums extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.currentMode = 0;
        this.digits = [0, 0, 0, 0, 0];
        this.isEditing = false;
    }
    init(root) {
        this.typeButton = this.gps.getChildById("min_typeButton");
        this.typeButtonValue = this.typeButton.getElementsByClassName("lowerValue")[0];
        this.tempAtDestButton = this.gps.getChildById("min_tempAtDestButton");
        this.tempAtDestButtonValue = this.tempAtDestButton.getElementsByClassName("lowerValue")[0];
        this.display = this.gps.getChildById("min_Display");
        this.min_1 = this.gps.getChildById("min_1");
        this.min_2 = this.gps.getChildById("min_2");
        this.min_3 = this.gps.getChildById("min_3");
        this.min_4 = this.gps.getChildById("min_4");
        this.min_5 = this.gps.getChildById("min_5");
        this.min_6 = this.gps.getChildById("min_6");
        this.min_7 = this.gps.getChildById("min_7");
        this.min_8 = this.gps.getChildById("min_8");
        this.min_9 = this.gps.getChildById("min_9");
        this.min_0 = this.gps.getChildById("min_0");
        this.min_Bksp = this.gps.getChildById("min_Bksp");
        this.setMode(0);
        this.gps.makeButton(this.typeButton, this.openMinimumSourceSelection.bind(this));
        this.gps.makeButton(this.min_1, this.onDigitPress.bind(this, 1));
        this.gps.makeButton(this.min_2, this.onDigitPress.bind(this, 2));
        this.gps.makeButton(this.min_3, this.onDigitPress.bind(this, 3));
        this.gps.makeButton(this.min_4, this.onDigitPress.bind(this, 4));
        this.gps.makeButton(this.min_5, this.onDigitPress.bind(this, 5));
        this.gps.makeButton(this.min_6, this.onDigitPress.bind(this, 6));
        this.gps.makeButton(this.min_7, this.onDigitPress.bind(this, 7));
        this.gps.makeButton(this.min_8, this.onDigitPress.bind(this, 8));
        this.gps.makeButton(this.min_9, this.onDigitPress.bind(this, 9));
        this.gps.makeButton(this.min_0, this.onDigitPress.bind(this, 0));
        this.gps.makeButton(this.min_Bksp, this.onBkspPress.bind(this));
    }

    _activateNavButtons() {
        this.gps.activateNavButton(1, "Back", this.cancelEdit.bind(this), false, "ICON_TSC_BUTTONBAR_BACK.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "ICON_TSC_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(6, "Enter", this.validateEdit.bind(this), true, "ICON_TSC_BUTTONBAR_ENTER.png");
    }

    _deactivateNavButtons() {
        this.gps.deactivateNavButton(1, true);
        this.gps.deactivateNavButton(2, true);
        this.gps.deactivateNavButton(6, true);
    }

    onFocusGained() {
        this._activateNavButtons();
    }

    onFocusLost() {
        this._deactivateNavButtons();
    }

    onEnter() {
        this.isEditing = false;
    }

    onUpdate(_deltaTime) {
        if (this.isEditing) {
            let display = '<span class="ToWrite">';
            let zerosEnded = false;
            for (let i = 0; i < this.digits.length - 1; i++) {
                if (this.digits[i] != 0 && !zerosEnded) {
                    display += '</span><span class="Writed">';
                    zerosEnded = true;
                }
                display += this.digits[i].toString();
            }
            display += '</span><span class="Writing">' + this.digits[this.digits.length - 1] + '</span><span class="Writed">FT</span>';
            Avionics.Utils.diffAndSet(this.display, display);
        }
        else {
            let display = '<span class="Initial">';
            display += SimVar.GetSimVarValue("L:AS3000_MinimalsValue", "number");
            Avionics.Utils.diffAndSet(this.display, display + "FT</span>");
        }
    }

    onExit() {
    }

    onEvent(_event) {
    }

    onDigitPress(_digit) {
        if (!this.isEditing) {
            this.isEditing = true;
            this.digits = [0, 0, 0, 0, 0];
        }
        if (this.digits[0] == 0) {
            for (let i = 0; i < this.digits.length - 1; i++) {
                this.digits[i] = this.digits[i + 1];
            }
        }
        this.digits[this.digits.length - 1] = _digit;
    }
    onBkspPress() {
        if (!this.isEditing) {
            this.isEditing = true;
            this.digits = [0, 0, 0, 0, 0];
        }
        for (let i = this.digits.length - 1; i > 0; i--) {
            this.digits[i] = this.digits[i - 1];
        }
        this.digits[0] = 0;
    }
    openMinimumSourceSelection() {
        this.gps.minimumSource.element.setContext(this.setMode.bind(this));
        this.gps.switchToPopUpPage(this.gps.minimumSource);
    }
    setMode(_mode) {
        this.currentMode = _mode;
        Avionics.Utils.diffAndSetAttribute(this.tempAtDestButton, "state", (_mode == 2 ? "Active" : "Inactive"));
        let newValue = "";
        switch (_mode) {
            case 0:
                newValue = "Off";
                break;
            case 1:
                newValue = "Baro";
                break;
            case 2:
                newValue = "Temp Comp";
                break;
            case 3:
                newValue = "Radio Alt";
                break;
        }
        Avionics.Utils.diffAndSet(this.typeButtonValue, newValue);
    }
    cancelEdit() {
        this.gps.goBack();
    }
    backHome() {
        this.gps.SwitchToPageName("PFD", "PFD Home");
    }
    validateEdit() {
        if (this.isEditing) {
            let value = 0;
            for (let i = 0; i < this.digits.length; i++) {
                value += this.digits[i] * Math.pow(10, this.digits.length - i - 1);
            }
            SimVar.SetSimVarValue("L:AS3000_MinimalsValue", "number", value);
        }
        SimVar.SetSimVarValue("L:AS3000_MinimalsMode", "number", this.currentMode);
        this.cancelEdit();
    }
}

class AS3000_TSC_MinimumSource extends NavSystemElement {
    init(root) {
        this.window = root;
        this.minSource_Off = this.gps.getChildById("minSource_Off");
        this.minSource_Baro = this.gps.getChildById("minSource_Baro");
        this.minSource_TempComp = this.gps.getChildById("minSource_TempComp");
        this.minSource_RadioAlt = this.gps.getChildById("minSource_RadioAlt");
        this.gps.makeButton(this.minSource_Off, this.buttonClick.bind(this, 0));
        this.gps.makeButton(this.minSource_Baro, this.buttonClick.bind(this, 1));
        this.gps.makeButton(this.minSource_RadioAlt, this.buttonClick.bind(this, 3));
    }

    onFocusGained() {
    }

    onFocusLost() {
    }

    onEnter() {
        this.window.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    setContext(_callback) {
        this.callBack = _callback;
    }
    buttonClick(_source) {
        this.callBack(_source);
        this.gps.goBack();
    }
}
class AS3000_TSC_AirspeedReference {
    constructor(_valueButton, _statusElem, _refSpeed, _displayName) {
        this.isDisplayed = false;
        this.valueButton = _valueButton;
        this.valueElement = _valueButton.getElementsByClassName("mainValue")[0];
        this.valueSpan = _valueButton.getElementsByClassName("valueSpan")[0];
        this.unitSpan = _valueButton.getElementsByClassName("unitSpan")[0];
        this.statusElement = _statusElem;
        this.refSpeed = _refSpeed;
        this.displayedSpeed = _refSpeed;
        this.displayName = _displayName;
    }
}
class AS3000_TSC_ConfirmationWindow extends NavSystemElement {
    init(root) {
        this.window = this.gps.getChildById("ConfirmationWindow");
        this.text = this.gps.getChildById("CW_Text");
        this.button = this.gps.getChildById("CW_Button");
        this.buttonText = this.gps.getChildById("CW_ButtonText");
        this.gps.makeButton(this.button, this.onClick.bind(this));
    }

    onFocusGained() {
    }

    onFocusLost() {
    }

    onEnter() {
        this.window.setAttribute("state", "Inactive");
    }
    open(_text, _buttonText = "OK") {
        this.text.innerHTML = _text;
        this.buttonText.textContent = _buttonText;
        this.window.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
    onClick() {
        this.window.setAttribute("state", "Inactive");
    }
}
//# sourceMappingURL=AS3000_TSC_Common.js.map