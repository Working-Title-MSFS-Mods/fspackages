class CJ4_MFD extends BaseAirliners {
    constructor() {
        super();
        this.isExtended = false;
        this.showTerrain = false;
        this.showWeather = false;
        this.showFms = false;
        this.showGwx = false;
        this.showChecklist = false;
        this.showPassengerBrief = false;
        this.mapDisplayMode = Jet_NDCompass_Display.ROSE;
        this.mapNavigationMode = Jet_NDCompass_Navigation.NAV;
        this.mapNavigationSource = 0;
        this.systemPage1 = CJ4_SystemPage.ENGINES;
        this.systemPage2 = CJ4_SystemPage.ELECTRICS;
        this.showSystemOverlay = 0;
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
        this.systemOverlay = new CJ4_SystemOverlayContainer("SystemOverlay", "SystemOverlay");
        this.map = new CJ4_MapContainer("Map", "Map");
        this.mapOverlay = new CJ4_MapOverlayContainer("MapInfos", "MapOverlay");
        this.fms = new CJ4_FMSContainer("Fms", "FMSInfos");
        this.checklist = new CJ4_Checklist_Container("Checklist", "Checklist");
        this.passengerBrief = new CJ4_PassengerBrief_Container("PassengerBrief", "PassengerBrief");
        this.navBar = new CJ4_NavBarContainer("Nav", "NavBar");
        this.popup = new CJ4_PopupMenuContainer("Menu", "PopupMenu");
        this.addIndependentElementContainer(this.systems1);
        this.addIndependentElementContainer(this.systems2);
        this.addIndependentElementContainer(this.systemOverlay);
        this.addIndependentElementContainer(this.map);
        this.addIndependentElementContainer(this.mapOverlay);
        this.addIndependentElementContainer(this.navBar);
        this.addIndependentElementContainer(this.fms);
        this.addIndependentElementContainer(this.checklist);
        this.addIndependentElementContainer(this.passengerBrief);
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

            if (this.showSystemOverlay == 1 || this.showSystemOverlay == 2) {
                this.systemOverlay.show(true, this.showSystemOverlay);
            }
            else {
                this.systemOverlay.show(false);
            }

            if (this.showFms) {
                this.systems1.minimize(true);
                this.systems2.show(CJ4_SystemPage.NONE);
                this.fms.show(true);
                this.checklist.show(false);
                this.mapOverlay.setExtended(false);
                this.map.setExtended(false);
                this.passengerBrief.show(false);
            }
            else if (this.showChecklist) {
                this.systems1.minimize(true);
                this.fms.show(false);
                this.checklist.show(true);
                this.mapOverlay.setExtended(false);
                this.map.setExtended(false);
                this.passengerBrief.show(false);
            }
            else if (this.showPassengerBrief) {
                this.systems1.minimize(true);
                this.fms.show(false);
                this.checklist.show(false);
                this.mapOverlay.setExtended(false);
                this.map.setExtended(false);
                this.passengerBrief.show(true);
            }
            else {
                this.fms.show(false);
                this.checklist.show(false);
                this.passengerBrief.show(false);
                this.systems1.show(this.systemPage1);
                this.mapOverlay.setExtended(false);
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
                this.showSystemOverlay++;
                if (this.showSystemOverlay == 3) {
                    this.showSystemOverlay = 0;
                }
                break;
            case "Lwr_Push_ENG":
                this.systemPage1 = (this.systemPage1 == CJ4_SystemPage.ENGINES) ? CJ4_SystemPage.ANNUNCIATIONS : CJ4_SystemPage.ENGINES;
                break;
            case "Lwr_Push_UPR_MENU":
                this.fillDictionary(this.popup.dictionary);
                this.popup.setMode(CJ4_PopupMenu.UPPER);
                if (this.popup.mode == CJ4_PopupMenu.UPPER) {
                    this.checklist.otherMenusOpen = true;
                    this.passengerBrief.otherMenusOpen = true;
                }
                else {
                    this.checklist.otherMenusOpen = false;
                    this.passengerBrief.otherMenusOpen = false;
                }
                break;
            case "Lwr_Push_LWR_MENU":
                this.fillDictionary(this.popup.dictionary);
                this.popup.setMode(CJ4_PopupMenu.LOWER);
                if (this.popup.mode == CJ4_PopupMenu.LOWER) {
                    this.checklist.otherMenusOpen = true;
                    this.passengerBrief.otherMenusOpen = true;
                }
                else {
                    this.checklist.otherMenusOpen = false;
                    this.passengerBrief.otherMenusOpen = false;
                }
                break;
            case "Lwr_Push_CKLST_1":
                this.showFms = false;
                this.showPassengerBrief = false;
                this.showChecklist = !this.showChecklist;
                break;
            case "Lwr_Push_PASSBRIEF_1":
                this.showChecklist = false;
                this.showFms = false;
                this.showPassengerBrief = !this.showPassengerBrief;
                break;
            case "Lwr_Push_ESC":
                this.checklist.otherMenusOpen = false;
                this.passengerBrief.otherMenusOpen = false;
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
            this.showPassengerBrief = false;
        }
        else if (sysMode == "FMS TEXT") {
            this.isExtended = false;
            this.showFms = true;
            this.showChecklist = false;
            this.showPassengerBrief = false;
        }
        else if (sysMode == "SYSTEMS 1/2") {
            this.isExtended = false;
            this.showFms = false;
            this.showChecklist = false;
            this.showPassengerBrief = false;
        }
        else if (sysMode == "CHECKLIST") {
            this.isExtended = false;
            this.showFms = false;
            this.showChecklist = true;
            this.showPassengerBrief = false;
        }
        else if (sysMode == "PASS BRIEF") {
            this.isExtended = false;
            this.showFms = false;
            this.showChecklist = false;
            this.showPassengerBrief = true;
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
        else if (this.showPassengerBrief)
            _dict.set(CJ4_PopupMenu_Key.SYS_SRC, "PASS BRIEF");
        else
            _dict.set(CJ4_PopupMenu_Key.SYS_SRC, "SYSTEMS 1/2");
    }
}
class CJ4_FMSContainer extends NavSystemElementContainer {
    constructor(_name, _root) {
        super(_name, _root, null);
        this.isVisible = undefined;
        this.previousWaypoint = undefined;
        this._flightPlanUpdateCounter = 0;
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

        if (this.isVisible) {
            let flightPlanManager = this.gps.currFlightPlanManager;
            if (flightPlanManager) {
                this._flightPlanUpdateCounter++;
                if (this._flightPlanUpdateCounter > 120) {
                    flightPlanManager.updateFlightPlan();
                    this._flightPlanUpdateCounter = 0;
                }
                if (this._flightPlanUpdateCounter % 10 == 0) {

                    // Grab plane information
                    let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                    let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                    let aircraftPosition = new LatLong(lat, long);
                    let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
                    const FPWaypoints = flightPlanManager._waypoints[flightPlanManager._currentFlightPlanIndex];
                    const UTCTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");

                    if (FPWaypoints) {

                        let approachWaypoints = flightPlanManager.getApproachWaypoints();

                        // Grab waypoints
                        let previousWaypointIndex = flightPlanManager.getActiveWaypointIndex() - 1;
                        let previousWaypoint = flightPlanManager.getWaypoint(previousWaypointIndex);
                        let activeIndex = flightPlanManager.getActiveWaypointIndex();
                        let activeWaypoint = FPWaypoints[activeIndex];
                        let nextWaypoint = flightPlanManager.getWaypoint(activeIndex + 1);
                        let destination = flightPlanManager.getDestination();

                        if (!nextWaypoint || (nextWaypoint.ident === destination.ident))
                            nextWaypoint = flightPlanManager.getWaypoint(activeIndex + 1, NaN, true);

                        if (flightPlanManager.isActiveApproach()) {
                            if (flightPlanManager.getApproachWaypoints()) {
                                previousWaypoint = approachWaypoints[previousWaypointIndex];
                                activeWaypoint = approachWaypoints[activeIndex];
                                nextWaypoint = approachWaypoints[activeIndex + 1];
                            }
                        }

                        // Set ICAOs
                        this._previousWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ident")
                            .textContent = previousWaypoint ? previousWaypoint.ident : "----";
                        this._activeWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ident")
                            .textContent = activeWaypoint && destination && activeWaypoint.ident != destination.ident ? activeWaypoint.ident : "----";
                        this._nextWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ident")
                            .textContent = nextWaypoint && destination && nextWaypoint.ident != destination.ident && nextWaypoint.ident != "USER" ? nextWaypoint.ident : "----";
                        this._destinationWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ident")
                            .textContent = destination ? destination.ident : "----";

                        // Set distances to go
                        const previousWaypointDistance = previousWaypoint ? Avionics.Utils.computeDistance(aircraftPosition, previousWaypoint.infos.coordinates).toFixed(1) : -1;
                        const activeWaypointDistance = activeWaypoint && destination && activeWaypoint.ident != destination.ident ? Avionics.Utils.computeDistance(aircraftPosition, activeWaypoint.infos.coordinates).toFixed(1) : -1;
                        const nextWaypointDistance = nextWaypoint && destination && nextWaypoint.ident != destination.ident && activeWaypoint ? (new Number(activeWaypointDistance) + new Number(Avionics.Utils.computeDistance(activeWaypoint.infos.coordinates, nextWaypoint.infos.coordinates))).toFixed(1) : -1;
                        let destinationDistance = 0;
                        if (destination && activeWaypoint) {
                            destinationDistance += new Number(Avionics.Utils.computeDistance(aircraftPosition, activeWaypoint.infos.coordinates));
                            for (let w = activeIndex; w < FPWaypoints.length - 1; w++) {
                                destinationDistance += new Number(Avionics.Utils.computeDistance(FPWaypoints[w].infos.coordinates, FPWaypoints[w + 1].infos.coordinates));
                            }
                            destinationDistance = destinationDistance.toFixed(1);
                        }


                        this._previousWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-distance")
                            .textContent = previousWaypointDistance != -1 ? previousWaypointDistance + "NM" : "---NM";
                        this._activeWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-distance")
                            .textContent = activeWaypointDistance != -1 ? activeWaypointDistance + "NM" : "---NM";
                        this._nextWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-distance")
                            .textContent = nextWaypointDistance != -1 ? nextWaypointDistance + "NM" : "---NM";
                        this._destinationWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-distance")
                            .textContent = destinationDistance != 0 ? destinationDistance + "NM" : "---NM";

                        // Set ETE
                        let activeWaypointETEValue = "-:--";
                        if (groundSpeed >= 50 && activeWaypointDistance > 0) {
                            activeWaypointETEValue = new Date(this.calcETEseconds(activeWaypointDistance, groundSpeed) * 1000).toISOString().substr(11, 5);
                        }

                        let nextWaypointETEValue = "-:--";
                        if (groundSpeed >= 50 && nextWaypointDistance > 0) {
                            nextWaypointETEValue = new Date(this.calcETEseconds(nextWaypointDistance, groundSpeed) * 1000).toISOString().substr(11, 5);
                        }

                        let destinationWaypointETEValue = "-:--";
                        if (groundSpeed >= 50 && destinationDistance > 0) {
                            destinationWaypointETEValue = new Date(this.calcETEseconds(destinationDistance, groundSpeed) * 1000).toISOString().substr(11, 5);
                        }

                        this._activeWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ete")
                            .textContent = activeWaypointETEValue;

                        this._nextWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ete")
                            .textContent = nextWaypointETEValue;

                        this._destinationWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ete")
                            .textContent = destinationWaypointETEValue;

                        // Set ETA
                        let previousWaypointETAValue;
                        if (previousWaypoint && previousWaypoint.ident != flightPlanManager.getOrigin().ident) {
                            if (this.previousWaypoint == undefined || this.previousWaypoint.ident != previousWaypoint.ident) {
                                const seconds = Number.parseInt(UTCTime);
                                previousWaypointETAValue = Utils.SecondsToDisplayTime(seconds, true, false, false);
                                this.previousWaypoint = previousWaypoint;

                                this._previousWaypointContainer
                                    .querySelector(".cj4x-navigation-data-waypoint-eta")
                                    .textContent = previousWaypointETAValue;
                            }
                        }
                        else {
                            this._previousWaypointContainer
                                .querySelector(".cj4x-navigation-data-waypoint-eta")
                                .textContent = "--:--";
                        }


                        let activeWaypointETAValue = "--:--";
                        if (groundSpeed >= 50 && activeWaypointDistance > 0) {
                            const seconds = Number.parseInt(UTCTime) + (this.calcETEseconds(activeWaypointDistance, groundSpeed));
                            const time = Utils.SecondsToDisplayTime(seconds, true, false, false);
                            activeWaypointETAValue = time;
                        }

                        let nextWaypointETAValue = "--:--";
                        if (groundSpeed >= 50 && nextWaypointDistance > 0) {
                            const seconds = Number.parseInt(UTCTime) + (this.calcETEseconds(nextWaypointDistance, groundSpeed));
                            const time = Utils.SecondsToDisplayTime(seconds, true, false, false);
                            nextWaypointETAValue = time;
                        }

                        let destinationWaypointETAValue = "--:--";
                        if (groundSpeed >= 50 && destinationDistance > 0) {
                            const seconds = Number.parseInt(UTCTime) + (this.calcETEseconds(destinationDistance, groundSpeed));
                            const time = Utils.SecondsToDisplayTime(seconds, true, false, false);
                            destinationWaypointETAValue = time;
                        }

                        this._activeWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-eta")
                            .textContent = activeWaypointETAValue;

                        this._nextWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-eta")
                            .textContent = nextWaypointETAValue;

                        this._destinationWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-eta")
                            .textContent = destinationWaypointETAValue;


                        // Set expected fuel and gross weight
                        if (groundSpeed >= 50) {
                            const fuelFlow = (SimVar.GetSimVarValue("CJ4 FUEL FLOW:1", "Pounds per hour") + SimVar.GetSimVarValue("CJ4 FUEL FLOW:2", "Pounds per hour")) / 2;
                            const expectedFuelUsage = (fuelFlow * (this.calcETEseconds(destinationDistance, groundSpeed) / 3600)).toFixed(0);
                            const currentFuel = (SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "pounds") * SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons")).toFixed(0);
                            const expectedFuelAtDestination = (currentFuel - expectedFuelUsage).toFixed(0) < 0 ? 0 : (currentFuel - expectedFuelUsage).toFixed(0);
                            const grossWeight = SimVar.GetSimVarValue("MAX GROSS WEIGHT", "pounds");
                            // const oilQuantity = SimVar.GetSimVarValue("OIL AMOUNT", "pounds")
                            const expectedGrossWeight = expectedFuelAtDestination == 0 ? (grossWeight / 1000).toFixed(2) : ((grossWeight - expectedFuelUsage) / 1000).toFixed(2);

                            this._destinationWaypointContainer
                                .querySelector(".cj4x-navigation-data-waypoint-expected-fuel")
                                .textContent = expectedFuelAtDestination + " LB " + expectedGrossWeight + " GW";

                        }

                        if (activeWaypoint && destination) {
                            if (destination.ident == activeWaypoint.ident) {
                                this._destinationWaypointContainer
                                    .setAttribute("style", "color: magenta");
                                this._activeWaypointContainer
                                    .setAttribute("style", "color: white");
                            }
                            else {
                                this._destinationWaypointContainer
                                    .setAttribute("style", "color: white");
                                this._activeWaypointContainer
                                    .setAttribute("style", "color: magenta");
                            }
                        }
                    }
                }
            }
        }
    }
    calcETEseconds(distance, currentGroundSpeed) {
        return (distance / currentGroundSpeed) * 3600;
    }
}
class CJ4_SystemOverlayContainer extends NavSystemElementContainer {
    constructor(_name, _root) {
        super(_name, _root, null);
        this.isVisible = undefined;
        this.currentPage = 1;
    }
    init() {
        super.init();
        this.root = this.gps.getChildById(this.htmlElemId);
        if (!this.root) {
            console.log("Root component expected!");
        }
        else {
            this.showPage1();
        }
    }
    show(_value, _pageNumber) {
        if (this.isVisible != _value) {
            this.isVisible = _value;
            this.root.setAttribute("visible", (_value) ? "true" : "false");
        }
        if (this.isVisible) {
            if (_pageNumber == 1 && this.currentPage != _pageNumber) {
                this.showPage1();
                this.currentPage = 1;
            }
            else if (_pageNumber == 2 && this.currentPage != _pageNumber) {
                this.showPage2();
                this.currentPage = 2;
            }
        }
    }
    showPage1() {
        if (!this.root)
            return;

        Utils.RemoveAllChildren(this.root.querySelector(".SystemBody"));
        this.root.querySelector(".SystemHeader").textContent = "SYSTEMS 1/2";

        var rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        rootSVG.setAttribute("id", "Standard");
        rootSVG.setAttribute("viewBox", "0 0 1000 1000");
        this.root.querySelector(".SystemBody").appendChild(rootSVG);
        {
            var dcGroup = document.createElementNS(Avionics.SVG.NS, "g");
            dcGroup.setAttribute("id", "dcGroup");
            rootSVG.appendChild(dcGroup);
            var startPosX = 155;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "DC ELEC";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 110).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 50).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            dcGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 50).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 110).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            dcGroup.appendChild(lineLeft);
            var rectMarginX = 40;
            var rectWidth = 60;
            var rectHeight = 30;
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "AMP";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(titleText);
            this.DCAmpValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.DCAmpValueLeft.textContent = "0";
            this.DCAmpValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.DCAmpValueLeft.setAttribute("y", startPosY.toString());
            this.DCAmpValueLeft.setAttribute("fill", "green");
            this.DCAmpValueLeft.setAttribute("font-size", "22");
            this.DCAmpValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.DCAmpValueLeft.setAttribute("text-anchor", "end");
            this.DCAmpValueLeft.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(this.DCAmpValueLeft);
            this.DCAmpValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.DCAmpValueRight.textContent = "0";
            this.DCAmpValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.DCAmpValueRight.setAttribute("y", startPosY.toString());
            this.DCAmpValueRight.setAttribute("fill", "green");
            this.DCAmpValueRight.setAttribute("font-size", "22");
            this.DCAmpValueRight.setAttribute("font-family", "Roboto-Bold");
            this.DCAmpValueRight.setAttribute("text-anchor", "end");
            this.DCAmpValueRight.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(this.DCAmpValueRight);
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "VOLT";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(titleText);
            this.DCVoltValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.DCVoltValueLeft.textContent = "0";
            this.DCVoltValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.DCVoltValueLeft.setAttribute("y", startPosY.toString());
            this.DCVoltValueLeft.setAttribute("fill", "green");
            this.DCVoltValueLeft.setAttribute("font-size", "22");
            this.DCVoltValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.DCVoltValueLeft.setAttribute("text-anchor", "end");
            this.DCVoltValueLeft.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(this.DCVoltValueLeft);
            this.DCVoltValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.DCVoltValueRight.textContent = "0";
            this.DCVoltValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.DCVoltValueRight.setAttribute("y", startPosY.toString());
            this.DCVoltValueRight.setAttribute("fill", "green");
            this.DCVoltValueRight.setAttribute("font-size", "22");
            this.DCVoltValueRight.setAttribute("font-family", "Roboto-Bold");
            this.DCVoltValueRight.setAttribute("text-anchor", "end");
            this.DCVoltValueRight.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(this.DCVoltValueRight);
        }
        {
            var batteryGroup = document.createElementNS(Avionics.SVG.NS, "g");
            batteryGroup.setAttribute("id", "batteryGroup");
            rootSVG.appendChild(batteryGroup);
            var startPosX = 400;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "BATT";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 110).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 40).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            batteryGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 40).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 110).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            batteryGroup.appendChild(lineLeft);
            var rectMarginX = 40;
            var rectWidth = 60;
            var rectHeight = 30;
            startPosX -= 35;
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "AMP";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(titleText);
            this.BATAmpValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.BATAmpValue.textContent = "-7";
            this.BATAmpValue.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.BATAmpValue.setAttribute("y", startPosY.toString());
            this.BATAmpValue.setAttribute("fill", "green");
            this.BATAmpValue.setAttribute("font-size", "22");
            this.BATAmpValue.setAttribute("font-family", "Roboto-Bold");
            this.BATAmpValue.setAttribute("text-anchor", "end");
            this.BATAmpValue.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(this.BATAmpValue);
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "VOLT";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(titleText);
            this.BATVoltValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.BATVoltValue.textContent = "24";
            this.BATVoltValue.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.BATVoltValue.setAttribute("y", startPosY.toString());
            this.BATVoltValue.setAttribute("fill", "green");
            this.BATVoltValue.setAttribute("font-size", "22");
            this.BATVoltValue.setAttribute("font-family", "Roboto-Bold");
            this.BATVoltValue.setAttribute("text-anchor", "end");
            this.BATVoltValue.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(this.BATVoltValue);
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "TEMP °C";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(titleText);
            this.BATTempValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.BATTempValue.textContent = "0";
            this.BATTempValue.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.BATTempValue.setAttribute("y", startPosY.toString());
            this.BATTempValue.setAttribute("fill", "green");
            this.BATTempValue.setAttribute("font-size", "22");
            this.BATTempValue.setAttribute("font-family", "Roboto-Bold");
            this.BATTempValue.setAttribute("text-anchor", "end");
            this.BATTempValue.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(this.BATTempValue);
        }
        {
            var oxyGroup = document.createElementNS(Avionics.SVG.NS, "g");
            oxyGroup.setAttribute("id", "oxyGroup");
            rootSVG.appendChild(oxyGroup);
            var startPosX = 620;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "OXY PSI";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            oxyGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 80).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 50).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            oxyGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 50).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 80).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            oxyGroup.appendChild(lineLeft);
            var gaugeStartX = startPosX + 20;
            var gaugeStartY = startPosY + 25;
            var gaugeWidth = 12;
            var gaugeHeight = 125;
            this.OXYCursorX = gaugeStartX + gaugeWidth;
            this.OXYCursorY1 = gaugeStartY + gaugeHeight;
            this.OXYCursorY2 = gaugeStartY;
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", gaugeStartX.toString());
            rect.setAttribute("y", gaugeStartY.toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", (gaugeHeight * 0.75).toString());
            rect.setAttribute("fill", "green");
            oxyGroup.appendChild(rect);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", gaugeStartX.toString());
            rect.setAttribute("y", (gaugeStartY + gaugeHeight * 0.75).toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", (gaugeHeight * 0.25).toString());
            rect.setAttribute("fill", "darkorange");
            oxyGroup.appendChild(rect);
            var gradTexts = ["2400", "", "1200", "", "0"];
            var gradPercents = [0.0, 0.25, 0.5, 0.75, 1.0];
            var gradLength = [14, 10, 14, 10, 14];
            for (var i = 0; i < gradPercents.length; i++) {
                var line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("x1", (gaugeStartX - gradLength[i]).toString());
                line.setAttribute("y1", (gaugeStartY + gaugeHeight * gradPercents[i]).toString());
                line.setAttribute("x2", gaugeStartX.toString());
                line.setAttribute("y2", (gaugeStartY + gaugeHeight * gradPercents[i]).toString());
                line.setAttribute("stroke", (i == 4) ? "darkorange" : "green");
                line.setAttribute("stroke-width", "2");
                oxyGroup.appendChild(line);
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = gradTexts[i];
                text.setAttribute("x", (gaugeStartX - gradLength[i] - 10).toString());
                text.setAttribute("y", (gaugeStartY + gaugeHeight * gradPercents[i]).toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", "20");
                text.setAttribute("font-family", "Roboto-Light");
                text.setAttribute("text-anchor", "end");
                text.setAttribute("alignment-baseline", "central");
                oxyGroup.appendChild(text);
            }
            this.OXYCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.OXYCursor.setAttribute("transform", "translate (" + this.OXYCursorX + " " + this.OXYCursorY1 + ")");
            this.OXYCursor.setAttribute("fill", "green");
            this.OXYCursor.setAttribute("d", "M0 0 l15 5 l0 -10 l-15 5 Z");
            oxyGroup.appendChild(this.OXYCursor);
        }
        {
            var hydroGroup = document.createElementNS(Avionics.SVG.NS, "g");
            hydroGroup.setAttribute("id", "HydroGroup");
            rootSVG.appendChild(hydroGroup);
            var startPosX = 840;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "HYD";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            hydroGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 110).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 40).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            hydroGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 40).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 110).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            hydroGroup.appendChild(lineLeft);
            var rectMarginX = 40;
            var rectWidth = 60;
            var rectHeight = 30;
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "PSI";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            hydroGroup.appendChild(titleText);
            this.HYDPSIValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.HYDPSIValueLeft.textContent = "0";
            this.HYDPSIValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.HYDPSIValueLeft.setAttribute("y", startPosY.toString());
            this.HYDPSIValueLeft.setAttribute("fill", "green");
            this.HYDPSIValueLeft.setAttribute("font-size", "22");
            this.HYDPSIValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.HYDPSIValueLeft.setAttribute("text-anchor", "end");
            this.HYDPSIValueLeft.setAttribute("alignment-baseline", "central");
            hydroGroup.appendChild(this.HYDPSIValueLeft);
            this.HYDPSIValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.HYDPSIValueRight.textContent = "0";
            this.HYDPSIValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.HYDPSIValueRight.setAttribute("y", startPosY.toString());
            this.HYDPSIValueRight.setAttribute("fill", "green");
            this.HYDPSIValueRight.setAttribute("font-size", "22");
            this.HYDPSIValueRight.setAttribute("font-family", "Roboto-Bold");
            this.HYDPSIValueRight.setAttribute("text-anchor", "end");
            this.HYDPSIValueRight.setAttribute("alignment-baseline", "central");
            hydroGroup.appendChild(this.HYDPSIValueRight);
        }
        {
            var fuelGroup = document.createElementNS(Avionics.SVG.NS, "g");
            fuelGroup.setAttribute("id", "FuelGroup");
            rootSVG.appendChild(fuelGroup);
            var startPosX = 840;
            var startPosY = 110;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "FUEL";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 110).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 40).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            fuelGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 40).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 110).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            fuelGroup.appendChild(lineLeft);
            var rectMarginX = 40;
            var rectWidth = 60;
            var rectHeight = 30;
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "PPH";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(titleText);
            this.FUELPPHValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.FUELPPHValueLeft.textContent = "0";
            this.FUELPPHValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.FUELPPHValueLeft.setAttribute("y", startPosY.toString());
            this.FUELPPHValueLeft.setAttribute("fill", "green");
            this.FUELPPHValueLeft.setAttribute("font-size", "22");
            this.FUELPPHValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.FUELPPHValueLeft.setAttribute("text-anchor", "end");
            this.FUELPPHValueLeft.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FUELPPHValueLeft);
            this.FUELPPHValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.FUELPPHValueRight.textContent = "0";
            this.FUELPPHValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.FUELPPHValueRight.setAttribute("y", startPosY.toString());
            this.FUELPPHValueRight.setAttribute("fill", "green");
            this.FUELPPHValueRight.setAttribute("font-size", "22");
            this.FUELPPHValueRight.setAttribute("font-family", "Roboto-Bold");
            this.FUELPPHValueRight.setAttribute("text-anchor", "end");
            this.FUELPPHValueRight.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FUELPPHValueRight);
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "°C";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(titleText);
            this.FUELTempValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.FUELTempValueLeft.textContent = "15";
            this.FUELTempValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.FUELTempValueLeft.setAttribute("y", startPosY.toString());
            this.FUELTempValueLeft.setAttribute("fill", "green");
            this.FUELTempValueLeft.setAttribute("font-size", "22");
            this.FUELTempValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.FUELTempValueLeft.setAttribute("text-anchor", "end");
            this.FUELTempValueLeft.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FUELTempValueLeft);
            this.FUELTempValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.FUELTempValueRight.textContent = "15";
            this.FUELTempValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.FUELTempValueRight.setAttribute("y", startPosY.toString());
            this.FUELTempValueRight.setAttribute("fill", "green");
            this.FUELTempValueRight.setAttribute("font-size", "22");
            this.FUELTempValueRight.setAttribute("font-family", "Roboto-Bold");
            this.FUELTempValueRight.setAttribute("text-anchor", "end");
            this.FUELTempValueRight.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FUELTempValueRight);
        }
    }
    showPage2() {
        if (!this.root)
            return;
        Utils.RemoveAllChildren(this.root.querySelector(".SystemBody"));
        this.root.querySelector(".SystemHeader").textContent = "SYSTEMS 2/2";

        var rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        rootSVG.setAttribute("id", "Minimized");
        rootSVG.setAttribute("viewBox", "0 0 1000 1000");
        this.root.querySelector(".SystemBody").appendChild(rootSVG);
        {
            var trimGroup = document.createElementNS(Avionics.SVG.NS, "g");
            trimGroup.setAttribute("id", "TrimGroup");
            rootSVG.appendChild(trimGroup);
            var startPosX = 55;
            var startPosY = 30;
            var blockPosX = startPosX;
            var blockPosY = startPosY;
            var lineSize = 15;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", blockPosX.toString());
            line.setAttribute("y1", blockPosY.toString());
            line.setAttribute("x2", (blockPosX + lineSize).toString());
            line.setAttribute("y2", blockPosY.toString());
            line.setAttribute("stroke", "white");
            line.setAttribute("stroke-width", "2");
            trimGroup.appendChild(line);
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", blockPosX.toString());
            line.setAttribute("y1", blockPosY.toString());
            line.setAttribute("x2", blockPosX.toString());
            line.setAttribute("y2", (blockPosY + lineSize).toString());
            line.setAttribute("stroke", "white");
            line.setAttribute("stroke-width", "2");
            trimGroup.appendChild(line);
            var textStartY = blockPosY + lineSize + 15;
            var textSpacingY = 18;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "T";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", (textStartY + textSpacingY * 0).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "20");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "R";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", (textStartY + textSpacingY * 1).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "20");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "I";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", (textStartY + textSpacingY * 2).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "20");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "M";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", (textStartY + textSpacingY * 3).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "20");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var lineStartY = (textStartY + textSpacingY * 3) + 15;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", blockPosX.toString());
            line.setAttribute("y1", lineStartY.toString());
            line.setAttribute("x2", blockPosX.toString());
            line.setAttribute("y2", (lineStartY + lineSize).toString());
            line.setAttribute("stroke", "white");
            line.setAttribute("stroke-width", "2");
            trimGroup.appendChild(line);
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", blockPosX.toString());
            line.setAttribute("y1", (lineStartY + lineSize).toString());
            line.setAttribute("x2", (blockPosX + lineSize).toString());
            line.setAttribute("y2", (lineStartY + lineSize).toString());
            line.setAttribute("stroke", "white");
            line.setAttribute("stroke-width", "2");
            trimGroup.appendChild(line);

            {
                blockPosX = startPosX + 160;
                blockPosY = startPosY + 25;
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "AIL";
                text.setAttribute("x", blockPosX.toString());
                text.setAttribute("y", blockPosY.toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", "20");
                text.setAttribute("font-family", "Roboto-Light");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                trimGroup.appendChild(text);
                blockPosY += 30;
                var gaugeWidth = 120;
                var gaugeHeight = 11;
                var rect = document.createElementNS(Avionics.SVG.NS, "rect");
                rect.setAttribute("x", (blockPosX - gaugeWidth * 0.5).toString());
                rect.setAttribute("y", blockPosY.toString());
                rect.setAttribute("width", gaugeWidth.toString());
                rect.setAttribute("height", gaugeHeight.toString());
                rect.setAttribute("fill", "black");
                rect.setAttribute("stroke", "white");
                rect.setAttribute("stroke-width", "2");
                trimGroup.appendChild(rect);
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "L";
                text.setAttribute("x", (blockPosX - gaugeWidth * 0.5 - 10).toString());
                text.setAttribute("y", (blockPosY + gaugeHeight * 0.5).toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", "20");
                text.setAttribute("font-family", "Roboto-Light");
                text.setAttribute("text-anchor", "end");
                text.setAttribute("alignment-baseline", "central");
                trimGroup.appendChild(text);
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "R";
                text.setAttribute("x", (blockPosX + gaugeWidth * 0.5 + 10).toString());
                text.setAttribute("y", (blockPosY + gaugeHeight * 0.5).toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", "20");
                text.setAttribute("font-family", "Roboto-Light");
                text.setAttribute("text-anchor", "start");
                text.setAttribute("alignment-baseline", "central");
                trimGroup.appendChild(text);
                var rect = document.createElementNS(Avionics.SVG.NS, "rect");
                rect.setAttribute("x", (blockPosX - gaugeWidth * 0.15).toString());
                rect.setAttribute("y", blockPosY.toString());
                rect.setAttribute("width", (gaugeWidth * 0.15).toString());
                rect.setAttribute("height", gaugeHeight.toString());
                rect.setAttribute("fill", "green");
                trimGroup.appendChild(rect);
                var rect = document.createElementNS(Avionics.SVG.NS, "rect");
                rect.setAttribute("x", blockPosX.toString());
                rect.setAttribute("y", blockPosY.toString());
                rect.setAttribute("width", (gaugeWidth * 0.15).toString());
                rect.setAttribute("height", gaugeHeight.toString());
                rect.setAttribute("fill", "green");
                trimGroup.appendChild(rect);
                this.AileronCursorX1 = blockPosX - gaugeWidth * 0.5;
                this.AileronCursorX2 = blockPosX + gaugeWidth * 0.5;
                this.AileronCursorY = blockPosY;
                this.AileronCursor = document.createElementNS(Avionics.SVG.NS, "path");
                this.AileronCursor.setAttribute("transform", "translate (" + this.AileronCursorX1 + " " + this.AileronCursorY + ")");
                this.AileronCursor.setAttribute("fill", "white");
                this.AileronCursor.setAttribute("d", "M0 0 l-5 -15 l10 0 l-5 15 Z");
                trimGroup.appendChild(this.AileronCursor);
            }

            {
                blockPosX = startPosX + 310 + 110;
                blockPosY = startPosY + 25;
                blockPosY += 30;
                var gaugeWidth = 120;
                var gaugeHeight = 11;
                var rect = document.createElementNS(Avionics.SVG.NS, "rect");
                rect.setAttribute("x", (blockPosX - gaugeWidth * 0.5).toString());
                rect.setAttribute("y", blockPosY.toString());
                rect.setAttribute("width", gaugeWidth.toString());
                rect.setAttribute("height", gaugeHeight.toString());
                rect.setAttribute("fill", "black");
                rect.setAttribute("stroke", "white");
                rect.setAttribute("stroke-width", "2");
                trimGroup.appendChild(rect);
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "L";
                text.setAttribute("x", (blockPosX - gaugeWidth * 0.5 - 10).toString());
                text.setAttribute("y", (blockPosY + gaugeHeight * 0.5).toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", "20");
                text.setAttribute("font-family", "Roboto-Light");
                text.setAttribute("text-anchor", "end");
                text.setAttribute("alignment-baseline", "central");
                trimGroup.appendChild(text);
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "R";
                text.setAttribute("x", (blockPosX + gaugeWidth * 0.5 + 10).toString());
                text.setAttribute("y", (blockPosY + gaugeHeight * 0.5).toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", "20");
                text.setAttribute("font-family", "Roboto-Light");
                text.setAttribute("text-anchor", "start");
                text.setAttribute("alignment-baseline", "central");
                trimGroup.appendChild(text);
                var rect = document.createElementNS(Avionics.SVG.NS, "rect");
                rect.setAttribute("x", (blockPosX - gaugeWidth * 0.15).toString());
                rect.setAttribute("y", blockPosY.toString());
                rect.setAttribute("width", (gaugeWidth * 0.15).toString());
                rect.setAttribute("height", gaugeHeight.toString());
                rect.setAttribute("fill", "green");
                trimGroup.appendChild(rect);
                var rect = document.createElementNS(Avionics.SVG.NS, "rect");
                rect.setAttribute("x", blockPosX.toString());
                rect.setAttribute("y", blockPosY.toString());
                rect.setAttribute("width", (gaugeWidth * 0.15).toString());
                rect.setAttribute("height", gaugeHeight.toString());
                rect.setAttribute("fill", "green");
                trimGroup.appendChild(rect);
                this.RudderCursorX1 = blockPosX - gaugeWidth * 0.5;
                this.RudderCursorX2 = blockPosX + gaugeWidth * 0.5;
                this.RudderCursorY = blockPosY + gaugeHeight;
                this.RudderCursor = document.createElementNS(Avionics.SVG.NS, "path");
                this.RudderCursor.setAttribute("transform", "translate (" + this.RudderCursorX1 + " " + this.RudderCursorY + ")");
                this.RudderCursor.setAttribute("fill", "white");
                this.RudderCursor.setAttribute("d", "M0 0 l-5 15 l10 0 l-5 -15 Z");
                trimGroup.appendChild(this.RudderCursor);
                blockPosY += 30 + gaugeHeight;
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "RUD";
                text.setAttribute("x", blockPosX.toString());
                text.setAttribute("y", blockPosY + 2);
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", "20");
                text.setAttribute("font-family", "Roboto-Light");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                trimGroup.appendChild(text);
            }

            {
                blockPosX = startPosX + 280 + 110 + 180 + 120;
                blockPosY = startPosY + 10;
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "ELEV";
                text.setAttribute("x", (blockPosX - 80).toString());
                text.setAttribute("y", blockPosY.toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", "22");
                text.setAttribute("font-family", "Roboto-Light");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                trimGroup.appendChild(text);

                this.AileronRadians = document.createElementNS(Avionics.SVG.NS, "text");
                this.AileronRadians.textContent = "2.6";
                this.AileronRadians.setAttribute("x", (blockPosX + 80).toString());
                this.AileronRadians.setAttribute("y", blockPosY.toString());
                this.AileronRadians.setAttribute("fill", "white");
                this.AileronRadians.setAttribute("font-size", "22");
                this.AileronRadians.setAttribute("font-family", "Roboto-Light");
                this.AileronRadians.setAttribute("text-anchor", "middle");
                this.AileronRadians.setAttribute("alignment-baseline", "central");
                trimGroup.appendChild(this.AileronRadians);

                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "ND";
                text.setAttribute("x", (blockPosX + 6).toString());
                text.setAttribute("y", blockPosY.toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", "20");
                text.setAttribute("font-family", "Roboto-Light");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("alignment-baseline", "central");
                trimGroup.appendChild(text);
                var gaugeStartX = blockPosX;
                var gaugeStartY = blockPosY + 19;
                var gaugeWidth = 11;
                var gaugeHeight = 85;
                var rect = document.createElementNS(Avionics.SVG.NS, "rect");
                rect.setAttribute("x", gaugeStartX.toString());
                rect.setAttribute("y", gaugeStartY.toString());
                rect.setAttribute("width", gaugeWidth.toString());
                rect.setAttribute("height", gaugeHeight.toString());
                rect.setAttribute("fill", "black");
                rect.setAttribute("stroke", "white");
                rect.setAttribute("stroke-width", "2");
                trimGroup.appendChild(rect);
                var rect = document.createElementNS(Avionics.SVG.NS, "rect");
                rect.setAttribute("x", gaugeStartX.toString());
                rect.setAttribute("y", (gaugeStartY + gaugeHeight * 0.25).toString());
                rect.setAttribute("width", gaugeWidth.toString());
                rect.setAttribute("height", (gaugeHeight * 0.25).toString());
                rect.setAttribute("fill", "green");
                trimGroup.appendChild(rect);


                this.ElevatorCursorRX = gaugeStartX + gaugeWidth;
                this.ElevatorCursorRY1 = gaugeStartY + gaugeHeight;
                this.ElevatorCursorRY2 = gaugeStartY;
                this.ElevatorCursorR = document.createElementNS(Avionics.SVG.NS, "path");
                this.ElevatorCursorR.setAttribute("transform", "translate (" + this.ElevatorCursorRX + " " + this.ElevatorCursorRY2 + ")");
                this.ElevatorCursorR.setAttribute("fill", "white");
                this.ElevatorCursorR.setAttribute("d", "M0 0 l15 -5 l0 10 l-15 -5 Z");
                trimGroup.appendChild(this.ElevatorCursorR);

                this.ElevatorTextR = document.createElementNS(Avionics.SVG.NS, "text");
                this.ElevatorTextR.textContent = "R";
                this.ElevatorTextR.setAttribute("x", (this.ElevatorCursorRX + 25).toString());
                this.ElevatorTextR.setAttribute("y", (this.ElevatorCursorRY2 + ((this.ElevatorCursorRY1 - this.ElevatorCursorRY2) * 0.50)).toString());
                this.ElevatorTextR.setAttribute("fill", "white");
                this.ElevatorTextR.setAttribute("font-size", "20");
                this.ElevatorTextR.setAttribute("font-family", "Roboto-Light");
                this.ElevatorTextR.setAttribute("text-anchor", "middle");
                this.ElevatorTextR.setAttribute("alignment-baseline", "central");
                trimGroup.appendChild(this.ElevatorTextR);


                this.ElevatorCursorLX = (gaugeStartX - gaugeWidth) + 11;
                this.ElevatorCursorLY2 = gaugeStartY;
                this.ElevatorCursorL = document.createElementNS(Avionics.SVG.NS, "path");
                this.ElevatorCursorL.setAttribute("transform", "translate (" + this.ElevatorCursorLX + " " + this.ElevatorCursorLY2 + ")");
                this.ElevatorCursorL.setAttribute("fill", "white");
                this.ElevatorCursorL.setAttribute("d", "M0 0 l-15 5 l0 -10 l15 5 Z");
                trimGroup.appendChild(this.ElevatorCursorL);

                this.ElevatorTextL = document.createElementNS(Avionics.SVG.NS, "text");
                this.ElevatorTextL.textContent = "L";
                this.ElevatorTextL.setAttribute("x", (this.ElevatorCursorLX - 25).toString());
                this.ElevatorTextL.setAttribute("y", (this.ElevatorCursorRY2 + ((this.ElevatorCursorRY1 - this.ElevatorCursorRY2) * 0.50)).toString());
                this.ElevatorTextL.setAttribute("fill", "white");
                this.ElevatorTextL.setAttribute("font-size", "20");
                this.ElevatorTextL.setAttribute("font-family", "Roboto-Light");
                this.ElevatorTextL.setAttribute("text-anchor", "middle");
                this.ElevatorTextL.setAttribute("alignment-baseline", "central");
                trimGroup.appendChild(this.ElevatorTextL);

                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = "NU";
                text.setAttribute("x", (blockPosX + 18).toString());
                text.setAttribute("y", (gaugeStartY + gaugeHeight + 28).toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", "20");
                text.setAttribute("font-family", "Roboto-Light");
                text.setAttribute("text-anchor", "end");
                text.setAttribute("alignment-baseline", "bottom");
                trimGroup.appendChild(text);
            }
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);

        if (!this.root)
            return;

        if (this.isVisible) {
            if (this.currentPage == 1) {
                let GenAmp1 = SimVar.GetSimVarValue("ELECTRICAL GENALT BUS AMPS:1", "amperes");
                this.DCAmpValueLeft.textContent = Math.round(GenAmp1).toString();
                let GenAmp2 = SimVar.GetSimVarValue("ELECTRICAL GENALT BUS AMPS:2", "amperes");
                this.DCAmpValueRight.textContent = Math.round(GenAmp2).toString();
                let GenVolt1 = SimVar.GetSimVarValue("ELECTRICAL GENALT BUS VOLTAGE:1", "volts");
                this.DCVoltValueLeft.textContent = Math.round(GenVolt1).toString();
                let GenVolt2 = SimVar.GetSimVarValue("ELECTRICAL GENALT BUS VOLTAGE:2", "volts");
                this.DCVoltValueRight.textContent = Math.round(GenVolt2).toString();
                let BatAmp = SimVar.GetSimVarValue("ELECTRICAL BATTERY LOAD:1", "amperes");
                this.BATAmpValue.textContent = Math.round(BatAmp).toString();
                let BatVolt = SimVar.GetSimVarValue("ELECTRICAL BATTERY VOLTAGE:1", "volts");
                this.BATVoltValue.textContent = Math.round(BatVolt).toString();
                this.BATTempValue.textContent = "--";
                let HydPSI1 = SimVar.GetSimVarValue("ENG HYDRAULIC PRESSURE:1", "psi");
                this.HYDPSIValueLeft.textContent = Math.round(HydPSI1).toString();
                let HydPSI2 = SimVar.GetSimVarValue("ENG HYDRAULIC PRESSURE:2", "psi");
                this.HYDPSIValueRight.textContent = Math.round(HydPSI2).toString();
                let PPHEng1 = SimVar.GetSimVarValue("CJ4 FUEL FLOW:1", "Pounds per hour");
                this.FUELPPHValueLeft.textContent = Math.round(PPHEng1).toString();
                let PPHEng2 = SimVar.GetSimVarValue("CJ4 FUEL FLOW:2", "Pounds per hour");
                this.FUELPPHValueRight.textContent = Math.round(PPHEng2).toString();
                this.FUELTempValueLeft.textContent = "--";
                this.FUELTempValueRight.textContent = "--";
            }
            else if (this.currentPage == 2) {
                let AilPct = (SimVar.GetSimVarValue("AILERON TRIM PCT", "percent over 100") + 1.0) * 0.5;
                let ail_x = this.AileronCursorX1 + (this.AileronCursorX2 - this.AileronCursorX1) * AilPct;
                this.AileronCursor.setAttribute("transform", "translate (" + ail_x + " " + this.AileronCursorY + ")");
                let RudPct = (SimVar.GetSimVarValue("RUDDER TRIM PCT", "percent over 100") + 1.0) * 0.5;
                let rud_x = this.RudderCursorX1 + (this.RudderCursorX2 - this.RudderCursorX1) * RudPct;
                this.RudderCursor.setAttribute("transform", "translate (" + rud_x + " " + this.RudderCursorY + ")");
                let ElevPct = (SimVar.GetSimVarValue("ELEVATOR TRIM PCT", "percent over 100") + 1.0) * 0.5;
                let elev_y = this.ElevatorCursorRY1 + (this.ElevatorCursorRY2 - this.ElevatorCursorRY1) * ElevPct;
                this.ElevatorCursorR.setAttribute("transform", "translate (" + this.ElevatorCursorRX + " " + elev_y + ")");
                this.ElevatorCursorL.setAttribute("transform", "translate (" + this.ElevatorCursorLX + " " + elev_y + ")");
                let ailRadians = (SimVar.GetSimVarValue("ELEVATOR TRIM POSITION", "radian"));
                this.AileronRadians.textContent = (ailRadians * 180 / Math.PI).toFixed(1).toString();
            }
        }
    }
}
registerInstrument("cj4-mfd-element", CJ4_MFD);

//# sourceMappingURL=CJ4_MFD.js.map