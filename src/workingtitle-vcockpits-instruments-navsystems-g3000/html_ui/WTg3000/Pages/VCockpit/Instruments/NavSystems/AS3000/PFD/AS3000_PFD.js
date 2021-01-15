class AS3000_PFD extends NavSystem {
    constructor() {
        super();
        this.initDuration = 7000;

        this._icaoWaypointFactory = new WT_ICAOWaypointFactory();
        this._icaoSearchers = {
            airport: new WT_ICAOSearcher(this, WT_ICAOSearcher.Keys.AIRPORT),
            vor: new WT_ICAOSearcher(this, WT_ICAOSearcher.Keys.VOR),
            ndb: new WT_ICAOSearcher(this, WT_ICAOSearcher.Keys.NDB),
            int: new WT_ICAOSearcher(this, WT_ICAOSearcher.Keys.INT)
        };

        this._fpm = new WT_FlightPlanManager(this._icaoWaypointFactory);
        this._lastFPMSyncTime = 0;

        this._citySearcher = new WT_CitySearcher(AS3000_PFD.CITY_DATA_PATH);
    }

    get IsGlassCockpit() { return true; }

    get templateID() { return "AS3000_PFD"; }

    get facilityLoader() {
        return undefined;
    }

    /**
     * @readonly
     * @property {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @type {WT_ICAOWaypointFactory}
     */
    get icaoWaypointFactory() {
        return this._icaoWaypointFactory;
    }

    /**
     * @readonly
     * @property {{airport:WT_ICAOSearcher, vor:WT_ICAOSearcher, ndb:WT_ICAOSearcher, int:WT_ICAOSearcher}} icaoSearchers
     * @type {{airport:WT_ICAOSearcher, vor:WT_ICAOSearcher, ndb:WT_ICAOSearcher, int:WT_ICAOSearcher}}
     */
    get icaoSearchers() {
        return this._icaoSearchers;
    }

    /**
     * @readonly
     * @property {WT_FlightPlanManager} flightPlanManagerWT
     * @type {WT_FlightPlanManager}
     */
    get flightPlanManagerWT() {
        return this._fpm;
    }

    /**
     * @readonly
     * @property {WT_CitySearcher} citySearcher
     * @type {WT_CitySearcher}
     */
    get citySearcher() {
        return this._citySearcher;
    }

    connectedCallback() {
        super.connectedCallback();
        this.mainPage = new AS3000_PFD_MainPage();
        this.pageGroups = [
            new NavSystemPageGroup("Main", this, [
                this.mainPage
            ]),
        ];
        this.warnings = new PFD_Warnings();
        this.addIndependentElementContainer(new NavSystemElementContainer("InnerMap", "InnerMap", new AS3000_PFD_InnerMap("PFD", this.icaoWaypointFactory, this.icaoSearchers, this.flightPlanManagerWT, this.citySearcher)));
        this.addIndependentElementContainer(new NavSystemElementContainer("WindData", "WindData", new AS3000_PFD_WindData("PFD")));
        this.addIndependentElementContainer(new NavSystemElementContainer("Warnings", "Warnings", this.warnings));
        this.addIndependentElementContainer(new NavSystemElementContainer("SoftKeys", "SoftKeys", new SoftKeys(AS3000_PFD_SoftKeyHtmlElement)));
        this.maxUpdateBudget = 12;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    parseXMLConfig() {
        super.parseXMLConfig();
        let syntheticVision = null;
        let reversionaryMode = null;
        if (this.instrumentXmlConfig) {
            syntheticVision = this.instrumentXmlConfig.getElementsByTagName("SyntheticVision")[0];
            reversionaryMode = this.instrumentXmlConfig.getElementsByTagName("ReversionaryMode")[0];
        }
        if (!syntheticVision || syntheticVision.textContent == "True") {
            if (this.mainPage.attitude.svg) {
                this.mainPage.attitude.svg.setAttribute("background", "false");
            }
            this.getChildById("SyntheticVision").style.display = "block";
            this.mainPage.syntheticVision = true;
        }
        else {
            if (this.mainPage.attitude.svg) {
                this.mainPage.attitude.svg.setAttribute("background", "true");
            }
            this.getChildById("SyntheticVision").style.display = "none";
            this.mainPage.syntheticVision = false;
        }
        if (reversionaryMode && reversionaryMode.textContent == "True") {
            this.handleReversionaryMode = true;
        }
    }

    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (this.handleReversionaryMode) {
            this.reversionaryMode = false;
            if (document.body.hasAttribute("reversionary")) {
                var attr = document.body.getAttribute("reversionary");
                if (attr == "true") {
                    this.reversionaryMode = true;
                }
            }
        }
        this.icaoWaypointFactory.update();
        let currentTime = Date.now() / 1000;
        if (currentTime - this._lastFPMSyncTime >= AS3000_PFD.FLIGHT_PLAN_SYNC_INTERVAL) {
            this.flightPlanManagerWT.syncActiveFromGame();
            this._lastFPMSyncTime = currentTime;
        }
    }

    reboot() {
        super.reboot();
        if (this.warnings)
            this.warnings.reset();
        if (this.mainPage)
            this.mainPage.reset();
    }
}
AS3000_PFD.FLIGHT_PLAN_SYNC_INTERVAL = 2;
AS3000_PFD.CITY_DATA_PATH = "/WTg3000/SDK/Assets/Data/cities.json";

