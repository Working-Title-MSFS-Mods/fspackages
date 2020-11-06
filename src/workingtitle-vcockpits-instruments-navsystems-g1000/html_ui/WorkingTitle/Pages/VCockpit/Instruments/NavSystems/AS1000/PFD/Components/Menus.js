class WT_PFD_Main_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {AS1000_PFD} pfd 
     * @param {WT_PFD_Mini_Page_Controller} miniPageController 
     * @param {HSIIndicatorModel} hsiModel 
     */
    constructor(pfd, miniPageController, hsiModel) {
        super(false);
        this.addSoftKey(1, new WT_Soft_Key("TEST", () => {
            OpenBrowser("https://www.fimfiction.net");
            Coherent.trigger("AP_ALT_VAL_SET", 4200);
            Coherent.trigger("AP_VS_VAL_SET", 300);
            Coherent.trigger("AP_HDG_VAL_SET", 180);
            //SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "feet", -500);
            //Coherent.call("AP_ALT_VAR_SET_ENGLISH", 0, -1000, false);
        }));
        this.addSoftKey(2, new WT_Soft_Key("INSET", () => pfd.showInsetMapMenu()));
        this.addSoftKey(4, new WT_Soft_Key("PFD", () => pfd.showPfdMenu()));
        this.addSoftKey(5, new WT_Soft_Key("OBS"));
        this.addSoftKey(6, new WT_Soft_Key("CDI", () => hsiModel.cycleCdi()));
        this.addSoftKey(7, new WT_Soft_Key("DME", () => miniPageController.showAdfDme()));
        this.addSoftKey(8, new WT_Soft_Key("XPDR", () => pfd.showTransponderMenu()));
        this.addSoftKey(9, new WT_Soft_Key("IDENT"));
        this.addSoftKey(10, new WT_Soft_Key("TMR/REF", () => miniPageController.showTimerReferences()));
        this.addSoftKey(11, new WT_Soft_Key("NRST", () => miniPageController.showNearest()));
        this.addSoftKey(12, pfd.alertsKey);
    }
}

class WT_PFD_Inset_Map_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {AS1000_PFD} pfd 
     * @param {WT_PFD_Inset_Map} map
     * @param {WT_PFD_Alert_Key} alertsKey
     */
    constructor(pfd, map, alertsKey) {
        super(false);

        this.map = map;
        this.addSoftKey(1, new WT_Soft_Key("OFF", () => {
            map.disable();
            pfd.showMainMenu();
        }));

        this.addSoftKey(11, new WT_Soft_Key("BACK", pfd.showMainMenu.bind(pfd)));
        this.addSoftKey(12, alertsKey);
    }
    activate() {
        this.map.enable();
    }
}

class WT_PFD_PFD_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {AS1000_PFD} pfd 
     * @param {HSIIndicatorModel} hsiModel
     * @param {WT_Barometric_Pressure} barometricPressure
     */
    constructor(pfd, hsiModel, barometricPressure) {
        super(false);
        this.addSoftKey(1, new WT_Soft_Key("SYN VIS", pfd.showSyntheticVisionMenu.bind(pfd)));
        this.addSoftKey(2, new WT_Soft_Key("DFLTS"));
        this.addSoftKey(3, new WT_Soft_Key("WIND", () => pfd.showWindMenu()));
        this.addSoftKey(4, new WT_Soft_Key("DME", hsiModel.toggleDme.bind(hsiModel)));
        this.addSoftKey(5, new WT_Soft_Key("BRG1", hsiModel.cycleBearing.bind(hsiModel, 1)));
        this.addSoftKey(6, new WT_Soft_Key("HSI FRMT"));
        this.addSoftKey(7, new WT_Soft_Key("BRG2", hsiModel.cycleBearing.bind(hsiModel, 2)));
        this.addSoftKey(9, new WT_Soft_Key("ALT UNIT", pfd.showAltUnitMenu.bind(pfd)));
        this.addSoftKey(10, new WT_Soft_Key("STD BARO", () => barometricPressure.setStandard()));
        this.addSoftKey(11, new WT_Soft_Key("BACK", pfd.showMainMenu.bind(pfd)));
        this.addSoftKey(12, pfd.alertsKey);
    }
}

class WT_PFD_Wind_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {AS1000_PFD} pfd 
     * @param {WT_PFD_Wind_Model} wind
     * @param {WT_PFD_Alert_Key} alertsKey
     */
    constructor(pfd, wind, alertsKey) {
        super(false);
        this.mode1 = new WT_Soft_Key("OPTN 1", () => wind.setMode(1));
        this.mode2 = new WT_Soft_Key("OPTN 2", () => wind.setMode(2));
        this.mode3 = new WT_Soft_Key("OPTN 3", () => wind.setMode(3));
        this.off = new WT_Soft_Key("OFF", () => wind.setMode(0));
        wind.mode.subscribe(mode => {
            this.mode1.selected = mode == 1;
            this.mode2.selected = mode == 2;
            this.mode3.selected = mode == 3;
            this.off.selected = mode == 0;
        });
        this.addSoftKey(3, this.mode1);
        this.addSoftKey(4, this.mode2);
        this.addSoftKey(5, this.mode3);
        this.addSoftKey(6, this.off);
        this.addSoftKey(11, new WT_Soft_Key("BACK", () => pfd.showPfdMenu()));
        this.addSoftKey(12, alertsKey);
    }
}

