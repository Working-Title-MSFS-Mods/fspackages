class WT_Departure_Procedure extends WT_Procedure {
    constructor(icao, index, name, runwayCoordinates, runwayTransitions, commonLegs, enRouteTransitions) {
        super(name, index);
        this.icao = icao;
        this.runwayCoordinates = runwayCoordinates;
        this.runwayTransitions = runwayTransitions;
        this.commonLegs = commonLegs;
        this.enRouteTransitions = enRouteTransitions;
    }
    /**
     * @param {WT_Procedure_Leg[]} legs 
     */
    getCommonLegs() {
        return this.commonLegs;
    }
    /**
    * @returns {WT_Runway_Transition}
    */
    getRunwayTransition(transitionIndex) {
        return this.runwayTransitions[transitionIndex];
    }
    /**
     * @returns {WT_Runway_Transition[]}
     */
    getRunwayTransitions() {
        return this.runwayTransitions;
    }
    /**
     * @returns {WT_EnRoute_Transition}
     */
    getEnRouteTransition(transitionIndex) {
        return this.enRouteTransitions[transitionIndex];
    }
    /**
     * @returns {WT_EnRoute_Transition[]}
     */
    getEnRouteTransitions() {
        return this.enRouteTransitions;
    }
}

class WT_Selected_Departure_Procedure extends WT_Selected_Procedure {
    /**
     * @param {WT_Departure_Procedure} procedure 
     */
    constructor(procedure) {
        super();
        this.procedure = procedure;
        this.runwayTransitionIndex = null;
        this.enRouteTransitionIndex = null;
    }
    setRunwayTransitionIndex(index) {
        if (index !== null) {
            index = parseInt(index);
        }
        if (this.runwayTransitionIndex !== index) {
            this.runwayTransitionIndex = index;
            this.onUpdated.fire(this);
        }
    }
    setEnRouteTransitionIndex(index) {
        if (index !== null) {
            index = parseInt(index);
        }
        if (this.enRouteTransitionIndex !== index) {
            this.enRouteTransitionIndex = index;
            this.onUpdated.fire(this);
        }
    }
    /**
     * @returns {WT_Procedure_Waypoints[]}
     */
    getAllTransitionLegs() {
        return this.procedure.getEnRouteTransitions().map(transition => new WT_Procedure_Waypoints([this.getAirportLeg(), ...transition.legs]));
    }
    getAirportLeg() {
        let leg = new WT_Procedure_Leg({
            type: 18,
            distance: 0,
            course: 0,
            theta: 0,
            rho: 0,
            turnDirection: 0,
        })
        leg.setFix({
            ident: "RW",
            coordinates: this.procedure.runwayCoordinates
        });

        return leg;
    }
    getSequence() {
        let legs = [];
        legs.push(this.getAirportLeg());
        if (this.runwayTransitionIndex !== null) {
            legs.push(...this.procedure.getRunwayTransition(this.runwayTransitionIndex).legs);
        }
        legs.push(...this.procedure.getCommonLegs());
        if (this.enRouteTransitionIndex !== null) {
            legs.push(...this.procedure.getEnRouteTransition(this.enRouteTransitionIndex).legs);
        }
        let waypointCollection = new WT_Procedure_Waypoints(legs);
        let waypoints = waypointCollection.waypoints;

        //this.outputWaypointsToConsole(waypoints);

        return waypoints;
    }
    getAirport() {
        return this.procedure.airport;
    }
    /**
     * @param {FlightPlanManager} flightPlan 
     */
    async load(flightPlan) {
        return new Promise(async resolve => {
            console.log(`Setting origin to ${this.procedure.icao}...`);
            flightPlan.setOrigin(this.procedure.icao, () => {
                // If there's no origin set 
                const origin = flightPlan.getOrigin();
                if (origin == null || origin.icao != this.procedure.icao) {
                    console.log(`Setting origin to ${this.procedure.icao}...`);
                    await (new Promise(resolve => flightPlan.addWaypoint(this.procedure.icao, 0, resolve)));
                    await (new Promise(resolve => flightPlan.setOrigin(this.procedure.icao, resolve)));
                }
                // Set procedure indexes
                await (Promise.all([
                    new Promise(resolve => flightPlan.setDepartureProcIndex(this.procedure.procedureIndex, resolve)),
                    new Promise(resolve => flightPlan.setDepartureEnRouteTransitionIndex(this.enRouteTransitionIndex, resolve)),
                    new Promise(resolve => flightPlan.setDepartureRunwayIndex(this.runwayTransitionIndex, resolve)),
                ]));
                resolve();
            });
        });
    }
}