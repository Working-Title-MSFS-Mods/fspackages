class WT_Nearest_Waypoints_Repository {
    /**
     * @param {NavSystem} gps 
     * @param {WT_Settings} settings 
     * @param {WT_Plane_State} planeState 
     */
    constructor(update$, gps, settings, planeState) {
        this.updateFrequency = 1000; // How often we poll for nearest waypoints

        this.loadSettings = {
            airports: {
                distance: 100,
                count: 50,
                loadCount: 100, // Airports has to load more due to post-query filtering
            },
            ndbs: {
                distance: 50,
                count: 50,
            },
            vors: {
                distance: 50,
                count: 50,
            },
        };

        this.nearestAirportList = new WT_Nearest_Airports(gps.instrumentIdentifier);// new NearestAirportList(gps);
        this.nearestVorList = new NearestVORList(gps);
        this.nearestNdbList = new NearestNDBList(gps);

        const throttledUpdate$ = update$.pipe(
            rxjs.operators.throttleTime(this.updateFrequency),
            rxjs.operators.share(),
        );

        const lowResCoordinates$ = planeState.getLowResCoordinates(0.5)
            .pipe(WT_RX.shareReplay());

        const airportFilter$ = rxjs.combineLatest(
            settings.observe("nearest_runway_surface"),
            settings.observe("nearest_runway_min_length"),
            (surface, length) => ({
                surface: surface,
                length: length,
                distance: 100,
                count: 25,
                loadCount: 100, // Airports has to load more due to post-query filtering
            })
        ).pipe(rxjs.operators.share());

        const sortByDistance = (a, b) => a.distance - b.distance;

        const waypointsObservable = (updater, waypointsObservable) => rxjs.merge(
            lowResCoordinates$.pipe(
                rxjs.operators.switchMap(d => {
                    //updater();
                    return rxjs.interval(100).pipe(
                        /*rxjs.operators.tap(i => {
                            if (i % 2 == 0)
                                updater()
                        }),
                        rxjs.operators.takeWhile(upToDateCheck),*/
                        rxjs.operators.tap(updater),
                        rxjs.operators.take(1) // i give up
                    )
                }),
                rxjs.operators.ignoreElements()
            ), waypointsObservable
        ).pipe(rxjs.operators.share())

        this.allAirports = waypointsObservable(
            () => this.updateNearestAirports(),
            this.nearestAirportList.airports$
            //throttledUpdate$.pipe(rxjs.operators.map(dt => this.nearestAirportList.airports.sort(sortByDistance)))
        );

        this.airports = rxjs.combineLatest(
            this.allAirports,
            airportFilter$,
            (airports, filter) => airports.filter(airport => this.filterAirport(airport, filter))
                .sort(sortByDistance)
                .slice(0, this.loadSettings.airports.count)
        );

        this.vors = waypointsObservable(
            () => this.updateNearestVors(),
            throttledUpdate$.pipe(rxjs.operators.map(dt => this.nearestVorList.vors.sort(sortByDistance)))
        );

        this.ndbs = waypointsObservable(
            () => this.updateNearestNdbs(),
            throttledUpdate$.pipe(rxjs.operators.map(dt => this.nearestNdbList.ndbs.sort(sortByDistance)))
        );
    }
    filterAirport(airport, filter) {
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
        console.log("Fired off update for airports");
        //this.nearestAirportList.Update(this.loadSettings.airports.loadCount, this.loadSettings.airports.distance);
        this.nearestAirportList.setParams(this.loadSettings.airports.loadCount, this.loadSettings.airports.distance);
    }
    updateNearestVors() {
        //console.log("Fired off update for vors");
        this.nearestVorList.Update(this.loadSettings.vors.count, this.loadSettings.vors.distance);
    }
    updateNearestNdbs() {
        //console.log("Fired off update for ndbs");
        this.nearestNdbList.Update(this.loadSettings.ndbs.count, this.loadSettings.ndbs.distance);
    }
}