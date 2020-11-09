class WT_BaseAutopilot {
    constructor(fpm) {
        this._fpm = fpm;

        this._destination = undefined;
        this._destinationDistance = undefined;
        this._activeWaypoint = undefined;
        this._activeWaypointDist = undefined;
        this._currentDistanceInFP = undefined;
        this._lastActiveWaypointIdent = undefined;
        this._lastDestinationIdent = undefined;

        //COMPONENTS TO REFRESH ONLY WHEN THERE IS A FLIGHT PLAN CHANGE
        this._desiredFPA = WTDataStore.get('CJ4_vpa', 3);
        this._vnavType = false;
        this._waypoints = [];

        this._currPos = undefined;
        this._groundSpeed = undefined;
        this._apCurrentVerticalSpeed = undefined;
        this._altitude = undefined;
    }

    /**
     * Run on first activation.
     */
    activate() {

    }

    /**
     * Update data if needed.
     */
    update() {
        this._currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
        this._groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
        //this._apCurrentAltitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "Feet");
        this._apCurrentVerticalSpeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "Feet/minute");
        this._altitude = SimVar.GetSimVarValue("PLANE ALTITUDE", "Feet");

        this._activeWaypoint = this._fpm.getActiveWaypoint();

        // TODO detect if activewaypoint is changed and update
        // TODO detect if destination is changed and update

        //DESTINATION DATA
        if (this._fpm.getDestination()) {
            this._destination = this._fpm.getDestination();
            this._destinationIdent = this._destination.ident;
            this._vnavType = "destination";
        }

        //FLIGHT PLAN DATA
        if (this._destination && this._fpm.getWaypoints()) {
            if (this._waypoints.length > 0) {
                this._vnavType = "route";
            }
        }        
        this._waypoints = this._waypoints.slice(this._fpm.getActiveWaypointIndex());

        if (this._activeWaypoint) {
            this._activeWaypointDist = Avionics.Utils.computeDistance(this._currPos, this._activeWaypoint.infos.coordinates);
            this._currentDistanceInFP = this._activeWaypoint.cumulativeDistanceInFP - this._activeWaypointDist;
            this._destinationDistance = this._destination.cumulativeDistanceInFP - this._currentDistanceInFP;
        }
        else {
            this._destinationDistance = Avionics.Utils.computeDistance(this._currPos, this._destination.infos.coordinates);
            this._currentDistanceInFP = this._destination.cumulativeDistanceInFP - this._destinationDistance;
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
}