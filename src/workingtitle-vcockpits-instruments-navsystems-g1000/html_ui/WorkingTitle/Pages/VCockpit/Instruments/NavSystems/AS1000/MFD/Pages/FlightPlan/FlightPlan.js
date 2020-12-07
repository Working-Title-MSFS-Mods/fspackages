class WT_Flight_Plan_View_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_Flight_Plan_Page_Model} model 
     * @param {WT_Flight_Plan_Page_View} view 
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     */
    constructor(model, view, softKeyMenuHandler) {
        super(false);

        const buttons = {
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
        this.addSoftKey(11, softKeyMenuHandler.getBackButton());
    }
}

class WT_Flight_Plan_Main_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_Flight_Plan_Page_Model} model 
     * @param {WT_MFD_Flight_Plan_Page_View} view 
     */
    constructor(model, view) {
        super(true);
        this.model = model;

        this.buttons = {
            newWpt: this.addSoftKey(4, new WT_Soft_Key("NEW WPT", view.showCreateNewWaypoint.bind(view))),
            view: this.addSoftKey(5, new WT_Soft_Key("VIEW", view.showViewMenu.bind(view))),
            actLeg: this.addSoftKey(10, new WT_Soft_Key("ACT LEG", model.setActiveWaypoint.bind(model))),
            vnavProf: this.addSoftKey(6, new WT_Soft_Key("VNV PROF")),
            cancelVnav: this.addSoftKey(7, new WT_Soft_Key("CNCL VNV")),
            vnavDirectTo: this.addSoftKey(8, new WT_Soft_Key("VNV ->")),
            atkOffset: this.addSoftKey(9, new WT_Soft_Key("ATK OFST")),
            showChart: this.addSoftKey(11, new WT_Soft_Key("SHW CHRT")),
        }

        this.buttons.newWpt.disabled = true;
        this.buttons.vnavProf.disabled = true;
        this.buttons.cancelVnav.disabled = true;
        this.buttons.vnavDirectTo.disabled = true;
        this.buttons.atkOffset.disabled = true;
        this.buttons.showChart.disabled = true;

        this.subscriptions = new Subscriptions();
    }
    activate() {
        this.subscriptions.add(
            this.model.canActivateLeg$.subscribe(can => this.buttons.actLeg.disabled = !can)
        );
    }
    deactivate() {
        this.subscriptions.unsubscribe();
    }
}

