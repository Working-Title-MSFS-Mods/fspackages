class WT_Waypoint_Input_Model {
    /**
     * @param {WT_Icao_Input_Model} icaoInputModel 
     * @param {WT_Waypoint_Repository} waypointRepository 
     */
    constructor(icaoInputModel, waypointRepository) {
        this.icaoInputModel = icaoInputModel;
        this.waypointRepository = waypointRepository;
    }
}

class WT_Waypoint_Input extends WT_HTML_View {
    constructor() {
        super();
        this.waypoint = new Subject(null);
    }
    get value() {
        return this.waypoint.value;
    }
    set value(waypoint) {
        this.waypoint.value = waypoint;
        this.elements.icao.icao = waypoint.icao;
    }
    fireChangeEvent() {
        const evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", true, true);
        this.dispatchEvent(evt);
    }
    fireInputEvent() {
        const evt = document.createEvent("HTMLEvents");
        evt.initEvent("input", true, true);
        this.dispatchEvent(evt);
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        this.innerHTML = `
            <icao-input data-element="icao" characters="5" ${this.hasAttribute("type") ? `type="${this.getAttribute("type")}"` : ``}></icao-input>
            <div class="icon" data-element="icon"><airport-icon data-element="airportIcon"></airport-icon></div>
            <div class="country" data-element="country"></div>
            <div class="name" data-element="name"></div>
            <div class="city" data-element="city"></div>
        `;
        super.connectedCallback();

        const f = DOMUtilities.debounce(icao => this.updateIcao(icao), 500, false);
        this.elements.icao.addEventListener("input", e => {
            e.cancelBubble = true;
            f(e.target.icao);
        });
        this.elements.icao.addEventListener("change", async e => {
            e.cancelBubble = true;
            await this.updateIcao(e.target.icao);
            this.fireChangeEvent();
        });
    }
    /**
     * @param {WT_Waypoint_Input_Model} model 
     */
    setModel(model) {
        this.model = model;
        console.log(typeof this.elements.icao);
        this.elements.icao.setModel(model.icaoInputModel);
        this.waypoint.subscribe(waypoint => {
            const hasValue = (value) => {
                return value && value != ""
            };
            this.elements.name.textContent = (waypoint && hasValue(waypoint.infos.name)) ? waypoint.infos.name : "____________";
            this.elements.city.textContent = (waypoint && hasValue(waypoint.infos.city)) ? waypoint.infos.city : "____________";
            this.elements.country.textContent = (waypoint && hasValue(waypoint.infos.region)) ? waypoint.infos.region : "____________";

            this.setAttribute("waypoint-type", waypoint ? waypoint.icao[0] : "");
            if (waypoint && waypoint.icao[0] == "A") {
                this.elements.airportIcon.applyInfo(waypoint.infos)
            }
        });
    }
    async updateIcao(icao) {
        console.log(`ICAO: ${icao}`);
        if (icao && icao != "") {
            this.waypoint.value = await this.model.waypointRepository.load(icao);
            this.fireInputEvent();
        }
    }
}
customElements.define("g1000-waypoint-input", WT_Waypoint_Input);