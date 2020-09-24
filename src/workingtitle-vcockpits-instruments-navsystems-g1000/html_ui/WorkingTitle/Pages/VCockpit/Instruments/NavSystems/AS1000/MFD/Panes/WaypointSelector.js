class AS1000_Waypoint_Selector_Model extends AS1000_Model {
    constructor() {
        super();

        this.waypoint = new Subject();
        this.bearing = new Subject();
        this.distance = new Subject();
    }
}

class Waypoint_Selector_Input_Layer extends Selectables_Input_Layer {
    constructor(view) {
        super(new Selectables_Input_Layer_Dynamic_Source(view, "icao-input"))
        this.view = view;
    }
    onCLR() {
        this.view.cancel();
    }
    onNavigationPush() {
        this.view.cancel();
    }
}

class AS1000_Waypoint_Selector_View extends AS1000_HTML_View {
    constructor() {
        super();

        this.inputLayer = new Waypoint_Selector_Input_Layer(this);
    }
    connectedCallback() {
        let template = document.getElementById('waypoint-selector-pane');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));

        super.connectedCallback();

        this.elements.icaoInput.addEventListener("change", (e) => this.icaoChanged(e.target.icao))
    }
    icaoChanged(icao) {
        this.exit();
        this.resolve(icao);
    }
    /**
     * @param {AS1000_Waypoint_Selector_Model} model 
     */
    setModel(model) {
        this.model = model;
    }
    enter(inputStack) {
        this.inputStackHandler = inputStack.push(this.inputLayer);
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    cancel() {
        this.reject();
        this.exit();
    }
    exit() {
        this.inputStackHandler.pop();
    }
}
customElements.define("g1000-waypoint-selector-pane", AS1000_Waypoint_Selector_View);
