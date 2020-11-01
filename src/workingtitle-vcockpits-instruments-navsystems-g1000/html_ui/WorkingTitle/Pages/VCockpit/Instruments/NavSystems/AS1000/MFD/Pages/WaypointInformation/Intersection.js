class WT_Intersection_Information_Model {
    /**
     * @param {WT_Waypoint_Repository} waypointRepository 
     */
    constructor(showDirectToHandler, waypointRepository) {
        this.showDirectToHandler = showDirectToHandler;
        this.waypointRepository = waypointRepository;
        this.waypoint = new Subject(null);
    }
    async setIcao(icao) {
        this.waypoint.value = await this.waypointRepository.load(icao);
    }
    directTo() {
        if (this.waypoint.value)
            this.showDirectToHandler.show(null, this.waypoint.value.icao);
    }
    get instrumentIdentifier() {
        return `WT_Intersection_Information_Model`;
    }
}

class WT_Intersection_Information_Input_Layer extends Selectables_Input_Layer {
    /**
     * @param {WT_Intersection_Information_Model} model 
     * @param {WT_Intersection_Information_View} view 
     */
    constructor(model, view) {
        super(new Selectables_Input_Layer_Dynamic_Source(view));
        this.model = model;
        this.view = view;
    }
    onDirectTo() {
        this.model.directTo();
    }
}

class WT_Intersection_Information_View extends WT_HTML_View {
    constructor(map, waypointQuickSelect) {
        super();
        this.map = map;
        this.waypointQuickSelect = waypointQuickSelect;
    }
    connectedCallback() {
        if (this.hasInitialised)
            return;
        this.hasInitialised = true;

        let template = document.getElementById('intersection-information-page');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();

        this.elements.icaoInput.setQuickSelect(this.waypointQuickSelect);
        this.elements.icaoInput.addEventListener("change", e => this.model.setIcao(e.target.icao));
        this.elements.icaoInput.addEventListener("input", DOMUtilities.debounce(e => this.model.setIcao(e.target.icao), 500));
    }
    getVorImg(type) {
        switch (type) {
            case 1:
                return "ICON_MAP_VOR.png";
            case 2:
                return "ICON_MAP_VOR_DME.png";
            case 3:
                return "ICON_MAP_VOR_DME.png";
            case 4:
                return "ICON_MAP_VOR_TACAN.png";
            case 5:
                return "ICON_MAP_VOR_VORTAC.png";
            case 6:
                return "ICON_MAP_VOR.png";
        }
        return "ICON_MAP_VOR.png";
    }
    /**
     * @param {WT_Intersection_Information_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.inputLayer = new WT_Intersection_Information_Input_Layer(this.model, this);
        model.waypoint.subscribe(intersection => {
            if (intersection) {
                let infos = intersection.infos;
                //this.elements.country.textContent = WT_Coordinates_Utilities.country(infos.region);
                this.elements.country.textContent = infos.region;
                this.elements.lat.innerHTML = WT_Coordinates_Utilities.latToGps(infos.coordinates.lat);
                this.elements.long.innerHTML = WT_Coordinates_Utilities.longToGps(infos.coordinates.long);
                this.map.centerOnCoordinate(infos.coordinates, [], 15);

                this.elements.vor.textContent = infos.nearestVORIdent;
                this.elements.vorIcon.setAttribute("src", `/Pages/VCockpit/Instruments/Shared/Map/Images/${this.getVorImg(infos.nearestVORType)}`);
                this.elements.vorDistance.innerHTML = `${(infos.nearestVORDistance * 0.000539957).toFixed(0)}<span class="units">NM</span>`;
                this.elements.vorRadial.innerHTML = `${infos.nearestVORTrueRadial.toFixed(0)}°`;
            } else {
                this.elements.country.textContent = `________`;
                this.elements.lat.innerHTML = `________`;
                this.elements.long.innerHTML = `________`;

                this.elements.vor.textContent = `___`;
                this.elements.vorIcon.setAttribute("src", ``);
                this.elements.vorDistance.innerHTML = `___<span class="units">NM</span>`;
                this.elements.vorRadial.innerHTML = `___°`;
            }
        });
    }
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle = this.inputStackHandle.pop();
        }
    }
    activate() {
        this.elements.map.appendChild(this.map);
    }
}
customElements.define("g1000-intersection-information-page", WT_Intersection_Information_View);