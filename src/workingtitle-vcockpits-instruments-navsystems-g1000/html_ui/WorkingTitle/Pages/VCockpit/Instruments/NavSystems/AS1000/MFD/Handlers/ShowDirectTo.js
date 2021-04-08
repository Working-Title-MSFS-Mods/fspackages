class WT_MFD_Show_Direct_To_Handler extends WT_Show_Direct_To_Handler {
    /**
     * @param {HTMLElement} paneContainer
     * @param {WT_Direct_To_Model_Factory} modelFactory
     * @param {WT_MFD_Direct_To_View_Factory} viewFactory
     * @param {MapInstrument} map
     * @param {Input_Stack} inputStack
     */
    constructor(paneContainer, modelFactory, viewFactory, map, inputStack) {
        super();
        this.paneContainer = paneContainer;
        this.modelFactory = modelFactory;
        this.viewFactory = viewFactory;
        this.map = map;
        this.inputStack = inputStack;
    }
    show(icaoType = null, waypoint = null) {
        //TODO: Fix reverting flight plan
        let model = this.modelFactory.create(icaoType);
        if (waypoint) {
            model.setWaypoint(waypoint);
        }
        let view = this.viewFactory.create(this.map);
        this.paneContainer.appendChild(view);
        view.setModel(model);

        const subscriptions = new Subscriptions();
        const onCancel = () => {
            view.exit();
        };
        const onExit = () => {
            subscriptions.unsubscribe();
            this.paneContainer.removeChild(view);
        };
        subscriptions.add(view.onCancel.subscribe(onCancel));
        subscriptions.add(view.onExit.subscribe(onExit));

        view.enter(this.inputStack);
    }
}