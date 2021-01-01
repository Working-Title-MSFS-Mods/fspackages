class AS3000_TSC_Vertical extends AS3000_TSC {
    constructor() {
        super(...arguments);
        this.middleKnobText_Save = "";
    }

    createSpeedBugsPage() {
        return new AS3000_TSC_Vertical_SpeedBugs();
    }

    createAudioRadioWindow() {
        return new AS3000_TSC_Vertical_AudioRadios();
    }

    get templateID() { return "AS3000_TSC_Vertical"; }

    connectedCallback() {
        super.connectedCallback();
        this.topKnobText = this.getChildById("SoftKey_1");
        this.middleKnobText = this.getChildById("SoftKey_2");
        this.bottomKnobText = this.getChildById("SoftKey_3");
        this.addIndependentElementContainer(new NavSystemElementContainer("NavCom", "NavComLeft", new AS3000_TSC_Vertical_NavComHome()));
        this.getElementOfType(AS3000_TSC_ActiveFPL).setArrowSizes(5, 20, 10, 4, 8);
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

    setArrowSizes(leftOffset, topOffset, lineDistance, lineWidth, headWidth) {
        this.arrowLeftOffset = leftOffset;
        this.arrowTopOffset = topOffset;
        this.arrowLineDistance = lineDistance;
        this.arrowLineWidth = lineWidth;
        this.arrowHeadWidth = headWidth;
    }

    _initMFDPaneControlID() {
        this._mfdPaneControlID = this.urlConfig.index === 1 ? 0 : WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.LEFT;
    }

    _initMFDPaneSelectDisplay() {
    }

    _updateMFDPaneSelectDisplay() {
    }
}

class AS3000_TSC_Vertical_NavComHome extends AS3000_TSC_NavComHome {
    setSelectedCom(id) {
        let title = `COM${id} Standby`;
        let activeFreqSimVar = `COM ACTIVE FREQUENCY:${id}`;
        let stdbyFreqSimVar = `COM STANDBY FREQUENCY:${id}`;
        let spacingSimVar = `COM SPACING MODE:${id}`;
        if (this.gps.popUpElement == this.gps.frequencyKeyboard) {
            if (this.gps.frequencyKeyboard.element.activeFreqSimVar == activeFreqSimVar) {
                // keyboard already open and set to the right COM; don't need to open it again
                return;
            }

            // keyboard already open but set to another COM, we need to close the existing keyboard before opening a new one
            // to avoid weird stuff with the back button
            this.gps.goBack();
        }

        if (this.inputIndex != -1) {
            this.comFreqValidate();
        }
        this.selectedCom = id;
        this.setSoftkeysNames();
        let callback = id == 1 ? this.setCom1Freq.bind(this) : this.setCom2Freq.bind(this);
        let homePageGroup = this.gps.getCurrentPageGroup().name;
        let homePageName = homePageGroup + " Home";
        this.gps.frequencyKeyboard.element.setContext(title, 118, 136.99, activeFreqSimVar, stdbyFreqSimVar, callback, homePageGroup, homePageName, spacingSimVar, false);
        this.gps.switchToPopUpPage(this.gps.frequencyKeyboard);
    }

    setCom1Freq(newFreq, swap) {
        SimVar.SetSimVarValue("K:COM_STBY_RADIO_SET_HZ", "Hz", newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:COM_STBY_RADIO_SWAP", "Bool", 1);
        }
    }

    setCom2Freq(newFreq, swap) {
        SimVar.SetSimVarValue("K:COM2_STBY_RADIO_SET_HZ", "Hz", newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:COM2_RADIO_SWAP", "Bool", 1);
        }
    }

    openTransponder() {
        if (this.inputIndex != -1) {
            this.comFreqCancel();
        }
        let homePageGroup = this.gps.getCurrentPageGroup().name;
        let homePageName = homePageGroup + " Home";
        this.gps.transponderWindow.element.setContext(homePageGroup, homePageName);
        this.gps.switchToPopUpPage(this.gps.transponderWindow);
    }

    openAudioRadios() {
        if (this.inputIndex != -1) {
            this.comFreqCancel();
        }
        let homePageGroup = this.gps.getCurrentPageGroup().name;
        let homePageName = homePageGroup + " Home";
        this.gps.audioRadioWindow.element.setContext(homePageGroup, homePageName);
        this.gps.switchToPopUpPage(this.gps.audioRadioWindow);
    }
}

class AS3000_TSC_Vertical_AirspeedReference extends AS3000_TSC_AirspeedReference {
    constructor(valueButton, statusElem, refSpeed, displayName, tab) {
        super(valueButton, statusElem, refSpeed, displayName);
        this.tab = tab;
    }
}

class AS3000_TSC_Vertical_SpeedBugs extends AS3000_TSC_SpeedBugs {
    constructor() {
        super(...arguments);
        this.tabbedContent = new WT_TSCTabbedContent(this);
    }

    initAirspeedReference(valueButton, statusButton, refSpeed, name, tab) {
        if (valueButton && statusButton) {
            this.references.push(new AS3000_TSC_Vertical_AirspeedReference(valueButton, statusButton, refSpeed == null ? -1 : refSpeed, name, tab));
        }
    }

    init(root) {
        let designSpeeds = Simplane.getDesignSpeeds();
        this.initAirspeedReference(this.gps.getChildById("SB_V1Value"), this.gps.getChildById("SB_V1Status"), designSpeeds.V1, "1", AS3000_TSC_Vertical_SpeedBugs.Tab.TAKEOFF);
        this.initAirspeedReference(this.gps.getChildById("SB_VrValue"), this.gps.getChildById("SB_VrStatus"), designSpeeds.Vr, "R", AS3000_TSC_Vertical_SpeedBugs.Tab.TAKEOFF);
        this.initAirspeedReference(this.gps.getChildById("SB_V2Value"), this.gps.getChildById("SB_V2Status"), designSpeeds.V2, "2", AS3000_TSC_Vertical_SpeedBugs.Tab.TAKEOFF);
        this.initAirspeedReference(this.gps.getChildById("SB_VftoValue"), this.gps.getChildById("SB_VftoStatus"), designSpeeds.Venr, "FTO", AS3000_TSC_Vertical_SpeedBugs.Tab.TAKEOFF);
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