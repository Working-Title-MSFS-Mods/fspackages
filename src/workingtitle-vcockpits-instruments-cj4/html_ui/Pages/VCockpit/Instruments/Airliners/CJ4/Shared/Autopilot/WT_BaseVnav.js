class WT_BaseVnav {
    constructor(fpm) {
        this._fpm = fpm;

        this._destination = undefined;
        //this._destinationDistance = undefined;
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
        //this._groundSpeed = undefined;
        //this._apCurrentVerticalSpeed = undefined;
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
        this._activeWaypointChanged = false;
        this._activeWaypointChangedflightPlanChanged = false;
        this._activeWaypointChangedvnavTargetChanged = false;
        this._valuesUpdated = false;
    }

    get waypoints() {
        return this._fpm.getAllWaypoints().slice(this._fpm.getActiveWaypointIndex());
    }

    /**
     * Run on first activation.
     */
    activate() {
        SimVar.SetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "feet", 0);
        this._flightPlanVersion = undefined;
        this._activeWaypointChanged = true;
        this._activeWaypointChangedflightPlanChanged = true;
        this._activeWaypointChangedvnavTargetChanged = true;
        this._valuesUpdated = false;
        this.update();
    }

    /**
     * Update data if needed.
     */
    update() {

        //CAN VNAV EVEN RUN?
        this._destination = this._fpm.getDestination();
        this._activeWaypoint = this._fpm.getActiveWaypoint();
        this._currentFlightSegment = this._fpm.getSegmentFromWaypoint(this._activeWaypoint);
        const flightPlanVersion = SimVar.GetSimVarValue("L:WT.FlightPlan.Version", "number");

        if (this._destination && this.waypoints && this.waypoints.length > 1 && this._activeWaypoint && flightPlanVersion) {
            this._vnavType = true;

            //HAS THE ACTIVE WAYPOINT CHANGED?
            if (this._lastActiveWaypointIdent != this._activeWaypoint.ident) {
                this._activeWaypointChanged = true;
            }

            //HAS THE FLIGHT PLAN CHANGED?
            if (this._flightPlanVersion != flightPlanVersion) {
                this._flightPlanChanged = true;
            }

            //HAS THE VNAV TARGET WAYTPOINT CHANGED?
            if (this._vnavTargetWaypoint != this._lastVnavTargetWaypoint) {
                this._vnavTargetChanged = true;
            }

            //FIND CURRENT CONSTRAINT -- This only needs to run when active waypoint changes
            if (this._flightPlanChanged || this._activeWaypointChanged) {
                for (let i = 0; i < this.waypoints.length; i++) {
                    let wpt = this.waypoints[i];
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
                    SimVar.SetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "number", this._vnavConstraintAltitude);
                }
                else {
                    SimVar.SetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "number", 0);
                }
            }

            //BUILD VPATH DESCENT PROFILE -- This only needs to be updated when flight plan changed or when active VNAV waypoint changes
            if (this._flightPlanChanged || this._vnavTargetChanged) {
                this.updateValues();
                this.buildDescentProfile();
            }

            //TRACK ALTITUDE DEVIATION
            if (this._vnavTargetAltitude && this._vnavTargetWaypoint) {
                if (this._valuesUpdated == false) {
                    this.updateValues();
                }
                this._vnavTargetDistance = this._vnavTargetWaypoint == this._activeWaypoint ? this._activeWaypointDist
                    : this._vnavTargetWaypoint.cumulativeDistanceInFP - this._currentDistanceInFP;
                this._desiredAltitude = this._vnavTargetAltitude + (Math.tan(this._desiredFPA * (Math.PI / 180)) * this._vnavTargetDistance * 6076.12);
                this._altDeviation = this._altitude - this._desiredAltitude;
                this._distanceToTod = this._topOfDescent < 0 ? 0 : this._vnavTargetDistance > this._topOfDescent ? (this._vnavTargetDistance - this._topOfDescent) : 0;
                SimVar.SetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet", this._altDeviation);
            }

            this._vnavTargetChanged = false;
            this._flightPlanChanged = false;
            this._activeWaypointChanged = false;
            this.writeMonitorValues(); //CAN BE REMOVED AFTER WE'RE DONE WITH MONITORING
        }
        else {
            //TODO: DO WE NEED TO FLAG WHEN NO VNAV IS BEING CALCULATED ANYWHERE?
            this._vnavType = false;
        }
        this._valuesUpdated = false;
        this.writeDatastoreValues();
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
        this._vnavTargetAltitude = this._vnavTargetAltitude === undefined ? (this._destination.infos.oneWayRunways[0].elevation * 3.28) + 50 : this._vnavTargetAltitude;
        this._lastActiveWaypointIdent = this._activeWaypoint.ident;
        this._desiredFPA = WTDataStore.get('CJ4_vpa', 3);

        //PLAN DESCENT PROFILE
        for (let i = this.waypoints.length - 1; i >= 0; i--) {
            const waypoint = this.waypoints[i];
            let altDesc = waypoint.legAltitudeDescription;
            if (altDesc == 1 && waypoint.legAltitude1 > 0) { //AT CASE
                this._vnavTargetAltitude = waypoint.legAltitude1;
                this._vnavTargetDistance = (waypoint === this._activeWaypoint) ? this._activeWaypointDist : waypoint.cumulativeDistanceInFP - this._currentDistanceInFP;
                this._topOfDescent = ((this._altitude - this._vnavTargetAltitude) / (Math.tan(this._desiredFPA * (Math.PI / 180)))) / 6076.12;
                this._vnavTargetWaypoint = waypoint;
            }
            else if (altDesc == 2 && waypoint.legAltitude1 > 0) { //ABOVE CASE
                let vnavTargetAltitudeAtWaypoint = this.getVNavTargetAltitudeAtWaypoint(waypoint);
                if (vnavTargetAltitudeAtWaypoint < waypoint.legAltitude1) {
                    this.processWaypoint(waypoint);
                }
            }
            else if (altDesc == 3 && waypoint.legAltitude1 > 0) { //BELOW CASE
                let vnavTargetAltitudeAtWaypoint = this.getVNavTargetAltitudeAtWaypoint(waypoint);
                if (vnavTargetAltitudeAtWaypoint > waypoint.legAltitude1) {
                    this.processWaypoint(waypoint);
                }
            }
            else if (altDesc == 4 && waypoint.legAltitude1 > 0) { //ABOVE AND BELOW CASE
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
        let distanceFromVnavTargetWaypoint = this._vnavTargetWaypoint ? this._vnavTargetWaypoint.cumulativeDistanceInFP - waypoint.cumulativeDistanceInFP
            : this._destination.cumulativeDistanceInFP - waypoint.cumulativeDistanceInFP;
        return this._vnavTargetAltitude + (6076.12 * distanceFromVnavTargetWaypoint * (Math.tan(this._desiredFPA * (Math.PI / 180))));
    }

    processWaypoint(waypoint) {
        this._vnavTargetAltitude = waypoint.legAltitude1;
        this._vnavTargetDistance = waypoint == this._activeWaypoint ? this._activeWaypointDist
            : waypoint.cumulativeDistanceInFP - this._currentDistanceInFP;
        this._topOfDescent = ((this._altitude - this._vnavTargetAltitude) / (Math.tan(this._desiredFPA * (Math.PI / 180)))) / 6076.12;
        this._vnavTargetWaypoint = waypoint;
    }

     /**
     * Fetch values when needed.
     */
    updateValues() {
        this._currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
        //this._groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
        //this._apCurrentVerticalSpeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "Feet/minute");
        this._altitude = SimVar.GetSimVarValue("PLANE ALTITUDE", "Feet");
        this._currentFlightSegment = this._fpm.getSegmentFromWaypoint(this._activeWaypoint);
        this._activeWaypointDist = Avionics.Utils.computeDistance(this._currPos, this._activeWaypoint.infos.coordinates);
        this._currentDistanceInFP = this._activeWaypoint.cumulativeDistanceInFP - this._activeWaypointDist;
        //this._destinationDistance = this._destination.cumulativeDistanceInFP - this._currentDistanceInFP;
        this._valuesUpdated = true;
    }

    writeDatastoreValues() {
        if (this._vnavType == false) {
            WTDataStore.set('CJ4_vnavValues', 'none');
        }
        else {
            const vnavValues = {
                vnavTargetAltitude: this._vnavTargetAltitude,
                vnavTargetDistance: this._vnavTargetDistance,
                topOfDescent: this._topOfDescent,
                distanceToTod: this._distanceToTod
            };
            WTDataStore.set('CJ4_vnavValues', JSON.stringify(vnavValues));
        }

    }

    writeMonitorValues() {
        // const monitorValues = {
        //     vnavTargetWaypointIdent: this._vnavTargetWaypoint.ident,
        // };
        if (this._vnavTargetWaypoint) {
            WTDataStore.set('CJ4_vnavTargetWaypoint', this._vnavTargetWaypoint.ident);
        }
    }
}

