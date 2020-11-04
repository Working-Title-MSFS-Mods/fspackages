class WT_PFD_Input_Layer extends Base_Input_Layer {
}

class WT_PFD_Menu_Push_Handler extends WT_Menu_Push_Handler {
    /**
     * @param {WT_PFD_Mini_Page_Controller} miniPageController 
     */
    constructor(miniPageController) {
        super();
        this.miniPageController = miniPageController;
    }
    push() {
        this.miniPageController.showSetupMenu();
    }
}

class WT_PFD_Show_Direct_To_Handler extends WT_Show_Direct_To_Handler {
    /**
     * @param {WT_PFD_Mini_Page_Controller} miniPageController 
     * @param {WT_Direct_To_Model} directToModel 
     * @param {WT_PFD_Direct_To_View} directToView 
     */
    constructor(miniPageController, directToModel, directToView) {
        super();
        this.miniPageController = miniPageController;
        this.directToModel = directToModel;
        this.directToView = directToView;
    }
    show(icaoType = null, icao = null) {
        const view = this.directToView;
        if (icao) {
            this.directToModel.setIcao(icao);
        }

        const subscriptions = new Subscriptions();
        const onCancel = () => {
            this.miniPageController.closePage(view);
        };
        const onExit = () => {
            subscriptions.unsubscribe();
        };
        subscriptions.add(view.onCancel.subscribe(onCancel));
        subscriptions.add(view.onExit.subscribe(onExit));

        this.miniPageController.showPage(view);
    }
}

class WT_PFD_Show_Page_Menu_Handler extends WT_Show_Page_Menu_Handler {
    /**
     * @param {Input_Stack} inputStack
     * @param {HTMLElement} pageContainer 
     */
    constructor(inputStack, pageContainer) {
        super();
        this.inputStack = inputStack;
        this.pageContainer = pageContainer;

        this.currentPageMenu = null;
    }
    show(model) {
        const view = new WT_Page_Menu_View();
        this.pageContainer.appendChild(view);
        view.setModel(model);
        view.enter(this.inputStack);
        const handler = {
            close: () => {
                view.parentNode.removeChild(view);
                this.currentPageMenu = null;
                handler.close = () => { };
            }
        };
        view.onExit.subscribe(handler.close);
        return handler;
    }
}

class WT_PFD_Model {
    /**
     * @param {WT_Brightness_Settings} brightnessSettings 
     */
    constructor(brightnessSettings) {
        this.lastBrightnessValue = null;
        this.brightnessKnobIndex = null;
        this.brightness = brightnessSettings;
    }
    update(dt) {
        if (this.brightnessKnobIndex !== null) {
            let brightness = Math.floor(SimVar.GetSimVarValue(`A:LIGHT POTENTIOMETER:${this.brightnessKnobIndex}`, "number") * 100);
            if (this.lastBrightnessValue != brightness) {
                console.log("brightness " + brightness);
                this.brightness.setMfdBrightness(brightness);
                this.brightness.setPfdBrightness(brightness);
                this.lastBrightnessValue = brightness;
            }
        }
    }
    setLightKnob(knob) {
        console.log("Set knob to " + knob);
        this.brightnessKnobIndex = knob;
        this.lastBrightnessValue = Math.floor(SimVar.GetSimVarValue(`A:LIGHT POTENTIOMETER:${this.brightnessKnobIndex}`, "number") * 100);
    }
}

