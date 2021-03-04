// prototype singleton, this needs to be different ofc
let NavRadioPage1Instance = undefined;
let AtcControlPageInstance = undefined;
let NavRadioPageDispatchInstance = undefined;

//NAV RADIO MAIN PAGE

class CJ4_FMC_NavRadioPageOne {
    constructor(fmc) {
        this._fmc = fmc;
        this._isDirty = true;
		
        this._transponderMode = 1;
        const modeValue = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
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

    get transponderMode() {
        return this._transponderMode;
    }
    set transponderMode(value) {
        if (value == 2) {
            value = 0;
        }
        this._transponderMode = value;

        // set simvar
        let modeValue = 1;
        if (value == 0) {
            modeValue = 4;
        }

        SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", modeValue);

        this.invalidate();
    }

    prepare() {
        // NOOP
    }

    update() {
        // console.log("navradio.update()");
      
		    this.updateDispatch();
      
        this._freqProxy.vhf1 = this._fmc.radioNav.getVHFActiveFrequency(this._fmc.instrumentIndex, 1);
        this._freqProxy.vhf2 = this._fmc.radioNav.getVHFActiveFrequency(this._fmc.instrumentIndex, 2);
        this._freqProxy.rcl1 = this._fmc.radioNav.getVHFStandbyFrequency(this._fmc.instrumentIndex, 1);
        this._freqProxy.pre2 = this._fmc.radioNav.getVHFStandbyFrequency(this._fmc.instrumentIndex, 2);

        this._freqProxy.vor1 = this._fmc._navRadioSystem.radioStates[1].frequency;
        this._freqProxy.vor2 = this._fmc._navRadioSystem.radioStates[2].frequency;

        this._freqProxy.vor1Mode = this._fmc._navRadioSystem.radioStates[1].mode;
        this._freqProxy.vor2Mode = this._fmc._navRadioSystem.radioStates[2].mode;

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
  
  //Attempt at page update on LVAR state change
  
    updateDispatch() {
        const AvionicsComp = SimVar.GetSimVarValue("L:XMLVAR_AVIONICS_IsComposite", "number");
        if (AvionicsComp == 1) {
        CJ4_FMC_NavRadioDispatch.Dispatch(this._fmc);
        }
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
            [" NAV1", "NAV2 "],
            [`${this._freqMap.vor1.toFixed(2)}[green] ${this._freqMap.vor1Mode}[blue s-text]`, `${this._freqMap.vor2Mode}[blue s-text] ${this._freqMap.vor2.toFixed(2)}[green]`],
            [" DME1", "DME2 "],
            ["HOLD[s-text]", "HOLD[s-text]"],
            [" ATC1", "TCAS MODE "],
            [this._freqMap.atc1.toFixed(0).padStart(4, "0") + "[green]", tcasModeSwitch],
            [" ADF", "REL  [blue]"],
            [this._freqMap.adf1.toFixed(1).padStart(6) + "[green]", "TCAS>[disabled]"],
        ]);
    }

    enterVhfFreq(value, index, isStandby = false) {
        const numValue = CJ4_FMC_NavRadioPage.parseRadioInput(value);
        this._fmc.clearUserInput();
        if (isFinite(numValue) && numValue >= 118 && numValue <= 136.9 && RadioNav.isHz833Compliant(numValue)) {
            this._fmc.radioNav.setVHFStandbyFrequency(this._fmc.instrumentIndex, index, numValue).then(() => {
                if (!isStandby) {
                    this._fmc.radioNav.swapVHFFrequencies(this._fmc.instrumentIndex, index);
                }
                this._fmc.requestCall(() => {
                    this.update();
                });
            });
        } else if (value.length === 0) {
            this._fmc.radioNav.swapVHFFrequencies(this._fmc.instrumentIndex, index);
            this._fmc.requestCall(() => {
                this.update();
            });
        } else {
            this._fmc.showErrorMessage(this._fmc.defaultInputErrorMessage);
        }
    }

