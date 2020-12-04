class Procedures {
    /**
     * @param {FlightPlanManager} flightPlanManager 
     */
    constructor(flightPlanManager) {
        this.flightPlanManager = flightPlanManager;

        this.updateObservable = new rxjs.Subject();

        const update = map => this.updateObservable.pipe(
            rxjs.operators.map(map),
            rxjs.operators.distinctUntilChanged()
        );

        this.origin = update(() => this.flightPlanManager.getOrigin());
        this.destination = update(() => this.flightPlanManager.getDestination());
        this.approach = update(() => this.flightPlanManager.getAirportApproach());
        this.departure = update(() => this.flightPlanManager.getDeparture());
        this.arrival = update(() => this.flightPlanManager.getArrival());
        this.activeWaypoint = update(() => this.flightPlanManager.getGPSActiveWaypointIndex());
        this.activeLeg = this.updateObservable.pipe(
            rxjs.operators.map(() => this.getActiveLeg()),
            rxjs.operators.distinctUntilChanged((a, b) => {
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
            })
        );
    }
    getActiveLeg() {
        const waypoints = {
            origin: null,
            destination: null,
            originIsApproach: false,
            destinationIsApproach: false
        };
        const flightPlanManager = this.flightPlanManager;
        if (flightPlanManager.isActiveApproach(true)) {
            const index = flightPlanManager.getActiveWaypointIndex();
            waypoints.destination = index;
            waypoints.destinationIsApproach = true;
            if (index == 0) {
                waypoints.origin = flightPlanManager.getWaypointsCount() - 2;
            } else {
                waypoints.origin = index - 1;
                waypoints.originIsApproach = true;
            }
        } else {
            waypoints.destination = flightPlanManager.getActiveWaypointIndex(true);
            waypoints.origin = flightPlanManager.getActiveWaypointIndex(true) - 1;
        }
        if (waypoints.origin === null || waypoints.destination === null)
            return null;
        return waypoints;
    }
    update() {
        this.updateObservable.next();
    }
}