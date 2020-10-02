// prototype singleton, this needs to be different ofc
let LegsPageInstance = undefined;

// TODO OVERALL
// Because the page has a state now, we need to watch out to reset vars like activatingDirectTo etc after it is processed

class CJ4_FMC_LegsPage {
    constructor(fmc) {
        this._fmc = fmc;
        this._isDirty = true; // render on first run ofc

        this._currentPage = 1;
        this._pageCount = 1;
        this._rows = [];

        this._directWaypoint = undefined;
        this._activatingDirectTo = true;
        this._activatingDirectToExisting = true;

        this._targetWaypointIndex = -1;
        this._activeWptIndex = this._fmc.flightPlanManager.getActiveWaypointIndex();

        this._lsk6Field = "";
    }

    prepare() {
        console.log("PREPARE LEGS");      

        // return if nothing changed
        if (!this._isDirty) return;

        // TODO not sure if this should be after render or here :thinking:
        this._isDirty = false;

        // TODO what is this
        // if (_directWaypoint && this._fmc.fpHasChanged == false) {
        //     this._fmc.inOut = _directWaypoint.ident;
        // }

        this._rows = [
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ];
        let offset = Math.floor((this._currentPage - 1) * 5);

        let allWaypoints = [];
        let waypointsToRender = [];

        // ENROUTE
        if (this._fmc.flightPlanManager.getWaypoints() && !this._fmc.flightPlanManager.isActiveApproach()) {
            let enrouteWaypoints = [...this._fmc.flightPlanManager.getWaypoints()];
            if (this._fmc.flightPlanManager.getApproachWaypoints()) {
                let approachWaypoints = [...this._fmc.flightPlanManager.getApproachWaypoints()];
                enrouteWaypoints.pop();
                allWaypoints = enrouteWaypoints.concat(approachWaypoints);
            }
            else {
                allWaypoints = enrouteWaypoints;
            }
            if (this._activeWptIndex <= 1) {
                waypointsToRender = allWaypoints;
            }
            else if (this._activeWptIndex > 1) {
                waypointsToRender = allWaypoints.splice(this._activeWptIndex - 1);
            }
            this._pageCount = Math.floor((waypointsToRender.length - 1) / 5) + 1;
            for (let i = 0; i < 5; i++) {
                let waypoint = waypointsToRender[i + offset];
                if (waypoint) {
                    let bearing = isFinite(waypoint.bearingInFP) ? waypoint.bearingInFP.toFixed(0).padStart(3, "0") + "°" : "";
                    let prevWaypoint = waypointsToRender[i + offset - 1];
                    let distance = "0";
                    if (prevWaypoint) {
                        distance = "" + Math.trunc(Avionics.Utils.computeDistance(prevWaypoint.infos.coordinates, waypoint.infos.coordinates));
                    }
                    if (i == 0 && this._currentPage == 1) {
                        //this._rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM"];
                        this._rows[2 * i + 1] = [waypoint.ident != "" ? waypoint.ident + "[blue]" : "USR[blue]"];
                    }
                    else if (i == 1 && this._currentPage == 1) {
                        this._rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM[magenta]"];
                        this._rows[2 * i + 1] = [waypoint.ident != "" ? waypoint.ident + "[magenta]" : "USR[magenta]"];
                    }
                    else {
                        this._rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM"];
                        this._rows[2 * i + 1] = [waypoint.ident != "" ? waypoint.ident : "USR"];
                    }

                    this._rows[2 * i + 1][1] = this.getAltSpeedRestriction(waypoint);
                }
                this._fmc.onLeftInput[i] = () => {
                    this._fmc.setMsg("Working...");
                    let value = this._fmc.inOut;
                    let fpIndex = this._currentPage == 1 ? this._fmc.flightPlanManager.getActiveWaypointIndex() + i - 1
                        : (this._currentPage - 1) * 5 + this._fmc.flightPlanManager.getActiveWaypointIndex() + i - 1;
                    console.log("index " + fpIndex);
                    console.log("_activatingDirectToExisting: " + this._fmc._activatingDirectToExisting);
                    console.log("this._directWaypoint: " + this._directWaypoint);
                    console.log("i: " + i);
                    console.log("this._currentPage: " + this._currentPage);
                    console.log(" this._targetWaypointIndex: " +  this._targetWaypointIndex);

                    // Can't mod first blue line
                    if (i == 0 && this._currentPage == 1) {
                        this._fmc.showErrorMessage("UNABLE MOD FROM WPT");
                        // CJ4_FMC_LegsPage.ShowPage1(fmc); // TODO, need refresh?
                    }
                    else if (value == "" && ((i > 1 && this._currentPage == 1) || (this._currentPage > 1))) { //IF: CASE FOR SELECTING AN EXISTING WAYPOINT TO INSERT AS A DIRECT TO
                        console.log("if");
                        this._directWaypoint = waypoint;
                        this._fmc._activatingDirectTo = true;
                        this._fmc._activatingDirectToExisting = true;
                        this._fmc.inOut = waypoint.ident;
                        this._targetWaypointIndex = fpIndex;
                        // CJ4_FMC_LegsPage.ShowPage1(fmc, 1, directWaypoint, fpIndex); // TODO need refresh?
                    }
                    else if (this._fmc._activatingDirectToExisting == true && i == 1 && this._currentPage == 1) { //ELSE IF 1: CASE FOR DELETING WAYPOINTS PRIOR TO THE SELECTED EXISTING WAYPOINT 
                        console.log("else if 1 _activatingDirectToExisting");
                        let removeWaypointForLegsMethod = (callback = EmptyCallback.Void) => {
                            i = 1;
                            if (i <  this._targetWaypointIndex) {
                                //console.log(" this._targetWaypointIndex: " +  this._targetWaypointIndex)
                                this._fmc.flightPlanManager.removeWaypoint(1, i ===  this._targetWaypointIndex - 1, () => {
                                    i++;
                                     this._targetWaypointIndex =  this._targetWaypointIndex - 1
                                    removeWaypointForLegsMethod(callback);
                                });
                            }
                            else {
                                console.log("removeWaypointForLegsMethod callback");
                                callback();
                            }
                        };
                        this._fmc.clearUserInput();
                        removeWaypointForLegsMethod(() => {
                            console.log("setActiveWaypointIndex");
                            this._fmc.flightPlanManager.setActiveWaypointIndex(1, () => {
                                console.log("getactivewaypointindex: " + this._fmc.flightPlanManager.getActiveWaypointIndex());
                                this._fmc.activateRoute(() => {
                                    console.log("activateRoute");
                                    this._fmc._activatingDirectToExisting = false;
                                     this._targetWaypointIndex = undefined;
                                    //directWaypoint = undefined;
                                    this.invalidate(); // TODO do we need to refresh?
                                });
                            });
                        });
                    }
                    else if (!this._fmc.flightPlanManager.isActiveApproach() && i == 1 && this._currentPage == 1 && value != FMCMainDisplay.clrValue) { //ELSE IF 2: CASE FOR INSERTING A DIRECT TO WAYPOINT FROM THE SCRATCHPAD
                        console.log("else if 2");
                        console.log("value " + value);
                        if (value.length > 0) {
                            this._fmc.clearUserInput();
                            this._fmc.insertWaypoint(value, fpIndex + 1, () => {
                                this._fmc.flightPlanManager.removeWaypoint(1, true, () => {
                                    this._fmc.flightPlanManager.setActiveWaypointIndex(1, () => {
                                        this._fmc.activateRoute(() => {
                                            this._fmc._activatingDirectTo = true;
                                            this._fmc.setMsg();
                                            this.invalidate();
                                        });
                                    });
                                });
                            });
                        }
                    }
                    else if (!this._fmc.flightPlanManager.isActiveApproach()) { //ELSE IF 3: CASE FOR DELETING OR ADDING A WAYPOINT OTHER THAN INDEX 1
                        console.log("else if 3");
                        if (value === FMCMainDisplay.clrValue) {
                            this._fmc.clearUserInput();
                            this._fmc.removeWaypoint(fpIndex, () => {
                                this._fmc.setMsg();
                                this.invalidate();
                            });
                        } else if (value.length > 0) {
                            this._fmc.clearUserInput();
                            this._fmc.insertWaypoint(value, fpIndex, () => {
                                this._fmc.setMsg();
                                this.invalidate();
                            });
                        }
                    }
                    else { //ELSE
                        this._fmc.showErrorMessage("UNABLE");
                        // CJ4_FMC_LegsPage.ShowPage1(fmc, this._currentPage); // TODO need refresh?
                    }
                };
                if (this._fmc._activatingDirectTo == true) {
                    this._fmc.onExecPage = () => {
                        this._fmc.refreshPageCallback = () => {
                            this._fmc.setMsg("");
                            this._fmc.fpHasChanged = false;
                            this._fmc._activatingDirectTo = false;
                            this._fmc._activatingDirectToExisting = false;
                            // CJ4_FMC_LegsPage.ShowPage1(fmc); // TODO need refresh?
                        };
                        let toWaypoint = this._fmc.flightPlanManager.getWaypoint(1);
                        this._fmc.activateDirectToWaypoint(toWaypoint, () => {
                            this._fmc.flightPlanManager.setActiveWaypointIndex(1, () => {
                                this._fmc.activateRoute(() => {
                                    this._fmc.onExecDefault();
                                })
                            });
                        });
                    }
                }
                else {
                    this._fmc.onExecPage = () => {
                        if (this._fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                            if (!this._fmc.getIsRouteActivated()) {
                                this._fmc.activateRoute();
                            }
                            this._fmc.onExecDefault();
                            this._fmc.refreshPageCallback = () => CJ4_FMC_RoutePage.ShowPage1(this._fmc);
                        } else {
                            this._fmc._isRouteActivated = false;
                            this._fmc.fpHasChanged = false;
                            this._fmc.setMsg();
                            this._fmc._activatingDirectTo = false;
                            this._fmc._activatingDirectToExisting = false;
                        }
                    };
                }
            }
        }
        // APPROACH
        else if (this._fmc.flightPlanManager.isActiveApproach()) {
            // get enroute waypoints
            let enrouteWaypoints = [...this._fmc.flightPlanManager.getWaypoints()];
            // remove destination
            enrouteWaypoints.pop();
            // get index of last wp
            let lastWaypointIndex = enrouteWaypoints.length - 1;
            // see if there are approach waypoints already loaded and add them
            if (this._fmc.flightPlanManager.getApproachWaypoints()) {
                let approachWaypoints = [...this._fmc.flightPlanManager.getApproachWaypoints()];
                let lastEnrouteWaypoint = enrouteWaypoints.slice(lastWaypointIndex);
                allWaypoints = lastEnrouteWaypoint.concat(approachWaypoints);
            }

            // on first wp show em all
            if (this._activeWptIndex == 1) {
                waypointsToRender = allWaypoints;
            }
            // skip previous legs
            else if (this._activeWptIndex > 1) {
                waypointsToRender = allWaypoints.splice(0, this._activeWptIndex - 1);
            }

            this._pageCount = Math.floor((waypointsToRender.length - 1) / 5) + 1;
            for (let i = 0; i < 5; i++) {
                let waypoint = waypointsToRender[i + offset];
                if (waypoint) {
                    let bearing = isFinite(waypoint.bearingInFP) ? waypoint.bearingInFP.toFixed(0).padStart(3, "0") + "°" : "";
                    let prevWaypoint = waypointsToRender[i + offset - 1];
                    let distance = "0";
                    if (prevWaypoint) {
                        distance = "" + Math.trunc(Avionics.Utils.computeDistance(prevWaypoint.infos.coordinates, waypoint.infos.coordinates));
                    }
                    if (i == 0 && this._currentPage == 1) {
                        //this._rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM"];
                        this._rows[2 * i + 1] = [waypoint.ident != "" ? waypoint.ident + "[blue]" : "USR[blue]"];
                    }
                    else if (i == 1 && this._currentPage == 1) {
                        this._rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM[magenta]"];
                        this._rows[2 * i + 1] = [waypoint.ident != "" ? waypoint.ident + "[magenta]" : "USR[magenta]"];
                    }
                    else {
                        this._rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM"];
                        this._rows[2 * i + 1] = [waypoint.ident != "" ? waypoint.ident : "USR"];
                    }

                    this._rows[2 * i + 1][1] = this.getAltSpeedRestriction(waypoint);
                }
                this._fmc.onLeftInput[i] = () => {
                    this._fmc.showErrorMessage("UNABLE IN APPROACH MODE");
                };
            }
        }
    }

