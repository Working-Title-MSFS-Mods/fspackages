class WT_BaseLnav {
    constructor(fpm) {
        this._fpm = fpm;

        this._flightPlanVersion = undefined;
        this._activeWaypointChanged = true;
        this._activeWaypointChangedflightPlanChanged = true;

        this._activeWaypoint = undefined;
        this._previousWaypoint = undefined;

        this._planePos = undefined;
        this._groundSpeed = undefined;
        this._activeWaypointDist = undefined;
        this._previousWaypointDist = undefined;
        this._bearingToWaypoint = undefined;
        this._xtk = undefined;
        this._dtk = undefined;
    }

    get waypoints() {
        return this._fpm.getAllWaypoints().slice(this._fpm.getActiveWaypointIndex());
    }

    /**
     * Run on first activation.
     */
    activate() {
        this.update();
    }

    /**
     * Update data if needed.
     */
    update() {
        //CAN LNAV EVEN RUN?
        this._activeWaypoint = this._fpm.getActiveWaypoint();
        this._previousWaypoint = this._fpm.getPreviousActiveWaypoint();

        if (this.waypoints.length > 0 && this._activeWaypoint && this._previousWaypoint) {

            this._planePos = new LatLon(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));

            //LNAV CAN RUN, UPDATE DATA
            this._groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            this._activeWaypointDist = Avionics.Utils.computeGreatCircleDistance(new LatLong(this._planePos.lat, this._planePos.lon), this._activeWaypoint.infos.coordinates);
            this._previousWaypointDist = Avionics.Utils.computeGreatCircleDistance(new LatLong(this._planePos.lat, this._planePos.lon), this._previousWaypoint.infos.coordinates);
            this._bearingToWaypoint = Avionics.Utils.computeGreatCircleHeading(new LatLong(this._planePos.lat, this._planePos.lon), this._activeWaypoint.infos.coordinates);

            const prevWptPos = new LatLon(this._previousWaypoint.infos.coordinates.lat, this._previousWaypoint.infos.coordinates.long);
            const nextWptPos = new LatLon(this._activeWaypoint.infos.coordinates.lat, this._activeWaypoint.infos.coordinates.long);
            this._xtk = this._planePos.crossTrackDistanceTo(prevWptPos, nextWptPos) * (0.000539957); //meters to NM conversion
            this._dtk = Avionics.Utils.computeGreatCircleHeading(this._previousWaypoint.infos.coordinates, this._activeWaypoint.infos.coordinates);

            let nextActiveWaypoint = this._fpm.getNextActiveWaypoint();

            SimVar.SetSimVarValue("L:WT_CJ4_XTK", "number", this._xtk).catch(console.log);
            SimVar.SetSimVarValue("L:WT_CJ4_DTK", "number", this._dtk).catch(console.log);
            SimVar.SetSimVarValue("L:WT_CJ4_WPT_DISTANCE", "number", this._activeWaypointDist).catch(console.log);

            let currWindDirection = Math.trunc(SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degrees"));
            let currWindSpeed = Math.trunc(SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots"));
            let currCrosswind = Math.trunc(currWindSpeed * (Math.sin((this._xtk * Math.PI / 180) - (currWindDirection * Math.PI / 180))));
            let windCorrection = 180 * Math.asin(currCrosswind / this._groundSpeed) / Math.PI;
           
            let setHeading = this._dtk;

            let interceptAngle = this._xtk < 0 ? Math.min(Math.pow(Math.abs(this._xtk) * 20, 1.1), 45)
                : -1 * Math.min(Math.pow(Math.abs(this._xtk) * 20, 1.1), 45);
            
            let deltaAngle = ((((this._dtk - this._bearingToWaypoint) % 360) + 360) % 360) > 180 ? 360 - ((((this._dtk - this._bearingToWaypoint) % 360) + 360) % 360)
                : ((((this._dtk - this._bearingToWaypoint) % 360) + 360) % 360);

            setHeading = (((this._dtk + interceptAngle + windCorrection) % 360) + 360) % 360;

            //CASE WHERE WE ARE PASSED THE WAYPOINT AND SHOULD SEQUENCE THE NEXT WPT
            if (Math.abs(deltaAngle) >= 90) {
                setHeading = this._dtk;
                this._fpm.setActiveWaypointIndex(this._fpm.getActiveWaypointIndex() + 1);
                this.update();
            }
            //CASE WHERE INTERCEPT ANGLE IS NOT BIG ENOUGH AND INTERCEPT NEEDS TO BE SET TO BEARING
            else if (Math.abs(deltaAngle) > Math.abs(interceptAngle)) {
                setHeading = (((this._bearingToWaypoint + windCorrection) % 360) + 360) % 360;
            }

            //TURN ANTICIPATION
            let turnRadius = Math.pow(this._groundSpeed / 60, 2) / 9;
            if (this._activeWaypoint && nextActiveWaypoint && this._activeWaypointDist <= turnRadius && this._groundSpeed < 700) {
                let fromHeading = this._dtk;
                let toHeading = Avionics.Utils.computeGreatCircleHeading(this._activeWaypoint.infos.coordinates, nextActiveWaypoint.infos.coordinates);
                while (fromHeading >= 180) {
                    fromHeading -= 360;
                }
                while (toHeading >= 180) {
                    toHeading -= 360;
                }
                let turnAngle = toHeading - fromHeading;
                while (turnAngle >= 180) {
                    turnAngle -= 360;
                }
                let absTurnAngle = Math.abs(turnAngle);
                let activateDistance = Math.min(turnRadius * Math.tan((absTurnAngle / 2) * (Math.PI / 180)), turnRadius);
                if (this._activeWaypointDist <= activateDistance) {
                    setHeading += turnAngle;
                    this.flightPlanManager.setActiveWaypointIndex(this.flightPlanManager.getActiveWaypointIndex() + 1);
                    this.update();
                }
            }

            Coherent.call("HEADING_BUG_SET", 2, setHeading).catch(console.log);
        }
        else {
            //Coherent.call("HEADING_BUG_SET", 1, Simplane.getHeadingMagnetic());
            SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
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

