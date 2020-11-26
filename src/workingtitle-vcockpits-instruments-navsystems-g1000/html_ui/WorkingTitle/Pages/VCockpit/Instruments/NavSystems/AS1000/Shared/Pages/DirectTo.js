class WT_Show_Direct_To_Handler {
    show(icaoType = null, waypoint = null) {
        throw new Error("Direct to not implemented");
    }
}

class WT_Direct_To_Model_Factory {
    /**
     * @param {NavSystem} gps 
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {WT_Direct_To_Handler} directToHandler 
     */
    constructor(gps, waypointRepository, directToHandler) {
        this.gps = gps;
        this.waypointRepository = waypointRepository;
        this.directToHandler = directToHandler;
    }
    create(icaoType) {
        return new WT_Direct_To_Model(this.gps, icaoType, this.waypointRepository, this.directToHandler);
    }
}

class WT_Direct_To_Model extends WT_Model {
    /**
     * @param {NavSystem} gps 
     * @param {string} type 
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {WT_Direct_To_Handler} directToHandler 
     */
    constructor(gps, type, waypointRepository, directToHandler) {
        super();
        this.gps = gps;
        this.type = type;
        this.waypointRepository = waypointRepository;
        this.directToHandler = directToHandler;

        this.waypoint = new Subject(null);
        this.bearing = new Subject(null);
        this.distance = new Subject(null);
    }
    /**
     * @param {WayPoint} waypoint 
     */
    setWaypoint(waypoint) {
        if (waypoint && waypoint.infos) {
            this.waypoint.value = waypoint;
            let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            let planeCoordinates = new LatLong(lat, long);
            this.bearing.value = Avionics.Utils.computeGreatCircleHeading(planeCoordinates, waypoint.infos.coordinates);
            let distance = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, waypoint.infos.coordinates);
            this.distance.value = distance;
        } else {
            this.waypoint.value = null;
            this.bearing.value = null;
            this.distance.value = null;
        }
    }
    activateDirectTo(course) {
        this.directToHandler.activate(this.waypoint.value, course);
    }
    cancelDirectTo() {
        this.directToHandler.cancel();
    }
}

class WT_Direct_To_Input_Layer extends Selectables_Input_Layer {
    constructor(view) {
        super(new Selectables_Input_Layer_Dynamic_Source(view))
        this.view = view;
    }
    onMenuPush() {
        this.view.showMenu();
    }
    onDirectTo() {
        this.view.cancel();
    }
    onCLR() {
        this.view.cancel();
    }
    onNavigationPush() {
        this.view.cancel();
    }
}

class WT_Direct_To_Page_Menu extends WT_Page_Menu_Model {
    /**
     * @param {WT_Direct_To_Model} model 
     */
    constructor(model) {
        super([
            new WT_Page_Menu_Option("Cancel Direct-To NAV", () => model.cancelDirectTo()),
            new WT_Page_Menu_Option("Clear Vertical Restraints"),
            new WT_Page_Menu_Option("Edit Hold"),
            new WT_Page_Menu_Option("Hold At Present Position"),
        ])
    }
}

class WT_Direct_To_View extends WT_HTML_View {
    /**
     * @param {WT_Waypoint_Input_Model} waypointInputModel 
     * @param {WT_Show_Page_Menu_Handler} showPageMenuHandler 
     */
    constructor(waypointInputModel, showPageMenuHandler) {
        super();
        this.waypointInputModel = waypointInputModel;
        this.showPageMenuHandler = showPageMenuHandler;
        this.inputLayer = new WT_Direct_To_Input_Layer(this);
        this.userSelectedCourse = false;

        this.onCancel = new WT_Event();
        this.onExit = new WT_Event();
    }
    connectedCallback() {
        const template = document.getElementById('template-direct-to');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();

        if (this.map) {
            this.elements.mapContainer.appendChild(this.map);
        }
        this.elements.course.addEventListener("change", e => this.userSelectedCourse = true)
    }
    disconnectedCallback() {
        if (this.closeMenuHandler) {
            this.closeMenuHandler.close();
            this.closeMenuHandler = null;
        }
    }
    /**
     * @param {WayPoint} waypoint 
     */
    updateWaypoint(waypoint) {
        if (waypoint instanceof WayPoint) {
            this.model.setWaypoint(waypoint);
        }
    }
    centerOnCoordinates(coordinates) {
        if (this.map) {
            this.map.setCenter(coordinates, 0);
        }
    }
    /**
     * @param {WT_Direct_To_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.elements.waypointInput.setModel(this.waypointInputModel);
        this.model.waypoint.subscribe(waypoint => {
            if (waypoint) {
                this.elements.waypointInput.value = waypoint;
                this.centerOnCoordinates(waypoint.infos.coordinates);
            }
        });
        this.model.bearing.subscribe(bearing => {
            this.elements.bearing.innerHTML = `${bearing === null ? `___` : bearing.toFixed(0)}°`;
            this.userSelectedCourse = false;
            this.elements.course.value = Math.round(bearing);
        });
        this.model.distance.subscribe(distance => this.elements.distance.innerHTML = `${distance === null ? `__._` : distance.toFixed(distance < 100 ? 1 : 0)}<span class="units">NM</span>°`);
    }
    showMenu() {
        this.closeMenuHandler = this.showPageMenuHandler.show(new WT_Direct_To_Page_Menu(this.model));
    }
    enter(inputStack) {
        const inputHandler = inputStack.push(this.inputLayer);
        inputHandler.onPopped.subscribe(() => {
            this.onExit.fire();
        })
        this.inputStackHandler = inputHandler;
    }
    cancel() {
        this.onCancel.fire();
    }
    exit() {
        this.inputStackHandler.pop();
    }
    hold() {

    }
    activateDirectTo() {
        this.model.activateDirectTo(this.userSelectedCourse ? this.elements.course.value : null);
        this.onCancel.fire();
    }
}
customElements.define("g1000-direct-to", WT_Direct_To_View);