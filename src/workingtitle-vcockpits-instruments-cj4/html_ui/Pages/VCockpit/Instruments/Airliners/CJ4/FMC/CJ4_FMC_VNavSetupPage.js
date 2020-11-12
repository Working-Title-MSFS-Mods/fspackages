class CJ4_FMC_VNavSetupPage {
    static ShowPage1(fmc) { //VNAV SETUP Page 1
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            [" ACT VNAV CLIMB[blue]", "1/3[blue]"],
            [" TGT SPEED[blue]", "TRANS ALT [blue]"],
            ["240/.64", "18000"],
            [" SPD/ALT LIMIT[blue]"],
            ["250/10000"],
            [""],
            ["---/-----"],
            [""],
            [""],
            [""],
            [""],
            ["-----------------------[blue]"],
            ["", "PERF INIT>"]
        ]);
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
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
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
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
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
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
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
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
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

        let vnavTargetAltitude = 0;
        let vnavTargetDistance = 0;
        let topOfDescent = 0;
        let distanceToTod = 0;

        //RUN ACTUAL VNAV PATH CONTROL
        if (fmc._vnav) {
            fmc.registerPeriodicPageRefresh(() => {
                let isVNAVActivate = SimVar.GetSimVarValue("L:XMLVAR_VNAVButtonValue", "boolean") === 1;
                const vnavActive = isVNAVActivate ? "ACTIVE" : "INACTIVE";
                const vnavTargetWaypointIdent = WTDataStore.get('CJ4_vnavTargetWaypoint', 'none');
                const vnavValues = WTDataStore.get('CJ4_vnavValues', 'none');
                if (vnavValues != "none") {
                    console.log("vnav values");
                    const parsedVnavValues = JSON.parse(vnavValues);
                    vnavTargetAltitude = parseInt(parsedVnavValues.vnavTargetAltitude);
                    vnavTargetDistance = parseFloat(parsedVnavValues.vnavTargetDistance);
                    topOfDescent = parseFloat(parsedVnavValues.topOfDescent);
                    distanceToTod = parseFloat(parsedVnavValues.distanceToTod);
                }
                const altDeviation = SimVar.GetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet");
                const desiredFPA = WTDataStore.get('CJ4_vpa', 3);
                const setVerticalSpeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:2", "feet per minute");




                //COLLECT AIRCRAFT VARIABLES
                let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
                //let apCurrentAltitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "Feet");
                let apCurrentVerticalSpeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "Feet/minute");
                let altitude = SimVar.GetSimVarValue("PLANE ALTITUDE", "Feet");
                const desiredVerticalSpeed = -101.2686667 * groundSpeed * Math.tan(desiredFPA * (Math.PI / 180));

                             

                fmc._templateRenderer.setTemplateRaw([
                    ["", "", "WT VNAV" + vnavActive + "[blue]"],
                    [" target alt[blue]", "target dist [blue]"],
                    [vnavTargetAltitude.toFixed(0) + "ft", vnavTargetDistance.toFixed(1) + "nm"],
                    [" VNAV Target[blue]", "ground spd [blue]"],
                    [vnavTargetWaypointIdent + "", groundSpeed.toFixed(0) + "kts"],
                    [" target FPA[blue]", "target VS [blue]"],
                    [desiredFPA.toFixed(1) + "°", desiredVerticalSpeed.toFixed(0) + "fpm"],
                    [" alt dev[blue]", "ap vs [blue]"],
                    [altDeviation.toFixed(0) + "ft", apCurrentVerticalSpeed.toFixed(0) + "fpm"],
                    [" set vs[blue]", "TOD Dist[blue] "],
                    [setVerticalSpeed.toFixed(0) + "fpm[green]", distanceToTod + " nm"],
                    [""],
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

            const lnavActive = SimVar.GetSimVarValue('L:WT_CJ4_LNAV_ACTIVE', 'Bool') ? "LNAV ON[green]" :"LNAV OFF[white]";
            let isVNAVActivate = SimVar.GetSimVarValue("L:XMLVAR_VNAVButtonValue", "boolean") === 1;
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

            const xtk = SimVar.GetSimVarValue("L:WT_CJ4_XTK", "number");
            const dtk = SimVar.GetSimVarValue("L:WT_CJ4_DTK", "number");
            const wptDistance = SimVar.GetSimVarValue("L:WT_CJ4_WPT_DISTANCE", "number");
            const activeWaypointIdent = fmc.flightPlanManager.getActiveWaypoint().ident;
            const lnavActive = SimVar.GetSimVarValue('L:WT_CJ4_LNAV_ACTIVE', 'Bool') ? " ACTIVE[green]" :" INACTIVE[white]";
            const hdgIndex = SimVar.GetSimVarValue("AUTOPILOT HEADING SLOT INDEX", "number");
            const hdgLock = SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR", "degrees");
            const hdgLock1 = SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR:1", "degrees");
            const hdgLock2 = SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR:2", "degrees");
            const hdgHold = SimVar.GetSimVarValue("L:AP_HEADING_HOLD_ACTIVE", "number");


            fmc._templateRenderer.setTemplateRaw([
                ["", "", " WT LNAV[blue]" + lnavActive],
                [" ACT WPT[blue]", "DISTANCE [blue]"],
                [activeWaypointIdent, wptDistance + " NM"],
                [" DTK[blue]", "XTK [blue]"],
                [dtk + "°", xtk + " NM"],
                [" HDG IDX[blue]", "HDG LOCK [blue]"],
                [hdgIndex + "", hdgLock + "°"],
                [" HDG LOCK:1[blue]", "HDG LOCK:2 [blue]"],
                [hdgLock1 + "°", hdgLock2 + "°"],
                [" HDG HOLD VAL[blue]", " [blue]"],
                [hdgHold + ""],
                ["-----------------------[blue]"],
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