class CJ4_FMC_RoutePage {
    static ShowPage1(fmc, offset = 0, pendingAirway) {
        fmc.clearDisplay();
        
        //temporary to check flight plan index

        fmc.onLeftInput[1] = () => {
            let value = "";
            Coherent.call("GET_CURRENT_FLIGHTPLAN_INDEX").then((value) => {
                console.log("GET_CURRENT_FLIGHTPLAN_INDEX_COHERENT: " + value);
                console.log("fmc.flightPlanManager._currentFlightPlanIndex: " + fmc.flightPlanManager._currentFlightPlanIndex);
                console.log("fmc.fpHasChanged: " + fmc.fpHasChanged);
                console.log("this._activatingDirectTo: " + fmc._activatingDirectTo)
            });
        };
        
        //end temp
        let lsk6Field = "<SEC FPLN";

        let originCell = "□□□□";
        if (fmc && fmc.flightPlanManager) {
            let origin = fmc.flightPlanManager.getOrigin();
            if (origin) {
                originCell = origin.ident;
            }
            else if (fmc.tmpOrigin) {
                originCell = fmc.tmpOrigin;
            }
        }
        fmc.onLeftInput[0] = () => {
            let value = fmc.inOut;
            fmc.clearUserInput();
            fmc.updateRouteOrigin(value, (result) => {
                if (result) {
                    fmc.fpHasChanged = true;
                    CJ4_FMC_RoutePage.ShowPage1(fmc);
                }
            });
        };
        let destinationCell = "□□□□";
        if (fmc && fmc.flightPlanManager) {
            let destination = fmc.flightPlanManager.getDestination();
            if (destination) {
                destinationCell = destination.ident;
            }
            else if (fmc.tmpDestination) {
                destinationCell = fmc.tmpDestination;
            }
        }
        fmc.onRightInput[0] = () => {
            let value = fmc.inOut;
            fmc.clearUserInput();
            fmc.updateRouteDestination(value, (result) => {
                if (result) {
                    fmc.fpHasChanged = true;
                    CJ4_FMC_RoutePage.ShowPage1(fmc);
                }
            });
        };
        let distanceCell = "----"
        if (fmc.flightPlanManager.getDestination() && fmc.flightPlanManager.getOrigin()) {
            distanceCell = Avionics.Utils.computeGreatCircleDistance(fmc.flightPlanManager.getOrigin().infos.coordinates, fmc.flightPlanManager.getDestination().infos.coordinates).toFixed(0);
        }
        let flightNoCell = "--------";
        let flightNoValue = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string");
        if (flightNoValue) {
            flightNoCell = flightNoValue;
        }
        fmc.onRightInput[4] = () => {
            let value = fmc.inOut;
            fmc.clearUserInput();
            fmc.updateFlightNo(value, (result) => {
                if (result) {
                    CJ4_FMC_RoutePage.ShowPage1(fmc);
                }
            });
        };
        let coRouteCell = "--------";
        if (fmc.coRoute) {
            coRouteCell = fmc.coRoute;
        }
        fmc.onRightInput[2] = () => {
            let value = fmc.inOut;
            fmc.clearUserInput();
            fmc.updateCoRoute(value, (result) => {
                if (result) {
                    CJ4_FMC_RoutePage.ShowPage1(fmc);
                }
            });
        };
        let allRows = CJ4_FMC_RoutePage._GetAllRows(fmc);
        let pageCount = (Math.floor(allRows.rows.length / 4) + 2);
        let activateCell = "";

        //start of CWB add first waypoint/leg to page1

        let rows = [["----"], [""], [""], [""], [""]];
        //let allRows = CJ4_FMC_RoutePage._GetAllRows(fmc);
        let showInput = false;
        for (let i = 0; i < rows.length; i++) {
            if (allRows.rows[i]) {
                rows[i] = allRows.rows[i];
                let fpIndex = allRows.fpIndexes[i];
                fmc.onRightInput[3] = () => {
                    let value = fmc.inOut;
                    if (value === FMCMainDisplay.clrValue) {
                        fmc.clearUserInput();
                        fmc.removeWaypoint(1, () => {
                            CJ4_FMC_RoutePage.ShowPage1(fmc);
                        });
                    }
                };
            }
            else if (!showInput) {
                showInput = true;
                if (!pendingAirway) {
                    rows[i] = ["-----", "-----"];
                    fmc.onRightInput[3] = async () => {
                        let value = fmc.inOut;
                        if (value.length > 0) {
                            fmc.clearUserInput();
                            fmc.insertWaypoint(value, 1, () => {
                                CJ4_FMC_RoutePage.ShowPage1(fmc);
                            });
                        }
                    };
                    fmc.onLeftInput[3] = async () => {
                        let value = fmc.inOut;
                        if (value.length > 0) {
                            fmc.clearUserInput();
                            let lastWaypoint = fmc.flightPlanManager.getWaypoints()[fmc.flightPlanManager.getEnRouteWaypointsLastIndex()];
                            if (lastWaypoint.infos instanceof IntersectionInfo) {
                                let airway = lastWaypoint.infos.airways.find(a => { return a.name === value; });
                                if (airway) {
                                    CJ4_FMC_RoutePage.ShowPage1(fmc, airway);
                                }
                                else {
                                    fmc.showErrorMessage("NOT IN DATABASE");
                                }
                            }
                        }
                    };
                }
                else {
                    rows[i] = [pendingAirway.name, "-----"];
                    fmc.onRightInput[3] = () => {
                        let value = fmc.inOut;
                        if (value.length > 0) {
                            fmc.clearUserInput();
                            fmc.insertWaypointsAlongAirway(value, fmc.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, pendingAirway.name, (result) => {
                                if (result) {
                                    CJ4_FMC_RoutePage.ShowPage1(fmc);
                                }
                            });
                        }
                    };
                    if (rows[i + 1]) {
                        rows[i + 1] = ["-----"];
                    }
                }
            }
        }


        //end of CWB adding first waypoint leg to page 1

        //start of CWB edited activation and exec handling
        if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            fmc.fpHasChanged = true;
            lsk6Field = "<CANCEL MOD"
        }
        else if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 0) {
            activateCell = "PERF INIT>";
            fmc.fpHasChanged = false;
            lsk6Field = "<SEC FPLN";
        }

        fmc.onExecPage = () => {
            if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                if (!fmc.getIsRouteActivated()) {
                    fmc.activateRoute();
                    activateCell = "";
                }
                fmc.onExecDefault();
                fmc.refreshPageCallback = () => CJ4_FMC_RoutePage.ShowPage1(fmc);
            } else {
                console.log("onExec Else");
                fmc._isRouteActivated = false;
                console.log("onExec else this._isRouteActivated = false");
                fmc.fpHasChanged = false;
                console.log("onExec else this.fpHasChanged = false");
                fmc.messageBox = "";
                console.log("onExec else fmc.messageBox");
                fmc._activatingDirectTo = false;
                console.log("onExec else this._activatingDirectTo = false");
            }
        };

        fmc.onRightInput[5] = () => {
            if (activateCell == "PERF INIT>") {
                if (!fmc.getIsRouteActivated()) {
                    fmc.activateRoute();
                }
                CJ4_FMC_PerfInitPage.ShowPage2(fmc);
            }
        };
        fmc.onLeftInput[5] = () => {
            if (lsk6Field == "<CANCEL MOD") {
                if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                    fmc.fpHasChanged = false;
                    fmc.eraseTemporaryFlightPlan(() => {CJ4_FMC_RoutePage.ShowPage1(fmc)});
                }
            }
        };

        //end of CWB edited activation and exec handling

        let modStr = fmc.fpHasChanged ? "MOD[white]" : "ACT[blue]";

        fmc.setTemplate([
            [modStr + " FPLN[blue]", "", "", "1", pageCount.toFixed(0)],
            ["ORIGIN" + "[color]blue", "DEST" + "[color]blue", "DIST" + "[color]blue"],
            [originCell, destinationCell, distanceCell],
            ["ROUTE" + "[color]blue", "ALTN" + "[color]blue"],
            ["----------", "----"],
			["", "ORIG RWY" + "[color]blue"],
            [""],
            ["VIA" + "[color]blue", "TO" + "[color]blue"],
            rows[0],
            ["----------------" + "[color]blue", "FLT NO" + "[color]blue"],
            ["<COPY ACTIVE", flightNoCell],
            [""],
            [lsk6Field, activateCell]
        ]);

        fmc.onNextPage = () => {
            CJ4_FMC_RoutePage.ShowPage2(fmc);
        };
    }
    static ShowPage2(fmc, offset = 0, pendingAirway) {
        fmc.clearDisplay();
        let rows = [["----"], [""], [""], [""], [""]];
        let allRows = CJ4_FMC_RoutePage._GetAllRows(fmc);
        allRows.rows.shift();
        allRows.waypoints.shift();
        allRows.fpIndexes.shift();
        let page = (2 + (Math.floor(offset / 4)));
        let pageCount = (Math.floor(allRows.rows.length / 4) + 2);
        console.log(fmc.flightPlanManager.getEnRouteWaypoints());
        let showInput = false;
        for (let i = 0; i < rows.length; i++) {
            if (allRows.rows[i + offset]) {
                rows[i] = allRows.rows[i + offset];
                let fpIndex = allRows.fpIndexes[i + offset];
                fmc.onRightInput[i] = () => {
                    fmc.messageBox = "Working...";
                    let value = fmc.inOut;
                    if (value === FMCMainDisplay.clrValue) {
                        fmc.clearUserInput();
                        fmc.removeWaypoint(fpIndex, () => {
                            fmc.messageBox = " ";
                            CJ4_FMC_RoutePage.ShowPage2(fmc, offset);
                        });
                    }
                    fmc.messageBox = " ";
                };
            }
            else if (!showInput) {
                showInput = true;
                if (!pendingAirway) {
                    rows[i] = ["-----", "-----"];
                    fmc.onRightInput[i] = async () => {
                        fmc.messageBox = "Working...";
                        let value = fmc.inOut;
                        if (value.length > 0) {
                            fmc.clearUserInput();
                            fmc.insertWaypoint(value, fmc.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, () => {
                                fmc.messageBox = "";
                                CJ4_FMC_RoutePage.ShowPage2(fmc, offset);
                            });
                        }
                        fmc.messageBox = "";
                    };
                    fmc.onLeftInput[i] = async () => {
                        fmc.messageBox = "Working...";
                        let value = fmc.inOut;
                        if (value.length > 0) {
                            fmc.clearUserInput();
                            let lastWaypoint = fmc.flightPlanManager.getWaypoints()[fmc.flightPlanManager.getEnRouteWaypointsLastIndex()];
                            if (lastWaypoint.infos instanceof IntersectionInfo) {
                                let airway = lastWaypoint.infos.airways.find(a => { return a.name === value; });
                                if (airway) {
                                    fmc.messageBox = "";
                                    CJ4_FMC_RoutePage.ShowPage2(fmc, offset, airway);
                                }
                                else {
                                    fmc.showErrorMessage("NOT IN DATABASE");
                                }
                            }
                        }
                        fmc.messageBox = "";
                    };
                }
                else {
                    rows[i] = [pendingAirway.name, "-----"];
                    fmc.onRightInput[i] = () => {
                        fmc.messageBox = "Working...";
                        let value = fmc.inOut;
                        if (value.length > 0) {
                            fmc.clearUserInput();
                            fmc.insertWaypointsAlongAirway(value, fmc.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, pendingAirway.name, (result) => {
                                if (result) {
                                    fmc.messageBox = "";
                                    CJ4_FMC_RoutePage.ShowPage2(fmc, offset);
                                }
                            });
                        }
                        fmc.messageBox = "";
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
            lsk6Field = "<CANCEL MOD"
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
            fmc.refreshPageCallback = () => CJ4_FMC_RoutePage.ShowPage2(fmc);
        };

        fmc.onRightInput[5] = () => {
            if (activateCell == "PERF INIT>") {
                if (!fmc.getIsRouteActivated()) {
                    fmc.activateRoute();
                }
                CJ4_FMC_PerfInitPage.ShowPage2(fmc);
            }
        };
        fmc.onLeftInput[5] = () => {
            if (lsk6Field == "<CANCEL MOD") {
                if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                    fmc.fpHasChanged = false;
                    fmc.eraseTemporaryFlightPlan(() => {CJ4_FMC_RoutePage.ShowPage2(fmc, offset)});
                }
            }
        };

        //end of CWB edited activation and exec handling


        fmc.setTemplate([
            ["RTE 1" + "[color]blue", page.toFixed(0), pageCount.toFixed(0)],
            ["VIA" + "[color]blue", "TO" + "[color]blue"],
            rows[0],
            [""],
            rows[1],
            [""],
            rows[2],
            [""],
            rows[3],
            [""],
            rows[4],
            [""],
            [lsk6Field, activateCell]
        ]);
        fmc.onPrevPage = () => {
            if (offset === 0) {
                CJ4_FMC_RoutePage.ShowPage1(fmc);
            }
            else {
                CJ4_FMC_RoutePage.ShowPage2(fmc, offset - 4);
            }
        };
        fmc.onNextPage = () => {
            if (offset + 4 < allRows.rows.length) {
                CJ4_FMC_RoutePage.ShowPage2(fmc, offset + 4);
            }
        };
    }
    static _GetAllRows(fmc) {
        let allRows = [];
        let allWaypoints = [];
        let allFPIndexes = [];
        let flightPlan = fmc.flightPlanManager;
        if (flightPlan) {
            let departure = flightPlan.getDeparture();
            if (departure) {
                let departureWaypoints = flightPlan.getDepartureWaypoints();
                let lastDepartureWaypoint = departureWaypoints[departureWaypoints.length - 1];
                if (lastDepartureWaypoint) {
                    allRows.push([departure.name, lastDepartureWaypoint.ident]);
                }
            }
            let fpIndexes = [];
            let routeWaypoints = flightPlan.getEnRouteWaypoints(fpIndexes);
            for (let i = 0; i < routeWaypoints.length; i++) {
                let prev = routeWaypoints[i - 1];
                let wp = routeWaypoints[i];
                let next = routeWaypoints[i + 1];
                if (wp) {
                    let prevAirway = IntersectionInfo.GetCommonAirway(prev, wp);
                    if (!prevAirway) {
                        allRows.push(["DIRECT", wp.ident]);
                        allWaypoints.push(wp);
                        allFPIndexes.push(fpIndexes[i]);
                    }
                    else {
                        allRows.push([prevAirway.name, wp.ident]);
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