class CJ4_FMC_FplnRecallPage {
    static async GetFplnFromSimBrief(pilotId, fmc) {
        let url = "https://www.simbrief.com/api/xml.fetcher.php?userid=" + pilotId + "&json=1";
        let json = "";
        let called = 0;

        // HINT: defining these methods here in the order they will be called by the callbacks
        let updateFrom = () => {
            console.log("UPDATE FROMTO");
            let from = json.origin.icao_code;
            // fmc.tryUpdateFromTo(json.origin.icao_code + "/" + json.destination.icao_code, updateRunways);
            fmc.eraseTemporaryFlightPlan(() => {
                fmc.flightPlanManager.clearFlightPlan(() => {
                    fmc.ensureCurrentFlightPlanIsTemporary(() => {
                        fmc.updateRouteOrigin(from, updateRunways);
                    });
                });
            });
        };

        let updateRunways = () => {
            called++;
            if (called < 2) return;
            console.log("UPDATE RUNWAY");
            fmc.setOriginRunway(json.origin.plan_rwy, updateDestination);
        };

        let updateDestination = () => {
            console.log("UPDATE DESTINATION");
            let dest = json.destination.icao_code;
            fmc.updateRouteDestination(dest, updateRoute);
        };

        let updateRoute = () => {
            let routeArr = json.general.route.split(' ');
            console.log("UPDATE ROUTE");
            let idx = 1; // TODO starting from 1 to skip departure trans for now

            let addWaypoint = async () => {
                if (idx >= routeArr.length - 1) {
                    // DONE
                    fmc.setMsg("DONE");
                    fmc.flightPlanManager.setActiveWaypointIndex(1);
                    return;
                }
                let icao = routeArr[idx];
                let isWaypoint = await fmc.dataManager.IsWaypointValid(icao);
                idx++;
                if (icao === "DCT") { // skip this
                    addWaypoint();
                    return;
                }

                let wptIndex = fmc.flightPlanManager.getWaypointsCount() - 1;
                console.log("MOD INDEX " + wptIndex);

                if (isWaypoint) {
                    // should be a normal waypoint then
                    console.log("adding as waypoint " + icao);
                    fmc.insertWaypoint(icao, wptIndex, () => {
                        CJ4_FMC_InitRefIndexPage.ShowPage17(fmc);
                        addWaypoint();
                    });
                } else {
                    // probably an airway
                    console.log("adding as airway " + icao);
                    let exitWpt = routeArr[idx];

                    // try preloading data like tscharlii seems to do
                    let lastWaypoint = fmc.flightPlanManager.getWaypoints()[fmc.flightPlanManager.getEnRouteWaypointsLastIndex()];
                    if (lastWaypoint.infos instanceof WayPointInfo) {
                        lastWaypoint.infos.UpdateAirway(icao).then(() => {
                            let airway = lastWaypoint.infos.airways.find(a => { return a.name === icao; });
                            if (airway) {	                                    // Load the fixes of the selected airway and their infos.airways
                                // set the outgoing airway of the last enroute or departure waypoint of the flightplan
                                lastWaypoint.infos.airwayOut = airway.name;
                                CJ4_FMC_RoutePage.insertWaypointsAlongAirway(fmc, exitWpt, wptIndex - 1, icao, () => {
                                    idx++;
                                    CJ4_FMC_InitRefIndexPage.ShowPage17(fmc);
                                    addWaypoint();
                                });
                            }
                            else {
                                // TODO hmm, so if no airway found, just continue and add exit as wpt?
                                addWaypoint();
                            }
                        });
                    }
                }
            };

            addWaypoint();
        };

        Utils.loadFile(url, (r) => {
            json = JSON.parse(r);
            if (!json || json === "") {
                fmc.showErrorMessage("NO DATA");
            }
            updateFrom();
        });
    }

    static ShowPage1(fmc) {
        fmc.setMsg("GET FPLN...");
        this.GetFplnFromSimBrief(347439, fmc);
    }
}