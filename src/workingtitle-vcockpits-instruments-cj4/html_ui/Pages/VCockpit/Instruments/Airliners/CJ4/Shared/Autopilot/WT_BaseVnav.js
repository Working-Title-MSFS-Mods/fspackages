class WT_BaseVnav {

    /**
     * Creates an instance of WT_BaseVnav.
     * @param {FlightPlanManager} fpm The flight plan manager to use with this instance.
     * @param {CJ4NavModeSelector} navModeSelector The nav mode selector to use with this instance.
     */
    constructor(fpm, navModeSelector) {
        /**
         * The flight plan manager
         * @type {FlightPlanManager}
         */
        this._fpm = fpm;
        this._navModeSelector = navModeSelector;

        this._destination = undefined;
        this._activeWaypoint = undefined;
        this._activeWaypointDist = undefined;
        this._currentDistanceInFP = undefined;
        this._lastActiveWaypointIdent = undefined;
        this._lastDestinationIdent = undefined;
        this._currentFlightSegment = undefined;

        //COMPONENTS TO REFRESH ONLY WHEN THERE IS A FLIGHT PLAN CHANGE
        this._desiredFPA = WTDataStore.get('CJ4_vpa', 3);
        this._vnavCalculating = false;

        this._currPos = undefined;
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
        this._vnavTargetChanged = false;
        this._flightPlanChanged = false;
        this._valuesUpdated = false;
        this._vnavConstraintWaypoint = undefined;
        this._vnavConstraintType = undefined;
        this._firstApproachWaypointConstraint = undefined;

        this._pathCalculating = false;

        this._setDestination = undefined;
        this._newPath = false;
    }

    get waypoints() {
        return this.flightplan.waypoints.slice(this.flightplan.activeWaypointIndex);
    }

    /**
     * The active flight plan.
     * @type {ManagedFlightPlan}
     */
    get flightplan() {
        return this._fpm.getFlightPlan(0);
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
        this._vnavCalculating = false;
        this._setDestination = undefined;
        this._newPath = false;
        this.update();
    }

    /**
     * Update data if needed.
     */
    update() {

        //CAN VNAV EVEN RUN?
        this._destination = this._fpm.getDestination();
        this._activeWaypoint = this.flightplan.waypoints[this.flightplan.activeWaypointIndex];
        this._currentFlightSegment = this._fpm.getSegmentFromWaypoint(this._activeWaypoint);

        const flightPlanVersion = SimVar.GetSimVarValue("L:WT.FlightPlan.Version", "number");

        if (this._destination && this.waypoints && this.waypoints.length > 0 && this._activeWaypoint && flightPlanVersion) {
            this._vnavCalculating = true;
            this._currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
            this._activeWaypointDist = Avionics.Utils.computeDistance(this._currPos, this._activeWaypoint.infos.coordinates);

            const currentLateralMode = this._navModeSelector.currentLateralActiveState;
            if (currentLateralMode !== this._currentLateralMode) {

                if (this.currentLateralMode !== LateralNavModeState.APPR && currentLateralMode === LateralNavModeState.APPR) {
                    this.buildGlidepath();
                }

                if (this.currentLateralMode === LateralNavModeState.APPR && currentLateralMode !== LateralNavModeState.APPR) {
                    this._vnavTargetChanged = true;
                }

                this._currentLateralMode = currentLateralMode;
            }

            //HAS THE ACTIVE WAYPOINT CHANGED?
            if (this._lastActiveWaypointIdent != this._activeWaypoint.ident) {
                this._activeWaypointChanged = true;
            }
            //console.log("changed? " + (this._activeWaypointChanged ? "YES" : "NO"));

            //HAS THE FLIGHT PLAN CHANGED?
            if (this._flightPlanVersion != flightPlanVersion) {
                this._flightPlanChanged = true;
            }

            //HAS THE VNAV TARGET WAYPOINT CHANGED?
            if (this._vnavTargetWaypoint) {
                let targetWaypointIndex = this.waypoints.indexOf(this._vnavTargetWaypoint) >= 0;
                // console.log("targetWaypointIndex: " + targetWaypointIndex);
                if (targetWaypointIndex === false) {
                    this._vnavTargetChanged = true;
                }
            }

            // this._vnavTargetWaypoint
            // if (this._vnavTargetWaypoint != this._lastVnavTargetWaypoint) {
            //     this._vnavTargetChanged = true;
            // }

            //FIND CURRENT CONSTRAINT -- This only needs to run when active waypoint changes
            if (this._flightPlanChanged || this._activeWaypointChanged || this._vnavTargetChanged) {
                for (let i = 0; i < this.waypoints.length; i++) {
                    let wpt = this.waypoints[i];
                    let wptSegment = this._fpm.getSegmentFromWaypoint(wpt);
                    if (wpt.legAltitudeDescription > 0 && this._currentFlightSegment.type == SegmentType.Departure && wptSegment.type == SegmentType.Departure) {
                        if (wpt.legAltitudeDescription == 1 || wpt.legAltitudeDescription == 3 || wpt.legAltitudeDescription == 4) {
                            this._vnavConstraintAltitude = wpt.legAltitude1;
                            this._vnavConstraintWaypoint = wpt;
                            this._vnavConstraintType = "below";
                            break;
                        }
                    }
                    else if (wpt.legAltitudeDescription > 0 && (this._currentFlightSegment.type == SegmentType.Enroute || this._currentFlightSegment.type == SegmentType.Arrival || this._currentFlightSegment.type == SegmentType.Approach)) {
                        if (wpt.legAltitudeDescription == 1 || wpt.legAltitudeDescription == 2) {
                            this._vnavConstraintAltitude = wpt.legAltitude1;
                            this._vnavConstraintWaypoint = wpt;
                            this._vnavConstraintType = "above";
                            break;
                        }
                        else if (wpt.legAltitudeDescription == 4) {
                            this._vnavConstraintAltitude = wpt.legAltitude2;
                            this._vnavConstraintWaypoint = wpt;
                            this._vnavConstraintType = "above";
                            break;
                        }
                        else if (wpt.legAltitudeDescription === 3) {
                            this._vnavConstraintAltitude = wpt.legAltitude1;
                            this._vnavConstraintWaypoint = wpt;
                            this._vnavConstraintType = "below";
                            break;
                        }
                    }
                    else {
                        this._vnavConstraintAltitude = undefined;
                        this._vnavConstraintWaypoint = undefined;
                        this._vnavConstraintType = undefined;
                    }
                }
            }

            //SET CURRENT CONSTRAINT ALTITUDE SIMVAR -- This only needs to run when active waypoint changes
            this.setConstraintAltitude();


            //BUILD VPATH DESCENT PROFILE -- This only needs to be updated when flight plan changed or when active VNAV waypoint changes
            if (this._currentFlightSegment.type != SegmentType.Departure && (this._flightPlanChanged || this._vnavTargetChanged)) {
                // console.log("build profile started");
                this.buildDescentProfile();
                // console.log(`profile written: ${this._vnavTargetWaypoint && this._vnavTargetWaypoint.ident} ${this._vnavTargetAltitude}`);
            }

            //TRACK ALTITUDE DEVIATION
            if (this._currentFlightSegment.type != SegmentType.Departure && this._vnavTargetAltitude && this._vnavTargetWaypoint) {
                if (this._valuesUpdated == false) {
                    this.updateValues();
                }
                this._vnavTargetDistance = this._vnavTargetWaypoint == this._activeWaypoint ? this._activeWaypointDist
                    : this._vnavTargetWaypoint.cumulativeDistanceInFP - this._currentDistanceInFP;
                this._desiredAltitude = this._vnavTargetAltitude + (Math.tan(this._desiredFPA * (Math.PI / 180)) * this._vnavTargetDistance * 6076.12);
                this._altDeviation = this._altitude - this._desiredAltitude;
                this._distanceToTod = this._topOfDescent < 0 ? 0 : this._vnavTargetDistance > this._topOfDescent ? (this._vnavTargetDistance - this._topOfDescent) : 0;
                SimVar.SetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet", this._altDeviation);
                this._pathCalculating = true;
                this.setTodWaypoint();
            }
            else {
                SimVar.SetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet", 0);
                this._pathCalculating = false;
                this.setTodWaypoint(false);
            }



            this._vnavTargetChanged = false;
            this._flightPlanChanged = false;
            this._activeWaypointChanged = false;
            this._lastActiveWaypointIdent = this._activeWaypoint.ident;
            this._flightPlanVersion = flightPlanVersion;
            this.writeMonitorValues(); //CAN BE REMOVED AFTER WE'RE DONE WITH MONITORING
            this.writeDatastoreValues(); //CAN BE REMOVED AFTER WE'RE DONE WITH MONITORING
        }
        else {
            this._vnavCalculating = false;
            this._pathCalculating = false;
            this._vnavConstraintAltitude = undefined;
            this._vnavConstraintWaypoint = undefined;
            this._vnavConstraintType = undefined;
            this.setTodWaypoint(false);
            if (SimVar.GetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "number") > 0) {
                SimVar.SetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "number", 0);
            }
        }
        this._valuesUpdated = false;
    }

    buildDescentProfile() {
        if (this._valuesUpdated == false) {
            this.updateValues();
        }
        this._vnavTargetAltitude = (this._destination.infos.oneWayRunways[0].elevation * 3.28) + 50;
        this._desiredFPA = WTDataStore.get('CJ4_vpa', 3);


        //FIND FIRST WAYPOINT ON APPROACH WITH CONSTRAINT
        this._firstApproachWaypointConstraint = undefined;
        let approachWaypoints = this._fpm.getApproachWaypoints();
        if (approachWaypoints) {
            for (let i = 0; i < approachWaypoints.length; i++) {
                const waypoint = approachWaypoints[i];
                let altDesc = waypoint.legAltitudeDescription;
                if (altDesc == 1 || altDesc == 2 || altDesc == 4) {
                    this._firstApproachWaypointConstraint = waypoint;
                    break;
                }
            }
        }
        //PLAN DESCENT PROFILE
        for (let i = this.waypoints.length - 1; i >= 0; i--) {
            const waypoint = this.waypoints[i];
            let altDesc = waypoint.legAltitudeDescription;
            if (this._firstApproachWaypointConstraint && waypoint == this._firstApproachWaypointConstraint) { // FIRST APPROACH WAYPOINT WITH CONSTRAINT
                if (altDesc == 4) {
                    this._vnavTargetAltitude = waypoint.legAltitude2;
                }
                else {
                    this._vnavTargetAltitude = waypoint.legAltitude1;
                }
                this._vnavTargetDistance = (waypoint === this._activeWaypoint) ? this._activeWaypointDist : waypoint.cumulativeDistanceInFP - this._currentDistanceInFP;
                this._topOfDescent = ((this._altitude - this._vnavTargetAltitude) / (Math.tan(this._desiredFPA * (Math.PI / 180)))) / 6076.12;
                this._vnavTargetWaypoint = waypoint;
            }
            else if (altDesc == 1 && waypoint.legAltitude1 > 0) { //AT CASE
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
        this._newPath = true;
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
        this._altitude = SimVar.GetSimVarValue("PLANE ALTITUDE", "Feet");
        this._currentFlightSegment = this._fpm.getSegmentFromWaypoint(this._activeWaypoint);
        this._currentDistanceInFP = this._activeWaypoint.cumulativeDistanceInFP - this._activeWaypointDist;
        this._topOfDescent = ((this._altitude - this._vnavTargetAltitude) / (Math.tan(this._desiredFPA * (Math.PI / 180)))) / 6076.12;
        this._valuesUpdated = true;
    }

    /**
    * Set the constraint altitude.
    */
    setConstraintAltitude() {
        //SET CURRENT CONSTRAINT ALTITUDE SIMVAR -- This only needs to run when active waypoint changes
        if (this._valuesUpdated === false) {
            this.updateValues();
        }
        let constraint = false;
        if (this._vnavConstraintAltitude && this._vnavConstraintWaypoint) {
            if (this._vnavConstraintWaypoint.cumulativeDistanceInFP - (this._activeWaypoint.cumulativeDistanceInFP - this._activeWaypointDist) < 20) {
                let selectedAltitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:1", "feet");
                if (this._vnavConstraintType == "above" && selectedAltitude < this._vnavConstraintAltitude) {
                    SimVar.SetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "number", Math.round(this._vnavConstraintAltitude));
                    constraint = true;
                }
                else if (this._vnavConstraintType == "below" && selectedAltitude > this._vnavConstraintAltitude) {
                    SimVar.SetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "number", Math.round(this._vnavConstraintAltitude));
                    constraint = true;
                }
            }
        }
        if (constraint === false) {
            SimVar.SetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "number", 0);
        }
    }

    setTodWaypoint(calculate = true) {
        if (calculate === true) {
            let todDistanceFromDest = this._destination.cumulativeDistanceInFP - this._vnavTargetWaypoint.cumulativeDistanceInFP + this._topOfDescent;
            let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            let timeToTod = todDistanceFromDest / (groundSpeed / 3600);
            SimVar.SetSimVarValue("L:WT_CJ4_TOD_DISTANCE", "number", todDistanceFromDest);
            SimVar.SetSimVarValue("L:WT_CJ4_TOD_SECONDS", "number", timeToTod);
        }
        else {
            SimVar.SetSimVarValue("L:WT_CJ4_TOD_DISTANCE", "number", 0);
            SimVar.SetSimVarValue("L:WT_CJ4_TOD_SECONDS", "number", -1);
        }
    }

    writeDatastoreValues() {
        const vnavValues = {
            vnavTargetAltitude: this._vnavTargetAltitude,
            vnavTargetDistance: this._vnavTargetDistance,
            topOfDescent: this._topOfDescent,
            distanceToTod: this._distanceToTod
        };
        WTDataStore.set('CJ4_vnavValues', JSON.stringify(vnavValues));
    }

    writeMonitorValues() {
        if (this._vnavTargetWaypoint) {
            WTDataStore.set('CJ4_vnavTargetWaypoint', this._vnavTargetWaypoint.ident);
        }
    }

    buildGlidepath() {
        const approach = this._fpm.getApproachWaypoints();

        if (approach.length > 0) {
            const lastApproachWaypoint = approach[approach.length - 1];

            if (lastApproachWaypoint.isRunway) {
                this._vnavTargetDistance = Avionics.Utils.computeGreatCircleDistance(lastApproachWaypoint.infos.coordinates, this._currPos);
                this._vnavTargetAltitude = lastApproachWaypoint.legAltitude1;

                this._vnavTargetWaypoint = lastApproachWaypoint;
                this._topOfDescent = ((this._altitude - this._vnavTargetAltitude) / (Math.tan(this._desiredFPA * (Math.PI / 180)))) / 6076.12;

                this._vnavTargetChanged = true;
            }
        }
    }
}

