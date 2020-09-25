class CJ4_FMC_NavRadioPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        let vhf1FrequencyCell = "[]";
        if (fmc.vhf1Frequency > 0) {
            vhf1FrequencyCell = fmc.vhf1Frequency.toFixed(3);
        }
        fmc.onLeftInput[0] = () => {
            let value = fmc.inOut;
            let numValue = CJ4_FMC_NavRadioPage.parseRadioInput(value);
            console.log(numValue);
            fmc.clearUserInput();
            if (isFinite(numValue) && numValue >= 118 && numValue <= 136.9 && RadioNav.isHz833Compliant(numValue)) {
                fmc.vhf1Frequency = numValue;
                fmc.radioNav.setVHFStandbyFrequency(fmc.instrumentIndex, 1, numValue).then(() => {
                    fmc.radioNav.swapVHFFrequencies(fmc.instrumentIndex, 1);
                    fmc.requestCall(() => {
                        CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                    });
                });
            }
            else if (value === FMCMainDisplay.clrValue) {
                fmc.vhf1Frequency = 0;
                CJ4_FMC_NavRadioPage.ShowPage1(fmc);
            }
            else if (value.length === 0) {

                let current = fmc.vhf1Frequency;
                let recall = fmc.rcl1Frequency;

                fmc.vhf1Frequency = recall;
                fmc.rcl1Frequency = current;

                fmc.radioNav.swapVHFFrequencies(fmc.instrumentIndex, 1);
                fmc.requestCall(() => {
                    CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                });
            }
            else {
                fmc.showErrorMessage(fmc.defaultInputErrorMessage);
            }
        };
        let vhf2FrequencyCell = "[]";
        if (fmc.vhf2Frequency > 0) {
            vhf2FrequencyCell = fmc.vhf2Frequency.toFixed(3);
        }
        fmc.onRightInput[0] = () => {
            let value = fmc.inOut;
            let numValue = CJ4_FMC_NavRadioPage.parseRadioInput(value);
            fmc.clearUserInput();
            if (isFinite(numValue) && numValue >= 118 && numValue <= 136.9 && RadioNav.isHz833Compliant(numValue)) {
                fmc.vhf2Frequency = numValue;
                fmc.radioNav.setVHFStandbyFrequency(fmc.instrumentIndex, 2, numValue).then(() => {
                    fmc.radioNav.swapVHFFrequencies(fmc.instrumentIndex, 2);
                    fmc.requestCall(() => {
                        CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                    });
                });
            }
            else if (value === FMCMainDisplay.clrValue) {
                fmc.vhf2Frequency = 0;
                CJ4_FMC_NavRadioPage.ShowPage1(fmc);
            }
            else if (value.length === 0) {
                let current = fmc.vhf2Frequency;
                let recall = fmc.pre2Frequency;

                fmc.vhf2Frequency = recall;
                fmc.pre2Frequency = current;

                fmc.radioNav.swapVHFFrequencies(fmc.instrumentIndex, 2);
                fmc.requestCall(() => {
                    CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                });
            }
            else {
                fmc.showErrorMessage(fmc.defaultInputErrorMessage);
            }
        };
        let rcl1FrequencyCell = "121.900";
        if (fmc.rcl1Frequency > 0) {
            rcl1FrequencyCell = fmc.rcl1Frequency.toFixed(3);
        }
        fmc.onLeftInput[1] = () => {
            let value = fmc.inOut;
            let numValue = CJ4_FMC_NavRadioPage.parseRadioInput(value);
            fmc.clearUserInput();
            if (isFinite(numValue) && numValue >= 118 && numValue <= 136.9 && RadioNav.isHz833Compliant(numValue)) {
                fmc.rcl1Frequency = numValue;
                fmc.radioNav.setVHFStandbyFrequency(fmc.instrumentIndex, 1, numValue).then(() => {
                    fmc.requestCall(() => {
                        CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                    });
                });
            }
            else if (value === FMCMainDisplay.clrValue) {
                fmc.rcl1Frequency = 0;
                CJ4_FMC_NavRadioPage.ShowPage1(fmc);
            }
            else {
                fmc.showErrorMessage(fmc.defaultInputErrorMessage);
            }
        };
        let pre2FrequencyCell = "121.500";
        if (fmc.pre2Frequency > 0) {
            pre2FrequencyCell = fmc.pre2Frequency.toFixed(3);
        }
        fmc.onRightInput[1] = () => {
            let value = fmc.inOut;
            let numValue = CJ4_FMC_NavRadioPage.parseRadioInput(value);
            fmc.clearUserInput();
            if (isFinite(numValue) && numValue >= 118 && numValue <= 136.9 && RadioNav.isHz833Compliant(numValue)) {
                fmc.pre2Frequency = numValue;
                fmc.radioNav.setVHFStandbyFrequency(fmc.instrumentIndex, 2, numValue).then(() => {
                    fmc.requestCall(() => {
                        CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                    });
                });
            }
            else if (value === FMCMainDisplay.clrValue) {
                fmc.pre2Frequency = 0;
                CJ4_FMC_NavRadioPage.ShowPage1(fmc);
            }
            else {
                fmc.showErrorMessage(fmc.defaultInputErrorMessage);
            }
        };
        let vor1FrequencyCell = "110.40";
        if (fmc.vor1Frequency > 0) {
            vor1FrequencyCell = fmc.vor1Frequency.toFixed(2);
        }
        fmc.onLeftInput[2] = () => {
            let value = fmc.inOut;
            let numValue = CJ4_FMC_NavRadioPage.parseRadioInput(value);
            fmc.clearUserInput();
            if (isFinite(numValue) && numValue >= 108 && numValue <= 117.95 && RadioNav.isHz50Compliant(numValue)) {
                fmc.vor1Frequency = numValue;
                if (fmc.isRadioNavActive()) {
                    fmc.requestCall(() => {
                        CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                    });
                }
                else {
                    fmc.radioNav.setVORStandbyFrequency(1, numValue).then(() => {
                        fmc.radioNav.swapVORFrequencies(1);
                        fmc.requestCall(() => {
                            CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                        });
                    });
                }
            }
            else if (value === FMCMainDisplay.clrValue) {
                fmc.vor1Frequency = 0;
                CJ4_FMC_NavRadioPage.ShowPage1(fmc);
            }
            else {
                fmc.showErrorMessage(fmc.defaultInputErrorMessage);
            }
        };
        let vor2FrequencyCell = "111.10";
        if (fmc.vor2Frequency > 0) {
            vor2FrequencyCell = fmc.vor2Frequency.toFixed(2);
        }
        fmc.onRightInput[2] = () => {
            let value = fmc.inOut;
            let numValue = CJ4_FMC_NavRadioPage.parseRadioInput(value);
            fmc.clearUserInput();
            if (isFinite(numValue) && numValue >= 108 && numValue <= 117.95 && RadioNav.isHz50Compliant(numValue)) {
                fmc.vor2Frequency = numValue;
                if (fmc.isRadioNavActive()) {
                    fmc.requestCall(() => {
                        CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                    });
                }
                else {
                    fmc.radioNav.setVORStandbyFrequency(2, numValue).then(() => {
                        fmc.radioNav.swapVORFrequencies(2);
                        fmc.requestCall(() => {
                            CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                        });
                    });
                }
            }
            else if (value === FMCMainDisplay.clrValue) {
                fmc.vor2Frequency = 0;
                CJ4_FMC_NavRadioPage.ShowPage1(fmc);
            }
            else {
                fmc.showErrorMessage(fmc.defaultInputErrorMessage);
            }
        };
        let adfFrequencyCell = "[]";
        if (fmc.adf1Frequency > 0) {
            adfFrequencyCell = fmc.adf1Frequency.toFixed(0);
        }
        fmc.onLeftInput[5] = () => {
            let value = fmc.inOut;
            let numValue = parseFloat(value);
            fmc.clearUserInput();
            if (isFinite(numValue) && numValue >= 100 && numValue <= 1799) {
                fmc.adf1Frequency = numValue;
                if (fmc.isRadioNavActive()) {
                    fmc.requestCall(() => {
                        CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                    });
                }
                else {
                    fmc.radioNav.setADFActiveFrequency(1, numValue).then(() => {
                        fmc.requestCall(() => {
                            CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                        });
                    });
                }
            }
            else if (value === FMCMainDisplay.clrValue) {
                fmc.adf1Frequency = 0;
                CJ4_FMC_NavRadioPage.ShowPage1(fmc);
            }
            else {
                fmc.showErrorMessage(fmc.defaultInputErrorMessage);
            }
        };
        let atc1FrequencyCell = "[]";
        if (fmc.atc1Frequency > 0) {
            atc1FrequencyCell = fmc.atc1Frequency.toFixed(0).padStart(4, "0");
        }
        fmc.onLeftInput[4] = () => {
            let value = fmc.inOut;
            let numValue = parseFloat(value);
            fmc.clearUserInput();
            if (isFinite(numValue) && RadioNav.isXPDRCompliant(numValue)) {
                fmc.atc1Frequency = numValue;
                if (fmc.isRadioNavActive()) {
                    fmc.requestCall(() => {
                        CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                    });
                }
                else {
                    SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", Avionics.Utils.make_xpndr_bcd16(numValue)).then(() => {
                        fmc.requestCall(() => {
                            CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                        });
                    });
                }
            }
            else if (value === FMCMainDisplay.clrValue) {
                fmc.atc1Frequency = 0;
                CJ4_FMC_NavRadioPage.ShowPage1(fmc);
            }
            else {
                fmc.showErrorMessage(fmc.defaultInputErrorMessage);
            }
        };

        const tcasModeSwitch = fmc._templateRenderer.renderSwitch(["TA/RA", "STBY"], 0, "blue");

        fmc._templateRenderer.setTemplateRaw([
            ["", "1/2[blue]", "TUNE[blue]"],
            [" COM1", "COM2 "],
            [vhf1FrequencyCell + "[green]", vhf2FrequencyCell + "[green]"],
            [" RECALL", "RECALL "],
            [rcl1FrequencyCell + "", pre2FrequencyCell + ""],
            [" NAV 1", "NAV 2 "],
            [vor1FrequencyCell + "[green]", vor2FrequencyCell + "[green]"],
            [" DME1", "DME2 "],
            ["HOLD[s-text]", "HOLD[s-text]"],
            [" ATC1", "TCAS MODE "],
            [atc1FrequencyCell + "[green]", tcasModeSwitch],
            [" ADF", "REL [blue]"],
            [adfFrequencyCell + "[green]", "TCAS>"],
        ]);
        fmc.onRightInput[5] = () => { CJ4_FMC_NavRadioPage.ShowPage3(fmc); };
        fmc.onPrevPage = () => { CJ4_FMC_NavRadioPage.ShowPage2(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_NavRadioPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) {
        fmc.clearDisplay();
        let adf1FrequencyCell = "[]";
        if (fmc.adf1Frequency > 0) {
            adf1FrequencyCell = fmc.adf1Frequency.toFixed(0);
        }
        fmc.onLeftInput[2] = () => {
            let value = fmc.inOut;
            let numValue = parseFloat(value);
            fmc.clearUserInput();
            if (isFinite(numValue) && numValue >= 100 && numValue <= 1799) {
                fmc.adf1Frequency = numValue;
                if (fmc.isRadioNavActive()) {
                    fmc.requestCall(() => {
                        CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                    });
                }
                else {
                    fmc.radioNav.setADFActiveFrequency(1, numValue).then(() => {
                        fmc.requestCall(() => {
                            CJ4_FMC_NavRadioPage.ShowPage2(fmc);
                        });
                    });
                }
            }
            else if (value === FMCMainDisplay.clrValue) {
                fmc.adf1Frequency = 0;
                CJ4_FMC_NavRadioPage.ShowPage2(fmc);
            }
            else {
                fmc.showErrorMessage(fmc.defaultInputErrorMessage);
            }
        };
        let adf2FrequencyCell = "[]";
        if (fmc.adf2Frequency > 0) {
            adf2FrequencyCell = fmc.adf2Frequency.toFixed(0);
        }
        fmc.onRightInput[2] = () => {
            let value = fmc.inOut;
            let numValue = parseFloat(value);
            fmc.clearUserInput();
            if (isFinite(numValue) && numValue >= 100 && numValue <= 1799) {
                fmc.adf2Frequency = numValue;
                if (fmc.isRadioNavActive()) {
                    fmc.requestCall(() => {
                        CJ4_FMC_NavRadioPage.ShowPage1(fmc);
                    });
                }
                else {
                    fmc.radioNav.setADFActiveFrequency(2, numValue).then(() => {
                        fmc.requestCall(() => {
                            CJ4_FMC_NavRadioPage.ShowPage2(fmc);
                        });
                    });
                }
            }
            else if (value === FMCMainDisplay.clrValue) {
                fmc.adf2Frequency = 0;
                CJ4_FMC_NavRadioPage.ShowPage2(fmc);
            }
            else {
                fmc.showErrorMessage(fmc.defaultInputErrorMessage);
            }
        };
        fmc.setTemplate([
            ["TUNE", "2", "2"],
            ["", "FLIGHT ID"],
            ["", "N5DX29"],
            [""],
            [""],
            ["ADF 1", "ADF 2"],
            [adf1FrequencyCell + "[color]green", adf2FrequencyCell + "[color]green"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ]);
        fmc.onPrevPage = () => {
            CJ4_FMC_NavRadioPage.ShowPage1(fmc);
        };
        fmc.onNextPage = () => {
            CJ4_FMC_NavRadioPage.ShowPage1(fmc);
        };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage3(fmc) {
        fmc.clearDisplay();
        fmc.setTemplate([
            ["TCAS CONTROL[color]blue"],
            ["MODE", "ALT TAG"],
            ["TA/RA/STBY", "REL/ABS"],
            [""],
            ["", "TEST44"],
            ["&#x25C7TRAFFIC", "EXT TEST"],
            ["ON/OFF", "ON/OFF"],
            ["", "ALT LIMITS"],
            ["", "ABOVE"],
            [""],
            ["", "NORM"],
            [""],
            ["", "BELOW"]
        ]);
        fmc.updateSideButtonActiveStatus();
    }

    /**
     * Parses a radio input string and returns a float number.
     * @param {String} input The radio string input.
     * @returns {Number} The parsed float number.
     */
    static parseRadioInput(input) {
        const normalizeToHundreds = (freq) => freq > 100 ? freq : freq + 100;

        if (input.indexOf('.') !== -1) {
            return normalizeToHundreds(parseFloat(input));
        }
        else {
            switch (input.length) {
                case 3:
                    return normalizeToHundreds(parseFloat(input) / 10);
                case 4:
                case 5:
                    return normalizeToHundreds(parseFloat(input) / 100);
                case 6:
                    return normalizeToHundreds(parseFloat(input) / 1000);
            }
        }

        return -1;
    }
}
//# sourceMappingURL=CJ4_FMC_NavRadioPage.js.map