class WT_BaseVnav {
    constructor(fpm) {
        this._fpm = fpm;

        this._destination = undefined;
        this._destinationDistance = undefined;
        this._activeWaypoint = undefined;
        this._activeWaypointDist = undefined;
        this._currentDistanceInFP = undefined;
        this._lastActiveWaypointIdent = undefined;
        this._lastDestinationIdent = undefined;
        this._currentFlightSegment = undefined;

        //COMPONENTS TO REFRESH ONLY WHEN THERE IS A FLIGHT PLAN CHANGE
        this._desiredFPA = WTDataStore.get('CJ4_vpa', 3);
        this._vnavType = false;

        this._currPos = undefined;
        this._groundSpeed = undefined;
        this._apCurrentVerticalSpeed = undefined;
        this._altitude = undefined;

        this._vnavTargetDistance = undefined;
        this._topOfDescent = undefined;
        this._vnavTargetWaypoint = undefined;
        this._vnavTargetAltitude = undefined;
        this._lastVnavTargetAltitude = undefined;
        this._lastVnavTargetWaypoint = undefined;
        this._interceptingLastAltitude = false;
        this._desiredVerticalSpeed = undefined;
        this._desiredAltitude = undefined;
        this._altDeviation = undefined;
        this._distanceToTod = undefined;
        this._vnavConstraintAltitude = undefined;
        this._flightPlanVersion = undefined;

    }

    get waypoints(){
        return this._fpm.getWaypoints().slice(this._fpm.getActiveWaypointIndex());
    }

