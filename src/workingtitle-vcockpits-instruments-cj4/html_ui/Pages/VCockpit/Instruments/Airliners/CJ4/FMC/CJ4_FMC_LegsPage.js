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
        this._activatingDirectTo = false;

        this._activeWptIndex = this._fmc.flightPlanManager.getActiveWaypointIndex();

        this._lsk6Field = "";

        this._wayPointsToRender = [];

        this._selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NONE;
    }

    prepare() {
        // Noop as there is no preparation with this
    }

    update() {
        // check if active wpt changed
        const actWptIndex = this._fmc.flightPlanManager.getActiveWaypointIndex();
        if (this._activeWptIndex != actWptIndex) {
            this._activeWptIndex = actWptIndex;
            this._isDirty = true;
        }

        // TODO notice when approach gets activated and render dirty
        if (this._isDirty) {
            this.invalidate();
        }
    }

    updateLegs() {
        this._rows = [
            [""], [""], [""], [""], [""], [""], [""], [""], [""], [""]
        ];

        let offset = Math.floor((this._currentPage - 1) * 5);

        let allWaypoints = [];
        let enrouteWaypoints = [...this._fmc.flightPlanManager.getWaypoints()];
        enrouteWaypoints.pop();

        // ENROUTE
        if (this._fmc.flightPlanManager.getWaypoints() && !this._fmc.flightPlanManager.isActiveApproach()) {
            // get enroute waypoints

            if (this._fmc.flightPlanManager.getApproachWaypoints()) {
                let approachWaypoints = [...this._fmc.flightPlanManager.getApproachWaypoints()];
                allWaypoints = enrouteWaypoints.concat(approachWaypoints);
            }
            else {
                allWaypoints = enrouteWaypoints;
            }
            if (this._activeWptIndex <= 1) {
                this._wayPointsToRender = allWaypoints;
            }
            else if (this._activeWptIndex > 1) {
                this._wayPointsToRender = allWaypoints.splice(this._activeWptIndex - 1);
            }
            // TODO render "----" line to add waypoints at the end
        }
        // APPROACH
        else if (this._fmc.flightPlanManager.isActiveApproach()) {
            // get index of last wp
            let lastWaypointIndex = enrouteWaypoints.length - 1;
            // see if there are approach waypoints already loaded and add them

            // TODO i wonder if this reducing of the enroute waypoints is needed, shouldn't that be reflected in the stored flight plan?
            // if so, the whole if for approach can go i guess
            if (this._fmc.flightPlanManager.getApproachWaypoints()) {
                let approachWaypoints = [...this._fmc.flightPlanManager.getApproachWaypoints()];
                let lastEnrouteWaypoint = enrouteWaypoints.slice(lastWaypointIndex);
                allWaypoints = lastEnrouteWaypoint.concat(approachWaypoints);
            }

            // on first wp show em all
            if (this._activeWptIndex == 1) {
                this._wayPointsToRender = allWaypoints;
            }
            // skip previous legs
            else if (this._activeWptIndex > 1) {
                this._wayPointsToRender = allWaypoints.splice(0, this._activeWptIndex - 1);
            }
        }

        this._pageCount = Math.floor((this._wayPointsToRender.length - 1) / 5) + 1;
        for (let i = 0; i < 5; i++) {
            let waypoint = this._wayPointsToRender[i + offset];
            if (waypoint) {
                let bearing = isFinite(waypoint.bearingInFP) ? waypoint.bearingInFP.toFixed(0).padStart(3, "0") + "°" : "";
                let prevWaypoint = this._wayPointsToRender[i + offset - 1];
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

        }
    }

    render() {
        console.log("RENDER LEGS");

        this._lsk6Field = "";
        if (this._fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            this._fmc.fpHasChanged = true;
            this._lsk6Field = "<CANCEL MOD";
        }

        let modStr = this._fmc.fpHasChanged ? "MOD[white]" : "ACT[blue]";

        this._fmc._templateRenderer.setTemplateRaw([
            [" " + modStr + " LEGS[blue]", this._currentPage.toFixed(0) + "/" + Math.max(1, this._pageCount.toFixed(0)) + " [blue]"],
            ...this._rows,
            ["-------------------------"],
            [this._lsk6Field + "", "LEG WIND>"]
        ]);
    }

    bindInputs() {
        for (let i = 0; i < this._wayPointsToRender.length; i++) {
            // ENROUTE
            this._fmc.onLeftInput[i] = () => {
                let offset = Math.floor((this._currentPage - 1) * 5);
                let waypoint = this._wayPointsToRender[i + offset];

                let value = this._fmc.inOut;
                let fpIndex = this._currentPage == 1 ? this._fmc.flightPlanManager.getActiveWaypointIndex() + i - 1
                    : (this._currentPage - 1) * 5 + this._fmc.flightPlanManager.getActiveWaypointIndex() + i - 1;

                // Can't mod first blue line
                // TODO this should be possible later to set it as FROM for intercept TO
                if (i == 0 && this._currentPage == 1) {
                    this._fmc.showErrorMessage("UNABLE MOD FROM WPT");
                }

                // Mode evaluation
                if (value == "")
                    this._selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NONE;
                else if (value.length > 0 && this._selectMode !== CJ4_FMC_LegsPage.SELECT_MODE.EXISTING)
                    this._selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NEW;

                if (!this._fmc.flightPlanManager.isActiveApproach()) {

                    switch (this._selectMode) {
                        case CJ4_FMC_LegsPage.SELECT_MODE.NONE:
                            // CANT SELECT MAGENTA OR BLUE ON PAGE 1
                            if (((i > 1 && this._currentPage == 1) || (this._currentPage > 1))) {
                                if (value === FMCMainDisplay.clrValue) {
                                    // DELETE WAYPOINT
                                    this._fmc.clearUserInput();
                                    this._fmc.removeWaypoint(fpIndex, () => {
                                        this._fmc.setMsg();
                                        this.invalidate();
                                    });
                                } else {
                                    // SELECT EXISTING WAYPOINT FROM FLIGHT PLAN
                                    this._directWaypoint = waypoint;
                                    this._fmc.inOut = waypoint.ident;
                                    this._selectMode = CJ4_FMC_LegsPage.SELECT_MODE.EXISTING;
                                }
                            }
                            break;
                        case CJ4_FMC_LegsPage.SELECT_MODE.EXISTING: {
                            let waypoints = this._fmc.flightPlanManager.getWaypoints();
                            let indexInFlightPlan = waypoints.findIndex(w => {
                                return w.icao === this._directWaypoint.icao;
                            });
                            // MOVE EXISTING WAYPOINT WITH LEGS AFTER
                            let removeWaypointForLegsMethod = (callback = EmptyCallback.Void) => {
                                i = fpIndex;
                                if (i < indexInFlightPlan) {
                                    this._fmc.flightPlanManager.removeWaypoint(1, i === indexInFlightPlan - 1, () => {
                                        i++;
                                        indexInFlightPlan--;
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
                                this._fmc.flightPlanManager.setActiveWaypointIndex(indexInFlightPlan + 1, () => {
                                    this._directWaypoint = undefined;
                                    this.invalidate(); // TODO do we need to refresh?
                                });
                            });
                            break;
                        }
                        case CJ4_FMC_LegsPage.SELECT_MODE.NEW:
                            if (!this._fmc.flightPlanManager.isActiveApproach() && i == 1 && this._currentPage == 1 && value != FMCMainDisplay.clrValue) { //ELSE IF 2: CASE FOR INSERTING A DIRECT TO WAYPOINT FROM THE SCRATCHPAD
                                this._fmc.setMsg("Working...");
                                if (value.length > 0) {
                                    this._fmc.clearUserInput();
                                    this._fmc.insertWaypoint(value, fpIndex + 1, () => {
                                        this._fmc.flightPlanManager.removeWaypoint(1, true, () => {
                                            this._fmc.flightPlanManager.setActiveWaypointIndex(1, () => {
                                                this._fmc._activatingDirectTo = false;
                                                this._fmc.setMsg();
                                                this._selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NONE;
                                                this.invalidate();
                                            });
                                        });
                                    });
                                }
                            } else if (value.length > 0) {
                                this._fmc.clearUserInput();
                                this._fmc.insertWaypoint(value, fpIndex, () => {
                                    this._fmc.setMsg();
                                    this._selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NONE;
                                    this.invalidate();
                                });
                            }
                            break;
                    }
                } else {
                    // APPROACH
                    this._fmc.onLeftInput[i] = () => {
                        this._fmc.showErrorMessage("UNABLE IN APPROACH MODE");
                    };
                }
            };

            // EXEC
            this._fmc.onExecPage = () => {
                if (this._fmc.fpHasChanged) {
                    this._fmc.setMsg("");
                    this._fmc.fpHasChanged = false;
                    this._fmc._activatingDirectTo = false;
                    this._fmc._directWaypoint = "";
                    this._selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NONE;
                    this._fmc.activateRoute(() => {
                        this._fmc.onExecDefault();
                        this.invalidate(); // TODO need refresh?
                    });
                }
            };
        }
    }

    bindEvents() {
        this._fmc.onLeftInput[5] = () => {
            if (this._lsk6Field == "<CANCEL MOD") {
                if (this._fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                    this._fmc.fpHasChanged = false;
                    this._selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NONE;
                    this._fmc.eraseTemporaryFlightPlan(() => { this.invalidate(); });
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
        this._fmc.clearDisplay();
        this.updateLegs();
        this.render();
        this.bindInputs(); // TODO ideally this should only be called once, but clearDisplay clears everthing
        this.bindEvents(); // TODO     ""
        this._isDirty = false;
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
        LegsPageInstance.invalidate();

        // register refresh and bind to update which will only render on changes
        fmc.registerPeriodicPageRefresh(() => {
            LegsPageInstance.update();
        }, 1000, false);
    }

}


CJ4_FMC_LegsPage.SELECT_MODE = {
    NONE: "None",
    EXISTING: "Existing",
    NEW: "NEW"
};
CJ4_FMC_LegsPage.DEBUG_SHOW_WAYPOINT_PHASE = false;
//# sourceMappingURL=CJ4_FMC_LegsPage.js.map