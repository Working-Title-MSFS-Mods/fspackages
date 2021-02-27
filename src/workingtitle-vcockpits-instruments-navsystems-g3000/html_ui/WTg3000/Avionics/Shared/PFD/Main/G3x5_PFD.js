class WT_G3x5_PFD extends NavSystem {
    constructor() {
        super();
        this.initDuration = 7000;

        this._icaoWaypointFactory = new WT_ICAOWaypointFactory();
        this._icaoSearchers = {
            airport: new WT_ICAOSearcher(this.instrumentIdentifier, WT_ICAOSearcher.Keys.AIRPORT),
            vor: new WT_ICAOSearcher(this.instrumentIdentifier, WT_ICAOSearcher.Keys.VOR),
            ndb: new WT_ICAOSearcher(this.instrumentIdentifier, WT_ICAOSearcher.Keys.NDB),
            int: new WT_ICAOSearcher(this.instrumentIdentifier, WT_ICAOSearcher.Keys.INT)
        };

        this._fpm = new WT_FlightPlanManager(this._icaoWaypointFactory);
        this._lastFPMSyncTime = 0;

        this._citySearcher = new WT_CitySearcher();

        this._unitsController = new WT_G3x5_UnitsController();
    }

    get IsGlassCockpit() { return true; }

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

    /**
     * @readonly
     * @property {WT_G3x5_UnitsController} unitsController
     * @type {WT_G3x5_UnitsController}
     */
    get unitsController() {
        return this._unitsController;
    }

    _createMainPage() {
    }

    _initInsetMap() {
        this.addIndependentElementContainer(new NavSystemElementContainer("InsetMap", "InsetMap", new WT_G3x5_PFDInsetMap("PFD", this.icaoWaypointFactory, this.icaoSearchers, this.flightPlanManagerWT, this.unitsController, this.citySearcher)));
    }

    _initWarnings() {
        this._warnings = new PFD_Warnings();
        this.addIndependentElementContainer(new NavSystemElementContainer("Warnings", "Warnings", this._warnings));
    }

    _initComponents() {
        this._mainPage = this._createMainPage();
        this.pageGroups = [
            new NavSystemPageGroup("Main", this, [
                this._mainPage
            ]),
        ];
        this._initWarnings();
        this._initInsetMap();
    }

    connectedCallback() {
        super.connectedCallback();

        this._initComponents();
        this.maxUpdateBudget = 12;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    parseXMLConfig() {
        super.parseXMLConfig();

        let reversionaryMode = null;
        if (this.instrumentXmlConfig) {
            reversionaryMode = this.instrumentXmlConfig.getElementsByTagName("ReversionaryMode")[0];
        }
        if (reversionaryMode && reversionaryMode.textContent == "True") {
            this.handleReversionaryMode = true;
        }
    }

    _updateReversionaryMode() {
        if (this.handleReversionaryMode) {
            this.reversionaryMode = false;
            if (document.body.hasAttribute("reversionary")) {
                var attr = document.body.getAttribute("reversionary");
                if (attr == "true") {
                    this.reversionaryMode = true;
                }
            }
        }
    }

    _updateICAOWaypointFactory() {
        this.icaoWaypointFactory.update();
    }

    _updateFlightPlanManager() {
        let currentTime = Date.now() / 1000;
        if (currentTime - this._lastFPMSyncTime >= WT_G3x5_PFD.FLIGHT_PLAN_SYNC_INTERVAL) {
            this.flightPlanManagerWT.syncActiveFromGame();
            this._lastFPMSyncTime = currentTime;
        }
    }

    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);

        this._updateReversionaryMode();
        this._updateICAOWaypointFactory();
        this._updateFlightPlanManager();
    }

    reboot() {
        super.reboot();
        if (this._warnings)
            this._warnings.reset();
        if (this._mainPage)
            this._mainPage.reset();
    }

    static _loadTemplate(path) {
        let link = document.createElement("link");
        link.rel = "import";
        link.href = path;
        document.head.appendChild(link);
    }

    static selectAvionics() {
        switch (WT_PlayerAirplane.INSTANCE.type()) {
            case WT_PlayerAirplane.Type.TBM930:
                WT_G3x5_PFD._loadTemplate("/WTg3000/Avionics/G3000/PFD/Main/G3000_PFD.html");
                break;
            case WT_PlayerAirplane.Type.CITATION_LONGITUDE:
                WT_G3x5_PFD._loadTemplate("/WTg3000/Avionics/G5000/PFD/Main/G5000_PFD.html");
                break;
        }
    }
}
WT_G3x5_PFD.FLIGHT_PLAN_SYNC_INTERVAL = 2;

