class WT_VModeAutopilot extends WT_BaseAutopilot {
    constructor(fpm) {
        super(fpm);

        this._vnavTargetWaypoint = undefined;
        this._vnavTargetAltitude = undefined;
        this._constraintWaypoints = undefined;
        this._vModeAutopilotPhase = undefined;
    }

    /**
     * Run on first activation.
     */
    activate() {
        super.activate();
    }

    /**
     * Update data if needed.
     */
    update() {
        super.update();
        this._vModeAutopilotPhase = this._currentFlightSegment === SegmentType.Departure ? "departure"
            : this._currentFlightSegment === SegmentType.Enroute || this._currentFlightSegment === SegmentType.Arrival || this._currentFlightSegment === SegmentType.Approach ? "arrival"
            : undefined;

        //DEPARTURE PLAN - ONLY WHEN ACTIVE WAYPOINT HAS CHANGED OR ON FIRST RUN
        if (this._activeWaypoint.ident != this._lastActiveWaypointIdent && phase === "departure") {
            this._constraintWaypoints = this._fpm.getDepartureWaypoints().slice(this._fpm.getActiveWaypointIndex());
            this._vnavTargetWaypoint = undefined;
            if (this._constraintWaypoints.length > 0) {
                for (let i = 0; i < this._constraintWaypoints.length; i++) {
                    let waypoint = this._constraintWaypoints[i];
                    if (waypoint.altDesc === 1 && waypoint.altitude1 > this._altitude) { //AT CASE
                        this._vnavTargetAltitude = waypoint.altitude1;
                        this._vnavTargetWaypoint = waypoint;
                        break;
                    }
                    else if (waypoint.altDesc === 3 && waypoint.altitude1 > this._altitude) { //AT CASE
                        this._vnavTargetAltitude = waypoint.altitude1;
                        this._vnavTargetWaypoint = waypoint;
                        break;
                    }
                    else if (waypoint.altDesc === 4 && waypoint.altitude1 > this._altitude) { //AT CASE
                        this._vnavTargetAltitude = waypoint.altitude1;
                        this._vnavTargetWaypoint = waypoint;
                        break;
                    }
                }
            }
        }

        //ARRIVAL PLAN - ONLY WHEN ACTIVE WAYPOINT HAS CHANGED OR ON FIRST RUN
        else if (this._activeWaypoint.ident != this._lastActiveWaypointIdent && phase === "arrival") {
            this._constraintWaypoints = this.waypoints;
            this._vnavTargetWaypoint = undefined;
            if (this._constraintWaypoints.length > 0) {
                for (let i = 0; i < this._constraintWaypoints.length; i++) {
                    let waypoint = this._constraintWaypoints[i];
                    if (waypoint.altDesc === 1 && waypoint.altitude1 < this._altitude) { //AT CASE
                        this._vnavTargetAltitude = waypoint.altitude1;
                        this._vnavTargetWaypoint = waypoint;
                        break;
                    }
                    else if (waypoint.altDesc === 2 && waypoint.altitude1 < this._altitude) { //AT CASE
                        this._vnavTargetAltitude = waypoint.altitude1;
                        this._vnavTargetWaypoint = waypoint;
                        break;
                    }
                    else if (waypoint.altDesc === 4 && waypoint.altitude2 < this._altitude) { //AT CASE
                        this._vnavTargetAltitude = waypoint.altitude2;
                        this._vnavTargetWaypoint = waypoint;
                        break;
                    }
                }
            }
        }
    }

    /**
     * Execute.
     */
    execute() {
        super.execute();

        //SET ALTITUDE TARGETS
        if (this._vModeAutopilotPhase != undefined && this._vnavTargetWaypoint) {
            Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, this._vnavTargetAltitude);
            SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
            SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 1);
        } else {
            this.deactivate();
        }
    }

    /**
     * Run when deactivated.
     */
    deactivate() {
        super.deactivate();
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
    }
}