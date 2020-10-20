class WT_OBS_Waypoints {
    constructor(obs) {
        this.obs = obs;
    }
    getWaypoints() { return this.obs.waypoints; }
    getWaypointsCount() { return this.obs.waypoints.length; };
    getActiveWaypointIndex() {
        let index = SimVar.GetSimVarValue("C:fs9gps:FlightPlanActiveWaypoint", "number");
        return index;
    };
    getActiveWaypoint() { return null; }
    getApproach() { return null; }
    getIsDirectTo() { return false; }
    getWaypoint(i) { return this.obs.waypoints[i]; }
    isActiveApproach() { return false; };
    getLastIndexBeforeApproach() { return this.obs.waypoints.length; };
}

class WT_OBS_Controller {
    /**
     * @param {WayPoint} waypoint 
     * @param {Number} course 
     * @param {MapInstrument} map 
     */
    constructor(waypoint, course, map) {
        this.waypoint = waypoint;
        this.waypoints = [];
        this.course = course;
        this.map = map;
        this.timeout = null;
        this.state = 0;
        this.isActive = false;
        this.lastSetCourse = null;
        this.isInFlightPlan = false;

        SimVar.SetSimVarValue("L:GPS OBS", "degree", course);

        this.flightPlan = new WT_OBS_Waypoints(this);
        this.updateWaypoints();
    }
    updateWaypoints() {
        let startCoordinates = Avionics.Utils.bearingDistanceToCoordinates((this.course + 180) % 360, WT_OBS_Controller.COURSE_LENGTH, this.waypoint.infos.coordinates.lat, this.waypoint.infos.coordinates.long);
        let endCoordinates = Avionics.Utils.bearingDistanceToCoordinates(this.course, WT_OBS_Controller.COURSE_LENGTH, this.waypoint.infos.coordinates.lat, this.waypoint.infos.coordinates.long);
        this.waypoints = [
            {
                ident: "s",
                infos: {
                    coordinates: startCoordinates
                }
            },
            this.waypoint,
            {
                ident: "e",
                infos: {
                    coordinates: endCoordinates
                }
            },
        ];
    }
    setCourse(course) {
        this.course = course;
        this.updateWaypoints();
    }
    async setInFlightPlan() {
        this.state = 1;
        this.lastSetCourse = this.course;
        if (this.isInFlightPlan) {
            await SimVar.SetSimVarValue("C:fs9gps:FlightPlanDeleteWaypoint", "enum", 2);
            await SimVar.SetSimVarValue("C:fs9gps:FlightPlanDeleteWaypoint", "enum", 0);
        }
        await SimVar.SetSimVarValue("C:fs9gps:FlightPlanNewWaypointLatitude", "degrees", this.waypoints[0].infos.coordinates.lat);
        await SimVar.SetSimVarValue("C:fs9gps:FlightPlanNewWaypointLongitude", "degrees", this.waypoints[0].infos.coordinates.long);
        await SimVar.SetSimVarValue("C:fs9gps:FlightPlanAddWaypoint", "enum", 0);
        if (!this.isInFlightPlan) {
            await SimVar.SetSimVarValue("C:fs9gps:FlightPlanNewWaypointLatitude", "degrees", this.waypoints[1].infos.coordinates.lat);
            await SimVar.SetSimVarValue("C:fs9gps:FlightPlanNewWaypointLongitude", "degrees", this.waypoints[1].infos.coordinates.long);
            await SimVar.SetSimVarValue("C:fs9gps:FlightPlanAddWaypoint", "enum", 1);
        }
        await SimVar.SetSimVarValue("C:fs9gps:FlightPlanNewWaypointLatitude", "degrees", this.waypoints[2].infos.coordinates.lat);
        await SimVar.SetSimVarValue("C:fs9gps:FlightPlanNewWaypointLongitude", "degrees", this.waypoints[2].infos.coordinates.long);
        await SimVar.SetSimVarValue("C:fs9gps:FlightPlanAddWaypoint", "enum", 2);
        await SimVar.SetSimVarValue("C:fs9gps:FlightPlanActiveWaypoint", "enum", 1);
        this.isInFlightPlan = true;
        setTimeout(() => this.state = 0, 500);
    }
    async activate() {
        this.isActive = true;

        let numExisting = SimVar.GetSimVarValue("C:fs9gps:FlightPlanWaypointsNumber", "number");
        console.log(`Deleting ${numExisting} waypoints`);
        for (let i = numExisting - 1; i >= 0; i--) {
            await SimVar.SetSimVarValue("C:fs9gps:FlightPlanDeleteWaypoint", "enum", i);
        }

        this.flightPlanElement = new SvgFlightPlanElement();
        this.flightPlanElement.hideReachedWaypoints = false;
        this.flightPlanElement.source = this.flightPlan;
        this.flightPlanElement.flightPlanIndex = WT_OBS_Controller.FLIGHT_PLAN_INDEX++;
        this.map.flightPlanElements.push(this.flightPlanElement);
        this.map.showFlightPlan = false;
    }
    deactivate() {
        this.isActive = false;
        this.map.showFlightPlan = true;
        this.map.flightPlanElements.splice(this.map.flightPlanElements.findIndex(item => item == this.flightPlanElement), 1);
    }
    update(dt) {
        this.setCourse(SimVar.GetSimVarValue("L:GPS OBS", "degree"));
        if (this.state == 0 && this.isActive && this.course != this.lastSetCourse) {
            this.setInFlightPlan();
        }
    }
}
WT_OBS_Controller.COURSE_LENGTH = 100;
WT_OBS_Controller.FLIGHT_PLAN_INDEX = 20;

class WT_Flight_Plan_Controller {
    constructor() {
        this.mode = null;
    }
    setMode(mode) {
        if (this.mode)
            this.mode.deactivate();
        this.mode = mode;
        if (this.mode)
            this.mode.activate();
    }
    update(dt) {
        if (this.mode)
            this.mode.update(dt);
    }
}