class WT_Airport_Information_Model {
    /**
     * @param {WT_Show_Direct_To_Handler} showDirectToHandler
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {WT_Airport_Database} airportDatabase 
     */
    constructor(showDirectToHandler, waypointRepository, airportDatabase) {
        this.showDirectToHandler = showDirectToHandler;
        this.waypointRepository = waypointRepository;
        this.airportDatabase = airportDatabase;
        this.waypoint = new Subject(null);
    }
    async setIcao(icao) {
        this.waypoint.value = await this.waypointRepository.load(icao);
    }
    getCountry(ident) {
        let airport = this.airportDatabase.get(ident);
        if (airport) {
            return airport.country;
        }
        return null;
    }
    getTimezone(ident) {
        let airport = this.airportDatabase.get(ident);
        if (airport) {
            return Math.floor(airport.timezoneOffset / 3600 * 10) / 10;
        }
        return null;
    }
    directTo() {
        if (this.waypoint.value)
            this.showDirectToHandler.show(null, this.waypoint.value.icao);
    }
}

class WT_Airport_Information_Soft_Key_Menu extends WT_Soft_Key_Menu {
    constructor(view) {
        super(true);
        let buttons = {
            info: new WT_Soft_Key("", () => view.toggleInfoMode())
        }
        this.addSoftKey(4, new WT_Soft_Key("CHRT"));
        this.addSoftKey(5, buttons.info);
        this.addSoftKey(6, new WT_Soft_Key("DP"));
        this.addSoftKey(7, new WT_Soft_Key("STAR"));
        this.addSoftKey(8, new WT_Soft_Key("APR"));
        this.addSoftKey(9, new WT_Soft_Key("WX"));
        this.addSoftKey(10, new WT_Soft_Key("NOTAM"));

        view.infoMode.subscribe(mode => {
            buttons.info.text = `INFO-${mode}`;
            buttons.info.selected = true;
        });
    }
}

class WT_Airport_Information_Input_Layer extends Selectables_Input_Layer {
    /**
     * @param {WT_Airport_Information_Model} model 
     * @param {WT_Airport_Information_View} view 
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

class WT_Airport_Information_View extends WT_HTML_View {
    constructor(map, waypointQuickSelect, frequencyListModel, softKeyController) {
        super();
        this.map = map;
        this.waypointQuickSelect = waypointQuickSelect;
        this.frequencyListModel = frequencyListModel;
        this.softKeyController = softKeyController;

        this.infoMode = new Subject(1);
        this.softKeyMenu = new WT_Airport_Information_Soft_Key_Menu(this);

        this.subscriptions = new Subscriptions();
    }
    connectedCallback() {
        if (this.hasInitialised)
            return;
        this.hasInitialised = true;

        let template = document.getElementById('airport-information-page');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));
        super.connectedCallback();

        this.elements.frequencyList.setModel(this.frequencyListModel);
        this.elements.icaoInput.setQuickSelect(this.waypointQuickSelect);
        this.elements.icaoInput.addEventListener("change", e => this.model.setIcao(e.target.icao));
        this.elements.icaoInput.addEventListener("input", DOMUtilities.debounce(e => this.model.setIcao(e.target.icao), 500, false));
        this.elements.runwaySelector.selectedRunway.subscribe(runway => {
            if (runway) {
                let coordinates = [];
                coordinates.push(Avionics.Utils.bearingDistanceToCoordinates(runway.direction, (runway.length / 2) * 0.000539957, runway.latitude, runway.longitude));
                coordinates.push(Avionics.Utils.bearingDistanceToCoordinates((runway.direction + 180) % 360, (runway.length / 2) * 0.000539957, runway.latitude, runway.longitude));
                this.map.centerOnCoordinates(coordinates);
            }
        })

        this.infoMode.subscribe(mode => {
            this.setAttribute("mode", `Info-${mode}`);
        });

        this.elements.directoryInformation.addEventListener("focus", () => this.elements.directory.setAttribute("highlighted", ""));
        this.elements.directoryInformation.addEventListener("blur", () => this.elements.directory.removeAttribute("highlighted"));
    }
    /**
     * @param {WT_Airport_Information_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.inputLayer = new WT_Airport_Information_Input_Layer(this.model, this);
        this.subscriptions.add(model.waypoint.subscribe(airport => {
            if (airport) {
                let infos = airport.infos;
                let elevation = 0;
                let longest = 0;
                let longestDirection = 0;
                for (let runway of infos.runways) {
                    if (runway.length > longest) {
                        longestDirection = runway.direction;
                        longest = runway.length;
                    }
                    elevation = Math.max(elevation, runway.elevation);
                }

                this.elements.name.textContent = infos.name;
                this.elements.city.textContent = infos.city;
                this.elements.icon.applyInfo(infos); // This doesn't fully work because the tower status is broken when loaded in this manner
                this.elements.icon.angle = longestDirection;
                switch (infos.privateType) {
                    case 0:
                        this.elements.public.textContent = "Unknown";
                        break;
                    case 1:
                        this.elements.public.textContent = "Public";
                        break;
                    case 2:
                        this.elements.public.textContent = "Military";
                        break;
                    case 3:
                        this.elements.public.textContent = "Private";
                        break;
                }
                let country = this.model.getCountry(airport.ident);
                this.elements.country.textContent = country ? country : `____________`;
                this.elements.elevation.innerHTML = `${(elevation * 3.28084).toFixed(0)}<span class="units">FT</span>`;
                this.elements.runwaySelector.setFromWaypoint(airport);
                this.frequencyListModel.setFrequencies(infos.frequencies);
                let timezone = this.model.getTimezone(airport.ident);
                this.elements.timezone.textContent = timezone !== null ? `UTC${timezone >= 0 ? "+" : ""}${timezone}` : "Unknown Timezone";
            } else {
                this.elements.name.textContent = `____________`;
                this.elements.city.textContent = `____________`;
                this.elements.public.textContent = `________`
                this.elements.country.textContent = `____________`;
                this.elements.elevation.innerHTML = `_____<span class="units">FT</span>`;
                this.elements.timezone.textContent = `___`;
            }
        }));
    }
    toggleInfoMode() {
        this.infoMode.value = (this.infoMode.value % 2) + 1;
        this.inputLayer.refreshSelected();
    }
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle = this.inputStackHandle.pop();
        }
    }
    activate(inputStack, intent) {
        this.elements.map.appendChild(this.map);
        this.storedMenu = this.softKeyController.currentMenu;
        this.softKeyController.setMenu(this.softKeyMenu);

        if (intent) {
            this.model.setIcao(intent);
        }
    }
    deactivate() {
        if (this.storedMenu)
            this.softKeyController.setMenu(this.storedMenu);
        this.subscriptions.unsubscribe();
    }
}
customElements.define("g1000-airport-information-page", WT_Airport_Information_View);