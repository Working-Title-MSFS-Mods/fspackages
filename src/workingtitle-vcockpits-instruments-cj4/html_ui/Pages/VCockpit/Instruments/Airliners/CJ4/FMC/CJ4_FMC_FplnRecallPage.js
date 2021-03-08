class CJ4_FMC_FplnRecallPage {
    static async GetFplnFromSimBrief(pilotId, fmc) {
        const url = "https://www.simbrief.com/api/xml.fetcher.php?userid=" + pilotId + "&json=1";
        let json = "";

        const parseAirport = (icao) => {
            if ((/K.*\d.*/.test(icao))) {
                icao = icao.substring(1).padEnd(4, " ");
            }

            return icao;
        };

        // HINT: defining these methods here in the order they will be called by the callbacks
        const updateFrom = () => {
            console.log("UPDATE FROMTO");
            const from = json.origin.icao_code;
            // fmc.tryUpdateFromTo(json.origin.icao_code + "/" + json.destination.icao_code, updateRunways);
            fmc.setMsg("LOAD FPLN...CLEAR FPLN[yellow]");
            fmc.flightPlanManager.setActiveWaypointIndex(0, () => {
                fmc.eraseTemporaryFlightPlan(() => {
                    fmc.flightPlanManager.clearFlightPlan(() => {
                        fmc.setMsg("LOAD FPLN...ORIG [yellow]" + from);
                        fmc.ensureCurrentFlightPlanIsTemporary(() => {
                            fmc.updateRouteOrigin(parseAirport(from), updateRunways);
                        });
                    });
                });
            });
        };

        const updateRunways = () => {
            console.log("UPDATE RUNWAY");
            const rwy = json.origin.plan_rwy;
            fmc.setMsg("LOAD FPLN...RWY [yellow]" + rwy);
            fmc.setOriginRunway(rwy, updateDestination);
        };

        const updateDestination = () => {
            console.log("UPDATE DESTINATION");
            const dest = json.destination.icao_code;
            fmc.setMsg("LOAD FPLN...DST [yellow]" + dest);
            fmc.updateRouteDestination(parseAirport(dest), updateRoute);
        };

        const updateRoute = () => {
            const routeArr = json.general.route.split(' ');
            console.log("UPDATE ROUTE");
            let idx = 0; // TODO starting from 1 to skip departure trans for now

            const addWaypoint = async () => {
                if (idx >= routeArr.length - 1) {
                    // DONE
                    fmc.setMsg("FPLN LOADED[green]");
                    fmc.flightPlanManager.resumeSync();
                    fmc.flightPlanManager.setActiveWaypointIndex(1);
                    SimVar.SetSimVarValue("L:WT_CJ4_INHIBIT_SEQUENCE", "number", 0);
                    fmc.resetVspeeds();
                    fmc.resetFuelUsed();
                    CJ4_FMC_RoutePage.ShowPage1(fmc);
                    return;
                }
                let icao = routeArr[idx];

                if (idx == 0 && icao !== "DCT") {
                    // if first waypoint is no dct it must be a departure
                    icao = "DCT";
                }

                fmc.setMsg("LOAD FPLN...ADD [yellow]" + icao);
                // let isWaypoint = await fmc.dataManager.IsWaypointValid(icao);
                idx++;

                const wptIndex = fmc.flightPlanManager.getWaypointsCount() - 1;
                console.log("MOD INDEX " + wptIndex);

                if (icao === "DCT") {
                    // should be a normal waypoint then
                    icao = routeArr[idx];
                    console.log("adding as waypoint " + icao);
                    fmc.insertWaypoint(icao, wptIndex, (res) => {
                        idx++;
                        CJ4_FMC_InitRefIndexPage.ShowPage17(fmc);
                        if (res) {
                            addWaypoint();
                        }
                        else {
                            fmc.flightPlanManager.resumeSync();
                            fmc.setMsg("ERROR WPT " + icao + "[red]");
                        }

                    });
                } else {
                    // probably an airway
                    console.log("adding as airway " + icao);
                    const exitWpt = routeArr[idx];

                    // try preloading data like tscharlii seems to do
                    const lastWaypoint = fmc.flightPlanManager.getWaypoints()[fmc.flightPlanManager.getEnRouteWaypointsLastIndex()];
                    if (lastWaypoint.infos instanceof WayPointInfo) {
                        lastWaypoint.infos.UpdateAirway(icao).then(() => {
                            const airway = lastWaypoint.infos.airways.find(a => { return a.name === icao; });
                            if (airway) {	                                    // Load the fixes of the selected airway and their infos.airways
                                // set the outgoing airway of the last enroute or departure waypoint of the flightplan
                                lastWaypoint.infos.airwayOut = airway.name;
                                CJ4_FMC_RoutePage.insertWaypointsAlongAirway(fmc, exitWpt, wptIndex - 1, icao, (res) => {
                                    idx++;
                                    CJ4_FMC_InitRefIndexPage.ShowPage17(fmc);
                                    if (res) {
                                        addWaypoint();
                                    } else {
                                        fmc.flightPlanManager.resumeSync();
                                        fmc.setMsg("ERROR AIRWAY " + icao + "[red]");
                                    }
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

        WTUtils.loadFile(url, (r) => {
            json = JSON.parse(r);
            if (!json || json === "") {
                fmc.setMsg("NO DATA[red]");
                return;
            }
            //else if (json.indexOf("Error") > -1) {
            //    fmc.showErrorMessage("WRONG PILOTID");
            //    return;
            //}
            let flightNo = json.general.flight_number;
            if (typeof json.general.icao_airline === "string") {
                flightNo += json.general.icao_airline;
            }
            fmc.setMsg("LOAD FPLN...FLIGHTNO[green]" + flightNo);
            fmc.updateFlightNo(flightNo);
            const crz = json.general.initial_altitude;
            fmc.setMsg("LOAD FPLN...CRZ[green]" + crz);
            fmc.setCruiseFlightLevelAndTemperature(crz);
            fmc.flightPlanManager.pauseSync();
            updateFrom();
        }, () => {
            // wrong pilot id is the most obvious error here, so lets show that
            fmc.setMsg("WRONG PILOTID[red]");
            return;
        });
    }

    static ShowPage1(fmc) {
        const pilotId = WTDataStore.get('simbriefPilotId', '');
        if (pilotId !== '') {
            fmc.setMsg("LOAD FPLN...[yellow]");
            this.GetFplnFromSimBrief(pilotId, fmc);
        }
        else {
            fmc.setMsg("NO PILOT ID OR PLAN[red]");
        }

    }
}