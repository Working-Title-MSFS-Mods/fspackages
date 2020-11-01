class WT_Flight_Plan_Page_Model extends WT_Model {
    /**
     * @param {FlightPlanManager} flightPlan 
     * @param {Procedures} procedures 
     */
    constructor(flightPlan, procedures) {
        super();
        this.flightPlan = flightPlan;
        this.procedures = procedures;

        this.activeLeg = procedures.activeLeg;
        this.waypoints = new Subject();
        this.viewMode = new Subject("narrow");
        this.distanceMode = new Subject("leg");
        this.selectedWaypointIndex = null;
        this.selectedWaypoint = null;
        this.previousWaypoint = null;

        this.updateWaypoints();
    }
    setAltitude(waypointIndex, altitudeInFt) {
        waypointIndex = parseInt(waypointIndex);
        altitudeInFt = parseInt(altitudeInFt);
        this.flightPlan.setWaypointAdditionalData(waypointIndex, "ALTITUDE_MODE", "Manual");
        this.flightPlan.setWaypointAltitude(altitudeInFt / 3.2808, waypointIndex, () => {
            console.log(`Updated waypoint ${waypointIndex} altitude to ${altitudeInFt}`);
        });
    }
    setActiveWaypoint(waypointIndex = null) {
        this.flightPlan.setActiveWaypointIndex(waypointIndex === null ? this.selectedWaypointIndex : waypointIndex);
    }
    deleteWaypoint(waypointIndex) {
        waypointIndex = parseInt(waypointIndex);
        this.flightPlan.removeWaypoint(waypointIndex, false, this.updateWaypoints.bind(this));
    }
    deleteDeparture() {
        this.flightPlan.removeDeparture();
    }
    deleteArrival() {
        this.flightPlan.removeArrival();
    }
    deleteApproach() {
        this.flightPlan.deactivateApproach();
    }
    deleteFlightPlan() {
        this.flightPlan.clearFlightPlan();
    }
    createNewWaypoint(icao, index = -1) {
        this.flightPlan.addWaypoint(icao, index == -1 ? Infinity : (index - 1), this.updateWaypoints.bind(this));
    }
    updateWaypoints() {
        //this.flightPlan.updateFlightPlan();
        const flightPlan = this.flightPlan;
        this.waypoints.value = {
            departure: flightPlan.getDepartureWaypointsMap(),
            arrival: flightPlan.getArrivalWaypointsMap(),
            approach: flightPlan.getApproachWaypoints(),
            enroute: flightPlan.getEnRouteWaypoints(),
            origin: flightPlan.getOrigin(),
            destination: flightPlan.getDestination(),
        }
    }
    setSelectedWaypointIndex(index) {
        this.selectedWaypointIndex = index;
        let waypoints = this.flightPlan.getWaypoints();
        this.selectedWaypoint = waypoints[index];
        this.previousWaypoint = (index > 0) ? waypoints[index - 1] : null;
    }
    canShowAirwaySelector() {
        return this.previousWaypoint != null;
    }
    showAirwaySelector() {
        /*if (this.canShowAirwaySelector()) {
            this.gps.showAirwaySelector(this.previousWaypoint.infos).then(waypoints => {
                this.addWaypoints(waypoints.map(waypoint => waypoint.icao), this.selectedWaypointIndex);
            });
        }*/
    }
    addWaypoint(icao, index) {
        return new Promise(resolve => {
            this.flightPlan.addWaypoint(icao, index == -1 ? Infinity : index, () => {
                this.updateWaypoints();
                resolve();
            });
        });
    }
    addWaypoints(icaos, index) {
        return new Promise(async resolve => {
            let i = 0;
            for (let icao of icaos) {
                await new Promise(resolve => {
                    this.flightPlan.addWaypoint(icao, index == -1 ? Infinity : (index + i++), () => {
                        resolve();
                    });
                });
            }
            resolve();
        });
    }

    newWaypoint() {

    }
}

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

        let nullFunc = () => { };

        this.options = [
            new WT_Page_Menu_Option("Search and Rescue"),
            new WT_Page_Menu_Option("Show Chart"),
            new WT_Page_Menu_Option("Store Flight Plan"),
            new WT_Page_Menu_Option("Invert Flight Plan"),
            new WT_Page_Menu_Option("Delete Flight Plan", this.deleteFlightPlan.bind(this)),
            //new WT_Page_Menu_Option("Load Airway", view.showAirwaySelector.bind(view)),
            new WT_Page_Menu_Option("Collapse Airways"),
            new WT_Page_Menu_Option("Remove Departure", this.deleteDeparture.bind(this)),
            new WT_Page_Menu_Option("Remove Arrival", this.deleteArrival.bind(this)),
            new WT_Page_Menu_Option("Remove Approach", this.deleteApproach.bind(this)),
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
}

class WT_Flight_Plan_Input_Layer extends Selectables_Input_Layer {
    /**
     * @param {WT_Flight_Plan_Page_View} flightPlanView 
     */
    constructor(flightPlanView) {
        super(new Selectables_Input_Layer_Dynamic_Source(flightPlanView));
        this.flightPlanView = flightPlanView;
    }
    onCLR(inputStack) {
        this.flightPlanView.handleDelete();
    }
    onMenuPush() {
        this.flightPlanView.showPageMenu();
    }
}

class WT_Flight_Plan_Page_View extends WT_HTML_View {
    handleDelete() {
        throw new Error("WT_Flight_Plan_Page_View.handleDelete not implemented");
    }
    handleDelete() {
        throw new Error("WT_Flight_Plan_Page_View.showPageMenu not implemented");
    }
}