class WT_Procedure_Page_Model extends WT_Model {
    /**
     * @param {AS1000_MFD} gps 
     * @param {FlightPlanManager} flightPlan 
     * @param {WaypointLoader} facilityLoader 
     * @param {WT_Waypoint_Quick_Select} waypointQuickSelect 
     */
    constructor(gps, flightPlan, facilityLoader, waypointQuickSelect) {
        super();

        this.gps = gps;
        this.flightPlan = flightPlan;
        this.facilityLoader = facilityLoader;
        this.waypointQuickSelect = waypointQuickSelect;

        this.airportWaypoint = new WayPoint(gps);

        this.icao = null;
        this.airport = new Subject();
    }
    selectFrequency(frequency) {
        SimVar.SetSimVarValue("K:NAV1_RADIO_SWAP", "number", 0);
        SimVar.SetSimVarValue("K:NAV1_RADIO_SET_HZ", "hertz", Math.floor(parseFloat(this.primaryFrequency.value.mhValue) * 1000000));
    }
    setICAO(icao) {
        this.icao = icao;
        this.airport.value = new WT_Procedure_Facility(icao, this.facilityLoader);
        /*this.airportWaypoint.SetICAO(icao, () => {
            this.airport.value = this.airportWaypoint.infos
        }, true);*/
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
    constructor(softKeyController, map, waypointQuickSelect) {
        super();

        this.map = map;
        this.softKeyController = softKeyController;
        this.waypointQuickSelect = waypointQuickSelect;

        this.subPageIndex = new Subject("APR");
        this.selectedPage = null;
        this.selectedPageSubscriptions = new Subscriptions();

        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this, "drop-down-selector, numeric-input, string-input, icao-input, toggle-switch, .sequence-entry, .selectable, selectable-button"));
        this.inputLayer.setExitHandler(this);

        this.onExit = new WT_Event();
    }
    /**
     * @param {WT_Procedure_Page_Model} model 
     */
    setModel(model) {
        this.model = model;

        this.elements.icaoInput.setQuickSelect(this.waypointQuickSelect);

        this.softKeyMenu = new WT_Procedure_Page_Menu(this);

        this.showSubPage("APR");
    }
    showSubPage(pageId) {
        if (this.selectedPage) {
            this.selectedPage.setAirport(null);
            this.selectedPage.removeAttribute("visible");
        }

        this.subPageIndex.value = pageId;

        this.selectedPage = this.pages[pageId];
        this.selectedPage.setAirport(this.model.airport);
        this.selectedPage.setAttribute("visible", "");

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
    }
    connectedCallback() {
        let template = document.getElementById('procedure-page');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();

        this.pages = {
            DP: this.elements.departurePage,
            STAR: this.elements.arrivalPage,
            APR: this.elements.approachPage,
        }
    };
    updateIcao(icao) {
        this.model.setICAO(icao);
    }
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
    mapToggles() {
        return ["show-cities", "show-vors", "show-ndbs", "show-roads", "show-intersections", "show-airspaces", "show-airports"];
    }
    activate() {
        //this.map.removeChild(this.map);
        this.previousSoftKeyMenu = this.softKeyController.currentMenu;
        this.softKeyController.setMenu(this.softKeyMenu);

        this.elements.map.appendChild(this.map);
        for (let toggle of this.mapToggles()) {
            this.map.setAttribute(toggle, "false");
        }
    }
    deactivate() {
        for (let toggle of this.mapToggles()) {
            this.map.setAttribute(toggle, "true");
        }
    }
}
customElements.define("g1000-procedures-page", WT_Procedure_Page_View);