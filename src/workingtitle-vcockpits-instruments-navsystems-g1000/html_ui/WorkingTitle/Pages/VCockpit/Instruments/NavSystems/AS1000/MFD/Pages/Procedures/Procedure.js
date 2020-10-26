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
        this.airportWaypoint.SetICAO(icao, () => {
            this.airport.value = this.airportWaypoint.infos
        }, true);
    }
}

class WT_Procedure_Page_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_Approach_Page_View} view 
     */
    constructor(model) {
        super();
        let buttons = {
            dp: this.addSoftKey(6, new WT_Soft_Key("DP", () => model.showSubPage("DP"))),
            star: this.addSoftKey(7, new WT_Soft_Key("STAR", () => model.showSubPage("STAR"))),
            apr: this.addSoftKey(8, new WT_Soft_Key("APR", () => model.showSubPage("APR"))),
        };
        /*model.subPageIndex.subscribe(page => {
            buttons.dp.selected = page == "DP";
            buttons.star.selected = page == "STAR";
            buttons.apr.selected = page == "APR";
        });*/
    }
}

class WT_Procedure_Page_View extends WT_HTML_View {
    constructor(softKeyController, map) {
        super();

        this.map = map;
        this.softKeyController = softKeyController;

        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this, "drop-down-selector, numeric-input, string-input, icao-input, toggle-switch, .sequence-entry, .selectable, selectable-button"));
        this.inputLayer.setExitHandler(this);
    }
    /**
     * @param {WT_Procedure_Page_Model} model 
     */
    setModel(model) {
        this.model = model;

        this.elements.icaoInput.setQuickSelect(this.model.waypointQuickSelect);

        this.softKeyMenu = new WT_Procedure_Page_Menu(this.model);

        this.elements.approachPage.setAirport(this.model.airport);
        this.elements.approachPage.selectedProcedure.subscribe(procedure => {
            if (procedure) {
                this.procedureElement = new SvgProcedureElement(procedure);
                this.map.procedureElement = this.procedureElement;
                procedure.onUpdated.subscribe(procedure => {
                    this.map.centerOnCoordinates(procedure.getSequence().filter(waypoint => !isNaN(waypoint.coordinates.lat)).map(waypoint => {
                        return waypoint.coordinates;
                    }));
                })
            }
        });
    }
    connectedCallback() {
        let template = document.getElementById('procedure-page');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();
    };
    updateIcao(icao) {
        this.model.setICAO(icao);
    }
    enter(inputStack) {
        this.inputStack = inputStack;

        this.inputStackHandle = inputStack.push(this.inputLayer);
        this.previousSoftKeyMenu = this.softKeyController.currentMenu;
        this.softKeyController.setMenu(this.softKeyMenu);
        this.map.mapConfigId = 1;
    }
    back() {
        this.exit();
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle.pop();
            this.inputStackHandle = null;
        }
        this.softKeyController.setMenu(this.previousSoftKeyMenu);
        this.map.mapConfigId = 0;
        this.parentNode.removeChild(this);
        this.map.procedureElement = null;
    }
    mapToggles() {
        return ["show-cities", "show-vors", "show-ndbs", "show-roads", "show-intersections", "show-airspaces", "show-airports"];
    }
    activate() {
        console.log("activated");
        //this.map.removeChild(this.map);
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