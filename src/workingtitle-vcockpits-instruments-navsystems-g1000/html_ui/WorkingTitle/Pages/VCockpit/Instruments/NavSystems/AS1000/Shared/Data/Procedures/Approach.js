class WT_Approach_Procedure extends WT_Procedure {
    /**
     * @param {number} index 
     * @param {string} name 
     * @param {*} runway 
     * @param {Frequency} frequency 
     * @param {WT_Procedure_Leg[]} finalLegs 
     * @param {WT_Approach_Transition[]} transitions 
     */
    constructor(icao, index, name, runway, frequency, finalLegs, transitions) {
        super(name, index);
        this.icao = icao;
        this.runway = runway;
        this.primaryFrequency = frequency;
        this.finalLegs = finalLegs;
        this.transitions = transitions;
    }
    /**
     * @param {WT_Procedure_Leg[]} legs 
     */
    getFinalLegs() {
        return this.finalLegs;
    }
    /**
     * @returns {WT_Approach_Transition}
     */
    getTransition(transitionIndex) {
        return this.transitions[transitionIndex];
    }
    /**
     * @returns {WT_Approach_Transition[]}
     */
    getTransitions() {
        return this.transitions;
    }
    /**
     * @returns {Frequency}
     */
    getPrimaryFrequency() {
        return this.primaryFrequency;
    }
}

class WT_Selected_Approach_Procedure extends WT_Selected_Procedure {
    /**
     * @param {WT_Approach_Procedure} procedure 
     */
    constructor(procedure) {
        super();
        this.procedure = procedure;
        this.transitionIndex = null;
        this.finalLegsWaypoints = new WT_Procedure_Waypoints(procedure.getFinalLegs());
        this.updateSequence();
    }
    updateSequence() {
        this.transitionWaypoints = this.transitionIndex === null ? null : new WT_Procedure_Waypoints(this.procedure.getTransition(this.transitionIndex).legs);
    }
    setTransitionIndex(index) {
        if (index !== null) {
            index = parseInt(index);
        }
        if (this.transitionIndex !== index) {
            this.transitionIndex = index;
            this.updateSequence();
            this.onUpdated.fire(this);
        }
    }
    /**
     * @returns {WT_Procedure_Waypoints[]}
     */
    getAllTransitionLegs() {
        return this.procedure.getTransitions().map(transition => new WT_Procedure_Waypoints(transition.legs));
    }
    getSequence() {
        let waypoints = [];
        if (this.transitionWaypoints !== null) {
            waypoints.push(...this.transitionWaypoints.waypoints);
        }
        waypoints.push(...this.finalLegsWaypoints.waypoints);

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
            // If there's no destination set 
            const destination = flightPlan.getDestination();
            if (destination == null || destination.icao != this.procedure.icao) {
                console.log(`Setting destination to ${this.procedure.icao}...`);
                await (new Promise(resolve => flightPlan.addWaypoint(this.procedure.icao, flightPlan.getWaypointsCount(), resolve)));
                await (new Promise(resolve => flightPlan.setDestination(this.procedure.icao, resolve)));
            }
            // Load procedure
            console.log(`Loading approach ${this.procedure.procedureIndex} transition ${this.transitionIndex}...`);
            await (new Promise(resolve => flightPlan.setApproachIndex(this.procedure.procedureIndex, resolve, this.transitionIndex)));
            resolve();
        });
    }
    /**
     * @param {FlightPlanManager} flightPlan 
     */
    async activate(flightPlan) {
        console.log("Activating approach...");
        await this.load(flightPlan);
        flightPlan.activateApproach();
    }
}