class WT_VNavPathAutopilot extends WT_BaseAutopilot {
    constructor(fpm) {
        super(fpm);

        //VNAV SETUP
        this._vnavTargetDistance = undefined;
        this._topOfDescent = undefined;
        this._vnavTargetWaypoint = undefined;
        this._vnavTargetAltitude = undefined;
        this._lastVnavTargetAltitude = undefined;
        this._interceptingLastAltitude = false;

        this._desiredVerticalSpeed = undefined;
        this._desiredAltitude = undefined;
        this._altDeviation = undefined;
        this._distanceToTod = "N/A";
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
        let destinationElevation = this._destination.infos.oneWayRunways[0].elevation * 3.28;
        this._vnavTargetAltitude = destinationElevation + 1500;

        if (this._vnavType == "destination" && this._lastDestinationIdent != this._destination.ident) {
            this._vnavTargetDistance = this._destinationDistance - 10;
            this._topOfDescent = 10 + ((this._altitude - this._vnavTargetAltitude) / (Math.tan(this._desiredFPA * (Math.PI / 180)))) / 6076.12;
            this._vnavTargetWaypoint = this._destination;
            this._lastDestinationIdent = this._destination.ident;
        }
        //LOAD ROUTE VNAV ONLY WHEN ACTIVE WAYPOINT HAS CHANGED OR ON FIRST RUN
        else if (this._vnavType == "route" && this._waypoints && this._activeWaypoint && this._activeWaypoint.ident != this._lastActiveWaypointIdent) {
            this.buildDescentProfile();
        }

        //UPDATE DEFAULT DESTINATION VNAV WHEN DESTINATION HAS NOT CHANGED
        else if (this._vnavType == "destination") {
            this.vnavTargetDistance = this._destinationDistance - 10;
            this.topOfDescent = 10 + ((this._altitude - this._vnavTargetAltitude) / (Math.tan(this._desiredFPA * (Math.PI / 180)))) / 6076.12;
        }

        //UPDATE ROUTE VNAV WHEN ACTIVE WAYPOINT HAS NOT CHANGED
        else if (this._vnavType == "route" && this._activeWaypoint) {

            //UPDATE
            this._vnavTargetDistance = (this._vnavTargetWaypoint === this._activeWaypoint) ? this._activeWaypointDist : this._vnavTargetWaypoint.cumulativeDistanceInFP - this._currentDistanceInFP;
            this._topOfDescent = ((this._altitude - this._vnavTargetAltitude) / (Math.tan(this._desiredFPA * (Math.PI / 180)))) / 6076.12;
        }

        //PREPARE VNAV VARIABLES
        this._desiredVerticalSpeed = -101.2686667 * this._groundSpeed * Math.tan(this._desiredFPA * (Math.PI / 180));
        this._desiredAltitude = this._vnavTargetAltitude + (Math.tan(this._desiredFPA * (Math.PI / 180)) * this._vnavTargetDistance * 6076.12);
        this._altDeviation = this._altitude - this._desiredAltitude;
        this._distanceToTod = this._topOfDescent < 0 ? "N/A" : this._vnavTargetDistance > this._topOfDescent ? Math.round(this._vnavTargetDistance - this._topOfDescent) : "N/A";
    }

