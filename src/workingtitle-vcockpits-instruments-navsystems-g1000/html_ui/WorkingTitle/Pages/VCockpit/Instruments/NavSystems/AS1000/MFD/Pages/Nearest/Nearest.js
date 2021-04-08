class WT_Nearest_Waypoints_Model {
    /**
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {WT_Nearest_Waypoints_Repository} nearestWaypoints 
     */
    constructor(waypointRepository, nearestWaypoints) {
        this.waypointRepository = waypointRepository;
        this.nearestWaypoints = nearestWaypoints;

        this.selectedWaypoint = new Subject();
        this.waypoints = new Subject([], false);

        this.subscriptions = new Subscriptions();
    }
    subscribe() {
        this.subscriptions.add(this.nearestWaypoints.airports.subscribe(airports => this.waypoints.value = airports));
    }
    async setSelectedWaypoint(icao) {
        this.selectedWaypoint.value = await this.waypointRepository.load(icao);
    }
    unsubscribe() {
        this.subscriptions.unsubscribe();
    }
    directTo() {
        if (this.selectedWaypoint.value) {
            this.gps.showDirectTo(null, this.selectedWaypoint.value.icao);
        }
    }
}