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
            grWtCell = grossWeightValue.toFixed(2);
        }
        if (isFinite(fmc.zeroFuelWeight)) {
            fmc.onLeftInput[0] = () => {
                let value = fmc.inOut;
                fmc.clearUserInput();
                fmc.setWeight(value, (result) => {
                    if (result) {
                        CJ4_FMC_PerfInitPage.ShowPage2(fmc);
                    }
                });
            };
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
            fuelCell = fmc.blockFuel.toFixed(2);
        }
        let zfwCell = "";
        if (fmc.zeroFuelWeight) {
            zfwCell = fmc.zeroFuelWeight.toFixed(2);
        }
        fmc.setTemplate([
            ["ACT PERF INIT"+ "[color]blue"],
            ["BOW[color]blue", "CRZ ALT[color]blue"],
            ["(10280)LB", "FL" + crzAltCell],
            ["PASS/WT[color]blue"],
            ["0/170 LB"],
            ["CARGO[color]blue", "= ZFW[color]blue"],
            ["0 LB", zfwCell],
            ["SENSED FUEL[color]blue", "= GWT[color]blue"],
            [fuelCell + " LB", grWtCell],
            ["--------------------------"],
            ["", "TAKEOFF>"],
            ["", ""],
            ["", "VNAV SETUP>"]
        ]);
		fmc.onRightInput[4] = () => { CJ4_FMC_PerfInitPage.ShowPage6(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
	static ShowPage3(fmc) { //VNAV SETUP Page 1
		fmc.clearDisplay();
        fmc.setTemplate([
			["ACT VNAV CLIMB[color]blue", "1/3[color]blue"],
            ["TGT SPEED[color]blue", "TRANS ALT"],
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
			["ACT VNAV CRUISE[color]blue", "2/3[color]blue"],
            ["TGT SPEED[color]blue", "CRZ ALT"],
            ["240/.64", "crzAltCell"],
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
			["ACT VNAV DESCENT[color]blue", "3/3[color]blue"],
            ["TGT SPEED[color]blue", "TRANS FL"],
            [".77/280", "FL180"],
            ["SPD/ALT LIMIT[color]blue"],
            ["250/10000", "VPR[color]blue"],
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
        fmc.setTemplate([
            ["TAKEOFF REF[color]blue", "1/3"],
			["RWY ID[color]blue", "WIND[color]blue"],
            ["depRunway", "---\xB0/---"],
            ["RWY WIND[color]blue", "OAT[color]blue"],
            ["---", "□□□\xB0C"],
            ["RWY LENGTH[color]blue", "QNH[color]blue"],
            ["placehold", "placehold"],
            ["WIND/SLOPE[color]blue", "P ALT[color]blue"],
            ["placehold", "placehold"],
            ["RW COND[color]blue", "POS"],
            ["DRY[color]green/WET"],
            [""],
            [""]
        ]);
		fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage8(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage7(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
	static ShowPage7(fmc) { //TAKEOFF REF Page 2
		fmc.clearDisplay();
        fmc.setTemplate([
            ["TAKEOFF REF[color]blue", "2/3"],
			[""],
			["A/I[color]blue", "V1: 100"],
            ["OFF[color]green"],
            ["T/O FLAPS[color]blue", "VR: 103"],
            ["0/15[color]green"],
            ["TOW/ GWT/MTOW[color]blue", "V2: 112"],
            ["gwt" + "/" + "gwt" + "/17110"],
            ["TOFL[color]blue" + "/" + "depRunway", "VT: 143"],
            ["length" + "  length"],
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
        fmc.setTemplate([
            ["TAKEOFF REF[color]blue", "3/3"],
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
		fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage7(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage6(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
	static ShowPage9(fmc) { //FUEL MGMT Page 1
        fmc.clearDisplay();
        fmc.setTemplate([
			["FUEL MGMT[color]blue", "1/3[color]blue"],
            ["FUEL[color]blue", "TIME TO RESV[color]blue"],
            ["fob" + "LB", "placehold"],
            ["FUEL FLOW[color]blue", "RNG TO RESV[color]blue"],
            ["placehold", "placehold"],
            ["RESERVES[color]blue", "SP RNG[color]blue"],
            ["placehold", "placehold"],
            ["GND SPD[color]blue"],
            ["placehold"],
            [""],
            ["measured/" + "MANUAL[color]green"],
            ["------------------------[color]blue"],
            ["", "PERF MENU>"]
        ]);
		fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage11(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage10(fmc); };
		fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
	}
	static ShowPage10(fmc) { //FUEL MGMT Page 2
        fmc.clearDisplay();
        fmc.setTemplate([
			["FUEL MGMT[color]blue", "2/3[color]blue"],
            ["", "", "ENGINE FLOW - FUEL USED[color]blue"],
            ["", "LB", "LB/HR"],
            ["1", "XXX", "XXX"],
            ["2", "XXX", "XXX"],
            ["TOTAL", "XXX", "XXX"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["------------------------[color]blue"],
            ["", "PERF INIT>"]
        ]);
		fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage9(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage11(fmc); };
		fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
	}
	static ShowPage11(fmc) { //FUEL MGMT Page 3
        fmc.clearDisplay();
        fmc.setTemplate([
			["PERF TRIP[color]blue", "3/3[color]blue"],
            ["FROM[color]blue"],
            ["dep", "PPOS>"],
            ["TO[color]blue"],
            ["dest"],
            ["DIST[color]blue"],
            ["---"],
            ["GND SPD[color]blue", "FUEL FLOW[color]blue"],
            ["---", "----" + " LB/HR"],
            ["ETE[color]blue", "FUEL REQ[color]blue"],
            ["---" + "---" + " LB"],
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
		fmc.setTemplate([
            ["FLIGHT LOG[color]blue"],
            ["T/O[color]blue", "LDG[color]blue", "EN ROUTE[color]blue"],
            ["13:19", "14:16", "0:57"],
            ["FUEL USED[color]blue", "AVG TAS/GS[color]blue"],
            ["1965 LB", "350/375"],
            ["AIR DIST[color]blue", "GND DIST[color]blue"],
            ["322 NM", "356 NM"],
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
        fmc.setTemplate([
            ["APPROACH REF[color]blue", "1/3"],
			["SEL APT[color]blue", "WIND[color]blue"],
            ["depRunway", "---\xB0/---"],
            ["RWY ID[color]blue", "OAT[color]blue"],
            ["---", "□□□\xB0C"],
            ["RWY WIND[color]blue", "QNH[color]blue"],
            ["H4  L0", "placehold"],
            ["RUNWAY LENGTH[color]blue", "P ALT[color]blue"],
            ["5001 FT", "placehold"],
            ["RWY SLOPE[color]blue"],
            ["--.-%"],
            ["RWY COND[color]blue"],
            ["DRY[color]green" + "/WET"]
        ]);
		fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage15(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage14(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
	static ShowPage14(fmc) { //APPROACH REF Page 2
        fmc.clearDisplay();
        fmc.setTemplate([
			["APPROACH REF[color]blue", "2/3"],
			["A/I[color]blue"],
            ["OFF/ON[color]green"],
            ["", "VREF: 97"],
            [""],
            ["LW / GWT/MLW[color]blue", "VAPP: 105"],
            ["gwt" + "/" + "gwt" + "/15660"],
            ["LFL / RWXX[color]blue"],
            ["XXXX / XXXX FT"],
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
            ["APPROACH REF[color]blue", "3/3"],
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