class WT_Map_Page_Menu extends WT_Page_Menu_Model {
    /**
     * @param {WT_Map_Model} model 
     */
    constructor(model) {
        super([
            new WT_Page_Menu_Option("Map Setup", () => model.showMapSetup()),
            new WT_Page_Menu_Option("Declutter", () => model.declutter()),
            new WT_Page_Menu_Option("Measure Bearing/Distance"),
            new WT_Page_Menu_Option("Show Chart"),
            new WT_Page_Menu_Option("Show Proile View"),
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

class WT_Map_Model extends WT_Model {
    /**
     * @param {WT_Show_Map_Setup_Handler} showMapSetupHandler 
     * @param {MapInstrument} mapElement 
     */
    constructor(showMapSetupHandler, mapElement) {
        super();
        this.showMapSetupHandler = showMapSetupHandler;
        this.mapElement = mapElement;
    }
    showMapSetup() {
        this.showMapSetupHandler.show();
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
     * @param {WT_Show_Page_Menu_Handler} pageMenuHandler 
     * @param {WT_Soft_Key_Controller} softKeyController 
     */
    constructor(pageMenuHandler, softKeyController) {
        super();
        this.pageMenuHandler = pageMenuHandler;
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

        this.menus = {
            main: new WT_Map_Main_Menu(model),
        }
        this.pageMenu = new WT_Map_Page_Menu(model);
    }
    showPageMenu() {
        this.pageMenuHandler.show(this.pageMenu);
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
        this.appendChild(this.model.mapElement);

        this.model.mapElement.setZoom(15);
        setTimeout(() => {
            try {
                if (this.model.mapElement.isInit()) {
                    this.model.mapElement.centerOnPlane();
                }
            } catch (e) {

            }
        }, 500); // This needs sorting out. centerOnPlane doesn't work before an initial update cycle
    }
    deactivate() {
        this.softKeyController.setMenu(this.storedMenu);
        if (this.inputStackHandle) {
            this.inputStackHandle = this.inputStackHandle.pop();
        }
    }
}
customElements.define("g1000-map-page", WT_Map_View);