class WT_PFD_Input_Layer extends Base_Input_Layer {
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
                this.brightness.setMfdBrightness(brightness);
                this.brightness.setPfdBrightness(brightness);
                this.lastBrightnessValue = brightness;
            }
        }
    }
    setLightKnob(knob) {
        this.brightnessKnobIndex = knob;
        this.lastBrightnessValue = Math.floor(SimVar.GetSimVarValue(`A:LIGHT POTENTIOMETER:${this.brightnessKnobIndex}`, "number") * 100);
    }
}

class AS1000_PFD extends BaseAS1000 {
    constructor() {
        super();

        window.addEventListener('unhandledrejection', function (event) {
            console.error(`Unhandled exception: ${event.reason}`);
        });

        this.handleReversionaryMode = false;
        this.initDuration = 7000;

        this.updatables = [];

        const d = new WT_Dependency_Container();
        WT_Shared_Dependencies.add(d, this);

        d.register("dialogContainer", d => this.querySelector(".dialog-container"));

        d.register("showPageMenuHandler", d => new WT_PFD_Show_Page_Menu_Handler(d.inputStack, document.getElementById("PageMenuContainer")));
        d.register("directToHandler", d => new WT_Direct_To_Handler(d.sharedEvents));
        d.register("showDirectToHandler", d => new WT_PFD_Show_Direct_To_Handler(d.miniPageController, d.directToModel, d.directToView));

        d.register("miniPageController", d => this.querySelector("g1000-pfd-mini-page-container"));

        d.register("directToView", d => new WT_Direct_To_View(d.icaoInputModel, d.showPageMenuHandler));
        d.register("flightPlanView", d => new WT_PFD_Flight_Plan_Page_View(d.showPageMenuHandler, d.confirmDialogHandler, d.showNewWaypointHandler));
        d.register("proceduresMenuView", d => new WT_PFD_Procedures_Menu_View(d.showProcedureHandler, d.procedures));
        d.register("procedurePageModel", d => new WT_PFD_Procedure_Page_Model(d.flightPlanManager, d.procedureFacilityRepository));
        d.register("showProcedureHandler", d => new WT_PFD_Show_Procedure_Handler(d.miniPageController, d.icaoInputModel, d.procedurePageModel, d.approachPageView, d.arrivalPageView, d.departurePageView));
        d.register("showNewWaypointHandler", d => new WT_PFD_Show_New_Waypoint_Handler(d.miniPageController, d.waypointRepository, d.icaoInputModel, d.inputStack));
        d.register("confirmDialogHandler", d => new WT_PFD_Show_Confirm_Dialog_Handler(d.inputStack, d.dialogContainer));
        d.register("showDuplicatesHandler", d => new WT_PFD_Show_Duplicates_Handler(d.miniPageController, d.waypointRepository, d.inputStack));

        d.register("alertsKey", d => new WT_PFD_Alert_Key(d.annunciationsModel));

        d.register("syntheticVision", d => new WT_Synthetic_Vision(d.planeConfig));
        d.register("attitudeModel", d => new Attitude_Indicator_Model(d.syntheticVision, d.nearestWaypoints));
        d.register("hsiInput", d => new HSI_Input_Layer(d.hsiModel))
        d.register("hsiModel", d => new HSIIndicatorModel(d.syntheticVision));
        d.register("altimeterModel", d => new WT_Altimeter_Model(this, d.barometricPressure, d.minimums, d.radioAltimeter));
        d.register("airspeedModel", d => new WT_Airspeed_Model(d.airspeedReferences, d.unitChooser));
        d.register("airspeedReferences", d => new WT_Airspeed_References());

        d.register("navBoxModel", d => new AS1000_PFD_Nav_Box_Model(d.unitChooser, d.flightPlanManager));

        d.register("annunciationsModel", d => new WT_Annunciations_Model(d.planeConfig, d.sound, d.planeState));
        d.register("localTimeModel", d => new WT_Local_Time_Model(d.settings));
        d.register("oatModel", d => new WT_OAT_Model(d.unitChooser));
        d.register("transponderModel", d => new WT_Transponder_Model(d.modSettings));
        d.register("referencesModel", d => new WT_Airspeed_References_Model(d.settings, d.airspeedReferences));
        d.register("timerModel", d => new WT_PFD_Timer_Model());
        d.register("setupMenuModel", d => new WT_PFD_Setup_Menu_Model(d.brightnessSettings));
        d.register("nearestAirportsModel", d => new WT_Nearest_Airports_Model(this, d.showDirectToHandler, d.waypointRepository, d.unitChooser, null, d.nearestWaypoints));
        d.register("windModel", d => new WT_PFD_Wind_Model());
        d.register("setMinimumsModel", d => new WT_Set_Minimums_Model(d.minimums));
        d.register("minimumsModel", d => new WT_Minimums_Model(d.minimums));
        d.register("radioAltimeterModel", d => new WT_Radio_Altimeter_Model(d.radioAltimeter));
        d.register("warningsModel", d => new WT_Warnings_Model(this, d.planeConfig, d.sound));
        d.register("markerBeaconModel", d => new WT_Marker_Beacon_Model(this, d.planeConfig, d.sound));

        d.register("softKeyMenuHandler", d => new WT_PFD_Menu_Handler(d.softKeyController, d.alertsKey));
        d.register("transponderMenu", d => new WT_PFD_Transponder_Menu(d.softKeyMenuHandler, d.transponderModel, d.transponderCodeMenu));
        d.register("transponderCodeMenu", d => new WT_PFD_Transponder_Code_Menu(d.softKeyMenuHandler, d.transponderModel));
        d.register("mainMenu", d => new WT_PFD_Main_Menu(d.softKeyMenuHandler, d.miniPageController, d.hsiModel, d.insetMapMenu, d.pfdMenu, d.transponderMenu, d.debugMenu));
        d.register("pfdMenu", d => new WT_PFD_PFD_Menu(d.softKeyMenuHandler, d.hsiModel, d.barometricPressure, d.syntheticVisionMenu, d.altUnitMenu, d.windMenu));
        d.register("windMenu", d => new WT_PFD_Wind_Menu(d.softKeyMenuHandler, d.windModel, d.alertsKey));
        d.register("insetMapMenu", d => new WT_PFD_Inset_Map_Menu(d.softKeyMenuHandler, d.insetMap, d.alertsKey));
        d.register("syntheticVisionMenu", d => new WT_PFD_Synthetic_Vision_Menu(d.softKeyMenuHandler, d.syntheticVision, d.alertsKey));
        d.register("altUnitMenu", d => new WT_PFD_Alt_Unit_Menu(d.softKeyMenuHandler, d.barometricPressure));

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
        d.register("pfdInputLayer", d => new WT_PFD_Input_Layer(this, d.navFrequenciesModel, d.comFrequenciesModel, d.showDirectToHandler, d.barometricPressure, d.menuPushHandler));

        this.dependencies = d.getDependencies();

        this.model = d.create("pfdModel");
        this.updatables.push(this.model);        
    }
    get templateID() { return "AS1000_PFD"; }
    connectedCallback() {
        super.connectedCallback();

        this.inputStack = this.dependencies.inputStack;
        this.miniPageController = this.dependencies.miniPageController;
        this.softKeyController = this.dependencies.softKeyController;
        this.alertsKey = this.dependencies.alertsKey;
        this.planeState = this.dependencies.planeState;
        this.electricityAvailable = this.dependencies.electricityAvailable;
        this.proceduresMenuView = this.dependencies.proceduresMenuView;

        this.updatables.push(this.miniPageController);
        this.miniPageController.handleInput(this.inputStack);

        this.addIndependentElementContainer(new Engine("Engine", "EngineDisplay"));
        this.maxUpdateBudget = 12;
        this._pfdConfigDone = false;

        const directToModel = this.dependencies.directToModel;
        const directToView = this.dependencies.directToView;
        directToView.classList.add("mini-page");
        this.dependencies.miniPageController.appendChild(directToView);
        directToView.setModel(directToModel);

        const flightPlanModel = this.dependencies.flightPlanModel;
        const flightPlanView = this.dependencies.flightPlanView;
        flightPlanView.classList.add("mini-page");
        this.dependencies.miniPageController.appendChild(flightPlanView);
        flightPlanView.setModel(flightPlanModel);

        this.proceduresMenuView.classList.add("mini-page");
        this.dependencies.miniPageController.appendChild(this.proceduresMenuView);

        this.updatables.push(this.dependencies.procedures);
        this.updatables.push(this.dependencies.altimeterModel);

        this.initViews(this.dependencies);

        this.inputStack.push(this.dependencies.hsiInput);
        this.inputStack.push(this.dependencies.pfdInputLayer);
        this.inputStack.push(this.dependencies.mapInputLayerFactory.create(this.dependencies.map));
        this.dependencies.softKeyController.handleInput(this.inputStack);

        const syntheticVision = this.getChildById("SyntheticVision");
        syntheticVision.init(this);
        this.dependencies.syntheticVision.enabled.subscribe(enabled => {
            syntheticVision.setAttribute("show-bing-map", enabled ? "true" : "false");
            syntheticVision.style.display = enabled ? "block" : "none";
        });

        // Need to do this to get the map to load 
        this.dependencies.insetMap;

        this.pfdConfig().then(() => {
            this._pfdConfigDone = true;
        });

        const menuHandler = this.dependencies.softKeyMenuHandler;
        menuHandler.goToMenu(this.dependencies.mainMenu);

        document.body.appendChild(this.dependencies.debugConsoleView);
        this.dependencies.debugConsoleView.setModel(this.dependencies.debugConsole);
    }
    onXMLConfigLoaded(_xml) {
        super.onXMLConfigLoaded(_xml);
        this.dependencies.planeConfig.updateConfig(this.xmlConfig);
    }
    onSoundEnd(_event) {
        this.dependencies.sound.onSoundEnd(_event);
    }
    initViews(dependencies) {
        this.initModelView(dependencies.attitudeModel, "glasscockpit-attitude-indicator");
        this.initModelView(dependencies.airspeedModel, "glasscockpit-airspeed-indicator");
        this.initModelView(dependencies.hsiModel, "#Compass");
        this.initModelView(dependencies.altimeterModel, "glasscockpit-altimeter");
        this.initModelView(dependencies.windModel, "g1000-pfd-wind");
        this.initModelView(dependencies.minimumsModel, "g1000-minimums");
        this.initModelView(dependencies.radioAltimeterModel, "g1000-radio-altimeter");
        this.initModelView(dependencies.annunciationsModel, "g1000-annunciations");
        this.initModelView(dependencies.warningsModel, "g1000-warnings");
        this.initModelView(dependencies.markerBeaconModel, "g1000-marker-beacon");

        this.initModelView(dependencies.navBoxModel, "g1000-nav-box");
        this.initModelView(dependencies.comFrequenciesModel, "g1000-com-frequencies");
        this.initModelView(dependencies.navFrequenciesModel, "g1000-nav-frequencies");

        this.initModelView(dependencies.localTimeModel, "g1000-local-time");
        this.initModelView(dependencies.oatModel, "g1000-oat");
        this.initModelView(dependencies.transponderModel, "g1000-transponder");

        this.initModelView(dependencies.referencesModel, "g1000-pfd-airspeed-references");
        this.initModelView(dependencies.setMinimumsModel, "g1000-pfd-minimums");
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
    showFlightPlan() {
        this.miniPageController.showPageRoot(this.dependencies.flightPlanView);
    }
    showProcedures() {
        const proceduresMenuView = this.dependencies.proceduresMenuView;
        /*const onExit = () => {
            this.miniPageController.closeAllPages();    
            proceduresMenuView.onExit.unsubscribe(onExit);
        }
        proceduresMenuView.onExit.subscribe(onExit);*/
        this.miniPageController.showPageRoot(proceduresMenuView);
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
        this.electricityAvailable.value = this.isElectricityAvailable();
        const syntheticVision = this.getChildById("SyntheticVision");
        if (syntheticVision.offsetParent) {
            syntheticVision.update(_deltaTime);
        }
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
        let reversionaryMode = null;
        if (this.instrumentXmlConfig) {
            reversionaryMode = this.instrumentXmlConfig.getElementsByTagName("ReversionaryMode")[0];
        }
        if (reversionaryMode && reversionaryMode.textContent == "True") {
            this.handleReversionaryMode = true;
        }
        this.dependencies.airspeedModel.updateCockpitSettings(SimVar.GetGameVarValue("", "GlassCockpitSettings"));
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
    onShutDown() {
        super.onShutDown();
        this.planeState.shutDown();
    }
    onPowerOn() {
        super.onPowerOn();
        this.planeState.powerOn();
    }
}
registerInstrument("as1000-pfd-element", AS1000_PFD);