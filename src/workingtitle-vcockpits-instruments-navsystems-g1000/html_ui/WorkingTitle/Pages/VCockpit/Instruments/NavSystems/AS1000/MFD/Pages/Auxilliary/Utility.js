class WT_Utility_Page_Model extends WT_Model {
    /**
     * @param {WT_Plane_Statistics} planeStatistics 
     */
    constructor(planeStatistics) {
        super();
        this.planeStatistics = planeStatistics;
    }
}

class WT_Utility_Page_View extends WT_HTML_View {
    constructor() {
        super();
        this.subscriptions = new Subscriptions();
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        const template = document.getElementById('template-utility-page');
        this.appendChild(template.content.cloneNode(true));

        super.connectedCallback();
    }
    /**
     * @param {WT_Utility_Page_Model} model 
     */
    setModel(model) {
        this.model = model;
    }
    activate() {
        this.subscriptions.add(this.model.planeStatistics.odometer.subscribe(value => {
            this.elements.odometer.innerHTML = `${value.toFixed(1)}<span class="units">NM</span>`;
        }));
        this.subscriptions.add(this.model.planeStatistics.tripOdometer.subscribe(value => {
            this.elements.tripOdometer.innerHTML = `${value.toFixed(1)}<span class="units">NM</span>`;
        }));
        this.subscriptions.add(this.model.planeStatistics.maximumGroundSpeed.subscribe(value => {
            this.elements.maximumGroundSpeed.innerHTML = `${(value * 0.539957).toFixed(0)}<span class="units">KT</span>`;
        }));
        this.subscriptions.add(this.model.planeStatistics.averageGroundSpeed.subscribe(value => {
            this.elements.averageGroundSpeed.innerHTML = `${(value * 0.539957).toFixed(1)}<span class="units">KT</span>`;
        }));
    }
    deactivate() {
        this.subscriptions.unsubscribe();
    }
}
customElements.define("g1000-utility", WT_Utility_Page_View);