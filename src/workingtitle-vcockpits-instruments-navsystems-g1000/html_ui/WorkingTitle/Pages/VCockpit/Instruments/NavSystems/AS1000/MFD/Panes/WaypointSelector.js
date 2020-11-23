class WT_MFD_Waypoint_Selector_View_Factory {
    /**
     * @param {WT_Waypoint_Input_Model} waypointInputModel
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler
     * @param {WT_Map_Input_Layer_Factory} mapInputLayerFactory
     */
    constructor(waypointInputModel, softKeyMenuHandler, mapInputLayerFactory) {
        this.waypointInputModel = waypointInputModel;
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.mapInputLayerFactory = mapInputLayerFactory;
    }
    /**
     * @param {MapInstrument} map 
     */
    create(map) {
        return new WT_MFD_Waypoint_Selector_View(map, this.waypointInputModel, this.softKeyMenuHandler, this.mapInputLayerFactory);
    }
}

class WT_MFD_Waypoint_Selector_View extends WT_Waypoint_Selector_View {
    /**
     * @param {MapInstrument} map 
     * @param {WT_Waypoint_Input_Model} waypointInputModel
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler
     * @param {WT_Map_Input_Layer_Factory} mapInputLayerFactory
     */
    constructor(map, waypointInputModel, softKeyMenuHandler, mapInputLayerFactory) {
        super(waypointInputModel);
        this.map = map;
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.mapInputLayerFactory = mapInputLayerFactory;
    }
    connectedCallback() {
        super.connectedCallback();
        this.elements.mapContainer.appendChild(this.map);
    }
    /**
     * @param {WT_Waypoint_Selector_Model} model 
     */
    setModel(model) {
        super.setModel(model);
        this.model.waypoint.subscribe(waypoint => {
            if (waypoint && waypoint.infos) {
                const infos = waypoint.infos;
                this.map.setCenter(infos.coordinates, 0);
            }
        });
    }
    /**
     * @param {Input_Stack} inputStack 
     */
    enter(inputStack) {
        const mapHandler = inputStack.push(this.mapInputLayerFactory.create(this.map, true));
        super.enter(inputStack);
        this.inputStackHandler = mapHandler;
        this.menuHandler = this.softKeyMenuHandler.show(null);
    }
    exit() {
        if (this.menuHandler) {
            this.menuHandler = this.menuHandler.pop();
        }
        super.exit();
    }
}
customElements.define("g1000-waypoint-selector-pane", WT_MFD_Waypoint_Selector_View);
