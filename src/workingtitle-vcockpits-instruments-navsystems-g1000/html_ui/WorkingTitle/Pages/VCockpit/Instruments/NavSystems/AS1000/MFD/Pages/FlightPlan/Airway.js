class WT_Airway_Selector_Model {
    /**
     * @param {NavSystem} gps 
     * @param {WayPointInfo} waypoint 
     */
    constructor(gps, waypoint) {
        this.gps = gps;

        this.waypoint = waypoint;

        this.entry = new Subject(null);
        this.airways = new Subject([]);
        this.exits = new Subject([]);
        this.sequence = new Subject([]);

        this.selectedAirway = new Subject(null);
        this.selectedExit = new Subject(null);

        this.selectedAirway.subscribe(airway => {
            if (airway != null) {
                const promises = [];
                const waypoints = airway.icaos.map(icao => {
                    const waypoint = new WayPoint(this.gps);
                    promises.push(new Promise(resolve => waypoint.SetICAO(icao, resolve, false)));
                    return waypoint;
                });
                Promise.all(promises).then(() => {
                    this.exits.value = waypoints;
                    this.selectedExit.value = this.exits.value[0];
                });
            }
        });

        this.selectedExit.subscribe(exit => {
            if (exit != null) {
                let entryIndex = this.exits.value.findIndex(waypoint => waypoint.icao == this.entry.value.icao);
                let exitIndex = this.exits.value.findIndex(waypoint => waypoint == exit);

                if (exitIndex == -1 || entryIndex == -1)
                    return;

                let waypoints = [];
                let direction = exitIndex > entryIndex ? 1 : -1;
                for (let i = entryIndex; i != exitIndex + direction; i += direction) {
                    waypoints.push(this.exits.value[i]);
                }
                this.sequence.value = waypoints;
            }
        });

        this.loadAirways(waypoint);
    }
    async loadAirways(waypoint) {
        this.entry.value = waypoint;
        this.airways.value = await this.gps.facilityLoader.getAllAirways(waypoint);
    }
    setSelectedAirwayIndex(index) {
        this.selectedAirway.value = this.airways.value[index];
    }
    setSelectedExitIndex(index) {
        this.selectedExit.value = this.exits.value[index];
    }
    getWaypoints() {
        return this.sequence.value.filter(waypoint => waypoint.icao != this.waypoint.icao);
    }
}

class WT_Airway_Selector_Input_Layer extends Selectables_Input_Layer {
    constructor(view) {
        super(new Selectables_Input_Layer_Dynamic_Source(view));
        this.view = view;
    }
    onCLR() {
        this.view.cancel();
    }
    onNavigationPush() {
        this.view.cancel();
    }
}

class WT_Flight_Plan_Waypoints {
    constructor() {
        this.waypoints = [];
    }
    getWaypoints() { return this.waypoints; }
    getWaypointsCount() { return this.waypoints.length; };
    getActiveWaypointIndex() { return 0; };
    getActiveWaypoint() { return null; }
    getApproach() { return null; }
    getIsDirectTo() { return false; }
    getWaypoint(i) { return this.waypoints[i]; }
    isActiveApproach() { return false; };
    getLastIndexBeforeApproach() { return this.waypoints.length; };
}
WT_Flight_Plan_Waypoints.index = 100;

class WT_Airway_Selector_View extends WT_HTML_View {
    constructor(map, softKeyController) {
        super();
        this.map = map;
        this.softKeyController = softKeyController;
        this.inputLayer = new WT_Airway_Selector_Input_Layer(this);
        this.onLoad = new WT_Event();
        this.onCancel = new WT_Event();
        this.onExit = new WT_Event();
        this.flightPlanElement = new SvgFlightPlanElement();
        this.flightPlanElement.source = new WT_Flight_Plan_Waypoints();
        this.flightPlanElement.flightPlanIndex = 10;
    }
    connectedCallback() {
        let template = document.getElementById('airway-selector-page');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));
        super.connectedCallback();

        this.elements.airways.addEventListener("input", e => {
            this.model.setSelectedAirwayIndex(e.target.value);
        });

        this.elements.exits.addEventListener("input", e => {
            this.model.setSelectedExitIndex(e.target.value);
        });
    }
    /**
     * @param {WT_Airway_Selector_Model} model 
     */
    setModel(model) {
        this.model = model;
        model.entry.subscribe(entry => {
            if (entry)
                this.elements.entry.textContent = entry.ident
        });
        model.airways.subscribe(airways => {
            if (airways) {
                let i = 0;
                this.elements.airways.clearOptions();
                for (let airway of airways) {
                    this.elements.airways.addOption(i++, airway.name);
                }
            }
        });
        model.exits.subscribe(exits => {
            if (exits) {
                let i = 0;
                this.elements.exits.clearOptions();
                for (let exit of exits) {
                    this.elements.exits.addOption(i++, exit.ident, exit.icao != this.model.waypoint.icao);
                }
            }
        });
        model.sequence.subscribe(sequence => {
            let previous = null;
            this.elements.sequence.innerHTML = sequence.map(waypoint => {
                let distance = "";
                let bearing = "";
                if (previous) {
                    distance = `${Avionics.Utils.computeGreatCircleDistance(previous.infos.coordinates, waypoint.infos.coordinates).toFixed(1)}<span class="units">NM</span>`;
                    bearing = `${Avionics.Utils.computeGreatCircleHeading(previous.infos.coordinates, waypoint.infos.coordinates).toFixed(0)}°`;
                }
                previous = waypoint;
                return `
                    <li class="selectable">
                        <span>${waypoint.ident}</span>
                        <span>${bearing}</span>
                        <span>${distance}</span>
                    </li>
                `
            }).join("");
            this.flightPlanElement.source.waypoints = sequence;
            this.map.centerOnCoordinates(sequence.map(waypoint => waypoint.infos.coordinates), 100);
        });
    }
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
        this.inputStackHandle.onPopped.subscribe(() => {
            this.onExit.fire();
        });
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle = this.inputStackHandle.pop();
        }
    }
    cancel() {
        this.onCancel.fire();
    }
    load() {
        this.onLoad.fire(this.model.getWaypoints());
    }
    activate() {
        this.elements.map.appendChild(this.map);
        this.map.flightPlanElements.push(this.flightPlanElement);
        this.map.showFlightPlan = false;
    }
    deactivate() {
        this.map.flightPlanElements.splice(this.map.flightPlanElements.findIndex(item => item == this.flightPlanElement), 1);
        this.map.showFlightPlan = true;
    }
}
customElements.define("g1000-airway-selector", WT_Airway_Selector_View);