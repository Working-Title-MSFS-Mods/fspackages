// prototype singleton, this needs to be different ofc
let LegsPageInstance = undefined;

// TODO OVERALL
// Because the page has a state now, we need to watch out to reset vars like activatingDirectTo etc after it is processed

class CJ4_FMC_LegsPage {

    constructor(fmc, isAddingHold) {
        this._fmc = fmc;
        this._isDirty = true; // render on first run ofc
        this._isAddingHold = isAddingHold;

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
        let flightplanFPA = WTDataStore.get('CJ4_vpa', 3);
        let runwayIndex = undefined;
        let gpAngle = SimVar.GetSimVarValue("L:WT_CJ4_GP_ANGLE", "number") > 0 ? SimVar.GetSimVarValue("L:WT_CJ4_GP_ANGLE", "number") : 0;
        console.log("gpAngle legs page: " + gpAngle);
        const inhibitSequence = SimVar.GetSimVarValue("L:WT_CJ4_INHIBIT_SEQUENCE", "number") == 1;
        const inhibitText = inhibitSequence ? "AUTO[s-text white]" + "/[white]" + "INHIBIT[green]" : "AUTO[green]" + "/[white]" + "INHIBIT[s-text white]";

        //FIND RUNWAY INDEX
        console.log("_wayPointsToRender.length: " + this._wayPointsToRender.length);
        if (allWaypoints.length > 1 && allWaypoints[allWaypoints.length - 2].isRunway) {
            runwayIndex = this._wayPointsToRender.length - 2;
            console.log("runway found: " + runwayIndex);
        }

        this._pageCount = Math.floor((this._wayPointsToRender.length - 1) / 5) + 1;
        for (let i = 0; i < 5; i++) {

            let waypoint = this._wayPointsToRender[i + offset];
            //GET FPA
            let segment = undefined;
            if (waypoint && waypoint.fix && (waypoint.fix.icao != "$EMPTY" || waypoint.fix.icao != "$DISCO")) {
                segment = this._fmc.flightPlanManager.getSegmentFromWaypoint(waypoint.fix);
            }
            let waypointFPA = 0;
            if (segment && (segment.type == SegmentType.Arrival || segment.type == SegmentType.Approach) && waypoint.fix.legAltitudeDescription > 0) {
                waypointFPA = flightplanFPA;
            }
            if (runwayIndex) {
                if (i + offset == runwayIndex) {
                    waypointFPA = gpAngle > 0 ? gpAngle : flightplanFPA;
                }
                if ((i + offset == runwayIndex - 1 || i + offset == runwayIndex - 2) && waypoint.fix.legAltitudeDescription == 0) {
                    waypointFPA = gpAngle > 0 ? gpAngle : flightplanFPA;
                }
            }
            //EXISTING ->
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
                    distance = Avionics.Utils.computeGreatCircleDistance(prevWaypoint.fix.infos.coordinates, waypoint.fix.infos.coordinates);
                }

                // format distance
                distance = (distance < 100) ? distance.toFixed(1) : distance.toFixed(0);
                const fpaText = waypointFPA > 0 ? "  " + waypointFPA.toFixed(1) + "°[green]" : "";

                if (isFromWpt) {
                    if (this._fmc.flightPlanManager.getIsDirectTo()) {
                        this._rows[2 * i + 1][0] = "(DIR)[blue]";
                        this._rows[2 * i][1] = "SEQUENCE [s-text blue]";
                        this._rows[2 * i + 1][1] = inhibitText;
                    } else {
                        this._rows[2 * i + 1][0] = waypoint.fix.ident != "" ? waypoint.fix.ident + "[blue]" : "USR[blue]";
                        this._rows[2 * i][1] = "SEQUENCE [s-text blue]";
                        this._rows[2 * i + 1][1] = inhibitText;
                    }
                }
                else if (isActWpt) {
                    if (waypoint.fix.icao === '$DISCO') {
                        this._rows[2 * i] = [" THEN[magenta]"];
                        this._rows[2 * i + 1] = ["□□□□□ - DISCONTINUITY -[magenta]"];
                    }
                    else if (waypoint.fix.isHold) {
                        this._rows[2 * i] = [" HOLD AT[magenta]"];
                        this._rows[2 * i + 1] = [`${waypoint.fix.ident != "" ? waypoint.fix.ident : "USR"}[magenta]`];
                    }
                    else {
                        this._rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM[magenta]" + fpaText];
                        this._rows[2 * i + 1] = [waypoint.fix.ident != "" ? waypoint.fix.ident + "[magenta]" : "USR[magenta]"];
                    }
                }
                else {
                    if (waypoint.fix.icao === '$DISCO') {
                        this._rows[2 * i] = [" THEN"];
                        this._rows[2 * i + 1] = ["□□□□□ - DISCONTINUITY -"];
                    }
                    else if (waypoint.fix.isHold) {
                        this._rows[2 * i] = [" HOLD AT"];
                        this._rows[2 * i + 1] = [waypoint.fix.ident != "" ? waypoint.fix.ident : "USR"];
                    }
                    else {
                        this._rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM[shite]" + fpaText];
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
        let holdActive = false;
        let holdExiting = false;

        const holdsDirector = this._fmc._lnav && this._fmc._lnav._holdsDirector;

        if (holdsDirector) {
            const holdIndex = this._fmc.flightPlanManager.getActiveWaypointIndex() - 1;
            holdActive = holdsDirector.isHoldActive(holdIndex);
            holdExiting = holdsDirector.isHoldExiting(holdIndex);
        }

        this._fmc._templateRenderer.setTemplateRaw([
            [" " + modStr + " LEGS[blue]", this._currentPage.toFixed(0) + "/" + Math.max(1, this._pageCount.toFixed(0)) + " [blue]"],
            ...this._rows,
            [`${this._isAddingHold ? '---------HOLD AT--------' : holdExiting ? '-------EXIT ARMED-------' : '------------------------'}[blue]`],
            [`${this._isAddingHold ? '□□□□□' : holdExiting ? '<CANCEL EXIT' : holdActive ? '<EXIT HOLD' : this._lsk6Field}`, "LEG WIND>"]
        ]);
    }

    buildLegs(waypoints, activeWaypointIndex) {
        const displayWaypoints = [];
        let runwayExists = false;
        let runwayIndex = 0;

        let holdActive = false;
        const holdsDirector = this._fmc._lnav && this._fmc._lnav._holdsDirector;

        if (holdsDirector) {
            const holdIndex = this._fmc.flightPlanManager.getActiveWaypointIndex() - 1;
            holdActive = holdsDirector.isHoldActive(holdIndex);
        }



        for (var i = Math.max(0, activeWaypointIndex - 1); i < waypoints.length; i++) {

            if (waypoints[i].isRunway && this._fmc.flightPlanManager.getSegmentFromWaypoint(waypoints[i]).type == SegmentType.Approach) {
                runwayExists = true;
                runwayIndex = i;
            }
            if (runwayExists && i == runwayIndex + 1) {
                console.log("skipping destination waypoint");
            } else {
                displayWaypoints.push({ index: i, fix: waypoints[i] });
                if (holdActive || (waypoints[i].hasHold && i > activeWaypointIndex - 1)) {
                    displayWaypoints.push({index: i, fix: {ident: waypoints[i].ident, infos: waypoints[i].infos, isHold: true}});
                }

                if (waypoints[i].endsInDiscontinuity) {
                    displayWaypoints.push({ index: i, fix: { icao: "$DISCO", isRemovable: waypoints[i].isVectors !== true } });
                }
            }
        }

        displayWaypoints.push({ index: -1, fix: { icao: "$EMPTY" } });
        return displayWaypoints;
    }

    bindInputs() {
        for (let i = 0; i < this._wayPointsToRender.length; i++) {

            let offsetRender = Math.floor((this._currentPage - 1) * 5);
            let wptRender = this._wayPointsToRender[i + offsetRender];
            // if its a real fix 
            if ((this._currentPage != 1 && i != 1) && wptRender && (wptRender.fix.ident !== "$EMPTY" || wptRender.fix.ident !== "$DISCO")) {
                this._fmc.onRightInput[i] = () => {
                    let offset = Math.floor((this._currentPage - 1) * 5);
                    let wptIndex = this._wayPointsToRender[i + offset].index;
                    let waypoint = this._fmc.flightPlanManager.getWaypoint(wptIndex);
                    let value = this._fmc.inOut;

                    if (value === FMCMainDisplay.clrValue) {
                        waypoint.legAltitudeDescription = -1;
                        waypoint.speedConstraint = -1;
                        this._fmc.flightPlanManager._updateFlightPlanVersion();
                        this.resetAfterOp();
                        return;
                    }

                    this.parseConstraintInput(value, waypoint);

                    this._fmc.flightPlanManager._updateFlightPlanVersion();
                    this.resetAfterOp();
                };
            }

            this._fmc.onLeftInput[i] = async () => {
                let offset = Math.floor((this._currentPage - 1) * 5);
                let waypoint = this._wayPointsToRender[i + offset];

                if (!waypoint) return;

                if (waypoint.fix.ident === "USR") {
                    this._fmc.showErrorMessage("UNABLE MOD USR");
                    return;
                }

                let value = this._fmc.inOut;
                let selectedWpIndex = waypoint.index;

                // Mode evaluation
                if (value == "")
                    this._fmc.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NONE;
                else if (value === FMCMainDisplay.clrValue)
                    this._fmc.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.DELETE;
                else if (value.includes("/") && this._fmc.selectMode === CJ4_FMC_LegsPage.SELECT_MODE.EXISTING) // looks like user waypoint, go to new
                    this._fmc.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NEW;
                else if (value.length > 0 && this._fmc.selectMode !== CJ4_FMC_LegsPage.SELECT_MODE.EXISTING) // scratchpad not empty, nothing selected, must be new wpt
                    this._fmc.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NEW;

                // only allow insert new on add line
                if (waypoint.fix === "$EMPTY" && this._fmc.selectMode !== CJ4_FMC_LegsPage.SELECT_MODE.NEW) return;

                switch (this._fmc.selectMode) {
                    case CJ4_FMC_LegsPage.SELECT_MODE.NONE: {
                        // CANT SELECT BLUE ON PAGE 1
                        if (((i > 0 && this._currentPage == 1) || (this._currentPage > 1))) {
                            // SELECT EXISTING WAYPOINT FROM FLIGHT PLAN
                            this._approachWaypoints = this._fmc.flightPlanManager.getApproachWaypoints();
                            if (this._approachWaypoints.length > 0) {
                                if (waypoint.fix.ident === this._approachWaypoints[this._approachWaypoints.length - 1].ident) {
                                    this._fmc.showErrorMessage("UNABLE MOD RW");
                                    return;
                                }
                            }

                            this._fmc.selectedWaypoint = waypoint;
                            this._fmc.inOut = waypoint.fix.ident;
                            this._fmc.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.EXISTING;
                        }
                        else if (i == 0 && this._currentPage == 1) {
                            this._fmc.showErrorMessage("UNABLE SEL FROM WPT");
                        }
                        break;
                    }
                    case CJ4_FMC_LegsPage.SELECT_MODE.EXISTING: {
                        if ((i >= 1 && this._currentPage == 1) || this._currentPage > 1) {

                            this._fmc.setMsg("Working...");
                            let scratchPadWaypointIndex = this._fmc.selectedWaypoint.index;

                            // MOVE EXISTING WAYPOINT WITH LEGS AFTER
                            let lskWaypointIndex = selectedWpIndex;
                            let isDirectTo = (i == 1 && this._currentPage == 1);

                            if (isDirectTo) { // DIRECT TO
                                this._fmc.ensureCurrentFlightPlanIsTemporary(() => {
                                    this._fmc.flightPlanManager.activateDirectToByIndex(scratchPadWaypointIndex, () => {
                                        this._fmc.activateRoute(true, () => {
                                            this.resetAfterOp();
                                        });
                                    });
                                });
                            }
                            else { // MOVE TO POSITION IN FPLN
                                let isMovable = true;
                                if (waypoint.fix.icao === '$DISCO') {
                                    if (waypoint.fix.isRemovable) {
                                        this._fmc.flightPlanManager.clearDiscontinuity(waypoint.index);
                                        lskWaypointIndex += 1;
                                    }
                                    else {
                                        this._fmc.showErrorMessage("INVALID DELETE");
                                        isMovable = false;
                                    }
                                }

                                if (waypoint.fix.isHold) {
                                    this._fmc.flightPlanManager.deleteHoldAtWaypointIndex(waypoint.index);
                                    lskWaypointIndex += 1;
                                }

                                if (isMovable) {
                                    let removeWaypointForLegsMethod = (callback = EmptyCallback.Void) => {
                                        if (lskWaypointIndex < scratchPadWaypointIndex) {
                                            this._fmc.flightPlanManager.removeWaypoint(lskWaypointIndex, false, () => {
                                                scratchPadWaypointIndex--;
                                                removeWaypointForLegsMethod(callback);
                                            });
                                        }
                                        else {
                                            callback();
                                        }
                                    };
                                    this._fmc.ensureCurrentFlightPlanIsTemporary(() => {
                                        removeWaypointForLegsMethod(() => {
                                            this._fmc.activateRoute(false, () => {
                                                this.resetAfterOp();
                                            });
                                        });
                                    });
                                }
                            }
                        }
                        else if (i == 0 && this._currentPage == 1) {
                            let scratchPadWaypointIndex = this._fmc.selectedWaypoint.index;
                            console.log("modifying from line");
                            console.log("scratchPadWaypointIndex: " + scratchPadWaypointIndex);
                            this._fmc.setMsg("Working...");
                            this._fmc.ensureCurrentFlightPlanIsTemporary(() => {
                                this._fmc.flightPlanManager.setActiveWaypointIndex(scratchPadWaypointIndex + 1, () => {
                                    this._fmc.activateRoute(false, () => {
                                        this.resetAfterOp();
                                    });
                                });
                            });
                        }
                        break;
                    }
                    case CJ4_FMC_LegsPage.SELECT_MODE.NEW: {
                        if ((i >= 1 && this._currentPage == 1) || this._currentPage > 1) {
                            this._fmc.setMsg("Working...");
                            if (waypoint && waypoint.fix) {
                                if (waypoint.fix.icao === "$EMPTY") {
                                    selectedWpIndex = Infinity;
                                }
                                if (waypoint.fix.icao === '$DISCO') {
                                    if (waypoint.fix.isRemovable) {
                                        this._fmc.flightPlanManager.clearDiscontinuity(waypoint.index);
                                        selectedWpIndex += 1;
                                    }
                                    else {
                                        this._fmc.showErrorMessage("INVALID DELETE");
                                        this._fmc.setMsg();
                                        return;
                                    }   
                                }
                            }
                            let scratchPadWaypointIndex = this._fmc.selectedWaypoint ? this._fmc.selectedWaypoint.index : undefined;
                            const userWaypoint = await this.parseWaypointInput(value, scratchPadWaypointIndex);
                            if (userWaypoint) {
                                this._fmc.ensureCurrentFlightPlanIsTemporary(() => {
                                    this._fmc.flightPlanManager.addUserWaypoint(userWaypoint, selectedWpIndex, () => {
                                        let isDirectTo = (i == 1 && this._currentPage == 1);
                                        if (isDirectTo) {
                                            const activeIndex = this._fmc.flightPlanManager.getActiveWaypointIndex();
                                            this._fmc.flightPlanManager.activateDirectToByIndex(activeIndex, () => {
                                                this._fmc.activateRoute(true, () => {
                                                    this.resetAfterOp();
                                                });
                                            });
                                        } else {
                                            this._fmc.activateRoute(false, () => {
                                                this.resetAfterOp();
                                            });
                                        }
                                    });
                                });
                            }
                            else {
                                this._fmc.ensureCurrentFlightPlanIsTemporary(() => {
                                    this._fmc.insertWaypoint(value, selectedWpIndex, (isSuccess) => {
                                        if (isSuccess) {
                                            let isDirectTo = (i == 1 && this._currentPage == 1);
                                            if (isDirectTo) {
                                                const activeIndex = this._fmc.flightPlanManager.getActiveWaypointIndex();
                                                this._fmc.flightPlanManager.activateDirectToByIndex(activeIndex, () => {
                                                    this._fmc.activateRoute(true, () => {
                                                        this.resetAfterOp();
                                                    });
                                                });
                                            } else {
                                                this._fmc.activateRoute(false, () => {
                                                    this.resetAfterOp();
                                                });
                                            }
                                        } else {
                                            this._fmc.fpHasChanged = false;
                                            this._fmc.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NONE;
                                            this._fmc.setMsg();
                                            this._fmc.eraseTemporaryFlightPlan(() => { this.resetAfterOp(); });
                                        }
                                    });
                                });
                            }
                        }
                        else if (i == 0 && this._currentPage == 1) {
                            this._fmc.showErrorMessage("UNABLE ADD FROM WPT");
                        }
                        break;
                    }
                    case CJ4_FMC_LegsPage.SELECT_MODE.DELETE: {
                        // DELETE WAYPOINT
                        if ((i > 1 && this._currentPage == 1) || this._currentPage > 1) {
                            this._fmc.setMsg("Working...");
                            this._fmc.ensureCurrentFlightPlanIsTemporary(() => {
                                if (waypoint.fix.icao === '$DISCO') {
                                    if (waypoint.fix.isRemovable) {
                                        this._fmc.flightPlanManager.clearDiscontinuity(waypoint.index);
                                        this._fmc.activateRoute(false, () => {
                                            this.resetAfterOp();
                                        });
                                    }
                                    else {
                                        this._fmc.showErrorMessage("INVALID DELETE");
                                    }
                                }
                                else if (waypoint.fix.isHold) {
                                    this._fmc.flightPlanManager.deleteHoldAtWaypointIndex(waypoint.index);
                                    this._fmc.activateRoute(false, () => {
                                        this.resetAfterOp();
                                    });
                                }
                                else {
                                    this._fmc.flightPlanManager.removeWaypoint(selectedWpIndex, false, () => {
                                        this._fmc.activateRoute(false, () => {
                                            this.resetAfterOp();
                                        });
                                    });
                                }
                            });
                        }
                        else {
                            this._fmc.showErrorMessage("UNABLE DEL FROM WPT");
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
            let holdActive = false;
            let holdExiting = false;

            const holdsDirector = this._fmc._lnav && this._fmc._lnav._holdsDirector;

            if (holdsDirector) {
                const holdIndex = this._fmc.flightPlanManager.getActiveWaypointIndex() - 1;
                holdActive = holdsDirector.isHoldActive(holdIndex);
                holdExiting = holdsDirector.isHoldExiting(holdIndex);
            }

            if (this._isAddingHold) {
                this.addHold();
            }
            else if (this._lsk6Field == "<CANCEL MOD") {
                if (this._fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                    this._fmc.fpHasChanged = false;
                    this._fmc.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NONE;
                    this._fmc.eraseTemporaryFlightPlan(() => { this.resetAfterOp(); });
                }
            }
            else if (holdExiting) {
                holdsDirector.cancelHoldExit();
                this.update(true);
            }
            else if (holdActive) {
                holdsDirector.exitActiveHold();
                this.update(true);
            }
        };
        if (this._currentPage == 1) {
            this._fmc.onRightInput[0] = () => {
                let currentInhibit = SimVar.GetSimVarValue("L:WT_CJ4_INHIBIT_SEQUENCE", "number");
                let setInhibit = currentInhibit == 1 ? 0 : 1;
                SimVar.SetSimVarValue("L:WT_CJ4_INHIBIT_SEQUENCE", "number", setInhibit).then(() => { this.resetAfterOp(); });
            };
        }


        // EXEC
        this._fmc.onExecPage = () => {
            if (this._fmc.fpHasChanged && this._fmc._isRouteActivated) {
                this._fmc.refreshPageCallback = () => { this.resetAfterOp(); }; // TODO this seems annoying, but this is how stuff works in cj4_fmc right now
                this._fmc.onExecDefault();
            }
            else if (this._fmc.fpHasChanged) {
                this._fmc.fpHasChanged = false;
                this._fmc.activateRoute(() => {
                    //this._fmc.activatingDirectTo = false;
                    this._fmc.refreshPageCallback = () => { this.resetAfterOp(); }; // TODO this seems annoying, but this is how stuff works in cj4_fmc right now
                    this._fmc.onExecDefault();
                });
            }
        };

        this._fmc.onPrevPage = () => {
            if (this._currentPage > 1) {
                this._currentPage--;
                this.update(true);
            } else {
                this._currentPage = this._pageCount;
                this.update(true);
            }
        };
        this._fmc.onNextPage = () => {
            if (this._currentPage < this._pageCount) {
                this._currentPage++;
                this.update(true);
            } else {
                this._currentPage = 1;
                this.update(true);
            }
        };
    }

    addHold() {
        /** @type {{waypoint: WayPoint, index: number}} */
        const holdWaypoint = this._fmc.flightPlanManager.getAllWaypoints()
            .map((waypoint, index) => ({waypoint, index}))
            .slice(this._activeWptIndex)
            .find(x => x.waypoint.ident === this._fmc.inOut);

        if (holdWaypoint !== undefined) {

            this._fmc.ensureCurrentFlightPlanIsTemporary(() => {
                const details = HoldDetails.createDefault(holdWaypoint.waypoint.bearingInFP, holdWaypoint.waypoint.bearingInFP);
                this._fmc.flightPlanManager.addHoldAtWaypointIndex(holdWaypoint.index, details);
                this._fmc.fpHasChanged = true;

                this._fmc.inOut = '';
                CJ4_FMC_HoldsPage.showHoldPage(this._fmc, holdWaypoint.waypoint.ident);
            });
        }
        else {
            this._fmc.showErrorMessage('INVALID ENTRY');
        }
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

        if (wpt.speedConstraint && wpt.speedConstraint > 100) {
            speedConstraint = wpt.speedConstraint;
        }
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
                altitudeConstraint = altitudeConstraintA + altitudeConstraintB;
            }

        }
        altitudeConstraint = altitudeConstraint.padStart(6, " ");

        return speedConstraint + "/" + altitudeConstraint + "[green]";
    }

    async parseWaypointInput(value, referenceIndex) {
        console.log("parse waypoint input");
        let fullLatLong = /([NS])([0-8][0-9])([0-5][0-9](?:\.\d{1,2})?)([EW])((?:[0][0-9][0-9])|(?:[1][0-7][0-9]))([0-5][0-9](?:\.\d{1,2})?)(?:\/(\w{0,5}))?/;
        let shorhandLatLongEnd = /([0-8][0-9])([0-9][0-9]|[1][0-8][0-9])([NSEW])/;
        let shorthandLatLongMid = /([0-8][0-9])([NSEW])([1][0-8][0-9]|[0-9][0-9])/;
        let placeBearingDistance = /(\w{3,5})([0-3][0-9][0-9])\/(\d{1,3}(?:\.\d{1})?)(?:\/(\w{0,5}))?/;
        let alongTrackOffset = /(\w{3,5})\/(?:(\-*\d{0,3}\.*\d{0,1}))?(?:\/(\w{0,5}))?/;

        let matchFullLatLong = value.match(fullLatLong);
        let matchShorhandLatLongEnd = value.match(shorhandLatLongEnd);
        let matchShorthandLatLongMid = value.match(shorthandLatLongMid);
        let matchPlaceBearingDistance = value.match(placeBearingDistance);
        let matchAlongTrackOffset = value.match(alongTrackOffset);

        let procMatch = (item, defaultVal) => {
            return (item === undefined) ? defaultVal : item;
        };

        const getIndexedName = (ident) => {
            const waypoints = this._fmc.flightPlanManager.getAllWaypoints();
            const identPrefix = ident.substr(0, 3);

            let namingIndex;
            let currentIndex = 1;

            while (namingIndex === undefined) {
                const currentName = `${identPrefix}${String(currentIndex).padStart(2, '0')}`;
                const waypointIndex = waypoints.findIndex(x => x.ident === currentName);

                if (waypointIndex === -1) {
                    return currentName;
                }
                else {
                    currentIndex++;
                }
            }
        };

        let newWaypoint = undefined;

        if (matchFullLatLong) {
            console.log("match full lat long");
            // 1 = N/S
            // 2 = LAT DEG
            // 3 = LAT MINS
            // 4 = E/W
            // 5 = LONG DEG
            // 6 = LONG MINS
            // 7 = IDENT
            const latitude = matchFullLatLong[1] == "S" ? 0 - parseInt(matchFullLatLong[2]) - (parseFloat(matchFullLatLong[3]) / 60)
                : parseInt(matchFullLatLong[2]) + (parseFloat(matchFullLatLong[3]) / 60);
            const longitude = matchFullLatLong[4] == "W" ? 0 - parseInt(matchFullLatLong[5]) - (parseFloat(matchFullLatLong[6]) / 60)
                : parseInt(matchFullLatLong[5]) + (parseFloat(matchFullLatLong[6]) / 60);
            const coordinates = new LatLongAlt(latitude, longitude, 0);
            const ident = procMatch(matchFullLatLong[7], matchFullLatLong[1] + matchFullLatLong[2].slice(0, 2) + matchFullLatLong[4] + matchFullLatLong[5] + matchFullLatLong[6].slice(0, 2));

            newWaypoint = WaypointBuilder.fromCoordinates(ident, coordinates);


        }
        else if (matchShorhandLatLongEnd) {
            // 1 = LAT DEG
            // 2 = LONG DEG
            // 3 = N/E/S/W (N = N:W; E = N:E; S = S:E; W = S:W)
            const direction = matchShorhandLatLongEnd[3];

            const latitude = direction == "S" || direction == "W" ? 0 - parseInt(matchShorhandLatLongEnd[1])
                : parseInt(matchShorhandLatLongEnd[1]);
            const longitude = direction == "N" || direction == "W" ? 0 - parseInt(matchShorhandLatLongEnd[2])
                : parseInt(matchShorhandLatLongEnd[2]);
            const coordinates = new LatLongAlt(latitude, longitude, 0);
            const ident = matchShorhandLatLongEnd[1] + matchShorhandLatLongEnd[2] + direction;

            newWaypoint = WaypointBuilder.fromCoordinates(ident, coordinates);

        }
        else if (matchShorthandLatLongMid) {
            // 1 = LAT DEG
            // 2 = N/E/S/W (N = N:W; E = N:E; S = S:E; W = S:W)
            // 3 = LONG DEG
            const direction = matchShorthandLatLongMid[2];

            const latitude = direction == "S" || direction == "W" ? 0 - parseInt(matchShorthandLatLongMid[1])
                : parseInt(matchShorthandLatLongMid[1]);
            const longitude = direction == "N" || direction == "W" ? 0 - 100 - parseInt(matchShorthandLatLongMid[3])
                : 100 + parseInt(matchShorthandLatLongMid[3]);
            const coordinates = new LatLongAlt(latitude, longitude, 0);
            const ident = matchShorthandLatLongMid[1] + direction + matchShorthandLatLongMid[3];

            newWaypoint = WaypointBuilder.fromCoordinates(ident, coordinates);
        }
        else if (matchPlaceBearingDistance) {
            // 1 = Reference Ident
            // 2 = Bearing from Reference
            // 3 = Distance from Reference
            // 4 = Ident

            let referenceWaypoint = this._fmc.flightPlanManager.getAllWaypoints().find(x => x.ident === matchPlaceBearingDistance[1]);
            if(referenceWaypoint === undefined){
                let getWpt = (refWpt) => {
                    return new Promise(resolve => {
                        this._fmc.getOrSelectWaypointByIdent(refWpt, (w) => resolve(w));
                    });
                };
    
                referenceWaypoint = await getWpt(matchPlaceBearingDistance[1]);
            }

            if(referenceWaypoint !== undefined){
                const referenceCoordinates = referenceWaypoint.infos.coordinates;
                const bearing = parseInt(matchPlaceBearingDistance[2]);
                const distance = parseFloat(matchPlaceBearingDistance[3]);
                const ident = procMatch(matchPlaceBearingDistance[4], getIndexedName(referenceWaypoint.ident));
    
                newWaypoint = WaypointBuilder.fromPlaceBearingDistance(ident, referenceCoordinates, bearing, distance, this._fmc);
            }
        }
        else if (matchAlongTrackOffset) {
            // 1 = Reference Ident
            // 2 = Distance from Reference
            // 3 = Ident

            referenceIndex = this._fmc.flightPlanManager.getAllWaypoints().findIndex(x => x.ident === matchAlongTrackOffset[1]);

            if(referenceIndex > -1){
                const ident = procMatch(matchAlongTrackOffset[3], getIndexedName(this._fmc.flightPlanManager.getWaypoint(referenceIndex).ident));
                const distance = parseFloat(matchAlongTrackOffset[2]);
                console.log("ident " + ident);
                console.log("referenceIndex " + referenceIndex);
                console.log("distance " + distance);
    
                newWaypoint = WaypointBuilder.fromPlaceAlongFlightPlan(ident, referenceIndex, distance, this._fmc, this._fmc.flightPlanManager);
            }
        }

        return newWaypoint;
    }

    parseConstraintInput(value, waypoint) {
        let re = /(\d*)\/(F?|FL?)(\d+)([AB]?)(F?|FL?)(\d+)?([AB]?)/;
        // 1 = speed
        // 2 = F/FL
        // 3 = ALT
        // 4 = A/B
        // 5 = F/FL
        // 6 = ALT
        // 7 = A/B
        let match = value.match(re);
        if (!match) {
            // no match, input without speed?
            re = /()(F?|FL?)(\d+)([AB]?)(F?|FL?)(\d+)?([AB]?)/;
            match = value.match(re);
            if (!match) return;
            // if "alt" is < 500 and no FL its a speed
            if (match[2] === "" && match[3] !== "" && isFinite(match[3])) {
                const speed = Number(match[3]);
                if (speed < 500) {
                    match[1] = speed;
                    match[3] = "";
                }
            }
        }

        // speed
        if (match[1] !== "") {
            const speed = Number(match[1]);
            if (isFinite(speed) && speed > 0 && speed < 500) {
                waypoint.speedConstraint = speed;
            }
        }

        // alt 1
        if (match[3] !== "") {
            const fl = match[2];
            let alt = Number(match[3]);
            if (isFinite(alt)) {
                const multi = (fl === "F" || fl === "FL") ? 100 : 1;
                alt *= multi;
                if (alt >= -1300 || alt <= 65000) {
                    waypoint.legAltitude1 = alt;
                }
                // alt desc
                if (match[4] !== "") {
                    waypoint.legAltitudeDescription = (match[4] === "A") ? 2 : 3;
                }
                else {
                    waypoint.legAltitudeDescription = 1;
                }
            }
        }

        // alt 2
        if (match[6] !== "") {
            const fl = match[5];
            let alt = Number(match[6]);
            if (isFinite(alt)) {
                const multi = (fl === "F" || fl === "FL") ? 100 : 1;
                alt *= multi;
                if (alt >= -1300 || alt <= 65000) {
                    waypoint.legAltitude2 = alt;
                }
                // alt desc
                if (match[7] !== "") {
                    waypoint.legAltitudeDescription = 4;
                } else {
                    waypoint.legAltitudeDescription = 1;
                }
            }
        }
    }

    static ShowPage1(fmc, isAddingHold = false) {
        // console.log("SHOW LEGS PAGE 1");
        fmc.clearDisplay();

        // create page instance and init 
        LegsPageInstance = new CJ4_FMC_LegsPage(fmc, isAddingHold);
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