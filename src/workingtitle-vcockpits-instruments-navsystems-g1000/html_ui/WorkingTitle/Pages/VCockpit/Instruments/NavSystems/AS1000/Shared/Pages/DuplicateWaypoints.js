class WT_Duplicate_Waypoints_Model {
    /**
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {[]} duplicates 
     */
    constructor(waypointRepository, duplicates) {
        this.waypointRepository = waypointRepository;
        this.ident = duplicates[0].substr(7, 5);;
        this.duplicates = new Subject([]);
        this.selectedWaypoint = new Subject();
        this.setDuplicates(duplicates);
    }
    async setDuplicates(duplicates) {
        let waypoints = [];
        for (let icao of duplicates) {
            waypoints.push(await this.waypointRepository.load(icao));
        }
        let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        let planeCoordinates = new LatLong(lat, long);
        this.duplicates.value = waypoints.map(waypoint => {
            return {
                waypoint: waypoint,
                distance: Avionics.Utils.computeGreatCircleDistance(planeCoordinates, waypoint.infos.coordinates)
            }
        }).sort((a, b) => {
            return a.distance - b.distance
        }).map(waypoint => waypoint.waypoint);
    }
    setSelectedWaypoint(icao) {
        this.selectedWaypoint.value = this.duplicates.value.find(v => v.icao == icao);
    }
}

class WT_Duplicate_Waypoints_Input_Layer extends Selectables_Input_Layer {
    constructor(view) {
        super(new Selectables_Input_Layer_Dynamic_Source(view));
        this.view = view;
    }
    onEnter() {
        if (this.selectedElement)
            this.view.confirm(this.selectedElement.dataset.icao);
    }
    onCLR() {
        this.view.cancel();
    }
    onNavigationPush() {
        this.view.cancel();
    }
}

class WT_Duplicate_Waypoints_View extends WT_HTML_View {
    constructor() {
        super();
        this.inputLayer = new WT_Duplicate_Waypoints_Input_Layer(this);

        DOMUtilities.AddScopedEventListener(this, "[data-icao]", "highlighted", e => {
            this.model.setSelectedWaypoint(e.target.dataset.icao);
        });
    }
    connectedCallback() {
        let template = document.getElementById('duplicate-waypoints');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();
    }
    typeToString(type) {
        switch (type) {
            case "A": return "APT";
            case "W": return "INT";
            case "V": return "VOR";
            case "N": return "NDB";
        }
        return "WPT";
    }
    coordinateToGps(value) {
        // This is probably wrong, I rushed it
        let hours = Math.floor(value);
        let minutes = Math.floor((Math.abs(value) % 1) * 60);
        let seconds = Math.floor((Math.abs(value) % 1) * 3600) % 60;

        /*if (value < 0) {
            minutes = 59 - minutes;
            seconds = 59 - seconds;
        }*/

        return `${hours}° ${minutes}' ${seconds}"`;
    }
    formatLat(lat) {
        return `${this.coordinateToGps(lat)} ${lat > 0 ? "N" : "S"}`;
    }
    formatLong(long) {
        return `${this.coordinateToGps(long)} ${long > 0 ? "E" : "W"}`;
    }
    /**
     * @param {WT_Duplicate_Waypoints_Model} model
     */
    setModel(model) {
        this.model = model;
        this.elements.ident.textContent = this.model.ident;
        this.model.duplicates.subscribe(duplicates => {
            this.elements.duplicates.innerHTML = duplicates.map(waypoint => {
                let img = waypoint.infos.imageFileName();
                return `
                    <li>
                        <span class="type">${this.typeToString(waypoint.infos.getWaypointType())}</span>
                        <span class="icon">${img ? `<img src="/Pages/VCockpit/Instruments/Shared/Map/Images/${img}" />` : ``}</span>
                        <span class="city selectable" data-icao="${waypoint.icao}">${waypoint.infos.region}</span>
                    </li>
                `;
            }).join("");
            this.inputLayer.refreshSelected();
        });
        this.model.selectedWaypoint.subscribe(waypoint => {
            if (!waypoint)
                return;
            this.elements.name.textContent = waypoint.infos.name;
            this.elements.city.textContent = waypoint.infos.city;
            let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            let planeCoordinates = new LatLong(lat, long);
            this.elements.bearing.textContent = `${Avionics.Utils.computeGreatCircleHeading(planeCoordinates, waypoint.infos.coordinates).toFixed(0)}°`;
            let distance = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, waypoint.infos.coordinates);
            this.elements.distance.innerHTML = `${distance.toFixed(0)}<span class="units">NM</span>`;

            this.elements.coordinatesLat.textContent = this.formatLat(waypoint.infos.coordinates.lat);
            this.elements.coordinatesLong.textContent = this.formatLong(waypoint.infos.coordinates.long);
        });
    }
    confirm(icao) {
        this.resolve(icao);
    }
    cancel() {
        this.reject();
    }
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle = this.inputStackHandle.pop();
        }
    }
}
customElements.define("g1000-duplicate-waypoints", WT_Duplicate_Waypoints_View);