class WT_PFD_Menu_Handler {
    /**
     * @param {WT_Soft_Key_Controller} softKeyController 
     * @param {WT_PFD_Alert_Key} alertsKey 
     */
    constructor(softKeyController, alertsKey) {
        this.softKeyController = softKeyController;
        this.alertsKey = alertsKey;

        this.stack = [];
        this.backKey = new WT_Soft_Key("BACK", this.back.bind(this));
    }
    goToMenu(menu) {
        this.softKeyController.setMenu(menu);
        this.stack.push(menu);
    }
    back() {
        this.stack.pop();
        const menu = this.stack[this.stack.length - 1];
        if (menu) {
            this.softKeyController.setMenu(menu);
        }
    }
}
