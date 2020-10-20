class AS3000_TSC_Vertical extends AS3000_TSC {
    constructor() {
        super(...arguments);
        this.middleKnobText_Save = "";
    }

    createSpeedBugsPage() {
        return new AS3000_TSC_Vertical_SpeedBugs();
    }

    get templateID() { return "AS3000_TSC_Vertical"; }

    connectedCallback() {
        super.connectedCallback();
        this.topKnobText = this.getChildById("SoftKey_1");
        this.middleKnobText = this.getChildById("SoftKey_2");
        this.bottomKnobText = this.getChildById("SoftKey_3");
        this.addIndependentElementContainer(new NavSystemElementContainer("NavCom", "NavComLeft", new AS3000_TSC_Vertical_NavComHome()));
        this.getElementOfType(AS3000_TSC_ActiveFPL).setArrowSizes(18, 20, 10, 4, 8);
    }

    setMiddleKnobText(_text, _fromPopUp = false) {
        if (!_fromPopUp) {
            this.middleKnobText_Save = _text;
        }
        if (this.middleKnobText.innerHTML != _text) {
            this.middleKnobText.innerHTML = _text;
        }
    }

    rollBackKnobTexts() {
        super.rollBackKnobTexts();
        this.middleKnobText.innerHTML = this.middleKnobText_Save;
    }

    parseXMLConfig() {
        super.parseXMLConfig();
        if (this.instrumentXmlConfig) {
            let pageGroup = this.instrumentXmlConfig.getElementsByTagName("PageGroup");
            if (pageGroup.length > 0) {
                this.SwitchToMenuName(pageGroup[0].textContent);
            }
        }
    }
}
class AS3000_TSC_Vertical_NavComHome extends AS3000_TSC_NavComHome {
    setSelectedCom(_id) {
        if (this.inputIndex != -1) {
            this.comFreqValidate();
        }
        this.selectedCom = _id;
        this.setSoftkeysNames();
        if (_id == 1) {
            this.gps.frequencyKeyboard.getElementOfType(AS3000_TSC_FrequencyKeyboard).setContext("COM1 Standby", 118, 136.99, "COM ACTIVE FREQUENCY:1", "COM STANDBY FREQUENCY:1", this.setCom1Freq.bind(this), this.container, "COM SPACING MODE:1");
        }
        else {
            this.gps.frequencyKeyboard.getElementOfType(AS3000_TSC_FrequencyKeyboard).setContext("COM2 Standby", 118, 136.99, "COM ACTIVE FREQUENCY:2", "COM STANDBY FREQUENCY:2", this.setCom2Freq.bind(this), this.container, "COM SPACING MODE:2");
        }
        this.gps.switchToPopUpPage(this.gps.frequencyKeyboard);
    }
    setCom1Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:COM_STBY_RADIO_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:COM_STBY_RADIO_SWAP", "Bool", 1);
        }
    }
    setCom2Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:COM2_STBY_RADIO_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:COM2_RADIO_SWAP", "Bool", 1);
        }
    }
}

class AS3000_TSC_Vertical_AirspeedReference extends AS3000_TSC_AirspeedReference {
    constructor(_valueButton, _statusElem, _refSpeed, _displayName, _tab) {
        super(_valueButton, _statusElem, _refSpeed, _displayName);
        this.tab = _tab;
    }
}

class AS3000_TSC_Vertical_SpeedBugs extends AS3000_TSC_SpeedBugs {
    constructor() {
        super(...arguments);
        this.tabbedContent = new AS3000_TSC_TabbedContent(this);
    }

    initAirspeedReference(_valueButton, _statusButton, _refSpeed, _name, _tab) {
        if (_valueButton && _statusButton) {
            this.references.push(new AS3000_TSC_Vertical_AirspeedReference(_valueButton, _statusButton, _refSpeed == null ? -1 : _refSpeed, _name, _tab));
        }
    }

