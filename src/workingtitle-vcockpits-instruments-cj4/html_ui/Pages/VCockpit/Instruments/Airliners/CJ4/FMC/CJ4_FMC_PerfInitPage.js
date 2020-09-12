class CJ4_FMC_PerfInitPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        fmc.setTemplate([
            ["PERF MENU[color]blue"],
            [""],
            ["<PERF INIT", "FUEL MGMT>"], //Page 2 ----9, 10, 11
            [""],
            ["<VNAV SETUP", "FLT LOG>"], //Page 3, 4, 5 ----12
            [""],
            ["<TAKEOFF", "APPROACH>"], //Page 6, 7, 8 ---13, 14, 15
            [""],
            [""],
            ["ENABLE[color]green" + "/DISABLE"],
            ["VNAV PLAN SPD[color]blue"],
            ["<RESUME 250 KT"],
            [""]
        ]);
		fmc.onLeftInput[0] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
		fmc.onLeftInput[1] = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
		fmc.onLeftInput[2] = () => { CJ4_FMC_PerfInitPage.ShowPage6(fmc); };
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
        let fuelCell = "";
        if (fmc.blockFuel) {
            fuelCell = (fmc.blockFuel * 2200).toFixed(0);
        }		
        fmc.setTemplate([
            ["ACT PERF INIT"+ "[color]blue"],
            ["BOW[color]blue", "CRZ ALT[color]blue"],
            ["(10280)LB", "FL" + crzAltCell],
            ["PASS/WT[color]blue"],
            [fmc.paxNumber + "/170 LB"],
            ["CARGO[color]blue", "= ZFW[color]blue"],
            [fmc.cargoWeight + " LB", (fmc.zeroFuelWeight * 2200).toFixed(0).toString() + " LB"],
            ["SENSED FUEL[color]blue", "= GWT[color]blue"],
            [fuelCell + " LB", grWtCell + " LB"],
            ["--------------------------"],
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
		fmc.onRightInput[4] = () => { CJ4_FMC_PerfInitPage.ShowPage6(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
	static ShowPage3(fmc) { //VNAV SETUP Page 1
		fmc.clearDisplay();
        fmc.setTemplate([
			["ACT VNAV CLIMB[color]blue", "1", "3"],
            ["TGT SPEED[color]blue", "TRANS ALT[color]blue"],
            ["240/.64", "FL180"],
            ["SPD/ALT LIMIT[color]blue"],
            ["250/10000"],
            [""],
            ["---/-----"],
            [""],
            [""],
            [""],
            [""],
            ["------------------------[color]blue"],
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
            ["------------------------[color]blue"],
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
            ["------------------------[color]blue"],
            ["", "PERF INIT>"]
        ]);
		fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage4(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
	static ShowPage6(fmc) { //TAKEOFF REF Page 1
		fmc.clearDisplay();
		let originIdent = "";
        let origin = fmc.flightPlanManager.getOrigin();
        if (origin) {
            originIdent = origin.ident;
        }
		let depRunway = "";
		let depRunwayDirection = "";
		let depRunwayElevation = "";
		let selectedRunway = fmc.flightPlanManager.getDepartureRunway();
		if (selectedRunway) {
			depRunway = "RW" + Avionics.Utils.formatRunway(selectedRunway.designation);
			depRunwayDirection = selectedRunway.direction;
			depRunwayElevation = selectedRunway.elevation * 3.28;
		}
		let headwind = "";
		let crosswind = "";
		let crosswindDirection = "";
		let headwindDirection = "";
		if (fmc.takeoffWindDir != "---"){
            headwind = Math.trunc(fmc.takeoffWindSpeed * (Math.cos((depRunwayDirection * Math.PI / 180) - (fmc.takeoffWindDir * Math.PI / 180))));
            crosswind = Math.trunc(fmc.takeoffWindSpeed * (Math.sin((depRunwayDirection * Math.PI / 180) - (fmc.takeoffWindDir * Math.PI / 180))));
            crosswindDirection = crosswind > 0 ? "R"
            : crosswind < 0 ? "L"
            : "";
			headwindDirection = headwind > 0 ? "H"
            : crosswind < 0 ? "T"
            : "";
			headwind = Math.abs(headwind);
			crosswind = Math.abs(crosswind);
        }
        fmc.setTemplate([
            [originIdent + "   TAKEOFF REF[color]blue", "1", "3"],
			["RWY ID[color]blue", "WIND[color]blue"],
            [depRunway, fmc.takeoffWindDir + "\xB0/" + fmc.takeoffWindSpeed],
            ["RWY WIND[color]blue", "OAT[color]blue"],
            [headwindDirection + headwind + " " + crosswindDirection + crosswind, fmc.takeoffOat + "\xB0C"],
            ["RWY LENGTH[color]blue", "QNH[color]blue"],
            ["placehold", fmc.takeoffQnh],
            ["WIND/SLOPE[color]blue", "P ALT[color]blue"],
            ["placehold", fmc.takeoffPressAlt],
            ["RW COND[color]blue", "POS"],
            ["DRY[color]green/WET"],
            [""],
            [""]
        ]);
		fmc.onRightInput[0] = () => {
            fmc.takeoffWindDir = fmc.inOut.slice(0, 3);
			fmc.takeoffWindSpeed = fmc.inOut.slice(4, 7);
			fmc.clearUserInput();
			{ CJ4_FMC_PerfInitPage.ShowPage6(fmc); };
		}
		fmc.onRightInput[1] = () => {
            fmc.takeoffOat = fmc.inOut;
			fmc.clearUserInput();
			{ CJ4_FMC_PerfInitPage.ShowPage6(fmc); };
		}
		fmc.onRightInput[2] = () => {
			fmc.takeoffQnh = fmc.inOut;
			fmc.takeoffPressAlt = Math.trunc((((29.92 - fmc.takeoffQnh) * 1000) + depRunwayElevation));
			fmc.clearUserInput();
			{ CJ4_FMC_PerfInitPage.ShowPage6(fmc); };
		}
		fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage8(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage7(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
	static ShowPage7(fmc) { //TAKEOFF REF Page 2
		fmc.clearDisplay();
		let grWtCell = "";
        let grossWeightValue = fmc.getWeight();
        if (isFinite(grossWeightValue)) {
            grWtCell = (grossWeightValue * 2200).toFixed(0);
        }
		let tow = (grWtCell - 100);
		let depRunway = "";
		let selectedRunway = fmc.flightPlanManager.getDepartureRunway();
		if (selectedRunway) {
			depRunway = "RW" + Avionics.Utils.formatRunway(selectedRunway.designation);
		}
		let altConvFactor = (fmc.takeoffPressAlt * .0000319) + .1684; //Gets a conversion factor for distance change rate based on pressure altitude
		let wgtConvFactor = ((tow-11000) * .0000319) + .0647; //Gets a conversion factor for distance change rate based on aircraft weight
		let startWeightDist = (fmc.takeoffPressAlt * altConvFactor) + 1715; //Gets the starting sea level distance value for the given aircraft altitude at base weight of 11,000
		let endWeightDist = ((tow-11000) * wgtConvFactor) + startWeightDist; //The startWeight is then multiplied by the weight above 11,000lbs by the conversion factor to give the distance at the given aircraft weight and altitude

		//let wgtTempFactor = ((tow-11000) * .000669) + 8.63; //Gets the number of feet per degree to add for a given weight
		//let altTempFactor = (fmc.takeoffPressAlt * .0000053) + .0875; // Gets the number of feet per degree to add for a given altitude
		
		//if (fmc.takeoffOat > 15) {
		//	endWeightDist = endWeightDist + (altTempFactor * (fmc.takeoffOat - 15));
		//	endWeightDist = endWeightDist + (wgtTempFactor * (fmc.takeoffOat - 15));
		//}
		//if (fmc.takeoffOat < 15) {
		//	endWeightDist = endWeightDist - (altTempFactor * (fmc.takeoffOat - 15));
		//	endWeightDist = endWeightDist - (wgtTempFactor * (fmc.takeoffOat - 15));
		//}
		
		let v1 = ((tow - 11000) * .00229) + 85; //V Speeds based on weight
		let vR = ((tow - 11000) * .00147) + 92;
		let v2 = ((tow - 11000) * .0009819) + 108;
		if (fmc.takeoffOat >= 35) { //V speeds based on temperature
			v1 = v1 + (fmc.takeoffOat - 35) * .368;	
			vR = vR + (fmc.takeoffOat - 35) * .368;	
		}
        fmc.setTemplate([
            ["TAKEOFF REF[color]blue", "2", "3"],
			[""],
			["A/I[color]blue", "V1: " + v1.toFixed(0)],
            ["OFF/ON[color]green"],
            ["T/O FLAPS[color]blue", "VR: " + vR.toFixed(0)],
            ["0/15[color]green"],
            ["TOW/ GWT/MTOW[color]blue", "V2: " + v2.toFixed(0)],
            [tow  +  "/" + grWtCell + "/17110"],
            ["TOFL / " + depRunway + "[color]blue", "VT: 140"],
            [endWeightDist.toFixed(0) + " / " + "----- FT"],
            [""],
            [""],
            ["", "SEND>"]
        ]);
		fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage6(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage8(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
	static ShowPage8(fmc) { //TAKEOFF REF Page 3
		fmc.clearDisplay();
		let originIdent = "";
        let origin = fmc.flightPlanManager.getOrigin();
        if (origin) {
            originIdent = origin.ident;
        }
		let grWtCell = "";
        let grossWeightValue = fmc.getWeight();
        if (isFinite(grossWeightValue)) {
            grWtCell = (grossWeightValue * 2200).toFixed(0);
        }
		let tow = (grWtCell - 100);
        fmc.setTemplate([
            [originIdent + " TAKEOFF REF[color]blue", "3", "3"],
			["TOW/MTOW[color]blue"],
            [tow + "/17110"],
            ["", "STRUCTURAL LIMIT[color]blue"],
            ["", "17110"],
            ["", "PERFORMANCE LIMIT[color]blue"],
            ["", "17110"],
            ["", "RUNWAY LENGTH LIMIT[color]blue"],
            ["", "17110"],
            [""],
            [""],
            [""],
            [""]
        ]);
		fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage7(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage6(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
	static ShowPage9(fmc) { //FUEL MGMT Page 1
        fmc.clearDisplay();
		let fuelCell = "";
        if (fmc.blockFuel) {
            fuelCell = (fmc.blockFuel * 2200).toFixed(0);
        }
		fmc.registerPeriodicPageRefresh(() => {
			
		let totalFuelFlow = Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour"))
			+ Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour"));
		let hours = Math.trunc(((fmc.blockFuel * 2200).toFixed(0) - fmc.reserveFuel) / totalFuelFlow).toFixed(0);
		let hoursForResv =(((fmc.blockFuel * 2200).toFixed(0) - fmc.reserveFuel) / totalFuelFlow);
		let minutes = (((((fmc.blockFuel * 2200).toFixed(0) - fmc.reserveFuel) / totalFuelFlow) % 1) * 60).toFixed(0).toString().padStart(2,"0");
		let rngToResv = (Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots")) * hoursForResv).toFixed(0);
		let spRng = ((1 / totalFuelFlow) * Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"))).toFixed(2).toString().substr(1);
		if (totalFuelFlow == 0){
			hours = "-";
			rngToResv = "----";
			minutes = "--";
			spRng = ".----";
		}
		if (Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots")) == 0){
			spRng = ".----";
			rngToResv = "----";
		}
		console.log(hours);
		console.log(minutes);
        fmc.setTemplate([
			["FUEL MGMT[color]blue", "1", "3"],
            ["FUEL[color]blue", "TIME TO RESV[color]blue"],
            [fuelCell + " LB", hours + ":" + minutes],
            ["FUEL FLOW[color]blue", "RNG TO RESV[color]blue"],
            [totalFuelFlow.toString() + " LB HR", rngToResv + " NM"],
            ["RESERVES[color]blue", "SP RNG[color]blue"],
            [fmc.reserveFuel.toString() + " LB", spRng + "NM/LB"],
            ["GND SPD[color]blue"],
            [Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots")).toString()],
            [""],
            ["measured/" + "MANUAL[color]green"],
            ["------------------------[color]blue"],
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
			
		let totalFuelFlow = Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour"))
			+ Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour"));
        fmc.setTemplate([
			["FUEL MGMT[color]blue", "2", "3"],
            ["", "", "ENGINE FLOW - FUEL USED[color]blue"],
            ["", "LB", "LB/HR"],
            ["1", "XXX", Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour")).toString()],
            ["2", "XXX", Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour")).toString()],
            ["TOTAL", "XXX", totalFuelFlow.toString()],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["------------------------[color]blue"],
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
            ["------------------------[color]blue"],
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
            ["--------------------------[color]blue"],
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
		let arrRunwayDesignation = "";
		let arrRunwayDirection = "";
		let arrRunwayElevation = "";
		let arrRunway = fmc.flightPlanManager.getApproachRunway();
		if (arrRunway) {
			arrRunwayDesignation = "RW" + arrRunway.designation;
			arrRunwayDirection = arrRunway.direction;
			arrRunwayElevation = arrRunway.elevation * 3.28;
		}
		
		let checkLength = arrRunwayDesignation.length; //Checks to see if runway is single digit.  Then it adds a zero to the front.
		if (checkLength == 1) {
			arrRunwayDesignation = "RW" + arrRunwayDesignation.padStart(2, "0");
		}
		let headwind = "";
		let crosswind = "";
		let crosswindDirection = "";
		let headwindDirection = "";
		if (fmc.landingWindDir != "---"){
            headwind = Math.trunc(fmc.landingWindSpeed * (Math.cos((arrRunwayDirection * Math.PI / 180) - (fmc.landingWindDir * Math.PI / 180))));
            crosswind = Math.trunc(fmc.landingWindSpeed * (Math.sin((arrRunwayDirection * Math.PI / 180) - (fmc.landingWindDir * Math.PI / 180))));
            crosswindDirection = crosswind > 0 ? "R"
            : crosswind < 0 ? "L"
            : "";
			headwindDirection = headwind > 0 ? "H"
            : crosswind < 0 ? "T"
            : "";
			headwind = Math.abs(headwind);
			crosswind = Math.abs(crosswind);
        }

        fmc.setTemplate([
            [destinationIdent + "   APPROACH REF[color]blue", "1", "3"],
			["SEL APT[color]blue", "WIND[color]blue"],
            [destinationIdent + "/" + originIdent + "[color]green", fmc.landingWindDir + "\xB0/" + fmc.landingWindSpeed],
            ["RWY ID[color]blue", "OAT[color]blue"],
            [arrRunwayDesignation, fmc.landingOat + "\xB0C"],
            ["RWY WIND[color]blue", "QNH[color]blue"],
            [headwindDirection + headwind + " " + crosswindDirection + crosswind, fmc.landingQnh],
            ["RUNWAY LENGTH[color]blue", "P ALT[color]blue"],
            ["5001 FT", fmc.landingPressAlt],
            ["RWY SLOPE[color]blue"],
            ["--.-%"],
            ["RWY COND[color]blue"],
            ["DRY[color]green" + "/WET"]
        ]);
		fmc.onRightInput[0] = () => {
            fmc.landingWindDir = fmc.inOut.slice(0, 3);
			fmc.landingWindSpeed = fmc.inOut.slice(4, 7);
			fmc.clearUserInput();
			{ CJ4_FMC_PerfInitPage.ShowPage13(fmc); };
		}
		fmc.onRightInput[1] = () => {
            fmc.landingOat = fmc.inOut;
			fmc.clearUserInput();
			{ CJ4_FMC_PerfInitPage.ShowPage13(fmc); };
		}
		fmc.onRightInput[2] = () => {
			fmc.landingQnh = fmc.inOut;
			fmc.landingPressAlt = Math.trunc((((29.92 - fmc.landingQnh) * 1000) + arrRunwayElevation)) + " FT";
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
		let vRef = ((grWtCell - 10500) * .00393) + 92; //V Speeds based on weight at 0C
		let vApp = ((grWtCell - 10500) * .00408) + 98;
		let ldgFieldLength = ((grWtCell - 10500) * .137) + 2180;
		if (fmc.landingOat > 0) { //Takes the basic length and adds or subtracts distance based on weight and temperature difference from 15C.  Does not account for Pressure altitude yet
			ldgFieldLength = ldgFieldLength + (((grWtCell - 10500) * .000903) + 5.33) * (fmc.landingOat); //This calculates how many feet to add per degree greater or lower than 0c based on weight.  0c is used because that is where the base weights come from
		}
		if (fmc.landingOat < 0) {
			ldgFieldLength = ldgFieldLength + (((grWtCell - 10500) * .000903) + 5.33) * (fmc.landingOat);
		}
        fmc.setTemplate([
			["APPROACH REF[color]blue", "2", "3"],
			["A/I[color]blue"],
            ["OFF/ON[color]green"],
            ["", "VREF: " + vRef.toFixed(0)],
            [""],
            ["LW / GWT/MLW[color]blue", "VAPP: " + vApp.toFixed(0)],
            [grWtCell + "/" + grWtCell + "/15660"],
            ["LFL / RWXX[color]blue"],
            [ldgFieldLength.toFixed(0) + " / " + " ---- FT"],
            ["LDG FACTOR[color]blue"],
            ["1.0" + "/1.25" + "/1.67" + "/1.92"],
            [""],
			["", "SEND>"]
        ]);
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