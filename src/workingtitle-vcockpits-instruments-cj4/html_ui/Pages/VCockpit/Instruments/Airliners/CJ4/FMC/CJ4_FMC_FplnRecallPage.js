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
            fmc.setMsg("GET FPLN...CLEAR FPLN[yellow]");
            fmc.flightPlanManager.setActiveWaypointIndex(0, () => {
                fmc.eraseTemporaryFlightPlan(() => {
                    fmc.flightPlanManager.clearFlightPlan(() => {
                        fmc.setMsg("GET FPLN...ORIG [yellow]" + from);
                        fmc.ensureCurrentFlightPlanIsTemporary(() => {
                            fmc.updateRouteOrigin(from, updateRunways);
                        });
                    });
                });
            });
        };

        let updateRunways = () => {
            called++;
            if (called < 2) return;
            console.log("UPDATE RUNWAY");
            let rwy = json.origin.plan_rwy;
            fmc.setMsg("GET FPLN...RWY [yellow]" + rwy);
            fmc.setOriginRunway(rwy, updateDestination);
        };

        let updateDestination = () => {
            console.log("UPDATE DESTINATION");
            let dest = json.destination.icao_code;
            fmc.setMsg("GET FPLN...DST [yellow]" + dest);
            fmc.updateRouteDestination(dest, updateRoute);
        };

        let updateRoute = () => {
            let routeArr = json.general.route.split(' ');
            console.log("UPDATE ROUTE");
            let idx = 1; // TODO starting from 1 to skip departure trans for now

            let addWaypoint = async () => {
                if (idx >= routeArr.length - 1) {
                    // DONE
                    fmc.setMsg("DONE[green]");
                    fmc.flightPlanManager.setActiveWaypointIndex(0);
                    return;
                }
                let icao = routeArr[idx];
                fmc.setMsg("GET FPLN...ADD [yellow]" + icao);
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

            let flightNo = json.general.icao_airline + json.general.flight_number;
            fmc.setMsg("LOADING FPLN...FLIGHTNO[green]" + flightNo);
            fmc.updateFlightNo(flightNo);
            let crz = json.general.initial_altitude;
            fmc.setMsg("LOADING FPLN...CRZ[green]" + crz);
            fmc.setCruiseFlightLevelAndTemperature(crz);
            updateFrom();
        });
    }

    static ShowPage1(fmc) {
        let pilotId = WTDataStore.get('simbriefPilotId');
        if (pilotId) {
            fmc.setMsg("LOADING FPLN...[yellow]");
            this.GetFplnFromSimBrief(pilotId, fmc);
        }
        else {
            fmc.setMsg("NO PILOT ID OR PLAN[red]");
        }
    }
}