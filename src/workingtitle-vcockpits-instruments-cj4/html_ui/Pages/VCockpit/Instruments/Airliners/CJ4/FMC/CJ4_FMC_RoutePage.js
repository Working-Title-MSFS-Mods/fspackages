// prototype singleton, this needs to be different ofc
let RoutePageInstance = undefined;

class CJ4_FMC_RoutePage {

    constructor(fmc) {
        this._fmc = fmc;
        this._isDirty = true;

        this._currentPage = 0;
        this._pageCount = 2;
        this._offset = 0;

        this._lsk6Field = "<SEC FPLN";
        this._activateCell = "PERF INIT>";
        this._modStr;
        this._originCell;
        this._destinationCell;
        this._distanceCell;
        this._flightNoCell;

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
        this.invalidate();
    }

    gotoPrevPage() {
        this.currentPage = this._currentPage - 1;
        this.invalidate();
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
            this._lsk6Field = "<SEC FPLN";
        }

        this._rows = CJ4_FMC_RoutePage._GetAllRows(this._fmc);
        this._rows.rows.push(["-----", "-----"]);
        this._pageCount = (Math.floor(this._rows.rows.length / 4) + 2);

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
            this._rows.rows[0],
            ["----------------[blue]", "FLT NO[blue] "],
            ["", this._flightNoCell],
            [""],
            [this._lsk6Field, this._activateCell]
        ]);
    }

    renderRoutePage() {
        let idx = this._offset;

        this._fmc._templateRenderer.setTemplateRaw([
            [" " + this._modStr + " FPLN[blue]", (this._currentPage+1) + "/" + this._pageCount + " [blue]"],
            ["VIA[s-text blue]", "TO[s-text blue]"],
            this._rows.rows[idx++],
            [""],
            this._rows.rows[idx++],
            [""],
            this._rows.rows[idx++],
            [""],
            this._rows.rows[idx++],
            [""],
            this._rows.rows[idx++],
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
                        this.invalidate();
                    }
                });
            };
            this._fmc.onRightInput[5] = () => {
                if (this._activateCell == "PERF INIT>") {
                    CJ4_FMC_PerfInitPage.ShowPage2(this._fmc);
                }
            };
            this._fmc.onLeftInput[5] = () => {
                if (this._lsk6Field == "<CANCEL MOD") {
                    if (this._fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                        this._fmc.fpHasChanged = false;
                        this._fmc.eraseTemporaryFlightPlan(() => { this.invalidate(); });
                    }
                }
            };

        } else {
            // other pages
        }

        // paging
        this._fmc.onPrevPage = () => {
            this.gotoPrevPage();
        };
        this._fmc.onNextPage = () => {
            this.gotoNextPage();
        };

        // exec stuff
        this._fmc.onExecPage = () => {
            if (this._fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                if (!this._fmc.getIsRouteActivated()) {
                    this._fmc.activateRoute();
                }
                this._fmc.onExecDefault();
                // fmc.refreshPageCallback = () => CJ4_FMC_RoutePage.ShowPage1(fmc); // TODO see why this would be needed
                this.invalidate();
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
     * @param {Number} idx 
     */
    bindRowEvent(idx) {

    }

    invalidate() {
        this._isDirty = true;
        this._fmc.clearDisplay();
        this.prerender();
        this.render();
        this.bindEvents(); // TODO could only call this once on init, but fmc.clearDisplay() clears events
        this._isDirty = false;
    }

    setDestination(icao) {
        this._fmc.updateRouteDestination(icao, (result) => {
            if (result) {
                this._fmc.flightPlanManager.setApproachTransitionIndex(-1, () => {
                    this._fmc.flightPlanManager.setArrivalProcIndex(-1, () => {
                        this._fmc.flightPlanManager.setApproachIndex(-1, () => {
                            this._fmc.setMsg();
                            this._fmc.fpHasChanged = true;
                            this.invalidate();
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
                    this.invalidate();
                }
            });
        });
    }

    static ShowPage1(fmc, pendingAirway) {
        fmc.clearDisplay();
        RoutePageInstance = new CJ4_FMC_RoutePage(fmc);
        RoutePageInstance.invalidate();

        // let rows = [["----"], [""], [""], [""], [""]];
        //let allRows = CJ4_FMC_RoutePage._GetAllRows(fmc);
        // let showInput = false;
        // for (let i = 0; i < rows.length; i++) {
        //     if (allRows.rows[i]) {
        //         rows[i] = allRows.rows[i];
        //         fmc.onRightInput[3] = () => {
        //             let value = fmc.inOut;
        //             if (value === FMCMainDisplay.clrValue) {
        //                 fmc.clearUserInput();
        //                 fmc.removeWaypoint(1, () => {
        //                     CJ4_FMC_RoutePage.ShowPage1(fmc);
        //                 });
        //             }
        //         };
        //     }
        //     else if (!showInput) {
        //         showInput = true;
        //         if (!pendingAirway) {
        //             rows[i] = ["-----", "-----"];
        //             fmc.onRightInput[3] = () => {
        //                 fmc.setMsg("Working...");
        //                 let value = fmc.inOut;
        //                 if (value === FMCMainDisplay.clrValue) {
        //                     fmc.clearUserInput();
        //                     fmc.removeWaypoint(1, () => {
        //                         fmc.setMsg();
        //                         CJ4_FMC_RoutePage.ShowPage1(fmc);
        //                     });
        //                 } else if (value.length > 0) {
        //                     fmc.clearUserInput();
        //                     fmc.insertWaypoint(value, 1, (isSuccess) => {
        //                         if (isSuccess) {
        //                             fmc.setMsg();
        //                             CJ4_FMC_RoutePage.ShowPage1(fmc);
        //                         } else {
        //                             fmc.fpHasChanged = false;
        //                             fmc.eraseTemporaryFlightPlan(() => { CJ4_FMC_RoutePage.ShowPage1(fmc); });
        //                         }
        //                     });
        //                 } else {
        //                     fmc.setMsg();
        //                 }
        //             };
        //             fmc.onLeftInput[3] = () => {
        //                 let value = fmc.inOut;
        //                 if (value.length > 0) {
        //                     fmc.clearUserInput();
        //                     fmc.ensureCurrentFlightPlanIsTemporary(() => {
        //                         let lastWaypoint = fmc.flightPlanManager.getWaypoints()[fmc.flightPlanManager.getEnRouteWaypointsLastIndex()];
        //                         if (lastWaypoint.infos instanceof WayPointInfo) {
        //                             lastWaypoint.infos.UpdateAirway(value).then(() => {
        //                                 let airway = lastWaypoint.infos.airways.find(a => { return a.name === value; });
        //                                 if (airway) {
        //                                     lastWaypoint.infos.airwayOut = airway.name;
        //                                     CJ4_FMC_RoutePage.ShowPage1(fmc, airway);
        //                                 }
        //                                 else {
        //                                     fmc.showErrorMessage("NOT IN DATABASE");
        //                                 }
        //                             });
        //                         }
        //                     });
        //                 }
        //             };
        //         }
        //         else {
        //             rows[i] = [pendingAirway.name, "-----"];
        //             fmc.onRightInput[3] = () => {
        //                 let value = fmc.inOut;
        //                 if (value.length > 0) {
        //                     fmc.clearUserInput();
        //                     fmc.insertWaypointsAlongAirway(value, fmc.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, pendingAirway.name, (result) => {
        //                         if (result) {
        //                             CJ4_FMC_RoutePage.ShowPage1(fmc);
        //                         }
        //                     });
        //                 }
        //             };
        //             if (rows[i + 1]) {
        //                 rows[i + 1] = ["-----"];
        //             }
        //         }
        //     }
        // }


        //end of CWB adding first waypoint leg to page 1

        //start of CWB edited activation and exec handling



    }
    static ShowPage2(fmc, offset = 0, pendingAirway) {

        fmc.clearDisplay();
        let rows = [["-----"], [""], [""], [""], [""]];
        let allRows = CJ4_FMC_RoutePage._GetAllRows(fmc);

        allRows.rows.shift();
        allRows.waypoints.shift();

        // TODO: this should fix missing indexes for when departure is loaded, not the nicest solution though
        let departure = fmc.flightPlanManager.getDeparture();
        if (!departure) {
            allRows.fpIndexes.shift();
        }

        let page = (2 + (Math.floor(offset / 4)));
        let pageCount = (Math.floor(allRows.rows.length / 4) + 2);
        let showInput = false;
        for (let i = 0; i < rows.length; i++) {
            if (allRows.rows[i + offset]) {
                rows[i] = allRows.rows[i + offset];
                let fpIndex = allRows.fpIndexes[i + offset];

                // DELETE WAYPOINT
                fmc.onRightInput[i] = () => {
                    fmc.setMsg("Working...");
                    let value = fmc.inOut;
                    if (value === FMCMainDisplay.clrValue) {
                        fmc.clearUserInput();
                        fmc.removeWaypoint(fpIndex, () => {
                            fmc.setMsg();
                            CJ4_FMC_RoutePage.ShowPage2(fmc, offset);
                        });
                    } else if (value.length > 0) {
                        fmc.clearUserInput();
                        fmc.insertWaypoint(value, fpIndex, (isSuccess) => {
                            if (isSuccess) {
                                fmc.setMsg();
                                CJ4_FMC_RoutePage.ShowPage2(fmc, offset);
                            } else {
                                fmc.fpHasChanged = false;
                                fmc.eraseTemporaryFlightPlan(() => { CJ4_FMC_RoutePage.ShowPage2(fmc, offset); });
                            }
                        });
                    } else {
                        fmc.setMsg();
                    }
                };
            }
            else if (!showInput) {
                showInput = true;
                if (!pendingAirway) {
                    rows[i] = ["-----", "-----"];
                    fmc.onRightInput[i] = () => {
                        fmc.setMsg("Working...");
                        let value = fmc.inOut;
                        if (value.length > 0) {
                            fmc.clearUserInput();
                            const enroute = fmc.flightPlanManager.getCurrentFlightPlan().enroute;
                            fmc.insertWaypoint(value, enroute.offset + enroute.waypoints.length, (isSuccess) => {
                                if (isSuccess) {
                                    fmc.setMsg();
                                    CJ4_FMC_RoutePage.ShowPage2(fmc, offset);
                                }
                            });
                        } else
                            fmc.setMsg();
                    };
                    fmc.onLeftInput[i] = () => {
                        fmc.setMsg("Working...");
                        let value = fmc.inOut;
                        if (value.length > 0) {
                            fmc.clearUserInput();
                            fmc.ensureCurrentFlightPlanIsTemporary(() => {
                                let lastWaypoint = fmc.flightPlanManager.getWaypoints()[fmc.flightPlanManager.getEnRouteWaypointsLastIndex()];
                                if (lastWaypoint.infos instanceof WayPointInfo) {
                                    // Load the fixes of the selected airway and their infos.airways
                                    lastWaypoint.infos.UpdateAirway(value).then(() => {
                                        let airway = lastWaypoint.infos.airways.find(a => { return a.name === value; });
                                        if (airway) {
                                            // set the outgoing airway of the last enroute or departure waypoint of the flightplan
                                            lastWaypoint.infos.airwayOut = airway.name;
                                            fmc.setMsg();
                                            CJ4_FMC_RoutePage.ShowPage2(fmc, offset, airway);
                                        }
                                        else {
                                            fmc.showErrorMessage("NO INTERSECTION");
                                        }
                                    });
                                }
                            });
                        } else
                            fmc.setMsg();
                    };
                }
                else {
                    rows[i] = [pendingAirway.name, "-----"];
                    fmc.onRightInput[i] = () => {
                        fmc.setMsg("Working...");
                        let value = fmc.inOut;
                        if (value.length > 0) {
                            fmc.clearUserInput();
                            fmc.ensureCurrentFlightPlanIsTemporary(() => {
                                fmc.getOrSelectWaypointByIdent(value, (waypoint) => {
                                    if (!waypoint) {
                                        fmc.showErrorMessage("NOT IN DATABASE");
                                    }
                                    CJ4_FMC_RoutePage.insertWaypointsAlongAirway(fmc, value, fmc.flightPlanManager.getEnRouteWaypointsLastIndex(), pendingAirway.name, (result) => {
                                        if (result) {
                                            fmc.setMsg();
                                            CJ4_FMC_RoutePage.ShowPage2(fmc, offset);
                                        } else
                                            fmc.showErrorMessage("NOT ON AIRWAY");
                                    });
                                });
                            });
                        } else
                            fmc.setMsg();
                    };
                    if (rows[i + 1]) {
                        rows[i + 1] = ["-----"];
                    }
                }
            }
        }

        //start of CWB edited activation and exec handling
        let activateCell = "";
        let lsk6Field = "";
        if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            fmc.fpHasChanged = true;
            lsk6Field = "<CANCEL MOD";
        }
        else if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 0) {
            activateCell = "PERF INIT>";
            fmc.fpHasChanged = false;
            lsk6Field = " ";
        }

        fmc.onExecPage = () => {
            if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                if (!fmc.getIsRouteActivated()) {
                    fmc.activateRoute();
                    activateCell = "";
                }
                fmc.onExecDefault();
            }
            fmc.refreshPageCallback = () => CJ4_FMC_RoutePage.ShowPage2(fmc, offset);
        };

        fmc.onRightInput[5] = () => {
            if (activateCell == "PERF INIT>") {
                CJ4_FMC_PerfInitPage.ShowPage2(fmc);
            }
        };

        fmc.onLeftInput[5] = () => {
            if (lsk6Field == "<CANCEL MOD") {
                if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                    fmc.fpHasChanged = false;
                    fmc.eraseTemporaryFlightPlan(() => { CJ4_FMC_RoutePage.ShowPage2(fmc, offset); });
                }
            }
        };

        //end of CWB edited activation and exec handling

        let modStr = fmc.fpHasChanged ? "MOD[white]" : "ACT[blue]";


        fmc.onPrevPage = () => {
            if (offset <= 0) {
                CJ4_FMC_RoutePage.ShowPage1(fmc);
            }
            else {
                CJ4_FMC_RoutePage.ShowPage2(fmc, offset - 5);
            }
        };
        fmc.onNextPage = () => {
            if (offset + 4 < allRows.rows.length) {
                CJ4_FMC_RoutePage.ShowPage2(fmc, offset + 5);
            }
        };
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
        let allWaypoints = [];
        let allFPIndexes = [];
        let flightPlan = fmc.flightPlanManager;
        let lastDepartureWaypoint = undefined;
        if (flightPlan) {
            let departure = flightPlan.getDeparture();
            if (departure) {
                let departureWaypoints = flightPlan.getDepartureWaypointsMap();
                lastDepartureWaypoint = departureWaypoints[departureWaypoints.length - 1];
                if (lastDepartureWaypoint) {
                    allRows.push([departure.name, lastDepartureWaypoint.ident]);
                }
            }
            let fpIndexes = [];
            let routeWaypoints = flightPlan.getEnRouteWaypoints(fpIndexes);
            for (let i = 0; i < routeWaypoints.length; i++) {
                let prev = (i == 0) ? lastDepartureWaypoint : routeWaypoints[i - 1]; // check with dep on first waypoint
                let wp = routeWaypoints[i];
                if (wp) {
                    if (wp.infos.airwayIn !== undefined && prev && prev.infos.airwayOut === wp.infos.airwayIn) {
                        // is there a next waypoint?
                        let nextWp = routeWaypoints[i + 1];
                        if (nextWp) {
                            let airwayContinues = (wp.infos.airwayIn === wp.infos.airwayOut && nextWp.infos.airwayIn === wp.infos.airwayOut);
                            if (airwayContinues)
                                continue;
                        }
                        allRows.push([wp.infos.airwayIn, wp.ident]);
                        allWaypoints.push(wp);
                        allFPIndexes.push(fpIndexes[i]);
                    }
                    else {
                        allRows.push(["DIRECT", wp.ident]);
                        allWaypoints.push(wp);
                        allFPIndexes.push(fpIndexes[i]);
                    }
                }
            }
        }
        return {
            rows: allRows,
            waypoints: allWaypoints,
            fpIndexes: allFPIndexes
        };
    }
}
//# sourceMappingURL=CJ4_FMC_RoutePage.js.map