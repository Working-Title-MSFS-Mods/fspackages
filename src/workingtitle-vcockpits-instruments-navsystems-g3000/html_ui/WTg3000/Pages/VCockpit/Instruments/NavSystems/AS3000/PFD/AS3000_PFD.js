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
        this.addIndependentElementContainer(new NavSystemElementContainer("WindData", "WindData", new PFD_WindData()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Warnings", "Warnings", this.warnings));
        this.addIndependentElementContainer(new NavSystemElementContainer("SoftKeys", "SoftKeys", new SoftKeys(AS3000_PFD_SoftKeyHtmlElement)));
        this.maxUpdateBudget = 12;

        Include.addScript("/JS/debug.js", function () {
            g_modDebugMgr.AddConsole(null);
        });
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

        this.gpsWasInReversionaryMode = false;
        this.enabled = true;

        this._navMap = new WT_G3x5NavMap(instrumentID, icaoWaypointFactory, icaoSearchers, flightPlanManager, citySearcher, AS3000_PFD_InnerMap.LAYER_OPTIONS);
    }

    /**
     * @readonly
     * @property {WT_G3x5NavMap} navMap
     * @type {WT_G3x5NavMap}
     */
    get navMap() {
        return this._navMap;
    }

    init(root) {
        this._navMap.init(root.querySelector(`.insetMap`));
        this.mapContainer = this.gps.getChildById("InnerMap");
    }

    onUpdate(deltaTime) {
        if (this.enabled) {
            this._navMap.update();
        }

        if (this.gps.isInReversionaryMode() != this.gpsWasInReversionaryMode) {
            this.gpsWasInReversionaryMode = this.gps.isInReversionaryMode();
            this.gps.requestCall(() => {
                this.mapContainer.style.display = "Block";
                if (this.instrument)
                    this.instrument.resize();
            });
        }
    }

    onEvent(event) {
        if (event == "SoftKeys_InsetOn") {
            this.enabled = true;
            this.mapContainer.style.display = "Block";
        }
        if (event == "SoftKeys_InsetOff") {
            this.mapContainer.style.display = "None";
            this.enabled = false;
        }
    }

    isEnabled() {
        return this.enabled;
    }
}
AS3000_PFD_InnerMap.LAYER_OPTIONS = {
    miniCompass: true,
    rangeDisplay: true,
    windData: false
};

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
        this.attitude = new PFD_Attitude();
        this.mapInstrument = new MapInstrumentElement();
        this.aoaIndicator = new AS3000_PFD_AngleOfAttackIndicator();
        this.altimeter = new PFD_Altimeter();
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
        this.wind = this.gps.getElementOfType(PFD_WindData);
        this.mapInstrument.setGPS(this.gps);
        /**
         * @type {AS3000_PFD_InnerMap}
         */
        this.innerMap = this.gps.getElementOfType(AS3000_PFD_InnerMap);
        //this.attitude.svg.setAttribute("background", "false");

        this.rootMenu.elements = [
            new AS3000_PFD_SoftKeyElement("Map Range-", this.changeMapRange.bind(this, -1), null, null, this.getInsetMapSoftkeyState.bind(this)),
            new AS3000_PFD_SoftKeyElement("Map Range+", this.changeMapRange.bind(this, 1), null, null, this.getInsetMapSoftkeyState.bind(this)),
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
            new AS3000_PFD_SoftKeyElement("Detail", this.toggleDCLTR.bind(this), null, this.getDCLTRValue.bind(this), this.getInsetMapSoftkeyState.bind(this)),
            new AS3000_PFD_SoftKeyElement("Weather Legend"),
            new AS3000_PFD_SoftKeyElement("Traffic"),
            new AS3000_PFD_SoftKeyElement("Storm-scope"),
            new AS3000_PFD_SoftKeyElement("Terrain", this.toggleTerrain.bind(this), null, this.getTerrainValue.bind(this), this.getInsetMapSoftkeyState.bind(this)),
            new AS3000_PFD_SoftKeyElement("Data Link Settings"),
            new AS3000_PFD_SoftKeyElement("WX&nbsp;Overlay", this.toggleWX.bind(this), null, this.getWXOverlayValue.bind(this), this.getInsetMapSoftkeyState.bind(this)),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("METAR"),
            new AS3000_PFD_SoftKeyElement("Back", this.switchToMenu.bind(this, this.rootMenu)),
            new AS3000_PFD_SoftKeyElement("")
        ];
        this.pfdMapLayoutMenu.elements = [
            new AS3000_PFD_SoftKeyElement("Map Off", this.deactivateInsetMap.bind(this), this.insetMapCompare.bind(this, false)),
            new AS3000_PFD_SoftKeyElement("Inset Map", this.activateInsetMap.bind(this), this.insetMapCompare.bind(this, true)),
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
            new AS3000_PFD_SoftKeyElement("Synthetic Terrain", this.toggleSyntheticVision.bind(this), this.syntheticVisionCompare.bind(this, true)),
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
            new AS3000_PFD_SoftKeyElement("AOA", this.gps.computeEvent.bind(this.gps, "SoftKey_PFD_AoAMode"), null, this.aoaStatus.bind(this)),
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
            new AS3000_PFD_SoftKeyElement("Option 1", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_O1"), this.windModeCompare.bind(this, "1")),
            new AS3000_PFD_SoftKeyElement("Option 2", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_O2"), this.windModeCompare.bind(this, "2")),
            new AS3000_PFD_SoftKeyElement("Option 3", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_O3"), this.windModeCompare.bind(this, "3")),
            new AS3000_PFD_SoftKeyElement("Off", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_Off"), this.windModeCompare.bind(this, "0")),
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
            new AS3000_PFD_SoftKeyElement("IN", this.setBaroUnit.bind(this, 0), this.softkeyBaroStatus.bind(this, "IN")),
            new AS3000_PFD_SoftKeyElement("HPA", this.setBaroUnit.bind(this, 1), this.softkeyBaroStatus.bind(this, "HPA")),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Back", this.switchToMenu.bind(this, this.otherPfdMenu)),
            new AS3000_PFD_SoftKeyElement("")
        ];
        //ADD END***  G3000 MOD ADD new softkeymenu for change of BARO UNIT
        this.softKeys = this.rootMenu;
    }

    onUpdate(_deltaTime) {
        this.updateSVT();
        this.updateBaroUnit();
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
    getInsetMapSoftkeyState() {
        if (this.innerMap.isEnabled()) {
            return "None";
        } else {
            return "Greyed";
        }
    }

    changeMapRange(delta) {
        let currentIndex = WT_MapController.getSettingValue(this.innerMap.navMap.instrumentID, WT_MapRangeSetting.KEY_DEFAULT);
        let newIndex = Math.max(Math.min(currentIndex + delta, WT_G3x5NavMap.MAP_RANGE_LEVELS.length - 1), 0);
        this.innerMap.navMap.rangeSetting.setValue(newIndex);
    }

    activateInsetMap() {
        this.gps.computeEvent("SoftKeys_InsetOn");
    }

    deactivateInsetMap() {
        this.gps.computeEvent("SoftKeys_InsetOff");
    }

    insetMapCompare(_comparison) {
        return this.innerMap.isEnabled() == _comparison;
    }

    toggleDCLTR() {
        if (this.innerMap.isEnabled()) {
            let currentValue = this.innerMap.navMap.dcltrSetting.getValue();
            let newValue = (currentValue + 1) % WT_G3x5NavMap.DCLTR_DISPLAY_TEXTS.length;
            this.innerMap.navMap.dcltrSetting.setValue(newValue);
        }
    }

    getDCLTRValue() {
        return WT_G3x5NavMap.DCLTR_DISPLAY_TEXTS[this.innerMap.navMap.dcltrSetting.getValue()];
    }

    toggleTerrain() {
        if (this.innerMap.isEnabled()) {
            let currentValue = this.innerMap.navMap.terrainSetting.getValue();
            let newValue = (currentValue + 1) % WT_G3x5NavMap.TERRAIN_MODE_DISPLAY_TEXT.length;
            this.innerMap.navMap.terrainSetting.setValue(newValue);
        }
    }

    getTerrainValue() {
        return WT_G3x5NavMap.TERRAIN_MODE_DISPLAY_TEXT[this.innerMap.navMap.terrainSetting.getValue()];
    }

    toggleWX() {
        if (this.innerMap.isEnabled()) {
            this.innerMap.navMap.nexradShowSetting.setValue(!this.innerMap.navMap.nexradShowSetting.getValue());
        }
    }

    getWXOverlayValue() {
        return this.innerMap.navMap.nexradShowSetting.getValue() ? "NEXRAD" : "OFF";
    }

    toggleSyntheticVision() {
        AS3000_PFD_MainPage.setSettingVar(AS3000_PFD_MainPage.VARNAME_SVT_SHOW, AS3000_PFD_MainPage.getSettingVar(AS3000_PFD_MainPage.VARNAME_SVT_SHOW) ^ 1);
    }

    syntheticVisionCompare(_val) {
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
    windModeCompare(_comparison) {
        return this.wind.getCurrentMode() == _comparison;
    }
    aoaStatus() {
        switch (this.aoaIndicator.AoaMode) {
            case 0:
                return "OFF";
                break;
            case 1:
                return "ON";
                break;
            case 2:
                return "AUTO";
                break;
        }
    }

    setBaroUnit(value) {
        AS3000_PFD_MainPage.setSettingVar(AS3000_PFD_MainPage.VARNAME_BARO_UNIT, value);
    }

    //ADD START*** G3000 MOD ADD new softkeymenu for change of BARO UNIT
    softkeyBaroStatus(_state) {
        return this.altimeter.getCurrentBaroMode() == _state;
    }
    //ADD END***  G3000 MOD ADD new softkeymenu for change of BARO UNIT

    updateSVT() {
        this.attitude.syntheticVisionEnabled = AS3000_PFD_MainPage.getSettingVar(AS3000_PFD_MainPage.VARNAME_SVT_SHOW) == 1;
    }

    updateBaroUnit() {
        let desiredSetting = AS3000_PFD_MainPage.BARO_UNIT_VALUES[AS3000_PFD_MainPage.getSettingVar(AS3000_PFD_MainPage.VARNAME_BARO_UNIT)];
        let currentSetting = this.altimeter.getCurrentBaroMode();
        if (desiredSetting != currentSetting) {
            this.gps.computeEvent(`SoftKeys_Baro_${desiredSetting}`);
        }
    }

    static getSettingVar(varName, defaultValue = 0) {
        return WTDataStore.get(varName, defaultValue);
    }

    static setSettingVar(varName, value) {
        WTDataStore.set(varName, value);
    }
}
AS3000_PFD_MainPage.VARNAME_SVT_SHOW = "PFD_SVT_Show";
AS3000_PFD_MainPage.VARNAME_BARO_UNIT = "PFD_Altitude_Baro_Unit";
AS3000_PFD_MainPage.BARO_UNIT_VALUES = ["IN", "HPA"];


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
    init(root) {
        this.svg = this.gps.getChildById("Horizon");
    }

    onEnter() {
    }

    get syntheticVisionEnabled() {
        return this._syntheticVisionEnabled;
    }

    set syntheticVisionEnabled(enabled) {
        this._syntheticVisionEnabled = enabled;
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
    constructor() {
        super(...arguments);
        this.AoaMode = 1;
    }
    init(root) {
        this.AoaElement = this.gps.getChildById("AoA");
        SimVar.SetSimVarValue("L:Glasscockpit_AOA_Mode", "number", this.AoaMode);
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.AoaElement.setAttribute("aoa", Math.min(Math.max(Simplane.getAngleOfAttack(), 0), 16).toString());
    }
    onExit() {
    }
    onEvent(_event) {
        if (_event == "SoftKey_PFD_AoAMode") {
            this.AoaMode = ((this.AoaMode + 1) % 3);
        }
        switch (_event) {
            case "AOA_Off":
                this.AoaMode = 0;
                break;
            case "AOA_On":
                this.AoaMode = 1;
                break;
            case "AOA_Auto":
                this.AoaMode = 2;
                break;
        }
        if (this.AoaMode == 0) {
            this.AoaElement.style.display = "none";
        }
        else {
            this.AoaElement.style.display = "block";
        }
        SimVar.SetSimVarValue("L:Glasscockpit_AOA_Mode", "number", this.AoaMode);
    }
}
registerInstrument("as3000-pfd-element", AS3000_PFD);
//# sourceMappingURL=AS3000_PFD.js.map