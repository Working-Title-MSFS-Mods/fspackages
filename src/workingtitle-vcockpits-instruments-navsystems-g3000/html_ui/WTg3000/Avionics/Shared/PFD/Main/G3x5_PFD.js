class WT_G3x5_PFD extends NavSystem {
    constructor() {
        super();
        this.initDuration = 7000;

        this._trafficTracker = new WT_TrafficTracker();
        this._lastTrafficUpdateTime = 0;

        this._citySearcher = new WT_CitySearcher();
    }

    get IsGlassCockpit() { return true; }

    get facilityLoader() {
        return undefined;
    }

    /**
     * @readonly
     * @type {WT_AirplaneAirspeedSensor}
     */
    get referenceAirspeedSensor() {
        return this._referenceAirspeedSensor;
    }

    /**
     * @readonly
     * @type {WT_AirplaneAltimeter}
     */
    get referenceAltimeter() {
        return this._referenceAltimeter;
    }

    /**
     * @readonly
     * @type {WT_CitySearcher}
     */
    get citySearcher() {
        return this._citySearcher;
    }

    _createMainPage() {
    }

    _initMainPage() {
        this._mainPage = this._createMainPage();
        this.pageGroups = [
            new NavSystemPageGroup("Main", this, [
                this._mainPage
            ]),
        ];
    }

    _createInsetMap() {
        return new WT_G3x5_PFDInsetMap("PFD", this.citySearcher);
    }

    _initInsetMap() {
        this.addIndependentElementContainer(new NavSystemElementContainer("InsetMap", "InsetMap", this._createInsetMap()));
    }

    _initWarnings() {
        this._warnings = new PFD_Warnings();
        this.addIndependentElementContainer(new NavSystemElementContainer("Warnings", "Warnings", this._warnings));
    }

    _initComponents() {
        this._initMainPage();
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

    _getReferenceAirspeedSensor() {
        return this.airplane.sensors.getAirspeedSensor(1);
    }

    _getReferenceAltimeter() {
        let index = 1;
        if (this.instrumentXmlConfig) {
            let altimeterIndexElems = this.instrumentXmlConfig.getElementsByTagName("AltimeterIndex");
            if (altimeterIndexElems.length > 0) {
                index = parseInt(altimeterIndexElems[0].textContent) + 1;
            }
        }
        return this.airplane.sensors.getAltimeter(index);
    }

    _initReferenceSensors() {
        this._referenceAirspeedSensor = this._getReferenceAirspeedSensor();
        this._referenceAltimeter = this._getReferenceAltimeter();
    }

    _createApproachNavLoader() {
    }

    _initApproachNavLoader() {
        this._approachNavLoader = this._createApproachNavLoader();
    }

    /**
     *
     * @returns {WT_G3x5_TrafficSystem}
     */
    _createTrafficSystem() {
    }

    _initTrafficSystem() {
        this._trafficSystem = this._createTrafficSystem();
    }

    Init() {
        super.Init();

        this._initReferenceSensors();
        this._initApproachNavLoader();
        this._initTrafficSystem();
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

    _updateApproachNavLoader() {
        this._approachNavLoader.update();
    }

    _updateTrafficTracker(currentTime) {
        if (currentTime - this._lastTrafficUpdateTime >= 1000) {
            this._trafficTracker.update();
            this._lastTrafficUpdateTime = currentTime;
        }
    }

    _updateTrafficSystem() {
        this._trafficSystem.update();
    }

    _doUpdates(currentTime) {
        super._doUpdates(currentTime);

        this._updateReversionaryMode();
        this._updateApproachNavLoader();
        this._updateTrafficTracker(currentTime);
        this._updateTrafficSystem();
    }

    reboot() {
        super.reboot();
        if (this._warnings)
            this._warnings.reset();
        if (this._mainPage)
            this._mainPage.reset();
    }

    static selectAvionics() {
        switch (WT_PlayerAirplane.getAircraftType()) {
            case WT_PlayerAirplane.Type.TBM930:
                WT_TemplateLoader.load("/WTg3000/Avionics/G3000/PFD/Main/G3000_PFD.html");
                break;
            case WT_PlayerAirplane.Type.CITATION_LONGITUDE:
                WT_TemplateLoader.load("/WTg3000/Avionics/G5000/PFD/Main/G5000_PFD.html");
                break;
        }
    }
}

class WT_G3x5_PFDInsetMap extends WT_G3x5_PFDElement {
    constructor(instrumentID, citySearcher) {
        super();

        this._instrumentID = instrumentID;
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
     * @type {String}
     */
    get instrumentID() {
        return this._instrumentID;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavMap}
     */
    get navMap() {
        return this._navMap;
    }

    /**
     * @readonly
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
        this._navMap = new WT_G3x5_NavMap(this.instrumentID, this.instrument.airplane, this.instrument.referenceAirspeedSensor.index, this.instrument.referenceAltimeter.index, this.instrument.icaoWaypointFactory, this.instrument.icaoSearchers, this.instrument.flightPlanManagerWT, this.instrument.unitsController, this._citySearcher, new WT_MapViewBorderData(), null, null, WT_G3x5_PFDInsetMap.LAYER_OPTIONS);
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
    constructor(instrument) {
        super("Main", "Mainframe", new AS3000_PFD_MainElement());

        this._instrument = instrument;

        this.element = new NavSystemElementGroup(this._createElements());
    }

    /**
     *
     * @returns {WT_G3x5_PFDAutopilotDisplay}
     */
    _createAutopilotDisplay() {
    }

    /**
     *
     * @returns {WT_G3x5_PFDAirspeedIndicator}
     */
    _createAirspeedIndicator() {
    }

    /**
     *
     * @returns {WT_G3x5_PFDAltimeter}
     */
    _createAltimeter() {
    }

    /**
     *
     * @returns {WT_G3x5_PFDRadarAltimeter}
     */
    _createRadarAltimeter() {
        return new WT_G3x5_PFDRadarAltimeter();
    }

    /**
     *
     * @returns {WT_G3x5_PFDAoAIndicator}
     */
    _createAoAIndicator() {
    }

    /**
     *
     * @returns {WT_G3x5_PFDMinimums}
     */
    _createMinimums() {
        return new WT_G3x5_PFDMinimums();
    }

    /**
     *
     * @returns {WT_G3x5_PFDBottomInfo}
     */
    _createBottomInfo() {
    }

    _createElements() {
        return [
            this._autopilotDisplay = this._createAutopilotDisplay(),
            this._attitude = new AS3000_PFD_Attitude("PFD"),
            this._airspeed = this._createAirspeedIndicator(),
            this._altimeter = this._createAltimeter(),
            this._annunciations = new PFD_Annunciations(),
            this._compass = new WT_G3x5_PFDCompass(),
            this._aoaIndicator = this._createAoAIndicator(),
            this._minimums = this._createMinimums(),
            this._bottomInfo = this._createBottomInfo(),
            new AS3000_PFD_ActiveCom(),
            this._mapInstrument = new MapInstrumentElement(),
            this._radarAltimeter = this._createRadarAltimeter(),
            new PFD_MarkerBeacon()
        ];
    }

    /**
     * @readonly
     * @property {WT_G3x5_PFD} instrument
     * @type {WT_G3x5_PFD}
     */
    get instrument() {
        return this._instrument;
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

WT_G3x5_PFD.selectAvionics();