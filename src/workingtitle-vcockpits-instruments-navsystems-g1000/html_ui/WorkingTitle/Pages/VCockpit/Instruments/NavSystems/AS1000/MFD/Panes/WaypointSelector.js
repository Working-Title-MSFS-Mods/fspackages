class WT_Waypoint_Selector_Model extends WT_Model {
    /**
     * @param {string} type 
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {WT_Soft_Key_Controller} softKeyController 
     */
    constructor(type, waypointRepository, softKeyController) {
        super();
        this.type = type;
        this.waypointRepository = waypointRepository;
        this.softKeyController = softKeyController;

        this.waypoint = new Subject();
        this.bearing = new Subject();
        this.distance = new Subject();
    }
    async setIcao(icao) {
        this.waypoint.value = await this.waypointRepository.load(icao);
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
    onCLR() {
        this.view.cancel();
    }
    onNavigationPush() {
        this.view.cancel();
    }
}

class WT_Waypoint_Selector_View extends WT_HTML_View {
    /**
     * @param {MapInstrument} map 
     * @param {WT_Waypoint_Quick_Select} waypointQuickSelect
     */
    constructor(map, waypointQuickSelect) {
        super();

        this.map = map;
        this.waypointQuickSelect = waypointQuickSelect;
        this.inputLayer = new WT_Waypoint_Selector_Input_Layer(this);
    }
    connectedCallback() {
        let template = document.getElementById('waypoint-selector-pane');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();

        this.elements.icaoInput.addEventListener("change", (e) => this.icaoChanged(e.target.icao))
        this.elements.icaoInput.addEventListener("input", DOMUtilities.debounce(e => this.icaoInput(e.target.icao), 500, false));

        this.elements.mapContainer.appendChild(this.map);
    }
    icaoInput(icao) {
        this.model.setIcao(icao);
    }
    icaoChanged(icao) {
        this.model.setIcao(icao);
        this.resolve(icao);
        this.exit();
    }
    /**
     * @param {WT_Waypoint_Selector_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.elements.icaoInput.setQuickSelect(this.waypointQuickSelect);
        this.model.waypoint.subscribe(waypoint => {
            if (waypoint && waypoint.infos) {
                let infos = waypoint.infos;
                this.map.setCenter(infos.coordinates, 0);

                this.elements.icaoName.textContent = infos.name;
                this.elements.icaoCity.textContent = infos.city;
                this.elements.country.textContent = this.model.getCountry(infos.ident);
                this.elements.city.textContent = infos.city;

                let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                let planeCoordinates = new LatLong(lat, long);
                this.elements.bearing.innerHTML = `${Avionics.Utils.computeGreatCircleHeading(planeCoordinates, infos.coordinates).toFixed(0)}°`;
                let distance = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, infos.coordinates);
                this.elements.distance.innerHTML = `${distance.toFixed(distance < 100 ? 1 : 0)}<span class="units">NM</span>`;
            } else {
                this.elements.icaoName.innerHTML = `__________________`;
                this.elements.icaoCity.innerHTML = `__________________`;
                this.elements.bearing.innerHTML = `___°`;
                this.elements.distance.innerHTML = `__._<span class="units">NM</span>`;
            }
        });
    }
    /**
     * @param {Input_Stack} inputStack 
     */
    enter(inputStack) {
        const mapHandler = inputStack.push(new WT_Map_Input_Layer(this.map, true));
        const inputHandler = inputStack.push(this.inputLayer);
        inputHandler.onPopped.subscribe(() => {
            this.reject();
        });
        this.inputStackHandler = mapHandler;

        this.storedMenu = this.model.softKeyController.currentMenu;
        this.model.softKeyController.setMenu(new WT_Soft_Key_Menu());
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    cancel() {
        this.exit();
    }
    exit() {
        this.inputStackHandler.pop();
        this.model.softKeyController.setMenu(this.storedMenu);
    }
}
customElements.define("g1000-waypoint-selector-pane", WT_Waypoint_Selector_View);