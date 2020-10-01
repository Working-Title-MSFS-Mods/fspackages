class CJ4_FMC_LegsPage {
    static ShowPage1(fmc, currentPage = 1, directWaypoint) {
        fmc.clearDisplay();
        fmc.refreshPageCallback = () => {
            CJ4_FMC_LegsPage.ShowPage1(fmc, currentPage);
        };
        let pageCount = 1;
        if (directWaypoint) {
            fmc.inOut = directWaypoint.ident;
        }
        let rows = [
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
        let offset = Math.floor((currentPage - 1) * 5);
        if (fmc.flightPlanManager.getWaypoints() && !fmc.flightPlanManager.isActiveApproach()) {
            let enrouteWaypoints = [...fmc.flightPlanManager.getWaypoints()];
            let allWaypoints = "";
            if (fmc.flightPlanManager.getApproachWaypoints()) {
                let approachWaypoints = [...fmc.flightPlanManager.getApproachWaypoints()];
                enrouteWaypoints.pop();
                allWaypoints = enrouteWaypoints.concat(approachWaypoints);
            }
            else {
                allWaypoints = enrouteWaypoints;
            }
            let currentIndex = fmc.flightPlanManager.getActiveWaypointIndex();
            let waypoints = "";
            if (currentIndex <= 1) {
                waypoints = allWaypoints;
            }
            else if (currentIndex > 1) {
                waypoints = allWaypoints.splice(0, currentIndex - 1);
            }
            pageCount = Math.floor((waypoints.length - 1) / 5) + 1;
            for (let i = 0; i < 5; i++) {
                let waypointFPIndex = i + offset + 1;
                let waypoint = waypoints[i + offset];
                if (waypoint) {
                    let bearing = isFinite(waypoint.bearingInFP) ? waypoint.bearingInFP.toFixed(0).padStart(3, "0") + "°" : "";
                    let prevWaypoint = waypoints[i + offset - 1];
                    let distance = "0";
                    if (prevWaypoint) {
                        distance = "" + Math.trunc(Avionics.Utils.computeDistance(prevWaypoint.infos.coordinates, waypoint.infos.coordinates));
                    }
                    if (i == 0 && currentPage == 1) {
                        //rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM"];
                        rows[2 * i + 1] = [waypoint.ident != "" ? waypoint.ident + "[blue]" : "USR[blue]"];
                    }
                    else if (i == 1 && currentPage == 1) {
                        rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM[magenta]"];
                        rows[2 * i + 1] = [waypoint.ident != "" ? waypoint.ident + "[magenta]" : "USR[magenta]"];
                    }
                    else {
                        rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM"];
                        rows[2 * i + 1] = [waypoint.ident != "" ? waypoint.ident : "USR"];
                    }
                    let speedConstraint = "";
                    let altitudeConstraint = "FL";

                    if (waypoint.speedConstraint && waypoint.speedConstraint > 100) {
                        speedConstraint = waypoint.speedConstraint;
                    }

                    if (waypoint.legAltitudeDescription && waypoint.legAltitudeDescription !== 0) {
                        if (waypoint.legAltitudeDescription === 2 && waypoint.legAltitude1 > 100) {
                            altitudeConstraint = waypoint.legAltitude1.toFixed(0) > 18000 ? "FL" + waypoint.legAltitude1.toFixed(0)/100 + "A"
                            :waypoint.legAltitude1.toFixed(0) + "A";
                        }
                        else if (waypoint.legAltitudeDescription === 3 && waypoint.legAltitude1 > 100) {
                            altitudeConstraint = waypoint.legAltitude1.toFixed(0) > 18000 ? "FL" + waypoint.legAltitude1.toFixed(0)/100 + "B"
                            :waypoint.legAltitude1.toFixed(0) + "B";
                        }
                        else if (waypoint.legAltitudeDescription === 4 && waypoint.legAltitude1 > 100) {
                            altitudeConstraintA = waypoint.legAltitude1.toFixed(0) > 18000 ? "FL" + waypoint.legAltitude1.toFixed(0)/100 + "A"
                            :waypoint.legAltitude1.toFixed(0) + "A";
                            altitudeConstraintB = waypoint.legAltitude2.toFixed(0) > 18000 ? "FL" + waypoint.legAltitude2.toFixed(0)/100 + "B"
                            :waypoint.legAltitude2.toFixed(0) + "B";
                            altitudeConstraint = altitudeConstraintA + "/" + altitudeConstraintB;
                        }
                        else {
                            altitudeConstraint = "FL" + fmc.cruiseFlightLevel;
                        }
                    }
                    else {
                        altitudeConstraint = "FL" + fmc.cruiseFlightLevel;
                    }
                    rows[2 * i + 1][1] = speedConstraint + "/" + altitudeConstraint;
                }
                let directWaypoint = "";
                fmc.onLeftInput[i] = () => {
                    fmc.setMsg("Working...");
                    let value = fmc.inOut;
                    let fpIndex = currentPage == 1 ? fmc.flightPlanManager.getActiveWaypointIndex() + i - 1
                        : (currentPage - 1) * 5 + fmc.flightPlanManager.getActiveWaypointIndex() + i - 1;
                    console.log("index " + fpIndex);
                    if (value == "" && ((i > 1 && currentPage == 1) || (currentPage > 1))) {
                        directWaypoint = waypoint;
                        fmc.inOut = waypoint.ident;
                        CJ4_FMC_LegsPage.ShowPage1(fmc, 1, directWaypoint);
                    }
                    else if (directWaypoint && i == 1 && currentPage == 1) {
                        fmc._activatingDirectTo = true;
                        fmc._activatingDirectToExisting = true;
                        fmc.activateDirectToWaypoint(directWaypoint, () => {
                            fmc.flightPlanManager.setActiveWaypointIndex(1, () => {
                                fmc.activateRoute(() => {
                                    CJ4_FMC_LegsPage.ShowPage1(fmc)
                                });
                            });
                        });
                    }
                    else if (!fmc.flightPlanManager.isActiveApproach() && i == 1 && currentPage == 1) {
                        if (value !== "") {
                            fmc.fpHasChanged = true;
                            fmc._activatingDirectTo = true;
                            fmc.clearUserInput();
                            fmc.insertWaypoint(value, fpIndex, () => {
                                CJ4_FMC_LegsPage.ShowPage1(fmc);
                            });
                        }
                    }
                    else if (!fmc.flightPlanManager.isActiveApproach()) {
                        if (value === FMCMainDisplay.clrValue) {
                            console.log("delete");
                            fmc.clearUserInput();
                            fmc.removeWaypoint(fpIndex, () => {
                                fmc.setMsg();
                                CJ4_FMC_LegsPage.ShowPage1(fmc, currentPage);
                            });
                        } else if (value.length > 0) {
                            console.log("insert");
                            fmc.clearUserInput();
                            fmc.insertWaypoint(value, fpIndex, () => {
                                fmc.setMsg();
                                CJ4_FMC_LegsPage.ShowPage1(fmc, currentPage);
                            });
                        }
                    }
                    else {
                        fmc.setMsg("Unable del appr wpt");
                        console.log("unable");
                        CJ4_FMC_LegsPage.ShowPage1(fmc, currentPage);
                    }
                };
                if (fmc._activatingDirectTo == true) {
                    fmc.onExecPage = () => {
                        fmc.refreshPageCallback = () => {
                            fmc.setMsg("");
                            fmc.fpHasChanged = false;
                            fmc.onLegs();
                        };
                        if (fmc._activatingDirectToExisting = false) {
                            directWaypoint = fmc.flightPlanManager.getActiveWaypoint();
                            fmc.activateDirectToWaypoint(directWaypoint, () => {
                                fmc.flightPlanManager.setActiveWaypointIndex(1, () => {
                                    fmc.activateRoute(() => {
                                        fmc.onExecDefault();
                                    });
                                });
                            });
                        }
                        else if (fmc._activatingDirectToExisting = true) {
                            fmc.onExecDefault();
                        }
                    }
                }
                else {
                    fmc.onExecPage = () => {
                        if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                            if (!fmc.getIsRouteActivated()) {
                                fmc.activateRoute();
                                activateCell = "";
                            }
                            fmc.onExecDefault();
                            fmc.refreshPageCallback = () => CJ4_FMC_RoutePage.ShowPage1(fmc);
                        } else {
                            fmc._isRouteActivated = false;
                            fmc.fpHasChanged = false;
                            fmc.setMsg();
                            fmc._activatingDirectTo = false;
                        }
                    };
                }
            }
        }
        else if (fmc.flightPlanManager.isActiveApproach()) {
            let enrouteWaypoints = [...fmc.flightPlanManager.getWaypoints()];
            enrouteWaypoints.pop();
            let lastWaypointIndex = enrouteWaypoints.length - 1;
            if (fmc.flightPlanManager.getApproachWaypoints()) {
                let approachWaypoints = [...fmc.flightPlanManager.getApproachWaypoints()];
                let lastEnrouteWaypoint = enrouteWaypoints.slice(lastWaypointIndex);
                let allWaypoints = lastEnrouteWaypoint.concat(approachWaypoints);
            }
            let currentIndex = fmc.flightPlanManager.getActiveWaypointIndex();
            if (currentIndex == 1) {
                let waypoints = allWaypoints;
            }
            else if (currentIndex > 1) {
                let waypoints = allWaypoints.splice(0, currentIndex - 1);
            }
            pageCount = Math.floor((waypoints.length - 1) / 5) + 1;
            for (let i = 0; i < 5; i++) {
                let waypointFPIndex = i + offset + 1;
                let waypoint = waypoints[i + offset];
                if (waypoint) {
                    let bearing = isFinite(waypoint.bearingInFP) ? waypoint.bearingInFP.toFixed(0).padStart(3, "0") + "°" : "";
                    let prevWaypoint = waypoints[i + offset - 1];
                    let distance = "0";
                    if (prevWaypoint) {
                        distance = "" + Math.trunc(Avionics.Utils.computeDistance(prevWaypoint.infos.coordinates, waypoint.infos.coordinates));
                    }
                    if (i == 0 && currentPage == 1) {
                        //rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM"];
                        rows[2 * i + 1] = [waypoint.ident != "" ? waypoint.ident + "[blue]" : "USR[blue]"];
                    }
                    else if (i == 1 && currentPage == 1) {
                        rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM[magenta]"];
                        rows[2 * i + 1] = [waypoint.ident != "" ? waypoint.ident + "[magenta]" : "USR[magenta]"];
                    }
                    else {
                        rows[2 * i] = [" " + bearing.padStart(3, "0") + " " + distance.padStart(4, " ") + "NM"];
                        rows[2 * i + 1] = [waypoint.ident != "" ? waypoint.ident : "USR"];
                    }
                    let speedConstraint = "";
                    let altitudeConstraint = "FL";
                    if (waypoint.speedConstraint && waypoint.speedConstraint > 100) {
                        speedConstraint = waypoint.speedConstraint;
                    }
                    if (waypoint.legAltitudeDescription && waypoint.legAltitudeDescription !== 0) {
                        if (waypoint.legAltitudeDescription === 2 && waypoint.legAltitude1 > 100) {
                            altitudeConstraint = waypoint.legAltitude1.toFixed(0) > 18000 ? "FL" + waypoint.legAltitude1.toFixed(0)/100 + "A"
                            :waypoint.legAltitude1.toFixed(0) + "A";
                        }
                        else if (waypoint.legAltitudeDescription === 3 && waypoint.legAltitude1 > 100) {
                            altitudeConstraint = waypoint.legAltitude1.toFixed(0) > 18000 ? "FL" + waypoint.legAltitude1.toFixed(0)/100 + "B"
                            :waypoint.legAltitude1.toFixed(0) + "B";
                        }
                        else if (waypoint.legAltitudeDescription === 4 && waypoint.legAltitude1 > 100) {
                            altitudeConstraintA = waypoint.legAltitude1.toFixed(0) > 18000 ? "FL" + waypoint.legAltitude1.toFixed(0)/100 + "A"
                            :waypoint.legAltitude1.toFixed(0) + "A";
                            altitudeConstraintB = waypoint.legAltitude2.toFixed(0) > 18000 ? "FL" + waypoint.legAltitude2.toFixed(0)/100 + "B"
                            :waypoint.legAltitude2.toFixed(0) + "B";
                            altitudeConstraint = altitudeConstraintA + "/" + altitudeConstraintB;
                        }
                        else {
                            altitudeConstraint = "FL" + fmc.cruiseFlightLevel;
                        }
                    }
                    else {
                        altitudeConstraint = "FL" + fmc.cruiseFlightLevel;
                    }
                    rows[2 * i + 1][1] = speedConstraint + "/" + altitudeConstraint;
                }
                fmc.onLeftInput[i] = () => {
                    fmc.setMsg("Working...");
                    let value = fmc.inOut;
                    let fpIndex = currentPage == 1 ? fmc.flightPlanManager.getActiveWaypointIndex() + i - 1
                        : (currentPage - 1) * 5 + fmc.flightPlanManager.getActiveWaypointIndex() + i - 1;
                    console.log("index " + fpIndex);
                    if (!fmc.flightPlanManager.isActiveApproach() && i == 1 && currentPage == 1) {
                        if (value !== "") {
                            fmc.fpHasChanged = true;
                            fmc.clearUserInput();
                            fmc.getOrSelectWaypointByIdent(value, (w) => {
                                if (w) {
                                    CJ4_FMC_LegsPage.ShowPage2(fmc, w);
                                }
                            });
                        }
                    }
                    else if (!fmc.flightPlanManager.isActiveApproach()) {
                        if (value === FMCMainDisplay.clrValue) {
                            fmc.clearUserInput();
                            fmc.removeWaypoint(fpIndex, () => {
                                fmc.setMsg();
                                CJ4_FMC_LegsPage.ShowPage1(fmc, currentPage);
                            });
                        } else if (value.length > 0) {
                            fmc.clearUserInput();
                            fmc.insertWaypoint(value, fpIndex, () => {
                                fmc.setMsg();
                                CJ4_FMC_LegsPage.ShowPage1(fmc, currentPage);
                            });
                        }
                    }
                    else {
                        fmc.setMsg("Unable del appr wpt");
                        console.log("unable");
                        CJ4_FMC_LegsPage.ShowPage1(fmc, currentPage);
                    }
                };
            }          
        }
        let lsk6Field = "";
        if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            fmc.fpHasChanged = true;
            lsk6Field = "<CANCEL MOD"
        }
        fmc.onLeftInput[5] = () => {
            if (lsk6Field == "<CANCEL MOD") {
                if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                    fmc.fpHasChanged = false;
                    fmc.eraseTemporaryFlightPlan(() => { CJ4_FMC_LegsPage.ShowPage1(fmc, currentPage) });
                }
            }
        };

        let modStr = fmc.fpHasChanged ? "MOD[white]" : "ACT[blue]";

        fmc._templateRenderer.setTemplateRaw([
            [" " + modStr + " LEGS[blue]", currentPage.toFixed(0) + "/" + Math.max(1, pageCount.toFixed(0)) + " [blue]"],
            ...rows,
            ["-------------------------"],
            [lsk6Field + "", "LEG WIND>"]
        ]);

        fmc.refreshPageCallback = () => {
            console.log("fmc.pageUpdate");
            CJ4_FMC_LegsPage.ShowPage1(fmc);
        }
       
        fmc.onPrevPage = () => {
            if (currentPage > 1) {
                CJ4_FMC_LegsPage.ShowPage1(fmc, currentPage - 1);
            }
        };
        fmc.onNextPage = () => {
            if (currentPage < pageCount) {
                CJ4_FMC_LegsPage.ShowPage1(fmc, currentPage + 1);
            }
        };
    }
}
    


CJ4_FMC_LegsPage.DEBUG_SHOW_WAYPOINT_PHASE = false;
//# sourceMappingURL=CJ4_FMC_LegsPage.js.map