class WT_Flight_Plan_Repository {
    constructor() {
        this.flightPlans = [];
    }
    commit() {
        WTDataStore.set(this.DATA_STORE_KEY, JSON.stringify(this.flightPlans));
    }
    saveFlightPlan(plan) {

    }
    saveCurrentFlightPlan(flightPlanManager) {
        let flightPlan = {
            name: "",
            departure: flightPlanManager.getDeparture().name,
            arrival: flightPlanManager.getArrival().name,
            approach: flightPlanManager.getAirportApproach().name,
            enroute: flightPlanManager.getEnRouteWaypoints().map(waypoint => waypoint.icao),
            origin: flightPlanManager.getOrigin().icao,
            destination: flightPlanManager.getDestination().icao,
        }
        this.saveFlightPlan(flightPlan);
    }
}
WT_Flight_Plan_Repository.DATA_STORE_KEY = "FlightPlans";