class WT_MFD_Show_Direct_To_Handler extends WT_Show_Direct_To_Handler {
    /**
     * @param {HTMLElement} paneContainer
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {MapInstrument} map
     * @param {WT_Icao_Input_Model} icaoInputModel
     * @param {Input_Stack} inputStack
     * @param {WT_Direct_To_Handler} directToHandler
     * @param {WT_Show_Page_Menu_Handler} showPageMenuHandler
     */
    constructor(paneContainer, softKeyMenuHandler, waypointRepository, map, icaoInputModel, inputStack, directToHandler, showPageMenuHandler) {
        super();
        this.paneContainer = paneContainer;
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.waypointRepository = waypointRepository;
        this.icaoInputModel = icaoInputModel;
        this.map = map;
        this.inputStack = inputStack;
        this.directToHandler = directToHandler;
        this.showPageMenuHandler = showPageMenuHandler;
    }
    show(icaoType = null, icao = null) {
        //TODO: Fix reverting flight plan
        let model = new WT_Direct_To_Model(this, icaoType, this.waypointRepository, this.directToHandler);
        if (icao) {
            model.setIcao(icao);
        }
        let view = new WT_MFD_Direct_To_View(this.softKeyMenuHandler, this.map, this.icaoInputModel, this.showPageMenuHandler);
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