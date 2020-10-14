class WT_Nearest_Airports_Model extends WT_Model {
    constructor(gps, unitChooser, map, softKeyController) {
        super();
        this.unitChooser = unitChooser;
        this.nearestAirportList = new NearestAirportList(gps);
        this.mapInstrument = map;
        this.softKeyController = softKeyController;
        this.filter = {
            type: "all",
            length: null
        };
        this.loadOptions = {
            count: 50,
            distance: 200
        };
        this.updateTimer = 0;
        this.updateFrequency = 500;

        this.currentWaypoint = new WayPoint(gps);
        this.currentWaypoint.type = "A";

        this.airports = new Subject();
        this.selectedAirport = new Subject();
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
    update(dt) {
        this.updateTimer += dt;
        if (this.updateTimer < this.updateFrequency) {
            return;
        }
        this.updateTimer = 0;
        this.nearestAirportList.Update(this.loadOptions.count, this.loadOptions.distance);

        this.airports.value = this.nearestAirportList.airports
            .filter(this.filterAirport.bind(this))
            .sort((a, b) => {
                return a.distance - b.distance
            });
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
}