class WT_PFD_Synthetic_Vision_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {AS1000_PFD} pfd 
     * @param {WT_Synthetic_Vision} syntheticVision
     * @param {WT_PFD_Alert_Key} alertsKey
     */
    constructor(pfd, syntheticVision, alertsKey) {
        super(false);
        this.syntheticVision = syntheticVision;
        this.pathway = new WT_Soft_Key("PATHWAY");
        this.synVis = new WT_Soft_Key("SYN TERR", () => syntheticVision.toggle());
        this.horizonHeading = new WT_Soft_Key("HRZN HDG");
        this.airportSigns = new WT_Soft_Key("APTSIGNS", () => syntheticVision.toggleAirportSigns());
        this.addSoftKey(1, this.pathway);
        this.addSoftKey(2, this.synVis);
        this.addSoftKey(3, this.horizonHeading);
        this.addSoftKey(4, this.airportSigns);
        this.addSoftKey(11, new WT_Soft_Key("BACK", pfd.showPfdMenu.bind(pfd)));
        this.addSoftKey(12, alertsKey);

        this.subscriptions = new Subscriptions();
    }
    activate() {
        this.subscriptions.add(this.syntheticVision.enabled.subscribe(enabled => {
            this.synVis.selected = enabled;
            this.pathway.disabled = !enabled;
            this.horizonHeading.disabled = !enabled;
            this.airportSigns.disabled = !enabled;
        }));
        this.subscriptions.add(this.syntheticVision.airportSigns.subscribe(enabled => {
            this.airportSigns.selected = enabled;
        }));
    }
    deactivate() {
        this.subscriptions.unsubscribe();
    }
}

class WT_PFD_Alt_Unit_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {AS1000_PFD} pfd 
     * @param {WT_Barometric_Pressure} barometricPressure
     */
    constructor(pfd, barometricPressure) {
        super(false);
        this.barometricPressure = barometricPressure;
        this.addSoftKey(6, new WT_Soft_Key("METERS"));
        this.in = this.addSoftKey(8, new WT_Soft_Key("IN", () => barometricPressure.setInMG()));
        this.hpa = this.addSoftKey(9, new WT_Soft_Key("HPA", () => barometricPressure.setHpa()));
        this.addSoftKey(11, new WT_Soft_Key("BACK", pfd.showPfdMenu.bind(pfd)));
        this.addSoftKey(12, pfd.alertsKey);
    }
    activate() {
        this.altUnitUnsubscribe = this.barometricPressure.altUnit.subscribe(unit => {
            this.in.selected = unit == WT_Barometric_Pressure.IN_MG;
            this.hpa.selected = unit == WT_Barometric_Pressure.HPA;
        });
    }
    deactivate() {
        if (this.altUnitUnsubscribe)
            this.altUnitUnsubscribe = this.altUnitUnsubscribe();
    }
}

class WT_PFD_Transponder_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {AS1000_PFD} pfd 
     */
    constructor(pfd, transponderModel) {
        super(false);
        this.transponderModel = transponderModel;
        this.stby = new WT_Soft_Key("STBY", () => transponderModel.setMode(1));
        this.on = new WT_Soft_Key("ON", () => transponderModel.setMode(3));
        this.alt = new WT_Soft_Key("ALT", () => transponderModel.setMode(4));
        this.gnd = new WT_Soft_Key("GND", () => transponderModel.setMode(2));
        this.addSoftKey(3, this.stby);
        this.addSoftKey(4, this.on);
        this.addSoftKey(5, this.alt);
        this.addSoftKey(6, this.gnd);
        this.addSoftKey(7, new WT_Soft_Key("VFR", transponderModel.setVfrSquawk.bind(transponderModel)));
        this.addSoftKey(8, new WT_Soft_Key("CODE", pfd.showTransponderCodeMenu.bind(pfd)));
        this.addSoftKey(9, new WT_Soft_Key("IDENT"));
        this.addSoftKey(11, new WT_Soft_Key("BACK", pfd.showMainMenu.bind(pfd)));
        this.addSoftKey(12, pfd.alertsKey);

    }
    activate() {
        this.modeSubscription = this.transponderModel.mode.subscribe(mode => {
            this.stby.selected = mode == "STBY";
            this.on.selected = mode == "ON";
            this.alt.selected = mode == "ALT";
            this.gnd.selected = mode == "GND";
        });
    }
    deactivate() {
        if (this.modeSubscription)
            this.modeSubscription = this.modeSubscription();
    }
}

class WT_PFD_Transponder_Code_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {AS1000_PFD} pfd 
     */
    constructor(pfd, transponderModel) {
        super(false);
        this.pfd = pfd;
        this.transponderModel = transponderModel;
        this.transponderTempCode = "";
        for (let i = 0; i <= 7; i++) {
            this.addSoftKey(i + 1, new WT_Soft_Key(i, this.addNumber.bind(this, i.toFixed(0))));
        }
        this.addSoftKey(9, new WT_Soft_Key("IDENT"));
        this.addSoftKey(10, new WT_Soft_Key("BKSP", this.backspace.bind(this)));
        this.addSoftKey(11, new WT_Soft_Key("BACK", pfd.showMainMenu.bind(pfd)));
        this.addSoftKey(12, pfd.alertsKey);
    }
    backspace() {
        if (this.transponderTempCode.length > 0) {
            this.transponderTempCode = this.transponderTempCode.slice(0, this.transponderTempCode.length - 1);
            this.transponderModel.setEditCode(this.transponderTempCode);
        }
    }
    addNumber(number) {
        this.transponderTempCode += number;
        this.transponderModel.setEditCode(this.transponderTempCode);
        if (this.transponderTempCode.length == 4) {
            this.transponderModel.setSquawk(this.transponderTempCode);
            this.pfd.showMainMenu();
        }
    };
    deactivate() {
        this.transponderTempCode = "";
        this.transponderModel.setEditCode(null);
    }
}