class WT_Procedure {
    constructor(airport, name, procedureIndex) {
        this._name = name;
        this.icao = airport.icao;
        this.procedureIndex = procedureIndex;
    }
    getTransition(transitionIndex) {
        return null;
    }
    getTransitions() {
        return null;
    }
    getRunways() {
        return null;
    }
    getPrimaryFrequency() {
        return null;
    }
    get name() {
        return this._name;
    }
}

class WT_Selected_Procedure {
    getSequence() {
        throw new Error("Get sequence not implemented");
    }
}

class WT_Approach_Procedure extends WT_Procedure {
    constructor(airport, approach, approachIndex) {
        super(airport, approach.name, approachIndex);

        let frequency = airport.frequencies.find(f => {
            return f.name.replace("RW0", "").replace("RW", "").indexOf(approach.runway) !== -1;
        });
        this.primaryFrequency = frequency ? frequency : null;

        this.waypoints = approach.wayPoints;
        this.transitions = approach.transitions;
    }
    getTransition(transitionIndex) {
        return this.transitions[transitionIndex];
    }
    getTransitions() {
        return this.transitions;
    }
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
        this.onUpdated = new WT_Event();
    }
    setTransitionIndex(index) {
        this.transitionIndex = index;
        this.onUpdated.fire(this);
    }
    getSequence() {
        let transition = this.transitionIndex === null ? null : this.procedure.getTransition(this.transitionIndex);
        let waypoints = [];
        let map = waypoint => {
            return {
                waypoint: waypoint,
                coordinates: waypoint.infos.coordinates,
                icao: waypoint.icao,
                bearing: waypoint.bearingInFP,
                distance: waypoint.distanceInFP * 0.000539957,
                ident: waypoint.ident,
                legType: waypoint.legType,
            }
        }
        if (transition !== null) {
            waypoints.push(...transition.waypoints.map(map));
        }
        waypoints.push(...this.procedure.waypoints.map(map));

        return waypoints;
    }
    load(flightPlan) {
        return new Promise(resolve => {
            console.log(`Setting destination to ${this.procedure.icao}...`);
            flightPlan.setDestination(this.procedure.icao, () => {
                console.log(`Loading approach ${this.procedure.procedureIndex} transition ${this.transitionIndex}...`);
                flightPlan.setApproachIndex(this.procedure.procedureIndex, () => {
                    console.log("Set approach index");
                    resolve();
                }, this.transitionIndex);
            });
        });
    }
    async activate(flightPlan) {
        console.log("Activating approach...");
        await this.load(flightPlan);
        flightPlan.activateApproach();
    }
}

class WT_Departure_Procedure extends WT_Procedure {
    constructor(airport, departure, departureIndex) {
        super(airport, departure.name, departureIndex);
        this.enRouteTransitions = departure.runwayTransitions;
        this.commonLegs = departure.commonLegs;
        this.runwayTransitions = departure.runwayTransitions;
    }
    getTransition(transitionIndex) {
        return this.enRouteTransitions[transitionIndex];
    }
    getRunways() {
        return this.runwayTransitions;
    }
    getTransitions() {
        return this.enRouteTransitions;
    }
    
}

class WT_Selected_Departure_Procedure {
    /**
    * @param {WT_Approach_Procedure} procedure 
    */
    constructor(procedure) {
        this.procedure = procedure;
        this.transitionIndex = null;
        this.runwayIndex =  null;
    }
    getSequence() {
        let transition = this.transitionIndex === null ? null : this.procedure.getTransition(this.transitionIndex);
        
        let waypoints = [];
        let map = leg => {
            return {
                icao: leg.fixIcao,
                bearing: leg.course,
                distance: leg.distance * 0.000539957,
                ident: leg.fixIcao.substr(7, 5).trim()
            }
        };
        if (transition !== null) {
            waypoints.push(...transition.legs.map(map));
        }
        waypoints.push(...this.procedure.commonLegs.map(map));

        return waypoints;
    }
}