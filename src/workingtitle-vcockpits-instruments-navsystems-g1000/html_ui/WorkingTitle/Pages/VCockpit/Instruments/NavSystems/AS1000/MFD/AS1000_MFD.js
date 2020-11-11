class WT_MFD_Show_Page_Menu_Handler extends WT_Show_Page_Menu_Handler {
    /**
     * @param {Input_Stack} inputStack
     * @param {HTMLElement} container 
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     */
    constructor(inputStack, container, softKeyMenuHandler) {
        super();
        this.inputStack = inputStack;
        this.container = container;
        this.softKeyMenuHandler = softKeyMenuHandler;

        this.currentPageMenu = null;
    }
    show(model) {
        const view = new WT_Page_Menu_View();
        this.container.appendChild(view);
        view.setModel(model);
        view.enter(this.inputStack);
        const menuHandler = this.softKeyMenuHandler.show(null);
        this.currentPageMenu = view;
        const subscriptions = new Subscriptions();
        subscriptions.add(view.onExit.subscribe(() => {
            view.parentNode.removeChild(view);
            menuHandler.pop();
            this.currentPageMenu = null;
            subscriptions.unsubscribe();
        }));
    }
}

class WT_Show_Confirm_Dialog_Handler {
    /**
     * @param {Input_Stack} inputStack
     * @param {HTMLElement} dialogContainer 
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     */
    constructor(inputStack, dialogContainer, softKeyMenuHandler) {
        this.inputStack = inputStack;
        this.dialogContainer = dialogContainer;
        this.softKeyMenuHandler = softKeyMenuHandler;
    }
    show(message) {
        const menuHandler = this.softKeyMenuHandler.show(null);
        const confirm = new WT_Confirm_Dialog();
        this.dialogContainer.appendChild(confirm);
        return confirm.show(message, this.inputStack).then((result) => {
            this.dialogContainer.removeChild(confirm);
            menuHandler.pop();
            return result;
        }, (e) => {
            this.dialogContainer.removeChild(confirm);
            menuHandler.pop();
            throw e;
        });
    }
}

class WT_Show_New_Waypoint_Handler {
    /**
     * @param {HTMLElement} paneContainer
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {MapInstrument} map
     * @param {WT_Waypoint_Quick_Select} waypointQuickSelect
     * @param {Input_Stack} inputStack
     */
    constructor(paneContainer, softKeyMenuHandler, waypointRepository, map, waypointQuickSelect, inputStack) {
        this.paneContainer = paneContainer;
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.waypointRepository = waypointRepository;
        this.waypointQuickSelect = waypointQuickSelect;
        this.map = map;
        this.inputStack = inputStack;
    }
    show(icaoType = null) {
        const model = new WT_Waypoint_Selector_Model(icaoType, this.waypointRepository, this.softKeyMenuHandler);
        const view = new WT_Waypoint_Selector_View(this.map, this.waypointQuickSelect);
        this.paneContainer.appendChild(view);
        view.setModel(model);

        return new Promise((resolve, reject) => {
            const subscriptions = new Subscriptions();
            const onWaypointSelected = waypoint => {
                resolve(waypoint);
                view.exit();
            };
            const onCancel = () => {
                view.exit();
            };
            const onExit = () => {
                subscriptions.unsubscribe();
                this.paneContainer.removeChild(view);
                reject();
            };
            subscriptions.add(view.onWaypointSelected.subscribe(onWaypointSelected));
            subscriptions.add(view.onCancel.subscribe(onCancel));
            subscriptions.add(view.onExit.subscribe(onExit));

            view.enter(this.inputStack);
        });
    }
}

class WT_MFD_Show_Direct_To_Handler extends WT_Show_Direct_To_Handler {
    /**
     * @param {HTMLElement} paneContainer
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {MapInstrument} map
     * @param {WT_Waypoint_Quick_Select} waypointQuickSelect
     * @param {Input_Stack} inputStack
     * @param {WT_Direct_To_Handler} directToHandler
     * @param {WT_Show_Page_Menu_Handler} showPageMenuHandler
     */
    constructor(paneContainer, softKeyMenuHandler, waypointRepository, map, waypointQuickSelect, inputStack, directToHandler, showPageMenuHandler) {
        super();
        this.paneContainer = paneContainer;
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.waypointRepository = waypointRepository;
        this.waypointQuickSelect = waypointQuickSelect;
        this.map = map;
        this.inputStack = inputStack;
        this.directToHandler = directToHandler;
        this.showPageMenuHandler = showPageMenuHandler;
    }
    show(icaoType = null, icao = null) {
        //TODO: Fix reverting flight plan
        let model = new WT_Direct_To_Model(this, icaoType, this.waypointRepository, this.directToHandler);
        if (icao) {
            model.setIcao(icao);
        }
        let view = new WT_MFD_Direct_To_View(this.softKeyMenuHandler, this.map, this.waypointQuickSelect, this.showPageMenuHandler);
        this.paneContainer.appendChild(view);
        view.setModel(model);

        const subscriptions = new Subscriptions();
        const onCancel = () => {
            view.exit();
        };
        const onExit = () => {
            subscriptions.unsubscribe();
            this.paneContainer.removeChild(view);
        };
        subscriptions.add(view.onCancel.subscribe(onCancel));
        subscriptions.add(view.onExit.subscribe(onExit));

        view.enter(this.inputStack);
    }
}

class WT_Show_Procedure_Handler {
    /**
     * @param {WT_Page_Controller} pageController 
     * @param {FlightPlanManager} flightPlanManager 
     * @param {WT_Procedure_Facility_Repository} procedureFacilityRepository
     */
    constructor(pageController, flightPlanManager, procedureFacilityRepository, viewFactory) {
        this.pageController = pageController;
        this.flightPlanManager = flightPlanManager;
        this.viewFactory = viewFactory;
        this.procedureFacilityRepository = procedureFacilityRepository;
    }
    getView(icao, procedureIndex = null) {
        let model = new WT_Procedure_Page_Model(this.flightPlanManager, this.procedureFacilityRepository);
        model.setICAO(icao === null ? "A      EGLL " : icao);
        model.setInitialProcedureIndex(procedureIndex);
        let view = this.pageController.showPage(new WT_Page("PROC - Procedures", () => model, this.viewFactory), true);
        view.onExit.subscribe(() => {
            this.pageController.goTo("MAP", "Map");
        });
        return view;
    }
    showApproaches(icao = null, procedureIndex = null) {
        const view = this.getView(icao, procedureIndex);
        view.showSubPage("APR");
    }
    showDepartures(icao = null, procedureIndex = null) {
        const view = this.getView(icao, procedureIndex);
        view.showSubPage("DP");
    }
    showArrivals(icao = null, procedureIndex = null) {
        const view = this.getView(icao, procedureIndex);
        view.showSubPage("STAR");
    }
}

class WT_Show_Airways_Handler {
    /**
     * @param {Input_Stack} inputStack
     * @param {HTMLElement} pageContainer
     * @param {MapInstrument} map 
     */
    constructor(gps, inputStack, pageContainer, map) {
        this.gps = gps;
        this.inputStack = inputStack;
        this.pageContainer = pageContainer;
        this.map = map;
    }
    show(waypoint) {
        return new Promise((resolve, reject) => {
            const model = new WT_Airway_Selector_Model(this.gps, waypoint);
            const view = new WT_Airway_Selector_View(this.map);
            this.pageContainer.appendChild(view);
            view.setModel(model);

            view.onLoad.subscribe(waypoints => {
                resolve(waypoints);
                view.exit();
            });
            view.onCancel.subscribe(() => {
                view.exit();
            });
            view.onExit.subscribe(() => {
                view.deactivate();
                this.pageContainer.removeChild(view);
                reject();
            });

            view.enter(this.inputStack);
            view.activate();
        });
    }
}

