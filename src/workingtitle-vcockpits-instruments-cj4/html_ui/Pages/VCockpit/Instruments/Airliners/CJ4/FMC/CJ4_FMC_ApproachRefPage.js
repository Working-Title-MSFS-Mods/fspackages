class CJ4_FMC_ApproachRefPage {
    static ShowPage1(fmc) { //APPROACH REF Page 1
        fmc.clearDisplay();
        let destinationIdent = "";
        let destination = fmc.flightPlanManager.getDestination();
        if (destination) {
            destinationIdent = destination.ident;
        }
        let originIdent = "";
        let origin = fmc.flightPlanManager.getOrigin();
        if (origin) {
            originIdent = origin.ident;
        }

        let arrRunwayDirection = "";
        let arrRunwayElevation = "";
        let arrRunwayLength = "";
        let arrRunwayOutput = "";
        let arrRunway = "";
        let runwayLoaded = false;

        if (fmc.flightPlanManager.getApproachRunway()) {
            arrRunway = fmc.flightPlanManager.getApproachRunway();
            arrRunwayOutput = "RW" + fmc.getRunwayDesignation(arrRunway);
            arrRunwayDirection = new Number(arrRunway.direction);
            arrRunwayElevation = new Number(arrRunway.elevation * 3.28);
            arrRunwayLength = new Number(arrRunway.length);
            runwayLoaded = true;
        }
        else if (fmc.vfrLandingRunway) {
            arrRunway = fmc.vfrLandingRunway;
            arrRunwayOutput = "RW" + Avionics.Utils.formatRunway(arrRunway.designation).trim();
            arrRunwayDirection = new Number(arrRunway.direction);
            arrRunwayElevation = new Number(arrRunway.elevation * 3.28);
            arrRunwayLength = new Number(arrRunway.length);
            runwayLoaded = true;
        }
        else {
            arrRunwayOutput = "NO APPROACH RW";
            runwayLoaded = false;
        }

        let headwind = "";
        let crosswind = "";
        let crosswindDirection = "";
        let headwindDirection = "";

        if (fmc.landingWindDir != "---") {
            headwind = Math.trunc(fmc.landingWindSpeed * (Math.cos((arrRunwayDirection * Math.PI / 180) - (fmc.landingWindDir * Math.PI / 180))));
            crosswind = Math.trunc(fmc.landingWindSpeed * (Math.sin((arrRunwayDirection * Math.PI / 180) - (fmc.landingWindDir * Math.PI / 180))));
            crosswindDirection = crosswind > 0 ? "L"
                : crosswind < 0 ? "R"
                    : "";
            headwindDirection = headwind > 0 ? "H"
                : crosswind < 0 ? "T"
                    : "";
            headwind = Math.abs(headwind);
            crosswind = Math.abs(crosswind);
        }

        let arrRunwayConditionActive = fmc.arrRunwayCondition == 0 ? "DRY[green]/[white]WET[s-text]"
            : "DRY[s-text]/[white]WET[green]";

        let selAptValue = destinationIdent ? destinationIdent + "[green]/[white]" + originIdent + "[s-text]" : "----";

        const arrRunwayLengthText = fmc.cj4Units == 1 ? Math.round(arrRunwayLength) + " M[s-text]" : Math.round(fmc.cj4Length * arrRunwayLength) + " FT[s-text]";
        const landingQnhText = fmc.cj4Units == 1 ? Math.round(fmc.landingQnh * fmc.cj4Qnh) : fmc.landingQnh.toFixed(2);

        fmc._templateRenderer.setTemplateRaw([
            [destinationIdent, "1/3 [blue]", "APPROACH REF[blue]"],
            [" SEL APT[blue]", "WIND [blue]"],
            [selAptValue, fmc.landingWindDir + "\xB0/" + fmc.landingWindSpeed],
            [" RWY ID[blue]", "OAT [blue]"],
            [arrRunwayOutput + " [s-text]", fmc.landingOat + "\xB0C"],
            [" RWY WIND[blue]", "QNH [blue]"],
            [headwindDirection + headwind + " " + crosswindDirection + crosswind + "[s-text]", landingQnhText + "[s-text]"],
            [" RUNWAY LENGTH[blue]", "P ALT [blue]"],
            [arrRunwayLengthText, fmc.landingPressAlt + " FT[s-text]"],
            [" RWY SLOPE[blue]"],
            ["--.-%"],
            [" RWY COND[blue]"],
            [arrRunwayConditionActive]
        ]);

        fmc.onRightInput[0] = () => {
            let windIn = fmc.inOut.split("/");
            if (windIn.length == 2 && windIn[0] <= 360 && windIn[0] >= 0 && windIn[1] >= 0) {
                fmc.landingWindDir = new Number(windIn[0]);
                fmc.landingWindSpeed = new Number(windIn[1]);
                fmc.appVSpeedStatus = CJ4_FMC.VSPEED_STATUS.NONE;
                fmc.clearUserInput();
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            CJ4_FMC_ApproachRefPage.ShowPage1(fmc);
        };

        fmc.onRightInput[1] = () => {
            let tempIn = parseFloat(fmc.inOut);
            if (tempIn && isNaN(tempIn)) {
                fmc.showErrorMessage("INVALID");
            }
            else if (tempIn) {
                fmc.landingOat = Math.trunc(tempIn);
                fmc.appVSpeedStatus = CJ4_FMC.VSPEED_STATUS.NONE;
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_ApproachRefPage.ShowPage1(fmc);
        };

        fmc.onRightInput[2] = () => {
            let qnhInput = Number(fmc.inOut);
            if (!isNaN(qnhInput)) {
                if (qnhInput > 28 && qnhInput < 32) {
                    fmc.landingQnh = qnhInput.toFixed(2);
                    fmc.landingPressAlt = Number(Math.trunc((((29.92 - fmc.landingQnh) * 1000) + arrRunwayElevation)));
                }
                else if (qnhInput > 280 && qnhInput < 320) {
                    let qnhParse = qnhInput / 10;
                    fmc.landingQnh = qnhParse.toFixed(2);
                    fmc.landingPressAlt = Number(Math.trunc((((29.92 - fmc.landingQnh) * 1000) + arrRunwayElevation)));
                }
                else if (qnhInput > 2800 && qnhInput < 3200) {
                    let qnhParse = qnhInput / 100;
                    fmc.landingQnh = qnhParse.toFixed(2);
                    fmc.landingPressAlt = Number(Math.trunc((((29.92 - fmc.landingQnh) * 1000) + arrRunwayElevation)));
                }
                else if (qnhInput > 940 && qnhInput < 1090) { //parse hPA input
                    let qnhParse = qnhInput / 33.864;
                    fmc.landingQnh = qnhParse.toFixed(2);
                    fmc.landingPressAlt = Number(Math.trunc((((29.92 - fmc.landingQnh) * 1000) + arrRunwayElevation)));
                }
                else {
                    fmc.showErrorMessage("INVALID");
                }
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            fmc.appVSpeedStatus = CJ4_FMC.VSPEED_STATUS.NONE;
            CJ4_FMC_ApproachRefPage.ShowPage1(fmc);
        };
        fmc.onLeftInput[5] = () => {
            if (fmc.arrRunwayCondition == 0) {
                fmc.arrRunwayCondition = 1;
            } else if (fmc.arrRunwayCondition == 1) {
                fmc.arrRunwayCondition = 0;
            }
            arrRunwayConditionActive = fmc.arrRunwayCondition == 0 ? "DRY[green]/[white]WET[s-text]"
                : "DRY[s-text]/[white]WET[green]";
            fmc.appVSpeedStatus = CJ4_FMC.VSPEED_STATUS.NONE;
            CJ4_FMC_ApproachRefPage.ShowPage1(fmc);
        };
        fmc.onPrevPage = () => {
            if (runwayLoaded == true && fmc.landingQnh > 28 && fmc.landingQnh < 32 && fmc.landingOat && fmc.landingWindDir >= 0 && fmc.landingWindDir <= 360) {
                CJ4_FMC_ApproachRefPage.ShowPage3(fmc);
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
        };
        fmc.onNextPage = () => {
            if (runwayLoaded == true && fmc.landingQnh > 28 && fmc.landingQnh < 32 && fmc.landingOat && fmc.landingWindDir >= 0 && fmc.landingWindDir <= 360) {
                CJ4_FMC_ApproachRefPage.ShowPage2(fmc);
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
        };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) { //APPROACH REF Page 2
        fmc.clearDisplay();
        let grossWeightValue = SimVar.GetSimVarValue("TOTAL WEIGHT", "kg") * 2.205;
        let arrRunwayDirection = "";
        let arrRunwayElevation = "";
        let arrRunwayLength = "";
        let arrRunwayOutput = "";
        let arrRunway = "";

        if (fmc.flightPlanManager.getApproachRunway()) {
            arrRunway = fmc.flightPlanManager.getApproachRunway();
            arrRunwayOutput = "RW" + fmc.getRunwayDesignation(arrRunway);
            arrRunwayDirection = new Number(arrRunway.direction);
            arrRunwayElevation = new Number(arrRunway.elevation * 3.28);
            arrRunwayLength = new Number((arrRunway.length) * 3.28);
        }
        else if (fmc.vfrLandingRunway) {
            arrRunway = fmc.vfrLandingRunway;
            arrRunwayOutput = "RW" + Avionics.Utils.formatRunway(arrRunway.designation).trim();
            arrRunwayDirection = new Number(arrRunway.direction);
            arrRunwayElevation = new Number(arrRunway.elevation * 3.28);
            arrRunwayLength = new Number((arrRunway.length) * 3.28);
        }

        //ADDED FUEL FLOW
        let totalFuelFlow = Math.round(SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:1", "Pounds per hour"))
            + Math.round(SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:2", "Pounds per hour"));

        //ADDED CODE FROM PROG
        let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
        let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");

        //default values
        let activeWaypointDist = 0;
        let destinationIdent = "";
        let destinationDistance = 0;

        //destination data
        if (fmc.flightPlanManager.getDestination() && fmc.flightPlanManager.getActiveWaypoint() && fmc.flightPlanManager.getNextActiveWaypoint()) {
            activeWaypointDist = new Number(fmc.flightPlanManager.getDistanceToActiveWaypoint());
            let destination = fmc.flightPlanManager.getDestination();
            destinationIdent = new String(fmc.flightPlanManager.getDestination().ident);
            let destinationDistanceDirect = new Number(activeWaypointDist + Avionics.Utils.computeDistance(currPos, destination.infos.coordinates));
            let destinationDistanceFlightplan = new Number(destination.cumulativeDistanceInFP - fmc.flightPlanManager.getNextActiveWaypoint().cumulativeDistanceInFP + activeWaypointDist);
            destinationDistance = destinationDistanceDirect > destinationDistanceFlightplan ? destinationDistanceDirect
                : destinationDistanceFlightplan;
        }
        else if (fmc.flightPlanManager.getDestination()) {
            let destination = fmc.flightPlanManager.getDestination();
            let destinationDistanceDirect = new Number(Avionics.Utils.computeDistance(currPos, destination.infos.coordinates));
            destinationDistance = destinationDistanceDirect;
        }

        //END OF ADDED PROG CODE

        let eteToDestination = destinationDistance && groundSpeed > 0 ? (destinationDistance / groundSpeed)
            : 0;
        let fuelBurn = eteToDestination * totalFuelFlow;
        let ldgWt = grossWeightValue - fuelBurn;

        let vRef = ((ldgWt - 10500) * .00393) + 92; //V Speeds based on weight at 0C
        let vApp = ((ldgWt - 10500) * .00408) + 98;
        let ldgFieldLength = ((ldgWt - 10500) * .126) + 2180; // Sea level base value for a given weight

        if (ldgWt <= 13500) {
            let ldgFieldAltFactor = ((13500 - ldgWt) * .000005) + .0825; //Gets factor value for rate of change based on weight
            ldgFieldLength = ldgFieldLength + (fmc.landingPressAlt * ldgFieldAltFactor);//Gets landing distance for a given altitude and added to the sea level value
        }
        if (ldgWt >= 14000 && ldgWt <= 14500) {
            let ldgFieldAltFactor = ((14500 - ldgWt) * .0000632) + .1175;
            ldgFieldLength = ldgFieldLength + (fmc.landingPressAlt * ldgFieldAltFactor);
        }
        if (ldgWt >= 15000 && ldgWt <= 15660) {
            let ldgFieldAltFactor = ((15660 - ldgWt) * .000205) + .1991;
            ldgFieldLength = ldgFieldLength + (fmc.landingPressAlt * ldgFieldAltFactor);
        }
        if (fmc.landingOat > 0) { //Takes the basic length and adds or subtracts distance based on weight and temperature difference from 15C.  Does not account for Pressure altitude yet
            ldgFieldLength = ldgFieldLength + (((ldgWt - 10500) * .000903) + 5.33) * fmc.landingOat; //This calculates how many feet to add per degree greater or lower than 0c based on weight.  0c is used because that is where the base weights come from
        }
        if (fmc.landingOat < 0) {
            ldgFieldLength = ldgFieldLength + (((ldgWt - 10500) * .000903) + 5.33) * fmc.landingOat;
        }

        if (fmc.landingWindDir != "---") {
            let headwind = Math.trunc(fmc.landingWindSpeed * (Math.cos((arrRunwayDirection * Math.PI / 180) - (fmc.landingWindDir * Math.PI / 180))));
            if (headwind > 0) {
                let headwindFactor = (fmc.landingPressAlt * .00683) + 15;
                ldgFieldLength = ldgFieldLength - (headwind * headwindFactor);
            } else {
                let tailWindFactor = (fmc.landingPressAlt * .01608) + 55;
                ldgFieldLength = ldgFieldLength - (headwind * tailWindFactor);
            }
        }

        if (fmc.arrRunwayCondition == 1) { // If the runway is wet
            ldgFieldLength = ldgFieldLength * ((fmc.landingPressAlt * .0001025) + 1.21875); //Determines a factor to multiply with dependent on pressure altitude.  Sea level being 1.21x landing distance
        }

        let vspeedSendMsg = "";
        if (fmc.appVSpeedStatus === CJ4_FMC.VSPEED_STATUS.INPROGRESS) {
            vspeedSendMsg = "IN PROGRESS";
        }
        else if (fmc.appVSpeedStatus === CJ4_FMC.VSPEED_STATUS.SENT) {
            vspeedSendMsg = "COMPLETE";
        }
        let vspeedColor = "";
        if (fmc.appVSpeedStatus === CJ4_FMC.VSPEED_STATUS.SENT) {
            vspeedColor = "blue";
        }

        function formatNumber(num, pad = 3) {
            return ((num === null || isNaN(num) || num === undefined) ? "" : num.toFixed(0)).padStart(pad, " ");
            }

        const ldgWtText = ldgWt < 10300 ? "-----"
            : ldgWt > 15660 ? Math.round(ldgWt * fmc.cj4Weight) + "[yellow]"
            : Math.round(ldgWt * fmc.cj4Weight);
        const grossWeightText = fmc.cj4Units == 1 ? Math.round(grossWeightValue * fmc.cj4Weight) + "/7103 KG[s-text]" : Math.round(grossWeightValue * fmc.cj4Weight) + "/15660 LB[s-text]";
        const landingDistText = fmc.cj4Units == 1 ? formatNumber((ldgFieldLength / 3.28), 4) : formatNumber(ldgFieldLength, 4);
        const arrRunwayLengthText = fmc.cj4Units == 1 ? formatNumber((arrRunwayLength / 3.28), 4) + " M[s-text]" : formatNumber(arrRunwayLength, 4) + " FT[s-text]";
    
        fmc._templateRenderer.setTemplateRaw([
            [destinationIdent, "2/3 [blue]", "APPROACH REF[blue]"],
            [" A/I[blue]"],
            ["OFF[green]/[white]ON[s-text]"],
            ["", "V[d-text blue]REF:[s-text blue] " + vRef.toFixed(0) + "[s-text + " + vspeedColor + "]"],
            [""],
            [" LW / GWT/MLW[blue]", "V[d-text blue]APP:[s-text blue] " + vApp.toFixed(0) + "[s-text + " + vspeedColor + "]"],
            [ldgWtText + " / " + grossWeightText],
            [" LFL / " + arrRunwayOutput + "[blue]"],
            [landingDistText + " / " + arrRunwayLengthText],
            [" LDG FACTOR[blue]"],
            ["1.0[green]" + "/[white]1.25[s-text]" + "/[white]1.67[s-text]" + "/[white]1.92[s-text]"],
            ["", vspeedSendMsg + " [s-text]"],
            ["", "SEND>[s-text]"]
        ]);

        if (fmc.appVSpeedStatus !== CJ4_FMC.VSPEED_STATUS.INPROGRESS) {
            fmc.onRightInput[5] = () => {
                fmc.appVSpeedStatus = CJ4_FMC.VSPEED_STATUS.INPROGRESS;
                setTimeout(() => {
                    fmc.appVSpeedStatus = CJ4_FMC.VSPEED_STATUS.SENT;
                    //new custom Cj4 LVARS for all V Speeds
                    SimVar.SetSimVarValue("L:WT_CJ4_VREF_SPEED", "Knots", vRef);
                    SimVar.SetSimVarValue("L:WT_CJ4_VAP", "Knots", vApp);
                    //new LVARS to track whether vSpeed is set by FMS or not, used in PFD Airspeed Indicator to manage color magenta vs cyan
                    SimVar.SetSimVarValue("L:WT_CJ4_VRF_FMCSET", "Bool", true);
                    SimVar.SetSimVarValue("L:WT_CJ4_VAP_FMCSET", "Bool", true);
                    CJ4_FMC_ApproachRefPage.ShowPage2(fmc); // TODO: this will probably send us back to this page even when user navigated away, find better solution
                }, 2000);
                CJ4_FMC_ApproachRefPage.ShowPage2(fmc);
            };
        }

        fmc.onPrevPage = () => { CJ4_FMC_ApproachRefPage.ShowPage1(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_ApproachRefPage.ShowPage3(fmc); };
        fmc.updateSideButtonActiveStatus();
    }

    static ShowPage3(fmc) { //APPROACH REF Page 3
        fmc.clearDisplay();

        let grossWeightValue = SimVar.GetSimVarValue("TOTAL WEIGHT", "kg") * 2.205;

        let totalFuelFlow = Math.round(SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:1", "Pounds per hour"))
            + Math.round(SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:2", "Pounds per hour"));

        let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
        let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");

        let activeWaypointDist = 0;
        let destinationIdent = "";
        let destinationDistance = 0;

        //destination data
        if (fmc.flightPlanManager.getDestination() && fmc.flightPlanManager.getActiveWaypoint() && fmc.flightPlanManager.getNextActiveWaypoint()) {
            activeWaypointDist = new Number(fmc.flightPlanManager.getDistanceToActiveWaypoint());
            let destination = fmc.flightPlanManager.getDestination();
            destinationIdent = new String(fmc.flightPlanManager.getDestination().ident);
            let destinationDistanceDirect = new Number(activeWaypointDist + Avionics.Utils.computeDistance(currPos, destination.infos.coordinates));
            let destinationDistanceFlightplan = new Number(destination.cumulativeDistanceInFP - fmc.flightPlanManager.getNextActiveWaypoint().cumulativeDistanceInFP + activeWaypointDist);
            destinationDistance = destinationDistanceDirect > destinationDistanceFlightplan ? destinationDistanceDirect
                : destinationDistanceFlightplan;
        }
        else if (fmc.flightPlanManager.getDestination()) {
            let destination = fmc.flightPlanManager.getDestination();
            let destinationDistanceDirect = new Number(Avionics.Utils.computeDistance(currPos, destination.infos.coordinates));
            destinationDistance = destinationDistanceDirect;
        }
        let eteToDestination = destinationDistance && groundSpeed > 0 ? (destinationDistance / groundSpeed)
            : 0;
        let fuelBurn = eteToDestination * totalFuelFlow;
        let ldgWt = grossWeightValue - fuelBurn;

        const ldgWtText = ldgWt < 10300 ? "-----"
            : ldgWt > 15660 ? Math.round(ldgWt * fmc.cj4Weight) + "[yellow]"
            : Math.round(ldgWt * fmc.cj4Weight);
        
        const mlwText = fmc.cj4Units == 1 ? "7103 KG" : "15660 LB";
        const perfLimText = fmc.cj4Units == 1 ? "7059 KG" : "15563 LB";
        const rwLimText = fmc.cj4Units == 1 ? "7760 KG" : "17110 LB";

        fmc._templateRenderer.setTemplateRaw([
            [destinationIdent, "3/3 [blue]", "APPROACH REF[blue]"],
            [" LW /MLW[blue]"],
            [ldgWtText + "/" + mlwText],
            ["", "STRUCTURAL LIMIT [blue]"],
            ["", mlwText],
            ["", "PERFORMANCE LIMIT [blue]"],
            ["", perfLimText],
            ["", "RUNWAY LENGTH LIMIT [blue]"],
            ["", rwLimText],
            [""],
            [""],
            [""],
            [""]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_ApproachRefPage.ShowPage2(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_ApproachRefPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}