class AS3000_TSC_Vertical extends AS3000_TSC {
    constructor() {
        super(...arguments);
        this.middleKnobText_Save = "";
    }

    _createSpeedBugsPage() {
        return new WT_G5000_TSCSpeedBugs("PFD");
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

    _handleZoomEvent(event) {
        if (this.popUpElement === this.audioRadioWindow || this.popUpElement === this.frequencyKeyboard) {
            return;
        }

        super._handleZoomEvent(event);
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

registerInstrument("as3000-tsc-vertical-element", AS3000_TSC_Vertical);
//# sourceMappingURL=AS3000_TSC_Vertical.js.map