class AS3000_PFD_SoftKeyElement extends SoftKeyElement {
    constructor(_name = "", _callback = null, _statusCB = null, _valueCB = null, _stateCB = null) {
        super(_name, _callback, _stateCB);
        this.statusBarCallback = _statusCB;
        this.valueCallback = _valueCB;
    }
}
class AS3000_PFD_SoftKeyHtmlElement extends SoftKeyHtmlElement {
    constructor(_elem) {
        super(_elem);
        this.Element = _elem.getElementsByClassName("Title")[0];
        this.ValueElement = _elem.getElementsByClassName("Value")[0];
        this.StatusBar = _elem.getElementsByClassName("Status")[0];
    }
    fillFromElement(_elem) {
        super.fillFromElement(_elem);
        if (_elem.statusBarCallback == null) {
            Avionics.Utils.diffAndSetAttribute(this.StatusBar, "state", "None");
        }
        else {
            if (_elem.statusBarCallback()) {
                Avionics.Utils.diffAndSetAttribute(this.StatusBar, "state", "Active");
            }
            else {
                Avionics.Utils.diffAndSetAttribute(this.StatusBar, "state", "Inactive");
            }
        }
        if (_elem.valueCallback == null) {
            Avionics.Utils.diffAndSet(this.ValueElement, "");
        }
        else {
            Avionics.Utils.diffAndSet(this.ValueElement, _elem.valueCallback());
        }
    }
}

class AS3000_PFD_InnerMap extends NavSystemElement {
    constructor(instrumentID, icaoWaypointFactory, icaoSearchers, flightPlanManager, citySearcher) {
        super();

        this._instrumentID = instrumentID;
        this._isEnabled = false;

        this._navMap = new WT_G3x5_NavMap(instrumentID, icaoWaypointFactory, icaoSearchers, flightPlanManager, citySearcher, new WT_MapViewBorderData(), AS3000_PFD_InnerMap.LAYER_OPTIONS);

        this._initController();

        this._isInit = false;
    }

