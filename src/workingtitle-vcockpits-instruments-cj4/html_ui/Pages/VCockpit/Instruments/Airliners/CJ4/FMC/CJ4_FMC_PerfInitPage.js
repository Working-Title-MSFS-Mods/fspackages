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
        fmc.onLeftInput[1] = () => { CJ4_FMC_VNavSetupPage.ShowPage1(fmc); };
        fmc.onLeftInput[2] = () => { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); };
        fmc.onRightInput[0] = () => { CJ4_FMC_FuelMgmtPage.ShowPage1(fmc); };
        fmc.onRightInput[1] = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.onRightInput[2] = () => { CJ4_FMC_ApproachRefPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) { //PERF INIT
        fmc.clearDisplay();
		
        let crzAltCell = "□□□□□";
		let zFW = 0;
		const paxLabel = WT_ConvertUnit.isMetric() ? "/77[d-text]KG[s-text]" : "/170[d-text]LB[s-text]";
		let bow = 10280;
        if (fmc.cruiseFlightLevel) {
            crzAltCell = fmc.cruiseFlightLevel;
        }

        let fuelQuantityLeft = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "Gallons"));
        let fuelQuantityRight = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "Gallons"));
        let fuelQuantityTotal = fuelQuantityRight + fuelQuantityLeft;
        
		if (fmc.zFWActive == 1) {
			zFW = fmc.zFWPilotInput;
			bow = "-----";
			fmc.paxNumber = "--";
			fmc.cargoWeight = "----";
		} else {
			zFW = 10280 + (fmc.paxNumber * 170) + fmc.cargoWeight;
		}
        fmc.grossWeight = zFW + fuelQuantityTotal;
        
        const unitText = WT_ConvertUnit.getWeight(1).Unit + "[s-text]";
        const zwfValueUnit = WT_ConvertUnit.getWeight(zFW);
        const zfwText = zwfValueUnit.Value.toFixed(0) + " " + zwfValueUnit.Unit + (zFW > 12500 ? "[s-text yellow]" : "[s-text]");
        const cargoValueUnit = WT_ConvertUnit.getWeight(fmc.cargoWeight);
        const cargoWeightText = fmc.zFWActive == 1 ? "----" : cargoValueUnit.Value.toFixed(0).padStart(4, " ") + "[d-text] " + unitText;
        const fuelText = WT_ConvertUnit.getWeight(fuelQuantityTotal).Value.toFixed(0) + "[d-text] " + unitText + "[s-text]";
        const gwtValueUnit = WT_ConvertUnit.getWeight(fmc.grossWeight);
        const grossWeightText = gwtValueUnit.Value.toFixed(0) + " " + gwtValueUnit.Unit + "[s-text]";
        const bowText = fmc.zFWActive == 1 ? " -----": " " + WT_ConvertUnit.getWeight(bow).Value.toFixed(0) + "[d-text]" + unitText + "[s-text]";
        const paxText = fmc.zFWActive == 1 ? "--/--" : fmc.paxNumber + paxLabel;

        fmc._templateRenderer.setTemplateRaw([
            [" ACT PERF INIT[blue]","",""],
            [" BOW[blue]", "CRZ ALT[blue] "],
            [bowText, "FL" + crzAltCell],
            [" PASS/WT[blue]"],
            [" " + paxText],
            [" CARGO[blue]", "= ZFW[blue] "],
            [" " + cargoWeightText, zfwText],
            [" SENSED FUEL[blue]", "= GWT[blue] "],
            [" " + fuelText, grossWeightText],
            ["------------------------[blue]"],
            ["", "TAKEOFF>"],
            ["", ""],
            ["", "VNAV SETUP>"]
        ]);
        fmc.onRightInput[0] = () => {
            let value = fmc.inOut;
            if (fmc.setCruiseFlightLevelAndTemperature(value)) {
                CJ4_FMC_PerfInitPage.ShowPage2(fmc);
            }
            fmc.clearUserInput();
        };
        fmc.onLeftInput[1] = () => {
            let value = parseInt(fmc.inOut);
            if (value >= 0) {
                fmc.paxNumber = value;
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
        };
        fmc.onLeftInput[2] = () => {
            let value = WT_ConvertUnit.setWeight(parseInt(fmc.inOut)); //ParseInt changes from string to number
            if (value >= 0) {
                fmc.cargoWeight = value; 
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
        };
		fmc.onRightInput[2] = () => {
            let value = WT_ConvertUnit.setWeight(parseInt(fmc.inOut));
			if (fmc.inOut == FMCMainDisplay.clrValue){
				fmc.zFWActive = 0;
				fmc.paxNumber = 0;
				fmc.cargoWeight = 0;
            }
            else if (value >= 10280 && value <= 12600) {
                zFW = value;
                fmc.zFWPilotInput = zFW;
                fmc.zFWActive = 1;
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
			fmc.clearUserInput();
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
        };
        fmc.onRightInput[4] = () => { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_VNavSetupPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage3(fmc) { //FLIGHT LOG
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
        
        let fuelQuantityLeft = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "Gallons"));
        let fuelQuantityRight = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "Gallons"));
        let fuelBurnedLeft = fmc.initialFuelLeft - fuelQuantityLeft;
        let fuelBurnedRight = fmc.initialFuelRight - fuelQuantityRight;
        let fuelBurnedTotal = fuelBurnedRight + fuelBurnedLeft;
        const fuelBurnedDisplay = WT_ConvertUnit.getWeight(fuelBurnedTotal).getString(0, "");

        fmc._templateRenderer.setTemplateRaw([
            ["", "", "FLIGHT LOG[blue]"],
            [" T/O[s-text blue]", "LDG [s-text blue]", "EN ROUTE[s-text blue]"],
            [toTime, ldgTime, eteTime],
            [" FUEL USED[blue]", "AVG TAS/GS [blue]"],
            [fuelBurnedDisplay, avgTas + "/" + avgGs],
            [" AIR DIST[blue]", "GND DIST [blue]"],
            [airDis + "    NM[s-text]", gndDis + "NM[s-text]"],
            [""],
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