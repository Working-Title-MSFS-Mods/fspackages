class WT_PFD_Show_New_Waypoint_Handler extends WT_Show_New_Waypoint_Handler {
    /**
     * @param {WT_PFD_Mini_Page_Controller} miniPageController
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {WT_Icao_Input_Model} icaoInputModel
     * @param {Input_Stack} inputStack
     */
    constructor(miniPageController, waypointRepository, icaoInputModel, inputStack) {
        super();
        this.miniPageController = miniPageController;
        this.waypointRepository = waypointRepository;
        this.icaoInputModel = icaoInputModel;
        this.inputStack = inputStack;
    }
    show(icaoType = null) {
        const model = new WT_Waypoint_Selector_Model(icaoType, this.waypointRepository);
        const view = new WT_PFD_Waypoint_Selector_View(this.icaoInputModel);
        view.classList.add("mini-page");
        this.miniPageController.appendChild(view);
        view.setModel(model);
        this.miniPageController.showPage(view);

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
                this.miniPageController.removeChild(view);
                reject();
            };
            subscriptions.add(view.onWaypointSelected.subscribe(onWaypointSelected));
            subscriptions.add(view.onCancel.subscribe(onCancel));
            subscriptions.add(view.onExit.subscribe(onExit));

            view.enter(this.inputStack);
        });
    }
}