    _initController() {
        this._controller = new WT_DataStoreController(this.instrumentID, null);
        this._controller.addSetting(this._showSetting = new WT_G3x5_PFDInsetMapShowSetting(this._controller));
        this.showSetting.addListener(this._onShowSettingChanged.bind(this));

        this._controller.init();
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
     * @property {WT_G3x5NavMap} navMap
     * @type {WT_G3x5_NavMap}
     */
    get navMap() {
        return this._navMap;
    }

    /**
     * @readonly
     * @property {WT_G3x5_PFDInsetMapShowSetting} showSetting
     * @type {WT_G3x5_PFDInsetMapShowSetting}
     */
    get showSetting() {
        return this._showSetting;
    }

    _defineChildren(root) {
        this._mapContainer = this.gps.getChildById("InnerMap");
        this._mapContainer.style.display = "none";
    }

    _initNavMap(root) {
        this._navMap.init(root.querySelector(`.insetMap`));
    }

    init(root) {
        this._defineChildren(root);
        this._initNavMap(root);
        this._setEnabled(this.showSetting.getValue());
        this._isInit = true;
    }

    _onShowSettingChanged(setting, newValue, oldValue) {
        if (this._isInit) {
            this._setEnabled(newValue);
        }
    }

    _setEnabled(value) {
        if (value === this._isEnabled) {
            return;
        }

        this._mapContainer.style.display = value ? "block" : "none";
        this._isEnabled = value;
    }

    onUpdate(deltaTime) {
        if (this._isEnabled) {
            this._navMap.update();
        }
    }

    onEvent(event) {
    }
}
AS3000_PFD_InnerMap.LAYER_OPTIONS = {
    miniCompass: true,
    rangeDisplay: true,
    windData: false
};

class AS3000_PFD_WindData extends PFD_WindData {
    constructor(instrumentID) {
        super();

        this._instrumentID = instrumentID;

        this._initController();
    }

    _initController() {
        this._controller = new WT_DataStoreController(this.instrumentID, null);
        this._controller.addSetting(this._windModeSetting = new WT_G3x5_PFDWindModeSetting(this._controller));
        this.windModeSetting.addListener(this._onWindModeSettingChanged.bind(this));

        this._controller.init();
        this._setWindMode(this.windModeSetting.getValue());
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
     * @property {WT_G3x5_PFDWindModeSetting} windModeSetting
     * @type {WT_G3x5_PFDWindModeSetting}
     */
    get windModeSetting() {
        return this._windModeSetting;
    }

    _setWindMode(value) {
        this.mode = value;
    }

    _onWindModeSettingChanged(setting, newValue, oldValue) {
        this._setWindMode(newValue);
    }

    onEvent(event) {
    }
}

class AS3000_PFD_MainPage extends NavSystemPage {
    constructor() {
        super("Main", "Mainframe", new AS3000_PFD_MainElement());
        this.rootMenu = new SoftKeysMenu();
        this.pfdMenu = new SoftKeysMenu();
        this.pfdMapMenu = new SoftKeysMenu();
        this.pfdMapLayoutMenu = new SoftKeysMenu();
        this.attitudeMenu = new SoftKeysMenu();
        this.otherPfdMenu = new SoftKeysMenu();
        this.windMenu = new SoftKeysMenu();
        this.altUnitsMenu = new SoftKeysMenu(); //ADDED G3000 MOD ADD new softkeymenu for change of BARO UNIT
        this.annunciations = new PFD_Annunciations();
        this.attitude = new AS3000_PFD_Attitude("PFD");
        this.mapInstrument = new MapInstrumentElement();
        this.aoaIndicator = new AS3000_PFD_AngleOfAttackIndicator("PFD");
        this.altimeter = new AS3000_PFD_Altimeter("PFD");
        this.element = new NavSystemElementGroup([
            this.attitude,
            new PFD_Airspeed(),
            this.altimeter,
            this.annunciations,
            new PFD_Compass(),
            new PFD_NavStatus(),
            new AS3000_PFD_BottomInfos(),
            new AS3000_PFD_ActiveCom(),
            new AS3000_PFD_ActiveNav(),
            new AS3000_PFD_NavStatus(),
            this.aoaIndicator,
            this.mapInstrument,
            new PFD_AutopilotDisplay(),
            new PFD_Minimums(),
            new PFD_RadarAltitude(),
            new PFD_MarkerBeacon()
        ]);
    }

