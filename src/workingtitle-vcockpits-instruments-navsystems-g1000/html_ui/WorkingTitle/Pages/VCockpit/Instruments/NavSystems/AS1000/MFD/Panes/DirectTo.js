class WT_MFD_Direct_To_View_Factory {
    /**
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     * @param {WT_Waypoint_Input_Model} waypointInputModel 
     * @param {WT_Show_Page_Menu_Handler} showPageMenuHandler 
     * @param {WT_Map_Input_Layer_Factory} mapInputLayerFactory
     */
    constructor(softKeyMenuHandler, waypointInputModel, showPageMenuHandler, mapInputLayerFactory) {
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.waypointInputModel = waypointInputModel;
        this.showPageMenuHandler = showPageMenuHandler;
        this.mapInputLayerFactory = mapInputLayerFactory;
    }
    /**
     * @param {MapInstrument} map
     */
    create(map) {
        return new WT_MFD_Direct_To_View(this.waypointInputModel, this.showPageMenuHandler, this.softKeyMenuHandler, map, this.mapInputLayerFactory.create(map, false));
    }
}

class WT_MFD_Direct_To_View extends WT_Direct_To_View {
    /**
     * @param {WT_Waypoint_Input_Model} waypointInputModel 
     * @param {WT_Show_Page_Menu_Handler} showPageMenuHandler 
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     * @param {MapInstrument} map
     * @param {WT_Map_Input_Layer} mapInputLayer
     */
    constructor(waypointInputModel, showPageMenuHandler, softKeyMenuHandler, map, mapInputLayer) {
        super(waypointInputModel, showPageMenuHandler);
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.map = map;
        this.mapInputLayer = mapInputLayer;
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
        const mapHandler = inputStack.push(this.mapInputLayer);
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