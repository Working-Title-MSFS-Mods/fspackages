class AS3X_Touch extends NavSystemTouch {
    constructor() {
        super();
        this.m_isSplit = true;
        this.lastPageIndex = NaN;
        this.lastPageGroup = "";
        this.displayMode = "Splitted";
        this.engineDisplayed = true;
        this.handleReversionaryMode = false;
        this.tactileOnly = false;
        this.initDuration = 4000;
    }
    get templateID() { return "AS3X_Touch"; }
    connectedCallback() {
        super.connectedCallback();
        this.mainDisplay = this.getChildById("MainDisplay");
        this.pfd = this.getChildById("PFD");
        this.mfd = this.getChildById("MFD");
        this.mainMfd = this.getChildById("MainMFD");
        this.pagesContainer = this.getChildById("PagesContainer");
        this.currentPageName = this.getChildById("currentPageName");
        this.pageList = this.getChildById("pageList");
        this.mfdBottomBar = this.getChildById("MFD_BottomBar");
        this.botLineTimer = this.getChildById("botLine_Timer");
        this.botLineOat = this.getChildById("botLine_Oat");
        this.botLineLocalTime = this.getChildById("botLine_LocalTime");
        this.leftInnerKnobText = this.getChildById("LeftInnerKnobText");
        this.leftOuterKnobText = this.getChildById("LeftOuterKnobText");
        this.rightInnerKnobText = this.getChildById("RightInnerKnobText");
        this.rightOuterKnobText = this.getChildById("RightOuterKnobText");
        this.mfdMapElement = this.getChildById("Map_Elements");
        this.mfdMapMapElement = this.mfdMapElement.getElementsByTagName("map-instrument")[0];
        this.warnings = new PFD_Warnings();
        this.addIndependentElementContainer(new NavSystemElementContainer("Warnings", "Warnings", this.warnings));
        this.addIndependentElementContainer(new NavSystemElementContainer("MainMap", "Map_Elements", new AS3X_Touch_Map()));
        this.topBar = new AS3X_Touch_TopBar();
        this.addIndependentElementContainer(new NavSystemElementContainer("TopBar", "TopBar", this.topBar));
        this.transponderWindow = new NavSystemElementContainer("Transponder", "XPDR", new AS3X_Touch_Transponder());
        this.transponderWindow.setGPS(this);
        this.directToWindow = new NavSystemElementContainer("DirectTo", "DirectTo", new AS3X_Touch_DirectTo());
        this.directToWindow.setGPS(this);
        this.insertBeforWaypointWindow = new NavSystemElementContainer("insertBeforeWaypointWindow", "insertBeforeWaypointWindow", new AS3X_Touch_InsertBeforeWaypoint());
        this.insertBeforWaypointWindow.setGPS(this);
        this.audioPanelWindow = new NavSystemElementContainer("AudioPanel", "AudioPanel", new AS3X_Touch_AudioPanel());
        this.audioPanelWindow.setGPS(this);
        this.departureSelection = new NavSystemElementContainer("DepartureSelection", "DepartureSelection", new AS3X_Touch_DepartureSelection());
        this.departureSelection.setGPS(this);
        this.arrivalSelection = new NavSystemElementContainer("ArrivalSelection", "ArrivalSelection", new AS3X_Touch_ArrivalSelection());
        this.arrivalSelection.setGPS(this);
        this.approachSelection = new NavSystemElementContainer("ApproachSelection", "ApproachSelection", new AS3X_Touch_ApproachSelection());
        this.approachSelection.setGPS(this);
        this.frequencyKeyboard = new NavSystemElementContainer("frequencyKeyboard", "frequencyKeyboard", new AS3X_Touch_FrequencyKeyboard());
        this.frequencyKeyboard.setGPS(this);
        this.pfdMenu = new NavSystemElementContainer("PFD menu", "PFD_Menu", new AS3X_Touch_PFD_Menu());
        this.pfdMenu.setGPS(this);
        this.pageMenu = new NavSystemElementContainer("Page menu", "PageMenu", new AS3X_Touch_PageMenu());
        this.pageMenu.setGPS(this);
        // this.mapMenu = new NavSystemElementContainer("Map menu", "MapMenu", new AS3X_Touch_MapMenu());
        // this.mapMenu.setGPS(this);
        this.afcsMenu = new NavSystemElementContainer("AFCS Menu", "AFCS_Menu", new AS3X_Touch_AFCSMenu());
        this.afcsMenu.setGPS(this);
        this.fullKeyboard = new NavSystemElementContainer("Full Keyboard", "fullKeyboard", new AS3X_Touch_FullKeyboard());
        this.fullKeyboard.setGPS(this);
        this.duplicateWaypointSelection = new NavSystemElementContainer("Waypoint Duplicates", "WaypointDuplicateWindow", new AS3X_Touch_DuplicateWaypointSelection());
        this.duplicateWaypointSelection.setGPS(this);
        this.pageGroups = [
            new AS3X_Touch_PageGroup("MFD", this, [
                new AS3X_Touch_NavSystemPage("Map", "Map", new AS3X_Touch_MapContainer("Map"), "Map", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_SMALL_1.png"),
                new AS3X_Touch_NavSystemPage("Active FPL", "FPL", new NavSystemElementGroup([
                    new NavSystemTouch_ActiveFPL(true),
                    new AS3X_Touch_MapContainer("Afpl_Map")
                ]), "FPL", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_FLIGHT_PLAN_MED_1.png"),
                new AS3X_Touch_NavSystemPage("Procedures", "Procedures", new AS3X_Touch_Procedures(), "Proc", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_PROCEDURES_1.png"),
            ], [
                new AS3X_Touch_MenuButton("Setup", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_SMALL_SYSTEM_PROP_1.png", this.SwitchToPageGroupMenu.bind(this, "Setup"), false),
                new AS3X_Touch_MenuButton("Direct-To", "", this.switchToPopUpPage.bind(this, this.directToWindow), true),
                new AS3X_Touch_MenuButton("Nearest", "", this.SwitchToPageGroupMenu.bind(this, "NRST"), true),
                new AS3X_Touch_MenuButton("Com 1 Frequency", "", this.openFrequencyKeyboard.bind(this, "COM 1 Standby", 118, 136.99, "COM ACTIVE FREQUENCY:1", "COM STANDBY FREQUENCY:1", this.setCom1Freq.bind(this), "COM SPACING MODE:1"), false),
                new AS3X_Touch_MenuButton("Com 2 Frequency", "", this.openFrequencyKeyboard.bind(this, "COM 2 Standby", 118, 136.99, "COM ACTIVE FREQUENCY:2", "COM STANDBY FREQUENCY:2", this.setCom2Freq.bind(this), "COM SPACING MODE:2"), false),
                new AS3X_Touch_MenuButton("Nav 1 Frequency", "", this.openFrequencyKeyboard.bind(this, "NAV 1 Standby", 108, 117.95, "NAV ACTIVE FREQUENCY:1", "NAV STANDBY FREQUENCY:1", this.setNav1Freq.bind(this), ""), false),
                new AS3X_Touch_MenuButton("Nav 2 Frequency", "", this.openFrequencyKeyboard.bind(this, "NAV 2 Standby", 108, 117.95, "NAV ACTIVE FREQUENCY:2", "NAV STANDBY FREQUENCY:2", this.setNav2Freq.bind(this), ""), false),
            ]),
            new AS3X_Touch_PageGroup("NRST", this, [
                new AS3X_Touch_NavSystemPage("Nearest Airport", "NearestAirport", new AS3X_Touch_NRST_Airport(), "Apt", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_AIRPORT.png"),
                new AS3X_Touch_NavSystemPage("Nearest VOR", "NearestVOR", new AS3X_Touch_NRST_VOR(), "VOR", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_VOR_2.png"),
                new AS3X_Touch_NavSystemPage("Nearest NDB", "NearestNDB", new AS3X_Touch_NRST_NDB(), "NDB", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_NDB.png"),
                new AS3X_Touch_NavSystemPage("Nearest Int", "NearestIntersection", new AS3X_Touch_NRST_Intersection(), "INT", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_INT.png"),
            ], [
                new AS3X_Touch_MenuButton("Main Menu", "", this.SwitchToPageGroupMenu.bind(this, "MFD"), true),
            ]),
            new AS3X_Touch_PageGroup("Setup", this, [
                new AS3X_Touch_NavSystemPage("Display", "Display", new AS3X_Touch_Setup_Display(), "Disp", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_LIGHTING_CONFIG.png"),
            ], [
                new AS3X_Touch_MenuButton("Main Menu", "", this.SwitchToPageGroupMenu.bind(this, "MFD"), false),
            ])
        ];
        if (SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") != 1) {
            SimVar.SetSimVarValue("K:COM_1_SPACING_MODE_SWITCH", "number", 0);
        }
        if (SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum") != 1) {
            SimVar.SetSimVarValue("K:COM_2_SPACING_MODE_SWITCH", "number", 0);
        }
        this.pageNames = [];
        for (let i = 0; i < this.pageGroups[0].pages.length; i++) {
            let pageElem = document.createElement("div");
            pageElem.className = "page";
            diffAndSetText(pageElem, this.pageGroups[0].pages[i].shortName);
            this.pageNames.push(pageElem);
            this.pageList.appendChild(pageElem);
        }
        this.makeButton(this.mfdBottomBar, this.switchToPopUpPage.bind(this, this.pageMenu));
        this.makeButton(this.getChildById("Compass"), function () {
            if (this.popUpElement == this.pfdMenu) {
                this.closePopUpElement();
            }
            else {
                this.switchToPopUpPage(this.pfdMenu);
            }
        }.bind(this));
        this.makeButton(this.getChildById("AutopilotInfos"), function () {
            if (this.popUpElement == this.afcsMenu) {
                this.closePopUpElement();
            }
            else {
                this.switchToPopUpPage(this.afcsMenu);
            }
        }.bind(this));
        this.autoPitotHeat = false;
        SimVar.SetSimVarValue("L:AS3X_Touch_Brightness_IsAuto", "number", 1);
    }
    parseXMLConfig() {
        super.parseXMLConfig();
        if (this.instrumentXmlConfig) {
            let displayModeConfig = this.instrumentXmlConfig.getElementsByTagName("DisplayMode");
            if (displayModeConfig.length > 0) {
                this.displayMode = displayModeConfig[0].textContent;
            }
            let reversionaryMode = null;
            reversionaryMode = this.instrumentXmlConfig.getElementsByTagName("ReversionaryMode")[0];
            if (reversionaryMode && reversionaryMode.textContent == "True") {
                this.handleReversionaryMode = true;
            }
            let tactileOnly = null;
            tactileOnly = this.instrumentXmlConfig.getElementsByTagName("TactileOnly")[0];
            if (tactileOnly && tactileOnly.textContent == "True") {
                this.tactileOnly = true;
                diffAndSetStyle(this.getChildById("LeftKnobInfos"), StyleProperty.display, "None");
                diffAndSetStyle(this.getChildById("RightKnobInfos"), StyleProperty.display, "None");
            }
            let autoPitotHeat = this.instrumentXmlConfig.getElementsByTagName("AutoPitotHeat")[0];
            if (autoPitotHeat && autoPitotHeat.textContent == "True") {
                this.autoPitotHeat = true;
                this.pitotOnTime = null;
                this.pitotHeating = false;
            }
        }
        switch (this.displayMode) {
            case "PFD":
                diffAndSetStyle(this.mainMfd, StyleProperty.display, "None");
                this.addIndependentElementContainer(new AS3X_Touch_PFD());
                this.addIndependentElementContainer(new NavSystemElementContainer("EngineInfos", "EngineInfos", new GlassCockpit_XMLEngine()));
                this.addIndependentElementContainer(new NavSystemElementContainer("WindData", "WindData", new PFD_WindData()));
                diffAndSetStyle(this.getChildById("EngineInfos"), StyleProperty.display, "None");
                diffAndSetAttribute(this.mainDisplay, "state", "FullNoEngine");
                diffAndSetAttribute(this.mfd, "state", "HideNoEngine");
                this.engineDisplayed = false;
                this.m_isSplit = false;
                let pfdMaps = this.getElementsByClassName("PFDMap");
                for (let i = 0; i < pfdMaps.length; i++) {
                    diffAndSetAttribute(pfdMaps[i], "show-bing-map", "true");
                }
                break;
            case "MFD":
                diffAndSetStyle(this.pfd, StyleProperty.display, "None");
                this.mainMap = new AS3X_Touch_MFD_Main();
                this.addIndependentElementContainer(this.mainMap);
                this.addIndependentElementContainer(new NavSystemElementContainer("EngineInfos", "EngineInfos", new GlassCockpit_XMLEngine()));
                diffAndSetAttribute(this.mainDisplay, "state", "Full");
                diffAndSetAttribute(this.mfd, "state", "Hide");
                this.engineDisplayed = true;
                this.m_isSplit = false;
                let mfdMaps = this.getElementsByClassName("MFDMap");
                for (let i = 0; i < mfdMaps.length; i++) {
                    diffAndSetAttribute(mfdMaps[i], "show-bing-map", "true");
                }
                break;
            case "Splitted":
                diffAndSetStyle(this.mainMfd, StyleProperty.display, "None");
                this.addIndependentElementContainer(new AS3X_Touch_PFD());
                this.addIndependentElementContainer(new NavSystemElementContainer("EngineInfos", "EngineInfos", new GlassCockpit_XMLEngine()));
                this.addIndependentElementContainer(new NavSystemElementContainer("WindData", "WindData", new PFD_WindData()));
                this.engineDisplayed = true;
                this.m_isSplit = true;
                let splitMaps = this.getElementsByClassName("SplitMap");
                for (let i = 0; i < splitMaps.length; i++) {
                    diffAndSetAttribute(splitMaps[i], "show-bing-map", "true");
                }
                break;
        }
        this.updateKnobsLabels();
        this.topBar.updateFullSplitButton();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    reboot() {
        super.reboot();
        if (this.warnings)
            this.warnings.reset();
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (this.autoPitotHeat) {
            let temp = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius");
            let pitotHeat = SimVar.GetSimVarValue("PITOT HEAT", "bool");
            let rpm = SimVar.GetSimVarValue("GENERAL ENG RPM:1", "rpm");
            if (temp <= 7 && rpm > 0) {
                if (!pitotHeat) {
                    SimVar.SetSimVarValue("K:PITOT_HEAT_ON", "bool", true);
                    SimVar.SetSimVarValue("L:G3X_Pitot_Heating", "bool", true);
                    this.pitotOnTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
                } else {
                    let now = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
                    if (now - this.pitotOnTime > 10 + (7 - temp) / 3) {
                        SimVar.SetSimVarValue("L:G3X_Pitot_Heating", "bool", false);
                    };
                }
            } else if (pitotHeat && (temp > 7 || rpm <= 0)) {
                SimVar.SetSimVarValue("K:PITOT_HEAT_OFF", "bool", true);
            }
        }
        if (this.handleReversionaryMode && this.displayMode == "PFD") {
            let reversionary = false;
            if (document.body.hasAttribute("reversionary")) {
                var attr = document.body.getAttribute("reversionary");
                if (attr == "true") {
                    reversionary = true;
                }
            }
            if (reversionary && !this.reversionaryMode) {
                this.reversionaryMode = true;
                this.engineDisplayed = true;
                diffAndSetStyle(this.getChildById("EngineInfos"), StyleProperty.display, "");
                diffAndSetAttribute(this.mainDisplay, "state", "Half");
                diffAndSetAttribute(this.mfd, "state", "Half");
                this.m_isSplit = true;
                this.updateKnobsLabels();
                this.topBar.updateFullSplitButton();
            }
            else if (!reversionary && this.reversionaryMode) {
                this.reversionaryMode = false;
                this.engineDisplayed = false;
                diffAndSetStyle(this.getChildById("EngineInfos"), StyleProperty.display, "None");
                diffAndSetAttribute(this.mainDisplay, "state", "FullNoEngine");
                diffAndSetAttribute(this.mfd, "state", "HideNoEngine");
                this.m_isSplit = false;
                this.updateKnobsLabels();
                this.topBar.updateFullSplitButton();
            }
        }
        if (this.lastPageIndex != this.getCurrentPageGroup().pageIndex || this.getCurrentPageGroup().name != this.lastPageGroup) {
            if (!isNaN(this.lastPageIndex)) {
                diffAndSetAttribute(this.pageNames[this.lastPageIndex], "state", "");
            }
            this.lastPageIndex = this.getCurrentPageGroup().pageIndex;
            this.lastPageGroup = this.getCurrentPageGroup().name;
            diffAndSetText(this.currentPageName, this.getCurrentPageGroup().pages[this.lastPageIndex].name);
            diffAndSetAttribute(this.pageNames[this.lastPageIndex], "state", "Selected");
        }
        diffAndSetText(this.botLineTimer, this.pfdMenu.element.getTimerValue());
        diffAndSetText(this.botLineOat, fastToFixed(SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "Celsius"), 0) + "°C");
        let time = SimVar.GetSimVarValue("E:LOCAL TIME", "seconds");
        let seconds = Math.floor(time % 60);
        let minutes = Math.floor((time / 60) % 60);
        let hours = Math.floor(Math.min(time / 3600, 99));
        diffAndSetText(this.botLineLocalTime, (hours < 10 ? "0" : "") + hours + (minutes < 10 ? ":0" : ":") + minutes + (seconds < 10 ? ":0" : ":") + seconds);
        let timeOfDay = SimVar.GetSimVarValue("E:TIME OF DAY", "number");
        let autoBright = (timeOfDay == 1 ? 1 : timeOfDay == 3 ? 0.1 : 0.35);
        SimVar.SetSimVarValue("L:AS3X_Touch_Brightness_Auto", "number", autoBright);
        if (SimVar.GetSimVarValue("L:AS3X_Touch_Brightness_IsAUto", "number") == 1) {
            SimVar.SetSimVarValue("L:AS3X_Touch_Brightness", "number", 0.05 + 0.95 * autoBright);
        }
        else {
            SimVar.SetSimVarValue("L:AS3X_Touch_Brightness", "number", 0.05 + 0.95 * SimVar.GetSimVarValue("L:AS3X_Touch_Brightness_Manual", "number"));
        }
    }
    updateKnobsLabels() {
        if (this.displayMode == "MFD") {
            diffAndSetText(this.leftInnerKnobText, "Zoom Map");
            this.leftInnerKnobCB = this.zoomMapMain_CB.bind(this);
            diffAndSetText(this.leftOuterKnobText, "");
            this.leftOuterKnobCB = this.zoomMapMain_CB.bind(this);
        }
        else {
            diffAndSetText(this.leftInnerKnobText, "Heading");
            this.leftInnerKnobCB = this.heading_CB.bind(this);
            diffAndSetText(this.leftOuterKnobText, "Altitude");
            this.leftOuterKnobCB = this.altitude_CB.bind(this);
        }
        if (this.isSplit()) {
            diffAndSetText(this.rightInnerKnobText, "Zoom Map");
            this.rightInnerKnobCB = this.zoomMap_CB.bind(this);
            diffAndSetText(this.rightOuterKnobText, "Select Page");
            this.rightOuterKnobCB = this.selectPage_CB.bind(this);
        }
        else {
            if (this.displayMode == "MFD") {
                diffAndSetText(this.rightInnerKnobText, "Zoom Map");
                this.rightInnerKnobCB = this.zoomMapMain_CB.bind(this);
                diffAndSetText(this.rightOuterKnobText, "");
                this.rightOuterKnobCB = this.zoomMapMain_CB.bind(this);
            }
            else {
                diffAndSetText(this.rightInnerKnobText, "Course");
                this.rightInnerKnobCB = this.crs_CB.bind(this);
                diffAndSetText(this.rightOuterKnobText, "Baro");
                this.rightOuterKnobCB = this.baro_CB.bind(this);
            }
        }
    }
    openFrequencyKeyboard(_title, _minFreq, _maxFreq, _activeSimVar, _StbySimVar, _endCallBack, _frequencySpacingModeSimvar) {
        this.frequencyKeyboard.getElementOfType(NavSystemTouch_FrequencyKeyboard).setContext(_title, _minFreq, _maxFreq, _activeSimVar, _StbySimVar, _endCallBack, this.getCurrentPage(), _frequencySpacingModeSimvar);
        this.switchToPopUpPage(this.frequencyKeyboard);
    }
    getFullKeyboard() {
        return this.fullKeyboard;
    }
    setCom1Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:COM_STBY_RADIO_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:COM_STBY_RADIO_SWAP", "Bool", 1);
        }
    }
    setCom2Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:COM2_RADIO_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:COM2_RADIO_SWAP", "Bool", 2);
        }
    }
    setNav1Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:NAV1_STBY_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:NAV1_RADIO_SWAP", "Bool", 1);
        }
    }
    setNav2Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:NAV2_STBY_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:NAV2_RADIO_SWAP", "Bool", 1);
        }
    }
    heading_CB(_inc) {
        if (_inc) {
            SimVar.SetSimVarValue("K:HEADING_BUG_INC", "number", 0);
        }
        else {
            SimVar.SetSimVarValue("K:HEADING_BUG_DEC", "number", 0);
        }
    }
    altitude_CB(_inc) {
        if (_inc) {
            SimVar.SetSimVarValue("K:AP_ALT_VAR_INC", "number", 0);
        }
        else {
            SimVar.SetSimVarValue("K:AP_ALT_VAR_DEC", "number", 0);
        }
    }
    baro_CB(_inc) {
        if (_inc) {
            SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", 1);
        }
        else {
            SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", 1);
        }
    }
    crs_CB(_inc) {
        let cdiSrc = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool") ? 3 : Simplane.getAutoPilotSelectedNav();
        if (_inc) {
            if (cdiSrc == 1) {
                SimVar.SetSimVarValue("K:VOR1_OBI_INC", "number", 0);
            }
            else if (cdiSrc == 2) {
                SimVar.SetSimVarValue("K:VOR2_OBI_INC", "number", 0);
            }
        }
        else {
            if (cdiSrc == 1) {
                SimVar.SetSimVarValue("K:VOR1_OBI_DEC", "number", 0);
            }
            else if (cdiSrc == 2) {
                SimVar.SetSimVarValue("K:VOR2_OBI_DEC", "number", 0);
            }
        }
    }
    zoomMap_CB(_inc) {
        if (_inc) {
            this.mfdMapMapElement.onEvent("RANGE_INC");
        }
        else {
            this.mfdMapMapElement.onEvent("RANGE_DEC");
        }
    }
    zoomMapMain_CB(_inc) {
        if (_inc) {
            this.mainMap.onEvent("RANGE_INC");
        }
        else {
            this.mainMap.onEvent("RANGE_DEC");
        }
    }
    selectPage_CB(_inc) {
        if (_inc) {
            this.computeEvent("NavigationSmallInc");
        }
        else {
            this.computeEvent("NavigationSmallDec");
        }
    }
    computeEvent(_event) {
        super.computeEvent(_event);
        switch (_event) {
            case "Menu_Push":
                if (this.popUpElement == this.pageMenu) {
                    this.closePopUpElement();
                }
                else {
                    this.switchToPopUpPage(this.pageMenu);
                }
                break;
            case "Back_Push":
                if (this.popUpElement) {
                    this.closePopUpElement();
                }
                else {
                    this.SwitchToMenuName("MFD");
                    this.computeEvent("Master_Caution_Push");
                    this.computeEvent("Master_Warning_Push");
                }
                break;
            case "NRST_Push":
                if (this.popUpElement) {
                    this.closePopUpElement();
                }
                if (this.getCurrentPageGroup().name == "NRST") {
                    this.SwitchToMenuName("MFD");
                }
                else {
                    this.SwitchToMenuName("NRST");
                }
                break;
            case "DirectTo_Push":
                if (this.popUpElement == this.directToWindow) {
                    this.closePopUpElement();
                }
                else {
                    if (this.popUpElement) {
                        this.closePopUpElement;
                    }
                    this.switchToPopUpPage(this.directToWindow);
                }
                break;
            case "Knob_Inner_L_INC":
                this.leftInnerKnobCB(true);
                break;
            case "Knob_Inner_L_DEC":
                this.leftInnerKnobCB(false);
                break;
            case "Knob_Inner_R_INC":
                this.rightInnerKnobCB(true);
                break;
            case "Knob_Inner_R_DEC":
                this.rightInnerKnobCB(false);
                break;
            case "Knob_Outer_L_INC":
                this.leftOuterKnobCB(true);
                break;
            case "Knob_Outer_L_DEC":
                this.leftOuterKnobCB(false);
                break;
            case "Knob_Outer_R_INC":
                this.rightOuterKnobCB(true);
                break;
            case "Knob_Outer_R_DEC":
                this.rightOuterKnobCB(false);
                break;
        }
    }
    switchToPopUpPage(_pageContainer, _PopUpCloseCallback = null) {
        super.switchToPopUpPage(_pageContainer, _PopUpCloseCallback);
        if (!this.m_isSplit) {
            diffAndSetAttribute(this.mainDisplay, "state", this.engineDisplayed ? "Half" : "HalfNoEngine");
            diffAndSetAttribute(this.mfd, "state", this.engineDisplayed ? "Half" : "HalfNoEngine");
        }
    }
    closePopUpElement() {
        super.closePopUpElement();
        if (!this.m_isSplit) {
            diffAndSetAttribute(this.mainDisplay, "state", this.engineDisplayed ? "Full" : "FullNoEngine");
            diffAndSetAttribute(this.mfd, "state", this.engineDisplayed ? "Hide" : "HideNoEngine");
        }
    }
    switchHalfFull() {
        this.m_isSplit = !this.m_isSplit;
        diffAndSetAttribute(this.mainDisplay, "state", this.m_isSplit || this.popUpElement != null ? this.engineDisplayed ? "Half" : "HalfNoEngine" : this.engineDisplayed ? "Full" : "FullNoEngine");
        diffAndSetAttribute(this.mfd, "state", this.m_isSplit || this.popUpElement != null ? this.engineDisplayed ? "Half" : "HalfNoEngine" : this.engineDisplayed ? "Hide" : "HideNoEngine");
        this.updateKnobsLabels();
        this.topBar.updateFullSplitButton();
    }
    isSplit() {
        return this.m_isSplit;
    }
    forceSplit(_split) {
        if (_split != this.m_isSplit) {
            this.switchHalfFull();
        }
    }
    SwitchToMenuName(_name) {
        super.SwitchToMenuName(_name);
        if (!this.m_isSplit && _name != "MFD") {
            diffAndSetAttribute(this.mainDisplay, "state", this.engineDisplayed ? "Half" : "HalfNoEngine");
            diffAndSetAttribute(this.mfd, "state", this.engineDisplayed ? "Half" : "HalfNoEngine");
        }
        else if (!this.m_isSplit) {
            diffAndSetAttribute(this.mainDisplay, "state", this.engineDisplayed ? "Full" : "FullNoEngine");
            diffAndSetAttribute(this.mfd, "state", this.engineDisplayed ? "Hide" : "HideNoEngine");
        }
        this.updatePageList();
    }
    SwitchToPageName(_menu, _page) {
        super.SwitchToPageName(_menu, _page);
        this.updatePageList();
    }
    updatePageList() {
        for (let i = 0; i < this.pageGroups[this.currentPageGroupIndex].pages.length; i++) {
            if (i >= this.pageNames.length) {
                let pageElem = document.createElement("div");
                pageElem.className = "page";
                this.pageNames.push(pageElem);
                this.pageList.appendChild(pageElem);
            }
            else {
                diffAndSetStyle(this.pageNames[i], StyleProperty.display, "block");
            }
            diffAndSetText(this.pageNames[i], this.pageGroups[this.currentPageGroupIndex].pages[i].shortName);
        }
        for (let i = this.pageGroups[this.currentPageGroupIndex].pages.length; i < this.pageNames.length; i++) {
            diffAndSetStyle(this.pageNames[i], StyleProperty.display, "none");
        }
    }
    SwitchToPageGroupMenu(_menu) {
        this.closePopUpElement();
        this.SwitchToMenuName(_menu);
        this.switchToPopUpPage(this.pageMenu);
    }
}
class AS3X_Touch_PFD extends NavSystemElementContainer {
    constructor() {
        super("PFD", "PFD", null);
        this.attitude = new PFD_Attitude();
        this.mapInstrument = new MapInstrumentElement();
        this.annunciations = new AS3X_Touch_Annunciations();
        this.element = new NavSystemElementGroup([
            new PFD_Altimeter(),
            new PFD_Airspeed(),
            new PFD_Compass(),
            this.attitude,
            this.mapInstrument,
            this.annunciations,
            new AS3X_Touch_elevatorTrim(),
            new PFD_RadarAltitude(),
            new PFD_AutopilotDisplay()
        ]);
        this.mapInstrument.setGPS(this.gps);
    }
    init() {
        super.init();
        diffAndSetAttribute(this.attitude.svg, "background", "false");
        this.gps.makeButton(this.gps.getChildById("Annunciations"), () => {
            this.gps.computeEvent("Master_Caution_Push");
            this.gps.computeEvent("Master Warning Push");
        });
    }
}
class AS3X_Touch_MFD_Main extends NavSystemElementContainer {
    constructor() {
        super("MainMFD", "MainMFD", null);
        this.element = new AS3X_Touch_Map();
    }
}
class AS3X_Touch_Annunciations extends Cabin_Annunciations {
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        // Hide ourselves if we have no messages to avoid an empty black box
        let hideMe = true;
        for (var i = 0; i < this.allMessages.length; i++) {
            if (this.allMessages[i].Visible) {
                hideMe = false;
                break;
            }
        }
        if (hideMe) {
            this.annunciations.setAttribute("state", "Hidden");
        }
    }
}
class AS3X_Touch_TopBar extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.isIdent = false;
    }
    init(root) {
        this.comActiveFreq = this.gps.getChildById("com_active");
        this.comActiveIdent = this.gps.getChildById("com_active_ident");
        this.comStbyFreq = this.gps.getChildById("com_standby");
        this.comStbyIdent = this.gps.getChildById("com_standby_ident");
        this.xpdrMode = this.gps.getChildById("xpdr_mode");
        this.xpdrCode = this.gps.getChildById("xpdr_code");
        this.audioButton = this.gps.getChildById("audio_btn");
        this.wpt = this.gps.getChildById("wpt");
        this.brg = this.gps.getChildById("brg");
        this.dist = this.gps.getChildById("dist");
        this.ete = this.gps.getChildById("ete");
        this.gs = this.gps.getChildById("gs");
        this.trk = this.gps.getChildById("trk");
        this.xpdrButton = this.gps.getChildById("xpdr_btn");
        this.identButton = this.gps.getChildById("ident_btn");
        this.identButton_Status = this.identButton.getElementsByClassName("statusBar")[0];
        this.comActiveButton = this.gps.getChildById("com_active_btn");
        this.comStandbyButton = this.gps.getChildById("com_standby_btn");
        this.fullSplitButon = this.gps.getChildById("full_split_switch_button");
        this.fullSplitButon_title = this.fullSplitButon.getElementsByClassName("title")[0];
        this.gps.makeButton(this.xpdrButton, this.SwitchOrClosePopup.bind(this, this.gps.transponderWindow));
        this.gps.makeButton(this.identButton, this.ident.bind(this));
        this.gps.makeButton(this.audioButton, this.SwitchOrClosePopup.bind(this, this.gps.audioPanelWindow));
        this.gps.makeButton(this.comActiveButton, SimVar.SetSimVarValue.bind(this, "K:COM_STBY_RADIO_SWAP", "number", 1));
        this.gps.makeButton(this.comStandbyButton, this.gps.openFrequencyKeyboard.bind(this.gps, "COM 1 Standby", 118, 136.99, "COM ACTIVE FREQUENCY:1", "COM STANDBY FREQUENCY:1", this.gps.setCom1Freq.bind(this.gps), "COM SPACING MODE:1"));
        this.gps.makeButton(this.fullSplitButon, this.switchFullSplit.bind(this));
        this.updateFullSplitButton();
    }
    SwitchOrClosePopup(_popuPage) {
        if (this.gps.popUpElement == _popuPage) {
            this.gps.closePopUpElement();
        }
        else {
            this.gps.switchToPopUpPage(_popuPage);
        }
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        diffAndSetText(this.comActiveFreq, fastToFixed(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:1", "MHz"), 3));
        diffAndSetText(this.comStbyFreq, fastToFixed(SimVar.GetSimVarValue("COM STANDBY FREQUENCY:1", "MHz"), 3));
        diffAndSetText(this.comActiveIdent, SimVar.GetSimVarValue("HSI STATION IDENT", "string"));
        diffAndSetText(this.xpdrCode, ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4));
        let xpdrState = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        switch (xpdrState) {
            case 0:
                diffAndSetText(this.xpdrMode, "OFF");
                SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 1);
                break;
            case 1:
                diffAndSetText(this.xpdrMode, "STBY");
                break;
            case 2:
                diffAndSetText(this.xpdrMode, "TEST");
                break;
            case 3:
                diffAndSetText(this.xpdrMode, "ON");
                break;
            case 4:
                diffAndSetText(this.xpdrMode, "ALT");
                break;
        }
        let nextWaypoint = this.gps.currFlightPlanManager.getActiveWaypoint(true);
        if (nextWaypoint) {
            diffAndSetText(this.wpt, nextWaypoint.ident);
            diffAndSetText(this.brg, fastToFixed(this.gps.currFlightPlanManager.getBearingToActiveWaypoint(true), 0) + "°m");
            diffAndSetText(this.dist, this.gps.currFlightPlanManager.getDistanceToActiveWaypoint().toFixed(1) + "nm");
            var ete = this.gps.currFlightPlanManager.getETEToActiveWaypoint();
            diffAndSetText(this.ete, ete >= 60 * 60 ? Math.floor(ete / 3600) + ":" + ((ete % 3600 / 60) < 10 ? "0" : "") + Math.floor(ete % 3600 / 60) : Math.floor(ete / 60) + ":" + (ete % 60 < 10 ? "0" : "") + ete % 60);
        }
        else {
            diffAndSetText(this.wpt, "____");
            diffAndSetText(this.brg, "___°m");
            diffAndSetText(this.dist, "__._nm");
            diffAndSetText(this.ete, "__:__");
        }
        diffAndSetText(this.gs, fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), 1) + "kt");
        diffAndSetText(this.trk, fastToFixed(SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degrees"), 0) + "°m");
        diffAndSetAttribute(this.identButton_Status, "state", (SimVar.GetSimVarValue("TRANSPONDER IDENT:1", "bool")) ? "Active" : "Inactive");
    }
    onExit() {
    }
    onEvent(_event) {
    }
    switchFullSplit() {
        this.gps.switchHalfFull();
    }
    updateFullSplitButton() {
        if (this.fullSplitButon_title) {
            this.fullSplitButon_title.innerText = this.gps.isSplit() ? "Full" : "Split";
        }
    }
    ident() {
        SimVar.SetSimVarValue("K:XPNDR_IDENT_ON", "bool", true);
    }
}
class AS3X_Touch_Transponder extends NavSystemTouch_Transponder {
    init(root) {
        super.init(root);
        this.cancelTouch = this.gps.getChildById("transponder_Cancel");
        this.enterTouch = this.gps.getChildById("transponder_Enter");
        this.gps.makeButton(this.cancelTouch, this.cancelCode.bind(this));
        this.gps.makeButton(this.enterTouch, this.validateCode.bind(this));
    }
}
class AS3X_Touch_MapContainer extends NavSystemElement {
    constructor(_containerId) {
        super();
        this.containerId = _containerId;
    }
    init(root) {
        this.mapContainerElement = this.gps.getChildById(this.containerId);
    }
    onEnter() {
        this.mapContainerElement.appendChild(this.gps.mfdMapElement);
        this.gps.mfdMapMapElement.resize();
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS3X_Touch_Map extends MapInstrumentElement {
    init(root) {
        super.init(root);
        this.mapPlus = root.querySelector(".mapPlus");
        this.mapLess = root.querySelector(".mapLess");
        this.mapCenter = root.querySelector(".mapCenter");
        this.gps.makeButton(this.mapPlus, this.instrument.onEvent.bind(this.instrument, "RANGE_DEC"));
        this.gps.makeButton(this.mapLess, this.instrument.onEvent.bind(this.instrument, "RANGE_INC"));
        this.gps.makeButton(this.mapCenter, this.centerOnPlane.bind(this));
        this.instrument.addEventListener("mousedown", this.moveMode.bind(this));
        this.instrument.supportMouseWheel(false);
    }
    moveMode(_event) {
        if (_event.button == 0) {
            diffAndSetAttribute(this.instrument, "bing-mode", "vfr");
            diffAndSetAttribute(this.mapCenter, "state", "Active");
        }
    }
    centerOnPlane() {
        this.instrument.setCenteredOnPlane();
        diffAndSetAttribute(this.mapCenter, "state", "Inactive");
    }
}
class AS3X_Touch_PageMenu_Button {
}
class AS3X_Touch_Popup extends NavSystemElement {
    init(root) {
        this.root = root;
    }
    onEnter() {
        diffAndSetAttribute(this.root, "state", "Active");
    }
    onUpdate() {
        super.onUpdate();
    }
    onExit() {
        diffAndSetAttribute(this.root, "state", "Inactive");
    }
    onEvent(_event) {
    }
}
class AS3X_Touch_AFCSMenu extends AS3X_Touch_Popup {
    init(root) {
        super.init(root);
        this.MasterButton = this.gps.getChildById("AFCS_AP_Master");
        this.FdButton = this.gps.getChildById("AFCS_FD_Button");
        this.YdButton = this.gps.getChildById("AFCS_YD_Button");
        this.LvlButton = this.gps.getChildById("AFCS_LVL_Button");
        this.HdgButton = this.gps.getChildById("AFCS_HDG_Button");
        this.NavButton = this.gps.getChildById("AFCS_NAV_Button");
        this.ApprButton = this.gps.getChildById("AFCS_APPR_Button");
        this.IasButton = this.gps.getChildById("AFCS_IAS_Button");
        this.AltButton = this.gps.getChildById("AFCS_ALT_Button");
        this.VsButton = this.gps.getChildById("AFCS_VS_Button");
        this.UpButton = this.gps.getChildById("AFCS_UP_Button");
        this.DnButton = this.gps.getChildById("AFCS_DN_Button");
        this.gps.makeButton(this.MasterButton, () => { this.buttonToggle("K:AP_MASTER") });
        this.gps.makeButton(this.FdButton, () => { this.buttonToggle("K:TOGGLE_FLIGHT_DIRECTOR") });
        this.gps.makeButton(this.YdButton, () => { this.buttonToggle("K:YAW_DAMPER_TOGGLE") });
        this.gps.makeButton(this.LvlButton, () => { this.buttonToggle("K:AP_WING_LEVELER") });
        this.gps.makeButton(this.HdgButton, () => { this.buttonToggle("K:AP_HDG_HOLD") });
        this.gps.makeButton(this.NavButton, () => { this.buttonToggle("K:AP_NAV1_HOLD") });
        this.gps.makeButton(this.ApprButton, () => { this.buttonToggle("K:AP_APR_HOLD") });
        this.gps.makeButton(this.IasButton, () => { this.buttonToggle("K:FLIGHT_LEVEL_CHANGE") });
        this.gps.makeButton(this.AltButton, () => { this.buttonToggle("K:AP_ALT_HOLD") });
        this.gps.makeButton(this.VsButton, () => { this.buttonToggle("K:AP_VS_HOLD") });
        this.gps.makeButton(this.UpButton, () => { this.buttonUpDn("UP") });
        this.gps.makeButton(this.DnButton, () => { this.buttonUpDn("DN") });
    }
    onUpdate() {
        this.MasterButton.setAttribute("state", (SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool") ? "Active" : ""));
        this.FdButton.setAttribute("state", (SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE", "Bool") ? "Active" : ""));
        this.YdButton.setAttribute("state", (SimVar.GetSimVarValue("AUTOPILOT YAW DAMPER", "Bool") ? "Active" : ""));
        this.LvlButton.setAttribute("state", (SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Bool") ? "Active" : ""));
        this.HdgButton.setAttribute("state", (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool") ? "Active" : ""));
        this.NavButton.setAttribute("state", (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Bool") ? "Active" : ""));
        this.ApprButton.setAttribute("state", (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Bool") ? "Active" : ""));
        this.IasButton.setAttribute("state", (SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "Bool") ? "Active" : ""));
        this.AltButton.setAttribute("state", (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Bool") ? "Active" : ""));
        this.VsButton.setAttribute("state", (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Bool") ? "Active" : ""));
    }
    buttonToggle(simvar) {
        SimVar.SetSimVarValue(simvar, "number", 0)
    }
    buttonUpDn(dir) {
        if (SimVar.GetSimVarValue("A:AUTOPILOT VERTICAL HOLD", "bool")) {
            var cmds = { "UP": "K:AP_VS_VAR_INC", "DN": "K:AP_VS_VAR_DEC" }
        } else if (SimVar.GetSimVarValue("A:AUTOPILOT FLIGHT LEVEL CHANGE", "bool")) {
            var cmds = { "UP": "K:AP_SPD_VAR_DEC", "DN": "K:AP_SPD_VAR_INC" }
        } else if (SimVar.GetSimVarValue("A:AUTOPILOT PITCH HOLD", "bool")) {
            var cmds = { "UP": "K:PITCH_REF_INC_UP", "DN": "K:PITCH_REF_INC_DN" }
        } else {
            var cmds = {}
        }
        if (dir in cmds) this.buttonToggle(cmds[dir]);
    }
}
class AS3X_Touch_PageMenu extends AS3X_Touch_Popup {
    init(root) {
        super.init(root);
        this.buttons = [];
        this.menuElements = root.getElementsByClassName("menuElements")[0];
    }
    onEnter() {
        super.onEnter();
        diffAndSetAttribute(this.root, "state", "Active");
        let pageGroup = this.gps.getCurrentPageGroup();
        for (let i = 0; i < (pageGroup.pages.length + pageGroup.additionalMenuButtons.length); i++) {
            if (i >= this.buttons.length) {
                let button = new AS3X_Touch_PageMenu_Button();
                this.buttons.push(button);
                button.base = document.createElement("div");
                diffAndSetAttribute(button.base, "class", "gradientButton");
                button.image = document.createElement("img");
                diffAndSetAttribute(button.image, "class", "img");
                button.title = document.createElement("div");
                diffAndSetAttribute(button.title, "class", "title");
                button.base.appendChild(button.image);
                button.base.appendChild(button.title);
                this.menuElements.appendChild(button.base);
                this.gps.makeButton(button.base, this.switchToPage.bind(this, i));
            }
            else {
                diffAndSetStyle(this.buttons[i].base, StyleProperty.display, "");
            }
            if (i < pageGroup.pages.length) {
                diffAndSetAttribute(this.buttons[i].image, "src", pageGroup.pages[i].imagePath);
                diffAndSetText(this.buttons[i].title, pageGroup.pages[i].name);
            }
            else {
                if (pageGroup.additionalMenuButtons[i - pageGroup.pages.length].fullTactileOnly && !this.gps.tactileOnly) {
                    diffAndSetStyle(this.buttons[i].base, StyleProperty.display, "none");
                }
                else {
                    diffAndSetAttribute(this.buttons[i].image, "src", pageGroup.additionalMenuButtons[i - pageGroup.pages.length].imagePath);
                    diffAndSetText(this.buttons[i].title, pageGroup.additionalMenuButtons[i - pageGroup.pages.length].name);
                }
            }
        }
        for (let i = pageGroup.pages.length + pageGroup.additionalMenuButtons.length; i < this.buttons.length; i++) {
            diffAndSetStyle(this.buttons[i].base, StyleProperty.display, "none");
        }
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
        diffAndSetAttribute(this.root, "state", "Inactive");
    }
    onEvent(_event) {
    }
    switchToPage(i) {
        let pageGroup = this.gps.getCurrentPageGroup();
        if (i < pageGroup.pages.length) {
            this.gps.closePopUpElement();
            this.gps.getCurrentPageGroup().goToPage(this.gps.getCurrentPageGroup().pages[i].name);
            this.gps.forceSplit(true);
        }
        else {
            pageGroup.additionalMenuButtons[i - pageGroup.pages.length].callback();
        }
    }
}
class AS3X_Touch_FullKeyboard extends NavSystemTouch_FullKeyboard {
    init(_root) {
        super.init(_root);
        this.cancelButton = this.gps.getChildById("FK_Cancel");
        this.enterButton = this.gps.getChildById("FK_Enter");
        this.gps.makeButton(this.cancelButton, this.cancel.bind(this));
        this.gps.makeButton(this.enterButton, this.validate.bind(this));
    }
    setContext(_endCallback, _types = "AVNW") {
        super.setContext(_endCallback, _types);
        this.lastPopUp = this.gps.popUpElement;
    }
    cancel() {
        this.gps.closePopUpElement();
    }
    validate() {
        let nbMatched = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchMatchedIcaosNumber", "number", this.gps.instrumentIdentifier);
        if (nbMatched > 1) {
            this.gps.duplicateWaypointSelection.element.setContext(this.endCallback, this.lastPopUp);
            this.gps.closePopUpElement();
            this.gps.switchToPopUpPage(this.gps.duplicateWaypointSelection);
        }
        else {
            this.endCallback(SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcao", "string", this.gps.instrumentIdentifier));
            this.gps.closePopUpElement();
            if (this.lastPopUp) {
                this.gps.switchToPopUpPage(this.lastPopUp);
            }
        }
        return true;
    }
}
class AS3X_Touch_DuplicateWaypointSelection extends NavSystemTouch_DuplicateWaypointSelection {
    constructor() {
        super(...arguments);
        this.lastPopup = null;
    }
    setContext(_endCallback, _lastPopUp = null) {
        super.setContext(_endCallback);
        this.lastPopup = _lastPopUp;
    }
    onButtonClick(_index) {
        super.onButtonClick(_index);
        this.gps.closePopUpElement();
        if (this.lastPopup) {
            this.gps.switchToPopUpPage(this.lastPopup);
        }
    }
}
class AS3X_Touch_elevatorTrim extends NavSystemElement {
    init(root) {
        this.element = root.getElementsByTagName("glasscockpit-elevator-trim")[0];
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        diffAndSetAttribute(this.element, "trim", (SimVar.GetSimVarValue("ELEVATOR TRIM PCT", "percent") / 100) + '');
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS3X_Touch_MenuButton {
    constructor(_name, _imagePath, _callback, _fullTactileOnly = false) {
        this.fullTactileOnly = false;
        this.imagePath = _imagePath;
        this.name = _name;
        this.callback = _callback;
        this.fullTactileOnly = _fullTactileOnly;
    }
}
class AS3X_Touch_PageGroup extends NavSystemPageGroup {
    constructor(_name, _gps, _pages, _additionalButtons = []) {
        super(_name, _gps, _pages);
        this.additionalMenuButtons = [];
        this.additionalMenuButtons = _additionalButtons;
    }
}
class AS3X_Touch_NavSystemPage extends NavSystemPage {
    constructor(_name, _htmlElemId, _element, _shortName, _imagePath) {
        super(_name, _htmlElemId, _element);
        this.shortName = _shortName;
        this.imagePath = _imagePath;
    }
}
class AS3X_Touch_DirectTo extends NavSystemTouch_DirectTo {
    init(_root) {
        super.init(_root);
        this.window = _root;
    }
    onEnter() {
        super.onEnter();
        diffAndSetAttribute(this.window, "state", "Active");
    }
    onExit() {
        super.onExit();
        diffAndSetAttribute(this.window, "state", "Inactive");
    }
    openKeyboard() {
        this.gps.fullKeyboard.getElementOfType(AS3X_Touch_FullKeyboard).setContext(this.endKeyboard.bind(this));
        this.gps.switchToPopUpPage(this.gps.fullKeyboard);
    }
    back() {
        this.gps.closePopUpElement();
    }
}
class AS3X_Touch_PFD_Menu extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.timerStartTime = -1;
        this.isTimerOn = false;
        this.pauseTime = 0;
        this.syntheticVision = WTDataStore.get("Attitude.SyntheticVision", false);
    }
    init(root) {
        this.window = root;
        this.cdiSource = this.gps.getChildById("cdi_source_Button");
        this.leftBearing = this.gps.getChildById("left_bearing_button");
        this.rightBearing = this.gps.getChildById("right_bearing_button");
        this.timerStartStop = this.gps.getChildById("timer_startStop_button");
        this.timerReset = this.gps.getChildById("timer_reset_button");
        this.moreOptions = this.gps.getChildById("PFD_moreOptionsButton");
        this.moreOptions_Window = this.gps.getChildById("PFD_moreOptionsWindow");
        this.moreOptions_Back = this.gps.getChildById("PFD_moreOptions_backButton");
        this.moreOptions_SyntheticVision = this.gps.getChildById("syntheticTerrain_button");
        this.moreOptions_SyntheticVision_Status = this.moreOptions_SyntheticVision.getElementsByClassName("statusBar")[0];
        this.moreOptions_WindMode = this.gps.getChildById("windSelection_button");
        this.moreOptions_WindMode_Status = this.moreOptions_WindMode.getElementsByClassName("value")[0];
        this.moreOptions_WindMode_SpeedDir = this.gps.getChildById("windSelection_SpeedDir_button");
        this.moreOptions_WindMode_HeadXWind = this.gps.getChildById("windSelection_HeadXWind_button");
        this.moreOptions_WindMode_Off = this.gps.getChildById("windSelection_Off_button");
        this.moreOptions_WindMode_Window = this.gps.getChildById("windSelection_window");
        this.cdiSource_value = this.cdiSource.getElementsByClassName("mainText")[0];
        this.leftBearing_value = this.leftBearing.getElementsByClassName("mainText")[0];
        this.rightBearing_value = this.rightBearing.getElementsByClassName("mainText")[0];
        this.timerStartStop_value = this.timerStartStop.getElementsByClassName("value")[0];
        this.timerStartStop_action = this.timerStartStop.getElementsByClassName("topTitle")[0];
        this.timerReset_value = this.timerReset.getElementsByClassName("mainText")[0];
        this.hsi = this.gps.getChildById("Compass");
        this.syntheticVisionElement = this.gps.getChildById("SyntheticVision");
        this.gps.makeButton(this.cdiSource, this.gps.computeEvent.bind(this.gps, "SoftKey_CDI"));
        this.gps.makeButton(this.leftBearing, this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_BRG1"));
        this.gps.makeButton(this.rightBearing, this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_BRG2"));
        this.gps.makeButton(this.timerStartStop, this.timer_Toggle.bind(this));
        this.gps.makeButton(this.timerReset, this.timer_Reset.bind(this));
        this.gps.makeButton(this.moreOptions, this.openMoreOptions.bind(this));
        this.gps.makeButton(this.moreOptions_Back, this.closeMoreOptions.bind(this));
        this.gps.makeButton(this.moreOptions_SyntheticVision, this.toggleSyntheticVision.bind(this));
        this.gps.makeButton(this.moreOptions_WindMode, this.openWindModeOptions.bind(this));
        this.gps.makeButton(this.moreOptions_WindMode_SpeedDir, this.switchToWindMode.bind(this, 3));
        this.gps.makeButton(this.moreOptions_WindMode_HeadXWind, this.switchToWindMode.bind(this, 1));
        this.gps.makeButton(this.moreOptions_WindMode_Off, this.switchToWindMode.bind(this, 0));
        diffAndSetAttribute(this.moreOptions_SyntheticVision_Status, "state", (this.syntheticVision ? "Active" : "Inactive"));
    }
    onEnter() {
        diffAndSetAttribute(this.window, "state", "Active");
        this.closeMoreOptions();
    }
    onUpdate(_deltaTime) {
        diffAndSetText(this.cdiSource_value, this.hsi.getAttribute("nav_source"));
        if (this.hsi && this.hsi.getAttribute("show_bearing1") == "true") {
            diffAndSetText(this.leftBearing_value, this.hsi.getAttribute("bearing1_source"));
        }
        else {
            diffAndSetText(this.leftBearing_value, "Off");
        }
        if (this.hsi && this.hsi.getAttribute("show_bearing2") == "true") {
            diffAndSetText(this.rightBearing_value, this.hsi.getAttribute("bearing2_source"));
        }
        else {
            diffAndSetText(this.rightBearing_value, "Off");
        }
        diffAndSetText(this.timerStartStop_value, this.getTimerValue());
        let windMode = SimVar.GetSimVarValue("L:Glasscockpit_Wind_Mode", "number");
        switch (windMode) {
            case 0:
                diffAndSetText(this.moreOptions_WindMode_Status, "Off");
                break;
            case 1:
                diffAndSetText(this.moreOptions_WindMode_Status, "Head/X-Wind");
                break;
            case 2:
                diffAndSetText(this.moreOptions_WindMode_Status, "Off");
                break;
            case 3:
                diffAndSetText(this.moreOptions_WindMode_Status, "Speed/Dir");
                break;
        }
    }
    getTimerValue() {
        if (this.timerStartTime == -1) {
            return "00:00:00";
        }
        else {
            let time;
            if (this.isTimerOn) {
                time = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds") - this.timerStartTime;
            }
            else {
                time = this.pauseTime - this.timerStartTime;
            }
            let seconds = Math.floor(time % 60);
            let minutes = Math.floor((time / 60) % 60);
            let hours = Math.floor(Math.min(time / 3600, 99));
            return (hours < 10 ? "0" : "") + hours + (minutes < 10 ? ":0" : ":") + minutes + (seconds < 10 ? ":0" : ":") + seconds;
        }
    }
    onExit() {
        diffAndSetAttribute(this.window, "state", "Inactive");
    }
    onEvent(_event) {
    }
    timer_Toggle() {
        if (this.isTimerOn) {
            this.isTimerOn = false;
            diffAndSetText(this.timerStartStop_action, "Start");
            this.pauseTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds");
        }
        else {
            if (this.timerStartTime == -1) {
                this.timerStartTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds");
            }
            else {
                this.timerStartTime = this.timerStartTime + SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds") - this.pauseTime;
            }
            this.isTimerOn = true;
            diffAndSetText(this.timerStartStop_action, "Stop");
        }
    }
    timer_Reset() {
        this.timerStartTime = -1;
        this.pauseTime = 0;
        this.isTimerOn = false;
        diffAndSetText(this.timerStartStop_action, "Start");
    }
    openMoreOptions() {
        diffAndSetAttribute(this.moreOptions_Window, "state", "Active");
    }
    closeMoreOptions() {
        diffAndSetAttribute(this.moreOptions_Window, "state", "Inactive");
    }
    toggleSyntheticVision() {
        this.syntheticVision = !this.syntheticVision;
        let attitude = this.gps.getElementOfType(PFD_Attitude);
        if (attitude) {
            attitude.setSyntheticVisionEnabled(this.syntheticVision);
            // diffAndSetAttribute(attitude.svg, "background", (this.syntheticVision ? "false" : "true"));
        }
        if (this.syntheticVisionElement) {
            diffAndSetStyle(this.syntheticVisionElement, StyleProperty.display, (this.syntheticVision ? "Block" : "None"));
        }
        diffAndSetAttribute(this.moreOptions_SyntheticVision_Status, "state", (this.syntheticVision ? "Active" : "Inactive"));
        SimVar.SetSimVarValue("L:Glasscockpit_SVTTerrain", "number", (this.syntheticVision ? 1 : 0));
    }
    openWindModeOptions() {
        diffAndSetAttribute(this.moreOptions_WindMode_Window, "state", "active");
    }
    switchToWindMode(_mode) {
        diffAndSetAttribute(this.moreOptions_WindMode_Window, "state", "Inactive");
        switch (_mode) {
            case 0:
                this.gps.computeEvent("Wind_Off");
                break;
            case 1:
                this.gps.computeEvent("Wind_O1");
                break;
            case 2:
                this.gps.computeEvent("Wind_O2");
                break;
            case 3:
                this.gps.computeEvent("Wind_O3");
                break;
        }
    }
}
class AS3X_Touch_NRST_Airport extends NavSystemTouch_NRST_Airport {
    directTo() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearestAirports.airports[this.selectedElement].icao;
            diffAndSetAttribute(this.menu, "state", "Inactive");
            diffAndSetAttribute(this.airportLines[this.selectedElement].identButton, "state", "None");
            this.selectedElement = -1;
        }
        this.gps.computeEvent("DirectTo_Push");
    }
    insertInFpl() {
        this.gps.insertBeforWaypointWindow.getElementOfType(AS3X_Touch_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforWaypointWindow);
    }
}
class AS3X_Touch_NRST_NDB extends NavSystemTouch_NRST_NDB {
    directTo() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearest.ndbs[this.selectedElement].icao;
            diffAndSetAttribute(this.menu, "state", "Inactive");
            diffAndSetAttribute(this.lines[this.selectedElement].identButton, "state", "None");
            this.selectedElement = -1;
        }
        this.gps.computeEvent("DirectTo_Push");
    }
    insertInFpl() {
        this.gps.insertBeforWaypointWindow.getElementOfType(AS3X_Touch_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforWaypointWindow);
    }
}
class AS3X_Touch_NRST_VOR extends NavSystemTouch_NRST_VOR {
    directTo() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearest.vors[this.selectedElement].icao;
            diffAndSetAttribute(this.menu, "state", "Inactive");
            diffAndSetAttribute(this.lines[this.selectedElement].identButton, "state", "None");
            this.selectedElement = -1;
        }
        this.gps.computeEvent("DirectTo_Push");
    }
    insertInFpl() {
        this.gps.insertBeforWaypointWindow.getElementOfType(AS3X_Touch_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforWaypointWindow);
    }
}
class AS3X_Touch_NRST_Intersection extends NavSystemTouch_NRST_Intersection {
    directTo() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearest.intersections[this.selectedElement].icao;
            diffAndSetAttribute(this.menu, "state", "Inactive");
            diffAndSetAttribute(this.lines[this.selectedElement].identButton, "state", "None");
            this.selectedElement = -1;
        }
        this.gps.computeEvent("DirectTo_Push");
    }
    insertInFpl() {
        this.gps.insertBeforWaypointWindow.getElementOfType(AS3X_Touch_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforWaypointWindow);
    }
}
class AS3X_Touch_WaypointButtonElement {
    constructor() {
        this.base = window.document.createElement("div");
        diffAndSetAttribute(this.base, "class", "line");
        {
            this.button = window.document.createElement("div");
            diffAndSetAttribute(this.button, "class", "gradientButton");
            {
                this.ident = window.document.createElement("div");
                diffAndSetAttribute(this.ident, "class", "mainValue");
                this.button.appendChild(this.ident);
                this.name = window.document.createElement("div");
                diffAndSetAttribute(this.name, "class", "title");
                this.button.appendChild(this.name);
                this.symbol = window.document.createElement("img");
                diffAndSetAttribute(this.symbol, "class", "symbol");
                this.button.appendChild(this.symbol);
            }
            this.base.appendChild(this.button);
        }
    }
}
class AS3X_Touch_InsertBeforeWaypoint extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.elements = [];
    }
    init(root) {
        this.window = root;
        this.tableContainer = root.getElementsByClassName("Container")[0];
        this.table = this.tableContainer.getElementsByClassName("WayPoints")[0];
        this.endButtonLine = this.table.getElementsByClassName("EndButtonLine")[0];
        this.endButton = this.gps.getChildById("EndButton");
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.tableContainer;
        this.scrollElement.elementSize = (this.elements.length > 0 ? this.elements[1].base.getBoundingClientRect().height : 0);
        this.gps.makeButton(this.endButton, this.endButtonClick.bind(this));
    }
    onEnter() {
        diffAndSetAttribute(this.window, "state", "Active");
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = (this.elements.length > 0 ? this.elements[1].base.getBoundingClientRect().height : 0);
        }
        this.scrollElement.update();
        for (let i = 0; i < this.gps.currFlightPlanManager.getWaypointsCount(); i++) {
            if (this.elements.length < i + 1) {
                let newElem = new AS3X_Touch_WaypointButtonElement();
                this.gps.makeButton(newElem.button, this.elementClick.bind(this, i));
                this.table.insertBefore(newElem.base, this.endButtonLine);
                this.elements.push(newElem);
            }
            let infos = this.gps.currFlightPlanManager.getWaypoint(i).infos;
            diffAndSetText(this.elements[i].ident, infos.ident);
            diffAndSetText(this.elements[i].name, infos.name);
            let symbol = infos.imageFileName();
            diffAndSetAttribute(this.elements[i].symbol, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
        }
        for (let i = this.gps.currFlightPlanManager.getWaypointsCount(); i < this.elements.length; i++) {
            diffAndSetAttribute(this.elements[i].base, "state", "Inactive");
        }
    }
    onExit() {
        diffAndSetAttribute(this.window, "state", "Inactive");
    }
    onEvent(_event) {
    }
    setContext(_endCallback) {
        this.endCallback = _endCallback;
    }
    elementClick(_index) {
        if (this.endCallback) {
            this.endCallback(_index);
        }
        this.gps.closePopUpElement();
    }
    endButtonClick() {
        this.elementClick(this.elements.length);
    }
}
class AS3X_Touch_FrequencyKeyboard extends NavSystemTouch_FrequencyKeyboard {
    init(_root) {
        super.init(_root);
        this.enterButton = _root.querySelector("#FK_Enter");
        this.cancelButton = _root.querySelector("#FK_Cancel");
        this.gps.makeButton(this.enterButton, this.validateEdit.bind(this));
        this.gps.makeButton(this.cancelButton, this.cancelEdit.bind(this));
    }
    cancelEdit() {
        this.gps.closePopUpElement();
    }
    validateEdit() {
        this.endCallback(this.inputIndex != -1 ? this.currentInput : SimVar.GetSimVarValue(this.stbyFreqSimVar, "Hz"), false);
        this.cancelEdit();
    }
    validateAndTransferEdit() {
        this.endCallback(this.inputIndex != -1 ? this.currentInput : SimVar.GetSimVarValue(this.stbyFreqSimVar, "Hz"), true);
        this.inputIndex = -1;
    }
}
class AS3X_Touch_AudioPanel extends NavSystemElement {
    init(root) {
        this.root = root;
        this.com1 = this.gps.getChildById("AudioPanel_Com1");
        this.com2 = this.gps.getChildById("AudioPanel_Com2");
        this.com1Mic = this.gps.getChildById("AudioPanel_Com1Mic");
        this.com2Mic = this.gps.getChildById("AudioPanel_Com2Mic");
        this.nav1 = this.gps.getChildById("AudioPanel_Nav1");
        this.nav2 = this.gps.getChildById("AudioPanel_Nav2");
        this.speaker = this.gps.getChildById("AudioPanel_Speaker");
        this.gps.makeButton(this.com1, this.com1PushButton.bind(this));
        this.gps.makeButton(this.com2, this.com2PushButton.bind(this));
        this.gps.makeButton(this.com1Mic, this.com1MicPushButton.bind(this));
        this.gps.makeButton(this.com2Mic, this.com2MicPushButton.bind(this));
        this.gps.makeButton(this.nav1, this.nav1PushButton.bind(this));
        this.gps.makeButton(this.nav2, this.nav2PushButton.bind(this));
        this.gps.makeButton(this.speaker, this.speakerPushButton.bind(this));
    }
    com1PushButton() {
        SimVar.SetSimVarValue("K:COM1_RECEIVE_SELECT", "Bool", SimVar.GetSimVarValue("COM RECEIVE:1", "Bool") != 0 ? 0 : 1);
    }
    com2PushButton() {
        SimVar.SetSimVarValue("K:COM2_RECEIVE_SELECT", "Bool", SimVar.GetSimVarValue("COM RECEIVE:2", "Bool") != 0 ? 0 : 1);
    }
    com1MicPushButton() {
        SimVar.SetSimVarValue("K:PILOT_TRANSMITTER_SET", "number", 0);
        SimVar.SetSimVarValue("K:COPILOT_TRANSMITTER_SET", "number", 0);
    }
    com2MicPushButton() {
        SimVar.SetSimVarValue("K:PILOT_TRANSMITTER_SET", "number", 1);
        SimVar.SetSimVarValue("K:COPILOT_TRANSMITTER_SET", "number", 1);
    }
    nav1PushButton() {
        SimVar.SetSimVarValue("K:RADIO_VOR1_IDENT_TOGGLE", "number", 0);
    }
    nav2PushButton() {
        SimVar.SetSimVarValue("K:RADIO_VOR2_IDENT_TOGGLE", "number", 0);
    }
    speakerPushButton() {
        SimVar.SetSimVarValue("K:TOGGLE_SPEAKER", "number", 0);
    }
    onEnter() {
        diffAndSetAttribute(this.root, "state", "Active");
    }
    onUpdate(_deltaTime) {
        diffAndSetAttribute(this.com1, "state", SimVar.GetSimVarValue("COM RECEIVE:1", "bool") ? "Active" : "");
        diffAndSetAttribute(this.com2, "state", SimVar.GetSimVarValue("COM RECEIVE:2", "bool") ? "Active" : "");
        diffAndSetAttribute(this.com1Mic, "state", SimVar.GetSimVarValue("COM TRANSMIT:1", "bool") ? "Active" : "");
        diffAndSetAttribute(this.com2Mic, "state", SimVar.GetSimVarValue("COM TRANSMIT:2", "bool") ? "Active" : "");
        diffAndSetAttribute(this.nav1, "state", SimVar.GetSimVarValue("NAV SOUND:1", "bool") ? "Active" : "");
        diffAndSetAttribute(this.nav2, "state", SimVar.GetSimVarValue("NAV SOUND:2", "bool") ? "Active" : "");
        diffAndSetAttribute(this.speaker, "state", SimVar.GetSimVarValue("SPEAKER ACTIVE", "bool") ? "Active" : "");
    }
    onExit() {
        diffAndSetAttribute(this.root, "state", "Inactive");
    }
    onEvent(_event) {
    }
}
class AS3X_Touch_Setup_Display extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.isCursorMoving = true;
        this.cursorStartVH = 18;
        this.cursorBGWidthVH = 40;
    }
    init(root) {
        this.masterPercentText = this.gps.getChildById("LightingMasterValue");
        this.masterBG = this.gps.getChildById("MasterBacklightBgSVG");
        this.masterBGTriangle = this.gps.getChildById("MasterBacklightTriangle");
        this.masterCursor = this.gps.getChildById("MasterBacklightCursorSVG");
        this.buttonLess = this.gps.getChildById("LightingMasterLess");
        this.buttonMore = this.gps.getChildById("LightingMasterMore");
        this.buttonMode = this.gps.getChildById("MasterBrightnessMode");
        this.buttonMode_Value = this.buttonMode.getElementsByClassName("mainText")[0];
        this.buttonAuto = this.gps.getChildById("MasterBrightnessMode_Photocell");
        this.buttonManual = this.gps.getChildById("MasterBrightnessMode_Manual");
        this.modePopup = this.gps.getChildById("MasterBrightnessMode_Popup");
        this.gps.makeButton(this.buttonLess, this.onLessPress.bind(this));
        this.gps.makeButton(this.buttonMore, this.onMorePress.bind(this));
        this.gps.makeButton(this.buttonMode, this.openModePopup.bind(this));
        this.gps.makeButton(this.buttonAuto, this.switchToAuto.bind(this));
        this.gps.makeButton(this.buttonManual, this.switchToManual.bind(this));
        if (this.masterCursor.hasAttribute("beginvh")) {
            this.cursorStartVH = parseFloat(this.masterCursor.getAttribute("beginvh"));
        }
        if (this.masterCursor.hasAttribute("animwidthvh")) {
            this.cursorBGWidthVH = parseFloat(this.masterCursor.getAttribute("animwidthvh"));
        }
        this.masterCursor.addEventListener("mousedown", this.cursorMouseDown.bind(this));
        root.addEventListener("mouseup", this.cursorMouseUp.bind(this));
        root.addEventListener("mouseleave", this.cursorMouseUp.bind(this));
        root.addEventListener("mousemove", this.mouseMove.bind(this));
    }
    onEnter() {
    }
    onExit() {
    }
    onEvent(_event) {
    }
    onUpdate(_deltaTime) {
        let manualBright = SimVar.GetSimVarValue("L:AS3X_Touch_Brightness_Manual", "number");
        let autoBright = SimVar.GetSimVarValue("L:AS3X_Touch_Brightness_Auto", "number");
        let isAuto = SimVar.GetSimVarValue("L:AS3X_Touch_Brightness_IsAUto", "number") == 1;
        let backLightValue = isAuto ? autoBright : manualBright;
        diffAndSetText(this.masterPercentText, fastToFixed((backLightValue * 100), 0));
        let length = backLightValue * 100;
        let height = backLightValue * 30;
        diffAndSetAttribute(this.masterBGTriangle, "points", "0,30 " + length + "," + (30 - height) + " " + length + ",30");
        diffAndSetAttribute(this.masterCursor, "state", isAuto ? "Greyed" : "");
        diffAndSetAttribute(this.buttonLess, "state", isAuto ? "Greyed" : "");
        diffAndSetAttribute(this.buttonMore, "state", isAuto ? "Greyed" : "");
        this.masterCursor.style.left = (this.cursorStartVH + (this.cursorBGWidthVH * backLightValue)) + "vh";
    }
    onLessPress() {
        if (SimVar.GetSimVarValue("L:AS3X_Touch_Brightness_IsAUto", "number") == 0) {
            SimVar.SetSimVarValue("L:AS3X_Touch_Brightness_Manual", "number", Math.max(0, Math.min(1, SimVar.GetSimVarValue("L:AS3X_Touch_Brightness_Manual", "number") - 0.01)));
        }
    }
    onMorePress() {
        if (SimVar.GetSimVarValue("L:AS3X_Touch_Brightness_IsAUto", "number") == 0) {
            SimVar.SetSimVarValue("L:AS3X_Touch_Brightness_Manual", "number", Math.max(0, Math.min(1, SimVar.GetSimVarValue("L:AS3X_Touch_Brightness_Manual", "number") + 0.01)));
        }
    }
    cursorMouseDown(event) {
        this.isCursorMoving = true;
        let clientRect = this.masterBG.getBoundingClientRect();
        this.leftX = clientRect.left;
        this.widthX = clientRect.width;
    }
    cursorMouseUp() {
        this.isCursorMoving = false;
    }
    mouseMove(event) {
        if (this.isCursorMoving && SimVar.GetSimVarValue("L:AS3X_Touch_Brightness_IsAUto", "number") == 0) {
            let pos = Math.max(0, Math.min(1, (event.clientX - this.leftX) / this.widthX));
            SimVar.SetSimVarValue("L:AS3X_Touch_Brightness_Manual", "number", pos);
        }
    }
    openModePopup() {
        diffAndSetAttribute(this.modePopup, "state", "Active");
    }
    switchToAuto() {
        diffAndSetAttribute(this.modePopup, "state", "Inactive");
        SimVar.SetSimVarValue("L:AS3X_Touch_Brightness_IsAUto", "number", 1);
        diffAndSetText(this.buttonMode_Value, "Photo Cell");
    }
    switchToManual() {
        diffAndSetAttribute(this.modePopup, "state", "Inactive");
        SimVar.SetSimVarValue("L:AS3X_Touch_Brightness_IsAUto", "number", 0);
        SimVar.SetSimVarValue("L:AS3X_Touch_Brightness_Manual", "number", SimVar.GetSimVarValue("L:AS3X_Touch_Brightness_AUto", "number"));
        diffAndSetText(this.buttonMode_Value, "Manual");
    }
}
class AS3X_Touch_Procedures extends NavSystemTouch_Procedures {
    openDeparture() {
        this.gps.switchToPopUpPage(this.gps.departureSelection);
    }
    openArrival() {
        this.gps.switchToPopUpPage(this.gps.arrivalSelection);
    }
    openApproach() {
        this.gps.switchToPopUpPage(this.gps.approachSelection);
    }
}
class AS3X_Touch_DepartureSelection extends NavSystemTouch_DepartureSelection {
    init(root) {
        super.init(root);
        this.root = root;
    }
    onEnter() {
        super.onEnter();
        diffAndSetAttribute(this.root, "state", "Active");
    }
    onExit() {
        super.onExit();
        diffAndSetAttribute(this.root, "state", "Inactive");
    }
    selectDeparture(_index) {
        super.selectDeparture(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    selectEnrouteTransition(_index) {
        super.selectEnrouteTransition(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    selectRunway(_index) {
        super.selectRunway(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    close() {
        this.gps.closePopUpElement();
    }
}
class AS3X_Touch_ArrivalSelection extends NavSystemTouch_ArrivalSelection {
    init(root) {
        super.init(root);
        this.root = root;
    }
    onEnter() {
        super.onEnter();
        diffAndSetAttribute(this.root, "state", "Active");
    }
    onExit() {
        super.onExit();
        diffAndSetAttribute(this.root, "state", "Inactive");
    }
    selectArrival(_index) {
        super.selectArrival(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    selectEnrouteTransition(_index) {
        super.selectEnrouteTransition(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    selectRunway(_index) {
        super.selectRunway(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    close() {
        this.gps.closePopUpElement();
    }
}
class AS3X_Touch_ApproachSelection extends NavSystemTouch_ApproachSelection {
    init(root) {
        super.init(root);
        this.root = root;
    }
    onEnter() {
        super.onEnter();
        diffAndSetAttribute(this.root, "state", "Active");
    }
    onExit() {
        super.onExit();
        diffAndSetAttribute(this.root, "state", "Inactive");
    }
    selectApproach(_index) {
        super.selectApproach(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    selectTransition(_index) {
        super.selectTransition(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    close() {
        this.gps.closePopUpElement();
    }
}
registerInstrument("as3x-touch-element", AS3X_Touch);
//# sourceMappingURL=AS3X_Touch.js.map