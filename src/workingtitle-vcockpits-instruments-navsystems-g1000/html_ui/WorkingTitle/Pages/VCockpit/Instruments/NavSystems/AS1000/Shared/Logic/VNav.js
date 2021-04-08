class WT_VNav_Planner {

}

class WT_Event {
    constructor() {
        this.listeners = [];
    }
    addListener(listener) {
        this.listeners.push(listener);
    }
}

class WT_VNav_Status { }
WT_VNav_Status.Inactive = 0;
WT_VNav_Status.Armed = 1;
WT_VNav_Status.Active = 2;

class WT_VNav_Controller {
    constructor() {
        this.armedLeg = null;
        this.activeLeg = null;
        this.status = WT_VNav_Status.Inactive;
    }
    validateFlightPathAngle(angle) {
        return angle < 0 && angle > -6 * Avionics.Utils.DEG2RAD;
    }
    validateVerticalSpeed(speed) {
        return speed < 0 && speed > -4000;
    }
    setWaypoint(waypoint) {

    }
    getStatus() {

    }
    isFlightPlanLegValid(from, to) {
        let deltaAltitude = (to.altitudeInFp - from.altitudeInFp) * 0.3048;
        if (deltaAltitude > 0)
            return false;
        let distance = to.distanceInFP * 1852;
        let angle = Math.atan(-deltaAltitude, distance);
        return this.validateFlightPathAngle(angle);
    }
}

class WT_VNav_Leg {
    constructor(waypoint) {
        this.verticalSpeedTarget = null;
        this.flightPathAngle = null;
        this.waypoint = waypoint;
    }
    setFlightPathAngle(angle) {
        this.flightPathAngle = angle;
    }
    getTopOfDescentDistance(currentAltitude) {
        return this.getDeltaAltitude(currentAltitude) / Math.tan(-this.flightPathAngle);
    }
    getDistanceToTopOfDescent(currentAltitude) {
        let planeCoordinates = new LatLong(SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude"));
        let distanceToWaypoint = this.calculateDistanceToWaypoint(planeCoordinates);
        return distanceToWaypoint - this.getTopOfDescentDistance(currentAltitude);
    }
    getDeltaAltitude(currentAltitudeMet) {
        let desiredAltitude = this.waypoint.altitudeInFp * 0.3048;
        return desiredAltitude - currentAltitude;
    }
    calculateDeviation() {

    }
    calculateDistanceToWaypoint(from) {
        Avionics.Utils.computeGreatCircleDistance(from, this.waypoint.infos.coordinates);
    }
    getRequiredVerticalSpeed(currentAltitude, groundSpeed) {
        let planeCoordinates = new LatLong(SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude"));
        let timeToWaypoint = this.calculateDistanceToWaypoint(planeCoordinates) / groundSpeed;
        let deltaAltitude = this.getDeltaAltitude(currentAltitude);
        let vspeed = deltaAltitude / timeToWaypoint;
        return vspeed;
    }
}

class WT_AP_Controller {
    constructor() {
        this.lateralController = new WT_AP_Lateral_Controller();
    }
}

class WT_AP_Lateral_Controller {
    constructor() {
        this.armed = null;
        this.active = null;
    }
    isCdiCentered() {

    }
    update(dt) {
        if (this.armed && this.armed.canActivate()) {
            this.armed = null;
            this.active = this.armed;
        }
        this.active.update();
    }
}

class WP_AP_Lateral_Mode {
    canActivate() { }
    update() { }
    activate() { }
}

class WT_AP_Roll_Mode extends WP_AP_Lateral_Mode {
    constructor() {
    }
    canActivate() {
        return true;
    }
    update() {

    }
}

class WT_AP_Heading_Mode extends WP_AP_Lateral_Mode {
    constructor() {
        this.heading = 0;
    }
    canActivate() {
        return true;
    }
    update() {

    }
}

class WT_AP_Nav_Mode extends WP_AP_Lateral_Mode {
    constructor() {
    }
    canActivate() {
        return true;
    }
    update() {

    }
}

class WT_AP_Loc_Mode extends WP_AP_Lateral_Mode {
    constructor() {
    }
    canActivate() {
        return true;
    }
    update() {

    }
}

WT_AP_Lateral_Controller.MODE_ROLL = "ROL";
WT_AP_Lateral_Controller.MODE_HEADING = "HDG";
WT_AP_Lateral_Controller.MODE_LOC = "LOC";
WT_AP_Lateral_Controller.MODE_NAV = "NAV";