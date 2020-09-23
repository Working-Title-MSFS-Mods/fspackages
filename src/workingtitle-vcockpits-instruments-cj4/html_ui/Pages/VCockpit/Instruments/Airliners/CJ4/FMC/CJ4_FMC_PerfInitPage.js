class CJ4_FMC_PerfInitPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            ["", "", "PERF MENU[blue]"],
            [""],
            ["<PERF INIT", "FUEL MGMT>"], //Page 2 ----9, 10, 11
            [""],
            ["<VNAV SETUP", "FLT LOG>"], //Page 3, 4, 5 ----12
            [""],
            ["<TAKEOFF", "APPROACH>"], //Page 6, 7, 8 ---13, 14, 15
            [""],
            [""],
            [" ADVISORY VNAV[blue]"],
            ["ENABLE[s-text]/[white]DISABLE[green]"],
            [" VNAV PLAN SPD[blue]"],
            ["", "", "--- KT"]
        ]);
        fmc.onLeftInput[0] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.onLeftInput[1] = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.onLeftInput[2] = () => { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); };
        fmc.onRightInput[0] = () => { CJ4_FMC_PerfInitPage.ShowPage9(fmc); };
        fmc.onRightInput[1] = () => { CJ4_FMC_PerfInitPage.ShowPage12(fmc); };
        fmc.onRightInput[2] = () => { CJ4_FMC_PerfInitPage.ShowPage13(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) { //PERF INIT
        fmc.clearDisplay();
        let grWtCell = "";
        let grossWeightValue = fmc.getWeight();
        if (isFinite(grossWeightValue)) {
            grWtCell = (grossWeightValue * 2200).toFixed(0);
        }
        let crzAltCell = "□□□□□";
        if (fmc.cruiseFlightLevel) {
            crzAltCell = fmc.cruiseFlightLevel;
        }
        fmc.onRightInput[0] = () => {
            let value = fmc.inOut;
            fmc.clearUserInput();
            if (fmc.setCruiseFlightLevelAndTemperature(value)) {
                CJ4_FMC_PerfInitPage.ShowPage2(fmc);
            }
        };
        let fuelQuantityLeft = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "Gallons"));
        let fuelQuantityRight = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "Gallons"));
        let fuelQuantityTotal = fuelQuantityRight + fuelQuantityLeft;
        let fuelCell = Math.trunc(fuelQuantityTotal);

        fmc._templateRenderer.setTemplateRaw([
            [" ACT PERF INIT[blue]","",""],
            [" BOW[blue]", "CRZ ALT[blue] "],
            ["(10280)[d-text]LB[s-text]", "FL" + crzAltCell],
            [" PASS/WT[blue]"],
            [" " + fmc.paxNumber + "/190[d-text]LB[s-text]"],
            [" CARGO[blue]", "= ZFW[blue] "],
            [" " + fmc.cargoWeight.toFixed(0).padStart(4, " ") + "[d-text] LB[s-text]", (fmc.zeroFuelWeight * 2200).toFixed(0).toString() + " LB[s-text]"],
            [" SENSED FUEL[blue]", "= GWT[blue] "],
            [" " + fuelCell + "[d-text] LB[s-text]", grWtCell + " LB[s-text]"],
            ["------------------------[blue]"],
            ["", "TAKEOFF>"],
            ["", ""],
            ["", "VNAV SETUP>"]
        ]);
        fmc.onLeftInput[1] = () => {
            fmc.paxNumber = fmc.inOut;
            fmc.zeroFuelWeight = ((fmc.inOut * 170) + fmc.cargoWeight + fmc.basicOperatingWeight) / 2200;
            fmc.clearUserInput();
            { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        }
        fmc.onLeftInput[2] = () => {
            fmc.cargoWeight = parseInt(fmc.inOut); //ParseInt changes from string to number
            fmc.zeroFuelWeight = (fmc.cargoWeight + (fmc.paxNumber * 170) + fmc.basicOperatingWeight) / 2200;
            fmc.clearUserInput();
            { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        }
        fmc.onRightInput[4] = () => { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage3(fmc) { //VNAV SETUP Page 1
        fmc.clearDisplay();
        fmc.setTemplate([
            ["ACT VNAV CLIMB[color]blue", "1", "3"],
            ["TGT SPEED[color]blue", "TRANS ALT[color]blue"],
            ["240/.64", "18000"],
            ["SPD/ALT LIMIT[color]blue"],
            ["250/10000"],
            [""],
            ["---/-----"],
            [""],
            [""],
            [""],
            [""],
            ["-----------------------[color]blue"],
            ["", "PERF INIT>"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage5(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage4(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage4(fmc) { //VNAV SETUP Page 2
        fmc.clearDisplay();
        fmc.setTemplate([
            ["ACT VNAV CRUISE[color]blue", "2", "3"],
            ["TGT SPEED[color]blue", "CRZ ALT[color]blue"],
            ["300/.74", "crzAltCell"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["-----------------------[color]blue"],
            ["", "PERF INIT>"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage5(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage5(fmc) { //VNAV SETUP Page 3
        fmc.clearDisplay();
        fmc.setTemplate([
            ["ACT VNAV DESCENT[color]blue", "3", "3"],
            ["TGT SPEED[color]blue", "TRANS FL[color]blue"],
            [".74/290", "FL180"],
            ["SPD/ALT LIMIT[color]blue"],
            ["250/10000", "VPA[color]blue"],
            ["---/-----", "3.0\xB0"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["-----------------------[color]blue"],
            ["", "PERF INIT>"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage4(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }

    static ShowPage9(fmc) { //FUEL MGMT Page 1
        fmc.clearDisplay();
        fmc.registerPeriodicPageRefresh(() => {

            //CWB added direct read of fuel quantity simvars
            let fuelQuantityLeft = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "Gallons"));
            let fuelQuantityRight = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "Gallons"));
            let fuelQuantityTotal = fuelQuantityRight + fuelQuantityLeft

            let totalFuelFlow = Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour"))
                + Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour"));
            let hours = Math.trunc((fuelQuantityTotal - fmc.reserveFuel) / totalFuelFlow).toFixed(0);
            let hoursForResv = ((fuelQuantityTotal - fmc.reserveFuel) / totalFuelFlow);
            let minutes = ((((fuelQuantityTotal - fmc.reserveFuel) / totalFuelFlow) % 1) * 60).toFixed(0).toString().padStart(2, "0");
            let rngToResv = (Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots")) * hoursForResv).toFixed(0);
            let spRng = ((1 / totalFuelFlow) * Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"))).toFixed(2).toString().substr(1);

            if (totalFuelFlow == 0) {
                hours = "-";
                rngToResv = "----";
                minutes = "--";
                spRng = ".----";
            }

            if (Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots")) == 0) {
                spRng = ".----";
                rngToResv = "----";
            }

            fmc.setTemplate([
                ["FUEL MGMT[color]blue", "1", "3"],
                ["FUEL[color]blue", "TIME TO RESV[color]blue"],
                [fuelQuantityTotal + " LB", hours + ":" + minutes],
                ["FUEL FLOW[color]blue", "RNG TO RESV[color]blue"],
                [totalFuelFlow.toString() + " LB HR", rngToResv + " NM"],
                ["RESERVES[color]blue", "SP RNG[color]blue"],
                [fmc.reserveFuel.toString() + " LB", spRng + "NM/LB"],
                ["GND SPD[color]blue"],
                [Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots")).toString()],
                [""],
                ["measured/" + "MANUAL[color]green"],
                ["-----------------------[color]blue"],
                ["", "PERF MENU>"]
            ]);
        }, 1000, true);

        fmc.onLeftInput[2] = () => {
            fmc.reserveFuel = fmc.inOut;
            fmc.clearUserInput();
            console.log(fmc.reserve);
            { CJ4_FMC_PerfInitPage.ShowPage9(fmc); };
        };
        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage11(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage10(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage10(fmc) { //FUEL MGMT Page 2
        fmc.clearDisplay();
        fmc.registerPeriodicPageRefresh(() => {

            let fuelQuantityLeft = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "Gallons"));
            let fuelQuantityRight = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "Gallons"));

            let totalFuelFlow = Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour"))
                + Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour"));

            let fuelBurnedLeft = fmc.initialFuelLeft - fuelQuantityLeft;
            let fuelBurnedRight = fmc.initialFuelRight - fuelQuantityRight;
            let fuelBurnedTotal = fuelBurnedRight + fuelBurnedLeft;

            let fuelBurnedLeftDisplay = fuelBurnedLeft < 0 ? "XXXX"
                : fuelBurnedLeft;
            let fuelBurnedRightDisplay = fuelBurnedRight < 0 ? "XXXX"
                : fuelBurnedRight;
            let fuelBurnedTotalDisplay = fuelBurnedTotal < 0 ? "XXXX"
                : fuelBurnedTotal;

            fmc.onLeftInput[4] = () => {
                fmc.initialFuelLeft = fuelQuantityLeft;
                fmc.initialFuelRight = fuelQuantityRight;
            };

            fmc.setTemplate([
                ["FUEL MGMT[color]blue", "2", "3"],
                ["", "", "ENGINE FLOW - FUEL USED[color]blue"],
                ["", "LB", "LB/HR"],
                ["1", fuelBurnedLeftDisplay + "", Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour")).toString()],
                [""],
                ["2", fuelBurnedRightDisplay + "", Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour")).toString()],
                [""],
                ["TOTAL", fuelBurnedTotalDisplay + "", totalFuelFlow.toString()],
                [""],
                [""],
                ["<RESET FUEL USED"],
                ["-----------------------[color]blue"],
                ["", "PERF INIT>"]
            ]);
        }, 1000, true);
        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage9(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage11(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage11(fmc) { //FUEL MGMT Page 3
        fmc.clearDisplay();
        let totalFuelFlow = Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour"))
            + Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour"));
        fmc.setTemplate([
            ["PERF TRIP[color]blue", "3", "3"],
            ["FROM[color]blue"],
            ["dep", "PPOS>"],
            ["TO[color]blue"],
            ["dest"],
            ["DIST[color]blue"],
            ["---"],
            ["GND SPD[color]blue", "FUEL FLOW[color]blue"],
            [Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots")).toString(), totalFuelFlow + " LB/HR"],
            ["ETE[color]blue", "FUEL REQ[color]blue"],
            ["---" + " LB"],
            ["-----------------------[color]blue"],
            ["<CLEAR", "PERF MENU>"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage10(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage9(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage12(fmc) { //FLIGHT LOG
        fmc.clearDisplay();
        let toTime = "---";
        let ldgTime = "---";
        let enrouteTime = "---";
        let fuelUsed = "---";
        let avgTas = "---";
        let avgGs = "---";
        let airDis = "---";
        let gndDis = "---";
        fmc.setTemplate([
            ["FLIGHT LOG[color]blue"],
            ["T/O[color]blue", "LDG[color]blue", "EN ROUTE[color]blue"],
            [toTime, ldgTime, enrouteTime],
            ["FUEL USED[color]blue", "AVG TAS/GS[color]blue"],
            [fuelUsed, avgTas + "/" + avgGs],
            ["AIR DIST[color]blue", "GND DIST[color]blue"],
            [airDis, gndDis],
            [""],
            [""],
            [""],
            [""],
            ["-----------------------[color]blue"],
            ["", "PERF MENU>"]
        ]);
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage13(fmc) { //APPROACH REF Page 1
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

        if (fmc.flightPlanManager.getApproachRunway()) {
            arrRunway = fmc.flightPlanManager.getApproachRunway();
            arrRunwayOutput = "RW" + fmc.getRunwayDesignation(arrRunway);
            arrRunwayDirection = new Number(arrRunway.direction);
            arrRunwayElevation = new Number(arrRunway.elevation * 3.28);
            arrRunwayLength = new Number((arrRunway.length) * 3.28);
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

        let selAptValue = destinationIdent ? destinationIdent + "[green]/[white]" + originIdent + "[s-text]" : "----"

        fmc.setTemplate([
            [destinationIdent, "", "APPROACH REF[blue]", 1, 3],
            ["SEL APT[blue]", "WIND[blue]"],
            [selAptValue, fmc.landingWindDir + "\xB0/" + fmc.landingWindSpeed],
            ["RWY ID[blue]", "OAT[blue]"],
            [arrRunwayOutput + " [s-text]", fmc.landingOat + "\xB0C"],
            ["RWY WIND[blue]", "QNH[blue]"],
            [headwindDirection + headwind + " " + crosswindDirection + crosswind + "[s-text]", fmc.landingQnh + "[s-text]"],
            ["RUNWAY LENGTH[blue]", "P ALT[blue]"],
            [Math.round(arrRunwayLength) + " FT[s-text]", fmc.landingPressAlt + " FT[s-text]"],
            ["RWY SLOPE[blue]"],
            ["--.-%"],
            ["RWY COND[blue]"],
            [arrRunwayConditionActive]
        ]);

        fmc.onRightInput[0] = () => {
            fmc.landingWindDir = fmc.inOut.slice(0, 3);
            fmc.landingWindSpeed = fmc.inOut.slice(4, 7);
            fmc.clearUserInput();
            { CJ4_FMC_PerfInitPage.ShowPage13(fmc); };
        }
        fmc.onRightInput[1] = () => {
            fmc.landingOat = new Number(fmc.inOut);
            fmc.clearUserInput();
            { CJ4_FMC_PerfInitPage.ShowPage13(fmc); };
        }
        fmc.onRightInput[2] = () => {

            let qnh = Number(fmc.inOut);
            if (qnh !== NaN && qnh > 28 && qnh < 34) {
                fmc.landingQnh = qnh.toFixed(2);
                fmc.landingPressAlt = Number(Math.trunc((((29.92 - fmc.landingQnh) * 1000) + arrRunwayElevation)));
                fmc.clearUserInput();
            }
            else {
                fmc.showErrorMessage("INVALID");
            }

            CJ4_FMC_PerfInitPage.ShowPage13(fmc);
        }
        fmc.onLeftInput[5] = () => {
            if (fmc.arrRunwayCondition == 0) {
                fmc.arrRunwayCondition = 1;
            } else if (fmc.arrRunwayCondition == 1) {
                fmc.arrRunwayCondition = 0;
            }
            arrRunwayConditionActive = fmc.arrRunwayCondition == 0 ? "DRY"
                : "WET";
            fmc.clearUserInput();
            { CJ4_FMC_PerfInitPage.ShowPage13(fmc); };
        }
        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage15(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage14(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage14(fmc) { //APPROACH REF Page 2
        fmc.clearDisplay();
        let grWtCell = "";
        let grossWeightValue = fmc.getWeight();
        if (isFinite(grossWeightValue)) {
            grWtCell = (grossWeightValue * 2200).toFixed(0);
        }

        //ADDED FUEL FLOW
        let totalFuelFlow = Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour"))
            + Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour"));

        //ADDED CODE FROM PROG
        let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
        let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");

        //default values
        let activeWaypointDist = 0;
        let destinationIdent = "";
        let destinationDistance = 0;

        //current active waypoint data
        if (fmc.flightPlanManager.getActiveWaypoint()) {
            activeWaypointDist = new Number(fmc.flightPlanManager.getDistanceToActiveWaypoint());
        }

        //destination data
        if (fmc.flightPlanManager.getDestination()) {
            let destination = fmc.flightPlanManager.getDestination();
            destinationIdent = new String(fmc.flightPlanManager.getDestination().ident);
            let destinationDistanceDirect = new Number(activeWaypointDist + Avionics.Utils.computeDistance(currPos, destination.infos.coordinates));
            let destinationDistanceFlightplan = new Number(destination.cumulativeDistanceInFP - fmc.flightPlanManager.getNextActiveWaypoint().cumulativeDistanceInFP + activeWaypointDist);
            destinationDistance = destinationDistanceDirect > destinationDistanceFlightplan ? destinationDistanceDirect
                : destinationDistanceFlightplan;
        }

        //END OF ADDED PROG CODE

        let eteToDestination = destinationDistance && groundSpeed > 0 ? (destinationDistance / groundSpeed)
            : 0;
        let fuelBurn = eteToDestination * totalFuelFlow;
        let ldgWt = grWtCell - fuelBurn;
        let ldgWtCell = fuelBurn == 0 ? "-----"
            : Math.trunc(ldgWt);

        let vRef = ((grWtCell - 10500) * .00393) + 92; //V Speeds based on weight at 0C
        let vApp = ((grWtCell - 10500) * .00408) + 98;
        let ldgFieldLength = ((grWtCell - 10500) * .126) + 2180; // Sea level base value for a given weight

        if (grWtCell <= 13500) {
            let ldgFieldAltFactor = ((13500 - grWtCell) * .000005) + .0825; //Gets factor value for rate of change based on weight
            ldgFieldLength = ldgFieldLength + (fmc.landingPressAlt * ldgFieldAltFactor);//Gets landing distance for a given altitude and added to the sea level value
        }
        if (grWtCell >= 14000 && grWtCell <= 14500) {
            let ldgFieldAltFactor = ((14500 - grWtCell) * .0000632) + .1175;
            ldgFieldLength = ldgFieldLength + (fmc.landingPressAlt * ldgFieldAltFactor);
        }
        if (grWtCell >= 15000 && grWtCell <= 15660) {
            let ldgFieldAltFactor = ((15660 - grWtCell) * .000205) + .1991;
            ldgFieldLength = ldgFieldLength + (fmc.landingPressAlt * ldgFieldAltFactor);
        }
        if (fmc.landingOat > 0) { //Takes the basic length and adds or subtracts distance based on weight and temperature difference from 15C.  Does not account for Pressure altitude yet
            ldgFieldLength = ldgFieldLength + (((grWtCell - 10500) * .000903) + 5.33) * fmc.landingOat; //This calculates how many feet to add per degree greater or lower than 0c based on weight.  0c is used because that is where the base weights come from
        }
        if (fmc.landingOat < 0) {
            ldgFieldLength = ldgFieldLength + (((grWtCell - 10500) * .000903) + 5.33) * fmc.landingOat;
        }

        if (fmc.landingWindDir != "---") {
            let arrRunway = fmc.flightPlanManager.getApproachRunway();
            let arrRunwayDirection = new Number(arrRunway.direction);
            let headwind = Math.trunc(fmc.landingWindSpeed * (Math.cos((arrRunwayDirection * Math.PI / 180) - (fmc.landingWindDir * Math.PI / 180))));
            if (headwind > 0) {
                let headwindFactor = (fmc.landingPressAlt * .00683) + 15;
                ldgFieldLength = ldgFieldLength - (headwind * headwindFactor);
            } else {
                let tailWindFactor = (fmc.landingPressAlt * .01608) + 55;
                ldgFieldLength = ldgFieldLength - (headwind * tailWindFactor);
            }
        }

        let arrRunwayLength = "";
        let arrRunway = fmc.flightPlanManager.getApproachRunway();
        if (arrRunway) {
            arrRunwayLength = new Number((arrRunway.length) * 3.28);
        }

        if (fmc.arrRunwayCondition == 1) { // If the runway is wet
            ldgFieldLength = ldgFieldLength * ((fmc.landingPressAlt * .0001025) + 1.21875); //Determines a factor to multiply with dependent on pressure altitude.  Sea level being 1.21x landing distance
        }

        fmc.setTemplate([
            ["", "", "APPROACH REF[blue]", 2, 3],
            ["A/I[blue]"],
            ["OFF[green]/[white]ON[s-text]"],
            ["", "V[blue]REF:[s-text] " + vRef.toFixed(0)],
            [""],
            ["LW / GWT/MLW[blue]", "V[blue]APP:[s-text] " + vApp.toFixed(0)],
            [ldgWtCell + "/" + grWtCell + "/15660"],
            ["LFL / RWXX[blue]"],
            [ldgFieldLength.toFixed(0) + " / " + Math.trunc(arrRunwayLength) + " FT"],
            ["LDG FACTOR[blue]"],
            ["1.0[green]" + "/[white]1.25[s-text]" + "/[white]1.67[s-text]" + "/[white]1.92[s-text]"],
            [""],
            ["", "SEND>"]
        ]);

        fmc.onRightInput[5] = () => {
            SimVar.SetSimVarValue("L:AIRLINER_VREF_SPEED", "Knots", vRef);
            //new L:WT_CJ4_VAP for Vapp in CJ4
            SimVar.SetSimVarValue("L:WT_CJ4_VAP", "Knots", vApp);
            //new LVARS to track whether vSpeed is set by FMS or not, used in PFD Airspeed Indicator to manage color magenta vs cyan
            SimVar.SetSimVarValue("L:WT_CJ4_VRF_FMCSET", "Bool", true);
            SimVar.SetSimVarValue("L:WT_CJ4_VAP_FMCSET", "Bool", true);
        }


        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage13(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage15(fmc); };
        fmc.updateSideButtonActiveStatus();
    }

    static ShowPage15(fmc) { //APPROACH REF Page 3
        fmc.clearDisplay();
        fmc.setTemplate([
            ["APPROACH REF[color]blue", "3", "3"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["", "", "UNDER CONSTRUCTION"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage14(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage13(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_PerfInitPage.js.map