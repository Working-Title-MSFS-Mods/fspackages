class WT_Procedure_Facility_Repository {
    /**
     * @param {WaypointLoader} facilityLoader 
     */
    constructor(facilityLoader) {
        this.facilityLoader = facilityLoader;
    }
    get(icao) {
        return new WT_Procedure_Facility(icao, this.facilityLoader);
    }
}

class WT_Procedure_Facility {
    constructor(icao, facilityLoader) {
        this.icao = icao;
        this.facilityLoader = facilityLoader;

        this._approaches = null;
        this._departures = null;
        this._arrivals = null;

        this._rawData = null;
        this._rawDataPromise = null;
    }
    async getRawData() {
        if (!this._rawDataPromise && !this._rawData) {
            console.log(this.icao);
            this._rawDataPromise = new Promise(resolve => {
                this.facilityLoader.getAirportDataCB(this.icao, data => {
                    resolve(data);
                });
            });
            this._rawData = await this._rawDataPromise;
        } else if (this._rawDataPromise) {
            await this._rawDataPromise;
        }
        return this._rawData;
    }
    loadFacility(promises, icao, setter) {
        if (icao && icao.trim() != "") {
            if (!(icao in promises)) {
                promises[icao] = new Promise(resolve => {
                    this.facilityLoader.getFacilityDataCB(icao, resolve);
                });
            }
            promises[icao].then(data => {
                setter({
                    icao: icao,
                    ident: icao.substr(7, 5).trim(),
                    coordinates: data ? new LatLong(data.lat, data.lon) : null,
                });
            });
        }
    }
    /**
     * @returns {WT_Approach_Procedure[]}
     */
    async getApproaches() {
        if (this._approaches === null) {
            const promises = {};
            const processLeg = (leg, fixIcao, originIcao) => {
                this.loadFacility(promises, fixIcao, leg.setFix.bind(leg));
                this.loadFacility(promises, originIcao, leg.setOrigin.bind(leg));
            }
            const rawData = (await this.getRawData());
            this._approaches = rawData.approaches.map((approachData, index) => {
                const frequencyData = rawData.frequencies.find(f => f.name.replace("RW0", "").replace("RW", "").indexOf(approachData.runway) !== -1);
                const mapLegs = legData => {
                    const leg = new WT_Procedure_Leg(legData);
                    processLeg(leg, legData.fixIcao, legData.originIcao);
                    return leg;
                }
                const d = new WT_Approach_Procedure(
                    this.icao,
                    index,
                    approachData.name,
                    approachData.runway,
                    frequencyData ? new Frequency(frequencyData.name, frequencyData.freqMHz, frequencyData.freqBCD16) : null,
                    approachData.finalLegs.map(mapLegs),
                    approachData.transitions.map((data, index) => new WT_Approach_Transition(index, data.legs[0].fixIcao.substr(7, 5).trim(), data.legs.map(mapLegs))),
                );
                console.log(`${d.name} - ${d.transitions.length} transitions`);
                return d;
            });
            await Promise.all(Object.values(promises));
        }
        return this._approaches;
    }
    /**
     * @returns {WT_Departure_Procedure[]}
     */
    async getDepartures() {
        if (this._departures === null) {
            const promises = {};
            const processLeg = (leg, fixIcao, originIcao) => {
                this.loadFacility(promises, fixIcao, leg.setFix.bind(leg));
                this.loadFacility(promises, originIcao, leg.setOrigin.bind(leg));
            }
            const rawData = (await this.getRawData());
            this._departures = rawData.departures.map((data, index) => {
                const mapLegs = legData => {
                    const leg = new WT_Procedure_Leg(legData);
                    processLeg(leg, legData.fixIcao, legData.originIcao);
                    return leg;
                }
                return new WT_Departure_Procedure(
                    this.icao,
                    index,
                    data.name,
                    new LatLong(rawData.lat, rawData.lon),
                    data.runwayTransitions.map((data, index) => {
                        let name = `RW${data.runwayNumber}`;
                        switch (data.runwayDesignation) {
                            case 1:
                                name += "L";
                                break;
                            case 2:
                                name += "R";
                                break;
                            case 3:
                                name += "C";
                                break;
                        }
                        const transition = new WT_Runway_Transition(index, name, data.legs.map(mapLegs));
                        return transition;
                    }),
                    data.commonLegs.map(mapLegs),
                    data.enRouteTransitions.map((data, index) => new WT_EnRoute_Transition(index, data.legs[0].fixIcao.substr(7, 5).trim(), data.legs.map(mapLegs))),
                );
            });
            try {
                await Promise.all(Object.values(promises));
            } catch (e) {
                console.error(`Error loading departures:\n${e.message}`);
            }
        }
        return this._departures;
    }
    /**
     * @returns {WT_Arrival_Procedure[]}
     */
    async getArrivals() {
        if (this._arrivals === null) {
            const promises = {};
            const processLeg = (leg, fixIcao, originIcao) => {
                this.loadFacility(promises, fixIcao, leg.setFix.bind(leg));
                this.loadFacility(promises, originIcao, leg.setOrigin.bind(leg));
            }
            const rawData = (await this.getRawData());
            this._arrivals = rawData.arrivals.map((data, index) => {
                const mapLegs = legData => {
                    const leg = new WT_Procedure_Leg(legData);
                    processLeg(leg, legData.fixIcao, legData.originIcao);
                    return leg;
                }
                return new WT_Arrival_Procedure(
                    this.icao,
                    index,
                    data.name,
                    new LatLong(rawData.lat, rawData.lon),
                    rawData.icao.substr(7, 5).trim(),
                    data.runwayTransitions.map((data, index) => new WT_Runway_Transition(index, data.name, data.legs.map(mapLegs))),
                    data.commonLegs.map(mapLegs),
                    data.enRouteTransitions.map((data, index) => new WT_EnRoute_Transition(index, data.legs[0].fixIcao.substr(7, 5).trim(), data.legs.map(mapLegs))),
                );
            });
            await Promise.all(Object.values(promises));
        }
        return this._arrivals;
    }
}