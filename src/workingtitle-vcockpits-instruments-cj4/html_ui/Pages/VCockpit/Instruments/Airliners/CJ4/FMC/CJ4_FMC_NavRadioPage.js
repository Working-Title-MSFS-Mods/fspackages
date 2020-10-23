// prototype singleton, this needs to be different ofc
let NavRadioPage1Instance = undefined;

class CJ4_FMC_NavRadioPageOne {
    constructor(fmc) {
        this._fmc = fmc;
        this._isDirty = true;

        this._transponderMode = 1;
        let modeValue = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "Enum");
        if (modeValue == 4) {
            this._transponderMode = 0;
        }

        this._freqMap = {
            vhf1: "[]",
            vhf2: "[]",
            rcl1: "[]",
            pre2: "[]",
            vor1: "[]",
            vor2: "[]",
            atc1: "[]",
            adf1: "[]",
        };

        this._freqProxy = new Proxy(this._freqMap, {
            set: function (target, key, value) {
                if (target[key] !== value) {
                    this._isDirty = true;
                    target[key] = value;
                    // console.log("FREQ CHANGED! " + key + " = " + value);
                }
                return true;
            }.bind(this)
        });
    }

    get transponderMode() { return this._transponderMode; }
    set transponderMode(value) {
        if (value == 2) value = 0;
        this._transponderMode = value;

        // set simvar
        let modeValue = 1;
        if (value == 0) modeValue = 4;

        SimVar.SetSimVarValue("TRANSPONDER STATE:1", "Enum", modeValue);

        this.invalidate();
    }

    prepare() {
        // NOOP
    }

    update() {
        // console.log("navradio.update()");

        this._freqProxy.vhf1 = this._fmc.radioNav.getVHFActiveFrequency(this._fmc.instrumentIndex, 1);
        this._freqProxy.vhf2 = this._fmc.radioNav.getVHFActiveFrequency(this._fmc.instrumentIndex, 2);
        this._freqProxy.rcl1 = this._fmc.radioNav.getVHFStandbyFrequency(this._fmc.instrumentIndex, 1);
        this._freqProxy.pre2 = this._fmc.radioNav.getVHFStandbyFrequency(this._fmc.instrumentIndex, 2);

        this._freqProxy.vor1 = this._fmc.radioNav.getVORActiveFrequency(1);
        this._freqProxy.vor2 = this._fmc.radioNav.getVORActiveFrequency(2);

        this._freqProxy.atc1 = SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number");
        this._freqProxy.adf1 = this._fmc.radioNav.getADFActiveFrequency(1);

        if (this._isDirty) {
            this.invalidate();
        }
        // register refresh and bind to update which will only render on changes
        this._fmc.registerPeriodicPageRefresh(() => {
            this.update();
            return true;
        }, 1000, false);
    }

    render() {
        // console.log("Render Nav");
        const tcasModeSwitch = this._fmc._templateRenderer.renderSwitch(["TA/RA", "STBY"], this.transponderMode, "blue");

        this._fmc._templateRenderer.setTemplateRaw([
            ["", "1/2[blue]", "TUNE[blue]"],
            [" COM1", "COM2 "],
            [this._freqMap.vhf1.toFixed(3) + "[green]", this._freqMap.vhf2.toFixed(3) + "[green]"],
            [" RECALL", "RECALL "],
            [this._freqMap.rcl1.toFixed(3) + "", this._freqMap.pre2.toFixed(3) + ""],
            [" NAV 1", "NAV 2 "],
            [(this._freqMap.vor1 == 0 ? "__LSB__RSB" : this._freqMap.vor1.toFixed(2)) + "[green]", (this._freqMap.vor2 == 0 ? "__LSB__RSB" : this._freqMap.vor2.toFixed(2)) + "[green]"],
            [" DME1", "DME2 "],
            ["HOLD[s-text]", "HOLD[s-text]"],
            [" ATC1", "TCAS MODE "],
            [this._freqMap.atc1.toFixed(0).padStart(4, "0") + "[green]", tcasModeSwitch],
            [" ADF", "REL [blue]"],
            [this._freqMap.adf1.toFixed(0) + "[green]", "TCAS>"],
        ]);
    }

    enterVhfFreq(value, index, isStandby = false) {
        let numValue = CJ4_FMC_NavRadioPage.parseRadioInput(value);
        this._fmc.clearUserInput();
        if (isFinite(numValue) && numValue >= 118 && numValue <= 136.9 && RadioNav.isHz833Compliant(numValue)) {
            this._fmc.radioNav.setVHFStandbyFrequency(this._fmc.instrumentIndex, index, numValue).then(() => {
                if (!isStandby)
                    this._fmc.radioNav.swapVHFFrequencies(this._fmc.instrumentIndex, index);
                this._fmc.requestCall(() => {
                    this.update();
                });
            });
        }
        else if (value.length === 0) {
            this._fmc.radioNav.swapVHFFrequencies(this._fmc.instrumentIndex, index);
            this._fmc.requestCall(() => {
                this.update();
            });
        }
        else {
            this._fmc.showErrorMessage(this._fmc.defaultInputErrorMessage);
        }
    }

    enterVorFreq(value, index) {
        let numValue = CJ4_FMC_NavRadioPage.parseRadioInput(value);
        this._fmc.clearUserInput();
        if (isFinite(numValue) && numValue >= 108 && numValue <= 117.95 && RadioNav.isHz50Compliant(numValue)) {
            this._fmc.radioNav.setVORStandbyFrequency(index, numValue).then(() => {
                this._fmc.radioNav.swapVORFrequencies(index);
                this._fmc.requestCall(() => {
                    this.update();
                });
            });
        }
        else {
            this._fmc.showErrorMessage(this._fmc.defaultInputErrorMessage);
        }
    }

    bindEvents() {
        this._fmc.onLeftInput[0] = () => {
            this.enterVhfFreq(this._fmc.inOut, 1);
        };

        this._fmc.onRightInput[0] = () => {
            this.enterVhfFreq(this._fmc.inOut, 2);
        };

        this._fmc.onLeftInput[1] = () => {
            this.enterVhfFreq(this._fmc.inOut, 1, true);
        };

        this._fmc.onRightInput[1] = () => {
            this.enterVhfFreq(this._fmc.inOut, 2, true);
        };

        this._fmc.onLeftInput[2] = () => {
            this.enterVorFreq(this._fmc.inOut, 1);
        };

        this._fmc.onRightInput[2] = () => {
            this.enterVorFreq(this._fmc.inOut, 2);
        };

        this._fmc.onLeftInput[5] = () => {
            let value = this._fmc.inOut;
            let numValue = parseFloat(value);
            this._fmc.clearUserInput();
            if (isFinite(numValue) && numValue >= 100 && numValue <= 1799) {
                this._fmc.radioNav.setADFActiveFrequency(1, numValue).then(() => {
                    this._fmc.requestCall(() => {
                        this.update();
                    });
                });
            }
            else {
                this._fmc.showErrorMessage(this._fmc.defaultInputErrorMessage);
            }
        };

        this._fmc.onLeftInput[4] = () => {
            let value = this._fmc.inOut;
            let numValue = parseFloat(value);
            this._fmc.clearUserInput();
            if (isFinite(numValue) && RadioNav.isXPDRCompliant(numValue)) {
                this._fmc.atc1Frequency = numValue;
                SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", Avionics.Utils.make_xpndr_bcd16(numValue)).then(() => {
                    this._fmc.requestCall(() => {
                        this.update();
                    });
                });
            }
            else {
                this._fmc.showErrorMessage(this._fmc.defaultInputErrorMessage);
            }
        };

        this._fmc.onRightInput[4] = () => { this.transponderMode = this.transponderMode + 1; };

        this._fmc.onRightInput[5] = () => { CJ4_FMC_NavRadioPage.ShowPage3(this._fmc); };
        this._fmc.onPrevPage = () => { CJ4_FMC_NavRadioPage.ShowPage2(this._fmc); };
        this._fmc.onNextPage = () => { CJ4_FMC_NavRadioPage.ShowPage2(this._fmc); };
        this._fmc.updateSideButtonActiveStatus();
    }

    invalidate() {
        this._isDirty = true;
        this._fmc.clearDisplay();
        this.render();
        this.bindEvents(); // TODO could only call this once on init, but fmc.clearDisplay() clears events
        this._isDirty = false;
    }
}