    enterVorFreq(value, index) {
        const numValue = this._fmc._navRadioSystem.parseFrequencyInput(value);
        this._fmc.clearUserInput();
        if (isFinite(numValue) && numValue >= 108 && numValue <= 117.95 && RadioNav.isHz50Compliant(numValue)) {
            this._fmc._navRadioSystem.radioStates[index].setManualFrequency(numValue);
            this._fmc.requestCall(() => {
                this.update();
            });
        } else {
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
            if (this._fmc.inOut === undefined || this._fmc.inOut === '') {
                this._fmc._navigationService.showPage(CJ4_FMC_NavControlPage, 1);
            } else {
                this.enterVorFreq(this._fmc.inOut, 1);
            }
        };

        this._fmc.onRightInput[2] = () => {
            if (this._fmc.inOut === undefined || this._fmc.inOut === '') {
                this._fmc._navigationService.showPage(CJ4_FMC_NavControlPage, 2);
            } else {
                this.enterVorFreq(this._fmc.inOut, 2);
            }
        };
		
        this._fmc.onLeftInput[5] = () => {
            const value = this._fmc.inOut;
            const numValue = parseFloat(value);
            this._fmc.clearUserInput();
            if (isFinite(numValue) && numValue >= 100 && numValue <= 1799) {
                this._fmc.radioNav.setADFActiveFrequency(1, numValue).then(() => {
                    this._fmc.requestCall(() => {
                        this.update();
                    });
                });
            } else {
                this._fmc.showErrorMessage(this._fmc.defaultInputErrorMessage);
            }
        };

        this._fmc.onLeftInput[4] = () => {
            const value = this._fmc.inOut;
            const numValue = parseFloat(value);
            if (this._fmc.inOut === undefined || this._fmc.inOut === '') {
				CJ4_FMC_NavRadioPage.ShowPage4(this._fmc);
            } else {
				this._fmc.clearUserInput();
				if (isFinite(numValue) && RadioNav.isXPDRCompliant(numValue)) {
                this._fmc.atc1Frequency;
                SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", Avionics.Utils.make_xpndr_bcd16(numValue)).then(() => {
                    this._fmc.requestCall(() => {
                        this.update();
					       });
        });
				} else {
                this._fmc.showErrorMessage(this._fmc.defaultInputErrorMessage);
				        }	
			  }
        };

        this._fmc.onRightInput[4] = () => {
            this.transponderMode = this.transponderMode + 1;
        };		

        this._fmc.onRightInput[5] = () => {
            CJ4_FMC_NavRadioPage.ShowPage3(this._fmc);
		    };	

        this._fmc.onPrevPage = () => {
            CJ4_FMC_NavRadioPage.ShowPage2(this._fmc);
        };
        this._fmc.onNextPage = () => {
            CJ4_FMC_NavRadioPage.ShowPage2(this._fmc);
        };
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

//NAV Radio Sub Pages

