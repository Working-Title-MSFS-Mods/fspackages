class WT_G3x5_PFD extends NavSystem {
    constructor() {
        super();
        this.initDuration = 7000;

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

    /**
     * @readonly
     * @type {WT_G3x5_TrafficSystem}
     */
    get trafficSystem() {
        return this._trafficSystem;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDInsetMap}
     */
    get navInsetMap() {
        return this._navInsetMap;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDTrafficInsetMapContainer}
     */
    get trafficInsetMap() {
        return this._trafficInsetMap;
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
    }

    _initInsetMap() {
        this.addIndependentElementContainer(new NavSystemElementContainer("InsetMap", "InsetMap", this._navInsetMap = this._createInsetMap()));
    }

    _createTrafficInsetMap() {
    }

    _initTrafficInsetMap() {
        this.addIndependentElementContainer(new NavSystemElementContainer("TrafficInsetMap", "TrafficInsetMap", this._trafficInsetMap = this._createTrafficInsetMap()));
    }

    _initWarnings() {
        this._warnings = new PFD_Warnings();
        this.addIndependentElementContainer(new NavSystemElementContainer("Warnings", "Warnings", this._warnings));
    }

    _initComponents() {
        this._initMainPage();
        this._initWarnings();
        this._initInsetMap();
        this._initTrafficInsetMap();
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

    _initTrafficTracker() {
        let dataRetriever = this.modConfig.traffic.useTrafficService ? new WT_TrafficServiceTrafficDataRetriever(this.modConfig.traffic.trafficServicePort) : new WT_CoherentTrafficDataRetriever();
        this._trafficTracker = new WT_TrafficTracker(dataRetriever);
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
        this._initTrafficTracker();
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
        if (currentTime - this._lastTrafficUpdateTime >= 1000 && !this._trafficTracker.isBusy()) {
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
    constructor(instrumentID) {
        super();

        this._instrumentID = instrumentID;
        this._isEnabled = false;
        this._isInit = false;

        this._initSettingModel();
    }

    _initSettingModel() {
        this._settingModel = new WT_DataStoreSettingModel(this.instrumentID);
        this._settingModel.addSetting(this._showSetting = new WT_G3x5_PFDInsetMapShowSetting(this._settingModel));
        this.showSetting.addListener(this._onShowSettingChanged.bind(this));

        this._settingModel.init();
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

    /**
     * @readonly
     * @type {Boolean}
     */
    get isEnabled() {
        return this._isEnabled;
    }

    _defineChildren() {
        this._mapContainer = this.gps.getChildById("InsetMap");
        this._mapContainer.style.display = "none";
    }

    _createNavMap() {
    }

    _initNavMap(root) {
        this._navMap = this._createNavMap();
        this._navMap.init(root.querySelector(`.insetMap`));
    }

    init(root) {
        this._defineChildren();
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

        if (value && this.instrument.trafficInsetMap) {
            this.instrument.trafficInsetMap.showSetting.setValue(false);
        }

        this._mapContainer.style.display = value ? "block" : "none";
        this._isEnabled = value;
    }

    onUpdate(deltaTime) {
        if (this._isEnabled) {
            this._navMap.update();
        }
    }
}
WT_G3x5_PFDInsetMap.LAYER_OPTIONS = {
    pointer: false,
    miniCompass: true,
    rangeDisplay: true,
    windData: false,
    roads: false
};

class WT_G3x5_PFDTrafficInsetMapContainer extends WT_G3x5_PFDElement {
    constructor(instrumentID) {
        super();

        this._instrumentID = instrumentID;
        this._isEnabled = false;
        this._isInit = false;

        this._initSettingModel();
    }

    _initSettingModel() {
        this._settingModel = new WT_DataStoreSettingModel(this.instrumentID);
        this._settingModel.addSetting(this._showSetting = new WT_G3x5_PFDTrafficInsetMapShowSetting(this._settingModel));
        this.showSetting.addListener(this._onShowSettingChanged.bind(this));

        this._settingModel.init();
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
     * @type {WT_G3x5_TrafficMap}
     */
    get trafficMap() {
        return this._trafficMap;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDInsetMapShowSetting}
     */
    get showSetting() {
        return this._showSetting;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isEnabled() {
        return this._isEnabled;
    }

    _defineChildren() {
        this._mapContainer = this.gps.getChildById("TrafficInsetMap");
        this._mapContainer.style.display = "none";
    }

    _createTrafficMap() {
    }

    _initTrafficMap(root) {
        this._trafficMap = this._createTrafficMap();
        this._trafficMap.init(root.querySelector(`.insetMap`));
    }

    init(root) {
        this._defineChildren();
        this._initTrafficMap(root);
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

        if (value && this.instrument.navInsetMap) {
            this.instrument.navInsetMap.showSetting.setValue(false);
        }

        this._mapContainer.style.display = value ? "block" : "none";
        this._isEnabled = value;
    }

    onUpdate(deltaTime) {
        if (this._isEnabled) {
            this._trafficMap.update();
        }
    }
}

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
     * @returns {WT_G3x5_PFDTrafficAlert}
     */
    _createTrafficAlert() {
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
            this._trafficAlert = this._createTrafficAlert(),
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

        this._initSettingModel();
    }

    _initSettingModel() {
        this._settingModel = new WT_DataStoreSettingModel(this.instrumentID, null);
        this._settingModel.addSetting(this._svtShowSetting = new WT_G3x5_PFDSVTShowSetting(this._settingModel));
        this.svtShowSetting.addListener(this._onSVTShowSettingChanged.bind(this));

        this._settingModel.init();
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