    start() {
        // TODO on a non refreshing page we would just call render once
        // in this case we initiate the periodic refresh
        this._fmc.clearDisplay();
        this.bindEvents();
        this.prepare();
        this.render();
    }

    update() {
        // check if active wpt changed
        const actWptIndex = this._fmc.flightPlanManager.getActiveWaypointIndex()
        if (this._activeWptIndex != actWptIndex) {
            this._activeWptIndex = actWptIndex;
            this._isDirty = true;
        }

        // TODO notice when approach gets activated and render dirty

        if (this._isDirty) {
            this._fmc.clearDisplay();
            this.bindEvents(); // TODO this and cleardisplay i don't wanna do everytime, but i need to figure out the loss of events
            this.prepare();
            this.render();
        }
    }

    render() {
        console.log("RENDER LEGS");

        this._lsk6Field = "";
        if (this._fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            this._fmc.fpHasChanged = true;
            this._lsk6Field = "<CANCEL MOD"
        }

        let modStr = this._fmc.fpHasChanged ? "MOD[white]" : "ACT[blue]";

        this._fmc._templateRenderer.setTemplateRaw([
            [" " + modStr + " LEGS[blue]", this._currentPage.toFixed(0) + "/" + Math.max(1, this._pageCount.toFixed(0)) + " [blue]"],
            ...this._rows,
            ["-------------------------"],
            [this._lsk6Field + "", "LEG WIND>"]
        ]);
    }

