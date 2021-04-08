class WT_Nearest_Waypoints_Input_Layer extends Selectables_Input_Layer {
    /**
     * @param {WT_Nearest_Airports_Model} model 
     * @param {*} view 
     */
    constructor(model, view) {
        super(new Selectables_Input_Layer_Dynamic_Source(view, ".ident"), true);
        this.model = model;
        this.view = view;
    }
    onDirectTo() {
        if (this.selectedElement)
            this.model.directTo(this.selectedElement.parentNode.dataset.icao);
    }
}

class WT_Nearest_Airports_View extends WT_HTML_View {
    /**
     * @param {WT_Frequency_List_Model} frequencyListModel 
     * @param {WT_Unit_Chooser} unitChooser 
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     * @param {WT_Show_Procedure_Handler} showProcedureHandler 
     * @param {WT_Plane_State} planeState 
     */
    constructor(frequencyListModel, unitChooser, softKeyMenuHandler, showProcedureHandler, planeState) {
        super();
        this.frequencyListModel = frequencyListModel;
        this.unitChooser = unitChooser;
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.showProcedureHandler = showProcedureHandler;
        this.planeState = planeState;

        this.inputStackHandle = null;

        this.menu = this.initMenu();

        this.flightPlanElement = new SvgFlightPlanElement();
        this.flightPlanElement.source = new WT_Flight_Plan_Waypoints();
        this.flightPlanElement.flightPlanIndex = WT_Flight_Plan_Waypoints.index++;
        this.flightPlanElement.setAsDashed(true);

        this.selectedMenu = new Subject("APT");

        this.selectedMenu.subscribe(menu => {
            this.menuButtons.APT.selected = menu == "APT";
            this.menuButtons.RNWY.selected = menu == "RNWY";
            this.menuButtons.FREQ.selected = menu == "FREQ";
            this.menuButtons.APR.selected = menu == "APR";
        });

        this.subscriptions = new Subscriptions();
    }
    initMenu() {
        let menu = new WT_Soft_Key_Menu(true);
        this.menuButtons = {
            APT: new WT_Soft_Key("APT", this.browseAirports.bind(this)),
            RNWY: new WT_Soft_Key("RNWY", this.browseRunways.bind(this)),
            FREQ: new WT_Soft_Key("FREQ", this.browseFrequencies.bind(this)),
            APR: new WT_Soft_Key("APR", this.browseApproaches.bind(this)),
        };
        menu.addSoftKey(5, this.menuButtons.APT);
        menu.addSoftKey(6, this.menuButtons.RNWY);
        menu.addSoftKey(7, this.menuButtons.FREQ);
        menu.addSoftKey(8, this.menuButtons.APR);
        return menu;
    }
    popInput() {
        this.elements.frequencyList.exit();
        this.elements.runwaySelector.exit();
        if (this.inputStackHandle) {
            this.inputStackHandle = this.inputStackHandle.pop();
        }
    }
    browseAirports() {
        this.popInput();
        this.selectedMenu.value = "APT";
        this.inputStackHandle = this.inputStack.push(this.airportsInputLayer);
    }
    browseRunways() {
        this.popInput();
        this.selectedMenu.value = "RNWY";
        this.elements.runwaySelector.enter(this.inputStack);
    }
    browseFrequencies() {
        this.popInput();
        this.selectedMenu.value = "FREQ";
        this.elements.frequencyList.enter(this.inputStack);
    }
    browseApproaches() {
        this.popInput();
        this.selectedMenu.value = "APR";
        this.inputStackHandle = this.inputStack.push(this.approachesInputLayer);
    }
    connectedCallback() {
        if (this.hasInitialised)
            return;
        this.hasInitialised = true;

        let template = document.getElementById('nearest-airports-page');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();

        this.elements.frequencyList.setModel(this.frequencyListModel);
        this.elements.waypointList.setUnitChooser(this.unitChooser);
        this.elements.waypointList.onClickWaypoint.subscribe(waypoint => {
            this.model.showWaypointInfo(waypoint);
        });
    }
    /**
     * @param {WT_Nearest_Airports_Model} model 
     */
    setModel(model) {
        this.model = model;
        model.airports.subscribe(this.updateAirports.bind(this));
        this.map = this.model.mapInstrument;

        this.elements.waypointList.selectedIcao.subscribe(icao => {
            if (icao !== null)
                this.model.setSelectedAirport(icao);
        });

        this.airportsInputLayer = new WT_Nearest_Waypoints_Input_Layer(this.model, this.elements.waypointList);
        this.approachesInputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this.elements.approachList));
    }
    updateSelectedAirport(airport) {
        if (airport == null)
            return;
        let infos = airport.GetInfos();
        if (infos && infos.icao != "" && infos.getWaypointType() == "A" && infos.IsUpToDate()) {
            this.elements.facilityName.textContent = infos.name;
            this.elements.city.textContent = infos.city;
            this.elements.elevation.innerHTML = `${infos.runways.reduce((elevation, runway) => { return Math.max(elevation, runway.elevation * 3.28084); }, 0).toFixed(0)}<span class="units">FT</span>`;
            this.elements.runwaySelector.setFromWaypoint(airport)
            this.frequencyListModel.setFrequencies(infos.frequencies);
            if (infos.approaches) {
                let elems = [];
                for (let i = 0; i < infos.approaches.length; i++) {
                    elems.push(`<li class="element selectable" data-approach="${i}" data-click="showApproach"><span class="name">${infos.ident}-${infos.approaches[i].name}</span></li>`);
                }
                this.elements.approachList.innerHTML = elems.join("");
            }
        }
    }
    showApproach(element) {
        const approachIndex = element.dataset.approach;
        this.showProcedureHandler.showApproaches(this.model.selectedAirport.value.icao, approachIndex);
    }
    updateAirports(airports) {
        this.elements.waypointList.setWaypoints(airports);
    }
    update(dt) {
        if (this.model)
            this.model.update(dt);
    }
    exit() {
        this.popInput();
    }
    enter(inputStack) {
        this.browseAirports();
    }
    activate(inputStack) {
        this.elements.map.appendChild(this.map);
        this.inputStack = inputStack;
        this.menuHandler = this.softKeyMenuHandler.show(this.menu);
        this.map.flightPlanElements.push(this.flightPlanElement);
        this.map.showFlightPlan = false;

        this.subscriptions.add(
            rxjs.combineLatest(
                this.model.selectedAirport.observable,
                this.planeState.coordinates
            ).subscribe(([airport, coordinates]) => {
                if (!airport)
                    return;
                this.flightPlanElement.source.waypoints = [{
                    ident: "",
                    infos: {
                        coordinates: new LatLongAlt(coordinates.lat, coordinates.long, 0)
                    }
                }, airport];
            })
        );

        this.subscriptions.add(
            rxjs.combineLatest(
                this.model.selectedAirport.observable,
                this.planeState.getLowResCoordinates(5)
            ).subscribe(([airport, coordinates]) => {
                if (!airport)
                    return;
                this.map.centerOnCoordinate(coordinates, [airport.infos.coordinates], 50);
            })
        );

        this.subscriptions.add(
            this.model.selectedAirport.observable.subscribe(this.updateSelectedAirport.bind(this))
        );
    }
    deactivate() {
        if (this.menuHandler) {
            this.menuHandler = this.menuHandler.pop();
        }
        this.map.flightPlanElements.splice(this.map.flightPlanElements.findIndex(item => item == this.flightPlanElement), 1);
        this.map.showFlightPlan = true;
        this.subscriptions.unsubscribe();
    }
}
customElements.define("g1000-nearest-airports-page", WT_Nearest_Airports_View);