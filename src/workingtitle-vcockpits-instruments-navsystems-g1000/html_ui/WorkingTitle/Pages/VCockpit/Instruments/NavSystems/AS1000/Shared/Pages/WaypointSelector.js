class WT_Waypoint_Selector_Model_Factory {
    /**
     * @param {WT_Waypoint_Repository} waypointRepository 
     */
    constructor(waypointRepository) {
        this.waypointRepository = waypointRepository;
    }
    create(icaoType) {
        return new WT_Waypoint_Selector_Model(icaoType, this.waypointRepository);
    }
}

class WT_Waypoint_Selector_Model extends WT_Model {
    /**
     * @param {string} type 
     * @param {WT_Waypoint_Repository} waypointRepository 
     */
    constructor(type, waypointRepository) {
        super();
        this.type = type;
        this.waypointRepository = waypointRepository;

        this.waypoint = new Subject();
    }
    /**
     * @param {WayPoint} waypoint 
     */
    setWaypoint(waypoint) {
        this.waypoint.value = waypoint;
    }
    getCountry(ident) {
        return "";
    }
}

class WT_Waypoint_Selector_Input_Layer extends Selectables_Input_Layer {
    constructor(view) {
        super(new Selectables_Input_Layer_Dynamic_Source(view, "icao-input"))
        this.view = view;
    }
    onEnter(inputStack) {
        this.view.confirm();
    }
    onCLR() {
        this.view.cancel();
    }
    onNavigationPush() {
        this.view.cancel();
    }
}

class WT_Show_New_Waypoint_Handler {
    show(icaoType = null) {
        throw new Error("WT_Show_New_Waypoint_Handler.show not implemented");
    }
}

class WT_Waypoint_Selector_View extends WT_HTML_View {
    /**
     * @param {WT_Waypoint_Input_Model} waypointInputModel
     */
    constructor(waypointInputModel) {
        super();

        this.waypointInputModel = waypointInputModel;
        this.inputLayer = new WT_Waypoint_Selector_Input_Layer(this);

        this.onWaypointSelected = new WT_Event();
        this.onCancel = new WT_Event();
        this.onExit = new WT_Event();
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        const template = document.getElementById('template-waypoint-selector');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();
    }
    /**
     * @param {WayPoint} waypoint 
     */
    updateWaypoint(waypoint) {
        if (waypoint instanceof WayPoint) {
            this.model.setWaypoint(waypoint);
        }
    }
    confirm() {
        if (this.model.waypoint.value) {
            this.onWaypointSelected.fire(this.model.waypoint.value);
        }
    }
    /**
     * @param {WT_Waypoint_Selector_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.elements.waypointInput.setModel(this.waypointInputModel);
        this.model.waypoint.subscribe(waypoint => {
            if (waypoint && waypoint.infos) {
                const infos = waypoint.infos;
                const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                const planeCoordinates = new LatLong(lat, long);
                this.elements.bearing.innerHTML = `${Avionics.Utils.computeGreatCircleHeading(planeCoordinates, infos.coordinates).toFixed(0)}°`;
                const distance = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, infos.coordinates);
                this.elements.distance.innerHTML = `${distance.toFixed(distance < 100 ? 1 : 0)}<span class="units">NM</span>`;
            } else {
                this.elements.bearing.innerHTML = `___°`;
                this.elements.distance.innerHTML = `__._<span class="units">NM</span>`;
            }
        });
    }
    /**
     * @param {Input_Stack} inputStack 
     */
    enter(inputStack) {
        const inputHandler = inputStack.push(this.inputLayer);
        inputHandler.onPopped.subscribe(() => {
            this.onExit.fire();
        });
        this.inputStackHandler = inputHandler;
    }
    cancel() {
        this.onCancel.fire();
    }
    exit() {
        this.inputStackHandler.pop();
    }
}