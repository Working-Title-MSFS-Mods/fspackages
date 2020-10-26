class WT_Normal_Flight_Plan_Controller {
    /**
     * @param {FlightPlanManager} flightPlanManager 
     */
    constructor(flightPlanManager) {
        this.flightPlanManager = flightPlanManager;
    }
    async activate() {
        let fpm = this.flightPlanManager;
        /*let currentData = {
            departure: fpm.getDepartureProcIndex(),
            arrival: fpm.getArrivalProcIndex(),
            arrivalTransition: fpm.getArrivalTransitionIndex(),
            approach: fpm.getApproachIndex(),
            approachTransition: fpm.getApproachTransitionIndex(),
            enroute: fpm.getEnRouteWaypoints(),
            origin: fpm.getOrigin(),
            destination: fpm.getDestination(),
        }
        fpm.createNewFlightPlan();*/
        fpm.createNewFlightPlan(() => {
            console.log("created");
            fpm.setCurrentFlightPlanIndex(1, () => fpm.setCurrentFlightPlanIndex(0));
        });
        //this.flightPlanManager.copyFlightPlanIntoCurrent(0);
    }
    deactivate() {

    }
    update(dt) {

    }
}