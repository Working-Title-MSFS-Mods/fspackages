class CJ4_PFD extends BaseAirliners {
    constructor() {
        super();
        this.isExtended = false;
        this.showTerrain = false;
        this.showWeather = false;
        this.mapDisplayMode = Jet_NDCompass_Display.ARC;
        this.previousMapDisplayMode = undefined;
        this.mapNavigationMode = Jet_NDCompass_Navigation.NAV;
        this.mapNavigationSource = 0;
        this.systemPage = CJ4_SystemPage.ANNUNCIATIONS;
        this.modeChangeTimer = -1;
        this.autoSwitchedToILS1 = false;
        this.radioSrc1 = "OFF";
        this.radioSrc2 = "OFF";
        this.initDuration = 7000;
        this._machAirpeed = undefined;
        this.isMachActive = undefined;
        this.MACH_SYNC_TIME = 1000;
        this._machSyncTimer = this.MACH_SYNC_TIME;
        this.fdMode = WTDataStore.get("CJ4_FD_MODE", 0);
    }
    get templateID() { return "CJ4_PFD"; }
    get IsGlassCockpit() { return true; }
    connectedCallback() {
        super.connectedCallback();
        RegisterViewListener("JS_LISTENER_KEYEVENT", () => {
            console.log("JS_LISTENER_KEYEVENT registered.");
        });
        this.radioNav.init(NavMode.TWO_SLOTS);
        this.horizon = new CJ4_HorizonContainer("Horizon", "PFD");
        this.systems = new CJ4_SystemContainer("System", "SystemInfos");
        this.map = new CJ4_MapContainer("Map", "NDMap");
        this.mapOverlay = new CJ4_MapOverlayContainer("Map", "NDMapOverlay");
        this.navBar = new CJ4_NavBarContainer("Nav", "NavBar");
        this.popup = new CJ4_PopupMenuContainer("Menu", "PopupMenu");
        this.addIndependentElementContainer(this.horizon);
        this.addIndependentElementContainer(this.systems);
        this.addIndependentElementContainer(this.map);
        this.addIndependentElementContainer(this.mapOverlay);
        this.addIndependentElementContainer(this.navBar);
        this.addIndependentElementContainer(this.popup);
        this.modeChangeMask = this.getChildById("ModeChangeMask");
        this.maxUpdateBudget = 12;
    }
    disconnectedCallback() {
        window.console.log("CJ4 PFD - destroyed");
        super.disconnectedCallback();
    }
    Init() {
        super.Init();
        this.radioNav.setRADIONAVSource(NavSource.GPS);
        SimVar.SetSimVarValue("L:WT_CJ4_VAP", "knots", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_PFD1_AOA", "Number", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_V1_SPEED", "knots", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_VR_SPEED", "knots", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_V2_SPEED", "knots", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_VT_SPEED", "knots", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_VREF_SPEED", "knots", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_LNAV_MODE", "number", this.mapNavigationSource);
        SimVar.SetSimVarValue("L:XMLVAR_Baro_Selector_HPA_1", "Bool", WTDataStore.get("CJ4_BARO_MODE", false));
        document.documentElement.classList.add("animationsEnabled");
    }
    reboot() {
        super.reboot();
        if (this.systems)
            this.systems.reboot();
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        this.reversionaryMode = false;
        if (document.body.hasAttribute("reversionary")) {
            var attr = document.body.getAttribute("reversionary");
            if (attr == "true") {
                this.reversionaryMode = true;
            }
        }
        if (this.allContainersReady()) {
            if (this.modeChangeMask && this.modeChangeTimer >= 0) {
                this.modeChangeTimer -= this.deltaTime / 1000;
                if (this.modeChangeTimer <= 0) {
                    this.modeChangeMask.style.display = "none";
                    this.modeChangeTimer = -1;
                }
            }
            let dict = this.popup.dictionary;
            if (dict.changed) {
                this.readDictionary(dict);
                dict.changed = false;
            }

            if (this.mapNavigationMode === Jet_NDCompass_Navigation.VOR) {
                const radioFix = this.radioNav.getVORBeacon(this.mapNavigationSource);
                if (radioFix.name && radioFix.name.indexOf("ILS") !== -1) {
                    this.mapNavigationMode = Jet_NDCompass_Navigation.ILS;
                }
            }


            // TODO: refactor VNAV alt to SVG          

            let isAltConstraint = (SimVar.GetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "number") > 0);
            let vnavAltEl = document.getElementById("VnavAlt");
            vnavAltEl.style.display = isAltConstraint ? "" : "none";
            if (isAltConstraint) {
                vnavAltEl.textContent = SimVar.GetSimVarValue("L:WT_CJ4_CONSTRAINT_ALTITUDE", "number").toFixed(0);
            }

            this.map.setMode(this.mapDisplayMode);
            this.mapOverlay.setMode(this.mapDisplayMode, this.mapNavigationMode, this.mapNavigationSource);

            //Hack to correct the map compass size until we separate it out
            //fully from the default shared code
            if (this.mapDisplayMode !== this.previousMapDisplayMode || this.mapNavigationSource !== this.previousMapNavigationSource) {
                const el = document.querySelector('#NDCompass svg');
                if (el) {
                    this.previousMapDisplayMode = this.mapDisplayMode;
                    this.previousMapNavigationSource = this.mapNavigationSource;

                    if (this.mapDisplayMode === Jet_NDCompass_Display.ROSE) {
                        el.setAttribute('width', '122%');
                        el.setAttribute('height', '122%');
                        el.style = 'transform: translate(-84px, -56px)';
                    }

                    if (this.mapDisplayMode === Jet_NDCompass_Display.ARC || this.mapDisplayMode === Jet_NDCompass_Display.PPOS) {
                        el.setAttribute('width', '108%');
                        el.setAttribute('height', '108%');
                        el.style = 'transform: translate(-30px, -18px)';
                    }
                }
                this.mapOverlay.infos.root.onDisplayChange(this.mapDisplayMode);
            }

            if (this.showTerrain) {
                this.map.showMap(true);

                if (this.mapDisplayMode === Jet_NDCompass_Display.ARC || this.mapDisplayMode === Jet_NDCompass_Display.ROSE) {
                    this.map.showRoute(false);
                    this.map.map.instrument.setAttribute('show-airplane', 'false');
                }
                else {
                    this.map.showRoute(true);
                    this.map.map.instrument.setAttribute('show-airplane', 'true');
                }

                this.map.showTerrain(true);
                this.mapOverlay.showTerrain(true);
            }
            else if (this.showWeather) {
                this.map.showMap(true);

                if (this.mapDisplayMode === Jet_NDCompass_Display.ARC || this.mapDisplayMode === Jet_NDCompass_Display.ROSE) {
                    this.map.showRoute(false);
                    this.map.map.instrument.setAttribute('show-airplane', 'false');
                }
                else {
                    this.map.showRoute(true);
                    this.map.map.instrument.setAttribute('show-airplane', 'true');
                }

                this.map.showWeather(true);
                this.mapOverlay.showWeather(true);
            }
            else {
                if (this.mapDisplayMode === Jet_NDCompass_Display.ARC || this.mapDisplayMode === Jet_NDCompass_Display.ROSE) {
                    this.map.showMap(false);
                    this.map.showRoute(false);

                    this.map.map.instrument.setAttribute('show-airplane', 'false');
                }
                else {
                    this.map.showMap(true);
                    this.map.showRoute(true);

                    this.map.map.instrument.setAttribute('show-airplane', 'true');
                }

                this.map.showTerrain(false);
                this.mapOverlay.showTerrain(false);
                this.map.showWeather(false);
                this.mapOverlay.showWeather(false);
            }
            if (this.isExtended) {
                this.map.setExtended(true);
                this.mapOverlay.setExtended(true);
                this.systems.show(this.systemPage);
                this.horizon.show(false);
            }
            else {
                this.map.setExtended(false);
                this.mapOverlay.setExtended(false);
                this.systems.show(CJ4_SystemPage.NONE);
                this.horizon.show(true);
            }
            this.mapOverlay.setRange(this.map.range);
        }

        const rangeSelectDisabled = WTDataStore.get('WT_CJ4_RANGE_SEL_DISABLED', 0);
        if (rangeSelectDisabled) {
            this.map.map.instrument.showAltitudeIntercept = false;
        }
        else {
            this.map.map.instrument.showAltitudeIntercept = true;
        }

        if (this.currFlightPlanManager.isActiveApproach() && this.currFlightPlanManager.getActiveWaypointIndex() != -1 && Simplane.getAutoPilotApproachType() == 4 && SimVar.GetSimVarValue("AUTOPILOT APPROACH ACTIVE", "boolean")) {
            if (this.radioNav.getRADIONAVSource() == NavSource.GPS) {
                this.radioNav.setRADIONAVSource(NavSource.VOR1);
                this.autoSwitchedToILS1 = true;
            }
        }
        else {
            if (this.autoSwitchedToILS1) {
                if (this.mapNavigationMode == Jet_NDCompass_Navigation.NAV) {
                    this.radioNav.setRADIONAVSource(NavSource.GPS);
                }
                else if (this.mapNavigationMode == Jet_NDCompass_Navigation.VOR && this.mapNavigationSource == 1) {
                    this.radioNav.setRADIONAVSource(NavSource.VOR1);
                }
                else if (this.mapNavigationMode == Jet_NDCompass_Navigation.VOR && this.mapNavigationSource == 2) {
                    this.radioNav.setRADIONAVSource(NavSource.VOR2);
                }
                this.autoSwitchedToILS1 = false;
            }
        }

        this.updateMachTransition(_deltaTime);
    }
    updateMachTransition(_deltaTime) {
        this._machSyncTimer -= _deltaTime;
        let cruiseMach = 0.64; // TODO: change this when cruise mach becomes settable
        // let cruiseMach = SimVar.GetGameVarValue("AIRCRAFT CRUISE MACH", "mach");
        let mach = Simplane.getMachSpeed();
        switch (this.machTransition) {
            case 0:
                if (mach >= cruiseMach) {
                    this.machTransition = 1;
                    SimVar.SetSimVarValue("L:XMLVAR_AirSpeedIsInMach", "bool", true);
                    SimVar.SetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number", 1);
                }
                break;
            case 1:
                if (mach < cruiseMach - 0.01) {
                    this.machTransition = 0;
                    SimVar.SetSimVarValue("L:XMLVAR_AirSpeedIsInMach", "bool", false);
                    SimVar.SetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number", 1);
                }
                break;
        }
        let isMachActive = SimVar.GetSimVarValue("L:XMLVAR_AirSpeedIsInMach", "bool");
        if (this.isMachActive != isMachActive) {
            this.isMachActive = isMachActive;
            if (isMachActive) {
                Coherent.call("AP_MACH_VAR_SET", 0, cruiseMach);
            }
            else {
                let knots = SimVar.GetGameVarValue("FROM MACH TO KIAS", "number", Simplane.getAutoPilotMachHoldValue());
                Coherent.call("AP_SPD_VAR_SET", 1, knots);
            }
            return true;
        } else {
            // DONT DELETE: mach mode fix
            const machAirspeed = Simplane.getAutoPilotMachHoldValue();
            if (this.isMachActive && this._machAirpeed == machAirspeed && this._machSyncTimer < 0) {
                this._machAirpeed = machAirspeed;
                Coherent.call("AP_MACH_VAR_SET", 0, machAirspeed);
                this._machSyncTimer = this.MACH_SYNC_TIME;
            }
            else {
                this._machAirpeed = machAirspeed;
            }
        }
        return false;
    }
    onEvent(_event) {
        switch (_event) {
            case "Upr_Push_NAV":
                if (this.mapNavigationMode == Jet_NDCompass_Navigation.NAV) {
                    this.radioNav.setRADIONAVSource(NavSource.VOR1);
                    this.mapNavigationMode = Jet_NDCompass_Navigation.VOR;
                    this.mapNavigationSource = 1;
                    this.onModeChanged();
                }
                else if ((this.mapNavigationMode == Jet_NDCompass_Navigation.VOR || this.mapNavigationMode == Jet_NDCompass_Navigation.ILS) && this.mapNavigationSource == 1) {
                    this.radioNav.setRADIONAVSource(NavSource.VOR2);
                    this.mapNavigationMode = Jet_NDCompass_Navigation.VOR;
                    this.mapNavigationSource = 2;
                    SimVar.SetSimVarValue('K:AP_NAV_SELECT_SET', 'number', 2);
                    this.onModeChanged();
                }
                else if ((this.mapNavigationMode == Jet_NDCompass_Navigation.VOR || this.mapNavigationMode == Jet_NDCompass_Navigation.ILS) && this.mapNavigationSource == 2) {
                    this.radioNav.setRADIONAVSource(NavSource.GPS);
                    this.mapNavigationMode = Jet_NDCompass_Navigation.NAV;
                    this.mapNavigationSource = 0;
                    this.onModeChanged();
                }
                break;
            case "Upr_Push_FRMT":
                if (this.mapDisplayMode == Jet_NDCompass_Display.ARC)
                    this.mapDisplayMode = Jet_NDCompass_Display.ROSE;

                else if (this.mapDisplayMode == Jet_NDCompass_Display.ROSE)
                    this.mapDisplayMode = Jet_NDCompass_Display.PPOS;

                else this.mapDisplayMode = Jet_NDCompass_Display.ARC;

                this.onModeChanged();
                break;
            case "Upr_Push_TERR_WX":
                if (this.showTerrain) {
                    this.showTerrain = false;
                    this.showWeather = true;
                }
                else if (this.showWeather) {
                    this.showTerrain = false;
                    this.showWeather = false;
                }
                else {
                    this.showTerrain = true;
                    this.showWeather = false;
                }
                this.onModeChanged();
                break;
            case "Upr_Push_TFC":
                this.map.toggleSymbol(CJ4_MapSymbol.TRAFFIC);
                break;
            case "Upr_RANGE_INC":
                this.map.rangeInc();
                break;
            case "Upr_RANGE_DEC":
                this.map.rangeDec();
                break;
            case "Upr_Push_PFD_MENU":
                this.fillDictionary(this.popup.dictionary);
                this.popup.setMode(CJ4_PopupMenu.PFD);
                break;
            case "Upr_Push_REFS_MENU":
                this.fillDictionary(this.popup.dictionary);
                this.popup.setMode(CJ4_PopupMenu.REFS);
                break;
            case "Upr_Push_ET":
                if (!this.mapOverlay._showET) {
                    this.mapOverlay._showET = true;
                    this.mapOverlay._chronoValue = 0;
                    this.mapOverlay._chronoStarted = true;
                }
                else if (this.mapOverlay._chronoStarted) {
                    this.mapOverlay._chronoStarted = false;
                }
                else {
                    this.mapOverlay._showET = false;
                }
                break;
        }
    }
    allContainersReady() {
        for (var i = 0; i < this.IndependentsElements.length; i++) {
            if (!this.IndependentsElements[i].isInitialized) {
                return false;
            }
        }
        return true;
    }
    onModeChanged() {
        SimVar.SetSimVarValue("L:CJ4_MAP_MODE", "number", this.mapDisplayMode);
        SimVar.SetSimVarValue("L:WT_CJ4_LNAV_MODE", "number", this.mapNavigationSource);
        SimVar.SetSimVarValue("L:FMC_UPDATE_CURRENT_PAGE", "number", 1);
        if (this.modeChangeMask) {
            this.modeChangeMask.style.display = "block";
            this.modeChangeTimer = 0.15;
        }
    }
    readDictionary(_dict) {
        let modeChanged = false;
        let format = _dict.get(CJ4_PopupMenu_Key.MAP_FORMAT);
        if (format == "ROSE") {
            if (this.mapDisplayMode != Jet_NDCompass_Display.ROSE) {
                this.mapDisplayMode = Jet_NDCompass_Display.ROSE;
                modeChanged = true;
            }
        }
        else if (format == "ARC") {
            if (this.mapDisplayMode != Jet_NDCompass_Display.ARC) {
                this.mapDisplayMode = Jet_NDCompass_Display.ARC;
                modeChanged = true;
            }
        }
        else if (format == "PPOS") {
            if (this.mapDisplayMode != Jet_NDCompass_Display.PPOS) {
                this.mapDisplayMode = Jet_NDCompass_Display.PPOS;
                modeChanged = true;
            }
        }
        let range = _dict.get(CJ4_PopupMenu_Key.MAP_RANGE);
        this.map.range = parseInt(range);
        let navSrc = _dict.get(CJ4_PopupMenu_Key.NAV_SRC);
        if (navSrc == "FMS1") {
            if (this.mapNavigationMode != Jet_NDCompass_Navigation.NAV) {
                this.mapNavigationMode = Jet_NDCompass_Navigation.NAV;
                this.mapNavigationSource = 0;
                this.radioNav.setRADIONAVSource(NavSource.GPS);
                modeChanged = true;
            }
        }
        else if (navSrc == "VOR1") {
            if (this.mapNavigationMode != Jet_NDCompass_Navigation.VOR || this.mapNavigationSource != 1) {
                this.mapNavigationMode = Jet_NDCompass_Navigation.VOR;
                this.mapNavigationSource = 1;
                this.radioNav.setRADIONAVSource(NavSource.VOR1);
                modeChanged = true;
            }
        }
        else if (navSrc == "VOR2") {
            if (this.mapNavigationMode != Jet_NDCompass_Navigation.VOR || this.mapNavigationSource != 2) {
                this.mapNavigationMode = Jet_NDCompass_Navigation.VOR;
                this.mapNavigationSource = 2;
                this.radioNav.setRADIONAVSource(NavSource.VOR2);
                modeChanged = true;
            }
        }
        let baroUnits = _dict.get(CJ4_PopupMenu_Key.UNITS_PRESS);
        SimVar.SetSimVarValue("L:XMLVAR_Baro_Selector_HPA_1", "Bool", (baroUnits == "HPA") ? 1 : 0);
        WTDataStore.set("CJ4_BARO_MODE", (baroUnits == "HPA") ? true : false);

        let mtrsOn = _dict.get(CJ4_PopupMenu_Key.UNITS_MTR_ALT);
        this.horizon.showMTRS((mtrsOn == "ON") ? true : false);

        let fltDirStatus = _dict.get(CJ4_PopupMenu_Key.FLT_DIR);
        this.fdMode = fltDirStatus == "X-PTR" ? 1 : 0;
        WTDataStore.set("CJ4_FD_MODE", this.fdMode);

        let aoaSetting = _dict.get(CJ4_PopupMenu_Key.AOA);
        if (aoaSetting) {
            if (aoaSetting == "AUTO") {
                SimVar.SetSimVarValue("L:WT_CJ4_PFD1_AOA", "Number", 0);
            }
            else if (aoaSetting == "ON") {
                SimVar.SetSimVarValue("L:WT_CJ4_PFD1_AOA", "Number", 1);
            }
            else if (aoaSetting == "OFF") {
                SimVar.SetSimVarValue("L:WT_CJ4_PFD1_AOA", "Number", 2);
            }
        }
        let v1 = _dict.get(CJ4_PopupMenu_Key.VSPEED_V1);
        let vR = _dict.get(CJ4_PopupMenu_Key.VSPEED_VR);
        let v2 = _dict.get(CJ4_PopupMenu_Key.VSPEED_V2);
        let vT = _dict.get(CJ4_PopupMenu_Key.VSPEED_VT);
        let vRef = _dict.get(CJ4_PopupMenu_Key.VSPEED_VRF);
        let vApp = _dict.get(CJ4_PopupMenu_Key.VSPEED_VAP);
        if (parseInt(v1) != parseInt(SimVar.GetSimVarValue("L:WT_CJ4_V1_SPEED", "Knots"))) {
            SimVar.SetSimVarValue("L:WT_CJ4_V1_SPEED", "Knots", parseInt(v1));
            SimVar.SetSimVarValue("L:WT_CJ4_V1_FMCSET", "Bool", false);
        }
        if (parseInt(vR) != parseInt(SimVar.GetSimVarValue("L:WT_CJ4_VR_SPEED", "Knots"))) {
            SimVar.SetSimVarValue("L:WT_CJ4_VR_SPEED", "Knots", parseInt(vR));
            SimVar.SetSimVarValue("L:WT_CJ4_VR_FMCSET", "Bool", false);
        }
        if (parseInt(v2) != parseInt(SimVar.GetSimVarValue("L:WT_CJ4_V2_SPEED", "Knots"))) {
            SimVar.SetSimVarValue("L:WT_CJ4_V2_SPEED", "Knots", parseInt(v2));
            SimVar.SetSimVarValue("L:WT_CJ4_V2_FMCSET", "Bool", false);
        }
        if (parseInt(vT) != parseInt(SimVar.GetSimVarValue("L:WT_CJ4_VT_SPEED", "Knots"))) {
            SimVar.SetSimVarValue("L:WT_CJ4_VT_SPEED", "Knots", parseInt(vT));
            SimVar.SetSimVarValue("L:WT_CJ4_VT_FMCSET", "Bool", false);
        }
        if (parseInt(vRef) != parseInt(SimVar.GetSimVarValue("L:WT_CJ4_VREF_SPEED", "Knots"))) {
            SimVar.SetSimVarValue("L:WT_CJ4_VREF_SPEED", "Knots", parseInt(vRef));
            SimVar.SetSimVarValue("L:WT_CJ4_VRF_FMCSET", "Bool", false);
        }
        if (parseInt(vApp) != parseInt(SimVar.GetSimVarValue("L:WT_CJ4_VAP", "Knots"))) {
            SimVar.SetSimVarValue("L:WT_CJ4_VAP", "Knots", parseInt(vApp));
            SimVar.SetSimVarValue("L:WT_CJ4_VAP_FMCSET", "Bool", false);
        }
        this.radioSrc1 = _dict.get(CJ4_PopupMenu_Key.BRG_PTR1_SRC);
        this.radioSrc2 = _dict.get(CJ4_PopupMenu_Key.BRG_PTR2_SRC);

        if (this.radioSrc1 !== 'OFF') {
            if (this.radioSrc1 == "VOR1") {
                SimVar.SetSimVarValue('L:WT.CJ4.BearingPointerMode_1', 'number', 2);
            }
            else if (this.radioSrc1 == "ADF1") {
                SimVar.SetSimVarValue('L:WT.CJ4.BearingPointerMode_1', 'number', 3);
            }
            else {
                SimVar.SetSimVarValue('L:WT.CJ4.BearingPointerMode_1', 'number', 1);
            }
        }
        else {
            SimVar.SetSimVarValue('L:WT.CJ4.BearingPointerMode_1', 'number', 0);
        }

        if (this.radioSrc2 !== 'OFF') {
            if (this.radioSrc2 == "VOR2") {
                SimVar.SetSimVarValue('L:WT.CJ4.BearingPointerMode_2', 'number', 2);
            }
            else if (this.radioSrc2 == "ADF2") {
                SimVar.SetSimVarValue('L:WT.CJ4.BearingPointerMode_2', 'number', 3);
            }
            else {
                SimVar.SetSimVarValue('L:WT.CJ4.BearingPointerMode_2', 'number', 1);
            }
        }
        else {
            SimVar.SetSimVarValue('L:WT.CJ4.BearingPointerMode_2', 'number', 0);
        }

        if (modeChanged)
            this.onModeChanged();

        let baroSet = parseInt(_dict.get(CJ4_PopupMenu_Key.MIN_ALT_BARO_VAL));
        SimVar.SetSimVarValue("L:WT_CJ4_BARO_SET", "Number", baroSet);
    }
    fillDictionary(_dict) {
        if (this.mapDisplayMode == Jet_NDCompass_Display.ROSE)
            _dict.set(CJ4_PopupMenu_Key.MAP_FORMAT, "ROSE");
        else if (this.mapDisplayMode == Jet_NDCompass_Display.ARC)
            _dict.set(CJ4_PopupMenu_Key.MAP_FORMAT, "ARC");
        else if (this.mapDisplayMode == Jet_NDCompass_Display.PPOS)
            _dict.set(CJ4_PopupMenu_Key.MAP_FORMAT, "PPOS");
        _dict.set(CJ4_PopupMenu_Key.MAP_RANGE, this.map.range.toString());
        if (this.mapNavigationMode == Jet_NDCompass_Navigation.VOR && this.mapNavigationSource == 1)
            _dict.set(CJ4_PopupMenu_Key.NAV_SRC, "VOR1");
        else if (this.mapNavigationMode == Jet_NDCompass_Navigation.VOR && this.mapNavigationSource == 2)
            _dict.set(CJ4_PopupMenu_Key.NAV_SRC, "VOR2");
        else if (this.mapNavigationMode == Jet_NDCompass_Navigation.NAV)
            _dict.set(CJ4_PopupMenu_Key.NAV_SRC, "FMS1");
        let baroHPA = WTDataStore.get("CJ4_BARO_MODE", false);
        SimVar.SetSimVarValue("L:XMLVAR_Baro_Selector_HPA_1", "Bool", baroHPA);
        _dict.set(CJ4_PopupMenu_Key.UNITS_PRESS, (baroHPA) ? "HPA" : "IN");
        _dict.set(CJ4_PopupMenu_Key.UNITS_MTR_ALT, (this.horizon.isMTRSVisible()) ? "ON" : "OFF");
        _dict.set(CJ4_PopupMenu_Key.FLT_DIR, (this.fdMode == 1) ? "X-PTR" : "V-BAR");
        let aoaSettingFill = SimVar.GetSimVarValue("L:WT_CJ4_PFD1_AOA", "Number").toFixed(0);
        if (aoaSettingFill) {
            if (aoaSettingFill == 0) {
                _dict.set(CJ4_PopupMenu_Key.AOA, "AUTO");
            }
            else if (aoaSettingFill == 1) {
                _dict.set(CJ4_PopupMenu_Key.AOA, "ON");
            }
            else if (aoaSettingFill == 2) {
                _dict.set(CJ4_PopupMenu_Key.AOA, "OFF");
            }
        }
        let v1 = SimVar.GetSimVarValue("L:WT_CJ4_V1_SPEED", "Knots").toFixed(0);
        let vR = SimVar.GetSimVarValue("L:WT_CJ4_VR_SPEED", "Knots").toFixed(0);
        let v2 = SimVar.GetSimVarValue("L:WT_CJ4_V2_SPEED", "Knots").toFixed(0);
        let vT = SimVar.GetSimVarValue("L:WT_CJ4_VT_SPEED", "Knots").toFixed(0);
        let vRef = SimVar.GetSimVarValue("L:WT_CJ4_VREF_SPEED", "Knots").toFixed(0);
        let vApp = SimVar.GetSimVarValue("L:WT_CJ4_VAP", "Knots").toFixed(0);
        _dict.set(CJ4_PopupMenu_Key.VSPEED_V1, v1);
        _dict.set(CJ4_PopupMenu_Key.VSPEED_VR, vR);
        _dict.set(CJ4_PopupMenu_Key.VSPEED_V2, v2);
        _dict.set(CJ4_PopupMenu_Key.VSPEED_VT, vT);
        _dict.set(CJ4_PopupMenu_Key.VSPEED_VRF, vRef);
        _dict.set(CJ4_PopupMenu_Key.VSPEED_VAP, vApp);
        _dict.set(CJ4_PopupMenu_Key.BRG_PTR1_SRC, this.radioSrc1);
        _dict.set(CJ4_PopupMenu_Key.BRG_VOR1_FREQ, this.radioNav.getVORActiveFrequency(1).toFixed(3));
        _dict.set(CJ4_PopupMenu_Key.BRG_ADF1_FREQ, this.radioNav.getADFActiveFrequency(1).toFixed(0));
        _dict.set(CJ4_PopupMenu_Key.BRG_PTR2_SRC, this.radioSrc2);
        _dict.set(CJ4_PopupMenu_Key.BRG_VOR2_FREQ, this.radioNav.getVORActiveFrequency(2).toFixed(3));
        _dict.set(CJ4_PopupMenu_Key.BRG_ADF2_FREQ, this.radioNav.getADFActiveFrequency(2).toFixed(0));
        _dict.changed = false;
    }
}
class CJ4_HorizonContainer extends NavSystemElementContainer {
    constructor(_name, _root) {
        super(_name, _root, null);
        this.isVisible = undefined;
        this.altimeter = new CJ4_Altimeter();
        this.element = new NavSystemElementGroup([
            new CJ4_Attitude(),
            new CJ4_VSpeed(),
            new CJ4_Airspeed(),
            this.altimeter,
            new CJ4_AOA(),
            new CJ4_APDisplay(),
            new CJ4_ILS()
        ]);
    }
    init() {
        super.init();
        this.root = this.gps.getChildById(this.htmlElemId);
        if (!this.root) {
            console.log("Root component expected!");
        }
    }
    show(_value) {
        if (this.isVisible != _value) {
            this.isVisible = _value;
            this.root.setAttribute("visible", (_value) ? "true" : "false");
        }
    }
    showMTRS(_val) {
        this.altimeter.showMTRS(_val);
    }
    isMTRSVisible() {
        return this.altimeter.isMTRSVisible();
    }
}
class CJ4_AOA extends NavSystemElement {
    init(root) {
        this.aoa = this.gps.getChildById("AOA");
        this.aoa.aircraft = Aircraft.CJ4;
        this.aoa.gps = this.gps;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        var angle = fastToFixed(Simplane.getAngleOfAttack(), 1);
        //AoA only visible when flaps 35
        this.aoa.setAttribute("angle", angle);
        let flap35Active = SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT PERCENT", "Percent");
        let aoaActive = SimVar.GetSimVarValue("L:WT_CJ4_PFD1_AOA", "Number");
        if ((flap35Active == 100 && aoaActive !== 2) || aoaActive == 1) {
            this.aoa.style = "";
        }
        else {
            this.aoa.style = "display: none";
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class CJ4_VSpeed extends NavSystemElement {
    init(root) {
        this.vsi = this.gps.getChildById("VSpeed");
        this.vsi.aircraft = Aircraft.CJ4;
        this.vsi.gps = this.gps;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {

        const fmaValues = JSON.parse(WTDataStore.get('CJ4_fmaValues', '{ }'));

        var vSpeed = Math.round(Simplane.getVerticalSpeed());
        this.vsi.setAttribute("vspeed", vSpeed.toString());

        if (Simplane.getAutoPilotVerticalSpeedHoldActive() && fmaValues.verticalMode !== 'VPATH') {
            let selVSpeed = Math.round(Simplane.getAutoPilotVerticalSpeedHoldValue());
            this.vsi.setAttribute("selected_vspeed", selVSpeed.toString());
            this.vsi.setAttribute("selected_vspeed_active", "true");
        }
        else {
            this.vsi.setAttribute("selected_vspeed_active", "false");
        }

        let donutVSpeed = SimVar.GetSimVarValue("L:WT_CJ4_DONUT", "number");
        if (Math.abs(donutVSpeed) > 100) {
            this.vsi.setAttribute("vnav_vspeed", donutVSpeed.toString());
            this.vsi.setAttribute("vnav_vspeed_active", "true");
        }
        else {
            this.vsi.setAttribute("vnav_vspeed_active", "false");
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class CJ4_Airspeed extends NavSystemElement {
    constructor() {
        super();
    }
    init(root) {
        this.airspeed = this.gps.getChildById("Airspeed");
        this.airspeed.aircraft = Aircraft.CJ4;
        this.airspeed.gps = this.gps;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.airspeed.update(_deltaTime);
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class CJ4_Altimeter extends NavSystemElement {
    constructor() {
        super();
    }
    init(root) {
        this.altimeter = this.gps.getChildById("Altimeter");
        this.altimeter.aircraft = Aircraft.CJ4;
        this.altimeter.gps = this.gps;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.altimeter.update(_deltaTime);
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "BARO_INC":
                SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", 1);
                break;
            case "BARO_DEC":
                SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", 1);
                break;
            case "MTRS_ON":
                this.altimeter.showMTRS(true);
                break;
            case "MTRS_OFF":
                this.altimeter.showMTRS(false);
                break;
        }
    }
    showMTRS(_val) {
        this.altimeter.showMTRS(_val);
    }
    isMTRSVisible() {
        return this.altimeter.isMTRSVisible();
    }
}
class CJ4_Attitude extends NavSystemElement {
    init(root) {
        this.svg = this.gps.getChildById("Horizon");
        this.svg.aircraft = Aircraft.CJ4;
        this.svg.gps = this.gps;
        this.wtFlightDirectorBankValue = 0;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        var xyz = Simplane.getOrientationAxis();
        if (xyz) {
            this.svg.setAttribute("horizon", (xyz.pitch / Math.PI * 180).toString());
            this.svg.setAttribute("pitch", (xyz.pitch / Math.PI * 180).toString());
            this.svg.setAttribute("bank", (xyz.bank / Math.PI * 180).toString());
        }
        this.svg.setAttribute("slip_skid", Simplane.getInclinometer().toString());
        this.svg.setAttribute("radio_altitude", Simplane.getAltitudeAboveGround().toString());
        this.svg.setAttribute("flight_director-active", SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE", "Bool") ? "true" : "false");
        this.svg.setAttribute("flight_director-pitch", SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR PITCH", "degree"));
        const apMasterActive = SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool") == 1;
        if (apMasterActive) {
            this.svg.setAttribute("flight_director-bank", SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR BANK", "degree"));
        } else {
            
            const bank = SimVar.GetSimVarValue("L:WT_FLIGHT_DIRECTOR_BANK", "number");
            let setBank = bank;
            if (Math.abs(this.wtFlightDirectorBankValue - bank) > 0.5) {
                setBank = bank < this.wtFlightDirectorBankValue + 0.5 ? this.wtFlightDirectorBankValue - 0.5 :  bank > this.wtFlightDirectorBankValue ? this.wtFlightDirectorBankValue + 1 : bank;
            }
            this.wtFlightDirectorBankValue = setBank;
            this.svg.setAttribute("flight_director-bank", (-1 * setBank));
        }
        this.svg.setAttribute("half_bank-active", SimVar.GetSimVarValue("AUTOPILOT MAX BANK", "degree").toFixed(0));
        this.svg.setAttribute("flight_director-style", this.gps.fdMode);

    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class CJ4_APDisplay extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.altimeterIndex = 0;
    }
    init(root) {
        this.AP_LateralActive = this.gps.getChildById("AP_LateralActive");
        this.AP_LateralArmed = this.gps.getChildById("AP_LateralArmed");
        this.AP_Status = this.gps.getChildById("AP_Status");
        this.AP_FDIndicatorArrow = this.gps.getChildById("AP_FDIndicatorArrow");
        this.AP_VerticalActive = this.gps.getChildById("AP_VerticalActive");
        this.AP_ModeReference_Icon = this.gps.getChildById("AP_ModeReference_Icon");
        this.AP_ModeReference_Value = this.gps.getChildById("AP_ModeReference_Value");
        this.AP_Armed = this.gps.getChildById("AP_Armed");
        this.AP_YDStatus = this.gps.getChildById("AP_YDStatus");
        if (this.gps.instrumentXmlConfig) {
            let altimeterIndexElems = this.gps.instrumentXmlConfig.getElementsByTagName("AltimeterIndex");
            if (altimeterIndexElems.length > 0) {
                this.altimeterIndex = parseInt(altimeterIndexElems[0].textContent) + 1;
            }
        }
        SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "feet", 10000);
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        //NEW SIMPLIFIED CODE FOR SETTING FMA MODES

        //SET AP & YD VALUES
        const apMasterActive = SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool") == 1;
        const ydActive = SimVar.GetSimVarValue("AUTOPILOT YAW DAMPER", "Boolean") == 1;
        const flightDirector = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE", "Boolean") == 1;

        Avionics.Utils.diffAndSet(this.AP_Status, apMasterActive ? "AP" : "");
        if (apMasterActive && !ydActive) {
            SimVar.SetSimVarValue("K:YAW_DAMPER_TOGGLE", "number", 1);
        }
        if (apMasterActive && !flightDirector) {
            SimVar.SetSimVarValue("K:TOGGLE_FLIGHT_DIRECTOR", "number", 1);
        }
        if (apMasterActive) {
            Avionics.Utils.diffAndSet(this.AP_YDStatus, "");
            this.AP_FDIndicatorArrow.setAttribute("state", "Engaged");
        } else {
            Avionics.Utils.diffAndSet(this.AP_YDStatus, ydActive ? "YD" : "");
            this.AP_FDIndicatorArrow.removeAttribute("state");
        }

        //SET OTHER VALUES OR BLANK IF AP/FD INACTIVE
        if (flightDirector || apMasterActive) {
            //GET DATA FROM DATASTORE SET BY AP UPDATE METHOD
            const fmaValues = WTDataStore.get('CJ4_fmaValues', 'none');
            if (fmaValues != "none") {
                const parsedFmaValues = JSON.parse(fmaValues);
                const lateralMode = parsedFmaValues.lateralMode;
                const lateralArmed = parsedFmaValues.lateralArmed;
                const verticalMode = parsedFmaValues.verticalMode;
                const verticalArmed1 = parsedFmaValues.verticalArmed1;
                const verticalArmed2 = parsedFmaValues.verticalArmed2;

                //ACTIVE VERTICAL
                if (verticalMode == "VS" || verticalMode == "VVS") {
                    Avionics.Utils.diffAndSet(this.AP_VerticalActive, verticalMode);
                    this.AP_ModeReference_Icon.style.display = "none";
                    Avionics.Utils.diffAndSet(this.AP_ModeReference_Value, fastToFixed(SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet per minute"), 0));
                }
                else if (verticalMode == "FLC" || verticalMode == "VFLC") {
                    Avionics.Utils.diffAndSet(this.AP_VerticalActive, verticalMode);
                    this.AP_ModeReference_Icon.style.display = "inline";
                    if (Simplane.getAutoPilotMachModeActive()) {
                        const machValue = SimVar.GetSimVarValue("AUTOPILOT MACH HOLD VAR", "mach");
                        Avionics.Utils.diffAndSet(this.AP_ModeReference_Value, "M" + machValue.toFixed(2).slice(1));
                    }
                    else {
                        Avionics.Utils.diffAndSet(this.AP_ModeReference_Value, fastToFixed(SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR", "knots"), 0));
                    }
                }
                else {
                    Avionics.Utils.diffAndSet(this.AP_VerticalActive, verticalMode);
                    this.AP_ModeReference_Icon.style.display = "none";
                    Avionics.Utils.diffAndSet(this.AP_ModeReference_Value, "");
                }

                const verticalArmed = verticalArmed2 ? verticalArmed2 : verticalArmed1 ? verticalArmed1 : "";
                Avionics.Utils.diffAndSet(this.AP_Armed, verticalArmed);
                //Avionics.Utils.diffAndSet(this.AP_Armed, verticalArmed1 ? verticalArmed1 : "");


                //LATERAL ACTIVE
                Avionics.Utils.diffAndSet(this.AP_LateralActive, lateralMode);

                //LATERAL ARMED
                Avionics.Utils.diffAndSet(this.AP_LateralArmed, lateralArmed); //LATERAL ARMED
            }
        }
        else {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, ""); //VETICAL MODE
            Avionics.Utils.diffAndSet(this.AP_ModeReference_Value, ""); //VERTICAL MODE VAL (if needed)
            Avionics.Utils.diffAndSet(this.AP_Armed, ""); //VERTICAL ARMED
            Avionics.Utils.diffAndSet(this.AP_LateralActive, ""); //LATERAL ACTIVE
            Avionics.Utils.diffAndSet(this.AP_LateralArmed, ""); //LATERAL ARMED
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class CJ4_ILS extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.altWentAbove500 = false;
    }
    init(root) {
        this.ils = this.gps.getChildById("ILS");
        this.ils.aircraft = Aircraft.CJ4;
        this.ils.gps = this.gps;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        console.log("onupdate");
        if (this.ils) {
            this.altWentAbove500 = true;
            console.log("this.ils");
            let showLoc = 0;
            let showGs = 0;

            
            console.log("this.gps.mapNavigationSource: " + this.gps.mapNavigationSource);
            if (this.gps.mapNavigationSource === 1 || this.gps.mapNavigationSource === 2) {
                const isLoc = SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + this.gps.mapNavigationSource, "bool");
                const isGs = SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:" + this.gps.mapNavigationSource, "bool");
                showLoc = isLoc ? 1 : 0;
                showGs = isGs ? 1 : 0;
            }
            else if (this.gps.mapNavigationSource === 0) {
                const isVnav = SimVar.GetSimVarValue("L:WT_VNAV_PATH_STATUS", "number") > 0;
                const isRnav = SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') > 2;
                const isPpos = this.gps.mapDisplayMode === 4;
                showLoc = isRnav || isPpos ? 2 : 0;
                showGs = isVnav ? 2 : 0;
            }

            this.ils.showLocalizer(showLoc, this.gps.mapNavigationSource);
            this.ils.showGlideslope(showGs);
            this.ils.update(_deltaTime);
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
registerInstrument("cj4-pfd-element", CJ4_PFD);