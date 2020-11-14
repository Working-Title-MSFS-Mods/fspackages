class WT_PFD_Menu_Push_Handler extends WT_Menu_Push_Handler {
    /**
     * @param {WT_PFD_Mini_Page_Controller} miniPageController 
     */
    constructor(miniPageController) {
        super();
        this.miniPageController = miniPageController;
    }
    push() {
        this.miniPageController.showSetupMenu();
    }
}