class CJ4_FMC_DirectToPage {
    static ShowPage(fmc, directWaypoint, wptsListIndex = 0) {
        fmc.clearDisplay();
        let directWaypointCell = " ";
        if (directWaypoint) {
            directWaypointCell = directWaypoint.ident;
        }
        else if (fmc.flightPlanManager.getDirectToTarget()) {
            directWaypointCell = fmc.flightPlanManager.getDirectToTarget().ident;
        }
        let waypointsCell = ["", "", "", "", ""];
        let iMax = 5;
        fmc.onLeftInput[0] = () => {
            let value = fmc.inOut;
            fmc.clearUserInput();
            fmc.getOrSelectWaypointByIdent(value, (w) => {
                if (w) {
                    CJ4_FMC_DirectToPage.ShowPage(fmc, w, wptsListIndex);
                }
            });
        };
        let i = 0;

        //Get total count of waypoints, including arrival and approach waypoints
        let approachWaypointsCount = fmc.flightPlanManager.getApproachWaypoints().length;
        let waypointsCount = fmc.flightPlanManager.getWaypointsCount() + approachWaypointsCount;
        
        //temporary
        console.log("idx:" + fmc.flightPlanManager.getActiveWaypointIndex());
        console.log("wpts:" + fmc.flightPlanManager.getWaypointsCount());
        console.log("app:" + approachWaypointsCount);
        console.log("arr:" + fmc.flightPlanManager.getArrivalWaypointsCount());
        console.log("tot:" + waypointsCount);
        console.log("appidx:" + fmc.flightPlanManager.getApproachIndex());
        console.log("app loaded?:" + fmc.flightPlanManager.isLoadedApproach());
        console.log("app active?:" + fmc.flightPlanManager.isActiveApproach());        

        while (i < waypointsCount && i + wptsListIndex < waypointsCount && i < iMax) {
            let waypoint = fmc.flightPlanManager.getWaypoint(i + wptsListIndex, NaN, true);
            if (waypoint) {
                waypointsCell[i] = "←" + waypoint.ident + "[color]blue";
                if (waypointsCell[i]) {
                    fmc.onLeftInput[i + 1] = () => {
                        CJ4_FMC_DirectToPage.ShowPage(fmc, waypoint, wptsListIndex);
                    };
                }
            }
            else {
                waypointsCell[i] = "----";
            }
            i++;
        }
        if (i < iMax) {
            waypointsCell[i] = "--END--";
        }
        let activateLine = "";

        //start of CWB edits for DTO approach waypoints

        //determine the index of the DTO approach wpt
        //const getAppIndexByIdent = (ident) => {
        //    return fmc.flightPlanManager.getApproachWaypoints()
        //      .reduce((indexSeen, waypoint, currentIndex) => waypoint.ident === ident ? currentIndex : indexSeen, -1);
        //  };

        if (directWaypoint) {
            activateLine = "ACTIVATE>";
            fmc.onRightInput[5] = () => {
                
            let isApproachWaypoint = fmc.flightPlanManager.getApproachWaypoints().indexOf(directWaypoint) !== -1;
            console.log("dto apr wpt?" + isApproachWaypoint);

            //is this waypoint an approach waypoint? if so, perform these steps, otherwise proceed to regular DTO function.
            //added isActiveApproach() condition
            if (isApproachWaypoint == true && fmc.flightPlanManager.isActiveApproach() != true) {

                console.log("Running Approach Waypoint = True"); //log if we are running this code
                console.log("idx:" + fmc.flightPlanManager.getActiveWaypointIndex()); //log active waypoint index
                //temporary log to see current flight plan
                let waypointslog = fmc.flightPlanManager.getWaypoints().map(waypoint => waypoint.ident);
                console.log("fpln before mod:" + JSON.stringify(waypointslog, null, 2));
                console.log("directWaypoint ICAO" + directWaypoint.icao);

                //trying to build an alternate of fmc.activateDirectToWaypoint which deletes all enroute waypoints,
                //then tries to activate the approach

                let fplnWaypoints = fmc.flightPlanManager.getWaypoints().length;
                console.log("fplnWaypints:" + fplnWaypoints)

                let removeWaypointForApproachMethod = (callback = EmptyCallback.Void) => {
                    let i = 1;
                    let destinationIndex = fmc.flightPlanManager.getWaypoints().findIndex(w => {
                        return w.icao === fmc.flightPlanManager.getDestination().icao;
                    });
                    console.log("destinationIndex:" + destinationIndex);
                    if (i < destinationIndex) {
                        fmc.flightPlanManager.removeWaypoint(1, i === destinationIndex, () => {
                            //i++;
                            removeWaypointForApproachMethod(callback);
                        });
                        fmc.flightPlanManager.setCurrentFlightPlanIndex(1);
                    }
                    else {
                        callback();
                    }
                };
                removeWaypointForApproachMethod(() => {
                    fmc.flightPlanManager.tryAutoActivateApproach();
                    CJ4_FMC_RoutePage.ShowPage2(fmc);
                });


                //adding this approach waypoint to the end of the current enroute flight plan
                //fmc.insertWaypoint(directWaypoint.ident, fmc.flightPlanManager.getEnRouteWaypointsLastIndex() + 1);
                
                //fmc.flightPlanManager.addWaypoint(directWaypoint.icao, Infinity, () => { }, true);
                
                //fmc.activateRoute();
                //temporary log to see flight plan after insert
                //let waypointsNew = fmc.flightPlanManager.getWaypoints().map(waypoint => waypoint.ident);
                //console.log("fpln after mod:" + JSON.stringify(waypointsNew, null, 2));
                
                //get new last enroute waypoint and activate DTO
                //let newDirectWaypoint = fmc.flightPlanManager.getWaypoint(fmc.flightPlanManager.getEnRouteWaypointsLastIndex(), NaN, false);
                
                //activate approach callback
                //fmc.activateDirectToWaypoint(newDirectWaypoint, () => {
                //    fmc.flightPlanManager.activateApproach();
                //});
                //fmc.flightPlanManager.tryAutoActivateApproach();
                //console.log("app active now?:" + fmc.flightPlanManager.isActiveApproach());
                //console.log("idx:" + fmc.flightPlanManager.getActiveWaypointIndex());

                //let dtoApproachIndex = getAppIndexByIdent(directWaypoint.ident); //get the approach index of the DTO wpt

                //fmc.flightPlanManager.setApproachIndex(dtoApproachIndex); //set the approach index to the selected dto wpt
                
                //fmc.flightPlanManager.setActiveWaypointIndex(1);
                //console.log("after setting index 1, app active now?:" + fmc.flightPlanManager.isActiveApproach());
                //console.log("idx:" + fmc.flightPlanManager.getActiveWaypointIndex());

            }             
            //new method for direct to during an approach
            if (isApproachWaypoint == true && fmc.flightPlanManager.isActiveApproach() == true) {

                console.log("Running Approach Waypoint With Active Approach = True"); //log if we are running this code
                console.log("idx:" + fmc.flightPlanManager.getActiveWaypointIndex()); //log active waypoint index
                //temporary log to see current flight plan
                let waypointslog = fmc.flightPlanManager.getWaypoints().map(waypoint => waypoint.ident);
                console.log("fpln before mod:" + JSON.stringify(waypointslog, null, 2));
                console.log("directWaypoint ICAO" + directWaypoint.icao);
                let apprwaypointslog = fmc.flightPlanManager.getApproachWaypoints().map(waypoint => waypoint.ident);
                console.log("appr fpln before mod:" + JSON.stringify(apprwaypointslog, null, 2));

                let fplnWaypoints = fmc.flightPlanManager.getWaypoints().length;
                console.log("fplnWaypints:" + fplnWaypoints)

                let apprWaypoints = fmc.flightPlanManager.getApproachWaypoints().length;
                console.log("apprWaypoints:" + apprWaypoints)

                let removeWaypointInApproachMethod = (callback = EmptyCallback.Void) => {
                    let i = 1;
                    let directToApprIndex = fmc.flightPlanManager.getApproachWaypoints().findIndex(w => {
                        return w.icao === directWaypoint.icao;
                    });
                    console.log("directToApprIndex:" + directToApprIndex);
                    let directToinFplnIndex = fmc.flightPlanManager.getWaypoints().findIndex(w => {
                        return w.icao === directWaypoint.icao;
                    });
                    console.log("directToinFplnIndex:" + directToinFplnIndex);
                    if (i < directToinFplnIndex) {
                        fmc.flightPlanManager.removeWaypoint(1, i === destinationIndex, () => {
                            //i++;
                            removeWaypointInApproachMethod(callback);
                        });
                        fmc.flightPlanManager.setCurrentFlightPlanIndex(1);
                    }
                    else {
                        callback();
                    }
                };
                removeWaypointInApproachMethod(() => {
                    fmc.flightPlanManager.tryAutoActivateApproach();
                    CJ4_FMC_RoutePage.ShowPage2(fmc);
                });


                //adding this approach waypoint to the end of the current enroute flight plan
                //fmc.insertWaypoint(directWaypoint.ident, fmc.flightPlanManager.getEnRouteWaypointsLastIndex() + 1);
                
                //fmc.flightPlanManager.addWaypoint(directWaypoint.icao, Infinity, () => { }, true);
                
                //fmc.activateRoute();
                //temporary log to see flight plan after insert
                //let waypointsNew = fmc.flightPlanManager.getWaypoints().map(waypoint => waypoint.ident);
                //console.log("fpln after mod:" + JSON.stringify(waypointsNew, null, 2));
                
                //get new last enroute waypoint and activate DTO
                //let newDirectWaypoint = fmc.flightPlanManager.getWaypoint(fmc.flightPlanManager.getEnRouteWaypointsLastIndex(), NaN, false);
                
                //activate approach callback
                //fmc.activateDirectToWaypoint(newDirectWaypoint, () => {
                //    fmc.flightPlanManager.activateApproach();
                //});
                //fmc.flightPlanManager.tryAutoActivateApproach();
                //console.log("app active now?:" + fmc.flightPlanManager.isActiveApproach());
                //console.log("idx:" + fmc.flightPlanManager.getActiveWaypointIndex());

                //let dtoApproachIndex = getAppIndexByIdent(directWaypoint.ident); //get the approach index of the DTO wpt

                //fmc.flightPlanManager.setApproachIndex(dtoApproachIndex); //set the approach index to the selected dto wpt
                
                //fmc.flightPlanManager.setActiveWaypointIndex(1);
                //console.log("after setting index 1, app active now?:" + fmc.flightPlanManager.isActiveApproach());
                //console.log("idx:" + fmc.flightPlanManager.getActiveWaypointIndex());

            }
               else {
                fmc.activateDirectToWaypoint(directWaypoint, () => {
                    CJ4_FMC_RoutePage.ShowPage2(fmc);
                })
            }
            };

            //end of CWB edits for DTO approach waypoints

        }
        

        fmc.setTemplate([
            ["DIR TO"],
            ["WAYPOINT", "DIST", "UTC"],
            ["[" + directWaypointCell + "][color]blue", "---", "----"],
            ["F-PLN WPTS"],
            [waypointsCell[0], "DIRECT TO[color]blue"],
            ["", "WITH"],
            [waypointsCell[1], "ABEAM PTS[color]blue"],
            ["", "RADIAL IN"],
            [waypointsCell[2], "[ ]°[color]blue"],
            ["", "RADIAL OUT"],
            [waypointsCell[3], "[ ]°[color]blue"],
            [""],
            [waypointsCell[4], activateLine]
        ]);
        fmc.onNextPage = () => {
            wptsListIndex++;
            wptsListIndex = Math.min(wptsListIndex, fmc.flightPlanManager.getWaypointsCount() - 4);
            CJ4_FMC_DirectToPage.ShowPage(fmc, directWaypoint, wptsListIndex);
        };
        fmc.onPrevPage = () => {
            wptsListIndex--;
            wptsListIndex = Math.max(wptsListIndex, 0);
            CJ4_FMC_DirectToPage.ShowPage(fmc, directWaypoint, wptsListIndex);
        };
    }
}
//# sourceMappingURL=CJ4_FMC_DirectToPage.js.map