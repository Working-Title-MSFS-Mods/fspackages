class AS1000_MFD extends BaseAS1000 {
    constructor() {
        super();

        window.addEventListener('unhandledrejection', function (event) {
            console.error(`Unhandled exception: ${event.reason}`);
        });

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
        d.register("changelogRepository", d => new WT_Changelog_Repository());
        d.register("metarDownloader", d => new WT_Metar_Downloader());
        d.register("metarRepository", d => new WT_Metar_Repository(d.metarDownloader));

        //d.register("mainMap", d => document.querySelector("#MapInstrument"));
        d.register("mainMap", d => {
            const map = document.querySelector("#MapInstrument");
            map.rangeRingElement = new SvgRangeRingElement();
            map.rangeCompassElement = new SvgRangeCompassElement();
            map.trackVectorElement = new SvgTrackVectorElement();
            map.fuelRingElement = new SvgFuelRingElement();
            map.altitudeInterceptElement = new SvgAltitudeInterceptElement();
            const feet = 1 / 6076;
            map.zoomRanges = [500 * feet, 800 * feet, 1000 * feet, 1500 * feet, 2000 * feet, 3000 * feet, 5000 * feet, 1, 1.5, 2, 3, 5, 8, 10, 15, 20, 30, 50, 80, 100, 150, 200, 300, 500, 800, 1000];
            return map;
        });
        d.register("miniMap", d => document.querySelector("#MiniMap"));

        d.register("pageMenuHandler", d => new WT_MFD_Show_Page_Menu_Handler(d.inputStack, d.pageContainer, d.softKeyMenuHandler));
        d.register("confirmDialogHandler", d => new WT_Show_Confirm_Dialog_Handler(d.inputStack, d.dialogContainer, d.softKeyMenuHandler));
        d.register("waypointSelectorModelFactory", d => new WT_Waypoint_Selector_Model_Factory(d.waypointRepository));
        d.register("waypointSelectorViewFactory", d => new WT_MFD_Waypoint_Selector_View_Factory(d.waypointInputModel, d.softKeyMenuHandler, d.mapInputLayerFactory));
        d.register("showNewWaypointHandler", d => new WT_MFD_Show_New_Waypoint_Handler(d.paneContainer, d.waypointSelectorModelFactory, d.waypointSelectorViewFactory, d.miniMap, d.inputStack));
        d.register("directToHandler", d => new WT_Master_Direct_To_Handler(d.sharedEvents, d.waypointRepository, d.flightPlanController, d.mainMap));
        d.register("directToModelFactory", d => new WT_Direct_To_Model_Factory(this, d.waypointRepository, d.directToHandler));
        d.register("directToViewFactory", d => new WT_MFD_Direct_To_View_Factory(d.softKeyMenuHandler, d.waypointInputModel, d.pageMenuHandler, d.mapInputLayerFactory));
        d.register("showDirectToHandler", d => new WT_MFD_Show_Direct_To_Handler(d.paneContainer, d.directToModelFactory, d.directToViewFactory, d.miniMap, d.inputStack));
        d.register("showAirwaysHandler", d => new WT_Show_Airways_Handler(this, d.inputStack, d.overlayPageContainer, d.mainMap));
        d.register("showProcedureHandler", d => new WT_Show_Procedure_Handler(d.pageController, d.flightPlanManager, d.procedureFacilityRepository, () => d.procedurePageView));
        d.register("showWaypointInfoHandler", d => new WT_Show_Waypoint_Info_Handler(d.pageController));
        d.register("procedurePageView", d => new WT_Procedure_Page_View(d.softKeyMenuHandler, d.mainMap, d.waypointInputModel), { scope: "transient" });
        d.register("softKeyMenuHandler", d => new WT_MFD_Soft_Key_Menu_Handler(d.softKeyController));
        d.register("showDuplicatesHandler", d => new WT_MFD_Show_Duplicates_Handler(d.dialogContainer, d.waypointRepository, d.inputStack));

        d.register("frequencyListModel", d => new WT_Frequency_List_Model(d.comFrequenciesModel, d.navFrequenciesModel), { scope: "transient" });

        d.register("mapModel", d => new WT_Map_Model(d.showMapSetupHandler, d.mainMap), { scope: "transient" });
        d.register("mapView", d => new WT_Map_View(d.pageMenuHandler, d.softKeyController), { scope: "transient" });

        d.register("weatherModel", d => new WT_Weather_Page_Model(), { scope: "transient" });
        d.register("weatherView", d => new WT_Weather_Page_View(d.mainMap, d.softKeyMenuHandler), { scope: "transient" });

        d.register("airportInformationModel", d => new WT_Airport_Information_Model(d.showDirectToHandler, d.waypointRepository, d.airportDatabase, d.metarRepository), { scope: "transient" });
        d.register("airportInformationView", d => new WT_Airport_Information_View(d.mainMap, d.waypointInputModel, d.frequencyListModel, d.softKeyMenuHandler), { scope: "transient" });

        d.register("intersectionInformationModel", d => new WT_Intersection_Information_Model(d.showDirectToHandler, d.waypointRepository), { scope: "transient" });
        d.register("intersectionInformationView", d => new WT_Intersection_Information_View(d.mainMap, d.icaoInputModel), { scope: "transient" });

        d.register("utilityModel", d => new WT_Utility_Page_Model(d.planeStatistics), { scope: "transient" });
        d.register("utilityView", d => new WT_Utility_Page_View(), { scope: "transient" });

        d.register("systemSettingsModel", d => new WT_System_Settings_Model(d.settings), { scope: "transient" });
        d.register("systemSettingsView", d => new WT_System_Settings_View(d.softKeyMenuHandler), { scope: "transient" });

        d.register("modSettingsModel", d => new WT_Mod_Settings_Model(d.modSettings), { scope: "transient" });
        d.register("modSettingsView", d => new WT_Mod_Settings_View(d.softKeyMenuHandler), { scope: "transient" });

        d.register("changelogModel", d => new WT_Changelog_Model(d.changelogRepository), { scope: "transient" });
        d.register("changelogView", d => new WT_Changelog_View(), { scope: "transient" });

        d.register("tripPlanningModel", d => new WT_Trip_Planning_Model(d.clock, d.barometricPressure, d.flightPlanManager), { scope: "transient" });
        d.register("tripPlanningView", d => new WT_Trip_Planning_View(d.softKeyMenuHandler, d.showNewWaypointHandler, d.mainMap), { scope: "transient" });

        d.register("creditsModel", d => new WT_Credits_Model(), { scope: "transient" });
        d.register("creditsView", d => new WT_Credits_View(), { scope: "transient" });

        d.register("flightPlanModel", d => new WT_Flight_Plan_Page_Model(d.flightPlanManager, d.procedures, d.showAirwaysHandler, d.showDirectToHandler), { scope: "transient" });
        d.register("flightPlanView", d => new WT_MFD_Flight_Plan_Page_View(d.mainMap, d.softKeyMenuHandler, d.pageMenuHandler, d.confirmDialogHandler, d.showNewWaypointHandler), { scope: "transient" });

        d.register("nearestAirportsModel", d => new WT_Nearest_Airports_Model(this, d.showDirectToHandler, d.waypointRepository, d.unitChooser, d.mainMap, d.nearestWaypoints, d.showWaypointInfoHandler), { scope: "transient" });
        d.register("nearestAirportsView", d => new WT_Nearest_Airports_View(d.frequencyListModel, d.unitChooser, d.softKeyMenuHandler, d.showProcedureHandler), { scope: "transient" });

        d.register("nearestNdbsModel", d => new WT_Nearest_Ndbs_Model(d.waypointRepository, d.nearestWaypoints, d.showWaypointInfoHandler), { scope: "transient" });
        d.register("nearestNdbsView", d => new WT_Nearest_Ndbs_View(d.softKeyMenuHandler, d.mainMap, d.unitChooser), { scope: "transient" });

        d.register("nearestVorsModel", d => new WT_Nearest_Vors_Model(d.waypointRepository, d.nearestWaypoints, d.showWaypointInfoHandler), { scope: "transient" });
        d.register("nearestVorsView", d => new WT_Nearest_Vors_View(d.softKeyMenuHandler, d.mainMap, d.unitChooser), { scope: "transient" });

        d.register("pageTitle", d => new Subject("MAP - NAVIGATION MAP"));
        d.register("mapPage", d => new WT_Page("Map", () => d.mapModel, () => d.mapView));

        d.register("airportInformationPage", d => new WT_Page("Airport Information", () => d.airportInformationModel, () => d.airportInformationView));
        d.register("intersectionInformationPage", d => new WT_Page("Intersection Information", () => d.intersectionInformationModel, () => d.intersectionInformationView));

        d.register("utilityPage", d => new WT_Page("Utility", () => d.utilityModel, () => d.utilityView));
        d.register("tripPlanningPage", d => new WT_Page("Trip Planning", () => d.tripPlanningModel, () => d.tripPlanningView));
        d.register("systemSettingsPage", d => new WT_Page("System Settings", () => d.systemSettingsModel, () => d.systemSettingsView));
        d.register("modSettingsPage", d => new WT_Page("Mod Settings", () => d.modSettingsModel, () => d.modSettingsView));
        d.register("changelogPage", d => new WT_Page("Changelog", () => d.changelogModel, () => d.changelogView));
        d.register("creditsPage", d => new WT_Page("Credits", () => d.creditsModel, () => d.creditsView));

        d.register("flightPlanPage", d => new WT_Page("Flight Plan", () => d.flightPlanModel, () => d.flightPlanView));

        d.register("nearestAirportsPage", d => new WT_Page("Nearest Airports", () => d.nearestAirportsModel, () => d.nearestAirportsView));
        d.register("nearestNdbsPage", d => new WT_Page("Nearest NDBs", () => d.nearestNdbsModel, () => d.nearestNdbsView));
        d.register("nearestVorsPage", d => new WT_Page("Nearest VORs", () => d.nearestVorsModel, () => d.nearestVorsView));

        d.register("mapPageGroup", d => new WT_Page_Controller_Group("MAP", [d.mapPage]));

        d.register("pageController", d => new WT_Page_Controller([
            d.mapPageGroup,
            new WT_Page_Controller_Group("WPT", [d.airportInformationPage, d.intersectionInformationPage]),
            new WT_Page_Controller_Group("AUX", [d.tripPlanningPage, d.utilityPage, d.systemSettingsPage, d.modSettingsPage, d.changelogPage, d.creditsPage]),
            new WT_Page_Controller_Group("FPL", [d.flightPlanPage]),
            new WT_Page_Controller_Group("NRST", [d.nearestAirportsPage, d.nearestNdbsPage, d.nearestVorsPage]),
        ], d.pageTitle));
        d.register("weatherPage", d => new WT_Page("Weather Radar", () => d.weatherModel, () => d.weatherView));
        d.register("mfdInputLayer", d => new Base_Input_Layer(this, d.navFrequenciesModel, d.comFrequenciesModel, d.showDirectToHandler, null));

        d.register("mapSetup", d => new WT_Map_Setup(WT_Map_Setup.DEFAULT));
        d.register("mapSetupHandler", d => new WT_Map_Setup_Handler(d.mapSetup, d.mainMap));
        d.register("mapSetupModel", d => new WT_Map_Setup_Model(d.mapSetup), { scope: "transient" });
        d.register("mapSetupView", d => new WT_Map_Setup_View(d.softKeyMenuHandler, d.mainMap), { scope: "transient" });
        d.register("showMapSetupHandler", d => new WT_Show_Map_Setup_Handler(d.mapSetupModel, d.mapSetupView, d.paneContainer, d.inputStack));

        d.register("mapMenu", d => new WT_Map_Menu(d.softKeyMenuHandler, d.mapSetup));

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
        this.pageController = d.pageController;
        this.mapInputLayerFactory = d.mapInputLayerFactory;
        this.fuelUsed = d.fuelUsed;
        this.mainMap = d.mainMap;
        this.miniMap = d.miniMap;
        this.pageTitle = d.pageTitle;
        this.softKeyMenuHandler = d.softKeyMenuHandler;
        this.mapSetup = d.mapSetup;
        this.mapSetupHandler = d.mapSetupHandler;
        this.electricityAvailable = d.electricityAvailable;
        this.planeState = d.planeState;
        this.planeStatistics = d.planeStatistics;
        this.clock = d.clock;

        this.updatables.push(d.flightPlanController);
        this.updatables.push(d.nearestWaypoints);
        this.updatables.push(d.procedures);
        this.updatables.push(d.fuelUsed);
        this.updatables.push(d.planeStatistics);
        this.updatables.push(d.clock);

        this.initEngineDisplay();
        this.initMainMap(this.mapInputLayerFactory);
        this.initMiniMap();

        this.initModelView(d.navBoxModel, "g1000-nav-box");
        this.initModelView(d.comFrequenciesModel, "g1000-com-frequencies");
        this.initModelView(d.navFrequenciesModel, "g1000-nav-frequencies");

        this.initDefaultSoftKeys();
        this.softKeyMenus = {
            engine: new WT_Engine_Menu(this.engineDisplay, this.softKeyMenuHandler),
            map: d.mapMenu,
            main: new WT_Soft_Key_Menu(true)
        };

        this.softKeyController.setDefaultButtons(this.defaultSoftKeys.engine, this.defaultSoftKeys.debug, this.defaultSoftKeys.map, this.defaultSoftKeys.checklist);
        this.softKeyController.handleInput(this.inputStack);
        this.showMainMenu();

        this.inputStack.push(d.mfdInputLayer);

        this.initPageController();

        this.pageController.goTo("MAP", "Map");

        document.body.appendChild(this.dependencies.debugConsoleView);
        this.dependencies.debugConsoleView.setModel(this.dependencies.debugConsole);
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
            debug: new WT_Soft_Key("DEBUG", this.showDebugMenu.bind(this)),
            map: new WT_Soft_Key("MAP", this.showMapMenu.bind(this)),
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
    showMapMenu() {
        this.softKeyMenuHandler.show(this.softKeyMenus.map);
    }
    showDebugMenu() {
        this.softKeyMenuHandler.show(this.dependencies.debugMenu);
    }
    showDirectTo(icaoType = null, icao = null) {
        this.showDirectToHandler.show(icaoType, icao);
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
    parseXMLConfig() {
        super.parseXMLConfig();
        if (this.instrumentXmlConfig) {
            let altimeterIndexElems = this.instrumentXmlConfig.getElementsByTagName("AltimeterIndex");
            if (altimeterIndexElems.length > 0) {
                this.altimeterIndex = parseInt(altimeterIndexElems[0].textContent) + 1;
            }

            if (this.hasWeatherRadar()) {
                this.dependencies.mapPageGroup.addPage(this.dependencies.weatherPage);
            }
        }
    }
    onXMLConfigLoaded(_xml) {
        super.onXMLConfigLoaded(_xml);
        this.dependencies.planeConfig.updateConfig(this.xmlConfig);
    }
    onUpdate(dt) {
        for (let updatable of this.updatables) {
            updatable.update(dt);
        }
        if (this.mainMap.offsetParent)
            this.mainMap.update(dt);
        if (this.miniMap.offsetParent)
            this.miniMap.update(dt);
        this.electricityAvailable.value = this.isElectricityAvailable();
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
    onShutDown() {
        super.onShutDown();
        this.planeState.shutDown();
    }
    onPowerOn() {
        super.onPowerOn();
        this.planeState.powerOn();
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
class WT_Engine_Menu extends WT_Soft_Key_Menu {
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