class CJ4_FMC_NavRadioPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();

        // create page instance and init 
        NavRadioPage1Instance = new CJ4_FMC_NavRadioPageOne(fmc);
        NavRadioPage1Instance.update();
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
                fmc.radioNav.setADFActiveFrequency(1, numValue).then(() => {
                    fmc.requestCall(() => {
                        CJ4_FMC_NavRadioPage.ShowPage2(fmc);
                    });
                });
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
                fmc.radioNav.setADFActiveFrequency(2, numValue).then(() => {
                    fmc.requestCall(() => {
                        CJ4_FMC_NavRadioPage.ShowPage2(fmc);
                    });
                });
            }
            else {
                fmc.showErrorMessage(fmc.defaultInputErrorMessage);
            }
        };
        fmc._templateRenderer.setTemplateRaw([
            ["", "2/2[blue]", "TUNE[blue]"],
            ["", "FLIGHT ID"],
            ["", "N5DX29"],
            [""],
            [""],
            ["ADF 1", "ADF 2"],
            [adf1FrequencyCell + "[green]", adf2FrequencyCell + "[green]"],
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

        fmc._templateRenderer.setTemplateRaw([
            ["", "", "TCAS CONTROL[blue]"],
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
        const normalizeInput = (channel) => {
            let normalized = channel > 100 ? channel : channel + 100;
            let normalizedAsString = normalized.toFixed(3);

            let channelEnd = normalizedAsString.substring(5);
            if (channelEnd === "20" || channelEnd === "70") {
                normalized += .005;
            }

            return normalized;
        };

        if (input.indexOf('.') !== -1) {
            return normalizeInput(parseFloat(input));
        }
        else {
            switch (input.length) {
                case 3:
                    return normalizeInput(parseFloat(input) / 10);
                case 4:
                case 5:
                    return normalizeInput(parseFloat(input) / 100);
                case 6:
                    return normalizeInput(parseFloat(input) / 1000);
            }
        }

        return -1;
    }
}
//# sourceMappingURL=CJ4_FMC_NavRadioPage.js.map
