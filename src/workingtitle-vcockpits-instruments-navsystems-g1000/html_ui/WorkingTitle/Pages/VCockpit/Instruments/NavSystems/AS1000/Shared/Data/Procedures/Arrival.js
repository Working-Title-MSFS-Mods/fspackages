class WT_Arrival_Procedure extends WT_Procedure {
    /**
     * @param {number} index 
     * @param {string} name 
     * @param {LatLong} runwayCoordinates 
     * @param {string} airportIdent 
     * @param {WT_Runway_Transition[]} runwayTransitions 
     * @param {WT_Procedure_Leg[]} commonLegs 
     * @param {WT_EnRoute_Transition[]} enRouteTransitions 
     */
    constructor(index, name, runwayCoordinates, airportIdent, runwayTransitions, commonLegs, enRouteTransitions) {
        super(name, index);
        this.runwayCoordinates = runwayCoordinates;
        this.airportIdent = airportIdent;
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
    getRunwayTransition(index) {
        return this.runwayTransitions[index];
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
    getEnRouteTransition(index) {
        return this.enRouteTransitions[index];
    }
    /**
     * @returns {WT_EnRoute_Transition[]}
     */
    getEnRouteTransitions() {
        return this.enRouteTransitions;
    }
}

class WT_Selected_Arrival_Procedure extends WT_Selected_Procedure {
    /**
     * @param {WT_Arrival_Procedure} procedure 
     */
    constructor(procedure) {
        super();
        this.procedure = procedure;
        this.runwayTransitionIndex = null;
        this.enRouteTransitionIndex = null;
    }
    setRunwayTransitionIndex(index) {
        if (this.runwayTransitionIndex !== index) {
            this.runwayTransitionIndex = index;
            this.onUpdated.fire(this);
        }
    }
    setEnRouteTransitionIndex(index) {
        if (this.enRouteTransitionIndex !== index) {
            this.enRouteTransitionIndex = index;
            this.onUpdated.fire(this);
        }
    }
    /**
     * @returns {WT_Procedure_Waypoints[]}
     */
    getAllTransitionLegs() {
        let transitions = [];
        for (let transition of this.procedure.getEnRouteTransitions()) {
            transitions.push(new WT_Procedure_Waypoints(transition.legs));
        }
        return transitions;
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
            ident: this.procedure.airportIdent,
            coordinates: this.procedure.runwayCoordinates
        });

        return leg;
    }
    getSequence() {
        let legs = [];
        if (this.enRouteTransitionIndex !== null) {
            legs.push(...this.procedure.getEnRouteTransition(this.enRouteTransitionIndex).legs);
        }
        legs.push(...this.procedure.getCommonLegs());
        if (this.runwayTransitionIndex !== null) {
            legs.push(...this.procedure.getRunwayTransition(this.runwayTransitionIndex).legs);
        }
        legs.push(this.getAirportLeg());

        let waypointCollection = new WT_Procedure_Waypoints(legs);
        let waypoints = waypointCollection.waypoints;

        this.outputWaypointsToConsole(waypoints);

        return waypoints;
    }
    getAirport() {
        return this.procedure.airport;
    }
    load(flightPlan) {
    }
}