class WT_Map_Page_Menu extends WT_Page_Menu_Model {
    /**
     * @param {WT_Map_Model} model 
     */
    constructor(model) {
        let nullFunc = () => { };
        super([
            new WT_Page_Menu_Option("Map Setup", () => model.showMapSetup()),
            new WT_Page_Menu_Option("Declutter", () => model.declutter()),
            new WT_Page_Menu_Option("Measure Bearing/Distance", nullFunc),
            new WT_Page_Menu_Option("Show Chart", nullFunc),
            new WT_Page_Menu_Option("Show Proile View", nullFunc),
        ])
    }
}

class WT_Map_Main_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_Map_Model} model 
     */
    constructor(model) {
        super(true);
        let dcltr = new WT_Soft_Key("DCLTR", () => model.incrementDeclutterLevel());
        this.addSoftKey(10, dcltr);
        this.addSoftKey(11, new WT_Soft_Key("SHW CHRT"));
    }
}

class WT_Map_Map_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_Map_Model} model 
     */
    constructor(model) {
        super();
    }
}

class WT_Map_Model extends WT_Model {
    constructor(gps, mapElement) {
        super();
        this.gps = gps;
        this.mapElement = mapElement;
    }
    showMapSetup() {
        this.gps.showMapSetup();
    }
}

class WT_Map_Page_Input_Layer extends Input_Layer {
    constructor(view) {
        super();
        this.view = view;
    }
    onMenuPush() {
        this.view.showPageMenu();
    }
}

class WT_Map_View extends WT_HTML_View {
    /**
     * 
     * @param {AS1000_MFD} gps 
     * @param {WT_Soft_Key_Controller} softKeyController 
     */
    constructor(gps, softKeyController) {
        super();
        this.gps = gps;
        this.softKeyController = softKeyController;
        this.inputLayer = new WT_Map_Page_Input_Layer(this);

        //this.airspaceList = new NearestAirspaceList(gps);
    }
    connectedCallback() {
        super.connectedCallback();
    }
    /**
     * @param {WT_Map_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.appendChild(this.model.mapElement);
        /*if (this.model.mapElement.isInit())
            this.model.mapElement.centerOnPlane();*/

        this.menus = {
            main: new WT_Map_Main_Menu(model),
            map: new WT_Map_Map_Menu(model),
        }
        this.pageMenu = new WT_Map_Page_Menu(model);
    }
    showPageMenu() {
        this.gps.showPageMenu(this.pageMenu);
    }
    update(dt) {
        /*this.airspaceList.Update(10, 1000);
        for (let airspace of this.airspaceList.airspaces) {
            console.log(`Name: ${airspace.name}`);
            console.log(`Geometry: ${airspace.geometry}`);
        }*/
    }
    enter(inputStack) {
    }
    exit() {
    }
    activate(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
        this.storedMenu = this.softKeyController.currentMenu;
        this.softKeyController.setMenu(this.menus.main);
    }
    deactivate() {
        this.softKeyController.setMenu(this.storedMenu);
        if (this.inputStackHandle) {
            this.inputStackHandle = this.inputStackHandle.pop();
        }
    }
}
customElements.define("g1000-map-page", WT_Map_View);