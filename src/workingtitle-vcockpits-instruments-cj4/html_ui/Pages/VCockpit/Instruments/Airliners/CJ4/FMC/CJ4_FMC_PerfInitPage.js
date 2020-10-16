class CJ4_FMC_PerfInitPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        const advSwitch = fmc._templateRenderer.renderSwitch(["ENABLE", "DISABLE"], 1);
        fmc._templateRenderer.setTemplateRaw([
            ["", "", "PERF MENU[blue]"],
            [""],
            ["<PERF INIT", "FUEL MGMT>"],
            [""],
            ["<VNAV SETUP[disabled]", "FLT LOG>"], //Page 3, 4, 5 ----12
            [""],
            ["<TAKEOFF", "APPROACH>"], //Page 6, 7, 8 ---13, 14, 15
            [""],
            [""],
            [" ADVISORY VNAV[blue]"],
            [advSwitch],
            [" VNAV PLAN SPD[blue]"],
            ["        --- KT[s-text white]"]
        ]);
        fmc.onLeftInput[0] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.onLeftInput[1] = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.onLeftInput[2] = () => { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); };
        fmc.onRightInput[0] = () => { CJ4_FMC_FuelMgmtPage.ShowPage1(fmc); };
        fmc.onRightInput[1] = () => { CJ4_FMC_PerfInitPage.ShowPage12(fmc); };
        fmc.onRightInput[2] = () => { CJ4_FMC_ApproachRefPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) { //PERF INIT
        fmc.clearDisplay();
		
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

		let zFW = 10280 + (fmc.paxNumber * 170) + fmc.cargoWeight;
		fmc.grossWeight = zFW + fuelCell;
		
		if (zFW > 12500) {
			zFW = zFW + "[yellow]";
		}

        fmc._templateRenderer.setTemplateRaw([
            [" ACT PERF INIT[blue]","",""],
            [" BOW[blue]", "CRZ ALT[blue] "],
            ["(10280)[d-text]LB[s-text]", "FL" + crzAltCell],
            [" PASS/WT[blue]"],
            [" " + fmc.paxNumber + "/170[d-text]LB[s-text]"],
            [" CARGO[blue]", "= ZFW[blue] "],
            [" " + fmc.cargoWeight.toFixed(0).padStart(4, " ") + "[d-text] LB[s-text]", zFW + " LB[s-text]"],
            [" SENSED FUEL[blue]", "= GWT[blue] "],
            [" " + fuelCell + "[d-text] LB[s-text]", fmc.grossWeight + " LB[s-text]"],
            ["------------------------[blue]"],
            ["", "TAKEOFF>"],
            ["", ""],
            ["", "VNAV SETUP>"]
        ]);
        fmc.onLeftInput[1] = () => {
            fmc.paxNumber = fmc.inOut;
            zFW = ((fmc.inOut * 170) + fmc.cargoWeight + fmc.basicOperatingWeight) / 2200;
            fmc.clearUserInput();
            { CJ4_FMC_PerfInitPage.ShowPage2(fmc); }
        };
        fmc.onLeftInput[2] = () => {
            fmc.cargoWeight = parseInt(fmc.inOut); //ParseInt changes from string to number
            zFW = (fmc.cargoWeight + (fmc.paxNumber * 170) + fmc.basicOperatingWeight) / 2200;
            fmc.clearUserInput();
            { CJ4_FMC_PerfInitPage.ShowPage2(fmc); }
        };
        fmc.onRightInput[4] = () => { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage3(fmc) { //VNAV SETUP Page 1
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
        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage5(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage4(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage4(fmc) { //VNAV SETUP Page 2
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
        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage5(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage5(fmc) { //VNAV SETUP Page 3
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            [" ACT VNAV DESCENT[blue]", "3/3[blue]"],
            [" TGT SPEED[blue]", "TRANS FL [blue]"],
            [".74/290", "FL180"],
            [" SPD/ALT LIMIT[blue]"],
            ["250/10000"],
            ["", "", "VPA [blue]"],
            ["---/-----", "3.0\xB0"],
            [""],
            [""],
            [""],
            [""],
            ["-----------------------[blue]"],
            ["<DESC INFO", "PERF INIT>"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage4(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
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
        fmc._templateRenderer.setTemplateRaw([
            ["", "", "FLIGHT LOG[blue]"],
            [" T/O[s-text blue]", "LDG [s-text blue]", "EN ROUTE[s-text blue]"],
            [toTime, ldgTime, enrouteTime],
            [" FUEL USED[blue]", "AVG TAS/GS [blue]"],
            [fuelUsed, avgTas + "/" + avgGs],
            [" AIR DIST[blue]", "GND DIST [blue]"],
            [airDis, gndDis],
            ["     NM[s-text]", "NM[s-text]"],
            [""],
            [""],
            [""],
            ["-------------------------[blue]"],
            ["", "PERF MENU>"]
        ]);
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_PerfInitPage.js.map