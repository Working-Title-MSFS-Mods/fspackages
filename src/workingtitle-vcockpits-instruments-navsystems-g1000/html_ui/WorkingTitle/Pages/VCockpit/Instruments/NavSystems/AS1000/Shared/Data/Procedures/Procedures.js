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
    /**
     * @param {FlightPlanManager} flightPlan 
     */
    load(flightPlan) {
        throw new Error("Selected procedure does not support loading");
    }
    /**
     * @param {FlightPlanManager} flightPlan 
     */
    activate(flightPlan) {
        throw new Error("Selected procedure does not support activating");
    }
    outputWaypointsToConsole(waypoints) {
        let header = ` ID  TYPE ORGIN /   FIX   DIST   Θ     ρ  BRG TURN`;
        let headerText = `${this.procedure.name} / ${this.runwayTransitionIndex} / ${this.enRouteTransitionIndex}`;
        let str = `${"".padStart((header.length - headerText.length - 2) / 2, "-")} ${headerText} ${"".padStart(Math.ceil((header.length - headerText.length - 2) / 2), "-")}\n`;
        str += header + "\n";
        str += "".padStart(header.length, "-") + "\n";
        let i = 0;
        str += waypoints.map(waypoint => {//${waypoint.coordinates.lat.toFixed(4)},${waypoint.coordinates.long.toFixed(4)}
            let vars = [
                `[${(i++).toFixed(0).padStart(2, " ")}]`,
                "-",
                waypoint.leg.type.toFixed(0).padStart(2, " "),
                waypoint.leg.origin ? waypoint.leg.origin.ident.padStart(6, " ") : "     ",
                "/",
                waypoint.leg.fix ? waypoint.leg.fix.ident.padStart(5, " ") : "     ",
                waypoint.leg.distance.toFixed(1).padStart(4, " ") + "ɴᴍ",
                waypoint.leg.theta.toFixed(0).padStart(3, " "),
                waypoint.leg.rho.toFixed(0).padStart(5, " "),
                `${waypoint.leg.bearing.toFixed(0).padStart(3, " ")}°`,
                (waypoint.leg.turnDirection ? waypoint.leg.turnDirection : 0).toFixed(0).padStart(4, " ")
            ]
            return vars.join(" ") + "\n";
        }).join("");
        str += "".padStart(header.length, "-") + "\n";
        console.log(str);
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

class WT_Procedure_Transition {
    constructor(index, name, legs) {
        this.index = index;
        this.name = name;
        this.legs = legs;
    }
}

class WT_Approach_Transition extends WT_Procedure_Transition {

}

class WT_Runway_Transition extends WT_Procedure_Transition {

}

class WT_EnRoute_Transition extends WT_Procedure_Transition {

}

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
                return new WT_Approach_Procedure(
                    index,
                    approachData.name,
                    approachData.runway,
                    frequencyData ? new Frequency(frequencyData.name, frequencyData.freqMHz, frequencyData.freqBCD16) : null,
                    approachData.finalLegs.map(mapLegs),
                    approachData.transitions.map((data, index) => new WT_Approach_Transition(index, data.legs[0].fixIcao.substr(7, 5).trim(), data.legs.map(mapLegs))),
                );
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
                return new WT_Departure_Procedure(
                    index,
                    data.name,
                    new LatLong(rawData.lat, rawData.lon),
                    data.runwayTransitions.map((data, index) => new WT_Runway_Transition(index, data.name, data.legs.map(mapLegs))),
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
                return new WT_Arrival_Procedure(
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

class WT_Procedure_Waypoints {
    /**
     * @param {WT_Procedure_Leg[]} legs 
     */
    constructor(legs) {
        let i = 0;
        this.waypoints = [];
        const f = (21639 / 2) * Math.PI, sin = Math.sin, asin = Math.asin, cos = Math.cos, acos = Math.acos, tan = Math.tan, atan = Math.atan, abs = Math.abs;
        const greatCircleDistance = Avionics.Utils.computeGreatCircleDistance;
        const greatCircleHeading = Avionics.Utils.computeGreatCircleHeading;
        function deltaAngle(a, b) {
            let delta = a - b;
            delta = Avionics.Utils.fmod(delta + 180, 360) - 180;
            return abs(delta * Math.PI / 180);
        }
        for (let leg of legs) {
            if ((!leg.fix || leg.fix.coordinates == null) && (!leg.origin || leg.origin.coordinates == null)) {
                console.warn("Leg didn't have any coordinates!");
                continue;
            }
            switch (leg.type) {
                case 3: {
                    const bearingToOrigin = greatCircleHeading(this.last.coordinates, leg.origin.coordinates);
                    const distanceToOrigin = greatCircleDistance(this.last.coordinates, leg.origin.coordinates);

                    const beta = deltaAngle(bearingToOrigin, leg.bearing);
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

                    const alpha = deltaAngle(coordinatesToOrigin, leg.bearing);
                    const beta = deltaAngle(originToCoordinates, leg.theta);
                    const c = distanceToOrigin / f;

                    const gamma = acos(sin(alpha) * sin(beta) * cos(c) - cos(alpha) * cos(beta));
                    const b = acos((cos(beta) + cos(alpha) * cos(gamma)) / (sin(alpha) * sin(gamma)));
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
            bearing = Avionics.Utils.computeGreatCircleHeading(this.last.coordinates, coordinates);
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