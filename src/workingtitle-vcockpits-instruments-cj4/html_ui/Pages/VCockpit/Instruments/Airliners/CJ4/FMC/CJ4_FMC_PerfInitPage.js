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
		let zFW = 0;
		let paxNumber = fmc.cj4Units == 1 ? "/77[d-text]KG[s-text]" : "/170[d-text]LB[s-text]";
		let bow = 10280;
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
        
		if (fmc.zFWActive == 1) {
			zFW = fmc.zFWPilotInput;
			bow = "-----";
			fmc.paxNumber = "--";
			paxNumber = "--";
			fmc.cargoWeight = "----";
		} else {
			zFW = 10280 + (fmc.paxNumber * 170) + fmc.cargoWeight;
		}
        fmc.grossWeight = zFW + fuelQuantityTotal;
        
        const zfwText = zFW > 12500 ? Math.trunc(zFW * fmc.cj4Weight) + "[yellow]" : Math.trunc(zFW * fmc.cj4Weight);
        const unitText = fmc.cj4Units == 1 ? "KG[s-text]" : "LB[s-text]";
        const cargoWeightText = Math.trunc(fmc.cargoWeight * fmc.cj4Weight);
        const fuelText = Math.trunc(fuelQuantityTotal * fmc.cj4Weight);
        const grossWeightText = Math.trunc(fmc.grossWeight * fmc.cj4Weight);
        const bowText = Math.trunc(bow * fmc.cj4Weight);

        fmc._templateRenderer.setTemplateRaw([
            [" ACT PERF INIT[blue]","",""],
            [" BOW[blue]", "CRZ ALT[blue] "],
            [bowText + "[d-text]" + unitText, "FL" + crzAltCell],
            [" PASS/WT[blue]"],
            [" " + fmc.paxNumber + paxNumber],
            [" CARGO[blue]", "= ZFW[blue] "],
            [" " + cargoWeightText + "[d-text] " + unitText, zfwText + " " + unitText],
            [" SENSED FUEL[blue]", "= GWT[blue] "],
            [" " + fuelText + "[d-text] " + unitText, grossWeightText + " " + unitText],
            ["------------------------[blue]"],
            ["", "TAKEOFF>"],
            ["", ""],
            ["", "VNAV SETUP>"]
        ]);
        fmc.onLeftInput[1] = () => {
            fmc.paxNumber = parseInt(fmc.inOut);
            fmc.clearUserInput();
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
        };
        fmc.onLeftInput[2] = () => {
            fmc.cargoWeight = parseInt(fmc.inOut) / fmc.cj4Weight; //ParseInt changes from string to number
            fmc.clearUserInput();
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
        };
		fmc.onRightInput[2] = () => {
			if (fmc.inOut == FMCMainDisplay.clrValue){
				fmc.zFWActive = 0;
				fmc.paxNumber = 0;
				fmc.cargoWeight = 0;
			} else {
            zFW = parseInt(fmc.inOut) / fmc.cj4Weight;
			fmc.zFWPilotInput = zFW;
			fmc.zFWActive = 1;
			}
			fmc.clearUserInput();
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
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

        let fuelUsed = "---";
        let avgTas = "---";
        let avgGs = "---";
        let airDis = "---";
        let gndDis = "---";

        // Set takeoff time
        let toTime = "---";
        const takeOffTime = SimVar.GetSimVarValue("L:TAKEOFF_TIME", "seconds");
        if(takeOffTime && takeOffTime > 0){
            const hours = Math.floor(takeOffTime / 60 / 60);
            const hoursString = hours > 9 ? "" + hours : "0" + hours;

            const minutes = Math.floor(takeOffTime / 60) - (hours * 60);
            const minutesString = minutes > 9 ? "" + minutes : "0" + minutes;
            toTime = hoursString + ":" + minutesString;
        }

        // Set landing time
        let ldgTime = "---";
        const landingTime = SimVar.GetSimVarValue("L:LANDING_TIME", "seconds");
        if(landingTime && landingTime > 0){
            const hours = Math.floor(landingTime / 60 / 60);
            const hoursString = hours > 9 ? "" + hours : "0" + hours;

            const minutes = Math.floor(landingTime / 60) - (hours * 60);
            const minutesString = minutes > 9 ? "" + minutes : "0" + minutes;
            ldgTime = hoursString + ":" + minutesString;
        }

        // Set enroute time
        let eteTime = "---";
        const enrouteTime = SimVar.GetSimVarValue("L:ENROUTE_TIME", "seconds");
        if(enrouteTime && enrouteTime > 0){
            const hours = Math.floor(enrouteTime / 60 / 60);
            const hoursString = hours > 9 ? "" + hours : "0" + hours;

            const minutes = Math.floor(enrouteTime / 60) - (hours * 60);
            const minutesString = minutes > 9 ? "" + minutes : "0" + minutes;
            eteTime = hoursString + ":" + minutesString;
        }

        // Calculate fuel used
        const fuelWeight = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "pounds");

        let fuelQuantityLeft = Math.trunc(fuelWeight * SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "Gallons"));
        let fuelQuantityRight = Math.trunc(fuelWeight * SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "Gallons"));
        let fuelBurnedLeft = fmc.initialFuelLeft - fuelQuantityLeft;
        let fuelBurnedRight = fmc.initialFuelRight - fuelQuantityRight;
        let fuelBurnedTotal = fuelBurnedRight + fuelBurnedLeft;

        const fuelBurnedDisplay = fmc.cj4Units == 1 ? Math.trunc(fuelBurnedTotal * fmc.cj4Weight) + "KG"
            : Math.trunc(fuelBurnedTotal) + "LB";

        fmc._templateRenderer.setTemplateRaw([
            ["", "", "FLIGHT LOG[blue]"],
            [" T/O[s-text blue]", "LDG [s-text blue]", "EN ROUTE[s-text blue]"],
            [toTime, ldgTime, eteTime],
            [" FUEL USED[blue]", "AVG TAS/GS [blue]"],
            [fuelBurnedDisplay, avgTas + "/" + avgGs],
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