    /**
     * Execute.
     */
    execute() {
        super.execute();
        let setVerticalSpeed = 0;

        //SET BEHAVIOR IF INTERCEPTING TARGET ALTITUDE & SET AP TARGET ALTITUDE
        if (this.__lastVnavTargetAltitude !== undefined && this.__lastVnavTargetAltitude != this._vnavTargetAltitude && this._vnavTargetDistance > this._topOfDescent && this._altitude > this.__lastVnavTargetAltitude) {
            setVerticalSpeed = this._desiredVerticalSpeed;
            Coherent.call("AP_ALT_VAR_SET_ENGLISH", 0, this.__lastVnavTargetAltitude, true);
            this._interceptingLastAltitude = true;
        }
        else {
            this.__lastVnavTargetAltitude = this._vnavTargetAltitude;
            this._interceptingLastAltitude = false;
            if (this._distanceToTod <= 0 || this._distanceToTod == "N/A") {
                Coherent.call("AP_ALT_VAR_SET_ENGLISH", 0, this._vnavTargetAltitude, true);
            }
        }

        //SET VS FOR VNAV PATH
        if (this.__interceptingLastAltitude === false) {
            if ((this._vnavTargetDistance - this._topOfDescent) > 0.5 || this._altitude < this._vnavTargetAltitude) {
                setVerticalSpeed = 0;
            }
            else if (this._vnavTargetDistance < 1 && this._vnavTargetDistance > 0) {
                setVerticalSpeed = this._desiredVerticalSpeed;
            }
            else {
                if (this._altDeviation >= 500) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 1.5;
                }
                else if (this._altDeviation <= -500) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 0;
                }
                else if (this._altDeviation >= 400) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 1.4;
                }
                else if (this._altDeviation <= -400) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 0;
                }
                else if (this._altDeviation >= 300) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 1.3;
                }
                else if (this._altDeviation <= -300) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 0.25;
                }
                else if (this._altDeviation >= 200) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 1.2;
                }
                else if (this._altDeviation <= -200) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 0.5;
                }
                else if (this._altDeviation >= 100) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 1.1;
                }
                else if (this._altDeviation <= -100) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 0.8;
                }
                else if (this._altDeviation >= 20) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 1.05;
                }
                else if (this._altDeviation <= -20) {
                    setVerticalSpeed = this._desiredVerticalSpeed * 0.9;
                }
                else {
                    setVerticalSpeed = this._desiredVerticalSpeed;
                }
            }
            //setVerticalSpeed = Math.round(setVerticalSpeed);
            Coherent.call("AP_VS_VAR_SET_ENGLISH", 0, setVerticalSpeed);
        }
    }

    /**
     * Run when deactivated.
     */
    deactivate() {
        super.deactivate();

    }

    buildDescentProfile() {
        this._vnavTargetAltitude = this._vnavTargetAltitude === undefined ? this._destination.infos.oneWayRunways[0].elevation * 3.28 : this._vnavTargetAltitude;

        //PLAN DESCENT PROFILE
        for (let i = this._waypoints.length - 1; i >= 0; i--) {
            const waypoint = this._waypoints[i];
            let legAltitudeDescription = waypoint.legAltitudeDescription;
            if (legAltitudeDescription == 1 && waypoint.legAltitude1 > 1000) { //AT CASE
                this._vnavTargetAltitude = waypoint.legAltitude1;
                this._vnavTargetDistance = (waypoint === this._activeWaypoint) ? this._activeWaypointDist : waypoint.cumulativeDistanceInFP - this._currentDistanceInFP;
                this._topOfDescent = ((this._altitude - this._vnavTargetAltitude) / (Math.tan(this._desiredFPA * (Math.PI / 180)))) / 6076.12;
            }
            else if (legAltitudeDescription == 2 && waypoint.legAltitude1 > 1000) { //ABOVE CASE
                let vnavTargetAltitudeAtWaypoint = this.getVNavTargetAltitudeAtWaypoint(waypoint);
                if (vnavTargetAltitudeAtWaypoint < waypoint.legAltitude1) {
                    this.processWaypoint(waypoint);

                }
            }
            else if (legAltitudeDescription == 3 && waypoint.legAltitude1 > 1000) { //BELOW CASE
                let vnavTargetAltitudeAtWaypoint = this.getVNavTargetAltitudeAtWaypoint(waypoint);
                if (vnavTargetAltitudeAtWaypoint > waypoint.legAltitude1) {
                    this.processWaypoint(waypoint);

                }
            }
            else if (legAltitudeDescription == 4 && waypoint.legAltitude1 > 1000) { //ABOVE AND BELOW CASE
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