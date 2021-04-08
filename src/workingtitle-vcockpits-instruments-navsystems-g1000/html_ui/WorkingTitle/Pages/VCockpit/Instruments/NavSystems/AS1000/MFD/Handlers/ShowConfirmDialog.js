class WT_Show_Confirm_Dialog_Handler {
    /**
     * @param {Input_Stack} inputStack
     * @param {HTMLElement} dialogContainer 
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     */
    constructor(inputStack, dialogContainer, softKeyMenuHandler) {
        this.inputStack = inputStack;
        this.dialogContainer = dialogContainer;
        this.softKeyMenuHandler = softKeyMenuHandler;
    }
    show(message) {
        const menuHandler = this.softKeyMenuHandler.show(null);
        const confirm = new WT_Confirm_Dialog();
        this.dialogContainer.appendChild(confirm);
        return confirm.show(message, this.inputStack).then((result) => {
            this.dialogContainer.removeChild(confirm);
            menuHandler.pop();
            return result;
        }, (e) => {
            this.dialogContainer.removeChild(confirm);
            menuHandler.pop();
            throw e;
        });
    }
}