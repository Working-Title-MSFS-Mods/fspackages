class WT_Nearest_Waypoints_Repository {
    constructor(gps) {
        this.airports = new Subject([], false);
        this.nearestAirportList = new NearestAirportList(gps);

        this.filters = {
            airports: {
                type: "all",
                length: null
            }
        };
        this.loadOptions = {
            count: 50,
            distance: 200
        };

        this.updateTimer = 0;
        this.updateFrequency = 500;
    }
    filterAirport(airport) {
        let filter = this.filters.airports;
        if (filter.length) {
            if (airport.longestRunwayLength < filter.length)
                return false;
        }

        if (filter.type) {
            switch (filter.type) {
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
    updateNearestAirports() {
        this.nearestAirportList.Update(this.loadOptions.count, this.loadOptions.distance);

        this.airports.value = this.nearestAirportList.airports
            .filter(this.filterAirport.bind(this))
            .sort((a, b) => {
                return a.distance - b.distance
            });
    }
    update(dt) {
        this.updateTimer += dt;
        if (this.updateTimer < this.updateFrequency) {
            return;
        }
        this.updateTimer = 0;

        if (this.airports.hasSubscribers()) {
            this.updateNearestAirports();
        }
    }
}