class WT_PFD_Alert_Key extends WT_Soft_Key {
    constructor() {
        super("ALERTS", null);
        this.setOnClick(this.click.bind(this));
        this.pressAcknowledgesAnnunciations = false;
    }
    /**
    * @param {WT_Annunciations_Model} annuncationsModel 
    */
    setAnnunciationsModel(model) {
        this.annunciationsModel = model;
        model.alertLevel.subscribe(this.updateAlertLevel.bind(this));
        model.hasUnacknowledgedAnnunciations.subscribe(has => {
            this.setAttribute("state", has ? "flashing" : "");
        });
    }
    click() {
        if (this.pressAcknowledgesAnnunciations)
            this.annunciationsModel.acknowledgeAll();
    }
    updateAlertLevel(level) {
        this.pressAcknowledgesAnnunciations = true;
        switch (level) {
            case 0:
                this.pressAcknowledgesAnnunciations = false;
                this.textContent = "ALERTS";
                this.setAttribute("level", "alert");
                break;
            case 1:
                this.textContent = "ADVISORY";
                this.setAttribute("level", "advisory");
                break;
            case 2:
                this.textContent = "CAUTION";
                this.setAttribute("level", "caution");
                break;
            case 3:
                this.textContent = "WARNING";
                this.setAttribute("level", "warning");
                break;
        }
    }
}
customElements.define("g1000-soft-key-alert", WT_PFD_Alert_Key);

