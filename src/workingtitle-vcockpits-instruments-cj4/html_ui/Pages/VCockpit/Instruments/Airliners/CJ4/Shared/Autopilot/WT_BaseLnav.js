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
            let windCorrection = 180 * Math.asin(currCrosswind / this._) / Math.PI;
            
            let setHeading = this._dtk;

            let interceptAngle = Math.min(Math.pow(this._xtk * 20, 1.1), 45);

    
            if (this._xtk >= 1) {
                setHeading = this._dtk + windCorrection - 30 < 0 ? this._dtk + windCorrection - 330
                    : this._dtk + windCorrection - 30;
            }
            else if (this._xtk <= -1) {
                setHeading = this._dtk + windCorrection + 30 > 360 ? this._dtk + windCorrection - 330
                    : this._dtk + windCorrection + 30;
            }
            else if (1 > this._xtk && this._xtk > 0.5) {
                setHeading = this._dtk + windCorrection - 20 < 0 ? this._dtk + windCorrection - 340
                    : this._dtk + windCorrection - 20;
            }
            else if (-1 < this._xtk && this._xtk < -0.5) {
                setHeading = this._dtk + windCorrection + 20 > 360 ? this._dtk + windCorrection - 340
                    : this._dtk + windCorrection + 20;
            }
            else if (0.5 >= this._xtk && this._xtk > 0.2) {
                setHeading = this._dtk + windCorrection - 10 < 0 ? this._dtk + windCorrection - 350
                    : this._dtk + windCorrection - 10;
            }
            else if (-0.5 <= this._xtk && this._xtk < -0.2) {
                setHeading = this._dtk + windCorrection + 10 > 360 ? this._dtk + windCorrection - 350
                    : this._dtk + windCorrection + 10;
            }
            else if (0.2 >= this._xtk && this._xtk > 0) {
                setHeading = this._dtk + windCorrection - 5 < 0 ? this._dtk + windCorrection - 355
                    : this._dtk + windCorrection - 5;
            }
            else if (-0.2 <= this._xtk && this._xtk < 0) {
                setHeading = this._dtk + windCorrection + 5 > 360 ? this._dtk + windCorrection - 355
                    : this._dtk + windCorrection + 5;
            }
            else if (this._xtk == 0) {
                setHeading = this._dtk + windCorrection;
            }

            SimVar.SetSimVarValue('K:HEADING_BUG_SET', 'degrees', setHeading).catch(console.log);
           
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

