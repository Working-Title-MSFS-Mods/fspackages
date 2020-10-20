class WT_Map_Setup {
    constructor() {
        this.orientation = "north";
        this.autoZoom = "all on";

        this.trackVectorEnabled = true;
        this.trackVectorLength = 60;
        this.windVectorEnabled = true;
        this.navRangeRingEnabled = true;
        this.topographyEnabled = true;
        this.topographyMaxRange = 4000;
        this.fuelRingEnabled = true;
        this.fuelRingReserveTime = 45 * 60;
        this.fieldOfViewEnabled = true;
    }
}

class WT_Map_Setup_Model {
    /**
     * @param {WT_Map_Setup} setup 
     */
    constructor(setup) {
        this.setup = setup;

        this.groups = [
            {
                name: "Map",
                options: {
                    "Orientation": {
                        orientation: "drop-down"
                    }
                }
            }
        ]
    }
    setValue(key, value) {

    }
}

class WT_Map_Setup_Input_Layer extends Selectables_Input_Layer {
    constructor(view) {
        super(new Selectables_Input_Layer_Dynamic_Source(view));
        this.view = view;
    }
    onCLR() {
        this.view.exit();
    }
}

class WT_Map_Setup_View extends WT_HTML_View {
    constructor(softKeyController) {
        super();
        this.softKeyController = softKeyController;
        this.inputLayer = new WT_Map_Setup_Input_Layer(this);
        this.onExit = new WT_Event();
    }
    connectedCallback() {
        let template = document.getElementById('map-setup-pane');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));

        super.connectedCallback();

        DOMUtilities.AddScopedEventListener(this, ".options", "change", (e) => {
            this.model.setValue(e.target.dataset.setting, e.target.value);
            this.model.save();
        });
    }
    /**
     * @param {WT_Map_Setup_Model} model 
     */
    setModel(model) {

    }
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle = this.inputStackHandle.pop();
        }
        this.onExit.fire();
    }
    activate() {
        this.storedMenu = this.softKeyController.currentMenu;
        this.softKeyController.setMenu(null);
    }
    deactivate() {
        this.softKeyController.setMenu(this.storedMenu);
    }
}
customElements.define("g1000-map-setup-pane", WT_Map_Setup_View);