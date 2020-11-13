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

        this._activeWptIndex = this._fmc.flightPlanManager.getActiveWaypointIndex();
        this._distanceToActiveWpt = "0";

        this._lsk6Field = "";

        this._wayPointsToRender = [];

        this.prepare();
    }

    prepare() {
        // Noop as there is no preparation with this
        this.update(true);
    }

    update(forceUpdate = false) {
        // check if active wpt changed
        // TODO: possible that i renders twice as we change index while editing, could cut that out too
        const actWptIndex = this._fmc.flightPlanManager.getActiveWaypointIndex();
        if (this._activeWptIndex != actWptIndex) {
            this._activeWptIndex = actWptIndex;
            this._isDirty = true;
        }

        // get and format distance
        let distanceToActWpt = this._fmc.flightPlanManager.getDistanceToActiveWaypoint();
        if (distanceToActWpt !== this._distanceToActiveWpt) {
            this._distanceToActiveWpt = distanceToActWpt;
            this._isDirty = true;
        }

        if (this._isDirty || forceUpdate) {
            this.invalidate();
        }

        // register refresh and bind to update which will only render on changes
        this._fmc.registerPeriodicPageRefresh(() => {
            this.update();
            return true;
        }, 1000, false);
    }

    updateLegs() {
        this._rows = [
            [""], [""], [""], [""], [""], [""], [""], [""], [""], [""]
        ];

        let offset = Math.floor((this._currentPage - 1) * 5);
        let allWaypoints = this._fmc.flightPlanManager.getAllWaypoints();
        this._wayPointsToRender = this.buildLegs(allWaypoints, this._activeWptIndex);

        this._pageCount = Math.floor((this._wayPointsToRender.length - 1) / 5) + 1;
        for (let i = 0; i < 5; i++) {

            let waypoint = this._wayPointsToRender[i + offset];
            if (waypoint && waypoint.fix && waypoint.fix.icao === "$EMPTY") {
                this._rows[2 * i + 1] = ["-----"];
            }
            else if (waypoint && waypoint.fix) {
                let bearing = isFinite(waypoint.fix.bearingInFP) ? waypoint.fix.bearingInFP.toFixed(0).padStart(3, "0") + "°" : "";
                let prevWaypoint = this._wayPointsToRender[i + offset - 1];
                let distance = 0;
                let isFromWpt = (i == 0 && this._currentPage == 1);
                let isActWpt = (i == 1 && this._currentPage == 1);
                if (isActWpt) {
                    distance = this._distanceToActiveWpt;
                }
                else if (prevWaypoint && prevWaypoint.fix.infos && waypoint.fix.infos) {
                    distance = Math.trunc(Avionics.Utils.computeDistance(prevWaypoint.fix.infos.coordinates, waypoint.fix.infos.coordinates));
                }

                // format distance
                distance = (distance < 100) ? distance.toFixed(1) : distance.toFixed(0);

                if (isFromWpt) {
                    if (this._fmc.flightPlanManager.getIsDirectTo()) {
                        this._rows[2 * i + 1] = ["(DIR)[blue]"];
                    } else {
                        this._rows[2 * i + 1] = [waypoint.fix.ident != "" ? waypoint.fix.ident + "[blue]" : "USR[blue]"];
                    }
                }
                else if (isActWpt) {
                    this._rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM[magenta]"];
                    this._rows[2 * i + 1] = [waypoint.fix.ident != "" ? waypoint.fix.ident + "[magenta]" : "USR[magenta]"];
                }
                else {
                    if (waypoint.fix.icao === '$DISCO') {
                        this._rows[2 * i] = [" THEN"];
                        this._rows[2 * i + 1] = ["□□□□□ - DISCONTINUITY -"];
                    }
                    else {
                        this._rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM"];
                        this._rows[2 * i + 1] = [waypoint.fix.ident != "" ? waypoint.fix.ident : "USR"];
                    }               
                }

                if (!isFromWpt && waypoint.fix.icao !== '$DISCO') {
                    this._rows[2 * i + 1][1] = this.getAltSpeedRestriction(waypoint.fix);
                }
            }

        }
    }

    render() {
        // console.log("RENDER LEGS");

        this._lsk6Field = "";
        if (this._fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            this._fmc.fpHasChanged = true;
            this._lsk6Field = "<CANCEL MOD";
        }

        let modStr = this._fmc.fpHasChanged ? "MOD[white]" : "ACT[blue]";

        this._fmc._templateRenderer.setTemplateRaw([
            [" " + modStr + " LEGS[blue]", this._currentPage.toFixed(0) + "/" + Math.max(1, this._pageCount.toFixed(0)) + " [blue]"],
            ...this._rows,
            ["-------------------------[blue]"],
            [this._lsk6Field + "", "LEG WIND>"]
        ]);
    }

    buildLegs(waypoints, activeWaypointIndex) {
        const displayWaypoints = [];
        for (var i = Math.max(0, activeWaypointIndex - 1); i < waypoints.length; i++) {
            displayWaypoints.push({index: i, fix: waypoints[i]});

            if (waypoints[i].endsInDiscontinuity) {
                displayWaypoints.push({index: i, fix: {icao: "$DISCO"}});
            }
        }

        displayWaypoints.push({index: -1, fix: {icao: "$EMPTY"}});
        return displayWaypoints;
    }

    bindInputs() {
        for (let i = 0; i < this._wayPointsToRender.length; i++) {
            // ENROUTE
            this._fmc.onLeftInput[i] = () => {
                let offset = Math.floor((this._currentPage - 1) * 5);
                let waypoint = this._wayPointsToRender[i + offset];

                if (!waypoint) return;

                if (waypoint.fix.ident === "USR") {
                    this._fmc.showErrorMessage("UNABLE MOD USR");
                    return;
                }

                let value = this._fmc.inOut;
                let selectedWpIndex = this._currentPage == 1 ? this._fmc.flightPlanManager.getActiveWaypointIndex() + i - 1
                    : (this._currentPage - 1) * 5 + this._fmc.flightPlanManager.getActiveWaypointIndex() + i - 1;

                // Can't mod first blue line
                // TODO this should be possible later to set it as FROM for intercept TO
                if (i == 0 && this._currentPage == 1) {
                    this._fmc.showErrorMessage("UNABLE MOD FROM WPT");
                    return;
                }

                // Mode evaluation
                if (value == "")
                    this._fmc.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NONE;
                else if (value === FMCMainDisplay.clrValue)
                    this._fmc.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.DELETE;
                else if (value.length > 0 && this._fmc.selectMode !== CJ4_FMC_LegsPage.SELECT_MODE.EXISTING)
                    this._fmc.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NEW;

                // only allow insert new on add line
                if (waypoint.fix === "$EMPTY" && this._fmc.selectMode !== CJ4_FMC_LegsPage.SELECT_MODE.NEW) return;

                switch (this._fmc.selectMode) {
                    case CJ4_FMC_LegsPage.SELECT_MODE.NONE: {
                        // CANT SELECT MAGENTA OR BLUE ON PAGE 1
                        if (((i > 1 && this._currentPage == 1) || (this._currentPage > 1))) {
                            // SELECT EXISTING WAYPOINT FROM FLIGHT PLAN
                            this._approachWaypoints = this._fmc.flightPlanManager.getApproachWaypoints();
                            if (this._approachWaypoints.length > 0) {
                                if (waypoint.fix.ident === this._approachWaypoints[this._approachWaypoints.length - 1].ident) {
                                    this._fmc.showErrorMessage("UNABLE MOD RW");
                                    return;
                                }
                            }

                            this._fmc.selectedWaypoint = waypoint.fix;
                            this._fmc.inOut = waypoint.fix.ident;
                            this._fmc.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.EXISTING;
                        }
                        break;
                    }
                    case CJ4_FMC_LegsPage.SELECT_MODE.EXISTING: {
                        if ((i >= 1 && this._currentPage == 1) || this._currentPage > 1) {

                            this._fmc.setMsg("Working...");
                            let waypoints = this._fmc.flightPlanManager.getWaypoints();
                            let targedIndexInFpln = waypoints.findIndex(w => {
                                return w.icao === this._fmc.selectedWaypoint.icao;
                            });
                            // MOVE EXISTING WAYPOINT WITH LEGS AFTER
                            let x = selectedWpIndex;
                            let isDirectTo = (i == 1 && this._currentPage == 1);

                            if (isDirectTo) { // DIRECT TO
                                // this._fmc.ensureCurrentFlightPlanIsTemporary(() => {
                                this._fmc.flightPlanManager.activateDirectTo(this._fmc.selectedWaypoint.icao, () => {
                                    this.resetAfterOp();
                                    // });
                                });
                            }
                            else { // MOVE TO POSITION IN FPLN
                                let removeWaypointForLegsMethod = (callback = EmptyCallback.Void) => {
                                    if (x < targedIndexInFpln) {
                                        this._fmc.flightPlanManager.removeWaypoint(x, false, () => {
                                            targedIndexInFpln--;
                                            removeWaypointForLegsMethod(callback);
                                        });
                                    }
                                    else {
                                        callback();
                                    }
                                };
                                this._fmc.ensureCurrentFlightPlanIsTemporary(() => {
                                    removeWaypointForLegsMethod(() => {
                                        this.resetAfterOp();
                                    });
                                });
                            }
                        }
                        break;
                    }
                    case CJ4_FMC_LegsPage.SELECT_MODE.NEW: {
                        if ((i >= 1 && this._currentPage == 1) || this._currentPage > 1) {
                            this._fmc.setMsg("Working...");
                            this._fmc.insertWaypoint(value, selectedWpIndex, (isSuccess) => {
                                if (isSuccess) {
                                    let isDirectTo = (i == 1 && this._currentPage == 1);
                                    if (isDirectTo) {
                                        let wp = this._fmc.flightPlanManager.getWaypoint(selectedWpIndex);
                                        this._fmc.activateDirectToWaypoint(wp, () => {
                                            this.resetAfterOp();
                                        });
                                    } else
                                        this.resetAfterOp();
                                } else {
                                    this._fmc.fpHasChanged = false;
                                    this._fmc.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NONE;
                                    this._fmc.eraseTemporaryFlightPlan();
                                }
                            });
                        }
                        break;
                    }
                    case CJ4_FMC_LegsPage.SELECT_MODE.DELETE: {
                        // DELETE WAYPOINT
                        if ((i > 1 && this._currentPage == 1) || this._currentPage > 1) {
                            this._fmc.setMsg("Working...");
                            this._fmc.ensureCurrentFlightPlanIsTemporary(() => {
                                this._fmc.flightPlanManager.removeWaypoint(selectedWpIndex, false, () => {
                                    this.resetAfterOp();
                                });
                            });
                        }
                        else {
                            this._fmc.showErrorMessage("UNABLE MOD FROM WPT");
                        }
                        break;
                    }
                }
            };
        }
    }

    resetAfterOp() {
        this._fmc.clearUserInput();
        this._fmc.setMsg();
        this._fmc.selectedWaypoint = undefined;
        this._fmc.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NONE;
        this.update(true);
    }

    bindEvents() {
        this._fmc.onLeftInput[5] = () => {
            if (this._lsk6Field == "<CANCEL MOD") {
                if (this._fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                    this._fmc.fpHasChanged = false;
                    this._fmc.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NONE;
                    this._fmc.eraseTemporaryFlightPlan(() => { this.resetAfterOp(); });
                }
            }
        };

        // EXEC
        this._fmc.onExecPage = () => {
            if (this._fmc.fpHasChanged) {
                this._fmc.fpHasChanged = false;
                this._fmc.activateRoute(() => {
                    this._fmc.activatingDirectTo = false;
                    this._fmc.refreshPageCallback = () => { this.resetAfterOp(); }; // TODO this seems annoying, but this is how stuff works in cj4_fmc right now
                    this._fmc.onExecDefault();
                });
            }
        };

        this._fmc.onPrevPage = () => {
            if (this._currentPage > 1) {
                this._currentPage--;
                this.update(true);
            }
        };
        this._fmc.onNextPage = () => {
            if (this._currentPage < this._pageCount) {
                this._currentPage++;
                this.update(true);
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
        let speedConstraint = "---";
        let altitudeConstraint = "----- ";
        let wpt = waypoint;

        // if (wpt.speedConstraint && wpt.speedConstraint > 100) {
        //     speedConstraint = wpt.speedConstraint;
        // }
        if (wpt.legAltitudeDescription > 0) {
            if (wpt.legAltitudeDescription == 1) {
                altitudeConstraint = wpt.legAltitude1.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude1.toFixed(0) / 100
                    : wpt.legAltitude1.toFixed(0);
            }
            else if (wpt.legAltitudeDescription == 2) {
                altitudeConstraint = wpt.legAltitude1.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude1.toFixed(0) / 100 + "A"
                    : wpt.legAltitude1.toFixed(0) + "A";
            }
            else if (wpt.legAltitudeDescription == 3) {
                altitudeConstraint = wpt.legAltitude1.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude1.toFixed(0) / 100 + "B"
                    : wpt.legAltitude1.toFixed(0) + "B";
            }
            else if (wpt.legAltitudeDescription == 4) {
                let altitudeConstraintA = wpt.legAltitude2.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude2.toFixed(0) / 100 + "A"
                    : wpt.legAltitude2.toFixed(0) + "A";
                let altitudeConstraintB = wpt.legAltitude1.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude1.toFixed(0) / 100 + "B"
                    : wpt.legAltitude1.toFixed(0) + "B";
                altitudeConstraint = altitudeConstraintB + altitudeConstraintA;
            }

        }
        altitudeConstraint = altitudeConstraint.padStart(6, " ");

        return speedConstraint + "/" + altitudeConstraint + "[green]";
    }

    static ShowPage1(fmc) {
        // console.log("SHOW LEGS PAGE 1");
        fmc.clearDisplay();

        // create page instance and init 
        LegsPageInstance = new CJ4_FMC_LegsPage(fmc);
        LegsPageInstance.update();
    }

}


CJ4_FMC_LegsPage.SELECT_MODE = {
    NONE: "NONE",
    EXISTING: "EXISTING",
    NEW: "NEW",
    DELETE: "DELETE"
};
CJ4_FMC_LegsPage.DEBUG_SHOW_WAYPOINT_PHASE = false;
//# sourceMappingURL=CJ4_FMC_LegsPage.js.map