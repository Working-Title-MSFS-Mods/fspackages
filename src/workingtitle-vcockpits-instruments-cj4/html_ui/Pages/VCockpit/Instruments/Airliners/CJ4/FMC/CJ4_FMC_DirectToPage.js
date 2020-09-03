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
        let waypointsCount = fmc.flightPlanManager.getWaypointsCount() + fmc.flightPlanManager.getArrivalWaypointsCount() + approachWaypointsCount;

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
        if (directWaypoint) {
            activateLine = "ACTIVATE>";
            fmc.onRightInput[5] = () => {
                fmc.activateDirectToWaypoint(directWaypoint, () => {
                    CJ4_FMC_RoutePage.ShowPage2(fmc);
                });
            };
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