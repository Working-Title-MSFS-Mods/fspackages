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
        this.flightPlan.removeWaypoint(waypointIndex, () => {
            console.log(`Deleted waypoint ${waypointIndex}`);
        });
    }
    createNewWaypoint() {
        this.gps.showWaypointSelector().then(icao => {
            this.flightPlan.addWaypoint(icao);
            console.log(`Added ${icao} to waypoints`);
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
        this.flightPlanView.deleteSelectedWaypoint();
    }
}

class WT_Flight_Plan_Waypoint_Line extends WT_HTML_View {
    constructor() {
        super();
        this._index = null;
        this._waypoint = null;

        this.innerHTML = `
        <div></div>
        <div class="ident selectable" data-element="ident"></div>
        <div class="dtk" data-element="dtk"></div>
        <div class="distance"><span data-element="distance"></span><span class="units-small">NM</span></div>
        <div class="altitude"><numeric-input digits="5" units="FT" value="0" class="altitude" data-element="altitude"></numeric-input></div>
        <div class="fuel"><span data-element="fod"></span><span class="units-small">GL</span></div>
        <div class="ete" data-element="ete"></div>
        <div class="eta" data-element="eta"></div>
        <div class="bearing" data-element="bearing"></div>`;

        this.bindElements();

        DOMUtilities.AddScopedEventListener(this, ".altitude numeric-input", "change", (e, node) => {
            let evt = new CustomEvent(WT_Flight_Plan_Waypoint_Line.EVENT_ALTITUDE_CHANGED, {
                bubbles: true,
                detail: {
                    waypointIndex: this.index,
                    altitude: node.value
                }
            });
            element.dispatchEvent(evt);
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
    set waypoint(waypoint) {
        this._waypoint = waypoint;
        this.dataset.altitudeMode = waypoint.legAltitudeDescription;
        this.dataset.altitude1 = waypoint.legAltitude1;
        this.dataset.altitude2 = waypoint.legAltitude2;

        let infos = waypoint.GetInfos();
        this.ident = infos.ident != "" ? infos.ident : waypoint.ident;
        this.dtk = waypoint.bearingInFP;
        this.distance = waypoint.distanceInFP;
        this.altitude = waypoint.altitudeinFP;
        /*this.altitude = waypoint.altitudeinFP;
        let altitudeModifiable = waypoint.legAltitudeDescription == 0;*/
        let gph = SimVar.GetSimVarValue("ENG FUEL FLOW GPH:1", "gallons per hour");
        let fob = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY:1", "gallon");
        this.fod = Math.max(0, fob - gph * (waypoint.estimatedTimeEnRouteFP / 3600));
        this.ete = waypoint.estimatedTimeEnRouteFP;
        this.eta = waypoint.estimatedTimeOfArrivalFP;
        this.bearing = waypoint.bearingInFP;
    }
    set ident(ident) {
        this.elements.ident.textContent = ident;
    }
    set dtk(dtk) {
        this.elements.dtk.textContent = Math.floor(dtk) + "°";
    }
    set distance(distance) {
        this.elements.distance.textContent = distance.toFixed(distance < 10 ? 1 : 0);
    }
    set altitude(altitude) {
        this.elements.altitude.value = Math.floor(altitude);
    }
    set fod(fod) {
        this.elements.fod.textContent = Math.floor(fod, 1);
    }
    set ete(ete) {
        this.elements.ete.textContent = this.secondsToDuration(ete);
    }
    set eta(eta) {
        this.elements.eta.textContent = this.secondsToZulu(eta);
    }
    set bearing(bearing) {
        this.elements.bearing.textContent = Math.floor(bearing) + "°";
    }
}
WT_Flight_Plan_Waypoint_Line.EVENT_ALTITUDE_CHANGED = "altitude_changed";
customElements.define("g1000-flight-plan-waypoint-line", WT_Flight_Plan_Waypoint_Line);

class WT_Flight_Plan_Header_Line extends WT_HTML_View {
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

        DOMUtilities.AddScopedEventListener(this, "g1000-flight-plan-waypoint-line", WT_Flight_Plan_Waypoint_Line.EVT_ALTITUDE_CHANGED, e => {
            this.model.setAltitude(e.detail.waypointIndex, e.detail.value);
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

        this.elements.map.appendChild(this.model.mapInstrument);
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
        let waypointLine = (waypoint, type) => {
            let element = this.waypointLines[waypointIndex];
            if (!element) {
                element = new WT_Flight_Plan_Waypoint_Line();
            }
            element.waypoint = waypoint;
            element.type = type;
            element.index = waypointIndex++;
            return element;
        }

        let headerIndex = 0;
        let headerLine = (type, text) => {
            let element = this.headerLines[headerIndex++];
            if (!element) {
                element = new WT_Flight_Plan_Header_Line();
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

        DOMUtilities.RemoveChildren(this.elements.flightPlanWaypoints, "g1000-flight-plan-waypoint-line, g1000-flight-plan-header-line");
        lines.forEach(line => this.elements.flightPlanWaypoints.insertBefore(line, this.elements.newWaypointLine));
    }
    deleteSelectedWaypoint() {
        let selectedElement = this.inputLayer.selectedElement;
        if (selectedElement && "waypointIndex" in selectedElement.dataset) {
            this.model.deleteWaypoint(selectedElement.dataset.waypointIndex);
        }
    }
    waypointIndexToLineIndex(waypointIndex) {
        return this.waypointLineIndexes[waypointIndex];
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
    }
    deactivate() {
        this.model.restoreMenu();
    }
    update(dt) {
        if (!this.time)
            this.time = dt;
        this.time += dt;
        if (this.time > 1000) {
            this.model.updateWaypoints();
            this.time = 0;
        }
    }
}
customElements.define("g1000-flight-plan-page", WT_Flight_Plan_Page_View);