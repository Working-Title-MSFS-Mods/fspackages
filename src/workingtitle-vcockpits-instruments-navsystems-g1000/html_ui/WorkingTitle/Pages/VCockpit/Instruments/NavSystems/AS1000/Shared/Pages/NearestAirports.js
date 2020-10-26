class WT_Nearest_Airports_Model extends WT_Model {
    /**
     * @param {AS1000_MFD} gps 
     * @param {WT_Unit_Chooser} unitChooser 
     * @param {MapInstrument} map 
     * @param {WT_Soft_Key_Controller} softKeyController 
     * @param {WT_Nearest_Waypoints_Repository} nearestWaypoints 
     */
    constructor(gps, unitChooser, map, softKeyController, nearestWaypoints) {
        super();
        this.gps = gps;
        this.unitChooser = unitChooser;
        this.nearestAirportList = new NearestAirportList(gps);
        this.mapInstrument = map;
        this.softKeyController = softKeyController;

        this.currentWaypoint = new WayPoint(gps);
        this.currentWaypoint.type = "A";

        this.airports = new Subject([], false);
        this.selectedAirport = new Subject();

        this.subscriptions = new Subscriptions();
        this.subscriptions.add(nearestWaypoints.airports.subscribe(airports => this.airports.value = airports));

        this.setIcao = DOMUtilities.debounce((icao) => this.currentWaypoint.SetICAO(icao, () => {
            this.selectedAirport.value = {
                airport: this.currentWaypoint
            };
        }, false), 200, false);
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
            this.gps.showDirectTo(null, this.selectedAirport.value.icao);
    }
    selectFrequency(frequency) {
        this.comFrequencies.selectFrequency(frequency);
    }
    unsubscribe() {
        this.subscriptions.unsubscribe();
    }
}