    init() {
        super.init();
        this.hsi = this.gps.getChildById("Compass");
        /**
         * @type {AS3000_PFD_WindData}
         */
        this.wind = this.gps.getElementOfType(AS3000_PFD_WindData);
        this.mapInstrument.setGPS(this.gps);
        /**
         * @type {AS3000_PFD_InnerMap}
         */
        this.innerMap = this.gps.getElementOfType(AS3000_PFD_InnerMap);
        //this.attitude.svg.setAttribute("background", "false");

        this.rootMenu.elements = [
            new AS3000_PFD_SoftKeyElement("Map Range-", this.changeMapRange.bind(this, -1), null, null, this._getInsetMapSoftkeyState.bind(this)),
            new AS3000_PFD_SoftKeyElement("Map Range+", this.changeMapRange.bind(this, 1), null, null, this._getInsetMapSoftkeyState.bind(this)),
            new AS3000_PFD_SoftKeyElement("PFD Map Settings", this.switchToMenu.bind(this, this.pfdMapMenu)),
            new AS3000_PFD_SoftKeyElement("Traffic Inset", null, this.constElement.bind(this, false)),
            new AS3000_PFD_SoftKeyElement("PFD Settings", this.switchToMenu.bind(this, this.pfdMenu)),
            new AS3000_PFD_SoftKeyElement("OBS"),
            new AS3000_PFD_SoftKeyElement("Active&nbsp;NAV", this.gps.computeEvent.bind(this.gps, "SoftKey_CDI"), null, this.navStatus.bind(this)),
            new AS3000_PFD_SoftKeyElement("Sensors"),
            new AS3000_PFD_SoftKeyElement("WX Radar Controls"),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("")
        ];
        this.pfdMenu.elements = [
            new AS3000_PFD_SoftKeyElement("Attitude Overlays", this.switchToMenu.bind(this, this.attitudeMenu)),
            new AS3000_PFD_SoftKeyElement("PFD Mode", null, null, this.constElement.bind(this, "FULL")),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Bearing 1", this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_BRG1"), null, this.bearing1Status.bind(this)),
            new AS3000_PFD_SoftKeyElement("Bearing 2", this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_BRG2"), null, this.bearing2Status.bind(this)),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Other PFD Settings", this.switchToMenu.bind(this, this.otherPfdMenu)),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Back", this.switchToMenu.bind(this, this.rootMenu)),
            new AS3000_PFD_SoftKeyElement("")
        ];
        this.pfdMapMenu.elements = [
            new AS3000_PFD_SoftKeyElement("Map Layout", this.switchToMenu.bind(this, this.pfdMapLayoutMenu)),
            new AS3000_PFD_SoftKeyElement("Detail", this.toggleDCLTR.bind(this), null, this.getDCLTRValue.bind(this), this._getInsetMapSoftkeyState.bind(this)),
            new AS3000_PFD_SoftKeyElement("Weather Legend"),
            new AS3000_PFD_SoftKeyElement("Traffic"),
            new AS3000_PFD_SoftKeyElement("Storm-scope"),
            new AS3000_PFD_SoftKeyElement("Terrain", this.toggleTerrain.bind(this), null, this.getTerrainValue.bind(this), this._getInsetMapSoftkeyState.bind(this)),
            new AS3000_PFD_SoftKeyElement("Data Link Settings"),
            new AS3000_PFD_SoftKeyElement("WX&nbsp;Overlay", this.toggleWX.bind(this), null, this.getWXOverlayValue.bind(this), this._getInsetMapSoftkeyState.bind(this)),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("METAR"),
            new AS3000_PFD_SoftKeyElement("Back", this.switchToMenu.bind(this, this.rootMenu)),
            new AS3000_PFD_SoftKeyElement("")
        ];
        this.pfdMapLayoutMenu.elements = [
            new AS3000_PFD_SoftKeyElement("Map Off", this._deactivateInsetMap.bind(this), this._insetMapCompare.bind(this, false)),
            new AS3000_PFD_SoftKeyElement("Inset Map", this._activateInsetMap.bind(this), this._insetMapCompare.bind(this, true)),
            new AS3000_PFD_SoftKeyElement("HSI Map", null, this.constElement.bind(this, false)),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Inset Traffic"),
            new AS3000_PFD_SoftKeyElement("HSI Traffic"),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Back", this.switchToMenu.bind(this, this.pfdMapMenu)),
            new AS3000_PFD_SoftKeyElement("")
        ];
        this.attitudeMenu.elements = [
            new AS3000_PFD_SoftKeyElement("Pathways"),
            new AS3000_PFD_SoftKeyElement("Synthetic Terrain", this._toggleSyntheticVision.bind(this), this._softkeySyntheticVisionCompare.bind(this, true)),
            new AS3000_PFD_SoftKeyElement("Horizon Heading"),
            new AS3000_PFD_SoftKeyElement("Airport Signs"),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Back", this.switchToMenu.bind(this, this.pfdMenu)),
            new AS3000_PFD_SoftKeyElement("")
        ];
        this.otherPfdMenu.elements = [
            new AS3000_PFD_SoftKeyElement("Wind", this.switchToMenu.bind(this, this.windMenu)),
            new AS3000_PFD_SoftKeyElement("AOA", this._cycleAoAMode.bind(this), null, this._softkeyAoAStatus.bind(this)),
            new AS3000_PFD_SoftKeyElement("Altitude Units", this.switchToMenu.bind(this, this.altUnitsMenu)),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("COM1 121.5", null, this.constElement.bind(this, false)),
            new AS3000_PFD_SoftKeyElement("Back", this.switchToMenu.bind(this, this.rootMenu)),
            new AS3000_PFD_SoftKeyElement("")
        ];
        this.windMenu.elements = [
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Option 1", this._setWindMode.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OPTION_1), this._softkeyWindModeCompare.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OPTION_1)),
            new AS3000_PFD_SoftKeyElement("Option 2", this._setWindMode.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OPTION_2), this._softkeyWindModeCompare.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OPTION_2)),
            new AS3000_PFD_SoftKeyElement("Option 3", this._setWindMode.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OPTION_3), this._softkeyWindModeCompare.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OPTION_3)),
            new AS3000_PFD_SoftKeyElement("Off", this._setWindMode.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OFF), this._softkeyWindModeCompare.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OFF)),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Back", this.switchToMenu.bind(this, this.otherPfdMenu)),
            new AS3000_PFD_SoftKeyElement("")
        ];
        //ADD START*** G3000 MOD ADD new softkeymenu for change of BARO UNIT
        this.altUnitsMenu.elements = [
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("METERS"),
            new AS3000_PFD_SoftKeyElement("IN", this._setBaroUnit.bind(this, WT_G3x5_PFDBaroUnitsSetting.Mode.IN_HG), this._softkeyBaroUnitCompare.bind(this, WT_G3x5_PFDBaroUnitsSetting.Mode.IN_HG)),
            new AS3000_PFD_SoftKeyElement("HPA", this._setBaroUnit.bind(this, WT_G3x5_PFDBaroUnitsSetting.Mode.HPA), this._softkeyBaroUnitCompare.bind(this, WT_G3x5_PFDBaroUnitsSetting.Mode.HPA)),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Back", this.switchToMenu.bind(this, this.otherPfdMenu)),
            new AS3000_PFD_SoftKeyElement("")
        ];
        //ADD END***  G3000 MOD ADD new softkeymenu for change of BARO UNIT
        this.softKeys = this.rootMenu;
    }

    onUpdate(_deltaTime) {
    }

    reset() {
        if (this.annunciations)
            this.annunciations.reset();
    }

    switchToMenu(_menu) {
        this.softKeys = _menu;
    }

    constElement(_elem) {
        return _elem;
    }

    // PFD inset map softkeys should be greyed out if the map is not shown.
    _getInsetMapSoftkeyState() {
        if (this.innerMap.showSetting.getValue()) {
            return "None";
        } else {
            return "Greyed";
        }
    }

    changeMapRange(delta) {
        let currentIndex = WT_MapController.getSettingValue(this.innerMap.navMap.instrumentID, WT_MapRangeSetting.KEY_DEFAULT);
        let newIndex = Math.max(Math.min(currentIndex + delta, WT_G3x5_NavMap.MAP_RANGE_LEVELS.length - 1), 0);
        this.innerMap.navMap.rangeSetting.setValue(newIndex);
    }

    _activateInsetMap() {
        this.innerMap.showSetting.setValue(true);
    }

    _deactivateInsetMap() {
        this.innerMap.showSetting.setValue(false);
    }

    _insetMapCompare(value) {
        return this.innerMap.showSetting.getValue() === value;
    }

    toggleDCLTR() {
        if (this.innerMap.isEnabled()) {
            let currentValue = this.innerMap.navMap.dcltrSetting.getValue();
            let newValue = (currentValue + 1) % WT_G3x5_NavMap.DCLTR_DISPLAY_TEXTS.length;
            this.innerMap.navMap.dcltrSetting.setValue(newValue);
        }
    }

    getDCLTRValue() {
        return WT_G3x5_NavMap.DCLTR_DISPLAY_TEXTS[this.innerMap.navMap.dcltrSetting.getValue()];
    }

    toggleTerrain() {
        if (this.innerMap.isEnabled()) {
            let currentValue = this.innerMap.navMap.terrainSetting.getValue();
            let newValue = (currentValue + 1) % WT_G3x5_NavMap.TERRAIN_MODE_DISPLAY_TEXT.length;
            this.innerMap.navMap.terrainSetting.setValue(newValue);
        }
    }

    getTerrainValue() {
        return WT_G3x5_NavMap.TERRAIN_MODE_DISPLAY_TEXT[this.innerMap.navMap.terrainSetting.getValue()];
    }

    toggleWX() {
        if (this.innerMap.isEnabled()) {
            this.innerMap.navMap.nexradShowSetting.setValue(!this.innerMap.navMap.nexradShowSetting.getValue());
        }
    }

    getWXOverlayValue() {
        return this.innerMap.navMap.nexradShowSetting.getValue() ? "NEXRAD" : "OFF";
    }

    _toggleSyntheticVision() {
        this.attitude.svtShowSetting.setValue(!this.attitude.svtShowSetting.getValue());
    }

    _softkeySyntheticVisionCompare(_val) {
        return this.attitude.syntheticVisionEnabled == _val;
    }

    bearing1Status() {
        if (this.hsi && this.hsi.getAttribute("show_bearing1") == "true") {
            return this.hsi.getAttribute("bearing1_source");
        }
        else {
            return "OFF";
        }
    }
    bearing2Status() {
        if (this.hsi && this.hsi.getAttribute("show_bearing2") == "true") {
            return this.hsi.getAttribute("bearing2_source");
        }
        else {
            return "OFF";
        }
    }
    navStatus() {
        return this.hsi.getAttribute("nav_source");
    }

    _setWindMode(mode) {
        this.wind.windModeSetting.setValue(mode);
    }

    _softkeyWindModeCompare(value) {
        return this.wind.getCurrentMode() === value;
    }

    _cycleAoAMode() {
        let value = this.aoaIndicator.aoaModeSetting.getValue();
        value = (value + 1) % AS3000_PFD_MainPage.AOA_MODE_TEXT.length;
        this.aoaIndicator.aoaModeSetting.setValue(value);
    }

    _softkeyAoAStatus() {
        return AS3000_PFD_MainPage.AOA_MODE_TEXT[this.aoaIndicator.getMode()];
    }

    _setBaroUnit(value) {
        this.altimeter.baroUnitsSetting.setValue(value);
    }

    _softkeyBaroUnitCompare(value) {
        return this.altimeter.getBaroUnitsMode() === value;
    }
}
AS3000_PFD_MainPage.AOA_MODE_TEXT = [
    "OFF",
    "ON",
    "AUTO"
];

