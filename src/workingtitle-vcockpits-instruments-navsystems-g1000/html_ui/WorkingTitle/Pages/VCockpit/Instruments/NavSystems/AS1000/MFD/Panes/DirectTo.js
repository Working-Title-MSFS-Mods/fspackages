class WT_MFD_Direct_To_View_Factory {
    /**
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     * @param {WT_Icao_Input_Model} icaoInputModel 
     * @param {WT_Show_Page_Menu_Handler} showPageMenuHandler 
     */
    constructor(softKeyMenuHandler, icaoInputModel, showPageMenuHandler) {
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.icaoInputModel = icaoInputModel;
        this.showPageMenuHandler = showPageMenuHandler;
    }
    /**
     * @param {MapInstrument} map
     */
    create(map) {
        return new WT_MFD_Direct_To_View(this.icaoInputModel, this.showPageMenuHandler, this.softKeyMenuHandler, map);
    }
}

class WT_MFD_Direct_To_View extends WT_Direct_To_View {
    /**
     * @param {WT_Icao_Input_Model} icaoInputModel 
     * @param {WT_Show_Page_Menu_Handler} showPageMenuHandler 
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     * @param {MapInstrument} map
     */
    constructor(icaoInputModel, showPageMenuHandler, softKeyMenuHandler, map) {
        super(icaoInputModel, showPageMenuHandler);
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.map = map;
    }
    connectedCallback() {
        super.connectedCallback();
        this.elements.mapContainer.appendChild(this.map);
    }
    centerOnCoordinates(coordinates) {
        this.map.setCenter(coordinates, 0);
    }
    /**
     * @param {WT_Direct_To_Model} model 
     */
    setModel(model) {
        super.setModel(model);
        this.model.waypoint.subscribe(waypoint => {
            if (waypoint) {
                this.centerOnCoordinates(waypoint.infos.coordinates);
            }
        });
    }
    enter(inputStack) {
        const mapHandler = inputStack.push(new WT_Map_Input_Layer(this.map, false));
        const r = super.enter(inputStack);
        this.inputStackHandler = mapHandler;
        this.menuHandler = this.softKeyMenuHandler.show(null);

        return r;
    }
    exit() {
        super.exit();
        this.menuHandler.pop();
    }
}
customElements.define("g1000-mfd-direct-to", WT_MFD_Direct_To_View);