class WT_Show_Waypoint_Info_Handler {
    /**
     * @param {WT_Page_Controller} pageController 
     */
    constructor(pageController) {
        this.pageController = pageController;
    }
    show(icao) {
        const type = icao[0];
        switch (type) {
            case "A": {
                this.pageController.goTo("WPT", "Airport Information", icao);
                break;
            }
            case "W": {
                this.pageController.goTo("WPT", "Intersection Information", icao);
                break;
            }
            case "V": {
                break;
            }
            case "N": {
                break;
            }
        }
    }
}


class AS1000_MFD extends BaseAS1000 {
    constructor() {
        super();
        this.altimeterIndex = 0;
        this.initDuration = 5500;
        this.needValidationAfterInit = true;
        this.updatables = [];

        const d = new WT_Dependency_Container();
        WT_Shared_Dependencies.add(d, this);

        d.register("pageContainer", d => this.getChildById("PageContainer"));
        d.register("overlayPageContainer", d => this.getChildById("OverlayPageContainer"));
        d.register("paneContainer", d => this.getChildById("PaneContainer"));
        d.register("dialogContainer", d => this.getChildById("DialogContainer"));

        d.register("navBoxModel", d => new WT_MFD_Nav_Box_Model(d.pageTitle, d.unitChooser, d.settings));
        d.register("flightPlanController", d => new WT_Flight_Plan_Controller());
        d.register("fuelUsed", d => new WT_Fuel_Used(["FUEL LEFT QUANTITY", "FUEL RIGHT QUANTITY"]));
        d.register("electricityAvailable", d => new Subject(this.isElectricityAvailable()));
        d.register("changelogRepository", d => new WT_Changelog_Repository());

        d.register("mainMap", d => document.querySelector("#MapInstrument"));
        d.register("miniMap", d => document.querySelector("#MiniMap"));
        d.register("mapInputLayerFactory", d => new WT_Map_Input_Layer_Factory());

        d.register("waypointQuickSelect", d => new WT_Waypoint_Quick_Select(this, d.flightPlanManager));
        d.register("pageMenuHandler", d => new WT_MFD_Show_Page_Menu_Handler(d.inputStack, d.pageContainer, d.softKeyMenuHandler));
        d.register("confirmDialogHandler", d => new WT_Show_Confirm_Dialog_Handler(d.inputStack, d.dialogContainer, d.softKeyMenuHandler));
        d.register("newWaypointHandler", d => new WT_Show_New_Waypoint_Handler(d.paneContainer, d.softKeyMenuHandler, d.waypointRepository, d.miniMap, d.waypointQuickSelect, d.inputStack));
        d.register("directToHandler", d => new WT_Direct_To_Handler(d.flightPlanController, d.mainMap));
        d.register("showDirectToHandler", d => new WT_MFD_Show_Direct_To_Handler(d.paneContainer, d.softKeyMenuHandler, d.waypointRepository, d.miniMap, d.waypointQuickSelect, d.inputStack, d.directToHandler, d.pageMenuHandler));
        d.register("showAirwaysHandler", d => new WT_Show_Airways_Handler(this, d.inputStack, d.overlayPageContainer, d.mainMap));
        d.register("showProcedureHandler", d => new WT_Show_Procedure_Handler(d.pageController, d.flightPlanManager, d.procedureFacilityRepository, () => d.procedurePageView));
        d.register("showWaypointInfoHandler", d => new WT_Show_Waypoint_Info_Handler(d.pageController));
        d.register("procedurePageView", d => new WT_Procedure_Page_View(d.softKeyMenuHandler, d.mainMap, d.waypointQuickSelect), { scope: "transient" });
        d.register("softKeyMenuHandler", d => new WT_MFD_Soft_Key_Menu_Handler(d.softKeyController));

        d.register("frequencyListModel", d => new WT_Frequency_List_Model(d.comFrequenciesModel, d.navFrequenciesModel), { scope: "transient" });

        d.register("mapModel", d => new WT_Map_Model(this, d.mainMap), { scope: "transient" });
        d.register("mapView", d => new WT_Map_View(d.pageMenuHandler, d.softKeyController), { scope: "transient" });

        d.register("airportInformationModel", d => new WT_Airport_Information_Model(d.showDirectToHandler, d.waypointRepository, d.airportDatabase), { scope: "transient" });
        d.register("airportInformationView", d => new WT_Airport_Information_View(d.mainMap, d.waypointQuickSelect, d.frequencyListModel, d.softKeyMenuHandler), { scope: "transient" });

        d.register("intersectionInformationModel", d => new WT_Intersection_Information_Model(d.showDirectToHandler, d.waypointRepository), { scope: "transient" });
        d.register("intersectionInformationView", d => new WT_Intersection_Information_View(d.mainMap, d.waypointQuickSelect), { scope: "transient" });

        d.register("systemSettingsModel", d => new WT_System_Settings_Model(d.settings), { scope: "transient" });
        d.register("systemSettingsView", d => new WT_System_Settings_View(d.softKeyMenuHandler), { scope: "transient" });

        d.register("modSettingsModel", d => new WT_Mod_Settings_Model(d.modSettings), { scope: "transient" });
        d.register("modSettingsView", d => new WT_Mod_Settings_View(d.softKeyMenuHandler), { scope: "transient" });

        d.register("changelogModel", d => new WT_Changelog_Model(d.changelogRepository), { scope: "transient" });
        d.register("changelogView", d => new WT_Changelog_View(), { scope: "transient" });

        d.register("creditsModel", d => new WT_Credits_Model(), { scope: "transient" });
        d.register("creditsView", d => new WT_Credits_View(), { scope: "transient" });

        d.register("flightPlanModel", d => new WT_Flight_Plan_Page_Model(d.flightPlanManager, d.procedures, d.showAirwaysHandler), { scope: "transient" });
        d.register("flightPlanView", d => new WT_MFD_Flight_Plan_Page_View(d.mainMap, d.softKeyMenuHandler, d.pageMenuHandler, d.confirmDialogHandler, d.newWaypointHandler), { scope: "transient" });

        d.register("nearestAirportsModel", d => new WT_Nearest_Airports_Model(this, d.showDirectToHandler, d.waypointRepository, d.unitChooser, d.mainMap, d.nearestWaypoints, d.showWaypointInfoHandler), { scope: "transient" });
        d.register("nearestAirportsView", d => new WT_Nearest_Airports_View(d.frequencyListModel, d.unitChooser, d.softKeyMenuHandler), { scope: "transient" });

        d.register("nearestNdbsModel", d => new WT_Nearest_Ndbs_Model(d.waypointRepository, d.nearestWaypoints, d.showWaypointInfoHandler), { scope: "transient" });
        d.register("nearestNdbsView", d => new WT_Nearest_Ndbs_View(d.softKeyMenuHandler, d.mainMap, d.unitChooser), { scope: "transient" });

        d.register("nearestVorsModel", d => new WT_Nearest_Vors_Model(d.waypointRepository, d.nearestWaypoints, d.showWaypointInfoHandler), { scope: "transient" });
        d.register("nearestVorsView", d => new WT_Nearest_Vors_View(d.softKeyMenuHandler, d.mainMap, d.unitChooser), { scope: "transient" });

        d.register("pageTitle", d => new Subject("MAP - NAVIGATION MAP"));
        d.register("pageController", d => new WT_Page_Controller([
            {
                name: "MAP",
                pages: [
                    new WT_Page("Map", () => d.mapModel, () => d.mapView),
                ]
            },
            {
                name: "WPT",
                pages: [
                    new WT_Page("Airport Information", () => d.airportInformationModel, () => d.airportInformationView),
                    new WT_Page("Intersection Information", () => d.intersectionInformationModel, () => d.intersectionInformationView),
                ]
            },
            {
                name: "AUX",
                pages: [
                    new WT_Page("System Settings", () => d.systemSettingsModel, () => d.systemSettingsView),
                    new WT_Page("Mod Settings", () => d.modSettingsModel, () => d.modSettingsView),
                    new WT_Page("Changelog", () => d.changelogModel, () => d.changelogView),
                    new WT_Page("Credits", () => d.creditsModel, () => d.creditsView),
                ]
            },
            {
                name: "FPL",
                pages: [
                    new WT_Page("Flight Plan", () => d.flightPlanModel, () => d.flightPlanView),
                ]
            },
            {
                name: "NRST",
                pages: [
                    new WT_Page("Nearest Airports", () => d.nearestAirportsModel, () => d.nearestAirportsView),
                    new WT_Page("Nearest NDBs", () => d.nearestNdbsModel, () => d.nearestNdbsView),
                    new WT_Page("Nearest VORs", () => d.nearestVorsModel, () => d.nearestVorsView),
                ]
            },
        ], d.pageTitle));
        d.register("mfdInputLayer", d => new Base_Input_Layer(this, d.navFrequenciesModel, d.comFrequenciesModel, d.showDirectToHandler, null));

        this.dependencies = d.getDependencies();
    }
    get templateID() { return "AS1000_MFD"; }
    connectedCallback() {
        super.connectedCallback();

        const d = this.dependencies;

        this.pageContainer = d.pageContainer;
        this.overlayPageContainer = d.overlayPageContainer;
        this.paneContainer = d.paneContainer;
        this.dialogContainer = d.dialogContainer;

        this.inputStack = d.inputStack;
        this.softKeyController = d.softKeyController;
        this.electricityAvailable = d.electricityAvailable;
        this.pageController = d.pageController;
        this.mapInputLayerFactory = d.mapInputLayerFactory;
        this.fuelUsed = d.fuelUsed;
        this.mainMap = d.mainMap;
        this.miniMap = d.miniMap;
        this.pageTitle = d.pageTitle;
        this.softKeyMenuHandler = d.softKeyMenuHandler;

        this.updatables.push(d.flightPlanController);
        this.updatables.push(d.nearestWaypoints);
        this.updatables.push(d.procedures);
        this.updatables.push(d.fuelUsed);

        this.loadSavedMapOrientation();
        this.initEngineDisplay();
        this.initMainMap(this.mapInputLayerFactory);
        this.initMiniMap();

        this.initModelView(d.navBoxModel, "g1000-nav-box");
        this.initModelView(d.comFrequenciesModel, "g1000-com-frequencies");
        this.initModelView(d.navFrequenciesModel, "g1000-nav-frequencies");

        this.electricityAvailable.subscribe((electricity) => { if (electricity) this.fuelUsed.reset(); });

        this.initDefaultSoftKeys();
        this.softKeyMenus = {
            engine: new AS1000_Engine_Menu(this.engineDisplay, this.softKeyMenuHandler),
            main: new WT_Soft_Key_Menu(true)
        };

        this.softKeyController.setDefaultButtons(this.defaultSoftKeys.engine, this.defaultSoftKeys.map, this.defaultSoftKeys.checklist);
        this.softKeyController.handleInput(this.inputStack);
        this.showMainMenu();

        this.inputStack.push(d.mfdInputLayer);

        this.initPageController();

        this.pageController.goTo("MAP", "Map");
    }
    initModelView(model, viewSelector) {
        let view = document.querySelector(viewSelector);
        if (!view)
            throw new Exception(`${viewSelector} didn't match any views`);
        view.setModel(model);
        if (model.update)
            this.updatables.push(model);
        return model;
    }
    initEngineDisplay() {
        this.engineDisplay = new WTEngine("Engine", "LeftInfos", this._xmlConfigPath);
        this.addIndependentElementContainer(this.engineDisplay);
    }
    initMainMap(mapInputLayerFactory) {
        this.mainMap.init(this);
        this.mapSetup = new WT_Map_Setup();
        this.inputStack.push(mapInputLayerFactory.create(this.mainMap));
    }
    initMiniMap() {
        this.miniMap.init(this);
        this.miniMap.parentNode.removeChild(this.miniMap);
    }
    initPageController() {
        this.updatables.push(this.pageController);
        this.pageController.handleInput(this.inputStack);
        this.querySelector("g1000-page-selector").setController(this.pageController);
    }
    initDefaultSoftKeys() {
        this.defaultSoftKeys = {
            engine: new WT_Soft_Key("ENGINE", this.showEngineMenu.bind(this)),
            map: new WT_Soft_Key("MAP", null),
            checklist: new WT_Soft_Key("CHKLIST", null)
        };
    }
    resetPage() {
        this.pageController.goTo("MAP", "Map");
    }
    showMainMenu() {
        this.softKeyMenuHandler.show(this.softKeyMenus.main);
    }
    showEngineMenu() {
        this.softKeyMenuHandler.show(this.softKeyMenus.engine);
    }
    showDirectTo(icaoType = null, icao = null) {
        this.showDirectToHandler.show(icaoType, icao);
    }
    showDuplicates(duplicates) {
        let dialogContainer = this.getChildById("DialogContainer");
        let model = new WT_Duplicate_Waypoints_Model(this.dependencies.waypointRepository, duplicates);
        let view = new WT_Duplicate_Waypoints_View();
        dialogContainer.appendChild(view);
        view.setModel(model);
        let close = () => {
            dialogContainer.removeChild(view);
            view.exit();
        }
        return {
            promise: view.enter(this.inputStack).catch(e => {
                close();
            }).then(icao => {
                close();
                return icao;
            }),
            cancel: close,
        }
    }
    revertToFlightPlan() {
        let controller = new WT_Normal_Flight_Plan_Controller(this.dependencies.currFlightPlanManager);
        this.flightPlanController.setMode(controller);
    }
    showFlightPlan() {
        if (this.currentPageMenu) {
            this.currentPageMenu.exit();
        }
        this.pageController.goTo("FPL", "Flight Plan");
    }
    showProcedures() {
        if (this.currentPageMenu) {
            this.currentPageMenu.exit();
        }
        const element = new WT_MFD_Procedures_Menu_View(this.dependencies.showProcedureHandler, this.dependencies.procedures);
        this.paneContainer.appendChild(element);
        element.enter(this.inputStack);
        element.onExit.subscribe(() => {
            element.parentNode.removeChild(element);
        });
        this.pageTitle.value = "PROC - PROCEDURES";
    }
    showMapSetup() {
        let view = new WT_Map_Setup_View(this.softKeyController);
        let model = new WT_Map_Setup_Model(this.mapSetup);
        view.setModel(model);
        this.paneContainer.appendChild(view);
        view.onExit.subscribe(() => {
            this.paneContainer.removeChild(view);
            view.deactivate();
        });
        view.enter(this.inputStack);
        view.activate();
    }
    parseXMLConfig() {
        super.parseXMLConfig();
        if (this.instrumentXmlConfig) {
            let altimeterIndexElems = this.instrumentXmlConfig.getElementsByTagName("AltimeterIndex");
            if (altimeterIndexElems.length > 0) {
                this.altimeterIndex = parseInt(altimeterIndexElems[0].textContent) + 1;
            }
        }

        // Weather radar is on by default, and has to be explicitly turned OFF in a plane's
        // configuration.   Which isn't loaded when the MFD initializes.  So here I need to
        // go back and recreate the entire map page group if there's radar.  This is dumb.
        if (this.hasWeatherRadar()) {
            /*this.pageGroups[0] = new NavSystemPageGroup("MAP", this, [
                new AS1000_MFD_MainMap(this.engineDisplay),
                new AS1000_MFD_Radar()
            ]);*/
        }
    }
    onUpdate(dt) {
        try {
            for (let updatable of this.updatables) {
                updatable.update(dt);
            }
            this.electricityAvailable.value = this.isElectricityAvailable();
            if (this.mainMap.offsetParent)
                this.mainMap.update(dt);
            if (this.miniMap.offsetParent)
                this.miniMap.update(dt);
        } catch (e) {
            console.error(e.message);
        }
    }
    disconnectedCallback() {
    }
    computeEvent(_event) {
        if (_event == "SOFTKEYS_12") {
            this.acknowledgeInit();
        }

        if (this.isBootProcedureComplete()) {
            let r = this.inputStack.processEvent(_event);
            if (r === false) {
                switch (_event) {
                    case "ActiveFPL_Modified":
                        this.currFlightPlan.FillWithCurrentFP();
                }
            }
        }
    }
    onEvent(_event) {
        super.onEvent(_event);
        let isGPSDrived = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool");
        let cdiSource = isGPSDrived ? 3 : SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "number");
        switch (_event) {
            case "CLR_Long":
                this.currentInteractionState = 0;
                this.closePopUpElement();
                this.SwitchToPageName("MAP", "NAVIGATION MAP");
                break;
            case "BARO_INC":
                SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", this.altimeterIndex);
                break;
            case "BARO_DEC":
                SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", this.altimeterIndex);
                break;
            case "CRS_INC":
                if (cdiSource == 1) {
                    SimVar.SetSimVarValue("K:VOR1_OBI_INC", "number", 0);
                }
                else if (cdiSource == 2) {
                    SimVar.SetSimVarValue("K:VOR2_OBI_INC", "number", 0);
                }
                break;
            case "CRS_DEC":
                if (cdiSource == 1) {
                    SimVar.SetSimVarValue("K:VOR1_OBI_DEC", "number", 0);
                }
                else if (cdiSource == 2) {
                    SimVar.SetSimVarValue("K:VOR2_OBI_DEC", "number", 0);
                }
                break;
            case "CRS_PUSH":
                if (cdiSource == 1) {
                    SimVar.SetSimVarValue("K:VOR1_SET", "number", ((180 + SimVar.GetSimVarValue("NAV RADIAL:1", "degree")) % 360));
                }
                else if (cdiSource == 2) {
                    SimVar.SetSimVarValue("K:VOR2_SET", "number", ((180 + SimVar.GetSimVarValue("NAV RADIAL:2", "degree")) % 360));
                }
                break;
            case "SOFTKEYS_12":
                this.acknowledgeInit();
                break;
        }
    }
    Update() {
        super.Update();
        SimVar.SetSimVarValue("L:Glasscockpit_MFD_Started", "number", this.isStarted ? 1 : 0);
    }

    loadSavedMapOrientation() {
        let state = WTDataStore.get("MFD.TrackUp", false);
        this.setMapOrientation(state);
    }

    toggleMapOrientation() {
        let newValue = !SimVar.GetSimVarValue("L:GPS_TRACK_UP", "boolean");
        this.setMapOrientation(newValue)
    }

    setMapOrientation(state) {
        WTDataStore.set("MFD.TrackUp", state);
        SimVar.SetSimVarValue("L:GPS_TRACK_UP", "boolean", state);
        this.trackup = state;
    }
}
class AS1000_MFD_NavStatus extends NavSystemElement {
    /**
     * @param {WT_Unit_Chooser} unitChooser 
     */
    constructor(unitChooser) {
        super(...arguments);
        this.lastEte = undefined;
        this.groundSpeedValue = "";
        this.desiredTrackValue = "";
        this.currentTrackValue = "";
        this.unitChooser = unitChooser;
    }
    init(root) {
        this.groundSpeed = this.gps.getChildById("GroundSpeed");
        this.desiredTrack = this.gps.getChildById("DesiredTrack");
        this.currentTrack = this.gps.getChildById("CurrentTrack");
        this.eteElement = this.gps.getChildById("ETE");
        this.isInitialized = true;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        var groundSpeedValue = this.unitChooser.chooseSpeed(fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "kilometers per hours"), 0) + "kph", fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), 0) + "kt");
        if (this.groundSpeedValue != groundSpeedValue) {
            this.groundSpeed.textContent = groundSpeedValue;
            this.groundSpeedValue = groundSpeedValue;
        }
        var currentTrackValue = fastToFixed(SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degree"), 0) + "°";
        if (this.currentTrack.textContent != currentTrackValue) {
            this.currentTrack.textContent = currentTrackValue;
            this.currentTrackValue = currentTrackValue;
        }
        let flightPlanActive = SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "boolean");
        if (flightPlanActive) {
            var desiredTrackValue = fastToFixed(SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree"), 0) + "°";
            if (this.desiredTrack.textContent != desiredTrackValue) {
                this.desiredTrack.textContent = desiredTrackValue;
                this.desiredTrackValue = desiredTrackValue;
            }
            var ete = SimVar.GetSimVarValue("GPS ETE", "seconds");
            if (this.lastEte == undefined || this.lastEte != ete) {
                this.eteElement.textContent = Math.floor(ete / 60) + ":" + (ete % 60 < 10 ? "0" : "") + ete % 60;
                this.lastEte = ete;
            }
        }
        else {
            Avionics.Utils.diffAndSet(this.desiredTrack, "___°");
            Avionics.Utils.diffAndSet(this.eteElement, "__:__");
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS1000_MFD_PageNavigation extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.displayNameValue = "";
        this.pageCellsValue = "";
        this.pagesHtmlValue = "";
        this.isVisible = false;
    }
    init(root) {
        this.pageSelectionElement = this.gps.getChildById("PageSelection");
        this.pagesElement = this.gps.getChildById("Pages");
        this.pageGroupElement = this.gps.getChildById("PageGroups");
        this.currentPageDisplay = this.gps.getChildById("CurrentPageDisplay");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        var displayNameValue = this.gps.getCurrentPageGroup().name + " - " + this.gps.getCurrentPage().name;
        if (displayNameValue != this.displayNameValue) {
            this.currentPageDisplay.textContent = displayNameValue;
            this.displayNameValue = displayNameValue;
        }
        if (this.isVisible) {
            if (this.gps.currentInteractionState != 0) {
                this.isVisible = false;
            }
            if (this.gps.currentEventLinkedPageGroup != null) {
                let pageCells = '<td state="Selected" > ' + this.gps.currentEventLinkedPageGroup.pageGroup.name + '</td>';
                if (pageCells != this.pageCellsValue) {
                    this.pageGroupElement.innerHTML = pageCells;
                    this.pageCellsValue = pageCells;
                }
                var pageHtml = "";
                var pages = this.gps.currentEventLinkedPageGroup.pageGroup.pages;
                for (let i = 0; i < pages.length; i++) {
                    pageHtml += '<div state="' + (i == this.gps.currentEventLinkedPageGroup.pageGroup.pageIndex ? 'Selected' : 'Unselected') + '">' + pages[i].name + '</div>';
                }
                if (pageHtml != this.pagesHtmlValue) {
                    this.pagesElement.innerHTML = pageHtml;
                    this.pagesHtmlValue = pageHtml;
                }
            }
            else {
                var pageCells = "";
                for (let i = 0; i < this.gps.pageGroups.length; i++) {
                    pageCells += '<td state="' + (i == this.gps.currentPageGroupIndex ? "Selected" : "Unselected") + '">' + this.gps.pageGroups[i].name + '</td>';
                }
                if (pageCells != this.pageCellsValue) {
                    this.pageGroupElement.innerHTML = pageCells;
                    this.pageCellsValue = pageCells;
                }
                var pageHtml = "";
                var pages = this.gps.pageGroups[this.gps.currentPageGroupIndex].pages;
                for (let i = 0; i < pages.length; i++) {
                    pageHtml += '<div state="' + (i == this.gps.pageGroups[this.gps.currentPageGroupIndex].pageIndex ? 'Selected' : 'Unselected') + '">' + pages[i].name + '</div>';
                }
                if (pageHtml != this.pagesHtmlValue) {
                    this.pagesElement.innerHTML = pageHtml;
                    this.pagesHtmlValue = pageHtml;
                }
            }
            this.pageSelectionElement.setAttribute("state", "Active");
            if ((new Date()).getTime() - this.lastAction.getTime() > 5000) {
                this.isVisible = false;
            }
        }
        else {
            this.pageSelectionElement.setAttribute("state", "Inactive");
        }
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "NavigationSmallInc":
            case "NavigationSmallDec":
            case "NavigationLargeInc":
            case "NavigationLargeDec":
            case "FPL_Push":
                if (this.gps.currentInteractionState == 0) {
                    this.isVisible = true;
                    this.lastAction = new Date();
                }
                break;
        }
    }
}
class AS1000_MFD_MainMap extends NavSystemPage {
    constructor(engineDisplay) {
        super("NAVIGATION MAP", "Map", new NavSystemElementGroup([
            new AS1000_MFD_MainMapSlot(),
            new MFD_WindData()
        ]));
        this.mapMenu = new AS1000_MapMenu();
        this.engineDisplay = engineDisplay;
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("DCLTR", () => {
                let map = this.gps.getChildById("MapInstrument");
                if (map) {
                    map.declutterLevel++;
                    if (map.declutterLevel > 1) {
                        map.declutterLevel = 0;
                    }
                }
            }),
            new SoftKeyElement("SHW CHRT", null),
            new SoftKeyElement("", null)
        ];
    }
}
class AS1000_MFD_MainMapSlot extends NavSystemElement {
    init(root) {
        this.mapContainer = root;
        this.map = this.gps.getChildById("MapInstrument");
        this.map.zoomRanges = [0.5, 1, 1.5, 2, 3, 5, 8, 10, 15, 20, 30, 50, 80, 100, 150, 200, 300, 500, 800, 1000, 1500, 2000];
    }
    onEnter() {
        this.mapContainer.insertBefore(this.map, this.mapContainer.firstChild);
        this.map.setCenteredOnPlane();
        this.gps.mapElement.setDisplayMode(EMapDisplayMode.GPS);
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS1000_MFD_WaypointLine extends MFD_WaypointLine {
    constructor(waypoint, index, _waypointType, _element) {
        super(waypoint, index, _waypointType, _element);
        this.mapMenu = new AS1000_MapMenu();
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE"),
            new SoftKeyElement(""),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement("NEW WPT"),
            new SoftKeyElement("VIEW"),
            new SoftKeyElement("V PROF"),
            new SoftKeyElement("CNCL V"),
            new SoftKeyElement("VNV D"),
            new SoftKeyElement("ATK OFST"),
            new SoftKeyElement("ACT LEG", this.element.activateLeg.bind(this.element, this.index)),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
        ];
        this.mapMenu.init(this, this.element.gps);
    }
}

class AS1000_MFD_Radar extends NavSystemPage {
    constructor() {
        super("WEATHER RADAR", "Map", new AS1000_MFD_RadarElement());
        this.mapMenu = new AS1000_MapMenu();
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("", null),
            new SoftKeyElement("MODE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("HORIZON", this.gps.mapElement.setRadar.bind(this.gps.mapElement, ERadarMode.HORIZON), this.getKeyState.bind(this, "HORIZON")),
            new SoftKeyElement("VERTICAL", this.gps.mapElement.setRadar.bind(this.gps.mapElement, ERadarMode.VERTICAL), this.getKeyState.bind(this, "VERTICAL")),
            new SoftKeyElement("", null),
            new SoftKeyElement("GAIN", null),
            new SoftKeyElement("WATCH", null),
            new SoftKeyElement("BRG", null),
            new SoftKeyElement("WX ALERT", null),
            new SoftKeyElement("", null)
        ];
    }
    getKeyState(_keyName) {
        switch (_keyName) {
            case "HORIZON":
                {
                    if (this.gps.mapElement.getRadarMode() == ERadarMode.HORIZON)
                        return "White";
                    break;
                }
            case "VERTICAL":
                {
                    if (this.gps.mapElement.getRadarMode() == ERadarMode.VERTICAL)
                        return "White";
                    break;
                }
        }
        return "None";
    }
}

class AS1000_MFD_RadarElement extends NavSystemElement {
    init(root) {
        this.mapContainer = root;
        this.map = this.gps.getChildById("MapInstrument");
    }
    onEnter() {
        this.mapContainer.insertBefore(this.map, this.mapContainer.firstChild);
        this.gps.mapElement.setDisplayMode(EMapDisplayMode.RADAR);
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
}

class AS1000_MFD_ApproachWaypointLine extends MFD_ApproachWaypointLine {
    constructor(waypoint, index, _element) {
        super(waypoint, index, _element);
        this.mapMenu = new AS1000_MapMenu();
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE"),
            new SoftKeyElement(""),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("ACT LEG", this.element.activateLeg.bind(this.element, this.index, true)),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
        ];
        this.mapMenu.init(this, this.element.gps);
    }
}
class AS1000_MFD_ActiveFlightPlan extends NavSystemPage {
    constructor() {
        super("ACTIVE FLIGHT PLAN", "ActiveFlightPlan", new MFD_ActiveFlightPlan_Element(AS1000_MFD_WaypointLine, AS1000_MFD_ApproachWaypointLine));
        this.mapMenu = new AS1000_MapMenu();
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("VIEW", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("CNCL V", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null)
        ];
    }
    getSoftKeyMenu() {
        let menu = this.element.getSoftKeysMenu();
        if (menu == null) {
            return this.softKeys;
        }
        else {
            return menu;
        }
    }
}
class AS1000_MFD_AirportInfos extends NavSystemPage {
    constructor(_default = 0) {
        super("AIRPORT INFORMATION", "AirportInfos", null);
        this.mapMenu = new AS1000_MapMenu();
        this.defaultIndex = 0;
        this.elementSelector = new NavSystemElementSelector();
        this.icaoSearchField = new SearchFieldWaypointICAO(this.gps, [], null, "A");
        this.elementSelector.addElement(new AS1000_MFD_AirportInfos1(this.icaoSearchField));
        this.elementSelector.addElement(new AS1000_MFD_AirportInfos2(this.icaoSearchField));
        this.element = this.elementSelector;
        this.defaultIndex = _default;
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.softKeys = new SoftKeysMenu();
        this.softKeyInfo = new SoftKeyElement("INFO-1", this.info_callback.bind(this));
        this.icaoSearchField.setInstrument(this.gps);
        this.icaoSearchField.container = this.gps;
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement("CHRT", null),
            this.softKeyInfo,
            new SoftKeyElement("DP", null),
            new SoftKeyElement("STAR", null),
            new SoftKeyElement("APR", null),
            new SoftKeyElement("WX", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null)
        ];
        this.switchPanel(this.defaultIndex);
    }
    info_callback() {
        var index = (this.elementSelector.index + 1) % 2;
        this.switchPanel(index);
    }
    switchPanel(_index) {
        this.elementSelector.switchToIndex(_index);
        this.softKeyInfo.name = "INFO-" + (_index + 1);
    }
}
class AS1000_MFD_AirportInfos1 extends NavSystemElement {
    constructor(_searchField) {
        super();
        this.selectedElement = 0;
        this.selectedRunway = 0;
        this.icaoSearchField = _searchField;
    }
    init(root) {
        this.rootElement = root;
        this.mapElement = this.gps.getChildById("MapInstrument");
        this.mapContainer = this.gps.getChildById("AirportInfos1_Map");
        this.identElement = this.gps.getChildById("AirportInfos1_Ident");
        this.symbolElement = this.gps.getChildById("AirportInfos1_Symbol");
        this.typeElement = this.gps.getChildById("AirportInfos1_Type");
        this.facilityNameElement = this.gps.getChildById("AirportInfos1_FacilityName");
        this.cityElement = this.gps.getChildById("AirportInfos1_City");
        this.regionElement = this.gps.getChildById("AirportInfos1_Region");
        this.elevationElement = this.gps.getChildById("AirportInfos1_Elevation");
        this.latitudeElement = this.gps.getChildById("AirportInfos1_Latitude");
        this.longitudeElement = this.gps.getChildById("AirportInfos1_Longitude");
        this.fuelAvailableElement = this.gps.getChildById("AirportInfos1_FuelAvailable");
        this.timeZoneElement = this.gps.getChildById("AirportInfos1_TimeZone");
        this.runwayNameElement = this.gps.getChildById("AirportInfos1_RunwayName");
        this.runwaySizeElement = this.gps.getChildById("AirportInfos1_RunwaySize");
        this.runwaySurfaceTypeElement = this.gps.getChildById("AirportInfos1_RunwaySurfaceType");
        this.runwayLightsElement = this.gps.getChildById("AirportInfos1_RunwayLights");
        let freqSlider = this.gps.getChildById("Slider");
        let freqSliderCursor = this.gps.getChildById("SliderCursor");
        let freqElements = [];
        for (let i = 1; i <= 7; i++) {
            freqElements.push(new SelectableElement(this.gps, this.gps.getChildById("AirportInfos1_Frequency" + i), this.frequencyCallback.bind(this)));
        }
        this.frequenciesSelectionGroup = new SelectableElementSliderGroup(this.gps, freqElements, freqSlider, freqSliderCursor);
        this.icaoSearchField.elements.push(this.identElement);
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.activateSearchField.bind(this)),
            new SelectableElement(this.gps, this.runwayNameElement, this.runwaySelection.bind(this)),
            this.frequenciesSelectionGroup
        ];
        this.isInitialized = true;
    }
    onEnter() {
        this.rootElement.setAttribute("state", "Infos1");
        this.mapContainer.appendChild(this.mapElement);
        this.mapElement.setAttribute("bing-mode", "vfr");
        this.gps.mapElement.instrument.setTrackUpDisabled(true);
    }
    onUpdate(_deltaTime) {
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao != "") {
            this.symbolElement.textContent = "";
            switch (infos.privateType) {
                case 0:
                    this.typeElement.textContent = "Unknown";
                    break;
                case 1:
                    this.typeElement.textContent = "Public";
                    break;
                case 2:
                    this.typeElement.textContent = "Military";
                    break;
                case 3:
                    this.typeElement.textContent = "Private";
                    break;
            }
            this.facilityNameElement.textContent = infos.name;
            this.cityElement.textContent = infos.city;
            this.regionElement.textContent = infos.region;
            this.elevationElement.textContent = fastToFixed(infos.coordinates.alt, 0) + "FT";
            this.latitudeElement.textContent = this.gps.latitudeFormat(infos.coordinates.lat);
            this.longitudeElement.textContent = this.gps.longitudeFormat(infos.coordinates.long);
            this.fuelAvailableElement.textContent = infos.fuel;
            this.timeZoneElement.textContent = "";
            if (this.gps.currentInteractionState == 3) {
                this.selectedRunway = 0;
            }
            if ("designation" in infos.runways[this.selectedRunway]) {
                this.runwayNameElement.textContent = infos.runways[this.selectedRunway].designation;
            }
            this.runwaySizeElement.textContent = Math.round(WT_Unit.METER.convert(infos.runways[this.selectedRunway].length, WT_Unit.FOOT)) + "FT x " +
                        Math.round(WT_Unit.METER.convert(infos.runways[this.selectedRunway].width, WT_Unit.FOOT)) + "FT";
            switch (infos.runways[this.selectedRunway].surface) {
                case 0:
                    this.runwaySurfaceTypeElement.textContent = "Unknown";
                    break;
                case 1:
                    this.runwaySurfaceTypeElement.textContent = "Concrete";
                    break;
                case 2:
                    this.runwaySurfaceTypeElement.textContent = "Asphalt";
                    break;
                case 101:
                    this.runwaySurfaceTypeElement.textContent = "Grass";
                    break;
                case 102:
                    this.runwaySurfaceTypeElement.textContent = "Turf";
                    break;
                case 103:
                    this.runwaySurfaceTypeElement.textContent = "Dirt";
                    break;
                case 104:
                    this.runwaySurfaceTypeElement.textContent = "Coral";
                    break;
                case 105:
                    this.runwaySurfaceTypeElement.textContent = "Gravel";
                    break;
                case 106:
                    this.runwaySurfaceTypeElement.textContent = "Oil Treated";
                    break;
                case 107:
                    this.runwaySurfaceTypeElement.textContent = "Steel";
                    break;
                case 108:
                    this.runwaySurfaceTypeElement.textContent = "Bituminus";
                    break;
                case 109:
                    this.runwaySurfaceTypeElement.textContent = "Brick";
                    break;
                case 110:
                    this.runwaySurfaceTypeElement.textContent = "Macadam";
                    break;
                case 111:
                    this.runwaySurfaceTypeElement.textContent = "Planks";
                    break;
                case 112:
                    this.runwaySurfaceTypeElement.textContent = "Sand";
                    break;
                case 113:
                    this.runwaySurfaceTypeElement.textContent = "Shale";
                    break;
                case 114:
                    this.runwaySurfaceTypeElement.textContent = "Tarmac";
                    break;
                case 115:
                    this.runwaySurfaceTypeElement.textContent = "Snow";
                    break;
                case 116:
                    this.runwaySurfaceTypeElement.textContent = "Ice";
                    break;
                case 201:
                    this.runwaySurfaceTypeElement.textContent = "Water";
                    break;
                default:
                    this.runwaySurfaceTypeElement.textContent = "Unknown";
            }
            switch (infos.runways[this.selectedRunway].lighting) {
                case 0:
                    this.runwayLightsElement.textContent = "Unknown";
                    break;
                case 1:
                    this.runwayLightsElement.textContent = "None";
                    break;
                case 2:
                    this.runwayLightsElement.textContent = "Part Time";
                    break;
                case 3:
                    this.runwayLightsElement.textContent = "Full Time";
                    break;
                case 4:
                    this.runwayLightsElement.textContent = "Frequency";
                    break;
            }
            var frequencies = [];
            for (let i = 0; i < infos.frequencies.length; i++) {
                frequencies.push('<div class="Freq"><div class="Name">' + infos.frequencies[i].name + '</div><div class="Value Blinking">' + infos.frequencies[i].mhValue.toFixed(3) + '</div></div>');
            }
            this.frequenciesSelectionGroup.setStringElements(frequencies);
            this.mapElement.setCenter(infos.coordinates);
        }
        else {
            this.symbolElement.textContent = "";
            this.typeElement.textContent = "Unknown";
            this.facilityNameElement.textContent = "____________________";
            this.cityElement.textContent = "____________________";
            this.regionElement.textContent = "__________";
            this.elevationElement.textContent = "____FT";
            this.latitudeElement.textContent = "_ __°__.__'";
            this.longitudeElement.textContent = "____°__.__'";
            this.fuelAvailableElement.textContent = "";
            this.timeZoneElement.textContent = "UTC__";
            this.runwayNameElement.textContent = "__-__";
            this.runwaySizeElement.textContent = "____FT x ___FT";
            this.runwaySurfaceTypeElement.textContent = "____________________";
            this.runwayLightsElement.textContent = "____________________";
        }
    }
    onExit() {
        this.gps.mapElement.instrument.setTrackUpDisabled(false);
    }
    onEvent(_event) {
    }
    update(_deltaTime) {
    }
    activateSearchField(_event) {
        if (_event == "FMS_Upper_INC" || _event == "FMS_Upper_DEC") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch();
            this.selectedRunway = 0;
            this.gps.SwitchToInteractionState(3);
        }
    }
    runwaySelection(_event) {
        if (_event == "FMS_Upper_INC") {
            this.selectedRunway = (this.selectedRunway + 1) % this.icaoSearchField.getUpdatedInfos().runways.length;
        }
        else if (_event == "FMS_Upper_DEC") {
            let length = this.icaoSearchField.getUpdatedInfos().runways.length;
            this.selectedRunway = (this.selectedRunway - 1 + length) % length;
        }
    }
    blinkGetState(_blinkPeriod, _duration) {
        return true;
    }
    frequencyCallback(_event, _index) {
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (_event == "ENT_Push") {
            if (infos.frequencies[_index].mhValue >= 118) {
                let index = this.gps.getElementOfType(AS1000.ComFrequencies).getActiveIndex();
                SimVar.SetSimVarValue("K:COM" + (index == 1 ? "" : "2") + "_STBY_RADIO_SET", "Frequency BCD16", infos.frequencies[_index].bcd16Value);
            }
            else {
                let index = this.gps.getElementOfType(AS1000.NavFrequencies).getActiveIndex();
                SimVar.SetSimVarValue("K:NAV" + (index == 1 ? "1" : "2") + "_STBY_SET", "Frequency BCD16", infos.frequencies[_index].bcd16Value);
            }
        }
    }
}
class AS1000_MFD_AirportInfos2 extends NavSystemElement {
    constructor(_searchField) {
        super();
        this.icaoSearchField = _searchField;
    }
    init(root) {
        this.rootElement = root;
        this.identElement = this.gps.getChildById("AirportInfos2_ident");
        this.symbolElement = this.gps.getChildById("AirportInfos2_symbol");
        this.typeElement = this.gps.getChildById("AirportInfos2_type");
        this.facilityElement = this.gps.getChildById("AirportInfos2_facility");
        this.cityElement = this.gps.getChildById("AirportInfos2_city");
        this.icaoSearchField.elements.push(this.identElement);
        this.mapContainer = this.gps.getChildById("AirportMap");
        this.mapElement = this.gps.getChildById("MapInstrument");
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.activateSearchField.bind(this))
        ];
    }
    onEnter() {
        this.rootElement.setAttribute("state", "Infos2");
        this.mapContainer.appendChild(this.mapElement);
        this.mapElement.setAttribute("bing-mode", "vfr");
        this.gps.mapElement.instrument.setTrackUpDisabled(true);
    }
    onUpdate(_deltaTime) {
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao != "") {
            this.symbolElement.textContent = "";
            switch (infos.privateType) {
                case 0:
                    this.typeElement.textContent = "Unknown";
                    break;
                case 1:
                    this.typeElement.textContent = "Public";
                    break;
                case 2:
                    this.typeElement.textContent = "Military";
                    break;
                case 3:
                    this.typeElement.textContent = "Private";
                    break;
            }
            this.facilityElement.textContent = infos.name;
            this.cityElement.textContent = infos.city;
            this.mapElement.setCenter(infos.coordinates);
        }
        else {
            this.symbolElement.textContent = "";
            this.typeElement.textContent = "Unknown";
            this.facilityElement.textContent = "____________________";
            this.cityElement.textContent = "____________________";
        }
    }
    onExit() {
        this.gps.mapElement.instrument.setTrackUpDisabled(false);
    }
    onEvent(_event) {
    }
    activateSearchField(_event) {
        if (_event == "FMS_Upper_INC" || _event == "FMS_Upper_DEC") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch();
            this.gps.SwitchToInteractionState(3);
        }
    }
}