class AS3000_PFD_MainElement extends NavSystemElement {
    init(root) {
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
}

class AS3000_PFD_Attitude extends PFD_Attitude {
    constructor(instrumentID) {
        super();

        this._instrumentID = instrumentID;

        this._initController();
    }

    _initController() {
        this._controller = new WT_DataStoreController(this.instrumentID, null);
        this._controller.addSetting(this._svtShowSetting = new WT_G3x5_PFDSVTShowSetting(this._controller));
        this.svtShowSetting.addListener(this._onSVTShowSettingChanged.bind(this));

        this._controller.init();
        this._setSVTShow(this.svtShowSetting.getValue());
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
     * @property {WT_G3x5_PFDSVTShowSetting} svtShowSetting
     * @type {WT_G3x5_PFDSVTShowSetting}
     */
    get svtShowSetting() {
        return this._svtShowSetting;
    }

    get syntheticVisionEnabled() {
        return this._syntheticVisionEnabled;
    }

    set syntheticVisionEnabled(enabled) {
    }

    init(root) {
        this.svg = this.gps.getChildById("Horizon");
    }

    _setSVTShow(value) {
        this._syntheticVisionEnabled = value;
    }

    _onSVTShowSettingChanged(setting, newValue, oldValue) {
        this._setSVTShow(newValue);
    }
}

class AS3000_PFD_Altimeter extends PFD_Altimeter {
    constructor(instrumentID) {
        super();

        this._instrumentID = instrumentID;

        this._isInit = false;

        this._initController();
    }