class CJ4_FMC_NavRadioPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();

        // create page instance and init
        NavRadioPage1Instance = new CJ4_FMC_NavRadioPageOne(fmc);
        NavRadioPage1Instance.update();

    }

    static ShowPage2(fmc) {
        fmc.clearDisplay();
		
		const flightId = SimVar.GetSimVarValue("ATC ID", "string");

        fmc._templateRenderer.setTemplateRaw([
            ["", "2/2[blue]", "TUNE[blue]"],
            ["","FLIGHT ID"],
            ["",flightId + "[green]"],
            ["LEFT ONLY[disabled]"],
            ["<SELCAL[disabled]"],							   																					 
            [""],
            [""],
            [" HF1[disabled]"],
            ["10.0000[d-text disabled]   UV[s-text disabled]"],
			      [""],
            ["↑"],
			      ["HF1 SQ[disabled]3[d-text disabled]"],
            ["↓"],
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
            ["MODE[disabled]", "ALT TAG[disabled]"],
            ["TA/RA/STBY[disabled]", "REL/ABS[disabled]"],
            [""],
            ["","TEST[disabled]"],
            ["◊TRAFFIC[disabled]", "EXT TEST[disabled]"],
            ["ON/OFF[disabled]", "ON/OFF[disabled]"],
            ["", "ALT LIMITS[disabled]"],
            ["", "ABOVE[disabled]"],
            [""],
            ["", "NORM[disabled]"],
            [""],
            ["", "BELOW[disabled]"]
        ]);
        fmc.updateSideButtonActiveStatus();
		}
		
	static ShowPage4(fmc) {
		fmc.clearDisplay();
		
		AtcControlPageInstance = new CJ4_FMC_AtcControlPage(fmc);
		AtcControlPageInstance.update();
		
		
		fmc.registerPeriodicPageRefresh(() => {
            AtcControlPageInstance.update();
            return true;
        }, 1000, true);
    }	


    /**
     * Parses a radio input string and returns a float number.
     * @param {String} input The radio string input.
     * @returns {Number} The parsed float number.
     */
    static parseRadioInput(input) {
        const normalizeInput = (channel) => {
            let normalized = channel > 100 ? channel : channel + 100;
            const normalizedAsString = normalized.toFixed(3);

            const channelEnd = normalizedAsString.substring(5);
            if (channelEnd === "20" || channelEnd === "70") {
                normalized += .005;
            }

            return normalized;
        };

        if (input.indexOf('.') !== -1) {
            return normalizeInput(parseFloat(input));
        } else {
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

//ATC Control Page
	
class CJ4_FMC_AtcControlPage {
	constructor(fmc) {
		this._fmc = fmc;
		this._isDirty = true;
		this._pressalt = 0;
		fmc.clearDisplay();
		
        this._transponderMode = 1;
        const modeValue = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        if (modeValue == 4) {
            this._transponderMode = 0;
        }
	
		this._freqMap = {

		atc1: "[]",

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
		
    get transponderMode() {
        return this._transponderMode;
    }
    set transponderMode(value) {
        if (value == 2) {
            value = 0;
        }
        this._transponderMode = value;

        let modeValue = 1;
        if (value == 0) {
            modeValue = 4;
        }

        SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", modeValue);

        this.invalidate();
    }

	update() {

		this._freqProxy.atc1 = SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number").toFixed(0).padStart(4, "0");
		
		let pressalt = SimVar.GetSimVarValue("PRESSURE ALTITUDE", "feet");

		if (pressalt !== this._pressalt) {
		this._isDirty = true;
        this._pressalt = " " + pressalt.toFixed(0);
		}	
		
		if (this._isDirty) {
        this.invalidate();
		
		}
		
		this._fmc.registerPeriodicPageRefresh(() => {
		this.update();
		return true;
			}, 2000, false);
	}

	
	render() {

		const ModeSwitch = this._fmc._templateRenderer.renderSwitch(["ON", "STBY"], this.transponderMode, "blue");
		
        this._fmc._templateRenderer.setTemplateRaw([
            ["", "", "ATC CONTROL[blue]"],
            ["ATC1","ALT REPORT "],
			      [this._freqMap.atc1 + "[green]","ON[blue]/OFF[s-text disabled]"],
            ["",""," ALT[white]" + this._pressalt + "FT[green]"],
			      ["IDENT[s-text disabled]","TEST[s-text disabled]","ADC2     [blue s-text]"],
            [""],
            [""],
            [" SELECT"],
            ["ATC1[blue]/[white]ATC2[s-text disabled]"],
		        ["MODE"],
            [ModeSwitch],
			      [""],
            [""],
            [""]
        ]);
	}	
	
			// this._fmc.onLeftInput[1] = () => {
			// Ident here eventually......
			// };
			
	bindEvents() {
	
        this._fmc.onLeftInput[0] = () => {
            const value = this._fmc.inOut;
            const numValue = parseFloat(value);
            if (this._fmc.inOut === undefined || this._fmc.inOut === '') {
				CJ4_FMC_NavRadioPage.ShowPage1(this._fmc);
            } else {
				this._fmc.clearUserInput();
				if (isFinite(numValue) && RadioNav.isXPDRCompliant(numValue)) {
                this._fmc.atc1Frequency;
                SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", Avionics.Utils.make_xpndr_bcd16(numValue)).then(() => {
                    this._fmc.requestCall(() => {
                        this.update();
					});
                });
				} else {
                this._fmc.showErrorMessage(this._fmc.defaultInputErrorMessage);
				}	
			}
        };

		this._fmc.onLeftInput[4] = () => {
		this.transponderMode = this.transponderMode + 1;
		this._fmc.requestCall(() => {
           this.update();
			});
		};	

		this._fmc.updateSideButtonActiveStatus();
	}

		invalidate() {
        this._isDirty = true;
        this._fmc.clearDisplay();
		this.render();
		this.bindEvents();
        this._isDirty = false;
	}
}

// DISPATCH MODE

class CJ4_FMC_NavRadioDispatch {
	static Dispatch(fmc) {
        fmc.clearDisplay();

        // create page instance and init
        NavRadioPageDispatchInstance = new CJ4_FMC_NavRadioDispatch(fmc);
        NavRadioPageDispatchInstance.update();

    }
	
    static ShowPage2(fmc) {
        fmc.clearDisplay();
		
		const flightId = SimVar.GetSimVarValue("ATC ID", "string");

        fmc._templateRenderer.setTemplateRaw([
            ["", "2/2[blue]", "TUNE[blue]"],
            ["","FLIGHT ID"],
            ["",flightId + "[green]"],
            ["LEFT ONLY[disabled]"],
            ["<SELCAL[disabled]"],							   																					 
            [""],
            [""],
            [" HF1[disabled]"],
            ["10.0000[d-text disabled]   UV[s-text disabled]"],
			      [""],
            ["↑"],
			      ["HF1 SQ[disabled]3[d-text disabled]"],
            ["↓"],
            [""]
        ]);
        fmc.onPrevPage = () => {
            CJ4_FMC_NavRadioDispatch.Dispatch(fmc);
        };
        fmc.onNextPage = () => {
            CJ4_FMC_NavRadioDispatch.Dispatch(fmc);
        };
        fmc.updateSideButtonActiveStatus();
	}
		
	
    constructor(fmc) {
        this._fmc = fmc;
        this._isDirty = true;
		
        this._transponderMode = 1;
        const modeValue = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        if (modeValue == 4) {
            this._transponderMode = 0;
        }

        this._freqMap = {
            vhf1: "[]",
            rcl1: "[]",
            vor1: "[]",
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
	
    get transponderMode() {
        return this._transponderMode;
    }
	
    set transponderMode(value) {
        if (value == 2) {
            value = 0;
        }
        this._transponderMode = value;

        // set simvar
        let modeValue = 1;
        if (value == 0) {
            modeValue = 4;
        }

        SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", modeValue);

        this.invalidate();
	}
	
    update() {
        // console.log("navradio.update()");
				this.updateDispatch();
      
        this._freqProxy.vhf1 = this._fmc.radioNav.getVHFActiveFrequency(this._fmc.instrumentIndex, 1);
        this._freqProxy.rcl1 = this._fmc.radioNav.getVHFStandbyFrequency(this._fmc.instrumentIndex, 1);

        this._freqProxy.vor1 = this._fmc._navRadioSystem.radioStates[1].frequency;

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

 //UPDATE PAGE STATE? 
    updateDispatch() {
        const AvionicsComp = SimVar.GetSimVarValue("L:XMLVAR_AVIONICS_IsComposite", "number");
        if (AvionicsComp == 0) {
        CJ4_FMC_NavRadioPage.ShowPage1(this._fmc);
        }
    }
  
    render() {
        // console.log("Render Nav");
				
        const tcasModeSwitch = this._fmc._templateRenderer.renderSwitch(["TA/RA", "STBY"], this.transponderMode, "blue");

        this._fmc._templateRenderer.setTemplateRaw([
            ["", "1/2[blue]", "TUNE[blue]"],
            [" COM1"],
            [this._freqMap.vhf1.toFixed(3) + "[green]", "CROSS-SIDE[yellow]"],
            [" RECALL"],
            [this._freqMap.rcl1.toFixed(3), "TUNING[yellow]"],
            [" NAV1"],
            [`${this._freqMap.vor1.toFixed(2)}[yellow]`, "INOPERATIVE[yellow]"],
            [" DME1"],
            ["HOLD[s-text]"],
            [" ATC1", "TCAS MODE "],
            [this._freqMap.atc1.toFixed(0).padStart(4, "0") + "[green]", tcasModeSwitch],
            [" ADF", "REL  [blue]"],
            [this._freqMap.adf1.toFixed(1).padStart(6) + "[green]", "TCAS>[disabled]"],
        ]);
    }

    enterVhfFreq(value, index, isStandby = false) {
        const numValue = CJ4_FMC_NavRadioPage.parseRadioInput(value);
        this._fmc.clearUserInput();
        if (isFinite(numValue) && numValue >= 118 && numValue <= 136.9 && RadioNav.isHz833Compliant(numValue)) {
            this._fmc.radioNav.setVHFStandbyFrequency(this._fmc.instrumentIndex, index, numValue).then(() => {
                if (!isStandby) {
                    this._fmc.radioNav.swapVHFFrequencies(this._fmc.instrumentIndex, index);
                }
                this._fmc.requestCall(() => {
                    this.update();
                });
            });
        } else if (value.length === 0) {
            this._fmc.radioNav.swapVHFFrequencies(this._fmc.instrumentIndex, index);
            this._fmc.requestCall(() => {
                this.update();
            });
        } else {
            this._fmc.showErrorMessage(this._fmc.defaultInputErrorMessage);
        }
    }

    enterVorFreq(value, index) {
        const numValue = this._fmc._navRadioSystem.parseFrequencyInput(value);
        this._fmc.clearUserInput();
        if (isFinite(numValue) && numValue >= 108 && numValue <= 117.95 && RadioNav.isHz50Compliant(numValue)) {
            this._fmc._navRadioSystem.radioStates[index].setManualFrequency(numValue);
            this._fmc.requestCall(() => {
                this.update();
            });
        } else {
            this._fmc.showErrorMessage(this._fmc.defaultInputErrorMessage);
        }
    }

    bindEvents() {
        this._fmc.onLeftInput[0] = () => {
            this.enterVhfFreq(this._fmc.inOut, 1);
        };

        this._fmc.onLeftInput[1] = () => {
            this.enterVhfFreq(this._fmc.inOut, 1, true);
        };


        this._fmc.onLeftInput[2] = () => {
            if (this._fmc.inOut === undefined || this._fmc.inOut === '') {
                this.enterVorFreq(this._fmc.inOut, 1);
            } else {
                this.enterVorFreq(this._fmc.inOut, 1);		
            }
        };
		
        this._fmc.onLeftInput[5] = () => {
            const value = this._fmc.inOut;
            const numValue = parseFloat(value);
            this._fmc.clearUserInput();
            if (isFinite(numValue) && numValue >= 100 && numValue <= 1799) {
                this._fmc.radioNav.setADFActiveFrequency(1, numValue).then(() => {
                    this._fmc.requestCall(() => {
                        this.update();
                    });
                });
            } else {
                this._fmc.showErrorMessage(this._fmc.defaultInputErrorMessage);
            }
        };

        this._fmc.onLeftInput[4] = () => {
            const value = this._fmc.inOut;
            const numValue = parseFloat(value);
			this._fmc.clearUserInput();
			if (isFinite(numValue) && RadioNav.isXPDRCompliant(numValue)) {
                this._fmc.atc1Frequency;
                SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", Avionics.Utils.make_xpndr_bcd16(numValue)).then(() => {
                    this._fmc.requestCall(() => {
                        this.update();
					});
                });
			} else {
                this._fmc.showErrorMessage(this._fmc.defaultInputErrorMessage);
			}		
		};

        this._fmc.onRightInput[4] = () => {
            this.transponderMode = this.transponderMode + 1;
        };		

 //       this._fmc.onRightInput[5] = () => {
 //           CJ4_FMC_NavRadioPage.ShowPage3(this._fmc);
 //       };
        this._fmc.onPrevPage = () => {
            CJ4_FMC_NavRadioDispatch.ShowPage2(this._fmc);
        };
        this._fmc.onNextPage = () => {
            CJ4_FMC_NavRadioDispatch.ShowPage2(this._fmc);
        };
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