    /**
     * Run on first activation.
     */
    activate() {
        SimVar.SetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "feet", 0);
        this._flightPlanVersion = undefined;
        this.update();
    }

    /**
     * Update data if needed.
     */
    update() {

        // TODO detect if activewaypoint is changed and update
        // TODO detect if destination is changed and update
        // TODO is there a performance benefit to loading waypoints on activation and then only updating the waypoints if
        //    there is an increment in the flight plan version?

        //CAN VNAV EVEN RUN?
        this._destination = this._fpm.getDestination();
        this._activeWaypoint = this._fpm.getActiveWaypoint();
        let activeWaypointChanged = false;
        let flightPlanChanged = false;
        let vnavTargetChanged = false;

        if (this._destination && waypoints && waypoints.length > 1 && this._activeWaypoint) {
            
            //VNAV CAN RUN, UPDATE DATA
            this._currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
            this._groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            //this._apCurrentAltitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "Feet");
            this._apCurrentVerticalSpeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "Feet/minute");
            this._altitude = SimVar.GetSimVarValue("PLANE ALTITUDE", "Feet");
            this._activeWaypoint = this._fpm.getActiveWaypoint();
            this._currentFlightSegment = this._fpm.getSegmentFromWaypoint(this._activeWaypoint);
            this._activeWaypointDist = Avionics.Utils.computeDistance(this._currPos, this._activeWaypoint.infos.coordinates);
            this._currentDistanceInFP = this._activeWaypoint.cumulativeDistanceInFP - this._activeWaypointDist;
            this._destinationDistance = this._destination.cumulativeDistanceInFP - this._currentDistanceInFP;
            this._currentFlightSegment = this._fpm.getSegmentFromWaypoint(this._activeWaypoint);

            //HAS THE ACTIVE WAYPOINT CHANGED?
            if (this._lastActiveWaypointIdent != this._activeWaypoint.ident) {
                activeWaypointChanged = true;
            }

            //HAS THE FLIGHT PLAN CHANGED?
            if (this._flightPlanVersion != SimVar.GetSimVarValue("L:WT.FlightPlan.Version", "number")) {
                flightPlanChanged = true;
            }

            //HAS THE VNAV TARGET WAYTPOINT CHANGED?
            if (this._vnavTargetWaypoint != this._lastVnavTargetWaypoint) {
                vnavTargetChanged = true;
            }

            //FIND CURRENT CONSTRAINT -- This only needs to run when active waypoint changes
            if (flightPlanChanged || activeWaypointChanged) {
                for (let i = 0; i < waypoints.length; i++) {
                    let wpt = waypoints[i];
                    if (wpt.legAltitudeDescription > 0 && this._currentFlightSegment === SegmentType.Departure) {
                        if (wpt.legAltitudeDescription == 1 || wpt.legAltitudeDescription == 3 || wpt.legAltitudeDescription == 4) {
                            this._vnavConstraintAltitude = wpt.legAltitude1;
                            break;
                        }
                    }
                    else if (wpt.legAltitudeDescription > 0 && (this._currentFlightSegment === SegmentType.Enroute || this._currentFlightSegment === SegmentType.Arrival || this._currentFlightSegment === SegmentType.Approach)) {
                        if (wpt.legAltitudeDescription == 1 || wpt.legAltitudeDescription == 2) {
                            this._vnavConstraintAltitude = wpt.legAltitude1;
                            break;
                        }
                        else if (wpt.legAltitudeDescription == 4) {
                            this._vnavConstraintAltitude = wpt.legAltitude2;
                            break;
                        }
                    }
                    else {
                        this._vnavConstraintAltitude = undefined;
                    }
                }

                //SET CURRENT CONSTRAINT ALTITUDE SIMVAR -- This only needs to run when active waypoint changes
                if (this._vnavConstraintAltitude) {
                    SimVar.SetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "feet", this._vnavConstraintAltitude);
                }
                else {
                    SimVar.SetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "feet", 0);
                }
            }



            //BUILD VPATH DESCENT PROFILE -- This only needs to be updated when flight plan changed or when active VNAV waypoint changes
            if (flightPlanChanged || vnavTargetChanged) {
                this.buildDescentProfile();
            }
        }
        else {
            this._vnavType = false;
        }



    }

    /**
     * Execute.
     */
    execute() {

    }

    /**
     * Run when deactivated.
     */
    deactivate() {

    }

    buildDescentProfile() {
        this._vnavTargetAltitude = this._vnavTargetAltitude === undefined ? this._destination.infos.oneWayRunways[0].elevation * 3.28 : this._vnavTargetAltitude;
        this._lastActiveWaypointIdent = this._activeWaypoint.ident;

        //PLAN DESCENT PROFILE
        for (let i = this.waypoints.length - 1; i >= 0; i--) {
            const waypoint = this.waypoints[i];
            let altDesc = waypoint.legAltitudeDescription;
            if (altDesc == 1 && waypoint.legAltitude1 > 1000) { //AT CASE
                this._vnavTargetAltitude = waypoint.legAltitude1;
                this._vnavTargetDistance = (waypoint === this._activeWaypoint) ? this._activeWaypointDist : waypoint.cumulativeDistanceInFP - this._currentDistanceInFP;
                this._topOfDescent = ((this._altitude - this._vnavTargetAltitude) / (Math.tan(this._desiredFPA * (Math.PI / 180)))) / 6076.12;
            }
            else if (altDesc == 2 && waypoint.legAltitude1 > 1000) { //ABOVE CASE
                let vnavTargetAltitudeAtWaypoint = this.getVNavTargetAltitudeAtWaypoint(waypoint);
                if (vnavTargetAltitudeAtWaypoint < waypoint.legAltitude1) {
                    this.processWaypoint(waypoint);
                }
            }
            else if (altDesc == 3 && waypoint.legAltitude1 > 1000) { //BELOW CASE
                let vnavTargetAltitudeAtWaypoint = this.getVNavTargetAltitudeAtWaypoint(waypoint);
                if (vnavTargetAltitudeAtWaypoint > waypoint.legAltitude1) {
                    this.processWaypoint(waypoint);
                }
            }
            else if (altDesc == 4 && waypoint.legAltitude1 > 1000) { //ABOVE AND BELOW CASE
                let vnavTargetAltitudeAtWaypoint = this.getVNavTargetAltitudeAtWaypoint(waypoint);
                if (vnavTargetAltitudeAtWaypoint > waypoint.legAltitude1) {
                    this.processWaypoint(waypoint);
                }
                else if (this._vnavTargetAltitudeAtWaypoint < waypoint.legAltitude2) {
                    this._vnavTargetAltitude = waypoint.legAltitude2;
                    this._vnavTargetDistance = waypoint == this._activeWaypoint ? this._activeWaypointDist
                        : waypoint.cumulativeDistanceInFP - this._currentDistanceInFP;
                    this._topOfDescent = ((this._altitude - this._vnavTargetAltitude) / (Math.tan(this._desiredFPA * (Math.PI / 180)))) / 6076.12;
                    this._vnavTargetWaypoint = waypoint;
                }
            }
        }
    }

    getVNavTargetAltitudeAtWaypoint(waypoint) {
        let distanceFromVnavTargetWaypoint = this._vnavTargetWaypoint.cumulativeDistanceInFP - waypoint.cumulativeDistanceInFP;
        return this._vnavTargetAltitude + (6076.12 * distanceFromVnavTargetWaypoint * (Math.tan(this._desiredFPA * (Math.PI / 180))));
    }

    processWaypoint(waypoint) {
        this._vnavTargetAltitude = waypoint.legAltitude1;
        this._vnavTargetDistance = waypoint == this._activeWaypoint ? this._activeWaypointDist
            : waypoint.cumulativeDistanceInFP - this._currentDistanceInFP;
        this._topOfDescent = ((this._altitude - this._vnavTargetAltitude) / (Math.tan(this._desiredFPA * (Math.PI / 180)))) / 6076.12;
        this._vnavTargetWaypoint = waypoint;
    }
}