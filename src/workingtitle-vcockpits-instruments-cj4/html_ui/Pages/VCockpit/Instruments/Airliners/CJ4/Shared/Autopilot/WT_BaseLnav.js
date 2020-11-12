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

        if (this._fpm.getAllWaypoints() && this.waypoints.length > 0 && this._activeWaypoint && this._previousWaypoint) {

            this._planePos = new LatLon(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LAT", "degree longitude"));

            //LNAV CAN RUN, UPDATE DATA
            this._groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            this._activeWaypointDist = Avionics.Utils.computeGreatCircleDistance(new LatLong(this._planePos.lat, this._planePos.lon), this._activeWaypoint.infos.coordinates);
            this._previousWaypointDist = Avionics.Utils.computeGreatCircleDistance(new LatLong(this._planePos.lat, this._planePos.lon), this._previousWaypoint.infos.coordinates);
            this._bearingToWaypoint = Avionics.Utils.computeGreatCircleHeading(new LatLong(this._planePos.lat, this._planePos.lon), this._activeWaypoint.infos.coordinates);

            const prevWptPos = new LatLon(this._previousWaypoint.infos.coordinates.lat, this._previousWaypoint.infos.coordinates.lon);
            const nextWptPos = new LatLon(this._activeWaypoint.infos.coordinates.lat, this._activeWaypoint.infos.coordinates.lon);
            let xtk = planePos.crossTrackDistanceTo(prevWptPos, nextWptPos) * (0.000539957); //meters to NM conversion
            let dtk = Avionics.Utils.computeGreatCircleHeading(this._previousWaypoint.infos.coordinates, this._activeWaypoint.infos.coordinates);

            let nextActiveWaypoint = this._fpm.getNextActiveWaypoint();

            SimVar.SetSimVarValue("L:WT_CJ4_XTK", "number", this._xtk);
            SimVar.SetSimVarValue("L:WT_CJ4_DTK", "number", this._dtk);
            SimVar.SetSimVarValue("L:WT_CJ4_WPT_DISTANCE", "number", this._activeWaypointDist);

            let currWindDirection = Math.trunc(SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degrees"));
            let currWindSpeed = Math.trunc(SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots"));
            let currCrosswind = Math.trunc(currWindSpeed * (Math.sin((track * Math.PI / 180) - (currWindDirection * Math.PI / 180))));
            let windCorrection = 180 * Math.asin(currCrosswind / groundSpeed) / Math.PI;
            
            let setHeading = dtk;

            let interceptAngle = Math.min(Math.pow(xtk * 20, 1.1), 45);

    
            if (xtk >= 1) {
                setHeading = dtk + windCorrection - 30 < 0 ? dtk + windCorrection - 330
                    : dtk + windCorrection - 30;
            }
            else if (xtk <= -1) {
                setHeading = dtk + windCorrection + 30 > 360 ? dtk + windCorrection - 330
                    : dtk + windCorrection + 30;
            }
            else if (1 > xtk && xtk > 0.5) {
                setHeading = dtk + windCorrection - 20 < 0 ? dtk + windCorrection - 340
                    : dtk + windCorrection - 20;
            }
            else if (-1 < xtk && xtk < -0.5) {
                setHeading = dtk + windCorrection + 20 > 360 ? dtk + windCorrection - 340
                    : dtk + windCorrection + 20;
            }
            else if (0.5 >= xtk && xtk > 0.2) {
                setHeading = dtk + windCorrection - 10 < 0 ? dtk + windCorrection - 350
                    : dtk + windCorrection - 10;
            }
            else if (-0.5 <= xtk && xtk < -0.2) {
                setHeading = dtk + windCorrection + 10 > 360 ? dtk + windCorrection - 350
                    : dtk + windCorrection + 10;
            }
            else if (0.2 >= xtk && xtk > 0) {
                setHeading = dtk + windCorrection - 5 < 0 ? dtk + windCorrection - 355
                    : dtk + windCorrection - 5;
            }
            else if (-0.2 <= xtk && xtk < 0) {
                setHeading = dtk + windCorrection + 5 > 360 ? dtk + windCorrection - 355
                    : dtk + windCorrection + 5;
            }
            else if (xtk = 0) {
                setHeading = dtk + windCorrection;
            }

            SimVar.SetSimVarValue('K:HEADING_BUG_SET', 'degrees', setHeading.toFixed(0));
           
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

