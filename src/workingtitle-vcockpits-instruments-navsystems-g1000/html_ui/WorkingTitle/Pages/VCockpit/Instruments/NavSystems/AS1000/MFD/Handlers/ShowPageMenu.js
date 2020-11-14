class WT_MFD_Show_Page_Menu_Handler extends WT_Show_Page_Menu_Handler {
    /**
     * @param {Input_Stack} inputStack
     * @param {HTMLElement} container 
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     */
    constructor(inputStack, container, softKeyMenuHandler) {
        super();
        this.inputStack = inputStack;
        this.container = container;
        this.softKeyMenuHandler = softKeyMenuHandler;

        this.currentPageMenu = null;
    }
    show(model) {
        const view = new WT_Page_Menu_View();
        this.container.appendChild(view);
        view.setModel(model);
        view.enter(this.inputStack);
        const menuHandler = this.softKeyMenuHandler.show(null);
        this.currentPageMenu = view;
        const subscriptions = new Subscriptions();
        subscriptions.add(view.onExit.subscribe(() => {
            view.parentNode.removeChild(view);
            menuHandler.pop();
            this.currentPageMenu = null;
            subscriptions.unsubscribe();
        }));
    }
}