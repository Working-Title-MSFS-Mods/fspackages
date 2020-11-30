class WT_PFD_Flight_Plan_Waypoint_Line extends WT_Flight_Plan_Waypoint_Line {
    constructor() {
        super();

        this.innerHTML = `
        <div></div>
        <div class="ident selectable" data-element="ident"></div>
        <div class="dtk" data-element="dtk"></div>
        <div class="distance"><span data-element="distance"></span><span class="units-small">NM</span></div>
        `;

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
    set line(line) {
        this.lineIndex = line.lineIndex;
        this.waypointIndex = line.waypointIndex;
        this.ident = line.ident;
        this.dtk = line.dtk;
        this.distance = line.distance;
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
}
customElements.define("g1000-flight-plan-waypoint-line", WT_PFD_Flight_Plan_Waypoint_Line);

class WT_PFD_Flight_Plan_Header_Line extends WT_Flight_Plan_Header_Line {
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
customElements.define("g1000-flight-plan-header-line", WT_PFD_Flight_Plan_Header_Line);

class WT_PFD_Flight_Plan_Line_Factory {
    createWaypointLine() {
        return new WT_PFD_Flight_Plan_Waypoint_Line();
    }
    createHeaderLine() {
        return new WT_PFD_Flight_Plan_Header_Line();
    }
}

class WT_PFD_Flight_Plan_Page_View extends WT_Flight_Plan_Page_View {
    /**
     * @param {WT_Show_Page_Menu_Handler} pageMenuHandler
     * @param {WT_Show_Confirm_Dialog_Handler} confirmDialogHandler
     * @param {WT_Show_New_Waypoint_Handler} newWaypointHandler
     */
    constructor(pageMenuHandler, confirmDialogHandler, newWaypointHandler) {
        super();

        this.pageMenuHandler = pageMenuHandler;
        this.confirmDialogHandler = confirmDialogHandler;
        this.newWaypointHandler = newWaypointHandler;

        this.inputLayer = new WT_Flight_Plan_Input_Layer(this);

        this.waypointLines = [];
        this.headerLines = [];

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
        linesElement.setLineFactory(new WT_PFD_Flight_Plan_Line_Factory());
    }
    /**
     * @param {WT_Flight_Plan_Page_Model} model 
     */
    setModel(model) {
        this.model = model;
        model.lines.subscribe(this.updateLines.bind(this));

        this.pageMenu = new WT_Flight_Plan_Page_Menu(model, this, this.confirmDialogHandler);

        const linesElement = this.elements.flightPlanWaypoints;
        linesElement.onWaypointSelected.subscribe(waypointIndex => this.model.setSelectedWaypointIndex(waypointIndex));
        linesElement.onWaypointAltitudeChanged.subscribe((waypointIndex, altitude) => {
            this.model.setAltitude(waypointIndex, altitude);
        });
        linesElement.onWaypointClicked.subscribe(waypointIndex => this.showCreateNewWaypoint(waypointIndex));
        linesElement.onNewWaypointLineSelected.subscribe(() => {
            this.model.newWaypointLineSelected();
        })
    }
    updateLines(lines) {
        this.elements.flightPlanWaypoints.updateLines(lines);
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
        this.newWaypointHandler.show().then(waypoint => {
            this.model.createNewWaypoint(waypoint, index);
        }).catch(WT_Cancel_Dialog_Error.HANDLER);
    }
    updateActiveLeg(leg) {
        this.elements.flightPlanWaypoints.updateActiveLeg(leg);
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
        this.subscriptions.add(this.model.activeLeg.subscribe(this.updateActiveLeg.bind(this)))
    }
    deactivate() {
        this.subscriptions.unsubscribe();
    }
}
customElements.define("g1000-pfd-flight-plan-page", WT_PFD_Flight_Plan_Page_View);