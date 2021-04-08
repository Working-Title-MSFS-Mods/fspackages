class WT_PFD_Show_Confirm_Dialog_Handler {
    /**
     * @param {Input_Stack} inputStack
     * @param {HTMLElement} dialogContainer 
     */
    constructor(inputStack, dialogContainer) {
        this.inputStack = inputStack;
        this.dialogContainer = dialogContainer;
    }
    show(message) {
        const confirm = new WT_Confirm_Dialog();
        this.dialogContainer.appendChild(confirm);
        return confirm.show(message, this.inputStack).then((result) => {
            this.dialogContainer.removeChild(confirm);
            return result;
        }, (e) => {
            this.dialogContainer.removeChild(confirm);
            throw e;
        });
    }
}