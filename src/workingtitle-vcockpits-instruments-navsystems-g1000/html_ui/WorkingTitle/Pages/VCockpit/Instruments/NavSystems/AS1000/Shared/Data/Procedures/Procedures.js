class Procedures {
    /**
     * @param {FlightPlanManager} flightPlanManager 
     */
    constructor(flightPlanManager) {
        this.flightPlanManager = flightPlanManager;

        this.origin = new Subject(null);
        this.destination = new Subject(null);
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
            waypoints.destination = flightPlanManager.getGPSActiveWaypointIndex(true);
            waypoints.origin = flightPlanManager.getGPSActiveWaypointIndex(true) - 1;
        }
        if (waypoints.origin === null || waypoints.destination === null)
            return null;
        return waypoints;
    }
    update() {
        this.origin.value = this.flightPlanManager.getOrigin();
        this.destination.value = this.flightPlanManager.getDestination();
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