class WT_G3x5_PFDInsetMap extends NavSystemElement {
    constructor(instrumentID, icaoWaypointFactory, icaoSearchers, flightPlanManager, unitsController, citySearcher) {
        super();

        this._instrumentID = instrumentID;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._icaoSearchers = icaoSearchers;
        this._fpm = flightPlanManager;
        this._unitsController = unitsController;
        this._citySearcher = citySearcher;

        this._isEnabled = false;

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
        this._mapContainer = this.gps.getChildById("InsetMap");
        this._mapContainer.style.display = "none";
    }

    _initNavMap(root) {
        this._navMap = new WT_G3x5_NavMap(this.instrumentID, this._icaoWaypointFactory, this._icaoSearchers, this._fpm, this._unitsController, this._citySearcher, new WT_MapViewBorderData(), null, null, WT_G3x5_PFDInsetMap.LAYER_OPTIONS);
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
WT_G3x5_PFDInsetMap.LAYER_OPTIONS = {
    miniCompass: true,
    rangeDisplay: true,
    windData: false,
    roads: false
};

class WT_G3x5_PFDMainPage extends NavSystemPage {
    constructor(unitsController) {
        super("Main", "Mainframe", new AS3000_PFD_MainElement());

        this._unitsController = unitsController;
        this.element = this._createElement();
    }

    _createBottomInfo() {
    }

    _createElement() {
        return new NavSystemElementGroup([
            this._attitude = new AS3000_PFD_Attitude("PFD"),
            new PFD_Airspeed(),
            this._altimeter = new AS3000_PFD_Altimeter("PFD"),
            this._annunciations = new PFD_Annunciations(),
            this._compass = new WT_G3x5_PFDCompass(),
            new PFD_NavStatus(),
            this._bottomInfo = this._createBottomInfo(),
            new AS3000_PFD_ActiveCom(),
            new AS3000_PFD_ActiveNav(),
            new AS3000_PFD_NavStatus(),
            this._aoaIndicator = new AS3000_PFD_AngleOfAttackIndicator("PFD"),
            this._mapInstrument = new MapInstrumentElement(),
            new PFD_AutopilotDisplay(),
            new PFD_Minimums(),
            new PFD_RadarAltitude(),
            new PFD_MarkerBeacon()
        ]);
    }

    init() {
        super.init();

        this._mapInstrument.setGPS(this.gps);
    }

    onUpdate(deltaTime) {
    }

    reset() {
        if (this._annunciations)
            this._annunciations.reset();
    }
}

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

class WT_G3x5_PFDCompass extends PFD_Compass {
    init(root) {
        super.init(root);

        this._needFormattingRefresh = true;
    }

    _refreshFormatting() {
        if (!this._needFormattingRefresh || this.hsi.clientWidth === 0) {
            return;
        }

        // hack to refresh formatting after styling is loaded
        this.hsi._updateNavSourceDisplay();
        this.hsi._updateFlightPhaseDisplay();
        this._needFormattingRefresh = false;
    }

    onUpdate(deltaTime) {
        super.onUpdate(deltaTime);

        this._refreshFormatting();
    }
}

class AS3000_PFD_BottomInfos extends NavSystemElement {
    constructor() {
        super();

        this._initTimer();
    }

    _initTimer() {
        this._timer = new WT_Timer("Generic");
        this._timer.clear();

        this._timerFormatter = new WT_TimeFormatter({round: 0});
    }

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

    _updateTimer() {
        this._timer.update();
        Avionics.Utils.diffAndSet(this.timer, this._timerFormatter.getFormattedString(this._timer.value));
    }

    onUpdate(deltaTime) {
        Avionics.Utils.diffAndSet(this.tas, fastToFixed(Simplane.getTrueSpeed(), 0) + "KT");
        Avionics.Utils.diffAndSet(this.oat, fastToFixed(SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius"), 0) + "°C");
        Avionics.Utils.diffAndSet(this.gs, fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), 0) + "KT");
        Avionics.Utils.diffAndSet(this.isa, fastToFixed(SimVar.GetSimVarValue("STANDARD ATM TEMPERATURE", "celsius"), 0) + "°C");
        Avionics.Utils.diffAndSet(this.utcTime, Utils.SecondsToDisplayTime(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"), true, true, false));
        this._updateTimer();
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

WT_G3x5_PFD.selectAvionics();