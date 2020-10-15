class CJ4_FMC_DepArrPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        let rowOrigin = [""];
        let origin = fmc.flightPlanManager.getOrigin();
        if (origin) {
            rowOrigin = ["<DEP", "", origin.ident];
            fmc.onLeftInput[0] = () => {
                CJ4_FMC_DepArrPage.ShowDeparturePage(fmc);
            };
        }
        let rowDestination = [""];
        let destination = fmc.flightPlanManager.getDestination();
        if (destination) {
            rowDestination = ["", "<ARR", destination.ident];
            fmc.onRightInput[1] = () => {
                CJ4_FMC_DepArrPage.ShowArrivalPage(fmc);
            };
        }
        fmc._templateRenderer.setTemplateRaw([
            ["", "", "DEP/ARR INDEX[blue]"],
            ["", "", "ACT FPLN[blue]"],
            rowOrigin,
            [""],
            rowDestination,
            ["", "", "SEC FPLN[blue s-text]"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ], false);
    }
    static ShowDeparturePage(fmc, currentPage = 1) {
        fmc.clearDisplay();
        let originIdent = "";
        let modStr = "ACT[blue]";
        let origin = fmc.flightPlanManager.getOrigin();
        if (origin) {
            originIdent = origin.ident;
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
            [""]
        ];
        let runways = [];
        let displayableRunwaysCount = 0;
        let departures = [];
        let selectedDeparture;
        let displayableDeparturesCount = 0;
        let displayableDpEnrouteTransitionsCount = 0;
        let selectedRunway = fmc.flightPlanManager.getDepartureRunway();
        if (origin) {
            let airportInfo = origin.infos;
            if (airportInfo instanceof AirportInfo) {
                let departureRunway = fmc.flightPlanManager.getDepartureRunway();
                if (departureRunway) {
                    selectedRunway = departureRunway;
                }
                runways = airportInfo.oneWayRunways;
                selectedDeparture = airportInfo.departures[fmc.flightPlanManager.getDepartureProcIndex()];
                departures = airportInfo.departures;
            }
        }
        if (selectedRunway) {
            rows[0] = ["", Avionics.Utils.formatRunway(selectedRunway.designation) + "[d-text green]"];
            fmc.onRightInput[0] = () => {
                fmc.setMsg("Working...");
                fmc.setRunwayIndex(-1, () => {
                    fmc.setDepartureIndex(-1, () => {
                        fmc.setMsg();
                        CJ4_FMC_DepArrPage.ShowDeparturePage(fmc, currentPage);
                    });
                });
            };
        }
        else {
            let runwayPages = [[]];
            let rowIndex = 0;
            let pageIndex = 0;
            for (let i = 0; i < runways.length; i++) {
                let runway = runways[i];
                let appendRow = false;
                let index = i;
                if (!selectedDeparture) {
                    appendRow = true;
                    displayableRunwaysCount++;
                }
                else {
                    for (let j = 0; j < selectedDeparture.runwayTransitions.length; j++) {
                        if (selectedDeparture.runwayTransitions[j].name.indexOf(runway.designation) !== -1) {
                            appendRow = true;
                            displayableRunwaysCount++;
                            index = j;
                            break;
                        }
                    }
                }
                if (appendRow) {
                    if (rowIndex === 5) {
                        pageIndex++;
                        rowIndex = 0;
                        runwayPages[pageIndex] = [];
                    }
                    runwayPages[pageIndex][rowIndex] = {
                        text: Avionics.Utils.formatRunway(runway.designation) + "[s-text]",
                        runwayIndex: index
                    };
                    rowIndex++;
                }
            }
            let displayedPageIndex = Math.min(currentPage, runwayPages.length) - 1;
            for (let i = 0; i < runwayPages[displayedPageIndex].length; i++) {
                let runwayIndex = runwayPages[displayedPageIndex][i].runwayIndex;
                rows[2 * i] = ["", runwayPages[displayedPageIndex][i].text];
                fmc.onRightInput[i] = () => {
                    fmc.setMsg("Working...");
                    if (fmc.flightPlanManager.getDepartureProcIndex() === -1) {
                        fmc.setOriginRunwayIndex(runwayIndex, () => {
                            fmc.setMsg();
                            CJ4_FMC_DepArrPage.ShowDeparturePage(fmc, undefined);
                        });
                    }
                    else {
                        fmc.setRunwayIndex(runwayIndex, () => {
                            fmc.setMsg();
                            CJ4_FMC_DepArrPage.ShowDeparturePage(fmc, undefined);
                        });
                    }
                };
            }
        }

        if (selectedDeparture) {
            rows[0][0] = selectedDeparture.name + "[d-text green]";
            fmc.onLeftInput[0] = () => {
                fmc.setMsg("Working...");
                fmc.setRunwayIndex(-1, () => {
                    fmc.setDepartureIndex(-1, () => {
                        fmc.setMsg();
                        CJ4_FMC_DepArrPage.ShowDeparturePage(fmc, currentPage);
                    });
                });
            };
            rows[1][0] = " TRANS [blue]";
            let selectedDpEnrouteTransitionIndex = fmc.flightPlanManager.getDepartureEnRouteTransitionIndex();
            let selectedDpEnrouteTransition = selectedDeparture.enRouteTransitions[selectedDpEnrouteTransitionIndex];
            if (selectedDpEnrouteTransition) {
                rows[2][0] = selectedDpEnrouteTransition.name.trim() + "[d-text green]";
                fmc.onLeftInput[1] = () => {
                    fmc.setMsg("Working...");
                    fmc.setDepartureEnrouteTransitionIndex(-1, () => {
                        fmc.setMsg();
                        CJ4_FMC_DepArrPage.ShowDeparturePage(fmc, currentPage);
                    });
                };
            }
            else {
                displayableDpEnrouteTransitionsCount = selectedDeparture.enRouteTransitions.length;
                let maxDpEnrouteTransitionPageIndex = Math.max(Math.ceil(displayableDpEnrouteTransitionsCount / 4), 1) - 1;
                let displayedDpEnrouteTransitionPageIndex = Math.min(currentPage - 1, maxDpEnrouteTransitionPageIndex);
                for (let i = 0; i < 4; i++) {
                    let enrouteDpTransitionIndex = 4 * displayedDpEnrouteTransitionPageIndex + i;
                    let enrouteDpTransition = selectedDeparture.enRouteTransitions[enrouteDpTransitionIndex];
                    if (enrouteDpTransition) {
                        let enrouteDpTransitionName = enrouteDpTransition.name.trim();
                        rows[2 * (i + 1)][0] = enrouteDpTransitionName;
                        fmc.onLeftInput[i + 1] = () => {
                            fmc.setMsg("Working...");
                            fmc.setDepartureEnrouteTransitionIndex(enrouteDpTransitionIndex, () => {
                                fmc.setMsg();
                                CJ4_FMC_DepArrPage.ShowDeparturePage(fmc);
                            });
                        };
                    }
                }
            }

        }
        else {
            let departurePages = [[]];
            let rowIndex = 0;
            let pageIndex = 0;
            for (let i = 0; i < departures.length; i++) {
                let departure = departures[i];
                let appendRow = false;
                // No runway selected? -> show all departures
                if (!selectedRunway) {
                    appendRow = true;
                    displayableDeparturesCount++;
                }
                // runway selected? -> show applicable departures
                else {
                    for (let j = 0; j < departure.runwayTransitions.length; j++) {
                        if (departure.runwayTransitions[j].name.indexOf(selectedRunway.designation) !== -1) {
                            appendRow = true;
                            displayableDeparturesCount++;
                            break;
                        }
                    }
                }
                // distribute rows accross pages 
                if (appendRow) {
                    if (rowIndex === 5) {
                        pageIndex++;
                        rowIndex = 0;
                        departurePages[pageIndex] = [];
                    }
                    departurePages[pageIndex][rowIndex] = {
                        text: departure.name + "[s-text]",
                        departureIndex: i
                    };
                    rowIndex++;
                }
            }
            // choose page to display: normally "currentPage", but fall back to the last page with data, if necessary
            let displayedPageIndex = Math.min(currentPage, departurePages.length) - 1;
            for (let i = 0; i < departurePages[displayedPageIndex].length; i++) {
                let departureIndex = departurePages[displayedPageIndex][i].departureIndex;
                rows[2 * i][0] = departurePages[displayedPageIndex][i].text;
                fmc.onLeftInput[i] = () => {
                    fmc.setMsg("Working...");
                    fmc.setDepartureIndex(departureIndex, () => {
                        fmc.setMsg();
                        //fmc.flightPlanManager.setDepartureEnRouteTransitionIndex(-1, () => {CJ4_FMC_DepArrPage.ShowDeparturePage(fmc);});
                        CJ4_FMC_DepArrPage.ShowDeparturePage(fmc);
                    });
                };
            }
        }

        let rowsCount = Math.max(displayableRunwaysCount, displayableDeparturesCount);
        let pageCount = Math.max(Math.ceil(rowsCount / 5), 1);


        //start of CWB EXEC handling
        let rsk6Field = "";
        if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            fmc.fpHasChanged = true;
            rsk6Field = "CANCEL MOD>";
        }
        else if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 0) {
            rsk6Field = "LEGS>";
            fmc.fpHasChanged = false;
        }
        fmc.onExecPage = () => {
            if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                if (!fmc.getIsRouteActivated()) {
                    fmc.activateRoute();
                }
                fmc.onExecDefault();
            }
        };

        fmc.refreshPageCallback = () => {
            CJ4_FMC_DepArrPage.ShowDeparturePage(fmc);
        };

        //end of CWB EXEC handling
        modStr = fmc.fpHasChanged ? "MOD[white] " : "ACT[blue] ";

        fmc._templateRenderer.setTemplateRaw([
            [" " + modStr + originIdent + " DEPART[blue]", currentPage.toFixed(0) + "/" + pageCount.toFixed(0) + " [blue]"],
            [" DEPARTURES[blue]", "RUNWAYS [blue]"],
            ...rows,
            ["-----------------------[blue]"],
            ["<DEP/ARR IDX", rsk6Field]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_DepArrPage.ShowPage1(fmc); };

        //start of CWB CANCEL MOD handling
        fmc.onRightInput[5] = () => {
            if (rsk6Field == "CANCEL MOD>") {
                if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                    fmc.eraseTemporaryFlightPlan(() => {
                        fmc.fpHasChanged = false;
                        fmc.onDepArr();
                    });
                }
            }
            else {
                CJ4_FMC_LegsPage.ShowPage1(fmc);
            }
        };
        //end of CWB CANCEL MOD handling


        fmc.onPrevPage = () => {
            if (currentPage > 1) {
                CJ4_FMC_DepArrPage.ShowDeparturePage(fmc, currentPage - 1);
            } else {
                CJ4_FMC_DepArrPage.ShowDeparturePage(fmc, pageCount);
            }
        };
        fmc.onNextPage = () => {
            if (currentPage < pageCount) {
                CJ4_FMC_DepArrPage.ShowDeparturePage(fmc, currentPage + 1);
            } else {
                CJ4_FMC_DepArrPage.ShowDeparturePage(fmc);
            }
        };
    }
    static ShowArrivalPage(fmc, currentPage = 1) {
        fmc.clearDisplay();
        let destinationIdent = "";
        let modStr = "ACT[blue]";
        let headStr = "APPROACHES";
        let destination = fmc.flightPlanManager.getDestination();
        if (destination) {
            destinationIdent = destination.ident;
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
            [""]
        ];
        let approaches = [];
        let selectedApproach;
        let displayableApproachesCount = 0;
        let arrivals = [];
        let selectedArrival;
        let displayableArrivalsCount = 0;
        let displayableTransitionsCount = 0;
        let lastApproachPage = 0;
        let firstRunwayPage = 0;
        let firstRunwayTitleRow = 0;
        let runways = [];
        let displayableRunwaysCount = 0;
        let displayableEnrouteTransitionsCount = 0;

        let selectedRunway = fmc.vfrLandingRunway;
    
        if (destination) {
            let airportInfo = destination.infos;
            if (airportInfo instanceof AirportInfo) {
                selectedApproach = airportInfo.approaches[fmc.flightPlanManager.getApproachIndex()];
                approaches = airportInfo.approaches;
                selectedArrival = airportInfo.arrivals[fmc.flightPlanManager.getArrivalProcIndex()];
                arrivals = airportInfo.arrivals;
                runways = airportInfo.oneWayRunways;
            }
        }
        if (selectedApproach) {
            rows[0] = ["  NONE", Avionics.Utils.formatRunway(selectedApproach.name).trim() + "[d-text green]"];
            fmc.onRightInput[0] = () => {
                fmc.setMsg("Working...");
                fmc.setApproachIndex(-1, () => {
                    CJ4_FMC_DepArrPage.ShowArrivalPage(fmc, currentPage);
                    fmc.setMsg();
                });
            };
            rows[1] = ["", "TRANS [blue]"];
            let selectedTransitionIndex = fmc.flightPlanManager.getApproachTransitionIndex();
            let selectedTransition = selectedApproach.transitions[selectedTransitionIndex];
            if (selectedTransition) {
                rows[2] = ["", selectedTransition.name.trim() + "[d-text green]"];
                fmc.onRightInput[1] = () => {
                    fmc.setMsg("Working...");
                    fmc.setApproachTransitionIndex(-1, () => {
                        fmc.setMsg();
                        CJ4_FMC_DepArrPage.ShowArrivalPage(fmc, currentPage);
                    });
                };
            }
            else {
                displayableTransitionsCount = selectedApproach.transitions.length;
                let maxTransitionPageIndex = Math.max(Math.ceil(displayableTransitionsCount / 4), 1) - 1;
                let displayedTransitionPageIndex = Math.min(currentPage - 1, maxTransitionPageIndex);                
                for (let i = 0; i < 4; i++) {
                    let transitionIndex = 4 * displayedTransitionPageIndex + i;
                    let transition = selectedApproach.transitions[transitionIndex];
                    if (transition) {
                        let name = transition.name.trim();
                        rows[2 * (i + 1)][1] = name;
                        fmc.onRightInput[i + 1] = () => {
                            fmc.setApproachTransitionIndex(transitionIndex, () => {
                                CJ4_FMC_DepArrPage.ShowArrivalPage(fmc);
                            });
                        };
                    }
                }
            }
        }
        else if (selectedRunway) {
            headStr = "RUNWAYS";
            rows[0][1] = "RW" + Avionics.Utils.formatRunway(selectedRunway.designation) + "[d-text green]";
            fmc.onRightInput[0] = () => {
                fmc.setMsg("Working...");
                fmc.ensureCurrentFlightPlanIsTemporary(() => {
                    fmc.deletedVfrLandingRunway = selectedRunway;
                    fmc.vfrLandingRunway = undefined;
                    fmc.modVfrRunway = true;
                    fmc.setMsg();
                    CJ4_FMC_DepArrPage.ShowArrivalPage(fmc, currentPage);
                    });
                };
            }
        else {
            let approachPages = [[]];
            let rowIndex = 0;
            let pageIndex = 0;
            let lastApproachIndex = 0;
            for (let i = 0; i < approaches.length; i++) {
                let approach = approaches[i];
                let appendRow = false;
                if (!selectedArrival) {
                    appendRow = true;
                    displayableApproachesCount++;
                }
                else {
                    for (let j = 0; j < selectedArrival.runwayTransitions.length; j++) {
                        if (selectedArrival.runwayTransitions[j].name.replace("RW", "") === approach.runway.trim()) {
                            appendRow = true;
                            displayableApproachesCount++;
                            break;
                        }
                    }
                    if (selectedArrival.runwayTransitions.length === 0) {
                        appendRow = true;
                        displayableApproachesCount++;
                    }
                }
                if (appendRow) {
                    if (rowIndex === 5) {
                        pageIndex++;
                        rowIndex = 0;
                        approachPages[pageIndex] = [];
                    }
                    approachPages[pageIndex][rowIndex] = {
                        text: Avionics.Utils.formatRunway(approach.name).trim() + "[s-text]",
                        approachIndex: i
                    };
                    rowIndex++;
                    firstRunwayTitleRow = rowIndex == 5 ? 0 : rowIndex;
                    lastApproachIndex = i;
                } 
            }
            for (let k = 0; k < runways.length; k++) {
                let runway = runways[k];
                let appendRow = true;
                if (k == 0) {
                    lastApproachPage = pageIndex + 1;
                }
                if (appendRow) {
                    displayableApproachesCount++;
                    if (rowIndex === 5) {
                        pageIndex++;
                        rowIndex = 0;
                        approachPages[pageIndex] = [];
                    }
                    approachPages[pageIndex][rowIndex] = {
                        text: "RW" + Avionics.Utils.formatRunway(runway.designation).trim() + "[s-text]",
                        approachIndex: k + approaches.length
                    };
                    if (k == 0) {
                        firstRunwayPage = pageIndex + 1;
                    }
                    rowIndex++;
                } 
            }
            let displayedPageIndex = Math.min(currentPage, approachPages.length) - 1;
            for (let i = 0; i < approachPages[displayedPageIndex].length; i++) {
                let approachIndex = approachPages[displayedPageIndex][i].approachIndex;
                console.log("approachIndex " + approachIndex);
                rows[2 * i] = ["", approachPages[displayedPageIndex][i].text];
                fmc.onRightInput[i] = () => {
                    if (approachIndex <= lastApproachIndex) {
                        console.log("approachIndex <= lastApproachIndex");
                        fmc.setMsg("Working...");
                        console.log("approachIndex " + approachIndex);
                        fmc.setApproachIndex(approachIndex, () => {
                            fmc.setMsg();
                            CJ4_FMC_DepArrPage.ShowArrivalPage(fmc, currentPage);
                        });
                    }
                    else if (approachIndex > lastApproachIndex) {
                        console.log("approachIndex > lastApproachIndex");
                        fmc.setMsg("Working...");
                        let runwayApproachIndex = (approachPages[displayedPageIndex][i].approachIndex) - lastApproachIndex - 1;
                        console.log("approachIndex " + approachIndex);
                        fmc.ensureCurrentFlightPlanIsTemporary(() => {
                            console.log("starting to set vfrLandingRunway");
                            fmc.modVfrRunway = true;
                            fmc.vfrLandingRunway = runways[runwayApproachIndex];
                            console.log("completed setting vfrLandingRunway");
                            fmc.setMsg();
                            CJ4_FMC_DepArrPage.ShowArrivalPage(fmc, currentPage);
                            });
                    }

                };
            }
            if (currentPage > lastApproachPage) {
                headStr = "RUNWAYS";
            }
            else if (currentPage == firstRunwayPage && firstRunwayPage == lastApproachPage && firstRunwayTitleRow > 0) {
                let runwaysTitleRow = (firstRunwayTitleRow * 2) - 1;
                rows[runwaysTitleRow][1] = "RUNWAYS [s-text blue]";
            }
        }
        if (selectedArrival) {
            rows[0][0] = selectedArrival.name + "[d-text green]";
            fmc.onLeftInput[0] = () => {
                fmc.setMsg("Working...");
                fmc.setArrivalProcIndex(-1, () => {
                    fmc.setMsg();
                    CJ4_FMC_DepArrPage.ShowArrivalPage(fmc, currentPage);
                });
            };
            let selectedArrivalIndex = fmc.flightPlanManager.getArrivalProcIndex();
            rows[1][0] = " TRANS [blue]";
            let selectedEnrouteTransitionIndex = fmc.flightPlanManager.getArrivalTransitionIndex();
            let selectedEnrouteTransition = selectedArrival.enRouteTransitions[selectedEnrouteTransitionIndex];
            if (selectedEnrouteTransition) {
                rows[2][0] = selectedEnrouteTransition.name.trim() + "[d-text green]";
                fmc.onLeftInput[1] = () => {
                    fmc.setMsg("Working...");
                    fmc.setArrivalIndex(selectedArrivalIndex, -1, () => {
                        fmc.setMsg();
                        CJ4_FMC_DepArrPage.ShowArrivalPage(fmc, currentPage);
                    });
                };
            }
            else {
                displayableEnrouteTransitionsCount = selectedArrival.enRouteTransitions.length;
                let maxEnrouteTransitionPageIndex = Math.max(Math.ceil(displayableEnrouteTransitionsCount / 4), 1) - 1;
                let displayedEnrouteTransitionPageIndex = Math.min(currentPage - 1, maxEnrouteTransitionPageIndex);
                for (let i = 0; i < 4; i++) {
                    let enrouteTransitionIndex = 4 * displayedEnrouteTransitionPageIndex + i;
                    let enrouteTransition = selectedArrival.enRouteTransitions[enrouteTransitionIndex];
                    if (enrouteTransition) {
                        let enrouteTransitionName = enrouteTransition.name.trim();
                        rows[2 * (i + 1)][0] = enrouteTransitionName;
                        fmc.onLeftInput[i + 1] = () => {
                            fmc.setMsg("Working...");
                            fmc.setArrivalIndex(selectedArrivalIndex, enrouteTransitionIndex, () => {
                                fmc.setMsg();
                                CJ4_FMC_DepArrPage.ShowArrivalPage(fmc);
                            });
                        };
                    }
                }
            }
        }
        else {
            let arrivalPages = [[]];
            let rowIndex = 0;
            let pageIndex = 0;
            for (let i = 0; i < arrivals.length; i++) {
                let arrival = arrivals[i];
                let appendRow = false;
                if (!selectedApproach) {
                    appendRow = true;
                    displayableArrivalsCount++;
                }
                else {
                    for (let j = 0; j < arrival.runwayTransitions.length; j++) {
                        if (arrival.runwayTransitions[j].name.replace("RW", "") === selectedApproach.runway.trim()) {
                            appendRow = true;
                            displayableArrivalsCount++;
                            break;
                        }
                    }
                    if (arrival.runwayTransitions.length === 0) {
                        appendRow = true;
                        displayableArrivalsCount++;
                    }
                }
                if (appendRow) {
                    if (rowIndex === 5) {
                        pageIndex++;
                        rowIndex = 0;
                        arrivalPages[pageIndex] = [];
                    }
                    arrivalPages[pageIndex][rowIndex] = {
                        text: arrival.name + "[s-text]",
                        arrivalIndex: i
                    };
                    rowIndex++;
                }
            }
            let displayedPageIndex = Math.min(currentPage, arrivalPages.length) - 1;
            for (let i = 0; i < arrivalPages[displayedPageIndex].length; i++) {
                let arrivalIndex = arrivalPages[displayedPageIndex][i].arrivalIndex;
                rows[2 * i][0] = arrivalPages[displayedPageIndex][i].text;
                fmc.onLeftInput[i] = () => {
                    console.log("rows length before reload" + rows.length);
                    fmc.setMsg("Working...");
                    fmc.setArrivalProcIndex(arrivalIndex, () => {
                        fmc.setMsg();
                        CJ4_FMC_DepArrPage.ShowArrivalPage(fmc);
                    });
                };
            }
        }

        let rowsCount = Math.max(Math.max(displayableApproachesCount + displayableRunwaysCount, displayableArrivalsCount), Math.max(displayableTransitionsCount, displayableEnrouteTransitionsCount));
        let pageCount = Math.max(Math.ceil(rowsCount / 5), 1);

        //start of CWB EXEC handling
        let rsk6Field = "";
        if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            fmc.fpHasChanged = true;
            rsk6Field = "CANCEL MOD>";
        }
        else if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 0) {
            rsk6Field = "LEGS>";
            fmc.fpHasChanged = false;
        }
        fmc.onExecPage = () => {
            if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                fmc.modVfrRunway = false;
                fmc.deletedVfrLandingRunway = undefined;
                if (!fmc.getIsRouteActivated()) {
                    fmc.activateRoute();
                }
                fmc.onExecDefault();
            }
            fmc.refreshPageCallback = () => CJ4_FMC_DepArrPage.ShowArrivalPage(fmc);
        };
        //end of CWB EXEC handling
        modStr = fmc.fpHasChanged ? "MOD[white]" : "ACT[blue]";
        
        fmc._templateRenderer.setTemplateRaw([
            [" " + modStr + " " + destinationIdent + " ARRIVAL[blue]", currentPage.toFixed(0) + "/" + pageCount.toFixed(0) + " [blue]"],
            [" STARS[blue]", headStr + " [blue]"],
            ...rows,
            ["-----------------------[blue]"],
            ["<DEP/ARR IDX", rsk6Field]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_DepArrPage.ShowPage1(fmc); };

        //start of CWB CANCEL MOD handling
        fmc.onRightInput[5] = () => {
            if (rsk6Field == "CANCEL MOD>") {
                fmc.setMsg("Working...");
                if (fmc.modVfrRunway == true && fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                    fmc.eraseTemporaryFlightPlan(() => {
                        fmc.vfrLandingRunway = fmc.vfrLandingRunway == undefined ? fmc.deletedVfrLandingRunway : undefined;
                        fmc.modVfrRunway = false;
                        fmc.fpHasChanged = false;
                        fmc.setMsg();
                        CJ4_FMC_DepArrPage.ShowArrivalPage(fmc);
                    });
                }
                else if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                    fmc.eraseTemporaryFlightPlan(() => {
                        fmc.setMsg();
                        fmc.fpHasChanged = false;
                        CJ4_FMC_DepArrPage.ShowArrivalPage(fmc);
                    });
                }
            }
            else {
                CJ4_FMC_LegsPage.ShowPage1(fmc);
            }
        };
        //end of CWB CANCEL MOD handling


        fmc.onPrevPage = () => {
            if (currentPage > 1) {
                CJ4_FMC_DepArrPage.ShowArrivalPage(fmc, currentPage - 1);
            } else {
                CJ4_FMC_DepArrPage.ShowArrivalPage(fmc, pageCount);
            }
        };
        fmc.onNextPage = () => {
            if (currentPage < pageCount) {
                CJ4_FMC_DepArrPage.ShowArrivalPage(fmc, currentPage + 1);
            } else {
                CJ4_FMC_DepArrPage.ShowArrivalPage(fmc);
            }
        };
    }
}
//# sourceMappingURL=CJ4_FMC_DepArrPage.js.map