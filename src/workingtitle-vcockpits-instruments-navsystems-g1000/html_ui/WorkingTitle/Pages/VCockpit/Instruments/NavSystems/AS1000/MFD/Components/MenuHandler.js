class WT_MFD_Soft_Key_Menu_Handler {
    /**
     * @param {WT_Soft_Key_Controller} softKeyController 
     */
    constructor(softKeyController) {
        this.softKeyController = softKeyController;
        this.stack = [];
        this.backKey = new WT_Soft_Key("BACK", () => this.pop());
    }
    /**
     * @param {WT_Soft_Key_Menu} menu 
     */
    show(menu) {
        const stackSize = this.stack.length;
        this.stack.push(menu);
        const handler = {
            pop: () => {
                this.pop(stackSize);
                return null;
            }
        }
        this.softKeyController.setMenu(menu);
        return handler;
    }
    goToMenu(menu) {
        this.show(menu);
    }
    pop(index = null) {
        if (index === null) {
            this.stack.pop();
        } else {
            while (this.stack.length > index) {
                this.stack.pop();
            }
        }
        if (this.stack.length > 0) {
            this.softKeyController.setMenu(this.stack[this.stack.length - 1]);
        } else {
            this.softKeyController.setMenu(null);
        }
    }
    back() {
        this.pop();
    }
    getBackButton() {
        return new WT_Soft_Key("BACK", () => this.pop());
    }
}