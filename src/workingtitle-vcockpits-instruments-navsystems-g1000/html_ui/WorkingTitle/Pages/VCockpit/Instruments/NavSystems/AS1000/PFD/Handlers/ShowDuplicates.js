class WT_PFD_Show_Duplicates_Handler extends WT_Show_Duplicates_Handler {
    /**
     * @param {WT_PFD_Mini_Page_Controller} miniPageController 
     * @param {WT_Waypoint_Repository} waypointRepository 
     * @param {Input_Stack} inputStack 
     */
    constructor(miniPageController, waypointRepository, inputStack) {
        super();
        this.miniPageController = miniPageController;
        this.waypointRepository = waypointRepository;
        this.inputStack = inputStack;
    }
    show(duplicates) {
        const model = new WT_Duplicate_Waypoints_Model(this.waypointRepository, duplicates);
        const view = new WT_PFD_Duplicate_Waypoints_View();
        view.classList.add("mini-page");
        this.miniPageController.appendChild(view);
        view.setModel(model);

        const close = () => {
            this.miniPageController.removeChild(view);
            this.miniPageController.closePage();
        }
        return {
            promise: this.miniPageController.showPage(view)
                .catch(e => close())
                .then(icao => {
                    close();
                    return icao;
                }),
            cancel: close,
        }
    }
}