class WT_MFD_Flight_Plan_Waypoint_Line extends WT_Flight_Plan_Waypoint_Line {
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
        if (this.elements.altitude.mode != "edit") {
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
customElements.define("g1000-flight-plan-waypoint-line", WT_MFD_Flight_Plan_Waypoint_Line);

class WT_MFD_Flight_Plan_Header_Line extends WT_Flight_Plan_Header_Line {
    constructor() {
        super();
        this.classList.add("selectable");
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

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
customElements.define("g1000-flight-plan-header-line", WT_MFD_Flight_Plan_Header_Line);

class WT_MFD_Flight_Plan_Line_Factory {
    createWaypointLine() {
        return new WT_MFD_Flight_Plan_Waypoint_Line();
    }
    createHeaderLine() {
        return new WT_MFD_Flight_Plan_Header_Line();
    }
}

class WT_MFD_Flight_Plan_Page_View extends WT_Flight_Plan_Page_View {
    /**
     * @param {MapInstrument} map 
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     * @param {WT_Show_Page_Menu_Handler} pageMenuHandler
     * @param {WT_Show_Confirm_Dialog_Handler} confirmDialogHandler
     * @param {WT_Show_New_Waypoint_Handler} newWaypointHandler
     */
    constructor(map, softKeyMenuHandler, pageMenuHandler, confirmDialogHandler, newWaypointHandler) {
        super();

        this.map = map;
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.pageMenuHandler = pageMenuHandler;
        this.confirmDialogHandler = confirmDialogHandler;
        this.newWaypointHandler = newWaypointHandler;

        this.inputLayer = new WT_Flight_Plan_Input_Layer(this);

        this.waypointLines = [];
        this.headerLines = [];

        this.isInputActive = new rxjs.BehaviorSubject(false);
        this.selectedLeg = new rxjs.BehaviorSubject(null);

        this.subscriptions = new Subscriptions();

        /*DOMUtilities.AddScopedEventListener(this, "g1000-flight-plan-waypoint-line .ident", "selected", e => {
            this.showCreateNewWaypoint(e.detail.element.parentNode.waypointIndex);
        });*/
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        const template = document.getElementById('flight-plan-page');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();

        const linesElement = this.elements.flightPlanWaypoints;
        linesElement.setLineFactory(new WT_MFD_Flight_Plan_Line_Factory());
    }
    /**
     * @param {WT_Flight_Plan_Page_Model} model 
     */
    setModel(model) {
        this.model = model;
        model.lines.subscribe(this.updateLines.bind(this));

        model.viewMode.subscribe(viewMode => this.setAttribute("view-mode", viewMode));

        this.softKeyMenus = {
            main: new WT_Flight_Plan_Main_Menu(this.model, this),
            view: new WT_Flight_Plan_View_Menu(this.model, this, this.softKeyMenuHandler),
        }

        const linesElement = this.elements.flightPlanWaypoints;
        linesElement.onWaypointSelected.subscribe(waypointIndex => this.model.setSelectedWaypointIndex(waypointIndex));
        linesElement.onWaypointSelected.subscribe(DOMUtilities.debounce(waypointIndex => this.selectedLeg.next(waypointIndex), 200, false));
        linesElement.onWaypointAltitudeChanged.subscribe(e => this.model.setAltitude(e.waypointIndex, e.altitude));
        linesElement.onWaypointClicked.subscribe(waypointIndex => this.showCreateNewWaypoint(waypointIndex));
        linesElement.onNewWaypointLineSelected.subscribe(() => this.model.newWaypointLineSelected());

        rxjs.combineLatest(this.isInputActive, this.selectedLeg.pipe(rxjs.operators.distinctUntilChanged())).subscribe(values => {
            if (values[0]) {
                if (values[1] !== null) {
                    this.centerOnLeg(values[1]);
                }
            } else {
                this.centerOnFlightPlan();
            }
        });

        model.name$.pipe(
            rxjs.operators.distinctUntilChanged()
        ).subscribe(name => this.elements.flightPlanName.value = name);

        this.elements.flightPlanName.addEventListener("selected", () => {
            this.model.customName$.pipe(
                rxjs.operators.take(1)
            ).subscribe(WT_RX.setValue(this.elements.flightPlanName));
        }, true);

        this.pageMenu = new WT_Flight_Plan_Page_Menu(this.model, this, this.confirmDialogHandler);
    }
    updateLines(lines) {
        this.elements.flightPlanWaypoints.updateLines(lines);
        this.inputLayer.refreshSelected();
    }
    handleDelete() {
        const selectedElement = this.inputLayer.selectedElement;
        if (!selectedElement)
            return;
        const waypointLine = DOMUtilities.GetClosestParent(selectedElement, "G1000-FLIGHT-PLAN-WAYPOINT-LINE");
        if (waypointLine) {
            this.confirmDialogHandler.show(`Remove ${waypointLine.ident}?`).then(() => this.model.deleteWaypoint(waypointLine.waypointIndex))
        } else if (selectedElement.tagName == "G1000-FLIGHT-PLAN-HEADER-LINE") {
            switch (selectedElement.type) {
                case "departure":
                    this.confirmDialogHandler.show("Delete departure?").then(() => this.model.deleteDeparture());
                    break;
                case "arrival":
                    this.confirmDialogHandler.show("Delete arrival?").then(() => this.model.deleteArrival());
                    break;
                case "approach":
                    this.confirmDialogHandler.show("Delete approach?").then(() => this.model.deleteApproach());
                    break;
            }
        }
    }
    showPageMenu() {
        this.pageMenuHandler.show(this.pageMenu);
    }
    onDirectTo() {
        return this.model.directToSelected();
    }
    setName(name) {
        this.model.setName(name);
    }
    showCreateNewWaypoint(index = null) {
        this.newWaypointHandler.show().then(waypoint => {
            this.model.addWaypoint(waypoint, index);
        }).catch(WT_Cancel_Dialog_Error.HANDLER);
    }
    updateActiveLeg(leg) {
        this.elements.flightPlanWaypoints.updateActiveLeg(leg);
    }
    centerOnLeg(waypointIndex) {
        const waypoints = [...this.model.flightPlan.getWaypoints(), ...this.model.flightPlan.getApproachWaypoints()];
        //console.log(`Index: ${waypointIndex}, Num: ${waypoints.length}`);
        const current = waypoints[waypointIndex];
        const centerOn = current.latitudeFP ? [new LatLong(current.latitudeFP, current.longitudeFP)] : [current.infos.coordinates];
        if (waypointIndex > 0) {
            const previous = waypoints[waypointIndex - 1];
            centerOn.push(previous.latitudeFP ? new LatLong(previous.latitudeFP, previous.longitudeFP) : previous.infos.coordinates);
        }
        this.map.centerOnCoordinates(centerOn, centerOn.length > 1 ? null : 20);
    }
    centerOnFlightPlan() {
        const waypoints = [...this.model.flightPlan.getWaypoints(), ...this.model.flightPlan.getApproachWaypoints()];
        if (waypoints.length > 1) {
            this.map.centerOnCoordinates(waypoints.map(waypoint => {
                return waypoint.latitudeFP ? new LatLong(waypoint.latitudeFP, waypoint.longitudeFP) : waypoint.infos.coordinates;
            }));
        }
    }
    showMainMenu() {
        this.softKeyMenuHandler.show(this.softKeyMenus.main);
    }
    showViewMenu() {
        this.softKeyMenuHandler.show(this.softKeyMenus.view);
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
        this.isInputActive.next(false);
    }
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
        this.isInputActive.next(true);
    }
    activate() {
        this.menuHandler = this.softKeyMenuHandler.show(this.softKeyMenus.main);
        this.elements.map.appendChild(this.map);

        this.subscriptions.add(this.model.activeLeg.subscribe(this.updateActiveLeg.bind(this)))
    }
    deactivate() {
        if (this.menuHandler) {
            this.menuHandler = this.menuHandler.pop();
        }
        this.subscriptions.unsubscribe();
    }
}
customElements.define("g1000-flight-plan-page", WT_MFD_Flight_Plan_Page_View);