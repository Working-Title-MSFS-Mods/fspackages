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
        this.radioSrc1 = "OFF";
        this.radioSrc2 = "OFF";
        this.initDuration = 7000;
    }
    get templateID() { return "CJ4_PFD"; }
    get IsGlassCockpit() { return true; }
    connectedCallback() {
        super.connectedCallback();
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
    }
    Update() {
        super.Update();
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

                    if (this.mapDisplayMode === Jet_NDCompass_Display.ARC) {
                        el.setAttribute('width', '108%');
                        el.setAttribute('height', '108%');
                        el.style = 'transform: translate(-30px, -18px)';
                    }
                }
                this.mapOverlay.infos.root.onDisplayChange(this.mapDisplayMode);
            }

            if (this.showTerrain) {
                this.map.showTerrain(true);
                this.mapOverlay.showTerrain(true);
            }
            else if (this.showWeather) {
                this.map.showWeather(true);
                this.mapOverlay.showWeather(true);
            }
            else {
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
        this.updateMachTransition();
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
                else if (this.mapNavigationMode == Jet_NDCompass_Navigation.VOR && this.mapNavigationSource == 1) {
                    this.radioNav.setRADIONAVSource(NavSource.VOR2);
                    this.mapNavigationMode = Jet_NDCompass_Navigation.VOR;
                    this.mapNavigationSource = 2;
                    this.onModeChanged();
                }
                else if (this.mapNavigationMode == Jet_NDCompass_Navigation.VOR && this.mapNavigationSource == 2) {
                    this.radioNav.setRADIONAVSource(NavSource.GPS);
                    this.mapNavigationMode = Jet_NDCompass_Navigation.NAV;
                    this.mapNavigationSource = 0;
                    this.onModeChanged();
                }
                break;
            case "Upr_Push_FRMT":
                if (this.mapDisplayMode == Jet_NDCompass_Display.ARC)
                    this.mapDisplayMode = Jet_NDCompass_Display.ROSE;
                else
                    this.mapDisplayMode = Jet_NDCompass_Display.ARC;
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
        else if (format == "ARC" || format == "PPOS") {
            if (this.mapDisplayMode != Jet_NDCompass_Display.ARC) {
                this.mapDisplayMode = Jet_NDCompass_Display.ARC;
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
        let mtrsOn = _dict.get(CJ4_PopupMenu_Key.UNITS_MTR_ALT);
        this.horizon.showMTRS((mtrsOn == "ON") ? true : false);
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
            this.radioNav.setRADIONAVActive(1, true);
            if (this.radioSrc1 == "VOR1") {
                SimVar.SetSimVarValue('L:WT.CJ4.BearingPointerMode_1', 'number', 2);

                let freq = parseFloat(_dict.get(CJ4_PopupMenu_Key.BRG_VOR1_FREQ));
                this.radioNav.setVORActiveFrequency(1, freq);
            }
            else if (this.radioSrc1 == "ADF1") {
                SimVar.SetSimVarValue('L:WT.CJ4.BearingPointerMode_1', 'number', 3);

                let freq = parseInt(_dict.get(CJ4_PopupMenu_Key.BRG_ADF1_FREQ));
                this.radioNav.setADFActiveFrequency(1, freq);
            }
            else {
                SimVar.SetSimVarValue('L:WT.CJ4.BearingPointerMode_1', 'number', 1);
            }
        }
        else {
            SimVar.SetSimVarValue('L:WT.CJ4.BearingPointerMode_1', 'number', 0);
        }

        if (this.radioSrc2 !== 'OFF') {
            this.radioNav.setRADIONAVActive(2, true);
            if (this.radioSrc2 == "VOR2") {
                SimVar.SetSimVarValue('L:WT.CJ4.BearingPointerMode_2', 'number', 2);

                let freq = parseFloat(_dict.get(CJ4_PopupMenu_Key.BRG_VOR2_FREQ));
                this.radioNav.setVORActiveFrequency(2, freq);
            }
            else if (this.radioSrc2 == "ADF2") {
                SimVar.SetSimVarValue('L:WT.CJ4.BearingPointerMode_2', 'number', 3);

                let freq = parseInt(_dict.get(CJ4_PopupMenu_Key.BRG_ADF2_FREQ));
                this.radioNav.setADFActiveFrequency(2, freq);
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
    }
    fillDictionary(_dict) {
        if (this.mapDisplayMode == Jet_NDCompass_Display.ROSE)
            _dict.set(CJ4_PopupMenu_Key.MAP_FORMAT, "ROSE");
        else if (this.mapDisplayMode == Jet_NDCompass_Display.ARC)
            _dict.set(CJ4_PopupMenu_Key.MAP_FORMAT, "ARC");
        _dict.set(CJ4_PopupMenu_Key.MAP_RANGE, this.map.range.toString());
        if (this.mapNavigationMode == Jet_NDCompass_Navigation.VOR && this.mapNavigationSource == 1)
            _dict.set(CJ4_PopupMenu_Key.NAV_SRC, "VOR1");
        else if (this.mapNavigationMode == Jet_NDCompass_Navigation.VOR && this.mapNavigationSource == 2)
            _dict.set(CJ4_PopupMenu_Key.NAV_SRC, "VOR2");
        else if (this.mapNavigationMode == Jet_NDCompass_Navigation.NAV)
            _dict.set(CJ4_PopupMenu_Key.NAV_SRC, "FMS1");
        let baroHPA = SimVar.GetSimVarValue("L:XMLVAR_Baro_Selector_HPA_1", "Bool");
        _dict.set(CJ4_PopupMenu_Key.UNITS_PRESS, (baroHPA) ? "HPA" : "IN");
        _dict.set(CJ4_PopupMenu_Key.UNITS_MTR_ALT, (this.horizon.isMTRSVisible()) ? "ON" : "OFF");
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
        console.log("AOA: " + SimVar.GetSimVarValue("L:WT_CJ4_PFD1_AOA", "Number"));
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
        var vSpeed = Math.round(Simplane.getVerticalSpeed());
        this.vsi.setAttribute("vspeed", vSpeed.toString());
        if (Simplane.getAutoPilotVerticalSpeedHoldActive()) {
            var selVSpeed = Math.round(Simplane.getAutoPilotVerticalSpeedHoldValue());
            this.vsi.setAttribute("selected_vspeed", selVSpeed.toString());
            this.vsi.setAttribute("selected_vspeed_active", "true");
        }
        else {
            this.vsi.setAttribute("selected_vspeed_active", "false");
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
        this.svg.setAttribute("flight_director-bank", SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR BANK", "degree"));
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
        this.AP_VerticalActive = this.gps.getChildById("AP_VerticalActive");
        this.AP_ModeReference = this.gps.getChildById("AP_ModeReference");
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
        Avionics.Utils.diffAndSet(this.AP_Status, SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool") ? "AP" : "");
        if (SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ACTIVE", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "GS");
            Avionics.Utils.diffAndSet(this.AP_ModeReference, "");
        }
        else if (SimVar.GetSimVarValue("L:XMLVAR_VNAVButtonValue", "boolean")) {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "VNAV");
            Avionics.Utils.diffAndSet(this.AP_ModeReference, "");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT PITCH HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "PIT");
            Avionics.Utils.diffAndSet(this.AP_ModeReference, "");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "FLC");
            if (Simplane.getAutoPilotMachModeActive()) {
                Avionics.Utils.diffAndSet(this.AP_ModeReference, "M" + fastToFixed(SimVar.GetSimVarValue("AUTOPILOT MACH HOLD VAR", "mach"), 3));
            }
            else {
                Avionics.Utils.diffAndSet(this.AP_ModeReference, fastToFixed(SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR", "knots"), 0) + "KT");
            }
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT MACH HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "FLC");
            Avionics.Utils.diffAndSet(this.AP_ModeReference, "M" + fastToFixed(SimVar.GetSimVarValue("AUTOPILOT MACH HOLD VAR", "mach"), 3));
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Boolean")) {
            if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE ARM", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_VerticalActive, "ALTS");
            }
            else {
                let delta = Math.abs(Simplane.getAltitude() - Simplane.getAutoPilotAltitudeLockValue("feets"));
                if (delta < 50) {
                    Avionics.Utils.diffAndSet(this.AP_VerticalActive, "ALT CAP");
                }
                else {
                    Avionics.Utils.diffAndSet(this.AP_VerticalActive, "ALT");
                }
            }
            Avionics.Utils.diffAndSet(this.AP_ModeReference, fastToFixed(SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:3", "feet"), 0) + "FT");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
            let vsDisplay = "<span>VS</span> ";
            let verticalHoldVar = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet per minute");
            vsDisplay += "<span style=\"color: #0599fc;\">" + fastToFixed(verticalHoldVar, 0) + "</span>";
            if (verticalHoldVar > 0) {
                vsDisplay += "<span style=\"font-size: 17px; color: #0599fc;\">↑</span>";
            }
            else if (verticalHoldVar < 0) {
                vsDisplay += "<span style=\"font-size: 17px; color: #0599fc;\">↓</span>";
            }
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, vsDisplay);
            Avionics.Utils.diffAndSet(this.AP_ModeReference, "");
        }
        else {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "");
            Avionics.Utils.diffAndSet(this.AP_ModeReference, "");
        }
        if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE ARM", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_Armed, "ALT");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ARM", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_Armed, "GS");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_Armed, "ALTS");
        }
        else {
            Avionics.Utils.diffAndSet(this.AP_Armed, "");
        }
        if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_LateralActive, "HDG");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean")) {
            if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_LateralActive, "LNV1");
            }
            else {
                if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                    Avionics.Utils.diffAndSet(this.AP_LateralActive, "LOC");
                }
                else {
                    Avionics.Utils.diffAndSet(this.AP_LateralActive, "VOR");
                }
            }
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_LateralActive, "BC");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Boolean")) {
            if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_LateralActive, "LNV1");
            }
            else {
                if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                    Avionics.Utils.diffAndSet(this.AP_LateralActive, "LOC");
                }
                else {
                    Avionics.Utils.diffAndSet(this.AP_LateralActive, "VOR");
                }
            }
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_LateralActive, "LVL");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT BANK HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_LateralActive, "ROL");
        }
        else {
            Avionics.Utils.diffAndSet(this.AP_LateralActive, "");
        }
        if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool") || SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Bool")) {
            if (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean")) {
                if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                    Avionics.Utils.diffAndSet(this.AP_LateralArmed, "FMS");
                }
                else {
                    if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                        Avionics.Utils.diffAndSet(this.AP_LateralArmed, "LOC");
                    }
                    else {
                        Avionics.Utils.diffAndSet(this.AP_LateralArmed, "VOR");
                    }
                }
            }
            else if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_LateralArmed, "BC");
            }
            else if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Boolean")) {
                if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                    Avionics.Utils.diffAndSet(this.AP_LateralArmed, "FMS");
                }
                else {
                    if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                        Avionics.Utils.diffAndSet(this.AP_LateralArmed, "LOC");
                    }
                    else {
                        Avionics.Utils.diffAndSet(this.AP_LateralArmed, "VOR");
                    }
                }
            }
            else {
                Avionics.Utils.diffAndSet(this.AP_LateralArmed, "");
            }
        }
        else {
            Avionics.Utils.diffAndSet(this.AP_LateralArmed, "");
        }
        if (SimVar.GetSimVarValue("AUTOPILOT YAW DAMPER", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_YDStatus, "YD");
        }
        else {
            Avionics.Utils.diffAndSet(this.AP_YDStatus, "");
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class CJ4_ILS extends NavSystemElement {
    init(root) {
        this.ils = this.gps.getChildById("ILS");
        this.ils.aircraft = Aircraft.CJ4;
        this.ils.gps = this.gps;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.ils) {
            let showIls = false;
            let localizer = this.gps.radioNav.getBestILSBeacon(false);
            if (localizer.id != 0) {
                showIls = true;
            }
            this.ils.showLocalizer(showIls);
            this.ils.showGlideslope(showIls);
            this.ils.update(_deltaTime);
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
registerInstrument("cj4-pfd-element", CJ4_PFD);
//# sourceMappingURL=CJ4_PFD.js.map