class AS1000_PFD extends BaseAS1000 {
    constructor() {
        super();
        this.handleReversionaryMode = false;
        this.initDuration = 7000;

        this.updatables = [];

        const d = new WT_Dependency_Container();

        d.register("inputStack", d => new Input_Stack());
        d.register("softKeyController", d => this.querySelector("g1000-soft-key-menu"));
        d.register("settings", d => {
            const settings = new WT_Settings("g36", WT_Default_Settings.base);
            this.updatables.push(settings);
            return settings;
        });
        d.register("modSettings", d => {
            const settings = new WT_Settings("mod", WT_Default_Settings.modBase);
            this.updatables.push(settings);
            return settings;
        });
        d.register("unitChooser", d => new WT_Unit_Chooser(d.settings));
        d.register("syntheticVision", d => new WT_Synthetic_Vision());
        d.register("flightPlanManager", d => this.currFlightPlanManager);
        d.register("facilityLoader", d => this.facilityLoader);
        d.register("waypointRepository", d => new WT_Waypoint_Repository(d.facilityLoader));
        d.register("nearestWaypoints", d => {
            const repository = new WT_Nearest_Waypoints_Repository(this);
            this.updatables.push(repository);
            return repository;
        });
        d.register("waypointQuickSelect", d => new WT_Waypoint_Quick_Select(this, d.flightPlanManager));
        d.register("showPageMenuHandler", d => new WT_PFD_Show_Page_Menu_Handler(d.inputStack, document.getElementById("PageMenuContainer")));
        d.register("directToHandler", d => new WT_Direct_To_Handler(null, null)); //TODO:
        d.register("showDirectToHandler", d => new WT_PFD_Show_Direct_To_Handler(d.miniPageController, d.directToModel, d.directToView));

        d.register("procedures", d => new Procedures(d.flightPlanManager));
        d.register("brightnessSettings", d => new WT_Brightness_Settings());
        d.register("barometricPressure", d => {
            const pressure = new WT_Barometric_Pressure();
            this.updatables.push(pressure);
            return pressure;
        });
        d.register("miniPageController", d => {
            const controller = this.querySelector("g1000-pfd-mini-page-container");
            this.updatables.push(controller);
            return controller;
        });

        d.register("directToModel", d => new WT_Direct_To_Model(this, null, d.waypointRepository, d.directToHandler));
        d.register("directToView", d => {
            const view = new WT_Direct_To_View(d.waypointQuickSelect, d.showPageMenuHandler);
            view.classList.add("mini-page");
            return view;
        });

        d.register("flightPlanModel", d => new WT_Flight_Plan_Page_Model(d.flightPlanManager, d.procedures, null));
        d.register("flightPlanView", d => {
            const view = new WT_PFD_Flight_Plan_Page_View(d.showPageMenuHandler, null, null);
            view.classList.add("mini-page");
            return view;
        });

        d.register("proceduresMenuView", d => {
            const view = new WT_PFD_Procedures_Menu_View(null, d.procedures); //TODO:
            view.classList.add("mini-page");
            return view;
        });

        d.register("alertsKey", d => new WT_PFD_Alert_Key());

        d.register("attitudeModel", d => {
            const model = new Attitude_Indicator_Model(d.syntheticVision.enabled);
            this.updatables.push(model);
            return model;
        });
        d.register("hsiInput", d => new HSI_Input_Layer(d.hsiModel))
        d.register("hsiModel", d => new HSIIndicatorModel(d.syntheticVision));
        d.register("altimeterModel", d => new WT_Altimeter_Model(d.barometricPressure));

        d.register("navBoxModel", d => new AS1000_PFD_Nav_Box_Model(d.unitChooser, d.flightPlanManager));
        d.register("comFrequenciesModel", d => new WT_Com_Frequencies_Model());
        d.register("navFrequenciesModel", d => new WT_Nav_Frequencies_Model());

        d.register("localTimeModel", d => new WT_Local_Time_Model(d.settings));
        d.register("oatModel", d => new WT_OAT_Model(d.unitChooser));
        d.register("transponderModel", d => new WT_Transponder_Model(d.modSettings));
        d.register("referencesModel", d => new WT_Airspeed_References_Model());
        d.register("timerModel", d => new WT_PFD_Timer_Model());
        d.register("setupMenuModel", d => new WT_PFD_Setup_Menu_Model(d.brightnessSettings));
        d.register("nearestAirportsModel", d => new WT_Nearest_Airports_Model(this, d.showDirectToHandler, d.waypointRepository, d.unitChooser, null, null, d.nearestWaypoints));
        d.register("windModel", d => new WT_PFD_Wind_Model());

        d.register("transponderMenu", d => new WT_PFD_Transponder_Menu(this, d.transponderModel));
        d.register("transponderCodeMenu", d => new WT_PFD_Transponder_Code_Menu(this, d.transponderModel));
        d.register("mainMenu", d => new WT_PFD_Main_Menu(this, d.miniPageController, d.hsiModel));
        d.register("pfdMenu", d => new WT_PFD_PFD_Menu(this, d.hsiModel, d.barometricPressure));
        d.register("windMenu", d => new WT_PFD_Wind_Menu(this, d.windModel, d.alertsKey));
        d.register("insetMapMenu", d => new WT_PFD_Inset_Map_Menu(this, d.insetMap, d.alertsKey));
        d.register("syntheticVisionMenu", d => new WT_PFD_Synthetic_Vision_Menu(this, d.syntheticVision, d.alertsKey));
        d.register("altUnitMenu", d => new WT_PFD_Alt_Unit_Menu(this, d.barometricPressure));

        d.register("insetMap", d => new WT_PFD_Inset_Map(d.map));
        d.register("map", d => {
            const mainMap = document.querySelector("#InnerMapInstrument");
            mainMap.init(this);
            this.updatables.push({
                update: dt => {
                    if (mainMap.offsetParent) {
                        mainMap.update(dt);
                    }
                }
            });
            return mainMap;
        });

        d.register("menuPushHandler", d => new WT_PFD_Menu_Push_Handler(d.miniPageController));
        d.register("pfdModel", d => new WT_PFD_Model(d.brightnessSettings));
        d.register("pfdInputLayer", d => new WT_PFD_Input_Layer(this, d.navFrequenciesModel, d.comFrequenciesModel, d.showDirectToHandler, d.menuPushHandler));

        this.dependencies = d.getDependencies();

        this.model = d.create("pfdModel");
    }
    get templateID() { return "AS1000_PFD"; }
    connectedCallback() {
        super.connectedCallback();

        this.inputStack = this.dependencies.inputStack;
        this.miniPageController = this.dependencies.miniPageController;
        this.miniPageController.handleInput(this.inputStack);
        this.softKeyController = this.dependencies.softKeyController;
        this.alertsKey = this.dependencies.alertsKey;

        this.addIndependentElementContainer(new Engine("Engine", "EngineDisplay"));
        this.maxUpdateBudget = 12;
        this._pfdConfigDone = false;

        const directToModel = this.dependencies.directToModel;
        const directToView = this.dependencies.directToView;
        this.dependencies.miniPageController.appendChild(directToView);
        directToView.setModel(directToModel);

        const flightPlanModel = this.dependencies.flightPlanModel;
        const flightPlanView = this.dependencies.flightPlanView;
        this.dependencies.miniPageController.appendChild(flightPlanView);
        flightPlanView.setModel(flightPlanModel);

        this.dependencies.miniPageController.appendChild(this.dependencies.proceduresMenuView);

        this.updatables.push(this.dependencies.procedures);

        this.initViews(this.dependencies);

        this.inputStack.push(this.dependencies.hsiInput);
        this.inputStack.push(this.dependencies.pfdInputLayer);
        this.inputStack.push(new WT_Map_Input_Layer(this.dependencies.map));
        this.dependencies.softKeyController.handleInput(this.inputStack);

        // Need to do this to get the map to load 
        this.dependencies.insetMap;

        this.dependencies.syntheticVision.enabled.subscribe(enabled => {
            this.getChildById("SyntheticVision").setAttribute("show-bing-map", enabled ? "true" : "false");
            this.getChildById("SyntheticVision").style.display = enabled ? "block" : "none";
        });

        this.pfdConfig().then(() => {
            console.log("PFD fully configured.");
            this._pfdConfigDone = true;
        });

        this.showMainMenu();
    }
    onXMLConfigLoaded(_xml) {
        super.onXMLConfigLoaded(_xml);
        const annuncationsModel = new WT_Annunciations_Model(this.xmlConfig);
        this.initModelView(annuncationsModel, "g1000-annunciations");
        this.alertsKey.setAnnunciationsModel(annuncationsModel);
    }
    initViews(dependencies) {
        this.initModelView(dependencies.attitudeModel, "glasscockpit-attitude-indicator");
        this.initModelView(dependencies.hsiModel, "#Compass");
        this.initModelView(dependencies.altimeterModel, "glasscockpit-altimeter");
        this.initModelView(dependencies.windModel, "g1000-pfd-wind");

        this.initModelView(dependencies.navBoxModel, "g1000-nav-box");
        this.initModelView(dependencies.comFrequenciesModel, "g1000-com-frequencies");
        this.initModelView(dependencies.navFrequenciesModel, "g1000-nav-frequencies");

        this.initModelView(dependencies.localTimeModel, "g1000-local-time");
        this.initModelView(dependencies.oatModel, "g1000-oat");
        this.initModelView(dependencies.transponderModel, "g1000-transponder");
        this.initModelView(dependencies.referencesModel, "g1000-pfd-airspeed-references");
        this.initModelView(dependencies.timerModel, "g1000-pfd-timer");
        this.initModelView(dependencies.setupMenuModel, "g1000-pfd-setup-menu");
        this.initModelView(dependencies.nearestAirportsModel, "g1000-pfd-nearest-airports");
    }
    initModelView(model, viewSelector) {
        const view = document.querySelector(viewSelector);
        if (!view)
            throw new Error(`${viewSelector} didn't match any views`);
        view.setModel(model);
        if (model.update)
            this.updatables.push(model);
    }
    showTransponderMenu() {
        this.softKeyController.setMenu(this.dependencies.transponderMenu);
    }
    showTransponderCodeMenu() {
        this.softKeyController.setMenu(this.dependencies.transponderCodeMenu);
    }
    showMainMenu() {
        this.softKeyController.setMenu(this.dependencies.mainMenu);
    }
    showPfdMenu() {
        this.softKeyController.setMenu(this.dependencies.pfdMenu);
    }
    showWindMenu() {
        this.softKeyController.setMenu(this.dependencies.windMenu);
    }
    showInsetMapMenu() {
        this.softKeyController.setMenu(this.dependencies.insetMapMenu);
    }
    showSyntheticVisionMenu() {
        this.softKeyController.setMenu(this.dependencies.syntheticVisionMenu);
    }
    showAltUnitMenu() {
        this.softKeyController.setMenu(this.dependencies.altUnitMenu);
    }
    showFlightPlan() {
        this.miniPageController.showPage(this.dependencies.flightPlanView);
    }
    showProcedures() {
        this.miniPageController.showPage(this.dependencies.proceduresMenuView);
    }
    async pfdConfig() {
        let loader = new WTConfigLoader(this._xmlConfigPath);
        // We need to wait for this to finish before we can do the initial set of the light pot
        // in the line below because this can set a custom value for the avionics knob.
        await loader.loadModelFile("interior").then((dom) => { this.processInteriorConfig(dom) });
        this.avionicsKnobValue = SimVar.GetSimVarValue("A:LIGHT POTENTIOMETER:" + this.avionicsKnobIndex, "number") * 100;
        this.model.setLightKnob(this.avionicsKnobIndex);
        return Promise.resolve();
    }
    processInteriorConfig(dom) {
        this.avionicsKnobIndex = 30;
        let templates = dom.getElementsByTagName("UseTemplate");
        for (const item of templates) {
            if (item.getAttribute("Name").toLowerCase() != "asobo_as1000_pfd_template")
                continue;
            let children = item.childNodes;
            for (const item of children) {
                if (item.nodeName.toLowerCase() != "potentiometer")
                    continue;
                this.avionicsKnobIndex = item.textContent
            }
        }
    }
    onUpdate(_deltaTime) {
        for (let updatable of this.updatables) {
            updatable.update(_deltaTime);
        }
        this.miniPageController.update(_deltaTime);
    }
    computeEvent(_event) {
        let r = this.inputStack.processEvent(_event);
        if (r === false) {
            super.computeEvent(_event);
        }
    }
    onEvent(_event) {
    }
    parseXMLConfig() {
        super.parseXMLConfig();
        let syntheticVision = null;
        let reversionaryMode = null;
        if (this.instrumentXmlConfig) {
            syntheticVision = this.instrumentXmlConfig.getElementsByTagName("SyntheticVision")[0];
            reversionaryMode = this.instrumentXmlConfig.getElementsByTagName("ReversionaryMode")[0];
        }
        this.dependencies.syntheticVision.enabled.value = WTDataStore.get(`PFD.SyntheticVision`, syntheticVision && syntheticVision.textContent == "True");
        if (reversionaryMode && reversionaryMode.textContent == "True") {
            this.handleReversionaryMode = true;
        }
    }
    Update() {
        super.Update();
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
}
class AS1000_PFD_MainPage extends NavSystemPage {
    constructor() {
        super("Main", "Mainframe", new AS1000_PFD_MainElement());
        this.rootMenu = new SoftKeysMenu();
        this.insetMenu = new SoftKeysMenu();
        this.xpndrMenu = new SoftKeysMenu();
        this.xpndrCodeMenu = new SoftKeysMenu();
        this.pfdMenu = new SoftKeysMenu();
        this.synVisMenu = new SoftKeysMenu();
        this.altUnitMenu = new SoftKeysMenu();
        this.windMenu = new SoftKeysMenu();
        this.hsiFrmtMenu = new SoftKeysMenu();
        this.annunciations = new PFD_Annunciations();
        this.attitude = new PFD_Attitude();
        this.mapInstrument = new MapInstrumentElement();
        this.element = new NavSystemElementGroup([
            this.attitude,
            //new PFD_Compass(),
            //new PFD_OAT(unitChooser),
            this.mapInstrument,
            new PFD_Altimeter(),
            new PFD_Airspeed(),
            //this.annunciations,
            //new PFD_NavStatus(),
            //new PFD_Minimums(),
            //new PFD_RadarAltitude(),
            //new PFD_MarkerBeacon()
        ]);
    }
    init() {
        super.init();
        this.mapInstrument.setGPS(this.gps);
        this.innerMap = this.gps.getElementOfType(PFD_InnerMap);
        this.alertSoftkey = new SoftKeyElement("ALERTS", this.gps.computeEvent.bind(this.gps, "SoftKeys_ALERT"));
        this.annunciations.alertSoftkey = this.alertSoftkey;
        /*this.rootMenu.elements = [
            new SoftKeyElement(),
            new SoftKeyElement("INSET", this.activateInsetMap.bind(this)),
            new SoftKeyElement(""),
            new SoftKeyElement("PFD", this.switchToMenu.bind(this, this.pfdMenu)),
            new SoftKeyElement("OBS"),
            new SoftKeyElement("CDI", this.gps.computeEvent.bind(this.gps, "SoftKey_CDI")),
            new SoftKeyElement("ADF/DME", this.gps.computeEvent.bind(this.gps, "SoftKey_ADF_DME")),
            new SoftKeyElement("XPDR", this.switchToMenu.bind(this, this.xpndrMenu)),
            new SoftKeyElement("IDENT"),
            new SoftKeyElement("TMR/REF", this.gps.computeEvent.bind(this.gps, "Softkey_TMR_REF")),
            new SoftKeyElement("NRST", this.gps.computeEvent.bind(this.gps, "SoftKey_NRST")),
            this.alertSoftkey,
        ];*/
        this.insetMenu.elements = [
            new SoftKeyElement("OFF", this.deactivateInsetMap.bind(this)),
            new SoftKeyElement("DCLTR"),
            new SoftKeyElement(),
            new SoftKeyElement("TRAFFIC"),
            new SoftKeyElement("TOPO", this.toggleIsolines.bind(this), this.getKeyState.bind(this, "TOPO")),
            new SoftKeyElement("TERRAIN"),
            new SoftKeyElement(),
            new SoftKeyElement("NEXRAD", this.toggleNexrad.bind(this), this.getKeyState.bind(this, "NEXRAD")),
            new SoftKeyElement("XM LTNG"),
            new SoftKeyElement(),
            new SoftKeyElement("BACK", this.switchToMenu.bind(this, this.rootMenu)),
            this.alertSoftkey,
        ];
        this.xpndrMenu.elements = [
            new SoftKeyElement(),
            new SoftKeyElement(),
            new SoftKeyElement("STBY", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_STBY"), this.softkeyTransponderStatus.bind(this, 1)),
            new SoftKeyElement("ON", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_ON"), this.softkeyTransponderStatus.bind(this, 3)),
            new SoftKeyElement("ALT", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_ALT"), this.softkeyTransponderStatus.bind(this, 4)),
            new SoftKeyElement(),
            new SoftKeyElement("VFR", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_VFR")),
            new SoftKeyElement("CODE", this.switchToMenu.bind(this, this.xpndrCodeMenu)),
            new SoftKeyElement("IDENT", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_IDENT")),
            new SoftKeyElement(""),
            new SoftKeyElement("BACK", this.switchToMenu.bind(this, this.rootMenu)),
            this.alertSoftkey
        ];
        this.xpndrMenu.elements[2].state = "White";
        this.xpndrCodeMenu.elements = [
            new SoftKeyElement("0", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_0")),
            new SoftKeyElement("1", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_1")),
            new SoftKeyElement("2", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_2")),
            new SoftKeyElement("3", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_3")),
            new SoftKeyElement("4", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_4")),
            new SoftKeyElement("5", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_5")),
            new SoftKeyElement("6", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_6")),
            new SoftKeyElement("7", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_7")),
            new SoftKeyElement("IDENT", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_IDENT")),
            new SoftKeyElement("BKSP", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_BKSP")),
            new SoftKeyElement("BACK", this.switchToMenu.bind(this, this.xpndrMenu)),
            this.alertSoftkey
        ];
        this.pfdMenu.elements = [
            new SoftKeyElement("SYN VIS", this.switchToMenu.bind(this, this.synVisMenu)),
            new SoftKeyElement("DFLTS"),
            new SoftKeyElement("WIND", this.switchToMenu.bind(this, this.windMenu)),
            new SoftKeyElement("DME", this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_DME")),
            new SoftKeyElement("BRG1", this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_BRG1")),
            new SoftKeyElement("HSI FRMT", this.switchToMenu.bind(this, this.hsiFrmtMenu)),
            new SoftKeyElement("BRG2", this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_BRG2")),
            new SoftKeyElement(""),
            new SoftKeyElement("ALT UNIT", this.switchToMenu.bind(this, this.altUnitMenu)),
            new SoftKeyElement("STD BARO"),
            new SoftKeyElement("BACK", this.switchToMenu.bind(this, this.rootMenu)),
            this.alertSoftkey
        ];
        this.synVisMenu.elements = [
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("BACK", this.switchToMenu.bind(this, this.pfdMenu)),
            this.alertSoftkey,
        ];
        this.altUnitMenu.elements = [
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("METERS"),
            new SoftKeyElement(""),
            new SoftKeyElement("IN", this.gps.computeEvent.bind(this.gps, "SoftKeys_Baro_IN"), this.softkeyBaroStatus.bind(this, "IN")),
            new SoftKeyElement("HPA", this.gps.computeEvent.bind(this.gps, "SoftKeys_Baro_HPA"), this.softkeyBaroStatus.bind(this, "HPA")),
            new SoftKeyElement(""),
            new SoftKeyElement("BACK", this.switchToMenu.bind(this, this.pfdMenu)),
            this.alertSoftkey,
        ];
        this.windMenu.elements = [
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("OPTN 1", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_O1"), this.softkeyWindStatus.bind(this, 1)),
            new SoftKeyElement("OPTN 2", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_O2"), this.softkeyWindStatus.bind(this, 2)),
            new SoftKeyElement("OPTN 3", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_O3"), this.softkeyWindStatus.bind(this, 3)),
            new SoftKeyElement("OFF", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_Off"), this.softkeyWindStatus.bind(this, 0)),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("BACK", this.switchToMenu.bind(this, this.pfdMenu)),
            this.alertSoftkey
        ];
        this.hsiFrmtMenu.elements = [
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("360 HSI", this.gps.computeEvent.bind(this.gps, "SoftKeys_HSI_360"), this.softkeyHsiStatus.bind(this, false)),
            new SoftKeyElement("ARC HSI", this.gps.computeEvent.bind(this.gps, "SoftKeys_HSI_ARC"), this.softkeyHsiStatus.bind(this, true)),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("BACK", this.switchToMenu.bind(this, this.pfdMenu)),
            this.alertSoftkey
        ];
        this.softKeys = this.rootMenu;
    }

    switchToMenu(_menu) {
        this.softKeys = _menu;
    }
    softkeyTransponderStatus(_state) {
        return SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number") == _state ? "White" : "None";
    }
    softkeySynTerrStatus() {
        return this.gps.mainPage.syntheticVision ? "White" : "None";
    }
    softkeyBaroStatus(_state) {
        return this.gps.getElementOfType(PFD_Altimeter).getCurrentBaroMode() == _state ? "White" : "None";
    }
    softkeyHsiStatus(_arc) {
        return (SimVar.GetSimVarValue("L:Glasscockpit_HSI_Arc", "number") == 0) == _arc ? "None" : "White";
    }
    softkeyWindStatus(_state) {
        return this.gps.getElementOfType(PFD_WindData).getCurrentMode() == _state ? "White" : "None";
    }
    activateInsetMap() {
        this.gps.computeEvent("SoftKeys_InsetOn");
        this.switchToMenu(this.insetMenu);
    }
    deactivateInsetMap() {
        this.gps.computeEvent("SoftKeys_InsetOff");
        this.switchToMenu(this.rootMenu);
    }
    toggleNexrad() {
        this.gps.getElementOfType(PFD_InnerMap).toggleNexrad();
    }
    toggleIsolines() {
        this.gps.getElementOfType(PFD_InnerMap).toggleIsolines();
    }
    getKeyState(_keyName) {
        switch (_keyName) {
            case "TOPO":
                {
                    if (this.innerMap.getIsolines())
                        return "White";
                    break;
                }
            case "NEXRAD":
                {
                    if (this.innerMap.getNexrad())
                        return "White";
                    break;
                }
        }
        return "None";
    }
}
class AS1000_PFD_MainElement extends NavSystemElement {
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
registerInstrument("as1000-pfd-element", AS1000_PFD);
//# sourceMappingURL=AS1000_PFD.js.map