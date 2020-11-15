class WT_MFD_Show_New_Waypoint_Handler extends WT_Show_New_Waypoint_Handler {
    /**
     * @param {HTMLElement} paneContainer
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {MapInstrument} map
     * @param {Input_Stack} inputStack
     * @param {WT_Waypoint_Selector_Model_Factory} waypointSelectorModelFactory
     * @param {WT_MFD_Waypoint_Selector_View_Factory} waypointSelectorViewFactory
     */
    constructor(paneContainer, waypointSelectorModelFactory, waypointSelectorViewFactory, map, inputStack) {
        super();
        this.paneContainer = paneContainer;
        this.waypointSelectorModelFactory = waypointSelectorModelFactory;
        this.waypointSelectorViewFactory = waypointSelectorViewFactory;
        this.map = map;
        this.inputStack = inputStack;
    }
    show(icaoType = null) {
        const model = this.waypointSelectorModelFactory.create(icaoType);
        const view = this.waypointSelectorViewFactory.create(this.map);
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