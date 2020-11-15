class WT_Nearest_Ndbs_Model extends WT_Nearest_Waypoints_Model {
    subscribe() {
        this.subscriptions.add(this.nearestWaypoints.ndbs.subscribe(ndbs => this.waypoints.value = ndbs));
    }
}

class WT_Nearest_Ndbs_View extends WT_HTML_View {
    /**
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     * @param {MapInstrument} map 
     * @param {WT_Unit_Chooser} unitChooser 
     */
    constructor(softKeyMenuHandler, map, unitChooser) {
        super();
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.map = map;
        this.unitChooser = unitChooser;

        this.menu = this.initMenu();

        this.flightPlanElement = new SvgFlightPlanElement();
        this.flightPlanElement.source = new WT_Flight_Plan_Waypoints();
        this.flightPlanElement.flightPlanIndex = WT_Flight_Plan_Waypoints.index++;
        this.flightPlanElement.setAsDashed(true);

        this.selectedMenu = new Subject("NDB");

        this.selectedMenu.subscribe(menu => {
            this.menuButtons.NDB.selected = menu == "NDB";
            this.menuButtons.FREQ.selected = menu == "FREQ";
        });
    }
    initMenu() {
        let menu = new WT_Soft_Key_Menu(false);
        this.menuButtons = {
            NDB: new WT_Soft_Key("NDB", this.browseWaypoints.bind(this)),
            FREQ: new WT_Soft_Key("FREQ", this.browseFrequency.bind(this)),
        };
        menu.addSoftKey(5, this.menuButtons.NDB);
        menu.addSoftKey(6, this.menuButtons.FREQ);
        return menu;
    }
    popInput() {
        if (this.inputStackHandle) {
            this.inputStackHandle.pop();
            this.inputStackHandle = null;
        }
    }
    browseWaypoints() {
        this.popInput();
        this.selectedMenu.value = "NDB";
        this.inputStackHandle = this.inputStack.push(this.waypointsInputLayer);
    }
    browseFrequency() {
        this.popInput();
        this.selectedMenu.value = "FREQ";
        this.inputStackHandle = this.inputStack.push(this.frequencyInputLayer);
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        let template = document.getElementById('nearest-ndbs-page');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();

        this.elements.waypointList.setUnitChooser(this.unitChooser);
    }
    /**
     * @param {WT_Nearest_Ndbs_Model} model 
     */
    setModel(model) {
        this.model = model;
        model.waypoints.subscribe(this.updateWaypoints.bind(this));
        model.selectedWaypoint.subscribe(this.updateSelectedWaypoint.bind(this));

        this.elements.waypointList.selectedIcao.subscribe(icao => {
            if (icao !== null)
                this.model.setSelectedWaypoint(icao);
        });

        this.waypointsInputLayer = new WT_Nearest_Waypoints_Input_Layer(this.model, this);
        this.frequencyInputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Element_Source([this.elements.frequency]));
    }
    updateSelectedWaypoint(waypoint) {
        if (waypoint != null) {
            try {
                let infos = waypoint.infos;
                if (!infos)
                    return;
                this.elements.facilityName.textContent = infos.name;
                this.elements.city.textContent = infos.city;
                this.elements.ndbType.textContent = infos.getTypeString();
                this.elements.latitude.textContent = WT_Coordinates_Utilities.latToGps(infos.coordinates.lat);
                this.elements.longitude.textContent = WT_Coordinates_Utilities.longToGps(infos.coordinates.long);

                if (infos.frequencyMHz)
                    this.elements.frequency.textContent = infos.frequencyMHz.toFixed(1);

                this.updateMap(waypoint);
            } catch (e) {
                console.error(e.message);
            }
        } else {
            this.elements.frequency.textContent = `___._`;
        }
    }
    updateMap(waypoint) {
        let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        let planeCoordinates = new LatLong(lat, long);
        this.map.centerOnCoordinate(planeCoordinates, [waypoint.infos.coordinates], 50);
        this.flightPlanElement.source.waypoints = [{
            ident: "",
            infos: {
                coordinates: new LatLongAlt(planeCoordinates.lat, planeCoordinates.long, 0)
            }
        }, waypoint];
    }
    updateWaypoints(waypoints) {
        this.elements.waypointList.setWaypoints(waypoints);
    }
    exit() {
        this.popInput();
    }
    enter(inputStack) {
        this.browseWaypoints();
    }
    activate(inputStack) {
        this.elements.map.appendChild(this.map);
        this.inputStack = inputStack;
        this.menuHandler = this.softKeyMenuHandler.show(this.menu);
        this.map.flightPlanElements.push(this.flightPlanElement);
        this.map.showFlightPlan = false;
        this.model.subscribe();
    }
    deactivate() {
        if (this.menuHandler) {
            this.menuHandler = this.menuHandler.pop();
        }
        this.map.flightPlanElements.splice(this.map.flightPlanElements.findIndex(item => item == this.flightPlanElement), 1);
        this.map.showFlightPlan = true;
        this.model.unsubscribe();
    }
}
customElements.define("g1000-nearest-ndbs-page", WT_Nearest_Ndbs_View);