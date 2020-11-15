class WT_Nearest_Airports_Model extends WT_Model {
    /**
     * @param {NavSystem} gps
     * @param {WT_Show_Direct_To_Handler} showDirectToHandler 
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {WT_Unit_Chooser} unitChooser 
     * @param {MapInstrument} map 
     * @param {WT_Nearest_Waypoints_Repository} nearestWaypoints 
     * @param {WT_Show_Waypoint_Info_Handler} showWaypointInfoHandler 
     */
    constructor(gps, showDirectToHandler, waypointRepository, unitChooser, map, nearestWaypoints, showWaypointInfoHandler) {
        super();
        this.showDirectToHandler = showDirectToHandler;
        this.waypointRepository = waypointRepository;
        this.unitChooser = unitChooser;
        this.nearestAirportList = new NearestAirportList(gps);
        this.mapInstrument = map;
        this.nearestWaypoints = nearestWaypoints;
        this.showWaypointInfoHandler = showWaypointInfoHandler;

        this.airports = new Subject([], false);
        this.selectedAirport = new Subject();

        this.subscriptions = new Subscriptions();
        this.subscribe();

        this.setIcao = DOMUtilities.debounce(async icao => {
            this.selectedAirport.value = await this.waypointRepository.load(icao);
        }, 200, false);
    }
    filterAirport(airport) {
        if (this.filter.length) {
            if (airport.longestRunwayLength < this.filter.length)
                return false;
        }

        if (this.filter.type) {
            switch (this.filter.type) {
                case "hardOnly":
                    if (airport.airportClass != 1)
                        return false;
                    break;
                case "all":
                    break;
            }
        }

        return true;
    }
    setSelectedAirport(icao) {
        this.setIcao(icao);
    }
    showWaypointInfo(waypoint) {
        if (waypoint) {
            this.showWaypointInfoHandler.show(waypoint);
        }
    }
    directTo(icao) {
        if (icao)
            this.showDirectToHandler.show(null, icao);
        if (this.selectedAirport.value)
            this.showDirectToHandler.show(null, this.selectedAirport.value.icao);
    }
    selectFrequency(frequency) {
        this.comFrequencies.selectFrequency(frequency);
    }
    subscribe() {
        this.subscriptions.add(this.nearestWaypoints.airports.subscribe(airports => this.airports.value = airports));
    }
    unsubscribe() {
        this.subscriptions.unsubscribe();
    }
}