class WT_Procedure_Page_Model extends WT_Model {
    /**
     * @param {FlightPlanManager} flightPlanManager 
     * @param {WT_Procedure_Facility_Repository} procedureFacilityRepository
     */
    constructor(flightPlanManager, procedureFacilityRepository) {
        super();
        this.flightPlanManager = flightPlanManager;
        this.procedureFacilityRepository = procedureFacilityRepository;

        this.icao = null;
        this.airport = new Subject();
    }
    setICAO(icao) {
        this.icao = icao;
        this.airport.value = this.procedureFacilityRepository.get(icao);
    }
    /**
     * @param {WT_Selected_Procedure} procedure 
     */
    async loadProcedure(procedure) {
        procedure.load(this.flightPlanManager);
    }
    /**
     * @param {WT_Selected_Procedure} procedure 
     */
    async activateProcedure(procedure) {
        procedure.activate(this.flightPlanManager);
    }
}

class WT_Procedure_Page_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_Approach_Page_View} view 
     */
    constructor(view) {
        super(true);
        let buttons = {
            dp: this.addSoftKey(6, new WT_Soft_Key("DP", () => view.showSubPage("DP"))),
            star: this.addSoftKey(7, new WT_Soft_Key("STAR", () => view.showSubPage("STAR"))),
            apr: this.addSoftKey(8, new WT_Soft_Key("APR", () => view.showSubPage("APR"))),
        };
        view.subPageIndex.subscribe(page => {
            buttons.dp.selected = page == "DP";
            buttons.star.selected = page == "STAR";
            buttons.apr.selected = page == "APR";
        });
    }
}

class WT_Procedure_Page_View extends WT_HTML_View {
    /**
     * @param {WT_Soft_Key_Controller} softKeyController 
     * @param {MapInstrument} map 
     * @param {WT_Waypoint_Quick_Select} waypointQuickSelect 
     */
    constructor(softKeyController, map, waypointQuickSelect) {
        super();

        this.map = map;
        this.softKeyController = softKeyController;
        this.waypointQuickSelect = waypointQuickSelect;

        this.subPageIndex = new Subject(null);
        this.selectedPage = null;
        this.selectedPageSubscriptions = new Subscriptions();

        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this, "drop-down-selector, numeric-input, string-input, icao-input, toggle-switch, g1000-sequence-list li, .selectable, selectable-button"));
        this.inputLayer.setExitHandler(this);

        this.onExit = new WT_Event();
    }
    /**
     * @param {WT_Procedure_Page_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.softKeyMenu = new WT_Procedure_Page_Menu(this);
        this.showSubPage("APR");
    }
    /**
     * @param {string} pageId 
     */
    showSubPage(pageId) {
        if (this.selectedPage) {
            this.selectedPage.setAirport(null);
            this.selectedPage.removeAttribute("visible");
        }

        this.subPageIndex.value = pageId;

        this.selectedPage = this.pages[pageId];
        this.selectedPage.setAirport(this.model.airport);
        this.selectedPage.setAttribute("visible", "");
        this.inputLayer.refreshSelected();

        this.selectedPageSubscriptions.unsubscribe();
        this.selectedPageSubscriptions.add(this.selectedPage.selectedProcedure.subscribe(procedure => {
            if (procedure) {
                this.procedureElement = new SvgProcedureElement(procedure);
                this.map.procedureElement = this.procedureElement;
                if (this.procedureSubscription) {
                    this.procedureSubscription = this.procedureSubscription();
                }
                const updateMap = procedure => {
                    this.map.centerOnCoordinates(procedure.getSequence().map(leg => {
                        return leg.coordinates;
                    }));
                };
                this.procedureSubscription = procedure.onUpdated.subscribe(updateMap);
                updateMap(procedure);
            }
        }));
        if (this.selectedPage.onLoadProcedure) {
            this.selectedPageSubscriptions.add(this.selectedPage.onLoadProcedure.subscribe(selectedProcedure => {
                this.model.loadProcedure(selectedProcedure);
            }));
        }
        if (this.selectedPage.onActiveProcedure) {
            this.selectedPageSubscriptions.add(this.selectedPage.onActiveProcedure.subscribe(selectedProcedure => {
                this.model.activateProcedure(selectedProcedure);
            }));
        }
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        let template = document.getElementById('procedure-page');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();

        this.elements.icaoInput.setQuickSelect(this.waypointQuickSelect);
        this.pages = {
            DP: this.elements.departurePage,
            STAR: this.elements.arrivalPage,
            APR: this.elements.approachPage,
        }
    };
    updateIcao(icao) {
        this.model.setICAO(icao);
    }
    /**
     * @param {Input_Stack} inputStack 
     */
    enter(inputStack) {
        this.inputStack = inputStack;

        this.inputStackHandle = inputStack.push(this.inputLayer);
        this.map.mapConfigId = 1;
    }
    back() {
        this.onExit.fire();
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle.pop();
            this.inputStackHandle = null;
        }
        this.softKeyController.setMenu(this.previousSoftKeyMenu);
        this.map.mapConfigId = 0;
        this.map.procedureElement = null;
    }
    get mapToggles() {
        return ["show-cities", "show-vors", "show-ndbs", "show-roads", "show-intersections", "show-airspaces", "show-airports"];
    }
    activate() {
        this.previousSoftKeyMenu = this.softKeyController.currentMenu;
        this.softKeyController.setMenu(this.softKeyMenu);

        this.elements.map.appendChild(this.map);
        this.mapToggles.forEach(toggle => this.map.setAttribute(toggle, "false"));
    }
    deactivate() {
        this.mapToggles.forEach(toggle => this.map.setAttribute(toggle, "true"));
    }
}
customElements.define("g1000-procedures-page", WT_Procedure_Page_View);