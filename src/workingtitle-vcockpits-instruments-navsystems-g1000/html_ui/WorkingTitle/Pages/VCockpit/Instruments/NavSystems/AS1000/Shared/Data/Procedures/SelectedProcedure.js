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
    async load(flightPlan) {
        throw new Error("Selected procedure does not support loading");
    }
    /**
     * @param {FlightPlanManager} flightPlan 
     */
    async activate(flightPlan) {
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
            return [
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
            ].join(" ") + "\n";
        }).join("");
        str += "".padStart(header.length, "-") + "\n";
        console.log(str);
    }
}