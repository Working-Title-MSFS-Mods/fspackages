class WT_Airport_Information_Model {
    /**
     * @param {WT_Show_Direct_To_Handler} showDirectToHandler
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {WT_Airport_Database} airportDatabase 
     * @param {WT_Metar_Repository} metarRepository 
     */
    constructor(showDirectToHandler, waypointRepository, airportDatabase, metarRepository) {
        this.showDirectToHandler = showDirectToHandler;
        this.waypointRepository = waypointRepository;
        this.airportDatabase = airportDatabase;
        this.metarRepository = metarRepository;
        this.waypoint = new Subject(null);
        this.metar = new Subject(null);
    }
    setIcao(icao) {

    }
    async setWaypoint(waypoint) {
        this.waypoint.value = waypoint;
        try {
            this.metar.value = this.metarRepository.get(this.waypoint.value.ident);
        } catch (e) {
            this.metar.value = null;
        }
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
    /**
     * @param {WT_Airport_Information_View} view 
     */
    constructor(view) {
        super(true);
        let buttons = {
            info: new WT_Soft_Key("", () => view.toggleInfoMode()),
            wx: new WT_Soft_Key("WX", () => view.toggleWxMode())
        }
        this.addSoftKey(4, new WT_Soft_Key("CHRT"));
        this.addSoftKey(5, buttons.info);
        this.addSoftKey(6, new WT_Soft_Key("DP"));
        this.addSoftKey(7, new WT_Soft_Key("STAR"));
        this.addSoftKey(8, new WT_Soft_Key("APR"));
        this.addSoftKey(9, buttons.wx);
        this.addSoftKey(10, new WT_Soft_Key("NOTAM"));

        view.viewMode.subscribe(mode => {
            buttons.wx.selected = mode == "WX";
            buttons.info.text = mode == "Info-2" ? "INFO-2" : "INFO-1";
            buttons.info.selected = mode == "Info-2" || mode == "Info-1";
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
    /**
     * @param {MapInstrument} map 
     * @param {WT_Waypoint_Input_Model} waypointInputModel 
     * @param {WT_Frequency_List_Model} frequencyListModel 
     * @param {WT_MFD_Menu_Handler} menuHandler 
     */
    constructor(map, waypointInputModel, frequencyListModel, menuHandler) {
        super();
        this.map = map;
        this.waypointInputModel = waypointInputModel;
        this.frequencyListModel = frequencyListModel;
        this.menuHandler = menuHandler;

        this.viewMode = new Subject("Info-1");
        this.softKeyMenu = new WT_Airport_Information_Soft_Key_Menu(this);

        this.subscriptions = new Subscriptions();
    }
    connectedCallback() {
        try {
            if (this.hasInitialised)
                return;
            this.hasInitialised = true;

            let template = document.getElementById('airport-information-page');
            let templateContent = template.content;

            this.appendChild(templateContent.cloneNode(true));
            super.connectedCallback();

            this.elements.frequencyList.setModel(this.frequencyListModel);
            this.elements.waypointInput.setModel(this.waypointInputModel);
            this.elements.runwaySelector.selectedRunway.subscribe(runway => {
                if (runway) {
                    let coordinates = [];
                    coordinates.push(Avionics.Utils.bearingDistanceToCoordinates(runway.direction, (runway.length / 2) * 0.000539957, runway.latitude, runway.longitude));
                    coordinates.push(Avionics.Utils.bearingDistanceToCoordinates((runway.direction + 180) % 360, (runway.length / 2) * 0.000539957, runway.latitude, runway.longitude));
                    this.map.centerOnCoordinates(coordinates);
                }
            })

            this.viewMode.subscribe(mode => {
                this.setAttribute("mode", mode);
            });

            this.elements.directoryInformation.addEventListener("focus", () => this.elements.directory.setAttribute("highlighted", ""));
            this.elements.directoryInformation.addEventListener("blur", () => this.elements.directory.removeAttribute("highlighted"));
        } catch (e) {
            console.error(e.message);
        }
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
                const elevation = Math.max(...infos.runways.map(runway => runway.elevation));

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
                this.elements.public.textContent = `________`
                this.elements.country.textContent = `____________`;
                this.elements.elevation.innerHTML = `_____<span class="units">FT</span>`;
                this.elements.timezone.textContent = `___`;
            }
        }));

        this.subscriptions.add(model.metar.subscribe(metar => {
            if (metar == null) {
                this.elements.metar.innerHTML = "None";
                return;
            }

            const lines = [];
            const metarData = metar.getMetar();
            lines.push(`<b>Time:</b> ${metarData.time}`);
            lines.push(`<b>Wind:</b> ${metarData.wind.direction} @ ${metarData.wind.speed}kts`);
            lines.push(`<b>Visiblity:</b> ${metarData.visibility}`);
            lines.push(`<b>Clouds:</b> ${metarData.clouds.map(cloud => {
                return `${cloud.meaning.toUpperCase()}${cloud.altitude ? ` at ${cloud.altitude}ft` : ``}`
            }).join(", ")}`)
            this.elements.metar.innerHTML = lines.join("<br/>");
        }));
    }
    updateWaypoint(waypoint) {
        this.model.setWaypoint(waypoint);
    }
    toggleInfoMode() {
        this.viewMode.value = this.viewMode.value == "Info-1" ? "Info-2" : "Info-1";
        this.inputLayer.refreshSelected();
    }
    toggleWxMode() {
        this.viewMode.value = "WX";
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
        this.softKeyMenuHandler = this.menuHandler.show(this.softKeyMenu);

        if (intent) {
            this.model.setIcao(intent);
        }
    }
    deactivate() {
        if (this.softKeyMenuHandler)
            this.softKeyMenuHandler = this.softKeyMenuHandler.pop();
        //this.subscriptions.unsubscribe();
    }
}
customElements.define("g1000-airport-information-page", WT_Airport_Information_View);