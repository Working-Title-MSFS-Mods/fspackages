class WT_Nearest_Waypoints_Repository {
    /**
     * @param {NavSystem} gps 
     * @param {WT_Settings} settings 
     */
    constructor(gps, settings) {
        this.airports = new Subject([], false);
        this.nearestAirportList = new NearestAirportList(gps);

        this.vors = new Subject([], false);
        this.nearestVorList = new NearestVORList(gps);

        this.ndbs = new Subject([], false);
        this.nearestNdbList = new NearestNDBList(gps);

        this.filters = {
            airports: {
                surface: settings.getValue("nearest_runway_surface"),
                length: settings.getValue("nearest_runway_min_length"),
                distance: 100,
                count: 25,
                loadCount: 100, // Airports has to load more due to post-query filtering
            },
            ndbs: {
                distance: 50,
                count: 25,
            },
            vors: {
                distance: 50,
                count: 25,
            },
        };

        this.updateTimer = 0;
        this.updateFrequency = 500;

        settings.addListener(value => this.filters.airports.surface = value, "nearest_runway_surface");
        settings.addListener(value => this.filters.airports.length = value, "nearest_runway_min_length");
    }
    filterAirport(airport) {
        const filter = this.filters.airports;
        if (airport.longestRunwayLength < filter.length)
            return false;

        switch (filter.surface) {
            case "Hard Only":
                if (airport.airportClass != 1)
                    return false;
                break;
            case "Hard/Soft":
                if (airport.airportClass != 1 && airport.airportClass != 2)
                    return false;
                break;
            case "Water":
                if (airport.airportClass != 3)
                    return false;
                break;
            default:
                break;
        }

        return true;
    }
    updateNearestAirports() {
        this.nearestAirportList.Update(this.filters.airports.loadCount, this.filters.airports.distance);

        this.airports.value = this.nearestAirportList.airports
            .filter(this.filterAirport.bind(this))
            .sort((a, b) => {
                return a.distance - b.distance
            });
    }
    updateNearestVors() {
        this.nearestVorList.Update(this.filters.vors.count, this.filters.vors.distance);

        this.vors.value = this.nearestVorList.vors
            .sort((a, b) => {
                return a.distance - b.distance
            });
    }
    updateNearestNdbs() {
        try {
            this.nearestNdbList.Update(this.filters.ndbs.count, this.filters.ndbs.distance);

            this.ndbs.value = this.nearestNdbList.ndbs
                .sort((a, b) => {
                    return a.distance - b.distance
                });
        } catch (e) {
            console.error(e.message);
        }
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
        if (this.vors.hasSubscribers()) {
            this.updateNearestVors();
        }
        if (this.ndbs.hasSubscribers()) {
            this.updateNearestNdbs();
        }
    }
}