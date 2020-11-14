class WT_MFD_Show_New_Waypoint_Handler extends WT_Show_New_Waypoint_Handler {
    /**
     * @param {HTMLElement} paneContainer
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {MapInstrument} map
     * @param {WT_Icao_Input_Model} icaoInputModel
     * @param {Input_Stack} inputStack
     */
    constructor(paneContainer, softKeyMenuHandler, waypointRepository, map, icaoInputModel, inputStack) {
        super();
        this.paneContainer = paneContainer;
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.waypointRepository = waypointRepository;
        this.icaoInputModel = icaoInputModel;
        this.map = map;
        this.inputStack = inputStack;
    }
    show(icaoType = null) {
        const model = new WT_Waypoint_Selector_Model(icaoType, this.waypointRepository);
        const view = new WT_MFD_Waypoint_Selector_View(this.map, this.icaoInputModel, this.softKeyMenuHandler);
        this.paneContainer.appendChild(view);
        view.setModel(model);

        return new Promise((resolve, reject) => {
            const subscriptions = new Subscriptions();
            const onWaypointSelected = waypoint => {
                resolve(waypoint);
                view.exit();
            };
            const onCancel = () => {
                view.exit();
            };
            const onExit = () => {
                subscriptions.unsubscribe();
                this.paneContainer.removeChild(view);
                reject();
            };
            subscriptions.add(view.onWaypointSelected.subscribe(onWaypointSelected));
            subscriptions.add(view.onCancel.subscribe(onCancel));
            subscriptions.add(view.onExit.subscribe(onExit));

            view.enter(this.inputStack);
        });
    }
}