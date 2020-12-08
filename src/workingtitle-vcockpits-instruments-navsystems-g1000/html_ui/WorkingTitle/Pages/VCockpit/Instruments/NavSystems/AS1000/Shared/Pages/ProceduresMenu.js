class Pane_Input_Layer extends Selectables_Input_Layer {
    constructor(pane, source) {
        super(source);
        this.pane = pane;
    }
    onCLR() {
        this.pane.exit();
    }
    onNavigationPush() {
        this.pane.exit();
    }
}

class WT_Procedures_Input_Layer extends Pane_Input_Layer {
    onProceduresPush() {
        this.pane.exit();
    }
}

class WT_Procedures_Menu_View extends WT_HTML_View {
    /**
     * @param {WT_Show_Procedure_Handler} showProcedureHandler 
     * @param {Procedures} procedures
     * @param {FlightPlanManager} flightPlanManager
     */
    constructor(showProcedureHandler, procedures, flightPlanManager) {
        super();
        this.showProcedureHandler = showProcedureHandler;
        this.procedures = procedures;
        this.flightPlanManager = flightPlanManager;

        this.subscriptions = new Subscriptions();
        this.inputLayer = new WT_Procedures_Input_Layer(this, new Selectables_Input_Layer_Dynamic_Source(this, "selectable-button:not([disabled])"));
        this.onExit = new WT_Event();
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        const template = document.getElementById('procedures-menu');
        this.appendChild(template.content.cloneNode(true));

        super.connectedCallback();

        this.procedures.approach.subscribe(approach => {
            DOMUtilities.ToggleAttribute(this.elements.activateApproachButton, "disabled", !approach);
            DOMUtilities.ToggleAttribute(this.elements.selectArrivalButton, "disabled", !approach);
        });

        this.procedures.origin.subscribe(origin => {
            DOMUtilities.ToggleAttribute(this.elements.selectDepartureButton, "disabled", !origin);
        });

        this.procedures.destination.subscribe(destination => {
            DOMUtilities.ToggleAttribute(this.elements.selectArrivalButton, "disabled", !destination);
        });
    };
    disconnectedCallback() {
        this.subscriptions.unsubscribe();
    }
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
        this.inputStackHandle.onPopped.subscribe(() => {
            this.onExit.fire();
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
    getDestinationIcao() {
        const destination = this.flightPlanManager.getDestination();
        if (destination) {
            if (destination.icao[0] == "A") {
                return destination.icao;
            }
        }
        return null;
    }
    getOriginIcao() {
        const origin = this.flightPlanManager.getOrigin();
        if (origin) {
            if (origin.icao[0] == "A") {
                return origin.icao;
            }
        }
        return null;
    }
    selectApproach() {
        this.exit();
        this.showProcedureHandler.showApproaches(this.getDestinationIcao());
    }
    selectArrival() {
        this.exit();
        this.showProcedureHandler.showArrivals(this.getDestinationIcao());
    }
    selectDeparture() {
        this.exit();
        this.showProcedureHandler.showDepartures(this.getOriginIcao());
    }
    activateApproach() {
        this.exit();
        this.flightPlanManager.activateApproach();
    }
}
customElements.define("g1000-procedures-menu", WT_Procedures_Menu_View);