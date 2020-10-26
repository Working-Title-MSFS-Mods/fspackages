class WT_Direct_To_Model extends WT_Model {
    constructor(gps, type, waypointRepository) {
        super();
        this.gps = gps;
        this.type = type;
        this.waypointRepository = waypointRepository;

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
    cancelDirectTo() {
        this.gps.revertToFlightPlan();
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
    constructor(softKeyController, waypointQuickSelect, gps) {
        super();
        this.softKeyController = softKeyController;
        this.waypointQuickSelect = waypointQuickSelect;
        this.gps = gps;
        this.inputLayer = new WT_Direct_To_Input_Layer(this);
        this.userSelectedCourse = false;
    }
    connectedCallback() {
        let template = document.getElementById('direct-to-pane');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));

        super.connectedCallback();

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
        this.map.setCenter(coordinates, 0);
    }
    /**
     * @param {WT_Direct_To_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.elements.icaoInput.setQuickSelect(this.waypointQuickSelect);
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
    setMap(map) {
        this.map = map;
        this.elements.mapContainer.appendChild(map);
        map.setZoom(7); //20nm
    }
    showMenu() {
        this.closeMenuHandler = this.gps.showPageMenu(new WT_Direct_To_Page_Menu(this.model));
    }
    enter(inputStack) {
        this.inputStackHandler = inputStack.push(new WT_Map_Input_Layer(this.map, false));
        inputStack.push(this.inputLayer);
        this.storedMenu = this.softKeyController.currentMenu;
        this.softKeyController.setMenu(new WT_Soft_Key_Menu());
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    cancel() {
        this.reject();
        this.exit();
    }
    exit() {
        this.inputStackHandler.pop();
        this.softKeyController.setMenu(this.storedMenu);
    }
    hold() {
        this.gps.revertToFlightPlan();
    }
    activateDirectTo() {
        this.exit();
        this.resolve({
            waypoint: this.model.waypoint.value,
            course: this.userSelectedCourse ? this.elements.course.value : null
        });
    }
}
customElements.define("g1000-direct-to-pane", WT_Direct_To_View);