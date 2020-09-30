class CJ4_FMC_FuelMgmtPage {
    static ShowPage1(fmc) { //FUEL MGMT Page 1
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

            fmc._templateRenderer.setTemplateRaw([
                ["", "1/3[blue] ", "FUEL MGMT[blue]"],
                [" FUEL[blue]", "TIME TO RESV[blue] "],
                [" " + fuelQuantityTotal.toFixed(0).padStart(4, " ") + "[d-text] LB[s-text]", hours + ":" + minutes],
                [" FUEL FLOW[blue]", "RNG TO RESV[blue] "],
                [" " + totalFuelFlow.toFixed(0).padStart(4, " ") + "[d-text] LB/HR[s-text]", rngToResv + "[d-text]NM[s-text]"],
                [" RESERVES[blue]", "SP RNG[blue] "],
                [" " + fmc.reserveFuel.toString().padStart(4, " ") + " LB", spRng + "[d-text]NM/LB[s-text]"],
                [" GND SPD[blue]"],
                [Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots")).toString()],
                [""],
                ["measured/" + "MANUAL[green s-text]"],
                ["------------------------[blue]"],
                ["", "PERF MENU>"]
            ]);
        }, 1000, true);

        fmc.onLeftInput[2] = () => {
            fmc.reserveFuel = fmc.inOut;
            fmc.clearUserInput();
            console.log(fmc.reserve);
            { CJ4_FMC_FuelMgmtPage.ShowPage1(fmc); };
        };
        fmc.onPrevPage = () => { CJ4_FMC_FuelMgmtPage.ShowPage3(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_FuelMgmtPage.ShowPage2(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) { //FUEL MGMT Page 2
        fmc.clearDisplay();
        fmc.registerPeriodicPageRefresh(() => {

            let fuelQuantityLeft = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "Gallons"));
            let fuelQuantityRight = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "Gallons"));

            let totalFuelFlow = Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour"))
                + Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour"));

            let fuelBurnedLeft = fmc.initialFuelLeft - fuelQuantityLeft;
            let fuelBurnedRight = fmc.initialFuelRight - fuelQuantityRight;
            let fuelBurnedTotal = fuelBurnedRight + fuelBurnedLeft;

            let fuelBurnedLeftDisplay = fuelBurnedLeft < 0 ? "0"
                : fuelBurnedLeft;
            let fuelBurnedRightDisplay = fuelBurnedRight < 0 ? "0"
                : fuelBurnedRight;
            let fuelBurnedTotalDisplay = fuelBurnedTotal < 0 ? "0"
                : fuelBurnedTotal;

            fmc.onLeftInput[4] = () => {
                fmc.initialFuelLeft = fuelQuantityLeft;
                fmc.initialFuelRight = fuelQuantityRight;
            };

            fmc._templateRenderer.setTemplateRaw([
                ["", "2/3[blue] ", "FUEL MGMT[blue]"],
                [" ENGINE[blue s-text]", "FLOW-FUEL-USED[blue s-text] ", ""],
                ["", "LB  [s-text]", "LB/HR[s-text]"],
                ["   1[d-text]", fuelBurnedLeftDisplay.toString().padStart(4, " ") + " [d-text]", Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour")).toString().padStart(4, " ") + "[d-text]"],
                ["   2[d-text]", fuelBurnedRightDisplay.toString().padStart(4, " ") + " [d-text]", Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour")).toString().padStart(4, " ") + "[d-text]"],
                [" TOTAL[d-text]", fuelBurnedTotalDisplay.toString().padStart(4, " ") + " [d-text]", totalFuelFlow.toString().padStart(4, " ") + "[d-text]"],
                [""],
                [""],
                [""],
                [""],
                ["<RESET FUEL USED"],
                ["------------------------[blue]"],
                ["", "PERF MENU>"]
            ]);
        }, 1000, true);
        fmc.onPrevPage = () => { CJ4_FMC_FuelMgmtPage.ShowPage1(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_FuelMgmtPage.ShowPage3(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage3(fmc) { //FUEL MGMT Page 3
        fmc.clearDisplay();
        let totalFuelFlow = Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour"))
            + Math.round(SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour"));
        fmc._templateRenderer.setTemplateRaw([
            ["", "3/3[blue]", "PERF TRIP[blue]"],
            [" FROM[blue s-text]"],
            ["-----", "PPOS>"],
            [" TO[blue s-text]"],
            ["-----"],
            [" DIST[blue s-text]"],
            ["----[d-text] NM[s-text]"],
            [" GND SPD[blue s-text]", "FUEL FLOW[blue s-text] "],
            [Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots")).toString() + "[d-text] KTS[s-text]", totalFuelFlow + "[d-text] LB/HR[s-text]"],
            [" ETE[blue s-text]", "FUEL REQ[blue s-text] "],
            ["", "---[d-text] LB[s-text]"],
            ["------------------------[blue]"],
            ["<CLEAR", "PERF MENU>"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_FuelMgmtPage.ShowPage2(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_FuelMgmtPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}