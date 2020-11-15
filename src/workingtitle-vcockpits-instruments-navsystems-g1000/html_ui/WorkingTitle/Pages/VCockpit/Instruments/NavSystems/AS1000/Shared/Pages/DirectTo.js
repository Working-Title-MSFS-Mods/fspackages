class WT_Show_Direct_To_Handler {
    show(icaoType = null, icao = null) {
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
        this.name = new Subject(null);
        this.city = new Subject(null);
    }
    async setIcao(icao) {
        let waypoint = await this.waypointRepository.load(icao);

        if (waypoint && waypoint.infos) {
            this.waypoint.value = waypoint;
            let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            let planeCoordinates = new LatLong(lat, long);
            this.bearing.value = Avionics.Utils.computeGreatCircleHeading(planeCoordinates, waypoint.infos.coordinates);
            let distance = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, waypoint.infos.coordinates);
            this.distance.value = distance;
            this.name.value = waypoint.infos.name;
            this.city.value = waypoint.infos.city;
        } else {
            this.waypoint.value = null;
            this.bearing.value = null;
            this.distance.value = null;
            this.name.value = null;
            this.city.value = null;
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
     * @param {WT_Icao_Input_Model} icaoInputModel 
     * @param {WT_Show_Page_Menu_Handler} showPageMenuHandler 
     */
    constructor(icaoInputModel, showPageMenuHandler) {
        super();
        this.icaoInputModel = icaoInputModel;
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
        this.elements.icaoInput.addEventListener("change", e => this.icaoChanged(e.target.icao))
        this.elements.icaoInput.addEventListener("input", DOMUtilities.debounce(e => this.icaoInput(e.target.icao), 500, false))
        this.elements.course.addEventListener("change", e => this.userSelectedCourse = true)
    }
    disconnectedCallback() {
        if (this.closeMenuHandler) {
            this.closeMenuHandler.close();
            this.closeMenuHandler = null;
        }
    }
    icaoInput(icao) {
        this.model.setIcao(icao);
    }
    icaoChanged(icao) {
        this.model.setIcao(icao);
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
        this.elements.icaoInput.setModel(this.icaoInputModel);
        this.model.waypoint.subscribe(waypoint => {
            if (waypoint) {
                this.elements.icaoInput.icao = waypoint.icao;
                this.centerOnCoordinates(waypoint.infos.coordinates);
            }
        });
        this.model.name.subscribe(name => this.elements.icaoName.innerHTML = `${name === null ? `__________________` : name}`);
        this.model.city.subscribe(city => this.elements.icaoCity.innerHTML = `${city === null ? `__________________` : city}`);
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