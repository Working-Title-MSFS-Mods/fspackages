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
		let depRunwayDirection = "";
        let depRunwayElevation = "";
        let depRunwayLength = "";
        let depRunwayOutput = "";
        let depRunway = "";

        if (fmc.flightPlanManager.getDepartureRunway()) {
            depRunway = fmc.flightPlanManager.getDepartureRunway();
            depRunwayOutput = fmc.getRunwayDesignation(depRunway);
            console.log("depRunwayOutput: " + depRunwayOutput);
           	depRunwayDirection = new Number(depRunway.direction);
            depRunwayElevation = new Number(depRunway.elevation * 3.28);
            depRunwayLength = new Number((depRunway.length) * 3.28);
        }

		let headwind = "";
		let crosswind = "";
		let crosswindDirection = "";
		let headwindDirection = "";
        
        if (fmc.takeoffWindDir != "---"){
            headwind = Math.trunc(fmc.takeoffWindSpeed * (Math.cos((depRunwayDirection * Math.PI / 180) - (fmc.takeoffWindDir * Math.PI / 180))));
            crosswind = Math.trunc(fmc.takeoffWindSpeed * (Math.sin((depRunwayDirection * Math.PI / 180) - (fmc.takeoffWindDir * Math.PI / 180))));
            crosswindDirection = crosswind > 0 ? "L"
            : crosswind < 0 ? "R"
            : "";
			headwindDirection = headwind > 0 ? "H"
            : headwind < 0 ? "T"
            : "";
			headwind = Math.abs(headwind);
			crosswind = Math.abs(crosswind);
        }
        
        let depRunwayConditionActive = fmc.depRunwayCondition == 0 ? "DRY"
            : "WET";

        //FIND SLOPE - disabled for now
        //let depRunwayNumberOnly = new Number(depRunwayOutput.slice(0,2));
        //let depRunwayOppositeNumber = depRunwayNumberOnly < 19 ? depRunwayNumberOnly + 18
        //    : depRunwayNumberOnly - 18;
        //let depRunwayOppositeMod = "";
        //let depRunwayOppositeDesignator = "";
        //if (depRunwayMod == ("L" || "C" || "R")) {
        //    depRunwayOppositeMod = depRunwayMod == "R" ? "L"
        //        : depRunwayMod == "C" ? "C"
        //        : depRunwayMod == "L" ? "R"
        //        : "";
        //    depRunwayOppositeDesignator = depRunwayOppositeNumber + depRunwayOppositeMod;
        //} else {
        //    depRunwayOppositeDesignator = depRunwayOppositeNumber;
        //}
        //let depRunwayOpposite = origin.infos.oneWayRunways.find(r => { return r.designation.indexOf(depRunwayOppositeDesignator) !== -1; });
        //console.log("Opposite Runway Designator: " + depRunwayOppositeDesignator);
        //console.log("Opposite Runway: " + depRunwayOpposite.designation);
        //console.log("Opposite Runway Elevation: " + (3.28 * depRunwayOpposite.elevation));
        //console.log("Current Runway: " + depRunwayDesignation);
        //console.log("Current Runway Elevation: " + depRunwayElevation);
        
        fmc.setTemplate([
            [originIdent + "   TAKEOFF REF[color]blue", "1", "3"],
			["RWY ID[color]blue", "WIND[color]blue"],
            ["RW" + depRunwayOutput, fmc.takeoffWindDir + "\xB0/" + fmc.takeoffWindSpeed],
            ["RWY WIND[color]blue", "OAT[color]blue"],
            [headwindDirection + headwind + " " + crosswindDirection + crosswind, fmc.takeoffOat + "\xB0C"],
            ["RWY LENGTH[color]blue", "QNH[color]blue"],
            [Math.round(depRunwayLength) + " FT", fmc.takeoffQnh + ""],
            ["WIND/SLOPE[color]blue", "P ALT[color]blue"],
            ["0", fmc.takeoffPressAlt + " FT"],
            ["RW COND[color]blue"],
            [depRunwayConditionActive + "[color]green"],
            [""],
            [""]
        ]);
		fmc.onRightInput[0] = () => {
            fmc.takeoffWindDir = new Number(fmc.inOut.slice(0, 3));
			fmc.takeoffWindSpeed = new Number(fmc.inOut.slice(4, 7));
			fmc.clearUserInput();
			{ CJ4_FMC_PerfInitPage.ShowPage6(fmc); };
		}
		fmc.onRightInput[1] = () => {
            fmc.takeoffOat = new Number(fmc.inOut);
			fmc.clearUserInput();
			{ CJ4_FMC_PerfInitPage.ShowPage6(fmc); };
		}
		fmc.onRightInput[2] = () => {

            let qnh = Number(fmc.inOut);
            if (qnh !== NaN && qnh > 28 && qnh < 34) {
                fmc.takeoffQnh = qnh.toFixed(2);
                fmc.takeoffPressAlt = Number(Math.trunc((((29.92 - fmc.takeoffQnh) * 1000) + depRunwayElevation)));
                fmc.clearUserInput();
            }
            else {
                fmc.showErrorMessage("INVALID");
            }

            CJ4_FMC_PerfInitPage.ShowPage6(fmc);
        }
        fmc.onLeftInput[4] = () => {
            if (fmc.depRunwayCondition == 0) {
                fmc.depRunwayCondition = 1;
            } else if (fmc.depRunwayCondition == 1) {
                fmc.depRunwayCondition = 0;
            }
            depRunwayConditionActive = fmc.depRunwayCondition == 0 ? "DRY"
                : "WET";
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
        let grossWeightValue = new Number(fmc.getWeight());
        if (isFinite(grossWeightValue)) {
            grWtCell = new Number((grossWeightValue * 2200).toFixed(0));
        }
		let tow = (grWtCell - 100);
		let depRunway = "";
		let depRunwayLength = "";
		let selectedRunway = fmc.flightPlanManager.getDepartureRunway();
		if (selectedRunway) {
			depRunway = "RW" + Avionics.Utils.formatRunway(selectedRunway.designation);
			depRunwayLength = new Number((selectedRunway.length) * 3.28);
		}
		let seaLevelDist = new Number ((tow-11000) * .1512) + 1568; //Finds the sea level distance based on weight
		fmc.endTakeoffDist = new Number ((((tow-11000) * .0000126) + .05775) * fmc.takeoffPressAlt) + seaLevelDist; //Finds the distance you would travel further than the sea level value for a given pressure altitude.  That value is then added to the previous line number to get the distance for a given weight and given altitude
		
		let takeoffWeightTempFactor = ((tow - 11000) * .000556) + 5.22; //Amount of feet per degree based on weight
		let takeoffTempFactor = (((tow - 11000) * .0001702) + 1.04) + takeoffWeightTempFactor; //Amount of feet per degree based on altitude which is then added to the weight factor
		
		if (tow > 15000 && fmc.takeoffOat > 5 && fmc.takeoffPressAlt > 4000){ //This line is for the exception where you are hot, high, and heavy, the OAT effects really make a big difference hence the 120 feet per degree factor
			fmc.endTakeoffDist = fmc.endTakeoffDist + (fmc.takeoffOat * 50);
		} else {
				if (fmc.takeoffOat > 0) { //Takeoff distance change by temp above 0
					fmc.endTakeoffDist = fmc.endTakeoffDist + (fmc.takeoffOat * takeoffTempFactor);
					console.log("A");
				}
				if (fmc.takeoffOat < 0) { //Takeoff distance change by temp below 0
					fmc.endTakeoffDist = fmc.endTakeoffDist + (fmc.takeoffOat * takeoffTempFactor);
				}
			}
		
		let v1 = ((tow - 11000) * .00229) + 85; //Sea level V Speeds at 0C for a given weight
		let vR = ((tow - 11000) * .00147) + 92;
		let v2 = ((tow - 11000) * .0009819) + 109;
		
		v1 = v1 + ((tow - 11000) * .00229);//Vspeed change based on weight
		vR = vR + ((tow - 11000) * .00147);
		v2 = v2 + ((tow - 11000) * .000818);
		
		v1 = v1 - (fmc.takeoffPressAlt * .000375); // Vspeed changed for pressure altitude
		vR = vR - (fmc.takeoffPressAlt * .000375);
		v2 = v2 - (fmc.takeoffPressAlt * .000625);
		
		let v1WeightFactorAbove = .055 + ((tow - 11000) * .00002733);  //Changes in V Speeds by temp by weight.  Below 0 degrees, the change is negligible so it's not included
		let vRWeightFactorAbove = .203 - ((tow - 11000) * .00001816);
		let v2WeightFactorAbove  = .314 - ((tow - 11000) * .00005139);
		
		if (fmc.takeoffOat > 0) { //V speed adjustment based on temperature above zero
			v1 = v1 - (fmc.takeoffOat * v1WeightFactorAbove);	
			vR = vR - (fmc.takeoffOat * vRWeightFactorAbove);
			v2 = v2 - (fmc.takeoffOat * v2WeightFactorAbove);
		}
		
		if (fmc.takeoffFlaps == 0) { //If takeoff flaps are set to 0
			fmc.endTakeoffDist = fmc.endTakeoffDist * 1.33;
			v1 = v1 + 9;
			vR = vR + 14;
			v2 = v2 + 14;
		}
		if (vR < v1) {
			vR = v1 + 2;
		}
		if (fmc.depRunwayCondition == 1) { // If the runway is wet
			fmc.endTakeoffDist = fmc.endTakeoffDist * 1.1;
		}
		if (fmc.takeoffAntiIce == 1) { //If anti-ice is turned on
			fmc.endTakeoffDist = fmc.endTakeoffDist * 1.03;
		}
		if (fmc.takeoffWindDir != "---"){
			let depRunwayDirection = new Number(selectedRunway.direction);
			let headwind = Math.trunc(fmc.takeoffWindSpeed * (Math.cos((depRunwayDirection * Math.PI / 180) - (fmc.takeoffWindDir * Math.PI / 180))));
			if (headwind > 0){
				fmc.endTakeoffDist = fmc.endTakeoffDist - (headwind * 22);
		} else {
			fmc.endTakeoffDist = fmc.endTakeoffDist - (headwind * 60);
		}
		}
		let takeoffFlapsActive = fmc.takeoffFlaps == 15 ? "15"
            : "0";
		let takeoffAntiIceActive = fmc.takeoffAntiIce == 0 ? "OFF"
			: "ON";
        fmc.setTemplate([
            ["TAKEOFF REF[color]blue", "2", "3"],
			["A/I[color]blue"],
			[takeoffAntiIceActive + "[color]green", "V1: " + v1.toFixed(0)],
            ["T/O FLAPS[color]blue"],
            [takeoffFlapsActive + "[color]green", "VR: " + vR.toFixed(0)],
            ["TOW/ GWT/MTOW[color]blue"],
            [tow  +  "/" + grWtCell + "/17110", "V2: " + v2.toFixed(0)],
            ["TOFL / " + depRunway + "[color]blue"],
            [fmc.endTakeoffDist.toFixed(0) + " / " + Math.round(depRunwayLength) + " FT", "VT: 140"],
            [""],
            [""],
            [""],
            ["", "SEND>"]
        ]);
		fmc.onLeftInput[0] = () => {
            if (fmc.takeoffAntiIce == 0) {
                fmc.takeoffAntiIce = 1;
            } else if (fmc.takeoffAntiIce == 1) {
                fmc.takeoffAntiIce = 0;
            }
            takeoffAntiIceActive = fmc.takeoffAntiIce == 0 ? "OFF"
                : "ON";
				fmc.clearUserInput();
			{ CJ4_FMC_PerfInitPage.ShowPage7(fmc); };
        }
		fmc.onLeftInput[1] = () => {
            if (fmc.takeoffFlaps == 15) {
                fmc.takeoffFlaps = 0;
            } else if (fmc.takeoffFlaps == 0) {
                fmc.takeoffFlaps = 15;
            }
            takeoffFlapsActive = fmc.takeoffFlaps == 0 ? "15"
                : "0";
				fmc.clearUserInput();
			{ CJ4_FMC_PerfInitPage.ShowPage7(fmc); };
        }
        fmc.onRightInput[5] = () => {
			SimVar.SetSimVarValue("L:AIRLINER_V1_SPEED", "Knots", v1);
			SimVar.SetSimVarValue("L:AIRLINER_VR_SPEED", "Knots", vR);
			SimVar.SetSimVarValue("L:AIRLINER_V2_SPEED", "Knots", v2);
			SimVar.SetSimVarValue("L:AIRLINER_VX_SPEED", "Knots", 140);
        }
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
		fmc.registerPeriodicPageRefresh(() => {
        
        //CWB added direct read of fuel quantity simvars
        let fuelQuantityLeft = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "Gallons"));
        let fuelQuantityRight = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "Gallons"));
        let fuelQuantityTotal = fuelQuantityRight + fuelQuantityLeft

        let totalFuelFlow = Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour"))
			+ Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour"));
		let hours = Math.trunc((fuelQuantityTotal - fmc.reserveFuel) / totalFuelFlow).toFixed(0);
		let hoursForResv =((fuelQuantityTotal - fmc.reserveFuel) / totalFuelFlow);
		let minutes = ((((fuelQuantityTotal - fmc.reserveFuel) / totalFuelFlow) % 1) * 60).toFixed(0).toString().padStart(2,"0");
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
        
        let fuelQuantityLeft = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "Gallons"));
        let fuelQuantityRight = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "Gallons"));
        
		let totalFuelFlow = Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour"))
            + Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour"));

        let fuelBurnedLeft = fmc.initialFuelLeft - fuelQuantityLeft;
        let fuelBurnedRight = fmc.initialFuelRight - fuelQuantityRight;
        let fuelBurnedTotal = fuelBurnedRight +fuelBurnedLeft;

        let fuelBurnedLeftDisplay = fuelBurnedLeft < 0 ? "XXXX"
            : fuelBurnedLeft;
        let fuelBurnedRightDisplay = fuelBurnedRight < 0 ? "XXXX"
            : fuelBurnedRight;
        let fuelBurnedTotalDisplay = fuelBurnedTotal < 0 ? "XXXX"
            : fuelBurnedTotal;

        fmc.onLeftInput[4] = () => { 
            fmc.initialFuelLeft = fuelQuantityLeft;
            fmc.initialFuelRight = fuelQuantityRight; };
        
        fmc.setTemplate([
			["FUEL MGMT[color]blue", "2", "3"],
            ["", "", "ENGINE FLOW - FUEL USED[color]blue"],
            ["", "LB", "LB/HR"],
            ["1", fuelBurnedLeftDisplay + "", Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour")).toString()],
            ["2", fuelBurnedRightDisplay + "", Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour")).toString()],
            ["TOTAL", fuelBurnedTotalDisplay + "", totalFuelFlow.toString()],
            [""],
            [""],
            [""],
            [""],
            ["<RESET FUEL USED"],
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

		let arrRunwayDirection = "";
		let arrRunwayElevation = "";
        let arrRunwayLength = "";
        let arrRunwayOutput = "";
        let arrRunway = "";

        if (fmc.flightPlanManager.getApproachRunway()) {
            arrRunway = fmc.flightPlanManager.getApproachRunway();
            arrRunwayOutput = fmc.getRunwayDesignation(arrRunway);
            arrRunwayDirection = new Number(arrRunway.direction);
            arrRunwayElevation = new Number(arrRunway.elevation * 3.28);
            arrRunwayLength = new Number((arrRunway.length) * 3.28);
        }

		let headwind = "";
		let crosswind = "";
		let crosswindDirection = "";
        let headwindDirection = "";
        
		if (fmc.landingWindDir != "---"){
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

        let arrRunwayConditionActive = fmc.arrRunwayCondition == 0 ? "DRY"
        : "WET";
        
        fmc.setTemplate([
            [destinationIdent + "   APPROACH REF[color]blue", "1", "3"],
			["SEL APT[color]blue", "WIND[color]blue"],
            [destinationIdent + "/" + originIdent + "[color]green", fmc.landingWindDir + "\xB0/" + fmc.landingWindSpeed],
            ["RWY ID[color]blue", "OAT[color]blue"],
            ["RW" + arrRunwayOutput, fmc.landingOat + "\xB0C"],
            ["RWY WIND[color]blue", "QNH[color]blue"],
            [headwindDirection + headwind + " " + crosswindDirection + crosswind, fmc.landingQnh],
            ["RUNWAY LENGTH[color]blue", "P ALT[color]blue"],
            [Math.round(arrRunwayLength) + " FT", fmc.landingPressAlt + " FT"],
            ["RWY SLOPE[color]blue"],
            ["--.-%"],
            ["RWY COND[color]blue"],
            [arrRunwayConditionActive + "[color]green"]
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
			fmc.landingQnh = new Number(fmc.inOut).toFixed(2);
			fmc.landingPressAlt = Math.trunc((((29.92 - fmc.landingQnh) * 1000) + arrRunwayElevation)) + " FT";
			fmc.clearUserInput();
			{ CJ4_FMC_PerfInitPage.ShowPage13(fmc); };
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
		let vRef = ((grWtCell - 10500) * .00393) + 92; //V Speeds based on weight at 0C
		let vApp = ((grWtCell - 10500) * .00408) + 98;
		let ldgFieldLength = ((grWtCell - 10500) * .137) + 2180;
		if (fmc.landingOat > 0) { //Takes the basic length and adds or subtracts distance based on weight and temperature difference from 15C.  Does not account for Pressure altitude yet
			ldgFieldLength = ldgFieldLength + (((grWtCell - 10500) * .000903) + 5.33) * (fmc.landingOat); //This calculates how many feet to add per degree greater or lower than 0c based on weight.  0c is used because that is where the base weights come from
		}
		if (fmc.landingOat < 0) {
			ldgFieldLength = ldgFieldLength + (((grWtCell - 10500) * .000903) + 5.33) * (fmc.landingOat);
		}
		let arrRunwayLength = "";
		let arrRunway = fmc.flightPlanManager.getApproachRunway();
		if (arrRunway) {
			arrRunwayLength = new Number((arrRunway.length) * 3.28);
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
            [ldgFieldLength.toFixed(0) + " / " + Math.trunc(arrRunwayLength) + " FT"],
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