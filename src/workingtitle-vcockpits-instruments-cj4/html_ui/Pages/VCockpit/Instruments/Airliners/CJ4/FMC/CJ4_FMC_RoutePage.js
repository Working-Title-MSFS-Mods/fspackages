class CJ4_FMC_RoutePage {
    static ShowPage1(fmc, pendingAirway) {
        fmc.clearDisplay();

        //temporary to check flight plan index

        // fmc.onLeftInput[1] = () => {
        //     let value = "";
        //     Coherent.call("GET_CURRENT_FLIGHTPLAN_INDEX").then((value) => {
        //         console.log("GET_CURRENT_FLIGHTPLAN_INDEX_COHERENT: " + value);
        //         console.log("fmc.flightPlanManager._currentFlightPlanIndex: " + fmc.flightPlanManager._currentFlightPlanIndex);
        //         console.log("fmc.fpHasChanged: " + fmc.fpHasChanged);
        //         console.log("this._activatingDirectTo: " + fmc._activatingDirectTo)
        //     });
        // };

        //end temp
        let lsk6Field = "<SEC FPLN";

        let setDestinationFunc = (icao) => {
            fmc.updateRouteDestination(icao, (result) => {
                if (result) {
                    fmc.flightPlanManager.setApproachTransitionIndex(-1, () => {
                        fmc.flightPlanManager.setArrivalProcIndex(-1, () => {
                            fmc.flightPlanManager.setApproachIndex(-1, () => {
                                fmc.setMsg();
                                fmc.fpHasChanged = true;
                                CJ4_FMC_RoutePage.ShowPage1(fmc);
                            });
                        });
                    });
                }
            });
        };

        let setOriginFunc = (icao) => {
            if(!SimVar.GetSimVarValue("SIM ON GROUND", "boolean"))
            {
                fmc.showErrorMessage("NOT ON GROUND");
                return;
            }

            fmc.tmpDestination = undefined;
            fmc.flightPlanManager.createNewFlightPlan(() => {
                fmc.updateRouteOrigin(icao, (result) => {
                    if (result) {
                        fmc.setMsg();
                        fmc.fpHasChanged = true;
                        CJ4_FMC_RoutePage.ShowPage1(fmc);
                    }
                });
            });
        };

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
            fmc.setMsg("Working...");
            let value = fmc.inOut;
            fmc.clearUserInput();
            setOriginFunc(value);
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
            fmc.setMsg("Working...");
            let value = fmc.inOut;
            fmc.clearUserInput();
            setDestinationFunc(value);
        };
        let distanceCell = "----";
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
        // let coRouteCell = "--------";
        // if (fmc.coRoute) {
        //     coRouteCell = fmc.coRoute;
        // }
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
                    fmc.onRightInput[3] = () => {
                        fmc.setMsg("Working...");
                        let value = fmc.inOut;
                        if (value === FMCMainDisplay.clrValue) {
                            fmc.clearUserInput();
                            fmc.removeWaypoint(1, () => {
                                fmc.setMsg();
                                CJ4_FMC_RoutePage.ShowPage1(fmc);
                            });
                        } else if (value.length > 0) {
                            fmc.clearUserInput();
                            fmc.insertWaypoint(value, 1, (isSuccess) => {
                                if (isSuccess) {
                                    fmc.setMsg();
                                    CJ4_FMC_RoutePage.ShowPage1(fmc);
                                } else {
                                    fmc.fpHasChanged = false;
                                    fmc.eraseTemporaryFlightPlan(() => { CJ4_FMC_RoutePage.ShowPage1(fmc); });
                                }
                            });
                        } else {
                            fmc.setMsg();
                        }
                    };
                    fmc.onLeftInput[3] = () => {
                        let value = fmc.inOut;
                        if (value.length > 0) {
                            fmc.clearUserInput();
                            fmc.ensureCurrentFlightPlanIsTemporary(() => {
                                let lastWaypoint = fmc.flightPlanManager.getWaypoints()[fmc.flightPlanManager.getEnRouteWaypointsLastIndex()];
                                if (lastWaypoint.infos instanceof WayPointInfo) {
                                    lastWaypoint.infos.UpdateAirway(value).then(() => {
                                        let airway = lastWaypoint.infos.airways.find(a => { return a.name === value; });
                                        if (airway) {
                                            lastWaypoint.infos.airwayOut = airway.name;
                                            CJ4_FMC_RoutePage.ShowPage1(fmc, airway);
                                        }
                                        else {
                                            fmc.showErrorMessage("NOT IN DATABASE");
                                        }
                                    });
                                }
                            });
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
            lsk6Field = "<CANCEL MOD";
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
                fmc.setMsg();
                console.log("onExec else fmc.setMsg");
                fmc._activatingDirectTo = false;
                console.log("onExec else this._activatingDirectTo = false");
            }
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
                    fmc.eraseTemporaryFlightPlan(() => { CJ4_FMC_RoutePage.ShowPage1(fmc); });
                }
            }
        };

        //end of CWB edited activation and exec handling

        let modStr = fmc.fpHasChanged ? "MOD[white]" : "ACT[blue]";

        fmc._templateRenderer.setTemplateRaw([
            [" " + modStr + " FPLN[blue]", "1/" + pageCount + " [blue]"],
            [" ORIGIN[blue]", "DEST[blue] ", "DIST[blue]"],
            [originCell, destinationCell, distanceCell],
            [" ROUTE[blue]", "ALTN[blue] "],
            ["----------", "----"],
            ["", "ORIG RWY[blue] "],
            [""],
            [" VIA[blue]", "TO[blue] "],
            rows[0],
            ["----------------[blue]", "FLT NO[blue] "],
            ["", flightNoCell],
            [""],
            [lsk6Field, activateCell]
        ]);

        fmc.onNextPage = () => {
            CJ4_FMC_RoutePage.ShowPage2(fmc);
        };
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

                // TODO this is just a quickfix for index when departure is loaded, its ugly though
                // let departure = fmc.flightPlanManager.getDeparture();
                // if (departure) { fpIndex--; }

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
                            fmc.insertWaypoint(value, fmc.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, (isSuccess) => {
                                if (isSuccess) {
                                    fmc.setMsg();
                                    CJ4_FMC_RoutePage.ShowPage2(fmc, offset);
                                } else {
                                    fmc.fpHasChanged = false;
                                    fmc.eraseTemporaryFlightPlan(() => { CJ4_FMC_RoutePage.ShowPage2(fmc, offset); });
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

        fmc._templateRenderer.setTemplateRaw([
            [" " + modStr + " FPLN[blue]", page + "/" + pageCount + " [blue]"],
            ["VIA[s-text blue]", "TO[s-text blue]"],
            rows[0],
            [""],
            rows[1],
            [""],
            rows[2],
            [""],
            rows[3],
            [""],
            rows[4],
            ["-----------------------[blue]"],
            [lsk6Field, activateCell]
        ]);
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