    _initController() {
        this._controller = new WT_DataStoreController(this.instrumentID, null);
        this._controller.addSetting(this._baroUnitsSetting = new WT_G3x5_PFDBaroUnitsSetting(this._controller));
        this.baroUnitsSetting.addListener(this._onBaroUnitsSettingChanged.bind(this));

        this._controller.init();
        this._baroUnits = this.baroUnitsSetting.getValue();
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
     * @property {WT_G3x5_PFDBaroUnitsSetting} baroUnitsSetting
     * @type {WT_G3x5_PFDBaroUnitsSetting}
     */
    get baroUnitsSetting() {
        return this._baroUnitsSetting;
    }

    getBaroUnitsMode() {
        return this._baroUnits;
    }

    init(root) {
        super.init(root);

        this._updateBaroUnits();
        this._isInit = true;
    }

    _updateBaroUnits() {
        this.altimeterElement.setAttribute("baro-mode", this._baroUnits === WT_G3x5_PFDBaroUnitsSetting.Mode.IN_HG ? "IN" : "HPA");
    }

    _setBaroUnits(value) {
        if (this._baroUnits === value) {
            return;
        }

        this._baroUnits = value;
        if (this._isInit) {
            this._updateBaroUnits();
        }
    }

    _onBaroUnitsSettingChanged(setting, newValue, oldValue) {
        this._setBaroUnits(newValue);
    }
}

class AS3000_PFD_Compass extends PFD_Compass {
    onEvent(_event) {
        super.onEvent(_event);
    }
}
class AS3000_PFD_BottomInfos extends NavSystemElement {
    init(root) {
        this.tas = this.gps.getChildById("TAS_Value");
        this.oat = this.gps.getChildById("OAT_Value");
        this.gs = this.gps.getChildById("GS_Value");
        this.isa = this.gps.getChildById("ISA_Value");
        this.timer = this.gps.getChildById("TMR_Value");
        this.utcTime = this.gps.getChildById("UTC_Value");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        Avionics.Utils.diffAndSet(this.tas, fastToFixed(Simplane.getTrueSpeed(), 0) + "KT");
        Avionics.Utils.diffAndSet(this.oat, fastToFixed(SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius"), 0) + "°C");
        Avionics.Utils.diffAndSet(this.gs, fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), 0) + "KT");
        Avionics.Utils.diffAndSet(this.isa, fastToFixed(SimVar.GetSimVarValue("STANDARD ATM TEMPERATURE", "celsius"), 0) + "°C");
        Avionics.Utils.diffAndSet(this.utcTime, Utils.SecondsToDisplayTime(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"), true, true, false));
        Avionics.Utils.diffAndSet(this.timer, Utils.SecondsToDisplayTime(SimVar.GetSimVarValue("L:AS3000_" + this.gps.urlConfig.index + "_Timer_Value", "number") / 1000, true, true, false));
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS3000_PFD_ActiveCom extends NavSystemElement {
    init(root) {
        this.activeCom = this.gps.getChildById("ActiveCom");
        this.activeComFreq = this.gps.getChildById("ActiveComFreq");
        this.activeComName = this.gps.getChildById("ActiveComName");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        Avionics.Utils.diffAndSet(this.activeComFreq, this.gps.frequencyFormat(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:1", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? 2 : 3));
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS3000_PFD_ActiveNav extends NavSystemElement {
    init(root) {
        this.NavInfos = this.gps.getChildById("NavFreqInfos");
        this.ActiveNav = this.gps.getChildById("ActiveNav");
        this.ActiveNavFreq = this.gps.getChildById("ActiveNavFreq");
        this.ActiveNavName = this.gps.getChildById("ActiveNavName");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (!SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
            Avionics.Utils.diffAndSetAttribute(this.NavInfos, "state", "Visible");
            let index = SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "number");
            Avionics.Utils.diffAndSet(this.ActiveNav, "NAV" + index);
            Avionics.Utils.diffAndSet(this.ActiveNavFreq, this.gps.frequencyFormat(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:" + index, "MHz"), 2));
            Avionics.Utils.diffAndSet(this.ActiveNavName, SimVar.GetSimVarValue("NAV SIGNAL:" + index, "number") > 0 ? SimVar.GetSimVarValue("NAV IDENT:" + index, "string") : "");
        }
        else {
            Avionics.Utils.diffAndSetAttribute(this.NavInfos, "state", "Inactive");
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS3000_PFD_NavStatus extends PFD_NavStatus {
    init(root) {
        this.currentLegFrom = this.gps.getChildById("FromWP");
        this.currentLegSymbol = this.gps.getChildById("LegSymbol");
        this.currentLegTo = this.gps.getChildById("ToWP");
        this.currentLegDistance = this.gps.getChildById("DisValue");
        this.currentLegBearing = this.gps.getChildById("BrgValue");
    }
}
class AS3000_PFD_AngleOfAttackIndicator extends NavSystemElement {
    constructor(instrumentID) {
        super();

        this._instrumentID = instrumentID;

        this._isInit = false;

        this._initController();
    }

    _initController() {
        this._controller = new WT_DataStoreController(this.instrumentID, null);
        this._controller.addSetting(this._aoaModeSetting = new WT_G3x5_PFDAoAModeSetting(this._controller));
        this.aoaModeSetting.addListener(this._onAoAModeSettingChanged.bind(this));

        this._controller.init();
        this._mode = this.aoaModeSetting.getValue();
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
     * @property {WT_G3x5_PFDAoAModeSetting} aoaModeSetting
     * @type {WT_G3x5_PFDAoAModeSetting}
     */
    get aoaModeSetting() {
        return this._aoaModeSetting;
    }

    getMode() {
        return this._mode;
    }

    init(root) {
        this._aoaElement = this.gps.getChildById("AoA");

        this._updateMode();
        this._isInit = true;
    }

    _onAoAModeSettingChanged(setting, newValue, oldValue) {
        this._setAoAMode(newValue);
    }

    _updateMode() {
        let shouldShow = this._mode !== WT_G3x5_PFDAoAModeSetting.Mode.OFF;
        this._aoaElement.style.display = shouldShow ? "block" : "none";
    }

    _setAoAMode(mode) {
        if (mode === this._mode) {
            return;
        }

        this._mode = mode;
        if (this._isInit) {
            this._updateMode();
        }
    }

    onEnter() {
    }

    onUpdate(deltaTime) {
        this._aoaElement.setAttribute("aoa", Math.min(Math.max(Simplane.getAngleOfAttack(), 0), 16).toString());
    }

    onExit() {
    }

    onEvent(event) {
    }
}
registerInstrument("as3000-pfd-element", AS3000_PFD);
//# sourceMappingURL=AS3000_PFD.js.map