class WT_PFD_Show_Direct_To_Handler extends WT_Show_Direct_To_Handler {
    /**
     * @param {WT_PFD_Mini_Page_Controller} miniPageController 
     * @param {WT_Direct_To_Model} directToModel 
     * @param {WT_PFD_Direct_To_View} directToView 
     */
    constructor(miniPageController, directToModel, directToView) {
        super();
        this.miniPageController = miniPageController;
        this.directToModel = directToModel;
        this.directToView = directToView;
    }
    show(icaoType = null, icao = null) {
        const view = this.directToView;
        if (icao) {
            this.directToModel.setIcao(icao);
        }

        const subscriptions = new Subscriptions();
        const onCancel = () => {
            this.miniPageController.closePage(view);
        };
        const onExit = () => {
            subscriptions.unsubscribe();
        };
        subscriptions.add(view.onCancel.subscribe(onCancel));
        subscriptions.add(view.onExit.subscribe(onExit));

        this.miniPageController.showPage(view);
    }
}