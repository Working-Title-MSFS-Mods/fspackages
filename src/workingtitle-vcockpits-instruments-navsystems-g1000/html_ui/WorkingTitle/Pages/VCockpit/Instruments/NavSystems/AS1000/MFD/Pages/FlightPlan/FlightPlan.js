class WT_Flight_Plan_Page_Model extends WT_Model {
    /**
     * @param {FlightPlanManager} flightPlan 
     * @param {Procedures} procedures 
     * @param {AS1000_MFD} gps
     * @param {WT_Soft_Key_Controller} softKeyController
     */
    constructor(flightPlan, procedures, gps, softKeyController, mapInstrument) {
        super();
        this.flightPlan = flightPlan;
        this.procedures = procedures;
        this.gps = gps;
        this.softKeyController = softKeyController;
        this.mapInstrument = mapInstrument;
        this.activeLeg = procedures.activeLeg;
        this.waypoints = new Subject();
        this.viewMode = new Subject("narrow");
        this.distanceMode = new Subject("leg");

        this.updateWaypoints();

        this.softKeys = {
            main: {
                toggleVnav: new WT_Soft_Key("CNCL VNV"),
            },
            view: {
                wide: new WT_Soft_Key("WIDE", () => this.viewMode.value = "wide"),
                narrow: new WT_Soft_Key("NARROW", () => this.viewMode.value = "narrow"),
                leg: new WT_Soft_Key("LEG-LEG", () => this.distanceMode.value = "leg"),
                cumulative: new WT_Soft_Key("CUM", () => this.distanceMode.value = "cumulative"),
            }
        }
        this.softKeyMenus = {
            main: this.initMainMenu(),
            view: this.initViewMenu(),
        }

        this.viewMode.subscribe(mode => {
            this.softKeys.view.wide.selected = mode == "wide";
            this.softKeys.view.narrow.selected = mode == "narrow";
        });
        this.distanceMode.subscribe(mode => {
            this.softKeys.view.leg.selected = mode == "leg";
            this.softKeys.view.cumulative.selected = mode == "cumulative";
        });
    }
    initViewMenu() {
        let menu = new WT_Soft_Key_Menu(false);
        menu.addSoftKey(5, this.softKeys.view.wide);
        menu.addSoftKey(6, this.softKeys.view.narrow);
        menu.addSoftKey(8, this.softKeys.view.leg);
        menu.addSoftKey(9, this.softKeys.view.cumulative);
        menu.addSoftKey(11, new WT_Soft_Key("BACK", this.softKeyBack.bind(this)));
        return menu;
    }
    initMainMenu() {
        let menu = new WT_Soft_Key_Menu();
        menu.addSoftKey(4, new WT_Soft_Key("NEW WPT", this.newWaypoint.bind(this)));
        menu.addSoftKey(5, new WT_Soft_Key("VIEW", this.showViewMenu.bind(this)));
        menu.addSoftKey(6, new WT_Soft_Key("VNV PROF"));
        menu.addSoftKey(7, this.softKeys.main.toggleVnav);
        menu.addSoftKey(8, new WT_Soft_Key("VNV ->"));
        menu.addSoftKey(9, new WT_Soft_Key("ATK OFST"));
        menu.addSoftKey(10, new WT_Soft_Key("ACT LEG"));
        menu.addSoftKey(11, new WT_Soft_Key("SHW CHRT"));
        return menu;
    }
    setAltitude(waypointIndex, altitudeInFt) {
        waypointIndex = parseInt(waypointIndex);
        altitudeInFt = parseInt(altitudeInFt);
        this.flightPlan.setWaypointAdditionalData(waypointIndex, "ALTITUDE_MODE", "Manual");
        this.flightPlan.setWaypointAltitude(altitudeInFt / 3.2808, waypointIndex, () => {
            console.log(`Updated waypoint ${waypointIndex} altitude to ${altitudeInFt}`);
        });
    }
    deleteWaypoint(waypointIndex) {
        waypointIndex = parseInt(waypointIndex);
        this.gps.showConfirmDialog(`Remove ${this.flightPlan.getWaypoint(waypointIndex).ident}?`).then(() => this.flightPlan.removeWaypoint(waypointIndex, false, this.updateWaypoints.bind(this)));
    }
    deleteDeparture() {
        this.gps.showConfirmDialog("Are you sure you want to delete the departure?").then(() => this.flightPlan.removeDeparture());
    }
    deleteArrival() {
        this.gps.showConfirmDialog("Are you sure you want to delete the arrival?").then(() => this.flightPlan.removeArrival());
    }
    deleteApproach() {
        this.gps.showConfirmDialog("Are you sure you want to delete the approach?").then(() => this.flightPlan.deactivateApproach());
    }
    createNewWaypoint() {
        this.gps.showWaypointSelector().then(icao => {
            this.flightPlan.addWaypoint(icao, 100, this.updateWaypoints.bind(this));
        });
    }
    updateWaypoints() {
        //this.flightPlan.updateFlightPlan();
        let flightPlan = this.flightPlan;
        this.waypoints.value = {
            departure: flightPlan.getDepartureWaypointsMap(),
            arrival: flightPlan.getArrivalWaypointsMap(),
            approach: flightPlan.getApproachWaypoints(),
            enroute: flightPlan.getEnRouteWaypoints(),
            origin: flightPlan.getOrigin(),
            destination: flightPlan.getDestination(),
        }
    }
    centerOnLeg(waypointIndex) {
        let waypoints = this.flightPlan.getWaypoints();
        let centerOn = [waypoints[waypointIndex].infos.coordinates];
        if (waypointIndex > 0) {
            centerOn.push(waypoints[waypointIndex - 1].infos.coordinates);
        }
        this.mapInstrument.centerOnCoordinates(centerOn, centerOn.length > 1 ? null : 20);
    }
    softKeyBack() {
        this.softKeyController.setMenu(this.softKeyMenus.main);
    }
    newWaypoint() {

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
}

class WT_Flight_Plan_Input_Layer extends Selectables_Input_Layer {
    constructor(flightPlanView) {
        super(new Selectables_Input_Layer_Dynamic_Source(flightPlanView));
        this.flightPlanView = flightPlanView;
    }
    onCLR() {
        this.flightPlanView.handleDelete();
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

        this.querySelector(".altitude numeric-input").addEventListener("change", e => {
            let node = e.target;
            let evt = new CustomEvent(WT_Flight_Plan_Waypoint_Line.EVENT_ALTITUDE_CHANGED, {
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
        let hours = Math.floor(v / 3600);
        let minutes = Math.floor((v % 3600) / 60);
        return `${hours.toFixed(0).padStart(2, "0")}:${minutes.toFixed(0).padStart(2, "0")}`;
    }
    secondsToZulu(v) {
        let hours = Math.floor(v / 3600);
        let minutes = Math.floor((v % 3600) / 60);
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

        let infos = waypoint.GetInfos();
        this.ident = infos.ident != "" ? infos.ident : waypoint.ident;
        this.dtk = waypoint.bearingInFP;
        if (this.view.activeLeg && this.index <= this.view.activeLeg.origin) {
            this.bearing = null;
            this.fod = null;
            this.ete = null;
            this.eta = null;
            this.altitude = null;
        } else if (this.view.activeLeg && this.index == this.view.activeLeg.destination) {
            let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            let planeCoordinates = new LatLong(lat, long);
            this.bearing = Avionics.Utils.computeGreatCircleHeading(planeCoordinates, infos.coordinates);
        } else {
            this.bearing = waypoint.bearingInFP;
        }
        /*this.altitude = waypoint.altitudeinFP;
        let altitudeModifiable = waypoint.legAltitudeDescription == 0;*/
        if (!this.view.activeLeg || this.index >= this.view.activeLeg.destination) {
            let gph = SimVar.GetSimVarValue("ENG FUEL FLOW GPH:1", "gallons per hour");
            let fob = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY:1", "gallon");
            this.fod = Math.max(0, fob - gph * (waypoint.estimatedTimeEnRouteFP / 3600));
            this.ete = waypoint.estimatedTimeEnRouteFP;
            this.eta = waypoint.estimatedTimeOfArrivalFP;
            this.altitude = waypoint.altitudeinFP;
        }
    }
    set ident(ident) {
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

class WT_Flight_Plan_Page_View extends WT_HTML_View {
    constructor() {
        super();

        this.inputLayer = new WT_Flight_Plan_Input_Layer(this);

        this.waypointLines = [];
        this.headerLines = [];
        this.activeLeg = null;

        DOMUtilities.AddScopedEventListener(this, "g1000-flight-plan-waypoint-line", WT_Flight_Plan_Waypoint_Line.EVENT_ALTITUDE_CHANGED, e => {
            this.model.setAltitude(e.detail.waypointIndex, e.detail.altitude);
        });

        DOMUtilities.AddScopedEventListener(this, "g1000-flight-plan-waypoint-line .ident", "highlighted", e => {
            this.model.centerOnLeg(e.detail.element.parentNode.index);
        });
    }
    /**
     * @param {WT_Flight_Plan_Page_Model} model 
     */
    setModel(model) {
        this.model = model;
        model.waypoints.subscribe(this.updateWaypoints.bind(this));
        model.activeLeg.subscribe(this.updateActiveLeg.bind(this));

        model.viewMode.subscribe(viewMode => this.setAttribute("view-mode", viewMode));
    }
    secondsToDuration(v) {
        let hours = Math.floor(v / 3600);
        let minutes = Math.floor((v % 3600) / 60);
        return `${hours.toFixed(0).padStart(2, "0")}:${minutes.toFixed(0).padStart(2, "0")}`;
    }
    secondsToZulu(v) {
        let hours = Math.floor(v / 3600);
        let minutes = Math.floor((v % 3600) / 60);
        return `${hours.toFixed(0).padStart(2, "0")}:${minutes.toFixed(0).padStart(2, "0")}`;
    }
    updateWaypoints(waypoints) {
        let flightPlan = this.model.flightPlan;
        let lines = [];
        let departure = waypoints.departure;
        let arrival = waypoints.arrival;
        let approach = waypoints.approach;
        let enroute = waypoints.enroute;
        let origin = waypoints.origin;
        let destination = waypoints.destination;

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
        let headerLine = (type, text) => {
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

        let waypointLines = [];
        let lineIndex = 0;
        for (let line of lines) {
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

        this.updateMap();
    }
    updateMap() {
        let waypoints = [];
        //waypoints.push(...this.model.flightPlan.getWaypoints());
        //waypoints.push(...this.model.flightPlan.getApproachWaypoints());
        //this.model.mapInstrument.centerOnCoordinates(waypoints.map(waypoint => waypoint.infos.coordinates));
    }
    handleDelete() {
        let selectedElement = this.inputLayer.selectedElement;
        if (!selectedElement)
            return;
        let waypointLine = DOMUtilities.GetClosestParent(selectedElement, "G1000-FLIGHT-PLAN-WAYPOINT-LINE");
        if (waypointLine) {
            this.model.deleteWaypoint(waypointLine.index);
        }
        if (selectedElement.tagName == "G1000-FLIGHT-PLAN-HEADER-LINE") {
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
    waypointIndexToLineIndex(waypointIndex) {
        let r = this.waypointLineIndexes[waypointIndex];
        console.log("R: " + r);
        return r;
    }
    updateActiveLeg(leg) {
        console.log("Updated active leg");
        if (leg) {
            this.elements.activeLegMarker.style.gridRowStart = this.waypointIndexToLineIndex(leg.origin + (leg.originIsApproach ? this.approachIndex : 0)) + 1;
            this.elements.activeLegMarker.style.gridRowEnd = this.waypointIndexToLineIndex(leg.destination + (leg.destinationIsApproach ? this.approachIndex : 0)) + 2;
            this.elements.activeLegMarker.style.visibility = "visible";
        } else {
            this.elements.activeLegMarker.style.visibility = "hidden";
        }
        this.activeLeg = leg;
    }
    createNewWaypoint() {
        this.model.createNewWaypoint();
    }
    connectedCallback() {
        let template = document.getElementById('flight-plan-page');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));
        super.connectedCallback();
    }
    back() {
        this.exit();
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle.pop();
            this.inputStackHandle = null;
        }
        if (this.activeLegSubscription) {
            this.activeLegSubscription();
        }
    }
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
    }
    activate() {
        this.model.showMainMenu();
        this.elements.map.appendChild(this.model.mapInstrument);
    }
    deactivate() {
        this.model.restoreMenu();
        this.elements.map.removeChild(this.model.mapInstrument);
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
}
customElements.define("g1000-flight-plan-page", WT_Flight_Plan_Page_View);