class WT_Flight_Plan {
    /**
     * @param {FlightPlanManager} flightPlan 
     */
    constructor(flightPlan) {
        this.flightPlan = flightPlan;
    }
    getWaypoints() {

    }
}

class WT_Flight_Plan_View_Menu extends WT_Soft_Key_Menu {
    constructor(model, view) {
        super(false);

        let buttons = {
            wide: new WT_Soft_Key("WIDE", () => model.viewMode.value = "wide"),
            narrow: new WT_Soft_Key("NARROW", () => model.viewMode.value = "narrow"),
            leg: new WT_Soft_Key("LEG-LEG", () => model.distanceMode.value = "leg"),
            cumulative: new WT_Soft_Key("CUM", () => model.distanceMode.value = "cumulative"),
        }

        model.viewMode.subscribe(mode => {
            buttons.wide.selected = mode == "wide";
            buttons.narrow.selected = mode == "narrow";
        });
        model.distanceMode.subscribe(mode => {
            buttons.leg.selected = mode == "leg";
            buttons.cumulative.selected = mode == "cumulative";
        });

        this.addSoftKey(5, buttons.wide);
        this.addSoftKey(6, buttons.narrow);
        this.addSoftKey(8, buttons.leg);
        this.addSoftKey(9, buttons.cumulative);
        this.addSoftKey(11, new WT_Soft_Key("BACK", () => view.softKeyBack()));
    }
}

class WT_Flight_Plan_Main_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_Flight_Plan_Page_Model} model 
     * @param {WT_Flight_Plan_Page_View} view 
     */
    constructor(model, view) {
        super()
        this.addSoftKey(4, new WT_Soft_Key("NEW WPT", view.showCreateNewWaypoint.bind(view)));
        this.addSoftKey(5, new WT_Soft_Key("VIEW", view.showViewMenu.bind(view)));
        this.addSoftKey(6, new WT_Soft_Key("VNV PROF"));
        this.addSoftKey(7, new WT_Soft_Key("CNCL VNV"));
        this.addSoftKey(8, new WT_Soft_Key("VNV ->"));
        this.addSoftKey(9, new WT_Soft_Key("ATK OFST"));
        this.addSoftKey(10, new WT_Soft_Key("ACT LEG", model.setActiveWaypoint.bind(model)));
        this.addSoftKey(11, new WT_Soft_Key("SHW CHRT"));
    }
}

class WT_Flight_Plan_Line extends WT_HTML_View {

}

class WT_Flight_Plan_Waypoint_Line extends WT_Flight_Plan_Line {
    constructor() {
        super();

        this.innerHTML = `
        <div></div>
        <div class="ident selectable" data-element="ident"></div>
        <div class="dtk" data-element="dtk"></div>
        <div class="distance"><span data-element="distance"></span><span class="units-small">NM</span></div>
        <div class="altitude"><numeric-input digits="5" units="FT" value="0" class="altitude" data-element="altitude" empty="_____"></numeric-input></div>
        <div class="fuel"><span data-element="fod"></span><span class="units-small">GL</span></div>
        <div class="ete" data-element="ete"></div>
        <div class="eta" data-element="eta"></div>
        <div class="bearing" data-element="bearing"></div>`;

        this.bindElements();

        DOMUtilities.AddScopedEventListener(this, ".ident, .altitude numeric-input", "highlighted", e => {
            e.stopPropagation();
            let evt = new CustomEvent(WT_Flight_Plan_Waypoint_Line.EVENT_WAYPOINT_SELECTED, {
                bubbles: true,
                detail: {
                    waypointIndex: this.waypointIndex
                }
            });
            this.dispatchEvent(evt);
        });

        this.querySelector(".altitude numeric-input").addEventListener("change", e => {
            const node = e.target;
            const evt = new CustomEvent(WT_Flight_Plan_Waypoint_Line.EVENT_ALTITUDE_CHANGED, {
                bubbles: true,
                detail: {
                    waypointIndex: this.waypointIndex,
                    altitude: node.value
                }
            });
            this.dispatchEvent(evt);
        });
    }
    secondsToDuration(v) {
        const hours = Math.floor(v / 3600);
        const minutes = Math.floor((v % 3600) / 60);
        return `${hours.toFixed(0).padStart(2, "0")}:${minutes.toFixed(0).padStart(2, "0")}`;
    }
    secondsToZulu(v) {
        const hours = Math.floor(v / 3600);
        const minutes = Math.floor((v % 3600) / 60);
        return `${hours.toFixed(0).padStart(2, "0")}:${minutes.toFixed(0).padStart(2, "0")}`;
    }
    set type(type) {
        this.dataset.type = type;
    }
    get coordinates() {
        return this.waypoint.infos.coordinates;
    }
    set line(line) {
        this.dataset.altitudeMode = line.legAltitudeDescription;
        this.dataset.altitude1 = line.legAltitude1;
        this.dataset.altitude2 = line.legAltitude2;

        this.lineIndex = line.lineIndex;
        this.waypointIndex = line.waypointIndex;
        this.ident = line.ident;
        this.dtk = line.dtk;
        this.distance = line.distance;
        this.bearing = line.bearing;
        this.ete = line.ete;
        this.eta = line.eta;
        this.fod = line.fod;
        this.altitude = line.altitude;
    }
    get ident() {
        return this._ident;
    }
    set ident(ident) {
        this._ident = ident;
        this.elements.ident.textContent = ident;
    }
    set dtk(dtk) {
        this.elements.dtk.textContent = dtk != null ? (Math.floor(dtk) + "°") : "___°";
    }
    set distance(distance) {
        this.elements.distance.textContent = distance != null ? distance.toFixed(distance < 10 ? 1 : 0) : "____";
    }
    set altitude(altitude) {
        const newValue = altitude > 0 ? Math.floor(altitude) : null;
        if (this.elements.altitude.value + newValue) {
            this.elements.altitude.value = newValue;
        }
    }
    set fod(fod) {
        this.elements.fod.textContent = fod != null ? Math.floor(fod, 1) : "";
    }
    set ete(ete) {
        this.elements.ete.textContent = ete != null ? this.secondsToDuration(ete) : "";
    }
    set eta(eta) {
        this.elements.eta.textContent = eta != null ? this.secondsToZulu(eta) : "";
    }
    set bearing(bearing) {
        this.elements.bearing.textContent = bearing != null ? Math.floor(bearing) + "°" : "";
    }
}
WT_Flight_Plan_Waypoint_Line.EVENT_ALTITUDE_CHANGED = "altitude_changed";
WT_Flight_Plan_Waypoint_Line.EVENT_WAYPOINT_DELETED = "waypoint_deleted";
WT_Flight_Plan_Waypoint_Line.EVENT_WAYPOINT_SELECTED = "waypoint_selected";
customElements.define("g1000-flight-plan-waypoint-line", WT_Flight_Plan_Waypoint_Line);

