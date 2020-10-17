class AS1000_MFD extends BaseAS1000 {
    constructor() {
        super();
        this.altimeterIndex = 0;
        this.initDuration = 5500;
        this.needValidationAfterInit = true;
        this.useUpdateBudget = false;
    }
    get templateID() { return "AS1000_MFD"; }
    connectedCallback() {
        super.connectedCallback();

        this.settings = new WT_Settings("g36", WT_Default_Settings.base);
        this.modSettings = new WT_Settings("mod", WT_Default_Settings.modBase);
        this.unitChooser = new WT_Unit_Chooser(this.settings);
        this.procedures = new Procedures(this.currFlightPlanManager);
        this.inputStack = new Input_Stack();
        this.loadSavedMapOrientation();
        this.engineDisplay = new WTEngine("Engine", "LeftInfos", this._xmlConfigPath);
        this.waypointQuickSelect = new WT_Waypoint_Quick_Select(this, this.currFlightPlanManager);

        this.pageContainer = this.getChildById("PageContainer");
        this.paneContainer = this.getChildById("PaneContainer");

        this.pageTitle = new Subject("MAP - NAVIGATION MAP");

        this.addIndependentElementContainer(this.engineDisplay);
        /*this.pageGroups = [
            new NavSystemPageGroup("MAP", this, [
                new AS1000_MFD_MainMap(this.engineDisplay)
            ]),
            new NavSystemPageGroup("WPT", this, [
                new AS1000_MFD_AirportInfos()
            ]),
            new NavSystemPageGroup("AUX", this, [
                new AS1000_MFD_SystemSetup(),
                new AS1000_MFD_Page("System Settings", new AS1000_MFD_SystemSettings(this.pageContainer, this.inputStack)),
            ]),
            new NavSystemPageGroup("NRST", this, [
                new AS1000_MFD_NearestAirport(),
                new AS1000_MFD_NearestVOR(),
                new AS1000_MFD_NearestNDB(),
                new AS1000_MFD_NearestIntersection(),
            ])
        ];*/
        this.mapElement2 = document.querySelector("#MapInstrument");
        this.mapElement2.init(this);
        this.mapElement2.parentNode.removeChild(this.mapElement2);
        this.inputStack.push(new WT_Map_Input_Layer(this.mapElement2));

        /*function buildMapColors() {
            let curve = new Avionics.Curve();
            curve.interpolationFunction = Avionics.CurveTool.StringColorRGBInterpolation;

            let svgConfig = new SvgMapConfig();
            curve.add(0, svgConfig.convertColor("#000000"));
            curve.add(16000, svgConfig.convertColor("#000000"));

            let colors = [SvgMapConfig.hexaToRGB(svgConfig.convertColor("#000080"))];

            for (let i = 0; i < 60; i++) {
                let color = curve.evaluate(i * 30000 / 60);
                colors[i + 1] = SvgMapConfig.hexaToRGB(color);
            }

            return colors;
        }

        let proceduresMapConfig = { resolution: 1024, aspectRatio: 1, heightColors: buildMapColors() };
        let bingMap = this.mapElement2.querySelector("bing-map");
        bingMap.addConfig(proceduresMapConfig);*/

        this.pageController = new WT_Page_Controller([
            {
                name: "MAP",
                pages: [
                    new WT_Page("Map", () => new WT_Map_Model(this.mapElement2), () => new WT_Map_View()),
                ]
            },
            {
                name: "AUX",
                pages: [
                    new WT_Page("System Settings", () => new WT_System_Settings_Model(this.settings, this.softKeyMenu), () => new WT_System_Settings_View()),
                    new WT_Page("Mod Settings", () => new WT_Mod_Settings_Model(this.modSettings, this.softKeyMenu), () => new WT_Mod_Settings_View()),
                    new WT_Page("Credits", () => new WT_Credits_Model(), () => new WT_Credits_View()),
                ]
            },
            {
                name: "FPL",
                pages: [
                    new WT_Page("Flight Plan", () => new WT_Flight_Plan_Page_Model(this.currFlightPlanManager, this.procedures, this, this.softKeyMenu, this.mapElement2), () => new WT_Flight_Plan_Page_View()),
                ]
            },
            {
                name: "NRST",
                pages: [
                    new WT_Page("Nearest Airports", () => new WT_Nearest_Airports_Model(this, this.unitChooser, this.mapElement2, this.softKeyMenu), () => new WT_Nearest_Airports_View()),
                ]
            }
        ], this.pageTitle);
        this.pageController.handleInput(this.inputStack);
        //this.mapElement = new MFD_MapElement();
        //this.addIndependentElementContainer(new NavSystemElementContainer("FloatingMap", "RightInfos", this.mapElement));
        this.miniMap = document.querySelector("#MiniMap");
        this.miniMap.init(this);
        this.miniMap.parentNode.removeChild(this.miniMap);

        this.electricityAvailable = new Subject(this.isElectricityAvailable());
        this.fuelUsed = new WT_Fuel_Used(["FUEL LEFT QUANTITY", "FUEL RIGHT QUANTITY"]);
        this.electricityAvailable.subscribe((electricity) => { if (electricity) this.fuelUsed.reset(); });

        this.navBoxModel = new WT_MFD_Nav_Box_Model(this.pageTitle, this.unitChooser, this.settings);
        this.navBoxView = this.querySelector("g1000-nav-box");
        this.navBoxView.setModel(this.navBoxModel);

        this.navFrequenciesModel = new WT_Nav_Frequencies_Model();
        this.navFrequenciesView = this.querySelector("g1000-nav-frequencies");
        this.navFrequenciesView.setModel(this.navFrequenciesModel);

        this.comFrequenciesModel = new WT_Com_Frequencies_Model();
        this.comFrequenciesView = this.querySelector("g1000-com-frequencies");
        this.comFrequenciesView.setModel(this.comFrequenciesModel);

        this.querySelector("g1000-page-selector").setController(this.pageController);

        this.initDefaultSoftKeys();
        this.softKeyMenus = {
            engine: new AS1000_Engine_Menu(this.engineDisplay, () => this.showMainMenu()),
            main: new WT_Soft_Key_Menu(true)
        };

        this.softKeyMenu = this.getChildById("SoftKeyMenu");
        this.softKeyMenu.setDefaultButtons(this.defaultSoftKeys.engine, this.defaultSoftKeys.map, this.defaultSoftKeys.checklist);
        this.softKeyMenu.handleInput(this.inputStack);
        this.showMainMenu();

        this.inputStack.push(new Base_Input_Layer(this));
        this.pageController.goTo("MAP", "Map");
    }
    initDefaultSoftKeys() {
        let engine = new WT_Soft_Key("ENGINE", this.showEngineMenu.bind(this));
        let map = new WT_Soft_Key("MAP", null);
        let checklist = new WT_Soft_Key("CHKLIST", null);
        this.defaultSoftKeys = {
            engine: engine,
            map: map,
            checklist: checklist
        };
    }
    showMainMenu() {
        this.softKeyMenu.setMenu(this.softKeyMenus.main);
    }
    showEngineMenu() {
        this.softKeyMenu.setMenu(this.softKeyMenus.engine);
    }
    showConfirmDialog(message) {
        let confirm = new WT_Confirm_Dialog();
        this.getChildById("DialogContainer").appendChild(confirm);
        return confirm.show(message, this.inputStack).then((result) => {
            this.getChildById("DialogContainer").removeChild(confirm);
            return result;
        }, (e) => {
            this.getChildById("DialogContainer").removeChild(confirm);
            throw e;
        });
    }
    showApproaches() {
        let model = new WT_Approach_Page_Model(this, this.currFlightPlanManager, this.facilityLoader, this.waypointQuickSelect);
        model.setICAO("A      EGLL ");
        let view = document.createElement("g1000-approach-page");
        this.pageContainer.appendChild(view);
        view.setMapElement(this.mapElement2);
        view.setSoftKeyController(this.softKeyMenu);
        view.setModel(model);
        view.enter(this, this.inputStack);
    }
    showWaypointSelector(icaoType = null) {
        let model = new WT_Waypoint_Selector_Model(icaoType, this, this.softKeyMenu);
        let view = new WT_Waypoint_Selector_View();
        this.paneContainer.appendChild(view);
        view.setMap(this.miniMap);
        view.setModel(model);
        return view.enter(this.inputStack).catch(e => {
            this.paneContainer.removeChild(view);
        }).then(icao => {
            this.paneContainer.removeChild(view);
            return icao;
        });
    }
    showFlightPlan() {
        this.pageController.goTo("FPL", "Flight Plan");
    }
    showProcedures() {
        let element = document.createElement("g1000-procedures-pane");
        this.paneContainer.appendChild(element);
        element.setProcedures(this.procedures);
        element.enter(this, this.inputStack);
        this.pageTitle.value = "PROC - PROCEDURES";
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
        this.navBoxModel.update(dt);
        this.navFrequenciesModel.update(dt);
        this.comFrequenciesModel.update(dt);
        this.settings.update(dt);
        this.procedures.update(dt);
        this.electricityAvailable.value = this.isElectricityAvailable();
        this.fuelUsed.update(dt);
        this.pageController.update(dt);
        if (this.mapElement2.offsetParent)
            this.mapElement2.update(dt);
        if (this.miniMap.offsetParent)
            this.miniMap.update(dt);
    }
    disconnectedCallback() {
    }
    computeEvent(_event) {
        if (this.isBootProcedureComplete()) {
            let r = this.inputStack.processEvent(_event);
            if (r === false) {
                for (let i = 0; i < this.IndependentsElements.length; i++) {
                    this.IndependentsElements[i].onEvent(_event);
                }
                switch (_event) {
                    case "ActiveFPL_Modified":
                        console.log("Did a thing");
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
        try {
            super.Update();
            SimVar.SetSimVarValue("L:Glasscockpit_MFD_Started", "number", this.isStarted ? 1 : 0);
        } catch (e) {
            /*if (!this.efwef) {
                console.log(e.message);
                this.efwef = true;
            }*/
            throw e;
        }
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
            this.runwaySizeElement.textContent = Math.round(infos.runways[this.selectedRunway].length * 3.28084) + "FT x " + Math.round(infos.runways[this.selectedRunway].width * 3.28084) + "FT";
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
    constructor(engineDisplay, back) {
        super(false);
        this.engineDisplay = engineDisplay;
        this.back = back;
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
        this.addSoftKey(11, new WT_Soft_Key("BACK", this.back.bind(this)));
    }
    selectEngineDisplayPage(id) {
        this.selectedPage.value = id;
        this.engineDisplay.selectEnginePage(id);
    }
    back() {
        this.back();
    }
}
registerInstrument("as1000-mfd-element", AS1000_MFD);
//# sourceMappingURL=AS1000_MFD.js.map