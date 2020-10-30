class WT_Procedure {
    constructor(name, procedureIndex) {
        this._name = name;
        this.procedureIndex = procedureIndex;
    }
    getPrimaryFrequency() {
        return null;
    }
    get name() {
        return this._name;
    }
}

class WT_Selected_Procedure {
    constructor() {
        this.onUpdated = new WT_Event();
    }
    getSequence() {
        throw new Error("getSequence not implemented");
    }
    getAllTransitionLegs() {
        throw new Error("getAllTransitionLegs not implemented");
    }
    getAirport() {
        throw new Error("getAirport not implemented");
    }
}

class WT_Procedure_Leg {
    constructor(leg) {
        Object.assign(this, leg);
        this.bearing = this.course;
        this.distance /= 1852;
    }
    setFix(fix) {
        this.fix = fix;
    }
    setOrigin(origin) {
        this.origin = origin;
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
    async getApproaches() {
        if (this._approaches === null) {
            let promises = {};
            let processLeg = (leg, fixIcao, originIcao) => {
                this.loadFacility(promises, fixIcao, leg.setFix.bind(leg));
                this.loadFacility(promises, originIcao, leg.setOrigin.bind(leg));
            }
            let rawData = (await this.getRawData());
            this._approaches = rawData.approaches.map((approachData, index) => {
                let frequencyData = rawData.frequencies.find(f => f.name.replace("RW0", "").replace("RW", "").indexOf(approachData.runway) !== -1);
                let mapLegs = legData => {
                    let leg = new WT_Procedure_Leg(legData);
                    processLeg(leg, legData.fixIcao, legData.originIcao);
                    return leg;
                }
                let approach = new WT_Approach_Procedure(
                    index,
                    approachData.name,
                    approachData.runway,
                    frequencyData ? new Frequency(frequencyData.name, frequencyData.freqMHz, frequencyData.freqBCD16) : null,
                    approachData.finalLegs.map(mapLegs),
                    approachData.transitions.map((data, index) => {
                        return {
                            index: index,
                            name: data.legs[0].fixIcao.substr(7, 5).trim(),
                            legs: data.legs.map(mapLegs),
                        }
                    }),
                );

                return approach;
            });
            await Promise.all(Object.values(promises));
        }
        return this._approaches;
    }
    async getDepartures() {
        if (this._departures === null) {
            let promises = {};
            let processLeg = (leg, fixIcao, originIcao) => {
                this.loadFacility(promises, fixIcao, leg.setFix.bind(leg));
                this.loadFacility(promises, originIcao, leg.setOrigin.bind(leg));
            }
            let rawData = (await this.getRawData());
            this._departures = rawData.departures.map((data, index) => {
                let mapLegs = legData => {
                    let leg = new WT_Procedure_Leg(legData);
                    processLeg(leg, legData.fixIcao, legData.originIcao);
                    return leg;
                }
                let procedure = new WT_Departure_Procedure(
                    index,
                    data.name,
                    new LatLong(rawData.lat, rawData.lon),
                    data.runwayTransitions.map((data, index) => {
                        return {
                            index: index,
                            name: data.name,
                            legs: data.legs.map(mapLegs),
                        }
                    }),
                    data.commonLegs.map(mapLegs),
                    data.enRouteTransitions.map((data, index) => {
                        return {
                            index: index,
                            name: data.legs[0].fixIcao.substr(7, 5).trim(),
                            legs: data.legs.map(mapLegs),
                        }
                    }),
                );
                return procedure;
            });
            try {
                await Promise.all(Object.values(promises));
            } catch (e) {
                console.error(`Error loading departures:\n${e.message}`);
            }
        }
        return this._departures;
    }
    async getArrivals() {
        if (this._arrivals === null) {
            let promises = {};
            let processLeg = (leg, fixIcao, originIcao) => {
                this.loadFacility(promises, fixIcao, leg.setFix.bind(leg));
                this.loadFacility(promises, originIcao, leg.setOrigin.bind(leg));
            }
            let rawData = (await this.getRawData());
            this._arrivals = rawData.arrivals.map((data, index) => {
                let mapLegs = legData => {
                    let leg = new WT_Procedure_Leg(legData);
                    processLeg(leg, legData.fixIcao, legData.originIcao);
                    return leg;
                }
                let procedure = new WT_Arrival_Procedure(
                    index,
                    data.name,
                    new LatLong(rawData.lat, rawData.lon),
                    rawData.icao.substr(7, 5).trim(),
                    data.runwayTransitions.map((data, index) => {
                        return {
                            index: index,
                            name: data.name,
                            legs: data.legs.map(mapLegs),
                        }
                    }),
                    data.commonLegs.map(mapLegs),
                    data.enRouteTransitions.map((data, index) => {
                        return {
                            index: index,
                            name: data.legs[0].fixIcao.substr(7, 5).trim(),
                            legs: data.legs.map(mapLegs),
                        }
                    }),
                );
                return procedure;
            });
            await Promise.all(Object.values(promises));
        }
        return this._arrivals;
    }
}

class WT_Procedure_Waypoints {
    /**
     * @param {WT_Procedure_Leg[]} legs 
     */
    constructor(legs) {
        let i = 0;
        this.waypoints = [];
        for (let leg of legs) {
            const f = (21639 / 2) * Math.PI;
            let sin = Math.sin;
            let asin = Math.asin;
            let cos = Math.cos;
            let acos = Math.acos;
            let tan = Math.tan;
            let atan = Math.atan;
            let abs = Math.abs;
            let greatCircleDistance = Avionics.Utils.computeGreatCircleDistance;
            let greatCircleHeading = Avionics.Utils.computeGreatCircleHeading;
            function deltaAngle(a, b) {
                let delta = a - b;
                delta = Avionics.Utils.fmod(delta + 180, 360) - 180;
                return abs(delta * Math.PI / 180);
            }
            if ((!leg.fix || leg.fix.coordinates == null) && (!leg.origin || leg.origin.coordinates == null)) {
                console.warn("Leg didn't have any coordinates!");
                continue;
            }
            switch (leg.type) {
                case 3: {
                    const bearingToOrigin = greatCircleHeading(this.last.coordinates, leg.origin.coordinates);
                    const distanceToOrigin = greatCircleDistance(this.last.coordinates, leg.origin.coordinates);

                    let beta = deltaAngle(bearingToOrigin, leg.bearing);
                    const b = leg.distance / f;
                    const c = distanceToOrigin / f;

                    const gamma = asin((sin(c) * sin(beta)) / sin(b));
                    const invGamma = Math.PI - asin((sin(c) * sin(beta)) / sin(b));
                    const a1 = 2 * atan(tan(0.5 * (b - c)) * (sin(0.5 * (beta + gamma)) / sin(0.5 * (beta - gamma))));
                    const a2 = 2 * atan(tan(0.5 * (b - c)) * (sin(0.5 * (beta + invGamma)) / sin(0.5 * (beta - invGamma))));
                    const a = b > c ? a1 : Math.min(a1, a2);
                    const coordinates = Avionics.Utils.bearingDistanceToCoordinates(leg.bearing, a * f, this.last.coordinates.lat, this.last.coordinates.long);

                    this.add(leg, `${leg.origin.ident}${leg.distance.toFixed(0)}`, coordinates, a, leg.bearing);
                    break;
                }
                case 4: {
                    if (leg.fix && leg.fix.coordinates) {
                        this.add(leg, leg.fix.ident, leg.fix.coordinates, leg.distance, leg.bearing);
                    } else {
                        this.add(leg, `${leg.origin.ident}${leg.distance.toFixed(0)}`, Avionics.Utils.bearingDistanceToCoordinates(leg.bearing, leg.distance, leg.origin.coordinates.lat, leg.origin.coordinates.long), leg.distance, leg.bearing);
                    }
                    break;
                }
                case 6: {
                    const originToCoordinates = greatCircleHeading(leg.origin.coordinates, this.last.coordinates);
                    const coordinatesToOrigin = greatCircleHeading(this.last.coordinates, leg.origin.coordinates);
                    const distanceToOrigin = greatCircleDistance(this.last.coordinates, leg.origin.coordinates);

                    let alpha = deltaAngle(coordinatesToOrigin, leg.bearing);
                    let beta = deltaAngle(originToCoordinates, leg.theta);
                    let c = distanceToOrigin / f;

                    const gamma = acos(sin(alpha) * sin(beta) * cos(c) - cos(alpha) * cos(beta));
                    let b = acos((cos(beta) + cos(alpha) * cos(gamma)) / (sin(alpha) * sin(gamma)));
                    const coordinates = Avionics.Utils.bearingDistanceToCoordinates(leg.bearing, b * f, this.last.coordinates.lat, this.last.coordinates.long);

                    this.add(leg, `${leg.origin.ident}${leg.distance.toFixed(0)}`, coordinates, leg.distance, leg.bearing);
                    break;
                }
                case 10: {
                    if (i == 0) {
                        this.add(leg, leg.origin.ident, leg.origin.coordinates, 0, 0);
                    }
                    this.add(leg, `${leg.origin.ident}${leg.distance.toFixed(0)}`, Avionics.Utils.bearingDistanceToCoordinates(leg.bearing, leg.distance, leg.origin.coordinates.lat, leg.origin.coordinates.long), leg.distance, leg.bearing);
                    break;
                }
                case 11: {
                    this.add(leg, `${leg.fix ? leg.fix.ident : ""}`, Avionics.Utils.bearingDistanceToCoordinates(leg.bearing, 2, this.last.coordinates.lat, this.last.coordinates.long), 2, leg.bearing);
                    break;
                }
                case 7:
                case 15:
                case 18: {
                    this.add(leg, leg.fix.ident, leg.fix.coordinates, leg.distance, leg.bearing);
                    break;
                }
                default: {
                    console.warn(`Unhandled leg type (${leg.type})`);
                    break;
                }
            }
            i++;
        }
    }
    get last() {
        return this.waypoints[this.waypoints.length - 1];
    }
    add(leg, name, coordinates, distance, bearing) {
        if (this.waypoints.length > 0) {
            distance = Avionics.Utils.computeGreatCircleDistance(this.last.coordinates, coordinates);
        }
        this.waypoints.push({
            leg: leg,
            name: name,
            coordinates: coordinates,
            distance: distance,
            bearing: bearing
        });
    }
}