class WT_Flight_Plan_Header_Line extends WT_Flight_Plan_Line {
    constructor() {
        super();
        this.classList.add("selectable");
    }
    connectedCallback() {
        super.connectedCallback();
        this.setAttribute("data-selectable", "flight-plan");
    }
    set line(line) {
        this.type = line.procedureType;
        this.text = line.text;
    }
    set type(type) {
        this.setAttribute("type", type);
    }
    get type() {
        return this.getAttribute("type");
    }
    set text(text) {
        this.textContent = text;
    }
}
customElements.define("g1000-flight-plan-header-line", WT_Flight_Plan_Header_Line);

class WT_Flight_Plan_View_Line_Factory {
    createWaypointLine() {

    }
}

class WT_MFD_Flight_Plan_Page_View extends WT_Flight_Plan_Page_View {
    /**
     * @param {MapInstrument} map 
     * @param {WT_Soft_Key_Controller} softKeyController 
     * @param {WT_Show_Page_Menu_Handler} pageMenuHandler
     * @param {WT_Show_Confirm_Dialog_Handler} confirmDialogHandler
     * @param {WT_Show_New_Waypoint_Handler} newWaypointHandler
     */
    constructor(map, softKeyController, pageMenuHandler, confirmDialogHandler, newWaypointHandler) {
        super();

        this.map = map;
        this.softKeyController = softKeyController;
        this.pageMenuHandler = pageMenuHandler;
        this.confirmDialogHandler = confirmDialogHandler;
        this.newWaypointHandler = newWaypointHandler;

        this.inputLayer = new WT_Flight_Plan_Input_Layer(this);

        this.waypointLines = [];
        this.headerLines = [];
        this.activeLeg = null;

        DOMUtilities.AddScopedEventListener(this, "g1000-flight-plan-waypoint-line", WT_Flight_Plan_Waypoint_Line.EVENT_ALTITUDE_CHANGED, e => {
            this.model.setAltitude(e.detail.waypointIndex, e.detail.altitude);
        });

        DOMUtilities.AddScopedEventListener(this, "g1000-flight-plan-waypoint-line .ident", "selected", e => {
            this.showCreateNewWaypoint(e.detail.element.parentNode.waypointIndex);
        });

        DOMUtilities.AddScopedEventListener(this, "g1000-flight-plan-waypoint-line", WT_Flight_Plan_Waypoint_Line.EVENT_WAYPOINT_SELECTED, DOMUtilities.debounce(e => {
            this.model.setSelectedWaypointIndex(e.detail.waypointIndex);
            this.centerOnLeg(e.detail.waypointIndex);
        }, 500, false));
    }
    /**
     * @param {WT_Flight_Plan_Page_Model} model 
     */
    setModel(model) {
        this.model = model;
        model.lines.subscribe(this.updateLines.bind(this));
        this.activeLegSubscription = model.activeLeg.subscribe(this.updateActiveLeg.bind(this));

        model.viewMode.subscribe(viewMode => this.setAttribute("view-mode", viewMode));

        this.pageMenu = new WT_Flight_Plan_Page_Menu(model, this, this.confirmDialogHandler);

        this.softKeyMenus = {
            main: new WT_Flight_Plan_Main_Menu(this.model, this),
            view: new WT_Flight_Plan_View_Menu(this.model, this),
        }
    }
    updateLines(lines) {
        const lineElements = [];

        let waypointLineIndex = 0;
        let headerLineIndex = 0;
        const waypointLines = [];
        const headerLines = [];
        for (const line of lines) {
            switch (line.type) {
                case "waypoint": {
                    const element = this.waypointLines[waypointLineIndex++] || new WT_Flight_Plan_Waypoint_Line();
                    element.line = line;
                    waypointLines.push(element);
                    lineElements.push(element);
                    break;
                }
                case "header": {
                    const element = this.headerLines[headerLineIndex++] || new WT_Flight_Plan_Header_Line();
                    element.line = line;
                    headerLines.push(element);
                    lineElements.push(element);
                }
            }
        }

        this.waypointLines = waypointLines;
        this.headerLines = headerLines;

        lineElements.unshift(this.elements.activeLegMarker);
        lineElements.push(this.elements.newWaypointLine);
        DOMUtilities.repopulateElement(this.elements.flightPlanWaypoints, lineElements);
    }
    handleDelete() {
        let selectedElement = this.inputLayer.selectedElement;
        if (!selectedElement)
            return;
        let waypointLine = DOMUtilities.GetClosestParent(selectedElement, "G1000-FLIGHT-PLAN-WAYPOINT-LINE");
        if (waypointLine) {
            this.confirmDialogHandler.show(`Remove ${waypointLine.ident}?`).then(() => this.model.deleteWaypoint(waypointLine.index))
        } else if (selectedElement.tagName == "G1000-FLIGHT-PLAN-HEADER-LINE") {
            switch (selectedElement.type) {
                case "departure":
                    this.model.deleteDeparture();
                    break;
                case "arrival":
                    this.model.deleteArrival();
                    break;
                case "approach":
                    this.model.deleteApproach();
                    break;
            }
        }
    }
    showPageMenu() {
        this.pageMenuHandler.show(this.pageMenu);
    }
    showCreateNewWaypoint(index = -1) {
        this.newWaypointHandler.show().then(icao => {
            this.model.createNewWaypoint(icao, index);
        });
    }
    waypointIndexToLineIndex(waypointIndex) {
        if (this.waypointLines[waypointIndex]) {
            return this.waypointLines[waypointIndex].lineIndex;
        } else {
            return null;
        }
    }
    updateActiveLeg(leg) {
        if (leg) {
            const beginIndex = this.waypointIndexToLineIndex(leg.origin + (leg.originIsApproach ? this.approachIndex : 0));
            const endIndex = this.waypointIndexToLineIndex(leg.destination + (leg.destinationIsApproach ? this.approachIndex : 0));
            if (beginIndex !== null && endIndex !== null) {
                this.elements.activeLegMarker.style.gridRowStart = beginIndex + 1;
                this.elements.activeLegMarker.style.gridRowEnd = endIndex + 2;
                this.elements.activeLegMarker.style.visibility = "visible";
            } else {
                this.elements.activeLegMarker.style.visibility = "hidden";
            }
        } else {
            this.elements.activeLegMarker.style.visibility = "hidden";
        }
        this.activeLeg = leg;
    }
    centerOnLeg(waypointIndex) {
        const waypoints = this.model.flightPlan.getWaypoints();
        const centerOn = [waypoints[waypointIndex].infos.coordinates];
        if (waypointIndex > 0) {
            centerOn.push(waypoints[waypointIndex - 1].infos.coordinates);
        }
        this.map.centerOnCoordinates(centerOn, centerOn.length > 1 ? null : 20);
    }
    softKeyBack() {
        this.softKeyController.setMenu(this.softKeyMenus.main);
    }
    showMainMenu() {
        this.previousMenu = this.softKeyController.currentMenu;
        this.softKeyController.setMenu(this.softKeyMenus.main);
    }
    showViewMenu() {
        this.softKeyController.setMenu(this.softKeyMenus.view);
    }
    restoreMenu() {
        this.softKeyController.setMenu(this.previousMenu);
    }
    connectedCallback() {
        let template = document.getElementById('flight-plan-page');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();
    }
    update(dt) {
        if (!this.time)
            this.time = dt;
        this.time += dt;
        if (this.time > 100) {
            this.model.updateWaypoints();
            this.time = 0;
        }
    }
    back() {
        this.exit();
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle = this.inputStackHandle.pop();
        }
    }
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
    }
    activate() {
        this.showMainMenu();
        this.elements.map.appendChild(this.map);
    }
    deactivate() {
        console.log("FlightPlanView.deactivate");
        this.restoreMenu();
        this.elements.map.removeChild(this.map);
        if (this.activeLegSubscription) {
            this.activeLegSubscription = this.activeLegSubscription();
        }
    }
}
customElements.define("g1000-flight-plan-page", WT_MFD_Flight_Plan_Page_View);