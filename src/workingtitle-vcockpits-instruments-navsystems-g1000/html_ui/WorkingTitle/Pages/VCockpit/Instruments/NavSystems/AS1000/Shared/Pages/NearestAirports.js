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
            count: 150,
            distance: 1000
        }
        this.updateTimer = 0;
        this.updateFrequency = 1000;

        this.currentWaypoint = new WayPoint(gps);
        this.currentWaypoint.type = "A";

        this.airports = new Subject();
        this.selectedAirport = new Subject();
    }
    filterAirport(airport) {
        if (this.filter.length) {
            let maxLength = 0;
            for (let runway of airport.runways) {
                maxLength = Math.max(runway.length);
            }
            if (maxLength < this.filter.length)
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
        console.log("Updating");
        this.nearestAirportList.Update(this.loadOptions.count, this.loadOptions.distance);

        this.airports.value = this.nearestAirportList.airports
            .filter(this.filterAirport.bind(this))
            .map(airport => {
                if (!airport) {
                    return null;
                }
                return airport;
                /*return {
                    icao: airport.icao,
                    ident: airport.ident,
                    runwayDirection: airport.longestRunwayDirection,
                    bearing: airport.bearing,
                    distance: airport.distance,
                    info: airport
                }*/
            }).sort((a, b) => {
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