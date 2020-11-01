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
    constructor(view) {
        super();
        this._index = null;
        this._waypoint = null;
        this.view = view;

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
                    waypointIndex: this.index
                }
            });
            this.dispatchEvent(evt);
        });

        this.querySelector(".altitude numeric-input").addEventListener("change", e => {
            const node = e.target;
            const evt = new CustomEvent(WT_Flight_Plan_Waypoint_Line.EVENT_ALTITUDE_CHANGED, {
                bubbles: true,
                detail: {
                    waypointIndex: this.index,
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
    get index() {
        return this._index;
    }
    set index(index) {
        this._index = index;
        this.dataset.waypointIndex = index;
    }
    set type(type) {
        this.dataset.type = type;
    }
    get waypoint() {
        return this._waypoint;
    }
    get coordinates() {
        return this.waypoint.infos.coordinates;
    }
    set waypoint(waypoint) {
        this._waypoint = waypoint;
        this.dataset.altitudeMode = waypoint.legAltitudeDescription;
        this.dataset.altitude1 = waypoint.legAltitude1;
        this.dataset.altitude2 = waypoint.legAltitude2;

        const infos = waypoint.GetInfos();
        this.ident = infos.ident != "" ? infos.ident : waypoint.ident;
        this.dtk = waypoint.bearingInFP;
        if (this.view.activeLeg && this.index <= this.view.activeLeg.origin) {
            this.bearing = null;
            this.fod = null;
            this.ete = null;
            this.eta = null;
            this.altitude = null;
        } else if (this.view.activeLeg && this.index == this.view.activeLeg.destination) {
            const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            const planeCoordinates = new LatLong(lat, long);
            this.bearing = Avionics.Utils.computeGreatCircleHeading(planeCoordinates, infos.coordinates);
        } else {
            this.bearing = waypoint.bearingInFP;
        }
        /*this.altitude = waypoint.altitudeinFP;
        let altitudeModifiable = waypoint.legAltitudeDescription == 0;*/
        if (!this.view.activeLeg || this.index >= this.view.activeLeg.destination) {
            const gph = SimVar.GetSimVarValue("ENG FUEL FLOW GPH:1", "gallons per hour");
            const fob = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY:1", "gallon");
            this.fod = Math.max(0, fob - gph * (waypoint.estimatedTimeEnRouteFP / 3600));
            this.ete = waypoint.estimatedTimeEnRouteFP;
            this.eta = waypoint.estimatedTimeOfArrivalFP;
            this.altitude = waypoint.altitudeinFP;
        }
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
        this.elements.altitude.value = altitude > 0 ? Math.floor(altitude) : null;
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
            this.showCreateNewWaypoint(e.detail.element.parentNode.index + 1);
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
        model.waypoints.subscribe(this.updateWaypoints.bind(this));
        this.activeLegSubscription = model.activeLeg.subscribe(this.updateActiveLeg.bind(this));

        model.viewMode.subscribe(viewMode => this.setAttribute("view-mode", viewMode));

        this.pageMenu = new WT_Flight_Plan_Page_Menu(model, this, this.confirmDialogHandler);

        this.softKeyMenus = {
            main: new WT_Flight_Plan_Main_Menu(this.model, this),
            view: new WT_Flight_Plan_View_Menu(this.model, this),
        }
    }
    secondsToDuration(v) {
        const hours = v / 3600;
        const minutes = (v % 3600) / 60;
        return `${hours.toFixed(0).padStart(2, "0")}:${minutes.toFixed(0).padStart(2, "0")}`;
    }
    secondsToZulu(v) {
        const hours = v / 3600;
        const minutes = (v % 3600) / 60;
        return `${hours.toFixed(0).padStart(2, "0")}:${minutes.toFixed(0).padStart(2, "0")}`;
    }
    updateWaypoints(waypoints) {
        const flightPlan = this.model.flightPlan;
        const lines = [];
        const departure = waypoints.departure;
        const arrival = waypoints.arrival;
        const approach = waypoints.approach;
        const enroute = waypoints.enroute;
        const origin = waypoints.origin;
        const destination = waypoints.destination;

        let waypointIndex = 0;
        let cumulativeDistance = 0;
        let waypointLine = (waypoint, type) => {
            let element = this.waypointLines[waypointIndex];
            if (!element) {
                element = new WT_Flight_Plan_Waypoint_Line(this);
            }
            element.waypoint = waypoint;
            element.type = type;

            let legDistance = 0;
            if (this.activeLeg && waypointIndex <= this.activeLeg.origin) {
                legDistance = null;
            } else if (this.activeLeg && waypointIndex == this.activeLeg.destination) {
                let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                let planeCoordinates = new LatLong(lat, long);
                legDistance = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, waypoint.infos.coordinates);
            } else {
                legDistance = waypoint.distanceInFP;
            }
            cumulativeDistance += legDistance;
            element.distance = this.model.distanceMode.value == "leg" ? legDistance : cumulativeDistance;

            element.index = waypointIndex++;
            return element;
        }

        let headerIndex = 0;
        const headerLine = (type, text) => {
            let element = this.headerLines[headerIndex++];
            if (!element) {
                element = new WT_Flight_Plan_Header_Line(this);
            }
            element.type = type;
            element.text = text;
            return element;
        }

        if (departure.length > 0) {
            lines.push(headerLine("departure", `Departure - ${flightPlan.getDeparture().name}`));
            lines.push(waypointLine(flightPlan.getOrigin(), "origin"));
            lines.push(...departure.map(waypointLine, "departure"));
        }
        if (departure.length > 0 || arrival.length > 0 || (approach && approach.length > 0)) {
            lines.push(headerLine("enroute", `Enroute`));
        }
        if (departure.length == 0 && origin) {
            lines.push(waypointLine(flightPlan.getOrigin()));
        }
        /*let currentAirway = null;
        for (let i in enroute) {
            let waypoint = enroute[i];
            let next = enroute[i + 1];
            let indented = currentAirway != null;
            if (next) {
                let commonAirway = IntersectionInfo.GetCommonAirway(waypoint, next);
                if (commonAirway)
                    console.log(JSON.stringify(commonAirway));
                if (!currentAirway || !commonAirway || currentAirway.name != commonAirway.name) {
                    indented = currentAirway != null;
                    currentAirway = commonAirway;
                    if (currentAirway) {
                        lines.push(headerLine("airway", `Airway - ${currentAirway.name}`));
                        indented = true;
                    }
                }
            }
            lines.push(waypointLine(waypoint, `Enroute`));
        }*/
        lines.push(...enroute.map(waypointLine, "enroute"));
        if (arrival.length > 0) {
            lines.push(headerLine("arrival", `Arrival - ${flightPlan.getArrival().name}`));
            lines.push(...arrival.map(waypointLine, "arrival"));
        }
        if (destination) {
            lines.push(waypointLine(destination, "destination"));
        }
        if (approach && approach.length > 0) {
            // Approaches are special cased to always start at 0 index, so we save a copy of what the current index is to add to our active leg values later
            this.approachIndex = waypointIndex;
            let airportApproach = flightPlan.getAirportApproach();
            if (airportApproach) {
                lines.push(headerLine("approach", `Approach - ${airportApproach.name}`));
            }
            lines.push(...approach.map(waypointLine, "approach"));
        }

        const waypointLines = [];
        let lineIndex = 0;
        for (const line of lines) {
            if (line.waypoint) {
                waypointLines.push(lineIndex);
            }
            lineIndex++;
        }
        this.waypointLines = lines.filter(line => line.tagName == "G1000-FLIGHT-PLAN-WAYPOINT-LINE");
        this.headerLines = lines.filter(line => line.tagName == "G1000-FLIGHT-PLAN-HEADER-LINE");
        this.waypointLineIndexes = waypointLines;

        lines.unshift(this.elements.activeLegMarker);
        lines.push(this.elements.newWaypointLine);
        DOMUtilities.repopulateElement(this.elements.flightPlanWaypoints, lines);
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
        return this.waypointLineIndexes[waypointIndex];
    }
    updateActiveLeg(leg) {
        if (leg) {
            this.elements.activeLegMarker.style.gridRowStart = this.waypointIndexToLineIndex(leg.origin + (leg.originIsApproach ? this.approachIndex : 0)) + 1;
            this.elements.activeLegMarker.style.gridRowEnd = this.waypointIndexToLineIndex(leg.destination + (leg.destinationIsApproach ? this.approachIndex : 0)) + 2;
            this.elements.activeLegMarker.style.visibility = "visible";
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