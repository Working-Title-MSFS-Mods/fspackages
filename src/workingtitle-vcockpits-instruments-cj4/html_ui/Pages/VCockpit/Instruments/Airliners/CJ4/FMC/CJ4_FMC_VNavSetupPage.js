class CJ4_FMC_VNavSetupPage {
    static ShowPage1(fmc) { //VNAV SETUP Page 1
        fmc.clearDisplay();

        let vnavClimbIas = WTDataStore.get('CJ4_vnavClimbIas', 240);
        let vnavClimbMach = WTDataStore.get('CJ4_vnavClimbMach', 0.64);
        let departureSpeedLimit = WTDataStore.get('CJ4_departureSpeedLimit', 250);
        let departureSpeedLimitAltitude = WTDataStore.get('CJ4_departureSpeedLimitAltitude', 10000);
        let departureTransitionAlt = WTDataStore.get('CJ4_departureTransitionAlt', 18000);

        fmc._templateRenderer.setTemplateRaw([
            [" ACT VNAV CLIMB[blue]", "1/3[blue]"],
            [" TGT SPEED[blue]", "TRANS ALT [blue]"],
            [vnavClimbMach + "/" + vnavClimbIas, "" + departureTransitionAlt],
            [" SPD/ALT LIMIT[blue]"],
            [departureSpeedLimit + "/" + departureSpeedLimitAltitude],
            [""],
            ["---/-----"],
            [""],
            [""],
            [""],
            [""],
            ["-----------------------[blue]"],
            ["", "PERF INIT>"]
        ]);

        fmc.onLeftInput[0] = () => {
            let value = fmc.inOut.split("/");
            value[0] = parseFloat(value[0]).toPrecision(2);
            value[1] = parseInt(value[1]);
            if (value.length == 2 && value[0] >= 0.4 && value[0] <= 0.77 && value[1] >= 110 && value[1] <= 305) {
                vnavClimbMach = value[0];
                vnavClimbIas = value[1];
                WTDataStore.set('CJ4_vnavClimbMach', vnavClimbMach);
                WTDataStore.set('CJ4_vnavClimbIas', vnavClimbIas);
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_VNavSetupPage.ShowPage1(fmc);
        };

        fmc.onLeftInput[1] = () => {
            let value = fmc.inOut.split("/");
            value[0] = parseInt(value[0]);
            value[1] = parseInt(value[1]);
            if (value.length == 2 && value[0] > 0 && value[0] <= 305 && value[1] >= 0 && value[1] <= 45000) {
                departureSpeedLimit = value[0];
                departureSpeedLimitAltitude = value[1];
                WTDataStore.set('CJ4_departureSpeedLimit', departureSpeedLimit);
                WTDataStore.set('CJ4_departureSpeedLimitAltitude', departureSpeedLimitAltitude);
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_VNavSetupPage.ShowPage1(fmc);
        };

        fmc.onRightInput[0] = () => {
            let value = parseInt(fmc.inOut);
            if (value >= 0 && value <= 450) {
                departureTransitionAlt = value * 100;
                WTDataStore.set('CJ4_departureTransitionAlt', departureTransitionAlt);
            }
            else if (value > 450 && value <= 45000) {
                departureTransitionAlt = value;
                WTDataStore.set('CJ4_departureTransitionAlt', departureTransitionAlt);
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_VNavSetupPage.ShowPage1(fmc);
        };

        fmc.onPrevPage = () => { CJ4_FMC_VNavSetupPage.ShowPage3(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_VNavSetupPage.ShowPage2(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) { //VNAV SETUP Page 2
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            [" ACT VNAV CRUISE[blue]", "2/3[blue]"],
            [" TGT SPEED[blue]", "CRZ ALT [blue]"],
            ["300/.74", "crzAltCell"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["-----------------------[blue]"],
            ["", "PERF INIT>"]
        ]);
        
        fmc.onPrevPage = () => { CJ4_FMC_VNavSetupPage.ShowPage1(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_VNavSetupPage.ShowPage3(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage3(fmc) { //VNAV SETUP Page 3
        fmc.clearDisplay();

        let vnavDescentIas = WTDataStore.get('CJ4_vnavDescentIas', 290);
        let vnavDescentMach = WTDataStore.get('CJ4_vnavDescentMach', 0.74);
        let vpa = WTDataStore.get('CJ4_vpa', 3);
        let arrivalSpeedLimit = WTDataStore.get('CJ4_arrivalSpeedLimit', 250);
        let arrivalSpeedLimitAltitude = WTDataStore.get('CJ4_arrivalSpeedLimitAltitude', 10000);
        let arrivalTransitionFl = WTDataStore.get('CJ4_arrivalTransitionFl', 180);

        fmc._templateRenderer.setTemplateRaw([
            [" ACT VNAV DESCENT[blue]", "3/3[blue]"],
            [" TGT SPEED[blue]", "TRANS FL [blue]"],
            [vnavDescentMach + "/" + vnavDescentIas, "FL" + arrivalTransitionFl],
            [" SPD/ALT LIMIT[blue]"],
            [arrivalSpeedLimit + "/" + arrivalSpeedLimitAltitude],
            ["", "VPA [blue]"],
            ["---/-----", vpa.toFixed(1) + "\xB0"],
            [""],
            ["<VNAV WPTS", "VNAV MONITOR>"],
            [""],
            [""],
            ["-----------------------[blue]"],
            ["<DESC INFO", "PERF INIT>"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_VNavSetupPage.ShowPage2(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_VNavSetupPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };

        fmc.onLeftInput[0] = () => {
            let value = fmc.inOut.split("/");
            value[0] = parseFloat(value[0]).toPrecision(2);
            value[1] = parseInt(value[1]);
            if (value.length == 2 && value[0] >= 0.4 && value[0] <= 0.77 && value[1] >= 110 && value[1] <= 305) {
                vnavDescentMach = value[0];
                vnavDescentIas = value[1];
                WTDataStore.set('CJ4_vnavDescentMach', vnavDescentMach);
                WTDataStore.set('CJ4_vnavDescentIas', vnavDescentIas);
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_VNavSetupPage.ShowPage3(fmc);
        };

        fmc.onLeftInput[1] = () => {
            let value = fmc.inOut.split("/");
            value[0] = parseInt(value[0]);
            value[1] = parseInt(value[1]);
            if (value.length == 2 && value[0] > 0 && value[0] <= 305 && value[1] >= 0 && value[1] <= 45000) {
                arrivalSpeedLimit = value[0];
                arrivalSpeedLimitAltitude = value[1];
                WTDataStore.set('CJ4_arrivalSpeedLimit', arrivalSpeedLimit);
                WTDataStore.set('CJ4_arrivalSpeedLimitAltitude', arrivalSpeedLimitAltitude);
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_VNavSetupPage.ShowPage3(fmc);
        };

        fmc.onRightInput[0] = () => {
            let value = parseInt(fmc.inOut);
            if (value >= 0 && value <= 450) {
                arrivalTransitionFl = value;
                WTDataStore.set('CJ4_arrivalTransitionFl', arrivalTransitionFl);
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_VNavSetupPage.ShowPage3(fmc);
        };

        fmc.onRightInput[2] = () => {
            let value = parseFloat(fmc.inOut);
            if (value > 0 && value <= 6) {
                vpa = parseFloat(value.toFixed(1));
                WTDataStore.set('CJ4_vpa', vpa);
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_VNavSetupPage.ShowPage3(fmc);
        };

        fmc.onRightInput[3] = () => {
            CJ4_FMC_VNavSetupPage.ShowPage5(fmc);
        };

        fmc.onLeftInput[3] = () => {
            CJ4_FMC_VNavSetupPage.ShowPage4(fmc);
        };

        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage4(fmc) { //VNAV WPTS
        fmc.clearDisplay();

        let waypoints = [];
        let rows = [
            [""], [""], [""], [""], [""], [""], [""], [""], [""]
        ];

        //FETCH WAYPOINTS WITH CONSTRAINTS
        if (fmc.flightPlanManager.getAllWaypoints().length > 0) {
            waypoints = fmc.flightPlanManager.getAllWaypoints().slice(fmc.flightPlanManager.getActiveWaypointIndex());
            if (waypoints.length > 0) {
                let rowNumber = 0;
                for (let i = 0; i < waypoints.length; i++) {
                    let wpt = waypoints[i];
                    let waypointIdent = wpt.icao.substr(-5);
                    let type = "none";
                    let altitudeConstraint = "none";
                    if (wpt && wpt.legAltitudeDescription && wpt.legAltitudeDescription > 0 && wpt.legAltitude1 > 100 && rowNumber < 9) {
                        if (wpt.legAltitudeDescription == 1 && wpt.legAltitude1 > 100) {
                            altitudeConstraint = wpt.legAltitude1.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude1.toFixed(0) / 100
                                : wpt.legAltitude1.toFixed(0);
                            type = "AT"
                        }
                        else if (wpt.legAltitudeDescription == 2 && wpt.legAltitude1 > 100) {
                            altitudeConstraint = wpt.legAltitude1.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude1.toFixed(0) / 100 + "A"
                                : wpt.legAltitude1.toFixed(0) + "A";
                            type = "ABOVE"
                        }
                        else if (wpt.legAltitudeDescription == 3 && wpt.legAltitude1 > 100) {
                            altitudeConstraint = wpt.legAltitude1.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude1.toFixed(0) / 100 + "B"
                                : wpt.legAltitude1.toFixed(0) + "B";
                            type = "BELOW"
                            }
                        else if (wpt.legAltitudeDescription == 4 && wpt.legAltitude2 > 100 && wpt.legAltitude1 > 100) {
                            let altitudeConstraintA = wpt.legAltitude2.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude2.toFixed(0) / 100 + "A"
                                : wpt.legAltitude2.toFixed(0) + "A";
                            let altitudeConstraintB = wpt.legAltitude1.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude1.toFixed(0) / 100 + "B"
                                : wpt.legAltitude1.toFixed(0) + "B";
                            altitudeConstraint = altitudeConstraintB + altitudeConstraintA;
                            type = "BOTH"
                        }
                        altitudeConstraint = altitudeConstraint.padStart(6, " ");
                        rows[rowNumber] = [waypointIdent.padStart(5, " ") + " " + type.padStart(5, " ") + "[s-text]", altitudeConstraint + "[s-text]"];
                        rowNumber++;
                    }
                }
            }
        }

        fmc._templateRenderer.setTemplateRaw([
            [" VNAV WAYPOINTS[blue]", "1/1[blue]"],
            [" WPT   TYPE[blue]", "CONST [blue]"],
            ...rows,
            ["-----------------------[blue]"],
            ["<MONITOR", "VNAV DESCENT>"]
        ]);
        //fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        //fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage5(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_VNavSetupPage.ShowPage3(fmc); };
        fmc.onLeftInput[5] = () => { CJ4_FMC_VNavSetupPage.ShowPage5(fmc); };

        fmc.updateSideButtonActiveStatus();
    }

    static ShowPage5(fmc) { //VNAV MONITOR
        fmc.clearDisplay();

        let targetAlt = 0;
        let vnavTargetWaypointIdent = "NONE";
        let vnavTargetAltitude = 0;
        let vnavTargetDistance = 0;
        let segmentIndex = 0;
        let desiredFPA = 0;

        //RUN ACTUAL VNAV PATH CONTROL
        if (fmc._vnav) {
            fmc.registerPeriodicPageRefresh(() => {
                const vnavActive = fmc._navModeSelector.isVNAVOn ? " ACTIVE[green]" : " INACTIVE[white]";
                const gsDeviation = SimVar.GetSimVarValue("NAV GSI:1", "Number");
                const altDeviation = fmc._navModeSelector.isVNAVOn ? SimVar.GetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet") : gsDeviation;
                //const setVerticalSpeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:2", "feet per minute");

                //let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
                //let apCurrentVerticalSpeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "Feet/minute");
                //const desiredVerticalSpeed = -101.2686667 * groundSpeed * Math.tan(desiredFPA * (Math.PI / 180));

                const altSlot = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number");
                const vsSlot = SimVar.GetSimVarValue("AUTOPILOT VS SLOT INDEX", "number");

                const vsVar = parseInt(SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet per minute"));
                const vsVar1 = parseInt(SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:1", "feet per minute"));
                const vsVar2 = parseInt(SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:2", "feet per minute"));
                const vsVar3 = parseInt(SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:3", "feet per minute"));
                const altVar = parseInt(SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet"));
                const altVar1 = parseInt(SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:1", "feet"));
                const altVar2 = parseInt(SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:2", "feet"));
                const altVar3 = parseInt(SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:3", "feet"));
                const altLock = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Boolean") ? "Y" : "N";
                //const altArm = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE ARM", "Boolean") ? "Y" : "N";
                // const constraint = SimVar.GetSimVarValue("L:WT_VNAV_constraintExists", "number");
                // const obeyConstraint = SimVar.GetSimVarValue("L:WT_VNAV_obeyingConstraint", "number");
                const pathStatus = fmc._currentVerticalAutopilot._vnavPathStatus;
                const segment = fmc._currentVerticalAutopilot.currentSegment;
                const interceptStatus = fmc._currentVerticalAutopilot._pathInterceptStatus;
                

                if (segment) {
                    desiredFPA = fmc._currentVerticalAutopilot.currentSegment.fpa;
                    segmentIndex = fmc._vnav._verticalFlightPlanSegments.indexOf(fmc._currentVerticalAutopilot.currentSegment);
                    targetAlt = !fmc._currentVerticalAutopilot._targetAltitude ? 0 : fmc._currentVerticalAutopilot._targetAltitude;
                    vnavTargetWaypointIdent = fmc._vnav._verticalFlightPlan[fmc._currentVerticalAutopilot.currentSegment.targetIndex].ident;
                    vnavTargetAltitude = fmc._vnav._verticalFlightPlan[fmc._currentVerticalAutopilot.currentSegment.targetIndex].waypointFPTA;
                    vnavTargetDistance = fmc._vnav.allWaypoints[fmc._currentVerticalAutopilot.currentSegment.targetIndex].cumulativeDistanceInFP - fmc._vnav._currentDistanceInFP;
                }
                // const pitchHold = SimVar.GetSimVarValue("AUTOPILOT PITCH HOLD", "bool");
                // const pitchRef = SimVar.GetSimVarValue("AUTOPILOT PITCH HOLD REF", "degrees");
                // const togaHold = SimVar.GetSimVarValue("AUTOPILOT TAKEOFF POWER ACTIVE", "number") == 1;
                const distanceToTod = SimVar.GetSimVarValue("L:WT_CJ4_TOD_REMAINING", "number");

                fmc._templateRenderer.setTemplateRaw([
                    [vnavTargetWaypointIdent + "", " WT VNAV[blue]" + vnavActive + " "],
                    [" T ALT[blue]", "T DIST [blue]", "Seg FPA[blue]"],
                    [vnavTargetAltitude.toFixed(0) + "FT", vnavTargetDistance.toFixed(1) + "NM", desiredFPA.toFixed(1) + "°"],
                    [" SEGMENT[blue]", "TARGET ALT [blue]", "INTC STATUS[blue]"],
                    ["" + segmentIndex, "" + targetAlt.toFixed(0), interceptStatus + ""],
                    ["ALTDEV [blue]", "TOD[blue]", " ALT/VS SLOT[blue]"],
                    [altDeviation.toFixed(0) + "FT", distanceToTod.toFixed(1) + "NM", altSlot + "/" + vsSlot],
                    ["VSVAR/VAR:1/VAR:2/VAR:3[blue]"],
                    [vsVar + "/" + vsVar1 + "/" + vsVar2 + "/" + vsVar3],
                    ["ALTVAR/VAR:1/VAR:2/VAR:3[blue]"],
                    [altVar + "/" + altVar1 + "/" + altVar2 + "/" + altVar3],
                    // ["PTCH HLD[blue]", "TOGA[blue]", "PTCH REF[blue]"],
                    // [pitchHold ? "YES[green]" : "NO[white]", togaHold ? "YES[green]" : "NO[white]", pitchRef.toFixed(1) + "[white]"],
                    ["ALK:" + altLock, pathStatus + ""],
                    ["<CONSTRAINTS", "MENU>"]
                ]);

            }, 1000, true);
        }
        else {
            fmc._templateRenderer.setTemplateRaw([
                ["", "", "WT VNAV" + "[blue]"],
                [""],
                [""],
                [""],
                ["", "", "UNABLE VNAV[yellow]"],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                ["<CONSTRAINTS", "MENU>"]
            ]);
        }
    fmc.onRightInput[5] = () => { CJ4_FMC_VNavSetupPage.ShowPage6(fmc); };
    fmc.onLeftInput[5] = () => { CJ4_FMC_VNavSetupPage.ShowPage4(fmc); };

    fmc.updateSideButtonActiveStatus();
    }
    static ShowPage6(fmc) { //WT Autopilot Page Menu
        fmc.clearDisplay();


        fmc.registerPeriodicPageRefresh(() => {

            const lnavActive = SimVar.GetSimVarValue("L:WT_CJ4_LNAV_MODE", "number") == 0 ? "LNAV ON[green]" :"LNAV OFF[white]";
            let isVNAVActivate = SimVar.GetSimVarValue("L:WT_CJ4_VNAV_ON", "number") == 1;
            const vnavActive = isVNAVActivate ? "VNAV ON[green]" : "VNAV OFF[white]";


            fmc._templateRenderer.setTemplateRaw([
                [" WT AUTOPILOT MONITOR[blue]", ""],
                [" L MODE[blue]", "V MODE [blue]"],
                [lnavActive, vnavActive],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                ["-----------------------[blue]"],
                ["<LNAV MONITOR", "VNAV MONITOR>"]
            ]);

        }, 1000, true);
        //fmc.onPrevPage = () => { CJ4_FMC_VNavSetupPage.ShowPage1(fmc); };
        //fmc.onNextPage = () => { CJ4_FMC_VNavSetupPage.ShowPage3(fmc); };
        fmc.onLeftInput[5] = () => { CJ4_FMC_VNavSetupPage.ShowPage7(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_VNavSetupPage.ShowPage5(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage7(fmc) { //LNAV MONITOR MODE
        fmc.clearDisplay();


        fmc.registerPeriodicPageRefresh(() => {

            const xtk = SimVar.GetSimVarValue("L:WT_CJ4_XTK", "number").toFixed(2);
            const dtk = SimVar.GetSimVarValue("L:WT_CJ4_DTK", "number").toFixed(0);
            const wptDistance = SimVar.GetSimVarValue("L:WT_CJ4_WPT_DISTANCE", "number").toFixed(1);
            const activeWaypointIdent = fmc.flightPlanManager.getActiveWaypoint().ident;
            const lnavActive = SimVar.GetSimVarValue("L:WT_CJ4_LNAV_MODE", "number") == 0 ? "LNAV ACTIVE[green]" : "LNAV INACTIVE[white]";
            const hdgIndex = SimVar.GetSimVarValue("AUTOPILOT HEADING SLOT INDEX", "number");
            const hdgLock = SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR", "degrees").toFixed(0);
            const hdgLock1 = SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR:1", "degrees").toFixed(0);
            const hdgLock2 = SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR:2", "degrees").toFixed(0);
            const hdgHold = SimVar.GetSimVarValue("L:AP_HEADING_HOLD_ACTIVE", "number");
            const setHeading = SimVar.GetSimVarValue("L:WT_TEMP_SETHEADING", "number");
            const hdgOn = SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean") == 1 ? "YES[green]" : "NO[white]";
            const fdOn = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE", "Boolean");
            const bank = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR BANK", "degrees");
            const bankex = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR BANK EX1", "degrees");
            const pitch = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR PITCH", "degrees");
            const pitchex = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR PITCH EX1", "degrees");
            const wtBankFD = SimVar.GetSimVarValue("L:WT_FLIGHT_DIRECTOR_BANK", "number");
            const cdi = SimVar.GetSimVarValue("NAV CDI:1", "number");
            const loc = SimVar.GetSimVarValue("NAV LOCALIZER:1", "degrees");
            const nav = SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "number");


            fmc._templateRenderer.setTemplateRaw([
                // ["", "", " WT [blue]" + lnavActive],
                // [" ACT WPT[blue]", "DISTANCE [blue]"],
                // [activeWaypointIdent, wptDistance + " NM"],
                // [" DTK[blue]", "XTK [blue]"],
                // [dtk + "°", xtk + " NM"],
                // [" HDG IDX[blue]", "HDG LOCK [blue]"],
                // [hdgIndex + "", hdgLock + "°"],
                // [" HDG LOCK:1[blue]", "HDG LOCK:2 [blue]"],
                // [hdgLock1 + "°", hdgLock2 + "°"],
                // [" HDG HLD VAL[blue]", "SET HDG [blue]"],
                // [hdgHold + "", setHeading.toFixed(0) + ""],
                // ["HDG ON? [blue]" + hdgOn],
                // ["<BACK", "VNAV MONITOR>"]
                ["", "", " WT [blue]" + lnavActive],
                [" ACT WPT[blue]", "DISTANCE [blue]"],
                [activeWaypointIdent, wptDistance + " NM"],
                [" DTK[blue]", "XTK [blue]"],
                [dtk + "°", xtk + " NM"],
                [" FD Simvar[blue]", "NAV[blue]", "BANK[blue]"],
                [fdOn ? "TRUE" : "FALSE", "NAV:" + nav, bank.toFixed(1) + "°"],
                ["WT BANK[blue]", "CDI[blue]", "LOC[blue]"],
                [wtBankFD.toFixed(1) + "°", cdi.toFixed(1) + "", loc.toFixed(0) + "°"],
                [" HDG HLD VAL[blue]", "SET HDG [blue]"],
                [hdgHold + "", setHeading.toFixed(0) + ""],
                ["HDG ON? [blue]" + hdgOn],
                ["<BACK", "VNAV MONITOR>"]
            ]);
        }, 1000, true);
        //fmc.onPrevPage = () => { CJ4_FMC_VNavSetupPage.ShowPage1(fmc); };
        //fmc.onNextPage = () => { CJ4_FMC_VNavSetupPage.ShowPage3(fmc); };
        fmc.onLeftInput[5] = () => { CJ4_FMC_VNavSetupPage.ShowPage6(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_VNavSetupPage.ShowPage5(fmc); };
        fmc.updateSideButtonActiveStatus();
    }

}