class AS1000_MFD_NearestAirport extends NavSystemPage {
    constructor() {
        super("NEAREST AIRPORTS", "Nrst_Airport", new AS1000_MFD_NearestAirport_Element());
        this.mapMenu = new AS1000_MapMenu();
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.softKeys = new SoftKeysMenu();
        this.aptSoftkey = new SoftKeyElement("APT", this.activateApt.bind(this));
        this.rnwySoftkey = new SoftKeyElement("RNWY", this.activateRnwy.bind(this));
        this.freqSoftkey = new SoftKeyElement("FREQ", this.activateFreq.bind(this));
        this.aprSoftkey = new SoftKeyElement("APR", this.activateApr.bind(this));
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement("", null),
            this.aptSoftkey,
            this.rnwySoftkey,
            this.freqSoftkey,
            this.aprSoftkey,
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null)
        ];
    }
    onUpdate(_deltaTime) {
        if (this.gps.currentInteractionState == 0) {
            this.reinitSoftkeys();
        }
        return super.onUpdate(_deltaTime);
    }
    reinitSoftkeys() {
        this.aptSoftkey.state = "None";
        this.rnwySoftkey.state = "None";
        this.freqSoftkey.state = "None";
        this.aprSoftkey.state = "None";
    }
    activateApt() {
        this.element.aptSelect();
        this.reinitSoftkeys();
        this.aptSoftkey.state = "White";
    }
    activateRnwy() {
        this.element.rnwySelect();
        this.reinitSoftkeys();
        this.rnwySoftkey.state = "White";
    }
    activateFreq() {
        this.element.freqSelect();
        this.reinitSoftkeys();
        this.freqSoftkey.state = "White";
    }
    activateApr() {
        this.element.aprSelect();
        this.reinitSoftkeys();
        this.aprSoftkey.state = "White";
    }
}
class AS1000_MFD_NearestVOR extends NavSystemPage {
    constructor() {
        super("NEAREST VOR", "Nrst_VOR", new AS1000_MFD_NearestVOR_Element());
        this.mapMenu = new AS1000_MapMenu();
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.vorSoftKey = new SoftKeyElement("VOR", this.activateVor.bind(this));
        this.freqSoftKey = new SoftKeyElement("FREQ", this.activateFreq.bind(this));
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement("", null),
            this.vorSoftKey,
            this.freqSoftKey,
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null)
        ];
    }
    onUpdate(_deltaTime) {
        if (this.gps.currentInteractionState == 0) {
            this.reinitSoftkeys();
        }
        return super.onUpdate(_deltaTime);
    }
    reinitSoftkeys() {
        this.vorSoftKey.state = "None";
        this.freqSoftKey.state = "None";
    }
    activateVor() {
        this.element.vorSelect();
        this.reinitSoftkeys();
        this.vorSoftKey.state = "White";
    }
    activateFreq() {
        this.element.freqSelect();
        this.reinitSoftkeys();
        this.freqSoftKey.state = "White";
    }
}
class AS1000_MFD_NearestNDB extends NavSystemPage {
    constructor() {
        super("NEAREST NDB", "Nrst_NDB", new AS1000_MFD_NearestNDB_Element());
        this.mapMenu = new AS1000_MapMenu();
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null)
        ];
    }
}
class AS1000_MFD_NearestIntersection extends NavSystemPage {
    constructor() {
        super("NEAREST INTERSECTIONS", "Nrst_Intersections", new AS1000_MFD_NearestIntersection_Element());
        this.mapMenu = new AS1000_MapMenu();
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null)
        ];
    }
}
class AS1000_MFD_NearestAirport_Element extends MFD_NearestAirport_Element {
    init(_root) {
        super.init(_root);
        this.mapContainer = _root.getElementsByClassName("Map")[0];
        this.mapElement = this.gps.getChildById("MapInstrument");
    }
    onEnter() {
        super.onEnter();
        this.mapContainer.appendChild(this.mapElement);
        this.mapElement.setAttribute("bing-mode", "vfr");
        this.gps.mapElement.instrument.setTrackUpDisabled(true);
    }
    onExit() {
        super.onExit();
        this.gps.mapElement.instrument.setTrackUpDisabled(false);
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        let infos = this.currentWaypoint.GetInfos();
        this.mapElement.setCenter(infos.coordinates);
    }
}
class AS1000_MFD_NearestVOR_Element extends MFD_NearestVOR_Element {
    init(_root) {
        super.init(_root);
        this.mapContainer = _root.getElementsByClassName("Map")[0];
        this.mapElement = this.gps.getChildById("MapInstrument");
    }
    onEnter() {
        super.onEnter();
        this.mapContainer.appendChild(this.mapElement);
        this.mapElement.setAttribute("bing-mode", "vfr");
        this.gps.mapElement.instrument.setTrackUpDisabled(true);
    }
    onExit() {
        super.onExit();
        this.gps.mapElement.instrument.setTrackUpDisabled(false);
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        let infos = this.currentWaypoint.GetInfos();
        this.mapElement.setCenter(infos.coordinates);
    }
    frequencyCallback(_event) {
        if (_event == "ENT_Push") {
            let navFreq = this.gps.getElementOfType(AS1000.NavFrequencies);
            let navIndex = 1;
            if (navFreq) {
                navIndex = navFreq.getActiveIndex();
            }
            SimVar.SetSimVarValue("K:NAV" + navIndex + "_STBY_SET", "Frequency BCD16", this.currentWaypoint.GetInfos().frequencyBcd16);
        }
    }
}
class AS1000_MFD_NearestNDB_Element extends MFD_NearestNDB_Element {
    init(_root) {
        super.init(_root);
        this.mapContainer = _root.getElementsByClassName("Map")[0];
        this.mapElement = this.gps.getChildById("MapInstrument");
    }
    onEnter() {
        super.onEnter();
        this.mapContainer.appendChild(this.mapElement);
        this.mapElement.setAttribute("bing-mode", "vfr");
        this.gps.mapElement.instrument.setTrackUpDisabled(true);
    }
    onExit() {
        super.onExit();
        this.gps.mapElement.instrument.setTrackUpDisabled(false);
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        let infos = this.currentWaypoint.GetInfos();
        this.mapElement.setCenter(infos.coordinates);
    }
}
class AS1000_MFD_NearestIntersection_Element extends MFD_NearestIntersection_Element {
    init(_root) {
        super.init(_root);
        this.mapContainer = _root.getElementsByClassName("Map")[0];
        this.mapElement = this.gps.getChildById("MapInstrument");
    }
    onEnter() {
        super.onEnter();
        this.mapContainer.appendChild(this.mapElement);
        this.mapElement.setAttribute("bing-mode", "vfr");
        this.gps.mapElement.instrument.setTrackUpDisabled(true);
    }
    onExit() {
        super.onExit();
        this.gps.mapElement.instrument.setTrackUpDisabled(false);
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        let infos = this.currentWaypoint.GetInfos();
        this.mapElement.setCenter(infos.coordinates);
    }
}
class AS1000_MFD_SystemSetup extends NavSystemPage {
    constructor() {
        super("System Setup", "SystemSetup", new AS1000_MFD_SystemSetupElement());
    }
}
class AS1000_MFD_SystemSetupElement extends NavSystemElement {
    init(root) {
        this.channelSpacing = this.gps.getChildById("Setup_ChannelConfig");
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.channelSpacing, this.channelSpacingCB.bind(this))
        ];
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        Avionics.Utils.diffAndSet(this.channelSpacing, SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? "25 kHz" : "8.33 kHz");
    }
    onExit() {
    }
    onEvent(_event) {
    }
    channelSpacingCB(_event) {
        switch (_event) {
            case "NavigationSmallInc":
            case "NavigationSmallDec":
            case "ENT_Push":
                SimVar.SetSimVarValue("K:COM_1_SPACING_MODE_SWITCH", "number", 0);
                SimVar.SetSimVarValue("K:COM_2_SPACING_MODE_SWITCH", "number", 0);
                break;
        }
    }
}
class AS1000_MapMenu {
    constructor() {
        this.modeMenu = new SoftKeysMenu();
        this.gpsMenu = new SoftKeysMenu();
    }
    init(_owner, _gps) {
        this.owner = _owner;
        this.gps = _gps;
        this.mapElement = this.gps.mapElement;
        this.modeMenu.elements = [
            new SoftKeyElement("TRAFFIC", null),
            new SoftKeyElement("PROFILE", null),
            new SoftKeyElement("TOPO", this.mapElement.toggleIsolines.bind(this.mapElement), this.getKeyState.bind(this, "TOPO")),
            new SoftKeyElement("TERRAIN", null, () => { return "White" }),
            new SoftKeyElement("AIRWAYS", null),
            new SoftKeyElement("TRCK UP", this.gps.toggleMapOrientation.bind(this.gps), this.getKeyState.bind(this, "TRCK UP")),
            new SoftKeyElement("NEXRAD", this.mapElement.toggleNexrad.bind(this.mapElement), this.getKeyState.bind(this, "NEXRAD")),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("BACK", this.close.bind(this)),
            new SoftKeyElement("", null)
        ];
    }
    open() {
        this.originalMenu = Object.assign({}, this.owner.softKeys);
        this.switchMenu(this.modeMenu);
    }
    close() {
        this.owner.softKeys = this.originalMenu;
    }
    switchMenu(_menu) {
        this.owner.softKeys = _menu;
    }
    getKeyState(_keyName) {
        switch (_keyName) {
            case "TOPO":
                {
                    if (this.mapElement.getIsolines())
                        return "White";
                    break;
                }
            case "NEXRAD":
                {
                    if (this.mapElement.getNexrad())
                        return "White";
                    break;
                }
            case "TRCK UP":
                {
                    if (this.gps.trackup)
                        return "White";
                    break;
                }
        }
        return "None";
    }
}
class AS1000_Engine_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_Engine} engineDisplay 
     * @param {WT_MFD_Soft_Key_Menu_Handler} menuHandler 
     */
    constructor(engineDisplay, softKeyMenuHandler) {
        super(false);
        this.engineDisplay = engineDisplay;
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.pageButtons = [];
        this.selectedPage = new Subject("");

        this.selectedPage.value = this.engineDisplay.selectedEnginePage;
        this.engineDisplay.engineDisplayPages.subscribe(this.initPageButtons.bind(this));
        this.selectedPage.subscribe((pageId) => {
            for (let button of this.pageButtons) {
                button.selected = button.textContent == pageId;
            }
        });
    }
    initPageButtons(enginePages) {
        this.clearSoftKeys();
        let i = 1;
        this.pageButtons = [];
        for (let id in enginePages) {
            let button = new WT_Soft_Key(id, this.selectEngineDisplayPage.bind(this, id));
            this.pageButtons.push(button);
            this.addSoftKey(i++, button);
        }
        this.addSoftKey(11, this.softKeyMenuHandler.getBackButton());
    }
    selectEngineDisplayPage(id) {
        this.selectedPage.value = id;
        this.engineDisplay.selectEnginePage(id);
    }
}
registerInstrument("as1000-mfd-element", AS1000_MFD);
//# sourceMappingURL=AS1000_MFD.js.map