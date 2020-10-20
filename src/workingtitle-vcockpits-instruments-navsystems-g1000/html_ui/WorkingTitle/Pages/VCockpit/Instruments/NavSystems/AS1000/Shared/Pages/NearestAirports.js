class WT_Nearest_Airports_Model extends WT_Model {
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
        console.log("Selected " + icao);
        this.currentWaypoint.SetICAO(icao, () => {
            console.log("Loaded " + icao);
            this.selectedAirport.value = {
                airport: this.currentWaypoint
            };
        }, true);
    }
    directTo(icao) {
        this.gps.showDirectTo(null, icao);
    }
    unsubscribe() {
        this.subscriptions.unsubscribe();
    }
}