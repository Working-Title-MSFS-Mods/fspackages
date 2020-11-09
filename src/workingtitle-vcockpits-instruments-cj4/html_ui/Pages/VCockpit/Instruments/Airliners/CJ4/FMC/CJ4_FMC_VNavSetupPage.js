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
            ["---/-----", vpa + "\xB0"],
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
            let value = parseFloat(fmc.inOut).toPrecision(2);
            if (value > 0 && value <= 6) {
                vpa = value;
                WTDataStore.set('CJ4_vpa', vpa);
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
        };

        fmc.onRightInput[3] = () => {
            CJ4_FMC_PerfInitPage.ShowPage7(fmc);
        };

        fmc.onLeftInput[3] = () => {
            CJ4_FMC_PerfInitPage.ShowPage6(fmc);
        };

        fmc.updateSideButtonActiveStatus();
    }

}