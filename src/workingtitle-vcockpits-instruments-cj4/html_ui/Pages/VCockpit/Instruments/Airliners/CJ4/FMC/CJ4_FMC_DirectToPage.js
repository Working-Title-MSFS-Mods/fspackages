
class CJ4_FMC_DirectToPage {

    /**
     * 
     * @param {CJ4_FMC} fmc 
     * @param {*} directWaypoint 
     * @param {Number} page 
     * @param {boolean} directWaypointOnFlightplan
     */
    static ShowPage1(fmc, directWaypoint, page = 1, directWaypointOnFlightplan = false) {

        /**
         * PREPARE
         */

        fmc.clearDisplay();
        let directWaypointCell = "-----";
        let modStr = "ACT[blue]";
        let onDirect = fmc.flightPlanManager.getIsDirectTo();

        if (directWaypoint) {
            directWaypointCell = directWaypoint.ident + "*";
        }
        else if (onDirect) {
            directWaypointCell = fmc.flightPlanManager.getDirectToTarget().ident + "[magenta]";
        }
        let waypointsCell = [];
        let waypointsBearing = [];

        const displayWaypoints = CJ4_FMC_DirectToPage.buildLegs(fmc, onDirect);
        let pageCount = Math.floor((displayWaypoints.length - 1) / 4) + 1;
        pageCount = pageCount < 1 ? 1 : pageCount;

        for (let i = 0; i < pageCount * 4; i++) {
            let waypoint = displayWaypoints[i];
            if (waypoint != undefined) {
                if (i === 0 && !onDirect) {
                    waypointsCell[i] = "<" + waypoint.ident + "[magenta]";
                } else {
                    waypointsCell[i] = "<" + waypoint.ident + "[white]";
                }
                if (waypointsCell[i]) {
                    const position = new LatLongAlt(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
                    const trueHeading = Avionics.Utils.computeGreatCircleHeading(position, waypoint.infos.coordinates);
                    waypointsBearing[i] = fmc._lnav.normalizeCourse(GeoMath.correctMagvar(trueHeading, SimVar.GetSimVarValue("MAGVAR", "degrees"))).toFixed(0) + "°[s-text blue]";
                    let inputLine = i - ((page - 1) * 4) + 1;

                    fmc.onLeftInput[inputLine] = () => {
                        CJ4_FMC_DirectToPage.ShowPage1(fmc, waypoint, 1, true);
                    };
                }
            }
            else {
                waypointsBearing[i] = "";
                if (i == displayWaypoints.length) {
                    waypointsCell[i] = "--END--";
                } else {
                    waypointsCell[i] = "";
                }
            }
        }

        /**
         * RENDER
         */

        // __LSB = leftsquarebracket // __RSB = rightsquarebrackt
        modStr = fmc.fpHasChanged ? "MOD[white]" : "ACT[blue]";
        fmc._templateRenderer.setTemplateRaw([
            [" " + modStr + " DIRECT-TO[blue]", page + "/" + pageCount + "[blue]", ""],
            [""],
            ["<" + directWaypointCell, "NEAREST APTS>"],
            [" " + waypointsBearing[(page - 1) * 4]],
            ["" + waypointsCell[(page - 1) * 4]],
            [" " + waypointsBearing[1 + ((page - 1) * 4)]],
            ["" + waypointsCell[1 + ((page - 1) * 4)]],
            [" " + waypointsBearing[2 + ((page - 1) * 4)]],
            ["" + waypointsCell[2 + ((page - 1) * 4)]],
            [" " + waypointsBearing[3 + ((page - 1) * 4)]],
            ["" + waypointsCell[3 + ((page - 1) * 4)]],
            ["----------------------[blue]"],
            ["", ""]
        ]);

        
        /**
         * BINDS
         */
        fmc.onLeftInput[0] = () => {
            let value = fmc.inOut;
            if (value !== "") {
                fmc.clearUserInput();
                fmc.getOrSelectWaypointByIdent(value, (w) => {
                    if (w) {
                        CJ4_FMC_DirectToPage.ShowPage1(fmc, w);
                    }
                });
            } else if (directWaypoint) {
                if (directWaypointOnFlightplan) {
                    fmc.ensureCurrentFlightPlanIsTemporary(() => {
                        fmc.activateDirectToWaypoint(directWaypoint, () => {
                            fmc.setMsg();
                            fmc._activatingDirectTo = true;
                            fmc.refreshPageCallback = () => { fmc.onLegs(); }; // TODO this seems annoying, but this is how stuff works in cj4_fmc right now
                            fmc.onExecDefault();
                        });
                        fmc.setMsg();
                    });
                } else {
                    const activeIndex = fmc.flightPlanManager.getActiveWaypointIndex();
                    fmc.ensureCurrentFlightPlanIsTemporary(() => {
                        fmc.flightPlanManager.addWaypoint(directWaypoint.icao, activeIndex, () => {
                            let wp = fmc.flightPlanManager.getWaypoint(activeIndex);
                            fmc.activateDirectToWaypoint(wp, () => {
                                fmc._activatingDirectTo = true;
                                fmc.refreshPageCallback = () => { fmc.onLegs(); }; // TODO this seems annoying, but this is how stuff works in cj4_fmc right now
                                fmc.onExecDefault();
                            });
                        });
                    });
                }
            }
        }
        fmc.onRightInput[0] = () => {
            CJ4_FMC_DirectToPage.ShowPage2(fmc);
        }
        fmc.onNextPage = () => {
            if (page < pageCount) {
                page++;
                CJ4_FMC_DirectToPage.ShowPage1(fmc, directWaypoint, page);
            } else {
                CJ4_FMC_DirectToPage.ShowPage1(fmc, directWaypoint, 1);
            }
        };
        fmc.onPrevPage = () => {
            if (page > 1) {
                page--;
                CJ4_FMC_DirectToPage.ShowPage1(fmc, directWaypoint, page);
            } else {
                CJ4_FMC_DirectToPage.ShowPage1(fmc, directWaypoint, pageCount);
            }
        };
    }

    /**
     * Page 2 is for nearest airports and calls data generated by CJ4_FMC_Nearest
     * @param {CJ4_FMC} fmc 
     */
    static ShowPage2(fmc) {
        fmc.clearDisplay();
        let minRunwayValue = WTDataStore.get('WT_CJ4_MIN_NRST_RWY', 3000);
        const position = new LatLongAlt(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));

        let airportsFiltered = [...fmc._nearest.airports].filter(w => w.ident == "origin" || w.ident == "destination"
            || w.longestRunwayLength >= WT_ConvertUnit.setLength(minRunwayValue));

        let airportsSorted = airportsFiltered.sort((a, b) => {
            let aDistance = parseFloat(a.distance);
            let bDistance = parseFloat(b.distance);
            return aDistance - bDistance;
        });

        let closestAirports = [];
        
        const fpOrigin = fmc.flightPlanManager.getOrigin();
        if (fpOrigin) {
            const origin = {
                type: "A",
                ident: fpOrigin.ident,
                icao: fpOrigin.icao,
                distance: Avionics.Utils.computeGreatCircleDistance(position, fpOrigin.infos.coordinates),
                bearing: fmc._lnav.normalizeCourse(GeoMath.correctMagvar(Avionics.Utils.computeGreatCircleHeading(position, fpOrigin.infos.coordinates), SimVar.GetSimVarValue("MAGVAR", "degrees"))),
                latitude: 0,
                longitude: 0,
                longestRunway: airportsSorted.find(a => {return a.ident == "origin"}).longestRunway,
                longestRunwayLength: airportsSorted.find(a => {return a.ident == "origin"}).longestRunwayLength
            }
            closestAirports[0] = origin;
            airportsSorted = airportsSorted.filter(w => w.icao !== fpOrigin.icao  && w.ident !== "origin");
        }

        const fpDest = fmc.flightPlanManager.getDestination();
        if (fpDest) {
            const destination = {
                type: "A",
                ident: fpDest.ident,
                icao: fpDest.icao,
                distance: Avionics.Utils.computeGreatCircleDistance(position, fpDest.infos.coordinates),
                bearing: fmc._lnav.normalizeCourse(GeoMath.correctMagvar(Avionics.Utils.computeGreatCircleHeading(position, fpDest.infos.coordinates), SimVar.GetSimVarValue("MAGVAR", "degrees"))),
                latitude: 0,
                longitude: 0,
                longestRunway: airportsSorted.find(a => {return a.ident == "destination"}).longestRunway,
                longestRunwayLength: airportsSorted.find(a => {return a.ident == "destination"}).longestRunwayLength
            }
            closestAirports[1] = destination;
            airportsSorted = airportsSorted.filter(w => w.icao !== fpDest.icao && w.ident !== "destination");
        }

        const airportsNeeded = 5 - closestAirports.length;
        for (let i = 0; i < airportsNeeded; i++) {
            closestAirports.push(airportsSorted[i]);
        }

        closestAirports = closestAirports.sort((a, b) => {
            let aDistance = parseFloat(a.distance);
            let bDistance = parseFloat(b.distance);
            return aDistance - bDistance;
        });
    
        let waypointsCell = [];
        let runwayCell = [];
        let waypointsBearing = [];

        for (let i = 0; i < 5; i++) {
            let airport = closestAirports[i];
            if (airport != undefined) {
                const distance = parseFloat(airport.distance);
                const bearing = parseInt(airport.bearing);
                const longestRunway = airport.longestRunway;
                const longestRunwayLength = WT_ConvertUnit.getLength(airport.longestRunwayLength).getString(0, " ", "[white]", " ");
                waypointsCell[i] = "<" + airport.ident.padEnd(4, " ") + "[magenta]   " + longestRunwayLength.padStart(8, " ");
                waypointsBearing[i] = "" + bearing.toFixed(0).padStart(3, "0") + "°" + " /" + distance.toFixed(1);
                runwayCell[i] = "RW" + longestRunway + ">";

            }
            else {
                waypointsBearing[i] = "";
                waypointsCell[i] = "";
            }
            fmc.onLeftInput[i] = () => {
                if (waypointsCell[i] != "") {
                    fmc.setMsg("Working...");
                    fmc.flightPlanManager.pauseSync();
                    let icao = closestAirports[i].icao;
                    fmc.ensureCurrentFlightPlanIsTemporary(() => {
                        fmc.flightPlanManager.setDestination(icao, () => {
                            let wp = fmc.flightPlanManager.getDestination();
                            fmc.activateDirectToWaypoint(wp, () => {
                                fmc.setMsg();
                                fmc._activatingDirectTo = true;
                                fmc.refreshPageCallback = () => { fmc.onLegs(); }; // TODO this seems annoying, but this is how stuff works in cj4_fmc right now
                                fmc.onExecDefault();
                            });
                            fmc.setMsg();

  
                        });
                    });
                };
            }
        }

        // __LSB = leftsquarebracket // __RSB = rightsquarebrackt
        //modStr = fmc.fpHasChanged ? "MOD[white]" : "ACT[blue]";
        fmc._templateRenderer.setTemplateRaw([
            [" " + "NEAREST AIRPORTS[blue]"],
            ["" + waypointsBearing[0]],
            ["" + waypointsCell[0], runwayCell[0]],
            ["" + waypointsBearing[1]],
            ["" + waypointsCell[1], runwayCell[1]],
            ["" + waypointsBearing[2]],
            ["" + waypointsCell[2], runwayCell[2]],
            ["" + waypointsBearing[3]],
            ["" + waypointsCell[3], runwayCell[3]],
            ["" + waypointsBearing[4]],
            ["" + waypointsCell[4], runwayCell[4]],
            ["MIN RWY   -----[s-text blue]", "UPDATE[white]"],
            [minRunwayValue + (WT_ConvertUnit.isMetric() ? " M[white]" : " FT[white]"), "AIRPORTS>[white]"]
        ]);



        fmc.onLeftInput[5] = () => {
            let value = parseInt(fmc.inOut);
            if (value >= 0 && value < 20000) {
                WTDataStore.set('WT_CJ4_MIN_NRST_RWY', value);
                fmc.clearUserInput();
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            { CJ4_FMC_DirectToPage.ShowPage2(fmc); }
        };
        fmc.onRightInput[5] = () => {
            fmc.clearUserInput();
            CJ4_FMC_DirectToPage.ShowPage2(fmc);
        };

        fmc.onNextPage = () => {
            page++;
            CJ4_FMC_DirectToPage.ShowPage(fmc, directWaypoint, page);
        };
        fmc.onPrevPage = () => {
            page--;
            page = page < 1 ? 1 : page;
            CJ4_FMC_DirectToPage.ShowPage(fmc, directWaypoint, page);
        };
    }



    /**
     * Gets available direct-to waypoints from the flight plan manager.
     * @param {CJ4_FMC} fmc 
     */
    static buildLegs(fmc, onDirect = false) {
        let activeWaypointIndex = fmc.flightPlanManager.getActiveWaypointIndex();
        const allWaypoints = fmc.flightPlanManager.getAllWaypoints();
        let unfilteredWaypoints = [];

        if (onDirect) {
            activeWaypointIndex = activeWaypointIndex + 1;
        }

        for (let i = Math.max(0, activeWaypointIndex); i < allWaypoints.length; i++) {
            unfilteredWaypoints.push(allWaypoints[i]);
        }

        const displayWaypoints = [...unfilteredWaypoints]
            .filter(w => w.ident !== '(VECT)' && w.ident !== "$DIR" && w.ident !== 'USER' && w.ident !== 'USR');

        return displayWaypoints;
    }

}
//# sourceMappingURL=CJ4_FMC_DirectToPage.js.map