    bindEvents() {
        this._fmc.onLeftInput[5] = () => {
            if (this._lsk6Field == "<CANCEL MOD") {
                if (this._fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                    this._fmc.fpHasChanged = false;
                    this._fmc.eraseTemporaryFlightPlan(() => { this.prepare() });
                }
            }
        };

        this._fmc.onPrevPage = () => {
            if (this._currentPage > 1) {
                this._currentPage--;
                this.invalidate();
            }
        };
        this._fmc.onNextPage = () => {
            if (this._currentPage < this._pageCount) {
                this._currentPage++;
                this.invalidate();
            }
        };
    }

    // TODO, later this could be in the base class
    invalidate() {
        this._isDirty = true;
        this.prepare();
        this.render();
    }
    
    getAltSpeedRestriction(waypoint) {
        let speedConstraint = "";
        let altitudeConstraint = "FL";

        if (waypoint.speedConstraint && waypoint.speedConstraint > 100) {
            speedConstraint = waypoint.speedConstraint;
        }

        if (waypoint.legAltitudeDescription && waypoint.legAltitudeDescription !== 0) {
            if (waypoint.legAltitudeDescription === 2 && waypoint.legAltitude1 > 100) {
                altitudeConstraint = waypoint.legAltitude1.toFixed(0) > 18000 ? "FL" + waypoint.legAltitude1.toFixed(0) / 100 + "A"
                    : waypoint.legAltitude1.toFixed(0) + "A";
            }
            else if (waypoint.legAltitudeDescription === 3 && waypoint.legAltitude1 > 100) {
                altitudeConstraint = waypoint.legAltitude1.toFixed(0) > 18000 ? "FL" + waypoint.legAltitude1.toFixed(0) / 100 + "B"
                    : waypoint.legAltitude1.toFixed(0) + "B";
            }
            else if (waypoint.legAltitudeDescription === 4 && waypoint.legAltitude1 > 100) {
                let altitudeConstraintA = waypoint.legAltitude1.toFixed(0) > 18000 ? "FL" + waypoint.legAltitude1.toFixed(0) / 100 + "A"
                    : waypoint.legAltitude1.toFixed(0) + "A";
                let altitudeConstraintB = waypoint.legAltitude2.toFixed(0) > 18000 ? "FL" + waypoint.legAltitude2.toFixed(0) / 100 + "B"
                    : waypoint.legAltitude2.toFixed(0) + "B";
                altitudeConstraint = altitudeConstraintA + "/" + altitudeConstraintB;
            }
            else {
                altitudeConstraint = "FL" + this._fmc.cruiseFlightLevel;
            }
        }
        else {
            altitudeConstraint = "FL" + this._fmc.cruiseFlightLevel;
        }
        return speedConstraint + "/" + altitudeConstraint;
    }

    static ShowPage1(fmc) {
        console.log("SHOW LEGS PAGE 1");
        fmc.clearDisplay();

        // create page instance and init 
        LegsPageInstance = new CJ4_FMC_LegsPage(fmc);
        LegsPageInstance.start();

        // register refresh and bind to update which will only render on changes
        fmc.registerPeriodicPageRefresh(() => {
            LegsPageInstance.update();
        }, 1000, false);
    }

}

CJ4_FMC_LegsPage.DEBUG_SHOW_WAYPOINT_PHASE = false;
//# sourceMappingURL=CJ4_FMC_LegsPage.js.map