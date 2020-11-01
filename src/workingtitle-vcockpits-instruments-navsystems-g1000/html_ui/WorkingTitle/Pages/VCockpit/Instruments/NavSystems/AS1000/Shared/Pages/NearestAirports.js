class WT_Nearest_Airports_Model extends WT_Model {
    /**
     * @param {WT_Show_Direct_To_Handler} showDirectToHandler 
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {WT_Unit_Chooser} unitChooser 
     * @param {MapInstrument} map 
     * @param {WT_Soft_Key_Controller} softKeyController 
     * @param {WT_Nearest_Waypoints_Repository} nearestWaypoints 
     */
    constructor(gps, showDirectToHandler, waypointRepository, unitChooser, map, softKeyController, nearestWaypoints) {
        super();
        this.showDirectToHandler = showDirectToHandler;
        this.waypointRepository = waypointRepository;
        this.unitChooser = unitChooser;
        this.nearestAirportList = new NearestAirportList(gps);
        this.mapInstrument = map;
        this.softKeyController = softKeyController;

        this.airports = new Subject([], false);
        this.selectedAirport = new Subject();

        this.subscriptions = new Subscriptions();
        this.subscriptions.add(nearestWaypoints.airports.subscribe(airports => this.airports.value = airports));

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
    directTo() {
        if (this.selectedAirport.value)
            this.showDirectToHandler.show(null, this.selectedAirport.value.icao);
    }
    selectFrequency(frequency) {
        this.comFrequencies.selectFrequency(frequency);
    }
    unsubscribe() {
        this.subscriptions.unsubscribe();
    }
}