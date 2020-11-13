class WT_Direct_To_Waypoints {
    constructor(directTo) {
        this.directTo = directTo;
    }
    getWaypoints() { return this.directTo.waypoints; }
    getWaypointsCount() { return this.directTo.waypoints.length; };
    getActiveWaypointIndex() {
        let index = SimVar.GetSimVarValue("C:fs9gps:FlightPlanActiveWaypoint", "number");
        return index;
    };
    getActiveWaypoint() { return null; }
    getApproach() { return null; }
    getIsDirectTo() { return false; }
    getWaypoint(i) { return this.directTo.waypoints[i]; }
    isActiveApproach() { return false; };
    getLastIndexBeforeApproach() { return this.directTo.waypoints.length; };
}

class WT_Direct_To_Handler {
    /**
     * @param {WT_Flight_Plan_Controller} flightPlanController 
     * @param {MapInstrument} map 
     */
    constructor(flightPlanController, map) {
        this.flightPlanController = flightPlanController;
        this.map = map;
    }
    activate(waypoint, course) {
        let controller = new WT_Direct_To_Controller(waypoint, course, this.map);
        this.flightPlanController.setMode(controller);
    }
    cancel() {
        throw new Error("Cancel direct to not implemented");
    }
}

class WT_Direct_To_Controller_Factory {
    /**
     * @param {WT_Waypoint_Repository} waypoint 
     * @param {MapInstrument} map 
     */
    constructor(waypointRepository, map) {
        this.waypointRepository = waypointRepository;
        this.map = map;
    }
    async create(icao, course) {
        const waypoint = await this.waypointRepository.load(icao);
        return new WT_Direct_To_Controller(waypoint, course, this.map);
    }
}

class WT_Direct_To_Controller extends WT_Flight_Plan_Mode {
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

        this.flightPlan = new WT_Direct_To_Waypoints(this);
        this.updateWaypoints();
    }
    updateWaypoints() {
        let startCoordinates = null;
        if (this.course !== null) {
            startCoordinates = Avionics.Utils.bearingDistanceToCoordinates((this.course + 180) % 360, WT_Direct_To_Controller.COURSE_LENGTH, this.waypoint.infos.coordinates.lat, this.waypoint.infos.coordinates.long);
        } else {
            let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            startCoordinates = new LatLongAlt(lat, long, 0);
        }
        this.waypoints = [
            {
                ident: "s",
                infos: {
                    coordinates: startCoordinates
                }
            },
            this.waypoint
        ];
    }
    async activate() {
        this.isActive = true;

        let numExisting = SimVar.GetSimVarValue("C:fs9gps:FlightPlanWaypointsNumber", "number");
        console.log(`Deleting ${numExisting} waypoints`);
        for (let i = numExisting - 1; i >= 0; i--) {
            await SimVar.SetSimVarValue("C:fs9gps:FlightPlanDeleteWaypoint", "enum", i);
        }
        await SimVar.SetSimVarValue("C:fs9gps:FlightPlanNewWaypointLatitude", "degrees", this.waypoints[0].infos.coordinates.lat);
        await SimVar.SetSimVarValue("C:fs9gps:FlightPlanNewWaypointLongitude", "degrees", this.waypoints[0].infos.coordinates.long);
        await SimVar.SetSimVarValue("C:fs9gps:FlightPlanAddWaypoint", "enum", 0);
        await SimVar.SetSimVarValue("C:fs9gps:FlightPlanNewWaypointLatitude", "degrees", this.waypoints[1].infos.coordinates.lat);
        await SimVar.SetSimVarValue("C:fs9gps:FlightPlanNewWaypointLongitude", "degrees", this.waypoints[1].infos.coordinates.long);
        await SimVar.SetSimVarValue("C:fs9gps:FlightPlanAddWaypoint", "enum", 1);
        await SimVar.SetSimVarValue("C:fs9gps:FlightPlanActiveWaypoint", "enum", 1);

        this.flightPlanElement = new SvgFlightPlanElement();
        this.flightPlanElement.hideReachedWaypoints = false;
        this.flightPlanElement.source = this.flightPlan;
        this.flightPlanElement.flightPlanIndex = WT_Direct_To_Controller.FLIGHT_PLAN_INDEX++;
        this.map.flightPlanElements.push(this.flightPlanElement);
        this.map.showFlightPlan = false;
    }
    deactivate() {
        this.isActive = false;
        this.map.showFlightPlan = true;
        this.map.flightPlanElements.splice(this.map.flightPlanElements.findIndex(item => item == this.flightPlanElement), 1);
    }
    update(dt) {
    }
    getLegInformation() {
        const from = null;
        const to = this.waypoint.icao;
        const symbol = "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/direct_to.bmp";
        const distance = SimVar.GetSimVarValue("GPS WP DISTANCE", "kilometers");
        const bearing = Math.round(SimVar.GetSimVarValue("GPS WP BEARING", "degree"));

        return new WT_Flight_Plan_Leg_Information(WT_Flight_Plan_Mode.MODE_DIRECT_TO, from, to, symbol, distance, bearing);
    }
}
WT_Direct_To_Controller.COURSE_LENGTH = 100;
WT_Direct_To_Controller.FLIGHT_PLAN_INDEX = 20;