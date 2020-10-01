class CJ4_MFD extends BaseAirliners {
    constructor() {
        super();
        this.isExtended = false;
        this.showTerrain = false;
        this.showWeather = false;
        this.showFms = false;
        this.showGwx = false;
        this.showChecklist = false;
        this.mapDisplayMode = Jet_NDCompass_Display.ROSE;
        this.mapNavigationMode = Jet_NDCompass_Navigation.NAV;
        this.mapNavigationSource = 0;
        this.systemPage1 = CJ4_SystemPage.ENGINES;
        this.systemPage2 = CJ4_SystemPage.ELECTRICS;
        this.modeChangeTimer = -1;
        this.initDuration = 11000;
    }
    get templateID() { return "CJ4_MFD"; }
    get IsGlassCockpit() { return true; }
    connectedCallback() {
        super.connectedCallback();
        this.radioNav.init(NavMode.TWO_SLOTS);
        this.systems1 = new CJ4_SystemContainer("System1", "SystemInfos1");
        this.systems2 = new CJ4_SystemContainer("System2", "SystemInfos2");
        this.map = new CJ4_MapContainer("Map", "Map");
        this.mapOverlay = new CJ4_MapOverlayContainer("MapInfos", "MapOverlay");
        this.fms = new CJ4_FMSContainer("Fms", "FMSInfos");
        this.checklist = new CJ4_ChecklistContainer("Checklist", "Checklist");
        this.navBar = new CJ4_NavBarContainer("Nav", "NavBar");
        this.popup = new CJ4_PopupMenuContainer("Menu", "PopupMenu");
        this.addIndependentElementContainer(this.systems1);
        this.addIndependentElementContainer(this.systems2);
        this.addIndependentElementContainer(this.map);
        this.addIndependentElementContainer(this.mapOverlay);
        this.addIndependentElementContainer(this.navBar);
        this.addIndependentElementContainer(this.fms);
        this.addIndependentElementContainer(this.checklist);
        this.addIndependentElementContainer(this.popup);
        this.modeChangeMask = this.getChildById("ModeChangeMask");
        this.maxUpdateBudget = 12;
    }
    disconnectedCallback() {
    }
    Update() {
        super.Update();
        if (this.allContainersReady()) {
            SimVar.SetSimVarValue("L:Glasscockpit_MFD_Started", "number", this.isStarted ? 1 : 0);
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
            if (this.showGwx)
                this.showWeather = false;
            if (this.showGwx) {
                this.map.showGwx(true);
                this.mapOverlay.showGwx(true);
            }
            else {
                this.map.setMode(this.mapDisplayMode);
                this.mapOverlay.setMode(this.mapDisplayMode, this.mapNavigationMode, this.mapNavigationSource);
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
                    this.map.showGwx(false);
                    this.mapOverlay.showGwx(false);
                }
            }
            if (this.showFms) {
                this.systems1.minimize(true);
                this.systems2.show(CJ4_SystemPage.NONE);
                this.fms.show(true);
                this.checklist.show(false);
                this.mapOverlay.setExtended(false);
            }
            else if (this.showChecklist) {
                this.systems1.minimize(true);
                this.systems2.show(CJ4_SystemPage.NONE);
                this.fms.show(false);
                this.checklist.show(true);
                this.mapOverlay.setExtended(false);
            }
            else {
                this.fms.show(false);
                this.checklist.show(false);
                this.systems1.show(this.systemPage1);
                if (this.systemPage1 == CJ4_SystemPage.ENGINES) {
                    if (this.isExtended && !this.systems2.hasAnnunciations()) {
                        this.map.setExtended(true);
                        this.mapOverlay.setExtended(true);
                        this.systems1.minimize(false);
                        this.systems2.show(CJ4_SystemPage.NONE);
                    }
                    else {
                        this.map.setExtended(false);
                        this.mapOverlay.setExtended(false);
                        if (this.systems2.hasAnnunciations()) {
                            this.systems1.minimize(true);
                            this.systems2.show(CJ4_SystemPage.ANNUNCIATIONS);
                        }
                        else {
                            this.systems1.minimize((this.systemPage2 != CJ4_SystemPage.NONE) ? true : false);
                            this.systems2.show(this.systemPage2);
                        }
                    }
                }
                else {
                    this.systems1.minimize(true);
                    if (this.isExtended) {
                        this.map.setExtended(true);
                        this.mapOverlay.setExtended(true);
                        this.systems2.show(CJ4_SystemPage.NONE);
                    }
                    else {
                        this.map.setExtended(false);
                        this.mapOverlay.setExtended(false);
                        this.systems2.show(this.systemPage2);
                    }
                }
            }
            this.mapOverlay.setRange(this.map.range);
        }
    }
    onEvent(_event) {
        console.log(_event);
        switch (_event) {
            case "Lwr_Push_TERR_WX":
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
            case "Lwr_Push_TFC":
                this.map.toggleSymbol(CJ4_MapSymbol.TRAFFIC);
                break;
            case "Lwr_Push_SYS":
                this.isExtended = !this.isExtended;
                break;
            case "Lwr_Push_ENG":
                this.systemPage1 = (this.systemPage1 == CJ4_SystemPage.ENGINES) ? CJ4_SystemPage.ANNUNCIATIONS : CJ4_SystemPage.ENGINES;
                break;
            case "Lwr_Push_UPR_MENU":
                this.fillDictionary(this.popup.dictionary);
                this.popup.setMode(CJ4_PopupMenu.UPPER);
                if(this.popup.mode == CJ4_PopupMenu.UPPER){
                    this.checklist.otherMenusOpen = true;
                }
                else{
                    this.checklist.otherMenusOpen = false
                }
                break;
            case "Lwr_Push_LWR_MENU":
                this.fillDictionary(this.popup.dictionary);
                this.popup.setMode(CJ4_PopupMenu.LOWER);
                if(this.popup.mode == CJ4_PopupMenu.LOWER){
                    this.checklist.otherMenusOpen = true;
                }
                else{
                    this.checklist.otherMenusOpen = false
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
        else if (format == "ARC" || format == "PPOS" || format == "TCAS") {
            if (this.mapDisplayMode != Jet_NDCompass_Display.ARC) {
                this.mapDisplayMode = Jet_NDCompass_Display.ARC;
                modeChanged = true;
            }
        }
        else if (format == "PLAN") {
            if (this.mapDisplayMode != Jet_NDCompass_Display.PLAN) {
                this.mapDisplayMode = Jet_NDCompass_Display.PLAN;
                modeChanged = true;
            }
        }
        let navSrc = _dict.get(CJ4_PopupMenu_Key.NAV_SRC);
        if (navSrc == "FMS1") {
            if (this.mapNavigationMode != Jet_NDCompass_Navigation.NAV) {
                this.mapNavigationMode = Jet_NDCompass_Navigation.NAV;
                this.mapNavigationSource = 0;
                modeChanged = true;
            }
        }
        else if (navSrc == "VOR1") {
            if (this.mapNavigationMode != Jet_NDCompass_Navigation.VOR || this.mapNavigationSource != 1) {
                this.mapNavigationMode = Jet_NDCompass_Navigation.VOR;
                this.mapNavigationSource = 1;
                modeChanged = true;
            }
        }
        else if (navSrc == "VOR2") {
            if (this.mapNavigationMode != Jet_NDCompass_Navigation.VOR || this.mapNavigationSource != 2) {
                this.mapNavigationMode = Jet_NDCompass_Navigation.VOR;
                this.mapNavigationSource = 2;
                modeChanged = true;
            }
        }
        this.map.setSymbol(CJ4_MapSymbol.AIRPORTS, (_dict.get(CJ4_PopupMenu_Key.MAP_SYMBOL_AIRPORTS) == "ON") ? true : false);
        this.map.setSymbol(CJ4_MapSymbol.CONSTRAINTS, (_dict.get(CJ4_PopupMenu_Key.MAP_SYMBOL_CONSTRAINTS) == "ON") ? true : false);
        this.map.setSymbol(CJ4_MapSymbol.INTERSECTS, (_dict.get(CJ4_PopupMenu_Key.MAP_SYMBOL_INTERSECTS) == "ON") ? true : false);
        this.map.setSymbol(CJ4_MapSymbol.AIRWAYS, (_dict.get(CJ4_PopupMenu_Key.MAP_SYMBOL_AIRWAYS) == "ON") ? true : false);
        this.map.setSymbol(CJ4_MapSymbol.AIRSPACES, (_dict.get(CJ4_PopupMenu_Key.MAP_SYMBOL_AIRSPACES) == "ON") ? true : false);
        this.map.setSymbol(CJ4_MapSymbol.NAVAIDS, (_dict.get(CJ4_PopupMenu_Key.MAP_SYMBOL_NAVAIDS) == "ON") ? true : false);
        let sysMode = _dict.get(CJ4_PopupMenu_Key.SYS_SRC);
        if (sysMode == "OFF") {
            this.isExtended = true;
            this.showFms = false;
            this.showChecklist = false;
        }
        else if (sysMode == "FMS TEXT") {
            this.isExtended = false;
            this.showFms = true;
            this.showChecklist = false;
        }
        else if (sysMode == "SYSTEMS") {
            this.isExtended = false;
            this.showFms = false;
            this.showChecklist = false;
        }
        else if (sysMode == "CHECKLIST") {
            this.isExtended = false;
            this.showFms = false;
            this.showChecklist = true;
        }
        if (modeChanged)
            this.onModeChanged();
    }
    fillDictionary(_dict) {
        if (this.mapDisplayMode == Jet_NDCompass_Display.ROSE)
            _dict.set(CJ4_PopupMenu_Key.MAP_FORMAT, "ROSE");
        else if (this.mapDisplayMode == Jet_NDCompass_Display.ARC)
            _dict.set(CJ4_PopupMenu_Key.MAP_FORMAT, "ARC");
        else if (this.mapDisplayMode == Jet_NDCompass_Display.PLAN)
            _dict.set(CJ4_PopupMenu_Key.MAP_FORMAT, "PLAN");
        if (this.mapNavigationMode == Jet_NDCompass_Navigation.VOR && this.mapNavigationSource == 1)
            _dict.set(CJ4_PopupMenu_Key.NAV_SRC, "VOR1");
        else if (this.mapNavigationMode == Jet_NDCompass_Navigation.VOR && this.mapNavigationSource == 2)
            _dict.set(CJ4_PopupMenu_Key.NAV_SRC, "VOR2");
        else if (this.mapNavigationMode == Jet_NDCompass_Navigation.NAV)
            _dict.set(CJ4_PopupMenu_Key.NAV_SRC, "FMS1");
        _dict.set(CJ4_PopupMenu_Key.MAP_SYMBOL_AIRPORTS, (this.map.hasSymbol(CJ4_MapSymbol.AIRPORTS)) ? "ON" : "OFF");
        _dict.set(CJ4_PopupMenu_Key.MAP_SYMBOL_CONSTRAINTS, (this.map.hasSymbol(CJ4_MapSymbol.CONSTRAINTS)) ? "ON" : "OFF");
        _dict.set(CJ4_PopupMenu_Key.MAP_SYMBOL_INTERSECTS, (this.map.hasSymbol(CJ4_MapSymbol.INTERSECTS)) ? "ON" : "OFF");
        _dict.set(CJ4_PopupMenu_Key.MAP_SYMBOL_AIRWAYS, (this.map.hasSymbol(CJ4_MapSymbol.AIRWAYS)) ? "ON" : "OFF");
        _dict.set(CJ4_PopupMenu_Key.MAP_SYMBOL_AIRSPACES, (this.map.hasSymbol(CJ4_MapSymbol.AIRSPACES)) ? "ON" : "OFF");
        _dict.set(CJ4_PopupMenu_Key.MAP_SYMBOL_NAVAIDS, (this.map.hasSymbol(CJ4_MapSymbol.NAVAIDS)) ? "ON" : "OFF");
        if (this.isExtended)
            _dict.set(CJ4_PopupMenu_Key.SYS_SRC, "OFF");
        else if (this.showFms)
            _dict.set(CJ4_PopupMenu_Key.SYS_SRC, "FMS TEXT");
        else if (this.showChecklist)
            _dict.set(CJ4_PopupMenu_Key.SYS_SRC, "CHECKLIST");
        else
            _dict.set(CJ4_PopupMenu_Key.SYS_SRC, "SYSTEMS");
            _dict.changed = false;
    }
}
class CJ4_FMSContainer extends NavSystemElementContainer {
    constructor(_name, _root) {
        super(_name, _root, null);
        this.isVisible = undefined;
        this.previousWaypoint = undefined;
        this._k = 0;
    }
    static secondsTohhmm(seconds) {
        let h = Math.floor(seconds / 3600);
        seconds -= h * 3600;
        let m = Math.ceil(seconds / 60);
        return h.toFixed(0) + ":" + m.toFixed(0).padStart(2, "0");
    }
    init() {
        super.init();
        this.root = this.gps.getChildById(this.htmlElemId);
        if (!this.root) {
            console.log("Root component expected!");
        }
        else {
            let waypointContainers = this.root.querySelectorAll(".cj4x-navigation-data-row");
            this._previousWaypointContainer = waypointContainers[0];
            this._activeWaypointContainer = waypointContainers[1];
            this._nextWaypointContainer = waypointContainers[2];
            this._destinationWaypointContainer = waypointContainers[3];
        }
    }
    show(_value) {
        if (this.isVisible != _value) {
            this.isVisible = _value;
            this.root.setAttribute("visible", (_value) ? "true" : "false");
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (!this._previousWaypointContainer || !this._activeWaypointContainer || !this._nextWaypointContainer || !this._destinationWaypointContainer) {
            if (!this.isInitialized) {
                this.init();
            }
            return;
        }
        let flightPlanManager = this.gps.currFlightPlanManager;
        if (flightPlanManager) {
            this._k++;
            if (this._k > 60) {
                flightPlanManager.updateFlightPlan();
                this._k = 0;
            }

            let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            let aircraftPosition = new LatLong(lat, long);
            let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            const FPWaypoints = flightPlanManager._waypoints[flightPlanManager._currentFlightPlanIndex];
            const UTCTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");

            //region previous
            /* SET PREVIOUS WAYPOINT FMS INFO */
            let previousWaypointIndex = flightPlanManager.getActiveWaypointIndex() - 1;
            let previousWaypoint = flightPlanManager.getWaypoint(previousWaypointIndex);
            if (previousWaypoint && previousWaypoint.ident != flightPlanManager.getOrigin().ident) {
                this._previousWaypointContainer.style.display = "block";

                // Set identification ICAO
                this._previousWaypointContainer
                    .querySelector(".cj4x-navigation-data-waypoint-ident")
                    .textContent = previousWaypoint.ident;

                // Set distance to go
                this._previousWaypointContainer
                    .querySelector(".cj4x-navigation-data-waypoint-distance")
                    .textContent = Avionics.Utils.computeDistance(aircraftPosition, previousWaypoint.infos.coordinates).toFixed(1) + " NM";

                // Set ETA
                let etaValue = "--:--";
                if (this.previousWaypoint == undefined || this.previousWaypoint.ident != previousWaypoint) {
                    const seconds = Number.parseInt(UTCTime);
                    etaValue = Utils.SecondsToDisplayTime(seconds, true, false, false);
                    this.previousWaypoint = previousWaypoint;
                }

                this._previousWaypointContainer
                    .querySelector(".cj4x-navigation-data-waypoint-eta")
                    .textContent = etaValue;

            }
            else {
                this._previousWaypointContainer.style.display = "none";
            }
            //endregion

            //region active
            /* SET ACTIVE WAYPOINT FMS INFO */
            let activeIndex = flightPlanManager.getActiveWaypointIndex();
            let activeWaypoint = FPWaypoints[activeIndex];
            if (activeWaypoint) {
                const destination = flightPlanManager.getDestination();
                if(destination && activeWaypoint.ident == destination.ident){
                    this._activeWaypointContainer.style.display = "none";
                }
                else{
                    this._activeWaypointContainer.style.display = "block";

                    // Set identification ICAO
                    this._activeWaypointContainer
                        .querySelector(".cj4x-navigation-data-waypoint-ident")
                        .textContent = activeWaypoint.ident;

                    // Set distance to go
                    const activeWaypointDistance = Avionics.Utils.computeDistance(aircraftPosition, activeWaypoint.infos.coordinates).toFixed(1);
                    this._activeWaypointContainer
                        .querySelector(".cj4x-navigation-data-waypoint-distance")
                        .textContent = activeWaypointDistance + " NM";

                    // Set ETE
                    let eteValue = "-:--";
                    if(groundSpeed >= 50){
                        eteValue = new Date(this.calcETEseconds(activeWaypointDistance, groundSpeed) * 1000).toISOString().substr(11, 5);
                    }

                    this._activeWaypointContainer
                        .querySelector(".cj4x-navigation-data-waypoint-ete")
                        .textContent = eteValue;

                    // Set ETA
                    let etaValue = "--:--";
                    if(groundSpeed >= 50){
                        const seconds = Number.parseInt(UTCTime) + (this.calcETEseconds(activeWaypointDistance, groundSpeed));
                        const time = Utils.SecondsToDisplayTime(seconds, true, false, false);
                        etaValue = time;
                    }

                    this._activeWaypointContainer
                        .querySelector(".cj4x-navigation-data-waypoint-eta")
                        .textContent = etaValue;
                }
            }
            else {
                this._activeWaypointContainer.style.display = "none";
            }
            //endregion

            /* SET NEXT WAYPOINT FMS INFO */
            let nextWaypoint = flightPlanManager.getWaypoint(activeIndex + 1);
            if (nextWaypoint && activeWaypoint) {
                const destination = flightPlanManager.getDestination();
                if(destination && nextWaypoint.ident == destination.ident){
                    this._nextWaypointContainer.style.display = "none";
                }
                else{
                    this._nextWaypointContainer.style.display = "block";

                    // Set identification ICAO
                    this._nextWaypointContainer.querySelector(".cj4x-navigation-data-waypoint-ident")
                        .textContent = nextWaypoint.ident;

                    // Set distance to go
                    const nextWaypointDistance = (Avionics.Utils.computeDistance(aircraftPosition, activeWaypoint.infos.coordinates) + Avionics.Utils.computeDistance(activeWaypoint.infos.coordinates, nextWaypoint.infos.coordinates)).toFixed(1);
                    this._nextWaypointContainer
                        .querySelector(".cj4x-navigation-data-waypoint-distance")
                        .textContent = nextWaypointDistance + " NM";

                    // Set ETE
                    let eteValue = "-:--";
                    if(groundSpeed >= 50) {
                        eteValue = new Date(this.calcETEseconds(nextWaypointDistance, groundSpeed) * 1000).toISOString().substr(11, 5);
                    }

                    this._nextWaypointContainer
                        .querySelector(".cj4x-navigation-data-waypoint-ete")
                        .textContent = eteValue;

                    // Set ETA
                    let etaValue = "--:--";
                    if(groundSpeed >= 50) {
                        const seconds = Number.parseInt(UTCTime) + (this.calcETEseconds(nextWaypointDistance, groundSpeed));
                        const time = Utils.SecondsToDisplayTime(seconds, true, false, false);
                        etaValue = time;
                    }

                    this._nextWaypointContainer
                        .querySelector(".cj4x-navigation-data-waypoint-eta")
                        .textContent = etaValue;
                }
            }
            else {
                this._nextWaypointContainer.style.display = "none";
            }

            /* SET DESTINATION FMS INFO */
            let destination = flightPlanManager.getDestination();
            if (destination) {
                // Set identification ICAO
                this._destinationWaypointContainer
                    .querySelector(".cj4x-navigation-data-waypoint-ident")
                    .textContent = destination.ident;

                // Set distance to go
                const destinationWaypointDistance = destination.cumulativeDistanceInFP.toFixed(1);
                this._destinationWaypointContainer
                    .querySelector(".cj4x-navigation-data-waypoint-distance")
                    .textContent = destinationWaypointDistance + " NM";

                // Set ETE
                let eteValue = "-:--";
                if(groundSpeed >= 50) {
                    eteValue = new Date(this.calcETEseconds(destinationWaypointDistance, groundSpeed) * 1000).toISOString().substr(11, 5);
                }

                this._destinationWaypointContainer
                    .querySelector(".cj4x-navigation-data-waypoint-ete")
                    .textContent = eteValue;

                // Set ETA
                let etaValue = "--:--";
                if(groundSpeed >= 50) {
                    const seconds = Number.parseInt(UTCTime) + (this.calcETEseconds(destinationWaypointDistance, groundSpeed));
                    const time = Utils.SecondsToDisplayTime(seconds, true, false, false);
                    etaValue = time;
                }

                this._destinationWaypointContainer
                    .querySelector(".cj4x-navigation-data-waypoint-eta")
                    .textContent = etaValue;

                // Set expected fuel
                if(groundSpeed >= 50){
                    const fuelFlow = (SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour") + SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour")) / 2;
                    const expectedFuelUsage = (fuelFlow * (this.calcETEseconds(destinationWaypointDistance, groundSpeed) / 3600)).toFixed(0);
                    const currentFuel = (SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "pounds") * SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons")).toFixed(0);
                    const expectedFuelAtDestination = (currentFuel - expectedFuelUsage).toFixed(0) < 0 ? 0 : (currentFuel - expectedFuelUsage).toFixed(0);
                    const grossWeight = SimVar.GetSimVarValue("MAX GROSS WEIGHT", "pounds");
                    const oilQuantity = SimVar.GetSimVarValue("OIL AMOUNT", "pounds")
                    const expectedGrossWeight = expectedFuelAtDestination == 0 ? (grossWeight / 1000).toFixed(2) : ((grossWeight - expectedFuelUsage) / 1000).toFixed(2);

                    this._destinationWaypointContainer
                        .querySelector(".cj4x-navigation-data-waypoint-expected-fuel")
                        .textContent = expectedFuelAtDestination + " LB " + expectedGrossWeight + " GW";

                }

                if(activeWaypoint){
                    if(destination.ident == activeWaypoint.ident){
                        this._destinationWaypointContainer
                            .setAttribute("style", "color: magenta");
                    }
                    else{
                        this._destinationWaypointContainer
                            .setAttribute("style", "color: white");
                    }
                }
            }
        }
    }
    calcETEseconds(distance, currentGroundSpeed) {
        return (distance / currentGroundSpeed) * 3600;
    }
}
registerInstrument("cj4-mfd-element", CJ4_MFD);
//# sourceMappingURL=CJ4_MFD.js.map