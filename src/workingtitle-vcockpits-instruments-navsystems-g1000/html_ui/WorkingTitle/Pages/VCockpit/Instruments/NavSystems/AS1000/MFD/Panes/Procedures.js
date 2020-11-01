class Procedures {
    /**
     * @param {FlightPlanManager} flightPlanManager 
     */
    constructor(flightPlanManager) {
        this.flightPlanManager = flightPlanManager;

        this.approach = new Subject(null);
        this.departure = new Subject(null);
        this.arrival = new Subject(null);
        this.activeLeg = new Subject(null);
        this.activeWaypoint = new Subject();
    }
    compareActiveLegs(a, b) {
        if (a === null || b === null)
            return false;
        if (a.origin !== b.origin)
            return false;
        if (a.destination !== b.destination)
            return false;
        if (a.originIsApproach !== b.originIsApproach)
            return false;
        if (a.destinationIsApproach !== b.destinationIsApproach)
            return false;
        return true;
    }
    getActiveLeg() {
        const waypoints = {
            origin: null,
            destination: null,
            originIsApproach: false,
            destinationIsApproach: false
        };
        const flightPlanManager = this.flightPlanManager;
        if (flightPlanManager.isActiveApproach()) {
            const index = flightPlanManager.getApproachActiveWaypointIndex();
            waypoints.destination = index;
            waypoints.destinationIsApproach = true;
            if (index == 0) {
                waypoints.origin = flightPlanManager.getWaypointsCount() - 2;
            }
            else {
                waypoints.origin = index - 1;
                waypoints.originIsApproach = true;
            }
        }
        else {
            waypoints.destination = flightPlanManager.getGPSActiveWaypointIndex();
            waypoints.origin = flightPlanManager.getGPSActiveWaypointIndex() - 1;
        }
        if (waypoints.origin === null || waypoints.destination === null)
            return null;
        return waypoints;
    }
    update() {
        if (this.approach.hasSubscribers())
            this.approach.value = this.flightPlanManager.getAirportApproach();
        if (this.departure.hasSubscribers())
            this.departure.value = this.flightPlanManager.getDeparture();
        if (this.arrival.hasSubscribers())
            this.arrival.value = this.flightPlanManager.getArrival();
        if (this.activeLeg.hasSubscribers()) {
            let activeLeg = this.getActiveLeg();
            if (!this.compareActiveLegs(this.activeLeg.value, activeLeg)) {
                this.activeLeg.value = activeLeg;
            }
        }
        this.activeWaypoint.value = this.flightPlanManager.getGPSActiveWaypointIndex();
    }
}

class Pane_Input_Layer extends Selectables_Input_Layer {
    constructor(pane, source) {
        super(source);
        this.pane = pane;
    }
    onCLR() {
        this.pane.exit();
    }
}

class WT_Procedures_Input_Layer extends Pane_Input_Layer {
    onProceduresPush() {
        this.pane.exit();
    }
}

class WT_Procedures_Pane extends WT_HTML_View {
    /**
     * @param {WT_Show_Procedure_Handler} showProcedureHandler 
     */
    constructor(showProcedureHandler) {
        super();
        DOMUtilities.AddScopedEventListener(this, "selectable-button", "selected", this.onButtonClick.bind(this));
        this.subscriptions = new Subscriptions();
        this.showProcedureHandler = showProcedureHandler;
    }
    connectedCallback() {
        let template = document.getElementById('procedures-pane');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));

        this.elements = {
            loadedApproach: this.querySelector("[data-id=loadedApproach]"),
            loadedDeparture: this.querySelector("[data-id=loadedDeparture]"),
            loadedArrival: this.querySelector("[data-id=loadedArrival]"),
        };

        this.inputLayer = new WT_Procedures_Input_Layer(this, new Selectables_Input_Layer_Dynamic_Source(this, "selectable-button"));
        this.inputLayer.setExitHandler(this);
    };
    disconnectedCallback() {
        this.subscriptions.unsubscribe();
    }
    setProcedures(procedures) {
        this.subscriptions.add(procedures.approach.subscribe(this.updateLoadedApproach.bind(this)));
        this.subscriptions.add(procedures.arrival.subscribe(this.updateLoadedArrival.bind(this)));
        this.subscriptions.add(procedures.departure.subscribe(this.updateLoadedDeparture.bind(this)));
    }
    updateLoadedApproach(approach) {
        this.elements.loadedApproach.textContent = approach ? approach.name : "____-";
        this.elements.loadedApproach.classList.toggle("highlighted", approach != null);
    }
    updateLoadedArrival(arrival) {
        this.elements.loadedArrival.textContent = arrival ? arrival.name : "____-";
        this.elements.loadedArrival.classList.toggle("highlighted", arrival != null);
    }
    updateLoadedDeparture(departure) {
        this.elements.loadedDeparture.textContent = departure ? departure.name : "____-";
        this.elements.loadedDeparture.classList.toggle("highlighted", departure != null);
    }
    enter(gps, inputStack) {
        this.gps = gps;
        this.inputStackHandle = inputStack.push(this.inputLayer);
        this.inputStackHandle.onPopped.subscribe(() => {
            this.parentNode.removeChild(this);
        });
    }
    back() {
        this.exit();
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle = this.inputStackHandle.pop();
        }
    }
    selectApproach() {
        this.exit();
        this.showProcedureHandler.showApproaches();
    }
    selectArrival() {
        this.exit();
        this.showProcedureHandler.showArrivals();
    }
    selectDeparture() {
        this.exit();
        this.showProcedureHandler.showDepartures();
    }
}
customElements.define("g1000-procedures-pane", WT_Procedures_Pane);