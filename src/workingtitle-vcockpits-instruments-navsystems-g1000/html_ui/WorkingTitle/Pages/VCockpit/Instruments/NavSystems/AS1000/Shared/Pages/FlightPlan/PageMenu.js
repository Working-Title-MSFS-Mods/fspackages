class WT_Flight_Plan_Page_Menu extends WT_Page_Menu_Model {
    /**
     * @param {WT_Flight_Plan_Page_Model} model
     * @param {WT_Flight_Plan_View} view
     * @param {WT_Show_Confirm_Dialog_Handler} confirmDialogHandler
     */
    constructor(model, view, confirmDialogHandler) {
        super();
        this.model = model;
        this.view = view;
        this.confirmDialogHandler = confirmDialogHandler;

        this.buttons = {
            deleteFlightPlan: new WT_Page_Menu_Option("Delete Flight Plan", this.deleteFlightPlan.bind(this)),
            loadAirway: new WT_Page_Menu_Option("Load Airway", this.showAirwaySelector.bind(this)),
            removeDeparture: new WT_Page_Menu_Option("Remove Departure", this.deleteDeparture.bind(this)),
            removeArrival: new WT_Page_Menu_Option("Remove Arrival", this.deleteArrival.bind(this)),
            removeApproach: new WT_Page_Menu_Option("Remove Approach", this.deleteApproach.bind(this)),
        };

        this.options = [
            new WT_Page_Menu_Option("Search and Rescue"),
            new WT_Page_Menu_Option("Show Chart"),
            new WT_Page_Menu_Option("Store Flight Plan"),
            new WT_Page_Menu_Option("Invert Flight Plan"),
            this.buttons.deleteFlightPlan,
            this.buttons.loadAirway,
            new WT_Page_Menu_Option("Collapse Airways"),
            this.buttons.removeDeparture,
            this.buttons.removeArrival,
            this.buttons.removeApproach,
            new WT_Page_Menu_Option("Temperature Compensation"),
            new WT_Page_Menu_Option("Closest Point of FPL"),
            new WT_Page_Menu_Option("Parallel Track"),
            new WT_Page_Menu_Option("Create New User Waypoint"),
            new WT_Page_Menu_Option("Select VNV Profile Window"),
            new WT_Page_Menu_Option("Cancel VNV"),
            new WT_Page_Menu_Option("VNV ->"),
            new WT_Page_Menu_Option("Create ATK Offset Waypoint"),
            new WT_Page_Menu_Option("Hold At Waypoint"),
            new WT_Page_Menu_Option("Hold At Present Position"),
        ];

        this.subscriptions = new Subscriptions();
    }
    showAirwaySelector() {
        this.model.showAirwaySelector$.next();
    }
    deleteDeparture() {
        this.confirmDialogHandler.show("Are you sure you want to delete the departure?")
            .then(this.model.deleteDeparture.bind(this.model));
    }
    deleteArrival() {
        this.confirmDialogHandler.show("Are you sure you want to delete the arrival?")
            .then(this.model.deleteArrival.bind(this.model));
    }
    deleteApproach() {
        this.confirmDialogHandler.show("Are you sure you want to delete the approach?")
            .then(this.model.deleteApproach.bind(this.model));
    }
    deleteFlightPlan() {
        this.confirmDialogHandler.show("Are you sure you want to delete this flight plan?")
            .then(this.model.deleteFlightPlan.bind(this.model));
    }
    activate() {
        this.subscriptions.add(
            this.model.canSelectAirway$.subscribe(can => this.buttons.loadAirway.enabled = can),
            this.model.canRemoveApproach$.subscribe(can => this.buttons.removeApproach.enabled = can),
            this.model.canRemoveArrival$.subscribe(can => this.buttons.removeArrival.enabled = can),
            this.model.canRemoveDeparture$.subscribe(can => this.buttons.removeDeparture.enabled = can),
            this.model.canDeleteFlightPlan$.subscribe(can => this.buttons.deleteFlightPlan.enabled = can),
        )
    }
    deactivate() {
        this.subscriptions.unsubscribe();
    }
}