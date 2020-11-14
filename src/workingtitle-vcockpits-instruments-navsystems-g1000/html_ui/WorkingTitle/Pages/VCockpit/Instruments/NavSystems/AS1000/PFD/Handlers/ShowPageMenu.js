class WT_PFD_Show_Page_Menu_Handler extends WT_Show_Page_Menu_Handler {
    /**
     * @param {Input_Stack} inputStack
     * @param {HTMLElement} pageContainer 
     */
    constructor(inputStack, pageContainer) {
        super();
        this.inputStack = inputStack;
        this.pageContainer = pageContainer;

        this.currentPageMenu = null;
    }
    show(model) {
        const view = new WT_Page_Menu_View();
        this.pageContainer.appendChild(view);
        view.setModel(model);
        view.enter(this.inputStack);
        const handler = {
            close: () => {
                view.parentNode.removeChild(view);
                this.currentPageMenu = null;
                handler.close = () => { };
            }
        };
        view.onExit.subscribe(handler.close);
        return handler;
    }
}