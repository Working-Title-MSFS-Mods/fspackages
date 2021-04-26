class AS3000_TSC_Vertical extends AS3000_TSC {
    constructor() {
        super(...arguments);
        this.middleKnobText_Save = "";
    }

    get templateID() { return "AS3000_TSC_Vertical"; }

    _defineLabelBar() {
        this.topKnobText = this.getChildById("SoftKey_1");
        this.middleKnobText = this.getChildById("SoftKey_2");
        this.bottomKnobText = this.getChildById("SoftKey_3");
    }

    _createSpeedBugsPage() {
        return new WT_G5000_TSCSpeedBugs("PFD");
    }

    _createPFDSettingsPage() {
        return new WT_G5000_TSCPFDSettings("PFD", "PFD Home", "PFD");
    }

    _createTrafficMapSettingsPage(homePageGroup, homePageName) {
        return new WT_G5000_TSCTrafficMapSettings(homePageGroup, homePageName, WT_G3x5_TrafficSystem.ID, "XPDR1");
    }

    _createNavMapTrafficSettingsPage(homePageGroup, homePageName, mapSettings) {
        return new WT_G5000_TSCNavMapTrafficSettings(homePageGroup, homePageName, WT_G3x5_TrafficSystem.ID, "XPDR1", mapSettings);
    }

    _createAircraftSystemsPage() {
        return new WT_G5000_TSCAircraftSystems("MFD", "MFD Home");
    }

    _createChartsLightThresholdPopUp() {
        return new WT_G3x5_TSCChartsLightThreshold((() => this.airplane.engineering.potentiometer(WT_CitationLongitudeEngineering.Potentiometer.MFD_BACKLIGHT)).bind(this));
    }

    _createTransponderPopUp() {
        return new WT_G5000_TSCTransponderCode();
    }

    _initPopUpWindows() {
        super._initPopUpWindows();

        this.transponderMode = new NavSystemElementContainer("Transponder Mode", "TransponderMode", new WT_G5000_TSCTransponderMode());
        this.transponderMode.setGPS(this);
    }

    _initNavCom() {
        this.addIndependentElementContainer(new NavSystemElementContainer("NavCom", "NavComLeft", new AS3000_TSC_Vertical_NavComHome()));
    }

    connectedCallback() {
        super.connectedCallback();

        this._initNavCom();
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
    _defineXPDRChildren() {
        this._xpdrModeButton = this.gps.getChildById("XPDRMode");
        this._xpdrCodeButton = new WT_CachedElement(this.gps.getChildById("XPDRCode"));
        this._xpdrModeDisplay = new WT_CachedElement(this._xpdrModeButton.getElementsByClassName("mainText")[1]);
        this._xpdrCodeDisplay = this._xpdrCodeButton.element.getElementsByClassName("mainNumber")[0];
    }

    _initXPDRButtons() {
        this.gps.makeButton(this._xpdrCodeButton.element, this.openTransponder.bind(this));
        this.gps.makeButton(this._xpdrModeButton, this._onXPDRModeButtonPressed.bind(this));
    }

    _initXPDRTCASModeSettingListener() {
        this.gps.transponderMode.element.tcasModeSetting.addListener(this._onXPDRTCASModeSettingChanged.bind(this));
        this._xpdrTCASMode = this.gps.transponderMode.element.tcasModeSetting.getValue();
    }

    init(root) {
        super.init(root);

        this._initXPDRTCASModeSettingListener();
    }

    _onXPDRTCASModeSettingChanged(setting, newValue, oldValue) {
        this._xpdrTCASMode = newValue;
    }

    _updateXPDRMode() {
        let xpdrMode = this.gps.airplane.navCom.getTransponder(1).mode();

        let text;
        switch (xpdrMode) {
            case WT_AirplaneTransponder.Mode.ALT:
                switch (this._xpdrTCASMode) {
                    case WT_G5000_TransponderTCASModeSetting.Mode.AUTO:
                        text = "AUTO";
                        break;
                    case WT_G5000_TransponderTCASModeSetting.Mode.TA_ONLY:
                        text = "TA ONLY";
                        break;
                    default:
                        text = "ALT";
                }
                this._xpdrCodeButton.setAttribute("mode", "alt");
                break;
            case WT_AirplaneTransponder.Mode.ON:
                text = "ON";
                this._xpdrCodeButton.setAttribute("mode", "on");
                break;
            default:
                text = "STBY";
                this._xpdrCodeButton.setAttribute("mode", "standby");
        }
        this._xpdrModeDisplay.textContent = text;
    }

    _updateXPDRCode() {
        let transponderCode = ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4);
        if (transponderCode != this._xpdrCodeDisplay.textContent) {
            this._xpdrCodeDisplay.textContent = transponderCode;
        }
    }

    _updateXPDRIdent() {
    }

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

    _onXPDRModeButtonPressed() {
        if (this.gps.popUpElement === this.gps.transponderMode) {
            return;
        }

        let homePageGroup = this.gps.getCurrentPageGroup().name;
        let homePageName = homePageGroup + " Home";
        this.gps.transponderMode.element.setContext({homePageGroup: homePageGroup, homePageName: homePageName});
        this.gps.switchToPopUpPage(this.gps.transponderMode);
    }

    openTransponder() {
        if (this.gps.popUpElement === this.gps.transponderWindow) {
            return;
        }

        if (this.inputIndex != -1) {
            this.comFreqCancel();
        }
        let homePageGroup = this.gps.getCurrentPageGroup().name;
        let homePageName = homePageGroup + " Home";
        this.gps.transponderWindow.element.setContext(homePageGroup, homePageName);
        this.gps.switchToPopUpPage(this.gps.transponderWindow);
    }

    openAudioRadios() {
        if (this.gps.popUpElement === this.gps.audioRadioWindow) {
            return;
        }

        if (this.inputIndex != -1) {
            this.comFreqCancel();
        }
        let homePageGroup = this.gps.getCurrentPageGroup().name;
        let homePageName = homePageGroup + " Home";
        this.gps.audioRadioWindow.element.setContext(homePageGroup, homePageName);
        this.gps.switchToPopUpPage(this.gps.audioRadioWindow);
    }
}

class WT_G5000_TSCTransponderCode extends AS3000_TSC_Transponder {
    _initModeButtons() {
    }

    _updateModeButtons() {
    }
}

registerInstrument("as3000-tsc-vertical-element", AS3000_TSC_Vertical);
//# sourceMappingURL=AS3000_TSC_Vertical.js.map