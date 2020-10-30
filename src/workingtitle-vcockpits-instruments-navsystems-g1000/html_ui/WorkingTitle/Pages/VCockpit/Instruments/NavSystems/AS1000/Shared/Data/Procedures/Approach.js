class WT_Approach_Procedure extends WT_Procedure {
    constructor(index, name, runway, frequency, finalLegs, transitions) {
        super(name, index);
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
        this.finalLegsWaypoints = new WT_Procedure_Waypoints(procedure.getFinalLegs());
        this.updateSequence();
    }
    updateSequence() {
        this.transitionWaypoints = this.transitionIndex === null ? null : new WT_Procedure_Waypoints(this.procedure.getTransition(this.transitionIndex).legs);
    }
    setTransitionIndex(index) {
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
        let transitions = [];
        for (let transition of this.procedure.getTransitions()) {
            transitions.push(new WT_Procedure_Waypoints(transition.legs));
        }
        return transitions;
    }
    getSequence() {
        let waypoints = [];
        if (this.transitionWaypoints !== null) {
            waypoints.push(...this.transitionWaypoints.waypoints);
        }
        waypoints.push(...this.finalLegsWaypoints.waypoints);

        let header = ` ID  TYPE ORGIN /   FIX   DIST   Θ     ρ  BRG TURN`;
        let headerText = `${this.procedure.name} / ${this.transitionIndex}`;
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

        //console.log(JSON.stringify(waypoints, null, 2));

        return waypoints;
    }
    getAirport() {
        return this.procedure.airport;
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