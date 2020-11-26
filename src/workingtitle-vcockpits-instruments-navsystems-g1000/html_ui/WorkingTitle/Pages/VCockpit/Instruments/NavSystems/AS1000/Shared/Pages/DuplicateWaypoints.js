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
        const promises = [];
        for (let icao of duplicates) {
            const promise = new Promise(async resolve => {
                resolve(await this.waypointRepository.load(icao));
            })
            promises.push(promise);
        }
        const waypoints = await Promise.all(promises);
        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        const planeCoordinates = new LatLong(lat, long);
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
        const template = document.getElementById('duplicate-waypoints');
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
    /**
     * @param {WT_Duplicate_Waypoints_Model} model
     */
    setModel(model) {
        this.model = model;
        this.elements.ident.textContent = this.model.ident;
        this.model.duplicates.subscribe(duplicates => {
            this.elements.duplicates.innerHTML = duplicates.map(waypoint => {
                const img = waypoint.infos.imageFileName().replace(".png", ".svg");
                return `
                    <li>
                        <span class="type">${this.typeToString(waypoint.infos.getWaypointType())}</span>
                        <span class="icon">${img ? `<img src="/WorkingTitle/Pages/VCockpit/Instruments/NavSystems/AS1000/Shared/Images/Waypoints/${img}" />` : ``}</span>
                        <span class="city selectable" data-icao="${waypoint.icao}">${waypoint.infos.region}</span>
                    </li>
                `;
            }).join("");
            this.inputLayer.refreshSelected();
        });
    }
    confirm(icao) {
        this.resolve(icao);
    }
    cancel() {
        this.reject();
    }
    /**
     * @param {Input_Stack} inputStack 
     */
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
        this.inputStackHandle.onPopped.subscribe(() => {
            this.reject();
        });
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