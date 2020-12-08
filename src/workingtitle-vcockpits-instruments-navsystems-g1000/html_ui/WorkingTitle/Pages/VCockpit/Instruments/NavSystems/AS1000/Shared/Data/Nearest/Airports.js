class WT_Nearest_Airports {
    constructor(identifier) {
        //identifier = "wergergegr";
        const currentPrefix = "C:fs9gps:NearestAirportCurrent";
        const selectedPrefix = "C:fs9gps:NearestAirportSelected";
        this.currentBatch = new SimVar.SimVarBatch("C:fs9gps:NearestAirportItemsNumber", `${currentPrefix}Line`);
        this.currentBatch.add(`${currentPrefix}ICAO`, "string", "string");
        this.currentBatch.add(`${currentPrefix}Ident`, "string", "string");
        this.currentBatch.add(`${currentPrefix}Distance`, "nautical miles", "number");
        this.currentBatch.add(`${currentPrefix}TrueBearing`, "degrees", "number");
        this.currentBatch.add(`${currentPrefix}BestApproach`, "string", "string");
        this.currentBatch.add(`${currentPrefix}ComFrequencyName`, "string", "string");
        this.currentBatch.add(`${currentPrefix}ComFrequencyValue`, "MHz", "number");
        this.currentBatch.add(`${currentPrefix}ComFrequencyValue`, "Frequency BCD16", "number");
        this.currentBatch.add(`${currentPrefix}LongestRunwayLength`, "feet", "number");
        this.currentBatch.add(`${currentPrefix}LongestAirportDirection`, "degree", "number");
        this.currentBatch.add(`${currentPrefix}AirportKind`, "number", "number");
        this.currentBatch.add(`${currentPrefix}Towered`, "number", "number");
        this.selectedBatch = new SimVar.SimVarBatch("C:fs9gps:NearestAirportItemsNumber", selectedPrefix);
        this.selectedBatch.add(`${selectedPrefix}AirportName`, "string", "string");
        this.selectedBatch.add(`${selectedPrefix}Latitude`, "degree latitude");
        this.selectedBatch.add(`${selectedPrefix}Longitude`, "degree longitude");
        this.selectedBatch.add(`${selectedPrefix}AirportElevation`, "feet", "number");

        this.params$ = new rxjs.BehaviorSubject({ count: 25, distance: 50 });
        this.airports$ = this.params$.pipe(
            rxjs.operators.exhaustMap(params => {
                const count = params.count;
                const distance = params.distance;
                return new Promise(async resolve => {
                    SimVar.SetSimVarValue(`${currentPrefix}Latitude`, "degree latitude", SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude", identifier), identifier);
                    SimVar.SetSimVarValue(`${currentPrefix}Longitude`, "degree longitude", SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude", identifier), identifier);

                    // I have NO CLUE why this works for making it actually return results the first time
                    for (let i = 0; i < 4; i++) {
                        SimVar.SetSimVarValue("C:fs9gps:NearestAirportMaximumDistance", "nautical miles", distance, identifier);
                        await SimVar.SetSimVarValue("C:fs9gps:NearestAirportMaximumItems", "number", count, identifier);
                    }

                    // Give a short time to load
                    //await new Promise(resolve => setTimeout(resolve, 500));

                    const airports = await new Promise(resolve => {
                        SimVar.GetSimVarArrayValues(this.currentBatch, values => {
                            resolve(
                                values.map(data => ({
                                    icao: data[0],
                                    ident: data[1],
                                    distance: data[2],
                                    bearing: data[3],
                                    bestApproach: data[4],
                                    frequencyName: data[5],
                                    frequencyMHz: data[6],
                                    frequencyBCD16: data[7],
                                    longestRunwayLength: data[8],
                                    longestRunwayDirection: data[9],
                                    airportClass: data[10],
                                    towered: data[11],
                                }))
                            );
                        }, identifier);
                    });

                    await new Promise(resolve => {
                        SimVar.GetSimVarArrayValues(this.selectedBatch, values => {
                            for (var i = 0; i < values.length; i++) {
                                airports[i].name = Utils.Translate(values[i][0]);
                                airports[i].coordinates = new LatLongAlt(values[i][1], values[i][2], values[i][3]);
                            }
                            resolve();
                        }, identifier);
                    });

                    resolve(airports);
                });
            }),
            rxjs.operators.shareReplay(1)
        )
    }
    setParams(count, distance) {
        this.params$.next({ count, distance });
    }
}