    init(root) {
        let designSpeeds = Simplane.getDesignSpeeds();
        this.initAirspeedReference(this.gps.getChildById("SB_V1Value"), this.gps.getChildById("SB_V1Status"), designSpeeds.V1, "1", AS3000_TSC_Vertical_SpeedBugs.Tab.TAKEOFF);
        this.initAirspeedReference(this.gps.getChildById("SB_VrValue"), this.gps.getChildById("SB_VrStatus"), designSpeeds.Vr, "R", AS3000_TSC_Vertical_SpeedBugs.Tab.TAKEOFF);
        this.initAirspeedReference(this.gps.getChildById("SB_V2Value"), this.gps.getChildById("SB_V2Status"), designSpeeds.V2, "2", AS3000_TSC_Vertical_SpeedBugs.Tab.TAKEOFF);
        this.initAirspeedReference(this.gps.getChildById("SB_VenrValue"), this.gps.getChildById("SB_VenrStatus"), designSpeeds.Venr, "ENR", AS3000_TSC_Vertical_SpeedBugs.Tab.TAKEOFF);
        this.initAirspeedReference(this.gps.getChildById("SB_VrefValue"), this.gps.getChildById("SB_VrefStatus"), designSpeeds.Vapp, "RF", AS3000_TSC_Vertical_SpeedBugs.Tab.LANDING);
        this.initAirspeedReference(this.gps.getChildById("SB_VappValue"), this.gps.getChildById("SB_VappStatus"), designSpeeds.Vapp, "AP", AS3000_TSC_Vertical_SpeedBugs.Tab.LANDING);
        this.takeoffAllOnButton = this.gps.getChildById("SB_Takeoff_AllOn");
        this.takeoffAllOffButton = this.gps.getChildById("SB_Takeoff_AllOff");
        this.landingAllOnButton = this.gps.getChildById("SB_Landing_AllOn");
        this.landingAllOffButton = this.gps.getChildById("SB_Landing_AllOff");
        this.resetButton = this.gps.getChildById("SB_RestoreDefaults");
        this.gps.makeButton(this.takeoffAllOnButton, this.allOn.bind(this));
        this.gps.makeButton(this.takeoffAllOffButton, this.allOff.bind(this));
        this.gps.makeButton(this.landingAllOnButton, this.allOn.bind(this));
        this.gps.makeButton(this.landingAllOffButton, this.allOff.bind(this));
        this.gps.makeButton(this.resetButton, this.restoreAll.bind(this));
        for (let i = 0; i < this.references.length; i++) {
            this.gps.makeButton(this.references[i].statusElement, this.statusClick.bind(this, i));
            this.gps.makeButton(this.references[i].valueButton, this.valueClick.bind(this, i));
        }
        this.tabbedContent.init(root);
    }

    onEnter() {
        super.onEnter();
        let lastPageName = this.gps.history[this.gps.history.length - 1].pageName;
        if (lastPageName == "PFD Home" || lastPageName == "MFD Home") {
            if (SimVar.GetSimVarValue("SIM ON GROUND", "bool")) {
                this.tabbedContent.activateTab(AS3000_TSC_Vertical_SpeedBugs.Tab.TAKEOFF);
            } else {
                this.tabbedContent.activateTab(AS3000_TSC_Vertical_SpeedBugs.Tab.LANDING);
            }
        }
    }

    updateAllOnOffButtons() {
        let takeoffOnCount = 0;
        let landingOnCount = 0;
        for (let i = 0; i < this.references.length; i++) {
            if (this.references[i].isDisplayed) {
                if (this.references[i].tab == AS3000_TSC_Vertical_SpeedBugs.Tab.TAKEOFF) {
                    takeoffOnCount++;
                } else {
                    landingOnCount++;
                }
            }
        }
        Avionics.Utils.diffAndSetAttribute(this.takeoffAllOffButton, "state", takeoffOnCount == 0 ? "Greyed" : "");
        Avionics.Utils.diffAndSetAttribute(this.takeoffAllOnButton, "state", takeoffOnCount == 4 ? "Greyed" : "");
        Avionics.Utils.diffAndSetAttribute(this.landingAllOffButton, "state", landingOnCount == 0 ? "Greyed" : "");
        Avionics.Utils.diffAndSetAttribute(this.landingAllOnButton, "state", landingOnCount == 2 ? "Greyed" : "");
    }

    allOn() {
        for (let i = 0; i < this.references.length; i++) {
            if (this.references[i].tab == this.tabbedContent.getActiveTab()) {
                this.references[i].isDisplayed = true;
            }
        }
        this.sendToPfd();
    }

    allOff() {
        for (let i = 0; i < this.references.length; i++) {
            if (this.references[i].tab == this.tabbedContent.getActiveTab()) {
                this.references[i].isDisplayed = false;
            }
        }
        this.sendToPfd();
    }

    restoreAll() {
        for (let i = 0; i < this.references.length; i++) {
            if (this.references[i].tab == this.tabbedContent.getActiveTab()) {
                this.references[i].isDisplayed = false;
                this.references[i].displayedSpeed = this.references[i].refSpeed;
            }
        }
        this.sendToPfd();
    }
}
AS3000_TSC_Vertical_SpeedBugs.Tab = {
    TAKEOFF: 0,
    LANDING: 1
};

registerInstrument("as3000-tsc-vertical-element", AS3000_TSC_Vertical);
//# sourceMappingURL=AS3000_TSC_Vertical.js.map