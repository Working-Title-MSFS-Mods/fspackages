// prototype singleton, this needs to be different ofc
let RoutePageInstance = undefined;

class CJ4_FMC_RoutePage {

    constructor(fmc) {
        this._fmc = fmc;
        this._isDirty = true;

        this._currentPage = 0;
        this._pageCount = 2;
        this._offset = 0;
        this._fplnVersion = -1;
        this._activeWptIndex = -1;

        this._lsk6Field = "";
        this._activateCell = "";
        this._modStr;
        this._originCell;
        this._destinationCell;
        this._distanceCell;
        this._flightNoCell;
        this._airwayInput = "";

        this._rows = [];
    }

    set currentPage(value) {
        this._currentPage = value;
        if (this._currentPage > (this._pageCount - 1)) {
            this._currentPage = 0;
        } else if (this._currentPage < 0) {
            this._currentPage = (this._pageCount - 1);
        }

        if (this._currentPage == 0) {
            this._offset = 0;
        } else {
            this._offset = ((this._currentPage - 1) * 5) + 1;
        }
    }

    gotoNextPage() {
        this.currentPage = this._currentPage + 1;
        this.update(true);
    }

    gotoPrevPage() {
        this.currentPage = this._currentPage - 1;
        this.update(true);
    }

    update(forceUpdate = false) {
        // check if active wpt changed
        const actWptIndex = this._fmc.flightPlanManager.getActiveWaypointIndex();
        if (this._activeWptIndex != actWptIndex) {
            this._activeWptIndex = actWptIndex;
            this._isDirty = true;
            console.log("active wpt changed");
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
    
    invalidate() {
        this._isDirty = true;
        this._fmc.clearDisplay();
        this.prerender();
        this.render();
        this.bindEvents();
        this._isDirty = false;
    }

    prerender() {
        const currentFp = this._fmc.flightPlanManager.getCurrentFlightPlan();

        if (this._currentPage == 0) {
            this._originCell = "□□□□";
            if (currentFp.hasOrigin) {
                this._originCell = this._fmc.flightPlanManager.getOrigin().ident;
            }

            this._destinationCell = "□□□□";
            if (currentFp.hasDestination) {
                this._destinationCell = this._fmc.flightPlanManager.getDestination().ident;
            }

            this._distanceCell = "----";
            if (currentFp.hasDestination && currentFp.hasOrigin) {
                this._distanceCell = Avionics.Utils.computeGreatCircleDistance(this._fmc.flightPlanManager.getOrigin().infos.coordinates, this._fmc.flightPlanManager.getDestination().infos.coordinates).toFixed(0);
            }

            this._flightNoCell = "--------";
            let flightNoValue = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string");
            if (flightNoValue) {
                this._flightNoCell = flightNoValue;
            }
        }

        if (this._fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            this._fmc.fpHasChanged = true;
            this._lsk6Field = "<CANCEL MOD";
            this._activateCell = "";
        }
        else if (this._fmc.flightPlanManager.getCurrentFlightPlanIndex() === 0) {
            this._fmc.fpHasChanged = false;
            this._activateCell = "PERF INIT>";
            this._lsk6Field = "<SEC FPLN[disabled]";
        }

        const currFplnVer = SimVar.GetSimVarValue(FlightPlanManager.FlightPlanVersionKey, 'number');
        if (this._fplnVersion < currFplnVer) {
            this._rows = CJ4_FMC_RoutePage._GetAllRows(this._fmc);
            this._fplnVersion = currFplnVer;

            // fill in empty row
            let emptyRow = new FpRow();
            const prevRow = this._rows[this._rows.length - 1];
            if (prevRow !== undefined) {
                emptyRow.fpIdx = (prevRow.fpIdx + 2);
                if (this._airwayInput !== "") {
                    emptyRow.airwayIn = this._airwayInput;
                }
            } else {
                let emptyFixIndex = 1;
                const firstFix = this._fmc.flightPlanManager.getWaypoint(emptyFixIndex);
                if (firstFix && firstFix.isRunway) {
                    emptyFixIndex++;
                }

                emptyRow.fpIdx = emptyFixIndex;
            }
            this._rows.push(emptyRow);
        }

        this._pageCount = Math.max(2, (Math.ceil((this._rows.length - 1) / 5) + 1));

        this._modStr = this._fmc.fpHasChanged ? "MOD[white]" : "ACT[blue]";
    }

    render() {
        if (this._currentPage == 0) {
            this.renderMainPage();
        } else {
            this.renderRoutePage();
        }
    }

    renderMainPage() {
        this._fmc._templateRenderer.setTemplateRaw([
            [" " + this._modStr + " FPLN[blue]", "1/" + this._pageCount + " [blue]"],
            [" ORIGIN[blue]", "DEST[blue] ", "DIST[blue]"],
            [this._originCell, this._destinationCell, this._distanceCell],
            [" ROUTE[blue]", "ALTN[blue] "],
            ["----------", "----"],
            ["", "ORIG RWY[blue] "],
            [""],
            [" VIA[blue]", "TO[blue] "],
            this._rows[0].getTemplate()[0],
            ["----------------[blue]", "FLT NO[blue] "],
            ["", this._flightNoCell],
            [""],
            [this._lsk6Field, this._activateCell]
        ]);
    }

    renderRoutePage() {
        let idx = this._offset;

        this._fmc._templateRenderer.setTemplateRaw([
            [" " + this._modStr + " FPLN[blue]", (this._currentPage + 1) + "/" + this._pageCount + " [blue]"],
            ["VIA[s-text blue]", "TO[s-text blue]"],
            this._rows[idx] ? this._rows[idx].getTemplate()[0] : [""],
            this._rows[idx] ? this._rows[idx].getTemplate()[1] : [""],
            this._rows[idx + 1] ? this._rows[idx + 1].getTemplate()[0] : [""],
            this._rows[idx + 1] ? this._rows[idx + 1].getTemplate()[1] : [""],
            this._rows[idx + 2] ? this._rows[idx + 2].getTemplate()[0] : [""],
            this._rows[idx + 2] ? this._rows[idx + 2].getTemplate()[1] : [""],
            this._rows[idx + 3] ? this._rows[idx + 3].getTemplate()[0] : [""],
            this._rows[idx + 3] ? this._rows[idx + 3].getTemplate()[1] : [""],
            this._rows[idx + 4] ? this._rows[idx + 4].getTemplate()[0] : [""],
            ["-----------------------[blue]"],
            [this._lsk6Field, this._activateCell]
        ]);
    }

    bindEvents() {
        if (this._currentPage == 0) {
            // main page
            this._fmc.onLeftInput[0] = () => {
                this._fmc.setMsg("Working...");
                let value = this._fmc.inOut;
                this._fmc.clearUserInput();
                this.setOrigin(value);
            };

            this._fmc.onRightInput[0] = () => {
                this._fmc.setMsg("Working...");
                let value = this._fmc.inOut;
                this._fmc.clearUserInput();
                this.setDestination(value);
            };

            this._fmc.onRightInput[4] = () => {
                let value = this._fmc.inOut;
                this._fmc.clearUserInput();
                this._fmc.updateFlightNo(value, (result) => {
                    if (result) {
                        this.update(true);
                    }
                });
            };

            if (this._fmc.flightPlanManager.getCurrentFlightPlan().findSegmentByWaypointIndex(this._rows[0].fpIdx) !== SegmentType.Departure) {
                this.bindRowEvents(3);
            }

        } else {
            // other pages
            for (let i = 0; i < 5; i++) {
                if (this._rows[i + this._offset]) {
                    this.bindRowEvents(i);
                }
            }
        }

        // paging
        this._fmc.onPrevPage = () => {
            this.gotoPrevPage();
        };
        this._fmc.onNextPage = () => {
            this.gotoNextPage();
        };

        // exec stuff
        this._fmc.onLeftInput[5] = () => {
            if (this._lsk6Field == "<CANCEL MOD") {
                if (this._fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                    this._airwayInput = "";
                    this._fmc.fpHasChanged = false;
                    this._fmc.eraseTemporaryFlightPlan(() => { this.update(true); });
                }
            }
        };

        this._fmc.onRightInput[5] = () => {
            if (this._activateCell == "PERF INIT>") {
                CJ4_FMC_PerfInitPage.ShowPage2(this._fmc);
            }
        };

        this._fmc.onExecPage = () => {
            if (this._fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                this._airwayInput = "";
                if (!this._fmc.getIsRouteActivated()) {
                    this._fmc.activateRoute();
                }
                this._fmc.refreshPageCallback = () => this.update(true); // TODO see why this would be needed
                this._fmc.onExecDefault();
            } else {
                this._fmc._isRouteActivated = false;
                this._fmc.fpHasChanged = false;
                this._fmc.setMsg();
                this._fmc._activatingDirectTo = false;
            }
        };
    }

    /**
     * Bind the LSK events to a plan row.
     * @param {Number} lskIdx 
     */
    bindRowEvents(lskIdx) {
        if (this._currentPage > 0) {
            this._fmc.onLeftInput[lskIdx] = () => {
                const value = this._fmc.inOut;
                this._fmc.clearUserInput();
                this._fmc.ensureCurrentFlightPlanIsTemporary(() => {
                    const idx = lskIdx;
                    const lastWpIdx = this._rows[idx + this._offset - 1].fpIdx;

                    let lastWaypoint = this._fmc.flightPlanManager.getWaypoints()[lastWpIdx];
                    if (lastWaypoint.infos instanceof WayPointInfo) {
                        lastWaypoint.infos.UpdateAirway(value).then(() => {
                            let airway = lastWaypoint.infos.airways.find(a => { return a.name === value; });
                            if (airway) {
                                this._airwayInput = airway.name;
                                this.update(true);
                            }
                            else {
                                this._fmc.showErrorMessage("NO AIRWAY MATCH");
                            }
                        });
                    }
                });
            };
        }

        this._fmc.onRightInput[lskIdx] = () => {
            this._fmc.setMsg("Working...");
            const value = this._fmc.inOut;
            const idx = (this._currentPage > 0) ? lskIdx : 0;
            const row = this._rows[idx + this._offset];
            const wpIdx = row.fpIdx;

            if (value === FMCMainDisplay.clrValue) {
                this._fmc.clearUserInput();
                this._fmc.removeWaypoint(wpIdx, () => {
                    this._fmc.setMsg();
                    this.update(true);
                });
            } else if (value.length > 0) {
                this._fmc.clearUserInput();
                if (this._airwayInput !== "") {
                    this._fmc.ensureCurrentFlightPlanIsTemporary(() => {
                        this._fmc.getOrSelectWaypointByIdent(value, (wpt) => {
                            if (!wpt) {
                                this._fmc.showErrorMessage("NOT IN DATABASE");
                            }
                            const lastWpIdx = this._rows[idx + this._offset - 1].fpIdx;
                            let lastWaypoint = this._fmc.flightPlanManager.getWaypoints()[lastWpIdx];
                            lastWaypoint.infos.airwayOut = this._airwayInput;
                            CJ4_FMC_RoutePage.insertWaypointsAlongAirway(this._fmc, wpt.ident, lastWpIdx, this._airwayInput, (result) => {
                                if (result) {
                                    this._airwayInput = "";
                                    this._fmc.setMsg();
                                    this.update(true);
                                } else
                                    this._fmc.showErrorMessage("NOT ON AIRWAY");
                            });
                        });
                    });
                } else {
                    this._fmc.insertWaypoint(value, wpIdx, (isSuccess) => {
                        if (isSuccess) {
                            this._fmc.setMsg();
                            this.update(true);
                        }
                    });
                }
            } else {
                this._fmc.setMsg();
            }
        };
    }

    setDestination(icao) {
        this._fmc.updateRouteDestination(icao, (result) => {
            if (result) {
                this._fmc.flightPlanManager.setApproachTransitionIndex(-1, () => {
                    this._fmc.flightPlanManager.setArrivalProcIndex(-1, () => {
                        this._fmc.flightPlanManager.setApproachIndex(-1, () => {
                            this._fmc.setMsg();
                            this._fmc.fpHasChanged = true;
                            this.update(true);
                        });
                    });
                });
            }
        });
    }

    setOrigin(icao) {
        if (!SimVar.GetSimVarValue("SIM ON GROUND", "boolean")) {
            this._fmc.showErrorMessage("NOT ON GROUND");
            return;
        }

        this._fmc.tmpDestination = undefined;
        this._fmc.flightPlanManager.createNewFlightPlan(() => {
            this._fmc.updateRouteOrigin(icao, (result) => {
                if (result) {
                    this._fmc.setMsg();
                    this._fmc.fpHasChanged = true;
                    this.update(true);
                }
            });
        });
    }

    static ShowPage1(fmc) {
        fmc.clearDisplay();
        RoutePageInstance = new CJ4_FMC_RoutePage(fmc);
        RoutePageInstance.update();
    }

    static async insertWaypointsAlongAirway(fmc, lastWaypointIdent, index, airwayName, callback = EmptyCallback.Boolean) {
        let referenceWaypoint = fmc.flightPlanManager.getWaypoint(index);
        if (referenceWaypoint) {
            let infos = referenceWaypoint.infos;
            if (infos instanceof WayPointInfo) {
                let airway = infos.airways.find(a => { return a.name === airwayName; });
                if (airway) {
                    let firstIndex = airway.icaos.indexOf(referenceWaypoint.icao);
                    let lastWaypointIcao = airway.icaos.find(icao => icao.substring(7, 12) === lastWaypointIdent.padEnd(5, " "));
                    let lastIndex = airway.icaos.indexOf(lastWaypointIcao);
                    if (firstIndex >= 0) {
                        if (lastIndex >= 0) {
                            let inc = 1;
                            if (lastIndex < firstIndex) {
                                inc = -1;
                            }

                            let count = Math.abs(lastIndex - firstIndex);
                            for (let i = 1; i < count + 1; i++) { // 9 -> 6
                                let syncInsertWaypointByIcao = async (icao, idx) => {
                                    return new Promise(resolve => {
                                        console.log("add icao:" + icao + " @ " + idx);
                                        fmc.flightPlanManager.addWaypoint(icao, idx, () => {
                                            let waypoint = fmc.flightPlanManager.getWaypoint(idx);
                                            waypoint.infos.UpdateAirway(airwayName).then(() => {
                                                waypoint.infos.airwayIn = airwayName;
                                                if (i < count) {
                                                    waypoint.infos.airwayOut = airwayName;
                                                }
                                                console.log("icao:" + icao + " added");
                                                resolve();
                                            });
                                        });
                                    });
                                };

                                await syncInsertWaypointByIcao(airway.icaos[firstIndex + i * inc], index + i);
                            }
                            callback(true);
                            return;
                        }
                        fmc.showErrorMessage("2ND INDEX NOT FOUND");
                        return callback(false);
                    }
                    fmc.showErrorMessage("1ST INDEX NOT FOUND");
                    return callback(false);
                }
                fmc.showErrorMessage("NO REF WAYPOINT");
                return callback(false);
            }
            fmc.showErrorMessage("NO WAYPOINT INFOS");
            return callback(false);
        }
        fmc.showErrorMessage("NO REF WAYPOINT");
        return callback(false);
    }

    static _GetAllRows(fmc) {
        let allRows = [];
        let flightPlanManager = fmc.flightPlanManager;
        let lastDepartureWaypoint = undefined;
        let foundActive = false; // haaaaackyyy
        if (flightPlanManager) {
            const departure = flightPlanManager.getDeparture();
            if (departure) {
                const departureWaypoints = flightPlanManager.getDepartureWaypointsMap();
                const lastDepartureIdx = departureWaypoints.length - 1;
                lastDepartureWaypoint = departureWaypoints[lastDepartureIdx];
                if (lastDepartureWaypoint) {
                    foundActive = flightPlanManager.getActiveWaypointIndex() <= lastDepartureIdx;
                    allRows.push(new FpRow(lastDepartureWaypoint.ident, lastDepartureIdx, departure.name, undefined, foundActive));
                }
            }
            let fpIndexes = [];
            const routeWaypoints = flightPlanManager.getEnRouteWaypoints(fpIndexes);
            let tmpFoundActive = false;
            for (let i = 0; i < routeWaypoints.length; i++) {
                const prev = (i == 0) ? lastDepartureWaypoint : routeWaypoints[i - 1]; // check with dep on first waypoint
                const wp = routeWaypoints[i];
                if (wp) {

                    tmpFoundActive = tmpFoundActive || (!foundActive && flightPlanManager.getActiveWaypointIndex() <= fpIndexes[i]);
                    if (tmpFoundActive) {
                        foundActive = true;
                    }

                    if (wp.infos.airwayIn !== undefined && prev && prev.infos.airwayOut === wp.infos.airwayIn) {
                        // is there a next waypoint?
                        const nextWp = routeWaypoints[i + 1];
                        if (nextWp) {
                            const airwayContinues = (wp.infos.airwayIn === wp.infos.airwayOut && nextWp.infos.airwayIn === wp.infos.airwayOut);
                            if (airwayContinues)
                                continue;
                        }
                        allRows.push(new FpRow(wp.ident, fpIndexes[i], wp.infos.airwayIn, wp.infos.airwayOut, tmpFoundActive));
                        tmpFoundActive = false;
                    }
                    else {
                        allRows.push(new FpRow(wp.ident, fpIndexes[i], undefined, wp.infos.airwayOut, tmpFoundActive));
                        tmpFoundActive = false;
                    }
                }
            }

            /** @type {ManagedFlightPlan} */
            const fpln = flightPlanManager.getCurrentFlightPlan();

            const arrivalSeg = fpln.getSegment(SegmentType.Arrival);
            if (arrivalSeg !== FlightPlanSegment.Empty) {
                const arrival = flightPlanManager.getArrival();
                const currentWaypointIndex = fpln.activeWaypointIndex;

                if (arrival) {
                    const transitionIndex = fpln.procedureDetails.arrivalTransitionIndex;
                    const arrivalName = transitionIndex !== -1
                        ? `${arrival.enRouteTransitions[transitionIndex].name}.${arrival.name}`
                        : `${arrival.name}`;

                    const finalFix = arrivalSeg.waypoints[arrivalSeg.waypoints.length - 1];
                    const isSegmentActive = currentWaypointIndex >= arrivalSeg.offset && currentWaypointIndex < arrivalSeg.offset + arrivalSeg.waypoints.length;

                    allRows.push(new FpRow(finalFix.ident, arrivalSeg.offset, arrivalName, undefined, isSegmentActive));
                }
            }

            const approachSeg = fpln.getSegment(SegmentType.Approach);
            if (approachSeg !== FlightPlanSegment.Empty) {
                const appName = (flightPlanManager.getAirportApproach() !== undefined) ? flightPlanManager.getAirportApproach().name : "APP";
                for (let i = 0; i < approachSeg.waypoints.length; i++) {
                    const wp = approachSeg.waypoints[i];
                    const fpIdx = approachSeg.offset + i;
                    let tmpFoundActive = !foundActive && flightPlanManager.getActiveWaypointIndex() <= fpIdx;
                    if (tmpFoundActive) {
                        foundActive = true;
                    }
                    allRows.push(new FpRow(wp.ident, fpIdx, appName, undefined, tmpFoundActive));
                }
            }

        }
        return allRows;
    }
}

class FpRow {
    constructor(ident = "-----", fpIdx = Infinity, airwayIn = undefined, airwayOut = undefined, isActive = false) {
        this._ident = ident;
        this._fpIdx = fpIdx;
        this._airwayIn = airwayIn;
        this._airwayOut = airwayOut;
        this._isActive = isActive;
    }

    get ident() { return this._ident; }
    set ident(val) { this._ident = val; }
    get fpIdx() { return this._fpIdx; }
    set fpIdx(val) { this._fpIdx = val; }
    get airwayOut() { return this._airwayOut; }
    set airwayOut(val) { this._airwayOut = val; }
    get airwayIn() { return this._airwayIn; }
    set airwayIn(val) { this._airwayIn = val; }

    getTemplate() {
        let row1tmpl, row2tmpl = ["", ""];
        if (this._airwayIn === undefined) {
            if (this._ident !== "-----") {
                row1tmpl = ["DIRECT", this._ident];
            }
            else {
                row1tmpl = ["-----", this._ident];

            }
        } else {
            row1tmpl = [this._airwayIn, this._ident];
            if (this._ident === "-----") {
                row1tmpl[1] = "□□□□□[s-text]";
                row2tmpl = ["----[s-text]", "----[s-text]", "DISCONTINUITY[s-text]"];
            }
        }

        if (this._isActive) {
            row1tmpl[0] += "[magenta]";
            row1tmpl[1] += "[magenta]";
        }

        return [row1tmpl, row2tmpl];
    }
}

//# sourceMappingURL=CJ4_FMC_RoutePage.js.map