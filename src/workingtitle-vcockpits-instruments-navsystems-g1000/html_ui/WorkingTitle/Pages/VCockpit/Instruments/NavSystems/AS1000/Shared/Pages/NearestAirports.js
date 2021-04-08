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

        this.airports = this.nearestWaypoints.airports;
        this.selectedAirport = new Subject();

        this.subscriptions = new Subscriptions();

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
    showWaypointInfo() {
        if (this.selectedAirport.value) {
            this.showWaypointInfoHandler.show(this.selectedAirport.value);
        }
    }
    async directTo(icao = null) {
        if (icao) {
            this.showDirectToHandler.show(null, await this.waypointRepository.load(icao));
        } else if (this.selectedAirport.value) {
            this.showDirectToHandler.show(null, this.selectedAirport.value);
        }
    }
    selectFrequency(frequency) {
        this.comFrequencies.selectFrequency(frequency);
    }
    subscribe() {
    }
    unsubscribe() {
    }
}