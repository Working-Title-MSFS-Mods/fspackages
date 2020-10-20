class WT_Direct_To_Model extends WT_Model {
    constructor(type, gps, softKeyController) {
        super();
        this.type = type;
        this.gps = gps;
        this.facilityLoader = this.gps.facilityLoader;
        this.softKeyController = softKeyController;

        this.waypoint = new Subject();
        this.bearing = new Subject();
        this.distance = new Subject();
    }
    setIcao(icao) {
        let waypoint = new WayPoint(this.gps);
        waypoint.icao = icao;
        this.facilityLoader.getFacilityDataCB(waypoint.icao, (data) => {
            if (data) {
                waypoint.SetFromIFacility(data, () => console.log(JSON.stringify(waypoint.infos.airways.map(aw => aw.name))));
                this.waypoint.value = waypoint;
            }
        });
    }
}

class WT_Direct_To_Input_Layer extends Selectables_Input_Layer {
    constructor(view) {
        super(new Selectables_Input_Layer_Dynamic_Source(view))
        this.view = view;
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
    onRangeInc() {
        this.view.zoomMapIn();
    }
    onRangeDec() {
        this.view.zoomMapOut();
    }
}

class WT_Direct_To_View extends WT_HTML_View {
    constructor() {
        super();

        this.inputLayer = new WT_Direct_To_Input_Layer(this);
    }
    connectedCallback() {
        let template = document.getElementById('direct-to-pane');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));

        super.connectedCallback();

        this.elements.icaoInput.addEventListener("change", (e) => this.icaoChanged(e.target.icao))
        this.elements.icaoInput.addEventListener("input", (e) => this.icaoInput(e.target.icao))
    }
    icaoInput(icao) {
        this.model.setIcao(icao);
    }
    icaoChanged(icao) {
        this.model.setIcao(icao);
        /*this.exit();
        this.resolve(icao);*/
    }
    getMap() {
        return this.querySelector("map-instrument");
    }
    /**
     * @param {WT_Direct_To_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.elements.icaoInput.setQuickSelect(this.model.gps.waypointQuickSelect);
        this.model.waypoint.subscribe(waypoint => {
            let name = null;
            let city = null;
            if (waypoint && waypoint.infos) {
                this.elements.icaoInput.icao = waypoint.icao;
                let infos = waypoint.infos;
                let map = this.getMap();
                map.setCenter(infos.coordinates, 0);

                name = infos.name;
                city = infos.city;

                let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                let planeCoordinates = new LatLong(lat, long);
                this.elements.bearing.innerHTML = `${Avionics.Utils.computeGreatCircleHeading(planeCoordinates, infos.coordinates).toFixed(0)}°`;
                let distance = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, infos.coordinates);
                this.elements.distance.innerHTML = `${distance.toFixed(distance < 100 ? 1 : 0)}<span class="units">NM</span>`;
            } else {
                this.elements.bearing.innerHTML = `___°`;
                this.elements.distance.innerHTML = `__._<span class="units">NM</span>`;
            }
            this.elements.icaoName.innerHTML = name ? name : `__________________`;
            this.elements.icaoCity.innerHTML = city ? city : `__________________`;
        });
    }
    setMap(map) {
        this.elements.mapContainer.appendChild(map);
        map.setZoom(7); //20nm
    }
    zoomMapIn() {
        this.getMap().zoomIn();
    }
    zoomMapOut() {
        this.getMap().zoomOut();
    }
    enter(inputStack) {
        this.inputStackHandler = inputStack.push(new WT_Map_Input_Layer(this.getMap(), false));
        inputStack.push(this.inputLayer);
        this.storedMenu = this.model.softKeyController.currentMenu;
        this.model.softKeyController.setMenu(new WT_Soft_Key_Menu());
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
        this.model.softKeyController.setMenu(this.storedMenu);
    }
    activateDirectTo() {
        this.exit();
        this.resolve({
            waypoint: this.model.waypoint.value,
            course: this.elements.course.value
        });
    }
}
customElements.define("g1000-direct-to-pane", WT_Direct_To_View);