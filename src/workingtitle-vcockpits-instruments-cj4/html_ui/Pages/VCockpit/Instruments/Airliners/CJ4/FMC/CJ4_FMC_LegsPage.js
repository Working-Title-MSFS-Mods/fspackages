class CJ4_FMC_LegsPage {
    static ShowPage1(fmc, currentPage = 1, step = 0) {
        fmc.clearDisplay();
        fmc.refreshPageCallback = () => {
            CJ4_FMC_LegsPage.ShowPage1(fmc, currentPage, step);
        };
        let pageCount = 1;
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
        let flightPlanManagerWaypoints = fmc.flightPlanManager.getWaypoints();
        if (flightPlanManagerWaypoints) {
            console.log("flightPlanManagerWaypoints = true");
            let waypoints = [...fmc.flightPlanManager.getWaypoints()];
            let firstApproachWaypointIndex = waypoints.length;
            let approachWaypoints = fmc.flightPlanManager.getApproachWaypoints();
            if (waypoints.length > 2 || approachWaypoints) {
                console.log("waypoints.length > 2");
                waypoints.splice(0, 1);
                waypoints.pop();
                //let firstApproachWaypointIndex = waypoints.length;
                //let approachWaypoints = fmc.flightPlanManager.getApproachWaypoints();
                for (let i = 0; i < approachWaypoints.length; i++) {
                    let approachWaypoint = approachWaypoints[i];
                    let lastWaypoint = waypoints[waypoints.length - 1];
                    if (lastWaypoint === undefined || lastWaypoint.icao != approachWaypoint.icao) {
                        waypoints.push(approachWaypoints[i]);
                    }
                }
                pageCount = Math.floor((waypoints.length - 1) / 5) + 1;
                for (let i = 0; i < 5; i++) {
                    let waypointFPIndex = i + offset + 1;
                    let waypoint = waypoints[i + offset];
                    if (waypoint) {
                        let prevWaypoint = fmc.flightPlanManager.getWaypoint(waypointFPIndex - 1, undefined, true);
                        let nextWaypoint = fmc.flightPlanManager.getWaypoint(waypointFPIndex + 1, undefined, true);
                        let isEnRouteWaypoint = false;
                        let isDepartureWaypoint = false;
                        let isLastDepartureWaypoint = false;
                        let isArrivalWaypoint = false;
                        let isFirstArrivalWaypoint = false;
                        let isApproachWaypoint = false;
                        if (i + offset >= fmc.flightPlanManager.getDepartureWaypointsCount()) {
                            if (i + offset < fmc.flightPlanManager.getEnRouteWaypointsLastIndex()) {
                                isEnRouteWaypoint = true;
                            }
                            else {
                                if (i + offset < firstApproachWaypointIndex) {
                                    if (waypointFPIndex === fmc.flightPlanManager.getEnRouteWaypointsLastIndex() + 1) {
                                        isFirstArrivalWaypoint = true;
                                    }
                                    isArrivalWaypoint = true;
                                }
                                else {
                                    isApproachWaypoint = true;
                                }
                            }
                        }
                        else {
                            if (waypointFPIndex === fmc.flightPlanManager.getDepartureWaypointsCount()) {
                                isLastDepartureWaypoint = true;
                            }
                            isDepartureWaypoint = true;
                        }
                        let bearing = isFinite(waypoint.bearingInFP) ? waypoint.bearingInFP.toFixed(0) + "°" : "";
                        let distance = isFinite(waypoint.cumulativeDistanceInFP) ? waypoint.cumulativeDistanceInFP.toFixed(0) + "NM" : "";
                        
                        //temporary log to see current flight plan
                        let waypointsLog = waypoints.map(waypoint => waypoint.ident);
			            console.log("fpln:" + JSON.stringify(waypointsLog, null, 2));
                        
                        rows[2 * i] = [bearing, distance];
                        rows[2 * i + 1] = [waypoint.ident != "" ? waypoint.ident : "USR"];
                        if (CJ4_FMC_LegsPage.DEBUG_SHOW_WAYPOINT_PHASE) {
                            if (isDepartureWaypoint) {
                                rows[2 * i + 1][0] += " [DP]";
                                if (isLastDepartureWaypoint) {
                                    rows[2 * i + 1][0] += "*";
                                }
                            }
                            else if (isEnRouteWaypoint) {
                                rows[2 * i + 1][0] += " [ER]";
                            }
                            else if (isArrivalWaypoint) {
                                rows[2 * i + 1][0] += " [AR]";
                                if (isFirstArrivalWaypoint) {
                                    rows[2 * i + 1][0] += "*";
                                }
                            }
                            else if (isApproachWaypoint) {
                                rows[2 * i + 1][0] += " [AP]";
                            }
                        }
                        //edit to remove fmc.getCrzManagedSpeed() for enroute waypoints and show only cruise flight level
						if (isEnRouteWaypoint) {
                            rows[2 * i + 1][1] = "/ FL" + fmc.cruiseFlightLevel;
                        }
                        else {
                            //edit to remove calculated speed constraints and only show published constraints above 100 kts
                            let speedConstraint = "---";
                            if (waypoint.speedConstraint > 100) {
                                speedConstraint = waypoint.speedConstraint.toFixed(0);
                            }
							else {
                                    speedConstraint = " ";
                            }
                            let altitudeConstraint = "-----";
                            if (waypoint.legAltitudeDescription !== 0) {
                                //removed because it was causing erronious arrivial transition fix altitude constraints
								//if (waypoint.legAltitudeDescription === 1 && waypoint.legAltitude1 > 100) {
                                //    altitudeConstraint = "FL" + (waypoint.legAltitude1 / 100).toFixed(0);
                                //}
                                if (waypoint.legAltitudeDescription === 2 && waypoint.legAltitude1 > 100) {
                                    altitudeConstraint = waypoint.legAltitude1.toFixed(0) + "A";
                                }
                                else if (waypoint.legAltitudeDescription === 3 && waypoint.legAltitude1 > 100) {
                                    altitudeConstraint = waypoint.legAltitude1.toFixed(0) + "B";
                                }
                                else if (waypoint.legAltitudeDescription === 4 && waypoint.legAltitude1 > 100) {
                                    altitudeConstraint = "FL" + ((waypoint.legAltitude1 + waypoint.legAltitude2) * 0.5 / 100).toFixed(0);
                                }
                            }
                            else if (isDepartureWaypoint) {
                                if (isLastDepartureWaypoint) {
                                    altitudeConstraint = "FL" + fmc.cruiseFlightLevel;
                                }
                                //else {
                                //    altitudeConstraint = Math.floor(waypoint.cumulativeDistanceInFP * 0.14 * 6076.118 / 10).toFixed(0) + "0";
                                //}
                            }
							//added to make cruise altitude default constraint
                            else {
                                    altitudeConstraint = "FL" + fmc.cruiseFlightLevel;
                                //else {
                                //    altitudeConstraint = Math.floor(waypoint.cumulativeDistanceInFP * 0.14 * 6076.118 / 10).toFixed(0) + "0";
                                //}
                            }
                            //else {
                            //    if (isLastDepartureWaypoint || isFirstArrivalWaypoint) {
                            //        altitudeConstraint = "FL" + fmc.cruiseFlightLevel;
                            //    }
                            //}
                            rows[2 * i + 1][1] = speedConstraint + "/ " + altitudeConstraint;
                        }
                    }
                }
            }
        }
        fmc.currentFlightPlanWaypointIndex = offset + step + 1;
        let isMapModeRose = SimVar.GetSimVarValue("L:CJ4_MAP_MODE", "number") === 1;
        if (isMapModeRose) {
            if (rows[2 * step + 1][0] != "") {
                if (!rows[2 * step + 1][1]) {
                    rows[2 * step + 1][1] = "";
                }
                rows[2 * step + 1][2] = "<CTR>";
            }
            else {
                return CJ4_FMC_LegsPage.ShowPage1(fmc, 1, 0);
            }
            fmc.onRightInput[5] = () => {
                let newStep = step + 1;
                let newPage = currentPage;
                if (newStep > 4) {
                    newStep = 0;
                    newPage++;
                }
                if (newPage > pageCount) {
                    newPage = 1;
                }
                CJ4_FMC_LegsPage.ShowPage1(fmc, newPage, newStep);
            };
        }
        fmc.setTemplate([
            ["ACT RTE 1 LEGS", currentPage.toFixed(0), pageCount.toFixed(0)],
            ...rows,
            ["--------------------------"],
            ["<RTE 2 LEGS", isMapModeRose ? "STEP>" : "RTE DATA>"]
        ]);
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